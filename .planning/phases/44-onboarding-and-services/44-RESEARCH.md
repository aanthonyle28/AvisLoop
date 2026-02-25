# Phase 44: Onboarding & Services — Research

**Researched:** 2026-02-25
**Domain:** Onboarding wizard architecture, multi-step form patterns, tag-style input, database migration
**Confidence:** HIGH

---

## Summary

Phase 44 has two independent plans: (1) add a CRM platform selection step to the onboarding wizard with logo cards, and (2) implement multi-custom-service tag input when "Other" is selected in both the onboarding services step and the settings services section.

The codebase is a 3-step wizard (`onboarding-wizard.tsx` → `onboarding-steps.tsx` → step components). Adding a step means incrementing the total count in `STEPS`, adding a `case N:` in the switch, and writing a new step component. The `software_used` TEXT column already exists in the local migration file (`20260205044834_add_business_onboarding_fields.sql`) but does NOT exist in the remote Supabase database — a migration is required. The `saveServicesOffered` action currently validates service types strictly as `z.array(z.enum(SERVICE_TYPES))`, so custom services cannot pass through it; the schema must be extended. The `service_types_enabled` column is `TEXT[]` with no CHECK constraint, so it can store arbitrary strings beyond the 8 fixed types — no schema change needed for custom service storage, only validation layer changes.

**Primary recommendation:** Use the existing `TagBadge`/`TagList` components from `components/ui/tag-badge.tsx` for the custom service tag UI. Extend `saveServicesOffered` to accept both fixed service type enums and arbitrary custom service name strings. Use placeholder SVG initials cards for CRM logos (no `public/` directory exists in this project).

---

## Standard Stack

All libraries are already installed in this project. No new dependencies needed.

### Core (already in use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI components | Project standard |
| Zod | 4.x | Schema validation | Used throughout actions |
| `useTransition` | React built-in | Pending state for server actions | Pattern used by all onboarding steps |
| `@phosphor-icons/react` | 2.1.10 | Icons | Project standard (migrated from Lucide) |
| Tailwind CSS | 3.4 | Styling | Project standard |

### Supporting (already in use)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | 2.x | Toast notifications | For error/success feedback |
| `components/ui/tag-badge.tsx` | Internal | Tag display with remove button | For custom service name tags |
| `components/ui/input.tsx` | Internal | Text input | For tag input field |
| `components/ui/badge.tsx` | Internal | Badge display | Optional for selected states |

### No New Dependencies Needed
This phase requires zero new npm packages. All UI primitives exist.

---

## Architecture Patterns

### Pattern 1: Onboarding Step Registration

The wizard controls steps via a `STEPS` const array in `onboarding-wizard.tsx` and a `switch (currentStep)` in `onboarding-steps.tsx`.

**Current structure (3 steps):**
```
Step 1: Business Setup (business basics + services — merged)
Step 2: Campaign Preset
Step 3: SMS Consent (final step, triggers completion)
```

**Target structure (4 steps):**
```
Step 1: Business Setup (business basics + services — merged)
Step 2: Campaign Preset
Step 3: CRM Platform (new — skippable, second-to-last)
Step 4: SMS Consent (final step, triggers completion)
```

**File: `components/onboarding/onboarding-wizard.tsx`** — Change `STEPS` array:
```typescript
const STEPS: StepConfig[] = [
  { id: 1, title: 'Business Setup', skippable: false },
  { id: 2, title: 'Campaign Preset', skippable: false },
  { id: 3, title: 'CRM Platform', skippable: true },   // NEW
  { id: 4, title: 'SMS Consent', skippable: false },
]
```
Also update `Math.min(Math.max(1, stepParam), 3)` in `app/onboarding/page.tsx` to clamp at 4.

**File: `components/onboarding/onboarding-steps.tsx`** — Add `case 3:` for new step, shift `case 3` (SMS) to `case 4`.

**Critical:** The `OnboardingSteps` switch uses `onComplete` (final) vs `onGoToNext` (intermediate). SMS consent `case N` must pass `onComplete` (the completion handler); new CRM step must pass `onGoToNext`.

### Pattern 2: Onboarding Step Component Structure

All existing steps follow this pattern:

```typescript
'use client'

interface StepProps {
  onComplete: () => void      // or Promise<void> for final step
  onGoBack: () => void
  // ...initial data props
}

export function CRMPlatformStep({ onComplete, onGoBack }: StepProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSkip = () => onComplete()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveSoftwareUsed({ softwareUsed: selected || '' })
      if (result.success) onComplete()
    })
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">...</h1>
        <p className="text-muted-foreground text-lg">...</p>
      </div>
      {/* ... */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onGoBack} className="flex-1 h-12 text-base">Back</Button>
        <Button type="submit" className="flex-1 h-12 text-base">Continue</Button>
      </div>
      <div className="text-center">
        <button onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground underline">
          Skip for now
        </button>
      </div>
    </div>
  )
}
```

### Pattern 3: CRM Logo Cards (Square Grid)

The requirement specifies "square logo cards." No `public/` directory exists in the project, so vendor logo images are not available. The approach is text-based cards with brand initials or colored squares. The existing `software-used-step.tsx` uses a list layout with radio indicators — the new step should use a grid of square cards.

**Platforms to include (confirmed from requirements and ROADMAP):**
- Jobber
- Housecall Pro
- ServiceTitan
- GorillaDesk
- FieldPulse
- None (no software)
- Other (with text input)

**Square card pattern:**
```typescript
const CRM_PLATFORMS = [
  { value: 'jobber', label: 'Jobber', abbrev: 'J', color: 'bg-green-100 text-green-700' },
  { value: 'housecall_pro', label: 'Housecall Pro', abbrev: 'HP', color: 'bg-orange-100 text-orange-700' },
  { value: 'servicetitan', label: 'ServiceTitan', abbrev: 'ST', color: 'bg-blue-100 text-blue-700' },
  { value: 'gorilla_desk', label: 'GorillaDesk', abbrev: 'GD', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'field_pulse', label: 'FieldPulse', abbrev: 'FP', color: 'bg-purple-100 text-purple-700' },
  { value: 'none', label: 'None', abbrev: '—', color: 'bg-muted text-muted-foreground' },
  { value: 'other', label: 'Other', abbrev: '...', color: 'bg-muted text-muted-foreground' },
] as const
```

**Card selected state:** Use `border-primary ring-2 ring-primary bg-primary/5` (identical to `CampaignPresetStep` selection pattern).

**Grid layout:** `grid grid-cols-3 sm:grid-cols-4 gap-3` for square cards. Each card ~80-96px square.

### Pattern 4: Tag-Style Input for Custom Services

The requirement is "multiple custom service names (tag-style input)." The existing `TagBadge` component in `components/ui/tag-badge.tsx` has `onRemove` support and a `TagList` component.

**State model:**
```typescript
const [customServices, setCustomServices] = useState<string[]>([])
const [inputValue, setInputValue] = useState('')

const handleAddTag = () => {
  const trimmed = inputValue.trim()
  if (!trimmed || customServices.includes(trimmed)) return
  setCustomServices(prev => [...prev, trimmed])
  setInputValue('')
}

const handleRemoveTag = (tag: string) => {
  setCustomServices(prev => prev.filter(s => s !== tag))
}

// Submit on Enter key
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleAddTag()
  }
}
```

**UI pattern:**
```tsx
{selected.includes('other') && (
  <div className="space-y-2">
    <Label>Custom service names</Label>
    <div className="flex flex-wrap gap-1.5 mb-2">
      {customServices.map(s => (
        <TagBadge key={s} tag={s} onRemove={() => handleRemoveTag(s)} />
      ))}
    </div>
    <div className="flex gap-2">
      <Input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Pest Control"
      />
      <Button type="button" size="sm" onClick={handleAddTag}>Add</Button>
    </div>
  </div>
)}
```

### Pattern 5: Saving Custom Services to Database

**Current constraint:** `service_types_enabled` is `TEXT[]` with no CHECK constraint in the database — it CAN store arbitrary strings. The restriction is in the **Zod schema** in `lib/validations/onboarding.ts`:

```typescript
// Current — rejects anything outside the 8 fixed types:
export const servicesOfferedSchema = z.object({
  serviceTypes: z.array(z.enum(SERVICE_TYPES)).min(1, ...),
})
```

**Required change:** Extend to accept a mix of fixed types + custom strings:

```typescript
// New — accepts both fixed types and custom service names:
export const servicesOfferedSchema = z.object({
  serviceTypes: z.array(z.enum(SERVICE_TYPES)).min(1, ...),
  customServiceNames: z.array(z.string().min(1).max(50)).max(10).optional().default([]),
})
```

**Storage strategy:** Store custom service names in `service_types_enabled` alongside the fixed types. When "other" is selected AND custom names exist, store `['other', 'pest control', 'pool cleaning', ...]` in the array. The `updateServiceTypeSettings` action's validation currently filters to `validTypes` — this filter must be updated to also pass through custom service names.

**Alternative storage:** A new `custom_service_names TEXT[]` column on businesses. This is cleaner but requires a DB migration.

**Recommendation:** Use a new `custom_service_names TEXT[]` column. This keeps fixed service types (used for campaign matching) separate from custom labels (display-only). The `service_types_enabled` stores only the 8 fixed types; `custom_service_names` stores user-defined names. This avoids polluting the campaign matching logic that depends on `service_types_enabled` containing only valid enum values.

### Pattern 6: Database Migration for Phase 44

**Plan 44-01 (CRM step):** `software_used` TEXT column is in the local migrations directory but NOT in the remote DB. The Supabase MCP confirms it's absent from the live database. A migration must be applied via `mcp__supabase__apply_migration`.

```sql
-- 44-01: add software_used if missing
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS software_used TEXT;

COMMENT ON COLUMN public.businesses.software_used IS
  'CRM/field service software selection from onboarding: jobber, housecall_pro, servicetitan, gorilla_desk, field_pulse, none, other, or free text for other';
```

**Plan 44-02 (custom services):** Requires `custom_service_names TEXT[]` column:

```sql
-- 44-02: add custom_service_names
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS custom_service_names TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.businesses.custom_service_names IS
  'User-defined custom service type names (e.g. Pest Control, Pool Cleaning). Displayed alongside fixed service_types_enabled.';
```

No RLS changes needed — both columns are on `businesses` which already has correct row-level security (users can only access their own business).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tag display with remove button | Custom span+button | `TagBadge` from `components/ui/tag-badge.tsx` | Already built, accessible, consistent |
| Tag list layout | Custom flex div | `TagList` from `components/ui/tag-badge.tsx` | Already handles empty state |
| Pending/loading state | Custom boolean state | `useTransition()` | Pattern used by all 10+ existing step components |
| Form error display | Custom error component | `<p className="text-sm text-error-text">{error}</p>` | Existing pattern throughout onboarding steps |
| Navigation buttons | Custom layout | Back/Continue pattern from existing steps (h-12, text-base, flex gap-3) | Consistent with wizard shell |
| CRM vendor images | Downloading SVG assets | Text abbreviation cards with brand colors | No `public/` directory exists; SVG URLs from CDN require CSP/next.config changes |

**Key insight:** The entire tag-style input is buildable from existing primitives. The only new logic is the `handleAddTag`/`handleRemoveTag`/`handleKeyDown` pattern — which is ~15 lines of code.

---

## Common Pitfalls

### Pitfall 1: Step Count Mismatch Between Files

**What goes wrong:** `STEPS` array in `onboarding-wizard.tsx` says 4 steps but `onboarding-steps.tsx` switch only handles 3 cases, or `app/onboarding/page.tsx` clamps step at old total.

**Why it happens:** Step registration is split across three files that must all be updated atomically.

**How to avoid:** In a single commit, update ALL three locations:
1. `onboarding-wizard.tsx` — `STEPS` array length
2. `onboarding-steps.tsx` — switch cases
3. `app/onboarding/page.tsx` — `Math.min(Math.max(1, stepParam), N)` clamp

**Warning signs:** Progress bar shows wrong fraction; navigating past last non-final step redirects to wrong step.

### Pitfall 2: `onComplete` vs `onGoToNext` on Wrong Step

**What goes wrong:** The CRM step accidentally passes `onComplete` (final completion handler) instead of `onGoToNext`. Completing the CRM step marks onboarding done and redirects to dashboard, skipping SMS consent.

**Why it happens:** `SMSConsentStep` receives `onComplete: () => Promise<void>` which triggers `markOnboardingComplete()`. If CRM step receives the same prop, wizard ends early.

**How to avoid:** In `onboarding-steps.tsx`, verify:
- Cases 1, 2, 3 (all non-final): pass `onGoToNext` as `onComplete`
- Case 4 (SMS consent, final): pass `handleComplete` as `onComplete`

### Pitfall 3: Zod Validation Rejecting Custom Service Names

**What goes wrong:** User adds "Pest Control" as a custom service → `saveServicesOffered` action runs `z.enum(SERVICE_TYPES)` validation → fails with "Invalid enum value."

**Why it happens:** `servicesOfferedSchema` strictly validates against the 8-item tuple. Custom names are not in the enum.

**How to avoid:** The schema must distinguish between fixed service type selections (for campaign routing) and custom service names (for display). Pass them as two separate fields or extend the schema to accept a second array.

### Pitfall 4: `service_types_enabled` Used in Campaign Matching

**What goes wrong:** Storing custom names like "Pest Control" in `service_types_enabled` pollutes campaign routing logic. In `getServiceTypeSettings()`, the `ServiceTypesSection`, and `updateServiceTypeSettings()`, service types are assumed to be valid enum values.

**Why it happens:** Multiple places filter/match against the 8 fixed types. Storing custom names there breaks these assumptions.

**How to avoid:** Store custom names in a separate `custom_service_names TEXT[]` column. Never mix them into `service_types_enabled`.

### Pitfall 5: Missing `software_used` Column in Remote DB

**What goes wrong:** `saveSoftwareUsed()` server action calls `supabase.from('businesses').update({ software_used: ... })` but the column doesn't exist in the live database — the update silently fails (Supabase returns no error for unknown column in update, it just ignores it).

**Why it happens:** The migration file `20260205044834_add_business_onboarding_fields.sql` exists locally but was never applied to the remote Supabase project. The remote DB shows 0 rows for `software_used` in `information_schema.columns`.

**How to avoid:** Apply migration via `mcp__supabase__apply_migration` as part of plan 44-01 execution, BEFORE writing the step component.

### Pitfall 6: Tag Input Submitting Parent Form on Enter

**What goes wrong:** User types a custom service name and presses Enter → parent `<form onSubmit={handleSubmit}>` fires → page saves with incomplete data.

**Why it happens:** Enter key bubbles up to the nearest form submit handler.

**How to avoid:** In the tag input's `onKeyDown`:
```typescript
if (e.key === 'Enter') {
  e.preventDefault()  // CRITICAL: prevent form submission
  handleAddTag()
}
```

### Pitfall 7: `OnboardingBusiness` Type Missing New Fields

**What goes wrong:** The `onboarding-wizard.tsx` accepts `OnboardingBusiness` type but `lib/types/onboarding.ts` doesn't include `custom_service_names`. The `app/onboarding/page.tsx` fetches business data and maps to `OnboardingBusiness` — if `custom_service_names` is not in the select query or the type, pre-fill won't work.

**Why it happens:** Types are manually maintained, not auto-generated.

**How to avoid:** After adding the DB column, update:
1. `lib/types/onboarding.ts` — add `custom_service_names: string[] | null`
2. `lib/data/onboarding.ts` — add `custom_service_names` to the select query
3. `app/onboarding/page.tsx` — map `custom_service_names` to the `OnboardingBusiness` object

---

## Code Examples

### Existing: How Software Used Step Handles Save

```typescript
// Source: lib/actions/onboarding.ts (existing)
export async function saveSoftwareUsed(
  input: SoftwareUsedInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'You must be logged in' }

  const parsed = softwareUsedSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const { softwareUsed } = parsed.data

  const { error } = await supabase
    .from('businesses')
    .update({ software_used: softwareUsed || null })
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
```

This function ALREADY EXISTS and works correctly. The issue is (a) the DB column doesn't exist remotely and (b) the SOFTWARE_OPTIONS list needs expansion.

### Existing: How `updateServiceTypeSettings` Validates Types

```typescript
// Source: lib/actions/business.ts (existing)
const validTypes = ['hvac', 'plumbing', 'electrical', 'cleaning', 'roofing', 'painting', 'handyman', 'other']
const filteredEnabled = settings.serviceTypesEnabled.filter(t => validTypes.includes(t))
```

This filter will strip custom service names. For plan 44-02, this function either needs a separate param for custom names, or this filter needs to be updated to pass through non-enum strings.

### New: Tag Input Pattern (reference implementation)

```typescript
// Pattern for CustomServiceInput component
const [customServices, setCustomServices] = useState<string[]>(initialCustomServices)
const [inputValue, setInputValue] = useState('')

const addService = () => {
  const trimmed = inputValue.trim()
  if (!trimmed || customServices.includes(trimmed) || customServices.length >= 10) return
  setCustomServices(prev => [...prev, trimmed])
  setInputValue('')
}

const removeService = (service: string) => {
  setCustomServices(prev => prev.filter(s => s !== service))
}

// In JSX:
// <TagList tags={customServices} onRemove={removeService} />
// <Input value={inputValue} onChange={e => setInputValue(e.target.value)}
//   onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addService() } }} />
// <Button type="button" onClick={addService} size="sm">Add</Button>
```

### New: CRM Platform Data Structure

```typescript
// Place in: lib/validations/onboarding.ts (extend SOFTWARE_OPTIONS)
export const CRM_PLATFORMS = [
  { value: 'jobber', label: 'Jobber', abbrev: 'J' },
  { value: 'housecall_pro', label: 'Housecall Pro', abbrev: 'HP' },
  { value: 'servicetitan', label: 'ServiceTitan', abbrev: 'ST' },
  { value: 'gorilla_desk', label: 'GorillaDesk', abbrev: 'GD' },
  { value: 'field_pulse', label: 'FieldPulse', abbrev: 'FP' },
  { value: 'none', label: 'None', abbrev: '—' },
  { value: 'other', label: 'Other', abbrev: '...' },
] as const

export type CRMPlatformValue = typeof CRM_PLATFORMS[number]['value']
```

### Existing: Step Type Pattern (for reference)

```typescript
// Source: components/onboarding/onboarding-steps.tsx
// CRM step case must use onGoToNext for its onComplete prop:
case 3:
  return (
    <CRMPlatformStep
      onComplete={onGoToNext}      // NOT onComplete (that's handleComplete)
      onGoBack={onGoBack}
      defaultValue={business?.software_used || undefined}
    />
  )

case 4:
  return (
    <SMSConsentStep
      onComplete={onComplete}      // handleComplete — triggers markOnboardingComplete
      onGoBack={onGoBack}
      isSubmitting={isSubmitting}
    />
  )
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `SOFTWARE_OPTIONS` with 4 choices (servicetitan, jobber, housecall_pro, none) | Expanding to 7 platforms + new logo card UI | Phase 44 | New step component, existing `saveSoftwareUsed` action reused |
| Single text input for custom service | Multi-tag input for custom services | Phase 44 | Allows multiple named custom services |
| `customServiceLabel` as unused/unsubmitted state | Custom names saved to `custom_service_names` DB column | Phase 44 | Requires new DB column + schema extension |

**Deprecated/outdated:**
- `software-used-step.tsx`: This file exists but is NOT used in the current 3-step wizard (the old step was removed during Phase 38 onboarding consolidation). It's a dead file. Plan 44-01 should either reuse it (rename/refactor) or delete it and create `crm-platform-step.tsx`. Recommend: delete the dead `software-used-step.tsx` and `services-offered-step.tsx` old files if they're unused, create fresh `crm-platform-step.tsx`.
- `customServiceLabel` (single string) in `business-setup-step.tsx` and `services-offered-step.tsx`: currently captured in state but never submitted. Plan 44-02 replaces this with multi-tag input.

---

## Structural Inventory

### Files Touched by Plan 44-01 (CRM Step)

| File | Change Type | Change Summary |
|------|-------------|----------------|
| `supabase/migrations/NEW.sql` | New file | `ADD COLUMN IF NOT EXISTS software_used TEXT` |
| `lib/types/database.ts` | Update | Add `software_used: string \| null` to `Business` interface |
| `lib/types/onboarding.ts` | Update | Add `software_used: string \| null` to `OnboardingBusiness` type |
| `lib/validations/onboarding.ts` | Update | Expand `SOFTWARE_OPTIONS` → `CRM_PLATFORMS` with 7 platforms |
| `lib/data/onboarding.ts` | Update | Add `software_used` to the select query in `getOnboardingStatus` |
| `components/onboarding/steps/crm-platform-step.tsx` | New file | New step component with square logo cards |
| `components/onboarding/onboarding-wizard.tsx` | Update | Add step 3 to `STEPS` array (total: 4) |
| `components/onboarding/onboarding-steps.tsx` | Update | Add `case 3:` for CRM, shift SMS to `case 4:` |
| `app/onboarding/page.tsx` | Update | Change step clamp from 3 to 4; map `software_used` in business object |
| `components/onboarding/steps/software-used-step.tsx` | Delete | Dead file — step was removed from wizard in Phase 38; new `crm-platform-step.tsx` replaces it |

### Files Touched by Plan 44-02 (Custom Services)

| File | Change Type | Change Summary |
|------|-------------|----------------|
| `supabase/migrations/NEW.sql` | New file | `ADD COLUMN IF NOT EXISTS custom_service_names TEXT[] DEFAULT '{}'` |
| `lib/types/database.ts` | Update | Add `custom_service_names: string[] \| null` to `Business` interface |
| `lib/types/onboarding.ts` | Update | Add `custom_service_names: string[] \| null` to `OnboardingBusiness` type |
| `lib/validations/onboarding.ts` | Update | Extend `servicesOfferedSchema` with optional `customServiceNames` field |
| `lib/actions/onboarding.ts` | Update | Update `saveServicesOffered` to accept and save `customServiceNames` |
| `lib/actions/business.ts` | Update | Update `updateServiceTypeSettings` to accept and save `customServiceNames` |
| `components/onboarding/steps/business-setup-step.tsx` | Update | Replace single `customServiceLabel` input with multi-tag input |
| `components/settings/service-types-section.tsx` | Update | Add multi-tag input for custom services when "other" is toggled |
| `app/onboarding/page.tsx` | Update | Map `custom_service_names` in business object |

---

## Open Questions

1. **Logo image strategy**
   - What we know: No `public/` directory. `next/image` is used only in `components/marketing/hero.tsx`.
   - What's unclear: Whether to use text abbreviation cards, inline SVGs, or fetch logos from a CDN.
   - Recommendation: Text abbreviation cards with brand-approximate background colors. No external image fetches. This avoids CSP/next.config changes and keeps the step lightweight. If real logos are desired later, add SVG files to a new `public/logos/crm/` directory.

2. **"Other" CRM with text input**
   - What we know: The requirement says "Other" with text input. `saveSoftwareUsed` stores free text.
   - What's unclear: Should the "Other" text be stored in `software_used` as a raw string or as `"other:Pest Software"`?
   - Recommendation: Store as raw text (e.g., "My Custom CRM"). The `software_used` column is TEXT with no CHECK constraint.

3. **Custom service names and campaign routing**
   - What we know: `service_types_enabled` drives campaign auto-enrollment. Custom names don't map to campaigns.
   - What's unclear: Should custom service names get a default timing (for a potential "catch-all" campaign)?
   - Recommendation: Custom service names are display-only. They don't get timing entries in `service_type_timing`. Users who have custom services can use the "other" service type timing for campaign enrollment.

4. **Dead files to remove**
   - `software-used-step.tsx` — unused since Phase 38 collapsed the wizard
   - `services-offered-step.tsx` — may be unused since `business-setup-step.tsx` now handles services
   - Recommendation: Verify these are not imported anywhere, then delete as part of the relevant plan to avoid dead code.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `components/onboarding/onboarding-wizard.tsx`, `onboarding-steps.tsx`, all step components
- Direct codebase inspection of `lib/validations/onboarding.ts`, `lib/actions/onboarding.ts`, `lib/actions/business.ts`
- Supabase MCP `list_tables` — confirmed `software_used` column absence from remote `businesses` table
- Supabase MCP `execute_sql` — confirmed `service_types_enabled` is `TEXT[]` with no CHECK constraint
- Direct read of `components/ui/tag-badge.tsx` — confirmed `TagBadge`/`TagList` components exist with remove support

### Secondary (MEDIUM confidence)
- Cross-referencing `.planning/phases/38-onboarding-consolidation/` to confirm `software-used-step.tsx` is a dead file
- ROADMAP.md Phase 44 section confirming platform list (Jobber, Housecall Pro, ServiceTitan, GorillaDesk, FieldPulse, None, Other)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all verified from package.json and existing component imports
- Architecture: HIGH — patterns read directly from source files
- Database state: HIGH — confirmed via Supabase MCP live query
- Pitfalls: HIGH — derived from direct code inspection of validation logic and wizard shell

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable codebase, 30-day window)
