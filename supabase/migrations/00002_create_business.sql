-- Migration: 00002_create_business
-- Purpose: Business profiles and email templates with RLS for multi-tenant isolation

-- ============================================================================
-- Enable required extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ============================================================================
-- Create businesses table
-- ============================================================================
-- Stores business profile information for each user
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  google_review_link TEXT,
  default_sender_name TEXT,
  default_template_id UUID, -- FK added after email_templates created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT businesses_name_not_empty CHECK (char_length(name) > 0)
);

-- ============================================================================
-- Create email_templates table
-- ============================================================================
-- Stores customizable email templates for review requests
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT templates_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT templates_subject_not_empty CHECK (char_length(subject) > 0),
  CONSTRAINT templates_body_not_empty CHECK (char_length(body) > 0)
);

-- ============================================================================
-- Add circular foreign key for default template
-- ============================================================================
ALTER TABLE public.businesses
  ADD CONSTRAINT fk_default_template
  FOREIGN KEY (default_template_id)
  REFERENCES public.email_templates(id)
  ON DELETE SET NULL;

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
-- CRITICAL: Without this, all users can see all data
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Performance indexes on foreign key columns
-- ============================================================================
-- Wrap auth.uid() in SELECT to cache result per statement
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_business_id ON public.email_templates USING btree (business_id);

-- ============================================================================
-- RLS Policies for businesses
-- ============================================================================
-- Policy: Users can view only their own businesses
CREATE POLICY "Users view own businesses"
ON public.businesses FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Policy: Users can insert only their own businesses
CREATE POLICY "Users insert own businesses"
ON public.businesses FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update only their own businesses
CREATE POLICY "Users update own businesses"
ON public.businesses FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete only their own businesses
CREATE POLICY "Users delete own businesses"
ON public.businesses FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- RLS Policies for email_templates
-- ============================================================================
-- Use subquery pattern to check business ownership

-- Policy: Users can view templates for their businesses
CREATE POLICY "Users view own templates"
ON public.email_templates FOR SELECT
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can insert templates for their businesses
CREATE POLICY "Users insert own templates"
ON public.email_templates FOR INSERT
TO authenticated
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can update templates for their businesses
CREATE POLICY "Users update own templates"
ON public.email_templates FOR UPDATE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())))
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can delete templates for their businesses
CREATE POLICY "Users delete own templates"
ON public.email_templates FOR DELETE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================
-- Use moddatetime extension for automatic timestamp updates
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ============================================================================
-- Seed default system templates
-- ============================================================================
-- Note: These templates use placeholder variables that will be replaced at runtime
-- Variables: {{CUSTOMER_NAME}}, {{BUSINESS_NAME}}, {{REVIEW_LINK}}, {{SENDER_NAME}}
--
-- System templates are inserted without a business_id relationship.
-- When a user creates their first business, they can clone these templates.
-- For now, we'll create a comment documenting the intended templates:

-- Template 1: Simple Review Request
-- Name: "Simple Review Request"
-- Subject: "Quick favor, {{CUSTOMER_NAME}}?"
-- Body: "Hi {{CUSTOMER_NAME}},\n\nThank you for choosing {{BUSINESS_NAME}}! We'd really appreciate it if you could take a moment to share your experience.\n\nLeave a review here: {{REVIEW_LINK}}\n\nThanks so much,\n{{SENDER_NAME}}"

-- Template 2: Friendly Follow-up
-- Name: "Friendly Follow-up"
-- Subject: "How was your experience with {{BUSINESS_NAME}}?"
-- Body: "Hi {{CUSTOMER_NAME}},\n\nWe hope you had a great experience with us at {{BUSINESS_NAME}}! Your feedback helps us improve and helps others discover our services.\n\nWould you mind leaving us a quick review? It only takes a minute:\n{{REVIEW_LINK}}\n\nWe truly appreciate your support!\n\nWarmly,\n{{SENDER_NAME}}"

-- Note: Since these are system-level templates without a business_id, they can't be inserted
-- directly due to the NOT NULL constraint on business_id. Instead, the application will:
-- 1. Store these template definitions in code as defaults
-- 2. Clone them to the user's business when they create their first business
-- 3. Set is_default = true on the cloned "Simple Review Request" template
--
-- This approach is cleaner than creating placeholder business records.
