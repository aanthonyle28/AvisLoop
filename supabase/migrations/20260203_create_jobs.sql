-- Migration: 20260203_create_jobs
-- Purpose: Jobs table with service type, status, customer link, and RLS
-- Part of: Phase 22 - Jobs CRUD & Service Types (JOBS-01, JOBS-02, JOBS-03, JOBS-04)

-- ============================================================================
-- 1. Create jobs table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Service type enum-like constraint (lowercase)
  CONSTRAINT jobs_service_type_valid CHECK (
    service_type IN ('hvac', 'plumbing', 'electrical', 'cleaning', 'roofing', 'painting', 'handyman', 'other')
  ),
  -- Status enum-like constraint
  CONSTRAINT jobs_status_valid CHECK (
    status IN ('completed', 'do_not_send')
  )
);

-- ============================================================================
-- 2. Enable RLS
-- ============================================================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Create indexes
-- ============================================================================
CREATE INDEX idx_jobs_business_id ON public.jobs USING btree (business_id);
CREATE INDEX idx_jobs_customer_id ON public.jobs USING btree (customer_id);
CREATE INDEX idx_jobs_business_status ON public.jobs USING btree (business_id, status);
CREATE INDEX idx_jobs_business_service_type ON public.jobs USING btree (business_id, service_type);
CREATE INDEX idx_jobs_completed_at ON public.jobs USING btree (completed_at) WHERE completed_at IS NOT NULL;

-- ============================================================================
-- 4. RLS Policies (business-scoped via subquery pattern)
-- ============================================================================
CREATE POLICY "Users view own jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users insert own jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users update own jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())))
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users delete own jobs"
ON public.jobs FOR DELETE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- ============================================================================
-- 5. Trigger for updated_at
-- ============================================================================
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ============================================================================
-- Migration complete
-- ============================================================================
