-- Add intake_token column to businesses table for public client intake forms
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS intake_token TEXT DEFAULT NULL;

-- Unique partial index (only index non-null tokens)
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_intake_token
  ON public.businesses (intake_token)
  WHERE intake_token IS NOT NULL;
