-- Migration: 20260204_extend_send_logs_sms
-- Purpose: Extend send_logs for multi-channel (email/SMS) support
-- Context: Part of Phase 21 SMS Foundation - enables send_logs to track SMS sends
--          alongside emails for unified messaging history
--
-- Changes:
--   1. Add channel column (TEXT) to discriminate email vs sms
--   2. Add provider_message_id (JSONB) for multi-provider ID storage
--   3. Add customer_id (UUID FK) to parallel contact_id during migration window
--   4. Backfill customer_id from contact_id for existing rows

-- ============================================================================
-- Add channel column with default 'email' for backward compatibility
-- ============================================================================
-- All existing rows are email sends, new rows will specify channel explicitly
ALTER TABLE public.send_logs
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'email';

-- Add CHECK constraint for valid channel values
ALTER TABLE public.send_logs
  ADD CONSTRAINT send_logs_channel_valid CHECK (channel IN ('email', 'sms'));

-- ============================================================================
-- Add provider_message_id JSONB for multi-provider support
-- ============================================================================
-- Stores { resend_id: "...", twilio_sid: "..." } for different providers
-- Existing provider_id column stays for Resend webhook backward compatibility
ALTER TABLE public.send_logs
  ADD COLUMN IF NOT EXISTS provider_message_id JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================================
-- Add customer_id column (parallels contact_id during migration window)
-- ============================================================================
-- Step 1: Add column as nullable initially
ALTER TABLE public.send_logs
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE;

-- Step 2: Backfill from contact_id for existing rows
UPDATE public.send_logs
SET customer_id = contact_id
WHERE customer_id IS NULL;

-- Step 3: Make NOT NULL after backfill
ALTER TABLE public.send_logs
  ALTER COLUMN customer_id SET NOT NULL;

-- ============================================================================
-- Performance indexes
-- ============================================================================
-- Index on channel for filtering by message type
CREATE INDEX IF NOT EXISTS idx_send_logs_channel
  ON public.send_logs USING btree (channel);

-- Composite index for channel + business for filtered history queries
CREATE INDEX IF NOT EXISTS idx_send_logs_business_channel
  ON public.send_logs USING btree (business_id, channel);

-- Index on customer_id for per-customer history
CREATE INDEX IF NOT EXISTS idx_send_logs_customer_id
  ON public.send_logs USING btree (customer_id);

-- ============================================================================
-- Notes
-- ============================================================================
-- * contact_id column remains for backward compatibility with contacts view
-- * provider_id column remains for Resend webhook correlation
-- * Both customer_id and contact_id point to same row during migration window
-- * Future migration will remove contact_id after all code uses customer_id
