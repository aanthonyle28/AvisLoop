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
- **v2.0 Review Follow-Up System** - Phases 20-32 (complete 2026-02-18)
- **v2.5 UI/UX Redesign** - Phases 33-39 (complete 2026-02-20)
- **v2.6 Dashboard Command Center** - Phase 40 (complete 2026-02-25)
- **v2.5.1 Bug Fixes & Polish** - Phases 41-44 (complete 2026-02-25)
- **v2.5.2 UX Bugs & UI Fixes** - Phases 45-47 (complete 2026-02-27)
- **v2.5.3 UX Bugs & UI Fixes Part 2** - Phases 48-49 (complete 2026-02-26)
- **v2.5.4 Code Review (Phases 41-44)** - Phases 50-51 (complete 2026-02-27)
- **v3.0 Agency Mode** - Phases 52-58 (in progress)

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

<details>
<summary>v2.0 Review Follow-Up System (Phases 20-32) - COMPLETE 2026-02-18</summary>

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
  2. SMS sending only enabled for customers with sms_consent_status = 'opted_in' and phone number present (graceful fallback to email if no phone)
  3. Customer receives SMS from branded sender (business name in FROM field), message includes review link + opt-out footer
  4. Customer can reply STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT to opt out; Twilio webhook updates sms_consent_status = 'opted_out' and sends confirmation within 5 minutes
  5. SMS messages outside 8am-9pm customer local time are queued and sent at next available window (date-fns-tz timezone conversion)
  6. Twilio webhooks verify signature (twilio.validateRequest) and reject invalid requests with 403
  7. send_logs table includes channel column (email/sms) and provider-specific IDs (Twilio message_sid or Resend email_id)
  8. Failed SMS sends (Twilio down, invalid number) queue for retry with exponential backoff (3 attempts max, then mark failed)
**Plans**: 6 plans in 5 waves
Plans:
- [ ] 21-01-PLAN.md — Database schema (extend send_logs, create sms_retry_queue, Twilio client)
- [ ] 21-02-PLAN.md — Quiet hours enforcement and core SMS sending
- [ ] 21-03-PLAN.md — Twilio webhooks (STOP handling, delivery status)
- [ ] 21-04-PLAN.md — SMS retry queue processing (cron + exponential backoff)
- [ ] 21-05-PLAN.md — UI updates (channel selector, character counter, send action)
- [ ] 21-06-PLAN.md — Integration verification and documentation

### Phase 22: Jobs CRUD & Service Types
**Goal**: Users can create jobs linked to customers with service type and completion status, enabling job-centric workflow and service-specific analytics.
**Depends on**: Phase 20 (customers table exists)
**Requirements**: JOBS-01, JOBS-02, JOBS-03, JOBS-04, JOBS-05, JOBS-06, SVCT-01, SVCT-02
**Success Criteria** (what must be TRUE):
  1. User can view /jobs page with list of all jobs (customer name, service type, status, completion date)
  2. User can create job with customer selector (dropdown search), service type (HVAC/plumbing/electrical/cleaning/roofing/painting/handyman/other), and status (completed/do-not-send)
  3. User can edit job details and mark job completed (completion timestamp saved, triggers campaign enrollment in Phase 24)
  4. Each job links to exactly one customer (foreign key enforced, customer details visible in job view)
  5. Job completion (status changed to completed) triggers campaign enrollment (when campaign exists for that service type) — enrollment logic implemented in Phase 24
  6. Service taxonomy saved as business setting in /settings page (multi-select: "Which services do you offer?") — onboarding integration deferred to Phase 28
  7. Each service type has default timing rules (HVAC: 24h, plumbing: 48h, electrical: 24h, cleaning: 4h, roofing: 72h) configurable in settings — stored in DB, consumed by Phase 24 campaign creation
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
**Plans**: 7 plans in 4 waves
Plans:
- [x] 23-01-PLAN.md — Database migration (rename email_templates to message_templates, add channel column, RLS)
- [x] 23-02-PLAN.md — TypeScript types, Zod validations, and default templates constants
- [x] 23-03-PLAN.md — Server actions and data functions for message templates
- [x] 23-04-PLAN.md — Tab-based template form with channel selector and SMS character counter
- [x] 23-05-PLAN.md — Email and SMS preview components
- [x] 23-06-PLAN.md — Settings page update with new template form and list
- [x] 23-07-PLAN.md — Codebase migration (update all email_templates references)

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
**Plans**: 11 plans in 5 waves
Plans:
- [x] 24-01-PLAN.md — Database schema (campaigns, campaign_touches, campaign_enrollments, send_log extensions)
- [x] 24-02-PLAN.md — Atomic touch claiming RPC and campaign preset seeding
- [x] 24-03-PLAN.md — TypeScript types, Zod validations, and campaign constants
- [x] 24-04-PLAN.md — Campaign data functions and server actions (CRUD, duplicate, status toggle)
- [x] 24-05-PLAN.md — Enrollment server actions and job completion integration
- [x] 24-06-PLAN.md — Cron job for campaign touch processing with rate limiting and quiet hours
- [x] 24-07-PLAN.md — Campaigns page with list view, status toggle, and preset picker
- [x] 24-08-PLAN.md — Campaign detail page, edit page, and form components
- [x] 24-09-PLAN.md — Job completion enrollment checkbox and navigation update
- [x] 24-10-PLAN.md — Stop conditions (email click webhook, customer opt-out)
- [x] 24-11-PLAN.md — Campaign analytics and performance stats component

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
**Plans**: 11 plans in 7 waves (7 core + 4 gap closure)
Plans:
- [x] 25-01-PLAN.md — Install AI SDK and create foundation (client, prompts)
- [x] 25-02-PLAN.md — Zod schemas and input/output validation utilities
- [x] 25-03-PLAN.md — Core personalization function with fallback chain and rate limiting
- [x] 25-04-PLAN.md — Server action and cron processor integration
- [x] 25-05-PLAN.md — Preview components (samples, diff view, regenerate)
- [x] 25-06-PLAN.md — Stats tracking and settings UI (toggle, usage display)
- [x] 25-07-PLAN.md — Campaign creation/edit preview integration and database migration
- [x] 25-08-PLAN.md — Fix personalization toggle defect in cron processor (gap closure)
- [x] 25-09-PLAN.md — Profanity/inappropriate content detection (gap closure)
- [x] 25-10-PLAN.md — Multi-model routing: Gemini Flash, GPT-4o-mini, DeepSeek V3 (gap closure)
- [x] 25-11-PLAN.md — Cost tracking and monthly estimate in settings (gap closure)

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
**Plans**: 7 plans in 4 waves
Plans:
- [x] 26-01-PLAN.md — Database schema (customer_feedback table with RLS)
- [x] 26-02-PLAN.md — Token utilities and routing logic
- [x] 26-03-PLAN.md — TypeScript types, validations, and data functions
- [x] 26-04-PLAN.md — Star rating and feedback form components
- [x] 26-05-PLAN.md — Public review page (/r/[token]) with routing flow
- [x] 26-06-PLAN.md — API routes for rating and feedback submission
- [x] 26-07-PLAN.md — Feedback dashboard and navigation integration

### Phase 27: Dashboard Redesign
**Goal**: Dashboard transformed into operational command center with action summary banner, two-tier KPI widgets, ready-to-send queue with service-type urgency, and severity-sorted attention alerts.
**Depends on**: Phase 24 (campaign data exists), Phase 22 (jobs data exists), Phase 26 (feedback data exists)
**Requirements**: DASH-01, DASH-02, DASH-03, NAV-01, NAV-02, OPS-02, SVCT-04
**Success Criteria** (what must be TRUE):
  1. Dashboard displays two-tier KPI widgets (outcome: reviews, rating, conversion; pipeline: sends, sequences, pending) with trend comparisons
  2. Ready-to-send queue lists completed jobs not yet enrolled in campaign with quick enroll action and service-type-aware urgency flags
  3. Needs attention alerts display failed sends and unresolved negative feedback with contextual inline actions (Retry, Update contact, Respond)
  4. Action summary banner shows "All caught up" or itemized count of pending items
  5. Navigation includes Dashboard as first item with attention badge count and persistent "Add Job" button in sidebar
  6. Analytics page displays response rate and review rate breakdowns by service type
**Plans**: 7 plans in 4 waves
Plans:
- [ ] 27-01-PLAN.md — Dashboard data layer (types and Supabase queries)
- [ ] 27-02-PLAN.md — Action summary banner and KPI widgets components
- [ ] 27-03-PLAN.md — Ready-to-send queue with quick-enroll server action
- [ ] 27-04-PLAN.md — Attention alerts with contextual inline actions
- [ ] 27-05-PLAN.md — Dashboard page assembly and navigation updates
- [ ] 27-06-PLAN.md — Analytics page with service type breakdowns
- [ ] 27-07-PLAN.md — Build verification and visual checkpoint

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
**Plans**: 8 plans in 4 waves
Plans:
- [ ] 28-01-PLAN.md — Database schema, TypeScript types, and validation schemas
- [ ] 28-02-PLAN.md — Email authentication checklist in settings
- [ ] 28-03-PLAN.md — Server actions for onboarding steps
- [ ] 28-04-PLAN.md — Wizard shell expansion (2 to 7 steps)
- [ ] 28-05-PLAN.md — Step components 1-4 (Business, Review, Services, Software)
- [ ] 28-06-PLAN.md — Step components 5-7 (Campaign, Import, SMS Consent)
- [ ] 28-07-PLAN.md — Build verification and visual checkpoint
- [ ] 28-08-PLAN.md — Branded short links in settings (DLVR-03, Bitly integration)

### Phase 29: Agency-Mode Readiness
**Goal**: Multi-location data model schema added (no UI yet), weekly performance reports auto-generated, campaign playbooks exportable.
**Depends on**: Phase 27 (analytics exist), Phase 24 (campaigns exist)
**Requirements**: AGCY-01, AGCY-02, AGCY-03
**Success Criteria** (what must be TRUE):
  1. Multi-location data model schema added (business has location_id column, queries scoped by location_id) — no UI yet, schema-only
  2. Weekly performance report auto-generated every Monday (sends count, opens count, reviews count, response rate) and emailed to business owner
  3. Campaign playbooks exportable (download campaign config as JSON template, shareable across businesses)
**Plans**: 2 plans

### Phase 30: V2 Alignment & Audit Remediation
**Goal**: Complete V2 philosophy transformation where jobs are the primary entry point and customers are created as side effects. Add scheduled job status for dispatch workflow. Fix remaining audit issues: icon consistency, accessibility, empty states.
**Depends on**: Phase 22 (Jobs exist), Phase 20 (Customers exist), QA-AUDIT (issues identified)
**Requirements**: V2FL-01 to V2FL-12, V2UX-01 to V2UX-03, ICON-01, A11Y-01 to A11Y-04
**Success Criteria** (what must be TRUE):
  1. Add Job form includes inline customer creation with smart autocomplete (type name -> suggest existing -> create new if no match)
  2. Add Job form no longer requires selecting pre-existing customer — customer fields inline (name, email, phone)
  3. "Add Customer" button removed from Customers page header and empty state
  4. CSV import redesigned for jobs format (customer_name, email, phone, service_type, completion_date) — creates customers as side effect
  5. Onboarding Step 6 converted from customer import to job import
  6. "Add Job" sidebar button uses primary variant (bg-primary, not outline)
  7. Mobile floating action button (FAB) for "Add Job" visible on dashboard pages
  8. Customers page empty state says "Customers appear here as you complete jobs"
  9. All 27 lucide-react files migrated to @phosphor-icons/react
  10. Checkbox and icon button touch targets increased to 44px minimum
  11. All icon-only buttons have aria-label attributes
  12. Skip link added to root layout for accessibility
  13. Job status supports three states: scheduled -> completed -> do_not_send (campaign enrollment only on completed)
  14. Add Job form defaults to "scheduled" status (dispatch workflow: create job before work, mark complete after)
  15. Job Table shows "Mark Complete" button for scheduled jobs (one-click triggers campaign enrollment)
  16. Mobile job list supports one-tap complete from job card for technician in-field workflow
**Plans**: 10 plans in 4 waves
Plans:
- [ ] 30-01-PLAN.md — Smart customer autocomplete component with create-new fallback
- [ ] 30-02-PLAN.md — Scheduled job status database migration and validations
- [ ] 30-03-PLAN.md — Add Job form redesign with inline customer creation
- [ ] 30-04-PLAN.md — Job Table Mark Complete button and status badges
- [ ] 30-05-PLAN.md — Remove "Add Customer" CTAs and update empty states
- [ ] 30-06-PLAN.md — CSV job import (replaces customer import)
- [ ] 30-07-PLAN.md — Onboarding Step 6 conversion to job import
- [ ] 30-08-PLAN.md — Add Job CTA updates (primary variant + mobile FAB)
- [ ] 30-09-PLAN.md — Accessibility fixes (touch targets, aria-labels, skip link)
- [ ] 30-10-PLAN.md — Icon migration (remaining lucide-react files to Phosphor)

### Phase 30.1: Audit Gap Remediation
**Goal**: Address remaining gaps from UX-AUDIT.md and QA-AUDIT.md not covered by Phase 30. Excludes landing page changes.
**Depends on**: Phase 30 (V2 Alignment complete)
**Requirements**: Table skeletons, Send page friction, enrollment preview, campaign pagination, terminology fixes
**Success Criteria** (what must be TRUE):
  1. All data tables (Customers, Jobs, History) show skeleton loader during data fetch
  2. Send page renamed to "Manual Request" in sidebar and bottom nav
  3. Send page shows friction warning banner ("Campaigns handle this automatically")
  4. Jobs show campaign enrollment preview ("Will enroll in HVAC Campaign in 24h")
  5. Campaign detail page has pagination for enrollment list
  6. New campaign page shows guidance to use presets
  7. "Send Request" buttons changed to "Send Message"
  8. "email template" changed to "message template" in marketing
**Plans**: 8 plans in 3 waves
Plans:
- [x] 30.1-01-PLAN.md — Table skeleton loaders (Customers, Jobs, History)
- [x] 30.1-02-PLAN.md — Rename Send -> "Manual Request" + friction warning
- [x] 30.1-03-PLAN.md — Campaign enrollment preview on jobs
- [x] 30.1-04-PLAN.md — Campaign enrollment pagination
- [x] 30.1-05-PLAN.md — New campaign preset guidance
- [x] 30.1-06-PLAN.md — Add Job sidebar auto-open + Send->Message terminology
- [x] 30.1-07-PLAN.md — Campaign preset timing info display
- [x] 30.1-08-PLAN.md — History route vs Activity label alignment

### Phase 31: Landing Page V2 Rewrite
**Goal**: Landing page copy updated for V2 automation-first philosophy, replacing V1 manual-send messaging with job-completion workflow and home services positioning.
**Depends on**: None (copy-only changes, independent of dashboard features)
**Requirements**: LAND-01, LAND-02
**Success Criteria** (what must be TRUE):
  1. Hero headline emphasizes automation outcome ("3x More Reviews Without Lifting a Finger")
  2. Hero subheadline mentions job completion and automated follow-ups
  3. How It Works section shows V2 workflow: Complete a Job -> System Auto-Enrolls -> Automation Runs
  4. Problem section addresses lack of follow-up system (not "complex tools" which contradicts V2)
  5. Outcome cards emphasize automation benefits and review funnel protection
  6. Social proof strip lists home service industries (HVAC, Plumbing, Electrical, not generic)
  7. FAQ explains V2 concepts (campaigns, job completion, review funnel)
  8. Testimonials reflect home service businesses
  9. CTAs use first-person language ("Start My Free Trial")
  10. Pricing features mention campaigns and automation (not "review requests" or "contacts")
  11. No V1 language visible (no "Send review requests", "Add Contact", "Write Message")
**Plans**: 5 plans in 2 waves
Plans:
- [x] 31-01-PLAN.md — Hero and page metadata V2 update
- [x] 31-02-PLAN.md — Problem/Solution and How It Works V2 rewrite
- [x] 31-03-PLAN.md — Outcome cards, stats, and social proof V2 update
- [x] 31-04-PLAN.md — FAQ, testimonials, CTA, and pricing V2 update
- [x] 31-05-PLAN.md — Visual verification checkpoint

### Phase 32: Post-Onboarding Guidance
**Goal**: Help new users discover key features after onboarding with a persistent dashboard checklist and contextual tooltip hints on first visit to key pages.
**Depends on**: Phase 28 (onboarding complete), Phase 27 (dashboard)
**Requirements**: GUIDE-01 to GUIDE-06
**Success Criteria** (what must be TRUE):
  1. Dashboard shows "Getting Started" checklist card for new users (dismissible)
  2. Checklist tracks: Add first job, Set up campaign, Complete a job, Get first review
  3. Checklist progress persists in database (survives logout/login)
  4. Checklist items link to relevant pages with clear CTAs
  5. Checklist auto-hides when all items complete (or user dismisses)
  6. Jobs page shows tooltip hint on first visit: "Add your first job here" pointing at Add Job button
  7. Tooltip hints show once per user per page (tracked in localStorage)
  8. Hints are dismissible and non-blocking
  9. Checklist and hints reinforce V2 workflow (jobs -> campaigns -> automation)
**Plans**: 4 plans in 3 waves
Plans:
- [x] 32-01-PLAN.md — Database schema and types for checklist
- [x] 32-02-PLAN.md — Checklist data functions and UI component
- [x] 32-03-PLAN.md — Tooltip hints hook, component, and integration
- [x] 32-04-PLAN.md — Visual verification checkpoint

### Phase QA-AUDIT: Dashboard QA Test & UX Audit
**Goal**: Systematically test every page, button, and feature in the authenticated dashboard using Playwright MCP. Verify v2.0 campaign-first model coherence. Cross-check data against database. Identify UX gaps, broken flows, legacy references, orphaned features, and design inconsistencies.
**Depends on**: Phases 20-28 (dashboard features built)
**Success Criteria** (what must be TRUE):
  1. All 15 dashboard routes tested with screenshots in light+dark mode, desktop+mobile viewports
  2. Data consistency cross-checked (KPIs, counts, lists) against Supabase database queries
  3. Legacy terminology ("contacts", "send request", "email template") catalogued with file paths and severity
  4. V2 alignment assessed: navigation order, feature prominence, campaign-first model coherence
  5. Orphaned features identified (/scheduled page, legacy redirects)
  6. Per-page grades assigned (Pass/Needs Work/Fail) with overall dashboard health scorecard
  7. Complete report at docs/QA-AUDIT.md with actionable fix suggestions for every finding
**Plans**: 9 plans in 2 waves
Plans:
- [x] QA-AUDIT-01-PLAN.md — Login flow and onboarding wizard audit
- [x] QA-AUDIT-02-PLAN.md — Dashboard and analytics pages audit
- [x] QA-AUDIT-03-PLAN.md — Jobs and campaigns list pages audit
- [x] QA-AUDIT-04-PLAN.md — Campaign detail, edit, and new pages audit
- [x] QA-AUDIT-05-PLAN.md — Send page (Quick Send + Bulk Send) audit
- [x] QA-AUDIT-06-PLAN.md — Customers and feedback pages audit
- [x] QA-AUDIT-07-PLAN.md — History, billing, and settings pages audit
- [x] QA-AUDIT-08-PLAN.md — Orphaned routes, navigation, and cross-cutting checks
- [x] QA-AUDIT-09-PLAN.md — Compile final docs/QA-AUDIT.md report

### Phase QA-FIX: Audit Remediation
**Goal**: Fix all QA-AUDIT findings from docs/QA-AUDIT.md: 2 critical blockers, navigation order, orphaned routes, legacy terminology, icon inconsistencies, and code cleanup.
**Depends on**: QA-AUDIT (findings identified)
**Success Criteria** (what must be TRUE):
  1. C01 resolved: Onboarding Step 1 saves with phone number (phone column exists on businesses table)
  2. C02 resolved: Analytics page displays service type breakdown (get_service_type_analytics RPC exists)
  3. Sidebar navigation reordered for V2 (Jobs, Campaigns positions 2-3)
  4. /scheduled route removed (orphaned V1 feature)
  5. /components/contacts/ folder deleted (legacy duplicate)
  6. 47 user-facing terminology issues fixed (contact -> customer, review request -> message)
  7. 11 high-priority files migrated from lucide-react to Phosphor icons
  8. Send page components use Customer type (not Contact)
**Plans**: 5 plans in 3 waves
Plans:
- [x] QA-FIX-01-PLAN.md — Critical blockers (database migrations for C01 + C02)
- [x] QA-FIX-02-PLAN.md — Navigation reorder and orphaned route/folder cleanup
- [x] QA-FIX-03-PLAN.md — Terminology cleanup (47 user-facing issues)
- [x] QA-FIX-04-PLAN.md — Icon migration (11 high-priority files)
- [x] QA-FIX-05-PLAN.md — Code cleanup (Send page Contact -> Customer)

</details>

### v2.5 UI/UX Redesign (Phases 33-39)

**Milestone Goal:** Full warm design system overhaul (Stratify-inspired amber/gold palette with blue interactive primary) plus all-page UX fixes, onboarding consolidation from 7 to 5 steps, Manual Request page elimination, and dashboard pipeline-to-activity-strip upgrade.

**Coverage:** 30 requirements across 7 categories (DS, AUTH, DASH, ONB, JC, NAV, PG)

**Build order rationale:** Hardcoded color audit must complete before palette swap (Phase 33 before 34). Palette must be stable before card variants (34 before 35). Auth forms and Jobs/Campaigns UX are independent and parallel with Phase 35. Onboarding consolidation depends on warm form styling being stable (after 36). Manual Request elimination is highest structural risk — last.

---

### Phase 33: Hardcoded Color Audit
**Goal**: Every component uses semantic color tokens — no raw hex values remain — so the warm palette change in Phase 34 propagates cleanly to every component.
**Depends on**: Phase 32 (v2.0 complete)
**Requirements**: DS-04
**Success Criteria** (what must be TRUE):
  1. Running `grep -rn "bg-\[#\|text-\[#\|border-\[#" components/` returns zero hits
  2. `sidebar.tsx` active/hover state uses `bg-muted` instead of `bg-[#F2F2F2]`
  3. `app-shell.tsx` and `page-header.tsx` background colors use token utilities (`bg-card`, `bg-background`, `border-border`)
  4. Inline semantic colors (e.g., `bg-amber-50`, `bg-blue-50` in billing, campaigns, notification-bell) are replaced with token-based equivalents or documented for Phase 35 cleanup
  5. Lint and typecheck pass with zero errors
**Plans**: 2 plans in 1 wave

Plans:
- [x] 33-01-PLAN.md — Replace hardcoded hex values and raw color utilities in layout chrome + delete-account-dialog Button migration
- [x] 33-02-PLAN.md — Tier 2 inline color-scale class audit and Phase 35 documentation

### Phase 34: Warm Palette Token Replacement
**Goal**: The entire app renders with a warm amber/gold accent palette — cream backgrounds, warm borders, soft blue interactive primary — with WCAG AA contrast verified in both light and dark modes.
**Depends on**: Phase 33 (hardcoded colors removed)
**Requirements**: DS-01, DS-03
**Success Criteria** (what must be TRUE):
  1. `app/globals.css` `:root` block uses warm cream background (`36 20% 96%`), warm near-black foreground (`24 10% 10%`), soft blue primary (`213 60% 42%`), and amber accent (`38 92% 50%`)
  2. `.dark` block uses independently calibrated warm dark values — not lightness-inverted light mode values
  3. Two new semantic tokens (`--highlight`, `--highlight-foreground`, `--surface`, `--surface-foreground`) exist in `globals.css` and `tailwind.config.ts`
  4. All five status badges remain visually distinguishable when displayed side-by-side on the new warm background
  5. Primary button text passes WCAG AA contrast (4.5:1) on the new primary color value
  6. All 8 dashboard pages reviewed in both light and dark mode with no muddy, illegible, or cold-blue-looking areas
**Plans**: 2 plans in 2 waves

Plans:
- [x] 34-01-PLAN.md — CSS variable replacement (light + dark mode), tailwind.config.ts new tokens, status-badge.tsx migration, UI primitive accent-to-muted cleanup
- [x] 34-02-PLAN.md — Production build verification, WCAG contrast spot-checks, visual review checkpoint across all dashboard pages

### Phase 35: Card Variants & Dashboard Quick Wins
**Goal**: Users see a visually cohesive dashboard with amber-accented card styles, a personalized welcome greeting, improved stat card clickability affordance, and consistent spacing across all pages.
**Depends on**: Phase 34 (warm palette stable)
**Requirements**: DS-02, DS-05, DASH-01, DASH-02, DASH-03, DASH-04, PG-01, PG-02, PG-03, PG-04
**Success Criteria** (what must be TRUE):
  1. `card.tsx` has CVA variants (`amber`, `blue`, `green`, `red`, `ghost`, `subtle`) that can be applied without breaking any existing card usage
  2. `InteractiveCard` shows a right-arrow indicator on hover instead of a vertical translate lift, signaling navigability
  3. Dashboard top line shows "Good morning/afternoon, [First Name]" greeting from the user's session
  4. The 3 bottom pipeline metric cards are visually distinct from the 3 top outcome KPI cards (different variant, sizing, or layout treatment)
  5. Dashboard notification badge is removed from the sidebar Dashboard nav item
  6. Analytics page empty state shows an icon, heading, and suggested action (not a bare text line)
  7. All dashboard pages (dashboard, jobs, campaigns, analytics, customers, send, history, feedback, billing, settings) use consistent card padding (`p-6`) and section spacing (`space-y-6`)
**Plans**: 5 plans

Plans:
- [x] 35-01-PLAN.md — Card CVA variants and InteractiveCard arrow affordance
- [x] 35-02-PLAN.md — Semantic token infrastructure (warning, success, info, error-text)
- [x] 35-03-PLAN.md — Dashboard greeting, KPI card differentiation, badge removal, analytics empty state
- [x] 35-04-PLAN.md — Batch token replacement: warning banners, form validation, danger zone, AI indicators, SMS counters
- [x] 35-05-PLAN.md — Batch token replacement: status badges, consent, success/info callouts, CSV results, page padding normalization

### Phase 36: Auth Form Enhancements
**Goal**: Users can see what they are typing in password fields, get live feedback on password strength while signing up, and rely on Google OAuth working correctly.
**Depends on**: Phase 34 (warm palette stable, so forms render correctly)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. Login, signup, and password reset forms each have a show/hide toggle on the password field using Phosphor Eye/EyeSlash icons, with `tabIndex={-1}` on the toggle button so Tab skips it
  2. Signup and password reset forms show a live checklist beneath the password field tracking: minimum length, uppercase letter, number, and special character — updating as the user types
  3. Google OAuth sign-in completes successfully: clicking "Continue with Google" opens the Google consent screen and returns an authenticated session
  4. Email and password fields show clear required-field validation with inline error messages and visual indicators (red border, helper text) — not just browser-default validation
**Plans**: 3 plans in 2 waves

Plans:
- [x] 36-01-PLAN.md — PasswordInput component, aria-invalid Input styling, and auth form integration
- [x] 36-02-PLAN.md — Password requirements checklist component and Zod schema updates
- [x] 36-03-PLAN.md — Google OAuth verification and fix

### Phase 37: Jobs & Campaigns UX Fixes
**Goal**: The Jobs page service filter matches the business's configured services, the Add Job form intelligently handles name vs. email input, the known job creation bug is resolved, and campaign cards are fully interactive with correct layout details.
**Depends on**: Phase 35 (card variants available for campaign card updates)
**Requirements**: JC-01, JC-02, JC-03, JC-04, JC-05, JC-06, JC-07, JC-08, JC-09
**Success Criteria** (what must be TRUE):
  1. Jobs page service type filter only shows service types the business enabled during onboarding (from `service_types_enabled`) — an HVAC-only business sees only HVAC, not all 8 types
  2. Add Job form detects whether the user is typing a name or email address (via `@` detection) and adjusts the field label and input type accordingly
  3. Creating a new job succeeds end-to-end — the bug preventing job creation is identified, fixed, and verified with a successful create
  4. Campaign editor opens as a side panel or modal — users do not navigate to a separate full page to edit a campaign
  5. Clicking anywhere on a campaign card opens the campaign detail — internal controls (status toggle, menu) use `stopPropagation` to avoid triggering navigation
  6. The back button on campaign detail/edit pages has a normal-sized hit area (not oversized)
  7. The Standard campaign preset card is centered in the preset picker layout
  8. Saving changes to a campaign via the edit form persists correctly — the known save bug is identified, fixed, and verified with a successful edit round-trip
  9. Jobs page service type filter is visually distinct from the status filter (e.g., different styling, grouping, or chip treatment) so users can tell them apart at a glance
**Plans**: 3 plans

Plans:
- [x] 37-01-PLAN.md — Fix job creation bug and campaign save bug (touch persistence)
- [x] 37-02-PLAN.md — Service type filter scoping, smart name/email field, filter visual distinction
- [x] 37-03-PLAN.md — Campaign card full-click, edit as Sheet panel, back button fix, preset centering

### Phase 38: Onboarding Consolidation
**Goal**: New users complete a 5-step onboarding wizard (down from 7) with horizontal service tiles, plain-English campaign preset names, and a correctly-gated "Review campaign" checklist step.
**Depends on**: Phase 36 (auth form patterns stable, warm form styling in place)
**Requirements**: ONB-01, ONB-02, ONB-03, ONB-04, ONB-05
**Success Criteria** (what must be TRUE):
  1. Onboarding wizard has exactly 5 steps — the Google Review Destination step (duplicate of Step 1 field) and the Software Used step are removed; existing in-progress drafts are cleanly abandoned via a versioned localStorage key (`onboarding-draft-v2`)
  2. The Services step displays service options as horizontal selectable tiles or chips, not a vertical checkbox list — selecting "Other" reveals a text input for the user to type a custom service name
  3. Campaign preset options use plain-English names and descriptions — Gentle/Standard/Aggressive Follow-Up, no mention of "multi-touch sequence" or "touch #1/2/3"
  4. The Getting Started checklist pill uses warm amber accent styling consistent with the new palette (not cold blue)
  5. The "Review your campaign" checklist item only marks complete when the user actually navigates to and views their campaign page — it does not auto-complete on wizard finish
**Plans**: 3 plans in 1 wave

Plans:
- [x] 38-01-PLAN.md — Wizard step reduction (7 to 5) with localStorage key versioning
- [x] 38-02-PLAN.md — Horizontal service tiles and plain-English campaign preset copy
- [x] 38-03-PLAN.md — Getting started pill warm styling and campaign review step fix

### Phase 39: Manual Request Elimination & Dashboard Activity Strip
**Goal**: The dedicated Manual Request page and nav entry are removed — users can still trigger a one-off send via a modal on the Campaigns page or from the Customer detail drawer, and the Add Job flow offers a one-off send option for edge cases. The dashboard's 3 bottom pipeline metric cards are replaced with a compact Recent Campaign Activity strip showing concrete automation output ("what has the system done for me?").
**Depends on**: Phase 37 (Campaigns page UX stable, Add Job form updated)
**Requirements**: NAV-01, NAV-02, DASH-05
**Success Criteria** (what must be TRUE):
  1. "Manual Request" / "Send" no longer appears in sidebar navigation or mobile bottom nav
  2. Navigating to `/send` redirects to `/campaigns` (bookmarks and crawlers are handled — page is not 404'd)
  3. A "Send one-off" button on the Campaigns page opens a `QuickSendModal` with a friction warning — the form is pre-filled when opened from a Customer detail drawer
  4. The Add Job flow includes an option to trigger an immediate one-off send for edge-case situations where no campaign is appropriate
  5. All five server queries previously on the `/send` page are confirmed to have new homes before the redirect is added — no dashboard data is lost
  6. The 3 bottom pipeline metric cards (Requests Sent This Week, Active Sequences, Pending/Queued) are removed from the dashboard
  7. A `RecentCampaignActivity` strip replaces the bottom pipeline cards — showing the last 3-5 campaign events (touch sends, review clicks, feedback submissions, enrollment events) with clickable items, status badges, and relative timestamps
  8. The activity strip shows a compact counter summary (e.g., "12 active sequences · 3 pending") inline with the strip header, preserving the pipeline numbers in a non-card format
  9. The activity strip links to `/history` via a "View All" link and each item is clickable to open a detail drawer
  10. When no campaign activity exists yet, the strip shows an empty state: "No campaign activity yet — complete a job to get started"
  11. The `DashboardKPIs` type retains pipeline metrics for the activity strip counter summary but the 3 dedicated Card components are removed from `kpi-widgets.tsx`
**Plans**: 4 plans in 2 waves

Plans:
- [x] 39-01-PLAN.md — Server query migration audit, QuickSendForm extraction, and dashboard activity strip data layer
- [x] 39-02-PLAN.md — Dashboard pipeline cards → RecentCampaignActivity strip replacement
- [x] 39-03-PLAN.md — QuickSendModal component and Campaigns page integration
- [x] 39-04-PLAN.md — Add Job one-off send toggle and /send redirect

### v2.5.1 Bug Fixes & Polish (Phases 41-44)

**Milestone Goal:** Fix activity page bugs, polish dashboard queue styling, add CRM onboarding step, redesign sidebar active state, and ensure cross-page consistency for loading states and empty states.

**Coverage:** 15 requirements across 6 categories (ACT, DASH, ONB, SVC, NAV, UX)

**Build order rationale:** Activity page is self-contained and the biggest chunk of work (first). Dashboard + nav polish are small visual fixes (second). Cross-page consistency touches many files but is mechanical (third). Onboarding & services changes are independent and lower risk (last).

---

### Phase 41: Activity Page Overhaul
**Goal**: Activity page matches design standards with chip filters, date presets, correct resend behavior, and consistent page header.
**Depends on**: None (independent)
**Requirements**: ACT-01, ACT-02, ACT-03, ACT-04, ACT-05, ACT-06
**Success Criteria** (what must be TRUE):
  1. Bulk select header checkbox only selects rows with failed/bounced status — delivered/sent/opened rows are not selectable
  2. Resend button only visible on rows with failed/bounced status — not rendered for delivered/sent/opened rows
  3. Resend button is always visible inline (no hover-to-reveal opacity transition) for applicable rows
  4. Page title uses standard page header pattern matching other pages (PageHeader component or equivalent)
  5. Status filter uses chip-style filter bar (rounded-full pills, bg-primary when active) matching Jobs page filter pattern — same status options as current
  6. Date filter includes preset chips (Past Week, Past Month) alongside custom date range inputs — selecting a preset auto-fills the date range
**Plans**: 2 plans in 1 wave
Plans:
- [x] 41-01-PLAN.md — Fix resend logic (bulk select, button visibility, remove hover-to-reveal) + page header fix
- [x] 41-02-PLAN.md — Replace status dropdown with chip filters + add date preset chips

### Phase 42: Dashboard & Navigation Polish
**Goal**: Dashboard queue sections have consistent styling, functional dismiss for attention items, proper empty state, and sidebar active state redesigned.
**Depends on**: None (independent)
**Requirements**: DASH-01, DASH-02, DASH-03, NAV-01
**Success Criteria** (what must be TRUE):
  1. Needs Attention rows have no left colored border and match Ready to Send row icon sizing and layout
  2. Each Needs Attention item has an X dismiss button that hides it from the list
  3. Ready to Send empty state has dashed border, icon in circle (Briefcase) with correct styling
  4. Sidebar active nav item shows filled icon variant + brand orange text, no left border, same background color
**Plans**: 2 plans in 1 wave
Plans:
- [x] 42-01-PLAN.md — Needs Attention row styling, dismiss button, Ready to Send empty state
- [x] 42-02-PLAN.md — Sidebar active state redesign (filled icon + orange text, no left border)

### Phase 43: Cross-Page Consistency
**Goal**: All pages use consistent lazy loading (skeleton + progress bar) and empty state patterns (icon circle + title + subtitle + action button).
**Depends on**: None (independent)
**Requirements**: UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. All data pages (jobs, customers, history, feedback, analytics, billing, settings) show loading skeleton during data fetch — matching campaigns page loading.tsx pattern
  2. All pages (except dashboard) show consistent empty state: icon in rounded circle, title, subtitle, and contextual action button — matching campaigns empty state pattern
  3. Each empty state action button is relevant to the page (e.g., Jobs → "Add Job", Feedback → guidance text)
**Plans**: 2 plans in 1 wave
Plans:
- [x] 43-01-PLAN.md — Loading skeleton consistency across all pages (loading.tsx files)
- [x] 43-02-PLAN.md — Empty state consistency across all pages

### Phase 44: Onboarding & Services
**Goal**: New CRM platform onboarding step with logo cards, and multi-custom-service support in both onboarding and settings.
**Depends on**: None (independent)
**Requirements**: ONB-01, SVC-01, SVC-02
**Success Criteria** (what must be TRUE):
  1. Onboarding has CRM platform step with square logo cards (Jobber, Housecall Pro, ServiceTitan, GorillaDesk, FieldPulse, etc.), plus "None" and "Other" (with text input) options — step is skippable, positioned second-to-last (before SMS Consent)
  2. Onboarding services step "Other" option allows typing and adding multiple custom service names (tag-style input)
  3. Settings services section "Other" option allows adding multiple custom service names (matching onboarding pattern)
  4. CRM selection is saved to business record (software_used field) for future integration planning
**Plans**: 2 plans in 1 wave
Plans:
- [x] 44-01-PLAN.md — CRM platform onboarding step with logo cards + database field
- [x] 44-02-PLAN.md — Multiple custom services in onboarding and settings

### v2.5.2 UX Bugs & UI Fixes (Phases 45-47)

**Milestone Goal:** Drawer consistency overhaul, dashboard right panel KPI/activity redesign, dashboard queue row styling, campaign pause/resume bug fix, button hierarchy cleanup, touch template previews, and navigation rename.

**Coverage:** 21 requirements across 7 categories (DRW, DRKP, DQ, CAMP, CUI, BTN, NAV)

**Build order rationale:** Foundation first (no migrations, no behavior changes) — establishes component primitives and low-risk visual changes. Drawer consistency and campaign freeze second (depends on foundation SheetBody/DrawerLayout; campaign freeze is a data-integrity fix that must stop enrollment destruction as soon as possible). Dashboard right panel and campaign polish last (highest complexity: new data pipeline for sparklines, SSR guard required, Radix Select form state migration).

---

### Phase 45: Foundation + Visual-Only Changes
**Goal**: Component primitives are in place and all low-risk visual changes are shipped — button soft variant, navigation rename, and dashboard queue cosmetic updates that require no migrations or behavior changes.
**Depends on**: Phase 44 (v2.5.1 complete)
**Requirements**: BTN-01, BTN-02, NAV-01, DQ-01, DQ-02, DQ-03, DQ-04
**Success Criteria** (what must be TRUE):
  1. A `soft` button variant exists in `button.tsx` CVA and renders with muted background that does not compete with primary CTAs; secondary dashboard actions use the soft variant
  2. "Activity" label in sidebar and bottom nav displays as "History" — the /history route is unchanged
  3. Ready to Send and Needs Attention queue rows render as white card-like units with border-radius, not flat divide-y rows
  4. Ready to Send and Needs Attention empty states use a solid border with white background, not a dashed border
  5. Ready to Send empty state "Add Jobs" button opens the Add Job drawer directly, not navigate to /jobs
**Plans**: 3 plans in 2 waves

Plans:
- [x] 45-01-PLAN.md — Add `soft` button variant to CVA + dashboard button audit (BTN-01, BTN-02)
- [x] 45-02-PLAN.md — Rename "Activity" to "History" in sidebar and bottom nav (NAV-01)
- [x] 45-03-PLAN.md — Queue row card styling, empty state solid borders, Add Jobs drawer trigger (DQ-01, DQ-02, DQ-03, DQ-04)

### Phase 46: Drawer Consistency + Campaign Freeze Fix
**Goal**: All drawers use consistent white-background content grouping with sticky action buttons, and the campaign pause bug is fixed — pausing a campaign freezes enrollments in place instead of permanently destroying them.
**Depends on**: Phase 45 (SheetBody and SheetFooter shrink-0 foundation established)
**Requirements**: DRW-01, DRW-02, DRW-03, DRW-04, CAMP-01, CAMP-02, CAMP-03
**Success Criteria** (what must be TRUE):
  1. All drawers (Add Job, Edit Job, Job Detail, Customer Detail, Add Customer, Edit Customer) show content in white-background rounded sections with no borders or dividers — matching the request-detail-drawer reference pattern
  2. All drawer action buttons remain visible at the bottom without scrolling — the footer is sticky regardless of content height
  3. Job detail drawer button patterns are consistent with other drawers (same size, variant, placement)
  4. Add Job drawer width matches other drawers and is not narrower than the rest
  5. Pausing a campaign sets in-progress enrollments to `frozen` status — they are not marked `stopped` and do not lose remaining touches
  6. Re-enabling a paused campaign unfreezes all `frozen` enrollments — they resume from the same touch position
  7. The cron processor skips `frozen` enrollments while their campaign is paused — no touches send during the freeze period
**Plans**: 5 plans in 2 waves

Plans:
- [x] 46-01-PLAN.md — Supabase migration: add `frozen` to campaign_enrollments status constraint; update deleteCampaign to handle frozen rows (CAMP-02)
- [x] 46-02-PLAN.md — Fix toggleCampaignStatus to freeze/unfreeze enrollments; audit cron conflict resolver for paused-campaign edge case (CAMP-01, CAMP-02, CAMP-03)
- [x] 46-03-PLAN.md — DrawerLayout wrapper + SheetBody subcomponent + SheetFooter shrink-0 (foundation for all drawer migrations)
- [x] 46-04-PLAN.md — Apply drawer consistency to Add Job and Edit Job sheets (DRW-01, DRW-02, DRW-04)
- [x] 46-05-PLAN.md — Apply drawer consistency to Job Detail and Customer Detail drawers (DRW-01, DRW-02, DRW-03)

### Phase 47: Dashboard Right Panel + Campaign Polish + Radix Select
**Goal**: Dashboard right panel KPI cards show sparkline trend graphs with colored activity feed icons, campaign touch sequence shows template preview content, and Add Job form uses Radix Select components instead of native HTML selects.
**Depends on**: Phase 46 (campaign freeze fix landed; drawer consistency stable)
**Requirements**: DRKP-01, DRKP-02, DRKP-03, DRKP-04, CAMP-04, CUI-01, DRW-05
**Success Criteria** (what must be TRUE):
  1. KPI cards in the dashboard right panel have a light gray background and display a mini sparkline graph showing the 7-30 day trend for each metric
  2. KPI sparklines show an empty state (no broken chart or blank space) when fewer than 2 data points exist
  3. Recent Activity items in the right panel show distinct colored circle icons per event type — green for reviews, blue for sends, orange for feedback — with increased vertical spacing
  4. Pipeline counter row below KPI cards retains its compact horizontal layout and is not promoted to a full card
  5. Each touch in the campaign touch sequence editor shows an inline collapsible preview of the email or SMS template body, including system default templates
  6. Campaign detail page has received a visual retouch consistent with overall app design
  7. Add Job and Edit Job forms use Radix Select components with `onValueChange` (not `onChange`), and full form submit is verified end-to-end in Supabase
**Plans**: 4 plans in 2 waves

Plans:
- [x] 47-01-PLAN.md — Sparkline data pipeline: extend KPIMetric type with DayBucket history, add 14-day daily-bucket queries to getDashboardKPIs()
- [x] 47-02-PLAN.md — SVG sparkline component, KPI card gray backgrounds, colored activity feed icons, clickable activity items, pipeline row retention
- [x] 47-03-PLAN.md — Template preview modal per touch + campaign detail page visual retouch with richer enrollment rows
- [x] 47-04-PLAN.md — Radix Select migration in ServiceTypeSelect, AddJobSheet, and EditJobSheet with onValueChange


### v2.5.3 UX Bugs & UI Fixes Part 2 (Phases 48-49)

**Milestone Goal:** Fix Getting Started step 2 logic, campaign preset picker UX, custom service name propagation, Needs Attention dismiss, KPI navigation, page subtitle consistency, QuickSendModal redesign, and visual polish (white table rows, service pills).

**Coverage:** 15 requirements across 6 categories (GS, ONB, SVC, DASH, JOB, SUB, VIS)

**Build order rationale:** Behavior/logic fixes first (onboarding tracking, dashboard dismiss, KPI navigation, campaign dropdown) because they change how things work. Visual/propagation fixes second (custom service pills, page subtitles, white rows, QuickSendModal) because they change how things look and touch more files.

---

### Phase 48: Onboarding & Dashboard Behavior Fixes
**Goal**: Getting Started step 2 correctly tracks campaign page visits, campaign preset picker is clear and approachable, dashboard Needs Attention dismiss works, KPI cards navigate consistently, and Add Job offers a campaign creation path.
**Depends on**: Phase 44 (v2.5.1 complete)
**Requirements**: GS-01, GS-02, ONB-01, ONB-02, ONB-03, DASH-01, DASH-02, JOB-01
**Success Criteria** (what must be TRUE):
  1. Getting Started step 2 marks complete only after the user visits a campaign detail page — not when a campaign merely exists in the database
  2. If the onboarding-created campaign is deleted, visiting any other campaign detail page still marks step 2 complete
  3. Campaign preset picker during onboarding shows three options stacked vertically with Standard in the middle position, using plain-English descriptions (no "multi-touch sequence" or "touch #1/2/3" jargon)
  4. Campaign preset picker subtitle reads "You can change this later in Campaigns" (not "in Settings")
  5. Clicking the X dismiss button on a Needs Attention item removes it from the dashboard list immediately
  6. All three KPI stat cards on the dashboard navigate to /analytics when clicked (not split between /history and /analytics)
  7. Add Job campaign dropdown includes a "Create new campaign" option that opens the campaign creation flow when no campaigns exist for the selected service type
**Plans**: 2 plans in 1 wave
Plans:
- [x] 48-01-PLAN.md — Getting Started trigger, KPI links, dismiss verify, campaign selector
- [x] 48-02-PLAN.md — Campaign preset picker redesign: vertical stack, plain English, correct subtitle

### Phase 49: Custom Services, Visual Polish & Page Subtitles
**Goal**: Custom service names render correctly and propagate to all service selectors across the app, all pages have consistent subtitles, table rows have white backgrounds, and QuickSendModal matches the current design language.
**Depends on**: Phase 48 (behavior fixes landed)
**Requirements**: SVC-01, SVC-02, SVC-03, SUB-01, VIS-01, VIS-02, VIS-03
**Success Criteria** (what must be TRUE):
  1. Custom service name pills in onboarding and settings render at readable size without clipping or overflow
  2. Custom service names appear in the Add Job service type dropdown alongside standard service types
  3. Custom service names propagate to job filters, campaign service targeting selector, and any other service type selector in the app
  4. All app pages display a consistent subtitle pattern: static description followed by a centered dot and dynamic count (e.g., "Track your service jobs · 12 this month")
  5. Jobs table rows have white background (not transparent/gray alternating)
  6. Activity/history page rows have white background matching Jobs table treatment
  7. QuickSendModal has updated layout, spacing, and visual styling consistent with the current warm design system
**Plans**: 3 plans in 2 waves

Plans:
- [x] 49-01-PLAN.md — Custom service name pill sizing and propagation to selectors
- [x] 49-02-PLAN.md — QuickSendModal visual redesign
- [x] 49-03-PLAN.md — Page subtitle normalization and white table rows


### v2.5.4 Code Review (Phases 41-44) (Phases 50-51)

**Milestone Goal:** Systematic code review of all changes shipped in Phases 41-44 (v2.5.1 Bug Fixes & Polish), followed by remediation of all findings. Covers security, performance, V2 alignment, design system compliance, accessibility, and dead code.

**Coverage:** 15 requirements across 2 categories (AUD, FIX)

**Build order rationale:** Audit must complete before remediation can begin — Phase 50 produces the findings report that Phase 51 consumes. No parallelization possible between the two phases.

---

### Phase 50: Code Review & Audit
**Goal**: All code changes from Phases 41-44 are systematically reviewed across security, performance, V2 alignment, design system, accessibility, and code hygiene dimensions, with a severity-rated findings report ready for remediation.
**Depends on**: Phases 41-44 (v2.5.1 complete, code under review)
**Requirements**: AUD-01, AUD-02, AUD-03, AUD-04, AUD-05, AUD-06, AUD-07, AUD-08, AUD-09, AUD-10, AUD-11
**Success Criteria** (what must be TRUE):
  1. Every file modified in Phase 41 (Activity Page Overhaul) has been reviewed for correctness, security, and design system compliance — resend logic, chip filters, date presets, and page header
  2. Every file modified in Phase 42 (Dashboard & Navigation Polish) has been reviewed — queue styling, dismiss button, empty state, and sidebar active state
  3. Every file modified in Phase 43 (Cross-Page Consistency) has been reviewed — loading skeletons and empty states across all pages
  4. Every file modified in Phase 44 (Onboarding & Services) has been reviewed — CRM platform step and custom services
  5. A findings report exists at docs/CODE-REVIEW-41-44.md with every finding categorized by severity (Critical/High/Medium/Low), file location, line number, and fix recommendation
**Plans**: 3 plans in 2 waves
Plans:
- [x] 50-01-PLAN.md — UI component review (Phases 41-43, 22 files)
- [x] 50-02-PLAN.md — Onboarding & data layer review (Phase 44, 19 files)
- [x] 50-03-PLAN.md — Cross-cutting audit and consolidated findings report

### Phase 51: Audit Remediation
**Goal**: All Critical, High, and Medium findings from the Phase 50 code review are resolved, and Low findings are either fixed or documented with deferral rationale.
**Depends on**: Phase 50 (findings report produced)
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04
**Success Criteria** (what must be TRUE):
  1. Zero Critical findings remain open — all resolved with code changes verified by lint and typecheck
  2. Zero High findings remain open — all resolved with code changes verified by lint and typecheck
  3. Zero Medium findings remain open — all resolved with code changes verified by lint and typecheck
  4. Every Low finding is either fixed or has a documented deferral reason in the findings report
  5. Lint (`pnpm lint`) and typecheck (`pnpm typecheck`) pass with zero errors after all fixes applied
**Plans**: 3 plans in 2 waves
Plans:
- [x] 51-01-PLAN.md — Dashboard skeleton fixes, page spacing standardization, settings dedup
- [x] 51-02-PLAN.md — Security, validation, accessibility, and type correctness
- [x] 51-03-PLAN.md — History type migration, UI correctness, and dead code cleanup


### v3.0 Agency Mode (Phases 52-57)

**Milestone Goal:** Enable one user to own and manage multiple client businesses from a single account. A cookie-based active business resolver powers context switching across all pages. A new /businesses Clients page gives agency owners an at-a-glance view of every client with key metrics and an editable detail drawer. Each new business goes through the full onboarding wizard via a separate insert-only code path (never upsert). Unified billing pools send counts across all businesses.

**Coverage:** 23 requirements across 5 categories (FOUND, SWITCH, CLIENT, CREATE, BILL)

**Build order rationale:** Foundation before everything (resolver, provider, redirect logic must exist before data refactor begins). Data refactor before any UI (pages crash without it). Switcher UI after data is safe. Clients page after switcher exists (drawer uses Switch to Business button). Business creation after Clients page exists as the natural entry point. Billing last (requires real businesses with real sends to verify pooled limits).

---

### Phase 52: Multi-Business Foundation
**Goal**: The app has a single reliable entry point for resolving the active business — a cookie-based resolver, an extended provider, and correct redirect logic — so that every subsequent phase can build on a stable foundation.
**Depends on**: Phase 51 (v2.5.4 complete)
**Requirements**: FOUND-01, FOUND-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. A user with one business lands on the dashboard normally — no visible change from today
  2. A user with zero businesses is redirected to /onboarding — the existing behavior is preserved
  3. A user with multiple businesses and no active_business_id cookie is automatically assigned their first business and lands on the dashboard (no crash, no redirect to onboarding)
  4. BusinessSettingsProvider exposes businessId, businessName, and a businesses list — client components can read these without additional data fetching or prop drilling
  5. Lint and typecheck pass with zero errors
**Plans**: 2 plans

Plans:
- [x] 52-01-PLAN.md — getActiveBusiness() resolver, switchBusiness() action, getUserBusinesses() query
- [x] 52-02-PLAN.md — Extend BusinessSettingsProvider with business identity + dashboard redirect logic fix

### Phase 53: Data Function Refactor
**Goal**: Every data function and server action in the app reads the active business from the explicit businessId parameter rather than deriving it from user_id — eliminating the PGRST116 crash that occurs when a second business exists.
**Depends on**: Phase 52 (getActiveBusiness() resolver exists)
**Requirements**: FOUND-02, FOUND-03
**Success Criteria** (what must be TRUE):
  1. Zero instances of `.eq('user_id', ...).single()` remain in lib/data/ or lib/actions/ — verified by grep
  2. All page-level Server Components call getActiveBusiness() once and pass the result to downstream data functions as an explicit businessId parameter
  3. Creating a second test business and navigating to every dashboard page produces no PGRST116 errors and shows the correct business's data
  4. Lint and typecheck pass with zero errors
**Plans**: 2 plans

Plans:
- [x] 53-01-PLAN.md — Enumerate all .single() instances, refactor lib/data/ files
- [x] 53-02-PLAN.md — Refactor lib/actions/ files and page-level Server Components

### Phase 54: Business Switcher UI
**Goal**: Users can switch between their businesses using a dropdown at the top of the sidebar (desktop) and in the mobile header — the selected business name is always visible and all dashboard pages reflect the switch immediately.
**Depends on**: Phase 53 (data functions safe for multi-business)
**Requirements**: SWITCH-01, SWITCH-02, SWITCH-03, SWITCH-04
**Success Criteria** (what must be TRUE):
  1. A dropdown at the top of the sidebar shows the current business name and a chevron — clicking it reveals a list of all businesses the user owns
  2. Selecting a different business from the dropdown sets the active_business_id cookie and refreshes all dashboard pages to show that business's data
  3. The current business name is always visible in the sidebar at a glance — no interaction required to see which business is active
  4. On mobile, a business switcher is accessible from the header area above page content — agency owners can switch businesses without a desktop sidebar
**Plans**: 2 plans

Plans:
- [ ] 54-01-PLAN.md — BusinessSwitcher component (desktop sidebar integration)
- [ ] 54-02-PLAN.md — Mobile header switcher + visual polish

### Phase 55: Clients Page
**Goal**: Agency owners can see all their client businesses at a glance on /businesses, open a detail drawer with full agency metadata for each client, edit that metadata inline, and see competitive positioning at a glance.
**Depends on**: Phase 54 (switcher exists; "Switch to this business" button in drawer works)
**Requirements**: CLIENT-01, CLIENT-02, CLIENT-03, CLIENT-04, CLIENT-05, CLIENT-06, CLIENT-07, CLIENT-08
**Success Criteria** (what must be TRUE):
  1. Navigating to /businesses shows a responsive card grid — one card per client business
  2. Each card displays the business name, service type, Google rating, and reviews gained (current minus start count)
  3. Each card shows a visual indicator of the competitive gap — the difference between the client's review count and the competitor's review count
  4. Clicking a card opens a detail drawer showing: Google ratings (start vs current), review counts (start vs current), reviews gained, monthly fee, start date, GBP access status, competitor name and review count, and notes
  5. User can edit all agency metadata fields (ratings, fee, competitor info, dates) directly in the drawer — changes persist to the database
  6. Notes field in the drawer auto-saves with a debounce (no save button required for notes)
  7. The detail drawer includes a side-by-side competitive analysis section highlighting the gap between client and competitor review counts
**Plans**: 2 plans

Plans:
- [ ] 55-01-PLAN.md — businesses table migration (10 agency metadata columns) + data functions
- [ ] 55-02-PLAN.md — BusinessCard component and /businesses page grid
- [ ] 55-03-PLAN.md — BusinessDetailDrawer with all metadata fields, edit mode, auto-save notes

### Phase 56: Additional Business Creation
**Goal**: Agency owners can create additional client businesses from the Clients page using a safe insert-only code path that never overwrites existing businesses, with the new business going through the full onboarding wizard and becoming the active business on completion.
**Depends on**: Phase 55 (Clients page exists as the entry point for Add Business)
**Requirements**: CREATE-01, CREATE-02, CREATE-03, CREATE-04
**Success Criteria** (what must be TRUE):
  1. An "Add Business" button on the /businesses page initiates new business creation
  2. Creating a second (or third) business via the wizard leaves existing businesses completely unchanged — verified by checking that Business A's name, Google link, campaigns, and jobs are identical before and after creating Business B
  3. The new business creation flow uses the same 3-step onboarding wizard (business basics, campaign preset, SMS consent) — no wizard redesign required
  4. After completing the wizard for a new business, that business becomes the active business and the user is redirected to /dashboard showing the new business's data
**Plans**: 2 plans

Plans:
- [ ] 56-01-PLAN.md — createAdditionalBusiness() server action (insert-only) + onboarding routing
- [ ] 56-02-PLAN.md — Add Business button on Clients page + post-creation redirect

### Phase 57: Agency Billing
**Goal**: Send limits are enforced against the total sends across all businesses owned by the user — an agency owner cannot circumvent plan limits by distributing sends across multiple businesses.
**Depends on**: Phase 56 (multiple real businesses exist to test against)
**Requirements**: BILL-01, BILL-02
**Success Criteria** (what must be TRUE):
  1. Sending from Business A and Business B in the same billing period counts toward a single shared limit — verified by sending until the combined total reaches the plan limit and confirming the paywall triggers
  2. The Settings/Billing page displays pooled usage — the sends shown are the sum across all businesses the user owns, not just the currently active business
**Plans**: 2 plans

Plans:
- [ ] 57-01-PLAN.md — Pooled usage query (sum across all user's businesses) + billing page update


### Phase 58: Job Completion Form
**Goal**: Each business has a unique, public, mobile-optimized "Complete Job" form URL that technicians use on-site to submit customer info and complete a job — creating the customer record and auto-enrolling in the matching campaign without needing an AvisLoop account.
**Depends on**: Phase 52 (business resolver — form must resolve business from token), Phase 53 (data functions accept businessId)
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04
**Success Criteria** (what must be TRUE):
  1. Each business has a unique token-secured URL (e.g., `/complete/[token]`) that loads without authentication — a technician with only the link can access the form
  2. The form collects customer name, at least one of phone or email, and service type from the business's enabled types — and validates all fields before submission
  3. Submitting the form creates a completed job + customer record (or links to existing customer) and auto-enrolls in the matching campaign — identical to the owner completing a job in the dashboard
  4. The form is mobile-optimized with large touch targets, minimal fields, and a fast success confirmation — usable by a technician on-site in under 30 seconds
**Plans**: 2 plans

Plans:
- [ ] 58-01-PLAN.md — Token generation, storage, and public route with business resolution
- [ ] 58-02-PLAN.md — Mobile-optimized form UI and server action for job creation + campaign enrollment

---

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
| 21 (v2.0) | Review Follow-Up | 7/8 | Blocked (A2P) | - |
| **22 (v2.0)** | **Review Follow-Up** | **5/5** | **Complete** | **2026-02-04** |
| **23 (v2.0)** | **Review Follow-Up** | **7/7** | **Complete** | **2026-02-04** |
| **24 (v2.0)** | **Review Follow-Up** | **11/11** | **Complete** | **2026-02-04** |
| **25 (v2.0)** | **Review Follow-Up** | **11/11** | **Complete** | **2026-02-04** |
| **26 (v2.0)** | **Review Follow-Up** | **7/7** | **Complete** | **2026-02-04** |
| 27 (v2.0) | Review Follow-Up | 0/7 | Planned | - |
| 28 (v2.0) | Review Follow-Up | 0/8 | Planned | - |
| 29 (v2.0) | Review Follow-Up | 0/TBD | Not started | - |
| **30 (v2.0)** | **V2 Alignment** | **10/10** | **Complete** | **2026-02-06** |
| **30.1 (v2.0)** | **Audit Gap Remediation** | **8/8** | **Complete** | **2026-02-06** |
| **31 (v2.0)** | **Landing Page V2** | **5/5** | **Complete** | **2026-02-18** |
| **32 (v2.0)** | **Post-Onboarding Guidance** | **4/4** | **Complete** | **2026-02-18** |
| **QA-AUDIT** | **Dashboard Audit** | **9/9** | **Complete** | **2026-02-05** |
| **QA-FIX** | **Audit Remediation** | **5/5** | **Complete** | **2026-02-06** |
| **33** | **v2.5 UI/UX Redesign** | **2/2** | **Complete** | **2026-02-18** |
| **34** | **v2.5 UI/UX Redesign** | **2/2** | **Complete** | **2026-02-19** |
| **35** | **v2.5 UI/UX Redesign** | **5/5** | **Complete** | **2026-02-18** |
| **36** | **v2.5 UI/UX Redesign** | **3/3** | **Complete** | **2026-02-19** |
| **37** | **v2.5 UI/UX Redesign** | **3/3** | **Complete** | **2026-02-19** |
| **38** | **v2.5 UI/UX Redesign** | **3/3** | **Complete** | **2026-02-19** |
| **39** | **v2.5 UI/UX Redesign** | **4/4** | **Complete** | **2026-02-20** |
| **40** | **v2.6 Dashboard Command Center** | **6/6** | **Complete** | **2026-02-25** |
| **41** | **v2.5.1 Bug Fixes & Polish** | **2/2** | **Complete** | **2026-02-24** |
| **42** | **v2.5.1 Bug Fixes & Polish** | **2/2** | **Complete** | **2026-02-25** |
| **43** | **v2.5.1 Bug Fixes & Polish** | **2/2** | **Complete** | **2026-02-25** |
| **44** | **v2.5.1 Bug Fixes & Polish** | **2/2** | **Complete** | **2026-02-25** |
| **45** | **v2.5.2 UX Bugs & UI Fixes** | **3/3** | **Complete** | **2026-02-26** |
| **46** | **v2.5.2 UX Bugs & UI Fixes** | **5/5** | **Complete** | **2026-02-26** |
| **47** | **v2.5.2 UX Bugs & UI Fixes** | **4/4** | **Complete** | **2026-02-27** |
| **48** | **v2.5.3 UX Bugs Part 2** | **2/2** | **Complete** | **2026-02-25** |
| **49** | **v2.5.3 UX Bugs Part 2** | **3/3** | **Complete** | **2026-02-26** |
| **50** | **v2.5.4 Code Review** | **3/3** | **Complete** | **2026-02-26** |
| **51** | **v2.5.4 Code Review** | **3/3** | **Complete** | **2026-02-27** |
| **52** | **v3.0 Agency Mode** | **2/2** | **Complete** | **2026-02-27** |
| **53** | **v3.0 Agency Mode** | **2/2** | **Complete** | **2026-02-27** |
| 54 | v3.0 Agency Mode | 0/TBD | Not started | - |
| 55 | v3.0 Agency Mode | 0/TBD | Not started | - |
| 56 | v3.0 Agency Mode | 0/TBD | Not started | - |
| 57 | v3.0 Agency Mode | 0/TBD | Not started | - |
| 58 | v3.0 Agency Mode | 0/TBD | Not started | - |

**Total:** 232 plans complete across shipped phases.
