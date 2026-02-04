# Phase 22: Jobs CRUD & Service Types - Research

**Researched:** 2026-02-03
**Domain:** Jobs Management, Service Type Taxonomy, Postgres Schema Design
**Confidence:** HIGH

## Summary

This research investigates how to implement Jobs CRUD with service types for the AvisLoop Review SaaS. The phase adds a jobs table that links customers to completed service work, enabling service-specific campaign targeting and analytics.

The codebase has well-established patterns for CRUD operations (customers, send_logs), RLS policies (business-scoped via subquery), drawer components (CustomerDetailDrawer, RequestDetailDrawer), and server actions. The jobs feature follows these patterns exactly with minimal new dependencies.

Key architectural decisions:
1. **Service types as TEXT with CHECK constraint** - Simple, performant, no lookup table complexity
2. **Default timing stored in business JSONB column** - Avoids separate table, easily extensible
3. **Customer selector reuses existing autocomplete pattern** from quick-send-tab.tsx
4. **Campaign enrollment deferred to Phase 24** - Jobs just set `completed_at` timestamp

**Primary recommendation:** Follow existing customers/send_logs patterns exactly. Jobs table with TEXT service_type + CHECK constraint, business-scoped RLS, and timing defaults in businesses.service_type_timing JSONB column.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase | latest | Database, RLS, Auth | Already in use for all CRUD |
| Zod | ^4.3.6 | Schema validation | Already used in lib/validations |
| TanStack Table | ^8.21.3 | Data table | Already used in customers, history |
| React Hook Form | ^7.71.1 | Form management | Already in use for forms |
| date-fns | ^4.1.0 | Date formatting | Already used throughout |
| Phosphor Icons | ^2.1.10 | Icons | Already the icon library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Radix UI Sheet | ^1.1.15 | Drawer/sheet component | Job detail drawer |
| Sonner | ^2.0.7 | Toast notifications | CRUD feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TEXT with CHECK | Separate lookup table | Lookup adds complexity for 8 fixed values |
| JSONB timing in business | Separate timing_defaults table | Over-engineering for 8 key-value pairs |
| Custom combobox | shadcn Command | Existing autocomplete pattern works well |

**Installation:**
```bash
# No new dependencies needed - all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/(dashboard)/
  jobs/
    page.tsx          # Server component, fetches jobs
    loading.tsx       # Loading skeleton
components/
  jobs/
    jobs-client.tsx       # Client wrapper with state
    job-columns.tsx       # TanStack Table column defs
    job-table.tsx         # DataTable component
    job-filters.tsx       # Status/service type filters
    add-job-sheet.tsx     # Add job form in Sheet
    edit-job-sheet.tsx    # Edit job form in Sheet
    job-detail-drawer.tsx # View job details
    customer-selector.tsx # Searchable customer dropdown
    empty-state.tsx       # No jobs empty state
lib/
  actions/
    job.ts               # Server actions for CRUD
  data/
    jobs.ts              # Data fetching functions
  validations/
    job.ts               # Zod schemas
  types/
    database.ts          # Add Job interface
supabase/migrations/
  YYYYMMDD_create_jobs.sql
  YYYYMMDD_add_service_type_timing.sql
```

### Pattern 1: Jobs Table Schema
**What:** Jobs table with service type, status, customer link, and completion timestamp
**When to use:** Core data model for job tracking

```sql
-- Source: Following existing customers table pattern
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT jobs_service_type_valid CHECK (
    service_type IN ('hvac', 'plumbing', 'electrical', 'cleaning', 'roofing', 'painting', 'handyman', 'other')
  ),
  CONSTRAINT jobs_status_valid CHECK (
    status IN ('completed', 'do_not_send')
  )
);
```

### Pattern 2: RLS Policies (Business-Scoped)
**What:** Row-level security following existing pattern
**When to use:** Every jobs query

```sql
-- Source: Identical pattern from customers migration
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users insert own jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users update own jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())))
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users delete own jobs"
ON public.jobs FOR DELETE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));
```

### Pattern 3: Server Action Pattern
**What:** Server actions following existing customer.ts pattern
**When to use:** All CRUD operations

```typescript
// Source: Following lib/actions/customer.ts pattern
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { jobSchema } from '@/lib/validations/job'

export type JobActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  data?: { id: string }
}

export async function createJob(
  _prevState: JobActionState | null,
  formData: FormData
): Promise<JobActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to create jobs' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { error: 'Please create a business profile first' }
  }

  const parsed = jobSchema.safeParse({
    customerId: formData.get('customerId'),
    serviceType: formData.get('serviceType'),
    status: formData.get('status') || 'completed',
    notes: formData.get('notes') || '',
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { customerId, serviceType, status, notes } = parsed.data

  const { data: newJob, error } = await supabase
    .from('jobs')
    .insert({
      business_id: business.id,
      customer_id: customerId,
      service_type: serviceType,
      status,
      notes: notes || null,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')
  return { success: true, data: { id: newJob.id } }
}
```

### Pattern 4: Customer Selector Component
**What:** Searchable customer dropdown following quick-send-tab.tsx autocomplete
**When to use:** Job creation/edit forms

```typescript
// Source: Adapted from components/send/quick-send-tab.tsx
'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import type { Customer } from '@/lib/types/database'

interface CustomerSelectorProps {
  customers: Customer[]
  value: string | null
  onChange: (customerId: string | null) => void
}

export function CustomerSelector({ customers, value, onChange }: CustomerSelectorProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const selectedCustomer = useMemo(() =>
    customers.find(c => c.id === value) || null
  , [customers, value])

  const suggestions = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return []
    const q = query.toLowerCase().trim()
    return customers
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      )
      .slice(0, 6)
  }, [query, customers])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (customer: Customer) => {
    onChange(customer.id)
    setQuery('')
    setShowSuggestions(false)
  }

  // ... keyboard navigation same as quick-send-tab.tsx
}
```

### Pattern 5: Service Type Timing Defaults
**What:** Store default send timing per service type in business settings
**When to use:** Campaign creation auto-fills timing

```sql
-- Add to businesses table
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS service_types_enabled TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_type_timing JSONB DEFAULT '{
    "hvac": 24,
    "plumbing": 48,
    "electrical": 24,
    "cleaning": 4,
    "roofing": 72,
    "painting": 48,
    "handyman": 24,
    "other": 24
  }'::jsonb;
```

### Anti-Patterns to Avoid
- **Separate service_types lookup table:** Over-engineering for 8 fixed values. TEXT with CHECK is simpler.
- **Storing timing in jobs table:** Timing belongs on campaign, not job. Job just records completion.
- **Complex status state machine:** Keep it simple - 'completed' or 'do_not_send'. No in-progress states for v2.0.
- **Database triggers for campaign enrollment:** App-layer logic is more testable and controllable.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Searchable dropdown | Custom from scratch | Adapt quick-send-tab.tsx autocomplete | Already handles debounce, keyboard nav, outside click |
| Data table | Manual table | TanStack Table + existing patterns | Column defs, sorting, filtering, selection |
| Form validation | Manual checks | Zod schemas | Type inference, error messages, server validation |
| Date formatting | Manual string concat | date-fns format() | Already handles edge cases, localization |
| Toast notifications | Custom alerts | Sonner toast() | Already styled, positioned, animated |
| Drawer/sheet UI | Custom modal | Radix Sheet | Accessibility, animations, mobile handling |

**Key insight:** The codebase has mature patterns for all UI needs. Copy customer-columns.tsx, customer-detail-drawer.tsx, and quick-send-tab.tsx patterns rather than inventing new approaches.

## Common Pitfalls

### Pitfall 1: Forgetting RLS on New Table
**What goes wrong:** Jobs created but queries return empty arrays
**Why it happens:** Table created without RLS enabled or policies added
**How to avoid:** Migration checklist - enable RLS, add 4 policies (SELECT, INSERT, UPDATE, DELETE)
**Warning signs:** "Created successfully" but table shows no data

### Pitfall 2: Inconsistent Service Type Casing
**What goes wrong:** 'HVAC' vs 'hvac' vs 'Hvac' causes filter failures
**Why it happens:** Form submits different cases than CHECK constraint expects
**How to avoid:** Lowercase in CHECK constraint, transform in Zod schema: `.toLowerCase()`
**Warning signs:** Constraint violation errors on insert

### Pitfall 3: Customer Selector Performance
**What goes wrong:** Slow/laggy search with 200+ customers
**Why it happens:** Filtering on every keystroke without debounce
**How to avoid:** Use existing pattern with 2-char minimum before search, limit results to 6
**Warning signs:** UI freeze on typing

### Pitfall 4: Missing Foreign Key Validation
**What goes wrong:** Job created with customer_id from different business
**Why it happens:** RLS checks business_id on jobs, not that customer belongs to same business
**How to avoid:** Server action validates customer belongs to user's business before insert
**Warning signs:** Jobs appear with wrong customer names (cross-tenant data leak)

### Pitfall 5: Completed_at Not Set on Status Change
**What goes wrong:** Campaign enrollment logic can't find completion timestamp
**Why it happens:** Update action changes status but forgets to set completed_at
**How to avoid:** Server action always sets `completed_at: status === 'completed' ? new Date().toISOString() : null`
**Warning signs:** Jobs marked completed have null completed_at

## Code Examples

Verified patterns from existing codebase:

### Jobs Zod Schema
```typescript
// Source: Following lib/validations/customer.ts pattern
import { z } from 'zod'

export const SERVICE_TYPES = [
  'hvac', 'plumbing', 'electrical', 'cleaning',
  'roofing', 'painting', 'handyman', 'other'
] as const

export const JOB_STATUSES = ['completed', 'do_not_send'] as const

export const jobSchema = z.object({
  customerId: z
    .string()
    .uuid('Please select a customer'),
  serviceType: z
    .enum(SERVICE_TYPES, { errorMap: () => ({ message: 'Please select a service type' }) }),
  status: z
    .enum(JOB_STATUSES)
    .default('completed'),
  notes: z
    .string()
    .max(1000, 'Notes must be under 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type JobInput = z.infer<typeof jobSchema>
export type ServiceType = typeof SERVICE_TYPES[number]
export type JobStatus = typeof JOB_STATUSES[number]
```

### Job Type Definition
```typescript
// Source: Following lib/types/database.ts pattern
export interface Job {
  id: string
  business_id: string
  customer_id: string
  service_type: 'hvac' | 'plumbing' | 'electrical' | 'cleaning' | 'roofing' | 'painting' | 'handyman' | 'other'
  status: 'completed' | 'do_not_send'
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface JobWithCustomer extends Job {
  customers: Pick<Customer, 'id' | 'name' | 'email' | 'phone'>
}

export type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at'>
export type JobUpdate = Partial<Omit<Job, 'id' | 'business_id' | 'created_at' | 'updated_at'>>
```

### Get Jobs with Customer Join
```typescript
// Source: Following lib/data/send-logs.ts pattern
export async function getJobs(options?: {
  limit?: number
  offset?: number
  serviceType?: string
  status?: string
}): Promise<{ jobs: JobWithCustomer[]; total: number }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { jobs: [], total: 0 }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { jobs: [], total: 0 }
  }

  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  let query = supabase
    .from('jobs')
    .select('*, customers!inner(id, name, email, phone)', { count: 'exact' })
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (options?.serviceType) {
    query = query.eq('service_type', options.serviceType)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching jobs:', error)
    return { jobs: [], total: 0 }
  }

  return {
    jobs: data as JobWithCustomer[],
    total: count || 0,
  }
}
```

### Jobs Page Server Component
```typescript
// Source: Following app/(dashboard)/customers/page.tsx pattern
import { Suspense } from 'react'
import { getJobs } from '@/lib/data/jobs'
import { getCustomers } from '@/lib/actions/customer'
import { JobsClient } from '@/components/jobs/jobs-client'

export const metadata = {
  title: 'Jobs',
  description: 'Manage your service jobs',
}

async function JobsContent() {
  const [{ jobs }, { customers }] = await Promise.all([
    getJobs(),
    getCustomers({ limit: 200 }),
  ])
  return <JobsClient initialJobs={jobs} customers={customers} />
}

export default function JobsPage() {
  return (
    <div className="container py-6">
      <Suspense fallback={<JobsLoadingSkeleton />}>
        <JobsContent />
      </Suspense>
    </div>
  )
}
```

### Service Type Display Labels
```typescript
// Service type label mapping for UI display
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  cleaning: 'Cleaning',
  roofing: 'Roofing',
  painting: 'Painting',
  handyman: 'Handyman',
  other: 'Other',
}

export const DEFAULT_TIMING_HOURS: Record<ServiceType, number> = {
  hvac: 24,
  plumbing: 48,
  electrical: 24,
  cleaning: 4,
  roofing: 72,
  painting: 48,
  handyman: 24,
  other: 24,
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Enum types in Postgres | TEXT with CHECK constraint | Best practice | Easier migrations, no enum ALTER complexity |
| Separate config tables | JSONB columns | Supabase pattern | Simpler queries, no joins for config |
| Complex state machines | Simple status fields | v2.0 decision | Faster MVP, expand later |

**Deprecated/outdated:**
- None for this phase - using established patterns

## Open Questions

Things that couldn't be fully resolved:

1. **Campaign enrollment trigger timing**
   - What we know: Job completion (status -> 'completed') should trigger campaign enrollment
   - What's unclear: Is this Phase 22 (set completed_at) or Phase 24 (campaign logic)?
   - Recommendation: Phase 22 only sets completed_at. Phase 24 adds campaign enrollment logic.

2. **Analytics query complexity**
   - What we know: Need service type breakdown of response/review rates
   - What's unclear: How to join jobs -> send_logs for rate calculation without job_id on send_logs
   - Recommendation: Phase 22 adds jobs. Phase 24 adds job_id FK to send_logs or campaigns table.

3. **Onboarding service type selection UI**
   - What we know: SVCT-01 requires service selection during onboarding
   - What's unclear: Add step 3 to onboarding wizard or separate settings flow?
   - Recommendation: Add as optional step in onboarding, also editable in settings.

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns: supabase/migrations/*.sql, lib/actions/customer.ts, components/customers/*
- Supabase RLS documentation verified against existing migration patterns

### Secondary (MEDIUM confidence)
- TanStack Table documentation (existing usage confirms patterns)
- Zod v4 patterns (existing lib/validations/* confirms approach)

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using only existing libraries
- Architecture: HIGH - Following established codebase patterns exactly
- Pitfalls: HIGH - Based on real patterns in existing code

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (stable patterns, 30-day validity)
