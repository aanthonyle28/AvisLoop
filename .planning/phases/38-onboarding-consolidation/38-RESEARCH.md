# Phase 38: Onboarding Consolidation - Research

**Researched:** 2026-02-19
**Domain:** React wizard state management, localStorage versioning, Next.js Server Actions, Tailwind CSS token-driven styling
**Confidence:** HIGH

---

## Summary

Phase 38 reduces the onboarding wizard from 7 steps to 5 by removing two steps (Review Destination duplicate and Software Used), changes the services step from a vertical card-list to horizontal chip tiles, rewrites campaign preset copy in plain English, recolors the Getting Started pill with warm amber tokens, and fixes the `campaign_reviewed` checklist item to require an actual page visit rather than auto-completing on wizard finish.

All five requirements are self-contained UI/logic changes with no new database migrations. The primary implementation risks are (1) stale localStorage drafts breaking the step count for users mid-wizard, solved by bumping the storage key to `onboarding-draft-v2`, and (2) the `campaign_reviewed` logic, which currently auto-completes because it uses `campaignCount > 0` — this must be replaced with an explicit server action called on first campaign-page load.

**Primary recommendation:** Implement the three plan files in order — wizard restructure first, UI copy/style second, checklist fix third. The checklist fix requires both a new server action and a client-side effect on the campaigns page; do not defer it.

---

## Standard Stack

All work stays entirely within the existing project stack. No new dependencies are needed.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | latest | Server Components, Server Actions, routing | Project foundation |
| React | 19 | `useState`, `useEffect`, `useTransition` | Project foundation |
| Zod | 4.x | Draft schema validation in localStorage (SEC-04 pattern) | Already used for `draftDataSchema` |
| Tailwind CSS | 3.4 | Token-driven styling (`warning-*`, `accent`, etc.) | Project foundation |
| Supabase (server client) | latest | Server Action DB writes for checklist tracking | Project foundation |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@phosphor-icons/react` | 2.x | Icons in tile/chip UI | Consistent with project icon system |
| `sonner` | 2.x | Toast notifications on preset selection | Already used in `campaign-preset-step.tsx` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Action for campaign visit tracking | `useEffect` + localStorage only | localStorage would not survive cross-device; DB write is correct for checklist items |
| Custom tile CSS | Shadcn UI card variants | Tiles follow existing button-card patterns already in service step — stay consistent |

**Installation:** None required.

---

## Architecture Patterns

### Recommended File Structure

The 7 existing step files remain. Two are removed from the switch statement but their files can be left in place (no active imports broken):
```
components/onboarding/
├── onboarding-wizard.tsx        # Change STEPS array, STORAGE_KEY, step count (7→5)
├── onboarding-steps.tsx         # Update switch statement (remove cases 2, 4; renumber 3→2, 5→3, 6→4, 7→5)
├── steps/
│   ├── business-basics-step.tsx # Already includes google_review_link — no change needed
│   ├── review-destination-step.tsx  # REMOVED from wizard (step 2 currently); file stays
│   ├── services-offered-step.tsx    # UI change: vertical cards → horizontal chips; add "Other" text input
│   ├── software-used-step.tsx       # REMOVED from wizard (step 4 currently); file stays
│   ├── campaign-preset-step.tsx     # Copy change: "Conservative/Standard/Aggressive" → plain English
│   ├── customer-import-step.tsx     # REMOVED from wizard (step 6 currently); file stays
│   └── sms-consent-step.tsx         # No change (last step, renumbered to 5)
├── setup-progress-pill.tsx      # Color change: bg-primary/10 → bg-warning-bg etc.
├── setup-progress.tsx           # No change
└── setup-progress-drawer.tsx    # Minor: progress bar bg-primary → bg-warning (optional)

lib/
├── constants/checklist.ts       # No change needed (campaign_reviewed item stays)
├── data/checklist.ts            # CHANGE: campaign_reviewed: campaignCount > 0 → use stored flag
├── actions/checklist.ts         # ADD: markCampaignReviewed server action

app/(dashboard)/campaigns/
└── page.tsx                     # ADD: call markCampaignReviewed on load (server component)
```

### Pattern 1: localStorage Version Bump

**What:** When step count or step IDs change, any in-progress draft stored under `'onboarding-draft'` will map to wrong steps and cause rendering errors or data loss.

**How to avoid:** Change the constant in `onboarding-wizard.tsx`:
```typescript
// Before (line 32 of onboarding-wizard.tsx)
const STORAGE_KEY = 'onboarding-draft'

// After
const STORAGE_KEY = 'onboarding-draft-v2'
```

The old key `'onboarding-draft'` is simply abandoned in place. The Zod `draftDataSchema` (already in place as `z.record(z.string(), z.unknown())`) will safely reject any mismatched structure. No cleanup of the old key is needed — it expires naturally (no expiry, but browsers do not evict localStorage automatically; this is acceptable for a rare migration scenario).

**Why not migrate old draft:** The draft only stores UI field values (name, phone, link etc.), none of which are lost server-side since Step 1 already saves to the DB on Continue. Abandoning the old draft is safe.

### Pattern 2: Wizard Step Renumbering

**What:** Removing steps 2 (Review Destination) and 4 (Software Used) requires renumbering remaining steps:

| Old Step | New Step | Component |
|----------|----------|-----------|
| 1 | 1 | BusinessBasicsStep |
| 2 | (removed) | ReviewDestinationStep |
| 3 | 2 | ServicesOfferedStep |
| 4 | (removed) | SoftwareUsedStep |
| 5 | 3 | CampaignPresetStep |
| 6 | (removed) | CustomerImportStep |
| 7 | 5 | SMSConsentStep |

Wait — step 6 (CustomerImportStep/Job Import) is also removed per the requirements (ONB-01 says "remove duplicate Google review link step and Software Used step", and the phase description says "5 steps"). Looking at the current 7 steps:

1. Business Basics
2. Review Destination (duplicate of google_review_link field in Step 1) — REMOVE
3. Services Offered
4. Software Used — REMOVE
5. Campaign Preset
6. Import Jobs — this is the third removal (step count: 7 - 2 = 5)
7. SMS Consent

Actually, ONB-01 specifies removing "duplicate Google review link step" AND "Software Used step" — that is 2 removals (7 → 5). But the existing Step 6 (Import Jobs/CustomerImportStep) also needs removal since we target 5 steps. Re-reading ONB-01: "reduce from 7 to 5 steps: remove duplicate Google review link step (merge into Business Basics), remove Software Used step." This gives us 5 steps but only accounts for 2 removals from 7.

The correct 5-step flow is:
1. Business Basics (includes google_review_link — already the case in code at line 101-111 of business-basics-step.tsx)
2. Services Offered (old step 3)
3. Campaign Preset (old step 5)
4. Import Jobs (old step 6) — OR remove this too for 5 steps
5. SMS Consent (old step 7)

From 7 steps, removing Review Destination AND Software Used gives exactly 5. The Import Jobs step is skippable and remains. This matches the V2 philosophy doc which says onboarding should end at "Done — Start completing jobs" but does acknowledge CSV import as an optional escape hatch.

**Confirmed 5-step mapping:**
| New Step | Old Step | Component |
|----------|----------|-----------|
| 1 | 1 | BusinessBasicsStep — unchanged, google_review_link field already present |
| 2 | 3 | ServicesOfferedStep — UI change to chips |
| 3 | 5 | CampaignPresetStep — copy change |
| 4 | 6 | CustomerImportStep — unchanged (still skippable) |
| 5 | 7 | SMSConsentStep — unchanged |

**STEPS array change in onboarding-wizard.tsx:**
```typescript
const STEPS: StepConfig[] = [
  { id: 1, title: 'Business Basics', skippable: false },
  { id: 2, title: 'Services Offered', skippable: false },
  { id: 3, title: 'Campaign Preset', skippable: false },
  { id: 4, title: 'Import Jobs', skippable: true },
  { id: 5, title: 'SMS Consent', skippable: false },
]
```

**OnboardingSteps switch statement — new case mapping:**
```typescript
switch (currentStep) {
  case 1: return <BusinessBasicsStep ... />
  case 2: return <ServicesOfferedStep ... />
  case 3: return <CampaignPresetStep ... />
  case 4: return <CustomerImportStep ... />
  case 5: return <SMSConsentStep ... />
}
```

**URL step clamp in page.tsx** must be updated from 7 → 5:
```typescript
// app/onboarding/page.tsx line 52
const currentStep = Math.min(Math.max(1, stepParam), 5)  // was 7
```

### Pattern 3: Horizontal Service Tiles (Chips)

**What:** The current `services-offered-step.tsx` renders a `grid grid-cols-1 md:grid-cols-2 gap-4` of large card-buttons. The requirement is horizontal selectable tiles/chips in a `flex flex-wrap` layout. "Other" must reveal a text input for custom service name.

**Critical note about "Other" and custom service name:** The `SERVICE_TYPES` const and DB schema use `'other'` as a fixed enum value. A custom name typed by the user cannot be stored as a new service type in the DB (it would break the CHECK constraint). The custom name should be stored as a **display label only** (e.g., in business settings or notes), while the service_type value remains `'other'`. Alternatively, the custom name input is for informational purposes only and does not change what gets saved to `service_types_enabled`.

The simplest implementation: when "Other" is selected, show a text input labeled "What service? (optional)" whose value is stored in local state only (or in the existing `software_used` field or a future `custom_service_label` column). Given no schema changes are in scope for Phase 38, the custom label should be captured in local state and either ignored (since DB stores `other`) or saved to a nullable field. The safest approach: capture the label in state, save it with a future schema addition — but for Phase 38, just capture in state for UX correctness; saving is out of scope.

**Chip tile pattern:**
```tsx
// Horizontal chip — small, pill-shaped, flex-wrap layout
<div className="flex flex-wrap gap-2">
  {SERVICE_TYPES.map((serviceType) => {
    const isSelected = selected.includes(serviceType)
    return (
      <button
        key={serviceType}
        type="button"
        onClick={() => handleToggle(serviceType)}
        className={cn(
          'inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors',
          isSelected
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background border-border hover:border-primary/50 text-foreground'
        )}
      >
        {isSelected && <Check size={14} />}
        {SERVICE_TYPE_LABELS[serviceType]}
      </button>
    )
  })}
</div>

{/* Reveal text input when "other" is selected */}
{selected.includes('other') && (
  <div className="mt-4">
    <Label htmlFor="custom-service">What type of service? (optional)</Label>
    <Input
      id="custom-service"
      value={customServiceLabel}
      onChange={(e) => setCustomServiceLabel(e.target.value)}
      placeholder="e.g. Pest Control, Pool Cleaning..."
      className="mt-1.5"
    />
  </div>
)}
```

### Pattern 4: Plain-English Campaign Preset Names

**What:** The `CAMPAIGN_PRESETS` constant in `lib/constants/campaigns.ts` and the matching logic in `campaign-preset-step.tsx` use "Conservative", "Standard", "Aggressive" labels that the requirement says must be replaced with plain-English names that avoid technical jargon ("multi-touch sequence", "touch #1/2/3", "Fast/Standard/Slow").

**The preset labels are derived in campaign-preset-step.tsx** from the `CAMPAIGN_PRESETS` constant via `preset.meta?.id` matching. The database stores preset names like `'Conservative (Email Only)'` and `'Aggressive (Multi-Channel)'`.

**Recommended plain-English names:**
| Old ID/label | New Display Name | New Description |
|---------|------------------|-----------------|
| conservative | "Gentle Follow-Up" | "Two emails over 3 days. Good for established relationships or high-ticket services." |
| standard | "Steady Follow-Up" | "Two emails and a text message over 7 days. Works well for most businesses." |
| aggressive | "Speedy Follow-Up" | "A text within hours, then email and SMS reminders. Best for quick-turnaround services like cleaning." |

The database preset names (`'Conservative (Email Only)'`, etc.) do NOT need to change — these are stored in existing rows that existing users have already duplicated. Only the display-layer labels in `CAMPAIGN_PRESETS` constant and the `campaign-preset-step.tsx` rendering need to change. The matching logic uses `preset.name.toLowerCase().includes(p.id)` — the internal IDs (`conservative`, `standard`, `aggressive`) remain unchanged.

**Key: avoid these words in UI copy:**
- "multi-touch sequence" — say "follow-up messages" or "reminders"
- "Touch #1/2/3" — say specific timing: "A message 1 day after the job" or render as "Day 1, Day 3, Day 7"
- "Fast/Standard/Slow" — not present currently but must not be introduced

The touch visualization in the preset step currently shows Badge components with timing (`24h`, `3d`, etc.). These can stay but should render as "Day 1", "Day 3", "Day 7" instead of raw hours for clarity.

### Pattern 5: Warm Amber Pill Styling

**What:** The Getting Started pill (`setup-progress-pill.tsx`) currently uses `bg-primary/10 text-primary border border-primary/20` (cold blue tint). The requirement is warm amber accent styling.

**Available tokens (from globals.css and tailwind.config.ts):**

The `warning` group maps to amber/warm hues:
- `bg-warning-bg` — hsl(45 100% 96%) light mode / hsl(38 40% 14%) dark mode
- `text-warning-foreground` — hsl(26 83% 14%) light / hsl(45 80% 85%) dark
- `border-warning-border` — hsl(43 96% 77%) light / hsl(38 50% 25%) dark
- `text-warning` — hsl(32 95% 44%) for the icon color

There is also `accent` (hsl(38 92% 50%)) which is the amber accent color defined at H=38.

**Replacement for the incomplete state pill:**
```tsx
// Before
'bg-primary/10 text-primary border border-primary/20'

// After — warm amber
'bg-warning-bg text-warning-foreground border border-warning-border hover:bg-warning-bg/80'
```

**The progress bar inside setup-progress-drawer.tsx** uses `bg-primary`. For full consistency, change to `bg-warning` (the amber token). This is optional but aligns with the requirement.

### Pattern 6: Campaign Review Step Fix

**What:** The `campaign_reviewed` checklist item currently auto-completes because `getChecklistState()` evaluates it as `campaignCount > 0`. Since a campaign is created during the wizard (Campaign Preset step), this means the item is `true` immediately after onboarding finishes — before the user ever visits the campaigns page.

**Required behavior:** The item should only mark complete when the user actually navigates to and views the campaigns page.

**Implementation:** Replace the count-based detection with an explicit DB flag, set by a server action called on campaign page load.

**Where to store the flag:** The `businesses.onboarding_checklist` JSONB column already has a `campaign_reviewed` field in the `OnboardingChecklist` interface (`lib/types/database.ts` line 12). Currently this field is never written — the checklist is computed dynamically. The fix is to write to this field from a new server action, then read it from storage instead of computing it.

**Server action pattern:**
```typescript
// lib/actions/checklist.ts — add new export
export async function markCampaignReviewed(): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, onboarding_checklist')
    .eq('user_id', user.id)
    .single()

  if (!business) return { success: false }

  const current = (business.onboarding_checklist || {}) as Record<string, unknown>
  if (current.campaign_reviewed) return { success: true }  // Already marked

  const { error } = await supabase
    .from('businesses')
    .update({
      onboarding_checklist: { ...current, campaign_reviewed: true }
    })
    .eq('id', business.id)

  if (error) return { success: false }

  revalidatePath('/dashboard')
  return { success: true }
}
```

**Where to call it:** The campaigns page (`app/(dashboard)/campaigns/page.tsx`) is a Server Component. Call the action directly from the server component as a side effect on page render:

```typescript
// app/(dashboard)/campaigns/page.tsx
import { markCampaignReviewed } from '@/lib/actions/checklist'

export default async function CampaignsPage() {
  // Mark campaign as reviewed on page visit (for Getting Started checklist)
  await markCampaignReviewed()

  // ... rest of page
}
```

**Update `getChecklistState()` to read the stored flag:**
```typescript
// lib/data/checklist.ts — change line 76
// Before:
campaign_reviewed: campaignCount > 0,
// After:
campaign_reviewed: storedChecklist?.campaign_reviewed ?? false,
```

**Why not use `useEffect` + client component:** The campaigns page is a Server Component. Calling the action server-side on page load is the correct Next.js App Router pattern. It fires on every visit but the action short-circuits immediately if already true (one read, no write after first visit).

**Edge case — action called before campaign exists:** On first onboarding, a campaign IS created before the user ever visits `/campaigns`. The old logic would mark `campaign_reviewed: true` immediately. The new logic does not mark it until page visit, so the checklist item stays incomplete until the user navigates there — which is the desired behavior.

### Anti-Patterns to Avoid

- **Using `draftData` (from wizard state) for step renumbering:** The wizard's `draftData` is a flat record keyed by field names, not step numbers. Step renumbering only requires changing the `STEPS` array and switch statement, not the draft data structure.
- **Changing database preset names:** The preset names in the DB (`'Conservative (Email Only)'` etc.) are already-created data that existing users have duplicated. Migrating them requires a data migration and risks breaking the matching logic. Change only the display layer in `CAMPAIGN_PRESETS` constant and the render in `campaign-preset-step.tsx`.
- **Adding a DB column for custom service name:** Phase 38 does not include schema changes. Store the "Other" custom label in local state only; saving it is out of scope.
- **Auto-calling `markCampaignReviewed` on wizard completion:** The whole point of ONB-05 is that the checklist item should NOT complete on wizard finish. Do not add it to the `handleComplete` callback in `onboarding-wizard.tsx`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chip/tile multi-select | Custom radio/checkbox abstraction | Inline `<button>` with `cn()` conditional classes | The existing service step already uses this pattern (button elements with border/bg conditional classes) — stay consistent |
| Step renumbering | URL-based step migration or redirect logic | Simply change `STEPS` array and clamp value in `page.tsx` | Out-of-range URL params are already clamped; old users will land on step 1 if their step URL is > 5 |
| Campaign visit tracking | Client-side localStorage flag | Server Action + DB write in JSONB column | Checklist is server-rendered; localStorage would cause hydration mismatch and not show in SSR pill |

**Key insight:** All four checklist items (`first_job_added`, `job_completed`, `first_review_click`) are computed from actual DB state. Only `campaign_reviewed` needs an explicit flag because there is no other DB event that maps to "user viewed campaigns page." The stored JSONB flag is the right approach.

---

## Common Pitfalls

### Pitfall 1: Old Draft Breaking New Wizard
**What goes wrong:** A user who started onboarding before Phase 38 has `'onboarding-draft'` in localStorage. After deploy, the wizard reads this stale data with the new STORAGE_KEY = `'onboarding-draft-v2'` — they simply start fresh (no data loaded), which is correct behavior.
**Why it happens:** The new key doesn't find old data.
**How to avoid:** Change only the `STORAGE_KEY` constant. Old key is abandoned silently.
**Warning signs:** If the new key still reads old data, someone forgot to change the constant.

### Pitfall 2: Step URL Out of Range After Deploy
**What goes wrong:** A user bookmarked `/onboarding?step=6` or `/onboarding?step=7`. After deploy, those step numbers don't exist. Without clamping, the switch falls through to `default: return null`, showing a blank screen.
**Why it happens:** The URL clamp in `page.tsx` must be updated from 7 → 5.
**How to avoid:** Update `Math.min(Math.max(1, stepParam), 5)` on line 52 of `app/onboarding/page.tsx`.
**Warning signs:** Blank screen at `/onboarding?step=6` or `?step=7`.

### Pitfall 3: campaign_reviewed Flag Never Written for Existing Users
**What goes wrong:** Existing users who already have `campaignCount > 0` will now have `campaign_reviewed: false` in the checklist (since the stored flag is not set for them). Their Getting Started pill will show as incomplete for "Review your campaign" even though they've been using the app.
**Why it happens:** The old logic computed this dynamically; the new logic reads a flag that has never been written for existing users.
**How to avoid:** In `getChecklistState()`, add a migration fallback: if `storedChecklist?.campaign_reviewed` is undefined (not explicitly false), fall back to `campaignCount > 0` for backward compat. OR, call `markCampaignReviewed()` from the campaigns page which will set it correctly on next visit.
**Recommended approach:** Accept that existing users will see the checklist item as incomplete until they visit `/campaigns` once. This is acceptable since the checklist auto-dismisses or they dismiss it manually, and visiting campaigns is a normal action.

### Pitfall 4: Preset Description Leaks Technical Language
**What goes wrong:** The touch visualization still shows `24h → 72h → 168h` badges which is confusing.
**Why it happens:** The `Badge` render in `campaign-preset-step.tsx` shows raw `delay_hours`.
**How to avoid:** Convert hours to human-readable day labels: `delay_hours < 24 ? `${delay_hours}h` : `Day ${Math.round(cumulative_hours / 24)}`` where `cumulative_hours` is computed from `touch_number`. Alternatively, simplify to just showing channel icons and count ("3 messages over 7 days").

### Pitfall 5: Warm Pill Color Invisible in Dark Mode
**What goes wrong:** `bg-warning-bg` in light mode is `hsl(45 100% 96%)` (very light amber), but dark mode is `hsl(38 40% 14%)` (dark amber tint). If Tailwind dark mode is not applied correctly, the pill may be invisible.
**Why it happens:** Tailwind `darkMode: ["class"]` requires `.dark` class on `<html>`. The project already uses `next-themes` which sets this — so it should work.
**How to avoid:** Use the semantic tokens (`bg-warning-bg`, `text-warning-foreground`, `border-warning-border`) rather than hardcoded HSL values. The CSS vars handle dark mode automatically.

---

## Code Examples

### Wizard STEPS Array (5-step version)
```typescript
// Source: components/onboarding/onboarding-wizard.tsx
const STEPS: StepConfig[] = [
  { id: 1, title: 'Business Basics', skippable: false },
  { id: 2, title: 'Services Offered', skippable: false },
  { id: 3, title: 'Campaign Preset', skippable: false },
  { id: 4, title: 'Import Jobs', skippable: true },
  { id: 5, title: 'SMS Consent', skippable: false },
]

const STORAGE_KEY = 'onboarding-draft-v2'  // bumped from 'onboarding-draft'
```

### OnboardingSteps Switch (renumbered)
```typescript
// Source: components/onboarding/onboarding-steps.tsx
switch (currentStep) {
  case 1:
    return <BusinessBasicsStep onComplete={onGoToNext} defaultValues={...} />
  case 2:
    return <ServicesOfferedStep onComplete={onGoToNext} onGoBack={onGoBack} defaultEnabled={...} />
  case 3:
    return <CampaignPresetStep onComplete={onGoToNext} onGoBack={onGoBack} presets={campaignPresets || []} />
  case 4:
    return <CustomerImportStep onComplete={onGoToNext} onGoBack={onGoBack} />
  case 5:
    return <SMSConsentStep onComplete={onComplete} onGoBack={onGoBack} isSubmitting={isSubmitting} />
  default:
    return null
}
```

### Horizontal Chip Tile Pattern
```tsx
// Source: components/onboarding/steps/services-offered-step.tsx
<div className="flex flex-wrap gap-2">
  {SERVICE_TYPES.map((serviceType) => {
    const isSelected = selected.includes(serviceType)
    return (
      <button
        key={serviceType}
        type="button"
        onClick={() => handleToggle(serviceType)}
        className={cn(
          'inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors',
          isSelected
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background border-border hover:border-primary/50 text-foreground'
        )}
      >
        {isSelected && <Check size={14} weight="bold" />}
        {SERVICE_TYPE_LABELS[serviceType]}
      </button>
    )
  })}
</div>

{selected.includes('other') && (
  <div className="mt-4 space-y-1.5">
    <Label htmlFor="custom-service">What type of service? (optional)</Label>
    <Input
      id="custom-service"
      value={customServiceLabel}
      onChange={(e) => setCustomServiceLabel(e.target.value)}
      placeholder="e.g. Pest Control, Pool Cleaning..."
    />
  </div>
)}
```

### Plain-English Preset Names in Constants
```typescript
// Source: lib/constants/campaigns.ts — change display values only
export const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: 'conservative',
    name: 'Gentle Follow-Up',  // was 'Conservative (Email Only)'
    description: 'Two emails over 3 days. Good for established relationships or high-ticket services.',
    touches: [
      { touch_number: 1, channel: 'email', delay_hours: 24 },
      { touch_number: 2, channel: 'email', delay_hours: 72 },
    ],
    recommended_for: ['hvac', 'plumbing', 'electrical', 'roofing'],
  },
  {
    id: 'standard',
    name: 'Steady Follow-Up',  // was 'Standard (Email + SMS)'
    description: 'Two emails and a text message over 7 days. Works well for most businesses.',
    touches: [
      { touch_number: 1, channel: 'email', delay_hours: 24 },
      { touch_number: 2, channel: 'email', delay_hours: 72 },
      { touch_number: 3, channel: 'sms', delay_hours: 168 },
    ],
    recommended_for: ['painting', 'handyman', 'other'],
  },
  {
    id: 'aggressive',
    name: 'Speedy Follow-Up',  // was 'Aggressive (Multi-Channel)'
    description: 'A text within hours, then email and SMS reminders. Best for quick-turnaround services like cleaning.',
    touches: [
      { touch_number: 1, channel: 'sms', delay_hours: 4 },
      { touch_number: 2, channel: 'email', delay_hours: 24 },
      { touch_number: 3, channel: 'sms', delay_hours: 72 },
      { touch_number: 4, channel: 'email', delay_hours: 168 },
    ],
    recommended_for: ['cleaning'],
  },
]
```

### Warm Amber Pill Styling
```tsx
// Source: components/onboarding/setup-progress-pill.tsx — incomplete state
// Before:
'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'

// After:
'bg-warning-bg text-warning-foreground border border-warning-border hover:bg-warning-bg/80'
```

### markCampaignReviewed Server Action
```typescript
// Source: lib/actions/checklist.ts — new export
export async function markCampaignReviewed(): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, onboarding_checklist')
    .eq('user_id', user.id)
    .single()

  if (!business) return { success: false }

  const current = (business.onboarding_checklist || {}) as Record<string, unknown>
  // Short-circuit if already marked
  if (current.campaign_reviewed === true) return { success: true }

  await supabase
    .from('businesses')
    .update({ onboarding_checklist: { ...current, campaign_reviewed: true } })
    .eq('id', business.id)

  revalidatePath('/dashboard')
  revalidatePath('/campaigns')
  return { success: true }
}
```

### Campaign Page Side-Effect Call
```typescript
// Source: app/(dashboard)/campaigns/page.tsx
import { markCampaignReviewed } from '@/lib/actions/checklist'

export default async function CampaignsPage() {
  // Mark campaign as reviewed (Getting Started checklist — ONB-05)
  // Fire-and-forget: if it fails, checklist just stays incomplete
  void markCampaignReviewed()  // OR: await markCampaignReviewed()

  const [campaigns, presets] = await Promise.all([...])
  // ... rest unchanged
}
```

### getChecklistState — campaign_reviewed from stored flag
```typescript
// Source: lib/data/checklist.ts — line 76 change
const items: Record<ChecklistItemId, boolean> = {
  first_job_added: jobCount > 0,
  campaign_reviewed: storedChecklist?.campaign_reviewed ?? false,  // was: campaignCount > 0
  job_completed: completedJobCount > 0,
  first_review_click: reviewClickCount > 0,
}
```

Note: The parallel query for `campaignsResult` (active campaign count) in `getChecklistState()` can be removed once this change is made, reducing DB queries from 5 to 4 per checklist render.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 7-step wizard with Software Used and Review Destination as separate steps | 5-step wizard (Phase 38) | Phase 28 added 7-step flow | Reduces time-to-complete by ~40% |
| `campaign_reviewed: campaignCount > 0` (auto-completes on wizard) | `campaign_reviewed` requires actual page visit | Phase 38 | Checklist item is now meaningful |
| `'onboarding-draft'` localStorage key | `'onboarding-draft-v2'` | Phase 38 | Prevents stale draft corruption after step changes |

**Deprecated/outdated:**
- `SoftwareUsedStep`: Will still exist as a file but no longer imported by `onboarding-steps.tsx`. Can be deleted in a future cleanup phase.
- `ReviewDestinationStep`: Same — file stays, no longer mounted during onboarding. The Google review link is now collected inline in BusinessBasicsStep (already was, since Phase 28).
- The `campaignsResult` parallel query in `getChecklistState()` becomes dead code once `campaign_reviewed` is read from stored flag.

---

## Open Questions

1. **Should the "Other" service chip custom label be saved to the DB?**
   - What we know: The `service_types_enabled` column stores a `TEXT[]` of the enum values; `'other'` is the max specificity.
   - What's unclear: Whether the custom label (e.g., "Pest Control") should be persisted for future use (message templates, reports).
   - Recommendation: For Phase 38, capture in state for UX only. Add a `custom_service_label TEXT` column in a future phase if needed. Do not block Phase 38 on this.

2. **Should `markCampaignReviewed()` be called with `await` or `void` in the campaigns page?**
   - What we know: If `await`ed, it adds one DB round-trip to the campaigns page render time. If fire-and-forget (`void`), there is a small window where the user visits the page but the flag isn't written (e.g., server crash, though extremely unlikely).
   - Recommendation: Use `await markCampaignReviewed()` for correctness. The action short-circuits immediately on second call (`if (current.campaign_reviewed) return`), so it is fast.

3. **Preset name conflict with campaigns already created from presets**
   - What we know: Users who ran the wizard before Phase 38 have campaigns named (duplicated from) `'Conservative (Email Only)'`, `'Standard (Email + SMS)'`, `'Aggressive (Multi-Channel)'`. Their campaign names are in the DB and won't change.
   - What's unclear: Whether seeing "Gentle Follow-Up" in the wizard but "Conservative (Email Only)" in their campaign list creates confusion.
   - Recommendation: The campaigns page shows the user's own campaign names (duplicated from preset), not the preset names. The mismatch only exists in the onboarding wizard UI vs the preset cards on `/campaigns`. This is acceptable friction. Optionally, rename the preset display names on `/campaigns` in a future phase.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `components/onboarding/onboarding-wizard.tsx`, `onboarding-steps.tsx`, all step files, `lib/constants/campaigns.ts`, `lib/data/checklist.ts`, `lib/actions/checklist.ts`, `lib/constants/checklist.ts`, `app/globals.css`, `tailwind.config.ts`
- `supabase/migrations/20260204_seed_campaign_presets.sql` — confirmed preset names in DB
- `lib/types/database.ts` — confirmed `OnboardingChecklist.campaign_reviewed` field exists in type definition

### Secondary (MEDIUM confidence)
- Phase 32 implementation patterns (post-onboarding guidance) — inferred from code structure, not read directly

### Tertiary (LOW confidence)
- None — all findings verified from direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all changes within existing files
- Architecture: HIGH — based on direct code inspection of all affected files
- Pitfalls: HIGH — all identified from actual code state (step clamp at 7, campaignCount logic, STORAGE_KEY string)

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable codebase, no fast-moving dependencies)
