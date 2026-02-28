# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v3.1 QA E2E Audit — Phase 61 (Dashboard) — onboarding QA complete

## Current Position

Phase: 61 (QA-03: Dashboard)
Plan: 60-01-PLAN.md COMPLETE
Milestone: v3.1 QA E2E Audit
Status: Phase 60 complete, Phase 61 ready to execute

Progress: [██░░░░░░░░] 22% (2/9 phases complete)

Last activity: 2026-02-28 — Completed 60-01 Onboarding Wizard QA (ONB-01 PASS, ONB-02 PASS, ONB-03 PASS, BUG-ONB-01 documented)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 247
- v3.0 plans completed: 15/15
- v3.1 plans completed: 2/17

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
- **Phase 56-01 complete:** Insert-only server actions (createAdditionalBusiness, saveNewBusinessServices, createNewBusinessCampaign, completeNewBusinessOnboarding) + /onboarding?mode=new routing + /businesses middleware guard
- **Phase 56-02 complete:** CreateBusinessWizard 3-step UI (inline sub-components) wired into /onboarding?mode=new; Add Business button on /businesses page; full end-to-end flow live
- **Phase 57-01 complete:** Pooled billing enforcement — getPooledMonthlyUsage(userId) aggregates across all user-owned businesses; all 3 send actions use pooled count; billing page shows pooled total with "(all businesses)" label; effective tier = best tier across all businesses
- **Phase 58-01 complete:** Job completion form backend — form_token migration + partial index, Business.form_token type, publicJobSchema (email-or-phone cross-field), generateFormToken/regenerateFormToken server actions, createPublicJob() (service-role: customer upsert, job creation, conflict-aware enrollment), POST /api/complete (rate-limited, service type validation), FormLinkSection in Settings General tab
- **Phase 58-02 complete:** Public form UI — Server Component token resolution via service-role, mobile-optimized JobCompletionForm (react-hook-form + zod, 48px inputs, 56px submit, 16px text), custom not-found page, success state with "Submit Another Job"

### Key Context for v3.1 QA Audit

**Test account:** audit-test@avisloop.com / AuditTest123!

**Output location:** docs/qa-v3.1/ (per-page findings files) + docs/qa-v3.1/SUMMARY-REPORT.md

**Phase ordering (data-dependency chain):**
- Phase 59 (Auth) creates the authenticated session
- Phase 60 (Onboarding) creates the first business with a campaign preset
- Phase 61 (Dashboard) tests the dashboard with the business from Phase 60
- Phase 62 (Jobs) creates 3 test jobs (AUDIT_Patricia Johnson, AUDIT_Marcus Rodriguez, AUDIT_Sarah Chen) that trigger enrollment
- Phase 63 (Campaigns) reads enrollments created by Phase 62
- Phase 64 (History/Analytics/Feedback) reads send logs and analytics from Phase 63
- Phase 65 (Settings/Billing) captures the form_token URL needed by Phase 67
- Phase 66 (Businesses/Isolation) creates a second business for multi-business testing
- Phase 67 (Public Form + Edge Cases + Report) uses the form_token from Phase 65

**Critical pitfalls to watch:**
- Playwright-only testing misses server-side pipeline state — supplement with direct DB queries after every key action
- Multi-business isolation is never exercised by single-business tests — run dedicated cross-contamination checks in Phase 66
- Google OAuth cannot be fully automated — document as "button present, interactive flow not automatable via Playwright"
- Do NOT create test data speculatively — survey existing data first, then create only what is needed
- Prefix all created test customers with AUDIT_ for recognizability and cleanup

**Selectors (priority order):**
1. `getByRole()` — semantic, accessibility-aligned
2. `getByLabel()` — for form inputs
3. `getByText()` — for unique visible text
4. `getByTestId()` — add data-testid only where semantic selectors are ambiguous
5. CSS selectors — last resort only

**Viewports:** desktop (1440x900), tablet (768x1024), mobile (390x844)
**Themes:** light always; dark for dashboard, jobs, settings General tab

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
- `updateBusinessNotes` omits `revalidatePath` — auto-save notes is fire-and-refresh, no page re-render needed
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

### Decisions from Phase 56-02

- Inline sub-components (BusinessSetupStep, CampaignPresetStep, SMSConsentStep) defined within create-business-wizard.tsx — avoids adding callback props to existing step components that hardcode the onboarding-specific server actions
- No localStorage draft persistence for the 3-step wizard — intentional, avoids 'onboarding-draft-v3' key collision and is appropriate for a short 3-step flow
- switchBusiness() called ONLY after completeNewBusinessOnboarding() succeeds — never mid-wizard

### Decisions from Phase 57-01

- `getPooledMonthlyUsage(userId)` — billing enforcement is now user-scoped, not business-scoped. Prevents N x limit loophole for agency owners with multiple businesses.
- Effective tier = BEST tier (TIER_PRIORITY: trial=0, basic=1, pro=2, reduce to max). User gets the tier they paid for.
- `getMonthlyUsage(businessId)` preserved — still used for per-business warning banners on campaigns/customers/settings pages (correct per-business context there).
- `bizData.tier` removed from select in send action files — no longer needed after pooled migration.

### Decisions from Phase 56-01

- `createAdditionalBusiness` uses `.insert()` only — never `.upsert()`, never conditional create-or-update. Critical safety invariant for multi-business creation.
- All `.update()` calls in create-additional-business.ts include `.eq('user_id', user.id)` ownership guard in addition to RLS — defense in depth.
- `createNewBusinessCampaign` inlines `duplicateCampaign()` logic rather than calling the existing function, because the existing function calls `getActiveBusiness()` internally.
- `isNewBusinessMode` derived from `params.mode === 'new'` before the completed-onboarding redirect check.
- `/businesses` added to `APP_ROUTES` in middleware — auth protection consistent with all other dashboard routes.

### Decisions from Phase 58-01

- Persistent DB token (`form_token` column) for public form URL — HMAC tokens expire; form URL must be permanent and printable.
- API Route Handler (`POST /api/complete`) not Server Action — Server Actions use auth-scoped `createClient()` which returns anonymous session for unauthenticated pages. Route Handler uses `createServiceRoleClient()` directly.
- Public form conflict defaults to `enrollment_resolution: 'conflict'` (job created, enrollment skipped) — technicians lack context for Replace/Skip/Queue; owner resolves from dashboard.
- `createPublicJob()` inlines conflict detection (not reusing `checkEnrollmentConflict()`) — existing function uses auth-scoped client; inlining avoids refactoring auth-coupled functions.
- `generateFormToken()` is idempotent — returns existing token if already set; prevents accidental churn on Settings re-render.
- No `revalidatePath()` in `createPublicJob()` or `POST /api/complete` — no auth context in public endpoint; dashboard user sees updates on next load.
- `/complete` correctly absent from `APP_ROUTES` in middleware — public route passes through without auth redirect (verified).
- Phone dedup added before create-new in `createPublicJob()` — if no email match but phone provided, check existing customers by E.164 phone. Prevents duplicate records for phone-only submissions.

### Decisions from Phase 58-02

- Client-side form schema separate from `publicJobSchema` — omits `token` field (injected from props during submission, not a user-entered field).
- Single enabled service type auto-selected and dropdown hidden — fewer fields = faster on-site completion.
- Success state replaces form in-place (not a separate route) — faster than navigation; "Submit Another Job" resets without reload.

### Cross-Cutting Concerns (apply to every plan)

- Design system: use existing semantic tokens and design system patterns
- Code scalability: consolidate, don't duplicate
- Dead code removal: audit for unused imports after each change
- Security: validate all user inputs server-side, maintain RLS discipline

### Decisions from Phase 59-01 (Auth Flows QA)

- AUTH-01 PASS: audit-test@avisloop.com login confirmed working; active business "Audit Test HVAC" with businessId confirmed
- AUTH-04 PASS: Supabase SSR cookie-based session survives page refresh, cross-route navigation, and browser back
- AUTH-05 PASS: Zod client-side validation produces field-level errors; Supabase error passthrough shows "Invalid login credentials" (no raw errors)
- Playwright invoked via `./node_modules/playwright/index.mjs` (ES module) — not global install
- Supabase email rate limit hit during testing — space out auth email tests across sessions
- `@test.com` domain blocked by Supabase domain policy — use real-format emails (e.g. @gmail.com) for future signup tests
- Logout via Account menu -> Logout menuitem; after logout, /dashboard redirects to /auth/login

### Decisions from Phase 60-01 (Onboarding Wizard QA)

- ONB-01 PASS: First-business 4-step wizard end-to-end confirmed; all DB writes verified (onboarding_completed_at, service_types_enabled, sms_consent_acknowledged, phone, google_review_link, custom_service_names, campaign + touches)
- ONB-02 PASS: Additional-business 2-step wizard (CreateBusinessWizard) creates correct records; original business 100% unchanged
- ONB-03 PASS: Draft persistence is DB-backed — step Continue writes to DB, server pre-fills on return; localStorage key 'onboarding-draft-v3' not used for field values
- **BUG-ONB-01 (Medium):** `software_used` column missing from businesses table — `saveSoftwareUsed()` server action silently fails (PGRST204); fix: `ALTER TABLE businesses ADD COLUMN software_used TEXT;`
- Dashboard does NOT redirect to /onboarding when onboarding_completed_at=null — only redirects when activeBusiness===null. Intentional V2 behavior.
- CreateBusinessWizard (additional business) has 2 steps, not 3 — SMS Consent omitted, sms_consent_acknowledged set to true server-side. By design.
- Gentle Follow-Up preset creates campaign named "Conservative (Email Only) (Copy)" — display name in UI differs from internal preset name
- Service role DELETE requires `id=eq.<specific-id>` filter, not user_id-scoped filter, to bypass RLS in test cleanup
- QA test scripts use Node.js ESM with playwright-core direct import (no global playwright CLI needed)

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)
- v3.1 QA: Review funnel token (/r/[token]) requires a live sent touch or manually constructed HMAC token — decide approach before Phase 64.
- v3.1 QA: Dual-subdomain middleware is bypassed on localhost — document explicitly as "middleware cross-subdomain behavior not verified — requires staging environment."
- v3.1 QA Phase 59: AUTH-03 "Check Your Email" success state not visually confirmed due to Supabase rate limiting; re-verify in Phase 67 cleanup if needed.
- BUG-ONB-01: `software_used` column missing from businesses table (medium severity) — fix before production with `ALTER TABLE businesses ADD COLUMN software_used TEXT;`

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 60-01-PLAN.md (Onboarding Wizard QA) — ONB-01/02/03 all PASS, BUG-ONB-01 documented
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
Active business: Audit Test HVAC (reset to pre-onboarding state: onboarding_completed_at=null)
Next action: `/gsd:execute-phase 61` (Dashboard QA)
