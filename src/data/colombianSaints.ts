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
  biographySources?: { url: string; title: string }[];
  biographyMethod?: 'grounded';
  biographyCheckedAt?: string;
  biographyError?: string;
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

const IDENTITY_ALIASES: Record<string, string> = {
  'Santa Pelagia de Antioquía': 'Santa Pelagia',
  'Santos Basilio Magno y Gregorio de Nacianzo': 'San Basilio Magno y San Gregorio Nacianceno',
  'San Juan Nepomuceno Neumann': 'San Juan Neumann',
};

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

function findLocalBiography(name: string): SaintData | undefined {
  const identity = normalizeSaintName(IDENTITY_ALIASES[name] || name);
  // The date selects the saint, not the biography; never match only part of a name.
  return Object.values(SAINTS_BY_DAY).find(local => normalizeSaintName(local.name) === identity);
}

export function hasSaintBiography(value: ColombianSaint): boolean {
  return !!value.saint.fullBio.trim()
    && !/^(?:Biografía no disponible\.|Todavía no hay una biografía|No se ha podido verificar el santo|La fuente confirma el nombre; no hay una biografía)/i.test(value.saint.fullBio.trim());
}

export function isBiographySourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      && [
        'es.catholic.net', 'www.vatican.va', 'www.vaticannews.va',
        'www.aciprensa.com', 'www.oca.org', 'vertexaisearch.cloud.google.com',
      ].includes(url.hostname);
  } catch {
    return false;
  }
}

export function hasFreshSaintBiography(value: ColombianSaint): boolean {
  if (!hasSaintBiography(value)) return false;
  return value.saintVerification.biographyMethod !== 'grounded'
    || !!value.saintVerification.biographySources?.length;
}

export function selectColombianSaint(
  date: string,
  name: string | null,
  verification: Omit<SaintVerification, 'date' | 'checkedAt'>,
): ColombianSaint {
  const local = name ? findLocalBiography(name) : undefined;
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
  const local = findLocalBiography(entry.name);
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
