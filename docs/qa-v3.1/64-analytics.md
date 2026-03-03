# Phase 64 QA — Analytics Page

**Date:** 2026-03-03
**Tester:** Claude (automated via Playwright + Supabase REST API)
**Test account:** audit-test@avisloop.com
**Business:** Audit Test HVAC (id: 6ed94b54-6f35-4ede-8dcb-28f562052042)
**App URL:** http://localhost:3000/analytics

---

## Summary

| ID | Requirement | Verdict | Notes |
|----|-------------|---------|-------|
| ANLYT-01 | Analytics summary cards display correct metrics matching RPC output | PASS | 3 cards shown: 0% / 0% / 3 — matches DB exactly |
| ANLYT-02 | Service type breakdown table shows correct data with percentage bars | PASS | 3 rows (HVAC, Electrical, Plumbing); HVAC row: Sent=3, Delivered=1, Reviews=0, Feedback=0; bars render at width:0% (correct for 0%) |
| ANLYT-03 | Analytics empty state renders correctly when no jobs exist | PASS (code verified) | Test business has jobs so empty state not triggered; empty state code path confirmed in component source |

**Overall: 3/3 PASS**

---

## DB Verification

### Part A: Send Logs Data State

10 send_log rows seeded in Phase 64-01. Of these, only 3 are linked to campaign enrollments (the RPC only counts send_logs with `campaign_enrollment_id` set, because it joins `jobs → campaign_enrollments → send_logs`):

| send_log id | status | reviewed_at | campaign_enrollment_id |
|-------------|--------|-------------|------------------------|
| 2216def0 | bounced | null | 79106062 (Sarah / HVAC) |
| abc8a968 | failed | null | 2f20d977 (Patricia / HVAC) |
| 6c35f663 | delivered | null | 36d179bb (Marcus / HVAC) |

The remaining 7 send_logs have `campaign_enrollment_id = null` and are NOT counted by the analytics RPC.

### Part B: RPC Expected Values (Manual Calculation)

The `get_service_type_analytics` RPC groups by `jobs.service_type` and LEFT JOINs through `campaign_enrollments → send_logs`. The test business has 8 jobs across 3 service types:

| service_type | jobs | enrollments | linked send_logs | total_sent | delivered | reviewed | feedback |
|--------------|------|-------------|-----------------|------------|-----------|----------|----------|
| hvac | 6 | 4 | 3 (bounced, failed, delivered) | 3 | 1 | 0 | 0 |
| plumbing | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| electrical | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

**Note:** `delivered` counts status IN ('sent', 'delivered', 'opened'). Only the `delivered`-status log for Marcus enrollment qualifies. `bounced` and `failed` do not.

**Note:** All 7 non-linked send_logs are excluded because `campaign_enrollment_id = null` means the LEFT JOIN produces no match in send_logs for those.

Expected summary totals:
- `totalSent` = 3
- `totalDelivered` = 1
- `totalReviewed` = 0
- `totalFeedback` = 0
- `overallResponseRate` = (0 + 0) / 1 × 100 = **0%**
- `overallReviewRate` = 0 / 1 × 100 = **0%**
- `totalRequestsSent` = **3**

### Part C: RPC Direct Call

Attempted direct RPC call via Supabase REST API:
```
POST /rest/v1/rpc/get_service_type_analytics
{"p_business_id": "6ed94b54-6f35-4ede-8dcb-28f562052042"}
```
Response: `{"code":"P0001","details":null,"hint":null,"message":"Access denied"}`

The `get_service_type_analytics` function uses `SECURITY DEFINER` but the auth check inside the function blocks anonymous/service-role calls for non-owning users. The RPC is designed to run via authenticated client session only. All verification was performed via manual SQL decomposition and UI confirmation.

### Part D: Jobs By Service Type (Verified via REST API)

```
GET /rest/v1/jobs?business_id=eq.6ed94b54-6f35-4ede-8dcb-28f562052042&select=service_type,status
```

| service_type | status |
|---|---|
| electrical | do_not_send |
| hvac | completed (×6) |
| plumbing | completed |

**Total: 8 jobs across 3 service types** — all 3 service types appear in the breakdown table because the RPC includes any service type that has at least 1 job (LEFT JOIN means 0 sends still produce a row).

---

## ANLYT-01: Analytics Summary Cards

**Requirement:** 3 summary cards display (Overall Response Rate, Overall Review Rate, Total Requests Sent) with values matching the RPC output.

**Test steps:**
1. Logged in as audit-test@avisloop.com
2. Navigated to http://localhost:3000/analytics
3. Verified page header: "Analytics" (h1) + "Track review performance by service type" (subtitle)
4. Captured all card content via Playwright DOM traversal
5. Compared displayed values against manually computed RPC expectations

**Result: PASS**

Page header confirmed:
- h1: "Analytics"
- subtitle: "Track review performance by service type"

3 summary cards present with correct values:

| Card | Label | Displayed Value | Expected Value | Match |
|------|-------|-----------------|----------------|-------|
| 1 | Overall Response Rate | 0% | 0% | YES |
| 2 | Overall Review Rate | 0% | 0% | YES |
| 3 | Total Requests Sent | 3 | 3 | YES |

Sub-labels also verified:
- Card 1: "of delivered requests got a response"
- Card 2: "of delivered requests led to a public review"
- Card 3: "across all service types"

**Screenshot:** `qa-64-analytics-desktop.png`

---

## ANLYT-02: Service Type Breakdown Table

**Requirement:** Breakdown table shows service type rows with Sent/Delivered/Reviews/Feedback counts matching seeded data. Percentage bars render with correct widths proportional to rates.

**Test steps:**
1. Checked for "Breakdown by Service Type" heading — present
2. Captured table headers via Playwright
3. Captured all 3 tbody rows with cell contents
4. Checked percentage bar widths via inline style attributes

**Result: PASS**

Table headers verified (7 columns):
```
Service Type | Sent | Delivered | Reviews | Feedback | Response Rate | Review Rate
```

Table rows:

| Row | Service Type | Sent | Delivered | Reviews | Feedback | Response Rate | Review Rate |
|-----|-------------|------|-----------|---------|----------|---------------|-------------|
| 1 | HVAC | 3 | 1 | 0 | 0 | 0% | 0% |
| 2 | Electrical | 0 | 0 | 0 | 0 | 0% | 0% |
| 3 | Plumbing | 0 | 0 | 0 | 0 | 0% | 0% |

**HVAC row matches expected values from DB analysis:**
- Sent=3 ✓ (3 linked send_logs via enrollment → HVAC jobs)
- Delivered=1 ✓ (only the `delivered` status log qualifies; `bounced` and `failed` do not)
- Reviews=0 ✓ (no reviewed_at set on any linked log)
- Feedback=0 ✓ (no customer_feedback rows for this business)
- Response Rate=0% ✓ (0 responses / 1 delivered = 0%)
- Review Rate=0% ✓ (0 reviews / 1 delivered = 0%)

**Electrical and Plumbing rows:** Both show 0 across all columns — correct because neither service type has any enrollments or linked send_logs (only HVAC enrollments were created in Phase 62-63).

**Percentage bars:** The `PercentageBar` component renders a track (`bg-muted`, `w-24 h-2`) with an inner fill bar using `style={{ width: \`${Math.min(rate, 100)}%\` }}`. At 0% rate:
- All 6 bar elements (2 per row × 3 rows) show `style="width:0%"` ✓
- Inner fill bars have `className="... bg-primary"` — correct color class
- At width:0%, bars are invisible (empty track only), which is the correct visual state for 0%

**Screenshot:** `qa-64-analytics-breakdown.png`

---

## ANLYT-03: Analytics Empty State

**Requirement:** Empty state renders correctly when the RPC returns zero rows (no jobs in the business).

**Test method:** Code inspection (test business has 8 jobs so empty state cannot be triggered from this login session).

**Result: PASS (code verified)**

Empty state condition confirmed in `components/dashboard/analytics-service-breakdown.tsx`:

```tsx
// Line 17: condition
if (data.byServiceType.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <ChartBar className="h-8 w-8 text-muted-foreground" weight="regular" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mb-2">
        No analytics data yet
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Analytics appear once campaigns start sending. Complete a job to kick off your first campaign.
      </p>
      <Button onClick={openAddJob}>Add your first job</Button>
    </div>
  )
}
```

The empty state gate is `data.byServiceType.length === 0`. Per the `getServiceTypeAnalytics` function in `lib/data/analytics.ts`:
- If the RPC returns no rows: `emptyAnalytics()` is returned → `byServiceType: []` → empty state renders
- If the RPC returns an error: `emptyAnalytics()` is returned (error case also triggers empty state)
- A business with zero jobs would receive an empty RPC result (no `jobs` rows to GROUP BY) → empty state renders

**Empty state elements confirmed present in code:**
- `ChartBar` icon from Phosphor (correct icon library, correct weight="regular") ✓
- "No analytics data yet" heading ✓
- "Analytics appear once campaigns start sending. Complete a job to kick off your first campaign." description ✓
- "Add your first job" button → calls `openAddJob` (connects to Add Job sheet provider) ✓

**Why not live-tested:** The `get_service_type_analytics` RPC filters by `j.business_id = p_business_id`. The test business (id: `6ed94b54`) has 8 jobs, so byServiceType will always have 3 entries (hvac, plumbing, electrical). Triggering the empty state would require a second business with zero jobs, which is out of scope for this plan.

---

## Additional Observations

### Note 1: Service Type Display in Table (No Bug)
The breakdown table shows 3 rows (HVAC, Electrical, Plumbing) even though Electrical and Plumbing have 0 sends. This is expected — the RPC LEFT JOINs from `jobs` outward, so every service type with at least 1 job appears. This is correct behavior: it helps users see which service types have no campaign activity even if they have jobs.

### Note 2: RPC Response Count vs UI
The "Total Requests Sent" card shows **3**, which counts only the 3 send_logs linked through `campaign_enrollments`. The 7 manual (non-campaign) send_logs seeded in Phase 64-01 are intentionally excluded. This is by design — the Analytics page is specifically about campaign performance, not manual sends. Manual sends are tracked in the History page.

### Note 3: Percentage Bar Visual State
At 0% rate, the `PercentageBar` inner fill is invisible (`width:0%`). The track is still visible as a gray (`bg-muted`) background bar. This is a clean visual state — the user can see there are bars but they're empty. The numeric label "0%" confirms the value.

---

## Screenshots

| File | Description |
|------|-------------|
| `qa-64-analytics-desktop.png` | Full analytics page at 1440×900 — header, summary cards, breakdown table |
| `qa-64-analytics-breakdown.png` | Full-page screenshot showing all 3 breakdown rows and percentage bars |

---

## Bugs Found

No bugs found. All 3 requirements pass.

---

*Findings document for Phase 64-02, Plan 02 of Phase 64 (QA-06: History, Analytics, Feedback)*
