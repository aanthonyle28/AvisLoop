-- Migration: 00009_add_reviewed_at
-- Purpose: Add reviewed_at column to send_logs for response rate tracking
-- RLS Note: No new policies needed — existing SELECT/UPDATE policies on send_logs
-- already cover this column since they apply to all columns in the table.

-- ============================================================================
-- Add reviewed_at column
-- ============================================================================
ALTER TABLE public.send_logs
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================================
-- Index for response rate queries
-- ============================================================================
-- Partial index: only index rows where reviewed_at IS NOT NULL (responded contacts)
-- Scoped by business_id for efficient per-business response rate calculation
CREATE INDEX IF NOT EXISTS idx_send_logs_reviewed_at
  ON public.send_logs USING btree (business_id)
  WHERE reviewed_at IS NOT NULL;
