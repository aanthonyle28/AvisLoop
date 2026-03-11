-- Add notes column to contacts table
-- No new RLS policies needed - inherits existing table policies

ALTER TABLE public.contacts ADD COLUMN notes TEXT DEFAULT '' NOT NULL;
