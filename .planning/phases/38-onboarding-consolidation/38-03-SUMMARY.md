---
phase: 38-onboarding-consolidation
plan: 03
subsystem: ui
tags: [onboarding, checklist, amber, tailwind, server-action, supabase]

# Dependency graph
requires:
  - phase: 35-token-system
    provides: "Warning amber CSS tokens (--warning-bg, --warning-foreground, --warning-border, --warning) in globals.css and tailwind.config.ts"
  - phase: 32-post-onboarding
    provides: "setup-progress-pill.tsx and setup-progress-drawer.tsx components, getChecklistState data function, checklist actions"
provides:
  - "Warm amber Getting Started pill (bg-warning-bg/text-warning-foreground/border-warning-border)"
  - "Amber progress bar in drawer (bg-warning)"
  - "markCampaignReviewed server action (short-circuits on repeat visits)"
  - "campaign_reviewed reads from stored JSONB flag instead of campaign count"
  - "Campaigns page calls markCampaignReviewed on load"
  - "DB queries in getChecklistState reduced from 5 to 4"
affects:
  - 39-manual-request-elimination
  - any future onboarding checklist changes

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Page-visit-triggered server action pattern: await markCampaignReviewed() at top of async page component"
    - "Short-circuit guard on server action: check stored flag before DB write to minimize writes"
    - "Stored JSONB flag pattern for checklist items that require specific user actions (not derivable from data counts)"

key-files:
  created: []
  modified:
    - components/onboarding/setup-progress-pill.tsx
    - components/onboarding/setup-progress-drawer.tsx
    - lib/actions/checklist.ts
    - lib/data/checklist.ts
    - app/(dashboard)/campaigns/page.tsx

key-decisions:
  - "campaign_reviewed stored as explicit JSONB flag — not derivable from campaign existence; only set when user visits /campaigns"
  - "await markCampaignReviewed() (not void) ensures flag is written before page renders; short-circuit on repeat visits keeps latency minimal"
  - "Warm amber pill aligns Getting Started pill with Phase 35 palette: bg-warning-bg / text-warning-foreground / border-warning-border"

patterns-established:
  - "Page-visit checklist completion: call server action at top of async server component, action reads flag first and returns early if already set"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 38 Plan 03: Checklist Amber Styling & Campaign-Reviewed Fix Summary

**Warm amber Getting Started pill (bg-warning-bg) replaces cold blue (bg-primary/10), and campaign_reviewed now requires visiting /campaigns instead of auto-completing when a campaign exists**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-19T02:14:26Z
- **Completed:** 2026-02-19T02:16:19Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Replaced cold blue (bg-primary/10 / text-primary / border-primary/20) with warm amber tokens on the Getting Started pill
- Changed drawer progress bar fill from bg-primary to bg-warning, matching the pill accent color
- Added markCampaignReviewed server action with short-circuit guard (read flag, skip write if already set)
- Updated getChecklistState to read campaign_reviewed from stored JSONB flag instead of counting active campaigns
- Removed campaigns count query from getChecklistState (5 queries -> 4 queries)
- Campaigns page calls await markCampaignReviewed() on every render (noop after first visit)

## Task Commits

Each task was committed atomically:

1. **Task 1: Warm amber pill and drawer styling** - `fc075c1` (feat)
2. **Task 2: Fix campaign_reviewed to require actual page visit** - `7eb8c26` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `components/onboarding/setup-progress-pill.tsx` - Incomplete state button now uses bg-warning-bg/text-warning-foreground/border-warning-border
- `components/onboarding/setup-progress-drawer.tsx` - Progress bar fill changed from bg-primary to bg-warning
- `lib/actions/checklist.ts` - Added markCampaignReviewed server action
- `lib/data/checklist.ts` - campaign_reviewed reads storedChecklist?.campaign_reviewed; campaigns count query removed
- `app/(dashboard)/campaigns/page.tsx` - Imports and awaits markCampaignReviewed() at top of page function

## Decisions Made
- `await markCampaignReviewed()` (not `void`) — guarantees the flag is written before the page renders; without await, a cold-start timeout could silently skip the write and the checklist item would stay incomplete permanently
- Short-circuit on repeat visits (one read, no write) keeps the page-load cost negligible on all subsequent /campaigns visits
- campaign_reviewed uses stored JSONB flag pattern (not campaign count) because "has a campaign" is a side effect of onboarding, not evidence the user actually reviewed their campaign setup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 38 plans 01-03 complete; onboarding consolidation nearly done
- Warm amber pill and meaningful checklist completion criteria ready for final QA
- No blockers for remaining Phase 38 plans

---
*Phase: 38-onboarding-consolidation*
*Completed: 2026-02-19*
