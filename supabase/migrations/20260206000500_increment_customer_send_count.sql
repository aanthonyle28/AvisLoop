-- Atomic function to increment customer send_count and update last_sent_at
-- Prevents race conditions when multiple campaign touches fire concurrently

CREATE OR REPLACE FUNCTION increment_customer_send_count(
  p_customer_id UUID,
  p_sent_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID AS $$
BEGIN
  UPDATE customers
  SET
    send_count = COALESCE(send_count, 0) + 1,
    last_sent_at = p_sent_at,
    updated_at = NOW()
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict access to service role only (cron job uses service role)
REVOKE ALL ON FUNCTION increment_customer_send_count FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_customer_send_count TO service_role;

COMMENT ON FUNCTION increment_customer_send_count IS
  'Atomically increments send_count for a customer. Used by campaign cron processor.';
