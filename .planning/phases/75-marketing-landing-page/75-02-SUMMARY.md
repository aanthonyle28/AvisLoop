---
phase: 75-marketing-landing-page
plan: 02
subsystem: ui
tags: [next.js, marketing, landing-page, seo, web-design]

# Dependency graph
requires:
  - phase: 75-01
    provides: v3 web design components (hero-webdesign, services-webdesign, process-section, pricing-webdesign, faq-webdesign) and /reputation route

provides:
  - New homepage at / using v3 web design agency components
  - Updated marketing nav with /reputation link and correct anchor hrefs
  - Updated mobile nav with Phosphor icons and new nav structure
  - Section IDs corrected (services, process) for anchor nav

affects:
  - Any future marketing phase modifying layout.tsx or page.tsx
  - SEO/metadata updates

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component homepage with no 'use client' at page level"
    - "FAQ JSON-LD schema block for web design Q&A pairs"
    - "Phosphor icons in mobile nav (replaces lucide Menu/X)"

key-files:
  created: []
  modified:
    - app/(marketing)/page.tsx
    - app/(marketing)/layout.tsx
    - components/marketing/mobile-nav.tsx
    - components/marketing/v3/services-webdesign.tsx
    - components/marketing/v3/process-section.tsx

key-decisions:
  - "Section IDs updated in v3 components to match nav anchors: services-webdesign id=services, process-section id=process"
  - "Mobile nav updated from lucide-react to @phosphor-icons/react (List/X) to eliminate lucide in marketing components"
  - "Testimonials and CTASection reused unchanged — content-agnostic enough for web design context"
  - "FAQ JSON-LD schema uses the 8 Q&As from faq-webdesign.tsx for SEO"

patterns-established:
  - "v3 components are the authoritative homepage; v2 components are /reputation-only"

# Metrics
duration: 10min
completed: 2026-03-19
---

# Phase 75 Plan 02: Marketing Landing Page Assembly Summary

**New web design agency homepage at / wires five v3 components (hero, services, process, pricing, FAQ) plus reused Testimonials and CTASection; marketing nav updated with /reputation link and corrected anchor hrefs (/#services, /#process)**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-19T00:00:00Z
- **Completed:** 2026-03-19T00:10:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Replaced old v2-component homepage with new web design agency page (HeroWebDesign, ServicesWebDesign, ProcessSection, Testimonials, PricingWebDesign, FAQWebDesign, CTASection)
- Updated marketing layout nav: Services → /#services, How It Works → /#process, added Reputation → /reputation; footer updated with web design copy
- Fixed section IDs in v3 components (id="features" → id="services", id="how-it-works" → id="process") so anchor nav resolves correctly
- Replaced lucide-react Menu/X in mobile-nav.tsx with Phosphor List/X icons
- Added webDesignFaqSchema JSON-LD block with 8 Q&A pairs for SEO

## Task Commits

1. **Tasks 1 + 2 (combined):** `1aa24af` — feat(v4): assemble web design homepage and update nav

## Files Created/Modified

- `app/(marketing)/page.tsx` — Rewritten: v3 components only, web design agency metadata, webDesignFaqSchema
- `app/(marketing)/layout.tsx` — Updated nav anchors, added /reputation link, updated footer copy
- `components/marketing/mobile-nav.tsx` — Updated nav items + Phosphor icons replacing lucide
- `components/marketing/v3/services-webdesign.tsx` — Section id changed from "features" to "services"
- `components/marketing/v3/process-section.tsx` — Section id changed from "how-it-works" to "process"

## Decisions Made

- Section IDs were wrong in v3 components from Plan 01 (id="features" and id="how-it-works" instead of id="services" and id="process"). Fixed inline as part of Task 2 to make anchor nav work.
- Mobile nav had lucide-react imports. Replaced with Phosphor List/X to satisfy the "No lucide-react imports in v3 or updated layout" success criterion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Section IDs in services-webdesign.tsx and process-section.tsx did not match planned anchor hrefs**
- **Found during:** Task 2 (layout nav update)
- **Issue:** services-webdesign.tsx had id="features" and process-section.tsx had id="how-it-works"; nav was being updated to /#services and /#process
- **Fix:** Updated section IDs in both v3 components to match planned anchor targets
- **Files modified:** components/marketing/v3/services-webdesign.tsx, components/marketing/v3/process-section.tsx
- **Verification:** Section IDs confirmed correct before commit
- **Committed in:** 1aa24af

**2. [Rule 1 - Bug] mobile-nav.tsx used lucide-react for Menu/X icons**
- **Found during:** Task 2 (mobile nav update)
- **Issue:** Success criteria requires no lucide-react in updated layout/marketing components
- **Fix:** Replaced lucide Menu/X with Phosphor List/X
- **Files modified:** components/marketing/mobile-nav.tsx
- **Committed in:** 1aa24af

---

**Total deviations:** 2 auto-fixed (2 Rule 1 - Bug)
**Impact on plan:** Both fixes necessary for correctness. Section ID mismatch would have broken anchor navigation. Lucide removal satisfies success criterion. No scope creep.

## Issues Encountered

None.

## Next Phase Readiness

- Phase 75 is complete (both plans done)
- Homepage at / is now the web design agency landing page
- Old reputation/review content is preserved at /reputation and linked from nav
- All anchor hrefs resolve correctly to their sections
- No blockers for future marketing or v4.0 phases

---
*Phase: 75-marketing-landing-page*
*Completed: 2026-03-19*
