import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCanonicalDay } from './canonicalLectionary.ts';
import { cleanSaintText, mapEvangelizoDay } from './evangelizo.ts';
import { fetchLiturgicalDay, getLiturgicalDay, withCurrentSaint } from './liturgy.ts';
import { EDITORIAL_SANTORAL_VERSION, getEditorialSaint } from './colombianSaints.ts';

function officialFixture(date: string) {
  return {
    date,
    liturgic_title: 'Viernes de la 27a semana del Tiempo Ordinario',
    saints: [
      { name: '### San John Henry Newman', order1: 1, bio: '<p>Biografía completa.</p>' },
      { name: 'San Luís Beltrán', order1: 2, bio: '<p>Otra biografía.</p>' },
    ],
    readings: [
      { type: 'reading', reference_displayed: '3,7-14.', book: { full_title: 'Carta de San Pablo a los Gálatas' }, text: 'Primera lectura completa.' },
      { type: 'psalm', reference_displayed: '111(110),1-2.', book: { code: 'Ps' }, text: 'Primera estrofa.\n\nÚltima estrofa.', chorus: 'Respuesta.' },
      { type: 'reading', reference_displayed: '2,1-5.', book: { full_title: 'Carta I de San Pablo a los Corintios' }, text: 'Segunda lectura completa.' },
      { type: 'gospel', reference_displayed: '11,15-26.', book: { full_title: 'Evangelio según San Lucas' }, text: 'Evangelio completo hasta el último versículo.' },
    ],
  };
}

function researchedDay(date: string) {
  const day = buildCanonicalDay(date);
  day.saint = { ...day.saint, fullBio: `${day.saint.name}. ${'Resumen respaldado con fuentes. '.repeat(10)}` };
  day.saintVerification = {
    ...getEditorialSaint(date).saintVerification,
    biographyMethod: 'grounded',
    biographyCheckedAt: '2026-10-11T01:00:00Z',
    biographySources: [{ url: 'https://www.vatican.va/biografia', title: 'Santa Sede' }],
  };
  return day;
}

test('conserva biografías con fuentes y descarta identidades o versiones distintas', () => {
  const day = researchedDay('2040-01-03');
  assert.equal(withCurrentSaint(day).saint.fullBio, day.saint.fullBio);
  assert.deepEqual(withCurrentSaint(day).saintVerification?.biographySources,
    day.saintVerification?.biographySources);
  assert.notEqual(withCurrentSaint({ ...day, saint: { ...day.saint, name: 'Otro santo' } }).saint.fullBio,
    day.saint.fullBio);
  assert.notEqual(withCurrentSaint({ ...day, saintVerification: { ...day.saintVerification!,
    version: 'old' } }).saint.fullBio, day.saint.fullBio);
});

test('persiste biografías sin lecturas y las reutiliza en otro año sin perderlas por fallos de red', async t => {
  const entries = new Map<string, string>();
  const descriptors = new Map(['window', 'localStorage'].map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => entries.get(key) || null,
    setItem: (key: string, value: string) => entries.set(key, value),
  } });
  const day = researchedDay('2041-01-03');
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(day)));
  const first = await fetchLiturgicalDay(day.date);
  assert.ok(first.readingsPending);
  assert.equal(first.saint.fullBio, day.saint.fullBio);
  assert.ok([...entries.keys()].some(key => key.startsWith('panvivo_saint_v1_')));
  assert.ok(![...entries.keys()].some(key => key.startsWith('panvivo_liturgy_v6_')));
  const nextYear = getLiturgicalDay('2042-01-03');
  assert.equal(nextYear.saint.fullBio, day.saint.fullBio);
  assert.equal(nextYear.saintVerification?.date, '2042-01-03');
  t.mock.restoreAll();
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    if (String(input).startsWith('/api/')) throw new Error('Sin conexión al servidor');
    return new Response(JSON.stringify({ data: officialFixture('2042-01-03') }));
  });
  const recovered = await fetchLiturgicalDay('2042-01-03');
  assert.equal(recovered.saint.fullBio, day.saint.fullBio);
  assert.equal(recovered.source, 'evangelizo');
});

test('el santoral editorial recurrente no depende del año ni del orden de Evangelizo', () => {
  for (const year of [2026, 2027, 2030, 2100]) {
    for (const day of ['08', '09']) {
      const date = `${year}-10-${day}`;
      assert.match(mapEvangelizoDay(date, officialFixture(date))!.saint.name, /pendiente/);
      assert.equal(buildCanonicalDay(date).saint.name, day === '08' ? 'Santa Pelagia de Antioquía' : 'San Luis Bertrán');
    }
    assert.match(mapEvangelizoDay('2030-10-08', officialFixture('2030-10-08'))!.saint.name, /pendiente/);
  }
});

test('se conservan todos los párrafos, estrofas y el último versículo de textos largos', () => {
  const fixture = officialFixture('2026-10-09');
  const completeText = `${'Párrafo de la lectura.\r\n'.repeat(600)}Último versículo completo.`;
  for (const reading of fixture.readings) reading.text = `[[Lc 11,15]]${completeText}`;
  const day = mapEvangelizoDay(fixture.date, fixture);
  assert.ok(day);
  for (const text of [day.firstReading.text, day.secondReading?.text, day.psalm.verses.join('\n\n'), day.gospel.text]) {
    assert.equal(text, completeText.replace(/\r\n/g, '\n'));
    assert.ok(text.length > 10000);
    assert.ok(text.endsWith('Último versículo completo.'));
  }
});

test('no se seleccionan santos de Evangelizo y se limpian encabezados Markdown y HTML', () => {
  const fixture = officialFixture('2026-10-10');
  const fullBio = `${'Párrafo biográfico. '.repeat(300)}Final de la biografía.`;
  fixture.saints = [{ name: '### San John Henry Newman', order1: 1, bio: `<p>### Vida y testimonio</p><p>${fullBio}</p>` }];
  const day = mapEvangelizoDay(fixture.date, fixture);
  assert.ok(day);
  assert.match(day.saint.name, /pendiente de confirmar/);
  assert.ok(!day.saint.fullBio.includes(fullBio));
  assert.equal(cleanSaintText('<p>### **San Luís Beltr&aacute;n**</p>'), 'San Luís Beltrán');
});

test('una lectura vacía no se acepta ni se guarda como oficial', () => {
  const fixture = officialFixture('2026-10-09');
  fixture.readings[3].text = '[[Lc 11,15]]';
  assert.equal(mapEvangelizoDay(fixture.date, fixture), null);
});

test('el respaldo no presenta resúmenes del evangelio como textos íntegros', () => {
  for (const date of ['2026-09-10', '2026-10-08', '2026-10-09', '2026-10-11', '2030-03-15']) {
    const day = getLiturgicalDay(date);
    assert.equal(day.readingsPending, true);
    assert.ok(day.gospel.text.includes('No se han podido cargar las lecturas completas'));
    assert.ok(!day.gospel.text.includes('...'));
  }
});

test('un fallo de red muestra indisponibilidad y permite reintentar', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Sin conexión');
  });
  const pending = await fetchLiturgicalDay('2028-10-09');
  assert.equal(pending.readingsPending, true);
  assert.equal(pending.saint.name, 'San Luis Bertrán');

  t.mock.restoreAll();
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    data: officialFixture('2028-10-09'),
  })));
  const recovered = await fetchLiturgicalDay('2028-10-09');
  assert.equal(recovered.source, 'evangelizo');
  assert.ok(!recovered.readingsPending);
  assert.equal(recovered.gospel.text, 'Evangelio completo hasta el último versículo.');
});

test('el caché oficial anterior conserva lecturas y sustituye el santo con la base editorial', (t) => {
  const date = '2026-10-09';
  const official = mapEvangelizoDay(date, officialFixture(date));
  assert.ok(official);
  official.saint.name = '### San John Henry Newman';
  official.color = 'green';
  delete official.saintVerification;
  const stored = JSON.stringify(official);
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => key === `panvivo_liturgy_v3_${date}` ? stored : null },
  });
  const cached = getLiturgicalDay(date);
  assert.equal(cached.source, 'evangelizo');
  assert.equal(cached.saint.name, 'San Luis Bertrán');
  assert.equal(cached.color, 'green');
  assert.equal(cached.gospel.text, official.gospel.text);
});

test('se rechazan respuestas de otra fecha o sin salmo', () => {
  const fixture = officialFixture('2026-10-09');
  assert.equal(mapEvangelizoDay('2026-10-08', fixture), null);
  fixture.readings = fixture.readings.filter(r => r.type !== 'psalm');
  assert.equal(mapEvangelizoDay(fixture.date, fixture), null);
});

test('la caché vigente reemplaza selecciones y versiones antiguas incluso sin red', (t) => {
  const date = '2031-10-10';
  const official = mapEvangelizoDay(date, officialFixture(date));
  assert.ok(official);
  official.saint.name = 'Santo de una selección anterior';
  official.saintVerification = {
    date, status: 'editorial', checkedAt: new Date().toISOString(),
    version: 'old', sourceReference: 'Base anterior', review: 'Pendiente',
  };
  const descriptors = new Map(['window', 'localStorage'].map(key =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => key === `panvivo_liturgy_v6_${date}` ? JSON.stringify(official) : null },
  });
  const day = getLiturgicalDay(date);
  assert.notEqual(day.saint.name, official.saint.name);
  assert.equal(day.saintVerification?.version, EDITORIAL_SANTORAL_VERSION);
  assert.deepEqual(day.gospel, official.gospel);
});

test('las lecturas oficiales se reutilizan con el santoral editorial sin consultar al editor', async (t) => {
  const date = '2032-10-09';
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    data: officialFixture(date),
  })));
  const first = await fetchLiturgicalDay(date);
  assert.equal(first.source, 'evangelizo');
  assert.equal(first.saint.name, 'San Luis Bertrán');
  assert.equal(first.saintVerification?.version, EDITORIAL_SANTORAL_VERSION);
  t.mock.restoreAll();
  const api = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('La caché vigente no debe consultar fuentes externas.');
  });
  const updated = await fetchLiturgicalDay(date);
  assert.equal(updated.saint.name, 'San Luis Bertrán');
  assert.equal(updated.saintVerification?.status, 'editorial');
  assert.equal(updated.gospel.text, first.gospel.text);
  assert.equal(api.mock.calls.length, 0);
});

test('el santo editorial no cambia las lecturas, celebración ni color litúrgico', async (t) => {
  const date = '2029-10-08';
  const official = mapEvangelizoDay(date, officialFixture(date));
  assert.ok(official);
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(official)));
  const result = await fetchLiturgicalDay(date);
  assert.equal(result.saint.name, 'Santa Pelagia de Antioquía');
  for (const key of ['title', 'color', 'colorName', 'season', 'firstReading', 'psalm', 'gospel'] as const) {
    assert.deepEqual(result[key], official[key]);
  }
});
