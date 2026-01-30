---
phase: 14-scheduled-send-management
plan: 02
subsystem: scheduled-send
tags: [ui-components, client-components, bulk-operations, dialogs, tabs, responsive]

requires:
  - phase-14-plan-01-backend-infrastructure
  - radix-tabs-ui-component
  - bulk-server-actions
  - scheduled-sends-with-details-data-layer

provides:
  - tabbed-scheduled-table
  - expandable-row-details
  - bulk-selection-with-shift-click
  - floating-action-bar
  - styled-cancel-reschedule-dialogs

affects:
  - phase-14-complete

tech-stack:
  added: []
  patterns:
    - "Tabbed interface with Radix UI Tabs"
    - "Expandable rows with inline detail views"
    - "Checkbox selection with shift-click range selection"
    - "Gmail-style floating action bar"
    - "Styled confirmation dialogs (no native confirm)"
    - "Responsive desktop/mobile layouts (table vs cards)"

key-files:
  created:
    - components/scheduled/expanded-details.tsx
    - components/scheduled/bulk-action-bar.tsx
    - components/scheduled/cancel-dialog.tsx
    - components/scheduled/reschedule-dialog.tsx
  modified:
    - components/scheduled/scheduled-table.tsx
    - components/scheduled/cancel-button.tsx
    - app/(dashboard)/scheduled/page.tsx

decisions:
  D14-02-01:
    choice: "Checkboxes only on Pending tab, not Past tab"
    rationale: "Past sends (completed/failed/cancelled) cannot be rescheduled or cancelled, so selection is not needed"
    impact: "Cleaner UI for Past tab, no unnecessary controls"
    date: "2026-01-30"
  D14-02-02:
    choice: "Reset expanded state and selection on tab change"
    rationale: "Prevent confusion when switching between Pending and Past tabs with different row sets"
    impact: "User must re-expand and re-select after tab change"
    date: "2026-01-30"
  D14-02-03:
    choice: "Filter out 'Send now' preset from reschedule dialog"
    rationale: "Rescheduling to 'now' doesn't make semantic sense - use bulk cancel instead"
    impact: "Reschedule dialog only shows future time options"
    date: "2026-01-30"
  D14-02-04:
    choice: "Show inline results summary in Past tab table rows"
    rationale: "Users can see sent/skipped/failed counts at a glance without expanding"
    impact: "Faster scanning of past send outcomes"
    date: "2026-01-30"

metrics:
  duration: "4m 29s"
  tasks: 2
  commits: 2
  files-changed: 7
  completed: "2026-01-30"
---

# Phase 14 Plan 02: Scheduled Table Rewrite Summary

**One-liner:** Tabbed scheduled send table with expandable per-contact results, checkbox selection with shift-click, floating action bar, and styled confirmation dialogs using Phase 15 design system.

## What Was Built

### 1. Supporting Components (Task 1)

**ExpandedDetails** (`components/scheduled/expanded-details.tsx`):
- Props: `{ scheduledSend: ScheduledSendWithDetails }`
- Shows email subject preview if `custom_subject` exists
- For completed sends: results summary with semantic status colors (green for sent, orange for skipped, red for failed)
- Per-contact breakdown table: name, email, status badge, error message if present
- For pending sends: shows scheduled date and contact count
- Calculates "skipped" as `contact_ids.length - sendLogs.length` (contacts with no send_log due to cooldown/opt-out/archive)
- Uses `bg-muted/50 rounded-md p-4` container styling

**CancelDialog** (`components/scheduled/cancel-dialog.tsx`):
- Props: `{ open, onOpenChange, selectedCount, onConfirm, isPending }`
- Uses Radix Dialog primitive from `@/components/ui/dialog`
- Title: "Cancel N scheduled send(s)?"
- Description: "This action cannot be undone..."
- Two buttons: "Keep Scheduled" (outline) and "Cancel N Send(s)" (destructive)
- Disables confirm button while pending, shows CircleNotch spinner

**RescheduleDialog** (`components/scheduled/reschedule-dialog.tsx`):
- Props: `{ open, onOpenChange, selectedCount, onConfirm, isPending }`
- Uses Radix Dialog primitive
- Title: "Reschedule N send(s)"
- Description: "All selected sends will be rescheduled to the same new date and time"
- **Filters out "Send now" preset** - only shows future schedule options (In 1 hour, Next morning, In 24 hours, Custom)
- Shows formatted new time when selected: "New scheduled time: **[formatted date]**"
- Two buttons: "Cancel" (outline) and "Reschedule N Send(s)" (primary, disabled until date selected)
- Disables confirm button while pending, shows spinner
- Resets scheduledFor state when dialog closes

**BulkActionBar** (`components/scheduled/bulk-action-bar.tsx`):
- Props: `{ selectedCount, onReschedule, onCancel, onClearSelection }`
- Only renders when `selectedCount > 0`
- Fixed position at bottom center: `fixed bottom-6 left-1/2 -translate-x-1/2 z-50`
- Animates in from bottom: `animate-in slide-in-from-bottom-5 duration-200`
- Layout: "N selected" text | vertical separator | "Reschedule" button (outline) | "Cancel" button (destructive) | "Clear" button (ghost)
- Uses Button component size="sm" for action buttons
- Phase 15 border-only design (no shadow on bar)

### 2. Scheduled Table Rewrite (Task 2)

**Complete rewrite of `components/scheduled/scheduled-table.tsx`**:

**Props:** `{ sends: ScheduledSendWithDetails[] }`

**State management:**
- `activeTab: 'pending' | 'past'` (defaults to 'pending')
- `expanded: Record<string, boolean>` (row expanded state, reset on tab switch)
- `rowSelection: Record<string, boolean>` (checkbox selection state, only for pending tab)
- `lastSelectedId: string | null` (for shift-click range selection)
- `showCancelDialog: boolean`
- `showRescheduleDialog: boolean`
- `isBulkPending: boolean` (loading state for bulk actions)

**Data split:**
- `pending`: sends with status === 'pending', sorted by scheduled_for ascending
- `past`: sends with status !== 'pending', sorted by scheduled_for descending

**Tabs layout** using Radix Tabs:
- Tab triggers: "Pending (N)" and "Past (N)" with counts
- On tab change: reset expanded state and row selection

**Pending tab features:**
- Desktop: HTML table with proper thead/tbody
- Checkbox column: header checkbox (select all/deselect all) + row checkboxes
- **Shift-click range selection:** Tracks `lastSelectedId`, on shift+click selects all rows between last and current
- Expand indicator: CaretRight (collapsed) / CaretDown (expanded) from Phosphor
- Columns: Checkbox | Expand | Contacts | Scheduled For | Status | Actions
- Individual cancel button (CancelButton component with styled dialog)
- Clicking row (not checkbox) toggles expanded state
- Expanded row renders full-width colSpan cell with ExpandedDetails
- Mobile: Card layout with checkboxes always visible

**Past tab features:**
- Desktop table without checkboxes
- Columns: Expand | Contacts | Scheduled For | Status | Results
- **Results summary** for completed sends: "N sent / N skipped / N failed" inline with semantic colors
- Expandable rows with ExpandedDetails
- Mobile: Card layout with results summary

**Bulk action wiring:**
- Renders BulkActionBar with selectedCount and handlers
- On "Cancel" action: opens CancelDialog
- On "Reschedule" action: opens RescheduleDialog
- On CancelDialog confirm: calls `bulkCancelScheduledSends(selectedIds)`, shows toast, clears selection, refreshes
- On RescheduleDialog confirm: calls `bulkRescheduleScheduledSends(selectedIds, newDate)`, shows toast, clears selection, refreshes
- Uses `useRouter().refresh()` after successful bulk actions to refetch data

**Phase 15 design system:**
- Phosphor icons (CaretRight, CaretDown, Users, Clock, CheckCircle, XCircle, Warning)
- Semantic status colors: blue for pending, green for completed, red for failed, outline for cancelled
- Border-only design (no shadows)
- Rounded corners (8px standard)

**CancelButton updated:**
- Replaced `window.confirm()` with local state + CancelDialog
- Uses styled Dialog from `@/components/ui/dialog`
- Phosphor icons (X, CircleNotch for spinner)
- Same server action call (`cancelScheduledSend`)

**Scheduled page updated:**
- Imports `getScheduledSendsWithDetails` from `@/lib/data/scheduled` instead of `getScheduledSends`
- Passes detailed sends data to ScheduledTable
- Phosphor icons: CalendarBlank, PaperPlaneTilt
- Updated empty state with Phosphor icons and Phase 15 styling

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Phosphor icon imports**
- **Found during:** Task 1 typecheck verification
- **Issue:** Imported `Loader2` from Phosphor icons, but Phosphor uses `CircleNotch` for spinner
- **Fix:** Changed all `Loader2` imports to `CircleNotch` in cancel-dialog.tsx, reschedule-dialog.tsx, and cancel-button.tsx
- **Files modified:** components/scheduled/cancel-dialog.tsx, components/scheduled/reschedule-dialog.tsx, components/scheduled/cancel-button.tsx
- **Commit:** 50537da (same commit, fixed before commit)

**2. [Rule 1 - Bug] Fixed error message display in expanded-details**
- **Found during:** Task 1 typecheck verification
- **Issue:** Tried to access `log.error_message` outside the `.map()` loop, causing "Cannot find name 'log'" error
- **Fix:** Moved error message display inside the map, wrapped in conditional check for each log
- **Files modified:** components/scheduled/expanded-details.tsx
- **Commit:** 50537da (same commit, fixed before commit)

## Key Technical Details

### Shift-Click Range Selection

The checkbox selection supports Gmail-style shift-click range selection:

1. User clicks checkbox on row A → selects row A, stores as `lastSelectedId`
2. User shift-clicks checkbox on row F → calculates range from A to F
3. All rows in range (A, B, C, D, E, F) are selected
4. Works in both directions (forward and backward)

Implementation:
```typescript
if (event?.shiftKey && lastSelectedId) {
  const visibleIds = pending.map(s => s.id)
  const lastIndex = visibleIds.indexOf(lastSelectedId)
  const currentIndex = visibleIds.indexOf(id)
  const start = Math.min(lastIndex, currentIndex)
  const end = Math.max(lastIndex, currentIndex)
  const range = visibleIds.slice(start, end + 1)
  // Select all IDs in range
}
```

### Expandable Rows

Both desktop and mobile support row expansion:
- Desktop: Clicking anywhere on row (except checkbox/actions) toggles expand
- Mobile: Tapping card (except checkbox/actions) toggles expand
- Expanded content rendered below row in full-width cell
- Expand state tracked in `expanded: Record<string, boolean>`
- Reset on tab change to avoid confusion

### Bulk Operations Flow

1. User selects rows via checkboxes (with optional shift-click)
2. BulkActionBar appears at bottom with "N selected" and action buttons
3. User clicks "Cancel" or "Reschedule"
4. Styled dialog opens with confirmation/picker
5. User confirms action
6. Client component calls server action (`bulkCancelScheduledSends` or `bulkRescheduleScheduledSends`)
7. Server action validates (max 50 items, business ownership, pending status)
8. Database update with Supabase `.in()` filter
9. Revalidates `/scheduled` path
10. Client shows success toast, clears selection, refreshes page

### Responsive Design

**Desktop (md+):**
- HTML `<table>` with proper semantic structure
- Hover states on rows
- Checkboxes on Pending tab only
- Expand indicator in separate column

**Mobile (<md):**
- Card-based layout with `rounded-lg border`
- Checkboxes always visible (not hover-only) for touch support
- Expand by tapping card
- Same BulkActionBar at bottom (works on mobile)
- Results summary in card footer for Past tab

### Phase 15 Design System Integration

All components follow Phase 15 patterns:
- **Icons:** Phosphor only (no Lucide)
- **Colors:** Semantic status palette (green for success, orange for warning, red for error)
- **Borders:** Border-only design, no box-shadows
- **Spacing:** Consistent p-3, p-4, gap-2, gap-3 throughout
- **Typography:** font-medium for emphasis, text-muted-foreground for secondary text
- **Animations:** slide-in-from-bottom for floating action bar

## Testing Notes

### Verification Completed

- ✓ `pnpm typecheck` passes with no errors
- ✓ `pnpm lint` passes (1 pre-existing warning in send-form.tsx)
- ✓ All new components export their named functions
- ✓ ScheduledTable accepts ScheduledSendWithDetails[] prop
- ✓ CancelDialog and RescheduleDialog use Radix Dialog (not native confirm)
- ✓ RescheduleDialog filters out "Send now" preset
- ✓ BulkActionBar only renders when selectedCount > 0
- ✓ Phase 15 design system patterns throughout (Phosphor icons, semantic colors, border-only)

### Manual Testing Required (Production Verification)

**Pending tab:**
- [ ] Tabs show "Pending (N)" and "Past (N)" with correct counts
- [ ] Clicking a row expands to show ExpandedDetails
- [ ] Checkboxes appear on all pending rows
- [ ] Header checkbox selects/deselects all
- [ ] Individual checkbox selection works
- [ ] Shift-click selects range of rows
- [ ] Floating action bar appears when rows selected
- [ ] "Cancel" button opens styled CancelDialog
- [ ] "Reschedule" button opens RescheduleDialog with ScheduleSelector
- [ ] CancelDialog confirmation calls bulkCancelScheduledSends
- [ ] RescheduleDialog confirmation calls bulkRescheduleScheduledSends
- [ ] Success toast appears after bulk action
- [ ] Selection clears after bulk action
- [ ] Page refreshes to show updated data
- [ ] Individual cancel button opens styled dialog (not native confirm)

**Past tab:**
- [ ] No checkboxes on Past tab rows
- [ ] Completed sends show inline results summary (sent/skipped/failed counts)
- [ ] Clicking row expands to show per-contact results
- [ ] Per-contact table shows name, email, status badge
- [ ] Failed contacts show error_message if present
- [ ] Skipped count calculated correctly (contacts with no send_log)
- [ ] Semantic colors (green for sent, orange for skipped, red for failed)

**Mobile:**
- [ ] Cards render instead of table
- [ ] Checkboxes visible on pending cards
- [ ] Tapping card expands details
- [ ] Floating action bar appears at bottom
- [ ] Dialogs work on mobile

**Edge cases:**
- [ ] Empty state shows when no scheduled sends
- [ ] Empty Pending tab shows "No pending scheduled sends"
- [ ] Empty Past tab shows "No past scheduled sends"
- [ ] Tab change resets expanded state and selection
- [ ] Bulk cancel with >50 IDs returns error
- [ ] Bulk reschedule with past date returns error

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Phase 14 Complete:** All Phase 14 requirements met:
- ✓ MGMT-01: Tabbed list shows all scheduled sends with status, time, and recipient count
- ✓ MGMT-02: Individual and bulk cancel with styled confirmation dialogs
- ✓ MGMT-03: Completed sends show inline summary counts and expandable per-contact breakdown
- ✓ MGMT-04: Bulk reschedule via floating action bar, ScheduleSelector dialog, and confirmation
- ✓ All Phase 15 design system patterns followed (Phosphor icons, semantic colors, border-only)
- ✓ Responsive on desktop and mobile

**Ready for:** Phase 14 completion verification, potential /gsd:audit-milestone

## Commits

| Hash    | Message                                                                   |
| ------- | ------------------------------------------------------------------------- |
| 50537da | feat(14-02): create expanded details, dialogs, and floating action bar components |
| 8a17aeb | feat(14-02): rewrite scheduled table with tabs, expandable rows, and bulk selection |

---

**Phase:** 14-scheduled-send-management
**Plan:** 02
**Completed:** 2026-01-30
**Duration:** 4 minutes 29 seconds
