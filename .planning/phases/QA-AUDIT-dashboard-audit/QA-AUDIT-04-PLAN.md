---
phase: QA-AUDIT
plan: 04
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Campaign detail page shows touch sequence and enrollments"
    - "Campaign edit page allows modifying touches and settings"
    - "New campaign page works for creating campaigns from scratch"
    - "All campaign sub-routes tested in both themes and viewports"
  artifacts:
    - path: "audit-screenshots/campaign-detail-*.png"
      provides: "Campaign detail page screenshots"
    - path: "audit-screenshots/campaign-edit-*.png"
      provides: "Campaign edit page screenshots"
    - path: "audit-screenshots/campaign-new-*.png"
      provides: "New campaign page screenshots"
  key_links:
    - from: "Campaign detail"
      to: "campaign_touches + campaign_enrollments"
      via: "touch sequence display + enrollment list"
    - from: "Campaign edit form"
      to: "campaigns + campaign_touches tables"
      via: "form submission updates"
---

<objective>
Audit the three campaign sub-routes: detail view (/campaigns/[id]), edit form (/campaigns/[id]/edit), and new campaign form (/campaigns/new). These pages handle campaign configuration — the core of V2 automation.

Purpose: Verify campaign management pages work correctly, display accurate touch sequences, and the creation flow is intuitive.
Output: Findings documented in scratch notes for final report compilation (Plan 09).
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-CONTEXT.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-RESEARCH.md
@C:\AvisLoop\app\(dashboard)\campaigns\[id]\page.tsx
@C:\AvisLoop\app\(dashboard)\campaigns\[id]\edit\page.tsx
@C:\AvisLoop\app\(dashboard)\campaigns\new\page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit Campaign Detail Page (/campaigns/[id])</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools and Supabase MCP for testing.**

    First, find an existing campaign ID:
    ```sql
    SELECT id, name, service_type, status FROM campaigns
    WHERE business_id = '<biz_id>' LIMIT 1;
    ```

    Navigate to `http://localhost:3000/campaigns/<campaign_id>`.

    **Screenshot baseline:**
    - Desktop light: `audit-screenshots/campaign-detail-desktop-light.png`
    - Desktop dark: `audit-screenshots/campaign-detail-desktop-dark.png`
    - Mobile light: `audit-screenshots/campaign-detail-mobile-light.png`
    - Mobile dark: `audit-screenshots/campaign-detail-mobile-dark.png`

    **Campaign header/info:**
    - Campaign name displayed prominently
    - Service type shown (or "All Services" if null)
    - Status badge (active/paused)
    - Edit button accessible
    - Personalization toggle visible (if applicable)

    **Touch sequence display:**
    - All touches shown in order (1-4)
    - Each touch shows: channel (email/SMS icon), delay (hours/days), template name
    - Touch timing is clear (relative to previous touch or job completion)
    - Visual representation is intuitive (timeline or numbered steps)

    **Data cross-check (touches):**
    ```sql
    SELECT ct.touch_number, ct.channel, ct.delay_hours, mt.name as template_name
    FROM campaign_touches ct
    LEFT JOIN message_templates mt ON ct.template_id = mt.id
    WHERE ct.campaign_id = '<campaign_id>'
    ORDER BY ct.touch_number;
    ```
    Compare displayed touches with DB data.

    **Enrollment list:**
    - Active enrollments shown with customer name, current touch, status
    - Check enrollment status badges (active, completed, stopped)
    - Verify stop reasons displayed for stopped enrollments
    - Check if enrollment count matches database

    **Data cross-check (enrollments):**
    ```sql
    SELECT ce.id, c.name as customer_name, ce.status, ce.current_touch,
      ce.stop_reason, ce.enrolled_at
    FROM campaign_enrollments ce
    JOIN customers c ON ce.customer_id = c.id
    WHERE ce.campaign_id = '<campaign_id>'
    ORDER BY ce.enrolled_at DESC
    LIMIT 10;
    ```
    Compare with displayed enrollments.

    **Campaign performance stats:**
    - If performance stats component exists, verify it shows open/click/conversion rates
    - Check if stats are per-touch or per-campaign
    - Verify stats look reasonable (not NaN or undefined)

    **V2 alignment:**
    - Campaign detail should feel like a "status monitor" not a "blast tracker"
    - Focus on enrollment progress, not send counts
    - No legacy language

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 4 campaign detail screenshots captured
    - Touch sequence cross-checked against database
    - Enrollment list cross-checked against database
    - Performance stats verified (if present)
    - All findings documented
  </verify>
  <done>Campaign detail page fully audited: touch display, enrollments, data accuracy, themes, viewports.</done>
</task>

<task type="auto">
  <name>Task 2: Audit Campaign Edit + New Pages</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools for testing.**

    **--- Campaign Edit Page (/campaigns/[id]/edit) ---**

    Navigate to `http://localhost:3000/campaigns/<campaign_id>/edit`.

    **Screenshot baseline:**
    - Desktop light: `audit-screenshots/campaign-edit-desktop-light.png`
    - Desktop dark: `audit-screenshots/campaign-edit-desktop-dark.png`
    - Mobile light: `audit-screenshots/campaign-edit-mobile-light.png`
    - Mobile dark: `audit-screenshots/campaign-edit-mobile-dark.png`

    **Campaign edit form:**
    - Campaign name field pre-filled
    - Service type selector pre-filled (or "All Services")
    - Touch editor:
      - Existing touches displayed with channel, delay, template
      - Can change touch channel (email/SMS)
      - Can change touch delay (hours input)
      - Can change touch template (template selector)
      - Can add new touch (up to 4 max)
      - Can remove existing touch
    - Personalization toggle visible
    - Save button works

    **Form validation:**
    - Try saving with empty name (should prevent)
    - Try setting touch delay to 0 (should prevent, minimum 1 hour)
    - Try adding more than 4 touches (should prevent)
    - Verify sequential touch validation (touch numbers must be 1,2,3,4)

    **Personalization preview:**
    - If personalization enabled, verify preview samples shown
    - Check that preview uses actual customer data (not dummy)
    - Verify 3 curated samples with "show more" option

    **--- New Campaign Page (/campaigns/new) ---**

    Navigate to `http://localhost:3000/campaigns/new`.

    **Screenshot baseline:**
    - Desktop light: `audit-screenshots/campaign-new-desktop-light.png`
    - Desktop dark: `audit-screenshots/campaign-new-desktop-dark.png`

    **New campaign form:**
    - Empty form state (no pre-filled values)
    - Campaign name input
    - Service type selector (all 8 types + "All Services" option)
    - Touch configuration (add touch, set channel/delay/template)
    - Preset selection integration (if available from this page)
    - Personalization toggle
    - Save/Create button

    **Form interaction test:**
    - Fill out a complete campaign
    - Add 2-3 touches with different channels
    - Select templates for each touch
    - Save the campaign
    - Verify redirect to campaign detail or campaign list
    - Verify campaign appears in list with correct data

    **V2 alignment:**
    - Campaign creation should feel lightweight, not complex
    - Presets should be the primary path (not manual touch configuration)
    - Language should be about "automated follow-up" not "sending campaigns"
    - No legacy terminology

    **Cross-cutting checks:**
    - Template selector shows both email and SMS templates (matching touch channel)
    - Touch delay labels make sense ("hours after job completion" for touch 1, "hours after previous touch" for touch 2+)
    - All icons are Phosphor
    - Design system consistency (spacing, colors, typography)

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 6 campaign edit screenshots + 2 campaign new screenshots captured
    - Edit form pre-fills correctly
    - Touch editor works (add, remove, modify)
    - New campaign creation works end-to-end
    - Form validation tested
    - All findings documented
  </verify>
  <done>Campaign edit and new pages fully audited: forms, validation, interactions, themes, viewports.</done>
</task>

</tasks>

<verification>
- All three campaign sub-routes tested
- Touch sequence data matches database
- Enrollment data matches database
- Campaign creation flow works end-to-end
- Campaign edit flow saves changes correctly
- Form validation prevents invalid input
</verification>

<success_criteria>
- 10+ screenshots across 3 campaign pages
- Campaign detail shows accurate touch and enrollment data
- Campaign edit form saves correctly
- New campaign creation works
- Form validation prevents bad input
- V2 alignment: presets feel primary, manual config secondary
- No legacy terminology
</success_criteria>

<output>
After completion, create `.planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-04-SUMMARY.md`

Include: CRUD test outcomes, data accuracy, V2 alignment assessment, findings by severity.
</output>
