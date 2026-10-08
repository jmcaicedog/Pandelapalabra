import { SAINTS_BY_DAY, type SaintData } from './saintsCalendar.js';

export interface SaintVerification {
  status: 'publisher' | 'ordo' | 'pending';
  date: string;
  checkedAt: string;
  sourceUrl?: string;
  method?: 'web' | 'print';
  celebration?: string;
  colors?: string;
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

/** These two exact dates were checked against the user's Colombian print edition. */
export function confirmedPrintSaint(date: string): ColombianSaint | null {
  const names: Record<string, string> = {
    '2026-10-08': 'Santa Pelagia',
    '2026-10-09': 'San Luis Bertrán',
  };
  return names[date] ? selectColombianSaint(date, names[date], {
    status: 'publisher', method: 'print',
  }) : null;
}

export function hasFreshSaintVerification(value: SaintVerification | undefined, date: string): boolean {
  if (!value || value.date !== date) return false;
  const age = Date.now() - Date.parse(value.checkedAt);
  const ttl = value.status === 'publisher' ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
  return Number.isFinite(age) && age >= 0 && age < ttl;
}
