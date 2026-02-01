---
phase: 19
plan: 06
subsystem: send
completed: 2026-02-01
duration: "6m 27s"

tags: [bulk-send, tanstack-table, filter-chips, sticky-ui, confirmation-dialog]

requires:
  - phase: 19
    plan: 03
    reason: SendSettingsBar component for template + schedule

provides:
  - artifact: BulkSendTab
    exports: [BulkSendTab]
    purpose: Contact table with filter chips for bulk sending
  - artifact: BulkSendColumns
    exports: [createBulkSendColumns]
    purpose: Simplified table columns for send context
  - artifact: BulkSendActionBar
    exports: [BulkSendActionBar]
    purpose: Gmail-style sticky action bar
  - artifact: BulkSendConfirmDialog
    exports: [BulkSendConfirmDialog]
    purpose: Pre-send confirmation with eligibility breakdown

affects:
  - phase: 19
    plan: 07
    scope: History drawer integration
  - phase: 19
    plan: 08
    scope: Send page polish

tech-stack:
  added: []
  patterns:
    - TanStack Table for contact selection
    - Filter chips with OR logic
    - Sticky bottom bar pattern
    - Client-side eligibility categorization

key-files:
  created:
    - components/send/bulk-send-tab.tsx
    - components/send/bulk-send-columns.tsx
    - components/send/bulk-send-action-bar.tsx
    - components/send/bulk-send-confirm-dialog.tsx
  modified:
    - components/send/send-page-client.tsx (already wired in 19-05)
    - app/(dashboard)/send/page.tsx (already wired in 19-05)

decisions:
  - id: filter-chip-or-logic
    choice: Multiple active filters use OR logic (not AND)
    rationale: More intuitive - "show me contacts that are EITHER never sent OR added today"
    alternatives: AND logic would be too restrictive
  - id: cooldown-categorization
    choice: Categorize contacts client-side in confirmation dialog
    rationale: Avoids duplicate logic between UI and server, uses existing resendReadyIds
    alternatives: Server-side categorization would require new endpoint
  - id: sticky-bar-positioning
    choice: Fixed bottom with md:left-64 offset for desktop sidebar
    rationale: Gmail-style UX, doesn't block content, accessible on mobile
    alternatives: Inline bar would require scrolling to find
---

# Phase 19 Plan 06: Bulk Send Tab Summary

**One-liner:** Gmail-style bulk send interface with filter chips, sticky action bar, and pre-send confirmation dialog

## What Was Built

### Bulk Send Table (Task 1)
**Commit:** `f374700`

Created `components/send/bulk-send-columns.tsx`:
- Simplified columns for send context: Checkbox, Name, Email, Last Sent, Status
- Last Sent shows relative time using `formatDistanceToNow` ("3 days ago", "Never")
- Status indicator with color-coded dots:
  - 🟢 Green: Ready to send (never sent or past cooldown)
  - 🟡 Yellow: On cooldown (< 14 days since last send)
  - 🔴 Red: Opted out or archived
- Opted-out contacts have disabled checkboxes

Created `components/send/bulk-send-tab.tsx`:
- SendSettingsBar integration for template + schedule selection
- Filter chips with toggle behavior (OR logic):
  - "Never sent (X)" — contacts where `last_sent_at` is null
  - "Added today (X)" — contacts created today
  - "Sent > 30 days (X)" — contacts where `last_sent_at < 30 days ago`
  - "Issues (X)" — opted-out or archived contacts
  - Multiple chips can be active simultaneously
  - Counts update dynamically
- TanStack Table with:
  - Row selection via checkboxes
  - Sorting (default: oldest `last_sent_at` first)
  - Pagination (50 contacts per page)
  - Filtered data based on active chips
- Opted-out rows grayed out (50% opacity)
- Integrates BulkSendActionBar when selection > 0

### Sticky Action Bar + Confirmation (Task 2)
**Commit:** `981c679`

Created `components/send/bulk-send-action-bar.tsx`:
- Gmail-style sticky bottom bar (fixed bottom-0)
- Desktop: offset `md:left-64` for sidebar
- Mobile: full width (above bottom nav)
- Shows "X selected" count
- Actions:
  - "Send request" primary button → opens dialog for selected contacts
  - "Send to all filtered (Y)" secondary → opens dialog for all filtered contacts (only shown if filtered > selected)
  - "Clear" → clears selection
- Disabled if `hasReviewLink` is false

Created `components/send/bulk-send-confirm-dialog.tsx`:
- Radix Dialog with pre-send confirmation
- Client-side eligibility categorization:
  - Eligible: not opted out, not archived, past cooldown or never sent
  - On cooldown: last_sent_at within 14 days
  - Opted out: opted_out true or status archived
- Summary display:
  - Total contacts
  - ✅ Eligible (green)
  - ⚠️ Skipped - cooldown (yellow)
  - ❌ Opted out (red)
- Shows template name + subject
- Shows scheduled time (if scheduling)
- Handles both immediate send and scheduled send:
  - Immediate: calls `batchSendReviewRequest`
  - Scheduled: calls `scheduleReviewRequest`
- Success toast with "View history" action button
- Clears selection on success
- Prevents send if eligible count is 0

**Note:** Integration into `send-page-client.tsx` and `send/page.tsx` was already completed in plan 19-05. The wiring included:
- Fetching `resendReadyContacts` via `getResendReadyContacts(supabase, business.id)`
- Passing `resendReadyContactIds` to `BulkSendTab`
- Replacing placeholder with actual `BulkSendTab` component

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

### Filter Chip OR Logic
Filter chips use OR logic (union) rather than AND logic (intersection). When "Never sent" and "Added today" are both active, the table shows contacts that match EITHER filter.

**Why:** More intuitive for users. AND logic would be too restrictive — "show me contacts that are never sent AND added today AND sent > 30 days" makes no sense.

**Implementation:** `filteredContacts` computes all active filter checks and uses `.some()` to match any.

### Client-Side Eligibility Categorization
The confirmation dialog categorizes contacts client-side rather than calling a server endpoint.

**Why:**
- Avoids duplicate cooldown logic (already exists in `batchSendReviewRequest`)
- Uses existing `resendReadyIds` from server
- Faster UX (no roundtrip)

**Implementation:** Dialog receives `resendReadyIds` Set and `COOLDOWN_DAYS` constant, computes eligible/skipped/opted-out arrays on render.

### Sticky Bar Positioning
Action bar uses `fixed bottom-0` with `md:left-64` offset for desktop sidebar.

**Why:**
- Gmail-style pattern (familiar UX)
- Always visible without scrolling
- Mobile: full width (above bottom nav)
- Desktop: offset for sidebar (doesn't overlap)

**Alternatives considered:**
- Inline bar above table: requires scrolling to find actions
- Floating FAB: less clear what's selected

## Testing Notes

**Manual verification:**
1. Navigate to `/send`, switch to Bulk Send tab
2. Filter chips toggle correctly and show accurate counts
3. Table filters update when chips toggle
4. Select multiple contacts → sticky bar slides up
5. Click "Send request" → dialog shows correct eligible/skipped/opted-out counts
6. Confirm send → toast appears, selection clears, history refreshed
7. Test with scheduled send (1hr, 9AM, custom)
8. Verify opted-out contacts are grayed and unselectable
9. Verify "Send to all filtered" works with active filters

**Edge cases handled:**
- No contacts selected → action bar hidden
- All contacts opted out → dialog shows warning, send disabled
- No review link → send buttons disabled with tooltip
- Filtered count < selected count → "Send to all filtered" hidden

## Metrics

- **Files created:** 4
- **Files modified:** 2 (already updated in 19-05)
- **Lines added:** ~850
- **Commits:** 2
- **Duration:** 6m 27s

## Known Limitations

- Bulk send limited to 25 contacts (enforced by `batchSendSchema`)
- Pagination at 50 contacts per page (could be configurable)
- No bulk "select all pages" (only current page selectable via header checkbox)
- Filter chips don't persist across page refreshes (intentional)

## Next Phase Readiness

**Phase 19-07 (History Drawer):**
- Ready to integrate. BulkSendConfirmDialog already shows "View history" action in toast
- Can enhance toast action to open drawer instead of navigating to `/history`

**Phase 19-08 (Send Page Polish):**
- Ready for final polish pass
- May want to add empty states for filtered results ("No contacts match filters")

## Success Criteria

✅ Bulk Send tab shows contacts table with checkboxes
✅ Filter chips above table: Never sent, Added today, Sent > 30 days, Issues
✅ Sticky bottom action bar slides up when contacts selected
✅ Action bar shows X selected + Send request + Clear + Send to all filtered
✅ Send to selected and Send to all filtered both work
✅ Confirmation dialog shows total, eligible, skipped, template/schedule
✅ Template + schedule inline via shared SendSettingsBar
✅ `pnpm typecheck` passes
✅ `pnpm lint` passes

## Lessons Learned

### Integration Already Done
Plan 19-05 already wired the `BulkSendTab` into `send-page-client.tsx` and added `getResendReadyContacts` to `send/page.tsx`. This shows good forward-planning in the previous plan.

**Impact:** Reduced Task 2 scope to just creating the action bar and dialog components.

### Filter Chip Counts
Computing filter counts in `useMemo` with proper dependencies prevents unnecessary recalculations. The counts are displayed directly in the chip labels for immediate feedback.

**Pattern:** `filterCounts = useMemo(() => ({ 'never-sent': contacts.filter(...).length, ... }), [contacts])`

### TanStack Table Row State
The `data-state="selected"` attribute on `<TableRow>` automatically styles selected rows via Tailwind. This integrates seamlessly with TanStack Table's selection model.

**Pattern:** `<TableRow data-state={row.getIsSelected() && 'selected'}>`
