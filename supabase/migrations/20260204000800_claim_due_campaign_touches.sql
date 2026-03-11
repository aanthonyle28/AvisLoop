-- Atomically claim due campaign touches for processing.
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions between
-- concurrent cron invocations.
--
-- This function claims touches that are:
-- 1. Part of an active enrollment
-- 2. Scheduled for now or earlier
-- 3. Not yet sent
-- 4. Previous touch was sent (for touches 2-4)
--
-- Returns enriched touch data including channel and template_id from campaign_touches.

CREATE OR REPLACE FUNCTION claim_due_campaign_touches(limit_count INT DEFAULT 100)
RETURNS TABLE (
  enrollment_id UUID,
  business_id UUID,
  campaign_id UUID,
  job_id UUID,
  customer_id UUID,
  touch_number INT,
  channel TEXT,
  template_id UUID,
  scheduled_at TIMESTAMPTZ
) AS $$
  -- Touch 1: First touch of campaign
  SELECT
    e.id AS enrollment_id,
    e.business_id,
    e.campaign_id,
    e.job_id,
    e.customer_id,
    1 AS touch_number,
    t.channel,
    t.template_id,
    e.touch_1_scheduled_at AS scheduled_at
  FROM campaign_enrollments e
  INNER JOIN campaign_touches t ON t.campaign_id = e.campaign_id AND t.touch_number = 1
  WHERE e.status = 'active'
    AND e.current_touch = 1
    AND e.touch_1_scheduled_at <= NOW()
    AND e.touch_1_sent_at IS NULL
  FOR UPDATE OF e SKIP LOCKED

  UNION ALL

  -- Touch 2: Second touch of campaign (only if touch 1 sent)
  SELECT
    e.id AS enrollment_id,
    e.business_id,
    e.campaign_id,
    e.job_id,
    e.customer_id,
    2 AS touch_number,
    t.channel,
    t.template_id,
    e.touch_2_scheduled_at AS scheduled_at
  FROM campaign_enrollments e
  INNER JOIN campaign_touches t ON t.campaign_id = e.campaign_id AND t.touch_number = 2
  WHERE e.status = 'active'
    AND e.current_touch = 2
    AND e.touch_2_scheduled_at <= NOW()
    AND e.touch_2_sent_at IS NULL
    AND e.touch_1_sent_at IS NOT NULL  -- Guardrail: previous touch must be sent
  FOR UPDATE OF e SKIP LOCKED

  UNION ALL

  -- Touch 3: Third touch of campaign (only if touch 2 sent)
  SELECT
    e.id AS enrollment_id,
    e.business_id,
    e.campaign_id,
    e.job_id,
    e.customer_id,
    3 AS touch_number,
    t.channel,
    t.template_id,
    e.touch_3_scheduled_at AS scheduled_at
  FROM campaign_enrollments e
  INNER JOIN campaign_touches t ON t.campaign_id = e.campaign_id AND t.touch_number = 3
  WHERE e.status = 'active'
    AND e.current_touch = 3
    AND e.touch_3_scheduled_at <= NOW()
    AND e.touch_3_sent_at IS NULL
    AND e.touch_2_sent_at IS NOT NULL  -- Guardrail: previous touch must be sent
  FOR UPDATE OF e SKIP LOCKED

  UNION ALL

  -- Touch 4: Fourth touch of campaign (only if touch 3 sent)
  SELECT
    e.id AS enrollment_id,
    e.business_id,
    e.campaign_id,
    e.job_id,
    e.customer_id,
    4 AS touch_number,
    t.channel,
    t.template_id,
    e.touch_4_scheduled_at AS scheduled_at
  FROM campaign_enrollments e
  INNER JOIN campaign_touches t ON t.campaign_id = e.campaign_id AND t.touch_number = 4
  WHERE e.status = 'active'
    AND e.current_touch = 4
    AND e.touch_4_scheduled_at <= NOW()
    AND e.touch_4_sent_at IS NULL
    AND e.touch_3_sent_at IS NOT NULL  -- Guardrail: previous touch must be sent
  FOR UPDATE OF e SKIP LOCKED

  ORDER BY scheduled_at ASC
  LIMIT limit_count;
$$ LANGUAGE sql;
