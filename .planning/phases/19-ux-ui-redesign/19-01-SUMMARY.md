---
phase: 19-ux-ui-redesign
plan: 01
subsystem: navigation-layout
tags: [navigation, sidebar, mobile, layout, ui]
requires: []
provides:
  - 3-item navigation (Send, Contacts, Requests)
  - Account dropdown menu
  - Mobile page header component
  - Shared AccountMenu component
affects:
  - 19-02 # Send page redesign depends on new navigation
  - 19-03 # Onboarding checklist redesign
  - 19-04 # Requests page updates
tech-stack:
  added: []
  patterns:
    - Radix UI DropdownMenu for account menu
    - Shared component pattern for AccountMenu
    - Mobile-first responsive header
key-files:
  created:
    - components/layout/account-menu.tsx
    - components/layout/page-header.tsx
  modified:
    - components/layout/sidebar.tsx
    - components/layout/bottom-nav.tsx
    - components/layout/app-shell.tsx
    - app/(dashboard)/layout.tsx
decisions:
  - id: nav-simplification
    choice: "Reduced navigation from 5+4 items to 3 main items + account dropdown"
    rationale: "Aligns with Send-first IA, reduces cognitive load, improves mobile UX"
    date: 2026-02-01
  - id: account-menu-pattern
    choice: "Shared AccountMenu component used by both sidebar and mobile header"
    rationale: "DRY principle, consistent menu behavior across devices, easier maintenance"
    date: 2026-02-01
  - id: logo-link-change
    choice: "Logo now links to /send instead of /dashboard"
    rationale: "Send is the new home page in redesigned IA"
    date: 2026-02-01
metrics:
  duration: "9.2 minutes"
  completed: 2026-02-01
---

# Phase 19 Plan 01: Navigation & Layout Shell Summary

**One-liner:** Simplified navigation to 3 pages (Send, Contacts, Requests) with account dropdown menu and mobile header

## What Was Built

### Navigation Simplification

**Desktop Sidebar:**
- Reduced from 5 main nav items to 3: Send, Contacts, Requests
- Removed Dashboard, Scheduled, and History from main nav
- Replaced secondary nav (Apps, Billing, Help, Account) with account dropdown at bottom
- Account dropdown positioned with `side="top"` (pops up from bottom, Claude-style)
- Logo now links to `/send` instead of `/dashboard`

**Mobile Bottom Nav:**
- Reduced from 5 items to 3: Send, Contacts, Requests
- Grid changed from `grid-cols-5` to `grid-cols-3`
- Removed badge count logic (no longer tracking scheduled count)

**Mobile Page Header:**
- New component: `components/layout/page-header.tsx`
- Renders only on mobile (`md:hidden`)
- Left side: page title or AvisLoop logo
- Right side: account button (UserCircle icon)
- Account menu positioned with `side="bottom"` (drops down from button)

### Shared Components

**AccountMenu Component:**
- `components/layout/account-menu.tsx`
- Reusable menu used by both sidebar and mobile header
- Menu items: Apps/Integrations, Settings, Billing, Help & Support, Logout
- Takes `side` prop for positioning (top for sidebar, bottom for mobile)
- Uses Radix UI DropdownMenu primitives
- Logout item uses form action for proper server-side signOut

### Layout Cleanup

**AppShell:**
- Removed `scheduledCount` prop (no longer needed in nav)
- Added PageHeader component for mobile
- Simplified props interface

**Dashboard Layout:**
- Removed `getPendingScheduledCount()` fetch
- Removed Suspense wrapper for scheduled count
- Simplified to just render `<AppShell>{children}</AppShell>`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Next.js 16 Build Errors**

- **Found during:** Task 2 - Build verification
- **Issue:**
  - `cacheComponents: true` in next.config.ts was incompatible with route segment configs
  - `export const dynamic = 'force-dynamic'` in cron route caused build failure
  - `/scheduled` page had uncached data access errors
- **Fix:**
  - Disabled `cacheComponents` in next.config.ts (experimental feature causing conflicts)
  - Removed `export const dynamic` from cron route (not needed)
  - Added `export const dynamic = 'force-dynamic'` to scheduled page (proper auth-protected page pattern)
- **Files modified:**
  - next.config.ts
  - app/api/cron/process-scheduled-sends/route.ts
  - app/(dashboard)/scheduled/page.tsx
- **Commit:** 906cc8a

**Rationale:** These were pre-existing build errors preventing production builds. Fixed immediately to ensure build passes (Task 2 verification requirement).

## Verification Results

- ✅ `pnpm typecheck` passes with no errors
- ✅ `pnpm lint` passes
- ✅ `pnpm build` completes successfully
- ✅ Desktop sidebar shows 3 nav items + account dropdown
- ✅ Mobile bottom nav shows 3 items in 3-column grid
- ✅ Mobile page header renders with account button

## Task Completion

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rebuild Sidebar and Bottom Nav | d6538f2 | sidebar.tsx, bottom-nav.tsx, app-shell.tsx, layout.tsx |
| Bug Fix | Resolve Next.js 16 Build Errors | 906cc8a | next.config.ts, cron route, scheduled page |
| 2 | Create Mobile Page Header and Update App Shell | cb34c92 | account-menu.tsx, page-header.tsx, app-shell.tsx, sidebar.tsx |

## Technical Details

### Component Architecture

**Before:**
```
Sidebar (5 main nav + 4 secondary nav + signOut button)
BottomNav (5 items with badge count)
AppShell (passes scheduledCount to both)
DashboardLayout (fetches scheduledCount with Suspense)
```

**After:**
```
Sidebar (3 main nav + AccountMenu at bottom)
BottomNav (3 items, no badges)
AccountMenu (shared component with side prop)
PageHeader (mobile only, with AccountMenu)
AppShell (renders PageHeader on mobile, no props)
DashboardLayout (simplified, no data fetching)
```

### Data Flow Changes

**Removed:**
- `scheduledCount` prop threading through layout components
- `getPendingScheduledCount()` fetch in dashboard layout
- Suspense wrapper for scheduled count in layout

**Added:**
- Shared AccountMenu component pattern
- Mobile PageHeader component
- `pageTitle` optional prop on AppShell (for future use)

### Navigation Routes

| Old Label | Old Route | New Label | New Route | Status |
|-----------|-----------|-----------|-----------|--------|
| Dashboard | /dashboard | Send | /send | Renamed + route change |
| Contacts | /contacts | Contacts | /contacts | Kept |
| Send | /send | - | - | Moved to position 1 |
| Scheduled | /scheduled | - | - | Removed from nav (page still exists) |
| History | /history | Requests | /history | Renamed label only |

**Note:** The `/scheduled` page still exists and is accessible via direct URL, just removed from navigation per new IA.

## Next Phase Readiness

### For Plan 19-02 (Send Page Redesign)

- ✅ Navigation foundation in place
- ✅ Send is now the first nav item (home page pattern)
- ✅ Mobile header ready for page-specific titles
- ✅ Layout no longer depends on scheduled count

### For Plan 19-03 (Onboarding Checklist)

- ✅ Mobile header provides space for setup progress pill/chip
- ✅ Account menu can include "Setup checklist" link if needed

### For Plan 19-04 (Requests Page)

- ✅ "Requests" label established in navigation
- ✅ Route remains `/history` (internal route name unchanged)

### Potential Adjustments

1. **Mobile page titles:** AppShell now has optional `pageTitle` prop, but individual pages don't use it yet. May want to add page-specific titles in each page component.

2. **Logo link on collapsed sidebar:** When sidebar is collapsed, logo is hidden but collapse button shows. May want to show logo icon in collapsed state.

3. **Scheduled page access:** Page removed from nav but still accessible. Consider adding link to "More" menu or settings if users need to access it.

## Success Metrics

- Navigation reduced from 9 total items to 3 main items + account menu
- Mobile navigation simplified from 5 items to 3 items
- Account menu centralized in shared component (used in 2 places)
- Layout dependency graph simplified (removed scheduledCount threading)
- Build passes without errors (fixed 3 pre-existing build bugs)

---

*Completed: 2026-02-01*
*Duration: 9.2 minutes*
*Commits: d6538f2, 906cc8a, cb34c92*
