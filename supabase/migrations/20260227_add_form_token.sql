-- Add form_token column to businesses table for public job completion form
-- Generated on demand via Settings (not at business creation time)

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS form_token TEXT DEFAULT NULL;

-- Unique partial index for fast token lookups (only indexes non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_form_token
  ON public.businesses (form_token)
  WHERE form_token IS NOT NULL;

COMMENT ON COLUMN businesses.form_token IS 'Unique token for public job completion form URL. Generated on demand via Settings.';
