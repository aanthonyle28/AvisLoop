-- TICK-03 / Phase 73-01: Atomic ticket submission RPC + missing columns
--
-- This migration is additive only — the project_tickets and ticket_messages
-- tables were created in 20260319000400_create_ticket_tables.sql.
--
-- What this migration adds:
--   1. overage_fee column (TICK-05) — stores the $50 charge when is_overage=true
--   2. completed_at column — replaces resolved_at for the simplified V2 status model
--   3. idx_project_tickets_status index — for operator all-tickets CRM view
--   4. submit_ticket_with_limit_check RPC — atomic limit enforcement with FOR UPDATE lock

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add missing columns to project_tickets
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.project_tickets
  ADD COLUMN IF NOT EXISTS overage_fee NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.project_tickets.overage_fee IS
  'Dollar amount charged for this overage ticket (e.g. 50.00). NULL when is_overage = false.';
COMMENT ON COLUMN public.project_tickets.completed_at IS
  'Timestamp when the ticket status was set to completed. NULL while still open.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Additional index for operator all-tickets view (filter by business + status)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_project_tickets_status
  ON public.project_tickets(business_id, status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Atomic RPC: submit_ticket_with_limit_check
--
-- Called from:
--   - Operator "create ticket" server action (Phase 73)
--   - Client portal Route Handler after portal_token validation (Phase 74)
--
-- Concurrency safety:
--   PERFORM ... FOR UPDATE on the web_projects row serializes concurrent
--   submissions. Two callers both at the limit cannot both succeed because
--   the second caller blocks until the first transaction commits, then
--   re-counts and sees the new ticket.
--
-- SECURITY DEFINER + SET search_path = public prevents search_path injection.
-- Caller must still be authenticated (RLS enforced via service-role in Route
-- Handlers, or via the authenticated user's RLS policies for agency actions).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.submit_ticket_with_limit_check(
  p_project_id    UUID,
  p_business_id   UUID,
  p_title         TEXT,
  p_description   TEXT,
  p_source        TEXT,        -- 'agency' | 'client_portal'
  p_author_name   TEXT,        -- display name for first message (nullable)
  p_body          TEXT,        -- first message body (nullable — skip if empty)
  p_monthly_limit INT,         -- passed from app: REVISION_LIMITS constant
  p_is_overage    BOOLEAN      -- true when user confirmed $50 overage in UI
)
RETURNS TABLE(
  status        TEXT,
  ticket_id     UUID,
  current_count INT,
  monthly_limit INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_id UUID;
  v_count     INT;
  v_author_type TEXT;
BEGIN
  -- 1. Lock the web_projects row to serialize concurrent submissions.
  --    Any concurrent call for the same project_id will block here until
  --    this transaction commits or rolls back.
  PERFORM id FROM web_projects WHERE id = p_project_id FOR UPDATE;

  -- 2. Count non-overage tickets submitted in the current calendar month
  --    for this project. Only non-overage tickets consume the monthly limit.
  SELECT COUNT(*) INTO v_count
  FROM project_tickets
  WHERE project_id  = p_project_id
    AND is_overage  = false
    AND created_at >= date_trunc('month', NOW());

  -- 3. Enforce limit (skip check when this is an already-confirmed overage)
  IF v_count >= p_monthly_limit AND p_is_overage = false THEN
    RETURN QUERY SELECT
      'over_limit'::TEXT,
      NULL::UUID,
      v_count::INT,
      p_monthly_limit::INT;
    RETURN;
  END IF;

  -- 4. Insert the ticket
  INSERT INTO project_tickets (
    project_id,
    business_id,
    title,
    description,
    status,
    source,
    is_overage,
    overage_fee
  )
  VALUES (
    p_project_id,
    p_business_id,
    p_title,
    p_description,
    'submitted',
    p_source,
    p_is_overage,
    CASE WHEN p_is_overage THEN 50.00 ELSE NULL END
  )
  RETURNING id INTO v_ticket_id;

  -- 5. Optionally insert the first message (if a body was provided).
  --    author_type maps p_source → ticket_messages.author_type constraint:
  --    'agency' stays 'agency'; 'client_portal' maps to 'client'.
  IF p_body IS NOT NULL AND p_body <> '' THEN
    v_author_type := CASE
      WHEN p_source = 'client_portal' THEN 'client'
      ELSE 'agency'
    END;

    INSERT INTO ticket_messages (
      ticket_id,
      business_id,
      author_type,
      author_name,
      body
    )
    VALUES (
      v_ticket_id,
      p_business_id,
      v_author_type,
      p_author_name,
      p_body
    );
  END IF;

  -- 6. Return success result (count reflects state after insert)
  RETURN QUERY SELECT
    'ok'::TEXT,
    v_ticket_id,
    (v_count + 1)::INT,
    p_monthly_limit::INT;
END;
$$;
