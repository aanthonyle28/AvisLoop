---
phase: QA-FIX-audit-remediation
plan: 03
type: execute
wave: 2
depends_on: ["QA-FIX-02"]
files_modified:
  - components/customers/add-customer-sheet.tsx
  - components/customers/customer-table.tsx
  - components/customers/empty-state.tsx
  - components/customers/csv-import-dialog.tsx
  - components/history/history-client.tsx
  - components/history/empty-state.tsx
  - components/history/request-detail-drawer.tsx
  - lib/data/dashboard.ts
  - components/billing/usage-warning-banner.tsx
autonomous: true

must_haves:
  truths:
    - "No user-facing text says 'contact' or 'contacts' (replaced with customer/customers)"
    - "No user-facing text says 'review request' (replaced with message/follow-up)"
    - "All terminology consistent with V2 model"
  artifacts:
    - path: "components/customers/add-customer-sheet.tsx"
      provides: "Customer add sheet with correct terminology"
      contains: "Add New Customer"
    - path: "components/customers/customer-table.tsx"
      provides: "Customer table with correct terminology"
      contains: "No customers found"
    - path: "components/history/history-client.tsx"
      provides: "History page with correct terminology"
      contains: "Message sent"
  key_links: []
---

<objective>
Fix 47 user-facing terminology issues: replace "contact" with "customer" and "review request" with "message" or "follow-up".

Purpose: Align all user-facing text with V2 model terminology.
Output: Updated 9 files with correct terminology throughout.
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@docs/QA-AUDIT.md (terminology issues M06-01 through M07-14)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Customers page terminology (7 issues)</name>
  <files>
    - components/customers/add-customer-sheet.tsx
    - components/customers/customer-table.tsx
    - components/customers/empty-state.tsx
    - components/customers/csv-import-dialog.tsx
  </files>
  <action>
Fix the 7 user-facing "contact" terminology issues in customer components.

File: components/customers/add-customer-sheet.tsx
- Line 80: "Add New Contact" -> "Add New Customer"
- Line 53: "Contact added!" -> "Customer added!"

File: components/customers/customer-table.tsx
- Line 218: "No contacts found" -> "No customers found"
- Line 154: "contacts selected" -> "customers selected"

File: components/customers/empty-state.tsx
- Line 44: "No contacts found" -> "No customers found"
- Lines 5,9: `onAddContact` prop -> `onAddCustomer` prop (code-level, but visible in component API)

File: components/customers/csv-import-dialog.tsx
- Line 244: "Importing contacts..." -> "Importing customers..."

Use search and replace within each file. Be careful to only replace user-facing strings, not variable names or type references that were already migrated in Phase 20.
  </action>
  <verify>
Run: `grep -n "contact" components/customers/*.tsx` should not return user-facing strings.
Run: `grep -n "Customer added\|customers selected\|No customers found" components/customers/*.tsx` should find the replacements.
  </verify>
  <done>All 7 terminology issues fixed in customer components.</done>
</task>

<task type="auto">
  <name>Task 2: Fix History page terminology (8 issues)</name>
  <files>
    - components/history/history-client.tsx
    - components/history/empty-state.tsx
    - components/history/request-detail-drawer.tsx
  </files>
  <action>
Fix the 8 user-facing terminology issues in history components.

File: components/history/history-client.tsx
- Line 116: "all your review requests" -> "your message history"
- Line 75: "Review request sent" -> "Message sent"

File: components/history/empty-state.tsx
- Line 31: "first review request" -> "first message"
- Line 36: "Send Review Request" -> "Send Message"

File: components/history/request-detail-drawer.tsx
- Line 134: "this review request" -> "this message"
- Line 247: "receiving review requests" -> "receiving messages"
- Line 244: "This contact is on cooldown" -> "This customer is on cooldown"
- Line 247: "This contact has opted out" -> "This customer has opted out"

Note: The file is named "request-detail-drawer.tsx" which references the old terminology. Do NOT rename the file in this plan - only fix user-facing strings. File renaming would be a separate code cleanup task.
  </action>
  <verify>
Run: `grep -n "review request\|contact" components/history/*.tsx` and verify no user-facing strings remain.
Run: `grep -n "Message sent\|your message history" components/history/*.tsx` should find the replacements.
  </verify>
  <done>All 8 terminology issues fixed in history components.</done>
</task>

<task type="auto">
  <name>Task 3: Fix Dashboard and Billing terminology (2 issues)</name>
  <files>
    - lib/data/dashboard.ts
    - components/billing/usage-warning-banner.tsx
  </files>
  <action>
Fix the remaining 2 user-facing terminology issues.

File: lib/data/dashboard.ts
- Line 371: "Update contact" -> "Update customer"
  This is likely in a comment or error message. Find the exact location and update.

File: components/billing/usage-warning-banner.tsx
- Line 69: "review requests" -> "messages"
  This appears in a usage warning message.

Search for the exact strings and replace them.
  </action>
  <verify>
Run: `grep -n "contact\|review request" lib/data/dashboard.ts components/billing/usage-warning-banner.tsx` should not return user-facing strings.
  </verify>
  <done>All 2 remaining terminology issues fixed.</done>
</task>

</tasks>

<verification>
1. `grep -r "Add New Contact\|contacts selected\|No contacts found\|Importing contacts" components/customers/` returns no results
2. `grep -r "review request" components/history/` returns no user-facing results
3. `grep -r "This contact" components/history/` returns no results
4. `pnpm typecheck` passes with no errors
5. `pnpm lint` passes with no errors
</verification>

<success_criteria>
- [ ] 7 customer component terminology issues fixed
- [ ] 8 history component terminology issues fixed
- [ ] 2 dashboard/billing terminology issues fixed
- [ ] No user-facing "contact" strings remain in affected files
- [ ] No user-facing "review request" strings remain in affected files
- [ ] TypeScript and lint pass
</success_criteria>

<output>
After completion, create `.planning/phases/QA-FIX-audit-remediation/QA-FIX-03-SUMMARY.md`
</output>
