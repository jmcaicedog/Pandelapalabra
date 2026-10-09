import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildCanonicalDay } from '../data/canonicalLectionary.js';
import { fetchEvangelizoDay } from '../data/evangelizo.js';
import { hasFreshReadings, type LiturgicalDay } from '../data/liturgy.js';
import { fetchColombianSantoral } from './colombianSantoral.js';
import { hasFreshSaintVerification } from '../data/colombianSaints.js';
import { isValidDateStr } from '../lib/dateUtils.js';
import { ExpiringCache } from '../lib/cache.js';
import { getSharedReflection, type GeneratedReflection } from './sharedReflections.js';

const liturgyCache = new ExpiringCache<LiturgicalDay>(120, 24 * 60 * 60 * 1000);
const liturgyRequests = new Map<string, Promise<LiturgicalDay>>();
let quotaCooldownUntil = 0;

export function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

class BodyError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

class ReflectionTimeoutError extends Error {
  constructor() {
    super('La generación tardó demasiado. Espera un minuto y vuelve a intentarlo.');
  }
}

async function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new BodyError('Se requiere Content-Type application/json.', 415);
  }
  const preParsed = 'body' in req ? req.body : undefined;
  let value: unknown;
  if (preParsed !== undefined) {
    if (Buffer.byteLength(JSON.stringify(preParsed)) > 100000) throw new BodyError('Solicitud demasiado grande.', 413);
    try { value = typeof preParsed === 'string' ? JSON.parse(preParsed) : preParsed; }
    catch { throw new BodyError('JSON inválido.', 400); }
  } else {
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      length += buffer.length;
      if (length > 100000) throw new BodyError('Solicitud demasiado grande.', 413);
      chunks.push(buffer);
    }
    const body = Buffer.concat(chunks).toString('utf8');
    try { value = JSON.parse(body); }
    catch { throw new BodyError('JSON inválido.', 400); }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BodyError('Se requiere un objeto JSON.', 400);
  return Object.fromEntries(Object.entries(value));
}

function field(body: Record<string, unknown>, name: string, max: number, required = false): string {
  const value = body[name];
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    throw new BodyError(`Campo inválido: ${name}.`, 400);
  }
  return value.trim();
}

export async function generateReflection(
  prompt: string,
  systemInstruction: string,
  provider?: Pick<GoogleGenAI['models'], 'generateContent'>,
): Promise<GeneratedReflection> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') {
    console.warn('Gemini: GEMINI_API_KEY ausente o con valor de ejemplo.');
    throw new Error('Servicio de IA no configurado.');
  }
  if (Date.now() < quotaCooldownUntil) throw new Error('Servicio de IA temporalmente limitado.');
  const models = provider || new GoogleGenAI({
      apiKey: key,
      httpOptions: { timeout: 40000, retryOptions: { attempts: 1 } },
  }).models;
  const candidates = [...new Set([
    process.env.GEMINI_MODEL || 'gemini-3.8-flash', 'gemini-3.1-flash-lite',
  ])];
  for (const [index, model] of candidates.entries()) {
    try {
    const response = await models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction, temperature: 0.65 },
    });
    if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
      console.warn('Gemini: respuesta incompleta.', { finishReason: response.candidates[0].finishReason });
      throw new Error('La IA no completó la reflexión; no se guarda un texto recortado.');
    }
    if (!response.text?.trim()) throw new Error('Respuesta de IA vacía.');
    return { reflection: response.text.trim(), model, promptVersion: 'gospel-four-paragraphs-v2' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const quota = /429|quota|RESOURCE_EXHAUSTED/i.test(message);
    if (quota) quotaCooldownUntil = Date.now() + 60000;
    // Do not log spiritual questions, reading text or credentials.
    const category = quota ? 'quota'
      : /API_KEY_INVALID|API key not valid/i.test(message) ? 'invalid_key'
      : /403|PERMISSION_DENIED/i.test(message) ? 'permission'
      : /404|NOT_FOUND/i.test(message) ? 'model_not_found'
      : /504|DEADLINE_EXCEEDED|timeout|timed out|abort/i.test(message) ? 'timeout'
      : /fetch|network|ECONN|ENOTFOUND/i.test(message) ? 'network'
      : /Respuesta de IA vacía/i.test(message) ? 'empty_response'
      : /no completó la reflexión/i.test(message) ? 'incomplete_response'
      : 'provider_or_response';
    const status = error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
      ? error.status : undefined;
    console.warn('El servicio de IA no pudo completar la solicitud.', { category, status, model });
    const transient = category === 'timeout' || status === 500 || status === 502 || status === 503 || status === 504;
    if (!quota && transient && index + 1 < candidates.length) {
      console.warn('Se intentará una única generación con el modelo alternativo.');
      continue;
    }
    if (category === 'timeout') throw new ReflectionTimeoutError();
    throw error;
  }
  }
  throw new Error('No hay un modelo de generación disponible.');
}

async function loadLiturgy(date: string): Promise<LiturgicalDay> {
  const cached = liturgyCache.get(date);
  if (cached && hasFreshReadings(cached) && hasFreshSaintVerification(cached.saintVerification, date)) return cached;
  const running = liturgyRequests.get(date);
  if (running) return running;
  const request = (async () => {
    const [readings, santoral] = await Promise.all([
      cached && hasFreshReadings(cached) ? Promise.resolve(cached) : fetchEvangelizoDay(date),
      fetchColombianSantoral(date),
    ]);
    const day = { ...(readings || cached || buildCanonicalDay(date)), ...santoral };
    if (!day.readingsPending) liturgyCache.set(date, day);
    return day;
  })().finally(() => liturgyRequests.delete(date));
  liturgyRequests.set(date, request);
  return request;
}

const AI_IDENTITY = `Eres un asistente de inteligencia artificial de orientación católica, no un sacerdote.
No afirmes haber celebrado sacramentos, ofrecido misas o bendiciones sacramentales, ni sustituir a un profesional.
Ofrece orientación respetuosa, prudente y fiel al Evangelio. No inventes citas ni hechos.
Escribe texto plano, completo y sin Markdown.`;

export async function handleApiRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  const routes: Record<string, string> = {
    '/api/health': 'GET', '/api/liturgy': 'GET',
    '/api/reflection': 'POST',
  };
  const method = routes[url.pathname];
  if (!method) return false;
  if (req.method !== method) {
    res.setHeader('Allow', method);
    sendJson(res, 405, { error: 'Método no permitido.' });
    return true;
  }
  if (url.pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString(), region: 'Colombia' });
    return true;
  }
  if (url.pathname === '/api/liturgy') {
    const date = url.searchParams.get('date');
    if (!isValidDateStr(date)) {
      sendJson(res, 400, { error: 'Se requiere una fecha real YYYY-MM-DD (1583–9999).' });
      return true;
    }
    sendJson(res, 200, await loadLiturgy(date));
    return true;
  }
  try {
    const body = await parseBody(req);
    if (url.pathname === '/api/reflection') {
      const date = field(body, 'date', 10, true);
      if (!isValidDateStr(date)) throw new BodyError('Fecha inválida.', 400);
      if (Object.keys(body).some(key => key !== 'date')) throw new BodyError('Solo se admite la fecha; no consultas personalizadas.', 400);
      const reflection = await getSharedReflection(date, async () => {
        const day = await loadLiturgy(date);
        if (!hasFreshReadings(day)) throw new Error('Lecturas verificadas no disponibles.');
        return generateReflection(
        `Fecha: ${date}. Celebración según Evangelizo: ${day.title}.\nEvangelio (${day.gospel.citation}): ${day.gospel.text}`,
        `${AI_IDENTITY}\nRedacta una meditación de 300–400 palabras en exactamente cuatro párrafos separados por una línea en blanco, centrada únicamente en el Evangelio proporcionado. En los dos primeros, explica y medita las palabras y gestos de Jesús sin inventar detalles ausentes del pasaje. En el tercero, aplica el Evangelio a la vida familiar y comunitaria e incluye un propósito cotidiano concreto. En el cuarto, termina con una oración breve. No repitas ideas ni presentes el texto como una homilía de un sacerdote real.`,
        );
      });
      sendJson(res, 200, { reflection, priestName: 'Asistente católico (IA)', date, fallback: false });
    }
  } catch (error) {
    if (error instanceof BodyError) sendJson(res, error.status, { error: error.message });
    else {
      console.warn('Reflexión compartida no disponible; revisar configuración, fuentes y cuota.');
      sendJson(res, 503, {
      error: error instanceof ReflectionTimeoutError
        ? error.message : 'La reflexión no está disponible. Puedes reintentar o consultar Vatican News.',
      code: error instanceof ReflectionTimeoutError ? 'generation_timeout' : 'reflection_unavailable',
      fallback: true,
      fallbackUrl: 'https://www.vaticannews.va/es/evangelio-de-hoy.html',
      });
    }
  }
  return true;
}
