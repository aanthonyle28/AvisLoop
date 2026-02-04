# Phase 24: Multi-Touch Campaign Engine - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create multi-touch campaigns (up to 4 touches) with preset sequences, enroll jobs on completion, and automatically stop on review/opt-out. Includes campaign CRUD, enrollment tracking, cron processing, and performance analytics.

</domain>

<decisions>
## Implementation Decisions

### Campaign Presets & Customization

- **3 presets available**: Conservative (2 emails), Standard (2 emails + 1 SMS), Aggressive (2 emails + 2 SMS)
- **Touch timing**: Claude's discretion on specific delays (user said "you decide")
- **Aggressive preset channel order**: SMS → Email → SMS → Email (lead with SMS for immediacy)
- **Duplication flow**: Copy opens directly in full editor mode, ready to customize
- **Presets are read-only**: Users must duplicate to customize — presets stay pristine as starting points
- **Service type recommendations**: Show "Recommended for HVAC" badges — cleaning gets faster cadence suggested
- **Multi-campaign per business**:
  - Free tier: 1 default campaign for all jobs
  - Pro tier: 1 campaign per service type (HVAC campaign, plumbing campaign, etc.)
  - This is a tiered upsell unlock
- **Campaign-to-service mapping**: One-to-one only — each campaign belongs to exactly one service type (or "all")
- **No matching campaign**: Jobs fall back to default "all services" campaign

### Enrollment Triggers & Stop Conditions

- **Automatic enrollment on job completion**: Job marked complete → immediately enrolled in matching campaign
  - Small checkbox when marking complete: "☑ Enroll in review campaign" (on by default)
  - 90% ignore it (enrolls), 10% uncheck for bad jobs
- **Review detection stops campaign**: Either action stops it:
  - Customer clicks review link (best proxy for intent)
  - Customer submits satisfaction page feedback (Phase 26)
- **Opt-out handling**: Stop immediately, mark as stopped — all pending touches cancelled
- **Manual override**: Business owner can stop only (no pause/resume) — permanent cancellation
- **Repeat customer behavior**:
  - If same customer has new job while in campaign: Cancel old campaign, restart from touch 1 for new job
- **Missing contact info**: Skip the touch, continue sequence (SMS touch with no phone → skip, send next email touch)
- **Enrollment cooldown**: Configurable per business (default 30 days, range 7-90 days)
  - Prevents spam for frequent-visit businesses (cleaning weekly) vs infrequent (plumber break/fix)
- **Do-not-send jobs**: Job-level only — future jobs for same customer can still enroll
- **Stop reason tracking**: Detailed tracking (review_clicked, feedback_submitted, opted_out_sms, opted_out_email, owner_stopped, campaign_paused)
- **Campaign deletion with active enrollments**: Prevent deletion — must stop/remove enrollments first
- **Partial opt-out (SMS but not email)**: Channel-specific skip — opted out of SMS sends email touches only

### Touch Scheduling & Pacing

- **Quiet hours interaction**: Delay to next window (touch scheduled at 10pm → send at 8am next day)
- **Throttle scope**: Per-channel limits (100 emails/hour + 100 SMS/hour)
- **Pacing within hour**: Even spread (~1.7/min for 100 sends over 60 minutes)
- **Retry behavior**: Immediate retry with exponential backoff (1min, 5min, 15min) then mark failed
- **After max retries fail**: Skip touch, continue sequence — mark touch failed, move to next
- **Timing reference point**: Previous touch's **scheduled** time (not actual send time)
  - Prevents cascading delays from quiet hours or failures
  - Keeps campaign duration predictable
  - Guardrail: Never send touch N+1 before touch N completes
- **Service type timing**: Affects touch 1 only — HVAC 24h default applies to first touch, rest use campaign settings
- **Timezone for quiet hours**: Customer timezone (customer.timezone field)
- **Multi-enrollment collision**: Dedupe by channel — max 1 email + 1 SMS per customer per hour
- **Weekends**: Send as scheduled — no special treatment (home services work weekends)

### Campaign Management UI

- **Location**: Dedicated /campaigns page (new navigation item)
- **List view shows**: Name + service type + status + quick stats (active enrollments, sent/opened/converted)
- **Edit flow**: Full page editor with sequence visualization and preview
  - Drawer for quick viewing, "Edit Campaign" button → full page
  - Space for horizontal/vertical flow visualization of touch sequence
  - Side-by-side preview panel possible
- **Performance stats location**: On the campaign page itself (list has quick stats, detail shows full breakdown)
- **Enrollment visibility**: Yes, list in campaign detail — shows active enrollments with status
- **Template selection**: Dropdown with preview — select template, preview appears beside
- **Preset picker**: Card-based picker — 3 cards showing Conservative/Standard/Aggressive with touch counts
- **Status toggle**: Toggle switch directly in campaign list row for quick on/off

### Claude's Discretion

- Exact touch timing delays for presets (within standard/fast/slow patterns)
- Visual design of sequence flow diagram in editor
- Exact retry intervals (1min, 5min, 15min suggested but flexible)
- Loading states and empty states for campaigns page
- Error message copy for enrollment failures

</decisions>

<specifics>
## Specific Ideas

- **Tiered unlock model**: Free = 1 default campaign, Pro = per-service campaigns (the hook for upgrades)
- **"Set it and forget it" promise**: Automatic enrollment is the core value — product should generate results even for users who never log back in
- **Predictable campaign duration**: Anchor timing to scheduled time, not actual send time — "campaign finishes Friday" is a promise you can make
- **SMS-first for aggressive**: Lead with SMS for immediacy, alternate channels to vary touchpoints
- **Restart on repeat jobs**: New job = fresh start, don't stack campaigns on same customer
- **Full page editor for campaigns**: "Complex creation deserves space to think" — campaigns aren't quick edits, they're designs

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 24-multi-touch-campaign-engine*
*Context gathered: 2026-02-04*
