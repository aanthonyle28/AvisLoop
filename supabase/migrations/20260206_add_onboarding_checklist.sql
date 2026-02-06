-- Add onboarding checklist tracking to businesses table
-- Tracks milestone completion for Getting Started card on dashboard

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB NOT NULL DEFAULT '{
  "first_job_added": false,
  "campaign_reviewed": false,
  "job_completed": false,
  "first_review_click": false,
  "dismissed": false,
  "dismissed_at": null,
  "collapsed": false,
  "first_seen_at": null
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN businesses.onboarding_checklist IS 'Tracks Getting Started checklist progress. Items auto-complete based on actual data. dismissed=true hides checklist. collapsed=true shows header only (auto after 3 days).';

-- Index for querying businesses with incomplete checklists (for analytics)
CREATE INDEX IF NOT EXISTS idx_businesses_checklist_incomplete
ON businesses ((onboarding_checklist->>'dismissed'))
WHERE onboarding_checklist->>'dismissed' = 'false';
