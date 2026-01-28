-- Run in Supabase SQL Editor
-- Migration: 00007_add_billing.sql
-- Purpose: Add Stripe billing infrastructure

-- ============================================================================
-- Fix tier column default (Phase 4 set DEFAULT 'basic', should be 'trial')
-- ============================================================================
-- BILL-01: New businesses should start with 25 free trial sends
ALTER TABLE public.businesses
  ALTER COLUMN tier SET DEFAULT 'trial';

-- Fix any businesses that were created with incorrect 'basic' default
-- (only if they have no subscription activity - indicated by no send logs)
UPDATE public.businesses
SET tier = 'trial'
WHERE tier = 'basic'
  AND id NOT IN (SELECT DISTINCT business_id FROM public.send_logs);

-- ============================================================================
-- Add Stripe customer ID to businesses
-- ============================================================================
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- ============================================================================
-- Create subscriptions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,                    -- Stripe subscription ID (sub_xxx)
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL,                   -- active, past_due, canceled, etc.
  price_id TEXT NOT NULL,                 -- Stripe price ID
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Enable RLS and create policy
-- ============================================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (business_id IN (
  SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())
));

-- ============================================================================
-- Create index for business lookup
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON public.subscriptions(business_id);

-- ============================================================================
-- Add updated_at trigger (use existing moddatetime pattern)
-- ============================================================================
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ============================================================================
-- Verification queries (run after migration to confirm):
-- ============================================================================
-- Check tier default is now 'trial':
-- SELECT column_default FROM information_schema.columns
--   WHERE table_name = 'businesses' AND column_name = 'tier';
--
-- Check subscriptions table exists with RLS:
-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE tablename = 'subscriptions';
