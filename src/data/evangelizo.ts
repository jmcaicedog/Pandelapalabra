import type { LiturgicalDay } from './liturgy.js';
import { pendingSaint } from './colombianSaints.js';
import { buildSeasonalTitle } from './liturgicalCalendar.js';
import {
  getColorName,
  getLiturgicalCalendarInfo,
  parseDateStr,
  resolveLiturgicalColor,
  matchesColombianTransfers,
} from './liturgicalCalendar.js';

/**
 * Daily Mass readings in Spanish published by Evangelizo.
 * Availability depends on the publisher; future dates are normally published months ahead.
 */
export const EVANGELIZO_API_BASE = 'https://publication.evangelizo.ws/SP/days';

interface EvangelizoReading {
  type: 'reading' | 'psalm' | 'gospel' | string;
  reading_code?: string;
  reference_displayed?: string;
  chorus?: string | null;
  title?: string;
  text?: string;
  book?: { code?: string; full_title?: string };
}

interface EvangelizoSaint {
  name?: string;
  bio?: string | null;
  short_description?: string | null;
  order1?: number;
  order2?: number;
}

interface EvangelizoDay {
  date: string;
  saints?: EvangelizoSaint[];
  liturgic_title?: string;
  liturgy?: { title?: string };
  readings?: EvangelizoReading[];
}

const HTML_ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', iexcl: '¡', iquest: '¿',
  laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
  ndash: '–', mdash: '—', hellip: '…', ordf: 'ª', ordm: 'º', deg: '°',
  agrave: 'à', egrave: 'è', ograve: 'ò', ccedil: 'ç',
};

function htmlToText(html: string): string {
  return html
    .replace(/<\/p>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => HTML_ENTITIES[name] ?? m)
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

export function cleanSaintText(raw: string): string {
  return htmlToText(raw)
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .trim();
}

function cleanText(raw: string): string {
  return raw
    .replace(/\[\[[^\]]*\]\]/g, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatReference(ref: string): string {
  return ref
    .trim()
    .replace(/\.$/, '')
    .replace(/,\s*/g, ', ')
    .replace(/\.(?=\S)/g, '. ');
}

function bookShortName(fullTitle: string): string {
  let t = fullTitle.trim();
  let prefix = '';
  const ordinal = t.match(/^(primera|primer|segunda|segundo|tercera|tercer)\s+/i);
  if (ordinal) {
    const w = ordinal[1].toLowerCase();
    prefix = w.startsWith('prim') ? '1 ' : w.startsWith('seg') ? '2 ' : '3 ';
    t = t.slice(ordinal[0].length);
  }
  // "Carta I de San Pablo...", "Epístola II de San Juan", "Libro I de los Reyes"
  const roman = t.match(/^(\S+)\s+(III|II|I)\s+/);
  if (roman) {
    prefix = `${roman[2].length} `;
    t = `${roman[1]} ${t.slice(roman[0].length)}`;
  }

  const patterns: RegExp[] = [
    /^evangelio seg[uú]n san\s+(.+)$/i,
    /^(?:carta|ep[ií]stola) .*?\ba (?:los |las )?(.+)$/i,
    /^(?:carta|ep[ií]stola) (?:del ap[oó]stol |de )(?:san )?(.+)$/i,
    /^libro de (?:los |las |la )?(.+)$/i,
    /^libro del (.+)$/i,
    /^profec[ií]a de (.+)$/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      t = m[1];
      break;
    }
  }
  const accents: Record<string, string> = {
    Exodo: 'Éxodo',
    Genesis: 'Génesis',
    Levitico: 'Levítico',
    Josue: 'Josué',
    Nehemias: 'Nehemías',
    Isaias: 'Isaías',
    Jeremias: 'Jeremías',
    Tobias: 'Tobías',
  };
  t = accents[t] || t;
  return (prefix + t.charAt(0).toUpperCase() + t.slice(1)).trim();
}

function buildCitation(reading: EvangelizoReading): string {
  const ref = reading.reference_displayed || '';
  const isPsalmBook = reading.book?.code === 'Ps';
  if (isPsalmBook) {
    // "117(116),1.2." -> "Salmo 116 (117), 1. 2" (liturgical/Vulgate numbering first)
    const m = ref.match(/^(\d+)\((\d+)\),(.*)$/);
    if (m) return `Salmo ${m[2]} (${m[1]}), ${formatReference(m[3])}`;
    return `Salmo ${formatReference(ref)}`;
  }
  const book = bookShortName(reading.book?.full_title || reading.title || '');
  return `${book} ${formatReference(ref)}`.trim();
}

function normalizeTitle(title: string): string {
  const t = title
    .replace(/\b(\d+)a\b/g, '$1.ª')
    .replace(/\b(\d+)[oe]\b/g, '$1.º')
    .trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function stripTrailingPunctuation(s: string): string {
  return s.replace(/[\s,;:]+$/, '').trim();
}

export function mapEvangelizoDay(dateStr: string, data: EvangelizoDay): LiturgicalDay | null {
  parseDateStr(dateStr);
  if (data.date !== dateStr || !Array.isArray(data.readings) || data.readings.some(reading =>
    !reading || typeof reading.type !== 'string'
    || (reading.text !== undefined && typeof reading.text !== 'string')
    || (reading.reference_displayed !== undefined && typeof reading.reference_displayed !== 'string')
    || (reading.chorus != null && typeof reading.chorus !== 'string')
    || (reading.book !== undefined && (!reading.book || typeof reading.book !== 'object'
      || (reading.book.full_title !== undefined && typeof reading.book.full_title !== 'string'))))) {
    console.warn(`Respuesta de Evangelizo inválida o de otra fecha (${dateStr}).`);
    return null;
  }
  const readings = data.readings || [];
  const firstReadings = readings.filter((r) => r.type === 'reading');
  const psalmReading = readings.find((r) => r.type === 'psalm');
  const gospelReading = readings.find((r) => r.type === 'gospel');
  if (
    !firstReadings.length ||
    !psalmReading ||
    !gospelReading ||
    [...firstReadings, gospelReading, ...(psalmReading ? [psalmReading] : [])].some(
      (reading) => !cleanText(reading.text || '') || !reading.reference_displayed?.trim()
    )
  ) {
    console.warn(`Lecturas de Evangelizo vacías o sin referencia para ${dateStr}.`);
    return null;
  }

  const date = parseDateStr(dateStr);
  const info = getLiturgicalCalendarInfo(dateStr);
  const saintData = pendingSaint();
  const rawTitle = typeof data.liturgic_title === 'string' ? data.liturgic_title
    : typeof data.liturgy?.title === 'string' ? data.liturgy.title : '';
  const title = rawTitle ? normalizeTitle(rawTitle) : '';
  if (!matchesColombianTransfers(dateStr, title)) {
    console.warn(`Evangelizo no coincide con los traslados colombianos para ${dateStr}.`);
    return null;
  }
  const { color, isFeast } = resolveLiturgicalColor(info, title, saintData.color);

  const colorLabel = isFeast
    ? 'Solemnidad / Fiesta'
    : color !== info.color && info.season === 'Tiempo Ordinario'
    ? `Memoria de ${saintData.name}`
    : info.season;


  let psalm: LiturgicalDay['psalm'];
  if (psalmReading) {
    const psalmText = cleanText(psalmReading.text || '');
    const verses = psalmText
      .split(/\n\s*\n/)
      .map((v) => v.trim())
      .filter(Boolean);
    const firstLine = (verses[0] || '').split('\n')[0] || '';
    psalm = {
      citation: buildCitation(psalmReading),
      response: stripTrailingPunctuation(psalmReading.chorus?.trim() || firstLine),
      verses,
    };
  } else {
    psalm = { citation: 'Salmo responsorial', response: '', verses: [] };
  }

  const second = firstReadings[1];
  const isLent = info.season === 'Cuaresma';

  return {
    date: dateStr,
    formattedDate: date.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    title: title || buildSeasonalTitle(dateStr, info),
    season: isFeast ? 'Fiesta / Solemnidad' : info.season,
    color,
    colorName: getColorName(color, colorLabel),
    saint: {
      name: saintData.name,
      title: saintData.title,
      shortBio: saintData.shortBio,
      fullBio: saintData.fullBio,
      patronage: saintData.patronage,
      prayer: saintData.prayer,
    },
    firstReading: {
      citation: buildCitation(firstReadings[0]),
      text: cleanText(firstReadings[0].text || ''),
    },
    psalm,
    ...(second
      ? { secondReading: { citation: buildCitation(second), text: cleanText(second.text || '') } }
      : {}),
    gospel: {
      citation: buildCitation(gospelReading),
      acclamation: isLent ? 'Honor y gloria a ti, Señor Jesús.' : 'Aleluya, aleluya.',
      text: cleanText(gospelReading.text || ''),
    },
    source: 'evangelizo',
    readingsCheckedAt: new Date().toISOString(),
  };
}

/**
 * Fetches the official readings for a date. Returns null when the date is not published yet
 * (too far in the future) or the service is unreachable.
 */
export async function fetchEvangelizoDay(dateStr: string, timeoutMs = 8000): Promise<LiturgicalDay | null> {
  parseDateStr(dateStr);
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${EVANGELIZO_API_BASE}/${encodeURIComponent(dateStr)}`, {
      signal: controller?.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Evangelizo HTTP ${res.status}`);
    const json = await res.json();
    if (!json || json.error || !json.data) {
      console.warn(`Evangelizo no tiene lecturas disponibles para ${dateStr}.`);
      return null;
    }
    return mapEvangelizoDay(dateStr, json.data as EvangelizoDay);
  } catch (error) {
    console.warn(`No se pudo obtener Evangelizo para ${dateStr}:`, error);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
