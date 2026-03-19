# Domain Pitfalls: Web Design Agency Pivot

**Domain:** Pivoting a mature review automation SaaS into a web design agency platform (keeping old features as add-on)
**Researched:** 2026-03-18
**Confidence:** HIGH — grounded in direct codebase inspection + verified external research

---

## Context

AvisLoop is pivoting from self-serve review SaaS to web design agency platform. The specific risk profile:

- **Existing codebase:** 18,000+ LOC, 70 phases shipped, multi-business architecture, RLS on all tables, Stripe billing, pooled usage enforcement
- **What's being added:** Web design client CRM, ticket/revision tracking with monthly limits, client portal via unique token URL, new pricing model ($199/$299 + $99 add-on), marketing page pivot
- **What's being preserved:** All review automation features, existing businesses data model, Stripe integration, multi-business switcher

The core risk is that a mature working system will break in specific ways that are invisible until a real client experiences the failure. Retrofitting a new domain onto an existing data model is where most of these pitfalls live.

---

## Critical Pitfalls

### Pitfall 1: The Businesses Table Becomes a God Object

**What goes wrong:**
The `businesses` table already holds 30+ columns: core business info, agency metadata (google_rating_start, monthly_fee, competitor tracking), SMS consent settings, Stripe billing fields, campaign settings, intake_token, form_token, brand_voice, software_used. The v4.0 pivot adds web design fields: website_tier, revision_count_this_month, revision_limit, revision_reset_date, domain, hosting_status, etc.

When a single table accumulates domain responsibilities (review automation config + agency CRM + web design client records), queries become fragile. Every SELECT * now returns irrelevant columns from the other domain. Developers writing new queries start pulling columns they don't need, and type definitions (`Business` in `lib/types/database.ts`) balloon into an unmaintainable union of concerns.

More practically: the RLS policies on `businesses` are currently written for one ownership pattern (`user_id = auth.uid()`). Adding web design client fields doesn't break RLS, but future features like "share a client record with a contractor" or "client-visible fields vs agency-only fields" become extremely hard to add without reworking the table structure.

**Why it happens:**
Expediency. Phase 55 correctly added agency metadata as nullable columns (safe, fast, no breaking changes). The same approach works for v4.0. But each increment of "just add nullable columns" is correct locally while accumulating a structural problem globally.

**Consequences:**
- TypeScript type for `Business` becomes a 50-column type that components import wholesale
- Future pivot (e.g., adding non-home-service clients) requires another column explosion
- Queries that join businesses to tickets/revisions via FK become chatty (fetching all 50 columns to get 3)
- No clean boundary between "this business as a review client" vs "this business as a web design client"

**Prevention:**
Before adding web design fields to `businesses`, decide whether to:
- **Option A (Column approach):** Continue with nullable columns, but create a typed `WebDesignClient` view in Postgres that selects only the web-design-relevant columns. Use this view in the clients page query instead of `SELECT *` on businesses.
- **Option B (Separate table approach):** Create `web_design_clients` table with `business_id` FK. All web design metadata lives there. Businesses table stays clean.

Option B is correct architecturally but requires more migration work. Option A is faster and acceptable for solo-operator MVP. Whichever is chosen, enforce it explicitly — do not let the codebase mix both patterns.

**Warning signs:**
- `getUserBusinessesWithMetadata()` query starts returning 40+ columns
- `Business` type in `database.ts` exceeds 35 fields
- Web design data is queried in the same fetch as campaign enrollment data
- Components import `Business` type just to read 2-3 web design fields

**Phase to address:** First migration/data model phase of v4.0 — decide the approach before writing any queries.

---

### Pitfall 2: Ticket Monthly Reset Race Condition and Counter Drift

**What goes wrong:**
The ticket/revision tracking system has monthly limits (Basic: 2/mo, Advanced: 4/mo, $50 overage). The natural implementation is a `revision_count_this_month` integer column on either `businesses` or a `web_design_clients` table, reset at the start of each billing cycle.

There are two failure modes:

**Race condition:** The agency operator submits a revision request at the same moment the client submits one through the client portal. Both read `revision_count = 1` (under limit), both increment to 2, both succeed — but the real count should be 2 checking against the limit, not 1. For a 2/month limit, this is a real problem. The limit can be exceeded by exactly one request if concurrent submissions land in the same window.

**Counter drift:** If revision requests are deleted, edited, or administratively adjusted, the integer counter and the actual row count in the `revisions` table diverge. The source of truth becomes ambiguous. After 6 months, `revision_count_this_month = 3` but `SELECT COUNT(*) FROM revisions WHERE business_id = X AND created_at > period_start` returns 2. Which is correct?

**Why it happens:**
Integer counters are the obvious first implementation. They're fast to query (no COUNT subquery needed) and simple to increment. But they lack the atomicity and reconciliation properties needed for a hard business rule enforcer.

**Consequences:**
- Clients exceed revision limits without triggering overage billing
- Disputes with clients over revision count ("I only submitted 2 requests")
- Manual correction work to reconcile counters

**Prevention:**
Use a derived count pattern instead of a stored counter: calculate the revision count from actual rows in the `revisions` table, filtered to the current billing period. For a 2/month limit, this means:

```sql
SELECT COUNT(*) FROM revisions
WHERE business_id = $1
  AND created_at >= date_trunc('month', NOW())
  AND status != 'cancelled'
```

Enforce the limit in a Postgres RPC using `FOR UPDATE` on the business row to serialize concurrent submissions, or use a CHECK constraint via trigger. Do not rely on application-level read-then-write for limit enforcement.

For the actual billing period (not calendar month), store `billing_period_start` on the business record and use it in the COUNT query.

**Warning signs:**
- Limit enforcement written as: `if (currentCount < limit) { insert(); increment(); }` without a transaction
- No test for two concurrent revision submissions
- `revision_count_this_month` exists as a column with no audit trail

**Phase to address:** The ticket/revision data model phase — decide enforcement strategy before building the UI.

---

### Pitfall 3: Client Portal Token Is Permanent and Shareable

**What goes wrong:**
The current `intake_token` on businesses (added in migration `20260315000100`) and the existing `form_token` are permanent, non-expiring tokens stored as plain text in the database. The client portal URL will be `https://app.avisloop.com/portal/[token]` — a link the agency shares with clients to submit revision requests.

Several failure modes:

1. **Token leakage through browser history and server logs:** HTTPS encrypts the token in transit, but the token appears in browser history, Vercel access logs, Supabase request logs, and any third-party analytics. PortSwigger's research on session tokens in URLs notes this is a well-documented vulnerability — anyone with access to server logs can extract the token.

2. **Token forwarding:** A client employee shares the portal URL with a vendor or subcontractor. Now an unintended party can submit revision requests charged against the client's monthly limit, and potentially view the client's revision history.

3. **Enumeration attack surface:** If the token is a UUID (as `form_token` currently is), the 122-bit entropy makes brute-force infeasible. But if `intake_token` was generated with `randomBytes(24).toString('base64url')` (as in the businesses page), that's 192 bits — strong enough. The risk is not enumeration but the other sharing/logging issues.

4. **No way to invalidate a compromised token:** Once the agency shares the portal URL with a client, there is no "rotate token" mechanism. If the URL leaks, the only fix is to generate a new token and re-share the URL with the client.

**Why it happens:**
The token-in-URL pattern works well for low-stakes forms (job completion by a trusted technician). The client portal is different: it grants access to a client's billing-relevant resource (their revision allotment). The stakes are higher.

**Consequences:**
- Clients who share the URL unknowingly give revision access to others
- An angry ex-client could exhaust the monthly revision limit before a fallout
- Dispute risk: "I didn't submit that revision request"

**Prevention:**
Minimum viable security for v4.0:

1. Use cryptographically strong tokens (192+ bits): the current `randomBytes(24).toString('base64url')` approach is fine — ensure this is the standard, not UUIDs.
2. Add a "Regenerate portal link" button in the agency dashboard. This replaces `intake_token` with a new random value. Simple, effective, and covers the "compromised URL" case.
3. Log portal activity: record every submission with IP address and timestamp so disputes can be resolved with evidence.
4. Noindex the portal page (already done for intake form — verify this is carried forward to the client portal).

Deferred for now but plan-for: token expiry (portal link valid for 30 days, re-share to renew) and per-action CSRF tokens to prevent replay of captured requests.

**Warning signs:**
- Portal link uses UUID format instead of `randomBytes(24).toString('base64url')`
- No "regenerate link" mechanism in the dashboard
- Portal submissions not logged with IP/timestamp
- `robots` meta tag missing on portal pages

**Phase to address:** Client portal implementation phase — apply before go-live.

---

### Pitfall 4: Stripe Billing Cannot Model "Web Design + Review Add-on" Without a New Price Structure

**What goes wrong:**
The current billing system has `basic` and `pro` tiers mapped to `STRIPE_BASIC_PRICE_ID` and `STRIPE_PRO_PRICE_ID`. The business's `tier` column determines send limits via `TIER_LIMITS` in `lib/constants/billing.ts`.

The v4.0 pricing model is fundamentally different:
- Web design tiers: Basic ($199/mo, 1-4 pages), Advanced ($299/mo, 4-10 pages)
- Review add-on: $99/mo (bolt-on, optional)

This is a **multi-product subscription** — one customer can have web design + review add-on at the same time. Stripe supports this (subscriptions can have multiple `line_items`), but the current codebase assumes one price_id → one tier.

Specific failure modes:

1. **The `PRICE_TO_TIER` mapping in the webhook handler only handles two price IDs.** Adding new price IDs for web design tiers requires updating the webhook handler — and if `STRIPE_WEB_BASIC_PRICE_ID` is missing from production env vars, `priceToTier[priceId]` silently returns `undefined`, which falls back to `'basic'`. A web design client on the $199 plan gets a `basic` review tier. This already bit the system when `STRIPE_BASIC_PRICE_ID` was missing (documented in the existing PITFALLS.md, Pitfall 4).

2. **The `tier` column on businesses conflates two dimensions.** Currently: `trial | basic | pro`. Post-pivot: a business might be `web_basic` for web design purposes and `review_addon` for review purposes simultaneously. A single string column cannot represent this composite state.

3. **Pooled billing (`getPooledMonthlyUsage`) aggregates send counts across all businesses.** This works for the current single-tier model. With the review add-on as a separate Stripe product, the billing boundary changes: does purchasing review_addon for one business unlock sends for all businesses? The current pooled model would say yes — which is the intended behavior for the agency, but needs to be explicitly verified when the new products are set up.

**Why it happens:**
Incrementally adding tiers to a `PRICE_TO_TIER` map is easy and breaks nothing. But the semantic mismatch between "web design tier" and "review tier" is not visible until a client subscribes to both and the `tier` column doesn't know how to represent the combined state.

**Consequences:**
- Client buys web design + review add-on; system doesn't recognize add-on price ID; review features stay gated at trial level
- After business cancels web design but keeps review add-on, tier shows wrong state
- Webhook events for the multi-product subscription have multiple price IDs in `subscription.items.data`; current handler only reads `data[0]`

**Prevention:**
Before creating Stripe products for v4.0, decide the data model for tiers:

Option A: Add `web_design_tier` and `review_tier` as separate columns on businesses, updated independently by the webhook handler. `PRICE_TO_TIER` maps each price ID to `{ dimension: 'web_design', value: 'basic' }` or `{ dimension: 'review', value: 'addon' }`. Clean, explicit, handles multi-product correctly.

Option B: Keep single `tier` column but add composite values: `web_basic`, `web_advanced`, `web_basic_review`, `web_advanced_review`. More values but one column. Simpler queries, harder to maintain.

Option C (deferred, not for MVP): Use Stripe's product metadata to drive entitlements directly rather than syncing to a local `tier` column. More robust long-term but requires a different architecture.

For MVP, Option A is recommended. Update the webhook handler to handle each `subscription.items.data[N]` (not just `data[0]`) and route each price ID update to the correct dimension.

**Warning signs:**
- `PRICE_TO_TIER` map still only has 2 entries after adding 4 new Stripe products
- `handleSubscriptionUpdated` reads `subscription.items.data[0]` instead of iterating all items
- `tier` column being used for both web design access gating and review send gating

**Phase to address:** Stripe/billing setup phase of v4.0 — before any checkout sessions are created for new products.

---

### Pitfall 5: Marketing Page Pivot Confuses Existing Clients Already Using Review Features

**What goes wrong:**
The landing page will pivot to web design services messaging ("We manage your entire Google review strategy" is already the current positioning per PROJECT_STATE.md — but the v4.0 pivot shifts to web design as primary). Review automation becomes an "add-on page."

If the pivot is executed at the route level (`/` redirects to web design landing, review automation hidden under `/reputation`), existing clients who bookmarked `avisloop.com` or have it in their browser history land on a page that doesn't mention their current service. This creates:

1. **Confidence crisis:** "Is this the right product? Did the company change?" — clients who find the unfamiliar homepage may assume they're at the wrong URL or that their service is being discontinued.

2. **Onboarding funnel mismatch:** New sign-ups from the web design landing page expect web design onboarding, but they land in the existing review-automation onboarding wizard. The wizard asks about services, campaign presets, and SMS consent — all review-automation concepts that mean nothing to a web design client.

3. **SEO disruption:** The current site has indexed content under review-automation keywords. A hard pivot destroys that SEO equity without a transition period.

**Why it happens:**
Repositioning copy is cheap — it's one file change. But it's shipped globally, affecting all existing clients immediately.

**Consequences:**
- Churn from confused existing review clients
- Bounce rate spike from web design visitors who hit the review onboarding flow
- Potential SEO ranking loss for existing review automation queries

**Prevention:**

1. **Preserve existing URLs:** Keep `/reputation` or `/review-automation` as a landing page with the old messaging. Add it to the nav for review-automation context. Don't let indexed review content disappear.

2. **Decouple marketing pivot from product pivot:** The landing page can be updated immediately, but app-internal messaging (settings labels, dashboard copy, onboarding wizard copy) should only change for new businesses registered after the pivot date. Existing businesses see no change.

3. **Add a client-type selector to onboarding:** "Are you signing up for web design or review automation?" routes to the appropriate wizard flow. This prevents web design clients from hitting review-automation-specific steps.

4. **Announce to existing clients:** A simple email or in-app banner explaining the expansion is far less disruptive than silent repositioning.

**Warning signs:**
- Marketing landing page updated without updating the onboarding flow to match
- No `/reputation` or `/review-automation` page preserved for existing SEO
- No in-app announcement for existing users
- Web design clients completing review-automation onboarding steps

**Phase to address:** Marketing landing page phase — must be coordinated with onboarding flow updates, not shipped independently.

---

## Moderate Pitfalls

### Pitfall 6: The `businesses` RLS Policy Allows the Client Portal to Read More Than Intended

**What goes wrong:**
The current RLS policy on `businesses` is:
```
user_id = auth.uid()
```
Authenticated users see their own businesses. The client portal uses `intake_token` lookup via service role (bypassing RLS), which is correct.

But the ticket/revision portal needs to show the client their own revision history. If the revision history is stored in a `revisions` table with `business_id` FK, and the client portal page needs to display it, you have two choices:

1. Use service role to query revisions (bypasses RLS) — works, but means the portal API has service role access to all revisions in the system. A bug in the token validation could expose any client's revisions.

2. Create a Supabase policy that allows anon/public read of revisions where the `business_id` matches a valid token — this is complex and fragile.

The existing `intake` form page (correctly) uses service role only to validate the token, then the form submission goes through an API route with explicit business_id validation. The client portal needs the same discipline: validate token → resolve business_id → scope all subsequent queries to that business_id explicitly.

**Prevention:**
The client portal server component should:
1. Validate `intake_token` (or a new `client_portal_token`) via service role client — get `business_id` only
2. Pass that `business_id` to all subsequent queries as an explicit parameter
3. Never expose `business_id` to the client-side component (to prevent a client from substituting a different business_id in a client-side fetch)
4. Rate-limit the portal page load by IP to prevent token scanning

**Warning signs:**
- Portal page component receives `businessId` as a prop and uses it in `fetch('/api/revisions?businessId=...')` (client-side, forgeable)
- Service role client used for ALL portal queries instead of just token validation
- No rate limiting on `/portal/[token]` route

**Phase to address:** Client portal implementation phase.

---

### Pitfall 7: Adding Nullable Columns to `businesses` During Production Without Lock Risk Assessment

**What goes wrong:**
The existing pattern (established in Phases 55, 44) is to add nullable columns to `businesses` with `ADD COLUMN IF NOT EXISTS`. In PostgreSQL 11+, adding a nullable column with no default is a metadata-only operation — no table rewrite, no lock contention. This is safe.

The risk appears when a developer adds:
```sql
ALTER TABLE businesses ADD COLUMN revision_limit INTEGER NOT NULL DEFAULT 2;
```

`NOT NULL DEFAULT` with a non-volatile expression in Postgres 11+ is also safe (stored as a catalog default). But:
- `NOT NULL DEFAULT (SELECT ...)` — this is a subquery default, not allowed
- `NOT NULL DEFAULT NOW()` — safe
- Adding a `NOT NULL` constraint without a default on a table with existing rows — will fail immediately

More subtle: adding a `CHECK` constraint (e.g., `revision_count >= 0`) acquires a full table scan to validate existing rows. On a `businesses` table with many rows, this blocks reads and writes for the duration.

**Prevention:**
For every new column in the v4.0 migration:
- If nullable: safe, proceed
- If NOT NULL with static default: safe, proceed
- If NOT NULL with computed default or CHECK constraint: test on a copy of production data size first, or use `NOT VALID` + separate `VALIDATE CONSTRAINT` step
- Never add a UNIQUE constraint on a large table without `CREATE UNIQUE INDEX CONCURRENTLY` first

**Warning signs:**
- Migration adds `NOT NULL` column with subquery default
- Migration adds CHECK constraint without `NOT VALID` option
- No migration test against a non-empty database (only tested against fresh local Supabase)

**Phase to address:** Every migration phase — this is a standing check, not a one-time fix.

---

### Pitfall 8: Revision Submission from Client Portal Creates Records That the Agency Billing System Doesn't Know How to Count

**What goes wrong:**
The client portal will allow clients to submit revision requests. These submissions arrive unauthenticated (no user session) through a token-validated API route. The revision gets inserted into the `revisions` table with the correct `business_id`.

The billing enforcement code (currently in `lib/actions/send.ts`) checks `getPooledMonthlyUsage(user.id)`. For review automation, usage is tracked via `send_logs`. For revision requests, usage must be tracked differently — there's no authenticated user making the revision request when the client submits it.

Specific risk: if the enforcement check is written as:
```typescript
const { count } = await supabase
  .from('revisions')
  .select('*', { count: 'exact' })
  .eq('business_id', businessId)
  .gte('created_at', startOfMonth)

if (count >= limit) { return overage; }
```

This COUNT query runs on every portal submission. At low volume, fine. At scale, this could be a slow blocking query on each form submit. More importantly, if the submission API doesn't enforce the limit atomically (check then insert in a transaction), concurrent submissions can exceed the limit (see Pitfall 2).

**Prevention:**
Create a Postgres RPC for revision submission that:
1. Counts existing revisions in the current period `FOR UPDATE`
2. Either inserts the revision and returns success, or returns an "over_limit" error
3. Atomically handles the check+insert in a single transaction

The RPC can be called from the API route that handles client portal form submissions. This is the same pattern as the campaign enrollment atomic RPCs (`claim_due_campaign_touches`).

**Warning signs:**
- Revision count check and revision insert are two separate Supabase calls with no transaction
- Limit enforcement lives only in the client-side form (can be bypassed)
- No test for concurrent revision submissions from two browser tabs

**Phase to address:** Ticket/revision implementation phase, specifically the API route for client portal submission.

---

### Pitfall 9: The Onboarding Wizard Creates Review-Automation-Only Businesses for Web Design Clients

**What goes wrong:**
The existing `CreateBusinessWizard` (3-step modal: business details → services → SMS consent) is designed for review automation clients. It collects:
- Service types (hvac, plumbing, etc.)
- Campaign preset (Gentle/Standard/Aggressive)
- SMS consent acknowledgement

A web design client has no use for service types or campaign presets. If a web design client onboards through the existing wizard, they get a business record configured for review automation, with a campaign pre-created and SMS consent required. This creates friction (what is a "campaign preset"?) and noise (they now have campaigns they'll never use).

**Prevention:**
The v4.0 onboarding needs to branch at the entry point:
- "Web design client" → minimal wizard: business name, domain, service tier selection
- "Review automation" → existing wizard unchanged

The branch can be implemented as a `mode` query param on `/onboarding?mode=webdesign` vs `/onboarding?mode=review` (similar to the existing `?mode=new` bypass added in Phase 56).

Do not try to make one wizard serve both paths with conditional steps — this pattern accumulates complexity rapidly and produces a wizard that is confusing for both user types.

**Warning signs:**
- Web design clients are asked to select "service type" (hvac, plumbing, etc.)
- Web design clients see "Campaign Preset" step
- Web design clients must acknowledge SMS consent before their business is created
- New businesses created via web design intake form have `campaign_id` set

**Phase to address:** Onboarding and client creation flow for v4.0.

---

## Minor Pitfalls

### Pitfall 10: The `businesses` Table Page (`/businesses`) Conflates Agency Clients and Self-Managed Businesses

**What goes wrong:**
Currently, `/businesses` shows all businesses owned by the user in a card grid, with agency metadata (Google rating, monthly fee, competitor tracking). In v4.0, some of these businesses are web design clients, some are review automation clients, and some are both.

Without a visual indicator of which type each business is, the agency operator will struggle to understand the dashboard at a glance. Worse, the actions available for each card (edit web design details, submit a revision, toggle review automation) will vary by business type — but if all businesses use the same card component, the actions will be inconsistent.

**Prevention:**
Add a `client_type` field (or derive it from active subscriptions) and use it to conditionally render the correct card actions and metadata sections. Even a simple badge ("Web Design" / "Review" / "Both") on the business card prevents confusion.

**Phase to address:** `/businesses` page update in v4.0.

---

### Pitfall 11: Hardcoded Revision Limits That Are Expensive to Change

**What goes wrong:**
If the Basic/Advanced revision limits (2/mo and 4/mo) are hardcoded in the application code (as `TIER_LIMITS` currently hardcodes send limits), changing them requires a code deployment. This is acceptable now but creates friction when testing different limit values with early clients.

**Prevention:**
Store revision limits in a constants file from day one (`REVISION_LIMITS = { basic: 2, advanced: 4 }`), not inline in queries or components. This way changing limits is a one-line diff, not a find-replace across the codebase.

**Phase to address:** Ticket/revision data model phase.

---

### Pitfall 12: Client Portal Form Submits to a Route That Has No Rate Limiting

**What goes wrong:**
The existing `/api/intake` route (for client business intake forms) currently has no rate limiting applied (the intake API was added after the rate limiting infrastructure was built for review sends). The client portal revision submission route will be similarly public-facing.

Without rate limiting, a client (or an attacker who found the portal URL) can submit hundreds of revision requests, exhausting monthly limits instantly and triggering overage charges.

**Prevention:**
Apply Upstash Redis rate limiting to the client portal submission route, scoped by token (not IP, since clients may share office IPs). Limit: e.g., 10 submissions per hour per token. This is a 3-line addition using the existing `checkPublicRateLimit` infrastructure.

Verify `/api/intake` also has rate limiting added — it currently does not appear to.

**Phase to address:** Client portal API route implementation.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data model / migration | Pitfall 1 (businesses god object), Pitfall 7 (ALTER TABLE lock risk) | Decide businesses vs separate table before first migration; nullable columns only for MVP |
| Stripe setup | Pitfall 4 (multi-product billing) | Add `web_design_tier` + `review_tier` columns; update webhook to iterate all subscription items |
| Ticket/revision system | Pitfall 2 (counter race condition), Pitfall 8 (non-atomic limit enforcement) | Postgres RPC for atomic check+insert; derived count not stored counter |
| Client portal | Pitfall 3 (token security), Pitfall 6 (RLS/service role discipline), Pitfall 12 (rate limiting) | 192-bit tokens; regenerate link button; rate limit by token |
| Marketing/landing page | Pitfall 5 (messaging confusion) | Preserve review automation URLs; add client-type selector to onboarding |
| Onboarding wizard | Pitfall 9 (wrong wizard for wrong client type), Pitfall 10 (mixed client type display) | `?mode=webdesign` branch; `client_type` badge on business cards |

---

## Integration-Specific Warnings (Existing System)

These pitfalls are unique to retrofitting new features onto the existing AvisLoop codebase:

### The `getActiveBusiness()` Cookie Pattern Doesn't Apply to Client Portal

The entire dashboard is built around `getActiveBusiness()` resolving the currently selected business from the `active_business_id` cookie. The client portal has no such cookie — the business is resolved from the URL token.

Any shared utility that calls `getActiveBusiness()` internally (e.g., if a revision action were to call it) will fail or return the wrong business when invoked from the client portal context. The pattern from `public-job.ts` (explicit `business_id` from token validation, passed through all writes) must be followed strictly for all client portal actions.

### The `getPooledMonthlyUsage` Function Is User-Scoped and Won't Work in Portal Context

`getPooledMonthlyUsage(userId)` requires an authenticated user ID. Client portal submissions have no user. Any billing enforcement in the portal API route must use a business-scoped query directly, not the pooled usage helper.

### The `businesses` Middleware Route Protection Covers `/businesses` but Not `/portal/[token]`

`/portal/[token]` must be explicitly excluded from the `APP_ROUTES` middleware protection (similar to how `/complete/[token]` is excluded). Verify this exclusion before shipping — a missing exclusion makes the portal inaccessible to unauthenticated clients.

---

## "Looks Done But Isn't" Checklist

- [ ] Data model: Added web design fields as nullable columns with no NOT NULL constraints on non-empty table
- [ ] Data model: TypeScript `Business` type updated to include new fields without bloating to 50+ columns
- [ ] Stripe: New price IDs added to `PRICE_TO_TIER` map in webhook handler for ALL new products
- [ ] Stripe: Webhook handler iterates `subscription.items.data` (all items, not just `data[0]`)
- [ ] Revisions: Monthly limit enforced atomically (Postgres RPC or transaction), not as read-then-write in application code
- [ ] Client portal: Token is 192+ bits (randomBytes(24).toString('base64url')), not UUID
- [ ] Client portal: "Regenerate portal link" button exists in agency dashboard
- [ ] Client portal: Submissions logged with IP and timestamp for dispute resolution
- [ ] Client portal: `/portal/[token]` excluded from middleware APP_ROUTES auth protection
- [ ] Client portal: Rate limiting applied to submission API route, scoped by token
- [ ] Client portal: Service role used ONLY for token validation, not for all portal queries
- [ ] Onboarding: Web design clients do NOT see service type / campaign preset / SMS consent steps
- [ ] Marketing: Review automation landing page preserved at `/reputation` or equivalent
- [ ] Marketing: Existing clients see no change to in-app copy or dashboard labels
- [ ] Billing: `web_design_tier` and `review_tier` are separate dimensions, not a single `tier` column

---

## Sources

- Direct codebase inspection: `app/intake/[token]/`, `app/(dashboard)/businesses/page.tsx`, `lib/data/subscription.ts`, `lib/actions/billing.ts`, `app/api/webhooks/stripe/route.ts`, `lib/constants/billing.ts`, `supabase/migrations/20260315000100_add_intake_token.sql`, `supabase/migrations/20260227000300_add_agency_metadata.sql` (2026-03-18)
- [Zero-downtime Postgres migrations — GoCardless Engineering](https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/) — ALTER TABLE lock contention, NOT VALID pattern (HIGH confidence — engineering blog with detailed Postgres internals)
- [Stripe Subscriptions with Multiple Products](https://docs.stripe.com/billing/subscriptions/multiple-products) — multiple line_items per subscription, single invoice (HIGH confidence — official Stripe docs)
- [Stripe Product Mix Pricing Strategies](https://stripe.com/resources/more/product-mix-pricing-strategies-for-growth) — bundling vs add-on tradeoffs, complexity overhead (HIGH confidence — official Stripe resource)
- [Session Token in URL — PortSwigger](https://portswigger.net/kb/issues/00500700_session-token-in-url) — token logging risk in HTTPS, browser history exposure (HIGH confidence — established security research)
- [Sensitive Token in URL — Cobalt Vulnerability Wiki](https://www.cobalt.io/vulnerability-wiki/v4-access-control/sensitive-token-in-url) — mitigation patterns for URL tokens (MEDIUM confidence)
- [OWASP Testing for Account Enumeration](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account) — enumeration attack patterns and mitigations (HIGH confidence — OWASP)
- [Product Repositioning — Adilo](https://adilo.com/blog/product-repositioning-strategies-examples/) — existing user confusion risks, gradual rollout patterns (MEDIUM confidence)
- [Building a Ticketing System: Concurrency, Locks — Medium/CodeFarm](https://codefarm0.medium.com/building-a-ticketing-system-concurrency-locks-and-race-conditions-182e0932d962) — race condition patterns in limit enforcement (MEDIUM confidence)
- Existing AvisLoop PITFALLS.md (`PITFALLS.md` for Pre-Production QA Audit, 2026-02-27) — reused findings on PRICE_TO_TIER silent fallback, service role scope discipline, public route middleware exclusion

---

*Pitfalls research for: v4.0 Web Design Agency Pivot milestone*
*Researched: 2026-03-18*
*Confidence: HIGH — critical pitfalls grounded in actual codebase inspection; external sources used for verification*
