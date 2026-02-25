# Phase 43: Cross-Page Consistency - Research

**Researched:** 2026-02-24
**Domain:** Next.js App Router loading states (loading.tsx) and empty state UI patterns
**Confidence:** HIGH

## Summary

This phase requires standardizing two UI patterns across all dashboard pages: (1) loading skeletons via `loading.tsx` files, and (2) empty state components with a consistent visual structure. The codebase already has a well-established reference implementation for both patterns -- the campaigns page serves as the gold standard. The primary work is auditing every page, identifying deviations, and normalizing them to match the reference pattern.

The existing skeleton infrastructure (`Skeleton`, `TableSkeleton`, `CardSkeleton`) is solid and reusable. Several pages already have proper `loading.tsx` files but with inconsistent spacing/structure. Four pages are missing `loading.tsx` entirely (analytics, dashboard, settings, send). Empty states are more inconsistent -- some use the correct pattern (icon in circle + title + subtitle + action), while others use different sizes, spacing, or miss elements entirely.

**Primary recommendation:** Normalize all pages to match the campaigns page patterns exactly -- `loading.tsx` with `container py-6 space-y-8` wrapper and the empty state structure of `rounded-full bg-muted p-6 mb-6` icon circle + `text-2xl font-semibold` title + `text-muted-foreground mb-8 max-w-md` subtitle + contextual `Button` action.

## Standard Stack

No new libraries needed. Everything uses existing infrastructure.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | latest | `loading.tsx` convention for Suspense boundaries | Built-in route-level loading UI |
| Skeleton component | N/A (custom) | `bg-muted/60 animate-pulse-soft` base primitive | Already in `components/ui/skeleton.tsx` |
| TableSkeleton | N/A (custom) | Table-shaped skeleton with rows/columns/checkbox | Already in `components/skeletons/table-skeleton.tsx` |
| CardSkeleton | N/A (custom) | Card-shaped skeleton with icon + lines | Already in `components/skeletons/card-skeleton.tsx` |
| Phosphor Icons | ^2.1.10 | Icons in empty states (SSR imports) | Project standard icon library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @phosphor-icons/react/dist/ssr | ^2.1.10 | Server-side icon imports for server components | In loading.tsx and server-rendered empty states |
| @phosphor-icons/react | ^2.1.10 | Client-side icon imports | In client component empty states |

## Architecture Patterns

### Pattern 1: Next.js `loading.tsx` (Route-Level Suspense)

**What:** Next.js App Router automatically wraps `page.tsx` in a `<Suspense>` boundary using the sibling `loading.tsx` as the fallback. When navigation occurs, the loading.tsx content displays immediately while the page's async data fetches.

**When to use:** Every route directory that has a `page.tsx` performing async data fetching.

**How it works with the progress bar:** The `NavigationProgressBar` (in `components/ui/progress-bar.tsx`) fires on `pathname` change and animates a 2px accent-colored bar across the top. This runs independently of `loading.tsx`. Together they provide: progress bar (immediate visual feedback) + skeleton (structural placeholder).

**Reference implementation (campaigns/loading.tsx):**
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function CampaignsLoading() {
  return (
    <div className="container py-6 space-y-8">
      {/* Header: title + subtitle on left, action button on right */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Content placeholder */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
```

### Pattern 2: Consistent Empty State

**What:** When a page has zero data, display a centered empty state with icon-in-circle, title, subtitle, and contextual action button.

**Reference implementation (campaigns-shell.tsx):**
```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="rounded-full bg-muted p-6 mb-6">
    <IconName className="h-8 w-8 text-muted-foreground" />
  </div>
  <h2 className="text-2xl font-semibold tracking-tight mb-2">
    No [items] yet
  </h2>
  <p className="text-muted-foreground mb-8 max-w-md">
    [Guidance text explaining what will appear here and how to get started]
  </p>
  <Button onClick={action}>
    <ActionIcon className="mr-2 h-4 w-4" />
    [Action Label]
  </Button>
</div>
```

### Pattern 3: Filtered Empty State (No Results)

**What:** When filters are active but return zero results, show a smaller, subtler empty state.

**Reference implementation (customers empty-state.tsx):**
```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <Icon size={32} weight="regular" className="text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-2">No [items] found</h3>
  <p className="text-muted-foreground max-w-sm">
    Try adjusting your search or filter criteria.
  </p>
</div>
```

### Anti-Patterns to Avoid

- **Spinner-only fallback in page.tsx Suspense:** Pages like jobs, customers, and history use inline `<Suspense>` with a bare spinner instead of leveraging `loading.tsx` with skeletons. These should be removed in favor of the route-level `loading.tsx` pattern.
- **Inline `animate-pulse` in arbitrary divs:** The settings page has `animate-pulse` applied directly to wrapper divs instead of using the `Skeleton` component. Use `Skeleton` for consistency.
- **Dashed-border empty states:** The jobs empty state uses `rounded-lg border border-dashed border-border` which differs from the reference pattern's clean background approach. Normalize to the campaigns pattern.
- **Missing icon circle:** The feedback empty state skips the `rounded-full bg-muted p-6` wrapper around the icon. Normalize.

## Current State Audit

### Loading States (`loading.tsx` Files)

| Page Route | Has loading.tsx | Pattern Quality | Issues |
|------------|----------------|-----------------|--------|
| `/campaigns` | YES | REFERENCE | Gold standard |
| `/jobs` | YES | GOOD | Uses `space-y-6` (ref uses `space-y-8`), but has proper TableSkeleton |
| `/customers` | YES | GOOD | Same minor spacing diff |
| `/history` | YES | GOOD | Missing subtitle skeleton in header |
| `/feedback` | YES | GOOD | Uses `py-8 max-w-4xl` (ref uses `py-6 container`) |
| `/billing` | YES | GOOD | Uses `container mx-auto py-6 px-4` (ref uses `container py-6`) |
| `/contacts` | YES | N/A | Redirect page, loading.tsx is legacy -- should be removed |
| `/analytics` | NO | MISSING | No loading.tsx at all |
| `/settings` | NO | N/A (uses Suspense) | Has inline SettingsLoadingSkeleton in page.tsx, not a loading.tsx file |
| `/dashboard` | NO | N/A (exempt) | Dashboard is exempt from this phase (complex layout) |
| `/send` | NO | N/A (redirect) | Redirects to /campaigns, no loading needed |

### Empty States

| Page | Component | Icon Circle | Title Size | Subtitle | Action Button | Match Reference |
|------|-----------|-------------|------------|----------|---------------|-----------------|
| Campaigns | campaigns-shell.tsx | `p-6`, `h-8 w-8` | `text-2xl` | YES, `mb-8 max-w-md` | YES | REFERENCE |
| Customers | empty-state.tsx | `p-6`, `size={48}` | `text-2xl` | YES, `mb-8 max-w-md` | YES | CLOSE (icon size 48 vs h-8/w-8) |
| Jobs | empty-state.tsx | NO circle | `text-lg` | YES, `text-sm` | YES | NO -- uses dashed border, smaller text |
| History | empty-state.tsx | `p-4`, `size={32}` | `text-lg` | YES, `max-w-sm mb-6` | YES | PARTIAL -- smaller circle/title |
| Feedback | feedback-list.tsx | NO circle | `text-lg` | YES | NO button | NO -- missing circle and action |
| Analytics | analytics-service-breakdown.tsx | `p-6`, `size={32}` | `text-xl` | YES, `mb-6 max-w-sm` | YES | CLOSE (text-xl vs text-2xl) |
| Billing | N/A | N/A | N/A | N/A | N/A | N/A (always has content) |
| Settings | N/A | N/A | N/A | N/A | N/A | N/A (always has content) |

### Pages Using Inline Suspense Instead of loading.tsx

These pages have `<Suspense>` wrappers in their `page.tsx` with spinner fallbacks, which should be replaced by proper `loading.tsx` files:

1. **Jobs** (`app/(dashboard)/jobs/page.tsx` lines 51-58): Inline spinner "Loading jobs..."
2. **Customers** (`app/(dashboard)/customers/page.tsx` lines 41-48): Inline spinner "Loading customers..."
3. **History** (`app/(dashboard)/history/page.tsx` lines 62-70): Inline spinner "Loading send history..."

These pages ALSO have `loading.tsx` files. The inline Suspense creates a double-loading pattern. The `loading.tsx` shows first (route-level), but the inner `<Suspense>` shows a spinner if the server component is slow. The fix: remove the inner `<Suspense>` wrappers and make the pages direct server components that render their client components, letting `loading.tsx` handle the loading state entirely.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skeleton animation | Custom CSS pulse | `Skeleton` from `components/ui/skeleton.tsx` | Uses `animate-pulse-soft` (2s, softer than default Tailwind pulse) |
| Table loading shape | Manual skeleton rows | `TableSkeleton` from `components/skeletons/table-skeleton.tsx` | Handles header, checkbox column, row heights, min-height for layout shift |
| Card loading shape | Manual skeleton cards | `CardSkeleton` from `components/skeletons/card-skeleton.tsx` | Handles icon, title, content lines |
| Empty state layout | Per-page custom markup | Consistent pattern (see Code Examples) | 6 pages need the same structure |
| Navigation progress | Route change indicator | `NavigationProgressBar` already in `AppShell` | Already globally mounted, no per-page work needed |

**Key insight:** The skeleton components already exist and handle layout shift prevention (TableSkeleton calculates `minHeight`). The progress bar is already global. The work is purely normalization, not creation.

## Common Pitfalls

### Pitfall 1: Double Loading States
**What goes wrong:** Pages with both `loading.tsx` AND inline `<Suspense fallback={spinner}>` show two different loading patterns sequentially -- skeleton then spinner.
**Why it happens:** The page was initially built with inline Suspense, then a `loading.tsx` was added later without removing the inline one.
**How to avoid:** When adding `loading.tsx`, remove any inline `<Suspense>` wrappers in `page.tsx`. The route-level loading boundary is sufficient.
**Warning signs:** A page that shows a skeleton, then briefly flashes a spinner before content appears.
**Affected pages:** Jobs, Customers, History.

### Pitfall 2: Container Width Inconsistency
**What goes wrong:** Loading skeletons don't match the actual page width, causing a jarring width shift when content loads.
**Why it happens:** `loading.tsx` uses `container` but the page uses `max-w-4xl`, or vice versa.
**How to avoid:** Match the outermost wrapper class in `loading.tsx` exactly to the page's wrapper. For example, feedback uses `container max-w-4xl py-6` -- its `loading.tsx` must use the same.
**Warning signs:** Content "jumps" horizontally when loading completes.

### Pitfall 3: Spacing Mismatch Between Skeleton and Content
**What goes wrong:** Skeleton has `space-y-8` but rendered content has `space-y-6`, causing a slight vertical shift.
**Why it happens:** The skeleton and actual content are in different files with no shared constant.
**How to avoid:** Pick ONE spacing value for the reference pattern (`space-y-6` or `space-y-8`) and use it everywhere. The campaigns reference uses `space-y-8` for the outer wrapper.
**Warning signs:** Content "jumps" vertically when loading completes.

### Pitfall 4: Server Import of Client Icons
**What goes wrong:** Importing from `@phosphor-icons/react` in a server component (like `loading.tsx`) causes build errors or unnecessary client bundling.
**Why it happens:** `loading.tsx` files are server components by default.
**How to avoid:** In `loading.tsx` files, do NOT use Phosphor icons -- use only `Skeleton` shapes. Icons are only needed in empty states, which live in client components. If an empty state must be a server component, use `@phosphor-icons/react/dist/ssr` imports.
**Warning signs:** "use client" directive added to a loading.tsx file.

### Pitfall 5: Removing Inline Suspense Breaks Streaming
**What goes wrong:** Some pages (jobs, history) use `async function` inside `<Suspense>` to enable streaming. Removing the Suspense wrapper without restructuring can break the page.
**Why it happens:** The pattern `<Suspense><AsyncServerComponent /></Suspense>` enables Next.js to stream the shell while data loads. Simply removing Suspense makes the entire page wait.
**How to avoid:** When removing inline Suspense from `page.tsx`, ensure the page itself is the async server component. The route-level `loading.tsx` provides the Suspense boundary automatically -- Next.js wraps `page.tsx` exports in Suspense using `loading.tsx` as fallback.
**Warning signs:** Page takes longer to show any content after removing inline Suspense.

## Code Examples

### Example 1: Standard loading.tsx for Table Page
```tsx
// For pages with: header + filters + data table (jobs, customers, history)
import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

export default function PageLoading() {
  return (
    <div className="container py-6 space-y-6">
      {/* Header: title + subtitle left, action button right */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters row */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Table */}
      <TableSkeleton rows={8} columns={5} showCheckbox={false} />
    </div>
  )
}
```

### Example 2: Standard loading.tsx for Card-Based Page
```tsx
// For pages with: header + summary cards + content cards (analytics, campaigns)
import { Skeleton } from '@/components/ui/skeleton'

export default function PageLoading() {
  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>

      {/* Content */}
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}
```

### Example 3: Normalized Empty State (Reference Pattern)
```tsx
// Consistent empty state matching campaigns-shell.tsx reference
import { IconName } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export function PageEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <IconName className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mb-2">
        No [items] yet
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        [Contextual guidance -- what will appear here and how to trigger it]
      </p>
      <Button onClick={handleAction}>
        <ActionIcon className="mr-2 h-4 w-4" />
        [Action Label]
      </Button>
    </div>
  )
}
```

### Example 4: Filtered Empty State (No Search Results)
```tsx
// For when filters/search yield no results
import { FunnelSimple } from '@phosphor-icons/react'

export function FilteredEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FunnelSimple size={32} weight="regular" className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No [items] found</h3>
      <p className="text-muted-foreground max-w-sm">
        Try adjusting your search or filter criteria.
      </p>
    </div>
  )
}
```

### Example 5: Removing Inline Suspense (Jobs Page Pattern)
```tsx
// BEFORE: Double loading (loading.tsx + inline Suspense)
export default function JobsPage() {
  return (
    <div className="container py-6 space-y-6">
      <Suspense fallback={<Spinner />}>  {/* REMOVE THIS */}
        <JobsContent />
      </Suspense>
    </div>
  )
}

// AFTER: Let loading.tsx handle it
export default async function JobsPage() {
  const data = await fetchData()
  return (
    <div className="container py-6 space-y-6">
      <JobsClient data={data} />
    </div>
  )
}
// OR if the page already fetches in an async sub-component:
export default function JobsPage() {
  return <JobsContent />  // loading.tsx wraps this automatically
}
```

## Detailed Change Map

### Plan 43-01: Loading Skeleton Consistency

| Page | Action Required |
|------|----------------|
| `/analytics` | CREATE `loading.tsx` -- card-based skeleton (3 summary cards + table placeholder) |
| `/settings` | EXTRACT inline `SettingsLoadingSkeleton` from page.tsx into `loading.tsx` file, use `Skeleton` component instead of raw `bg-muted` divs |
| `/jobs` page.tsx | REMOVE inline `<Suspense>` wrapper with spinner; make page directly render (loading.tsx handles loading) |
| `/customers` page.tsx | REMOVE inline `<Suspense>` wrapper with spinner |
| `/history` page.tsx | REMOVE inline `<Suspense>` wrapper with spinner |
| `/jobs` loading.tsx | NORMALIZE spacing to match reference (`space-y-6` is fine, add subtitle skeleton to header) |
| `/customers` loading.tsx | NORMALIZE spacing, ensure header matches actual page layout |
| `/history` loading.tsx | ADD subtitle skeleton to header section |
| `/feedback` loading.tsx | NORMALIZE wrapper from `container py-8 max-w-4xl` to `container max-w-4xl py-6` for consistency |
| `/billing` loading.tsx | NORMALIZE wrapper from `container mx-auto py-6 px-4` to `container max-w-4xl py-6` |
| `/campaigns` loading.tsx | NO CHANGE (reference) |
| `/contacts` loading.tsx | DELETE (page is a redirect) |
| `/send` | NO ACTION (redirect page) |
| `/dashboard` | NO ACTION (exempt, has its own complex loading) |

### Plan 43-02: Empty State Consistency

| Page | Current Pattern | Needed Changes |
|------|----------------|----------------|
| Campaigns | REFERENCE -- no changes | None |
| Customers | CLOSE -- icon size `size={48}` | Normalize icon to `className="h-8 w-8"` for consistency with reference |
| Jobs | WRONG -- dashed border, no circle, `text-lg` | Rewrite to match reference: add icon circle, use `text-2xl`, remove dashed border |
| History | PARTIAL -- `p-4`, `text-lg` | Enlarge circle to `p-6`, title to `text-2xl`, subtitle spacing to `mb-8 max-w-md` |
| Feedback | WRONG -- no circle, no button | Add `rounded-full bg-muted p-6` wrapper, add guidance action, use `text-2xl` |
| Analytics | CLOSE -- `text-xl`, `max-w-sm` | Normalize title to `text-2xl`, subtitle to `max-w-md mb-8` |
| Billing | N/A | N/A (always has content -- current plan + usage always renders) |
| Settings | N/A | N/A (always has content -- tabs always render) |

### Empty State Content Per Page

| Page | Icon | Title | Subtitle | Action Button |
|------|------|-------|----------|---------------|
| Campaigns | `Megaphone` | "No campaigns yet" | "Set up a campaign to automatically request reviews when you complete jobs." | "Create Campaign" |
| Jobs | `Briefcase` | "No jobs yet" | "Create your first job to start tracking completed work and collecting reviews." | "Add Job" |
| Customers | `AddressBook` | "No customers yet" | "Customers appear here as you complete jobs. Ready to add your first job?" | "Add Your First Job" |
| History | `ClockCounterClockwise` | "No messages sent yet" | "Once you complete a job and it enrolls in a campaign, messages will appear here." | "Add a Job" (link to /jobs) |
| Feedback | `ChatCircle` | "No feedback yet" | "When customers share feedback through your review funnel, it will appear here." | None (guidance only -- no user action triggers feedback) |
| Analytics | `ChartBar` | "No analytics data yet" | "Analytics appear once campaigns start sending. Complete a job to kick off your first campaign." | "Add your first job" |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline `<Suspense>` with spinner | Route-level `loading.tsx` with skeletons | Next.js 13+ App Router | Automatic Suspense boundary, no boilerplate |
| Raw `animate-pulse` divs | `Skeleton` component with `animate-pulse-soft` | Project convention | Softer 2s animation, consistent styling |
| Per-page custom empty states | Standardized empty state pattern | This phase (43) | Visual consistency across all pages |

## Open Questions

1. **Dashboard exempt?**
   - What we know: The phase description says "All data pages (jobs, customers, history, feedback, analytics, billing, settings)" -- dashboard is not listed. Dashboard has a complex layout with KPI widgets, ready-to-send queue, and alerts that don't fit the standard skeleton pattern.
   - Recommendation: Confirm dashboard is exempt. It already has its own `KPIWidgetsSkeleton` in the dashboard client component.

2. **Settings page Suspense pattern**
   - What we know: Settings uses an inline `<Suspense fallback={<SettingsLoadingSkeleton />}>` pattern in page.tsx. Converting to `loading.tsx` is straightforward but the skeleton uses raw `animate-pulse` divs instead of the `Skeleton` component.
   - Recommendation: Extract to `loading.tsx` and rewrite using `Skeleton` component. This is a simple refactor.

3. **Jobs/Customers/History inline Suspense removal**
   - What we know: These pages use `<Suspense>` around async sub-components. The simplest fix is to move the async logic up to the page level (which is already an async server component in practice) and remove the wrapping Suspense, since `loading.tsx` provides the boundary.
   - What's unclear: Whether the current pattern provides any streaming benefit over the flat approach.
   - Recommendation: Restructure to remove inline Suspense. The `loading.tsx` boundary already handles the loading state. Jobs and Customers already fetch data in the sub-component and pass to a client component -- this can be flattened to the page level like campaigns does.

## Sources

### Primary (HIGH confidence)
- **Codebase audit** -- Direct file reads of all loading.tsx files, page.tsx files, empty state components, skeleton components, and the app shell
- `components/ui/skeleton.tsx` -- Base skeleton primitive
- `components/skeletons/table-skeleton.tsx` -- Table skeleton with layout shift prevention
- `components/skeletons/card-skeleton.tsx` -- Card skeleton variants
- `components/ui/progress-bar.tsx` -- Navigation progress bar implementation
- `components/layout/app-shell.tsx` -- Global shell with progress bar
- `app/(dashboard)/campaigns/loading.tsx` -- Reference loading pattern
- `app/(dashboard)/campaigns/campaigns-shell.tsx` -- Reference empty state pattern

### Secondary (MEDIUM confidence)
- Next.js App Router loading.tsx convention -- well-documented in Next.js docs, verified by codebase usage

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components already exist in the codebase, no new dependencies
- Architecture: HIGH -- reference patterns are in production, just need normalization
- Pitfalls: HIGH -- identified from direct codebase audit of actual inconsistencies

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable -- no external dependencies involved)
