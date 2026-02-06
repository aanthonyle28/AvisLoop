# QA-AUDIT-02: Dashboard & Analytics Page Audit Summary

**Phase:** QA-AUDIT
**Plan:** 02
**Completed:** 2026-02-05
**Duration:** ~25 minutes

## One-Liner

Code-level audit of Dashboard and Analytics pages; found missing RPC function for analytics and legacy "Update contact" terminology in alert actions.

## Execution Note

Playwright MCP tools were not available in this session. Audit was conducted via comprehensive code analysis of all dashboard and analytics components, data fetching functions, types, and migrations. Screenshots could not be captured; data cross-checks against database could not be performed directly.

## Task 1: Dashboard Page Audit

### KPI Data Implementation Analysis

| KPI Widget | Data Source | Query Logic | Assessment |
|------------|-------------|-------------|------------|
| Reviews This Month | send_logs | `reviewed_at IS NOT NULL` + monthly date filter | CORRECT |
| Average Rating | customer_feedback | AVG(rating) with monthly date filter | CORRECT |
| Conversion Rate | Calculated | (reviews / delivered sends) * 100 | CORRECT |
| Requests Sent | send_logs | Weekly count of sent/delivered/opened | CORRECT |
| Active Sequences | campaign_enrollments | `status = 'active'` | CORRECT |
| Pending/Queued | send_logs | `status = 'pending'` | CORRECT |

**Data Accuracy Assessment:** The KPI queries are correctly implemented. Trend calculations use appropriate periods (monthly for outcomes, weekly for pipeline).

### Component Analysis

| Component | Implementation | Assessment |
|-----------|---------------|------------|
| ActionSummaryBanner | Green/yellow states, click-to-scroll | CORRECT |
| KPIWidgets | Two-tier sizing, clickable outcomes, static pipeline | CORRECT |
| ReadyToSendQueue | Job filtering, quick enroll, stale warnings | CORRECT |
| AttentionAlerts | Severity icons, contextual actions, acknowledge menu | CORRECT |

### V2 Alignment Check

| Aspect | Expected | Actual | Status |
|--------|----------|--------|--------|
| Dashboard first in nav | Yes | Yes | PASS |
| House icon for Dashboard | Yes | Yes | PASS |
| "Add Job" in sidebar | Yes | Yes | PASS |
| "Activity" label (not "Requests") | Yes | Yes | PASS |
| No "contacts" language | Yes | One violation | FAIL |

### Findings

**M01 - MEDIUM: Legacy terminology "Update contact"**
- **Location:** `lib/data/dashboard.ts:371`
- **Issue:** Bounced email alert action label says "Update contact" instead of "Update customer"
- **Impact:** Inconsistent terminology with V2 "customers" model
- **Fix:** Change line 371 from `label: 'Update contact'` to `label: 'Update customer'`

**M02 - MEDIUM: Send page position in nav**
- **Location:** `components/layout/sidebar.tsx:33-42`
- **Issue:** Send is 2nd in navigation order, making it feel like a primary feature
- **Impact:** V2 model emphasizes Campaigns as primary workflow; Send should feel secondary
- **Fix:** Consider moving Send to position 5-6 in mainNav array (after Campaigns)

## Task 2: Analytics Page Audit

### Critical Finding

**C01 - CRITICAL: Missing RPC function `get_service_type_analytics`**
- **Location:** `lib/data/analytics.ts:45`
- **Issue:** The analytics page calls `supabase.rpc('get_service_type_analytics', {...})` but this function does not exist in any migration file
- **Impact:** Analytics page will return empty data (graceful fallback works) but no actual analytics will display
- **Evidence:** Searched all migrations for `get_service_type_analytics` - no results found
- **V24-AUDIT Reference:** Item #3 in v24-MILESTONE-AUDIT.md states "FIXED - moved to get_service_type_analytics() Postgres RPC" but migration was never created
- **Fix:** Create migration `20260205_add_analytics_rpc.sql` with:
  ```sql
  CREATE OR REPLACE FUNCTION get_service_type_analytics(p_business_id UUID)
  RETURNS TABLE (
    service_type TEXT,
    total_sent BIGINT,
    delivered BIGINT,
    reviewed BIGINT,
    feedback_count BIGINT
  ) AS $$
  BEGIN
    RETURN QUERY
    SELECT
      j.service_type::TEXT,
      COUNT(sl.id)::BIGINT AS total_sent,
      COUNT(sl.id) FILTER (WHERE sl.status IN ('sent', 'delivered', 'opened'))::BIGINT AS delivered,
      COUNT(sl.id) FILTER (WHERE sl.reviewed_at IS NOT NULL)::BIGINT AS reviewed,
      COUNT(DISTINCT cf.id)::BIGINT AS feedback_count
    FROM jobs j
    LEFT JOIN send_logs sl ON sl.job_id = j.id AND sl.business_id = p_business_id
    LEFT JOIN customer_feedback cf ON cf.customer_id = j.customer_id AND cf.business_id = p_business_id
    WHERE j.business_id = p_business_id
    GROUP BY j.service_type
    ORDER BY COUNT(sl.id) DESC;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```

### Component Analysis

| Component | Implementation | Assessment |
|-----------|---------------|------------|
| ServiceTypeBreakdown | Three summary cards + breakdown table | CORRECT |
| PercentageBar | Visual rate indicator with primary color | CORRECT |
| Empty state | "No campaign data yet..." message | CORRECT (V2 aligned) |

### V2 Alignment Check

| Aspect | Expected | Actual | Status |
|--------|----------|--------|--------|
| No "contacts" language | Yes | Yes | PASS |
| Campaign-first messaging | Yes | Yes ("campaign data" in empty state) | PASS |
| Two-rate display (response + review) | Yes | Yes | PASS |

## Data Accuracy Summary

| Check | Status | Notes |
|-------|--------|-------|
| Dashboard KPIs query correctness | VERIFIED | Code analysis confirms correct queries |
| Analytics data aggregation | BLOCKED | RPC function missing - cannot verify |
| Trend calculation logic | VERIFIED | Monthly for outcomes, weekly for pipeline |

## Findings by Severity

### Critical (1)
| ID | Page | Finding | Fix |
|----|------|---------|-----|
| C01 | Analytics | Missing `get_service_type_analytics` RPC function | Create migration with RPC function |

### Medium (2)
| ID | Page | Finding | Fix |
|----|------|---------|-----|
| M01 | Dashboard | "Update contact" label in bounced email alert | Change to "Update customer" in lib/data/dashboard.ts:371 |
| M02 | Dashboard | Send is 2nd in nav order (should feel secondary) | Move to position 5-6 in sidebar mainNav array |

### Low (0)
None identified.

## V2 Alignment Assessment

| Page | Grade | Notes |
|------|-------|-------|
| Dashboard | NEEDS WORK | One legacy terminology instance, nav order concern |
| Analytics | PASS | V2-aligned language, but data missing due to RPC |

**Overall:** Dashboard and Analytics pages are structurally well-implemented and align with the V2 campaign-first model. The critical blocker is the missing RPC function which prevents analytics from displaying any data. The "Update contact" terminology is a straightforward fix.

## Screenshots

**Not captured.** Playwright MCP tools were not available in this session. Screenshots should be captured in a follow-up session with browser automation tools.

## Verification Status

- [x] Dashboard page code audited
- [x] Analytics page code audited
- [x] KPI query logic verified
- [ ] Screenshots captured (blocked - no Playwright MCP)
- [ ] Database cross-check performed (blocked - no Supabase MCP)
- [x] Legacy terminology scan complete
- [x] V2 alignment assessed

## Recommendations

1. **Immediate:** Create the missing `get_service_type_analytics` RPC function migration (C01)
2. **Immediate:** Fix "Update contact" terminology in dashboard.ts (M01)
3. **Consider:** Reorder sidebar navigation to make Send feel less primary (M02)
4. **Follow-up:** Re-run this audit with Playwright MCP tools to capture screenshots and perform live testing

## Files Referenced

- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/analytics/page.tsx`
- `lib/data/dashboard.ts`
- `lib/data/analytics.ts`
- `lib/types/dashboard.ts`
- `components/dashboard/kpi-widgets.tsx`
- `components/dashboard/action-summary-banner.tsx`
- `components/dashboard/ready-to-send-queue.tsx`
- `components/dashboard/attention-alerts.tsx`
- `components/dashboard/analytics-service-breakdown.tsx`
- `components/layout/sidebar.tsx`
