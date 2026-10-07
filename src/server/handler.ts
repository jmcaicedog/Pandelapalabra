import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';
import { LITURGY_DATABASE } from '../data/liturgy.js';
import { buildCanonicalDay } from '../data/canonicalLectionary.js';
import { fetchEvangelizoDay } from '../data/evangelizo.js';

let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY no está configurada.');
    }
    genAIInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return genAIInstance;
}

const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

// Cache for homilies and counsel to conserve quota
const reflectionCache = new Map<string, { reflection: string; priestName: string; date: string; fallback: boolean }>();
const counselCache = new Map<string, { counsel: string; priestName: string; fallback: boolean }>();
const dynamicLiturgyCache = new Map<string, any>();

// Circuit breaker for quota limits (e.g. 429 RESOURCE_EXHAUSTED)
let quotaCooldownUntil = 0;

function isQuotaExhaustedError(err: any): boolean {
  const str = String(err?.message || err || '');
  const status = err?.status || err?.code;
  return (
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    str.includes('429') ||
    str.includes('quota') ||
    str.includes('RESOURCE_EXHAUSTED')
  );
}

async function generateWithFallback(
  prompt: string,
  systemInstruction: string,
  temperature = 0.65
): Promise<string | null> {
  if (Date.now() < quotaCooldownUntil) {
    // Quota cooldown active, avoid calling API to prevent 429 errors
    return null;
  }

  const ai = getGenAI();

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      if (isQuotaExhaustedError(err)) {
        // Active quota limit detected; pause API calls for 60 seconds
        quotaCooldownUntil = Date.now() + 60 * 1000;
        return null;
      }
      // If other transient error (503/500), continue to next model
    }
  }

  return null;
}

function getCanonicalHomily(date: string, saint: string, gospelQuote: string, gospel: string, reading2?: string): string {
  const isMatthew18 = gospelQuote.includes('18') || gospel.toLowerCase().includes('perdon') || gospel.toLowerCase().includes('setenta veces');
  
  const centralTheme = isMatthew18
    ? 'El Señor Jesús nos llama a vivir la medida divina del perdón: perdonar de corazón setenta veces siete, recordando que nosotros mismos hemos sido perdonados de una deuda impagable por el amor misericordioso del Padre celestial.'
    : 'El Señor Jesús nos llama a la conversión sincera y a configurar nuestra vida con su Evangelio de caridad, verdad y salvación eterna.';

  return `«La paz de Nuestro Señor Jesucristo esté con todos ustedes, queridos hermanos y hermanas en la fe.

En este día santo (${date}), la liturgia de la Santa Madre Iglesia nos invita a meditar con devoción el Santo Evangelio según ${gospelQuote}.

${centralTheme} ${reading2 ? `Asimismo, las lecturas de hoy nos recuerdan que tanto en la vida como en la muerte somos del Señor, y que ninguna ofrenda agrada tanto a Dios como un corazón reconciliado con sus hermanos.` : 'Las lecturas de hoy iluminan este mismo llamado: Dios sale a nuestro encuentro y espera de nosotros una respuesta de fe y de amor.'}

Propósito para hoy:
Antes de que termine el día, examinemos si guardamos algún rencor o distancia con algún prójimo; recemos un Padre Nuestro por esa persona y hagamos un gesto de paz y reconciliación sincera.

Oración y bendición sacerdotal:
Señor Jesucristo, Príncipe de la Paz y Pastor eterno, derrama tu amor en nuestros corazones y enséñanos a amar y perdonar como Tú nos amas.${saint ? ` Por la intercesión de ${saint}, escucha nuestra oración.` : ''}
Que la bendición de Dios todopoderoso, Padre, Hijo y Espíritu Santo, descienda sobre ustedes, sus hogares y sus seres queridos, y permanezca para siempre. Amén.»`;
}

function getCanonicalCounsel(question: string): string {
  return `Querido hermano en Cristo:

He llevado tu inquietud a la oración ante el Santísimo Sacramento: "${question.slice(0, 100)}${question.length > 100 ? '...' : ''}".

Recuerda las palabras que tantas veces nos repite el Señor en el Evangelio: «No teman, tengan fe» y «Vengan a mí todos los que están fatigados y agobiados, y yo les daré descanso» (Mt 11,28). 

En tu camino espiritual, te sugiero tres pasos concretos:
1. Acércate con confianza al sacramento de la Reconciliación (Confesión), manantial inagotable de gracia y purificación.
2. Persevera en la oración diaria con el Santo Rosario, entregando tus agobios al Inmaculado Corazón de la Virgen María.
3. Dedica un momento de silencio diario para escuchar la voz de Dios en las Sagradas Escrituras.

Encomiendo tus intenciones en la Santa Misa. Que la paz y la gracia del Señor Jesús inunden tu corazón. Te bendigo en el nombre del Padre, del Hijo y del Espíritu Santo. Amén.`;
}
function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (req.complete) {
    return Promise.resolve(req.body || {});
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  // 1. Health check
  if (pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    return true;
  }

  // 2. Catholic Liturgy of the Day for any date
  if (pathname === '/api/liturgy') {
    const dateParam = url.searchParams.get('date') || '';
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      sendJson(res, 400, { error: 'Se requiere una fecha válida en formato YYYY-MM-DD' });
      return true;
    }

    if (dynamicLiturgyCache.has(dateParam)) {
      sendJson(res, 200, dynamicLiturgyCache.get(dateParam));
      return true;
    }

    // 1. Official lectionary (Evangelizo) for any published date
    const official = await fetchEvangelizoDay(dateParam);
    if (official) {
      const curated = LITURGY_DATABASE[dateParam];
      const merged = curated
        ? { ...official, saint: curated.saint, defaultReflection: curated.defaultReflection }
        : official;
      dynamicLiturgyCache.set(dateParam, merged);
      sendJson(res, 200, merged);
      return true;
    }

    // 2. Curated local entry, then local calendar (never cached, so the official
    //    readings are picked up as soon as they're published or the service recovers)
    sendJson(res, 200, LITURGY_DATABASE[dateParam] || buildCanonicalDay(dateParam));
    return true;
  }

  // 3. Catholic Priest Homily Reflection
  if (pathname === '/api/reflection' && req.method === 'POST') {
    let body: any = {};
    try {
      body = await parseBody(req);
    } catch {
      body = {};
    }

    const {
      date = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      liturgicalTitle = 'Tiempo Ordinario',
      saint = 'Santos del día',
      reading1 = '',
      reading2 = '',
      psalm = '',
      gospel = '',
      gospelQuote = '',
    } = body;

    const cacheKey = `reflection_${date}_${gospelQuote}`;
    if (reflectionCache.has(cacheKey)) {
      sendJson(res, 200, reflectionCache.get(cacheKey));
      return true;
    }

    try {
      const prompt = `Liturgia del día: ${date} (${liturgicalTitle})

1) SANTO EVANGELIO — eje central de la homilía (${gospelQuote}):
${gospel}

2) LECTURAS — apoyo secundario:
Primera Lectura: ${reading1}
${reading2 ? `Segunda Lectura: ${reading2}\n` : ''}Salmo Responsorial: ${psalm}

3) SANTO DEL DÍA — solo para la oración final o la bendición, nunca como tema de la homilía: ${saint}

Predica una homilía breve (alrededor de 350-450 palabras) para los fieles siguiendo estrictamente las indicaciones.`;

      const systemInstruction = `Eres el Padre Mateo, un sacerdote católico fiel, piadoso, lleno del amor de Cristo y con gran celo por la salvación de las almas.
Tu tono es profundamente pastoral, paternal, fraterno y esperanzador, fiel a la Sagrada Tradición y al Magisterio de la Iglesia Católica.

Jerarquía de contenido (obligatoria):
- El Santo Evangelio es el centro: dedícale la mayor parte de la homilía, meditando las palabras y gestos de Jesús.
- Las lecturas (Primera Lectura, Segunda Lectura si la hay, y Salmo) solo iluminan o complementan el Evangelio; menciónalas brevemente.
- El Santo del Día NO forma parte de la reflexión. Como máximo, nómbralo en la oración final o en la bendición pidiendo su intercesión.

Reglas sobre las citas:
- No transcribas ni copies pasajes de las lecturas; los fieles ya los escucharon. Parafrasea con tus propias palabras.
- Si citas textualmente, usa solo una frase breve y completa (máximo 15 palabras), entre comillas, sin cortarla.
- Nunca uses puntos suspensivos (...) ni dejes frases o palabras incompletas.
- Para referirte a un pasaje usa su referencia bíblica (por ejemplo, Jn 1,47-51).

Estructura:
1. Saludo cálido ('La paz de Nuestro Señor Jesucristo esté con ustedes, queridos hermanos y hermanas').
2. Meditación sobre el Santo Evangelio.
3. Cómo las lecturas del día iluminan ese mismo mensaje.
4. Propósito práctico para el día: un consejo concreto de oración, caridad, paciencia o conversión cotidiana.
5. Oración final y bendición sacerdotal ('Que la bendición de Dios todopoderoso, Padre, Hijo y Espíritu Santo, descienda sobre ustedes y permanezca para siempre. Amén').

Escribe en texto plano, sin Markdown (sin asteriscos ni almohadillas).`;

      const text = await generateWithFallback(prompt, systemInstruction, 0.65);

      if (text) {
        const payload = {
          reflection: text,
          priestName: 'Padre Mateo',
          date,
          fallback: false,
        };
        reflectionCache.set(cacheKey, payload);
        sendJson(res, 200, payload);
        return true;
      }
    } catch {
      // Fall through to canonical homily
    }

    const fallbackReflection = getCanonicalHomily(date, saint, gospelQuote, gospel, reading2);
    const fallbackPayload = {
      reflection: fallbackReflection,
      priestName: 'Padre Mateo',
      date,
      fallback: true,
    };
    sendJson(res, 200, fallbackPayload);
    return true;
  }

  // 3. Spiritual Counsel with Catholic Priest
  if (pathname === '/api/spiritual-counsel' && req.method === 'POST') {
    let body: any = {};
    try {
      body = await parseBody(req);
    } catch {
      body = {};
    }
    const { question, context } = body;
    if (!question) {
      sendJson(res, 400, { error: 'Pregunta requerida' });
      return true;
    }

    const counselCacheKey = `counsel_${question.trim().toLowerCase().slice(0, 100)}`;
    if (counselCache.has(counselCacheKey)) {
      sendJson(res, 200, counselCache.get(counselCacheKey));
      return true;
    }

    try {
      const prompt = `Consulta espiritual del fiel: "${question}"\nContexto o lecturas del día: ${context || 'Ninguno'}`;
      const systemInstruction = `Eres el Padre Mateo, un confesor y director espiritual católico compasivo, sabio y ortodoxo.
Responde a las inquietudes del alma con caridad, doctrina católica sólida (Catecismo, Evangelio, santos doctores), prudencia pastoral y ternura.
Invita siempre a la oración, a los Santos Sacramentos (la Confesión y la Eucaristía) y al amor a la Santísima Virgen María.
Termina siempre con una bendición sacerdotal breve.`;

      const text = await generateWithFallback(prompt, systemInstruction, 0.7);

      if (text) {
        const payload = {
          counsel: text,
          priestName: 'Padre Mateo',
          fallback: false,
        };
        counselCache.set(counselCacheKey, payload);
        sendJson(res, 200, payload);
        return true;
      }
    } catch {
      // Fall through to canonical counsel
    }

    const fallbackCounsel = getCanonicalCounsel(question);
    const fallbackPayload = {
      counsel: fallbackCounsel,
      priestName: 'Padre Mateo',
      fallback: true,
    };
    counselCache.set(counselCacheKey, fallbackPayload);
    sendJson(res, 200, fallbackPayload);
    return true;
  }

  return false;
}
