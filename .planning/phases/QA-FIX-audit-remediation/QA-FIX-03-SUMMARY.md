---
phase: QA-FIX-audit-remediation
plan: 03
subsystem: ui
tags: [terminology, ux, v2-migration]

# Dependency graph
requires:
  - phase: 20-database-migration
    provides: Customer table rename from contacts
provides:
  - User-facing terminology aligned with V2 model (customer, message)
  - Consistent terminology across customer, history, dashboard, billing components
affects: [onboarding, future-ui-work]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - components/customers/add-customer-sheet.tsx
    - components/customers/customer-table.tsx
    - components/customers/empty-state.tsx
    - components/customers/csv-import-dialog.tsx
    - components/history/history-client.tsx
    - components/history/empty-state.tsx
    - components/history/request-detail-drawer.tsx
    - lib/data/dashboard.ts
    - components/billing/usage-warning-banner.tsx

key-decisions:
  - "Replaced all user-facing 'contact' with 'customer' in affected files"
  - "Replaced 'review request' with 'message' for consistency with V2 messaging model"
  - "Updated component prop names (onAddContact -> onAddCustomer) for API consistency"

patterns-established:
  - "V2 terminology: Use 'customer' instead of 'contact' in user-facing text"
  - "V2 terminology: Use 'message' instead of 'review request' in user-facing text"

# Metrics
duration: 4min
completed: 2026-02-06
---

# Phase QA-FIX Plan 03: Terminology Fixes Summary

**Replaced 17 instances of legacy 'contact' and 'review request' terminology with V2-aligned 'customer' and 'message' across 9 component files**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-06T01:17:53Z
- **Completed:** 2026-02-06T01:22:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Fixed 7 terminology issues in customer components (add-customer-sheet, customer-table, empty-state, csv-import-dialog)
- Fixed 8 terminology issues in history components (history-client, empty-state, request-detail-drawer)
- Fixed 2 terminology issues in dashboard and billing (dashboard.ts, usage-warning-banner)
- Updated component prop API (onAddContact -> onAddCustomer) for consistency

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Customers page terminology** - `467bf30` (fix)
2. **Task 2: Fix History page terminology** - `0216443` (fix)
3. **Task 3: Fix Dashboard and Billing terminology** - `8b88a48` (fix)

## Files Created/Modified
- `components/customers/add-customer-sheet.tsx` - Updated title and success message
- `components/customers/customer-table.tsx` - Updated bulk selection and empty state text
- `components/customers/empty-state.tsx` - Updated empty state text and prop name
- `components/customers/csv-import-dialog.tsx` - Updated importing progress text
- `components/history/history-client.tsx` - Updated success toast and page description
- `components/history/empty-state.tsx` - Updated empty state text and button label
- `components/history/request-detail-drawer.tsx` - Updated description and cooldown/opt-out messages
- `lib/data/dashboard.ts` - Updated bounced email alert action label
- `components/billing/usage-warning-banner.tsx` - Updated limit reached warning text

## Decisions Made
- Replaced 'contact' with 'customer' consistently in all user-facing strings
- Replaced 'review request' with 'message' to align with V2 multi-channel model
- Updated prop name `onAddContact` to `onAddCustomer` for API consistency
- File naming (request-detail-drawer.tsx) intentionally NOT changed - file renames are separate code cleanup task

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Terminology now consistent with V2 model
- Ready for QA-FIX-04 (Icon Consistency)
- Remaining terminology issues in other files may be addressed in future plans

---
*Phase: QA-FIX-audit-remediation*
*Completed: 2026-02-06*
