---
phase: 53-data-function-refactor
plan: 02
subsystem: server-actions, pages
tags: [multi-tenancy, business-id, server-actions, server-components, getActiveBusiness]

# Dependency graph
requires:
  - phase: 53-data-function-refactor
    plan: 01
    provides: All lib/data/ functions accept explicit businessId as first parameter
provides:
  - All lib/actions/ functions use getActiveBusiness() instead of .eq('user_id', ...).single() business lookup
  - All page-level Server Components call getActiveBusiness() once and thread business.id to data functions
  - Zero inline supabase business queries remain in app/(dashboard)/
  - Onboarding page handles null business gracefully (new users with no business yet)
  - pnpm lint and pnpm typecheck pass with zero errors
affects: [Phase 54 switcher can now switch businesses without PGRST116 crashes]

# Tech tracking
tech-stack:
  added: []
  patterns: [getActiveBusiness-at-top, thread-businessId-down, promise-all-parallel-fetch]

key-files:
  created: []
  modified:
    - lib/actions/business.ts
    - lib/actions/customer.ts
    - lib/actions/job.ts
    - lib/actions/campaign.ts
    - lib/actions/dashboard.ts
    - lib/actions/billing.ts
    - lib/actions/send.ts
    - lib/actions/send-sms.action.ts
    - lib/actions/add-job-data.ts
    - lib/actions/add-job-campaigns.ts
    - lib/actions/bulk-resend.ts
    - lib/actions/checklist.ts
    - lib/actions/conflict-resolution.ts
    - lib/actions/message-template.ts
    - lib/actions/onboarding.ts
    - lib/actions/personalize.ts
    - lib/actions/schedule.ts
    - lib/actions/contact.ts
    - lib/actions/send-one-off-data.ts
    - app/(dashboard)/layout.tsx
    - app/(dashboard)/dashboard/page.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/campaigns/page.tsx
    - app/(dashboard)/campaigns/[id]/page.tsx
    - app/(dashboard)/campaigns/new/page.tsx
    - app/(dashboard)/customers/page.tsx
    - app/(dashboard)/analytics/page.tsx
    - app/(dashboard)/history/page.tsx
    - app/(dashboard)/feedback/page.tsx
    - app/(dashboard)/settings/page.tsx
    - app/(dashboard)/billing/page.tsx
    - app/onboarding/page.tsx
  deleted: []

key-decisions:
  - "updateBusiness in lib/actions/business.ts: getActiveBusiness() for updates, falls back to getUser() + INSERT for creation (first business)"
  - "Billing actions keep getUser() for user.email (Stripe metadata) but use getActiveBusiness() for business lookup"
  - "Onboarding page: getActiveBusiness() may return null for new users — handled with conditional getOnboardingStatus call"
  - "Pages needing full business with templates call getBusiness(business.id) from lib/data/ after getActiveBusiness()"
  - "getJobs return type no longer includes businessId — pages use business.id from getActiveBusiness() directly"
  - "retrySend, acknowledgeAlert, dismissFeedbackAlert in dashboard actions left unchanged — already safe (ownership check via sendLog.business_id)"

patterns-established:
  - "getActiveBusiness-first: Every server action and page calls getActiveBusiness() before any business-scoped operation"
  - "thread-businessId: Pages call getActiveBusiness() once, pass business.id to all data functions in Promise.all"
  - "null-guard-redirect: Pages redirect to /onboarding if getActiveBusiness() returns null"

# Metrics
duration: ~20min
completed: 2026-02-27
---

# Phase 53 Plan 02: Server Actions & Page Components Refactor Summary

**All server actions and page-level Server Components refactored to use getActiveBusiness() — zero dangerous .single() patterns remain anywhere in the app**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2
- **Files modified:** 32

## Accomplishments
- Refactored ~40 dangerous `.eq('user_id', ...).single()` instances across 19 `lib/actions/` files to use `getActiveBusiness()`
- Updated all 11 dashboard page Server Components + layout + onboarding page to thread `business.id` to data functions
- Fixed 2 additional pages missed by initial pass: `campaigns/new/page.tsx` and `app/onboarding/page.tsx`
- Verified zero dangerous patterns remain via grep across lib/data/, lib/actions/, and app/(dashboard)/
- Both `pnpm lint` and `pnpm typecheck` pass with zero errors

## Task Commits

1. **Task 1: Refactor all lib/actions/ files** - `f80d137` (feat)
2. **Task 2: Update page Server Components** - `f4062ac` (feat)

## Files Modified

### Server Actions (19 files)
- `lib/actions/business.ts` — updateBusiness, saveReviewLink, getBusiness, getEmailTemplates, updateServiceTypeSettings, updateReviewCooldown
- `lib/actions/customer.ts` — createCustomer, updateCustomer, getCustomers, bulkCreateCustomers
- `lib/actions/job.ts` — createJob, updateJob, deleteJob, markJobComplete
- `lib/actions/campaign.ts` — createCampaign, updateCampaign, toggleCampaignStatus, deleteCampaign, duplicatePreset
- `lib/actions/dashboard.ts` — getJobDetail, dismissJobFromQueue, markOneOffSent
- `lib/actions/billing.ts` — createCheckoutSession, createPortalSession
- `lib/actions/send.ts` — sendReviewRequest
- `lib/actions/send-sms.action.ts` — sendSmsReviewRequest
- `lib/actions/add-job-data.ts` — getAddJobData
- `lib/actions/add-job-campaigns.ts` — getAddJobCampaigns
- `lib/actions/bulk-resend.ts` — bulkResendMessages
- `lib/actions/checklist.ts` — completeChecklistItem, getChecklistState
- `lib/actions/conflict-resolution.ts` — resolveEnrollmentConflict
- `lib/actions/message-template.ts` — createTemplate, updateTemplate, deleteTemplate
- `lib/actions/onboarding.ts` — saveBusinessBasics, saveServices, saveCampaignPreset, saveSMSConsent
- `lib/actions/personalize.ts` — togglePersonalization
- `lib/actions/schedule.ts` — scheduleMessage
- `lib/actions/contact.ts` — legacy functions
- `lib/actions/send-one-off-data.ts` — getSendOneOffData

### Page Components (13 files)
- `app/(dashboard)/layout.tsx` — threads businessId to getServiceTypeSettings and getDashboardCounts
- `app/(dashboard)/dashboard/page.tsx` — threads to getJobCounts, getSetupProgress, getServiceTypeSettings
- `app/(dashboard)/jobs/page.tsx` — threads to getJobs (with simplified return type)
- `app/(dashboard)/campaigns/page.tsx` — threads to getCampaigns, getAvailableTemplates, getMonthlyUsage
- `app/(dashboard)/campaigns/[id]/page.tsx` — threads to getAvailableTemplates
- `app/(dashboard)/campaigns/new/page.tsx` — threads to getAvailableTemplates
- `app/(dashboard)/customers/page.tsx` — threads to getMonthlyUsage
- `app/(dashboard)/analytics/page.tsx` — uses getActiveBusiness instead of getBusiness
- `app/(dashboard)/history/page.tsx` — threads to getSendLogs
- `app/(dashboard)/feedback/page.tsx` — removes inline supabase query
- `app/(dashboard)/settings/page.tsx` — removes inline supabase query, threads to all data functions
- `app/(dashboard)/billing/page.tsx` — threads to getBusinessBillingInfo
- `app/onboarding/page.tsx` — handles null business for new users

## Verification Results

| Check | Result |
|-------|--------|
| `grep "eq('user_id'" lib/data/` (excl active-business) | Zero hits |
| `grep "eq('user_id'" lib/actions/` (excl safe files) | Zero hits |
| `grep "eq('user_id'" app/(dashboard)/` | Zero hits |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |

## Deviations from Plan
- Fixed `campaigns/new/page.tsx` and `app/onboarding/page.tsx` — not in the original file list but discovered via typecheck
- Onboarding page uses conditional pattern: `getActiveBusiness()` may return null for brand-new users, so `getOnboardingStatus` is only called when a business exists

## Issues Encountered
- Agent ran out of usage after committing Task 1 — Task 2 was completed in working tree but not committed. Orchestrator completed the commit after fixing the 2 remaining type errors.

---
*Phase: 53-data-function-refactor*
*Completed: 2026-02-27*
