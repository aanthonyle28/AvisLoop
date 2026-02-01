# Phase 19: UX/UI Redesign - Codebase Research

**Researched:** 2026-02-01
**Domain:** Current codebase structure and patterns
**Confidence:** HIGH

## Summary

This research documents the existing codebase structure, components, and patterns that Phase 19 will modify, replace, or extend. The focus is understanding what exists today rather than researching new UI/UX patterns (which are already documented in CONTEXT.md).

**Key findings:**
- Current dashboard uses Server Components with client-side interactivity patterns
- Navigation exists in both desktop sidebar and mobile bottom nav
- Send page is single-form based; will be rebuilt with tabs
- UI primitives (Tabs, Sheet, Dialog, Skeleton) are already installed and configured
- Sonner toast system is configured; needs actionable toast patterns added
- TanStack Table is used for contacts and history; can be reused for Bulk Send
- Server Actions + useActionState pattern is standard for forms

**Primary recommendation:** Preserve existing data fetching patterns, component structure conventions, and Radix UI primitives. Extend rather than replace foundational components.

## Current File Structure

### App Routes (All Pages)
```
app/
├── layout.tsx                          # Root layout with Toaster
├── (marketing)/
│   ├── layout.tsx                      # Marketing shell
│   ├── page.tsx                        # Landing page
│   └── pricing/page.tsx
├── (dashboard)/
│   ├── layout.tsx                      # Dashboard group layout (uses AppShell)
│   ├── billing/page.tsx
│   ├── contacts/page.tsx               # Server Component → ContactsClient
│   ├── history/page.tsx                # Server Component → HistoryClient
│   ├── send/page.tsx                   # Server Component → SendForm
│   └── scheduled/page.tsx
├── dashboard/
│   ├── page.tsx                        # Main dashboard (QuickSend, stat cards, onboarding)
│   ├── layout.tsx                      # Old dashboard layout
│   └── settings/page.tsx
├── onboarding/page.tsx                 # Full-screen onboarding wizard
├── auth/*                              # Auth pages
└── login/page.tsx, signup/page.tsx     # Duplicate auth routes
```

### Navigation & Layout Components
```
components/layout/
├── app-shell.tsx                       # Desktop Sidebar + Mobile BottomNav wrapper
├── sidebar.tsx                         # Desktop sidebar (collapsible, 5 nav items + secondary nav)
└── bottom-nav.tsx                      # Mobile bottom nav (5 items, fixed bottom)
```

### Dashboard Components
```
components/dashboard/
├── onboarding-cards.tsx                # 3-card onboarding grid (contact, template, test send)
├── onboarding-checklist.tsx            # DEPRECATED (Phase 16 note)
├── quick-send.tsx                      # Current Quick Send (search, template, schedule)
├── stat-cards.tsx                      # MonthlyUsageCard, NeedsAttentionCard, ReviewRateCard
├── recent-activity.tsx                 # Activity table (name, template, status, sent)
├── response-rate-card.tsx              # (exists, not currently used)
└── review-link-modal.tsx               # Modal for adding Google review link
```

### Send Flow Components
```
components/send/
├── send-form.tsx                       # Main send form (contact selector + message preview)
├── contact-selector.tsx                # Multi-select with search, filter (ready-to-resend), cooldown badges
├── message-preview.tsx                 # Live preview of email with template variables
├── schedule-selector.tsx               # Schedule preset selector (exists in lib/utils/)
└── batch-results.tsx                   # Post-send results table (sent, skipped, failed)
```

### Contacts Components
```
components/contacts/
├── contacts-client.tsx                 # Client wrapper for contact table + actions
├── contact-table.tsx                   # TanStack Table with sorting, filters, pagination, row selection
├── contact-columns.tsx                 # Column definitions (name, email, status, actions)
├── contact-filters.tsx                 # Search + status filter controls
├── add-contact-sheet.tsx               # Sheet drawer for adding contact
├── edit-contact-sheet.tsx              # Sheet drawer for editing contact
├── csv-import-dialog.tsx               # Dialog for CSV upload
├── csv-preview-table.tsx               # Preview imported CSV data
└── empty-state.tsx                     # Empty state for no contacts
```

### History/Requests Components
```
components/history/
├── history-client.tsx                  # Client wrapper for history table
├── history-table.tsx                   # TanStack Table (simplified, no row selection)
├── history-columns.tsx                 # Column definitions (contact, template, status, sent)
├── history-filters.tsx                 # Search + status + date range filters
├── status-badge.tsx                    # Status badges (pending, sent, delivered, failed, etc.)
└── empty-state.tsx                     # Empty state for no history
```

### Shared UI Primitives
```
components/ui/
├── button.tsx                          # Radix-styled button with variants
├── card.tsx                            # Card, CardHeader, CardTitle, CardContent
├── dialog.tsx                          # Radix Dialog with overlay, close button
├── sheet.tsx                           # Radix Dialog as Sheet (side drawer)
├── tabs.tsx                            # Radix Tabs (TabsList, TabsTrigger, TabsContent)
├── dropdown-menu.tsx                   # Radix DropdownMenu with all sub-components
├── table.tsx                           # Table primitives (Table, TableHeader, TableRow, TableCell)
├── skeleton.tsx                        # Skeleton with animate-pulse
├── sonner.tsx                          # Sonner Toaster wrapper with theme support
├── checkbox.tsx                        # Radix Checkbox
├── input.tsx                           # Styled input
├── label.tsx                           # Radix Label
├── separator.tsx                       # Radix Separator
├── badge.tsx                           # Badge component
└── form.tsx                            # Form primitives (not react-hook-form integrated)
```

### Skeleton/Loading Components
```
components/skeletons/
├── dashboard-skeleton.tsx              # Full dashboard skeleton (stat cards, QuickSend, activity)
├── table-skeleton.tsx                  # Generic table skeleton (configurable rows/columns)
└── card-skeleton.tsx                   # Generic card skeleton
```

## Route & Layout Architecture

### Current Dashboard Layout Pattern
**File:** `app/(dashboard)/layout.tsx`
- Server Component that fetches scheduled count
- Wraps children in `<AppShell scheduledCount={scheduledCount}>`
- Uses Suspense fallback with AppShell showing 0 count

**AppShell Component:**
- Renders `<Sidebar>` (desktop) and `<BottomNav>` (mobile)
- Main content area with bottom padding for mobile nav
- Background: `bg-[#F9F9F9] dark:bg-background`

### Current Navigation Structure

**Desktop Sidebar (5 main + 4 secondary items):**
Main nav:
1. Dashboard → `/dashboard`
2. Contacts → `/contacts`
3. Send → `/send`
4. Scheduled → `/scheduled` (with badge count)
5. History → `/history`

Secondary nav:
1. Apps → `/dashboard/settings`
2. Billing → `/billing`
3. Help & Support → `#`
4. Account → `/dashboard/settings`

**Footer:** Sign out button (server action)

**Mobile Bottom Nav (5 items):**
Same 5 main items as desktop sidebar

**Phase 19 Changes:**
- Desktop: Remove Dashboard, Scheduled, History from main nav → Replace with Send, Contacts, Requests
- Desktop: Move secondary nav items to account dropdown menu at bottom
- Mobile: Replace 5-item nav with 3-item nav (Send, Contacts, Requests)
- Mobile: Add avatar/account button to page header (top-right)

## Current Send Page Structure

**File:** `app/(dashboard)/send/page.tsx`
- Server Component
- Fetches: business, contacts (limit 200), monthly usage, resendReadyContacts
- Shows usage warning banner if approaching limit
- Redirects to settings if no Google review link (unless test mode)
- Renders `<SendForm>` with all props

**SendForm Component:**
- Client Component using `useActionState` for batchSend and schedule actions
- Two-column layout: Left (contact selector + template), Right (message preview)
- Contact selector supports multi-select up to 25
- Schedule selector (inline component)
- Handles test mode (marks onboarding complete, no real send)
- Shows batch results after successful send
- Toast notifications: `toast.error()`, `toast.success()`

**Phase 19 Changes:**
- Replace single-form layout with Tabs (Quick Send / Bulk Send)
- Quick Send tab: simplified single-recipient flow with preset bar
- Bulk Send tab: contact table with filter chips + sticky bottom action bar
- Shared stat strip at top (Monthly Usage, Review Rate, Needs Attention)
- Recent Activity strip below stats (tab-aware: individuals vs batches)

## Current Dashboard Page Structure

**File:** `app/dashboard/page.tsx`
- Server Component
- Redirects to /onboarding if onboarding not complete
- Fetches in parallel: business, usage, contacts, responseRate, needsAttention, recentActivity, cardStatus
- Renders:
  1. Welcome header ("Welcome, {firstName}!")
  2. OnboardingCards (if not all complete)
  3. Stat cards row (hidden until test_sent complete)
  4. QuickSend component
  5. RecentActivityTable

**Phase 19 Changes:**
- Dashboard page will be REPLACED by Send page
- Send becomes the new home page (Send-first)
- Quick Send / Bulk Send tabs become primary interface
- Onboarding checklist becomes collapsible pill → drawer

## Navigation Components Detail

### Sidebar Component
**File:** `components/layout/sidebar.tsx`
- Client Component
- Uses `useLocalStorage('sidebarCollapsed', false)` for persistence
- Auto-collapses on medium screens (768-1024px)
- Header: Logo + collapse button
- Nav items: Icon + label + optional badge
- Footer: Sign out form (server action)
- Active state detection: `pathname === href || pathname.startsWith(href + '/')`

**Phase 19 Changes:**
- Reduce main nav from 5 to 3 items
- Replace secondary nav with account dropdown at bottom
- Account menu: Apps/Integrations, Settings, Billing, Help & Support, Logout

### BottomNav Component
**File:** `components/layout/bottom-nav.tsx`
- Client Component
- Fixed bottom, 5-column grid
- Height: 72px (exported as BOTTOM_NAV_HEIGHT)
- Badge count on Scheduled item

**Phase 19 Changes:**
- Reduce from 5 to 3 items (Send, Contacts, Requests)
- Remove Scheduled and History items
- Account button moves to page header (top-right)

## Onboarding Components

### OnboardingCards (Current)
**File:** `components/dashboard/onboarding-cards.tsx`
- Client Component
- 3 cards in grid: Contact, Template, Test Send
- Each card: number, icon, title, description, completion indicator
- Card 3 (Test Send) has prerequisite check (contact_created)
- Links to: /contacts, /dashboard/settings, /send?test=true
- Hides when all complete

**Phase 19 Changes:**
- Replace with collapsible setup progress component
- Collapsed: pill/chip in header "Complete Setup: X/Y >"
- Expanded: side drawer from right with 4 core steps + 1 bonus step
- Core steps: Add contact, Review link, Choose message, Send first request (with test substep)
- Bonus: Try Bulk Send (conditional on 3+ contacts or CSV import)

### OnboardingChecklist (Deprecated)
**File:** `components/dashboard/onboarding-checklist.tsx`
- Marked DEPRECATED in Phase 16
- Old 4-step checklist with progress bar
- Can be safely deleted (not used)

## Send Flow Components Detail

### ContactSelector
**File:** `components/send/contact-selector.tsx`
- Client Component
- Multi-select with checkboxes (max 25)
- Filter modes: "All Contacts" | "Ready to Re-send"
- Search by name/email
- Shows cooldown badges, "Never sent", "Ready to re-send", send count
- Calculates cooldown status client-side

**Phase 19 Usage:**
- Quick Send tab: Modify for single-recipient mode with email search + inline detection
- Bulk Send tab: Reuse as-is in full contact table

### MessagePreview
**File:** `components/send/message-preview.tsx`
- Client Component
- Shows preview of email with template variables replaced
- Editable subject and body (click to edit)
- Renders: email card with "Hi {name}", body, CTA button, signature
- No contact selected → dashed border placeholder

**Phase 19 Usage:**
- Quick Send: Add compact/expanded preview mode (2-3 lines → click to expand)
- Reuse existing preview logic

## Contacts & Table Components

### ContactTable (TanStack Table)
**File:** `components/contacts/contact-table.tsx`
- Client Component using `useReactTable`
- Features: Sorting, filtering, pagination, row selection
- State: `sorting`, `columnFilters`, `rowSelection`
- Filters: search (debounced 300ms), status (all/active/archived)
- Bulk actions: Archive, Delete (with confirmation)
- Row hover: `hover:bg-muted/50`

**Phase 19 Usage:**
- Bulk Send tab: Reuse ContactTable structure
- Add send-focused filter chips (Never sent, Added today, Sent > X days, Issues)
- Add sticky bottom action bar (Gmail-style)
- Keep row selection, add "Send to selected" and "Send to all filtered"

### ContactColumns
**File:** `components/contacts/contact-columns.tsx`
- Column definitions: Checkbox, Name, Email, Status, Last Sent, Actions
- Actions: Edit, Archive, Restore, Delete (dropdown menu)
- Sortable columns

**Phase 19 Usage:**
- Bulk Send: May need simplified columns (Name, Email, Last Sent, Status)

## History/Requests Components

### HistoryTable
**File:** `components/history/history-table.tsx`
- Simpler than ContactTable (no row selection, no filters)
- Columns: Contact, Template, Status, Sent At
- Uses same TanStack Table patterns

**Phase 19 Changes:**
- Add resend action (inline row action + drawer)
- Add detail drawer (recipient, template, status timeline, preview, actions)
- Add delete/cancel for scheduled/pending
- Show disabled resend with tooltip ("Available in X days" or "Contact opted out")

### StatusBadge
**File:** `components/history/status-badge.tsx`
- Badge variants: pending, sent, delivered, failed, clicked, opted_out, etc.
- Color-coded with status dots

**Phase 19 Usage:**
- Reuse in detail drawer status timeline

## Shared UI Primitives Detail

### Tabs (Radix)
**File:** `components/ui/tabs.tsx`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- TabsList: `bg-muted p-1 rounded-md` (pill style)
- TabsTrigger: `data-[state=active]:bg-background data-[state=active]:shadow-sm`

**Phase 19 Usage:**
- Send page: Quick Send / Bulk Send tabs
- Already installed and styled

### Sheet (Radix Dialog as Drawer)
**File:** `components/ui/sheet.tsx`
- Sides: right, left, top, bottom
- Default: right side, `sm:max-w-sm`
- Components: SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription
- Close button optional (`showCloseButton` prop)

**Phase 19 Usage:**
- Onboarding setup drawer (right side)
- Request detail drawer (right side)
- Add contact drawer (already uses Sheet)

### Dialog (Radix)
**File:** `components/ui/dialog.tsx`
- Centered modal with overlay
- Components: DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
- Close button in top-right

**Phase 19 Usage:**
- Confirmation dialogs (bulk send confirmation)
- Test send modal (2 options: real email vs preview)

### Skeleton
**File:** `components/ui/skeleton.tsx`
- Simple: `bg-accent animate-pulse rounded-md`
- Used in dashboard-skeleton, table-skeleton

**Phase 19 Changes:**
- Modernize with softer colors, smoother animation
- Add thin progress bar component for page transitions

### Sonner (Toast)
**File:** `components/ui/sonner.tsx` + `app/layout.tsx`
- Configured in root layout: `<Toaster position="top-right" richColors />`
- Icons: success, info, warning, error, loading
- Theme support

**Current Usage:**
- `toast.error()`, `toast.success()` (simple strings)
- No actionable toasts (View details, Undo)

**Phase 19 Changes:**
- Add actionable toasts:
  - Send success: `toast.success()` with "View details" action → opens drawer
  - Delete/archive: `toast()` with "Undo" button + auto-dismiss timer
- Increase auto-dismiss to 5-8 seconds for action toasts

### DropdownMenu (Radix)
**File:** `components/ui/dropdown-menu.tsx`
- Full Radix DropdownMenu primitives
- Components: DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, etc.

**Phase 19 Usage:**
- Account menu dropdown (anchored to bottom of sidebar)
- Row actions in tables
- "More" actions in sticky bottom bar

## Data Fetching Patterns

### Server Components Pattern
Most pages follow this structure:
```tsx
// app/(dashboard)/page.tsx
export default async function Page() {
  // 1. Create Supabase client
  const supabase = await createClient()

  // 2. Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 3. Fetch data in parallel
  const [data1, data2, data3] = await Promise.all([
    getDataFunction1(),
    getDataFunction2(),
    getDataFunction3(),
  ])

  // 4. Render client component with data
  return <ClientComponent data={data1} />
}
```

### Data Functions (lib/data/)
**Pattern:** Server-only functions that create Supabase client internally
```typescript
// lib/data/send-logs.ts
export async function getSendLogs(options?: { ... }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ... query with RLS
  return { logs, total }
}
```

**Key functions for Phase 19:**
- `getMonthlyUsage()` → Monthly Usage card
- `getResponseRate()` → Review Rate card
- `getNeedsAttentionCount()` → Needs Attention card
- `getRecentActivity(limit)` → Recent Activity strip
- `getSendLogs(options)` → History/Requests table with filters
- `getResendReadyContacts()` → Filter chip in Bulk Send

### Server Actions Pattern
**File:** `lib/actions/*.ts`
- Server actions return `{ success: boolean; error?: string; data?: T }`
- Example: `batchSendReviewRequest`, `scheduleReviewRequest`

**Client usage:** `useActionState` hook
```tsx
const [state, formAction, isPending] = useActionState(serverAction, null)

// In JSX
<form action={formAction}>...</form>

// Check state
if (state?.success) { /* handle success */ }
if (state?.error) { /* show error */ }
```

**Phase 19 Pattern:**
- Quick Send: `useTransition` + manual FormData (like quick-send.tsx)
- Bulk Send: `useActionState` for confirmation dialog → send

## Toast & Loading Patterns

### Current Toast Usage
**Files using sonner:**
- `components/dashboard/quick-send.tsx`
- `components/auth/google-oauth-button.tsx`
- `components/scheduled/scheduled-table.tsx`
- `components/scheduled/cancel-button.tsx`
- `components/settings/integrations-section.tsx`

**Examples:**
```tsx
import { toast } from 'sonner'

// Simple toasts
toast.error('Please select a contact')
toast.success('Review request sent successfully')

// With loading
const toastId = toast.loading('Sending...')
toast.success('Sent!', { id: toastId })
```

**Phase 19 Additions:**
```tsx
// Actionable toast with button
toast.success('Review request sent', {
  action: {
    label: 'View details',
    onClick: () => openDetailDrawer(id)
  },
  duration: 6000 // longer for action toasts
})

// Undo toast
const toastId = toast('Contact archived', {
  action: {
    label: 'Undo',
    onClick: () => undoArchive(id)
  },
  duration: 5000
})
```

### Current Loading States
**Patterns:**
1. **Suspense + fallback:** Used in page-level components
2. **Skeleton components:** DashboardSkeleton, TableSkeleton
3. **Inline spinners:** `isPending` from useActionState/useTransition
4. **Custom spinners:** `animate-spin` on div with border

**Phase 19 Additions:**
- Thin progress bar at top (YouTube/GitHub style) for page transitions
- Softer skeleton colors and smoother pulse animation

## Key Files Phase 19 Will Modify

### High-Impact Changes (Full Rebuild)
1. `app/(dashboard)/send/page.tsx` → Rebuild as tabbed interface
2. `components/send/send-form.tsx` → Split into QuickSendTab and BulkSendTab
3. `components/layout/sidebar.tsx` → Reduce nav, add account dropdown
4. `components/layout/bottom-nav.tsx` → Reduce to 3 items
5. `app/dashboard/page.tsx` → May become redirect to /send or simplified

### Medium-Impact Changes (Extend/Enhance)
6. `components/dashboard/onboarding-cards.tsx` → Replace with collapsible pill + drawer
7. `components/history/history-table.tsx` → Add resend + detail drawer actions
8. `components/ui/skeleton.tsx` → Add softer animation variant
9. New: `components/ui/progress-bar.tsx` → Thin top progress bar
10. New: `components/send/quick-send-tab.tsx` → Quick Send interface
11. New: `components/send/bulk-send-tab.tsx` → Bulk Send interface
12. New: `components/send/send-stats-strip.tsx` → Compact stat cards
13. New: `components/send/recent-activity-strip.tsx` → Tab-aware activity
14. New: `components/onboarding/setup-progress-drawer.tsx` → Collapsible checklist
15. New: `components/history/request-detail-drawer.tsx` → Detail view

### Low-Impact Changes (Reuse As-Is)
- `components/contacts/contact-table.tsx` → Reuse in Bulk Send
- `components/send/contact-selector.tsx` → Adapt for Quick Send email field
- `components/send/message-preview.tsx` → Add compact mode
- `components/ui/tabs.tsx` → Use for Send tabs
- `components/ui/sheet.tsx` → Use for drawers
- `components/ui/dialog.tsx` → Use for confirmations

## Patterns to Preserve

### 1. Server Component + Client Component Split
**Pattern:**
```tsx
// app/(dashboard)/page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent data={data} />
}

// components/client-component.tsx (Client Component)
'use client'
export function ClientComponent({ data }) {
  // Interactive logic
}
```

**Preserve in Phase 19:** Keep Server Components for data fetching, Client Components for interactivity

### 2. Parallel Data Fetching
**Pattern:**
```tsx
const [data1, data2, data3] = await Promise.all([
  fetch1(),
  fetch2(),
  fetch3(),
])
```

**Preserve in Phase 19:** Fetch stats, contacts, activity in parallel

### 3. useActionState for Forms
**Pattern:**
```tsx
const [state, formAction, isPending] = useActionState(serverAction, null)

<form action={formAction}>
  <button disabled={isPending}>Submit</button>
</form>

{state?.error && <Error message={state.error} />}
```

**Preserve in Phase 19:** Use for Bulk Send confirmation flow

### 4. TanStack Table Configuration
**Pattern:**
```tsx
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: setSorting,
  state: { sorting, columnFilters, rowSelection },
})
```

**Preserve in Phase 19:** Reuse exact table setup for Bulk Send

### 5. Component File Naming
**Pattern:**
- `components/[domain]/[component-name].tsx`
- Client components: Mark with `'use client'` at top
- Server components: No directive (default)

**Preserve in Phase 19:** Follow same naming conventions

### 6. Radix UI Composition
**Pattern:**
```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

**Preserve in Phase 19:** Use same composition patterns for new components

## Risks & Complexity Notes

### High Complexity Areas

**1. Quick Send Email Detection Logic**
- CONTEXT.md requirement: "If email matches existing contact: auto-fill name (editable, but does NOT update stored contact)"
- Need client-side email matching against contacts list
- Edge case: What if multiple contacts have same email? (shouldn't happen with unique constraint, but verify)

**2. Bulk Send Filter Chips**
- "Never sent" → `last_sent_at IS NULL`
- "Added today" → `created_at >= today`
- "Sent > X days" → calculate based on cooldown days
- "Issues" → failed status or opted_out?
- Need to calculate counts for each filter client-side or server-side?

**3. Bulk Send "Send to All Filtered"**
- Need total count of filtered results (not just visible page)
- Confirmation dialog shows: total, eligible (not on cooldown), skipped (cooldown/opted-out)
- Server action needs to apply same filters to send batch

**4. Recent Activity Tab-Awareness**
- Quick Send tab: Show individual sends ("John · Delivered · 2m")
- Bulk Send tab: Show batch summaries ("24 delivered · 2m ago")
- Need to group by batch ID? Or just change display based on active tab?
- Current `getRecentActivity()` returns individual logs; may need new grouping logic

**5. Onboarding Test Send Free Email**
- "Test-to-self sends are free (don't consume credits), limited to once/day per user"
- Need new server action or modify existing send action with `isTestToSelf` flag
- Verify in server action: recipient email === user email
- Check rate limit: 1 per day per user (store in onboarding_progress JSONB?)

**6. Request Detail Drawer Resend Logic**
- "Drawer: full Resend with options (change template, schedule, see context)"
- Need to pre-populate form with original send data (contact, template)
- Allow template change in drawer
- Respect cooldown (show disabled state with countdown)

### Medium Complexity Areas

**7. Sticky Bottom Action Bar**
- Gmail-style: slides up from bottom when contacts selected
- Stays visible while scrolling
- Contains: "X selected", Send button, Clear, More menu
- Need `position: sticky` with bottom offset + visibility based on selection state

**8. Compact Preview Expansion**
- "2-3 lines visible by default, click to expand full preview"
- CSS line-clamping: `line-clamp-3` (Tailwind)
- Toggle state for expanded/collapsed
- Smooth height transition

**9. Account Menu Positioning**
- "Popover anchored to bottom of sidebar"
- Radix DropdownMenu with `side="top"` and `align="start"`
- Mobile: anchored to avatar in top-right header

**10. Thin Progress Bar**
- YouTube/GitHub style at top of page
- Triggered on navigation (Next.js route change)
- Need router event listeners or Suspense-based approach
- Library option: `npx-progress` or custom implementation

### Low Complexity Areas

**11. Stat Cards Redesign**
- Reuse existing stat card components
- Make compact (horizontal layout)
- Add smart CTAs to Monthly Usage (80-90% → "Manage plan", limit → blocking)

**12. Template + Schedule Persistence**
- localStorage for last-used template + schedule preset
- Simple: `localStorage.setItem('lastTemplate', templateId)`
- Restore on mount: `const saved = localStorage.getItem('lastTemplate')`

**13. Setup Complete Pill**
- Small chip near Send header: "Setup complete ✓" with "×" to dismiss
- `useState` for dismissed state
- After dismiss: move checklist to Help menu link (just a route, no data change)

### Edge Cases to Handle

**E1. Send Without Google Review Link**
- Current: Shows warning, blocks send
- Phase 19: "Send button disabled with inline text: 'Add review link to enable sending' + CTA"
- Quick Send: Disable send button + show inline message
- Bulk Send: Same, but in sticky action bar

**E2. Empty States**
- Quick Send: No contacts → show "Add contacts" CTA
- Bulk Send: No contacts → reuse existing empty state
- Recent Activity: No sends → show empty state

**E3. Cooldown in Quick Send**
- If selected contact is on cooldown, what happens?
- Show warning toast? Disable send button? Allow anyway?
- CONTEXT.md doesn't specify; recommend: allow send but show warning

**E4. Multiple Tabs State Sync**
- If user sends from Quick Send, should Recent Activity on Bulk Send tab update?
- Recommend: Yes, fetch fresh on tab change or use router.refresh()

## Data Model Notes

### Tables Involved in Phase 19

**send_logs:**
- Fields: id, business_id, contact_id, template_id, status, created_at, scheduled_for, delivery_events
- Used for: Recent Activity, History/Requests table, resend data

**contacts:**
- Fields: id, business_id, name, email, status, last_sent_at, send_count, created_at, opted_out
- Used for: Contact selector, Bulk Send table, filters

**businesses:**
- Fields: id, user_id, name, google_review_link, email_templates, default_sender_name
- Used for: Validation, template list, message preview

**onboarding_progress:**
- Fields: user_id, completed, steps (JSONB)
- Used for: Onboarding checklist state, test-to-self rate limit (new field?)

### Query Patterns Needed

**New Queries for Phase 19:**

1. **Filter: Added Today**
   ```sql
   WHERE created_at >= CURRENT_DATE
   ```

2. **Filter: Never Sent**
   ```sql
   WHERE last_sent_at IS NULL
   ```

3. **Filter: Sent > X Days**
   ```sql
   WHERE last_sent_at IS NOT NULL
   AND last_sent_at < NOW() - INTERVAL '30 days'
   ```

4. **Filter: Issues**
   ```sql
   WHERE opted_out = true
   OR status = 'failed'
   ```

5. **Batch Activity Grouping** (if needed)
   ```sql
   SELECT
     DATE_TRUNC('minute', created_at) as batch_time,
     COUNT(*) as count,
     status
   FROM send_logs
   WHERE business_id = ?
   GROUP BY batch_time, status
   ORDER BY batch_time DESC
   LIMIT 10
   ```

## Tech Stack Verification

All required libraries are already installed:

```json
{
  "@radix-ui/react-tabs": "^1.1.13",        // ✓ Tabs for Send page
  "@radix-ui/react-dialog": "^1.1.15",      // ✓ Sheet & Dialog
  "@radix-ui/react-dropdown-menu": "^2.1.14", // ✓ Account menu
  "@tanstack/react-table": "^8.21.3",       // ✓ Bulk Send table
  "sonner": "^2.0.7",                        // ✓ Toast notifications
  "@phosphor-icons/react": "^2.1.10",       // ✓ Icons
  "next": "latest",                          // ✓ App Router
  "tailwindcss": "^3.4.1"                    // ✓ Styling
}
```

**No new dependencies needed.**

## Open Questions

**Q1: Tab-Aware Recent Activity Implementation**
- Should Recent Activity be a shared component that accepts `tabMode` prop?
- Or two separate components (QuickSendActivity, BulkSendActivity)?
- Recommendation: Single component with `mode` prop, different data grouping logic

**Q2: Bulk Send Confirmation Dialog Data Source**
- How to calculate "eligible count" and "skipped count" before send?
- Client-side calculation (loop through selected contacts, check cooldown)?
- Server-side preview endpoint?
- Recommendation: Client-side for now (selected contacts are in memory)

**Q3: Progress Bar Library vs Custom**
- Use existing library like `npx-progress` or build custom?
- Custom: More control, lighter weight
- Library: Faster to implement
- Recommendation: Custom (simple CSS + state, ~50 lines)

**Q4: Mobile Account Menu Header Integration**
- Where exactly does account button go on mobile?
- Inside page header (per-page) or global header bar?
- Recommendation: Per-page header (top-right, consistent across pages)

**Q5: Scheduled Tab Removal Impact**
- Current `/scheduled` page exists and is functional
- Phase 19 removes it from nav; does page stay accessible via direct URL?
- Recommendation: Keep page, just remove nav link (can access via URL if needed)

**Q6: Test-to-Self Rate Limit Storage**
- Where to store "last test sent" timestamp?
- onboarding_progress.steps JSONB? New column? User metadata?
- Recommendation: `onboarding_progress.steps.last_test_sent_at` (ISO timestamp)

## Sources

### Primary (HIGH confidence)
- Codebase exploration (all files read directly)
- `app/(dashboard)/` route structure
- `components/` directory structure
- `lib/data/` and `lib/actions/` patterns
- `package.json` dependencies

### Context (HIGH confidence)
- `.planning/phases/19-ux-ui-redesign/19-CONTEXT.md` - User decisions and requirements

## Metadata

**Confidence breakdown:**
- File structure: HIGH - Direct codebase reading
- Component patterns: HIGH - Read all key components
- Data patterns: HIGH - Verified Server Component and Server Action usage
- UI primitives: HIGH - Confirmed Radix UI installation and configuration
- Risks identified: MEDIUM - Based on CONTEXT requirements vs current patterns

**Research date:** 2026-02-01
**Valid until:** 30 days (stable codebase, internal documentation)
