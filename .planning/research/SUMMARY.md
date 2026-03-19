# Project Research Summary

**Project:** AvisLoop — v4.0 Web Design Agency Pivot
**Domain:** Web design agency platform layered onto existing review automation SaaS
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

AvisLoop v4.0 pivots from a self-serve review automation SaaS to a managed web design agency platform, while preserving review automation as a paid add-on. The product model is a $199–$299/month managed website subscription for home service businesses (HVAC, plumbing, electrical, roofing, etc.), with a structured revision ticket system, a client-facing portal, and a $99/month review automation bolt-on. The core insight from research is that this entire pivot can be executed without adding a single new npm package — Supabase Storage, react-dropzone, stripe, and zod are already installed, and the token-secured public route pattern already exists twice in the codebase (`/complete/[token]` and `/intake/[token]`).

The recommended approach is to extend the existing `businesses` table with a `client_type` discriminator column (`'reputation' | 'web_design' | 'both'`) and add two new tables (`web_projects`, `project_tickets`) that follow the established multi-tenant RLS pattern. This avoids duplicating the auth/RLS/multi-business architecture for a separate `clients` table. The existing `/businesses` page, `BusinessCard`, `BusinessDetailDrawer`, and cookie-based active-business resolver all keep working without structural change. New features hook in at well-defined boundaries: a new `/projects` dashboard route for operator CRM, a new `/portal/[token]` public route for client access, and a Supabase Storage bucket for revision attachments.

The primary risks are architectural creep in the `businesses` table, race conditions in monthly ticket limit enforcement, Stripe billing model mismatch for multi-product subscriptions, and marketing pivot confusion for existing review automation clients. All four risks are well-understood and have concrete prevention strategies documented in PITFALLS.md. The correct enforcement approach for revision limits is an atomic Postgres RPC (check+insert in one transaction), not an application-level read-then-write. Stripe billing requires separate `web_design_tier` and `review_tier` columns to represent the composite subscription state, not an extension of the single `tier` column.

---

## Key Findings

### Recommended Stack

The v4.0 pivot introduces zero new npm packages. All required capabilities exist in the current stack. Supabase Storage (already provisioned) handles file attachments via signed upload URLs — the correct pattern for Next.js where Server Actions have a 1MB body limit. `react-dropzone` (already at v14.3.8) handles the file input UI. The `stripe` SDK (v20.2.0) handles the $50 overage via `stripe.invoiceItems.create()` + `stripe.invoices.create()` — a one-time invoice pattern that is simpler and more appropriate than Stripe Billing Meters for a fixed overage charge. The client portal uses a DB-stored token (`randomBytes(24).toString('base64url')`) identical to the existing `form_token` and `intake_token` patterns.

**Core technologies:**
- **Supabase Storage** — revision attachment storage, private `ticket-attachments` bucket, signed upload URLs — already provisioned, zero new credentials
- **react-dropzone v14.3.8** — file input UI for portal attachment uploads — already in package.json, used in 3 existing components
- **stripe.invoiceItems.create()** — $50 overage billing — already integrated, uses existing Stripe customer ID on business record
- **DB token (randomBytes 192-bit)** — client portal URL auth — proven in two existing routes (`/complete/[token]`, `/intake/[token]`)
- **Postgres RPC** — atomic ticket limit enforcement — same approach as existing campaign enrollment RPCs (`claim_due_campaign_touches`)

**New environment variables: 0.** All required secrets already exist in production.

### Expected Features

**Must have (table stakes):**
- Client portal at `/portal/[token]` — token-secured, no client account required
- Revision ticket submission form — title, description, optional file attachment
- Three-status ticket lifecycle — open, in progress, resolved
- Monthly ticket counter with enforcement — "X of Y revisions remaining" with hard block at limit
- Operator ticket management view — all tickets across clients, status updates, internal notes
- Web design plan tier display — Basic ($199/mo, 2 revisions/month) vs Advanced ($299/mo, 4 revisions/month)
- Pricing page for the agency — two-tier comparison with Calendly CTA (existing pattern)

**Should have (differentiators):**
- Client dashboard with website health indicators — days active, revisions fulfilled, next reset date, website URL
- `client_type` badge on BusinessCard — instant visual separation of web design vs review clients
- Review add-on upsell in portal — display-only section, links to Calendly or Stripe checkout
- Operator all-clients KPI view — BusinessDetailDrawer extended with web-design-specific metadata
- Home services niche positioning on landing page — explicit targeting of HVAC, plumbing, electrical, roofing
- Token regeneration button — agency can invalidate and reissue portal link if compromised

**Defer (post-MVP):**
- Visual annotation for revision requests — high complexity, target audience (home service owners) rarely benefits
- AI-generated monthly summary — high complexity, low V1 value
- Before/after screenshot comparison — text-only change log is sufficient for V1
- Real-time ticket status updates in portal — async load-on-refresh is appropriate at this scale
- White-label portal branding — unnecessary at $199–$299 price point with a solo operator

**Anti-features (deliberately exclude):**
- Client account creation / login — adds friction; home service owners are not SaaS users
- Full Kanban project management — wrong audience; competes with established tools
- CMS editor for clients — defeats the managed service value proposition
- Per-ticket invoicing — conflicts with flat monthly fee mental model
- Rich text editor for tickets — `<textarea>` is sufficient for V1

### Architecture Approach

The architecture follows an "extend, don't replace" principle. The existing `businesses` table becomes the anchor for web design clients via a `client_type` column. Two new tables (`web_projects`, `project_tickets`) follow the established RLS pattern with `business_id` denormalized for efficient single-hop policy enforcement. A new public route `/portal/[token]` follows the identical pattern to `/complete/[token]` and `/intake/[token]`. The dashboard adds a `/projects` route that fetches data with the existing `getActiveBusiness()` + caller-provides-businessId pattern. Web design subscription state lives on `web_projects.subscription_tier`, kept entirely separate from the existing `tier` column that governs review automation send limits.

**Major components:**
1. **`businesses` table extension** — `client_type` column (`'reputation' | 'web_design' | 'both'`) discriminates client categories; existing RLS, switcher, and card grid remain unchanged
2. **`web_projects` table** — one project per client (MVP), holds domain, tier, billing dates, `portal_token`; standard owner-all RLS policy
3. **`project_tickets` table** — revision requests with status/priority; `business_id` denormalized for RLS; atomic limit enforcement via Postgres RPC
4. **`ticket_messages` table** — threaded replies; `business_id` denormalized; `author_type` distinguishes agency vs client messages
5. **`/portal/[token]` public route** — Server Component, service-role token validation, renders ClientPortal and PortalTicketForm; sits outside the dashboard route group to avoid auth layout interference
6. **`/projects` dashboard route** — operator CRM for web design clients; ProjectCard grid + ProjectDetailDrawer + TicketList; fetches its own data, does not touch root layout
7. **`ticket-attachments` Supabase Storage bucket** — private, 10MB file limit, signed upload URLs generated server-side via Server Action
8. **Marketing restructure** — existing homepage content moves intact to `/reputation`; new `components/marketing/v3/` components for web design agency homepage

### Critical Pitfalls

1. **Businesses table god object** — the `businesses` table already has 30+ columns. Adding web design fields (tier, revision count, domain, hosting status) directly to it produces unmaintainable types and chatty queries. Prevention: web-design-specific data lives in the `web_projects` table. The only new column on `businesses` is `client_type`. Hold this line firmly.

2. **Ticket limit race condition** — enforcing monthly revision limits with application-level read-then-write allows concurrent submissions to exceed limits, resulting in unbilled overages and client disputes. Prevention: implement limit check and ticket insert as a single Postgres RPC with `FOR UPDATE` locking, identical to the campaign enrollment atomic RPCs already in the codebase.

3. **Stripe multi-product billing mismatch** — the existing `tier` column and `PRICE_TO_TIER` webhook map handle one price ID per business. Web design + review add-on is a two-product subscription; the webhook handler currently reads only `subscription.items.data[0]`. Prevention: add separate `web_design_tier` and `review_tier` columns; update webhook to iterate all subscription items. This must be done before creating any new Stripe products.

4. **Client portal token security gaps** — DB tokens in URLs appear in server logs, browser history, and analytics. Prevention: use `randomBytes(24).toString('base64url')` (192-bit), add a "Regenerate portal link" button in the dashboard, log all portal submissions with IP and timestamp, apply Upstash rate limiting scoped by token to the submission API route. Use service-role client for token validation only — all subsequent queries are scoped explicitly by `business_id`.

5. **Marketing pivot confuses existing review clients** — replacing the homepage without preserving `/reputation` destroys SEO equity and creates confidence crises for existing clients. Prevention: move existing homepage content to `/reputation` intact; never delete `components/marketing/v2/`; add `client_type` selector at onboarding entry point (`?mode=webdesign` branch) so web design clients do not see service types, campaign presets, or SMS consent steps.

---

## Implications for Roadmap

Architecture research provides a clear build order: schema outward. Each phase depends on the one before it. No phase can be safely reordered within the first four.

### Phase A: Data Model + Business Extension

**Rationale:** Every downstream component — dashboard UI, client portal, billing enforcement — depends on these tables existing with correct RLS. This is the foundation; nothing else can be built without it.

**Delivers:** Database schema for `web_projects`, `project_tickets`, `ticket_messages`; `client_type` column on `businesses`; TypeScript types updated; onboarding wizard branched by `?mode=webdesign`.

**Addresses:** Client portal table stakes (table foundation), operator ticket management (schema), web design plan tier distinction (subscription_tier column on web_projects).

**Avoids:**
- Pitfall 1 (god object — settle the table boundaries before writing any queries)
- Pitfall 7 (ALTER TABLE lock risk — nullable columns only, no CHECK constraints without NOT VALID)
- Pitfall 9 (wrong onboarding for web design clients — wizard branch lives here)

**Research flag:** Standard patterns. Schema follows the established RLS pattern from 70 prior phases. No additional research needed.

---

### Phase B: Web Projects CRM (Dashboard)

**Rationale:** Operator must be able to create projects and generate portal tokens before clients can access anything. The portal URL originates here.

**Delivers:** `/projects` dashboard route; ProjectCard grid; ProjectDetailDrawer; ProjectWizard modal; "Projects" nav item in sidebar; `client_type` badge on BusinessCard; "Web Project" tab in BusinessDetailDrawer; `generatePortalToken()` server action.

**Addresses:** Operator all-clients KPI view (differentiator), client portal authentication (token generation side), `client_type` badge (differentiator).

**Avoids:** Pitfall 10 (mixed client type display — `client_type` badge makes web vs review clients visually distinct).

**Uses:** Existing `CreateBusinessWizard` modal pattern (3-step), `generateFormToken()` pattern for portal token, `getActiveBusiness()` + caller-provides-businessId for all data functions.

**Research flag:** Standard patterns. All component patterns (drawer, wizard, card grid) have working examples in the codebase (`BusinessDetailDrawer`, `CreateBusinessWizard`, `/businesses` page).

---

### Phase C: Ticket System (Dashboard Side)

**Rationale:** The ticket tables must exist and the dashboard management UI must work before the client portal can submit tickets into them and see meaningful responses.

**Delivers:** `/projects/[id]/tickets` route; TicketList with status filter; TicketDetailDrawer with message thread; NewTicketForm; open ticket count badges on ProjectCard; Postgres RPC for atomic ticket limit enforcement; `REVISION_LIMITS` constants file.

**Addresses:** Operator ticket management (table stakes), monthly ticket limit enforcement (table stakes), ticket history and status (table stakes).

**Avoids:**
- Pitfall 2 (race condition — Postgres RPC is implemented here, not deferred to Phase D)
- Pitfall 8 (non-atomic limit enforcement from client portal — RPC covers both agency and portal submissions)
- Pitfall 11 (hardcoded limits — use `REVISION_LIMITS = { basic: 2, advanced: 4 }` constants file from day one)

**Research flag:** Standard patterns for the UI. The Postgres RPC should reference the existing `claim_due_campaign_touches` RPC in `supabase/migrations/` as the model to follow.

---

### Phase D: Client Portal (Public)

**Rationale:** Portal depends on Phase A (tables), Phase B (portal_token generation), and Phase C (tickets to display and submit into). This is the last backend-dependent phase before billing.

**Delivers:** `/portal/[token]` public route; ClientPortal component; PortalTicketForm with file upload to Supabase Storage; `ticket-attachments` bucket (private, signed URLs); `/api/portal/tickets` Route Handler with token validation; Upstash rate limiting on submission route (scoped by token); portal activity logging (IP, timestamp); "Regenerate portal link" button in ProjectDetailDrawer.

**Addresses:** All client portal table stakes — portal access, ticket submission, ticket history, monthly quota display. Token security (critical pitfall).

**Avoids:**
- Pitfall 3 (token security — 192-bit token, regenerate button built here, rate limiting applied)
- Pitfall 6 (RLS discipline — service role for token validation only; all subsequent queries scoped by explicit business_id)
- Pitfall 12 (rate limiting on public submission route)

**Uses:** Existing `/complete/[token]` route as the structural template; existing `checkPublicRateLimit` Upstash infrastructure; `react-dropzone` already installed; Supabase Storage signed upload URL pattern.

**Research flag:** Supabase Storage bucket RLS policy syntax needs verification before writing the migration. ARCHITECTURE.md and STACK.md describe slightly different bucket visibility models — use STACK.md's private bucket + signed read URLs (more secure). Verify policy syntax against official Supabase storage access control docs.

---

### Phase E: Stripe Billing for Web Design Tiers

**Rationale:** Billing can be built after the portal is live and tested. Early clients can be managed with manual Stripe invoices while the billing infrastructure is built correctly. This phase requires the most careful design and must not be rushed.

**Delivers:** New Stripe products/prices for web design Basic ($199) and Advanced ($299); `web_design_tier` and `review_tier` columns on `businesses`; updated Stripe webhook handler that iterates all `subscription.items.data`; `$50 overage` one-time invoice triggered from the ticket submission RPC; billing page updated to show web design plan state.

**Addresses:** Web design plan tier enforcement, overage billing, multi-product subscription support.

**Avoids:**
- Pitfall 4 (Stripe billing mismatch — separate tier dimensions, webhook iterates all items, not just `data[0]`)
- Silent `undefined` fallback in `PRICE_TO_TIER` map when new price IDs are not registered

**Research flag:** This phase needs deeper research before planning. Run `/gsd:research-phase` to answer: (1) How does the Stripe webhook handler need to change to handle multi-item subscriptions? (2) Does a review add-on for one business count against the pooled agency send limit or get its own limit? (3) What is the correct Stripe product hierarchy for Basic + Advanced + Review Add-on?

---

### Phase F: Marketing Landing Page Restructure

**Rationale:** Marketing depends on nothing from the application feature set. Doing it last means web design features are live and can be accurately described in copy. Critically, the `/reputation` route must exist and be preserved before the homepage is changed.

**Delivers:** New `components/marketing/v3/` web design agency homepage components; `/reputation` route with existing `v2/` content moved intact; updated `/pricing` page with dual-service tabbed presentation; updated sitemap, OG images, and meta tags; web design–specific FAQ addressing home service owner objections ("Do I need to manage it?", "What if I need changes?").

**Addresses:** Pricing page (table stakes), home services niche positioning (differentiator).

**Avoids:** Pitfall 5 (marketing pivot confusion — existing `v2/` components are never deleted, existing content preserved at `/reputation`; no in-app copy changes for existing review clients).

**Research flag:** Standard patterns. Copy and conversion optimization are content decisions, not technical research. The Calendly CTA pattern already exists in production. An SEO audit of current `/` ranking for review automation keywords is recommended before executing this phase — if meaningful organic traffic exists, plan canonical tags or 301 redirects accordingly.

---

### Phase Ordering Rationale

- **Schema first, always** — all five critical pitfalls (god object, race condition, billing mismatch, token security, marketing confusion) are resolved at the data model and architecture design level. Getting the schema right before building UI prevents costly rewrites.
- **Dashboard before portal** — the operator must create projects and generate portal tokens before clients can access anything. This order makes the portal testable end-to-end the moment it ships.
- **Billing after portal** — early clients can be managed with manual invoices while billing is built correctly. Rushing billing is the most common cause of subscription billing bugs in pivots.
- **Marketing last** — avoids shipping copy that describes features not yet built, and allows the actual client portal experience to inform landing page messaging. The `/reputation` preservation is the only time-sensitive constraint; it must be ready before any marketing traffic is redirected.

### Research Flags

**Needs full research-phase before planning:**
- **Phase E (Stripe Billing):** Multi-product subscription webhooks, pooled usage interaction with review add-on, overage invoice flow. The billing architecture decision (separate tier columns vs composite values) must be made before the first Stripe product is created.

**Needs doc verification (not full research):**
- **Phase D (Client Portal):** Supabase Storage bucket RLS policy syntax. Contradiction between STACK.md (private bucket) and ARCHITECTURE.md (public bucket) must be resolved. Recommendation: private bucket with signed read URLs.

**Standard patterns (skip research-phase):**
- **Phase A (Data Model):** Established RLS migration pattern, repeated 70+ times in this codebase.
- **Phase B (Projects CRM):** All component patterns have working examples in the codebase.
- **Phase C (Ticket System):** Postgres RPC pattern exists; the campaign enrollment RPCs are the model.
- **Phase F (Marketing):** Content work, no novel technical patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new packages confirmed by inspecting package.json; all new capabilities verified against official Supabase and Stripe docs; signed URL upload pattern verified against official Next.js + Supabase guides |
| Features | MEDIUM-HIGH | Table stakes verified against multiple agency portal platforms (ManyRequests, AgencyHandy, SPP.co/Wayfront, Toggl); pricing tier market positioning ($199/$299) is plausible but unvalidated against direct AvisLoop competitors |
| Architecture | HIGH | Based on direct codebase inspection of all relevant files (routes, middleware, migrations, DECISIONS.md); storage bucket RLS policy syntax is MEDIUM confidence and flagged for verification |
| Pitfalls | HIGH | Critical pitfalls grounded in actual codebase inspection; external verification from PortSwigger, OWASP, Stripe official docs, and GoCardless engineering blog |

**Overall confidence: HIGH**

### Gaps to Address

- **Pricing tier market validation:** $199/$299 for home services web design is plausible based on market research but unverified against current direct competitors. Validate with 2–3 prospect conversations before locking in pricing page copy.

- **Stripe multi-product billing design:** The interaction between `web_design_tier` and the existing pooled review send limits needs explicit resolution before Phase E. Does purchasing a review add-on for one client count against the agency-level pooled send limit, or does it get its own per-client limit? The current pooled billing (`getPooledMonthlyUsage`) is user-scoped; review add-on is client-scoped. These models are incompatible without a deliberate decision.

- **Supabase Storage bucket visibility contradiction:** ARCHITECTURE.md describes a public bucket for ticket attachments; STACK.md describes a private bucket with signed read URLs. These are contradictory. Resolve this before Phase D — recommendation is private bucket (STACK.md approach) for security reasons.

- **SEO impact of homepage pivot:** If the current `avisloop.com` homepage ranks for any review automation keywords, moving that content to `/reputation` without 301 redirects will lose that equity. Run a quick SEO audit (Google Search Console, if configured) before Phase F execution.

- **Onboarding wizard branch design:** PITFALLS.md recommends `?mode=webdesign` as a URL param to branch onboarding. ARCHITECTURE.md recommends a `client_type` selector at step 1 of the existing wizard. These need to be reconciled in Phase A planning — one approach, not both.

---

## Sources

### Primary (HIGH confidence — official documentation)
- Supabase Storage signed upload URL docs — [supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl)
- Supabase Storage access control (RLS) — [supabase.com/docs/guides/storage/security/access-control](https://supabase.com/docs/guides/storage/security/access-control)
- Supabase Storage bucket fundamentals — [supabase.com/docs/guides/storage/buckets/fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- Stripe flat fee with overages — [docs.stripe.com/billing/subscriptions/usage-based-v1/use-cases/flat-fee-and-overages](https://docs.stripe.com/billing/subscriptions/usage-based-v1/use-cases/flat-fee-and-overages)
- Stripe multiple products per subscription — [docs.stripe.com/billing/subscriptions/multiple-products](https://docs.stripe.com/billing/subscriptions/multiple-products)
- PortSwigger session token in URL — [portswigger.net/kb/issues/00500700_session-token-in-url](https://portswigger.net/kb/issues/00500700_session-token-in-url)
- OWASP testing for account enumeration — official OWASP Web Security Testing Guide
- GoCardless engineering blog — zero-downtime Postgres migrations, NOT VALID constraint pattern
- Direct codebase inspection — all route files, `lib/data/`, `lib/actions/`, middleware, migrations, DECISIONS.md, DATA_MODEL.md (2026-03-18)

### Secondary (MEDIUM confidence — community consensus, multiple sources)
- AgencyHandy — client portal best practices, top portal features for design agencies
- ManyRequests — design subscription service portal patterns, revision limit UX
- SPP.co / Wayfront — helpdesk feature set for agency portals
- Toggl — managing design change requests, revision request UX patterns
- SaasFrame — 2026 SaaS landing page conversion trends
- Adilo — product repositioning strategies, existing user confusion risks
- CodeFarm Medium — ticketing system concurrency and race conditions

### Tertiary (MEDIUM confidence — useful directionally, not verified)
- Web design pricing guides (knapsackcreative, various) — $199–$299 market positioning
- Home services landing page conversion research (Fermat Commerce, Shopify, Landerlab) — CTA patterns, social proof placement
- Home services SEO and website must-haves (NextLeft, Home Comfort Marketing)

---

*Research completed: 2026-03-18*
*Synthesized: 2026-03-18*
*Files synthesized: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Ready for roadmap: yes*
