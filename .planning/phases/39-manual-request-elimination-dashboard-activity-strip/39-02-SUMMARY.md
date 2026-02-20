---
phase: 39-manual-request-elimination-dashboard-activity-strip
plan: 02
subsystem: ui
tags: [dashboard, campaign-activity, kpi-widgets, react, next.js, date-fns]

# Dependency graph
requires:
  - phase: 39-01
    provides: CampaignEvent + PipelineSummary types and getRecentCampaignEvents() data function

provides:
  - RecentCampaignActivity strip component showing last 5 campaign events with inline pipeline counters
  - KPIWidgets trimmed to top 3 outcome cards only (pipeline cards removed)
  - Dashboard page wired to fetch recentEvents + pass pipelineSummary to strip

affects:
  - 39-04 (dashboard is now the primary hub, pipeline metrics visible as counters not cards)
  - future dashboard work should use RecentCampaignActivitySkeleton for loading state

# Tech tracking
tech-stack:
  added: [date-fns formatDistanceToNow (already in deps)]
  patterns:
    - PipelineSummary derived inline from kpiData after Promise.all — no extra query needed
    - "Server component derives and passes typed sub-objects to client components (PipelineSummary)"

key-files:
  created:
    - components/dashboard/recent-campaign-activity.tsx
  modified:
    - components/dashboard/kpi-widgets.tsx
    - app/(dashboard)/dashboard/page.tsx

key-decisions:
  - "Pipeline numbers (active sequences, pending, requests sent) preserved as inline counters in strip header — not lost, just moved from cards"
  - "RecentCampaignActivity is a plain div (not Card component) — matches plan spec for rounded-lg border bg-card pattern"
  - "getRecentCampaignEvents added as 5th parallel query in dashboard Promise.all — zero sequential overhead"
  - "KPIWidgets still imports Card — it remains needed for KPIWidgetsSkeleton skeleton cards"

patterns-established:
  - "Activity strip: header with inline counters + event list + View All link — reusable pattern for future strips"
  - "Icon dispatch via switch on event.type — maps CampaignEventType to Phosphor icon component"

# Metrics
duration: ~2min
completed: 2026-02-20
---

# Phase 39 Plan 02: Dashboard Activity Strip Summary

**RecentCampaignActivity strip replaces 3 pipeline metric cards on dashboard — concrete campaign events replace abstract numbers, with pipeline counters preserved inline in the strip header**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-20T04:54:25Z
- **Completed:** 2026-02-20T04:56:21Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Created `RecentCampaignActivity` client component rendering up to 5 campaign events with status icon, description, and relative timestamp
- Removed all 3 pipeline metric cards from `KPIWidgets` and their skeleton — dashboard now shows only the 3 outcome KPI cards (Reviews, Rating, Conversion)
- Dashboard page fetches `recentEvents` in parallel and derives `PipelineSummary` from `kpiData`, passing both to the new strip
- Pipeline numbers (active sequences, pending, sent this week) preserved as space-separated inline counters in the strip header
- Empty state copy: "No campaign activity yet — complete a job to get started" — V2 aligned

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RecentCampaignActivity strip component** - `6e3e68f` (feat)
2. **Task 2: Remove pipeline cards from KPIWidgets, wire activity strip into dashboard** - `99c3a80` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `components/dashboard/recent-campaign-activity.tsx` - New client component: event list, inline counters, empty state, skeleton
- `components/dashboard/kpi-widgets.tsx` - Removed bottom 3 pipeline Card components and their skeleton block
- `app/(dashboard)/dashboard/page.tsx` - Added getRecentCampaignEvents import, 5th Promise.all query, PipelineSummary derivation, RecentCampaignActivity in JSX

## Decisions Made

- Pipeline numbers preserved as inline counters (not dropped) — ensures user always has quick access to pipeline health without dedicated cards taking up vertical space
- `PipelineSummary` derived from `kpiData` post-fetch, no additional DB query — activeSequences/pendingQueued/requestsSentThisWeek already fetched by `getDashboardKPIs`
- `RecentCampaignActivity` is a plain `div` with `rounded-lg border bg-card px-5 py-4` rather than the `<Card>` component — matches plan spec exactly, avoids nested card-in-card patterns
- `KPIWidgets` still imports `Card` since it's still used by `KPIWidgetsSkeleton` for the 3 outcome skeleton cards

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Dashboard layout is complete: greeting, 3 outcome KPIs, RecentCampaignActivity strip, ReadyToSendQueue, AttentionAlerts
- Ready for plan 39-04: /send page redirect and manual request de-emphasis
- `RecentCampaignActivitySkeleton` available if Suspense boundaries are added to dashboard in a future plan

---
*Phase: 39-manual-request-elimination-dashboard-activity-strip*
*Completed: 2026-02-20*
