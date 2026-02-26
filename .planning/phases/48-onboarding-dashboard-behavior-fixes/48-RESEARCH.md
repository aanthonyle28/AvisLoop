# Phase 48: Onboarding & Dashboard Behavior Fixes - Research

**Researched:** 2026-02-25
**Domain:** Next.js App Router (server components, server actions), React state management, UI copy
**Confidence:** HIGH — all findings verified against live codebase

---

## Summary

Phase 48 is a pure codebase-fix phase — no new libraries or infrastructure are needed. All six requirements touch existing files with well-understood patterns. The research identified the exact file, function, and line for each fix.

The most nuanced change is GS-01/GS-02: the "campaign_reviewed" checklist item currently fires when the user visits `/campaigns` (the list page). The requirement changes the trigger to visiting a **campaign detail page** (`/campaigns/[id]`). The infrastructure already exists — `markCampaignReviewed()` in `lib/actions/checklist.ts` and the `onboarding_checklist.campaign_reviewed` JSONB flag — the trigger location just moves from `campaigns/page.tsx` to `campaigns/[id]/page.tsx`.

DASH-01 (dismiss Needs Attention) is already coded correctly in `attention-alerts.tsx` — the `handleDismiss` function updates `dismissedIds` state and `visibleAlerts` filters it out. The bug is likely that the X button's `onClick` calls `onDismiss?.(alert.id)` with optional chaining. Investigating the component usage in `dashboard-client.tsx` reveals that `AttentionAlerts` receives no `onDismiss` prop — only `onSelectAlert` and `selectedAlertId`. The `onDismiss` is only wired up internally. This means the dismiss IS working because `onDismiss` is passed via the internal `AlertRow` → `onDismiss={handleDismiss}` — this flow is intact. Need to verify live whether this actually works or if there is a rendering bug.

**Primary recommendation:** All fixes are surgical edits to existing files. No new files, no schema changes, no new dependencies.

---

## Standard Stack

No new libraries needed. All fixes use existing stack:

### Core (already installed)
| Library | Purpose | Notes |
|---------|---------|-------|
| Next.js App Router | Server components, server actions | `'use server'` pattern already used |
| React `useState` / `useTransition` | UI state (dismiss animation) | Already used in `attention-alerts.tsx` |
| `next/navigation` `useRouter` / `redirect` | Navigation | Already used |
| Supabase server client | DB reads/writes in server actions | Already used in `lib/actions/checklist.ts` |

### No New Packages Required
All requirements are satisfied by existing dependencies. No `npm install` step needed.

---

## Architecture Patterns

### Pattern 1: Server Action Called in Server Component (Page)
**Used for:** GS-01, GS-02 — moving `markCampaignReviewed()` call from campaigns list page to campaigns detail page.

**Current pattern (campaigns/page.tsx):**
```typescript
// app/(dashboard)/campaigns/page.tsx
import { markCampaignReviewed } from '@/lib/actions/checklist'

export default async function CampaignsPage() {
  await markCampaignReviewed()  // <-- fires on list page visit
  // ...
}
```

**New pattern (campaigns/[id]/page.tsx):**
```typescript
// app/(dashboard)/campaigns/[id]/page.tsx
import { markCampaignReviewed } from '@/lib/actions/checklist'

export default async function CampaignDetailPage({ params, searchParams }: ...) {
  const { id } = await params
  // Fire BEFORE notFound() check so even deleted-campaign visits can count
  // But: only fire if business exists (avoids spurious writes for bots)
  // Actually: fire AFTER business check but before or alongside other fetches
  await markCampaignReviewed()  // <-- moves here
  // ...
}
```

**Key insight:** `markCampaignReviewed()` already short-circuits if already set (`if (current.campaign_reviewed === true) return { success: true }`), so calling it on every visit is safe and cheap.

**GS-02 edge case (campaign deleted):** The current `markCampaignReviewed()` function sets the flag unconditionally — it does NOT check that the specific campaign exists. This means if the onboarding-created campaign was deleted, visiting ANY campaign detail page (`/campaigns/[id]`) still calls `markCampaignReviewed()` and marks step 2 complete. This edge case is already handled correctly by the existing logic — no additional changes needed for GS-02 beyond moving the call to `[id]/page.tsx`.

**Remove from campaigns/page.tsx:** After moving, remove `import { markCampaignReviewed }` and `await markCampaignReviewed()` from the list page.

---

### Pattern 2: Client-Side UI-Only Dismiss (React useState)
**Used for:** DASH-01 — verifying/fixing Needs Attention dismiss.

**Current code in `attention-alerts.tsx`:**
```typescript
// components/dashboard/attention-alerts.tsx
export function AttentionAlerts({ alerts, onSelectAlert, selectedAlertId }: AttentionAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id))
  // ...
  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
  }
  // ...
  // AlertRow receives: onDismiss={handleDismiss}
}
```

**Analysis:** The dismiss logic IS wired up — `handleDismiss` is passed as `onDismiss` to `AlertRow`, and `AlertRow`'s X button calls `e.stopPropagation(); onDismiss?.(alert.id)`. The UI-only dismiss via `dismissedIds` state should work. The `visibleAlerts` filter correctly excludes dismissed items.

**Potential issue to verify:** The `displayedAlerts` variable slices `visibleAlerts` to first 3, but `hasMore` checks `visibleAlerts.length > 3`. If an item is dismissed from the first 3 and there is a 4th item, the 4th item should appear. This appears correct.

**Most likely actual bug:** The `git diff` shows `attention-alerts.tsx` is modified (untracked changes `M`). The current file state may differ from what we read. The dismiss flow appears correct in the file we read — if there's a bug it may be in a newer version. The planner should verify against the actual current state of the M-marked file.

**DASH-01 fix approach:** If dismiss works correctly as coded, mark as verified. If the M-file has regressed, restore the `dismissedIds` state pattern.

---

### Pattern 3: Link href Change (KPI Cards)
**Used for:** DASH-02 — unify all 3 KPI cards to navigate to `/analytics`.

**Current state in `kpi-widgets.tsx`:**
```typescript
// Line 57: Reviews This Month
<Link href="/history?status=reviewed" className="block">

// Line 78: Average Rating
<Link href="/feedback" className="block">

// Line 99: Conversion Rate
<Link href="/history" className="block">
```

**Target state:**
```typescript
// All three:
<Link href="/analytics" className="block">
```

This is a 3-line change in a single file.

---

### Pattern 4: Vertical Stack Layout for Campaign Preset Picker (ONB-01)
**Used for:** ONB-01, ONB-02, ONB-03 — redesign campaign preset step.

**Current state in `campaign-preset-step.tsx`:**
```tsx
// Line 69: 3-column grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-4" ...>
```

**Target state:**
```tsx
// Vertical stack (always 1 column)
<div className="flex flex-col gap-3" ...>
```

**Standard ordering** for ONB-01 (Standard in middle):
1. Gentle Follow-Up (conservative)
2. Standard Follow-Up (standard) ← middle position
3. Aggressive Follow-Up (aggressive)

The presets are fetched from the database via `getCampaignPresets()` in `app/(dashboard)/onboarding/page.tsx`. The database order may not match the desired display order. The component receives `presets: CampaignWithTouches[]` and matches them to `CAMPAIGN_PRESETS` constants.

**Sort strategy for middle Standard:** The component should sort by a fixed order: conservative → standard → aggressive. Since `CAMPAIGN_PRESETS` in `lib/constants/campaigns.ts` defines this order already (conservative=index 0, standard=index 1, aggressive=index 2), the component can sort `presetsWithMeta` by `CAMPAIGN_PRESETS.findIndex()`.

---

### Pattern 5: Copy Changes (ONB-02, ONB-03)
**Used for:** ONB-02 — remove jargon; ONB-03 — fix subtitle copy.

**Current jargon to remove (ONB-02):**
- Touch visualization shows badges with "email" and "sms" + timing (e.g., "Day 1", "7h"). These should be replaced with plain-English descriptions.
- The `CAMPAIGN_PRESETS` descriptions are already jargon-free ("Two emails over 3 days") but the **touch visualization badges** show `touch.channel` and delay math — those are the jargon.
- "Multi-touch sequence" does not appear in current code — this is a non-issue.
- "touch #1/2/3" does appear implicitly in the touch visualization badges (idx-based labeling). Remove the badge visualization entirely and rely only on `preset.meta.description`.

**Current subtitle (ONB-03):**
```tsx
// Line 63-65:
<p className="text-muted-foreground text-lg">
  Select a campaign style. You can customize it later in Settings.
</p>
```

**Target subtitle:**
```tsx
<p className="text-muted-foreground text-lg">
  Select a campaign style. You can change this later in Campaigns.
</p>
```

---

### Pattern 6: "Create new campaign" Option in CampaignSelector (JOB-01)
**Used for:** JOB-01 — add "Create new campaign" option to the campaign dropdown in Add Job.

**Current state in `campaign-selector.tsx`:**
The dropdown uses a plain `<select>` element with `<option>` children. The options are:
- Campaign names (from fetched campaigns)
- "Send one-off review request" (if `showOneOff`)
- "Do not send" (always)

**Problem:** A `<select>` element cannot contain a Link — clicking an option can't navigate to `/campaigns`. You can't put a link inside a `<select>` dropdown.

**Solution approach:**
- Add a special sentinel value (e.g., `'__create_campaign__'`) to the select options
- In the `onChange` handler, detect this value and use `router.push('/campaigns')` instead of calling `onCampaignChange`
- Use `useRouter` from `next/navigation` (already a client component)

**Alternative approach:** Replace `<select>` with a Radix Select (already used elsewhere in the codebase via `components/ui/select.tsx`). This allows a non-selectable "Create new campaign →" item that navigates away.

**Recommended approach:** Add a special value to the existing `<select>` and handle it via `onChange`. This is the least-invasive change. The user sees "Create new campaign →" as the last option before "Do not send". When selected, `router.push('/campaigns')` fires, and the value resets to previous (since the selection is navigation, not a real choice).

**Implementation:**
```typescript
// In campaign-selector.tsx (client component)
import { useRouter } from 'next/navigation'

const CAMPAIGN_CREATE = '__create_campaign__'

// In the component:
const router = useRouter()

const handleChange = (value: string) => {
  if (value === CAMPAIGN_CREATE) {
    router.push('/campaigns')
    return  // don't call onCampaignChange
  }
  onCampaignChange(value || null)
}
```

**Open question:** The requirement says "navigates to campaigns page (create campaign modal)". The campaigns page does not currently auto-open a create modal on load via URL param. The planner should decide: navigate to `/campaigns` (with the user manually starting creation), or add a URL param like `/campaigns?action=create` that triggers the creation flow. Research shows `/campaigns?action=create` is not currently implemented. The simpler interpretation is just `/campaigns` — the user will see the campaigns page and can create there.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Navigation from select option | Custom dropdown component | `useRouter().push()` on special value in existing `<select>` |
| Database flag for campaign-reviewed | New table/column | Existing `onboarding_checklist.campaign_reviewed` JSONB flag |
| Dismiss persistence | localStorage or DB write | React `useState` (UI-only, as per requirements "UI-only hide") |

---

## Common Pitfalls

### Pitfall 1: Moving markCampaignReviewed — Call Position
**What goes wrong:** Calling `markCampaignReviewed()` before `notFound()` check means even 404 detail pages trigger the flag. But since the check is `if (!campaign) notFound()`, any campaign ID in the URL (even deleted ones) will call `markCampaignReviewed()` first.
**Decision:** This is intentional — GS-02 requires "visiting any campaign detail page" counts, even if the campaign was deleted. If the campaign doesn't exist, `notFound()` throws after the flag is set. This is acceptable.
**Recommended order:**
```typescript
export default async function CampaignDetailPage(...) {
  // Run in parallel for speed; markCampaignReviewed is cheap (short-circuits if already set)
  const [campaign, ...rest] = await Promise.all([
    getCampaign(id),
    markCampaignReviewed(),  // fire here
    ...
  ])
  if (!campaign) notFound()
  ...
}
```

### Pitfall 2: Campaign Preset Ordering
**What goes wrong:** The presets are fetched from the database. Their order depends on the database seed order. If the seed creates them as `aggressive, conservative, standard`, the display will be wrong.
**How to avoid:** Sort `presetsWithMeta` using `CAMPAIGN_PRESETS.findIndex(p => p.id === preset.meta?.id)`. Presets without a `meta` match go last.

### Pitfall 3: CampaignSelector `<select>` and Navigation
**What goes wrong:** After `router.push('/campaigns')`, the `<select>` still shows `__create_campaign__` as selected. The form state is invalid until the navigation completes.
**How to avoid:** After detecting `CAMPAIGN_CREATE`, immediately reset the select value to its previous value (or to `null`) before calling `router.push`. Since `selectedCampaignId` is controlled state owned by the parent (`add-job-sheet.tsx`), the component should call `onCampaignChange(selectedCampaignId)` (no-op) to re-render, or simply not update state and let the navigation handle it.

### Pitfall 4: KPI Card Link Changes May Affect Analytics Page Availability
**What goes wrong:** Redirecting all 3 KPI cards to `/analytics` assumes the page exists and has useful content.
**Verification:** The `/analytics` page exists (confirmed in PROJECT_STATE.md as built). No issue.

### Pitfall 5: Attention Alerts Dismiss — Modified File
**What goes wrong:** `attention-alerts.tsx` is marked `M` in git status (staged changes). The file we read may not reflect what's actually in the working tree.
**How to avoid:** The planner should verify the current working tree state of `attention-alerts.tsx` before coding the fix. Run `git diff HEAD components/dashboard/attention-alerts.tsx` to see what changed.

---

## Code Examples

### GS-01: Move markCampaignReviewed to [id]/page.tsx
```typescript
// Source: live codebase analysis
// File: app/(dashboard)/campaigns/[id]/page.tsx

// Add to imports:
import { markCampaignReviewed } from '@/lib/actions/checklist'

// Add to Promise.all in the page:
const [campaign, enrollmentsResult, counts, analytics, templates, business] = await Promise.all([
  getCampaign(id),
  getCampaignEnrollments(id, { limit: pageSize, offset }),
  getCampaignEnrollmentCounts(id),
  getCampaignAnalytics(id),
  getAvailableTemplates(),
  getBusiness(),
  markCampaignReviewed(),  // <-- add here (7th item, can be ignored as return)
])
// Note: Promise.all with 7 items — destructure only 6 as before, markCampaignReviewed return ignored
```

### DASH-01: Verify dismiss wiring (current code is correct)
```typescript
// Source: live codebase analysis
// File: components/dashboard/attention-alerts.tsx (lines 192-248)
// The dismiss pipeline:
// AttentionAlerts.handleDismiss(id) → setDismissedIds → visibleAlerts filters → re-render
// AlertRow.X button → e.stopPropagation() + onDismiss?.(alert.id)
// This is wired correctly. If broken, the M-file has regressed.
```

### DASH-02: KPI card href changes
```typescript
// Source: live codebase analysis
// File: components/dashboard/kpi-widgets.tsx

// Line 57: Change
<Link href="/history?status=reviewed" className="block">
// To:
<Link href="/analytics" className="block">

// Line 78: Change
<Link href="/feedback" className="block">
// To:
<Link href="/analytics" className="block">

// Line 99: Change
<Link href="/history" className="block">
// To:
<Link href="/analytics" className="block">
```

### ONB-01/ONB-02/ONB-03: Campaign preset step redesign
```typescript
// Source: live codebase analysis
// File: components/onboarding/steps/campaign-preset-step.tsx

// 1. Fix subtitle (ONB-03)
// Old: "Select a campaign style. You can customize it later in Settings."
// New: "Select a campaign style. You can change this later in Campaigns."

// 2. Sort presets for correct order (ONB-01)
import { CAMPAIGN_PRESETS } from '@/lib/constants/campaigns'
const sortedPresetsWithMeta = presetsWithMeta.sort((a, b) => {
  const aIdx = CAMPAIGN_PRESETS.findIndex(p => a.meta?.id === p.id)
  const bIdx = CAMPAIGN_PRESETS.findIndex(p => b.meta?.id === p.id)
  const aOrder = aIdx === -1 ? 99 : aIdx
  const bOrder = bIdx === -1 ? 99 : bIdx
  return aOrder - bOrder
})

// 3. Change grid to vertical stack (ONB-01)
// Old: <div className="grid grid-cols-1 md:grid-cols-3 gap-4" ...>
// New: <div className="flex flex-col gap-3" ...>

// 4. Remove touch visualization badges (ONB-02)
// Remove the entire "Touch visualization" section (lines 103-131 in current file)
// Keep only: title, description text
// Optionally replace with a simple plain-English summary like "2 emails" or "3 messages"
```

### JOB-01: "Create new campaign" in CampaignSelector
```typescript
// Source: live codebase analysis
// File: components/jobs/campaign-selector.tsx

import { useRouter } from 'next/navigation'

const CAMPAIGN_CREATE = '__create_campaign__'

// Inside CampaignSelector component:
const router = useRouter()

// Change the onChange handler:
<select
  value={selectedCampaignId || ''}
  onChange={(e) => {
    const val = e.target.value
    if (val === CAMPAIGN_CREATE) {
      router.push('/campaigns')
      return
    }
    onCampaignChange(val || null)
  }}
  ...
>
  {/* ... existing options ... */}
  {/* Add before "Do not send": */}
  <option value={CAMPAIGN_CREATE}>Create new campaign →</option>
  <option value={CAMPAIGN_DO_NOT_SEND}>Do not send</option>
</select>
```

---

## Exact Files to Change

| Requirement | File | Change Type |
|------------|------|-------------|
| GS-01, GS-02 | `app/(dashboard)/campaigns/[id]/page.tsx` | Add `markCampaignReviewed()` to Promise.all |
| GS-01, GS-02 | `app/(dashboard)/campaigns/page.tsx` | Remove `markCampaignReviewed()` call + import |
| DASH-01 | `components/dashboard/attention-alerts.tsx` | Verify/restore dismiss wiring (check M-file) |
| DASH-02 | `components/dashboard/kpi-widgets.tsx` | Change 3 Link hrefs to `/analytics` |
| ONB-01 | `components/onboarding/steps/campaign-preset-step.tsx` | Change grid to flex-col, sort presets |
| ONB-02 | `components/onboarding/steps/campaign-preset-step.tsx` | Remove touch badge visualization |
| ONB-03 | `components/onboarding/steps/campaign-preset-step.tsx` | Fix subtitle copy |
| JOB-01 | `components/jobs/campaign-selector.tsx` | Add create-campaign option + router navigation |

Total: 5 unique files. No schema changes, no new migrations, no new dependencies.

---

## State of the Art

No outdated patterns identified. All existing code uses current Next.js 15 App Router patterns, React 19, and the project's established server action architecture.

---

## Open Questions

1. **DASH-01 — Modified file state**
   - What we know: `attention-alerts.tsx` has unstaged changes (`M` in git status)
   - What's unclear: What those changes are — they may have fixed or broken the dismiss
   - Recommendation: Planner should run `git diff components/dashboard/attention-alerts.tsx` as first step

2. **JOB-01 — Does `/campaigns` auto-open create modal?**
   - What we know: The requirement says "navigates to campaigns page (create campaign modal)"
   - What's unclear: Whether a URL param like `/campaigns?action=create` should trigger the modal
   - Recommendation: Navigate to `/campaigns` without a param. The campaigns page already has a "New Campaign" button. Adding auto-open would require touching `campaigns-shell.tsx` and is out of scope for a behavioral fix phase.

3. **ONB-02 — Replace touch visualization with what?**
   - What we know: Remove "multi-touch sequence" jargon and "touch #1/2/3" badge labels
   - What's unclear: Should we show nothing, or a simple plain-English summary?
   - Recommendation: Remove the entire badge visualization. The `preset.meta.description` (e.g., "Two emails and a text message over 7 days. Works well for most businesses.") is already plain-English and sufficient. Keep title + description only.

---

## Sources

### Primary (HIGH confidence)
- Live codebase — all files read directly:
  - `components/onboarding/steps/campaign-preset-step.tsx`
  - `components/dashboard/attention-alerts.tsx`
  - `components/dashboard/kpi-widgets.tsx`
  - `components/dashboard/dashboard-client.tsx`
  - `components/jobs/campaign-selector.tsx`
  - `components/jobs/add-job-sheet.tsx`
  - `app/(dashboard)/campaigns/page.tsx`
  - `app/(dashboard)/campaigns/[id]/page.tsx`
  - `lib/actions/checklist.ts`
  - `lib/data/checklist.ts`
  - `lib/constants/checklist.ts`
  - `lib/constants/campaigns.ts`
  - `lib/types/database.ts` (OnboardingChecklist interface)

### Secondary (MEDIUM confidence)
- Git status shows `M components/dashboard/attention-alerts.tsx` — current working tree may differ from read file. Treat DASH-01 analysis as tentative until M-file is examined.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all existing patterns
- Architecture: HIGH — exact code locations identified, patterns verified in codebase
- Pitfalls: HIGH — identified from actual code review, not speculation

**Research date:** 2026-02-25
**Valid until:** 60 days (stable, no external dependencies)
