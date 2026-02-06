---
phase: 30-v2-alignment
plan: 03
status: complete
completed_at: 2026-02-06
commit: 276d86e

artifacts_modified:
  - components/jobs/add-job-sheet.tsx
  - lib/actions/job.ts

tech_added:
  - Inline customer creation in Add Job flow
  - CustomerAutocomplete integration
  - 'create' mode for new customer entry

key_decisions:
  - CustomerAutocomplete replaces CustomerSelector
  - Default status is 'scheduled' (V2 workflow)
  - Customer can be selected OR created inline
  - Phone validation uses parseAndValidatePhone
---

## Summary

Redesigned the Add Job sheet to support V2's inline customer creation flow. Users can now create customers as a side effect of completing jobs, aligning with V2 philosophy.

## What Was Built

### components/jobs/add-job-sheet.tsx

**Mode-based customer selection:**
- `mode === 'search'`: CustomerAutocomplete for existing customers
- `mode === 'create'`: Inline form for new customer (name, email, phone)

**Features:**
- "Create new customer" option in autocomplete when no match
- "Or select existing customer" button to go back to search
- Phone field marked optional with SMS requirement note
- Default status changed to 'scheduled'
- JOB_STATUS_DESCRIPTIONS displayed for each status

### lib/actions/job.ts

**Extended createJob action:**
- Accepts customerName, customerEmail, customerPhone for inline creation
- Checks for existing customer by email before creating new
- Uses parseAndValidatePhone for phone validation
- Sets appropriate phone_status and sms_consent_status

## V2 Workflow

```
Add Job Sheet:
  ├── Mode: Search
  │   ├── Type to search existing customers
  │   ├── Select from matches
  │   └── "Create new" if no match → switches to Create mode
  │
  └── Mode: Create
      ├── Enter customer name (required)
      ├── Enter customer email (required)
      ├── Enter customer phone (optional)
      └── Customer created when job is submitted
```

## Key Patterns

```typescript
// Mode switching
const [mode, setMode] = useState<'search' | 'create'>('search')

// Customer creation via formData
if (!customerId && customerName && customerEmail) {
  // Check if exists by email first
  // Create new customer as side effect
  finalCustomerId = newCustomer.id
}
```

## Dependencies

- Uses: Plan 30-01 (CustomerAutocomplete)
- Used by: Plan 30-04 (Mark Complete button shows for scheduled jobs)

## Verification

- [x] TypeScript compiles without errors
- [x] Autocomplete integration works
- [x] "Create new" mode accessible
- [x] Default status is 'scheduled'
- [x] Customer created on job submission
