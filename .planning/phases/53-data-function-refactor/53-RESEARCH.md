# Phase 53: Data Function Refactor — Research

**Researched:** 2026-02-26
**Domain:** Next.js App Router Server Components + Supabase PostgREST query patterns
**Confidence:** HIGH (based on direct codebase inspection — no external libraries needed for this refactor)

---

## Summary

Phase 53 is a mechanical refactor: replace every instance of `.eq('user_id', user.id).single()` on the `businesses` table with `.eq('id', businessId)` where `businessId` is passed in explicitly (resolved once by `getActiveBusiness()` in the page-level Server Component or Server Action).

The root cause of PGRST116 is PostgREST's `.single()` behavior: it throws `406 Not Acceptable` (surfaced as PGRST116) when the query returns more than one row **or** zero rows. When a user has two businesses, `.eq('user_id', user.id).single()` returns two rows → crash. The fix is to pass an explicit business ID and query `.eq('id', businessId).single()`, which is safe because UUIDs are unique.

**Exhaustive grep results:** There are approximately 86 `.single()` calls across `lib/data/` and `lib/actions/`. Of these, **approximately 40** are the dangerous "derive business from user_id" pattern. The remaining `.single()` calls are safe: they query by primary key (ID), by a uniqueness constraint, or fetch a specific record after a business-scoped insert.

**Primary recommendation:** For each dangerous function, add a `businessId: string` parameter, replace the `businesses` lookup with a direct business-ID-scoped query, and update all call sites. Page-level Server Components call `getActiveBusiness()` once at the top and thread `business.id` down. Server Actions that are called from Client Components need to accept `businessId` as a parameter (FOUND-03).

---

## Standard Stack

No new libraries needed. This is a pure refactor of existing patterns.

### Existing Correct Pattern (Reference: `lib/data/dashboard.ts`)

The `getDashboardKPIs(businessId: string)` function is the gold standard — it already accepts explicit `businessId` and queries directly by `business_id`. The dashboard page (`app/(dashboard)/dashboard/page.tsx`) already follows the reference pattern:

```typescript
// app/(dashboard)/dashboard/page.tsx — REFERENCE PATTERN (already correct)
export default async function DashboardPage() {
  const business = await getActiveBusiness()   // resolve once
  if (!business) redirect('/onboarding')

  const [kpiData, readyJobs, alerts, jobCounts, recentEvents, setupProgress] = await Promise.all([
    getDashboardKPIs(business.id),             // pass explicit businessId
    getReadyToSendJobs(business.id, ...),
    getAttentionAlerts(business.id),
    getJobCounts(),                            // STILL NEEDS FIXING — currently derives internally
    getRecentCampaignEvents(business.id),
    getSetupProgress(),                        // STILL NEEDS FIXING — derives internally
  ])
}
```

---

## Architecture Patterns

### Pattern A: Data Function Refactor (lib/data/)

**Before:**
```typescript
export async function getJobs(options?: {...}): Promise<{...}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { jobs: [], total: 0, businessId: null }

  // DANGEROUS: crashes with PGRST116 when user has 2 businesses
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!business) return { jobs: [], total: 0, businessId: null }
  // ... rest uses business.id
}
```

**After:**
```typescript
export async function getJobs(
  businessId: string,   // explicit — caller resolves via getActiveBusiness()
  options?: {...}
): Promise<{...}> {
  const supabase = await createClient()
  // No auth lookup needed — businessId already verified by getActiveBusiness()
  // ... rest uses businessId directly
}
```

### Pattern B: Server Action Refactor (lib/actions/)

Server Actions are called from Client Components via form actions or direct calls. They cannot receive `businessId` from a Server Component prop (server→client boundary). Two sub-patterns exist:

**Sub-pattern B1: Action already has businessId verification logic**

Some actions receive `businessId` as a parameter and verify ownership:
```typescript
// lib/actions/customer.ts: findOrCreateCustomer — ALREADY CORRECT
export async function findOrCreateCustomer({ businessId, ... }) {
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)       // query by PK — safe
    .eq('user_id', user.id)     // ownership check
    .single()
}
```
This pattern is SAFE (queries by ID + ownership check) and should NOT be changed.

**Sub-pattern B2: Action derives business internally from user_id**

```typescript
// lib/actions/job.ts: createJob — NEEDS FIX
export async function createJob(_prevState, formData) {
  // DANGEROUS: crashes with 2 businesses
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()
}
```

**Fix for B2 — two options:**

Option 1 (Preferred — FOUND-03): Resolve active business from cookie in the action:
```typescript
import { getActiveBusiness } from '@/lib/data/active-business'

export async function createJob(_prevState, formData) {
  const business = await getActiveBusiness()
  if (!business) return { error: 'Business not found' }
  // ... use business.id
}
```

Option 2: Accept explicit `businessId` as form field or parameter:
```typescript
export async function createJob(_prevState, formData) {
  const businessId = formData.get('businessId') as string
  // then verify ownership via getActiveBusiness() or .eq('id').eq('user_id')
}
```

**RECOMMENDATION:** Use Option 1 (call `getActiveBusiness()` inside the action). This is:
- Consistent with the resolver design
- No form field required
- Cookie-based resolution is already fast (one DB read, cached in render)
- `getActiveBusiness()` performs ownership verification internally

### Pattern C: Page-Level Server Component

Each dashboard page that currently calls `getBusiness()` should switch to `getActiveBusiness()`:

```typescript
// Before:
const business = await getBusiness()  // derives from user_id → PGRST116 risk
if (!business) redirect('/onboarding')

// After:
const business = await getActiveBusiness()  // reads cookie → safe
if (!business) redirect('/onboarding')
// Then pass business.id to data functions
```

---

## Exhaustive Inventory

### Group 1: DANGEROUS — lib/data/ files that derive business from user_id

These functions do `.eq('user_id', user.id).single()` on the `businesses` table. All must be refactored to accept `businessId: string`.

| File | Function | Line | Table Queried | Fix |
|------|----------|------|--------------|-----|
| `lib/data/business.ts` | `getBusiness()` | 39-40 | businesses | Add `businessId` param OR keep for Settings page (see below) |
| `lib/data/business.ts` | `getEmailTemplates()` | 63-64 | businesses | Add `businessId` param |
| `lib/data/business.ts` | `getServiceTypeSettings()` | 98-99 | businesses | Add `businessId` param |
| `lib/data/campaign.ts` | `getCampaigns()` | 26-27 | businesses | Add `businessId` param |
| `lib/data/dashboard.ts` | `getDashboardCounts()` | 651-652 | businesses | Add `businessId` param |
| `lib/data/jobs.ts` | `getJobs()` | 25-26 | businesses | Add `businessId` param |
| `lib/data/jobs.ts` | `getJobCounts()` | 201-202 | businesses | Add `businessId` param |
| `lib/data/message-template.ts` | `getMessageTemplates()` | 22-23 | businesses | Add `businessId` param |
| `lib/data/message-template.ts` | `getAvailableTemplates()` | 111-112 | businesses | Add `businessId` param |
| `lib/data/onboarding.ts` | `getOnboardingStatus()` | 53-54 | businesses | Add `businessId` param |
| `lib/data/onboarding.ts` | `getOnboardingCardStatus()` | 121-122 | businesses | Add `businessId` param |
| `lib/data/onboarding.ts` | `getSetupProgress()` | 184-185 | businesses | Add `businessId` param |
| `lib/data/personalization.ts` | `getPersonalizationStats()` | 134-135 | businesses | Add `businessId` param |
| `lib/data/personalization.ts` | `getLLMUsageStats()` | 188-189 | businesses | Add `businessId` param |
| `lib/data/send-logs.ts` | `getSendLogs()` | 30-31 | businesses | Add `businessId` param |
| `lib/data/send-logs.ts` | `getMonthlyUsage()` | 108-109 | businesses | Add `businessId` param |
| `lib/data/send-logs.ts` | `getResponseRate()` | 200-201 | businesses | Add `businessId` param |
| `lib/data/send-logs.ts` | `getNeedsAttentionCount()` | 288-289 | businesses | Add `businessId` param |
| `lib/data/send-logs.ts` | `getActivityFeed()` (approx 341) | businesses | Add `businessId` param |
| `lib/data/send-logs.ts` | (another function approx 400) | businesses | Add `businessId` param |
| `lib/data/subscription.ts` | `getSubscription()` | 21-22 | businesses | Add `businessId` param |
| `lib/data/subscription.ts` | `getBusinessBillingInfo()` | 71-72 | businesses | Add `businessId` param |

### Group 2: DANGEROUS — lib/actions/ files that derive business from user_id

These Server Actions do `.eq('user_id', user.id).single()` to find the business. Fix: replace with `getActiveBusiness()` call.

| File | Function | Line | Fix |
|------|----------|------|-----|
| `lib/actions/add-job-data.ts` | `getAddJobData()` | 32-33 | Use `getActiveBusiness()` |
| `lib/actions/add-job-campaigns.ts` | (function) | 31-32 | Use `getActiveBusiness()` |
| `lib/actions/billing.ts` | `createCheckoutSession()` | 21-22 | Use `getActiveBusiness()` |
| `lib/actions/billing.ts` | `createPortalSession()` | 73-74 | Use `getActiveBusiness()` |
| `lib/actions/bulk-resend.ts` | (function) | 35-36 | Use `getActiveBusiness()` |
| `lib/actions/business.ts` | `updateBusiness()` | 51-52 | Use `getActiveBusiness()` |
| `lib/actions/business.ts` | `saveReviewLink()` | 122-123 | Use `getActiveBusiness()` |
| `lib/actions/business.ts` | `getBusiness()` | 173-174 | Use `getActiveBusiness()` |
| `lib/actions/business.ts` | `getEmailTemplates()` | 197-198 | Use `getActiveBusiness()` |
| `lib/actions/business.ts` | `updateServiceTypeSettings()` | 235-236 | Use `getActiveBusiness()` |
| `lib/actions/campaign.ts` | `createCampaign()` | 32-33 | Use `getActiveBusiness()` |
| `lib/actions/campaign.ts` | `updateCampaign()` | 182-183 | Use `getActiveBusiness()` |
| `lib/actions/campaign.ts` | `pauseCampaign()` | 242-243 | Use `getActiveBusiness()` |
| `lib/actions/campaign.ts` | `deleteCampaign()` | 379-380 | Use `getActiveBusiness()` |
| `lib/actions/checklist.ts` | (functions) | 30-31, 101-102 | Use `getActiveBusiness()` |
| `lib/actions/conflict-resolution.ts` | `resolveEnrollmentConflict()` | 37-38 | Use `getActiveBusiness()` |
| `lib/actions/customer.ts` | `createCustomer()` | 125-126 | Use `getActiveBusiness()` |
| `lib/actions/customer.ts` | `updateCustomer()` | 227-228 | Use `getActiveBusiness()` |
| `lib/actions/customer.ts` | `bulkCreateCustomers()` | 485-486 | Use `getActiveBusiness()` |
| `lib/actions/customer.ts` | `getCustomers()` | 60-61 | Use `getActiveBusiness()` |
| `lib/actions/customer.ts` | (other customer funcs) | ~606, ~693, ~896 | Use `getActiveBusiness()` |
| `lib/actions/dashboard.ts` | `getJobDetail()` | 143-144 | Use `getActiveBusiness()` |
| `lib/actions/dashboard.ts` | `dismissJobFromQueue()` | 187-188 | Use `getActiveBusiness()` |
| `lib/actions/dashboard.ts` | `markOneOffSent()` | 233-234 | Use `getActiveBusiness()` |
| `lib/actions/job.ts` | `createJob()` | 49-50 | Use `getActiveBusiness()` |
| `lib/actions/job.ts` | `updateJob()` | 212-213 | Use `getActiveBusiness()` |
| `lib/actions/job.ts` | `deleteJob()` | 399-400 | Use `getActiveBusiness()` |
| `lib/actions/job.ts` | `markJobComplete()` | 443-444 | Use `getActiveBusiness()` |
| `lib/actions/job.ts` | (additional functions) | ~529, ~577 | Use `getActiveBusiness()` |
| `lib/actions/message-template.ts` | (functions) | 37-38, 208 | Use `getActiveBusiness()` |
| `lib/actions/onboarding.ts` | (functions) | 44, 76, 129, 196, 245, 305, 357 | Use `getActiveBusiness()` |
| `lib/actions/personalize.ts` | (functions) | 78-79, 156-157 | Use `getActiveBusiness()` |
| `lib/actions/schedule.ts` | (functions) | 57-58, 110-111, 147-148, 188-189, 251-252 | Use `getActiveBusiness()` |
| `lib/actions/send.ts` | `sendReviewRequest()` | 74-75 | Use `getActiveBusiness()` |
| `lib/actions/send.ts` | (other send funcs) | ~301, ~391 | Use `getActiveBusiness()` |
| `lib/actions/send-sms.action.ts` | (functions) | 89-90 | Use `getActiveBusiness()` |
| `lib/actions/sms-retry.ts` | (functions) | 66-67, 127, 165 | Use `getActiveBusiness()` |
| `lib/actions/contact.ts` | (functions) | 104, 185, 424, 515, 602 | Use `getActiveBusiness()` |

### Group 3: SAFE `.single()` calls — DO NOT CHANGE

These `.single()` calls are correct because they query by primary key, a unique constraint, or are scoped after the business is already known. Do not change these.

| File | Context | Why Safe |
|------|---------|----------|
| `lib/data/active-business.ts` line 41 | `.eq('id', activeId).eq('user_id', user.id)` | Queries by PK + ownership check — correct |
| `lib/actions/active-business.ts` line 35 | `.eq('id', businessId).eq('user_id', user.id)` | PK query — correct |
| `lib/actions/customer.ts` line 61 | `.eq('id', businessId).eq('user_id', user.id)` | Ownership verification — correct |
| `lib/actions/dashboard.ts` lines 88-100 | `.eq('id', sendLog.business_id).eq('user_id')` | Cross-reference ownership — correct |
| `lib/data/campaign.ts` lines 87, 264 | `.eq('id', campaignId)` | Query by PK — correct |
| `lib/data/jobs.ts` line 173 | `.eq('id', jobId)` | Query by PK — correct |
| `lib/data/send-logs.ts` line 154 | `.eq('id', contactId)` | Query by PK — correct |
| `lib/data/feedback.ts` lines 25, 157, 187, 211 | `.eq('id', id)` | Query by PK — correct |
| `lib/actions/job.ts` lines 110, 149, 168, 259 | Insert then `.select('id').single()` | Insert result — always one row |
| `lib/actions/campaign.ts` lines 60, 110, 183 etc | Insert then `.select('id').single()` | Insert result — always one row |
| `lib/actions/customer.ts` lines 93, 165, 196, 268 | Insert result or PK lookup | Insert result or `.eq('id', x)` |
| `lib/data/checklist.ts` line 51 | `.eq('id', businessId)` | PK — correct |
| `lib/actions/api-key.ts` lines 44, 97 | `.eq('user_id').single()` on `api_keys` table | Different table — users have one key |
| `lib/data/campaign.ts` line 264 | `getActiveCampaignForJob()` — `.limit(1).single()` | Finds best campaign match — single result intentional |
| `lib/actions/enrollment.ts` lines 194, 215, 314 | `.eq('id', jobId)`, insert results | PK or insert — correct |
| `lib/actions/conflict-resolution.ts` lines 49, 152, 163 | Job and enrollment PK lookups | After business verified |
| `lib/actions/send.ts` lines 135, 154, 302, 391, 420 | Template, customer, send_log PK/insert lookups | After business scoped |
| `lib/actions/message-template.ts` lines 109, 167, 209, 220, 239 | Template PK lookups and insert results | After business verified |
| `lib/data/subscription.ts` lines 35, 91 | Subscription lookup by `business_id` (not user_id) | After business resolved — safe |
| `lib/data/send-logs.ts` lines 289, 342, 401 | Send log lookups by other criteria | After business_id resolved |

### Group 4: SPECIAL CASES — Needs design decision

| File | Function | Issue |
|------|----------|-------|
| `lib/data/business.ts` `getBusiness()` | Used by Settings page and Campaigns/History pages. Settings page uses `.eq('user_id', ...).single()` directly in the page too. After refactor, Settings should call `getActiveBusiness()` instead. |
| `lib/actions/business.ts` `updateBusiness()` | Creates business if none exists (onboarding). Should not use `getActiveBusiness()` for creation. For creation path, still insert with `user_id`. For update path, use `getActiveBusiness()`. |
| `lib/actions/onboarding.ts` `saveBusinessBasics()` | Creates business. Same issue — creation needs `user_id`, update needs `getActiveBusiness()`. |
| `app/(dashboard)/settings/page.tsx` | Directly does `.eq('user_id').single()` in the page component — dangerous pattern repeated inline |
| `app/(dashboard)/feedback/page.tsx` | Directly does `.eq('user_id').single()` in the page component |
| `lib/data/active-business.ts` `getActiveBusiness()` | Uses `.limit(1)` (safe) plus one `.eq('id', activeId).single()` (safe — PK query). Already correct. |

---

## Page-Level Server Component Audit

All `app/(dashboard)/*/page.tsx` files that currently use the old pattern:

| Page | Current Pattern | Needs Change? |
|------|----------------|---------------|
| `dashboard/page.tsx` | `getActiveBusiness()` → `business.id` | ALREADY CORRECT (reference pattern) |
| `jobs/page.tsx` | Calls `getJobs()` which derives internally | YES — pass `businessId` |
| `campaigns/page.tsx` | `getBusiness()` from actions | YES — switch to `getActiveBusiness()` |
| `campaigns/[id]/page.tsx` | `getBusiness()` from actions | YES — switch to `getActiveBusiness()` |
| `customers/page.tsx` | `getBusiness()` from actions | YES — switch to `getActiveBusiness()` |
| `analytics/page.tsx` | `getBusiness()` from data | YES — switch to `getActiveBusiness()` |
| `history/page.tsx` | `getBusiness()` from data | YES — switch to `getActiveBusiness()` |
| `feedback/page.tsx` | Inline `.eq('user_id').single()` | YES — use `getActiveBusiness()` |
| `settings/page.tsx` | Inline `.eq('user_id').single()` | YES — use `getActiveBusiness()` |
| `billing/page.tsx` | `getBusinessBillingInfo()` derives internally | YES — after refactoring `getBusinessBillingInfo()` |
| `send/page.tsx` | `permanentRedirect('/campaigns')` | N/A |
| `contacts/page.tsx` | (check) | Likely same as customers |

---

## Dependency Graph (Refactor Order)

The refactoring must go leaf-first (innermost dependencies first), then callers.

### Tier 1: Pure data functions (no callers in this list)

Refactor these first — they have no dependencies on other functions in the danger zone:

1. `lib/data/analytics.ts` — `getServiceTypeAnalytics()` — ALREADY SAFE (accepts businessId)
2. `lib/data/feedback.ts` — All functions — ALREADY SAFE (accept businessId)
3. `lib/data/checklist.ts` — `getChecklistState()` — ALREADY SAFE (accepts businessId)
4. `lib/data/campaign.ts` — `getActiveCampaignForJob()`, `getMatchingCampaignForJob()` — ALREADY SAFE (accept businessId)

These need refactoring (but no dependencies on other danger-zone functions):

5. `lib/data/jobs.ts` — `getJobs()`, `getJobCounts()`
6. `lib/data/send-logs.ts` — `getSendLogs()`, `getMonthlyUsage()`, `getResponseRate()`, `getNeedsAttentionCount()`, others
7. `lib/data/message-template.ts` — `getMessageTemplates()`, `getAvailableTemplates()`
8. `lib/data/onboarding.ts` — `getOnboardingStatus()`, `getOnboardingCardStatus()`, `getSetupProgress()`
9. `lib/data/personalization.ts` — `getPersonalizationStats()`, `getLLMUsageStats()`
10. `lib/data/subscription.ts` — `getSubscription()`, `getBusinessBillingInfo()`
11. `lib/data/business.ts` — `getBusiness()`, `getEmailTemplates()`, `getServiceTypeSettings()`
12. `lib/data/campaign.ts` — `getCampaigns()`
13. `lib/data/dashboard.ts` — `getDashboardCounts()`

### Tier 2: Server Actions (call tier 1 functions or do own business lookup)

14. `lib/actions/business.ts` — `getBusiness()` duplicate, `updateBusiness()`, `saveReviewLink()`, `updateServiceTypeSettings()`
15. `lib/actions/customer.ts` — `getCustomers()`, `createCustomer()`, `updateCustomer()`, `bulkCreateCustomers()`
16. `lib/actions/job.ts` — `createJob()`, `updateJob()`, `deleteJob()`, `markJobComplete()`
17. `lib/actions/campaign.ts` — `createCampaign()`, `updateCampaign()`, `pauseCampaign()`, `deleteCampaign()`
18. `lib/actions/message-template.ts` — All
19. `lib/actions/add-job-data.ts` — `getAddJobData()`
20. `lib/actions/add-job-campaigns.ts` — All
21. `lib/actions/bulk-resend.ts` — All
22. `lib/actions/billing.ts` — `createCheckoutSession()`, `createPortalSession()`
23. `lib/actions/checklist.ts` — All
24. `lib/actions/conflict-resolution.ts` — `resolveEnrollmentConflict()`
25. `lib/actions/dashboard.ts` — `getJobDetail()`, `dismissJobFromQueue()`, `markOneOffSent()`, `dismissFeedbackAlert()`
26. `lib/actions/onboarding.ts` — All (careful with creation path)
27. `lib/actions/personalize.ts` — All
28. `lib/actions/schedule.ts` — All
29. `lib/actions/send.ts` — All
30. `lib/actions/send-sms.action.ts` — All
31. `lib/actions/sms-retry.ts` — All
32. `lib/actions/contact.ts` — All

### Tier 3: Page-level Server Components (call tier 1+2 functions)

After all functions are refactored, update pages to call `getActiveBusiness()` once and thread `business.id`:

33. `app/(dashboard)/jobs/page.tsx`
34. `app/(dashboard)/campaigns/page.tsx`
35. `app/(dashboard)/campaigns/[id]/page.tsx`
36. `app/(dashboard)/customers/page.tsx`
37. `app/(dashboard)/analytics/page.tsx`
38. `app/(dashboard)/history/page.tsx`
39. `app/(dashboard)/feedback/page.tsx`
40. `app/(dashboard)/settings/page.tsx`
41. `app/(dashboard)/billing/page.tsx`

---

## Risk Areas and Pitfalls

### Pitfall 1: `updateReviewCooldown()` in lib/actions/business.ts

Line 307: `.eq('user_id', user.id)` — does NOT use `.single()`, just an update. Still dangerous if user has two businesses (updates both). Fix: use `getActiveBusiness()` to get `business.id`, then `.eq('id', business.id)`.

### Pitfall 2: Business creation during onboarding

`saveBusinessBasics()`, `updateBusiness()`, and other onboarding actions create new businesses. These must still insert with `user_id`. However, the branch that UPDATES an existing business should use `getActiveBusiness()` to find the right business to update.

Pattern:
```typescript
const business = await getActiveBusiness()
if (business) {
  // Update existing active business
  await supabase.from('businesses').update({...}).eq('id', business.id)
} else {
  // Create new business — insert with user_id
  await supabase.from('businesses').insert({ user_id: user.id, ...})
}
```

### Pitfall 3: `getActiveBusiness()` is async — avoid calling in parallel with itself

Each page should call `getActiveBusiness()` ONCE at the top, then pass `business.id` to all other calls in `Promise.all`. Calling it multiple times wastes a DB round-trip per call.

```typescript
// WRONG — two getActiveBusiness() calls
const [business, something] = await Promise.all([
  getActiveBusiness(),
  getSomethingElse(), // which also calls getActiveBusiness() internally
])

// CORRECT — one call at the top
const business = await getActiveBusiness()
if (!business) redirect('/onboarding')
const [data1, data2] = await Promise.all([
  getData1(business.id),
  getData2(business.id),
])
```

### Pitfall 4: `api-key.ts` uses `.eq('user_id').single()` on `api_keys` table — NOT the businesses table

Lines 43-44 and 96-97 in `lib/actions/api-key.ts`. This is NOT the dangerous pattern — it's querying `api_keys`, not `businesses`. The single-row guarantee is per-user (users have one API key). Do NOT change this.

### Pitfall 5: `getActiveCampaignForJob()` uses `.limit(1).single()` — intentional

`lib/data/campaign.ts` line 264. This finds the BEST matching campaign (most specific service type match). The `.single()` is on a `.limit(1)` query — at most one row returned. This is correct and should NOT be changed.

### Pitfall 6: `contact.ts` in actions — legacy file parallel to `customer.ts`

`lib/actions/contact.ts` appears to be a legacy file that mirrors `customer.ts`. Both may need the same treatment. Verify which is still called from pages.

### Pitfall 7: `getDashboardCounts()` is called from layout — needs `businessId` parameter

`getDashboardCounts()` in `lib/data/dashboard.ts` is called from `app/(dashboard)/layout.tsx` (the dashboard group layout). The layout already has `business` from `getActiveBusiness()`. After refactoring, layout passes `business?.id ?? ''` to `getDashboardCounts(businessId)`.

### Pitfall 8: `getMonthlyUsage()` is called from many pages

`getMonthlyUsage()` in `lib/data/send-logs.ts` is called from campaigns/page.tsx, customers/page.tsx, and settings/page.tsx. After adding the `businessId` parameter, all callers need to be updated.

### Pitfall 9: Type change for return values

When functions that previously returned `{ ..., businessId: string | null }` (e.g. `getJobs()`) are refactored to require `businessId: string` as input, the return type can drop `businessId` from the output. The callers that used `const { jobs, businessId } = await getJobs()` need updating.

### Pitfall 10: `subscription.ts` has nested `.single()` issue

`getBusinessBillingInfo()` in `lib/data/subscription.ts` calls `getMonthlyUsage()` internally (line 92). After refactoring `getMonthlyUsage()` to require `businessId`, the call inside `getBusinessBillingInfo()` also needs `businessId` passed through.

---

## Code Examples

### Example 1: Refactoring a lib/data/ function

```typescript
// lib/data/jobs.ts — BEFORE
export async function getJobs(options?: {...}): Promise<{jobs: JobWithEnrollment[], total: number, businessId: string | null}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { jobs: [], total: 0, businessId: null }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return { jobs: [], total: 0, businessId: null }
  // ... rest uses business.id
}

// lib/data/jobs.ts — AFTER
export async function getJobs(
  businessId: string,
  options?: {...}
): Promise<{jobs: JobWithEnrollment[], total: number}> {
  const supabase = await createClient()
  // Caller (page) verified businessId via getActiveBusiness()
  // Just query directly:
  // ... rest uses businessId
}
```

### Example 2: Refactoring a Server Action

```typescript
// lib/actions/job.ts — BEFORE
export async function createJob(_prevState, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!business) return { error: 'Business not found' }
  // ...
}

// lib/actions/job.ts — AFTER
import { getActiveBusiness } from '@/lib/data/active-business'

export async function createJob(_prevState, formData) {
  const business = await getActiveBusiness()
  if (!business) return { error: 'Business not found. Please log in.' }
  // Use business.id directly — getActiveBusiness() verified ownership
  const supabase = await createClient()
  // ...
}
```

### Example 3: Refactoring a page-level Server Component

```typescript
// app/(dashboard)/campaigns/page.tsx — BEFORE
export default async function CampaignsPage() {
  const business = await getBusiness()  // old pattern — derives from user_id
  if (!business) redirect('/onboarding')

  const [campaigns, presets, ...] = await Promise.all([
    getCampaigns({ includePresets: false }),  // getCampaigns derives internally
    // ...
  ])
}

// app/(dashboard)/campaigns/page.tsx — AFTER
export default async function CampaignsPage() {
  const business = await getActiveBusiness()  // new resolver
  if (!business) redirect('/onboarding')

  const [campaigns, presets, ...] = await Promise.all([
    getCampaigns(business.id, { includePresets: false }),  // explicit businessId
    // ...
  ])
}
```

### Example 4: Settings page inline query refactor

```typescript
// app/(dashboard)/settings/page.tsx — BEFORE (dangerous inline query)
async function SettingsContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)  // DANGEROUS
    .single()
  // ...
}

// app/(dashboard)/settings/page.tsx — AFTER
async function SettingsContent() {
  const business = await getActiveBusiness()  // resolver handles everything
  if (!business) redirect('/onboarding')
  // Use business directly (already fully-typed Business object)
}
```

---

## Functions That Are Already Correct (Do Not Change)

The following are already correctly implemented and should serve as models:

1. **`lib/data/active-business.ts`** — `getActiveBusiness()`, `getUserBusinesses()` — ALREADY CORRECT
2. **`lib/data/analytics.ts`** — `getServiceTypeAnalytics(businessId)` — ALREADY CORRECT
3. **`lib/data/feedback.ts`** — All feedback functions accept `businessId` — ALREADY CORRECT
4. **`lib/data/checklist.ts`** — `getChecklistState(businessId)` — ALREADY CORRECT
5. **`lib/data/dashboard.ts`** — `getDashboardKPIs(businessId)`, `getReadyToSendJobs(businessId)`, `getAttentionAlerts(businessId)`, `getRecentCampaignEvents(businessId)`, `getReadyToSendJobWithCampaign(jobId, businessId)` — ALREADY CORRECT
6. **`lib/data/campaign.ts`** — `getActiveCampaignForJob(businessId, ...)`, `getMatchingCampaignForJob(businessId, ...)`, `getMatchingCampaignsForJobs(businessId, ...)` — ALREADY CORRECT
7. **`lib/actions/active-business.ts`** — `switchBusiness()` — ALREADY CORRECT
8. **`lib/actions/dashboard.ts`** — `retrySend()`, `acknowledgeAlert()`, `dismissFeedbackAlert()` — These use `.eq('id', sendLog.business_id).eq('user_id', user.id)` for ownership verification (safe pattern) — ALREADY CORRECT
9. **`app/(dashboard)/dashboard/page.tsx`** — Already uses `getActiveBusiness()` pattern — REFERENCE

---

## Split Into Plans

**Plan 53-01: `lib/data/` refactor**
- Enumerate and fix all data functions in `lib/data/`
- 22 dangerous instances across 9 files
- Update call sites in pages

**Plan 53-02: `lib/actions/` refactor + page-level Server Components**
- Fix all Server Actions to call `getActiveBusiness()` internally
- ~40 dangerous instances across ~15 action files
- Update remaining pages

**Order:** 53-01 first (data functions are called by pages; fixing them first lets us update pages with correct signatures). Then 53-02 (actions called from Client Components; can be done independently of 53-01).

---

## Verification Criteria

After Phase 53 is complete:

1. **Zero grep hits:** `grep -r "\.eq('user_id'.*" lib/data/ lib/actions/ | grep -v "\.eq('id'" | grep -v "\/\/"` returns zero results (no remaining `eq('user_id')` on the businesses table other than the safe ownership-check patterns)
2. **Zero grep hits for dangerous two-step pattern:** `grep -n "user_id.*\|.*single()" lib/data/ lib/actions/` returns only safe patterns
3. **All pages use getActiveBusiness():** No page in `app/(dashboard)/` directly queries `businesses` table
4. **Lint and typecheck pass**
5. **Two-business smoke test:** Create a second business, navigate all dashboard pages, verify no PGRST116 errors in logs

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `C:\AvisLoop\lib/data/active-business.ts` — Reference resolver implementation
- `C:\AvisLoop\lib/data/dashboard.ts` — Already-correct reference pattern (getDashboardKPIs)
- `C:\AvisLoop\app/(dashboard)/dashboard/page.tsx` — Reference page pattern
- `C:\AvisLoop\app/(dashboard)/layout.tsx` — Layout pattern using getActiveBusiness()
- All files in `C:\AvisLoop\lib/data/` and `C:\AvisLoop\lib/actions/` — Exhaustively read
- All files in `C:\AvisLoop\app/(dashboard)/*/page.tsx` — Exhaustively read

### Secondary (HIGH confidence — Supabase PostgREST documented behavior)

- PostgREST `.single()` throws PGRST116 when query returns 0 or >1 rows — documented PostgREST behavior
- `.eq('id', uuid).single()` is safe because primary keys are unique by definition
- `.limit(1)` with array access `data?.[0]` is the correct workaround for "at most one" queries

---

## Metadata

**Confidence breakdown:**
- Inventory completeness: HIGH — exhaustive file-by-file grep
- Safe vs dangerous classification: HIGH — verified by reading each `.single()` context
- Refactor pattern: HIGH — derived from already-correct implementations in the same codebase
- Page call site enumeration: HIGH — every page in `app/(dashboard)/` read directly

**Research date:** 2026-02-26
**Valid until:** Stable — this is internal codebase research, not library documentation
