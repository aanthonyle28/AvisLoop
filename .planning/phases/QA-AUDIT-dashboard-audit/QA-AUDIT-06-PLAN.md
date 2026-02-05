---
phase: QA-AUDIT
plan: 06
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Customers page renders customer list with CRUD operations working"
    - "Feedback page renders feedback list with resolution workflow"
    - "Both pages tested in light+dark mode and desktop+mobile viewports"
    - "Customers page feels secondary in V2 model (not a primary CRM destination)"
  artifacts:
    - path: "C:\\AvisLoop\\audit-screenshots\\customers-*.png"
      provides: "Customers page baseline screenshots"
    - path: "C:\\AvisLoop\\audit-screenshots\\feedback-*.png"
      provides: "Feedback page baseline screenshots"
  key_links:
    - from: "Customers page list"
      to: "customers table"
      via: "paginated customer query"
    - from: "Feedback page list"
      to: "customer_feedback table"
      via: "feedback query with resolution status"
---

<objective>
Audit the Customers page and Feedback page. Customers is the renamed contacts page (high risk for legacy terminology). Feedback is the newest page from Phase 26 (review funnel output).

Purpose: Verify customer CRUD works, feedback resolution workflow works, and both pages use correct V2 terminology.
Output: Findings documented in scratch notes for final report compilation (Plan 09).
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-CONTEXT.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-RESEARCH.md
@C:\AvisLoop\app\(dashboard)\customers\page.tsx
@C:\AvisLoop\app\(dashboard)\feedback\page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit Customers Page (/customers)</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools and Supabase MCP (execute_sql) for testing.**

    **All screenshots must use absolute path `C:\AvisLoop\audit-screenshots\` as the destination directory.**

    Navigate to `http://localhost:3000/customers`.

    **Screenshot baseline:**
    - Desktop light: `C:\AvisLoop\audit-screenshots\customers-desktop-light.png`
    - Desktop dark: `C:\AvisLoop\audit-screenshots\customers-desktop-dark.png`
    - Mobile light: `C:\AvisLoop\audit-screenshots\customers-mobile-light.png`
    - Mobile dark: `C:\AvisLoop\audit-screenshots\customers-mobile-dark.png`

    **Customer list table:**
    - Verify columns: Name, Email, Phone, Status, Tags, SMS Consent
    - Check phone numbers display in US format (xxx-xxx-xxxx)
    - Verify status badges (active/archived)
    - Check tag chips display (VIP, repeat, commercial, residential, custom)
    - Verify SMS consent status badges (opted_in/opted_out/unknown)
    - Check pagination works
    - Check search functionality (search by name or email)

    **Data cross-check:**
    Use the **Supabase MCP execute_sql tool** to run:
    ```sql
    SELECT id, name, email, phone, status, tags, phone_status,
      sms_consent_status, last_sent_at, send_count
    FROM customers
    WHERE business_id = '<biz_id>' AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 10;
    ```
    Compare first page of customers with DB results.

    **Add customer flow:**
    - Click "Add Customer" button
    - Verify form shows: Name, Email, Phone, Tags
    - Fill in valid data
    - Verify phone validation (E.164 format accepted, invalid rejected)
    - Save and verify customer appears in list

    **Edit customer flow:**
    - Click on existing customer (or detail drawer)
    - Verify customer detail drawer opens with full details
    - Check detail drawer shows:
      - Contact info (name, email, phone)
      - Tags (editable)
      - SMS consent status and history
      - Send history (last sent, send count)
      - Jobs linked to this customer
    - Edit a field and save
    - Verify change persists

    **Bulk operations:**
    - Select multiple customers
    - Check available bulk actions (archive, tag, etc.)
    - Test a bulk action (e.g., add tag to multiple customers)

    **CSV import:**
    - Check if import button exists
    - Verify import dialog/flow opens
    - Check for phone review queue (imported phones need validation)

    **Tag filter:**
    - Click on a tag chip to filter
    - Verify filtered list shows only tagged customers
    - Clear filter

    **Empty state test:**
    - If possible, test with no customers
    - Verify empty state message and CTA

    **LEGACY TERMINOLOGY SCAN (HIGHEST RISK PAGE):**
    - This page was renamed from "Contacts" in Phase 20
    - Scan EVERY visible text element:
      - Page heading: Must say "Customers" not "Contacts"
      - Add button: "Add Customer" not "Add Contact"
      - Search placeholder: Check for "contact" references
      - Column headers: "Customer Name" not "Contact Name"
      - Detail drawer title
      - Empty state text
      - Bulk action labels
      - Filter labels
      - CSV import dialog text
    - Use browser_snapshot to capture full DOM and search
    - This page has the HIGHEST risk of legacy terminology

    **V2 alignment:**
    - Customers should feel SECONDARY (supporting data, not entry point)
    - In V2, customers are created implicitly when jobs are completed
    - Is there guidance steering users to add customers via jobs instead?
    - The page should not feel like a CRM primary destination

    **Icon consistency:**
    - All icons should be Phosphor
    - Check detail drawer icons, action icons, tag icons

    **A11y basics:**
    - Tab through table and form elements
    - Verify focus indicators
    - Check drawer accessibility (close on Escape, focus trap)

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 4 customers page screenshots captured in `C:\AvisLoop\audit-screenshots\`
    - Customer data cross-checked against database using Supabase MCP execute_sql
    - Add/edit customer flows tested
    - Bulk operations tested
    - Legacy terminology thoroughly scanned
    - V2 alignment assessed
    - All findings documented
  </verify>
  <done>Customers page fully audited: CRUD, data accuracy, legacy terminology, V2 alignment, themes, viewports.</done>
</task>

<task type="auto">
  <name>Task 2: Audit Feedback Page (/feedback)</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools and Supabase MCP (execute_sql) for testing.**

    **All screenshots must use absolute path `C:\AvisLoop\audit-screenshots\` as the destination directory.**

    Navigate to `http://localhost:3000/feedback`.

    **Screenshot baseline:**
    - Desktop light: `C:\AvisLoop\audit-screenshots\feedback-desktop-light.png`
    - Desktop dark: `C:\AvisLoop\audit-screenshots\feedback-desktop-dark.png`
    - Mobile light: `C:\AvisLoop\audit-screenshots\feedback-mobile-light.png`
    - Mobile dark: `C:\AvisLoop\audit-screenshots\feedback-mobile-dark.png`

    **Feedback list:**
    - Verify list displays: Customer name, Rating (stars), Feedback text, Date, Resolution status
    - Check star rating display (1-5 stars visual)
    - Check resolution status (unresolved/resolved)
    - Verify sorting (newest first or unresolved first)
    - Check search functionality (if available)

    **Data cross-check:**
    Use the **Supabase MCP execute_sql tool** to run:
    ```sql
    SELECT cf.id, c.name as customer_name, cf.rating, cf.feedback_text,
      cf.submitted_at, cf.resolved_at, cf.internal_notes
    FROM customer_feedback cf
    JOIN customers c ON cf.customer_id = c.id
    WHERE cf.business_id = '<biz_id>'
    ORDER BY cf.submitted_at DESC
    LIMIT 10;
    ```
    Compare displayed feedback with DB data.

    **Resolution workflow:**
    - Click on unresolved feedback
    - Verify detail view shows full feedback text
    - Check "Mark as Resolved" action
    - Check "Add Internal Notes" field
    - If possible, resolve a feedback item and verify status changes

    **Feedback stats:**
    - Check if summary stats displayed (total feedback, unresolved count, average rating)
    - Cross-check stats with database using the **Supabase MCP execute_sql tool**:
    ```sql
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE resolved_at IS NULL) as unresolved,
      AVG(rating) as avg_rating
    FROM customer_feedback
    WHERE business_id = '<biz_id>';
    ```

    **Empty state test:**
    - Verify empty state when no feedback exists
    - Check empty state message (should be positive: "No feedback yet" not "Error")
    - Verify CTA (if any — might explain how feedback comes in via review funnel)

    **ICON CONSISTENCY CHECK (KNOWN ISSUE):**
    - Research noted that Feedback page uses `lucide-react` MessageSquare icon instead of Phosphor
    - Check all icons on this page
    - Verify the nav icon (should be ChatCircleText from Phosphor — sidebar already uses it correctly)
    - Check icons within the page content itself

    **V2 alignment:**
    - Feedback page connects to review funnel (Phase 26)
    - Should feel like a "response" page, not a "complaints inbox"
    - Language should be about "customer feedback" not "negative reviews"
    - Does it explain the connection to the review funnel?

    **Legacy terminology scan:**
    - Check for "contact" language
    - Check feedback form labels and descriptions

    **Design consistency:**
    - Card/list styling matches other pages
    - Status badges use design system colors
    - Spacing consistent

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 4 feedback page screenshots captured in `C:\AvisLoop\audit-screenshots\`
    - Feedback data cross-checked against database using Supabase MCP execute_sql
    - Resolution workflow tested
    - Icon consistency checked (lucide-react issue)
    - V2 alignment assessed
    - All findings documented
  </verify>
  <done>Feedback page fully audited: list, resolution workflow, data accuracy, icon consistency, themes, viewports.</done>
</task>

</tasks>

<verification>
- Both pages fully tested in all viewport+theme combinations
- Data accuracy verified for both pages via Supabase MCP execute_sql
- Customer CRUD operations tested
- Feedback resolution workflow tested
- Legacy terminology scan thorough on Customers page (highest risk)
- Icon consistency checked on Feedback page (known issue)
</verification>

<success_criteria>
- 8 total screenshots (4 per page) in `C:\AvisLoop\audit-screenshots\`
- Customer list matches database
- Feedback list matches database
- Customer CRUD works
- Feedback resolution works
- Legacy terminology fully scanned (especially Customers page)
- Feedback page icon consistency verified (Phosphor vs lucide-react)
- V2 alignment assessed for both pages
- All findings documented with severity + fix suggestions
</success_criteria>

<output>
After completion, create `.planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-06-SUMMARY.md`

Include: Legacy terminology findings, icon consistency issues, data accuracy results, V2 alignment, findings by severity.
</output>
