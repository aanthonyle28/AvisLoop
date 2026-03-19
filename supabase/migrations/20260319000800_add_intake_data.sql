-- Add intake_data JSONB column to store design brief info from client intake form
-- Structure: { description, targetAudience, brandColors, inspirationUrls, assetPaths }
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS intake_data JSONB DEFAULT NULL;

COMMENT ON COLUMN businesses.intake_data IS 'Design brief data captured from public client intake form (JSONB). Stores business description, target audience, brand colors, inspiration URLs, and uploaded asset storage paths.';
