# Research Summary: v3.1 QA E2E Audit

**Project:** AvisLoop — Comprehensive Pre-Production QA Audit
**Domain:** Multi-tenant SaaS — E2E functional + accessibility audit before first production deployment
**Researched:** 2026-02-27
**Confidence:** HIGH (all four research dimensions grounded in direct codebase analysis + official sources)

---

## Executive Summary

AvisLoop is preparing for its first production deployment after completing v3.0 Agency Mode (Phases 52-58). The v3.1 milestone is not a feature build — it is a structured QA audit that produces a **findings report** per page/category, screenshots as evidence, and a consolidated summary report. The audit covers 15+ routes across 9 phases, ordered by data dependency rather than navigation order: auth first, public pages last.

The recommended approach is Playwright-driven browser automation supplemented by direct database verification. Playwright 1.58.1 is already installed; the only addition needed is `@axe-core/playwright` for WCAG scanning. Authentication uses UI-based login with `storageState` (not API cookie injection) because Supabase's SSR package revalidates sessions server-side on every request. Multi-business context switching uses direct `context.addCookies()` for the `active_business_id` cookie, which is an application-level cookie distinct from the Supabase auth session.

The three highest-risk audit areas are: (1) multi-tenant data isolation under business switching, which is never fully exercised by single-business tests; (2) the enrollment conflict state machine, which has six transition paths only some of which are reachable via UI alone; and (3) the dual-subdomain middleware, which is entirely bypassed on localhost and has never been tested end-to-end in a real domain configuration. The audit must explicitly address these gaps with scenarios beyond the happy path — and critically, must supplement Playwright UI observation with direct Supabase SQL queries to verify server-side automation pipeline state.

---

## Key Findings

### 1. Stack Additions

Playwright 1.58.1 is already installed and sufficient for the audit. Add exactly one dev dependency.

| Tool | Version | Role | Rationale |
|------|---------|------|-----------|
| `@axe-core/playwright` | latest | WCAG 2.1 AA scanning | Playwright's built-in `page.accessibility.snapshot()` gives tree structure only; axe-core runs the full rule engine against the live DOM, catching color contrast, missing labels, and 50+ WCAG rules |

**Do NOT add:** Cypress, Percy/Chromatic, Vitest, `playwright-testing-library`, Faker. All needed capabilities are built into Playwright 1.5x. `toHaveScreenshot()` replaces Percy; `getByRole/Label/Text` replaces testing-library; screenshots are evidence docs, not pixel-diff regression baselines.

**Auth pattern:** UI login + `storageState` JSON file. API cookie injection does not work because Supabase SSR re-validates and re-issues session cookies on each server request. `e2e/.auth/` must be gitignored immediately.

**Parallelism:** `workers: 1` in CI. Supabase free tier limits concurrent DB connections; parallel workers each open their own connection pool and cause `FATAL: remaining connection slots are reserved` errors.

**New scripts to add to `package.json`:**
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:report": "playwright show-report e2e/report",
"test:e2e:update": "playwright test --update-snapshots"
```

---

### 2. Audit Categories

#### Table Stakes (must pass before production)

| Category | Code | Why It Blocks Production |
|----------|------|--------------------------|
| Authentication and Session Management | A | Broken auth means no one can use the app |
| Multi-Tenant Data Isolation | B | Cross-tenant data leak is a production-blocking security issue |
| Core V2 Workflow — Job Completion to Enrollment | C | If "complete job" doesn't trigger enrollment, the product does not work |
| Enrollment Conflict Handling | D | Most common edge case; broken conflict detection causes double-emails or silent failure |
| Review Funnel (`/r/[token]`) | E | The money path — broken funnel means zero reviews collected |
| Public Job Completion Form (`/complete/[token]`) | F | Technician tool; Phase 58 deliverable |
| History / Send Logs | G | Operators troubleshoot from here; broken filters block recovery from failures |
| Billing and Send Limit Enforcement | H | Pooled agency billing is new in v3.0; broken enforcement means revenue leakage |
| Settings — All 7 Tabs | I | Settings configures the entire automation pipeline |

#### Differentiators (thorough but not deployment-blocking)

| Category | Code | Why It Warrants Thorough Testing |
|----------|------|----------------------------------|
| Multi-Business and Agency Workflow | J | Entire v3.0 built this; non-trivial state under context switching |
| Campaign Management | K | Pause/resume with frozen enrollment preservation is complex state machine |
| Dashboard | L | First thing users see; wrong KPIs erode trust immediately |
| Feedback Resolution Workflow | M | Resolution state must persist or owners re-see resolved issues |
| Analytics | N | Wrong numbers break the value story |
| Customers Page (Settings Escape Hatch) | O | De-emphasized in V2 but cannot be broken |
| Onboarding Flow | P | First user experience; two distinct flows (first vs additional business) both need verification |

#### Anti-Features (explicitly excluded from this milestone)

| Item | Reason |
|------|--------|
| Cron job end-to-end execution | Timing-dependent; requires production Vercel schedule or manual trigger |
| Email/SMS delivery confirmation | Requires live Resend/Twilio API with real addresses |
| Stripe payment processing end-to-end | Requires live Stripe keys; test webhook handler logic only |
| Google OAuth interactive flow | Requires Supabase redirect URI configured for production domain |
| Marketing / public pages deep audit | Explicitly out of scope for this milestone |
| Performance/load testing | No user load to measure yet |
| WCAG AA full compliance certification | Carry UX Audit findings forward as backlog items; axe scan is sufficient |
| Persistent Playwright test suite | This milestone produces a findings report, not a maintained test suite |

---

### 3. Architecture Decisions

#### Phase Grouping: 9 Phases in Data-Dependency Order

The audit is structured around data dependency, not page navigation order. Each phase produces data that downstream phases depend on.

```
QA-01 (Auth) → QA-02 (Onboarding) → QA-03 (Dashboard) → QA-04 (Jobs)
     ↓
QA-05 (Campaigns) → QA-06 (History + Analytics + Feedback)
     ↓
QA-07 (Settings) → QA-08 (Businesses + Switcher) → QA-09 (Public Pages)
```

**The data dependency chain:**
- QA-01 creates the authenticated session
- QA-02 creates the first business with a campaign preset
- QA-04 creates 3 test jobs (AUDIT_Patricia Johnson, AUDIT_Marcus Rodriguez, AUDIT_Sarah Chen) that trigger campaign enrollment
- QA-05 reads the enrollments from QA-04
- QA-06 reads send logs and analytics produced by QA-05
- QA-07 generates the `form_token` needed by QA-09
- QA-08 creates a second business needed for multi-business switcher testing
- QA-09 uses the `form_token` from QA-07 for the `/complete/[token]` test

#### Data Strategy: Use Existing Test Account + Progressive Creation

- Primary test account: `audit-test@avisloop.com / AuditTest123!`
- Do NOT create test data speculatively — survey existing data first, document it, then create only what is needed
- Prefix all created customers with `AUDIT_` for recognizability and cleanup
- Never delete data that later phases depend on; create throwaway items specifically for destructive-action tests

#### Report Format: Per-Page Findings Files + Summary Report

| Location | Format |
|----------|--------|
| `.planning/qa-audit/findings/qa0X-pagename.md` | Per-page findings with severity-tagged issues, passed checks table, screenshots index |
| `.planning/qa-audit/SUMMARY-REPORT.md` | Consolidated report: findings by severity/category, phase results table, V2 philosophy check, top 10 issues |
| `.planning/qa-audit/screenshots/qa0X-pagename/` | Screenshots organized by phase |

**Screenshot naming convention:** `[phase]-[route-slug]-[state]-[viewport]-[theme].png`

**Viewport set:** desktop (1440×900), tablet (768×1024), mobile (390×844)

**Theme coverage:** light always; dark for landing page, dashboard, jobs, settings General tab

**Findings severity levels:** Critical / High / Medium / Low / Info

#### Selector Priority (most to least preferred)

1. `getByRole()` — semantic and accessibility-aligned; finding failures here are accessibility bugs
2. `getByLabel()` — for form inputs
3. `getByText()` — for unique visible text
4. `getByTestId()` — add `data-testid` only where semantic selectors are genuinely ambiguous
5. CSS selectors — last resort only; never use positional or class-based selectors

#### What Cannot Be Tested via Playwright

| Feature | Why Not Testable | How to Document |
|---------|-----------------|-----------------|
| Google OAuth full flow | Requires interactive OAuth | Note: "Button present, interactive flow not automatable" |
| Email/SMS delivery | No real Twilio/Resend in test env | Note: "Send action triggers correctly, delivery not verifiable" |
| Stripe checkout completion | Redirects to external Stripe | Note: "Checkout button navigates to Stripe; webhook logic tested separately" |
| Password reset (full flow) | Requires email inbox access | Note: "Form submission confirmed; link delivery not verifiable" |
| Cron touch processing end-to-end | Requires Vercel cron schedule | Note: "Endpoint auth verified; touch scheduling verified via DB query after enrollment" |

---

### 4. Critical Pitfalls

**1. Single-business testing passes while multi-tenant isolation is untested**
All 22 `lib/data/` functions use the caller-provides-businessId pattern. A test with one user and one business never exercises whether the cookie-based switcher actually scopes data correctly. Supabase RLS policies and application-level scoping are both tested only under multi-user, multi-business conditions.
**Mitigation:** Require 2 user accounts + 2 businesses per user in all multi-tenant scenarios. Run dedicated cross-contamination checks: create a job in Business B, switch to Business A, confirm it does not appear.

**2. RLS verified for CRUD but not for secondary query paths**
Analytics aggregations, count queries, autocomplete endpoints, and public-form writes (`/complete/[token]` via service-role) bypass RLS. Service-role means every query in cron and public endpoints must include explicit `business_id` scoping. Standard RLS testing misses these paths.
**Mitigation:** Audit every `lib/data/` function and cron endpoint file for `business_id` filter presence. Supplement UI testing with direct SQL queries using Supabase's role-switching test utility.

**3. Cron idempotency never tested under double-fire**
Vercel guarantees at-least-once delivery. `process-campaign-touches` uses an atomic claim RPC. `resolve-enrollment-conflicts` does NOT — it loops over conflicted jobs without atomic claiming, creating a race condition under simultaneous double-fire. Passing tests that only fire the cron once provide false confidence.
**Mitigation:** Trigger each cron twice in rapid succession; verify no duplicate enrollments or sends. Verify Resend's `idempotencyKey` (`campaign-touch-${enrollment_id}-${touch_number}`) actually prevents duplicate emails.

**4. Dual-subdomain middleware entirely bypassed on localhost**
`middleware.ts` has an `isLocalhost` check that skips all domain-routing logic. Auth cookie cross-subdomain sharing, business-switcher cookie scoping, and marketing↔app redirect rules have never been tested end-to-end. A misconfiguration produces infinite redirect loops that only appear in production.
**Mitigation:** Set up a staging subdomain or Vercel preview URL with actual domain config. Run the full V2 smoke test there before production traffic. Explicitly test `/complete/[token]` with no auth cookies present (unauthenticated technician scenario).

**5. Playwright-only audit misses server-side automation pipeline state**
Playwright proves the UI renders correctly but cannot verify whether campaign enrollment was created, touches were scheduled at the right time, or HMAC token expiry fires. A Playwright test that confirms "the job appears in the list" does NOT confirm the automation pipeline is working.
**Mitigation:** After every key UI action, query Supabase directly to verify expected DB state: enrollment row exists with correct `touch_1_scheduled_at`, `reviewed_at` set after funnel completion, enrollment `status='stopped'` after rating click.

---

## Implications for Roadmap

The audit milestone is 9 sequential phases. They must not be parallelized because each phase creates data that downstream phases depend on.

### Phase QA-01: Authentication Flows
**Rationale:** Auth is the prerequisite for every other phase. Failing auth blocks the entire audit. Establish a working authenticated session before anything else.
**Delivers:** Login, signup, password reset, sign-out, session expiry, protected route redirect all confirmed
**Covers categories:** A (Auth and Session Management)
**Pitfall to watch:** Google OAuth cannot be fully automated; document as "button present, interactive flow not automatable via Playwright"
**Research flag:** Standard Supabase auth patterns; well-documented; low surprise risk

### Phase QA-02: Onboarding Wizard
**Rationale:** Dashboard and all pages redirect to `/onboarding` if business is missing. Both flows (first business 4-step, additional business 3-step) must be audited. `?mode=new` also creates the second business needed for Phase 8.
**Delivers:** Both onboarding paths confirmed. LocalStorage draft persistence verified. Campaign preset selection creates correct touch sequences.
**Covers categories:** P (Onboarding)
**Pitfall to watch:** Primary test account is already onboarded. `?mode=new` wizard tests additional-business creation without destroying existing data. A second test account is needed for the true first-run flow — or document the gap explicitly.
**Research flag:** Two distinct code paths (upsert vs insert-only); verify both paths separately

### Phase QA-03: Dashboard
**Rationale:** Dashboard is the first thing users see. Test it in empty-state first (documents zero-state UX), then revisit after Phase 4 populates data if needed.
**Delivers:** KPI cards, sparklines, ReadyToSendQueue, AttentionAlerts, WelcomeCard, business switcher, mobile layout all confirmed
**Covers categories:** L (Dashboard)
**Pitfall to watch:** Sparklines require real historical data; empty-state documents the zero-data experience separately

### Phase QA-04: Jobs
**Rationale:** Jobs is the V2 core action. Test it thoroughly. The 3 test jobs created here (AUDIT_Patricia Johnson, AUDIT_Marcus Rodriguez, AUDIT_Sarah Chen) power all downstream phases.
**Delivers:** AddJobSheet, inline customer creation, status toggle, conflict detection dialog (Replace/Skip/Queue), MarkComplete, CampaignSelector all confirmed
**Covers categories:** C (Core V2 Workflow), D (Conflict Handling — initial scenarios)
**Pitfall to watch:** Enrollment conflict dialog requires a customer already in an active campaign — create this scenario explicitly
**Research flag:** Supplement every MarkComplete action with a DB query confirming `campaign_enrollments` row exists

### Phase QA-05: Campaigns
**Rationale:** Campaign enrollment happens on job completion. Phase 4 jobs triggered enrollment — Phase 5 observes and exercises the result. Enrollment data is present when auditing campaign detail pages.
**Delivers:** Campaign list, preset picker, touch sequence editor, pause/resume with frozen enrollment, delete with reassignment, template preview, campaign detail stats all confirmed
**Covers categories:** K (Campaign Management), D (Conflict Handling — frozen/resume paths)
**Pitfall to watch:** Frozen enrollment state machine is the most complex logic in the codebase; verify all frozen → active transitions, not just the happy path. Test campaign pause idempotency.

### Phase QA-06: History, Analytics, and Feedback
**Rationale:** All three are downstream consumers of jobs + campaigns data. Read-heavy with few interactions — grouping is efficient. No ordering dependency between these three pages.
**Delivers:** History filters + date presets + bulk retry, analytics service-type breakdown, feedback resolution workflow all confirmed
**Covers categories:** G (History), N (Analytics), M (Feedback)
**Research flag:** Standard CRUD + filter patterns; low risk of surprises. Main verification is that data is correctly scoped to active business.

### Phase QA-07: Settings
**Rationale:** Settings modifies business configuration. Auditing it after core workflows prevents configuration changes from affecting earlier phases. The `form_token` generated here is required by Phase 9.
**Delivers:** All 7 tabs (General, Templates, Services, Messaging, Integrations, Customers, Account) confirmed. Form token URL captured for use in Phase 9.
**Covers categories:** I (Settings), O (Customers)
**Pitfall to watch:** Settings is the most complex single page — each tab is functionally independent and warrants its own checklist section. Copy the form token URL at end of phase for use in QA-09.

### Phase QA-08: Businesses Page and Business Switcher
**Rationale:** Creating a second business in Phase 8 (rather than earlier) avoids complicating single-business phases with multi-business context. All single-business flows must be confirmed before exercising the switcher.
**Delivers:** BusinessDetailDrawer metadata editing, notes auto-save, business switcher (desktop sidebar + mobile header), data isolation between businesses confirmed
**Covers categories:** J (Multi-Business), B (Tenant Isolation — full cross-business verification)
**Pitfall to watch:** This is the highest-risk phase for the single-business testing trap (Pitfall 1). Run dedicated cross-contamination scenarios: create job in Business B, switch to Business A, confirm it does not appear. Verify KPIs, campaigns, and history all change after switch.

### Phase QA-09: Public Pages and Review Funnel
**Rationale:** No auth dependency. `/r/[token]` requires a sent touch (available after Phase 5) and `/complete/[token]` requires the `form_token` captured in Phase 7. Test last so all prerequisites are met.
**Delivers:** Marketing landing page, pricing, review funnel (valid/invalid token, 4-5 star → Google, 1-3 star → feedback form), public job completion form confirmed
**Covers categories:** E (Review Funnel), F (Public Job Form)
**Pitfall to watch:** `/complete/[token]` is the only write-accepting public route. Test with invalid tokens (expect 404, not 500), missing required fields (expect server-side validation error), and verify rate limiting applies. Test at 390px mobile — this form is used by technicians on phones in the field.

### Phase Ordering Rationale

- **Data builds progressively:** Each phase creates data consumed by downstream phases; no redundant setup
- **Risk-first:** Auth and tenant isolation are highest-risk; audited in the first two meaningful phases
- **No destructive actions in early phases:** Settings changes (Phase 7) and second business creation (Phase 8) are deferred until single-business flows are confirmed
- **Public routes last:** No auth dependency; all token and form-link prerequisites are available by Phase 9
- **Read-heavy pages grouped:** History, Analytics, and Feedback share Phase 6 because they are read-only consumers of the same upstream data

### Research Flags

**Phases needing deeper investigation during execution:**
- **Phase QA-05 (Campaigns):** Frozen enrollment state machine is the most complex logic in the codebase; all 6 transition paths should be explicitly exercised, not just Replace and Skip
- **Phase QA-08 (Businesses):** Multi-business data isolation under switching is the highest-risk audit scenario; requires a two-user, two-business test matrix plus direct SQL verification at each switch
- **Phase QA-09 (Public Form):** `/complete/[token]` is the only write-accepting public route; warrants explicit adversarial testing: invalid tokens, missing fields, rate limiting

**Phases with standard patterns (low surprise risk):**
- **Phase QA-01 (Auth):** Supabase handles session management; standard patterns well-documented; main work is methodical scenario coverage
- **Phase QA-06 (History/Analytics/Feedback):** Standard CRUD + filter patterns; well-tested in prior audits; main check is business-scoping correctness
- **Phase QA-07 (Settings):** Known entity from prior UX audit; main risk is completeness across 7 tabs, not unexpected behavior

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (Playwright tooling) | HIGH | Playwright 1.58.1 confirmed installed; auth + cookie patterns verified against official Playwright docs and Next.js App Router guide |
| Features (audit category scope) | HIGH | Derived from full codebase review of all routes, actions, and data functions; categories map directly to shipped code |
| Architecture (phase grouping + report format) | HIGH | Data dependency analysis from actual `page.tsx` files; report template derived from existing UX-AUDIT.md conventions |
| Pitfalls (failure modes) | HIGH | Critical pitfalls grounded in direct code inspection of cron endpoints, middleware, public routes; external sources used for verification only |

**Overall confidence:** HIGH

### Gaps to Address During Execution

1. **Second test account for first-run onboarding:** Primary account (`audit-test@avisloop.com`) already has a completed business. Testing the true first-run onboarding flow requires either a second account (`audit-test2@avisloop.com`) or explicit documentation that this scenario is environment-dependent. Decide before Phase QA-02 begins.

2. **Review funnel token availability:** The `/r/[token]` test requires a valid HMAC-signed review token from a sent campaign touch. If the test environment has not run the cron processor, construct a token manually using `lib/review/token.ts` test helpers. Document which approach was used in the Phase QA-09 findings file.

3. **Staging subdomain for middleware testing:** The dual-subdomain routing is entirely bypassed on localhost. Full middleware validation requires a staging subdomain or Vercel preview URL with the actual domain configuration. If unavailable during the audit, document explicitly in findings as "middleware cross-subdomain behavior not verified — requires staging environment."

4. **Real device for mobile form testing:** Playwright device emulation does not replicate iOS Safari viewport behavior, system keyboard layout changes, or actual touch target sizes. The `/complete/[token]` technician form is the highest-risk mobile flow. Use a real device or BrowserStack if available; document the testing method in findings.

5. **Database state verification procedure:** The audit execution plan must include explicit DB verification steps after key UI actions. Before execution begins, confirm Supabase dashboard access (or a SQL client) is available for direct table queries. The pitfall research is explicit: Playwright-only testing misses the server-side automation pipeline.

---

## Sources

### Primary (HIGH confidence — official documentation)
- [playwright.dev/docs/auth](https://playwright.dev/docs/auth) — storageState pattern, project dependencies
- [playwright.dev/docs/accessibility-testing](https://playwright.dev/docs/accessibility-testing) — axe-core/playwright integration
- [playwright.dev/docs/emulation](https://playwright.dev/docs/emulation) — device emulation, color scheme
- [nextjs.org/docs/app/guides/testing/playwright](https://nextjs.org/docs/app/guides/testing/playwright) — Next.js App Router + Playwright config
- [github.com/vercel/next.js/discussions/62254](https://github.com/vercel/next.js/discussions/62254) — why UI login + storageState is required over API cookie injection
- [docs.stripe.com/billing/testing](https://docs.stripe.com/billing/testing) — Stripe test clocks for subscription lifecycle
- [vercel.com/blog/common-mistakes-with-the-next-js-app-router](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) — stale GET cache in production
- Direct codebase inspection of all routes, `lib/data/`, `lib/actions/`, `app/api/cron/`, `middleware.ts`, `app/complete/`, `lib/review/` (2026-02-27)

### Secondary (MEDIUM confidence — third-party, verified against codebase)
- [mokkapps.de — Supabase REST auth in Playwright](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test) — why API token injection fails with Supabase SSR
- [fixmymess.ai — Tenant isolation checklist](https://fixmymess.ai/blog/tenant-isolation-checklist-saas-prototypes) — secondary query path gaps, cache key scoping
- [launchdarkly.com — Stripe webhook best practices](https://launchdarkly.com/blog/best-practices-for-testing-stripe-webhook-event-processing/) — duplicate event handling, idempotency
- [medium.com/cyberark-engineering — Multi-tenant SaaS with Playwright](https://medium.com/cyberark-engineering/scaling-e2e-tests-for-multi-tenant-saas-with-playwright-c85f50e6c2ae) — context isolation patterns
- [betterstack.com — Playwright best practices](https://betterstack.com/community/guides/testing/playwright-best-practices/) — test isolation, cookie/storage state
- [prosperasoft.com — RLS misconfigurations](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/) — insufficient role-based testing, nested policy overrides

---

*Research completed: 2026-02-27*
*Ready for roadmap: yes*
*Files synthesized: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Next step: Roadmap creation (use suggested 9-phase QA structure as starting point)*
