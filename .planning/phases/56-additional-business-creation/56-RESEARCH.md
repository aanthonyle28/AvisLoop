# Phase 56: Additional Business Creation - Research

**Researched:** 2026-02-27
**Domain:** Next.js server actions + onboarding wizard reuse + cookie-based business activation
**Confidence:** HIGH

## Summary

Phase 56 adds an "Add Business" button to the `/businesses` Clients page that launches the existing 3-step onboarding wizard via a new insert-only code path, then activates the new business and redirects to the dashboard. The critical constraint is that additional-business creation must use `INSERT` (never `UPSERT`), so existing businesses are never touched.

The core challenge is that the existing onboarding wizard and all its actions (`saveBusinessBasics`, `saveServicesOffered`, `acknowledgeSMSConsent`) call `getActiveBusiness()` to determine which business to update. For additional business creation, these actions must instead write to a brand-new, just-inserted business — not the currently-active one. The clean solution is a dedicated `createAdditionalBusiness()` server action that inserts the new business and returns the new `businessId`, and a separate lightweight wizard UI (`CreateBusinessWizard`) that passes the new `businessId` directly to scoped save actions.

No new npm packages are required. No new Supabase tables are needed. No RLS changes are needed (the `businesses` table's existing policy already covers new rows with the same `user_id`). The entire implementation is composition of existing patterns with one new server action and a thin wizard wrapper.

**Primary recommendation:** Create `createAdditionalBusiness()` as a pure INSERT (no upsert, no conflict handling). Pass the returned `businessId` to the wizard steps so they update by explicit ID — not via `getActiveBusiness()`. After the final step, call `switchBusiness(newBusinessId)` and redirect to `/dashboard`.

## Standard Stack

### Core (already installed, no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | latest | Insert new business row, update business columns during wizard | Already used everywhere |
| `next/navigation` | built-in | `redirect()` to dashboard after wizard completion | Standard App Router pattern |
| `next/headers` | built-in | `cookies()` in `switchBusiness()` to set active business cookie | Already used in `active-business.ts` |
| `zod` | 4.3.6 | Validate business name input in `createAdditionalBusiness()` | Already used for all server actions |
| `sonner` | 2.0.7 | Toast on error during wizard | Already used everywhere |
| `react` | 19 | `useState`, `useTransition` in wizard UI | Standard |

### No New Dependencies

Zero `npm install` required. Every UI component, validation library, and data access tool is already in the project.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing existing `OnboardingWizard` | New `CreateBusinessWizard` component | Reusing is tempting but risky — the wizard calls `markOnboardingComplete()` which scopes to `getActiveBusiness()` (the OLD business); safer to have a thin separate wrapper that controls the `newBusinessId` flow |
| Modifying `saveBusinessBasics()` to accept businessId | New scoped actions with businessId param | Modifying existing actions risks breaking the first-business onboarding path; scoped actions isolate the new path cleanly |
| Full URL route for new-business wizard (`/onboarding/new`) | Sheet/modal wizard on `/businesses` | URL route approach means adding `/onboarding/new` to middleware `APP_ROUTES` and handling all the auth/redirect edge cases; sheet modal is simpler and the onboarding wizard already works as a full-screen modal inside a page |

## Architecture Patterns

### Recommended Project Structure

```
lib/actions/
  create-additional-business.ts     # NEW: createAdditionalBusiness() INSERT-only action

app/(dashboard)/businesses/
  page.tsx                           # MODIFIED: pass "Add Business" button state to client

components/businesses/
  businesses-client.tsx              # MODIFIED: Add Business button + sheet state
  create-business-wizard.tsx         # NEW: thin wizard wrapper that controls newBusinessId flow
```

No new pages. No new routes. No new validation files (reuse `businessBasicsSchema` from `lib/validations/onboarding.ts`).

### Pattern 1: Insert-Only Business Creation Server Action

**What:** A server action that inserts a NEW business row (never upserts) and returns the new business ID.
**When to use:** Called by the first step of `CreateBusinessWizard` when the user submits business basics.

```typescript
// Source: lib/actions/create-additional-business.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { businessBasicsSchema } from '@/lib/validations/onboarding'
import type { BusinessBasicsInput } from '@/lib/validations/onboarding'

export async function createAdditionalBusiness(
  input: BusinessBasicsInput
): Promise<{ success: boolean; businessId?: string; error?: string }> {
  const parsed = businessBasicsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { name, phone, googleReviewLink } = parsed.data

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // CRITICAL: Pure INSERT — never upsert, never update, never touch existing businesses
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      phone: phone || null,
      google_review_link: googleReviewLink || null,
    })
    .select('id')
    .single()  // .single() is CORRECT here: we just inserted exactly one row

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, businessId: data.id }
}
```

**Why `.single()` is safe here:** We just inserted exactly one row. The PGRST116 problem (Pitfall 1 from the v3.0 research) applies when *querying multiple existing rows*, not when selecting the row we just inserted. `INSERT ... RETURNING id` always returns exactly one row.

### Pattern 2: Scoped Save Actions (Update by Explicit businessId)

**What:** The campaign preset and SMS consent steps need to save to the new business (identified by `newBusinessId`), not the currently active business. Rather than modifying the existing `saveServicesOffered()` and `acknowledgeSMSConsent()` actions (which call `getActiveBusiness()` internally), the wizard passes `newBusinessId` to inline calls that use the Supabase client directly.

**Option A (Recommended): Scoped server actions that accept businessId**

```typescript
// In lib/actions/create-additional-business.ts (same file, additional exports)

export async function saveAdditionalBusinessServices(
  businessId: string,
  input: ServicesOfferedInput
): Promise<{ success: boolean; error?: string }> {
  // Validates and saves service types to the specific businessId
  // Does NOT call getActiveBusiness()
}

export async function saveAdditionalBusinessCampaignPreset(
  businessId: string,
  presetId: string
): Promise<{ success: boolean; error?: string }> {
  // Duplicates preset campaign scoped to businessId
  // Does NOT call getActiveBusiness()
}

export async function completeAdditionalBusinessOnboarding(
  businessId: string
): Promise<{ success: boolean; error?: string }> {
  // Sets onboarding_completed_at on the specific businessId
  // Does NOT call getActiveBusiness()
}
```

**Option B (Alternative): Re-use existing actions after switchBusiness()**

After `createAdditionalBusiness()` returns `newBusinessId`, call `switchBusiness(newBusinessId)` immediately. Then the existing onboarding actions (`saveServicesOffered`, `createCampaignFromPreset`, `acknowledgeSMSConsent`) will work correctly because `getActiveBusiness()` will now resolve to the new business.

**Tradeoff:** Option B is simpler but temporarily changes the active business mid-wizard, which means if the user abandons the wizard, they are left with the incomplete new business as their active context (instead of their original business). Option A keeps the original business active until wizard completion.

**Recommendation:** Use Option A. It's cleaner, avoids side effects, and matches the stated goal of "new business goes through onboarding wizard and becomes active ON COMPLETION."

### Pattern 3: Thin Wizard Wrapper with newBusinessId State

**What:** `CreateBusinessWizard` is a client component that manages `newBusinessId` state across the 3 steps. Unlike `OnboardingWizard`, it does not use localStorage draft, does not navigate via URL params, and calls `switchBusiness()` + `router.push('/dashboard')` on completion (not `markOnboardingComplete` which goes to a fixed route).

```typescript
// components/businesses/create-business-wizard.tsx
'use client'

export function CreateBusinessWizard({ campaignPresets, onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [newBusinessId, setNewBusinessId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Business basics — creates the business, captures newBusinessId
  // Step 2: Campaign preset — scoped to newBusinessId
  // Step 3: SMS consent — scoped to newBusinessId
  // On complete: switchBusiness(newBusinessId) → redirect('/dashboard')
}
```

**Why NOT reuse `OnboardingWizard`:** The existing `OnboardingWizard`:
1. Calls `markOnboardingComplete()` at the end, which uses `getActiveBusiness()` (would mark the OLD business)
2. Uses localStorage draft with key `'onboarding-draft-v3'` — would conflict with first-business onboarding if both run simultaneously
3. Redirects to `/dashboard?onboarding=complete` hardcoded — appropriate for first-time users but not for agency owners adding a client

### Pattern 4: Post-Wizard Activation Flow

**What:** After the wizard's final step (SMS consent), call `switchBusiness()` then navigate to dashboard.

```typescript
// Inside CreateBusinessWizard completion handler
async function handleComplete() {
  if (!newBusinessId) return
  setIsSubmitting(true)
  try {
    await switchBusiness(newBusinessId)  // Sets active_business_id cookie
    router.push('/dashboard')            // Navigate to dashboard showing new business
  } finally {
    setIsSubmitting(false)
  }
}
```

**Why this works:** `switchBusiness()` already exists in `lib/actions/active-business.ts`. It validates ownership, sets the httpOnly cookie, and calls `revalidatePath('/', 'layout')`. After the redirect, `getActiveBusiness()` will resolve the new business and the dashboard will show its (empty) data.

### Pattern 5: Add Business Button on Clients Page

**What:** An "Add Business" button in the `BusinessesClient` header triggers a state change that opens the `CreateBusinessWizard`. The wizard renders inside a `Sheet` (drawer) or as a full-screen overlay within the businesses page.

**Two viable approaches:**

**Approach A: Sheet drawer wrapping the wizard**
```typescript
// In businesses-client.tsx
const [wizardOpen, setWizardOpen] = useState(false)

// Header
<Button onClick={() => setWizardOpen(true)}>Add Business</Button>

// Wizard in Sheet
<Sheet open={wizardOpen} onOpenChange={setWizardOpen}>
  <SheetContent side="right" className="sm:max-w-lg">
    <CreateBusinessWizard
      campaignPresets={campaignPresets}
      onClose={() => setWizardOpen(false)}
    />
  </SheetContent>
</Sheet>
```

**Approach B: Full-screen overlay (matching existing onboarding UX)**
Since the existing onboarding is full-screen (`min-h-screen flex items-center justify-center`), the new-business wizard should match that feel. A Sheet drawer with constrained width may feel cramped for the full 3-step form (especially business setup with service type toggles).

**Recommendation:** Use a `Dialog` (full-screen modal) rather than a Sheet. Set `className="max-w-none w-screen h-screen sm:max-w-2xl sm:h-auto"` to feel spacious. The wizard steps are designed for a centered, full-width layout.

Alternatively, the simplest approach: navigate to `/onboarding?mode=new` (a new query param the onboarding page recognizes). The onboarding page Server Component checks for `?mode=new` and renders a special `CreateBusinessWizard` instead of the standard `OnboardingWizard`. This avoids sheet/modal complexity entirely.

**Recommendation: Use `/onboarding?mode=new` route approach.** Reasons:
1. The onboarding wizard already has the right full-screen layout
2. The server component already fetches `campaignPresets` for the campaign step
3. Simpler than passing presets from `/businesses` page to a sheet
4. Browser back button works naturally
5. No scroll/overflow issues in a sheet

### Anti-Patterns to Avoid

- **Do NOT call `saveBusinessBasics()` for additional businesses.** It checks `getActiveBusiness()` and updates the existing business if one is found. For additional businesses, use `createAdditionalBusiness()` which always inserts.
- **Do NOT call `markOnboardingComplete()` for additional businesses.** It scopes to `getActiveBusiness()` which may be the ORIGINAL business. Use a scoped version.
- **Do NOT use localStorage draft key `'onboarding-draft-v3'`** in the new wizard. Use a different key or skip draft persistence entirely (wizard is 3 steps, fast to redo).
- **Do NOT skip calling `switchBusiness()` on completion.** Without it, the user completes the wizard but is still looking at their old business's dashboard.
- **Do NOT use `.upsert()` anywhere in the additional business creation path.** The entire point of this phase is to guarantee INSERT-only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Setting active business cookie | Custom cookie manipulation | `switchBusiness()` from `lib/actions/active-business.ts` | Already exists, handles validation + ownership check + revalidatePath |
| Campaign preset duplication | Custom campaign insert | `duplicateCampaign()` from `lib/actions/campaign.ts` | Already exists, handles touches + business scoping |
| Full-screen wizard layout | New CSS | Reuse `min-h-screen flex flex-col items-center justify-center` pattern from `onboarding-wizard.tsx` | Exact same visual pattern needed |
| Step progress indicator | Custom component | `OnboardingProgress` from `components/onboarding/onboarding-progress.tsx` | Already exists and works |
| Business basics form | New form | `BusinessSetupStep` from `components/onboarding/steps/business-setup-step.tsx` | Already has all fields, validation, and error states |
| Campaign preset selection | New UI | `CampaignPresetStep` from `components/onboarding/steps/campaign-preset-step.tsx` | Already exists |
| SMS consent step | New UI | `SMSConsentStep` from `components/onboarding/steps/sms-consent-step.tsx` | Already exists |

## Common Pitfalls

### Pitfall 1: `saveBusinessBasics()` Creates or Updates — Never Pure Insert

**What goes wrong:** `saveBusinessBasics()` has this logic: "if `getActiveBusiness()` returns a business, UPDATE it; otherwise INSERT." When creating a second business, `getActiveBusiness()` will return the first business, so `saveBusinessBasics()` will UPDATE the first business with the second business's data. Silent data destruction.

**Why it happens:** The existing code path is designed for first-business creation where there's always at most one business. Calling it for additional businesses is always wrong.

**How to avoid:** `createAdditionalBusiness()` must call `.insert()` directly, never checking `getActiveBusiness()`.

**Warning signs:** After completing the wizard for Business B, open Business A's settings — if name/Google link changed, the upsert fired.

### Pitfall 2: `markOnboardingComplete()` and `acknowledgeSMSConsent()` Act on Wrong Business

**What goes wrong:** `markOnboardingComplete()` calls `getActiveBusiness()` to find which business to set `onboarding_completed_at` on. During additional-business wizard, the "active business" is still Business A. So `markOnboardingComplete()` marks Business A as having just completed onboarding — not Business B.

**Same issue with `acknowledgeSMSConsent()`** — it calls `getActiveBusiness()` internally.

**How to avoid:** All 3-step save operations for additional businesses must use the `newBusinessId` obtained from `createAdditionalBusiness()`. Write scoped versions in `lib/actions/create-additional-business.ts` that accept `businessId` explicitly.

**Warning signs:** After wizard, Business A shows `onboarding_completed_at` with today's timestamp but Business B does not; Business A shows `sms_consent_acknowledged = true` but it was already set.

### Pitfall 3: `duplicateCampaign()` Already Uses `getActiveBusiness()`

**What goes wrong:** `createCampaignFromPreset()` in `lib/actions/onboarding.ts` calls `duplicateCampaign()` which calls `getActiveBusiness()` to get the `business_id` for the new campaign. This creates the campaign in Business A, not Business B.

**How to avoid:** The scoped campaign creation action must call `duplicateCampaign(presetId, newName)` and — because `duplicateCampaign` internally calls `getActiveBusiness()` — either:
  - Option A: temporarily `switchBusiness()` before calling `duplicateCampaign()` then switch back (fragile)
  - Option B: add a `targetBusinessId` parameter to `duplicateCampaign()` (clean but modifies existing function)
  - Option C: inline the campaign duplication logic in the new action using explicit `businessId` (safest isolation)

**Recommendation:** Option C — inline the duplication in `saveAdditionalBusinessCampaignPreset()`. The duplicateCampaign logic is ~50 lines and reads source campaign then inserts copy.

**Warning signs:** After wizard, Business B has no campaigns; Business A has a new duplicate campaign.

### Pitfall 4: `onboarding/page.tsx` Redirects to `/dashboard` if Onboarding Already Complete

**What goes wrong:** The onboarding page server component checks `status?.completed` and redirects to `/dashboard` if true. For an agency owner who has already completed onboarding for Business A, navigating to `/onboarding?mode=new` would immediately redirect away.

**How to avoid:** The `/onboarding` page needs to detect `?mode=new` and skip the "already completed" redirect check. When `mode=new`, the page always renders the wizard regardless of Business A's onboarding status.

**Exact code to change in `app/onboarding/page.tsx`:**
```typescript
// Current:
if (status?.completed) {
  redirect('/dashboard')
}

// Change to:
const params = await searchParams
const isNewBusinessMode = params.mode === 'new'
if (status?.completed && !isNewBusinessMode) {
  redirect('/dashboard')
}
```

**Warning signs:** Clicking "Add Business" redirects immediately to dashboard without showing the wizard.

### Pitfall 5: `BusinessSetupStep` calls `saveBusinessBasics()` Directly

**What goes wrong:** The existing `BusinessSetupStep` component has this hardcoded:
```typescript
const basicsResult = await saveBusinessBasics({ name, phone, googleReviewLink })
```
Reusing it as-is in the new wizard will call `saveBusinessBasics()`, which updates the active business (Pitfall 1).

**How to avoid:** The new wizard cannot reuse `BusinessSetupStep` component as-is. Options:
  - Pass an `onSaveBasics` callback prop to `BusinessSetupStep` that the wizard controls
  - Create a thin `BusinessSetupStepForNew` that calls `createAdditionalBusiness()` instead
  - Add an optional `businessId` prop to `BusinessSetupStep` — if provided, call scoped update; if not, call `createAdditionalBusiness()`

**Recommendation:** Add `onSubmit` callback prop to `BusinessSetupStep` (or create a thin copy). This keeps the UI logic centralized while allowing the caller to control the save action.

### Pitfall 6: Campaign Presets Fetched in Wrong Context

**What goes wrong:** The campaign presets are system-wide (`is_preset = true, business_id = null`) — they're the same regardless of which business is active. However, the page server component must still fetch them. If using the `/onboarding?mode=new` route approach, the existing `onboarding/page.tsx` already fetches them — no change needed.

**No action required** if using the route-based approach. Only relevant if using a sheet/modal approach where the `/businesses` page itself needs to pass presets.

### Pitfall 7: `switchBusiness()` Triggers `revalidatePath('/', 'layout')`

**What goes wrong (or rather, what's expected):** Calling `switchBusiness()` at the end of the wizard calls `revalidatePath('/', 'layout')`, which re-fetches all layout data including `getUserBusinesses()` and `getActiveBusiness()`. This is correct behavior — the layout should reflect the new active business. But it means the navigation happens with a full server re-render.

**No action required.** This is the correct behavior. Just be aware the redirect to `/dashboard` after `switchBusiness()` will show the new (empty) business's data, which is exactly the success criterion (CREATE-04).

## Code Examples

### createAdditionalBusiness() — Insert-Only Server Action

```typescript
// Source: lib/actions/create-additional-business.ts (NEW FILE)
'use server'

import { createClient } from '@/lib/supabase/server'
import { businessBasicsSchema, servicesOfferedSchema } from '@/lib/validations/onboarding'
import type { BusinessBasicsInput, ServicesOfferedInput } from '@/lib/validations/onboarding'
import { DEFAULT_TIMING_HOURS } from '@/lib/validations/job'
import { revalidatePath } from 'next/cache'

/**
 * Create a brand-new business for the authenticated user.
 * Uses INSERT only — never upsert, never update existing businesses.
 * Returns the new business ID for subsequent wizard steps.
 *
 * @returns { success: true, businessId: string } or { success: false, error: string }
 */
export async function createAdditionalBusiness(
  input: BusinessBasicsInput
): Promise<{ success: boolean; businessId?: string; error?: string }> {
  const parsed = businessBasicsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('businesses')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      google_review_link: parsed.data.googleReviewLink || null,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/businesses')
  return { success: true, businessId: data.id }
}

/**
 * Save service types for a new business by explicit businessId.
 * Does NOT call getActiveBusiness().
 */
export async function saveNewBusinessServices(
  businessId: string,
  input: ServicesOfferedInput
): Promise<{ success: boolean; error?: string }> {
  const parsed = servicesOfferedSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  if (!businessId) return { success: false, error: 'Business ID required' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { serviceTypes, customServiceNames } = parsed.data
  const timingMap: Record<string, number> = {}
  for (const serviceType of serviceTypes) {
    timingMap[serviceType] = DEFAULT_TIMING_HOURS[serviceType]
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      service_types_enabled: serviceTypes,
      service_type_timing: timingMap,
      custom_service_names: customServiceNames || [],
    })
    .eq('id', businessId)
    .eq('user_id', user.id)  // Double-check ownership via RLS + explicit eq

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Create a campaign from a preset for a new business by explicit businessId.
 * Inlines the duplication logic to avoid getActiveBusiness() dependency.
 */
export async function createNewBusinessCampaign(
  businessId: string,
  presetId: string
): Promise<{ success: boolean; error?: string }> {
  if (!businessId || !presetId) return { success: false, error: 'Missing required IDs' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  // Fetch source preset with touches
  const { data: source } = await supabase
    .from('campaigns')
    .select('*, campaign_touches(*)')
    .eq('id', presetId)
    .eq('is_preset', true)
    .single()

  if (!source) return { success: false, error: 'Preset not found' }

  // Insert new campaign scoped to the new business
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      business_id: businessId,
      name: source.name,
      service_type: source.service_type,
      status: 'active',
      is_preset: false,
      personalization_enabled: source.personalization_enabled ?? true,
    })
    .select('id')
    .single()

  if (campaignError) return { success: false, error: campaignError.message }

  // Insert touches
  if (source.campaign_touches?.length > 0) {
    const touches = source.campaign_touches.map((t: { touch_number: number; channel: string; delay_hours: number; template_id: string | null }) => ({
      campaign_id: campaign.id,
      touch_number: t.touch_number,
      channel: t.channel,
      delay_hours: t.delay_hours,
      template_id: t.template_id,
    }))
    const { error: touchError } = await supabase.from('campaign_touches').insert(touches)
    if (touchError) return { success: false, error: touchError.message }
  }

  return { success: true }
}

/**
 * Mark onboarding complete AND acknowledge SMS consent for a new business.
 * Combined to minimize round trips at wizard completion.
 */
export async function completeNewBusinessOnboarding(
  businessId: string
): Promise<{ success: boolean; error?: string }> {
  if (!businessId) return { success: false, error: 'Business ID required' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('businesses')
    .update({
      sms_consent_acknowledged: true,
      sms_consent_acknowledged_at: new Date().toISOString(),
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', businessId)
    .eq('user_id', user.id)  // Ownership guard in addition to RLS

  if (error) return { success: false, error: error.message }
  return { success: true }
}
```

### Onboarding Page — Handle ?mode=new

```typescript
// app/onboarding/page.tsx — MODIFIED section
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; mode?: string }>
}) {
  // ... auth check unchanged ...

  const params = await searchParams
  const isNewBusinessMode = params.mode === 'new'

  // Get active business (may be null for brand-new users)
  const activeBusiness = await getActiveBusiness()

  // Check onboarding status (handles null business gracefully)
  const status = activeBusiness ? await getOnboardingStatus(activeBusiness.id) : null

  // If already complete AND not creating a new business, go to dashboard
  if (status?.completed && !isNewBusinessMode) {
    redirect('/dashboard')
  }

  // ...rest unchanged...
}
```

### CreateBusinessWizard — Thin Wrapper

```typescript
// components/onboarding/create-business-wizard.tsx (NEW FILE)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from './onboarding-progress'
import { switchBusiness } from '@/lib/actions/active-business'
import type { CampaignWithTouches } from '@/lib/types/database'

// 3 steps only: business basics (+ services), campaign preset, SMS consent
const STEPS = [
  { id: 1, title: 'Business Setup' },
  { id: 2, title: 'Campaign Preset' },
  { id: 3, title: 'SMS Consent' },
]

interface CreateBusinessWizardProps {
  campaignPresets: CampaignWithTouches[]
}

export function CreateBusinessWizard({ campaignPresets }: CreateBusinessWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [newBusinessId, setNewBusinessId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleComplete() {
    if (!newBusinessId || isSubmitting) return
    setIsSubmitting(true)
    try {
      await switchBusiness(newBusinessId)
      router.push('/dashboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20">
      <div className="w-full max-w-lg space-y-8">
        {/* Step content rendered here based on step + newBusinessId */}
      </div>
      <OnboardingProgress currentStep={step} totalSteps={STEPS.length} />
    </div>
  )
}
```

### Add Business Button on Clients Page

```typescript
// In businesses-client.tsx header section — simple Link to /onboarding?mode=new
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from '@phosphor-icons/react'

// In the header:
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
    <p className="text-muted-foreground mt-1">Manage your client businesses</p>
  </div>
  <Button asChild>
    <Link href="/onboarding?mode=new">
      <Plus size={16} weight="bold" />
      Add Business
    </Link>
  </Button>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `upsert()` on user_id for all business creation | `insert()` for first business (onboarding), dedicated action for additional | Phase 56 | Prevents data destruction when adding second business |
| `getActiveBusiness()` inside all save actions | Explicit `businessId` param for scoped actions | Phase 56 | Actions can update a specific business regardless of active context |
| Single onboarding path | Two paths: standard (first business) + new-business mode | Phase 56 | Safe isolation of data operations |

**Key facts about the existing onboarding:**
- `saveBusinessBasics()` in `lib/actions/onboarding.ts` has a create-or-update conditional: if `getActiveBusiness()` returns null, it inserts; otherwise it updates. For additional businesses, it always finds the existing active business and updates it.
- The existing onboarding wizard uses `localStorage` key `'onboarding-draft-v3'` — this is a minor consideration; a second concurrent wizard instance would share this key. For Phase 56, either use a different key or skip draft persistence (the additional-business wizard is fast enough to re-fill).
- `duplicateCampaign()` in `lib/actions/campaign.ts` calls `getActiveBusiness()` internally — confirmed in the codebase. Cannot be reused without modification for the additional-business path.

## Open Questions

1. **Should step 1 of the new wizard include services setup (like `BusinessSetupStep` which merges basics + services) or should it only capture business name/phone/link?**
   - What we know: `BusinessSetupStep` already combines business basics + service type selection in one step. The existing 3-step wizard (business setup + campaign preset + SMS consent) has 3 steps total.
   - Recommendation: Keep the same 3-step structure as the existing wizard. Step 1 = `BusinessSetupStep` (merged basics + services). Steps 2-3 = campaign preset + SMS consent.

2. **What happens to the partially-created business if the user abandons the wizard mid-flow?**
   - What we know: After step 1 (business basics), a business row exists in the database. If the user closes the browser or navigates away, this incomplete business exists but has no `onboarding_completed_at`, no `service_types_enabled`, and no campaign.
   - Recommendation: This is acceptable for v3.0. The business will appear in `getUserBusinessesWithMetadata()` as an extra card on the Clients page. In the future, add cleanup logic (delete businesses with no onboarding_completed_at after 24h). For now, document this as a known edge case.

3. **Should the "Add Business" button show on the empty state of `/businesses` page or only in the header?**
   - What we know: The current empty state says "Create your first business to get started" but this page is only reachable by users who already have at least one business (the layout redirects to onboarding if no business exists).
   - Recommendation: Show "Add Business" in BOTH the header (always visible) AND the card grid area as a dashed-border "Add new client" card for discoverability. The empty state is effectively unreachable, but the second approach provides a nicer full-page experience.

4. **Does `/businesses` need to be added to `middleware.ts` `APP_ROUTES`?**
   - What we know: Looking at middleware.ts, `/businesses` is NOT in `APP_ROUTES`. However, the page lives under `app/(dashboard)/businesses/` which Next.js routes serve at `/businesses`. The middleware protects routes listed in `APP_ROUTES` — routes not listed are still accessible but the unauthenticated redirect may not trigger.
   - Recommendation: Add `/businesses` to `APP_ROUTES` in middleware.ts to ensure unauthenticated users are redirected to login. This is a small security fix needed regardless of Phase 56.

## Sources

### Primary (HIGH confidence)

- `lib/actions/onboarding.ts` — `saveBusinessBasics()` create-or-update logic (lines 103-157), `createCampaignFromPreset()`, `acknowledgeSMSConsent()`
- `lib/actions/active-business.ts` — `switchBusiness()` implementation
- `lib/data/active-business.ts` — `getActiveBusiness()` resolution logic
- `lib/actions/campaign.ts` — `duplicateCampaign()` using `getActiveBusiness()` (line 342)
- `components/onboarding/onboarding-wizard.tsx` — wizard shell with localStorage, step navigation, `handleComplete()` calling `markOnboardingComplete()`
- `components/onboarding/onboarding-steps.tsx` — step routing to `BusinessSetupStep`, `CampaignPresetStep`, `SMSConsentStep`
- `components/onboarding/steps/business-setup-step.tsx` — direct call to `saveBusinessBasics()` in form submit (line 90)
- `components/onboarding/steps/campaign-preset-step.tsx` — `createCampaignFromPreset()` call (line 53)
- `app/onboarding/page.tsx` — status check and `status?.completed` redirect (lines 44-46), presets fetch
- `app/(dashboard)/businesses/page.tsx` — `BusinessesClient` render, `getUserBusinessesWithMetadata()` call
- `components/businesses/businesses-client.tsx` — current state of businesses client (no wizard yet)
- `middleware.ts` — `APP_ROUTES` list (line 10-26) — `/businesses` is MISSING
- `.planning/research/PITFALLS.md` — Pitfall 2 (upsert destroys first business), full analysis
- `.planning/research/SUMMARY.md` — Architecture Decision 5 (separate onboarding paths)
- `.planning/STATE.md` — Prior decisions from Phases 52-55

### Secondary (MEDIUM confidence)

- `.planning/phases/55-clients-page/55-RESEARCH.md` — `createAdditionalBusiness()` reference from Phase 54 research
- `.planning/phases/54-business-switcher-ui/54-RESEARCH.md` — switchBusiness() pattern confirmed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Zero new dependencies, all patterns verified in codebase
- Architecture: HIGH — All patterns (insert-only, businessId scoping, switchBusiness) verified by direct codebase inspection
- Pitfalls: HIGH — Based on actual code analysis of `saveBusinessBasics()`, `duplicateCampaign()`, `markOnboardingComplete()` — all confirmed to call `getActiveBusiness()` internally
- Route approach: HIGH — `/onboarding?mode=new` is simpler than sheet/modal, confirmed by analyzing the existing onboarding page's server component capabilities

**Research date:** 2026-02-27
**Valid until:** Indefinite (based entirely on existing codebase patterns, no external dependencies)
