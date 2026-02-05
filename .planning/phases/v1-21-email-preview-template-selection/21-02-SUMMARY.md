---
phase: 21-email-preview-template-selection
plan: 02
subsystem: ui
tags: [react, next-navigation, template-selection, routing]

# Dependency graph
requires:
  - phase: 19-ux-ui-redesign
    provides: Send page shell with SendSettingsBar component
provides:
  - Template dropdown with "Create Template" navigation option
  - In-flow template creation shortcut from send page
affects: [22-detail-drawers, 23-onboarding-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [navigation-from-dropdown, create-shortcut-in-selector]

key-files:
  created: []
  modified: [components/send/send-settings-bar.tsx]

key-decisions:
  - "Use 'create-new' as non-UUID value to safely detect navigation trigger"
  - "Navigate with fragment hash (#templates) to focus relevant settings section"

patterns-established:
  - "Dropdown navigation pattern: check for special value, router.push, early return"
  - "Visual separator in select: disabled option with em-dash line"

# Metrics
duration: 2min
completed: 2026-02-01
---

# Phase 21 Plan 02: Template Selection Enhancement Summary

**Template dropdown now includes "+ Create Template" option that routes to settings page with fragment targeting**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-01T23:25:12Z
- **Completed:** 2026-02-01T23:26:24Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added "Create Template" navigation option to template dropdown on send page
- Users can now create templates without leaving the send page mental context
- Visual separator distinguishes navigation option from template list
- Normal template selection behavior preserved (localStorage + callback)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add "Create Template" option to template dropdown** - `9c118f2` (feat)

**Plan metadata:** (pending - to be committed after SUMMARY.md creation)

## Files Created/Modified
- `components/send/send-settings-bar.tsx` - Added useRouter hook, enhanced handleTemplateChange to detect create-new selection and navigate to settings page, added visual separator and "+ Create Template" option to select element

## Decisions Made

**1. Use 'create-new' as special dropdown value**
- Rationale: Non-UUID string ensures no collision with real template IDs
- Impact: Safe detection of navigation trigger without complex state management

**2. Navigate with fragment hash (#templates)**
- Rationale: Direct users to the specific templates section on settings page
- Impact: Better UX - users land exactly where they need to be

**3. Early return after navigation**
- Rationale: Prevents localStorage write and callback invocation for navigation action
- Impact: Clean separation of concerns - navigation vs. template selection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation was straightforward with existing Next.js router patterns.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Template selection enhancement complete
- Ready for Phase 21-01 (compact preview snippet + full email preview modal)
- Ready for Phase 22 (detail drawers with template selector for resend actions)
- Establishes pattern for in-flow navigation shortcuts (can be applied to other dropdowns)

---
*Phase: 21-email-preview-template-selection*
*Completed: 2026-02-01*
