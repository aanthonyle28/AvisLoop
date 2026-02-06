---
phase: 30-v2-alignment
plan: 04
status: complete
completed_at: 2026-02-06
commit: e1427e1

artifacts_created:
  - components/jobs/mark-complete-button.tsx

artifacts_modified:
  - components/jobs/job-columns.tsx

tech_added:
  - MarkCompleteButton component
  - Three-state status workflow in table
  - formatDistanceToNow for relative timestamps

key_decisions:
  - Button uses 'xs' size for inline table display
  - Scheduled jobs show amber badge + complete button
  - Completed jobs show green badge + relative timestamp
  - Do Not Send shows muted badge (no action)
---

## Summary

Created the Mark Complete button component and updated the Jobs table to display the three-state workflow (scheduled/completed/do_not_send). This is THE trigger for V2 campaign automation.

## What Was Built

### components/jobs/mark-complete-button.tsx

**Features:**
- One-tap completion with useTransition for loading state
- Phosphor icons (CheckCircle, CircleNotch)
- Supports default, sm, and xs sizes
- Shows "Completing..." text during action
- Toast feedback on success/error
- Calls markJobComplete(jobId, true) to enroll in campaign

### components/jobs/job-columns.tsx

**Three-state status column:**
1. **Scheduled:** Amber badge + Mark Complete button inline
2. **Completed:** Green badge + relative timestamp ("2 hours ago")
3. **Do Not Send:** Muted gray badge

**Other changes:**
- Removed separate "Completed" date column (now inline with status)
- Added formatDistanceToNow from date-fns
- Imported MarkCompleteButton component

## V2 Workflow Visualization

```
Jobs Table Status Column:

┌──────────────────────────────────────────┐
│ Scheduled  [ Mark Complete ]             │ ← One tap triggers automation
├──────────────────────────────────────────┤
│ Completed                                │
│ 2 hours ago                              │ ← Relative timestamp
├──────────────────────────────────────────┤
│ Do Not Send                              │ ← Muted, no action
└──────────────────────────────────────────┘
```

## Key Patterns

```typescript
// MarkCompleteButton uses useTransition for non-blocking update
const [isPending, startTransition] = useTransition()

const handleClick = () => {
  startTransition(async () => {
    const result = await markJobComplete(jobId, true)
    // Toast feedback
  })
}

// Status column with inline button for scheduled jobs
if (status === 'scheduled') {
  return (
    <div className="flex items-center gap-2">
      <Badge>Scheduled</Badge>
      <MarkCompleteButton jobId={row.original.id} size="xs" />
    </div>
  )
}
```

## Dependencies

- Uses: Plan 30-02 (markJobComplete action, scheduled status)
- Affects: Dashboard queues, campaign enrollment flow

## Verification

- [x] TypeScript compiles without errors
- [x] MarkCompleteButton component created
- [x] Scheduled jobs show Mark Complete button
- [x] Completed jobs show relative timestamp
- [x] Button calls markJobComplete with enrollment
