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

-- Recover stuck "processing" records that have been claimed for more than
-- 10 minutes without completing. This handles cron crashes / timeouts.
CREATE OR REPLACE FUNCTION recover_stuck_scheduled_sends(stale_minutes INT DEFAULT 10)
RETURNS SETOF scheduled_sends AS $$
  UPDATE scheduled_sends
  SET status = 'pending'
  WHERE status = 'processing'
    AND updated_at < now() - (stale_minutes || ' minutes')::interval
  RETURNING *;
$$ LANGUAGE sql;
