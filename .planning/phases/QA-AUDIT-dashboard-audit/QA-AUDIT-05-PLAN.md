---
phase: QA-AUDIT
plan: 05
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Quick Send tab works for sending individual messages"
    - "Bulk Send tab works for sending to multiple customers"
    - "Send page feels SECONDARY to Campaigns in V2 model"
    - "Both tabs tested in light+dark mode and desktop+mobile viewports"
  artifacts:
    - path: "C:\\AvisLoop\\audit-screenshots\\send-*.png"
      provides: "Send page baseline screenshots"
  key_links:
    - from: "Send page Quick Send"
      to: "send_logs table"
      via: "manual send server action"
    - from: "Send page customer selector"
      to: "customers table"
      via: "customer search/filter query"
---

<objective>
Audit the Send page (Quick Send + Bulk Send tabs). This is the manual sending page that should feel SECONDARY in V2's campaign-first model. Critical to verify it still works but doesn't dominate the user experience.

Purpose: Verify manual sending works, check for legacy "contacts" language (high risk area), and assess V2 alignment.
Output: Findings documented in scratch notes for final report compilation (Plan 09).
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-CONTEXT.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-RESEARCH.md
@C:\AvisLoop\app\(dashboard)\send\page.tsx
@C:\AvisLoop\components\send\quick-send-tab.tsx
@C:\AvisLoop\components\send\bulk-send-tab.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit Quick Send Tab</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools for testing.**

    **All screenshots must use absolute path `C:\AvisLoop\audit-screenshots\` as the destination directory.**

    Navigate to `http://localhost:3000/send` (should default to Quick Send tab).

    **Screenshot baseline:**
    - Desktop light: `C:\AvisLoop\audit-screenshots\send-quicksend-desktop-light.png`
    - Desktop dark: `C:\AvisLoop\audit-screenshots\send-quicksend-desktop-dark.png`
    - Mobile light: `C:\AvisLoop\audit-screenshots\send-quicksend-mobile-light.png`
    - Mobile dark: `C:\AvisLoop\audit-screenshots\send-quicksend-mobile-dark.png`

    **Quick Send tab layout:**
    - Tab selector visible (Quick Send / Bulk Send)
    - Customer selector (dropdown or search)
    - Channel selector (email/SMS toggle) — if SMS is available
    - Template selector
    - Message preview area
    - Send button

    **Customer selector test:**
    - Search for a customer by name
    - Verify customer details shown (name, email, phone if available)
    - Check that SMS option is only available for customers with phone + consent
    - Try selecting a customer with no phone — SMS should be disabled or hidden

    **Template selection test:**
    - Open template selector
    - Verify templates categorized by channel (email/SMS) or filtered by selected channel
    - Select a template
    - Verify preview updates with template content

    **Email preview test:**
    - Click email preview button/modal (if exists)
    - Verify preview shows rendered email (subject, body, CTA, footer)
    - Verify customer name and business name injected into template
    - Check opt-out footer present in email

    **Channel selector test (if available):**
    - Switch between email and SMS
    - Verify form updates (subject field hidden for SMS, character counter for SMS)
    - Verify SMS preview shows phone mockup with bubble
    - Verify character count display (160 GSM-7 limit warning)
    - Verify opt-out footer shown for SMS

    **Send flow test (use with caution - may actually send):**
    - Verify send button is disabled until customer + template selected
    - Check for cooldown enforcement (if customer was recently sent)
    - Check for quota/billing tier enforcement
    - Do NOT actually send unless safe to do so

    **LEGACY TERMINOLOGY SCAN (HIGH RISK - this page is known to have issues):**
    - The research notes that send components have extensive "contact" variable usage
    - Scan ALL visible text carefully:
      - Customer selector label: Should say "Customer" not "Contact"
      - Any "Select contacts" text: Should be "Select customers"
      - Any "contact" in placeholders, tooltips, labels
      - Any "send request" or "review request" in headings or descriptions
    - Use browser_snapshot to capture full DOM text and search for "contact"
    - Flag ALL instances as CRITICAL (user-facing) or MEDIUM (visible but not primary)

    **V2 Alignment Assessment (CRITICAL):**
    - Send page is #2 in sidebar nav — this position makes it feel PRIMARY
    - In V2, manual sending should be a secondary/backup action
    - Check page heading — does it say "Send" (okay) or "Send Review Request" (v1 language)?
    - Is there any messaging about campaigns being the preferred method?
    - Does the page feel like a quick utility or like the main workflow?
    - NOTE: Navigation order (Send at #2) was flagged in research as a V2 concern

    **A11y basics:**
    - Tab through form elements in order
    - Verify all form inputs have associated labels
    - Check focus indicators

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 4 Quick Send screenshots captured in `C:\AvisLoop\audit-screenshots\`
    - Customer selector tested
    - Template selector tested
    - Channel selector tested (if available)
    - Legacy terminology thoroughly scanned
    - V2 alignment assessed
    - All findings documented
  </verify>
  <done>Quick Send tab fully audited: form interactions, legacy terminology, V2 alignment, themes, viewports.</done>
</task>

<task type="auto">
  <name>Task 2: Audit Bulk Send Tab</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools for testing.**

    **All screenshots must use absolute path `C:\AvisLoop\audit-screenshots\` as the destination directory.**

    Navigate to `http://localhost:3000/send` and click the "Bulk Send" tab.

    **Screenshot baseline:**
    - Desktop light: `C:\AvisLoop\audit-screenshots\send-bulksend-desktop-light.png`
    - Desktop dark: `C:\AvisLoop\audit-screenshots\send-bulksend-desktop-dark.png`
    - Mobile light: `C:\AvisLoop\audit-screenshots\send-bulksend-mobile-light.png`
    - Mobile dark: `C:\AvisLoop\audit-screenshots\send-bulksend-mobile-dark.png`

    **Bulk Send tab layout:**
    - Customer list with checkboxes
    - Filter chips (by tag, status, etc.)
    - Action bar (appears when customers selected)
    - Template selector
    - Bulk send confirmation dialog

    **Customer list test:**
    - Verify customer list displays correctly
    - Check select-all checkbox works
    - Check individual selection works
    - Verify customer count displayed ("X customers selected")
    - Check pagination if many customers

    **Filter chips test:**
    - Filter by tag (VIP, repeat, etc.)
    - Verify filtered results match expectations
    - Clear filter and verify list resets

    **Bulk send confirm dialog:**
    - Select multiple customers
    - Initiate bulk send
    - Verify confirmation dialog shows:
      - Number of recipients
      - Template being sent
      - Warning about sending multiple messages
    - Cancel the dialog (do NOT actually send)

    **LEGACY TERMINOLOGY SCAN (HIGH RISK):**
    - Same as Quick Send tab — check ALL visible text
    - Bulk send is especially high risk for "contacts" language:
      - "Select contacts" -> should be "Select customers"
      - "X contacts selected" -> should be "X customers selected"
      - Column headers, filter labels, action labels
    - Use browser_snapshot to capture DOM text
    - Flag all instances

    **V2 Alignment Assessment:**
    - Bulk send is even MORE v1-feeling than Quick Send
    - In V2, you don't blast customers — campaigns handle follow-up automatically
    - Is there any guidance steering users toward campaigns instead?
    - Does the page acknowledge that campaigns exist?
    - This entire tab may be a product-sense concern in V2 model

    **Billing limit check:**
    - Verify billing tier limits displayed (monthly send quota)
    - Check if CONTACT_LIMITS constant name appears in any user-facing text
    - Verify usage display shows "customers" not "contacts"

    **A11y basics:**
    - Tab through table rows
    - Verify checkbox accessibility
    - Check filter chip keyboard interaction

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - 4 Bulk Send screenshots captured in `C:\AvisLoop\audit-screenshots\`
    - Customer selection tested
    - Filter chips tested
    - Bulk send confirmation dialog tested
    - Legacy terminology thoroughly scanned
    - V2 alignment assessed
    - All findings documented
  </verify>
  <done>Bulk Send tab fully audited: selection, filters, confirmation, legacy terminology, V2 alignment, themes, viewports.</done>
</task>

</tasks>

<verification>
- Both Send page tabs fully tested
- Legacy terminology scan is thorough (this is a known high-risk area)
- V2 alignment assessed for the entire Send page concept
- Both themes and viewports tested
</verification>

<success_criteria>
- 8 total screenshots (4 per tab) in `C:\AvisLoop\audit-screenshots\`
- All form interactions tested
- Legacy "contacts" language fully scanned and documented
- V2 alignment assessed: Send page should feel secondary, not primary
- Navigation position concern documented (Send is #2, should be lower)
- All findings documented with severity + fix suggestions
</success_criteria>

<output>
After completion, create `.planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-05-SUMMARY.md`

Include: Legacy terminology findings count, V2 alignment concerns, interaction test results, findings by severity.
</output>
