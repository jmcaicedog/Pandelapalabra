import { readStoredJson, writeStorage } from '../lib/storage.ts';
import { withAbortTimeout } from '../lib/asyncUtils.ts';

export interface BibleBook {
  id: number;
  nombre: string;
  abrev: string;
  testamento: 'AT' | 'NT';
  categoria: string;
  capitulosTotales: number;
}

export interface BibleChapter {
  id: number;
  libro_id: number;
  numero: number;
}

export interface BibleVerse {
  id: number;
  capitulo_id: number;
  numero: number;
  texto: string;
}

// 73 Catholic Bible books catalog (Biblia Católica de Jerusalén)
export const CATHOLIC_BOOKS: BibleBook[] = [
  // --- NUEVO TESTAMENTO (27 libros) ---
  // Evangelios
  { id: 47, nombre: 'Mateo', abrev: 'Mt', testamento: 'NT', categoria: 'Evangelios', capitulosTotales: 28 },
  { id: 48, nombre: 'Marcos', abrev: 'Mc', testamento: 'NT', categoria: 'Evangelios', capitulosTotales: 16 },
  { id: 49, nombre: 'Lucas', abrev: 'Lc', testamento: 'NT', categoria: 'Evangelios', capitulosTotales: 24 },
  { id: 50, nombre: 'Juan', abrev: 'Jn', testamento: 'NT', categoria: 'Evangelios', capitulosTotales: 21 },
  // Historia
  { id: 51, nombre: 'Hechos', abrev: 'Hch', testamento: 'NT', categoria: 'Historia', capitulosTotales: 28 },
  // Epístolas Paulinas
  { id: 52, nombre: 'Romanos', abrev: 'Rm', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 16 },
  { id: 53, nombre: '1 Corintios', abrev: '1 Co', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 16 },
  { id: 54, nombre: '2 Corintios', abrev: '2 Co', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 13 },
  { id: 55, nombre: 'Gálatas', abrev: 'Ga', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 6 },
  { id: 56, nombre: 'Efesios', abrev: 'Ef', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 6 },
  { id: 57, nombre: 'Filipenses', abrev: 'Flp', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 4 },
  { id: 58, nombre: 'Colosenses', abrev: 'Col', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 4 },
  { id: 59, nombre: '1 Tesalonicenses', abrev: '1 Ts', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 5 },
  { id: 60, nombre: '2 Tesalonicenses', abrev: '2 Ts', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 3 },
  { id: 61, nombre: '1 Timoteo', abrev: '1 Tm', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 6 },
  { id: 62, nombre: '2 Timoteo', abrev: '2 Tm', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 4 },
  { id: 63, nombre: 'Tito', abrev: 'Tit', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 3 },
  { id: 64, nombre: 'Filemón', abrev: 'Flm', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 1 },
  { id: 65, nombre: 'Hebreos', abrev: 'Hb', testamento: 'NT', categoria: 'Epístolas Paulinas', capitulosTotales: 13 },
  // Cartas Católicas
  { id: 66, nombre: 'Santiago', abrev: 'Stgo', testamento: 'NT', categoria: 'Cartas Católicas', capitulosTotales: 5 },
  { id: 67, nombre: '1 Pedro', abrev: '1 P', testamento: 'NT', categoria: 'Cartas Católicas', capitulosTotales: 5 },
  { id: 68, nombre: '2 Pedro', abrev: '2 P', testamento: 'NT', categoria: 'Cartas Católicas', capitulosTotales: 3 },
  { id: 69, nombre: '1 Juan', abrev: '1 Jn', testamento: 'NT', categoria: 'Cartas Católicas', capitulosTotales: 5 },
  { id: 70, nombre: '2 Juan', abrev: '2 Jn', testamento: 'NT', categoria: 'Cartas Católicas', capitulosTotales: 1 },
  { id: 71, nombre: '3 Juan', abrev: '3 Jn', testamento: 'NT', categoria: 'Cartas Católicas', capitulosTotales: 1 },
  { id: 72, nombre: 'Judas', abrev: 'Jud', testamento: 'NT', categoria: 'Cartas Católicas', capitulosTotales: 1 },
  // Profecía
  { id: 73, nombre: 'Apocalipsis', abrev: 'Ap', testamento: 'NT', categoria: 'Profecía', capitulosTotales: 22 },

  // --- ANTIGUO TESTAMENTO (46 libros católicos) ---
  // Pentateuco
  { id: 1, nombre: 'Génesis', abrev: 'Gn', testamento: 'AT', categoria: 'Pentateuco', capitulosTotales: 50 },
  { id: 2, nombre: 'Éxodo', abrev: 'Éx', testamento: 'AT', categoria: 'Pentateuco', capitulosTotales: 40 },
  { id: 3, nombre: 'Levítico', abrev: 'Lv', testamento: 'AT', categoria: 'Pentateuco', capitulosTotales: 27 },
  { id: 4, nombre: 'Números', abrev: 'Nm', testamento: 'AT', categoria: 'Pentateuco', capitulosTotales: 36 },
  { id: 5, nombre: 'Deuteronomio', abrev: 'Dt', testamento: 'AT', categoria: 'Pentateuco', capitulosTotales: 34 },
  // Históricos
  { id: 6, nombre: 'Josué', abrev: 'Jos', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 24 },
  { id: 7, nombre: 'Jueces', abrev: 'Jue', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 21 },
  { id: 8, nombre: 'Rut', abrev: 'Rut', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 4 },
  { id: 9, nombre: '1 Samuel', abrev: '1 S', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 31 },
  { id: 10, nombre: '2 Samuel', abrev: '2 S', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 24 },
  { id: 11, nombre: '1 Reyes', abrev: '1 R', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 22 },
  { id: 12, nombre: '2 Reyes', abrev: '2 R', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 25 },
  { id: 13, nombre: '1 Crónicas', abrev: '1 Cro', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 29 },
  { id: 14, nombre: '2 Crónicas', abrev: '2 Cro', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 36 },
  { id: 15, nombre: 'Esdras', abrev: 'Esd', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 10 },
  { id: 16, nombre: 'Nehemías', abrev: 'Neh', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 13 },
  { id: 17, nombre: 'Tobías', abrev: 'Tob', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 14 },
  { id: 18, nombre: 'Judit', abrev: 'Jdt', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 16 },
  { id: 19, nombre: 'Ester', abrev: 'Est', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 16 },
  { id: 20, nombre: '1 Macabeos', abrev: '1 Mac', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 16 },
  { id: 21, nombre: '2 Macabeos', abrev: '2 Mac', testamento: 'AT', categoria: 'Históricos', capitulosTotales: 15 },
  // Sapienciales y Poéticos
  { id: 22, nombre: 'Job', abrev: 'Job', testamento: 'AT', categoria: 'Sapienciales', capitulosTotales: 42 },
  { id: 23, nombre: 'Salmos', abrev: 'Sal', testamento: 'AT', categoria: 'Sapienciales', capitulosTotales: 150 },
  { id: 24, nombre: 'Proverbios', abrev: 'Pr', testamento: 'AT', categoria: 'Sapienciales', capitulosTotales: 31 },
  { id: 25, nombre: 'Eclesiastés', abrev: 'Qoh', testamento: 'AT', categoria: 'Sapienciales', capitulosTotales: 12 },
  { id: 26, nombre: 'Cantar de los Cantares', abrev: 'Cant', testamento: 'AT', categoria: 'Sapienciales', capitulosTotales: 8 },
  { id: 27, nombre: 'Sabiduría', abrev: 'Sab', testamento: 'AT', categoria: 'Sapienciales', capitulosTotales: 19 },
  { id: 28, nombre: 'Eclesiástico (Sirácide)', abrev: 'Sir', testamento: 'AT', categoria: 'Sapienciales', capitulosTotales: 51 },
  // Proféticos
  { id: 29, nombre: 'Isaías', abrev: 'Is', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 66 },
  { id: 30, nombre: 'Jeremías', abrev: 'Jer', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 52 },
  { id: 31, nombre: 'Lamentaciones', abrev: 'Lam', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 5 },
  { id: 32, nombre: 'Baruc', abrev: 'Bar', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 6 },
  { id: 33, nombre: 'Ezequiel', abrev: 'Ez', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 48 },
  { id: 34, nombre: 'Daniel', abrev: 'Dan', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 14 },
  { id: 35, nombre: 'Oseas', abrev: 'Os', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 14 },
  { id: 36, nombre: 'Joel', abrev: 'Joel', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 4 },
  { id: 37, nombre: 'Amós', abrev: 'Am', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 9 },
  { id: 38, nombre: 'Abdías', abrev: 'Abd', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 1 },
  { id: 39, nombre: 'Jonás', abrev: 'Jon', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 4 },
  { id: 40, nombre: 'Miqueas', abrev: 'Miq', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 7 },
  { id: 41, nombre: 'Nahúm', abrev: 'Nah', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 3 },
  { id: 42, nombre: 'Habacuc', abrev: 'Hab', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 3 },
  { id: 43, nombre: 'Sofonías', abrev: 'Sof', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 3 },
  { id: 44, nombre: 'Ageo', abrev: 'Ag', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 2 },
  { id: 45, nombre: 'Zacarías', abrev: 'Zac', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 14 },
  { id: 46, nombre: 'Malaquías', abrev: 'Mal', testamento: 'AT', categoria: 'Proféticos', capitulosTotales: 3 },
];

const BIBLE_API_BASE = (import.meta.env?.VITE_BIBLE_API_URL || 'https://apibiblia.vercel.app').replace(/\/$/, '') + '/api/v1';

// v2 cache prefix: entries from the old API (keyed by numeric chapter id) are ignored.
const LOCAL_STORAGE_CACHE_PREFIX = 'lumen_bible_cap_v2_';

// API slugs indexed by canonical order (same as BibleBook.id - 1)
const BOOK_SLUGS = [
  'genesis', 'exodo', 'levitico', 'numeros', 'deuteronomio', 'josue', 'jueces', 'rut', '1-samuel', '2-samuel',
  '1-reyes', '2-reyes', '1-cronicas', '2-cronicas', 'esdras', 'nehemias', 'tobias', 'judit', 'ester', '1-macabeos',
  '2-macabeos', 'job', 'salmos', 'proverbios', 'eclesiastes', 'cantar-de-los-cantares', 'sabiduria', 'eclesiastico', 'isaias', 'jeremias',
  'lamentaciones', 'baruc', 'ezequiel', 'daniel', 'oseas', 'joel', 'amos', 'abdias', 'jonas', 'miqueas',
  'nahum', 'habacuc', 'sofonias', 'ageo', 'zacarias', 'malaquias', 'mateo', 'marcos', 'lucas', 'juan',
  'hechos-de-los-apostoles', 'romanos', '1-corintios', '2-corintios', 'galatas', 'efesios', 'filipenses', 'colosenses', '1-tesalonicenses', '2-tesalonicenses',
  '1-timoteo', '2-timoteo', 'tito', 'filemon', 'hebreos', 'santiago', '1-pedro', '2-pedro', '1-juan', '2-juan',
  '3-juan', 'judas', 'apocalipsis',
];

const getBookSlug = (bookId: number) => BOOK_SLUGS[bookId - 1];
const chapterIdFor = (bookId: number, numero: number) => bookId * 1000 + numero;

async function apiGet<T>(path: string): Promise<T> {
  return withAbortTimeout(async signal => {
    const res = await fetch(`${BIBLE_API_BASE}${path}`, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`API Biblia respondió ${res.status}`);
    const json = await res.json();
    return json.data as T;
  }, 10000);
}

export async function fetchChaptersForBook(bookId: number): Promise<BibleChapter[]> {
  const book = CATHOLIC_BOOKS.find(b => b.id === bookId);
  if (!book) throw new Error('Libro bíblico inválido.');
  const total = book.capitulosTotales;
  return Array.from({ length: total }, (_, i) => ({
    id: chapterIdFor(bookId, i + 1),
    libro_id: bookId,
    numero: i + 1,
  }));
}

export async function fetchVersesForChapter(chapterId: number, bookName?: string, chapterNum?: number): Promise<BibleVerse[]> {
  const bookId = Math.floor(chapterId / 1000);
  const numero = chapterNum ?? chapterId % 1000;
  const slug = getBookSlug(bookId);
  const book = CATHOLIC_BOOKS.find(b => b.id === bookId);
  if (!book || !Number.isInteger(numero) || numero < 1 || numero > book.capitulosTotales) {
    throw new Error('Capítulo bíblico inválido.');
  }

  const cacheKey = `${LOCAL_STORAGE_CACHE_PREFIX}${slug}_${numero}`;
  const cached = readStoredJson(cacheKey, (value): value is BibleVerse[] =>
    Array.isArray(value) && value.length > 0 && value.every(v => v && v.capitulo_id === chapterId
      && Number.isInteger(v.numero) && v.numero > 0 && typeof v.texto === 'string' && v.texto.trim()));
  if (cached) return cached;

  try {
    const data = await apiGet<{ verses: Array<{ number: number; text: string }> }>(`/books/${slug}/chapters/${numero}`);
    if (Array.isArray(data?.verses) && data.verses.length > 0 && data.verses.every(v =>
      v && Number.isInteger(v.number) && v.number > 0 && typeof v.text === 'string' && v.text.trim())) {
      const verses: BibleVerse[] = data.verses.map((v) => ({
        id: chapterId * 1000 + v.number,
        capitulo_id: chapterId,
        numero: v.number,
        texto: v.text,
      }));
      writeStorage(cacheKey, JSON.stringify(verses));
      return verses;
    }
    throw new Error('La fuente devolvió un capítulo vacío o inválido.');
  } catch (err) {
    console.warn('Error fetching verses from API:', err);
    throw new Error(`No se pudo cargar ${bookName ?? book.nombre} ${numero}. Verifica tu conexión e inténtalo de nuevo.`);
  }
}

export interface BibleSearchResult {
  libro: string; capitulo: number; numero: number; texto: string; referencia: string;
}

export async function searchBible(query: string, limit = 25): Promise<BibleSearchResult[]> {
  if (query.trim().length < 2) return [];
  try {
    const data = await apiGet<Array<{ bookName: string; chapter: number; verse: number; text: string; reference: string }>>(
      `/search?q=${encodeURIComponent(query.trim())}&limit=${Math.min(limit, 100)}`
    );
    if (!Array.isArray(data) || data.some(r => !r || typeof r.bookName !== 'string'
      || !Number.isInteger(r.chapter) || r.chapter < 1 || !Number.isInteger(r.verse) || r.verse < 1
      || typeof r.text !== 'string' || typeof r.reference !== 'string')) {
      throw new Error('Resultados bíblicos inválidos.');
    }
    return data.map((r) => ({
      libro: r.bookName,
      capitulo: r.chapter,
      numero: r.verse,
      texto: r.text,
      referencia: r.reference,
    }));
  } catch (err) {
    console.warn('Error searching bible:', err);
    throw new Error('La búsqueda bíblica no está disponible. Reintenta más tarde.');
  }
}
