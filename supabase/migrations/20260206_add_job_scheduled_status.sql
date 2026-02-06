-- Add 'scheduled' status to jobs table for V2 workflow
-- V2 Philosophy: Jobs can be created as 'scheduled', then marked 'completed' later
-- This supports dispatch-based workflows where office schedules, technician completes

-- 1. Drop the existing check constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- 2. Add new check constraint with 'scheduled' option
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('scheduled', 'completed', 'do_not_send'));

-- 3. Change default status to 'scheduled' for new jobs
ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'scheduled';

-- 4. Add index for scheduled jobs (for "Ready to Complete" queries)
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled
  ON jobs (business_id, created_at DESC)
  WHERE status = 'scheduled';

-- Note: Existing jobs with 'completed' or 'do_not_send' status remain unchanged
-- Campaign enrollment logic triggers only on 'completed' status
