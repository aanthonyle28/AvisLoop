# Requirements: v3.1 QA E2E Audit

**Milestone:** v3.1 — QA E2E Audit
**Created:** 2026-02-27
**Status:** Roadmap complete — phases assigned

---

## Auth Flows

- [x] **AUTH-01**: Login with email/password succeeds and lands on dashboard with correct business data
- [x] **AUTH-02**: Signup creates account, redirects to onboarding, and session is established
- [x] **AUTH-03**: Password reset sends email, reset link works, new password accepted
- [x] **AUTH-04**: Session persists across page refresh, tab switch, and browser navigation (back/forward)
- [x] **AUTH-05**: Invalid credentials show clear error messages (not generic server errors)

## Onboarding

- [x] **ONB-01**: First-business onboarding wizard completes all 4 steps and creates business + campaign
- [x] **ONB-02**: Additional business creation (?mode=new) completes 3-step wizard without affecting existing businesses
- [x] **ONB-03**: Onboarding draft persistence works (refresh mid-wizard retains entered data)

## Dashboard

- [ ] **DASH-01**: KPI widgets show correct numbers matching database counts
- [ ] **DASH-02**: Sparkline charts render with data (not empty/broken when data exists)
- [ ] **DASH-03**: Ready-to-Send queue populates with completed jobs awaiting enrollment
- [ ] **DASH-04**: Needs Attention alerts show failed sends/unresolved feedback with dismiss working
- [ ] **DASH-05**: Recent activity feed shows latest campaign events with correct timestamps
- [ ] **DASH-06**: Clicking KPI cards navigates to correct destination (/analytics)
- [ ] **DASH-07**: Getting Started card/components are NOT visible (hidden for production)
- [ ] **DASH-08**: Dashboard empty state renders correctly for a business with zero data
- [ ] **DASH-09**: Loading skeletons display during data fetch (not blank screen)
- [ ] **DASH-10**: Mobile layout renders correctly (bottom sheet, compact KPI bar)
- [ ] **DASH-11**: Dark mode renders without visual artifacts (no muddy colors, correct contrast)

## Jobs

- [ ] **JOBS-01**: Jobs table displays with correct columns, sorting, and pagination
- [ ] **JOBS-02**: Add Job drawer opens, form validates, and creates job successfully
- [ ] **JOBS-03**: Edit Job drawer loads existing data and saves changes
- [ ] **JOBS-04**: Job detail drawer shows complete information
- [ ] **JOBS-05**: Service type filter only shows business's enabled service types
- [ ] **JOBS-06**: Status filter works (scheduled/completed/do_not_send)
- [ ] **JOBS-07**: Mark Complete action transitions job from scheduled to completed
- [ ] **JOBS-08**: Completing a job with a matching campaign triggers enrollment (verify in DB)
- [ ] **JOBS-09**: Campaign selector dropdown shows available campaigns + "one-off" option
- [ ] **JOBS-10**: Empty state renders correctly for business with zero jobs

## Campaigns

- [ ] **CAMP-01**: Campaign list displays all campaigns with correct status badges
- [ ] **CAMP-02**: Campaign detail page shows touch sequence, enrollment list, and analytics
- [ ] **CAMP-03**: Campaign edit sheet opens and saves changes (touch timing, templates)
- [ ] **CAMP-04**: Campaign preset picker shows 3 options with correct descriptions
- [ ] **CAMP-05**: Pausing a campaign sets enrollments to "frozen" (not "stopped") — verify in DB
- [ ] **CAMP-06**: Resuming a paused campaign restores frozen enrollments to "active" — verify in DB
- [ ] **CAMP-07**: Template preview modal shows correct template content per touch
- [ ] **CAMP-08**: Campaign analytics show correct enrollment/send/conversion counts
- [ ] **CAMP-09**: Enrollment conflict states display correctly (conflict, queue_after, skipped badges)
- [ ] **CAMP-10**: Creating a new campaign from preset works end-to-end

## History & Activity

- [ ] **HIST-01**: History page displays send logs with correct status badges
- [ ] **HIST-02**: Status chip filter works (filter by delivered/failed/bounced/etc.)
- [ ] **HIST-03**: Date preset chips work (Today, Week, Month, 3 Months)
- [ ] **HIST-04**: Resend button only appears on failed/bounced rows
- [ ] **HIST-05**: Bulk select only selects failed/bounced rows

## Analytics

- [ ] **ANLYT-01**: Analytics page shows metrics with correct numbers
- [ ] **ANLYT-02**: Service type breakdown table displays with correct data
- [ ] **ANLYT-03**: Empty state renders correctly when no data exists

## Feedback

- [ ] **FDBK-01**: Feedback page lists submitted feedback with ratings
- [ ] **FDBK-02**: Feedback resolution workflow works (mark resolved, add notes)
- [ ] **FDBK-03**: Empty state renders correctly when no feedback exists

## Billing

- [ ] **BILL-01**: Billing page shows current plan tier and pooled usage count
- [ ] **BILL-02**: Usage count reflects sends across ALL user-owned businesses (pooled)
- [ ] **BILL-03**: Plan comparison section displays correctly

## Settings

- [ ] **SETT-01**: General tab: business name, Google review link, sender name editable and save
- [ ] **SETT-02**: General tab: form link section shows shareable URL with copy button
- [ ] **SETT-03**: Templates tab: template list displays with channel badges (email/SMS)
- [ ] **SETT-04**: Templates tab: create/edit/delete template works
- [ ] **SETT-05**: Services tab: service type toggles work and save
- [ ] **SETT-06**: Services tab: custom service names display and are editable
- [ ] **SETT-07**: Customers tab: customer list displays with search and filters
- [ ] **SETT-08**: Customers tab: add/edit/archive customer works
- [ ] **SETT-09**: All settings changes persist after page refresh

## Businesses (Agency)

- [ ] **BIZ-01**: Businesses page shows card grid with all user-owned businesses
- [ ] **BIZ-02**: Business cards display name, service type, Google rating, reviews gained
- [ ] **BIZ-03**: Business detail drawer opens with all agency metadata fields
- [ ] **BIZ-04**: Editing metadata in drawer persists to database
- [ ] **BIZ-05**: Notes auto-save works (type, wait, refresh — notes retained)
- [ ] **BIZ-06**: "Switch to this business" button in drawer works correctly
- [ ] **BIZ-07**: "Add Business" button initiates new business creation flow

## Business Switcher & Data Isolation

- [ ] **MULTI-01**: Business switcher dropdown shows all user-owned businesses
- [ ] **MULTI-02**: Selecting a different business updates all page data to show that business's data
- [ ] **MULTI-03**: Mobile business switcher is accessible and functional
- [ ] **MULTI-04**: Business A's jobs do NOT appear when Business B is active (SQL verification)
- [ ] **MULTI-05**: Business A's customers do NOT appear when Business B is active
- [ ] **MULTI-06**: Business A's campaigns do NOT appear when Business B is active
- [ ] **MULTI-07**: Business A's send logs do NOT appear when Business B is active
- [ ] **MULTI-08**: Rapid business switching (5+ times in 10 seconds) doesn't break state
- [ ] **MULTI-09**: Two different users cannot see each other's businesses or data

## Public Job Completion Form

- [ ] **FORM-01**: Form loads at /complete/[token] without authentication
- [ ] **FORM-02**: Form shows business name and enabled service types
- [ ] **FORM-03**: Form validates required fields (name, phone or email, service type)
- [ ] **FORM-04**: Successful submission creates job + customer record in database
- [ ] **FORM-05**: Mobile layout has large touch targets and is usable on phone viewport
- [ ] **FORM-06**: Invalid/missing token shows 404 page (not crash or blank)

## Cross-Cutting Edge Cases

- [ ] **EDGE-01**: Long business name (50+ chars) displays correctly in sidebar, switcher, cards (truncated, no overflow)
- [ ] **EDGE-02**: Long customer name (50+ chars) displays correctly in tables and drawers
- [ ] **EDGE-03**: Special characters in all text fields (quotes, ampersands, < >) display correctly (no XSS, no broken rendering)
- [ ] **EDGE-04**: Every page renders correctly at mobile viewport (375px width)
- [ ] **EDGE-05**: Every page renders correctly at tablet viewport (768px width)
- [ ] **EDGE-06**: Loading skeletons appear on all data pages during fetch
- [ ] **EDGE-07**: Empty states render correctly on all pages when no data exists
- [ ] **EDGE-08**: Form validation errors display clearly on all forms (red borders, error messages)
- [ ] **EDGE-09**: Dark mode renders without artifacts on all tested pages

## Report Deliverables

- [ ] **RPT-01**: Per-page findings file exists for each tested route (docs/qa-v3.1/)
- [ ] **RPT-02**: Each finding has severity (Critical/High/Medium/Low), location, and description
- [ ] **RPT-03**: Summary report exists with overall health scorecard and priority fix list
- [ ] **RPT-04**: Screenshots captured for every finding (desktop + mobile where relevant)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Marketing pages (landing, pricing) | Dashboard-only scope for this milestone |
| Google OAuth end-to-end | Requires Google consent screen, untestable in Playwright |
| Email/SMS delivery | External service dependency (Resend, Twilio) |
| Stripe payment processing | Requires real Stripe test environment |
| Cron job execution | Server-side automation, not UI-testable |
| Accessibility (a11y) | Explicitly excluded from scope |
| Performance/load testing | Separate concern, not in QA audit |
| Review funnel public page (/r/[token]) | Depends on cron having sent campaign touches |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| AUTH-01 | Phase 59 | Complete |
| AUTH-02 | Phase 59 | Complete |
| AUTH-03 | Phase 59 | Complete |
| AUTH-04 | Phase 59 | Complete |
| AUTH-05 | Phase 59 | Complete |
| ONB-01 | Phase 60 | Complete |
| ONB-02 | Phase 60 | Complete |
| ONB-03 | Phase 60 | Complete |
| DASH-01 | Phase 61 | Pending |
| DASH-02 | Phase 61 | Pending |
| DASH-03 | Phase 61 | Pending |
| DASH-04 | Phase 61 | Pending |
| DASH-05 | Phase 61 | Pending |
| DASH-06 | Phase 61 | Pending |
| DASH-07 | Phase 61 | Pending |
| DASH-08 | Phase 61 | Pending |
| DASH-09 | Phase 61 | Pending |
| DASH-10 | Phase 61 | Pending |
| DASH-11 | Phase 61 | Pending |
| JOBS-01 | Phase 62 | Pending |
| JOBS-02 | Phase 62 | Pending |
| JOBS-03 | Phase 62 | Pending |
| JOBS-04 | Phase 62 | Pending |
| JOBS-05 | Phase 62 | Pending |
| JOBS-06 | Phase 62 | Pending |
| JOBS-07 | Phase 62 | Pending |
| JOBS-08 | Phase 62 | Pending |
| JOBS-09 | Phase 62 | Pending |
| JOBS-10 | Phase 62 | Pending |
| CAMP-01 | Phase 63 | Pending |
| CAMP-02 | Phase 63 | Pending |
| CAMP-03 | Phase 63 | Pending |
| CAMP-04 | Phase 63 | Pending |
| CAMP-05 | Phase 63 | Pending |
| CAMP-06 | Phase 63 | Pending |
| CAMP-07 | Phase 63 | Pending |
| CAMP-08 | Phase 63 | Pending |
| CAMP-09 | Phase 63 | Pending |
| CAMP-10 | Phase 63 | Pending |
| HIST-01 | Phase 64 | Pending |
| HIST-02 | Phase 64 | Pending |
| HIST-03 | Phase 64 | Pending |
| HIST-04 | Phase 64 | Pending |
| HIST-05 | Phase 64 | Pending |
| ANLYT-01 | Phase 64 | Pending |
| ANLYT-02 | Phase 64 | Pending |
| ANLYT-03 | Phase 64 | Pending |
| FDBK-01 | Phase 64 | Pending |
| FDBK-02 | Phase 64 | Pending |
| FDBK-03 | Phase 64 | Pending |
| BILL-01 | Phase 65 | Pending |
| BILL-02 | Phase 65 | Pending |
| BILL-03 | Phase 65 | Pending |
| SETT-01 | Phase 65 | Pending |
| SETT-02 | Phase 65 | Pending |
| SETT-03 | Phase 65 | Pending |
| SETT-04 | Phase 65 | Pending |
| SETT-05 | Phase 65 | Pending |
| SETT-06 | Phase 65 | Pending |
| SETT-07 | Phase 65 | Pending |
| SETT-08 | Phase 65 | Pending |
| SETT-09 | Phase 65 | Pending |
| BIZ-01 | Phase 66 | Pending |
| BIZ-02 | Phase 66 | Pending |
| BIZ-03 | Phase 66 | Pending |
| BIZ-04 | Phase 66 | Pending |
| BIZ-05 | Phase 66 | Pending |
| BIZ-06 | Phase 66 | Pending |
| BIZ-07 | Phase 66 | Pending |
| MULTI-01 | Phase 66 | Pending |
| MULTI-02 | Phase 66 | Pending |
| MULTI-03 | Phase 66 | Pending |
| MULTI-04 | Phase 66 | Pending |
| MULTI-05 | Phase 66 | Pending |
| MULTI-06 | Phase 66 | Pending |
| MULTI-07 | Phase 66 | Pending |
| MULTI-08 | Phase 66 | Pending |
| MULTI-09 | Phase 66 | Pending |
| FORM-01 | Phase 67 | Pending |
| FORM-02 | Phase 67 | Pending |
| FORM-03 | Phase 67 | Pending |
| FORM-04 | Phase 67 | Pending |
| FORM-05 | Phase 67 | Pending |
| FORM-06 | Phase 67 | Pending |
| EDGE-01 | Phase 67 | Pending |
| EDGE-02 | Phase 67 | Pending |
| EDGE-03 | Phase 67 | Pending |
| EDGE-04 | Phase 67 | Pending |
| EDGE-05 | Phase 67 | Pending |
| EDGE-06 | Phase 67 | Pending |
| EDGE-07 | Phase 67 | Pending |
| EDGE-08 | Phase 67 | Pending |
| EDGE-09 | Phase 67 | Pending |
| RPT-01 | Phase 67 | Pending |
| RPT-02 | Phase 67 | Pending |
| RPT-03 | Phase 67 | Pending |
| RPT-04 | Phase 67 | Pending |

**Coverage:**
- v3.1 requirements: 97 total (note: initial estimate was 74; final count from listed requirements is 97)
- Mapped to phases: 97/97
- Unmapped: 0

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 — traceability table complete, all 97 requirements mapped to phases 59-67*
