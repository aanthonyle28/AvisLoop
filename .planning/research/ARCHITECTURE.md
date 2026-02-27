# Architecture: QA Audit Structure for AvisLoop

**Project:** AvisLoop QA Audit — Comprehensive UI/UX + Functional Review
**Researched:** 2026-02-27
**Confidence:** HIGH (direct codebase analysis of all routes, components, and layout)

---

## Overview

This document answers: **how should a Playwright-driven QA audit be structured for the AvisLoop 15+ route Next.js app?**

The audit covers all routes currently in scope, tests against a pre-existing test account (`audit-test@avisloop.com / AuditTest123!`), and produces per-page findings files plus a summary report. The audit is **findings-only** — no fixes are implemented.

---

## App Map: Full Route Inventory

Before defining phases, here is every auditable surface in the app:

### Public Routes (no auth required)
| Route | Type | Notes |
|-------|------|-------|
| `/` | Marketing landing | Hero, features, pricing, CTA sections |
| `/pricing` | Marketing | Plan comparison table |
| `/privacy` | Static | Privacy policy |
| `/terms` | Static | Terms of service |
| `/login` | Auth | Email/password + Google OAuth |
| `/signup` | Auth | Registration form |
| `/auth/forgot-password` | Auth | Password reset email |
| `/auth/update-password` | Auth | Post-reset password change |
| `/r/[token]` | Review funnel | HMAC-signed token, star rating, Google/feedback routing |
| `/complete/[token]` | Job form | DB token, public technician form |

### Auth Flow Routes
| Route | Type | Notes |
|-------|------|-------|
| `/auth/callback` | Redirect handler | OAuth + magic link landing |
| `/auth/sign-up-success` | Confirmation | Post-signup "check email" page |
| `/verify-email` | Confirmation | Email verification flow |

### Onboarding (no dashboard shell)
| Route | Type | Notes |
|-------|------|-------|
| `/onboarding` | 4-step wizard | First business: steps 1-4 |
| `/onboarding?mode=new` | 3-step wizard | Additional business: CreateBusinessWizard |

### Dashboard Routes (require auth + business)
| Route | Component | Key Interactions |
|-------|-----------|-----------------|
| `/dashboard` | DashboardClient | KPI cards, ready-to-send queue, attention alerts, right panel |
| `/jobs` | JobsClient | Table, add/edit drawers, mark-complete, filters |
| `/campaigns` | CampaignsPageShell | Campaign list, preset picker, edit sheet, QuickSendModal |
| `/campaigns/[id]` | CampaignDetailShell | Stats, touch sequence, enrollments list, edit/pause/delete |
| `/campaigns/new` | Redirect | Redirects back to /campaigns |
| `/analytics` | ServiceTypeBreakdown | Service-type chart, metrics table |
| `/history` | HistoryClient | Table, filters, date presets, bulk retry |
| `/feedback` | FeedbackList | Stats cards, feedback list, resolve workflow |
| `/billing` | BillingPage | Plan cards, usage display, Stripe checkout |
| `/settings` | SettingsTabs | 7 tabs: General, Templates, Services, Messaging, Integrations, Customers, Account |
| `/businesses` | BusinessesClient | Card grid, BusinessDetailDrawer, metadata editing |
| `/send` | SendPage (legacy) | Quick send tab, bulk send tab |
| `/customers` | CustomersClient (legacy) | Table, add/edit, CSV import — now in Settings > Customers |

### Shared UI (appears on every dashboard page)
| Component | Location | Notes |
|-----------|----------|-------|
| Sidebar (desktop) | Left, 256px | Business switcher, nav items, Add Job button, collapsed state |
| BottomNav (mobile) | Fixed bottom | Dashboard, Jobs, Campaigns, History — 4 items |
| PageHeader (mobile) | Top | Business switcher, account menu |
| MobileFAB | Fixed bottom-right | Add Job, mobile only |
| NavigationProgressBar | Top | Page transition indicator |

---

## Phase Grouping Architecture

### Grouping Principles

**1. Group by data dependency:** Pages that depend on the same pre-existing data should be tested in the same session. Creating a job in Phase 2 means Phase 3 (campaigns) can test enrollment without creating a job again.

**2. Group by shared layout:** Pages sharing the same shell (dashboard layout) can reuse a single authenticated browser context. Public pages run in a separate context.

**3. Group by complexity:** High-complexity pages with many interactions (Jobs, Campaigns, Settings) get their own phases. Low-complexity read-only pages (Analytics, Billing) share a phase.

**4. Build data progressively:** The audit sequence intentionally creates test data that later phases depend on. Auth phase creates the account. Onboarding creates the business. Jobs phase creates the first job. That job powers the campaign, history, and analytics phases.

### The Data Dependency Chain

```
Phase 1 (Auth) — creates authenticated session
     ↓
Phase 2 (Onboarding) — creates first business with campaign preset
     ↓
Phase 3 (Dashboard) — reads business data; tests empty state first
     ↓
Phase 4 (Jobs) — creates 3-5 test jobs; triggers enrollment
     ↓ (jobs now enrolled in campaigns)
Phase 5 (Campaigns) — reads enrollments from Phase 4
     ↓ (campaign sends history)
Phase 6 (History + Analytics + Feedback) — reads send logs from Phase 5
     ↓
Phase 7 (Settings) — reads + modifies business config; safe to change
     ↓
Phase 8 (Businesses) — tests multi-business creation + switcher
     ↓
Phase 9 (Public Pages) — stateless, no session needed, test last
```

---

## Phase Breakdown: Recommended Structure

### Phase QA-01: Authentication Flows

**Routes covered:**
- `/login`
- `/signup`
- `/auth/forgot-password`
- `/auth/update-password`

**Scope per route:**

`/login`
- Desktop and mobile viewports
- Email/password login with valid credentials (audit-test@avisloop.com)
- Error state: wrong password
- Error state: unregistered email
- "Forgot password" link present and navigates
- Google OAuth button present and labeled correctly
- Redirect to /dashboard after successful login
- Redirect to /dashboard if already logged in
- Dark mode rendering

`/signup`
- Form fields: name, email, password
- Password strength indicator (if present)
- Error state: existing email
- Error state: weak password
- Redirect to /auth/sign-up-success after submission
- Google OAuth button present

`/auth/forgot-password`
- Email field renders, submit triggers confirmation state
- Error state: invalid email

**Viewport plan:** Desktop (1440×900) and Mobile (390×844) for all auth screens.

**Data requirements:** No pre-existing data. Uses audit-test@avisloop.com for login tests.

**Known complexities:**
- Google OAuth cannot be fully tested via Playwright without real OAuth flow — document as "functional check only, interactive flow not testable via automation"
- Password reset requires email delivery — test up to form submission only

---

### Phase QA-02: Onboarding Wizard

**Routes covered:**
- `/onboarding` (fresh state — may need a secondary account)
- `/onboarding?mode=new` (additional business creation)

**Scope:**

`/onboarding` (first business)
- All 4 steps render (Business Basics, Campaign Preset, CRM Platform, SMS Consent)
- Step validation: required fields block progression
- Business name, phone, Google review link inputs
- Service type multi-select (8 types + custom names)
- Campaign preset picker (Gentle / Standard / Aggressive descriptions)
- CRM platform step is skippable
- SMS consent acknowledgement required
- Progress indicator updates correctly
- Completion redirects to /dashboard
- "Back" navigation between steps

`/onboarding?mode=new`
- Creates CreateBusinessWizard (3-step: basics, services, SMS consent)
- Does NOT redirect away if user already has a completed business
- Completion redirects to /dashboard with new business active

**Viewport plan:** Desktop + Mobile. Mobile especially important — onboarding must work on phone.

**Data requirements:**
- Primary test account should already have completed onboarding — use ?mode=new to test wizard without destroying existing data
- Fresh first-time flow is ideally tested against a second test account (audit-test2@avisloop.com) OR by noting that it cannot be replicated with the primary account

**Known complexities:**
- Form state persists in localStorage — test refresh mid-wizard
- Draft restoration validation

---

### Phase QA-03: Dashboard

**Routes covered:**
- `/dashboard`

**Scope:**
- Two-column DashboardShell layout (left: main content, right: RightPanel)
- KPI cards: 6 total (Reviews This Month, Average Rating, Conversion Rate, Requests Sent, Active Sequences, Pending)
- Each KPI card clickable, links to correct destination
- Sparklines render on KPI cards (14-day history)
- ReadyToSendQueue: job cards, empty state variant
- AttentionAlerts: alert cards, dismiss behavior
- WelcomeCard: visible on new accounts, hidden once dismissed
- Getting Started card in RightPanel
- Greeting changes with time of day
- Sidebar business switcher visible (desktop)
- Mobile: bottom nav, PageHeader, MobileFAB visible
- Mobile: bottom sheet (if jobs in queue)
- Dark mode rendering of all widgets

**Viewport plan:** Desktop (1440×900), Tablet (768×1024), Mobile (390×844).

**Data requirements:** Test account should have at least some job history so KPIs show non-zero values. If empty, document empty state appearance.

---

### Phase QA-04: Jobs

**Routes covered:**
- `/jobs`

**Scope:**
- Page header, description, table renders
- Filter controls: status filter (all / completed / do_not_send), service type filter
- Job table columns: customer name, service type, status badge, campaign, date, actions
- "Add Job" button in header opens AddJobSheet
- AddJobSheet: customer autocomplete, service type select, notes, campaign selector, status toggle
- Customer autocomplete searches existing customers by name + email
- New customer inline creation within AddJobSheet
- Conflict detection on job creation (customer already in active campaign)
- MarkComplete button on scheduled jobs
- Job status toggle (completed / do_not_send)
- EditJobSheet: pre-filled with existing data
- JobDetailDrawer: opens on row click, shows all fields
- Delete confirmation dialog
- CampaignSelector shows "Auto-detect" vs specific campaign vs "One-off"
- Empty state when no jobs
- Loading skeleton during data fetch
- Mobile: all actions accessible (Add Job via FAB, table scrolls horizontally)

**Data outcome:** Create 3 test jobs during this phase — these become the test data for Phases 5 and 6.

**Known complexities:**
- Enrollment conflict dialog (Replace / Skip / Queue) requires a job to already be enrolled in an active campaign — create scenario if possible
- CSV import dialog exists (csv-job-import-dialog.tsx) — test button triggers dialog

---

### Phase QA-05: Campaigns

**Routes covered:**
- `/campaigns`
- `/campaigns/[id]`

**Scope — `/campaigns`:**
- Preset picker visible for new users (or after deleting all campaigns)
- Campaign list cards: name, service type, status badge, touch count
- "New Campaign" flow: duplicate from preset
- QuickSendModal: send to specific customer directly
- CampaignList actions: Edit, Pause/Resume, Delete
- Edit sheet (TouchSequenceEditor): add/remove touches, channel toggle, delay hours, template picker
- Template preview modal opens from touch editor
- Campaign pause: enrollments freeze (badge shows "Frozen")
- Campaign resume: enrollments reactivate
- Delete with enrollment reassignment dialog
- Empty state when no campaigns

**Scope — `/campaigns/[id]`:**
- Stats cards: Active, Completed, Stopped counts
- CampaignStats: touch stats, stop reasons chart
- Touch sequence display: each touch with channel, delay, template name
- "AI Personalized" badge visible if personalization enabled
- Enrollments list with status badges
- Pagination if >20 enrollments
- "Back to campaigns" link works
- Edit/Pause/Delete accessible from detail view

**Viewport plan:** Desktop primary. Campaign detail is information-dense — verify readability at 1280px.

**Data requirements:** Phase 4 jobs must exist and be enrolled. At least one campaign should have enrollments so the detail page shows data.

---

### Phase QA-06: History, Analytics, and Feedback

**Routes covered:**
- `/history`
- `/analytics`
- `/feedback`

These three pages are grouped because they are primarily read-only displays of data produced by the jobs and campaigns phases. Testing them together is efficient.

**Scope — `/history`:**
- Table: customer, channel, status badge, template, date
- Status filter (Radix Select): all, sent, failed, bounced, reviewed
- Date preset chips: Today, Week, Month, 3M
- Custom date range picker
- Search by customer name or email
- "Retry" inline action on failed messages
- Bulk retry: select multiple failed/bounced, batch action
- Send log drawer: click row opens detail with template content
- Pagination (50 per page)
- Empty state
- Loading skeleton

**Scope — `/analytics`:**
- ServiceTypeBreakdown renders (chart or table)
- Service type rows with metrics: total sent, reviews, conversion rate
- Empty state if no data
- Page header and description

**Scope — `/feedback`:**
- Stats cards: Total, Unresolved, Resolved, Avg Rating
- FeedbackList: each item shows customer name, rating stars, feedback text, date
- Resolve workflow: "Mark Resolved" button, adds internal notes
- Filter by resolved/unresolved
- Empty state

**Viewport plan:** Desktop primary. History table requires horizontal space — test at 1280px and 768px for comparison.

---

### Phase QA-07: Settings

**Routes covered:**
- `/settings` (all 7 tabs)

Settings is the most complex single page in the app. Each tab is functionally independent and warrants its own checklist.

**Tab: General**
- Business name, phone, email fields
- Google review link field
- Form save / validation
- FormLinkSection: shows form token URL, copy button, "Regenerate" action

**Tab: Templates**
- TemplateList renders (email + SMS templates)
- Create new template: channel toggle, subject (email only), body, variables
- Edit template: pre-filled form
- Delete template: confirmation dialog
- System templates visible (is_default = true) — no edit/delete buttons
- "Use as base" copies system template

**Tab: Services**
- 8 service type toggles
- Custom service names input (when "other" enabled)
- Timing sliders/inputs per service type
- Review cooldown days input (7-90 range)
- Save button triggers immediate update

**Tab: Messaging**
- PersonalizationSection: AI stats display (personalized count, last used)
- API key status indicator

**Tab: Integrations**
- Generate API key button (first time)
- Reveal/hide API key
- Copy API key
- Regenerate warning dialog
- Webhook URL display

**Tab: Customers**
- Full CustomersClient embedded: search, table, add, edit, CSV import
- SMS consent status column
- Bulk operations: archive, delete selected
- CustomerDetailDrawer: notes auto-save, SMS consent editing

**Tab: Account**
- Change password section (only if email auth, not OAuth-only)
- Delete account: confirmation dialog with "type your email" guard

**Viewport plan:** Desktop primary (settings is content-heavy). Verify tab overflow on mobile (horizontal scroll on TabsList).

---

### Phase QA-08: Businesses Page and Business Switcher

**Routes covered:**
- `/businesses`
- Business switcher (sidebar + mobile header — appears on every dashboard page)

**Scope — `/businesses`:**
- Card grid: all user-owned businesses shown
- BusinessCard: business name, address, agency metadata preview
- BusinessDetailDrawer opens on card click
- Drawer: Google rating start/current, review count start/current, monthly fee, start date, GBP access toggle, competitor info, notes
- Notes auto-save (debounce — type and wait 500ms)
- GBP access toggle updates immediately
- "Add Business" button opens CreateBusinessWizard (same as /onboarding?mode=new)
- Active business card visually distinguished
- "Switch to this business" action in drawer

**Scope — Business Switcher:**
- Desktop sidebar: shows current business name
- Single-business users: plain text (no dropdown)
- Multi-business users: Radix DropdownMenu with all businesses
- Check mark on active business
- Selecting different business switches context (all pages reload with new business data)
- Mobile PageHeader: BusinessSwitcher renders same behavior at top of screen

**Data requirements:** Requires at least 2 businesses to test multi-business switcher. Phase 8 should CREATE a second business as its first action.

**Viewport plan:** Desktop + Mobile. Switcher behavior must be verified on both.

---

### Phase QA-09: Public Pages and Review Funnel

**Routes covered:**
- `/` (marketing landing)
- `/pricing`
- `/privacy`, `/terms`
- `/r/[token]` (review funnel)
- `/complete/[token]` (public job form)

These routes require no authentication and can be tested in a fresh browser context.

**Scope — `/` landing:**
- Hero section renders: heading, subheading, CTAs
- All landing page sections present (features, how it works, pricing, FAQ)
- CTA buttons navigate to /signup and /login
- Sticky header (if present)
- Mobile responsive: hamburger menu or equivalent
- Dark mode
- Animation elements do not break layout

**Scope — `/pricing`:**
- Plan cards present (Basic, Pro)
- Feature lists accurate
- CTA buttons navigate to signup

**Scope — `/r/[token]` review funnel:**
- Valid token: star rating UI renders with business name and customer name
- Click 4-5 stars: redirects to Google review link (or shows "No Google link configured" state)
- Click 1-3 stars: shows private feedback form
- Submit feedback: success state
- Invalid/expired token: 404 page
- FTC footer text present

**Scope — `/complete/[token]` job form:**
- Valid token: form renders with business name and service type options
- Required fields: customer name, phone or email, service type
- Submit: success state
- Invalid token: 404 page
- Mobile-optimized layout (this form is used on phones by technicians)

**Data requirements for review funnel:** Need a valid HMAC-signed review token. This requires having a customer enrolled in a campaign that has sent a touch. If touch-sending is not available in test environment, test with a manually crafted token or note as "environment-dependent."

**Data requirements for job form:** Need the form_token from Settings > General > Form Link section. Copy it during Phase QA-07 and use it here.

---

## Test Data Strategy

### Primary Approach: Use Existing Test Account

The test account `audit-test@avisloop.com / AuditTest123!` is the primary audit subject. Do NOT create test data speculatively — survey what exists first, document it, then create only what is needed for specific interaction tests.

### Data Creation Sequence

```
Before Phase QA-03:
  - Verify test account has at least 1 business with onboarding complete
  - Note: campaign preset selected, services configured

During Phase QA-04 (Jobs):
  - Create 3 test jobs:
    Job A: HVAC, Patricia Johnson, pjohnson@test.com — mark complete (triggers enrollment)
    Job B: Plumbing, Marcus Rodriguez, mrodriguez@test.com — mark complete
    Job C: Cleaning, Sarah Chen, schen@test.com — status do_not_send (excluded from queue)
  - These 3 jobs become the test corpus for all subsequent phases

During Phase QA-08 (Businesses):
  - Create 1 additional business: "Test Business 2"
  - Use this to test multi-business switcher
  - After switcher tests, switch back to original business
```

### Data Isolation Rules

1. **Never delete data that later phases depend on.** Delete operations should only be tested on items created specifically for that test (create then delete, within same phase).

2. **Use unique identifiers in test data.** Prefix customer names with "AUDIT_" so test data is recognizable: "AUDIT_Patricia Johnson". This makes cleanup obvious if needed later.

3. **Campaign configuration:** Do not change existing campaign configurations — only observe. If you must test a destructive action (delete campaign), create a throwaway campaign first.

4. **Settings changes:** The Settings tab tests can freely modify service timing, cooldown, and template settings. These are test-account-only and expected to change.

### What Cannot Be Tested via Playwright

| Feature | Why Not Testable | How to Document |
|---------|-----------------|-----------------|
| Google OAuth flow | Requires interactive OAuth | Note: "Button present, full OAuth flow not automatable" |
| Actual email/SMS delivery | No real Twilio/Resend in test env | Note: "Send action triggers correctly, delivery not verifiable" |
| Stripe checkout | Redirects to external Stripe | Note: "Checkout button navigates to Stripe; completion flow uses test webhook" |
| Password reset (full flow) | Requires email inbox access | Note: "Form submission confirmed; link delivery not verifiable" |
| Review token creation | Requires campaign touch to have sent | Note: "Token-based flow requires sent touch; test with pre-generated token if available" |

---

## Screenshot Strategy

### Viewport Definitions

| Name | Dimensions | Use |
|------|-----------|-----|
| `desktop` | 1440×900 | Primary audit viewport |
| `tablet` | 768×1024 | Sidebar auto-collapse range |
| `mobile` | 390×844 | iPhone 14 equivalent |

### Theme Coverage

- **Light mode:** Always captured
- **Dark mode:** Capture for: landing page, dashboard, jobs, settings (General tab)
- Mechanism: set `document.documentElement.classList.add('dark')` via `page.evaluate()` before screenshot

### Naming Convention

```
[phase]-[route-slug]-[state]-[viewport]-[theme].png

Examples:
  qa01-login-default-desktop-light.png
  qa01-login-error-desktop-light.png
  qa04-jobs-add-job-sheet-open-desktop-light.png
  qa04-jobs-table-populated-mobile-light.png
  qa03-dashboard-full-desktop-dark.png
```

### Screenshot Moments

For each page, capture at minimum:
1. **Default state** — page as it loads, no interactions
2. **Key interaction state** — the most important interactive element open (drawer, dialog, sheet)
3. **Empty state** — if the page has a distinct empty state
4. **Mobile** — at 390×844

For complex pages with multiple interaction states (Jobs, Campaigns, Settings), capture additional states:
- Each tab (Settings)
- Sheet open + sheet closed (Jobs)
- Campaign list + campaign detail

### Screenshot Storage

Store all screenshots in: `.planning/qa-audit/screenshots/`

Organize by phase:
```
.planning/qa-audit/screenshots/
  qa01-auth/
  qa02-onboarding/
  qa03-dashboard/
  qa04-jobs/
  qa05-campaigns/
  qa06-history-analytics-feedback/
  qa07-settings/
  qa08-businesses/
  qa09-public/
```

---

## Report Template: Per-Page Findings File

Each page gets one findings file at `.planning/qa-audit/findings/[phase]-[page].md`.

```markdown
# QA Findings: [Page Name]

**Route:** /path/to/page
**Phase:** QA-0X
**Audited:** [date]
**Viewport tested:** desktop (1440×900), mobile (390×844)
**Theme tested:** light + dark

## Summary

[2-3 sentence overview of overall page health]

**Status:** [PASS / PASS WITH ISSUES / FAIL]

---

## Findings

### [F-01] [Finding Title]

**Severity:** [Critical / High / Medium / Low / Info]
**Category:** [Functional / Visual / Accessibility / Performance / V2 Alignment]
**Viewport:** [Desktop / Mobile / Both]
**Theme:** [Light / Dark / Both]

**Description:**
[What was observed]

**Expected behavior:**
[What should happen]

**Screenshot:** `screenshots/[phase]-[page]-[state].png`

**Reproduction steps:**
1. Navigate to [route]
2. [action]
3. [action]
4. Observe: [result]

---

### [F-02] [Finding Title]
[repeat pattern]

---

## Passed Checks

| Check | Status | Notes |
|-------|--------|-------|
| Page renders without console errors | Pass/Fail | |
| All navigation links work | Pass/Fail | |
| Empty state renders correctly | Pass/Fail | |
| Loading state renders correctly | Pass/Fail | |
| Mobile layout (390px) renders correctly | Pass/Fail | |
| Dark mode renders correctly | Pass/Fail | |
| No layout overflow | Pass/Fail | |
| Interactive elements respond correctly | Pass/Fail | |
| Form validation works | Pass/Fail | (if applicable) |
| V2 alignment: no V1 patterns introduced | Pass/Fail | (if applicable) |

---

## Screenshots

| File | Description |
|------|-------------|
| `[filename].png` | [description] |

---

## Notes

[Any context, caveats, or environment-specific observations]
```

### Severity Definitions

| Level | Definition | Examples |
|-------|-----------|---------|
| Critical | App is broken, data loss possible, security issue | White screen, unhandled error, auth bypass |
| High | Feature non-functional, significant UX degradation | Form submits but data not saved, modal won't close |
| Medium | Feature partially works, notable visual defect | Wrong label, missing loading state, minor layout break |
| Low | Polish issue, minor inconsistency | Typo, minor spacing issue, hover state missing |
| Info | Observation, question, or improvement suggestion | "Consider adding X here", "This pattern differs from Y page" |

---

## Summary Report Template

The summary report lives at `.planning/qa-audit/SUMMARY-REPORT.md`.

```markdown
# QA Audit Summary Report

**App:** AvisLoop
**Audit date:** [date range]
**Auditor:** Claude Code
**Test account:** audit-test@avisloop.com
**Build state:** [git commit hash if available]

---

## Executive Summary

[3-4 paragraph overview of overall health, major themes, V2 alignment status]

**Overall status:** [PASS / PASS WITH ISSUES / NEEDS WORK]

---

## Findings by Severity

| Severity | Count | Pages Affected |
|----------|-------|---------------|
| Critical | X | [list] |
| High | X | [list] |
| Medium | X | [list] |
| Low | X | [list] |
| Info | X | [list] |

**Total findings:** X

---

## Findings by Category

| Category | Count | Top Issues |
|----------|-------|-----------|
| Functional | X | [summary] |
| Visual | X | [summary] |
| Accessibility | X | [summary] |
| Performance | X | [summary] |
| V2 Alignment | X | [summary] |
| Mobile | X | [summary] |

---

## Phase Results

| Phase | Pages | Status | Finding Count | Notes |
|-------|-------|--------|---------------|-------|
| QA-01 Auth | login, signup, forgot-password | [status] | X | |
| QA-02 Onboarding | /onboarding | [status] | X | |
| QA-03 Dashboard | /dashboard | [status] | X | |
| QA-04 Jobs | /jobs | [status] | X | |
| QA-05 Campaigns | /campaigns, /campaigns/[id] | [status] | X | |
| QA-06 History/Analytics/Feedback | /history, /analytics, /feedback | [status] | X | |
| QA-07 Settings | /settings (7 tabs) | [status] | X | |
| QA-08 Businesses | /businesses, switcher | [status] | X | |
| QA-09 Public | /, /pricing, /r/[token], /complete/[token] | [status] | X | |

---

## Top 10 Issues

1. **[Issue title]** — [page] — Severity: [level]
   [One-line description]

2. ...

---

## V2 Philosophy Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Jobs are primary object | [status] | |
| Customers created as side effect | [status] | |
| No recurring manual action except "Complete Job" | [status] | |
| Campaigns handle all outreach automatically | [status] | |
| Navigation order: Dashboard → Jobs → Campaigns first | [status] | |
| "Add Customer" not prominent in main nav | [status] | |

---

## Accessibility Findings

[List all accessibility findings with WCAG criteria]

---

## Mobile Findings

[List all mobile-specific findings]

---

## Not Tested / Limitations

| Feature | Reason |
|---------|--------|
| Google OAuth full flow | External OAuth provider |
| Email/SMS delivery verification | No test email provider wired |
| Stripe checkout completion | External Stripe hosted page |
| Password reset link delivery | Requires email inbox |

---

## Recommended Fix Priority

### Immediate (before next release)
- [Critical and High findings]

### Next sprint
- [Medium findings with highest user impact]

### Backlog
- [Low and Info findings]

---

## Files Index

| File | Description |
|------|-------------|
| findings/qa01-auth.md | Auth page findings |
| findings/qa02-onboarding.md | Onboarding findings |
| findings/qa03-dashboard.md | Dashboard findings |
| findings/qa04-jobs.md | Jobs findings |
| findings/qa05-campaigns.md | Campaigns findings |
| findings/qa06-history.md | History findings |
| findings/qa06-analytics.md | Analytics findings |
| findings/qa06-feedback.md | Feedback findings |
| findings/qa07-settings.md | Settings findings (7 tabs) |
| findings/qa08-businesses.md | Businesses + switcher findings |
| findings/qa09-public.md | Public pages + review funnel findings |

---

*Audit conducted using Playwright MCP browser automation with manual verification.*
```

---

## Build Order Rationale

The phases are ordered by data dependency and risk, not alphabetically or by navigation order.

**Why Auth first (QA-01):** Everything else requires a logged-in session. Failing auth blocks the entire audit.

**Why Onboarding second (QA-02):** Dashboard and all other pages redirect to /onboarding if business is missing. The test account should already be onboarded, but the wizard itself must be audited, and `?mode=new` creates the second business needed for Phase 8.

**Why Dashboard third (QA-03):** The dashboard consumes data from jobs and campaigns. Test it empty first (documents the zero-state), then revisit after Phase 4 adds data if needed.

**Why Jobs fourth (QA-04):** Jobs is the V2 core action. Test it thoroughly. The 3 test jobs created here power phases 5, 6, and will appear in analytics.

**Why Campaigns fifth (QA-05):** Campaign enrollment happens on job completion. Phase 4 jobs trigger enrollment — Phase 5 observes the result. Testing in this order means enrollment data is present when auditing campaign detail pages.

**Why History/Analytics/Feedback together (QA-06):** All three are downstream consumers of jobs + campaigns. They are read-heavy with few interactions, so grouping is efficient. No ordering dependency between them.

**Why Settings seventh (QA-07):** Settings modifies business configuration. Testing it after core workflows means configuration changes do not affect earlier phases.

**Why Businesses eighth (QA-08):** Creating a second business in Phase 8 would have complicated earlier phases if done earlier (business switcher context changes). Test multi-business after all single-business flows are verified.

**Why Public pages last (QA-09):** No auth dependency. The `/r/[token]` test requires a form_token from Settings (captured in Phase 7) and ideally a sent-touch token (which is present after Phase 5 sends messages). Test last so all dependencies are met.

---

## Critical Interaction Checklist (Cross-Phase)

These interactions appear on multiple pages and must be checked consistently:

### Business Switcher (appears on every dashboard page)
- [ ] Single-business: shows business name, no dropdown
- [ ] Multi-business: shows dropdown with check on active
- [ ] Switching business reloads data correctly
- [ ] Desktop sidebar and mobile header both render it

### Add Job (sidebar button, mobile FAB, dashboard queue)
- [ ] Opens AddJobSheet from sidebar button
- [ ] Opens AddJobSheet from mobile FAB
- [ ] Sheet closes on save and on cancel
- [ ] Customer autocomplete fires at 2+ characters
- [ ] New customer inline creation works

### Loading States
- [ ] loading.tsx skeletons shown on each page (verify all pages have one)
- [ ] Skeleton matches the shape of the loaded content
- [ ] No layout shift between skeleton and content

### Empty States
- [ ] Each page has a distinct empty state component
- [ ] Empty state copy is V2-aligned (does not say "add customers")
- [ ] Empty state includes a meaningful CTA

### Error States
- [ ] 404 page renders for unknown routes
- [ ] Error boundary catches component errors (history/error.tsx exists — verify it triggers)

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Route inventory completeness | HIGH | Direct filesystem inspection of app/ directory |
| Phase grouping rationale | HIGH | Data dependency analysis of page.tsx files |
| Test data strategy | HIGH | Based on actual data model and RLS patterns |
| Screenshot strategy | HIGH | Standard Playwright MCP pattern |
| Report template structure | HIGH | Derived from existing UX-AUDIT.md + project conventions |
| Review funnel testability | MEDIUM | Depends on whether a sent touch exists in test account |
| Onboarding fresh-flow testability | MEDIUM | Primary test account already onboarded; second account needed |

---

*Research completed: 2026-02-27*
*Method: Direct codebase analysis — all route files, layout files, component files, and middleware inspected*
