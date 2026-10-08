import {
  confirmedPrintSaint, hasFreshSaintVerification, publisherUrl, selectColombianSaint,
  type ColombianSaint,
} from '../data/colombianSaints.js';
import { cleanSaintText } from '../data/evangelizo.js';

const ORDO_URL = 'https://74j2tngwfd.execute-api.us-east-1.amazonaws.com/api-app/ediciones/obtener-contenido-completo';
const ORDO_PAGE = 'https://ordocolombia.cec.org.co/';
// The publisher determines the editorial saint; Ordo supplies alternatives, not a
// single preferred saint. Only factual names/calendar metadata are imported.
const cache = new Map<string, ColombianSaint>();
let ordoCache: { expires: number; rows: OrdoDay[] } | undefined;
let ordoRequest: Promise<OrdoDay[]> | undefined;

interface OrdoDay {
  fecha: string;
  preludio: string | null;
  celebracion: string;
  colores_dia: string;
}

function text(html: string): string {
  return cleanSaintText(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function parsePublisherSaint(html: string, date: string): string | null {
  // Only factual names from the day header, not copyrighted readings or biographies.
  if (!html.includes(`data-url="${publisherUrl(date)}"`)) return null;
  const header = html.match(/<div\b[^>]*class=["'][^"']*\bjournal-pp-info\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const name = header?.[1].match(/<li\b[^>]*>\s*<strong\b[^>]*>([\s\S]*?)<\/strong>\s*<\/li>/i);
  return name ? text(name[1]) || null : null;
}

export function selectOrdoDay(date: string, rows: OrdoDay[]): ColombianSaint {
  const matches = rows.filter(row => row.fecha === date);
  const names = [...new Set(matches.map(row => text(row.preludio || '')).filter(Boolean))];
  return selectColombianSaint(date, names.length ? names.join('; ') : null, {
    status: matches.length ? 'ordo' : 'pending',
    sourceUrl: ORDO_PAGE,
    celebration: [...new Set(matches.map(row => row.celebracion).filter(Boolean))].join(' / ') || undefined,
    colors: [...new Set(matches.map(row => row.colores_dia).filter(Boolean))].join(' / ') || undefined,
  });
}

async function loadOrdo(): Promise<OrdoDay[]> {
  if (ordoCache && ordoCache.expires > Date.now()) return ordoCache.rows;
  if (ordoRequest) return ordoRequest;
  ordoRequest = (async () => {
    const response = await fetch(ORDO_URL, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Ordo HTTP ${response.status}`);
    const json: unknown = await response.json();
    if (!json || typeof json !== 'object' || !('data' in json) || !Array.isArray(json.data)) {
      throw new Error('Respuesta del Ordo sin calendario');
    }
    const rows = json.data.filter((row): row is OrdoDay =>
      !!row && typeof row === 'object' && typeof row.fecha === 'string'
      && (typeof row.preludio === 'string' || row.preludio === null)
      && typeof row.celebracion === 'string' && typeof row.colores_dia === 'string');
    if (!rows.length) throw new Error('Calendario del Ordo vacío');
    ordoCache = { rows, expires: Date.now() + 60 * 60 * 1000 };
    return rows;
  })();
  try {
    return await ordoRequest;
  } finally {
    ordoRequest = undefined;
  }
}

export async function fetchColombianSantoral(date: string): Promise<ColombianSaint> {
  const cached = cache.get(date);
  if (cached && hasFreshSaintVerification(cached.saintVerification, date)) return cached;
  let selected = confirmedPrintSaint(date);
  if (!selected) {
    const [name, rows] = await Promise.all([
      (async () => {
        try {
          const response = await fetch(publisherUrl(date), { signal: AbortSignal.timeout(6000) });
          if (!response.ok && response.status !== 404) throw new Error(`San Pablo HTTP ${response.status}`);
          return response.ok ? parsePublisherSaint(await response.text(), date) : null;
        } catch (error) {
          console.warn(`No se pudo verificar Pan de la Palabra para ${date}:`, error);
          return null;
        }
      })(),
      loadOrdo().catch((error: unknown) => {
        console.warn(`No se pudo consultar el Ordo Colombiano para ${date}:`, error);
        return [];
      }),
    ]);
    const ordo = selectOrdoDay(date, rows);
    selected = name
      ? selectColombianSaint(date, name, {
        status: 'publisher', method: 'web', sourceUrl: publisherUrl(date),
        celebration: ordo.saintVerification.celebration,
        colors: ordo.saintVerification.colors,
      })
      : ordo;
  }
  cache.set(date, selected);
  return selected;
}
