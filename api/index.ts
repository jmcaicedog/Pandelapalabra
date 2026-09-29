import type { IncomingMessage, ServerResponse } from 'http';
import { handleApiRoute } from '../src/server/handler.js';

// vercel.json rewrites /api/<path> to /api?__path=<path>; restore the original URL for the shared handler.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'http://localhost');
  const original = url.searchParams.get('__path');
  if (original !== null) {
    url.searchParams.delete('__path');
    const query = url.searchParams.toString();
    req.url = `/api/${original}${query ? `?${query}` : ''}`;
  }

  const handled = await handleApiRoute(req, res);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
  }
}
