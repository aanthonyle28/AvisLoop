---
phase: 13-scheduling-and-navigation
plan: 01
subsystem: navigation
tags: [navigation, scheduled-sends, dashboard, ui]
requires: [12-01]
provides:
  - "Scheduled navigation with pending count badge"
  - "Dashboard scheduled sends stat card"
affects: [14-01, 14-02]
tech-stack:
  added: []
  patterns: ["Server Component data fetching", "Badge indicators"]
key-files:
  created:
    - "lib/data/scheduled.ts"
  modified:
    - "app/(dashboard)/layout.tsx"
    - "components/layout/app-shell.tsx"
    - "components/layout/sidebar.tsx"
    - "components/layout/bottom-nav.tsx"
    - "app/dashboard/page.tsx"
decisions:
  - id: D13-01-01
    decision: "Pass scheduled count as prop from Server Component layout"
    rationale: "Client components cannot call server functions; count must be fetched server-side and passed down"
    impact: "medium"
  - id: D13-01-02
    decision: "Show badge on both desktop sidebar and mobile bottom nav"
    rationale: "Users need visibility of pending scheduled sends from all navigation contexts"
    impact: "low"
  - id: D13-01-03
    decision: "Add Scheduled stat card to dashboard"
    rationale: "Provides quick visibility of pending sends and reinforces feature discoverability"
    impact: "low"
metrics:
  duration: "6 minutes"
  completed: "2026-01-30"
---

# Phase 13 Plan 01: Navigation Updates Summary

**One-liner:** Added Scheduled navigation with pending count badge to sidebar, mobile nav, and dashboard stat card.

## What Was Built

### Core Deliverables

1. **Server-side data fetching** (`lib/data/scheduled.ts`)
   - Created `getPendingScheduledCount()` function
   - Follows same pattern as other data functions (auth check → business lookup → count query)
   - Returns 0 for unauthenticated or no-business cases
   - Handles errors gracefully with console logging

2. **Layout data wiring** (`app/(dashboard)/layout.tsx`)
   - Made layout async Server Component
   - Fetches scheduled count server-side
   - Passes count as prop to AppShell

3. **Navigation components** (sidebar & bottom nav)
   - Added "Scheduled" nav item with Calendar icon
   - Positioned between Send and History
   - Desktop sidebar: Shows badge with count (99+ cap) when expanded, dot indicator when collapsed
   - Mobile bottom nav: Updated from 4 to 5 columns, shows badge with count (9+ cap for mobile)
   - Badge only displays when count > 0

4. **Dashboard stat card** (`app/dashboard/page.tsx`)
   - Added Scheduled stat card with Calendar icon
   - Fetched in parallel with other dashboard data
   - Displays pending count and links to /scheduled page
   - Follows same card pattern as Sends This Month and Contacts

### Key Decisions Made

**Decision D13-01-01: Server-side count fetching**
- Navigation components are client components ("use client")
- Cannot call server functions directly
- Solution: Fetch count in layout Server Component, pass as prop through AppShell
- This prevents client-side data fetching and maintains proper separation of concerns

**Decision D13-01-02: Badge display patterns**
- Desktop sidebar expanded: Badge component with numeric count
- Desktop sidebar collapsed: Small dot indicator (visual-only, no number)
- Mobile bottom nav: Small badge with count (capped at 9+ for space)
- Consistent with existing navigation patterns

**Decision D13-01-03: Dashboard integration**
- Added 4th stat card to Quick Stats grid
- Fetched in parallel with other dashboard data (no waterfall)
- Provides alternative entry point to /scheduled page
- Reinforces feature discoverability

## Deviations from Plan

### Partial Manual Work (Pre-existing)

**Issue:** Task 1 navigation work was already completed in prior manual commits
- Commit `3c248e6` already created `lib/data/scheduled.ts` and updated navigation components
- Work included same implementation as specified in plan
- My edits matched exactly what was already committed

**Resolution:** Proceeded with Task 2 (dashboard changes) which was not yet complete

### Auto-added Feature (Rule 2 - Missing Critical)

None. Plan executed as written for Task 2.

## Architecture Notes

### Data Flow Pattern

```
Layout (Server Component)
  ├─> getPendingScheduledCount() [server function]
  └─> AppShell [client component, receives count as prop]
       ├─> Sidebar [client component, displays badge]
       └─> BottomNav [client component, displays badge]
```

This pattern maintains proper separation:
- Server Components handle data fetching and auth
- Client Components handle interactivity and UI state
- Props bridge the server/client boundary

### Navigation Structure

Desktop Sidebar (5 main items):
1. Dashboard
2. Contacts
3. Send
4. **Scheduled** ← new
5. History

Mobile Bottom Nav (5 items):
Same order, grid-cols-5

## Testing Notes

**What to test:**

1. **Sidebar badge behavior**
   - Badge shows when pending scheduled sends exist
   - Badge hides when count is 0
   - Collapsed sidebar shows dot indicator instead of count
   - Count caps at 99+ for large numbers

2. **Mobile nav badge**
   - Badge shows on Calendar icon when count > 0
   - Count caps at 9+ for mobile (smaller space)
   - Grid layout accommodates 5 items properly

3. **Dashboard stat card**
   - Displays current pending count
   - Links to /scheduled page
   - Fetched in parallel (no loading delay)

4. **Data freshness**
   - Count updates on page refresh (Server Component re-renders)
   - No stale data from client-side caching

## Files Modified

**Created:**
- `lib/data/scheduled.ts` - Server-side count fetching

**Modified:**
- `app/(dashboard)/layout.tsx` - Fetch count and pass as prop
- `components/layout/app-shell.tsx` - Accept and forward scheduledCount prop
- `components/layout/sidebar.tsx` - Add Scheduled nav item with badge
- `components/layout/bottom-nav.tsx` - Add Scheduled nav item, update to 5 columns
- `app/dashboard/page.tsx` - Add Scheduled stat card

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Dependencies satisfied:**
- Phase 12 (Cron Processing) complete ✓
- scheduled_sends table exists ✓
- getPendingScheduledCount() function available ✓

**Ready for Phase 14:**
- Navigation to /scheduled page complete
- Scheduled sends UI components already exist (from manual work)
- Can proceed with scheduled send management features

## Commits

| Hash    | Message                                                    |
| ------- | ---------------------------------------------------------- |
| 75dd021 | feat(13-01): add pending scheduled sends count to dashboard |

**Note:** Task 1 navigation work was already committed in prior manual session (commit 3c248e6). Only Task 2 (dashboard changes) was committed in this execution.

## Success Criteria Met

- [x] NAV-01: Sidebar and mobile bottom nav include "Scheduled" link with pending count badge
- [x] NAV-02: Dashboard shows count of pending scheduled sends
- [x] All data fetching happens server-side
- [x] Typecheck passes cleanly
- [x] Lint passes (pre-existing warning in send-form.tsx unrelated)
