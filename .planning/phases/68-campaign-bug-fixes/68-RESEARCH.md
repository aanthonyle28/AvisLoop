# Phase 68: Campaign Bug Fixes - Research

**Researched:** 2026-03-03
**Domain:** Supabase migration application, server action error handling, UI label maps, template resolution
**Confidence:** HIGH

## Summary

This phase addresses four related campaign bugs found during QA (Phase 63). The root cause is a database migration (`20260226_add_frozen_enrollment_status.sql`) that was created in Phase 46 but never applied to the production database. The CHECK constraint on `campaign_enrollments.status` only allows `('active', 'completed', 'stopped')`, blocking the `'frozen'` value. The `toggleCampaignStatus()` server action silently swallows the constraint violation error because it does not check the return value of the enrollment update query. Three downstream bugs (missing label, missing stat card, wrong template preview) are also addressed.

All four bugs are well-understood with exact file locations, line numbers, and precise fixes documented in QA reports. The codebase already has the correct TypeScript types (`EnrollmentStatus = 'active' | 'completed' | 'stopped' | 'frozen'`), the data function (`getCampaignEnrollmentCounts`) already returns a `frozen` count, and the migration SQL file already exists. This is a mechanical fix phase with no design decisions needed.

**Primary recommendation:** Apply the existing migration SQL, add error handling to `toggleCampaignStatus()`, then fix the three UI gaps (label, stat card, template fallback) in a single plan.

## Standard Stack

No new libraries needed. All fixes use existing project infrastructure.

### Core (already in project)
| Library | Version | Purpose | Relevance to Phase |
|---------|---------|---------|-------------------|
| @supabase/supabase-js | latest | Database client | Migration application + query error handling |
| sonner | ^2.0.7 | Toast notifications | Error surfacing to user on constraint violation |
| Next.js App Router | latest | Server actions + revalidation | `toggleCampaignStatus()` error path |

### No New Dependencies
This phase requires zero new packages.

## Architecture Patterns

### Pattern 1: Migration Application
**What:** The migration file `supabase/migrations/20260226_add_frozen_enrollment_status.sql` already exists and is correct. It needs to be applied to the production database.
**Exact SQL (from existing migration file):**
```sql
-- 1. ALTER the status CHECK constraint to include 'frozen'
ALTER TABLE public.campaign_enrollments
  DROP CONSTRAINT enrollments_status_valid,
  ADD CONSTRAINT enrollments_status_valid CHECK (
    status IN ('active', 'completed', 'stopped', 'frozen')
  );

-- 2. Expand the partial unique index
DROP INDEX IF EXISTS idx_enrollments_unique_active;
CREATE UNIQUE INDEX idx_enrollments_unique_active
  ON public.campaign_enrollments (customer_id, campaign_id)
  WHERE status IN ('active', 'frozen');
```
**Application methods:** `supabase db push` (remote) or `supabase db reset` (local). The migration file already exists at the correct path.

### Pattern 2: Server Action Error Handling
**What:** The `toggleCampaignStatus()` function in `lib/actions/campaign.ts` has two `await supabase.from('campaign_enrollments').update(...)` calls (lines 425-429 for pause, lines 453-456 for resume) that do not check the `error` return value.
**Current code (line 425-429, the pause path):**
```typescript
// If pausing, freeze active enrollments
if (newStatus === 'paused') {
  await supabase
    .from('campaign_enrollments')
    .update({ status: 'frozen' })
    .eq('campaign_id', campaignId)
    .eq('status', 'active')
}
```
**Fixed pattern:**
```typescript
if (newStatus === 'paused') {
  const { error: freezeError } = await supabase
    .from('campaign_enrollments')
    .update({ status: 'frozen' })
    .eq('campaign_id', campaignId)
    .eq('status', 'active')

  if (freezeError) {
    // Revert campaign status back to active since enrollment freeze failed
    await supabase
      .from('campaigns')
      .update({ status: 'active' })
      .eq('id', campaignId)
    return { error: 'Failed to pause campaign enrollments. Please try again.' }
  }
}
```
**Same pattern for the resume path (lines 442-457):** Capture `{ error: unfreezeError }` from each enrollment update, and if any fails, revert the campaign status back to `'paused'`.

### Pattern 3: Label Map Addition
**What:** `ENROLLMENT_STATUS_LABELS` in `lib/constants/campaigns.ts` (lines 88-92) is missing the `frozen` key.
**Current code:**
```typescript
export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  stopped: 'Stopped',
}
```
**Fixed code:**
```typescript
export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  stopped: 'Stopped',
  frozen: 'Frozen',
}
```
**Consumer:** `app/(dashboard)/campaigns/[id]/page.tsx` line 183 renders `{ENROLLMENT_STATUS_LABELS[enrollment.status]}` -- currently returns `undefined` for frozen enrollments, producing an empty Badge.

### Pattern 4: Stat Card Addition
**What:** Campaign detail page (`app/(dashboard)/campaigns/[id]/page.tsx` lines 97-116) shows 3 stat cards (Active, Completed, Stopped). A 4th "Frozen" card is needed.
**Data already available:** `getCampaignEnrollmentCounts()` in `lib/data/campaign.ts` (lines 192-232) already returns `{ active, completed, stopped, frozen }` -- the `frozen` count is queried but never displayed.
**Grid change:** Change `grid-cols-3` to `grid-cols-4` on line 97, and add:
```tsx
<Card className="bg-muted/40">
  <CardContent className="pt-5 pb-4 px-5">
    <p className="text-xs text-muted-foreground font-medium mb-1">Frozen</p>
    <p className="text-2xl font-bold">{counts.frozen}</p>
  </CardContent>
</Card>
```

### Pattern 5: Template Resolution Fix
**What:** `resolveTemplate()` in `components/campaigns/touch-sequence-display.tsx` (lines 22-38) falls back to `templates.find(t => t.is_default && t.channel === touch.channel)` which picks the first alphabetical system template for that channel, ignoring the campaign's service type.
**Root cause:** The component does not receive the campaign's `service_type`. The `TouchSequenceDisplayProps` interface only has `touches` and `templates`.
**Fix:** Add `serviceType` prop to the component and use it in the fallback:
```typescript
interface TouchSequenceDisplayProps {
  touches: TouchData[]
  templates: MessageTemplate[]
  serviceType?: string | null  // campaign service type for template resolution
}

function resolveTemplate(
  touch: TouchData,
  templates: MessageTemplate[],
  serviceType?: string | null
): { name: string; subject: string; body: string; channel: 'email' | 'sms' } | null {
  if (touch.template_id) {
    const found = templates.find(t => t.id === touch.template_id)
    return found
      ? { name: found.name, subject: found.subject, body: found.body, channel: touch.channel }
      : null
  }
  // First try: match service type + channel
  if (serviceType) {
    const serviceMatch = templates.find(
      t => t.is_default && t.channel === touch.channel && t.service_type === serviceType
    )
    if (serviceMatch) {
      return { name: serviceMatch.name, subject: serviceMatch.subject, body: serviceMatch.body, channel: touch.channel }
    }
  }
  // Fallback: any system template for this channel
  const systemTemplate = templates.find(
    t => t.is_default && t.channel === touch.channel
  )
  return systemTemplate
    ? { name: systemTemplate.name, subject: systemTemplate.subject, body: systemTemplate.body, channel: touch.channel }
    : null
}
```
**Caller update (page.tsx line 133-136):** Pass `serviceType={campaign.service_type}`:
```tsx
<TouchSequenceDisplay
  touches={campaign.campaign_touches}
  templates={templates}
  serviceType={campaign.service_type}
/>
```

### Anti-Patterns to Avoid
- **Silent error swallowing on Supabase updates:** Always destructure `{ error }` from Supabase mutations and handle failures. The current `await supabase.from(...).update(...)` without checking the return is exactly this anti-pattern.
- **Partial state changes without rollback:** When `toggleCampaignStatus` updates the campaign status to 'paused' but then fails to freeze enrollments, the system is in an inconsistent state (campaign paused, enrollments still active). Always implement rollback on failure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom alert system | `sonner` toast (already used) | Consistent with rest of app |
| Migration application | Custom SQL scripts | `supabase db push` CLI | Standard Supabase workflow |
| Enrollment count queries | New data functions | `getCampaignEnrollmentCounts()` (already exists) | Already returns `frozen` count |

## Common Pitfalls

### Pitfall 1: Constraint Name Mismatch
**What goes wrong:** The `DROP CONSTRAINT` call fails because the constraint has a different name than expected.
**Why it happens:** Supabase/Postgres sometimes auto-generates constraint names differently from what was specified in `CREATE TABLE`.
**How to avoid:** The existing migration file uses `enrollments_status_valid` which matches the name in the original `20260204_create_campaign_enrollments.sql` (line 45). This is verified. If applying manually, run `SELECT conname FROM pg_constraint WHERE conrelid = 'campaign_enrollments'::regclass;` first.
**Warning signs:** Migration fails with "constraint does not exist" error.

### Pitfall 2: Forgetting to Handle Both Pause AND Resume Error Paths
**What goes wrong:** Error handling is added for the pause path (freezing enrollments) but not for the resume path (unfreezing enrollments and updating scheduled times).
**Why it happens:** The resume path at lines 432-457 has a `for` loop that updates individual enrollments. Each update could fail.
**How to avoid:** Wrap the resume logic with error accumulation. If any enrollment fails to unfreeze, log the error but continue processing the rest, then return a warning.
**Warning signs:** Campaign shows "resumed" but some enrollments remain frozen.

### Pitfall 3: Grid Responsiveness When Adding 4th Stat Card
**What goes wrong:** Changing `grid-cols-3` to `grid-cols-4` may look cramped on mobile.
**Why it happens:** 4 cards at 390px width gives ~97px per card, which is tight.
**How to avoid:** Use responsive grid: `grid-cols-2 sm:grid-cols-4` so mobile shows 2x2, desktop shows 1x4.
**Warning signs:** Cards overflow or text truncates on small screens.

### Pitfall 4: Badge Variant for Frozen Status
**What goes wrong:** The enrollment list Badge (page.tsx lines 176-184) has variant logic that only handles `active`, `completed`, and falls through to `outline`. Frozen enrollments will render with `outline` variant, which is the same as `stopped`.
**Why it happens:** The ternary chain doesn't include a `frozen` case.
**How to avoid:** Add explicit handling: `enrollment.status === 'frozen' ? 'secondary' : 'outline'` or use a distinct variant like `'outline'` with a specific color class.
**Warning signs:** Frozen and stopped enrollments look identical in the enrollment list.

### Pitfall 5: Template Resolution Prop Threading
**What goes wrong:** The `serviceType` prop is added to `TouchSequenceDisplay` but not passed at the call site.
**Why it happens:** There is exactly one call site (page.tsx line 133), which is easy to verify, but could be missed in a larger refactor.
**How to avoid:** The call site already has `campaign.service_type` available from the `getCampaign()` result on line 42. Just add the prop.
**Warning signs:** Template previews still show wrong service type after the fix.

## Code Examples

### Verified: Current toggleCampaignStatus Error Flow (from lib/actions/campaign.ts)
```typescript
// Source: lib/actions/campaign.ts lines 398-463
// CURRENT (broken): the enrollment update on lines 425-429 does not check error
// The supabase update returns { data, error } but error is discarded
export async function toggleCampaignStatus(campaignId: string): Promise<ActionState> {
  // ... campaign status update (line 414-418) DOES check error ...

  if (newStatus === 'paused') {
    // BUG: error not captured
    await supabase
      .from('campaign_enrollments')
      .update({ status: 'frozen' })
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
  }
  // ... returns { success: true } even if enrollment update failed ...
}
```

### Verified: getCampaignEnrollmentCounts Already Returns Frozen Count
```typescript
// Source: lib/data/campaign.ts lines 192-232
// The data layer already queries for frozen count -- the UI just doesn't display it
export async function getCampaignEnrollmentCounts(campaignId: string): Promise<{
  active: number
  completed: number
  stopped: number
  frozen: number  // <-- already here
}> {
  // ... 4 parallel count queries including frozen ...
}
```

### Verified: Enrollment Status Badge Rendering (from page.tsx)
```tsx
// Source: app/(dashboard)/campaigns/[id]/page.tsx lines 176-184
<Badge
  variant={
    enrollment.status === 'active' ? 'default' :
    enrollment.status === 'completed' ? 'secondary' :
    'outline'  // frozen falls through here, same as stopped
  }
>
  {ENROLLMENT_STATUS_LABELS[enrollment.status]}
  {/* frozen -> undefined -> empty badge text */}
</Badge>
```

### Verified: TouchSequenceDisplay Call Site
```tsx
// Source: app/(dashboard)/campaigns/[id]/page.tsx lines 133-136
// campaign.service_type is available from line 42 getCampaign() result
<TouchSequenceDisplay
  touches={campaign.campaign_touches}
  templates={templates}
  // serviceType={campaign.service_type}  <-- needs to be added
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Enrollments stopped on campaign pause | Enrollments frozen (preserving position) | Phase 46, 2026-02-26 | Migration never applied, so old behavior persists |
| No error handling on enrollment updates | Must capture and handle errors | This phase (68) | Prevents silent failures |

**Current state:**
- TypeScript types already include `'frozen'` in `EnrollmentStatus` (since Phase 46)
- Data layer already queries frozen counts (since Phase 46)
- Server action code already attempts to set `'frozen'` status (since Phase 46)
- Database constraint blocks the value (migration gap)
- UI labels and stat cards never updated (oversight from Phase 46)

## Open Questions

No open questions. All four bugs have well-defined, verified fixes.

1. **Badge variant for frozen enrollments**
   - What we know: The current ternary defaults to `'outline'` for anything not `active` or `completed`, meaning frozen and stopped look the same
   - What's unclear: Whether frozen should have a distinct visual treatment (different color/variant)
   - Recommendation: Use `'secondary'` variant for frozen (same as completed) or add a blue-tinted outline to visually distinguish from stopped. Low priority -- the label text "Frozen" is sufficient differentiation.

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/20260226_add_frozen_enrollment_status.sql` -- exact migration SQL verified
- `supabase/migrations/20260204_create_campaign_enrollments.sql` -- original constraint name `enrollments_status_valid` verified at line 45
- `lib/actions/campaign.ts` -- `toggleCampaignStatus()` code verified, error swallowing confirmed at lines 425-429
- `lib/constants/campaigns.ts` -- `ENROLLMENT_STATUS_LABELS` verified missing `frozen` key at lines 88-92
- `lib/data/campaign.ts` -- `getCampaignEnrollmentCounts()` verified returning frozen count at lines 192-232
- `app/(dashboard)/campaigns/[id]/page.tsx` -- stat cards verified at lines 97-116, enrollment Badge at lines 176-184
- `components/campaigns/touch-sequence-display.tsx` -- `resolveTemplate()` verified at lines 22-38
- `lib/types/database.ts` -- `EnrollmentStatus` type verified including `'frozen'` at line 324
- `docs/qa-v3.1/63-campaigns.md` -- QA report with reproduction steps and fixes
- `docs/qa-v3.1/SUMMARY-REPORT.md` -- Bug prioritization and fix recommendations

### Secondary (MEDIUM confidence)
- `qa-scripts/fix-constraint.js` -- Confirms migration was never applied to production database

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all fixes use existing infrastructure
- Architecture: HIGH -- exact code locations, line numbers, and fixes verified from source
- Pitfalls: HIGH -- well-understood failure modes from QA investigation

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days -- stable, no external dependency changes)
