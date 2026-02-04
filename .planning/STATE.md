# Project State

## Current Position

**Milestone:** v2.0 Review Follow-Up System
**Phase:** 24 of 10 (Multi-Touch Campaign Engine)
**Plan:** 1 of 11 in Phase 24
**Status:** In progress
**Last activity:** 2026-02-04 - Completed 24-01-PLAN.md

**v2.0 Progress:** ████████░░░░░░░░░░░░░░░░ (3/10 phases complete, 2 phases active)

## v2.0 Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 20 | Database Migration & Customer Enhancement | ✅ Complete |
| 21 | SMS Foundation & Compliance | 🔄 In progress (1/6 plans) |
| 22 | Jobs CRUD & Service Types | ✅ Complete |
| 23 | Message Templates & Migration | ✅ Complete |
| 24 | Multi-Touch Campaign Engine | 🔄 In progress (3/11 plans) |
| 25 | LLM Personalization | 📋 Not started |
| 26 | Review Funnel | 📋 Not started |
| 27 | Dashboard Redesign | 📋 Not started |
| 28 | Onboarding Redesign | 📋 Not started |
| 29 | Agency-Mode Readiness & Landing Page | 📋 Not started |

## Blocker

**Phase 21 A2P registration:** Twilio A2P 10DLC campaign registration pending (brand approved 2026-02-03, campaign submitted same day, typically 1-3 business days for approval).

Phase 21-01 database and client foundation complete. Plans 21-02 through 21-06 can proceed but runtime SMS tests require A2P approval.

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

### Phase 24

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| Denormalized touch timestamps | 24-01 | Fast due-touch queries without joins | Touch scheduled/sent times duplicated in enrollments |
| Service type NULL semantics | 24-01 | NULL = "all services" campaign | Simple default without discriminator field |
| Timing anchored to scheduled_at | 24-01 | Prevents cascading delays | Touch 2 = Touch 1 scheduled + delay (not sent + delay) |
| Partial indexes per touch | 24-01 | Sub-millisecond cron queries | Four separate indexes for touches 1-4 |
| Skip recovery function | 24-02 | FOR UPDATE SKIP LOCKED handles crashed workers | No explicit recovery RPC needed |
| Template_id NULL for presets | 24-02 | Presets don't prescribe templates | Users configure templates after duplication |
| Conservative timing | 24-02 | 24h + 72h delays | Safe, proven email cadence |
| Standard timing | 24-02 | 24h + 72h + 168h delays | Balanced multi-channel approach |
| Aggressive timing | 24-02 | 4h + 24h + 72h + 168h delays | SMS-first for immediacy |

### Phase 21 (21-01)

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| JSONB for provider_message_id | 21-01 | Multi-provider IDs in single column | Stores { resend_id, twilio_sid } |
| Parallel customer_id column | 21-01 | Supports contacts/customers migration window | Both columns reference same data |
| Null client pattern | 21-01 | twilioClient is null when not configured | Use isSmsEnabled() before sending |
| SMS soft limit 320 chars | 21-01 | Matches Phase 23, allows 2 segments | Prevents excessive SMS costs |

## Known Blockers / Concerns

**Current blockers:**
- Phase 21: Twilio A2P campaign approval (1-3 business days from 2026-02-03)
- Phase 21: Twilio env vars must be configured before runtime SMS tests

**Next actions:**
- Continue Phase 21-02 through 21-06 (code can be written, runtime tests blocked)
- Continue Phase 24 in parallel (doesn't depend on SMS sending)
- Wait for A2P approval before production SMS testing

## Session Continuity

**Last session:** 2026-02-04T07:09:02Z
**Stopped at:** Completed 24-01-PLAN.md (Campaign Database Schema)
**Resume file:** None
