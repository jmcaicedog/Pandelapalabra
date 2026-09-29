import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';

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

function getCanonicalHomily(date: string, saint: string, gospelQuote: string, gospel: string): string {
  return `«La paz de Nuestro Señor Jesucristo esté con todos ustedes, queridos hermanos y hermanas en la fe.

En este día santo (${date}), la liturgia de la Iglesia nos invita a meditar con unción el Evangelio (${gospelQuote}):
«${gospel.slice(0, 220)}${gospel.length > 220 ? '...' : ''}»

El Señor Jesús nos llama a mirarnos con autenticidad y verdad ante Dios. Con frecuencia nos fijamos en la mota en el ojo ajeno, olvidando que nosotros mismos somos necesitados de la infinita misericordia del Padre. Como nos enseña el testimonio de ${saint || 'nuestros santos protectores'}, la santidad no consiste en juzgar o condenar a los demás, sino en dejarnos transformar dócilmente por la gracia y el amor salvador de Cristo.

Propósito para hoy:
Antes de emitir un juicio apresurado o guardar resentimiento hacia un hermano, detengamos nuestros pensamientos, recemos un Avemaría pidiendo mansedumbre y hagamos un acto sincero de caridad oculta.

Oración y bendición sacerdotal:
Señor Jesús, Luz del mundo y Médico de los corazones, limpia nuestras almas de toda soberbia y concédenos la paz que solo Tú puedes dar.
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

  // 2. Catholic Priest Homily Reflection
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
Santo del día: ${saint}
Primera Lectura: ${reading1}
Salmo Responsorial: ${psalm}
Santo Evangelio (${gospelQuote}):
"${gospel}"

Por favor, como un santo sacerdote católico, predica una homilía o reflexión breve (alrededor de 350-450 palabras) para los fieles.`;

      const systemInstruction = `Eres el Padre Mateo, un sacerdote católico fiel, piadoso, lleno del amor de Cristo y con gran celo por la salvación de las almas.
Tu tono es profundamente pastoral, paternal, fraterno y esperanzador, fiel a la Sagrada Tradición y al Magisterio de la Iglesia Católica.
Estructura tu homilía así:
1. Saludo cálido y bendición inicial ('La paz de Nuestro Señor Jesucristo esté con ustedes, queridos hermanos y hermanas').
2. Meditación sobre el Santo Evangelio proclamado: profundiza en las palabras y gestos de Jesús con sencillez evangélica y unción espiritual. Si aplica, enlaza con el testimonio del Santo del Día.
3. Propósito práctico para el día: un consejo concreto y consolador de oración, caridad, paciencia o conversión cotidiana.
4. Oración final y bendición sacerdotal ('Que la bendición de Dios todopoderoso, Padre, Hijo y Espíritu Santo, descienda sobre ustedes y permanezca para siempre. Amén').`;

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

    const fallbackReflection = getCanonicalHomily(date, saint, gospelQuote, gospel);
    const fallbackPayload = {
      reflection: fallbackReflection,
      priestName: 'Padre Mateo',
      date,
      fallback: true,
    };
    reflectionCache.set(cacheKey, fallbackPayload);
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
