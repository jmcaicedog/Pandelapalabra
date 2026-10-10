import { buildCanonicalDay } from './canonicalLectionary.js';
import { fetchEvangelizoDay } from './evangelizo.js';
import { getEditorialSaint, hasFreshSaintVerification, pendingSaint, type SaintVerification } from './colombianSaints.js';
import type { LiturgicalColor, LiturgicalSeason } from './liturgicalCalendar.js';
import { matchesColombianTransfers, getLiturgicalCalendarInfo, resolveLiturgicalColor, getColorName } from './liturgicalCalendar.js';
import { isValidDateStr, parseDateStr } from '../lib/dateUtils.js';
import { ExpiringCache } from '../lib/cache.js';
import { readStoredJson, writeStorage } from '../lib/storage.js';
import { withAbortTimeout } from '../lib/asyncUtils.js';

export interface LiturgicalDay {
  date: string;
  formattedDate: string;
  title: string;
  season: LiturgicalSeason | 'Fiesta / Solemnidad';
  color: LiturgicalColor;
  colorName: string;
  saint: {
    name: string;
    title: string;
    shortBio: string;
    fullBio: string;
    patronage?: string;
    prayer: string;
  };
  saintVerification?: SaintVerification;
  firstReading: { citation: string; text: string };
  psalm: { citation: string; response: string; verses: string[] };
  secondReading?: { citation: string; text: string };
  gospel: { citation: string; acclamation: string; text: string };
  source?: 'evangelizo' | 'local';
  readingsPending?: boolean;
  readingsCheckedAt?: string;
}

const memory = new ExpiringCache<LiturgicalDay>(120, 24 * 60 * 60 * 1000);
const inFlight = new Map<string, Promise<LiturgicalDay>>();
const STORAGE_PREFIX = 'panvivo_liturgy_v6_';
const MAX_STORED_DAYS = 90;

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function strings(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every(key => typeof value[key] === 'string');
}

/** Validate network/storage data before rendering or marking a response as official. */
export function isLiturgicalDay(value: unknown): value is LiturgicalDay {
  if (!record(value) || !isValidDateStr(value.date)
    || !strings(value, ['formattedDate', 'title', 'season', 'color', 'colorName'])
    || !['green', 'purple', 'white', 'red'].includes(String(value.color))
    || !['Tiempo Ordinario', 'Adviento', 'Cuaresma', 'Pascua', 'Navidad', 'Fiesta / Solemnidad'].includes(String(value.season))) return false;
  if (!record(value.saint) || !strings(value.saint, ['name', 'title', 'shortBio', 'fullBio', 'prayer'])) return false;
  if (!record(value.firstReading) || !strings(value.firstReading, ['citation', 'text'])
    || !record(value.gospel) || !strings(value.gospel, ['citation', 'acclamation', 'text'])
    || !record(value.psalm) || !strings(value.psalm, ['citation', 'response'])
    || !Array.isArray(value.psalm.verses) || !value.psalm.verses.every(v => typeof v === 'string')) return false;
  if (value.secondReading !== undefined && (!record(value.secondReading)
    || !strings(value.secondReading, ['citation', 'text']))) return false;
  if (value.readingsCheckedAt !== undefined && (typeof value.readingsCheckedAt !== 'string'
    || !Number.isFinite(Date.parse(value.readingsCheckedAt)))) return false;
  if (value.saintVerification !== undefined && (!record(value.saintVerification)
    || !strings(value.saintVerification, ['date', 'checkedAt', 'status'])
    || value.saintVerification.date !== value.date
    || !Number.isFinite(Date.parse(String(value.saintVerification.checkedAt)))
    || !['publisher', 'ordo', 'pending', 'editorial'].includes(String(value.saintVerification.status))
    || (value.saintVerification.status === 'editorial' && !strings(value.saintVerification, ['version', 'sourceReference', 'review']))
    || (value.saintVerification.biographySourceUrl !== undefined
      && (typeof value.saintVerification.biographySourceUrl !== 'string'
        || !/^https:\/\/(?:es\.catholic\.net|www\.vatican\.va)\//.test(value.saintVerification.biographySourceUrl)))
    || (value.saintVerification.biographySourceName !== undefined
      && typeof value.saintVerification.biographySourceName !== 'string')
    || (value.saintVerification.sourceUrl !== undefined && (typeof value.saintVerification.sourceUrl !== 'string'
      || !/^https:\/\/(?:sanpablo\.co|ordocolombia\.cec\.org\.co)\//.test(value.saintVerification.sourceUrl))))) return false;
  return (value.source === 'local' || value.source === 'evangelizo')
    && (value.readingsPending === undefined || typeof value.readingsPending === 'boolean');
}

export function hasOfficialReadings(day: LiturgicalDay): boolean {
  return day.source === 'evangelizo' && !day.readingsPending
    && matchesColombianTransfers(day.date, day.title)
    && !!day.firstReading.text.trim() && !!day.firstReading.citation.trim()
    && !!day.psalm.citation.trim() && day.psalm.verses.length > 0
    && !!day.gospel.text.trim() && !!day.gospel.citation.trim();
}

export function hasFreshReadings(day: LiturgicalDay): boolean {
  if (!hasOfficialReadings(day)) return false;
  const age = Date.now() - Date.parse(day.readingsCheckedAt || '');
  return Number.isFinite(age) && age >= 0 && age < 24 * 60 * 60 * 1000;
}

function remember(day: LiturgicalDay): LiturgicalDay {
  day = { ...day, ...getEditorialSaint(day.date) };
  memory.set(day.date, day, hasOfficialReadings(day) ? 24 * 60 * 60 * 1000 : 60 * 1000);
  // Missing readings must be retried, never persisted as a full offline lectionary.
  if (hasOfficialReadings(day)) {
    writeStorage(STORAGE_PREFIX + day.date, JSON.stringify(day));
    try {
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage).filter(key =>
          key.startsWith(STORAGE_PREFIX) && isValidDateStr(key.slice(STORAGE_PREFIX.length)));
        keys.sort((a, b) => {
          const left = Math.abs(parseDateStr(a.slice(STORAGE_PREFIX.length)).getTime() - Date.now());
          const right = Math.abs(parseDateStr(b.slice(STORAGE_PREFIX.length)).getTime() - Date.now());
          return left - right;
        });
        for (const key of keys.slice(MAX_STORED_DAYS)) localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('No se pudo limitar la caché de lecturas:', error);
    }
  }
  return day;
}

export function getLiturgicalDay(date: string): LiturgicalDay {
  parseDateStr(date);
  const cached = memory.get(date);
  if (cached) return { ...cached, ...getEditorialSaint(date) };
  const stored = readStoredJson(STORAGE_PREFIX + date, isLiturgicalDay);
  if (stored && stored.date === date && hasOfficialReadings(stored)) {
    const current = { ...stored, ...getEditorialSaint(date) };
    memory.set(date, current);
    return current;
  }
  // Preserve legacy official readings offline, but discard date patches and saint guesses.
  for (const version of [5, 4, 3]) {
    const legacy = readStoredJson(`panvivo_liturgy_v${version}_${date}`, (value): value is LiturgicalDay =>
      record(value) && isLiturgicalDay({ ...value, saint: pendingSaint(), saintVerification: undefined }));
    if (legacy && legacy.date === date && hasOfficialReadings(legacy)) {
      const info = getLiturgicalCalendarInfo(date);
      const { color, isFeast } = resolveLiturgicalColor(info, legacy.title);
      return remember({
        ...legacy, color, colorName: getColorName(color, isFeast ? 'Fiesta / Solemnidad' : info.season),
        saint: pendingSaint(), saintVerification: undefined, readingsCheckedAt: undefined,
      });
    }
  }
  return buildCanonicalDay(date);
}

async function loadDay(date: string): Promise<LiturgicalDay> {
  const cached = getLiturgicalDay(date);
  if (hasFreshReadings(cached) && hasFreshSaintVerification(cached.saintVerification, date)) return cached;
  try {
    const value: unknown = await withAbortTimeout(async signal => {
      const response = await fetch(`/api/liturgy?date=${encodeURIComponent(date)}`, { signal });
      if (!response.ok) throw new Error(`Liturgia HTTP ${response.status}`);
      return response.json();
    }, 20000);
    if (!isLiturgicalDay(value) || value.date !== date) throw new Error('Respuesta de liturgia inválida.');
    if (hasOfficialReadings(value)) return remember(value);
    if (hasOfficialReadings(cached)) return remember({
      ...cached, saint: value.saint, saintVerification: value.saintVerification,
    });
    return remember(value);
  } catch (error) {
    console.warn(`No se pudo sincronizar la liturgia de ${date}:`, error);
  }
  if (hasOfficialReadings(cached)) return cached;
  const direct = await fetchEvangelizoDay(date);
  return remember(direct || cached);
}

export function fetchLiturgicalDay(date: string): Promise<LiturgicalDay> {
  parseDateStr(date);
  const running = inFlight.get(date);
  if (running) return running;
  const request = loadDay(date).finally(() => inFlight.delete(date));
  inFlight.set(date, request);
  return request;
}
