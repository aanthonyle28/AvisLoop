---
phase: 76
plan: "02"
name: promote-v4-homepage
subsystem: marketing
tags: [routing, framer-motion, homepage, v4, landing-page]
depends_on: ["76-01"]
provides: ["v4-homepage-at-root", "client-portal-nav-link"]
affects: ["76-03", "76-04", "76-05", "76-06"]
tech-stack:
  added: []
  patterns: ["(home) route group for standalone layout", "marketing layout opt-out via separate route group"]
key-files:
  created:
    - app/(home)/layout.tsx
    - app/(home)/page.tsx
  modified:
    - components/marketing/v4/nav.tsx
  deleted:
    - app/(marketing)/page.tsx
    - app/new/page.tsx
    - app/new/layout.tsx
decisions:
  - "(home) route group cleanly separates homepage from shared marketing layout"
  - "V4Nav logo href updated from /new to /"
  - "Client Portal added as outline button in both desktop and mobile V4Nav"
metrics:
  duration: "~4 minutes"
  completed: "2026-03-19"
---

# Phase 76 Plan 02: Promote V4 Homepage, Archive V3 Summary

**One-liner:** V4 Framer Motion landing page promoted to `/` via `app/(home)` route group, old V3 homepage and `/new` route removed.

## What Was Built

The V4 Framer Motion landing page (previously at `/new`) is now the canonical homepage at `/`. The old V3 web design landing page has been removed. The `/new` route returns 404.

### Route Changes

| Route | Before | After |
|-------|--------|-------|
| `/` | V3 web design landing (marketing layout) | V4 Framer Motion landing (standalone) |
| `/new` | V4 Framer Motion landing | 404 (deleted) |
| `/reputation`, `/pricing`, `/privacy`, `/terms`, `/client-portal` | Unchanged | Unchanged |

### New Files

**`app/(home)/layout.tsx`** — Minimal standalone layout (no shared nav/footer). The V4 page handles its own navigation and footer via the `V4Nav` and `V4Footer` shared components.

**`app/(home)/page.tsx`** — The homepage. Full V4 design with:
- Hero with parallax fade, FloatingShapes, animated headline
- Marquee (trades + service areas)
- Services (dark section, 5 services)
- Stats (V4Stats: $0 upfront, 48hr turnaround, 99.9% uptime, no contracts)
- Process (4-step grid)
- Testimonials (3 customer quotes)
- Pricing (3 plans: Basic $199, Advanced $299, Reviews $99)
- FAQ (6 questions)
- Final CTA
- V4Nav + V4Footer (shared components from 76-01)

### Modified Files

**`components/marketing/v4/nav.tsx`** — Three fixes:
1. Logo `href` changed from `/new` to `/`
2. Desktop nav: "Client Portal" outline button added before "Book a Call"
3. Mobile menu: "Client Portal" link added before "Book a Call"

### Deleted Files

- `app/(marketing)/page.tsx` — Old V3 web design homepage (removed)
- `app/new/page.tsx` — Old V4 page (promoted to homepage, then deleted)
- `app/new/layout.tsx` — Old standalone layout for /new (deleted)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use `(home)` route group (not `(marketing)`) | Cleanest way to opt out of shared marketing nav/footer. One layout for one page. |
| Delete `(marketing)/page.tsx` | Prevents Next.js route conflict — two route groups can't both define the root `/` page |
| Client Portal as outline button in V4Nav | Matches design language of old marketing layout which had it as an outline-style button |
| Hash anchors stay local (`#pricing`, `#services`) | Anchors still work now that the page IS the homepage |

## Deviations from Plan

None — plan executed exactly as written. The plan provided two approaches (marketing layout overlay vs (home) route group) and the cleaner (home) route group approach was chosen, which the plan explicitly recommended as preferred.

## Verification

- [x] `/` serves the V4 Framer Motion homepage (from `app/(home)/page.tsx`)
- [x] `/new` no longer exists (404)
- [x] All other marketing pages still work under `(marketing)` layout
- [x] `pnpm lint` — PASS
- [x] `pnpm typecheck` — PASS (cleared stale `.next/types` cache from old `(marketing)/page.tsx`)

## Task Commits

| Task | Name | Commit |
|------|------|--------|
| 2 | Create (home) layout | e646982 |
| 3 | Promote V4 page to homepage | cc97c55 |
| Nav | Fix V4Nav logo + Client Portal | bcc15d8 |
| 4 | Remove old V3 homepage and /new route | 302a951 |

## Next Phase Readiness

Phase 76-03 can proceed. The homepage is now V4. Shared V4 components (`components/marketing/v4/`) are stable and ready for use in `/reputation` redesign.
