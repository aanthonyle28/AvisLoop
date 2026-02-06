---
phase: QA-FIX-audit-remediation
plan: 04
subsystem: ui
tags: [phosphor-icons, icon-migration, design-system, react]

# Dependency graph
requires:
  - phase: QA-AUDIT
    provides: List of 41 files using lucide-react that should migrate to Phosphor
provides:
  - 11 high-priority user-facing components migrated to Phosphor icons
  - Consistent icon system in dashboard pages and key components
affects: [QA-FIX-05, future-icon-migrations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phosphor icons use size={} and weight='regular' props instead of className for sizing"
    - "Use weight='fill' for filled icons (like filled stars in ratings)"

key-files:
  modified:
    - app/(dashboard)/history/error.tsx
    - app/(dashboard)/billing/page.tsx
    - app/(dashboard)/feedback/page.tsx
    - components/feedback/feedback-card.tsx
    - components/feedback/feedback-list.tsx
    - components/customers/empty-state.tsx
    - components/customers/csv-import-dialog.tsx
    - components/history/empty-state.tsx
    - components/history/history-filters.tsx
    - components/billing/usage-warning-banner.tsx
    - components/settings/integrations-section.tsx

key-decisions:
  - "Phosphor icon mapping: AlertCircle->WarningCircle, CheckCircle2->CheckCircle, MessageSquare->ChatCircle"
  - "Phosphor icon mapping: History->ClockCounterClockwise, Send->PaperPlaneTilt"
  - "Phosphor icon mapping: AlertTriangle->Warning, RefreshCw->ArrowsClockwise, Search->MagnifyingGlass"
  - "Phosphor icon mapping: FileSpreadsheet->FileXls, Loader2->CircleNotch, RotateCcw->ArrowCounterClockwise"
  - "Phosphor icon mapping: Mail->Envelope"

patterns-established:
  - "Icon size props: size={16} for small (h-4 w-4), size={20} for medium (h-5 w-5), size={32} for large (h-8 w-8), size={48} for x-large (h-12 w-12)"
  - "Weight prop for icon style: weight='regular' (default), weight='fill' for filled"

# Metrics
duration: 5min
completed: 2026-02-06
---

# Phase QA-FIX Plan 04: Icon Consistency Summary

**Migrated 11 high-priority user-facing files from lucide-react to @phosphor-icons/react for consistent icon system**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-06T01:18:35Z
- **Completed:** 2026-02-06T01:23:02Z
- **Tasks:** 4
- **Files modified:** 11

## Accomplishments

- Migrated 3 dashboard page files (history/error.tsx, billing/page.tsx, feedback/page.tsx)
- Migrated 2 feedback component files (feedback-card.tsx, feedback-list.tsx)
- Migrated 2 customer component files (empty-state.tsx, csv-import-dialog.tsx)
- Migrated 4 history/settings/billing files (empty-state.tsx, history-filters.tsx, usage-warning-banner.tsx, integrations-section.tsx)
- No lucide-react imports remain in any migrated files
- TypeScript and lint pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate dashboard page icons (3 files)** - `11a2e75` (refactor)
2. **Task 2: Migrate feedback component icons (2 files)** - `92aa60b` (refactor)
3. **Task 3: Migrate customer component icons (2 files)** - `007992d` (refactor)
4. **Task 4: Migrate history and settings component icons (4 files)** - `8626d76` (refactor)

## Files Modified

- `app/(dashboard)/history/error.tsx` - Error page: AlertCircle -> WarningCircle
- `app/(dashboard)/billing/page.tsx` - Billing page: CheckCircle2 -> CheckCircle
- `app/(dashboard)/feedback/page.tsx` - Feedback page: MessageSquare -> ChatCircle
- `components/feedback/feedback-card.tsx` - Feedback card: Star, Check, RotateCcw->ArrowCounterClockwise, Mail->Envelope
- `components/feedback/feedback-list.tsx` - Feedback list: MessageSquare -> ChatCircle
- `components/customers/empty-state.tsx` - Customer empty state: Users, Upload, Plus
- `components/customers/csv-import-dialog.tsx` - CSV import: Upload, FileSpreadsheet->FileXls, AlertCircle->WarningCircle, CheckCircle, Loader2->CircleNotch
- `components/history/empty-state.tsx` - History empty state: History->ClockCounterClockwise, Send->PaperPlaneTilt
- `components/history/history-filters.tsx` - History filters: X, Search->MagnifyingGlass, Loader2->CircleNotch
- `components/billing/usage-warning-banner.tsx` - Usage warning: AlertTriangle -> Warning
- `components/settings/integrations-section.tsx` - Integrations: Key, Copy, Check, RefreshCw->ArrowsClockwise

## Decisions Made

Icon mappings from lucide-react to @phosphor-icons/react:
- `AlertCircle` -> `WarningCircle`
- `CheckCircle2` -> `CheckCircle`
- `MessageSquare` -> `ChatCircle`
- `History` -> `ClockCounterClockwise`
- `Send` -> `PaperPlaneTilt`
- `AlertTriangle` -> `Warning`
- `RefreshCw` -> `ArrowsClockwise`
- `Search` -> `MagnifyingGlass`
- `FileSpreadsheet` -> `FileXls`
- `Loader2` -> `CircleNotch`
- `RotateCcw` -> `ArrowCounterClockwise`
- `Mail` -> `Envelope`
- `Star`, `Check`, `Key`, `Copy`, `X`, `Users`, `Upload`, `Plus` - same name in both libraries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 11 high-priority files migrated, 30 remaining files still use lucide-react
- QA-FIX-05 (Legacy Code Cleanup) ready to proceed
- Icon migration patterns established for future migrations

---
*Phase: QA-FIX-audit-remediation*
*Completed: 2026-02-06*
