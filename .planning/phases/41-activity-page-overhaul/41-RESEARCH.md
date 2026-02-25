# Phase 41: Activity Page Overhaul - Research

**Researched:** 2026-02-24
**Domain:** Next.js App Router, TanStack React Table, Radix UI Select, date-fns, URL-based filter state
**Confidence:** HIGH — all findings from direct codebase inspection

---

## Summary

Phase 41 upgrades the Activity (Send History) page across six requirements: fix bulk-select logic, fix resend button visibility + behavior, standardize the page header, upgrade the status filter from a native `<select>` to Radix Select, and add date preset chips alongside the existing date range inputs.

The codebase is well-structured for these changes. All the required UI primitives already exist (`Select`, `Button`, `Input`, chip pattern). The main work is:
1. Rewriting `history-filters.tsx` — the status filter becomes Radix Select, the date row gains four preset chips, and two-row layout is formalized.
2. Rewriting the actions column in `history-columns.tsx` — remove `opacity-0 group-hover:opacity-100`, restrict Retry button to resendable statuses only, add "Retry" text label.
3. Updating `history-client.tsx` — change page header to "Send History" + dynamic count subtitle, convert inline `handleQuickResend` from "opens drawer" to direct immediate resend via `bulkResendRequests([id])`, move bulk-select bar.

No new dependencies are needed. All patterns to match already exist in the codebase.

**Primary recommendation:** Treat this as a pure refactor of three existing files (`history-client.tsx`, `history-filters.tsx`, `history-columns.tsx`) — no new files required.

---

## Standard Stack

All already installed and used in project:

### Core
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@tanstack/react-table` | 8.21.3 | Table state, row selection, sorting | Already used in `history-table.tsx` |
| `@radix-ui/react-select` | 2.2.6 | Accessible styled dropdown | Already in `components/ui/select.tsx` |
| `date-fns` | 4.1.0 | Date arithmetic for presets | `subWeeks`, `subMonths`, `subDays`, `format` all available |
| `next/navigation` | latest | `useSearchParams`, `useRouter`, `usePathname` | Already used in `history-filters.tsx` |

### Supporting (already present)
| Library | Purpose |
|---------|---------|
| `@phosphor-icons/react` | ArrowClockwise, X, MagnifyingGlass, CircleNotch |
| `sonner` | Toast notifications for resend feedback |
| `react` | `useTransition`, `useRef`, `useEffect`, `useState` |

### No new installs required.

---

## Architecture Patterns

### File Map: What Changes

| File | Change Type | What Changes |
|------|-------------|--------------|
| `components/history/history-client.tsx` | Modify | Page header (title + subtitle with count), convert `handleQuickResend` to direct resend, bulk-select bar placement |
| `components/history/history-filters.tsx` | Rewrite | Status filter → Radix Select, date row → preset chips + inputs |
| `components/history/history-columns.tsx` | Modify | Remove hover-to-reveal opacity pattern, restrict Retry to resendable statuses, add "Retry" text label |
| `components/history/history-table.tsx` | No change | Row selection model already correct (see below) |
| `app/(dashboard)/history/page.tsx` | No change | Server component, props already sufficient |

### Pattern 1: Jobs Page Header Pattern

The Jobs page (`components/jobs/jobs-client.tsx`) uses this exact header pattern (the one to match):

```tsx
// Source: components/jobs/jobs-client.tsx lines 58-76
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
    <p className="text-muted-foreground">
      {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} total
    </p>
  </div>
  {/* right-side action button (none for History) */}
</div>
```

For Activity page, the target header:
```tsx
<div>
  <h1 className="text-2xl font-semibold tracking-tight">Send History</h1>
  <p className="text-muted-foreground">
    Track delivery status of your sent messages · {total} total
  </p>
</div>
```
- No right-side action button (page is read-only)
- `total` is already passed as a prop to `HistoryClient`

### Pattern 2: Chip Filter (Jobs Page)

The Jobs page chip filter in `components/jobs/job-filters.tsx` defines the pattern:

```tsx
// Source: components/jobs/job-filters.tsx lines 51-66
<button
  key={status}
  onClick={() => onFiltersChange({ ...filters, status: filters.status === status ? null : status })}
  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
    filters.status === status
      ? 'bg-primary text-primary-foreground'
      : 'bg-muted text-muted-foreground hover:bg-muted/80'
  }`}
>
  {JOB_STATUS_LABELS[status]}
</button>
```

Date preset chips use the same `rounded-full` pill style with `bg-primary text-primary-foreground` when active.

### Pattern 3: Radix Select (Already Used in App)

The `Select` component from `components/ui/select.tsx` is already used in `campaign-form.tsx`, `touch-sequence-editor.tsx`, etc. Standard usage pattern:

```tsx
// Source: components/campaigns/campaign-form.tsx lines 120-132
<Select value={value} onValueChange={(v) => handler(v)}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="All statuses" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All statuses</SelectItem>
    <SelectItem value="pending">Pending</SelectItem>
    {/* ... */}
  </SelectContent>
</Select>
```

For the status filter: `className="w-full sm:w-[180px]"` on `SelectTrigger` to match the current native select width.

### Pattern 4: URL-Based Filter State (Already Used)

`history-filters.tsx` already uses `useSearchParams` + `useRouter.replace()` + `useTransition` for filter state. Date preset chips must call the same `updateFilter('from', value)` / `updateFilter('to', value)` functions.

Date preset calculation (using date-fns functions `format`, `subWeeks`, `subMonths`, `subDays`):
```tsx
import { format, subWeeks, subMonths, subDays } from 'date-fns'

// Produces YYYY-MM-DD strings (matches HTML date input format + server expectation)
const DATE_PRESETS = [
  {
    label: 'Today',
    getRange: () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      return { from: today, to: today }
    }
  },
  {
    label: 'Past Week',
    getRange: () => ({
      from: format(subWeeks(new Date(), 1), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    })
  },
  {
    label: 'Past Month',
    getRange: () => ({
      from: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    })
  },
  {
    label: 'Past 3 Months',
    getRange: () => ({
      from: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    })
  },
]
```

The server's `getSendLogs` already handles `dateTo` with `endOfDay` (sets `23:59:59.999`), so passing `YYYY-MM-DD` strings is correct.

### Pattern 5: Active Preset Detection

Active preset chip highlighting requires detecting if the current URL params match a preset's computed range. Since date arithmetic is non-deterministic across renders (clock ticks), use state to track the active preset label instead of recomputing from URL:

```tsx
const [activePreset, setActivePreset] = useState<string | null>(null)

function applyPreset(preset: typeof DATE_PRESETS[number]) {
  if (activePreset === preset.label) {
    // Toggle off: clear dates
    setActivePreset(null)
    updateDateRange('', '')
    return
  }
  const { from, to } = preset.getRange()
  setActivePreset(preset.label)
  updateDateRange(from, to)
}

function handleDateInputChange(key: 'from' | 'to', value: string) {
  setActivePreset(null)  // Deselect preset when manually editing
  updateFilter(key, value)
}
```

Note: `activePreset` is local UI state (not in URL) — it resets on page reload, which is acceptable because we don't need to persist which preset was chosen, only the date range.

### Pattern 6: Direct Inline Resend (No Drawer)

Current behavior: `handleQuickResend` opens the detail drawer (not a direct resend).

New behavior per CONTEXT: "Clicking Retry immediately resends — no confirmation dialog."

The `bulkResendRequests` server action already handles single-item resend correctly:
```typescript
// Source: lib/actions/bulk-resend.ts
// Accepts array of send_log IDs, fetches customer_id + template_id, calls sendReviewRequest
export async function bulkResendRequests(sendLogIds: string[])
```

New `handleInlineRetry` in history-client:
```tsx
const handleInlineRetry = async (request: SendLogWithContact) => {
  setIsRetrying(true)
  try {
    const result = await bulkResendRequests([request.id])
    if (result.success) {
      toast.success('Message resent')
      refresh()
    } else {
      toast.error('Failed to resend', { description: result.error })
    }
  } finally {
    setIsRetrying(false)
  }
}
```

Pass `onResend={handleInlineRetry}` to `HistoryTable`, which passes it to `createColumns`.

### Pattern 7: Row Selection (Already Correct in Table Layer)

The `history-table.tsx` already implements `enableRowSelection` gated on resendable statuses:
```typescript
// Source: history-table.tsx line 49
enableRowSelection: (row) => RESENDABLE_STATUSES.includes(row.original.status),
```

The `history-columns.tsx` already implements header checkbox that only selects resendable rows. These are already correct per ACT-01 requirements. The issue is not in the selection logic — it's in the **actions column** (hover-to-reveal visibility pattern for the Retry button, and Retry showing on ALL non-pending rows instead of only failed/bounced rows).

### Pattern 8: Fix Actions Column

Current (broken) actions column in `history-columns.tsx`:
```tsx
// PROBLEM 1: opacity-0 group-hover:opacity-100 hides button always
<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

// PROBLEM 2: canResend = !isPending (shows on delivered/sent/opened too)
const isPending = request.status === 'pending'
const canResend = !isPending && onResend
```

Corrected actions column:
```tsx
// Only show Retry on explicitly resendable statuses
const isResendable = RESENDABLE_STATUSES.includes(request.status)

return (
  <div className="flex items-center justify-end gap-2">
    {isResendable && onResend && (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onResend(request) }}
        className="h-8 px-2 gap-1.5"
      >
        <ArrowClockwise className="h-4 w-4" />
        Retry
      </Button>
    )}
  </div>
)
```

Note: Remove `opacity-0 group-hover:opacity-100 transition-opacity` entirely. The `group` className on `<TableRow>` can also be removed from `history-table.tsx` if no other column uses it.

### Pattern 9: Bulk Select Bar

Current placement: between the count line and the table (`<div className="flex items-center justify-between">`).

The CONTEXT says "Bulk resend bar position: Claude's discretion." Best practice: keep as-is (above table, inline in the count row) — it's visible, non-intrusive, and already implemented. No change needed to its position. However, the wording "X failed messages selected" should be updated since `complained` is also resendable — use "X messages selected" instead, or keep "failed messages" if `complained` is excluded from resendable (see Pitfall 3).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Styled dropdown | Custom `<select>` styling | Existing `Select` from `components/ui/select.tsx` | Radix already handles focus, keyboard, dark mode |
| Date arithmetic | Manual `new Date()` subtraction | `date-fns` (`subWeeks`, `subMonths`, `format`) | Already in project, consistent formatting |
| Active preset state | URL-based detection | Local `useState` for active chip | Cleaner, avoids reverse date computation |
| Row selection gating | Custom selection logic | Existing `enableRowSelection` in `history-table.tsx` | Already implemented correctly |
| Toast notifications | Custom UI | `sonner` toast (already used) | Consistent with rest of app |

---

## Common Pitfalls

### Pitfall 1: `RESENDABLE_STATUSES` Defined in Two Files
**What goes wrong:** `RESENDABLE_STATUSES` is currently defined separately in both `history-columns.tsx` (line 12) and `history-table.tsx` (line 25). If you update one and forget the other, behavior diverges.
**Why it happens:** Copy-paste duplication when columns were created.
**How to avoid:** Extract to a single constant in a shared location (e.g., `components/history/constants.ts`) or keep in one file and import from the other.
**Warning signs:** TypeScript won't catch this. Manually verify both files reference the same array after changes.

### Pitfall 2: Preset Active State Resets on Navigation
**What goes wrong:** `activePreset` is local state — navigating away and back resets the chip highlight even though the URL still has the date range from the preset.
**Why it happens:** Local state doesn't persist across full page navigations (which are server-side re-renders for Next.js App Router pages).
**How to avoid:** This is acceptable per the design — the dates are preserved in the URL, only the chip highlight is lost. Users can see the date inputs are populated.
**Alternative:** On mount, detect if URL params match a preset and set `activePreset` accordingly — but this adds complexity and risks clock drift. Accept the reset behavior.

### Pitfall 3: `complained` Status and Email Deliverability
**What goes wrong:** The `bulkResendRequests` server action includes `complained` in resendable statuses, but the Resend webhook handler sets `opted_out = true` for `complained` customers. Retrying a complained customer will fail at `sendReviewRequest`'s opt-out check.
**Why it happens:** The server action checks for resendable statuses but `sendReviewRequest` also checks `opted_out` flag independently.
**How to avoid:** Either:
  - Remove `complained` from `RESENDABLE_STATUSES` in the UI layer (columns + table) — customers who complained have opted out, so retry will fail anyway
  - OR leave it (retry will fail gracefully and the error will be caught)
  - CONTEXT says "Claude's discretion" for this — recommend excluding `complained` from UI-visible resendable statuses since the retry will silently fail due to opted-out.
**Decision recommendation:** Keep `RESENDABLE_STATUSES = ['failed', 'bounced']` in the UI. The server's `bulkResendRequests` can retain `complained` as a safety net, but don't show Retry button for complained rows.

### Pitfall 4: Radix Select Width in Filter Row
**What goes wrong:** Radix `SelectContent` defaults to `min-w-[var(--radix-select-trigger-width)]` (matches trigger width), which is correct behavior. But `SelectTrigger` needs explicit width to match the old `<select>` element.
**Why it happens:** Radix Select is a composed component — width flows from trigger to content.
**How to avoid:** Apply `className="w-full sm:w-[180px]"` to `SelectTrigger` to match the current native select width.

### Pitfall 5: Stale `rowSelection` After Inline Retry
**What goes wrong:** After an inline retry of a single row, `rowSelection` state in `history-client.tsx` may still contain that row's ID even after `refresh()` refetches data.
**Why it happens:** `refresh()` triggers a server re-render but doesn't reset local state.
**How to avoid:** Call `setRowSelection({})` after a successful inline retry (same as after bulk retry).

### Pitfall 6: `handleQuickResend` vs `handleInlineRetry` Naming
**What goes wrong:** `handleQuickResend` currently opens the drawer, not a direct resend. If you rename it without updating call sites, you break behavior.
**Why it happens:** The existing name is misleading — "quick resend" implies immediate resend, but it opens a drawer.
**How to avoid:** When updating `history-client.tsx`, introduce `handleInlineRetry` as the new direct-resend handler. Keep `handleRowClick` for drawer opening (on row click, not Retry button). Remove `handleQuickResend` and `handleQuickCancel` entirely.

---

## Code Examples

### Filter Row Layout (New Two-Row Structure)

```tsx
// Source: design from CONTEXT.md + matching Jobs page and history-filters.tsx existing layout
<div className="space-y-4">
  {/* Row 1: Search + Status dropdown (Radix Select) */}
  <div className="flex flex-col sm:flex-row gap-4">
    {/* Search input - unchanged */}
    <div className="relative flex-1">
      <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Search by name or email..." defaultValue={query} onChange={...} className="pl-9" />
    </div>

    {/* Status filter - Radix Select (replaces native <select>) */}
    <Select value={status} onValueChange={(v) => updateFilter('status', v)}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Row 2: Date presets + custom date inputs */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
    {/* Preset chips */}
    {DATE_PRESETS.map(preset => (
      <button
        key={preset.label}
        onClick={() => applyPreset(preset)}
        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          activePreset === preset.label
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        {preset.label}
      </button>
    ))}

    {/* Separator */}
    <div className="hidden sm:block w-px h-6 bg-border" />

    {/* Custom date inputs */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground whitespace-nowrap">From</Label>
        <Input type="date" value={dateFrom} onChange={(e) => handleDateInputChange('from', e.target.value)} className="w-[150px]" />
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground whitespace-nowrap">To</Label>
        <Input type="date" value={dateTo} onChange={(e) => handleDateInputChange('to', e.target.value)} className="w-[150px]" />
      </div>
    </div>

    {/* Loading + Clear */}
    <div className="flex items-center gap-2">
      {isPending && <CircleNotch size={16} className="animate-spin text-muted-foreground" />}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X size={12} className="mr-1" />
          Clear
        </Button>
      )}
    </div>
  </div>
</div>
```

### Updated Actions Column

```tsx
// Source: Modified from history-columns.tsx
const RESENDABLE_STATUSES = ['failed', 'bounced']  // 'complained' excluded (opted-out customers)

// In createColumns():
{
  id: 'actions',
  header: '',
  cell: ({ row }) => {
    const request = row.original
    const isResendable = RESENDABLE_STATUSES.includes(request.status)

    if (!isResendable || !onResend) return null

    return (
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onResend(request)
          }}
          className="h-8 px-2 gap-1.5"
        >
          <ArrowClockwise className="h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  },
}
```

### Date Preset Constants

```tsx
import { format, subWeeks, subMonths } from 'date-fns'

const DATE_PRESETS = [
  {
    label: 'Today',
    getRange: () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      return { from: today, to: today }
    },
  },
  {
    label: 'Past Week',
    getRange: () => ({
      from: format(subWeeks(new Date(), 1), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    }),
  },
  {
    label: 'Past Month',
    getRange: () => ({
      from: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    }),
  },
  {
    label: 'Past 3 Months',
    getRange: () => ({
      from: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    }),
  },
] as const
```

---

## Key Observations from Codebase Inspection

### Current Resend Flow (Incorrect per ACT-02, ACT-03)

The current `canResend` in `history-columns.tsx` line 109:
```tsx
const isPending = request.status === 'pending'
const canResend = !isPending && onResend
```
This allows Retry on `delivered`, `sent`, `opened` rows — wrong. Should be restricted to `failed`/`bounced` only.

The action div on line 112:
```tsx
<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
```
This requires hover to see. Remove `opacity-0` and `group-hover:opacity-100`.

### Current Bulk Select (Already Correct per ACT-01)

`history-table.tsx` line 49: `enableRowSelection: (row) => RESENDABLE_STATUSES.includes(row.original.status)` — gates selection to resendable rows only. Header checkbox in `history-columns.tsx` also skips non-resendable rows. **These are already correct** — no changes needed to selection logic.

### Type Aliases

`SendLogWithContact` is a deprecated alias for `SendLogWithCustomer` (same type). All history components use `SendLogWithContact` — no need to change types in this phase. The alias is maintained in `database.ts` line 194.

### Page Header Discrepancy

Current header in `history-client.tsx` line 152: `<h1>Activity</h1>` — the page metadata in `app/(dashboard)/history/page.tsx` also says `title: 'Activity'`. Both need updating to "Send History" per CONTEXT. The metadata in `page.tsx` should be updated too.

### The `PageHeader` Component is NOT the Standard Page Header

`components/layout/page-header.tsx` is a **mobile-only top bar** (has `className="md:hidden"`), not the in-page content header. The standard content header is the inline `<div>` + `<h1>` pattern shown in `jobs-client.tsx` and other pages. Do NOT use `PageHeader` for the content area.

### `complained` in bulkResendRequests

`lib/actions/bulk-resend.ts` line 54: `['failed', 'bounced', 'complained'].includes(l.status)` — the server action allows complained. But `app/api/webhooks/resend/route.ts` line 14 shows `complained` triggers `opted_out = true` on the customer. This means `sendReviewRequest` will reject the retry (opted-out check). Recommend removing `complained` from the UI's `RESENDABLE_STATUSES` to avoid showing a Retry button that will silently fail.

---

## State of the Art

| Old Approach | New Approach (This Phase) | Reason |
|--------------|--------------------------|--------|
| Native `<select>` for status filter | Radix `Select` component | Consistent with rest of app, accessible, styled |
| No date presets | 4 preset chips (Today, Past Week, Past Month, Past 3 Months) | Faster access to common ranges |
| Hover-to-reveal Retry button | Always-visible Retry (icon + text) | ACT-03: resend actions should be immediately visible |
| Retry shows on all non-pending rows | Retry only on failed/bounced rows | ACT-02: correct status restriction |
| Page title "Activity" | "Send History" | More descriptive, clearer page purpose |
| Static subtitle | "Track delivery status · N total" | Adds useful dynamic count |
| `handleQuickResend` opens drawer | `handleInlineRetry` directly resends | ACT-03: no confirmation dialog, immediate action |

---

## Open Questions

1. **`complained` in RESENDABLE_STATUSES**
   - What we know: Server action includes it, but opted-out customers can't receive email
   - What's unclear: Should UI show Retry for `complained` rows even though it will fail server-side?
   - Recommendation: Exclude from UI (show no Retry button on `complained` rows). Server-side `bulkResendRequests` can be left unchanged as defense-in-depth.

2. **`updateDateRange` function signature**
   - What we know: `updateFilter` in `history-filters.tsx` takes `(key, value)` and updates one URL param at a time
   - What's needed: Presets need to set both `from` and `to` atomically (one URL navigation, not two)
   - Recommendation: Add a `updateDateRange(from: string, to: string)` function that builds a single `URLSearchParams` and calls `replace()` once. This prevents double navigation.

3. **Bulk resend bar text**
   - Current: "X failed messages selected"
   - If `complained` excluded: "X failed messages" is accurate for `failed` + `bounced`
   - Recommendation: Change to "X messages selected" to be status-agnostic

---

## Sources

### Primary (HIGH confidence)
- Direct file reads of `components/history/history-client.tsx`, `history-filters.tsx`, `history-columns.tsx`, `history-table.tsx`, `status-badge.tsx`, `request-detail-drawer.tsx`
- Direct file reads of `components/jobs/job-filters.tsx` (chip pattern source of truth)
- Direct file reads of `components/ui/select.tsx` (Radix Select component)
- Direct file reads of `lib/actions/bulk-resend.ts`, `lib/data/send-logs.ts`
- Direct file reads of `lib/types/database.ts` (SendLog.status type)
- Direct file reads of `app/api/webhooks/resend/route.ts` (complained → opted-out behavior)
- Directory listing of `node_modules/date-fns` confirming `subWeeks`, `subMonths`, `format` available in v4.1.0

### Notes
- No external library research needed — all components already exist in project
- No Context7 queries needed — all technology is already in use in this codebase
- Confidence is HIGH for all findings as they are based on direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- File locations and current implementation: HIGH — direct codebase reads
- Design patterns to match: HIGH — Jobs page chip pattern confirmed in source
- Radix Select API: HIGH — existing usage in campaign components confirmed
- date-fns availability: HIGH — `node_modules/date-fns` directory confirmed all needed functions
- `complained` deliverability issue: HIGH — webhook handler explicitly sets opted_out=true

**Research date:** 2026-02-24
**Valid until:** Indefinite (pure codebase analysis, no external dependencies)
