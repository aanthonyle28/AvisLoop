# Phase 13: Scheduling & Navigation - Research

**Researched:** 2026-01-29
**Domain:** UI/UX scheduling interface, navigation badge counts, data display
**Confidence:** HIGH

## Summary

This phase builds the user-facing UI for scheduled sends that were already created in Phase 12. The domain involves three main areas: (1) scheduling UI with preset and custom date/time pickers (already implemented in ScheduleSelector), (2) navigation enhancements with badge counts showing pending scheduled sends, and (3) a dedicated /scheduled page to view and manage scheduled sends.

The codebase already has most scheduling infrastructure from Phase 12 (types, actions, database function, cron processing). The ScheduleSelector component and send-form integration are complete. What's missing is the navigation visibility (sidebar/mobile nav links with badge counts) and the /scheduled page itself.

The standard approach uses:
- Native HTML5 `<input type="datetime-local">` with date-fns formatting (already implemented)
- Existing shadcn/ui Badge component for count display
- Server Component data fetching for badge counts (avoid client-side overhead)
- Simple table/list UI for scheduled sends with cancel action
- Supabase count queries with proper RLS scoping

**Primary recommendation:** Use Server Component for badge counts fetched once per page load, implement /scheduled page as server-rendered table with server actions for cancel, add "Scheduled" nav item with Badge count to sidebar and bottom-nav.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | ^4.1.0 | Date formatting and manipulation | Already in use, provides `format()` for datetime-local inputs and display formatting |
| shadcn/ui Badge | (CVA-based) | Count badge display | Already implemented in components/ui/badge.tsx, styled with Tailwind |
| React Server Components | Next.js 15+ | Server-side data fetching | Zero-JS approach for initial badge counts, eliminates client waterfalls |
| Supabase count() | latest | Database aggregation | Built-in count() method with automatic RLS enforcement |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.511.0 | Clock/Calendar icons | Already used for navigation icons (Clock for scheduling UI) |
| Supabase RPC | latest | Atomic operations | For bulk status updates if needed (already used in cron) |
| revalidatePath | Next.js | Cache invalidation | After cancel action to refresh counts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Component counts | Client-side SWR/React Query | Real-time updates vs. simpler implementation; server approach sufficient for this use case |
| Native datetime-local | Third-party date picker | More features vs. complexity; native input adequate for MVP |
| Table display | Calendar view | Visual richness vs. implementation time; table meets requirements |

**Installation:**
No new packages needed. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/(dashboard)/
├── scheduled/
│   └── page.tsx              # Server Component: fetch + display scheduled sends
components/
├── scheduled/
│   ├── scheduled-table.tsx   # Client Component: table with cancel buttons
│   └── cancel-button.tsx     # Client Component: optimistic cancel action
├── layout/
│   ├── sidebar.tsx           # Update: add Scheduled nav item with badge
│   └── bottom-nav.tsx        # Update: add Scheduled nav item with badge
├── ui/
│   └── badge.tsx             # Already exists
lib/
├── actions/
│   └── schedule.ts           # Already exists: cancelScheduledSend, getScheduledSends
├── data/
│   └── scheduled.ts          # NEW: getPendingScheduledCount for badge
```

### Pattern 1: Server Component Badge Count Fetching
**What:** Fetch pending scheduled send count in navigation layout using Server Component pattern
**When to use:** Navigation components that need dynamic counts but don't require real-time updates
**Example:**
```typescript
// In sidebar.tsx or separate server component
import { createClient } from '@/lib/supabase/server'

async function getPendingCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return 0

  const { count } = await supabase
    .from('scheduled_sends')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'pending')

  return count || 0
}

// In layout or sidebar
const pendingCount = await getPendingCount()

<Link href="/scheduled">
  <span>Scheduled</span>
  {pendingCount > 0 && <Badge>{pendingCount}</Badge>}
</Link>
```

### Pattern 2: Scheduled Sends List Page (Server Component + Server Actions)
**What:** Server Component fetches scheduled sends, Client Component handles cancel actions
**When to use:** List/table pages with data fetching + user actions
**Example:**
```typescript
// app/(dashboard)/scheduled/page.tsx
import { getScheduledSends } from '@/lib/actions/schedule'
import { ScheduledTable } from '@/components/scheduled/scheduled-table'

export default async function ScheduledPage() {
  const scheduledSends = await getScheduledSends()

  return (
    <div>
      <h1>Scheduled Sends</h1>
      <ScheduledTable sends={scheduledSends} />
    </div>
  )
}

// components/scheduled/scheduled-table.tsx
'use client'
import { cancelScheduledSend } from '@/lib/actions/schedule'

export function ScheduledTable({ sends }) {
  const handleCancel = async (id: string) => {
    const result = await cancelScheduledSend(id)
    // Handle result (toast, revalidate, etc.)
  }

  return <table>...</table>
}
```

### Pattern 3: Navigation Item with Badge Count
**What:** Nav link with optional badge showing count when > 0
**When to use:** Navigation items that need to surface pending/unread counts
**Example:**
```typescript
// Reusable pattern for sidebar and bottom nav
{pendingCount > 0 && (
  <Badge
    variant="destructive"
    className="ml-auto"
  >
    {pendingCount}
  </Badge>
)}
```

### Anti-Patterns to Avoid
- **Client-side count polling:** Don't use setInterval or client effects to fetch counts repeatedly - Server Component refetch on navigation is sufficient
- **Separate count API route:** Don't create dedicated /api/scheduled/count endpoint - inline the count query in Server Component
- **Over-engineered real-time:** Don't add Supabase Realtime subscriptions for counts - user navigates between pages frequently enough
- **Inline cancel in table:** Don't use form submission inline - use button with server action for better UX

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting for datetime-local input | Custom string concatenation | `date-fns format(date, "yyyy-MM-dd'T'HH:mm")` | Handles edge cases, timezone consistency, already implemented in lib/utils/schedule.ts |
| Badge count display | Custom styled span | shadcn/ui Badge component | Consistent styling, accessible, already in codebase |
| Table sorting/filtering | Custom state management | Keep it simple or use @tanstack/react-table (already in deps) | Already using for contacts table, proven pattern |
| Cancel confirmation | Custom modal | Native confirm() or existing Dialog component | Simpler, meets requirement |
| Optimistic updates | Manual state management | useOptimistic or server action + revalidatePath | React 19 feature, cleaner code |

**Key insight:** This phase is mostly wiring existing pieces together. The hard problems (atomic scheduling, cron processing, date handling) were solved in Phase 12. Avoid rebuilding what already works.

## Common Pitfalls

### Pitfall 1: Badge Count Stale After Actions
**What goes wrong:** User cancels a scheduled send but badge count doesn't update until page refresh
**Why it happens:** Server Component only renders once, doesn't re-fetch on client actions
**How to avoid:** Use `revalidatePath('/scheduled')` and `revalidatePath('/send')` in cancelScheduledSend action (already implemented line 131-132 of lib/actions/schedule.ts)
**Warning signs:** User reports "cancelled send still shows in count" or "count doesn't match list"

### Pitfall 2: RLS Bypass in Count Query
**What goes wrong:** Badge count query doesn't filter by business_id, shows wrong count or fails
**Why it happens:** Forgetting that scheduled_sends table has RLS policies requiring business_id filter
**How to avoid:** Always fetch business_id first, then query scheduled_sends with .eq('business_id', business.id)
**Warning signs:** Badge shows 0 count when scheduled sends exist, or Postgres RLS errors in logs

### Pitfall 3: Timezone Display Confusion
**What goes wrong:** Scheduled time displays in UTC instead of user's local timezone
**Why it happens:** Database stores ISO strings in UTC, direct display without conversion
**How to avoid:** Use `formatScheduleDate()` utility (already in lib/utils/schedule.ts line 56) which uses date-fns `format()` with local timezone
**Warning signs:** User scheduled "9:00 AM" but sees "17:00:00" or other offset time

### Pitfall 4: Missing Database Migration
**What goes wrong:** Function claim_due_scheduled_sends fails because scheduled_sends table doesn't exist
**Why it happens:** Phase 12 verification identified that scheduled_sends table creation wasn't tracked in migrations
**How to avoid:** Before implementing Phase 13 UI, verify scheduled_sends table exists or create migration 00009_create_scheduled_sends.sql with proper schema, RLS, and indexes
**Warning signs:** Postgres errors "relation scheduled_sends does not exist" when deploying to fresh database

### Pitfall 5: Badge in Client Component Forces Client Rendering
**What goes wrong:** Sidebar becomes client component because it needs badge count, loses Server Component benefits
**Why it happens:** Trying to fetch count in same component that renders interactive navigation
**How to avoid:** Two approaches: (1) Pass count as prop from layout/parent Server Component, or (2) Accept that navigation is client component and fetch count in parent layout
**Warning signs:** "use client" directive added to sidebar, bundle size increases

## Code Examples

Verified patterns from official sources and existing codebase:

### Database Count Query with RLS
```typescript
// Source: Existing codebase pattern + Supabase docs
// lib/data/scheduled.ts (NEW FILE)
import { createClient } from '@/lib/supabase/server'

export async function getPendingScheduledCount(): Promise<number> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return 0

  const { count } = await supabase
    .from('scheduled_sends')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'pending')

  return count || 0
}
```

### Scheduled Page with Server Component Data Fetching
```typescript
// Source: Existing codebase pattern (contacts/page.tsx, history/page.tsx)
// app/(dashboard)/scheduled/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getScheduledSends } from '@/lib/actions/schedule'
import Link from 'next/link'
import { Calendar, Send } from 'lucide-react'
import { ScheduledTable } from '@/components/scheduled/scheduled-table'

export default async function ScheduledPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const scheduledSends = await getScheduledSends()

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Scheduled Sends</h1>
        <p className="text-muted-foreground mt-1">
          Manage your scheduled review requests
        </p>
      </div>

      {scheduledSends.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No scheduled sends</h3>
          <p className="text-muted-foreground mb-4">
            Schedule review requests from the Send page
          </p>
          <Link
            href="/send"
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4 mr-2" />
            Schedule Send
          </Link>
        </div>
      ) : (
        <ScheduledTable sends={scheduledSends} />
      )}
    </div>
  )
}
```

### Nav Item with Badge Count
```typescript
// Source: Existing sidebar.tsx pattern + shadcn/ui Badge
// components/layout/sidebar.tsx (UPDATE)
import { Badge } from '@/components/ui/badge'
import { getPendingScheduledCount } from '@/lib/data/scheduled'

// In mainNav array, add:
// { icon: Calendar, label: 'Scheduled', href: '/scheduled' }

// In NavLink component rendering:
const NavLink = ({ item, count }: { item: NavItem; count?: number }) => {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
          : "text-muted-foreground",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <>
          <span>{item.label}</span>
          {count !== undefined && count > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {count}
            </Badge>
          )}
        </>
      )}
    </Link>
  )
}
```

### Cancel Button with Server Action
```typescript
// Source: Existing codebase pattern (contacts delete pattern)
// components/scheduled/cancel-button.tsx
'use client'

import { useState } from 'react'
import { cancelScheduledSend } from '@/lib/actions/schedule'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'

interface CancelButtonProps {
  scheduledSendId: string
  onCancel?: () => void
}

export function CancelButton({ scheduledSendId, onCancel }: CancelButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Cancel this scheduled send?')) return

    setIsPending(true)
    const result = await cancelScheduledSend(scheduledSendId)
    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Scheduled send cancelled')
      onCancel?.()
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="text-sm text-destructive hover:underline disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </button>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side count polling with useEffect | Server Component fetch on navigation | Next.js 13+ (2023) | Eliminates client JS, faster page loads, simpler code |
| Custom date picker libraries | Native HTML5 datetime-local | 2020+ (browser support reached 95%) | Zero dependencies, native validation, accessibility |
| Separate API routes for badge counts | Inline queries in Server Components | Next.js 15 (2024) | Fewer files, co-located logic, automatic optimization |
| useOptimistic manual state | React 19 useOptimistic hook | React 19 (2024) | Built-in optimistic updates, cleaner code |

**Deprecated/outdated:**
- react-datepicker, react-day-picker for simple scheduling: Native datetime-local is sufficient for this use case
- SWR/React Query for badge counts in navigation: Server Component pattern is simpler and sufficient
- Custom badge components: shadcn/ui Badge already implemented

## Open Questions

Things that couldn't be fully resolved:

1. **Should badge counts update in real-time or only on navigation?**
   - What we know: Server Component pattern fetches once per page load
   - What's unclear: Whether users expect instant count updates without navigation
   - Recommendation: Start with navigation-based refresh (simpler), add real-time only if user feedback demands it. Most scheduling tools (Mailchimp, Calendly) don't have real-time badge updates.

2. **Should sidebar become a Server Component to show badge count?**
   - What we know: Current sidebar is client component for collapse state and pathname detection
   - What's unclear: Best pattern for mixing server-fetched data with client interactivity
   - Recommendation: Keep sidebar as client component, pass count as prop from layout Server Component. Layout re-renders on navigation anyway.

3. **Does scheduled_sends table migration exist?**
   - What we know: Phase 12 verification (line 9) identified "scheduled_sends table not tracked in migrations"
   - What's unclear: Whether table was manually created or needs migration file
   - Recommendation: Verify table exists with `\d scheduled_sends` in psql, create migration 00009_create_scheduled_sends.sql if missing. See Phase 12 verification lines 81-86 for required schema.

4. **What happens if user schedules many sends (100+)?**
   - What we know: Badge displays raw count, table lists all
   - What's unclear: UI/UX implications of large counts
   - Recommendation: Implement "99+" cap on badge count (common pattern), add pagination to scheduled table if >50 rows. Monitor usage patterns before optimizing.

## Sources

### Primary (HIGH confidence)
- Existing codebase files:
  - lib/utils/schedule.ts - formatScheduleDate, SCHEDULE_PRESETS
  - lib/actions/schedule.ts - cancelScheduledSend, getScheduledSends
  - components/ui/badge.tsx - Badge component implementation
  - components/send/schedule-selector.tsx - Scheduling UI pattern
  - .planning/phases/12-cron-processing/12-VERIFICATION.md - Identified missing table migration
- date-fns documentation: https://date-fns.org/docs/format (format string patterns)
- Supabase count() query method (verified in existing codebase usage)

### Secondary (MEDIUM confidence)
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - Count query performance with RLS
- [Data Table Design UX Patterns & Best Practices](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables) - Table UI patterns
- [React Server Components for Enterprise Applications (2026)](https://medium.com/@vasanthancomrads/react-server-components-for-enterprise-applications-bc445e1cd572) - Server Component data fetching patterns

### Tertiary (LOW confidence)
- [Next.js Date & Time Localization Guide](https://staarter.dev/blog/nextjs-date-and-time-localization-guide) - Date formatting best practices (WebSearch only)
- [Shadcn Badge](https://www.shadcn.io/ui/badge) - Badge component patterns (general guidance)
- [Sidebar with Notification Badge count | ReadymadeUI](https://readymadeui.com/tailwind/component/sidebar-with-notification-badge-count) - Badge count UI examples (generic pattern)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, patterns verified in existing code
- Architecture: HIGH - Server Component + Server Action pattern proven in contacts/history pages
- Pitfalls: HIGH - Based on Phase 12 verification findings and existing codebase patterns

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days - stable domain, established patterns)

---

**Note for planner:** The ScheduleSelector component and send-form integration are already complete. This phase focuses on navigation visibility (adding "Scheduled" link with badge) and the /scheduled page for viewing/managing scheduled sends. The main dependency risk is the missing scheduled_sends table migration identified in Phase 12 verification - verify table exists before implementing UI.
