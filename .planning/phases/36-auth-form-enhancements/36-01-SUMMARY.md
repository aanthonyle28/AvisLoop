---
phase: 36-auth-form-enhancements
plan: 01
subsystem: auth
tags: [react, password-input, accessibility, aria, forms, phosphor-icons]

# Dependency graph
requires: []
provides:
  - PasswordInput component with Eye/EyeSlash visibility toggle (tabIndex=-1, type=button)
  - aria-invalid:border-destructive + aria-invalid:ring-destructive/20 on base Input component
  - login-form, sign-up-form, update-password-form all use PasswordInput with noValidate + aria-invalid wiring
affects:
  - 36-02 (subsequent auth form enhancements)
  - 36-03 (subsequent auth form enhancements)
  - any future form using Input that needs error state styling

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PasswordInput wraps Input with relative div + absolute toggle button (tabIndex=-1 keeps focus flow clean)
    - aria-invalid prop on Input triggers red border/ring via Tailwind arbitrary variant
    - Error <p> elements get id + role=alert for aria-describedby linkage
    - noValidate on <form> suppresses native browser validation popups

key-files:
  created:
    - components/ui/password-input.tsx
  modified:
    - components/ui/input.tsx
    - components/login-form.tsx
    - components/sign-up-form.tsx
    - components/update-password-form.tsx

key-decisions:
  - "tabIndex={-1} on eye toggle button so Tab from password field skips to next form element"
  - "type=button on eye toggle prevents accidental form submission"
  - "PasswordInputProps omits 'type' so callers cannot override — always password/text"
  - "aria-invalid:ring-destructive/20 matches existing focus-visible ring pattern at lower opacity"
  - "Input import kept in login-form and sign-up-form (still needed for email/name fields); removed from update-password-form"

patterns-established:
  - "Eye toggle button: absolute right-3 top-1/2 -translate-y-1/2 inside relative wrapper"
  - "Error message pattern: id={field}-error role=alert, linked via aria-describedby on input"
  - "noValidate on all auth forms to suppress browser validation popups in favor of server errors"

# Metrics
duration: 2min
completed: 2026-02-20
---

# Phase 36 Plan 01: Auth Form Enhancements Summary

**PasswordInput component with Eye/EyeSlash toggle and accessible aria-invalid error styling wired across all three auth forms**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-20T00:58:11Z
- **Completed:** 2026-02-20T00:59:51Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created `components/ui/password-input.tsx`: forwardRef wrapper with Eye/EyeSlash Phosphor icons, tabIndex=-1 toggle button (Tab skips to next field), and `type="button"` to prevent form submission
- Updated `components/ui/input.tsx` with `aria-invalid:border-destructive aria-invalid:ring-destructive/20` — any Input receiving `aria-invalid={true}` now shows a red border and ring
- Replaced all `<Input type="password">` in login, signup, and update-password forms with `<PasswordInput>`; added `noValidate` to all three `<form>` elements; wired `aria-invalid` + `aria-describedby` on every error-capable input

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PasswordInput component and add aria-invalid to Input** - `0c49fc3` (feat)
2. **Task 2: Replace Input with PasswordInput in all three auth forms + add noValidate and aria-invalid wiring** - `328412d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `components/ui/password-input.tsx` - New reusable PasswordInput with show/hide eye toggle, 42 lines
- `components/ui/input.tsx` - Added aria-invalid red border/ring Tailwind variants
- `components/login-form.tsx` - PasswordInput for password field, noValidate, aria-invalid on email + password
- `components/sign-up-form.tsx` - PasswordInput for password field, noValidate, aria-invalid on email + password
- `components/update-password-form.tsx` - PasswordInput for both fields, noValidate, aria-invalid on both; Input import removed

## Decisions Made
- `tabIndex={-1}` on the eye toggle button so pressing Tab from the password field moves to the next real form element, not the eye icon
- `type="button"` on the toggle button prevents accidental form submission when pressing Enter
- `PasswordInputProps` uses `Omit<React.ComponentProps<'input'>, 'type'>` so the caller can never pass `type` — the component always controls it
- `Input` import retained in `login-form.tsx` and `sign-up-form.tsx` (still used for email/name fields); removed only from `update-password-form.tsx` where no non-password fields remain

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PasswordInput is ready for use in any future auth form
- aria-invalid error styling on Input is available to all forms in the codebase
- Plans 36-02 and 36-03 can proceed — no blockers

---
*Phase: 36-auth-form-enhancements*
*Completed: 2026-02-20*
