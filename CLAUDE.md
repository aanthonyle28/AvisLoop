# CLAUDE.md — Review SaaS (Next.js + Supabase + Vercel)

## Project context
We are building AvisLoop V2 — an automation-first reputation platform for home service businesses.

**V2 Core Philosophy (IMPORTANT):**
- Jobs are the primary object, NOT customers
- Customers are created as a side effect of completing jobs
- There is no "Add Customer" in normal workflow
- The ONLY recurring user action is "Complete Job" (~10 seconds)
- Campaigns handle all messaging automatically
- Users set up once, system runs forever

**What AvisLoop does:**
- Businesses complete jobs → system auto-enrolls in campaigns
- Multi-touch email/SMS sequences sent automatically
- Review funnel routes 4-5 stars to Google, 1-3 stars to private feedback
- Analytics dashboard for insights

**Reference documents (load these):**
- **V2 Philosophy (CRITICAL):** @.planning/V1-TO-V2-PHILOSOPHY.md
- Current baton-pass: @docs/PROJECT_STATE.md
- Data model / RLS notes: @docs/DATA_MODEL.md
- Product decisions / ADRs: @docs/DECISIONS.md
- UX Audit: @.planning/UX-AUDIT.md
- Scripts: @package.json

## V2 Philosophy Maintenance
When making changes that affect core product direction, UPDATE `.planning/V1-TO-V2-PHILOSOPHY.md`:
- New features: Add to appropriate section, verify V2 alignment
- UI changes: Ensure they don't reintroduce V1 patterns
- Terminology: Keep consistent with V2 language
- If a decision contradicts V2, document WHY in the philosophy doc

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
Before considering a change "done":
- Lint + typecheck pass
- Any schema change includes RLS + policies
- **V2 alignment check:**
  - Does NOT require recurring manual user action (except job completion)
  - Does NOT treat customers as primary object
  - Does NOT encourage manual sending over campaigns
  - If introducing V1 patterns, document justification
- Smoke test:
  - sign up / login
  - create business
  - complete a job (creates customer automatically)
  - job enrolls in campaign
  - review funnel works (rating → Google or feedback)
- Update docs/PROJECT_STATE.md with:
  - what changed
  - current state
  - next step + open questions
- If core product changes: update .planning/V1-TO-V2-PHILOSOPHY.md

## Workflow shortcut: qwrap

`qwrap` runs the “wrap-up” sequence:
1) `pnpm lint`
2) `pnpm typecheck`
3) Open `docs/PROJECT_STATE.md` (baton-pass update)
4) `git add -A && git commit -m "..." && git push`

### Setup (zsh/bash)
Add to `~/.zshrc` or `~/.bashrc`:

```bash
qwrap () {
  set -euo pipefail

  pnpm lint
  pnpm typecheck

  "${EDITOR:-nano}" docs/PROJECT_STATE.md

  if git diff --quiet -- docs/PROJECT_STATE.md; then
    echo "⚠️  Warning: docs/PROJECT_STATE.md has no changes."
  fi

  git add -A
  git commit -m "${1:-chore: wrap}"
  git push
}
