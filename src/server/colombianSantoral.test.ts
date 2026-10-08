import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchColombianSantoral, parsePublisherSaint, selectOrdoDay } from './colombianSantoral.ts';
import { hasFreshSaintVerification, publisherUrl } from '../data/colombianSaints.ts';

function page(date: string, name: string) {
  return `<ul data-url="${publisherUrl(date)}"></ul><div class="journal-pp-info">
    <ul><li>Feria</li><li>Verde</li><li><strong>${name}</strong></li></ul></div>
    <p>Texto editorial que no se importa.</p>`;
}

test('solo extrae el nombre del encabezado de la fecha solicitada', () => {
  assert.equal(parsePublisherSaint(page('2025-10-08', 'Santa Pelagia'), '2025-10-08'), 'Santa Pelagia');
  assert.equal(parsePublisherSaint(page('2025-10-08', 'Santa Pelagia'), '2026-10-08'), null);
  assert.equal(parsePublisherSaint('<p><strong>Un santo en otro bloque</strong></p>', '2026-10-10'), null);
  assert.equal(parsePublisherSaint(page('2025-10-09', 'San Luis Bertr&aacute;n'), '2025-10-09'), 'San Luis Bertrán');
});

test('el Ordo conserva todas las alternativas, sin asumir la selección editorial del misal', () => {
  const result = selectOrdoDay('2026-10-09', [
    { fecha: '2026-10-09', preludio: '<p>San Luis Bertrán; Santos Dionisio y compañeros</p>', celebracion: 'Feria o Memoria libre', colores_dia: 'Verde o Blanco o Rojo' },
    { fecha: '2026-10-09', preludio: '<p>San Juan Leonardi</p>', celebracion: 'Memoria libre', colores_dia: 'Blanco' },
    { fecha: '2026-10-10', preludio: '<p>Otro santo</p>', celebracion: 'Memoria', colores_dia: 'Blanco' },
  ]);
  assert.equal(result.saintVerification.status, 'ordo');
  assert.match(result.saint.name, /Bertrán.*Dionisio.*Leonardi/);
  assert.ok(!result.saint.name.includes('Otro santo'));
});

test('una feria o un año no publicado no se rellena con un santo de reserva', () => {
  const feria = selectOrdoDay('2026-10-08', [
    { fecha: '2026-10-08', preludio: null, celebracion: 'Feria', colores_dia: 'Verde' },
  ]);
  assert.equal(feria.saintVerification.status, 'ordo');
  assert.match(feria.saint.name, /pendiente/);
  assert.equal(selectOrdoDay('2035-10-08', []).saintVerification.status, 'pending');
});

test('la selección web del misal prevalece sobre las opciones del Ordo', async (t) => {
  t.mock.method(globalThis, 'fetch', async (input) => {
    const url = String(input);
    return url.includes('sanpablo.co')
      ? new Response(page('2025-10-08', 'Santa Pelagia'))
      : new Response(JSON.stringify({ data: [
        { fecha: '2025-10-08', preludio: '<p>Otro santo</p>', celebracion: 'Memoria libre', colores_dia: 'Blanco' },
      ] }));
  });
  const result = await fetchColombianSantoral('2025-10-08');
  assert.equal(result.saint.name, 'Santa Pelagia');
  assert.equal(result.saintVerification.status, 'publisher');
  assert.equal(result.saintVerification.method, 'web');
  assert.equal(result.saintVerification.sourceUrl, publisherUrl('2025-10-08'));
  assert.ok(hasFreshSaintVerification(result.saintVerification, '2025-10-08'));
  assert.ok(!hasFreshSaintVerification(result.saintVerification, '2025-10-09'));
  assert.ok(!hasFreshSaintVerification({ ...result.saintVerification, checkedAt: '2020-01-01' }, '2025-10-08'));
});

test('una fecha fuera de la cobertura no se declara verificada cuando el editor devuelve una página vacía', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Sin publicación</html>'));
  const result = await fetchColombianSantoral('2035-10-08');
  assert.equal(result.saintVerification.status, 'pending');
  assert.match(result.saint.name, /pendiente/);
});
