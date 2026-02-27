# Phase 52: Multi-Business Foundation - Research

**Researched:** 2026-02-26
**Domain:** Cookie-based business resolver, provider extension, redirect logic for multi-business support in Next.js 15 + Supabase
**Confidence:** HIGH

## Summary

Phase 52 establishes the foundational plumbing that all subsequent v3.0 phases depend on: a single function (`getActiveBusiness()`) that resolves which business a user is currently working with, a server action (`switchBusiness()`) that changes the active selection, and an extended `BusinessSettingsProvider` that exposes business identity to client components.

The current codebase assumes one user = one business everywhere. The `getBusiness()` function in both `lib/data/business.ts` and `lib/actions/business.ts` calls `.eq('user_id', user.id).single()`, which throws PGRST116 (multiple rows) the moment a second business exists. Phase 52 introduces the resolver and provider extensions *without* touching the ~82 `.single()` instances (that is Phase 53's scope). The key insight: Phase 52 must introduce the new resolution path and ensure the dashboard/layout uses it, while leaving existing data functions untouched for now.

**Primary recommendation:** Create `getActiveBusiness()` as a cookie-reading resolver in `lib/data/active-business.ts`, `switchBusiness()` as a server action in `lib/actions/active-business.ts`, and `getUserBusinesses()` as a query function. Extend `BusinessSettingsProvider` to carry `businessId`, `businessName`, and `businesses[]`. Fix the dashboard redirect logic to distinguish "zero businesses" from "no active selection."

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/headers` (cookies) | Next.js 15 built-in | Read/write httpOnly cookies in server components and server actions | Official Next.js API, no external dependency needed |
| `@supabase/ssr` | latest (already installed) | Server-side Supabase client with cookie-based auth | Already in use for auth session management |
| `revalidatePath` | Next.js built-in | Force re-render of all pages after business switch | Ensures all server components refetch with new business context |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-dropdown-menu` | ^2.1.14 (already installed) | Business switcher dropdown (Phase 54) | Not needed in Phase 52 but planning for downstream |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| httpOnly cookie | URL segments (`/[businessId]/dashboard`) | 3-5x more effort: every route, every link, every redirect needs restructuring. Cookie is correct for 2-5 business scale |
| httpOnly cookie | localStorage | Not accessible in server components; would require client-side fetching pattern; not secure |
| Extending BusinessSettingsProvider | Separate BusinessContextProvider | More context providers = more nesting; extending existing one is simpler and avoids double-wrapping |

**Installation:**
No new packages needed. All APIs are already available in the project.

## Architecture Patterns

### Recommended File Structure

```
lib/
  data/
    active-business.ts       # getActiveBusiness(), getUserBusinesses() - read operations
  actions/
    active-business.ts       # switchBusiness() - write operation (sets cookie)
components/
  providers/
    business-settings-provider.tsx  # Extended with businessId, businessName, businesses[]
app/
  (dashboard)/
    layout.tsx               # Modified: uses getActiveBusiness(), passes to provider
    dashboard/page.tsx       # Modified: uses getActiveBusiness(), fixes redirect logic
```

### Pattern 1: Cookie-Based Business Resolution

**What:** A single function that reads the `active_business_id` cookie, verifies the user owns that business, and falls back to the first business if the cookie is missing or invalid.

**When to use:** Every time a server component or server action needs to know "which business is currently active."

**Example:**
```typescript
// Source: Verified against Next.js 15 cookies() API docs
// lib/data/active-business.ts

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Business } from '@/lib/types/database'

const ACTIVE_BUSINESS_COOKIE = 'active_business_id'

export async function getActiveBusiness(): Promise<Business | null> {
  const cookieStore = await cookies()
  const activeId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // If cookie exists, verify ownership
  if (activeId) {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', activeId)
      .eq('user_id', user.id)
      .single()
    if (data) return data
    // Cookie was invalid or business doesn't belong to user - fall through
  }

  // Fallback: first business by creation date
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  return data?.[0] ?? null
}
```

**Critical detail:** The fallback query uses `.limit(1)` with array access instead of `.single()` to avoid PGRST116 when zero businesses exist. `.single()` throws on zero results; `.limit(1)` returns an empty array gracefully.

### Pattern 2: Server Action Cookie Setting

**What:** A server action that sets the `active_business_id` httpOnly cookie and triggers a full page re-render.

**When to use:** When the user switches businesses via the sidebar dropdown (Phase 54), or when the system auto-selects a first business.

**Example:**
```typescript
// Source: Verified against Next.js 15 cookies().set() official docs
// lib/actions/active-business.ts
'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function switchBusiness(businessId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the user owns this business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!business) return { error: 'Business not found' }

  const cookieStore = await cookies()
  cookieStore.set({
    name: 'active_business_id',
    value: businessId,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    // 1 year expiry - cookie persists across sessions
    maxAge: 60 * 60 * 24 * 365,
  })

  revalidatePath('/', 'layout')
  return {}
}
```

**Key detail from Next.js docs:** Cookies can ONLY be set in Server Functions (server actions) or Route Handlers. Server Components can only READ cookies. This is why `switchBusiness()` must be a server action, and `getActiveBusiness()` can be a regular async function called from server components.

### Pattern 3: Extended Provider

**What:** Extending `BusinessSettingsProvider` to include business identity and the full businesses list.

**When to use:** Client components that need the current business ID, name, or the list of all businesses (e.g., sidebar switcher in Phase 54).

**Example:**
```typescript
// components/providers/business-settings-provider.tsx
'use client'

import { createContext, useContext } from 'react'
import type { ServiceType } from '@/lib/types/database'

interface BusinessIdentity {
  id: string
  name: string
}

interface BusinessSettingsContextValue {
  businessId: string
  businessName: string
  businesses: BusinessIdentity[]
  enabledServiceTypes: ServiceType[]
  customServiceNames: string[]
}

const BusinessSettingsContext = createContext<BusinessSettingsContextValue | null>(null)

export function useBusinessSettings() {
  const ctx = useContext(BusinessSettingsContext)
  if (!ctx) {
    throw new Error('useBusinessSettings must be used within <BusinessSettingsProvider>')
  }
  return ctx
}
```

### Pattern 4: Dashboard Redirect Logic Fix

**What:** Distinguishing "user has zero businesses" from "user has businesses but no active selection."

**When to use:** Every dashboard page that currently does `const business = await getBusiness(); if (!business) redirect('/onboarding')`.

**Example:**
```typescript
// Dashboard page (simplified logic)
const business = await getActiveBusiness()

if (!business) {
  // getActiveBusiness() returns null only when user has ZERO businesses
  // (it auto-selects first business if cookie is missing)
  redirect('/onboarding')
}

// At this point, business is guaranteed to be a valid Business object
// Either from cookie or auto-selected first business
```

**Critical insight:** The `getActiveBusiness()` function handles the "no cookie but has businesses" case internally by falling back to the first business. It only returns `null` when the user truly has zero businesses. This means the redirect logic in dashboard pages remains simple: `if (!business) redirect('/onboarding')` -- but it no longer crashes when a second business exists.

### Anti-Patterns to Avoid

- **Do NOT use `.single()` for fallback queries:** Use `.limit(1)` with array access. `.single()` throws on zero results AND on multiple results. The fallback must handle both gracefully.
- **Do NOT set cookies in server components:** Next.js only allows cookie writes in server actions or route handlers. Attempting to set a cookie during server component rendering silently fails.
- **Do NOT call `getActiveBusiness()` in the existing `getBusiness()` function yet:** Phase 52 introduces the new resolver alongside the old one. Phase 53 migrates the ~82 `.single()` calls. Mixing them prematurely creates confusion about which path is being used.
- **Do NOT auto-set the cookie from `getActiveBusiness()`:** When falling back to the first business, do NOT automatically set the cookie. This would require `getActiveBusiness()` to be a server action (can't set cookies from server components). Instead, let the layout or dashboard page handle cookie-setting via `switchBusiness()` when it detects the fallback was used.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie management | Custom cookie parsing/setting | `cookies()` from `next/headers` | Built-in, async, handles all edge cases, well-documented |
| Business ownership verification | Manual join queries | `.eq('id', activeId).eq('user_id', user.id).single()` | Supabase RLS already prevents cross-user access; the explicit check is defense-in-depth |
| Provider re-rendering on switch | Custom state management or pub/sub | `revalidatePath('/', 'layout')` | Next.js built-in; triggers full layout tree re-render including all server components |
| UUID validation | Regex or custom validator | Supabase `.eq('id', value)` returns null for invalid UUIDs | PostgreSQL handles UUID validation; no crash, just no match |

## Common Pitfalls

### Pitfall 1: `.single()` vs `.limit(1)` for the Fallback Query

**What goes wrong:** Using `.single()` for the "get first business" fallback throws PGRST116 when user has zero businesses AND when they have multiple businesses with ambiguous ordering.
**Why it happens:** `.single()` requires exactly one row. Zero rows = error. Multiple rows = error.
**How to avoid:** Use `.limit(1)` and access `data?.[0]`. Returns `undefined` gracefully for zero rows.
**Warning signs:** `PGRST116: Results contain 0 rows` error on the dashboard for brand-new users.

### Pitfall 2: Cookie Not Accessible in Server Components for Writing

**What goes wrong:** Attempting to auto-set the `active_business_id` cookie inside `getActiveBusiness()` when it falls back to the first business. The function runs in a server component context where cookies cannot be written.
**Why it happens:** Next.js restricts `.set()` and `.delete()` to Server Functions (server actions) and Route Handlers only. Server Components can only read.
**How to avoid:** `getActiveBusiness()` should return a `{ business, wasAutoSelected }` tuple or similar signal. The calling code (layout or page) can then call `switchBusiness()` to persist the auto-selection. Alternatively, accept that the cookie won't be set until the user explicitly switches (each page load re-computes the fallback, which is fast).
**Warning signs:** Silent failure -- cookie appears to be set in dev but never persists.

### Pitfall 3: Existing `getBusiness()` Functions Must Not Be Broken

**What goes wrong:** Modifying the existing `getBusiness()` in `lib/data/business.ts` or `lib/actions/business.ts` to use the new resolver breaks Phase 53's scope (which systematically migrates all ~82 call sites).
**Why it happens:** Changing `getBusiness()` to use `getActiveBusiness()` internally would be the "easy" fix, but it changes the return type (no more `.single()` semantics) and affects every downstream caller without explicit review.
**How to avoid:** Phase 52 creates `getActiveBusiness()` as a NEW function. Only the dashboard layout and dashboard page switch to using it. Everything else continues using the old `getBusiness()` -- it still works fine for single-business users.
**Warning signs:** Tests or pages that relied on the `.single()` return type break unexpectedly.

### Pitfall 4: Provider Extension Must Be Backward Compatible

**What goes wrong:** Adding required props (`businessId`, `businessName`, `businesses`) to `BusinessSettingsProvider` without updating the layout causes a TypeScript compilation error across the project.
**Why it happens:** The provider is used in `app/(dashboard)/layout.tsx`. If new props are required, the layout MUST be updated in the same commit.
**How to avoid:** Update the layout and provider in a single plan/task. Do NOT make the new props optional with fallback defaults -- that defeats the purpose and leads to runtime errors downstream.
**Warning signs:** TypeScript error: `Property 'businessId' is missing in type...`

### Pitfall 5: Dashboard Layout Fetches Business Twice

**What goes wrong:** The layout calls `getServiceTypeSettings()` (which internally calls `.eq('user_id').single()`) AND the dashboard page calls `getBusiness()` (also `.eq('user_id').single()`). If we update only the layout to use `getActiveBusiness()`, the page still uses the old function.
**Why it happens:** Business resolution is done independently in the layout and each page. There is no shared context for the server-side business object.
**How to avoid:** In Phase 52, update the layout to use `getActiveBusiness()` and pass `businessId` down via the provider. Update the dashboard page to also use `getActiveBusiness()`. Leave other pages using `getBusiness()` for Phase 53. This means for Phase 52, only the layout and dashboard page use the new resolver.
**Warning signs:** N+1 business resolution queries per page load.

### Pitfall 6: Cookie Domain for Production (Cross-Subdomain)

**What goes wrong:** Setting the cookie without a domain means it only works on the exact hostname. In production, the app runs on `app.avisloop.com` but the cookie needs to work across the subdomain.
**Why it happens:** The existing Supabase cookies already handle this via `COOKIE_DOMAIN = '.avisloop.com'` in `lib/supabase/server.ts`.
**How to avoid:** Mirror the same pattern: set `domain: process.env.NODE_ENV === 'production' ? '.avisloop.com' : undefined` on the business cookie. Or simply don't set a domain (cookie defaults to current host, which is correct for the business context).
**Warning signs:** Cookie works on localhost but not in production. Or cookie from `app.avisloop.com` not visible on `avisloop.com` (not relevant for our case since business context is only used on the app subdomain).

## Code Examples

### getUserBusinesses() - Fetch All Businesses for Current User

```typescript
// Source: Pattern derived from existing codebase conventions
// lib/data/active-business.ts

export async function getUserBusinesses(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return data ?? []
}
```

### Updated Layout Pattern

```typescript
// Source: Based on existing app/(dashboard)/layout.tsx structure
// app/(dashboard)/layout.tsx

import { getActiveBusiness, getUserBusinesses } from '@/lib/data/active-business'
import { getServiceTypeSettings } from '@/lib/data/business'
import { BusinessSettingsProvider } from '@/components/providers/business-settings-provider'
// ... other imports

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const [business, businesses] = await Promise.all([
    getActiveBusiness(),
    getUserBusinesses(),
  ])

  // If no business exists, children (pages) will handle redirect to onboarding
  const businessId = business?.id ?? ''
  const businessName = business?.name ?? ''

  // Service settings need business_id context (Phase 53 will refactor this)
  // For now, getServiceTypeSettings() still uses old pattern - works for single business
  const serviceSettings = await getServiceTypeSettings()
  const enabledServiceTypes = (serviceSettings?.serviceTypesEnabled || []) as ServiceType[]
  const customServiceNames = serviceSettings?.customServiceNames || []

  let dashboardBadge = 0
  try {
    const counts = await getDashboardCounts()
    dashboardBadge = counts.total
  } catch { /* non-critical */ }

  return (
    <BusinessSettingsProvider
      businessId={businessId}
      businessName={businessName}
      businesses={businesses}
      enabledServiceTypes={enabledServiceTypes}
      customServiceNames={customServiceNames}
    >
      <AddJobProvider>
        <AppShell dashboardBadge={dashboardBadge}>
          {children}
        </AppShell>
      </AddJobProvider>
    </BusinessSettingsProvider>
  )
}
```

### Updated Dashboard Page Redirect Logic

```typescript
// app/(dashboard)/dashboard/page.tsx - only the redirect logic changes

import { getActiveBusiness } from '@/lib/data/active-business'

export default async function DashboardPage() {
  const business = await getActiveBusiness()

  if (!business) {
    // getActiveBusiness returns null ONLY when user has zero businesses
    // If they have businesses but no cookie, it auto-selects the first one
    redirect('/onboarding')
  }

  // ... rest of page unchanged, using business.id for data fetching
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getBusiness()` with `.single()` | `getActiveBusiness()` with cookie + fallback | Phase 52 (this phase) | Foundation for multi-business; old function preserved for backward compat |
| Provider has only service types | Provider has business identity + businesses list | Phase 52 (this phase) | Client components can access business info without prop drilling |
| `if (!business) redirect('/onboarding')` | Same check, but resolver handles multi-business fallback | Phase 52 (this phase) | No more crash when user has 2+ businesses |

**Not yet changed (deferred to Phase 53):**
- The ~82 `.eq('user_id').single()` calls across `lib/data/*.ts` and `lib/actions/*.ts` -- these still work for single-business users and will be migrated in Phase 53

## Open Questions

1. **Should `getActiveBusiness()` auto-set the cookie when falling back?**
   - What we know: Server components cannot set cookies. Only server actions can. If we want auto-persistence, we'd need to call `switchBusiness()` from the layout, but layout.tsx is a server component, not a server action.
   - What's unclear: Is the performance cost of re-computing the fallback on each page load acceptable, or should we find a way to persist it?
   - Recommendation: Accept the re-computation for Phase 52. It is a single indexed query (`WHERE user_id = X ORDER BY created_at LIMIT 1`) and adds negligible latency. Phase 54 (business switcher) will naturally set the cookie when the user interacts with the dropdown. Alternatively, the dashboard page could call a lightweight server action on mount to persist the cookie if it was missing.

2. **Should the layout pass the full `Business` object via provider, or just `id` and `name`?**
   - What we know: The current `BusinessSettingsProvider` serializes data from server to client. Passing the full `Business` object (with all columns) increases the serialized payload.
   - What's unclear: Whether downstream client components in Phase 54+ will need more fields.
   - Recommendation: Pass only `id`, `name`, and the businesses list. If future phases need more fields, extend the provider then. Keep the serialized payload minimal.

3. **How to handle `getServiceTypeSettings()` in the layout?**
   - What we know: This function currently uses `.eq('user_id').single()` internally. It still works for single-business users.
   - What's unclear: Should Phase 52 update this function to accept a `businessId` parameter?
   - Recommendation: Leave it as-is for Phase 52. It still works. Phase 53 will systematically update all data functions to accept explicit `businessId`. Changing it early creates an inconsistency where some functions take `businessId` and others don't.

## Sources

### Primary (HIGH confidence)
- **Next.js cookies() API documentation** (nextjs.org/docs/app/api-reference/functions/cookies) -- verified async API, set() options, server component vs server action restrictions
- **Codebase analysis** -- direct inspection of all affected files:
  - `lib/data/business.ts` (lines 14-43: `getBusiness()` with `.single()`)
  - `lib/actions/business.ts` (lines 149-177: duplicate `getBusiness()` with `.single()`)
  - `components/providers/business-settings-provider.tsx` (37 lines, only has `enabledServiceTypes` and `customServiceNames`)
  - `app/(dashboard)/layout.tsx` (35 lines, wraps in provider)
  - `app/(dashboard)/dashboard/page.tsx` (lines 29-33: redirect logic)
  - `middleware.ts` (cookie domain handling pattern at line 103)
  - `lib/supabase/server.ts` (cookie domain pattern at line 5)
  - 8 dashboard pages with `redirect('/onboarding')` pattern
  - ~82 `.single()` calls in `lib/` directory

### Secondary (MEDIUM confidence)
- **Prior v3.0 research documents** (`.planning/research/ARCHITECTURE.md`, `PITFALLS.md`, `STACK.md`) -- verified architecture decisions, pitfall catalog

### Tertiary (LOW confidence)
- None. All findings are based on codebase inspection and official Next.js documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all APIs verified against official Next.js docs
- Architecture: HIGH -- patterns derived directly from existing codebase conventions and verified API documentation
- Pitfalls: HIGH -- all pitfalls identified through direct codebase inspection of actual affected code paths
- Code examples: HIGH -- based on existing code patterns in the project, adapted for multi-business

**Research date:** 2026-02-26
**Valid until:** Indefinite (no external dependency version concerns; all patterns use stable built-in APIs)
