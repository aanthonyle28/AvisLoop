---
phase: 64-history-analytics-feedback
plan: 01
subsystem: testing
tags: [qa, playwright, history, send-logs, status-filter, date-filter, bulk-select, resend]

# Dependency graph
requires:
  - phase: 63-campaigns
    provides: AUDIT_ customer + campaign + enrollment data needed to seed send_logs

provides:
  - QA audit of History page (/history) with HIST-01 through HIST-05 verdicts
  - 10 seeded send_log rows in Supabase for downstream phase testing
  - BUG-HIST-01 documented: timezone bug in getSendLogs date range filter

affects:
  - 64-02 (Analytics QA) — send_logs seeded here are used by analytics data functions
  - 64-03 (Feedback QA) — customer records confirmed, send data available
  - Future: getSendLogs fix needed before production on non-UTC machines

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "QA pattern: Supabase REST API for data seeding + Playwright for UI verification"
    - "QA pattern: Direct URL navigation with query params to test server-side filters"

key-files:
  created:
    - docs/qa-v3.1/64-history.md
    - qa-64-history-full-desktop.png
    - qa-64-history-filter-failed.png
    - qa-64-history-filter-delivered.png
    - qa-64-history-date-preset.png
    - qa-64-history-retry-buttons.png
    - qa-64-history-bulk-select.png
    - qa-scripts/history-qa-task1.js
  modified: []

key-decisions:
  - "HIST-03 FAIL (BUG-HIST-01): Date range filter timezone bug confirmed — getSendLogs uses setHours(23,59,59,999) in local time not UTC; endOfDay for 2026-03-02 on UTC-6 machine = 2026-03-02T05:59Z, excluding today's rows at 2026-03-02T19-22Z"
  - "complained status: Not in RESENDABLE_STATUSES by design — spam complaint rows show Failed badge but no Retry button"
  - "Date preset chip vs direct URL: clicking chip sets URL params correctly but server result is wrong due to timezone bug"
  - "Filter uses raw DB status values; display badge uses normalized labels — both are correct and intentional by design"

patterns-established:
  - "QA Pattern: Seed via REST API before Playwright session to ensure isolated, reproducible test data"
  - "QA Pattern: Navigate directly to filtered URLs (not only UI chip clicks) to distinguish client vs server filter bugs"

# Metrics
duration: 11min
completed: 2026-03-02
---

# Phase 64 Plan 01: History QA Summary

**History page QA: send log display, status normalization, filter, retry buttons, and bulk select — 4/5 PASS; BUG-HIST-01 timezone bug in date range filter documented**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-02T23:53:51Z
- **Completed:** 2026-03-03T00:05:28Z
- **Tasks:** 1/1
- **Files modified:** 8 created

## Accomplishments

- Seeded 10 send_log rows with varied statuses (delivered, failed, bounced, pending, sent, opened, complained) across today/past-week/past-3-months date ranges
- Verified HIST-01: 10 rows displayed, all 7 DB statuses correctly normalized to 3 display labels (Delivered/Failed/Pending)
- Verified HIST-02: Radix Select status filter matches raw DB values exactly (Failed=2, Delivered=3, Bounced=1)
- HIST-03: FAIL — identified BUG-HIST-01: `setHours(23,59,59,999)` uses local timezone (UTC-6), producing endOfDay = `2026-03-02T05:59Z` which excludes today's rows at `2026-03-02T19-22Z`
- Verified HIST-04: 3 Retry buttons on exactly the 3 failed+bounced rows; no Retry on pending/sent/delivered/opened/complained
- Verified HIST-05: Checkboxes only on resendable rows, Select All selects exactly 3 rows, "3 messages selected" + Retry Selected button appear correctly

## Task Commits

1. **Task 1: Seed send_logs + verify HIST-01 through HIST-05** - `f6e1db7`

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `docs/qa-v3.1/64-history.md` — QA findings with PASS/FAIL for HIST-01 through HIST-05, bug documentation
- `qa-64-history-full-desktop.png` — Full history page, all 10 rows, 1440x900
- `qa-64-history-filter-failed.png` — Status filter "Failed" active, 2 rows
- `qa-64-history-filter-delivered.png` — Status filter "Delivered" active, 3 rows
- `qa-64-history-date-preset.png` — "Today" chip active, 0 rows (bug visible)
- `qa-64-history-retry-buttons.png` — All 10 rows, 3 Retry buttons on failed/bounced
- `qa-64-history-bulk-select.png` — Select All active, 3 rows checked, Retry Selected visible
- `qa-scripts/history-qa-task1.js` — Playwright test script for History QA

## Decisions Made

- **BUG-HIST-01 (Medium):** `getSendLogs` date filter bug — `setHours(23,59,59,999)` uses local machine timezone. Fix: use `new Date(dateTo + 'T23:59:59.999Z')` for explicit UTC end-of-day.
- **complained not resendable (by design):** `RESENDABLE_STATUSES = ['failed', 'bounced']` — `complained` status excluded from retry to avoid retrying messages where customer filed spam complaint.
- **Normalization asymmetry (by design):** `bounced` and `complained` both display as "Failed" badge, but only `bounced` gets a Retry button. Consistent with deliverability best practices.
- **Date preset + direct URL approach:** Chips set correct URL params. Issue is server-side (getSendLogs) not client-side (HistoryFilters).

## Deviations from Plan

None — plan executed as specified. BUG-HIST-01 was a finding, not an auto-fix (the bug is in production code `lib/data/send-logs.ts` and was documented per QA audit scope rather than modified without explicit approval).

## Issues Encountered

- **HIST-03 Date Filter Bug:** "Today" chip click correctly sets URL `?from=2026-03-02&to=2026-03-02` but server returns 0 rows instead of 4. Root cause confirmed via direct Supabase REST query (which returns 4 rows correctly) vs Next.js server component (returns 0). Issue isolated to `getSendLogs` `endOfDay.setHours()` using local time.

- **Playwright race condition initially:** First HIST-03 test used `waitForLoadState('networkidle')` after chip click, but chip state is client-only and doesn't trigger network request before URL navigation. Fixed by waiting for `networkidle` after the URL navigation settles.

- **HIST-05 selector confusion:** Initial selector `page.locator('.text-sm.font-medium')` was ambiguous. Resolved by checking full page text for `/(\d+)\s+messages?\s+selected/i` pattern.

## User Setup Required

None — no external service configuration required. Send logs seeded in Supabase and will remain for Phase 64-02 and 64-03.

## Next Phase Readiness

- 10 send_log rows now exist for Audit Test HVAC business — Analytics page (64-02) can read aggregated data
- BUG-HIST-01 should be fixed before production: `lib/data/send-logs.ts` line 58 — change `setHours(23,59,59,999)` to explicit UTC end-of-day
- Phase 64-02 (Analytics) and 64-03 (Feedback) can proceed without blockers

---
*Phase: 64-history-analytics-feedback*
*Completed: 2026-03-02*
