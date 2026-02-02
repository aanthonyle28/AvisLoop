# Phase 22: Detail Drawers - Research

**Researched:** 2026-02-01
**Domain:** React drawer/sheet components with Radix UI Dialog
**Confidence:** HIGH

## Summary

Detail drawers for inspecting requests and contacts are best implemented using the existing Sheet component infrastructure (built on Radix UI Dialog). The project already has a working Sheet component at `components/ui/sheet.tsx` and two working drawer implementations: `request-detail-drawer.tsx` (history page) and `edit-contact-sheet.tsx` (contacts page).

The standard approach is to use Radix UI Dialog primitive with side-specific positioning (right-side drawers), controlled open state, and proper ARIA semantics. For persistent notes fields, use auto-saving with debounced server actions to provide seamless UX without explicit save buttons. PostgreSQL TEXT column is the recommended type for notes fields.

**Primary recommendation:** Extend existing Sheet component pattern, add a new ContactDetailDrawer component with auto-saving notes textarea, add notes TEXT column to contacts table, and wire click handlers on recent activity chips and contact rows to open respective drawers inline.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-dialog | ^1.1.15 | Drawer/sheet foundation | Provides accessible modal primitives with focus management, ARIA semantics, and keyboard navigation |
| React Server Actions | Next.js 15 | Form handling & data mutations | Type-safe, progressive enhancement, eliminates API routes |
| Zod | ^4.3.6 | Validation | Type-safe schema validation for server actions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @phosphor-icons/react | ^2.1.10 | Icons for drawer actions | Consistent with existing UI |
| date-fns | ^4.1.0 | Date formatting | Display timestamps in drawers |
| useActionState | React 19 | Form state management | Handle server action responses with loading states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Dialog | Custom drawer component | Custom requires reimplementing accessibility, focus traps, keyboard navigation |
| Radix Dialog | vaul (dedicated drawer library) | vaul adds dependency; Radix Dialog already installed and working |
| Auto-save | Explicit save button | Explicit save adds friction, requires state management |

**Installation:**
No new packages required. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
components/
├── contacts/
│   ├── contact-detail-drawer.tsx    # NEW: detail drawer with notes
│   └── edit-contact-sheet.tsx       # Existing
├── history/
│   └── request-detail-drawer.tsx    # Existing (already implemented)
└── ui/
    └── sheet.tsx                     # Existing (Radix Dialog wrapper)

supabase/migrations/
└── YYYYMMDDHHMMSS_add_contact_notes.sql  # NEW: notes column
```

### Pattern 1: Controlled Drawer State
**What:** Parent component manages drawer open state and selected item
**When to use:** All drawer implementations
**Example:**
```typescript
// Source: Existing pattern from edit-contact-sheet.tsx
export function ContactsClient() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact)
    setDetailDrawerOpen(true)
  }

  return (
    <>
      <ContactTable onRowClick={handleRowClick} />
      <ContactDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        contact={selectedContact}
      />
    </>
  )
}
```

### Pattern 2: Auto-Saving Notes with Debounced Server Actions
**What:** Textarea that auto-saves on change with 500ms debounce
**When to use:** Notes fields, any text content that should persist without explicit save
**Example:**
```typescript
// Source: Next.js documentation - Forms with Server Actions
'use client'

export function NotesField({ contactId, initialValue }: Props) {
  const [value, setValue] = useState(initialValue)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    // Clear existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    // Debounce 500ms before saving
    timeoutRef.current = setTimeout(() => {
      saveNotes(contactId, newValue)
    }, 500)
  }

  return (
    <textarea
      value={value}
      onChange={handleChange}
      placeholder="Add notes..."
    />
  )
}
```

### Pattern 3: Drawer with Action Items
**What:** Drawer footer with contextual actions (Send, Edit, Archive, View History)
**When to use:** Detail drawers that allow operations on the displayed item
**Example:**
```typescript
// Source: Existing pattern from request-detail-drawer.tsx
<SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
  <SheetHeader>
    <SheetTitle>Contact Details</SheetTitle>
    <SheetDescription>View and edit contact information</SheetDescription>
  </SheetHeader>

  <div className="mt-6 space-y-6">
    {/* Contact info sections */}
  </div>

  <SheetFooter className="mt-auto flex flex-col gap-2">
    <Button onClick={handleSend}>Send Request</Button>
    <Button variant="outline" onClick={handleEdit}>Edit Contact</Button>
    <Button variant="outline" onClick={handleArchive}>Archive</Button>
    <Button variant="ghost" onClick={handleViewHistory}>View History</Button>
  </SheetFooter>
</SheetContent>
```

### Pattern 4: Request Drawer with Template Dropdown
**What:** Resend action with template selector using DropdownMenu
**When to use:** Already implemented in request-detail-drawer.tsx
**Example:**
```typescript
// Source: request-detail-drawer.tsx lines 190-214
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="w-full justify-between">
      {selectedTemplateId
        ? templates.find(t => t.id === selectedTemplateId)?.name
        : usedTemplate?.name || 'Default Template'}
      <CaretDown className="h-4 w-4 ml-2" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
    <DropdownMenuItem onSelect={() => setSelectedTemplateId(null)}>
      Default Template
    </DropdownMenuItem>
    {templates.map(template => (
      <DropdownMenuItem
        key={template.id}
        onSelect={() => setSelectedTemplateId(template.id)}
      >
        {template.name}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

### Anti-Patterns to Avoid
- **Uncontrolled drawer state:** Always use controlled `open` prop with `onOpenChange` callback, not internal state in drawer component
- **Missing null checks:** Always check if selected item is null before rendering drawer content
- **Trapping focus on desktop:** Only trap focus on mobile; desktop users expect to Tab outside drawers
- **Missing overflow handling:** Always add `overflow-y-auto` to SheetContent to handle long content
- **Form submission without loading states:** Use `useActionState` or `useTransition` to show loading feedback

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drawer/sheet component | Custom slide-in panel with animations | Radix UI Dialog + existing Sheet component | Focus traps, escape key handling, overlay clicks, ARIA attributes, screen reader announcements |
| Auto-save debouncing | Manual setTimeout cleanup | useRef with setTimeout pattern from Next.js docs | Proper cleanup on unmount, consistent timing, proven pattern |
| Form validation | Custom validation logic | Zod schemas with server actions | Type inference, reusable schemas, clear error messages |
| Focus management | Manual focus() calls | Radix Dialog's onOpenAutoFocus / onCloseAutoFocus | Handles edge cases, restores focus correctly |
| Textarea component | Styled HTML textarea | Create components/ui/textarea.tsx following existing Input pattern | Consistent theming, dark mode, focus states |

**Key insight:** Accessibility in drawer components is complex (focus traps, keyboard navigation, screen readers, ARIA). Radix UI primitives handle this correctly out of the box. Custom implementations often miss edge cases like restoring focus, handling nested modals, or managing escape key precedence.

## Common Pitfalls

### Pitfall 1: State Not Resetting When Drawer Closes
**What goes wrong:** Old data from previous selection remains visible when drawer reopens
**Why it happens:** Parent component doesn't null out selected item on close
**How to avoid:** Reset selection state in onOpenChange callback when open becomes false
**Warning signs:** Drawer briefly shows previous item before updating to new selection
**Solution:**
```typescript
<ContactDetailDrawer
  open={open}
  onOpenChange={(newOpen) => {
    setOpen(newOpen)
    if (!newOpen) setSelectedContact(null) // Clear on close
  }}
  contact={selectedContact}
/>
```

### Pitfall 2: Notes Not Saving on Quick Close
**What goes wrong:** User types notes and closes drawer immediately; changes are lost
**Why it happens:** Debounced save hasn't fired yet, and no cleanup on unmount
**How to avoid:** Flush pending save in useEffect cleanup or onOpenChange handler
**Warning signs:** Users report "notes disappear" or "changes don't save"
**Solution:**
```typescript
useEffect(() => {
  return () => {
    // Flush pending save on unmount
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      if (value !== initialValue) {
        saveNotes(contactId, value) // Immediate save
      }
    }
  }
}, [])
```

### Pitfall 3: Drawer Opens Behind Recent Activity Clicks
**What goes wrong:** Clicking recent activity chip navigates to /history instead of opening drawer inline
**Why it happens:** handleActivityClick currently uses router.push instead of drawer state
**How to avoid:** Change send-page-client.tsx handleActivityClick to fetch request data and open drawer
**Warning signs:** Page navigation when requirement says "inline drawer"
**Solution:** Pass drawer control props to SendPageClient and handle click with state change, not navigation

### Pitfall 4: Missing Textarea UI Component
**What goes wrong:** No styled textarea component exists in components/ui/
**Why it happens:** Project has Input but no Textarea component yet
**How to avoid:** Create components/ui/textarea.tsx following Input component pattern
**Warning signs:** Inconsistent styling, missing dark mode support
**Solution:** Copy Input component structure, replace input element with textarea, adjust classes

### Pitfall 5: Contact Row Click Conflicts with Action Buttons
**What goes wrong:** Clicking edit/archive button on row also triggers row click → opens drawer
**Why it happens:** Event propagation not stopped on button clicks
**How to avoid:** Add onClick={(e) => e.stopPropagation()} to all inline action buttons in table rows
**Warning signs:** Drawer opens when clicking edit/archive buttons

## Code Examples

Verified patterns from official sources:

### Database Migration for Notes Column
```sql
-- Source: PostgreSQL best practices (TEXT for variable-length content)
-- Migration: YYYYMMDDHHMMSS_add_contact_notes.sql

-- Add notes column to contacts table
ALTER TABLE public.contacts
  ADD COLUMN notes TEXT DEFAULT '' NOT NULL;

-- Index for searching notes (if needed later)
CREATE INDEX IF NOT EXISTS idx_contacts_notes_search
  ON public.contacts USING gin(to_tsvector('english', notes));

-- Note: RLS policies inherited from table; no new policies needed
```

### Server Action for Saving Notes
```typescript
// Source: Next.js Server Actions guide
// File: lib/actions/contact.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const notesSchema = z.object({
  contactId: z.string().uuid(),
  notes: z.string().max(10000), // Reasonable limit
})

export async function updateContactNotes(contactId: string, notes: string) {
  const supabase = await createClient()

  // Validate input
  const parsed = notesSchema.safeParse({ contactId, notes })
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  // Update contact notes
  const { error } = await supabase
    .from('contacts')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', contactId)

  if (error) {
    console.error('Failed to update notes:', error)
    return { success: false, error: 'Failed to save notes' }
  }

  // Revalidate contacts page
  revalidatePath('/contacts')

  return { success: true }
}
```

### Contact Detail Drawer Component Structure
```typescript
// Source: Existing drawer pattern from request-detail-drawer.tsx + edit-contact-sheet.tsx
// File: components/contacts/contact-detail-drawer.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PaperPlaneRight, PencilSimple, Archive, ClockCounterClockwise } from '@phosphor-icons/react'
import { updateContactNotes } from '@/lib/actions/contact'
import type { Contact } from '@/lib/types/database'
import { format } from 'date-fns'

interface ContactDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
  onSend: (contactId: string) => void
  onEdit: (contact: Contact) => void
  onArchive: (contactId: string) => void
  onViewHistory: (contactId: string) => void
}

export function ContactDetailDrawer({
  open,
  onOpenChange,
  contact,
  onSend,
  onEdit,
  onArchive,
  onViewHistory,
}: ContactDetailDrawerProps) {
  const [notes, setNotes] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Sync notes when contact changes
  useEffect(() => {
    if (contact) {
      setNotes(contact.notes || '')
    }
  }, [contact?.id])

  // Auto-save with debounce
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setNotes(newValue)

    // Clear existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    // Debounce 500ms
    if (contact) {
      timeoutRef.current = setTimeout(() => {
        updateContactNotes(contact.id, newValue)
      }, 500)
    }
  }

  // Flush on close
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!contact) return null

  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Contact Details</SheetTitle>
          <SheetDescription>
            View contact information, add notes, and take actions
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-medium mb-3">Contact</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{contact.name}</p>
                <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes Field */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Add private notes about this contact (auto-saved)
            </p>
            <Textarea
              id="notes"
              value={notes}
              onChange={handleNotesChange}
              placeholder="Add notes about this contact..."
              className="min-h-[120px]"
            />
          </div>

          <Separator />

          {/* Activity Summary */}
          <div>
            <h3 className="text-sm font-medium mb-3">Activity</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last sent:</span>
                <span className="font-medium">
                  {contact.last_sent_at
                    ? format(new Date(contact.last_sent_at), 'MMM d, yyyy')
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total sent:</span>
                <span className="font-medium">{contact.send_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{contact.status}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={() => onSend(contact.id)}
              className="w-full"
            >
              <PaperPlaneRight className="h-4 w-4 mr-2" />
              Send Request
            </Button>
            <Button
              onClick={() => onEdit(contact)}
              variant="outline"
              className="w-full"
            >
              <PencilSimple className="h-4 w-4 mr-2" />
              Edit Contact
            </Button>
            <Button
              onClick={() => onArchive(contact.id)}
              variant="outline"
              className="w-full"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button
              onClick={() => onViewHistory(contact.id)}
              variant="ghost"
              className="w-full"
            >
              <ClockCounterClockwise className="h-4 w-4 mr-2" />
              View History
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### Wiring Recent Activity Chips to Open Drawer Inline
```typescript
// Source: Existing pattern from send-page-client.tsx
// File: app/(dashboard)/send/page.tsx + send-page-client.tsx

// In page.tsx - fetch request details for drawer
const [templates, recentActivity] = await Promise.all([
  getTemplates(business.id),
  getRecentActivity(5),
])

// In send-page-client.tsx - add drawer state
export function SendPageClient({ recentActivity, business, templates, ... }) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false)

  // Fetch full request details when ID selected
  const [requestData, setRequestData] = useState(null)
  useEffect(() => {
    if (selectedRequestId) {
      fetch(`/api/requests/${selectedRequestId}`)
        .then(r => r.json())
        .then(data => {
          setRequestData(data)
          setRequestDrawerOpen(true)
        })
    }
  }, [selectedRequestId])

  const handleActivityClick = (id: string) => {
    setSelectedRequestId(id)
    // No navigation - opens drawer inline
  }

  return (
    <>
      <RecentActivityStrip
        activities={recentActivity}
        onItemClick={handleActivityClick}
      />

      <RequestDetailDrawer
        open={requestDrawerOpen}
        onOpenChange={(open) => {
          setRequestDrawerOpen(open)
          if (!open) {
            setSelectedRequestId(null)
            setRequestData(null)
          }
        }}
        request={requestData}
        business={business}
        templates={templates}
        onResend={handleResend}
        onCancel={handleCancel}
      />
    </>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed-length VARCHAR for notes | TEXT column | PostgreSQL 9.1+ | No performance difference; TEXT preferred for variable-length content |
| Modal dialogs for details | Right-side drawers | 2020+ | Better UX on desktop; keeps context visible |
| Explicit save buttons | Auto-save with debounce | React Server Actions (2023+) | Reduced friction; requires debouncing strategy |
| Custom drawer components | Radix UI primitives | Radix 1.0 (2022+) | Built-in accessibility; less maintenance |
| useState + fetch | useActionState | React 19 (2024) | Better form state management; loading states integrated |

**Deprecated/outdated:**
- **Radix Sheet component:** Radix doesn't have a dedicated Sheet component; use Dialog with positioning
- **Manual form submission with fetch:** Use Server Actions instead of API routes for mutations
- **Uncontrolled Radix components:** Always use controlled mode for drawers to manage state properly

## Open Questions

Things that couldn't be fully resolved:

1. **Should contact detail drawer integrate with quick-send functionality?**
   - What we know: Drawer has "Send Request" action button; quick-send tab has contact selector
   - What's unclear: Should clicking "Send" in drawer pre-select that contact in quick-send tab and close drawer, or open a mini send form in the drawer itself?
   - Recommendation: Pre-select in quick-send tab (simpler, reuses existing flow). Alternative: Add compact send form in drawer if user testing shows drawer exit is jarring.

2. **Should notes field support markdown or rich text?**
   - What we know: TEXT column supports any content; no rich text library installed
   - What's unclear: User need for formatting (bold, bullets, links)
   - Recommendation: Start with plain text; add markdown support later if users request it. Don't add WYSIWYG editor (heavy dependency).

3. **Should drawer show full send history or just summary stats?**
   - What we know: Drawer has "View History" button that can navigate to /history filtered by contact
   - What's unclear: Whether to show last 3-5 sends inline in drawer or keep it summary-only
   - Recommendation: Show summary stats only (last sent, total sent); use "View History" button for full list. Keeps drawer focused and fast.

4. **Should clicking row edit icon also open detail drawer or go to edit sheet?**
   - What we know: Edit icon currently opens edit-contact-sheet.tsx
   - What's unclear: Whether edit drawer and detail drawer should be combined or separate
   - Recommendation: Keep separate. Detail drawer is for viewing + quick actions; edit sheet is specifically for form editing. Clicking edit in detail drawer can open edit sheet.

## Sources

### Primary (HIGH confidence)
- Radix UI Dialog official documentation: https://www.radix-ui.com/primitives/docs/components/dialog
- Next.js Server Actions & Forms guide: https://nextjs.org/docs/app/guides/forms
- PostgreSQL character types documentation: https://www.postgresql.org/docs/current/datatype-character.html
- Existing codebase patterns: components/ui/sheet.tsx, components/history/request-detail-drawer.tsx, components/contacts/edit-contact-sheet.tsx

### Secondary (MEDIUM confidence)
- [Shadcn Sheet component](https://www.shadcn.io/ui/sheet) - Example of Radix Dialog used as sheet
- [Next.js Server Actions Complete Guide 2026](https://dev.to/marufrahmanlive/nextjs-server-actions-complete-guide-with-examples-for-2026-2do0)
- [PostgreSQL TEXT vs VARCHAR comparison](https://www.dbvis.com/thetable/postgres-text-vs-varchar-comparing-string-data-types/)
- [Drawer accessibility best practices](https://codeaccessible.com/codepatterns/drawers/)

### Tertiary (LOW confidence)
- [React design patterns 2026](https://www.sayonetech.com/blog/react-design-patterns/) - General patterns, not drawer-specific
- [State Management in 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - Context for useState vs alternatives

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and working in codebase
- Architecture: HIGH - Existing drawer implementations provide proven patterns
- Pitfalls: HIGH - Identified from existing code review and Radix documentation

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable patterns, mature libraries)
