-- Phase 70: Reputation Audit Lead-Gen Tool
-- Apply via Supabase Dashboard > SQL Editor (Settings > Database > SQL Editor)
-- This migration is idempotent — safe to run multiple times.

-- audit_reports: stores computed audit results after email gate.
-- NOTE: Raw Google Places API response data is NOT stored here (per TOS).
-- Only derived/computed fields are persisted.
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  city TEXT NOT NULL,
  place_id TEXT,
  place_display_name TEXT,
  place_address TEXT,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  rating_snapshot NUMERIC(2,1),
  review_count_snapshot INTEGER,
  gaps_json JSONB DEFAULT '[]',
  lead_email TEXT NOT NULL,
  audited_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

-- Anon can INSERT (lead capture from public audit page — no auth required)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_reports' AND policyname = 'anon_insert_audit_reports'
  ) THEN
    CREATE POLICY "anon_insert_audit_reports" ON public.audit_reports
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

-- Public read — report ID is an unguessable UUID (security-by-obscurity for sharing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_reports' AND policyname = 'public_select_audit_reports'
  ) THEN
    CREATE POLICY "public_select_audit_reports" ON public.audit_reports
      FOR SELECT USING (true);
  END IF;
END $$;

-- audit_leads: captures prospect emails separately for marketing/CRM use.
-- Linked to the report so we know which audit triggered the lead.
CREATE TABLE IF NOT EXISTS public.audit_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  city TEXT NOT NULL,
  report_id UUID REFERENCES public.audit_reports(id) ON DELETE SET NULL,
  ip_address INET,
  source TEXT DEFAULT 'audit_tool',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_leads ENABLE ROW LEVEL SECURITY;

-- Anon can INSERT (public lead capture)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_leads' AND policyname = 'anon_insert_audit_leads'
  ) THEN
    CREATE POLICY "anon_insert_audit_leads" ON public.audit_leads
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

-- Authenticated users (admin) can read leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_leads' AND policyname = 'auth_select_audit_leads'
  ) THEN
    CREATE POLICY "auth_select_audit_leads" ON public.audit_leads
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- GRANTs for anon role (CRITICAL: RLS policies alone are not sufficient)
GRANT INSERT ON public.audit_reports TO anon;
GRANT SELECT ON public.audit_reports TO anon;
GRANT INSERT ON public.audit_leads TO anon;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_reports_created_at ON public.audit_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_leads_email ON public.audit_leads(email);
CREATE INDEX IF NOT EXISTS idx_audit_leads_report_id ON public.audit_leads(report_id);
