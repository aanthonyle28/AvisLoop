---
phase: 46-drawer-consistency-campaign-freeze-fix
plan: 46-05
subsystem: ui/drawers
tags: [drawer, SheetBody, SheetFooter, consistency, separator-removal]
depends_on: [46-03]
provides: [consistent-detail-drawers, sticky-footer-actions]
affects: []
tech-stack:
  added: []
  patterns: [SheetBody-SheetFooter-layout, space-y-6-section-gaps]
key-files:
  created: []
  modified:
    - components/jobs/job-detail-drawer.tsx
    - components/customers/customer-detail-drawer.tsx
decisions:
  - id: DRW-05-01
    summary: "Job Detail Complete button normalized to default variant (primary CTA)"
    rationale: "Complete is THE primary action for scheduled jobs -- should be visually prominent, not outline with color overrides"
metrics:
  duration: ~5m
  completed: 2026-02-25
---

# Phase 46 Plan 05: Apply drawer consistency to Job Detail and Customer Detail drawers

Consistent SheetBody/SheetFooter layout applied to both detail drawers with Separator removal and button variant normalization.

## What Was Done

### Task 1: Job Detail Drawer (`components/jobs/job-detail-drawer.tsx`)

- Added `SheetBody` and `SheetFooter` imports; removed `Separator` import
- Removed `overflow-y-auto` from `SheetContent`
- Wrapped scrollable content in `<SheetBody>` with inner `<div className="space-y-6">`
- Moved Complete, Edit, Delete action buttons into `<SheetFooter>`
- Removed all 4 `<Separator />` components (replaced by `space-y-6` gaps)
- Normalized "Complete" button: removed `variant="outline"` and custom color overrides (`text-success-foreground border-success/40 hover:bg-success-bg`), now uses default variant (primary CTA)
- Conflict resolution buttons (Replace/Skip/Queue) remain in the body -- they are contextual to the Campaign section, not global actions

### Task 2: Customer Detail Drawer (`components/customers/customer-detail-drawer.tsx`)

- Added `SheetBody` and `SheetFooter` imports; removed `Separator` import
- Removed `overflow-y-auto` from `SheetContent`
- Wrapped scrollable content in `<SheetBody>` with inner `<div className="space-y-6">`
- Moved Send Message, Edit Customer, Archive, View History buttons into `<SheetFooter>`
- Removed all 4 `<Separator />` components (replaced by `space-y-6` gaps)
- Button variants unchanged -- this IS the reference pattern (Send=default, Edit=outline, Archive=outline, History=ghost)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

| Check | Result |
|-------|--------|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| No Separator import in job-detail-drawer.tsx | PASS |
| No Separator import in customer-detail-drawer.tsx | PASS |
| No `<Separator` JSX in either file | PASS |
| SheetBody + SheetFooter imported in both | PASS |
| No `overflow-y-auto` on SheetContent in either | PASS |
| Job Detail "Complete" uses default variant | PASS |
| Customer Detail button variants unchanged | PASS |
| Conflict resolution buttons in body, not footer | PASS |

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | `45bd7a9` | feat(46-05): apply drawer consistency to Job Detail drawer |
| 2 | `dc927f5` | feat(46-05): apply drawer consistency to Customer Detail drawer |

## Next Phase Readiness

All 5 detail/form drawers now use the consistent SheetBody/SheetFooter pattern:
- Add Job Sheet (46-04)
- Edit Job Sheet (46-04)
- Add Customer Sheet (46-04)
- Edit Customer Sheet (46-04)
- Job Detail Drawer (46-05)
- Customer Detail Drawer (46-05)
- Request Detail Drawer already had no Separators (reference pattern)

The drawer consistency campaign (46-03 through 46-05) is complete.
