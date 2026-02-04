-- Migration: 20260204_create_campaign_enrollments
-- Purpose: Campaign enrollment tracking with denormalized touch timestamps
-- Part of: Phase 24 - Multi-Touch Campaign Engine (CAMP-03, CAMP-05, CAMP-06, CAMP-07)

-- ============================================================================
-- 1. Create campaign_enrollments table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,

  -- State machine
  status TEXT NOT NULL DEFAULT 'active',
  stop_reason TEXT,

  -- Progression tracking
  current_touch INT NOT NULL DEFAULT 1,

  -- Denormalized touch timestamps for fast due-touch queries
  touch_1_scheduled_at TIMESTAMPTZ,
  touch_1_sent_at TIMESTAMPTZ,
  touch_1_status TEXT,
  touch_2_scheduled_at TIMESTAMPTZ,
  touch_2_sent_at TIMESTAMPTZ,
  touch_2_status TEXT,
  touch_3_scheduled_at TIMESTAMPTZ,
  touch_3_sent_at TIMESTAMPTZ,
  touch_3_status TEXT,
  touch_4_scheduled_at TIMESTAMPTZ,
  touch_4_sent_at TIMESTAMPTZ,
  touch_4_status TEXT,

  -- Lifecycle timestamps
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status state machine constraint
  CONSTRAINT enrollments_status_valid CHECK (
    status IN ('active', 'completed', 'stopped')
  ),

  -- Stop reason constraint
  CONSTRAINT enrollments_stop_reason_valid CHECK (
    stop_reason IS NULL OR stop_reason IN (
      'review_clicked',
      'feedback_submitted',
      'opted_out_sms',
      'opted_out_email',
      'owner_stopped',
      'campaign_paused',
      'campaign_deleted',
      'repeat_job'
    )
  ),

  -- Current touch range constraint
  CONSTRAINT enrollments_current_touch_valid CHECK (
    current_touch BETWEEN 1 AND 4
  ),

  -- Touch status constraint
  CONSTRAINT enrollments_touch_status_valid CHECK (
    (touch_1_status IS NULL OR touch_1_status IN ('pending', 'sent', 'skipped', 'failed')) AND
    (touch_2_status IS NULL OR touch_2_status IN ('pending', 'sent', 'skipped', 'failed')) AND
    (touch_3_status IS NULL OR touch_3_status IN ('pending', 'sent', 'skipped', 'failed')) AND
    (touch_4_status IS NULL OR touch_4_status IN ('pending', 'sent', 'skipped', 'failed'))
  )
);

-- ============================================================================
-- 2. Create partial unique constraint
-- One active enrollment per customer per campaign
-- ============================================================================
CREATE UNIQUE INDEX idx_enrollments_unique_active
  ON public.campaign_enrollments (customer_id, campaign_id)
  WHERE status = 'active';

-- ============================================================================
-- 3. Enable RLS
-- ============================================================================
ALTER TABLE public.campaign_enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Create indexes (critical for cron performance)
-- ============================================================================

-- Critical index for claiming due touches (composite with included columns)
-- This enables fast queries like: WHERE status='active' AND touch_1_scheduled_at <= NOW()
CREATE INDEX idx_enrollments_touch_1_due
  ON public.campaign_enrollments (status, current_touch, touch_1_scheduled_at)
  WHERE status = 'active' AND current_touch = 1 AND touch_1_sent_at IS NULL;

CREATE INDEX idx_enrollments_touch_2_due
  ON public.campaign_enrollments (status, current_touch, touch_2_scheduled_at)
  WHERE status = 'active' AND current_touch = 2 AND touch_2_sent_at IS NULL;

CREATE INDEX idx_enrollments_touch_3_due
  ON public.campaign_enrollments (status, current_touch, touch_3_scheduled_at)
  WHERE status = 'active' AND current_touch = 3 AND touch_3_sent_at IS NULL;

CREATE INDEX idx_enrollments_touch_4_due
  ON public.campaign_enrollments (status, current_touch, touch_4_scheduled_at)
  WHERE status = 'active' AND current_touch = 4 AND touch_4_sent_at IS NULL;

-- Index for business + campaign + status queries (analytics, campaign detail page)
CREATE INDEX idx_enrollments_business_campaign
  ON public.campaign_enrollments (business_id, campaign_id, status);

-- Index for customer + status queries (repeat job detection)
CREATE INDEX idx_enrollments_customer
  ON public.campaign_enrollments (customer_id, status);

-- Index for job lookups
CREATE INDEX idx_enrollments_job
  ON public.campaign_enrollments (job_id);

-- ============================================================================
-- 5. RLS Policies
-- ============================================================================

-- SELECT: Users can view enrollments for their business
CREATE POLICY "Users view own enrollments"
ON public.campaign_enrollments FOR SELECT
TO authenticated
USING (
  business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
);

-- INSERT: Users can only create enrollments for their business
CREATE POLICY "Users insert own enrollments"
ON public.campaign_enrollments FOR INSERT
TO authenticated
WITH CHECK (
  business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
);

-- UPDATE: Users can only update enrollments for their business
CREATE POLICY "Users update own enrollments"
ON public.campaign_enrollments FOR UPDATE
TO authenticated
USING (
  business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
)
WITH CHECK (
  business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
);

-- DELETE: Users can only delete enrollments for their business
CREATE POLICY "Users delete own enrollments"
ON public.campaign_enrollments FOR DELETE
TO authenticated
USING (
  business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
);

-- ============================================================================
-- 6. Trigger for updated_at
-- ============================================================================
CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON public.campaign_enrollments
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ============================================================================
-- Migration complete
-- ============================================================================
