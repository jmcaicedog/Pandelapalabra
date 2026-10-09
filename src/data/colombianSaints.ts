import { SAINTS_BY_DAY, type SaintData } from './saintsCalendar.js';
import editorial from './colombianEditorialSaints.json';
import { parseDateStr } from '../lib/dateUtils.js';

export const EDITORIAL_SANTORAL_VERSION = editorial.version;

export interface SaintVerification {
  status: 'publisher' | 'ordo' | 'pending' | 'editorial';
  date: string;
  checkedAt: string;
  sourceUrl?: string;
  method?: 'web';
  celebration?: string;
  colors?: string;
  version?: string;
  sourceReference?: string;
  review?: string;
}

export interface ColombianSaint {
  saint: SaintData;
  saintVerification: SaintVerification;
}

export function publisherUrl(date: string): string {
  return `https://sanpablo.co/publicaciones-periodicas/pan-de-la-palabra/${date}/`;
}

export function pendingSaint(): SaintData {
  return {
    name: 'Santoral colombiano pendiente de confirmar',
    title: 'Sin selección verificada para esta fecha',
    shortBio: 'No se ha podido verificar el santo destacado por Pan de la Palabra de Colombia.',
    fullBio: 'No se ha podido verificar el santo destacado por Pan de la Palabra de Colombia. No se sustituye por un santo elegido de otro calendario.',
    prayer: 'Señor, guíanos con el ejemplo de tus santos y ayúdanos a vivir en la fe y la caridad. Amén.',
  };
}

export function normalizeSaintName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[.,;:]/g, '').replace(/\s+/g, ' ').trim();
}

export function selectColombianSaint(
  date: string,
  name: string | null,
  verification: Omit<SaintVerification, 'date' | 'checkedAt'>,
): ColombianSaint {
  const local = SAINTS_BY_DAY[date.slice(5)];
  const matches = name && local && normalizeSaintName(local.name) === normalizeSaintName(name);
  return {
    saint: !name ? pendingSaint() : matches ? local : {
      name,
      title: verification.status === 'ordo' ? 'Celebraciones del Ordo Colombiano' : 'Santoral de Pan de la Palabra · Colombia',
      shortBio: 'La fuente confirma el nombre; no hay una biografía propia disponible.',
      fullBio: 'La fuente confirma el nombre; no hay una biografía propia disponible. Puedes consultar la publicación original mediante el enlace de la fuente.',
      prayer: pendingSaint().prayer,
    },
    saintVerification: { ...verification, date, checkedAt: new Date().toISOString() },
  };
}

export function hasFreshSaintVerification(value: SaintVerification | undefined, date: string): boolean {
  if (!value || value.date !== date) return false;
  if (value.status === 'editorial') return value.version === EDITORIAL_SANTORAL_VERSION;
  if (!['publisher', 'ordo', 'pending'].includes(value.status)) return false;
  const age = Date.now() - Date.parse(value.checkedAt);
  const ttl = value.status === 'publisher' ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
  return Number.isFinite(age) && age >= 0 && age < ttl;
}

export function getEditorialSaint(date: string): ColombianSaint {
  parseDateStr(date);
  const entries: Record<string, { name: string; kind: string; rank: string; source: string; review: string }> = editorial.entries;
  const entry = entries[date.slice(5)];
  if (!entry) throw new Error(`Falta una entrada del santoral editorial para ${date}.`);
  const selected = selectColombianSaint(date, entry.name, {
    status: 'editorial', version: EDITORIAL_SANTORAL_VERSION,
    sourceReference: entry.source, review: entry.review,
  });
  // This is an identity alias, not a replacement based on a partial name match.
  const aliases: Record<string, string> = { 'Santa Pelagia de Antioquía': 'Santa Pelagia' };
  const local = SAINTS_BY_DAY[date.slice(5)];
  if (local && normalizeSaintName(local.name) === normalizeSaintName(aliases[entry.name] || entry.name)) {
    selected.saint = { ...local, name: entry.name };
  } else {
    selected.saint = {
      name: entry.name, title: 'Santo del día',
      shortBio: 'Biografía no disponible.',
      fullBio: 'Todavía no hay una biografía disponible para esta entrada del santoral.',
      prayer: pendingSaint().prayer,
    };
  }
  return selected;
}
