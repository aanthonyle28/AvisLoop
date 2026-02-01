# Phase 20: Status Badges & Layout Fixes - Research

**Researched:** 2026-02-01
**Domain:** Component design patterns, CSS positioning, and flex layout
**Confidence:** HIGH

## Summary

Phase 20 requires three focused improvements: (1) unifying all status badge implementations into a single Figma-spec component with proper icons and colors, (2) making the settings page navbar sticky/fixed on scroll, and (3) fixing the recent activity strip to fill horizontal space with proper truncation. All three are straightforward UI polish tasks using existing stack patterns.

**Current state:**
- Status badges exist in `components/history/status-badge.tsx` but use inconsistent colors (current: semantic Tailwind colors like `bg-blue-100`, `text-blue-800`) and lack icons
- Status badges appear in 6+ locations: history page, send page recent activity, scheduled table, request drawer, history columns
- Settings page uses standard page layout without sticky navbar
- Recent activity strip has basic flex layout but doesn't fill space optimally or truncate the last chip

**What needs to change:**
- Replace current StatusBadge colors with exact Figma hex values (#F3F4F6, #EAF3F6, etc.)
- Add Phosphor Icons to each badge variant (CircleNotch, CheckCircle, Cursor, WarningCircle, Star)
- Add "Scheduled" status variant (currently missing)
- Wrap settings page content sections in sticky container
- Update recent activity strip flex layout with `min-w-0` and `truncate` on last chip

**Primary recommendation:** Modify existing `StatusBadge` component to match Figma spec exactly, add sticky positioning to settings navbar, and apply Tailwind flex/truncate utilities to recent activity strip. No new libraries needed.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v3.4.1 | Utility-first CSS with sticky/fixed positioning utilities | Project standard, used throughout app |
| @phosphor-icons/react | v2.1.10 | Flexible icon family for React with 9,000+ icons | Project standard for all icons |
| Radix UI Badge | via CVA | Base badge component with variants | Project standard UI primitive |
| class-variance-authority | v0.7.1 | Type-safe variant management for components | Used in existing badge.tsx |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx / cn utility | v2.1.1 | Conditional className merging | All component className logic |
| Kumbh Sans | Google Font | Brand typography | All text (already configured) |

**Installation:**
```bash
# No installation needed - all dependencies already in package.json
```

## Architecture Patterns

### Recommended Component Structure
```
components/
├── history/
│   └── status-badge.tsx          # Updated with Figma colors + icons
app/
└── dashboard/
    └── settings/
        └── page.tsx              # Wrap in sticky container
components/
└── send/
    └── recent-activity-strip.tsx # Update flex layout with truncate
```

### Pattern 1: Unified Status Badge with Icon + Figma Colors
**What:** Single StatusBadge component that renders all 6 status variants with exact Figma colors and corresponding icons
**When to use:** Every location that displays send/request status (history, send page, drawers, scheduled table)
**Example:**
```typescript
// Source: Figma spec (BDGE-01) + existing status-badge.tsx pattern
import { Badge } from '@/components/ui/badge'
import { CircleNotch, CheckCircle, Cursor, WarningCircle, Star } from '@phosphor-icons/react'

export type SendStatus = 'pending' | 'delivered' | 'clicked' | 'failed' | 'reviewed' | 'scheduled'

const statusConfig: Record<SendStatus, {
  label: string
  bgColor: string
  textColor: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  pending: {
    label: 'Pending',
    bgColor: '#F3F4F6',
    textColor: '#101828',
    Icon: CircleNotch
  },
  delivered: {
    label: 'Delivered',
    bgColor: '#EAF3F6',
    textColor: '#2C879F',
    Icon: CheckCircle
  },
  clicked: {
    label: 'Clicked',
    bgColor: '#FEF9C2',
    textColor: '#894B00',
    Icon: Cursor
  },
  failed: {
    label: 'Failed',
    bgColor: '#FFE2E2',
    textColor: '#C10007',
    Icon: WarningCircle
  },
  reviewed: {
    label: 'Reviewed',
    bgColor: '#DCFCE7',
    textColor: '#008236',
    Icon: Star
  },
  scheduled: {
    label: 'Scheduled',
    bgColor: 'rgba(159, 44, 134, 0.1)', // #9F2C86 at 10% opacity
    textColor: '#9F2C86',
    Icon: CheckCircle
  }
}

export function StatusBadge({ status }: { status: SendStatus }) {
  const config = statusConfig[status]
  const Icon = config.Icon

  return (
    <Badge
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold hover:opacity-80"
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  )
}
```

### Pattern 2: Sticky Navbar with Tailwind Position Utilities
**What:** Use Tailwind's `sticky top-0` utility to keep navbar visible when scrolling down the settings page
**When to use:** Settings page content wrapper (or any long-scrolling page that needs persistent navigation)
**Example:**
```typescript
// Source: Tailwind CSS v3 Position docs + existing app-shell.tsx pattern
export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your business profile and email templates
        </p>
      </div>

      {/* Scrollable content sections */}
      <div className="space-y-8 p-6">
        <section className="border rounded-lg p-6 bg-card">
          {/* Business Profile */}
        </section>
        {/* More sections... */}
      </div>
    </div>
  )
}
```

### Pattern 3: Flex Container with Last-Child Truncation
**What:** Use `overflow-hidden flex-1 min-w-0` on parent and `truncate` on last child to fill space and gracefully truncate when overflow occurs
**When to use:** Horizontal chip/badge lists that need to fill available space before a fixed-width action button
**Example:**
```typescript
// Source: Tailwind CSS text-overflow docs + CSS-Tricks flex truncation pattern
<div className="flex items-center gap-2">
  <span className="text-sm font-semibold shrink-0">Recent Activity:</span>

  {/* Container fills available space, hides overflow */}
  <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0">
    {items.map((item, index) => (
      <div key={item.id} className="flex items-center gap-1 min-w-0">
        {index > 0 && <span className="shrink-0">|</span>}
        {/* Last item gets truncate class */}
        <button className={cn(
          "flex items-center gap-2 px-1.5 py-0.5 min-w-0",
          index === items.length - 1 && "truncate"
        )}>
          <span className="text-sm font-medium truncate">{item.label}</span>
          <StatusBadge status={item.status} />
          <span className="text-xs whitespace-nowrap">{item.time}</span>
        </button>
      </div>
    ))}
  </div>

  <Link href="/history" className="shrink-0">
    View All
  </Link>
</div>
```

### Anti-Patterns to Avoid
- **Hardcoding badge colors in multiple files:** Use the single StatusBadge component everywhere
- **Using only `overflow-hidden` without `min-w-0` in flex containers:** Text won't truncate properly
- **Using `position: fixed` for settings navbar:** Use `sticky` instead to maintain document flow
- **Custom icon components for status indicators:** Use Phosphor Icons directly (already installed)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status badge variants | Multiple ad-hoc badge implementations | Single StatusBadge component with config object | Ensures consistency, Figma spec adherence, easier updates |
| Icon library | Custom SVG components | @phosphor-icons/react (already installed) | 9,000+ icons, consistent API, tree-shakeable |
| Sticky positioning | JavaScript scroll listeners | Tailwind `sticky top-0` utility | Native CSS, no JS overhead, better performance |
| Text truncation | JavaScript string.slice() | Tailwind `truncate` utility | Native CSS ellipsis, responsive, accessible |
| Flex layout calculations | Manual width/overflow math | Tailwind flex utilities (`flex-1 min-w-0`) | Browser-native, responsive, fewer bugs |

**Key insight:** All three requirements (unified badges, sticky navbar, truncation) are solved with existing CSS primitives. No custom logic needed.

## Common Pitfalls

### Pitfall 1: Forgetting `min-w-0` on Flex Children
**What goes wrong:** Text inside flex items doesn't truncate; it overflows the container instead
**Why it happens:** Flexbox children have `min-width: auto` by default, which prevents shrinking below content width
**How to avoid:** Always add `min-w-0` to flex children that need to truncate
**Warning signs:** Text overflows parent container even with `truncate` class applied

### Pitfall 2: Missing Icon Imports
**What goes wrong:** Build fails with "Cannot find module" errors for Phosphor icons
**Why it happens:** Icon names must match exactly (CheckCircle not Check-Circle, WarningCircle not Warning)
**How to avoid:** Use existing codebase imports as reference (grep for `from '@phosphor-icons/react'`)
**Warning signs:** TypeScript errors about missing imports

### Pitfall 3: Sticky Positioning Without Parent Scroll Container
**What goes wrong:** `sticky top-0` has no effect; element scrolls normally
**Why it happens:** Sticky positioning requires a scrollable parent container
**Why it won't happen here:** Settings page is inside `<main className="flex-1 overflow-auto">` (app-shell.tsx line 30)
**How to verify:** Scroll settings page; sticky header should remain visible at top

### Pitfall 4: Using Inline Styles Without Dark Mode Support
**What goes wrong:** Badge background colors don't adapt to dark mode
**Why it happens:** Inline `style` attribute with hex colors bypasses Tailwind theme system
**How to avoid for this phase:** Acceptable for Figma-spec exact colors (not theme variables)
**Warning signs:** Badges look correct in light mode but have poor contrast in dark mode
**Note:** Figma spec provides absolute colors, not theme-aware tokens

### Pitfall 5: Replacing Working StatusBadge Type Union
**What goes wrong:** TypeScript errors in components that import SendStatus type
**Why it happens:** Changing the SendStatus union breaks existing type contracts
**How to avoid:** Extend the union (add 'scheduled'), don't replace it
**Warning signs:** Type errors in history-columns.tsx, request-detail-drawer.tsx, scheduled-table.tsx

## Code Examples

Verified patterns from codebase and official sources:

### Current StatusBadge Implementation
```typescript
// Source: components/history/status-badge.tsx (current state)
'use client'

import { Badge } from '@/components/ui/badge'

export type SendStatus = 'pending' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed' | 'opened'

const statusConfig: Record<SendStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
  // ...etc (no icons, generic Tailwind colors)
}

export function StatusBadge({ status }: { status: SendStatus }) {
  const config = statusConfig[status]
  return <Badge variant="secondary" className={config.className}>{config.label}</Badge>
}
```

### Current Phosphor Icon Usage (Reference)
```typescript
// Source: components/scheduled/expanded-details.tsx (lines 5, 24, 28, 32)
import { CheckCircle, Warning, XCircle } from '@phosphor-icons/react'

// Usage in JSX:
<CheckCircle className="h-4 w-4 text-green-600" />
<Warning className="h-4 w-4 text-orange-600" />
<XCircle className="h-4 w-4 text-red-600" />
```

### Current Recent Activity Strip Layout
```typescript
// Source: components/send/recent-activity-strip.tsx (lines 50-87)
<div className="bg-card border rounded-lg px-5 py-4">
  <div className="flex items-center gap-2">
    <span className="text-sm font-semibold shrink-0">Recent Activity:</span>

    {/* Currently: basic overflow-hidden, no proper truncation */}
    <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0">
      {displayItems.map((item, index) => (
        <button className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">{label}</span>
          <StatusBadge status={item.status} />
          <span className="text-xs whitespace-nowrap">{timeAgo}</span>
        </button>
      ))}
    </div>

    <Link href="/history" className="shrink-0">View All</Link>
  </div>
</div>
```

### Settings Page Current Structure
```typescript
// Source: app/dashboard/settings/page.tsx (lines 72-129)
async function SettingsContent() {
  // ...fetch logic

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Page header - needs sticky wrapper */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure your business profile...</p>
      </div>

      {/* Long scrolling sections */}
      <section className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Business Profile</h2>
        <BusinessSettingsForm />
      </section>
      {/* More sections... */}
    </div>
  )
}
```

### App Shell Main Content Area (Scroll Container)
```typescript
// Source: components/layout/app-shell.tsx (line 30)
<main className="flex-1 overflow-auto">
  {/* Page content scrolls here - sticky positioning works */}
  <PageHeader />
  <div className="pb-[72px] md:pb-0">
    {children} {/* Settings page renders here */}
  </div>
</main>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate badge components per page | Single StatusBadge component with variants | Phase 5 (history) | Partial consistency; needs Figma alignment |
| JavaScript scroll event listeners for sticky headers | CSS `position: sticky` | 2017 (CSS feature) | Native browser support, no JS needed |
| JavaScript string truncation | CSS `text-overflow: ellipsis` + `truncate` utility | 2000s (CSS2.1) | Better performance, responsive |
| Inline SVG icons | Icon component libraries (@phosphor-icons/react) | 2020s | Tree-shakeable, consistent API |

**Deprecated/outdated:**
- `position: fixed` for sticky navbars: Use `position: sticky` instead (maintains document flow, better UX)
- Multiple badge variant components: Use single component with config object (easier maintenance)
- Dark mode via separate class files: Use Tailwind dark mode variants (already configured in project)

## Locations Using StatusBadge

Based on codebase grep, StatusBadge is imported/used in:

1. **components/history/history-columns.tsx** (line 44) - History table status column
2. **components/history/request-detail-drawer.tsx** (line 168) - Drawer status section
3. **components/send/recent-activity-strip.tsx** (line 70) - Recent activity chips
4. **components/scheduled/scheduled-table.tsx** (lines 157-187) - Custom getStatusBadge function (NOT using StatusBadge component)

**Note:** Scheduled table uses inline Badge with custom logic instead of StatusBadge component. This should be migrated to use StatusBadge for consistency.

## Icon Name Reference

Based on existing codebase usage of @phosphor-icons/react:

| Status | Icon Name | Import Example |
|--------|-----------|----------------|
| Pending | CircleNotch | `import { CircleNotch } from '@phosphor-icons/react'` |
| Delivered | CheckCircle | `import { CheckCircle } from '@phosphor-icons/react'` |
| Clicked | Cursor | `import { Cursor } from '@phosphor-icons/react'` |
| Failed | WarningCircle | `import { WarningCircle } from '@phosphor-icons/react'` |
| Reviewed | Star | `import { Star } from '@phosphor-icons/react'` |
| Scheduled | CheckCircle | `import { CheckCircle } from '@phosphor-icons/react'` (same as Delivered) |

**Verification:** All icon names confirmed via existing imports in codebase (CheckCircle, WarningCircle used in scheduled components; Star used in stat-strip.tsx).

## Open Questions

None - all requirements are straightforward CSS/component updates with existing tools.

## Sources

### Primary (HIGH confidence)
- Tailwind CSS v3 Position documentation - https://v3.tailwindcss.com/docs/position (sticky and fixed positioning)
- @phosphor-icons/react documentation - https://github.com/phosphor-icons/react (icon component API)
- Existing codebase patterns:
  - components/history/status-badge.tsx (current implementation)
  - components/send/recent-activity-strip.tsx (flex layout pattern)
  - app/dashboard/settings/page.tsx (page structure)
  - components/layout/app-shell.tsx (scroll container)
  - 20+ files using @phosphor-icons/react (icon import patterns)

### Secondary (MEDIUM confidence)
- Tailwind CSS text-overflow documentation - https://tailwindcss.com/docs/text-overflow
- Medium article on flex container truncation - https://medium.com/@ademyalcin27/truncate-text-in-flex-containers-d3b81cc02cef
- LogRocket CSS truncation guide - https://blog.logrocket.com/truncate-text-css/

### Tertiary (LOW confidence)
- Phosphor Icons official website - https://phosphoricons.com/ (icon catalog reference, exact names not verified from web fetch)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed and in use
- Architecture: HIGH - Patterns verified in existing codebase
- Pitfalls: HIGH - Common CSS flex/truncation issues well-documented

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable CSS/component patterns)
