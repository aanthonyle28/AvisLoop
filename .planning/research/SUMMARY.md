# Project Research Summary

**Project:** AvisLoop v2.5.2 — UX Bugs & UI Fixes
**Domain:** Home Service SaaS — UX Polish on Existing Next.js + Supabase App
**Researched:** 2026-02-25
**Confidence:** HIGH

---

## Executive Summary

This milestone is a focused polish pass on a fully-built product (18,000+ LOC, 205 shipped plans). Every backend feature exists. The research task was not "what to build" but "what is the right way to implement these UX improvements without breaking what already works." Research confirmed that all seven areas in scope can be addressed with minimal new infrastructure: one new npm dependency (`recharts` for sparklines), one database migration (adding `frozen` enrollment status), and otherwise pure CSS/component-level changes.

The most important finding is that the campaign pause/resume bug is more severe than it appears. The current `toggleCampaignStatus()` permanently destroys active enrollments on pause — resume cannot restore them. This is a data-integrity issue disguised as a visual one. Fixing it is the prerequisite for any campaign UI work. The correct model is freeze-in-place: the cron processor should skip enrollments belonging to paused campaigns (it already queries `WHERE status='active'`), and pausing should set enrollments to `frozen` rather than `stopped`. One migration adds `frozen` to the status constraint; one server action change implements the new behavior. The cron is unaffected.

The drawer consistency and sparkline work carry genuine technical traps that look harmless in development but fail in production. Sticky drawer footers require a specific flex/overflow structure — a footer inside the same scroll container scrolls away. Sparkline charts require `dynamic(() => import(...), { ssr: false })` because Recharts accesses browser globals at module init time and the dashboard page is server-rendered. Both traps are fully documented in PITFALLS.md with exact prevention strategies. Radix Select migration is a third trap: `onValueChange` replaces `onChange`, and reset must use `undefined` not `''` — failing this silently submits empty service types to the database.

---

## Key Findings

### Recommended Stack

One new dependency is warranted. All other work uses existing tooling.

**Core technologies (relevant to this milestone):**
- `recharts ^3.7.0` — KPI sparkline charts; only new npm dependency; integrates with `shadcn/ui chart` component via `pnpm dlx shadcn@latest add chart`; requires `dynamic` + `ssr: false` wrapper to prevent SSR crash
- `@radix-ui/react-select ^2.2.6` — Already installed; replaces native `<select>` in add-job-sheet, edit-job-sheet, service-type-select; key API difference: `onValueChange(value)` not `onChange(event)`
- `class-variance-authority ^0.7.1` — Already present; add `soft` variant to `buttonVariants` CVA in `button.tsx`; purely additive, no existing usage affected
- `components/ui/sheet.tsx` — Add `SheetBody` subcomponent export + `shrink-0` to `SheetFooter`; enables sticky footer pattern across all drawers
- Supabase migration — Add `frozen` to `campaign_enrollments.status` CHECK constraint; non-destructive; existing rows unaffected

**What NOT to add:**
- `@tremor/react` — 400kB+ for a full UI kit; only sparklines are needed
- `framer-motion` — Existing Tailwind `transition-all duration-200` covers all animation needs in this milestone
- `@radix-ui/react-scroll-area` — `overflow-y-auto` on a flex child is sufficient for the drawer scroll zone
- XState — The campaign pause state machine has 4 states and 3 transitions; a Supabase enum column is the correct solution at this scale
- Custom SVG sparkline (alternative) — Viable if bundle size is a concern (~30 lines, zero deps, no SSR risk); trade-off is higher maintenance for future chart additions

### Expected Features

**Must have (table stakes — users expect these in any polished SaaS):**
- Sticky action buttons in all drawers and sheets — actions scrolling out of view is a usability failure; the #1 SaaS sheet UX rule
- Consistent drawer content grouping — `bg-muted/30 rounded-lg p-4` sections across all drawers; `request-detail-drawer.tsx` is the reference pattern that others must match
- Queue rows as distinct card-like units (`bg-card border rounded-lg`) — flat `divide-y` rows look unfinished
- Campaign pause must freeze (not destroy) active enrollments — current behavior is a silent data-integrity bug
- "Activity" renamed to "History" in sidebar and bottom-nav labels — route already correctly named `/history`; label is out of sync with SaaS convention

**Should have (differentiators at this price point):**
- Sparkline micro-charts in KPI cards — best single improvement to dashboard comprehension; pairs current value with 7-30 day trend trajectory
- Colored circle icons in activity feed — semantic color coding (green for reviews, blue for sends, orange for feedback) increases scan speed
- KPI card gray resting background (`bg-muted/40`) in the right panel — makes cards feel like distinct data blocks, not flat list rows
- `soft` button variant in CVA — resolves `outline` overloading where it serves both moderate-importance and low-emphasis roles simultaneously
- Touch sequence template preview — collapsible inline preview of template body per touch card; reduces "what will this say?" anxiety

**Defer (not this milestone):**
- Full drag-and-drop email builder inline — out of scope; read-only preview only, link to Settings > Templates
- Real-time WebSocket activity feed — current server-rendered polling is appropriate for this product's usage cadence
- Sparklines with axis labels or interactive tooltips — sparklines work precisely because they have no labels; exact values are the bold numbers above them

### Architecture Approach

The architecture for this milestone is integration-focused, not new-system focused. Every change targets existing components in a well-structured codebase. The primary structural decision is how to implement drawer consistency: creating a new `DrawerLayout` wrapper component (non-breaking, opt-in, gradual rollout) vs modifying `SheetContent` directly (breaks if any existing sheet relies on current gap/overflow behavior). Research recommends the wrapper approach. The sparkline integration requires extending the `KPIMetric` type with `history?: number[]` and adding a parallel time-series query to `getDashboardKPIs()` — the data shape change cascades from `lib/types/dashboard.ts` through the server component to `kpi-widgets.tsx` and `right-panel-default.tsx`.

**Major components and their roles in this milestone:**

1. `components/ui/sheet.tsx` + `DrawerLayout` (new) — Foundation for all drawer work; add `SheetBody` export and update `SheetFooter`; all drawer migrations depend on this
2. `components/ui/button.tsx` — Add `soft` variant to CVA; purely additive, zero risk
3. `components/ui/sparkline.tsx` (new) — Pure SVG sparkline or Recharts `AreaChart`; zero coupling to rest of codebase
4. `lib/actions/campaign.ts` + Supabase migration — Campaign freeze fix; one migration, one server action change; cron unaffected (already filters `WHERE status='active'`)
5. `components/dashboard/kpi-widgets.tsx` + `right-panel-default.tsx` — Sparkline rendering, gray KPI card backgrounds, colored activity icons
6. `components/campaigns/touch-sequence-editor.tsx` — Template preview; purely local UI state, no new data fetching if templates are eager-loaded with campaign fetch
7. Navigation labels — `components/layout/sidebar.tsx` and `bottom-nav.tsx`; string changes only
8. `components/dashboard/ready-to-send-queue.tsx` — Queue row card styling; one-line CSS class change

**Dependency map:**
```
Foundation (button.tsx, sheet.tsx, DrawerLayout, Sparkline SVG)
    └── must complete before any consumer component is touched

Campaign freeze migration (Supabase migration file)
    └── must land before toggleCampaignStatus behavior change

Sparkline data pipeline (lib/types/dashboard.ts → lib/data/dashboard.ts)
    └── must complete before kpi-widgets.tsx chart rendering
    └── benchmark query time before merging

Drawer migrations (add-job-sheet, edit-job-sheet, job-detail-drawer, etc.)
    └── each is independent after DrawerLayout + SheetBody are built
    └── establish in one drawer first, verify focus/scroll, replicate
```

### Critical Pitfalls

1. **Campaign pause destroys enrollments permanently** — `toggleCampaignStatus()` calls `status='stopped'` on all active enrollments on pause. Resume cannot restore them — those customers permanently lose their remaining touches. Fix first before any campaign UI work. Solution: add `frozen` enrollment status + update the server action to freeze/unfreeze rather than stop. As a minimal alternative (no migration), make the cron filter by `AND campaign.status = 'active'` so frozen enrollments skip automatically. (PITFALLS.md Pitfall 1)

2. **Sparkline SSR crash** — Recharts accesses `window` and `ResizeObserver` at module init. `'use client'` components are still SSR'd in Next.js App Router's first pass. Without `dynamic(() => import(...), { ssr: false })`, production builds crash with `ReferenceError: window is not defined`. This works in `next dev` and fails in `next build`. Wrap the chart component before importing Recharts anywhere. (PITFALLS.md Pitfall 2)

3. **Radix Select breaks form state silently** — Radix `Select` fires `onValueChange(value: string)`, not `onChange(event)`. The add-job form uses `useActionState` + `FormData.set()`. Wiring Radix to the old `onChange` handler silently never updates state — jobs submit with empty service type, campaign matching fails. Also: reset via `value={undefined}` not `value=''` for placeholder display. Test the full form submit flow in Supabase after migration. (PITFALLS.md Pitfall 3)

4. **Sticky footer inside scroll container scrolls away** — `position: sticky; bottom: 0` binds to the nearest scroll ancestor. If footer lives inside the `overflow-y: auto` div, it scrolls. Correct structure: `SheetContent` is `flex flex-col`; middle zone is a sibling `div` with `flex-1 overflow-y-auto`; footer is a sibling `div` with `shrink-0`. Establish this in one drawer first and verify on mobile at 375px. (PITFALLS.md Pitfall 5)

5. **White bg sections create stacking context, breaking Radix portals** — `job-detail-drawer.tsx` renders `Tooltip` and `AlertDialog` in portals. If content grouping sections have `shadow-sm` + `overflow: hidden` or explicit `z-index`, they create a stacking context that may render above portal-rendered elements. Use `ring-1 ring-border` instead of `box-shadow` for section borders. Test all Tooltips and the AlertDialog inside each refactored drawer before closing any PR. (PITFALLS.md Pitfall 6)

---

## Implications for Roadmap

Based on the dependency analysis and risk profiles across all research files, this milestone should be structured into three phases with a strict dependency gate between them.

### Phase 1: Foundation + Visual-Only Changes

**Rationale:** All low-risk, no-data-change items. No migrations, no behavior changes, no SSR risk. Safe to ship as a unit. Establishes the component primitives that later phases depend on.
**Delivers:** Button `soft` variant, `SheetBody` subcomponent, `SheetFooter` `shrink-0` update, `DrawerLayout` wrapper, "Activity" → "History" nav rename, queue row white card styling (`bg-card border rounded-lg`), KPI card gray resting backgrounds (`bg-muted/40`), colored circle icons in activity feed
**Addresses:** Button hierarchy (table stakes), nav rename (table stakes), queue row distinction (table stakes), KPI visual differentiation (differentiator), activity feed scan speed (differentiator)
**Avoids:** Pitfall 4 — write the `soft` variant semantic contract in the PR description before code is merged; prevents semantic drift across the codebase

### Phase 2: Drawer Consistency + Campaign Freeze

**Rationale:** Depends on Phase 1 foundation components (`DrawerLayout`, `SheetBody`). Campaign freeze requires a DB migration — land the migration first, then update the server action, then update the UI. Each drawer migration is independent once `DrawerLayout` exists.
**Delivers:** Sticky drawer footers and consistent content grouping sections in all 6 sheet/drawer components (add-job-sheet, edit-job-sheet, job-detail-drawer, customer-detail-drawer, add-customer-sheet, edit-customer-sheet), `frozen` enrollment status migration, fixed `toggleCampaignStatus` freeze/thaw behavior, campaign card tooltip explaining freeze behavior, "Frozen" badge on queue items where campaign is paused
**Uses:** `DrawerLayout` wrapper (Phase 1), `SheetBody` (Phase 1), Supabase migration for enrollment status
**Avoids:** Pitfall 1 (enrollment destruction), Pitfall 5 (sticky footer structure — establish in job-detail-drawer first, verify, then replicate), Pitfall 6 (stacking context — test Tooltip and AlertDialog inside each refactored drawer)
**Research flag:** Before writing any code for the campaign freeze fix, read the Postgres function body for `claim_due_campaign_touches` in `supabase/migrations/`. This RPC is not readable from TypeScript files but its WHERE clause must also exclude `frozen` enrollments if the `frozen` status approach is chosen.

### Phase 3: Sparklines + Template Preview + Radix Select Migration

**Rationale:** Highest complexity items. Sparklines require new data infrastructure (daily bucket query) and carry SSR risk. Radix Select migration requires form state testing. Template preview needs campaign touch templates eager-loaded. These are done last when the rest of the milestone is verified stable.
**Delivers:** KPI sparklines in right panel and/or main KPI cards, touch sequence template preview (collapse/expand per touch), Radix Select migration for all native `<select>` elements in add-job/edit-job forms
**Uses:** `recharts ^3.7.0`, `shadcn add chart`, extended `KPIMetric` type with `history?: number[]`, parallel time-series query in `getDashboardKPIs()`
**Avoids:** Pitfall 2 (SSR crash — `dynamic` wrapper before any chart import), Pitfall 3 (Radix Select form state — full form submit test in Supabase), Pitfall 8 (sparkline query latency — use `Promise.all`, add skeleton placeholder to `KPIWidgetsSkeleton` immediately), Pitfall 10 (template preview per-row fetch — eager-load all templates with campaign fetch), Pitfall 12 (partial Radix migration — migrate all selects in one component in the same PR)

### Phase Ordering Rationale

- Phase 1 before Phase 2: `DrawerLayout` and `SheetBody` are hard dependencies for the drawer migrations; building foundations first prevents partial work being visible in production
- Campaign freeze migration before campaign UI: the cron continues running during development; stopping the destructive pause behavior is time-sensitive and should be merged as soon as it is ready
- Sparklines last: they require the longest data pipeline (new query, type extension, component build, SSR guard, layout shift prevention) and carry the most risk if rushed; the rest of the milestone provides confidence before tackling them

### Research Flags

Needs deeper investigation during planning:
- **Phase 2 (campaign freeze):** Read the Postgres RPC `claim_due_campaign_touches` function body from `supabase/migrations/` before implementing freeze status — this function runs in the database and must also exclude `frozen` enrollments; its body is not visible in the TypeScript codebase
- **Phase 3 (sparklines):** Time the `getDashboardKPIs()` query with the history extension added; if the new daily bucket query adds more than ~50ms to page load, switch to a client-side lazy fetch for sparkline data only (load sparklines after initial render, show skeleton)

Standard patterns (research-phase not needed):
- **Phase 1:** All changes are string edits, CSS class changes, and additive CVA variants
- **Phase 2 (drawers):** Architecture file specifies the exact flex/overflow structure; establish in one drawer, verify, replicate
- **Phase 3 (Radix Select):** Pattern fully documented; `onValueChange` not `onChange`, reset via `undefined` not `''`
- **Phase 3 (template preview):** Architecture file specifies the component structure; state is purely local, no data changes if templates are already in scope

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All changes verified by direct file inspection; `recharts` confirmed absent from `package.json`; all other dependencies confirmed present |
| Features | HIGH | All features verified against actual codebase state with file names and line numbers; reference image and product brief directly specify visual outcomes |
| Architecture | HIGH | All component files read directly; build order is dependency-driven and verified; one gap: Postgres RPC body for `claim_due_campaign_touches` is in a migration file not readable from TypeScript |
| Pitfalls | HIGH | All critical pitfalls (campaign pause, SSR, Radix Select, sticky footer) verified against actual code with line numbers; sticky footer pattern verified against shadcn official docs; Radix Select reset verified against known open GitHub issue |

**Overall confidence: HIGH**

### Gaps to Address

- **Postgres RPC body for `claim_due_campaign_touches`:** This function runs in the database and is defined in a Supabase migration file, not in TypeScript. Find and read this migration file before starting Phase 2 campaign work. The WHERE clause must be updated to exclude `frozen` enrollments if the `frozen` status approach is used.
- **Sparkline query performance:** The existing `getDashboardKPIs()` is already a set of parallel queries. Adding 1-3 daily-bucket queries may or may not affect page load time. Benchmark before deciding between server-side-parallel vs client-side-lazy loading for sparkline data.
- **Semantic token availability for new button variants:** ARCHITECTURE.md notes that `--success-bg`, `--warning-bg`, `--success-foreground`, `--warning-foreground` may or may not be defined in `app/globals.css`. Grep for these tokens before writing any new button variant classes that reference them.
- **`deleteCampaign` must handle `frozen` enrollments:** The current delete cleanup queries only stop `status='active'` enrollments. With the freeze fix in place, the delete must also stop `status='frozen'` enrollments: `.in('status', ['active', 'frozen'])`.
- **Cron conflict resolver handles paused-campaign enrollments:** `resolve-enrollment-conflicts/route.ts` auto-resolves stale conflicts by calling `enrollJobInCampaign()`. If the campaign is paused, this returns `null` (no active campaign) but does NOT update `enrollment_resolution` on the job record. Jobs stay stuck in `conflict` state permanently. Audit this code path in Phase 2.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection (2026-02-25) — `lib/actions/campaign.ts`, `lib/actions/enrollment.ts`, `components/jobs/job-detail-drawer.tsx`, `components/customers/customer-detail-drawer.tsx`, `components/jobs/add-job-sheet.tsx`, `components/jobs/service-type-select.tsx`, `components/dashboard/kpi-widgets.tsx`, `components/campaigns/campaign-card.tsx`, `components/campaigns/touch-sequence-editor.tsx`, `components/ui/button.tsx`, `components/ui/sheet.tsx`, `app/api/cron/resolve-enrollment-conflicts/route.ts`
- [shadcn/ui: Sheet with Sticky Header and Footer](https://www.shadcn.io/patterns/sheet-multi-section-5) — confirmed flex structure pattern
- [shadcn/ui chart docs](https://ui.shadcn.com/docs/components/radix/chart) — confirmed `pnpm dlx shadcn@latest add chart` and Recharts v3 usage
- [shadcn/ui issue #7669](https://github.com/shadcn-ui/ui/issues/7669) — confirmed Recharts v3 is now recommended; PR #8486 implements v3 support
- [Carbon Design System: Button usage](https://carbondesignsystem.com/components/button/usage/) — single high-emphasis button principle; `soft` variant rationale
- [HubSpot: Pause/Resume Sequence Behavior](https://knowledge.hubspot.com/sequences/pause-or-resume-your-sequences) — freeze-in-place as SaaS standard
- [Mailchimp API: Pause Automated Email](https://mailchimp.com/developer/marketing/api/automation-email/pause-automated-email/) — industry reference for freeze behavior
- [PatternFly: Button Design Guidelines](https://www.patternfly.org/components/button/design-guidelines/) — button hierarchy tiers
- [Polypane: All the Ways position:sticky Can Fail](https://polypane.app/blog/getting-stuck-all-the-ways-position-sticky-can-fail/) — overflow-y-auto + sticky footer interaction
- [Radix UI Select reset issue (GitHub #1808)](https://github.com/radix-ui/primitives/issues/1808) — `undefined` vs `''` reset behavior for placeholder

### Secondary (MEDIUM confidence)
- [uitop.design: Top Dashboard Design Trends 2025](https://uitop.design/blog/design/top-dashboard-design-trends/) — sparkline KPI pattern recommendation
- [Smashing Magazine: UX Strategies for Real-Time Dashboards 2025](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/) — activity feed colored icon pattern
- [uxdesign.cc: Design Thoughtful Dashboards for B2B SaaS](https://uxdesign.cc/design-thoughtful-dashboards-for-b2b-saas-ff484385960d) — KPI card design principles
- [lollypop.design: SaaS Navigation Menu Design 2025](https://lollypop.design/blog/2025/december/saas-navigation-menu-design/) — "History" vs "Activity" naming convention

### Tertiary (informational)
- User reference image + product brief — direct requirements specification for visual outcomes
- recharts GitHub releases — confirmed v3.7.0 as latest stable (January 2025)
- `docs/DATA_MODEL.md` — enrollment status enum and RLS policy review for freeze migration scope

---

*Research completed: 2026-02-25*
*Ready for roadmap: yes*
*Files synthesized: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Next step: Roadmap creation (use suggested 3-phase structure as starting point)*
