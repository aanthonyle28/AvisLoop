# Project Research Summary

**Project:** AvisLoop Review SaaS - Scheduled Sending Feature
**Domain:** Scheduled/Deferred Email Sending for Review Requests
**Researched:** 2026-01-28
**Confidence:** HIGH

## Executive Summary

Scheduled email sending is a well-understood feature with established patterns across Gmail, Outlook, Mailchimp, and modern email tools. The research reveals that AvisLoop's existing architecture (Next.js + Supabase + Resend) already contains everything needed — no new npm packages required. The implementation leverages Vercel Cron (runs every minute in UTC), a service role Supabase client (bypasses RLS for background processing), and row-level locking with `FOR UPDATE SKIP LOCKED` to prevent race conditions.

The recommended approach is straightforward: create a `scheduled_sends` table, add a cron route handler protected with `CRON_SECRET`, and extract the existing email sending logic into reusable functions. The architecture minimizes complexity by reusing 80% of existing send infrastructure — template rendering, quota checks, cooldown validation, and Resend integration all remain unchanged. The cron processor becomes a thin orchestration layer that fetches due sends, re-validates business rules at send time, and calls existing send functions.

The primary risks are race conditions (duplicate sends), timezone confusion (UTC storage vs local display), and silent cron failures. All are mitigated through proven patterns: atomic database operations with row locking, strict UTC storage with local display conversion, and structured logging with external monitoring. The research identifies 14 specific pitfalls across 4 categories, with clear prevention strategies for each. Implementation complexity is medium (13-19 hours estimated) due to high code reuse, but deployment requires production testing since Vercel Cron only runs in production.

## Key Findings

### Recommended Stack

No new dependencies required. The existing stack provides all necessary capabilities. Vercel Cron (platform feature) handles job scheduling, `@supabase/supabase-js` provides service role access for RLS bypass, `date-fns 4.1.0` includes date comparison functions, and `resend 6.9.1` handles email delivery. The only additions are configuration (vercel.json cron setup) and patterns (service role client, datetime-local HTML inputs).

**Core technologies:**
- **Vercel Cron** (platform feature) — HTTP-triggered job scheduling at 1-minute intervals; no persistent process required
- **Supabase service role client** (`createClient` with `SUPABASE_SERVICE_ROLE_KEY`) — bypasses RLS for cron operations; requires strict security (CRON_SECRET validation)
- **date-fns 4.1.0** (already installed) — date comparison (`isBefore`, `isAfter`, `isPast`) for due send detection; no timezone package needed
- **PostgreSQL `FOR UPDATE SKIP LOCKED`** — row-level locking prevents race conditions when multiple cron invocations overlap
- **HTML datetime-local input** (native browser API) — no calendar picker library needed; browser handles timezone conversion automatically

### Expected Features

Scheduled sending follows established UX patterns from consumer email tools. Table stakes include preset scheduling options ("In 1 hour", "Tomorrow 9am", "Custom"), viewing scheduled sends with cancellation ability, and status tracking through the lifecycle. Differentiators include randomized send times (feels more human), batch reschedule (move all scheduled sends forward/back), and smart timezone handling (send at recipient's 9am).

**Must have (table stakes):**
- **Schedule with presets** — 3-4 preset buttons plus custom date/time picker; users expect this from Gmail/Outlook
- **Cancel scheduled send** — before send time; critical "rescue" feature for mistakes
- **View scheduled sends** — dedicated list/tab showing pending sends with send time and recipient count
- **Status tracking** — pending → processing → sent/failed/cancelled lifecycle with clear indicators
- **Timezone display** — show user's local time with abbreviation; store UTC, display local
- **Re-validate at send time** — check opt-out, cooldown, quota, archive status before sending (not just at schedule time)

**Should have (competitive):**
- **Randomized send times** — "8:23am" instead of "8:00am" preset; looks less automated
- **Schedule confirmation** — toast with "Scheduled for Jan 28, 9:00 AM PST" + redirect to scheduled view
- **Partial send results** — show "Sent to 4 of 5 contacts" with per-contact details
- **Batch reschedule** — move multiple scheduled sends forward/back (vacation scenario)

**Defer (v2+):**
- **Recipient timezone detection** — send at 9am contact's timezone; requires contact.timezone field + DST handling (very complex)
- **Recurring sends** — not needed for one-time review requests
- **Priority queue** — review requests don't have urgency tiers; FIFO is sufficient

### Architecture Approach

The architecture integrates cleanly as a queue layer (scheduled_sends table) plus background processor (cron route). Most infrastructure exists: email sending, rate limiting, quota checks, and logging are implemented. Scheduled sending extracts core send logic into `lib/scheduled-sends/core-send.ts`, creates a service role client in `lib/supabase/service-role.ts`, and adds a cron route at `app/api/cron/process-scheduled-sends/route.ts` that runs every minute via Vercel Cron configuration in `vercel.json`.

**Major components:**
1. **scheduled_sends table** — stores business_id, contact_ids (array), template_id, scheduled_for (timestamptz), status (pending/processing/completed/failed/cancelled), counts (sent/failed/skipped), and error_message; includes RLS policies for user access and service role bypass for cron
2. **Vercel Cron route handler** — validates `CRON_SECRET` header, creates service role client, calls processor, returns structured JSON; runs every minute in production only
3. **Scheduled send processor** — fetches due sends with `FOR UPDATE SKIP LOCKED` (atomic claim), re-validates business rules (opt-out, cooldown, quota), calls extracted send function per contact, updates status and counts; handles partial failures gracefully with `Promise.allSettled`
4. **Extracted send function** — shared between immediate and scheduled sends; includes eligibility checks, template rendering, Resend API call with idempotency key, send_log creation, contact tracking updates; single source of truth for send rules
5. **Service role client** — separate from SSR client; disables session persistence; used only in cron route and admin operations; never imported in client components

### Critical Pitfalls

Research identified 14 pitfalls across technical, UX, and operational categories. The most critical relate to race conditions, security, timezone handling, and business rule re-validation.

1. **Duplicate sends via race conditions** — without `FOR UPDATE SKIP LOCKED`, multiple cron invocations can process the same scheduled send; prevention requires atomic `UPDATE...RETURNING` query that claims sends by immediately setting status='processing'
2. **Service role key exposure** — Vercel Cron endpoints are public URLs; must validate `Authorization: Bearer ${CRON_SECRET}` header before using service role client; rotate secret periodically
3. **Timezone confusion** — Vercel Cron runs in UTC; always store scheduled_for as UTC in PostgreSQL timestamptz; display in user's local timezone with abbreviation; test DST boundary dates explicitly
4. **Stale business rule validation** — contact opts out after scheduling but before send time; must re-check opt-out, cooldown, quota, archived status in cron processor, not just at schedule creation
5. **Inconsistent validation between immediate and scheduled** — extract shared validation functions (`checkContactEligibility`, `checkBusinessQuota`) to avoid drift; both flows must use same eligibility rules
6. **Idempotency key conflicts** — use distinct prefixes for immediate (`immediate-${sendLog.id}`) vs scheduled (`scheduled-${scheduledSend.id}`) sends; Resend's 24-hour idempotency window overlaps with scheduling window
7. **Silent cron failures** — implement structured logging, external monitoring (BetterStack/Sentry), health check endpoint; alert if cron doesn't run for >5 minutes or sends are overdue >10 minutes
8. **Resend rate limit exhaustion** — default 2 requests/second; add 500ms delay between sends or use rate-limited queue (p-limit); monitor 429 errors and implement exponential backoff

## Implications for Roadmap

Based on research, scheduled sending should be implemented in 4 phases over 13-19 hours total. Phase structure follows dependency order: database and core processing first (enables programmatic scheduling), then cron infrastructure (enables background execution), then user interface (enables user interaction), finally monitoring (ensures reliability).

### Phase 1: Core Infrastructure & Processing
**Rationale:** Database schema and send logic are foundational dependencies. Everything else builds on the scheduled_sends table and extracted send function. Addressing race conditions, service role security, and business rule re-validation upfront prevents technical debt.

**Delivers:**
- Database migration with scheduled_sends table, RLS policies, and `fetch_due_scheduled_sends_with_lock` function
- Service role client (`lib/supabase/service-role.ts`) with environment variable validation
- Extracted core send function (`lib/scheduled-sends/core-send.ts`) reusable by immediate and scheduled flows
- Refactored `sendReviewRequest` and `batchSendReviewRequest` to use extracted function

**Addresses features:**
- Foundation for all scheduling features (enables storage and processing)
- Re-validation at send time (table stakes requirement)

**Avoids pitfalls:**
- Pitfall 1 (race conditions) — via `FOR UPDATE SKIP LOCKED` in database function
- Pitfall 2 (service role exposure) — via strict environment variable isolation
- Pitfall 4 (stale validation) — via re-check pattern in processor
- Pitfall 5 (inconsistent validation) — via shared functions
- Pitfall 6 (idempotency conflicts) — via distinct key prefixes
- Pitfall 12 (rate limits) — via rate limiting design
- Pitfall 13 (partial failures) — via `Promise.allSettled` pattern

**Research flag:** Standard patterns; skip phase-level research

### Phase 2: Cron Processing
**Rationale:** With database and send logic ready, add background processing layer. Vercel Cron requires production deployment for testing, so this phase needs careful validation. CRON_SECRET security must be set up before first deployment.

**Delivers:**
- Scheduled send processor (`lib/scheduled-sends/processor.ts`) with due send fetching, batch processing, and status updates
- Vercel Cron route handler (`app/api/cron/process-scheduled-sends/route.ts`) with CRON_SECRET validation
- vercel.json configuration with `* * * * *` schedule (every minute)
- Environment variables: CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY

**Uses stack elements:**
- Vercel Cron platform feature
- Service role client from Phase 1
- date-fns for time comparisons

**Implements architecture:**
- Background processor component with row locking
- Cron route handler with security validation

**Avoids pitfalls:**
- Pitfall 2 (service role security) — via CRON_SECRET header validation
- Pitfall 1 (race conditions) — via row locking in processor
- Pitfall 13 (partial failures) — via per-send error handling

**Research flag:** Vercel Cron deployment testing required; no additional research needed (well-documented)

### Phase 3: Scheduling UI
**Rationale:** With backend processing complete, add user-facing scheduling interface. Timezone handling is the main complexity here — must display local time while storing UTC. Preset buttons reduce cognitive load and match user mental models from Gmail/Outlook.

**Delivers:**
- Schedule send modal with preset buttons ("In 1 hour", "Tomorrow 9am", "In 24 hours", "Custom")
- Custom date/time picker using HTML datetime-local input (no library needed)
- Timezone indicator in UI ("Pacific Time (PST)")
- Schedule action enhancement (`lib/actions/schedule.ts`) with validation
- Integration with existing contact selector and template system

**Addresses features:**
- Schedule with presets (table stakes)
- Custom date/time picker (table stakes)
- Timezone display (table stakes)
- Schedule confirmation toast (competitive)

**Avoids pitfalls:**
- Pitfall 3 (timezone confusion) — via UTC storage + local display with abbreviation
- Pitfall 9 (confusing timezone display) — via relative + absolute time display
- Pitfall 7 (quota counting) — via reservation strategy (count scheduled + sent)

**Research flag:** Standard UI patterns; skip phase-level research

### Phase 4: Management UI & Monitoring
**Rationale:** Users need visibility into scheduled sends and ability to cancel. Monitoring ensures reliability — silent cron failures are a critical operational risk. Health checks and alerts catch issues before users report them.

**Delivers:**
- Scheduled sends list page (`app/dashboard/scheduled-sends/`) with table view
- Status badges (pending, processing, completed, failed, cancelled)
- Cancel button with confirmation dialog
- Progress indicators for processing sends (sent_count / total_contacts)
- Structured logging in cron endpoint
- Health check endpoint (`/api/health/scheduled-sends`)
- External monitoring setup (BetterStack or Sentry)

**Addresses features:**
- View scheduled sends (table stakes)
- Cancel scheduled send (table stakes)
- Status tracking (table stakes)
- Partial send results (competitive)

**Avoids pitfalls:**
- Pitfall 8 (no confirmation/visibility) — via dedicated list page
- Pitfall 10 (cancel expectations) — via confirmation dialog with partial send warnings
- Pitfall 11 (silent failures) — via structured logging and monitoring
- Pitfall 14 (processing visibility) — via progress tracking

**Research flag:** Monitoring tool selection needed; evaluation phase for BetterStack vs Sentry vs Axiom

### Phase Ordering Rationale

- **Phase 1 before 2:** Database schema must exist before cron processor can query it; extracted send function must exist before scheduled processor can call it
- **Phase 2 before 3:** Background processing must work before users can schedule sends (otherwise scheduled sends never execute)
- **Phase 3 before 4:** Users can schedule sends before management UI exists (programmatic scheduling works); but management UI is high priority for confidence and cancellation
- **Phase 4 last:** Monitoring and management UI enhance existing functionality but aren't blocking; can iterate on alerts and health checks post-launch

**Dependency chains identified:**
- Database → Processor → Cron route (linear dependency)
- Extracted send function → Both immediate and scheduled flows (shared dependency)
- Service role client → Cron route (security dependency)
- Scheduling UI → Schedule action → Database (user interaction flow)

**Architecture patterns discovered:**
- Service role pattern for RLS bypass in cron context
- Row locking pattern for safe concurrent processing
- Idempotency keys for duplicate prevention
- Status state machine for clear lifecycle management

**How this avoids pitfalls:**
- Early phase 1 work prevents race conditions and inconsistent validation (hardest to fix later)
- Phase 2 security setup prevents service role exposure before production
- Phase 3 timezone handling prevents UX confusion from day one
- Phase 4 monitoring catches operational issues before they cascade

### Research Flags

Phases with standard patterns (skip deep research):
- **Phase 1:** Database schema and RLS patterns well-documented in Supabase docs; extraction refactoring is code-level work
- **Phase 2:** Vercel Cron has comprehensive official documentation; row locking is standard PostgreSQL pattern
- **Phase 3:** HTML datetime-local is W3C standard; preset button UX is well-established pattern

Phases needing validation during planning:
- **Phase 4:** Monitoring tool selection requires evaluation (BetterStack vs Sentry vs Axiom) — not a research blocker, but decision needed during phase planning

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new packages needed; all capabilities exist in current stack; Vercel Cron and Supabase service role are official features with comprehensive docs |
| Features | HIGH | Table stakes and differentiators identified from Gmail, Outlook, Mailchimp UX patterns; anti-features backed by technical constraints (30-day Resend limit) |
| Architecture | HIGH | Existing codebase analysis reveals 80% code reuse; integration points well-defined; row locking pattern proven in production systems (Solid Queue) |
| Pitfalls | HIGH | 14 pitfalls identified from official docs, community patterns, and codebase analysis; prevention strategies validated against existing implementation |

**Overall confidence:** HIGH

### Gaps to Address

While research confidence is high, a few areas need validation during implementation:

- **Vercel Cron testing strategy** — Cron only runs in production; local testing requires curl to route handler; may need staging environment for cron validation before production rollout
- **Batch size tuning** — Research suggests 10-25 sends per cron invocation based on Resend rate limits (2/sec) and serverless timeout (10s hobby, 60s pro); actual batch size depends on email template complexity and may need adjustment after production monitoring
- **Quota reservation vs send-time counting** — Research presents two approaches (reserve at schedule time, or count at send time with buffer); decision impacts UX and requires product judgment (recommend reservation for user clarity)
- **Monitoring tool selection** — BetterStack, Sentry, and Axiom all viable; needs cost/feature evaluation during Phase 4 planning
- **DST edge case testing** — Timezone handling strategy is clear (UTC storage + local display), but DST boundary dates (spring forward, fall back) need explicit test cases to verify correctness

## Sources

### Primary (HIGH confidence)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Vercel Cron Jobs Quickstart](https://vercel.com/docs/cron-jobs/quickstart)
- [Supabase Service Role Key](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z)
- [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL SELECT](https://www.postgresql.org/docs/current/sql-select.html)
- [MDN: datetime-local Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local)
- [date-fns v4.0 Release](https://blog.date-fns.org/v40-with-time-zone-support/)
- [Resend Schedule Email API](https://resend.com/docs/dashboard/emails/schedule-email)
- [Resend Idempotency Keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Resend Rate Limits](https://resend.com/docs/api-reference/rate-limit)

### Secondary (MEDIUM confidence)
- [How to Secure Vercel Cron Job Routes](https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router)
- [Using Service Role with Supabase in Next.js](https://github.com/orgs/supabase/discussions/30739)
- [The Unreasonable Effectiveness of SKIP LOCKED](https://www.inferable.ai/blog/posts/postgres-skip-locked)
- [Solid Queue analysis](https://www.bigbinary.com/blog/solid-queue)
- [Gmail Schedule Send](https://www.getmailtracker.com/blog/how-to-schedule-email-in-gmail)
- [Outlook Delay or Schedule Email](https://support.microsoft.com/en-us/office/delay-or-schedule-sending-email-messages-in-outlook-026af69f-c287-490a-a72f-6c65793744ba)
- [International SaaS Timezone Edge Cases](https://dev.to/tomjstone/international-saas-nightmare-timezone-edge-cases-and-how-to-solve-them-once-and-for-all-57hn)
- [Handling Timezones in Enterprise Applications](https://medium.com/@20011002nimeth/handling-timezones-within-enterprise-level-applications-utc-vs-local-time-309cbe438eaf)
- [How to Monitor Cron Jobs in 2026](https://dev.to/cronmonitor/how-to-monitor-cron-jobs-in-2026-a-complete-guide-28g9)

### Tertiary (LOW confidence, for context)
- [Email Scheduling Best Practices](https://woodpecker.co/blog/how-to-schedule-an-email/)
- [Time Picker UX Best Practices](https://www.eleken.co/blog-posts/time-picker-ux)
- [Designing A Time Zone Selection UX](https://smart-interface-design-patterns.com/articles/time-zone-selection-ux/)

### Existing Codebase (analysis performed)
- `lib/actions/send.ts` — email sending logic, eligibility checks, rate limiting, quota enforcement (lines 80-530)
- `lib/actions/schedule.ts` — scheduled send CRUD operations (exists with basic functionality)
- `lib/data/send-logs.ts` — quota tracking (`getMonthlyCount`, `getResendReadyContacts`)
- Database schema — RLS patterns, multi-tenancy enforcement, existing business rules

---
*Research completed: 2026-01-28*
*Ready for roadmap: yes*
