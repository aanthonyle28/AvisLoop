# Phase 66: Business Switcher -- QA Findings

**Tested:** 2026-03-02
**Tester:** Claude Code (Playwright MCP + Supabase MCP)
**App URL:** http://localhost:3000
**Test account:** audit-test@avisloop.com
**Business A:** Audit Test HVAC (6ed94b54-6f35-4ede-8dcb-28f562052042)
**Business B:** AUDIT_ Test Plumbing (ba41879d-7458-4d47-909f-1dce6ddd0e69)

---

## Summary

| Requirement | Status | Notes |
|-------------|--------|-------|
| MULTI-01: Switcher shows all businesses | **PASS** | Both businesses visible, checkmark on active, "View all clients" link present |
| MULTI-02: Switch updates all page data | **PASS** | Dashboard, Jobs, Campaigns all reflect correct business after switch in both directions |
| MULTI-03: Mobile switcher functional | **PASS** | Dropdown opens, both businesses listed, switch updates header and data |

---

## Data Baseline

### Business A counts (Audit Test HVAC)
| Entity | Count |
|--------|-------|
| Jobs | 8 |
| Customers | 7 |
| Campaigns | 2 |

### Business B counts (AUDIT_ Test Plumbing)
| Entity | Count |
|--------|-------|
| Jobs | 1 |
| Customers | 1 |
| Campaigns | 1 |

---

## MULTI-01: Switcher shows all businesses

**Status: PASS**

### Steps
1. Logged in as audit-test@avisloop.com (already authenticated from Plan 66-01)
2. Navigated to dashboard, verified sidebar shows "Audit Test HVAC" as active business
3. Clicked business switcher button (aria-label: "Current business: Audit Test HVAC. Click to switch.")
4. Dropdown opened as a Radix DropdownMenu

### Dropdown contents
| Option | Business Name | Active Indicator | Position |
|--------|--------------|-----------------|----------|
| 1 | Audit Test HVAC | Checkmark (img element) | top |
| 2 | AUDIT_ Test Plumbing | None | middle |
| Link | View all clients | -- | bottom (after separator) |

### Observations
- Switcher renders as an interactive button (not plain text) because user has 2 businesses
- Dropdown trigger has clear aria-label: "Current business: Audit Test HVAC. Click to switch."
- Active business indicated by checkmark icon next to name
- Non-active business shows without checkmark
- Separator divides business list from "View all clients" link
- Menu uses `role="menu"` with `role="menuitem"` for proper accessibility

### Evidence
- `qa-66-switcher-dropdown.png`

### Bugs found
- None

---

## MULTI-02: Switch updates all page data

**Status: PASS**

### Switch to Business B: data verification

**Steps:**
1. Clicked "AUDIT_ Test Plumbing" in the dropdown
2. Page revalidated via `revalidatePath` (Fast Refresh took ~1.3s)
3. Verified data change across 3 pages

| Page | Expected (Business B) | Actual | Match |
|------|----------------------|--------|-------|
| Sidebar business name | AUDIT_ Test Plumbing | AUDIT_ Test Plumbing | Yes |
| Dashboard badge | 0 or 1 | Dashboard 0 (initially), then 1 after data created | Yes |
| Dashboard subtitle | "Sent 0 messages..." | "Sent 0 messages this week . 0 reviews received" | Yes |
| Dashboard Ready to Send | Empty / minimal | "No jobs yet -- add a completed job to get started" | Yes |
| Dashboard KPIs | All 0 / "--" | Reviews 0 "--", Rating 0.0 "--", Conversion 0% "--" | Yes |
| Dashboard pipeline | 0 Sent, 0 Active, 0 Queued | 0 Sent, 0 Active, 0 Queued | Yes |
| Dashboard activity | No activity | "No activity yet -- complete a job to get started" | Yes |
| Jobs count | 1 (isolation test) | "Track your service jobs . 1 total" | Yes |
| Jobs table | AUDIT_IsolationTest Customer | AUDIT_IsolationTest Customer, Plumbing, Completed | Yes |
| Jobs service filters | Plumbing, Handyman | Plumbing, Handyman (Business B's enabled services) | Yes |
| Campaigns visible | 1 (Standard preset) | "Standard (Email + SMS)", All Services, 3 touches | Yes |
| Campaigns NOT visible | HVAC Follow-up | Not present -- correct isolation | Yes |

### Switch back to Business A: data verification

**Steps:**
1. Opened switcher dropdown from campaigns page
2. Clicked "Audit Test HVAC"
3. Page revalidated, navigated to dashboard

| Page | Expected (Business A) | Actual | Match |
|------|----------------------|--------|-------|
| Sidebar business name | Audit Test HVAC | Audit Test HVAC | Yes |
| Dashboard badge | 6 | "Dashboard 6" | Yes |
| Dashboard subtitle | "3 jobs ready to send . 3 items need attention" | "3 jobs ready to send . 3 items need attention" | Yes |
| Dashboard Ready to Send | 3 items (Jane Doe, John Smith, Patricia Johnson) | 3 items with correct names and service types | Yes |
| Dashboard Needs Attention | 3 unresolved feedback | Marcus Rodriguez (1-star), Patricia Johnson (3-star), Sarah Chen (2-star) | Yes |
| Dashboard KPIs | Non-zero | Average Rating 2.0, 3 Sent, 4 Active, 1 Queued | Yes |
| Dashboard activity | Multiple entries | Feedback entries + email send entries | Yes |
| Jobs count | 8 | "Track your service jobs . 8 total" | Yes |
| Jobs service filters | HVAC, Plumbing, Electrical, etc. (all services) | All 8 service type filters visible | Yes |
| Campaigns visible | 2 (Standard Follow-Up + HVAC Follow-up) | Both present with correct details | Yes |

### "View all clients" link
- Clicked "View all clients" from dropdown
- Navigated to: /businesses
- Page shows both business cards (Audit Test HVAC with metadata, AUDIT_ Test Plumbing)
- Correct: Yes

### Evidence
- `qa-66-switched-to-plumbing.png` -- Dashboard after switching to Business B (empty state)
- `qa-66-dashboard-business-b.png` -- Same as above (Business B dashboard)
- `qa-66-jobs-business-b.png` -- Jobs page showing 1 job for Business B only
- `qa-66-campaigns-business-b.png` -- Campaigns page showing only Business B's campaign
- `qa-66-dashboard-business-a-restored.png` -- Dashboard after switching back to Business A (rich data)

### Bugs found
- None

---

## MULTI-03: Mobile switcher functional

**Status: PASS**

### Mobile viewport (375x844)

**Steps:**
1. Resized viewport to 375x844 (iPhone 14 equivalent)
2. Navigated to http://localhost:3000/dashboard
3. Verified mobile layout renders correctly
4. Clicked business switcher in mobile header
5. Dropdown opened with both businesses
6. Switched to "AUDIT_ Test Plumbing"
7. Verified header updated and data changed
8. Switched back to "Audit Test HVAC"
9. Restored viewport to 1440x900

| Check | Expected | Actual |
|-------|----------|--------|
| Desktop sidebar hidden | Yes | Yes -- not present in DOM at 375px |
| Mobile header visible | Yes | Yes -- AvisLoop logo + business name + account menu |
| Business name in header | Yes | Yes -- "Audit Test HVAC" displayed in header |
| Bottom navigation visible | Yes | Yes -- Dashboard, Jobs, Campaigns, History |
| FAB Add Job button visible | Yes | Yes -- orange circle button at bottom-right |
| Switcher dropdown opens | Yes | Yes -- opens same Radix DropdownMenu as desktop |
| Both businesses listed | Yes | Yes -- "Audit Test HVAC" (checkmark) + "AUDIT_ Test Plumbing" + "View all clients" |
| Switch works | Yes | Yes -- header updated to "AUDIT_ Test Plumbing", data changed |
| Header updates after switch | Yes | Yes -- business name in header reflects switched business |
| Data changes after switch | Yes | Yes -- dashboard showed Business B data (1 job ready, 0 reviews, 0.0 avg) |
| Switch back works | Yes | Yes -- header returned to "Audit Test HVAC" with Business A data |

### Observations
- Mobile switcher uses the same `BusinessSwitcher` component as desktop (same aria-labels, same menu structure)
- Dropdown renders correctly at 375px -- no overflow or clipping issues
- Business name text fits within the mobile header without truncation
- Touch targets are adequate for mobile interaction
- Switch triggers same `revalidatePath` flow as desktop -- data refresh is complete

### Evidence
- `qa-66-mobile-dashboard.png` -- Mobile dashboard at 375px showing Business A
- `qa-66-mobile-switcher-open.png` -- Mobile switcher dropdown open with both businesses
- `qa-66-mobile-switcher-switched.png` -- Mobile dashboard after switching to Business B

### Bugs found
- None

---

## Bugs Summary

| Bug ID | Severity | Requirement | Description |
|--------|----------|-------------|-------------|
| (none) | -- | -- | No bugs found across MULTI-01, MULTI-02, or MULTI-03 |

---

## Screenshots

| File | Description |
|------|-------------|
| qa-66-switcher-dropdown.png | Desktop switcher dropdown with both businesses and checkmark on active |
| qa-66-switched-to-plumbing.png | Sidebar + dashboard after switching to Business B |
| qa-66-dashboard-business-b.png | Dashboard showing Business B empty state (0 KPIs, no activity) |
| qa-66-jobs-business-b.png | Jobs page for Business B (1 job, Plumbing/Handyman filters) |
| qa-66-campaigns-business-b.png | Campaigns page for Business B (1 campaign: Standard) |
| qa-66-dashboard-business-a-restored.png | Dashboard after switching back to A (3 ready, 3 attention, 2.0 rating) |
| qa-66-mobile-dashboard.png | Mobile dashboard at 375px showing Business A |
| qa-66-mobile-switcher-open.png | Mobile switcher dropdown open with both businesses |
| qa-66-mobile-switcher-switched.png | Mobile dashboard after switching to Business B |

---

## Final State

- Active business: **Audit Test HVAC** (restored)
- Viewport: 1440x900 (restored to desktop)
- All 3 MULTI requirements: **PASS**

---

*QA audit complete. MULTI-01, MULTI-02, MULTI-03 all PASS. Business switcher works correctly on desktop and mobile, with proper data isolation on switch.*
