# Feature Landscape: Web Design Agency Pivot

**Domain:** Web design agency platform — solo agency operator managing home service business clients
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH — ecosystem verified via multiple web sources, patterns drawn from ManyRequests, SPP.co/Wayfront, AgencyHandy, Toggl, and home services agency market research

---

## Context

AvisLoop is adding a web design agency layer on top of an existing review automation platform.
The operator is a solo agency owner. Clients are home service businesses (HVAC, plumbing,
electrical, roofing, etc.). The product model:

- **Basic plan ($199/mo):** 1–4 page website, 2 revision tickets/month
- **Advanced plan ($299/mo):** 4–10 page website, 4 revision tickets/month
- **Review add-on ($99/mo):** Plugs in AvisLoop's existing review automation

The operator manages everything through the existing AvisLoop dashboard. Clients get a
lightweight portal to submit revision requests and view history.

Existing platform already provides: multi-business CRM with cards and detail drawers,
token-secured public URLs, campaign/automation engine, Stripe billing, dashboard with KPIs.
These existing capabilities reduce build effort significantly.

---

## Table Stakes

Features that clients expect when paying $199–$299/month for a managed website. Missing any
of these makes the product feel unprofessional or incomplete.

### Revision Request Submission

**Why expected:** The core deliverable of the subscription is that clients can request changes
to their website. Without a way to submit, track, and confirm completion of requests, the
product has no accountability mechanism. Email threads are not acceptable at this price point.

| Feature Detail | Complexity | Notes |
|---------------|------------|-------|
| Structured submission form (what changed, priority, attachment) | Low | Single form, no workflow branching needed |
| Confirmation that request was received | Low | Toast + email notification |
| Status tracking: submitted → in progress → done | Low | 3-state enum, no complex state machine |
| Ability to see all past requests and their outcomes | Low | Simple list view |
| Mobile-friendly submission | Low | Existing design system handles this |

**Dependency:** Token-secured public URL pattern already exists in codebase for `/complete/[token]`.
The client portal URL generation can reuse this exact pattern.

---

### Monthly Ticket Limit Display and Enforcement

**Why expected:** Clients paying a flat monthly rate need to know their revision budget.
Surprising them with "you're out of tickets" or letting them submit unlimited requests creates
either unhappy clients or unhappy operators. Industry pattern (ManyRequests, Toggl agency
research) is to surface remaining count prominently and block submission when exhausted.

| Feature Detail | Complexity | Notes |
|---------------|------------|-------|
| "You have X of Y revisions remaining this month" display | Low | Single counter, reset at billing cycle |
| Form disabled with clear message when limit reached | Low | Guard at API and portal UI |
| Operator can see per-client ticket usage in dashboard | Low | Aggregate view on businesses page |
| Monthly reset (automatic on billing anniversary or calendar month) | Low | Cron or billing webhook trigger |
| Operator can manually grant extra tickets (override) | Low | Simple integer adjustment column |

**Enforcement pattern from research:** Document → Surface → Block. The UX pattern is to show
the limit prominently throughout (not just when exhausted), so clients self-regulate. Blocking
without warning creates frustration; warnings normalize the constraint.

---

### Ticket History and Status for Client

**Why expected:** Clients need to trust that their requests are being worked on. Without
visible status, every submitted ticket feels like it went into a void. Agency churn research
consistently identifies "lack of communication" as the top reason clients leave.

| Feature Detail | Complexity | Notes |
|---------------|------------|-------|
| List of all submitted tickets with status badges | Low | Table/list component |
| Chronological order, most recent first | Low | Sort by created_at DESC |
| Status visible: submitted, in progress, completed | Low | StatusDot pattern already in codebase |
| Completion notes from operator (optional) | Low | Text field on ticket, operator-only write |
| Attachment visibility (screenshots client submitted) | Medium | File storage via Supabase Storage |

---

### Operator Ticket Management (Dashboard Side)

**Why expected:** The operator is the other half of this system. They need to see all incoming
tickets, update status, add notes, and mark complete. Without this, they are managing revisions
over email, which defeats the purpose.

| Feature Detail | Complexity | Notes |
|---------------|------------|-------|
| All-tickets view across all clients | Low | Extends existing businesses/clients page |
| Filter by client, status, priority | Low | Standard filter pattern |
| Mark ticket in progress / complete | Low | Status toggle, same pattern as job completion |
| Add internal notes (not visible to client) | Low | Pattern exists in customer detail drawer |
| Add completion notes (visible to client) | Low | Separate text field on ticket |

---

### Client Portal Authentication (Token-Based)

**Why expected:** Clients need a way to access their portal without creating AvisLoop accounts.
Home service business owners (plumbers, HVAC techs) are not SaaS-savvy — adding account
creation friction is a conversion killer. Token-based magic links are the industry standard
for this use case.

| Feature Detail | Complexity | Notes |
|---------------|------------|-------|
| Unique portal URL per client (token-secured) | Low | `/portal/[token]` — identical pattern to `/complete/[token]` |
| No account creation required by client | Low | Stateless token auth |
| Token regeneration by operator | Low | Already implemented for form_token in settings |
| Noindex/nofollow on portal pages | Low | Already applied to public form |

---

### Pricing Page for the Agency

**Why expected:** If the agency is acquiring clients via its own marketing website, the pricing
page is the core conversion surface. Home service businesses are price-sensitive. They need to
see clear tier differentiation, understand what they get, and have an obvious next step.

Research on high-converting landing pages for home service targeting (from Fermat Commerce,
Unbounce, Shopify sources): single focused CTA increases conversion by up to 62%; removing
nav reduces distraction; social proof near CTA is the highest-leverage addition.

| Feature Detail | Complexity | Notes |
|---------------|------------|-------|
| Two-tier comparison (Basic vs Advanced) with feature differentiation | Low | Table or card layout |
| Review add-on call-out | Low | Upsell positioned as complementary |
| Single primary CTA per tier ("Book a Call" or "Get Started") | Low | Consistent with existing Calendly CTA pattern |
| Mobile-responsive layout | Low | Existing design system |
| No signup wall — CTA goes to booking or contact | Low | Reduces friction |

---

## Differentiators

Features that would make this agency platform stand out from competitors and justify the
$199–$299/month price point to skeptical home service business owners.

### Client Dashboard with Website Health Indicators

**Value proposition:** Instead of a bare ticket list, show the client a lightweight overview:
"Your website has been live for X days, Y revision requests fulfilled, next billing date Z."
This makes the subscription feel active and managed rather than dormant.

**Complexity:** Medium
**Why differentiating:** Most agencies at this price point send PDF reports or nothing. An
always-current mini-dashboard creates stickiness and reduces cancellations.

| Feature Detail | Complexity |
|---------------|------------|
| Days active counter | Low |
| Revisions fulfilled this month / total | Low |
| Current plan name and next reset date | Low |
| Website URL with one-click visit | Low |
| AI-generated monthly summary ("This month we completed X changes including...") | High — defer |

---

### Before/After or Change Log Visibility

**Value proposition:** When a revision is marked complete, show what changed (text description,
optionally a before screenshot). Home service clients often forget what they asked for. Showing
completed work builds perceived value.

**Complexity:** Medium (screenshots) / Low (text-only change log)

**Recommendation:** Text-only change log first. Screenshots are a nice-to-have that requires
file storage, comparison UI, and screenshot tooling — not worth the cost for V1.

---

### "Request a New Page" Upsell Path

**Value proposition:** When a client on the Basic plan (1–4 pages) wants a 5th page, surface
an in-portal prompt: "This would exceed your current plan. Upgrade to Advanced or purchase a
page add-on." This turns scope creep into revenue.

**Complexity:** Low
**Why differentiating:** Most agencies handle scope creep via email, which creates awkward
negotiation. An in-product upgrade prompt is cleaner and captures revenue automatically.

---

### Review Add-On Upsell in Portal

**Value proposition:** The existing AvisLoop review automation is a natural upsell. In the
client portal, display a section: "Get more Google reviews on autopilot — add Review
Automation for $99/mo." Clients who are already trusting you with their website are warm leads
for the review product.

**Complexity:** Low — display only, links to operator contact or Stripe checkout
**Why differentiating:** No competitor in the home-services-website-agency space bundles
website management with review automation.

---

### Operator "All Clients" KPI View

**Value proposition:** The existing businesses page already shows client cards. Extending it
with web-design-specific KPIs (active plan, tickets used this month, website age, churn risk
signal) gives the solo operator a one-screen health check across all clients.

**Complexity:** Medium
**Depends on:** BusinessDetailDrawer already exists; this extends the metadata model with
web-agency-specific columns.

---

### Home Services Niche Positioning on Landing Page

**Value proposition:** Generic web design agencies charge $3,000–$15,000 upfront. AvisLoop's
agency model offers $199/month with ongoing maintenance, no upfront cost, no technical
knowledge required. Positioning this explicitly for HVAC, plumbing, electrical, roofing,
painting, handyman businesses (the same service types already in the platform) makes the
targeting crisp.

**Research finding (MEDIUM confidence, from web searches):** Specialized agencies for home
services (Blue Corona, iMarket Solutions, Sixth City Marketing) charge $3,000–$10,000+ per
site with separate maintenance retainers. AvisLoop's subscription model undercuts dramatically
while bundling maintenance. This is a genuine positioning gap.

**What the landing page needs (based on conversion research):**
1. Niche-specific headline: name the target customer ("For HVAC, Plumbing & Electrical Companies")
2. Social proof from home service clients specifically (not generic agency testimonials)
3. Before/after: low-quality or no website → professional site
4. Price anchor: compare subscription to one-time agency cost
5. Trust signals: how many sites built, service areas, operator background
6. Single CTA: "Book a Free Strategy Call" (Calendly, existing pattern)
7. FAQ section addressing home service owner objections ("Do I need to manage it?", "What if I need changes?")

**Complexity:** Medium (content-heavy, not technically complex)

---

### Revision Request with Visual Annotation (Future)

**Value proposition:** Instead of clients describing changes in text ("move the phone number up
a bit"), let them annotate a screenshot of their live website. This is the pattern used by
ManyRequests and professional design platforms.

**Complexity:** High — requires screenshot capture, annotation canvas, file storage
**Recommendation:** Deliberately exclude from V1. Text descriptions + file uploads are sufficient
for 1–4 page simple sites. Annotation tools add significant build cost and rarely matter for
the target audience (home service business owners are not design-literate enough to use them
effectively).

---

## Anti-Features

Features to deliberately NOT build. Common mistakes in this domain.

### Full Project Management (Kanban Boards, Milestones, Gantt Charts)

**Why avoid:** Tools like SuiteDash, Teamwork, and ClickUp offer complete project management.
Building toward them means competing with established products that have years of development.
The target client (HVAC owner) does not want to learn a Kanban board. They want to type what
they need changed and have it happen.

**What to do instead:** Three-status ticket system (submitted, in progress, done). That is the
full state machine needed for this use case.

---

### Client Account Creation / Login System

**Why avoid:** Requiring clients to create a password, remember credentials, and go through
email verification adds friction that will cause adoption failure. Home service business owners
are not SaaS users. Token-based magic link URLs are the correct pattern.

**What to do instead:** Token-secured `/portal/[token]` URL, sent to client via email. No
account creation. Pattern already proven in codebase with `/complete/[token]`.

---

### White-Label Client Portal (Client Branding Their Own Portal)

**Why avoid:** At $199–$299/month with a solo operator, building white-labeling means building
a meta-product for agencies-building-for-agencies. The operator IS the agency. The portal
should be branded as AvisLoop (or the operator's agency name) — not per-client branding.

**What to do instead:** Single consistent portal brand with client name displayed prominently.
Client sees "Your website managed by [Agency Name]" not a fully custom-branded experience.

---

### Real-Time Chat / Live Support Inside Portal

**Why avoid:** Live chat requires the operator to be available, creates response time
expectations, and adds infrastructure (WebSockets or third-party chat widget). At solo-operator
scale, async ticket submission is sufficient and realistic.

**What to do instead:** After ticket submission, notify the operator via email. Operator
responds by updating ticket status and adding completion notes. This is the correct async
pattern.

---

### Automated Website Change Deployment

**Why avoid:** Automatically deploying website changes based on ticket submissions would
require deep integration with whatever CMS/hosting platform the client's site lives on
(Webflow, Squarespace, WordPress, etc.). The operator handles implementation manually; this
tool tracks that coordination, it does not replace it.

**What to do instead:** The tool is a coordination layer. The operator does the work in their
preferred tools; they log the outcome in AvisLoop.

---

### Invoice Generation and Payment Collection Per Ticket

**Why avoid:** Subscription billing (Stripe) already handles recurring charges. Per-ticket
invoicing adds complexity that conflicts with the "flat monthly fee" mental model. It signals
to clients that every interaction will cost extra, creating hesitation to submit legitimate
requests.

**What to do instead:** Monthly subscription covers the included tickets. Scope expansion
(new pages, etc.) is handled via Stripe plan upgrade or direct conversation. No per-ticket
billing.

---

### CMS Editor for Clients to Edit Their Own Website

**Why avoid:** If clients can edit their own website, they no longer need the managed service.
The managed service value is "you don't have to touch it." Adding a client-facing editor
creates support burden when clients break things, and undercuts the subscription model.

**What to do instead:** Client submits revision requests. Operator implements. This is the
correct division of responsibility.

---

## Feature Dependencies

Dependencies on existing AvisLoop features:

```
[Client portal URL generation]
  └── Depends on: form_token pattern in /complete/[token] — fully built, reusable

[Monthly ticket reset]
  └── Depends on: Stripe billing webhooks already integrated (subscription events)
  └── OR: Simple cron job pattern — already established in codebase

[Client ticket submission form]
  └── Depends on: Supabase Storage for file attachments (may need enabling/configuring)
  └── Reuses: existing form components, validation patterns

[Operator ticket management view]
  └── Depends on: existing businesses page and BusinessDetailDrawer
  └── Extends: agency metadata model (new columns needed: plan_tier, tickets_per_month, etc.)

[Review add-on upsell in client portal]
  └── Depends on: existing campaign/review automation system (fully built)
  └── New: display-only upsell surface in portal

[Pricing page for agency]
  └── Depends on: existing marketing page infrastructure (Next.js App Router, existing components)
  └── Complements: existing Calendly CTA pattern (already implemented)

[Stripe enforcement for web design tiers]
  └── Depends on: existing Stripe integration and billing tier system
  └── New: separate product/price IDs for web design plans vs review-only plans
```

---

## MVP Recommendation

For the first deployable version of the web design agency features, prioritize:

1. **Client portal with token auth** — the `/portal/[token]` URL that clients receive
2. **Revision ticket submission** — structured form, file attachment optional for V1
3. **Ticket status tracking** — three states, visible to both client and operator
4. **Monthly ticket counter** — "X of Y revisions remaining" with enforcement
5. **Operator ticket management** — list view across all clients, status updates
6. **Web design plan tier columns** — extend the businesses table for `web_plan_tier`, `tickets_per_month`, `tickets_used_this_month`

Defer to post-MVP:

- **Before/after change log with screenshots** — text-only change log is sufficient for V1
- **"Request a new page" upgrade prompt** — nice-to-have, not blocking
- **AI monthly summary** — high complexity, low V1 value
- **Operator all-clients KPI view expansion** — the existing businesses page is adequate for tracking

The landing page for the agency itself is a marketing concern, not a product feature —
it should be designed as a standalone marketing page (or a new section of the existing
marketing site) and is lower engineering priority than the core client portal experience.

---

## Confidence Assessment

| Area | Confidence | Source Basis |
|------|------------|-------------|
| Client portal table stakes | HIGH | Multiple portal platforms (ManyRequests, SPP.co/Wayfront, AgencyHandy) converge on same feature set |
| Revision ticket UX patterns | HIGH | Toggl research, ManyRequests documentation, general agency tooling research |
| Monthly limit enforcement pattern | MEDIUM | Inferred from ManyRequests "limit total tasks" feature; no direct documentation of exact UX |
| Anti-features rationale | HIGH | Based on target customer profile (non-technical home service owners) + solo operator constraints |
| Home services landing page needs | MEDIUM | Web search results on home services agency websites + general conversion research |
| Pricing tier market positioning | MEDIUM | Market research via web search; $199–$299 is plausible based on market data but unverified against direct competitors |

---

## Sources

- [Top 10 Client Portal Software for Design Agencies](https://www.agencyhandy.com/client-portal-for-design-agencies/)
- [Client Portal Best Practices 2025](https://www.agencyhandy.com/client-portal-best-practices/)
- [ManyRequests — Design Subscription Services](https://www.manyrequests.com/use-cases/design-subscription-services)
- [SPP.co / Wayfront Helpdesk Features](https://wayfront.com/features/helpdesk)
- [Toggl — Managing Design Change Requests](https://toggl.com/blog/design-change-requests)
- [Landing Page Best Practices 2025 — Fermat Commerce](https://www.fermatcommerce.com/post/landing-page-design)
- [High-Converting Landing Pages — Shopify](https://www.shopify.com/blog/high-converting-landing-pages)
- [Social Proof on Landing Pages — Landerlab](https://landerlab.io/blog/social-proof-examples)
- [Web Design Pricing Guide 2025](https://knapsackcreative.com/blog/web-design/web-design-pricing)
- [Home Services SEO — NextLeft](https://nextleft.com/blog/how-to-rank-1-the-complete-home-services-seo-guide-for-2025/)
- [Home Services Website Must-Haves — Local SEO Guide](https://homecomfortmarketing.com/local-seo-home-service-businesses-2025/)
- [Best CRM for Web Design Agencies](https://taskip.net/crm-for-web-design-agency/)
