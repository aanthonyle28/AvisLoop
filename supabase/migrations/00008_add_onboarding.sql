-- Run in Supabase SQL Editor
-- Migration: 00008_add_onboarding.sql
-- Purpose: Add onboarding tracking columns to businesses table

-- ============================================================================
-- Add onboarding tracking columns to businesses
-- ============================================================================
-- onboarding_completed_at: NULL until wizard completed, timestamp when done
-- onboarding_steps_completed: Array of step IDs for granular tracking

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_steps_completed JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- Create index for querying incomplete onboardings
-- ============================================================================
-- Useful for admin dashboards to see users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_businesses_onboarding_incomplete
  ON public.businesses(user_id)
  WHERE onboarding_completed_at IS NULL;

-- ============================================================================
-- Add column comments for documentation
-- ============================================================================
COMMENT ON COLUMN public.businesses.onboarding_completed_at IS
  'Timestamp when user completed initial onboarding wizard. NULL means onboarding not completed.';

COMMENT ON COLUMN public.businesses.onboarding_steps_completed IS
  'JSONB array of completed step IDs for granular tracking. Example: ["business", "review-link", "contact", "send"]';

-- ============================================================================
-- Verification queries (run after migration to confirm):
-- ============================================================================
-- Check columns were added:
-- SELECT column_name, data_type, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'businesses'
--     AND column_name IN ('onboarding_completed_at', 'onboarding_steps_completed');
--
-- Check index was created:
-- SELECT indexname FROM pg_indexes
--   WHERE tablename = 'businesses'
--     AND indexname = 'idx_businesses_onboarding_incomplete';
