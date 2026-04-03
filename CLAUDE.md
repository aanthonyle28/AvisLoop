# CLAUDE.md — AvisLoop (Next.js + Supabase + Vercel)

## Project context

AvisLoop is a multi-service platform for home service businesses, combining **web design** and **reputation management** into one managed offering.

### Product lines (discriminated by `client_type` on businesses table)

| client_type | What it does |
|-------------|-------------|
| `web_design` | Managed website + client portal for revision tickets |
| `reputation` | Automated review campaigns (jobs → campaigns → reviews) |
| `both` | All features |

### Web Design (primary product line as of v4.0)
- Agency builds and maintains websites for home service businesses
- Clients submit revision requests via a public **client portal** (`/portal/[token]`)
- Intake briefs captured via public **intake form** (`/intake/[token]`)
- Subscription tiers: Basic ($199/mo, 2 revisions) and Advanced ($299/mo, 4 revisions)
- Optional Review Add-On ($99/mo)

### Reputation Management (V2 philosophy still applies)
- Jobs are the primary object, NOT customers
- Customers are created as a side effect of completing jobs
- The ONLY recurring user action is "Complete Job" (~10 seconds)
- Campaigns handle all messaging automatically
- Review funnel routes 4-5 stars to Google, 1-3 stars to private feedback

**Reference documents:**
- V2 Philosophy: @.planning/V1-TO-V2-PHILOSOPHY.md
- Baton-pass: @docs/PROJECT_STATE.md
- Data model / RLS: @docs/DATA_MODEL.md
- Product decisions / ADRs: @docs/DECISIONS.md
- UX Audit: @.planning/UX-AUDIT.md
- Scripts: @package.json

## Stack
- **Framework:** Next.js (App Router) + TypeScript
- **Database:** Supabase (Postgres + Auth + Storage)
- **Deploy:** Vercel
- **Styling:** Tailwind CSS + Radix UI primitives
- **Icons:** Phosphor Icons (primary), some legacy Lucide
- **Animation:** Framer Motion (v4 landing page), CSS transitions + FadeIn component (v3 pages)
- **Forms:** React Hook Form + Zod
- **Email:** Resend
- **SMS:** Twilio
- **Payments:** Stripe
- **AI:** OpenAI + Google AI SDK (message personalization)
- **Rate Limiting:** Upstash Redis

## Key architecture patterns

### Multi-tenancy & authorization (non-negotiable)
- Every DB read/write MUST be scoped to `business_id`
- RLS enabled on every tenant table with explicit policies
- Service role key is server-only; never expose to client
- New tables require: RLS enabled, policies added, note in docs/DATA_MODEL.md

### Multi-business resolution
- **Cookie-based:** `active_business_id` httpOnly cookie stores selected business
- `getActiveBusiness()` reads cookie → verifies ownership → falls back to first business with `.limit(1)` (not `.single()`)
- `switchBusiness()` server action sets cookie + `revalidatePath('/')`
- `getUserBusinesses()` fetches all businesses owned by user

### Caller-provides-businessId pattern
- All `lib/data/*.ts` functions accept explicit `businessId` parameter
- Callers (server components, server actions) resolve context via `getActiveBusiness()` and pass verified ID
- Data layer never resolves business context internally (eliminates PGRST116 crash risk)

### Pooled billing
- Send limits enforced at user level across all owned businesses
- `getPooledMonthlyUsage(userId)` aggregates usage across all businesses
- Prevents N businesses × plan limit loophole

### Public token routes (no auth required)
| Route | Purpose | Token source |
|-------|---------|-------------|
| `/r/[token]` | Review funnel | HMAC-signed |
| `/intake/[token]` | Design brief form | `businesses.intake_token` |
| `/portal/[token]` | Client revision portal | `web_projects.portal_token` |
| `/complete/[token]` | Technician job completion | DB or HMAC (TBD) |

These use service-role client to bypass RLS for token resolution.

### Next.js rules
- Server Components by default; Client Components only for interactivity
- Secrets & privileged operations in Server Components, Server Actions, or Route Handlers
- Supabase browser client isolated to client-safe usage
- Server-side Supabase client in server-only modules

### Logging & safety
- Never log secrets, tokens, or raw PII
- Avoid storing unnecessary PII; if required, document fields and retention

## Navigation structure

### Sidebar (desktop, 7 items)
1. Dashboard — KPI hub + welcome card
2. Jobs — V2 core action (Add Job button in sidebar footer)
3. Campaigns — Automation config
4. Analytics — Trends + insights
5. History — Send logs + filter
6. Feedback — 1-3 star private reviews
7. Tickets — Web design revision management

### Bottom nav (mobile, 4 items)
Dashboard, Jobs, Campaigns, History

### Settings (tabbed)
General, Templates, Services, Advanced, Customers, Billing, Web Design

## Database tables

### Reputation core
`businesses`, `customers`, `jobs`, `campaigns`, `campaign_touches`, `campaign_enrollments`, `message_templates`, `send_logs`, `customer_feedback`

### Web design (v4)
`web_projects`, `project_tickets`, `ticket_messages`

### Lead generation
`audit_reports`, `audit_leads`

Key columns on `businesses`:
- `client_type` — discriminator: `'reputation'` | `'web_design'` | `'both'`
- `intake_token` / `intake_data` — public intake form
- Agency metadata: `google_rating_start/current`, `monthly_fee`, `competitor_name`, etc.
- Custom service names: `custom_service_names TEXT[]` (display-only, max 10)

## API routes

| Route | Purpose |
|-------|---------|
| `/api/audit/*` | Google Places API reputation audit |
| `/api/cron/*` | Touch processing, conflict resolution |
| `/api/feedback/*` | 1-3 star feedback submission |
| `/api/intake/*` | Design brief + file upload |
| `/api/portal/*` | Portal lookup, ticket CRUD, file upload |
| `/api/review/*` | Review funnel token validation |
| `/api/tickets/*` | Ticket image uploads |
| `/api/webhooks/*` | Stripe, Resend, Twilio, Contacts |

## Landing pages

| Route | Version | Animation |
|-------|---------|-----------|
| `/` | v3 (current) | CSS transitions + FadeIn component |
| `/new` | v4 (Framer Motion) | `framer-motion` with stagger, spring, AnimatePresence |
| `/reputation` | Reputation-focused | CSS transitions |

Components live in `components/marketing/v3/` and `components/marketing/v4/`.

## Local commands
- Install: `pnpm i`
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- E2E tests: `pnpm test:e2e`

Supabase:
- Start local: `supabase start`
- Stop local: `supabase stop`
- Generate types: `supabase gen types typescript --local > src/lib/db.types.ts`
- New migration: `supabase migration new <name>`
- Apply: `supabase db reset` (local) / `supabase db push`

## Environment variables

Client-safe (NEXT_PUBLIC_):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Server-only:
- SUPABASE_SERVICE_ROLE_KEY
- REVIEW_TOKEN_SECRET (HMAC signing)
- CRON_SECRET (Vercel cron auth)
- UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID
- GOOGLE_PLACES_API_KEY (reputation audit)
- OPENAI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY (AI personalization)

## Definition of Done (DoD)

Before considering a change "done":
- `pnpm lint` + `pnpm typecheck` pass
- Any schema change includes RLS + policies + note in docs/DATA_MODEL.md
- For reputation features, V2 alignment check:
  - Does NOT require recurring manual user action (except job completion)
  - Does NOT treat customers as primary object
  - Does NOT encourage manual sending over campaigns
- Update docs/PROJECT_STATE.md with what changed, current state, next step

## Workflow shortcut: qwrap

```bash
qwrap () {
  set -euo pipefail
  pnpm lint
  pnpm typecheck
  "${EDITOR:-nano}" docs/PROJECT_STATE.md
  if git diff --quiet -- docs/PROJECT_STATE.md; then
    echo "Warning: docs/PROJECT_STATE.md has no changes."
  fi
  git add -A
  git commit -m "${1:-chore: wrap}"
  git push
}
```
o