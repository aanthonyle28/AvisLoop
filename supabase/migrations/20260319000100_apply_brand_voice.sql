-- BUG-01: Re-apply brand_voice column using ADD COLUMN IF NOT EXISTS
-- The original migration (20260305000100_add_brand_voice.sql) used plain ALTER TABLE
-- without IF NOT EXISTS. If the column already exists in production, this migration
-- is a no-op. If it does not exist (the bug condition), this adds it.
--
-- Root cause: 20260305000100_add_brand_voice.sql was never applied to production.
-- The column is declared in lib/types/database.ts and used in lib/actions/onboarding.ts
-- and lib/actions/personalize.ts, causing a Postgres error on save.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS brand_voice TEXT;

COMMENT ON COLUMN public.businesses.brand_voice IS
  'AI personalization tone preset. Stores preset key or "preset_key|custom description".';
