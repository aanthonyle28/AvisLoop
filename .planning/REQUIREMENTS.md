# Requirements: ReviewLoop

**Defined:** 2026-01-25
**Core Value:** Make requesting reviews so simple that business owners actually do it — one contact, one click, done.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User can reset password via email link
- [x] **AUTH-04**: User session persists across browser refresh and device restarts

### Business Profile

- [ ] **BUSI-01**: User can create a business with name
- [ ] **BUSI-02**: User can add/edit Google review link for their business
- [ ] **BUSI-03**: User can select a default email template
- [ ] **BUSI-04**: User can set a default sender name for emails (optional)

### Contacts

- [ ] **CONT-01**: User can add a contact with name and email
- [ ] **CONT-02**: User can edit an existing contact's details
- [ ] **CONT-03**: User can archive a contact
- [ ] **CONT-04**: User can view a list of all contacts
- [ ] **CONT-05**: User can import contacts via CSV upload
- [ ] **CONT-06**: User can search contacts by name or email
- [ ] **CONT-07**: User can filter contacts (e.g., by date added, archived)
- [ ] **CONT-08**: User can restore an archived contact
- [ ] **CONT-09**: System prevents duplicate contacts (same email)
- [ ] **CONT-10**: Empty states show helpful prompts when no contacts exist

### Send Review Request

- [ ] **SEND-01**: User can select a contact and send a review request email
- [ ] **SEND-02**: User can preview the message before sending
- [ ] **SEND-03**: User can edit the message template (subject + body)
- [ ] **SEND-04**: User sees immediate "Sent ✅" confirmation after sending
- [ ] **SEND-05**: System logs every send attempt with status
- [ ] **SEND-06**: System enforces cooldown period between sends to same contact
- [ ] **SEND-07**: System respects contact opt-out preferences
- [ ] **SEND-08**: System enforces monthly send limits per tier
- [ ] **SEND-09**: System rate-limits sending to prevent abuse
- [ ] **SEND-10**: System updates message status on delivery/failure via webhooks

### Message History

- [ ] **HIST-01**: User can view list of all sent messages
- [ ] **HIST-02**: User can see message status (sent, delivered, failed, opened)
- [ ] **HIST-03**: User can filter message history by date range
- [ ] **HIST-04**: User can search message history by recipient

### Onboarding

- [ ] **ONBD-01**: New user is guided through setup wizard (business → review link → contact → first send)
- [ ] **ONBD-02**: Wizard shows progress indicator (step X of Y)
- [ ] **ONBD-03**: User can skip onboarding steps
- [ ] **ONBD-04**: Dashboard shows "next best action" after onboarding
- [ ] **ONBD-05**: Onboarding pre-fills smart defaults where possible
- [ ] **ONBD-06**: Dashboard shows onboarding checklist until complete
- [ ] **ONBD-07**: System blocks sending if review link is missing or invalid
- [ ] **ONBD-08**: System blocks sending if no contacts exist

### Billing

- [ ] **BILL-01**: New users get 25 free trial sends
- [ ] **BILL-02**: Basic tier ($49/mo) includes 200 sends/month, 200 contacts
- [ ] **BILL-03**: Pro tier ($99/mo) includes 500 sends/month, unlimited contacts
- [ ] **BILL-04**: User can subscribe via Stripe checkout
- [ ] **BILL-05**: User is prompted to subscribe when trial sends exhausted
- [ ] **BILL-06**: User can manage subscription (view plan, cancel) via billing page
- [ ] **BILL-07**: System enforces tier limits (contacts, sends)

### Public Pages

- [ ] **PAGE-01**: Landing page explains product value proposition
- [ ] **PAGE-02**: Pricing page shows tier comparison
- [ ] **PAGE-03**: Login page for returning users
- [ ] **PAGE-04**: Signup page for new users

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

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| BUSI-01 | Phase 2 | Pending |
| BUSI-02 | Phase 2 | Pending |
| BUSI-03 | Phase 2 | Pending |
| BUSI-04 | Phase 2 | Pending |
| CONT-01 | Phase 3 | Pending |
| CONT-02 | Phase 3 | Pending |
| CONT-03 | Phase 3 | Pending |
| CONT-04 | Phase 3 | Pending |
| CONT-05 | Phase 3 | Pending |
| CONT-06 | Phase 3 | Pending |
| CONT-07 | Phase 3 | Pending |
| CONT-08 | Phase 3 | Pending |
| CONT-09 | Phase 3 | Pending |
| CONT-10 | Phase 3 | Pending |
| SEND-01 | Phase 4 | Pending |
| SEND-02 | Phase 4 | Pending |
| SEND-03 | Phase 4 | Pending |
| SEND-04 | Phase 4 | Pending |
| SEND-05 | Phase 4 | Pending |
| SEND-06 | Phase 4 | Pending |
| SEND-07 | Phase 4 | Pending |
| SEND-08 | Phase 4 | Pending |
| SEND-09 | Phase 4 | Pending |
| SEND-10 | Phase 4 | Pending |
| HIST-01 | Phase 5 | Pending |
| HIST-02 | Phase 5 | Pending |
| HIST-03 | Phase 5 | Pending |
| HIST-04 | Phase 5 | Pending |
| ONBD-01 | Phase 7 | Pending |
| ONBD-02 | Phase 7 | Pending |
| ONBD-03 | Phase 7 | Pending |
| ONBD-04 | Phase 7 | Pending |
| ONBD-05 | Phase 7 | Pending |
| ONBD-06 | Phase 7 | Pending |
| ONBD-07 | Phase 7 | Pending |
| ONBD-08 | Phase 7 | Pending |
| BILL-01 | Phase 6 | Pending |
| BILL-02 | Phase 6 | Pending |
| BILL-03 | Phase 6 | Pending |
| BILL-04 | Phase 6 | Pending |
| BILL-05 | Phase 6 | Pending |
| BILL-06 | Phase 6 | Pending |
| BILL-07 | Phase 6 | Pending |
| PAGE-01 | Phase 8 | Pending |
| PAGE-02 | Phase 8 | Pending |
| PAGE-03 | Phase 8 | Pending |
| PAGE-04 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-01-25*
*Last updated: 2026-01-25 after roadmap creation*
