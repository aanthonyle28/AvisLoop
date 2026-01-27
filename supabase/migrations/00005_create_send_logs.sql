-- Migration: 00005_create_send_logs
-- Purpose: Email send logging with status tracking and webhook integration support

-- ============================================================================
-- Create send_logs table
-- ============================================================================
-- Tracks all email send operations with status for history and analytics
CREATE TABLE IF NOT EXISTS public.send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_id TEXT,  -- Resend/Postmark email ID for webhook correlation
  error_message TEXT,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT send_logs_status_valid CHECK (
    status IN ('pending', 'sent', 'delivered', 'bounced', 'complained', 'failed', 'opened')
  )
);

-- ============================================================================
-- Performance indexes
-- ============================================================================
-- Index on business_id for FK lookups and scoped queries
CREATE INDEX IF NOT EXISTS idx_send_logs_business_id ON public.send_logs USING btree (business_id);

-- Index on contact_id for per-contact history
CREATE INDEX IF NOT EXISTS idx_send_logs_contact_id ON public.send_logs USING btree (contact_id);

-- Index on created_at DESC for recent send history (most common query)
CREATE INDEX IF NOT EXISTS idx_send_logs_created_at ON public.send_logs USING btree (created_at DESC);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
-- CRITICAL: Without this, all users can see all send logs
ALTER TABLE public.send_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for send_logs
-- ============================================================================
-- Use subquery pattern to check business ownership (same pattern as contacts)

-- Policy: Users can view send_logs for their businesses
CREATE POLICY "Users view own send_logs"
ON public.send_logs FOR SELECT
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can insert send_logs for their businesses
CREATE POLICY "Users insert own send_logs"
ON public.send_logs FOR INSERT
TO authenticated
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can update send_logs for their businesses (for webhook status updates)
CREATE POLICY "Users update own send_logs"
ON public.send_logs FOR UPDATE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())))
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- ============================================================================
-- Trigger for updated_at timestamps
-- ============================================================================
-- Use moddatetime extension (already enabled in 00002)
CREATE TRIGGER send_logs_updated_at
  BEFORE UPDATE ON public.send_logs
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ============================================================================
-- Add opted_out column to contacts
-- ============================================================================
-- For compliance and user preference tracking (GDPR, CAN-SPAM)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS opted_out BOOLEAN NOT NULL DEFAULT false;

-- Composite index for sendable contacts query optimization
CREATE INDEX IF NOT EXISTS idx_contacts_sendable
ON public.contacts USING btree (business_id, status, opted_out)
WHERE status = 'active' AND opted_out = false;

-- ============================================================================
-- Add tier column to businesses
-- ============================================================================
-- For MVP limit enforcement (e.g., basic = 100 sends/month)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'basic',
  ADD CONSTRAINT businesses_tier_valid CHECK (tier IN ('basic', 'pro', 'trial'));
