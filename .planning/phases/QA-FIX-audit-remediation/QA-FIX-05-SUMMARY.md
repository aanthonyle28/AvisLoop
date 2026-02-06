---
phase: QA-FIX-audit-remediation
plan: 05
subsystem: code-cleanup
completed: 2026-02-06
duration: ~10 minutes
tags: [refactoring, types, customer-rename, send-page]
requires: [QA-FIX-03]
provides: [customer-type-consistency, renamed-function]
affects: []
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - components/send/bulk-send-confirm-dialog.tsx
    - components/send/bulk-send-action-bar.tsx
    - components/send/bulk-send-columns.tsx
    - components/send/email-preview-modal.tsx
    - components/send/message-preview.tsx
    - components/send/send-page-client.tsx
    - components/send/bulk-send-tab.tsx
    - components/send/quick-send-tab.tsx
    - components/history/request-detail-drawer.tsx
    - lib/data/send-logs.ts
    - app/(dashboard)/send/page.tsx
decisions:
  - id: customer-type-consistency
    title: Complete Contact to Customer type migration in Send components
    rationale: Phase 20 renamed contacts to customers; Send page code still had legacy Contact references
---

# Phase QA-FIX Plan 05: Legacy Code Cleanup Summary

**One-liner:** Completed Contact-to-Customer type migration in Send page components and renamed getResendReadyContacts function.

## What Was Built

Updated all Send page components to use the Customer type consistently and renamed the `getResendReadyContacts` function to `getResendReadyCustomers` to match the Phase 20 database migration.

## Task Completion

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Update type imports in Send components | Complete | 7ebddeb |
| 2 | Update bulk-send-tab.tsx and quick-send-tab.tsx | Complete | a6c5088 |
| 3 | Rename getResendReadyContacts function | Complete | a744e1d |

## Implementation Details

### Task 1: Send Component Type Updates

Updated 6 Send component files to use Customer type instead of Contact:

**Files Modified:**
- `bulk-send-confirm-dialog.tsx` - Updated import, props, and variable names
- `bulk-send-action-bar.tsx` - Updated import, props (selectedCustomers, allFilteredCustomers)
- `bulk-send-columns.tsx` - Updated import and column type definition
- `email-preview-modal.tsx` - Updated import, props, and function parameters
- `message-preview.tsx` - Updated import, props, and function parameters
- `send-page-client.tsx` - Already used Customer type (verified)

### Task 2: Main Tab Components

- `bulk-send-tab.tsx` - Updated variable name (selectedContacts -> selectedCustomers)
- `quick-send-tab.tsx` - Updated prop names for MessagePreview and EmailPreviewModal

### Task 3: Function Rename

- Renamed `getResendReadyContacts` to `getResendReadyCustomers` in `lib/data/send-logs.ts`
- Updated JSDoc comments to reference "customers" instead of "contacts"
- Updated all callers:
  - `app/(dashboard)/send/page.tsx` - Import, function call, variable names
  - `components/send/send-page-client.tsx` - Prop name
  - `components/send/bulk-send-tab.tsx` - Prop name and usage

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed request-detail-drawer.tsx**

- **Found during:** Task 1
- **Issue:** `components/history/request-detail-drawer.tsx` used MessagePreview with old `contact` prop
- **Fix:** Updated to use `customer` prop and renamed `mockContact` to `mockCustomer`
- **Files modified:** `components/history/request-detail-drawer.tsx`
- **Commit:** 7ebddeb (included in Task 1)

## Verification Results

- `grep -r "Contact" components/send/*.tsx` - Returns only comments, no type references
- `grep -r "getResendReadyContacts" .` - Returns only planning docs, no code references
- `pnpm typecheck` - Passes
- `pnpm lint` - Passes

## Success Criteria Verification

- [x] 6 Send component files updated to Customer type (Task 1)
- [x] bulk-send-tab.tsx and quick-send-tab.tsx updated (Task 2)
- [x] getResendReadyContacts renamed to getResendReadyCustomers (Task 3)
- [x] All callers of renamed function updated
- [x] No Contact type references in Send components (only comments)
- [x] TypeScript and lint pass

## Commits

| Hash | Message |
|------|---------|
| 7ebddeb | refactor(QA-FIX-05): update type imports to Customer in Send components |
| a6c5088 | refactor(QA-FIX-05): update variable names in main Send tab components |
| a744e1d | refactor(QA-FIX-05): rename getResendReadyContacts to getResendReadyCustomers |

## Next Phase Readiness

**QA-FIX-audit-remediation phase is complete.** All 5 remediation plans have been executed:

1. QA-FIX-01: Critical Blocker Fixes (migrations)
2. QA-FIX-02: Navigation Reorder
3. QA-FIX-03: Terminology Fixes
4. QA-FIX-04: Icon Consistency
5. QA-FIX-05: Legacy Code Cleanup

**Remaining items:**
- Apply database migrations (C01, C02) via `supabase db reset` when Docker is available
- Lucide-to-Phosphor migration is partial (11/41 high-priority files done)

**No blockers for subsequent phases.**
