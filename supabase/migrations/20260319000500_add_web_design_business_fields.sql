-- DATA-02: Add web design client fields to businesses table (Phase 72)
-- These fields store contact info, subscription tier, domain, and client status
-- for businesses with client_type = 'web_design' or 'both'.
-- All columns are nullable — existing reputation-only businesses are unaffected.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS owner_name         TEXT,
  ADD COLUMN IF NOT EXISTS owner_email        TEXT,
  ADD COLUMN IF NOT EXISTS owner_phone        TEXT,
  ADD COLUMN IF NOT EXISTS web_design_tier    TEXT
    CHECK (web_design_tier IN ('basic', 'advanced') OR web_design_tier IS NULL),
  ADD COLUMN IF NOT EXISTS domain             TEXT,
  ADD COLUMN IF NOT EXISTS vercel_project_url TEXT,
  ADD COLUMN IF NOT EXISTS live_website_url   TEXT,
  ADD COLUMN IF NOT EXISTS status             TEXT
    CHECK (status IN ('active', 'paused', 'churned') OR status IS NULL);

COMMENT ON COLUMN public.businesses.owner_name IS
  'Contact name for the web design client (may differ from business name).';
COMMENT ON COLUMN public.businesses.owner_email IS
  'Primary contact email for the web design client.';
COMMENT ON COLUMN public.businesses.owner_phone IS
  'Primary contact phone for the web design client.';
COMMENT ON COLUMN public.businesses.web_design_tier IS
  'Web design subscription tier: basic ($199/mo, 1-4 pages, 2 revisions/mo) or advanced ($299/mo, 4-10 pages, 4 revisions/mo).';
COMMENT ON COLUMN public.businesses.domain IS
  'Client website domain (e.g. plumbingpros.com) for the web design project.';
COMMENT ON COLUMN public.businesses.vercel_project_url IS
  'Vercel project dashboard URL for internal reference.';
COMMENT ON COLUMN public.businesses.live_website_url IS
  'Live public website URL once the site is launched.';
COMMENT ON COLUMN public.businesses.status IS
  'Client relationship status for web design clients: active, paused (temporarily not billing), or churned (cancelled).';
