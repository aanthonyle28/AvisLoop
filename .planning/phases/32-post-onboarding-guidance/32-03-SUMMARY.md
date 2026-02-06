---
phase: 32
plan: 03
subsystem: onboarding-guidance
tags: [tooltip, checklist, dashboard, first-visit, v2-alignment]
depends_on:
  requires: ["32-02"]
  provides: ["checklist-integration", "first-visit-hints", "tooltip-component"]
  affects: ["32-04"]
tech-stack:
  added: ["@radix-ui/react-tooltip"]
  patterns: ["first-visit-hint", "tooltip-wrapper", "localStorage-tracking"]
key-files:
  created:
    - components/ui/tooltip.tsx
    - lib/hooks/use-first-visit-hint.ts
    - components/onboarding/first-visit-hint.tsx
    - lib/constants/checklist.ts
  modified:
    - package.json
    - pnpm-lock.yaml
    - app/(dashboard)/dashboard/page.tsx
    - components/jobs/jobs-client.tsx
    - components/campaigns/campaign-list.tsx
    - components/onboarding/getting-started-checklist.tsx
    - lib/data/checklist.ts
decisions:
  - id: HINT-STORAGE
    choice: "localStorage for hints, database for checklist"
    reason: "Hints are less critical, per-device acceptable"
  - id: CHECKLIST-CONSTANTS-SPLIT
    choice: "Split constants to lib/constants/checklist.ts"
    reason: "Client components cannot import from server-only data files"
metrics:
  duration: "~20 minutes"
  completed: "2026-02-06"
---

# Phase 32 Plan 03: Checklist & Hint Integration Summary

Integrated the Getting Started Checklist into the dashboard and added contextual tooltip hints to guide new users through the V2 workflow.

## One-liner

Dashboard checklist + first-visit tooltips on Jobs/Campaigns pages using Radix Tooltip and localStorage tracking

## What Was Built

### 1. Tooltip Component (Task 1)
- Installed `@radix-ui/react-tooltip` package
- Created `components/ui/tooltip.tsx` with shadcn/ui pattern
- Exports: `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`

### 2. First-Visit Hint Hook (Task 2)
- Created `lib/hooks/use-first-visit-hint.ts`
- Tracks hint visibility in localStorage
- Returns `{ showHint, dismissHint, resetHint }`

### 3. FirstVisitHint Component (Task 3)
- Created `components/onboarding/first-visit-hint.tsx`
- Wraps any element with a dismissible tooltip
- Shows on first visit only (localStorage tracking)
- Dismiss via X button or "Got it" button
- Configurable side, delay, title, description

### 4. Dashboard Checklist Integration (Task 4)
- Added `getChecklistState` to dashboard parallel fetch
- Renders `GettingStartedChecklist` conditionally (if not dismissed)
- Fixed client/server boundary by splitting checklist constants
- New file: `lib/constants/checklist.ts` for client-safe imports

### 5. Jobs Page Hint (Task 5)
- Wrapped Add Job button with FirstVisitHint
- V2-aligned messaging: "Log completed jobs to start collecting reviews automatically"

### 6. Campaigns Page Hint (Task 6)
- Wrapped first campaign card with FirstVisitHint
- V2-aligned messaging: "Campaigns run automatically when jobs are completed"

## Technical Details

### Client/Server Split
The checklist component needed to import `CHECKLIST_ITEMS` constant, but `lib/data/checklist.ts` also exports server-only functions. Solution:
- Created `lib/constants/checklist.ts` with just the constant + type
- Updated `lib/data/checklist.ts` to re-export from constants
- Client component imports from constants file

### Hint Storage Strategy
| Data | Storage | Reason |
|------|---------|--------|
| Checklist state | Database | Cross-device sync, critical for UX |
| First-visit hints | localStorage | Less critical, per-device acceptable |

### Hint Configuration
```tsx
<FirstVisitHint
  hintId="jobs-add-button"        // localStorage key
  title="Add your first job here"
  description="Log completed jobs..."
  side="bottom"                    // tooltip position
  showDelay={500}                  // ms before showing
>
  <Button>Add Job</Button>
</FirstVisitHint>
```

## Commits

| Hash | Description |
|------|-------------|
| 2ff798e | Add Radix Tooltip component |
| 19fdaa5 | Add useFirstVisitHint hook |
| 3253c3c | Add FirstVisitHint component |
| ae04df2 | Integrate checklist into dashboard |
| a52d2b8 | Add hint to Jobs page |
| 6886bff | Add hint to Campaigns page |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Split checklist constants for client import**
- **Found during:** Task 4
- **Issue:** Build failed - client component importing from server-only file
- **Fix:** Created `lib/constants/checklist.ts` with just constants
- **Files created:** `lib/constants/checklist.ts`
- **Files modified:** `lib/data/checklist.ts`, `components/onboarding/getting-started-checklist.tsx`
- **Commit:** ae04df2

## Verification Results

| Check | Status |
|-------|--------|
| pnpm typecheck | Pass |
| pnpm lint | Pass |
| pnpm build | Pass |
| @radix-ui/react-tooltip installed | Yes |
| Dashboard shows checklist | Yes (if not dismissed) |
| Jobs page has hint | Yes |
| Campaigns page has hint | Yes |

## Next Phase Readiness

**Ready for 32-04:** Empty state updates

All hints and checklist are in place. The next plan should update empty states to include V2-aligned messaging and guidance links.
