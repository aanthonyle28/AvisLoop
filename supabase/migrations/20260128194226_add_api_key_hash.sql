-- Add API key hash column to businesses table for webhook authentication
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS api_key_hash TEXT;

-- Add unique constraint on contacts for webhook deduplication
-- This allows upsert by business_id + email
ALTER TABLE contacts ADD CONSTRAINT IF NOT EXISTS contacts_business_id_email_unique UNIQUE (business_id, email);
