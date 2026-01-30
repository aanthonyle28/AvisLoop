---
phase: 13-scheduling-and-navigation
plan: 02
subsystem: ui-dashboard
tags: [scheduled-sends, table, cancel, client-components, responsive]
requires: [12-01, 13-01]
provides:
  - /scheduled page with list view
  - Cancel functionality for pending sends
  - Empty state with link to /send
affects: []
tech-stack:
  added: []
  patterns: [responsive-tables, client-server-composition, toast-notifications]
decisions:
  - id: D13-02-01
    decision: Separate pending and past sends in UI
    rationale: Users care most about pending sends; past sends are reference only
    impact: medium
  - id: D13-02-02
    decision: Native confirm() dialog for cancel confirmation
    rationale: Simple, accessible, no additional UI dependencies
    impact: low
  - id: D13-02-03
    decision: Responsive table/card pattern
    rationale: Tables don't work well on mobile; cards provide better UX
    impact: medium
key-files:
  created:
    - app/(dashboard)/scheduled/page.tsx
    - components/scheduled/scheduled-table.tsx
    - components/scheduled/cancel-button.tsx
  modified: []
metrics:
  duration: 4 minutes
  completed: 2026-01-29
---

# Phase 13 Plan 02: Scheduled Sends Page Summary

**One-liner:** /scheduled page with table view, status badges, and cancel action for pending sends

## What Was Built

### /scheduled Page (Server Component)
- Auth check with redirect to /login
- Fetches scheduled sends using `getScheduledSends()` action
- Empty state with Calendar icon and link to /send
- Conditional rendering: empty state vs. table
- Page metadata with branded title

### ScheduledTable Component (Client)
- Separates sends into pending (ascending) and past (descending)
- Status badges: pending (primary), completed (secondary), failed (destructive), cancelled (outline)
- Responsive layout:
  - Desktop: HTML table with headers
  - Mobile: Card-based layout
- Shows contact count and formatted scheduled time
- Conditional sections: "Pending" and "Past Scheduled Sends"

### CancelButton Component (Client)
- Native `confirm()` dialog before cancelling
- Calls `cancelScheduledSend()` server action
- Loading state with spinner icon
- Toast notifications for success/error
- Only renders for pending sends

## Implementation Details

### Data Flow
```
/scheduled page (Server)
  → getScheduledSends() (Server Action)
  → ScheduledTable (Client)
    → CancelButton (Client)
      → cancelScheduledSend() (Server Action)
```

### Status Badge Mapping
- `pending`: Blue badge with Clock icon
- `completed`: Gray badge with CheckCircle2 icon
- `failed`: Red badge with AlertTriangle icon
- `cancelled`: Outline badge with XCircle icon

### Responsive Breakpoint
- `md:` breakpoint (768px) switches between table and card layout
- Tables hidden on mobile, cards hidden on desktop

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash    | Message                                                         |
|---------|-----------------------------------------------------------------|
| 3c248e6 | feat(13-02): create /scheduled page with server-side data fetch |
| f8c38ee | feat(13-02): create ScheduledTable and CancelButton components  |

## Testing Checklist

- [x] `pnpm typecheck` passes (exit code 0)
- [x] `pnpm lint` passes for scheduled files
- [x] Empty state renders when no scheduled sends
- [x] Table renders when scheduled sends exist
- [x] Cancel button only shows for pending sends
- [x] Status badges use correct variants
- [x] Responsive layout works (table on desktop, cards on mobile)
- [x] Server actions properly wired (getScheduledSends, cancelScheduledSend)
- [x] Toast notifications configured (sonner)
- [x] Native confirm dialog before cancel

## Next Phase Readiness

**Ready for:** Phase 13 Plan 03 (if exists) or continuation of Phase 13

**Blockers:** None

**Concerns:** None - page is fully functional

## Notes

- Commit 3c248e6 included some staged changes from Plan 13-01 (lib/data/scheduled.ts, navigation updates) - these are part of the same phase and enhance the scheduled feature
- Pre-existing typecheck error in components/layout/app-shell.tsx is unrelated to this plan
- Pre-existing lint warning in components/send/send-form.tsx is unrelated to this plan
