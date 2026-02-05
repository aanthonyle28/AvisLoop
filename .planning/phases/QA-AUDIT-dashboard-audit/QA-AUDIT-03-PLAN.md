---
phase: QA-AUDIT
plan: 03
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Jobs page renders job list with correct columns (customer name, service type, status, completion date)"
    - "Campaigns page renders campaign list with status toggle and preset picker"
    - "Both pages tested in light+dark mode and desktop+mobile viewports"
    - "Jobs page feels like a primary workflow page in V2 model"
  artifacts:
    - path: "C:\\AvisLoop\\audit-screenshots\\jobs-*.png"
      provides: "Jobs page baseline screenshots"
    - path: "C:\\AvisLoop\\audit-screenshots\\campaigns-*.png"
      provides: "Campaigns list page baseline screenshots"
  key_links:
    - from: "Jobs page"
      to: "jobs table"
      via: "paginated data query"
    - from: "Campaigns page"
      to: "campaigns table"
      via: "campaign list query"
---

<objective>
Audit the Jobs page and Campaigns list page. These are the two core V2 workflow pages — Jobs is where work is logged, Campaigns is where automation is configured.

Purpose: Verify the two primary V2 pages work correctly, display accurate data, and feel prominent in the navigation hierarchy.
Output: Findings documented in scratch notes for final report compilation (Plan 09).
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-CONTEXT.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-RESEARCH.md
@C:\AvisLoop\app\(dashboard)\jobs\page.tsx
@C:\AvisLoop\app\(dashboard)\campaigns\page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit Jobs Page (/jobs)</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools and Supabase MCP (execute_sql) for testing.**

    **All screenshots must use absolute path `C:\AvisLoop\audit-screenshots\` as the destination directory.**

    Navigate to `http://localhost:3000/jobs`.

    **Screenshot baseline:**
    - Desktop light: `C:\AvisLoop\audit-screenshots\jobs-desktop-light.png`
    - Desktop dark: `C:\AvisLoop\audit-screenshots\jobs-desktop-dark.png`
    - Mobile light: `C:\AvisLoop\audit-screenshots\jobs-mobile-light.png`
    - Mobile dark: `C:\AvisLoop\audit-screenshots\jobs-mobile-dark.png`

    **Job list table:**
    - Verify columns: Customer name, Service type, Status, Completion date
    - Check table header labels for correct terminology
    - Verify service type displays correctly (HVAC, Plumbing, etc. with proper casing)
    - Verify status badges (completed = green, do_not_send = appropriate color)
    - Check pagination if many jobs
    - Check sorting (click column headers if sortable)

    **Data cross-check:**
    Use the **Supabase MCP execute_sql tool** to run:
    ```sql
    SELECT j.id, c.name as customer_name, j.service_type, j.status, j.completed_at
    FROM jobs j
    JOIN customers c ON j.customer_id = c.id
    WHERE j.business_id = '<biz_id>'
    ORDER BY j.created_at DESC
    LIMIT 10;
    ```
    Verify first page of jobs matches DB results (names, types, statuses).

    **Add Job flow:**
    - Click "Add Job" button (or use sidebar persistent button)
    - Verify form opens (dialog or inline)
    - Check customer selector (dropdown search, populated with customers)
    - Check service type selector (8 options: hvac, plumbing, electrical, cleaning, roofing, painting, handyman, other)
    - Check status selector (completed / do_not_send)
    - Verify "Enroll in campaign" checkbox (should default to checked)
    - Try submitting with valid data
    - Try submitting with empty fields (validation should prevent)

    **Edit Job flow:**
    - Click on existing job (or edit button)
    - Verify form pre-fills with existing data
    - Make a change and save
    - Verify change persists

    **Service type filter:**
    - If filter exists, test filtering by service type
    - Verify filtered results match expectations

    **Empty state test:**
    - If possible, view with no jobs
    - Verify empty state message ("No jobs yet" or similar)
    - Verify CTA ("Add your first job" or similar)

    **V2 alignment (CRITICAL):**
    - Jobs should feel like a PRIMARY page (this is where work is logged)
    - The "Add Job" action should feel prominent and easy (~10 seconds)
    - Campaign enrollment checkbox should feel natural, not buried
    - No legacy language: no "contacts", no "send request"
    - Service types should be clearly visible

    **Legacy terminology scan:**
    - Scan all visible text for "contact", "contacts", "send request", "review request"
    - Check form labels, placeholders, headings, empty state text
    - Check button labels (should say "Add Job", not "Create Request")

    **A11y basics:**
    - Tab through page elements
    - Verify focus indicators on table rows and form elements
    - Check form labels exist

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 4 jobs page screenshots captured in `C:\AvisLoop\audit-screenshots\`
    - Job list data cross-checked against database using Supabase MCP execute_sql
    - Add/edit job flows tested
    - Legacy terminology scan complete
    - V2 alignment assessed
  </verify>
  <done>Jobs page fully audited: list, CRUD, data accuracy, themes, viewports, V2 alignment verified.</done>
</task>

<task type="auto">
  <name>Task 2: Audit Campaigns List Page (/campaigns)</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools and Supabase MCP (execute_sql) for testing.**

    **All screenshots must use absolute path `C:\AvisLoop\audit-screenshots\` as the destination directory.**

    Navigate to `http://localhost:3000/campaigns`.

    **Screenshot baseline:**
    - Desktop light: `C:\AvisLoop\audit-screenshots\campaigns-desktop-light.png`
    - Desktop dark: `C:\AvisLoop\audit-screenshots\campaigns-desktop-dark.png`
    - Mobile light: `C:\AvisLoop\audit-screenshots\campaigns-mobile-light.png`
    - Mobile dark: `C:\AvisLoop\audit-screenshots\campaigns-mobile-dark.png`

    **Campaign list:**
    - Verify campaign cards/rows display: Name, Service type, Status (active/paused), Touch count
    - Verify status toggle works (active <-> paused)
    - Check visual treatment of active vs paused campaigns

    **Data cross-check:**
    Use the **Supabase MCP execute_sql tool** to run:
    ```sql
    SELECT c.id, c.name, c.service_type, c.status, c.is_preset,
      (SELECT COUNT(*) FROM campaign_touches ct WHERE ct.campaign_id = c.id) as touch_count,
      (SELECT COUNT(*) FROM campaign_enrollments ce WHERE ce.campaign_id = c.id AND ce.status = 'active') as active_enrollments
    FROM campaigns c
    WHERE c.business_id = '<biz_id>'
    ORDER BY c.created_at DESC;
    ```
    Compare with displayed campaigns.

    **Preset picker:**
    - Verify preset options visible: Conservative, Standard, Aggressive
    - Check preset descriptions explain differences (touch count, channels, timing)
    - Try selecting a preset (should create campaign or navigate to creation)

    **Campaign actions:**
    - Status toggle (active/paused) — verify state change reflected immediately
    - View/detail link — verify navigates to campaign detail page
    - Duplicate action — verify creates copy
    - Delete action — check if blocked when active enrollments exist

    **Empty state test:**
    - Verify empty state when no campaigns exist
    - Verify CTA guides user to create first campaign (preset picker prominent)
    - Empty state should feel inviting, not confusing

    **V2 alignment (CRITICAL):**
    - Campaigns should feel like the PRIMARY automation page
    - Preset picker should be prominent (not buried)
    - Users should NOT feel like they need to "build" campaigns — presets are the path
    - No language about "blasting" or "sending campaigns" — it's about automated follow-up
    - Navigation position check: Campaigns is 5th in sidebar (after Jobs, which is correct V2 order)

    **Legacy terminology scan:**
    - No "contacts", "send request", "review request" anywhere
    - Check preset descriptions, campaign names, status labels

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 4 campaigns page screenshots captured in `C:\AvisLoop\audit-screenshots\`
    - Campaign data cross-checked against database using Supabase MCP execute_sql
    - Preset picker tested
    - Status toggle tested
    - Empty state tested
    - V2 alignment assessed
  </verify>
  <done>Campaigns list page fully audited: list, presets, interactions, data accuracy, themes, viewports, V2 alignment verified.</done>
</task>

</tasks>

<verification>
- Jobs and Campaigns pages both fully tested in all viewport+theme combinations
- Data accuracy verified for both pages via Supabase MCP execute_sql
- CRUD operations tested on Jobs
- Campaign presets and status toggle tested
- V2 alignment verified: these feel like primary workflow pages
</verification>

<success_criteria>
- 8 total screenshots (4 per page) in `C:\AvisLoop\audit-screenshots\`
- Job list matches database
- Campaign list matches database
- Add/edit job flow works
- Campaign status toggle works
- Preset picker works
- Empty states verified for both pages
- No legacy terminology found (or flagged)
- V2 alignment passes for both pages
</success_criteria>

<output>
After completion, create `.planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-03-SUMMARY.md`

Include: Data accuracy results, CRUD test outcomes, V2 alignment assessment, findings by severity.
</output>
