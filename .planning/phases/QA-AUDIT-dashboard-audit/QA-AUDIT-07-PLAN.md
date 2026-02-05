---
phase: QA-AUDIT
plan: 07
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "History page renders send logs with filtering and search"
    - "Billing page shows subscription, usage, and plan cards"
    - "Settings page renders all sections with working forms"
    - "All three pages tested in light+dark mode and desktop+mobile viewports"
  artifacts:
    - path: "C:\\AvisLoop\\audit-screenshots\\history-*.png"
      provides: "History page baseline screenshots"
    - path: "C:\\AvisLoop\\audit-screenshots\\billing-*.png"
      provides: "Billing page baseline screenshots"
    - path: "C:\\AvisLoop\\audit-screenshots\\settings-*.png"
      provides: "Settings page baseline screenshots"
  key_links:
    - from: "History page"
      to: "send_logs table"
      via: "paginated log query with filters"
    - from: "Billing page usage"
      to: "send_logs + customers tables"
      via: "monthly count queries"
---

<objective>
Audit the History, Billing, and Settings pages. These are utility/management pages that support the core workflow but aren't primary destinations.

Purpose: Verify these supporting pages work correctly, display accurate data, and don't contain legacy terminology.
Output: Findings documented in scratch notes for final report compilation (Plan 09).
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-CONTEXT.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-RESEARCH.md
@C:\AvisLoop\app\(dashboard)\history\page.tsx
@C:\AvisLoop\app\(dashboard)\billing\page.tsx
@C:\AvisLoop\app\(dashboard)\settings\page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit History Page (/history)</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools and Supabase MCP (execute_sql) for testing.**

    **All screenshots must use absolute path `C:\AvisLoop\audit-screenshots\` as the destination directory.**

    Navigate to `http://localhost:3000/history`.

    **Screenshot baseline:**
    - Desktop light: `C:\AvisLoop\audit-screenshots\history-desktop-light.png`
    - Desktop dark: `C:\AvisLoop\audit-screenshots\history-desktop-dark.png`
    - Mobile light: `C:\AvisLoop\audit-screenshots\history-mobile-light.png`
    - Mobile dark: `C:\AvisLoop\audit-screenshots\history-mobile-dark.png`

    **Send log list:**
    - Verify entries display: Customer name, Channel (email/SMS), Status, Date/time
    - Check status badges: sent, delivered, bounced, failed — verify correct colors
    - Check campaign attribution (shows campaign name if campaign send, "Manual" if manual)
    - Verify touch number displayed for campaign sends
    - Check date/time formatting (consistent, readable)

    **Data cross-check:**
    Use the **Supabase MCP execute_sql tool** to run:
    ```sql
    SELECT sl.id, c.name as customer_name, sl.channel, sl.status,
      sl.created_at, cam.name as campaign_name, sl.touch_number
    FROM send_logs sl
    JOIN customers c ON sl.customer_id = c.id
    LEFT JOIN campaigns cam ON sl.campaign_id = cam.id
    WHERE sl.business_id = '<biz_id>'
    ORDER BY sl.created_at DESC
    LIMIT 10;
    ```
    Compare with displayed history entries.

    **Filtering:**
    - Date range filter — set a date range and verify results filter
    - Status filter (if available) — filter by sent/delivered/bounced/failed
    - Search by customer name (if available)
    - Channel filter (email/SMS) if available
    - Verify filter combinations work

    **Pagination:**
    - Verify pagination works if many entries
    - Check page size and navigation

    **Empty state:**
    - Verify empty state when no send history exists
    - Check message and CTA

    **V2 alignment:**
    - Page should feel like an "audit trail" — read-only, informational
    - Labeled "Activity" in sidebar (not "History" or "Requests")
    - Should show campaign attribution prominently
    - No legacy language

    **Navigation label check:**
    - Sidebar says "Activity" but route is /history — note this discrepancy (Low severity)

    **Legacy terminology scan:**
    - Check for "contact", "request", "send request" in visible text

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 4 history page screenshots captured in `C:\AvisLoop\audit-screenshots\`
    - Send log data cross-checked against database using Supabase MCP execute_sql
    - Filtering tested
    - Legacy terminology scanned
    - All findings documented
  </verify>
  <done>History page fully audited: list, filtering, data accuracy, themes, viewports.</done>
</task>

<task type="auto">
  <name>Task 2: Audit Billing and Settings Pages</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools and Supabase MCP (execute_sql) for testing.**

    **All screenshots must use absolute path `C:\AvisLoop\audit-screenshots\` as the destination directory.**

    **--- Billing Page (/billing) ---**

    Navigate to `http://localhost:3000/billing`.

    **Screenshot baseline:**
    - Desktop light: `C:\AvisLoop\audit-screenshots\billing-desktop-light.png`
    - Desktop dark: `C:\AvisLoop\audit-screenshots\billing-desktop-dark.png`
    - Mobile light: `C:\AvisLoop\audit-screenshots\billing-mobile-light.png`
    - Mobile dark: `C:\AvisLoop\audit-screenshots\billing-mobile-dark.png`

    **Subscription section:**
    - Current plan displayed (trial/starter/pro/enterprise)
    - Plan features listed
    - Upgrade/downgrade buttons work (verify Stripe checkout link if applicable)

    **Usage display:**
    - Monthly send count displayed
    - Customer count displayed
    - Usage bar/progress toward limits
    - Verify "customers" language (not "contacts")

    **Usage data cross-check:**
    Use the **Supabase MCP execute_sql tool** to run:
    ```sql
    -- Monthly sends
    SELECT COUNT(*) FROM send_logs
    WHERE business_id = '<biz_id>'
      AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);

    -- Active customer count
    SELECT COUNT(*) FROM customers
    WHERE business_id = '<biz_id>' AND status = 'active';
    ```
    Compare with displayed usage values.

    **LEGACY TERMINOLOGY CHECK (KNOWN ISSUE):**
    - Research notes `CONTACT_LIMITS` constant name exists in billing code
    - Check if user-facing text says "Customer limit" (correct) or "Contact limit" (incorrect)
    - Check usage warning banner text

    **Plan cards:**
    - All tier cards display correctly
    - Current plan highlighted
    - Pricing visible
    - Feature comparison visible

    **V2 alignment:**
    - Billing should reference campaigns and send quotas, not just "sends"
    - Check if billing tiers mention campaign features

    **Navigation access:**
    - Billing is NOT in sidebar — how is it accessed?
    - Check Account menu for Billing link
    - If not accessible from nav, flag as finding

    ---

    **--- Settings Page (/settings) ---**

    Navigate to `http://localhost:3000/settings`.

    **Screenshot baseline:**
    - Desktop light: `C:\AvisLoop\audit-screenshots\settings-desktop-light.png`
    - Desktop dark: `C:\AvisLoop\audit-screenshots\settings-desktop-dark.png`
    - Mobile light: `C:\AvisLoop\audit-screenshots\settings-mobile-light.png`
    - Mobile dark: `C:\AvisLoop\audit-screenshots\settings-mobile-dark.png`

    **Test each settings section:**

    1. **Business Profile:**
       - Business name field (editable, saves)
       - Google review link field
       - Business phone field (if added in Phase 28)
       - Save button works

    2. **Message Templates:**
       - Template list (email + SMS)
       - Add template button
       - Template form with channel selector (email/SMS)
       - SMS character counter
       - Edit existing template
       - Delete template (not system templates)
       - System templates shown but read-only
       - "Use this template" creates an editable copy for the business

    3. **Service Types:**
       - Multi-select for enabled service types
       - Timing configuration per service type
       - Default timing values displayed
       - Save button works

    4. **AI/Personalization:**
       - Personalization toggle
       - Usage stats display
       - Monthly cost estimate
       - Model routing info (if visible)

    5. **Integrations:**
       - External service status (Resend, Twilio, Stripe)
       - API key indicators (masked, not raw)
       - Connection status badges

    6. **Email Authentication (Phase 28):**
       - SPF/DKIM/DMARC guidance
       - Status badges
       - Link to Resend dashboard

    7. **Branded Links (Phase 28):**
       - Branded review link display
       - Generate/regenerate button
       - Confirmation dialog for regenerate

    8. **Danger Zone:**
       - Delete account button
       - Confirmation dialog
       - Warning text

    **Legacy terminology scan:**
    - Check ALL section headings, labels, descriptions
    - "Message Templates" not "Email Templates" (known rename)
    - Customer-related labels use "customers" not "contacts"

    **Design consistency:**
    - All sections use consistent card styling
    - Spacing between sections uniform
    - All icons Phosphor

    **Mobile responsiveness:**
    - Forms don't overflow on mobile
    - Sections stack vertically
    - All inputs reachable

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 8 screenshots (4 billing, 4 settings) in `C:\AvisLoop\audit-screenshots\`
    - Billing usage data cross-checked against database using Supabase MCP execute_sql
    - All settings sections tested
    - Legacy terminology scanned on both pages
    - Navigation access to billing verified
    - All findings documented
  </verify>
  <done>Billing and Settings pages fully audited: forms, data accuracy, legacy terminology, themes, viewports.</done>
</task>

</tasks>

<verification>
- History, Billing, and Settings all fully tested
- Data accuracy verified for History and Billing via Supabase MCP execute_sql
- All settings sections interactive-tested
- Legacy terminology scanned on all three pages
- Both themes and viewports tested
</verification>

<success_criteria>
- 12 total screenshots (4 per page) in `C:\AvisLoop\audit-screenshots\`
- History log data matches database
- Billing usage matches database
- All settings forms work (save and persist)
- CONTACT_LIMITS terminology checked on Billing page
- Navigation access to Billing verified
- "Activity" vs "/history" route discrepancy noted
- All findings documented with severity + fix suggestions
</success_criteria>

<output>
After completion, create `.planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-07-SUMMARY.md`

Include: Data accuracy results, settings section coverage, legacy terminology findings, findings by severity.
</output>
