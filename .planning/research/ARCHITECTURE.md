# Architecture Patterns: v2.5 UI/UX Redesign

**Project:** AvisLoop v2.5 — Warm Design System Overhaul
**Researched:** 2026-02-18
**Confidence:** HIGH (direct codebase analysis, no guesswork)

## Overview

This document answers: how does a warm design system overhaul integrate with the existing component architecture? It maps every requested change to specific files, identifies new vs. modified components, and provides a dependency-safe build order.

The existing architecture is well-structured for this kind of overhaul:
- CSS custom properties in `globals.css` make palette changes surgical — update one file, everything follows
- CVA in `button.tsx` / `card.tsx` makes variant additions additive, not destructive
- Component boundaries are clean — no design logic mixed into business logic

The key architectural constraint: **no data model changes**. This milestone is pure UI. Every change is confined to `components/`, `app/globals.css`, and `tailwind.config.ts`.

---

## System Overview (Unchanged)

```
AppShell (server component, layout.tsx)
├── Sidebar (desktop, client component)
│   ├── NavLink (renders mainNav items)
│   └── "Add Job" CTA button (footer)
├── PageHeader (mobile, client component)
│   └── SetupProgressPill (via SetupProgress)
├── main content
│   ├── SetupProgress pill (desktop, sticky top-right)
│   └── {children} — page content
├── BottomNav (mobile, client component)
└── MobileFAB (mobile, client component)
```

All v2.5 changes are cosmetic/structural within this tree. No Server Action changes, no data fetching changes, no route changes (except the /send page deletion).

---

## Change 1: CSS Variable Migration (Warm Palette)

### What changes

`app/globals.css` — single file, complete replacement of the `:root` and `.dark` blocks.

**Current palette:** Cold blue-primary (`224 75% 43%`), pure-white cards, neutral grays.

**Target palette:** Warm amber/gold primary, slightly warm whites, warm-tinted darks.

### Recommended warm palette values

```css
/* app/globals.css — :root block replacement */
:root {
  /* Warm background: slightly warm off-white vs current neutral */
  --background: 36 20% 97%;        /* was: 0 0% 97.6% */
  --foreground: 20 14% 8%;          /* was: 0 0% 9% — warm near-black */

  /* Cards: warm white vs pure white */
  --card: 36 33% 99%;               /* was: 0 0% 100% */
  --card-foreground: 20 14% 8%;

  /* Popover: same as card */
  --popover: 36 33% 99%;
  --popover-foreground: 20 14% 8%;

  /* Primary: warm amber-gold */
  --primary: 38 92% 40%;            /* was: 224 75% 43% — amber */
  --primary-foreground: 36 60% 98%;

  /* Secondary: warm gray */
  --secondary: 36 10% 92%;         /* was: 0 0% 92% */
  --secondary-foreground: 20 14% 8%;

  /* Muted: warm near-white */
  --muted: 36 15% 96%;             /* was: 0 0% 97% */
  --muted-foreground: 20 8% 44%;   /* was: 0 0% 45% */

  /* Accent: same as primary (warm amber) */
  --accent: 38 92% 40%;            /* was: 224 75% 43% */
  --accent-foreground: 36 60% 98%;

  /* Accent colors: keep lime, replace coral with a warmer tone */
  --accent-lime: 75 85% 55%;       /* unchanged */
  --accent-coral: 15 85% 60%;      /* was: 0 85% 65% — slightly warmer red */

  /* Destructive: keep as-is, reds are fine */
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;

  /* Borders: warm-tinted */
  --border: 36 12% 88%;            /* was: 0 0% 89% */
  --input: 36 12% 88%;
  --ring: 38 92% 40%;              /* matches primary */

  /* Chart colors: update to match warm palette */
  --chart-1: 38 88% 55%;           /* warm amber */
  --chart-2: 160 58% 40%;          /* teal (unchanged) */
  --chart-3: 197 37% 28%;          /* deep teal (unchanged) */
  --chart-4: 25 80% 60%;           /* warm orange */
  --chart-5: 340 65% 55%;          /* muted rose */

  /* Status tokens: update clicked (was amber) to feel less primary */
  --status-pending-bg: 36 15% 96%;
  --status-pending-text: 36 20% 20%;
  --status-delivered-bg: 194 33% 94%;
  --status-delivered-text: 189 57% 40%;
  --status-clicked-bg: 38 90% 90%;
  --status-clicked-text: 25 100% 25%;
  --status-failed-bg: 0 100% 94%;
  --status-failed-text: 358 100% 38%;
  --status-reviewed-bg: 138 68% 92%;
  --status-reviewed-text: 149 100% 25%;

  --radius: 0.5rem;
}

.dark {
  --background: 20 10% 8%;         /* was: 0 0% 9% — warm dark */
  --foreground: 36 20% 96%;        /* was: 0 0% 98% — warm white */
  --card: 20 10% 11%;              /* was: 0 0% 12% — warm card */
  --card-foreground: 36 20% 96%;
  --popover: 20 10% 11%;
  --popover-foreground: 36 20% 96%;
  --primary: 38 90% 52%;           /* was: 224 75% 55% — amber, brighter in dark */
  --primary-foreground: 20 10% 8%;
  --secondary: 20 8% 16%;          /* was: 0 0% 15% */
  --secondary-foreground: 36 20% 96%;
  --muted: 20 8% 16%;
  --muted-foreground: 36 8% 62%;   /* was: 0 0% 64% */
  --accent: 38 90% 52%;
  --accent-foreground: 20 10% 8%;
  --accent-lime: 75 85% 50%;
  --accent-coral: 15 85% 58%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 20 8% 20%;             /* was: 0 0% 20% */
  --input: 20 8% 20%;
  --ring: 38 90% 52%;
  --chart-1: 38 80% 58%;
  --chart-2: 160 60% 48%;
  --chart-3: 30 75% 55%;
  --chart-4: 280 60% 62%;
  --chart-5: 340 70% 58%;
  --status-pending-bg: 36 10% 18%;
  --status-pending-text: 36 15% 78%;
  --status-delivered-bg: 189 25% 18%;
  --status-delivered-text: 189 57% 58%;
  --status-clicked-bg: 38 30% 20%;
  --status-clicked-text: 30 80% 55%;
  --status-failed-bg: 0 35% 18%;
  --status-failed-text: 358 80% 58%;
  --status-reviewed-bg: 149 25% 18%;
  --status-reviewed-text: 149 75% 48%;
}
```

### Key decisions

**Why amber not orange:** Amber (`38 92% 40%`) reads as "gold/trust" at 40% lightness — professional for service businesses. Orange (`~25°`) at the same lightness skews toward construction/utility brands. Amber is the safer bet for a reputation platform.

**Why keep status token hsl values compatible:** The `status.*` Tailwind tokens in `tailwind.config.ts` map to `hsl(var(--status-*))`. Only the CSS variable values change, not the token names. Zero consumer changes needed.

**tailwind.config.ts: no changes needed.** All color tokens already use `hsl(var(--...))` indirection. Palette update in globals.css flows through automatically.

### Files touched

| File | Change |
|------|--------|
| `app/globals.css` | Replace `:root` and `.dark` variable values |
| `tailwind.config.ts` | No change — tokens already indirect |

### Integration points

Every component that uses `bg-primary`, `text-primary`, `bg-card`, `border-border`, `text-muted-foreground`, etc. automatically picks up the new palette. No component files need editing for the palette change alone.

**Exception:** Components with hardcoded hex values bypass CSS variables. Current audit:
- `sidebar.tsx` line 89: `bg-[#F2F2F2]` — replace with `bg-muted` (warm equivalent)
- `sidebar.tsx` line 90: `dark:bg-muted` — already token-based, fine
- `sidebar.tsx` line 121: `bg-white` — replace with `bg-card`
- `app-shell.tsx` line 32: `bg-[#F9F9F9]` — replace with `bg-background`
- `page-header.tsx` line 28: `bg-white` — replace with `bg-card`
- `sidebar.tsx` lines 126, 164, 180: `border-[#E2E2E2]` — replace with `border-border`
- `page-header.tsx` line 28: `border-[#E2E2E2]` — replace with `border-border`

These hardcoded values are the only components that need a code edit for the palette migration.

---

## Change 2: Card Colored Background Variants

### What changes

`components/ui/card.tsx` — add CVA-based variant prop to `Card`.

### Current state

`Card` has no variants. It renders `rounded-lg border bg-card text-card-foreground`. Any color variation requires `className` overrides at the call site.

### Recommended architecture

Add CVA to `Card` so colors are type-safe and consistent. Keep `InteractiveCard` as a separate component (it has distinct interaction semantics).

```typescript
// components/ui/card.tsx — new Card with variants

import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "rounded-lg border text-card-foreground",
  {
    variants: {
      variant: {
        // Default: existing behavior
        default: "bg-card",
        // Amber tint: for CTA cards, "ready to send" queue, highlights
        amber: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40",
        // Blue tint: for info cards, tips
        blue: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40",
        // Green tint: for success states, completed items
        green: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/40",
        // Red tint: for warning/error states, attention alerts
        red: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/40",
        // Ghost: no background, no border — for nested cards
        ghost: "border-transparent bg-transparent",
        // Subtle: muted background — for secondary content areas
        subtle: "bg-muted/50 border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card"
    className={cn(cardVariants({ variant }), className)}
    {...props}
  />
))
```

### InteractiveCard: arrow-on-hover pattern

Replace translate-y hover with an arrow indicator that appears on hover.

```typescript
// InteractiveCard — arrow-on-hover

const InteractiveCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
>(({ className, variant, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="interactive-card"
    className={cn(
      cardVariants({ variant }),
      "transition-all duration-200 cursor-pointer group",
      "hover:shadow-sm hover:border-border/80",
      // Remove: motion-safe:hover:-translate-y-1
      className,
    )}
    {...props}
  >
    {children}
  </div>
))
```

The arrow indicator is added by the consuming component, not by `InteractiveCard` itself. `InteractiveCard` only provides the hover container state via the `group` class. The consuming component adds:

```tsx
// Usage example in kpi-widgets.tsx
<InteractiveCard className="p-6 relative">
  {/* existing content */}
  <ArrowRight
    size={16}
    className="absolute bottom-4 right-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
  />
</InteractiveCard>
```

This keeps `InteractiveCard` generic — the arrow is a consuming concern, not a component API concern.

### Files touched

| File | Change |
|------|--------|
| `components/ui/card.tsx` | Add CVA `cardVariants`, add `variant` prop to `Card` and `InteractiveCard`, remove `-translate-y-1` hover |
| `components/dashboard/kpi-widgets.tsx` | Add `ArrowRight` indicator to `InteractiveCard` usages |
| `components/send/send-page-client.tsx` | Update amber banner to use `<Card variant="amber">` |
| `components/onboarding/steps/sms-consent-step.tsx` | Update blue consent card to `<Card variant="blue">` |

### Integration points

All existing `<Card>` usages continue to work — `variant` defaults to `"default"`. No breaking changes. Consuming components opt in to tinted variants explicitly.

**Where to apply colored variants immediately:**

| Location | Recommended Variant | Current |
|----------|---------------------|---------|
| Send page friction warning | `variant="amber"` | Hardcoded amber classes |
| SMS consent acknowledgment box | `variant="blue"` | Hardcoded blue classes |
| Dashboard attention alerts | `variant="red"` | Custom classes |
| Onboarding "all set" confirmation | `variant="green"` | Custom classes |
| Dashboard "Ready to Send" queue | `variant="amber"` | Default card |

---

## Change 3: Button Warm CTA Variant

### What changes

`components/ui/button.tsx` — add one variant.

### Current state

`default` variant uses `bg-primary`. With warm palette, this is now amber. For the primary CTA (e.g., "Complete Job"), this is correct. No new variant strictly needed.

**However**, if the design calls for a distinctly warm CTA that differs from the primary (e.g., an orange-toned button vs. the amber primary), add:

```typescript
// In buttonVariants cva — add to variants.variant:
cta: "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500/20 shadow-sm",
```

**Recommendation:** Start with `default` (now amber). Only add `cta` variant if the designer confirms a need for two distinct warm tones. Premature variant proliferation creates maintenance debt.

### Files touched

| File | Change |
|------|--------|
| `components/ui/button.tsx` | Add `cta` variant (optional, defer until confirmed needed) |

---

## Change 4: Password Toggle Component

### What changes

New file: `components/ui/password-input.tsx`

This is a **new component**, not a modification to `Input`. The `Input` component stays unchanged. `PasswordInput` wraps it with show/hide state.

### Architecture

```typescript
// components/ui/password-input.tsx
'use client'

import * as React from "react"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  className?: string
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
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
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeSlash size={16} weight="regular" />
          ) : (
            <Eye size={16} weight="regular" />
          )}
        </Button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
```

**Why `tabIndex={-1}` on the toggle button:** Password toggles should not appear in tab order. Users tab to the password field, type, then tab forward. The toggle is a pointing-device convenience, not a keyboard navigation target.

**Why Phosphor icons:** `Eye` and `EyeSlash` from `@phosphor-icons/react` match the existing icon library (sidebar, bottom-nav, etc.). Do not use Lucide here.

### Files touched

| File | Change |
|------|--------|
| `components/ui/password-input.tsx` | NEW — PasswordInput component |
| `components/login-form.tsx` | Replace `<Input type="password">` with `<PasswordInput>` |
| `components/sign-up-form.tsx` | Replace `<Input type="password">` with `<PasswordInput>` |
| `components/update-password-form.tsx` | Replace `<Input type="password">` with `<PasswordInput>` |

### Integration points

`PasswordInput` uses the existing `Input` component internally. Any `Input` className customizations (e.g., `className="text-lg h-12"`) pass through via `...props`. The only constraint: avoid passing `type` (it's controlled internally) or `pr-*` padding (already set to `pr-10`).

---

## Change 5: Smart Field (Auto-Detect Name vs. Email)

### What changes

New file: `components/ui/smart-field.tsx`

This is specifically for the manual request modal (extracted from `quick-send-tab.tsx`). The smart field accepts a single text input and auto-detects whether the user is typing a name, email, or phone number based on input characteristics.

### Architecture

```typescript
// components/ui/smart-field.tsx
'use client'

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type FieldType = "name" | "email" | "phone" | "unknown"

interface SmartFieldProps extends React.ComponentProps<"input"> {
  onTypeDetected?: (type: FieldType) => void
}

function detectType(value: string): FieldType {
  if (!value.trim()) return "unknown"
  if (value.includes("@")) return "email"
  // Phone: contains only digits, spaces, dashes, parens, plus
  if (/^[\d\s\-().+]+$/.test(value.trim()) && value.replace(/\D/g, "").length >= 7) return "phone"
  // Name: only letters, spaces, apostrophes, hyphens
  if (/^[a-zA-Z\s'-]+$/.test(value.trim()) && value.trim().length >= 2) return "name"
  return "unknown"
}

const SmartField = React.forwardRef<HTMLInputElement, SmartFieldProps>(
  ({ className, onChange, onTypeDetected, ...props }, ref) => {
    const [detectedType, setDetectedType] = React.useState<FieldType>("unknown")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const type = detectType(e.target.value)
      if (type !== detectedType) {
        setDetectedType(type)
        onTypeDetected?.(type)
      }
      onChange?.(e)
    }

    // Derive appropriate autocomplete hint
    const autoComplete = {
      name: "name",
      email: "email",
      phone: "tel",
      unknown: "off",
    }[detectedType]

    // Derive inputMode for mobile keyboards
    const inputMode: React.HTMLAttributes<HTMLInputElement>["inputMode"] = {
      name: "text",
      email: "email",
      phone: "tel",
      unknown: "text",
    }[detectedType]

    return (
      <div className="relative">
        <Input
          ref={ref}
          className={cn(
            detectedType !== "unknown" && "pr-20",
            className
          )}
          onChange={handleChange}
          autoComplete={autoComplete}
          inputMode={inputMode}
          {...props}
        />
        {detectedType !== "unknown" && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {detectedType}
          </span>
        )}
      </div>
    )
  }
)
SmartField.displayName = "SmartField"

export { SmartField, detectType, type FieldType }
```

**Design note:** The smart field shows a subtle type indicator (`name`, `email`, `phone`) as the user types. This provides feedback without interrupting flow. The `onTypeDetected` callback allows the parent to adjust form structure (e.g., show additional fields when email is detected).

### Files touched

| File | Change |
|------|--------|
| `components/ui/smart-field.tsx` | NEW — SmartField component |
| `components/send/quick-send-modal.tsx` | NEW — use SmartField for customer lookup |

---

## Change 6: Manual Request Page Elimination + Modal Extraction

### What changes

This is the largest structural change. The `/send` route is eliminated and its functionality becomes a reusable modal.

### Current state

```
app/(dashboard)/send/page.tsx        — Server Component, fetches data
components/send/send-page-client.tsx — Client shell with friction banner + tabs
components/send/quick-send-tab.tsx   — Quick send form (this functionality is preserved)
components/send/bulk-send-tab.tsx    — Bulk send form (access via activity page)
```

### Target state

```
app/(dashboard)/send/page.tsx        — DELETED (or redirect to /dashboard)
components/send/quick-send-modal.tsx — NEW: Dialog wrapping QuickSendTab logic
components/send/quick-send-tab.tsx   — MODIFIED: extract form to be usable standalone
components/send/send-page-client.tsx — DELETED (functionality migrated)
```

### Architecture for the modal

The modal follows the same Dialog pattern already used throughout the app (`components/ui/dialog.tsx`).

```typescript
// components/send/quick-send-modal.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Warning } from "@phosphor-icons/react"
import { QuickSendForm } from "./quick-send-form"
import type { Customer, Business, MessageTemplate } from "@/lib/types/database"

interface QuickSendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  business: Business & { message_templates?: MessageTemplate[] }
  templates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
  // Optional pre-fill for "Send to this customer" from other pages
  prefilledCustomer?: Customer
}

export function QuickSendModal({
  open,
  onOpenChange,
  customers,
  business,
  templates,
  monthlyUsage,
  hasReviewLink,
  prefilledCustomer,
}: QuickSendModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manual Request</DialogTitle>
          <DialogDescription>
            For one-off situations. Campaigns handle recurring follow-up automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Friction warning — preserved from send page */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20 text-sm">
          <Warning className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" weight="fill" />
          <p className="text-amber-800 dark:text-amber-200">
            Campaigns handle review requests automatically. Use this only for one-off customers.
          </p>
        </div>

        <QuickSendForm
          customers={customers}
          business={business}
          templates={templates}
          monthlyUsage={monthlyUsage}
          hasReviewLink={hasReviewLink}
          prefilledCustomer={prefilledCustomer}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
```

### Extracting QuickSendForm from QuickSendTab

`quick-send-tab.tsx` currently contains both the form UI and the wrapper card. Split into:

```
components/send/quick-send-form.tsx   — NEW: pure form logic (extracted from quick-send-tab)
components/send/quick-send-tab.tsx    — MODIFIED: thin wrapper around QuickSendForm (if kept)
```

`QuickSendForm` accepts the same props as `QuickSendTab` plus `onSuccess` callback and optional `prefilledCustomer`. The form logic (customer search, SMS, scheduling) stays identical — only the outer wrapper changes.

### Data flow for the modal

The modal needs the same data as the current send page. Since it appears in multiple places, data must be fetched at the AppShell level or by each consuming page.

**Recommended approach: fetch on demand at each consumer.**

The modal is opened contextually (e.g., "Send to this customer" on the campaigns page). The parent page already has access to `business` and `templates` from its own server fetch. Customers can be fetched lazily when the modal opens.

```typescript
// Example: campaigns page adds quick send modal
// app/(dashboard)/campaigns/page.tsx (server component)

// Already fetches: campaigns, business
// Add: customers (lightweight, same RLS pattern)
const customers = await getCustomers({ limit: 200, status: 'active' })

// Pass to client component which manages modal state
<CampaignsPageClient
  campaigns={campaigns}
  business={business}
  customers={customers}      // new prop
  templates={templates}      // new prop (if not already fetched)
/>
```

This avoids a global data context. Each page fetches what it needs. The modal is data-driven from the page.

### Navigation changes

When the `/send` page is deleted, the nav items must be updated:

```typescript
// components/layout/sidebar.tsx — remove from mainNav:
{ icon: PaperPlaneTilt, label: 'Manual Request', href: '/send' }

// components/layout/bottom-nav.tsx — remove:
{ icon: PaperPlaneTilt, label: 'Manual', href: '/send' }
```

If a hard redirect is preferred over deletion (for crawlers/bookmarks):

```typescript
// app/(dashboard)/send/page.tsx — replace with:
import { redirect } from 'next/navigation'
export default function SendPage() {
  redirect('/campaigns')
}
```

### Where the modal appears

| Location | Trigger | Data source |
|----------|---------|-------------|
| Campaigns page | "Manual Request" button in header | Page-level fetch |
| Customer detail drawer | "Send" button in action row | Drawer already has customer |
| Dashboard (optional) | "Manual Request" in notification bell overflow | Page-level fetch |
| Add Job sheet (optional) | "Send now" escape hatch post-completion | Already has customer |

### Files touched

| File | Change |
|------|--------|
| `app/(dashboard)/send/page.tsx` | DELETE or redirect to /campaigns |
| `components/send/send-page-client.tsx` | DELETE |
| `components/send/quick-send-tab.tsx` | MODIFY — extract form into QuickSendForm |
| `components/send/quick-send-form.tsx` | NEW — extracted form component |
| `components/send/quick-send-modal.tsx` | NEW — Dialog wrapper |
| `components/layout/sidebar.tsx` | Remove "Manual Request" nav item |
| `components/layout/bottom-nav.tsx` | Remove "Manual" nav item |
| `app/(dashboard)/campaigns/page.tsx` | Add customers/templates to server fetch |
| `components/campaigns/campaigns-page-client.tsx` | Add modal state + trigger button |
| `components/customers/customer-detail-drawer.tsx` | Replace "Send" button with modal trigger |

---

## Change 7: Onboarding Step Consolidation (7 → 5 Steps)

### What changes

Multiple files in `components/onboarding/steps/` and the wizard shell.

### Current 7 steps

| # | Step | Skippable | Recommendation |
|---|------|-----------|----------------|
| 1 | Business Basics (name, phone) | No | Keep |
| 2 | Review Destination (Google link) | Yes | **Merge into Step 1** |
| 3 | Services Offered | No | Keep (renumber to 2) |
| 4 | Software Used | Yes | **Remove** (low value, no integration built) |
| 5 | Campaign Preset | No | Keep (renumber to 3) |
| 6 | Import Jobs (CSV) | Yes | Keep but make opt-in only (renumber to 4) |
| 7 | SMS Consent | No | Keep (renumber to 5) |

### Consolidated 5 steps

| # | Step | Content | Skippable |
|---|------|---------|-----------|
| 1 | Business Setup | Name + phone + Google link (all in one form) | No |
| 2 | Services | Multi-select service types | No |
| 3 | Campaign Preset | Fast/Standard/Slow picker | No |
| 4 | Import Past Jobs | CSV upload (optional) | Yes |
| 5 | SMS Consent | TCPA acknowledgment | No |

### Implementation approach

**Option A (Merge in shell):** The wizard shell dispatches step 1 → BusinessBasicsStep (which already has the Google link field, per existing code). Step 2 (ReviewDestinationStep) is removed from STEPS config. The existing `BusinessBasicsStep` already collects `google_review_link` — no step component changes needed, only the STEPS array and `OnboardingSteps` switch.

**Option B (New merged step):** Create `BusinessSetupStep` that combines the fields from both steps 1 and 2 with a single save action.

**Recommendation: Option A.** The current `BusinessBasicsStep` already collects all three fields (name, phone, Google link). Removing step 2 from the STEPS array is sufficient. The `ReviewDestinationStep` file can be deprecated.

```typescript
// components/onboarding/onboarding-wizard.tsx — updated STEPS array:
const STEPS: StepConfig[] = [
  { id: 1, title: 'Business Setup', skippable: false },
  // Step 2 (Review Destination) REMOVED — merged into step 1
  { id: 2, title: 'Services Offered', skippable: false },   // was 3
  // Step 4 (Software Used) REMOVED
  { id: 3, title: 'Campaign Preset', skippable: false },    // was 5
  { id: 4, title: 'Import Past Jobs', skippable: true },    // was 6
  { id: 5, title: 'SMS Consent', skippable: false },        // was 7
]
```

```typescript
// components/onboarding/onboarding-steps.tsx — updated switch:
switch (currentStep) {
  case 1:
    return <BusinessBasicsStep ... />  // unchanged
  case 2:
    return <ServicesOfferedStep ... />  // was case 3
  case 3:
    return <CampaignPresetStep ... />   // was case 5
  case 4:
    return <CustomerImportStep ... />   // was case 6
  case 5:
    return <SMSConsentStep ... />       // was case 7
  default:
    return null
}
```

**Progress bar:** `OnboardingProgress` receives `totalSteps={STEPS.length}` which is now 5. No component changes needed — the bar auto-scales.

### Files touched

| File | Change |
|------|--------|
| `components/onboarding/onboarding-wizard.tsx` | Update `STEPS` array (7 → 5), update `STEPS.length` references |
| `components/onboarding/onboarding-steps.tsx` | Update switch statement (remove cases 2, 4; renumber 3→2, 5→3, 6→4, 7→5) |
| `components/onboarding/steps/review-destination-step.tsx` | No change (just no longer used; keep file for reference) |
| `components/onboarding/steps/software-used-step.tsx` | No change (just no longer used; keep file for reference) |
| `lib/actions/onboarding.ts` | Verify `saveReviewDestination` is still called from `BusinessBasicsStep` (it should be — check action invoked by step 1) |

### Data consideration

`BusinessBasicsStep` currently calls `saveBusinessBasics()` which saves name, phone, and google_review_link. The standalone `ReviewDestinationStep` calls `saveReviewDestination()` separately. After consolidation, ensure `saveBusinessBasics()` saves all three fields — which it already does per the existing code. No server action changes needed.

---

## Change 8: Getting Started Pill Redesign

### What changes

`components/onboarding/setup-progress-pill.tsx` and its placement in `components/layout/app-shell.tsx` / `components/layout/page-header.tsx`.

### Current state

**Desktop:** Sticky `div` at top-right of content area, `z-10`. Renders `SetupProgress` which renders `SetupProgressPill`.

**Mobile:** Below `PageHeader`, `flex justify-center`.

**Pill (incomplete):** `rounded-full px-3 py-1.5 bg-primary/10 text-primary border border-primary/20`. Small, subtle.

**Pill (complete):** Green badge with checkmark.

### Issues with current design

1. Desktop pill sits in content area flow — when the page scrolls, the pill covers content (z-10 + sticky)
2. Mobile pill is centered below header — reads as secondary content, easily missed
3. Primary/10 tint on the incomplete pill will become amber after palette change — review that it still reads correctly
4. The `>` caret is not semantic: `text-[10px]` character

### Recommended redesign

**Desktop:** Move pill into the sidebar footer area (below "Add Job" button, above the account menu). This removes the overlay issue entirely.

```typescript
// components/layout/sidebar.tsx — add pill between Add Job and account menu
// The sidebar already receives setupProgress-derived data via AppShell

// In sidebar footer:
{showSetupProgress && (
  <div className={cn("px-3 py-2", collapsed && "hidden")}>
    <SetupProgress ... />
  </div>
)}
```

This requires `AppShell` to pass `setupProgress` to `Sidebar`. Currently, `Sidebar` only receives `dashboardBadge` and `notificationCounts`. Add `setupProgress` to `SidebarProps`.

**Mobile:** Keep below header but improve visual weight. Pill should be amber (warm primary) and full-width-friendly:

```typescript
// setup-progress-pill.tsx — incomplete state:
<button
  onClick={onOpenDrawer}
  className={cn(
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
    'bg-primary text-primary-foreground',     // solid, not /10 tint
    'shadow-sm hover:shadow transition-all',
  )}
>
  <span>Getting Started</span>
  <span className="bg-primary-foreground/20 rounded-full px-1.5 py-0.5 text-xs font-bold">
    {completedCount}/{totalCount}
  </span>
</button>
```

Using solid `bg-primary` (now amber) makes the pill unmissable. The count badge inset creates visual hierarchy.

**Complete state:** Keep the green success badge as-is — it's visually appropriate.

### Files touched

| File | Change |
|------|--------|
| `components/onboarding/setup-progress-pill.tsx` | Redesign incomplete state style |
| `components/layout/sidebar.tsx` | Add pill render in footer (requires setupProgress prop) |
| `components/layout/app-shell.tsx` | Pass setupProgress to Sidebar; remove sticky overlay div |
| `components/layout/page-header.tsx` | Optionally simplify mobile pill placement |

### Integration point

`AppShell` already has `setupProgress` in its props. It currently passes it to `PageHeader` and renders the sticky overlay separately. After this change:
- Pass `setupProgress` to `Sidebar` as a new prop
- Remove the sticky overlay `div` from `app-shell.tsx`
- `PageHeader` keeps mobile pill (simplified)

---

## Component Dependency Map

```
globals.css (palette)
    └── ALL components (automatic via CSS variables)
        └── Hardcoded hex overrides in sidebar.tsx, app-shell.tsx, page-header.tsx
            (manual update required)

card.tsx (variants)
    ├── kpi-widgets.tsx (InteractiveCard arrow)
    ├── send-page-client.tsx (amber warning → Card variant="amber")
    ├── sms-consent-step.tsx (blue consent → Card variant="blue")
    └── [future consumers via variant prop]

password-input.tsx (new)
    ├── login-form.tsx
    ├── sign-up-form.tsx
    └── update-password-form.tsx

smart-field.tsx (new)
    └── quick-send-form.tsx (new)

quick-send-form.tsx (extracted)
    └── quick-send-modal.tsx (new)
        ├── campaigns-page-client.tsx
        └── customer-detail-drawer.tsx

onboarding-wizard.tsx (STEPS array)
    └── onboarding-steps.tsx (switch statement)
        └── [no step component changes]

setup-progress-pill.tsx (style)
    └── setup-progress.tsx (no change)
        ├── sidebar.tsx (new render location, desktop)
        └── page-header.tsx (mobile, simplified)

sidebar.tsx (nav items, pill location)
bottom-nav.tsx (nav items)
```

---

## Build Order

Dependencies determine the order. Changes are grouped so each phase produces a shippable increment.

### Phase 1: Palette migration (foundation)

**What:** Update `globals.css` variables, fix hardcoded hex values.

**Files:**
1. `app/globals.css` — new `:root` and `.dark` values
2. `components/layout/sidebar.tsx` — replace `#F2F2F2`, `bg-white`, `border-[#E2E2E2]`
3. `components/layout/app-shell.tsx` — replace `bg-[#F9F9F9]`
4. `components/layout/page-header.tsx` — replace `bg-white`, `border-[#E2E2E2]`

**Why first:** Everything visual changes when the palette changes. Build on top of the new palette so all subsequent changes look correct.

**Verification:** Visit all pages in light + dark mode. Check for any remaining cold blue elements.

### Phase 2: Card variants (component foundation)

**What:** Add CVA to Card, update InteractiveCard hover pattern.

**Files:**
1. `components/ui/card.tsx` — add variants, update InteractiveCard
2. `components/dashboard/kpi-widgets.tsx` — add arrow indicators
3. `components/send/send-page-client.tsx` — replace amber banner with Card variant

**Why second:** Card variants unlock the colored backgrounds used in phase 3+ components. InteractiveCard change affects KPI widgets immediately.

### Phase 3: Form component enhancements

**What:** Password input, smart field.

**Files:**
1. `components/ui/password-input.tsx` — new
2. `components/login-form.tsx` — use PasswordInput
3. `components/sign-up-form.tsx` — use PasswordInput
4. `components/update-password-form.tsx` — use PasswordInput
5. `components/ui/smart-field.tsx` — new

**Why third:** Independent of all other changes. Can be built in parallel with phase 2.

### Phase 4: Onboarding consolidation

**What:** Reduce from 7 to 5 steps.

**Files:**
1. `components/onboarding/onboarding-wizard.tsx` — update STEPS array
2. `components/onboarding/onboarding-steps.tsx` — update switch

**Why fourth:** Independent of card/palette changes. Only dependency is having the existing step components (which don't change). Test the full wizard flow after.

### Phase 5: Getting started pill redesign

**What:** Redesign pill, move to sidebar.

**Files:**
1. `components/onboarding/setup-progress-pill.tsx` — redesign styles
2. `components/layout/sidebar.tsx` — add setupProgress prop + render location
3. `components/layout/app-shell.tsx` — pass setupProgress to Sidebar, remove sticky overlay

**Why fifth:** Depends on palette (phase 1) for correct amber styling. Depends on sidebar structure being stable.

### Phase 6: Manual Request elimination

**What:** Extract QuickSendForm, create modal, remove /send page, update nav.

**Files (in order):**
1. `components/send/quick-send-form.tsx` — extract form logic from quick-send-tab
2. `components/send/quick-send-modal.tsx` — Dialog wrapper
3. `components/layout/sidebar.tsx` — remove nav item
4. `components/layout/bottom-nav.tsx` — remove nav item
5. `app/(dashboard)/campaigns/page.tsx` — add data fetch
6. `components/campaigns/campaigns-page-client.tsx` — add modal trigger
7. `components/customers/customer-detail-drawer.tsx` — update Send button
8. `app/(dashboard)/send/page.tsx` — add redirect or delete

**Why last:** Largest change, most files, most risk. Everything else should be stable before this. Build and test each consumer (campaigns, customer drawer) before deleting the send page. Keep the redirect active until confirmed working.

---

## New Components Summary

| Component | File | Purpose | Depends On |
|-----------|------|---------|------------|
| `PasswordInput` | `components/ui/password-input.tsx` | Password field with show/hide | `Input`, `Button`, Phosphor |
| `SmartField` | `components/ui/smart-field.tsx` | Type-detecting input | `Input` |
| `QuickSendForm` | `components/send/quick-send-form.tsx` | Extracted send form | Existing actions, types |
| `QuickSendModal` | `components/send/quick-send-modal.tsx` | Dialog wrapper for manual send | `Dialog`, `QuickSendForm`, `Card` |

## Modified Components Summary

| Component | File | Change Type |
|-----------|------|-------------|
| `Card` | `components/ui/card.tsx` | Add CVA variants |
| `InteractiveCard` | `components/ui/card.tsx` | Replace translate hover with shadow hover |
| `SetupProgressPill` | `components/onboarding/setup-progress-pill.tsx` | Style incomplete state |
| `Sidebar` | `components/layout/sidebar.tsx` | Add setupProgress prop, pill render, remove nav item, fix hardcoded colors |
| `AppShell` | `components/layout/app-shell.tsx` | Pass setupProgress to Sidebar, remove sticky overlay, fix hardcoded bg |
| `PageHeader` | `components/layout/page-header.tsx` | Fix hardcoded colors |
| `BottomNav` | `components/layout/bottom-nav.tsx` | Remove Manual nav item |
| `OnboardingWizard` | `components/onboarding/onboarding-wizard.tsx` | Update STEPS array |
| `OnboardingSteps` | `components/onboarding/onboarding-steps.tsx` | Update switch cases |
| `KPIWidgets` | `components/dashboard/kpi-widgets.tsx` | Add arrow indicators to InteractiveCard |
| `LoginForm` | `components/login-form.tsx` | Use PasswordInput |
| `SignUpForm` | `components/sign-up-form.tsx` | Use PasswordInput |
| `UpdatePasswordForm` | `components/update-password-form.tsx` | Use PasswordInput |
| `SendPageClient` | `components/send/send-page-client.tsx` | DELETE |
| `QuickSendTab` | `components/send/quick-send-tab.tsx` | Extract form to QuickSendForm |

## Deleted Files

| File | Replacement |
|------|-------------|
| `app/(dashboard)/send/page.tsx` | Redirect to `/campaigns` |
| `components/send/send-page-client.tsx` | `quick-send-modal.tsx` |

---

## Anti-Patterns to Avoid

### 1. Changing CSS variable names

**Bad:** Rename `--primary` to `--amber` or add `--warm-primary` alongside `--primary`.

**Why bad:** Every component in the codebase uses `text-primary`, `bg-primary`, `ring-primary`, etc. Renaming breaks everything simultaneously. The value of the token changes; the name stays the same.

**Do instead:** Change the HSL value of `--primary` in `globals.css`. All consumers update automatically.

### 2. Adding card variants as separate components

**Bad:** Creating `AmberCard`, `BlueCard`, `GreenCard` as separate component files.

**Why bad:** Creates N import paths, duplicates prop surface area, makes future changes require touching N files. Divergence guaranteed over time.

**Do instead:** Single `Card` with `variant` prop via CVA. One import path, one change point.

### 3. Global data fetch for manual send modal

**Bad:** Fetch customers/templates in `app/(dashboard)/layout.tsx` and pass down via context to make them available everywhere for the modal.

**Why bad:** Every dashboard page load fetches customer data even on pages that never show the modal. Adds ~200ms+ to every page load.

**Do instead:** Fetch at the page level in each page that renders the modal trigger. The modal is context-specific (campaigns page, customer drawer); only those pages need the data.

### 4. Blocking /send route before modal is working

**Bad:** Delete `app/(dashboard)/send/page.tsx` and remove nav items before `QuickSendModal` is deployed and tested.

**Why bad:** Users who bookmarked `/send` or who relied on the nav item now have no way to manually send. This is an active feature regression.

**Do instead:** Add redirect from `/send` to `/campaigns` as the first step. Deploy the modal on the campaigns page. Verify it works in production. Then remove the redirect.

### 5. Inlining card color classes instead of using variants

**Bad:**
```tsx
<Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20">
```

**Why bad:** These color strings appear in dozens of places. Dark mode handling is repeated everywhere. If the amber shade changes, find-replace across the codebase.

**Do instead:**
```tsx
<Card variant="amber">
```

One source of truth. Dark mode handled once in the variant definition.

---

## Sources

All findings from direct codebase analysis (2026-02-18):

| File | Purpose of analysis |
|------|---------------------|
| `app/globals.css` | Current CSS variable values, palette mapping |
| `tailwind.config.ts` | Color token structure, indirection via `hsl(var(...))` |
| `components/ui/card.tsx` | Current Card/InteractiveCard implementation |
| `components/ui/button.tsx` | CVA pattern, existing variant structure |
| `components/ui/input.tsx` | Base input for PasswordInput wrapper |
| `components/ui/checkbox.tsx` | Touch-target wrapper pattern (reference for PasswordInput toggle) |
| `components/layout/sidebar.tsx` | Nav items, hardcoded colors, footer structure |
| `components/layout/bottom-nav.tsx` | Mobile nav items |
| `components/layout/app-shell.tsx` | AppShell props, SetupProgress placement, hardcoded bg |
| `components/layout/page-header.tsx` | Mobile header, pill placement |
| `components/onboarding/onboarding-wizard.tsx` | STEPS array, step navigation |
| `components/onboarding/onboarding-steps.tsx` | Step component dispatch |
| `components/onboarding/steps/business-basics-step.tsx` | Already collects google_review_link |
| `components/onboarding/steps/review-destination-step.tsx` | Redundant with step 1 |
| `components/onboarding/steps/software-used-step.tsx` | No active integration, removal candidate |
| `components/onboarding/setup-progress-pill.tsx` | Current pill design |
| `components/onboarding/setup-progress.tsx` | SetupProgress state management |
| `components/send/send-page-client.tsx` | Shell being eliminated |
| `components/send/quick-send-tab.tsx` | Form logic to be extracted |
| `components/login-form.tsx` | Password field pattern |
| `components/dashboard/kpi-widgets.tsx` | InteractiveCard usage |
| `components/campaigns/campaign-card.tsx` | Where manual send modal will be added |
| `app/(dashboard)/layout.tsx` | AppShell props interface |

**Confidence level by area:**

| Area | Confidence | Basis |
|------|------------|-------|
| CSS variable migration | HIGH | Direct variable inspection + Tailwind token map |
| Card variant additions | HIGH | CVA pattern already established in button.tsx |
| PasswordInput architecture | HIGH | Same pattern as existing input.tsx + Button usage |
| SmartField design | MEDIUM | Reasonable approach; exact UX behavior TBD with designer |
| Manual send modal | HIGH | Dialog pattern well-established; data flow clear |
| Onboarding consolidation | HIGH | Step 1 already collects all step-2 fields |
| Pill redesign location | MEDIUM | Sidebar location is recommended; exact CSS TBD |
