# Phase 62: Jobs - Research

**Researched:** 2026-02-27
**Domain:** QA E2E Audit — Jobs page (table, add/edit/detail drawers, filters, mark complete, enrollment trigger, empty state)
**Confidence:** HIGH — all findings based on direct codebase analysis and live DB inspection

---

## Summary

Phase 62 is a QA E2E audit of the Jobs page. No new features are built; all tests verify existing functionality. The Jobs page is the V2 core action surface — "completing a job" is the one manual action that triggers campaign automation. This phase must be thorough because every downstream phase (Campaigns, History, Analytics) depends on the enrollments created here.

The Jobs page is implemented as a server component (`/app/(dashboard)/jobs/page.tsx`) that fetches data and passes it to a client-side `JobsClient`. The table uses TanStack React Table with client-side sorting and filtering. The Add Job sheet uses `useActionState` with a server action (`createJob`). The mark-complete flow calls `markJobComplete()` which sets `status=completed` and calls `enrollJobInCampaign()`.

The primary test account (`audit-test@avisloop.com`) has an existing business with 4 jobs (hvac, plumbing, electrical, do_not_send) and 4 customers. The business has `service_types_enabled = []` (empty array), which means the service type filter falls back to showing all 8 service types — this is the expected fallback behavior per `job-filters.tsx`. One active campaign exists ("HVAC Follow-up" with 2 touches). One enrollment already exists for "Test Technician" (HVAC job completed 2026-02-27). The 3 AUDIT_ test jobs (AUDIT_Patricia Johnson, AUDIT_Marcus Rodriguez, AUDIT_Sarah Chen) do not yet exist and must be created during this phase.

**Primary recommendation:** Test all 10 requirements in a single plan file. Survey existing data first, create 3 AUDIT_ test jobs via the UI during the test (not by DB pre-seeding), then verify each created job's enrollment row exists in the DB after mark-complete. This phase is the data producer for Phase 63 (Campaigns).

---

## Standard Stack

This phase uses the project's existing tooling — no new libraries are introduced.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Playwright (via MCP) | 1.58.1 | Browser automation for UI testing | Already in package.json; MCP tools available |
| Supabase MCP | — | Direct DB queries to verify server-side state | Required per prior decisions — UI alone cannot verify enrollment |
| `@tanstack/react-table` | 8.21.3 | Jobs table (sorting, row model) | Already in use; sorting via `onSortingChange` |
| `useActionState` | React 19 | Add/Edit Job form actions | The form submission mechanism; watch for pending state |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Sonner toast assertions | Verify success/error feedback | After mark-complete, after create/edit job |
| `getByRole` selectors | Semantic selectors (required priority) | Buttons, dialogs, form fields |

---

## Architecture Patterns

### Existing Code Structure

```
app/(dashboard)/jobs/
  page.tsx              — Server component: getActiveBusiness() + getJobs() + campaignMap
  loading.tsx           — Skeleton: 6-column TableSkeleton

components/jobs/
  jobs-client.tsx       — Client shell: header, filters, table/empty-state
  job-table.tsx         — TanStack table + edit/detail/delete/conflict state
  job-columns.tsx       — Column definitions (6 cols: Customer, Service, Status, Campaign, Created, Actions)
  job-filters.tsx       — Status pill + service type pill filters + search
  add-job-sheet.tsx     — Sheet form, useActionState(createJob), 'search'/'create' mode
  add-job-provider.tsx  — Context: lazy-loads customer data on first open
  edit-job-sheet.tsx    — Sheet form, useActionState(updateJob)
  job-detail-drawer.tsx — Read-only detail + mark complete + conflict resolution
  campaign-selector.tsx — Radix Select, loads campaigns via getAvailableCampaignsForJob()
  mark-complete-button.tsx — useTransition wrapper for markJobComplete()
  empty-state.tsx       — Two states: no-filter empty, filtered empty

lib/actions/job.ts     — createJob, updateJob, deleteJob, markJobComplete, markJobDoNotSend
lib/data/jobs.ts       — getJobs() with joins, conflict detail enrichment, pre-flight detection
lib/validations/job.ts — jobSchema, SERVICE_TYPES, JOB_STATUSES, labels
```

### Pattern 1: Server Action with useActionState
**What:** Add Job and Edit Job forms use `useActionState(createJob, null)` for server-side validation and submission. The state object has `{ error?, fieldErrors?, success?, data? }`.
**When to use:** Already in use; understand it to test form validation behaviors correctly.
**Example:**
```typescript
// add-job-sheet.tsx
const [state, formAction, isPending] = useActionState<JobActionState | null, FormData>(
  createJob,
  null
)
// state.fieldErrors.customerId shows field-level errors
// state.success triggers toast and sheet close
```

### Pattern 2: Two-Mode Customer Selection in Add Job
**What:** Add Job sheet has two modes: `'search'` (autocomplete from existing customers) and `'create'` (inline new customer form). Switching is done via the `handleCreateNew(query)` and `handleBackToSearch()` callbacks.
**When to use:** The test must exercise BOTH modes. Mode `'create'` is how AUDIT_ test customers are created (no pre-seeded DB data).
**Key behavior:** If the customer email already exists, `createJob` server action silently reuses the existing customer instead of creating a duplicate.

### Pattern 3: Campaign Selector — Lazy Load on Service Type Change
**What:** `CampaignSelector` fetches available campaigns via `getAvailableCampaignsForJob(serviceType)` server action only when `serviceType` changes. It auto-selects the recommended campaign. Special values: `CAMPAIGN_DO_NOT_SEND = '__do_not_send__'`, `CAMPAIGN_ONE_OFF = '__one_off__'`.
**When to use:** Tests for JOBS-09 (campaign selector shows available campaigns + one-off). The selector only appears after a service type is chosen.

### Pattern 4: markJobComplete Enrollment Flow
**What:** `markJobComplete(jobId, enroll=true)` sets `status=completed`, `completed_at=NOW()`, then calls `enrollJobInCampaign()`. The enrollment function finds a matching campaign by `service_type` (or uses `campaign_override` UUID). Creates a `campaign_enrollments` row with `touch_1_scheduled_at = completed_at + delay_hours`.
**Enrollment verification requires DB query** — the UI only shows a toast success. A Playwright-only test cannot confirm enrollment was created.

### Pattern 5: Service Type Filter Fallback
**What:** `job-filters.tsx` checks `enabledServiceTypes` from `BusinessSettingsProvider`. If `enabledServiceTypes.length === 0` (empty array), falls back to showing all 8 SERVICE_TYPES.
**Critical finding:** The audit test business has `service_types_enabled = []` (empty). This means the service type filter will show ALL 8 types, not just business-specific ones. JOBS-05 says "only shows the service types the business has enabled" — but with an empty array, the fallback shows all 8. This is correct fallback behavior per the code, but the plan must acknowledge this and test the filter behavior that actually applies to the test account.

### Anti-Patterns to Avoid
- **Never pre-seed AUDIT_ customers via DB INSERT:** Create them through the UI (Add Job → create mode) so the `createJob` server action's customer-creation path is exercised.
- **Never assert enrollment only from UI toast:** Always follow up with a DB query to confirm the `campaign_enrollments` row exists with correct `touch_1_scheduled_at`.
- **Never skip the empty-state test:** JOBS-10 requires a business with zero jobs. Use a second test account or temporarily filter to a service type with no jobs — do NOT delete existing jobs.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Enrollment verification | UI-only assertion | Supabase MCP `execute_sql` | Toast fires even if enrollment fails silently (server warns but doesn't error) |
| Empty-state testing | Delete existing jobs | Apply a filter with no results first; if needed, use the second test account | Deleting would break Phase 63 data |
| Table sorting test | Custom sort logic assertions | Click column header, observe row order change | TanStack table handles sort; we verify UI response |

---

## Common Pitfalls

### Pitfall 1: service_types_enabled Empty on Test Account
**What goes wrong:** JOBS-05 says "filter only shows enabled service types." The test account has `service_types_enabled = []`. The filter fallback shows all 8 types. A tester might incorrectly report this as a bug or incorrectly try to configure service types before testing.
**Why it happens:** The filter fallback behavior is intentional: businesses that haven't configured service types yet see all types.
**How to avoid:** In the plan, document the fallback explicitly. Test JOBS-05 by verifying the filter renders all 8 types (correct for this account's configuration). Do NOT change `service_types_enabled` on the audit test account — that would alter Settings, which is Phase 67's scope.

### Pitfall 2: Enrollment Fails Silently
**What goes wrong:** `markJobComplete` catches enrollment errors with `console.warn` rather than returning an error to the UI. The success toast fires regardless. A UI-only test will pass even if enrollment silently failed.
**Why it happens:** The code pattern: `if (!enrollResult.success && !enrollResult.skipped) { console.warn(...) }` — does not propagate to the UI.
**How to avoid:** Always run a DB query after every `markJobComplete` action to confirm the `campaign_enrollments` row exists.
**Warning signs:** Toast shows "Job marked complete! Campaign enrollment started." but the job's Campaign column shows "Not enrolled" after page refresh.

### Pitfall 3: No Matching Campaign → No Enrollment
**What goes wrong:** If no active campaign matches the job's service type, `enrollJobInCampaign` returns `{ skipped: true }`. No enrollment row is created. This is expected behavior, not a bug, but the test must create jobs with service types that have matching campaigns.
**Why it happens:** The test business only has one campaign: "HVAC Follow-up" (service_type = 'hvac', 2 touches). Only HVAC jobs will enroll automatically.
**How to avoid:** Create the 3 AUDIT_ test jobs with HVAC service type (to match the existing campaign) for JOBS-08 enrollment verification. For JOBS-09 (campaign selector test), pick HVAC so the selector shows the existing campaign.

### Pitfall 4: CustomerAutocomplete Lazy Data Load
**What goes wrong:** `AddJobProvider` lazy-fetches customer data when `openAddJob()` is called. If the test clicks the Add Job button and immediately starts typing in the customer field before the data loads, the autocomplete may be empty or show a skeleton.
**Why it happens:** `isLoadingData` flag shows `<Skeleton>` while `getAddJobData()` is pending.
**How to avoid:** After clicking "Add Job", wait for the skeleton to disappear before interacting with the customer field. Use `browser_wait_for` with the customer input becoming visible.

### Pitfall 5: Detail Drawer vs Edit Sheet — Different Customer Selectors
**What goes wrong:** Add Job uses `CustomerAutocomplete` (free-text search with create-new option). Edit Job uses `CustomerSelector` (Radix Select from pre-loaded list, no create-new). The test must exercise both.
**Why it happens:** Different UX for create vs edit — inline customer creation is only available on Add Job.
**How to avoid:** Test Edit Job by selecting a different customer from the dropdown (not trying to create a new one).

### Pitfall 6: Column Sorting Not Wired to Server
**What goes wrong:** The table uses client-side sorting (`getSortedRowModel()` from TanStack). Clicking column headers sorts the in-memory data only. There are no server-side sort params — only `order('created_at', { ascending: false })` is hardcoded in `getJobs()`.
**Why it happens:** Client-side sort is sufficient for the current data volume (50 jobs max per page load).
**How to avoid:** JOBS-01 "column header clicks sort the data" means clicking a header should visually reorder rows. Test by clicking the "Customer" or "Status" header and verifying row order changes. No DB verification needed for sorting.

### Pitfall 7: JOBS-10 Empty State Without a Separate Business
**What goes wrong:** The test account has existing jobs, so the base `/jobs` page never shows the empty state. Applying a service type filter that has no matching jobs shows the "filtered empty state" (different component state), not the true "No jobs yet" empty state.
**Why it happens:** Two empty state variants exist in `empty-state.tsx`: `hasFilters=false` ("No jobs yet") and `hasFilters=true` ("No jobs match your filters").
**How to avoid:** Apply a status filter of "do_not_send" + a service type filter that has no do_not_send jobs. This triggers `hasFilters=true` empty state. For the `hasFilters=false` empty state, document the code behavior and screenshot from a second test account if available, or test with the CreateBusinessWizard second business created during Phase 60/61.

---

## Code Examples

### DB Queries for Enrollment Verification

```sql
-- After markJobComplete on a job, verify enrollment created
SELECT ce.id, ce.status, ce.current_touch,
       ce.touch_1_scheduled_at,
       ce.touch_1_status,
       c.name as campaign_name,
       (ce.touch_1_scheduled_at - j.completed_at) as scheduled_delay
FROM campaign_enrollments ce
JOIN campaigns c ON ce.campaign_id = c.id
JOIN jobs j ON ce.job_id = j.id
WHERE j.id = '<job-id>'
ORDER BY ce.enrolled_at DESC;
```

```sql
-- Verify AUDIT_ jobs were created with correct data
SELECT j.id, j.status, j.service_type, j.completed_at,
       j.campaign_override, j.enrollment_resolution,
       c.name as customer_name, c.email as customer_email
FROM jobs j
JOIN customers c ON j.customer_id = c.id
WHERE c.name LIKE 'AUDIT_%'
ORDER BY j.created_at DESC;
```

```sql
-- Confirm touch_1_scheduled_at aligns with timing config
-- For HVAC: delay_hours = 24 → touch_1_scheduled_at should be ~24h after completed_at
SELECT
  j.completed_at,
  ce.touch_1_scheduled_at,
  EXTRACT(EPOCH FROM (ce.touch_1_scheduled_at - j.completed_at)) / 3600 as delay_hours_actual,
  b.service_type_timing->'hvac' as configured_hours
FROM campaign_enrollments ce
JOIN jobs j ON ce.job_id = j.id
JOIN businesses b ON j.business_id = b.id
WHERE j.customer_id IN (
  SELECT id FROM customers WHERE name LIKE 'AUDIT_%'
);
```

### Playwright Selector Patterns for Jobs Page

```typescript
// Open Add Job sheet
await page.getByRole('button', { name: 'Add Job' }).click()

// Switch to create-new mode in customer autocomplete
// (after typing a new name that has no match, look for "Create" option)
await page.getByLabel('Customer').fill('AUDIT_Patricia Johnson')
// Then look for "Create new customer" or similar option

// Service type select (Radix Select)
await page.getByLabel('Service Type').click()
await page.getByRole('option', { name: 'HVAC' }).click()

// Status toggle buttons (not a Radix Select — custom button group)
await page.getByRole('button', { name: 'Completed' }).click()

// Mark Complete button (in table row Actions column)
await page.getByRole('button', { name: 'Complete' }).first().click()

// Verify success toast
await page.waitForSelector('[data-sonner-toast]', { state: 'visible' })

// Filter by status
await page.getByRole('button', { name: 'Scheduled' }).click()  // status filter pill

// Open job detail drawer by clicking row
await page.getByRole('row', { name: /AUDIT_Patricia/ }).click()
```

---

## Existing Test Account Data (DB Survey)

Current state of `audit-test@avisloop.com` as of 2026-02-27:

**Business:** "Audit Test HVAC" (id: `6ed94b54-6f35-4ede-8dcb-28f562052042`)
- `service_types_enabled`: `[]` (empty — filter shows all 8 types as fallback)
- `review_cooldown_days`: 30
- `google_review_link`: null
- `onboarding_completed_at`: null

**Existing customers (4):**
| Name | Email | Phone | SMS Consent |
|------|-------|-------|------------|
| Test Technician | test-tech@example.com | null | unknown |
| Bob Wilson | bob.wilson@example.com | null | unknown |
| Jane Doe | jane.doe@example.com | +15559876543 | opted_in |
| John Smith | john.smith@example.com | +15551234567 | opted_in |

**Existing jobs (4):**
| Customer | Service | Status | Notes |
|----------|---------|--------|-------|
| Test Technician | hvac | completed | Completed 2026-02-27 (from Phase 61 testing) |
| Bob Wilson | electrical | do_not_send | Created 2026-02-06 |
| John Smith | hvac | completed | Completed 2026-02-06 |
| Jane Doe | plumbing | completed | Completed 2026-02-05 |

**Existing campaigns (1):**
| Name | Service Type | Status | Touches |
|------|-------------|--------|---------|
| HVAC Follow-up | hvac | active | 2 (email 24h, SMS 72h) |

**Existing enrollments (1):**
| Customer | Campaign | Status | Touch 1 Scheduled |
|----------|---------|--------|------------------|
| Test Technician | HVAC Follow-up | active | 2026-02-28 20:38 |

**Implication for test design:**
- "Test Technician" is currently enrolled in "HVAC Follow-up" (active). Creating a new HVAC job for Test Technician would trigger a conflict. Do not use Test Technician for AUDIT_ job enrollment tests.
- AUDIT_ test jobs should use NEW customers (AUDIT_Patricia Johnson, AUDIT_Marcus Rodriguez, AUDIT_Sarah Chen) so no enrollment conflict is triggered.
- For AUDIT_Patricia Johnson (HVAC job) — enrollment will succeed against "HVAC Follow-up" campaign.
- For AUDIT_Marcus Rodriguez and AUDIT_Sarah Chen — choose HVAC service type so they also enroll in "HVAC Follow-up". The enrollment logic allows one customer per campaign (unique constraint is per customer+campaign). Since these are new customers, no conflict.

**JOBS-10 empty state strategy:**
- True "No jobs yet" state (`hasFilters=false`) is not reachable on the main test account.
- Test the filtered empty state by applying both a status filter ("scheduled") and a service type filter ("Roofing") — no jobs exist with status=scheduled AND service_type=roofing.
- For the no-filter empty state, document that the code path exists (`hasFilters=false` branch in `empty-state.tsx`) and note it is only reachable with a fresh business. If a second business was created in Phase 61 (or via `/onboarding?mode=new`), use it here.

---

## Test Job Specifications (AUDIT_ data to create via UI)

These 3 jobs must be created through the Add Job UI during Phase 62 testing, not pre-seeded in DB:

| Customer Name | Email | Service Type | Status | Purpose |
|--------------|-------|-------------|--------|---------|
| AUDIT_Patricia Johnson | audit-patricia@example.com | HVAC | Completed | JOBS-02 (create), JOBS-08 (enrollment trigger) |
| AUDIT_Marcus Rodriguez | audit-marcus@example.com | HVAC | Scheduled | JOBS-07 (mark complete flow) |
| AUDIT_Sarah Chen | audit-sarah@example.com | HVAC | Completed | JOBS-02 (create via inline customer), Phase 63 dependency |

**Notes:**
- All 3 use HVAC to match the existing "HVAC Follow-up" campaign (required for JOBS-08 and JOBS-09).
- AUDIT_Marcus Rodriguez starts as "scheduled" so JOBS-07 (mark complete) can be tested by clicking the Complete button in the table.
- Creating AUDIT_Patricia Johnson first (completed) demonstrates the full create+enroll flow in one shot.
- AUDIT_Sarah Chen is the third job ensuring Phase 63 has multiple enrolled customers to audit the campaigns enrollment list.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Customer creation separate from job | Inline customer creation in Add Job sheet (V2) | Test must exercise both search-existing and create-new modes |
| Status as dropdown select | Status as toggle button group (`scheduled`/`completed`) | `getByRole('button', { name: 'Completed' })` not `getByRole('combobox')` |
| Separate mark-complete page | `MarkCompleteButton` component inline in table row | Click "Complete" in the Actions cell; it is not inside a dialog |
| Campaign enrollment from batch cron only | Immediate enrollment on `markJobComplete()` | Enrollment is synchronous — DB query can happen immediately after action resolves |

---

## Open Questions

1. **JOBS-10 empty state for hasFilters=false**
   - What we know: The test account always has jobs; no zero-job state exists.
   - What's unclear: Whether a second business with zero jobs exists from prior phase testing.
   - Recommendation: Check via DB if second business exists. If not, use the filtered empty state for the test and note the gap. Do not create a throwaway business just for this test.

2. **CustomerAutocomplete create-new trigger**
   - What we know: Typing a name with no match in `CustomerAutocomplete` should reveal a "create new" option.
   - What's unclear: The exact text/trigger for the "create new" affordance (the `onCreateNew` callback is called by `CustomerAutocomplete`; the exact UI element must be inspected at runtime).
   - Recommendation: During test execution, type "AUDIT_Patricia Johnson" and screenshot what options appear. The plan should include a runtime-discovery step.

---

## Sources

### Primary (HIGH confidence)
- Direct file reads: `components/jobs/jobs-client.tsx`, `job-table.tsx`, `job-columns.tsx`, `job-filters.tsx`, `add-job-sheet.tsx`, `edit-job-sheet.tsx`, `job-detail-drawer.tsx`, `campaign-selector.tsx`, `mark-complete-button.tsx`, `add-job-provider.tsx`, `empty-state.tsx`
- Direct file reads: `lib/actions/job.ts`, `lib/data/jobs.ts`, `lib/validations/job.ts`, `lib/actions/add-job-campaigns.ts`
- Direct DB queries via Supabase MCP — confirmed live state of test account

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md` — phase ordering decisions, AUDIT_ naming conventions, Phase 62 rationale
- `.planning/research/ARCHITECTURE.md` — route inventory, selector priority hierarchy
- `.planning/REQUIREMENTS.md` — JOBS-01 through JOBS-10 requirement text
- `.planning/ROADMAP.md` — Phase 62 success criteria, Phase 63 dependency on Phase 62 enrollment data

---

## Metadata

**Confidence breakdown:**
- Existing code behavior: HIGH — all components read directly
- DB state / test data: HIGH — confirmed via Supabase MCP queries
- Enrollment verification approach: HIGH — based on direct action code analysis showing silent warn pattern
- JOBS-10 empty state path: MEDIUM — depends on whether second business exists (not yet confirmed)
- CustomerAutocomplete "create new" UI affordance exact text: MEDIUM — must be observed at runtime

**Research date:** 2026-02-27
**Valid until:** Until codebase changes to jobs components or actions
