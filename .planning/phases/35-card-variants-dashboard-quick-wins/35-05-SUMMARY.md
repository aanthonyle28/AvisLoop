---
phase: 35-card-variants-dashboard-quick-wins
plan: 05
subsystem: ui
tags: [tailwind, design-system, semantic-tokens, color-tokens, css-variables, page-layout]

# Dependency graph
requires:
  - phase: 35-02
    provides: 13 semantic CSS custom properties (warning/success/info/error-text tokens + Tailwind color groups)

provides:
  - Categories C/D/F/L/N/P hardcoded colors replaced with semantic tokens across 17 component files
  - All dashboard page containers normalized to consistent container py-6 space-y-6
  - Removes dark: override noise from 60+ locations (tokens handle mode-switching automatically)

affects:
  - Phase 39 (Manual Request elimination) — send page spacing is now normalized, less layout risk
  - Any future UI refactor — consistent page grid established

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Success callouts: bg-success-bg border-success-border text-success-foreground (not bg-green-50 etc.)"
    - "Warning callouts: bg-warning-bg border-warning-border text-warning-foreground/text-warning"
    - "Info callouts: bg-info-bg border-info-border text-info/text-info-foreground"
    - "Error inline: bg-destructive/10 border-destructive/20 text-destructive"
    - "Icon success: text-success (replaces text-green-500/600)"
    - "Icon warning: text-warning (replaces text-yellow-500/amber-600)"
    - "Icon info: text-info (replaces text-blue-600)"
    - "Page container: container py-6 space-y-6 (removes mx-auto px-4 redundancy)"
    - "Constrained page: container max-w-4xl py-6 space-y-6"

key-files:
  created: []
  modified:
    - components/dashboard/kpi-widgets.tsx
    - components/dashboard/attention-alerts.tsx
    - components/dashboard/ready-to-send-queue.tsx
    - components/customers/customer-detail-drawer.tsx
    - components/customers/edit-customer-sheet.tsx
    - components/customers/add-customer-sheet.tsx
    - components/customers/csv-import-dialog.tsx
    - components/customers/csv-preview-table.tsx
    - components/onboarding/setup-progress-pill.tsx
    - components/onboarding/setup-progress-drawer.tsx
    - components/onboarding/steps/send-step.tsx
    - components/onboarding/steps/customer-import-step.tsx
    - components/onboarding/steps/review-destination-step.tsx
    - components/onboarding/steps/sms-consent-step.tsx
    - components/onboarding/steps/software-used-step.tsx
    - components/review/thank-you-card.tsx
    - components/layout/notification-bell.tsx
    - components/jobs/job-columns.tsx
    - components/jobs/csv-job-import-dialog.tsx
    - components/templates/template-list-item.tsx
    - app/(dashboard)/dashboard/page.tsx
    - app/(dashboard)/analytics/page.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/campaigns/page.tsx
    - app/(dashboard)/customers/page.tsx
    - app/(dashboard)/history/page.tsx
    - app/(dashboard)/feedback/page.tsx
    - app/(dashboard)/billing/page.tsx
    - app/(dashboard)/send/page.tsx
    - app/(dashboard)/campaigns/new/page.tsx

key-decisions:
  - "Data-viz dots (campaign-stats, bulk-send-columns) stay inline — decorative chart colors not semantic"
  - "Star icon in kpi-widgets stays text-amber-500 — decorative star visual, not status indicator"
  - "send/bulk-send-confirm-dialog and send/stat-strip green text left for Phase 39 — send page scheduled for elimination"
  - "Settings page container left unchanged — unique sticky header layout incompatible with space-y-6 wrapper"
  - "campaigns/[id] page already had container py-6 space-y-6 — no change needed"

patterns-established:
  - "All dark: override removal pattern: semantic tokens are already mode-aware, dark: overrides add noise"
  - "SMS consent 3-state: text-success / text-destructive / text-warning"
  - "Page padding standard: container py-6 space-y-6 for full-width, container max-w-{N} py-6 space-y-6 for constrained"

# Metrics
duration: 7min
completed: 2026-02-19
---

# Phase 35 Plan 05: Category Batch Replacement + Page Padding Normalization Summary

**~75 hardcoded Tailwind color-scale occurrences replaced with semantic tokens across 20 component files, and all 11 dashboard page containers normalized to `container py-6 space-y-6`**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-19T04:48:21Z
- **Completed:** 2026-02-19T04:55:47Z
- **Tasks:** 2
- **Files modified:** 30 (20 component files + 10 page files)

## Accomplishments

- Category C (status/trend): KPI trend indicators, attention alert severity icons, ready-to-send queue icons all use text-success/text-destructive/text-warning/text-info
- Category D (SMS consent): 3-state consent display in customer-detail-drawer and edit-customer-sheet uses text-success/text-destructive/text-warning
- Category F (success/info callouts): Setup progress, add-customer success, review destination, SMS consent step, software-used info banner all use bg-success-bg/bg-info-bg pattern with border and foreground tokens
- Category L (onboarding completion): send-step 3-state (success/warning/error) fully tokenized; customer-import-step green/red → text-success/bg-destructive/10; thank-you-card → bg-success/10 text-success
- Category N (CSV import results): All three CSV dialogs (customer, job, preview table) use text-success/text-warning/text-destructive/text-info with proper warning callout pattern
- Category P (template channel badge): email badge → bg-info/10 text-info; SMS badge → bg-success/10 text-success; all dark: overrides removed
- App-level files: campaigns/new info tip → bg-info-bg pattern; billing success banner → bg-success-bg pattern
- Page padding: All 11 dashboard pages normalized — removed redundant mx-auto/px-4, unified to `container py-6 space-y-6` (constrained pages add `max-w-{N}`)
- notification-bell: green checkmark → text-success; blue jobs icon → bg-info/10 text-info; amber alerts icon → bg-warning-bg text-warning

## Task Commits

1. **Task 1: Replace Categories C, D, F, L** - `9277d14` (feat)
2. **Task 2: Replace Categories N, P, app-level + normalize page padding** - `608d79f` (feat)

**Plan metadata:** (committed with STATE.md update)

## Files Created/Modified

**Component files (20):**
- `components/dashboard/kpi-widgets.tsx` — trend indicators: text-success/text-destructive
- `components/dashboard/attention-alerts.tsx` — severity icons: semantic tokens; all-clear: text-success
- `components/dashboard/ready-to-send-queue.tsx` — checkmark/warning icons: text-success/text-warning
- `components/customers/customer-detail-drawer.tsx` — SMS consent 3-state
- `components/customers/edit-customer-sheet.tsx` — SMS consent 3-state
- `components/customers/add-customer-sheet.tsx` — success message: bg-success-bg text-success-foreground
- `components/customers/csv-import-dialog.tsx` — import result counts + phone review callout
- `components/customers/csv-preview-table.tsx` — row status icons and duplicate badge
- `components/onboarding/setup-progress-pill.tsx` — complete state: bg-success-bg pattern
- `components/onboarding/setup-progress-drawer.tsx` — checkmark circle + footer banner
- `components/onboarding/steps/send-step.tsx` — success/warning/error states fully tokenized
- `components/onboarding/steps/customer-import-step.tsx` — valid/invalid row indicators
- `components/onboarding/steps/review-destination-step.tsx` — green checkmark success
- `components/onboarding/steps/sms-consent-step.tsx` — blue info checkbox container
- `components/onboarding/steps/software-used-step.tsx` — blue info banner
- `components/review/thank-you-card.tsx` — green circle + checkmark
- `components/layout/notification-bell.tsx` — all-clear green, jobs blue, alerts amber
- `components/jobs/job-columns.tsx` — status badges (scheduled/completed) + campaign column text
- `components/jobs/csv-job-import-dialog.tsx` — import result counts + row status
- `components/templates/template-list-item.tsx` — channel badge (email=info, SMS=success)

**Page files (10):**
- `app/(dashboard)/dashboard/page.tsx` — container py-6 space-y-6
- `app/(dashboard)/analytics/page.tsx` — container py-6 space-y-6
- `app/(dashboard)/jobs/page.tsx` — container py-6 space-y-6
- `app/(dashboard)/campaigns/page.tsx` — container py-6 space-y-6 (was space-y-8)
- `app/(dashboard)/customers/page.tsx` — container py-6 space-y-6
- `app/(dashboard)/history/page.tsx` — container py-6 space-y-6
- `app/(dashboard)/feedback/page.tsx` — container max-w-4xl py-6 space-y-6 (was py-8)
- `app/(dashboard)/billing/page.tsx` — container max-w-4xl py-6 space-y-6 + success banner tokens
- `app/(dashboard)/send/page.tsx` — container py-6 space-y-6 (removed mx-auto px-4)
- `app/(dashboard)/campaigns/new/page.tsx` — container max-w-3xl py-6 space-y-6 + info tip tokens

## Decisions Made

- Data-viz colored dots in campaign-stats and bulk-send-columns stay inline — they are decorative chart elements, not semantic status indicators
- Star icon in kpi-widgets.tsx stays text-amber-500 — decorative visual chrome for the amber card variant, not a status semantic
- send page green text (bulk-send-confirm-dialog, stat-strip) deferred to Phase 39 — send page is targeted for elimination anyway
- Settings page excluded from padding normalization — its sticky header layout uses a different container pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 35 is now complete (plans 01-05 all done)
- The design system is fully token-driven: all 210 occurrences from the Tier 2 audit are resolved across the 5 plans in this phase
- Remaining inline colors are all intentional: data-viz dots, star decorations, marketing gradients
- Phase 36 (settings tabs + template UX) can proceed — page container pattern is now stable

---
*Phase: 35-card-variants-dashboard-quick-wins*
*Completed: 2026-02-19*
