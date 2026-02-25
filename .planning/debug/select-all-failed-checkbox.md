---
status: diagnosed
trigger: "Activity page header 'Select all failed' checkbox only selects 1 of 3 failed rows instead of all. Label not visible."
created: 2026-02-24T00:00:00Z
updated: 2026-02-24T00:01:00Z
---

## Current Focus

hypothesis: CONFIRMED - Stale closure bug in onRowSelectionChange wrapper
test: Traced synchronous forEach loop through controlled state wrapper
expecting: Each toggleSelected call uses stale rowSelection prop, only last call wins
next_action: Return diagnosis

## Symptoms

expected: Clicking header checkbox selects ALL 3 failed/bounced rows
actual: Only selects 1 of 3 failed rows
errors: None reported
reproduction: Go to /history, click "Select all failed" header checkbox
started: Unknown

## Eliminated

- hypothesis: getFilteredRowModel not configured causes wrong row set
  evidence: TanStack falls back to getCoreRowModel when getFilteredRowModel option not provided (ColumnFiltering.ts line 403-413), which returns all rows - correct behavior
  timestamp: 2026-02-24T00:00:30Z

- hypothesis: RESENDABLE_STATUSES filter in onCheckedChange is wrong
  evidence: Lines 35-39 of history-columns.tsx correctly filter by ['failed', 'bounced'] and call toggleSelected on matching rows
  timestamp: 2026-02-24T00:00:35Z

- hypothesis: enableRowSelection blocks selection
  evidence: enableRowSelection on line 46 of history-table.tsx uses same RESENDABLE_STATUSES check - consistent with header logic
  timestamp: 2026-02-24T00:00:40Z

## Evidence

- timestamp: 2026-02-24T00:00:20Z
  checked: history-columns.tsx lines 34-39 (onCheckedChange handler)
  found: forEach loop calls row.toggleSelected(!!value) for each resendable row synchronously
  implication: Each call fires onRowSelectionChange independently within the same synchronous loop

- timestamp: 2026-02-24T00:00:25Z
  checked: history-table.tsx lines 47-51 (onRowSelectionChange wrapper)
  found: Wrapper calls updater(rowSelection || {}) where rowSelection is the PROP from current render, not accumulated state
  implication: Each iteration of the forEach uses the SAME stale rowSelection value as the base for the updater

- timestamp: 2026-02-24T00:00:30Z
  checked: React batching behavior with synchronous setState calls
  found: React batches all setState calls from the synchronous forEach. Each call to onRowSelectionChange(newSelection) calls setRowSelection in the parent. The updater always starts from the same stale {} base, so each call produces {rowId: true} with only ONE row. Last call wins.
  implication: Only the LAST row in the forEach loop ends up selected

- timestamp: 2026-02-24T00:00:45Z
  checked: history-columns.tsx line 41
  found: aria-label="Select all failed" is the only label - no visible text accompanies the checkbox
  implication: Label is accessible to screen readers but not visible to sighted users

## Resolution

root_cause: |
  TWO ISSUES:

  ISSUE 1 (Primary - Selection Bug):
  Stale closure in controlled row selection wrapper at history-table.tsx line 49.

  The onCheckedChange handler in history-columns.tsx (lines 34-39) calls
  row.toggleSelected(!!value) in a synchronous forEach loop for each resendable row.
  Each call triggers the onRowSelectionChange wrapper in history-table.tsx (lines 47-51),
  which evaluates: updater(rowSelection || {}).

  The problem: rowSelection is the PROP value from the current render. It does NOT
  update between iterations of the synchronous forEach loop. So every iteration
  starts from the same base state (e.g., {}), and each updater produces a result
  with only ONE row selected. React batches these setState calls, and the LAST
  one wins -- resulting in only 1 of 3 rows being selected.

  ISSUE 2 (Secondary - Label Visibility):
  The checkbox at history-columns.tsx line 41 uses aria-label="Select all failed"
  which is only for screen readers. There is no visible text label next to the checkbox.

fix:
verification:
files_changed: []
