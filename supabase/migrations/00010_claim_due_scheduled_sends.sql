-- Atomically claim pending scheduled sends that are due for processing.
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions between
-- concurrent cron invocations.
CREATE OR REPLACE FUNCTION claim_due_scheduled_sends(limit_count INT DEFAULT 50)
RETURNS SETOF scheduled_sends AS $$
  UPDATE scheduled_sends
  SET status = 'processing'
  WHERE id IN (
    SELECT id FROM scheduled_sends
    WHERE status = 'pending' AND scheduled_for <= now()
    ORDER BY scheduled_for ASC
    LIMIT limit_count
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$ LANGUAGE sql;
