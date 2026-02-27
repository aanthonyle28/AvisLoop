---
phase: 51-audit-remediation
plan: "02"
subsystem: ui
tags: [typescript, accessibility, validation, security, zod, aria]

# Dependency graph
requires:
  - phase: 50-code-review-audit
    provides: Audit findings F-44-01, F-44-02, F-44-03, F-44-07, F-05, F-18, F-16, F-CC-01
provides:
  - Defense-in-depth update for updateServiceTypeSettings (business.id scope)
  - Max-length validation on softwareUsedSchema
  - Skip button clarity in CRM step
  - aria-pressed on date preset chip buttons
  - SSR Phosphor import documented in feedback-list
  - aria-label on custom service name Input
  - Proper return type for getBusiness() in both data and actions layers
  - Business interface updated with service_types_enabled and service_type_timing
  - customers page space-y-8 spacing normalized
affects: [52-onward, any feature using getBusiness or Business type]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getBusiness() returns BusinessWithTemplates with explicit MessageTemplate[] annotation"
    - "Business interface now includes service_types_enabled and service_type_timing fields"
    - "aria-pressed on toggle-style buttons for accessibility"

key-files:
  created: []
  modified:
    - lib/actions/business.ts
    - lib/data/business.ts
    - lib/types/database.ts
    - lib/validations/onboarding.ts
    - components/onboarding/steps/crm-platform-step.tsx
    - components/history/history-filters.tsx
    - components/feedback/feedback-list.tsx
    - components/settings/service-types-section.tsx
    - app/(dashboard)/customers/page.tsx

key-decisions:
  - "BusinessWithTemplates type uses MessageTemplate[] (not Pick) to avoid cascading type changes in all consumers"
  - "SSR Phosphor import in feedback-list.tsx retained (Server Component) with explanatory comment"
  - "service_types_enabled and service_type_timing added to Business interface (surfaced by getBusiness return type annotation)"

patterns-established:
  - "getBusiness() return type explicitly annotated as BusinessWithTemplates — prevents implicit any in consumers"
  - "Server-side data functions should have explicit return types, not rely on Supabase inference"

# Metrics
duration: 6min
completed: 2026-02-27
---

# Phase 51 Plan 02: Security, Validation, Accessibility, and Type Correctness Summary

**Defense-in-depth for business update, max-length validation on CRM input, aria-pressed on date chips, proper return type for getBusiness(), and Business interface augmented with service type fields**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-27T00:48:27Z
- **Completed:** 2026-02-27T00:54:10Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- F-44-01: `updateServiceTypeSettings` now fetches `business.id` first then scopes the update `.eq('id', business.id)` — matches defense-in-depth pattern used by all other server actions
- F-44-02 + F-44-07: `softwareUsedSchema` gets `.max(100)`, CRM skip button renamed to "Skip without saving"
- F-05: Date preset chip buttons in history filters get `aria-pressed={activePreset === preset.label}` for screen readers
- F-16: Inline type cast `(t: { channel: string })` removed from customers page by adding explicit `BusinessWithTemplates` return type to `getBusiness()`
- F-44-04 type gap surfaced and fixed: `service_types_enabled` and `service_type_timing` added to `Business` interface in `database.ts`

## Task Commits

Each task was committed atomically:

1. **Task 1: Security and Validation Fixes** - `e06a123` (fix)
2. **Task 2: Accessibility Fixes and Type Correctness** - `512caae` (fix)

**Plan metadata:** (to be committed)

## Files Created/Modified

- `lib/actions/business.ts` - updateServiceTypeSettings fetches business.id first; getBusiness() return type annotated
- `lib/data/business.ts` - BusinessWithTemplates type exported; getBusiness() return type annotated
- `lib/types/database.ts` - Business interface updated with service_types_enabled and service_type_timing fields
- `lib/validations/onboarding.ts` - softwareUsedSchema gets .max(100)
- `components/onboarding/steps/crm-platform-step.tsx` - Skip button text "Skip without saving"
- `components/history/history-filters.tsx` - aria-pressed on date preset chip buttons
- `components/feedback/feedback-list.tsx` - SSR Phosphor import documented with comment
- `components/settings/service-types-section.tsx` - aria-label="Custom service name" on Input
- `app/(dashboard)/customers/page.tsx` - space-y-8 + inline type cast removed

## Decisions Made

- **BusinessWithTemplates uses full MessageTemplate[]**: Using `Pick<MessageTemplate, ...>` would require updating `HistoryClient`, `RequestDetailDrawer`, `CustomersClient`, and the campaigns page — cascading changes with no runtime benefit. Using `MessageTemplate[]` as the annotation is honest about the intent while avoiding needless refactor.
- **SSR Phosphor import retained in feedback-list.tsx**: The billing page (`app/(dashboard)/billing/page.tsx`) is also a Server Component using `/dist/ssr`. Both correctly use the SSR subpath. Standard import causes hydration mismatch in Server Components. Comment added to document this.
- **service_types_enabled added to Business interface**: This field existed in the DB (added in Phase 22) but was never added to the TypeScript interface. The getBusiness() return type annotation surfaced this gap. Fixed at source in database.ts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added service_types_enabled and service_type_timing to Business interface**

- **Found during:** Task 2 (type correctness work)
- **Issue:** Adding explicit return type to `getBusiness()` surfaced that `Business` interface was missing `service_types_enabled` and `service_type_timing` — these DB fields existed since Phase 22 but were never added to the TypeScript type. The `onboarding/page.tsx` accessed `business.service_types_enabled` which previously worked only due to Supabase's implicit `any`-like inference.
- **Fix:** Added both fields to the `Business` interface in `lib/types/database.ts`
- **Files modified:** `lib/types/database.ts`
- **Verification:** `pnpm typecheck` passes
- **Committed in:** 512caae (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug surfaced by type annotation work)
**Impact on plan:** The auto-fix was necessary to complete the type correctness work. It resolves a legitimate type gap (F-44-04 from the audit) as a side effect.

## Issues Encountered

- Using `Pick<MessageTemplate, ...>` for `BusinessMessageTemplate` caused cascading type errors in 4 downstream components (`HistoryClient`, `RequestDetailDrawer`, `CustomersClient`, campaigns page). Switched to `MessageTemplate[]` as the annotation — same runtime behavior, no cascading breakage.

## Next Phase Readiness

- All security, validation, and accessibility fixes from Plan 02 are complete
- `getBusiness()` now has proper typed return — future consumers get correct type inference
- Business interface is now accurate to the DB schema
- Ready for Plan 51-03

---
*Phase: 51-audit-remediation*
*Completed: 2026-02-27*
