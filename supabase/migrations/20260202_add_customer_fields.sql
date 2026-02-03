-- Migration: 20260202_add_customer_fields
-- Purpose: Add tags, phone status tracking, SMS consent audit trail, and timezone to customers table
-- Phase: 20-database-migration-customer-enhancement (Plan 02)

-- ============================================================================
-- 1. Tags (JSONB array for multi-tag support)
-- ============================================================================
-- Add tags column for customer segmentation (max 5 tags per customer)
ALTER TABLE customers ADD COLUMN tags JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Add constraint to limit tags to 5 per customer
ALTER TABLE customers ADD CONSTRAINT customers_max_5_tags
  CHECK (jsonb_array_length(tags) <= 5);

-- Create GIN index for fast tag filtering
-- Supports queries like: WHERE tags @> '["VIP"]' OR tags ?| array['VIP', 'repeat']
CREATE INDEX idx_customers_tags ON customers USING GIN (tags);

-- ============================================================================
-- 2. Phone status tracking
-- ============================================================================
-- Track phone validation status (set by app code during E.164 validation)
ALTER TABLE customers ADD COLUMN phone_status TEXT
  DEFAULT 'missing'
  NOT NULL
  CHECK (phone_status IN ('valid', 'invalid', 'missing'));

-- ============================================================================
-- 3. SMS consent audit trail fields (TCPA compliance)
-- ============================================================================
-- Current consent status
ALTER TABLE customers ADD COLUMN sms_consent_status TEXT
  DEFAULT 'unknown'
  NOT NULL
  CHECK (sms_consent_status IN ('opted_in', 'opted_out', 'unknown'));

-- When consent was captured
ALTER TABLE customers ADD COLUMN sms_consent_at TIMESTAMPTZ;

-- Source of consent capture (manual, migration, website_form, etc.)
ALTER TABLE customers ADD COLUMN sms_consent_source TEXT;

-- How consent was given
ALTER TABLE customers ADD COLUMN sms_consent_method TEXT
  CHECK (sms_consent_method IS NULL OR sms_consent_method IN (
    'verbal_in_person', 'phone_call', 'service_agreement', 'website_form', 'other'
  ));

-- Additional notes from user
ALTER TABLE customers ADD COLUMN sms_consent_notes TEXT;

-- IP address at time of consent capture
ALTER TABLE customers ADD COLUMN sms_consent_ip INET;

-- User who captured the consent
ALTER TABLE customers ADD COLUMN sms_consent_captured_by UUID REFERENCES auth.users(id);

-- Index for filtering by consent status
CREATE INDEX idx_customers_sms_consent_status ON customers(sms_consent_status);

-- ============================================================================
-- 4. Timezone support (for quiet hours compliance)
-- ============================================================================
-- IANA timezone identifier (e.g., 'America/New_York', 'America/Chicago')
-- Default to US Eastern; browser detection will provide actual timezone on creation
ALTER TABLE customers ADD COLUMN timezone TEXT DEFAULT 'America/New_York';

-- ============================================================================
-- 5. Update existing records for migration source
-- ============================================================================
-- Mark all existing customers with unknown consent as migration source
UPDATE customers
SET sms_consent_source = 'migration'
WHERE sms_consent_status = 'unknown' AND sms_consent_source IS NULL;
