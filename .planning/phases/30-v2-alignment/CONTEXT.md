# Phase 30: V2 Alignment & Audit Remediation

**Created:** 2026-02-06
**Status:** Planning

## Phase Goal

Complete the transformation to V2 philosophy where jobs are the primary object and customers are created as a side effect. Fix all remaining issues from UX and QA audits.

## V2 Mental Model

```
V1 (Current):
  Add Customer → Add Job → Campaign triggers

V2 (Target):
  Add Job (with customer info) → Customer created/linked → Campaign triggers
```

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Customer creation | Inline in Add Job form | Jobs are primary, customers are side effect |
| Existing customer selection | Smart autocomplete (type name, suggests matches) | Seamless UX for new and repeat customers |
| "Add Customer" button | Remove entirely | No job = nothing to do with the customer |
| Customers page | Keep for viewing/editing | Still need to see customer details, job history |
| CSV import | Import JOBS (not customers) | V2 aligned - jobs with customer info per row |
| Onboarding Step 6 | Convert from customer import to job import | Consistent with V2 model |
| Job status workflow | 3 states: scheduled → completed → do_not_send | Supports dispatch workflow (create before work, complete after) |
| Add Job default status | Default to "scheduled" | Most jobs created before work is done |
| Mark Complete action | One-click button in table + mobile one-tap | Fast completion triggers campaign enrollment |
| Icon migration | Full 27 files | Complete Phosphor consistency |
| Accessibility | Touch targets + aria-labels + skip link | WCAG compliance |

## CSV Job Import Format

```csv
customer_name, email, phone, service_type, completion_date, notes
Sarah Chen, sarah@email.com, 555-1234, hvac, 2024-01-15, AC repair
Mike Torres, mike@email.com, 555-5678, plumbing, 2024-01-14, Water heater
```

System behavior:
- Match existing customer by email (primary) or phone (secondary)
- Create new customer if no match
- Create job record with completed status
- Enroll in matching campaign (if exists)

## Source Documents

- `.planning/V1-TO-V2-PHILOSOPHY.md` - Core philosophy shift
- `.planning/UX-AUDIT.md` - UX findings and V2 alignment score
- `.planning/QA-AUDIT.md` - QA findings and remediation status

## Job Lifecycle (V2 Dispatch Workflow)

```
OFFICE (morning)                    TECHNICIAN (afternoon)
┌─────────────────────┐             ┌─────────────────────┐
│ Create job          │             │ Finish work         │
│ • Customer info     │             │ • Customer happy    │
│ • Service type      │             │ • Tap "Complete"    │
│ • Status: scheduled │             │                     │
└─────────────────────┘             └─────────────────────┘
         │                                    │
         │                                    ▼
         │                          ┌─────────────────────┐
         │                          │ System auto-enrolls │
         │                          │ in matching campaign│
         └─────────────────────────►└─────────────────────┘
              Customer created
              when job created
```

### Job Statuses

| Status | Meaning | Campaign Enrollment |
|--------|---------|---------------------|
| `scheduled` | Job created, work not yet done | No — waiting for completion |
| `completed` | Work finished, customer satisfied | Yes — auto-enroll |
| `do_not_send` | Don't request review (bad experience) | No — explicitly blocked |

**Key insight:** "Mark Complete" is the ONE trigger for campaign enrollment.

## Requirements Summary

### V2 Core Flow (12 requirements)
- Inline customer creation in Add Job with smart autocomplete
- Remove all "Add Customer" CTAs
- CSV job import (replaces customer import)
- Add Job as primary CTA (button variant + mobile FAB)
- Update empty states for V2 messaging
- Three-state job workflow (scheduled → completed → do_not_send)
- Add Job defaults to "scheduled" status
- "Mark Complete" button in Job Table for scheduled jobs
- Mobile one-tap complete from job list

### Icon Consistency (1 requirement)
- Migrate 27 lucide-react files to Phosphor

### Accessibility (4 requirements)
- Touch targets 44px minimum
- Aria-labels for icon buttons
- Skip link in root layout
- Checkbox/input sizing fixes

### Empty States & Copy (3 requirements)
- Customers page V2 copy
- History page guidance CTA
- Feedback page guidance copy
