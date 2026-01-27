# Phase 3: Contact Management - Research

**Researched:** 2026-01-26
**Domain:** Contact CRUD, CSV Import, Search/Filter, Multi-tenant Data Table
**Confidence:** HIGH

## Summary

This phase implements a complete contact management system for a multi-tenant Review SaaS. The core functionality includes contact CRUD operations, CSV import with preview/mapping, search and filtering, bulk operations, and proper empty states. The phase builds on existing patterns established in Phase 1-2 (Server Actions with useActionState, Zod validation, Supabase RLS).

The standard approach for this domain combines:
- **TanStack Table** for data table with sorting, filtering, and row selection
- **PapaParse** for CSV parsing with header detection and error handling
- **shadcn/ui Dialog/Sheet** components for modal add and slide-out edit panels
- **Supabase ilike** filter for simple search (full-text search is overkill for name/email)
- **Unique constraint + application-level check** for duplicate email prevention

**Primary recommendation:** Use TanStack Table with shadcn/ui Table component for the contact list, PapaParse for CSV parsing with client-side preview before server import, and maintain the existing Server Action + useActionState pattern for all mutations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | ^8.x | Headless table with sorting, filtering, row selection | Industry standard for React tables, shadcn/ui recommends it |
| papaparse | ^5.x | CSV parsing with streaming, headers, type detection | Most popular JS CSV parser, handles edge cases well |
| react-dropzone | ^14.x | Drag-and-drop file upload zone | Mature, accessible, works well with shadcn patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-virtual | ^3.x | Virtual scrolling for large lists | For infinite scroll with 1000+ contacts |
| date-fns | ^3.x | Date formatting/parsing | For "Added date" column display and date range filters |

### Already in Project (reuse)
| Library | Purpose | Notes |
|---------|---------|-------|
| zod | Schema validation | Contact schema, CSV row validation |
| react-hook-form | Form state management | Add/edit contact forms |
| shadcn/ui | UI components | Dialog, Sheet, Table, Input, Button, Checkbox, Badge |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Table | AG Grid | AG Grid is heavier, commercial license needed for some features |
| PapaParse | csv-parse | PapaParse better for browser, csv-parse for Node streaming |
| ilike search | Full-text search | FTS is overkill for name/email, ilike is simpler and sufficient |

**Installation:**
```bash
pnpm add @tanstack/react-table papaparse react-dropzone date-fns
pnpm add -D @types/papaparse
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
  validations/
    contact.ts           # Zod schemas for contact, CSV row
  actions/
    contact.ts           # Server Actions for CRUD, bulk ops
  data/
    contact.ts           # Data fetching functions (getContacts, etc.)
  types/
    database.ts          # Add Contact type (extend existing)

components/
  contacts/
    contact-table.tsx    # Main DataTable component
    contact-columns.tsx  # Column definitions with actions
    add-contact-dialog.tsx
    edit-contact-sheet.tsx
    csv-import-dialog.tsx
    csv-preview-table.tsx
    contact-filters.tsx  # Search bar + filter chips
    empty-state.tsx

app/
  dashboard/
    contacts/
      page.tsx           # Server Component, fetches initial data
```

### Pattern 1: Server Actions with useActionState (existing pattern)
**What:** All mutations go through Server Actions, forms use useActionState for pending/error state
**When to use:** All contact CRUD operations
**Example:**
```typescript
// lib/actions/contact.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { contactSchema } from '@/lib/validations/contact'

export type ContactActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  data?: { id: string } // Return created/updated ID
}

export async function createContact(
  _prevState: ContactActionState | null,
  formData: FormData
): Promise<ContactActionState> {
  const supabase = await createClient()

  // Validate user authentication using getUser() (security best practice)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // Get user's business (contacts belong to business, not user directly)
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { error: 'Please create a business profile first' }
  }

  // Parse and validate
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  // Check for duplicate email within this business
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('business_id', business.id)
    .eq('email', parsed.data.email.toLowerCase())
    .single()

  if (existing) {
    return { fieldErrors: { email: ['A contact with this email already exists'] } }
  }

  // Insert
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      business_id: business.id,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone || null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/contacts')
  return { success: true, data: { id: data.id } }
}
```

### Pattern 2: TanStack Table with shadcn/ui
**What:** Headless table logic from TanStack, UI from shadcn Table component
**When to use:** Contact list display with sorting, filtering, selection
**Example:**
```typescript
// components/contacts/contact-columns.tsx
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { Contact } from '@/lib/types/database'

export const columns: ColumnDef<Contact>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant={status === 'archived' ? 'secondary' : 'default'}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Added',
    cell: ({ row }) => format(new Date(row.getValue('created_at')), 'MMM d, yyyy'),
  },
  {
    accessorKey: 'last_sent_at',
    header: 'Last Sent',
    cell: ({ row }) => {
      const date = row.getValue('last_sent_at') as string | null
      return date ? format(new Date(date), 'MMM d, yyyy') : 'Never'
    },
  },
]
```

### Pattern 3: CSV Import with Client-Side Preview
**What:** Parse CSV on client for preview, validate and insert on server
**When to use:** CSV import flow
**Example:**
```typescript
// components/contacts/csv-import-dialog.tsx
'use client'

import Papa from 'papaparse'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

type CSVRow = {
  name?: string
  email?: string
  phone?: string
  // raw values before mapping
  [key: string]: string | undefined
}

type MappedContact = {
  name: string
  email: string
  phone?: string
  isValid: boolean
  errors: string[]
}

// Common header variations to auto-map
const HEADER_MAPPINGS: Record<string, string> = {
  'name': 'name',
  'Name': 'name',
  'NAME': 'name',
  'full_name': 'name',
  'fullname': 'name',
  'contact_name': 'name',
  'email': 'email',
  'Email': 'email',
  'EMAIL': 'email',
  'email_address': 'email',
  'phone': 'phone',
  'Phone': 'phone',
  'PHONE': 'phone',
  'phone_number': 'phone',
  'mobile': 'phone',
}

function autoMapHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  for (const header of headers) {
    const mapped = HEADER_MAPPINGS[header]
    if (mapped) {
      mapping[header] = mapped
    }
  }
  return mapping
}
```

### Pattern 4: RLS for Multi-tenant Contact Isolation
**What:** Contacts scoped to business_id with subquery pattern
**When to use:** All contact table queries
**Example:**
```sql
-- contacts table RLS (follows email_templates pattern)
CREATE POLICY "Users view own contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (business_id IN (
  SELECT id FROM public.businesses
  WHERE user_id = (SELECT auth.uid())
));
```

### Anti-Patterns to Avoid
- **Client-side filtering for large datasets:** Use server-side filtering with Supabase query params
- **Storing duplicate detection in client only:** Always enforce uniqueness at database level
- **Using full-text search for simple name/email search:** ilike is sufficient and simpler
- **Creating contact directly with user_id:** Contacts belong to business_id, not user_id (multi-business future)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Custom regex/split | PapaParse | Handles quotes, escapes, encoding, malformed rows |
| Table sorting/filtering | Custom state management | TanStack Table | Handles edge cases, pagination state, selection |
| Drag-drop file upload | HTML5 drag events | react-dropzone | Accessible, handles edge cases, mobile support |
| Date formatting | Custom formatters | date-fns format() | Locale-aware, handles edge cases |
| Checkbox indeterminate state | Manual DOM manipulation | TanStack Table APIs | getIsSomeRowsSelected() handles it |

**Key insight:** Contact management looks simple but has many edge cases (CSV encoding, duplicate detection across imports, bulk operations atomicity). Use established libraries.

## Common Pitfalls

### Pitfall 1: Duplicate Detection Race Condition
**What goes wrong:** Two concurrent imports both check for duplicate, both pass, both insert
**Why it happens:** Check-then-insert without transaction isolation
**How to avoid:** Use database UNIQUE constraint on (business_id, email) + handle 23505 error gracefully
**Warning signs:** Sporadic duplicate contacts appearing

### Pitfall 2: Large CSV Memory Issues
**What goes wrong:** Browser freezes on large CSV files (10K+ rows)
**Why it happens:** Loading entire file into memory, rendering all preview rows
**How to avoid:** Use PapaParse streaming for preview (show first 100 rows), paginate or virtualize preview table
**Warning signs:** Browser tab becomes unresponsive during import

### Pitfall 3: Missing Business Check
**What goes wrong:** Contact created without business_id or with wrong business
**Why it happens:** Not fetching business before insert, assuming user has business
**How to avoid:** Always fetch business_id from businesses table using user_id, return error if no business
**Warning signs:** RLS policy errors, contacts not appearing

### Pitfall 4: Case-Sensitive Email Duplicates
**What goes wrong:** "John@example.com" and "john@example.com" treated as different
**Why it happens:** Not normalizing email case before storage and comparison
**How to avoid:** Always lowercase email on insert and in duplicate check
**Warning signs:** Same person with multiple contact records

### Pitfall 5: Optimistic UI Without Rollback
**What goes wrong:** UI shows deleted contact, but server action failed, user confused
**Why it happens:** Optimistic update without error handling
**How to avoid:** Use revalidatePath() to refresh data after action, or use React Query mutations with rollback
**Warning signs:** UI state inconsistent with database

### Pitfall 6: Search Debounce Missing
**What goes wrong:** Every keystroke triggers database query, rate limiting or slow UI
**Why it happens:** Not debouncing search input
**How to avoid:** Debounce search input (300-500ms), show loading state during search
**Warning signs:** Slow search, console full of aborted requests

## Code Examples

Verified patterns from official sources:

### Supabase ilike Search for Contacts
```typescript
// lib/data/contact.ts
export async function searchContacts(
  businessId: string,
  query: string,
  filters: { status?: string; dateFrom?: Date; dateTo?: Date }
) {
  const supabase = await createClient()

  let queryBuilder = supabase
    .from('contacts')
    .select('*')
    .eq('business_id', businessId)

  // Search by name OR email (case-insensitive)
  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%`)
  }

  // Status filter
  if (filters.status) {
    queryBuilder = queryBuilder.eq('status', filters.status)
  }

  // Date range filter
  if (filters.dateFrom) {
    queryBuilder = queryBuilder.gte('created_at', filters.dateFrom.toISOString())
  }
  if (filters.dateTo) {
    queryBuilder = queryBuilder.lte('created_at', filters.dateTo.toISOString())
  }

  // Default sort: last_sent_at DESC NULLS LAST, then created_at DESC
  queryBuilder = queryBuilder.order('last_sent_at', { ascending: false, nullsFirst: false })

  const { data, error } = await queryBuilder

  if (error) throw error
  return data
}
```

### PapaParse CSV Parsing with Validation
```typescript
// Source: https://www.papaparse.com/docs
import Papa from 'papaparse'

function parseCSV(file: File): Promise<{ data: CSVRow[], headers: string[], errors: Papa.ParseError[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,           // First row is headers
      skipEmptyLines: true,   // Ignore blank lines
      transformHeader: (header) => header.trim(), // Clean whitespace
      complete: (results) => {
        resolve({
          data: results.data as CSVRow[],
          headers: results.meta.fields || [],
          errors: results.errors,
        })
      },
      error: (error) => reject(error),
    })
  })
}
```

### Controlled shadcn/ui Dialog for Add Contact
```typescript
// components/contacts/add-contact-dialog.tsx
'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createContact, type ContactActionState } from '@/lib/actions/contact'

export function AddContactDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<ContactActionState | null, FormData>(
    async (prevState, formData) => {
      const result = await createContact(prevState, formData)
      if (result.success) {
        setOpen(false) // Close dialog on success
      }
      return result
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Contact</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {/* Form fields */}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Adding...' : 'Add Contact'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### shadcn/ui Sheet for Edit Contact Panel
```typescript
// components/contacts/edit-contact-sheet.tsx
'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Contact } from '@/lib/types/database'

interface EditContactSheetProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditContactSheet({ contact, open, onOpenChange }: EditContactSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Edit Contact</SheetTitle>
        </SheetHeader>
        {contact && (
          <div className="mt-6 space-y-6">
            {/* Edit form */}
            <EditContactForm contact={contact} onSuccess={() => onOpenChange(false)} />

            {/* Activity summary */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Activity</h3>
              <dl className="text-sm space-y-1">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Last sent</dt>
                  <dd>{contact.last_sent_at ? format(new Date(contact.last_sent_at), 'PPP') : 'Never'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total sent</dt>
                  <dd>{contact.send_count || 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

### Bulk Archive with Server Action
```typescript
// lib/actions/contact.ts
export async function bulkArchiveContacts(
  contactIds: string[]
): Promise<ContactActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // RLS ensures user can only update their own contacts
  const { error } = await supabase
    .from('contacts')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .in('id', contactIds)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom table components | TanStack Table v8 + shadcn | 2023 | Headless + design system = better DX |
| react-csv | PapaParse | Stable | PapaParse handles more edge cases |
| useFormState | useActionState | React 19 / Next.js 15 | Renamed hook, same pattern |
| getSession() | getUser() | Supabase best practice | JWT validation for security |

**Deprecated/outdated:**
- **react-table v7:** Use TanStack Table v8 (rebranded, new API)
- **useFormState:** Renamed to useActionState in React 19
- **Client-only deduplication:** Always back with database constraint

## Open Questions

Things that couldn't be fully resolved:

1. **Infinite scroll vs pagination**
   - What we know: TanStack Virtual supports infinite scroll well
   - What's unclear: Performance threshold (when to switch from simple pagination)
   - Recommendation: Start with pagination, add infinite scroll if contacts exceed 100 per page frequently

2. **Merge contacts UI complexity**
   - What we know: Context says "only if ROI is great"
   - What's unclear: How often duplicates occur, user expectations
   - Recommendation: For CSV import preview, show duplicates and let user choose skip/replace. Don't build full merge UI initially.

3. **Tags system scope**
   - What we know: Filter by tags is in requirements
   - What's unclear: Whether tags are predefined or user-created
   - Recommendation: Simple user-created tags stored as text[] array initially, can migrate to tags table later

## Sources

### Primary (HIGH confidence)
- [PapaParse Documentation](https://www.papaparse.com/docs) - CSV parsing config, streaming, error handling
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table) - TanStack Table integration pattern
- [shadcn/ui Sheet](https://ui.shadcn.com/docs/components/sheet) - Slide-out panel component
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog) - Modal dialog component
- [Supabase Full Text Search](https://supabase.com/docs/guides/database/full-text-search) - Search implementation options
- [Supabase ilike](https://supabase.com/docs/reference/javascript/v1/ilike) - Case-insensitive pattern matching
- [TanStack Table Row Selection](https://tanstack.com/table/v8/docs/guide/row-selection) - Checkbox selection pattern

### Secondary (MEDIUM confidence)
- [Next.js Forms Guide](https://nextjs.org/docs/app/guides/forms) - Server Actions with forms
- [TanStack Virtual Infinite Scroll](https://tanstack.com/virtual/v3/docs/framework/react/examples/infinite-scroll) - Virtual scrolling example
- [react-dropzone GitHub](https://github.com/react-dropzone/react-dropzone) - Drag-drop file upload

### Tertiary (LOW confidence)
- Community patterns for CSV import preview UI (multiple sources, no authoritative guide)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Well-documented libraries with official integration guides
- Architecture: HIGH - Follows existing project patterns from Phase 1-2
- Pitfalls: HIGH - Based on official docs and known PostgreSQL/Supabase behaviors

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable domain)
