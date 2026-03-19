# Architecture Patterns: Web Design Agency CRM + Client Portal + Ticket System

**Domain:** Web design agency tooling integrated into an existing reputation management SaaS
**Researched:** 2026-03-18
**Overall confidence:** HIGH — based on direct codebase inspection, not inference

---

## Executive Summary

AvisLoop already has most of the scaffolding needed for web design agency features. The existing `/businesses` page, `Business` model with agency metadata, cookie-based active-business resolver, token-based public routes (`/complete/[token]`, `/intake/[token]`, `/r/[token]`), and insert-only server action patterns can all be extended rather than replaced. The primary new additions are a `web_projects` table, a `project_tickets` table, and a `/portal/[token]` public route for client-facing access. The biggest architectural decision is whether web design clients live as `businesses` rows (extending the existing multi-tenant model) or as a separate `clients` table.

**Recommendation: Extend the `businesses` table.** Web design clients are structurally identical to reputation management clients — they are organizations the agency manages. Adding a `client_type` discriminator column (`'reputation' | 'web_design' | 'both'`) allows the existing `/businesses` page, `BusinessCard`, `BusinessDetailDrawer`, multi-business switcher, and RLS policies to keep working unchanged. A separate `clients` table would duplicate auth patterns, RLS, and data-layer functions for no architectural gain.

---

## Existing Architecture Map

### Route Groups

```
app/
├── (marketing)/          # avisloop.com — no auth, separate layout
│   ├── page.tsx          # Landing page (currently reputation-focused)
│   ├── pricing/
│   ├── audit/            # Lead-gen tool (audit_reports table)
│   └── [privacy, terms, sms-compliance]
│
├── (dashboard)/          # app.avisloop.com — auth-protected, shared AppShell
│   ├── layout.tsx        # BusinessSettingsProvider + AddJobProvider + AppShell
│   ├── dashboard/
│   ├── businesses/       # Agency client grid — THE integration point
│   ├── jobs/
│   ├── campaigns/
│   ├── settings/         # 7 tabs including Customers
│   └── [analytics, history, feedback, billing]
│
├── r/[token]/            # Public: review funnel (HMAC-signed token, 30-day expiry)
├── complete/[token]/     # Public: technician job form (DB token on businesses.form_token)
├── intake/[token]/       # Public: client intake form (DB token on businesses.intake_token)
└── onboarding/           # Auth-protected but pre-business wizard
```

### Data Layer Pattern (ARCH-002)

All `lib/data/` functions accept an explicit `businessId` parameter. Callers (Server Components, Server Actions) resolve the active business once via `getActiveBusiness()` and pass the verified ID downstream. This eliminates `.single()` crashes on zero-business users and makes multi-tenant queries predictable. New data functions for web design features must follow this same caller-provides-businessId pattern.

### Token-Based Public Routes

Three patterns exist, all using the service-role client to bypass RLS:

| Route | Token type | Token location | Revocable |
|-------|-----------|----------------|-----------|
| `/r/[token]` | HMAC-signed JWT (30-day expiry) | URL, stateless | Yes — token expires |
| `/complete/[token]` | Random DB token (192-bit base64url) | `businesses.form_token` | Yes — regenerate resets URL |
| `/intake/[token]` | Random DB token (192-bit base64url) | `businesses.intake_token` | Yes — regenerate resets URL |

The client portal uses the **DB token pattern** (same as `/complete/` and `/intake/`). A persistent token stored on the web project row gives clients a stable bookmarkable URL. HMAC tokens are wrong here because portals should not expire.

### Multi-Tenancy RLS Pattern

Every tenant table has:
- `business_id UUID NOT NULL REFERENCES businesses(id)`
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Policy: `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())`

The `businesses` table itself is scoped via `WHERE user_id = auth.uid()`. New tables (`web_projects`, `project_tickets`, `ticket_messages`) must follow the same pattern. This is non-negotiable per `CLAUDE.md`.

### Sidebar Navigation (current)

```typescript
const mainNav = [
  { icon: House,                label: 'Dashboard',  href: '/dashboard' },
  { icon: Briefcase,            label: 'Jobs',       href: '/jobs' },
  { icon: Megaphone,            label: 'Campaigns',  href: '/campaigns' },
  { icon: ChartBar,             label: 'Analytics',  href: '/analytics' },
  { icon: ClockCounterClockwise,label: 'History',    href: '/history' },
  { icon: ChatCircleText,       label: 'Feedback',   href: '/feedback' },
]
```

`/businesses` is NOT in mainNav — it's accessible via the sidebar footer's "Add Business" link and directly via URL.

---

## Recommended Architecture

### Component Boundary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  app.avisloop.com (dashboard)                                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ /businesses (existing page — extend, don't replace)      │   │
│  │   BusinessCard → shows client_type badge                 │   │
│  │   BusinessDetailDrawer → tabs: Overview | Web Project    │   │
│  │   [Add Business] → onboarding wizard (existing)          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ /projects (NEW dashboard page — web design CRM)          │   │
│  │   ProjectsClient                                         │   │
│  │   ├── ProjectCard grid (status, domain, client, tier)    │   │
│  │   ├── ProjectDetailDrawer (info, tickets, notes)         │   │
│  │   └── [Add Project] → ProjectWizard modal                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ /projects/[id]/tickets (NEW — ticket management)         │   │
│  │   TicketList with status filters                         │   │
│  │   TicketDetailDrawer (thread, file links, status)        │   │
│  │   NewTicketForm (agency-created tickets)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Public routes (no auth)                                        │
│                                                                 │
│  /portal/[token]         ← NEW — client-facing portal          │
│    ├── Project status overview                                  │
│    ├── Open ticket list                                         │
│    ├── [Submit Revision Request] → PortalTicketForm             │
│    └── File upload to Supabase Storage                          │
│                                                                 │
│  /intake/[token]         ← EXISTING (client intake form)        │
│  /complete/[token]       ← EXISTING (job completion form)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  avisloop.com (marketing)                                       │
│                                                                 │
│  / (homepage)            ← RESTRUCTURE for web design agency   │
│  /reputation             ← NEW route, existing content moved   │
│  /pricing                ← Update for dual-service pricing      │
└─────────────────────────────────────────────────────────────────┘
```

---

## New Database Tables

### businesses table extension

One new column discriminates between client types. All existing rows default to `'reputation'` — no data migration needed.

```sql
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS client_type TEXT NOT NULL DEFAULT 'reputation'
    CHECK (client_type IN ('reputation', 'web_design', 'both'));
```

Note: existing agency metadata columns (`competitor_name`, `competitor_review_count`, `google_rating_start`, etc.) remain on the table. They simply won't be displayed for `web_design` clients. Removing them would require a migration and type changes — not worth it. Hide via UI logic.

### Table: web_projects

One project per client is the initial model. Schema supports multiple projects per client via the 1:many relationship.

```sql
CREATE TABLE public.web_projects (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id             UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Project identity
  domain                  TEXT,                 -- e.g. "plumbingpros.com"
  vercel_project_id       TEXT,                 -- optional Vercel reference
  status                  TEXT NOT NULL DEFAULT 'discovery'
    CHECK (status IN (
      'discovery', 'design', 'development', 'review', 'live', 'maintenance', 'paused', 'cancelled'
    )),

  -- Subscription
  subscription_tier       TEXT
    CHECK (subscription_tier IN ('basic', 'growth', 'pro') OR subscription_tier IS NULL),
  subscription_started_at DATE,
  subscription_monthly_fee NUMERIC(10,2),
  next_billing_date       DATE,

  -- Client contact (may differ from business owner)
  client_name             TEXT,
  client_email            TEXT,
  client_phone            TEXT,

  -- Project dates
  kickoff_date            DATE,
  target_launch_date      DATE,
  launched_at             TIMESTAMPTZ,          -- when status moved to 'live'

  -- Portal access (same pattern as businesses.form_token / intake_token)
  portal_token            TEXT UNIQUE,

  -- Internal notes
  project_notes           TEXT,

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.web_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "web_projects_owner_all" ON public.web_projects
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE INDEX idx_web_projects_business_id ON public.web_projects(business_id);
CREATE UNIQUE INDEX idx_web_projects_portal_token
  ON public.web_projects(portal_token) WHERE portal_token IS NOT NULL;
```

### Table: project_tickets

Revision requests and support tickets. Submitted by clients via portal or by agency internally.

```sql
CREATE TABLE public.project_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.web_projects(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  -- business_id denormalized for RLS simplicity (avoids join in policy)

  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'waiting_client', 'resolved', 'closed')),
  priority        TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source          TEXT NOT NULL DEFAULT 'agency'
    CHECK (source IN ('agency', 'client_portal')),

  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes  TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_tickets_owner_all" ON public.project_tickets
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Client portal inserts via service-role after validating portal_token server-side.
-- No anon INSERT policy needed here — the Route Handler uses service-role client.

CREATE INDEX idx_project_tickets_project_id ON public.project_tickets(project_id);
CREATE INDEX idx_project_tickets_business_id ON public.project_tickets(business_id);
CREATE INDEX idx_project_tickets_open
  ON public.project_tickets(project_id, created_at DESC)
  WHERE status IN ('open', 'in_progress', 'waiting_client');
```

### Table: ticket_messages

Threaded reply log per ticket. Supports both agency and client messages.

```sql
CREATE TABLE public.ticket_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       UUID NOT NULL REFERENCES public.project_tickets(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  -- business_id denormalized again for RLS without a multi-hop join

  author_type     TEXT NOT NULL
    CHECK (author_type IN ('agency', 'client')),
  author_name     TEXT,        -- display name: "Sarah @ AvisLoop" or client name
  body            TEXT NOT NULL,
  attachment_urls TEXT[],      -- Supabase Storage public URLs

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_messages_owner_all" ON public.ticket_messages
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Portal writes go through service-role (Route Handler), no anon policy needed.

CREATE INDEX idx_ticket_messages_ticket_id
  ON public.ticket_messages(ticket_id, created_at);
```

**Why denormalize `business_id` onto `project_tickets` and `ticket_messages`?**

The alternative is a two-hop join in RLS policies: `ticket_id IN (SELECT id FROM project_tickets WHERE business_id IN (...))`. Postgres evaluates this per-row and it can be slow under load. With `business_id` denormalized, both tables use the same single-hop RLS pattern as every other table in the app. The tradeoff is one extra FK column and the constraint of setting it correctly at insert time.

---

## Component Boundaries

### Modified Components (existing — extend, not rewrite)

| Component | Current | Extension |
|-----------|---------|-----------|
| `BusinessCard` (`components/businesses/business-card.tsx`) | Shows Google rating, review delta, monthly fee | Add `client_type` badge. For `web_design` clients, show domain + project status instead of Google rating. Conditionally render via `client_type`. |
| `BusinessDetailDrawer` (`components/businesses/business-detail-drawer.tsx`) | Shows agency metadata in a single view | Add tabbed layout: "Overview" (existing fields) + "Web Project" tab (loads web_projects row for this business). Only show "Web Project" tab if `client_type !== 'reputation'`. |
| `BusinessesClient` (`components/businesses/businesses-client.tsx`) | Grid + single drawer | No structural change. Card display adapts via `client_type` prop. |
| `sidebar.tsx` mainNav | 6 items | Add "Projects" nav item (icon: `Laptop` or `Globe` from Phosphor). |
| `middleware.ts` APP_ROUTES | Protected path list | Add `/projects` to APP_ROUTES. `/portal` stays out of APP_ROUTES (it is public). |
| `(dashboard)/layout.tsx` | Fetches active business + service settings + dashboard badge | No change needed. The Projects page fetches its own data. |

### New Dashboard Components

| Component | File | Purpose |
|-----------|------|---------|
| `ProjectsClient` | `components/projects/projects-client.tsx` | Client component for /projects page — grid + drawer state |
| `ProjectCard` | `components/projects/project-card.tsx` | Card: status badge, domain, client name, subscription tier, open ticket count |
| `ProjectDetailDrawer` | `components/projects/project-detail-drawer.tsx` | Sheet: project info, recent tickets, notes, generate portal link |
| `ProjectWizard` | `components/projects/project-wizard.tsx` | Multi-step modal: business selector, domain, status, subscription tier, client contact. Reuses the 3-step modal pattern from `CreateBusinessWizard`. |
| `TicketList` | `components/tickets/ticket-list.tsx` | Filterable ticket list with status filter (Radix Select, matching History page pattern) and priority badges |
| `TicketDetailDrawer` | `components/tickets/ticket-detail-drawer.tsx` | Sheet: message thread (chronological), reply form, file links, status/priority controls |
| `NewTicketForm` | `components/tickets/new-ticket-form.tsx` | Sheet form for agency-created tickets |

### New Public Components

| Component | File | Purpose |
|-----------|------|---------|
| `ClientPortal` | `components/portal/client-portal.tsx` | Main portal view: project status, open ticket list, submit button |
| `PortalTicketForm` | `components/portal/portal-ticket-form.tsx` | Public form: title, description, file upload to Supabase Storage |
| `PortalTicketThread` | `components/portal/portal-ticket-thread.tsx` | Read-only message thread view for the client |

### New Routes

| Route | Auth | File |
|-------|------|------|
| `/projects` | Required | `app/(dashboard)/projects/page.tsx` |
| `/projects/[id]/tickets` | Required | `app/(dashboard)/projects/[id]/tickets/page.tsx` |
| `/portal/[token]` | None | `app/portal/[token]/page.tsx` |

### New Data Functions (`lib/data/web-projects.ts`)

All follow caller-provides-businessId pattern:

```typescript
getWebProjectsByBusiness(businessId: string): Promise<WebProject[]>
getWebProject(projectId: string, businessId: string): Promise<WebProject | null>
getWebProjectByPortalToken(token: string): Promise<WebProject | null>  // service-role only

getProjectTickets(projectId: string, businessId: string, filters?: TicketFilters): Promise<ProjectTicket[]>
getTicketWithMessages(ticketId: string, businessId: string): Promise<{ ticket: ProjectTicket; messages: TicketMessage[] } | null>
getOpenTicketCounts(businessIds: string[]): Promise<Record<string, number>>  // for ProjectCard badges
```

### New Server Actions

```typescript
// lib/actions/web-project.ts
createWebProject(businessId: string, input: WebProjectInput): Promise<{ id: string } | { error: string }>
updateWebProject(projectId: string, businessId: string, input: Partial<WebProjectInput>)
updateProjectNotes(projectId: string, businessId: string, notes: string)  // fire-and-forget, no revalidate
generatePortalToken(projectId: string, businessId: string): Promise<{ token: string } | { error: string }>
// ^^ exact pattern as generateFormToken() in lib/actions/form-token.ts

// lib/actions/ticket.ts
createTicket(projectId: string, businessId: string, input: TicketInput)
updateTicketStatus(ticketId: string, businessId: string, status: TicketStatus)
addAgencyMessage(ticketId: string, businessId: string, body: string, attachmentUrls?: string[])
```

### New Route Handler (Portal Ticket Submission)

```typescript
// app/api/portal/tickets/route.ts
// POST — validates portal_token server-side using service-role client, then inserts ticket + first message.
// Uses service-role to bypass RLS (no session available on public portal).
```

The portal does NOT use a Server Action for submission because Server Actions require the same-origin cookie session. The portal is unauthenticated, so a Route Handler is the correct approach — matching the pattern of other public API routes in the app (`app/api/`).

---

## Data Flow

### Agency Creates a Web Design Client and Project

```
1. Agency opens /businesses
2. Clicks "Add Business" → existing onboarding wizard
3. At business basics step: selects client_type = 'web_design'
4. Wizard creates businesses row (client_type = 'web_design')
5. /businesses shows new card with "Web Design" badge
6. Agency clicks card → BusinessDetailDrawer
7. "Web Project" tab → "Create Project" button
8. ProjectWizard modal: domain, status, tier, client contact, kickoff date
9. Creates web_projects row linked to business_id
10. generatePortalToken() stores token on web_projects.portal_token
11. Portal URL: /portal/[token] — agency copies, shares with client
```

### Client Submits Revision Request via Portal

```
1. Client visits /portal/[token] (unauthenticated)
2. Server Component resolves project via portal_token using service-role client
3. Renders ClientPortal: project status summary, open tickets
4. Client clicks "Submit Revision Request"
5. PortalTicketForm opens
6. Client fills: title, description, optional file upload
7. File upload: client-side to Supabase Storage bucket 'ticket-attachments'
   Path: ticket-attachments/{project_id}/{timestamp}/{filename}
   Bucket has anon upload policy (size-limited, filetype-restricted)
8. Form POSTs to /api/portal/tickets with portal_token + form data + attachment URLs
9. Route Handler:
   a. Validates portal_token → resolves project_id + business_id via service-role
   b. Inserts project_tickets row (source = 'client_portal', business_id set from resolved project)
   c. Inserts ticket_messages row with client's body + attachment URLs
   d. Optional: sends email notification to agency via Resend
10. Client sees confirmation
11. Agency sees new ticket in /projects/[id]/tickets with 'client_portal' source badge
```

### Agency Manages a Ticket

```
1. Agency opens /projects/[id]/tickets
2. Sees TicketList — filter by status (open, in_progress, waiting_client, resolved, closed)
3. Clicks ticket → TicketDetailDrawer opens
4. Reads message thread (client message first, then agency replies)
5. Types reply in reply form → addAgencyMessage() server action
6. Changes status via dropdown → updateTicketStatus() server action
7. Client sees updated status + new message on next portal load
   (no real-time — portal loads fresh on each visit)
```

---

## Landing Page Restructure

### Current State

`app/(marketing)/page.tsx` is reputation-focused: "Managed Google Review Service for Home Service Businesses." All marketing components are in `components/marketing/v2/`.

### New Structure

The homepage pivots to web design agency services. Reputation management content moves to `/reputation`.

```
app/(marketing)/
├── page.tsx            ← Web design agency homepage (new components)
├── reputation/
│   └── page.tsx        ← Existing homepage content moved here (minimal change)
├── pricing/
│   └── page.tsx        ← Tabbed: web design pricing + reputation pricing
├── audit/              ← Keep unchanged (reputation lead-gen)
└── [privacy, terms, sms-compliance]

components/marketing/
├── v2/                 ← KEEP UNCHANGED — becomes /reputation content
└── v3/                 ← NEW — web design agency homepage components
    ├── hero-webdesign.tsx
    ├── services-webdesign.tsx
    ├── process-section.tsx
    ├── portfolio-strip.tsx (optional)
    └── pricing-webdesign.tsx
```

**Do not modify or delete `components/marketing/v2/`.** Those components are simply imported into the new `/reputation/page.tsx` rather than `page.tsx`.

Migration path for SEO: add `<link rel="canonical" href="/reputation">` to the new `/reputation` page to consolidate any existing link equity if needed. The existing `page.tsx` URL (`/`) changes meaning but not location — the homepage remains `/`.

---

## Supabase Storage Setup

One new bucket is required:

```
Bucket name: ticket-attachments
Public read: YES (URLs are included in ticket_messages.attachment_urls for display)
Anon upload: YES (clients upload without auth)
Max file size: 10MB
Allowed MIME types: image/*, application/pdf, text/plain, video/mp4
```

RLS-equivalent restriction is handled by the Route Handler: the handler validates the portal_token before the upload path is constructed. The path includes `project_id` so uploads are namespaced. This is the same "security by obscurity on path + server-side validation" approach used by the rest of the app's public routes.

---

## Build Order (Recommended Phase Sequence)

Dependencies flow from schema outward: data model → data layer → dashboard UI → public portal → marketing.

### Phase A: Data Model + Business Extension

1. Migration: add `client_type` to `businesses`
2. Migration: create `web_projects` table + RLS
3. Migration: create `project_tickets` table + RLS
4. Migration: create `ticket_messages` table + RLS
5. Update `Business` type in `lib/types/database.ts` to include `client_type`
6. Add `WebProject`, `ProjectTicket`, `TicketMessage` TypeScript types
7. Add `client_type` field to onboarding wizard step 1 (business basics)

**Why first:** Every downstream component depends on these tables existing. Onboarding wizard change is also here because it controls how new businesses get `client_type` set.

### Phase B: Web Projects CRM (Dashboard)

1. `lib/data/web-projects.ts` — read functions (getWebProjectsByBusiness, getWebProject, getOpenTicketCounts)
2. `lib/actions/web-project.ts` — write actions (createWebProject, updateWebProject, updateProjectNotes, generatePortalToken)
3. `components/projects/` — ProjectCard, ProjectDetailDrawer, ProjectWizard
4. `app/(dashboard)/projects/page.tsx` + `loading.tsx`
5. Update `sidebar.tsx` mainNav to add Projects item
6. Update `middleware.ts` APP_ROUTES to add `/projects`
7. Update `BusinessCard` to show `client_type` badge and conditional metadata display
8. Add "Web Project" tab to `BusinessDetailDrawer`

**Why second:** Agency needs to create and manage projects before clients can access anything. The portal token is generated here.

### Phase C: Ticket System (Dashboard)

1. `lib/data/tickets.ts` — getProjectTickets, getTicketWithMessages
2. `lib/actions/ticket.ts` — createTicket, updateTicketStatus, addAgencyMessage
3. `components/tickets/` — TicketList, TicketDetailDrawer, NewTicketForm
4. `app/(dashboard)/projects/[id]/tickets/page.tsx` + `loading.tsx`
5. Add open ticket count badge to ProjectCard (uses getOpenTicketCounts from Phase B)

**Why third:** Ticket table must exist and the dashboard UI must work before the client portal can submit into it.

### Phase D: Client Portal (Public)

1. Supabase Storage bucket `ticket-attachments` (configure in dashboard)
2. `app/portal/[token]/page.tsx` — Server Component, service-role token validation
3. `components/portal/` — ClientPortal, PortalTicketForm, PortalTicketThread
4. `app/api/portal/tickets/route.ts` — Route Handler for portal ticket submission
5. Optional: Resend email notification to agency on new portal ticket

**Why fourth:** Portal depends on the ticket tables (Phase A), portal_token generation (Phase B), and optionally reads existing tickets (Phase C).

### Phase E: Landing Page Restructure

1. Move existing `app/(marketing)/page.tsx` content to `app/(marketing)/reputation/page.tsx` (copy imports, adjust metadata)
2. Build `components/marketing/v3/` web design components
3. Replace `app/(marketing)/page.tsx` with web design homepage
4. Update `/pricing` page for dual-service presentation
5. Update meta tags, sitemaps, OG images

**Why last:** Marketing depends on nothing from the app feature set. Doing it last means web design features are proven and can be accurately described in copy. No other phase is blocked by marketing.

---

## Integration Points: What Touches What

| Existing Component | How New Features Hook In |
|-------------------|--------------------------|
| `getActiveBusiness()` | Unchanged. `/projects` page calls it to get `businessId`, passes to data functions. |
| `getUserBusinessesWithMetadata()` | Returns `client_type` once column is added. `BusinessCard` reads it. |
| `BusinessSettingsProvider` | No change needed. Projects page has its own data fetching. |
| `onboarding wizard` step 1 | Add `client_type` selector (reputation / web design / both). Defaults to 'reputation' for backward compat. |
| `CreateBusinessWizard` | Same addition — `client_type` at step 1. |
| Cookie-based business resolver | Unchanged. Projects are scoped to `businessId` from active business. |
| `form_token.ts` action | `generatePortalToken()` is a copy-paste of `generateFormToken()` with `web_projects.portal_token` as target. |
| Rate limiting (`@upstash/ratelimit`) | Apply to `/api/portal/tickets` route handler — same pattern as existing `/api/send`, `/api/cron` routes. |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate `clients` Table

**What it is:** A new `clients` table for web design clients, separate from `businesses`.

**Why bad:** Duplicates the entire auth/RLS/multi-tenant pattern. Doubles the data layer. Breaks the existing business switcher, `/businesses` page, and all queries scoped to `businesses WHERE user_id = auth.uid()`. Every new table (`web_projects`, `project_tickets`) would need a different FK chain.

**Instead:** `client_type` column on `businesses`. Web design clients are businesses with `client_type = 'web_design'`. One system, one RLS pattern.

### Anti-Pattern 2: Real-Time Portal Updates

**What it is:** WebSocket or Supabase Realtime subscription in the client portal so clients see ticket replies instantly.

**Why bad:** Adds Supabase Realtime complexity to a public unauthenticated page. Requires either a special anon Realtime channel (security implications) or service-role subscription on the client (never do this). The use case does not warrant it.

**Instead:** Server-rendered portal page. Client refreshes to see updates. If real-time feedback becomes critical, add it as a progressive enhancement with a lightweight poll.

### Anti-Pattern 3: HMAC Tokens for Portal

**What it is:** Using HMAC-signed tokens (like `/r/[token]`) for the portal URL.

**Why bad:** HMAC tokens encode expiry. Portal URLs must be permanent bookmarks clients can return to for weeks. An expiring link breaks the UX when clients access the portal from a saved email.

**Instead:** DB tokens (like `form_token`, `intake_token`) — persistent until regenerated by the agency.

### Anti-Pattern 4: Mixing Billing Models

**What it is:** Running web design subscription billing through `getPooledMonthlyUsage()` send-count billing.

**Why bad:** Email/SMS send count is irrelevant to web design subscription tiers. Pooled usage billing tracks message sends, not monthly retainer fees.

**Instead:** Web design subscription state lives on `web_projects.subscription_tier` and `web_projects.subscription_monthly_fee`. Billing enforcement for web design is a separate concern. The existing pooled usage function stays scoped to reputation management sends. If Stripe is needed for web design subscriptions, create a separate Stripe product/price in Phase E or later.

### Anti-Pattern 5: Portal Under the Dashboard Route Group

**What it is:** Placing the portal at `app/(dashboard)/portal/[token]/` instead of `app/portal/[token]/`.

**Why bad:** `app/(dashboard)/layout.tsx` calls `getActiveBusiness()` which calls `supabase.auth.getUser()`. Unauthenticated portal visitors have no session — this returns null — and the layout redirects to `/onboarding`, which redirects to `/login`. Clients cannot access the portal at all.

**Instead:** `app/portal/[token]/page.tsx` at root level, just like `/r/[token]`, `/complete/[token]`, `/intake/[token]`. The middleware only protects paths listed in `APP_ROUTES` — `/portal` is intentionally absent from that list.

### Anti-Pattern 6: Eager `web_projects` Load in Root Layout

**What it is:** Fetching project counts or project data in `app/(dashboard)/layout.tsx` to populate a sidebar badge.

**Why bad:** The root dashboard layout runs on every page navigation. Adding a web_projects query here adds latency for all pages, including Jobs, Campaigns, and Feedback — which have no interest in projects.

**Instead:** Fetch project data only in `app/(dashboard)/projects/page.tsx` and its child routes. If a Projects nav badge is needed, compute it as a lightweight count query scoped to the projects page layout, not the root layout.

---

## Scalability Notes

| Concern | Current scale | Next threshold | Mitigation |
|---------|--------------|----------------|------------|
| `/businesses` query | Fetches all rows | ~50+ clients | Add pagination to `getUserBusinessesWithMetadata()` |
| Open ticket count query | One query per project card | ~20+ projects | Use `getOpenTicketCounts(businessIds[])` with a single GROUP BY query |
| Ticket message thread | Fetched on drawer open | ~100+ messages per ticket | Paginate or show last 50 messages by default |
| Portal token lookup | O(1) via unique index | Scales indefinitely | Already indexed |
| Storage attachments | Per-project paths | Scales with Storage | Supabase Storage scales horizontally |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Business model extension | HIGH | Direct inspection of Business type, migrations, RLS patterns |
| Token pattern | HIGH | Inspected all three existing token routes |
| Route group structure | HIGH | Inspected middleware, layout files, public route files |
| Data layer pattern | HIGH | Inspected lib/data/ and DECISIONS.md ARCH-001/002 |
| Ticket message RLS | MEDIUM | Pattern is sound but denormalized business_id is a design choice that could go either way |
| Supabase Storage policy | MEDIUM | Storage bucket setup not currently used in app; policy syntax needs verification against Supabase docs |
| Landing page SEO impact | MEDIUM | Moving existing content to /reputation may affect ranking; canonical tag approach is standard practice |

---

## Sources

Direct codebase inspection:
- `app/(dashboard)/businesses/page.tsx`
- `components/businesses/businesses-client.tsx`
- `components/businesses/business-detail-drawer.tsx`
- `lib/data/active-business.ts`
- `lib/data/businesses.ts`
- `lib/types/database.ts`
- `lib/actions/form-token.ts`
- `lib/actions/create-additional-business.ts`
- `middleware.ts`
- `app/(dashboard)/layout.tsx`
- `components/layout/sidebar.tsx`
- `app/complete/[token]/page.tsx`
- `app/intake/[token]/page.tsx`
- `app/r/[token]/page.tsx`
- `app/(marketing)/page.tsx`
- `supabase/migrations/20260227000300_add_agency_metadata.sql`
- `supabase/migrations/20260315000100_add_intake_token.sql`
- `supabase/migrations/20260306000100_audit_tables.sql`
- `docs/DECISIONS.md` (ARCH-001 through ARCH-004)
- `docs/DATA_MODEL.md`
