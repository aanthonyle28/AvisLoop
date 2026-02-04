# Roadmap: AvisLoop

## Overview

AvisLoop is a review follow-up system for home service businesses. v1.0 through Phase 25 are shipped. Milestone v2.0 transforms AvisLoop from a single-send review request tool into a multi-touch follow-up system with SMS, campaigns/sequences, jobs, LLM personalization, and redesigned dashboard/onboarding/landing page.

## Milestones

- **v1.0 MVP** - Phases 1-11 (shipped 2026-01-28) — [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Scheduled Sending** - Phases 12-14 (shipped 2026-01-30) — [Archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Onboarding Redesign + Google Auth** - Phases 15-16 (shipped 2026-01-30) — [Archive](milestones/v1.2-ROADMAP.md)
- **v1.2.1 Tech Debt Closure** - Phases 17-18 (shipped 2026-02-01) — [Archive](milestones/v1.2.1-ROADMAP.md)
- **Phase 19 UX/UI Redesign** - Phase 19 (shipped 2026-02-01)
- **v1.3 Dashboard UX Overhaul** - Phases 20-22 (shipped 2026-02-02)
- **v1.4 Landing Page Redesign** - Phase 25 (shipped 2026-02-02)
- **v2.0 Review Follow-Up System** - Phases 20-29 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-11) - SHIPPED 2026-01-28</summary>

- [x] Phase 1: Foundation & Auth (6 plans)
- [x] Phase 2: Business Setup (3 plans)
- [x] Phase 3: Contact Management (6 plans)
- [x] Phase 3.1: Critical Fixes (1 plan)
- [x] Phase 4: Core Sending (5 plans)
- [x] Phase 5: Message History (2 plans)
- [x] Phase 5.1: Code Review Fixes (1 plan)
- [x] Phase 6: Billing & Limits (5 plans)
- [x] Phase 7: Onboarding Flow (4 plans)
- [x] Phase 8: Public Pages (2 plans)
- [x] Phase 8.1: Code Review Fixes (2 plans)
- [x] Phase 9: Polish & UX (4 plans)
- [x] Phase 10: Landing Page Redesign (5 plans)
- [x] Phase 11: Bulk Send & Integrations (3 plans)

</details>

<details>
<summary>v1.1 Scheduled Sending (Phases 12-14) - SHIPPED 2026-01-30</summary>

- [x] Phase 12: Cron Processing (1 plan)
- [x] Phase 13: Scheduling & Navigation (2 plans)
- [x] Phase 14: Scheduled Send Management (2 plans)

</details>

<details>
<summary>v1.2 Onboarding Redesign + Google Auth (Phases 15-16) - SHIPPED 2026-01-30</summary>

- [x] Phase 15: Design System & Dashboard Redesign (4 plans)
- [x] Phase 16: Onboarding Redesign + Google Auth (5 plans)

</details>

<details>
<summary>v1.2.1 Tech Debt Closure (Phases 17-18) - SHIPPED 2026-02-01</summary>

- [x] Phase 17: Deployment & Critical Fixes (2 plans)
- [x] Phase 18: Code Cleanup (2 plans)

</details>

<details>
<summary>Phase 19: UX/UI Redesign - SHIPPED 2026-02-01</summary>

- [x] 19-01-PLAN.md — Rebuild navigation and layout shell
- [x] 19-02-PLAN.md — Loading states, skeletons, and actionable toast patterns
- [x] 19-03-PLAN.md — Send page shell + Quick Send tab
- [x] 19-04-PLAN.md — Onboarding setup progress pill and drawer
- [x] 19-05-PLAN.md — Stat strip and recent activity strip
- [x] 19-06-PLAN.md — Bulk Send tab with filter chips and action bar
- [x] 19-07-PLAN.md — Requests page detail drawer and resend actions
- [x] 19-08-PLAN.md — Dashboard deprecation and dead code cleanup

</details>

<details>
<summary>v1.3 Dashboard UX Overhaul (Phases 20-22) - SHIPPED 2026-02-02</summary>

- [x] Phase 20: Status Badges & Layout Fixes (2 plans)
- [x] Phase 21: Email Preview & Template Selection (2 plans)
- [x] Phase 22: Detail Drawers (3 plans)

</details>

<details>
<summary>v1.4 Landing Page Redesign (Phase 25) - SHIPPED 2026-02-02</summary>

- [x] Phase 25: Problem/Solution Storytelling (2 plans)

</details>

### v2.0 Review Follow-Up System (Phases 20-29)

**Milestone Goal:** Transform AvisLoop from a single-send review request tool into a multi-touch follow-up system for home service businesses — with SMS, campaigns/sequences, jobs, LLM personalization, and redesigned dashboard/onboarding/landing page.

**Replaces:** Old v1.3/v1.4 phases 20-26 (new v2.0 milestone starts fresh from Phase 20)

**Reusable from v1.0-v1.4:**
- StatusBadge component (Phase 20)
- Request/contact detail drawers (Phase 22)
- Email preview components (Phase 21)
- Template selector patterns
- Design system (CSS variables, dark mode, Phosphor icons, Kumbh Sans)

**Coverage:** 76 requirements across 14 categories

---

### Phase 20: Database Migration & Customer Enhancement
**Goal**: Contacts table renamed to Customers, SMS opt-in fields added, A2P 10DLC registration complete, timezone support enabled.
**Depends on**: Phase 19 (v1.0 shipped)
**Requirements**: CUST-01, CUST-02, CUST-03, CUST-04, SMS-02, SMS-03, COMP-01
**Success Criteria** (what must be TRUE):
  1. User can view /customers page (renamed from /contacts) with phone number and tags columns visible
  2. Customer records display phone number with US format validation (xxx-xxx-xxxx)
  3. Customer records support multiple tags (VIP, repeat, commercial, residential, plus custom) with tag filter UI
  4. Customer list filters by tag (clicking tag chip shows only tagged customers)
  5. Each customer has sms_opt_in boolean, opt_in_date, opt_in_method, and opt_in_ip fields in database (UI in Phase 21)
  6. Twilio A2P 10DLC brand and campaign registration approved (verified in Twilio Console before Phase 21 starts)
  7. Customer timezone field populated from browser Intl API on creation with business timezone fallback
**Plans**: 8 plans in 4 waves
Plans:
- [x] 20-01-PLAN.md — Database table rename (contacts -> customers) with FK and RLS updates
- [x] 20-02-PLAN.md — New schema fields (tags, phone_status, SMS consent, timezone)
- [x] 20-03-PLAN.md — Phone validation library and customer validation schemas
- [x] 20-04-PLAN.md — Codebase rename (types, actions, components, routes)
- [x] 20-05-PLAN.md — Customer UI (tags, phone display, tag filter)
- [x] 20-06-PLAN.md — CSV import enhancement with phone review queue
- [x] 20-07-PLAN.md — SMS consent UI (checkbox, audit trail, badges)
- [x] 20-08-PLAN.md — A2P 10DLC registration checkpoint (deferred)

### Phase 21: SMS Foundation & Compliance
**Goal**: Users can send SMS messages via Twilio with full TCPA compliance (opt-in tracking, STOP handling, quiet hours enforcement, webhook verification).
**Depends on**: Phase 20 (A2P registration complete, SMS fields exist)
**Requirements**: SMS-01, SMS-04, SMS-05, SMS-06, SMS-07, SMS-08, SMS-09, COMP-04, DLVR-02
**Success Criteria** (what must be TRUE):
  1. User can send manual SMS from /send page with channel selector (email/SMS toggle), message preview shows character count (160 GSM-7 limit)
  2. SMS sending only enabled for customers with sms_opt_in = true and phone number present (graceful fallback to email if no phone)
  3. Customer receives SMS from branded sender (business name in FROM field), message includes review link + opt-out footer
  4. Customer can reply STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT to opt out; Twilio webhook updates sms_opt_in = false and sends confirmation within 5 minutes
  5. SMS messages outside 8am-9pm customer local time are queued and sent at next available window (date-fns-tz timezone conversion)
  6. Twilio webhooks verify signature (twilio.validateRequest) and reject invalid requests with 403
  7. send_logs table includes channel column (email/sms) and provider-specific IDs (Twilio message_sid or Resend email_id)
  8. Failed SMS sends (Twilio down, invalid number) queue for retry with exponential backoff (3 attempts max, then mark failed)
**Plans**: TBD

### Phase 22: Jobs CRUD & Service Types
**Goal**: Users can create jobs linked to customers with service type and completion status, enabling job-centric workflow and service-specific analytics.
**Depends on**: Phase 20 (customers table exists)
**Requirements**: JOBS-01, JOBS-02, JOBS-03, JOBS-04, JOBS-05, JOBS-06, SVCT-01, SVCT-02
**Deferred to later phases**: SVCT-03 (timing consumed during campaign creation - Phase 24), SVCT-04 (analytics by service type - Phase 27)
**Success Criteria** (what must be TRUE):
  1. User can view /jobs page with list of all jobs (customer name, service type, status, completion date)
  2. User can create job with customer selector (dropdown search), service type (HVAC/plumbing/electrical/cleaning/roofing/painting/handyman/other), and status (completed/do-not-send)
  3. User can edit job details and mark job completed (completion timestamp saved, triggers campaign enrollment in Phase 24)
  4. Each job links to exactly one customer (foreign key enforced, customer details visible in job view)
  5. Job completion (status changed to completed) triggers campaign enrollment (when campaign exists for that service type) — enrollment logic implemented in Phase 24
  6. Service taxonomy saved as business setting in /settings page (multi-select: "Which services do you offer?") — onboarding integration deferred to Phase 28
  7. Each service type has default timing rules (HVAC: 24h, plumbing: 48h, electrical: 24h, cleaning: 4h, roofing: 72h) configurable in settings — stored in DB, consumed by Phase 24 campaign creation
**Note**: Phase 22 adds schema columns and settings UI for service type timing. Phase 24 consumes timing when creating campaigns. Phase 27 adds analytics by service type. Phase 28 integrates service type selection into onboarding wizard.
**Plans**: 5 plans in 3 waves
Plans:
- [x] 22-01-PLAN.md — Database schema (jobs table + business service type settings)
- [x] 22-02-PLAN.md — Types, validations, and server actions for jobs CRUD
- [x] 22-03-PLAN.md — Jobs UI page with table, filters, and empty state
- [x] 22-04-PLAN.md — Add/edit job forms with customer selector
- [x] 22-05-PLAN.md — Service types settings section

### Phase 23: Message Templates & Migration
**Goal**: Email and SMS messages use unified message_templates table with channel selector, replacing old email_templates.
**Depends on**: Phase 21 (SMS sending works), Phase 19 (email sending works)
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04
**Success Criteria** (what must be TRUE):
  1. message_templates table supports both email and SMS via channel column (email/sms discriminator)
  2. User can create template with channel selector (email/SMS radio buttons), template form enforces SMS 160 character limit
  3. Default templates exist for each service category (HVAC, plumbing, electrical, cleaning, roofing, painting, handyman, other) per channel
  4. Existing email_templates migrated to message_templates with channel = email (backward compatible, no data loss)
  5. Template preview shows appropriate rendering (email: subject + body + CTA button, SMS: body only with character count)
  6. Campaign touch configuration references message_templates by ID (not email_templates)
**Plans**: TBD

### Phase 24: Multi-Touch Campaign Engine
**Goal**: Users can create multi-touch campaigns (up to 4 touches) with preset sequences, enroll jobs on completion, and automatically stop on review/opt-out.
**Depends on**: Phase 22 (jobs trigger enrollment), Phase 23 (templates ready), Phase 21 (SMS sending works)
**Requirements**: CAMP-01, CAMP-02, CAMP-03, CAMP-04, CAMP-05, CAMP-06, CAMP-07, CAMP-08, OPS-03, COMP-03, SVCT-03
**Success Criteria** (what must be TRUE):
  1. User can select campaign preset during onboarding or settings (conservative: 2 emails; standard: 2 emails + 1 SMS; aggressive: 2 emails + 2 SMS)
  2. User can duplicate any campaign and customize touches (edit channel, timing delay, template)
  3. Each campaign touch specifies channel (email/SMS), timing delay (hours/days after job completion), and template (max 4 touches per campaign)
  4. Campaign automatically stops when: review completed, customer opted out (email or SMS), or campaign paused by business owner
  5. campaign_enrollments table tracks job progression through campaign touches (active, paused, completed, stopped) with touch completion timestamps
  6. Vercel Cron job processes campaign touches via claim_due_campaign_touches() RPC using FOR UPDATE SKIP LOCKED (prevents race conditions)
  7. Campaign performance dashboard displays open/click/conversion rates per touch and per campaign (aggregated from send_logs)
  8. Campaign creation allows service-type filtering ("only enroll HVAC jobs" or "all service types")
  9. Send pacing controls limit sends per hour per business (default 100/hour, configurable in settings) to avoid spam flags
  10. Campaign sends spread across time windows (throttle 100 sends over 60 minutes, not burst)
  11. Campaign creation for specific service type auto-applies timing defaults from Phase 22 (can be overridden)
**Plans**: TBD

### Phase 25: LLM Personalization
**Goal**: Campaign messages optionally personalized via GPT-4o-mini with guardrails, graceful fallback to templates, and cost tracking.
**Depends on**: Phase 23 (templates exist), Phase 24 (campaigns send messages)
**Requirements**: LLM-01, LLM-02, LLM-03, LLM-04, LLM-05, LLM-06, LLM-07, LLM-08, LLM-09, LLM-10, LLM-11
**Success Criteria** (what must be TRUE):
  1. Vercel AI SDK integrated with GPT-4o-mini primary model and Claude Haiku fallback on constraint violations
  2. personalizeMessage() function injects customer name, service type, technician name, business name into template with structured prompt
  3. Personalization level fixed at Medium (rewrite for tone/warmth, no invented details) — no UI slider
  4. All customer input sanitized before LLM (prevent prompt injection: remove "ignore", "system:", special characters)
  5. LLM output validated before storage (length under 2x template, no HTML/script tags, no invented URLs, all placeholders present)
  6. Any LLM failure (timeout, invalid output, API error) falls back to raw template (never blocks sends)
  7. LLM rewrite contract enforced: preserve all factual content (review link, opt-out language, business name, offer details if present)
  8. Hard constraint: LLM may only rewrite approved templates using provided fields — cannot introduce new claims, discounts, promises, or invented job details
  9. Auto-fallback triggers: timeout over 3s, output over 2x template length, missing required placeholders, profanity/inappropriate content
  10. Campaign launch shows batch preview of 3-5 personalized message samples before confirming send
  11. Rate limiting per business: 100 LLM calls/hour with cost tracking dashboard (estimated cost per month shown in settings)
**Plans**: TBD

### Phase 26: Review Funnel
**Goal**: Review requests route through satisfaction filter (4-5 stars to Google, 1-3 stars to private feedback), preventing negative public reviews.
**Depends on**: Phase 24 (campaigns send review links)
**Requirements**: REVW-01, REVW-02, REVW-03, REVW-04, COMP-02
**Success Criteria** (what must be TRUE):
  1. Review link opens pre-qualification page with 1-5 star satisfaction rating (not Google directly)
  2. Selecting 4-5 stars redirects to Google review link (business's actual Google Business Profile URL)
  3. Selecting 1-3 stars shows private feedback form (not Google)
  4. Private feedback stored in database with customer reference and business owner receives email notification on submission
  5. Pre-qualification page frames as "share your experience" (not "leave a review if happy") to avoid review gating language
  6. Feedback dashboard shows all private feedback with response workflow (mark as resolved, add notes)
**Plans**: TBD

### Phase 27: Dashboard Redesign
**Goal**: Dashboard displays pipeline KPIs, ready-to-send queue, needs attention alerts, quick actions, and daily to-do list.
**Depends on**: Phase 24 (campaign data exists), Phase 22 (jobs data exists)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, NAV-01, NAV-02, OPS-01, OPS-02, SVCT-04
**Success Criteria** (what must be TRUE):
  1. Dashboard displays pipeline KPIs widget (jobs ready to send count, active campaigns count, reviews this month count, response rate percentage)
  2. Ready-to-send queue lists completed jobs not yet enrolled in campaign (with quick enroll action)
  3. Needs attention alerts display failed sends, STOP requests, campaign issues, budget warnings with badge counts
  4. Quick actions buttons: "Add Job", "Enroll in Campaign", "Send Manual Request" (no navigation, inline modals)
  5. Daily to-do list shows prioritized action items (jobs to close out, follow-ups due today, issues to resolve) with completion checkboxes
  6. Navigation restructured: Send/Queue, Customers, Jobs, Campaigns, Activity/History (5 items, no dashboard link)
  7. Navigation badges show pending counts (queued sends count, attention items count)
  8. Exception handling dashboard displays failed sends with retry action, webhook errors with logs, budget warnings with upgrade prompt
  9. Daily to-do list items persist in database (user can dismiss/complete, reappear next day if not resolved)
  10. Analytics page displays response rate and review rate breakdowns by service type
**Plans**: TBD

### Phase 28: Onboarding Redesign
**Goal**: New users complete setup wizard (business basics, review destination, services offered, software used, default campaign, import customers, SMS opt-in).
**Depends on**: Phase 24 (campaigns exist), Phase 22 (service taxonomy exists), Phase 20 (customers with SMS fields)
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05, ONBD-06, ONBD-07, DLVR-01, DLVR-03
**Success Criteria** (what must be TRUE):
  1. Step 1 collects business basics (business name, phone number, Google review link)
  2. Step 2 verifies review destination setup (Google review link validation with preview)
  3. Step 3 collects services offered (multi-select from service taxonomy: HVAC, plumbing, electrical, etc.) with timing defaults auto-applied
  4. Step 4 collects software used (ServiceTitan/Jobber/Housecall Pro/none) for future integrations (captured but not integrated yet)
  5. Step 5 selects default campaign preset (conservative/standard/aggressive) and auto-creates campaign
  6. Step 6 imports customers via CSV upload or manual add with phone number collection (SMS opt-in explanation shown)
  7. SMS opt-in explanation during onboarding with consent capture (checkbox: "Customers consent to SMS messages")
  8. SPF/DKIM/DMARC setup guidance checklist in settings (with verification status: pending/verified)
  9. Branded short links for review URLs enabled (trust signal, not raw Google URL) using custom domain or bit.ly integration
**Plans**: TBD

### Phase 29: Agency-Mode Readiness & Landing Page
**Goal**: Multi-location data model schema added (no UI yet), weekly performance reports auto-generated, campaign playbooks exportable, landing page copy updated for v2.0.
**Depends on**: Phase 27 (analytics exist), Phase 24 (campaigns exist)
**Requirements**: AGCY-01, AGCY-02, AGCY-03, LAND-01, LAND-02
**Success Criteria** (what must be TRUE):
  1. Multi-location data model schema added (business has location_id column, queries scoped by location_id) — no UI yet, schema-only
  2. Weekly performance report auto-generated every Monday (sends count, opens count, reviews count, response rate) and emailed to business owner
  3. Campaign playbooks exportable (download campaign config as JSON template, shareable across businesses)
  4. Landing page copy updated for home services positioning ("Turn job completions into Google reviews automatically")
  5. Existing homepage sections (hero, problem/solution, how it works, stats, outcome cards) updated with v2.0 messaging (multi-touch sequences, SMS, jobs workflow)
  6. Landing page mentions SMS channel, multi-touch sequences, and job-centric workflow (not single-send contacts)
**Plans**: TBD

## Phase Details

See individual phase sections above for requirements, success criteria, and dependencies.

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-11 | v1.0 | 48/48 | Complete | 2026-01-28 |
| 12-14 | v1.1 | 5/5 | Complete | 2026-01-30 |
| 15-16 | v1.2 | 9/9 | Complete | 2026-01-30 |
| 17-18 | v1.2.1 | 4/4 | Complete | 2026-02-01 |
| 19 | UX/UI Redesign | 8/8 | Complete | 2026-02-01 |
| 20 (v1.3) | Dashboard UX | 2/2 | Complete | 2026-02-01 |
| 21 (v1.3) | Dashboard UX | 2/2 | Complete | 2026-02-01 |
| 22 (v1.3) | Dashboard UX | 3/3 | Complete | 2026-02-02 |
| 25 (v1.4) | Landing Page | 2/2 | Complete | 2026-02-02 |
| **20 (v2.0)** | **Review Follow-Up** | **8/8** | **Complete** | **2026-02-03** |
| 21 (v2.0) | Review Follow-Up | 0/TBD | Blocked (A2P) | - |
| **22 (v2.0)** | **Review Follow-Up** | **5/5** | **Complete** | **2026-02-04** |
| 23 (v2.0) | Review Follow-Up | 0/TBD | Not started | - |
| 24 (v2.0) | Review Follow-Up | 0/TBD | Not started | - |
| 25 (v2.0) | Review Follow-Up | 0/TBD | Not started | - |
| 26 (v2.0) | Review Follow-Up | 0/TBD | Not started | - |
| 27 (v2.0) | Review Follow-Up | 0/TBD | Not started | - |
| 28 (v2.0) | Review Follow-Up | 0/TBD | Not started | - |
| 29 (v2.0) | Review Follow-Up | 0/TBD | Not started | - |

**Total:** 96 plans complete across shipped phases, 8 v2.0 phases remaining.

## What's Next

**Current milestone:** v2.0 Review Follow-Up System (Phases 20-29)
**Next action:** Plan Phase 23 (Message Templates & Migration) or Phase 21 (SMS, if A2P approved)

**Blocker:** Twilio A2P 10DLC registration required before Phase 21 execution (see docs/SMS_COMPLIANCE.md)

After v2.0:
- **v2.1 Integrations** — ServiceTitan/Jobber/Housecall Pro API integrations for auto job import
- **v2.2 Review Inbox** — Ingest reviews from Google Business Profile, AI reply suggestions
- **v3.0 Agency Mode** — Multi-business management UI, white-label option, client reporting portal
- **Production deployment** — Configure Twilio, Resend, Google OAuth, Stripe, OpenAI/Anthropic for production

---
*Last updated: 2026-02-04 after Phase 22 execution complete*
*v2.0 phases replace old v1.3/v1.4 phases 20-26 per user request*
