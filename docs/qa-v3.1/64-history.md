# Phase 64 QA — History Page

**Date:** 2026-03-02
**Tester:** Claude (automated via Playwright + Supabase REST API)
**Test account:** audit-test@avisloop.com
**Business:** Audit Test HVAC (id: 6ed94b54-6f35-4ede-8dcb-28f562052042)
**App URL:** http://localhost:3000/history

---

## Summary

| ID | Requirement | Verdict | Notes |
|----|-------------|---------|-------|
| HIST-01 | History page displays send logs with correct status badges | PASS | 10 rows displayed, all statuses normalized correctly |
| HIST-02 | Radix Select status filter correctly filters rows | PASS | Failed=2, Delivered=3, Bounced=1, All=10 |
| HIST-03 | Date preset chips filter rows by date range | FAIL (Bug) | Timezone bug in `getSendLogs` — `setHours` uses local time, not UTC |
| HIST-04 | Retry button appears ONLY on failed/bounced rows | PASS | 3 Retry buttons (2 failed + 1 bounced), none on others |
| HIST-05 | Bulk select restricts to failed/bounced rows only | PASS | 3 checkboxes in tbody, "3 messages selected" + Retry Selected button |

**Overall: 4/5 PASS, 1 FAIL (HIST-03 — timezone bug)**

---

## DB Seeding Verification

### Seed Operation

10 rows inserted via Supabase REST API with service role key before testing.

### Row Count

```
SELECT COUNT(*) FROM send_logs WHERE business_id = '6ed94b54-6f35-4ede-8dcb-28f562052042';
```

**Result: 10** (confirmed via REST API Content-Range header: `0-0/10`)

### Status Distribution

| Status | Count | Expected |
|--------|-------|----------|
| delivered | 3 | 3 (2h ago, 5d ago, 60d ago) |
| failed | 2 | 2 (3h ago, 35d ago) |
| bounced | 1 | 1 (4h ago) |
| pending | 1 | 1 (1h ago) |
| sent | 1 | 1 (3d ago) |
| opened | 1 | 1 (14d ago) |
| complained | 1 | 1 (65d ago) |
| **Total** | **10** | **10** |

### Date Distribution (UTC timestamps)

| Status | created_at (UTC) | Date Range |
|--------|-------------------|------------|
| pending | 2026-03-02T22:55 | Today |
| delivered | 2026-03-02T21:55 | Today |
| failed | 2026-03-02T20:55 | Today |
| bounced | 2026-03-02T19:55 | Today |
| sent | 2026-02-27T23:55 | 3 days ago |
| delivered | 2026-02-25T23:55 | 5 days ago |
| opened | 2026-02-16T23:55 | 14 days ago (2 weeks) |
| failed | 2026-01-26T23:55 | 35 days ago |
| delivered | 2026-01-01T23:55 | 60 days ago |
| complained | 2025-12-27T23:55 | 65 days ago |

---

## HIST-01: History Page Displays Send Logs with Correct Status Badges

**Requirement:** The History page at /history displays all 10 seeded send logs. Status badges use the StatusDot component with correct color + label normalization.

**Test procedure:**
1. Navigated to http://localhost:3000/history
2. Verified page header, row count, table columns, and individual status badge labels

**Evidence:**

Screenshot: `qa-64-history-full-desktop.png`

**Page header:** "Send History" — PASS
**Total count:** "Track delivery status of your sent messages · 10 total" — PASS
**Table headers:** Recipient, Subject, Status, Sent — PASS (confirmed via `thead` inspection)
**Row count:** 10 rows rendered in tbody — PASS

**Status normalization verification:**

| Raw DB Status | Display Label | Color | Correct? |
|---------------|--------------|-------|----------|
| delivered | Delivered | Green dot | PASS |
| failed | Failed | Red dot | PASS |
| bounced | Failed | Red dot | PASS (normalized) |
| pending | Pending | Yellow dot | PASS |
| sent | Delivered | Green dot | PASS (normalized) |
| opened | Delivered | Green dot | PASS (normalized) |
| complained | Failed | Red dot | PASS (normalized) |

**Badge counts (from page scan):** Delivered=5, Failed=4, Pending=1

Note: The `StatusBadge` component normalizes raw DB statuses as follows (by design):
- `sent`, `opened`, `completed` → "Delivered" (green)
- `bounced`, `complained` → "Failed" (red)
- `pending` → "Pending" (yellow)
- `delivered` → "Delivered" (green)
- `failed` → "Failed" (red)

This normalization is correct behavior. The filter UI (`HistoryFilters`) uses RAW DB status values, while the display uses normalized labels.

**Verdict: PASS**

---

## HIST-02: Radix Select Status Filter

**Requirement:** Status filter uses Radix Select with raw DB status values. Selecting "Failed" shows only `status='failed'` rows (not bounced).

**Test procedure:**
1. Confirmed default state: "All statuses" showing 10 rows
2. Selected "Failed" → counted rows
3. Selected "Delivered" → counted rows
4. Selected "Bounced" → counted rows
5. Reset to "All statuses" → confirmed return to 10 rows

**Evidence:**

| Filter Value | Expected Rows | Actual Rows | Verdict |
|-------------|---------------|-------------|---------|
| All statuses | 10 | 10 | PASS |
| Failed | 2 | 2 | PASS |
| Delivered | 3 | 3 | PASS |
| Bounced | 1 | 1 | PASS |

Screenshots: `qa-64-history-filter-failed.png`, `qa-64-history-filter-delivered.png`

**Key implementation note:** The "Failed" filter value maps directly to DB `status='failed'` (2 rows), NOT to the normalized display label "Failed" which includes bounced+complained. This is correct behavior — filter uses raw DB values, display uses normalized labels.

**Verdict: PASS**

---

## HIST-03: Date Preset Chips

**Requirement:** Date preset chips (Today, Past Week, Past Month, Past 3 Months) correctly filter rows by date range.

**Test procedure:**
1. Clicked "Today" chip → observed URL params and row count
2. Clicked "Past Week" chip → observed row count
3. Navigated directly to URL with `from=2025-12-02&to=2026-03-02` → observed row count

**Evidence:**

Screenshot: `qa-64-history-date-preset.png` (shows Today filter active with 0 rows)

### Bug Found: Timezone-Sensitive Date Filter

**Root cause:** `getSendLogs` in `lib/data/send-logs.ts` (lines 56-60) computes `endOfDay` using local machine time:

```typescript
const endOfDay = new Date(options.dateTo)  // Parses as UTC midnight
endOfDay.setHours(23, 59, 59, 999)         // Sets LOCAL hours, not UTC hours
query = query.lte('created_at', endOfDay.toISOString())
```

**Machine timezone:** UTC-6 (getTimezoneOffset = 360 minutes)

**Result for `to=2026-03-02`:**
- `new Date('2026-03-02')` = `2026-03-02T00:00:00Z` (UTC midnight)
- `.setHours(23, 59, 59, 999)` → sets local time 23:59 in UTC-6 = `2026-03-03T05:59:59Z`

Wait — let me correct this: timezone offset of 360 minutes means local time = UTC - 6h. So:
- Local 23:59 in UTC-6 = UTC 05:59 next day? No.
- UTC-6 means local time is 6 hours BEHIND UTC.
- So local 23:59 = UTC 23:59 + 6h = UTC 05:59 next day? No.
- UTC-6: local = UTC - 6h. So UTC = local + 6h. Local 23:59 = UTC 29:59 = next day 05:59 UTC.

Actually verified by running `new Date('2026-03-02').setHours(23,59,59,999); endOfDay.toISOString()` = `2026-03-02T05:59:59.999Z`.

So for this machine (UTC+6 offset of -360, i.e. getTimezoneOffset returns +360 but actual UTC offset is...):

Let me document what was measured: `getTimezoneOffset() = 360` and `endOfDay.toISOString() = 2026-03-02T05:59:59.999Z`.

This means the machine is UTC-6, and the computed end-of-day cutoff is `2026-03-02T05:59:59Z`. But the seeded "today" rows have `created_at` values of `2026-03-02T19-22 UTC` — all AFTER the cutoff. Therefore, the "Today" filter returns 0 rows instead of the expected 4.

**Observed vs Expected:**

| Preset | URL Params | Expected Rows | Actual Rows | Verdict |
|--------|-----------|---------------|-------------|---------|
| Today | `from=2026-03-02&to=2026-03-02` | 4 | 0 | FAIL |
| Past Week | `from=2026-02-23&to=2026-03-02` | 6 | 2 | FAIL |
| Past 3 Months | `from=2025-12-02&to=2026-03-02` | 10 | 6 | FAIL |

**Root cause explanation:** All "to" dates are affected. The `endOfDay` cutoff is computed in local timezone, resulting in an ISO timestamp earlier than midnight UTC. Any rows with `created_at` between `endOfDay.toISOString()` and the actual end of the UTC day are excluded.

**Fix:** Use UTC-aware end-of-day calculation:
```typescript
// Current (buggy):
const endOfDay = new Date(options.dateTo)
endOfDay.setHours(23, 59, 59, 999)

// Fixed:
const endOfDay = new Date(options.dateTo + 'T23:59:59.999Z')  // Explicit UTC
```

**Bug ID:** BUG-HIST-01

**Verdict: FAIL**

---

## HIST-04: Retry Button Visibility (failed/bounced only)

**Requirement:** Retry button (ArrowClockwise icon + "Retry" text) appears ONLY on rows where `status='failed'` or `status='bounced'`. NOT on delivered, sent, opened, pending, or complained rows.

**Test procedure:**
1. Confirmed all filters cleared (All statuses, no date filter)
2. Counted Retry buttons visible in table rows
3. Verified total rows = 10

**Evidence:**

Screenshot: `qa-64-history-retry-buttons.png`

| Row | Subject | Status | Has Retry? | Expected |
|-----|---------|--------|------------|----------|
| 1 | Quick follow-up | pending | No | Correct |
| 2 | How was your HVAC service? | delivered | No | Correct |
| 3 | We appreciate your feedback | failed | Yes | Correct |
| 4 | Your feedback matters | bounced (→Failed) | Yes | Correct |
| 5 | Thank you for choosing us | sent (→Delivered) | No | Correct |
| 6 | How did we do? | delivered | No | Correct |
| 7 | Your HVAC review request | opened (→Delivered) | No | Correct |
| 8 | Review your recent service | failed | Yes | Correct |
| 9 | Share your experience | delivered | No | Correct |
| 10 | We value your opinion | complained (→Failed) | No | Correct |

**Retry button count:** 3 (rows 3, 4, 8 = 2 failed + 1 bounced)

Note: Row 10 (`complained` status) shows "Failed" badge but does NOT have a Retry button. This is correct — the `RESENDABLE_STATUSES` array is `['failed', 'bounced']` only. The `complained` raw status is excluded from resend by design (spam complaint — should not retry).

**Verdict: PASS**

---

## HIST-05: Bulk Select Restriction

**Requirement:** Checkboxes appear ONLY on failed/bounced rows. Header "Select All" selects ONLY failed/bounced rows. Bulk "Retry Selected" button appears with correct count.

**Test procedure:**
1. Verified checkboxes in tbody (left column)
2. Clicked "Select all failed" header checkbox
3. Verified selected count text
4. Verified "Retry Selected" button appears
5. Deselected and verified bulk action bar disappears

**Evidence:**

Screenshot: `qa-64-history-bulk-select.png`

**Checkbox count in tbody:** 3 (matching `RESENDABLE_STATUSES = ['failed', 'bounced']`)
- Row 3: `status='failed'` — checkbox present
- Row 4: `status='bounced'` — checkbox present
- Row 8: `status='failed'` — checkbox present
- All other rows (pending, delivered, sent, opened, complained) — no checkbox (spacer div rendered instead)

**Header checkbox behavior:**
- aria-label: "Select all failed"
- Clicking selects ONLY the 3 failed/bounced rows
- Text appears: "3 messages selected"
- "Retry Selected" button appears in top bar

**Selected count:** "3 messages selected" — matches resendable row count exactly

**After deselect:** Bulk action bar disappears

**Key implementation detail:** The header checkbox uses `table.getFilteredRowModel().rows.filter(r => RESENDABLE_STATUSES.includes(r.original.status)).length` to determine the "all selected" state — ensuring it never counts non-resendable rows.

**Verdict: PASS**

---

## Bugs Found

### BUG-HIST-01: Timezone Bug in Date Range Filter (Medium Severity)

**File:** `lib/data/send-logs.ts`, lines 56-60

**Description:** The `dateTo` end-of-day computation uses `setHours(23, 59, 59, 999)` which sets local machine time. When deployed on a machine in a non-UTC timezone, the resulting ISO timestamp may exclude rows from the "current day" in UTC.

**Affected functionality:** All date preset chips (Today, Past Week, Past Month, Past 3 Months) and custom date range inputs when `to` date is specified.

**Root cause:**
```typescript
const endOfDay = new Date(options.dateTo)  // Parses date string as UTC midnight
endOfDay.setHours(23, 59, 59, 999)         // Sets LOCAL hours (timezone-dependent)
query = query.lte('created_at', endOfDay.toISOString())
```

**On machine with timezone offset 360 (UTC-6):**
- `endOfDay` for `2026-03-02` = `2026-03-02T05:59:59.999Z`
- Rows at `2026-03-02T19-22 UTC` are EXCLUDED (after 05:59Z cutoff)
- "Today" returns 0 instead of 4 rows

**Fix:**
```typescript
// Replace setHours with explicit UTC end-of-day:
const endOfDay = new Date(options.dateTo + 'T23:59:59.999Z')
query = query.lte('created_at', endOfDay.toISOString())
```

**Severity:** Medium — affects date filtering for all history views; workaround is manually entering UTC date range in custom date inputs.

**Impact:** HIST-03 FAIL. Does not affect status filtering or display (HIST-01, HIST-02, HIST-04, HIST-05).

---

## Implementation Notes (By Design — Not Bugs)

### Status Display Normalization

The `StatusBadge` component maps raw DB statuses to display labels. This is intentional:
- `bounced` → "Failed" display (but keeps raw `bounced` value for filter)
- `complained` → "Failed" display (but NOT in RESENDABLE_STATUSES)
- `sent` → "Delivered" display
- `opened` → "Delivered" display

This creates a slight UX quirk: a user filters by "Failed" and sees 2 rows, but visually the table shows 4 "Failed" badges (including bounced and complained). This is expected because:
1. Filter uses raw status values for precise control
2. Display normalizes to user-friendly labels
3. Both behaviors are documented and intentional

### Complained Status Not Resendable (By Design)

Rows with `status='complained'` show a "Failed" badge (normalized) but do NOT have a Retry button. This is correct because the `RESENDABLE_STATUSES = ['failed', 'bounced']` explicitly excludes `complained`. Retrying a message to a customer who filed a spam complaint would be inappropriate and violates email deliverability best practices.

### Bounce Display as "Failed" (By Design)

`status='bounced'` displays as "Failed" in the badge. This is intentional — from the user's perspective, both failed and bounced messages didn't reach the recipient and should be retried. The distinction (hard bounce vs soft bounce vs authentication failure) is a technical detail handled at the provider level.

---

## Screenshots Reference

| Filename | Contents |
|----------|----------|
| `qa-64-history-full-desktop.png` | Full history page at 1440x900 — all 10 rows visible, status badges shown |
| `qa-64-history-filter-failed.png` | Status filter set to "Failed" — 2 rows visible |
| `qa-64-history-filter-delivered.png` | Status filter set to "Delivered" — 3 rows visible |
| `qa-64-history-date-preset.png` | "Today" chip active — 0 rows (timezone bug) |
| `qa-64-history-retry-buttons.png` | All 10 rows visible — 3 Retry buttons on failed/bounced rows |
| `qa-64-history-bulk-select.png` | Header checkbox clicked — 3 rows selected, "3 messages selected" + "Retry Selected" visible |

---

## Test Environment

- **Browser:** Chromium (headless) via Playwright
- **Viewport:** 1440x900 (desktop)
- **Timezone:** UTC-6 (timezone offset = 360 minutes) — relevant to BUG-HIST-01
- **Data seeded:** 10 send_log rows via Supabase REST API (service role)
- **Dev server:** Running on http://localhost:3000

---

## Conclusion

The History page core functionality is solid: send logs display correctly with 10 rows, status normalization works as expected, the status filter accurately filters by raw DB values, retry buttons correctly restrict to failed/bounced rows, and bulk select restricts selection to resendable rows only.

One medium-severity bug was found: the date range filter has a timezone sensitivity issue where the end-of-day computation uses local machine time instead of UTC. This causes "Today", "Past Week", and other date-bounded filters to exclude rows from the current UTC day when the server machine is in a non-UTC timezone.

Fix is simple: change `endOfDay.setHours(23,59,59,999)` to use an explicit UTC timestamp `new Date(dateTo + 'T23:59:59.999Z')`.
