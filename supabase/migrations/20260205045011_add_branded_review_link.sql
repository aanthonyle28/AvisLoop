-- Add branded_review_link column to businesses table for storing Bitly short links
-- This supports DLVR-03 requirement for branded review links in review request messages

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS branded_review_link TEXT;

COMMENT ON COLUMN businesses.branded_review_link IS 'Bitly short link for the business Google review URL (DLVR-03)';
