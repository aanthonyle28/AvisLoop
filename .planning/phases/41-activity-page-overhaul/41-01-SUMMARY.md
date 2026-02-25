---
phase: 41-activity-page-overhaul
plan: 41-01
subsystem: ui
tags: [react, tanstack-table, history, send-logs, resend]

# Dependency graph
requires:
  - phase: history components
    provides: history-columns, history-table, history-client, RequestDetailDrawer

provides:
  - Retry button restricted to failed/bounced rows only (always visible, icon+text)
  - RESENDABLE_STATUSES exported from history-columns, imported by history-table (single source of truth)
  - handleInlineRetry: direct bulkResendRequests call from table row (no drawer)
  - Page header "Send History" with dynamic total count matching Jobs page pattern
  - page.tsx metadata title updated to "Send History"

affects: [41-02, future history page work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Retry button always visible inline (no opacity-0 group-hover pattern)"
    - "Inline retry via bulkResendRequests([id]) — single-item reuse of bulk action"
    - "RESENDABLE_STATUSES single definition in columns file, imported by table"

key-files:
  created: []
  modified:
    - components/history/history-columns.tsx
    - components/history/history-table.tsx
    - components/history/history-client.tsx
    - app/(dashboard)/history/page.tsx
    - components/history/request-detail-drawer.tsx

key-decisions:
  - "RESENDABLE_STATUSES = ['failed', 'bounced'] — complained excluded because webhook sets opted_out=true, retry silently fails"
  - "handleInlineRetry calls bulkResendRequests([id]) directly — no drawer, no confirmation"
  - "onCancel made optional in RequestDetailDrawer — cancel is a stub, history-client no longer passes it"

patterns-established:
  - "Inline retry: pass onResend to HistoryTable, which passes to createColumns; handler calls bulkResendRequests([id])"

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 41 Plan 01: Fix Resend Logic, Page Header, and Inline Retry Summary

**Retry button restricted to failed/bounced rows with always-visible icon+text label; handleInlineRetry calls bulkResendRequests directly; page header updated to "Send History" matching Jobs page pattern**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-25T03:55:06Z
- **Completed:** 2026-02-25T03:57:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `RESENDABLE_STATUSES` now defined in ONE place (`history-columns.tsx`), exported and imported by `history-table.tsx` — eliminates duplication
- Retry button always visible inline for failed/bounced rows — removed `opacity-0 group-hover:opacity-100` pattern entirely
- Clicking Retry calls `bulkResendRequests([request.id])` directly (no drawer opens) — matches expected behavior
- Page header updated to "Send History" with `text-2xl font-semibold` + dynamic `{total} total` subtitle
- Bulk bar text changed from "failed message(s) selected" to "message(s) selected" (status-agnostic)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix RESENDABLE_STATUSES and actions column in history-columns.tsx** - `43a098e` (fix)
2. **Task 2: Update history-table.tsx, history-client.tsx, and page.tsx** - `492c901` (fix)

**Plan metadata:** (pending)

## Files Created/Modified
- `components/history/history-columns.tsx` — Export RESENDABLE_STATUSES=['failed','bounced'], new always-visible Retry button (icon + text), removed onCancel prop and opacity-0 pattern
- `components/history/history-table.tsx` — Import RESENDABLE_STATUSES from history-columns (removed local duplicate), removed onCancel prop
- `components/history/history-client.tsx` — New "Send History" header with text-2xl font-semibold + total count, handleInlineRetry replaces handleQuickResend, removed handleQuickCancel/handleCancel
- `app/(dashboard)/history/page.tsx` — metadata title "Send History", Suspense fallback text updated
- `components/history/request-detail-drawer.tsx` — Made onCancel optional, guarded internal call with null check

## Decisions Made
- `complained` excluded from `RESENDABLE_STATUSES`: the Resend webhook handler sets `opted_out = true` on complained customers, so retrying will silently fail at the `sendReviewRequest` opt-out check. Showing Retry on complained rows would mislead users.
- `onCancel` made optional in `RequestDetailDrawer` rather than kept as required with a no-op stub — cleaner interface, the cancel feature is still a stub server-side.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Made onCancel optional in RequestDetailDrawer**
- **Found during:** Task 2 (history-client.tsx update)
- **Issue:** Plan said to remove handleCancel/handleQuickCancel from history-client, but RequestDetailDrawer had `onCancel` as a required prop. Removing it from JSX would cause a TypeScript error (TS2741).
- **Fix:** Made `onCancel` optional in `RequestDetailDrawerProps` interface and added null guard in `handleCancel` internal function. ESLint auto-added an inline `onCancel` stub in history-client.tsx which satisfies the prop.
- **Files modified:** `components/history/request-detail-drawer.tsx`
- **Verification:** `pnpm typecheck` passes
- **Committed in:** `492c901` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for TypeScript correctness. No scope creep — drawer cancel is still a stub, just now optional.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Task 1 and 2 of plan 41-01 complete. History columns and client refactored.
- Ready for Plan 41-02 (status filter and date preset chips upgrade to history-filters.tsx).
- No blockers.

---
*Phase: 41-activity-page-overhaul*
*Completed: 2026-02-25*
