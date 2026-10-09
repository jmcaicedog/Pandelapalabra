CREATE TABLE IF NOT EXISTS public.daily_reflections (
  date date PRIMARY KEY CHECK (date BETWEEN DATE '1583-01-01' AND DATE '9999-12-31'),
  status text NOT NULL CHECK (status IN ('generating', 'ready', 'failed')),
  owner uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts BETWEEN 1 AND 3),
  reflection text,
  model text,
  prompt_version text,
  retry_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'ready' AND reflection IS NOT NULL AND length(btrim(reflection)) > 0)
    OR (status <> 'ready' AND reflection IS NULL))
);

CREATE TABLE IF NOT EXISTS public.reflection_budgets (
  date date PRIMARY KEY,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0)
);

REVOKE ALL ON public.daily_reflections, public.reflection_budgets FROM PUBLIC;
