-- Add phone column to businesses table
-- Referenced by Phase 28 onboarding step 1
-- Note: This column may already exist from 20260205044834_add_business_onboarding_fields.sql
-- Using IF NOT EXISTS for idempotency
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN businesses.phone IS 'Business phone number, E.164 format validated in app layer';
