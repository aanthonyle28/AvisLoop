# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** Turn job completions into Google reviews automatically -- multi-touch follow-up sequences that send the right message at the right time.
**Current focus:** Milestone v2.0 -- Review Follow-Up System

## Current Position

**Phase:** Phase 22 - Jobs CRUD & Service Types
**Plan:** 04/05 complete
**Status:** In progress (22-05 pending)
**Last activity:** 2026-02-03 -- Completed 22-03 (Jobs page and list components)

**Progress:** [█████████████████████████████████████████░] 95/100+ total plans complete

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
v2.0 Phase 20:      ████████ 8/8 COMPLETE (A2P deferred)
v2.0 Phase 22:      ████░ 4/5 (22-05 pending)
v2.0 (Ph 21,23-29): ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0/TBD PENDING
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
| compatibility-view-pattern | Create view 'contacts' as SELECT * FROM customers during table rename | Allows safe rollback during migration window, zero-downtime migration | 2026-02-03 |
| csv-phone-best-effort | CSV import uses best-effort phone parsing (invalid phones don't block import) | Better UX - import succeeds, user fixes phone issues after via review workflow | 2026-02-03 |
| sms-consent-drawer-only | SMS consent status editable only in drawer, read-only in edit form | Prevents accidental audit trail corruption, forces deliberate consent changes | 2026-02-03 |
| timezone-auto-detect | Auto-detect timezone from browser Intl API on customer creation | Prepares for Phase 21 quiet hours enforcement, defaults to America/New_York | 2026-02-03 |
| service-type-text-check | Use TEXT with CHECK constraint for service types (not ENUM) | Easier to add/remove types in future migrations | 2026-02-04 |
| service-type-lowercase | Store service types lowercase in database | Avoids casing issues in queries and UI matching | 2026-02-04 |
| service-timing-defaults | Per-service timing defaults in JSONB (cleaning 4h, roofing 72h, etc.) | Based on service completion verification needs | 2026-02-04 |
| data-layer-separation | lib/data/ for reads, lib/actions/ for mutations | Matches existing business.ts pattern, keeps data layer clean | 2026-02-04 |

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
- [x] Plan Phase 20 (Database Migration & Customer Enhancement)
- [x] Execute Phase 20 (8/8 plans complete)
- [x] Design jobs table schema and RLS policies (22-01 complete)
- [x] Execute Phase 22-02 (Jobs TypeScript types, validations, server actions)
- [x] Execute Phase 22-03 (Jobs page and list components)
- [x] Execute Phase 22-04 (Add/Edit job forms)
- [ ] Start Twilio A2P 10DLC registration (2-4 week lead time) -- BLOCKS Phase 21
- [ ] Plan Phase 21 (SMS Foundation & Compliance)
- [ ] Design campaign_enrollments schema
- [ ] Design message_templates migration strategy

### Recent Changes
- 2026-02-04: Phase 22-04 complete (Add/Edit job forms with customer selector)
- 2026-02-04: Phase 22-03 complete (Jobs page and list components)
- 2026-02-04: Phase 22-02 complete (Job types, validations, server actions, data fetching)
- 2026-02-04: Phase 22-01 complete (Jobs table schema, service type settings, DATA_MODEL.md)
- 2026-02-03: Phase 20 COMPLETE (8/8 plans, verified, A2P deferred)
- 2026-02-03: Phase 20-08 deferred (A2P 10DLC registration skipped for now)
- 2026-02-03: Phase 20-07 complete (SMS consent UI with TCPA audit trail and timezone capture)
- 2026-02-03: Phase 20-06 complete (CSV import phone handling with review workflow)
- 2026-02-03: Phase 20-05 complete (customer phone/tags columns, tag filter UI)
- 2026-02-03: Phase 20-04 complete (contacts→customers terminology migration)
- 2026-02-03: Phase 20-03 complete (libphonenumber-js utilities and schemas)
- 2026-02-03: Phase 20-02 complete (customer field enhancements)
- 2026-02-03: Phase 20-01 complete (contacts table renamed to customers)
- 2026-02-02: v2.0 roadmap created (76 requirements mapped to 10 phases)

### Known Issues
- None (v1.0-v1.4 shipped clean)

## Session Continuity

**Last session:** 2026-02-03
**Stopped at:** Completed 22-03-PLAN.md (Jobs page and list components)
**Resume file:** .planning/phases/22-jobs-crud-service-types/22-03-SUMMARY.md
**Next action:** Execute 22-05 (Service Type Settings UI)

**Key context for next session:**
- Phase 22: 4/5 complete, 22-05 (Service Type Settings UI) pending
- Jobs UI complete: page, table, filters, empty state, add/edit sheets
- Components: CustomerSelector, ServiceTypeSelect, AddJobSheet, EditJobSheet
- Server actions: createJob, updateJob, deleteJob, markJobCompleted, markJobDoNotSend
- Data functions: getJobs, getJob, getJobCounts
- Service type settings data layer ready (getServiceTypeSettings, updateServiceTypeSettings)
- Phase 21 (SMS) blocked by A2P registration -- can proceed to Phase 23 after 22-05
