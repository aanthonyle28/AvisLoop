---
phase: 30-v2-alignment
plan: 07
status: complete
started: 2026-02-06
completed: 2026-02-06
---

# Plan 30-07 Summary: Onboarding Step 6 Conversion

## Objective
Convert onboarding step 6 from "Import Customers" to "Import Jobs" for V2 alignment.

## What Was Built

### Task 1: Update Onboarding Wizard Step Config
- Changed step 6 title from "Import Customers" to "Import Jobs" in `onboarding-wizard.tsx`
- Comment added: "V2: Import jobs, not customers"

### Task 2: Convert Customer Import Step to Job Import
- Rewrote `customer-import-step.tsx` to import jobs instead of customers
- New heading: "Import past jobs"
- New description: "Have existing job records? Import them to get started quickly. Customer records will be created automatically."
- Uses `bulkCreateJobsWithCustomers` from lib/actions/job.ts
- Uses CSV job validation schema
- Preview table shows Customer, Service Type, Status columns
- Results show jobs imported and customers created counts
- Skip text: "You can always import jobs later from the Jobs page"

## Commits
- `f51d7f3` - feat(30-07): convert onboarding step 6 from customer to job import

## Files Modified
- `components/onboarding/onboarding-wizard.tsx` - Step 6 title change
- `components/onboarding/steps/customer-import-step.tsx` - Full rewrite for job import

## V2 Alignment
Onboarding no longer encourages building a customer database first. Users import past jobs, and customers are created as a side effect - exactly as V2 philosophy states.
