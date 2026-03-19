-- Fix project_tickets status constraint to match application values
-- The original migration used: open, in_progress, waiting_client, resolved, closed
-- The application uses: submitted, in_progress, completed (plus the originals for compatibility)

-- Drop the old constraint and add an expanded one
ALTER TABLE public.project_tickets DROP CONSTRAINT IF EXISTS project_tickets_status_check;
ALTER TABLE public.project_tickets ADD CONSTRAINT project_tickets_status_check
  CHECK (status IN ('open', 'submitted', 'in_progress', 'waiting_client', 'resolved', 'completed', 'closed'));
