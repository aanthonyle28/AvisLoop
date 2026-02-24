---
phase: 40-dashboard-command-center
plan: "04"
subsystem: ui
tags: [react, nextjs, supabase, dashboard, right-panel, context]

requires:
  - phase: 40-dashboard-command-center
    provides: "Plans 01-03 established DashboardShell, DashboardPanelProvider, RightPanel state machine, RightPanelDefault, RightPanelGettingStarted"

provides:
  - RightPanelJobDetail component with customer info, campaign status, enroll CTA, conflict actions
  - RightPanelAttentionDetail component with failed send retry, feedback resolve, bounced email ack
  - getReadyToSendJobWithCampaign() data function for job panel detail
  - JobPanelDetail type in lib/types/dashboard.ts
  - DashboardDetailContent inner component wired as detailContent in DashboardShell
  - Getting Started rendered in right panel default area (and mobile left column)
  - WelcomeCard removed from left column (replaced by right panel Getting Started)

affects:
  - plans 40-05 and beyond that build on completed dashboard right panel

tech-stack:
  added: []
  patterns:
    - "DashboardDetailContent inner component rendered inside DashboardShell context for panel view access"
    - "Alert description parsing helpers (extractCustomerName, extractErrorMessage, extractRating)"
    - "getReadyToSendJobWithCampaign data function fetches job + customer + active/matching campaign in single query"

key-files:
  created:
    - components/dashboard/right-panel-job-detail.tsx
    - components/dashboard/right-panel-attention-detail.tsx
  modified:
    - lib/types/dashboard.ts
    - lib/data/dashboard.ts
    - components/dashboard/dashboard-client.tsx
    - app/(dashboard)/dashboard/page.tsx

key-decisions:
  - "DashboardDetailContent is rendered as detailContent prop to DashboardShell — it renders inside the Provider context so useDashboardPanel() works correctly"
  - "Alert descriptions are parsed with regex helpers to extract customer name, error message, and rating for the detail panel"
  - "RightPanelJobDetail fetches data client-side on mount using getReadyToSendJobWithCampaign (server action call) to avoid prop drilling job detail from server"
  - "Getting Started shown in right panel when !dismissed && !first_review_click; shown in left column on mobile (lg:hidden)"
  - "businessId passed from server dashboard page to DashboardClient for use in data fetching"
  - "Conflict resolution actions (replace/skip/queue) shown inline in job detail panel when enrollment_resolution=conflict"

patterns-established:
  - "Right panel detail views fetch their own data on mount via server action calls (no prop drilling)"
  - "SelectableAlertItem constructed from AttentionAlert with description parsing for detail panel"

duration: 6min
completed: 2026-02-24
---

# Phase 40 Plan 04: Dashboard Right Panel Detail Views Summary

**Right panel job detail (customer info + campaign status + enroll CTA) and attention detail (retry/resolve/ack) wired into DashboardShell with Getting Started in right panel for new users**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-24T~00:00Z
- **Completed:** 2026-02-24T~00:06Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created `RightPanelJobDetail` — shows customer name/email/phone, service type, completion date, campaign match or enrollment status, notes, and context-sensitive CTA (enroll, send one-off, or conflict actions)
- Created `RightPanelAttentionDetail` — context-aware for failed sends (retry), unresolved feedback (star rating + feedback text + resolve link), and bounced emails (acknowledge)
- Wired `DashboardDetailContent` as `detailContent` inside `DashboardShell` — reads `panelView` from context and renders correct detail component
- Added `getReadyToSendJobWithCampaign()` to `lib/data/dashboard.ts` — fetches job + customer + matching active campaign in one call
- Added `JobPanelDetail` type to `lib/types/dashboard.ts`
- Getting Started now renders in right panel (replacing WelcomeCard in left column), plus mobile-only fallback in left column

## Task Commits

1. **Task 1: Create job detail and attention detail right panel views** - `75afa36` (feat)
2. **Task 2: Wire detail views and Getting Started into dashboard** - `1a8ff28` (feat)

**Plan metadata:** (see below — committed with SUMMARY + STATE)

## Files Created/Modified
- `components/dashboard/right-panel-job-detail.tsx` — Job detail panel with customer info, campaign status section, conflict actions, enroll CTA
- `components/dashboard/right-panel-attention-detail.tsx` — Alert detail panel for failed sends, feedback, bounced emails
- `lib/types/dashboard.ts` — Added `JobPanelDetail` interface
- `lib/data/dashboard.ts` — Added `getReadyToSendJobWithCampaign()` with job + customer + campaign join
- `components/dashboard/dashboard-client.tsx` — Wired detail components, Getting Started, removed WelcomeCard from left column
- `app/(dashboard)/dashboard/page.tsx` — Added `businessId` prop to `DashboardClient`

## Decisions Made
- `DashboardDetailContent` is an inner component rendered as `detailContent` prop to `DashboardShell`. Since `RightPanel` renders it inside `DashboardPanelContext.Provider`, `useDashboardPanel()` works correctly even though the JSX element is created outside the shell.
- Alert detail data (customer name, error message, rating) extracted from alert description strings using regex helpers rather than storing separate fields — avoids schema changes.
- `RightPanelJobDetail` calls `getReadyToSendJobWithCampaign` (server action) on mount rather than receiving data as props, keeping the component self-contained.
- `StatusDot` component uses `dotColor`/`label` props (not a `status` prop) — inline status badge used in job detail panel instead.

## Deviations from Plan

None — plan executed exactly as written. The `technician` field was confirmed absent from the jobs table (as noted in the plan) and correctly skipped.

## Issues Encountered
- TypeScript error on Supabase join result for `campaign_enrollments.campaigns` — the join returns an array shape that didn't match the expected `| null` type. Fixed with `as unknown as EnrollmentRow[]` cast with a correctly-typed local interface.
- Unused variable lint errors in initial draft of `dashboard-client.tsx` — cleaned up by removing intermediate scaffolding components.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Right panel state machine is fully wired: default (KPI/activity), job-detail, attention-detail, getting-started views all functional
- Plan 05 can build on completed panel infrastructure for additional interactions
- `onSendOneOff` prop on `RightPanelJobDetail` is defined but not wired to `QuickSendModal` — can be connected in a future plan if needed

---
*Phase: 40-dashboard-command-center*
*Completed: 2026-02-24*
