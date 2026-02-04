# Project State

## Current Position

**Milestone:** v2.0 Review Follow-Up System
**Phase:** 24 of 10 (Multi-Touch Campaign Engine)
**Plan:** 7 of 11 in Phase 24
**Status:** In progress
**Last activity:** 2026-02-04 - Completed 21-05-PLAN.md

**v2.0 Progress:** ████████░░░░░░░░░░░░░░░░ (3/10 phases complete, 2 phases active)

## v2.0 Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 20 | Database Migration & Customer Enhancement | ✅ Complete |
| 21 | SMS Foundation & Compliance | 🔄 In progress (5/6 plans) |
| 22 | Jobs CRUD & Service Types | ✅ Complete |
| 23 | Message Templates & Migration | ✅ Complete |
| 24 | Multi-Touch Campaign Engine | 🔄 In progress (7/11 plans) |
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
| Sequential touch validation | 24-03 | Zod refine validates touch numbers 1,2,3,4 | Prevents gaps/duplicates at form layer |
| Preset constants | 24-03 | CAMPAIGN_PRESETS mirrors seeded data | Client-side access without DB query |
| Atomic touch replacement | 24-04 | Delete all touches and re-insert on update | Simpler than diffing/merging |
| Manual rollback on touch failure | 24-04 | Delete campaign if touches fail to insert | No transaction support in Supabase client |
| Pause stops enrollments | 24-04 | Pausing campaign stops all active enrollments | Prevents confusing half-active state |
| Delete blocked by enrollments | 24-04 | Cannot delete if active enrollments exist | Prevents orphaned enrollments |
| 30-day enrollment cooldown | 24-05 | Customer can't re-enroll within 30 days | Prevents over-messaging repeat customers |
| enrollInCampaign defaults true | 24-05 | Checkbox on by default in job forms | Users opt out if needed |
| Non-blocking enrollment | 24-05 | Job succeeds even if enrollment fails | Better UX, enrollment logged but doesn't block |
| Service timing override | 24-05 | business.service_type_timing overrides campaign delay | Per-business customization (SVCT-03) |
| Repeat job cancels old enrollment | 24-05 | New job stops old enrollment with 'repeat_job' reason | One active enrollment per customer |
| Quiet hours deferred scheduling | 24-06 | Update scheduled_at instead of failing | Touches automatically retry at next 8am |
| Rate limit defers, doesn't fail | 24-06 | Leave as pending, retry next minute | Smoother burst handling, no lost touches |
| Failed touches advance sequence | 24-06 | Schedule next touch even on failure | Customer gets remaining touches in campaign |

### Phase 21

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| JSONB for provider_message_id | 21-01 | Multi-provider IDs in single column | Stores { resend_id, twilio_sid } |
| Parallel customer_id column | 21-01 | Supports contacts/customers migration window | Both columns reference same data |
| Null client pattern | 21-01 | twilioClient is null when not configured | Use isSmsEnabled() before sending |
| SMS soft limit 320 chars | 21-01 | Matches Phase 23, allows 2 segments | Prevents excessive SMS costs |
| date-fns-tz v3 API | 21-02 | toZonedTime/fromZonedTime function names | Renamed from utcToZonedTime/zonedTimeToUtc |
| Timezone fallback | 21-02 | America/New_York default for invalid timezones | Falls back with console warning |
| STOP keyword detection | 21-02 | Skip opt-out footer if STOP present | Case-insensitive check before appending |
| Public URL for webhook validation | 21-03 | NEXT_PUBLIC_SITE_URL for signature check | Must match what Twilio sees (not proxy URL) |
| Update all matching phones on STOP | 21-03 | Phone collision safety | Shared phone numbers all opt out together |
| Status priority system | 21-03 | Numeric priority prevents out-of-order corruption | Failed (99) always wins |
| Exponential backoff (1/5/15 min) | 21-04 | Industry standard retry timing | Balances retry speed vs. not overwhelming |
| Max 3 retry attempts | 21-04 | Sufficient for transient failures | Prevents infinite loops |
| Consent re-check on retry | 21-04 | Customer may opt out between queue and retry | TCPA compliance maintained |
| SMS consent gate | 21-05 | SMS only sends to opted_in customers | Strict TCPA compliance |
| Quiet hours queue | 21-05 | SMS outside 8am-9pm queued via retry | Not rejected, deferred |
| SMS body auto-populate | 21-05 | Review link auto-populated when SMS selected | UX convenience |
| Channel reset on change | 21-05 | Resets to email when customer changes and SMS unavailable | Prevents stuck state |

## Known Blockers / Concerns

**Current blockers:**
- Phase 21: Twilio A2P campaign approval (1-3 business days from 2026-02-03)
- Phase 21: Twilio env vars must be configured before runtime SMS tests
- Phase 21: Webhook URLs must be configured in Twilio console after production deployment

**Next actions:**
- Continue Phase 21-02 through 21-06 (code can be written, runtime tests blocked)
- Continue Phase 24 in parallel (doesn't depend on SMS sending)
- Wait for A2P approval before production SMS testing

## Session Continuity

**Last session:** 2026-02-04T18:05:08Z
**Stopped at:** Completed 21-05-PLAN.md (SMS Send Action & Channel UI)
**Resume file:** None
