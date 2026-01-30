# Phase 14: Scheduled Send Management - Research

**Researched:** 2026-01-29
**Domain:** Table enhancements (tabs, expandable rows, bulk selection), bulk operations, modal dialogs
**Confidence:** HIGH

## Summary

This phase extends the existing `/scheduled` page (built in Phase 13) with advanced table features for managing scheduled sends. The domain involves four main areas: (1) tabbed navigation to separate Pending and Past sends, (2) expandable row detail views showing per-contact send results, (3) bulk selection with shift-click range selection for multi-send operations, and (4) bulk actions (reschedule/cancel) with confirmation dialogs.

The codebase already has the foundation from Phase 13: the `/scheduled` page with basic list view, cancel action, and the `ScheduleSelector` component for date/time picking. Phase 15 completed the design system migration to Phosphor icons, Kumbh Sans typography, and semantic status colors. What's needed is: convert the list to a tabbed interface, add expandable rows for result details, implement row selection with checkboxes and shift-click range support, add a floating action bar (Gmail-style), wire up bulk reschedule/cancel actions, and replace native `confirm()` with styled dialogs.

The standard approach uses:
- Radix UI Tabs (already in @radix-ui/react-dialog dependency via shadcn/ui)
- TanStack Table expanding feature with `getExpandedRowModel`
- Row selection state with shift-click handler for range selection
- Floating action bar with fixed positioning
- Radix UI Dialog for confirmations (already available via shadcn/ui)
- Server actions for bulk operations (array of IDs passed to single action)
- Supabase `send_log_ids` array join for fetching detailed results

**Primary recommendation:** Add Radix Tabs for Pending/Past split, use TanStack Table's expanding feature for row details, implement shift-click range selection manually (track lastSelectedId), show floating action bar on selection count > 0, pass arrays to bulk server actions, join send_logs via send_log_ids array to display per-contact results.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | ^8.21.3 | Table state management with expanding | Already in use for contacts/history tables, provides built-in expanding feature via `getExpandedRowModel` |
| @radix-ui/react-dialog | ^1.1.15 | Confirmation modals | Already installed (shadcn/ui dependency), accessible modal primitives |
| Radix UI Tabs | (peer dep) | Pending/Past tab navigation | Available via @radix-ui/react-tabs peer dependency, unstyled primitives for keyboard navigation |
| Supabase array operations | latest | Bulk updates, array joins | Built-in `.in()` filter and array column support for batch operations |
| Next.js Server Actions | 15+ | Bulk reschedule/cancel | Already used for single cancel, extend to accept arrays for bulk ops |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Date formatting in detail view | Already in use, for formatting scheduled_for and executed_at timestamps |
| Phosphor icons | ^2.1.10 | ChevronDown/Right for expand indicators | Phase 15 migrated to Phosphor, use for expand icons |
| revalidatePath | Next.js | Cache invalidation after bulk ops | Already used in cancelScheduledSend, extend to bulk actions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual tab state | Radix Tabs | More control vs. accessibility built-in; Radix preferred for a11y |
| TanStack Table expanding | Manual row state | Custom logic vs. battle-tested expanding feature; TanStack preferred for robustness |
| Floating action bar | Inline buttons | Always-visible vs. contextual UI; floating bar better UX for bulk actions |
| Single server action per ID | Bulk server action | N network calls vs. 1 call; bulk approach required for performance |

**Installation:**
```bash
# Radix Tabs not currently installed
npm install @radix-ui/react-tabs

# All other dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
app/(dashboard)/
├── scheduled/
│   └── page.tsx              # Server Component: fetch scheduled sends + send_logs
components/
├── scheduled/
│   ├── scheduled-table.tsx   # Client: tabs, expandable table, bulk selection
│   ├── cancel-button.tsx     # Already exists
│   ├── bulk-action-bar.tsx   # NEW: floating bar with reschedule/cancel buttons
│   ├── cancel-dialog.tsx     # NEW: styled cancel confirmation
│   └── reschedule-dialog.tsx # NEW: reschedule picker + confirmation
├── ui/
│   ├── dialog.tsx            # Already exists (shadcn/ui)
│   ├── checkbox.tsx          # Already exists
│   └── tabs.tsx              # NEW: Radix Tabs wrapper (shadcn pattern)
lib/
├── actions/
│   └── schedule.ts           # Extend: bulkCancelScheduledSends, bulkRescheduleScheduledSends
├── data/
│   └── scheduled.ts          # Extend: getScheduledSendsWithDetails (join send_logs)
```

### Pattern 1: Tabbed List with Radix Tabs
**What:** Two-tab interface (Pending/Past) using Radix UI Tabs for keyboard navigation and accessibility
**When to use:** Separate views for different data states (pending vs. completed/failed/cancelled)
**Example:**
```typescript
// components/ui/tabs.tsx (shadcn pattern)
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root
const TabsList = ({ className, ...props }) => (
  <TabsPrimitive.List className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props} />
)
const TabsTrigger = ({ className, ...props }) => (
  <TabsPrimitive.Trigger className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm", className)} {...props} />
)
const TabsContent = TabsPrimitive.Content

// Usage in scheduled-table.tsx
<Tabs defaultValue="pending">
  <TabsList>
    <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
    <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
  </TabsList>
  <TabsContent value="pending">
    {/* Pending table */}
  </TabsContent>
  <TabsContent value="past">
    {/* Past table */}
  </TabsContent>
</Tabs>
```
**Source:** [Radix UI Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)

### Pattern 2: Expandable Rows with TanStack Table
**What:** Click a row to expand inline details (per-contact results, subject/body preview)
**When to use:** Display detailed information without navigating away or opening a modal
**Example:**
```typescript
// Source: https://tanstack.com/table/latest/docs/framework/react/examples/expanding
import { getExpandedRowModel } from '@tanstack/react-table'

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(), // Enable expanding
  onExpandedChange: setExpanded,
  state: { expanded },
})

// In table body
{table.getRowModel().rows.map(row => (
  <React.Fragment key={row.id}>
    <TableRow onClick={() => row.toggleExpanded()}>
      <TableCell>
        {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
        {/* Regular row content */}
      </TableCell>
    </TableRow>
    {row.getIsExpanded() && (
      <TableRow>
        <TableCell colSpan={columns.length}>
          {/* Expanded detail view */}
          <ExpandedDetails scheduledSend={row.original} />
        </TableCell>
      </TableRow>
    )}
  </React.Fragment>
))}
```
**Source:** [TanStack Table Expanding Guide](https://tanstack.com/table/v8/docs/guide/expanding)

### Pattern 3: Shift-Click Range Selection
**What:** Standard email client pattern - click one row, shift-click another to select range
**When to use:** Bulk operations on table rows
**Example:**
```typescript
// Source: https://github.com/TanStack/table/discussions/3068
const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

const handleRowClick = (rowId: string, event: React.MouseEvent) => {
  if (event.shiftKey && lastSelectedId !== null) {
    // Get all row IDs between lastSelectedId and rowId
    const allRows = table.getRowModel().rows.map(r => r.id)
    const start = allRows.indexOf(lastSelectedId)
    const end = allRows.indexOf(rowId)
    const [min, max] = start < end ? [start, end] : [end, start]

    const rangeIds = allRows.slice(min, max + 1)
    const newSelection = { ...rowSelection }
    rangeIds.forEach(id => { newSelection[id] = true })
    setRowSelection(newSelection)
  } else {
    // Toggle single row
    setRowSelection(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }))
  }
  setLastSelectedId(rowId)
}

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  onRowSelectionChange: setRowSelection,
  state: { rowSelection },
  enableRowSelection: true,
})
```
**Source:** [TanStack Table Discussion #3068](https://github.com/TanStack/table/discussions/3068)

### Pattern 4: Floating Action Bar (Gmail-style)
**What:** Fixed position bar at bottom of screen, appears when rows are selected
**When to use:** Contextual bulk actions (reschedule, cancel)
**Example:**
```typescript
// components/scheduled/bulk-action-bar.tsx
'use client'

interface BulkActionBarProps {
  selectedCount: number
  onReschedule: () => void
  onCancel: () => void
  onClearSelection: () => void
}

export function BulkActionBar({ selectedCount, onReschedule, onCancel, onClearSelection }: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-4 rounded-lg border bg-background px-4 py-3 shadow-lg">
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <Button size="sm" variant="outline" onClick={onReschedule}>
          Reschedule
        </Button>
        <Button size="sm" variant="destructive" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" variant="ghost" onClick={onClearSelection}>
          Clear
        </Button>
      </div>
    </div>
  )
}
```
**Source:** Pattern inspired by [Gmail bulk actions UI](https://mui.com/material-ui/react-floating-action-button/)

### Pattern 5: Bulk Server Actions
**What:** Pass array of IDs to a single server action instead of calling N times
**When to use:** Bulk operations (reschedule multiple, cancel multiple)
**Example:**
```typescript
// lib/actions/schedule.ts
'use server'

export async function bulkCancelScheduledSends(
  ids: string[]
): Promise<{ error?: string; success?: boolean; count?: number }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return { error: 'Business not found' }

  // Bulk update with .in() filter
  const { data, error } = await supabase
    .from('scheduled_sends')
    .update({ status: 'cancelled' })
    .in('id', ids)
    .eq('business_id', business.id)
    .eq('status', 'pending')
    .select('id')

  if (error) return { error: error.message }

  revalidatePath('/scheduled')
  return { success: true, count: data?.length || 0 }
}

export async function bulkRescheduleScheduledSends(
  ids: string[],
  newScheduledFor: string
): Promise<{ error?: string; success?: boolean; count?: number }> {
  // Validate new date is in future (same as scheduleReviewRequest)
  const scheduleDate = new Date(newScheduledFor)
  if (scheduleDate.getTime() <= Date.now() + 60_000) {
    return { error: 'Scheduled time must be at least 1 minute in the future' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return { error: 'Business not found' }

  // Bulk update scheduled_for
  const { data, error } = await supabase
    .from('scheduled_sends')
    .update({ scheduled_for: newScheduledFor })
    .in('id', ids)
    .eq('business_id', business.id)
    .eq('status', 'pending')
    .select('id')

  if (error) return { error: error.message }

  revalidatePath('/scheduled')
  return { success: true, count: data?.length || 0 }
}
```
**Source:** [Next.js 15 Server Actions Best Practices](https://medium.com/@lior_amsalem/nextjs-15-actions-best-practice-bf5cc023301e)

### Pattern 6: Fetching Detailed Results with Array Join
**What:** Join send_logs via send_log_ids array to show per-contact send results
**When to use:** Expanded row detail view for completed scheduled sends
**Example:**
```typescript
// lib/data/scheduled.ts
export async function getScheduledSendsWithDetails(): Promise<ScheduledSendWithDetails[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return []

  const { data: scheduledSends } = await supabase
    .from('scheduled_sends')
    .select('*')
    .eq('business_id', business.id)
    .order('scheduled_for', { ascending: true })

  if (!scheduledSends) return []

  // For each completed send, fetch send_logs details
  const sendsWithDetails = await Promise.all(
    scheduledSends.map(async (send) => {
      if (send.status !== 'completed' || !send.send_log_ids || send.send_log_ids.length === 0) {
        return { ...send, sendLogs: [] }
      }

      // Fetch send_logs for this scheduled send
      const { data: logs } = await supabase
        .from('send_logs')
        .select('id, contact_id, status, error_message, contacts(name, email)')
        .in('id', send.send_log_ids)
        .eq('business_id', business.id)

      return { ...send, sendLogs: logs || [] }
    })
  )

  return sendsWithDetails
}
```

### Anti-Patterns to Avoid
- **Calling server action N times for bulk operation:** Network overhead, potential race conditions. Use single action with array of IDs.
- **Storing expanded state in URL:** Unnecessary complexity for transient UI state. Use local React state.
- **Custom checkbox logic without TanStack Table:** Reinventing row selection. Use built-in `enableRowSelection` and `onRowSelectionChange`.
- **Native `window.confirm()` for styled UI:** Inconsistent with design system. Use Radix Dialog for all confirmations.
- **Fetching all send_logs eagerly:** Performance issue with large datasets. Fetch on-demand when row expands.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tabbed navigation with keyboard support | Custom tab state + event handlers | Radix UI Tabs | Arrow key navigation, focus management, ARIA attributes built-in |
| Row selection state management | Manual Map<id, boolean> | TanStack Table rowSelection state | Handles selection state, select all, deselect all, shift-click support foundation |
| Expandable rows animation | Custom height transitions | TanStack Table expanding + Tailwind animate-in | Built-in expand state, proper colSpan, accessibility |
| Modal dialog focus trap | Custom focus management | Radix Dialog | Focus trap, ESC to close, click-outside, ARIA, return focus on close |
| Shift-click range calculation | Custom index tracking | Pattern from TanStack Table discussion | Edge cases: filtered rows, sorted rows, pagination boundaries |
| Date validation | Custom date comparison | Existing isValidScheduleDate util | Reuse validated logic from ScheduleSelector |

**Key insight:** Table interactions (selection, expanding, keyboard nav) have subtle edge cases (filtered/sorted rows, pagination, accessibility). Use TanStack Table's built-in features + Radix primitives rather than custom logic.

## Common Pitfalls

### Pitfall 1: Fetching All Send Logs Eagerly
**What goes wrong:** Fetching all send_logs for all scheduled sends upfront causes slow page loads
**Why it happens:** Optimizing for developer convenience over performance
**How to avoid:** Only fetch send_logs for a scheduled send when its row is expanded (on-demand loading)
**Warning signs:** Initial page load takes multiple seconds with many completed scheduled sends

### Pitfall 2: Shift-Click Range on Filtered/Sorted Table
**What goes wrong:** Shift-click selects wrong rows after user applies filters or sorts the table
**Why it happens:** Using original data array indices instead of visible row model indices
**How to avoid:** Always use `table.getRowModel().rows` to get current visible rows in display order
**Warning signs:** User sorts table, shift-clicks, and unrelated rows get selected

### Pitfall 3: Bulk Action Race Conditions
**What goes wrong:** User triggers bulk action, then navigates away before server action completes, causing partial updates
**Why it happens:** No loading state or optimistic UI during bulk operation
**How to avoid:** Disable navigation/actions during bulk operation, show loading spinner, use optimistic UI to clear selection
**Warning signs:** Users report "some sends didn't cancel" intermittently

### Pitfall 4: Floating Bar Z-Index Conflicts
**What goes wrong:** Floating action bar appears behind dialogs, dropdowns, or other overlays
**Why it happens:** Insufficient z-index or conflicting stacking contexts
**How to avoid:** Use `z-50` (matches dialog overlay at `z-50`), ensure no intermediate stacking contexts
**Warning signs:** Action bar disappears when opening reschedule dialog

### Pitfall 5: Forgetting to Revalidate After Bulk Operations
**What goes wrong:** After bulk cancel/reschedule, UI doesn't update to reflect new state
**Why it happens:** Omitting `revalidatePath('/scheduled')` in bulk server actions
**How to avoid:** Always call `revalidatePath` in bulk actions, same as single-item actions
**Warning signs:** User must manually refresh page to see updated scheduled sends

### Pitfall 6: Expandable Row Overlapping Checkbox Click
**What goes wrong:** Clicking row to expand also triggers checkbox toggle (or vice versa)
**Why it happens:** Checkbox click event bubbles up to row onClick handler
**How to avoid:** Stop propagation on checkbox click: `onClick={(e) => { e.stopPropagation(); handleCheck(); }}`
**Warning signs:** User tries to expand row but accidentally selects/deselects it

## Code Examples

Verified patterns from official sources:

### Bulk Cancel Confirmation Dialog
```typescript
// components/scheduled/cancel-dialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface CancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onConfirm: () => void
}

export function CancelDialog({ open, onOpenChange, selectedCount, onConfirm }: CancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel {selectedCount} scheduled send{selectedCount !== 1 ? 's' : ''}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. These scheduled sends will be cancelled and will not be processed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Scheduled
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Cancel {selectedCount} Send{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Reschedule Dialog with ScheduleSelector
```typescript
// components/scheduled/reschedule-dialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScheduleSelector } from '@/components/send/schedule-selector'
import { formatScheduleDate } from '@/lib/utils/schedule'

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onConfirm: (newScheduledFor: string) => void
}

export function RescheduleDialog({ open, onOpenChange, selectedCount, onConfirm }: RescheduleDialogProps) {
  const [scheduledFor, setScheduledFor] = useState<string | null>(null)

  const handleConfirm = () => {
    if (scheduledFor) {
      onConfirm(scheduledFor)
      setScheduledFor(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule {selectedCount} send{selectedCount !== 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            All selected sends will be rescheduled to the same new date and time.
          </DialogDescription>
        </DialogHeader>

        <ScheduleSelector onScheduleChange={setScheduledFor} />

        {scheduledFor && (
          <p className="text-sm text-muted-foreground">
            New scheduled time: <strong>{formatScheduleDate(scheduledFor)}</strong>
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!scheduledFor}>
            Reschedule {selectedCount} Send{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Expanded Detail View
```typescript
// components/scheduled/expanded-details.tsx
'use client'

interface ExpandedDetailsProps {
  scheduledSend: ScheduledSendWithDetails
}

export function ExpandedDetails({ scheduledSend }: ExpandedDetailsProps) {
  const { sendLogs, custom_subject, status } = scheduledSend

  // Calculate summary counts
  const sent = sendLogs.filter(log => log.status === 'sent').length
  const failed = sendLogs.filter(log => log.status === 'failed').length
  const skipped = scheduledSend.contact_ids.length - sendLogs.length

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-md">
      {/* Subject preview */}
      {custom_subject && (
        <div>
          <p className="text-sm font-medium">Subject</p>
          <p className="text-sm text-muted-foreground">{custom_subject}</p>
        </div>
      )}

      {/* Results summary (if completed) */}
      {status === 'completed' && (
        <div>
          <p className="text-sm font-medium mb-2">Results</p>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">{sent} sent</span>
            {failed > 0 && <span className="text-red-600">{failed} failed</span>}
            {skipped > 0 && <span className="text-orange-600">{skipped} skipped</span>}
          </div>
        </div>
      )}

      {/* Per-contact breakdown */}
      {sendLogs.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Per-Contact Details</p>
          <div className="space-y-2">
            {sendLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2">
                <div>
                  <span className="font-medium">{log.contacts.name}</span>
                  <span className="text-muted-foreground ml-2">{log.contacts.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={log.status} />
                  {log.error_message && (
                    <span className="text-xs text-red-600">{log.error_message}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Native confirm() dialogs | Radix Dialog primitives | 2024+ (modern UI libs) | Consistent design system, accessibility built-in, no jarring browser UI |
| Manual row selection state | TanStack Table rowSelection | v8 (2022+) | Declarative state management, built-in select all, easier testing |
| useState for tabs | Radix Tabs controlled state | 2023+ (Radix maturity) | Keyboard navigation, ARIA attributes, consistent focus management |
| Fetch all data upfront | On-demand with React state | React 18+ (Suspense era) | Better performance, faster initial load, scales with dataset size |
| Individual API calls | Bulk operations with arrays | Modern REST/GraphQL patterns | Reduced network overhead, atomic transactions, better error handling |

**Deprecated/outdated:**
- **window.confirm() for user confirmations:** Breaks visual consistency, no styling control, poor accessibility. Replaced by Radix Dialog.
- **Custom tab implementations with buttons:** Keyboard navigation broken, ARIA incorrect. Use Radix Tabs.
- **Storing table state in URL params for non-shareable UI:** Unnecessary complexity for expand/select state. Use local React state.

## Open Questions

Things that couldn't be fully resolved:

1. **Should expanded rows persist across tab switches (Pending → Past)?**
   - What we know: TanStack Table maintains expanded state in component state
   - What's unclear: Whether to reset expanded state when switching tabs or preserve it
   - Recommendation: Reset expanded state on tab switch (simpler mental model, avoids stale data issues)

2. **Mobile UX for bulk selection?**
   - What we know: Shift-click doesn't exist on mobile, checkboxes work but floating bar may obstruct content
   - What's unclear: Best mobile pattern for multi-select (long-press? always-visible checkboxes?)
   - Recommendation: Show checkboxes always on mobile (not just on hover), use same floating bar but adjust bottom padding

3. **Reschedule validation for already-due sends?**
   - What we know: Can only reschedule pending sends, validation checks scheduled_for > now + 1 min
   - What's unclear: Should we prevent rescheduling sends that are due within the next minute (race with cron)?
   - Recommendation: Allow rescheduling even if due soon; cron uses FOR UPDATE SKIP LOCKED so no conflict

## Sources

### Primary (HIGH confidence)
- [TanStack Table Expanding Guide](https://tanstack.com/table/v8/docs/guide/expanding) - Row expanding patterns
- [TanStack Table Row Selection](https://tanstack.com/table/v8/docs/guide/row-selection) - Selection state management
- [Radix UI Tabs Documentation](https://www.radix-ui.com/primitives/docs/components/tabs) - Tab component API
- [Radix UI Dialog Documentation](https://www.radix-ui.com/primitives/docs/components/dialog) - Modal patterns
- [Next.js Server Actions Documentation](https://nextjs.org/docs/13/app/building-your-application/data-fetching/server-actions-and-mutations) - Server action patterns
- Existing codebase: `components/contacts/contact-table.tsx` - TanStack Table with selection
- Existing codebase: `components/send/schedule-selector.tsx` - Schedule picker component
- Existing codebase: `lib/actions/schedule.ts` - Server action patterns
- Existing codebase: `app/api/cron/process-scheduled-sends/route.ts` - How send_log_ids are populated

### Secondary (MEDIUM confidence)
- [TanStack Table Discussion #3068](https://github.com/TanStack/table/discussions/3068) - Shift-click range selection pattern
- [Next.js 15 Server Actions Best Practice](https://medium.com/@lior_amsalem/nextjs-15-actions-best-practice-bf5cc023301e) - Bulk operation patterns
- [Material React Table Expanding Guide](https://www.material-react-table.com/docs/guides/expanding-sub-rows) - Expandable row UX patterns
- [Simple Table Row Selection Guide](https://www.simple-table.com/blog/react-table-row-selection-guide) - Multi-select patterns

### Tertiary (LOW confidence)
- [Material UI FAB](https://mui.com/material-ui/react-floating-action-button/) - Floating action button patterns (different library, conceptual reference only)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use or peer dependencies, TanStack Table patterns verified
- Architecture: HIGH - Patterns verified in existing codebase (contacts table, send-form), official docs
- Pitfalls: MEDIUM - Based on common React Table issues and community discussions, not project-specific

**Research date:** 2026-01-29
**Valid until:** 60 days (stable domain - table libraries and patterns evolve slowly)
