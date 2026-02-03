# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** Turn job completions into Google reviews automatically -- multi-touch follow-up sequences that send the right message at the right time.
**Current focus:** Milestone v2.0 -- Review Follow-Up System

## Current Position

**Phase:** Not started (defining requirements)
**Plan:** --
**Status:** Defining requirements
**Last activity:** 2026-02-02 -- Milestone v2.0 started

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
v2.0 Redesign:      ░░░░░░░░░░░░░░░░░░░░ 0/TBD NOT STARTED
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
- **Phase 25 Problem/Solution Storytelling:** PAS-framework empathy section, 3-step How It Works walkthrough, outcome cards with proof points, scroll-triggered animated statistics

**Reusable components for v2.0:**
- StatusBadge component (Figma-spec colors/icons)
- Request detail drawer (Sheet-based, resend support)
- Contact detail drawer (auto-saving notes)
- Email preview (compact snippet + full modal)
- Template selector with "Create Template" option
- Textarea component
- Design system (CSS variables, dark mode, Phosphor icons, Kumbh Sans)

## Tech Stack

Next.js 15 (App Router), TypeScript, Supabase (Postgres + Auth), Tailwind CSS, Resend, Stripe, Upstash Redis, Phosphor Icons, Kumbh Sans, react-countup

**New for v2.0:** Twilio (SMS), Vercel AI SDK (LLM), OpenAI GPT-4o-mini, Anthropic Claude Haiku (fallback)

## Blockers & Concerns

- Resend FROM email domain verification needed for production
- Google OAuth provider must be configured in Supabase dashboard
- CRON_SECRET env var must be set before deployment
- Twilio account + A2P 10DLC registration needed for SMS
- Vercel AI SDK requires OPENAI_API_KEY and ANTHROPIC_API_KEY env vars

## Decisions

| ID | Decision | Context | Date |
|----|----------|---------|------|
| v2-product-pivot | Transform from single-send to follow-up system | Home services need sequences, not one-off emails | 2026-02-02 |
| home-services-first | Optimize for home services, keep general enough | HVAC/plumbing/electrical primary, other verticals secondary | 2026-02-02 |
| twilio-sms | Use Twilio for SMS channel | Most popular, well-documented, A2P support | 2026-02-02 |
| vercel-ai-sdk | Use Vercel AI SDK for LLM abstraction | Provider-agnostic, GPT-4o-mini primary, Haiku fallback | 2026-02-02 |
| llm-fallback-pattern | GPT-4o-mini primary, Haiku on constraint violation | Cost optimization with quality safety net | 2026-02-02 |
| preset-plus-customize | Campaign presets (conservative/standard/aggressive) + duplicate & edit | Best of both: quick start + full control | 2026-02-02 |
| jobs-basic-crud | Jobs with list/add/edit/delete, service type, status, customer link | Minimal but functional job tracking for v2.0 | 2026-02-02 |
| reuse-what-fits | Keep working components (badges, drawers, preview), replace what changes | Preserve investment in Phase 19-25 work | 2026-02-02 |

## Session Continuity

**Last session:** 2026-02-02
**Stopped at:** Milestone v2.0 started, defining requirements
**Resume file:** None
**Next action:** Research domain ecosystem, then define requirements
