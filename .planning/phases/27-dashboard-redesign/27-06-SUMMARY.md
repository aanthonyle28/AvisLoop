---
phase: 27
plan: 06
subsystem: analytics
tags: [analytics, service-types, response-rate, review-rate, data-aggregation]

requires:
  - phase: 24
    provides: campaign_enrollments table and send_logs extensions
  - phase: 26
    provides: customer_feedback table

provides:
  - Analytics page with service type breakdowns
  - Response rate and review rate metrics by service type
  - getServiceTypeAnalytics data function

affects:
  - 27-07: Analytics navigation link may need badge for new data

tech-stack:
  added: []
  patterns:
    - JS-based aggregation for complex grouping (Supabase client limitation)
    - Denormalized display for performance (no real-time joins)

key-files:
  created:
    - lib/data/analytics.ts
    - components/dashboard/analytics-service-breakdown.tsx
    - app/(dashboard)/analytics/page.tsx
  modified: []

decisions:
  - id: js-aggregation-analytics
    title: JS aggregation for service type metrics
    rationale: Supabase client doesn't support complex GROUP BY with multiple joins. Fetch separately and aggregate in JS.
  - id: two-rate-display
    title: Display both response rate and review rate
    rationale: Response rate (reviews + feedback) shows engagement, review rate (reviews only) shows public outcomes
  - id: volume-sort
    title: Sort by total sent descending
    rationale: Most active service types appear first for at-a-glance prioritization

metrics:
  duration: 109 seconds
  completed: 2026-02-04
---

# Phase 27 Plan 06: Analytics with Service Type Breakdown Summary

**One-liner:** Analytics page displays response/review rates per service type from actual campaign data

## What Was Built

Created the Analytics page at `/analytics` with service type breakdowns showing:
- **Response rate:** (reviews + feedback) / delivered requests
- **Review rate:** reviews / delivered requests (public reviews only)
- **Service type table:** Shows sent, delivered, reviews, feedback counts with visual percentage bars

Data is derived from:
- `campaign_enrollments` (joined with jobs for service_type)
- `send_logs` (for sent/delivered/reviewed counts)
- `customer_feedback` (for feedback counts)

## Implementation Approach

**JS-based aggregation:**
Since Supabase client doesn't support complex GROUP BY across multiple joins, we:
1. Fetch enrollments with job service types
2. Fetch all campaign send logs
3. Fetch all customer feedback with enrollment IDs
4. Map and aggregate in JavaScript

This trades database efficiency for implementation simplicity. Acceptable for expected data volumes (hundreds to thousands of campaigns per business).

**Component structure:**
- `ServiceTypeBreakdown`: Client component with summary cards + table
- Analytics page: Server component fetching business + data

**Rate calculations:**
- Response rate includes both public reviews AND private feedback (total engagement)
- Review rate only counts public reviews (business outcome metric)

## Deviations from Plan

None - plan executed exactly as written.

## Task Breakdown

| Task | Commit | Files |
|------|--------|-------|
| 1. Analytics data functions | b9cd28e | lib/data/analytics.ts |
| 2. Analytics page and breakdown component | 516aca5 | analytics page, ServiceTypeBreakdown component |

## Decisions Made

### JS Aggregation for Analytics

**Context:** Need to compute metrics grouped by service type, joining 3 tables (campaign_enrollments → jobs, send_logs, customer_feedback).

**Decision:** Fetch data separately and aggregate in JavaScript instead of complex SQL GROUP BY.

**Rationale:**
- Supabase client doesn't support complex grouping with multiple joins
- Expected data volumes are manageable (hundreds to thousands of records)
- Simplifies implementation and maintenance
- Trade database efficiency for code clarity

**Alternatives considered:**
- PostgreSQL function with GROUP BY: Requires service role, more complex RLS
- Edge function: Extra network hop, added complexity

### Two-Rate Display (Response + Review)

**Context:** Need to show both engagement (any response) and outcome (public reviews).

**Decision:** Display two separate rate metrics:
- Response rate = (reviews + feedback) / delivered
- Review rate = reviews / delivered

**Rationale:**
- Business owners need both metrics for different purposes
- Response rate shows campaign effectiveness at generating engagement
- Review rate shows public reputation impact
- Private feedback is valuable even if not a public review

**Impact:** Table has 7 columns (service type, sent, delivered, reviews, feedback, response rate, review rate)

### Volume-Based Sorting

**Context:** Service types may have vastly different volumes.

**Decision:** Sort service types by total sent descending (most active first).

**Rationale:**
- Most relevant service types appear at the top
- Natural focus on high-volume campaigns
- Matches user mental model (what they use most)

**Alternative considered:** Alphabetical - less useful for at-a-glance prioritization

## Testing Notes

**Verification steps:**
1. `pnpm typecheck` - passed
2. `pnpm lint` - passed (fixed analytics.ts typed cast)
3. Type exports verified
4. Component structure matches plan

**Manual testing needed:**
- Empty state rendering (no campaign data yet)
- Service type breakdowns with real data
- Percentage bar visual indicators
- Mobile responsive layout

## Integration Points

**Data dependencies:**
- Requires Phase 24 (campaign_enrollments, send_logs campaign fields)
- Requires Phase 26 (customer_feedback table)

**UI flow:**
- Accessible via direct URL `/analytics`
- Future: KPI cards on dashboard will link here (Plan 27-02 already has links)
- Future: Navigation may add analytics link

## Next Phase Readiness

**Ready for:**
- 27-07: Final dashboard polish (navigation updates, badges)
- Can add analytics link to sidebar navigation
- Can add "new data" badge if desired

**No blockers or concerns.**

## Performance Considerations

**Current approach:**
- 3 separate queries (enrollments, send_logs, feedback)
- JS aggregation for grouping
- No pagination (fetches all campaign data for business)

**Scaling considerations:**
- Acceptable for expected volumes (hundreds of campaigns, thousands of sends per business)
- If volumes grow significantly, consider:
  - PostgreSQL function with GROUP BY
  - Materialized view for pre-aggregated metrics
  - Pagination or date-range filtering

**Query performance:**
- Enrollment query: Fast (indexed by business_id)
- Send logs query: Fast (indexed by business_id, campaign_enrollment_id)
- Feedback query: Fast (indexed by business_id, enrollment_id)

## Documentation

**Exported types:**
- `ServiceTypeMetrics`: Per-service-type metrics
- `ServiceTypeAnalytics`: Full analytics data structure with totals

**Exported functions:**
- `getServiceTypeAnalytics(businessId: string): Promise<ServiceTypeAnalytics>`

**Component exports:**
- `ServiceTypeBreakdown`: Table and summary card display

## Artifacts

**Created files:**
- `lib/data/analytics.ts` (236 lines) - Data fetching and aggregation
- `components/dashboard/analytics-service-breakdown.tsx` (112 lines) - Client component for display
- `app/(dashboard)/analytics/page.tsx` (24 lines) - Server page component

**Modified files:**
- None

**Total additions:** 372 lines of new code
