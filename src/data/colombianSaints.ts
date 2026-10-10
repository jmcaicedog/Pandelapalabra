import { SAINTS_BY_DAY, type SaintData } from './saintsCalendar.js';
import editorial from './colombianEditorialSaints.json' with { type: 'json' };
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
  biographySourceUrl?: string;
  biographySourceName?: string;
}

export interface ColombianSaint {
  saint: SaintData;
  saintVerification: SaintVerification;
}

const BIOGRAPHIES_BY_NAME: Record<string, {
  shortBio: string;
  fullBio: string;
  sourceUrl: string;
  sourceName: string;
}> = {
  'San Daniel el Estilita': {
    shortBio: 'Asceta cristiano del siglo V, conocido por vivir durante décadas sobre una columna cerca de Constantinopla, dedicado a la oración, la penitencia y el consejo espiritual.',
    fullBio: 'Daniel nació cerca de Samosata y entró en un monasterio desde joven. Después de conocer a San Simeón el Estilita, adoptó la vida ascética sobre una columna cerca de Constantinopla. Allí permaneció durante décadas, fue ordenado sacerdote y recibió a personas que acudían a él en busca de oración y consejo. Su memoria pertenece a la tradición cristiana oriental y su vida está recogida en fuentes hagiográficas antiguas.',
    sourceUrl: 'https://es.catholic.net/op/articulos/35723/daniel-el-estilita-santo.html',
    sourceName: 'Catholic.net',
  },
  'San Juan XXIII': {
    shortBio: 'Papa de 1958 a 1963, convocó el Concilio Vaticano II y es recordado por su sencillez, su caridad pastoral y su deseo de servir a la unidad de la Iglesia.',
    fullBio: 'Angelo Giuseppe Roncalli nació en Sotto il Monte, Italia, en 1881. Fue ordenado sacerdote en 1904, ejerció diversos servicios diplomáticos y pastorales, y en 1958 fue elegido papa con el nombre de Juan XXIII. Convocó el Concilio Vaticano II, inaugurado en 1962, y promovió una actitud pastoral de diálogo y renovación. Murió el 3 de junio de 1963 y fue canonizado en 2014.',
    sourceUrl: 'https://www.vatican.va/content/john-xxiii/es/biography.index.html',
    sourceName: 'Santa Sede',
  },
};

const NAME_NOISE = new Set([
  'san', 'santo', 'santa', 'santos', 'del', 'de', 'la', 'el', 'los', 'las',
  'virgen', 'martir', 'obispo', 'papa', 'apostol', 'apostoles', 'presbitero',
  'diacono', 'evangelista', 'abad', 'confesor', 'mártir',
]);

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

function saintNameTokens(name: string): Set<string> {
  return new Set(normalizeSaintName(name)
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !NAME_NOISE.has(token)));
}

function findLocalBiography(date: string, name: string): SaintData | undefined {
  const local = SAINTS_BY_DAY[date.slice(5)];
  if (!local) return undefined;
  if (normalizeSaintName(local.name) === normalizeSaintName(name)) return local;

  const requested = saintNameTokens(name);
  const available = saintNameTokens(local.name);
  if (requested.size < 2 || available.size < 2) return undefined;
  const overlap = [...requested].filter(token => available.has(token)).length;
  const unmatched = requested.size + available.size - (overlap * 2);
  // Accept inflection/spelling variants and one added liturgical descriptor,
  // but reject names that could identify a different saint in a combined entry.
  const completeIdentity = overlap >= 2
    && overlap >= Math.min(requested.size, available.size) - 1
    && unmatched <= 2;
  return completeIdentity && overlap >= 2 ? local : undefined;
}

export function selectColombianSaint(
  date: string,
  name: string | null,
  verification: Omit<SaintVerification, 'date' | 'checkedAt'>,
): ColombianSaint {
  const local = name ? findLocalBiography(date, name) : undefined;
  return {
    saint: !name ? pendingSaint() : local ? { ...local, name } : {
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
  const local = findLocalBiography(date, aliases[entry.name] || entry.name);
  if (local) {
    selected.saint = { ...local, name: entry.name };
  } else {
    selected.saint = {
      name: entry.name, title: 'Santo del día',
      shortBio: 'Biografía no disponible.',
      fullBio: 'Todavía no hay una biografía disponible para esta entrada del santoral.',
      prayer: pendingSaint().prayer,
    };
  }
  const biography = BIOGRAPHIES_BY_NAME[entry.name];
  if (biography) {
    selected.saint = {
      ...selected.saint,
      shortBio: biography.shortBio,
      fullBio: biography.fullBio,
    };
    selected.saintVerification = {
      ...selected.saintVerification,
      biographySourceUrl: biography.sourceUrl,
      biographySourceName: biography.sourceName,
    };
  }
  return selected;
}
