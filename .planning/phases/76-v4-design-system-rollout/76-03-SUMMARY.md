---
phase: "76"
plan: "03"
name: "redesign-reputation-page"
subsystem: "marketing"
tags: ["v4-design", "framer-motion", "seo", "reputation", "landing-page"]

dependency_graph:
  requires: ["76-01"]
  provides: ["reputation-page-v4"]
  affects: ["76-04", "76-05", "76-06"]

tech_stack:
  added: []
  patterns:
    - "Server Component exports metadata; ReputationContent client component handles Framer Motion"
    - "Page-local constants for section data (stats, faqs, testimonials, features)"
    - "Shared V4 components: FloatingShapes, MarqueeRow, AccentBar, SectionDivider, V4Stats, V4Testimonials, V4FAQ"
    - "Sticky editorial layout (left header + right rows) for How It Works section"
    - "Ghost number grid for feature showcase (same pattern as /new Process section)"

key_files:
  created:
    - app/(marketing)/reputation/page.tsx
    - app/(marketing)/reputation/_components/reputation-content.tsx
  modified: []

decisions:
  - decision: "Client component extracted as ReputationContent in _components subdirectory"
    rationale: "page.tsx must remain a Server Component for Next.js metadata export; Framer Motion requires 'use client'"
  - decision: "Kept (marketing) layout nav+footer instead of adding V4Nav/V4Footer"
    rationale: "The /reputation route uses the (marketing) layout group which already wraps content — adding V4Nav would duplicate the nav"
  - decision: "Single pricing card (not 3-column grid)"
    rationale: "The reputation page sells one product ($99/mo add-on); the 3-column grid from the homepage would be confusing here"
  - decision: "All 8 FAQ items preserved exactly in both JSON-LD schema and V4FAQ component"
    rationale: "SEO structured data and visible content must match; duplicate data is intentional"

metrics:
  tasks_total: 3
  tasks_completed: 3
  duration: "4 minutes"
  completed: "2026-03-19"

commits:
  - hash: "08bb75f"
    message: "feat(76-03): redesign reputation page with V4 design language"
    tasks: [1, 2, 3]
---

# Phase 76 Plan 03: Redesign Reputation Page Summary

**One-liner:** Rebuilt `/reputation` with V4 dark/light Framer Motion design — hero parallax, marquee, sticky editorial How It Works, V4Stats, ghost-number features grid, V4Testimonials, single pricing card, V4FAQ — all SEO metadata and JSON-LD schema preserved exactly.

## What Was Built

The `/reputation` page was completely rebuilt from a 10-component V2 stack into a V4-aligned landing page. The page now matches the design language of `/new` while remaining unique in its review-management focus.

### Architecture

`page.tsx` is a Server Component that exports `metadata` and the `faqSchema` JSON-LD. It renders a `<script>` tag for structured data and delegates all visual content to `ReputationContent` — a client component in `_components/reputation-content.tsx`.

### Sections Built

| Section | Pattern | Design Note |
|---------|---------|-------------|
| Hero | Parallax scroll fade, left headline + right CTA | "We manage your Google reviews. You run jobs." |
| Marquee | Dual-row MarqueeRow (accent + default) | Review terms + trade types |
| How It Works | Dark bg, sticky left header, 5 animated step rows | Same editorial layout as /new Services |
| V4Stats | Dark bg stats strip | 35+ reviews / 4.8 avg / 3x rate / $0/review |
| Features Grid | 4-col ghost-number grid on light bg | Matches /new Process section pattern |
| V4Testimonials | Auto-carousel, 3 review-focused quotes | Same 3 testimonials as /new |
| Pricing | Single card, $99/mo, full feature list | Light bg, no 3-column layout |
| V4FAQ | Dark bg accordion, 8 questions | All FAQs match JSON-LD schema exactly |
| Final CTA | Oversized type, pill CTA | "Your next customer is reading your reviews right now." |

### SEO Preserved

All of the following were kept byte-identical from the original page:
- `metadata` export (title, description, keywords, alternates, openGraph, twitter)
- `faqSchema` JSON-LD object with all 8 Q&A pairs
- `<script type="application/ld+json">` injection

## Verification

- `pnpm lint`: PASS
- `pnpm typecheck`: PASS

## Deviations from Plan

None — plan executed exactly as written. The `(marketing)` layout already provides nav + footer, so V4Nav and V4Footer were correctly omitted (no deviation, this was the right call given the layout context noted in the plan).

## Next Phase Readiness

- 76-04 can proceed: `/pricing` page redesign
- All shared V4 components remain stable — no interfaces changed
