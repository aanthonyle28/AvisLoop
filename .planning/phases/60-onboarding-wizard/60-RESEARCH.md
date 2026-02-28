# Phase 60: Onboarding Wizard - Research

**Researched:** 2026-02-27
**Domain:** QA E2E testing of both onboarding wizard flows (first-business and additional-business) plus draft persistence
**Confidence:** HIGH

---

## Summary

Phase 60 is a **QA E2E audit** — no new features to build. The goal is to use Playwright MCP tools and Supabase MCP to exercise both onboarding wizard flows and verify they work correctly. This research catalogs every component, route, step, form field, validation rule, server action, and database effect so the planner can write precise step-by-step test scripts.

The AvisLoop onboarding system has two distinct wizard flows: (1) the first-business `OnboardingWizard` (4 steps, with localStorage draft persistence), and (2) the `CreateBusinessWizard` for additional businesses (2 steps, no draft persistence). The two flows share a single page (`/onboarding`) with `?mode=new` as the branch parameter. The page component makes the routing decision: if `mode=new`, render `CreateBusinessWizard`; otherwise render `OnboardingWizard`.

**Critical discovery:** The primary test account (`audit-test@avisloop.com`) has its only business with `onboarding_completed_at = null` and empty `service_types_enabled`. This means the first-run wizard (ONB-01) CAN be tested directly with the primary account — it will redirect to `/onboarding` on login and render `OnboardingWizard`. No second test account is required. However, completing ONB-01 will mark onboarding complete, so ONB-01 must run LAST or the business must be reset afterward.

**Additional discovery:** `software_used` is referenced in the TypeScript `Business` type and in `saveSoftwareUsed()` but the column does NOT exist in the `businesses` table. The CRM Platform step (step 3) will silently fail or produce a Supabase error when saving. This is a real bug to document.

**Primary recommendation:** Structure the plan as one PLAN file. Test ONB-02 (additional business) first (it doesn't affect the existing business's onboarding state), then ONB-03 (draft persistence, also uses existing incomplete-onboarding state), then ONB-01 last (completing the wizard marks the business as done). After ONB-01, reset the business back to `onboarding_completed_at = null` via Supabase MCP so future test runs can repeat.

---

## Testing Tools

This is a QA phase — no libraries to install. All testing uses the tools already present:

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `browser_navigate` | Navigate to onboarding pages | Every test start |
| `browser_snapshot` | Get accessible page structure for selectors | Before every interaction |
| `browser_click` | Click buttons, service type chips, preset cards | Form navigation |
| `browser_type` | Type into text inputs | Business name, phone, URLs |
| `browser_fill_form` | Fill multiple fields at once | Multi-field forms |
| `browser_press_key` | Press Enter, Tab | Custom service tag input |
| `browser_wait_for` | Wait for text/navigation | After form submission, after page redirect |
| `browser_take_screenshot` | Capture evidence | Every finding, every step |
| `browser_console_messages` | Check for JS errors | After every page load |
| `mcp__supabase__execute_sql` | Verify DB state before and after | Business created, campaign created |

---

## Component Map

### Route Decision Tree

```
GET /onboarding
  → user not authenticated → redirect /login
  → params.mode === 'new'
      → render CreateBusinessWizard (2 steps)
  → mode not 'new'
      → activeBusiness exists AND onboarding_completed_at IS NOT NULL
          → redirect /dashboard (unless mode=new)
      → activeBusiness exists AND onboarding_completed_at IS NULL
          → render OnboardingWizard (4 steps) with existing business data pre-filled
      → activeBusiness is null (brand new user)
          → render OnboardingWizard (4 steps) with empty defaults
```

**Key file:** `app/onboarding/page.tsx`
- Server component
- Reads `searchParams.mode`
- Calls `getActiveBusiness()` (cookie-based, returns null for users with no businesses)
- Calls `getOnboardingStatus(businessId)` — checks `onboarding_completed_at` column
- Fetches campaign presets: `campaigns WHERE is_preset = true`
- Fetches full business data for pre-populating wizard steps

### First-Business Wizard: `OnboardingWizard`

**File:** `components/onboarding/onboarding-wizard.tsx`
**Type:** Client component
**Steps:** 4 total (no skipping allowed except CRM Platform step 3)

```
Step 1: Business Setup     (required) — saveBusinessBasics + saveServicesOffered
Step 2: Campaign Preset    (required) — createCampaignFromPreset
Step 3: CRM Platform       (skippable) — saveSoftwareUsed [BUG: column missing]
Step 4: SMS Consent        (required) — acknowledgeSMSConsent + markOnboardingComplete
```

**Storage key:** `onboarding-draft-v3` (localStorage)
**Draft schema:** `z.record(z.string(), z.unknown())` — any key/value pairs allowed
**Draft behavior:**
- Loads on mount from `localStorage.getItem('onboarding-draft-v3')`
- Saves whenever `draftData` state changes (useEffect)
- Cleared on completion: `localStorage.removeItem('onboarding-draft-v3')`
- Draft schema validated via Zod `draftDataSchema.safeParse()` — corrupt data is discarded

**URL parameter:** `?step=1` through `?step=4` — wizard pushes to URL on navigation
**Progress bar:** Fixed at bottom, shows `{currentStep}/{totalSteps}` (e.g., "1/4")
**Completion redirect:** `/dashboard?onboarding=complete`

**Step routing component:** `components/onboarding/onboarding-steps.tsx` — switch on `currentStep`, renders appropriate step component

### First-Business Step 1: Business Setup

**File:** `components/onboarding/steps/business-setup-step.tsx`
**Heading:** "Let's get your business set up"
**Subheading:** "This info appears in your review request messages."
**Submit button:** "Continue" (loading: "Saving...")

**Form fields:**

| Field | ID | Type | Label | Placeholder | Required |
|-------|-----|------|-------|-------------|----------|
| Business name | `business-name` | text | "Business name *" | "e.g. Sunrise HVAC" | Yes |
| Phone number | `phone-number` | tel | "Phone number" | "(555) 123-4567" | No |
| Google review link | `google-review-link` | url | "Google review link" | "https://g.page/r/..." | No |

**Service type chips** (toggle buttons, NOT checkboxes):
- `HVAC`, `Plumbing`, `Electrical`, `Cleaning`, `Roofing`, `Painting`, `Handyman`, `Other`
- Rendered as `<button type="button">` with pill styling
- Selected state: `bg-primary text-primary-foreground border-primary` + Check icon
- Section heading: "What services do you offer?"

**Custom service names** (shown only when "Other" is selected):
- Label: "What type of service?"
- Input id: `custom-service` — placeholder: "e.g. Pest Control, Pool Cleaning..."
- "Add" button (outline, sm)
- Enter key also adds the tag
- Tags rendered as `TagBadge` with X to remove
- Max 10 custom names — when at limit: "Maximum 10 custom services" text

**Validation (client-side):**
- Empty business name → `setError('Business name is required')`
- No service selected → `setError('Select at least one service type')`
- Error displays below service chips: `<p className="text-sm text-error-text">{error}</p>`
- Continue button is `disabled` when `selected.length === 0` (regardless of name)

**Server actions called (in sequence):**
1. `saveBusinessBasics({ name, phone, googleReviewLink })` — upserts business
2. `saveServicesOffered({ serviceTypes, customServiceNames })` — updates service_types_enabled

**DB effects:**
- `businesses.name` set
- `businesses.phone` set (or null)
- `businesses.google_review_link` set (or null)
- `businesses.service_types_enabled` = selected service types array
- `businesses.service_type_timing` = defaults map for selected types
- `businesses.custom_service_names` = custom names array (or [])

### First-Business Step 2: Campaign Preset

**File:** `components/onboarding/steps/campaign-preset-step.tsx`
**Heading:** "Choose your follow-up approach"
**Subheading:** "Select a campaign style. You can change this later in Campaigns."
**Back button:** "Back" (outline)
**Continue button:** "Continue" (loading: "Creating...")

**Preset cards** (role="radiogroup", aria-label="Campaign preset options"):
- Each card: `role="radio"`, `aria-checked={isSelected}`, `tabIndex={0}`
- Keyboard: Enter/Space to select
- Selected style: `border-primary ring-2 ring-primary bg-primary/5`
- Unselected style: `border-border hover:border-primary/50`

**Three system presets (ordered: conservative → standard → aggressive):**

| DB Name | Display Name | Description | Touches |
|---------|-------------|-------------|---------|
| "Conservative (Email Only)" | "Gentle Follow-Up" | "Two emails over 3 days. Good for established relationships or high-ticket services." | 2 |
| "Standard (Email + SMS)" | "Standard Follow-Up" | "Two emails and a text message over 7 days. Works well for most businesses." | 3 |
| "Aggressive (Multi-Channel)" | "Aggressive Follow-Up" | "A text within hours, then email and SMS reminders. Best for quick-turnaround services like cleaning." | 4 |

Note: DB names don't exactly contain `conservative`/`standard`/`aggressive` — the match logic is `preset.name.toLowerCase().includes(p.id)`. "Conservative (Email Only)" → includes `conservative`, "Standard (Email + SMS)" → includes `standard`, "Aggressive (Multi-Channel)" → includes `aggressive`. All three match.

Continue is `disabled` until a preset is selected.

**Server action:** `createCampaignFromPreset(presetId)` → wraps `duplicateCampaign(presetId)`
- `duplicateCampaign` uses `getActiveBusiness()` to get current business
- Creates new campaign with `is_preset = false`, copies all touches
- On success: `toast.success('Campaign created!')` then advances step

**DB effects:**
- New row in `campaigns` table: `{ business_id, name: presetName, service_type: null, status: 'active', is_preset: false }`
- New rows in `campaign_touches` table: copies of all preset touches

### First-Business Step 3: CRM Platform

**File:** `components/onboarding/steps/crm-platform-step.tsx`
**Heading:** "What software do you use to manage jobs?"
**Subheading:** "This helps us plan integrations. Skip if you're unsure."
**Back button:** "Back" (outline)
**Continue button:** "Continue" (loading: "Saving...")
**Skip link:** "Skip without saving" (text link below buttons)

**Info banner:** "This is for our roadmap planning only. No integration will be set up now."

**CRM platform grid cards** (role="radiogroup", aria-label="CRM platform options"):

| Value | Label | Abbr | Color |
|-------|-------|------|-------|
| `jobber` | "Jobber" | "JB" | bg-emerald-500 |
| `housecall_pro` | "Housecall Pro" | "HC" | bg-blue-500 |
| `servicetitan` | "ServiceTitan" | "ST" | bg-red-500 |
| `gorilladesk` | "GorillaDesk" | "GD" | bg-orange-500 |
| `fieldpulse` | "FieldPulse" | "FP" | bg-violet-500 |
| `none` | "None" | (Minus icon) | bg-muted |
| `other` | "Other" | "?" | bg-muted |

When "Other" is selected: reveals text input with `aria-label="Custom CRM platform name"`, placeholder "e.g. Workiz, Kickserv..."

**Skip behavior:** Clicking "Skip without saving" calls `onComplete()` directly WITHOUT calling `saveSoftwareUsed()`. The step is bypassed entirely.

**Continue behavior:** Calls `saveSoftwareUsed({ softwareUsed: valueToSave })`, then calls `onComplete()` even if `saveSoftwareUsed` errors (the action failure is not surfaced to the UI).

**KNOWN BUG:** `saveSoftwareUsed` tries to do `.update({ software_used: ... })` on the `businesses` table, but `software_used` column does NOT exist in the database (verified via Supabase MCP). The Supabase update will fail silently — the action returns a Supabase error, but `handleContinue()` calls `onComplete()` regardless. The CRM step appears to complete successfully even though DB write fails.

**DB effects:** None (column missing — silent fail). This should be documented as a bug finding.

### First-Business Step 4: SMS Consent

**File:** `components/onboarding/steps/sms-consent-step.tsx`
**Heading:** "SMS consent requirements"
**Subheading:** "Important information about sending text messages to customers"
**Back:** "Back" (text link, not button)
**Submit button:** "Complete Setup" (loading: "Completing...")

**Requirements card** (bordered, bg-card):
- Heading: "Key requirements:"
- 4 bullet points about TCPA compliance

**Acknowledgment checkbox:**
- ID: `sms-consent-acknowledgment`
- Label: "I understand that I must obtain written consent from customers before sending them SMS messages, and I will maintain records of consent as required by TCPA regulations."
- Checkbox uses Radix `Checkbox` component (16px, styled with ring on focus)

**Validation:**
- Checkbox unchecked + submit → `toast.error('You must acknowledge SMS consent requirements to continue')`
- Complete Setup button `disabled` when checkbox unchecked

**Server actions called (in sequence):**
1. `acknowledgeSMSConsent({ acknowledged: true })` — sets `sms_consent_acknowledged = true`
2. `markOnboardingComplete()` — sets `onboarding_completed_at = NOW()`

**DB effects:**
- `businesses.sms_consent_acknowledged` = true
- `businesses.sms_consent_acknowledged_at` = timestamp
- `businesses.onboarding_completed_at` = timestamp

**Completion:** `router.push('/dashboard?onboarding=complete')`

### Additional-Business Wizard: `CreateBusinessWizard`

**File:** `components/onboarding/create-business-wizard.tsx`
**Steps:** 2 total (state managed in-component, no URL params, no localStorage)
**Progress bar:** Fixed at bottom, shows `{step}/2`

```
Step 1: Business Setup (same fields as first-business step 1, different heading)
Step 2: Campaign Preset (same UI as first-business step 2, different server action)
```

Note: The code comment says "3-step wizard" and PROJECT_STATE.md mentions "3-step modal (business details → services → SMS consent)" but the ACTUAL implementation in `create-business-wizard.tsx` has only 2 rendered steps (Step 1 includes both business details AND service selection; Step 3 SMS consent was removed — `handleStep2Complete` calls `completeNewBusinessOnboarding` directly without an SMS consent UI).

**Step 1 heading:** "Set up your new business" (differs from first-business "Let's get your business set up")
**Form fields:** Same as first-business step 1 (business name, phone, google review link, service chips, custom service input)
**Step 2 heading/UI:** Identical to first-business step 2

**Server actions (all from `lib/actions/create-additional-business.ts`):**

Step 1 calls in sequence:
1. `createAdditionalBusiness({ name, phone, googleReviewLink })` — pure INSERT, never upsert. Returns `{ success: true, businessId }`.
2. `saveNewBusinessServices(newBusinessId, { serviceTypes, customServiceNames })` — UPDATE scoped to new businessId

Step 2 calls:
3. `createNewBusinessCampaign(newBusinessId, selectedPresetId)` — inlines duplicateCampaign, avoids getActiveBusiness()

After step 2:
4. `completeNewBusinessOnboarding(newBusinessId)` — sets `sms_consent_acknowledged = true`, `sms_consent_acknowledged_at = NOW()`, `onboarding_completed_at = NOW()`
5. `switchBusiness(newBusinessId)` — sets `active_business_id` cookie
6. `router.push('/dashboard')` — redirect (no `?onboarding=complete` query param)

**DB effects (new business row only):**
- `businesses` INSERT: `{ user_id, name, phone, google_review_link }`
- `businesses` UPDATE: `{ service_types_enabled, service_type_timing, custom_service_names }`
- `campaigns` INSERT: new campaign for new business
- `campaign_touches` INSERT: copies of preset touches
- `businesses` UPDATE: `{ sms_consent_acknowledged: true, sms_consent_acknowledged_at, onboarding_completed_at }`

**Existing businesses UNCHANGED:** All server actions use explicit `businessId` parameter scoped to the new business. The `active_business_id` cookie is updated to point to the new business, but no data on existing businesses is modified.

**No draft persistence:** Comment in source: "No localStorage draft persistence (intentional — wizard is only 2 steps)."

---

## Selectors Reference

### Step 1 (Business Setup) — Selectors

| Element | Strategy | Selector Text |
|---------|----------|--------------|
| Step 1 heading | by role | heading "Let's get your business set up" (first-biz) or "Set up your new business" (additional) |
| Business name input | by label | "Business name *" (or id: `business-name`) |
| Phone input | by label | "Phone number" (or id: `phone-number`) |
| Google review link | by label | "Google review link" (or id: `google-review-link`) |
| HVAC chip | by text | "HVAC" |
| Plumbing chip | by text | "Plumbing" |
| Electrical chip | by text | "Electrical" |
| Cleaning chip | by text | "Cleaning" |
| Roofing chip | by text | "Roofing" |
| Painting chip | by text | "Painting" |
| Handyman chip | by text | "Handyman" |
| Other chip | by text | "Other" |
| Custom service input | by label | "What type of service?" (or id: `custom-service`) |
| Add custom service button | by role/text | button "Add" |
| Continue button | by role/text | button "Continue" |
| Error message | by text | "Business name is required" or "Select at least one service type" |
| Progress bar | by role | progressbar (aria-label contains "Step 1 of 4" or "Step 1 of 2") |

### Step 2 (Campaign Preset) — Selectors

| Element | Strategy | Selector Text |
|---------|----------|--------------|
| Step 2 heading | by role | heading "Choose your follow-up approach" |
| Gentle Follow-Up card | by text | "Gentle Follow-Up" |
| Standard Follow-Up card | by text | "Standard Follow-Up" |
| Aggressive Follow-Up card | by text | "Aggressive Follow-Up" |
| Back button | by role/text | button "Back" |
| Continue button | by role/text | button "Continue" |
| Progress bar | by role | progressbar (aria-label contains "Step 2") |

### Step 3 (CRM Platform) — Selectors

| Element | Strategy | Selector Text |
|---------|----------|--------------|
| Step 3 heading | by role | heading "What software do you use to manage jobs?" |
| Jobber card | by text | "Jobber" |
| Housecall Pro card | by text | "Housecall Pro" |
| ServiceTitan card | by text | "ServiceTitan" |
| GorillaDesk card | by text | "GorillaDesk" |
| FieldPulse card | by text | "FieldPulse" |
| None card | by text | "None" |
| Other card | by text | "Other" |
| Custom CRM input | by label | "Custom CRM platform name" (aria-label) |
| Back button | by role/text | button "Back" |
| Continue button | by role/text | button "Continue" |
| Skip link | by text | "Skip without saving" |
| Progress bar | by role | progressbar (aria-label contains "Step 3") |

### Step 4 (SMS Consent) — Selectors

| Element | Strategy | Selector Text |
|---------|----------|--------------|
| Step 4 heading | by role | heading "SMS consent requirements" |
| Requirements card | by text | "Key requirements:" |
| SMS consent checkbox | by id | `sms-consent-acknowledgment` |
| Checkbox label | by text | "I understand that I must obtain written consent..." |
| Back link | by text | "Back" |
| Complete Setup button | by role/text | button "Complete Setup" |
| Progress bar | by role | progressbar (aria-label contains "Step 4") |

### Progress Bar — Selectors

| State | Selector |
|-------|----------|
| Step 1 of 4 | role=progressbar, aria-valuenow=1, aria-valuemax=4 |
| Step 2 of 4 | role=progressbar, aria-valuenow=2, aria-valuemax=4 |
| Step 3 of 4 | role=progressbar, aria-valuenow=3, aria-valuemax=4 |
| Step 4 of 4 | role=progressbar, aria-valuenow=4, aria-valuemax=4 |
| Step 1 of 2 | role=progressbar, aria-valuenow=1, aria-valuemax=2 |
| Step 2 of 2 | role=progressbar, aria-valuenow=2, aria-valuemax=2 |

---

## Database Verification Queries

### Before ONB-01: Verify starting state

```sql
-- Verify audit-test business is NOT yet onboarding-complete (pre-condition)
SELECT id, name, onboarding_completed_at, service_types_enabled, sms_consent_acknowledged
FROM businesses
WHERE user_id = 'ac6f9407-7e88-4204-9f0f-8d213c58ab67';
-- Expected: onboarding_completed_at = null, service_types_enabled = {}
```

### After ONB-01: Verify first-run wizard completion

```sql
-- Business should have onboarding complete + services set
SELECT name, onboarding_completed_at, service_types_enabled, service_type_timing,
       sms_consent_acknowledged, sms_consent_acknowledged_at
FROM businesses
WHERE user_id = 'ac6f9407-7e88-4204-9f0f-8d213c58ab67';
-- Expected: onboarding_completed_at IS NOT NULL, service_types_enabled non-empty,
--           sms_consent_acknowledged = true

-- Campaign should exist for audit-test business
SELECT id, name, service_type, status, is_preset, created_at
FROM campaigns
WHERE business_id = '6ed94b54-6f35-4ede-8dcb-28f562052042'
AND is_preset = false
ORDER BY created_at DESC;
-- Expected: 1+ campaign rows, is_preset = false

-- Campaign touches should exist
SELECT ct.touch_number, ct.channel, ct.delay_hours
FROM campaign_touches ct
JOIN campaigns c ON c.id = ct.campaign_id
WHERE c.business_id = '6ed94b54-6f35-4ede-8dcb-28f562052042'
AND c.is_preset = false
ORDER BY c.created_at DESC, ct.touch_number;
-- Expected: 2-4 touches depending on preset selected
```

### Reset after ONB-01 (so future runs can repeat):

```sql
-- Reset audit-test business to pre-onboarding state for repeatability
UPDATE businesses
SET onboarding_completed_at = NULL,
    sms_consent_acknowledged = false,
    sms_consent_acknowledged_at = NULL,
    service_types_enabled = '{}',
    service_type_timing = '{"hvac": 24, "other": 24, "roofing": 72, "cleaning": 4, "handyman": 24, "painting": 48, "plumbing": 48, "electrical": 24}',
    custom_service_names = '{}'
WHERE user_id = 'ac6f9407-7e88-4204-9f0f-8d213c58ab67';

-- Delete campaigns created during the test (non-preset, owned by audit-test)
DELETE FROM campaigns
WHERE business_id = '6ed94b54-6f35-4ede-8dcb-28f562052042'
AND is_preset = false
AND created_at > NOW() - INTERVAL '1 hour';
```

### Before ONB-02: Get audit-test business count (baseline)

```sql
-- Capture baseline business count and data for audit-test user
SELECT id, name, onboarding_completed_at, created_at
FROM businesses
WHERE user_id = 'ac6f9407-7e88-4204-9f0f-8d213c58ab67'
ORDER BY created_at;
-- Expected: 1 row (the existing "Audit Test HVAC" business)
```

### After ONB-02: Verify additional business created, existing untouched

```sql
-- New business should appear
SELECT id, name, onboarding_completed_at, service_types_enabled,
       sms_consent_acknowledged, created_at
FROM businesses
WHERE user_id = 'ac6f9407-7e88-4204-9f0f-8d213c58ab67'
ORDER BY created_at;
-- Expected: 2 rows — original unchanged, new one with onboarding_completed_at set

-- Original business MUST have its data unchanged
SELECT id, name, onboarding_completed_at
FROM businesses
WHERE id = '6ed94b54-6f35-4ede-8dcb-28f562052042';
-- Expected: name = 'Audit Test HVAC', onboarding_completed_at = null (original state)

-- New business should have a campaign
SELECT c.name, c.status, c.is_preset, c.business_id
FROM campaigns c
JOIN businesses b ON b.id = c.business_id
WHERE b.user_id = 'ac6f9407-7e88-4204-9f0f-8d213c58ab67'
AND c.is_preset = false
AND c.business_id != '6ed94b54-6f35-4ede-8dcb-28f562052042'
ORDER BY c.created_at DESC;
-- Expected: 1 campaign for the new business
```

### Cleanup after ONB-02:

```sql
-- Delete the additional business created during the test
DELETE FROM businesses
WHERE user_id = 'ac6f9407-7e88-4204-9f0f-8d213c58ab67'
AND id != '6ed94b54-6f35-4ede-8dcb-28f562052042';
-- CASCADE will delete associated campaigns and campaign_touches automatically
```

### ONB-03: Draft persistence verification

```sql
-- No DB verification needed — draft is localStorage only.
-- The test verifies: fill step 1, refresh, step 1 data still visible in form.
-- Optionally verify via browser_evaluate:
-- localStorage.getItem('onboarding-draft-v3')
```

---

## Playwright MCP Walkthrough Examples

### ONB-02: Additional Business Creation (run FIRST — doesn't affect primary business state)

```
PRE-CONDITION: logged in as audit-test@avisloop.com

1. mcp__supabase__execute_sql → capture baseline business count (1 business)

2. browser_navigate → http://localhost:3000/businesses
3. browser_snapshot → verify "Add Business" button visible
4. browser_take_screenshot → evidence (businesses page)

5. browser_click → ref for "Add Business" button
6. browser_wait_for → text: "Set up your new business"
7. browser_snapshot → verify CreateBusinessWizard step 1 loaded
8. browser_console_messages (level: error) → check no JS errors

--- Step 1: Fill business details ---

9. browser_type → ref for "business-name" input, text: "Phase 60 Test Business"
10. browser_type → ref for "phone-number" input, text: "555-000-0001"
11. browser_click → ref for "HVAC" chip (service type)
12. browser_snapshot → verify HVAC chip is selected (has check icon, blue background)

13. browser_click → ref for "Continue" button
14. browser_wait_for → text: "Choose your follow-up approach"
15. browser_snapshot → verify step 2 (Campaign Preset) loaded
16. browser_console_messages (level: error) → check no JS errors

--- Step 2: Select campaign preset ---

17. browser_click → ref for "Standard Follow-Up" card
18. browser_snapshot → verify card selected (ring-2 styling)

19. browser_click → ref for "Continue" button
20. browser_wait_for → text: "Dashboard" (redirect to dashboard)
21. browser_snapshot → verify on dashboard (not onboarding)
22. browser_console_messages (level: error) → check no JS errors
23. browser_take_screenshot → evidence

--- DB verification ---

24. mcp__supabase__execute_sql → verify 2 businesses now exist for user
25. mcp__supabase__execute_sql → verify original business "Audit Test HVAC" unchanged
26. mcp__supabase__execute_sql → verify new business has campaign

--- Cleanup ---

27. mcp__supabase__execute_sql → DELETE new business (CASCADE cleans campaigns)
```

### ONB-03: Draft Persistence (run SECOND)

```
PRE-CONDITION: audit-test business has onboarding_completed_at = null
              (original state — will redirect to /onboarding on login)

1. browser_navigate → http://localhost:3000/onboarding
   (or login + follow redirect if not already there)
2. browser_wait_for → text: "Let's get your business set up"
3. browser_snapshot → verify step 1 loaded

--- Clear any existing draft first ---

4. browser_evaluate → () => localStorage.removeItem('onboarding-draft-v3')

--- Fill step 1 partially ---

5. browser_type → ref for "business-name" input, text: "Draft Test Business Name"
6. browser_type → ref for "phone-number" input, text: "555-000-9999"
7. browser_click → ref for "Plumbing" chip

--- Verify draft is written to localStorage ---

8. browser_evaluate → () => localStorage.getItem('onboarding-draft-v3')
   (The OnboardingWizard writes draftData to localStorage whenever it changes.
    However, draftData is managed at wizard level — step components call onComplete
    to advance the wizard, not to save intermediate form data. The wizard itself
    doesn't directly intercept per-field changes from step components.)

--- Navigate away and back to trigger URL-based step persistence ---

9. Note: The wizard persists step number via URL (?step=N), NOT form field values.
   localStorage stores 'draftData' which is the wizard-level state object.
   IMPORTANT: The step components manage their OWN local state (useState).
   When the page is hard-refreshed, the step component remounts and
   defaultValues are passed from the server (fetched from DB, not localStorage).
   Therefore: draft persistence only works if a previous step was COMPLETED
   (which writes data to DB and DB supplies it on next load).

10. browser_navigate → http://localhost:3000/dashboard
    (navigate away)
11. browser_navigate → http://localhost:3000/onboarding
    (return to onboarding — still step 1 since no step was completed)
12. browser_snapshot → verify step 1 still shown (URL shows ?step=1 or no step)

--- Complete step 1 to test DB-backed persistence ---

13. (if form values were cleared by navigation, re-fill)
14. browser_type → ref for "business-name" input, text: "Persistence Test Biz"
15. browser_click → ref for "Electrical" chip
16. browser_click → ref for "Continue" (saves to DB, advances to step 2)
17. browser_wait_for → text: "Choose your follow-up approach"
18. browser_snapshot → step 2 loaded

--- Now test persistence: navigate away mid-wizard ---

19. browser_navigate → http://localhost:3000/dashboard
20. browser_navigate → http://localhost:3000/onboarding
    (URL has no step param — wizard defaults to step=1)

--- IMPORTANT: URL params are the persistence mechanism ---
21. browser_navigate → http://localhost:3000/onboarding?step=2
    (simulate returning to step 2 via URL)
22. browser_snapshot → step 2 should load (Campaign Preset)
23. browser_take_screenshot → evidence

--- Verify step 1 data is preserved in DB (server pre-fills on next load) ---

24. browser_navigate → http://localhost:3000/onboarding?step=1
25. browser_snapshot → business name input should contain "Persistence Test Biz"
    (populated from DB via defaultValues prop from server component)
26. browser_take_screenshot → evidence

--- Cleanup: Reset business to pre-onboarding state ---

27. mcp__supabase__execute_sql → reset business (see cleanup query above)
```

### ONB-01: First-Run Wizard Completion (run LAST)

```
PRE-CONDITION: audit-test business has onboarding_completed_at = null
              Session: logged in as audit-test@avisloop.com

1. mcp__supabase__execute_sql → confirm pre-condition (onboarding_completed_at = null)

2. browser_navigate → http://localhost:3000/dashboard
3. browser_wait_for → text: "Let's get your business set up"
   (dashboard redirects to /onboarding when business not completed)
4. browser_snapshot → verify OnboardingWizard step 1 at /onboarding?step=1
5. browser_console_messages (level: error) → no JS errors
6. browser_take_screenshot → step 1 evidence

--- Step 1: Business Setup ---

7. browser_type → ref for "business-name" input, text: "Audit HVAC Complete"
8. browser_type → ref for "phone-number" input, text: "555-111-2222"
9. browser_type → ref for "google-review-link" input, text: "https://g.page/r/test-audit"
10. browser_click → ref for "HVAC" chip
11. browser_click → ref for "Plumbing" chip
12. browser_snapshot → verify both chips selected (blue, checkmark)
13. browser_take_screenshot → step 1 filled

14. browser_click → ref for "Continue"
15. browser_wait_for → text: "Choose your follow-up approach"
16. browser_snapshot → step 2 loaded at /onboarding?step=2
17. browser_take_screenshot → step 2 evidence

--- Step 2: Campaign Preset ---

18. browser_click → ref for "Gentle Follow-Up" card
    (or any preset card)
19. browser_snapshot → card selected (ring styling)
20. browser_click → ref for "Continue"
21. browser_wait_for → text: "What software do you use to manage jobs?"
22. browser_snapshot → step 3 loaded
23. browser_take_screenshot → step 3 evidence

--- Step 3: CRM Platform (skippable, document bug) ---

24. browser_snapshot → verify info banner: "This is for our roadmap planning only. No integration will be set up now."
25. browser_click → ref for "Jobber" card
26. browser_snapshot → Jobber card selected
27. browser_click → ref for "Continue"
    [EXPECTED: button saves data then advances — but software_used column missing in DB]
28. browser_console_messages (level: error) → capture any errors
29. browser_wait_for → text: "SMS consent requirements"
    [Step advances even if DB write fails — no UI error shown]
30. browser_snapshot → step 4 loaded
31. browser_take_screenshot → step 3→4 transition

--- Step 3 ALSO TEST: Skip path ---
    [Test "Skip without saving" separately if needed]

--- Step 4: SMS Consent ---

32. browser_snapshot → verify checkbox unchecked, Complete Setup disabled
33. browser_click → ref for "Continue" (Complete Setup while unchecked)
    [EXPECTED: toast.error "You must acknowledge SMS consent requirements to continue"]
34. browser_wait_for → text: "You must acknowledge SMS consent requirements"
35. browser_snapshot → error toast visible
36. browser_take_screenshot → validation evidence

37. browser_click → ref for checkbox "sms-consent-acknowledgment"
38. browser_snapshot → checkbox checked, Complete Setup enabled
39. browser_click → ref for "Complete Setup"
40. browser_wait_for → text: (dashboard content — greeting or KPI data)
    (redirect to /dashboard?onboarding=complete)
41. browser_snapshot → verify on dashboard
42. browser_take_screenshot → completion evidence

--- DB verification ---

43. mcp__supabase__execute_sql → verify onboarding_completed_at IS NOT NULL
44. mcp__supabase__execute_sql → verify service_types_enabled = ['hvac', 'plumbing']
45. mcp__supabase__execute_sql → verify sms_consent_acknowledged = true
46. mcp__supabase__execute_sql → verify campaign created (is_preset = false)
47. mcp__supabase__execute_sql → verify campaign_touches exist for new campaign

--- Cleanup: Reset for future test runs ---

48. mcp__supabase__execute_sql → reset business to pre-onboarding state
49. mcp__supabase__execute_sql → delete test-run campaigns
```

---

## Common Pitfalls

### Pitfall 1: Test Order Matters — ONB-01 Changes Global State

**What goes wrong:** Completing ONB-01 marks `onboarding_completed_at` on the audit-test business. If ONB-01 runs first, subsequent navigation to `/dashboard` no longer redirects to `/onboarding`, breaking ONB-03 setup.
**Why it happens:** The wizard completion is a permanent DB change that affects page routing.
**How to avoid:** Run ONB-02 first (only creates a new business), then ONB-03 (only navigates), then ONB-01 last. Always reset the DB via Supabase MCP after ONB-01.
**Warning signs:** Dashboard loads normally instead of redirecting to `/onboarding`.

### Pitfall 2: Draft Persistence is DB-Backed, Not Form-State-Backed

**What goes wrong:** Expecting that typing a business name and refreshing will restore the typed value. The wizard's `draftData` state (stored in `onboarding-draft-v3` localStorage) is a wizard-level object — step components do NOT write to it. Step component form state is local `useState`, lost on refresh.
**Why it happens:** The wizard shell (`onboarding-wizard.tsx`) manages `draftData` but individual step components don't call back to the wizard to save their in-progress form values. Data is only persisted to DB when a step's Continue button is clicked.
**How to avoid:** ONB-03 must complete step 1 (call Continue which writes to DB) before testing "persistence." Then navigate to step 2 URL (`?step=2`) and navigate back to step 1 (`?step=1`) to verify DB-backed pre-fill. The `localStorage` key stores the draftData object, not form field values.
**Correct test:** Fill step 1 → click Continue → DB is written → navigate away → return to `?step=1` → verify business name field is pre-filled (from DB, passed as `defaultValues` by server component).

### Pitfall 3: software_used Column Missing — Silent Failure on Step 3

**What goes wrong:** Step 3 "Continue" button appears to work (advances to step 4) but actually the `saveSoftwareUsed()` server action fails silently because the `software_used` column doesn't exist in the `businesses` table.
**Why it happens:** The TypeScript type (`Business`) has `software_used: string | null` but the migration that was supposed to add it is missing. The action tries to UPDATE the column, Supabase returns an error, but `handleContinue()` in `crm-platform-step.tsx` calls `onComplete()` regardless of the result.
**How to verify:** After clicking Continue on step 3, run Supabase MCP to query `software_used` on the business — it won't exist (column doesn't exist, so no value is stored). Also check `browser_console_messages` for errors.
**What to document:** Bug finding — CRM Platform step silently fails on save. No UX impact (wizard advances), but intent of capturing CRM data is broken.

### Pitfall 4: Additional Business Wizard is 2 Steps, Not 3

**What goes wrong:** Documentation (PROJECT_STATE.md, code comments) says "3-step wizard" but the actual implementation has 2 rendered steps. SMS consent step was removed from `CreateBusinessWizard`; `completeNewBusinessOnboarding()` auto-acknowledges SMS consent.
**Why it happens:** The wizard was simplified post-Phase 56 by removing the SMS consent step. The progress bar shows "1/2" and "2/2", not "1/3".
**How to avoid:** Test 2 steps, not 3. Expect `/dashboard` redirect after step 2 Continue (not a step 3 page).
**Warning signs:** Looking for an SMS consent page in the additional business flow — it won't be there.

### Pitfall 5: CreateBusinessWizard Does NOT Set ?step= URL Params

**What goes wrong:** Expecting URL to update to `?mode=new&step=2` when navigating CreateBusinessWizard.
**Why it happens:** `CreateBusinessWizard` manages step state internally via `useState<1 | 2>` — does NOT use `router.push()` for step navigation. The URL stays at `/onboarding?mode=new` throughout.
**How to avoid:** Snapshot the page content to verify which step is showing, not the URL.
**Warning signs:** URL stays at `/onboarding?mode=new` even when on step 2.

### Pitfall 6: Campaign Preset Name Matching Uses .includes()

**What goes wrong:** Expecting preset cards to show DB names like "Conservative (Email Only)". They actually show the `CAMPAIGN_PRESETS` constant names ("Gentle Follow-Up", "Standard Follow-Up", "Aggressive Follow-Up").
**Why it happens:** The preset step matches DB presets to constants via `preset.name.toLowerCase().includes(p.id)`. The constant `id` values are "conservative", "standard", "aggressive" — and the DB names contain those substrings.
**How to avoid:** Click preset cards by their display names from `CAMPAIGN_PRESETS`: "Gentle Follow-Up", "Standard Follow-Up", "Aggressive Follow-Up".
**Warning signs:** Snapshot doesn't show "Conservative (Email Only)" — looks for "Gentle Follow-Up" instead.

### Pitfall 7: Active Business Cookie Switches After ONB-02

**What goes wrong:** After completing the additional business wizard, `switchBusiness()` sets the `active_business_id` cookie to the NEW business. Subsequent DB queries using the "active business" will query the NEW business, not the original.
**Why it happens:** The wizard explicitly calls `switchBusiness(newBusinessId)` as the final step before `router.push('/dashboard')`.
**How to avoid:** ONB-02 DB verification queries should use explicit `business_id` values (from the SQL), not rely on cookie-based active business resolution. The cleanup SQL should delete by user_id scoped to exclude the original business.

---

## Requirements → Test Mapping

### ONB-01: First-business wizard completes all 4 steps, creates business + campaign

**Pre-condition:** `audit-test@avisloop.com` — existing business with `onboarding_completed_at = null`
**Entry point:** `/dashboard` → redirects to `/onboarding` (auto-redirect when onboarding incomplete)
**Steps to test:**
1. Navigate to dashboard, verify redirect to `/onboarding`
2. Verify OnboardingWizard step 1 renders (heading "Let's get your business set up")
3. Fill business name, select at least one service type, click Continue
4. Verify step 2 (Campaign Preset) renders
5. Select a preset card, click Continue
6. Verify step 3 (CRM Platform) renders, test skip path AND continue path
7. Verify step 4 (SMS Consent) renders, test unchecked validation
8. Check the checkbox, click "Complete Setup"
9. Verify redirect to `/dashboard?onboarding=complete`
10. DB verify: `onboarding_completed_at IS NOT NULL`, `sms_consent_acknowledged = true`, campaign exists
**Pass criteria:** Wizard completes all 4 steps, DB reflects completion, campaign row exists.

### ONB-02: Additional business creation completes without affecting existing businesses

**Pre-condition:** `audit-test@avisloop.com` — complete onboarding not required (can be done before or after ONB-01)
**Entry point:** `/businesses` → click "Add Business" → `/onboarding?mode=new`
**Steps to test:**
1. Navigate to `/businesses`, click "Add Business"
2. Verify CreateBusinessWizard renders (heading "Set up your new business")
3. Fill business name (required), select service(s), click Continue
4. Verify step 2 (Campaign Preset) renders
5. Select preset, click Continue
6. Verify redirect to `/dashboard` (NOT `/dashboard?onboarding=complete`)
7. DB verify: 2 businesses exist, original business data unchanged, new business has `onboarding_completed_at` set, new campaign exists
**Pass criteria:** New business row created, original business data unmodified, campaign exists for new business.

### ONB-03: Draft persistence (refresh mid-wizard retains data)

**Pre-condition:** `audit-test@avisloop.com` — business with `onboarding_completed_at = null` (so `/onboarding` is accessible)
**Test sequence:**
1. Navigate to `/onboarding` (or `/dashboard` → redirect)
2. Fill step 1 form fields (name, service type)
3. Click Continue (writes to DB)
4. Verify step 2 loads
5. Navigate away to `/dashboard` (or any page)
6. Navigate back to `/onboarding?step=1`
7. Verify step 1 form is pre-filled with the values entered before (served from DB via `defaultValues`)
8. Also test `?step=2` URL navigation directly — verify step 2 renders
9. Verify `localStorage.getItem('onboarding-draft-v3')` contains the draft object (via browser_evaluate)
**Pass criteria:** Step 1 data visible after navigation-back, URL step navigation works, localStorage key present.

---

## Known Issues (Pre-Existing Bugs to Document)

### BUG-ONB-01: software_used column missing from businesses table

**Severity:** Medium
**File:** `lib/actions/onboarding.ts` → `saveSoftwareUsed()`
**Symptom:** CRM Platform step (step 3) silently fails to persist the selection. The wizard advances to step 4 without any error message. The user's CRM platform choice is never saved.
**Evidence:** Column `software_used` does not exist in `businesses` table (verified via Supabase MCP). TypeScript type `Business` incorrectly declares `software_used: string | null`. The action tries `UPDATE businesses SET software_used = X WHERE id = Y` but Supabase returns a "column does not exist" error which is silently swallowed.
**Test:** Select any CRM platform on step 3, click Continue, advance to dashboard, query `SELECT software_used FROM businesses WHERE id = ...` — column will not exist in result set.

---

## Open Questions

### 1. localStorage Draft Scope

- **What we know:** The wizard stores draft at `onboarding-draft-v3`. Individual step form values are NOT stored in it — only wizard-level `draftData` state changes trigger storage. Currently the wizard never calls `setDraftDataState()` from step callbacks, so `draftData` always remains `{}`.
- **What's unclear:** Is draft persistence (ONB-03) expected to persist form FIELD values or just step navigation state? If field values, the feature is not implemented at the field level.
- **Recommendation:** Test what IS observable — DB-backed persistence (complete step 1, navigate away, return, verify pre-filled values). Document honestly if sub-step form field values (not yet submitted) are NOT preserved.

### 2. Post-ONB-01 Dashboard State

- **What we know:** After completing ONB-01, wizard redirects to `/dashboard?onboarding=complete`. The dashboard renders the `WelcomeCard` for new users.
- **What's unclear:** Does `?onboarding=complete` trigger any special UI state (modal, toast, confetti)?
- **Recommendation:** Navigate to `/dashboard?onboarding=complete` and snapshot — document what the UI shows.

### 3. CreateBusinessWizard Entry Points

- **What we know:** "Add Business" button in `/businesses` page links to `/onboarding?mode=new`.
- **What's unclear:** Is there an "Add Business" button in the sidebar or business switcher? The sidebar code does not show one. The business switcher only has "View all clients" → `/businesses`.
- **Recommendation:** Test the `/businesses` → "Add Business" path. Also manually navigate to `/onboarding?mode=new` directly to verify the guard logic (works even if no other entry points exist).

---

## Sources

### Primary (HIGH confidence)

- **Codebase analysis** — Direct reading of all onboarding-related files:
  - `app/onboarding/page.tsx` — Page component, routing decision
  - `components/onboarding/onboarding-wizard.tsx` — First-business wizard shell, localStorage key
  - `components/onboarding/onboarding-steps.tsx` — Step router
  - `components/onboarding/steps/business-setup-step.tsx` — Step 1 UI + validation
  - `components/onboarding/steps/campaign-preset-step.tsx` — Step 2 UI + preset display
  - `components/onboarding/steps/crm-platform-step.tsx` — Step 3 UI + skip logic
  - `components/onboarding/steps/sms-consent-step.tsx` — Step 4 UI + checkbox
  - `components/onboarding/onboarding-progress.tsx` — Progress bar (fixed bottom, role=progressbar)
  - `components/onboarding/create-business-wizard.tsx` — Additional business wizard (2 steps)
  - `lib/actions/onboarding.ts` — All first-business server actions
  - `lib/actions/create-additional-business.ts` — All additional-business server actions
  - `lib/actions/campaign.ts` — `duplicateCampaign()` called by `createCampaignFromPreset()`
  - `lib/data/onboarding.ts` — `getOnboardingStatus()` — completion check logic
  - `lib/data/active-business.ts` — Cookie-based business resolver
  - `lib/actions/active-business.ts` — `switchBusiness()` — cookie setter
  - `lib/validations/onboarding.ts` — Zod schemas + CRM_PLATFORMS constant
  - `lib/validations/job.ts` — SERVICE_TYPES, SERVICE_TYPE_LABELS, DEFAULT_TIMING_HOURS
  - `lib/constants/campaigns.ts` — CAMPAIGN_PRESETS (display names + descriptions)
  - `lib/types/onboarding.ts` — OnboardingBusiness type
  - `lib/types/database.ts` — Business type (software_used field present but column missing in DB)
  - `middleware.ts` — /onboarding in APP_ROUTES, auth protection
  - `app/(dashboard)/dashboard/page.tsx` — redirect('/onboarding') when business is null
  - `components/businesses/businesses-client.tsx` — "Add Business" link to `/onboarding?mode=new`
  - `components/layout/business-switcher.tsx` — Sidebar switcher, no "Add Business" link
  - `components/layout/sidebar.tsx` — Main nav, no "Add Business" link

- **Supabase MCP** — Direct database queries verifying:
  - `businesses` table columns (confirmed `software_used` is MISSING)
  - `campaigns` table columns (confirmed `personalization_enabled` exists)
  - System preset campaigns (3 presets: Conservative, Standard, Aggressive) with exact IDs
  - Campaign touches per preset (2, 3, 4 touches respectively)
  - `audit-test@avisloop.com` user state: business exists with `onboarding_completed_at = null` — first-run wizard IS testable

- **Phase 59 research pattern** — `.planning/phases/59-auth-flows/59-RESEARCH.md` — followed same format

---

## Metadata

**Confidence breakdown:**
- First-business wizard (4 steps): HIGH — all step files read in full, server actions verified, DB schema confirmed
- Additional-business wizard (2 steps): HIGH — create-additional-business.ts read in full, step count verified from source (not docs)
- Draft persistence mechanism: HIGH — code read, limitation clearly identified (field-level vs step-completion persistence)
- software_used bug: HIGH — confirmed by Supabase MCP (column does not exist in businesses table)
- Preset display names: HIGH — CAMPAIGN_PRESETS constant read, matching logic verified
- Selector recommendations: MEDIUM — based on IDs and labels from source code, actual refs will be confirmed via browser_snapshot during execution
- Test account state: HIGH — confirmed via Supabase MCP (onboarding_completed_at = null, first-run wizard accessible)

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable — onboarding code unlikely to change during QA audit)
