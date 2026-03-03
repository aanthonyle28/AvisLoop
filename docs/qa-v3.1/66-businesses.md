# QA Audit: Phase 66 — Businesses Page & Data Isolation

**Tested:** 2026-03-02
**Tester:** Claude Code (Playwright MCP + Supabase MCP)
**Account:** audit-test@avisloop.com
**Business A:** Audit Test HVAC (id: `6ed94b54-6f35-4ede-8dcb-28f562052042`)
**Business B:** AUDIT_ Test Plumbing (id: `ba41879d-7458-4d47-909f-1dce6ddd0e69`)
**App URL:** http://localhost:3000

---

## Pre-Test DB State

```sql
-- Business A exists with all agency metadata NULL
SELECT id, name, service_types_enabled FROM businesses
WHERE id = '6ed94b54-6f35-4ede-8dcb-28f562052042';
-- Result: name="Audit Test HVAC", service_types_enabled=[]

-- User has exactly 1 business
SELECT COUNT(*) FROM businesses
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'audit-test@avisloop.com');
-- Result: 1
```

---

## BIZ-01: Card Grid Display

**Requirement:** Businesses page displays a card grid with one card for "Audit Test HVAC" showing business name, service types, and any agency metadata.

**Steps:**
1. Logged in as audit-test@avisloop.com
2. Navigated to /businesses
3. Page loaded with heading "Businesses" and subtitle "Manage your client businesses"

**Observations:**
- Card grid renders with 1 card
- Card shows:
  - Business name: "Audit Test HVAC"
  - Status badge: "Active"
  - Service types: "No services" (service_types_enabled is empty array)
  - Rating: "No rating" (metadata not yet populated)
  - Review data: "No review data"
  - Competitor data: "No competitor data"
- "Add Business" button visible in top-right, links to `/onboarding?mode=new`
- Arrow icon on card indicates clickable

**Screenshot:** `qa-66-businesses-page.png`

**Result: PASS**

---

## BIZ-02: Card Content Details

**Requirement:** Card shows name, service type, Google rating display, reviews gained display.

**Steps:**
1. Inspected card content on businesses page
2. Verified all display fields present

**Observations:**
- Card displays: name, Active badge, service types area, rating area, review data area, competitor data area
- Before metadata population: shows placeholder text ("No rating", "No review data", etc.)
- After metadata population (post BIZ-04): card updates to show:
  - Rating: star icon + "4.5 / 5.0"
  - Reviews: "+27 reviews gained"
  - Competitor: arrow icon + "17 ahead of AUDIT_Competitor HVAC"
- Service types still shows "No services" because `service_types_enabled` is empty array

**Note:** The card dynamically reflects metadata changes after save. Optimistic UI updates work correctly.

**Result: PASS**

---

## BIZ-03: Detail Drawer Sections

**Requirement:** Clicking the "Audit Test HVAC" card opens the detail drawer with all 4 sections visible: Google Performance, Competitive Analysis, Agency Details, Notes.

**Steps:**
1. Clicked the "Audit Test HVAC" card
2. Drawer opened as a dialog

**Observations:**
- Drawer title: "Audit Test HVAC"
- Subtitle: "Client details and competitive analysis"
- **Section 1 — Google Performance:**
  - Rating Start: Not set
  - Rating Current: Not set
  - Reviews Start: Not set
  - Reviews Current: Not set
- **Section 2 — Competitive Analysis:**
  - Your Client: -- reviews
  - Competitor: -- reviews
  - Helper text: "Add competitor data to see gap analysis"
- **Section 3 — Agency Details:**
  - Monthly Fee: Not set
  - Start Date: Not set
  - GBP Access: Not set
- **Section 4 — Notes:**
  - Label: "Notes"
  - Subtitle: "Private agency notes (auto-saved)"
  - Textarea placeholder: "Add notes about this client..."
- "Edit Details" button at bottom
- "Close" (X) button top-right

**Screenshot:** `qa-66-detail-drawer.png`

**Result: PASS**

---

## BIZ-04: Metadata Editing with DB Verification

**Requirement:** Editing metadata fields in the drawer and clicking Save persists values to the database — verified by SQL query.

**Steps:**
1. Clicked "Edit Details" in the drawer
2. Form switched to edit mode with input fields
3. Filled in all fields:
   - Rating Start: 4.2
   - Rating Current: 4.5
   - Reviews Start: 85
   - Reviews Current: 112
   - Monthly Fee: 199
   - Start Date: 2026-01-15
   - Competitor Name: AUDIT_Competitor HVAC
   - Competitor Review Count: 95
   - GBP Access: toggled ON
4. Clicked "Save"
5. Toast notification: "Changes saved"
6. Drawer reverted to read-only mode with populated values

**UI After Save:**
- Google Performance: Rating Start 4.2 (star icon), Rating Current 4.5 (star icon), Reviews Start 85, Reviews Current 112, Reviews Gained +27
- Competitive Analysis: Your Client 112 reviews vs AUDIT_Competitor HVAC 95 reviews, "+17 reviews ahead" (green)
- Agency Details: Monthly Fee $199.00, Start Date Jan 15, 2026, GBP Access "Yes" (green)

**DB Verification:**
```sql
SELECT google_rating_start, google_rating_current, review_count_start,
       review_count_current, monthly_fee, start_date, gbp_access,
       competitor_name, competitor_review_count
FROM businesses WHERE id = '6ed94b54-6f35-4ede-8dcb-28f562052042';

-- Result:
-- google_rating_start: 4.2
-- google_rating_current: 4.5
-- review_count_start: 85
-- review_count_current: 112
-- monthly_fee: 199.00
-- start_date: 2026-01-15
-- gbp_access: true
-- competitor_name: AUDIT_Competitor HVAC
-- competitor_review_count: 95
```

All values match UI inputs exactly.

**Screenshots:** `qa-66-metadata-edit-filled.png`

**Result: PASS**

---

## BIZ-05: Notes Auto-Save

**Requirement:** Typing notes in the drawer, waiting 1 second, refreshing the page, and reopening the drawer shows the notes are retained (auto-save via 500ms debounce).

**Steps:**
1. Typed in Notes textarea: "AUDIT_ QA test note — verifying auto-save at 2026-03-02T19:10"
2. Waited 2 seconds for debounce to fire
3. Verified DB immediately after typing (before refresh)
4. Closed drawer
5. Refreshed page (navigated to /businesses)
6. Reopened drawer by clicking business card

**DB Verification (before refresh):**
```sql
SELECT agency_notes FROM businesses
WHERE id = '6ed94b54-6f35-4ede-8dcb-28f562052042';

-- Result: "AUDIT_ QA test note — verifying auto-save at 2026-03-02T19:10"
```

**After Refresh:**
- Reopened drawer shows notes textarea with exact text: "AUDIT_ QA test note — verifying auto-save at 2026-03-02T19:10"
- Notes survived full page refresh

**Screenshot:** `qa-66-notes-retained.png`

**Result: PASS**

---

## BIZ-06: Switch to This Business

**Requirement:** "Switch to this business" button in the drawer for the non-active business changes the active business — sidebar shows new business name after switch.

**Precondition:** Active business is "AUDIT_ Test Plumbing" (set by wizard completion in BIZ-07). User has 2 businesses.

**Steps:**
1. Navigated to /businesses
2. Verified 2 cards visible (Audit Test HVAC + AUDIT_ Test Plumbing)
3. Sidebar shows "AUDIT_ Test Plumbing" as current business (with dropdown chevron)
4. Clicked "Audit Test HVAC" card to open its drawer
5. Drawer shows all metadata from BIZ-04, notes from BIZ-05
6. **"Switch to this business" button visible** in the drawer footer (only appears for non-active businesses)
7. Clicked "Switch to this business"

**Observations:**
- Toast notification: "Switched to Audit Test HVAC"
- Sidebar business name updated immediately: "AUDIT_ Test Plumbing" -> "Audit Test HVAC"
- Dashboard badge count changed: 0 -> 3 (reflecting Audit Test HVAC's ready-to-send queue)
- "Active" badge moved from AUDIT_ Test Plumbing card to Audit Test HVAC card
- Drawer closed automatically after switch
- Page did not reload — UI updated via revalidatePath

**Screenshot:** `qa-66-switched-business.png`

**Result: PASS**

---

## BIZ-07: Add Business Wizard

**Requirement:** "Add Business" button navigates to /onboarding?mode=new and loads the CreateBusinessWizard (2-step: Business Setup + Campaign Preset). Completing wizard creates new business with correct data.

**Steps:**
1. Clicked "Add Business" button on /businesses page
2. Navigated to `/onboarding?mode=new`
3. CreateBusinessWizard loaded with Step 1 of 2: "Set up your new business"

**Step 1 — Business Setup:**
- Filled: Business name = "AUDIT_ Test Plumbing"
- Filled: Phone number = "(555) 987-6543"
- Google review link: left empty
- Selected service types: Plumbing (checkmark shown) + Handyman (checkmark shown)
- "Continue" button enabled after name + at least 1 service type selected
- Clicked Continue

**Step 2 — Campaign Preset:**
- Page: "Choose your follow-up approach"
- 3 preset options displayed:
  - Gentle Follow-Up: Two emails over 3 days
  - Standard Follow-Up: Two emails and a text message over 7 days
  - Aggressive Follow-Up: A text within hours, then email and SMS reminders
- Selected "Standard Follow-Up"
- "Continue" button enabled after selection
- Clicked Continue

**After Wizard Completion:**
- Redirected to /dashboard
- Active business switched to "AUDIT_ Test Plumbing" (sidebar shows new business name with dropdown chevron)
- Dashboard shows fresh state (0 jobs, 0 messages, 0 reviews)
- Business switcher is now a dropdown (user has 2 businesses)

**DB Verification:**
```sql
SELECT id, name, service_types_enabled, onboarding_completed_at
FROM businesses
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'audit-test@avisloop.com')
ORDER BY created_at;

-- Result:
-- 1. id: 6ed94b54-..., name: "Audit Test HVAC", service_types_enabled: [], onboarding_completed_at: null
-- 2. id: ba41879d-..., name: "AUDIT_ Test Plumbing", service_types_enabled: ["plumbing","handyman"], onboarding_completed_at: 2026-03-03T00:13:44

-- Campaign created for new business:
SELECT id, name, service_type, status
FROM campaigns
WHERE business_id = 'ba41879d-7458-4d47-909f-1dce6ddd0e69';

-- Result: id: 35125091-..., name: "Standard (Email + SMS)", service_type: null, status: "active"
```

- New business created with correct name and service types (plumbing + handyman)
- onboarding_completed_at is set (wizard completed successfully)
- Campaign "Standard (Email + SMS)" created with service_type=null (targets all services), status=active

**Screenshots:** `qa-66-add-business-wizard.png`, `qa-66-wizard-step1-filled.png`, `qa-66-wizard-completed.png`

**Result: PASS**

---

## Post-Test State

- Active business: **Audit Test HVAC** (restored via BIZ-06 switch)
- Business count: 2 (Audit Test HVAC + AUDIT_ Test Plumbing)
- Business B ID: `ba41879d-7458-4d47-909f-1dce6ddd0e69`
- Business B service_types_enabled: `["plumbing", "handyman"]`
- Business B campaign: "Standard (Email + SMS)" (id: `35125091-96af-4427-b381-86f2378aede6`)

---

## Summary

| ID | Requirement | Result | Evidence |
|----|------------|--------|----------|
| BIZ-01 | Card grid display | **PASS** | qa-66-businesses-page.png |
| BIZ-02 | Card content details | **PASS** | qa-66-businesses-page.png, qa-66-notes-retained.png |
| BIZ-03 | Detail drawer 4 sections | **PASS** | qa-66-detail-drawer.png |
| BIZ-04 | Metadata edit + DB verify | **PASS** | qa-66-metadata-edit-filled.png, SQL verification |
| BIZ-05 | Notes auto-save | **PASS** | qa-66-notes-retained.png, SQL verification |
| BIZ-06 | Switch to this business | **PASS** | qa-66-switched-business.png |
| BIZ-07 | Add Business wizard | **PASS** | qa-66-add-business-wizard.png, qa-66-wizard-step1-filled.png, qa-66-wizard-completed.png, SQL verification |

**Overall: 7/7 PASS**

## Bugs Found

None. All 7 requirements passed without issues.

## Screenshots Index

| File | Description |
|------|-------------|
| `qa-66-businesses-page.png` | Initial businesses page with 1 card |
| `qa-66-detail-drawer.png` | Detail drawer with 4 sections (empty state) |
| `qa-66-metadata-edit-filled.png` | Edit form with all metadata fields populated |
| `qa-66-notes-retained.png` | Drawer after page refresh showing retained notes + all metadata |
| `qa-66-add-business-wizard.png` | CreateBusinessWizard Step 1 empty state |
| `qa-66-wizard-step1-filled.png` | Wizard Step 1 with business details + services selected |
| `qa-66-wizard-completed.png` | Dashboard after wizard completion showing new active business |
| `qa-66-two-cards.png` | Businesses page with 2 cards after wizard completion |
| `qa-66-switched-business.png` | Businesses page after switching back to Audit Test HVAC |

---

*QA audit complete. All 7 BIZ requirements verified. Second business "AUDIT_ Test Plumbing" created as prerequisite for Plans 66-02 (switcher) and 66-03 (data isolation).*
