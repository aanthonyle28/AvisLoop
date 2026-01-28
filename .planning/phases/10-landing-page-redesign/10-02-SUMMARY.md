# Phase 10 Plan 02: Hero Section Redesign Summary

## Metadata
```yaml
phase: 10
plan: 02
subsystem: marketing
tags: [hero, landing-page, design, ui]
dependency-graph:
  requires: [10-01]
  provides: [hero-redesign, image-placeholder-component, geometric-marker-integration]
  affects: [10-03, 10-04, 10-05]
tech-stack:
  added: []
  patterns: [motion-safe-animations, image-placeholder-pattern]
key-files:
  created:
    - components/ui/geometric-marker.tsx
  modified:
    - components/marketing/hero.tsx
decisions:
  - id: HERO-001
    decision: Dark headline text instead of primary blue
    rationale: Matches reference design for cleaner, more professional look
  - id: HERO-002
    decision: Asymmetric 55%/45% grid layout
    rationale: Emphasizes content on left while giving mockup visual prominence on right
  - id: HERO-003
    decision: Dark primary CTA with light outline secondary
    rationale: Strong visual hierarchy, matches reference design
metrics:
  duration: ~2.5 minutes
  completed: 2026-01-28
```

## One-liner
Asymmetric hero layout with dark typography, ImagePlaceholder component, and GeometricMarker stat badges

## Changes Made

### Task 1: Hero Layout Structure
- Changed grid from equal columns to 55%/45% split
- Removed background gradient (clean white background)
- Content left, mockup right on desktop
- Stacks vertically on mobile

### Task 2: Headline Styling
- Changed from primary blue span to dark `text-foreground`
- Updated copy to "Get More Reviews. Automatically."
- Added `text-balance` for better line breaks

### Task 3: CTA Redesign
- Primary CTA: `bg-foreground text-background` (dark button)
- Secondary CTA: Light outline with subtle hover
- Simplified labels: "Get Started Free" and "See Pricing"

### Task 4: Floating Mockup Section
- Redesigned main card with browser chrome dots
- Added image placeholder area (4:3 aspect ratio)
- Simplified interface mockup
- Updated send button to dark style

### Task 5: ImagePlaceholder Component
- Created inline component for hero section
- Dashed border placeholder with gray background
- Shows "Your photo here" text when no image
- Supports `src` prop for when image is provided
- Uses Next/Image with proper sizing

### Task 6: GeometricMarker Integration
- Replaced TrendingUp icon with triangle marker
- Used lime color for positive metrics
- Cleaner, minimal styling in stat card

### Task 7: Trust Indicators
- Removed CheckCircle2 icons
- Simplified to text with bullet separators
- "25 free sends • 2-min setup • Cancel anytime"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created GeometricMarker component**
- **Found during:** Initial task load
- **Issue:** Plan depends on GeometricMarker from 10-01, but component didn't exist
- **Fix:** Created `components/ui/geometric-marker.tsx` with triangle/circle variants
- **Files created:** `components/ui/geometric-marker.tsx`
- **Commit:** cc7b8db

**2. [Rule 2 - Missing Critical] Added motion-safe animations**
- **Found during:** Task 4 execution
- **Issue:** Floating cards had transform animations without reduced-motion support
- **Fix:** Added `motion-safe:` prefix to all transform/transition classes
- **Files modified:** `components/marketing/hero.tsx`
- **Commit:** a37875f (included in main hero commit)

## Verification Results
```
pnpm lint    - PASSED
pnpm typecheck - PASSED
```

## Commits
| Hash | Type | Description |
|------|------|-------------|
| cc7b8db | feat | Add GeometricMarker component (blocking issue fix) |
| a37875f | feat | Redesign hero section with asymmetric layout |

## must_haves Verification
- [x] Hero has asymmetric 2-column layout (content left, mockup right)
- [x] Headline uses dark text (not primary blue)
- [x] Floating mockup includes image placeholder slot
- [x] Stat badge uses GeometricMarker triangle
- [x] CTAs are dark primary + light outline style
- [x] Trust indicators are simplified text

## Next Phase Readiness

**Dependencies satisfied:**
- GeometricMarker component available for other sections
- Hero redesign complete and ready for visual review

**Blockers:** None

**Notes for next plans:**
- ImagePlaceholder pattern can be extracted to shared component if needed elsewhere
- Lime color used for positive metrics, coral available for negative/warning metrics
