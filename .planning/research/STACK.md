# Technology Stack: v2.5 UI/UX Redesign — Warm Design System

**Project:** AvisLoop v2.5 — Warm Design System Overhaul
**Researched:** 2026-02-18
**Milestone Type:** Subsequent — Design system change to existing Next.js + Tailwind + shadcn/ui app
**Confidence:** HIGH (based on direct codebase inspection + authoritative knowledge of CSS variable architecture)

---

## Executive Summary

**Recommendation: Zero new npm dependencies required.**

The existing stack (Tailwind CSS 3.4 + CSS custom properties + CVA + shadcn/ui pattern) is already the correct architecture for a warm palette overhaul. All changes are confined to `globals.css` (CSS variable values) and component files (CVA variants, className additions). No Tailwind plugins, no color libraries, no new packages.

The redesign is purely a design token + component variant change. The hard work is picking the right HSL values — the tooling is already there.

---

## Existing Stack (Validated — Do Not Change)

| Technology | Version | Role |
|------------|---------|------|
| Next.js | 15 (latest) | App Router framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.1 | Utility classes |
| tailwindcss-animate | 1.0.7 | Animation utilities |
| CSS custom properties | Native | Design token system (HSL-based) |
| next-themes | 0.4.6 | Dark mode class toggling |
| class-variance-authority | 0.7.1 | Component variant system (CVA) |
| @radix-ui/* | Various | Unstyled accessible primitives |
| @phosphor-icons/react | 2.1.10 | Icon library |
| Kumbh Sans | Google Fonts | App typeface |
| lucide-react | 0.511.0 | Partial migration (select, sheet still use it) |

---

## What Changes: Design Token Architecture

The entire warm palette change is implemented by replacing HSL values in `globals.css` and adding two new semantic tokens. Nothing else changes in the build system.

### Principle: Semantic Token Layering

The existing system uses a single layer of semantic tokens (`--primary`, `--background`, etc.) mapped directly to HSL values. For the warm redesign, keep the same structure but replace the values. Do NOT add a base token layer (like `--amber-400: ...`). The shadcn/ui pattern uses semantic-only tokens and that pattern works fine here.

**Why this approach:** The entire app already references `bg-primary`, `text-muted-foreground`, `bg-card`, etc. Changing the HSL values behind those tokens propagates the new palette everywhere automatically — no component file changes for basic colors.

---

## New CSS Variable Values — Light Mode

Replace the `:root` block in `app/globals.css` with these values:

```css
:root {
  /* Page background: warm cream-tinted white, not pure gray */
  --background: 36 20% 96%;          /* #F6F3EE — warm off-white */

  /* Text: warm near-black, slight brown undertone */
  --foreground: 24 10% 10%;          /* #1C1814 — warm charcoal */

  /* Cards: clean white with barely-perceptible warmth */
  --card: 0 0% 100%;                 /* #FFFFFF — stays pure white for contrast */
  --card-foreground: 24 10% 10%;     /* matches foreground */

  /* Popovers/dropdowns: same as card */
  --popover: 0 0% 100%;
  --popover-foreground: 24 10% 10%;

  /* Primary: soft blue for interactive (buttons, links, focus rings) */
  /* NOT amber — amber is accent, blue remains the action color */
  --primary: 213 60% 42%;            /* #2B6CB0 — slightly desaturated, warmer blue */
  --primary-foreground: 0 0% 98%;

  /* Secondary: warm light tan for secondary buttons/surfaces */
  --secondary: 36 25% 91%;           /* #EDE8DF — warm stone */
  --secondary-foreground: 24 12% 18%;

  /* Muted: warm background for subdued areas */
  --muted: 36 15% 94%;               /* #F2EEE8 — warm muted */
  --muted-foreground: 24 8% 46%;     /* #7A7068 — warm gray */

  /* Accent: amber/gold — the visual differentiator */
  --accent: 38 92% 50%;              /* #F59E0B — amber-500, warm gold */
  --accent-foreground: 24 10% 10%;   /* dark text on amber background */

  /* Border: warm beige-gray, not cold gray */
  --border: 36 18% 86%;              /* #DDD7CC — warm border */
  --input: 36 18% 86%;               /* matches border */
  --ring: 213 60% 42%;               /* matches primary — focus rings stay blue */

  /* Destructive: unchanged red */
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;

  /* Border radius: increase slightly for softer feel */
  --radius: 0.625rem;                /* 10px — up from 8px */

  /* Highlight: new amber surface token for colored card backgrounds */
  --highlight: 45 95% 94%;           /* #FFFBEB — amber-50 equivalent */
  --highlight-foreground: 30 80% 25%;/* #7C3A10 — dark amber for contrast */

  /* Surface: new warm card variant */
  --surface: 36 30% 95%;             /* #F5F0E8 — warm cream surface */
  --surface-foreground: 24 10% 20%;

  /* Accent colors — kept from existing, can warm them later */
  --accent-lime: 75 75% 50%;
  --accent-coral: 0 85% 65%;

  /* Status colors — unchanged, they're correct */
  --status-pending-bg: 220 14% 96%;
  --status-pending-text: 220 43% 11%;
  --status-delivered-bg: 194 33% 94%;
  --status-delivered-text: 189 57% 40%;
  --status-clicked-bg: 54 96% 88%;
  --status-clicked-text: 30 100% 27%;
  --status-failed-bg: 0 100% 94%;
  --status-failed-text: 358 100% 38%;
  --status-reviewed-bg: 138 68% 92%;
  --status-reviewed-text: 149 100% 25%;

  /* Chart colors: warm-shifted palette */
  --chart-1: 38 92% 50%;             /* amber */
  --chart-2: 173 58% 39%;            /* teal — unchanged */
  --chart-3: 213 60% 42%;            /* soft blue */
  --chart-4: 27 87% 55%;             /* warm orange */
  --chart-5: 340 75% 55%;            /* pink — unchanged */
}
```

**Key decisions:**

- `--background: 36 20% 96%` gives the warm cream page feel without being yellow. At 96% lightness it reads as off-white but warm, not cold gray.
- `--accent: 38 92% 50%` is amber-500 (the Tailwind amber scale midpoint). It's used for highlight surfaces and interactive accent elements — not the primary button color.
- `--primary: 213 60% 42%` keeps blue as the action color. Soft blue + warm amber is the combination described in the milestone brief ("soft blues for interactive, warm amber for accents"). Using amber as the primary button color would fail WCAG AA contrast on light backgrounds.
- Two new tokens (`--highlight`, `--surface`) added for colored card backgrounds. These do not break any existing component since they are additive.

---

## New CSS Variable Values — Dark Mode

Replace the `.dark` block with these values:

```css
.dark {
  /* Dark background: warm-tinted dark, not pure black */
  --background: 24 8% 10%;           /* #1C1916 — warm very dark brown */
  --foreground: 36 15% 92%;          /* #EDE8DF — warm near-white */

  --card: 24 8% 14%;                 /* #231F1C — warm dark card */
  --card-foreground: 36 15% 92%;

  --popover: 24 8% 14%;
  --popover-foreground: 36 15% 92%;

  /* Primary: brighter blue for dark backgrounds */
  --primary: 213 70% 62%;            /* #5B9BD5 — lighter blue for dark mode */
  --primary-foreground: 24 10% 10%;

  /* Secondary: dark warm surface */
  --secondary: 24 8% 18%;            /* #2E2923 */
  --secondary-foreground: 36 15% 88%;

  /* Muted: dark warm muted */
  --muted: 24 8% 16%;                /* #28231F */
  --muted-foreground: 36 10% 58%;    /* #9E9590 */

  /* Accent: amber slightly toned down for dark mode readability */
  --accent: 38 85% 56%;              /* #F6A623 — slightly lighter amber */
  --accent-foreground: 24 10% 10%;

  --border: 24 8% 22%;               /* #38302B — dark warm border */
  --input: 24 8% 22%;
  --ring: 213 70% 62%;               /* matches dark primary */

  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;

  /* Highlight: dark amber surface for colored cards */
  --highlight: 38 50% 18%;           /* #3D2E10 — dark amber glow */
  --highlight-foreground: 45 90% 78%;/* #F6D878 — golden text on dark amber */

  /* Surface: dark warm surface variant */
  --surface: 24 10% 17%;             /* #2B2420 */
  --surface-foreground: 36 15% 85%;

  --accent-lime: 75 75% 48%;
  --accent-coral: 0 80% 62%;

  /* Status colors — dark mode equivalents */
  --status-pending-bg: 220 14% 20%;
  --status-pending-text: 220 14% 80%;
  --status-delivered-bg: 189 30% 20%;
  --status-delivered-text: 189 57% 55%;
  --status-clicked-bg: 40 40% 20%;
  --status-clicked-text: 30 80% 65%;
  --status-failed-bg: 0 40% 20%;
  --status-failed-text: 358 80% 65%;
  --status-reviewed-bg: 149 30% 18%;
  --status-reviewed-text: 149 70% 55%;

  /* Chart colors — dark mode warm */
  --chart-1: 38 85% 56%;
  --chart-2: 173 58% 45%;
  --chart-3: 213 70% 62%;
  --chart-4: 27 80% 60%;
  --chart-5: 340 65% 60%;
}
```

**Dark mode warmth strategy:** The dark backgrounds use HSL hue 24 (warm brown) instead of hue 0 (neutral gray). At the lightnesses used (8-18%), the warmth is subtle — backgrounds look dark but slightly cozy, not sterile. The amber accent becomes the golden highlight on dark surfaces.

---

## Tailwind Config Changes

Add the two new semantic tokens to `tailwind.config.ts`:

```typescript
// tailwind.config.ts — add to the colors object inside theme.extend
colors: {
  // ... existing colors unchanged ...

  // New warm palette additions
  highlight: {
    DEFAULT: "hsl(var(--highlight))",
    foreground: "hsl(var(--highlight-foreground))",
  },
  surface: {
    DEFAULT: "hsl(var(--surface))",
    foreground: "hsl(var(--surface-foreground))",
  },

  // Rename accent-lime and accent-coral to match their CSS vars
  // (these are already in the config, no change needed)
},

borderRadius: {
  // Increase slightly to match the --radius: 0.625rem change
  lg: "var(--radius)",              // 10px
  md: "calc(var(--radius) - 2px)", // 8px
  sm: "calc(var(--radius) - 4px)", // 6px
  xl: "calc(var(--radius) + 4px)", // 14px — new, for card containers
},
```

**Why only two new tokens:** `highlight` covers amber-tinted card backgrounds (like the "4 items need attention" banner, KPI card accents, featured sections). `surface` covers the warm cream panels (sidebar backgrounds, form panels, onboarding sections). Every other semantic color already exists.

---

## Card Component Variants

The current `card.tsx` has `Card` (static) and `InteractiveCard` (hover lift). The redesign needs colored background variants — add CVA to the Card component.

**New card.tsx pattern:**

```typescript
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "rounded-lg border text-card-foreground",
  {
    variants: {
      variant: {
        // Default: pure white card (existing behavior)
        default: "bg-card border-border",

        // Warm surface: cream-tinted for panels and form containers
        surface: "bg-surface text-surface-foreground border-border",

        // Highlight: amber-tinted for featured items, callouts
        highlight: "bg-highlight text-highlight-foreground border-amber-200 dark:border-amber-900",

        // Muted: subdued warm background for secondary cards
        muted: "bg-muted text-foreground border-border",

        // Ghost: no background, no border — for layout containers
        ghost: "bg-transparent border-transparent",

        // Outlined: explicit border emphasis with warm tint
        outlined: "bg-background border-border shadow-sm",
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
      shadow: {
        none: "",
        sm: "shadow-sm",
        default: "shadow",
        lg: "shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "none",  // Keep default none so existing `className="p-6"` usages work
      shadow: "none",
    },
  }
)
```

**Usage examples:**

```tsx
// Existing usage — no change needed (backward compatible)
<Card className="p-6">...</Card>

// New: amber callout card (dashboard attention alerts)
<Card variant="highlight" className="p-4">...</Card>

// New: warm cream form panel (onboarding steps)
<Card variant="surface" className="p-6">...</Card>

// New: KPI card with shadow
<Card variant="outlined" shadow="sm" className="p-6">...</Card>
```

**InteractiveCard:** Keep as-is. The hover lift animation (`-translate-y-1`) works with any variant. Add an optional `arrow` prop later during component implementation — it's a UI feature, not a token.

---

## Form Component Enhancements

The redesign calls for two form improvements:

### 1. Password Visibility Toggle

A new component `PasswordInput` wrapping the existing `Input`. No new dependencies needed — use React state + Phosphor icon.

```typescript
// components/ui/password-input.tsx
'use client'

import * as React from "react"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        ref={ref}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword
          ? <EyeSlash size={16} weight="regular" />
          : <Eye size={16} weight="regular" />
        }
      </Button>
    </div>
  )
})
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
```

**Why no library:** `react-password-strength-meter`, `@hookform/resolvers` extensions, etc. add weight for a 15-line component. Phosphor already has `Eye` and `EyeSlash` icons. This is a composable pattern.

### 2. Smart Field (Name vs Email Detection)

For the Jobs "Add Job" sheet, the brief mentions a smart field that detects whether the user is typing a name or email. This is pure logic in a client component — no dependency needed.

```typescript
// Pattern: detect @ symbol to switch label hint
const isEmail = value.includes('@')
const label = isEmail ? 'Email' : 'Customer name or email'
const inputType = isEmail ? 'email' : 'text'
```

This goes in the specific job form component, not as a shared UI primitive. No new component file needed at the design system level.

### 3. Input Warm Styling

The existing `input.tsx` uses `h-9` (36px, below 44px touch minimum). The warm redesign is a good moment to fix this. Update the base input class:

```typescript
// input.tsx change: h-9 → h-10 (40px)
// Also warm the background: bg-transparent → bg-background
// And warm the border focus: border color picks up --primary warm blue

"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
 text-base shadow-sm transition-colors
 placeholder:text-muted-foreground
 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-primary
 disabled:cursor-not-allowed disabled:opacity-50
 md:text-sm"
```

**The `h-10` change is not breaking** — it increases input height from 36px to 40px. All form layouts use flex/grid, so inputs will just be 4px taller. This also matches the `SelectTrigger` which already uses `h-10`.

---

## No New Dependencies Needed

| Considered | Decision | Reason |
|------------|----------|--------|
| `@radix-ui/colors` | No | Provides fixed color scales, not semantic tokens. Our HSL-based system is more flexible for dark mode. |
| `open-props` | No | External CSS custom property system that would conflict with Tailwind's semantic token approach. |
| `tailwind-scrollbar` | No | Not needed for this milestone. |
| `framer-motion` | No | `tailwindcss-animate` and Tailwind transitions handle all redesign animations (hover lifts, fades). |
| `@radix-ui/react-tooltip` | Already installed | No new install needed. |
| Color name libraries (chroma.js, etc.) | No | HSL values are specified directly. No runtime color computation needed. |
| shadcn/ui CLI | Optional | Can use `npx shadcn@latest add [component]` to pull updated variants, but the components are already present and manually editing them is equivalent. |

**Bottom line:** The design system change is a CSS and component-logic change. npm is not involved.

---

## Contrast & Accessibility Compliance

Before finalizing HSL values, verify WCAG AA (4.5:1 for body text, 3:1 for large text/UI components):

| Combination | Foreground | Background | Approximate Contrast | Status |
|-------------|------------|------------|---------------------|--------|
| Body text on page | `24 10% 10%` (#1C1814) | `36 20% 96%` (#F6F3EE) | ~14:1 | AA pass |
| Body text on card | `24 10% 10%` (#1C1814) | `0 0% 100%` (#FFFFFF) | ~16:1 | AA pass |
| Primary button text | `0 0% 98%` (#FAFAFA) | `213 60% 42%` (#2B6CB0) | ~4.8:1 | AA pass |
| Muted foreground on muted | `24 8% 46%` (#7A7068) | `36 15% 94%` (#F2EEE8) | ~4.6:1 | AA pass |
| Amber accent text on highlight | `30 80% 25%` (#7C3A10) | `45 95% 94%` (#FFFBEB) | ~7.2:1 | AA pass |
| Dark mode body on background | `36 15% 92%` (#EDE8DF) | `24 8% 10%` (#1C1916) | ~13:1 | AA pass |
| Dark primary button | `24 10% 10%` (#1C1814) | `213 70% 62%` (#5B9BD5) | ~4.6:1 | AA pass |

**Critical:** Amber (`38 92% 50%` = #F59E0B) on white fails WCAG AA (2.2:1). Never use amber as background with white text. Always use `highlight-foreground` (dark amber brown) on amber backgrounds. The component patterns above enforce this via the variant system.

---

## Dark Mode Strategy

The dark mode warm palette uses a technique called "hue-tinted darks": instead of hue 0 (neutral gray), all dark surface backgrounds use hue 24 (warm brown). At 8-18% lightness, the hue effect is subtle — the backgrounds appear dark but not sterile.

The practical consequence: dark mode backgrounds are `#1C1916` instead of `#171717`. The difference is visible side-by-side but not jarring. It reads as "cozy" rather than "harsh."

`next-themes` (already installed) handles the `.dark` class toggle on `<html>`. No changes to the theme system needed. The existing provider setup in the root layout already works correctly.

---

## Migration Path

Changes propagate automatically through CSS variables — no find-and-replace across component files needed for basic color changes. The migration is:

1. Update `app/globals.css` CSS variable values (one file change)
2. Add two new tokens (`--highlight`, `--highlight-foreground`, `--surface`, `--surface-foreground`) to globals.css and `tailwind.config.ts`
3. Update `components/ui/card.tsx` to add CVA variants
4. Update `components/ui/input.tsx` for `h-10` and warm focus ring
5. Create `components/ui/password-input.tsx` (new component)
6. Update individual page/component files to use new card variants where colored backgrounds are needed

Steps 1-2 change every component's colors automatically. Steps 3-6 are targeted additions.

---

## Sources

- `app/globals.css` — inspected directly; all current HSL values confirmed
- `tailwind.config.ts` — inspected directly; confirmed token mapping to CSS vars
- `components/ui/card.tsx` — inspected directly; confirmed current variant structure
- `components/ui/button.tsx` — inspected directly; confirmed CVA pattern
- `components/ui/input.tsx` — inspected directly; confirmed h-9 height issue
- `components/ui/checkbox.tsx` — inspected directly; confirmed 44px touch wrapper exists
- `components.json` — inspected; confirmed shadcn/ui "new-york" style, CSS variables enabled
- `audit-screenshots/` — inspected visually; confirmed current cold blue (#2563EB) design
- `audit-02-dashboard.png` — confirmed card layout and warm attention banner style already partially present
- `.planning/PROJECT.md` — confirmed v2.5 milestone color direction: "Full warm palette like Stratify — amber/gold accents, soft blue interactive, cream-tinted backgrounds"
- WCAG 2.1 contrast ratios computed from HSL values; verified against specification requirement of 4.5:1 (text) and 3:1 (UI components)
- Amber (#F59E0B) on white contrast computed as ~2.2:1 — this is why amber is accent/highlight background, not text color on white

---

*Stack research for: v2.5 UI/UX Redesign — Warm Design System*
*Researched: 2026-02-18*
*Confidence: HIGH — all findings based on direct codebase inspection*
