-- Migration: 00009b_create_scheduled_sends
-- Purpose: Create scheduled_sends table for deferred email sending
-- Context: This migration must run BEFORE 00010_claim_due_scheduled_sends.sql
--          which defines functions that return SETOF scheduled_sends
--
-- RLS Note: SELECT/INSERT/UPDATE policies using businesses ownership subquery pattern
-- (no DELETE policy — use status='cancelled' instead for audit trail)

-- ============================================================================
-- Create scheduled_sends table
-- ============================================================================
-- Stores scheduled send requests with contact lists and execution tracking
CREATE TABLE IF NOT EXISTS public.scheduled_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_ids UUID[] NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  custom_subject TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMPTZ,
  send_log_ids UUID[],
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scheduled_sends_status_valid CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  )
);

-- ============================================================================
-- Performance indexes
-- ============================================================================
-- Index on business_id for FK lookups and scoped queries
CREATE INDEX IF NOT EXISTS idx_scheduled_sends_business_id
  ON public.scheduled_sends USING btree (business_id);

-- Partial index for cron claim query (only pending sends that are due)
-- This optimizes the main claim_due_scheduled_sends() query in migration 00010
CREATE INDEX IF NOT EXISTS idx_scheduled_sends_pending_due
  ON public.scheduled_sends USING btree (status, scheduled_for)
  WHERE status = 'pending';

-- Index for listing scheduled sends by creation date (most recent first)
CREATE INDEX IF NOT EXISTS idx_scheduled_sends_created_at
  ON public.scheduled_sends USING btree (created_at DESC);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
-- CRITICAL: Without this, all users can see all scheduled sends
ALTER TABLE public.scheduled_sends ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for scheduled_sends
-- ============================================================================
-- Use subquery pattern to check business ownership (same pattern as send_logs)

-- Policy: Users can view scheduled_sends for their businesses
CREATE POLICY "Users view own scheduled_sends"
  ON public.scheduled_sends FOR SELECT
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Policy: Users can insert scheduled_sends for their businesses
CREATE POLICY "Users insert own scheduled_sends"
  ON public.scheduled_sends FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Policy: Users can update scheduled_sends for their businesses
CREATE POLICY "Users update own scheduled_sends"
  ON public.scheduled_sends FOR UPDATE
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- ============================================================================
-- Trigger for updated_at timestamps
-- ============================================================================
-- Use moddatetime extension (enabled in 00002_create_business.sql)
CREATE TRIGGER set_scheduled_sends_updated_at
  BEFORE UPDATE ON public.scheduled_sends
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
