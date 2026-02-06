---
phase: QA-FIX-audit-remediation
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - components/layout/sidebar.tsx
  - app/(dashboard)/scheduled/page.tsx
  - components/scheduled/bulk-action-bar.tsx
  - components/scheduled/cancel-button.tsx
  - components/scheduled/cancel-dialog.tsx
  - components/scheduled/expanded-details.tsx
  - components/scheduled/reschedule-dialog.tsx
  - components/scheduled/scheduled-table.tsx
  - lib/data/scheduled.ts
  - components/contacts/add-contact-sheet.tsx
  - components/contacts/contact-columns.tsx
  - components/contacts/contact-detail-drawer.tsx
  - components/contacts/contact-filters.tsx
  - components/contacts/contact-table.tsx
  - components/contacts/contacts-client.tsx
  - components/contacts/csv-import-dialog.tsx
  - components/contacts/csv-preview-table.tsx
  - components/contacts/edit-contact-sheet.tsx
  - components/contacts/empty-state.tsx
autonomous: true

must_haves:
  truths:
    - "Sidebar navigation shows Jobs and Campaigns prominently (positions 2-3)"
    - "Send is moved to secondary position (position 6)"
    - "/scheduled route no longer exists"
    - "/components/contacts/ folder no longer exists"
  artifacts:
    - path: "components/layout/sidebar.tsx"
      provides: "V2-aligned navigation order"
      contains: "Jobs.*Campaigns.*Customers.*Analytics.*Send"
  key_links:
    - from: "components/layout/sidebar.tsx"
      to: "mainNav array"
      via: "V2 priority order"
      pattern: "Briefcase.*Megaphone.*AddressBook.*ChartBar.*PaperPlaneTilt"
---

<objective>
Reorder sidebar navigation for V2 alignment, remove orphaned /scheduled route, and delete legacy /components/contacts/ folder.

Purpose: Align navigation with V2 workflow (Jobs -> Campaigns primary) and remove dead code.
Output: Updated sidebar, deleted orphaned routes and legacy folders.
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@docs/QA-AUDIT.md
@components/layout/sidebar.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reorder sidebar navigation for V2 alignment</name>
  <files>components/layout/sidebar.tsx</files>
  <action>
Update the mainNav array in sidebar.tsx to reflect V2 workflow priority.

Current order (lines 33-42):
1. Dashboard
2. Send (too prominent)
3. Customers
4. Jobs
5. Campaigns
6. Activity
7. Feedback
8. Analytics

V2-aligned order:
1. Dashboard - command center
2. Jobs - where work is logged (V2 primary entry)
3. Campaigns - where automation runs (V2 automation)
4. Analytics - where outcomes are measured
5. Customers - supporting data
6. Send - manual override (secondary action)
7. Activity - audit trail
8. Feedback - response workflow

Update the mainNav array:
```typescript
const mainNav: NavItem[] = [
  { icon: House, label: 'Dashboard', href: '/dashboard' },
  { icon: Briefcase, label: 'Jobs', href: '/jobs' },
  { icon: Megaphone, label: 'Campaigns', href: '/campaigns' },
  { icon: ChartBar, label: 'Analytics', href: '/analytics' },
  { icon: AddressBook, label: 'Customers', href: '/customers' },
  { icon: PaperPlaneTilt, label: 'Send', href: '/send' },
  { icon: ClockCounterClockwise, label: 'Activity', href: '/history' },
  { icon: ChatCircleText, label: 'Feedback', href: '/feedback' },
]
```

This emphasizes the V2 workflow: log job -> campaign auto-sends -> check analytics.
Send becomes a secondary manual action, not the primary workflow.
  </action>
  <verify>
Read components/layout/sidebar.tsx and verify mainNav array order starts with Dashboard, Jobs, Campaigns.
Run `pnpm typecheck` to ensure no TypeScript errors.
  </verify>
  <done>mainNav array reordered with Jobs and Campaigns at positions 2-3, Send at position 6.</done>
</task>

<task type="auto">
  <name>Task 2: Delete orphaned /scheduled route and components</name>
  <files>
    - app/(dashboard)/scheduled/page.tsx (delete)
    - components/scheduled/bulk-action-bar.tsx (delete)
    - components/scheduled/cancel-button.tsx (delete)
    - components/scheduled/cancel-dialog.tsx (delete)
    - components/scheduled/expanded-details.tsx (delete)
    - components/scheduled/reschedule-dialog.tsx (delete)
    - components/scheduled/scheduled-table.tsx (delete)
    - lib/data/scheduled.ts (delete)
  </files>
  <action>
Delete the orphaned /scheduled route and all related files. This is a V1 feature made obsolete by V2 campaigns.

Files to delete:
1. app/(dashboard)/scheduled/page.tsx - Route page
2. components/scheduled/ - Entire folder (6 files)
3. lib/data/scheduled.ts - Data functions

Steps:
1. Delete app/(dashboard)/scheduled/ directory
2. Delete components/scheduled/ directory
3. Delete lib/data/scheduled.ts file

Note: The /scheduled route is not linked from any navigation. It was a V1 feature for manual scheduling that is superseded by V2 campaigns.

Verify no imports reference these files:
- grep for "from '@/components/scheduled" in app/ and components/
- grep for "from '@/lib/data/scheduled" in app/ and components/
  </action>
  <verify>
Run: `ls app/(dashboard)/scheduled 2>/dev/null || echo "Directory deleted"`
Run: `ls components/scheduled 2>/dev/null || echo "Directory deleted"`
Run: `ls lib/data/scheduled.ts 2>/dev/null || echo "File deleted"`
Run: `pnpm typecheck` to ensure no broken imports.
  </verify>
  <done>All /scheduled route files and components deleted, no broken imports.</done>
</task>

<task type="auto">
  <name>Task 3: Delete legacy /components/contacts/ folder</name>
  <files>
    - components/contacts/add-contact-sheet.tsx (delete)
    - components/contacts/contact-columns.tsx (delete)
    - components/contacts/contact-detail-drawer.tsx (delete)
    - components/contacts/contact-filters.tsx (delete)
    - components/contacts/contact-table.tsx (delete)
    - components/contacts/contacts-client.tsx (delete)
    - components/contacts/csv-import-dialog.tsx (delete)
    - components/contacts/csv-preview-table.tsx (delete)
    - components/contacts/edit-contact-sheet.tsx (delete)
    - components/contacts/empty-state.tsx (delete)
  </files>
  <action>
Delete the legacy /components/contacts/ folder. This is a duplicate of /components/customers/ from before the Phase 20 rename.

Files to delete (10 files total):
1. components/contacts/add-contact-sheet.tsx
2. components/contacts/contact-columns.tsx
3. components/contacts/contact-detail-drawer.tsx
4. components/contacts/contact-filters.tsx
5. components/contacts/contact-table.tsx
6. components/contacts/contacts-client.tsx
7. components/contacts/csv-import-dialog.tsx
8. components/contacts/csv-preview-table.tsx
9. components/contacts/edit-contact-sheet.tsx
10. components/contacts/empty-state.tsx

Steps:
1. Verify no imports reference these files (already confirmed - only .planning/ docs reference them)
2. Delete components/contacts/ directory

Note: These files are duplicates of the /components/customers/ folder. The customers/ folder is the active, maintained version.
  </action>
  <verify>
Run: `ls components/contacts 2>/dev/null || echo "Directory deleted"`
Run: `grep -r "from '@/components/contacts" app/ components/ lib/` should return no results.
Run: `pnpm typecheck` to ensure no broken imports.
  </verify>
  <done>Legacy /components/contacts/ folder deleted, no broken imports.</done>
</task>

</tasks>

<verification>
1. Sidebar shows V2-aligned order: Dashboard, Jobs, Campaigns, Analytics, Customers, Send, Activity, Feedback
2. /scheduled route no longer accessible (404)
3. /components/contacts/ folder no longer exists
4. `pnpm typecheck` passes with no errors
5. `pnpm lint` passes with no errors
</verification>

<success_criteria>
- [ ] mainNav array in sidebar.tsx reordered for V2 workflow
- [ ] Jobs and Campaigns at positions 2-3, Send at position 6
- [ ] app/(dashboard)/scheduled/ directory deleted
- [ ] components/scheduled/ directory deleted
- [ ] lib/data/scheduled.ts file deleted
- [ ] components/contacts/ directory deleted (10 files)
- [ ] No broken imports (typecheck passes)
- [ ] No lint errors
</success_criteria>

<output>
After completion, create `.planning/phases/QA-FIX-audit-remediation/QA-FIX-02-SUMMARY.md`
</output>
