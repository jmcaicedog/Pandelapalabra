import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SharedReflections, type ReflectionStore } from './sharedReflections.ts';

function store(): ReflectionStore {
  const saved = new Map<string, { owner: string; reflection?: string }>();
  return {
    async claim(date, owner) {
      const data = saved.get(date);
      if (data?.reflection) return { status: 'ready', reflection: data.reflection };
      if (data) return { status: 'busy' };
      saved.set(date, { owner });
      return { status: 'acquired' };
    },
    async complete(date, owner, reflection) {
      assert.equal(saved.get(date)?.owner, owner);
      saved.set(date, { owner, reflection });
    },
    async fail(date, owner) {
      assert.equal(saved.get(date)?.owner, owner);
      saved.delete(date);
    },
  };
}

test('visitantes concurrentes y reinicios leen la misma reflexión sin regenerarla', async () => {
  const persistent = store();
  const service = new SharedReflections(persistent);
  let calls = 0;
  const generate = async () => { calls++; return 'Reflexión común completa.'; };
  const results = await Promise.all(Array.from({ length: 30 }, () => service.get('2026-10-07', generate)));
  assert.equal(calls, 1);
  assert.ok(results.every(r => r === results[0]));
  assert.equal(await new SharedReflections(persistent).get('2026-10-07', generate), results[0]);
  assert.equal(calls, 1);
});

test('la reserva persistente evita generación simultánea entre servidores', async () => {
  const persistent = store();
  let finish!: (text: string) => void;
  const first = new SharedReflections(persistent).get('2026-10-08', () => new Promise(resolve => { finish = resolve; }));
  await new Promise(resolve => setImmediate(resolve));
  let duplicate = false;
  await assert.rejects(new SharedReflections(persistent).get('2026-10-08', async () => {
    duplicate = true; return 'Duplicada';
  }));
  assert.equal(duplicate, false);
  finish('Reflexión compartida.');
  assert.equal(await first, 'Reflexión compartida.');
});

test('un fallo o texto vacío no se guarda como reflexión válida y permite reintento', async () => {
  const service = new SharedReflections(store());
  await assert.rejects(service.get('2026-10-09', async () => { throw new Error('Sin cuota'); }));
  await assert.rejects(service.get('2026-10-09', async () => ''));
  assert.equal(await service.get('2026-10-09', async () => 'Recuperada'), 'Recuperada');
});

test('se guardan los metadatos del modelo efectivo sin regenerar contenido previo', async t => {
  const persistent = store();
  const complete = t.mock.method(persistent, 'complete');
  const generated = {
    reflection: 'Reflexión breve.', model: 'gemini-3.1-flash-lite',
    promptVersion: 'gospel-four-paragraphs-v2',
  };
  const service = new SharedReflections(persistent);
  assert.equal(await service.get('2026-10-10', async () => generated), generated.reflection);
  assert.equal(complete.mock.calls[0].arguments[3]?.model, generated.model);
  assert.equal(complete.mock.calls[0].arguments[3]?.promptVersion, generated.promptVersion);
  assert.equal(await new SharedReflections(persistent).get('2026-10-10', async () => {
    throw new Error('No debe regenerarse');
  }), generated.reflection);
});
