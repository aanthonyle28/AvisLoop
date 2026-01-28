---
phase: 06-billing-limits
plan: 01
subsystem: payments
tags: [stripe, billing, subscriptions, database]

# Dependency graph
requires:
  - phase: 04-core-sending
    provides: tier column on businesses for limit enforcement
provides:
  - Stripe SDK client for server-side API calls
  - subscriptions table with RLS
  - stripe_customer_id on businesses
  - Subscription TypeScript types
  - Trial tier default for new businesses
affects: [06-02-checkout, 06-03-webhooks, 06-04-portal, billing features]

# Tech tracking
tech-stack:
  added: [stripe, "@stripe/stripe-js"]
  patterns: [server-only Stripe client, env validation at module load]

key-files:
  created:
    - lib/stripe/client.ts
    - supabase/migrations/00007_add_billing.sql
  modified:
    - lib/types/database.ts
    - package.json

key-decisions:
  - "[06-01] Migration numbered 00007 (00006 already existed for monthly index)"
  - "[06-01] API version 2025-12-15.clover (latest stable in SDK)"
  - "[06-01] Throw error if STRIPE_SECRET_KEY missing at module load"

patterns-established:
  - "Server-only Stripe client: lib/stripe/client.ts with env validation"
  - "Subscription status type union covers all Stripe states"

# Metrics
duration: 4min
completed: 2026-01-27
---

# Phase 06 Plan 01: Billing Infrastructure Summary

**Stripe SDK with server-side client, subscriptions table with RLS, and trial tier default for new businesses**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-27T20:05:00Z
- **Completed:** 2026-01-27T20:09:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Installed Stripe SDK (stripe, @stripe/stripe-js)
- Created server-side Stripe client with environment validation
- Database migration fixes tier default from 'basic' to 'trial' (BILL-01)
- Created subscriptions table with RLS policy
- Added stripe_customer_id to businesses table
- TypeScript types for Subscription insert/update

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Stripe SDK and create client** - `6f8c89d` (feat)
2. **Task 2: Create billing database migration** - `1b20474` (feat)
3. **Task 3: Add Subscription types to database.ts** - `5cb11a9` (feat)

## Files Created/Modified
- `lib/stripe/client.ts` - Server-side Stripe singleton with env validation
- `supabase/migrations/00007_add_billing.sql` - Billing schema (subscriptions, stripe_customer_id)
- `lib/types/database.ts` - Added Subscription interface and stripe_customer_id to Business
- `package.json` - Added stripe and @stripe/stripe-js dependencies

## Decisions Made
- Migration numbered 00007 since 00006 already existed for monthly usage index
- Used API version 2025-12-15.clover (latest stable version in installed SDK)
- Client throws at module load if STRIPE_SECRET_KEY missing (fail fast in production)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration file number correction**
- **Found during:** Task 2 (Create billing database migration)
- **Issue:** Plan specified 00006_add_billing.sql but 00006 already exists for monthly count index
- **Fix:** Created migration as 00007_add_billing.sql instead
- **Files modified:** supabase/migrations/00007_add_billing.sql
- **Verification:** File created at correct path, no naming conflict
- **Committed in:** 1b20474 (Task 2 commit)

**2. [Rule 1 - Bug] API version update**
- **Found during:** Task 1 (Create Stripe client)
- **Issue:** Plan specified apiVersion '2024-11-20.acacia' but installed SDK requires '2025-12-15.clover'
- **Fix:** Updated apiVersion to match installed SDK
- **Files modified:** lib/stripe/client.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** 6f8c89d (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required

**External services require manual configuration.** Per plan frontmatter user_setup:

### Stripe Dashboard Configuration

1. **Create Stripe products:**
   - Basic plan product ($49/mo) - Stripe Dashboard > Products > Add product
   - Pro plan product ($99/mo) - Stripe Dashboard > Products > Add product

2. **Configure Customer Portal:**
   - Stripe Dashboard > Settings > Billing > Customer Portal

3. **Environment variables to add to .env.local:**
   ```
   STRIPE_SECRET_KEY=sk_test_...         # Developers > API keys > Secret key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Developers > API keys > Publishable key
   STRIPE_WEBHOOK_SECRET=whsec_...       # Developers > Webhooks > Signing secret (after endpoint created)
   STRIPE_BASIC_PRICE_ID=price_...       # Products > Basic Plan > Price ID
   STRIPE_PRO_PRICE_ID=price_...         # Products > Pro Plan > Price ID
   ```

### Database Migration

Run in Supabase SQL Editor:
```
supabase/migrations/00007_add_billing.sql
```

Verify after applying:
```sql
SELECT column_default FROM information_schema.columns
  WHERE table_name = 'businesses' AND column_name = 'tier';
-- Should return 'trial'
```

## Next Phase Readiness
- Stripe client ready for checkout, webhooks, and portal integration
- subscriptions table ready for storing Stripe subscription data
- stripe_customer_id column ready for customer linking
- Next plan (06-02) can implement checkout flow

---
*Phase: 06-billing-limits*
*Completed: 2026-01-27*
