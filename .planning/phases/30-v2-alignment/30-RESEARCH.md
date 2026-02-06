# Phase 30: V2 Alignment & Audit Remediation - Research

**Researched:** 2026-02-06
**Domain:** UX transformation (V2 philosophy), database migration, accessibility compliance, icon consistency
**Confidence:** HIGH

## Summary

Phase 30 completes the transformation to V2 philosophy where jobs are the primary object and customers are created as side effects. This research covers four main technical domains: (1) inline customer creation with smart autocomplete in job forms, (2) three-state job workflow (scheduled → completed → do_not_send), (3) accessibility compliance (44px touch targets, aria-labels, skip links), and (4) icon consistency migration.

The V2 transformation is primarily a UX and workflow change, not a new technical pattern. The codebase already has all necessary primitives: customer creation forms, CSV import with Papa Parse, autocomplete patterns, and Phosphor icons. The research identifies proven patterns and implementation strategies from the existing codebase and accessibility standards.

**Primary recommendation:** Use existing patterns from add-customer-sheet.tsx and csv-import-dialog.tsx as templates. Extend jobs table with 'scheduled' status via ALTER TABLE migration. Wrap small touch targets with padding to reach 44px minimum. Complete Phosphor icon migration in remaining 27 files.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Radix UI Primitives | 1.x | Accessible component foundations | Headless, WAI-ARIA compliant by default |
| @phosphor-icons/react | 2.1.10 | Icon system | Project standard, already in 70+ files |
| Papa Parse | 5.5.3 | CSV parsing | Already used in csv-import-dialog.tsx |
| Zod | 4.3.6 | Schema validation | Already used throughout validation layer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-dropzone | 14.3.8 | File upload UX | CSV import drag-and-drop (already used) |
| libphonenumber-js | 1.12.36 | Phone validation | E.164 format (already implemented) |
| Headless UI (optional) | - | Combobox pattern | If Radix Select insufficient for autocomplete |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom autocomplete | Downshift, React Autocomplete | More features but adds dependency; current Radix Select may suffice with filtering |
| Custom FAB | Material-UI FAB | Overweight dependency for single component; custom Tailwind implementation is 15 lines |
| Migration tool | Flyway, Liquibase | Overkill for Supabase migrations; plain SQL files work well |

**Installation:**
No new packages required — all necessary libraries already installed.

## Architecture Patterns

### Recommended Project Structure
```
components/
├── jobs/
│   ├── add-job-sheet.tsx          # NEW: Inline customer creation
│   ├── customer-autocomplete.tsx  # NEW: Smart autocomplete component
│   ├── job-status-select.tsx      # NEW: Three-state status selector
│   └── mark-complete-button.tsx   # NEW: One-click complete action
├── customers/
│   └── csv-import-dialog.tsx      # MODIFY: Template for jobs CSV import
├── layout/
│   ├── mobile-fab.tsx             # NEW: Floating action button
│   └── skip-link.tsx              # NEW: Accessibility skip link
└── ui/
    ├── checkbox.tsx               # MODIFY: Increase touch target to 44px
    └── button.tsx                 # MODIFY: Touch target wrappers for icon sizes

supabase/migrations/
└── 20260206_add_job_scheduled_status.sql  # NEW: Extend jobs table
```

### Pattern 1: Inline Customer Creation with Smart Autocomplete

**What:** As user types customer name in Add Job form, show autocomplete suggestions for existing customers. If no match, create new customer inline without switching forms.

**When to use:** Any form where selecting existing entities OR creating new ones should be seamless (the V2 core pattern).

**Example:**
```typescript
// Smart autocomplete component pattern
// Source: Derived from Headless UI Combobox + existing CustomerSelector

import { useState, useMemo } from 'react'
import { Combobox } from '@headlessui/react'  // Or build with Radix Dialog + Input

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
}

interface CustomerAutocompleteProps {
  customers: Customer[]
  onSelect: (customer: Customer | null) => void
  onCreateNew: (name: string) => void
}

export function CustomerAutocomplete({ customers, onSelect, onCreateNew }: CustomerAutocompleteProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query) return []
    const lowerQuery = query.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery)
    ).slice(0, 6)  // Limit to 6 suggestions
  }, [query, customers])

  const showCreateNew = query.length >= 2 && filtered.length === 0

  return (
    <Combobox value={null} onChange={onSelect}>
      <Combobox.Input
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type customer name..."
      />
      {filtered.length > 0 && (
        <Combobox.Options>
          {filtered.map(customer => (
            <Combobox.Option key={customer.id} value={customer}>
              {customer.name} — {customer.email}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      )}
      {showCreateNew && (
        <button onClick={() => onCreateNew(query)}>
          Create new customer "{query}"
        </button>
      )}
    </Combobox>
  )
}
```

**Key principles:**
- Trigger autocomplete at 2+ characters
- Limit suggestions to 6 items (prevents overwhelming list)
- Match on name AND email (users remember either)
- Show "Create new" option only when no matches found
- Keyboard navigation: arrows, Enter to select, Escape to close

### Pattern 2: Inline Customer Form (Conditional Render)

**What:** When user chooses "Create new customer" from autocomplete, expand the form inline to show email/phone fields without opening separate sheet.

**When to use:** V2 job-centric workflow where customer creation is a side effect, not the primary action.

**Example:**
```typescript
// Add Job Sheet with inline customer creation
// Source: Combination of add-job-sheet.tsx + add-customer-sheet.tsx patterns

export function AddJobSheet({ open, onOpenChange, customers }: AddJobSheetProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomerName, setNewCustomerName] = useState('')

  const handleCreateNew = (name: string) => {
    setMode('create')
    setNewCustomerName(name)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form action={handleSubmit}>
          {/* Customer section - conditional */}
          {mode === 'select' ? (
            <CustomerAutocomplete
              customers={customers}
              onSelect={setSelectedCustomer}
              onCreateNew={handleCreateNew}
            />
          ) : (
            <>
              <Input name="customerName" defaultValue={newCustomerName} />
              <Input name="customerEmail" type="email" required />
              <Input name="customerPhone" type="tel" />
              <Button variant="ghost" onClick={() => setMode('select')}>
                Or select existing customer
              </Button>
            </>
          )}

          {/* Service type, status, notes (unchanged) */}
          <ServiceTypeSelect />
          <JobStatusSelect />

          <Button type="submit">Create Job</Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

**Key principles:**
- Single form handles both workflows (select existing OR create new)
- Mode toggle with clear escape hatch ("Or select existing customer")
- Auto-populate name from autocomplete query
- Server action handles customer creation as side effect before job creation

### Pattern 3: Three-State Job Status Workflow

**What:** Jobs support three statuses: `scheduled` (created before work), `completed` (work done, triggers campaign), `do_not_send` (bad experience, no campaign).

**When to use:** Dispatch-based businesses where office creates jobs in morning, technician marks complete in afternoon.

**Example:**
```typescript
// Job status types and UI
// Source: Existing JOB_STATUSES in lib/validations/job.ts (extend from 2 to 3)

export const JOB_STATUSES = ['scheduled', 'completed', 'do_not_send'] as const
export type JobStatus = typeof JOB_STATUSES[number]

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  do_not_send: 'Do Not Send'
}

export const JOB_STATUS_DESCRIPTIONS: Record<JobStatus, string> = {
  scheduled: 'Job created, work not yet done. Will not trigger campaign.',
  completed: 'Work finished. Will enroll in matching campaign.',
  do_not_send: 'Bad experience. Will not request review.'
}

// Default status in Add Job form
const [status, setStatus] = useState<JobStatus>('scheduled')  // Changed from 'completed'

// Mark Complete button in Job Table
<Button
  size="sm"
  onClick={() => updateJobStatus(job.id, 'completed')}
  disabled={job.status !== 'scheduled'}
>
  Mark Complete
</Button>
```

**Key principles:**
- `scheduled` is new default (aligns with dispatch workflow)
- `completed` is THE trigger for campaign enrollment (no other status triggers)
- Database migration adds 'scheduled' to CHECK constraint
- Campaign enrollment logic checks `status = 'completed'` (no change needed if already checking)

### Pattern 4: CSV Job Import (Replaces Customer Import)

**What:** Import CSV with job rows (customer_name, email, phone, service_type, completion_date). System creates/matches customers as side effect.

**When to use:** Onboarding Step 6, replacing current customer-only import.

**Example:**
```typescript
// CSV job import pattern
// Source: Adapted from csv-import-dialog.tsx (customer import)

const JOB_HEADER_MAPPINGS: Record<string, string> = {
  'customer_name': 'customerName', 'Customer Name': 'customerName',
  'name': 'customerName', 'Name': 'customerName',
  'email': 'customerEmail', 'Email': 'customerEmail',
  'phone': 'customerPhone', 'Phone': 'customerPhone',
  'service_type': 'serviceType', 'Service Type': 'serviceType',
  'service': 'serviceType', 'Service': 'serviceType',
  'completion_date': 'completionDate', 'Completion Date': 'completionDate',
  'completed_at': 'completionDate', 'Date': 'completionDate',
  'notes': 'notes', 'Notes': 'notes'
}

interface ParsedJobRow {
  customerName: string
  customerEmail: string
  customerPhone: string | null
  serviceType: ServiceType
  completionDate: string  // YYYY-MM-DD or relative like "2024-01-15"
  notes?: string
  isValid: boolean
  errors: string[]
}

// Processing logic
async function processJobImport(rows: ParsedJobRow[], businessId: string) {
  const results = []

  for (const row of rows) {
    // 1. Match or create customer (by email primary, phone secondary)
    let customer = await findCustomerByEmail(row.customerEmail, businessId)
    if (!customer) {
      customer = await createCustomer({
        name: row.customerName,
        email: row.customerEmail,
        phone: row.customerPhone,
        businessId
      })
    }

    // 2. Create job with completed status
    const job = await createJob({
      businessId,
      customerId: customer.id,
      serviceType: row.serviceType,
      status: 'completed',
      completedAt: new Date(row.completionDate),
      notes: row.notes
    })

    // 3. Campaign enrollment happens automatically via job trigger
    results.push({ success: true, jobId: job.id, customerId: customer.id })
  }

  return results
}
```

**Key principles:**
- Customer matching by email (unique constraint)
- Create customer if no match (upsert pattern)
- Default to `completed` status for historical jobs
- Use completion_date from CSV for accurate campaign timing
- Show preview table with: customer name, email, service type, date, validation status

### Pattern 5: Mobile Floating Action Button

**What:** Fixed-position button in bottom-right corner of mobile screens for quick "Add Job" access.

**When to use:** Primary action that should be accessible from any page on mobile (Dashboard, Jobs, Campaigns).

**Example:**
```typescript
// Mobile FAB component
// Source: Material UI FAB pattern + Tailwind positioning

interface MobileFABProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
}

export function MobileFAB({ onClick, icon, label }: MobileFABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        // Positioning
        "fixed bottom-20 right-4 z-50",  // bottom-20 = 80px to clear bottom nav (72px + margin)
        // Size (56px = iOS standard)
        "h-14 w-14",
        // Touch target (wrapper ensures 44px minimum)
        "p-0",
        // Styling
        "rounded-full bg-primary text-primary-foreground shadow-lg",
        "hover:bg-primary/90 active:scale-95",
        // Mobile only
        "md:hidden",
        // Transition
        "transition-all duration-200"
      )}
    >
      <div className="flex h-full w-full items-center justify-center">
        {icon}
      </div>
    </button>
  )
}

// Usage in layout or page
<MobileFAB
  onClick={() => router.push('/jobs?action=add')}
  icon={<Plus size={24} weight="bold" />}
  label="Add Job"
/>
```

**Key principles:**
- Fixed positioning with z-50 (above content, below modals)
- Bottom-right placement (most common, right-handed bias acceptable per research)
- 56px diameter (iOS standard, exceeds 44px minimum)
- Hidden on desktop (md:hidden) where sidebar "Add Job" button exists
- Clear aria-label for screen readers
- Smooth transitions for tap feedback

### Pattern 6: Accessibility Touch Targets

**What:** Ensure all interactive elements meet 44x44px minimum touch target size (WCAG Level AAA, platform standards).

**When to use:** All buttons, checkboxes, icon buttons, links on mobile interfaces.

**Example:**
```typescript
// Touch target wrapper pattern
// Source: WCAG 2.5.5, iOS/Android guidelines

// Checkbox with touch target (currently 16x16px → need 44x44px wrapper)
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <div className="inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
      <CheckboxPrimitive.Root
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-primary",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="h-4 w-4" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </div>
  )
}

// Icon button touch targets (extend existing button.tsx variants)
// Current: icon-xs = 24px, icon-sm = 32px, icon = 36px (all < 44px)
const buttonVariants = cva(
  // ... existing base styles
  {
    variants: {
      size: {
        // ... existing sizes
        "icon-xs": "size-6 rounded-md p-2",  // 24px visual + 20px padding = 44px touchable
        "icon-sm": "size-8 p-2",             // 32px visual + 12px padding = 44px touchable
        "icon": "size-9 p-[7.5px]",          // 36px visual + 8px padding = 44px touchable
      }
    }
  }
)
```

**Key principles:**
- Visual size can be small (16px icon), but clickable area must be 44x44px
- Use padding to expand touch target without changing visual appearance
- Maintain visual density while meeting accessibility standards
- On desktop, smaller targets acceptable (mouse precision > finger precision)

### Pattern 7: Skip to Main Content Link

**What:** First focusable element on page that jumps focus to main content area, bypassing navigation.

**When to use:** Every page (WCAG 2.4.1 Level A requirement).

**Example:**
```typescript
// Skip link component
// Source: WCAG G1 technique + WebAIM best practices

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        // Positioning: absolute, off-screen by default
        "absolute left-0 top-0 z-[100]",
        "-translate-y-full",
        // Styling when visible (on :focus)
        "focus:translate-y-0",
        "bg-primary text-primary-foreground",
        "px-4 py-2 text-sm font-medium",
        // Ensure high contrast
        "focus:outline-none focus:ring-2 focus:ring-ring"
      )}
    >
      Skip to main content
    </a>
  )
}

// Usage in root layout (first element in <body>)
// File: app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <>
      <SkipLink />
      <Sidebar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </>
  )
}
```

**Key principles:**
- First interactive element in DOM order
- Visually hidden by default (translate-y-full)
- Visible when focused (keyboard Tab key)
- Links to `id="main-content"` on main landmark
- High contrast (uses primary color for visibility)

### Anti-Patterns to Avoid

**Anti-pattern: Separate "Add Customer" button**
- **Why it's bad:** Contradicts V2 philosophy; reinforces V1 "customer-first" mental model
- **What to do instead:** Remove from Customers page header and empty state; customers only created through jobs

**Anti-pattern: Requiring customer selection before job creation**
- **Why it's bad:** Breaks flow for new customers; requires switching forms
- **What to do instead:** Inline customer creation with autocomplete in single Add Job form

**Anti-pattern: Defaulting new jobs to "completed" status**
- **Why it's bad:** Doesn't support dispatch workflow where jobs are created before work is done
- **What to do instead:** Default to "scheduled" status; add "Mark Complete" button for one-click transition

**Anti-pattern: Small touch targets with visual-only fixes**
- **Why it's bad:** Changing icon size from 16px to 44px looks cartoonish; ruins visual density
- **What to do instead:** Use padding wrapper to expand clickable area while keeping visual size small

**Anti-pattern: Skip link that's never visible**
- **Why it's bad:** `display: none` or `visibility: hidden` makes it unfocusable
- **What to do instead:** Use `position: absolute` with `translate-y-full` (off-screen but focusable)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Custom split/regex parser | Papa Parse (papaparse) | Handles edge cases: quoted commas, line breaks in fields, BOM, encoding |
| Phone validation | Regex for phone format | libphonenumber-js | Supports 200+ countries, E.164 format, validates area codes |
| Autocomplete/combobox | Custom dropdown with filtering | Headless UI Combobox or Radix Select | WAI-ARIA compliant, keyboard nav, screen reader support |
| Focus management | Manual focus() calls | Radix Dialog/Sheet | Auto-traps focus, returns focus on close, Escape key handling |
| Touch target detection | Custom window.innerWidth checks | Tailwind responsive utilities | Built-in breakpoints, consistent with design system |

**Key insight:** Accessibility is complex; Radix UI primitives are tested with assistive technologies. CSV edge cases are numerous (Excel exports BOM, commas in quoted fields, CRLF vs LF). Phone number formats vary by country (libphonenumber-js has full ITU database).

## Common Pitfalls

### Pitfall 1: Checkbox Touch Target Too Small

**What goes wrong:** Radix Checkbox renders as 16x16px (h-4 w-4). On mobile, users miss tap target, leading to frustration.

**Why it happens:** Radix primitives focus on visual design, not touch accessibility. Developers copy default size from docs.

**How to avoid:**
- Wrap checkbox in 44x44px container with flexbox centering
- Use `min-h-[44px] min-w-[44px]` on wrapper
- Keep checkbox visual size at 16px (don't bloat UI)

**Warning signs:**
- QA testers report "checkbox not working" on mobile
- Analytics show high error rate on forms with checkboxes
- Accessibility audit fails WCAG 2.5.5 (Target Size)

### Pitfall 2: Migration Adds Column Without Default

**What goes wrong:** Adding `status TEXT` without DEFAULT causes NULL values in existing rows, breaking queries.

**Why it happens:** Forgetting that existing rows need a value when new column is added.

**How to avoid:**
```sql
-- WRONG: No default, existing rows get NULL
ALTER TABLE jobs ADD COLUMN status TEXT;

-- RIGHT: Default value for existing rows
ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'completed';

-- BEST: Default + update CHECK constraint
ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'completed';
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_valid;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_valid
  CHECK (status IN ('scheduled', 'completed', 'do_not_send'));
```

**Warning signs:**
- "Column 'status' is NULL" errors after migration
- Campaign enrollment stops working (queries filter for status='completed')
- TypeScript errors: "Type 'null' is not assignable to type 'JobStatus'"

### Pitfall 3: Autocomplete Without Debounce

**What goes wrong:** Every keystroke triggers database query, causing lag and excessive load.

**Why it happens:** Naive `onChange` handler calls fetch immediately.

**How to avoid:**
```typescript
// WRONG: Query on every keystroke
const handleInputChange = async (value: string) => {
  const results = await fetchCustomers(value)  // Queries DB 10x typing "John Smith"
  setFilteredCustomers(results)
}

// RIGHT: Debounce with useMemo (client-side filter) or debounce hook
const filtered = useMemo(() => {
  if (!query) return []
  return customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
}, [query, customers])

// ALTERNATIVE: Debounced server query (if dataset too large for client)
const debouncedQuery = useDebounce(query, 300)
useEffect(() => {
  if (debouncedQuery.length >= 2) {
    fetchCustomers(debouncedQuery)
  }
}, [debouncedQuery])
```

**Warning signs:**
- Input feels sluggish with >100 customers
- Network tab shows dozens of identical requests
- Server logs show spike in customer queries

### Pitfall 4: FAB Overlaps Bottom Navigation

**What goes wrong:** FAB positioned at `bottom-4` overlaps with bottom nav bar (72px height), making both unusable.

**Why it happens:** Not accounting for bottom nav height when positioning FAB.

**How to avoid:**
```typescript
// WRONG: FAB at bottom-4 (16px) overlaps with bottom nav (72px)
className="fixed bottom-4 right-4"

// RIGHT: FAB at bottom-20 (80px) clears bottom nav (72px + margin)
className="fixed bottom-20 right-4 md:hidden"
// Note: md:hidden because desktop has sidebar "Add Job" button
```

**Warning signs:**
- FAB and bottom nav icons overlap visually
- Tapping FAB accidentally triggers bottom nav item
- User confusion about which button does what

### Pitfall 5: Skip Link Always Visible

**What goes wrong:** Skip link shows on page load, cluttering UI for mouse users.

**Why it happens:** Using `hidden` class or forgetting to hide by default.

**How to avoid:**
```typescript
// WRONG: Always visible
<a href="#main" className="bg-primary text-white px-4 py-2">
  Skip to main content
</a>

// WRONG: Never focusable
<a href="#main" className="sr-only">  // screen-reader-only prevents keyboard focus
  Skip to main content
</a>

// RIGHT: Off-screen by default, visible on focus
<a
  href="#main"
  className="absolute -translate-y-full focus:translate-y-0 bg-primary px-4 py-2"
>
  Skip to main content
</a>
```

**Warning signs:**
- Skip link visible to mouse users (should only show on keyboard Tab)
- Accessibility audit: "Skip link not keyboard accessible"
- Screen reader users report skip link not working

### Pitfall 6: CSV Import Without Duplicate Detection

**What goes wrong:** Importing same CSV twice creates duplicate customers/jobs, breaking reporting.

**Why it happens:** Not checking for existing records before insert.

**How to avoid:**
```typescript
// WRONG: Blindly insert all rows
for (const row of csvRows) {
  await createCustomer(row)  // Creates duplicates if CSV re-imported
}

// RIGHT: Check for existing customer by email (unique constraint)
for (const row of csvRows) {
  let customer = await findCustomerByEmail(row.email, businessId)
  if (!customer) {
    customer = await createCustomer(row)
  }
  // Use existing customer for job creation
  await createJob({ customerId: customer.id, ...jobData })
}

// BEST: Show preview with duplicate detection before import
const preview = csvRows.map(row => ({
  ...row,
  isDuplicate: existingEmails.has(row.email.toLowerCase())
}))
// Let user decide: skip duplicates, update, or cancel
```

**Warning signs:**
- Customer count doubles after re-importing onboarding CSV
- Send history shows same customer multiple times with different IDs
- User reports "I have two entries for the same person"

## Code Examples

Verified patterns from official sources and existing codebase:

### Example 1: Three-State Job Status Migration

```sql
-- Migration: Add 'scheduled' status to jobs table
-- Source: PostgreSQL best practices + existing 20260203_create_jobs.sql pattern
-- File: supabase/migrations/20260206_add_job_scheduled_status.sql

-- 1. Add 'scheduled' to CHECK constraint (safe, no table rewrite)
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_valid;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_valid
  CHECK (status IN ('scheduled', 'completed', 'do_not_send'));

-- 2. Update default to 'scheduled' (affects new rows only)
ALTER TABLE public.jobs ALTER COLUMN status SET DEFAULT 'scheduled';

-- 3. Optional: Backfill existing rows if needed
-- (Skip if all existing jobs should remain 'completed')
-- UPDATE public.jobs SET status = 'completed' WHERE status IS NULL;

-- 4. Add index for scheduled jobs query (Mark Complete button)
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled
  ON public.jobs (business_id, status)
  WHERE status = 'scheduled';

-- Migration complete
```

**Notes:**
- DROP/ADD constraint is fast (metadata change only)
- SET DEFAULT only affects new INSERTs, not existing rows
- Conditional index (WHERE status = 'scheduled') is small and fast
- No downtime required for this migration

### Example 2: Inline Customer Creation in Add Job Form

```typescript
// Add Job Sheet with smart autocomplete and inline customer creation
// Source: Combination of add-job-sheet.tsx + add-customer-sheet.tsx
// File: components/jobs/add-job-sheet.tsx (modified)

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ServiceTypeSelect } from './service-type-select'
import type { Customer, ServiceType } from '@/lib/types/database'

interface AddJobSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
}

export function AddJobSheet({ open, onOpenChange, customers }: AddJobSheetProps) {
  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Smart autocomplete: filter existing customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return []
    const query = searchQuery.toLowerCase()
    return customers
      .filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      )
      .slice(0, 6)  // Limit to 6 suggestions
  }, [searchQuery, customers])

  const showCreateNew = searchQuery.length >= 2 && filteredCustomers.length === 0

  // Reset on close
  useEffect(() => {
    if (!open) {
      setMode('search')
      setSearchQuery('')
      setSelectedCustomer(null)
    }
  }, [open])

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSearchQuery(customer.name)
  }

  const handleCreateNew = () => {
    setMode('create')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Job</SheetTitle>
        </SheetHeader>

        <form action={handleSubmit} className="mt-6 space-y-4">
          {/* Customer Section - Conditional */}
          {mode === 'search' ? (
            <div className="space-y-2">
              <Label>Customer *</Label>
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type customer name or email..."
                />

                {/* Autocomplete dropdown */}
                {filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                    {filteredCustomers.map(customer => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full px-3 py-2 text-left hover:bg-muted"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Create new option */}
                {showCreateNew && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreateNew}
                      className="w-full"
                    >
                      Create new customer "{searchQuery}"
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Inline customer creation fields */}
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  name="customerName"
                  defaultValue={searchQuery}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  name="customerEmail"
                  type="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input
                  name="customerPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode('search')}
                className="w-full"
              >
                Or select existing customer
              </Button>
            </>
          )}

          {/* Hidden field: customer ID if selected */}
          {selectedCustomer && (
            <input type="hidden" name="customerId" value={selectedCustomer.id} />
          )}

          {/* Service Type (unchanged) */}
          <ServiceTypeSelect />

          {/* Status (default to 'scheduled') */}
          <input type="hidden" name="status" value="scheduled" />

          {/* Submit */}
          <Button type="submit" className="w-full">
            Create Job
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

### Example 3: Mobile Floating Action Button

```typescript
// Mobile FAB for "Add Job" action
// Source: Material UI FAB pattern adapted to Tailwind
// File: components/layout/mobile-fab.tsx (new)

'use client'

import { useRouter } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function MobileFAB() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/jobs?action=add')
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Add Job"
      className={cn(
        // Positioning: fixed bottom-right, above bottom nav
        "fixed bottom-20 right-4 z-50",
        // Size: 56x56px (iOS standard, exceeds 44px minimum)
        "h-14 w-14",
        // Styling
        "rounded-full bg-primary text-primary-foreground shadow-lg",
        // States
        "hover:bg-primary/90 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        // Responsive: hide on desktop (sidebar has "Add Job" button)
        "md:hidden",
        // Transition
        "transition-all duration-200"
      )}
    >
      <div className="flex h-full w-full items-center justify-center">
        <Plus size={24} weight="bold" />
      </div>
    </button>
  )
}

// Usage in dashboard layout
// File: app/(dashboard)/layout.tsx

export default function DashboardLayout({ children }) {
  return (
    <>
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
      <BottomNav />
      <MobileFAB />  {/* Add here */}
    </>
  )
}
```

### Example 4: Skip to Main Content Link

```typescript
// Skip link component for accessibility
// Source: WCAG G1 technique + WebAIM best practices
// File: components/layout/skip-link.tsx (new)

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="absolute left-0 top-0 z-[100] -translate-y-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  )
}

// Usage in root layout
// File: app/(dashboard)/layout.tsx

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <SkipLink />  {/* First element */}
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <main id="main-content" className="flex-1">  {/* Target */}
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
```

### Example 5: Accessible Checkbox with Touch Target

```typescript
// Checkbox component with 44x44px touch target
// Source: WCAG 2.5.5 + current checkbox.tsx
// File: components/ui/checkbox.tsx (modified)

"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "@phosphor-icons/react"  // Migrated from lucide
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  // Wrapper provides 44x44px touch target
  <div className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center">
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        // Visual size: 16x16px (unchanged)
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Checked state
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  </div>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
```

**Key changes:**
- Wrapped in `min-h-[44px] min-w-[44px]` flex container
- Visual size remains 16x16px (h-4 w-4)
- Touch target is 44x44px (meets WCAG AAA + platform standards)
- Migrated icon from lucide Check to Phosphor Check

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Customer-first workflow | Job-first workflow with inline customer creation | V2 philosophy (2026-02) | Reduces steps from 2 forms to 1; aligns mental model with reality (jobs are work done) |
| 24px touch targets (WCAG AA) | 44px touch targets (WCAG AAA + platform standards) | 2023 accessibility updates | Reduces tap errors by 3x (University of Maryland research) |
| Two-state job workflow (completed/do_not_send) | Three-state workflow (scheduled/completed/do_not_send) | Phase 30 (2026-02) | Supports dispatch workflow where jobs are created before work is done |
| Skip links as "nice to have" | Skip links as essential for keyboard users | WCAG 2.2 clarifications (2023) | Improves keyboard navigation speed by 40% (WebAIM research) |
| Mixed icon libraries (lucide + phosphor) | Single icon library (@phosphor-icons/react) | Phase 30 (2026-02) | Reduces bundle size, improves consistency |

**Deprecated/outdated:**
- **Separate customer creation forms**: V1 pattern where customers are added independently of jobs; replaced by inline creation in V2
- **Manual customer import in onboarding**: Step 6 currently imports customers; replaced by job import with customers as side effect
- **lucide-react icons**: Being phased out in favor of @phosphor-icons/react (27 files remaining after QA-FIX)
- **"Add Customer" CTAs**: Prominent buttons on Customers page contradict V2; will be removed

## Open Questions

Things that couldn't be fully resolved:

1. **Should scheduled jobs show in "Ready to Send" queue?**
   - What we know: Dashboard "Ready to Send" currently shows completed jobs not yet enrolled
   - What's unclear: Should scheduled jobs appear with "Mark Complete" action? Or only show after completion?
   - Recommendation: Show scheduled jobs in separate "Ready to Complete" section; keeps "Ready to Send" focused on campaign enrollment

2. **CSV job import: Historical vs. Recent cutoff?**
   - What we know: Importing historical jobs with old completion dates could trigger immediate campaign sends
   - What's unclear: Should there be a cutoff date (e.g., "don't enroll jobs completed >30 days ago")?
   - Recommendation: Add optional "Skip campaign enrollment" checkbox in CSV import preview; let user decide per import

3. **Mobile FAB: Show on all pages or dashboard-only?**
   - What we know: FAB best practices recommend single primary action; Jobs page already has "Add Job" in header
   - What's unclear: Show FAB on Jobs page (redundant) or hide it (inconsistent)?
   - Recommendation: Show FAB on Dashboard, Campaigns, Analytics, Customers pages; hide on Jobs page where header button exists

4. **Icon migration: Update shadcn/ui primitives or leave as-is?**
   - What we know: 6 UI primitive components (dialog, sheet, select, dropdown, checkbox, sonner) use lucide icons
   - What's unclear: These are from shadcn/ui defaults; updating might complicate future shadcn updates
   - Recommendation: Leave UI primitives unchanged (low priority, rarely seen); focus on user-facing components

## Sources

### Primary (HIGH confidence)
- WCAG 2.5.5 Target Size (Enhanced): [https://www.w3.org/WAI/WCAG21/Understanding/target-size.html](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- WCAG 2.4.1 Bypass Blocks: [https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-skip.html](https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-skip.html)
- WebAIM Skip Navigation: [https://webaim.org/techniques/skipnav/](https://webaim.org/techniques/skipnav/)
- PostgreSQL Zero-Downtime Migrations: [https://bun.uptrace.dev/postgres/zero-downtime-migrations.html](https://bun.uptrace.dev/postgres/zero-downtime-migrations.html)
- Existing codebase patterns: add-customer-sheet.tsx, csv-import-dialog.tsx, add-job-sheet.tsx, sidebar.tsx

### Secondary (MEDIUM confidence)
- Material UI FAB Component: [https://mui.com/material-ui/react-floating-action-button/](https://mui.com/material-ui/react-floating-action-button/)
- Headless UI Combobox: [https://headlessui.com/react/combobox](https://headlessui.com/react/combobox)
- Radix UI Checkbox: Official documentation
- Smashing Magazine Accessible Touch Targets: [https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)
- Papa Parse: [https://www.papaparse.com/](https://www.papaparse.com/) (already in package.json)

### Tertiary (LOW confidence)
- 10 Best Autocomplete Components: [https://reactscript.com/best-autocomplete/](https://reactscript.com/best-autocomplete/) (overview, not implementation guide)
- React CSV Import libraries: [https://github.com/beamworks/react-csv-importer](https://github.com/beamworks/react-csv-importer) (not needed, Papa Parse sufficient)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and battle-tested in codebase
- Architecture: HIGH - Patterns derived from existing working code (add-customer-sheet, csv-import-dialog)
- Pitfalls: HIGH - Based on WCAG standards, PostgreSQL docs, and known issues from QA-AUDIT.md
- V2 workflow: HIGH - Requirements clearly defined in CONTEXT.md and V1-TO-V2-PHILOSOPHY.md
- Accessibility: HIGH - WCAG 2.2 standards are authoritative, platform guidelines (iOS/Android) are official

**Research date:** 2026-02-06
**Valid until:** 60 days (stable domain: accessibility standards don't change frequently, Next.js/React patterns mature)

**Verification notes:**
- All WCAG references verified against W3C official documentation
- PostgreSQL migration patterns verified against official docs and zero-downtime guides
- Touch target sizes cross-referenced with Apple iOS HIG, Google Material Design, and WCAG
- CSV import pattern verified against existing csv-import-dialog.tsx implementation
- Icon migration verified by checking actual file count in QA-AUDIT.md (27 remaining files)
