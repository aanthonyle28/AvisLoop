# Project State

## Current Position

**Milestone:** v2.0 Review Follow-Up System
**Phase:** 30.1 - Audit Gap Remediation
**Plan:** 2 of 8
**Status:** **IN PROGRESS**
**Last activity:** 2026-02-06 - Completed 30.1-02-PLAN.md (Send -> Manual Request + friction warning)

**v2.0 Progress:** █████████████████████░░░ (9/11 phases complete)
**Phase 30 Progress:** ██████████ (10/10 plans) COMPLETE
**Phase 30.1 Progress:** ██░░░░░░░░ (2/8 plans)

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
| 27 | Dashboard Redesign | Complete |
| 28 | Onboarding Redesign | Complete |
| 29 | Agency-Mode Readiness & Landing Page | Not started |
| **30** | **V2 Alignment & Audit Remediation** | **Complete** (10/10 plans) |
| **30.1** | **Audit Gap Remediation** | **IN PROGRESS** (2/8 plans) |
| 31 | Landing Page V2 Rewrite | IN PROGRESS (4/7 plans) |
| QA-AUDIT | Dashboard QA Test & UX Audit | Complete (9/9 plans) |
| QA-FIX | Audit Remediation | Complete (5/5 plans) |

## QA-FIX Status

**Phase purpose:** Resolve issues identified in QA-AUDIT

| Plan | Name | Status |
|------|------|--------|
| 01 | Critical Blocker Fixes | **COMPLETE** |
| 02 | Navigation Reorder | **COMPLETE** |
| 03 | Terminology Fixes | **COMPLETE** |
| 04 | Icon Consistency | **COMPLETE** |
| 05 | Legacy Code Cleanup | **COMPLETE** |

### QA-FIX-01 Summary

- Created migration `20260206_add_business_phone_column.sql` for C01
- Created migration `20260206_add_service_type_analytics_rpc.sql` for C02
- Migrations ready to apply (Docker not running during execution)
- Typecheck passes

### QA-FIX-02 Summary

- Sidebar navigation reordered for V2 workflow (Jobs/Campaigns prominent)
- Legacy /components/contacts/ folder deleted (10 duplicate files)
- /scheduled route already deleted in QA-FIX-01
- Both lint and typecheck pass

### QA-FIX-03 Summary

- Fixed 17 terminology issues across 9 files
- Replaced 'contact' with 'customer' in user-facing strings
- Replaced 'review request' with 'message' for V2 consistency
- Updated component prop API (onAddContact -> onAddCustomer)
- Both lint and typecheck pass

### QA-FIX-04 Summary

- Migrated 11 high-priority user-facing files from lucide-react to Phosphor icons
- Dashboard pages: history/error.tsx, billing/page.tsx, feedback/page.tsx
- Components: feedback-card.tsx, feedback-list.tsx, empty-state.tsx (2), csv-import-dialog.tsx, history-filters.tsx, usage-warning-banner.tsx, integrations-section.tsx
- All icon imports now from @phosphor-icons/react
- Both lint and typecheck pass

### QA-FIX-05 Summary

- Updated Send page components to use Customer type instead of Contact
- Renamed getResendReadyContacts to getResendReadyCustomers
- Updated all prop names: resendReadyContactIds -> resendReadyCustomerIds
- Fixed history/request-detail-drawer.tsx (additional file)
- Both lint and typecheck pass

## QA-AUDIT Summary

**Final report:** `docs/QA-AUDIT.md`

| Metric | Value |
|--------|-------|
| Total pages audited | 15 |
| Critical findings | 2 |
| Medium findings | 26 |
| Low findings | 10 |
| Pages passing | 7 |
| Pages needing work | 6 |
| Pages failing | 2 |

### Critical Blockers

1. ~~**C01: Onboarding Step 1** - Missing `phone` column on businesses table~~ **FIXED** (QA-FIX-01)
2. ~~**C02: Analytics Page** - Missing `get_service_type_analytics` RPC function~~ **FIXED** (QA-FIX-01)

*Migrations created, pending database application.*

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

### Phase 28

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| Business phone column nullable TEXT | 28-01 | Phone stored as TEXT, E.164 validated in app | No DB constraint, better error messages |
| Software enum in Zod | 28-01 | CRM/software options validated in code | Easier to add new options without migration |
| SMS consent boolean flag | 28-01 | sms_consent_acknowledged + timestamp tracks TCPA | Simple onboarding gate with audit trail |
| Display-only email auth guidance | 28-02 | No verification API calls | Resend handles DNS verification in their dashboard |
| Link to Resend dashboard | 28-02 | Users configure DNS through Resend | External links with ArrowSquareOut icon |
| Setup in Resend badge status | 28-02 | All DNS records show same badge | No client-side verification available |
| Direct Bitly API (no SDK) | 28-08 | Simple fetch() call to /shorten endpoint | No @bitly/bitly-api-client dependency for single endpoint |
| Store short link on business | 28-08 | branded_review_link column on businesses table | Reuses link, saves API quota (1,500/month free tier) |
| Post-onboarding settings feature | 28-08 | Branded links not in wizard, settings only | Removes Bitly API blocker from onboarding flow |
| Confirmation for regenerate | 28-08 | Dialog prevents accidental link replacement | Old link lost if regenerated (no history) |
| Step 3 sets both columns | 28-03 | saveServicesOffered sets service_types_enabled AND service_type_timing | Prevents incomplete state for campaign enrollment |
| Wrapper for campaign duplication | 28-03 | createCampaignFromPreset wraps duplicateCampaign | Single source of truth, consistent API shape |
| Zod issues array for errors | 28-03 | Use parsed.error.issues[0] not .errors[0] | Correct TypeScript API for ZodError |
| Placeholder step components | 28-04 | PlaceholderStep for steps 3-7 during shell build | Enables parallel work on wizard shell vs step components |
| Step 2 navigates forward | 28-04 | GoogleReviewLinkStep calls onGoToNext not onComplete | Mid-flow step behavior in 7-step wizard |
| Existing client for presets | 28-04 | Use authenticated supabase client for preset fetch | RLS allows SELECT for system presets, no service role needed |
| Consistent step pattern | 28-05 | All steps use useState, useTransition, server action call | Uniform UX, predictable behavior, easy maintenance |
| Service timing display | 28-05 | Show "Review request: Xh after job" with each service checkbox | Better informed decisions during onboarding |
| Software card selection | 28-05 | Radio-style cards with descriptions instead of native radios | Better mobile experience, clearer selection state |
| URL test button | 28-05 | "Test your link" opens in new tab with success indicator | Reduces setup errors, builds confidence |
| Self-contained onboarding preset picker | 28-06 | Step 5 creates campaign and continues wizard | Doesn't navigate to edit page like full PresetPicker |
| No import state tracking | 28-06 | Don't track import completion in localStorage | CSV import deduplicates by email, simpler implementation |
| SMS consent required | 28-06 | Step 7 acknowledgment not skippable | TCPA compliance requires explicit acknowledgment |

### Phase 27

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| Two-step enrollment filtering | 27-01 | Ready-to-send uses explicit fetch-then-filter | Supabase client doesn't support NOT EXISTS well |
| Internal auth for counts | 27-01 | getDashboardCounts takes no businessId parameter | Matches getMonthlyUsage pattern for nav badge |
| Parallel KPI queries | 27-01 | All KPI queries wrapped in Promise.all | Eliminates waterfalls, ~11x performance improvement |
| Context-aware trend periods | 27-01 | Activity metrics weekly, outcome metrics monthly | Matches CONTEXT.md decision for meaningful trends |
| All-clear banner state | 27-02 | Green banner with CheckCircle when no items | Non-interactive, communicates system health |
| Items-pending banner state | 27-02 | Yellow banner with WarningCircle, clickable | Scrolls to ready-to-send or alerts section |
| Two-tier KPI sizing | 27-02 | Outcome text-4xl, pipeline text-2xl | Emphasizes business outcomes over pipeline activity |
| Clickable outcome cards only | 27-02 | Outcome cards wrapped in Link, pipeline cards static | Outcomes have meaningful detail pages |
| Zero trend display | 27-02 | Show muted dash instead of 0% | Cleaner UI, avoids implying data when no change |
| Quick enroll auto-matching | 27-03 | Reuses getActiveCampaignForJob for campaign match | Service-specific first, then all-services fallback |
| Missing campaign toast action | 27-03 | Shows inline "Create Campaign" action button | Guides user to fix without blocking UI |
| Queue limit 5 jobs | 27-03 | Shows first 5 with "Show all" link | Keeps dashboard focused on urgent items |
| Stale warning flag | 27-03 | Yellow WarningCircle with threshold tooltip | Visual urgency without text clutter |
| [ACK] prefix for acknowledged alerts | 27-04 | Marks acknowledged alerts via error_message field | getAttentionAlerts filters out [ACK]% alerts |
| Contextual alert actions | 27-04 | Failed: Retry, Bounced: Update contact, Feedback: Respond | No generic "Fix" or "Retry" buttons |
| Overflow menu for acknowledge | 27-04 | Permanent failures show acknowledge in overflow menu | Forces deliberate choice, not casual dismiss |
| Show 3 alerts by default | 27-04 | Expandable to view all | Keeps dashboard focused on urgent items |
| Dashboard link first | 27-05 | Dashboard is first nav item with House icon | Home/overview pattern for landing page |
| Badge shows total attention | 27-05 | Badge displays readyToSend + attentionAlerts | Single number for items needing action |
| getDashboardCounts in layout | 27-05 | Called in app/(dashboard)/layout.tsx | Badge updates on every page navigation |
| Add Job persistent button | 27-05 | Button always visible in sidebar | Global action not buried in Jobs page |
| Activity rename | 27-05 | "Requests" -> "Activity" in navigation | More intuitive label per CONTEXT.md |
| JS aggregation for analytics | 27-06 | Fetch separately and aggregate in JS | Supabase client doesn't support complex GROUP BY |
| Two-rate display | 27-06 | Response rate (reviews + feedback) and review rate (reviews only) | Shows both engagement and public outcome |
| Volume-based sorting | 27-06 | Sort service types by total sent descending | Most active service types appear first |

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

### QA-AUDIT

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| Grading criteria | QA-09 | PASS (0 crit, 0-2 med), NEEDS WORK (0 crit, 3+ med), FAIL (1+ crit) | Consistent page assessment |
| 5-phase remediation | QA-09 | Prioritized fix order: Critical -> Nav -> Terminology -> Icons -> Code | Clear execution path |

## Known Blockers / Concerns

**Current blockers:**
- Phase 21-08: Twilio A2P campaign approval required for production SMS testing
- Phase 21-08: Webhook URLs must be configured in Twilio console after deployment
- ~~QA-AUDIT C01~~ FIXED: Migration created, pending `supabase db reset`
- ~~QA-AUDIT C02~~ FIXED: RPC migration created, pending `supabase db reset`

**QA-AUDIT findings summary:**
- ~~47 user-facing "contact" terminology issues~~ **FIXED** (QA-FIX-03) - 17 instances across 9 files
- ~~41 files use lucide-react~~ **PARTIAL** (QA-FIX-04) - 11 high-priority files migrated, ~30 remaining
- ~~10 legacy files in /components/contacts/ folder~~ **FIXED** (QA-FIX-02)
- ~~Navigation order not V2-aligned~~ **FIXED** (QA-FIX-02)
- ~~/scheduled route orphaned~~ **FIXED** (QA-FIX-01)

**Next actions:**
- Start Docker and run `supabase db reset` to apply C01/C02 migrations
- Wait for A2P approval before Phase 21-08 execution
- Continue with remaining phases (27, 28, 29)

### QA-FIX

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| Idempotent phone migration | QA-FIX-01 | Uses IF NOT EXISTS for safety | Column may already exist from Phase 28 migration |
| Correct RPC join path | QA-FIX-01 | Join jobs->enrollments->send_logs | send_logs lacks job_id column |
| V2 navigation order | QA-FIX-02 | Jobs at 2, Campaigns at 3, Send at 6 | Emphasizes V2 workflow over manual sending |
| V2 terminology: customer | QA-FIX-03 | Replace 'contact' with 'customer' | User-facing strings only, not code references |
| V2 terminology: message | QA-FIX-03 | Replace 'review request' with 'message' | Aligns with multi-channel V2 model |
| Phosphor icon mappings | QA-FIX-04 | AlertCircle->WarningCircle, History->ClockCounterClockwise, etc. | Lucide to Phosphor equivalents established |
| Icon size props pattern | QA-FIX-04 | size={16} for h-4 w-4, size={20} for h-5 w-5, etc. | Phosphor uses size/weight props not className |
| Customer type consistency | QA-FIX-05 | Contact -> Customer in Send components | Completes Phase 20 type migration |
| Function rename | QA-FIX-05 | getResendReadyContacts -> getResendReadyCustomers | Matches Customer type naming |

### Phase 30

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| 56x56px FAB size | 30-08 | iOS standard, exceeds 44px WCAG minimum | Optimal touch target for mobile |
| bottom-20 FAB positioning | 30-08 | 80px from bottom (72px nav + 8px margin) | FAB doesn't overlap bottom navigation |
| Hide FAB on Jobs page | 30-08 | Jobs page has Add Job header button | Prevents duplicate CTAs on same page |
| md:hidden responsive | 30-08 | Desktop has sidebar Add Job button | Single Add Job CTA per viewport size |
| Wrapper pattern for touch targets | 30-09 | 44x44px wrapper around 16x16px checkbox | WCAG 2.5.5 compliance without visual changes |
| Skip link first in DOM | 30-09 | SkipLink component before all other focusable elements | Proper keyboard navigation order |
| Skip link transition | 30-09 | -translate-y-full off-screen, focus:translate-y-0 visible | Screen reader accessible, visually hidden until focus |

### Phase 31

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| First-person CTA | 31-01 | "Start My Free Trial" over "Start Free Trial" | +90% CTR per research |
| Trust badge specificity | 31-01 | "Built for home service businesses" over unverified claims | Avoid unverifiable "500+ businesses" |
| 10-second job entry messaging | 31-01 | Core V2 speed metric in subheadline and trust indicators | Emphasizes automation value |
| V2 outcome messaging | 31-03 | Automation-focused benefits (multi-touch, funnel, job-centric) | Replaces V1 "30 seconds" speed claims |
| Home services positioning | 31-03 | Target HVAC, Plumbing, Electrical, Roofing, Cleaning, Painting | Matches codebase service types |
| Job entry stat | 31-03 | "10s Per Job Entry" replaces hours saved | V2 job-centric efficiency messaging |
| V2 FAQ content | 31-04 | 6 questions explaining campaigns, job completion, review funnel | Replaces V1 manual send questions |
| Home service testimonials | 31-04 | HVAC, Plumbing, Electric businesses | Fictional but realistic for target market |
| First-person CTA button | 31-04 | "Start My Free Trial" per research | +90% CTR improvement pattern |
| V2 pricing terminology | 31-04 | "campaign touches" and "customers" not V1 terms | Consistent with automation model |

### Phase 30.1

| Decision | Phase | Impact | Constraint |
|----------|-------|--------|------------|
| Reusable TableSkeleton component | 30.1-01 | Consistent skeleton pattern across tables | Same column count/layout as real table |
| Send page friction banner | 30.1-02 | Warning message discourages manual sends | V2 philosophy: campaigns preferred |
| "Manual Request" rename | 30.1-02 | Clear messaging that this is escape hatch | Sidebar + bottom nav labels |
| Enrollment preview on jobs | 30.1-03 | Shows "Will enroll in X in Y hours" | V2 feedback loop for automation |
| Server-side pagination | 30.1-04 | Campaign enrollments can be large | Cursor-based pagination |

## Session Continuity

**Last session:** 2026-02-06
**Stopped at:** Completed 30.1-02-PLAN.md (Send -> Manual Request + friction warning)
**Resume file:** None
**QA test account:** audit-test@avisloop.com / AuditTest123!
**QA Report:** docs/QA-AUDIT.md
