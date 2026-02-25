---
status: complete
phase: 41-activity-page-overhaul
source: 41-01-SUMMARY.md, 41-02-SUMMARY.md
started: 2026-02-26T00:00:00Z
updated: 2026-02-26T00:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Retry Button Visibility
expected: Retry button only appears on rows with failed/bounced status. Delivered/sent/opened rows have NO retry button. The button shows icon + "Retry" text and is always visible (no hover-to-reveal).
result: pass

### 2. Bulk Select Checkbox Restriction
expected: Header checkbox label says "Select all failed" visibly. Only rows with failed/bounced status have individual checkboxes. Clicking header checkbox selects ALL failed/bounced rows.
result: issue
reported: "i dont seee the 'Select all failed' and the bulk select from the column doesn't work still"
severity: major

### 3. Page Header Pattern
expected: Page title shows "Send History" in bold text with subtitle "Track delivery status of your sent messages · N total" showing the actual count of messages.
result: pass

### 4. Status Filter Radix Select
expected: Status filter is a styled dropdown (Radix Select, not native HTML select) with proper styling. Shows "All statuses" by default. Clicking opens a styled popover with status options.
result: pass

### 5. Date Preset Chips
expected: Four date preset chips visible: Today, Past Week, Past Month, Past 3 Months. Styled as rounded-full pills. Clicking a chip auto-fills the From/To date range and highlights the active chip.
result: pass

### 6. Date Preset Mutual Exclusion
expected: After selecting a date preset chip, manually editing a date input deselects the active chip. Clicking an already-active preset chip clears the date range (toggle-off). Clear button resets both presets and date inputs.
result: skipped
reason: Verified implicitly via Test 5 re-test (Clear button worked, chip toggle worked)

## Summary

total: 6
passed: 4
issues: 1
pending: 0
skipped: 1

## Gaps

- truth: "Header checkbox selects all failed/bounced rows and shows visible label"
  status: failed
  reason: "User reported: i dont seee the 'Select all failed' and the bulk select from the column doesn't work still"
  severity: major
  test: 2
  root_cause: "Stale closure in onRowSelectionChange wrapper (history-table.tsx line 49). Each row.toggleSelected() call in the forEach loop uses the same stale rowSelection prop. React batches the setState calls and only the last one wins — selecting 1 of N failed rows."
  artifacts:
    - path: "components/history/history-columns.tsx"
      issue: "forEach loop calls row.toggleSelected() individually instead of building selection atomically"
    - path: "components/history/history-table.tsx"
      issue: "onRowSelectionChange wrapper uses stale rowSelection prop from closure"
  missing:
    - "Build complete selection state object in one pass and set atomically via table.setRowSelection()"
  debug_session: ".planning/debug/select-all-failed-checkbox.md"
