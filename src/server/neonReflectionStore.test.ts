import assert from 'node:assert/strict';
import { test } from 'node:test';
import pg from 'pg';
import { createNeonReflectionStore } from './neonReflectionStore.ts';

test('una reflexión guardada se lee antes de consumir cuota o reservar generación', async t => {
  const pool = new pg.Pool();
  const queries: string[] = [];
  let released = false;
  t.mock.method(pool, 'connect', async () => ({
    async query(sql: string) {
      queries.push(sql);
      return sql.includes('SELECT status')
        ? { rows: [{ status: 'ready', reflection: 'Reflexión existente.', attempts: 1, waiting: false }], rowCount: 1 }
        : { rows: [], rowCount: 0 };
    },
    release() { released = true; },
  }));
  const store = createNeonReflectionStore(pool, 100);
  assert.deepEqual(await store.claim('2026-10-08', '11111111-1111-4111-8111-111111111111'), {
    status: 'ready', reflection: 'Reflexión existente.',
  });
  assert.ok(queries.some(sql => sql.includes('pg_advisory_xact_lock')));
  assert.ok(!queries.some(sql => sql.includes('reflection_budgets')));
  assert.ok(!queries.some(sql => sql.includes('INSERT INTO public.daily_reflections')));
  assert.equal(queries.at(-1), 'COMMIT');
  assert.ok(released);
  await pool.end();
});

test('reservas vigentes bloquean llamadas duplicadas sin incrementar intentos', async t => {
  const pool = new pg.Pool();
  const queries: string[] = [];
  t.mock.method(pool, 'connect', async () => ({
    async query(sql: string) {
      queries.push(sql);
      return { rows: sql.includes('SELECT status') ? [{
        status: 'generating', reflection: null, attempts: 1, waiting: true,
      }] : [], rowCount: 1 };
    },
    release() {},
  }));
  assert.deepEqual(await createNeonReflectionStore(pool, 100).claim('2026-10-08',
    '11111111-1111-4111-8111-111111111111'), { status: 'busy' });
  assert.ok(!queries.some(sql => sql.includes('reflection_budgets')));
  await pool.end();
});

test('la cuota agotada revierte la reserva y libera la conexión', async t => {
  const pool = new pg.Pool();
  const queries: string[] = [];
  let released = false;
  t.mock.method(pool, 'connect', async () => ({
    async query(sql: string) {
      queries.push(sql);
      return { rows: [], rowCount: 0 };
    },
    release() { released = true; },
  }));
  await assert.rejects(createNeonReflectionStore(pool, 1).claim('2026-10-08',
    '11111111-1111-4111-8111-111111111111'), /Límite diario/);
  assert.equal(queries.at(-1), 'ROLLBACK');
  assert.ok(!queries.some(sql => sql.includes('INSERT INTO public.daily_reflections')));
  assert.ok(released);
  await pool.end();
});

test('guardar exige la reserva propia y un fallo nunca degrada una reflexión terminada', async t => {
  const pool = new pg.Pool();
  const calls: { sql: string; values: unknown[] }[] = [];
  t.mock.method(pool, 'query', async (sql: string, values: unknown[]) => {
    calls.push({ sql, values });
    return { rows: [], rowCount: 0 };
  });
  const store = createNeonReflectionStore(pool, 100);
  const owner = '11111111-1111-4111-8111-111111111111';
  await assert.rejects(store.complete('2026-10-08', owner, 'Texto'), /Reserva/);
  await store.fail('2026-10-08', owner);
  assert.ok(calls.every(call => call.sql.includes("status = 'generating'") && call.sql.includes('owner = $2')));
  assert.deepEqual(calls[0].values.slice(0, 3), ['2026-10-08', owner, 'Texto']);
  await pool.end();
});
