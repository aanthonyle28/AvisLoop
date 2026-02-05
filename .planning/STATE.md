# Project State

## Current Position

**Milestone:** v2.0 Review Follow-Up System
**Phase:** 25 of 10 (LLM Personalization)
**Plan:** 11 of 11 in Phase 25
**Status:** Phase complete
**Last activity:** 2026-02-04 - Completed 25-11-PLAN.md (Cost Tracking)

**v2.0 Progress:** ████████████████████░░░░ (8/10 phases complete or nearly complete)

## v2.0 Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 20 | Database Migration & Customer Enhancement | Complete |
| 21 | SMS Foundation & Compliance | Blocked (7/8 plans, A2P pending) |
| 22 | Jobs CRUD & Service Types | Complete |
| 23 | Message Templates & Migration | Complete |
| 24 | Multi-Touch Campaign Engine | Complete (11/11 plans) |
| 25 | LLM Personalization | Complete (11/11 plans) |
| 26 | Review Funnel | Complete (7/7 plans) |
| 27 | Dashboard Redesign | Not started |
| 28 | Onboarding Redesign | Not started |
| 29 | Agency-Mode Readiness & Landing Page | Not started |

## Blocker

**Phase 21 A2P registration:** Twilio A2P 10DLC campaign registration pending (brand approved 2026-02-03, campaign submitted same day, typically 1-3 business days for approval).

Phase 21 nearly complete (7/8 plans). Only 21-08 (integration verification) remains blocked on A2P approval for production SMS testing.

## Accumulated Decisions

### Phase 25

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| SMS 160-char limit for LLM output | 25-02 | Single SMS segment; opt-out appended separately | PersonalizedSmsSchema max 160 chars |
| Discriminated union schema | 25-02 | Single parse handles email or SMS | PersonalizedMessageSchema keyed on channel |
| Fail-fast output validation | 25-02 | Returns on first failure for performance | Order: critical > security > compliance |
| Base64 detection in sanitizer | 25-02 | Truncates suspected base64 injection payloads | Input strings over 20 base64 chars truncated |
| 2x template length cap | 25-02 | Output cannot exceed 2x original template | Prevents LLM verbosity |
| 100 calls/hour LLM rate limit | 25-03 | Prevents runaway LLM costs per business | Upstash sliding window, ratelimit:llm prefix |
| 3-second LLM timeout | 25-03 | Fast fallback to template on slow responses | GPT-4o-mini typically 1-2s |
| Never-throw fallback pattern | 25-03 | personalizeWithFallback always returns a result | LLM failures never block sends |
| Validation failures skip retry | 25-03 | Deterministic failures don't benefit from retry | Only transient errors (timeout, 429, 5xx) retried |
| customBody replaces body text only | 25-04 | Email structure (heading, CTA, footer) stays consistent | LLM controls message tone, not email layout |
| Triple-layer personalization safety | 25-04 | fallback never throws + try/catch + empty defaults | Personalization failure never blocks sends |
| Job service_type in parallel fetch | 25-04 | Zero additional round-trips for personalization context | Added to existing Promise.all |
| Word-level LCS diff algorithm | 25-05 | Readable word-diff for non-developer users | Primary color highlights, not red/green |
| 3-to-5 expandable samples | 25-05 | Default 3 curated samples, expandable to 5 | Matches Phase 25 context preview flow decision |
| Collapsible original template | 25-05 | Original shown via details/summary element | Focus on personalized output, original accessible |
| 95% estimated personalization rate | 25-06 | MVP approximation until send_logs tracking column | isEstimated flag makes this transparent in UI |
| Local state personalization toggle | 25-06 | Campaign form toggle uses React state only | DB column for persistence deferred to 25-07 |
| Parallel settings data fetch | 25-06 | Promise.all for templates + service types + stats | Eliminates sequential waterfall on settings page |
| personalization_enabled DB column | 25-07 | Boolean NOT NULL DEFAULT TRUE on campaigns | Per-campaign toggle persisted to database |
| Form-controlled toggle state | 25-07 | Replaced useState with form watch/setValue | Enables DB persistence through form submission |
| Shared form preview integration | 25-07 | PersonalizationPreview in CampaignForm component | Single integration point for new + edit pages |
| Cron processor personalization check | 25-08 | Fetch campaign.personalization_enabled in touch loop | LLM call skipped when toggle OFF |
| Default to true on missing campaign | 25-08 | campaign?.personalization_enabled !== false | Fail-safe behavior for personalization |
| Word boundary profanity matching | 25-09 | Use \b anchors in regex patterns | Prevents false positives (Scunthorpe problem) |
| Separate PROFANITY_PATTERNS array | 25-09 | Profanity detection separate from business content rules | Clean separation of concerns |
| 10 regex profanity patterns | 25-09 | Covers 6 content categories (profanity, sexual, violence, discrimination, threats, drugs) | <50ms validation budget maintained |
| contains_profanity failure reason | 25-09 | Separate from contains_prohibited_content | Distinct fallback trigger for inappropriate language |
| Gemini Flash for bulk/standard | 25-10 | 70% of calls use Gemini Flash (SMS + email touch 1) | Lower cost for high-volume simple personalization |
| GPT-4o-mini for quality/preview | 25-10 | 25% of calls use GPT-4o-mini (email touch 2+, preview) | Higher quality for variation and samples |
| DeepSeek V3 for edge cases | 25-10 | 5% of calls use DeepSeek via OpenRouter | Experimentation and complex scenarios |
| Secondary model fallback | 25-10 | Validation failures try secondary model before template | Gemini ↔ GPT-4o-mini cross-provider resilience |
| inferModelTask() auto-routing | 25-10 | Model selected based on channel + touch number | No explicit task parameter needed |
| MODEL_COSTS export | 25-10 | Cost constants per model for tracking | Enables downstream cost attribution (25-11) |
| 350/150 token estimates | 25-11 | Average input/output tokens per personalization call | Basis for cost calculation |
| 4.3 weeks per month | 25-11 | Monthly projection multiplier | Weekly sends × 4.3 = monthly estimate |
| Cost transparency display | 25-11 | Settings shows estimated monthly cost | Internal transparency, not user-facing billing |

### Phase 26

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| Rating constraint 1-5 | 26-01 | Table accepts full range | API route controls funnel routing (1-3 to feedback, 4-5 to review) |
| base64url token encoding | 26-02 | URL-safe tokens without padding issues | All review URLs use base64url |
| 30-day token expiration | 26-02 | Tokens expire after 30 days | Review links have time limit |
| 4-star routing threshold | 26-02 | 4-5 stars -> Google, 1-3 stars -> feedback | GOOGLE_THRESHOLD = 4 constant |
| Null return for invalid tokens | 26-02 | parseReviewToken returns null on error | Callers check for null, no try/catch needed |
| Service role for public insert | 26-03 | createFeedback bypasses RLS | Token validation happens in API route |
| Search scope limited | 26-03 | Search filters feedback_text only | Customer name search requires separate join |
| Stats computed in-memory | 26-03 | getFeedbackStats aggregates in JS | Acceptable for expected feedback volumes |
| Radiogroup ARIA pattern | 26-04 | Star rating uses radiogroup role | Standard accessible pattern for ratings |
| Service role for public pages | 26-05 | No user session on public review pages | Service role bypasses RLS after token validation |
| Step-based flow state machine | 26-05 | Clean separation of UI states | States: rating, feedback, redirecting, complete |
| Non-blocking API calls | 26-05 | recordRatingAndStop doesn't block UI flow | API errors logged but don't prevent completion |
| Service role for public APIs | 26-06 | Rating/feedback APIs have no user session | Token validation happens in route handler |
| Non-blocking enrollment stop | 26-06 | Enrollment stop failure doesn't fail request | Logged for debugging but request succeeds |
| Non-blocking email notification | 26-06 | Email failure doesn't fail feedback save | Feedback is primary, notification secondary |
| XSS protection in emails | 26-06 | HTML escaping for user-provided content | Prevents injection in notification emails |
| Phosphor icon for feedback | 26-07 | ChatCircleText matches existing nav icons | Consistent with Phosphor icon set in sidebar |

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
- Phase 21-08: Twilio A2P campaign approval required for production SMS testing
- Phase 21-08: Webhook URLs must be configured in Twilio console after deployment

**Next actions:**
- Phase 27 (Dashboard Redesign) -- can add unresolved feedback badge
- Wait for A2P approval before Phase 21-08 execution
- Phase 28-29 after earlier phases complete

## Session Continuity

**Last session:** 2026-02-04
**Stopped at:** Phase 25 verified (11/11 must-haves passed) - all gap closure plans executed
**Resume file:** None
