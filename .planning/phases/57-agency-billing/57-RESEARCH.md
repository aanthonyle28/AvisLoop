# Phase 57: Agency Billing - Research

**Researched:** 2026-02-27
**Domain:** Multi-business billing enforcement + pooled usage query
**Confidence:** HIGH

---

## Summary

Phase 57 converts the billing system from per-business send counting to pooled (cross-business) send counting scoped to the user. Currently, each business tracks its own monthly sends independently — an agency owner with Business A and Business B can exhaust both quotas separately, effectively getting 2x (or Nx) the send allowance. This phase closes that loophole.

The implementation has two distinct pieces. First, the enforcement layer: every place that checks the monthly send count must be replaced with a user-scoped aggregate (sum of sends across ALL businesses the user owns). Second, the display layer: the Settings/Billing page must show the pooled total rather than the active-business total. No new schema changes are required — the query pattern joins `send_logs` through `businesses` to filter by `user_id`.

**Primary recommendation:** Add a new `getPooledMonthlyUsage(userId: string)` function in `lib/data/send-logs.ts`, update all enforcement call sites to use it, and update `getBusinessBillingInfo` in `lib/data/subscription.ts` to return pooled usage.

---

## Standard Stack

No new libraries needed. All work uses existing stack:

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | latest | DB queries | Already in use |
| Next.js Server Actions | latest | Enforcement in send paths | Already in use |

### No new installations required
This phase is purely a query pattern change. No packages to install.

---

## Architecture Patterns

### Current Architecture (to be changed)

The current per-business send counting pattern:

```typescript
// lib/data/send-logs.ts — current getMonthlyUsage
export async function getMonthlyUsage(businessId: string): Promise<{
  count: number
  limit: number
  tier: string
}> {
  // Fetches tier from the single business
  const { data: business } = await supabase
    .from('businesses')
    .select('tier')
    .eq('id', businessId)
    .single()

  // Counts sends for THIS business only — the bug
  const { count } = await supabase
    .from('send_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)  // ← single business only
    .eq('is_test', false)
    .gte('created_at', startOfMonth.toISOString())
    .in('status', ['sent', 'delivered', 'opened'])

  return { count: count || 0, limit: MONTHLY_SEND_LIMITS[business.tier], tier: business.tier }
}
```

### Recommended Architecture (Phase 57)

New pooled usage function that aggregates across all user-owned businesses:

```typescript
// lib/data/send-logs.ts — new getPooledMonthlyUsage
export async function getPooledMonthlyUsage(userId: string): Promise<{
  count: number
  limit: number
  tier: string
}> {
  const supabase = await createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Get tier from any of the user's businesses (they share the same tier)
  // Use the active business tier passed in from caller, or fetch from first business
  const { data: business } = await supabase
    .from('businesses')
    .select('tier')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!business) return { count: 0, limit: 0, tier: 'none' }

  // Aggregate sends across ALL businesses the user owns
  const { count } = await supabase
    .from('send_logs')
    .select('*, businesses!inner(user_id)', { count: 'exact', head: true })
    .eq('businesses.user_id', userId)
    .eq('is_test', false)
    .gte('created_at', startOfMonth.toISOString())
    .in('status', ['sent', 'delivered', 'opened'])

  return {
    count: count || 0,
    limit: MONTHLY_SEND_LIMITS[business.tier] || MONTHLY_SEND_LIMITS.basic,
    tier: business.tier,
  }
}
```

**IMPORTANT — Alternative query pattern (verified against schema):**

The Supabase JS client's foreign table filter syntax (`businesses!inner(user_id)`) with `.eq('businesses.user_id', userId)` may not work correctly for filtering on a JOIN in count queries. The verified-working alternative is a subquery approach:

```typescript
// Alternative: use .in() with a subquery list
// First get all business IDs for the user:
const { data: userBusinesses } = await supabase
  .from('businesses')
  .select('id')
  .eq('user_id', userId)

const businessIds = (userBusinesses ?? []).map(b => b.id)

if (businessIds.length === 0) return { count: 0, limit: 0, tier: 'none' }

// Then count sends across all those business IDs:
const { count } = await supabase
  .from('send_logs')
  .select('*', { count: 'exact', head: true })
  .in('business_id', businessIds)
  .eq('is_test', false)
  .gte('created_at', startOfMonth.toISOString())
  .in('status', ['sent', 'delivered', 'opened'])
```

The two-query approach (get business IDs, then count) is more readable and avoids JOIN filter ambiguity. It is also consistent with how the rest of the codebase handles cross-business queries (e.g., `getUserBusinesses()` → returns ID list, callers use `.in()`).

**Confidence: HIGH** — Verified against actual schema (`send_logs.business_id`, `businesses.user_id` both exist, correct types confirmed via `information_schema` query).

---

## Where Enforcement Is Applied (All Call Sites)

### 1. Direct email send — `lib/actions/send.ts`

**`sendReviewRequest()`** (line ~124):
```typescript
// Current:
const { count: monthlyCount } = await getMonthlyCount(supabase, business.id)

// Must change to:
const pooledUsage = await getPooledMonthlyUsage(user.id)
const monthlyLimit = MONTHLY_SEND_LIMITS[bizData.tier] || MONTHLY_SEND_LIMITS.basic
if (pooledUsage.count >= monthlyLimit) { ... }
```

**`batchSendReviewRequest()`** (line ~322):
Same pattern — replace `getMonthlyCount(supabase, business.id)` with `getPooledMonthlyUsage(user.id)`.

**`getMonthlyCount()`** (private helper at line ~228):
This private function will be superseded by `getPooledMonthlyUsage`. It can be deleted once all call sites are updated.

### 2. SMS send — `lib/actions/send-sms.action.ts`

Line ~142: `getMonthlyCount(supabase, business.id)` — same replacement.

### 3. Usage display — `lib/data/send-logs.ts`

`getMonthlyUsage(businessId)` — this is called from:
- `app/(dashboard)/campaigns/page.tsx` (line 27)
- `app/(dashboard)/customers/page.tsx` (line 22)
- `app/(dashboard)/settings/page.tsx` (line 49)
- `lib/actions/send-one-off-data.ts` (line 31)
- `lib/data/subscription.ts` (line 68) — used by billing page

For Phase 57, only the **billing page** needs pooled usage (BILL-02). The warning banners on campaigns/customers/settings can stay per-business or be updated — but the billing page MUST show pooled.

### 4. Billing page data — `lib/data/subscription.ts`

`getBusinessBillingInfo(businessId)` calls `getMonthlyUsage(businessId)`. This must be updated to call the pooled version for the billing page.

**The billing page currently passes `usage.count` and `usage.limit` to `<UsageDisplay>`** — those props just need to come from the pooled query instead.

---

## Key Architectural Issue: Tier Is Stored Per-Business

**This is the most important design decision for Phase 57.**

Currently:
- `tier` column lives on `businesses` table (per-business)
- Stripe webhook writes the tier to `businesses` using `metadata.business_id`
- When a user subscribes, only ONE business gets the tier upgrade

**The problem:** If a user has Business A (tier: `pro`) and Business B (tier: `trial`), which tier limits apply to pooled sends?

**Current state (confirmed from DB query):** No user currently has multiple businesses, so this edge case hasn't manifested yet.

**Phase 57's answer (from requirements):** The plan says "billing is tied to the USER, not the individual business." This means:

**Option 1 (Simpler — matches existing behavior):** Use the tier from the ACTIVE business when checking limits. Agency owners buy one subscription attached to their primary business; all businesses share that business's tier.

**Option 2 (Correct per requirements):** Use the BEST tier across all user's businesses. If any business is `pro`, the user has `pro` limits for all their businesses pooled.

**Recommendation: Option 2** — use `MAX(tier)` across all user businesses. The tier order is `trial < basic < pro`. This is what "billing is tied to the user" actually means. Since Stripe webhooks write tier to one business_id, and the user controls which business their Stripe customer is attached to, using the max tier across all businesses is both correct and resilient.

**SQL tier priority:**
```sql
-- Get the "best" tier for a user
SELECT
  CASE
    WHEN 'pro' = ANY(array_agg(tier)) THEN 'pro'
    WHEN 'basic' = ANY(array_agg(tier)) THEN 'basic'
    ELSE 'trial'
  END as effective_tier
FROM businesses
WHERE user_id = $1
```

Or in JS: fetch all businesses, map tiers, pick best:
```typescript
const TIER_PRIORITY = { trial: 0, basic: 1, pro: 2 }
const effectiveTier = userBusinesses.reduce((best, b) =>
  TIER_PRIORITY[b.tier] > TIER_PRIORITY[best] ? b.tier : best
, 'trial')
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User ID resolution in server actions | Manual `auth.getUser()` call | Pattern already in `sendReviewRequest` — user is fetched at top of each send action | User.id is already available in every send action |
| Cross-business aggregation | Complex PostgreSQL function or view | Simple `.in(businessIds)` after fetching user's business IDs | Two queries is simpler, testable, and maintainable |
| Tier precedence logic | Storing a separate "user tier" table | Derive effective tier from max across user's businesses | No new schema needed |

**Key insight:** The enforcement point already has `user.id` from `supabase.auth.getUser()` at the top of every send action. Getting business IDs for that user is a single extra query. Total added latency: one small SELECT on `businesses` (indexed on `user_id`).

---

## Common Pitfalls

### Pitfall 1: Updating Display Without Updating Enforcement

**What goes wrong:** Developer updates billing page to show pooled usage (BILL-02) but forgets to update the actual send enforcement in `send.ts` and `send-sms.action.ts` (BILL-01).

**Why it happens:** Two separate files, easy to miss one.

**How to avoid:** Treat enforcement first. Update `lib/data/send-logs.ts` with `getPooledMonthlyUsage`, then update all call sites. Run `grep -r "getMonthlyCount\|getMonthlyUsage" lib/actions/` to verify none remain after changes.

**Warning signs:** Billing page shows pooled count, but the paywall still triggers per-business (user can bypass by switching businesses).

### Pitfall 2: Breaking the Supabase Filter for Count Queries

**What goes wrong:** Using `businesses!inner(user_id)` join syntax in a `.select('*', { count: 'exact', head: true })` query — this syntax may not work as expected with the Supabase client's HEAD count requests when filtering on the related table.

**Why it happens:** Supabase JS has specific syntax requirements for related table filters that differ from regular selects.

**How to avoid:** Use the two-query approach: first `SELECT id FROM businesses WHERE user_id = X`, then `.in('business_id', ids)` on send_logs. This is unambiguous and follows the existing codebase pattern (RLS policies use this subquery pattern throughout).

**Warning signs:** Count returns all sends globally instead of just user's sends, or returns 0 unexpectedly.

### Pitfall 3: Forgetting the Cron Processor

**What goes wrong:** Direct sends are quota-checked via `getPooledMonthlyUsage`, but the cron campaign touch processor (`/api/cron/process-campaign-touches/route.ts`) does NOT currently check monthly limits at all.

**Why it happens:** The cron was written with a focus on campaign logic, not billing enforcement.

**Assessment for Phase 57:** The requirements (BILL-01, BILL-02) focus on enforcement against sends and billing page display. The cron is outside the stated scope. However, if "sending from Business A and Business B counts toward a single shared limit" is strictly tested by sending via campaigns (not just manual sends), the cron needs updating too.

**Recommendation:** Note this explicitly in the plan. Phase 57 scope is manual sends + billing display. Cron quota enforcement is a follow-up if needed.

### Pitfall 4: Tier Source Ambiguity With Multiple Businesses

**What goes wrong:** One business is on `pro`, another is on `trial`. The pooled limit calculation uses the wrong business's tier.

**Why it happens:** `getActiveBusiness()` returns ONE business — if it's the trial one, limits appear lower than they should be.

**How to avoid:** In `getPooledMonthlyUsage(userId)`, always derive effective tier from the user's BEST tier across all businesses (max tier), not from the active business. See the tier priority logic above.

### Pitfall 5: Calling getUser() vs using Passed userId

**What goes wrong:** Inside `getPooledMonthlyUsage`, calling `supabase.auth.getUser()` instead of accepting `userId` as a parameter. This breaks the established Phase 53 pattern where lib/data functions accept explicit parameters.

**How to avoid:** Follow the established pattern:
```typescript
// Correct — caller passes userId
export async function getPooledMonthlyUsage(userId: string): Promise<{...}>

// Wrong — function fetches user itself (creates hidden auth dependency)
export async function getPooledMonthlyUsage(): Promise<{...}> {
  const { data: { user } } = await supabase.auth.getUser()  // ← bad
}
```

The caller (send action) already has `user.id` from its own auth check. Pass it in explicitly.

---

## Code Examples

### New pooled usage function (recommended implementation)

```typescript
// Source: derived from existing getMonthlyUsage pattern + Phase 53 conventions
// lib/data/send-logs.ts

/**
 * Get pooled monthly send count across ALL businesses the user owns.
 * Used for billing enforcement (BILL-01) and billing page display (BILL-02).
 * Caller is responsible for providing a verified userId (from supabase.auth.getUser()).
 */
export async function getPooledMonthlyUsage(userId: string): Promise<{
  count: number
  limit: number
  tier: string
}> {
  const supabase = await createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Fetch all business IDs + tiers for this user
  const { data: userBusinesses } = await supabase
    .from('businesses')
    .select('id, tier')
    .eq('user_id', userId)

  if (!userBusinesses || userBusinesses.length === 0) {
    return { count: 0, limit: 0, tier: 'none' }
  }

  const businessIds = userBusinesses.map(b => b.id)

  // Derive effective tier: use best tier across all businesses
  const TIER_PRIORITY: Record<string, number> = { trial: 0, basic: 1, pro: 2 }
  const effectiveTier = userBusinesses.reduce((best, b) =>
    (TIER_PRIORITY[b.tier] ?? 0) > (TIER_PRIORITY[best] ?? 0) ? b.tier : best,
    'trial'
  )

  // Count sends across ALL user's businesses
  const { count } = await supabase
    .from('send_logs')
    .select('*', { count: 'exact', head: true })
    .in('business_id', businessIds)
    .eq('is_test', false)
    .gte('created_at', startOfMonth.toISOString())
    .in('status', ['sent', 'delivered', 'opened'])

  return {
    count: count || 0,
    limit: MONTHLY_SEND_LIMITS[effectiveTier] || MONTHLY_SEND_LIMITS.basic,
    tier: effectiveTier,
  }
}
```

### Enforcement update in send.ts

```typescript
// lib/actions/send.ts — updated sendReviewRequest (around line 122)
// BEFORE:
const monthlyLimit = MONTHLY_SEND_LIMITS[bizData.tier] || MONTHLY_SEND_LIMITS.basic
const { count: monthlyCount } = await getMonthlyCount(supabase, business.id)

// AFTER:
const pooledUsage = await getPooledMonthlyUsage(user.id)
if (pooledUsage.count >= pooledUsage.limit) {
  return {
    error: `Monthly send limit reached (${pooledUsage.limit}). Upgrade your plan for more sends.`
  }
}
```

### Billing page data update in subscription.ts

```typescript
// lib/data/subscription.ts — getBusinessBillingInfo updated
export async function getBusinessBillingInfo(businessId: string): Promise<{...}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { business: null, subscription: null, usage: { count: 0, limit: 0 }, contactCount: 0 }

  // ... existing business fetch ...

  // CHANGED: use pooled usage instead of per-business
  const [subscriptionResult, usageData, contactCountResult] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('business_id', businessId)
      .order('created_at', { ascending: false }).limit(1).single(),
    getPooledMonthlyUsage(user.id),  // ← pooled, not per-business
    supabase.from('customers').select('*', { count: 'exact', head: true })
      .eq('business_id', businessId).eq('status', 'active'),
  ])

  return {
    business: { id: business.id, tier: usageData.tier, stripe_customer_id: business.stripe_customer_id },
    subscription: subscriptionResult.data as Subscription | null,
    usage: { count: usageData.count, limit: usageData.limit },
    contactCount: contactCountResult.count ?? 0,
  }
}
```

### Billing page UI label update

```tsx
// components/billing/usage-display.tsx — label update for pooled clarity
// Change the label from:
<span className="text-muted-foreground">Sends this month</span>

// To:
<span className="text-muted-foreground">Sends this month (all businesses)</span>
```

---

## Implementation Scope Summary

### BILL-01: Enforcement (must update these files)

| File | Function | Change |
|------|----------|--------|
| `lib/data/send-logs.ts` | Add `getPooledMonthlyUsage(userId)` | New function |
| `lib/actions/send.ts` | `sendReviewRequest()` line ~124 | Replace `getMonthlyCount` |
| `lib/actions/send.ts` | `batchSendReviewRequest()` line ~322 | Replace `getMonthlyCount` |
| `lib/actions/send-sms.action.ts` | Line ~142 | Replace `getMonthlyCount` |
| `lib/actions/send.ts` | `getMonthlyCount()` private fn | Delete after all callers updated |

### BILL-02: Display (must update these files)

| File | Function | Change |
|------|----------|--------|
| `lib/data/subscription.ts` | `getBusinessBillingInfo()` | Call `getPooledMonthlyUsage(user.id)` |
| `components/billing/usage-display.tsx` | Label text | Add "(all businesses)" label |

### Out of Scope for Phase 57

- Cron campaign touch processor (`/api/cron/process-campaign-touches/route.ts`) — does not currently check monthly limits; leave unchanged
- `getMonthlyUsage()` on campaigns/customers/settings warning banners — those show per-business context and are not about billing enforcement; leave as-is
- Stripe subscription model changes — tier stays per-business; we derive effective tier at read time

---

## State of the Art

| Old Approach | Current Approach (Phase 57) | Impact |
|--------------|----------------------------|--------|
| Per-business send counting | Pooled across user's businesses | Closes agency circumvention loophole |
| `getMonthlyCount(supabase, business.id)` | `getPooledMonthlyUsage(user.id)` | Single source of truth for limits |
| Billing page shows per-business sends | Billing page shows total pooled sends | BILL-02 compliance |

---

## Open Questions

1. **Should `getMonthlyUsage(businessId)` be deprecated?**
   - What we know: It's called from campaigns/customers/settings pages for warning banners; those banners show per-business context appropriately
   - What's unclear: Whether those banners should also be pooled
   - Recommendation: Keep `getMonthlyUsage(businessId)` for those banners; only use `getPooledMonthlyUsage(userId)` for enforcement and billing page

2. **Cron processor quota enforcement**
   - What we know: Current cron does NOT check monthly limits at all (confirmed by code review)
   - What's unclear: Whether this was intentional or an oversight
   - Recommendation: Out of scope for Phase 57; document in plan as known gap

3. **What happens if user's businesses have mismatched tiers?**
   - What we know: Stripe webhook updates only the business in metadata (one business at a time)
   - What's unclear: Current behavior when user switches active business and the new business has a different tier
   - Recommendation: Use max-tier logic in `getPooledMonthlyUsage` to always give the user the best tier they've paid for

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `lib/data/send-logs.ts`, `lib/actions/send.ts`, `lib/actions/send-sms.action.ts`, `lib/data/subscription.ts`, `lib/constants/billing.ts` — all read directly
- Direct SQL verification: Ran aggregation queries against live Supabase DB to confirm schema and query patterns
- Migration files: `supabase/migrations/00007_add_billing.sql`, `00005_create_send_logs.sql` — confirmed tier constraint `CHECK (tier IN ('trial', 'basic', 'pro'))`

### Secondary (MEDIUM confidence)
- Phase 53 STATE.md decisions: "All lib/data/ functions accept `businessId: string` as first param" — influences whether userId or businessId should be the param
- Phase 52-01 decisions: `.limit(1)` pattern for zero-business-safe queries

### No external library research required
This phase uses only existing Supabase JS and Next.js patterns already present in the codebase. No new libraries. No external documentation consulted.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, existing patterns only
- Architecture: HIGH — confirmed via direct code + DB query verification
- Pitfalls: HIGH — derived from actual code structure and schema inspection
- Query pattern: HIGH — tested SQL aggregate against live DB

**Research date:** 2026-02-27
**Valid until:** Stable — billing logic rarely changes; valid until Phase 58+
