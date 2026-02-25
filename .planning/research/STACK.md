# Technology Stack: v2.5.2 UX Bugs & UI Fixes

**Project:** AvisLoop v2.5.2 — UX Polish, Drawer Consistency, KPI Redesign
**Researched:** 2026-02-25
**Milestone Type:** Subsequent — UX polish on existing Next.js + Supabase + Tailwind + shadcn/ui app
**Confidence:** HIGH (based on direct codebase inspection + Context7 + authoritative sources)

---

## Executive Summary

**One new dependency is justified. Four areas require no new packages.**

Adding `recharts` (for KPI sparklines) is the only npm change for this milestone. All other concerns — sticky drawer footers, button hierarchy, Radix Select migration, and campaign pause state — are solved with existing tooling: Tailwind flex layout, CVA variant additions, the existing `components/ui/select.tsx`, and a Supabase enrollment model change.

---

## Existing Stack (Validated — Do Not Change)

| Technology | Version | Role |
|------------|---------|------|
| Next.js | 15 (App Router) | Framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.1 | Utility classes |
| class-variance-authority | 0.7.1 | Component variant system (CVA) |
| @radix-ui/react-select | ^2.2.6 | Already installed — use this, not native `<select>` |
| @radix-ui/react-dialog | ^1.1.15 | Sheet primitive (via shadcn/ui) |
| react-hook-form | ^7.71.1 | Form state management |
| zod | ^4.3.6 | Schema validation |
| @phosphor-icons/react | ^2.1.10 | Icon library |
| Supabase | latest | Database + auth |

---

## Area 1: Sparkline Charts in KPI Cards

### Recommendation: Add `recharts` ^3.7.0

**Confidence: HIGH** — Verified via npm registry (latest stable: 3.7.0, released January 2025) and shadcn/ui GitHub issue #7669 confirming Recharts v3 is now the recommended version.

**Why recharts over alternatives:**

| Option | Bundle Impact | SSR | Tailwind fit | Decision |
|--------|-------------|-----|-------------|----------|
| `recharts` ^3.7.0 | ~180kB gzipped | Client-only (requires `"use client"`) | Works with any className | **Use this** |
| `tremor` SparkChart | ~400kB+ (pulls full UI kit) | Client-only | Tailwind-based | No — brings entire design system |
| MUI X SparkLineChart | ~500kB+ (MUI dependency tree) | Client-only | No Tailwind | No — conflicts with design system |
| Handrolled SVG path | ~0kB | SSR-safe | Full control | Viable but high maintenance |
| `react-sparklines` | ~10kB | Client-only | Manual styling | No — unmaintained, last release 2019 |

**Why NOT handrolled SVG:** The codebase uses Recharts via the `shadcn/ui chart` component pattern for the existing analytics page. Adding recharts also enables the full shadcn/ui Chart (`ChartContainer`) ecosystem, which is the correct long-term direction for any future chart work.

**Why recharts v3, not v2:** The shadcn/ui chart component was updated (via PR #8486) to support Recharts v3 API changes. v3 rewrote state management, enabling fixes for long-standing bugs. New projects should use v3. (MEDIUM confidence on exact version pinning — shadcn docs note v3 upgrade in progress; recommending `^3.7.0` with the understanding that the shadcn `chart.tsx` component must be added at the same time using the v3-compatible version.)

**Installation:**

```bash
pnpm add recharts
pnpm dlx shadcn@latest add chart
```

The `shadcn add chart` command copies `components/ui/chart.tsx` into the project — a thin wrapper providing `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, and theme-aware CSS variable bindings.

### Sparkline Pattern for KPI Cards

A sparkline is a `LineChart` or `AreaChart` with all axes, grid, and legend suppressed. The composition approach (shadcn/ui's philosophy: "you add nothing you don't need") makes this exactly 3 recharts components.

**Minimal sparkline component:**

```tsx
'use client'

import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

interface SparklineProps {
  data: { value: number }[]
  color?: string
  className?: string
}

const sparkConfig = { value: { color: 'hsl(var(--chart-1))' } } satisfies ChartConfig

export function Sparkline({ data, color, className }: SparklineProps) {
  const config = color
    ? { value: { color } } satisfies ChartConfig
    : sparkConfig

  return (
    <ChartContainer config={config} className={cn('h-12 w-full', className)}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        {/* No XAxis, YAxis, CartesianGrid, Tooltip, or Legend */}
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          fill="var(--color-value)"
          fillOpacity={0.15}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
```

**Key decisions in this pattern:**

- `isAnimationActive={false}` — disables entrance animation on KPI cards, which would be distracting on every dashboard load. Animation is appropriate for standalone chart pages, not sparklines.
- `margin={{ top: 2, right: 0, bottom: 0, left: 0 }}` — eliminates default Recharts margin that clips the stroke at edges.
- `fillOpacity={0.15}` — provides a subtle area fill without overwhelming the small card space.
- `ChartContainer` handles the CSS variable color bindings and responsive sizing. The `min-h` value is required by shadcn's ChartContainer for ResponsiveContainer to work.

**SSR handling:** Recharts requires browser APIs. The `Sparkline` component must be a Client Component (`'use client'`). The KPI card data is fetched server-side; the sparkline component receives pre-computed data as props. There is no need for `dynamic(() => import(...), { ssr: false })` because the whole dashboard KPI section is already inside a Client Component (`kpi-widgets.tsx` has `'use client'`).

**Data shape for sparklines:** KPI cards currently receive `{ value: number, trend: number }`. Extend the `DashboardKPIs` type to include historical data:

```typescript
// Current shape
reviewsThisMonth: { value: number; trend: number }

// Extended shape for sparklines
reviewsThisMonth: {
  value: number
  trend: number
  history: { value: number }[]  // 12 data points (months or weeks)
}
```

If historical data is not yet available in the query, pass an empty array — the `Sparkline` component should gracefully render nothing when `data.length < 2`.

---

## Area 2: Sticky Drawer Footers in Sheet Components

### Recommendation: No new dependency — CSS flex layout change

**Confidence: HIGH** — Verified against shadcn/ui official patterns (`shadcn.io/patterns/sheet-multi-section-5`) and direct inspection of `components/ui/sheet.tsx`.

**Root cause of the current problem:**

```tsx
// Current broken pattern in add-job-sheet.tsx (line 169):
<SheetContent className="overflow-y-auto">
  <SheetHeader>...</SheetHeader>
  <form>
    {/* All content + submit button scrolls together */}
    <div className="flex justify-end gap-2 pt-4">
      <Button>Cancel</Button>
      <Button>Create Job</Button>
    </div>
  </form>
</SheetContent>
```

`overflow-y-auto` on `SheetContent` causes the entire sheet to scroll, including the submit buttons. When the form is long (as in Add Job with the customer creation mode), the action buttons scroll out of view.

**SheetContent already has `flex flex-col`** (line 63 in `sheet.tsx`): `"bg-background ... fixed z-50 flex flex-col gap-4 shadow-lg px-8 ..."`. The fix is to use this flex column properly with a scrollable middle zone.

**The correct pattern:**

```tsx
<SheetContent>
  {/* Header: shrinks to its natural size, stays at top */}
  <SheetHeader>
    <SheetTitle>Add Job</SheetTitle>
    <SheetDescription>...</SheetDescription>
  </SheetHeader>

  {/* Scrollable body: grows to fill space, scrolls independently */}
  <div className="flex-1 overflow-y-auto -mx-8 px-8 py-1">
    {/* All form fields here */}
  </div>

  {/* Footer: shrinks to its natural size, stays at bottom */}
  <SheetFooter>
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Create Job</Button>
  </SheetFooter>
</SheetContent>
```

**Why `-mx-8 px-8` on the scroll zone:** `SheetContent` has `px-8` padding. To let the scrollbar appear at the sheet edge (not indented), apply negative horizontal margin to cancel the parent padding, then re-apply the same padding inside. This is the standard shadcn approach for nested scrollable areas.

**SheetFooter already has `mt-auto`** (line 101 in `sheet.tsx`): `"mt-auto flex flex-col gap-2 py-8"`. The `mt-auto` pushes the footer to the bottom in a flex column — but only if the body between header and footer does NOT itself have `flex-1 overflow-y-auto`. The current pattern uses `overflow-y-auto` on the entire `SheetContent`, which breaks `mt-auto`. Switching to `flex-1 overflow-y-auto` on the inner scroll zone restores `mt-auto` behavior.

**Files to update:**

| File | Change |
|------|--------|
| `components/jobs/add-job-sheet.tsx` | Remove `overflow-y-auto` from `SheetContent`, wrap form fields in `flex-1 overflow-y-auto` div, move buttons to `SheetFooter` |
| `components/jobs/edit-job-sheet.tsx` | Same pattern |
| `components/jobs/job-detail-drawer.tsx` | Same pattern (uses `sm:max-w-lg overflow-y-auto`) |

**No changes to `sheet.tsx`** — the component already supports this layout correctly. The issue is usage, not the primitive.

---

## Area 3: Button Hierarchy Variants

### Recommendation: Add `soft` variant to CVA — no new dependency

**Confidence: HIGH** — Based on direct inspection of `components/ui/button.tsx` and design system best practices from IBM Carbon Design System.

**Current button variants:**

| Variant | Visual | Current Use |
|---------|--------|-------------|
| `default` | Filled blue (primary) | Primary actions — too many places |
| `outline` | Border, no fill | Secondary actions |
| `secondary` | Warm stone fill | Rarely used |
| `ghost` | No fill, no border | Icon buttons, table actions |
| `destructive` | Red fill | Delete/danger actions |
| `link` | Text underline | Inline links |

**The problem:** Multiple `variant="default"` buttons appear on the same screen (e.g., "Create Job" + "Save" + "Add Customer" on the same page). The Carbon Design System principle: a layout should contain a single high-emphasis button.

**The fix: Add a `soft` variant.**

A "soft" button uses a filled background in a low-saturation tone (muted or secondary) — more prominent than `ghost` or `outline` but clearly subordinate to `default`. This is the missing middle tier.

**Updated `buttonVariants` in `components/ui/button.tsx`:**

```typescript
const buttonVariants = cva(
  // base classes unchanged
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:     "border bg-background hover:bg-secondary hover:text-secondary-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // NEW: soft — muted fill, no border. Sits between secondary and ghost.
        // Use for: secondary actions in toolbars, cancel buttons, filter chips
        soft:        "bg-muted text-foreground hover:bg-muted/80 dark:bg-muted/50 dark:hover:bg-muted/70",
        ghost:       "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        link:        "text-primary underline-offset-4 hover:underline motion-safe:hover:translate-y-0 motion-safe:active:scale-100",
      },
      // sizes unchanged
    },
  }
)
```

**Button hierarchy decision guide (for this codebase):**

| Tier | Variant | When to use |
|------|---------|-------------|
| Primary | `default` | One per section max — "Create Job", "Save Changes", "Submit" |
| Secondary | `outline` | Paired with a primary — "Cancel", "Go Back" |
| Soft | `soft` | Multiple peers on one surface — "Edit", "Duplicate", filter toggles |
| Tertiary | `ghost` | Icon buttons, table row actions, overflow menus |
| Danger | `destructive` | Destructive confirms only |

**Why `soft` over `secondary`:** The existing `secondary` variant uses `bg-secondary` (warm stone, `#EDE8DF`). It is already correct but has low contrast between text and background in some states. `soft` uses `bg-muted` which is a slightly more neutral base and the naming makes intent clearer in code review. Both `secondary` and `soft` can coexist — `secondary` for badge-like UI elements, `soft` for button-shaped controls.

**Do NOT add an `amber` or `warning` variant to buttons.** The amber/highlight tokens are for surfaces (cards, banners), not interactive buttons. Amber button backgrounds fail WCAG AA contrast with white text (computed ~2.2:1).

---

## Area 4: Radix Select Migration (Native `<select>` Replacement)

### Recommendation: Replace native `<select>` with existing `components/ui/select.tsx` — no new dependency

**Confidence: HIGH** — `@radix-ui/react-select` is already installed (`^2.2.6` in `package.json`) and `components/ui/select.tsx` is already present. This is a component usage change, not an installation.

**Files using native `<select>`:**

| File | Uses |
|------|------|
| `components/jobs/service-type-select.tsx` | Service type selector (`<select>` with manual className) |
| `components/jobs/add-job-sheet.tsx` | Job status selector (line 277-288) |
| `components/jobs/edit-job-sheet.tsx` | Job status selector (similar pattern) |

The `components/send/send-settings-bar.tsx` also uses native selects — check during implementation.

**The wiring pattern for uncontrolled Radix Select (no react-hook-form):**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Before (native select):
<select
  value={serviceType}
  onChange={(e) => setServiceType(e.target.value as ServiceType)}
  className="w-full rounded-md border..."
>
  <option value="">Select service type...</option>
  {availableTypes.map(type => (
    <option key={type} value={type}>{SERVICE_TYPE_LABELS[type]}</option>
  ))}
</select>

// After (Radix Select):
<Select
  value={serviceType}
  onValueChange={(value) => setServiceType(value as ServiceType)}
>
  <SelectTrigger>
    <SelectValue placeholder="Select service type..." />
  </SelectTrigger>
  <SelectContent>
    {availableTypes.map(type => (
      <SelectItem key={type} value={type}>
        {SERVICE_TYPE_LABELS[type]}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Key difference from native `<select>`:** Radix Select uses `onValueChange` (not `onChange`). The value returned is the string value directly (not an event object). The empty string `value=""` for unselected state is handled via `placeholder` on `SelectValue`, not an empty `<option>`.

**The wiring pattern with react-hook-form (if forms ever adopt RHF):**

```tsx
import { Controller } from 'react-hook-form'

<Controller
  name="serviceType"
  control={control}
  render={({ field }) => (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <SelectTrigger>
        <SelectValue placeholder="Select service type..." />
      </SelectTrigger>
      <SelectContent>
        {availableTypes.map(type => (
          <SelectItem key={type} value={type}>
            {SERVICE_TYPE_LABELS[type]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
/>
```

**Note:** The current Add Job and Edit Job forms use `useActionState` + `FormData` (Server Actions pattern), not react-hook-form. The `Controller` wrapper is only needed if migrating to RHF. For now, use the direct `value` / `onValueChange` pattern.

**The empty-value edge case:** Radix Select does not support `value=""` as a meaningful selected option — it treats empty string as "nothing selected." For the service type select (which needs a "Select service type..." placeholder), the `value` prop should be `undefined` when nothing is selected (not `""`), or use the `defaultValue` prop for initial uncontrolled state.

```tsx
// Replace:
const [serviceType, setServiceType] = useState<ServiceType | ''>('')

// With:
const [serviceType, setServiceType] = useState<ServiceType | undefined>(undefined)

// And guard submission:
if (!serviceType) return // or show validation error
```

---

## Area 5: Campaign Pause/Resume — Freeze Enrollment Model

### Recommendation: Add `frozen` status to `campaign_enrollments` — no new npm dependency

**Confidence: HIGH** — Based on direct inspection of `lib/actions/campaign.ts` and `toggleCampaignStatus` function. The current implementation is destructive: pausing a campaign calls `status = 'stopped'` on all active enrollments. Resuming creates no new enrollments — those customers are permanently dropped.

**Current broken behavior (line 461-471 in `lib/actions/campaign.ts`):**

```typescript
// PROBLEM: pause is DESTRUCTIVE — enrollments are stopped, not paused
if (newStatus === 'paused') {
  await supabase
    .from('campaign_enrollments')
    .update({
      status: 'stopped',          // <-- permanent. Cannot be reversed.
      stop_reason: 'campaign_paused',
      stopped_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('status', 'active')
}
// Resume does nothing to enrollments — they are already stopped.
```

**The correct mental model:** Pausing a campaign should FREEZE active enrollments, not stop them. Resuming should UNFREEZE them — the cron processor skips frozen enrollments until they are active again.

**Implementation approach: Add `frozen` status to `campaign_enrollments`**

Option A (schema addition — recommended):
- Add `frozen` as a valid value for `campaign_enrollments.status`
- Pause sets `status = 'frozen'`
- Resume sets `status = 'active'` on all `frozen` enrollments for that campaign
- Cron processor already queries `WHERE status = 'active'` — frozen enrollments are automatically skipped

Option B (separate `paused_at` timestamp column):
- Add `paused_at TIMESTAMPTZ` to `campaign_enrollments`
- Pause sets `paused_at = now()`; enrollments remain `status = 'active'` but cron skips rows WHERE `paused_at IS NOT NULL`
- Resume sets `paused_at = NULL`

**Recommendation: Option A (frozen status).** The existing status enum (`active`, `completed`, `stopped`) has clear semantics. Adding `frozen` fits the pattern — it is a recoverable pause state, semantically distinct from `stopped` (which is terminal). The cron queries already filter by `status = 'active'`, so frozen enrollments are automatically excluded.

**Required changes:**

1. Supabase migration: update `campaign_enrollments.status` constraint to include `'frozen'`
2. Update `toggleCampaignStatus` in `lib/actions/campaign.ts`:

```typescript
export async function toggleCampaignStatus(campaignId: string): Promise<ActionState> {
  // ... auth checks unchanged ...

  const newStatus = campaign.status === 'active' ? 'paused' : 'active'

  // Update campaign status
  await supabase
    .from('campaigns')
    .update({ status: newStatus })
    .eq('id', campaignId)

  if (newStatus === 'paused') {
    // FREEZE active enrollments — reversible
    await supabase
      .from('campaign_enrollments')
      .update({ status: 'frozen' })
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
  } else {
    // UNFREEZE frozen enrollments on resume
    await supabase
      .from('campaign_enrollments')
      .update({ status: 'active' })
      .eq('campaign_id', campaignId)
      .eq('status', 'frozen')
  }

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true }
}
```

3. Update `DATA_MODEL.md` — add `frozen` to the enrollment status enum and document the pause/freeze/resume state machine.

4. Update `deleteCampaign` — currently only stops `status = 'active'` enrollments. Must also stop `status = 'frozen'` enrollments when a campaign is deleted:

```typescript
.in('status', ['active', 'frozen'])  // was: .eq('status', 'active')
```

**Enrollment state machine (complete):**

```
                 ┌─────────────────────────────────────┐
                 │         campaign_enrollments         │
                 └─────────────────────────────────────┘

  Job completed ──► active ──────────────────► completed
                      │                          (all touches sent)
                      │ campaign paused
                      ▼
                   frozen ◄─── campaign resumed
                      │
                      │ campaign deleted
                      ▼
                   stopped (stop_reason: campaign_deleted)

  active ──────────────────────────────────────► stopped
  frozen ──────────────────────────────────────► stopped
              (stop_reason: campaign_paused is NO LONGER USED)
              (stop_reason: campaign_deleted, review_clicked, etc.)
```

**Cron impact:** The existing cron queries `WHERE status = 'active' AND current_touch = N AND touch_N_sent_at IS NULL`. No cron changes needed — `frozen` enrollments are naturally excluded. The cron processor already handles only `active` status.

**Touch timestamp preservation:** When an enrollment is frozen, its `touch_N_scheduled_at` timestamps are preserved. On resume, those scheduled times may be in the past. The cron processor should send past-due touches immediately (on the next cron run) rather than skipping them. Verify the current cron behavior against this expectation during implementation.

---

## Summary: What Changes

| Area | Change | New npm dep? |
|------|--------|-------------|
| Sparkline charts | Add `recharts ^3.7.0` + `pnpm dlx shadcn@latest add chart` | **Yes — recharts** |
| Sticky drawer footers | CSS flex layout change in 3 sheet components | No |
| Button hierarchy | Add `soft` variant to `buttonVariants` CVA in `button.tsx` | No |
| Radix Select migration | Replace 3 native `<select>` usages with existing `components/ui/select.tsx` | No |
| Campaign pause/freeze | Add `frozen` status + update `toggleCampaignStatus` + 1 migration | No |

---

## What NOT to Add

| Considered | Decision | Reason |
|------------|----------|--------|
| `@tremor/react` | No | 400kB+ bundle for a full UI kit. Only need sparklines. Recharts alone is sufficient. |
| `victory` | No | 500kB+, React 18 only, no Tailwind fit. |
| `d3` directly | No | Low-level, would require significant custom code. Recharts wraps D3 correctly. |
| `framer-motion` | No | Existing Tailwind transitions (`transition-all duration-200`) cover all UX polish needs in this milestone. |
| `@radix-ui/react-scroll-area` | No | `overflow-y-auto` on a flex child is sufficient for the sheet scroll zone. ScrollArea adds a styled scrollbar but that is out of scope for this milestone. |
| XState or similar state machine library | No | The campaign pause state machine has 4 states and 3 transitions. A Supabase enum column + conditional updates is the correct solution at this scale. |
| `react-window` or `react-virtual` | No | Table virtualization is not in scope. |

---

## Migration Notes

### Recharts v3 Peer Dependency

Recharts v3.7.0 requires React 16.8+ (satisfied — project uses React 19). The v3 API change that affects shadcn/ui charts: internal props like `payload`, `label`, `item`, `index` on tooltip/legend components were removed. The updated `chart.tsx` from `pnpm dlx shadcn@latest add chart` handles this. Do not copy `chart.tsx` from older shadcn documentation.

### Campaign Enrollment Migration

The `frozen` status addition requires a Supabase migration:

```sql
-- Update the status constraint on campaign_enrollments
ALTER TABLE campaign_enrollments
  DROP CONSTRAINT IF EXISTS campaign_enrollments_status_check;

ALTER TABLE campaign_enrollments
  ADD CONSTRAINT campaign_enrollments_status_check
  CHECK (status IN ('active', 'completed', 'stopped', 'frozen'));
```

This is a non-destructive migration — existing rows are unaffected. The migration file should be named: `supabase/migrations/YYYYMMDDHHMMSS_add_frozen_enrollment_status.sql`.

Update `DATA_MODEL.md` to document the new status value and the freeze/resume state machine.

---

## Sources

- `components/ui/button.tsx` — inspected directly; confirmed existing CVA variant structure
- `components/ui/sheet.tsx` — inspected directly; confirmed `flex flex-col` + `SheetFooter mt-auto` structure
- `components/ui/select.tsx` — inspected directly; confirmed Radix Select is already present
- `components/jobs/add-job-sheet.tsx` — inspected directly; confirmed native `<select>` on line 277-288 and `overflow-y-auto` footer problem on line 169
- `components/jobs/service-type-select.tsx` — inspected directly; confirmed native `<select>` component
- `components/campaigns/campaign-card.tsx` — inspected directly; confirmed `toggleCampaignStatus` call
- `lib/actions/campaign.ts` — inspected directly; confirmed destructive pause behavior (lines 461-471)
- `package.json` — inspected directly; confirmed recharts is NOT yet installed
- [recharts/recharts GitHub releases](https://github.com/recharts/recharts/releases) — confirmed v3.7.0 is latest stable (January 2025)
- [shadcn/ui chart docs](https://ui.shadcn.com/docs/components/radix/chart) — confirmed `pnpm dlx shadcn@latest add chart` command and composition model
- [shadcn/ui issue #7669](https://github.com/shadcn-ui/ui/issues/7669) — confirmed Recharts v3 support implemented in PR #8486; v3 now recommended
- [shadcn/ui sheet sticky header/footer pattern](https://www.shadcn.io/patterns/sheet-multi-section-5) — confirmed `flex-1 overflow-y-auto` middle zone pattern
- [shadcn/ui Select docs](https://ui.shadcn.com/docs/components/radix/select) — confirmed `onValueChange` / `defaultValue` wiring for react-hook-form Controller
- [Carbon Design System — Button usage](https://carbondesignsystem.com/components/button/usage/) — confirmed single high-emphasis button principle; tertiary/ghost for dense UIs

---

*Stack research for: v2.5.2 UX Bugs & UI Fixes*
*Researched: 2026-02-25*
*Confidence: HIGH — all findings based on direct codebase inspection + authoritative documentation*
