-- Migration: 20260204_create_campaigns
-- Purpose: Campaigns table for multi-touch review follow-up sequences
-- Part of: Phase 24 - Multi-Touch Campaign Engine (CAMP-01, CAMP-02, CAMP-03)

-- ============================================================================
-- 1. Create campaigns table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Name length constraints
  CONSTRAINT campaigns_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),

  -- Service type must match jobs service types or be NULL (all services)
  CONSTRAINT campaigns_service_type_valid CHECK (
    service_type IS NULL OR
    service_type IN ('hvac', 'plumbing', 'electrical', 'cleaning', 'roofing', 'painting', 'handyman', 'other')
  ),

  -- Status enum-like constraint
  CONSTRAINT campaigns_status_valid CHECK (
    status IN ('active', 'paused')
  ),

  -- One campaign per service type per business (specific service campaigns)
  CONSTRAINT campaigns_unique_service_type
    UNIQUE (business_id, service_type)
    DEFERRABLE INITIALLY DEFERRED
);

-- Note: We allow multiple campaigns with service_type=NULL (default campaigns) per business
-- for flexibility, but UI should guide users to have one default campaign

-- ============================================================================
-- 2. Enable RLS
-- ============================================================================
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Create indexes
-- ============================================================================
CREATE INDEX idx_campaigns_business_id ON public.campaigns USING btree (business_id);
CREATE INDEX idx_campaigns_business_service ON public.campaigns USING btree (business_id, service_type);
CREATE INDEX idx_campaigns_preset ON public.campaigns USING btree (is_preset) WHERE is_preset = true;

-- ============================================================================
-- 4. RLS Policies
-- ============================================================================

-- SELECT: Users can view system presets (is_preset=true) OR their own campaigns
CREATE POLICY "Users view campaigns"
ON public.campaigns FOR SELECT
TO authenticated
USING (
  is_preset = true OR
  business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
);

-- INSERT: Users can only create for their own business (not preset)
CREATE POLICY "Users insert own campaigns"
ON public.campaigns FOR INSERT
TO authenticated
WITH CHECK (
  is_preset = false AND
  business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
);

-- UPDATE: Users can only update their own campaigns (not preset)
CREATE POLICY "Users update own campaigns"
ON public.campaigns FOR UPDATE
TO authenticated
USING (
  is_preset = false AND
  business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
)
WITH CHECK (
  is_preset = false AND
  business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
);

-- DELETE: Users can only delete their own campaigns (not preset)
CREATE POLICY "Users delete own campaigns"
ON public.campaigns FOR DELETE
TO authenticated
USING (
  is_preset = false AND
  business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
);

-- ============================================================================
-- 5. Trigger for updated_at
-- ============================================================================
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ============================================================================
-- Migration complete
-- ============================================================================
