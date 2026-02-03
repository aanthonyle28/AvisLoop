# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** Turn job completions into Google reviews automatically -- multi-touch follow-up sequences that send the right message at the right time.
**Current focus:** Milestone v2.0 -- Review Follow-Up System

## Current Position

**Phase:** Phase 20 - Database Migration & Customer Enhancement
**Plan:** --
**Status:** Ready to plan
**Last activity:** 2026-02-02 -- v2.0 roadmap created

**Progress:** [████████████████████████████████░░░░░░░] 83/93+ total plans complete

```
v1.0 MVP:           ████████████████████████████████████████████████ 48/48 SHIPPED
v1.1 Scheduled:     █████ 5/5 SHIPPED
v1.2 Onboarding:    █████████ 9/9 SHIPPED
v1.2.1 Tech Debt:   ████ 4/4 SHIPPED
Phase 19 UX:        ████████ 8/8 COMPLETE
Phase 20 Layout:    ██ 2/2 COMPLETE (v1.3)
Phase 21 Preview:   ██ 2/2 COMPLETE (v1.3)
Phase 22 Drawers:   ███ 3/3 COMPLETE (v1.3)
Phase 25 Story:     ██ 2/2 COMPLETE (v1.4)
v2.0 (Ph 20-29):    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0/TBD NOT STARTED
```

## What's Been Built

See .planning/ROADMAP.md for full history.

**v1.0 through v1.4 (shipped):**
- Auth, business profiles, contacts, sending, history, billing, onboarding, public pages
- Scheduled sending with cron processing
- Design system overhaul, Google OAuth, simplified onboarding
- Send-first dashboard with 3-page nav, stat/activity strips, request detail drawer
- Unified status badges, email preview (compact + full modal), contact detail drawers
- Landing page problem/solution storytelling sections

**Reusable components for v2.0:**
- StatusBadge component (Figma-spec colors/icons)
- Request detail drawer (Sheet-based, resend support)
- Contact detail drawer (auto-saving notes)
- Email preview (compact snippet + full modal)
- Template selector with "Create Template" option
- Textarea component
- Design system (CSS variables, dark mode, Phosphor icons, Kumbh Sans)

**v2.0 Roadmap (Phases 20-29):**
- Phase 20: Database Migration & Customer Enhancement (customers table, phone, tags, SMS fields, A2P registration, timezone)
- Phase 21: SMS Foundation & Compliance (Twilio sending, STOP handling, quiet hours, webhook verification)
- Phase 22: Jobs CRUD & Service Types (jobs table, service taxonomy, completion triggers, timing defaults)
- Phase 23: Message Templates & Migration (unified email+SMS templates, channel selector, migration)
- Phase 24: Multi-Touch Campaign Engine (preset sequences, enrollment, cron processing, analytics)
- Phase 25: LLM Personalization (Vercel AI SDK, GPT-4o-mini, guardrails, fallback)
- Phase 26: Review Funnel (satisfaction filter, conditional routing, feedback storage)
- Phase 27: Dashboard Redesign (pipeline KPIs, ready-to-send queue, attention alerts, quick actions, to-do list)
- Phase 28: Onboarding Redesign (services offered, software used, default campaign, SMS opt-in)
- Phase 29: Agency-Mode Readiness & Landing Page (multi-location schema, performance reports, playbooks, copy updates)

## Tech Stack

Next.js 15 (App Router), TypeScript, Supabase (Postgres + Auth), Tailwind CSS, Resend, Stripe, Upstash Redis, Phosphor Icons, Kumbh Sans, react-countup

**New for v2.0:** Twilio (SMS), Vercel AI SDK (LLM), OpenAI GPT-4o-mini, Anthropic Claude Haiku (fallback), date-fns-tz

## Blockers & Concerns

**Pre-Phase 21 blockers:**
- Twilio account setup required
- A2P 10DLC brand registration (2-4 weeks approval time) -- CRITICAL PATH
- A2P 10DLC campaign registration -- must complete before Phase 21 starts
- TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars

**Pre-Phase 25 blockers:**
- OPENAI_API_KEY env var (GPT-4o-mini)
- ANTHROPIC_API_KEY env var (Claude Haiku fallback)

**Production deployment blockers (unchanged):**
- Resend FROM email domain verification
- Google OAuth provider configured in Supabase dashboard
- CRON_SECRET env var
- Stripe production keys

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
| phase-numbering-restart | Start v2.0 phases from 20 (overwrite old v1.3/v1.4 phases 20-26) | Clean slate for new milestone | 2026-02-02 |
| 10-phase-structure | 76 requirements across 10 phases (20-29) | Balanced depth (standard config), natural delivery boundaries | 2026-02-02 |

## Open Questions

**Phase 20 (Migration):**
- Existing customers migration: email opt-in campaign vs. SMS disabled by default?
- Job status workflow: does "complete" mean technician-complete or office-verified?

**Phase 21 (SMS):**
- Double opt-in vs. single opt-in for SMS consent?
- Twilio number provisioning: shared number or per-business numbers?

**Phase 24 (Campaigns):**
- Campaign timing defaults: validate 24h/72h/168h with customer interviews?
- Multi-day job handling: project_id field vs. customer_id grouping?

**Phase 25 (LLM):**
- Model quality: GPT-4o-mini sufficient or need GPT-4o? (A/B test during implementation)
- Cost budget: $50/month per business acceptable?

**Phase 26 (Review Funnel):**
- Transparency: should customer know routing is based on rating?
- Notification: who gets notified on negative feedback (owner, manager, technician)?

## Accumulated Context

### Todos
- [ ] Plan Phase 20 (Database Migration & Customer Enhancement)
- [ ] Start Twilio A2P 10DLC registration (2-4 week lead time)
- [ ] Design customer tags UI/UX
- [ ] Design jobs table schema and RLS policies
- [ ] Design campaign_enrollments schema
- [ ] Design message_templates migration strategy

### Recent Changes
- 2026-02-02: v2.0 roadmap created (76 requirements mapped to 10 phases)
- 2026-02-02: Requirements defined (14 categories, 76 total)
- 2026-02-02: Research completed (STACK, FEATURES, ARCHITECTURE, PITFALLS synthesized)
- 2026-02-02: Phase 25 (v1.4) storytelling sections shipped

### Known Issues
- None (v1.0-v1.4 shipped clean)

## Session Continuity

**Last session:** 2026-02-02
**Stopped at:** v2.0 roadmap created, ready to plan Phase 20
**Resume file:** .planning/ROADMAP.md
**Next action:** /gsd:plan-phase 20

**Key context for next session:**
- Phase 20 is migration + customer enhancement + A2P registration (7 requirements)
- A2P registration is critical path blocker (must complete before Phase 21)
- Reuse existing contact patterns, extend with phone/tags/SMS fields
- Customer timezone needed for quiet hours compliance in Phase 21
