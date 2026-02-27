# Architecture Patterns: v3.0 Agency Mode

**Project:** AvisLoop v3.0 — Multi-Business Agency Mode
**Researched:** 2026-02-26
**Confidence:** HIGH (direct codebase analysis of all relevant files)

---

## Overview

This document answers: how does multi-business agency mode integrate with the existing single-business architecture?

The codebase currently assumes one user = one business throughout. The central challenge is refactoring the business resolution pattern from `.eq('user_id', user.id).single()` (returns THE business) to an explicit `businessId` parameter (returns A SPECIFIC business).

---

## Existing Architecture Snapshot

```
App Shell (server layout)
├── app/(dashboard)/layout.tsx — Server Component
│   ├── Fetches getServiceTypeSettings() — uses .single() internally
│   ├── Wraps children in BusinessSettingsProvider
│   └── No explicit business_id passed — derives from user session
├── Sidebar (desktop, client) — hardcoded "AvisLoop" logo, no business name
├── BottomNav (mobile, client) — 4 items
└── Page content — each page fetches its own data via lib/data/ functions

Business Resolution (current):
├── lib/data/business.ts → getBusiness() → .eq('user_id', user.id).single()
├── lib/actions/job.ts → createJob() → fetches business via .single()
├── lib/actions/enrollment.ts → various functions use .single()
└── ~86 instances of .eq('user_id').single() across 20+ files
```

### Key Files

| File | Current Pattern | Agency Impact |
|------|----------------|---------------|
| `lib/data/business.ts` | `getBusiness()` → `.eq('user_id').single()` | Will throw PGRST116 with 2+ businesses |
| `app/(dashboard)/layout.tsx` | Fetches settings, wraps in provider | Needs business_id from cookie/context |
| `components/layout/sidebar.tsx` | Shows "AvisLoop" logo, no business info | Needs business switcher dropdown |
| `components/providers/business-settings-provider.tsx` | Only has `enabledServiceTypes`, `customServiceNames` | Needs business_id, business name |
| `app/(dashboard)/dashboard/page.tsx` | Calls `getBusiness()` → redirects to onboarding if null | Needs to handle multi-business |
| `lib/data/dashboard.ts` | `getDashboardKPIs(businessId: string)` | Already takes explicit businessId — good |

### What Already Works

Some data functions already accept explicit `businessId`:
- `getDashboardKPIs(businessId: string)`
- Various functions that receive businessId from page-level fetches

The problem is the page-level fetches themselves — they call `getBusiness()` which uses `.single()`.

### RLS Policies

RLS policies use:
```sql
business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
```

This already supports multiple businesses per user — no RLS changes needed.

---

## Integration Point 1: Business Context Resolution

### The Problem

With one business, `getBusiness()` returns it directly. With multiple businesses, we need to know WHICH business the user is currently viewing.

### Cookie-Based Approach (Recommended)

```
User selects business in sidebar dropdown
  → Server action sets httpOnly cookie: active_business_id=<uuid>
  → revalidatePath('/', 'layout') refreshes all pages
  → Server Components read cookie via cookies() from next/headers
  → All data functions receive businessId from cookie
```

**Why cookie over URL segments:**
- No route restructuring needed (avoid `/[businessId]/dashboard` pattern)
- Works with existing middleware and route protection
- Simpler for 2-5 businesses (not a multi-tenant SaaS)
- Cookie persists across navigation without URL manipulation

### Implementation Pattern

```typescript
// lib/data/business.ts — new resolver
export async function getActiveBusiness(): Promise<Business> {
  const cookieStore = await cookies()
  const activeId = cookieStore.get('active_business_id')?.value
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (activeId) {
    // Verify user owns this business
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', activeId)
      .eq('user_id', user.id)
      .single()
    if (data) return data
  }

  // Fallback: first business
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  return data
}

// lib/actions/business.ts — switcher action
export async function switchBusiness(businessId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_business_id', businessId, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  })
  revalidatePath('/', 'layout')
}
```

---

## Integration Point 2: Data Function Refactor

### Current Pattern (breaks with 2+ businesses)

```typescript
// ~86 instances across 20+ files
const { data: business } = await supabase
  .from('businesses')
  .select('*')
  .eq('user_id', user.id)
  .single()  // ← throws PGRST116 with multiple results
```

### Target Pattern

```typescript
// Page level: resolve once via cookie
const business = await getActiveBusiness()

// Pass businessId to all data/action functions
const kpis = await getDashboardKPIs(business.id)
const jobs = await getJobs(business.id)
```

### Affected Function Categories

1. **Data fetchers** (`lib/data/*.ts`) — read operations that resolve business from user
2. **Server actions** (`lib/actions/*.ts`) — write operations that resolve business from user
3. **API routes** (`app/api/**/*.ts`) — cron endpoints that use service role (different pattern)
4. **Page components** — server components that call getBusiness() directly

### Migration Strategy

1. Create `getActiveBusiness()` that reads cookie
2. Update page-level server components to use `getActiveBusiness()`
3. Thread `businessId` down to data functions
4. Grep for all `.single()` calls and refactor one by one
5. Cron endpoints already use service role — they query by business_id directly, no user session

---

## Integration Point 3: Business Switcher UI

### Sidebar Integration

```
Sidebar (current)
├── Logo: "AvisLoop" (hardcoded)
├── Navigation items
├── "Add Job" button
└── Account menu

Sidebar (target)
├── Business Switcher Dropdown ← NEW (top of sidebar)
│   ├── Current business name + chevron
│   ├── Dropdown: all user's businesses
│   └── "View All Clients" link → /businesses
├── Navigation items (unchanged)
├── "Add Job" button (unchanged)
└── Account menu (unchanged)
```

Components needed:
- `BusinessSwitcher` — DropdownMenu (already have Radix DropdownMenu) showing all businesses
- Uses `switchBusiness()` server action on selection

### Data Flow

```
layout.tsx (server)
  → getActiveBusiness() + getUserBusinesses()
  → Pass to Sidebar as props
  → Sidebar renders BusinessSwitcher with businesses list + active business
  → User clicks different business
  → switchBusiness() sets cookie
  → revalidatePath('/', 'layout')
  → All pages re-render with new business context
```

---

## Integration Point 4: Clients Page (/businesses)

### New Page Structure

```
/businesses (new route)
├── Header: "Clients" + "Add Business" button
├── Card Grid: all user's businesses
│   ├── BusinessCard — name, type, Google rating, reviews gained
│   └── Click → opens BusinessDetailDrawer
└── BusinessDetailDrawer (Sheet)
    ├── Full client profile (Google ratings, competitor, fees, notes)
    └── "Switch to Business" action button
```

### Agency Metadata

New columns on `businesses` table:

| Column | Type | Purpose |
|--------|------|---------|
| google_rating_start | DECIMAL(2,1) | Google rating when client started |
| google_review_count_start | INT | Review count when client started |
| google_rating_current | DECIMAL(2,1) | Current Google rating |
| google_review_count_current | INT | Current review count |
| monthly_fee | DECIMAL(10,2) | What agency charges this client |
| start_date | DATE | When client relationship began |
| gbp_access | BOOLEAN | Has GBP access? |
| competitor_name | TEXT | Top competitor name |
| competitor_review_count | INT | Competitor's review count |
| notes | TEXT | Internal agency notes |
| custom_service_names | TEXT[] | Already exists |

`reviews_gained` = `google_review_count_current - google_review_count_start` (computed, not stored)

---

## Integration Point 5: Onboarding for Additional Businesses

### The Upsert Danger

Current `saveBusinessBasics()` uses:
```typescript
await supabase
  .from('businesses')
  .upsert({ user_id: user.id, name, ... })
```

This upserts on `user_id` — when creating a second business, it OVERWRITES the first business's data.

### Fix

Separate code paths:
1. **First business** (onboarding): Current upsert behavior (creates initial business)
2. **Additional business** (from Clients page): INSERT only, never upsert on user_id
3. After creation, set new business as active via `switchBusiness()`

---

## Integration Point 6: Billing

### Current

One subscription per user. Usage tracked per-business but billed to user.

### Agency Model

- Pool usage limits across all businesses
- One Stripe customer = one subscription
- Usage counted: total sends across ALL businesses vs plan limit
- No per-business billing complexity

### Implementation

Billing functions already use `user_id` for Stripe customer lookup. The main change is usage counting:
- Current: count sends for THE business
- Target: count sends for ALL businesses owned by user

---

## Component Map: New vs Modified

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| BusinessSwitcher | `components/layout/business-switcher.tsx` | Sidebar dropdown for switching businesses |
| BusinessCard | `components/businesses/business-card.tsx` | Card in Clients grid |
| BusinessDetailDrawer | `components/businesses/business-detail-drawer.tsx` | Full client profile drawer |
| BusinessesClient | `components/businesses/businesses-client.tsx` | Client component for /businesses page |

### Modified Components

| Component | File | Change |
|-----------|------|--------|
| Sidebar | `components/layout/sidebar.tsx` | Add BusinessSwitcher at top |
| Dashboard layout | `app/(dashboard)/layout.tsx` | Use getActiveBusiness(), pass to provider |
| BusinessSettingsProvider | `components/providers/business-settings-provider.tsx` | Add businessId, businessName |
| All page.tsx files | `app/(dashboard)/*/page.tsx` | Use getActiveBusiness() instead of getBusiness() |
| All data functions | `lib/data/*.ts` | Accept explicit businessId parameter |
| All server actions | `lib/actions/*.ts` | Accept explicit businessId or resolve from cookie |
| Onboarding | `app/(dashboard)/onboarding/*` | Separate first-business vs additional-business paths |

---

## Build Order

**Phase 1: Foundation (Schema + Business Resolver)**
1. Add agency metadata columns to businesses table
2. Create `getActiveBusiness()` function
3. Create `switchBusiness()` server action
4. Create `getUserBusinesses()` function

**Phase 2: Data Function Refactor**
5. Refactor all `.eq('user_id').single()` calls in lib/data/
6. Refactor all `.eq('user_id').single()` calls in lib/actions/
7. Update page-level server components to use getActiveBusiness()

**Phase 3: UI (Switcher + Clients Page)**
8. Build BusinessSwitcher component
9. Add to sidebar
10. Build /businesses page with card grid
11. Build BusinessDetailDrawer

**Phase 4: Onboarding + Billing**
12. Separate onboarding paths (first vs additional business)
13. Update billing to pool usage across businesses

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Cookie-based switching | HIGH | Standard Next.js pattern, minimal route changes |
| Data function refactor | HIGH | Mechanical but extensive — 86 instances to update |
| RLS compatibility | HIGH | Policies already support multi-business |
| Sidebar switcher | HIGH | DropdownMenu component already exists |
| Onboarding separation | MEDIUM | Need to verify all onboarding steps for upsert patterns |
| Billing pooling | MEDIUM | Need to verify Stripe integration details |

---

*Research completed: 2026-02-26*
*Method: Direct codebase analysis via Explore agent + conversation findings*
