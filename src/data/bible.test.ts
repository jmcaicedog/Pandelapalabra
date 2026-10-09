import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATHOLIC_BOOKS, fetchChaptersForBook, fetchVersesForChapter, searchBible } from './bible.ts';

test('el catálogo completo produce capítulos válidos sin depender de la red', async () => {
  assert.equal(CATHOLIC_BOOKS.length, 73);
  for (const book of CATHOLIC_BOOKS) {
    const chapters = await fetchChaptersForBook(book.id);
    assert.equal(chapters.length, book.capitulosTotales);
    assert.equal(chapters[0].numero, 1);
    assert.equal(chapters.at(-1)!.numero, book.capitulosTotales);
  }
  await assert.rejects(fetchChaptersForBook(0));
  await assert.rejects(fetchVersesForChapter(47099));
});

test('errores bíblicos no se convierten en versículos ficticios ni búsquedas vacías', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Sin conexión'); });
  await assert.rejects(fetchVersesForChapter(47001));
  await assert.rejects(searchBible('misericordia'));
  assert.deepEqual(await searchBible('a'), []);
});

test('se validan los textos externos y se conserva el último versículo', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    data: { verses: [{ number: 1, text: 'Inicio' }, { number: 2, text: 'Último versículo completo.' }] },
  })));
  const verses = await fetchVersesForChapter(47001);
  assert.equal(verses.at(-1)!.texto, 'Último versículo completo.');
  t.mock.restoreAll();
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    data: { verses: [{ number: 0, text: 'No es un versículo' }] },
  })));
  await assert.rejects(fetchVersesForChapter(47002));
});
