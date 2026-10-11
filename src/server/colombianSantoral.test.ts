import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { fetchColombianSantoral } from './colombianSantoral.ts';
import { EDITORIAL_SANTORAL_VERSION, getEditorialSaint, hasFreshSaintVerification, hasSaintBiography } from '../data/colombianSaints.ts';
import { SaintSource } from '../components/SaintSource.tsx';
import editorial from '../data/colombianEditorialSaints.json' with { type: 'json' };

test('el santoral recurrente cubre todos los días, incluidos bisiestos y años futuros', () => {
  assert.equal(Object.keys(editorial.entries).length, 366);
  for (const year of [2026, 2027, 2028, 2100, 2400]) {
    const cursor = new Date(Date.UTC(year, 0, 1));
    let days = 0;
    while (cursor.getUTCFullYear() === year) {
      const date = cursor.toISOString().slice(0, 10);
      const result = getEditorialSaint(date);
      assert.ok(result.saint.name.trim());
      assert.equal(result.saintVerification.date, date);
      assert.equal(result.saintVerification.status, 'editorial');
      assert.ok(result.saintVerification.sourceReference);
      assert.ok(result.saintVerification.review);
      assert.ok(hasFreshSaintVerification(result.saintVerification, date));
      days++;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    assert.equal(days, year === 2028 || year === 2400 ? 366 : 365);
  }
  assert.throws(() => getEditorialSaint('2026-02-29'));
});

test('Pelagia y Luis Bertrán se resuelven localmente, sin consultas externas', async (t) => {
  const network = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('La selección editorial no debe consultar la red.');
  });
  for (const year of [2026, 2027, 2035]) {
    const pelagia = await fetchColombianSantoral(`${year}-10-08`);
    assert.equal(pelagia.saint.name, 'Santa Pelagia de Antioquía');
    assert.match(pelagia.saint.fullBio, /Nono/);
    const luis = await fetchColombianSantoral(`${year}-10-09`);
    assert.equal(luis.saint.name, 'San Luis Bertrán');
    assert.match(luis.saint.fullBio, /1526/);
  }
  assert.equal(network.mock.calls.length, 0);
});

test('las biografías de hoy y mañana tienen fuente explícita', () => {
  const today = getEditorialSaint('2026-10-10');
  const tomorrow = getEditorialSaint('2026-10-11');
  assert.equal(today.saint.name, 'San Daniel el Estilita');
  assert.match(today.saint.fullBio, /Constantinopla/);
  assert.equal(today.saintVerification.biographySourceName, 'Catholic.net');
  assert.match(today.saintVerification.biographySourceUrl || '', /^https:\/\/es\.catholic\.net\//);
  assert.equal(tomorrow.saint.name, 'San Juan XXIII');
  assert.match(tomorrow.saint.fullBio, /Concilio Vaticano II/);
  assert.equal(tomorrow.saintVerification.biographySourceName, 'Santa Sede');
  assert.match(tomorrow.saintVerification.biographySourceUrl || '', /^https:\/\/www\.vatican\.va\//);
  const markup = renderToStaticMarkup(createElement(SaintSource, {
    verification: tomorrow.saintVerification,
  }));
  assert.match(markup, /Biografía: Santa Sede/);
  assert.doesNotMatch(markup, /pendiente de confirmar/i);
});

test('los nombres editoriales con variantes conservan la biografía local', () => {
  const result = getEditorialSaint('2028-01-02');
  assert.equal(result.saint.name, 'Santos Basilio Magno y Gregorio de Nacianzo');
  assert.match(result.saint.fullBio, /Basilio/);
  assert.doesNotMatch(result.saint.fullBio, /Todavía no hay/);
});

test('la revisión queda interna y cambiar de versión invalida la selección anterior', () => {
  const result = getEditorialSaint('2026-10-08');
  assert.equal(result.saintVerification.version, EDITORIAL_SANTORAL_VERSION);
  assert.equal(renderToStaticMarkup(createElement(SaintSource, { verification: result.saintVerification })), '');
  assert.ok(!hasFreshSaintVerification({ ...result.saintVerification, version: 'old' }, '2026-10-08'));
  assert.ok(!hasFreshSaintVerification(result.saintVerification, '2026-10-09'));
});

test('consulta biografías por identidad para fechas arbitrarias y conserva la selección', async () => {
  const dates = Object.keys(editorial.entries)
    .filter(day => !hasSaintBiography(getEditorialSaint(`2028-${day}`))).slice(0, 3);
  assert.equal(dates.length, 3);
  for (const day of dates) {
    for (const year of [2028, 2035]) {
      const date = `${year}-${day}`;
      const selected = getEditorialSaint(date);
      const result = await fetchColombianSantoral(date, async name => {
        assert.equal(name, selected.saint.name);
        return {
          fullBio: `${name}. ${'Resumen con hechos respaldados por las fuentes consultadas. '.repeat(5)}`,
          sources: [{ url: 'https://www.vatican.va/biografia', title: 'Santa Sede' }],
          checkedAt: '2026-10-11T01:00:00Z',
        };
      });
      assert.equal(result.saint.name, selected.saint.name);
      assert.equal(result.saintVerification.date, date);
      assert.equal(result.saintVerification.biographyMethod, 'grounded');
      assert.ok(hasSaintBiography(result));
      const markup = renderToStaticMarkup(createElement(SaintSource, { verification: result.saintVerification }));
      assert.match(markup, /Síntesis con búsqueda/);
      assert.match(markup, /https:\/\/www.vatican.va\/biografia/);
    }
  }
});

test('un fallo de consulta se muestra explícitamente con reintento', async () => {
  const day = Object.keys(editorial.entries)
    .find(day => !hasSaintBiography(getEditorialSaint(`2028-${day}`)))!;
  const result = await fetchColombianSantoral(`2028-${day}`, async () => { throw new Error('Sin fuentes'); });
  assert.ok(!hasSaintBiography(result));
  const markup = renderToStaticMarkup(createElement(SaintSource, {
    verification: result.saintVerification, onRetry: () => {},
  }));
  assert.match(markup, /No se pudo obtener una biografía con fuentes/);
  assert.match(markup, /Reintentar biografía/);
});
