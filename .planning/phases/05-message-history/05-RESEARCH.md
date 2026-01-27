# Phase 5: Message History - Research

**Researched:** 2026-01-27
**Domain:** Data table UI with server-side filtering and pagination
**Confidence:** HIGH

## Summary

Phase 5 builds a message history interface to display and filter sent review requests. The technical domain involves data table UIs with server-side filtering, date range queries, and status tracking - all patterns well-established in the Next.js + Supabase ecosystem.

The standard approach uses URL search parameters for filter state (maintaining bookmarkability), TanStack Table for client-side table features (sorting, display), and server-side data fetching based on searchParams for optimal performance. The existing codebase already uses TanStack Table v8 for contacts, providing a proven pattern to replicate.

Key architectural decision: Hybrid server-client pattern where Server Components handle data fetching with URL params, and Client Components provide interactive filtering UI that updates the URL. This balances performance (server-side filtering of large datasets) with UX (smooth interactions without full page reloads).

**Primary recommendation:** Follow the existing contacts table pattern (Server Component page + Client Component table) with URL-based filtering for date ranges and search terms. Use Supabase indexed queries on `created_at` for performant date filtering.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TanStack Table | ^8.21.3 | Client-side table state, sorting, pagination UI | Industry standard for React data tables, already in use for contacts |
| Next.js App Router | latest | Server/client component architecture, URL routing | Project standard, built-in searchParams support |
| Supabase JS | latest | Database queries with RLS | Project standard, existing send_logs table ready |
| date-fns | ^4.1.0 | Date formatting and manipulation | Already installed, modern, tree-shakeable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Badge | - | Status indicator badges | Display email status (sent, delivered, bounced, etc.) |
| Lucide React | ^0.511.0 | Icons for filters, status | Already in use, consistent icon set |
| Next.js searchParams | - | URL state management | Filter persistence, bookmarkable URLs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL params | Client state (useState) | Client state loses bookmarkability, breaks back/forward nav |
| TanStack Table | AG Grid / MUI DataGrid | Over-engineered for this use case, TanStack already proven in codebase |
| date-fns | Day.js / Moment.js | date-fns already installed, moment is deprecated |

**Installation:**
```bash
# No new dependencies needed - all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/(dashboard)/history/
├── page.tsx                    # Server Component - receives searchParams, fetches data
components/history/
├── history-client.tsx          # Client Component - receives initial data
├── history-table.tsx           # Table with TanStack Table
├── history-filters.tsx         # Filter controls (search, date range, status)
├── history-columns.tsx         # Column definitions
└── status-badge.tsx            # Status display component
lib/data/
└── send-logs.ts                # Already exists - may need extension for filtering
```

### Pattern 1: URL-Based Filter State (Server-Client Hybrid)
**What:** Use URL search parameters to persist filter state, Server Components for data fetching, Client Components for interactivity.

**When to use:** Any filtered/paginated list view, especially with large datasets.

**Example:**
```typescript
// app/(dashboard)/history/page.tsx (Server Component)
// Source: https://nextjs.org/learn/dashboard-app/adding-search-and-pagination

import { Suspense } from 'react'
import { HistoryClient } from '@/components/history/history-client'
import { getSendLogs } from '@/lib/data/send-logs'

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string
    status?: string
    from?: string
    to?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const query = params.query || ''
  const status = params.status || 'all'
  const from = params.from || ''
  const to = params.to || ''
  const page = Number(params.page) || 1

  const { logs, total } = await getSendLogs({
    query,
    status: status === 'all' ? undefined : status,
    dateFrom: from || undefined,
    dateTo: to || undefined,
    page,
    limit: 50,
  })

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HistoryClient initialLogs={logs} total={total} />
    </Suspense>
  )
}
```

```typescript
// components/history/history-filters.tsx (Client Component)
// Source: https://nextjs.org/learn/dashboard-app/adding-search-and-pagination

'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function HistoryFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const [isPending, startTransition] = useTransition()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1') // Reset to first page on filter change

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex gap-4">
      <Input
        placeholder="Search by name or email..."
        defaultValue={searchParams.get('query') || ''}
        onChange={(e) => updateFilter('query', e.target.value)}
      />
      {/* Date range, status filters */}
    </div>
  )
}
```

### Pattern 2: Date Range Filtering with Supabase
**What:** Use indexed timestamp queries on send_logs.created_at for performant date filtering.

**When to use:** Filtering logs by date range.

**Example:**
```typescript
// lib/data/send-logs.ts extension
// Source: https://supabase.com/docs/guides/database/query-optimization

export async function getSendLogs(options: {
  query?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { logs: [], total: 0 }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return { logs: [], total: 0 }

  let query = supabase
    .from('send_logs')
    .select('*, contacts!inner(name, email)', { count: 'exact' })
    .eq('business_id', business.id)

  // Date range filter (uses existing index on created_at)
  if (options.dateFrom) {
    query = query.gte('created_at', options.dateFrom)
  }
  if (options.dateTo) {
    query = query.lte('created_at', options.dateTo)
  }

  // Status filter
  if (options.status) {
    query = query.eq('status', options.status)
  }

  // Search filter (name or email from joined contacts)
  if (options.query) {
    query = query.or(`name.ilike.%${options.query}%,email.ilike.%${options.query}%`, {
      referencedTable: 'contacts'
    })
  }

  // Pagination
  const page = options.page || 1
  const limit = options.limit || 50
  const offset = (page - 1) * limit

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching send logs:', error)
    return { logs: [], total: 0 }
  }

  return {
    logs: data as SendLogWithContact[],
    total: count || 0,
  }
}
```

### Pattern 3: Status Badge Component
**What:** Visual status indicators using color-coded badges for email delivery states.

**When to use:** Displaying email status in tables.

**Example:**
```typescript
// components/history/status-badge.tsx
// Source: https://ui.shadcn.com/docs/components/badge
// Source: https://documentation.mailjet.com/hc/en-us/articles/360048398994

import { Badge } from '@/components/ui/badge'

type Status = 'pending' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed' | 'opened'

const statusConfig: Record<Status, { label: string; variant: string; className: string }> = {
  pending: { label: 'Pending', variant: 'secondary', className: 'bg-gray-100' },
  sent: { label: 'Sent', variant: 'default', className: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Delivered', variant: 'default', className: 'bg-green-100 text-green-800' },
  bounced: { label: 'Bounced', variant: 'destructive', className: 'bg-red-100 text-red-800' },
  complained: { label: 'Complained', variant: 'destructive', className: 'bg-orange-100 text-orange-800' },
  failed: { label: 'Failed', variant: 'destructive', className: 'bg-red-100 text-red-800' },
  opened: { label: 'Opened', variant: 'default', className: 'bg-emerald-100 text-emerald-800' },
}

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant as any} className={config.className}>
      {config.label}
    </Badge>
  )
}
```

### Pattern 4: TanStack Table with Server Data
**What:** Use TanStack Table for client-side sorting/pagination UI while server handles data fetching.

**When to use:** Large datasets where server-side filtering is needed but client-side table features improve UX.

**Example:**
```typescript
// components/history/history-table.tsx
// Source: Existing pattern from components/contacts/contact-table.tsx

'use client'

import { useMemo } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table'
import { createColumns } from './history-columns'

export function HistoryTable({ logs }: { logs: SendLogWithContact[] }) {
  const columns = useMemo(() => createColumns(), [])

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Note: Pagination handled by server/URL, not client
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Anti-Patterns to Avoid
- **Client-side filtering of large datasets:** Don't fetch all logs and filter client-side. Use server-side queries with URL params. Reason: Performance degrades with large datasets, wastes bandwidth.
- **Separate state for filters and URL:** Don't maintain filter state in useState separate from URL. Keep URL as single source of truth. Reason: Causes sync issues, breaks bookmarking.
- **Not resetting page on filter change:** Always reset to page 1 when filters change. Reason: Page 5 of filtered results might not exist, showing empty state.
- **Custom date pickers without input fallback:** Don't require fancy date pickers. Provide standard HTML date inputs as base. Reason: Accessibility, mobile support.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table sorting/pagination | Custom state management | TanStack Table | Already in codebase, handles edge cases (empty states, type coercion) |
| Date formatting | String manipulation | date-fns format() | Handles timezones, locales, edge cases already installed |
| Status badge colors | Inline conditional classes | CVA-based component | Consistency, reusability, type safety |
| URL state sync | Manual URLSearchParams logic | Next.js useSearchParams + useRouter | Framework-optimized, handles edge cases |
| Date range validation | Custom date comparison | date-fns isWithinInterval, isBefore, isAfter | Handles timezone edge cases, DST transitions |

**Key insight:** History/audit log UIs have well-established patterns. The contacts table already demonstrates the architecture. Don't reinvent - replicate and extend that pattern with date filtering.

## Common Pitfalls

### Pitfall 1: N+1 Queries on Contact Joins
**What goes wrong:** Fetching send_logs first, then fetching each contact separately in a loop causes hundreds of queries.

**Why it happens:** Forgetting to use Supabase's join syntax with `!inner()` for required joins.

**How to avoid:** Use Supabase join in initial query:
```typescript
.select('*, contacts!inner(name, email)', { count: 'exact' })
```
The `!inner` ensures only logs with valid contacts are returned (important after contact deletes).

**Warning signs:** Query takes >1s on small datasets, database connection pool exhaustion.

### Pitfall 2: Date Filter Timezone Confusion
**What goes wrong:** User selects "Jan 15, 2026" but query returns wrong results because of UTC conversion mismatches.

**Why it happens:** Browser input gives local date, database stores UTC timestamps, comparison happens without timezone normalization.

**How to avoid:**
- Store all dates in UTC (already done via Postgres `TIMESTAMPTZ`)
- Convert user input to UTC start-of-day / end-of-day for range queries
- Display dates in user's timezone using date-fns `formatInTimeZone` or `format`

```typescript
// Convert local date string to UTC for query
const startOfDay = new Date(dateInput)
startOfDay.setHours(0, 0, 0, 0)
const endOfDay = new Date(dateInput)
endOfDay.setHours(23, 59, 59, 999)
```

**Warning signs:** Off-by-one-day errors, "no results" when data exists.

### Pitfall 3: Empty State vs Loading State Confusion
**What goes wrong:** Showing "No messages found" while data is still loading, causing flashing UI.

**Why it happens:** Not distinguishing between "loading", "loaded with no results", and "error" states.

**How to avoid:** Use React Suspense for loading states, show empty state only after data resolves:
```typescript
// Server Component with Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <HistoryContent searchParams={searchParams} />
</Suspense>

// In HistoryContent, only show empty state if data.length === 0
{logs.length === 0 ? <EmptyState /> : <Table />}
```

**Warning signs:** Users report flashing "no results" message on page load.

### Pitfall 4: Not Indexing Filter Columns
**What goes wrong:** Date range queries slow down as send_logs grows, taking 5-10 seconds on 10,000+ rows.

**Why it happens:** Missing database index on `created_at` column for range queries.

**How to avoid:** Phase 4 already created index on `created_at DESC` for recent history. For date ranges, verify index exists:
```sql
-- Already exists from Phase 4:
CREATE INDEX IF NOT EXISTS idx_send_logs_created_at ON public.send_logs USING btree (created_at DESC);
```

This B-tree index supports range queries efficiently. BRIN index could be 10x smaller for append-only tables but B-tree is fine for this scale.

**Warning signs:** Query performance degrades as logs grow, EXPLAIN shows Seq Scan on send_logs.

### Pitfall 5: Over-fetching Data
**What goes wrong:** Fetching full email body for every row in table when only showing recipient, status, date.

**Why it happens:** Using `select('*')` without considering what's actually displayed.

**How to avoid:** Only select needed columns:
```typescript
.select('id, status, subject, created_at, contacts!inner(name, email)')
```

Don't fetch `error_message` unless expanding a row detail. Don't fetch `template_id` unless needed.

**Warning signs:** Network tab shows large response payloads, slow queries on large datasets.

### Pitfall 6: Pagination State Loss on Filter Change
**What goes wrong:** User is on page 3, applies a filter, sees empty table because filtered results only have 1 page.

**Why it happens:** Not resetting page to 1 when filters change.

**How to avoid:** Always set page to 1 when any filter changes:
```typescript
function updateFilter(key: string, value: string) {
  const params = new URLSearchParams(searchParams)
  params.set('page', '1') // Reset pagination
  if (value) {
    params.set(key, value)
  } else {
    params.delete(key)
  }
  replace(`${pathname}?${params.toString()}`)
}
```

**Warning signs:** Users report "nothing found" after filtering when results exist.

## Code Examples

Verified patterns from official sources:

### Date Formatting with date-fns
```typescript
// Source: date-fns v4 (already installed)
import { format, formatDistanceToNow } from 'date-fns'

// Display date in table
format(new Date(log.created_at), 'MMM d, yyyy h:mm a')
// Output: "Jan 27, 2026 3:45 PM"

// Relative time for recent messages
formatDistanceToNow(new Date(log.created_at), { addSuffix: true })
// Output: "2 hours ago"
```

### Supabase Date Range Query
```typescript
// Source: https://supabase.com/docs/guides/database/query-optimization
// Use existing index on created_at for performance

const { data } = await supabase
  .from('send_logs')
  .select('*')
  .gte('created_at', '2026-01-01T00:00:00Z')
  .lte('created_at', '2026-01-31T23:59:59Z')
  .order('created_at', { ascending: false })
```

### Empty State Pattern
```typescript
// Source: https://carbondesignsystem.com/patterns/empty-states-pattern/
// Source: https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="text-center py-12">
        <h3>No messages found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search term
        </p>
        <Button onClick={clearFilters}>Clear filters</Button>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <h3>No messages sent yet</h3>
      <p className="text-muted-foreground">
        Send your first review request to see it here
      </p>
      <Button asChild>
        <Link href="/dashboard/send">Send message</Link>
      </Button>
    </div>
  )
}
```

### Loading Skeleton Pattern
```typescript
// Source: Existing pattern from app/(dashboard)/contacts/page.tsx

export default function HistoryPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HistoryContent />
    </Suspense>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted animate-pulse rounded" />
      <div className="h-64 bg-muted animate-pulse rounded" />
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side filtering | Server-side filtering with URL params | Next.js 13+ App Router | Better performance, SEO, bookmarkability |
| useState for filters | searchParams prop/hook | Next.js 13+ App Router | Simplified state management, URL as source of truth |
| Manual URLSearchParams | Next.js navigation hooks | Next.js 13+ App Router | Framework-optimized transitions, automatic loading states |
| Moment.js | date-fns | ~2020 | Smaller bundle, tree-shakeable, still maintained |
| searchParams as object | searchParams as Promise | Next.js 15 | Async streaming, better suspense integration |

**Deprecated/outdated:**
- Moment.js: Deprecated, use date-fns (already installed)
- Pages Router pagination patterns: Don't use getServerSideProps, use App Router with Server Components
- Client-side table libraries for large datasets: Don't fetch all data client-side, use hybrid server-client pattern

## Open Questions

Things that couldn't be fully resolved:

1. **Date picker library choice**
   - What we know: Project uses native HTML date inputs work, shadcn has no built-in date picker
   - What's unclear: Whether to add a date picker library (react-day-picker) or use native inputs
   - Recommendation: Start with native HTML date inputs (`<input type="date">`). Add library only if user feedback demands it. Native inputs work well on mobile, are accessible by default.

2. **Search debouncing library**
   - What we know: Next.js docs recommend `use-debounce` for search input debouncing
   - What's unclear: Whether to add this dependency or implement simple debounce
   - Recommendation: Implement simple debounce with setTimeout (300ms) first. Add `use-debounce` only if more complex debouncing needed elsewhere.

3. **Status filter UI pattern**
   - What we know: Need to filter by status (sent, delivered, bounced, etc.)
   - What's unclear: Dropdown vs. button group vs. checkbox group
   - Recommendation: Use dropdown (select) for single status filter. Matches existing shadcn patterns, scales if more statuses added later.

4. **Export functionality**
   - What we know: Users often want to export message history as CSV
   - What's unclear: Whether to include in Phase 5 or defer
   - Recommendation: Defer to later phase unless explicitly required. Focus on core viewing/filtering first.

## Sources

### Primary (HIGH confidence)
- Next.js Official Docs: [Adding Search and Pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) - URL params pattern
- Supabase Docs: [Query Optimization](https://supabase.com/docs/guides/database/query-optimization) - Date filtering, indexing
- TanStack Table v8: [Column Filtering Guide](https://tanstack.com/table/v8/docs/guide/column-filtering) - API reference
- Existing codebase: `components/contacts/contact-table.tsx` - Proven TanStack Table pattern

### Secondary (MEDIUM confidence)
- [UI best practices for loading, error, and empty states in React - LogRocket](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/) - Empty state patterns
- [Email statuses explained - Mailjet](https://documentation.mailjet.com/hc/en-us/articles/360048398994-Email-statuses-all-metrics-explained) - Status definitions
- [Badge component - shadcn/ui](https://ui.shadcn.com/docs/components/badge) - Status badge patterns
- [Status Trackers and Progress Updates - Nielsen Norman Group](https://www.nngroup.com/articles/status-tracker-progress-update/) - UX best practices

### Secondary (MEDIUM confidence) - Community patterns verified with official docs
- [Shadcn DataTable Server Side Pagination on NextJS App Router](https://medium.com/@destiya.dian/shadcn-datatable-server-side-pagination-on-nextjs-app-router-83a35075c767) - Implementation pattern
- [Managing Advanced Search Param Filtering in Next.js App Router](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) - Advanced filtering
- [Build server-side pagination using Next.js App Router](https://www.alaminshaikh.com/blog/build-server-side-pagination-using-nextjs-app-router) - Pagination details

### Tertiary (LOW confidence)
- Various GitHub discussions on TanStack Table date filtering - No official date range pattern documented, community implementations vary

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use
- Architecture: HIGH - Pattern exists in codebase (contacts table), Next.js docs cover searchParams thoroughly
- Pitfalls: HIGH - Database pitfalls well-documented by Supabase, timezone issues are known domain problems
- UI patterns: MEDIUM - Badge patterns verified, but exact status color scheme is discretionary

**Research date:** 2026-01-27
**Valid until:** ~2026-02-27 (30 days, stable domain)

**Notes:**
- No new dependencies required - all patterns use existing stack
- send_logs table and indexes already exist from Phase 4
- Contacts table provides working reference implementation
- Date-fns v4 is current, stable API
- Next.js 15 searchParams as Promise pattern is current
