-- Add agency metadata columns to the businesses table
-- These columns store per-client tracking data for agency-managed businesses.
-- All columns are nullable so existing rows are unaffected (safe for live data).

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS google_rating_start NUMERIC(2,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_rating_current NUMERIC(2,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_count_start INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_count_current INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gbp_access BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS competitor_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS competitor_review_count INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS agency_notes TEXT DEFAULT NULL;

COMMENT ON COLUMN businesses.google_rating_start IS 'Google review rating at the time this client was onboarded. NUMERIC(2,1) for exact decimal precision.';
COMMENT ON COLUMN businesses.google_rating_current IS 'Current Google review rating. Updated manually. NUMERIC(2,1) for exact decimal precision.';
COMMENT ON COLUMN businesses.review_count_start IS 'Number of Google reviews at the time this client was onboarded.';
COMMENT ON COLUMN businesses.review_count_current IS 'Current number of Google reviews. Updated manually.';
COMMENT ON COLUMN businesses.monthly_fee IS 'Monthly retainer or service fee for this client in USD. NUMERIC(10,2) for currency precision.';
COMMENT ON COLUMN businesses.start_date IS 'Date when the agency relationship with this client began.';
COMMENT ON COLUMN businesses.gbp_access IS 'Whether the agency has access to the client''s Google Business Profile.';
COMMENT ON COLUMN businesses.competitor_name IS 'Primary competitor business name for tracking purposes.';
COMMENT ON COLUMN businesses.competitor_review_count IS 'Number of Google reviews the primary competitor currently has.';
COMMENT ON COLUMN businesses.agency_notes IS 'Free-form internal notes about this client. Not visible to the client.';
