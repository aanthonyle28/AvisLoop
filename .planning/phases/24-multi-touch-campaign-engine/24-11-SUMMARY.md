---
phase: 24-multi-touch-campaign-engine
plan: 11
subsystem: analytics
tags: [campaigns, analytics, stats, performance]
status: complete

requires:
  - 24-08-campaign-detail
  - 24-10-stop-conditions

provides:
  - Campaign analytics data function
  - Campaign stats UI component
  - Touch-by-touch performance metrics

affects:
  - Campaign detail page display
  - Business owner insights

tech-stack:
  added: []
  patterns:
    - Aggregation queries from campaign_enrollments
    - Touch status analysis
    - Stop reason breakdown

key-files:
  created:
    - components/campaigns/campaign-stats.tsx
  modified:
    - lib/data/campaign.ts
    - app/(dashboard)/campaigns/[id]/page.tsx

metrics:
  completed: 2026-02-04
---

# Phase 24 Plan 11: Campaign Analytics Summary

**One-liner:** Campaign performance metrics with touch-by-touch stats and stop reason analysis

## What Was Built

### Analytics Data Function

`getCampaignAnalytics()` in lib/data/campaign.ts (lines 227-315):

```typescript
export async function getCampaignAnalytics(campaignId: string): Promise<{
  touchStats: Array<{
    touchNumber: number
    sent: number
    pending: number
    skipped: number
    failed: number
  }>
  stopReasons: Record<string, number>
  totalEnrollments: number
  avgTouchesCompleted: number
}>
```

**What it calculates:**
- Per-touch status counts (sent, pending, skipped, failed)
- Stop reason breakdown (review_clicked, opted_out_email, etc.)
- Total enrollments
- Average touches completed per enrollment

### Campaign Stats Component

`CampaignStats` in components/campaigns/campaign-stats.tsx:

**Displays:**
- Touch-by-touch performance table
- Stop reasons distribution
- Total enrollments count
- Average touches completed

### Detail Page Integration

Campaign detail page fetches and displays analytics:

```typescript
const [campaign, enrollments, counts, analytics] = await Promise.all([
  getCampaign(id),
  getCampaignEnrollments(id, { limit: 20 }),
  getCampaignEnrollmentCounts(id),
  getCampaignAnalytics(id),
])

// In render:
<CampaignStats
  touchStats={analytics.touchStats}
  stopReasons={analytics.stopReasons}
  totalEnrollments={analytics.totalEnrollments}
  avgTouchesCompleted={analytics.avgTouchesCompleted}
  touchCount={campaign.campaign_touches.length}
/>
```

## Technical Implementation

### Touch Stats Aggregation

Reads denormalized touch status fields from campaign_enrollments:

```typescript
const touchStats = [1, 2, 3, 4].map(touchNumber => {
  const statusKey = `touch_${touchNumber}_status` as keyof typeof enrollments[0]
  const statuses = enrollments.map(e => e[statusKey]).filter(Boolean)

  return {
    touchNumber,
    sent: statuses.filter(s => s === 'sent').length,
    pending: statuses.filter(s => s === 'pending').length,
    skipped: statuses.filter(s => s === 'skipped').length,
    failed: statuses.filter(s => s === 'failed').length,
  }
})
```

### Stop Reason Breakdown

Aggregates stop_reason from stopped enrollments:

```typescript
const stopReasons: Record<string, number> = {}
enrollments
  .filter(e => e.status === 'stopped' && e.stop_reason)
  .forEach(e => {
    const reason = e.stop_reason as string
    stopReasons[reason] = (stopReasons[reason] || 0) + 1
  })
```

### Average Touches Calculation

Counts 'sent' touches per enrollment:

```typescript
let totalTouchesCompleted = 0
enrollments.forEach(e => {
  let completed = 0
  if (e.touch_1_status === 'sent') completed++
  if (e.touch_2_status === 'sent') completed++
  if (e.touch_3_status === 'sent') completed++
  if (e.touch_4_status === 'sent') completed++
  totalTouchesCompleted += completed
})

avgTouchesCompleted = totalTouchesCompleted / enrollments.length
```

## Analytics Available

| Metric | Source | Purpose |
|--------|--------|---------|
| Touch sent count | touch_N_status = 'sent' | Delivery success |
| Touch skip count | touch_N_status = 'skipped' | Channel issues |
| Touch fail count | touch_N_status = 'failed' | Send failures |
| Stop reasons | stop_reason column | Conversion analysis |
| Avg touches | Calculated | Campaign effectiveness |

## Deviations from Plan

Simplified implementation compared to plan:
- Analytics integrated into getCampaignAnalytics() in campaign.ts (not separate file)
- Stats component uses props pattern instead of direct data fetch
- No color-coded rate thresholds (kept simple)

## Verification Passed

- [x] getCampaignAnalytics aggregates enrollment data
- [x] Touch stats show sent/pending/skipped/failed counts
- [x] Stop reasons counted and displayed
- [x] Average touches completed calculated
- [x] CampaignStats component renders analytics
- [x] Campaign detail page includes analytics section
- [x] `pnpm typecheck` passes

## Files Created/Modified

- `components/campaigns/campaign-stats.tsx` - Analytics display component
- `lib/data/campaign.ts` - Added getCampaignAnalytics function (lines 227-315)
- `app/(dashboard)/campaigns/[id]/page.tsx` - Integrated CampaignStats component

---

*Phase: 24-multi-touch-campaign-engine*
*Completed: 2026-02-04*
*Note: Summary created retroactively during milestone audit cleanup*
