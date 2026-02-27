# Phase 47: Dashboard Right Panel + Campaign Polish + Radix Select - Research

**Researched:** 2026-02-26
**Domain:** Data visualization (sparklines), UI polish (activity feed, campaign detail), Radix Select migration
**Confidence:** HIGH

---

## Summary

Phase 47 touches four independent areas: (1) sparkline graphs inside the right panel KPI cards, (2) colored activity feed icons in the right panel, (3) touch sequence template preview modals and campaign detail page visual refresh, and (4) migrating native `<select>` elements in job forms to Radix Select components.

**No charting library is installed.** The project has zero dependencies on recharts, D3, nivo, or any other visualization package. For the compact sparkline use-case (a single-series trend curve inside a ~280×40px card footer area), a hand-rolled SVG `<polyline>` or `<path>` is the correct solution — it adds zero bundle weight, has no SSR issues, and is fully controllable with theme CSS variables. This approach is used widely in production for mini sparklines. The `ssr: false` dynamic import guard the plan mentions is still relevant if a Recharts component is preferred as a fallback, but SVG is the simpler path.

The Radix Select component already exists at `components/ui/select.tsx` and is already used throughout the codebase (e.g., `touch-sequence-editor.tsx`). The migration in `service-type-select.tsx` and the inline `<select>` elements in `add-job-sheet.tsx` and `edit-job-sheet.tsx` is straightforward: replace `<select onChange>` with `<Select onValueChange>` using the existing Shadcn wrapper.

The template preview modal uses the existing `Dialog` primitive from `components/ui/dialog.tsx`. No new libraries needed.

**Primary recommendation:** Implement sparklines as inline SVG components (no library needed). Use `dynamic({ ssr: false })` wrapping only if a library is chosen instead. All other work uses already-installed UI primitives.

---

## Standard Stack

### Core — Already Installed, No New Packages Required

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@radix-ui/react-select` | installed | Radix Select primitive | Already wrapped in `components/ui/select.tsx` |
| `@radix-ui/react-dialog` | installed | Template preview modal | Already wrapped in `components/ui/dialog.tsx` |
| `@phosphor-icons/react` | installed | Colored activity icons | Use `weight="fill"` for colored circle style |
| `react` / `next` | installed | Dynamic import + SVG | `next/dynamic` for SSR guard if needed |

### For Sparklines — Recommendation: Hand-Rolled SVG (No Install)

No library required. A minimal SVG path/polyline implementation covers all needs:

- Fixed data points (14 days, up to 14 values)
- Single color stroke matching KPI accent
- Optional gradient fill
- Empty state: dashed horizontal line at zero
- No interactivity required (read-only trend visual)

**If recharts is preferred later**, install with `pnpm add recharts`. The `AreaChart`/`LineChart` with `ResponsiveContainer` works, but requires `dynamic(() => import(...), { ssr: false })` in any Server Component context. The KPI cards are inside `right-panel-default.tsx` which is already `'use client'`, so SSR isn't a hard blocker — but the library still costs ~60KB+ in bundle.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled SVG | recharts AreaChart | recharts adds ~60KB bundle, overkill for mini sparklines; SVG is simpler and theme-aware |
| Hand-rolled SVG | CSS-only bar chart | Bar doesn't show trend curves well for time-series; SVG is more expressive |
| Radix Dialog | Sheet | Dialog is correct for a preview modal (centered, focused); Sheet is for side-panel workflows |

**Installation (only if recharts chosen):**
```bash
pnpm add recharts
```

---

## Architecture Patterns

### Recommended Project Structure (Files to Create/Modify)

```
components/
├── dashboard/
│   ├── right-panel-default.tsx      MODIFY — add sparklines, colored icons, clickable items
│   └── sparkline.tsx                CREATE — reusable SVG sparkline component
│
├── campaigns/
│   ├── touch-sequence-editor.tsx    MODIFY — add "Preview" button per touch
│   └── template-preview-modal.tsx  CREATE — Dialog with email frame / SMS bubble
│
└── jobs/
    ├── service-type-select.tsx      MODIFY — replace native <select> with Radix Select
    ├── add-job-sheet.tsx            MODIFY — replace status <select> with Radix Select
    └── edit-job-sheet.tsx           MODIFY — replace status <select> with Radix Select

lib/
└── data/
    └── dashboard.ts                 MODIFY — add getDashboardKPIHistory() for 14-day buckets

lib/
└── types/
    └── dashboard.ts                 MODIFY — extend KPIMetric with history?: DayBucket[]

app/
└── (dashboard)/
    └── campaigns/[id]/
        └── page.tsx                 MODIFY — visual retouch for enrollment rows, stats section
```

### Pattern 1: Hand-Rolled SVG Sparkline Component

**What:** A pure SVG component that renders a polyline from an array of `{date, value}` data points.
**When to use:** Mini trend graphs inside cards where interactivity is not needed.

```typescript
// components/dashboard/sparkline.tsx
'use client'

interface SparklineProps {
  data: number[]         // ordered values, oldest first
  color: string          // CSS color string matching KPI accent
  height?: number        // default 36
  width?: number         // default '100%' via SVG viewBox
  isEmpty?: boolean      // show dashed line when < 2 data points
}

// Core logic:
// 1. Normalize values to [0, height] range
// 2. Map to SVG coordinate pairs: x = index/(n-1) * width, y = height - normalized
// 3. Render as <polyline> with stroke=color, fill=none
// 4. For gradient fill: <defs><linearGradient> + <polygon> with last two points closing to bottom
// 5. Empty state: single <line> with strokeDasharray="4 2" at y=height/2

export function Sparkline({ data, color, height = 36, isEmpty }: SparklineProps) {
  if (isEmpty || data.length < 2) {
    // Dashed flat line
    return (
      <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="w-full">
        <line x1="0" y1="18" x2="100" y2="18" stroke="currentColor"
              strokeWidth="1" strokeDasharray="4 2" className="text-muted-foreground/30" />
      </svg>
    )
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 100
  const h = 36

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
```

**Confidence:** HIGH — standard pattern for mini sparklines in React, no library needed.

### Pattern 2: KPI History Data Pipeline

**What:** Extend `getDashboardKPIs()` in `lib/data/dashboard.ts` with a parallel query for 14 daily buckets per metric.

**Key insight:** The existing `getDashboardKPIs()` returns single scalar values. Adding `history` means bucketing `send_logs.created_at` and `customer_feedback.submitted_at` into 14 daily count groups. This is done efficiently with a `generate_series` approach in SQL or by fetching the raw rows and bucketing in JS.

**Recommended approach:** Fetch 14 days of raw count data per metric using Supabase's `.gte()` filter against `date_trunc('day', created_at)`. Then group in JS (no Postgres RPC needed):

```typescript
// Extend KPIMetric type:
export interface DayBucket {
  date: string   // YYYY-MM-DD
  value: number
}

export interface KPIMetric {
  value: number
  previousValue: number
  trend: number
  trendPeriod: string
  history?: DayBucket[]   // 14 daily data points, oldest first
}
```

**DB query strategy (reviews history example):**
```typescript
// Fetch last 14 days of reviewed send_logs in one query
const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

const { data: reviewHistory } = await supabase
  .from('send_logs')
  .select('reviewed_at')
  .eq('business_id', businessId)
  .not('reviewed_at', 'is', null)
  .gte('reviewed_at', fourteenDaysAgo.toISOString())

// JS bucketing:
function bucketByDay(timestamps: string[], days: number): DayBucket[] {
  const buckets: Record<string, number> = {}
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    buckets[d.toISOString().slice(0, 10)] = 0
  }
  for (const ts of timestamps) {
    const day = new Date(ts).toISOString().slice(0, 10)
    if (day in buckets) buckets[day]++
  }
  return Object.entries(buckets).map(([date, value]) => ({ date, value }))
}
```

**Confidence:** HIGH — this pattern avoids Postgres RPC dependencies and uses existing Supabase client patterns.

### Pattern 3: Radix Select Migration

**What:** Replace native `<select onChange>` with Shadcn `Select` (`onValueChange`).
**Key difference:** Radix Select uses `onValueChange: (value: string) => void`, not `onChange: (e: ChangeEvent) => void`.

```typescript
// Source: Radix UI Primitives docs, components/ui/select.tsx (already in codebase)

// BEFORE (native):
<select
  value={status}
  onChange={(e) => setStatus(e.target.value as JobStatus)}
  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ..."
>
  {statuses.map(s => <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>)}
</select>

// AFTER (Radix):
<Select value={status} onValueChange={(val) => setStatus(val as JobStatus)}>
  <SelectTrigger className="w-full">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {statuses.map(s => (
      <SelectItem key={s} value={s}>{JOB_STATUS_LABELS[s]}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Files to change:**
1. `components/jobs/service-type-select.tsx` — The entire component is a native `<select>`. Migrate to Radix Select + export with same `onChange` prop signature. Handle the "placeholder" option (`value=""`) via Radix's `placeholder` on `SelectValue`.
2. `components/jobs/add-job-sheet.tsx` — Status `<select>` at line 282–296
3. `components/jobs/edit-job-sheet.tsx` — Status `<select>` at line 202–215

**Radix Select does not support `value=""`:** Empty string is a valid value in Radix Select, but the placeholder state requires `undefined` or no `value` prop. When `value` is an empty string (as in `ServiceTypeSelect` with `value: ServiceType | ''`), use `value={value || undefined}` to trigger the placeholder display.

```typescript
// ServiceTypeSelect: handle empty value for placeholder
<Select value={value || undefined} onValueChange={(val) => onChange(val as ServiceType)}>
  <SelectTrigger className={error ? 'border-destructive' : ''}>
    <SelectValue placeholder="Select service type..." />
  </SelectTrigger>
  ...
</Select>
```

**Confidence:** HIGH — verified against Radix docs and existing usage in `touch-sequence-editor.tsx`.

### Pattern 4: Template Preview Modal

**What:** "Preview" button per touch in `TouchSequenceEditor` opens a `Dialog` showing template content.
**Challenge:** Template content must be fetched — either passed in from parent or fetched on-demand.

**Recommended approach:** Pass templates array (already available as prop in `TouchSequenceEditor`) down and resolve the selected template or the system default template. For system defaults (when `template_id === null`), the current templates array passed to the editor only contains user-owned templates. System templates need to be fetched separately.

**Data flow options:**
1. **Pass system templates too:** Modify `getAvailableTemplates()` call site at `app/(dashboard)/campaigns/[id]/page.tsx` — it already calls `getAvailableTemplates()` which includes `is_default = true` templates. These are already in the `templates` prop passed to `CampaignForm` → `TouchSequenceEditor`. So system templates ARE available in the templates prop for business-enabled service types.
2. **Fetch on open:** If the selected template is not in the array (could happen if user has no matching system template), use a server action to fetch by ID on preview-open.

**Preferred approach (simpler):** Use the templates already passed as prop. For "Use default template" (`template_id = null`), look up the matching system template by channel + service_type from the templates array. Display a "no template found" fallback if none exists.

**Modal structure:**
```typescript
// Email preview: email-like frame
<div className="bg-muted/30 rounded-md p-4">
  <div className="text-xs text-muted-foreground mb-1 font-medium">Subject</div>
  <div className="text-sm font-medium mb-4">{template.subject}</div>
  <Separator />
  <div className="mt-4 text-sm whitespace-pre-wrap font-mono text-xs leading-relaxed">
    {template.body}
  </div>
</div>

// SMS preview: chat bubble
<div className="flex justify-end">
  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%] text-sm">
    {template.body}
  </div>
</div>
<p className="text-xs text-muted-foreground text-right mt-1">
  {template.body.length} / 160 chars
</p>
```

**Confidence:** HIGH — uses existing `Dialog` component and template data already in scope.

### Pattern 5: Colored Activity Feed Icons

**What:** Replace the current monochrome `Icon` rendering in the event list with colored circle badges.
**Current state:** Icons are `text-muted-foreground` with no background circle.
**Target:** Colored circle with white icon inside (or tinted background with colored icon).

**Recommended style: tinted background circle** (matches warm design system better than solid fills):

```typescript
function getEventIconStyle(type: CampaignEvent['type']) {
  switch (type) {
    case 'review_click':
      return {
        bg: 'bg-success-bg',          // light green
        icon: 'text-success',          // green icon
        Icon: Star,
      }
    case 'touch_sent':
      return {
        bg: 'bg-info-bg',             // light blue
        icon: 'text-info',             // blue icon
        Icon: PaperPlaneTilt,
      }
    case 'feedback_submitted':
      return {
        bg: 'bg-warning-bg',          // light amber/orange
        icon: 'text-warning',          // orange icon
        Icon: ChatCircleText,
      }
    case 'enrollment':
      return {
        bg: 'bg-muted',
        icon: 'text-muted-foreground',
        Icon: UserPlus,
      }
  }
}

// Render:
<div className={cn('flex items-center justify-center rounded-full w-6 h-6 shrink-0', style.bg)}>
  <style.Icon size={12} weight="fill" className={style.icon} />
</div>
```

**Color semantics per requirements:**
- Green = reviews (`review_click`) → use `bg-success-bg` / `text-success`
- Blue = sends (`touch_sent`) → use `bg-info-bg` / `text-info`
- Orange = feedback (`feedback_submitted`) → use `bg-warning-bg` / `text-warning`

**Confidence:** HIGH — uses existing semantic tokens from `globals.css` and `tailwind.config.ts`.

### Pattern 6: Clickable Activity Items

**What:** Each activity item should navigate to relevant detail on click.
**Current state:** Items are `<div>` with no click handler.
**Target:** Wrap each item in a `<Link>` or give it an `onClick` handler.

**Navigation targets by event type:**
- `touch_sent` → `/history` (no direct send log ID available in CampaignEvent type — link to history page)
- `review_click` → `/history?status=reviewed`
- `feedback_submitted` → `/feedback`
- `enrollment` → `/campaigns` (or campaign detail if `campaignId` were available)

**Note:** The `CampaignEvent` type does not currently include the raw send log ID or feedback ID for deep-linking. For now, type-level links are sufficient (per design decision). If direct deep-links are needed, `CampaignEvent` would need raw IDs added.

**Confidence:** HIGH for type-level links; MEDIUM for deep-links (requires type extension).

### Anti-Patterns to Avoid

- **Installing recharts just for sparklines:** Overkill for 14-point, single-series, non-interactive mini charts. SVG is correct.
- **`onChange` on Radix Select:** Radix `Select` uses `onValueChange`, not `onChange`. Using `onChange` will silently do nothing.
- **Passing `value=""` to Radix Select:** Empty string does not trigger placeholder. Use `value={val || undefined}`.
- **Inline accordion for template preview:** User decision is modal. Don't use collapsible.
- **Rendering sparklines in Server Components:** If using recharts, `ResponsiveContainer` needs `ResizeObserver` (client-only). Use `'use client'` guard.
- **Fetching template body in a new server action for every preview open:** Templates are already passed as a prop to `TouchSequenceEditor`. Use the existing prop.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template preview modal | Custom overlay/portal | `Dialog` from `components/ui/dialog.tsx` | Already handles focus trap, backdrop, animations, accessibility |
| Styled select dropdown | CSS-styled native select | Radix `Select` from `components/ui/select.tsx` | Already handles keyboard nav, portal, mobile behavior |
| Icon color logic | Inline style objects | Tailwind semantic token classes (`bg-success-bg`, etc.) | Automatic dark mode, consistent with design system |
| Day bucketing | Postgres RPC | JS bucketing of raw timestamps | Simpler, avoids migration, uses existing Supabase client |

**Key insight:** Almost everything needed already exists in the project. The heavy lifting is wiring existing primitives together correctly, not building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Radix Select Empty Value / Placeholder
**What goes wrong:** `<Select value="">` does not show placeholder text; the trigger renders as empty.
**Why it happens:** Radix Select treats `""` as a valid selection, not an unselected state.
**How to avoid:** Use `value={value || undefined}` when the value can be an empty string.
**Warning signs:** Service type select shows blank trigger instead of "Select service type..."

### Pitfall 2: Sparkline SSR Mismatch (if recharts used)
**What goes wrong:** `ResponsiveContainer` calls `ResizeObserver` which doesn't exist in Node.js; results in hydration error.
**Why it happens:** recharts' `ResponsiveContainer` is not SSR-safe.
**How to avoid:** Use `next/dynamic(() => import('./SparklineChart'), { ssr: false })`. With hand-rolled SVG, this is a non-issue.
**Warning signs:** "ResizeObserver is not defined" error during `pnpm build`.

### Pitfall 3: Template Not Found for System Defaults
**What goes wrong:** A touch with `template_id = null` shows "Preview" button, but clicking it shows empty content.
**Why it happens:** `getAvailableTemplates()` filters system templates by `service_types_enabled`. If a campaign's service type is not in the business's enabled types, no system template is found.
**How to avoid:** In preview modal, show a graceful "Using default template (preview not available)" message when no matching template is found. Don't crash.
**Warning signs:** Empty modal body on preview open for system default templates.

### Pitfall 4: Activity Item Clickability — Items Not Actually Navigating
**What goes wrong:** `<div onClick={() => router.push(href)}>` doesn't work if rendered inside a `<Link>` ancestor.
**Why it happens:** Nested `<Link>` + `<Link>` causes conflicts; nested `<a>` is invalid HTML.
**How to avoid:** Make the entire item a `<Link>` element (not a nested button). Remove any outer `<Link>` if the item itself is wrapped.
**Warning signs:** Click does nothing or causes navigation to wrong page.

### Pitfall 5: Pipeline Counter Row Layout Breaking
**What goes wrong:** The compact 3-column pipeline row (`div.grid grid-cols-3 divide-x`) loses its layout when KPI cards get taller (due to sparkline being added).
**Why it happens:** The pipeline row is intentionally compact and must NOT be promoted to a card.
**How to avoid:** The sparkline goes INSIDE each KPI card, not below all cards. The pipeline row is a separate section that follows after. Verify layout at narrow right-panel widths (360px).
**Warning signs:** Pipeline row wraps or gets unintended padding/card styling.

### Pitfall 6: Campaign Detail — Enrollment Row Touch Number Display
**What goes wrong:** `current_touch` on `campaign_enrollments` shows the NEXT touch to send (1-indexed), not the last completed touch.
**Why it happens:** `current_touch` is "next touch to send", so for a completed enrollment at touch 2, `current_touch = 3`.
**How to avoid:** Display as "Touch {current_touch - 1} of {totalTouches} completed" for active enrollments, or use `touch_{n}_sent_at` fields to count actual sent touches.
**Warning signs:** Active enrollment showing "Touch 3 of 3" when only 2 touches have been sent.

---

## Code Examples

### Hand-Rolled SVG Sparkline (Complete)
```typescript
// Source: Pattern derived from standard SVG sparkline technique
'use client'

interface SparklineProps {
  data: number[]
  color: string
  height?: number
  className?: string
}

export function Sparkline({ data, color, height = 36, className }: SparklineProps) {
  if (data.length < 2) {
    return (
      <svg
        viewBox="0 0 100 36"
        preserveAspectRatio="none"
        className={className}
        style={{ width: '100%', height }}
        aria-hidden="true"
      >
        <line
          x1="4" y1="18" x2="96" y2="18"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 3"
          className="text-muted-foreground/25"
        />
      </svg>
    )
  }

  const w = 100
  const h = 36
  const pad = 2
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - pad * 2) + pad
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const polylinePoints = pts.join(' ')

  // Gradient fill path: polyline + close to bottom
  const firstPt = pts[0]
  const lastPt = pts[pts.length - 1]
  const fillPath = `M ${pts.join(' L ')} L ${lastPt.split(',')[0]},${h} L ${firstPt.split(',')[0]},${h} Z`

  const gradientId = `spark-${color.replace(/[^a-z]/gi, '')}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height }}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
```

### Radix Select for ServiceTypeSelect
```typescript
// Source: existing Radix Select usage in touch-sequence-editor.tsx + Radix docs
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'

// Handle empty value for placeholder:
<Select value={value || undefined} onValueChange={(val) => onChange(val as ServiceType)}>
  <SelectTrigger className={cn('w-full', error && 'border-destructive')}>
    <SelectValue placeholder="Select service type..." />
  </SelectTrigger>
  <SelectContent>
    {availableTypes.flatMap(type => {
      if (type === 'other' && customServiceNames?.length) {
        return customServiceNames.map(name => (
          <SelectItem key={`other-${name}`} value="other">{name}</SelectItem>
        ))
      }
      return <SelectItem key={type} value={type}>{SERVICE_TYPE_LABELS[type]}</SelectItem>
    })}
  </SelectContent>
</Select>
```

### KPI History Query Addition
```typescript
// Extend getDashboardKPIs() — add parallel queries for history
// Source: existing dashboard.ts query patterns

function bucketByDay(timestamps: string[], days: number): { date: string; value: number }[] {
  const now = new Date()
  const buckets: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    buckets[d.toISOString().slice(0, 10)] = 0
  }
  for (const ts of timestamps) {
    const day = new Date(ts).toISOString().slice(0, 10)
    if (day in buckets) buckets[day]++
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }))
}

// In getDashboardKPIs(), add to Promise.all:
supabase
  .from('send_logs')
  .select('reviewed_at')
  .eq('business_id', businessId)
  .not('reviewed_at', 'is', null)
  .gte('reviewed_at', fourteenDaysAgo.toISOString())
  .select('reviewed_at')   // minimal fields
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Native `<select>` in job forms | Radix Select (`onValueChange`) | Phase 47 (this phase) | Consistent UI, keyboard accessible |
| Monochrome activity icons | Colored circle badges | Phase 47 (this phase) | Event type immediately visible |
| No sparklines on right panel KPIs | SVG area sparkline | Phase 47 (this phase) | Trend visible without navigating to analytics |

**Deprecated/outdated:**
- Native `<select>` in `service-type-select.tsx`, `add-job-sheet.tsx`, `edit-job-sheet.tsx`: Being replaced this phase.

---

## Open Questions

1. **Sparkline color values for right-panel KPI cards**
   - What we know: The right-panel KPI cards use the same three metrics as main KPIs (reviews=amber, rating=green, conversion=blue). The accent colors are hardcoded hex values in `kpi-widgets.tsx`: amber=`#F59E0B` equivalent, green=`#008236`, blue=`#2C879F`.
   - What's unclear: The right-panel cards currently use `text-amber-500`, `text-[#008236]`, `text-[#2C879F]` for their icons. Sparkline stroke color should match these exactly.
   - Recommendation: Extract these as constants and reuse in both the icon color and the sparkline stroke color. Example: `const REVIEW_COLOR = '#F59E0B'`.

2. **Touch preview for system templates when no service_type match**
   - What we know: `getAvailableTemplates()` filters system templates by `service_types_enabled`. A campaign may have a service type that's since been disabled.
   - What's unclear: Whether the campaign edit page re-fetches templates filtered to the campaign's service type specifically.
   - Recommendation: For template preview in `TouchSequenceEditor`, if `template_id = null` and no system template matches, show a message: "Using AI-generated default — no preview available." Don't block the UX.

3. **Activity item deep-link for `touch_sent` events**
   - What we know: `CampaignEvent` for `touch_sent` only has `id: string` (formatted as `touch-{send_log_id}`). The raw send log ID is parseable.
   - What's unclear: Whether `/history` supports filtering to a specific send log entry.
   - Recommendation: Link `touch_sent` items to `/history` (unfiltered). If deep-linking to specific records is desired, the `CampaignEvent` type needs a `rawId` field — defer to a follow-up phase.

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `components/dashboard/right-panel-default.tsx` — current activity feed and KPI card implementation
- Codebase inspection: `lib/data/dashboard.ts` — existing KPI query patterns, verified no history data returned currently
- Codebase inspection: `lib/types/dashboard.ts` — KPIMetric type, confirmed no `history` field exists
- Codebase inspection: `components/jobs/add-job-sheet.tsx` (lines 282–296) — native `<select>` for status, confirmed
- Codebase inspection: `components/jobs/edit-job-sheet.tsx` (lines 202–215) — native `<select>` for status, confirmed
- Codebase inspection: `components/jobs/service-type-select.tsx` — entire component uses native `<select>`
- Codebase inspection: `components/campaigns/touch-sequence-editor.tsx` — already uses Radix Select for channel/template; no "Preview" button
- Codebase inspection: `components/ui/select.tsx` — Radix Select wrapper, confirmed `onValueChange` API
- Codebase inspection: `components/ui/dialog.tsx` — Dialog primitive, confirmed available for preview modal
- Codebase inspection: `tailwind.config.ts` + `globals.css` — confirmed `bg-success-bg`, `bg-info-bg`, `bg-warning-bg` semantic tokens available
- `/websites/radix-ui_primitives` Context7 — Select `onValueChange` and empty value behavior

### Secondary (MEDIUM confidence)
- `/recharts/recharts` Context7 — Recharts API verified current (v3.x), but not used since SVG is preferred
- Standard SVG sparkline technique — widely established pattern, no single authoritative source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new packages needed; all primitives confirmed in codebase
- Architecture: HIGH — All patterns derived from existing codebase conventions
- Pitfalls: HIGH — All pitfalls derived from actual code inspection (Radix empty value, current_touch semantics, etc.)

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (stable libraries; SVG pattern is timeless)
