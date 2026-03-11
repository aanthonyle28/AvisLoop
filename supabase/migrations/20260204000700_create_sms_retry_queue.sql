-- Migration: 20260204_create_sms_retry_queue
-- Purpose: Create sms_retry_queue table for deferred SMS retry handling
-- Context: Part of Phase 21 SMS Foundation - handles quiet hours deferrals and
--          Twilio error retries with atomic claim pattern matching scheduled_sends
--
-- RLS Note: SELECT/INSERT/UPDATE policies using businesses ownership subquery pattern
-- (no DELETE policy - use status='cancelled' instead for audit trail)

-- ============================================================================
-- Create sms_retry_queue table
-- ============================================================================
-- Stores SMS messages that need to be retried (quiet hours, rate limits, errors)
CREATE TABLE IF NOT EXISTS public.sms_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  send_log_id UUID NOT NULL REFERENCES public.send_logs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,

  -- Retry tracking
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  last_attempted_at TIMESTAMPTZ,
  last_error TEXT,

  -- Retry reason for analytics and debugging
  reason TEXT,  -- 'quiet_hours', 'twilio_error', 'rate_limit'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status validation
  CONSTRAINT sms_retry_queue_status_valid CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),

  -- Reason validation
  CONSTRAINT sms_retry_queue_reason_valid CHECK (
    reason IS NULL OR reason IN ('quiet_hours', 'twilio_error', 'rate_limit')
  )
);

-- ============================================================================
-- Performance indexes
-- ============================================================================
-- Index on business_id for FK lookups and scoped queries
CREATE INDEX IF NOT EXISTS idx_sms_retry_queue_business_id
  ON public.sms_retry_queue USING btree (business_id);

-- Partial index for cron claim query (only pending retries that are due)
-- Matches the scheduled_sends pattern for optimal claim performance
CREATE INDEX IF NOT EXISTS idx_sms_retry_queue_pending_due
  ON public.sms_retry_queue USING btree (status, scheduled_for)
  WHERE status = 'pending';

-- Index for listing by creation date (most recent first)
CREATE INDEX IF NOT EXISTS idx_sms_retry_queue_created_at
  ON public.sms_retry_queue USING btree (created_at DESC);

-- Index on send_log_id for looking up retries by original send
CREATE INDEX IF NOT EXISTS idx_sms_retry_queue_send_log_id
  ON public.sms_retry_queue USING btree (send_log_id);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
-- CRITICAL: Without this, all users can see all retry queue items
ALTER TABLE public.sms_retry_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for sms_retry_queue
-- ============================================================================
-- Use subquery pattern to check business ownership (same pattern as scheduled_sends)

-- Policy: Users can view retry queue items for their businesses
CREATE POLICY "Users view own sms_retry_queue"
  ON public.sms_retry_queue FOR SELECT
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Policy: Users can insert retry queue items for their businesses
CREATE POLICY "Users insert own sms_retry_queue"
  ON public.sms_retry_queue FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Policy: Users can update retry queue items for their businesses
CREATE POLICY "Users update own sms_retry_queue"
  ON public.sms_retry_queue FOR UPDATE
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- ============================================================================
-- Trigger for updated_at timestamps
-- ============================================================================
-- Use moddatetime extension (enabled in 00002_create_business.sql)
CREATE TRIGGER set_sms_retry_queue_updated_at
  BEFORE UPDATE ON public.sms_retry_queue
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================================
-- Atomic claim function (matches scheduled_sends pattern)
-- ============================================================================
-- Atomically claim pending SMS retries that are due for processing.
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions between
-- concurrent cron invocations.
CREATE OR REPLACE FUNCTION claim_due_sms_retries(limit_count INT DEFAULT 50)
RETURNS SETOF sms_retry_queue AS $$
  UPDATE sms_retry_queue
  SET status = 'processing',
      last_attempted_at = NOW(),
      attempt_count = attempt_count + 1
  WHERE id IN (
    SELECT id FROM sms_retry_queue
    WHERE status = 'pending' AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
    LIMIT limit_count
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$ LANGUAGE sql;

-- ============================================================================
-- Recovery function for stuck processing records
-- ============================================================================
-- Recover stuck "processing" records that have been claimed for more than
-- N minutes without completing. This handles cron crashes / timeouts.
CREATE OR REPLACE FUNCTION recover_stuck_sms_retries(stale_minutes INT DEFAULT 10)
RETURNS SETOF sms_retry_queue AS $$
  UPDATE sms_retry_queue
  SET status = 'pending'
  WHERE status = 'processing'
    AND updated_at < NOW() - (stale_minutes || ' minutes')::interval
  RETURNING *;
$$ LANGUAGE sql;
