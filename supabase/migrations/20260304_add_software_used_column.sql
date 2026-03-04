-- Phase 69: Add software_used column if missing (BUG-ONB-01)
-- The original migration 20260205044834 included this column but may not have been applied.
-- This is idempotent — safe to run even if the column already exists.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS software_used TEXT;

COMMENT ON COLUMN public.businesses.software_used IS 'CRM/field service software: servicetitan, jobber, housecall_pro, none, or NULL';
