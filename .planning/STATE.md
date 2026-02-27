# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v3.0 Agency Mode (Phases 52-58) — Phase 55 COMPLETE, Phase 56 next

## Current Position

Phase: 55 of 58 (Clients Page) — COMPLETE
Plan: 3/3 in current phase (phase complete)
Milestone: v3.0 Agency Mode (Phases 52-58)
Status: Phase 55 complete and verified — ready to plan Phase 56

Progress: [█████░░░░░] ~57% (Phase 55 of 7 phases, all plans complete)

Last activity: 2026-02-27 — Phase 55 verified, all 7 must-haves passed

## Performance Metrics

**Velocity:**
- Total plans completed (project): 239
- v3.0 plans completed: 9/TBD

*Updated after each plan completion*

## Accumulated Context

### Key Architecture Decisions for v3.0

- Active business resolved via httpOnly cookie (`active_business_id`) — no URL restructuring
- `getActiveBusiness()` is the single resolution point: reads cookie, verifies ownership, falls back to first business
- Agency metadata (10 columns) added to existing `businesses` table — no new table, inherits existing RLS
- `BusinessSettingsProvider` extended with businessId, businessName, businesses[] — no prop drilling
- First-business onboarding: existing upsert path (unchanged). Additional businesses: new `createAdditionalBusiness()` insert-only path
- Cron endpoints unaffected — they use service role and query by business_id directly
- `reviews_gained` computed at read time (current - start), never stored
- **Phase 53 complete:** All data functions and server actions use explicit `businessId` parameter — zero PGRST116 crash risk
- **Phase 54 complete:** BusinessSwitcher in desktop sidebar AND mobile page header — zero code duplication, same component both surfaces
- **Phase 55-01 complete:** Agency metadata data layer — 10 nullable columns on businesses table, extended Business interface, getUserBusinessesWithMetadata(), updateBusinessMetadata(), updateBusinessNotes(), businessMetadataSchema
- **Phase 55-02 complete:** Businesses card grid — /businesses route (Server Component), BusinessCard with agency metadata display, BusinessesClient with drawer state pre-wired for Plan 55-03, BusinessCardSkeleton + loading.tsx
- **Phase 55-03 complete:** Business detail drawer — BusinessDetailDrawer with view/edit modes, notes auto-save (CustomerDetailDrawer pattern), competitive analysis, Switch business button; BusinessesClient fully wired with optimistic update on save

### Decisions from Phase 52-01

- `.limit(1)` with `data?.[0] ?? null` used in fallback query (not `.single()`) — `.single()` throws PGRST116 on 0 rows AND 2+ rows; `.limit(1)` returns empty array gracefully
- `getActiveBusiness()` MUST NOT call `cookieStore.set()` — server components cannot set cookies; only server actions can
- No `domain` attribute on business cookie — scoped to current host only (differs from Supabase auth cookie which uses `.avisloop.com`)
- `ACTIVE_BUSINESS_COOKIE` exported from `lib/data/active-business.ts` — single source of truth, imported by action module

### Decisions from Phase 52-02

- New `BusinessSettingsProvider` props (businessId, businessName, businesses) are required (not optional) — fails at compile time rather than silently passing wrong business ID at runtime
- Empty-string fallback (`businessId = business?.id ?? ''`) in layout is safe: zero-business users redirect before any code uses the ID
- `BusinessIdentity` type exported from provider — Phase 54 switcher imports from there, not redefined

### Decisions from Phase 53

- All lib/data/ functions accept `businessId: string` as first param — callers responsible for passing verified businessId
- All lib/actions/ functions call `getActiveBusiness()` at top — no manual `.eq('user_id', ...).single()` business lookup
- All page Server Components call `getActiveBusiness()` once and thread `business.id` to data functions
- `getJobs` return type drops `businessId` field — callers already have it
- `getDashboardCounts` uses businessId directly without intermediate query
- `getSetupProgress` simplified to single `getChecklistState(businessId)` call
- `lib/data/customer.ts` deleted — dead code with zero importers
- Onboarding page handles null business: `getActiveBusiness()` may return null for new users
- Billing actions keep `getUser()` for email (Stripe) but use `getActiveBusiness()` for business
- Safe patterns left unchanged: `retrySend`, `acknowledgeAlert`, `dismissFeedbackAlert` (ownership via entity PK)

### Decisions from Phase 54-01

- BusinessSwitcher reads zero props — gets `businesses`, `businessId`, `businessName` entirely from `useBusinessSettings()` context
- No `router.refresh()` after `switchBusiness()` — `revalidatePath('/', 'layout')` inside action handles re-render
- `isPending` guard uses `opacity-60 pointer-events-none` CSS rather than `disabled` attribute for smoother pending UX
- Business context strip hidden when sidebar collapsed — consistent with nav label hiding pattern

### Decisions from Phase 54-02

- Mobile header uses three-section flex layout: left shrink-0 | center flex-1 min-w-0 | right shrink-0
- Center section uses `justify-end` — business name right-aligned near account button, away from logo
- `min-w-0` on center section required for BusinessSwitcher's `truncate` class to work (flex items don't shrink below content size without it)
- No props, state, or hooks added to page-header.tsx — purely layout restructure + import

### Decisions from Phase 55-01

- `NUMERIC(2,1)` for rating columns — avoids floating point issues (4.3 not 4.299999)
- `NUMERIC(10,2)` for monthly_fee — standard currency column precision
- `agency_notes` excluded from `businessMetadataSchema` — has its own `updateBusinessNotes()` action with simple length check and no revalidatePath
- `updateBusinessNotes` omits `revalidatePath` — auto-save notes is fire-and-forget, no page re-render needed
- `getUserBusinessesWithMetadata` does NOT use `getActiveBusiness()` — Clients Page shows ALL businesses

### Decisions from Phase 55-02

- `void selectedBusiness` / `void drawerOpen` in BusinessesClient — suppresses ESLint no-unused-vars for state pre-wired for Plan 55-03 drawer integration
- Competitive gap tie case (`gap === 0`) shows "Tied with [competitor]" as muted text, distinct from positive (green) and negative (red)
- `competitor_name` included in competitive gap text when available — "3 ahead of ABC Plumbing" more informative than "3 ahead of competitor"
- `Star weight="fill"` for Google rating — filled star communicates current rating; outline star would suggest empty/missing

### Decisions from Phase 55-03

- Gap indicator uses `gap !== null` guard (computed only when both `review_count_current` and `competitor_review_count` are non-null) — both fields required for a meaningful gap value
- `isEditing` reset to `false` on drawer close via `useEffect([open])` — drawer always opens in view mode
- `isSwitching` state guards Switch button against double-clicks during server action
- `localBusinesses` synced from prop via `useEffect([businesses])` — grid updates automatically after server revalidation

### Cross-Cutting Concerns (apply to every plan)

- Design system: use existing semantic tokens and design system patterns
- Code scalability: consolidate, don't duplicate
- Dead code removal: audit for unused imports after each change
- Security: validate all user inputs server-side, maintain RLS discipline

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)

## Session Continuity

Last session: 2026-02-27
Stopped at: Phase 55 complete and verified — ready to plan Phase 56 (Additional Business Creation)
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
