---
phase: QA-FIX-audit-remediation
plan: 05
type: execute
wave: 3
depends_on: ["QA-FIX-03"]
files_modified:
  - components/send/bulk-send-confirm-dialog.tsx
  - components/send/bulk-send-action-bar.tsx
  - components/send/bulk-send-columns.tsx
  - components/send/email-preview-modal.tsx
  - components/send/message-preview.tsx
  - components/send/bulk-send-tab.tsx
  - components/send/quick-send-tab.tsx
  - components/send/send-page-client.tsx
  - app/(dashboard)/send/page.tsx
  - lib/data/send-logs.ts
autonomous: true

must_haves:
  truths:
    - "Send page components use Customer type instead of Contact type"
    - "Function getResendReadyCustomers exists (renamed from getResendReadyContacts)"
    - "All imports reference Customer type from @/lib/types/customer"
  artifacts:
    - path: "components/send/bulk-send-tab.tsx"
      provides: "Bulk send tab with Customer type"
      contains: "import.*Customer.*from"
    - path: "lib/data/send-logs.ts"
      provides: "Send logs data functions with customer lookup"
      contains: "getResendReadyCustomers"
  key_links:
    - from: "components/send/*.tsx"
      to: "lib/types/customer"
      via: "type imports"
      pattern: "Customer"
---

<objective>
Rename Contact type usage to Customer in Send page components and rename getResendReadyContacts function to getResendReadyCustomers.

Purpose: Complete the Phase 20 rename migration in Send page code.
Output: All Send components use Customer type consistently.
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@docs/QA-AUDIT.md (code cleanup section)
@lib/types/customer.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update type imports in Send components</name>
  <files>
    - components/send/bulk-send-confirm-dialog.tsx
    - components/send/bulk-send-action-bar.tsx
    - components/send/bulk-send-columns.tsx
    - components/send/email-preview-modal.tsx
    - components/send/message-preview.tsx
    - components/send/send-page-client.tsx
  </files>
  <action>
Update all Contact type references to Customer in Send page components.

For each file, check for and update:
1. Import statements: `import { Contact }` -> `import { Customer }`
2. Type annotations: `Contact[]`, `Contact`, `selectedContacts` -> `Customer[]`, `Customer`, `selectedCustomers`
3. Variable names: `contact`, `contacts` -> `customer`, `customers` (where semantically appropriate)
4. Prop types: `contacts: Contact[]` -> `customers: Customer[]`
5. Function parameters: `(contact: Contact)` -> `(customer: Customer)`

Import should come from: `@/lib/types/customer` (or wherever Customer type is defined)

Note: Be careful to maintain functionality. The Customer type should have the same shape as the old Contact type (they were renamed in Phase 20).
  </action>
  <verify>
Run: `grep -n "Contact" components/send/bulk-send-confirm-dialog.tsx components/send/bulk-send-action-bar.tsx components/send/bulk-send-columns.tsx components/send/email-preview-modal.tsx components/send/message-preview.tsx components/send/send-page-client.tsx` should not return Contact type references.
Run: `grep -n "Customer" components/send/bulk-send-confirm-dialog.tsx` should find Customer type usage.
  </verify>
  <done>6 Send component files updated to use Customer type.</done>
</task>

<task type="auto">
  <name>Task 2: Update bulk-send-tab.tsx and quick-send-tab.tsx</name>
  <files>
    - components/send/bulk-send-tab.tsx
    - components/send/quick-send-tab.tsx
  </files>
  <action>
Update the main Send tab components to use Customer type.

For each file:
1. Update imports: `Contact` -> `Customer`
2. Update type annotations throughout
3. Update variable names where appropriate
4. Ensure consistent naming with child components

Also check for:
- Props passed to child components (should now be `customers` not `contacts`)
- State variable names
- Function parameters and return types

These files may have more extensive Contact references since they're the main container components.
  </action>
  <verify>
Run: `grep -n "Contact" components/send/bulk-send-tab.tsx components/send/quick-send-tab.tsx` should not return Contact type references.
Run: `pnpm typecheck` to ensure type consistency.
  </verify>
  <done>2 main Send tab files updated to use Customer type.</done>
</task>

<task type="auto">
  <name>Task 3: Rename getResendReadyContacts function</name>
  <files>lib/data/send-logs.ts</files>
  <action>
Rename the getResendReadyContacts function to getResendReadyCustomers.

Steps:
1. Find getResendReadyContacts in lib/data/send-logs.ts (this is where the function is defined)
2. Rename function to getResendReadyCustomers
3. Update any JSDoc or comments
4. Search for all callers of getResendReadyContacts and update them

Callers to update:
- app/(dashboard)/send/page.tsx (imports and calls the function on line 3 and 37)
- Any other files that import this function (verify with grep)

Use grep to find all usages:
`grep -r "getResendReadyContacts" app/ components/ lib/`
  </action>
  <verify>
Run: `grep -r "getResendReadyContacts" app/ components/ lib/` should return no results.
Run: `grep -r "getResendReadyCustomers" lib/data/send-logs.ts` should find the function definition.
Run: `pnpm typecheck` to ensure all callers are updated.
  </verify>
  <done>Function renamed and all callers updated.</done>
</task>

</tasks>

<verification>
1. `grep -r "Contact" components/send/*.tsx` returns no Contact type references
2. `grep -r "getResendReadyContacts" .` returns no results
3. All Send components import Customer type
4. `pnpm typecheck` passes with no errors
5. `pnpm lint` passes with no errors
6. Send page renders correctly (manual verification)
</verification>

<success_criteria>
- [ ] 6 Send component files updated to Customer type (Task 1)
- [ ] bulk-send-tab.tsx and quick-send-tab.tsx updated (Task 2)
- [ ] getResendReadyContacts renamed to getResendReadyCustomers (Task 3)
- [ ] All callers of renamed function updated
- [ ] No Contact type references in Send components
- [ ] TypeScript and lint pass
</success_criteria>

<output>
After completion, create `.planning/phases/QA-FIX-audit-remediation/QA-FIX-05-SUMMARY.md`
</output>
