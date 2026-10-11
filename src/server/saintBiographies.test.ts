import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GenerateContentResponse, FinishReason } from '@google/genai';
import { SaintBiographies, readGroundedBiography, researchBiography, type BiographyStore, type ResearchedBiography } from './saintBiographies.ts';

const name = 'San Testigo de Prueba';
const biography: ResearchedBiography = {
  fullBio: `${name}. ${'Resumen original respaldado por fuentes consultadas. '.repeat(5)}`,
  sources: [{ url: 'https://www.vatican.va/biografia', title: 'Santa Sede' }],
  checkedAt: '2026-10-11T01:00:00Z',
};

function groundedResponse() {
  const response = new GenerateContentResponse();
  response.candidates = [{
    finishReason: FinishReason.STOP,
    content: { parts: [{ text: `${biography.fullBio}\nTexto sin respaldo que no debe guardarse.` }] },
    groundingMetadata: {
      webSearchQueries: [name],
      groundingChunks: [{ web: { uri: biography.sources[0].url, title: biography.sources[0].title } }],
      groundingSupports: [{ segment: { text: biography.fullBio }, groundingChunkIndices: [0] }],
    },
  }];
  return response;
}

test('solo conserva texto respaldado por citas de búsqueda', () => {
  const result = readGroundedBiography(name, groundedResponse());
  assert.equal(result.fullBio, biography.fullBio.trim());
  assert.deepEqual(result.sources, biography.sources);
  assert.ok(Number.isFinite(Date.parse(result.checkedAt)));
});

test('rechaza respuestas incompletas, sin búsqueda, sin citas, URLs inseguras y otras identidades', () => {
  for (const mutate of [
    (r: GenerateContentResponse) => { r.candidates![0].finishReason = FinishReason.MAX_TOKENS; },
    (r: GenerateContentResponse) => { r.candidates![0].groundingMetadata!.webSearchQueries = []; },
    (r: GenerateContentResponse) => { r.candidates![0].groundingMetadata!.groundingSupports = []; },
    (r: GenerateContentResponse) => {
      r.candidates![0].groundingMetadata!.groundingChunks![0].web!.uri = 'https://www.vatican.va.evil.example/';
    },
    (r: GenerateContentResponse) => {
      r.candidates![0].groundingMetadata!.groundingSupports![0].segment!.text = 'Texto inventado fuera de la respuesta.';
    },
  ]) {
    const response = groundedResponse();
    mutate(response);
    assert.throws(() => readGroundedBiography(name, response));
  }
  assert.throws(() => readGroundedBiography('Otro santo', groundedResponse()), /identidad/);
});

function sharedStore(): BiographyStore {
  const ready = new Map<string, ResearchedBiography>();
  const owners = new Map<string, string>();
  return {
    async claim(key, owner) {
      const saved = ready.get(key);
      if (saved) return { status: 'ready', biography: saved };
      if (owners.has(key)) return { status: 'busy' };
      owners.set(key, owner);
      return { status: 'acquired' };
    },
    async complete(key, owner, value) {
      assert.equal(owners.get(key), owner);
      ready.set(key, value);
      owners.delete(key);
    },
    async fail(key, owner) {
      if (owners.get(key) === owner) owners.delete(key);
    },
  };
}

test('reutiliza la biografía persistida entre instancias y sin caducidad de consulta', async () => {
  const store = sharedStore();
  let calls = 0;
  const research = async () => { calls++; return biography; };
  const first = new SaintBiographies(store, research);
  assert.deepEqual(await first.get(name), biography);
  assert.deepEqual(await first.get(name), biography);
  const restarted = new SaintBiographies(store, research);
  assert.deepEqual(await restarted.get(name.toUpperCase()), biography);
  assert.equal(calls, 1);
});

test('deduplica peticiones locales y bloquea otra instancia durante la generación', async () => {
  const store = sharedStore();
  let release!: (value: ResearchedBiography) => void;
  let started!: () => void;
  const entered = new Promise<void>(resolve => { started = resolve; });
  let calls = 0;
  const research = () => {
    calls++;
    started();
    return new Promise<ResearchedBiography>(resolve => { release = resolve; });
  };
  const first = new SaintBiographies(store, research);
  const request = first.get(name);
  const duplicate = first.get(name);
  await entered;
  await assert.rejects(new SaintBiographies(store, research).get(name), /preparación/);
  release(biography);
  assert.deepEqual(await request, biography);
  assert.deepEqual(await duplicate, biography);
  assert.equal(calls, 1);
});

test('un fallo al guardar no devuelve éxito ni deja una biografía en memoria', async () => {
  const store = sharedStore();
  let failures = 0;
  store.complete = async () => { throw new Error('No se pudo guardar'); };
  store.fail = async () => { failures++; };
  const service = new SaintBiographies(store, async () => biography);
  await assert.rejects(service.get(name), /guardar/);
  await assert.rejects(service.get(name), /guardar/);
  assert.equal(failures, 1);
});

test('una biografía persistida de otra identidad no se reutiliza ni se regenera silenciosamente', async () => {
  let calls = 0;
  const store = sharedStore();
  store.claim = async () => ({ status: 'ready', biography });
  await assert.rejects(new SaintBiographies(store, async () => {
    calls++;
    return biography;
  }).get('Otro santo'), /identidad/);
  assert.equal(calls, 0);
});

test('un modelo retirado usa una alternativa y guarda el modelo real, pero la cuota no se reintenta', async t => {
  const oldKey = process.env.GEMINI_API_KEY;
  const oldModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = 'test-only';
  process.env.GEMINI_MODEL = 'retired-model';
  t.after(() => {
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = oldModel;
  });
  const calls: string[] = [];
  const result = await researchBiography(name, {
    async generateContent(params) {
      calls.push(params.model);
      if (params.model === 'retired-model') throw Object.assign(new Error('Not found'), { status: 404 });
      return groundedResponse();
    },
  });
  assert.deepEqual(calls, ['retired-model', 'gemini-3.8-flash']);
  assert.equal(result.model, 'gemini-3.8-flash');
  let quotaCalls = 0;
  await assert.rejects(researchBiography(name, {
    async generateContent() {
      quotaCalls++;
      throw Object.assign(new Error('Quota'), { status: 429 });
    },
  }), /Quota/);
  assert.equal(quotaCalls, 1);
});
