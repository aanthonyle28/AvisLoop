---
phase: 16-onboarding-redesign
plan: 05
subsystem: ui
tags: [next.js, typescript, forms, query-params, phosphor-icons]

# Dependency graph
requires:
  - phase: 16-04
    provides: Onboarding cards with test send link, backend is_test handling
provides:
  - Complete test send pipeline from card click to database flag
  - Test sends properly excluded from quota counting
  - Type-safe Phosphor icon usage
affects: [testing, onboarding, quota-enforcement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Query param wiring through Next.js App Router searchParams Promise"
    - "Conditional hidden form inputs for feature flags"

key-files:
  created: []
  modified:
    - app/(dashboard)/send/page.tsx
    - components/send/send-form.tsx
    - components/dashboard/onboarding-cards.tsx

key-decisions:
  - "Test mode indicator banner for user feedback"
  - "Hidden input for isTest flag instead of URL state"

patterns-established:
  - "Next.js 15 searchParams as Promise pattern for App Router pages"
  - "Type-safe Phosphor icon props with IconWeight type"

# Metrics
duration: 4min
completed: 2026-01-30
---

# Phase 16 Plan 05: Test Send Wiring Summary

**Test send pipeline complete: onboarding card → query param → form → database flag → quota exclusion**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-30T08:32:03Z
- **Completed:** 2026-01-30T08:36:14Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Wired test=true query parameter end-to-end through send flow
- Fixed TypeScript compilation errors on Phosphor icon types
- Added visual test mode indicator for user clarity
- Completed Phase 16 verification (Truth 6: test sends flagged and excluded from quota)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire test query param through send page to send form** - `a925984` (feat)
2. **Task 2: Fix Phosphor icon type in onboarding cards** - `81cf9ae` (fix)

**Plan metadata:** (pending - to be committed with STATE.md update)

## Files Created/Modified
- `app/(dashboard)/send/page.tsx` - Reads searchParams.test Promise, passes isTest prop to SendForm
- `components/send/send-form.tsx` - Accepts isTest prop, renders hidden input and visual indicator
- `components/dashboard/onboarding-cards.tsx` - Fixed icon type from string to IconWeight

## Technical Details

### Test Send Pipeline Flow

1. **Onboarding Card 3:** Links to `/send?test=true`
2. **Send Page:** Reads `searchParams.test` (Next.js 15 Promise pattern), converts to boolean `isTest`
3. **SendForm Component:** Receives `isTest` prop, displays blue banner indicator
4. **Form Submission:** Hidden input `<input name="isTest" value="true">` passes to action
5. **Backend Action:** Already handles `formData.get('isTest')` (no changes needed)
6. **Database:** `send_logs.is_test = true` flag set
7. **Quota Enforcement:** Filtered out via `WHERE is_test = false` (partial index)

### TypeScript Fixes

**Problem:** Phosphor icon components expect `IconWeight` type for `weight` prop, not bare `string`

**Solution:** Import and use `IconWeight` type from `@phosphor-icons/react`

```typescript
import type { IconWeight } from '@phosphor-icons/react'

type CardConfig = {
  icon: React.ComponentType<{ className?: string; weight?: IconWeight }>
  // ... other fields
}
```

## Decisions Made

**D16-05-01:** Display test mode indicator banner
- **Decision:** Show blue banner at top of send form when isTest=true
- **Rationale:** Users need clear visual feedback that they're in test mode
- **Alternative:** Silent test mode (rejected - confusing for new users)
- **Impact:** Low - optional visual enhancement

**D16-05-02:** Use hidden input instead of URL state
- **Decision:** Pass isTest via hidden form input, not preserve in URL
- **Rationale:** FormData is the standard mechanism for server actions; URL state would complicate routing
- **Alternative:** Persist test=true in all form redirects (rejected - unnecessary complexity)
- **Impact:** Low - implementation detail

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward implementation. Next.js 15 searchParams Promise pattern worked as documented.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Phase 16 Complete:** All 5 plans executed (4 planned + 1 gap closure)

### Verification Status (16-VERIFICATION.md)

All 6 truths verified:
1. ✅ Google OAuth works
2. ✅ 2-step wizard works
3. ✅ Auth pages have split layout
4. ✅ Dashboard shows onboarding cards
5. ✅ Cards auto-detect completion
6. ✅ **Test sends flagged and excluded from quota** ← This plan

### Ready For

- Phase 17 (if planned)
- Production deployment
- User acceptance testing
- End-to-end testing of complete onboarding flow

### No Blockers

All infrastructure in place:
- Test send flagging works end-to-end
- Quota enforcement excludes test sends
- User experience is clear (test mode banner)
- TypeScript compilation clean
- Lint passing

---
*Phase: 16-onboarding-redesign*
*Completed: 2026-01-30*
