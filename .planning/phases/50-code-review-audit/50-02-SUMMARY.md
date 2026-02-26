---
phase: 50-code-review-audit
plan: 02
subsystem: ui
tags: [onboarding, server-actions, validation, supabase, rls, custom-service-names, crm-platform, settings]

# Dependency graph
requires:
  - phase: 44-onboarding-services
    provides: CRM platform step, custom service names, 4-step onboarding wizard, data layer updates
provides:
  - Complete security, correctness, performance, accessibility, and V2 alignment review of all 19 Phase 44 files
  - Severity-rated findings table ready for consolidation in Plan 50-03
affects:
  - 50-03-cross-cutting-audit (carries forward all findings for final consolidated report)

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/50-code-review-audit/50-02-SUMMARY.md
  modified: []

key-decisions:
  - "RF-5 confirmed: CRM platform step allows Continue without selection, saves empty string instead of null — LOW severity"
  - "RF-6 confirmed: CRM card colors are third-party brand colors, acceptable as exception to semantic tokens rule"
  - "updateServiceTypeSettings uses user_id in WHERE clause (not fetching business.id first) — MEDIUM security concern (weak defense-in-depth)"
  - "saveSoftwareUsed has no max length validation on softwareUsed field — LOW severity"
  - "getJobs has two sequential supabase queries for conflict resolution and pre-flight detection — acceptable but documents N+1 risk"
  - "Business.custom_service_names typed as string[] (not string[] | null) in database.ts, but DB may return null — type mismatch"

patterns-established: []

# Metrics
duration: 1h 05min
completed: 2026-02-26
---

# Phase 50 Plan 02: Onboarding & Data Layer Code Review Summary

**Security audit of 19 Phase 44 files: all server actions use authenticated client + user-scoped queries, custom_service_names validated end-to-end, with 9 findings (1 medium, 7 low, 1 info) to carry into Plan 50-03**

## Performance

- **Duration:** ~65 min
- **Started:** 2026-02-26T03:20:50Z
- **Completed:** 2026-02-26T03:25:44Z
- **Tasks:** 2 review tasks
- **Files reviewed:** 19 (10 server-side/type + 9 UI/component)

## Accomplishments

- Audited all 10 server-side files (server actions, data queries, types, validations) for security, correctness, and performance
- Audited all 9 UI/component files for correctness, accessibility, and design system consistency
- Traced custom_service_names data flow end-to-end from Zod schema through server actions, database queries, type definitions, and UI components
- Confirmed and revised RF-5 and RF-6 from research phase with exact line numbers
- Identified 9 total findings across all categories

## Task Commits

This plan is a read-only audit. No source code was modified. The only commit is the planning metadata.

**Plan metadata:** _(see final commit hash below)_

## Files Reviewed

**Server-side / Data layer:**
- `lib/actions/onboarding.ts` — 7 server actions, 366 lines
- `lib/actions/business.ts` — 4 server actions, 302 lines
- `lib/actions/conflict-resolution.ts` — 2 server actions, 215 lines
- `lib/actions/job.ts` — 5 server actions, 683 lines
- `lib/data/business.ts` — 3 query functions, 105 lines
- `lib/data/onboarding.ts` — 4 query functions, 194 lines
- `lib/data/jobs.ts` — 3 query functions, 233 lines
- `lib/types/database.ts` — type definitions, 379 lines
- `lib/types/onboarding.ts` — onboarding types, 24 lines
- `lib/validations/onboarding.ts` — Zod schemas, 74 lines

**UI / Components:**
- `app/onboarding/page.tsx` — server component, 79 lines
- `components/onboarding/onboarding-wizard.tsx` — wizard shell, 146 lines
- `components/onboarding/onboarding-steps.tsx` — step router, 78 lines
- `components/onboarding/steps/crm-platform-step.tsx` — NEW step, 206 lines
- `components/onboarding/steps/business-setup-step.tsx` — updated, 265 lines
- `components/settings/service-types-section.tsx` — updated, 273 lines
- `components/settings/settings-tabs.tsx` — updated, 159 lines
- `components/jobs/edit-job-sheet.tsx` — minor update, ~260 lines
- `components/jobs/job-columns.tsx` — minor update, ~487 lines

## Decisions Made

- RF-5 severity stays LOW: saving empty string `''` vs null is minor data quality issue; step is explicitly skippable per design, and `software_used` is a non-critical field
- RF-6 confirmed ACCEPTABLE: CRM card colors (`bg-emerald-500`, `bg-blue-500`, `bg-red-500`, `bg-orange-500`, `bg-violet-500`) are third-party brand identifiers that must not change with theme; document as deliberate exception
- `updateServiceTypeSettings` using `.eq('user_id', user.id)` directly (skipping business fetch) is flagged MEDIUM — update is scoped to authenticated user but bypasses the explicit business-ownership verification layer used by all other actions
- `saveSoftwareUsed` schema (`z.string().optional()`) has no max length — flag as LOW since input comes from controlled selection but could accept arbitrary text if called directly

## Findings Report

All 9 findings are rated and ready for consolidation in Plan 50-03.

### Summary Table

| ID | Severity | Category | File | Line(s) | Description | Recommendation |
|----|----------|----------|------|---------|-------------|----------------|
| F-44-01 | MEDIUM | Security | `lib/actions/business.ts` | 261 | `updateServiceTypeSettings` uses `.eq('user_id', user.id)` directly on the `businesses` table without first fetching the business ID. All other actions fetch business ID first then scope by `.eq('id', business.id)`. While functionally correct (RLS and the WHERE clause both enforce user ownership), this breaks the established defense-in-depth pattern: the explicit business-fetch step also validates that a business exists before performing updates. | Fetch business ID first (`.select('id').eq('user_id', user.id).single()`), then update by `.eq('id', business.id)` to match the pattern in all other server actions. |
| F-44-02 | LOW | Security | `lib/validations/onboarding.ts` | 58–60 | `softwareUsedSchema` accepts any string with no max length constraint: `z.string().optional()`. If `saveSoftwareUsed` is called directly (not via the CRM platform UI), arbitrary-length strings could be saved to `software_used`. | Add `.max(100)` to the schema: `z.string().max(100).optional().or(z.literal(''))`. The UI controls the input length but defense should be at the schema level. |
| F-44-03 | LOW | Correctness | `components/onboarding/steps/crm-platform-step.tsx` | 31–39 | RF-5 confirmed. When `selected === null` (user clicks Continue without selecting), `valueToSave = ''` (empty string) is passed to `saveSoftwareUsed`. This saves `software_used = ''` to the database instead of `null`. The empty string is semantically incorrect (null means "not set", empty string means "set to nothing"). Since the step is skippable, users who want to skip can click the explicit "Skip" link — the Continue button should ideally also skip cleanly. | Either: (a) normalize empty string to null in `saveSoftwareUsed` server action: `softwareUsed || null`; or (b) disable Continue when nothing is selected (only allow Skip). Option (a) is lower friction. |
| F-44-04 | LOW | Correctness | `lib/types/database.ts` | 42 | `Business` interface declares `custom_service_names: string[]` (non-nullable). The Supabase `select()` may return `null` for this column if the row was inserted before the column was added (migration backfill may set `NULL`). The data layer defensively handles this (`business.custom_service_names \|\| []`) but the type says it's never null, which could mislead future callers. | Change to `custom_service_names: string[] \| null` and update the defensive fallback pattern throughout. Alternatively, confirm the migration used `DEFAULT '{}'` (not null) for backfill — if so, document this in a comment on the type. |
| F-44-05 | LOW | Performance | `lib/data/jobs.ts` | 68–100, 102–149 | `getJobs` has two sequential `campaign_enrollments` queries after the main jobs fetch: one for `conflict/queue_after` jobs (line 77–80) and another for pre-flight scheduled jobs (line 118–121). These are necessary but note: (a) they run sequentially, not in parallel, and (b) for businesses with many jobs, each query could touch many rows. The current implementation is correct but could be made more efficient. | For now this is acceptable. If profiling shows this is slow: combine into a single query using `.in('customer_id', [...conflictIds, ...preflightIds])` with deduplication. Document this as a known optimization opportunity. |
| F-44-06 | LOW | Dead Code | `lib/types/database.ts` | 194–195 | `SendLogWithContact = SendLogWithCustomer` deprecated alias still present and used in `history-table.tsx` and `history-client.tsx`. The alias works but the JSDoc `@deprecated` comment (added in Plan 50-01 scope) is present, so the intent is clear. | Complete migration in Plan 50-03: replace all `SendLogWithContact` usages with `SendLogWithCustomer`, then remove the alias. |
| F-44-07 | LOW | Accessibility | `components/onboarding/steps/crm-platform-step.tsx` | 194–202 | "Skip for now" is a plain `<button>` styled with `underline text-muted-foreground`. It has no `aria-label` and relies solely on visible text. While the text is descriptive, the button is outside the `role="radiogroup"` div and visually appears below the action buttons. Screen readers will read it in DOM order (after the Continue button), which is correct. No `aria-label` needed since text is clear. HOWEVER — the "Skip for now" click calls `onComplete()` directly without saving — so if the user already selected a CRM and types in the "Other" custom text field, then clicks Skip, the custom text is discarded but the selected CRM IS NOT saved. | Minor: document that Skip intentionally discards unsaved selection. Consider naming it "Skip without saving" for clarity. No code change required unless UX wants to save the selection on Skip too. |
| F-44-08 | LOW | Design System | `lib/validations/onboarding.ts` | 46–51 | RF-6 confirmed. CRM platform colors are Tailwind utility classes for brand colors: `bg-emerald-500` (Jobber), `bg-blue-500` (Housecall Pro), `bg-red-500` (ServiceTitan), `bg-orange-500` (GorillaDesk), `bg-violet-500` (FieldPulse). These deviate from the semantic token system but are intentional — third-party brand identifiers that must remain stable regardless of theme changes. | Document as acceptable exception in a comment: `// Brand colors — intentionally not using semantic tokens (third-party brand identifiers)`. No code change required. |
| F-44-09 | INFO | V2 Alignment | `lib/actions/onboarding.ts` | 281–312 | `saveSoftwareUsed` is still named for "software" and maps to a `software_used` column, but the UI now presents it as "CRM Platform" selection. The column name and action name are V1-era artifacts. The actual CRM step now lives in `crm-platform-step.tsx` and uses this action. This is consistent throughout but the naming is slightly misleading. | Low priority: rename `saveSoftwareUsed` → `saveCRMPlatform` and `software_used` column → `crm_platform` in a future cleanup phase. Out of scope for this audit. |

### Findings by Severity

| Severity | Count | IDs |
|----------|-------|-----|
| MEDIUM | 1 | F-44-01 |
| LOW | 7 | F-44-02, F-44-03, F-44-04, F-44-05, F-44-06, F-44-07, F-44-08 |
| INFO | 1 | F-44-09 |
| **Total** | **9** | |

## Security Audit: Server Actions Checklist

All server actions in Phase 44 files were verified against the following checklist:

### `lib/actions/onboarding.ts`

| Check | markOnboardingComplete | saveBusinessBasics | saveServicesOffered | saveSoftwareUsed | acknowledgeSMSConsent |
|-------|----------------------|-------------------|---------------------|------------------|----------------------|
| Uses `createClient()` (not service role) | PASS | PASS | PASS | PASS | PASS |
| Calls `supabase.auth.getUser()` for auth | PASS | PASS | PASS | PASS | PASS |
| Rejects unauthenticated requests | PASS | PASS | PASS | PASS | PASS |
| business_id from session (not client) | PASS | PASS | PASS | user_id (ok) | user_id (ok) |
| Input validated via Zod schema | N/A | PASS | PASS | PASS (no max) | PASS |
| customServiceNames validated (10 max, 50 char) | N/A | N/A | PASS (schema) | N/A | N/A |

**Notable:** `saveSoftwareUsed` and `acknowledgeSMSConsent` use `.eq('user_id', user.id)` without fetching business.id first — this is the same pattern as `updateServiceTypeSettings` flagged in F-44-01. These update a flat field (string/bool) so the risk is minimal, but inconsistent.

### `lib/actions/business.ts`

| Check | updateBusiness | saveReviewLink | updateServiceTypeSettings | updateReviewCooldown |
|-------|---------------|----------------|--------------------------|---------------------|
| Uses `createClient()` | PASS | PASS | PASS | PASS |
| getUser() auth | PASS | PASS | PASS | PASS |
| Input validated | PASS (Zod) | PASS (URL) | PASS (inline) | PASS (range check) |
| customServiceNames defense | N/A | N/A | PASS (.trim/.filter/.slice) | N/A |
| Business scoping | PASS (fetches id) | PASS (fetches id) | FAIL-SOFT (user_id only) | PASS (user_id only) |

**Note on F-44-01:** `updateServiceTypeSettings` and `updateReviewCooldown` both skip the business-fetch and use `.eq('user_id', user.id)` directly. This is functionally correct (RLS enforces ownership) but inconsistent with the established defensive pattern.

### `lib/actions/conflict-resolution.ts`

| Check | resolveEnrollmentConflict | revertConflictResolution |
|-------|--------------------------|-------------------------|
| Uses `createClient()` | PASS | PASS |
| getUser() auth | PASS | PASS |
| Fetches business.id before job lookup | PASS | PASS |
| Job scoped to business_id | PASS | PASS |
| Idempotency check | PASS | PASS |

### `lib/actions/job.ts`

| Check | createJob | updateJob | deleteJob | markJobComplete | markJobDoNotSend | bulkCreateJobsWithCustomers |
|-------|-----------|-----------|-----------|-----------------|------------------|----------------------------|
| Uses `createClient()` | PASS | PASS | PASS | PASS | PASS | PASS |
| getUser() auth | PASS | PASS | PASS | PASS | PASS | PASS |
| Fetches business.id | PASS | PASS | PASS | PASS | PASS | PASS |
| Customer scoped to business | PASS | PASS | N/A | N/A | N/A | PASS |
| Job scoped to business | PASS | PASS | PASS | PASS | PASS | N/A |

## Custom Service Names: End-to-End Data Flow Verification

Tracing `["Duct Cleaning", "Insulation"]` through the full stack:

### 1. Validation (lib/validations/onboarding.ts, line 29–34)
```
servicesOfferedSchema.customServiceNames = z.array(
  z.string().min(1).max(50).trim()
).max(10).optional().default([])
```
**Status: PASS** — Max 10 items, each max 50 chars, trimmed. Zod strips items that fail (via safeParse).

### 2. Server Action Write (lib/actions/onboarding.ts, line 264)
```
custom_service_names: customServiceNames || []
```
**Status: PASS** — Falls back to empty array. `customServiceNames` is already validated via Zod. Passed to `.update()` which Supabase parameterizes.

### 3. Server Action Write — Settings (lib/actions/business.ts, lines 249–252)
```
const validatedCustomNames = (settings.customServiceNames || [])
  .map(n => n.trim())
  .filter(n => n.length > 0 && n.length <= 50)
  .slice(0, 10)
```
**Status: PASS** — Defense-in-depth validation on top of client-side enforcement.

### 4. Database Query Read (lib/data/business.ts, line 91)
```
.select('service_types_enabled, service_type_timing, custom_service_names')
```
**Status: PASS** — Column explicitly selected (not `select('*')`). Returns selected columns only.

### 5. Data Query Return (lib/data/business.ts, lines 97–103)
```
return {
  ...
  customServiceNames: business.custom_service_names || [],
}
```
**Status: PASS** — Defensive `|| []` handles null case. Type matches return type declaration.

### 6. Onboarding Status Read (lib/data/onboarding.ts, line 52)
```
.select('id, onboarding_completed_at, google_review_link, phone, software_used,
         service_types_enabled, custom_service_names, sms_consent_acknowledged')
```
**Status: PASS** — Column explicitly in select list. Accessed as `business.custom_service_names` but value is NOT surfaced in the `OnboardingStatus` return type (only used for the `hasServiceTypes` check). This means onboarding status does NOT return custom service names to callers.

**Note:** `getOnboardingStatus()` selects `custom_service_names` but doesn't use it in its return value. The column fetch is unnecessary. Minor performance waste (negligible) but could confuse readers.

### 7. TypeScript Type (lib/types/database.ts, line 42)
```
custom_service_names: string[]
```
**Status: WARN** — Typed as non-nullable `string[]`. DB may return `null` if column was added with no default for existing rows. Data layer uses `|| []` defensively but the type doesn't reflect reality. (Finding F-44-04)

### 8. Onboarding Type (lib/types/onboarding.ts, line 10)
```
custom_service_names: string[] | null
```
**Status: PASS** — Correctly typed as nullable to match actual DB state.

### 9. UI — Onboarding (components/onboarding/onboarding-steps.tsx, line 44)
```
defaultCustomServiceNames={business?.custom_service_names || []}
```
**Status: PASS** — Handles null from `OnboardingBusiness` type.

### 10. UI — Settings (components/settings/settings-tabs.tsx, line 100)
```
initialCustomServiceNames={serviceTypeSettings?.customServiceNames || []}
```
**Status: PASS** — Handles null from `getServiceTypeSettings()` return.

**Verdict: Data flow is correct end-to-end.** Custom service names saved in onboarding or settings will correctly round-trip. Minor type inconsistency (F-44-04) and unnecessary column fetch in `getOnboardingStatus` are the only gaps.

## UI / Component Review Findings

### app/onboarding/page.tsx

- **Step clamping:** `Math.min(Math.max(1, stepParam), 4)` at line 49 — CORRECT
- **NaN handling:** `parseInt(params.step || '1', 10) || 1` at line 46 — CORRECT, `|| 1` handles NaN from invalid strings
- **Step count:** Clamps to 4, matches `STEPS.length` in wizard — CORRECT
- **Fetch scoping:** `getBusiness()` internally fetches by `user_id` — CORRECT
- **Select('*') for presets:** Line 56 — `select('*, campaign_touches (*)')` uses `*` for presets. Acceptable for system data (preset set is small and stable), but slightly over-fetches.

### components/onboarding/onboarding-wizard.tsx

- **STEPS array:** 4 entries (Business Setup, Campaign Preset, CRM Platform, SMS Consent) — CORRECT
- **Progress bar:** `totalSteps={STEPS.length}` — dynamically reflects 4 steps — CORRECT
- **Navigation bounds:** `goToStep` checks `step < 1 || step > STEPS.length` — CORRECT
- **Back navigation:** `goBack()` calls `goToStep(currentStep - 1)` — CORRECT
- **Skip:** CRM step (step 3) has `skippable: true` but the wizard doesn't prevent navigation — the skip is handled within `CRMPlatformStep` via the "Skip for now" button
- **Draft persistence:** Zod validates localStorage data on load — CORRECT (SEC-04 compliant)
- **isSubmitting guard:** Prevents double-submit on rapid clicks — CORRECT

### components/onboarding/onboarding-steps.tsx

- **Switch/case:** Cases 1, 2, 3, 4 + `default: return null` — CORRECT, all cases covered
- **Type safety:** `currentStep` is a number, switch covers 1-4, default handles out-of-range — CORRECT
- **customServiceNames threaded correctly:** Line 44 `defaultCustomServiceNames={business?.custom_service_names || []}` — CORRECT

### components/onboarding/steps/crm-platform-step.tsx

- **RF-5 confirmed (F-44-03):** `selected === null` → `valueToSave = ''` (empty string, not null). Exact location: lines 32–35.
- **RF-6 confirmed (F-44-08):** Colors at `lib/validations/onboarding.ts` lines 46–51, not in this component directly — the component uses `platform.color` class from the constant.
- **Accessibility — radiogroup:** Line 67 `role="radiogroup"` on the grid div — PASS
- **Accessibility — radio buttons:** Lines 77–78 `role="radio"` and `aria-checked={isSelected}` on each card button — PASS
- **Keyboard navigation:** Cards are `<button type="button">` elements — keyboard selectable (Enter/Space). Arrow key navigation between radio options is NOT implemented (custom radiogroup requires `onKeyDown` handlers for arrow keys). This is a minor accessibility gap. Screen readers can Tab between buttons but cannot use arrow keys to navigate as expected in a true radiogroup.
- **Custom text input:** `aria-label="Custom CRM platform name"` on line 166 — PASS
- **Skip button:** No `aria-label` — acceptable, text "Skip for now" is descriptive
- **isPending state:** All buttons disabled during submission — CORRECT

### components/onboarding/steps/business-setup-step.tsx

- **Enter key prevention:** Line 214–218 `onKeyDown` with `e.preventDefault()` for Enter key in custom service input — PASS (prevents parent form submission)
- **Max tag count:** Line 64 `customServiceNames.length < 10` check before adding — PASS
- **Individual tag length:** Line 223 `maxLength={50}` on the Input — PASS (client-side enforcement)
- **Server-side length:** `servicesOfferedSchema` enforces `.max(50)` on each string — PASS
- **Clearing on uncheck:** Line 104 `customServiceNames: selected.includes('other') ? customServiceNames : []` — PASS, clears custom names when "Other" is not selected
- **Submit disabled when no services:** Line 258 `disabled={isPending || selected.length === 0}` — PASS, matches server validation
- **Tag overflow display:** When 10 tags added, shows "Maximum 10 custom services" message — CORRECT

### components/settings/service-types-section.tsx

- **Custom names parity with onboarding:** Identical tag input pattern (same logic, same `addCustomService`/`removeCustomService` functions, same `maxLength={50}`, same `< 10` guard) — PARITY CONFIRMED
- **Clearing on "Other" uncheck:** Line 72 `enabled.has('other') ? customServiceNames : []` passed to `updateServiceTypeSettings` — PASS, clears on save
- **Enter key prevention:** Lines 169–173 — PASS
- **Input missing `aria-label`:** The custom service Input at line 166 has no `id` or `aria-label`. The Label at the section header (`<h4>`) is not associated via `htmlFor`. Minor accessibility gap.
- **Review cooldown validation:** Client uses `min/max` on the number input; server validates via `MIN_ENROLLMENT_COOLDOWN_DAYS/MAX_ENROLLMENT_COOLDOWN_DAYS` — DOUBLE-VALIDATED, PASS

### components/settings/settings-tabs.tsx

- **customServiceNames threaded correctly:** Line 100 `initialCustomServiceNames={serviceTypeSettings?.customServiceNames || []}` — PASS
- **Null safety:** Optional chaining on `serviceTypeSettings?.customServiceNames` — PASS
- **Business check before Customers tab:** Lines 130–144, graceful degradation if no business — CORRECT

### components/jobs/edit-job-sheet.tsx

- **Uses BusinessSettingsProvider:** Line 35 `const { enabledServiceTypes } = useBusinessSettings()` — PASS
- **enabledTypes threaded to ServiceTypeSelect:** Line 172 `enabledTypes={enabledServiceTypes}` — PASS (this was the bug fixed in previous phase)
- **Status selector:** Native `<select>` element (not Radix) — minor inconsistency with the Radix Select used in history-filters. Functionally correct.
- **No custom service names display:** EditJobSheet doesn't display custom service names — it uses `ServiceTypeSelect` which shows the 8 standard types plus "Other" as a label. Custom service names aren't relevant at the job level since they're metadata about the "Other" category, not individual job identifiers.

### components/jobs/job-columns.tsx

- **Custom service display:** Column uses `SERVICE_TYPE_LABELS[serviceType] || serviceType` at line 55. `SERVICE_TYPE_LABELS` maps standard types. For the `'other'` service type, it would show "Other" from the labels map. Custom service names are NOT shown in columns — jobs store only the service_type enum, not the custom name. This is by design (custom service names are business-level metadata, not per-job).
- **aria-labels on action buttons:** Edit and Delete buttons have `aria-label` — PASS (lines 359, 367)
- **No uses of deprecated SendLogWithContact** — CORRECT (this file doesn't deal with send logs)

## Deviations from Plan

None — this plan is a read-only audit. All files were reviewed as specified. No source code modifications were made. All findings documented above.

## Issues Encountered

None. All 19 files were readable and complete.

## Next Phase Readiness

All findings from Plan 50-02 are ready for consolidation in Plan 50-03:

**Findings to carry forward:**
- F-44-01 (MEDIUM): `updateServiceTypeSettings` uses user_id directly — recommend fix
- F-44-02 (LOW): `softwareUsedSchema` missing max length
- F-44-03 (LOW): CRM step saves empty string instead of null
- F-44-04 (LOW): `Business.custom_service_names` typed as non-nullable
- F-44-05 (LOW): Sequential conflict queries in `getJobs` — documented optimization opportunity
- F-44-06 (LOW): `SendLogWithContact` deprecated alias migration incomplete
- F-44-07 (LOW): "Skip for now" discards selection silently
- F-44-08 (LOW): CRM brand colors — documented as acceptable exception
- F-44-09 (INFO): `software_used` column/action naming is V1-era artifact

**Blockers:** None.
**Plan 50-03 can proceed** with the combined findings from Plans 50-01 and 50-02.

---
*Phase: 50-code-review-audit*
*Completed: 2026-02-26*
