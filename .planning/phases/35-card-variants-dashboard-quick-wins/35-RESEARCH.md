# Phase 35: Card Variants & Dashboard Quick Wins - Research

**Researched:** 2026-02-18
**Domain:** Design system (CVA card variants, Supabase auth session, page padding normalization, analytics empty state)
**Confidence:** HIGH — entirely internal codebase investigation; no external libraries beyond CVA which is already in use

---

## Summary

Phase 35 touches five distinct sub-problems: (1) adding CVA variants to `card.tsx`, (2) replacing `InteractiveCard`'s translate-y lift with an arrow affordance, (3) adding a time-aware greeting to the dashboard, (4) differentiating the bottom pipeline KPI row visually, and (5) a suite of dashboard housekeeping items (badge removal, analytics empty state, all-page padding normalization). All required code already exists in the codebase — the phase is entirely additive modifications to existing files.

The existing `card.tsx` uses plain `forwardRef` wrappers with `cn()`. CVA is already installed and used in `button.tsx` and `badge.tsx`. Adding variants to `Card` and `InteractiveCard` requires converting them from simple `cn()` wrappers to CVA-backed components, then extending the component signatures with `VariantProps`. This conversion is safe because CVA `defaultVariants` preserves backward compatibility — callers that pass no `variant` prop continue to work unmodified.

User first name for the greeting is available via `user.user_metadata.full_name` from `supabase.auth.getUser()`. This is stored during sign-up (confirmed in `lib/actions/auth.ts:44`). The dashboard page is already a server component that calls `getBusiness()` which itself calls `supabase.auth.getUser()` internally — the greeting requires one additional `getUser()` call at the dashboard page level, or passing the name down via the layout/AppShell pattern already established. The cleanest path is fetching user in the dashboard server component alongside existing `getBusiness()` call.

**Primary recommendation:** Convert `card.tsx` to CVA using the exact same pattern as `button.tsx`. Fetch user in the dashboard page server component. Remove the `dashboardBadge` prop from sidebar `NavItem` config for Dashboard (not the whole prop — just the per-item badge assignment in `sidebar.tsx:157`).

---

## Standard Stack

No new libraries needed. All tools are already installed.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `class-variance-authority` | Already in use | CVA variants for components | Pattern established in `button.tsx`, `badge.tsx` |
| `@supabase/ssr` | Already in use | Server-side auth session | `createClient()` from `lib/supabase/server.ts` |
| `@phosphor-icons/react` | Already in use | Arrow icon for InteractiveCard affordance | Project-standard icon library |

### No Installation Required
All required packages are present. Phase 35 is pure codebase modification.

---

## Architecture Patterns

### Pattern 1: CVA Conversion for Card Component

**What:** Convert `Card` from a plain `cn()` wrapper to a CVA-backed component, exactly mirroring the `button.tsx` pattern.

**Current card.tsx (simplified):**
```tsx
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground", className)} {...props} />
  )
)
```

**CVA conversion pattern (from button.tsx):**
```tsx
// Source: components/ui/button.tsx (project-established pattern)
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "rounded-lg border text-card-foreground", // base classes
  {
    variants: {
      variant: {
        default: "bg-card",
        amber:   "bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40",
        blue:    "bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40",
        green:   "bg-green-50 border-green-100 dark:bg-green-950/30 dark:border-green-900/40",
        red:     "bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900/40",
        ghost:   "bg-transparent border-transparent",
        subtle:  "bg-muted border-border/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Component signature adds VariantProps
interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
)
```

**Key safety note:** `defaultVariants: { variant: "default" }` ensures every existing `<Card>` usage (which passes no `variant` prop) continues rendering `bg-card` unchanged. Zero breaking changes.

**InteractiveCard gets same variants PLUS arrow behavior:**
```tsx
// Arrow affordance: always visible, bottom-right, muted at rest → prominent on hover
const InteractiveCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="interactive-card"
      className={cn(
        cardVariants({ variant }),
        "relative transition-all duration-200 cursor-pointer",
        "hover:shadow-sm hover:border-border",       // subtle shadow on hover
        className,
      )}
      {...props}
    >
      {children}
      {/* Arrow affordance — always visible, bottom-right */}
      <span className="absolute bottom-3 right-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors duration-200">
        <ArrowRight size={14} weight="bold" />
      </span>
    </div>
  )
)
```

**Note on arrow always-visible:** The CONTEXT.md states "arrow always visible (not hover-only)". Use `opacity` or a color that's visually subtle at rest (`text-muted-foreground/30`) but becomes more visible on hover via `hover:text-muted-foreground/70` on the parent `div`. Since `:hover` pseudo-class doesn't cascade from parent to child in CSS, use `group` + `group-hover` Tailwind utilities — or apply the hover state directly with a JS approach (or just use static subtle opacity that is always visible). Given the constraint "always visible", a static but muted arrow (`text-muted-foreground/40`) satisfies both requirements without needing `group`.

### Pattern 2: Dashboard Greeting (Server Component)

**What:** Add time-of-day greeting fetching user's `full_name` from auth metadata.

**Where to add:** `app/(dashboard)/dashboard/page.tsx` — already a server component. Add `createClient()` and `getUser()` alongside existing data fetches.

**User metadata structure (confirmed from `lib/actions/auth.ts:44`):**
```ts
// Stored during signUp:
data: { full_name: fullName || '' }
// Retrieved as:
user.user_metadata.full_name  // string | undefined
```

**Implementation pattern (matches project pattern from feedback/page.tsx and settings/page.tsx):**
```tsx
// In DashboardPage() server component
import { createClient } from '@/lib/supabase/server'

// Inside the async function:
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// Extract first name
const fullName = user?.user_metadata?.full_name as string | undefined
const firstName = fullName?.split(' ')[0] || ''

// Time-of-day greeting
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const greeting = firstName
  ? `${getGreeting()}, ${firstName}`
  : getGreeting()
```

**Edge cases:**
- `full_name` may be empty string (set as `''` during sign-up if not provided)
- `full_name` may not exist for OAuth users
- If empty/missing: fall back to greeting without name ("Good morning")
- The `new Date()` in a server component runs at request time in server timezone — this is acceptable as an approximation; no user-timezone awareness needed for Phase 35

### Pattern 3: KPI Card Differentiation

**What:** Top row (outcome KPIs) uses `variant="amber"` + larger sizing. Bottom row (pipeline) uses `variant="default"` + compact sizing (already `p-4` vs `p-6`).

**Current state in `kpi-widgets.tsx`:**
- Top row: `<InteractiveCard className="p-6">` — 3 cards, linked to pages (reviews, feedback, history)
- Bottom row: `<Card className="p-4">` — 3 cards, static (no navigation destination obvious)

**Differentiation approach (per CONTEXT.md decisions):**
- Top row: `<InteractiveCard variant="amber" className="p-6">` (amber tinted background + arrow affordance)
- Bottom row: `<Card variant="subtle" className="p-4">` or keep `variant="default"` — "subdued, informational"
- The `subtle` variant (`bg-muted border-border/50`) slightly recedes vs amber top cards — good visual hierarchy

**Note on pipeline card clickability:** CONTEXT.md says "Claude's discretion based on whether useful navigation destinations exist." Research finding: the bottom 3 pipeline cards currently link nowhere (they are plain `<Card>`, not `<InteractiveCard>`, not wrapped in `<Link>`). The data they show (Requests Sent, Active Sequences, Pending/Queued) doesn't have obvious dedicated pages. Keep them as non-interactive `<Card>` — no arrow, no pointer cursor.

### Pattern 4: Remove Dashboard Notification Badge

**Current sidebar.tsx (lines 152-160):**
```tsx
{mainNav.map((item) => (
  <NavLink
    key={item.href}
    item={{
      ...item,
      badge: item.label === 'Dashboard' ? dashboardBadge : undefined,
    }}
  />
))}
```

**Fix:** Change the badge assignment so Dashboard gets `undefined` regardless of `dashboardBadge`:
```tsx
item={{
  ...item,
  badge: undefined,  // Remove badge from all nav items per Phase 35 requirement
}}
```

**OR** more surgically — just never pass `dashboardBadge` to the Dashboard item. The `dashboardBadge` prop from layout.tsx can remain (it's used elsewhere potentially) but the badge should not be shown on the nav item.

**Note:** The `dashboardBadge` value still flows from `layout.tsx` → `AppShell` → `Sidebar`. The fix is only in how `sidebar.tsx` assigns it to nav items. No change needed in layout or AppShell.

### Pattern 5: Analytics Empty State

**Current `analytics-service-breakdown.tsx` (lines 12-16):**
```tsx
if (data.byServiceType.length === 0) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p>No campaign data yet. Once campaigns start sending, service type breakdowns will appear here.</p>
    </div>
  )
}
```

**Required:** Icon + heading + suggested action.

**Standard empty state pattern (from UX Audit):**
```tsx
import { ChartBar } from '@phosphor-icons/react'  // or ChartLine, etc.

if (data.byServiceType.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <ChartBar size={32} weight="regular" className="text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight mb-2">No analytics data yet</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Analytics appear once campaigns start sending. Complete a job to kick off your first campaign.
      </p>
      <Link href="/jobs?action=add">
        <Button variant="default">Add your first job</Button>
      </Link>
    </div>
  )
}
```

**Note:** The `ChartBar` icon is already imported in the sidebar for Analytics. Use `ChartBar` or `ChartLine` from `@phosphor-icons/react` for visual consistency.

### Pattern 6: All-Page Padding Normalization

**Current state audit (from reading all dashboard page files):**

| Page | Outer Container Classes | Space-Y |
|------|------------------------|---------|
| `dashboard/page.tsx` | `container mx-auto py-6 px-4 space-y-6` | Yes (space-y-6) |
| `jobs/page.tsx` | `container py-6` | No |
| `campaigns/page.tsx` | `container py-6 space-y-8` | space-y-8 (inconsistent) |
| `analytics/page.tsx` | `container mx-auto py-6 px-4` | No |
| `customers/page.tsx` | `container py-6` | No |
| `history/page.tsx` | `container py-6` | No (inside Suspense) |
| `feedback/page.tsx` | `container py-8 max-w-4xl` | No (mb-8 pattern) |
| `billing/page.tsx` | `container mx-auto py-6 px-4 max-w-4xl` | No (mb-8 pattern) |
| `settings/page.tsx` | `max-w-4xl mx-auto` (inside content component) | No |
| `send/page.tsx` | `container mx-auto py-6 px-4` | No |

**Problems identified:**
1. Inconsistent `px-4` — some pages have it explicitly, some rely on `container` default
2. Inconsistent `space-y` — dashboard uses `space-y-6`, campaigns uses `space-y-8`, others use none
3. Inconsistent `mx-auto` — some pages have it, `container` class in Tailwind already centers
4. `py-6` vs `py-8` — feedback/page uses py-8
5. Settings uses a different structural pattern (sticky header + content area)

**Standard to enforce (per DS-05):** `container py-6 space-y-6` as the standard outer wrapper. Pages with constrained max-width (billing, settings) should use `container max-w-4xl py-6 space-y-6`.

**Note on settings:** Settings page has a sticky header structure (`<div className="sticky top-0 ...">`) — this intentional layout deviation should be preserved. The `space-y-6` applies to the content area inside `<div className="p-6">`, not the page root.

**Note on feedback:** The `py-8` and `max-w-4xl` are intentional design choices for the feedback reading experience. Keep `py-8` but add `space-y-6` for internal section consistency.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card variants | Custom CSS classes or `data-variant` attributes | CVA (already installed) | Type safety, `VariantProps`, consistent pattern with button/badge |
| Arrow icon | SVG string or custom component | `ArrowRight` from `@phosphor-icons/react` | Project icon standard |
| Time-of-day greeting | Date parsing library | `new Date().getHours()` | Trivially simple, no library needed |
| User name extraction | Custom auth hook | `user.user_metadata.full_name` from `getUser()` | Already available in Supabase auth response |

---

## Common Pitfalls

### Pitfall 1: Breaking Existing Card Usages
**What goes wrong:** Adding `variant` to CVA requires the component signature to accept `variant` prop. If done wrong (e.g., not destructuring `variant` from props), `variant` passes through to the DOM `div` causing a React warning and potential TypeScript error.
**Why it happens:** Forgetting to destructure `variant` out of the rest props before spreading `{...props}` on the `div`.
**How to avoid:** Explicitly destructure `variant` in the component signature, exactly as `button.tsx` does with `variant` and `size`.
**Warning signs:** TypeScript error "Property 'variant' does not exist on type 'HTMLAttributes<HTMLDivElement>'" or React console warning about unknown DOM attribute.

### Pitfall 2: Arrow Icon Overlapping Card Content
**What goes wrong:** The `absolute bottom-3 right-3` arrow overlaps card content, especially on small/compact cards (bottom pipeline row uses `p-4`).
**Why it happens:** Arrow positioned absolutely inside padded card. Content at bottom-right of card gets covered.
**How to avoid:** Since the bottom pipeline cards remain plain `<Card>` (no `InteractiveCard`), only top outcome KPI cards get the arrow. Those use `p-6` with content that flows top-to-bottom — the arrow in `bottom-3 right-3` sits in empty space below the trend indicator. Verify by reading kpi-widgets.tsx layout again: the card has title at top, big number + trend in middle, with no bottom content — the arrow position is safe.
**Alternative:** If content collision is an issue, change arrow position to `top-3 right-3` alongside the icon (replacing the muted icon color scheme).

### Pitfall 3: `new Date()` in Server Component — Wrong Timezone
**What goes wrong:** `new Date().getHours()` runs on the server in UTC (or server timezone, typically UTC on Vercel). A user in California at 11 PM might see "Good morning" because it's 7 AM UTC.
**Why it happens:** Server components run in server timezone.
**How to avoid:** This is a known limitation accepted for Phase 35 (CONTEXT.md does not require user-timezone awareness). Add a comment in the code noting this limitation. If exact user timezone is needed later, it can be done via a client component or the user's stored timezone preference.
**Verdict:** Accept this limitation for Phase 35. The greeting is a nice-to-have UX touch, not a precision instrument.

### Pitfall 4: `dashboardBadge` Prop Chain Remains Even After Badge Removal
**What goes wrong:** `dashboardBadge` prop flows: `layout.tsx` → `AppShell` → `Sidebar`. If you only fix the display in `Sidebar` but not the data fetching, the badge count is still computed in `getDashboardCounts()` every page load — wasted query.
**Why it happens:** Incremental fix only touches the display layer.
**How to avoid:** Per requirement (DS-03), only the badge display is removed — "remove number badge from Dashboard nav item." The notification bell and dashboard counts can remain (they are separate concerns). The `dashboardBadge` prop is NOT used for the notification bell — it's only for the nav badge. So the fix is surgical: in `sidebar.tsx`, stop assigning `dashboardBadge` to the Dashboard nav item.
**Do NOT:** Remove `getDashboardCounts()` from layout or remove the prop entirely — that would break the notification bell if it uses `notificationCounts`.

### Pitfall 5: CVA Variant Colors Hardcode Tailwind Scale Classes — PurgeCSS Risk
**What goes wrong:** Tailwind PurgeCSS (content scanning) only picks up class names that appear literally in scanned files. Dynamic CVA variant strings work fine because they're statically defined in the component file itself. BUT if you build variant strings using string interpolation like `bg-${color}-50`, PurgeCSS cannot detect them.
**Why it happens:** Dynamic class composition.
**How to avoid:** All variant class strings in CVA must be fully spelled out as static strings: `"bg-amber-50 border-amber-100 dark:bg-amber-950/30"` — not `"bg-" + color + "-50"`. This is how button.tsx and badge.tsx do it. Follow the same pattern.

---

## Code Examples

Verified patterns from codebase:

### CVA Pattern (from button.tsx)
```tsx
// Source: C:\AvisLoop\components\ui\button.tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "base-classes-here",
  {
    variants: {
      variant: {
        default: "...",
        destructive: "...",
      },
      size: { ... },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
```

### User First Name Extraction (project pattern)
```tsx
// Source: pattern from C:\AvisLoop\app\(dashboard)\settings\page.tsx + auth.ts
// In a server component / server action:
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// full_name stored at sign-up in user_metadata (auth.ts:44)
const fullName = (user?.user_metadata?.full_name as string | undefined) ?? ''
const firstName = fullName.split(' ')[0] || ''
```

### Sidebar Badge Assignment (current pattern)
```tsx
// Source: C:\AvisLoop\components\layout\sidebar.tsx lines 152-160
{mainNav.map((item) => (
  <NavLink
    key={item.href}
    item={{
      ...item,
      // Current: shows badge on Dashboard
      badge: item.label === 'Dashboard' ? dashboardBadge : undefined,
    }}
  />
))}

// Fix: remove badge from Dashboard nav item
item={{
  ...item,
  badge: undefined,  // No badges on any nav items
}}
```

### Analytics Empty State (project UX pattern from UX-AUDIT.md)
```tsx
// Source: Pattern documented in C:\AvisLoop\.planning\UX-AUDIT.md (Empty States section)
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="rounded-full bg-muted p-6 mb-6">
    <Icon className="h-8 w-8 text-muted-foreground" />  {/* or size={32} for Phosphor */}
  </div>
  <h2 className="text-xl font-semibold tracking-tight mb-2">No data yet</h2>
  <p className="text-muted-foreground mb-6 max-w-sm">Description</p>
  <Button>Suggested action</Button>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Plain `cn()` card wrapper | CVA-backed with variants | What Phase 35 introduces |
| `motion-safe:hover:-translate-y-1` lift | Arrow indicator at bottom-right | What Phase 35 changes |
| Static `text-center py-12` empty state | Icon + heading + CTA | Phase 35 analytics fix |
| Dashboard nav badge | No badge (removed) | Phase 35 removes |

---

## Open Questions

1. **Arrow affordance on InteractiveCard when wrapped in `<Link>`**
   - What we know: `InteractiveCard` is always used inside a `<Link>` wrapper in `kpi-widgets.tsx`. The arrow positioned inside the card is decorative (not the link target — the whole card is the link).
   - What's unclear: Whether the arrow `<span>` inside the `<Link>` causes any accessibility issues (nested interactive elements).
   - Recommendation: Since `InteractiveCard` is a `div` (not an `a` or `button`), and the arrow is a `span` (not interactive), there's no nested-interactive issue. The arrow is purely visual. No action needed.

2. **`full_name` for OAuth users (Google sign-in)**
   - What we know: Google OAuth stores name in `user_metadata.full_name` automatically via Supabase. Email/password sign-up stores it explicitly.
   - What's unclear: What field name Google OAuth uses exactly (`full_name` vs `name`).
   - Recommendation: Guard with `firstName || ''` fallback. If empty, show greeting without name. This is already in the implementation pattern above.

3. **Amber variant token vs. Tailwind scale class**
   - What we know: Phase 35 CONTEXT.md says to use new CSS tokens (`--warning-bg` etc.) from the Tier 2 audit. The TIER2-COLOR-AUDIT.md specifies these tokens as Phase 35 deliverables.
   - What's unclear: Should card `amber` variant use the new `bg-warning-bg border-warning-border` tokens, or Tailwind scale classes `bg-amber-50 border-amber-100`?
   - Recommendation: Use Tailwind scale classes (`bg-amber-50 dark:bg-amber-950/30`) for card variants. The new token infrastructure (adding to globals.css + tailwind.config.ts) should happen first in Phase 35-03, then batch-replace hardcoded colors. Card variants should ideally use semantic tokens, but since `--warning-bg` doesn't exist yet in globals.css, use Tailwind scale classes now. The 210-occurrence batch replacement will happen in the same phase — the card variants can be updated to use tokens when the tokens are defined in 35-03. This is a sequencing matter for the planner.

---

## Token Infrastructure (from Tier 2 Audit)

The TIER2-COLOR-AUDIT.md specifies 9 new CSS tokens needed for Phase 35:

```css
/* Add to globals.css :root and .dark */
--warning-bg, --warning, --warning-border, --warning-foreground
--success-bg, --success, --success-border, --success-foreground
--info-bg, --info, --info-border, --info-foreground
--error-text
```

And corresponding tailwind.config.ts additions for `warning`, `success`, `info`, `error` color groups.

This token work is the prerequisite for the 210-occurrence batch replacement. The Tier 2 audit execution order recommendation: tokens first → tailwind config → batch replace by category. This token work should be in a plan before the batch replacement plan.

---

## Sources

### Primary (HIGH confidence)
- `C:\AvisLoop\components\ui\card.tsx` — current implementation, no CVA, plain cn()
- `C:\AvisLoop\components\ui\button.tsx` — CVA pattern to mirror exactly
- `C:\AvisLoop\components\ui\badge.tsx` — second CVA example in codebase
- `C:\AvisLoop\components\dashboard\kpi-widgets.tsx` — full KPI widget implementation
- `C:\AvisLoop\app\(dashboard)\dashboard\page.tsx` — current dashboard server component
- `C:\AvisLoop\app\globals.css` — current CSS token definitions (warm palette complete, no warning/success/info tokens yet)
- `C:\AvisLoop\tailwind.config.ts` — current color mappings (no warning/success/info yet)
- `C:\AvisLoop\components\layout\sidebar.tsx` — badge assignment at line 157
- `C:\AvisLoop\app\(dashboard)\layout.tsx` — AppShell wiring, dashboardBadge prop
- `C:\AvisLoop\lib\actions\auth.ts:44` — `full_name` stored in user_metadata at sign-up
- `C:\AvisLoop\.planning\phases\33-hardcoded-color-audit\TIER2-COLOR-AUDIT.md` — 210 occurrences, token specs, execution order
- `C:\AvisLoop\components\dashboard\analytics-service-breakdown.tsx` — current bare-text empty state (line 12-16)
- All 10 dashboard page files — padding/spacing audit

### Secondary (MEDIUM confidence)
- `C:\AvisLoop\.planning\UX-AUDIT.md` — standard empty state pattern documented

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — CVA already installed and used; no new dependencies
- Architecture: HIGH — read actual source files for all components being changed
- Pitfalls: HIGH — inferred from actual component structure, not speculation
- Token sequencing: HIGH — directly from TIER2-COLOR-AUDIT.md which is the authoritative Phase 35 input doc

**Research date:** 2026-02-18
**Valid until:** Stable for ~60 days (pure internal codebase research, not library-version-dependent)
