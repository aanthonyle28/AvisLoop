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
- **v3.0 Agency Mode** - Phases 52-58 (complete 2026-02-27)
- **v3.1 QA E2E Audit** - Phases 59-67 (complete 2026-03-03)
- **v3.1.1 QA Bug Fixes** - Phases 68-69 (in progress)

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
**Goal**: Users can create, view, and manage jobs with service types, and the system supports service-specific campaign timing configuration.
**Depends on**: Phase 20 (customers table stable)
**Requirements**: JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, JOB-06, JOB-07, JOB-08, SVCTYPE-01, SVCTYPE-02, SVCTYPE-03, SVCTYPE-04, SVCTYPE-05
**Success Criteria** (what must be TRUE):
  1. User can create jobs at /jobs with required fields: customer (linked from existing or new), service type, and status
  2. Jobs table displays with sortable columns and service type filter
  3. Editing a job updates all fields including service type and notes
  4. Deleting a job removes it and does not cascade to unintended records
  5. Service types page in Settings shows all 8 types with individual toggle and timing slider
  6. Saving service type settings persists to database and reflects in campaign enrollment logic
**Plans**: 5 plans

Plans:
- [x] 22-01-PLAN.md — jobs table migration with RLS, service types, status workflow
- [x] 22-02-PLAN.md — Job CRUD server actions (create, update, delete, list)
- [x] 22-03-PLAN.md — Jobs page UI (table, filters, add/edit/delete modals)
- [x] 22-04-PLAN.md — Settings: service types page (toggles, timing sliders)
- [x] 22-05-PLAN.md — Service type timing integration with campaign enrollment

### Phase 23: Campaign Engine
**Goal**: Users can create and manage multi-touch campaigns that automatically enroll jobs and send personalized review requests on a schedule.
**Depends on**: Phase 22 (jobs and service types exist)
**Requirements**: CAMP-01, CAMP-02, CAMP-03, CAMP-04, CAMP-05, CAMP-06, CAMP-07, CAMP-08, CAMP-09, CAMP-10, CAMP-11
**Success Criteria** (what must be TRUE):
  1. User can create a campaign with a name, service type targeting (or "all services"), and up to 4 touches
  2. Each touch specifies channel (email/SMS), delay hours, and template
  3. Completing a job auto-enrolls the customer in the matching campaign (service type or default)
  4. Campaign enrollment row exists in database with correct touch_1_scheduled_at timestamp
  5. Dashboard shows jobs in "Ready to Send" queue (enrolled but no touch sent yet)
  6. User can pause and resume a campaign — pausing freezes enrollments, resuming restores them
  7. User can delete a campaign with enrollment reassignment prompt
  8. Campaign preset picker shows 3 options (Gentle/Standard/Aggressive) with plain-English descriptions
**Plans**: 7 plans

Plans:
- [x] 23-01-PLAN.md — campaigns + campaign_touches + campaign_enrollments migrations
- [x] 23-02-PLAN.md — Campaign enrollment engine (job completion trigger, matching logic)
- [x] 23-03-PLAN.md — Campaign CRUD server actions
- [x] 23-04-PLAN.md — Campaign list page and preset picker
- [x] 23-05-PLAN.md — Campaign detail page with touch sequence editor
- [x] 23-06-PLAN.md — Campaign pause/resume with frozen enrollment logic
- [x] 23-07-PLAN.md — Campaign delete with enrollment reassignment

### Phase 24: Cron Touch Processor
**Goal**: Campaign touches are sent automatically on schedule by a cron job that claims due touches atomically, enforces quiet hours, and handles failures with retry logic.
**Depends on**: Phase 23 (enrollments exist, touch schedules set)
**Requirements**: CRON-01, CRON-02, CRON-03, CRON-04, CRON-05
**Success Criteria** (what must be TRUE):
  1. Cron runs every minute and processes all touches due in the current window
  2. Touch claiming is atomic (FOR UPDATE SKIP LOCKED) — no double-processing under parallel cron fires
  3. Quiet hours are enforced — touches due outside 8am-9pm customer local time are deferred
  4. Failed touch sends are marked failed and do not block subsequent touches
  5. Enrollment status advances to completed after the final touch is sent
**Plans**: 11 plans

Plans:
- [x] 24-01-PLAN.md — claim_due_scheduled_sends RPC (atomic claiming)
- [x] 24-02-PLAN.md — recover_stuck_scheduled_sends RPC
- [x] 24-03-PLAN.md — increment_customer_send_count RPC
- [x] 24-04-PLAN.md — Cron endpoint: process-campaign-touches
- [x] 24-05-PLAN.md — Email send logic for campaign touches
- [x] 24-06-PLAN.md — SMS send logic for campaign touches
- [x] 24-07-PLAN.md — Quiet hours enforcement in cron
- [x] 24-08-PLAN.md — Failure handling and retry logic
- [x] 24-09-PLAN.md — Enrollment status advancement (completed state)
- [x] 24-10-PLAN.md — Cron auth (fail-closed with CRON_SECRET)
- [x] 24-11-PLAN.md — Cron monitoring and alert triggers

### Phase 25: Review Funnel
**Goal**: Customers who click the review link in a campaign touch are routed through a pre-qualification page — 4-5 stars go to Google, 1-3 stars submit private feedback — and the enrollment stops automatically.
**Depends on**: Phase 24 (cron sends campaign touches with review link)
**Requirements**: FUNNEL-01, FUNNEL-02, FUNNEL-03, FUNNEL-04, FUNNEL-05, FUNNEL-06, FUNNEL-07, FUNNEL-08
**Success Criteria** (what must be TRUE):
  1. Review link in email/SMS resolves to /r/[token] with HMAC-signed token
  2. Token validates correctly and shows the business name + rating prompt
  3. Rating 4-5 redirects to the business's Google review link
  4. Rating 1-3 shows private feedback form — submission saves to customer_feedback table
  5. After any rating selection, the enrollment status is set to stopped (stop_reason = review_clicked or feedback_submitted)
  6. Invalid/expired tokens show a clear error page (not a crash)
**Plans**: 11 plans

Plans:
- [x] 25-01-PLAN.md — HMAC token generation and validation
- [x] 25-02-PLAN.md — /r/[token] server component and rating page
- [x] 25-03-PLAN.md — Google redirect (4-5 stars)
- [x] 25-04-PLAN.md — Feedback form (1-3 stars) and customer_feedback table
- [x] 25-05-PLAN.md — Enrollment stop on rating click
- [x] 25-06-PLAN.md — Invalid token error page
- [x] 25-07-PLAN.md — reviewed_at timestamp on send_logs
- [x] 25-08-PLAN.md — Feedback page in dashboard (list + resolution workflow)
- [x] 25-09-PLAN.md — Dashboard attention alerts for unresolved feedback
- [x] 25-10-PLAN.md — Analytics: review rate and conversion tracking
- [x] 25-11-PLAN.md — Rate limiting on /r/[token] route

### Phase 26: Dashboard & Analytics
**Goal**: Dashboard shows a complete pipeline view — KPI cards, sparklines, ready-to-send queue, attention alerts, and activity feed — plus an Analytics page with full metrics breakdown.
**Depends on**: Phase 25 (review funnel complete, reviewed_at data available)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, ANLYT-01, ANLYT-02
**Success Criteria** (what must be TRUE):
  1. KPI cards show reviews this month, average rating, conversion rate, sends this week, active sequences, and pending/queued
  2. Sparklines show 14-day trend for each KPI metric
  3. Ready-to-Send queue shows completed jobs not yet enrolled in a campaign
  4. Attention alerts show failed sends and unresolved feedback
  5. Analytics page shows full breakdown by service type with review counts and conversion rates
**Plans**: 7 plans

Plans:
- [x] 26-01-PLAN.md — getDashboardKPIs() with 14-day daily buckets
- [x] 26-02-PLAN.md — SVG sparkline component
- [x] 26-03-PLAN.md — DashboardShell two-column layout with RightPanel
- [x] 26-04-PLAN.md — ReadyToSendQueue and AttentionAlerts wired to layout
- [x] 26-05-PLAN.md — Recent activity feed with colored icons
- [x] 26-06-PLAN.md — Analytics page with service type breakdown
- [x] 26-07-PLAN.md — Mobile responsive dashboard (bottom sheet + compact KPI bar)

### Phase 30: V2 Alignment
**Goal**: All V1 UI patterns are removed or de-emphasized — "Add Customer" is gone from main nav, manual send has friction, Jobs is the primary action, and the nav reflects V2 hierarchy.
**Depends on**: Phase 26 (core V2 features shipped)
**Requirements**: V2-01, V2-02, V2-03, V2-04, V2-05, V2-06, V2-07, V2-08, V2-09, V2-10
**Success Criteria** (what must be TRUE):
  1. "Add Customer" button is not visible in main dashboard navigation
  2. Customers page moved to Settings > Customers tab
  3. Manual send page has a friction message explaining campaigns handle this automatically
  4. "Add Job" button uses primary (filled) variant, not outline
  5. Mobile FAB for Add Job exists on mobile layout
**Plans**: 10 plans

Plans:
- [x] 30-01-PLAN.md through 30-10-PLAN.md — V2 alignment changes (complete)

### Phase 30.1: Audit Gap Remediation
**Goal**: All findings from the UX audit that were not addressed in Phase 30 are resolved.
**Plans**: 8 plans
Plans:
- [x] 30.1-01-PLAN.md through 30.1-08-PLAN.md — Audit gap fixes (complete)

### Phase 31: Landing Page V2
**Goal**: Landing page repositioned for managed agency service.
**Plans**: 5 plans
Plans:
- [x] 31-01-PLAN.md through 31-05-PLAN.md — Agency landing page (complete)

### Phase 32: Post-Onboarding Guidance
**Goal**: WelcomeCard and Getting Started checklist guide new users through first job completion.
**Plans**: 4 plans
Plans:
- [x] 32-01-PLAN.md through 32-04-PLAN.md — Post-onboarding guidance (complete)

</details>

<details>
<summary>v2.5 UI/UX Redesign (Phases 33-39) - COMPLETE 2026-02-20</summary>

### Phase 33: Warm Design System
**Plans**: 2 plans
Plans:
- [x] 33-01-PLAN.md — Warm color palette and semantic token overhaul
- [x] 33-02-PLAN.md — Typography and spacing normalization

### Phase 34: Card & Component Overhaul
**Plans**: 2 plans
Plans:
- [x] 34-01-PLAN.md — Card CVA variants (default, interactive, muted)
- [x] 34-02-PLAN.md — InteractiveCard and component audit

### Phase 35: Dashboard Redesign
**Plans**: 5 plans
Plans:
- [x] 35-01-PLAN.md through 35-05-PLAN.md — Dashboard visual overhaul (complete)

### Phase 36: Auth Pages & Password Strength
**Plans**: 3 plans
Plans:
- [x] 36-01-PLAN.md — PasswordInput component + aria-invalid styling
- [x] 36-02-PLAN.md — Password requirements checklist + Zod schema updates
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

</details>

<details>
<summary>v2.5.1 Bug Fixes & Polish (Phases 41-44) - COMPLETE 2026-02-25</summary>

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

</details>

<details>
<summary>v2.5.2 UX Bugs & UI Fixes (Phases 45-47) - COMPLETE 2026-02-27</summary>

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

</details>

<details>
<summary>v2.5.3 UX Bugs & UI Fixes Part 2 (Phases 48-49) - COMPLETE 2026-02-26</summary>

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

</details>

<details>
<summary>v2.5.4 Code Review (Phases 50-51) - COMPLETE 2026-02-27</summary>

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

</details>

<details>
<summary>v3.0 Agency Mode (Phases 52-58) - COMPLETE 2026-02-27</summary>

### v3.0 Agency Mode (Phases 52-58) — COMPLETE

**Milestone Goal:** Enable one user to own and manage multiple client businesses from a single account. A cookie-based active business resolver powers context switching across all pages. A new /businesses Clients page gives agency owners an at-a-glance view of every client with key metrics and an editable detail drawer. Each new business goes through the full onboarding wizard via a separate insert-only code path (never upsert). Unified billing pools send counts across all businesses. Each business has a unique public job completion form URL for on-site technician use.

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
- [x] 54-01-PLAN.md — BusinessSwitcher component (desktop sidebar integration)
- [x] 54-02-PLAN.md — Mobile header switcher + visual polish

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
**Plans**: 3 plans

Plans:
- [x] 55-01-PLAN.md — businesses table migration (10 agency metadata columns) + data functions
- [x] 55-02-PLAN.md — BusinessCard component and /businesses page grid
- [x] 55-03-PLAN.md — BusinessDetailDrawer with all metadata fields, edit mode, auto-save notes

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
- [x] 56-01-PLAN.md — createAdditionalBusiness() server action (insert-only) + onboarding routing
- [x] 56-02-PLAN.md — Add Business button on Clients page + post-creation redirect

### Phase 57: Agency Billing
**Goal**: Send limits are enforced against the total sends across all businesses owned by the user — an agency owner cannot circumvent plan limits by distributing sends across multiple businesses.
**Depends on**: Phase 56 (multiple real businesses exist to test against)
**Requirements**: BILL-01, BILL-02
**Success Criteria** (what must be TRUE):
  1. Sending from Business A and Business B in the same billing period counts toward a single shared limit — verified by sending until the combined total reaches the plan limit and confirming the paywall triggers
  2. The Settings/Billing page displays pooled usage — the sends shown are the sum across all businesses the user owns, not just the currently active business
**Plans**: 2 plans

Plans:
- [x] 57-01-PLAN.md — Pooled usage query (sum across all user's businesses) + billing page update


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
- [x] 58-01-PLAN.md — Token generation, storage, and public route with business resolution
- [x] 58-02-PLAN.md — Mobile-optimized form UI and server action for job creation + campaign enrollment

</details>

---

### v3.1 QA E2E Audit (Phases 59-67) — IN PROGRESS

**Milestone Goal:** Comprehensive Playwright-driven E2E audit of all authenticated app pages and v3.0 agency features, producing per-page findings reports before production deployment. This is a findings-only milestone — no code changes, only documented observations with severity ratings.

**Coverage:** 97 requirements across 15 categories (AUTH, ONB, DASH, JOBS, CAMP, HIST, ANLYT, FDBK, BILL, SETT, BIZ, MULTI, FORM, EDGE, RPT)

**Phase ordering rationale:** Strictly data-dependency ordered. Auth creates the session; onboarding creates the first business; jobs creates the test data; campaigns reads enrollments from jobs; history/analytics/feedback reads data from campaigns; settings captures the form token; businesses creates the second business needed for isolation testing; public form uses the token from settings and runs edge cases last. No parallelization — each phase creates data the next phase depends on.

**Test account:** audit-test@avisloop.com / AuditTest123!

**Output location:** docs/qa-v3.1/ (per-page findings files + SUMMARY-REPORT.md)

---

### Phase 59: Auth Flows
**Goal**: All authentication paths are confirmed functional — the session is established and durable before any other audit phase begins.
**Depends on**: Phase 58 complete (v3.0 shipped)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. Tester can log in with email/password at /login and land on the dashboard with the correct business data visible
  2. Signing up with a new account creates the session and redirects to /onboarding (verified by URL and page content)
  3. Password reset email form submits without error; reset link resolves and accepts a new password
  4. Session remains active after page refresh, tab switch, and browser back/forward navigation (no unexpected logout)
  5. Submitting invalid credentials shows a clear, user-readable error message (not a raw server error or blank page)

Plans:
- [x] 59-01-PLAN.md — Auth flows audit: login, signup, password reset, session durability, error messages

### Phase 60: Onboarding Wizard
**Goal**: Both onboarding paths are confirmed functional — first-business wizard and additional-business wizard — and draft persistence is verified.
**Depends on**: Phase 59 (authenticated session established)
**Requirements**: ONB-01, ONB-02, ONB-03
**Success Criteria** (what must be TRUE):
  1. First-business onboarding wizard completes all 4 steps and results in a business record and default campaign existing in the database
  2. Additional business creation via ?mode=new completes the 3-step wizard and leaves all existing businesses' data completely unchanged
  3. Refreshing the browser mid-wizard retains the data entered in completed steps (localStorage draft persistence verified)

Plans:
- [x] 60-01-PLAN.md — Onboarding audit: first-business 4-step wizard, additional-business 3-step wizard, draft persistence

### Phase 61: Dashboard
**Goal**: The dashboard accurately reflects the active business's data across all widgets — in both empty-state and populated-state conditions.
**Depends on**: Phase 60 (business exists with campaign, producing dashboard data)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09, DASH-10, DASH-11
**Success Criteria** (what must be TRUE):
  1. KPI widget numbers match the counts verified by direct database query (no stale or misscoped data)
  2. Sparkline charts render with visible trend data when historical data exists; show a graceful empty state when data is absent
  3. Ready-to-Send queue shows completed jobs that have not yet been enrolled in a campaign
  4. Needs Attention alerts appear for failed sends and unresolved feedback; dismiss button removes the item immediately
  5. Recent activity feed shows the latest campaign events with correct timestamps relative to now
  6. Clicking any KPI card navigates to /analytics (not split between /history and /analytics)
  7. Getting Started card is not visible (production-mode suppressed)
  8. A business with zero data renders the dashboard empty state correctly without JavaScript errors
  9. Loading skeletons appear during data fetch on first load (no blank-screen flash)
  10. Mobile viewport (375px) renders the dashboard without horizontal overflow or broken layout
  11. Dark mode renders without muddy colors, incorrect contrast, or visual artifacts

Plans:
- [x] 61-01-PLAN.md — Dashboard audit: KPIs, sparklines, queue, alerts, activity, empty state, mobile, dark mode

### Phase 62: Jobs
**Goal**: The Jobs page is fully functional — creating, editing, filtering, and completing jobs all work correctly, and completing a job triggers campaign enrollment.
**Depends on**: Phase 61 (dashboard confirmed, ready for core action testing)
**Requirements**: JOBS-01, JOBS-02, JOBS-03, JOBS-04, JOBS-05, JOBS-06, JOBS-07, JOBS-08, JOBS-09, JOBS-10
**Success Criteria** (what must be TRUE):
  1. Jobs table renders with correct columns, and column header clicks sort the data
  2. Add Job drawer opens, all required fields validate, and a job is created and visible in the table after submission
  3. Edit Job drawer opens pre-populated with existing job data and saves changes correctly
  4. Job detail drawer displays complete information for the selected job
  5. Service type filter only shows the service types the business has enabled in Settings
  6. Status filter (scheduled / completed / do_not_send) correctly scopes the displayed rows
  7. Mark Complete action transitions a scheduled job to completed status (verified in DB)
  8. Completing a job with a matching campaign creates a campaign_enrollments row with correct touch_1_scheduled_at (verified in DB)
  9. Campaign selector dropdown in the Add Job drawer shows all available campaigns plus the "one-off" option
  10. A business with zero jobs renders the empty state without errors

Plans:
- [x] 62-01-PLAN.md — Jobs audit: table, add/edit/detail drawers, filters, mark complete, enrollment trigger, empty state

### Phase 63: Campaigns
**Goal**: Campaign management is fully functional — the list, detail, edit, preset picker, pause/resume, template preview, and conflict states all work correctly.
**Depends on**: Phase 62 (jobs completed and enrolled, providing campaign data to audit)
**Requirements**: CAMP-01, CAMP-02, CAMP-03, CAMP-04, CAMP-05, CAMP-06, CAMP-07, CAMP-08, CAMP-09, CAMP-10
**Success Criteria** (what must be TRUE):
  1. Campaign list page displays all campaigns with correct status badges (active/paused)
  2. Campaign detail page shows the touch sequence, enrolled customers list, and analytics counts
  3. Campaign edit sheet opens and saves changes to touch timing and template assignments correctly
  4. Campaign preset picker shows 3 options with correct plain-English descriptions
  5. Pausing a campaign sets all active enrollments to "frozen" status — verified by direct DB query (not "stopped")
  6. Resuming a paused campaign sets all frozen enrollments back to "active" — verified by direct DB query
  7. Template preview modal opens for each touch and shows the correct template content
  8. Campaign analytics section shows enrollment count, sends sent, and conversion rate that match DB values
  9. Jobs with enrollment conflicts display the correct badge state (conflict, queue_after, skipped) in the dashboard queue
  10. Creating a new campaign from a preset completes end-to-end and the campaign appears in the campaign list

Plans:
- [x] 63-01-PLAN.md — Campaigns audit: list, detail, edit, preset picker, pause/resume freeze, template preview, analytics, conflict states

### Phase 64: History, Analytics, and Feedback
**Goal**: All three read-heavy downstream pages display correctly scoped data with working filters, and the feedback resolution workflow persists correctly.
**Depends on**: Phase 63 (campaigns running, send logs and analytics data generated)
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, ANLYT-01, ANLYT-02, ANLYT-03, FDBK-01, FDBK-02, FDBK-03
**Success Criteria** (what must be TRUE):
  1. History page displays send logs with correct status badges scoped to the active business
  2. Status chip filters (delivered / failed / bounced / etc.) correctly filter the displayed rows
  3. Date preset chips (Today, Week, Month, 3 Months) filter rows to the correct time window
  4. Resend button appears only on failed/bounced rows — not on delivered or sent rows
  5. Bulk select only allows selection of failed/bounced rows — other rows cannot be checked
  6. Analytics page displays metrics that match database counts for the active business
  7. Service type breakdown table shows per-service enrollment and review counts
  8. Analytics empty state renders correctly when the active business has no send data
  9. Feedback page lists all submitted feedback entries with their star rating visible
  10. Marking a feedback item as resolved with internal notes persists after page refresh
  11. Feedback empty state renders correctly when no feedback has been submitted

Plans:
- [x] 64-01-PLAN.md — History audit: send logs, status filters, date presets, resend, bulk select
- [x] 64-02-PLAN.md — Analytics audit: metrics, service type breakdown, empty state
- [x] 64-03-PLAN.md — Feedback audit: list, resolution workflow, empty state

### Phase 65: Settings and Billing
**Goal**: All Settings tabs function correctly and persist changes after page refresh; the Billing page reflects pooled usage across all businesses.
**Depends on**: Phase 64 (core workflows confirmed — settings changes won't break prior audit phases)
**Requirements**: SETT-01, SETT-02, SETT-03, SETT-04, SETT-05, SETT-06, SETT-07, SETT-08, SETT-09, BILL-01, BILL-02, BILL-03
**Success Criteria** (what must be TRUE):
  1. General tab: business name, Google review link, and sender name are editable and persist after save + refresh
  2. General tab: form link section displays a shareable /complete/[token] URL with a working copy button
  3. Templates tab: template list displays all templates with channel badges (email / SMS)
  4. Templates tab: creating, editing, and deleting a template all work and reflect immediately in the list
  5. Services tab: service type toggles enable/disable correctly and persist after save
  6. Services tab: custom service names display and can be added or removed
  7. Customers tab: customer list displays with working search and tag filters
  8. Customers tab: adding, editing, and archiving a customer all work correctly
  9. All settings changes are still present after a full page reload (no silent discard)
  10. Billing page shows the current plan tier and a pooled send count covering all user-owned businesses
  11. Pooled usage count is the sum of sends across all businesses (not just the active one) — verified by arithmetic against per-business counts
  12. Plan comparison section renders all tiers with correct feature lists and pricing

Plans:
- [x] 65-01-PLAN.md — Settings General + Templates tabs audit
- [x] 65-02-PLAN.md — Settings Services + Customers tabs audit; capture form_token URL for Phase 67
- [x] 65-03-PLAN.md — Billing page audit: plan tier, pooled usage, plan comparison

### Phase 66: Businesses Page and Data Isolation
**Goal**: The Businesses (Clients) page and business switcher are fully functional; multi-business data isolation is verified end-to-end — no cross-contamination under switching.
**Depends on**: Phase 65 (all single-business pages confirmed — safe to introduce multi-business complexity)
**Requirements**: BIZ-01, BIZ-02, BIZ-03, BIZ-04, BIZ-05, BIZ-06, BIZ-07, MULTI-01, MULTI-02, MULTI-03, MULTI-04, MULTI-05, MULTI-06, MULTI-07, MULTI-08, MULTI-09
**Success Criteria** (what must be TRUE):
  1. Businesses page displays a card grid with one card per user-owned business
  2. Each card shows business name, service type(s), Google rating, and reviews gained
  3. Clicking a card opens the detail drawer with all agency metadata fields visible
  4. Editing metadata fields in the drawer persists to the database after save
  5. Notes auto-save without a save button — content is retained after page refresh
  6. "Switch to this business" button in the drawer changes the active business and updates all pages
  7. "Add Business" button initiates the new business creation wizard
  8. Business switcher dropdown shows all user-owned businesses on desktop sidebar
  9. Switching to a different business updates all dashboard pages to show that business's data
  10. Mobile business switcher is accessible and functional at 375px viewport
  11. A job created in Business B does NOT appear in the Jobs page when Business A is active (verified in UI and via DB query)
  12. Customers from Business B do NOT appear in Settings > Customers when Business A is active
  13. Campaigns from Business B do NOT appear in the Campaigns page when Business A is active
  14. Send logs from Business B do NOT appear in History when Business A is active
  15. Rapid business switching (5+ switches in 10 seconds) leaves the UI in a correct, non-broken state
  16. Two different user accounts cannot see each other's businesses, jobs, or customers (cross-user isolation verified)
**Plans**: 3 plans in 2 waves

Plans:
- [x] 66-01-PLAN.md — Businesses page audit: card grid, detail drawer, metadata editing, notes auto-save, switcher button
- [x] 66-02-PLAN.md — Business switcher audit: desktop, mobile, data refresh on switch
- [x] 66-03-PLAN.md — Data isolation audit: cross-business contamination checks + rapid switching + cross-user isolation

### Phase 67: Public Form, Edge Cases, and Report Compilation
**Goal**: The public job completion form is verified functional and adversarially tested; all cross-cutting edge cases are documented; and the final QA summary report is compiled.
**Depends on**: Phase 66 (all app routes confirmed; form_token captured in Phase 65; second business created in Phase 66)
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04, FORM-05, FORM-06, EDGE-01, EDGE-02, EDGE-03, EDGE-04, EDGE-05, EDGE-06, EDGE-07, EDGE-08, EDGE-09, RPT-01, RPT-02, RPT-03, RPT-04
**Success Criteria** (what must be TRUE):
  1. /complete/[token] loads without authentication and shows the correct business name and service types
  2. Form validates required fields (name + phone or email + service type) and shows clear errors on missing data
  3. Successful form submission creates a job and customer record in the database (verified via DB query)
  4. Form is usable on mobile (375px) with sufficiently large touch targets for on-site technician use
  5. An invalid or missing token shows a 404 page — not a crash, blank screen, or server error
  6. A long business name (50+ chars) is truncated without overflow in sidebar, switcher, and business cards
  7. A long customer name (50+ chars) is truncated without overflow in tables and drawers
  8. Special characters (quotes, ampersands, angle brackets) in all text fields render correctly without XSS or broken markup
  9. Per-page findings files exist for all 15 tested routes in docs/qa-v3.1/ — one file per route
  10. Each finding in every findings file has a severity rating (Critical / High / Medium / Low / Info), a location (file or URL + element), and a plain-language description
  11. A consolidated summary report exists at docs/qa-v3.1/SUMMARY-REPORT.md with an overall health scorecard and a prioritized top-10 fix list

Plans:
- [x] 67-01-PLAN.md — Public form audit: happy path, validation, mobile, invalid token (adversarial)
- [x] 67-02-PLAN.md — Edge case audit: long names, special characters, viewport tests (375px, 768px), loading states, empty states, dark mode
- [x] 67-03-PLAN.md — Report compilation: per-page findings review, summary report, health scorecard, priority fix list


### v3.1.1 QA Bug Fixes (Phases 68-69)

**Milestone Goal:** Fix all 10 bugs discovered during the v3.1 QA E2E Audit -- from the critical frozen enrollment migration to low-severity touch target sizing. Ship clean before production deployment.

**Coverage:** 10 requirements across 6 categories (CAMP-FIX, DASH-FIX, HIST-FIX, ONB-FIX, JOBS-FIX, FORM-FIX)

**Build order rationale:** Campaign bugs first because CAMP-FIX-01 (critical migration + error handling) must be applied before CAMP-FIX-02/03 can work (frozen status depends on the migration). All remaining fixes are independent and grouped into a single phase for efficiency.

---

### Phase 68: Campaign Bug Fixes
**Goal**: Campaign pause/resume works end-to-end -- the frozen enrollment migration is applied, constraint violations surface to the user, frozen enrollments display correctly in labels and stat cards, and template fallback resolves to the correct service type.
**Depends on**: Nothing (first phase in milestone)
**Requirements**: CAMP-FIX-01, CAMP-FIX-02, CAMP-FIX-03, CAMP-FIX-04
**Success Criteria** (what must be TRUE):
  1. Pausing a campaign sets its active enrollments to 'frozen' status in the database -- the CHECK constraint no longer blocks the value
  2. Resuming a paused campaign restores frozen enrollments to 'active' with recalculated scheduled times -- no enrollments are lost
  3. If a constraint violation or database error occurs during pause/resume, a toast error message is shown to the user -- errors are not silently swallowed
  4. Frozen enrollments display the label "Frozen" (not a missing-key fallback) in all enrollment status displays across the app
  5. The campaign detail page shows a "Frozen" stat card with the count of frozen enrollments alongside the existing Active/Completed/Stopped cards
  6. The touch sequence display resolves template names by filtering system templates to the campaign's service type before falling back to channel-only match -- an HVAC campaign does not show a Cleaning template name
**Plans**: TBD

Plans:
- [ ] 68-01-PLAN.md -- Apply frozen enrollment migration, add error handling to toggleCampaignStatus, add frozen label + stat card + template fallback fix

### Phase 69: Dashboard, History, and Miscellaneous Fixes
**Goal**: All remaining QA bugs are resolved -- dashboard KPI navigation works, mobile header fits at 375px, history date filter uses UTC, the software_used column exists, job table columns sort on click, and service type select meets touch target minimums.
**Depends on**: Phase 68 (campaign fixes applied first; these fixes are independent but sequenced after the critical bug)
**Requirements**: DASH-FIX-01, DASH-FIX-02, HIST-FIX-01, ONB-FIX-01, JOBS-FIX-01, FORM-FIX-01
**Success Criteria** (what must be TRUE):
  1. At least one dashboard element links to /analytics -- either the KPI cards are restored or the right panel compact cards navigate there
  2. The mobile header at 375px viewport width has zero horizontal overflow -- no content extends beyond the viewport edge
  3. The history page date range filter returns correct results regardless of the server's local timezone -- end-of-day is computed in UTC
  4. The onboarding CRM platform step successfully saves the selected software to the database -- the software_used column exists on the businesses table
  5. Clicking a column header on the Jobs table toggles sort order for that column -- ascending, descending, and unsorted states cycle correctly
  6. The ServiceTypeSelect trigger element has a minimum height of 44px -- meeting the WCAG touch target accessibility requirement
**Plans**: TBD

Plans:
- [ ] 69-01-PLAN.md -- Fix KPI navigation, mobile overflow, timezone bug, software_used column, sort handlers, touch target

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
| **54** | **v3.0 Agency Mode** | **2/2** | **Complete** | **2026-02-27** |
| **55** | **v3.0 Agency Mode** | **3/3** | **Complete** | **2026-02-27** |
| **56** | **v3.0 Agency Mode** | **2/2** | **Complete** | **2026-02-27** |
| **57** | **v3.0 Agency Mode** | **1/1** | **Complete** | **2026-02-27** |
| **58** | **v3.0 Agency Mode** | **2/2** | **Complete** | **2026-02-27** |
| **59** | **v3.1 QA E2E Audit** | **1/1** | **Complete** | **2026-02-28** |
| **60** | **v3.1 QA E2E Audit** | **1/1** | **Complete** | **2026-02-28** |
| **61** | **v3.1 QA E2E Audit** | **1/1** | **Complete** | **2026-02-28** |
| **62** | **v3.1 QA E2E Audit** | **1/1** | **Complete** | **2026-02-28** |
| **63** | **v3.1 QA E2E Audit** | **1/1** | **Complete** | **2026-03-02** |
| **64** | **v3.1 QA E2E Audit** | **3/3** | **Complete** | **2026-03-02** |
| **65** | **v3.1 QA E2E Audit** | **3/3** | **Complete** | **2026-03-02** |
| **66** | **v3.1 QA E2E Audit** | **3/3** | **Complete** | **2026-03-02** |
| **67** | **v3.1 QA E2E Audit** | **3/3** | **Complete** | **2026-03-03** |

| 68 | v3.1.1 QA Bug Fixes | 0/TBD | Not started | - |
| 69 | v3.1.1 QA Bug Fixes | 0/TBD | Not started | - |
**Total:** 259 plans complete across shipped phases.
