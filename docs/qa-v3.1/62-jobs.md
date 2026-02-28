# Phase 62: Jobs — QA Findings

**Tested:** 2026-02-28
**Tester:** Claude (Playwright MCP + Supabase JS client)
**App URL:** http://localhost:3000
**Test account:** audit-test@avisloop.com
**Business:** Audit Test HVAC (6ed94b54-6f35-4ede-8dcb-28f562052042)

---

## Summary

| Requirement | Status | Notes |
|-------------|--------|-------|
| JOBS-01: Table columns + sorting | PARTIAL PASS | 6 columns present (5 named + 1 empty Actions); sort infra wired but headers not clickable — no visual sort affordance |
| JOBS-02: Add Job (create + search modes) | PASS | Create mode: inline customer form appeared and created job. Search mode: autocomplete returned existing customer |
| JOBS-03: Edit Job | PASS | Pre-populated with existing notes; save persisted to DB |
| JOBS-04: Job detail drawer | PASS | All 6 required fields visible: customer name, email, service type, status, campaign, notes, timestamps |
| JOBS-05: Service type filter | PASS | Empty service_types_enabled → all 8 type pills shown (correct fallback); HVAC=2 rows, Electrical=1 row |
| JOBS-06: Status filter | PASS | All 3 pills present; Completed=3, Do Not Send=1, Scheduled=0→1 (before/after Marcus creation) |
| JOBS-07: Mark Complete | PASS | Scheduled→Completed transition confirmed; completed_at IS NOT NULL in DB |
| JOBS-08: Enrollment trigger (DB verified) | PASS | All 3 AUDIT_ jobs have active enrollments; 24.0h delay for all HVAC jobs |
| JOBS-09: Campaign selector | PASS | HVAC Follow-up, Send one-off, Do not send options visible after selecting HVAC |
| JOBS-10: Empty state | PASS | Filtered empty state: "No jobs match your filters" + Clear button; true empty state not directly tested |

---

## JOBS-01: Table columns and sorting

**Status:** PARTIAL PASS

### Columns observed

All 6 columns present (5 named + 1 empty header for Actions):

| Column # | Name | Notes |
|---------|------|-------|
| 1 | Customer | Shows name + email in two lines |
| 2 | Service Type | Badge-style display |
| 3 | Status | StatusDot with relative time for completed |
| 4 | Campaign | Enrollment status / preview |
| 5 | Created | Formatted date |
| 6 | (empty) | Actions column (edit, delete, complete buttons) |

### Sorting test

Column headers are rendered as plain text strings (`flexRender(header.column.columnDef.header)`). While `getSortedRowModel()` and `onSortingChange` are wired in `JobTable`, the column `header` definitions are string literals (e.g. `header: 'Customer'`) not sort-button elements. No `onClick` handler exists on `<th>` elements.

**Result:** Clicking `<th>` elements does NOT trigger a re-sort. Row order is unchanged before and after header clicks.

| Column clicked | Rows reordered? | Notes |
|---------------|----------------|-------|
| Customer (1st click) | NO | Same order: AUDIT_Sarah, AUDIT_Marcus, AUDIT_Patricia, Test Technician, John Smith, Jane Doe, Bob Wilson |
| Customer (2nd click) | NO | Same order as above |

### Data rows

- Initial row count: 4 (before AUDIT_ job creation)
- Expected: 4 (Test Technician HVAC, Bob Wilson electrical, John Smith HVAC, Jane Doe plumbing)
- After AUDIT_ jobs created: 7 rows total

### Bug found

**BUG-01 (Low): Column headers not clickable for sorting**

- The `job-table.tsx` has `getSortedRowModel()` and `onSortingChange: setSorting` wired.
- However, column definitions in `job-columns.tsx` use string literals for `header` (e.g. `header: 'Customer'`) rather than sort button components.
- The `<th>` in `job-table.tsx` renders via `flexRender(header.column.columnDef.header, header.getContext())` — for string headers, this renders plain text without a click handler.
- **Severity:** Low — jobs list is typically short; default order (most-recent first via `getJobs()` SQL `ORDER BY created_at DESC`) is reasonable.
- **Reproduction:** Navigate to /jobs, click any column header, observe row order unchanged.

### Evidence

- `qa-62-jobs-table-initial.png`
- `qa-62-jobs-sorted-customer.png`

---

## JOBS-02: Add Job — create and search modes

**Status:** PASS

### Create mode (AUDIT_Patricia Johnson)

1. Opened Add Job sheet — sheet opened with customer search input and service type select
2. Typed "AUDIT_Patricia Johnson" in customer field
3. "+ Create new customer 'AUDIT_Patricia Johnson'" option appeared: YES
4. Clicked create option — form expanded to show Name (pre-filled), Email, Phone fields
5. Filled email: audit-patricia@example.com
6. Selected service type: HVAC (Radix Select via page-level `[role="option"]`)
7. Campaign selector appeared with "HVAC Follow-up — 2 touches, starts 1d" option
8. Selected status: Completed (toggle button)
9. Added notes: "AUDIT Phase 62 test job - create mode"
10. Submitted form
11. Result: Job created — row appeared in table immediately
12. New row visible in table: YES

### Search mode (existing customer lookup)

1. Opened Add Job sheet
2. Typed "AUDIT_Patricia" in customer field (partial name)
3. Autocomplete showed "AUDIT_Patricia Johnson": YES (visible in dropdown as text)
4. Customer was selectable from dropdown

### DB verification — Patricia's job

```
{
  "id": "40d16e33-249f-4631-b9e4-5a69d03ea9dd",
  "status": "completed",
  "service_type": "hvac",
  "completed_at": "2026-02-28T03:59:05.1+00:00",
  "campaign_override": "15982bf4-5c9d-453b-93a4-8a07b3230968",
  "customers": { "name": "AUDIT_Patricia Johnson", "email": "audit-patricia@example.com" }
}
```

### Evidence

- `qa-62-add-job-create-new-option.png`
- `qa-62-add-job-filled-patricia.png`
- `qa-62-job-created-patricia.png`
- `qa-62-add-job-search-autocomplete.png`

### Bugs found

None.

---

## JOBS-03: Edit Job

**Status:** PASS

### Pre-populated values observed

| Field | Expected | Actual |
|-------|----------|--------|
| Customer | AUDIT_Patricia Johnson | AUDIT_Patricia Johnson (shown as customer selector, not editable in edit sheet) |
| Service Type | HVAC | HVAC (Radix Select showing current value) |
| Campaign | HVAC Follow-up | HVAC Follow-up — 2 touches, starts 1d |
| Status | Completed | Completed (toggle button active) |
| Notes | AUDIT Phase 62 test job - create mode | AUDIT Phase 62 test job - create mode |

### Edit saved

- Changed notes to: "AUDIT Phase 62 - EDITED notes for verification"
- Save submitted: success (dialog closed, no error)
- DB verified: YES — `notes = "AUDIT Phase 62 - EDITED notes for verification"` confirmed in DB

### DB verification

```sql
SELECT j.notes, j.service_type, j.status
FROM jobs j JOIN customers c ON j.customer_id = c.id
WHERE c.name = 'AUDIT_Patricia Johnson'
ORDER BY j.created_at DESC LIMIT 1;
-- Result: notes = "AUDIT Phase 62 - EDITED notes for verification", service_type = "hvac", status = "completed"
```

### Evidence

- `qa-62-edit-job-prepopulated.png`
- `qa-62-edit-job-saved.png`

### Bugs found

None.

---

## JOBS-04: Job detail drawer

**Status:** PASS

### Information displayed

Clicking a table row (first cell) opens the job detail drawer. Drawer content observed:

| Field | Present? | Value |
|-------|----------|-------|
| Customer name | YES | AUDIT_Patricia Johnson |
| Customer email | YES | audit-patricia@example.com |
| Service type | YES | HVAC |
| Status | YES | Completed |
| Campaign | YES | HVAC Follow-up (active enrollment shown) |
| Notes | YES | AUDIT Phase 62 - EDITED notes for verification |
| Created at | YES | Feb 27, 2026 |
| Completed at | YES | Feb 27, 2026 (5 minutes ago) |

Full drawer text observed:
> "Job DetailsView job information and take actionsCustomerAUDIT_Patricia Johnsonaudit-patricia@example.comJob InformationService TypeHVACStatusCompletedCreatedFeb 27, 2026CompletedFeb 27, 2026 (5 minutes ago)CampaignHVAC Follow-upNotesAUDIT Phase 62 - EDITED notes for verificationEdit JobDelete JobClose"

### Evidence

- `qa-62-job-detail-drawer.png`

### Bugs found

None.

---

## JOBS-05: Service type filter

**Status:** PASS

### Configuration

- Business service_types_enabled: [] (empty array)
- Expected behavior: Fallback shows all 8 service types (per `job-filters.tsx` fallback logic)
- Actual behavior: ALL 8 service type pills shown — correct fallback

### Filter pills observed

All 8 service type pills present:
1. HVAC
2. Plumbing
3. Electrical
4. Cleaning
5. Roofing
6. Painting
7. Handyman
8. Other

Total count: 8 (matches expected fallback for empty service_types_enabled)

### Filter scoping test

| Filter applied | Expected rows | Actual rows | Correct? |
|---------------|--------------|-------------|----------|
| HVAC | 2+ (Test Technician + John Smith + AUDIT_ jobs) | 2 (before AUDIT_ creation) / 5 (after) | YES |
| Electrical | 1 (Bob Wilson) | 1 | YES |

### Evidence

- `qa-62-filter-service-hvac.png`

### Bugs found

None. Note: service_types_enabled = [] is tested intentionally — fallback to all 8 types is the correct behavior for unconfigured businesses.

---

## JOBS-06: Status filter

**Status:** PASS

### Status pills observed

3 status filter pills present:
1. Scheduled
2. Completed
3. Do Not Send

### Filter scoping test

| Status | Expected rows | Actual rows | Correct? |
|--------|--------------|-------------|----------|
| Completed | 3+ | 3 (before AUDIT_ creation) | YES |
| Do Not Send | 1 (Bob Wilson) | 1 | YES |
| Scheduled | 0 (before Marcus) / 1 (after Marcus created) | 0 then 1 then 0 (after Mark Complete) | YES |

Filtered empty state confirmed: When "Scheduled" filter applied after Marcus was marked complete, the table showed 0 rows with "No jobs match your filters" empty state.

### Evidence

- `qa-62-filter-status-completed.png`
- `qa-62-filter-status-scheduled-empty.png`

### Bugs found

None.

---

## JOBS-08: Enrollment trigger (DB verified)

**Status:** PASS

### Patricia Johnson enrollment (created via Add Job, status=Completed)

```json
{
  "id": "2f20d977-0c44-41a4-8809-9215192abb0e",
  "status": "active",
  "current_touch": 1,
  "touch_1_scheduled_at": "2026-03-01T03:59:05.511+00:00",
  "touch_1_status": "pending",
  "enrolled_at": "2026-02-28T03:59:05.511+00:00",
  "campaigns": { "name": "HVAC Follow-up" }
}
```

- Enrollment exists: YES
- Status: active
- Campaign: HVAC Follow-up
- Delay hours actual: 24.0 (expected: 24)

### Sarah Chen enrollment (created via Add Job, status=Completed)

```json
{
  "id": "79106062-cc70-44d3-a284-71a256906d9e",
  "status": "active",
  "current_touch": 1,
  "touch_1_scheduled_at": "2026-03-01T04:02:28.252+00:00",
  "touch_1_status": "pending",
  "enrolled_at": "2026-02-28T04:02:28.252+00:00",
  "campaigns": { "name": "HVAC Follow-up" }
}
```

- Enrollment exists: YES
- Status: active
- Campaign: HVAC Follow-up
- Delay hours actual: 24.0

### Marcus Rodriguez enrollment (via Mark Complete, JOBS-08 Part 2)

```json
{
  "id": "36d179bb-9a2e-4fc5-8164-091fb75ff21d",
  "status": "active",
  "current_touch": 1,
  "touch_1_scheduled_at": "2026-03-01T04:05:19.445+00:00",
  "touch_1_status": "pending",
  "enrolled_at": "2026-02-28T04:05:19.445+00:00",
  "campaigns": { "name": "HVAC Follow-up" }
}
```

- Enrollment exists: YES
- Status: active
- Campaign: HVAC Follow-up
- Delay hours actual: 24.0

### Evidence

- DB query results above (verified via Supabase service role client)
- `qa-62-marcus-after-complete.png`

### Bugs found

None.

---

## JOBS-09: Campaign selector

**Status:** PASS

### Options observed when HVAC selected

Campaign selector appeared immediately after selecting HVAC service type in the Add Job sheet. Options observed (from dialog text):

1. **HVAC Follow-up — 2 touches, starts 1d** (recommended — auto-selected by default)
2. **Send one-off review request** (manual send option)
3. **Do not send** (skip enrollment)
4. **+ Create new campaign** (link to create new)

- "HVAC Follow-up" present: YES
- "One-off/Send one-off" option present: YES
- "Do not send" option present: YES

### Auto-select behavior

- Recommended campaign auto-selected: YES (HVAC Follow-up was pre-selected)
- Which campaign was auto-selected: HVAC Follow-up

### Evidence

- `qa-62-campaign-selector-hvac.png`

### Bugs found

None.

---

## JOBS-07: Mark Complete

**Status:** PASS

### Before

- Customer: AUDIT_Marcus Rodriguez
- Status: Scheduled
- Row text: "HVAC | Scheduled | HVAC Follow-up in 1d | Feb 27, 2026 | Complete | Open menu"
- completed_at: NULL (verified in DB)

### After

- Status changed to: Completed
- completed_at: 2026-02-28T04:05:19.062+00:00 (IS NOT NULL)
- Scheduled filter after mark complete: 0 rows (Marcus no longer appears in Scheduled filter)

### DB verification

```json
{
  "id": "be4861dd-8328-4bcb-9b31-8ba8724b7eff",
  "status": "completed",
  "service_type": "hvac",
  "completed_at": "2026-02-28T04:05:19.062+00:00"
}
```

- status = 'completed': YES
- completed_at IS NOT NULL: YES

### Evidence

- `qa-62-marcus-before-complete.png`
- `qa-62-marcus-after-complete.png`

### Bugs found

None.

---

## JOBS-10: Empty state

**Status:** PASS

### Filtered empty state (hasFilters=true)

- Filters applied: Scheduled (status) + Roofing (service type)
- Heading shown: "No jobs match your filters"
- "Clear" button visible: YES (labeled "Clear" not "Clear Filters")
- No JavaScript errors: YES
- Row count with filters: 0

After clicking "Clear": 7 rows returned — all filters removed correctly.

### True empty state (hasFilters=false)

Not directly testable with the audit test account (account has 7 existing jobs). The hasFilters=false branch renders "No jobs yet" heading + "Add Job" CTA button — verified by direct code inspection of `empty-state.tsx`.

### Evidence

- `qa-62-empty-state-filtered.png`

### Bugs found

None.

---

## Responsive & Dark Mode

### Viewport checks

| Viewport | Status | Notes |
|----------|--------|-------|
| Desktop (1440x900) | PASS | Full table rendered, all 7 rows visible, 6 columns |
| Tablet (768x1024) | PASS | Table renders without overflow, "Add Job" button accessible, filters visible |
| Mobile (390x844) | PASS | Content renders with bottom nav, table accessible, "Add Job" button in header |

### Dark mode

- PASS (forced via `document.documentElement.classList.add('dark')`)
- Jobs table background, text, and status elements all respect dark mode tokens
- No color artifacts or unreadable text observed

### Evidence

- `qa-62-jobs-tablet.png`
- `qa-62-jobs-mobile.png`
- `qa-62-jobs-dark-mode.png`

---

## AUDIT_ Test Data Summary (Phase 63 Handoff)

All 3 AUDIT_ jobs created and verified with active campaign enrollments:

| Customer | Job Status | Campaign | Enrollment Status | Touch 1 Scheduled | Delay |
|----------|-----------|----------|-------------------|-------------------|-------|
| AUDIT_Patricia Johnson | completed | HVAC Follow-up | active | 2026-03-01T03:59:05Z | 24.0h |
| AUDIT_Marcus Rodriguez | completed | HVAC Follow-up | active | 2026-03-01T04:05:19Z | 24.0h |
| AUDIT_Sarah Chen | completed | HVAC Follow-up | active | 2026-03-01T04:02:28Z | 24.0h |

All 3 enrollments have:
- `status = 'active'`
- `current_touch = 1`
- `touch_1_status = 'pending'`
- Campaign: "HVAC Follow-up" (2 touches: email 24h, SMS 72h)

---

## Overall Assessment

**9 of 10 requirements PASS. 1 requirement PARTIAL PASS.**

The Jobs page QA audit confirms all core V2 functionality is working correctly. The ONLY finding is BUG-01 (Low): column headers are not implemented as sort buttons despite the sort infrastructure (`getSortedRowModel`, `onSortingChange`) being wired in the table. This is a cosmetic/UX gap — the default ordering (newest-first from server-side `ORDER BY created_at DESC`) is appropriate for job management.

**Critical V2 paths verified:**
- Add Job with inline customer creation (create mode) — PASS
- Campaign auto-enrollment on job completion — PASS with exactly 24h delay
- Mark Complete transition (scheduled → completed) — PASS
- Campaign selector showing relevant options — PASS
- Enrollment trigger verified via DB query (not just UI toast) — PASS

**Phase 63 dependency fully met:**
- 3 AUDIT_ test jobs exist with `active` enrollments in "HVAC Follow-up"
- All jobs have `touch_1_status = 'pending'` (not yet sent)
- Phase 63 (Campaigns) can audit the enrollment list, touch sequence display, and enrollment status immediately

**Readiness for Phase 63:** READY. Three enrolled customers provide sufficient data to test campaign enrollment list, active enrollment count, touch sequence status, and pause/resume behavior.

---

## Bug Register

| ID | Severity | Requirement | Description | Repro |
|----|----------|-------------|-------------|-------|
| BUG-01 | Low | JOBS-01 | Column headers not clickable for sorting despite sort infrastructure wired | Navigate /jobs, click Customer or Status column header, row order unchanged |
