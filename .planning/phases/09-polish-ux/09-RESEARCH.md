# Phase 9: Polish & UX - Research

**Researched:** 2026-01-27
**Domain:** Next.js 15 App Router UX/UI Polish with shadcn/ui + Tailwind CSS
**Confidence:** HIGH

## Summary

This research covers implementing a consistent, polished visual design system across a Next.js 15 App Router application using the existing shadcn/ui (New York style) + Tailwind CSS stack. The phase focuses on visual consistency, state handling, responsive design, and smooth interactions without adding new features.

The standard approach leverages Next.js 15's built-in loading.js convention with React Suspense for skeleton screens, shadcn/ui's Sonner component for toast notifications, Tailwind CSS animation utilities for micro-interactions, and CSS variables for consistent theming. The CONTEXT.md decisions lock in specific visual choices (light gray background, blue accent, medium corner radius, subtle animations) that match the reference design aesthetic.

Key findings show that modern UX polish in 2026 emphasizes perceived performance through skeleton screens (reducing CLS), accessibility through prefers-reduced-motion support, and consistency through design tokens defined as CSS variables. Common pitfalls include layout shifts from missing skeleton dimensions, inconsistent spacing/colors from manual values, and poor mobile experience from desktop-first thinking.

**Primary recommendation:** Use Next.js loading.js files with dimensioned skeleton screens, shadcn/ui Sonner for toasts, Tailwind CSS variables for all design tokens, and implement localStorage persistence for UI preferences with proper SSR handling.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.x (latest) | Loading states, Suspense boundaries | Built-in loading.js convention, streaming SSR, automatic code splitting |
| shadcn/ui | New York style | UI component system | Already installed, CSS variable-based theming, Radix UI primitives |
| Tailwind CSS | 3.4.1 | Styling framework | Already configured with tailwindcss-animate, design token support |
| Sonner | via shadcn/ui | Toast notifications | Official shadcn/ui recommendation (replaced deprecated toast) |
| Recharts | via shadcn/ui charts | Donut charts for usage display | Official shadcn/ui charts library, CSS variable integration |
| lucide-react | 0.511.0 | Icon library | Already installed, consistent with shadcn/ui ecosystem |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss-animate | 1.0.7 | Animation utilities | Already installed for transitions/micro-interactions |
| class-variance-authority | 0.7.1 | Component variant system | Already installed for button states, hover effects |
| next-themes | 0.4.6 | Theme provider | Already installed for light/dark mode support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sonner | react-hot-toast | Sonner is shadcn/ui's official recommendation, better CSS variable integration |
| Recharts | Chart.js, Victory | Recharts has official shadcn/ui wrapper components with theme integration |
| loading.js | Custom Suspense | loading.js is Next.js convention, automatic optimization |

**Installation:**
No new packages required. Add shadcn/ui components as needed:
```bash
pnpm dlx shadcn@latest add sonner
pnpm dlx shadcn@latest add chart
pnpm dlx shadcn@latest add skeleton
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (dashboard)/
│   ├── layout.tsx           # Sidebar, bottom nav
│   ├── loading.tsx          # Dashboard skeleton
│   ├── contacts/
│   │   ├── page.tsx
│   │   └── loading.tsx      # Contacts skeleton
│   ├── send/
│   │   ├── page.tsx
│   │   └── loading.tsx      # Send page skeleton
│   └── history/
│       ├── page.tsx
│       └── loading.tsx      # History skeleton
├── globals.css              # CSS variables, design tokens
└── ...

components/
├── ui/
│   ├── sonner.tsx           # Toast provider
│   ├── skeleton.tsx         # Skeleton primitive
│   ├── chart.tsx            # Chart components
│   └── ...
├── skeletons/
│   ├── table-skeleton.tsx   # Reusable table skeleton
│   ├── card-skeleton.tsx    # Reusable card skeleton
│   └── ...
└── mobile/
    └── bottom-nav.tsx       # Mobile bottom navigation

lib/
├── hooks/
│   ├── use-local-storage.ts # Persist UI state
│   └── use-media-query.ts   # Responsive breakpoints
└── utils/
    └── cn.ts                # Already exists (clsx + twMerge)
```

### Pattern 1: Loading States with Next.js loading.js
**What:** Use file-system based loading.js to create automatic Suspense boundaries for route segments
**When to use:** Every route that fetches data should have a loading.js file
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/loading
// app/(dashboard)/contacts/loading.tsx
export default function ContactsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  )
}
```

### Pattern 2: Dimensioned Skeleton Screens
**What:** Skeleton screens with explicit dimensions matching final content to prevent CLS
**When to use:** For all loading states that replace content with known dimensions
**Example:**
```typescript
// Source: Web research - CLS prevention best practices
// components/skeletons/table-skeleton.tsx
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" style={{ minHeight: `${rows * 73}px` }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
```

### Pattern 3: Toast Notifications with Sonner
**What:** Centralized toast notifications for action feedback
**When to use:** Quick actions (save, delete, send), errors, success confirmations
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/sonner
// app/layout.tsx - Add Toaster provider
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

// Usage in components/actions
import { toast } from "sonner"

function handleSave() {
  toast.success("Contact saved", {
    description: "Your changes have been saved successfully"
  })
}

function handleError(error: Error) {
  toast.error("Failed to save", {
    description: error.message
  })
}
```

### Pattern 4: Design Tokens with CSS Variables
**What:** Define all colors, spacing, typography as CSS variables in globals.css
**When to use:** Always - never hardcode design values
**Example:**
```css
/* Source: Tailwind CSS + shadcn/ui best practices */
/* app/globals.css */
@layer base {
  :root {
    /* Reference design: Light gray background #F5F5F7 */
    --background: 0 0% 96%; /* #F5F5F7 in HSL */
    --card: 0 0% 100%;

    /* Blue primary accent */
    --primary: 217 91% 60%; /* Blue accent */
    --primary-foreground: 0 0% 98%;

    /* Spacing scale (8px base) */
    --spacing-xs: 0.5rem;  /* 8px */
    --spacing-sm: 1rem;    /* 16px */
    --spacing-md: 1.5rem;  /* 24px */
    --spacing-lg: 2rem;    /* 32px */
    --spacing-xl: 3rem;    /* 48px */

    /* Border radius (8-12px range) */
    --radius: 0.75rem; /* 12px */
  }
}
```

### Pattern 5: localStorage with SSR Safety
**What:** Persist UI state (sidebar collapse) with proper server/client handling
**When to use:** User preferences that should survive page refresh
**Example:**
```typescript
// Source: https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/
// lib/hooks/use-local-storage.ts
"use client"

import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // Initialize with lazy function to avoid SSR issues
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
```

### Pattern 6: Responsive Bottom Navigation
**What:** Fixed bottom navigation bar for mobile with core actions
**When to use:** Screen width < 768px
**Example:**
```typescript
// Source: Mobile navigation best practices research
// components/mobile/bottom-nav.tsx
"use client"

import { Home, Users, Send, History } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  const items = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Contacts', href: '/contacts' },
    { icon: Send, label: 'Send', href: '/send' },
    { icon: History, label: 'History', href: '/history' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### Pattern 7: Accessible Animations with prefers-reduced-motion
**What:** Respect user's motion preferences by disabling/reducing animations
**When to use:** All animations and transitions
**Example:**
```typescript
// Source: https://www.joshwcomeau.com/react/prefers-reduced-motion/
// lib/hooks/use-reduced-motion.ts
"use client"

import { useState, useEffect } from 'react'

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Usage in components
function AnimatedButton() {
  const reducedMotion = useReducedMotion()

  return (
    <button
      className={cn(
        "transition-all",
        !reducedMotion && "hover:scale-105 active:scale-95"
      )}
    >
      Click me
    </button>
  )
}
```

### Pattern 8: Micro-interactions with Tailwind
**What:** Subtle hover states, transitions, and button feedback
**When to use:** All interactive elements
**Example:**
```typescript
// Source: https://tailwindcss.com/docs/animation
// Subtle hover with 200ms duration (ideal for micro-interactions)
<button className="
  transition-all duration-200
  hover:bg-primary/90 hover:shadow-md
  active:scale-[0.98]
  motion-reduce:transition-none
  motion-reduce:hover:scale-100
">
  Save
</button>

// Card hover effect
<div className="
  transition-all duration-200
  hover:shadow-lg hover:-translate-y-0.5
  motion-reduce:transition-none
  motion-reduce:hover:translate-y-0
">
  Card content
</div>
```

### Anti-Patterns to Avoid
- **Hardcoded colors/spacing:** Always use CSS variables or Tailwind tokens, never `#3B82F6` or `padding: 12px`
- **Missing skeleton dimensions:** Skeleton without height/width causes layout shift when content loads
- **Desktop-first responsive:** Start mobile, enhance for desktop (use `md:` not `max-md:`)
- **localStorage without SSR check:** Reading localStorage during SSR causes hydration errors
- **Animations without motion-reduce:** Violates WCAG accessibility guidelines
- **Toast overload:** Multiple simultaneous toasts confuse users, queue them or use single toast
- **Inconsistent icon sizes:** Standardize on lucide-react size classes (h-4 w-4, h-5 w-5, h-6 w-6)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom positioned divs with setTimeout | Sonner (shadcn/ui) | Handles stacking, animations, accessibility, queue management, auto-dismiss |
| Loading skeletons | Custom pulse animations | shadcn/ui Skeleton component | Consistent animation, accessibility, theme integration |
| Chart visualizations | SVG paths with manual calculations | Recharts (shadcn/ui charts) | Handles responsive sizing, tooltips, legends, accessibility, data transformations |
| Responsive breakpoints | Manual window.innerWidth listeners | Tailwind breakpoints + useMediaQuery hook | SSR-safe, performance optimized, automatic cleanup |
| localStorage persistence | Direct localStorage.setItem/getItem | useLocalStorage hook | SSR safety, error handling, type safety, change detection |
| Theme switching | Manual class toggling | next-themes provider | Already installed, SSR-safe, system preference detection, no flash |
| Animation timing | Custom CSS @keyframes | Tailwind animate utilities | Consistent timing, reduced motion support, theme integration |
| Modal transitions | Custom CSS transitions | Radix Dialog (via shadcn/ui) | Focus trap, accessibility, backdrop click, ESC key handling |

**Key insight:** UX polish relies on handling edge cases (SSR hydration, accessibility, error states, race conditions) that are complex to implement correctly. Libraries in the shadcn/ui ecosystem already solve these with battle-tested solutions.

## Common Pitfalls

### Pitfall 1: Layout Shift from Unsized Skeletons
**What goes wrong:** Skeleton renders at auto height, content loads with different height, page jumps
**Why it happens:** Developers forget to specify dimensions on skeleton components
**How to avoid:** Always specify min-height or exact height on skeleton containers matching final content
**Warning signs:** CLS score above 0.1 in Lighthouse, visible page jumps when navigating

### Pitfall 2: localStorage Hydration Mismatch
**What goes wrong:** Server renders collapsed sidebar (default), client reads localStorage (expanded), React hydration error
**Why it happens:** localStorage only exists in browser, server uses default value
**How to avoid:** Use lazy initialization in useState, suppress hydration warning, or use useEffect for client-only state
**Warning signs:** "Hydration failed" errors in console, UI flicker on page load

### Pitfall 3: Inconsistent Spacing from Manual Values
**What goes wrong:** Some gaps are 12px, some 16px, some 1rem, design feels chaotic
**Why it happens:** Developers type spacing values manually instead of using design tokens
**How to avoid:** Define spacing scale in Tailwind config, enforce via ESLint, use only gap-* and space-* utilities
**Warning signs:** Design feedback about "inconsistent spacing", hard to align elements

### Pitfall 4: Animations Causing Motion Sickness
**What goes wrong:** Users with vestibular disorders feel nauseous from animations
**Why it happens:** Animations applied without checking prefers-reduced-motion
**How to avoid:** Wrap all animations in motion-safe: variant or useReducedMotion hook
**Warning signs:** WCAG 2.1 Level AA failures, user complaints about motion

### Pitfall 5: Toast Notification Overlap
**What goes wrong:** Multiple toasts stack incorrectly, overlap content, can't be dismissed
**Why it happens:** Custom toast implementation doesn't handle queue/positioning
**How to avoid:** Use Sonner which handles queue management automatically
**Warning signs:** Toasts covering form inputs, multiple toasts at different positions

### Pitfall 6: Mobile Navigation Covering Content
**What goes wrong:** Bottom navigation hides last rows of table/form buttons
**Why it happens:** Forgot to add bottom padding to page content
**How to avoid:** Add pb-20 (or var(--bottom-nav-height)) to mobile page containers
**Warning signs:** Can't click last item in list on mobile, form submit button hidden

### Pitfall 7: Color Palette Drift
**What goes wrong:** Blue buttons use 5 different shades across app
**Why it happens:** Developers pick colors from Tailwind palette instead of using semantic tokens
**How to avoid:** Define semantic color tokens (primary, secondary, accent), never use blue-500 directly
**Warning signs:** Design system audit shows 8 shades of blue, brand looks inconsistent

### Pitfall 8: Desktop-First Responsive Breakpoints
**What goes wrong:** Mobile experience is clunky, features hidden behind hamburger
**Why it happens:** Designed desktop first, then tried to squeeze into mobile
**How to avoid:** Design mobile first, use md: lg: xl: to enhance for larger screens
**Warning signs:** Lots of max-md: utilities, mobile feels like afterthought

## Code Examples

Verified patterns from official sources:

### Loading State with Skeleton (Next.js 15)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/loading
// app/(dashboard)/contacts/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function ContactsLoading() {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table skeleton with exact dimensions */}
      <div className="rounded-lg border bg-card" style={{ minHeight: '500px' }}>
        <Skeleton className="h-12 w-full rounded-t-lg" /> {/* Header */}
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-5 w-5" /> {/* Checkbox */}
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Sonner Toast Notifications
```typescript
// Source: https://ui.shadcn.com/docs/components/sonner
// app/(dashboard)/send/actions.ts
"use server"

import { toast } from "sonner"

export async function sendReviewRequest(contactIds: string[]) {
  try {
    // Send logic...

    // Return success - toast triggered on client
    return { success: true, count: contactIds.length }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// app/(dashboard)/send/page.tsx
"use client"

import { toast } from "sonner"

function SendPage() {
  async function handleSend() {
    const result = await sendReviewRequest(selectedIds)

    if (result.success) {
      toast.success("Messages sent", {
        description: `Sent ${result.count} review requests successfully`
      })
    } else {
      toast.error("Send failed", {
        description: result.error,
        action: {
          label: "Retry",
          onClick: () => handleSend()
        }
      })
    }
  }

  return (/* UI */)
}
```

### Responsive Bottom Navigation
```typescript
// Source: Mobile navigation best practices + Tailwind docs
// components/mobile/bottom-nav.tsx
"use client"

import { Home, Users, Send, History } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_HEIGHT = 72 // 4.5rem

export function BottomNav() {
  const pathname = usePathname()

  const items = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Contacts', href: '/contacts' },
    { icon: Send, label: 'Send', href: '/send' },
    { icon: History, label: 'History', href: '/history' },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t"
      style={{ height: `${NAV_HEIGHT}px` }}
    >
      <div className="grid grid-cols-4 h-full">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Add to layout to prevent content overlap
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="pb-0 md:pb-0">
      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Main content with mobile padding */}
      <main className="pb-20 md:pb-0"> {/* 5rem = 80px for bottom nav */}
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
```

### Design Tokens in globals.css
```css
/* Source: shadcn/ui theming docs + Tailwind CSS variables best practices */
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Colors - Reference Design: #F5F5F7 background, blue accent */
    --background: 0 0% 96%;         /* #F5F5F7 */
    --foreground: 0 0% 9%;          /* Near black text */

    --card: 0 0% 100%;              /* White cards */
    --card-foreground: 0 0% 9%;

    --primary: 217 91% 60%;         /* Blue accent */
    --primary-foreground: 0 0% 98%;

    --muted: 0 0% 92%;              /* Subtle backgrounds */
    --muted-foreground: 0 0% 45%;   /* Secondary text */

    --accent: 217 91% 60%;          /* Match primary */
    --accent-foreground: 0 0% 98%;

    --destructive: 0 84% 60%;       /* Error red */
    --destructive-foreground: 0 0% 98%;

    --border: 0 0% 89%;             /* Subtle borders */
    --input: 0 0% 89%;
    --ring: 217 91% 60%;            /* Focus ring matches primary */

    /* Border radius - 8-12px range */
    --radius: 0.75rem;              /* 12px for cards */
    --radius-sm: 0.5rem;            /* 8px for buttons */

    /* Shadows - Subtle */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);

    /* Spacing scale (8px base) */
    --spacing-xs: 0.5rem;   /* 8px */
    --spacing-sm: 1rem;     /* 16px */
    --spacing-md: 1.5rem;   /* 24px */
    --spacing-lg: 2rem;     /* 32px */
    --spacing-xl: 3rem;     /* 48px */

    /* Typography weights - Medium throughout */
    --font-medium: 500;
    --font-semibold: 600;
  }

  .dark {
    --background: 0 0% 9%;
    --foreground: 0 0% 98%;

    --card: 0 0% 12%;
    --card-foreground: 0 0% 98%;

    --primary: 217 91% 65%;
    --primary-foreground: 0 0% 9%;

    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 64%;

    --border: 0 0% 20%;
    --input: 0 0% 20%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Smooth scrolling with reduced motion support */
  html {
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }

    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

### Accessible Micro-interactions
```typescript
// Source: Tailwind CSS animation docs + prefers-reduced-motion research
// components/ui/button.tsx (enhanced)
import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-md font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",

          // Micro-interactions (200ms for quick feedback)
          "transition-all duration-200",

          // Hover state - subtle lift + color change
          "hover:shadow-md motion-safe:hover:-translate-y-0.5",

          // Active/press state - scale down + color change
          "active:shadow-sm motion-safe:active:scale-[0.98]",

          // Reduced motion - disable transforms
          "motion-reduce:transition-none",
          "motion-reduce:hover:translate-y-0",
          "motion-reduce:active:scale-100",

          className
        )}
        {...props}
      />
    )
  }
)
```

### Donut Chart for Usage Display
```typescript
// Source: https://ui.shadcn.com/docs/components/chart
// components/charts/usage-donut.tsx
"use client"

import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface UsageDonutProps {
  used: number
  limit: number
  label: string
}

export function UsageDonut({ used, limit, label }: UsageDonutProps) {
  const remaining = Math.max(0, limit - used)
  const percentage = Math.round((used / limit) * 100)

  const data = [
    { name: "Used", value: used, fill: "hsl(var(--primary))" },
    { name: "Remaining", value: remaining, fill: "hsl(var(--muted))" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ChartContainer
            config={{
              used: { label: "Used", color: "hsl(var(--primary))" },
              remaining: { label: "Remaining", color: "hsl(var(--muted))" },
            }}
            className="h-[200px]"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                strokeWidth={0}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-semibold">{percentage}%</div>
            <div className="text-sm text-muted-foreground">
              {used.toLocaleString()} / {limit.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-hot-toast | Sonner (via shadcn/ui) | shadcn/ui deprecated toast component in 2024 | Better theming, simpler API, promise-based toasts |
| Custom loading spinners | Next.js loading.js + Suspense | Next.js 13+ App Router (2023) | Automatic streaming, better UX, file-based convention |
| Manual @keyframes | Tailwind animate utilities | Tailwind v3 (2021), v4 enhanced (2024) | Consistent timing, reduced motion support, easier customization |
| JS-based theme switching | next-themes with CSS variables | Industry standard 2023+ | SSR-safe, no flash, system preference detection |
| Chart.js, Victory | Recharts with shadcn/ui wrapper | shadcn/ui charts released 2024 | Theme integration, simpler API, smaller bundle |
| pixels/rems mixed | CSS variables for all tokens | Design systems best practice 2024+ | Consistency, easier theming, single source of truth |

**Deprecated/outdated:**
- **shadcn/ui Toast component**: Replaced by Sonner, migrate all toast usage
- **Max-width breakpoints**: Mobile-first (min-width) is now standard, avoid max-md:
- **Direct Tailwind color classes**: Use semantic tokens (bg-primary not bg-blue-500)
- **window.innerWidth for responsive**: Use Tailwind breakpoints + optional useMediaQuery hook

## Open Questions

Things that couldn't be fully resolved:

1. **Exact hex values for blue accent**
   - What we know: CONTEXT.md specifies "blue primary accent", reference design shows blue buttons
   - What's unclear: Exact hex value of blue (#0052CC, #3B82F6, #2563EB?)
   - Recommendation: Use Tailwind blue-600 (#2563EB) as starting point, adjust in CSS variables based on reference screenshot

2. **Sidebar collapse breakpoint**
   - What we know: CONTEXT.md says "expanded on large, collapsed on medium, hidden on mobile"
   - What's unclear: Is "medium" 768px (md:) or 1024px (lg:)?
   - Recommendation: Expanded at lg: (1024px+), collapsed at md: (768-1023px), hidden below md: (< 768px)

3. **Empty state icon style**
   - What we know: CONTEXT.md specifies "icon + text + CTA" format
   - What's unclear: Icon style (outline, filled, custom illustration?)
   - Recommendation: Use lucide-react outline icons for consistency with existing UI

4. **Animation duration for dialogs**
   - What we know: CONTEXT.md specifies "slide + fade" for dialogs
   - What's unclear: Duration (150ms, 200ms, 300ms?)
   - Recommendation: 200ms for micro-interactions (buttons), 300ms for dialogs (more noticeable movement)

5. **Toast duration defaults**
   - What we know: Sonner supports custom durations
   - What's unclear: How long should success vs error toasts persist?
   - Recommendation: Success 3s, Error 5s (gives time to read error), Info 4s

## Sources

### Primary (HIGH confidence)
- Next.js Loading UI Documentation - https://nextjs.org/docs/app/api-reference/file-conventions/loading
- shadcn/ui Sonner Component - https://ui.shadcn.com/docs/components/sonner
- Tailwind CSS Animation Utilities - https://tailwindcss.com/docs/animation
- shadcn/ui Charts Documentation - https://ui.shadcn.com/docs/components/chart
- Recharts Official Documentation - https://recharts.github.io/en-US/

### Secondary (MEDIUM confidence)
- Josh W. Comeau - Persisting React State in localStorage - https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/
- Josh W. Comeau - Accessible Animations in React - https://www.joshwcomeau.com/react/prefers-reduced-motion/
- Next.js Loading States Best Practices (Medium) - https://medium.com/@divyanshsharma0631/no-more-blank-screens-mastering-loading-states-skeletons-with-loading-js-80c62b7747a1
- Tailwind CSS Best Practices 2025-2026 (FrontendTools) - https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns
- Responsive Design Breakpoints 2025 Playbook - https://dev.to/gerryleonugroho/responsive-design-breakpoints-2025-playbook-53ih

### Tertiary (LOW confidence - flagged for validation)
- Mobile navigation ergonomics - https://jfelix.info/blog/create-a-mobile-friendly-navigation-with-react
- Design Systems in 2026 predictions - https://rydarashid.medium.com/design-systems-in-2026-predictions-pitfalls-and-power-moves-f401317f7563
- UI/UX Loading States Mistakes - https://dmletterstudio.com/ui-ux-mistakes-with-loading-states/

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed, official docs reviewed
- Architecture: HIGH - Next.js 15 patterns verified, shadcn/ui official recommendations followed
- Pitfalls: MEDIUM - Based on web research + common patterns, not project-specific testing

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stable domain, no breaking changes expected)

**Notes:**
- Stack is locked by CONTEXT.md - no new major dependencies needed
- Visual decisions (colors, radius, spacing) are locked by CONTEXT.md
- Focus should be on consistency and polish, not experimentation
- All code examples use existing installed packages
