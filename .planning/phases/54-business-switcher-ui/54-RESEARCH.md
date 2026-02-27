# Phase 54: Business Switcher UI — Research

**Researched:** 2026-02-27
**Domain:** Next.js App Router client component interaction with server actions, Radix UI DropdownMenu, React useTransition
**Confidence:** HIGH

---

## Summary

Phase 54 is a UI-only phase. All plumbing from Phases 52–53 is already in place and verified:
`switchBusiness()` server action exists and is correct, `BusinessSettingsProvider` already exposes `businessId`, `businessName`, and `businesses[]` to all client components, and `revalidatePath('/', 'layout')` inside the action triggers a full re-render after the cookie is set.

The work is entirely about building two client components — a desktop `BusinessSwitcher` that lives inside the sidebar header area, and a mobile `BusinessSwitcher` that lives inside `PageHeader`. Both read `businesses` and `businessId` from `useBusinessSettings()` and call `switchBusiness()` via `useTransition`.

The single-business case (most users) must be invisible — no dropdown, no clickable affordance, just the name. Only when `businesses.length > 1` does the switcher trigger and chevron appear. This is a critical edge-case the planner must guard against.

**Primary recommendation:** Build one `BusinessSwitcher` component used in both desktop sidebar and mobile page header. It receives no props — it reads everything from `useBusinessSettings()`. Use `@radix-ui/react-dropdown-menu` (already installed and used in `account-menu.tsx`). Use `useTransition` for pending state (established pattern in this codebase). No new packages needed.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@radix-ui/react-dropdown-menu` | ^2.1.14 (installed) | Dropdown trigger + content + items | Already used in `account-menu.tsx`; accessible, keyboard-navigable, Radix pattern |
| `@phosphor-icons/react` | ^2.1.10 (installed) | `CaretUpDown` or `CaretDown` chevron icon | Matches icon library used throughout sidebar |
| `useTransition` from React | 19 (installed) | `isPending` state while `switchBusiness()` runs | Established pattern: `plan-card.tsx`, `campaign-card.tsx`, `billing`, etc. |
| `useBusinessSettings()` | project provider | Read `businesses`, `businessId`, `businessName` | Phase 52 already extended provider; `BusinessIdentity` type exported |
| `switchBusiness()` | `lib/actions/active-business.ts` | Set httpOnly cookie + `revalidatePath('/', 'layout')` | Phase 52 implemented and verified |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cn()` from `@/lib/utils` | project util | Conditional classNames | Always used for Tailwind composition |
| `sonner` toast | ^2.0.7 (installed) | Error toast if `switchBusiness()` returns `{ error }` | Only on failure path; not on success (page re-renders) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `DropdownMenu` from Radix | Custom popover | Radix gives keyboard nav, focus trap, aria roles for free — hand-rolling is 3x more code |
| `useTransition` | Optimistic UI | Optimistic is more complex; the pending state is <300ms (cookie set + revalidate); spinner is sufficient |
| Single shared component | Two separate components | One component with `variant="desktop"/"mobile"` prop or no props reads context — cleaner, less duplication |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended File Structure

```
components/
  layout/
    business-switcher.tsx    # New — shared component used in both sidebar and page-header
    sidebar.tsx              # Modified — replace logo area with BusinessSwitcher when businesses > 1
    page-header.tsx          # Modified — add BusinessSwitcher to mobile header right side
```

No new directories needed. The component sits alongside `account-menu.tsx`.

### Pattern 1: BusinessSwitcher Component Shape

**What:** A client component that reads from `useBusinessSettings()`, renders nothing when `businesses.length <= 1`, and renders a Radix `DropdownMenu` when `businesses.length > 1`.

**When to use:** Rendered in both sidebar header and mobile page-header.

**Example:**
```typescript
// Source: Pattern derived from account-menu.tsx in this codebase
// components/layout/business-switcher.tsx
'use client'

import { useTransition } from 'react'
import { CaretUpDown, Check } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBusinessSettings } from '@/components/providers/business-settings-provider'
import { switchBusiness } from '@/lib/actions/active-business'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BusinessSwitcherProps {
  variant?: 'sidebar' | 'header'  // controls sizing/truncation
}

export function BusinessSwitcher({ variant = 'sidebar' }: BusinessSwitcherProps) {
  const { businesses, businessId, businessName } = useBusinessSettings()
  const [isPending, startTransition] = useTransition()

  // Single-business: render plain name, no interaction
  if (businesses.length <= 1) {
    return (
      <span className="truncate text-sm font-medium">{businessName}</span>
    )
  }

  // Multi-business: dropdown switcher
  const handleSelect = (id: string) => {
    if (id === businessId || isPending) return
    startTransition(async () => {
      const result = await switchBusiness(id)
      if (result?.error) {
        toast.error('Failed to switch business')
      }
      // On success: revalidatePath inside switchBusiness triggers re-render automatically
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 -mx-2",
            "hover:bg-secondary/70 dark:hover:bg-muted/70 transition-colors",
            "text-sm font-medium truncate",
            isPending && "opacity-60 pointer-events-none"
          )}
          aria-label={`Current business: ${businessName}. Click to switch.`}
        >
          <span className="truncate">{businessName}</span>
          <CaretUpDown size={14} weight="regular" className="shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {businesses.map((biz) => (
          <DropdownMenuItem
            key={biz.id}
            onSelect={() => handleSelect(biz.id)}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">{biz.name}</span>
            {biz.id === businessId && (
              <Check size={14} weight="bold" className="shrink-0 text-accent" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Pattern 2: Sidebar Integration

**What:** The sidebar header currently renders the AvisLoop logo + collapse toggle. The business switcher should appear below the logo (in a separate row) or replace it when the sidebar is expanded.

**Current sidebar header structure:**
```tsx
{/* Header */}
<div className={cn(
  "flex items-center h-16 px-4 border-b border-border",
  collapsed ? "justify-center" : "justify-between"
)}>
  {!collapsed && (
    <Link href="/dashboard" className="flex items-center gap-2">
      <ArrowsClockwise size={24} weight="regular" className="text-accent" />
      <span className="font-bold text-lg">AvisLoop</span>
    </Link>
  )}
  <Button variant="ghost" size="icon-sm" onClick={() => setIsCollapsed(!isCollapsed)} ...>
    {/* collapse toggle */}
  </Button>
</div>
```

**Recommended approach:** Add a second row below the header for the business name/switcher. This preserves the logo and doesn't break the existing `h-16` header. The business switcher sits in a compact `px-4 py-2 border-b` strip below the logo.

```tsx
{/* Business context row — below logo, above nav */}
{!collapsed && (
  <div className="px-4 py-2 border-b border-border">
    <BusinessSwitcher variant="sidebar" />
  </div>
)}
```

When collapsed, the business name is hidden (only icons visible) — consistent with how the nav labels are hidden in collapsed mode.

### Pattern 3: Mobile Page-Header Integration

**What:** `PageHeader` currently has: left side = logo or page title, right side = `AccountMenu`. Add the business switcher between the logo and the account menu.

**Current structure:**
```tsx
<div className="flex items-center gap-2">
  {/* Left: logo or title */}
</div>
<div className="flex items-center gap-1">
  <AccountMenu ... />
</div>
```

**Recommended approach:** Show the business name in the center/left area. When multi-business, it becomes a tappable dropdown. Because `PageHeader` renders on mobile (all pages), all mobile users always see the current business name.

```tsx
// In page-header.tsx
{/* Center: Business switcher (hidden on desktop) */}
<div className="flex-1 flex items-center justify-center">
  <BusinessSwitcher variant="header" />
</div>
```

Or — keep the logo on the left but show the business name in the space between logo and account. Either approach satisfies SWITCH-04.

### Pattern 4: useTransition Pending State in This Codebase

**What:** The established pattern is `const [isPending, startTransition] = useTransition()` + calling the server action inside `startTransition(async () => { ... })`.

**Reference implementations:**
- `components/billing/plan-card.tsx`: simplest use — `startTransition(() => createCheckoutSession(priceId))`
- `components/campaigns/campaign-card.tsx`: more complete — optimistic state + error rollback with `toast.error()`

**Key insight:** After `switchBusiness()` calls `revalidatePath('/', 'layout')`, Next.js invalidates the Router Cache and triggers a server re-render of the entire layout tree. The client component (`BusinessSwitcher`) will receive new props from `BusinessSettingsProvider` reflecting the new `businessId`/`businessName`. No manual router.refresh() is needed.

### Anti-Patterns to Avoid

- **Do NOT call `router.refresh()`** after `switchBusiness()`. The `revalidatePath('/', 'layout')` inside the server action already handles this. Adding `router.refresh()` would cause a double re-render.
- **Do NOT render the switcher for single-business users.** The most common user (one business) should see zero switcher chrome. Adding a non-interactive business name display is fine; adding a chevron or dropdown trigger is V1 over-engineering.
- **Do NOT pass `businesses` as props from the sidebar.** The sidebar is a client component that already calls `useBusinessSettings()`. The `BusinessSwitcher` should call `useBusinessSettings()` directly — no prop drilling, no manual threading.
- **Do NOT use `useRouter().push()` after the switch.** The server action's `revalidatePath` re-renders the current page in-place. Navigating away would lose the user's context.
- **Do NOT import `switchBusiness` in `sidebar.tsx` directly.** Encapsulate it in `BusinessSwitcher` — separation of concerns.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropdown with keyboard nav + focus trap | Custom `<div>` with event listeners | `@radix-ui/react-dropdown-menu` | Already in codebase, WAI-ARIA compliant, tested across browsers |
| Pending/loading state | `useState(isLoading)` | `useTransition` | React 18+ concurrent pattern; no extra state variable needed |
| Truncation of long business names | CSS text overflow | `truncate` Tailwind class | One class handles overflow + ellipsis |
| Icon for switcher trigger | SVG or emoji | Phosphor `CaretUpDown` | Matches icon system, correct semantic meaning |

---

## Common Pitfalls

### Pitfall 1: Switcher Renders for Single-Business Users

**What goes wrong:** Agency users with 10 businesses get a nice switcher; solo operators with 1 business see a weird non-functional chevron that does nothing.
**Why it happens:** Component always renders the full dropdown UI without checking `businesses.length`.
**How to avoid:** Guard with `if (businesses.length <= 1) return <plainNameSpan>`. This is the most common user path — it must be silent.
**Warning signs:** Solo-operator screenshots show a chevron next to the business name.

### Pitfall 2: `revalidatePath` Triggers Full Re-render Including Sidebar

**What goes wrong:** Developer adds `router.refresh()` after `switchBusiness()`, causing double re-render. Or developer expects the `BusinessSwitcher` to update instantly via optimistic state, then gets confused when the re-render overrides it.
**Why it happens:** `revalidatePath('/', 'layout')` already schedules a full layout re-render. Any additional navigation or refresh is redundant.
**How to avoid:** After `startTransition(async () => { await switchBusiness(id) })`, do nothing else. Let the re-render happen naturally. The `isPending` flag from `useTransition` handles the loading visual during the round-trip.
**Warning signs:** Sidebar flickers twice, or console shows two navigation events for one switch.

### Pitfall 3: Sidebar Collapsed State Hides Business Name But Doesn't Break

**What goes wrong:** In collapsed mode (`w-16`), the business switcher still renders its text and overflows.
**Why it happens:** The `BusinessSwitcher` isn't aware of the sidebar's `collapsed` state.
**How to avoid:** Two options:
  1. Wrap the `BusinessSwitcher` in `{!collapsed && <BusinessSwitcher />}` in the sidebar (simplest).
  2. Pass `collapsed` prop to `BusinessSwitcher` and render a tooltip trigger only.
  Recommended: option 1 — hide entirely in collapsed sidebar. The business context isn't needed in icon-only mode.
**Warning signs:** Business name text visible in 16px-wide sidebar, breaking layout.

### Pitfall 4: Dropdown Opens Below Viewport on Short Screens

**What goes wrong:** If the business list is long (5+ businesses), the dropdown content extends below the mobile viewport.
**Why it happens:** Radix `DropdownMenuContent` renders into a portal at the computed position. On short screens, there may not be enough space below the trigger.
**How to avoid:** The `DropdownMenuContent` in `dropdown-menu.tsx` already has `max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto` set (line 68). This handles scrollable content automatically. No extra config needed.
**Warning signs:** Dropdown content clipped at bottom on mobile.

### Pitfall 5: Type Mismatch on `businessId` Check

**What goes wrong:** Using `===` comparison between `biz.id` and `businessId` from context fails because one is undefined during initial render (empty string default).
**Why it happens:** The layout passes `businessId = business?.id ?? ''` (empty string when no business). The `businesses` array contains real UUIDs. `'' === someUUID` is always false — no check mark ever shows.
**How to avoid:** The check mark guard `{biz.id === businessId && <Check />}` is correct when `businessId` is a real UUID. The layout guarantees `businessId` is the real UUID (from `getActiveBusiness()`) whenever `businesses.length > 0`. When `businessId` is `''` (no business), `businesses.length` is also 0 so the dropdown never renders. Safe.
**Warning signs:** Current business has no check mark in dropdown.

### Pitfall 6: Sidebar `useBusinessSettings()` Already Called — Don't Double-Call

**What goes wrong:** Calling `useBusinessSettings()` in both `sidebar.tsx` (if already calls it for `enabledServiceTypes`) and `BusinessSwitcher` causes two context reads.
**Why it happens:** Developer checks if sidebar already uses the hook and adds businessName directly there, then also builds a separate component that reads the context.
**How to avoid:** Having `BusinessSwitcher` call `useBusinessSettings()` independently is correct and fine. React context reads are O(1). The sidebar currently does NOT call `useBusinessSettings()` (checked: `sidebar.tsx` uses `useAddJob` for the Add Job button, no business settings hook). `BusinessSwitcher` will be the first component in the sidebar that reads business settings.
**Warning signs:** None — this is not a real pitfall, just a concern to dismiss.

---

## Code Examples

### Verified: `switchBusiness()` Server Action Signature

```typescript
// Source: lib/actions/active-business.ts (verified in codebase)
export async function switchBusiness(businessId: string): Promise<{ error?: string }>
// - Verifies ownership via PK + user_id check
// - Sets httpOnly cookie with 1-year maxAge
// - Calls revalidatePath('/', 'layout')
// - Returns {} on success, { error: string } on failure
```

### Verified: Provider Exports

```typescript
// Source: components/providers/business-settings-provider.tsx (verified in codebase)
export interface BusinessIdentity {
  id: string
  name: string
}

// useBusinessSettings() returns:
{
  businessId: string        // current active business UUID (or '' if none)
  businessName: string      // current active business display name (or '' if none)
  businesses: BusinessIdentity[]  // all businesses for current user
  enabledServiceTypes: ServiceType[]
  customServiceNames: string[]
}
```

### Verified: Existing DropdownMenu Usage Pattern

```typescript
// Source: components/layout/account-menu.tsx (verified in codebase)
// Already uses the exact same Radix dropdown pattern:
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Pattern: asChild trigger + side/align props
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    {trigger}
  </DropdownMenuTrigger>
  <DropdownMenuContent side={side} align={align} className="w-56">
    <DropdownMenuItem ...>...</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Verified: useTransition Pattern in This Codebase

```typescript
// Source: components/billing/plan-card.tsx (verified in codebase)
const [isPending, startTransition] = useTransition()

const handleSubscribe = () => {
  startTransition(() => {
    createCheckoutSession(priceId)
  })
}
```

### Verified: Sidebar Collapsed State Logic

```typescript
// Source: components/layout/sidebar.tsx (verified in codebase)
const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebarCollapsed', false)
const [autoCollapsed, setAutoCollapsed] = useState(false)
const collapsed = autoCollapsed || isCollapsed
// Used to conditionally render text labels: {!collapsed && <span>...</span>}
// Same guard should wrap <BusinessSwitcher /> in sidebar
```

---

## Current File State (What Exists Before Phase 54)

### Files that need modification

| File | Current State | Change Needed |
|------|--------------|---------------|
| `components/layout/sidebar.tsx` | Logo + collapse toggle in header; no business context shown | Add business switcher display below logo |
| `components/layout/page-header.tsx` | Logo/title on left, AccountMenu on right | Add business switcher in center or left area |

### Files that exist and are ready (no changes needed)

| File | Provides |
|------|---------|
| `lib/actions/active-business.ts` | `switchBusiness(businessId)` — complete and verified |
| `lib/data/active-business.ts` | `getActiveBusiness()`, `getUserBusinesses()` — complete |
| `components/providers/business-settings-provider.tsx` | `useBusinessSettings()` exposing `businessId`, `businessName`, `businesses[]`, `BusinessIdentity` type |
| `app/(dashboard)/layout.tsx` | Passes `businessId`, `businessName`, `businesses` to provider |
| `components/ui/dropdown-menu.tsx` | Full Radix dropdown with content scrolling, keyboard nav |

### New file to create

| File | Purpose |
|------|---------|
| `components/layout/business-switcher.tsx` | Client component — reads context, renders plain name or dropdown |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getBusiness()` crashes with 2 businesses | `getActiveBusiness()` cookie-based resolver | Phase 52 (complete) | Business switching is now safe |
| Provider had only service type settings | Provider exposes `businessId`, `businessName`, `businesses[]` | Phase 52 (complete) | BusinessSwitcher can read everything from context |
| All data functions derived business from user_id | All functions accept explicit `businessId` | Phase 53 (complete) | Page re-render after switch shows correct business data |
| No business switcher exists anywhere | Phase 54 adds it | This phase | Agency owners can use the product |

---

## Open Questions

1. **Where exactly in the sidebar should the business name appear?**
   - What we know: The current header is `h-16` with logo + collapse toggle. There's no existing slot for business name.
   - Options:
     A. Add a second row below the logo header (separate `border-b` strip, `h-10` or `py-2`). Cleanest separation of concerns.
     B. Put the business name inside the header row, replacing the "AvisLoop" text when multi-business.
     C. First nav item in the nav section (above Dashboard link).
   - Recommendation: **Option A** — separate strip below logo. It's the clearest visual hierarchy: logo (brand) → business name (context) → navigation. Most SaaS apps (Vercel, Linear, Notion) use this pattern.

2. **How should the mobile switcher display when the page has a `pageTitle`?**
   - What we know: `PageHeader` conditionally renders either the AvisLoop logo OR a `pageTitle`. When a page title is shown, there's less space for the business switcher.
   - What's unclear: Should the business name replace the page title on mobile, or appear alongside it?
   - Recommendation: Show the business name only when the logo is visible (no `pageTitle`). When a `pageTitle` is provided, the page title takes priority, and the business switcher can be accessible from the `AccountMenu` as a fallback. This keeps the mobile header clean.
   - Alternative: Always show the business name regardless of page title — acceptable if truncation is handled well.

3. **Should the switcher show a "Add Business" option in the dropdown for future growth?**
   - What we know: Phase 52 introduced `createAdditionalBusiness()` as insert-only path (not yet wired to a UI).
   - What's unclear: Is Phase 54 the right place to add the "Add Business" menu item?
   - Recommendation: **No for Phase 54.** The phase goal is switcher-only. Adding new businesses is a separate flow. Keep the dropdown simple: just the list of existing businesses. A separator + "Manage Businesses" link pointing to settings could be a future Phase 55 addition.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `components/layout/sidebar.tsx` — verified collapsed state logic, header structure, icon system
- `components/layout/page-header.tsx` — verified mobile header structure, AccountMenu placement
- `components/layout/account-menu.tsx` — verified DropdownMenu usage pattern (direct template)
- `components/layout/app-shell.tsx` — verified how sidebar + page-header are composed
- `components/layout/bottom-nav.tsx` — verified mobile nav items (no business switcher exists)
- `components/providers/business-settings-provider.tsx` — verified `BusinessIdentity` type, `businesses[]`, `businessId`, `businessName` all exposed
- `lib/actions/active-business.ts` — verified `switchBusiness()` signature and `revalidatePath` behavior
- `lib/data/active-business.ts` — verified `getActiveBusiness()` and `getUserBusinesses()`
- `app/(dashboard)/layout.tsx` — verified provider receives `businesses`, `businessId`, `businessName`
- `components/billing/plan-card.tsx` — verified `useTransition` pattern
- `components/campaigns/campaign-card.tsx` — verified `startTransition` + `toast.error()` pattern
- `components/ui/dropdown-menu.tsx` — verified `max-h-[var(--radix-dropdown-menu-content-available-height)]` scroll handling

### Secondary (HIGH confidence — Next.js official documentation via Context7)

- Next.js `revalidatePath('/', 'layout')` — verified it invalidates Router Cache and triggers layout re-render
- Next.js `cookies.set` in Server Action — verified automatic UI re-render on cookie change
- `useTransition` + `startTransition(async () => await serverAction())` — verified as correct pattern for calling server actions from client components

### Tertiary (LOW confidence)

- None. All findings based on direct codebase inspection or official documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use; exact usage patterns verified in codebase
- Architecture: HIGH — component structure derived directly from existing `account-menu.tsx` and `sidebar.tsx` patterns
- Pitfalls: HIGH — identified from direct code reading; single-business guard and collapsed state are concrete observations

**Research date:** 2026-02-27
**Valid until:** Stable — all patterns are internal to the codebase; no external library version concerns
