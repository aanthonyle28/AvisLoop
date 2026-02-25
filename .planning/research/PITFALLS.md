# Domain Pitfalls: v2.5.2 UX Bugs & UI Fixes

**Domain:** Adding UX polish (drawer consistency, sparkline KPIs, button variants, campaign state fixes, sticky footers, Radix select migration) to an existing production Next.js + Supabase SaaS with 18,000+ LOC
**Researched:** 2026-02-25
**Confidence:** HIGH — based on direct codebase inspection of all named components, verified against official documentation and community knowledge for each pitfall category

---

## Critical Pitfalls

These mistakes cause data corruption, broken core workflows, or production regressions that are expensive to recover from.

---

### Pitfall 1: Campaign Pause Now Destroys Active Enrollments — Resume Cannot Restore Them

**What goes wrong:**
`toggleCampaignStatus()` in `lib/actions/campaign.ts` (lines 462–472) unconditionally sets all active enrollments to `status='stopped'` with `stop_reason='campaign_paused'` when pausing. When the campaign is later resumed (toggle back to active), those enrollments are already permanently terminated. No enrollment data is preserved. Completed jobs that were mid-sequence now show "stopped" in the job detail drawer — this is the exact bug described in the milestone context.

**The current code path:**
```typescript
// toggleCampaignStatus() — current behavior
if (newStatus === 'paused') {
  await supabase
    .from('campaign_enrollments')
    .update({
      status: 'stopped',         // PERMANENT — cannot be undone
      stop_reason: 'campaign_paused',
      stopped_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('status', 'active')
}
// Resume path: does nothing to enrollments — they are already stopped
```

**Why it happens:**
The current architecture only models two enrollment terminal states (`completed`, `stopped`). There is no `paused` enrollment state. The quick fix of "stop everything on pause" was correct for v1 behavior but is wrong for v2 where campaigns run autonomously and a user pausing for maintenance should not lose mid-sequence customers.

**Consequences:**
- Active customers in a 3-touch sequence lose their remaining touches when the owner briefly pauses to adjust settings
- Job detail drawer shows "Stopped" for enrollments that the user expected to resume
- Re-enabling the campaign does not re-enroll these jobs — the `queue_after` and `conflict` resolution states on those jobs remain, preventing automatic re-enrollment
- The cron processor (`/api/cron/process-campaign-touches/`) correctly skips `stopped` enrollments, so no sends occur even after re-enabling

**Prevention strategy:**
Implement freeze-in-place: add a `paused` enrollment status (or a `paused_at` / `resume_at` timestamp column) so enrollments freeze at their current touch position rather than terminating. The cron processor must then check campaign status before sending any touch for an active enrollment:

```typescript
// Cron should skip touches belonging to paused campaigns
// Query must join campaign status
WHERE enrollment.status = 'active'
  AND campaign.status = 'active'  // ← must add this guard
```

On resume, the cron picks them back up automatically with no additional action needed.

**If a full `paused` enrollment state is too large for this milestone:** As a minimal fix, stop calling the enrollment update on pause at all. Instead, make the cron processor's touch claim query filter by `campaign.status = 'active'`. This means enrolled customers freeze automatically (cron skips paused campaign's due touches) and resume automatically (cron processes them again once campaign is active). This requires no enrollment record changes and no data migration.

**Warning signs:**
- After pausing and resuming a campaign, jobs that were previously "Enrolled" now show "Stopped" in the drawer
- Dashboard "Active Sequences" KPI drops to zero after a pause even though the campaign was quickly re-enabled
- Customers stop receiving touches mid-sequence after a campaign toggle

**Phase to address:** Must be the first task in any campaign pause/resume work — do not address the UI for the toggle switch until the underlying state behavior is correct

---

### Pitfall 2: Sparkline Charts Break SSR — Server Component KPI Cards Cannot Render Them

**What goes wrong:**
`kpi-widgets.tsx` is currently a `'use client'` component that renders KPI values. If sparkline charts are added using Recharts (or any chart library), those libraries access `window`, `document`, or `ResizeObserver` at module load time. In a Next.js App Router setup, even `'use client'` components are server-rendered on first load (SSR). Chart library initialization that touches browser globals crashes the initial render with `ReferenceError: window is not defined`.

**Why it happens:**
The distinction between "client component" and "server-rendered" is often misunderstood. In Next.js App Router, `'use client'` means the component ships JavaScript to the browser and runs interactively, but the component is still rendered once on the server to produce the initial HTML. A chart library that calls `window.innerWidth` during module initialization (not inside an effect or event handler) runs on the server and crashes.

Recharts specifically is known to trigger this — it uses ResizeObserver and window internally.

**Consequences:**
- The entire KPI row fails to render (white card area or hydration error)
- The error only appears when the chart data is non-empty (edge case: empty arrays skip the chart render path, masking the bug in development with no data)
- Next.js hydration errors show as client-side console warnings that appear to be style-only mismatches — easy to miss during review

**Prevention strategy:**
Wrap any chart component with `dynamic()` and `ssr: false`:

```typescript
// In kpi-widgets.tsx
import dynamic from 'next/dynamic'

const SparklineChart = dynamic(
  () => import('@/components/ui/sparkline-chart'),
  { ssr: false, loading: () => <div className="h-8 w-16" /> }
)
```

The loading state placeholder should match the chart's rendered dimensions to prevent layout shift. Ensure the chart component file begins with `'use client'` and all chart initialization is inside the component body (not module scope).

**Alternative:** Use a pure SVG sparkline rendered as a static server component — no library required, no SSR risk, minimal bundle size. A simple polyline drawn from data points avoids this category of problem entirely for dashboard KPIs where interactivity is not needed.

**Warning signs:**
- Build succeeds but production crashes on first KPI page load
- Console shows "ReferenceError: window is not defined" in server logs
- Works in development (`next dev` disables strict SSR in some edge cases) but fails in production build

**Phase to address:** Before importing any chart library — the dynamic import wrapper must be in place before any chart code is merged

---

### Pitfall 3: Replacing Native Select With Radix Select Breaks Form State on Reset and Submission

**What goes wrong:**
`add-job-sheet.tsx` (line 277) and `service-type-select.tsx` use a native `<select>` element. Migrating to Radix UI `Select` while the form uses `useActionState` (not react-hook-form) introduces two failure modes:

1. **`onValueChange` vs `onChange` mismatch:** Radix `Select.Root` does not fire a standard DOM `onChange` event. It uses `onValueChange` (a Radix-specific prop). Any code expecting a synthetic event (e.g., `(e) => setServiceType(e.target.value as ServiceType)`) receives `undefined` silently — the state never updates, the form submits the empty string for service type.

2. **`reset()` does not clear the visible selection:** The `useEffect` reset pattern in `add-job-sheet.tsx` (lines 71–83) calls `setServiceType('')` on sheet close. With native select, this clears the visible field. With Radix Select, clearing the controlled `value` prop to `''` may not visually reset the displayed item — Radix Select treats `''` and `undefined` differently for placeholder rendering. The user reopens the sheet and sees a stale service type.

**Note on current form pattern:** `add-job-sheet.tsx` uses `useActionState` + `formAction`, not react-hook-form. The service type is managed via a `useState` that is manually injected into `FormData` at submit time (line 131: `formData.set('serviceType', serviceType)`). The Radix Select replacement must wire `onValueChange` to the same `setServiceType` state setter, not to any `onChange` prop.

**Consequences:**
- Jobs created with wrong or empty service type
- Campaign matching fails (no matching campaign found for empty service type)
- Dashboard "Ready to Complete" queue shows these jobs as unenrollable

**Prevention strategy:**
When replacing the native select:
```typescript
// Wrong — native select pattern, won't fire for Radix
<select onChange={(e) => setServiceType(e.target.value as ServiceType)}>

// Correct — Radix pattern
<Select value={serviceType} onValueChange={(val) => setServiceType(val as ServiceType)}>
```

For the reset behavior, use `value={serviceType || undefined}` rather than `value={serviceType || ''}` — passing `undefined` triggers Radix Select to show the placeholder text, while `''` may display a blank selected item.

Test the full add-job flow after migration: open sheet, select type, submit → job has correct service type. Open again → shows placeholder. This is the acceptance test for the migration.

**Warning signs:**
- Jobs created after migration have `service_type = ''` in the database
- Radix Select shows previous selection after sheet reopens
- TypeScript compiles without error (the `onValueChange` type signature is `(value: string) => void` — it won't catch wiring to `onChange`)

**Phase to address:** The native → Radix migration task must include an explicit form state test, not just a visual verification

---

## Moderate Pitfalls

These cause delays, hard-to-debug issues, or technical debt that compounds over subsequent phases.

---

### Pitfall 4: Adding a New Button Variant Breaks `data-variant` Attribute Selectors Elsewhere

**What goes wrong:**
`button.tsx` uses `data-variant={variant}` (line 56). If any CSS rule, test selector, or Playwright assertion targets `[data-variant="outline"]` or similar, adding a new variant (e.g., `"soft"`) does not break those selectors — but if the new variant is used where `"outline"` was expected (e.g., replacing outline buttons with soft buttons as part of a hierarchy fix), those selectors silently match zero elements.

The more common failure: adding a new variant without auditing all call sites where the old variant was used. If `"soft"` is semantically equivalent to `"outline"` but with reduced border weight, developers will selectively apply it, creating visual inconsistency within the same page.

**Why it happens:**
CVA variants are type-safe — TypeScript enforces valid variant names. But TypeScript cannot enforce "use this variant for this semantic context." Without a clear semantic rule for when to use `soft` vs `outline` vs `ghost`, each developer makes a different call. The codebase already has this tension: job detail drawer action buttons use `variant="outline"` with custom className overrides to change their appearance, rather than a purpose-built variant.

**Consequences:**
- Multiple components use the new variant for different purposes (some as "secondary action", some as "informational", some as "de-emphasized primary")
- Future phases must audit which variant means what, across all components
- Design system documentation (if any) becomes stale

**Prevention strategy:**
Before adding any new variant, define its semantic contract:
- What it communicates (hierarchy, emphasis, danger level)
- When to use it vs existing variants
- Which existing usages it replaces

Document this in a comment block in `button.tsx` above the variant definition. Add the new variant to the TypeScript union type last — after the semantic contract is written — to prevent premature adoption across the codebase.

**Warning signs:**
- The same new variant appears in 10+ components within 2 days of adding it
- PR review comments say "I'm not sure which variant to use here"
- Visual QA finds the same action button using three different variants across different drawers

**Phase to address:** Variant definition task — write the semantic contract in the PR description before touching any component

---

### Pitfall 5: Drawer Consistency Refactor Breaks Existing Scroll and Focus Behavior

**What goes wrong:**
Multiple drawers in the codebase (`job-detail-drawer.tsx`, `customer-detail-drawer.tsx`, `add-job-sheet.tsx`, `edit-job-sheet.tsx`, `add-customer-sheet.tsx`, `edit-customer-sheet.tsx`) all use `<SheetContent className="... overflow-y-auto">` individually. When consolidating to a shared structure (white bg content grouping, sticky bottom buttons), three specific failures arise:

**1. Sticky footer inside overflow-y-auto requires specific flex structure:**
The current `SheetContent` renders as `flex flex-col` (line 63 of `sheet.tsx`). The sticky footer pattern requires the content area to grow (`flex-1 overflow-y-auto`) with the footer in a sibling `div` at flex level. If the footer is placed inside the scrollable area and uses `position: sticky; bottom: 0`, it will scroll away rather than stay fixed — because `position: sticky` binds to the nearest scroll container ancestor, and if the footer's parent is the same `overflow-y: auto` div that contains all the content, the sticky element will only stick at the bottom of its own scrollable parent.

**Correct flex structure:**
```tsx
<SheetContent className="flex flex-col">
  <SheetHeader>...</SheetHeader>         {/* fixed at top */}
  <div className="flex-1 overflow-y-auto px-6">  {/* scrolls */}
    {/* content sections */}
  </div>
  <div className="shrink-0 p-6 border-t bg-background">  {/* fixed at bottom */}
    {/* action buttons */}
  </div>
</SheetContent>
```

**2. Auto-save notes debounce in customer-detail-drawer.tsx:**
`customer-detail-drawer.tsx` has an auto-save mechanism using `timeoutRef` and `notesRef` (lines 51–96). It flushes pending notes on drawer close via `useEffect`. If the drawer layout is restructured (adding wrapper divs, changing the scroll container), the `Textarea` component may be inside a new scrollable context — this does not break the auto-save, but moving the notes textarea above or below the separator as part of visual reordering can change what the user sees when they first open the drawer, which affects adoption.

**3. Focus restoration after drawer close:**
Radix `Sheet` (via `SheetPrimitive.Content`) manages focus trap and focus restoration automatically. Adding `overflow-y-auto` to an inner div wrapper (rather than to `SheetContent` itself) breaks the Radix focus trap in some versions — the trap targets elements inside `SheetContent` by default, and if the inner scrollable div has `tabIndex=-1` or similar, it may capture the initial focus.

**Warning signs:**
- Action buttons scroll away with content instead of staying fixed at the bottom
- Focus is placed on the first form field instead of the drawer header on open
- On mobile, keyboard appearance pushes the sticky footer off-screen
- Notes auto-save stops firing after layout restructure

**Phase to address:** Before restructuring any drawer — establish the flex/overflow structure in a single drawer first, verify focus behavior, verify sticky footer, then apply the pattern to remaining drawers

---

### Pitfall 6: White Background Content Grouping Creates Z-Index Conflicts With Radix Portal Overlays

**What goes wrong:**
Adding `bg-white rounded-lg` sections inside a drawer (for visual grouping) creates new stacking contexts if those sections also have `shadow-sm` or `overflow: hidden`. Radix `Sheet` renders in a portal at z-50. Tooltip, Dropdown, and AlertDialog components used inside drawers (already present in `job-detail-drawer.tsx` — see lines 638–668 for AlertDialog, lines 239–264 for conflict resolution buttons with Tooltip) also render in portals at their own z-index values.

If white grouped sections have `position: relative` + `overflow: hidden` or `transform`, they create a new stacking context. This can make Radix portal-rendered dropdowns and tooltips appear behind the grouped section rather than above the drawer overlay.

**Specific risk in this codebase:**
`job-detail-drawer.tsx` renders an `AlertDialog` as a sibling to `Sheet` (lines 638–668). This is outside the Sheet portal, which is correct. But any inner Tooltip or DropdownMenu inside the Sheet renders into the document body portal. If a white grouped section has `z-index: 1` (or any stacking-context-creating property), the portal's `z-50` may still render behind the grouped section's stacking context.

**Prevention strategy:**
Avoid setting explicit z-index values on content grouping containers. Use `bg-background` or `bg-muted/30` for sectioning rather than `bg-white rounded-lg shadow-sm`. If a shadow is required, use `ring-1 ring-border` (which does not create a stacking context) rather than `box-shadow`.

**Warning signs:**
- Tooltips inside the drawer appear behind a content section
- Dropdown menus inside the drawer are cut off or hidden behind grouping containers
- AlertDialog that was working before the layout change no longer appears on top

**Phase to address:** Content grouping implementation — test all portal-rendered elements (Tooltip, AlertDialog, DropdownMenu) inside each drawer after adding white bg sections

---

### Pitfall 7: Conflict Cron Processor Re-enrolls Into Paused Campaigns

**What goes wrong:**
`/api/cron/resolve-enrollment-conflicts/route.ts` (Task A, lines 52–80) auto-resolves stale conflicts by canceling active enrollments and calling `enrollJobInCampaign()`. If at the time of auto-resolution the matching campaign has been paused (status = `'paused'`), `enrollJobInCampaign()` in `lib/actions/enrollment.ts` (lines 207–233) fetches the campaign with `.eq('status', 'active')` — this query returns null for a paused campaign, and the enrollment is skipped with reason "No active campaign for this service type."

This is actually the correct behavior — but the cron does not update the job's `enrollment_resolution` to indicate why it was skipped. The job remains in `enrollment_resolution='conflict'` state indefinitely, continuing to appear in the dashboard queue even though it was "processed."

**The gap:** After the 24-hour stale threshold passes and auto-resolution runs, the job should transition to `enrollment_resolution='skipped'` with an appropriate reason. Currently if `enrollJobInCampaign()` returns `skipped: true` (no active campaign), the cron does nothing to update the job's resolution state.

**Warning signs:**
- Dashboard shows the same "conflict" jobs for days even after the auto-resolution cron runs
- Jobs that should have self-resolved remain in the queue permanently
- Pausing a campaign causes a spike in unresolvable conflict states in the queue

**Phase to address:** Campaign pause/resume fix phase — check the cron's handling of the `skipped` enrollment result and ensure the job record is updated appropriately

---

### Pitfall 8: KPI Sparkline Data Fetching Adds Latency to an Already-Server-Rendered Page

**What goes wrong:**
Dashboard KPIs (`getDashboardKPIs()`) are fetched server-side in the dashboard page. Adding sparkline historical data (e.g., "reviews per day for the last 7 days" for each KPI) means either:

- Adding the time-series query to the existing server-side fetch (increases sequential DB query latency), or
- Loading sparkline data client-side after initial render (creates layout shift as charts pop in)

The existing `KPIWidgetsSkeleton` only accounts for the current value display — it does not include a sparkline placeholder. If sparklines load after the skeleton, the card height changes when sparklines appear, causing a layout shift visible to users.

**Prevention strategy:**
Add the sparkline time-series data to the server-side fetch using `Promise.all()` so it is parallel, not sequential. Add sparkline placeholder dimensions to `KPIWidgetsSkeleton` immediately — even if the actual chart is not yet built — to prevent future layout shift:

```tsx
// Add to KPIWidgetsSkeleton cards
<Skeleton className="h-8 w-full mt-2" />  {/* sparkline area placeholder */}
```

For the database query, a 7-day window of `send_logs` grouped by day is likely sufficient. Avoid a separate query per KPI card — one query returning all KPI time-series data is cheaper than three separate queries.

**Warning signs:**
- Dashboard page load time increases by more than 100ms after adding sparklines
- KPI cards visibly grow in height after page load (layout shift)
- Lighthouse CLS score worsens

**Phase to address:** KPI sparkline implementation — time-series query design must be reviewed before writing any chart rendering code

---

## Minor Pitfalls

These cause visual inconsistency or minor friction but are fixable without structural changes.

---

### Pitfall 9: Dashboard Queue Row White Background + Border Radius at Different Content Heights

**What goes wrong:**
`ready-to-send-queue.tsx` renders job rows. Some rows have conflict resolution buttons (Replace/Skip/Queue), some have "Mark Complete," some have no actions. Adding `bg-white rounded-lg border` to each row creates height variation — rows with conflict resolution buttons are taller than rows with a single action. In a list context, visually unequal card heights look like an error state rather than intentional design.

**Prevention strategy:**
Ensure the base row height is consistent regardless of actions shown. Use `min-h-[N]` or a consistent padding rather than content-driven height. If conflict buttons must be shown inline, use a collapsible section (chevron expand) rather than always-visible buttons, which normalizes row height across all states.

**Warning signs:**
- The queue looks visually unstable when some jobs have conflicts and some do not
- The list appears to have "broken" items intermixed with normal items

**Phase to address:** Queue row styling task — design the conflict-expanded state before setting the base card dimensions

---

### Pitfall 10: Touch Template Preview Triggers a Fetch Per Row on Open

**What goes wrong:**
If template preview in the touch sequence editor loads template content on hover or on a preview button click, and there are 4 touches each with a different template, rapid hover or open/close cycling triggers 4 individual template fetches. If fetches are not deduped or cached, this creates noticeable loading jank.

**Prevention strategy:**
Load all templates for a campaign's touches in a single prefetch when the campaign detail page opens (the data is already available via `campaign_touches.template_id` — the templates can be eager-loaded alongside the touch query). Cache the result in component state. Individual template previews then render from local state, not from individual network requests.

**Warning signs:**
- Network tab shows multiple sequential `/template/:id` requests when switching between touch previews
- Preview appears to "reload" each time the same template is opened again

**Phase to address:** Template preview implementation — fetch strategy must be decided before building the preview UI

---

## Integration-Specific Pitfalls

These apply specifically to the integrations in this codebase.

---

### Pitfall 11: Optimistic UI on Campaign Toggle Reverts on Server Error — Must Rollback Enrollment UI Too

**What goes wrong:**
`campaign-card.tsx` uses optimistic UI for the pause/resume toggle: `setOptimisticStatus(newStatus)` updates the switch visually before the server confirms. If `toggleCampaignStatus()` returns an error, the code correctly reverts `setOptimisticStatus(campaign.status)` (line 50). However, the enrollment data shown in job detail drawers and the dashboard queue is not optimistically updated — it reflects server state after `revalidatePath` fires.

If the new pause behavior changes what `revalidatePath('/campaigns')` and `revalidatePath('/jobs')` invalidate, the optimistic toggle state and the actual enrollment count badges may be out of sync for 1–2 seconds. This is a cosmetic issue but looks like a data loading error to users who toggle and immediately check job statuses.

**Prevention strategy:**
No change needed if `revalidatePath` is called correctly (already done in `toggleCampaignStatus`). Ensure any new enrollment freeze-in-place logic also calls `revalidatePath('/dashboard')` — currently missing from `toggleCampaignStatus`.

**Warning signs:**
- Campaign toggle switch snaps back to previous position after 2 seconds (server error)
- Dashboard KPI for "Active Sequences" shows wrong count immediately after toggle

---

### Pitfall 12: Native Select Inconsistency Across Form Contexts After Partial Migration

**What goes wrong:**
`add-job-sheet.tsx` has two native `<select>` elements: the status select (line 277) and the service type select (which uses `ServiceTypeSelect` component — itself a native `<select>`). If only one is migrated to Radix Select and the other is not, the two selects have different visual heights, focus ring styles, and dark mode behavior within the same form. The mismatch is obvious in side-by-side layout and requires a follow-up pass to fix.

**Prevention strategy:**
Migrate both selects in `add-job-sheet.tsx` in the same PR. If the edit job sheet (`edit-job-sheet.tsx`) also has native selects, include those in the same migration. A partial migration is worse than no migration — it creates two parallel visual systems within a single form.

**Warning signs:**
- Two select dropdowns in the same form have different heights (Radix `h-10` vs native `h-9`)
- One select shows a custom styled dropdown list; the other shows the OS native picker on mobile
- Focus ring styles differ between the two selects

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Campaign pause/resume fix | Enrollment permanent termination (Pitfall 1) | Add cron campaign-status guard before touching UI |
| Sparkline charts | SSR crash with `window is not defined` (Pitfall 2) | Use `dynamic` + `ssr: false` or pure SVG; add loading placeholder |
| Radix Select migration | `onValueChange` / `onChange` mismatch (Pitfall 3) | Test full form submit flow, not just visual appearance |
| New button variant | Semantic drift without contract (Pitfall 4) | Write semantic contract in PR before adding variant |
| Drawer consistency refactor | Sticky footer inside scroll container (Pitfall 5) | Establish flex structure in one drawer, verify, then replicate |
| White bg content grouping | Stacking context breaks Radix portals (Pitfall 6) | Test Tooltip and AlertDialog inside each refactored drawer |
| Conflict cron + paused campaigns | Stale conflict jobs never clear (Pitfall 7) | Update job resolution state when enrollment is skipped |
| KPI sparklines | Server-side latency + layout shift (Pitfall 8) | Parallel fetch, add skeleton placeholder dimensions immediately |
| Queue row restyling | Height inconsistency for conflict rows (Pitfall 9) | Define base height before picking conflict button layout |
| Touch template preview | Per-row fetch on open (Pitfall 10) | Eager-load all touch templates with campaign fetch |
| Campaign toggle optimistic UI | `revalidatePath('/dashboard')` missing (Pitfall 11) | Add dashboard revalidation to `toggleCampaignStatus` |
| Partial Radix Select migration | Visual inconsistency between migrated and unmigrated selects (Pitfall 12) | Migrate all selects in one component in the same PR |

---

## "Looks Done But Isn't" Checklist

- [ ] **Campaign pause behavior:** After pause + resume, a job that was mid-sequence shows "Active" not "Stopped" in job detail drawer
- [ ] **Sparkline SSR:** `pnpm build` succeeds without `window is not defined` errors in server logs
- [ ] **Radix Select form state:** Creating a job with Radix service type select submits the correct service type to the database (verify in Supabase dashboard, not just the toast message)
- [ ] **Radix Select reset:** After closing and reopening Add Job sheet, service type shows placeholder (not previous selection)
- [ ] **Sticky footer mobile:** On a mobile viewport (375px), action buttons remain visible when the drawer content scrolls
- [ ] **Sticky footer not scrolling away:** Drawer content area scrolls independently of the action buttons
- [ ] **Tooltip inside refactored drawer:** All tooltips in job detail drawer appear above all content sections
- [ ] **AlertDialog inside refactored drawer:** "Replace active sequence?" confirmation dialog appears above the drawer overlay
- [ ] **Conflict cron after pause:** Pausing a campaign, waiting 24 hours (or triggering cron manually), verifying stale conflicts do not remain stuck in `enrollment_resolution='conflict'` state
- [ ] **Button variant coverage:** Grep for the new variant name shows it appears only in contexts matching its semantic definition

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Enrollment terminated by pause | HIGH | Write migration to find stopped enrollments with `stop_reason='campaign_paused'` in the re-enabled window; re-enroll manually or offer a UI tool to bulk re-enroll |
| SSR crash from chart library | LOW | Remove chart import, deploy fix, add `dynamic` wrapper, redeploy |
| Radix Select submitting wrong value | MEDIUM | Fix `onValueChange` wiring; data fix requires identifying affected jobs in DB and prompting user to correct service type |
| Partial Radix migration mismatch | LOW | Complete the migration in a follow-up PR |
| Sticky footer scrolling away | LOW | Fix flex structure — structural change only, no data impact |
| Stacking context breaks portals | MEDIUM | Remove `overflow: hidden` or explicit z-index from content grouping containers |

---

## Sources

- Direct codebase inspection: `lib/actions/campaign.ts` (toggleCampaignStatus), `lib/actions/enrollment.ts` (enrollJobInCampaign), `components/jobs/job-detail-drawer.tsx`, `components/customers/customer-detail-drawer.tsx`, `components/jobs/add-job-sheet.tsx`, `components/jobs/service-type-select.tsx`, `components/dashboard/kpi-widgets.tsx`, `components/campaigns/campaign-card.tsx`, `components/ui/button.tsx`, `components/ui/sheet.tsx`, `app/api/cron/resolve-enrollment-conflicts/route.ts`
- [Stop "Window Is Not Defined" in Next.js (2025)](https://dev.to/devin-rosario/stop-window-is-not-defined-in-nextjs-2025-394j) — SSR chart library pitfalls
- [Recharts + Next.js SSR issue (GitHub)](https://github.com/apexcharts/react-apexcharts/issues/469) — confirmed pattern applies across chart libraries
- [Getting stuck: all the ways position:sticky can fail](https://polypane.app/blog/getting-stuck-all-the-ways-position-sticky-can-fail/) — overflow-y-auto + sticky footer interaction
- [Dealing with overflow and position: sticky](https://css-tricks.com/dealing-with-overflow-and-position-sticky/) — CSS-Tricks canonical reference
- [Radix UI Select reset issue (GitHub)](https://github.com/radix-ui/primitives/issues/1808) — reset() + undefined vs '' behavior
- [React Hook Form + Radix Select Controller integration](https://www.restack.io/p/radix-ui-select-answer-react-hook-form-cat-ai) — onValueChange vs onChange mismatch
- [How to Pause/Resume a Prospect in an Active Campaign](https://prospectingtoolkit.tawk.help/article/how-to-pauseresume-a-prospect-in-an-active-campaign) — freeze-in-place reference implementation
- [HubSpot pause/resume sequence behavior](https://knowledge.hubspot.com/sequences/pause-or-resume-your-sequences) — canonical SaaS pause behavior (resume from exact position)
- Enrollment state machine: DATA_MODEL.md, enrollment stop_reason enum review

---

*Pitfalls research for: v2.5.2 UX Bugs & UI Fixes on AvisLoop*
*Researched: 2026-02-25*
*Confidence: HIGH — all critical pitfalls verified against actual code in this codebase*
