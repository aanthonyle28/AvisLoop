# Phase 37: Jobs & Campaigns UX Fixes - Research

**Researched:** 2026-02-19
**Domain:** Next.js App Router + Supabase, internal codebase investigation
**Confidence:** HIGH (primary codebase reading, no external sources needed)

---

## Summary

Phase 37 is primarily a codebase bug-fix and UX-polish phase. The research consisted of tracing actual source files rather than external library investigation.

**Key finding — job creation bug:** The `createJob` server action in `lib/actions/job.ts` appears correct at the code level. The likely bug is in how `handleSubmit` in `add-job-sheet.tsx` populates `FormData`. The action receives a `FormData` object through `useActionState`, but `handleSubmit` manually appends fields via `formData.set()`. If `formData` arrives with an empty `serviceType` value (because `serviceType` state is `''` when the user hasn't selected one yet), Zod will reject it — but the submit button guard (`!serviceType`) should prevent this. The real bug may be that `formData.set('enrollInCampaign', ...)` is only called when `status === 'completed'`, so when `status === 'scheduled'`, `enrollInCampaign` is absent from formData — the action then falls back to the `null` check on line 65 of `job.ts`, which returns `true`. That logic appears safe. **Investigation suggests the bug may be in a different environment (missing RLS policy, Supabase permissions issue, or race condition in test data).** The code path reads correctly — the planner must test the actual creation flow and check Supabase error logs to confirm the root cause.

**Key finding — campaign save bug:** The `updateCampaign` action calls `supabase.rpc('replace_campaign_touches', ...)`. The RPC function exists in migration `20260206_replace_campaign_touches.sql` and is granted to `authenticated` users. However, the RPC has `SECURITY DEFINER` — it runs as the function owner (postgres), not the calling user. The RPC itself does not check campaign ownership. If the calling user's session is valid but the campaign_touches table has an RLS policy that conflicts, the RPC would silently fail or error. Additionally, the update action checks ownership by looking for `existing.business_id`, but does NOT re-verify that the user's `business.id` matches `existing.business_id`. This is a potential authorization gap. The more likely bug: the RPC is a separate Supabase call and if it fails, the action returns an error — but the campaign row was already updated. The form would show success for campaign fields but touches would revert. The planner should instrument the `updateCampaign` action with detailed logging to identify at which step it fails.

**Key finding — service filter:** The `job-filters.tsx` component hardcodes `SERVICE_TYPES` (all 8). The `getServiceTypeSettings()` function exists in `lib/data/business.ts` and returns `serviceTypesEnabled`. The Jobs page does not currently pass `serviceTypesEnabled` to `JobFilters`. The `ServiceTypeSelect` component already has an `enabledTypes` prop (currently unused in `AddJobSheet`). The fix requires: (1) fetch `serviceTypesEnabled` in `JobsPage` server component, (2) pass it to `JobsClient`, (3) pass it to `JobFilters` and `ServiceTypeSelect`.

**Key finding — campaign card & navigation:** `CampaignCard` renders as a `div` with no click handler on the outer container. The campaign name has a `Link` to `/campaigns/${id}`. The edit link is inside a `DropdownMenu`. To make the whole card clickable, the card wrapper needs an `onClick` that navigates, with `e.stopPropagation()` on the `Switch` and `DropdownMenu` controls. The existing `Sheet` component (`components/ui/sheet.tsx`) supports right-side panels — campaign edit could be moved into a Sheet instead of full-page navigation.

**Primary recommendation:** Fix bugs first (JC-03, JC-08), then service filter (JC-01), then form UX (JC-02, JC-09), then campaign card/navigation changes (JC-04, JC-05, JC-06, JC-07) as one batch.

---

## Standard Stack

No new libraries needed. All work uses existing stack.

### Core (Already Installed)
| Library | Version | Purpose | Used For |
|---------|---------|---------|----------|
| `next` | latest | App Router | Page routing, Server Actions |
| `@supabase/ssr` | latest | DB client | Server/client data access |
| `@tanstack/react-table` | ^8.21.3 | Table UI | Job table |
| `@radix-ui/react-dialog` | ^1.1.15 | Sheet/Dialog primitives | Campaign edit panel |
| `react-hook-form` | ^7.71.1 | Form state | Campaign form (already used) |
| `sonner` | ^2.0.7 | Toasts | Success/error feedback |
| `@phosphor-icons/react` | ^2.1.10 | Icons | All icons |

### No New Dependencies Required
All 9 requirements can be implemented with the existing stack. The campaign edit-as-panel uses the existing `Sheet` component already in use for `AddJobSheet`.

---

## Architecture Patterns

### Current File Structure (Relevant)
```
app/(dashboard)/
├── campaigns/
│   ├── page.tsx              # Campaign list + preset picker
│   ├── new/page.tsx          # New campaign full page
│   └── [id]/
│       ├── page.tsx          # Campaign detail full page
│       └── edit/page.tsx     # Campaign edit full page
├── jobs/
│   └── page.tsx              # Jobs page (server component)
components/
├── campaigns/
│   ├── campaign-card.tsx     # Card with Switch + DropdownMenu
│   ├── campaign-form.tsx     # react-hook-form form (used in edit page)
│   ├── campaign-list.tsx     # List of CampaignCards
│   ├── preset-picker.tsx     # Grid of 3 preset cards
│   └── touch-sequence-editor.tsx
├── jobs/
│   ├── add-job-sheet.tsx     # Sheet form, useActionState
│   ├── customer-autocomplete.tsx
│   ├── job-filters.tsx       # Hardcoded SERVICE_TYPES filter chips
│   ├── jobs-client.tsx       # Client wrapper with state
│   └── service-type-select.tsx  # Has enabledTypes prop (unused)
lib/
├── actions/
│   ├── campaign.ts           # createCampaign, updateCampaign (uses RPC)
│   └── job.ts                # createJob, updateJob, markJobComplete
├── data/
│   ├── business.ts           # getServiceTypeSettings() returns serviceTypesEnabled
│   └── campaign.ts           # getCampaigns, getCampaign, etc.
└── validations/
    ├── campaign.ts           # Zod schema with touches validation
    └── job.ts                # SERVICE_TYPES array, jobSchema
```

### Pattern: Server Component Data Fetching + Client Component State

The Jobs page uses this pattern:
```typescript
// Server component (app/(dashboard)/jobs/page.tsx)
async function JobsContent() {
  const [{ jobs }, { customers }] = await Promise.all([getJobs(), getCustomers()])
  return <JobsClient initialJobs={jobs} customers={customers} />
}

// Client component handles filter state
export function JobsClient({ initialJobs, customers }) {
  const [filters, setFilters] = useState(...)
  // Filtering is client-side on initialJobs
}
```

**For JC-01 (service filter scoping):** Add `serviceTypesEnabled` to this pattern:
```typescript
// Add to JobsContent:
const [{ jobs }, { customers }, serviceSettings] = await Promise.all([
  getJobs(), getCustomers(), getServiceTypeSettings()
])
// Pass: serviceTypesEnabled={serviceSettings?.serviceTypesEnabled || []}
```

### Pattern: useActionState for Server Actions

`AddJobSheet` uses React 19's `useActionState`:
```typescript
const [state, formAction, isPending] = useActionState<JobActionState | null, FormData>(
  createJob,
  null
)
```

The form uses `action={handleSubmit}` where `handleSubmit` appends values then calls `formAction(formData)`.

**Bug surface area:** The `handleSubmit` function receives a `FormData` built from the native form elements. Since the Status `<select>` is a native element (not Radix), its value IS in the FormData automatically. However, `serviceType` comes from a native `<select>` inside `ServiceTypeSelect` — its value IS in formData as `'serviceType'` field (from the `name` attribute if set, or not at all if no `name`). **Investigation needed:** Does `ServiceTypeSelect`'s `<select>` element have a `name` attribute? If not, `formData.get('serviceType')` returns `null` in the action, and `formData.set('serviceType', serviceType)` in `handleSubmit` should handle it — but only if `handleSubmit` runs.

Actually re-reading: `handleSubmit` is called as `action={handleSubmit}` on the `<form>`. This is React 19 form action pattern. React calls `handleSubmit(formData)` where formData is auto-collected from form fields. The function then manually sets additional values with `formData.set()`. This pattern is correct.

**Confirmed correct flow, but:**
- `ServiceTypeSelect` uses a raw `<select>` with no `name` attribute → it WON'T be in the auto-collected FormData
- `formData.set('serviceType', serviceType)` manually adds it → should work IF `serviceType` state is set
- `status` also uses a raw `<select>` with no `name` attribute → same situation, handled by `formData.set('status', status)`

The code looks self-consistent. The bug is likely environmental (Supabase error, RLS, or data state issue) rather than a code logic error.

### Pattern: Radix Dialog/Sheet for Panels

The existing `Sheet` component from `components/ui/sheet.tsx` is the correct primitive for JC-04 (campaign edit as panel). It supports `side="right"` and has an overlay. CampaignForm is currently used in a full-page context — it would move to a Sheet that is managed from the campaign list page.

---

## Bug Analysis

### JC-03: Job Creation Bug

**Files to investigate:**
- `components/jobs/add-job-sheet.tsx` — form submission
- `lib/actions/job.ts` — `createJob` server action
- `components/jobs/service-type-select.tsx` — native select with no `name`

**Suspected root causes (priority order):**

1. **ServiceTypeSelect missing `name` attribute (HIGH suspicion):**
   `ServiceTypeSelect` renders `<select value={value} onChange={...}>` with no `name` attribute. When React collects form data for `action={handleSubmit}`, this field is NOT collected. The `handleSubmit` compensates with `formData.set('serviceType', serviceType)`. If the state variable `serviceType` is correctly set, this works. But if the state is `''` (empty string), Zod validation fails with `z.enum(SERVICE_TYPES)` because `''` is not in the enum. The submit button has guard `disabled={... || !serviceType}` which should prevent this. This may not be the bug.

2. **Zod parse of `customerId` as UUID (MEDIUM suspicion):**
   `jobSchema.customerId` requires `z.string().uuid()`. If `finalCustomerId` is set from a newly-created customer (`newCustomer.id`), it should be a valid UUID. But if it arrives as `null` or an empty string, Zod rejects it with `fieldErrors`. The action returns `{ fieldErrors }` without `error` — but `AddJobSheet` only shows `toast.error(state.error)` for the top-level error, and shows `state?.fieldErrors?.customerId?.[0]` in the autocomplete component. Field errors should surface correctly.

3. **Missing customer validation for new inline customers (LOW suspicion):**
   After creating a new customer, the action re-validates by querying `customers` table with `eq('id', finalCustomerId).eq('business_id', business.id)`. If the customer creation succeeded, this should pass. No obvious bug here.

4. **Supabase RLS or environment issue (HIGH suspicion for "known bug"):**
   If the bug is reproducible and the code logic looks correct, check Supabase logs for the actual error. The `jobs` table insert at line 144 of `job.ts` calls `.select('id').single()`. If RLS prevents the insert, `error` will be non-null and returned to the form as `{ error: error.message }`. **The planner should identify the exact error message shown in the UI** before coding.

**Recommended investigation steps for planner:**
1. Trigger the bug, note exact toast error message
2. Check browser console for network errors
3. Check Supabase dashboard logs
4. Add `console.log` to `createJob` at each step to identify where it fails

### JC-08: Campaign Save Bug (Touch Sequences Not Persisting)

**Files to investigate:**
- `lib/actions/campaign.ts` — `updateCampaign` function
- `supabase/migrations/20260206_replace_campaign_touches.sql` — RPC definition
- `components/campaigns/campaign-form.tsx` — form submission

**The save flow:**
1. `CampaignForm.onSubmit` calls `updateCampaign(campaign.id, data)`
2. `updateCampaign` validates ownership (checks `existing.business_id` but does NOT verify it matches current user's business — this is a gap but not the bug)
3. Updates `campaigns` table row
4. Calls `supabase.rpc('replace_campaign_touches', { p_campaign_id, p_touches })`
5. If RPC fails, returns error

**The RPC function:**
```sql
CREATE OR REPLACE FUNCTION replace_campaign_touches(p_campaign_id UUID, p_touches JSONB)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER;
```

`SECURITY DEFINER` means it runs as the function owner. The RPC deletes and re-inserts touches. If the migration ran successfully in production, this should work.

**Suspected bug — `template_id` null handling:**
The RPC uses `NULLIF(touch_record->>'template_id', '')::UUID`. If `template_id` is JavaScript `null`, it serializes to JSON `null`, and `jsonb->>'key'` for a JSON null returns SQL NULL, not the string `'null'`. `NULLIF(NULL, '')` returns NULL, cast to UUID gives NULL. This is correct.

But: in `updateCampaign`, the touches are serialized as:
```typescript
const touchesJson = touches.map(touch => ({
  touch_number: touch.touch_number,
  channel: touch.channel,
  delay_hours: touch.delay_hours,
  template_id: touch.template_id || null,
}))
```

This is a JS object array — it's passed directly to `supabase.rpc()`. Supabase-js serializes this to JSON. If `template_id` is `null` in JS, it serializes as `null` in JSON. The RPC handles this correctly via `NULLIF(touch_record->>'template_id', '')::UUID`.

**More likely bug — campaign_touches RLS policy:**
The `SECURITY DEFINER` function runs as the DB owner and bypasses RLS. Touches SHOULD be replaced. If touches are NOT persisting, the bug could be:
1. The RPC isn't deployed to production (migration wasn't pushed)
2. The RPC call fails silently (unlikely — errors are returned)
3. There's a unique constraint violation on `(campaign_id, touch_number)` during insert if the DELETE didn't complete

**Planner action:** Trigger the save, check if the campaign fields (name, status) update but touches don't. Then check Supabase function logs for the RPC execution.

**Alternative root cause — form not registering touch changes:**
`CampaignForm` uses `react-hook-form` with `watch('touches')` and `setValue('touches', newTouches)`. `TouchSequenceEditor` receives `touches` and calls `onChange`. The `onChange` handler calls `setValue('touches', newTouches)`. If `setValue` isn't triggering re-registration, `handleSubmit` might submit stale `defaultValues` touches instead of edited ones.

**This is a HIGH probability cause.** React Hook Form's `watch('touches')` returns the current value, and `setValue` updates it. But if the `TouchSequenceEditor` receives `touches` as a prop from `watch()` and calls `onChange`, this creates a controlled pattern. This should work, but if `react-hook-form` isn't tracking the touches field as "dirty," the submitted data could be the default values.

**Verify:** After editing a touch, does the form mark as dirty? Check if `formState.isDirty` is true. If the touches array is an object reference that doesn't trigger dirty tracking, saves would submit original values.

---

## Feature Specifications

### JC-01: Service Filter Scoping

**Current behavior:** `job-filters.tsx` line 60 maps over `SERVICE_TYPES` (hardcoded all 8).

**Required change:**
1. `JobsPage` server component: add `getServiceTypeSettings()` call
2. Pass `serviceTypesEnabled: string[]` to `JobsClient`
3. `JobsClient` passes it to `JobFilters`
4. `JobFilters` receives `enabledServiceTypes?: string[]` prop, filters `SERVICE_TYPES` before rendering chips

**Data flow:**
```
JobsPage (server)
  → getServiceTypeSettings() → { serviceTypesEnabled: ['hvac', 'plumbing'] }
  → JobsClient (client, prop: enabledServiceTypes)
  → JobFilters (client, prop: enabledServiceTypes)
  → chip buttons: SERVICE_TYPES.filter(t => enabledServiceTypes.includes(t))
```

**Edge case:** If `serviceTypesEnabled` is empty (onboarding not complete), show all 8 types as fallback.

**Also apply to AddJobSheet:** `ServiceTypeSelect` already has `enabledTypes` prop. `JobsClient` should pass `enabledServiceTypes` to `AddJobSheet` → `ServiceTypeSelect`.

### JC-02: Smart Name/Email Field

**Current behavior:** `CustomerAutocomplete` accepts name OR email and searches both. In "create" mode, two separate fields (Name, Email) are shown.

**Required change:** The autocomplete input should detect if the user is typing an email (contains `@`) and:
- Change the label to show "Email" hint
- Change `type` to `email` when `@` detected (for mobile keyboard)
- OR: adjust placeholder/label dynamically

**Implementation approach:**
The `CustomerAutocomplete` component already searches by both name and email. The smart detection only applies to the display, not the search logic. In the autocomplete input:
```typescript
const isEmailInput = query.includes('@')
// Change placeholder/label dynamically
// type="email" when isEmailInput, type="text" otherwise
```

Note: Changing `type` on an input dynamically can cause it to lose focus in some browsers. Better approach: use `type="text"` always, but update placeholder and show a label indicator.

### JC-04: Campaign Edit as Panel

**Current behavior:** "Edit" link in `CampaignCard` DropdownMenu navigates to `/campaigns/${id}/edit` (full page).

**Required change:** Open a `Sheet` (right side panel) with `CampaignForm` inside it.

**Implementation:** The `CampaignCard` or `CampaignList` needs to manage a Sheet state:
```typescript
// In campaign-list.tsx or as a new CampaignListClient wrapper
const [editingId, setEditingId] = useState<string | null>(null)
```

`CampaignCard` needs to accept `onEdit` callback instead of navigating. `CampaignForm` needs `onSuccess` callback to close the sheet.

**The `CampaignForm` currently does `router.push('/campaigns')` on success** — this must be changed to call a callback instead (for the sheet pattern).

**Option A:** Keep full-page edit for `/campaigns/[id]/edit` but also add a quick-edit Sheet from the list. Use `?panel=edit` URL param to control sheet state.

**Option B:** Replace full-page edit entirely with the Sheet. The `/campaigns/[id]/edit` route either redirects or becomes unused.

**Recommendation:** Option A (safer, avoids breaking the existing edit page). Add `onEdit` prop to `CampaignCard`, manage `editingCampaignId` state in a new `CampaignListClient` wrapper that wraps `CampaignList`. Load campaign data on open.

### JC-05: Campaign Card Full-Click

**Current behavior:** `CampaignCard` is a `<div>` with only the name as a `<Link>`. Switch and DropdownMenu are interactive controls.

**Required change:** Make the entire card clickable to open campaign detail. Use `stopPropagation` on Switch and DropdownMenu trigger.

**Implementation:**
```typescript
// campaign-card.tsx wrapper becomes InteractiveCard or uses useRouter
<div
  className="... cursor-pointer"
  onClick={() => router.push(`/campaigns/${campaign.id}`)}
>
  // Switch handler:
  <div onClick={(e) => e.stopPropagation()}>
    <Switch ... />
  </div>
  // DropdownMenu trigger:
  <div onClick={(e) => e.stopPropagation()}>
    <DropdownMenu>...</DropdownMenu>
  </div>
</div>
```

Note: Remove the `<Link>` from just the name — the whole card is now the link target.

### JC-06: Back Button Hit Area

**Current behavior:** Both `/campaigns/[id]/page.tsx` and `/campaigns/[id]/edit/page.tsx` have a back link:
```tsx
<Link
  href="/campaigns"
  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
>
  <ArrowLeft className="h-4 w-4" />
  Back to campaigns
</Link>
```

The "oversized hit area" complaint: The `<Link>` is `flex items-center` which is inline-flex. The hit area should be approximately the text width. The complaint may refer to the link being inside a `<div>` that has `flex-1` which could stretch the clickable area horizontally.

In `campaign detail page`, the back link is inside:
```tsx
<div className="flex items-start justify-between">
  <div>
    <Link ...> ← this link's parent div has no width constraint
```

The `<div>` parent doesn't stretch the link, but if the Link itself has `flex items-center` without `w-fit`, it could span more than expected in some layouts.

**Fix:** Add `w-fit` to the link className, or ensure it's `inline-flex`. The current `flex items-center` on the link itself makes it a block-level flex container — change to `inline-flex items-center`.

### JC-07: Standard Preset Centered

**Current behavior:** `PresetPicker` renders a 3-column grid:
```typescript
<div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
```

When 3 presets exist, they fill all 3 columns correctly. The "Standard" preset is the middle card — it should naturally be centered.

**The actual issue:** The presets are ordered by name in `getCampaignPresets()` (order by name). The order may be: Conservative, Standard, Aggressive (alphabetical) which puts Standard in the middle — correct. But if only 2 presets exist or they're in wrong order, Standard might not be centered.

**Fix options:**
1. Sort presets in a fixed order (Conservative, Standard, Aggressive) rather than alphabetical
2. If presets are found by matching `preset.name.toLowerCase().includes(p.id)`, verify the matching works correctly
3. If grid has 3 items and all 3 are present, the "centering" issue may actually be about the EMPTY STATE preset picker which shows in a `bg-card p-6 text-center` wrapper — the inner grid might not be centered in that context

The preset picker in the empty state is:
```tsx
<div className="rounded-lg border bg-card p-6 text-center">
  <h2 ...>Get started with a campaign</h2>
  <p ...>Choose a preset...</p>
  <PresetPicker presets={presets} />  ← no mx-auto on the grid
</div>
```

The `text-center` on the parent doesn't center a grid. The grid would need `mx-auto` or `justify-center`.

**Fix:** Either `justify-items-center` on the grid when it has fewer than 3 items, or wrap in `<div className="flex justify-center"><PresetPicker .../></div>`.

### JC-09: Filter Visual Distinction

**Current behavior:** Both status chips and service type chips use identical styling:
```
bg-muted text-muted-foreground hover:bg-muted/80 (inactive)
bg-primary text-primary-foreground (active)
```

They are separated only by a `<div className="w-px bg-border" />` vertical separator.

**Required change:** Make them visually distinct. Options:
1. Use different chip shapes (rounded-full for status, rounded-md for service type)
2. Use different colors/backgrounds (e.g., service types use `bg-secondary` base)
3. Add group labels ("Status:" and "Service:") above each group
4. Use `outline` style for one group

**Recommendation:** Add small group labels and use `rounded-md` for service type vs `rounded-full` for status. This matches common filter UX patterns. Alternatively, put them on separate rows with labels.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Side panel for campaign edit | Custom drawer/modal | Existing `Sheet` component (`components/ui/sheet.tsx`) |
| Service type filter prop drilling | Context API | Simple prop threading (only 2 levels deep) |
| Campaign card navigation | Custom router wrapper | `useRouter()` from `next/navigation` |
| Touch sequence RPC | Manual DELETE + INSERT | Existing `replace_campaign_touches` RPC |

---

## Common Pitfalls

### Pitfall 1: Breaking CampaignForm router.push on Success

**What goes wrong:** `CampaignForm` currently calls `router.push('/campaigns')` on success. If the form is reused in a Sheet, this navigation closes the sheet AND navigates — causing a jarring UX.

**How to avoid:** Add an optional `onSuccess?: () => void` prop to `CampaignForm`. If provided, call it instead of `router.push`. The full-page edit route still calls the default navigation behavior.

**Code pattern:**
```typescript
// campaign-form.tsx
interface CampaignFormProps {
  campaign?: CampaignWithTouches
  templates: MessageTemplate[]
  onSuccess?: () => void  // NEW
}

// In onSubmit:
if (result.fieldErrors) { /* ... */ return }
toast.success(...)
if (onSuccess) {
  onSuccess()
} else {
  router.push('/campaigns')
}
```

### Pitfall 2: stopPropagation on Switch in CampaignCard

**What goes wrong:** Wrapping `Switch` in a `<div onClick={stopPropagation}>` works but Radix `Switch` may have its own event handling. Test that the toggle still works when the card has `onClick`.

**How to avoid:** Pass `onClick={e => e.stopPropagation()}` directly to the Switch wrapper div (not the Switch itself). Confirm `stopPropagation` is called before Radix's internal handlers.

### Pitfall 3: Stale `serviceTypesEnabled` Data

**What goes wrong:** `getServiceTypeSettings()` is a server component call. If the user changes service types in Settings, the Jobs page won't reflect the update until a hard refresh.

**How to avoid:** This is acceptable behavior for now — the page uses `revalidatePath('/jobs')` on job actions. The service type settings change triggers a settings page revalidation, but not jobs. Document as known limitation.

### Pitfall 4: Campaign Edit Sheet Data Loading

**What goes wrong:** Opening a campaign edit Sheet requires fetching the campaign data (including touches) and available templates. If done client-side, there's a loading flash. If done server-side, it's complex.

**How to avoid:** The campaign list page already has campaign data from `getCampaigns()`. Pass the campaign data directly to the Sheet. For templates, fetch on Sheet open using a client-side fetch or pass templates from the page (they're already loaded in the edit page route). Simplest approach: add templates to the campaigns page fetch.

### Pitfall 5: Smart Name/Email Field Losing Focus on `type` Change

**What goes wrong:** Dynamically changing `type="text"` to `type="email"` causes browsers to re-render the input, potentially losing focus and cursor position.

**How to avoid:** Keep `type="text"` always in the autocomplete input. Only change the placeholder or add a visual indicator when `@` is detected. Reserve `type="email"` for the static "Email" field in create-mode (not the autocomplete).

---

## Code Examples

### Example 1: Passing serviceTypesEnabled to JobsPage

```typescript
// app/(dashboard)/jobs/page.tsx
async function JobsContent({ defaultAddJobOpen }: { defaultAddJobOpen: boolean }) {
  const [{ jobs, total, businessId }, { customers }, serviceSettings] = await Promise.all([
    getJobs(),
    getCustomers({ limit: 200 }),
    getServiceTypeSettings(),  // Add this
  ])

  // ...

  return (
    <JobsClient
      initialJobs={jobs}
      totalJobs={total}
      customers={customers}
      campaignMap={campaignMap}
      defaultAddJobOpen={defaultAddJobOpen}
      enabledServiceTypes={serviceSettings?.serviceTypesEnabled || []}  // NEW
    />
  )
}
```

### Example 2: Filtering chips in JobFilters

```typescript
// job-filters.tsx - add prop
interface JobFiltersProps {
  filters: JobFiltersState
  onFiltersChange: (filters: JobFiltersState) => void
  enabledServiceTypes?: string[]  // NEW
}

// Filter before rendering:
const visibleServiceTypes = enabledServiceTypes && enabledServiceTypes.length > 0
  ? SERVICE_TYPES.filter(t => enabledServiceTypes.includes(t))
  : SERVICE_TYPES
```

### Example 3: Making CampaignCard fully clickable

```typescript
// campaign-card.tsx
'use client'
import { useRouter } from 'next/navigation'

export function CampaignCard({ campaign }: CampaignCardProps) {
  const router = useRouter()
  // ...

  return (
    <div
      className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => router.push(`/campaigns/${campaign.id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Remove the <Link> wrapper, just show the name */}
          <div className="flex items-center gap-3">
            <span className="font-medium truncate">{campaign.name}</span>
            {/* badges */}
          </div>
          {/* ... */}
        </div>

        <div
          className="flex items-center gap-3 shrink-0"
          onClick={(e) => e.stopPropagation()}  // Prevent card click
        >
          {/* Switch and DropdownMenu here */}
        </div>
      </div>
    </div>
  )
}
```

### Example 4: CampaignForm with onSuccess callback

```typescript
// campaign-form.tsx
interface CampaignFormProps {
  campaign?: CampaignWithTouches
  templates: MessageTemplate[]
  onSuccess?: () => void
}

// In onSubmit handler:
toast.success(isEditing ? 'Campaign updated' : 'Campaign created')
if (props.onSuccess) {
  props.onSuccess()
} else {
  router.push('/campaigns')
}
```

### Example 5: Smart email detection in CustomerAutocomplete

```typescript
// customer-autocomplete.tsx - in render
const isEmailQuery = query.includes('@')

<Input
  ref={inputRef}
  value={query}
  onChange={handleInputChange}
  // type stays 'text' always (avoids focus loss on type change)
  placeholder={isEmailQuery ? 'Search by email...' : 'Type customer name or email...'}
  aria-label={isEmailQuery ? 'Customer email search' : 'Customer name or email search'}
  // ...
/>
// Optional: show indicator
{isEmailQuery && (
  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
    Searching by email
  </span>
)}
```

### Example 6: Fixing Back Button to Inline-Flex

```typescript
// campaigns/[id]/page.tsx and campaigns/[id]/edit/page.tsx
<Link
  href="/campaigns"
  className="inline-flex items-center gap-1 mb-2 text-sm text-muted-foreground hover:text-foreground w-fit"
>
  <ArrowLeft className="h-4 w-4" />
  Back to campaigns
</Link>
```

### Example 7: Campaign Save Bug — Verification Code

Add to `updateCampaign` for debugging (remove after fix):
```typescript
console.log('[updateCampaign] touches to save:', JSON.stringify(touchesJson))
const { error: touchError } = await supabase.rpc('replace_campaign_touches', {
  p_campaign_id: campaignId,
  p_touches: touchesJson,
})
if (touchError) {
  console.error('[updateCampaign] RPC error:', touchError)
  return { error: `Failed to update touches: ${touchError.message}` }
}
console.log('[updateCampaign] touches saved successfully')
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Router navigation for edit | Full page `/campaigns/[id]/edit` | Phase 37 converts to Sheet panel |
| Manual form data | `useActionState` + React 19 form actions | Already in use for jobs |
| All service types in filter | All 8 hardcoded | Phase 37 scopes to `service_types_enabled` |

---

## Open Questions

1. **JC-03 (Job creation bug) — exact error message unknown**
   - What we know: A bug exists that prevents job creation
   - What's unclear: Whether it's a code bug, RLS policy, Supabase environment issue, or specific edge case
   - Recommendation: Planner must reproduce the bug and identify the exact error before coding the fix

2. **JC-08 (Campaign save bug) — root cause of touches not persisting**
   - What we know: Touch sequences don't save; `replace_campaign_touches` RPC exists
   - What's unclear: Whether the RPC fails (bad migration), react-hook-form dirty tracking doesn't work, or another cause
   - Recommendation: Add logging to `updateCampaign`, trigger a save, check both Supabase logs and browser network tab for RPC call/response

3. **JC-04 (Campaign edit as panel) — whether to keep full-page route**
   - What we know: Existing `/campaigns/[id]/edit` full-page route works
   - What's unclear: Should the panel replace it completely or coexist?
   - Recommendation: Keep the route (backward compatibility, deep linking) but default to panel from list. Panel can have "Open full page" escape hatch.

4. **JC-07 (Standard preset centered) — which context is broken**
   - What we know: 3-column grid, 3 presets
   - What's unclear: Is the centering issue in the empty state (no campaigns) or the "add more campaigns" section? Is it a visual alignment issue with the grid items or the grid in its container?
   - Recommendation: Planner should visually inspect both contexts (empty state and compact preset picker)

---

## Sources

### Primary (HIGH confidence)
- Direct codebase reading — all findings verified from source files
- `components/jobs/add-job-sheet.tsx` — form structure
- `lib/actions/job.ts` — createJob server action
- `lib/actions/campaign.ts` — updateCampaign with RPC call
- `supabase/migrations/20260206_replace_campaign_touches.sql` — RPC definition
- `components/campaigns/campaign-card.tsx` — card clickability structure
- `components/campaigns/preset-picker.tsx` — preset grid layout
- `components/jobs/job-filters.tsx` — hardcoded SERVICE_TYPES
- `components/jobs/service-type-select.tsx` — enabledTypes prop exists but unused
- `lib/data/business.ts` — getServiceTypeSettings() returns serviceTypesEnabled
- `app/(dashboard)/jobs/page.tsx` — server component data fetching
- `components/ui/sheet.tsx` — Sheet component API
- `components/ui/card.tsx` — InteractiveCard for reference

### No External Sources Needed
This phase is entirely codebase investigation. No library research required.

---

## Metadata

**Confidence breakdown:**
- Bug analysis (JC-03, JC-08): MEDIUM — code logic identified, root cause requires runtime verification
- Service filter fix (JC-01, JC-09): HIGH — data flow is clear, implementation is straightforward
- Smart field (JC-02): HIGH — the detection logic is simple
- Campaign card/navigation (JC-04, JC-05, JC-06, JC-07): HIGH — layout issues are clear from code reading

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable codebase, no external dependencies)
