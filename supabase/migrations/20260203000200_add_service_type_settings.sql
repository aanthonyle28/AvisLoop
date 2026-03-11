-- Migration: 20260203_add_service_type_settings
-- Purpose: Add service type enabled list and timing defaults to businesses
-- Part of: Phase 22 - Jobs CRUD & Service Types (SVCT-01, SVCT-02)

-- ============================================================================
-- 1. Add service types enabled column (array of enabled service types)
-- ============================================================================
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS service_types_enabled TEXT[] DEFAULT '{}';

-- ============================================================================
-- 2. Add service type timing defaults (hours until first campaign touch)
-- ============================================================================
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS service_type_timing JSONB DEFAULT '{
    "hvac": 24,
    "plumbing": 48,
    "electrical": 24,
    "cleaning": 4,
    "roofing": 72,
    "painting": 48,
    "handyman": 24,
    "other": 24
  }'::jsonb;

-- ============================================================================
-- 3. Comment on columns for documentation
-- ============================================================================
COMMENT ON COLUMN public.businesses.service_types_enabled IS
  'Array of service types this business offers. Selected during onboarding. Used to filter job creation options.';

COMMENT ON COLUMN public.businesses.service_type_timing IS
  'JSONB map of service type to hours until first campaign touch. Default timing auto-applied when creating campaigns.';

-- ============================================================================
-- Migration complete
-- ============================================================================
