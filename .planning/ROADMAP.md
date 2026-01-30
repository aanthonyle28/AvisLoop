# Roadmap: AvisLoop

## Overview

AvisLoop progresses from foundational authentication and data security through the core value loop of managing contacts and sending review requests, then adds billing enforcement and polished onboarding before completing public-facing marketing pages. Each phase delivers observable user value while building toward a complete, shippable MVP that makes requesting reviews "so simple business owners actually do it."

## Milestones

- ✅ **v1.0 MVP** - Phases 1-11 (shipped 2026-01-28)
- ✅ **v1.1 Scheduled Sending** - Phases 12-14 (shipped 2026-01-30)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-11) - SHIPPED 2026-01-28</summary>

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
- [x] **Phase 7: Onboarding Flow** - New users are guided through first-time setup
- [x] **Phase 8: Public Pages** - Visitors can learn about and sign up for AvisLoop
- [x] **Phase 8.1: Code Review Fixes** - Fix security, maintainability, and UX issues from phases 6-8 review (INSERTED)
- [x] **Phase 9: Polish & UX** - App has consistent, polished visual design across all screens
- [x] **Phase 10: Landing Page Redesign** - Landing page matches reference design aesthetic
- [x] **Phase 11: Bulk Send, Re-send & Integrations** - Users can bulk send, re-send to cooled-down contacts, and receive contacts via webhook

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
- [x] 07-01-PLAN.md — Database migration (onboarding tracking) + data layer (getOnboardingStatus)
- [x] 07-02-PLAN.md — Wizard shell (OnboardingProgress, OnboardingWizard, onboarding page route)
- [x] 07-03-PLAN.md — Wizard step forms (BusinessStep, ContactStep, SendStep)
- [x] 07-04-PLAN.md — Dashboard integration (OnboardingChecklist, NextActionCard, dashboard page)

### Phase 8: Public Pages
**Goal**: Visitors can learn about and sign up for AvisLoop
**Depends on**: Phase 1
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):
  1. Landing page clearly explains product value proposition
  2. Pricing page shows tier comparison (free trial, Basic, Pro)
  3. Login page allows returning users to access their account
  4. Signup page allows new users to create an account
**Plans**: 2 plans in 2 waves

Plans:
- [x] 08-01-PLAN.md — Marketing layout + landing page (hero, features, CTAs)
- [x] 08-02-PLAN.md — Pricing page with tier comparison table

### Phase 8.1: Code Review Fixes (INSERTED)
**Goal**: Fix security, maintainability, and UX issues identified in phases 6-8 code review
**Depends on**: Phase 8
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, MAINT-01, MAINT-02, MAINT-03, UX-01, UX-02, SEO-01, PERF-01, A11Y-01
**Success Criteria** (what must be TRUE):
  1. Stripe webhook has rate limiting for failed signature attempts
  2. Service role client is scoped inside handler function (not module-level)
  3. Billing page handles missing env vars gracefully
  4. Onboarding draft data is validated before use
  5. Contact limits are centralized in billing constants file
  6. Shared types extracted from duplicated definitions
  7. Comments match actual implementation
  8. Footer links work or are removed
  9. Auth pages have consistent branding
  10. Copyright year is dynamic
  11. getBusinessBillingInfo runs queries in parallel
  12. Progress indicator has ARIA attributes
**Plans**: 2 plans

Plans:
- [x] 08.1-01-PLAN.md — Security and performance fixes (SEC-01, SEC-02, SEC-03, SEC-04, PERF-01)
- [x] 08.1-02-PLAN.md — Maintainability, UX, SEO, and accessibility fixes (MAINT-01, MAINT-02, MAINT-03, UX-01, UX-02, SEO-01, A11Y-01)

### Phase 9: Polish & UX
**Goal**: App has consistent, polished visual design across all screens
**Depends on**: Phase 8.1 (all fixes complete)
**Requirements**: None (quality pass, not new functionality)
**Success Criteria** (what must be TRUE):
  1. All screens follow consistent visual design system
  2. Empty states, loading states, and error states are polished
  3. Responsive design works on mobile, tablet, desktop
  4. Micro-interactions and transitions feel smooth
  5. Typography, spacing, and colors are consistent
**Plans**: 4 plans in 3 waves

Plans:
- [x] 09-01-PLAN.md — Design system foundation (CSS variables, Sonner toast, Skeleton, utility hooks)
- [x] 09-02-PLAN.md — Layout and navigation (collapsible sidebar, bottom nav, AppShell)
- [x] 09-03-PLAN.md — Loading states and feedback (skeleton screens, polished empty states)
- [x] 09-04-PLAN.md — Component polish (micro-interactions, hover effects, consistency pass)

### Phase 10: Landing Page Redesign
**Goal**: Landing page matches reference design aesthetic (white bg, lime accents, geometric markers, asymmetric layouts)
**Depends on**: Phase 9
**Requirements**: None (visual refinement, not new functionality)
**Success Criteria** (what must be TRUE):
  1. Background is white with subtle lime/coral accent colors
  2. Hero has floating mockup with image placeholder slots
  3. Social proof shows text-only brand names (no cards)
  4. Stats use geometric triangle markers (no boxes)
  5. Features use alternating left/right image layouts
  6. Testimonials use minimal quote format
  7. Overall aesthetic matches provided reference image
**Plans**: 5 plans in 3 waves

Plans:
- [x] 10-01-PLAN.md — Design system update (white bg, lime/coral accents, GeometricMarker)
- [x] 10-02-PLAN.md — Hero section redesign (asymmetric layout, floating mockups, image slots)
- [x] 10-03-PLAN.md — Social proof & stats overhaul (text-only logos, triangle markers)
- [x] 10-04-PLAN.md — Feature sections redesign (alternating layouts, inline stats)
- [x] 10-05-PLAN.md — Testimonials & CTA simplification (minimal quotes, clean CTA)

### Phase 11: Bulk Send, Re-send & Integrations
**Goal**: Users can bulk send review requests, re-send to cooled-down contacts, and receive contacts via webhook API
**Depends on**: Phase 10
**Requirements**: BULK-01, BULK-02, BULK-03, RESEND-01, RESEND-02, INTG-01, INTG-02, INTG-03
**Success Criteria** (what must be TRUE):
  1. User can select multiple contacts (up to 25) and send review requests in one batch
  2. User can "Select all" visible/filtered contacts
  3. Batch validates each contact (skips cooldown/opted-out) and checks quota fits
  4. User sees summary before sending and results after sending
  5. User can filter contacts whose 14-day cooldown has expired ("Ready to re-send")
  6. User can generate/regenerate an API key from Settings
  7. Webhook endpoint accepts POST with contact data, authenticated via API key
  8. Webhook deduplicates contacts by email and rate limits at 60/min
**Plans**: 3 plans in 2 waves

Plans:
- [x] 11-01-PLAN.md — Batch send backend (server action, validation, re-send ready query)
- [x] 11-02-PLAN.md — Webhook API + API key management (crypto, route, settings UI)
- [x] 11-03-PLAN.md — Bulk send frontend (multi-select, batch results, re-send filter)

</details>

### v1.1 Scheduled Sending (Complete)

**Milestone Goal:** Let users schedule review request emails for future delivery with preset and custom timing options, manage pending sends, and rely on background processing to deliver them on time.

**Existing code:** ScheduleSelector component, schedule server actions, Zod validation, database types, service role client, and scheduled_sends table migration already exist from earlier manual work. Phases complete what is missing.

- [x] **Phase 12: Cron Processing** - System reliably processes scheduled sends in the background every minute
- [x] **Phase 13: Scheduling & Navigation** - Users can schedule sends and find the scheduling feature in navigation
- [x] **Phase 14: Scheduled Send Management** - Users can view, cancel, and reschedule their pending sends
- [x] **Phase 15: Design System & Dashboard Redesign** - Dashboard matches Figma reference with updated design tokens, typography, and layout

### v1.2 Onboarding Redesign + Google Auth (In Progress)

- [ ] **Phase 16: Onboarding Redesign + Google Auth** - Auth pages redesigned with split layout and Google OAuth, onboarding wizard simplified to 2 steps, dashboard shows 3 guided test step cards

## Phase Details

### Phase 12: Cron Processing
**Goal**: System reliably processes scheduled sends in the background every minute
**Depends on**: Phase 11 (existing send infrastructure)
**Requirements**: PROC-01, PROC-02, PROC-03, PROC-04
**Success Criteria** (what must be TRUE):
  1. Cron endpoint fetches due scheduled sends and processes them using existing email send logic
  2. System re-validates opt-out, cooldown, and quota at send time (not just at schedule time)
  3. Service role client bypasses RLS so cron can operate without a user session
  4. Each cron run produces structured JSON log output with counts (processed, sent, failed, skipped)
  5. Concurrent cron invocations cannot process the same scheduled send (FOR UPDATE SKIP LOCKED)
**Plans**: 1 plan

Plans:
- [x] 12-01-PLAN.md — Cron route handler + vercel.json (claim, validate, send, log)

### Phase 13: Scheduling & Navigation
**Goal**: Users can schedule sends and find the scheduling feature throughout the app
**Depends on**: Phase 12 (sends must process before users schedule them)
**Requirements**: SCHED-01, SCHED-02, SCHED-03, NAV-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. User can choose a preset schedule (In 1 hour, Next morning, In 24 hours) from the send form
  2. User can pick a custom date and time for future delivery
  3. User sees confirmation toast with the scheduled date/time after scheduling
  4. Sidebar and mobile bottom nav include a "Scheduled" link with pending count badge
  5. Dashboard shows count of pending scheduled sends
**Plans**: 2 plans in 1 wave

Plans:
- [x] 13-01-PLAN.md — Navigation updates with pending count badge (data function, sidebar, bottom nav, dashboard)
- [x] 13-02-PLAN.md — /scheduled page with table, empty state, and cancel action

### Phase 14: Scheduled Send Management
**Goal**: Users can view, cancel, and reschedule their pending sends
**Depends on**: Phase 13 (must have scheduled sends to manage)
**Requirements**: MGMT-01, MGMT-02, MGMT-03, MGMT-04
**Success Criteria** (what must be TRUE):
  1. User can view a list of all scheduled sends showing recipient, scheduled time, and status
  2. User can cancel a pending scheduled send before it processes
  3. User can see partial send results (sent/skipped/failed counts) for completed scheduled sends
  4. User can select multiple pending sends and reschedule them to a different time
**Plans**: 2 plans in 2 waves

Plans:
- [x] 14-01-PLAN.md — Backend infrastructure (bulk server actions, data layer with send_log details, Tabs UI component)
- [x] 14-02-PLAN.md — Scheduled table rewrite (tabs, expandable rows, bulk selection, floating action bar, styled dialogs)

### Phase 15: Design System & Dashboard Redesign
**Goal**: Dashboard matches Figma reference design with updated design tokens, typography, icons, and layout
**Depends on**: Phase 9 (existing design system and dashboard)
**Requirements**: None (visual redesign, not new functionality)
**Success Criteria** (what must be TRUE):
  1. Design tokens updated: primary #1B44BF, Kumbh Sans font, 4px spacing grid, border-only (no shadows)
  2. Sidebar uses white background, #E2E2E2 border, #F2F2F2 active state with blue icon
  3. Dashboard shows welcome header, 3 stat cards (Monthly Usage, Needs Attention, Review Rate), Quick Send + When to Send, Recent Activity table
  4. Stat cards display real data (send count/limit, pending+failed count, review rate percentage)
  5. Quick Send has contact search, template dropdown, schedule presets, and functional Send button
  6. Recent Activity shows 5 most recent send_logs with status badges using semantic color palette
  7. Icons switched from Lucide to Phosphor (outline style)
**Plans**: 4 plans in 3 waves

Plans:
- [x] 15-01-PLAN.md — Design tokens, Kumbh Sans font, Phosphor icons install, Card/Button shadow removal
- [x] 15-02-PLAN.md — Sidebar and bottom nav restyle with Phosphor icons and new visual language
- [x] 15-03-PLAN.md — Dashboard data layer additions and new components (stat cards, recent activity, avatar)
- [x] 15-04-PLAN.md — Dashboard page assembly with Quick Send, skeleton update

### Phase 16: Onboarding Redesign + Google Auth
**Goal**: Redesign auth pages with split layout and Google OAuth, simplify onboarding wizard to 2 steps, replace dashboard checklist with 3 guided test step cards
**Depends on**: Phase 15 (design system)
**Success Criteria** (what must be TRUE):
  1. Login and signup pages use split layout (form left, image right) with Google OAuth button
  2. Google OAuth works end-to-end (redirect, callback, session creation)
  3. Onboarding wizard has 2 steps only (business name, Google review link)
  4. Dashboard shows 3 numbered test step cards after onboarding (create contact, create template, send test)
  5. Cards track completion automatically and disappear when all 3 done
  6. Test sends are flagged in database and excluded from quota counting
**Plans**: 5 plans (4 initial + 1 gap closure)

Plans:
- [x] 16-01-PLAN.md — DB migration (is_test, onboarding JSONB) + Google OAuth infrastructure (callback, action, button)
- [x] 16-02-PLAN.md — Onboarding wizard redesign (2 steps: business name, Google review link)
- [x] 16-03-PLAN.md — Auth pages split layout redesign (login + signup with Google OAuth button)
- [x] 16-04-PLAN.md — Dashboard onboarding cards + test send quota exclusion
- [ ] 16-05-PLAN.md — Wire test send query param to form + fix icon type [GAP CLOSURE]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 3.1 -> 4 -> 5 -> 5.1 -> 6 -> 7 -> 8 -> 8.1 -> 9 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15 -> 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Auth | v1.0 | 6/6 | Complete | 2026-01-26 |
| 2. Business Setup | v1.0 | 3/3 | Complete | 2026-01-27 |
| 3. Contact Management | v1.0 | 6/6 | Complete | 2026-01-27 |
| 3.1 Critical Fixes | v1.0 | 1/1 | Complete | 2026-01-27 |
| 4. Core Sending | v1.0 | 5/5 | Complete | 2026-01-27 |
| 5. Message History | v1.0 | 2/2 | Complete | 2026-01-27 |
| 5.1 Code Review Fixes | v1.0 | 1/1 | Complete | 2026-01-27 |
| 6. Billing & Limits | v1.0 | 5/5 | Complete | 2026-01-28 |
| 7. Onboarding Flow | v1.0 | 4/4 | Complete | 2026-01-27 |
| 8. Public Pages | v1.0 | 2/2 | Complete | 2026-01-28 |
| 8.1 Code Review Fixes | v1.0 | 2/2 | Complete | 2026-01-27 |
| 9. Polish & UX | v1.0 | 4/4 | Complete | 2026-01-28 |
| 10. Landing Page Redesign | v1.0 | 5/5 | Complete | 2026-01-28 |
| 11. Bulk Send & Integrations | v1.0 | 3/3 | Complete | 2026-01-28 |
| 12. Cron Processing | v1.1 | 1/1 | Complete | 2026-01-29 |
| 13. Scheduling & Navigation | v1.1 | 2/2 | Complete | 2026-01-29 |
| 14. Scheduled Send Management | v1.1 | 2/2 | Complete | 2026-01-30 |
| 15. Design System & Dashboard Redesign | v1.2 | 4/4 | Complete | 2026-01-29 |
| 16. Onboarding Redesign + Google Auth | v1.2 | 4/5 | In Progress | — |
