# Phase 46: Drawer Consistency + Campaign Freeze Fix - Research

**Researched:** 2026-02-25
**Domain:** Radix Sheet (shadcn/ui) drawer patterns, Supabase constraint migrations, campaign enrollment state machine
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## Summary

Phase 46 has two independent workstreams:

1. **Drawer consistency (DRW-01 through DRW-04):** Six drawers need unified structure — white-background rounded content sections (no Separator dividers), sticky footer with action buttons, consistent widths, and consistent button size/variant/placement. The "reference pattern" is `request-detail-drawer.tsx` which uses `<div className="mt-6 space-y-6">` with plain section headings and inline `border-t` dividers (NOT Separator components), at `sm:max-w-lg` width.

2. **Campaign freeze fix (CAMP-01 through CAMP-03):** Currently, pausing a campaign **permanently destroys** active enrollments by setting them to `status='stopped'` with `stop_reason='campaign_paused'`. The fix introduces a `frozen` enrollment status that preserves touch position, and resuming the campaign unfreezes them back to `active`.

**Primary recommendation:** Ship the database migration (46-01) first since it unblocks all campaign work. Ship DrawerLayout foundation (46-03) second since it unblocks all drawer migrations. Then execute campaign logic (46-02) and drawer application (46-04, 46-05) in parallel.

---

## Standard Stack

This phase uses only what is already installed. No new packages.

### Core (already in project)

| Library | Purpose | Version |
|---------|---------|---------|
| `@radix-ui/react-dialog` | Sheet primitive (used as Drawer) | via `@radix-ui/react-dialog` |
| `class-variance-authority` | Button variant system (soft variant from Phase 45) | `^0.7.1` |
| `@supabase/supabase-js` | Database queries, enrollment status updates | latest |
| `tailwindcss` | Styling classes for drawer layout | `^3.4.1` |

### No New Installations Needed

All work is Tailwind class restructuring, TypeScript type updates, SQL migration, and server action logic changes.

---

## Architecture Patterns

### Pattern 1: Current Drawer Width Inconsistency

| Drawer | SheetContent className | Effective Max Width |
|--------|----------------------|---------------------|
| Add Job | `className="overflow-y-auto"` (default) | 384px (`sm:max-w-sm`) |
| Edit Job | `className="overflow-y-auto"` (default) | 384px (`sm:max-w-sm`) |
| Job Detail | `className="sm:max-w-lg overflow-y-auto"` | 512px (`sm:max-w-lg`) |
| Customer Detail | `className='sm:max-w-lg overflow-y-auto'` | 512px (`sm:max-w-lg`) |
| Add Customer | `className='w-[400px] sm:w-[540px] overflow-y-auto'` | 540px (custom) |
| Edit Customer | `className='w-[400px] sm:w-[540px] overflow-y-auto'` | 540px (custom) |
| Request Detail (REFERENCE) | `className="sm:max-w-lg overflow-y-auto"` | 512px (`sm:max-w-lg`) |

**DRW-04 target:** All drawers should use `sm:max-w-lg` (512px) to match the reference pattern.

### Pattern 2: Current Content Grouping Inconsistency

**Reference pattern (request-detail-drawer.tsx):**
- Content in `<div className="mt-6 space-y-6">`
- Sections use `<h3 className="text-sm font-medium mb-3">` headings
- NO `<Separator />` components
- Some sections use `border-t pt-6` for visual separation (but this is for conditional sections like Resend/Cancel, not all sections)
- Primary content sections have no borders at all

**Success criteria says:** "white-background rounded sections with no borders or dividers"

This means the DRW target is:
- Content grouped in `bg-card rounded-lg p-4` (or `bg-background`) sections
- NO `<Separator />` dividers between sections
- NO borders on sections (per "no borders or dividers")
- Sections have natural spacing via `space-y-4` or `space-y-6`

**Current drawer separator usage:**
| Drawer | Separator count | Location |
|--------|----------------|----------|
| Job Detail | 4 `<Separator />` | Between Customer, Job Info, Campaign, Notes, Actions sections |
| Customer Detail | 4 `<Separator />` | Between Contact, Notes, SMS Consent, Activity, Actions sections |
| Edit Customer | 2 `<Separator />` | Between Form, SMS Consent, Activity sections |
| Add Job | 0 | Form sections use `space-y-4` only |
| Edit Job | 0 | Form sections use `space-y-4` only |
| Add Customer | 0 | Form with `space-y-4` |

### Pattern 3: Current Footer/Action Button Patterns

| Drawer | Action Placement | Button Pattern |
|--------|-----------------|----------------|
| Add Job | `<div className="flex justify-end gap-2 pt-4">` inside form | Cancel (outline) + Submit (default), right-aligned, normal size |
| Edit Job | `<div className="flex justify-end gap-2 pt-4">` inside form | Cancel (outline) + Submit (default), right-aligned, normal size |
| Job Detail | `<div className="space-y-2">` at end of content | Full-width stacked: Complete (outline+green), Edit (outline), Delete (outline+red) |
| Customer Detail | `<div className='space-y-2'>` at end of content | Full-width stacked: Send (default), Edit (outline), Archive (outline), History (ghost) |
| Add Customer | `<div className='flex flex-col gap-2 pt-2'>` inside form | Full-width stacked: Add (default) + Save & Add Another (outline) |
| Edit Customer | Single `<Button>` inside form | Full-width: Save (default) |

**DRW-02 target:** All drawer action buttons must remain visible at bottom without scrolling — footer is sticky regardless of content height.

**DRW-03 target:** Job detail drawer buttons should be consistent with other drawers (same size, variant, placement). Currently job detail uses `variant="outline"` with custom color overrides for all 3 buttons, while customer detail uses `variant="default"` for primary + `variant="outline"` for secondary.

### Pattern 4: SheetContent Flex Layout (Foundation)

Current `SheetContent` base classes (sheet.tsx line 63):
```
bg-background fixed z-50 flex flex-col gap-4 shadow-lg px-8
```

The container IS already `flex flex-col`. To make the footer sticky:
1. Content area needs `overflow-y-auto flex-1 min-h-0` (scrollable body)
2. Footer needs `shrink-0` (never shrinks, stays at bottom)
3. Header needs `shrink-0` (never shrinks, stays at top)

The Phase 46-03 plan needs to create wrapper components (`SheetBody` or similar) that apply these flex properties so that individual drawers just use them.

### Pattern 5: Campaign Enrollment Status Constraint

**File:** `supabase/migrations/20260204_create_campaign_enrollments.sql` (lines 44-47)

```sql
CONSTRAINT enrollments_status_valid CHECK (
  status IN ('active', 'completed', 'stopped')
)
```

**Must ADD `'frozen'` to this constraint.**

Also at line 50-61, the stop_reason constraint includes `'campaign_paused'`. With the freeze model, `campaign_paused` stop reason should be deprecated/unused since pausing no longer stops enrollments.

### Pattern 6: TypeScript Enrollment Status Type

**File:** `lib/types/database.ts` (line 311)

```typescript
export type EnrollmentStatus = 'active' | 'completed' | 'stopped'
```

**Must add `'frozen'` here too.**

### Pattern 7: Campaign Enrollment Cron Query (claim_due_campaign_touches)

**File:** `supabase/migrations/20260204_claim_due_campaign_touches.sql`

All four UNION branches filter with `WHERE e.status = 'active'`. Since `frozen` is a new distinct status, frozen enrollments will be **automatically excluded** from cron processing. No RPC change needed.

**This is the key insight:** Because the cron RPC only claims `status = 'active'` rows, adding `frozen` as a separate status means frozen enrollments are silently skipped by the cron. No code change needed in the RPC.

### Pattern 8: Current toggleCampaignStatus Behavior (THE BUG)

**File:** `lib/actions/campaign.ts` (lines 433-477)

```typescript
// If pausing, stop all active enrollments
if (newStatus === 'paused') {
  await supabase
    .from('campaign_enrollments')
    .update({
      status: 'stopped',
      stop_reason: 'campaign_paused',
      stopped_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('status', 'active')
}
```

**The bug:** Setting `status='stopped'` is permanent. There is no resume path — when the campaign is re-activated, the enrollments stay stopped. The fix must:

1. **On pause:** Set `status='frozen'` (not `stopped`) for all active enrollments. Do NOT set `stop_reason` or `stopped_at` — these are terminal fields.
2. **On resume:** Set `status='active'` for all `frozen` enrollments in this campaign. Touch positions (`current_touch`, `touch_N_scheduled_at`) are preserved because they were never modified.
3. **Scheduled time adjustment on resume:** Frozen enrollments may have `touch_N_scheduled_at` times in the past. On unfreeze, the next due touch's scheduled time must be shifted forward to `NOW() + some_buffer` so it processes in the next cron cycle. Otherwise, all touches fire immediately on resume.

### Pattern 9: deleteCampaign Impact on Frozen Rows

**File:** `lib/actions/campaign.ts` (lines 229-361)

The `deleteCampaign` function currently handles only `status='active'` enrollments for reassignment/stopping. With `frozen` status, these queries must also handle frozen enrollments:

1. **Line 202-203 (getCampaignDeletionInfo):** `.eq('status', 'active')` — must also count frozen: `.in('status', ['active', 'frozen'])`
2. **Lines 262-268 (fetch active for reassign):** `.eq('status', 'active')` — must include frozen
3. **Lines 270-279 (stop active):** `.eq('status', 'active')` — must include frozen
4. **Lines 328-340 (stop without reassign):** `.eq('status', 'active')` — must include frozen

### Pattern 10: Conflict Resolver Cron Edge Case

**File:** `app/api/cron/resolve-enrollment-conflicts/route.ts`

Task B checks for active enrollments on a customer. If a campaign is paused and enrollments are `frozen`, the conflict resolver would NOT find an active enrollment and might incorrectly enroll the queued job. This needs an audit:

**Line 95-101:**
```typescript
const { data: activeEnrollment } = await supabase
  .from('campaign_enrollments')
  .select('id')
  .eq('customer_id', job.customer_id)
  .eq('business_id', job.business_id)
  .eq('status', 'active')
  .maybeSingle()
```

This must also check for `frozen` status. A frozen enrollment IS still conceptually "in progress" — the customer hasn't completed the sequence, it's just paused. The fix:
```typescript
.in('status', ['active', 'frozen'])
```

Similarly, **Task A (stale conflict resolution)** at line 54-64 should also check for frozen enrollments when canceling a customer's active sequences. But this is less critical since Task A is resolving stale conflicts — if the campaign is paused and enrollments are frozen, we probably still want to allow conflict resolution.

### Pattern 11: Dashboard Enrollment Queries

**File:** `lib/data/dashboard.ts`

Multiple places query `.eq('status', 'active')` for enrollment counts. These should be audited:

| Line | Purpose | Should include frozen? |
|------|---------|----------------------|
| 131 | Active sequences KPI count | Yes — frozen enrollments ARE active sequences (paused) |
| 138 | Active sequences 7 days ago | Maybe — depends on if we want to show trend |
| 280 | Ready-to-send queue enrolled check | No — only truly active enrollments |
| 320 | Conflict detection for queued jobs | Yes — frozen counts as "customer has in-progress sequence" |
| 351 | Preflight conflict detection | Yes — same reason |
| 784-804 | Job detail enrichment | Yes — for display purposes |

This is a significant surface area. The planner should decide whether to make a centralized helper like `isEnrollmentInProgress(status)` that checks for both `active` and `frozen`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ALTER CHECK constraint | Drop and recreate in a single migration | Standard `ALTER TABLE DROP CONSTRAINT ... ADD CONSTRAINT` pattern | Postgres CHECK constraints cannot be modified in-place |
| Sticky drawer footer | Custom CSS positioning | Flex layout: `flex-1 overflow-y-auto min-h-0` for body + `shrink-0` for footer | Standard flex pattern, no hacks needed |
| Frozen → Active status restoration | Custom RPC or multi-step logic | Single `.update({ status: 'active' }).eq('status', 'frozen').eq('campaign_id', ...)` | Supabase handles this atomically |
| Scheduled time recalculation on unfreeze | Complex per-touch calculation | Simple approach: set next touch scheduled_at to MAX(original, NOW()) | Preserves original timing if still in the future, bumps to now if in the past |

---

## Common Pitfalls

### Pitfall 1: ALTER CHECK Constraint Syntax

**What goes wrong:** Trying to modify an existing CHECK constraint directly.
**Why it happens:** Postgres does not support ALTER CONSTRAINT for CHECK constraints.
**How to avoid:** Use `ALTER TABLE ... DROP CONSTRAINT enrollments_status_valid, ADD CONSTRAINT enrollments_status_valid CHECK (status IN ('active', 'completed', 'stopped', 'frozen'))` in a single migration.
**Warning signs:** Migration fails with "cannot alter constraint" error.

### Pitfall 2: Frozen Enrollments Have Stale Scheduled Times

**What goes wrong:** After unfreezing, all touches fire immediately because their `touch_N_scheduled_at` is in the past.
**Why it happens:** Time passed while the enrollment was frozen, but scheduled times weren't updated.
**How to avoid:** On unfreeze (resume), for each enrollment, find the next pending touch and set its `scheduled_at` to `MAX(original_scheduled_at, NOW())`. This ensures:
- If the touch was scheduled for the future, it keeps its original time
- If the touch was scheduled for the past (during freeze period), it's bumped to now
**Warning signs:** Burst of emails/SMS immediately after resuming a campaign.

### Pitfall 3: Unique Active Constraint Interaction

**What goes wrong:** The partial unique index `idx_enrollments_unique_active ON (customer_id, campaign_id) WHERE status = 'active'` allows multiple frozen enrollments for the same customer+campaign if not careful.
**Why it happens:** The unique constraint only applies where `status = 'active'`. A frozen enrollment + a new active enrollment for the same customer+campaign would NOT violate it.
**How to avoid:** The conflict checker must treat `frozen` as equivalent to `active` when checking for existing enrollments. The unique index should probably be expanded: `WHERE status IN ('active', 'frozen')`.
**Warning signs:** Duplicate enrollments appearing after campaign resume.

### Pitfall 4: SheetContent Already Has gap-4

**What goes wrong:** Adding a scrollable body div inside SheetContent while the parent has `gap-4` creates unexpected spacing.
**Why it happens:** SheetContent uses `flex flex-col gap-4`. When you add SheetHeader + scrollable body + SheetFooter as direct children, the gap applies between all three, which may create inconsistent spacing vs the current approach.
**How to avoid:** Either:
- Remove `gap-4` from SheetContent base classes and let children manage their own spacing
- OR keep `gap-4` and account for it in body/footer padding
**Recommended:** Keep `gap-4` as it provides consistent baseline spacing between header, body, and footer. Just ensure the body div has `overflow-y-auto flex-1 min-h-0` to handle the scroll.

### Pitfall 5: Form Submissions Inside Scrollable Body

**What goes wrong:** Moving form submit buttons into a sticky SheetFooter while the form is in the scrollable body means the button is OUTSIDE the form element.
**Why it happens:** The sticky footer lives as a sibling of the scrollable body, not inside the `<form>`.
**How to avoid:** Two options:
1. **Wrap the entire content + footer in the `<form>`** — form spans both body and footer
2. **Use `form="formId"` attribute on the submit button** — HTML form association
Option 1 is simpler and is the recommended approach. The `<form>` wraps both the scrollable body and the footer. The body scrolls while the footer stays fixed.

### Pitfall 6: deleteCampaign Missing Frozen Enrollments

**What goes wrong:** Deleting a campaign while it's paused leaves frozen enrollments orphaned (the cascade will handle the DB rows, but the reassignment logic skips them).
**Why it happens:** The reassignment logic in deleteCampaign only fetches `.eq('status', 'active')` enrollments, missing frozen ones.
**How to avoid:** Update all enrollment queries in deleteCampaign to use `.in('status', ['active', 'frozen'])`.

### Pitfall 7: Conflict Resolver Processes Queued Jobs for Frozen Campaigns

**What goes wrong:** A job queued with `enrollment_resolution='queue_after'` gets enrolled while its target campaign is paused (because the frozen enrollment is not detected as "active").
**Why it happens:** The conflict resolver only checks for `status='active'` enrollments. Frozen enrollments are invisible to it.
**How to avoid:** Update conflict resolver to check `.in('status', ['active', 'frozen'])` when looking for active enrollments.

---

## Code Examples

### SQL Migration: Add frozen to constraint

```sql
-- Add 'frozen' to enrollment status constraint
ALTER TABLE public.campaign_enrollments
  DROP CONSTRAINT enrollments_status_valid,
  ADD CONSTRAINT enrollments_status_valid CHECK (
    status IN ('active', 'completed', 'stopped', 'frozen')
  );

-- Expand unique index to include frozen (prevents duplicate frozen+active)
DROP INDEX IF EXISTS idx_enrollments_unique_active;
CREATE UNIQUE INDEX idx_enrollments_unique_active
  ON public.campaign_enrollments (customer_id, campaign_id)
  WHERE status IN ('active', 'frozen');
```

### TypeScript: Updated EnrollmentStatus type

```typescript
// lib/types/database.ts
export type EnrollmentStatus = 'active' | 'completed' | 'stopped' | 'frozen'
```

### toggleCampaignStatus: Freeze on pause

```typescript
// On pause: freeze instead of stop
if (newStatus === 'paused') {
  await supabase
    .from('campaign_enrollments')
    .update({ status: 'frozen' })
    .eq('campaign_id', campaignId)
    .eq('status', 'active')
}

// On resume: unfreeze and adjust scheduled times
if (newStatus === 'active') {
  // Get all frozen enrollments for this campaign
  const { data: frozenEnrollments } = await supabase
    .from('campaign_enrollments')
    .select('id, current_touch, touch_1_scheduled_at, touch_2_scheduled_at, touch_3_scheduled_at, touch_4_scheduled_at')
    .eq('campaign_id', campaignId)
    .eq('status', 'frozen')

  const now = new Date().toISOString()

  for (const enrollment of frozenEnrollments || []) {
    const touchKey = `touch_${enrollment.current_touch}_scheduled_at` as keyof typeof enrollment
    const originalScheduled = enrollment[touchKey] as string | null

    const updateData: Record<string, unknown> = { status: 'active' }

    // If the next touch was scheduled in the past, bump to now
    if (originalScheduled && new Date(originalScheduled) < new Date()) {
      updateData[`touch_${enrollment.current_touch}_scheduled_at`] = now
    }

    await supabase
      .from('campaign_enrollments')
      .update(updateData)
      .eq('id', enrollment.id)
  }
}
```

### Sticky Footer Structure

```tsx
// Inside SheetContent (which is flex flex-col):
<SheetHeader className="shrink-0">
  <SheetTitle>Title</SheetTitle>
  <SheetDescription>Description</SheetDescription>
</SheetHeader>

{/* Scrollable body */}
<div className="flex-1 overflow-y-auto min-h-0 -mx-8 px-8">
  {/* Content sections with white bg */}
  <div className="space-y-4">
    <div className="rounded-lg bg-card p-4">
      {/* Section 1 content */}
    </div>
    <div className="rounded-lg bg-card p-4">
      {/* Section 2 content */}
    </div>
  </div>
</div>

{/* Sticky footer */}
<div className="shrink-0 border-t pt-4">
  <div className="flex gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Submit</Button>
  </div>
</div>
```

Note: The `-mx-8 px-8` on the body compensates for SheetContent's `px-8`, ensuring the scroll area extends edge-to-edge while content has proper padding.

### Conflict Resolver: Include frozen check

```typescript
// resolve-enrollment-conflicts/route.ts, Task B
const { data: activeEnrollment } = await supabase
  .from('campaign_enrollments')
  .select('id')
  .eq('customer_id', job.customer_id)
  .eq('business_id', job.business_id)
  .in('status', ['active', 'frozen'])  // frozen = still in progress
  .maybeSingle()
```

---

## File Inventory

### Campaign Freeze (46-01, 46-02)

| File | Plan | Changes |
|------|------|---------|
| `supabase/migrations/YYYYMMDD_add_frozen_enrollment_status.sql` | 46-01 | New migration: ALTER constraint, expand unique index |
| `lib/types/database.ts` | 46-01 | Add `'frozen'` to `EnrollmentStatus` type |
| `lib/actions/campaign.ts` | 46-01 + 46-02 | Update `toggleCampaignStatus` (freeze/unfreeze); update `deleteCampaign` to include frozen; update `getCampaignDeletionInfo` to count frozen |
| `app/api/cron/resolve-enrollment-conflicts/route.ts` | 46-02 | Add frozen check to Task B active enrollment query |
| `lib/data/campaign.ts` | 46-02 | Add frozen count to `getCampaignEnrollmentCounts`; update `GetCampaignEnrollmentsOptions` status filter |
| `lib/data/dashboard.ts` | 46-02 | Audit enrollment status queries — include frozen where appropriate |
| `lib/actions/enrollment.ts` | 46-02 | `checkEnrollmentConflict`: include frozen in active enrollment check |

### Drawer Consistency (46-03, 46-04, 46-05)

| File | Plan | Changes |
|------|------|---------|
| `components/ui/sheet.tsx` | 46-03 | Add `SheetBody` component (optional), ensure `SheetHeader` and `SheetFooter` have `shrink-0` |
| `components/jobs/add-job-sheet.tsx` | 46-04 | Width → `sm:max-w-lg`; content in white sections; sticky footer with form buttons |
| `components/jobs/edit-job-sheet.tsx` | 46-04 | Width → `sm:max-w-lg`; content in white sections; sticky footer with form buttons |
| `components/jobs/job-detail-drawer.tsx` | 46-05 | Remove Separators; content in white sections; sticky footer with consistent button sizes/variants |
| `components/customers/customer-detail-drawer.tsx` | 46-05 | Remove Separators; content in white sections; sticky footer with consistent buttons |
| `components/customers/add-customer-sheet.tsx` | 46-05 (or 46-04) | Width normalization; content structure; sticky footer |
| `components/customers/edit-customer-sheet.tsx` | 46-05 (or 46-04) | Width normalization; remove Separators; sticky footer |

---

## Detailed Drawer Audit

### Add Job Sheet (add-job-sheet.tsx)

**Width:** Default `sm:max-w-sm` (384px) — NEEDS widening to `sm:max-w-lg` (512px)
**Content:** Form with `space-y-4`, no separators. Good structure already.
**Footer:** Cancel + Create Job buttons in `flex justify-end gap-2 pt-4` inside form. Need to move to sticky footer.
**Imports SheetFooter:** No (doesn't use it)
**Separators:** 0

### Edit Job Sheet (edit-job-sheet.tsx)

**Width:** Default `sm:max-w-sm` (384px) — NEEDS widening
**Content:** Form with `space-y-4`. Has a read-only info block at bottom (`bg-muted p-3`).
**Footer:** Cancel + Save Changes buttons in `flex justify-end gap-2 pt-4` inside form
**Imports SheetFooter:** No
**Separators:** 0

### Job Detail Drawer (job-detail-drawer.tsx)

**Width:** `sm:max-w-lg` (512px) — correct
**Content:** Sections separated by `<Separator />` (4 total). Each section uses `<h4>` headings.
**Footer:** Action buttons in `<div className="space-y-2">` — full-width, all `variant="outline"` with custom colors
**Button sizes:** All buttons are default size with `size="sm"` on some campaign resolution buttons but NOT on the main action buttons (Complete, Edit, Delete)
**DRW-03 issue:** Main actions use `variant="outline"` with custom color overrides, which is inconsistent with customer detail drawer where primary action uses `variant="default"`. The Complete button has `border-success/40 hover:bg-success-bg`, Edit is plain outline, Delete has `text-destructive`.
**Separators:** 4

### Customer Detail Drawer (customer-detail-drawer.tsx)

**Width:** `sm:max-w-lg` (512px) — correct
**Content:** Sections separated by `<Separator />` (4 total). Uses `<h4>` and `<h3>` headings.
**Footer:** Action buttons in `<div className='space-y-2'>` — full-width, mixed variants: Send (default), Edit (outline), Archive (outline), History (ghost)
**Separators:** 4

### Add Customer Sheet (add-customer-sheet.tsx)

**Width:** `w-[400px] sm:w-[540px]` — custom, wider than default but different from `sm:max-w-lg`
**Content:** Form with `space-y-4`, no separators
**Footer:** Full-width buttons in `flex flex-col gap-2 pt-2`: Add Customer (default) + Save & Add Another (outline)
**Separators:** 0

### Edit Customer Sheet (edit-customer-sheet.tsx)

**Width:** `w-[400px] sm:w-[540px]` — same custom width
**Content:** Form + `<Separator />` + SMS Consent + `<Separator />` + Activity. Has 2 Separators.
**Footer:** Single `Save Changes` button, full-width inside form
**Separators:** 2

---

## Campaign System Analysis

### Current Enrollment Status Flow

```
                    ┌──────────┐
                    │  active   │
                    └─────┬────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ completed│    │ stopped  │    │ (frozen) │  ← NEW
    └──────────┘    └──────────┘    └──────────┘
```

### Places That Query Enrollment Status

**Must include `frozen`:**

| File | Line(s) | Query Pattern | Include frozen? | Reason |
|------|---------|---------------|-----------------|--------|
| `lib/actions/campaign.ts` | 203 | getCampaignDeletionInfo count | YES | Count frozen as "in-progress" for deletion impact |
| `lib/actions/campaign.ts` | 267-279 | deleteCampaign reassign/stop | YES | Must handle frozen enrollments too |
| `lib/actions/campaign.ts` | 339 | deleteCampaign stop (no reassign) | YES | Must handle frozen |
| `lib/actions/campaign.ts` | 471 | toggleCampaignStatus stop → REWRITE | YES | This is THE fix |
| `lib/actions/enrollment.ts` | 57 | checkEnrollmentConflict active check | YES | Frozen = still in progress |
| `lib/actions/enrollment.ts` | 116 | cancelActiveEnrollments | MAYBE | If replacing, should also cancel frozen |
| `lib/actions/enrollment.ts` | 144 | stopEnrollmentsForJob | MAYBE | Depends on context |
| `lib/data/campaign.ts` | 216 | getCampaignEnrollmentCounts | YES | Add frozen count |
| `lib/data/campaign.ts` | 253, 290 | getActiveCampaignForJob | NO | Queries campaigns table, not enrollments |
| `lib/data/dashboard.ts` | 131 | Active sequences KPI | YES | Frozen enrollments are paused sequences |
| `lib/data/dashboard.ts` | 280, 320, 351 | Ready-to-send conflict detection | YES | Frozen = customer has in-progress sequence |
| `lib/data/dashboard.ts` | 784, 804 | Job detail enrichment | YES | Show frozen enrollment info |
| `app/api/cron/resolve-enrollment-conflicts/route.ts` | 95-101 | Task B active enrollment check | YES | Frozen = in progress |
| `app/api/cron/process-campaign-touches/route.ts` | (via RPC) | claim_due_campaign_touches | NO | RPC already filters `status='active'`, frozen is automatically excluded |
| `lib/actions/customer.ts` | 951 | Archive customer: stop active enrollments | YES | Should also stop frozen |

### Cron Safety Analysis

The `claim_due_campaign_touches` RPC (the main cron query) filters exclusively on `WHERE e.status = 'active'`. Adding `frozen` as a new status means frozen enrollments are **automatically excluded** from processing. No change to the RPC is needed.

The conflict resolver cron DOES need updating (Task B check at line 95-101) to treat `frozen` as "in progress."

---

## Open Questions

1. **Should frozen enrollments show a visible badge in the campaign detail page?**
   - Currently the page shows Active/Completed/Stopped counts. A "Frozen" count badge would help users understand what happened.
   - Recommendation: YES — add a frozen count. Display it with a snowflake or pause icon.
   - This is a UI concern for the planner to decide on priority.

2. **Should the scheduled time recalculation on unfreeze be per-enrollment or batch?**
   - Per-enrollment is more precise but slower (N queries).
   - Batch approach: `UPDATE campaign_enrollments SET status='active', touch_N_scheduled_at = GREATEST(touch_N_scheduled_at, NOW()) WHERE ...` — but this requires dynamic column names per current_touch, which is harder in batch.
   - Recommendation: Per-enrollment loop in the server action is fine for typical volumes (< 100 enrollments per campaign). If performance becomes an issue, create an RPC.

3. **White-background sections: `bg-card` or `bg-background`?**
   - The `SheetContent` already has `bg-background`. Using `bg-card` inside would give a white-on-off-white effect.
   - Looking at the current design tokens: `--background: 36 10% 97%` (warm off-white) and `--card: 0 0% 100%` (pure white).
   - The success criteria says "white-background rounded sections" — this implies `bg-card` (pure white) sections inside the `bg-background` sheet.
   - Recommendation: Use `rounded-lg bg-card p-4` for content sections inside the drawer body.

4. **SheetBody vs. inline approach?**
   - Option A: Create a formal `SheetBody` component exported from `sheet.tsx` with `flex-1 overflow-y-auto min-h-0`
   - Option B: Just apply the classes inline in each drawer
   - Recommendation: Option A — create `SheetBody` in `sheet.tsx` for consistency. This is the "DrawerLayout wrapper + SheetBody subcomponent" mentioned in 46-03.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `C:\AvisLoop\components\ui\sheet.tsx` — SheetContent base classes, SheetHeader, SheetFooter
- `C:\AvisLoop\components\jobs\add-job-sheet.tsx` — full component: 325 lines, width default, form structure
- `C:\AvisLoop\components\jobs\edit-job-sheet.tsx` — full component: 259 lines, width default, form structure
- `C:\AvisLoop\components\jobs\job-detail-drawer.tsx` — full component: 671 lines, sm:max-w-lg, 4 separators, action buttons
- `C:\AvisLoop\components\customers\customer-detail-drawer.tsx` — full component: 300 lines, sm:max-w-lg, 4 separators
- `C:\AvisLoop\components\customers\add-customer-sheet.tsx` — full component: 182 lines, custom width
- `C:\AvisLoop\components\customers\edit-customer-sheet.tsx` — full component: 212 lines, custom width, 2 separators
- `C:\AvisLoop\components\history\request-detail-drawer.tsx` — reference pattern: 291 lines, sm:max-w-lg, no separators
- `C:\AvisLoop\supabase\migrations\20260204_create_campaign_enrollments.sql` — status constraint, indexes, RLS
- `C:\AvisLoop\supabase\migrations\20260204_claim_due_campaign_touches.sql` — cron RPC, status='active' filter
- `C:\AvisLoop\lib\actions\campaign.ts` — toggleCampaignStatus, deleteCampaign, getCampaignDeletionInfo
- `C:\AvisLoop\lib\actions\enrollment.ts` — enrollJobInCampaign, checkEnrollmentConflict
- `C:\AvisLoop\app\api\cron\resolve-enrollment-conflicts\route.ts` — Task A + Task B logic
- `C:\AvisLoop\app\api\cron\process-campaign-touches\route.ts` — touch processing, cron auth
- `C:\AvisLoop\lib\types\database.ts` — EnrollmentStatus type definition
- `C:\AvisLoop\lib\data\campaign.ts` — getCampaignEnrollmentCounts, enrollment status queries
- `C:\AvisLoop\lib\data\dashboard.ts` — enrollment status queries across dashboard data
- `C:\AvisLoop\.planning\phases\45-foundation-visual-changes\45-RESEARCH.md` — Phase 45 foundation context
- `C:\AvisLoop\.planning\phases\45-foundation-visual-changes\45-VERIFICATION.md` — Phase 45 verification results

---

## Metadata

**Confidence breakdown:**
- Drawer structure analysis: HIGH — complete file reads of all 7 drawers
- Campaign freeze architecture: HIGH — traced through all status queries, migration, RPC, and cron
- Sticky footer approach: HIGH — standard flex pattern, verified SheetContent is already flex-col
- Width inconsistency: HIGH — extracted exact className from each drawer
- Cron safety for frozen: HIGH — verified RPC source SQL only queries `status='active'`
- Conflict resolver edge case: HIGH — traced exact query and identified the `.eq('status', 'active')` gap

**Research date:** 2026-02-25
**Valid until:** Stable — no external dependencies; valid until component files or migration schema change
