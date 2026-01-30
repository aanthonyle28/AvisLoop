-- Run in Supabase SQL Editor
-- Migration: 00011_onboarding_redesign.sql
-- Purpose: Add is_test flag to send_logs for test send tracking, update onboarding_steps_completed to object format

-- ============================================================================
-- Add is_test column to send_logs table
-- ============================================================================
-- is_test: Boolean flag to mark test/demo sends that should be excluded from quota counting

ALTER TABLE public.send_logs
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.send_logs.is_test IS
  'Marks test/demo sends that should be excluded from monthly quota counting. Used for onboarding test sends and internal demos.';

-- ============================================================================
-- Create partial index for quota queries excluding test sends
-- ============================================================================
-- Optimizes queries that count sends for quota enforcement by excluding test sends

CREATE INDEX IF NOT EXISTS idx_send_logs_quota_no_test
  ON public.send_logs(business_id, created_at)
  WHERE is_test = false;

-- ============================================================================
-- Update onboarding_steps_completed default to object format
-- ============================================================================
-- Changing from array format '[]' to object format '{}' to support key-value tracking
-- New pattern: { contact_created: bool, template_created: bool, test_sent: bool }

ALTER TABLE public.businesses
  ALTER COLUMN onboarding_steps_completed SET DEFAULT '{}'::jsonb;

-- Update existing column comment to reflect new structure
COMMENT ON COLUMN public.businesses.onboarding_steps_completed IS
  'JSONB object tracking post-wizard dashboard card completion. Keys: contact_created, template_created, test_sent. Example: {"contact_created": true, "template_created": false, "test_sent": false}';

-- ============================================================================
-- Verification queries (run after migration to confirm):
-- ============================================================================
-- Check is_test column was added:
-- SELECT column_name, data_type, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'send_logs'
--     AND column_name = 'is_test';
--
-- Check partial index was created:
-- SELECT indexname, indexdef FROM pg_indexes
--   WHERE tablename = 'send_logs'
--     AND indexname = 'idx_send_logs_quota_no_test';
--
-- Check onboarding_steps_completed default updated:
-- SELECT column_name, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'businesses'
--     AND column_name = 'onboarding_steps_completed';
