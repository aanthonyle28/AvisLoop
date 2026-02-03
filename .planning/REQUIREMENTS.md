# Requirements: AvisLoop v2.0

**Defined:** 2026-02-02
**Core Value:** Turn job completions into Google reviews automatically -- multi-touch follow-up sequences that send the right message at the right time.

## v2.0 Requirements

Requirements for Review Follow-Up System Redesign. Each maps to roadmap phases.

### Customers

- [ ] **CUST-01**: Contacts table renamed to Customers across codebase (DB, UI, routes, actions)
- [ ] **CUST-02**: Customer records include phone number field with validation
- [ ] **CUST-03**: Customers support taggable labels (VIP, repeat/recurring, commercial/residential, plus custom tags)
- [ ] **CUST-04**: Customer list page updated with new fields (phone, tags) and filtering

### Jobs

- [ ] **JOBS-01**: Jobs table with CRUD (list, add, edit, delete) and RLS policies
- [ ] **JOBS-02**: Each job has service type (HVAC, plumbing, electrical, cleaning, roofing, painting, handyman, other)
- [ ] **JOBS-03**: Each job has status (completed, do-not-send) with completion timestamp — no scheduled/in-progress workflow in v2.0
- [ ] **JOBS-04**: Each job is linked to exactly one customer (foreign key)
- [ ] **JOBS-05**: Job completion triggers campaign enrollment (when status → completed)
- [ ] **JOBS-06**: Jobs UI page with list view, add/edit forms, status management

### SMS & Messaging

- [ ] **SMS-01**: SMS sending via Twilio with delivery status tracking
- [ ] **SMS-02**: A2P 10DLC brand and campaign registration (pre-development blocker)
- [ ] **SMS-03**: TCPA-compliant opt-in tracking (separate sms_opt_in field, date, method, IP)
- [ ] **SMS-04**: STOP keyword webhook handling (STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT) with database update and confirmation message within 5 minutes
- [ ] **SMS-05**: Quiet hours enforcement (8am-9pm local time) using customer timezone with date-fns-tz
- [ ] **SMS-06**: Twilio webhook signature verification on all inbound requests
- [ ] **SMS-07**: Channel fallback logic (no phone → email only, no email → SMS only)
- [ ] **SMS-08**: SMS character counter in compose UI (160 char GSM-7 limit)
- [ ] **SMS-09**: send_logs extended with channel column (email/sms) and provider-specific IDs

### Campaigns & Sequences

- [ ] **CAMP-01**: Campaign presets (conservative: 2 emails; standard: 2 emails + 1 SMS; aggressive: 2 emails + 2 SMS) available out of the box
- [ ] **CAMP-02**: Duplicate & customize any preset campaign (edit touches, timing, channels)
- [ ] **CAMP-03**: Each campaign touch specifies channel (email/SMS), timing delay (hours/days after completion only), and template — max 4 touches per campaign
- [ ] **CAMP-04**: Automatic stop conditions: review completed, customer opted out, campaign paused by owner
- [ ] **CAMP-05**: Campaign enrollment tracking per job and per touch (active, paused, completed, stopped)
- [ ] **CAMP-06**: Campaign processing via extended cron with claim_due_campaign_touches() RPC using FOR UPDATE SKIP LOCKED
- [ ] **CAMP-07**: Campaign performance analytics (open/click/conversion rates per touch, per campaign)
- [ ] **CAMP-08**: Service-type rules on campaigns (e.g., "only enroll HVAC jobs" or "all service types")

### LLM Personalization

- [ ] **LLM-01**: Vercel AI SDK integration with GPT-4o-mini primary, Claude Haiku fallback on constraint violations
- [ ] **LLM-02**: personalizeMessage() function with structured variable injection (customer name, service type, technician name, business name)
- [ ] **LLM-03**: Personalization level fixed at "Medium" (rewrite for tone/warmth, no invented details)
- [ ] **LLM-04**: Input sanitization before LLM (prevent prompt injection from customer data)
- [ ] **LLM-05**: Output validation (length limits, no HTML/script tags, no invented URLs, placeholder verification)
- [ ] **LLM-06**: Graceful fallback to raw template on any LLM failure (never blocks sends)
- [ ] **LLM-07**: Rewrite contract: LLM may adjust tone/phrasing but must preserve all factual content, review link, and opt-out language
- [ ] **LLM-11**: Hard constraint: LLM may only rewrite approved templates using provided fields — cannot introduce new claims, discounts, promises, or invented job details
- [ ] **LLM-08**: Auto-fallback triggers: timeout >3s, output >2x template length, missing required placeholders, profanity/inappropriate content
- [ ] **LLM-09**: Preview at scale: batch preview of personalized messages before campaign launch (show 3-5 sample outputs)
- [ ] **LLM-10**: Rate limiting per business (100 LLM calls/hour) with cost tracking

### Review Funnel

- [ ] **REVW-01**: Pre-qualification page (1-5 star satisfaction rating) before review redirect
- [ ] **REVW-02**: Conditional routing: 4-5 stars → Google review link, 1-3 stars → private feedback form
- [ ] **REVW-03**: Internal feedback storage with business owner notification on negative feedback
- [ ] **REVW-04**: No review gating language — page frames as "share your experience" not "leave a review if happy"

### Dashboard

- [ ] **DASH-01**: Pipeline KPIs widget (jobs ready to send, active campaigns, reviews this month, response rate)
- [ ] **DASH-02**: Ready-to-send queue (completed jobs not yet enrolled in campaign)
- [ ] **DASH-03**: Needs attention alerts (failed sends, STOP requests, campaign issues, budget warnings)
- [ ] **DASH-04**: Quick actions (add job, enroll in campaign, send manual request)
- [ ] **DASH-05**: Daily to-do list: prioritized action items (jobs to close out, follow-ups due, issues to resolve)

### Onboarding

- [ ] **ONBD-01**: Step 1 — Business basics (name, Google review link, phone number)
- [ ] **ONBD-02**: Step 2 — Review destination setup (Google review link verification)
- [ ] **ONBD-03**: Step 3 — Services offered selection (multi-select from service taxonomy, sets timing defaults)
- [ ] **ONBD-04**: Step 4 — Software used (ServiceTitan/Jobber/HCP/none — captured for future integrations)
- [ ] **ONBD-05**: Step 5 — Default campaign selection (pick preset, auto-creates campaign)
- [ ] **ONBD-06**: Step 6 — Import customers (CSV upload or manual add, with phone number collection)
- [ ] **ONBD-07**: SMS opt-in explanation during onboarding with consent capture

### Navigation

- [ ] **NAV-01**: Navigation restructured: Send/Queue, Customers, Jobs, Campaigns, Activity/History
- [ ] **NAV-02**: Navigation badges show pending counts (queued sends, attention items)

### Templates

- [ ] **TMPL-01**: Unified message_templates table supporting both email and SMS channels
- [ ] **TMPL-02**: Template CRUD with channel selector (email/SMS) and character limit enforcement
- [ ] **TMPL-03**: Default templates per service category (HVAC, plumbing, electrical, etc.)
- [ ] **TMPL-04**: Migration from existing email_templates to message_templates (backward compatible)

### Service-Type Timing

- [ ] **SVCT-01**: Service taxonomy as first-class setting (selected during onboarding, used in jobs, campaigns, analytics)
- [ ] **SVCT-02**: Default timing per service type (HVAC: 24h, plumbing: 48h, electrical: 24h, cleaning: 4h, roofing: 72h — configurable)
- [ ] **SVCT-03**: Timing defaults auto-applied when creating campaigns for specific service types
- [ ] **SVCT-04**: Analytics breakdowns by service type (response rate, review rate per service)

### Deliverability & Trust

- [ ] **DLVR-01**: SPF/DKIM/DMARC setup guidance in onboarding/settings (checklist with verification status)
- [ ] **DLVR-02**: Branded sender identity (business name in From field for email, business name in SMS sender)
- [ ] **DLVR-03**: Branded short links for review URLs (trust signal, not raw Google URL)

### Compliance & Reputation

- [ ] **COMP-01**: SMS consent audit trail (opt-in date, method, IP address stored per customer)
- [ ] **COMP-02**: No review gating — satisfaction filter frames as "share experience" not conditional review request
- [ ] **COMP-03**: Throttling and pacing: spread sends across time windows to avoid spam flags (max N sends/hour per business)
- [ ] **COMP-04**: Exception handling: graceful degradation on provider failures (Twilio down → queue for retry, Resend down → queue for retry)

### Operational

- [ ] **OPS-01**: Daily to-do list on dashboard: prioritized action items for business owner
- [ ] **OPS-02**: Exception handling dashboard: failed sends, webhook errors, budget warnings with suggested actions
- [ ] **OPS-03**: Send throttling/pacing controls per business (configurable max sends per hour)

### Agency-Mode Readiness

- [ ] **AGCY-01**: Multi-location data model (business has location_id, queries scoped by location) — schema only, no UI yet
- [ ] **AGCY-02**: Weekly performance report (auto-generated summary: sends, opens, reviews, response rate) — email to business owner
- [ ] **AGCY-03**: Exportable campaign playbooks (download campaign config as shareable template)

### Landing Page

- [ ] **LAND-01**: Landing page copy updated for home services positioning (follow-up system, not single-send tool)
- [ ] **LAND-02**: Existing sections (hero, problem/solution, how it works, stats, outcome cards) updated with v2.0 messaging

## Future Requirements

Deferred to later milestones. Captured for traceability.

### Integrations
- **INTG-01**: ServiceTitan API integration (auto-create jobs from completed work orders)
- **INTG-02**: Jobber API integration (sync customers and jobs)
- **INTG-03**: Housecall Pro API integration (sync customers and jobs)

### Review Inbox
- **RINB-01**: Ingest reviews from Google Business Profile
- **RINB-02**: Review inbox dashboard (all reviews in one place)
- **RINB-03**: AI-generated review reply suggestions

### Advanced Features
- **ADV-01**: Multi-language SMS/email templates
- **ADV-02**: Two-way SMS conversations
- **ADV-03**: Video testimonial collection
- **ADV-04**: QR codes and NFC cards for review requests
- **ADV-05**: Visual workflow builder for campaigns
- **ADV-06**: Team roles and permissions

### Agency Features
- **AGCY-04**: Agency dashboard (multi-business management UI)
- **AGCY-05**: White-label option
- **AGCY-06**: Client reporting portal

## Out of Scope

| Feature | Reason |
|---------|--------|
| 200+ review platform integrations | Google only for MVP, others later |
| Multi-language support | English-first for home services market |
| Two-way SMS conversations | STOP handling only, no chat |
| FSM software integrations | Capture software used, build integrations later |
| Visual workflow builder | Overkill for 3-touch sequences |
| White-label widget | Brand visibility is a trust signal |
| AI review response automation | Risky for public-facing responses |
| LLM personalization slider UI | Fixed at Medium, simplifies UX |
| Industry-specific landing pages | Single page with home services copy |
| Service history view per customer | Deferred, jobs list sufficient for now |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CUST-01 | TBD | Pending |
| CUST-02 | TBD | Pending |
| CUST-03 | TBD | Pending |
| CUST-04 | TBD | Pending |
| JOBS-01 | TBD | Pending |
| JOBS-02 | TBD | Pending |
| JOBS-03 | TBD | Pending |
| JOBS-04 | TBD | Pending |
| JOBS-05 | TBD | Pending |
| JOBS-06 | TBD | Pending |
| SMS-01 | TBD | Pending |
| SMS-02 | TBD | Pending |
| SMS-03 | TBD | Pending |
| SMS-04 | TBD | Pending |
| SMS-05 | TBD | Pending |
| SMS-06 | TBD | Pending |
| SMS-07 | TBD | Pending |
| SMS-08 | TBD | Pending |
| SMS-09 | TBD | Pending |
| CAMP-01 | TBD | Pending |
| CAMP-02 | TBD | Pending |
| CAMP-03 | TBD | Pending |
| CAMP-04 | TBD | Pending |
| CAMP-05 | TBD | Pending |
| CAMP-06 | TBD | Pending |
| CAMP-07 | TBD | Pending |
| CAMP-08 | TBD | Pending |
| LLM-01 | TBD | Pending |
| LLM-02 | TBD | Pending |
| LLM-03 | TBD | Pending |
| LLM-04 | TBD | Pending |
| LLM-05 | TBD | Pending |
| LLM-06 | TBD | Pending |
| LLM-07 | TBD | Pending |
| LLM-08 | TBD | Pending |
| LLM-09 | TBD | Pending |
| LLM-10 | TBD | Pending |
| LLM-11 | TBD | Pending |
| REVW-01 | TBD | Pending |
| REVW-02 | TBD | Pending |
| REVW-03 | TBD | Pending |
| REVW-04 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| DASH-03 | TBD | Pending |
| DASH-04 | TBD | Pending |
| DASH-05 | TBD | Pending |
| ONBD-01 | TBD | Pending |
| ONBD-02 | TBD | Pending |
| ONBD-03 | TBD | Pending |
| ONBD-04 | TBD | Pending |
| ONBD-05 | TBD | Pending |
| ONBD-06 | TBD | Pending |
| ONBD-07 | TBD | Pending |
| NAV-01 | TBD | Pending |
| NAV-02 | TBD | Pending |
| TMPL-01 | TBD | Pending |
| TMPL-02 | TBD | Pending |
| TMPL-03 | TBD | Pending |
| TMPL-04 | TBD | Pending |
| SVCT-01 | TBD | Pending |
| SVCT-02 | TBD | Pending |
| SVCT-03 | TBD | Pending |
| SVCT-04 | TBD | Pending |
| DLVR-01 | TBD | Pending |
| DLVR-02 | TBD | Pending |
| DLVR-03 | TBD | Pending |
| COMP-01 | TBD | Pending |
| COMP-02 | TBD | Pending |
| COMP-03 | TBD | Pending |
| COMP-04 | TBD | Pending |
| OPS-01 | TBD | Pending |
| OPS-02 | TBD | Pending |
| OPS-03 | TBD | Pending |
| AGCY-01 | TBD | Pending |
| AGCY-02 | TBD | Pending |
| AGCY-03 | TBD | Pending |
| LAND-01 | TBD | Pending |
| LAND-02 | TBD | Pending |

**Coverage:**
- v2.0 requirements: 76 total across 14 categories
- Unmapped: 0 (all will be mapped by roadmapper)

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02*
