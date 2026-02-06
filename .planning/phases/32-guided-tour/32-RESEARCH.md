# Phase 32: Guided Product Tour - Research

**Researched:** 2026-02-06
**Domain:** Product Tour / User Onboarding
**Confidence:** HIGH

## Summary

Product tours are a proven pattern for improving user activation and reducing time-to-value. Research compared four primary approaches: (1) react-joyride, (2) driver.js, (3) shepherd.js, and (4) custom build with Radix UI. Based on AvisLoop's stack (Next.js App Router, Radix UI, Tailwind), **driver.js** is the recommended solution due to its lightweight footprint (~5KB), MIT license, keyboard accessibility, and clean integration with client components.

Key findings:
- Best product tours are 3-5 steps with 72% completion rate for 3-step tours
- Tours should be action-driven ("learning by doing") not passive walkthroughs
- localStorage is sufficient for state persistence (cross-device sync not required for this use case)
- Mobile requires special consideration: touch-optimized popovers, skip button always visible

**Primary recommendation:** Use driver.js v1.4.0 with a React wrapper hook, triggered after onboarding completion on dashboard page.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| driver.js | 1.4.0 | Tour engine | MIT license, 5KB, keyboard accessible, framework-agnostic, 25K+ GitHub stars |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| driverjs-react | latest | React wrapper | Optional - provides `useDriver` hook and `DriverProvider` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| driver.js | react-joyride | More React-native but React 19 incompatible (unstable next version), larger bundle |
| driver.js | shepherd.js | Better accessibility docs but commercial license required |
| driver.js | intro.js | Commercial license required for commercial use |
| driver.js | Custom Radix build | Full control but significant dev effort, accessibility harder to get right |

**Installation:**
```bash
pnpm add driver.js
```

Note: `driverjs-react` wrapper is optional. For Next.js App Router, a simple custom hook wrapping driver.js directly is often cleaner than the React wrapper library.

## Architecture Patterns

### Recommended Project Structure
```
components/
├── tour/
│   ├── tour-provider.tsx      # Context provider for tour state
│   ├── tour-trigger.tsx       # Component to start tour
│   ├── use-tour.ts           # Custom hook for tour control
│   └── tour-steps.ts         # Step definitions
lib/
└── hooks/
    └── use-product-tour.ts   # Main tour hook with persistence
```

### Pattern 1: Client-Only Tour Component
**What:** Wrap driver.js in a client component with dynamic import to avoid SSR issues
**When to use:** Next.js App Router (always)
**Example:**
```typescript
// Source: Verified pattern from driver.js docs + Next.js best practices
"use client"

import { useEffect, useCallback } from 'react'
import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'

interface UseTourOptions {
  steps: DriveStep[]
  tourId: string
  onComplete?: () => void
}

export function useProductTour({ steps, tourId, onComplete }: UseTourOptions) {
  const [hasCompletedTour, setHasCompletedTour] = useLocalStorage(
    `tour-${tourId}-completed`,
    false
  )
  const [hasDismissedTour, setHasDismissedTour] = useLocalStorage(
    `tour-${tourId}-dismissed`,
    false
  )

  const driverObj = driver({
    showProgress: true,
    steps,
    allowClose: true,
    overlayOpacity: 0.75,
    stagePadding: 8,
    popoverOffset: 12,
    animate: true,
    smoothScroll: true,
    allowKeyboardControl: true,
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    progressText: '{{current}} of {{total}}',
    onDestroyed: () => {
      setHasCompletedTour(true)
      onComplete?.()
    },
    onCloseClick: () => {
      setHasDismissedTour(true)
      driverObj.destroy()
    },
  })

  const startTour = useCallback(() => {
    driverObj.drive()
  }, [driverObj])

  const resetTour = useCallback(() => {
    setHasCompletedTour(false)
    setHasDismissedTour(false)
  }, [setHasCompletedTour, setHasDismissedTour])

  return {
    startTour,
    resetTour,
    hasCompletedTour,
    hasDismissedTour,
    shouldShowTour: !hasCompletedTour && !hasDismissedTour,
  }
}
```

### Pattern 2: Tour Trigger on Route Change
**What:** Detect `?onboarding=complete` query param and auto-start tour
**When to use:** After onboarding redirect to dashboard
**Example:**
```typescript
// Source: Common pattern for post-onboarding tours
"use client"

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useProductTour } from '@/lib/hooks/use-product-tour'
import { dashboardTourSteps } from '@/components/tour/tour-steps'

export function TourTrigger() {
  const searchParams = useSearchParams()
  const hasTriggered = useRef(false)
  const { startTour, shouldShowTour } = useProductTour({
    steps: dashboardTourSteps,
    tourId: 'dashboard-v1',
  })

  useEffect(() => {
    const isOnboardingComplete = searchParams.get('onboarding') === 'complete'
    if (isOnboardingComplete && shouldShowTour && !hasTriggered.current) {
      hasTriggered.current = true
      // Small delay to let dashboard render
      setTimeout(startTour, 500)
    }
  }, [searchParams, shouldShowTour, startTour])

  return null
}
```

### Pattern 3: Reduced Motion Support
**What:** Respect user's prefers-reduced-motion setting
**When to use:** Always for accessibility
**Example:**
```typescript
// Source: WCAG 2.1 Guideline 2.3
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const driverObj = driver({
  animate: !prefersReducedMotion,
  smoothScroll: !prefersReducedMotion,
  // ... other options
})
```

### Anti-Patterns to Avoid
- **Auto-starting tour without user consent:** Always provide skip option prominently
- **Blocking core functionality:** User should be able to exit tour at any step
- **Too many steps:** Keep to 3-5 steps maximum for 72%+ completion rate
- **Passive tours:** Tours should encourage action, not just show features
- **Hardcoded selectors:** Use data attributes (`data-tour="step-1"`) for stable targeting

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Overlay with cutout | Custom CSS masking | driver.js overlay | Edge cases with scroll, z-index, repositioning |
| Popover positioning | Manual calc | driver.js/Floating UI | Viewport boundaries, flipping, scroll handling |
| Focus management | Manual focus trap | driver.js keyboard control | Tab order, escape key, arrow navigation |
| Tour state machine | useState chaos | driver.js lifecycle hooks | Multi-step progression, back/forward, skip logic |
| Scroll-to-element | scrollIntoView | driver.js smoothScroll | Timing, offset, animation respect |

**Key insight:** Building a production-quality tour from scratch requires handling dozens of edge cases (scroll containers, fixed elements, dynamic content, RTL layouts, mobile gestures). Driver.js solves these for 5KB.

## Common Pitfalls

### Pitfall 1: Targeting Elements That Don't Exist Yet
**What goes wrong:** Tour step targets a selector that hasn't rendered (async data, lazy component)
**Why it happens:** Tour starts before dashboard fully hydrates
**How to avoid:** Use `onHighlightStarted` callback to check if element exists, skip step if not
**Warning signs:** Console errors about null elements, tour breaks mid-way

### Pitfall 2: Z-Index Wars
**What goes wrong:** Tour overlay appears behind modals, dropdowns, or sticky headers
**Why it happens:** Driver.js overlay has fixed z-index that conflicts with app's z-index scale
**How to avoid:** Set driver.js overlay z-index via CSS to fit your app's scale (use CSS custom properties)
**Warning signs:** Overlay visible in some places, hidden in others

### Pitfall 3: Hydration Mismatch in SSR
**What goes wrong:** Driver.js tries to access DOM on server, causes hydration errors
**Why it happens:** Importing driver.js in a server component or not guarding client-only code
**How to avoid:** Always use `"use client"` directive, initialize driver inside useEffect
**Warning signs:** "window is not defined" errors, React hydration warnings

### Pitfall 4: Tour Persists Across Logout
**What goes wrong:** Different user logs in, tour state from previous user persists
**Why it happens:** localStorage key doesn't include user ID
**How to avoid:** Include user ID in localStorage key, or clear tour state on logout
**Warning signs:** New user doesn't see tour, returning user sees tour again

### Pitfall 5: Mobile Popover Overflow
**What goes wrong:** Popover text gets cut off or extends beyond viewport on mobile
**Why it happens:** Fixed popover width doesn't account for narrow screens
**How to avoid:** Test on 320px width, use responsive popover styling, keep content brief
**Warning signs:** Horizontal scroll appears during tour, text truncated

## Code Examples

### Step Definition Pattern
```typescript
// Source: driver.js docs + V2 alignment
import type { DriveStep } from 'driver.js'

export const dashboardTourSteps: DriveStep[] = [
  {
    // Step 1: Welcome / Overview
    popover: {
      title: 'Welcome to AvisLoop!',
      description: 'Let\'s take a quick tour of how AvisLoop automatically collects reviews for your business.',
    },
  },
  {
    // Step 2: Add Job (V2 Core Action)
    element: '[data-tour="add-job-button"]',
    popover: {
      title: 'Complete Jobs Here',
      description: 'This is your main action. When you finish a job, click here to log it. AvisLoop handles the rest automatically.',
      side: 'right',
      align: 'start',
    },
  },
  {
    // Step 3: Campaigns (Automation)
    element: '[data-tour="campaigns-nav"]',
    popover: {
      title: 'Automated Follow-ups',
      description: 'Campaigns send review requests automatically after jobs. Set them up once, and they run forever.',
      side: 'right',
      align: 'start',
    },
  },
  {
    // Step 4: Dashboard KPIs
    element: '[data-tour="kpi-widgets"]',
    popover: {
      title: 'Track Your Results',
      description: 'See reviews collected, response rates, and more. Your automation is working 24/7.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    // Step 5: Ready to Start
    popover: {
      title: 'You\'re All Set!',
      description: 'Ready to get more reviews? Add your first completed job and watch AvisLoop work its magic.',
    },
  },
]
```

### Custom Styling Override
```css
/* Source: driver.js theming docs */
.driver-popover {
  --driver-bg: hsl(var(--card));
  --driver-text: hsl(var(--foreground));
  --driver-progress-bg: hsl(var(--muted));
  --driver-progress-fill: hsl(var(--primary));

  background: var(--driver-bg);
  color: var(--driver-text);
  border-radius: var(--radius);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  padding: 1rem;
  max-width: min(90vw, 400px);
}

.driver-popover-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.driver-popover-description {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
}

.driver-popover-navigation-btns {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.driver-popover-next-btn,
.driver-popover-prev-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.driver-popover-next-btn {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.driver-popover-prev-btn {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}

.driver-popover-close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.driver-popover-close-btn:hover {
  background: hsl(var(--muted));
}

/* Progress indicator */
.driver-popover-progress-text {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.5rem;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .driver-popover,
  .driver-overlay {
    transition: none !important;
    animation: none !important;
  }
}

/* Dark mode */
.dark .driver-popover {
  border: 1px solid hsl(var(--border));
}

.dark .driver-overlay {
  background: rgba(0, 0, 0, 0.8);
}
```

### Settings Page "Restart Tour" Option
```typescript
// Source: UX pattern for tour re-access
"use client"

import { Button } from '@/components/ui/button'
import { useProductTour } from '@/lib/hooks/use-product-tour'
import { dashboardTourSteps } from '@/components/tour/tour-steps'
import { useRouter } from 'next/navigation'

export function RestartTourButton() {
  const router = useRouter()
  const { resetTour } = useProductTour({
    steps: dashboardTourSteps,
    tourId: 'dashboard-v1',
  })

  const handleRestartTour = () => {
    resetTour()
    router.push('/dashboard?onboarding=complete')
  }

  return (
    <Button variant="outline" onClick={handleRestartTour}>
      Restart Product Tour
    </Button>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-joyride default | driver.js | 2024-2025 | Smaller bundle, framework-agnostic, active maintenance |
| Inline styles only | CSS custom properties | driver.js 1.x | Better theming, dark mode support |
| Blocking modal tours | Optional/skippable tours | 2023+ | Higher completion rates, better UX |

**Deprecated/outdated:**
- react-joyride: React 19 incompatible (use v6 beta if needed)
- intro.js: Commercial license required, less active development
- shepherd.js: Commercial license, React wrapper outdated

## V2 Philosophy Alignment

The tour MUST reinforce V2 principles. Tour step content should emphasize:

| V2 Principle | How Tour Reinforces It |
|--------------|----------------------|
| Jobs are primary | Highlight "Add Job" button first, call it "your main action" |
| Customers are side effects | Do NOT highlight Customers nav, mention "customers appear automatically" |
| Campaigns = automation | Frame campaigns as "set once, runs forever" |
| Minimal user involvement | Emphasize automation: "AvisLoop handles the rest" |
| Complete Job = only action | Tour CTA: "Add your first completed job" |

### Recommended Tour Flow (5 steps)
1. **Welcome** - Brief intro, set expectations
2. **Add Job** - THE core action, highlight button prominently
3. **Campaigns** - Automation explanation
4. **Dashboard KPIs** - Show results tracking
5. **Call to action** - Encourage first job completion

### DO NOT Include in Tour
- Customers page (contradicts V2)
- Manual Request/Send page (de-emphasized in V2)
- CSV Import (V1 pattern)

## Mobile Considerations

### Touch Targets
- Popover buttons must be 44x44px minimum
- Sufficient spacing between next/prev/skip buttons
- Close button easily tappable in top-right

### Viewport Handling
- Popover max-width: `min(90vw, 400px)`
- Test on 320px viewport width
- Allow scroll when popover extends beyond viewport

### Mobile-Specific Steps
- May need to adjust step order for mobile layout
- Bottom nav elements need `side: 'top'` positioning
- FAB button targeting needs mobile-specific selector

### Mobile Tour Trigger
- Consider delaying tour on mobile until after initial scroll
- Ensure keyboard doesn't trigger when targeting form elements

## Accessibility Requirements

### WCAG Compliance
| Requirement | How Driver.js Handles It |
|-------------|-------------------------|
| 2.1.1 Keyboard | Built-in: Tab, Shift+Tab, Enter, Escape, Arrow keys |
| 2.1.2 No Keyboard Trap | Escape key always dismisses, focus returns to trigger |
| 2.4.3 Focus Order | Tour controls focus order sequentially |
| 2.4.7 Focus Visible | Driver.js provides focus ring styling |
| 2.3.1 No Seizures | Disable animations with prefers-reduced-motion |

### Additional Requirements
- Screen reader announcements for step changes
- ARIA live regions for progress updates
- High contrast mode support
- Skip button always visible on first step

### Testing Checklist
- [ ] Complete tour with keyboard only
- [ ] Test with VoiceOver/NVDA/JAWS
- [ ] Verify prefers-reduced-motion respected
- [ ] Check color contrast in both themes
- [ ] Test on mobile with TalkBack/VoiceOver

## Open Questions

1. **Should tour show on every new user or only after onboarding?**
   - What we know: Trigger is `?onboarding=complete`
   - What's unclear: What about users who skip onboarding?
   - Recommendation: Only show after onboarding completion initially; evaluate adding "New here? Take a tour" prompt later

2. **Should tour be different for mobile vs desktop?**
   - What we know: Mobile has different nav (bottom nav, FAB)
   - What's unclear: Worth maintaining two step sets?
   - Recommendation: Start with shared steps, adjust targeting selectors only; evaluate split later based on analytics

3. **How to handle async dashboard content?**
   - What we know: KPIs and ready-to-send queue load async
   - What's unclear: Best timing for tour start
   - Recommendation: Delay tour start 500ms after route, use `onHighlightStarted` to verify element existence

## Sources

### Primary (HIGH confidence)
- [driver.js GitHub](https://github.com/kamranahmedse/driver.js) - v1.4.0, MIT license, 25K stars
- [driver.js Documentation](https://driverjs.com/docs) - API, configuration, installation
- [WCAG 2.1 Keyboard Accessible](https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible.html) - Accessibility requirements

### Secondary (MEDIUM confidence)
- [Appcues Product Tour Best Practices](https://www.appcues.com/blog/product-tours-ui-patterns) - UX patterns
- [Whatfix React Tour Libraries 2026](https://whatfix.com/blog/react-onboarding-tour/) - Library comparison
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility) - Accessibility baseline

### Tertiary (LOW confidence)
- [driverjs-react wrapper](https://github.com/gnvcor/driverjs-react) - React wrapper (less actively maintained than core)
- [Radix primitives tour discussion](https://github.com/radix-ui/primitives/discussions/1199) - Custom build considerations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - driver.js is established, MIT licensed, actively maintained
- Architecture: HIGH - Patterns verified against Next.js App Router docs
- Pitfalls: MEDIUM - Based on common patterns, specific edge cases may vary
- V2 Alignment: HIGH - Tour content strategy derived from project's V1-TO-V2-PHILOSOPHY.md
- Accessibility: HIGH - Based on WCAG 2.1 guidelines and driver.js built-in support

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (30 days - stable domain)
