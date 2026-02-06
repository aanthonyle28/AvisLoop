---
phase: 30-v2-alignment
plan: 06
status: complete
started: 2026-02-06
completed: 2026-02-06
---

# Plan 30-06 Summary: CSV Job Import Dialog

## Objective
Replace CSV customer import with CSV job import that creates customers as side effect.

## What Was Built

### Task 1: CSV Job Validation Schema
- Added `csvJobRowSchema` to `lib/validations/job.ts`
- Schema validates: customerName, customerEmail, customerPhone, serviceType, completionDate, notes
- Added `JOB_CSV_HEADER_MAPPINGS` for flexible header matching (supports multiple common variations)

### Task 2: Bulk Create Jobs Action
- Added `bulkCreateJobsWithCustomers()` to `lib/actions/job.ts`
- Deduplicates customers by email (links to existing, creates new if needed)
- Creates jobs with 'completed' status (historical import)
- Campaign enrollment deliberately SKIPPED for bulk historical imports
- Returns counts: jobsCreated, customersCreated, customersLinked, skipped

### Task 3: CSV Job Import Dialog Component
- Created `components/jobs/csv-job-import-dialog.tsx`
- Four-step wizard: upload -> preview -> importing -> complete
- Uses Papa.parse for CSV parsing, react-dropzone for file upload
- Shows validation preview with valid/invalid row counts
- Displays detailed results (jobs created, customers linked, etc.)

## Commits
- `7e431b0` - feat(30-06): add CSV job import dialog with customer creation

## Files Modified
- `lib/validations/job.ts` - Added CSV job schema and header mappings
- `lib/actions/job.ts` - Added bulkCreateJobsWithCustomers action
- `components/jobs/csv-job-import-dialog.tsx` - New import dialog component

## V2 Alignment
Jobs are the primary import object. Customers are created as a side effect of importing job records.
