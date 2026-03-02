# Phase 64: History, Analytics, and Feedback — Research

**Researched:** 2026-03-02
**Domain:** QA audit — read-heavy downstream pages (History, Analytics, Feedback)
**Confidence:** HIGH — all findings from direct codebase inspection and DB queries

---

## Summary

Phase 64 is a QA audit of three existing read-heavy pages: History (`/history`), Analytics (`/analytics`), and Feedback (`/feedback`). All three pages were built in earlier phases, overhauled in Phase 41, and polished in Phases 46–51. The implementation is sound and already multi-business–aware (Phase 52–53 refactor). The primary QA focus is verifying that live data appears correctly, filters work as expected, and the feedback resolution workflow persists across page refreshes.

The main nuance to understand is the **status layer gap**: the DB stores raw statuses (`pending`, `sent`, `delivered`, `bounced`, `complained`, `failed`, `opened`) while the `StatusBadge` component normalizes them to a simplified display set (`pending`, `delivered`, `clicked`, `failed`, `reviewed`, `scheduled`). The filter UI in History uses the raw DB values — this is correct and intentional, not a bug.

The test business (`Audit Test HVAC`, id `6ed94b54-6f35-4ede-8dcb-28f562052042`) currently has **zero send_logs** and **zero customer_feedback** rows. The QA plan must include SQL-based setup steps to seed data before UI verification can proceed.

**Primary recommendation:** Seed test data via Supabase SQL before each plan's UI tests. Use the existing AUDIT_ customers (Marcus Rodriguez, Sarah Chen, Patricia Johnson) already present from Phase 62–63.

---

## Standard Stack

This phase uses no new libraries. It audits existing pages using the project's established stack.

### Core (already installed)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@tanstack/react-table` | ^8.21.3 | History table with row selection | Used in HistoryTable |
| `@radix-ui/react-select` | ^2.2.6 | Status filter dropdown | Used in HistoryFilters |
| `@phosphor-icons/react` | ^2.1.10 | All icons | Used throughout |
| `date-fns` | ^4.1.0 | Date preset calculations | `subWeeks`, `subMonths`, `format` |
| `sonner` | ^2.0.7 | Toast notifications on resend | Used in HistoryClient |
| `@supabase/ssr` | latest | DB queries | All three data functions |

### No New Dependencies

This is a QA phase. No new packages are needed.

---

## Architecture Patterns

### How Each Page is Built

#### History (`/history`)

**Server component** (`app/(dashboard)/history/page.tsx`):
- Calls `getActiveBusiness()` → redirects to `/onboarding` if null
- Reads filter params from `searchParams` (query, status, from, to, page)
- Calls `getSendLogs(businessId, options)` and `getBusiness(businessId)` in parallel
- Passes `initialLogs`, `total`, `business`, `templates` to `HistoryClient`

**Client component** (`HistoryClient`):
- URL-based filter state via `useSearchParams` + `replace()`
- `HistoryFilters` component handles search input, Radix Select status filter, date preset chips, custom date inputs
- `HistoryTable` uses TanStack React Table with `enableRowSelection: (row) => RESENDABLE_STATUSES.includes(row.original.status)`
- Inline retry via `bulkResendRequests([id])` (single-ID call)
- Bulk retry via `bulkResendRequests(selectedIds)` (multi-ID)
- Row click opens `RequestDetailDrawer`

**Key data function** (`lib/data/send-logs.ts → getSendLogs`):
```typescript
// Scoped to businessId — no user_id needed (RLS enforces)
.from('send_logs')
.select('*, customers!send_logs_customer_id_fkey!inner(name, email, last_sent_at)', { count: 'exact' })
.eq('business_id', businessId)
.order('created_at', { ascending: false })
// Status filter: .eq('status', options.status)  ← raw DB value
// Date filter: .gte('created_at', from) + .lte('created_at', endOfDay.toISOString())
```

#### Analytics (`/analytics`)

**Server component** (`app/(dashboard)/analytics/page.tsx`):
- Calls `getActiveBusiness()` → redirects if null
- Calls `getServiceTypeAnalytics(business.id)` → RPC call

**RPC function** (`get_service_type_analytics(p_business_id UUID)`):
```sql
SELECT j.service_type, COUNT(sl.id), COUNT(sl.id) FILTER (WHERE sl.status IN ('sent', 'delivered', 'opened')),
       COUNT(sl.id) FILTER (WHERE sl.reviewed_at IS NOT NULL),
       COUNT(DISTINCT cf.id)
FROM jobs j
LEFT JOIN campaign_enrollments ce ON ce.job_id = j.id
LEFT JOIN send_logs sl ON sl.campaign_enrollment_id = ce.id
LEFT JOIN customer_feedback cf ON cf.customer_id = j.customer_id AND cf.business_id = p_business_id
WHERE j.business_id = p_business_id
GROUP BY j.service_type
```

**Note:** Analytics data is tied to `jobs` (grouped by `service_type`), not directly to `send_logs`. Even if there are jobs with no send_logs yet, the service type row will appear with `total_sent=0`. The empty state fires only when `data.byServiceType.length === 0` (no jobs at all for this business).

**Empty state:** `ServiceTypeBreakdown` renders "No analytics data yet" when `data.byServiceType.length === 0`. Uses `useAddJob()` hook — meaning `ServiceTypeBreakdown` is a Client Component and must be wrapped in `AddJobProvider` (which comes from the dashboard layout).

#### Feedback (`/feedback`)

**Server component** (`app/(dashboard)/feedback/page.tsx`):
- Calls `getActiveBusiness()` → redirects if null
- Calls `getFeedbackForBusiness(business.id, { resolved: undefined }, 1, 50)` and `getFeedbackStats(business.id)` in parallel
- Renders stats grid (only when `stats.total > 0`) + `FeedbackList`

**Resolution workflow:**
1. User clicks "Mark Resolved" on `FeedbackCard` → opens `ResolveFeedbackDialog`
2. Dialog submits form to `resolveFeedbackAction(formData)` (server action)
3. Server action validates with `resolveFeedbackSchema`, then `.update({ resolved_at, resolved_by, internal_notes })` on `customer_feedback`
4. Calls `revalidatePath('/feedback')` → triggers server re-render
5. After success, dialog closes and page refreshes with resolved state

**Unresolve workflow:**
1. User clicks "Reopen" on resolved card → calls `unresolveFeedbackAction(feedbackId)`
2. Sets `resolved_at: null, resolved_by: null`
3. Calls `revalidatePath('/feedback')`

**Critical note:** The `FeedbackCard` component is a Client Component (`'use client'`). It calls server actions directly. The page itself is a Server Component. After `revalidatePath`, Next.js will re-render the server page and send fresh data to the client — but `FeedbackCard` uses `isResolved = !!feedback.resolved_at` from the prop it received at render time. The UI state is stale until the full page re-render propagates. This is handled correctly by `revalidatePath('/feedback')`.

---

## Data Scoping (Multi-Business Safety)

All three pages are correctly scoped to the active business:

| Page | Scoping Pattern | Evidence |
|------|-----------------|---------|
| History | `getActiveBusiness()` → explicit `businessId` passed to `getSendLogs(businessId, ...)` | `send-logs.ts:31` `.eq('business_id', businessId)` |
| Analytics | `getActiveBusiness()` → `getServiceTypeAnalytics(business.id)` → RPC with `p_business_id` | `analytics.ts:45` RPC call |
| Feedback | `getActiveBusiness()` → `getFeedbackForBusiness(business.id, ...)` | `feedback.ts:53` `.eq('business_id', businessId)` |

`getActiveBusiness()` itself verifies ownership by querying `businesses WHERE id = activeId AND user_id = auth.uid()` before returning. No trust gap.

---

## Filter Implementation Details

### History Filters (HIST-02, HIST-03)

**Status filter** uses Radix Select with these options mapped to raw DB values:
```
all → (deleted from URL params, no filter applied)
pending → .eq('status', 'pending')
sent → .eq('status', 'sent')
delivered → .eq('status', 'delivered')
bounced → .eq('status', 'bounced')
complained → .eq('status', 'complained')
failed → .eq('status', 'failed')
opened → .eq('status', 'opened')
```

**Important:** The StatusBadge normalizes `sent` and `opened` → displays as "Delivered". So filtering by "Sent" in the dropdown will show rows that visually say "Delivered". This is intentional — the filter is on raw DB value, not display value. QA must verify the filter correctly returns matching rows, not that the badge label matches the filter label.

**Date presets** compute ranges using `date-fns`:
- Today: `format(new Date(), 'yyyy-MM-dd')` for both from and to
- Past Week: `format(subWeeks(new Date(), 1), 'yyyy-MM-dd')`
- Past Month: `format(subMonths(new Date(), 1), 'yyyy-MM-dd')`
- Past 3 Months: `format(subMonths(new Date(), 3), 'yyyy-MM-dd')`

The `dateTo` query appends `23:59:59.999` to include the full end day:
```typescript
const endOfDay = new Date(options.dateTo)
endOfDay.setHours(23, 59, 59, 999)
query = query.lte('created_at', endOfDay.toISOString())
```

### Resend Logic (HIST-04, HIST-05)

`RESENDABLE_STATUSES = ['failed', 'bounced']` — defined in `history-columns.tsx:12`.

- Inline Retry button: appears only when `RESENDABLE_STATUSES.includes(request.status)` and `onResend` prop is provided
- Row checkbox: `enableRowSelection: (row) => RESENDABLE_STATUSES.includes(row.original.status)`
- Header "select all" checkbox: only selects rows matching RESENDABLE_STATUSES
- Non-resendable rows render an empty `<div className="w-4" />` in the checkbox column (no checkbox rendered)

**Gap to note:** `bulk-resend.ts` action also filters `'complained'` as resendable (`['failed', 'bounced', 'complained'].includes(l.status)`), but the UI only allows selecting `failed` and `bounced`. This means `complained` rows cannot be retried via the UI — the action-level guard is defense-in-depth, not a UI feature.

---

## Test Data Setup Requirements

### Current State (DB query verified 2026-03-02)

| Data Type | Count | Notes |
|-----------|-------|-------|
| `send_logs` for Audit Test HVAC | 0 | Must be seeded for HIST-01 through HIST-05 |
| `customer_feedback` | 0 (entire DB) | Must be seeded for FDBK-01 through FDBK-03 |
| Analytics (jobs exist) | 4 enrollments, 0 sends | Service type rows will appear but with 0 counts |

### Available Test Infrastructure

- **Test business:** `Audit Test HVAC` (id: `6ed94b54-6f35-4ede-8dcb-28f562052042`)
- **AUDIT_ customers** (from Phase 62):
  - `AUDIT_Marcus Rodriguez` — customer_id confirmed in enrollments
  - `AUDIT_Sarah Chen` — customer_id confirmed in enrollments
  - `AUDIT_Patricia Johnson` — customer_id confirmed in enrollments
- **Enrollments:** 4 active enrollments with `touch_1_status = pending` (campaign: `15982bf4-5c9d-453b-93a4-8a07b3230968`)

### Required Seed Data for History QA

Need send_logs with varied statuses to test HIST-01 through HIST-05:
- At least 1 row with `status = 'delivered'` (to verify non-resendable)
- At least 1 row with `status = 'failed'` (to verify resendable)
- At least 1 row with `status = 'bounced'` (to verify resendable)
- At least 1 row with `status = 'pending'` (to verify non-resendable)
- Rows with different `created_at` dates to test date preset filters

Direct SQL INSERT into `send_logs` is the most reliable approach (avoids Resend API calls during QA). Must include required FK columns: `business_id`, `customer_id`, `subject`, `status`.

### Required Seed Data for Analytics QA

The `get_service_type_analytics` RPC returns data as long as jobs exist. The test business already has HVAC jobs + enrollments. However, to verify metric numbers match, need send_logs linked to enrollments:
- Insert send_logs with `campaign_enrollment_id` set to one of the 4 active enrollment IDs
- Set `status = 'delivered'` and `reviewed_at` on some to test the reviewed count

For the **empty state** test (ANLYT-03), need a second business with no jobs — or test against a fresh business. The `Audit Test HVAC` business has jobs, so it will never show the empty state. Options:
1. Create a new test business with no jobs and no send data
2. Use an existing business that has no jobs (check `maria business` or `TESTING ADAD`)

### Required Seed Data for Feedback QA

Need `customer_feedback` rows:
- At least 1 unresolved row (to test FDBK-02 resolution workflow)
- At least 1 row for the empty state test (FDBK-03 needs a business with zero feedback)

The `Audit Test HVAC` business has customers and enrollments, making it the natural target. Insert feedback rows using the service role via Supabase MCP.

---

## Known Issues and Documented Limitations

### From Phase 51 Verification (2026-02-27)

| Finding | Status | Remaining Note |
|---------|--------|----------------|
| `isOptedOut = false` hardcoded in `request-detail-drawer.tsx:59` | DEFERRED | TODO comment at line 240; resend always shows if cooldown expired |
| `RESENDABLE_STATUSES` export retained | CORRECT | Used by `history-table.tsx` cross-module import |

### From Phase 63 QA (2026-02-28, CAMP-BUG-01 through CAMP-BUG-03)

These bugs were noted in the campaigns phase and may affect analytics data display but are not in scope for Phase 64 to fix:
- **CAMP-BUG-01:** Empty badge text when enrollments are frozen (UI shows blank instead of "Frozen")
- **CAMP-BUG-02:** No "Frozen" stat card in campaign detail (counts 0 when frozen)
- **CAMP-BUG-03:** Service type mismatch on template preview (system template always shows default service)

### Status Display vs Filter Values

The History filter uses raw DB values (`sent`, `opened`) while `StatusBadge` normalizes these to display values (`Delivered`). This is intentional design — QA should verify the filter returns correct DB rows, not that the label matches.

---

## Common Pitfalls

### Pitfall 1: Analytics Empty State vs Zero-Data State

**What goes wrong:** Confusing "no jobs" (empty state) with "jobs but no sends" (shows rows with zero counts).

**Root cause:** `get_service_type_analytics` returns rows for every `service_type` that has at least one job, even if `total_sent = 0`. The empty state (`data.byServiceType.length === 0`) only fires when there are ZERO jobs for the business.

**How to avoid:** For ANLYT-01 (metrics match DB counts), the test business has 4 HVAC jobs → the HVAC row will appear. For ANLYT-03 (empty state), must use a business with zero jobs, not just zero sends.

### Pitfall 2: Feedback State After Resolution

**What goes wrong:** `FeedbackCard` shows stale state before `revalidatePath` propagates.

**Root cause:** `FeedbackCard` is a Client Component using prop-derived state (`isResolved = !!feedback.resolved_at`). After `resolveFeedbackAction` succeeds, the dialog closes but the card still renders as "unresolved" until the Next.js server re-render updates the page's props.

**How to avoid:** The test for FDBK-02 must reload/navigate to `/feedback` and verify the resolved state persists. Don't check the same browser session's immediate render as the test for persistence — test persistence by reloading the page.

### Pitfall 3: Date Preset State Reset on Navigation

**What goes wrong:** The `activePreset` state in `HistoryFilters` is `useState` (ephemeral). Navigating away and back, or using browser back/forward, resets the active preset chip highlight — even though the URL params still have the date filter applied.

**Root cause:** `activePreset` is local state, not derived from URL params. This is a known behavior (Phase 50 audit noted it, Phase 51 deferred fixing it). The filter still works correctly (dates are in the URL), but the chip won't appear highlighted after a navigation.

**How to avoid:** For HIST-03, verify the filter returns correct rows — don't expect the chip to be visually highlighted after page navigation. Test the chip click within a single page session.

### Pitfall 4: Bulk Resend Requires Selection of RESENDABLE_STATUSES Rows

**What goes wrong:** Trying to check the select-all checkbox and expecting all rows to be selected.

**Root cause:** `enableRowSelection: (row) => RESENDABLE_STATUSES.includes(row.original.status)` — only `failed` and `bounced` rows can be selected. The header "select all" checkbox only selects eligible rows.

**How to avoid:** For HIST-05, use test data that includes a mix of `delivered` and `failed` rows. Verify that `delivered` rows have no checkbox rendered (just an empty div), and that clicking the header checkbox only selects the `failed`/`bounced` rows.

---

## Code Examples

### Verified: How getSendLogs scopes by businessId

```typescript
// Source: C:\AvisLoop\lib\data\send-logs.ts
let query = supabase
  .from('send_logs')
  .select('*, customers!send_logs_customer_id_fkey!inner(name, email, last_sent_at)', { count: 'exact' })
  .eq('business_id', businessId)   // ← explicit businessId from getActiveBusiness()
  .order('created_at', { ascending: false })
```

### Verified: How row selection is restricted to resendable rows

```typescript
// Source: C:\AvisLoop\components\history\history-table.tsx
enableRowSelection: (row) => RESENDABLE_STATUSES.includes(row.original.status),
// RESENDABLE_STATUSES = ['failed', 'bounced']
```

### Verified: How resolveFeedbackAction persists the resolved state

```typescript
// Source: C:\AvisLoop\lib\actions\feedback.ts
const { error } = await supabase
  .from('customer_feedback')
  .update({
    resolved_at: new Date().toISOString(),
    resolved_by: user.id,
    internal_notes: validated.internal_notes || null,
  })
  .eq('id', validated.id)
  // RLS on customer_feedback ensures user owns the feedback's business

revalidatePath('/feedback')
return { success: true }
```

### Verified: Analytics RPC join structure

```sql
-- Source: supabase/migrations/20260206_add_service_type_analytics_rpc.sql
-- Note: analytics are tied to jobs table (grouped by service_type)
-- Enrollments with no send_logs will still produce a row with total_sent=0
SELECT j.service_type, COUNT(sl.id) AS total_sent,
       COUNT(sl.id) FILTER (WHERE sl.status IN ('sent', 'delivered', 'opened')) AS delivered,
       COUNT(sl.id) FILTER (WHERE sl.reviewed_at IS NOT NULL) AS reviewed,
       COUNT(DISTINCT cf.id) AS feedback_count
FROM jobs j
LEFT JOIN campaign_enrollments ce ON ce.job_id = j.id
LEFT JOIN send_logs sl ON sl.campaign_enrollment_id = ce.id
LEFT JOIN customer_feedback cf ON cf.customer_id = j.customer_id AND cf.business_id = p_business_id
WHERE j.business_id = p_business_id
GROUP BY j.service_type
```

---

## Plan Structure Recommendation

### 64-01: History QA Plan

**Requirements:** HIST-01 through HIST-05

**Setup step (mandatory):** INSERT send_logs via Supabase MCP with:
- 2 rows with `status = 'delivered'`
- 2 rows with `status = 'failed'`
- 1 row with `status = 'bounced'`
- 1 row with `status = 'pending'`
- Vary `created_at` across different days for date preset testing

**Test sequence:**
1. Load `/history` — verify rows appear with correct StatusBadge display
2. Filter by "Failed" status — verify only failed rows visible
3. Apply "Today" date preset — verify correct row subset
4. Apply "Past Week" preset — verify wider subset
5. Verify "Retry" button on failed/bounced rows, absent on delivered/pending
6. Verify checkbox absent on delivered/pending rows
7. Select failed+bounced rows via header checkbox — verify only those rows selected
8. Execute bulk retry — verify toast + row count update

### 64-02: Analytics QA Plan

**Requirements:** ANLYT-01, ANLYT-02, ANLYT-03

**Setup step:** INSERT send_logs linked to existing enrollments (`campaign_enrollment_id`) for ANLYT-01/02. For ANLYT-03, use a fresh business or verify against a business with no jobs.

**Test sequence:**
1. Load `/analytics` for test business — verify HVAC row appears in service type table
2. Verify column values match DB: Sent, Delivered, Reviews, Feedback counts
3. Note: "Overall Response Rate" and "Overall Review Rate" summary cards
4. Switch active business to one with no jobs — verify empty state appears
5. Verify empty state has "Add your first job" button

### 64-03: Feedback QA Plan

**Requirements:** FDBK-01 through FDBK-03

**Setup step:** INSERT customer_feedback rows via Supabase MCP for the test business.

**Test sequence:**
1. Load `/feedback` — verify feedback items listed with star ratings visible
2. Verify stats bar (Total, Unresolved, Resolved, Avg Rating) appears
3. Click "Mark Resolved" on one item — fill notes, submit
4. Reload `/feedback` — verify item shows as resolved with notes
5. Click "Reopen" on resolved item — verify it returns to unresolved
6. Reload — verify unresolved state persists
7. Switch to business with no feedback — verify empty state renders

---

## State of the Art

These pages are fully built and recently audited (Phase 51 complete 2026-02-27). No architectural debt remains from prior audits. The patterns used are current Next.js App Router patterns (Server Components with explicit businessId, URL-based filter state, server actions for mutations).

---

## Open Questions

1. **Analytics empty state business** — Which business should be used for ANLYT-03? Options:
   - Create a new business during the QA session (ANLYT-03 setup step)
   - Use `maria business` or `TESTING ADAD` (confirmed no jobs by checking DB)
   - Recommendation: Check existing businesses for zero-jobs state before creating a new one. `maria business` and `TESTING ADAD` are both recent with no confirmed jobs.

2. **Date filter timezone** — The `from`/`to` params are passed as `yyyy-MM-dd` strings (no timezone). `getSendLogs` uses `new Date(options.dateTo)` which interprets as local time. If the test environment timezone differs from the DB timezone, edge-case rows near midnight may not appear in the "Today" filter. This is a known date-fns ambiguity but unlikely to cause test failures in practice.
   - What we know: `date-fns format(new Date(), 'yyyy-MM-dd')` uses local time
   - What's unclear: Whether Supabase returns `created_at` in UTC or local time when compared
   - Recommendation: Use rows with `created_at` well within the day (not near midnight) to avoid this edge case.

3. **`isOptedOut = false` hardcode in drawer** — The resend-ability check in `RequestDetailDrawer` always shows the resend section if cooldown is clear, even for opted-out customers. This was documented as a TODO in Phase 51. Should Phase 64 verify this limitation is documented (not a bug to fix)? Recommendation: Note it in the QA findings as a known limitation, not a failure.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `C:\AvisLoop\app\(dashboard)\history\page.tsx` — Server component, filter param handling, getActiveBusiness usage
- `C:\AvisLoop\app\(dashboard)\analytics\page.tsx` — Analytics page, RPC call
- `C:\AvisLoop\app\(dashboard)\feedback\page.tsx` — Feedback page, server actions
- `C:\AvisLoop\components\history\history-client.tsx` — Client orchestration, resend handlers
- `C:\AvisLoop\components\history\history-filters.tsx` — Status filter, date preset chips, URL state management
- `C:\AvisLoop\components\history\history-columns.tsx` — RESENDABLE_STATUSES, row selection, Retry button logic
- `C:\AvisLoop\components\history\history-table.tsx` — TanStack table, enableRowSelection
- `C:\AvisLoop\components\history\status-badge.tsx` — Status normalization (raw DB → display)
- `C:\AvisLoop\components\dashboard\analytics-service-breakdown.tsx` — ServiceTypeBreakdown, empty state
- `C:\AvisLoop\components\feedback\feedback-list.tsx` — FeedbackList, empty state
- `C:\AvisLoop\components\feedback\feedback-card.tsx` — FeedbackCard, resolve/unresolve UI
- `C:\AvisLoop\components\feedback\resolve-feedback-dialog.tsx` — ResolveFeedbackDialog, form action
- `C:\AvisLoop\lib\data\send-logs.ts` — getSendLogs business scoping, date range handling
- `C:\AvisLoop\lib\data\analytics.ts` — getServiceTypeAnalytics, RPC call, emptyAnalytics()
- `C:\AvisLoop\lib\data\feedback.ts` — getFeedbackForBusiness, getFeedbackStats, resolveFeedback, unresolveFeedback
- `C:\AvisLoop\lib\data\active-business.ts` — getActiveBusiness, cookie-based multi-business resolver
- `C:\AvisLoop\lib\actions\feedback.ts` — resolveFeedbackAction, unresolveFeedbackAction, revalidatePath
- `C:\AvisLoop\lib\actions\bulk-resend.ts` — bulkResendRequests (also handles 'complained' at action level)
- `C:\AvisLoop\supabase\migrations\20260206_add_service_type_analytics_rpc.sql` — RPC function SQL
- `C:\AvisLoop\supabase\migrations\00005_create_send_logs.sql` — send_logs status constraint
- `C:\AvisLoop\.planning\phases\51-audit-remediation\51-VERIFICATION.md` — Phase 51 findings, deferred items
- `C:\AvisLoop\docs\qa-v3.1\63-campaigns.md` — Prior QA session, test account/business IDs

### DB Queries (HIGH confidence — live Supabase data)

- `send_logs` table: 0 rows for Audit Test HVAC, 8 rows total (5 `sent`, 3 `failed`)
- `customer_feedback` table: 0 rows in entire DB
- `campaign_enrollments`: 4 active enrollments for Audit Test HVAC (all `touch_1_status = pending`)
- `businesses` table: Audit Test HVAC confirmed at id `6ed94b54-6f35-4ede-8dcb-28f562052042`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — direct file inspection, no external dependencies involved
- Architecture patterns: HIGH — read from source files, confirmed with migrations
- Pitfalls: HIGH — identified from prior phase audits (Phase 50/51 findings) and code analysis
- Test data setup: HIGH — confirmed by live DB queries

**Research date:** 2026-03-02
**Valid until:** Until next structural change to history/analytics/feedback pages
