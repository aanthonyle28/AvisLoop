---
phase: 75
plan: 01
subsystem: marketing
tags: [landing-page, web-design, components, v3]
requires: [74-02]
provides: [reputation-route, v3-hero, v3-services, v3-process, v3-pricing, v3-faq]
affects: [75-02]
tech-stack:
  added: []
  patterns: [phosphor-icons-ssr-import, fade-in-animation, accordion-faq]
key-files:
  created:
    - app/(marketing)/reputation/page.tsx
    - components/marketing/v3/hero-webdesign.tsx
    - components/marketing/v3/services-webdesign.tsx
    - components/marketing/v3/process-section.tsx
    - components/marketing/v3/pricing-webdesign.tsx
    - components/marketing/v3/faq-webdesign.tsx
  modified: []
decisions:
  - "Phosphor /dist/ssr imports used in Server Components (services, process, pricing) to avoid 'use client' requirement; direct @phosphor-icons/react used in hero (already client)"
  - "Mock website card in hero uses pure Tailwind — no image assets needed, ships immediately"
  - "Pricing cards use items-stretch on grid so all three reach equal height without JS"
metrics:
  duration: "4 minutes"
  completed: "2026-03-19"
---

# Phase 75 Plan 01: Marketing Landing Page Components Summary

**One-liner:** Six v3 marketing components (hero, services, process, pricing, FAQ) and /reputation preservation route for the web design agency homepage.

## What Was Built

### /reputation route
`app/(marketing)/reputation/page.tsx` — identical JSX to the old homepage, preserving all v2 components (HeroV2, SocialProofStrip, ServicesSection, HowItWorksSection, WhyAvisLoop, AnimatedStatsSection, Testimonials, PricingSection, FAQSection, CTASection). Metadata title updated to include "Reputation Management" and a canonical URL pointing to /reputation.

### v3 Components

| File | Component | Purpose |
|------|-----------|---------|
| hero-webdesign.tsx | `HeroWebDesign` | Two-column hero with mock website card, dual Calendly CTAs, trust line |
| services-webdesign.tsx | `ServicesWebDesign` | 6-card feature grid (website, revisions, maintenance, add-on, portal, no-upfront) |
| process-section.tsx | `ProcessSection` | 4-step numbered process (call → build → go live → revisions) with Calendly CTA |
| pricing-webdesign.tsx | `PricingWebDesign` | Three-card pricing: Basic $199, Advanced $299 (accent border), Review Add-On $99 |
| faq-webdesign.tsx | `FAQWebDesign` | Client component accordion with 8 web-design-specific Q&A pairs |

## Decisions Made

1. **Phosphor SSR imports for Server Components** — `services-webdesign.tsx`, `process-section.tsx`, and `pricing-webdesign.tsx` are Server Components using `@phosphor-icons/react/dist/ssr` imports. The hero is already a Client Component (uses FadeIn which is client-only), so it uses the standard `@phosphor-icons/react` import directly.

2. **Mock website card over screenshots** — The hero right column shows a stylized mock card (browser chrome + fake stats + portal prompt) rather than actual screenshots. Ships immediately, visually communicates the product value (live website + revision tracking), and avoids screenshot maintenance.

3. **Equal-height pricing cards via CSS grid** — `items-stretch` on the grid parent + `h-full flex flex-col` on cards ensures all three pricing cards align to the tallest card without JavaScript. CTA buttons stay pinned to the bottom of each card.

4. **Calendly URL constant** — The Calendly URL `https://calendly.com/anthony-le-avisloop/avisloop-demo-onboarding-call` is defined once as a module constant in each file that uses it (hero, process, pricing) to prevent drift across files.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| ls components/marketing/v3/ — 5 files | PASS |
| ls app/(marketing)/reputation/ — page.tsx | PASS |
| grep lucide-react in v3/ — none | PASS |
| grep $199/$299/$99 in pricing | PASS |
| grep id="pricing" in pricing | PASS |
| grep HeroV2 in reputation/page.tsx | PASS |
| pnpm typecheck | PASS |
| pnpm lint | PASS |

## Next Phase Readiness

Plan 75-02 can proceed immediately. All 5 v3 components are ready for assembly into `app/(marketing)/page.tsx`. The components export named functions:
- `HeroWebDesign` from `@/components/marketing/v3/hero-webdesign`
- `ServicesWebDesign` from `@/components/marketing/v3/services-webdesign`
- `ProcessSection` from `@/components/marketing/v3/process-section`
- `PricingWebDesign` from `@/components/marketing/v3/pricing-webdesign`
- `FAQWebDesign` from `@/components/marketing/v3/faq-webdesign`

No blockers.
