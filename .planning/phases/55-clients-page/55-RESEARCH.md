# Phase 55: Clients Page - Research

**Researched:** 2026-02-27
**Domain:** Supabase migration + Next.js Server/Client Components + Sheet drawer pattern + Card grid UI
**Confidence:** HIGH

## Summary

Phase 55 adds a `/businesses` page where agency owners see all their client businesses as a card grid, open a detail drawer with full agency metadata, edit fields inline, and see competitive positioning. This requires:

1. A Supabase migration adding 10 agency metadata columns to the existing `businesses` table (no new tables, inherits existing RLS)
2. Data functions and a server action for reading/updating agency metadata
3. A responsive card grid page using the existing `InteractiveCard` component
4. A detail drawer following the exact same pattern as `CustomerDetailDrawer` (auto-save notes via debounce, inline editing)

The codebase has strong precedent for every pattern needed. The `CustomerDetailDrawer` is the primary reference for auto-save notes. The `KPIWidgets` grid is the reference for responsive card layout. The `switchBusiness` action shows how to call `revalidatePath` after mutation. No new libraries are needed.

**Primary recommendation:** Follow existing patterns exactly -- this is a composition phase, not an innovation phase. Every UI component and data access pattern already exists in the codebase.

## Standard Stack

### Core (already installed, no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | latest | Database reads/writes for agency metadata | Already used everywhere |
| `@radix-ui/react-dialog` | 1.1.15 | Sheet/drawer primitive (via `sheet.tsx`) | Already powers all drawers |
| `@phosphor-icons/react` | 2.1.10 | Icons for cards and drawer sections | Project standard |
| `zod` | 4.3.6 | Validation for agency metadata updates | Already used for all server actions |
| `date-fns` | 4.1.0 | Date formatting for start_date display | Already used in customer drawer |
| `sonner` | 2.0.7 | Toast notifications for save feedback | Already used everywhere |
| `class-variance-authority` | 0.7.1 | Card variants (already defined in `card.tsx`) | Design system standard |

### No New Dependencies Needed

This phase is entirely composition of existing components and patterns. Zero `npm install` required.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled card grid | CSS Grid via Tailwind | Tailwind grid is the codebase standard -- use it |
| React Hook Form for drawer | Direct state + server action | Drawer uses inline editing, not a full form -- RHF is overkill |
| Separate agency_metadata table | Columns on businesses table | Decision already made: columns on businesses, inherits RLS |

## Architecture Patterns

### Recommended Project Structure

```
app/(dashboard)/businesses/
  page.tsx                    # Server Component -- fetches all businesses, renders BusinessesClient
  loading.tsx                 # Skeleton grid (3 placeholder cards)

components/businesses/
  businesses-client.tsx       # Client Component -- manages drawer open/close state
  business-card.tsx           # Pure presentational card (InteractiveCard)
  business-detail-drawer.tsx  # Sheet drawer with edit mode + auto-save notes
  business-card-skeleton.tsx  # Skeleton for loading state

lib/data/businesses.ts        # getUserBusinessesWithMetadata(userId) -- read all businesses with agency columns
lib/actions/business-metadata.ts  # updateBusinessMetadata(), updateBusinessNotes() server actions
lib/validations/business-metadata.ts  # Zod schema for agency metadata fields
lib/types/database.ts         # Extend Business interface with 10 new agency columns
```

### Pattern 1: Server Component Page + Client Component Shell

**What:** Page fetches data in Server Component, passes to Client Component for interactivity
**When to use:** Always in this codebase -- the standard pattern
**Example (from `app/(dashboard)/dashboard/page.tsx`):**

```typescript
// Server Component -- page.tsx
export default async function BusinessesPage() {
  const business = await getActiveBusiness()
  if (!business) redirect('/onboarding')

  // Fetch all businesses owned by this user (with agency metadata)
  const businesses = await getUserBusinessesWithMetadata()

  return <BusinessesClient businesses={businesses} activeBusinessId={business.id} />
}
```

### Pattern 2: Auto-Save Notes with Debounce

**What:** Textarea auto-saves via server action on 500ms debounce, flushes on drawer close
**When to use:** Notes field in the detail drawer (CLIENT-06)
**Reference:** `components/customers/customer-detail-drawer.tsx` lines 51-97

```typescript
// Exact pattern from CustomerDetailDrawer -- reuse verbatim
const [notes, setNotes] = useState('')
const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
const notesRef = useRef('')
const initialNotesRef = useRef('')

// Sync notes when business changes
useEffect(() => {
  if (business) {
    const initial = business.agency_notes || ''
    setNotes(initial)
    notesRef.current = initial
    initialNotesRef.current = initial
  }
}, [business])

// Keep notesRef in sync
notesRef.current = notes

// Flush pending on drawer close
useEffect(() => {
  if (!open && business && timeoutRef.current) {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = undefined
    if (notesRef.current !== initialNotesRef.current) {
      updateBusinessNotes(business.id, notesRef.current)
    }
  }
}, [open, business])

const handleNotesChange = (value: string) => {
  setNotes(value)
  if (timeoutRef.current) clearTimeout(timeoutRef.current)
  if (business) {
    timeoutRef.current = setTimeout(() => {
      updateBusinessNotes(business.id, value)
      initialNotesRef.current = value
    }, 500)
  }
}
```

### Pattern 3: InteractiveCard Grid

**What:** Responsive card grid using `InteractiveCard` with hover accents
**When to use:** The /businesses card grid (CLIENT-01, CLIENT-02)
**Reference:** `components/dashboard/kpi-widgets.tsx` lines 56-119

```typescript
// Responsive grid -- 1 col mobile, 2 col tablet, 3 col desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {businesses.map((biz) => (
    <InteractiveCard
      key={biz.id}
      hoverAccent="amber"
      className="p-6"
      onClick={() => openDrawer(biz)}
    >
      {/* Card content */}
    </InteractiveCard>
  ))}
</div>
```

### Pattern 4: Inline Edit Mode in Drawer

**What:** Toggle between view and edit mode within a Sheet drawer
**When to use:** Editing agency metadata fields (CLIENT-05)
**Approach:** Single "Edit" button toggles `isEditing` state. In edit mode, display values become Input/Select fields. "Save" button calls server action, exits edit mode.

```typescript
const [isEditing, setIsEditing] = useState(false)
const [formData, setFormData] = useState<AgencyMetadata>({})

// On save: call server action, update local state, exit edit mode
async function handleSave() {
  const result = await updateBusinessMetadata(business.id, formData)
  if (result.success) {
    toast.success('Changes saved')
    setIsEditing(false)
  } else {
    toast.error(result.error || 'Failed to save')
  }
}
```

### Anti-Patterns to Avoid

- **Do NOT use `getActiveBusiness()` to scope the businesses query.** The /businesses page shows ALL businesses owned by the user, not just the active one. Use `getUserBusinessesWithMetadata()` which queries by `user_id` directly.
- **Do NOT use `.single()` for fetching all businesses.** Use `.select()` which returns an array. `.single()` would throw PGRST116 on multiple rows.
- **Do NOT create a separate route group for /businesses.** It lives under `(dashboard)` like all other pages, inheriting the AppShell layout with sidebar and bottom nav.
- **Do NOT add /businesses to the sidebar navigation.** The roadmap does not specify this. Phase 56 adds "Add Business" button on the page itself. Access is via direct URL or a future link from the business switcher.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drawer/sheet UI | Custom modal/overlay | `Sheet` from `components/ui/sheet.tsx` | Already powers all drawers, has SheetHeader/Body/Footer, proper focus trap, animations |
| Card hover effects | Custom CSS transitions | `InteractiveCard` from `card.tsx` | Has hoverAccent variants (amber/green/blue), arrow affordance, proper transitions |
| Auto-save debounce | Custom debounce hook | Copy pattern from `customer-detail-drawer.tsx` | Battle-tested: handles drawer close flush, ref sync, initial value tracking |
| Form validation | Manual if/else checks | Zod schema + `.safeParse()` | Every server action in the codebase uses this pattern |
| Toast notifications | Custom notification system | `toast()` from `sonner` | Already used everywhere, consistent UX |
| Skeleton loading | Spinner/loading text | `Skeleton` component + `loading.tsx` | Codebase standard, `animate-pulse-soft` animation |
| Date formatting | Manual string manipulation | `date-fns` `format()` | Already imported in customer detail drawer |

## Common Pitfalls

### Pitfall 1: Migration Column Default Values

**What goes wrong:** Adding NOT NULL columns to a table that already has rows fails if no DEFAULT is provided.
**Why it happens:** Existing businesses rows have no value for new agency metadata columns.
**How to avoid:** All 10 new columns must be NULLABLE (no NOT NULL constraint) since existing businesses won't have this data. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ... DEFAULT NULL`.
**Warning signs:** Migration fails on `supabase db push` with "cannot add NOT NULL column without default."

### Pitfall 2: Business Type vs Business Interface

**What goes wrong:** The TypeScript `Business` interface in `lib/types/database.ts` must be extended with all 10 new columns, or Supabase `select('*')` will return data the type doesn't expect.
**Why it happens:** Supabase returns ALL columns on `select('*')` but TypeScript won't know about them unless the interface is updated.
**How to avoid:** Update the `Business` interface in `lib/types/database.ts` immediately after writing the migration. All new fields should be typed as `X | null` since they're nullable.
**Warning signs:** TypeScript errors on property access, or silent `undefined` values where data exists.

### Pitfall 3: RLS Already Covers New Columns

**What goes wrong:** Developer creates redundant RLS policies for the new columns.
**Why it happens:** Assumption that new columns need new policies.
**How to avoid:** RLS policies on the `businesses` table already cover ALL columns. `"Users view own businesses"` policy uses `USING ((SELECT auth.uid()) = user_id)` which applies to every column including newly added ones. **No new RLS policies needed.**
**Warning signs:** Duplicate policy errors, unnecessary migration complexity.

### Pitfall 4: Querying All Businesses vs Active Business

**What goes wrong:** Using `getActiveBusiness()` to show the card grid, which returns only ONE business.
**Why it happens:** Muscle memory from other pages that always use the active business pattern.
**How to avoid:** The /businesses page needs a DIFFERENT data function: `getUserBusinessesWithMetadata()` that returns ALL businesses for the authenticated user. This is similar to `getUserBusinesses()` in `active-business.ts` but selects more columns.
**Warning signs:** Only one card shows on the page even when user has multiple businesses.

### Pitfall 5: Competitive Gap Calculation

**What goes wrong:** Storing `reviews_gained` in the database, creating stale data.
**Why it happens:** Desire to avoid computation.
**How to avoid:** `reviews_gained` = `review_count_current - review_count_start` -- computed at READ time, never stored. The competitive gap = `review_count_current - competitor_review_count` -- also computed at read time. Both are simple arithmetic on existing columns.
**Warning signs:** Stale numbers that don't update when underlying values change.

### Pitfall 6: Drawer Width on Mobile

**What goes wrong:** Drawer content overflows or is too narrow on mobile.
**Why it happens:** Default Sheet width is `w-3/4 sm:max-w-sm` (384px desktop) which may be too narrow for side-by-side competitive analysis.
**How to avoid:** Use `sm:max-w-lg` (512px) for the detail drawer, matching the customer detail drawer pattern at line 133 of `customer-detail-drawer.tsx`.
**Warning signs:** Content clipping, horizontal scroll in drawer.

## Code Examples

### Migration: Add 10 Agency Metadata Columns

```sql
-- Source: Follows pattern from 20260225072556_add_custom_service_names.sql
-- All columns nullable since existing businesses won't have agency data

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS google_rating_start NUMERIC(2,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_rating_current NUMERIC(2,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_count_start INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_count_current INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gbp_access BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS competitor_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS competitor_review_count INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS agency_notes TEXT DEFAULT NULL;

-- Comments for documentation
COMMENT ON COLUMN businesses.google_rating_start IS 'Google rating when client started (e.g., 4.2)';
COMMENT ON COLUMN businesses.google_rating_current IS 'Google rating currently (e.g., 4.6)';
COMMENT ON COLUMN businesses.review_count_start IS 'Total Google reviews when client started';
COMMENT ON COLUMN businesses.review_count_current IS 'Total Google reviews currently';
COMMENT ON COLUMN businesses.monthly_fee IS 'Monthly agency fee in dollars';
COMMENT ON COLUMN businesses.start_date IS 'Date client started with agency';
COMMENT ON COLUMN businesses.gbp_access IS 'Whether agency has Google Business Profile access';
COMMENT ON COLUMN businesses.competitor_name IS 'Primary competitor business name';
COMMENT ON COLUMN businesses.competitor_review_count IS 'Competitor total Google review count';
COMMENT ON COLUMN businesses.agency_notes IS 'Private agency notes about this client';
```

### TypeScript Interface Extension

```typescript
// Source: lib/types/database.ts -- add to existing Business interface
export interface Business {
  // ... existing fields ...

  // Agency metadata (all nullable -- only populated for agency-managed businesses)
  google_rating_start: number | null
  google_rating_current: number | null
  review_count_start: number | null
  review_count_current: number | null
  monthly_fee: number | null
  start_date: string | null         // DATE stored as ISO string
  gbp_access: boolean | null
  competitor_name: string | null
  competitor_review_count: number | null
  agency_notes: string | null
}
```

### Data Function: Get All Businesses with Metadata

```typescript
// Source: lib/data/businesses.ts
import { createClient } from '@/lib/supabase/server'
import type { Business } from '@/lib/types/database'

export async function getUserBusinessesWithMetadata(): Promise<Business[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return []

  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return data ?? []
}
```

### Server Action: Update Agency Metadata

```typescript
// Source: lib/actions/business-metadata.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBusinessMetadata(
  businessId: string,
  data: {
    google_rating_start?: number | null
    google_rating_current?: number | null
    review_count_start?: number | null
    review_count_current?: number | null
    monthly_fee?: number | null
    start_date?: string | null
    gbp_access?: boolean | null
    competitor_name?: string | null
    competitor_review_count?: number | null
  }
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  // RLS ensures user can only update their own businesses
  const { error } = await supabase
    .from('businesses')
    .update(data)
    .eq('id', businessId)

  if (error) return { error: error.message }

  revalidatePath('/businesses')
  return { success: true }
}

export async function updateBusinessNotes(
  businessId: string,
  notes: string
): Promise<{ error?: string; success?: boolean }> {
  // Follow updateCustomerNotes pattern from lib/actions/customer.ts
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  if (typeof notes !== 'string' || notes.length > 10000) {
    return { error: 'Notes too long' }
  }

  const { error } = await supabase
    .from('businesses')
    .update({ agency_notes: notes })
    .eq('id', businessId)

  if (error) return { error: error.message }
  // No revalidatePath -- notes auto-save is fire-and-forget
  return { success: true }
}
```

### Competitive Gap Visual Indicator (Card)

```typescript
// Computed values for the card
const reviewsGained = (biz.review_count_current ?? 0) - (biz.review_count_start ?? 0)
const competitiveGap = (biz.review_count_current ?? 0) - (biz.competitor_review_count ?? 0)

// Visual indicator: green if ahead, red if behind, muted if no data
<div className={cn(
  "text-sm font-medium",
  competitiveGap > 0 ? "text-success" : competitiveGap < 0 ? "text-destructive" : "text-muted-foreground"
)}>
  {competitiveGap > 0 ? `+${competitiveGap} ahead` : competitiveGap < 0 ? `${Math.abs(competitiveGap)} behind` : 'No data'}
</div>
```

### Zod Validation for Metadata

```typescript
// Source: lib/validations/business-metadata.ts
import { z } from 'zod'

export const businessMetadataSchema = z.object({
  google_rating_start: z.number().min(1).max(5).step(0.1).nullable().optional(),
  google_rating_current: z.number().min(1).max(5).step(0.1).nullable().optional(),
  review_count_start: z.number().int().min(0).nullable().optional(),
  review_count_current: z.number().int().min(0).nullable().optional(),
  monthly_fee: z.number().min(0).max(99999.99).nullable().optional(),
  start_date: z.string().nullable().optional(),  // ISO date string
  gbp_access: z.boolean().nullable().optional(),
  competitor_name: z.string().max(200).nullable().optional(),
  competitor_review_count: z.number().int().min(0).nullable().optional(),
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate agency_metadata table | Columns on existing businesses table | Decided in v3.0 roadmap | No new RLS, no joins, simpler queries |
| Store reviews_gained | Compute at read time | v3.0 design decision | Always fresh, no sync issues |
| Full form with submit button | Inline edit toggle + auto-save notes | Already in codebase (customer drawer) | Better UX, less friction |
| URL-based business scoping | Cookie-based active business | Phase 52 | No URL restructuring, simpler routing |

**Key design decisions already made (do not revisit):**
- 10 columns on `businesses` table, not a new table
- `reviews_gained` computed, never stored
- Notes auto-save with debounce (same pattern as customer drawer)
- No new navigation item -- /businesses is accessed directly
- No Google API integration -- all values manually entered by agency owner

## Open Questions

1. **Should /businesses be added to sidebar navigation?**
   - What we know: The roadmap does not mention adding it to nav. Phase 56 adds "Add Business" button on the page itself. The page is for agency owners who manage multiple businesses.
   - What's unclear: How do users discover this page? Via the business switcher dropdown? Direct URL only?
   - Recommendation: Add a "Manage Businesses" link at the bottom of the BusinessSwitcher dropdown (only shown when `businesses.length > 1`). This is low-effort and provides natural discovery. Do NOT add to main sidebar nav -- it's not a daily-use page.

2. **What service type to show on the card (CLIENT-02)?**
   - What we know: `service_types_enabled` is an array of enabled types (e.g., `['hvac', 'plumbing']`). The requirement says "service type" singular.
   - What's unclear: Should we show the first enabled type? A comma-joined list? The "primary" type?
   - Recommendation: Show the first enabled service type as a Badge, with a "+N" indicator if multiple types are enabled. e.g., "HVAC +2" or just "HVAC". This keeps the card compact.

3. **Column type for ratings: NUMERIC(2,1) vs REAL?**
   - What we know: Google ratings are 1.0-5.0 with one decimal place (e.g., 4.3). NUMERIC(2,1) enforces exact precision. REAL is floating point.
   - Recommendation: Use `NUMERIC(2,1)` for exact decimal representation. Google ratings are always X.X format. This avoids floating point display issues (e.g., 4.299999 instead of 4.3).

## Sources

### Primary (HIGH confidence)
- `components/customers/customer-detail-drawer.tsx` -- Auto-save notes pattern (500ms debounce, flush on close)
- `components/ui/card.tsx` -- InteractiveCard with hoverAccent variants
- `components/providers/business-settings-provider.tsx` -- BusinessSettingsProvider with businesses[] array
- `lib/data/active-business.ts` -- getUserBusinesses() and getActiveBusiness() patterns
- `lib/actions/active-business.ts` -- switchBusiness() server action pattern
- `lib/types/database.ts` -- Business interface (to extend)
- `supabase/migrations/00002_create_business.sql` -- Businesses table creation + RLS policies
- `supabase/migrations/20260225072556_add_custom_service_names.sql` -- Column addition migration pattern
- `components/dashboard/kpi-widgets.tsx` -- Responsive card grid pattern
- `app/(dashboard)/layout.tsx` -- Dashboard layout with BusinessSettingsProvider
- `components/ui/sheet.tsx` -- Sheet component with SheetHeader/Body/Footer
- `.planning/REQUIREMENTS.md` -- CLIENT-01 through CLIENT-08 requirement definitions
- `.planning/ROADMAP.md` -- Phase 55 definition with 3 plan structure

### Secondary (MEDIUM confidence)
- `.planning/phases/54-business-switcher-ui/54-RESEARCH.md` -- Phase 54 research confirming createAdditionalBusiness path exists

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies, all patterns exist in codebase
- Architecture: HIGH -- Follows existing page/component/data patterns exactly
- Migration: HIGH -- Simple ALTER TABLE, nullable columns, follows existing migration pattern
- Pitfalls: HIGH -- Based on direct codebase analysis of similar past work
- UI patterns: HIGH -- Direct reference implementations exist (customer drawer, KPI grid)

**Research date:** 2026-02-27
**Valid until:** Indefinite (all findings based on existing codebase patterns, no external dependencies)
