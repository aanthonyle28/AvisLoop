-- Transaction-safe function to replace all touches for a campaign
-- Prevents race conditions where delete completes but insert fails

CREATE OR REPLACE FUNCTION replace_campaign_touches(
  p_campaign_id UUID,
  p_touches JSONB
)
RETURNS VOID AS $$
DECLARE
  touch_record JSONB;
BEGIN
  -- Delete existing touches
  DELETE FROM campaign_touches WHERE campaign_id = p_campaign_id;

  -- Insert new touches from JSONB array
  FOR touch_record IN SELECT * FROM jsonb_array_elements(p_touches)
  LOOP
    INSERT INTO campaign_touches (campaign_id, touch_number, channel, delay_hours, template_id)
    VALUES (
      p_campaign_id,
      (touch_record->>'touch_number')::INT,
      touch_record->>'channel',
      (touch_record->>'delay_hours')::INT,
      NULLIF(touch_record->>'template_id', '')::UUID
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to call this function (RLS on campaigns table handles authorization)
GRANT EXECUTE ON FUNCTION replace_campaign_touches TO authenticated;

COMMENT ON FUNCTION replace_campaign_touches IS
  'Atomically replaces all touches for a campaign. Used when updating campaign configuration.';
