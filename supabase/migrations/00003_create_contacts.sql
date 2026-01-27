-- Migration: 00003_create_contacts
-- Purpose: Contact management with business-scoped RLS for multi-tenant isolation

-- ============================================================================
-- Create contacts table
-- ============================================================================
-- Stores contact information for each business
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_sent_at TIMESTAMPTZ,
  send_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT contacts_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT contacts_email_not_empty CHECK (char_length(email) > 0),
  CONSTRAINT contacts_status_valid CHECK (status IN ('active', 'archived')),
  CONSTRAINT contacts_unique_email_per_business UNIQUE (business_id, email)
);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
-- CRITICAL: Without this, all users can see all contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Performance indexes
-- ============================================================================
-- Index on business_id for FK lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_contacts_business_id ON public.contacts USING btree (business_id);

-- Index on (business_id, status) for filtered queries (e.g., "active contacts")
CREATE INDEX IF NOT EXISTS idx_contacts_business_status ON public.contacts USING btree (business_id, status);

-- Note: Unique constraint on (business_id, email) already creates an implicit index

-- ============================================================================
-- RLS Policies for contacts
-- ============================================================================
-- Use subquery pattern to check business ownership (same pattern as email_templates)

-- Policy: Users can view contacts for their businesses
CREATE POLICY "Users view own contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can insert contacts for their businesses
CREATE POLICY "Users insert own contacts"
ON public.contacts FOR INSERT
TO authenticated
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can update contacts for their businesses
CREATE POLICY "Users update own contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())))
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can delete contacts for their businesses
CREATE POLICY "Users delete own contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- ============================================================================
-- Trigger for updated_at timestamps
-- ============================================================================
-- Use moddatetime extension (already enabled in 00002)
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
