# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v3.1 QA E2E Audit — Phase 64 (History, Analytics, Feedback) Plan 02 — COMPLETE

## Current Position

Phase: 64 (QA-06: History, Analytics, Feedback)
Plan: 64-02-PLAN.md COMPLETE
Milestone: v3.1 QA E2E Audit
Status: Phase 64 plan 02 complete, plan 03 ready to execute

Progress: [███████░░░] 70% (7/9 phases complete)

Last activity: 2026-03-03 — Completed 64-02 Analytics Page QA (ANLYT-01, ANLYT-02, ANLYT-03: 3/3 PASS, 0 bugs)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 251
- v3.0 plans completed: 15/15
- v3.1 plans completed: 7/17

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

### Decisions from Phase 61-01 (Dashboard QA)

- **DASH-06 FAIL (Medium Bug):** `KPIWidgets` component (3 large left-column cards linking to /analytics) is defined in `components/dashboard/kpi-widgets.tsx` but NOT imported/rendered in dashboard. Removed between Phase 40 and current state. Right panel compact cards link to /history, /feedback instead.
- **DASH-10 PARTIAL (Medium Bug):** Mobile header overflow 17px at 375px viewport — "View Campaigns" button in dashboard header extends beyond viewport. Fix: hide secondary button on mobile (`hidden sm:flex`).
- **DASH-08 PARTIAL:** React hydration mismatch from Radix UI internal ID generation (business switcher, account menu, job action menus). Non-functional — framework-level known issue.
- **DASH-09 PARTIAL:** No `loading.tsx` for /dashboard route — only major route without one. Skeleton components (KPIWidgetsSkeleton, ReadyToSendQueueSkeleton, AttentionAlertsSkeleton) defined but not auto-rendered during SSR.
- Right panel compact KPI cards link to /history?status=reviewed, /feedback, /history (NOT /analytics) — context-specific navigation, not analytics hub
- `getSetupProgress(business.id)` called on every dashboard load but result never used — wasted DB query (Getting Started hard-disabled)
- Dark mode: theme toggle button has no aria-label — not discoverable by aria role; tested via JS evaluation as workaround
- Test account was NOT in pure zero-data state at Phase 61 — 4 jobs + 1 enrollment from Phase 60; Phase 62 data was concurrently created during QA run
- QA scripts use Windows-format paths (`C:\\AvisLoop\\`) for Playwright screenshot saves — Unix paths fail on win32

### Decisions from Phase 64-01 (History QA)

- **HIST-01 through HIST-05:** 4/5 PASS — History page core functionality verified
- **BUG-HIST-01 (Medium):** `getSendLogs` timezone bug — `setHours(23,59,59,999)` uses local machine time, not UTC. On UTC-6 machine, endOfDay for `2026-03-02` = `2026-03-02T05:59Z`, excluding today's rows at `2026-03-02T19-22Z`. Fix: `new Date(dateTo + 'T23:59:59.999Z')`
- **complained status (by design):** Not in `RESENDABLE_STATUSES = ['failed', 'bounced']` — shows "Failed" badge but no Retry button (spam complaint)
- **Status filter uses raw DB values:** `bounced` filter shows 1 row; `failed` filter shows 2 rows — correct, even though both display as "Failed" badge
- **HIST-05 bulk select confirmed:** `Select All` header selects exactly 3 rows (2 failed + 1 bounced), "3 messages selected" text appears, Retry Selected button appears
- **10 send_log rows seeded** in Supabase for Audit Test HVAC business — available for Phase 64-02 Analytics testing
- **DB verification pattern:** Supabase REST API `gte/lte` on date string `2026-03-02` works correctly at DB level; bug is in Next.js server component's `endOfDay` computation

### Decisions from Phase 64-02 (Analytics QA)

- **ANLYT-01 through ANLYT-03:** 3/3 PASS — Analytics page fully functional, 0 bugs found
- **Analytics RPC join path:** `jobs → campaign_enrollments → send_logs` — only campaign-linked send_logs count; 7 manual sends (campaign_enrollment_id=null) are excluded. This is by design — analytics tracks campaign performance, not manual sends.
- **3 send_logs with campaign_enrollment_id** (all HVAC): delivered, failed, bounced. RPC counts: total_sent=3, delivered=1 (delivered status only), reviewed=0, feedback=0
- **All 3 service types appear in breakdown:** RPC LEFT JOINs from jobs outward — plumbing and electrical show 0-count rows even with no sends. Correct behavior.
- **ANLYT-03 empty state:** Verified by code inspection only — `byServiceType.length === 0` condition confirmed in component source; test business has jobs so live trigger not available
- **RPC direct call blocked:** `get_service_type_analytics` SECURITY DEFINER has internal auth check blocking service-role REST calls; UI verification via Playwright used instead
- **`delivered` count logic:** `COUNT(sl.id) FILTER (WHERE sl.status IN ('sent', 'delivered', 'opened'))` — only these 3 statuses count as delivered; `bounced` and `failed` do not
- **Playwright button selector fix:** Use `button[type="submit"]` not `getByRole('button', { name: /sign in/ })` for login page submit button

### Decisions from Phase 63-01 (Campaigns QA)

- **8/10 PASS, 2 FAIL** — CAMP-05 and CAMP-06 FAIL due to unapplied frozen migration
- **CAMP-BUG-04 (CRITICAL):** Migration `20260226_add_frozen_enrollment_status.sql` never applied to DB — CHECK constraint blocks 'frozen' status, entire Phase 46 freeze/resume feature non-functional; `toggleCampaignStatus()` silently swallows constraint violation (no error handling on enrollment update)
- **CAMP-BUG-01 (Medium):** `ENROLLMENT_STATUS_LABELS` in `lib/constants/campaigns.ts` missing 'frozen' key — moot until BUG-04 fixed
- **CAMP-BUG-02 (Low):** Campaign detail page has no "Frozen" stat card — moot until BUG-04 fixed
- **CAMP-BUG-03 (Low):** `resolveTemplate()` in touch-sequence-display.tsx falls back to first system template by channel (alphabetically Cleaning) rather than filtering by campaign service type (HVAC) — cosmetic, actual sends use correct template
- **Conflict detection:** Second HVAC job for AUDIT_Patricia Johnson correctly sets `enrollment_resolution='conflict'`; conflict badge visible in dashboard Ready-to-Send queue with Skip/Queue actions
- **CAMP-10:** "Standard Follow-Up" campaign created (id: b81f6b2f, service_type=null, 3 touches) — available for Phase 64 testing
- **DB verification pattern:** Use Supabase REST API directly for enrollment state queries — this caught the CRITICAL BUG-04 that UI toast alone would have missed
- **Current DB state post-63:** 2 user campaigns (HVAC Follow-up 2-touch, Standard Follow-Up 3-touch), 4+ active enrollments, 0 send logs; conflict job for AUDIT_Patricia may need resolution before Phase 64

### Decisions from Phase 62-01 (Jobs QA)

- **JOBS-01 PARTIAL PASS (Low Bug BUG-01):** Column headers are string literals in job-columns.tsx; `getSortedRowModel()` + `onSortingChange` are wired in job-table.tsx but no onClick on `<th>` — clicking headers has no effect. Fix: wrap `header` in sort-button component or use TanStack `header.column.getToggleSortingHandler()`.
- **JOBS-02 PASS:** "+ Create new customer" div triggers inline create mode; `customerName` input pre-filled, email/phone inputs expand. Existing customer lookup via partial name works in autocomplete.
- **JOBS-08 PASS (critical):** Enrollment is synchronous on `markJobComplete()` — DB query immediately after confirms `campaign_enrollments` row with correct `touch_1_scheduled_at`. All 3 AUDIT_ HVAC jobs enrolled with exactly 24.0h delay.
- **JOBS-09 PASS:** Campaign selector appears after service type change, renders from Radix Select portal at page level. Options: "HVAC Follow-up — 2 touches, starts 1d", "Send one-off review request", "Do not send", "+ Create new campaign".
- Playwright selector fix: Radix Select option portal — use page-level `[role="option"]` not dialog-scoped.
- Playwright selector fix: PasswordInput show/hide button has `aria-label="Show password"` causing `getByLabel(/password/i)` strict mode failure. Use `getByRole('textbox', { name: /password/i })`.
- `MarkCompleteButton` renders as text "Complete" (size="xs") inside the Actions column for scheduled jobs on desktop — locator: `button:has-text("Complete")`.
- Current DB state post-62: 7 jobs (4 existing + 3 AUDIT_), 4 active enrollments (Test Technician + AUDIT_Patricia + AUDIT_Marcus + AUDIT_Sarah all in HVAC Follow-up)

### Decisions from Phase 65-01 (Settings General + Templates QA)

- **SETT-01 PASS:** General tab fields pre-populated from DB, edit/save works with "Settings saved successfully!" inline confirmation; business name change propagates to sidebar BusinessSwitcher immediately
- **SETT-02 PASS:** FormLinkSection displays existing form_token URL `http://localhost:3000/complete/NCuKdh6JvBMsKSNtyLvWl8DnimHtIYIW`; copy button has aria-label="Copy form URL"; clipboard API fails in headless Playwright (expected test env limitation)
- **SETT-03 PASS:** 16 templates (8 email + 8 SMS) grouped by channel with blue Email badges (EnvelopeSimple icon) and green SMS badges (ChatCircle icon); all 16 are system templates with "System Template" badge and "Use this template" button
- **SETT-04 PASS:** Created AUDIT_Test Email Template (count 8->9), appeared in list immediately; deleted via confirmation dialog (count 9->8), "Template deleted" toast shown; both create and delete DB-verified
- **SETT-09 PASS (partial):** Business name and sender name persist after full page reload
- **form_token for Phase 67:** `NCuKdh6JvBMsKSNtyLvWl8DnimHtIYIW` — persistent DB token, does not expire
- **Test business state (no user templates):** All 16 templates are system defaults; test business has zero user-created templates
- **Sidebar business name update:** revalidatePath in updateBusiness server action triggers sidebar re-render on save — sidebar shows new name immediately

### Decisions from Phase 65-02 (Settings Services + Customers QA)

- **SETT-05 PASS:** All 8 service type toggles work: toggle on highlights card (border-primary bg-primary/5), shows timing input with service-specific defaults (HVAC=24h, Plumbing=48h, Cleaning=4h, Roofing=72h). Toggle off removes highlight and timing. Save Changes button appears only when hasChanges=true. DB verified.
- **SETT-06 PASS:** Custom service names section appears only when "Other" is enabled. TagBadge pills with `aria-label="Remove {name} tag"` for precise accessibility targeting. Add/remove tested, DB verified.
- **SETT-07 PASS:** Customers tab renders 7 rows (Test Technician, Bob Wilson, Jane Doe, John Smith, AUDIT_Patricia, AUDIT_Marcus, AUDIT_Sarah). Search debounces, status filter (All/Active/Archived) works, tag filter UI present with 4 presets (VIP, repeat, commercial, residential).
- **SETT-08 PASS with V2 note:** No "Add Customer" button exists in Customers tab — intentional V2 design. Customers come from job completion only. Import CSV exists for migration. Edit via drawer auto-save notes works (debounce). Archive from drawer works (no confirmation dialog). Restore available via row action menu for archived customers.
- **SETT-09 PASS (Services partial):** Full page reload preserves enabled services, timing values, and toggle states.
- Review cooldown has its own separate Save button (independent of service type Save Changes) — changing cooldown does not require saving service types and vice versa.

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)
- v3.1 QA: Review funnel token (/r/[token]) requires a live sent touch or manually constructed HMAC token — decide approach before Phase 64.
- v3.1 QA: Dual-subdomain middleware is bypassed on localhost — document explicitly as "middleware cross-subdomain behavior not verified — requires staging environment."
- v3.1 QA Phase 59: AUTH-03 "Check Your Email" success state not visually confirmed due to Supabase rate limiting; re-verify in Phase 67 cleanup if needed.
- BUG-ONB-01: `software_used` column missing from businesses table (medium severity) — fix before production with `ALTER TABLE businesses ADD COLUMN software_used TEXT;`
- BUG-DASH-06: KPIWidgets removed from dashboard — no 3 large KPI cards linking to /analytics (medium severity) — fix before production: re-add KPIWidgets to dashboard-client.tsx or update right panel card destinations to /analytics
- BUG-DASH-10: Mobile header overflow 17px at 375px — "View Campaigns" button partially clipped (medium severity) — fix: `hidden sm:flex` on secondary header button
- BUG-JOBS-01: Column header clicks don't sort rows (low severity) — fix: wrap header strings in sort button components using `header.column.getToggleSortingHandler()`
- **BUG-CAMP-04 (CRITICAL):** Migration `20260226_add_frozen_enrollment_status.sql` never applied — CHECK constraint blocks 'frozen' status on campaign_enrollments; entire Phase 46 freeze/resume feature non-functional; `toggleCampaignStatus()` silently swallows constraint error. Fix: apply migration + add error handling in server action.
- BUG-CAMP-01: ENROLLMENT_STATUS_LABELS missing 'frozen' key in lib/constants/campaigns.ts (medium severity) — fix: add `frozen: 'Frozen'` entry (moot until BUG-04 fixed)
- BUG-CAMP-02: No "Frozen" stat card on campaign detail page (low severity) — fix: add 4th stat card for frozen count (moot until BUG-04 fixed)
- BUG-CAMP-03: resolveTemplate() shows wrong service type in preview (low severity) — fix: filter system templates by service_type before channel-only fallback
- BUG-HIST-01: getSendLogs timezone bug — setHours(23,59,59,999) uses local time; date range filter broken on non-UTC machines (medium severity) — fix: `new Date(dateTo + 'T23:59:59.999Z')` in lib/data/send-logs.ts

## Session Continuity

Last session: 2026-03-03
Stopped at: Completed 64-02-PLAN.md (Analytics Page QA) — 3/3 PASS, 0 bugs
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
Active business: Audit Test HVAC (businessId: 6ed94b54-6f35-4ede-8dcb-28f562052042)
form_token: NCuKdh6JvBMsKSNtyLvWl8DnimHtIYIW (for Phase 67)
Current DB state: 8 jobs (6 HVAC completed, 1 HVAC conflict, 1 Plumbing, 1 Electrical); 2 user campaigns (HVAC Follow-up, Standard Follow-Up); 4 active enrollments; 10 send_logs (3 with campaign_enrollment_id); 0 customer_feedback rows; 16 system templates, 0 user templates
Next action: `/gsd:execute-phase 64-03` (Feedback page QA)
