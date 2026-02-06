---
phase: 30-v2-alignment
plan: 05
status: complete
completed_at: 2026-02-06
commit: 0aae355

artifacts_modified:
  - components/customers/customers-client.tsx
  - components/customers/empty-state.tsx

tech_added:
  - V2-aligned empty state with job-first messaging
  - Link to /jobs?action=add from empty state

key_decisions:
  - Removed Add Customer button from header entirely
  - Removed AddCustomerSheet import and state
  - CSV Import remains for migration use case
  - Empty state guides to Jobs page, not Add Customer
  - Description changed to reflect V2 automation
---

## Summary

Removed "Add Customer" CTAs from the Customers page and updated the empty state to reflect V2 philosophy. Customers are created as a side effect of jobs, not independently.

## What Was Built

### components/customers/empty-state.tsx

**V2-aligned empty state:**
- Icon: AddressBook (Phosphor) instead of Users (lucide)
- Title: "No customers yet"
- Description: "Customers appear here as you complete jobs. Ready to add your first job?"
- Primary CTA: "Add Your First Job" → links to /jobs?action=add
- Explanatory text: "When you complete a job, a customer record is automatically created and enrolled in your review campaign."

**Removed:**
- onAddCustomer prop
- onImportCSV prop
- "Add Customer" button
- "Import CSV" button

### components/customers/customers-client.tsx

**Removed V1 patterns:**
- `addSheetOpen` state
- `setAddSheetOpen` calls
- AddCustomerSheet import
- AddCustomerSheet component render
- Button with Plus icon for "Add Customer"

**Updated:**
- Description: "Customers are created automatically when you complete jobs"
- Empty state uses CustomersEmptyState component
- Header only shows CSV Import (when customers exist)
- Loading spinner migrated from Loader2 (lucide) to CircleNotch (Phosphor)

## V2 Philosophy Alignment

**Before (V1):**
> "Add your first customer to start sending review requests and building your reputation"
> [Add Customer] [Import CSV]

**After (V2):**
> "Customers appear here as you complete jobs. Ready to add your first job?"
> [Add Your First Job]
> "When you complete a job, a customer record is automatically created..."

## Key Patterns

```typescript
// Empty state now self-contained with Link
export function CustomersEmptyState() {
  return (
    <Link href="/jobs?action=add">
      <Button>
        <Briefcase className='mr-2 h-4 w-4' />
        Add Your First Job
      </Button>
    </Link>
  )
}
```

## Dependencies

- Uses: Plan 30-03 (Add Job sheet accepts ?action=add parameter implicitly)
- Affects: User onboarding flow, first-time experience

## Verification

- [x] TypeScript compiles without errors
- [x] No "Add Customer" button in header
- [x] Empty state says "Customers appear here as you complete jobs"
- [x] Empty state CTA goes to /jobs?action=add
- [x] CSV Import still available when customers exist
- [x] Phosphor icons used consistently
