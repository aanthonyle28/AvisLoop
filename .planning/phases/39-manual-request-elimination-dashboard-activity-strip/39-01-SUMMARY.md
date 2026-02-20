---
phase: 39-manual-request-elimination-dashboard-activity-strip
plan: 01
subsystem: dashboard
tags: [supabase, typescript, dashboard, campaign, query, types]

# Dependency graph
requires:
  - phase: 27-dashboard-redesign
    provides: existing getDashboardKPIs and dashboard data layer foundations
  - phase: 24-multi-touch-campaign-engine
    provides: campaign_enrollments, send_logs campaign attribution columns
  - phase: 26-review-funnel
    provides: customer_feedback table with rating and submitted_at
provides:
  - CampaignEvent interface (lib/types/dashboard.ts) covering touch_sent, review_click, feedback_submitted, enrollment
  - CampaignEventType union type
  - PipelineSummary interface for activity strip inline counters
  - getRecentCampaignEvents() query function (lib/data/dashboard.ts) — 4 parallel queries, merged and sorted
affects:
  - 39-02 (activity strip UI component that consumes CampaignEvent[])
  - 39-03 (dashboard page wiring that calls getRecentCampaignEvents)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "4-query parallel fan-out via Promise.all for heterogeneous event sources"
    - "Array.isArray() join normalization for Supabase embedded resource joins (consistent with getAttentionAlerts)"
    - "Prefixed event IDs (touch-, feedback-, enroll-, review-) to avoid collision when merging sources"

key-files:
  created: []
  modified:
    - lib/types/dashboard.ts
    - lib/data/dashboard.ts

key-decisions:
  - "feedback_submitted events use campaignName='Review feedback' as fallback — feedback is not always tied to a named campaign"
  - "Event IDs are prefixed by source (touch-/feedback-/enroll-/review-) to guarantee uniqueness across merged arrays"
  - "DashboardKPIs interface unchanged — pipeline metrics (requestsSentThisWeek, activeSequences, pendingQueued) remain for activity strip inline counters"
  - "Review clicks use reviewed_at as timestamp, not created_at — reflects when the customer actually clicked"

patterns-established:
  - "Parallel fan-out pattern: run N independent queries with Promise.all, merge results in JS, sort by timestamp, slice to limit"
  - "Join normalization: const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers — handles both array and object returns from Supabase joins"

# Metrics
duration: 1min
completed: 2026-02-20
---

# Phase 39 Plan 01: Dashboard Data Layer for Campaign Activity Strip

**CampaignEvent type and getRecentCampaignEvents() function provide the data layer for the RecentCampaignActivity strip, querying 4 parallel Supabase sources (touch sends, review clicks, feedback submissions, enrollments) merged and ranked by recency.**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-20T04:46:16Z
- **Completed:** 2026-02-20T04:48:03Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `CampaignEventType`, `CampaignEvent`, and `PipelineSummary` types to `lib/types/dashboard.ts` without disturbing the existing `DashboardKPIs` interface
- Implemented `getRecentCampaignEvents()` in `lib/data/dashboard.ts` with 4 parallel Supabase queries (touch sends, feedback submissions, enrollments, review clicks)
- Review click query correctly filters on `campaign_id IS NOT NULL` AND `reviewed_at IS NOT NULL` using `reviewed_at` as the event timestamp
- All 4 query results are merged into a single array, sorted by timestamp descending, and sliced to `limit`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CampaignEvent and PipelineSummary types** - `b41329c` (feat)
2. **Task 2: Create getRecentCampaignEvents query function** - `b7d34db` (feat)

**Plan metadata:** `<pending>` (docs: complete plan — see below)

## Files Created/Modified
- `lib/types/dashboard.ts` — Added `CampaignEventType` union, `CampaignEvent` interface, `PipelineSummary` interface (after existing types, before `QuickEnrollResult`)
- `lib/data/dashboard.ts` — Added `CampaignEvent` import, new `getRecentCampaignEvents()` export at end of file

## Decisions Made
- `feedback_submitted` events use `campaignName: 'Review feedback'` as fallback — customer_feedback rows are not always joined to a named campaign (enrollment_id can be null)
- Event IDs are prefixed by source (`touch-${id}`, `feedback-${id}`, `enroll-${id}`, `review-${id}`) to guarantee uniqueness when rows from different tables are merged into one array
- `DashboardKPIs` interface intentionally left unchanged — the 6 existing fields (including pipeline metrics) stay available so Plan 39-03 can use them for inline counters in the activity strip header
- Review clicks use `reviewed_at` as the event timestamp (not `created_at`) because it reflects when the customer actually clicked the review link

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

A pre-existing typecheck error in `components/campaigns/campaign-card.tsx` (`useRouter` referenced after removal) was present before execution began; it resolved when other staged changes from the working tree were incorporated. No action was taken on it as it was not introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `CampaignEvent` and `PipelineSummary` types are exported and ready for Plan 39-02 (activity strip UI component)
- `getRecentCampaignEvents()` is exported from `lib/data/dashboard.ts` and ready for Plan 39-03 (dashboard page wiring)
- `typecheck` and `lint` both pass with zero errors

---
*Phase: 39-manual-request-elimination-dashboard-activity-strip*
*Completed: 2026-02-20*
