import pg from 'pg';
import type { ReflectionStore } from './sharedReflections.js';

interface ReflectionRow {
  status: 'generating' | 'ready' | 'failed';
  reflection: string | null;
  attempts: number;
  waiting: boolean;
}

export function createNeonReflectionStore(pool: pg.Pool, dailyLimit: number): ReflectionStore {
  if (!Number.isSafeInteger(dailyLimit) || dailyLimit < 1) throw new Error('Límite diario inválido.');
  return {
    async claim(date, owner) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Transaction-scoped locking works across instances, including Neon pooled connections.
        await client.query("SELECT pg_advisory_xact_lock(73121, hashtext($1))", [date]);
        const existing = await client.query<ReflectionRow>(
          `SELECT status, reflection, attempts, retry_after > now() AS waiting
           FROM public.daily_reflections WHERE date = $1`, [date],
        );
        const row = existing.rows[0];
        if (row?.status === 'ready') {
          if (!row.reflection?.trim()) throw new Error('Reflexión guardada inválida.');
          await client.query('COMMIT');
          return { status: 'ready', reflection: row.reflection };
        }
        if (row?.waiting) {
          await client.query('COMMIT');
          return { status: 'busy' };
        }
        if (row && row.attempts >= 3) throw new Error('Límite de intentos de esta fecha alcanzado; requiere revisión.');
        await client.query(
          `INSERT INTO public.reflection_budgets (date, count)
           VALUES ((now() AT TIME ZONE 'America/Bogota')::date, 0) ON CONFLICT (date) DO NOTHING`,
        );
        const budget = await client.query(
          `UPDATE public.reflection_budgets SET count = count + 1
           WHERE date = (now() AT TIME ZONE 'America/Bogota')::date AND count < $1 RETURNING count`,
          [dailyLimit],
        );
        if (budget.rowCount !== 1) throw new Error('Límite diario de generación alcanzado.');
        await client.query(
          `INSERT INTO public.daily_reflections (date, status, owner, attempts, retry_after)
           VALUES ($1, 'generating', $2, 1, now() + interval '180 seconds')
           ON CONFLICT (date) DO UPDATE SET status = 'generating', owner = EXCLUDED.owner,
             attempts = daily_reflections.attempts + 1, retry_after = EXCLUDED.retry_after,
             updated_at = now()`, [date, owner],
        );
        await client.query('COMMIT');
        return { status: 'acquired' };
      } catch (error) {
        try { await client.query('ROLLBACK'); }
        catch { console.error('No se pudo cerrar la transacción de reflexión.'); }
        throw error;
      } finally {
        client.release();
      }
    },
    async complete(date, owner, reflection, metadata) {
      const result = await pool.query(
        `UPDATE public.daily_reflections SET status = 'ready', reflection = $3, model = $4,
           prompt_version = $5, retry_after = NULL, updated_at = now()
         WHERE date = $1 AND owner = $2 AND status = 'generating' RETURNING date`,
        [date, owner, reflection, metadata?.model || process.env.GEMINI_MODEL || 'gemini-3.8-flash',
          metadata?.promptVersion || 'gospel-four-paragraphs-v2'],
      );
      if (result.rowCount !== 1) throw new Error('Reserva de reflexión perdida.');
    },
    async fail(date, owner) {
      // A completion may have committed despite a network timeout; never downgrade a ready row.
      await pool.query(
        `UPDATE public.daily_reflections SET status = 'failed', retry_after = now() + interval '60 seconds',
           updated_at = now() WHERE date = $1 AND owner = $2 AND status = 'generating'`, [date, owner],
      );
    },
  };
}

export function createNeonPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL de Neon no configurada.');
  let url: URL;
  try { url = new URL(connectionString); }
  catch { throw new Error('DATABASE_URL debe ser una URI PostgreSQL, no un comando psql.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Protocolo DATABASE_URL inválido.');
  url.searchParams.set('sslmode', 'verify-full');
  url.searchParams.delete('uselibpqcompat');
  const pool = new pg.Pool({
    connectionString: url.toString(), max: 3, connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000, statement_timeout: 10000, query_timeout: 12000,
    allowExitOnIdle: true, enableChannelBinding: true,
  });
  pool.on('error', () => console.error('Conexión inactiva de Neon interrumpida.'));
  return pool;
}

export function neonReflectionStore(): ReflectionStore {
  const dailyLimit = Number(process.env.REFLECTION_DAILY_LIMIT || 100);
  if (!Number.isSafeInteger(dailyLimit) || dailyLimit < 1) throw new Error('Límite diario inválido.');
  return createNeonReflectionStore(createNeonPool(), dailyLimit);
}
