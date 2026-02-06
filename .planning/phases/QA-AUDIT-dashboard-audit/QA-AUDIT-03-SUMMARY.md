---
phase: QA-AUDIT
plan: 03
subsystem: core-workflow
tags: [jobs, campaigns, crud, presets, v2-alignment]

dependency_graph:
  requires: [QA-AUDIT-02]
  provides: [jobs-audit, campaigns-audit]
  affects: [QA-AUDIT-09]

tech_stack:
  testing: [playwright, supabase-js]

key_files:
  screenshots:
    - audit-screenshots/jobs-desktop-light.png
    - audit-screenshots/jobs-desktop-dark.png
    - audit-screenshots/jobs-mobile-light.png
    - audit-screenshots/jobs-mobile-dark.png
    - audit-screenshots/jobs-add-form.png
    - audit-screenshots/jobs-edit-form.png
    - audit-screenshots/campaigns-desktop-light.png
    - audit-screenshots/campaigns-desktop-dark.png
    - audit-screenshots/campaigns-mobile-light.png
    - audit-screenshots/campaigns-mobile-dark.png
    - audit-screenshots/campaigns-empty-state.png

decisions:
  - id: QA-03-D1
    title: Jobs page V2 alignment verified
    context: Jobs is position 4 in sidebar with prominent Add Job action
    decision: No changes needed - V2 model correctly implemented

  - id: QA-03-D2
    title: Campaigns preset picker is prominent
    context: Presets (Conservative, Standard, Aggressive) shown in main view
    decision: No changes needed - preset-first approach works well

metrics:
  duration: ~13 minutes
  completed: 2026-02-06
---

# Phase QA-AUDIT Plan 03: Jobs & Campaigns Page Audit Summary

**One-liner:** Jobs and Campaigns pages pass V2 alignment with proper CRUD flows, correct data display, and no legacy terminology.

## Tasks Completed

| Task | Name | Status | Key Files |
|------|------|--------|-----------|
| 1 | Audit Jobs Page | PASS | jobs-*.png, jobs-add-form.png, jobs-edit-form.png |
| 2 | Audit Campaigns Page | PASS | campaigns-*.png |

## Jobs Page Audit Results

### Screenshot Verification
- Desktop light: CAPTURED (jobs-desktop-light.png)
- Desktop dark: CAPTURED (jobs-desktop-dark.png)
- Mobile light: CAPTURED (jobs-mobile-light.png)
- Mobile dark: CAPTURED (jobs-mobile-dark.png)

### Table Structure
| Column | Present | Correct Label |
|--------|---------|---------------|
| Customer | YES | "Customer" with email subtitle |
| Service Type | YES | Badge with proper casing (HVAC, Plumbing, etc.) |
| Status | YES | Color-coded badges (green=Completed, amber=Do Not Send) |
| Completed | YES | Date format "MMM d, yyyy" |
| Created | YES | Date format "MMM d, yyyy" |
| Actions | YES | Edit (pencil) and Delete (trash) icons |

### Data Cross-Check
```
Database jobs: 3
- John Smith: hvac (completed) - Feb 5, 2026
- Jane Doe: plumbing (completed) - Feb 4, 2026
- Bob Wilson: electrical (do_not_send) - no completion date
```
UI matches database exactly.

### Add Job Flow
- Add Job button: PROMINENT (header + sidebar)
- Form opens in Sheet component
- Customer selector: Search by name or email
- Service Type: Dropdown with all 8 types
- Status: Defaults to "Completed"
- Enroll checkbox: VISIBLE, defaults to checked
- Notes field: Optional textarea
- Validation: Submit disabled until required fields filled

### Edit Job Flow
- Edit button: Pencil icon on each row
- Form pre-fills: Customer, Service Type, Status, Notes
- Shows Created/Completed timestamps
- Save Changes button works

### V2 Alignment Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Primary page feel | PASS | Clear title, prominent Add Job |
| Add Job ~10 seconds | PASS | 2-3 clicks to create |
| Campaign enrollment natural | PASS | Checkbox visible with explanation |
| No legacy terminology | PASS | No "contacts" or "send request" |
| Service types visible | PASS | Badges in table column |

### Findings
No critical or major findings for Jobs page.

**Minor/Suggestions:**
1. [SUGGESTION] Sidebar "Add Job" link navigates to `/jobs?action=add` but URL param is not handled to auto-open sheet - clicking the link just goes to Jobs page without opening the form

## Campaigns Page Audit Results

### Screenshot Verification
- Desktop light: CAPTURED (campaigns-desktop-light.png)
- Desktop dark: CAPTURED (campaigns-desktop-dark.png)
- Mobile light: CAPTURED (campaigns-mobile-light.png)
- Mobile dark: CAPTURED (campaigns-mobile-dark.png)

### Page Structure
- Title: "Campaigns"
- Subtitle: "Automated review request sequences for completed jobs"
- New Campaign button: Prominent in header
- User campaigns: Listed with status toggle
- Preset picker: "Add another campaign" section with preset cards

### Campaign Display
User campaign (HVAC Follow-up):
- Name: "HVAC Follow-up"
- Service type badge: "HVAC"
- Touch count: "2 touches | 1 email | 1 SMS"
- Status toggle: Active (ON)
- Actions menu: Three-dot menu (...)

### Preset Picker
| Preset | Visible | Touch Visualization |
|--------|---------|---------------------|
| Conservative | YES | Email -> Email icons |
| Standard | YES | Email -> Email -> SMS icons |
| Aggressive | YES | SMS -> Email -> SMS -> Email icons |

### Data Cross-Check
```
Database campaigns:
- User campaigns: 1 (HVAC Follow-up: active, hvac, 2 touches)
- System presets: 3 (Conservative, Standard, Aggressive)
```
UI matches database.

### Status Toggle Test
- Initial state: checked (active)
- After click: unchecked (paused)
- State change reflected immediately
- Toggle back: works correctly

### V2 Alignment Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Primary automation page | PASS | Clear purpose and layout |
| Preset picker prominent | PASS | Visible in main content area |
| Users don't "build" campaigns | PASS | Presets are the clear path |
| No "blasting" language | PASS | Uses "automated sequences" |
| Navigation position | PASS | 5th in sidebar (after Jobs) |

### Findings
No critical or major findings for Campaigns page.

**Minor/Suggestions:**
1. [SUGGESTION] Preset cards could show more detail (timing info like "24h, 72h delays") before selection to help users choose

## Deviations from Plan

None - plan executed exactly as written.

## Overall V2 Alignment Summary

Both Jobs and Campaigns pages correctly implement the V2 model:

1. **Jobs as Primary Workflow**: Jobs page feels like the central work-logging location with quick access to add new jobs
2. **Campaign Automation**: Campaigns page positions automation as preset-driven, not manual configuration
3. **Clean Terminology**: No legacy "contacts" or "send request" language found
4. **Navigation Hierarchy**: Jobs (4th) -> Campaigns (5th) order makes sense for workflow
5. **Campaign Enrollment**: The checkbox in Add Job form clearly connects jobs to campaigns

## Findings Summary by Severity

| Severity | Count | Items |
|----------|-------|-------|
| Critical | 0 | - |
| Major | 0 | - |
| Minor | 0 | - |
| Suggestion | 2 | Sidebar Add Job URL param, Preset timing info |

## Test Coverage

| Test Area | Jobs | Campaigns |
|-----------|------|-----------|
| Desktop Light | PASS | PASS |
| Desktop Dark | PASS | PASS |
| Mobile Light | PASS | PASS |
| Mobile Dark | PASS | PASS |
| Data Accuracy | PASS | PASS |
| CRUD Operations | PASS | N/A |
| Status Toggle | N/A | PASS |
| V2 Alignment | PASS | PASS |

## Next Steps

1. Continue with QA-AUDIT-04 (Send page audit)
2. Document suggestions for potential UX improvements in final report
