---
phase: 21-sms-foundation-compliance
plan: 05
completed: 2026-02-04
duration: "~10 minutes"

subsystem: sending
tags: [sms, tcpa, compliance, ui, channel-selector]

dependency_graph:
  requires: [21-02, 21-04]
  provides: [sms-send-action, channel-selector, sms-character-counter]
  affects: [21-06]

tech_stack:
  added: []
  patterns: [server-action, consent-checking, quiet-hours-queue]

key_files:
  created:
    - lib/actions/send-sms.action.ts
    - components/send/channel-selector.tsx
    - components/send/sms-character-counter.tsx
  modified:
    - components/send/quick-send-tab.tsx

decisions:
  - id: sms-consent-gate
    summary: SMS only sends to customers with sms_consent_status='opted_in'
    phase: 21-05
  - id: quiet-hours-queue
    summary: SMS outside 8am-9pm queued via retry queue (not rejected)
    phase: 21-05
  - id: sms-body-auto-populate
    summary: SMS body auto-populates with review link when channel selected
    phase: 21-05
  - id: channel-reset-on-customer-change
    summary: Channel resets to email when customer changes and SMS unavailable
    phase: 21-05

metrics:
  tasks_completed: 4
  tasks_total: 4
  files_created: 3
  files_modified: 1
---

# Phase 21 Plan 05: SMS Send Action & Channel UI Summary

SMS send action with full TCPA compliance and UI components for channel selection on the /send page.

## One-liner

SMS sending action with consent/quiet-hours enforcement and channel toggle UI with character counter.

## What Was Done

### Task 1: SMS Send Action (lib/actions/send-sms.action.ts)

Created `sendSmsRequest` server action implementing full TCPA-compliant SMS sending:

1. **Authentication** - Verifies user session
2. **Rate limiting** - Per-user rate limit check
3. **Business/customer lookup** - Gets business and validates customer belongs to business
4. **Phone validation** - Requires valid phone number (phone_status='valid')
5. **Consent checking** - MUST have sms_consent_status='opted_in' before sending
6. **Quiet hours enforcement** - If outside 8am-9pm customer local time, queues for later via retry queue
7. **Monthly quota** - Checks against MONTHLY_SEND_LIMITS
8. **Send log creation** - Creates send_log with channel='sms' and status='pending'
9. **Twilio send** - Sends via sendSms() from lib/sms/send-sms.ts
10. **Result handling** - Updates send_log and customer tracking fields

Returns `SmsActionState` with:
- `queued: true` and `queuedFor` timestamp when scheduled for quiet hours
- `success: true` on immediate send
- `error` with message and retry queued on failure

### Task 2: SMS Character Counter (components/send/sms-character-counter.tsx)

Created two components for SMS length feedback:

**SmsCharacterCounter**
- Shows current length vs 160 limit
- Displays segment count when exceeds single segment
- Color coding: green (single), amber (2 segments), red (3+)
- Uses tabular-nums for stable width

**SmsCharacterNotice**
- Shows warning message below textarea when exceeds single segment
- Amber for 2 segments ("higher cost")
- Red for 3+ segments ("delivery issues")

### Task 3a: Channel Selector (components/send/channel-selector.tsx)

Created email/SMS toggle using Radix UI Tabs:
- Envelope icon for email, ChatCircle icon for SMS
- Disabled state for SMS with reason text
- SMS disabled reasons:
  - "Customer has no phone number"
  - "Phone number is invalid"
  - "Customer has not opted in to SMS"

### Task 3b: Send Page Integration (components/send/quick-send-tab.tsx)

Integrated channel selection into QuickSendTab:

1. **Channel state** - `useState<'email' | 'sms'>('email')`
2. **SMS availability computation** - `canSendSms` memo checks phone_status and sms_consent_status
3. **Disabled reason computation** - `smsDisabledReason` memo provides user-friendly message
4. **Auto-reset channel** - Resets to email when customer changes and SMS unavailable
5. **SMS body auto-populate** - Pre-fills with review link when SMS selected
6. **Channel selector UI** - Shows below contact selection
7. **SMS body textarea** - Shows with character counter when SMS channel selected
8. **Action switching** - Uses sendSmsRequest for SMS, batchSendReviewRequest for email
9. **Queued response handling** - Toast notification with scheduled time when quiet hours active

## Key Integration Points

```
lib/actions/send-sms.action.ts
    ├── imports sendSms from lib/sms/send-sms.ts
    ├── imports checkQuietHours from lib/sms/quiet-hours.ts
    └── imports queueSmsRetry from lib/actions/sms-retry.ts

components/send/quick-send-tab.tsx
    ├── imports ChannelSelector from ./channel-selector
    ├── imports SmsCharacterCounter, SmsCharacterNotice from ./sms-character-counter
    └── imports sendSmsRequest from lib/actions/send-sms.action.ts
```

## Deviations from Plan

None - plan executed exactly as written.

## Test Verification

- `pnpm typecheck` - Passes for all new files (pre-existing errors in campaign components unrelated)
- `pnpm lint` - Passes for all new/modified files

## Next Phase Readiness

Phase 21-06 (SMS Testing & Verification) can proceed:
- SMS action is complete and exports sendSmsRequest
- Channel selection UI is integrated
- Quiet hours enforcement routes to retry queue
- All consent checking in place

**Blocked by:** Twilio A2P campaign approval (1-3 business days from 2026-02-03)
- Runtime SMS tests require approved A2P campaign
- Code complete, waiting for infrastructure approval

## Commits

| Hash | Type | Description |
|------|------|-------------|
| ed43fc3 | feat | SMS send action with consent and quiet hours checks |
| 06be4db | feat | SMS character counter component |
| ca1cdfb | feat | ChannelSelector component |
| 17d3d73 | feat | Integrate channel selection into send page |
