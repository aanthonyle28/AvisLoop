-- Migration: 20260226_add_frozen_enrollment_status
-- Purpose: Add 'frozen' status for campaign pause/resume. Frozen enrollments
-- preserve touch position while campaign is paused. When the campaign is resumed,
-- frozen enrollments are restored to 'active' with adjusted scheduled times.
--
-- Part of: Phase 46 - Drawer Consistency + Campaign Freeze Fix (46-01)

-- ============================================================================
-- 1. ALTER the status CHECK constraint to include 'frozen'
-- ============================================================================
ALTER TABLE public.campaign_enrollments
  DROP CONSTRAINT enrollments_status_valid,
  ADD CONSTRAINT enrollments_status_valid CHECK (
    status IN ('active', 'completed', 'stopped', 'frozen')
  );

-- ============================================================================
-- 2. Expand the partial unique index to prevent duplicate frozen+active
--    enrollments for the same customer+campaign
-- ============================================================================
DROP INDEX IF EXISTS idx_enrollments_unique_active;
CREATE UNIQUE INDEX idx_enrollments_unique_active
  ON public.campaign_enrollments (customer_id, campaign_id)
  WHERE status IN ('active', 'frozen');
