-- Migration: 20260204_create_campaign_touches
-- Purpose: Campaign touch sequences (up to 4 ordered touches per campaign)
-- Part of: Phase 24 - Multi-Touch Campaign Engine (CAMP-02, CAMP-04)

-- ============================================================================
-- 1. Create campaign_touches table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaign_touches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  touch_number INT NOT NULL,
  channel TEXT NOT NULL,
  delay_hours INT NOT NULL,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Touch number must be between 1 and 4
  CONSTRAINT touches_touch_number_valid CHECK (
    touch_number BETWEEN 1 AND 4
  ),

  -- Channel must be email or SMS
  CONSTRAINT touches_channel_valid CHECK (
    channel IN ('email', 'sms')
  ),

  -- Delay must be positive (minimum 1 hour)
  CONSTRAINT touches_delay_positive CHECK (
    delay_hours > 0
  ),

  -- Only one touch per position per campaign
  CONSTRAINT touches_unique_position
    UNIQUE (campaign_id, touch_number)
);

-- ============================================================================
-- 2. Enable RLS
-- ============================================================================
ALTER TABLE public.campaign_touches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Create indexes
-- ============================================================================
-- Primary index for ordered fetches of campaign touches
CREATE INDEX idx_touches_campaign_id ON public.campaign_touches USING btree (campaign_id, touch_number);

-- Index for template reference lookups
CREATE INDEX idx_touches_template_id ON public.campaign_touches USING btree (template_id);

-- ============================================================================
-- 4. RLS Policies
-- ============================================================================

-- SELECT: Users can view touches for campaigns they can see
-- (join to campaigns for business_id check)
CREATE POLICY "Users view campaign touches"
ON public.campaign_touches FOR SELECT
TO authenticated
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns
    WHERE is_preset = true OR
          business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  )
);

-- INSERT: Users can only add touches to their own campaigns (not presets)
CREATE POLICY "Users insert own campaign touches"
ON public.campaign_touches FOR INSERT
TO authenticated
WITH CHECK (
  campaign_id IN (
    SELECT id FROM public.campaigns
    WHERE is_preset = false AND
          business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  )
);

-- UPDATE: Users can only update touches on their own campaigns (not presets)
CREATE POLICY "Users update own campaign touches"
ON public.campaign_touches FOR UPDATE
TO authenticated
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns
    WHERE is_preset = false AND
          business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  campaign_id IN (
    SELECT id FROM public.campaigns
    WHERE is_preset = false AND
          business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  )
);

-- DELETE: Users can only delete touches from their own campaigns (not presets)
CREATE POLICY "Users delete own campaign touches"
ON public.campaign_touches FOR DELETE
TO authenticated
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns
    WHERE is_preset = false AND
          business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  )
);

-- ============================================================================
-- Migration complete
-- ============================================================================
