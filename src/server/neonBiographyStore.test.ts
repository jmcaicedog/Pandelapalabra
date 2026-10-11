import assert from 'node:assert/strict';
import { test } from 'node:test';
import pg from 'pg';
import { createNeonBiographyStore } from './neonBiographyStore.ts';

const owner = '11111111-1111-4111-8111-111111111111';
const biography = {
  fullBio: 'San Testigo. '.repeat(20),
  sources: [{ url: 'https://www.vatican.va/biografia', title: 'Santa Sede' }],
  checkedAt: '2026-10-11T01:00:00Z',
};

test('la biografía guardada se lee antes de consumir cuota o reservar generación', async t => {
  const pool = new pg.Pool();
  const queries: string[] = [];
  let released = false;
  t.mock.method(pool, 'connect', async () => ({
    async query(sql: string) {
      queries.push(sql);
      return { rows: sql.includes('SELECT status')
        ? [{ status: 'ready', biography, attempts: 3, waiting: false }] : [], rowCount: 1 };
    },
    release() { released = true; },
  }));
  assert.deepEqual(await createNeonBiographyStore(pool, 1).claim('san testigo', owner),
    { status: 'ready', biography });
  assert.ok(!queries.some(sql => sql.includes('biography_budgets') || sql.includes('INSERT INTO')));
  assert.ok(queries.some(sql => sql.includes('pg_advisory_xact_lock(73122')));
  assert.equal(queries.at(-1), 'COMMIT');
  assert.ok(released);
  await pool.end();
});

test('reservas vigentes, intentos y cuota agotados no generan nuevas reservas', async t => {
  for (const scenario of ['busy', 'attempts', 'budget']) {
    const pool = new pg.Pool();
    const queries: string[] = [];
    t.mock.method(pool, 'connect', async () => ({
      async query(sql: string) {
        queries.push(sql);
        return { rows: sql.includes('SELECT status') && scenario !== 'budget'
          ? [{ status: 'generating', attempts: scenario === 'attempts' ? 3 : 1, waiting: scenario === 'busy' }]
          : [], rowCount: 0 };
      },
      release() {},
    }));
    const request = createNeonBiographyStore(pool, 1).claim('san testigo', owner);
    if (scenario === 'busy') assert.deepEqual(await request, { status: 'busy' });
    else await assert.rejects(request, scenario === 'attempts' ? /Intentos/ : /Límite diario/);
    assert.ok(!queries.some(sql => sql.includes('INSERT INTO public.saint_biographies')));
    assert.equal(queries.at(-1), scenario === 'busy' ? 'COMMIT' : 'ROLLBACK');
    await pool.end();
  }
});

test('guardar exige la reserva propia y fallar nunca degrada una biografía terminada', async t => {
  const pool = new pg.Pool();
  const calls: { sql: string; values: unknown[] }[] = [];
  t.mock.method(pool, 'query', async (sql: string, values: unknown[]) => {
    calls.push({ sql, values });
    return { rows: [], rowCount: 0 };
  });
  const store = createNeonBiographyStore(pool, 100);
  await assert.rejects(store.complete('san testigo', owner, biography), /Reserva/);
  await store.fail('san testigo', owner);
  assert.ok(calls.every(call => call.sql.includes("status = 'generating'") && call.sql.includes('owner = $2')));
  assert.deepEqual(JSON.parse(String(calls[0].values[2])), biography);
  await pool.end();
});

test('persiste el modelo realmente utilizado y los metadatos de la biografía', async t => {
  const pool = new pg.Pool();
  const values: unknown[][] = [];
  t.mock.method(pool, 'query', async (_sql: string, params: unknown[]) => {
    values.push(params);
    return { rows: [{ saint_key: 'san testigo' }], rowCount: 1 };
  });
  const generated = { ...biography, model: 'grounded-model' };
  await createNeonBiographyStore(pool, 100).complete('san testigo', owner, generated);
  assert.equal(values[0][3], 'grounded-model');
  assert.deepEqual(JSON.parse(String(values[0][2])), generated);
  await pool.end();
});
