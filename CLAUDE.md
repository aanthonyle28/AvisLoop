# CLAUDE.md — Review SaaS (Next.js + Supabase + Vercel)

## Project context
We are building a multi-tenant Review SaaS:
- Businesses (orgs) onboard
- Send review requests (email/SMS later)
- Ingest/store reviews + sources
- Render a public widget/embed + optional public page
- Analytics dashboard for org admins

If present, load:
- Current baton-pass: @docs/PROJECT_STATE.md
- Data model / RLS notes: @docs/DATA_MODEL.md
- Product decisions / ADRs: @docs/DECISIONS.md
- Scripts: @package.json

## Stack
- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth + Storage)
- Deploy: Vercel

## Repo rules (non-negotiable)
### Multi-tenancy & authorization
- Every DB read/write MUST be scoped to org_id (or workspace_id).
- Never rely on client-side filtering for auth.
- Supabase: RLS enabled on every tenant table. Policies must be explicit.
- Service role key is server-only; never expose to client.
- Any new table requires:
  1) RLS enabled
  2) Policies added
  3) A note added to docs/DATA_MODEL.md

### Next.js architecture rules
- Prefer Server Components by default; use Client Components only for interactivity.
- Secrets & privileged operations live in:
  - Server Components, Server Actions, or Route Handlers
- Keep the Supabase browser client isolated to client-safe usage.
- Keep server-side Supabase client in server-only modules.

### Logging & safety
- Never log secrets, tokens, or raw PII.
- Avoid storing unnecessary PII; if required, document fields and retention.

## Local commands (match the lockfile)
Core:
- Install: `pnpm i` / `npm i` / `yarn`
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck` (or `pnpm tsc --noEmit`)
- Test: `pnpm test` (if configured)

Supabase (if using local dev):
- Start local: `supabase start`
- Stop local: `supabase stop`
- Generate types: `supabase gen types typescript --local > src/lib/db.types.ts`
- New migration: `supabase migration new <name>`
- Apply migrations: `supabase db reset` (local) / `supabase db push` (if configured)

## Environment variables
Client-safe (NEXT_PUBLIC_):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Server-only:
- SUPABASE_SERVICE_ROLE_KEY
- (optional) STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- (optional) RESEND_API_KEY / POSTMARK_SERVER_TOKEN

## Definition of Done (DoD)
Before considering a change “done”:
- Lint + typecheck pass
- Any schema change includes RLS + policies
- Smoke test:
  - sign up / login
  - create org
  - create a “review request”
  - create/store a review (or simulated ingest)
  - widget/public page renders for org
- Update docs/PROJECT_STATE.md with:
  - what changed
  - current state
  - next step + open questions
