import type { IncomingMessage, ServerResponse } from 'http';
import { handleApiRoute, sendJson } from '../src/server/handler.js';

// vercel.json rewrites /api/<path> to /api?__path=<path>; restore the original URL for the shared handler.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'http://localhost');
  const original = url.searchParams.get('__path');
  if (original !== null) {
    url.searchParams.delete('__path');
    const query = url.searchParams.toString();
    req.url = `/api/${original}${query ? `?${query}` : ''}`;
  }

  try {
  const handled = await handleApiRoute(req, res);
  if (!handled) {
    sendJson(res, 404, { error: 'Ruta no encontrada' });
  }
  } catch (error) {
    console.error('Error interno de API:', error);
    if (!res.headersSent) sendJson(res, 500, { error: 'Error interno del servidor.' });
  }
}
