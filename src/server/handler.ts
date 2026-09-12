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

// Helper to parse JSON body
function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
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
    try {
      const body = await parseBody(req);
      const {
        date = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        liturgicalTitle = 'Tiempo Ordinario',
        saint = 'Santos del día',
        reading1 = '',
        psalm = '',
        gospel = '',
        gospelQuote = '',
      } = body;

      const ai = getGenAI();
      const prompt = `Liturgia del día: ${date} (${liturgicalTitle})
Santo del día: ${saint}
Primera Lectura: ${reading1}
Salmo Responsorial: ${psalm}
Santo Evangelio (${gospelQuote}):
"${gospel}"

Por favor, como un santo sacerdote católico, predica una homilía o reflexión breve (alrededor de 350-450 palabras) para los fieles.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `Eres el Padre Mateo, un sacerdote católico fiel, piadoso, lleno del amor de Cristo y con gran celo por la salvación de las almas.
Tu tono es profundamente pastoral, paternal, fraterno y esperanzador, fiel a la Sagrada Tradición y al Magisterio de la Iglesia Católica.
Estructura tu homilía así:
1. Saludo cálido y bendición inicial ('La paz de Nuestro Señor Jesucristo esté con ustedes, queridos hermanos y hermanas').
2. Meditación sobre el Santo Evangelio proclamado: profundiza en las palabras y gestos de Jesús con sencillez evangélica y unción espiritual. Si aplica, enlaza con el testimonio del Santo del Día.
3. Propósito práctico para el día: un consejo concreto y consolador de oración, caridad, paciencia o conversión cotidiana.
4. Oración final y bendición sacerdotal ('Que la bendición de Dios todopoderoso, Padre, Hijo y Espíritu Santo, descienda sobre ustedes y permanezca para siempre. Amén').`,
          temperature: 0.65,
        }
      });

      sendJson(res, 200, {
        reflection: response.text,
        priestName: 'Padre Mateo',
        date,
      });
      return true;
    } catch (error: any) {
      console.error('Error generating reflection:', error);
      sendJson(res, 500, {
        error: error?.message || 'Error al generar la reflexión sacerdotal',
        fallback: true
      });
      return true;
    }
  }

  // 3. Spiritual Counsel with Catholic Priest
  if (pathname === '/api/spiritual-counsel' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { question, context } = body;
      if (!question) {
        sendJson(res, 400, { error: 'Pregunta requerida' });
        return true;
      }

      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Consulta espiritual del fiel: "${question}"\nContexto o lecturas del día: ${context || 'Ninguno'}`,
        config: {
          systemInstruction: `Eres el Padre Mateo, un confesor y director espiritual católico compasivo, sabio y ortodoxo.
Responde a las inquietudes del alma con caridad, doctrina católica sólida (Catecismo, Evangelio, santos doctores), prudencia pastoral y ternura.
Invita siempre a la oración, a los Santos Sacramentos (la Confesión y la Eucaristía) y al amor a la Santísima Virgen María.
Termina siempre con una bendición sacerdotal breve.`,
          temperature: 0.7,
        }
      });

      sendJson(res, 200, {
        counsel: response.text,
        priestName: 'Padre Mateo',
      });
      return true;
    } catch (error: any) {
      console.error('Error in spiritual counsel:', error);
      sendJson(res, 500, { error: error?.message || 'Error al consultar' });
      return true;
    }
  }

  // 4. Catholic Bible API Proxy (to bypass CORS and cache results from https://apibiblia.vercel.app)
  if (pathname.startsWith('/api/biblia/')) {
    const subpath = pathname.replace('/api/biblia', '');
    const targetUrl = `https://apibiblia.vercel.app/api${subpath}${url.search}`;
    try {
      const resp = await fetch(targetUrl, {
        headers: { 'Accept': 'application/json' },
      });
      if (!resp.ok) {
        sendJson(res, resp.status, { error: `Error desde API Biblia externa (${resp.status})` });
        return true;
      }
      const data = await resp.json();
      sendJson(res, 200, data);
      return true;
    } catch (err: any) {
      console.error('Proxy error fetching Catholic Bible API:', err);
      sendJson(res, 502, { error: 'No se pudo conectar con la API de la Biblia' });
      return true;
    }
  }

  return false;
}
