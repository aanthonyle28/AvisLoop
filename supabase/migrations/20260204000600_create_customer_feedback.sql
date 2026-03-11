-- Create customer_feedback table for storing private feedback from 1-3 star ratings
-- Phase 26: Review Funnel

CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.campaign_enrollments(id) ON DELETE SET NULL,

  -- Rating and feedback
  rating INT NOT NULL,
  feedback_text TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Resolution workflow
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT feedback_rating_valid CHECK (rating BETWEEN 1 AND 5)
);

-- Indexes
CREATE INDEX idx_feedback_business_id ON public.customer_feedback(business_id);
CREATE INDEX idx_feedback_customer_id ON public.customer_feedback(customer_id);
CREATE INDEX idx_feedback_enrollment_id ON public.customer_feedback(enrollment_id);

-- Partial index for fast unresolved feedback queries
CREATE INDEX idx_feedback_unresolved
  ON public.customer_feedback(business_id, submitted_at DESC)
  WHERE resolved_at IS NULL;

-- RLS
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view feedback for their own businesses
CREATE POLICY "Users view own feedback"
  ON public.customer_feedback FOR SELECT
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Anonymous users can insert feedback (token validation happens in API route)
CREATE POLICY "Public insert feedback"
  ON public.customer_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can update their own feedback (for resolution)
CREATE POLICY "Users update own feedback"
  ON public.customer_feedback FOR UPDATE
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER customer_feedback_updated_at
  BEFORE UPDATE ON public.customer_feedback
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

COMMENT ON TABLE public.customer_feedback IS 'Stores private feedback from 1-3 star satisfaction ratings. Phase 26 Review Funnel.';
