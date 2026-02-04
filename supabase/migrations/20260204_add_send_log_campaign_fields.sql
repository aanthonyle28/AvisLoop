-- Migration: 20260204_add_send_log_campaign_fields
-- Purpose: Extend send_logs with campaign tracking fields
-- Part of: Phase 24 - Multi-Touch Campaign Engine (CAMP-08, OPS-03)

-- ============================================================================
-- 1. Add campaign fields to send_logs
-- ============================================================================

-- Campaign reference (nullable for manual sends)
ALTER TABLE public.send_logs
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Enrollment reference (nullable for manual sends)
ALTER TABLE public.send_logs
  ADD COLUMN IF NOT EXISTS campaign_enrollment_id UUID REFERENCES public.campaign_enrollments(id) ON DELETE SET NULL;

-- Touch number within campaign (nullable for manual sends)
ALTER TABLE public.send_logs
  ADD COLUMN IF NOT EXISTS touch_number INT;

-- Channel (email or sms) - defaults to 'email' for backward compatibility
ALTER TABLE public.send_logs
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'email';

-- ============================================================================
-- 2. Add constraints
-- ============================================================================

-- Touch number must be 1-4 if present
ALTER TABLE public.send_logs
  ADD CONSTRAINT send_logs_touch_number_valid
  CHECK (touch_number IS NULL OR touch_number BETWEEN 1 AND 4);

-- Channel must be email or sms
ALTER TABLE public.send_logs
  ADD CONSTRAINT send_logs_channel_valid
  CHECK (channel IN ('email', 'sms'));

-- ============================================================================
-- 3. Create index for campaign analytics
-- ============================================================================

-- Index for campaign performance queries
CREATE INDEX idx_send_logs_campaign
  ON public.send_logs (campaign_id, touch_number)
  WHERE campaign_id IS NOT NULL;

-- Index for enrollment lookups (used in webhook stop conditions)
CREATE INDEX idx_send_logs_enrollment
  ON public.send_logs (campaign_enrollment_id)
  WHERE campaign_enrollment_id IS NOT NULL;

-- ============================================================================
-- Migration complete
-- ============================================================================
