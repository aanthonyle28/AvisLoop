# Technology Stack: v3.0 Agency Mode

**Project:** AvisLoop v3.0 — Multi-Business Agency Mode
**Researched:** 2026-02-26
**Milestone Type:** Subsequent — adding multi-business management to existing Next.js + Supabase app
**Confidence:** HIGH (based on direct codebase inspection)

---

## Executive Summary

**Zero new npm dependencies needed.** Agency mode is purely a data architecture and UI composition change using existing stack components.

---

## Existing Stack (Validated — Do Not Change)

| Technology | Version | Role |
|------------|---------|------|
| Next.js | 15 (App Router) | Framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.1 | Utility classes |
| Supabase | latest | Database + auth |
| @radix-ui/react-dropdown-menu | ^2.1.14 | Already installed — use for business switcher |
| @radix-ui/react-dialog | ^1.1.15 | Already installed — use for detail drawer |
| @phosphor-icons/react | ^2.1.10 | Icons |
| next/headers cookies() | built-in | Cookie-based business context |

---

## Area 1: Business Context Switching

### Recommendation: Cookie-based via `cookies()` from `next/headers`

**Why cookies over URL segments:**
- No route restructuring needed
- Works with existing middleware
- Persists across navigation
- Simple for 2-5 client scale

**Implementation:**
- `active_business_id` httpOnly cookie set via server action
- `revalidatePath('/', 'layout')` refreshes all pages
- `cookies()` reads in Server Components
- Fallback: first business if no cookie set

**No new dependency needed.** `next/headers` is built into Next.js.

---

## Area 2: Business Switcher UI

### Recommendation: Use existing `@radix-ui/react-dropdown-menu`

The sidebar already imports DropdownMenu for the account menu. The business switcher uses the same component pattern — a trigger button showing current business name with a dropdown list of all businesses.

**No new dependency needed.**

---

## Area 3: Clients Page Card Grid

### Recommendation: Use existing Card component + Sheet for detail drawer

The codebase already has:
- `components/ui/card.tsx` with InteractiveCard variant
- `components/ui/sheet.tsx` for drawers
- Card grid patterns (used on campaigns page, dashboard KPIs)

**No new dependency needed.**

---

## Area 4: Database Schema Changes

### Recommendation: Supabase migration — add columns to `businesses` table

10 new columns for agency metadata. All nullable (existing businesses won't have this data).

```sql
ALTER TABLE businesses ADD COLUMN google_rating_start DECIMAL(2,1);
ALTER TABLE businesses ADD COLUMN google_review_count_start INT;
ALTER TABLE businesses ADD COLUMN google_rating_current DECIMAL(2,1);
ALTER TABLE businesses ADD COLUMN google_review_count_current INT;
ALTER TABLE businesses ADD COLUMN monthly_fee DECIMAL(10,2);
ALTER TABLE businesses ADD COLUMN start_date DATE;
ALTER TABLE businesses ADD COLUMN gbp_access BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN competitor_name TEXT;
ALTER TABLE businesses ADD COLUMN competitor_review_count INT;
ALTER TABLE businesses ADD COLUMN agency_notes TEXT;
```

**No separate `agency_clients` table needed.** The businesses table already has all the relational hooks (user_id FK, RLS policies). Agency metadata is just additional columns.

**`reviews_gained` is computed:** `google_review_count_current - google_review_count_start`. Not stored.

---

## Area 5: Data Function Refactoring

### The `.single()` Problem

~86 instances of `.eq('user_id', user.id).single()` across 20+ files. With multiple businesses, `.single()` throws `PGRST116` (multiple rows returned).

**Fix pattern:**
```typescript
// Before (breaks with 2+ businesses)
const { data: business } = await supabase
  .from('businesses')
  .select('*')
  .eq('user_id', user.id)
  .single()

// After (works with any number of businesses)
const business = await getActiveBusiness() // reads cookie, returns specific business
```

**No new dependency needed.** This is a mechanical refactor using existing Supabase client APIs.

---

## Area 6: Onboarding for Additional Businesses

### The upsert danger

`saveBusinessBasics()` uses `.upsert()` keyed on `user_id`. Creating a second business would OVERWRITE the first.

**Fix:** Separate insert path for additional businesses (no upsert). Use standard `.insert()`.

**No new dependency needed.**

---

## Area 7: Billing — Pooled Usage

### Current billing
One Stripe customer per user. Usage tracked per business.

### Agency billing
Pool usage limits across all businesses. Sum sends across all businesses vs plan limit.

**No new dependency needed.** Stripe integration already exists. The change is in usage counting logic, not Stripe APIs.

---

## Summary: What Changes

| Area | Change | New npm dep? |
|------|--------|-------------|
| Business context switching | Cookie via next/headers | No |
| Business switcher | Radix DropdownMenu (already installed) | No |
| Clients page | Card + Sheet (already installed) | No |
| Agency metadata | Supabase migration (new columns) | No |
| Data refactor | Replace .single() with explicit businessId | No |
| Onboarding | Separate insert path | No |
| Billing | Pool usage counting | No |

---

## What NOT to Add

| Considered | Decision | Reason |
|------------|----------|--------|
| URL segments (`/[businessId]/...`) | No | Requires route restructuring; overkill for 2-5 clients |
| Separate `agency_clients` table | No | Businesses table already serves this role |
| React Context for business_id | No | Server Components read from cookie directly; only client components need the provider |
| Multi-tenant library | No | This is single-user multi-business, not multi-tenant SaaS |
| White-label/branding per business | No | Out of scope for v3.0 |
| Client self-signup/portal | No | Agency owner creates all businesses |

---

*Stack research for: v3.0 Agency Mode*
*Researched: 2026-02-26*
*Confidence: HIGH — zero new dependencies confirmed via codebase analysis*
