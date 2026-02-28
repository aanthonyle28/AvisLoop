---
phase: 60-onboarding-wizard
plan: 01
subsystem: testing
tags: [playwright, onboarding, wizard, qa, supabase]

# Dependency graph
requires:
  - phase: 59-auth-flows
    provides: authenticated session for audit-test@avisloop.com

provides:
  - QA findings for both onboarding wizard flows (first-business 4-step + additional-business 2-step)
  - ONB-01 PASS: first-business wizard end-to-end confirmed
  - ONB-02 PASS: additional business creation wizard confirmed
  - ONB-03 PASS: DB-backed draft persistence confirmed
  - BUG-ONB-01 documented: software_used column missing (silent failure)
  - Business reset to pre-onboarding state for Phase 61

affects:
  - phase 61-dashboard (depends on clean onboarding state)
  - phase 56-additional-business-creation (BUG-ONB-01 fix needed in Phase 44 code)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Playwright headless via playwright-core ESM import"
    - "Supabase REST API for DB queries (no SDK needed in test scripts)"
    - "Service role key for DB cleanup (RLS blocks anon DELETE)"
    - "onboarding_completed_at = null is NOT a dashboard redirect trigger — only null business triggers redirect"

key-files:
  created:
    - docs/qa-v3.1/60-onboarding-wizard.md
    - docs/qa-v3.1/screenshots/ (27 screenshots)
    - scripts/qa-60-onb01.mjs
    - scripts/qa-60-onb02.mjs
    - scripts/qa-60-onb03.mjs
  modified: []

key-decisions:
  - "Dashboard does NOT redirect to /onboarding when onboarding_completed_at=null — only when activeBusiness===null. This is intentional V2 behavior."
  - "Additional business wizard (CreateBusinessWizard) has 2 steps, not 3 — SMS Consent step omitted, sms_consent_acknowledged set to true server-side. By design."
  - "Draft persistence is DB-backed (step Continue writes to DB). No localStorage field-level persistence. onboarding-draft-v3 localStorage key was not found during test."
  - "Gentle Follow-Up preset creates a campaign named 'Conservative (Email Only) (Copy)' — display name differs from stored name."
  - "Service role key required for test cleanup (DELETE campaigns) — RLS blocks anon user deletes even with correct apikey"

patterns-established:
  - "QA test order: additional business (ONB-02) → draft persistence (ONB-03) → first-business wizard (ONB-01) — to preserve onboarding_completed_at=null state as long as possible"
  - "Cleanup pattern: use Supabase REST with service role key directly (not via app server actions) for test data cleanup"

# Metrics
duration: 8min
completed: 2026-02-28
---

# Phase 60 Plan 01: Onboarding Wizard QA Summary

**E2E QA of both onboarding wizard flows (4-step first-business + 2-step additional-business) with draft persistence verification — all 3 requirements PASS, BUG-ONB-01 (software_used missing column) documented**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-28T03:57:13Z
- **Completed:** 2026-02-28T04:05:28Z
- **Tasks:** 3/3
- **Files modified:** 1 (docs/qa-v3.1/60-onboarding-wizard.md)

## Accomplishments
- ONB-01 PASS: First-business 4-step wizard tested end-to-end with DB verification — onboarding_completed_at, service_types, sms_consent, phone, google_review_link, custom_service_names, and campaign + touches all confirmed correct
- ONB-02 PASS: Additional-business 2-step wizard creates new business + Standard preset campaign (3 touches) without disturbing original business; cleanup verified
- ONB-03 PASS: DB-backed draft persistence confirmed — step 1 data pre-filled after navigation away and return; no localStorage field persistence used
- BUG-ONB-01 documented: `software_used` column missing from businesses table; `saveSoftwareUsed()` server action silently fails; user's CRM platform choice is never stored (Supabase returns PGRST204)
- 27 screenshots captured across all 3 test scenarios
- Business fully reset to pre-onboarding state for Phase 61

## Task Commits

Each task was committed atomically:

1. **Task 1: ONB-02 — Additional business creation wizard** - `8a12e90` (test)
2. **Task 2: ONB-03 — Draft persistence verification** - `d6532bd` (test)
3. **Task 3: ONB-01 — First-business 4-step wizard + final report** - `406f9f9` (test)

**Plan metadata:** `<pending>` (docs: complete plan)

## Files Created/Modified
- `docs/qa-v3.1/60-onboarding-wizard.md` — 347-line QA findings document with ONB-01/02/03 results, DB verification tables, BUG-ONB-01, and overall assessment
- `docs/qa-v3.1/screenshots/` — 27 screenshots (qa-60-*.png) across all 3 test scenarios

## Decisions Made

1. **Dashboard redirect behavior confirmed intentional:** `/dashboard` does not redirect to `/onboarding` when `onboarding_completed_at=null`. Only redirects when business is null entirely. V2 behavior: users are not blocked.

2. **CreateBusinessWizard has 2 steps only by design:** SMS Consent step omitted; `sms_consent_acknowledged=true` set server-side via `completeNewBusinessOnboarding()`. This is a documented design choice.

3. **Gentle Follow-Up preset internal name mismatch noted:** UI shows "Gentle Follow-Up" but the created campaign is named "Conservative (Email Only) (Copy)". Display/storage name discrepancy — cosmetic, not functional.

4. **Service role key required for cleanup:** Supabase RLS blocked anon user DELETE even with service role API key when using user-scoped filter. Used direct `id=eq.<id>` DELETE with service role key instead.

## Deviations from Plan

None - plan executed exactly as written. Test order was honored (ONB-02 → ONB-03 → ONB-01).

The plan's Playwright MCP instructions were adapted to run as Node.js ESM scripts using `playwright-core` directly (same pattern established in Phase 59).

## Issues Encountered

1. **Supabase REST DELETE with user_id filter + service role returned 401.** The filter `?user_id=eq.X&id=neq.Y` failed because RLS evaluates for the calling user context which is the service role (not the actual user). Fixed by using `?id=eq.<specific-id>` instead, which works with service role regardless of RLS.

2. **`information_schema.columns` not accessible via PostgREST REST endpoint.** Used a direct PATCH with the `software_used` column instead — Supabase returns PGRST204 if column doesn't exist, confirming the bug without needing schema access.

3. **`Triple_click` method does not exist on Playwright locators.** Used `click({ clickCount: 3 })` pattern instead for selecting all text in an input.

## Next Phase Readiness
- Business "Audit Test HVAC" (6ed94b54-6f35-4ede-8dcb-28f562052042) reset to pre-onboarding state
- Ready for Phase 61 (Dashboard QA) — can run full onboarding first to get dashboard in expected state, or test dashboard in current state
- BUG-ONB-01 should be fixed before production: `ALTER TABLE businesses ADD COLUMN software_used TEXT;`

---
*Phase: 60-onboarding-wizard*
*Completed: 2026-02-28*
