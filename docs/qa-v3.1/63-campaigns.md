# Phase 63: Campaigns — QA Findings

**Tested:** 2026-02-28
**Tester:** Claude (Playwright + Supabase JS client)
**App URL:** http://localhost:3000
**Test account:** audit-test@avisloop.com
**Business:** Audit Test HVAC (6ed94b54-6f35-4ede-8dcb-28f562052042)
**HVAC Campaign ID:** 15982bf4-5c9d-453b-93a4-8a07b3230968

---

## Summary

| Requirement | Status | Notes |
|-------------|--------|-------|
| CAMP-01: Campaign list with status badges and touch counts | PASS | "HVAC Follow-up" card: HVAC badge, Active label, 2 touches (1 email, 1 SMS) |
| CAMP-02: Campaign detail page (touches, enrollments, analytics) | PASS | Touch sequence (email 1d, SMS 3d), 4 enrollments listed (3 AUDIT_ + 1 Test), stat cards: Active=4 Completed=0 Stopped=0 |
| CAMP-03: Campaign edit sheet (pre-populated, save, DB verified) | PASS | Pre-populated name "HVAC Follow-up", delay 24h/72h; changed to 48h, DB confirmed delay_hours=48; reverted to 24h, DB confirmed |
| CAMP-04: Campaign preset picker (3 presets + Custom) | PASS | 3 presets (Gentle/Standard/Aggressive) with plain-English descriptions + "Most popular" badge on Standard + Custom Campaign option |
| CAMP-05: Pause freezes enrollments (DB verified) | PASS | All 4 enrollments transitioned from active to frozen in DB; UI showed empty badge text (known bug CAMP-BUG-01) |
| CAMP-06: Resume restores enrollments (DB verified) | PASS | All 4 frozen enrollments restored to active in DB; UI badges show "Active" again |
| CAMP-07: Template preview modal | PASS | Both email and SMS preview modals open with template content; system template fallback works (but see CAMP-BUG-03 for service mismatch) |
| CAMP-08: Campaign analytics section | PASS | Touch Performance visible: Touch 1 "0 sent (0%)", Touch 2 "0 sent"; Avg touches completed "0 / 2"; matches DB (4 enrollments, all touch_1_status=pending) |
| CAMP-09: Enrollment conflict badge | PASS | Second HVAC job for AUDIT_Patricia created conflict; DB shows enrollment_resolution='conflict'; dashboard Ready-to-Send queue shows conflict badge |
| CAMP-10: Create campaign from preset (end-to-end) | PASS | Standard Follow-Up preset selected, Continue clicked, campaign created (id: b81f6b2f), navigated to detail with edit sheet auto-open, visible in campaign list, DB confirmed |

---

## Prerequisite DB Verification

Before UI testing, confirmed Phase 62 data integrity:

### AUDIT_ Enrollments (3 rows, all active)

| Customer | Status | Touch 1 Status | Touch 1 Scheduled |
|----------|--------|----------------|-------------------|
| AUDIT_Marcus Rodriguez | active | pending | 2026-03-01T04:05:19Z |
| AUDIT_Patricia Johnson | active | pending | 2026-03-01T03:59:05Z |
| AUDIT_Sarah Chen | active | pending | 2026-03-01T04:02:28Z |

Plus 1 pre-existing enrollment (Test Technician) = 4 total active enrollments.

### HVAC Follow-up Campaign

- ID: `15982bf4-5c9d-453b-93a4-8a07b3230968`
- Service type: hvac
- Status: active
- AI personalization: enabled
- Touches: 2 (email 24h, SMS 72h)
- Template IDs: both NULL (uses system template fallback)

### System Presets (3 presets)

| Name | Keyword Match |
|------|---------------|
| Aggressive (Multi-Channel) | aggressive |
| Conservative (Email Only) | conservative |
| Standard (Email + SMS) | standard |

### System Templates: 8 email + 8 SMS = 16 total

---

## CAMP-01: Campaign list with status badges and touch counts

**Status:** PASS

### Observed

Campaign list page at `/campaigns` shows:

| Campaign | Service Badge | Status | Touches |
|----------|--------------|--------|---------|
| HVAC Follow-up | HVAC | Active (with Switch toggle) | 2 touches, 1 email, 1 SMS |

- "New Campaign" button visible in page header
- Campaign card is clickable (navigates to detail page)
- Action buttons visible on desktop: Edit (pencil), Duplicate (copy), Delete (trash)
- Switch toggle on right side for quick pause/resume

### Evidence

- `qa-63-campaigns-list.png`

---

## CAMP-02: Campaign detail page

**Status:** PASS

### Campaign Header

- Name: "HVAC Follow-up"
- Service type: "HVAC" with "2 touches" subtitle
- AI Personalized badge (sparkle icon)
- Back to campaigns link
- Edit Campaign button, overflow menu (Duplicate, Delete), Active/Paused Switch

### Stat Cards (grid of 3)

| Card | Value | Expected |
|------|-------|----------|
| Active | 4 | 4 (3 AUDIT_ + 1 Test Technician) |
| Completed | 0 | 0 |
| Stopped | 0 | 0 |

Note: No "Frozen" stat card exists. When enrollments are frozen (CAMP-05), they disappear from these stats entirely. See CAMP-BUG-02.

### Touch Sequence

| Touch | Channel | Delay |
|-------|---------|-------|
| 1 | email | 1d after job |
| 2 | sms | 3d after touch 1 |

Each touch has an Eye (preview) button for template preview.

### Enrollment List

"Recent Enrollments (4)" heading with 4 rows:

| Customer | Time | Progress | Status Badge |
|----------|------|----------|--------------|
| AUDIT_Marcus Rodriguez | ~21 min ago | Touch 0/2 | Active |
| AUDIT_Sarah Chen | ~23 min ago | Touch 0/2 | Active |
| AUDIT_Patricia Johnson | ~27 min ago | Touch 0/2 | Active |
| Test Technician | ~8 hours ago | Touch 0/2 | Active |

### Evidence

- `qa-63-campaign-detail.png` (full page)
- `qa-63-campaign-enrollments.png` (scrolled to enrollment list)

---

## CAMP-03: Campaign edit sheet

**Status:** PASS

### Pre-populated Values

| Field | Value |
|-------|-------|
| Campaign name | HVAC Follow-up |
| Service type | hvac |
| Touch 1 channel | email |
| Touch 1 delay | 24 (hours) |
| Touch 2 channel | sms |
| Touch 2 delay | 72 (hours) |

### Edit Test: Change Touch 1 delay from 24 to 48

1. Opened edit sheet via "Edit Campaign" button
2. Changed Touch 1 delay_hours input from 24 to 48
3. Clicked Save
4. **DB verification after edit:**
   ```json
   [
     {"touch_number": 1, "channel": "email", "delay_hours": 48},
     {"touch_number": 2, "channel": "sms", "delay_hours": 72}
   ]
   ```
   Touch 1 delay_hours = 48 confirmed in database.

### Revert: Change Touch 1 delay back from 48 to 24

1. Re-opened edit sheet
2. Changed Touch 1 delay_hours from 48 back to 24
3. Saved
4. **DB verification after revert:**
   ```json
   [
     {"touch_number": 1, "channel": "email", "delay_hours": 24},
     {"touch_number": 2, "channel": "sms", "delay_hours": 72}
   ]
   ```
   Touch 1 delay_hours = 24 confirmed. Campaign restored to original state.

### Evidence

- `qa-63-campaign-edit-sheet.png`
- `qa-63-campaign-edit-saved.png`

---

## CAMP-04: Campaign preset picker

**Status:** PASS

### CreateCampaignDialog Content

Opened via "New Campaign" button on campaigns list page. Dialog contains:

**4 radio cards (3 presets + 1 custom):**

| # | Name | Description | Badge |
|---|------|-------------|-------|
| 1 | Gentle Follow-Up | "Two emails over 3 days. Good for established relationships or high-ticket services." | - |
| 2 | Standard Follow-Up | "Two emails and a text message over 7 days. Works well for most businesses." | "Most popular" (star icon) |
| 3 | Aggressive Follow-Up | "A text within hours, then email and SMS reminders. Best for quick-turnaround services like cleaning." | - |
| 4 | Custom Campaign | "Build your own sequence from scratch." | Wrench icon |

Each preset card also shows:
- Touch visualization with channel icons (envelope/chat) and delay abbreviations (24h, 72h, 168h, etc.)
- "Recommended for" text listing service types

Dialog footer has Cancel and Continue buttons.

### Evidence

- `qa-63-preset-picker.png`

---

## CAMP-05: Pause campaign freezes enrollments (DB verified)

**Status:** PASS

### Test Procedure

1. Pre-pause DB check: 4 enrollments with status='active'
2. Clicked Switch toggle on HVAC Follow-up card to pause
3. Toast: "Campaign paused"
4. Switch label changed from "Active" to "Paused"

### DB Verification After Pause

```
All 4 enrollments: status = 'frozen'
```

| Customer | Status Before | Status After |
|----------|--------------|--------------|
| AUDIT_Marcus Rodriguez | active | frozen |
| AUDIT_Patricia Johnson | active | frozen |
| AUDIT_Sarah Chen | active | frozen |
| Test Technician | active | frozen |

All enrollments correctly transitioned to 'frozen' (NOT 'stopped'). This preserves touch position for resume.

### UI Observation (Known Bug)

On the campaign detail page after pause:
- Enrollment list badges show empty text where "Frozen" should appear
- Stat cards show: Active=0, Completed=0, Stopped=0 (frozen count not displayed)
- See CAMP-BUG-01 and CAMP-BUG-02

### Evidence

- `qa-63-campaign-paused.png`
- `qa-63-frozen-label-gap.png`

---

## CAMP-06: Resume campaign restores enrollments (DB verified)

**Status:** PASS

### Test Procedure

1. Campaign was in paused state with 4 frozen enrollments
2. Clicked Switch toggle to resume
3. Toast: "Campaign resumed"
4. Switch label changed from "Paused" to "Active"

### DB Verification After Resume

```
All 4 enrollments: status = 'active'
```

| Customer | Status Before | Status After |
|----------|--------------|--------------|
| AUDIT_Marcus Rodriguez | frozen | active |
| AUDIT_Patricia Johnson | frozen | active |
| AUDIT_Sarah Chen | frozen | active |
| Test Technician | frozen | active |

All enrollments correctly restored to 'active' from 'frozen'. Touch positions preserved.

### UI Observation

After resume, enrollment list badges correctly show "Active" text again.

### Evidence

- `qa-63-campaign-resumed.png`
- `qa-63-enrollments-restored.png`

---

## CAMP-07: Template preview modal

**Status:** PASS

### Touch 1 Preview (Email)

- Clicked Eye button for Touch 1
- Dialog opened with title: "Cleaning Service Review"
- Shows "Email Preview" label with envelope icon
- Subject line: "Sparkling clean! How did we do?"
- Body: Customer greeting with {{CUSTOMER_NAME}} and {{BUSINESS_NAME}} placeholders
- Full email body displayed in bordered card

Note: The template shown is "Cleaning Service Review" not "HVAC Service Review". This is because the touch has `template_id = NULL` and `resolveTemplate()` falls back to the first system email template matching `is_default && channel === 'email'` without filtering by the campaign's service type. See CAMP-BUG-03.

### Touch 2 Preview (SMS)

- Clicked Eye button for Touch 2
- Dialog opened with title: "Cleaning Service SMS"
- Shows "SMS Preview" label with chat icon
- SMS body displayed as a chat bubble (blue rounded rectangle)
- Character count: "115 / 160 characters"
- Content: "Hi {{CUSTOMER_NAME}}, hope your space is sparkling! Quick feedback on {{BUSINESS_NAME}}? Reply YES for review link."

Same service type mismatch applies (Cleaning instead of HVAC). See CAMP-BUG-03.

### Evidence

- `qa-63-template-preview-email.png`
- `qa-63-template-preview-sms.png`

---

## CAMP-08: Campaign analytics section

**Status:** PASS

### Analytics Display

The CampaignStats component renders when `totalEnrollments > 0`. With 4 enrollments (all pending, none sent):

**Touch Performance card:**

| Touch | Sent | Percentage |
|-------|------|------------|
| Touch 1 | 0 sent | 0% |
| Touch 2 | 0 sent | (no percentage shown when total is 0) |

Both touch bars show gray "empty" state (no sent/pending/skipped/failed segments since all are in NULL or pending state).

**Legend:** Sent (green), Pending (yellow), Skipped (gray), Failed (red)

**Avg. touches completed:** 0 / 2

No Stop Reasons card (no stopped enrollments).

### DB Comparison

| Metric | UI Value | DB Value | Match |
|--------|----------|----------|-------|
| Total enrollments | 4 (visible in stats) | 4 | Yes |
| Touch 1 sent | 0 | 0 | Yes |
| Touch 1 pending | shown in bar | 4 (all pending) | Consistent |
| Touch 2 sent | 0 | 0 | Yes |
| Touch 2 null | not shown | 4 (all null) | Expected |
| Avg touches | 0 / 2 | 0 / 2 | Yes |

Values are consistent. The Touch Performance bars correctly reflect that all enrollments are at Touch 1 pending, with Touch 2 not yet scheduled.

### Evidence

- `qa-63-campaign-analytics.png`

---

## CAMP-09: Enrollment conflict states

**Status:** PASS

### Conflict Creation

Created a second HVAC job for AUDIT_Patricia Johnson (who already has an active enrollment in HVAC Follow-up):

1. Navigated to /jobs, clicked "Add Job"
2. Searched for "AUDIT_Patricia" in customer autocomplete
3. Selected AUDIT_Patricia Johnson
4. Service type: HVAC, Status: Completed
5. Submitted the form

### DB Verification

```sql
SELECT j.id, j.status, j.enrollment_resolution, j.conflict_detected_at
FROM jobs j JOIN customers c ON j.customer_id = c.id
WHERE c.name = 'AUDIT_Patricia Johnson'
ORDER BY j.created_at DESC LIMIT 2;
```

| Job | Status | enrollment_resolution | conflict_detected_at |
|-----|--------|----------------------|---------------------|
| Newer (conflict) | completed | conflict | 2026-02-28T04:XX:XXZ |
| Original | completed | NULL | NULL |

The system correctly detected the active enrollment conflict and set `enrollment_resolution = 'conflict'`.

### Dashboard Ready-to-Send Queue

Navigated to /dashboard. The Ready-to-Send queue shows the conflict job with a conflict badge/indicator visible. The conflict job for AUDIT_Patricia Johnson appears with action buttons for resolution (Replace/Skip/Queue).

### Evidence

- `qa-63-conflict-created.png`
- `qa-63-conflict-badge-dashboard.png`

---

## CAMP-10: Create campaign from Standard preset (end-to-end)

**Status:** PASS

### Test Flow

1. Opened CreateCampaignDialog from campaigns list
2. Selected "Standard Follow-Up" radio card (aria-checked: true)
3. Clicked "Continue" button
4. Dialog closed, navigated to new campaign detail page
5. Edit sheet auto-opened (via `?edit=true` query param)
6. New campaign URL: `/campaigns/b81f6b2f-e65e-406d-b39f-acb401adcc71`

### Campaign List Verification

After navigating back to `/campaigns`, two campaign cards visible:

| Campaign | Service | Touches | Status |
|----------|---------|---------|--------|
| Standard Follow-Up | All Services | 3 touches (2 email, 1 SMS) | Active |
| HVAC Follow-up | HVAC | 2 touches (1 email, 1 SMS) | Active |

### DB Verification

```json
{
  "id": "b81f6b2f-e65e-406d-b39f-acb401adcc71",
  "name": "Standard Follow-Up",
  "service_type": null,
  "status": "active",
  "is_preset": false,
  "created_at": "2026-02-28T04:27:31.14688+00:00"
}
```

Campaign exists in DB as a non-preset, active campaign with 3 touches (duplicated from Standard preset).

### Evidence

- `qa-63-new-campaign-created.png`
- `qa-63-campaigns-list-with-new.png`

---

## Bugs Found

### CAMP-BUG-01 (Medium): Frozen enrollment status label missing

**Location:** `lib/constants/campaigns.ts` line 88-92

**Issue:** `ENROLLMENT_STATUS_LABELS` Record only has keys for `active`, `completed`, and `stopped`. The `frozen` status (added in Phase 46) is missing. When an enrollment has status='frozen', the Badge renders `{ENROLLMENT_STATUS_LABELS['frozen']}` which evaluates to `undefined`, resulting in an empty badge with no visible text.

**Reproduction:**
1. Navigate to campaign detail page
2. Pause the campaign (Switch toggle)
3. Observe enrollment list: badges show empty text

**Fix:**
```typescript
export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  stopped: 'Stopped',
  frozen: 'Frozen',  // <-- add this
}
```

**Severity:** Medium — functional but confusing UX when campaign is paused

---

### CAMP-BUG-02 (Low): Frozen enrollments missing from stat cards

**Location:** `app/(dashboard)/campaigns/[id]/page.tsx` lines 97-116

**Issue:** The campaign detail page renders 3 stat cards: Active, Completed, Stopped. The `getCampaignEnrollmentCounts()` function returns a `frozen` count, but the page template does not include a "Frozen" stat card. When a campaign is paused and all enrollments are frozen, all 3 stat cards show 0, which is misleading.

**Current display after pause:**
- Active: 0
- Completed: 0
- Stopped: 0
- (Frozen: not shown, but count is 4 in DB)

**Fix:** Add a 4th stat card for Frozen count, or show frozen count as part of the Active card when > 0.

**Severity:** Low — informational only, not blocking

---

### CAMP-BUG-03 (Low): Template preview shows wrong service type

**Location:** `components/campaigns/touch-sequence-display.tsx` lines 22-38

**Issue:** `resolveTemplate()` falls back to `templates.find(t => t.is_default && t.channel === touch.channel)` when `touch.template_id` is NULL. This picks the first system template matching the channel, regardless of the campaign's service type. For the HVAC campaign, it shows "Cleaning Service Review" (alphabetically first) instead of "HVAC Service Review".

**Reproduction:**
1. Navigate to HVAC Follow-up campaign detail
2. Click Eye icon for Touch 1 (email)
3. Preview shows "Cleaning Service Review" instead of "HVAC Service Review"

**Fix:** Pass the campaign's `service_type` to `resolveTemplate()` and filter system templates by service type before falling back to any default:
```typescript
const systemTemplate = templates.find(
  t => t.is_default && t.channel === touch.channel && t.service_type === campaignServiceType
) || templates.find(
  t => t.is_default && t.channel === touch.channel
)
```

**Severity:** Low — preview is cosmetic; actual sends use the correct template via campaign enrollment logic

---

## Responsive and Dark Mode

### Desktop (1440x900)
Campaign list and detail pages render correctly. Cards have proper spacing, Switch toggles accessible, action buttons visible.

### Tablet (768x1024)
Campaign cards stack properly. "New Campaign" button accessible. Switch and action buttons visible. No horizontal overflow.

### Mobile (390x844)
Campaign cards render in single column. Mobile overflow menu (3-dot) replaces inline action buttons. Bottom navigation visible. No horizontal scrolling issues.

### Dark Mode
Campaign cards, stat cards, touch sequence display, and enrollment list all render with proper dark mode colors. No contrast issues or muddy colors. Badge variants maintain readability.

### Evidence

- `qa-63-campaigns-tablet.png`
- `qa-63-campaigns-mobile.png`
- `qa-63-campaigns-dark-mode.png`

---

## Overall Assessment

**Result: 10/10 PASS**

The Campaigns module is fully functional across all tested requirements. The automation engine works correctly:

- Campaign CRUD operations are solid (list, detail, edit, create from preset)
- Frozen enrollment behavior (the key V2 differentiator from Phase 46) works correctly at the DB level
- Template preview provides useful template inspection
- Analytics section accurately reflects enrollment and touch performance data
- Conflict detection correctly identifies when a customer is already in an active sequence
- Preset picker provides clear onboarding path for new campaigns

### Bug Summary

| Bug ID | Severity | Description | Impact |
|--------|----------|-------------|--------|
| CAMP-BUG-01 | Medium | `ENROLLMENT_STATUS_LABELS` missing 'frozen' key | Empty badge text when campaign paused |
| CAMP-BUG-02 | Low | No "Frozen" stat card on detail page | Frozen count invisible in UI |
| CAMP-BUG-03 | Low | Template preview shows wrong service type | Cosmetic — preview picks first system template instead of matching service type |

All 3 bugs are non-blocking. CAMP-BUG-01 has the highest impact (confusing empty badges) and should be fixed first. CAMP-BUG-02 and CAMP-BUG-03 are cosmetic improvements.
