-- Migration: 20260303_apply_frozen_enrollment_status
-- Purpose: Apply the frozen enrollment status constraint that was missed in Phase 46.
-- This migration was originally in 20260226_add_frozen_enrollment_status.sql
-- but was never executed against the production database.
-- This version is idempotent and safe to run on an already-running database.

-- Step 1: Drop the old constraint if it exists (handles both old and new versions)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'enrollments_status_valid' 
    AND table_name = 'campaign_enrollments'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.campaign_enrollments DROP CONSTRAINT enrollments_status_valid;
  END IF;
END $$;

-- Step 2: Add the new constraint with 'frozen' included
ALTER TABLE public.campaign_enrollments
  ADD CONSTRAINT enrollments_status_valid CHECK (
    status IN ('active', 'completed', 'stopped', 'frozen')
  );

-- Step 3: Drop and recreate the partial unique index to cover frozen+active
DROP INDEX IF EXISTS idx_enrollments_unique_active;
CREATE UNIQUE INDEX idx_enrollments_unique_active
  ON public.campaign_enrollments (customer_id, campaign_id)
  WHERE status IN ('active', 'frozen');
