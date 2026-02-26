---
phase: 48-onboarding-dashboard-behavior-fixes
plan: 01
subsystem: ui
tags: [dashboard, campaigns, onboarding, kpi, getting-started, campaign-selector]

# Dependency graph
requires:
  - phase: 45-foundation-visual-changes
    provides: dashboard layout and KPI widget components

provides:
  - Getting Started checklist step 2 triggers on campaign detail page (not list)
  - All 3 KPI stat cards link to /analytics uniformly
  - Attention alerts dismiss pipeline verified correct
  - CampaignSelector has "Create new campaign" option navigating to /campaigns

affects:
  - dashboard onboarding checklist (GS-02 trigger now detail-page-only)
  - add-job workflow (CampaignSelector UX)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sentinel constant pattern: CAMPAIGN_CREATE = '__create_campaign__' intercepted in onChange before calling parent handler"
    - "Promise.all side-effect pattern: append fire-and-forget server actions to existing Promise.all without destructuring their result"

key-files:
  created: []
  modified:
    - app/(dashboard)/campaigns/page.tsx
    - app/(dashboard)/campaigns/[id]/page.tsx
    - components/dashboard/kpi-widgets.tsx
    - components/jobs/campaign-selector.tsx

key-decisions:
  - "markCampaignReviewed triggers on campaign detail page visit — not list page — to ensure user actually inspected a campaign"
  - "All KPI cards link to /analytics rather than scattered destinations (history, feedback, history?status=reviewed)"
  - "Create new campaign navigates to /campaigns page rather than opening an inline dialog — avoids complexity"

patterns-established:
  - "Sentinel constant: export CAMPAIGN_CREATE = '__create_campaign__' and intercept in onChange before calling parent"

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 48 Plan 01: Getting Started trigger, KPI links, dismiss verify, campaign selector Summary

**Fixed 4 behavioral bugs: GS-02 campaign trigger moved to detail page, KPI cards unified to /analytics, dismiss pipeline verified, and "Create new campaign" option added to CampaignSelector**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T00:28:58Z
- **Completed:** 2026-02-26T00:30:59Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Moved `markCampaignReviewed()` from campaigns list page to `campaigns/[id]/page.tsx` Promise.all — Getting Started step 2 now requires actually visiting a campaign detail page
- Changed all 3 KPI card Link hrefs from `/history?status=reviewed`, `/feedback`, and `/history` to `/analytics` — consistent navigation destination
- Verified `attention-alerts.tsx` dismiss pipeline is correctly wired (`dismissedIds` state, `visibleAlerts` filter, `handleDismiss` passed to `AlertRow` via `onDismiss`, X button and mobile overflow menu both call `onDismiss?.(alert.id)`)
- Added `CAMPAIGN_CREATE = '__create_campaign__'` sentinel to `CampaignSelector`, inserted "+ Create new campaign" option after campaign options, added `useRouter` and intercept logic to navigate to `/campaigns` on selection

## Task Commits

Each task was committed atomically:

1. **Task 1: Move markCampaignReviewed to campaign detail page** - `e354a67` (fix)
2. **Task 2: Unify KPI card navigation to /analytics** - `49ef047` (fix)
3. **Task 3: Verify dismiss + add Create new campaign to CampaignSelector** - `5216c7e` (fix)

## Files Created/Modified

- `app/(dashboard)/campaigns/page.tsx` - Removed markCampaignReviewed import and call
- `app/(dashboard)/campaigns/[id]/page.tsx` - Added markCampaignReviewed import and added to Promise.all
- `components/dashboard/kpi-widgets.tsx` - All 3 KPI card hrefs changed to /analytics
- `components/jobs/campaign-selector.tsx` - Added CAMPAIGN_CREATE sentinel, useRouter, "+ Create new campaign" option with navigation

## Decisions Made

- `markCampaignReviewed()` appended to existing 6-item Promise.all without adding a 7th destructured variable — clean pattern for side-effect server actions
- "Create new campaign" navigates to /campaigns list page (which has a "New Campaign" button) rather than opening a dialog inline — avoids over-engineering the Add Job sheet
- All KPI cards now link to /analytics for consistency — specific filtered views (/history?status=reviewed etc.) were fragmented and unhelpful

## Deviations from Plan

None — plan executed exactly as written. Dismiss pipeline was verified as correct with no changes required.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 behavior fixes shipped and verified (lint + typecheck pass)
- Ready for Phase 48 Plan 02 (campaign preset picker redesign) — already committed per git log

---
*Phase: 48-onboarding-dashboard-behavior-fixes*
*Completed: 2026-02-26*
