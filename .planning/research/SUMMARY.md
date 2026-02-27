# Research Summary: v3.0 Agency Mode

**Synthesized:** 2026-02-26
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Overall Confidence:** HIGH — all four dimensions researched via direct codebase inspection

---

## Key Findings

- **Zero new npm dependencies required.** Every UI component needed (DropdownMenu, Card, Sheet) is already installed. The entire milestone is a data architecture refactor plus new UI composition.
- **The single most dangerous line of code is `.eq('user_id', user.id).single()`.** It appears ~86 times across 20+ files and crashes with PGRST116 the moment a second business is created. This must be eliminated before any multi-business UI is exposed to users.
- **RLS already supports multi-business.** Policies use `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` — no RLS changes needed, which significantly reduces security risk.
- **Onboarding contains a silent data-destruction bug.** `saveBusinessBasics()` uses `.upsert()` keyed on `user_id`. Running the wizard a second time silently overwrites the first business with no error. A dedicated `.insert()` path is required for additional businesses.
- **Cookie-based context switching is the right call for 2-5 businesses.** URL segments (`/[businessId]/dashboard`) would require restructuring every route, link, and middleware rule — 3-5x the engineering effort for a use case that doesn't justify it.
- **Cron endpoints are unaffected.** They use the service role and query by `business_id` directly, so they already process all businesses correctly. Do not touch them.
- **Agency metadata requires no new table.** 10 columns added directly to the existing `businesses` table, inheriting existing RLS automatically.
- **The data refactor is the longest phase by file count** but is mechanical in nature — the same three-line pattern replaced with `getActiveBusiness()` everywhere.

---

## Stack Additions

No new npm packages. Changes are confined to existing stack capabilities:

| Area | Technology | Change Type |
|------|-----------|-------------|
| Business context switching | `next/headers cookies()` | New usage of built-in |
| Business switcher dropdown | `@radix-ui/react-dropdown-menu` (already installed) | New component using existing dep |
| Clients page grid | `components/ui/card.tsx` + `sheet.tsx` (already exist) | New page using existing components |
| Agency metadata | Supabase migration — 10 columns on `businesses` | Schema change only |
| Data refactor | `lib/data/*.ts` + `lib/actions/*.ts` | Code change, no new dep |
| Billing pooling | Existing Stripe integration | Logic change only |

**Rationale:** The app is already well-equipped. Adding dependencies for this milestone would be over-engineering.

---

## Feature Priorities

### Table Stakes (required for multi-business to function)

| Feature | Why Non-Negotiable |
|---------|--------------------|
| Cookie-based active business resolver (`getActiveBusiness()`) | Foundation — every data function depends on it |
| `.single()` refactor across all 86 instances | Without this, the app crashes after business 2 is created |
| Business switcher in sidebar | Users need a way to change the active business |
| Separate onboarding path for additional businesses | Protects first business data from silent overwrite |
| Full onboarding per new business | Each client needs complete setup to function |

### Differentiators (make the feature actually useful)

| Feature | Value |
|---------|-------|
| Clients page (`/businesses`) with card grid | At-a-glance view of all clients, Google metrics, reviews gained |
| Client detail drawer | Editable profile with Google ratings (start vs current), monthly fee, competitor, GBP access, notes |
| `reviews_gained` computed display | The key outcome metric for proving agency value |
| Business name shown in sidebar | Constant awareness of which business is active |
| Unified billing with pooled usage | One subscription, no per-client billing complexity |

### Anti-Features (explicitly excluded from v3.0)

| Feature | Reason Excluded |
|---------|----------------|
| Client self-service portal | Out of scope — agency owner manages everything |
| White-label branding per business | Overkill for 2-5 clients |
| Live Google API sync | Adds API dependency, rate limits, and cost; manual entry sufficient |
| Cross-business analytics dashboard | Different product; each business has its own dashboard |
| Per-business billing (N subscriptions) | Major complexity with no business reason |
| Role-based access / team members | Future milestone per CLAUDE.md |
| Business archiving/deletion | Edge cases with active enrollments; defer |
| Business settings cloning | Run full wizard; setup is fast |

---

## Architecture Decisions

### Decision 1: Cookie over URL segments

Cookie (`active_business_id` httpOnly) is set via server action; Server Components read it via `cookies()` from `next/headers`. All data functions receive explicit `businessId`.

**Why:** No route restructuring. Works with existing middleware. Right-sized for 2-5 businesses. Known limitation (multi-tab): acceptable and documented.

### Decision 2: `getActiveBusiness()` as the single resolution point

New function in `lib/data/business.ts`. Reads cookie, verifies ownership, falls back to first business. Every page-level Server Component calls this once and threads `businessId` to all downstream data functions.

### Decision 3: Agency metadata on `businesses` table, not a new table

10 nullable columns added to `businesses`. Inherits existing RLS with zero additional policy work. `reviews_gained` is computed at read time (`current - start`), never stored.

### Decision 4: Extend `BusinessSettingsProvider` to carry business identity

Current provider only has `enabledServiceTypes` and `customServiceNames`. Must be extended with `businessId`, `businessName`, and `businesses[]` list so client components (sidebar switcher) can access context without prop drilling or additional fetches.

### Decision 5: Separate onboarding code paths

First business: existing upsert (preserves current onboarding behavior). Additional businesses: new `createAdditionalBusiness()` server action using `.insert()` only. After creation, `switchBusiness()` sets the new business as active.

### Component Map (new vs modified)

**New:**
- `components/layout/business-switcher.tsx`
- `components/businesses/business-card.tsx`
- `components/businesses/business-detail-drawer.tsx`
- `components/businesses/businesses-client.tsx`
- `app/(dashboard)/businesses/page.tsx`

**Modified (key files):**
- `lib/data/business.ts` — add `getActiveBusiness()`, `getUserBusinesses()`
- `lib/actions/business.ts` — add `switchBusiness()`, `createAdditionalBusiness()`
- `app/(dashboard)/layout.tsx` — use `getActiveBusiness()`, thread to provider
- `components/providers/business-settings-provider.tsx` — extend with business identity
- `components/layout/sidebar.tsx` — add BusinessSwitcher at top
- Every `lib/data/*.ts` and `lib/actions/*.ts` — remove `.single()`, accept explicit `businessId`

---

## Critical Pitfalls

### Pitfall 1 — The `.single()` Cascade (CRITICAL)

86 instances of `.eq('user_id', user.id).single()` across 20+ files throw PGRST116 the moment a second business exists. This crashes every page.

**Must be fully resolved before enabling multi-business creation. No exceptions.**

**Mitigation:** Create `getActiveBusiness()` first, then grep exhaustively and refactor all instances. Run with 2 real businesses in staging to verify before shipping.

### Pitfall 2 — Onboarding Upsert Destroys First Business (CRITICAL)

`saveBusinessBasics()` upserts on `user_id` — silently overwrites first business with no error. The damage is discovered only when checking the first client's settings.

**Mitigation:** Create `createAdditionalBusiness()` using `.insert()` only. Gate old upsert path to first-business only. Verify by creating business A then B and confirming A is unchanged.

### Pitfall 3 — Dashboard Redirect Logic Breaks (HIGH)

`dashboard/page.tsx` redirects to `/onboarding` when `getBusiness()` returns null. After the refactor, `getActiveBusiness()` returning null (no cookie) must NOT trigger onboarding redirect if the user has businesses.

**Mitigation:** Two separate checks — "user has zero businesses" goes to onboarding; "user has businesses but no cookie" auto-selects first business and stays on dashboard.

### Pitfall 4 — Billing Counts Per-Business, Not Total (MEDIUM)

Current billing checks sends for one business. Agency owner could distribute sending across N businesses and never hit plan limits.

**Mitigation:** Usage query must sum sends across all `business_id` values owned by `user_id`. Verify by sending from two businesses and checking combined limit enforcement.

### Pitfall 5 — Mobile Has No Business Switcher (MEDIUM)

Desktop sidebar gets the switcher. Mobile bottom nav has no room. Agency owners on mobile cannot switch businesses.

**Mitigation:** Add business switcher to mobile header area (above page content). Sheet-based approach works within existing mobile patterns.

---

## Recommended Build Order

The dependency chain is strict. Phases must execute in this order.

### Phase 1: Foundation (Schema + Business Resolver)

Add 10 agency metadata columns to `businesses` table. Create `getActiveBusiness()`, `getUserBusinesses()`, `switchBusiness()`. Extend `BusinessSettingsProvider` with business identity.

**Rationale:** Every subsequent phase depends on the resolver. Extend the provider here so the sidebar switcher does not require additional prop drilling later. No UI visible yet — purely infrastructure.

**Pitfalls to avoid:** Pitfall 3 (cookie architecture decision — commit to it here), Pitfall 4 (no new tables needed — columns only, existing RLS covers it).

**Research flag:** Standard patterns; no additional research needed.

### Phase 2: Data Function Refactor

Grep all 86 `.eq('user_id').single()` instances. Replace with explicit `businessId` from `getActiveBusiness()`. Fix dashboard redirect logic (separate "no businesses" from "no selection"). Update all page-level server components.

**Rationale:** Must be complete before any business switching UI is exposed. A partial refactor means some pages crash and some work — worse than the status quo. This is the highest-risk phase by volume.

**Pitfalls to avoid:** Pitfall 1 (missing instances — grep exhaustively, produce a file checklist in the plan), Pitfall 3 (dashboard redirect), Pitfall 8 (cron endpoints — leave alone, they already work correctly).

**Research flag:** At plan time, run a complete grep to enumerate every file affected. The "86 instances" count is an estimate. The plan must list every file explicitly before coding begins.

### Phase 3: Business Switcher UI

Build `BusinessSwitcher` component. Add to sidebar (desktop). Add to mobile header area. Wire to `switchBusiness()` server action. Show current business name in sidebar.

**Rationale:** First user-visible multi-business feature. Requires Phase 1 (resolver + provider) and Phase 2 (data functions do not crash on business switch).

**Pitfalls to avoid:** Pitfall 5 (mobile switcher — add to header area in this phase), Pitfall 9 (long business names — use `truncate` class + tooltip).

### Phase 4: Clients Page

Build `/businesses` route with responsive card grid. Build `BusinessDetailDrawer` with all agency metadata fields (auto-save notes, editable ratings/fees/competitor). Display `reviews_gained` as computed field (`current - start`).

**Rationale:** Requires Phase 1 (agency columns), Phase 2 (data functions), Phase 3 (switcher wired so "Switch to Business" button in the drawer works).

**Pitfalls to avoid:** Pitfall 9 (long business names in cards — truncate + tooltip).

### Phase 5: Additional Business Onboarding

Create `createAdditionalBusiness()` server action using `.insert()`. Add "Add Business" button on Clients page. Reuse the 3-step wizard with the new insert path. After completion, call `switchBusiness()` to activate the new business and redirect to dashboard.

**Rationale:** The most dangerous phase for data integrity. Must never reuse the upsert-based onboarding path. Placed last among feature phases so Clients page already exists as the natural entry point.

**Pitfalls to avoid:** Pitfall 2 (upsert destroys first business — this phase is specifically designed to prevent it). Audit all 3 onboarding steps for upsert patterns, not just step 1.

### Phase 6: Billing

Update usage counting to sum sends across all `business_id` values owned by `user_id`. Verify limit enforcement works when sends span multiple businesses.

**Rationale:** Independent of UX. Placed last because testing requires real businesses with real sends — all other phases must be complete first.

**Pitfalls to avoid:** Pitfall 6 (per-business counting — change to user-level sum).

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| Stack (zero new deps) | HIGH | Verified by direct codebase inspection of `package.json` and installed components |
| Features (table stakes + differentiators) | HIGH | Clear requirements, no ambiguity about scope or anti-features |
| Architecture (cookie approach, resolver pattern) | HIGH | Standard Next.js pattern; RLS compatibility verified against actual policies |
| Data refactor scope (86 instances) | HIGH | Grep-estimated count; mechanical work; known risk is incompleteness — fix with full file enumeration at plan time |
| Onboarding separation | MEDIUM | Logic is clear but all 3 onboarding steps need upsert audit, not just step 1 |
| Billing pooling | MEDIUM | Logic is clear; Stripe integration details need verification during implementation |
| Mobile switcher UX | MEDIUM | Approach decided (header area), exact component and placement is a design decision at build time |

### Gaps to Address During Planning

1. **Exhaustive .single() file list** — Grep at plan time to produce a complete file-by-file checklist. The "86 instances" is an estimate; the Phase 2 plan must enumerate every file explicitly before any coding begins.
2. **Full onboarding upsert audit** — Each of the 3 onboarding steps may use upsert-style saves independently. Verify all steps, not just `saveBusinessBasics()`.
3. **Mobile business switcher placement** — Decided in principle (header area above page content) but the exact component and layout require a design decision before Phase 3 coding.

---

## Sources

- `STACK.md` — Technology stack and dependency analysis via direct codebase inspection (2026-02-26)
- `FEATURES.md` — Feature scope, table stakes, anti-features via user requirements + codebase analysis (2026-02-26)
- `ARCHITECTURE.md` — Integration patterns, component map, build order via direct codebase analysis (2026-02-26)
- `PITFALLS.md` — Risk register with mitigations via codebase pattern analysis (2026-02-26)

---

*Research completed: 2026-02-26*
*Ready for roadmap: yes*
*Files synthesized: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Next step: Roadmap creation (use suggested 6-phase structure as starting point)*
