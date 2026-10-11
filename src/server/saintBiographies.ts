import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import { randomUUID } from 'node:crypto';
import { isBiographySourceUrl, normalizeSaintName } from '../data/colombianSaints.js';
import { ExpiringCache } from '../lib/cache.js';
import { neonBiographyStore } from './neonBiographyStore.js';
import { withTimeout } from '../lib/asyncUtils.js';

export interface ResearchedBiography {
  fullBio: string;
  sources: { url: string; title: string }[];
  checkedAt: string;
  model?: string;
}

export interface BiographyStore {
  claim(key: string, owner: string): Promise<
    { status: 'ready'; biography: ResearchedBiography } | { status: 'acquired' } | { status: 'busy' }
  >;
  complete(key: string, owner: string, biography: ResearchedBiography): Promise<void>;
  fail(key: string, owner: string): Promise<void>;
}

export function isResearchedBiography(value: unknown): value is ResearchedBiography {
  if (!value || typeof value !== 'object'
    || !('fullBio' in value) || typeof value.fullBio !== 'string'
    || value.fullBio.trim().length < 150 || value.fullBio.length > 12000
    || !('checkedAt' in value) || typeof value.checkedAt !== 'string'
    || !Number.isFinite(Date.parse(value.checkedAt))
    || ('model' in value && (typeof value.model !== 'string' || !value.model.trim() || value.model.length > 200))
    || !('sources' in value) || !Array.isArray(value.sources)
    || !value.sources.length || value.sources.length > 30) return false;
  return value.sources.every(source => source && typeof source === 'object'
    && 'url' in source && typeof source.url === 'string' && isBiographySourceUrl(source.url)
    && 'title' in source && typeof source.title === 'string');
}

/** Accept only segments attributed to retrieved web sources, not uncited model prose. */
export function readGroundedBiography(name: string, response: GenerateContentResponse): ResearchedBiography {
  const candidate = response.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new Error('Biografía incompleta.');
  const metadata = candidate.groundingMetadata;
  if (!metadata?.webSearchQueries?.length) throw new Error('La biografía no realizó búsqueda.');
  const sources = new Map<string, { url: string; title: string }>();
  const segments = new Set<string>();
  for (const support of metadata.groundingSupports || []) {
    const text = support.segment?.text?.trim();
    if (!text || !response.text?.includes(text)) continue;
    const references = (support.groundingChunkIndices || [])
      .map(index => metadata.groundingChunks?.[index]?.web)
      .filter(web => web?.uri && isBiographySourceUrl(web.uri));
    if (!references.length) continue;
    segments.add(text);
    for (const web of references) {
      if (web?.uri) sources.set(web.uri, { url: web.uri, title: web.title || 'Fuente de búsqueda' });
    }
  }
  const fullBio = [...segments].join('\n\n');
  if (fullBio.length < 150 || fullBio.length > 12000 || !sources.size
    || !normalizeSaintName(fullBio).includes(normalizeSaintName(name))) {
    throw new Error('No se encontró una biografía respaldada para esta identidad.');
  }
  const biography = { fullBio, sources: [...sources.values()], checkedAt: new Date().toISOString() };
  if (!isResearchedBiography(biography)) throw new Error('Biografía con fuentes inválida.');
  return biography;
}

export class SaintBiographies {
  private cache = new ExpiringCache<ResearchedBiography>(400, 30 * 24 * 60 * 60 * 1000);
  private requests = new Map<string, Promise<ResearchedBiography>>();
  private failures = new ExpiringCache<Error>(400, 60000);
  constructor(
    private readonly store: BiographyStore,
    private readonly research: (name: string) => Promise<ResearchedBiography> = researchBiography,
  ) {}

  async get(name: string): Promise<ResearchedBiography> {
    const key = normalizeSaintName(name);
    const cached = this.cache.get(key);
    if (cached) return cached;
    const running = this.requests.get(key);
    if (running) return running;
    const failure = this.failures.get(key);
    if (failure) throw failure;
    const request = this.load(key, name).then(result => {
      this.cache.set(key, result);
      return result;
    }).catch((error: unknown) => {
      const failure = error instanceof Error ? error : new Error('Consulta biográfica fallida.');
      this.failures.set(key, failure);
      throw failure;
    }).finally(() => this.requests.delete(key));
    this.requests.set(key, request);
    return request;
  }

  private async load(key: string, name: string): Promise<ResearchedBiography> {
    const owner = randomUUID();
    const claim = await withTimeout(this.store.claim(key, owner), 10000);
    if (claim.status === 'ready') {
      if (!isResearchedBiography(claim.biography)
        || !normalizeSaintName(claim.biography.fullBio).includes(key)) {
        throw new Error('Biografía persistida inválida para esta identidad.');
      }
      return claim.biography;
    }
    if (claim.status === 'busy') throw new Error('Biografía en preparación; vuelve a consultar en un minuto.');
    try {
      const biography = await this.research(name);
      if (!isResearchedBiography(biography)
        || !normalizeSaintName(biography.fullBio).includes(key)) {
        throw new Error('Biografía con fuentes inválida para esta identidad.');
      }
      await withTimeout(this.store.complete(key, owner, biography), 10000);
      return biography;
    } catch (error) {
      try { await withTimeout(this.store.fail(key, owner), 3000); }
      catch { console.error('No se pudo actualizar la reserva de biografía.'); }
      throw error;
    }
  }
}

export async function researchBiography(
  name: string,
  provider?: Pick<GoogleGenAI['models'], 'generateContent'>,
): Promise<ResearchedBiography> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') throw new Error('Servicio de biografías no configurado.');
  const modelsApi = provider || new GoogleGenAI({
    apiKey: key,
    httpOptions: { timeout: 15000, retryOptions: { attempts: 1 } },
  }).models;
  const contents = `Busca la biografía o historia de la conmemoración católica cuyo nombre exacto es ${JSON.stringify(name)}.
No selecciones otro santo por fecha. Resuelve su identidad; si es ambigua, no redactes biografía.
Consulta preferentemente Santa Sede, Vatican News, Catholic.net, ACI Prensa o OCA.
Escribe en español un resumen original de 150 a 220 palabras, con hechos respaldados por las fuentes consultadas.
Incluye el nombre exacto en la primera frase. Cada frase debe tener respaldo de búsqueda.
No inventes fechas, milagros, patronazgos ni oraciones. Distingue tradiciones de hechos documentados.
Si no encuentras fuentes, devuelve solo "Sin fuentes suficientes".
Texto plano, sin títulos ni Markdown; no copies extensamente el texto de las fuentes.`;
  const models = [...new Set([process.env.GEMINI_MODEL || 'gemini-3.8-flash', 'gemini-3.8-flash'])];
  for (const [index, model] of models.entries()) {
    try {
      const response = await modelsApi.generateContent({
        model, contents, config: { tools: [{ googleSearch: {} }], temperature: 0.1 },
      });
      return { ...readGroundedBiography(name, response), model };
    } catch (error) {
      const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
      if (status === 404 && index + 1 < models.length) {
        console.warn('Modelo biográfico no disponible; se intentará el modelo alternativo.', { model });
        continue;
      }
      throw error;
    }
  }
  throw new Error('No hay un modelo biográfico disponible.');
}

let shared: SaintBiographies | undefined;
export function getSharedBiography(name: string): Promise<ResearchedBiography> {
  shared ||= new SaintBiographies(neonBiographyStore());
  return shared.get(name);
}
