-- Migration: Rename email_templates to message_templates with multi-channel support
-- Phase: 23-01 (Message Templates & Migration)
-- Purpose: Unified template storage for email and SMS review request messages

BEGIN;

-- 1. Create backup table for rollback safety
CREATE TABLE IF NOT EXISTS email_templates_backup AS
SELECT * FROM email_templates;

-- 2. Rename table (instantaneous, no data copy)
ALTER TABLE email_templates RENAME TO message_templates;

-- 3. Add channel discriminator column with default 'email' for existing rows
ALTER TABLE message_templates
  ADD COLUMN channel TEXT NOT NULL DEFAULT 'email'
  CHECK (channel IN ('email', 'sms'));

-- Remove default after migration (new rows must specify channel)
ALTER TABLE message_templates ALTER COLUMN channel DROP DEFAULT;

-- 4. Add service_type column for linking templates to service categories
ALTER TABLE message_templates
  ADD COLUMN service_type TEXT
  CHECK (service_type IS NULL OR service_type IN ('hvac', 'plumbing', 'electrical', 'cleaning', 'roofing', 'painting', 'handyman', 'other'));

-- 5. Make business_id NULLABLE for system templates
ALTER TABLE message_templates ALTER COLUMN business_id DROP NOT NULL;

-- 6. Create backward-compatible view (simple SELECT is auto-updatable in PG 9.3+)
CREATE VIEW email_templates AS
  SELECT id, business_id, name, subject, body, is_default, created_at, updated_at
  FROM message_templates
  WHERE channel = 'email';

-- 7. Drop old RLS policies
DROP POLICY IF EXISTS "Users view own templates" ON message_templates;
DROP POLICY IF EXISTS "Users insert own templates" ON message_templates;
DROP POLICY IF EXISTS "Users update own templates" ON message_templates;
DROP POLICY IF EXISTS "Users delete own templates" ON message_templates;

-- Recreate RLS policies on message_templates
CREATE POLICY "Users view own templates" ON message_templates
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    OR is_default = true
  );

CREATE POLICY "Users insert own templates" ON message_templates
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    AND is_default = false
  );

CREATE POLICY "Users update own templates" ON message_templates
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    AND is_default = false
  );

CREATE POLICY "Users delete own templates" ON message_templates
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    AND is_default = false
  );

-- 8. Update indexes
DROP INDEX IF EXISTS idx_email_templates_business_id;
CREATE INDEX idx_message_templates_business_id ON message_templates(business_id);
CREATE INDEX idx_message_templates_channel ON message_templates(channel);
CREATE INDEX idx_message_templates_is_default ON message_templates(is_default) WHERE is_default = true;

-- 9. Recreate moddatetime trigger on renamed table
DROP TRIGGER IF EXISTS templates_updated_at ON message_templates;
CREATE TRIGGER message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- 10. Insert 16 system default templates (8 service types x 2 channels)

-- EMAIL templates (8 service types)
INSERT INTO message_templates (business_id, name, channel, service_type, subject, body, is_default) VALUES
-- HVAC
(NULL, 'HVAC Service Review', 'email', 'hvac',
 'How was your AC/heating service, {{CUSTOMER_NAME}}?',
 E'Hi {{CUSTOMER_NAME}},\n\nThank you for choosing {{BUSINESS_NAME}} for your HVAC service! We hope your home is now perfectly comfortable.\n\nWe''d love to hear about your experience. Your feedback helps us continue providing excellent heating and cooling services.\n\nLeave a review here: {{REVIEW_LINK}}\n\nThanks for your trust in us,\n{{SENDER_NAME}}',
 true),

-- Plumbing
(NULL, 'Plumbing Service Review', 'email', 'plumbing',
 'Quick feedback on your plumbing service?',
 E'Hi {{CUSTOMER_NAME}},\n\nThank you for trusting {{BUSINESS_NAME}} with your plumbing needs! We hope everything is flowing smoothly now.\n\nYour feedback means a lot to us and helps other homeowners find reliable plumbing service.\n\nShare your experience: {{REVIEW_LINK}}\n\nThanks for choosing us,\n{{SENDER_NAME}}',
 true),

-- Electrical
(NULL, 'Electrical Service Review', 'email', 'electrical',
 'Your electrical work is complete - quick question?',
 E'Hi {{CUSTOMER_NAME}},\n\nThank you for choosing {{BUSINESS_NAME}} for your electrical work! Your safety and satisfaction are our top priorities.\n\nWe''d appreciate hearing about your experience. Your review helps us maintain the highest standards.\n\nLeave a review here: {{REVIEW_LINK}}\n\nBest regards,\n{{SENDER_NAME}}',
 true),

-- Cleaning
(NULL, 'Cleaning Service Review', 'email', 'cleaning',
 'Sparkling clean! How did we do?',
 E'Hi {{CUSTOMER_NAME}},\n\nWe hope your space is looking and feeling fresh after our visit! Thank you for choosing {{BUSINESS_NAME}}.\n\nWe pay attention to every detail, and your feedback helps us keep improving.\n\nShare your thoughts: {{REVIEW_LINK}}\n\nThank you,\n{{SENDER_NAME}}',
 true),

-- Roofing
(NULL, 'Roofing Service Review', 'email', 'roofing',
 'Roof work finished - your thoughts?',
 E'Hi {{CUSTOMER_NAME}},\n\nThank you for trusting {{BUSINESS_NAME}} with your roof! We take pride in protecting your home with quality workmanship.\n\nYour feedback helps other homeowners make informed decisions about their roofing needs.\n\nLeave a review: {{REVIEW_LINK}}\n\nBest regards,\n{{SENDER_NAME}}',
 true),

-- Painting
(NULL, 'Painting Service Review', 'email', 'painting',
 'Fresh paint! How does it look?',
 E'Hi {{CUSTOMER_NAME}},\n\nWe hope you''re enjoying your freshly painted space! Thank you for choosing {{BUSINESS_NAME}} to transform your home.\n\nYour review helps us continue delivering beautiful results for homeowners like you.\n\nShare your experience: {{REVIEW_LINK}}\n\nThank you,\n{{SENDER_NAME}}',
 true),

-- Handyman
(NULL, 'Handyman Service Review', 'email', 'handyman',
 'Your repairs are done - how did we do?',
 E'Hi {{CUSTOMER_NAME}},\n\nThank you for calling {{BUSINESS_NAME}} to get things done! We hope everything is working just as it should.\n\nYour feedback helps us continue providing dependable handyman services.\n\nLeave a review: {{REVIEW_LINK}}\n\nThanks again,\n{{SENDER_NAME}}',
 true),

-- Other
(NULL, 'Service Review Request', 'email', 'other',
 'We''d love your feedback!',
 E'Hi {{CUSTOMER_NAME}},\n\nThank you for choosing {{BUSINESS_NAME}}! We appreciate your trust in our services.\n\nYour feedback is valuable and helps us serve you and others better.\n\nShare your experience: {{REVIEW_LINK}}\n\nBest regards,\n{{SENDER_NAME}}',
 true);

-- SMS templates (8 service types)
INSERT INTO message_templates (business_id, name, channel, service_type, subject, body, is_default) VALUES
-- HVAC (138 chars)
(NULL, 'HVAC Service SMS', 'sms', 'hvac', '',
 'Hi {{CUSTOMER_NAME}}, thanks for choosing {{BUSINESS_NAME}} for HVAC! We''d love your feedback. Reply YES for review link.',
 true),

-- Plumbing (134 chars)
(NULL, 'Plumbing Service SMS', 'sms', 'plumbing', '',
 'Hi {{CUSTOMER_NAME}}, your plumbing work is done! How''d we do? Reply YES to share feedback on {{BUSINESS_NAME}}.',
 true),

-- Electrical (140 chars)
(NULL, 'Electrical Service SMS', 'sms', 'electrical', '',
 'Hi {{CUSTOMER_NAME}}, electrical work complete! Your feedback helps us serve you better. Reply YES for review link - {{BUSINESS_NAME}}',
 true),

-- Cleaning (133 chars)
(NULL, 'Cleaning Service SMS', 'sms', 'cleaning', '',
 'Hi {{CUSTOMER_NAME}}, hope your space is sparkling! Quick feedback on {{BUSINESS_NAME}}? Reply YES for review link.',
 true),

-- Roofing (131 chars)
(NULL, 'Roofing Service SMS', 'sms', 'roofing', '',
 'Hi {{CUSTOMER_NAME}}, roof work finished! We''d appreciate your thoughts on {{BUSINESS_NAME}}. Reply YES for review link.',
 true),

-- Painting (123 chars)
(NULL, 'Painting Service SMS', 'sms', 'painting', '',
 'Hi {{CUSTOMER_NAME}}, fresh paint done! How does it look? Reply YES to share feedback on {{BUSINESS_NAME}}.',
 true),

-- Handyman (114 chars)
(NULL, 'Handyman Service SMS', 'sms', 'handyman', '',
 'Hi {{CUSTOMER_NAME}}, repairs complete! How''d {{BUSINESS_NAME}} do? Reply YES for review link.',
 true),

-- Other (119 chars)
(NULL, 'Service SMS', 'sms', 'other', '',
 'Hi {{CUSTOMER_NAME}}, thanks for choosing {{BUSINESS_NAME}}! We''d love your feedback. Reply YES for review link.',
 true);

COMMIT;
