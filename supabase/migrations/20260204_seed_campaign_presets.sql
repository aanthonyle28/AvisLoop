-- Seed 3 system campaign presets with touch configurations.
-- These presets are read-only templates that users can duplicate and customize.
--
-- Conservative: 2 email touches (safe, proven)
-- Standard: 2 emails + 1 SMS (balanced multi-channel)
-- Aggressive: 2 SMS + 2 emails (SMS-first for immediacy)

-- Conservative Preset: Email-only approach
WITH conservative AS (
  INSERT INTO campaigns (id, business_id, name, service_type, status, is_preset)
  VALUES (
    gen_random_uuid(),
    NULL,  -- System preset
    'Conservative (Email Only)',
    NULL,  -- All service types
    'active',
    true
  )
  RETURNING id
)
INSERT INTO campaign_touches (campaign_id, touch_number, channel, delay_hours, template_id)
SELECT id, 1, 'email', 24, NULL FROM conservative   -- Touch 1: Email after 24 hours
UNION ALL
SELECT id, 2, 'email', 72, NULL FROM conservative;  -- Touch 2: Email 72 hours after Touch 1 (3 days)

-- Standard Preset: Balanced email + SMS approach
WITH standard AS (
  INSERT INTO campaigns (id, business_id, name, service_type, status, is_preset)
  VALUES (
    gen_random_uuid(),
    NULL,  -- System preset
    'Standard (Email + SMS)',
    NULL,  -- All service types
    'active',
    true
  )
  RETURNING id
)
INSERT INTO campaign_touches (campaign_id, touch_number, channel, delay_hours, template_id)
SELECT id, 1, 'email', 24, NULL FROM standard      -- Touch 1: Email after 24 hours
UNION ALL
SELECT id, 2, 'email', 72, NULL FROM standard      -- Touch 2: Email 72 hours after Touch 1 (3 days)
UNION ALL
SELECT id, 3, 'sms', 168, NULL FROM standard;      -- Touch 3: SMS 168 hours after Touch 2 (7 days)

-- Aggressive Preset: SMS-first multi-channel approach
WITH aggressive AS (
  INSERT INTO campaigns (id, business_id, name, service_type, status, is_preset)
  VALUES (
    gen_random_uuid(),
    NULL,  -- System preset
    'Aggressive (Multi-Channel)',
    NULL,  -- All service types
    'active',
    true
  )
  RETURNING id
)
INSERT INTO campaign_touches (campaign_id, touch_number, channel, delay_hours, template_id)
SELECT id, 1, 'sms', 4, NULL FROM aggressive       -- Touch 1: SMS after 4 hours (immediate follow-up)
UNION ALL
SELECT id, 2, 'email', 24, NULL FROM aggressive    -- Touch 2: Email 24 hours after Touch 1
UNION ALL
SELECT id, 3, 'sms', 72, NULL FROM aggressive      -- Touch 3: SMS 72 hours after Touch 2 (3 days)
UNION ALL
SELECT id, 4, 'email', 168, NULL FROM aggressive;  -- Touch 4: Email 168 hours after Touch 3 (7 days)
