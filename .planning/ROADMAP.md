# Roadmap: AvisLoop

## Overview

AvisLoop progresses from foundational authentication and data security through the core value loop of managing contacts and sending review requests, then adds billing enforcement and polished onboarding before completing public-facing marketing pages. Each phase delivers observable user value while building toward a complete, shippable MVP that makes requesting reviews "so simple business owners actually do it."

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Auth** - Users can create accounts and access the app securely
- [x] **Phase 2: Business Setup** - Users can configure their business profile and review settings
- [x] **Phase 3: Contact Management** - Users can add, organize, and manage customer contacts
- [x] **Phase 3.1: Critical Fixes** - Fix security vulnerabilities and scalability issues (INSERTED)
- [x] **Phase 4: Core Sending** - Users can send review request emails and see immediate confirmation
- [x] **Phase 5: Message History** - Users can view and track all sent review requests
- [x] **Phase 5.1: Code Review Fixes** - Fix security and maintainability issues from code review (INSERTED)
- [x] **Phase 6: Billing & Limits** - Users can subscribe and system enforces tier limits
- [ ] **Phase 7: Onboarding Flow** - New users are guided through first-time setup
- [ ] **Phase 8: Public Pages** - Visitors can learn about and sign up for AvisLoop
- [ ] **Phase 9: Polish & UX** - App has consistent, polished visual design across all screens

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
- [x] 01-04-PLAN.md - Fix middleware naming (proxy.ts -> middleware.ts) [GAP CLOSURE]
- [x] 01-05-PLAN.md - Create database migration files [GAP CLOSURE]
- [x] 01-06-PLAN.md - Wire Server Actions to auth forms [GAP CLOSURE]

### Phase 2: Business Setup
**Goal**: Users can configure their business profile and review settings
**Depends on**: Phase 1
**Requirements**: BUSI-01, BUSI-02, BUSI-03, BUSI-04
**Success Criteria** (what must be TRUE):
  1. User can create a business with name
  2. User can add and edit their Google review link
  3. User can select or customize an email template for review requests
  4. User can set a sender name that appears in review request emails
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md - Database schema (businesses + email_templates tables), Zod validations, TypeScript types
- [x] 02-02-PLAN.md - Server Actions for business CRUD (updateBusiness, createEmailTemplate, deleteEmailTemplate)
- [x] 02-03-PLAN.md - Settings page UI with business profile form and template management

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
**Plans**: 6 plans

Plans:
- [x] 03-01-PLAN.md - Database schema (contacts table), Zod validations, TypeScript types
- [x] 03-02-PLAN.md - Server Actions for contact CRUD and bulk operations
- [x] 03-03-PLAN.md - Install deps, DataTable with columns, search and filter UI
- [x] 03-04-PLAN.md - Add Contact dialog and Edit Contact sheet
- [x] 03-05-PLAN.md - CSV import dialog with preview and duplicate detection
- [x] 03-06-PLAN.md - Contacts page with empty state and full integration

### Phase 3.1: Critical Fixes (INSERTED)
**Goal**: Fix critical security vulnerabilities and medium-priority issues identified in code review
**Depends on**: Phase 3
**Requirements**: None (fixes, not new features)
**Success Criteria** (what must be TRUE):
  1. searchContacts properly escapes special SQL characters (%, _, \) in query parameter
  2. getContacts returns paginated results with limit and offset support
  3. Bulk operations reject arrays larger than 100 items with clear error message
  4. Database enforces one business per user via unique constraint
**Plans**: 1 plan

Plans:
- [x] 03.1-01-PLAN.md - Fix SQL injection, add pagination, add bulk limits, add DB unique constraint

### Phase 4: Core Sending
**Goal**: Users can send review request emails and see immediate confirmation
**Depends on**: Phase 3.1
**Requirements**: SEND-01, SEND-02, SEND-03, SEND-04, SEND-05, SEND-06, SEND-07, SEND-08, SEND-09, SEND-10
**Success Criteria** (what must be TRUE):
  1. User can select a contact and send a review request email
  2. User can preview and edit the message before sending
  3. User sees immediate "Sent" confirmation after sending
  4. System logs every send attempt with status (sent/failed)
  5. System enforces cooldown period between sends to same contact
  6. System rate-limits sending to prevent abuse
  7. System respects contact opt-out preferences
  8. System enforces monthly send limits per tier (Basic: 200, Pro: 500)
  9. System updates message status on delivery/failure via webhooks
**Plans**: 5 plans in 3 waves

Plans:
- [x] 04-01-PLAN.md — Database schema (send_logs table, opted_out column, tier column, RLS)
- [x] 04-02-PLAN.md — Email infrastructure (Resend client, React Email template, rate limiter)
- [x] 04-03-PLAN.md — Send Server Action with all validation checks
- [x] 04-04-PLAN.md — Webhook handler for delivery status updates
- [x] 04-05-PLAN.md — Send UI (contact selection, preview, confirmation)

### Phase 5: Message History
**Goal**: Users can view and track all sent review requests
**Depends on**: Phase 4
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. User can view list of all sent messages with recipient, date, and status
  2. User can see message status (sent, delivered, failed, opened)
  3. User can filter message history by date range
  4. User can search message history by recipient name or email
**Plans**: 2 plans in 2 waves

Plans:
- [x] 05-01-PLAN.md — Data layer with filtering (getSendLogs extension) and reusable components (StatusBadge, HistoryFilters)
- [x] 05-02-PLAN.md — History table UI and page integration (columns, table, client, page)

### Phase 5.1: Code Review Fixes (INSERTED)
**Goal**: Fix security vulnerabilities and maintainability issues identified in code review
**Depends on**: Phase 5
**Requirements**: None (fixes, not new features)
**Success Criteria** (what must be TRUE):
  1. Webhook endpoint has rate limiting to prevent abuse
  2. Monthly send count query uses optimized index
  3. Billing constants defined in single source of truth
  4. History page has error boundary for graceful error handling
**Plans**: 1 plan

Plans:
- [x] 05.1-01-PLAN.md — Rate limit webhook, add index, extract constants, add error boundary

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
**Plans**: 5 plans in 3 waves

Plans:
- [x] 06-01-PLAN.md — Database schema + Stripe SDK + client (billing foundation)
- [x] 06-02-PLAN.md — Checkout session + portal session server actions
- [x] 06-03-PLAN.md — Webhook handler for subscription lifecycle events
- [x] 06-04-PLAN.md — Billing page with usage display and subscription management
- [x] 06-05-PLAN.md — Usage warnings + send page limit enforcement

### Phase 7: Onboarding Flow
**Goal**: New users are guided through first-time setup
**Depends on**: Phase 6
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05, ONBD-06, ONBD-07, ONBD-08
**Success Criteria** (what must be TRUE):
  1. New user sees setup wizard after signup (business -> review link -> contact -> first send)
  2. Wizard shows progress indicator (step X of Y)
  3. User can skip steps in wizard
  4. Dashboard shows "next best action" after onboarding completion
  5. Onboarding pre-fills smart defaults where possible
  6. Dashboard shows onboarding checklist until all steps complete
  7. System blocks sending if review link is missing or invalid (ALREADY SATISFIED - send/page.tsx lines 17-35)
  8. System blocks sending if no contacts exist (ALREADY SATISFIED - send/page.tsx lines 82-93)
**Plans**: 4 plans in 3 waves

Plans:
- [ ] 07-01-PLAN.md — Database migration (onboarding tracking) + data layer (getOnboardingStatus)
- [ ] 07-02-PLAN.md — Wizard shell (OnboardingProgress, OnboardingWizard, onboarding page route)
- [ ] 07-03-PLAN.md — Wizard step forms (BusinessStep, ContactStep, SendStep)
- [ ] 07-04-PLAN.md — Dashboard integration (OnboardingChecklist, NextActionCard, dashboard page)

### Phase 8: Public Pages
**Goal**: Visitors can learn about and sign up for AvisLoop
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

### Phase 9: Polish & UX
**Goal**: App has consistent, polished visual design across all screens
**Depends on**: Phase 8 (all functionality complete)
**Requirements**: None (quality pass, not new functionality)
**Success Criteria** (what must be TRUE):
  1. All screens follow consistent visual design system
  2. Empty states, loading states, and error states are polished
  3. Responsive design works on mobile, tablet, desktop
  4. Micro-interactions and transitions feel smooth
  5. Typography, spacing, and colors are consistent
**Plans**: TBD

**Implementation Notes:**
- Use `/web-design-guidelines` skill for design system decisions
- Use `/senior-frontend` skill for component implementation
- User may provide Figma designs to implement — if so, match designs exactly
- If no Figma provided, create clean minimal design following shadcn/ui patterns

Plans:
- [ ] 09-01: TBD (design audit + system)
- [ ] 09-02: TBD (component polish)
- [ ] 09-03: TBD (responsive + states)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 3.1 -> 4 -> 5 -> 5.1 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 6/6 | Complete | 2026-01-26 |
| 2. Business Setup | 3/3 | Complete | 2026-01-27 |
| 3. Contact Management | 6/6 | Complete | 2026-01-27 |
| 3.1 Critical Fixes | 1/1 | Complete | 2026-01-27 |
| 4. Core Sending | 5/5 | Complete | 2026-01-27 |
| 5. Message History | 2/2 | Complete | 2026-01-27 |
| 5.1 Code Review Fixes | 1/1 | Complete | 2026-01-27 |
| 6. Billing & Limits | 5/5 | Complete | 2026-01-28 |
| 7. Onboarding Flow | 0/4 | Not started | - |
| 8. Public Pages | 0/TBD | Not started | - |
| 9. Polish & UX | 0/TBD | Not started | - |
