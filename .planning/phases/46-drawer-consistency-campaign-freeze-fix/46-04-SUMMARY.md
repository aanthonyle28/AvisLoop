---
phase: 46
plan: 46-04
title: "Apply drawer consistency to Add Job, Edit Job, Add Customer, and Edit Customer sheets"
subsystem: ui
tags: [drawer, sheet, consistency, SheetBody, SheetFooter]
dependency-graph:
  requires: [46-03]
  provides: ["Consistent drawer layout for all 4 form-based sheets"]
  affects: [46-05]
tech-stack:
  added: []
  patterns: ["SheetBody/SheetFooter layout for form drawers", "form wrapping body+footer for submit", "form id attribute for external button association"]
key-files:
  created: []
  modified:
    - components/jobs/add-job-sheet.tsx
    - components/jobs/edit-job-sheet.tsx
    - components/customers/add-customer-sheet.tsx
    - components/customers/edit-customer-sheet.tsx
decisions:
  - id: D-46-04-01
    title: "Form wrapping pattern for SheetBody+SheetFooter"
    choice: "form element wraps both SheetBody and SheetFooter with flex layout"
    why: "Submit buttons in SheetFooter must be inside the form element for native form submission to work"
  - id: D-46-04-02
    title: "Edit Customer uses form id attribute instead of wrapping"
    choice: "form id='edit-customer-form' + button form='edit-customer-form'"
    why: "Edit Customer has non-form content (SMS consent, activity) between form and footer, so form cannot wrap both body and footer without including non-form content"
metrics:
  duration: "~5 minutes"
  completed: 2026-02-26
---

# Phase 46 Plan 04: Apply Drawer Consistency to Form Sheets Summary

Applied SheetBody/SheetFooter pattern to Add Job, Edit Job, Add Customer, and Edit Customer sheets with normalized widths and sticky footers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Apply drawer consistency to Add Job sheet | 6451a3d | components/jobs/add-job-sheet.tsx |
| 2 | Apply drawer consistency to Edit Job sheet | 6ae9871 | components/jobs/edit-job-sheet.tsx |
| 3 | Apply drawer consistency to Add Customer sheet | c937bfa | components/customers/add-customer-sheet.tsx |
| 4 | Apply drawer consistency to Edit Customer sheet | 78b97e0 | components/customers/edit-customer-sheet.tsx |

## Changes Made

### Width Normalization
All four sheets now use `sm:max-w-lg` (512px) instead of their previous widths:
- Add Job: was default `sm:max-w-sm` with `overflow-y-auto`
- Edit Job: was default `sm:max-w-sm` with `overflow-y-auto`
- Add Customer: was `w-[400px] sm:w-[540px] overflow-y-auto`
- Edit Customer: was `w-[400px] sm:w-[540px] overflow-y-auto`

### Structure Pattern
Each sheet now follows the consistent drawer structure:
```
SheetContent (sm:max-w-lg)
  SheetHeader (shrink-0)
  form (flex flex-col flex-1 min-h-0) -- or SheetBody directly
    SheetBody (flex-1 overflow-y-auto)
    SheetFooter (shrink-0 border-t)
```

### Form Submit Patterns
- **Add Job, Edit Job, Add Customer**: `<form>` wraps both `<SheetBody>` and `<SheetFooter>` so submit buttons are native form children
- **Edit Customer**: Uses `form='edit-customer-form'` attribute on the button in `<SheetFooter>` to associate with the `<form id='edit-customer-form'>` in `<SheetBody>` (because non-form content exists between form fields and footer)

### Dead Code Removed
- Removed `Separator` import from edit-customer-sheet.tsx (both `<Separator />` elements removed)
- Removed `overflow-y-auto` from all four SheetContent elements
- Removed old button wrapper divs with `pt-4` spacing

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- All four drawers use `sm:max-w-lg` width: VERIFIED
- None contain `overflow-y-auto` on SheetContent: VERIFIED
- All four import and use SheetBody and SheetFooter: VERIFIED
- Edit Customer has no Separator imports or usage: VERIFIED
- Form submit buttons are reachable (inside form or via form attribute): VERIFIED
