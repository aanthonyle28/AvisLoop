# Requirements: AvisLoop

**Defined:** 2026-01-25
**Core Value:** Make requesting reviews so simple that business owners actually do it -- one contact, one click, done.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User can reset password via email link
- [x] **AUTH-04**: User session persists across browser refresh and device restarts

### Business Profile

- [x] **BUSI-01**: User can create a business with name
- [x] **BUSI-02**: User can add/edit Google review link for their business
- [x] **BUSI-03**: User can select a default email template
- [x] **BUSI-04**: User can set a default sender name for emails (optional)

### Contacts

- [x] **CONT-01**: User can add a contact with name and email
- [x] **CONT-02**: User can edit an existing contact's details
- [x] **CONT-03**: User can archive a contact
- [x] **CONT-04**: User can view a list of all contacts
- [x] **CONT-05**: User can import contacts via CSV upload
- [x] **CONT-06**: User can search contacts by name or email
- [x] **CONT-07**: User can filter contacts (e.g., by date added, archived)
- [x] **CONT-08**: User can restore an archived contact
- [x] **CONT-09**: System prevents duplicate contacts (same email)
- [x] **CONT-10**: Empty states show helpful prompts when no contacts exist

### Send Review Request

- [x] **SEND-01**: User can select a contact and send a review request email
- [x] **SEND-02**: User can preview the message before sending
- [x] **SEND-03**: User can edit the message template (subject + body)
- [x] **SEND-04**: User sees immediate "Sent" confirmation after sending
- [x] **SEND-05**: System logs every send attempt with status
- [x] **SEND-06**: System enforces cooldown period between sends to same contact
- [x] **SEND-07**: System respects contact opt-out preferences
- [x] **SEND-08**: System enforces monthly send limits per tier
- [x] **SEND-09**: System rate-limits sending to prevent abuse
- [x] **SEND-10**: System updates message status on delivery/failure via webhooks

### Message History

- [x] **HIST-01**: User can view list of all sent messages
- [x] **HIST-02**: User can see message status (sent, delivered, failed, opened)
- [x] **HIST-03**: User can filter message history by date range
- [x] **HIST-04**: User can search message history by recipient

### Onboarding

- [x] **ONBD-01**: New user is guided through setup wizard (business -> review link -> contact -> first send)
- [x] **ONBD-02**: Wizard shows progress indicator (step X of Y)
- [x] **ONBD-03**: User can skip onboarding steps
- [x] **ONBD-04**: Dashboard shows "next best action" after onboarding
- [x] **ONBD-05**: Onboarding pre-fills smart defaults where possible
- [x] **ONBD-06**: Dashboard shows onboarding checklist until complete
- [x] **ONBD-07**: System blocks sending if review link is missing or invalid
- [x] **ONBD-08**: System blocks sending if no contacts exist

### Billing

- [x] **BILL-01**: New users get 25 free trial sends
- [x] **BILL-02**: Basic tier ($49/mo) includes 200 sends/month, 200 contacts
- [x] **BILL-03**: Pro tier ($99/mo) includes 500 sends/month, unlimited contacts
- [x] **BILL-04**: User can subscribe via Stripe checkout
- [x] **BILL-05**: User is prompted to subscribe when trial sends exhausted
- [x] **BILL-06**: User can manage subscription (view plan, cancel) via billing page
- [x] **BILL-07**: System enforces tier limits (contacts, sends)

### Public Pages

- [x] **PAGE-01**: Landing page explains product value proposition
- [x] **PAGE-02**: Pricing page shows tier comparison
- [x] **PAGE-03**: Login page for returning users
- [x] **PAGE-04**: Signup page for new users

## v1.1 Requirements

Requirements for Scheduled Sending milestone. Each maps to roadmap phases.

### Scheduling

- [x] **SCHED-01**: User can schedule a review request for future delivery using presets (In 1 hour, Next morning, In 24 hours)
- [x] **SCHED-02**: User can schedule a review request for a custom date and time
- [x] **SCHED-03**: User sees confirmation with scheduled time after scheduling

### Management

- [x] **MGMT-01**: User can view a list of all scheduled sends with status and send time
- [x] **MGMT-02**: User can cancel a pending scheduled send
- [x] **MGMT-03**: User can see partial send results (sent/skipped/failed counts) after processing
- [x] **MGMT-04**: User can reschedule multiple pending sends to a different time

### Processing

- [x] **PROC-01**: Cron endpoint processes due scheduled sends every minute
- [x] **PROC-02**: System re-validates business rules (opt-out, cooldown, quota) at send time
- [x] **PROC-03**: Service role client bypasses RLS for cron operations
- [x] **PROC-04**: Cron endpoint logs structured output for each run

### Navigation

- [x] **NAV-01**: Sidebar and mobile nav include Scheduled sends link
- [x] **NAV-02**: Dashboard shows count of pending scheduled sends

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Channels

- **CHAN-01**: User can send review requests via SMS (Twilio)
- **CHAN-02**: User can choose preferred channel per contact

### Multi-Location

- **MLOC-01**: Pro users can create multiple business locations
- **MLOC-02**: Pro users can switch between business locations

### Branding

- **BRND-01**: User can upload a logo for their business

### Notifications

- **NOTF-01**: User receives in-app notifications for review activity
- **NOTF-02**: User receives email digest of weekly activity

### Analytics

- **ANAL-01**: User can view send/open/click rates over time
- **ANAL-02**: User can see which contacts have left reviews

### Integrations

- **INTG-01**: User can connect CRM to auto-import contacts
- **INTG-02**: User can trigger sends via Zapier

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Review gating | Violates Google policy, legal risk |
| Incentivized reviews | FTC fines up to $51k/violation |
| Automated sequences | Adds complexity, conflicts with simplicity value |
| Multi-platform monitoring | Google-only for MVP, reduces complexity |
| AI response generation | Out of core scope, future consideration |
| Team roles/permissions | 1 user = 1 account for MVP |
| QR codes/NFC cards | Physical channel not in scope |
| Review widgets | Website embedding not in scope |
| SMS channel | Email first for v1, SMS in v2 |
| Recipient timezone detection | Send at contact's local 9am; requires timezone field + DST handling, very complex |
| Recurring scheduled sends | Review requests are one-time; recurring adds complexity |
| Priority queue | Review requests don't have urgency tiers; FIFO sufficient |
| Randomized send times | Nice-to-have but adds complexity; defer to future |
| Health check endpoint | Structured logging sufficient for v1.1; add if monitoring gaps emerge |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| BUSI-01 | Phase 2 | Complete |
| BUSI-02 | Phase 2 | Complete |
| BUSI-03 | Phase 2 | Complete |
| BUSI-04 | Phase 2 | Complete |
| CONT-01 | Phase 3 | Complete |
| CONT-02 | Phase 3 | Complete |
| CONT-03 | Phase 3 | Complete |
| CONT-04 | Phase 3 | Complete |
| CONT-05 | Phase 3 | Complete |
| CONT-06 | Phase 3 | Complete |
| CONT-07 | Phase 3 | Complete |
| CONT-08 | Phase 3 | Complete |
| CONT-09 | Phase 3 | Complete |
| CONT-10 | Phase 3 | Complete |
| SEND-01 | Phase 4 | Complete |
| SEND-02 | Phase 4 | Complete |
| SEND-03 | Phase 4 | Complete |
| SEND-04 | Phase 4 | Complete |
| SEND-05 | Phase 4 | Complete |
| SEND-06 | Phase 4 | Complete |
| SEND-07 | Phase 4 | Complete |
| SEND-08 | Phase 4 | Complete |
| SEND-09 | Phase 4 | Complete |
| SEND-10 | Phase 4 | Complete |
| HIST-01 | Phase 5 | Complete |
| HIST-02 | Phase 5 | Complete |
| HIST-03 | Phase 5 | Complete |
| HIST-04 | Phase 5 | Complete |
| ONBD-01 | Phase 7 | Complete |
| ONBD-02 | Phase 7 | Complete |
| ONBD-03 | Phase 7 | Complete |
| ONBD-04 | Phase 7 | Complete |
| ONBD-05 | Phase 7 | Complete |
| ONBD-06 | Phase 7 | Complete |
| ONBD-07 | Phase 7 | Complete |
| ONBD-08 | Phase 7 | Complete |
| BILL-01 | Phase 6 | Complete |
| BILL-02 | Phase 6 | Complete |
| BILL-03 | Phase 6 | Complete |
| BILL-04 | Phase 6 | Complete |
| BILL-05 | Phase 6 | Complete |
| BILL-06 | Phase 6 | Complete |
| BILL-07 | Phase 6 | Complete |
| PAGE-01 | Phase 8 | Complete |
| PAGE-02 | Phase 8 | Complete |
| PAGE-03 | Phase 8 | Complete |
| PAGE-04 | Phase 8 | Complete |
| BULK-01 | Phase 11 | Complete |
| BULK-02 | Phase 11 | Complete |
| BULK-03 | Phase 11 | Complete |
| RESEND-01 | Phase 11 | Complete |
| RESEND-02 | Phase 11 | Complete |
| INTG-01 | Phase 11 | Complete |
| INTG-02 | Phase 11 | Complete |
| INTG-03 | Phase 11 | Complete |
| SCHED-01 | Phase 13 | Complete |
| SCHED-02 | Phase 13 | Complete |
| SCHED-03 | Phase 13 | Complete |
| MGMT-01 | Phase 14 | Complete |
| MGMT-02 | Phase 14 | Complete |
| MGMT-03 | Phase 14 | Complete |
| MGMT-04 | Phase 14 | Complete |
| PROC-01 | Phase 12 | Complete |
| PROC-02 | Phase 12 | Complete |
| PROC-03 | Phase 12 | Complete |
| PROC-04 | Phase 12 | Complete |
| NAV-01 | Phase 13 | Complete |
| NAV-02 | Phase 13 | Complete |

**Coverage:**
- v1 requirements: 52 total (all complete)
- v1.1 requirements: 13 total (all mapped to phases 12-14)
- Mapped to phases: 65/65
- Unmapped: 0

---
*Requirements defined: 2026-01-25*
*Last updated: 2026-01-28 after v1.1 roadmap created*
