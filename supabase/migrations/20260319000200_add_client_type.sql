-- DATA-01: Add client_type discriminator column to businesses table
-- Branches behavior across the app: reputation clients use existing review
-- automation features; web_design clients get the new CRM/ticket/portal features;
-- both clients use all features simultaneously.
--
-- Default 'reputation' ensures all existing rows remain valid with no data migration.
-- NOT NULL with DEFAULT is a metadata-only operation in Postgres 11+ (no table rewrite,
-- no lock contention on existing rows).

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS client_type TEXT NOT NULL DEFAULT 'reputation'
    CHECK (client_type IN ('reputation', 'web_design', 'both'));

COMMENT ON COLUMN public.businesses.client_type IS
  'Client type discriminator. reputation = review automation only, web_design = web design CRM only, both = all features.';
