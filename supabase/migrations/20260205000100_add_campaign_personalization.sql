-- Add personalization_enabled column to campaigns table
-- Default TRUE: AI personalization is on by default per Phase 25 decisions
-- Allows per-campaign toggle to disable personalization

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS personalization_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Comment for documentation
COMMENT ON COLUMN campaigns.personalization_enabled IS 'Whether AI message personalization is enabled for this campaign (default: true)';
