-- Migration: fix_cron_rpcs_search_path
-- Purpose: Fix search_path issue on all cron RPC functions so they can find
--          tables in the public schema. Also creates sms_retry_queue table
--          and its RPCs if they don't exist yet.
--
-- Context: Supabase restricts function search_path by default. Functions using
--          unqualified table names (e.g. `scheduled_sends`) fail with
--          "relation does not exist". Fix: use fully qualified names.

-- ============================================================================
-- 1. Create sms_retry_queue table if not exists
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sms_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  send_log_id UUID NOT NULL REFERENCES public.send_logs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMPTZ NOT NULL,
  last_attempted_at TIMESTAMPTZ,
  last_error TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sms_retry_queue_status_valid CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  CONSTRAINT sms_retry_queue_reason_valid CHECK (
    reason IS NULL OR reason IN ('quiet_hours', 'twilio_error', 'rate_limit')
  )
);

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_sms_retry_queue_business_id
  ON public.sms_retry_queue USING btree (business_id);

CREATE INDEX IF NOT EXISTS idx_sms_retry_queue_pending_due
  ON public.sms_retry_queue USING btree (status, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sms_retry_queue_created_at
  ON public.sms_retry_queue USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_retry_queue_send_log_id
  ON public.sms_retry_queue USING btree (send_log_id);

-- RLS
ALTER TABLE public.sms_retry_queue ENABLE ROW LEVEL SECURITY;

-- Policies (use DO block to avoid errors if they already exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sms_retry_queue' AND policyname = 'Users view own sms_retry_queue'
  ) THEN
    CREATE POLICY "Users view own sms_retry_queue"
      ON public.sms_retry_queue FOR SELECT TO authenticated
      USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sms_retry_queue' AND policyname = 'Users insert own sms_retry_queue'
  ) THEN
    CREATE POLICY "Users insert own sms_retry_queue"
      ON public.sms_retry_queue FOR INSERT TO authenticated
      WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sms_retry_queue' AND policyname = 'Users update own sms_retry_queue'
  ) THEN
    CREATE POLICY "Users update own sms_retry_queue"
      ON public.sms_retry_queue FOR UPDATE TO authenticated
      USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
      WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Enable moddatetime extension if not already enabled
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

-- Trigger (create only if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_sms_retry_queue_updated_at'
  ) THEN
    CREATE TRIGGER set_sms_retry_queue_updated_at
      BEFORE UPDATE ON public.sms_retry_queue
      FOR EACH ROW
      EXECUTE FUNCTION extensions.moddatetime(updated_at);
  END IF;
END $$;

-- ============================================================================
-- 2. Fix claim_due_scheduled_sends — use fully qualified table names
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_due_scheduled_sends(limit_count INT DEFAULT 50)
RETURNS SETOF public.scheduled_sends AS $$
  UPDATE public.scheduled_sends
  SET status = 'processing'
  WHERE id IN (
    SELECT id FROM public.scheduled_sends
    WHERE status = 'pending' AND scheduled_for <= now()
    ORDER BY scheduled_for ASC
    LIMIT limit_count
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$ LANGUAGE sql SET search_path = public;

-- ============================================================================
-- 3. Fix recover_stuck_scheduled_sends
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recover_stuck_scheduled_sends(stale_minutes INT DEFAULT 10)
RETURNS SETOF public.scheduled_sends AS $$
  UPDATE public.scheduled_sends
  SET status = 'pending'
  WHERE status = 'processing'
    AND updated_at < now() - (stale_minutes || ' minutes')::interval
  RETURNING *;
$$ LANGUAGE sql SET search_path = public;

-- ============================================================================
-- 4. Fix claim_due_campaign_touches — use fully qualified table names
--    Rewritten as PL/pgSQL because FOR UPDATE SKIP LOCKED cannot be used
--    inside UNION ALL in plain SQL.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_due_campaign_touches(limit_count INT DEFAULT 100)
RETURNS TABLE (
  enrollment_id UUID,
  business_id UUID,
  campaign_id UUID,
  job_id UUID,
  customer_id UUID,
  touch_number INT,
  channel TEXT,
  template_id UUID,
  scheduled_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Touch 1
  RETURN QUERY
    SELECT
      e.id AS enrollment_id, e.business_id, e.campaign_id, e.job_id, e.customer_id,
      1 AS touch_number, t.channel, t.template_id, e.touch_1_scheduled_at AS scheduled_at
    FROM public.campaign_enrollments e
    INNER JOIN public.campaign_touches t ON t.campaign_id = e.campaign_id AND t.touch_number = 1
    WHERE e.status = 'active' AND e.current_touch = 1
      AND e.touch_1_scheduled_at <= NOW() AND e.touch_1_sent_at IS NULL
    ORDER BY e.touch_1_scheduled_at ASC
    LIMIT limit_count
    FOR UPDATE OF e SKIP LOCKED;

  -- Touch 2
  RETURN QUERY
    SELECT
      e.id, e.business_id, e.campaign_id, e.job_id, e.customer_id,
      2, t.channel, t.template_id, e.touch_2_scheduled_at
    FROM public.campaign_enrollments e
    INNER JOIN public.campaign_touches t ON t.campaign_id = e.campaign_id AND t.touch_number = 2
    WHERE e.status = 'active' AND e.current_touch = 2
      AND e.touch_2_scheduled_at <= NOW() AND e.touch_2_sent_at IS NULL
      AND e.touch_1_sent_at IS NOT NULL
    ORDER BY e.touch_2_scheduled_at ASC
    LIMIT limit_count
    FOR UPDATE OF e SKIP LOCKED;

  -- Touch 3
  RETURN QUERY
    SELECT
      e.id, e.business_id, e.campaign_id, e.job_id, e.customer_id,
      3, t.channel, t.template_id, e.touch_3_scheduled_at
    FROM public.campaign_enrollments e
    INNER JOIN public.campaign_touches t ON t.campaign_id = e.campaign_id AND t.touch_number = 3
    WHERE e.status = 'active' AND e.current_touch = 3
      AND e.touch_3_scheduled_at <= NOW() AND e.touch_3_sent_at IS NULL
      AND e.touch_2_sent_at IS NOT NULL
    ORDER BY e.touch_3_scheduled_at ASC
    LIMIT limit_count
    FOR UPDATE OF e SKIP LOCKED;

  -- Touch 4
  RETURN QUERY
    SELECT
      e.id, e.business_id, e.campaign_id, e.job_id, e.customer_id,
      4, t.channel, t.template_id, e.touch_4_scheduled_at
    FROM public.campaign_enrollments e
    INNER JOIN public.campaign_touches t ON t.campaign_id = e.campaign_id AND t.touch_number = 4
    WHERE e.status = 'active' AND e.current_touch = 4
      AND e.touch_4_scheduled_at <= NOW() AND e.touch_4_sent_at IS NULL
      AND e.touch_3_sent_at IS NOT NULL
    ORDER BY e.touch_4_scheduled_at ASC
    LIMIT limit_count
    FOR UPDATE OF e SKIP LOCKED;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- 5. Fix claim_due_sms_retries
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_due_sms_retries(limit_count INT DEFAULT 50)
RETURNS SETOF public.sms_retry_queue AS $$
  UPDATE public.sms_retry_queue
  SET status = 'processing',
      last_attempted_at = NOW(),
      attempt_count = attempt_count + 1
  WHERE id IN (
    SELECT id FROM public.sms_retry_queue
    WHERE status = 'pending' AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
    LIMIT limit_count
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$ LANGUAGE sql SET search_path = public;

-- ============================================================================
-- 6. Fix recover_stuck_sms_retries
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recover_stuck_sms_retries(stale_minutes INT DEFAULT 10)
RETURNS SETOF public.sms_retry_queue AS $$
  UPDATE public.sms_retry_queue
  SET status = 'pending'
  WHERE status = 'processing'
    AND updated_at < NOW() - (stale_minutes || ' minutes')::interval
  RETURNING *;
$$ LANGUAGE sql SET search_path = public;

-- ============================================================================
-- 7. Fix increment_customer_send_count
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_customer_send_count(
  p_customer_id UUID,
  p_sent_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.customers
  SET
    send_count = COALESCE(send_count, 0) + 1,
    last_sent_at = p_sent_at,
    updated_at = NOW()
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.increment_customer_send_count FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_customer_send_count TO service_role;
