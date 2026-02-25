# Architecture Patterns: v2.5.2 UX Bugs & UI Fixes

**Project:** AvisLoop v2.5.2 — UX Polish, Drawer Consistency, KPI Redesign, Campaign Pause Fixes
**Researched:** 2026-02-25
**Confidence:** HIGH (direct codebase analysis of all relevant files)

---

## Overview

This document answers: how do v2.5.2 changes integrate with the existing component architecture? It covers six distinct integration questions, maps each to specific files, and provides a dependency-safe build order.

The codebase is well-structured for this class of changes:

- Sheet component already has `SheetHeader`, `SheetFooter`, `SheetContent` primitives — sticky footer is a layout addition, not a primitive change
- Button CVA already uses a clean variant/size matrix — adding a variant is additive
- KPI widgets (`kpi-widgets.tsx`) are pure display components with no side effects — redesigning them does not cascade
- Campaign enrollment logic is already well-separated: `toggleCampaignStatus` in `lib/actions/campaign.ts` handles pause/resume; the "freeze vs stop" distinction is a behavioral change in one server action
- `TouchSequenceEditor` in `components/campaigns/touch-sequence-editor.tsx` is self-contained — template preview adds state but no structural coupling

The key architectural constraint: **no database schema changes are required for the core UX fixes**. Campaign pause/freeze behavior is purely a server action logic change. If a `frozen` enrollment status is desired, that requires a migration; the alternative of re-computing frozen state at query time avoids schema changes entirely.

---

## Existing Architecture Snapshot

```
App Shell (server layout)
├── Sidebar (desktop, client) — mainNav array + "Add Job" button
├── BottomNav (mobile, client) — 4 items: Dashboard, Jobs, Campaigns, Activity
└── Page content
    └── Various Sheet components (all via Radix Dialog / sheet.tsx)

Dashboard (/dashboard)
├── DashboardPage (server component — fetches all data, passes to DashboardClient)
├── DashboardClient (client, "outer")
│   ├── DashboardShell (provides DashboardPanelContext)
│   │   ├── Left column (children): DashboardContent
│   │   │   ├── KPISummaryBar (mobile tap to sheet)
│   │   │   ├── ReadyToSendQueue (queue rows with actions)
│   │   │   └── AttentionAlerts
│   │   └── RightPanel (desktop, 360px, hidden on mobile)
│   │       ├── default view: RightPanelDefault (compact KPI cards + pipeline + activity)
│   │       ├── job-detail view: RightPanelJobDetail
│   │       └── attention-detail view: RightPanelAttentionDetail
│   └── MobileBottomSheet (renders right panel content on mobile)

Drawers / Sheets (all use components/ui/sheet.tsx → Radix Dialog)
├── AddJobSheet (components/jobs/add-job-sheet.tsx) — form-only sheet
├── EditJobSheet (components/jobs/edit-job-sheet.tsx) — form-only sheet
├── JobDetailDrawer (components/jobs/job-detail-drawer.tsx) — detail + actions
├── CustomerDetailDrawer (components/customers/customer-detail-drawer.tsx) — detail + actions
├── AddCustomerSheet (components/customers/add-customer-sheet.tsx) — form-only
├── EditCustomerSheet (components/customers/edit-customer-sheet.tsx) — form-only
└── [campaign edit sheet at /campaigns/[id]]

Campaigns (/campaigns)
├── CampaignCard — card with inline toggle (pause/resume) + edit/duplicate/delete
├── CampaignForm — create/edit form with TouchSequenceEditor
└── TouchSequenceEditor — up to 4 touches (channel, delay, template selector)

lib/actions/campaign.ts
├── toggleCampaignStatus() — pause stops active enrollments ("stop_reason: campaign_paused")
├── createCampaign(), updateCampaign(), deleteCampaign(), duplicateCampaign()
└── stopEnrollment()

app/api/cron/process-campaign-touches/route.ts
└── Claims due touches via RPC, processes email/SMS per touch, updates enrollment
```

---

## Integration Point 1: Drawer Consistency Pattern

### Current state

Each sheet/drawer manages its own internal layout independently:

- `SheetContent` renders `flex flex-col gap-4 px-8` (from sheet.tsx line 63)
- `SheetHeader` renders `flex flex-col gap-1.5 py-8` (from sheet.tsx line 89-95)
- `SheetFooter` renders `mt-auto flex flex-col gap-2 py-8` (from sheet.tsx line 98-105)
- Most form sheets use scrollable content via `overflow-y-auto` on SheetContent or a wrapper div
- Footer buttons are placed at the bottom of the form `<form>` element, not using `SheetFooter`

Example from `add-job-sheet.tsx` (lines 307-321): cancel/submit buttons are inside the form with `pt-4` padding, not in a `SheetFooter`.

Example from `job-detail-drawer.tsx` (line 482): `<SheetContent side="right" className="sm:max-w-lg overflow-y-auto">` — the content scrolls entirely, including action buttons at bottom.

### What v2.5.2 needs

Consistent visual structure across all drawers:
1. Fixed header (SheetHeader) — does not scroll
2. Scrollable body — form fields or detail content
3. Sticky footer (SheetFooter) — action buttons always visible regardless of scroll position

### Integration approach

**Option A: Modify SheetContent in sheet.tsx**

Change SheetContent to use `flex flex-col h-full` and let children control overflow. This is the cleanest but requires verifying all existing sheet usage to avoid breakage.

Current SheetContent: `bg-background ... fixed z-50 flex flex-col gap-4 shadow-lg px-8 ...`

The `gap-4` between children (header, body, footer) and `px-8` global horizontal padding already provide structure. The issue is the body needs `overflow-y-auto flex-1` to scroll independently while header and footer stay fixed.

**Option B: Create a DrawerLayout wrapper component**

Create `components/ui/drawer-layout.tsx` that wraps the three-zone structure. Sheets opt in by using it.

```tsx
// components/ui/drawer-layout.tsx
function DrawerLayout({ header, footer, children }: {
  header: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0">{header}</div>
      <div className="flex-1 overflow-y-auto px-0">{children}</div>
      {footer && (
        <div className="shrink-0 border-t border-border bg-background py-4">
          {footer}
        </div>
      )}
    </div>
  )
}
```

**Recommendation: Option B** — Non-breaking. DrawerLayout wraps the three zones. SheetContent itself keeps its existing classes. Existing sheets not yet updated continue to work. Gradual rollout: update sheets one by one.

### Files to modify

| File | Change |
|------|--------|
| `components/ui/drawer-layout.tsx` | NEW — three-zone wrapper |
| `components/jobs/add-job-sheet.tsx` | Adopt DrawerLayout, move buttons to footer zone |
| `components/jobs/edit-job-sheet.tsx` | Adopt DrawerLayout |
| `components/jobs/job-detail-drawer.tsx` | Adopt DrawerLayout — action buttons become sticky footer |
| `components/customers/add-customer-sheet.tsx` | Adopt DrawerLayout |
| `components/customers/edit-customer-sheet.tsx` | Adopt DrawerLayout |
| `components/customers/customer-detail-drawer.tsx` | Adopt DrawerLayout |

### Dependency note

`DrawerLayout` has zero dependencies (pure layout). Build it first, then migrate sheets one by one. Each sheet migration is independent and safe to do separately.

---

## Integration Point 2: Sticky Footer in Sheet

### Current SheetContent layout

From `sheet.tsx` lines 60-86:

```
SheetContent
  flex flex-col gap-4 px-8 h-full (right side variant)
  └── children (all scroll together because nothing is flex-1 + overflow-y-auto)
```

`SheetFooter` already exists and uses `mt-auto` which pushes it to the bottom when content is short — but when content overflows, the footer scrolls away because the parent has no independent scroll region.

### What needs to change

The SheetContent `flex flex-col gap-4` layout needs the body between header and footer to scroll. Two surgical changes:

**Change 1: Remove gap-4 from SheetContent** (or keep it and handle with margins in DrawerLayout).

The `gap-4` between SheetHeader, body, SheetFooter currently provides visual spacing. Moving to DrawerLayout means SheetContent just provides the background + positioning (already does this). The DrawerLayout provides spacing internally.

**Change 2: If modifying sheet.tsx directly**, add a `SheetBody` subcomponent:

```tsx
function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex-1 overflow-y-auto", className)}
      {...props}
    />
  )
}
```

Then:
- SheetHeader: `shrink-0` (no vertical scroll)
- SheetBody: `flex-1 overflow-y-auto` (scrollable)
- SheetFooter: `shrink-0 border-t` (sticky)

**Recommendation:** Add `SheetBody` to `sheet.tsx` as an exported subcomponent. This is backward-compatible (existing sheets that don't use it are unaffected). Update `SheetFooter` to add `shrink-0 border-t border-border` to its default classes.

### Files to modify

| File | Change |
|------|--------|
| `components/ui/sheet.tsx` | Add `SheetBody` export, add `shrink-0` to SheetFooter |
| Individual sheet files | Use SheetBody + SheetFooter in each |

---

## Integration Point 3: Sparkline in KPI Cards

### Current KPI architecture

`kpi-widgets.tsx` renders the top row of KPI cards (Reviews This Month, Average Rating, Conversion Rate). These are `InteractiveCard` components wrapping a Link.

`right-panel-default.tsx` renders compact versions of the same 3 metrics in the right panel sidebar. Both render the same data via `DashboardKPIs` type.

`DashboardPage` (server component) fetches `getDashboardKPIs(business.id)` which returns `KPIMetric` objects with `value`, `previousValue`, `trend`, `trendPeriod`.

The `KPIMetric` type does NOT currently carry historical sparkline data — only the current value and a trend percentage. To add a sparkline, the data pipeline must also return time-series data.

### What sparkline requires

**Data layer change:**
- `getDashboardKPIs()` in `lib/data/dashboard.ts` needs to also return per-day counts for the last 30 days (or N days) for each metric
- This is an additional query (e.g., count send_logs grouped by day for the last 30 days)
- `KPIMetric` or a new `KPIMetricWithHistory` type needs a `history: number[]` field

**UI layer:**
- A `Sparkline` component is needed — either a custom SVG or a lightweight library
- `kpi-widgets.tsx` KPI cards receive and render the sparkline
- `right-panel-default.tsx` compact cards may optionally include a mini sparkline

**Sparkline implementation options:**

No sparkline library is currently in package.json. Options:

1. **Custom SVG sparkline** — ~30 lines, zero dependencies, works with any data. Simple polyline or path element. Recommended for bundle size.
2. **recharts** — Already a common choice in Next.js apps. Analytics page may already use it.
3. **react-sparklines** — Lightweight, purpose-built.

Check if recharts is used elsewhere:

```
lib/types/dashboard.ts — imports from lib/types/database only
app/(dashboard)/analytics/ — likely uses charts
```

**Recommendation:** Custom SVG sparkline. The data is simple (array of numbers), the rendering is simple (a line). No library needed.

```tsx
// components/ui/sparkline.tsx
function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const height = 24
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('overflow-visible', className)}>
      <polyline
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="stroke-current"
      />
    </svg>
  )
}
```

### Data flow changes

```
getDashboardKPIs()        → add history arrays per metric
  ↓
DashboardPage (server)    → passes kpiData with history to DashboardClient
  ↓
DashboardClient           → passes kpiData to KPIWidgets + RightPanelDefault
  ↓
kpi-widgets.tsx           → renders Sparkline in each card
right-panel-default.tsx   → optionally renders Sparkline in compact cards
```

`DashboardKPIs` type in `lib/types/dashboard.ts` needs updating: add `history?: number[]` to `KPIMetric` or add a separate `KPIMetricWithHistory` type.

### Files to modify

| File | Change |
|------|--------|
| `lib/types/dashboard.ts` | Add `history?: number[]` to `KPIMetric` |
| `lib/data/dashboard.ts` | Add per-day history query to `getDashboardKPIs()` |
| `components/ui/sparkline.tsx` | NEW — custom SVG sparkline |
| `components/dashboard/kpi-widgets.tsx` | Render sparkline in KPI cards |
| `components/dashboard/right-panel-default.tsx` | Optionally render sparkline in compact panel cards |

---

## Integration Point 4: Campaign Enrollment Pause/Freeze Database Changes

### Current pause behavior

`toggleCampaignStatus()` in `lib/actions/campaign.ts` (lines 433-477):

When pausing:
1. Sets `campaigns.status = 'paused'`
2. **Immediately stops all active enrollments** with `stop_reason: 'campaign_paused'`

This is a destructive operation — enrollments are permanently stopped. On resume, no enrollments are restored. The cron processor skips enrollments where `status != 'active'`, so paused campaign enrollments are dead.

The current `campaign_enrollments.status` enum is: `'active'`, `'completed'`, `'stopped'`.

### The freeze vs stop distinction

A "freeze" behavior would mean: pause temporarily without destroying enrollments, so resuming continues where it left off.

Two approaches:

**Option A: Add a `frozen` enrollment status (requires DB migration)**

New status: `'frozen'`

```sql
-- Migration needed
ALTER TABLE campaign_enrollments
  DROP CONSTRAINT campaign_enrollments_status_check;
ALTER TABLE campaign_enrollments
  ADD CONSTRAINT campaign_enrollments_status_check
  CHECK (status IN ('active', 'completed', 'stopped', 'frozen'));
```

On pause: set enrolled rows to `frozen` instead of `stopped`
On resume: set `frozen` rows back to `active`
Cron: skip `frozen` enrollments (already does this — checks `status = 'active'`)

The `stop_reason` column would need a corresponding migration note. `frozen` enrollments have no `stop_reason`.

RLS policies reference `status` in indexes (see DATA_MODEL.md): `idx_enrollments_touch_N_due` uses partial `WHERE status='active'`. Adding `frozen` does not break these indexes — frozen rows are just excluded.

**Option B: Use a `frozen_at` timestamp column (no enum change)**

Add `frozen_at TIMESTAMPTZ` to `campaign_enrollments`. No enum change needed.

On pause: set `frozen_at = NOW()` (enrollment stays `active` but cron skips it)
On resume: clear `frozen_at`
Cron: add `AND frozen_at IS NULL` to its WHERE clause for claiming touches

This avoids the status enum change but adds query complexity.

**Option C: Status quo — stop on pause, don't restore**

The simplest path. The current behavior is correct for the described bug fix scope if the issue is just "resume doesn't stop new enrollments properly" rather than "enrolled customers lose their sequence on pause."

**Recommendation:**

First, clarify what bug is being fixed:
- If the bug is "pausing a campaign stops existing enrollments but new jobs created after resume don't enroll" → this is a cron-side filter bug (cron checks `campaign.status = 'active'` before processing, and enrollments can be created even for paused campaigns). Fix: guard enrollment creation against paused campaigns.
- If the bug is "pausing a campaign should freeze (not stop) active sequences" → this requires Option A or B above.

**Minimal fix (most likely the actual bug):** Prevent `enrollJobInCampaign()` from enrolling into paused campaigns. The `enrollJobInCampaign` function in `lib/actions/enrollment.ts` queries campaigns with `eq('status', 'active')` only when given a specific `campaignId`. The `getActiveCampaignForJob()` function likely has its own filter. Verify this query includes `status = 'active'`.

**If full freeze is needed**, Option A (adding `frozen` status) is the cleanest approach since it:
- Fits the existing status state machine
- Requires one migration + one constraint change
- Cron naturally skips non-active rows
- No query complexity changes

### Cron processor impact

`app/api/cron/process-campaign-touches/route.ts` claims touches via RPC `claim_due_campaign_touches`. This RPC is a Supabase database function. If `frozen` status is added:

- The RPC's WHERE clause (inside the Postgres function) must also exclude `frozen` enrollments
- This requires updating the RPC in a Supabase migration

### Files to modify for pause/freeze fix

**Minimal fix (no DB change):**

| File | Change |
|------|--------|
| `lib/actions/enrollment.ts` | Verify `getActiveCampaignForJob()` filters by `status = 'active'`; verify `enrollJobInCampaign()` with explicit campaignId also checks status |
| `lib/actions/campaign.ts` | Audit resume path — currently `toggleCampaignStatus` just flips status to 'active' but stopped enrollments are not restored; add comment documenting this as intentional |

**Full freeze behavior (with DB migration):**

| File | Change |
|------|--------|
| `supabase/migrations/[timestamp]_add_frozen_enrollment_status.sql` | NEW — add `frozen` to status constraint, add `frozen_at` column |
| `lib/types/database.ts` | Update `EnrollmentStatus` type |
| `lib/actions/campaign.ts` | `toggleCampaignStatus`: pause sets status to `frozen`, resume sets `frozen` back to `active` |
| `lib/data/dashboard.ts` | Update queries that filter enrollments (ensure `frozen` is treated as not-active where needed) |
| Supabase RPC `claim_due_campaign_touches` | Update WHERE clause to exclude `frozen` |

---

## Integration Point 5: Template Preview in Touch Sequence

### Current TouchSequenceEditor

`components/campaigns/touch-sequence-editor.tsx` (lines 130-151):

The template selector is a simple `<Select>` dropdown:
```
Template
<Select>
  <SelectItem value="default">Use default template</SelectItem>
  {templates for channel}
</Select>
```

There is no preview. Selecting a template does not show its content.

### Integration approach

Add a "preview" button or expandable section below the template selector. When a template is selected (not "default"), show the template body.

`MessageTemplate` type from `lib/types/database.ts` has `id`, `name`, `subject`, `body`, `channel`. The `templates` array is already passed into `TouchSequenceEditor` as `MessageTemplate[]`, so no new data fetching is needed.

**Option A: Inline expand on select**

When `touch.template_id` is non-null, show a `<button>Preview</button>` that toggles an inline collapsed section with the template body.

State: `previewOpenIndex: number | null` added to `TouchSequenceEditor` component-level state.

**Option B: Popover preview**

Use a `Popover` (already imported via Radix in the project) triggered by a preview icon button next to the template selector.

**Recommendation: Option A (inline expand)** — simpler, no popover positioning concerns, works on mobile.

```tsx
// Inside TouchSequenceEditor, per-touch
const [previewOpen, setPreviewOpen] = useState(false)
const selectedTemplate = templates.find(t => t.id === touch.template_id)

{touch.template_id && selectedTemplate && (
  <div className="col-span-3">
    <button
      type="button"
      onClick={() => setPreviewOpen(!previewOpen)}
      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
    >
      <Eye size={12} />
      {previewOpen ? 'Hide preview' : 'Preview template'}
    </button>
    {previewOpen && (
      <div className="mt-2 p-3 rounded-md bg-muted/50 border text-xs font-mono whitespace-pre-wrap">
        {touch.channel === 'email' && selectedTemplate.subject && (
          <p className="font-semibold mb-1">Subject: {selectedTemplate.subject}</p>
        )}
        <p>{selectedTemplate.body}</p>
      </div>
    )}
  </div>
)}
```

Per-touch preview state can be managed inside the `.map()` via individual state objects, or by hoisting an object like `{ [index]: boolean }` into `TouchSequenceEditor`'s state.

Since `TouchSequenceEditor` is a controlled component (all state lives outside it, pushed via `onChange`), preview-open state is the only local state it needs.

### Files to modify

| File | Change |
|------|--------|
| `components/campaigns/touch-sequence-editor.tsx` | Add preview toggle state + template body display per touch |

No new components needed. No data fetching changes. No prop changes to parent components.

---

## Integration Point 6: Button Variant Addition to CVA

### Current button.tsx CVA

`components/ui/button.tsx` (lines 7-39) defines 6 variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.

Adding a new variant is purely additive — CVA supports adding entries to the `variant` object. No existing usage changes.

### Where new variants might be needed

Based on the v2.5.2 scope description referencing "button hierarchy":

1. **A muted/tertiary variant** — for less-prominent actions that need to be visible but not compete with `outline`. Example: inline meta-actions in drawer footers.

2. **A success variant** — `job-detail-drawer.tsx` already manually applies `className="... text-success-foreground border-success/40 hover:bg-success-bg"` on the "Complete" button (line 604). This inline Tailwind is the anti-pattern that a `success` variant would replace.

3. **A warning variant** — similar pattern might exist elsewhere.

### Adding a variant

```tsx
// In buttonVariants, add to variants.variant:
success: "bg-success-bg text-success-foreground border border-success/40 hover:bg-success-bg/80",
warning: "bg-warning-bg text-warning-foreground border border-warning/40 hover:bg-warning-bg/80",
muted: "bg-muted text-muted-foreground hover:bg-muted/80",
```

These use semantic tokens (`success-bg`, `warning-bg`) that are already defined in the globals.css warm palette (added in v2.5).

**Verification needed:** Check that `--success-bg`, `--warning-bg`, `--success-foreground`, `--warning-foreground` are defined in `app/globals.css`. If they are semantic CSS custom properties, the variant works. If they are ad-hoc Tailwind classes, the mapping may differ.

### Files to modify

| File | Change |
|------|--------|
| `components/ui/button.tsx` | Add 1-3 new variant entries to `buttonVariants` CVA object |
| `components/jobs/job-detail-drawer.tsx` | Replace inline success className with `variant="success"` |
| Other files with inline success/warning button styling | Replace with new variant |

---

## Integration Point 7: Navigation Label Changes

### Current navigation

`components/layout/sidebar.tsx` (lines 32-39) defines `mainNav` as a static array:
```tsx
const mainNav: NavItem[] = [
  { icon: House, label: 'Dashboard', href: '/dashboard' },
  { icon: Briefcase, label: 'Jobs', href: '/jobs' },
  { icon: Megaphone, label: 'Campaigns', href: '/campaigns' },
  { icon: ChartBar, label: 'Analytics', href: '/analytics' },
  { icon: ClockCounterClockwise, label: 'Activity', href: '/history' },
  { icon: ChatCircleText, label: 'Feedback', href: '/feedback' },
]
```

`components/layout/bottom-nav.tsx` (lines 10-15) defines 4 items: Dashboard, Jobs, Campaigns, Activity.

Both are simple string changes with no downstream dependencies. The `label` is used only for display in the link text and `title` attribute (for collapsed state).

### Files to modify

| File | Change |
|------|--------|
| `components/layout/sidebar.tsx` | Change label strings in `mainNav` array |
| `components/layout/bottom-nav.tsx` | Change label strings in `items` array |

---

## Integration Point 8: Queue Row White Background / Visual Styling

### Current queue row styling

`components/dashboard/ready-to-send-queue.tsx` (lines 616-620):

```tsx
<div
  className={cn(
    'flex items-center justify-between transition-colors',
    isSelected ? 'bg-muted' : 'hover:bg-muted/50',
  )}
>
```

Rows are transparent by default, hover to `bg-muted/50`, selected state uses `bg-muted`. There is no explicit white/card background on rows.

### Integration approach

To add white/card background to each row:
```tsx
className={cn(
  'flex items-center justify-between transition-colors rounded-md',
  isSelected ? 'bg-muted' : 'bg-card hover:bg-muted/30',
)}
```

If the whole queue section needs a card background wrapper, that's in the parent `<div id="ready-to-send-queue">` which currently has no background class.

This is a 1-line CSS class change. No component restructuring.

### Files to modify

| File | Change |
|------|--------|
| `components/dashboard/ready-to-send-queue.tsx` | Adjust `cn()` call on each queue row div |

---

## Component Map: New vs Modified

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| `DrawerLayout` | `components/ui/drawer-layout.tsx` | Three-zone wrapper for drawer consistency |
| `SheetBody` | `components/ui/sheet.tsx` (added export) | Scrollable middle zone for sheets |
| `Sparkline` | `components/ui/sparkline.tsx` | SVG sparkline for KPI cards |

### Modified Components

| Component | File | Nature of Change |
|-----------|------|-----------------|
| Button CVA | `components/ui/button.tsx` | Add 1-3 new variants (success, warning, muted) |
| SheetFooter | `components/ui/sheet.tsx` | Add `shrink-0 border-t` to default className |
| KPIWidgets | `components/dashboard/kpi-widgets.tsx` | Render sparkline in each card |
| RightPanelDefault | `components/dashboard/right-panel-default.tsx` | Optionally render sparkline in compact cards |
| ReadyToSendQueue | `components/dashboard/ready-to-send-queue.tsx` | Row background styling |
| AddJobSheet | `components/jobs/add-job-sheet.tsx` | Adopt DrawerLayout |
| EditJobSheet | `components/jobs/edit-job-sheet.tsx` | Adopt DrawerLayout |
| JobDetailDrawer | `components/jobs/job-detail-drawer.tsx` | Adopt DrawerLayout + replace inline success variant |
| AddCustomerSheet | `components/customers/add-customer-sheet.tsx` | Adopt DrawerLayout |
| EditCustomerSheet | `components/customers/edit-customer-sheet.tsx` | Adopt DrawerLayout |
| CustomerDetailDrawer | `components/customers/customer-detail-drawer.tsx` | Adopt DrawerLayout |
| TouchSequenceEditor | `components/campaigns/touch-sequence-editor.tsx` | Add per-touch template preview |
| toggleCampaignStatus | `lib/actions/campaign.ts` | Audit/fix pause behavior |
| enrollJobInCampaign | `lib/actions/enrollment.ts` | Verify paused campaign guard |
| Sidebar | `components/layout/sidebar.tsx` | Nav label changes |
| BottomNav | `components/layout/bottom-nav.tsx` | Nav label changes |
| KPIMetric type | `lib/types/dashboard.ts` | Add `history?: number[]` field |
| getDashboardKPIs | `lib/data/dashboard.ts` | Add history queries |

---

## Data Flow Changes

### Sparkline data flow

```
lib/data/dashboard.ts
  getDashboardKPIs()
    + query: SELECT date_trunc('day', ...), COUNT(*) FROM send_logs
             GROUP BY day ORDER BY day DESC LIMIT 30
    → adds history: number[] to each KPIMetric

lib/types/dashboard.ts
  KPIMetric interface
    + history?: number[]

app/(dashboard)/dashboard/page.tsx
  DashboardPage (server)
    kpiData now includes history arrays
    → passed unchanged to DashboardClient

components/dashboard/kpi-widgets.tsx
  KPIWidgets
    + receives history via kpiData.reviewsThisMonth.history
    + renders <Sparkline data={history} />
```

### Campaign pause/freeze flow

**Current (buggy if enrolling into paused campaigns is possible):**
```
User creates job → markJobComplete() → enrollJobInCampaign()
  → getActiveCampaignForJob() — fetches campaign WHERE status = 'active' ✓
  → but: enrollJobInCampaign(jobId, { campaignId: uuid }) does a direct select
     WITHOUT status filter — need to verify
```

**Fixed minimal path:**
```
enrollJobInCampaign() with explicit campaignId
  + add .eq('status', 'active') to campaign select query
  → returns null if campaign paused → skip enrollment
```

**Fixed freeze path (if freeze behavior is chosen):**
```
toggleCampaignStatus() pause:
  + set enrollments status = 'frozen' (was 'stopped')
toggleCampaignStatus() resume:
  + set enrollments status = 'active' WHERE status = 'frozen'

cron claim_due_campaign_touches RPC:
  + WHERE enrollment.status = 'active' (already excludes frozen)
```

---

## Build Order

The build order is driven by two constraints:
1. Low-level utilities before consumers
2. Database changes before any code that depends on new columns/types

### Recommended sequence

**Group 1: Foundation (no dependencies)**
1. `components/ui/button.tsx` — add new variants (pure additive, no deps, used everywhere)
2. `components/ui/sheet.tsx` — add `SheetBody`, update `SheetFooter` (additive to Radix wrapper)
3. `components/ui/sparkline.tsx` — new pure component (pure SVG, no deps)
4. `components/ui/drawer-layout.tsx` — new pure layout wrapper (no deps)

**Group 2: Navigation labels (trivial, independent)**
5. `components/layout/sidebar.tsx` — string changes only
6. `components/layout/bottom-nav.tsx` — string changes only

**Group 3: Dashboard queue styling (independent)**
7. `components/dashboard/ready-to-send-queue.tsx` — CSS class change, no deps

**Group 4: Campaign enrollment pause fix (verify first)**
8. `lib/actions/enrollment.ts` — verify/add paused campaign guard
9. `lib/actions/campaign.ts` — audit pause/freeze behavior

**Group 5: Sparkline data pipeline (depends on Group 1 for types)**
10. `lib/types/dashboard.ts` — add `history` field to `KPIMetric`
11. `lib/data/dashboard.ts` — add history queries to `getDashboardKPIs`
12. `components/dashboard/kpi-widgets.tsx` — render sparkline (depends on type + Sparkline component)
13. `components/dashboard/right-panel-default.tsx` — optional sparkline in compact cards

**Group 6: Drawer migrations (depends on DrawerLayout + SheetBody from Group 1)**
14. `components/jobs/job-detail-drawer.tsx` — adopt DrawerLayout + success variant
15. `components/jobs/add-job-sheet.tsx` — adopt DrawerLayout
16. `components/jobs/edit-job-sheet.tsx` — adopt DrawerLayout
17. `components/customers/customer-detail-drawer.tsx` — adopt DrawerLayout
18. `components/customers/add-customer-sheet.tsx` — adopt DrawerLayout
19. `components/customers/edit-customer-sheet.tsx` — adopt DrawerLayout

**Group 7: Campaign touch preview (depends on nothing new)**
20. `components/campaigns/touch-sequence-editor.tsx` — add template preview toggle

**Optional Group 8: Full freeze behavior (requires DB migration first)**
21. `supabase/migrations/[timestamp]_add_frozen_enrollment_status.sql`
22. `lib/types/database.ts` — update `EnrollmentStatus` union type
23. `lib/actions/campaign.ts` — update freeze/thaw logic
24. Supabase RPC update (via new migration file)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| SheetContent layout change | Adding `overflow-y-auto` to a wrapper inside `SheetContent` may double-scroll if SheetContent itself also has `overflow-y-auto` | Remove `overflow-y-auto` from individual sheet className when adopting DrawerLayout |
| Sparkline data query | Querying 30 days of daily counts in `getDashboardKPIs()` adds to an already-parallel set of queries; may need its own index | Add `created_at` index on `send_logs` if not present |
| `SheetFooter` `mt-auto` behavior | Currently uses `mt-auto` to push footer down when content is short. With `shrink-0` and `flex-1` on body, `mt-auto` on footer is no longer needed and may add unexpected space | Remove `mt-auto` from SheetFooter default className when adding `shrink-0` |
| Campaign freeze migration | `claim_due_campaign_touches` RPC is a Postgres function not visible in TypeScript files; the freeze status filter must be added there too | Run `supabase functions list` or check `supabase/migrations/` for RPC definition before implementing |
| Button new variants | If semantic tokens like `--success-bg` are not defined in globals.css, the new variant classes will silently render with wrong colors | Search `app/globals.css` for `success-bg` before writing variant classes |
| Template preview state in TouchSequenceEditor | `TouchSequenceEditor` is a controlled component but preview state is purely local UI state; multiple touches each needing independent preview state | Use an array of booleans `previewOpen: boolean[]` keyed by touch index |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Drawer/Sheet architecture | HIGH | Read all sheet files directly; patterns are clear |
| Button CVA extension | HIGH | Read button.tsx; additive change confirmed safe |
| KPI card sparkline | HIGH | Read kpi-widgets.tsx, dashboard types, data flow fully mapped |
| Campaign pause/freeze | MEDIUM | `toggleCampaignStatus` code is clear; `claim_due_campaign_touches` RPC body not readable from TS files — need to check Supabase migrations |
| Template preview | HIGH | Read touch-sequence-editor.tsx fully; state pattern is straightforward |
| Navigation labels | HIGH | Read sidebar.tsx and bottom-nav.tsx; trivial string changes |

---

*Research completed: 2026-02-25*
*Method: Direct codebase analysis of all relevant component, action, and type files*
