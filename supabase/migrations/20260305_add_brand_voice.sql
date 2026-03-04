-- Add brand_voice column to businesses for AI personalization tone
-- Stores preset key or "preset_key|custom description"
ALTER TABLE businesses ADD COLUMN brand_voice TEXT;
