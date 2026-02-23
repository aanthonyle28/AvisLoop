# PROJECT_STATE

## Now
- v1.0-v1.4 milestones complete (shipped through 2026-02-02)
- **v2.0 Review Follow-Up System COMPLETE** (all phases verified 2026-02-18)
- **v2.5 UI/UX Redesign COMPLETE** (Phases 33-39 all verified 2026-02-20)
- **Security Review COMPLETE** (2026-02-22) — 26 findings, all Critical/High/Medium resolved, Low quick wins done
- **Post-security hardening COMPLETE** (2026-02-22) — conflict resolution system, review cooldown, cron processor, context provider refactor
- Phase 21 (SMS Foundation) 7/8 plans complete, blocked on Twilio A2P for final verification
- Twilio A2P: Brand approved, campaign pending
- All commits pushed to remote

## Last session summary (Bug Fixes + Refactor)

### Enrollment Conflict Resolution System
- New cron endpoint (`/api/cron/resolve-enrollment-conflicts`) processes stale conflicts and queued jobs every 5 minutes
- Auto-resolves conflicts older than 24 hours (replaces active enrollment)
- Processes `queue_after` jobs when customer's active sequence completes
- Review cooldown: configurable 7-90 days in Settings before re-enrolling a reviewed customer
- `updateReviewCooldown` server action + Settings UI with inline save
- `reviewed_at` tracking on send_logs when customer rates or submits feedback (powers KPI "Reviews This Month")
- Updated DATA_MODEL.md with `enrollment_resolution` and `conflict_detected_at` columns, indexes

### Bug Fix: Conflict Bypass on Campaign Switch
- Edge case: changing a conflicted job to `one_off` then to another campaign bypassed conflict detection
- Root cause: `forceCooldownOverride` was unconditionally `true` in Case 2 of `updateJob()`
- Fix: `forceCooldownOverride` now conditional on `wasRealCampaign` — only skips check when switching between real campaigns

### Bug Fix: Edit Job Showing All Service Types
- `EditJobSheet` rendered `ServiceTypeSelect` without passing `enabledTypes`, showing all 8 instead of business-enabled ones
- Root cause: prop was never threaded from `JobsClient` → `JobTable` → `EditJobSheet`

### Refactor: BusinessSettingsProvider Context
- Created `BusinessSettingsProvider` to eliminate `enabledServiceTypes` prop drilling
- Wraps entire dashboard layout, fetches service settings once at layout level
- Leaf components (`EditJobSheet`, `AddJobSheet`, `JobFilters`, `CampaignForm`) call `useBusinessSettings()` directly
- Removed prop from 12 components and 4 server page components
- `getAddJobData()` simplified (no longer fetches `service_types_enabled`)
- Prevents future bugs when new components need `enabledServiceTypes`

### Verification
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- All commits pushed to remote

## What's been built
- **Auth**: Sign up, sign in, sign out, password reset, session persistence, PasswordInput with strength checklist, Google OAuth
- **Business**: Business profile form, message template management (email + SMS)
- **Customers**: Full CRUD, bulk operations, CSV import, tags, phone validation, SMS consent tracking (moved to Settings tab)
- **Jobs**: Jobs table with service types, completion status, timing defaults, scheduled->completed workflow, inline actions, detail drawer, campaign selector with one-off option
- **Campaigns**: Multi-touch campaigns, presets, enrollment, touch processing, analytics, creation dialog, edit sheet panel, delete with enrollment reassignment, QuickSendModal for one-off sends
- **Enrollment Conflicts**: Conflict detection (active sequence / review cooldown), Replace/Skip/Queue resolution, cron auto-resolution (24h stale conflicts), queue_after processing, revert with undo toast
- **Review Funnel**: Pre-qualification page, HMAC-signed tokens, rating capture, Google redirect, private feedback form, reviewed_at tracking on send_logs
- **Security**: HMAC review tokens, server-only guards, rate limiting (send/webhook/public/auth), SQL injection protection, pagination, bulk limits, middleware route protection, security headers, RLS on all tables with WITH CHECK, generic error messages (no internal leaks)
- **History**: Send history with date filtering, search, status badges, bulk resend for failed messages
- **Billing**: Stripe integration, tier enforcement, usage tracking
- **Onboarding**: 3-step setup wizard (business setup, campaign preset, SMS consent), WelcomeCard first-run experience, post-onboarding checklist (warm amber pill+drawer), first-visit tooltip hints
- **Marketing**: V2 landing page (automation-first copy), pricing page, responsive design, mobile nav
- **Design System**: Warm palette (cream/amber/soft blue), semantic tokens (warning/success/info/error), card CVA variants, InteractiveCard arrow affordance, page padding normalization
- **Dashboard**: Two-tier KPIs with greeting, RecentCampaignActivity strip, ReadyToSendQueue with context-aware actions, AttentionAlerts, WelcomeCard
- **Polish**: Loading states, micro-interactions, accessibility (aria-invalid, aria-labels), dark mode, V2 alignment, /send eliminated
- **Cron Infrastructure**: 3 atomic RPCs (claim_due_scheduled_sends, recover_stuck_scheduled_sends, increment_customer_send_count), enrollment conflict cron (auto-resolve stale + queue_after processing), fail-closed auth on all cron endpoints
- **Architecture**: BusinessSettingsProvider context for shared business settings (eliminates prop drilling)

## Next steps
1. Wait for Twilio A2P approval for Phase 21-08 (SMS webhook verification)
2. Production deployment — configure env vars:
   - `REVIEW_TOKEN_SECRET` (openssl rand -hex 32)
   - `CRON_SECRET` (for Vercel cron auth)
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate limiting)
   - Twilio, Resend, Google OAuth, Stripe, OpenAI/Anthropic
3. Enable leaked password protection in Supabase Dashboard > Auth > Settings
4. Phase 29 (Agency-Mode Readiness) — multi-location schema, weekly reports, campaign playbooks
5. v2.1 Integrations — ServiceTitan/Jobber/Housecall Pro API for auto job import
6. v2.2 Review Inbox — ingest Google Business Profile reviews, AI reply suggestions

## Open questions / decisions needed
- Twilio A2P campaign approval (blocker for Phase 21-08 verification)
- Production domain and deployment timeline
- Agency mode scope and pricing (Phase 29)
- Upstash Redis setup for production rate limiting
