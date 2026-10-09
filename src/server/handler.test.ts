import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import apiHandler from '../../api/index.ts';

test('contrato HTTP: rutas, métodos, fechas, JSON y fallos explícitos de IA', async t => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const server = createServer(apiHandler);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const health = await fetch(`${base}/api?__path=health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).region, 'Colombia');
  assert.equal((await fetch(`${base}/api/spiritual-counsel`, { method: 'POST' })).status, 404);
  assert.equal((await fetch(`${base}/api/reflection`)).status, 405);
  assert.equal((await fetch(`${base}/api/liturgy?date=2026-02-29`)).status, 400);
  const post = (body: string, contentType = 'application/json') => fetch(`${base}/api/reflection`, {
    method: 'POST', headers: { 'Content-Type': contentType }, body,
  });
  assert.equal((await post('{}', 'text/plain')).status, 415);
  assert.equal((await post('{')).status, 400);
  assert.equal((await post('[]')).status, 400);
  assert.equal((await post(JSON.stringify({ date: '2026-02-29' }))).status, 400);
  assert.equal((await post(JSON.stringify({ date: '2026-10-07', question: 'No permitido' }))).status, 400);
  assert.equal((await post(JSON.stringify({ date: '2026-10-07', text: 'x'.repeat(100001) }))).status, 413);
  const unavailable = await post(JSON.stringify({ date: '2026-10-07' }));
  assert.equal(unavailable.status, 503);
  const body = await unavailable.json();
  assert.equal(body.fallback, true);
  assert.equal(body.reflection, undefined);
  assert.match(body.fallbackUrl, /^https:\/\/www\.vaticannews\.va\//);
});
