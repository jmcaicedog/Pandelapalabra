import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import apiHandler from '../../api/index.ts';
import { generateReflection } from './handler.ts';
import { GenerateContentResponse } from '@google/genai';

test('dos 504 de Gemini agotan el único modelo alternativo sin devolver texto parcial', async t => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key-not-used';
  t.after(() => {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  });
  const generateContent = t.mock.fn(async () => {
    throw Object.assign(new Error('DEADLINE_EXCEEDED'), { status: 504 });
  });
  await assert.rejects(generateReflection('Evangelio de prueba', 'Instrucciones de prueba', { generateContent }), {
    message: 'La generación tardó demasiado. Espera un minuto y vuelve a intentarlo.',
  });
  assert.equal(generateContent.mock.calls.length, 2);
});

test('un fallo transitorio usa el modelo alternativo y conserva el modelo que respondió', async t => {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = 'test-key-not-used';
  process.env.GEMINI_MODEL = 'gemini-3.8-flash';
  t.after(() => {
    if (key === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = key;
    if (model === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = model;
  });
  const calls: string[] = [];
  const generateContent = async (request: { model: string }) => {
    calls.push(request.model);
    if (calls.length === 1) throw Object.assign(new Error('Unavailable'), { status: 503 });
    const response = new GenerateContentResponse();
    response.candidates = [{
      content: { parts: [{ text: 'Párrafo uno.\n\nPárrafo dos.\n\nPropósito.\n\nOración.' }] },
    }];
    return response;
  };
  const result = await generateReflection('Evangelio', 'Instrucciones', { generateContent });
  assert.deepEqual(calls, ['gemini-3.8-flash', 'gemini-3.1-flash-lite']);
  assert.equal(result.model, 'gemini-3.1-flash-lite');
  assert.equal(result.promptVersion, 'gospel-four-paragraphs-v2');
  assert.equal(result.reflection.split('\n\n').length, 4);
});

test('errores de permisos no consumen un intento con otro modelo', async t => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key-not-used';
  t.after(() => {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  });
  const generateContent = t.mock.fn(async () => {
    throw Object.assign(new Error('PERMISSION_DENIED'), { status: 403 });
  });
  await assert.rejects(generateReflection('Evangelio', 'Instrucciones', { generateContent }), /PERMISSION_DENIED/);
  assert.equal(generateContent.mock.calls.length, 1);
});

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
