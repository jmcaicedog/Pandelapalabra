import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { handleApiRoute, sendJson } from './src/server/handler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT inválido.');

app.use(async (req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    try {
    const handled = await handleApiRoute(req, res);
    if (handled) return;
    sendJson(res, 404, { error: 'Ruta no encontrada.' });
    } catch (error) {
      console.error('Error interno de API:', error);
      if (!res.headersSent) sendJson(res, 500, { error: 'Error interno del servidor.' });
    }
    return;
  }
  next();
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  if (path.extname(req.path)) {
    res.status(404).end();
    return;
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pan Vivo servidor ejecutándose en puerto ${PORT}`);
});
