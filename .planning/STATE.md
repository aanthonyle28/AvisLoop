# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Make requesting reviews so simple that business owners actually do it -- one contact, one click, done.
**Current focus:** Milestone v1.4 — Landing Page Redesign

## Current Position

**Phase:** 25 of 27 (Problem/Solution Storytelling) — COMPLETE
**Plan:** 02 of 02 complete
**Status:** Phase complete
**Last activity:** 2026-02-02 — Completed Phase 25 (problem/solution storytelling)

**Progress:** [██████████████████████████████░] 83/85+ total plans complete

```
v1.0 MVP:           ████████████████████████████████████████████████ 48/48 SHIPPED
v1.1 Scheduled:     █████ 5/5 SHIPPED
v1.2 Onboarding:    █████████ 9/9 SHIPPED
v1.2.1 Tech Debt:   ████ 4/4 SHIPPED
Phase 19 UX:        ████████ 8/8 COMPLETE
Phase 20 Layout:    ██ 2/2 COMPLETE
Phase 21 Preview:   ██ 2/2 COMPLETE
Phase 22 Drawers:   ███ 3/3 COMPLETE
Phase 25 Story:     ██ 2/2 COMPLETE
```

## What's Been Built

See .planning/MILESTONES.md for full history.

- **v1.0 MVP:** Auth, business profiles, contacts, sending, history, billing, onboarding, public pages, polish, bulk send
- **v1.1 Scheduled Sending:** Cron processing, scheduling UI, scheduled send management
- **v1.2 Onboarding Redesign:** Design system overhaul, dashboard redesign, Google OAuth, simplified onboarding
- **v1.2.1 Tech Debt:** Migration fix, Phase 4 verification, code cleanup, history pagination
- **Phase 19 UX/UI Redesign:** Send-first dashboard, 3-page nav, onboarding drawer, stat/activity strips, request detail drawer
- **Phase 20 Layout Fixes:** Unified status badges, sticky settings header, optimized activity strip layout
- **Phase 21 Email Preview:** Compact always-visible snippet, full preview modal with resolved variables, "Create Template" dropdown navigation
- **Phase 22 Detail Drawers:** Contact notes foundation (DB column, Textarea component, server action), send page request drawer with inline resend, contact detail drawer with auto-saving notes
- **Phase 25 Problem/Solution Storytelling:** PAS-framework empathy section (3 pain point cards), 3-step How It Works walkthrough, outcome cards with proof points, scroll-triggered animated statistics via react-countup, full landing page integration

## Tech Stack

Next.js 15 (App Router), TypeScript, Supabase (Postgres + Auth), Tailwind CSS, Resend, Stripe, Upstash Redis, Phosphor Icons, Kumbh Sans, react-countup

## Blockers & Concerns

- Resend FROM email domain verification needed for production
- Google OAuth provider must be configured in Supabase dashboard
- CRON_SECRET env var must be set before deployment
- Phase 22-01 migration ready: Run `supabase db reset` or `supabase db push` to apply notes column migration before testing drawer
- v1.4 performance budget must be enforced (LCP <2.5s, CLS <0.1)

## Decisions

| ID | Decision | Context | Date |
|----|----------|---------|------|
| react-countup-scroll-spy | Use react-countup enableScrollSpy for zero-boilerplate scroll-triggered counting | Built-in scroll spy eliminates manual IntersectionObserver, handles SSR edge cases | 2026-02-02 |
| storytelling-section-order | Landing page: Hero -> SocialProof -> Problem -> HowItWorks -> Outcomes -> Stats -> Testimonials -> FAQ -> CTA | Follows empathy-to-trust conversion funnel | 2026-02-02 |
| old-sections-preserved | Keep old features.tsx and stats-section.tsx for rollback | Section replacement preserves old files in case storytelling needs revision | 2026-02-02 |
| drawer-auto-save-debounce | 500ms debounce for notes auto-save | Balances responsiveness with reducing unnecessary server calls | 2026-02-02 |
| flush-on-close | Flush pending notes when drawer closes | Prevents data loss if user types and immediately closes drawer | 2026-02-02 |
| delayed-sheet-opening | 200ms delay when opening edit sheet after closing drawer | Prevents overlapping sheets which creates bad UX | 2026-02-02 |
| stopPropagation-on-actions | stopPropagation on checkbox and action buttons | Prevents row click event from firing when user interacts with controls | 2026-02-02 |
| pas-framework-empathy | Use PAS framework (Problem-Agitate-Solution) for landing page storytelling | Addresses specific emotional pain points (forgetting, awkwardness, complexity) before presenting solution, builds connection with visitors | 2026-02-02 |
| alternating-step-layout | Alternate text/image layout in How It Works (steps 1&3 left, step 2 right) | Visual variety prevents monotony, maintains engagement through 3-step sequence | 2026-02-02 |
| step-description-word-limit | Keep all step descriptions under 15 words | Scannable copy maintains momentum, prevents information overload | 2026-02-02 |
| server-side-drawer-prefetch | Pre-fetch full request data server-side instead of client-side fetch | Send page fetches both summary and full SendLogWithContact data in parallel; trades small upfront cost for instant drawer open | 2026-02-02 |
| reuse-request-drawer | Reuse RequestDetailDrawer component on send page | Avoids duplicate drawer variants, maintains consistent UX across send and history pages | 2026-02-02 |
| notes-optional-field | Notes field is optional in Contact type | Existing rows won't have notes until migration runs, Supabase returns empty string by default | 2026-02-01 |
| notes-character-limit | 10,000 character limit on notes | Prevents abuse while allowing substantial contact notes | 2026-02-01 |
| textarea-follows-input-pattern | Textarea component follows Input component pattern exactly | Maintains design consistency across form components | 2026-02-01 |
| compact-modal-preview-pattern | Refactored preview into compact always-visible snippet with onViewFull callback triggering full preview modal | Phase 21-01 | 2026-02-01 |
| shared-variable-resolution | resolveTemplate helper replaces template variables consistently across compact and full preview | Phase 21-01 | 2026-02-01 |
| template-dropdown-navigation | Template dropdown includes "+ Create Template" option that routes to settings page with #templates fragment | Phase 21-02 | 2026-02-01 |
| create-new-special-value | Use 'create-new' as non-UUID dropdown value to safely detect navigation trigger | Phase 21-02 | 2026-02-01 |
| fade-in-intersection-observer | Use IntersectionObserver API for scroll-triggered animations with trigger-once pattern | Phase 24-01 | 2026-02-01 |
| motion-safe-prefix-pattern | Prefix ALL animation classes with motion-safe: variant for accessibility | Phase 24-01 | 2026-02-01 |
| outcome-focused-hero-headline | Hero headline "3× More Reviews in 2 Minutes" (specific metric + time promise) | Phase 24-01 | 2026-02-01 |
| sticky-header-frosted-glass | Use backdrop-blur with bg-background/95 for modern sticky header UX | Phase 20-02 | 2026-02-01 |
| shrink-truncation-pattern | Non-last chips shrink-0, last chip truncates for optimal horizontal fill | Phase 20-02 | 2026-02-01 |
| inline-styles-for-figma-colors | Use inline styles with exact hex values instead of Tailwind classes for status badges | Figma spec requires precise colors not in Tailwind palette | 2026-02-01 |
| legacy-status-normalization | Normalize legacy status strings to 6 canonical statuses via normalizeStatus function | Maintains backwards compatibility with database/Resend status values | 2026-02-01 |
| css-first-animations | Use CSS-first animation strategy with selective JavaScript | v1.4 Phase 24 | 2026-02-01 |
| v2-component-directory | New landing page components in components/marketing/v2/ for safe migration | v1.4 architecture | 2026-02-01 |
| mobile-first-design | Design mobile layout first (320-428px), then scale up | v1.4 responsive strategy | 2026-02-01 |
| outcome-focused-copy | Use outcome language ("Get 3x more reviews") not feature lists | v1.4 messaging | 2026-02-01 |
| badge-unification | Single StatusBadge component replaces all ad-hoc badge implementations | v1.3 Phase 20 | 2026-02-01 |
| drawer-right-side | Detail drawer opens from right | Phase 19-07 | 2026-02-01 |
| compact-preview-default | Default to compact mode with expand/collapse | Phase 19-03 | 2026-02-01 |
| pill-drawer-pattern | Onboarding as collapsible pill + drawer | Phase 19-04 | 2026-02-01 |

## Session Continuity

**Last session:** 2026-02-02
**Stopped at:** Phase 25 complete — verified 8/8 must-haves
**Resume file:** None
**Next action:** Plan Phase 26 (Features, Testimonials & FAQ)
