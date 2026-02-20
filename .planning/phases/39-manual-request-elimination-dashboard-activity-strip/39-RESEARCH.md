# Phase 39: Manual Request Elimination & Dashboard Activity Strip - Research

**Researched:** 2026-02-19
**Domain:** Next.js App Router page removal, component extraction, dashboard UI replacement
**Confidence:** HIGH

## Summary

This phase involves four interrelated changes: (1) removing the `/send` page from navigation and replacing it with a redirect, (2) extracting the QuickSendTab into a modal that lives on the Campaigns page and Customer detail drawer, (3) adding a one-off send option in the Add Job flow, and (4) replacing the dashboard's 3 bottom pipeline metric cards with a compact RecentCampaignActivity strip.

The codebase investigation reveals clear boundaries for all four changes. The `/send` page has 7 server queries, 13 child components, and is referenced in 8+ locations across the codebase. The dashboard pipeline cards are self-contained within `kpi-widgets.tsx` and consume 3 fields from the `DashboardKPIs` type. The existing `QuickSendTab` component is well-encapsulated with clear props, making extraction into a Dialog-based modal straightforward. The Add Job sheet already has status-based conditional sections (campaign enrollment checkbox), providing a natural insertion point for a one-off send toggle.

**Primary recommendation:** Execute in 4 plans: (1) audit server queries and build the activity strip data layer, (2) replace dashboard pipeline cards with the activity strip, (3) extract QuickSendModal and integrate it into Campaigns page, (4) add one-off send to Add Job and implement the /send redirect last.

## Standard Stack

This phase uses no new libraries. All work is within the existing stack.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | latest | Page redirect via `redirect()` from `next/navigation` | Project standard |
| @radix-ui/react-dialog | 1.1.15 | QuickSendModal wrapper (Dialog component) | Already used for EmailPreviewModal |
| @phosphor-icons/react | 2.1.10 | Icons for activity strip and modal | Project icon library |
| date-fns | 4.1.0 | `formatDistanceToNow` for relative timestamps | Already used in RecentActivityStrip |
| sonner | 2.0.7 | Toast notifications for friction warning | Already used throughout |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-table | 8.21.3 | NOT needed -- BulkSendTab is being removed, not migrated | Do NOT use |
| @radix-ui/react-tabs | 1.1.13 | NOT needed in modal -- Quick Send only, no tabs | Do NOT use |

**Installation:** No new packages needed. Zero dependency additions.

## Architecture Patterns

### Pattern 1: Page Redirect (Permanent)

The project has a direct precedent in `app/(dashboard)/contacts/page.tsx`:

```typescript
// Source: C:/AvisLoop/app/(dashboard)/contacts/page.tsx
import { redirect } from 'next/navigation'

export default function ContactsRedirect() {
  redirect('/customers')
}
```

For `/send`, use `permanentRedirect` (HTTP 308) since the Send page is permanently gone, not temporarily moved. This tells browsers and crawlers to update bookmarks. The `redirect()` function (HTTP 307) is for conditional routing like auth checks.

```typescript
// Source: Next.js docs - https://nextjs.org/docs/app/api-reference/functions/permanentRedirect
import { permanentRedirect } from 'next/navigation'

export default function SendRedirect() {
  permanentRedirect('/campaigns')
}
```

**Key difference from contacts redirect:** Use `permanentRedirect` not `redirect`. The contacts page used `redirect` because it was a rename during migration. The send page is a permanent architectural removal.

### Pattern 2: Component Extraction into Modal

The existing `EmailPreviewModal` in `components/send/email-preview-modal.tsx` demonstrates the project's Dialog modal pattern:

```typescript
// Source: C:/AvisLoop/components/send/email-preview-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface QuickSendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // ... props
}

export function QuickSendModal({ open, onOpenChange, ...props }: QuickSendModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Send One-Off Request</DialogTitle>
        </DialogHeader>
        {/* Extracted quick send form */}
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 3: Dashboard Activity Strip

The existing `RecentActivityStrip` in `components/send/recent-activity-strip.tsx` provides the exact pattern for the new dashboard activity strip -- a horizontal strip with clickable items, status badges, and relative timestamps. The new `RecentCampaignActivity` component follows the same layout but shows campaign events instead of send log entries.

The dashboard currently has this layout:
```
KPIWidgets (top 3 outcome cards + bottom 3 pipeline cards)
ReadyToSendQueue
AttentionAlerts
```

After this phase:
```
KPIWidgets (top 3 outcome cards ONLY)
RecentCampaignActivity (strip with inline counters)
ReadyToSendQueue
AttentionAlerts
```

### Pattern 4: Add Job One-Off Send Toggle

The Add Job sheet (`components/jobs/add-job-sheet.tsx`) already has a conditional section pattern for status-based UI:

```typescript
// Source: C:/AvisLoop/components/jobs/add-job-sheet.tsx lines 238-254
{status === 'completed' && (
  <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
    <div className="flex items-center space-x-2">
      <Checkbox
        id="enrollInCampaign"
        checked={enrollInCampaign}
        onCheckedChange={(checked) => setEnrollInCampaign(!!checked)}
      />
      <Label htmlFor="enrollInCampaign" className="font-normal cursor-pointer">
        Enroll in review campaign
      </Label>
    </div>
  </div>
)}
```

A new "Send one-off request instead" toggle can use the exact same pattern, appearing when `enrollInCampaign` is unchecked or as a mutually exclusive alternative.

### Recommended Project Structure Changes

```
components/
├── send/
│   ├── quick-send-form.tsx          # NEW: Extracted form (no modal wrapper)
│   ├── quick-send-modal.tsx         # NEW: Dialog wrapper around QuickSendForm
│   ├── quick-send-tab.tsx           # KEEP until redirect added, then DELETE
│   ├── send-page-client.tsx         # DELETE after redirect
│   ├── bulk-send-tab.tsx            # DELETE after redirect
│   ├── bulk-send-*.tsx              # DELETE after redirect (3 files)
│   ├── stat-strip.tsx               # DELETE after redirect
│   ├── recent-activity-strip.tsx    # DELETE after redirect (replaced by dashboard version)
│   ├── send-settings-bar.tsx        # KEEP (used by QuickSendForm)
│   ├── channel-selector.tsx         # KEEP (used by QuickSendForm)
│   ├── message-preview.tsx          # KEEP (used by QuickSendForm)
│   ├── email-preview-modal.tsx      # KEEP (used by QuickSendForm)
│   └── sms-character-counter.tsx    # KEEP (used by QuickSendForm)
├── dashboard/
│   ├── kpi-widgets.tsx              # MODIFY: Remove bottom 3 cards, keep type
│   ├── recent-campaign-activity.tsx # NEW: Activity strip component
│   └── ...                          # Existing components unchanged
└── campaigns/
    └── ...                          # Add QuickSendModal trigger button
```

### Anti-Patterns to Avoid

- **Deleting the send page before verifying query migration:** The 7 server queries on the send page must all have confirmed new homes before the redirect is added. Deleting queries that other pages depend on will cause runtime failures.
- **Using `redirect()` for a permanent removal:** Use `permanentRedirect()` (308) not `redirect()` (307). The page is permanently gone, not conditionally redirected.
- **Keeping `/send` in middleware APP_ROUTES:** The route must remain in middleware's protected routes list even after the redirect, since the redirect page itself needs auth protection. However, it can eventually be removed if the permanentRedirect happens before auth check.
- **Making the QuickSendModal too complex:** The modal should be a simplified version of QuickSendTab -- single customer only, no bulk send, no stat strip, no recent activity. Add friction warning at the top.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal for one-off send | Custom overlay | Existing Dialog component from `@/components/ui/dialog` | Already used for EmailPreviewModal, handles focus trap, escape, overlay |
| Activity event formatting | Custom date formatter | `formatDistanceToNow` from date-fns | Already used in RecentActivityStrip and AttentionAlerts |
| Status badges in activity strip | Custom badge rendering | Existing `StatusBadge` from `@/components/history/status-badge.tsx` | Already handles all send statuses with proper colors and icons |
| Redirect implementation | Custom middleware logic | Next.js `permanentRedirect()` function | Framework-native, handles HTTP headers correctly |
| Friction warning banner | Custom alert | Reuse exact pattern from `send-page-client.tsx` lines 98-115 | Already styled with Warning icon, proper border/bg colors |

## Common Pitfalls

### Pitfall 1: Orphaned Server Queries

**What goes wrong:** Removing the `/send` page deletes server queries that the `stat-strip` and `recent-activity-strip` components rely on, but some of those queries (`getMonthlyUsage`, `getResponseRate`, `getNeedsAttentionCount`) provide data that might be needed elsewhere.
**Why it happens:** The send page fetches 7 different data sources in its `page.tsx`. Some are send-page-specific, others are general metrics.
**How to avoid:** Before adding the redirect, create a migration audit checklist:

| Query | File | New Home | Status |
|-------|------|----------|--------|
| `getCustomers({ limit: 200 })` | `lib/actions/customer.ts` | QuickSendModal will fetch its own customers | Verify |
| `getMonthlyUsage()` | `lib/data/send-logs.ts` | Billing page, QuickSendModal validation | Verify |
| `getResponseRate()` | `lib/data/send-logs.ts` | Analytics page already has this | Verify |
| `getNeedsAttentionCount()` | `lib/data/send-logs.ts` | Dashboard AttentionAlerts | Verify |
| `getRecentActivity(5)` | `lib/data/send-logs.ts` | New RecentCampaignActivity strip | Replace with campaign-focused query |
| `getRecentActivityFull(5)` | `lib/data/send-logs.ts` | Activity/History page | Verify |
| `getResendReadyCustomers()` | `lib/data/send-logs.ts` | Bulk send removed; not needed | Can delete |

**Warning signs:** Build errors after deleting send page components but before adding the redirect.

### Pitfall 2: revalidatePath References to /send

**What goes wrong:** Multiple server actions call `revalidatePath('/send')` or `revalidatePath('/dashboard/send')`. After the redirect, these are wasted calls that may cause console warnings.
**Why it happens:** 8 revalidatePath calls reference `/send`:
- `lib/actions/contact.ts:80` - `revalidatePath('/send')`
- `lib/actions/customer.ts:88` - `revalidatePath('/send')`
- `lib/actions/send-sms.action.ts:171,212,225` - `revalidatePath('/dashboard/send')`
- `lib/actions/schedule.ts:83` - `revalidatePath('/send')`
- `lib/actions/send.ts:211,521` - `revalidatePath('/dashboard/send')`
**How to avoid:** Replace all `/send` revalidation paths with `/campaigns` (or remove them if the action is only used from the send page). This is a cleanup task to include after the redirect is added.
**Warning signs:** Stale data on campaigns page after sending from QuickSendModal.

### Pitfall 3: Customer Detail Drawer `onSend` Navigation

**What goes wrong:** The customer detail drawer's "Send Message" button (`customer-detail-drawer.tsx` line 263-269) calls `onSend(customer)` which in `customers-client.tsx` line 103-106 does `router.push('/send')`. After the redirect, this will bounce the user to `/campaigns` without context.
**Why it happens:** The drawer's send action was designed to navigate to the send page, not open a modal.
**How to avoid:** Change the `onSend` handler to open the QuickSendModal directly with the customer pre-filled, rather than navigating. This means `customers-client.tsx` needs to import and render `QuickSendModal`, and the `handleSendFromDrawer` function should set modal state instead of using `router.push`.

### Pitfall 4: Ready-to-Send Queue Link to /send

**What goes wrong:** The `ReadyToSendQueue` component (`ready-to-send-queue.tsx` line 155) has a "Send one-off" dropdown option that links to `/send?jobId=${job.id}`. After the redirect, this link loses the jobId query parameter.
**Why it happens:** The ready-to-send queue assumes `/send` exists and can accept query params for pre-filling.
**How to avoid:** Replace the link with a button that opens the QuickSendModal. The `ReadyToSendQueue` component needs to accept an `onSendOneOff` callback that the parent (dashboard page) provides, which triggers the modal.

### Pitfall 5: Middleware APP_ROUTES Still Lists /send

**What goes wrong:** If `/send` is removed from `middleware.ts` APP_ROUTES, the permanent redirect page won't be protected by auth middleware on the production app domain routing.
**Why it happens:** The middleware uses APP_ROUTES for both domain routing and auth protection.
**How to avoid:** Keep `/send` in APP_ROUTES. The redirect happens server-side in the page component, after middleware auth check. Alternatively, if using next.config.js redirects, the redirect happens before the page component and middleware handles it fine.

### Pitfall 6: Dashboard Activity Strip Data vs Existing Data

**What goes wrong:** The new RecentCampaignActivity strip needs campaign-specific events (touch sends, review clicks, feedback submissions, enrollment events), but the existing `getRecentActivity` query only returns send_logs data.
**Why it happens:** The send page's activity strip was send-focused; the dashboard strip needs to be campaign-automation-focused.
**How to avoid:** Create a new query function `getRecentCampaignEvents` that joins across `campaign_enrollments`, `send_logs`, and `customer_feedback` tables to produce a unified event feed. Do NOT reuse the existing `getRecentActivity` function.

## Code Examples

### Example 1: QuickSendForm Extraction

The `QuickSendTab` component at `components/send/quick-send-tab.tsx` (549 lines) needs to be split into a reusable form and a modal wrapper.

```typescript
// components/send/quick-send-form.tsx -- Extracted from quick-send-tab.tsx
// Remove: recent customers chips (send-page specific)
// Remove: autocomplete (simplify to basic customer selector)
// Keep: customer search, channel selector, template selector, message preview, send button
// Add: friction warning at top

interface QuickSendFormProps {
  customers: Customer[]
  business: Business & { message_templates?: MessageTemplate[] }
  templates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
  prefilledCustomer?: Customer | null  // NEW: For opening from customer drawer
  onSuccess?: () => void              // NEW: Callback after successful send
}
```

### Example 2: QuickSendModal

```typescript
// components/send/quick-send-modal.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Warning } from '@phosphor-icons/react'
import Link from 'next/link'
import { QuickSendForm } from './quick-send-form'
import type { Customer, Business, MessageTemplate } from '@/lib/types/database'

interface QuickSendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  business: Business & { message_templates?: MessageTemplate[] }
  templates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
  prefilledCustomer?: Customer | null
}

export function QuickSendModal({
  open,
  onOpenChange,
  prefilledCustomer,
  ...formProps
}: QuickSendModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send One-Off Request</DialogTitle>
          <DialogDescription>
            For edge cases only. Campaigns handle review requests automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Friction warning */}
        <div className="flex items-start gap-3 rounded-lg border border-warning-border bg-warning-bg p-4">
          <Warning className="h-5 w-5 text-warning shrink-0 mt-0.5" weight="fill" />
          <div className="text-sm">
            <p className="font-medium text-warning-foreground">
              Campaigns handle review requests automatically
            </p>
            <p className="mt-1 text-warning">
              Manual sending is for one-off situations. For ongoing follow-up, set up a{' '}
              <Link href="/campaigns" className="underline font-medium hover:text-warning-foreground">
                campaign
              </Link>{' '}instead.
            </p>
          </div>
        </div>

        <QuickSendForm
          {...formProps}
          prefilledCustomer={prefilledCustomer}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
```

### Example 3: RecentCampaignActivity Data Query

```typescript
// lib/data/dashboard.ts -- New function
export interface CampaignEvent {
  id: string
  type: 'touch_sent' | 'review_click' | 'feedback_submitted' | 'enrollment'
  customerName: string
  campaignName: string
  touchNumber?: number
  channel?: 'email' | 'sms'
  status?: string
  timestamp: string
}

export async function getRecentCampaignEvents(
  businessId: string,
  limit: number = 5
): Promise<CampaignEvent[]> {
  const supabase = await createClient()

  // Query recent send_logs with campaign attribution
  const { data: recentSends } = await supabase
    .from('send_logs')
    .select(`
      id, status, channel, touch_number, created_at,
      customers!send_logs_customer_id_fkey(name),
      campaigns!send_logs_campaign_id_fkey(name)
    `)
    .eq('business_id', businessId)
    .not('campaign_id', 'is', null)  // Only campaign sends
    .order('created_at', { ascending: false })
    .limit(limit)

  // Query recent feedback submissions
  const { data: recentFeedback } = await supabase
    .from('customer_feedback')
    .select(`
      id, rating, submitted_at,
      customers!inner(name),
      campaign_enrollments!inner(campaigns!inner(name))
    `)
    .eq('business_id', businessId)
    .order('submitted_at', { ascending: false })
    .limit(limit)

  // Merge, sort, and return top N events
  // ... merge logic
}
```

### Example 4: RecentCampaignActivity Strip Component

```typescript
// components/dashboard/recent-campaign-activity.tsx
'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, PaperPlaneTilt, Star, ChatCircleText, UserPlus } from '@phosphor-icons/react'
import type { CampaignEvent } from '@/lib/data/dashboard'

interface RecentCampaignActivityProps {
  events: CampaignEvent[]
  pipelineSummary: {
    activeSequences: number
    pending: number
  }
  onEventClick?: (event: CampaignEvent) => void
}

const eventIcons: Record<CampaignEvent['type'], typeof PaperPlaneTilt> = {
  touch_sent: PaperPlaneTilt,
  review_click: Star,
  feedback_submitted: ChatCircleText,
  enrollment: UserPlus,
}

export function RecentCampaignActivity({
  events,
  pipelineSummary,
  onEventClick,
}: RecentCampaignActivityProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border bg-card px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Recent Campaign Activity</span>
          <span className="text-sm text-muted-foreground">
            No campaign activity yet -- complete a job to get started
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Recent Campaign Activity</span>
          {/* Inline pipeline counters */}
          <span className="text-xs text-muted-foreground">
            {pipelineSummary.activeSequences} active sequences
            {pipelineSummary.pending > 0 && ` \u00b7 ${pipelineSummary.pending} pending`}
          </span>
        </div>
        <Link
          href="/history"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          View All
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

      <div className="space-y-2">
        {events.slice(0, 5).map((event) => {
          const Icon = eventIcons[event.type]
          return (
            <button
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
            >
              <Icon size={16} weight="regular" className="text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1">
                {/* Event description */}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

### Example 5: /send Permanent Redirect

```typescript
// app/(dashboard)/send/page.tsx -- Replaced content
import { permanentRedirect } from 'next/navigation'

export const metadata = {
  title: 'Redirecting...',
}

export default function SendPage() {
  permanentRedirect('/campaigns')
}
```

### Example 6: Add Job One-Off Send Toggle

```typescript
// Addition to components/jobs/add-job-sheet.tsx
// After the campaign enrollment checkbox, add mutually exclusive one-off option

{status === 'completed' && !enrollInCampaign && (
  <div className="space-y-2 rounded-lg border border-warning-border bg-warning-bg/30 p-4">
    <div className="flex items-center space-x-2">
      <Checkbox
        id="sendOneOff"
        checked={sendOneOff}
        onCheckedChange={(checked) => setSendOneOff(!!checked)}
      />
      <Label htmlFor="sendOneOff" className="font-normal cursor-pointer">
        Send one-off review request instead
      </Label>
    </div>
    <p className="text-xs text-muted-foreground ml-6">
      Sends a single manual request. For recurring follow-up, use campaign enrollment above.
    </p>
  </div>
)}
```

## Server Query Audit (Critical for Plan 39-01)

The `/send` page (file: `app/(dashboard)/send/page.tsx`) makes these 7 server queries:

| # | Query | Source | Used By | New Home After Removal |
|---|-------|--------|---------|------------------------|
| 1 | `getBusiness()` | `lib/actions/business.ts` | Business context | QuickSendModal fetches own business |
| 2 | `getCustomers({ limit: 200 })` | `lib/actions/customer.ts` | Customer autocomplete | QuickSendModal fetches own customers |
| 3 | `getMonthlyUsage()` | `lib/data/send-logs.ts` | Usage limit display + validation | QuickSendModal needs this for validation |
| 4 | `getResponseRate()` | `lib/data/send-logs.ts` | StatStrip component | Analytics page (already exists) |
| 5 | `getNeedsAttentionCount()` | `lib/data/send-logs.ts` | StatStrip component | Dashboard AttentionAlerts (already exists) |
| 6 | `getRecentActivity(5)` | `lib/data/send-logs.ts` | RecentActivityStrip | Replaced by RecentCampaignActivity (new query) |
| 7 | `getResendReadyCustomers()` | `lib/data/send-logs.ts` | BulkSendTab resend badges | DELETED (bulk send removed entirely) |

**Key finding:** Queries #4, #5, and #7 have no new home to worry about (they are already duplicated or being deleted). Queries #1, #2, #3 must be available to the QuickSendModal. Query #6 is replaced by a new campaign-focused query.

## All /send References (Critical for Plan 39-04)

Every file that references `/send` and needs updating:

| File | Line | Reference | Action |
|------|------|-----------|--------|
| `middleware.ts` | 15 | `APP_ROUTES` array | KEEP (auth protection for redirect page) |
| `components/layout/sidebar.tsx` | 41 | Nav item `{ href: '/send' }` | REMOVE from mainNav array |
| `components/layout/bottom-nav.tsx` | 15 | Nav item `{ href: '/send' }` | REMOVE from items array |
| `components/customers/customers-client.tsx` | 104 | `router.push('/send')` | CHANGE to open QuickSendModal |
| `components/dashboard/ready-to-send-queue.tsx` | 155 | `Link href="/send?jobId="` | CHANGE to QuickSendModal trigger |
| `lib/data/dashboard.ts` | 357 | `href: '/send?retry='` | CHANGE to retry action or different route |
| `components/history/empty-state.tsx` | 34 | `Link href="/send"` | CHANGE to `/campaigns` or `/jobs` |
| `lib/actions/contact.ts` | 80 | `revalidatePath('/send')` | CHANGE to `/campaigns` |
| `lib/actions/customer.ts` | 88 | `revalidatePath('/send')` | CHANGE to `/campaigns` |
| `lib/actions/schedule.ts` | 83 | `revalidatePath('/send')` | CHANGE to `/campaigns` |
| `lib/actions/send.ts` | 211, 521 | `revalidatePath('/dashboard/send')` | CHANGE to `/campaigns` |
| `lib/actions/send-sms.action.ts` | 171, 212, 225 | `revalidatePath('/dashboard/send')` | CHANGE to `/campaigns` |

## DashboardKPIs Type Impact

The `DashboardKPIs` interface in `lib/types/dashboard.ts` has 6 fields. The bottom 3 pipeline fields must be retained for the inline counters in the activity strip:

```typescript
export interface DashboardKPIs {
  // KEEP - Outcome metrics (top 3 cards stay)
  reviewsThisMonth: KPIMetric
  averageRating: KPIMetric
  conversionRate: KPIMetric

  // KEEP TYPE but REMOVE CARDS - Pipeline metrics become inline counters
  requestsSentThisWeek: KPIMetric   // Used in activity strip counter
  activeSequences: KPIMetric         // Used in activity strip counter
  pendingQueued: KPIMetric           // Used in activity strip counter
}
```

The `getDashboardKPIs` function in `lib/data/dashboard.ts` continues to fetch all 6 metrics. The `kpi-widgets.tsx` component removes the bottom 3 Card renderings. The pipeline values are passed to `RecentCampaignActivity` as `pipelineSummary`.

## Files to Delete After Completion

After the redirect is in place and all references updated:

| File | Reason |
|------|--------|
| `components/send/send-page-client.tsx` | Parent component for send page, no longer needed |
| `components/send/bulk-send-tab.tsx` | Bulk send feature removed entirely |
| `components/send/bulk-send-columns.tsx` | Bulk send table columns |
| `components/send/bulk-send-action-bar.tsx` | Bulk send action bar |
| `components/send/bulk-send-confirm-dialog.tsx` | Bulk send confirmation |
| `components/send/stat-strip.tsx` | Send page stat strip |
| `components/send/recent-activity-strip.tsx` | Replaced by dashboard RecentCampaignActivity |
| `app/(dashboard)/send/loading.tsx` | Loading skeleton for removed page |

Files to KEEP (used by QuickSendForm/Modal):
- `components/send/quick-send-tab.tsx` -- RENAME/REFACTOR to `quick-send-form.tsx`
- `components/send/send-settings-bar.tsx`
- `components/send/channel-selector.tsx`
- `components/send/message-preview.tsx`
- `components/send/email-preview-modal.tsx`
- `components/send/sms-character-counter.tsx`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dedicated Send page with tabs | Modal-based one-off send | This phase | Aligns with V2 "automation first" philosophy |
| Pipeline metrics as dedicated cards | Inline counters in activity strip | This phase | Dashboard focuses on outcomes, not pipeline |
| `redirect()` (307) for page moves | `permanentRedirect()` (308) for removals | Next.js 14+ | Better SEO, browsers cache the redirect |

## Open Questions

1. **QuickSendModal data fetching strategy**
   - What we know: The modal needs customers, business, templates, and monthly usage. These were server-fetched on the send page.
   - What's unclear: Should the modal fetch its own data via server actions when opened, or should the parent page (Campaigns) pre-fetch and pass down?
   - Recommendation: Pre-fetch business and templates on the Campaigns page (already fetched there). For customers, use a lightweight server action that fetches on modal open (avoid loading 200 customers on every Campaigns page load). Monthly usage can be fetched alongside customers in the modal open action.

2. **Bottom nav item count after /send removal**
   - What we know: Mobile bottom nav currently has 5 items (Dashboard, Jobs, Campaigns, Activity, Manual). Removing Manual leaves 4 items.
   - What's unclear: Should a 5th item be added back, or is 4 items acceptable?
   - Recommendation: Use 4 items. The grid changes from `grid-cols-5` to `grid-cols-4`, giving each item more space. Alternatively, add Feedback or Analytics as the 5th item.

3. **Activity strip event types and data model**
   - What we know: The strip should show "touch sends, review clicks, feedback submissions, enrollment events"
   - What's unclear: The `send_logs` table tracks sends and reviews, `customer_feedback` tracks feedback, but "enrollment events" are not explicitly tracked as events (only `campaign_enrollments.enrolled_at` exists).
   - Recommendation: Build the event feed from: (a) `send_logs` WHERE `campaign_id IS NOT NULL` for touch sends, (b) `send_logs` WHERE `reviewed_at IS NOT NULL` for review clicks, (c) `customer_feedback` for feedback submissions, (d) `campaign_enrollments` for enrollment events. Union and sort by timestamp.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: All files listed above were read directly from the repository
- `app/(dashboard)/send/page.tsx` - 7 server queries identified
- `components/send/quick-send-tab.tsx` - 549 lines, full component structure analyzed
- `components/dashboard/kpi-widgets.tsx` - Pipeline card structure confirmed
- `lib/data/dashboard.ts` - DashboardKPIs query implementation verified
- `lib/types/dashboard.ts` - Type definitions confirmed
- `components/layout/sidebar.tsx` - Nav structure with `/send` at line 41
- `components/layout/bottom-nav.tsx` - Mobile nav with `/send` at line 15
- `components/jobs/add-job-sheet.tsx` - Add Job form with conditional sections

### Secondary (MEDIUM confidence)
- [Next.js redirect docs](https://nextjs.org/docs/app/api-reference/functions/redirect) - `redirect()` returns 307
- [Next.js permanentRedirect docs](https://nextjs.org/docs/app/api-reference/functions/permanentRedirect) - `permanentRedirect()` returns 308
- [Next.js redirecting guide](https://nextjs.org/docs/app/building-your-application/routing/redirecting) - Best practices for App Router redirects

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all existing project libraries
- Architecture: HIGH - All patterns verified against existing codebase implementations
- Pitfalls: HIGH - Every reference to `/send` was traced via grep, all server queries enumerated
- Activity strip data: MEDIUM - The query for campaign events needs to be validated against actual table data

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable, no external dependencies changing)
