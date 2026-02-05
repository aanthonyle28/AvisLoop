---
phase: QA-AUDIT
plan: 02
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Dashboard page renders KPI widgets, ready-to-send queue, and attention alerts"
    - "Analytics page renders service type breakdown charts"
    - "Dashboard KPI values match database query results"
    - "Both pages tested in light+dark mode and desktop+mobile viewports"
  artifacts:
    - path: "audit-screenshots/dashboard-*.png"
      provides: "Dashboard page baseline screenshots"
    - path: "audit-screenshots/analytics-*.png"
      provides: "Analytics page baseline screenshots"
  key_links:
    - from: "Dashboard KPI widgets"
      to: "customers/jobs/campaigns tables"
      via: "data queries displaying counts"
    - from: "Analytics charts"
      to: "jobs + send_logs tables"
      via: "aggregation by service type"
---

<objective>
Audit the Dashboard (command center) and Analytics pages. These are the two primary "view" pages that display aggregated data — the most likely places for data inconsistency bugs and the most important pages for V2 alignment.

Purpose: Verify dashboard shows correct data, KPIs match database, and both pages align with campaign-first V2 model.
Output: Findings documented in scratch notes for final report compilation (Plan 09).
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-CONTEXT.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-RESEARCH.md
@C:\AvisLoop\app\(dashboard)\dashboard\page.tsx
@C:\AvisLoop\app\(dashboard)\analytics\page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit Dashboard Page (/dashboard)</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools and Supabase MCP (execute_sql) for testing.**

    Navigate to `http://localhost:3000/dashboard` (logged in as populated account).

    **Screenshot baseline:**
    - Desktop light: `audit-screenshots/dashboard-desktop-light.png` (1280x800)
    - Desktop dark: `audit-screenshots/dashboard-desktop-dark.png`
    - Mobile light: `audit-screenshots/dashboard-mobile-light.png` (375x667)
    - Mobile dark: `audit-screenshots/dashboard-mobile-dark.png`

    **Action Summary Banner:**
    - Check if banner shows "All caught up" (green with CheckCircle) or pending items count (yellow with WarningCircle)
    - If items pending, verify clicking banner scrolls to relevant section
    - Verify banner styling in both themes

    **KPI Widgets (Two-Tier):**
    - **Outcome tier (large):** Reviews, Rating, Conversion — verify text-4xl sizing
    - **Pipeline tier (small):** Sends, Sequences, Pending — verify text-2xl sizing
    - Check trend indicators (up/down arrows or "—" for zero change)
    - Verify outcome cards are clickable (wrapped in Link)
    - Verify pipeline cards are static (not clickable)

    **Data Cross-Check (CRITICAL):**
    Using Supabase MCP execute_sql, get the logged-in user's business_id, then:
    ```sql
    -- Get business_id for current user
    SELECT b.id as business_id FROM businesses b WHERE b.user_id = '<user_id>';

    -- Customer count
    SELECT COUNT(*) FROM customers WHERE business_id = '<biz_id>' AND status = 'active';

    -- Job count
    SELECT COUNT(*) FROM jobs WHERE business_id = '<biz_id>' AND status = 'completed';

    -- Active campaign count
    SELECT COUNT(*) FROM campaigns WHERE business_id = '<biz_id>' AND status = 'active';

    -- Monthly sends
    SELECT COUNT(*) FROM send_logs WHERE business_id = '<biz_id>'
      AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);

    -- Active enrollments
    SELECT COUNT(*) FROM campaign_enrollments WHERE business_id = '<biz_id>' AND status = 'active';
    ```
    Compare each DB result with the corresponding KPI widget value displayed in the UI. Document any mismatches as CRITICAL findings.

    **Ready-to-Send Queue:**
    - Verify queue shows completed jobs not yet enrolled in campaign
    - Check "Quick Enroll" action button works (click it, verify enrollment created or appropriate error)
    - Verify service-type urgency flags (yellow WarningCircle for stale jobs)
    - Check queue limit (shows first 5 with "Show all" link if more)
    - Verify empty state if no jobs pending

    **Attention Alerts:**
    - Check for failed sends and unresolved feedback alerts
    - Verify contextual actions: Failed -> Retry, Bounced -> Update contact, Feedback -> Respond
    - Check overflow menu for acknowledge option on permanent failures
    - Verify shows 3 alerts by default with expandable

    **Navigation badge:**
    - In sidebar, verify Dashboard has attention badge count (readyToSend + attentionAlerts)
    - Verify badge updates correctly

    **V2 Alignment Check:**
    - Dashboard should feel like a "command center" — not a CRM
    - Primary focus should be on job-to-review pipeline
    - "Add Job" button visible in sidebar (persistent)
    - No legacy "contacts" or "send request" language

    **Legacy terminology scan:**
    - Scan all visible text on the dashboard for "contact", "contacts", "send request", "review request"
    - Check button labels, headings, descriptions, empty state text
    - Flag any findings as CRITICAL

    **A11y basics:**
    - Tab through page with keyboard
    - Verify focus indicators visible on all interactive elements
    - Verify all buttons have labels (not just icons)
    - Check heading hierarchy (h1 > h2 > h3)

    **Record findings with:**
    - Page: Dashboard
    - Finding description
    - Severity: Critical / Medium / Low
    - Fix suggestion (file, component, what to change)
  </action>
  <verify>
    - 4 dashboard screenshots captured
    - KPI data cross-checked against database
    - Ready-to-send queue tested
    - Attention alerts tested
    - Legacy terminology scan complete
    - All findings documented
  </verify>
  <done>Dashboard page fully audited: layout, data accuracy, interactions, themes, viewports, and V2 alignment verified.</done>
</task>

<task type="auto">
  <name>Task 2: Audit Analytics Page (/analytics)</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools and Supabase MCP for testing.**

    Navigate to `http://localhost:3000/analytics`.

    **Screenshot baseline:**
    - Desktop light: `audit-screenshots/analytics-desktop-light.png`
    - Desktop dark: `audit-screenshots/analytics-desktop-dark.png`
    - Mobile light: `audit-screenshots/analytics-mobile-light.png`
    - Mobile dark: `audit-screenshots/analytics-mobile-dark.png`

    **Service Type Breakdown Charts:**
    - Verify charts render for each enabled service type
    - Check chart labels are readable in both themes
    - Verify response rate and review rate displayed (two-rate display)
    - Check service types sorted by volume (most active first)

    **Data Cross-Check:**
    Using Supabase MCP execute_sql:
    ```sql
    -- Sends by service type
    SELECT j.service_type, COUNT(sl.id) as sends
    FROM send_logs sl
    JOIN jobs j ON sl.job_id = j.id
    WHERE sl.business_id = '<biz_id>'
    GROUP BY j.service_type
    ORDER BY sends DESC;

    -- Jobs by service type
    SELECT service_type, COUNT(*) as jobs
    FROM jobs WHERE business_id = '<biz_id>'
    GROUP BY service_type
    ORDER BY jobs DESC;
    ```
    Compare totals with chart values displayed. Document mismatches.

    **Empty state test:**
    - If possible, test with an account that has no jobs/sends
    - Verify empty state message is helpful (not blank or error)
    - Verify CTA directs user to add jobs

    **V2 alignment:**
    - Analytics should show job-to-review pipeline metrics
    - Should feel like an "outcomes" page, not a "sends" page
    - No legacy "contacts" or single-send language

    **Design consistency:**
    - Charts use design system colors (--primary, --status-* variables)
    - Spacing consistent with other pages
    - Typography matches design system (Kumbh Sans)

    **Legacy terminology scan:**
    - Scan all visible text for banned terms
    - Check chart labels, axis labels, headings, descriptions

    **Mobile responsiveness:**
    - Charts render within viewport (no horizontal scroll)
    - Legend readable on mobile
    - Touch targets sufficient size

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 4 analytics screenshots captured
    - Data cross-checked against database
    - Empty state tested (if possible)
    - V2 alignment verified
    - All findings documented
  </verify>
  <done>Analytics page fully audited: charts, data accuracy, themes, viewports, and V2 alignment verified.</done>
</task>

</tasks>

<verification>
- Dashboard data accuracy verified against database
- Analytics data accuracy verified against database
- Both pages tested in all 4 viewport+theme combinations
- No Critical findings related to data inconsistency
- Legacy terminology scan complete for both pages
</verification>

<success_criteria>
- 8 total screenshots (4 per page)
- Dashboard KPI values match database queries
- Analytics chart values match database aggregations
- All interactive elements tested (banner, quick enroll, alert actions)
- V2 alignment assessed for both pages
- All findings documented with severity + fix suggestion
</success_criteria>

<output>
After completion, create `.planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-02-SUMMARY.md`

Include: Data accuracy results (match/mismatch), findings by severity, V2 alignment assessment.
</output>
