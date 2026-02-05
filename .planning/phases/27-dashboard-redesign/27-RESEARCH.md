# Phase 27: Dashboard Redesign - Research

**Researched:** 2026-02-04
**Domain:** Next.js Server Components dashboard with KPI widgets, real-time alerts, and action queues
**Confidence:** HIGH

## Summary

Phase 27 transforms the dashboard into an operational command center for business owners using Next.js Server Components, existing Supabase data queries, and the established design system (Tailwind CSS variables, Phosphor icons, shadcn/ui patterns). The phase builds on existing infrastructure from Phases 22 (jobs), 24 (campaigns), and 26 (feedback).

The standard approach for 2026 Next.js dashboards uses Server Components with parallel data fetching via Promise.all(), skeleton loading states for perceived performance, and modular card-based layouts with CSS variables for dark mode support. KPI widgets should be clickable for drill-down navigation, alerts should be severity-sorted with contextual actions, and the dashboard should provide instant "all clear" vs "needs attention" feedback via a hero banner.

User decisions from CONTEXT.md constrain implementation: two-tier KPI hierarchy (outcome metrics large, pipeline metrics smaller), jobs-only ready-to-send queue with service-type-aware urgency, delivery issues and unresolved feedback as alert types (no budget warnings), action summary banner replacing daily to-do, and inline actions instead of quick action buttons.

**Primary recommendation:** Build dashboard as new route with Server Components fetching data in parallel, use existing design system components (Card, Badge, Skeleton), implement severity-sorted alerts with contextual inline actions, and swap to /dashboard when complete.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.x | Server Components, parallel data fetching | Industry standard for React SSR dashboards, enables zero-client-JS data fetching |
| React Server Components | 19.x | Server-side rendering, streaming | Eliminates client-side data fetching overhead, improves LCP |
| Supabase | latest | Database queries, RLS enforcement | Already integrated, provides type-safe queries |
| Tailwind CSS | 3.4.x | Styling with CSS variables | Project standard, dark mode via CSS variables |
| Phosphor Icons | 2.1.x | Icon system | Project standard, consistent visual language |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.x | Date formatting, relative time | Already in project, for "Completed 2 hours ago" displays |
| react-countup | 6.5.x | Animated number transitions | Already in project, for KPI value changes |
| class-variance-authority | 0.7.x | Component variants | Already in project, for badge severity variants |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Components | Client-side React Query | Server Components eliminate waterfalls and reduce JS bundle; React Query adds complexity |
| Existing Skeleton component | react-loading-skeleton | Existing component matches design system and has custom animation |
| CSS variables for theming | Inline color props | CSS variables enable system-wide dark mode; inline props harder to maintain |

**Installation:**
No new packages required - all dependencies already in project (see package.json).

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (dashboard)/
│   └── dashboard-new/         # Build here first, swap to /dashboard when ready
│       └── page.tsx            # Server Component with parallel data fetching
components/
├── dashboard/
│   ├── action-summary-banner.tsx     # Hero banner: "All caught up" vs "3 items need attention"
│   ├── kpi-widgets.tsx               # Two-tier KPI grid (outcome + pipeline)
│   ├── ready-to-send-queue.tsx       # Jobs not enrolled, quick enroll action
│   ├── attention-alerts.tsx          # Severity-sorted alerts with inline actions
│   └── analytics-service-breakdown.tsx # Service type response rate chart
lib/
├── data/
│   └── dashboard.ts            # Aggregated dashboard queries
```

### Pattern 1: Parallel Data Fetching in Server Components
**What:** Fetch all dashboard data in parallel using Promise.all() to avoid waterfalls
**When to use:** Dashboard pages with multiple independent data sources
**Example:**
```typescript
// Source: Next.js official docs (https://nextjs.org/learn/dashboard-app/fetching-data)
// app/(dashboard)/dashboard-new/page.tsx
export default async function DashboardPage() {
  const business = await getBusiness()
  if (!business) redirect('/onboarding')

  // Parallel data fetching - all queries start simultaneously
  const [
    kpiData,
    readyToSendJobs,
    alerts,
    feedbackCount,
  ] = await Promise.all([
    getKPIData(business.id),
    getReadyToSendJobs(business.id),
    getAttentionAlerts(business.id),
    getUnresolvedFeedbackCount(business.id),
  ])

  return (
    <div className="container mx-auto py-6 px-4">
      <ActionSummaryBanner
        readyCount={readyToSendJobs.length}
        alertCount={alerts.length}
      />
      <KPIWidgets data={kpiData} />
      <ReadyToSendQueue jobs={readyToSendJobs} />
      <AttentionAlerts alerts={alerts} />
    </div>
  )
}
```

### Pattern 2: Skeleton Loading States Matching Content Structure
**What:** Use skeleton components that mirror the actual content layout to prevent layout shift
**When to use:** Any component with async data loading
**Example:**
```typescript
// Source: Existing codebase pattern (components/ui/skeleton.tsx)
// components/dashboard/kpi-widgets.tsx
function KPIWidgetsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Outcome metrics - larger */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card border rounded-lg p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-10 w-20 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

// Usage with Suspense
<Suspense fallback={<KPIWidgetsSkeleton />}>
  <KPIWidgets data={kpiData} />
</Suspense>
```

### Pattern 3: Clickable KPI Cards with Navigation
**What:** Make KPI widgets interactive to drill down into detail pages with contextual filters
**When to use:** Dashboard KPIs that link to underlying data tables
**Example:**
```typescript
// Source: Material Tailwind patterns, Next.js Link component
// components/dashboard/kpi-widgets.tsx
function ReviewsThisMonthWidget({ count, trend }: KPIProps) {
  return (
    <Link href="/history?dateRange=thisMonth&status=reviewed">
      <InteractiveCard className="p-6 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Reviews This Month
          </h3>
          <Star size={20} weight="regular" className="text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold">{count}</span>
          <TrendIndicator value={trend} period="vs last month" />
        </div>
      </InteractiveCard>
    </Link>
  )
}
```

### Pattern 4: Severity-Sorted Alerts with Contextual Actions
**What:** Display alerts in priority order (critical → warning → info) with inline resolution actions
**When to use:** Alert/notification systems that require user action
**Example:**
```typescript
// Source: PatternFly status/severity patterns, cybersecurity dashboard UX
// components/dashboard/attention-alerts.tsx
interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  type: 'failed_send' | 'bounced_email' | 'unresolved_feedback'
  message: string
  timestamp: string
  contextualAction: {
    label: string
    href?: string
    action?: () => Promise<void>
  }
}

function AttentionAlerts({ alerts }: { alerts: Alert[] }) {
  const sortedAlerts = alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Needs Attention
          {alerts.length > 0 && (
            <Badge variant="destructive">{alerts.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedAlerts.slice(0, 3).map((alert) => (
          <div key={alert.id} className="flex items-start justify-between py-3 border-b last:border-0">
            <div className="flex items-start gap-3">
              <SeverityIcon severity={alert.severity} />
              <div>
                <p className="text-sm font-medium">{alert.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.timestamp))} ago
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline">
              {alert.contextualAction.label}
            </Button>
          </div>
        ))}
        {alerts.length > 3 && (
          <Link href="/alerts" className="text-sm text-primary hover:underline">
            View all {alerts.length} alerts
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
```

### Pattern 5: Action Summary Banner (Hero Element)
**What:** Top-of-page banner providing instant "all clear" vs "needs attention" feedback
**When to use:** Dashboards where first question is "Do I need to do anything?"
**Example:**
```typescript
// Source: Dashboard design principles 2026, top-rail layout patterns
// components/dashboard/action-summary-banner.tsx
function ActionSummaryBanner({
  readyCount,
  alertCount
}: {
  readyCount: number
  alertCount: number
}) {
  const totalItems = readyCount + alertCount

  if (totalItems === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle size={24} weight="fill" className="text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              All caught up — nothing needs your attention
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your automation is running smoothly
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        // Smooth scroll to first actionable section
        document.getElementById('ready-to-send-queue')?.scrollIntoView({
          behavior: 'smooth'
        })
      }}
      className="w-full bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WarningCircle size={24} weight="fill" className="text-yellow-600 dark:text-yellow-400" />
          <div className="text-left">
            <p className="font-medium text-yellow-900 dark:text-yellow-100">
              {totalItems} items need attention
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {readyCount > 0 && `${readyCount} ready to send`}
              {readyCount > 0 && alertCount > 0 && ', '}
              {alertCount > 0 && `${alertCount} alert${alertCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <ArrowDown size={20} weight="bold" className="text-yellow-600 dark:text-yellow-400" />
      </div>
    </button>
  )
}
```

### Anti-Patterns to Avoid
- **Sequential data fetching:** Waiting for one query before starting the next creates waterfalls; use Promise.all()
- **Client-side KPI calculations:** Move aggregations to server queries to reduce client JS and improve LCP
- **Generic "Retry" buttons:** Alerts need contextual actions (e.g., "Update contact info" for bad email, "Acknowledge" for permanent failures)
- **Blank screens during load:** Always show skeleton states that match final content structure
- **Hard-coded dark mode colors:** Use CSS variables (hsl(var(--destructive))) to respect theme toggle

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Trend indicators (arrows + %) | Custom arrow/percentage component | react-countup for numbers + Phosphor ArrowUp/ArrowDown icons | Existing pattern in stat-strip.tsx, handles animation and formatting |
| Date formatting | Manual date string manipulation | date-fns formatDistanceToNow(), format() | Already in project, handles timezone and locale |
| Badge variants by severity | Inline conditional classes | class-variance-authority with Badge component | Existing pattern in components/ui/badge.tsx, ensures consistency |
| Empty states | Custom illustrations per section | Context-aware text + existing Phosphor icons | Simpler, faster, matches CONTEXT.md decision "No jobs yet — add a completed job" |
| Skeleton loaders | Third-party library | Existing Skeleton component with pulse-soft animation | Already styled to match design system |

**Key insight:** The codebase already has established patterns for stats display (stat-strip.tsx), card layouts (InteractiveCard), badges (Badge component with variants), and icons (Phosphor). Reusing these patterns ensures consistency and reduces complexity. Don't rebuild what exists.

## Common Pitfalls

### Pitfall 1: Waterfall Data Fetching
**What goes wrong:** Sequential await statements cause each query to wait for the previous, adding latency (3 queries × 100ms = 300ms vs 100ms parallel)
**Why it happens:** Natural coding pattern is `const a = await getA(); const b = await getB();`
**How to avoid:** Initiate all promises simultaneously, then await Promise.all()
```typescript
// BAD - sequential (300ms)
const kpis = await getKPIs()
const jobs = await getJobs()
const alerts = await getAlerts()

// GOOD - parallel (100ms)
const [kpis, jobs, alerts] = await Promise.all([
  getKPIs(),
  getJobs(),
  getAlerts(),
])
```
**Warning signs:** Dashboard feels slow despite fast individual queries; network tab shows sequential requests

### Pitfall 2: Layout Shift from Skeleton Mismatch
**What goes wrong:** Skeleton structure differs from actual content, causing jarring layout shift when data loads
**Why it happens:** Skeleton created before final component structure is finalized
**How to avoid:** Skeleton should use identical grid/flex layout and approximate element dimensions
```typescript
// BAD - skeleton doesn't match final layout
<Skeleton className="h-20 w-full" /> // Single tall bar
// becomes...
<div className="grid grid-cols-3 gap-4">...</div> // Three columns

// GOOD - skeleton mirrors final structure
<div className="grid grid-cols-3 gap-4">
  <Skeleton className="h-20 w-full" />
  <Skeleton className="h-20 w-full" />
  <Skeleton className="h-20 w-full" />
</div>
```
**Warning signs:** Content "jumps" when loading completes; Lighthouse CLS (Cumulative Layout Shift) warnings

### Pitfall 3: Non-Contextual Alert Actions
**What goes wrong:** Generic "Retry" or "Dismiss" buttons that don't match failure type, forcing users to investigate elsewhere
**Why it happens:** Treating all alerts identically instead of matching action to failure reason
**How to avoid:** Alert type determines inline action label and target
```typescript
// BAD - generic action
<Button>Retry</Button>

// GOOD - contextual per failure type
switch (alert.type) {
  case 'bounced_email':
    action = { label: 'Update contact', href: `/customers/${customerId}` }
  case 'rate_limit':
    action = { label: 'View limits', href: '/billing' }
  case 'unresolved_feedback':
    action = { label: 'Respond', href: `/feedback/${feedbackId}` }
}
```
**Warning signs:** Users click alert, get confused about next step; alerts persist because action doesn't resolve root cause

### Pitfall 4: Forgetting Service-Type-Aware Urgency
**What goes wrong:** All jobs in ready-to-send queue treated equally, but cleaning jobs are urgent after 4 hours while roofing jobs are fine at 48 hours
**Why it happens:** Missing business logic that maps service type to optimal timing from business settings
**How to avoid:** Query business.service_type_timing and compare job.completed_at against service-specific threshold
```typescript
// Get timing thresholds from business settings (Phase 22)
const timingMap = business.service_type_timing || {
  cleaning: 4,
  hvac: 24,
  roofing: 72,
  // ... defaults for all service types
}

// Calculate staleness per job
jobs.map(job => {
  const threshold = timingMap[job.service_type] || 24
  const hoursElapsed = differenceInHours(new Date(), new Date(job.completed_at))
  const isStale = hoursElapsed > threshold
  return { ...job, isStale, hoursElapsed, threshold }
})
```
**Warning signs:** Business owner doesn't know which jobs need immediate attention; all jobs look equally urgent

### Pitfall 5: Hardcoded Trend Comparison Periods
**What goes wrong:** All KPIs compare to "last week" or "last month" regardless of metric type, making trends meaningless
**Why it happens:** Using a single comparison period for all metrics instead of context-appropriate periods
**How to avoid:** Activity metrics (sends, opens) compare weekly; outcome metrics (reviews, ratings) compare monthly
```typescript
// From CONTEXT.md decision
const trendPeriods = {
  // Activity metrics - weekly comparison
  requestsSentThisWeek: 'vs last week',
  activeSequences: 'vs last week',
  pendingQueued: 'vs last week',

  // Outcome metrics - monthly comparison
  reviewsThisMonth: 'vs last month',
  averageRating: 'vs last month',
  conversionRate: 'vs last month',
}
```
**Warning signs:** Trend labels don't specify period ("Up 15%" without context); business owner doesn't trust the numbers

## Code Examples

Verified patterns from official sources:

### Parallel Data Fetching Pattern
```typescript
// Source: Next.js official docs (https://nextjs.org/learn/dashboard-app/fetching-data)
// app/(dashboard)/dashboard-new/page.tsx
import { getBusiness } from '@/lib/actions/business'
import {
  getKPIData,
  getReadyToSendJobs,
  getAttentionAlerts
} from '@/lib/data/dashboard'
import { getUnresolvedFeedbackCount } from '@/lib/data/feedback'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const business = await getBusiness()
  if (!business) redirect('/onboarding')

  // Fetch all dashboard data in parallel
  const [kpiData, readyJobs, alerts, feedbackCount] = await Promise.all([
    getKPIData(business.id),
    getReadyToSendJobs(business.id),
    getAttentionAlerts(business.id),
    getUnresolvedFeedbackCount(business.id),
  ])

  const totalActionItems = readyJobs.length + alerts.length

  return (
    <div className="container mx-auto py-6 px-4">
      <ActionSummaryBanner
        readyCount={readyJobs.length}
        alertCount={alerts.length}
      />
      <KPIWidgets data={kpiData} />
      <ReadyToSendQueue jobs={readyJobs} business={business} />
      <AttentionAlerts alerts={alerts} feedbackCount={feedbackCount} />
    </div>
  )
}
```

### Two-Tier KPI Widget Layout
```typescript
// Source: User CONTEXT.md decisions + existing stat-strip.tsx pattern
// components/dashboard/kpi-widgets.tsx
'use client'

import { Card, InteractiveCard } from '@/components/ui/card'
import { Star, TrendUp, TrendDown } from '@phosphor-icons/react'
import Link from 'next/link'

interface KPIData {
  // Outcome metrics (large, top row)
  reviewsThisMonth: { value: number; trend: number }
  averageRating: { value: number; trend: number }
  conversionRate: { value: number; trend: number }

  // Pipeline metrics (smaller, bottom row)
  requestsSentThisWeek: { value: number; trend: number }
  activeSequences: { value: number; trend: number }
  pendingQueued: { value: number; trend: number }
}

export function KPIWidgets({ data }: { data: KPIData }) {
  return (
    <div className="space-y-4 mb-6">
      {/* Outcome metrics - larger cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/history?dateRange=thisMonth&status=reviewed">
          <InteractiveCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Reviews This Month
              </h3>
              <Star size={20} weight="regular" className="text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold">
                {data.reviewsThisMonth.value}
              </span>
              <TrendIndicator
                value={data.reviewsThisMonth.trend}
                period="vs last month"
              />
            </div>
          </InteractiveCard>
        </Link>

        {/* Average Rating and Conversion Rate cards... */}
      </div>

      {/* Pipeline metrics - smaller cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              Requests Sent This Week
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {data.requestsSentThisWeek.value}
            </span>
            <TrendIndicator
              value={data.requestsSentThisWeek.trend}
              period="vs last week"
              size="sm"
            />
          </div>
        </Card>

        {/* Active Sequences and Pending/Queued cards... */}
      </div>
    </div>
  )
}

function TrendIndicator({
  value,
  period,
  size = 'default'
}: {
  value: number
  period: string
  size?: 'default' | 'sm'
}) {
  const Icon = value >= 0 ? TrendUp : TrendDown
  const colorClass = value >= 0
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <div className={cn(
      "flex items-center gap-1",
      size === 'sm' ? 'text-xs' : 'text-sm'
    )}>
      <Icon size={size === 'sm' ? 12 : 16} weight="bold" className={colorClass} />
      <span className={cn("font-medium", colorClass)}>
        {Math.abs(value)}%
      </span>
      <span className="text-muted-foreground">{period}</span>
    </div>
  )
}
```

### Ready-to-Send Queue with Service-Type Urgency
```typescript
// Source: User CONTEXT.md decisions, existing jobs data structure
// components/dashboard/ready-to-send-queue.tsx
'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WarningCircle, DotsThree } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface ReadyJob {
  id: string
  customer: { id: string; name: string }
  service_type: string
  completed_at: string
  isStale: boolean // Computed: exceeds service type optimal window
  hoursElapsed: number
  threshold: number
}

export function ReadyToSendQueue({
  jobs,
  business
}: {
  jobs: ReadyJob[]
  business: { id: string }
}) {
  const displayJobs = jobs.slice(0, 5)

  if (jobs.length === 0) {
    return (
      <Card id="ready-to-send-queue" className="mb-6">
        <CardHeader>
          <CardTitle>Ready to Send</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All caught up — no jobs waiting for enrollment
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="ready-to-send-queue" className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Ready to Send
          <Badge variant="secondary">{jobs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="flex items-start gap-3 flex-1">
                {job.isStale && (
                  <WarningCircle
                    size={20}
                    weight="fill"
                    className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5"
                    title={`${job.service_type} jobs typically send within ${job.threshold}h`}
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{job.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.service_type} • Completed{' '}
                    {formatDistanceToNow(new Date(job.completed_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleQuickEnroll(job.id)}>
                  Enroll
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <DotsThree size={16} weight="bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/send?jobId=${job.id}`}>Send one-off</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/jobs/${job.id}`}>View job</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {jobs.length > 5 && (
          <div className="mt-4 pt-4 border-t">
            <Link href="/jobs?status=completed&enrolled=false" className="text-sm text-primary hover:underline">
              Show all {jobs.length} jobs
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

async function handleQuickEnroll(jobId: string) {
  // Auto-match campaign by service type, or prompt if no match
  // Implementation in server action
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side data fetching (useEffect + fetch) | Server Components with parallel Promise.all() | Next.js 13 App Router (2023) | Eliminates waterfalls, reduces client JS, improves LCP |
| Separate loading spinners per widget | Skeleton loaders matching final layout | 2024-2025 UX standard | Reduces perceived load time, prevents layout shift |
| Generic "View All" CTAs on KPI cards | Clickable entire card with contextual filter navigation | 2025-2026 dashboard trend | Reduces clicks, makes metrics actionable |
| Flat list of all notifications | Severity-sorted alerts with contextual inline actions | 2025 cybersecurity dashboard UX | Prioritizes critical items, reduces alert fatigue |
| Client-side theme toggle with inline colors | CSS variables for theme-aware colors | Tailwind 3.0+ (2023) | System-wide dark mode, reduces conditional logic |

**Deprecated/outdated:**
- useEffect + useState for dashboard data: Server Components eliminate client-side fetching overhead
- Static skeleton loaders (non-matching structure): Cause layout shift, hurt CLS scores
- Global "Retry All" buttons: Don't account for different failure types (bounced email vs rate limit)

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal KPI comparison period calculation**
   - What we know: CONTEXT.md specifies activity metrics weekly, outcome metrics monthly
   - What's unclear: How to calculate "vs last week" when current week is incomplete (show partial week comparison or wait until week ends?)
   - Recommendation: Compare rolling 7-day period to previous 7 days for activity metrics; compare calendar month-to-date to same days in previous month for outcomes

2. **Service-type breakdown chart library**
   - What we know: Analytics page should show response rate and review rate by service type
   - What's unclear: No charting library currently in package.json; need to choose (Recharts, Chart.js, or Tremor)
   - Recommendation: Add Tremor (tremor.so) - lightweight, Tailwind-based, matches existing design system, specifically built for dashboards

3. **Navigation badge update mechanism**
   - What we know: Dashboard nav item should show attention item count badge
   - What's unclear: Badge needs to update across all pages when alerts resolve; requires global state or refetch pattern
   - Recommendation: Use Next.js revalidatePath() after alert resolution actions; badge count comes from server in AppShell layout

4. **"Smart enroll" campaign matching fallback**
   - What we know: Quick enroll should auto-match campaign by service type; prompt if no match exists
   - What's unclear: What's the exact prompt UX - inline modal, redirect to campaign create, or default campaign suggestion?
   - Recommendation: Inline dialog: "No campaign for [service type]. Enroll in default campaign or create service-specific campaign?" with two action buttons

## Sources

### Primary (HIGH confidence)
- Next.js App Router Data Fetching: https://nextjs.org/learn/dashboard-app/fetching-data
- Next.js Parallel Data Fetching Patterns: https://nextjs.org/docs/app/getting-started/fetching-data
- Project codebase: package.json, globals.css, tailwind.config.ts, existing component patterns
- User decisions: C:\AvisLoop\.planning\phases\27-dashboard-redesign\27-CONTEXT.md
- Existing data queries: lib/data/send-logs.ts, lib/data/campaign.ts, lib/data/jobs.ts, lib/data/feedback.ts

### Secondary (MEDIUM confidence)
- Dashboard Design Principles 2026: https://www.designrush.com/agency/ui-ux-design/dashboard/trends/dashboard-design-principles
- Notification Design UX Patterns: https://www.toptal.com/designers/ux/notification-design
- PatternFly Status/Severity Patterns: https://www.patternfly.org/patterns/status-and-severity/
- Tremor Dashboard Components: https://www.tremor.so/
- React Loading Skeleton Best Practices: https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/

### Tertiary (LOW confidence)
- Next.js Dashboard Best Practices 2026: https://www.ksolves.com/blog/next-js/best-practices-for-saas-dashboards
- Cybersecurity Dashboard UX (Alert Fatigue): https://medium.com/design-bootcamp/alert-fatigue-and-dashboard-overload-why-cybersecurity-needs-better-ux-1f3bd32ad81c
- Material Tailwind KPI Cards: https://www.material-tailwind.com/blocks/kpi-cards

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, verified via package.json and codebase
- Architecture patterns: HIGH - Next.js Server Components and parallel fetching verified via official docs
- Dashboard UI patterns: MEDIUM - Verified via multiple design system sources (Tremor, Material Tailwind, PatternFly) but not project-specific
- Service-type urgency logic: HIGH - Business logic defined in CONTEXT.md and Phase 22 service_type_timing schema
- Pitfalls: HIGH - Derived from Next.js official docs (waterfalls) and established UX patterns (layout shift, contextual actions)

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable patterns, but Next.js/React evolve quarterly)
