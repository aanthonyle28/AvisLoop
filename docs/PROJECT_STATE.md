# PROJECT_STATE

## Now
- v1.0-v1.4 milestones complete (shipped through 2026-02-02)
- **v2.0 Review Follow-Up System COMPLETE** (all phases verified 2026-02-18)
- **v2.5 UI/UX Redesign COMPLETE** (Phases 33-39 all verified 2026-02-20)
- **Security Review COMPLETE** (2026-02-22) — 26 findings, all Critical/High/Medium resolved, Low quick wins done
- Phase 21 (SMS Foundation) 7/8 plans complete, blocked on Twilio A2P for final verification
- Twilio A2P: Brand approved, campaign pending
- 192 plans complete across all milestones

## Last session summary (Security Review + Hardening)

### Full Codebase Security Audit
- Audited 304 files, 12 tables, 43 RLS policies
- 26 findings: 3 Critical, 7 High, 9 Medium, 7 Low
- See `CODE-REVIEW-FINDINGS.md` for full report

### Critical Fixes (C-1, C-2, C-3)
- **C-1**: SMS retry cron auth bypass — fail-closed pattern applied (was open if CRON_SECRET unset)
- **C-2**: Twilio webhook handlers switched from session-based to service-role Supabase client
- **C-3**: Review token now uses HMAC-SHA256 signature with timing-safe comparison (was forgeable)

### High Fixes (H-2, H-4, H-5, H-7)
- **H-2**: Rate limiting (20/min per IP) added to `/api/review/rate` and `/api/feedback`
- **H-4**: `import 'server-only'` added to all 4 sensitive modules (service-role, stripe, twilio, resend)
- **H-5**: Service-role clients moved inside request handlers (was module-scope)
- **H-7**: Resend webhook placeholder key replaced with proper env var check
- **H-1, H-6**: H-1 already resolved (no INSERT policy exists); H-6 requires manual Supabase Dashboard action

### Medium Fixes (M-1, M-3, M-4, M-8)
- **M-1**: Onboarding step clamp already correct (1-3)
- **M-2**: Status badge WCAG contrast already passes AA (5.5:1 to 9.3:1)
- **M-3**: send_count race condition resolved — code already used atomic RPC, RPC now exists
- **M-4**: Auth callback open redirect — proper URL origin validation
- **M-8**: UPDATE policies already have WITH CHECK clauses

### Database Migrations (5)
- `add_missing_rpc_functions`: Created `claim_due_scheduled_sends`, `recover_stuck_scheduled_sends`, `increment_customer_send_count`
- `add_notes_column_to_customers`: Added missing `notes` TEXT column
- `add_missing_fk_indexes`: 4 FK indexes on businesses, customer_feedback, customers, scheduled_sends
- `fix_function_search_path_and_rls_initplan`: Set search_path='' on all RPCs + wrapped auth.uid() in (SELECT) for 3 RLS policies
- `drop_legacy_contact_id_from_send_logs`: Dropped dual FK — removed `contact_id` column + FK constraint (all code uses `customer_id`)

### Code Hardening
- `lib/rate-limit.ts`: Added `publicRatelimit` (20/min per IP) for unauthenticated endpoints
- `lib/data/customer.ts`: Added `.limit(500)` to unbounded autocomplete query
- `next.config.ts`: Added 6 security headers (X-Frame-Options DENY, HSTS, nosniff, Referrer-Policy, Permissions-Policy, DNS-Prefetch)
- Supabase security advisor: all warnings cleared except leaked password protection (manual)

### Additional Medium/Low Fixes (Session 2)
- **M-5**: Auth rate limiting (5/min per IP) added to signUp, signIn, resetPassword via Upstash Redis
- **M-7**: Stripe webhook in-memory rate limiting replaced with Upstash Redis-based `checkWebhookRateLimit`
- **L-4**: All raw `error.message` returns in server actions replaced with generic user-facing messages (customer.ts, job.ts, send.ts) — internal errors logged server-side only
- **L-7**: Review token logging already adequate — IDs truncated with `.slice(0,8)`

### Final Fixes (Session 3)
- **L-3**: Dropped legacy `contact_id` column from send_logs (was dual FK to customers). Updated cron processor + SendLogDetail type.
- **L-5**: `deleteAccount` now requires password re-authentication for email/password users. OAuth-only users skip (no password). Dialog UI updated with password field.

### Remaining (manual only)
- **H-6**: Skipped — leaked password protection (user decision)
- Enable Supabase password requirements in Dashboard > Auth > Providers > Email

### Verification
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- Supabase security advisor: clean (1 manual-only item remaining)

## What's been built
- **Auth**: Sign up, sign in, sign out, password reset, session persistence, PasswordInput with strength checklist, Google OAuth
- **Business**: Business profile form, message template management (email + SMS)
- **Customers**: Full CRUD, bulk operations, CSV import, tags, phone validation, SMS consent tracking (moved to Settings tab)
- **Jobs**: Jobs table with service types, completion status, timing defaults, scheduled->completed workflow, inline actions, detail drawer, campaign selector with one-off option
- **Campaigns**: Multi-touch campaigns, presets, enrollment, touch processing, analytics, creation dialog, edit sheet panel, delete with enrollment reassignment, QuickSendModal for one-off sends
- **Review Funnel**: Pre-qualification page, HMAC-signed tokens, rating capture, Google redirect, private feedback form
- **Security**: HMAC review tokens, server-only guards, rate limiting (send/webhook/public/auth), SQL injection protection, pagination, bulk limits, middleware route protection, security headers, RLS on all tables with WITH CHECK, generic error messages (no internal leaks)
- **History**: Send history with date filtering, search, status badges, bulk resend for failed messages
- **Billing**: Stripe integration, tier enforcement, usage tracking
- **Onboarding**: 3-step setup wizard (business setup, campaign preset, SMS consent), WelcomeCard first-run experience, post-onboarding checklist (warm amber pill+drawer), first-visit tooltip hints
- **Marketing**: V2 landing page (automation-first copy), pricing page, responsive design, mobile nav
- **Design System**: Warm palette (cream/amber/soft blue), semantic tokens (warning/success/info/error), card CVA variants, InteractiveCard arrow affordance, page padding normalization
- **Dashboard**: Two-tier KPIs with greeting, RecentCampaignActivity strip, ReadyToSendQueue with context-aware actions, AttentionAlerts, WelcomeCard
- **Polish**: Loading states, micro-interactions, accessibility (aria-invalid, aria-labels), dark mode, V2 alignment, /send eliminated
- **Cron Infrastructure**: 3 atomic RPCs (claim_due_scheduled_sends, recover_stuck_scheduled_sends, increment_customer_send_count), fail-closed auth on all cron endpoints

## Next steps
1. Wait for Twilio A2P approval for Phase 21-08 (SMS webhook verification)
2. Push commits to remote
3. Production deployment — configure env vars:
   - `REVIEW_TOKEN_SECRET` (openssl rand -hex 32)
   - `CRON_SECRET` (for Vercel cron auth)
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate limiting)
   - Twilio, Resend, Google OAuth, Stripe, OpenAI/Anthropic
4. Enable leaked password protection in Supabase Dashboard > Auth > Settings
5. Phase 29 (Agency-Mode Readiness) — multi-location schema, weekly reports, campaign playbooks
6. v2.1 Integrations — ServiceTitan/Jobber/Housecall Pro API for auto job import
7. v2.2 Review Inbox — ingest Google Business Profile reviews, AI reply suggestions

## Open questions / decisions needed
- Twilio A2P campaign approval (blocker for Phase 21-08 verification)
- Production domain and deployment timeline
- Agency mode scope and pricing (Phase 29)
- Upstash Redis setup for production rate limiting
