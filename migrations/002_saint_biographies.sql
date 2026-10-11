CREATE TABLE IF NOT EXISTS public.saint_biographies (
  saint_key text PRIMARY KEY CHECK (length(saint_key) BETWEEN 1 AND 500),
  status text NOT NULL CHECK (status IN ('generating', 'ready', 'failed')),
  owner uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts BETWEEN 1 AND 3),
  biography jsonb,
  model text,
  prompt_version text,
  retry_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'ready' AND biography IS NOT NULL AND jsonb_typeof(biography) = 'object')
    OR (status <> 'ready' AND biography IS NULL))
);

CREATE TABLE IF NOT EXISTS public.biography_budgets (
  date date PRIMARY KEY,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0)
);

REVOKE ALL ON public.saint_biographies, public.biography_budgets FROM PUBLIC;
