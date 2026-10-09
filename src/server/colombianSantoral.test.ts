import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { fetchColombianSantoral } from './colombianSantoral.ts';
import { EDITORIAL_SANTORAL_VERSION, getEditorialSaint, hasFreshSaintVerification } from '../data/colombianSaints.ts';
import { SaintSource } from '../components/SaintSource.tsx';
import editorial from '../data/colombianEditorialSaints.json';

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

test('la revisión queda interna y cambiar de versión invalida la selección anterior', () => {
  const result = getEditorialSaint('2026-10-08');
  assert.equal(result.saintVerification.version, EDITORIAL_SANTORAL_VERSION);
  assert.equal(renderToStaticMarkup(createElement(SaintSource, { verification: result.saintVerification })), '');
  assert.ok(!hasFreshSaintVerification({ ...result.saintVerification, version: 'old' }, '2026-10-08'));
  assert.ok(!hasFreshSaintVerification(result.saintVerification, '2026-10-09'));
});
