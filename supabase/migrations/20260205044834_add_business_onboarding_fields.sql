-- Add onboarding-specific fields to businesses table
-- Phase 28: Onboarding Redesign (Plan 01)

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS software_used TEXT,
  ADD COLUMN IF NOT EXISTS sms_consent_acknowledged BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_consent_acknowledged_at TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN businesses.phone IS 'Business phone number (E.164 format validated in app)';
COMMENT ON COLUMN businesses.software_used IS 'CRM/field service software: servicetitan, jobber, housecall_pro, none, or NULL';
COMMENT ON COLUMN businesses.sms_consent_acknowledged IS 'Business owner acknowledged SMS consent requirements during onboarding';
COMMENT ON COLUMN businesses.sms_consent_acknowledged_at IS 'Timestamp when SMS consent acknowledgment was recorded';
