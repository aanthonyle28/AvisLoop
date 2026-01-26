# Roadmap: ReviewLoop

## Overview

ReviewLoop progresses from foundational authentication and data security through the core value loop of managing contacts and sending review requests, then adds billing enforcement and polished onboarding before completing public-facing marketing pages. Each phase delivers observable user value while building toward a complete, shippable MVP that makes requesting reviews "so simple business owners actually do it."

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Auth** - Users can create accounts and access the app securely
- [ ] **Phase 2: Business Setup** - Users can configure their business profile and review settings
- [ ] **Phase 3: Contact Management** - Users can add, organize, and manage customer contacts
- [ ] **Phase 4: Core Sending** - Users can send review request emails and see immediate confirmation
- [ ] **Phase 5: Message History** - Users can view and track all sent review requests
- [ ] **Phase 6: Billing & Limits** - Users can subscribe and system enforces tier limits
- [ ] **Phase 7: Onboarding Flow** - New users are guided through first-time setup
- [ ] **Phase 8: Public Pages** - Visitors can learn about and sign up for ReviewLoop

## Phase Details

### Phase 1: Foundation & Auth
**Goal**: Users can create accounts and access the app securely
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can sign up with email and password and receives verification email
  2. User can log in and session persists across browser refresh and device restarts
  3. User can reset forgotten password via email link
  4. User can log out from any page
  5. Database has RLS policies preventing cross-user data leakage
**Plans**: 6 plans (3 initial + 3 gap closure)

Plans:
- [x] 01-01-PLAN.md - Project setup with Supabase template, client factories, proxy
- [x] 01-02-PLAN.md - Database foundation (profiles table, RLS policies)
- [x] 01-03-PLAN.md - Auth Server Actions (signUp, signIn, signOut, resetPassword, updatePassword)
- [ ] 01-04-PLAN.md - Fix middleware naming (proxy.ts -> middleware.ts) [GAP CLOSURE]
- [ ] 01-05-PLAN.md - Create database migration files [GAP CLOSURE]
- [ ] 01-06-PLAN.md - Wire Server Actions to auth forms [GAP CLOSURE]

### Phase 2: Business Setup
**Goal**: Users can configure their business profile and review settings
**Depends on**: Phase 1
**Requirements**: BUSI-01, BUSI-02, BUSI-03, BUSI-04
**Success Criteria** (what must be TRUE):
  1. User can create a business with name
  2. User can add and edit their Google review link
  3. User can select or customize an email template for review requests
  4. User can set a sender name that appears in review request emails
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Contact Management
**Goal**: Users can add, organize, and manage customer contacts
**Depends on**: Phase 2
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08, CONT-09, CONT-10
**Success Criteria** (what must be TRUE):
  1. User can add a contact with name and email
  2. User can edit or archive existing contacts
  3. User can import multiple contacts via CSV upload
  4. User can search and filter contacts by name, email, date, or archived status
  5. System prevents duplicate contacts with the same email address
  6. Empty states show helpful prompts when no contacts exist
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Core Sending
**Goal**: Users can send review request emails and see immediate confirmation
**Depends on**: Phase 3
**Requirements**: SEND-01, SEND-02, SEND-03, SEND-04, SEND-05, SEND-06, SEND-07, SEND-08, SEND-09, SEND-10
**Success Criteria** (what must be TRUE):
  1. User can select a contact and send a review request email
  2. User can preview and edit the message before sending
  3. User sees immediate "Sent" confirmation after sending
  4. System logs every send attempt with status (sent/failed)
  5. System enforces cooldown period between sends to same contact
  6. System respects contact opt-out preferences
  7. System enforces monthly send limits per tier (Basic: 200, Pro: 500)
  8. System rate-limits sending to prevent abuse
  9. System updates message status on delivery/failure via webhooks
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Message History
**Goal**: Users can view and track all sent review requests
**Depends on**: Phase 4
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. User can view list of all sent messages with recipient, date, and status
  2. User can see message status (sent, delivered, failed, opened)
  3. User can filter message history by date range
  4. User can search message history by recipient name or email
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Billing & Limits
**Goal**: Users can subscribe and system enforces tier limits
**Depends on**: Phase 4
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07
**Success Criteria** (what must be TRUE):
  1. New users get 25 free trial sends
  2. User is prompted to subscribe when trial sends are exhausted
  3. User can subscribe to Basic ($49/mo: 200 sends, 200 contacts) or Pro ($99/mo: 500 sends, unlimited contacts) via Stripe
  4. User can view current plan and manage subscription (cancel/update) via billing page
  5. System enforces tier limits on contacts and sends per month
  6. System blocks sending when limits are exceeded or subscription is inactive
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Onboarding Flow
**Goal**: New users are guided through first-time setup
**Depends on**: Phase 6
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05, ONBD-06, ONBD-07, ONBD-08
**Success Criteria** (what must be TRUE):
  1. New user sees setup wizard after signup (business → review link → contact → first send)
  2. Wizard shows progress indicator (step X of Y)
  3. User can skip steps in wizard
  4. Dashboard shows "next best action" after onboarding completion
  5. Onboarding pre-fills smart defaults where possible
  6. Dashboard shows onboarding checklist until all steps complete
  7. System blocks sending if review link is missing or invalid
  8. System blocks sending if no contacts exist
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Public Pages
**Goal**: Visitors can learn about and sign up for ReviewLoop
**Depends on**: Phase 1
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):
  1. Landing page clearly explains product value proposition
  2. Pricing page shows tier comparison (free trial, Basic, Pro)
  3. Login page allows returning users to access their account
  4. Signup page allows new users to create an account
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 3/6 | Gap closure in progress | - |
| 2. Business Setup | 0/TBD | Not started | - |
| 3. Contact Management | 0/TBD | Not started | - |
| 4. Core Sending | 0/TBD | Not started | - |
| 5. Message History | 0/TBD | Not started | - |
| 6. Billing & Limits | 0/TBD | Not started | - |
| 7. Onboarding Flow | 0/TBD | Not started | - |
| 8. Public Pages | 0/TBD | Not started | - |
