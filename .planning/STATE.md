# Project State

## Current Position

**Milestone:** v2.0 Review Follow-Up System
**Phase:** 24 of 10 (Multi-Touch Campaign Engine)
**Plan:** 2 of 7 in Phase 24
**Status:** In progress
**Last activity:** 2026-02-04 - Completed 24-02-PLAN.md

**v2.0 Progress:** ████████░░░░░░░░░░░░░░░░ (3/10 phases complete)

## v2.0 Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 20 | Database Migration & Customer Enhancement | ✅ Complete |
| 21 | SMS Foundation & Compliance | ⏸️ Blocked (A2P) |
| 22 | Jobs CRUD & Service Types | ✅ Complete |
| 23 | Message Templates & Migration | ✅ Complete |
| 24 | Multi-Touch Campaign Engine | 🔄 In progress (2/7 plans) |
| 25 | LLM Personalization | 📋 Not started |
| 26 | Review Funnel | 📋 Not started |
| 27 | Dashboard Redesign | 📋 Not started |
| 28 | Onboarding Redesign | 📋 Not started |
| 29 | Agency-Mode Readiness & Landing Page | 📋 Not started |

## Blocker

**Phase 21 blocked:** Twilio A2P 10DLC campaign registration pending (brand approved 2026-02-03, campaign submitted same day, typically 1-3 business days for approval).

Phase 24 can proceed in parallel since it doesn't depend on SMS sending working.

## Accumulated Decisions

### Phase 23

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| Discriminated union validation | 23-02 | Email requires subject, SMS does not | All template forms must handle channel field |
| SMS soft limit (320 chars) | 23-02 | Allow 2-segment SMS messages | Validation warns but doesn't block multi-segment |
| Constants mirror migration | 23-02 | Default templates in both code and database | Keep constants and SQL in sync during changes |
| System template protection | 23-03 | is_default=true templates cannot be edited/deleted | Users must copy to customize |
| Channel-based filtering | 23-03 | All data functions accept optional channel param | UI can filter email vs SMS templates |
| GSM-7 encoding detection | 23-04 | Client-side character counting with encoding awareness | Real-time feedback on SMS segmentation |
| SMS warning thresholds | 23-04 | Yellow at 2 segments, red at 3+ segments | Alert users to cost implications |
| Read-only opt-out footer | 23-04 | Opt-out text shown as notice, not editable | TCPA compliance, no user customization |
| Email preview design | 23-05 | Shows From/To, subject, body, CTA button, footer | Matches production email rendering |
| SMS preview design | 23-05 | Phone mockup with bubble, opt-out footer, character count | Simulates customer's view of SMS |

### Phase 24 (24-02)

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| Skip recovery function | 24-02 | FOR UPDATE SKIP LOCKED handles crashed workers | No explicit recovery RPC needed |
| Template_id NULL for presets | 24-02 | Presets don't prescribe templates | Users configure templates after duplication |
| Conservative timing | 24-02 | 24h + 72h delays | Safe, proven email cadence |
| Standard timing | 24-02 | 24h + 72h + 168h delays | Balanced multi-channel approach |
| Aggressive timing | 24-02 | 4h + 24h + 72h + 168h delays | SMS-first for immediacy |

## Known Blockers / Concerns

**Current blockers:**
- Phase 21: Twilio A2P campaign approval (1-3 business days)

**Next actions:**
- Plan Phase 24 (Multi-Touch Campaign Engine) - can proceed without SMS
- Wait for A2P approval before Phase 21 execution

## Session Continuity

**Last session:** 2026-02-04T07:07:25Z
**Stopped at:** Completed 24-02-PLAN.md
**Resume file:** None
