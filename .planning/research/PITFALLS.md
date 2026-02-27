# Domain Pitfalls: Pre-Production QA Audit

**Domain:** Comprehensive QA audit before first production deployment of a multi-tenant Next.js + Supabase SaaS
**Researched:** 2026-02-27
**Confidence:** HIGH — grounded in direct codebase inspection + verified external research

---

## Context

AvisLoop is going to production for the first time with:
- Multi-business architecture (cookie-based context switching, one user → many businesses)
- Complex job lifecycle (scheduled → completed → enrolled, with conflict resolution)
- Public unauthenticated routes (`/complete/[token]` form for technicians)
- 4 cron endpoints processing campaign touches, SMS retries, scheduled sends, and conflict resolution
- Stripe billing (webhook-driven tier updates, pooled across businesses)
- Supabase RLS on all tenant tables
- Dual-subdomain production setup (`avisloop.com` marketing, `app.avisloop.com` dashboard)

The core audit risk is **false confidence from incomplete test scenarios** — passing tests that miss the specific failure modes of this system's architecture.

---

## Critical Pitfalls

### Pitfall 1: Testing Single-Business Flows and Calling It Multi-Tenant Verified

**What goes wrong:**
The most common multi-tenant audit trap: all tests run as one user with one business, so everything passes. The multi-business switching behavior — which introduces the cookie-scoping, the `getActiveBusiness()` resolver, and the `businessId` threading — is never exercised.

Data isolation in this app is enforced at two levels: (1) Supabase RLS policies using `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())`, and (2) the `getActiveBusiness()` caller-provides-businessId pattern in all 22 `lib/data/` functions. A test with one user and one business never exercises whether the cookie-based switcher actually scopes data correctly.

**Specific failure modes to audit:**
- User A has business B1 and B2. Switch to B2. Create a job. Switch back to B1. Verify the job does not appear in B1's job list.
- User A switches to B2, User B (different account) tries to access B2 via direct URL — verify RLS blocks them.
- Delete the `active_business_id` cookie mid-session. Verify the app falls back to first business, not null/crash.

**Warning signs:**
- Test suite only creates one user and one business per test scenario
- "Multi-tenant tested" appears in a checklist but only refers to login/logout
- Tests pass with a single user account

**Prevention strategy:**
All multi-tenant verification requires at minimum: 2 user accounts, 2 businesses per user, exercised in the same test run. Create dedicated "cross-contamination" test scenarios that specifically check for data leakage between businesses.

**Phase to address:** Audit Phase 1 (Multi-Tenant Data Isolation)

---

### Pitfall 2: RLS Policies Verified for CRUD But Not for "Secondary" Query Paths

**What goes wrong:**
RLS testing focuses on the main CRUD actions (insert, select, update, delete on the main table). It misses query paths that developers often write as reusable helpers: autocomplete endpoints, export routes, analytics aggregations, and count queries. These frequently omit the `business_id` filter because they were written generically.

For AvisLoop specifically, the risk paths include:
- Campaign enrollment status queries (used for conflict detection) — do they scope to business?
- Feedback count queries for dashboard KPI widgets — do they join through `business_id`?
- Send log queries for analytics — filtered by business or by user?
- The `/api/complete` action (`lib/actions/public-job.ts`) creates customers and jobs as a side effect of form submission — does it verify the `form_token` is valid and owned before allowing writes?

**Specific test to run:**
Using Supabase's `set_config('request.jwt.claims', '{"sub": "USER_A_ID"}')` test utility, verify that User A cannot read User B's records even on non-primary query paths (counts, aggregations, search). This must be done with SQL directly against the DB, not just through the app's UI.

**Warning signs:**
- RLS tests only cover primary key lookups (`.eq('id', x)`)
- No tests verify analytics/dashboard queries are scoped
- No tests for the public form submission path (`/complete/[token]`)

**Prevention strategy:**
For each table in DATA_MODEL.md, identify every query in `lib/data/` that touches it and verify the `business_id` scope is present. The cron endpoints use service role (no RLS), so every query in those files must be manually verified to include `business_id` in WHERE clauses — they will not be blocked by RLS.

**Phase to address:** Audit Phase 1 (Multi-Tenant Data Isolation)

---

### Pitfall 3: Cron Endpoints Verified for Auth But Not for Idempotency Under Double-Fire

**What goes wrong:**
All 4 cron endpoints (`process-campaign-touches`, `process-scheduled-sends`, `process-sms-retries`, `resolve-enrollment-conflicts`) authenticate via `CRON_SECRET`. This is verified easily. What is NOT verified is what happens if a cron fires twice in rapid succession (a real scenario with Vercel's at-least-once delivery guarantee).

The `claim_due_campaign_touches` RPC uses PostgreSQL row-level locking to claim touches atomically. But the conflict resolution cron (`resolve-enrollment-conflicts`) does NOT use an atomic claim RPC — it queries jobs with `enrollment_resolution='conflict'`, processes them in a loop, and then clears the resolution. If two instances run simultaneously, both could claim the same jobs and create duplicate enrollments.

The `process-campaign-touches` cron also uses a fixed `limit_count: 100`. If more than 100 touches are due, the overflow is silently deferred until the next cron run. This is not a bug, but it must be understood and verified to not cause SLA violations during high-volume periods.

**Warning signs:**
- Cron endpoints tested only for "happy path" with valid secret
- No test for concurrent execution or duplicate-fire scenario
- No monitoring for "overflow" (more due touches than batch size)

**Prevention strategy:**
- Verify the atomic RPC pattern covers all cron processors, not just `process-campaign-touches`
- Manually check `resolve-enrollment-conflicts` for race conditions: is the update to `enrollment_resolution=null` wrapped in a transaction or RPC that prevents double-processing?
- Verify idempotency: running each cron twice with the same data produces the same outcome (no duplicate enrollments, no duplicate sends)
- Check that the `idempotencyKey` passed to Resend (`campaign-touch-${enrollment_id}-${touch_number}`) actually prevents duplicate emails if the cron fires twice

**Phase to address:** Audit Phase 2 (Background Job Verification)

---

### Pitfall 4: Stripe Webhook Testing Stops at "Signature Verified" and Misses Tier State Machine

**What goes wrong:**
The Stripe webhook handler (`/api/webhooks/stripe/route.ts`) handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`. Basic audit verifies signature verification passes. It misses the tier state machine transitions.

Specific gaps in the current handler that QA must verify:
1. `invoice.payment_failed` currently only logs — it does NOT update the business tier to any grace state. Stripe will later send `customer.subscription.updated` with `status: past_due`. The audit must verify that the 7-day grace period (`['active', 'trialing', 'past_due']`) actually prevents immediate lockout.
2. The tier mapping is built inside the handler from `STRIPE_BASIC_PRICE_ID` and `STRIPE_PRO_PRICE_ID` env vars. If these are missing in production, `priceToTier[priceId]` returns `undefined`, which falls back to `'basic'` silently. An agency user on the `pro` plan could be downgraded to `basic` if env vars are misconfigured.
3. `handleSubscriptionDeleted` reverts to `'trial'` tier immediately. This is correct if Stripe sends this event only after the period ends, but must be verified — Stripe can send `customer.subscription.deleted` before the paid period actually expires.
4. Webhook events with duplicate IDs must be idempotent — the upsert on `subscriptions` handles this, but the `businesses.tier` update does not verify it hasn't already been applied.

**Warning signs:**
- Stripe testing only uses the CLI's `stripe trigger` command (which sends fake data that doesn't correlate to real subscription info)
- No test for `STRIPE_BASIC_PRICE_ID` / `STRIPE_PRO_PRICE_ID` missing from env
- No test for the `past_due` → `active` (payment retry succeeds) flow
- No test for cancellation-before-period-end vs cancellation-at-period-end

**Prevention strategy:**
Use Stripe test clocks to simulate time-based subscription lifecycle events. Create a real test subscription, run it through payment failure → past_due → eventual cancellation. Verify tier in the database at each transition. Do not rely solely on `stripe trigger` for subscription state testing.

**Phase to address:** Audit Phase 3 (Payment Integration)

---

### Pitfall 5: The Dual-Subdomain Middleware Hides Auth Redirect Loops in Production

**What goes wrong:**
The middleware (`middleware.ts`) has domain-based routing logic that is entirely bypassed on localhost (via `isLocalhost` check). This means all domain-routing behavior is untested during development. In production, any misconfiguration in the domain routing will manifest as:
- Infinite redirect loops (marketing route on app domain → redirect to marketing domain → which redirects back)
- Auth cookie not shared across subdomains (the Supabase auth cookie is set with `domain: COOKIE_DOMAIN` = `.avisloop.com`, but only in non-localhost environments)
- The `active_business_id` cookie is set WITHOUT a domain (scoped to current host only), which is correct for the app subdomain but untested

Specific risk: if the user logs in at `app.avisloop.com/login` (which should redirect to `avisloop.com/login` based on middleware), but the redirect chain has a bug, the user hits a login page they can never complete.

The middleware also protects all `APP_ROUTES` but the `/complete/[token]` route is NOT in `APP_ROUTES` — it is a public route that must remain unauthenticated. Verify this path is accessible without authentication in production (not just localhost).

**Warning signs:**
- All auth and routing tests run against `localhost:3000`
- No staging environment at `app.staging.avisloop.com` to test subdomain behavior
- The cookie domain cross-subdomain SSO has never been tested end-to-end

**Prevention strategy:**
- Set up a staging subdomain (`app.staging.avisloop.com`) or use Vercel preview URLs with `?vercel_domain=` overrides
- Test the complete login → dashboard flow on the actual subdomain configuration before production launch
- Verify the `/complete/[token]` route returns 200 for a valid token without any auth cookies present (unauthenticated technician scenario)
- Test direct navigation to `avisloop.com/dashboard` (should redirect to `app.avisloop.com/dashboard`)
- Test direct navigation to `app.avisloop.com/pricing` (should redirect to `avisloop.com/pricing`)

**Phase to address:** Audit Phase 4 (Public Routes and Middleware)

---

### Pitfall 6: Mobile QA Done via Browser DevTools Resize Instead of Real Touch Interaction

**What goes wrong:**
Browser DevTools device simulation does not replicate:
- Real touch event behavior (tap vs click differences, touch target sizes)
- iOS Safari's bottom toolbar eating viewport height (causing bottom nav to be obscured)
- System keyboard pushing layout up (critical for the `/complete/[token]` technician form)
- Actual network conditions on cellular (slow 3G, sudden drops)
- PWA behavior if the app is added to home screen

For AvisLoop, the critical mobile flows are: (1) technician on-site completing a job via `/complete/[token]`, and (2) business owner switching businesses and checking the dashboard. Both flows are typically done on phones in the field.

The previous UX audit identified 44px minimum touch target violations (checkboxes at 16px, icon buttons at 24px). DevTools resize will show the layout but will NOT reveal that a 16px checkbox is effectively untappable on a real device.

**Warning signs:**
- Mobile testing section of audit report says "tested in Chrome DevTools responsive mode"
- No mention of iOS Safari or Android Chrome-specific testing
- Touch target measurements not included in audit findings
- The `JobCompletionForm` was not tested with a physical keyboard visible

**Prevention strategy:**
- Use BrowserStack or a physical device for at least one complete run-through of the two critical mobile flows
- Specifically test the `/complete/[token]` form with a real mobile keyboard active — verify none of the inputs are obscured
- Measure actual tap target sizes for the smallest interactive elements (checkboxes, icon-only buttons)
- Test with iOS Safari (not just Chrome for Android) since iOS Safari has viewport and keyboard behavior differences

**Phase to address:** Audit Phase 5 (Mobile and Accessibility)

---

## Moderate Pitfalls

### Pitfall 7: Next.js Cache Stale Data After Mutations — Verified in Dev, Broken in Production

**What goes wrong:**
In development, Next.js uses the dev server which does not cache aggressively. In production, Route Handlers using `GET` are cached by default. If any data-fetching Route Handler was added without explicit `cache: 'no-store'` or `revalidate: 0`, it will serve stale data in production.

More critically: Server Actions call `revalidatePath()` to invalidate the cache after mutations. If a `revalidatePath()` call is missing from a mutation action, the UI shows the old data after the user makes a change — but only in production, not in dev.

For AvisLoop, the highest-risk area is the business-switching flow: `switchBusiness()` calls `revalidatePath('/', 'layout')` which should invalidate all pages. If this does not cascade correctly to all RSC data fetches, the user switches business but sees the old business's data until they hard-refresh.

**Warning signs:**
- "It works in dev but not in production" reports during early production testing
- Server Actions that modify data but don't call `revalidatePath()`
- No explicit smoke test of "switch business → verify data changes without refresh"

**Prevention strategy:**
- Run the final smoke test against `next build && next start` (production mode), not `next dev`
- Verify each mutation action has a corresponding `revalidatePath()` call
- Add an explicit "business switch → data change verification" step to the smoke test checklist

**Phase to address:** Audit Phase 1 (Multi-Tenant Data Isolation) — as part of business-switching verification

---

### Pitfall 8: Public Token Form (`/complete/[token]`) Tested for Happy Path Only

**What goes wrong:**
The `/complete/[token]` route is the only fully public unauthenticated route that accepts writes. It uses a persistent DB token (`form_token` column on `businesses`), not HMAC. This means:
- Tokens are permanent (no expiry) — a leaked or shared token works forever
- If an attacker enumerates tokens (trying UUIDs), they can submit fake job completions for any business

The audit must verify:
1. What happens with a nonexistent token — should return 404, not a 500 with database details leaked
2. What happens when the form is submitted with missing required fields — server-side validation must reject, not crash
3. Whether the `public-job.ts` server action that handles form submission enforces business ownership (it should validate token → business_id, then only write to that business's tables)
4. Rate limiting on form submission — can an attacker spam fake job completions?

**Warning signs:**
- Testing only covers "valid token, valid form data → success"
- No test for malformed tokens, expired sessions, or invalid field combinations
- No verification that `public-job.ts` server action can only write to the business associated with the token

**Prevention strategy:**
- Test the endpoint with: (a) nonexistent token, (b) valid token but empty required fields, (c) valid token but mismatched `business_id` in form body
- Verify rate limiting applies to POST requests to `/api/complete` (if the action goes through an API route)
- Check whether `form_token` values are UUID-format (guessable distribution) or longer random values

**Phase to address:** Audit Phase 4 (Public Routes and Middleware)

---

### Pitfall 9: Enrollment Conflict State Machine Not Tested for All Transition Paths

**What goes wrong:**
The enrollment conflict resolution has 4 states (`conflict`, `queue_after`, `skipped`, `suppressed`) and a cron processor that auto-resolves after 24 hours. Testing typically covers: "job created, conflict detected, user resolves via Replace button." It misses:
- `queue_after` path: customer still in active enrollment when cron runs — verify it keeps waiting
- `queue_after` path: enrollment completes, `QUEUE_AFTER_GAP_DAYS` passes — verify auto-enrollment
- `queue_after` path: enrollment stopped because customer reviewed — verify it transitions to `suppressed` not enrollment
- Frozen enrollment (campaign paused): does the conflict resolver correctly ignore `frozen` status as "active"?
- What happens if `resolve-enrollment-conflicts` cron is NOT running in production (e.g., env misconfiguration causes it to fail silently)

**Warning signs:**
- Conflict resolution tested only through the UI (Replace/Skip/Queue buttons)
- No test exercises the 24-hour auto-resolve path
- No test exercises the `queue_after` state transitioning to enrollment via cron
- Dashboard "conflict" jobs still showing after 24+ hours (cron not running)

**Prevention strategy:**
- Test each resolution path in isolation: manually set `enrollment_resolution='conflict'` and `conflict_detected_at` to 25 hours ago, then trigger the cron endpoint, verify auto-resolve
- Test `queue_after` path by setting up a job with an active enrollment, verifying the cron does nothing, then marking the enrollment as completed, triggering cron again, verifying enrollment is created
- Verify cron returns non-200 on auth failure so Vercel can detect and alert on cron health

**Phase to address:** Audit Phase 2 (Background Job Verification)

---

### Pitfall 10: Accessibility Audit Done via Automated Tool Only — Misses Context-Specific Failures

**What goes wrong:**
Automated accessibility tools (axe, Lighthouse) catch low-hanging fruit: missing `alt` text, color contrast violations, missing form labels. They do NOT catch:
- Missing `aria-label` on icon-only buttons with dynamic state (the previous UX audit found these)
- Keyboard trap in the business switcher dropdown (Radix DropdownMenu should handle this, but it must be verified)
- Focus management when a Sheet/Drawer opens and closes — focus should return to the trigger element
- Screen reader announcements for toast notifications (Sonner toasts may not have `role="alert"`)
- The mobile FAB for "Add Job" being announced correctly to screen readers
- The `JobCompletionForm` on `/complete/[token]` — this is a public form used by technicians who may use screen readers

**Warning signs:**
- Accessibility section of audit report says "Lighthouse score: 95" without listing specific WCAG criteria tested
- No mention of keyboard-only navigation testing
- No mention of screen reader testing (VoiceOver on iOS, TalkBack on Android, NVDA on Windows)

**Prevention strategy:**
- Run Lighthouse for baseline, then do a separate keyboard-only navigation pass through the 3 most important flows: complete a job, switch business, submit the public form
- Verify the Radix UI components (Dialog, Sheet, DropdownMenu, Select) handle focus trapping correctly — Radix is designed for this but custom usage can break it
- Check that Sonner toast notifications are announced to screen readers

**Phase to address:** Audit Phase 5 (Mobile and Accessibility)

---

## Minor Pitfalls

### Pitfall 11: Error Pages Not Tested — Production Shows Raw Next.js Error Boundaries

**What goes wrong:**
Custom `error.tsx` and `not-found.tsx` pages exist in some routes but may be missing from others. In production, unhandled errors fall through to Next.js's default error boundary which exposes stack traces in development but shows a blank/generic page in production. Not testing error paths means the first time a customer sees an error, the experience is undefined.

**Prevention strategy:**
Trigger an intentional error in each major route (jobs, campaigns, feedback, dashboard) and verify the error boundary renders, not a blank page or raw stack trace. Specifically test the `/complete/[token]` route with an invalid token — it calls `notFound()` which should render `not-found.tsx`, not a 500.

---

### Pitfall 12: Environment Variable Misconfiguration Detected Only at First User Action

**What goes wrong:**
Missing env vars in production (`RESEND_API_KEY`, `TWILIO_*`, `OPENAI_API_KEY`, `REVIEW_TOKEN_SECRET`, `CRON_SECRET`, `UPSTASH_REDIS_REST_URL`) cause silent failures that only appear when a user takes the first relevant action. The cron endpoints fail-closed on missing `CRON_SECRET` (returns 500). The AI personalization falls back gracefully. But missing `RESEND_API_KEY` would silently fail to send emails, and missing `REVIEW_TOKEN_SECRET` would break all review link generation.

**Prevention strategy:**
Add a startup validation check: a dedicated health endpoint or startup log that verifies all required env vars are present. Run through the complete V2 smoke test (sign up → complete job → verify email sent → follow review link → rate 5 stars → verify Google redirect) immediately after production deployment, before any real user access.

---

### Pitfall 13: Playwright MCP Audit Misses Server-Side Behavior That Doesn't Manifest in UI

**What goes wrong:**
Playwright tests observe what renders in the browser. Server Actions, cron jobs, Supabase RLS policies, and webhook handlers do not render in the browser — they produce database state changes that may or may not surface in the UI. A Playwright test that verifies "the job appears in the job list after completion" does NOT verify whether the campaign enrollment was created, whether the enrollment conflict checker ran, or whether the touch was scheduled correctly.

This is the core limitation of a Playwright-only audit: it proves the UI works but does not prove the automation pipeline works.

**Prevention strategy:**
Supplement Playwright with direct database verification. After key actions, use the Supabase dashboard or a SQL query to verify the expected database state:
- After completing a job: verify a row in `campaign_enrollments` with `status='active'` and `touch_1_scheduled_at` set
- After rating 5 stars in the review funnel: verify `send_logs.reviewed_at` is set and the enrollment is `stopped`
- After the cron runs: verify `touch_1_sent_at` is populated and `touch_2_scheduled_at` is calculated correctly

**Phase to address:** All phases — this is a methodology note, not a discrete phase

---

## Phase-Specific Warnings

| Audit Phase | Pitfall to Watch | Mitigation |
|-------------|-----------------|------------|
| Multi-Tenant Data Isolation | Pitfall 1 (single-business testing), Pitfall 2 (secondary query paths), Pitfall 7 (cache staleness) | Two-user two-business test matrix; SQL-level RLS verification; production-mode smoke test |
| Background Job Verification | Pitfall 3 (cron double-fire), Pitfall 9 (conflict state machine) | Idempotency test; manual state manipulation + cron trigger |
| Payment Integration | Pitfall 4 (Stripe tier state machine) | Stripe test clocks for lifecycle; env var misconfiguration test |
| Public Routes and Middleware | Pitfall 5 (subdomain middleware), Pitfall 8 (public token form) | Staging subdomain test; invalid token / rate limit test |
| Mobile and Accessibility | Pitfall 6 (DevTools vs real device), Pitfall 10 (automated vs manual a11y) | Physical device or BrowserStack; keyboard-only navigation pass |
| Cross-Cutting | Pitfall 11 (error pages), Pitfall 12 (env vars), Pitfall 13 (UI-only verification) | Error injection; startup health check; DB state verification |

---

## "Looks Done But Isn't" Checklist for QA Audit

These are scenarios that produce passing Playwright tests but hide real problems:

- [ ] Multi-tenant: Created two businesses, switched between them, verified each page shows only the correct business's data
- [ ] Multi-tenant: Logged in as User B, attempted to access User A's business URL directly — got 404 or redirect, not data
- [ ] Cron: Manually triggered `process-campaign-touches` twice in 10 seconds — verified no duplicate emails sent (idempotency key worked)
- [ ] Cron: Set a job's `conflict_detected_at` to 25 hours ago and `enrollment_resolution='conflict'`, triggered `resolve-enrollment-conflicts`, verified auto-resolved
- [ ] Stripe: Cancelled a test subscription, verified business tier reverted to `trial` in DB
- [ ] Stripe: Verified missing `STRIPE_BASIC_PRICE_ID` env var does not silently downgrade a Pro subscriber
- [ ] Middleware: Navigated to `app.avisloop.com/pricing` (or staging equivalent) — verified redirect to marketing domain
- [ ] Middleware: Accessed `/complete/[token]` with no auth cookies — verified form rendered (not 401/redirect)
- [ ] Public form: Submitted `/complete/[token]` with a nonexistent token — verified 404, not 500
- [ ] Public form: Submitted `/complete/[token]` with missing required fields — verified server-side validation error, not crash
- [ ] Mobile: Completed the `/complete/[token]` form on a real mobile device with system keyboard visible — verified no fields obscured
- [ ] Database: After completing a job via the UI, queried `campaign_enrollments` directly — verified enrollment row exists with correct `touch_1_scheduled_at`
- [ ] Database: After following a 5-star review link, queried `send_logs` — verified `reviewed_at` is set and enrollment `status='stopped'`
- [ ] Production mode: Ran `next build && next start`, completed the full V2 smoke test, confirmed no caching-related stale data issues

---

## Sources

- Direct codebase inspection: `app/api/cron/`, `app/api/webhooks/stripe/`, `app/complete/[token]/`, `middleware.ts`, `lib/data/active-business.ts`, `lib/actions/active-business.ts` (2026-02-27)
- [Tenant isolation checklist for SaaS prototypes — fixmymess.ai](https://fixmymess.ai/blog/tenant-isolation-checklist-saas-prototypes) — secondary query path gaps, cache key scoping, background job context loss (MEDIUM confidence — verified against codebase)
- [Common mistakes with the Next.js App Router — Vercel](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) — stale GET cache in production, redirect in try/catch (HIGH confidence — official Vercel source)
- [Fixing RLS Misconfigurations in Supabase — ProsperaSoft](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/) — insufficient role-based testing, nested policy overrides (MEDIUM confidence)
- [Best practices for testing Stripe webhook event processing — LaunchDarkly](https://launchdarkly.com/blog/best-practices-for-testing-stripe-webhook-event-processing/) — duplicate event handling, idempotency (HIGH confidence)
- [Test your Billing integration — Stripe Docs](https://docs.stripe.com/billing/testing) — test clocks for subscription lifecycle, `stripe trigger` limitation with fake data (HIGH confidence — official Stripe docs)
- [9 Playwright Best Practices and Pitfalls — Better Stack](https://betterstack.com/community/guides/testing/playwright-best-practices/) — test isolation, cookie/storage state (MEDIUM confidence)
- [Scaling E2E Tests for Multi-Tenant SaaS with Playwright — CyberArk Engineering](https://medium.com/cyberark-engineering/scaling-e2e-tests-for-multi-tenant-saas-with-playwright-c85f50e6c2ae) — multi-tenant Playwright context isolation (MEDIUM confidence)

---

*Pitfalls research for: Comprehensive QA Audit milestone (pre-production deployment)*
*Researched: 2026-02-27*
*Confidence: HIGH — critical pitfalls grounded in actual codebase patterns; external sources used for verification and gap-finding*
