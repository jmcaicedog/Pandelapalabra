import type pg from 'pg';
import { createNeonPool } from './neonReflectionStore.js';
import { isResearchedBiography, type BiographyStore } from './saintBiographies.js';

interface BiographyRow {
  status: 'generating' | 'ready' | 'failed';
  biography: unknown;
  attempts: number;
  waiting: boolean;
}

export function createNeonBiographyStore(pool: pg.Pool, dailyLimit: number): BiographyStore {
  if (!Number.isSafeInteger(dailyLimit) || dailyLimit < 1) throw new Error('Límite diario biográfico inválido.');
  return {
    async claim(key, owner) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(73122, hashtext($1))', [key]);
        const existing = await client.query<BiographyRow>(
          `SELECT status, biography, attempts, retry_after > now() AS waiting
           FROM public.saint_biographies WHERE saint_key = $1`, [key],
        );
        const row = existing.rows[0];
        if (row?.status === 'ready') {
          if (!isResearchedBiography(row.biography)) throw new Error('Biografía persistida inválida.');
          await client.query('COMMIT');
          return { status: 'ready', biography: row.biography };
        }
        if (row?.waiting) {
          await client.query('COMMIT');
          return { status: 'busy' };
        }
        if (row && row.attempts >= 3) throw new Error('Intentos biográficos agotados; requiere revisión.');
        await client.query(
          `INSERT INTO public.biography_budgets (date, count)
           VALUES ((now() AT TIME ZONE 'America/Bogota')::date, 0) ON CONFLICT (date) DO NOTHING`,
        );
        const budget = await client.query(
          `UPDATE public.biography_budgets SET count = count + 1
           WHERE date = (now() AT TIME ZONE 'America/Bogota')::date AND count < $1 RETURNING count`,
          [dailyLimit],
        );
        if (budget.rowCount !== 1) throw new Error('Límite diario de biografías alcanzado.');
        await client.query(
          `INSERT INTO public.saint_biographies (saint_key, status, owner, attempts, retry_after)
           VALUES ($1, 'generating', $2, 1, now() + interval '180 seconds')
           ON CONFLICT (saint_key) DO UPDATE SET status = 'generating', owner = EXCLUDED.owner,
             attempts = saint_biographies.attempts + 1, retry_after = EXCLUDED.retry_after,
             updated_at = now()`, [key, owner],
        );
        await client.query('COMMIT');
        return { status: 'acquired' };
      } catch (error) {
        try { await client.query('ROLLBACK'); }
        catch { console.error('No se pudo cerrar la transacción de biografía.'); }
        throw error;
      } finally {
        client.release();
      }
    },
    async complete(key, owner, biography) {
      if (!isResearchedBiography(biography)) throw new Error('Biografía con fuentes inválida.');
      const result = await pool.query(
        `UPDATE public.saint_biographies SET status = 'ready', biography = $3::jsonb,
           model = $4, prompt_version = 'saint-grounded-v1', retry_after = NULL, updated_at = now()
         WHERE saint_key = $1 AND owner = $2 AND status = 'generating' RETURNING saint_key`,
        [key, owner, JSON.stringify(biography), biography.model || process.env.GEMINI_MODEL || 'gemini-3.8-flash'],
      );
      if (result.rowCount !== 1) throw new Error('Reserva de biografía perdida.');
    },
    async fail(key, owner) {
      await pool.query(
        `UPDATE public.saint_biographies SET status = 'failed', retry_after = now() + interval '60 seconds',
           updated_at = now() WHERE saint_key = $1 AND owner = $2 AND status = 'generating'`, [key, owner],
      );
    },
  };
}

export function neonBiographyStore(): BiographyStore {
  const limit = Number(process.env.BIOGRAPHY_DAILY_LIMIT || 100);
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Límite diario biográfico inválido.');
  return createNeonBiographyStore(createNeonPool(), limit);
}
