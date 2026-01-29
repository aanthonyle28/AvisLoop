# Features Research: Scheduled Email Sending

**Domain:** Scheduled/Deferred Email Sending for Review SaaS
**Researched:** 2026-01-28
**Confidence:** HIGH

## Executive Summary

Scheduled email sending is a table-stakes feature in modern email tools, expected by users who need flexibility in timing review requests. The research reveals clear UX patterns (preset times + custom picker), technical constraints (30-day Resend API limit), and critical edge cases (timezone handling, DST, cancellation flows).

**Key insight:** Simple preset-based scheduling with graceful cancellation is table stakes. Advanced features like recurring sends, timezone detection, or batch rescheduling are differentiators but add significant complexity.

## Table Stakes (Must Have)

Features users expect from scheduled sending. Missing these = feels broken or incomplete.

| Feature | Complexity | Dependencies | Notes |
|---------|------------|--------------|-------|
| **Schedule with presets** | Low | Resend API | "Send now", "In 1 hour", "Tomorrow 9am", etc. Standard pattern across Gmail, Mailchimp, HubSpot. |
| **Custom date/time picker** | Low | UI component | When presets don't match need. Must validate future-only dates. |
| **Cancel scheduled email** | Medium | Database + queue | Before send time. Critical for fixing mistakes. "Rescue" feature. |
| **View scheduled emails** | Medium | Database schema | List of pending sends with send time and recipient. Needed for confidence. |
| **Status tracking** | Medium | Database schema | "Scheduled" → "Sent" → "Delivered/Failed". Users need to know state. |
| **Immediate send option** | Low | Existing flow | "Send now" must remain default/easy path. Don't force scheduling. |

### Why These Are Table Stakes

**Evidence from research:**
- Gmail offers [4 preset times](https://www.getmailtracker.com/blog/how-to-schedule-email-in-gmail): "Tomorrow morning 8am", "Tomorrow afternoon 1pm", "Monday morning", "Pick date & time"
- Outlook provides [similar presets](https://support.microsoft.com/en-us/office/delay-or-schedule-sending-email-messages-in-outlook-026af69f-c287-490a-a72f-6c65793744ba) with custom scheduling
- [Resend API supports](https://resend.com/docs/dashboard/emails/schedule-email) both natural language ("in 1 hour") and ISO 8601 dates
- [Email scheduling tools](https://woodpecker.co/blog/how-to-schedule-an-email/) show cancellation is a must-have: "To edit or reschedule, cancel first (moves to drafts)"

**User expectation:** If you offer scheduling, you must offer cancellation. Scheduled emails without cancel = anxiety.

## Differentiators (Competitive Advantage)

Features that set AvisLoop apart. Nice-to-have, but not expected.

| Feature | Complexity | Value Proposition | Notes |
|---------|------------|-------------------|-------|
| **Smart timezone handling** | High | Respects recipient timezone (9am their time) | Requires contact timezone field + complex logic. [DST edge cases are tricky](https://dev.to/tomjstone/international-saas-nightmare-timezone-edge-cases-and-how-to-solve-them-once-and-for-all-57hn). |
| **Randomized send times** | Low | "Tomorrow 8-9am" feels more natural than "8:00am" | [Gmail extension does this](https://chromewebstore.google.com/detail/gmail-schedule-send-enhan/nggpchkngejemkdngpapoeiedenleopg): "8:23am" vs "8:00am" looks less automated. |
| **Batch reschedule** | Medium | Move all scheduled emails forward/back | Useful if user goes on vacation. Not common in tools. |
| **Preview before schedule** | Low | Same as current immediate send | Already built. Just show before scheduling. |
| **Schedule confirmation toast** | Low | "Scheduled for Jan 28, 9am" | Immediate feedback. Reduces anxiety. |
| **Undo scheduling (5 sec window)** | Medium | Like Gmail's "undo send" | Quick fix for accidental schedules. |

### Why These Matter for AvisLoop

**Randomized send times:** Small differentiation, low complexity. Aligns with AvisLoop's "simple but thoughtful" positioning.

**Timezone handling:** High value for multi-location businesses (Pro tier feature), but [extremely complex](https://dev.to/tomjstone/international-saas-nightmare-timezone-edge-cases-and-how-to-solve-them-once-and-for-all-57hn) due to DST transitions, missing hours (spring forward), and repeated hours (fall back).

**Batch reschedule:** Unique feature not seen in competitors. Could be Pro tier differentiator.

## Anti-Features (Do NOT Build)

Features to deliberately avoid. Either violate constraints, add complexity without value, or conflict with AvisLoop's simplicity.

| Anti-Feature | Reason to Avoid | What to Do Instead |
|--------------|-----------------|-------------------|
| **Recurring scheduled sends** | Out of scope for review requests. Review requests are one-time per service. | N/A - Explicitly not needed. |
| **Schedule past 30 days** | [Resend API limit: 30 days max](https://resend.com/docs/dashboard/emails/schedule-email). Technical constraint. | Enforce 30-day max in UI. Show error if exceeded. |
| **Schedule in the past** | Invalid state. Leads to confusion and edge cases. | Validate date >= now. Reject past dates with clear error. |
| **Edit scheduled email** | [Resend: "Once canceled, cannot reschedule"](https://resend.com/docs/dashboard/emails/schedule-email). Must cancel + recreate. | Cancel → re-create flow. Don't pretend you can edit in-place. |
| **Priority scheduling queue** | Adds complexity. Review requests don't have urgency tiers. | FIFO queue. Simple. |
| **Scheduled sends without cancellation** | Users need escape hatch for mistakes. | Always allow cancel before send time. |
| **Complex schedule builder UI** | Goes against AvisLoop's "2-minute simplicity" value prop. | Stick to presets + simple custom picker. |

### Why These Are Anti-Features

**Recurring sends:** Review tools don't need this. [MailerLite recurring emails](https://emailanalytics.com/recurring-emails/) are for newsletters, not transactional review requests.

**Edit in-place:** [Resend doesn't support it](https://resend.com/docs/dashboard/emails/schedule-email). Cancel + reschedule is the pattern. Don't hide this.

**Complex UI:** [Mailchimp requires paid plan for scheduling](https://www.emailtooltester.com/en/blog/hubspot-vs-mailchimp/). AvisLoop differentiates on simplicity, not power features.

## UX Patterns (Common Implementations)

Standard patterns observed across Gmail, Outlook, Mailchimp, HubSpot.

### Scheduling UI Flow

**Standard pattern (Gmail, Outlook):**
1. User composes email
2. Click "Send" dropdown → "Schedule send"
3. See 3-4 preset options + "Custom date/time"
4. Select preset or open custom picker
5. Confirm → Email moves to "Scheduled" folder

**Applied to AvisLoop:**
1. User selects contacts + template (existing flow)
2. Instead of "Send to X contacts", show "Send" dropdown:
   - "Send now" (default, current behavior)
   - "Schedule send" (new)
3. If "Schedule send", show modal with:
   - Preset buttons: "In 1 hour", "Tomorrow 9am", "In 24 hours", "Custom"
   - Custom: date picker + time picker
   - Timezone indicator (user's local time)
4. Confirm → Toast: "Scheduled for [date, time]"
5. Return to send page (cleared state) or redirect to "Scheduled" tab

### Viewing Scheduled Emails

**Standard pattern (Gmail, Mailchimp):**
- Separate "Scheduled" folder/tab
- Shows: recipient, subject, scheduled time, option to cancel
- Clicking email shows full preview

**Applied to AvisLoop:**
- Add "Scheduled" tab to History page
- Table columns: Contact(s), Template, Scheduled For, Actions (Cancel)
- Cancel button → confirmation modal → moves to canceled state (don't delete)

### Cancellation Flow

**Standard pattern (across tools):**
1. User clicks "Cancel" on scheduled email
2. Confirmation modal: "Cancel scheduled send?"
3. Confirm → Email moves to Drafts/Canceled
4. Toast: "Scheduled send canceled"

**Applied to AvisLoop:**
1. "Scheduled" tab shows "Cancel" button
2. Modal: "Cancel scheduled send to [contact]?"
3. Confirm → Update send_logs.status = 'canceled'
4. Toast: "Send canceled"
5. Optionally show "Undo" for 5 seconds

### Status Lifecycle

**Standard states (observed across tools):**

```
draft → scheduled → sending → sent → delivered
                  ↓
                canceled
```

**For AvisLoop (with existing states):**

```
[compose] → scheduled → queued → sent → delivered/bounced/failed
              ↓
            canceled
```

- **scheduled:** Future send time set, not yet queued
- **queued:** Send time reached, in background job queue
- **canceled:** User canceled before send time
- **sent/delivered/failed:** Existing states (no change)

## Edge Cases & Gotchas

Critical edge cases identified from research. Must handle gracefully.

### Timezone Handling

**Problem:** User in PST schedules "Tomorrow 9am". What if contact is in EST?

**Solutions (pick one):**

| Approach | Complexity | Notes |
|----------|------------|-------|
| **User timezone only** | Low | Store scheduled time in UTC, display in user's TZ. Simple. |
| **Recipient timezone** | High | Requires contact.timezone field + [DST logic](https://dev.to/tomjstone/international-saas-nightmare-timezone-edge-cases-and-how-to-solve-them-once-and-for-all-57hn). Complex. |

**Recommendation for MVP:** User timezone only. Display: "Scheduled for Jan 28, 9:00 AM PST" (user's TZ). Store in DB as UTC.

**Evidence:** [Gmail schedules in user's timezone](https://www.getmailtracker.com/blog/how-to-schedule-email-in-gmail): "Emails will be sent based on the timezone you schedule them in."

### Daylight Saving Time (DST)

**Problem:** User schedules email for "March 10, 2:30am PST". [DST starts at 2am → 3am](https://dev.to/tomjstone/international-saas-nightmare-timezone-edge-cases-and-how-to-solve-them-once-and-for-all-57hn). That time doesn't exist.

**Solution:** Store scheduled time as UTC timestamp. Convert to user TZ only for display. Background job runs on UTC time.

**Implementation:**
- User picks "Tomorrow 9am" in PST
- Convert to UTC: `2026-01-29T17:00:00Z`
- Store: `send_logs.scheduled_for = '2026-01-29T17:00:00Z'`
- Background job triggers at UTC time (immune to DST)

**Evidence:** [Salesforce Marketing Cloud doesn't observe DST](https://www.salesforceben.com/your-guide-to-daylight-saving-and-time-zones-in-marketing-cloud-engagement/): "stays at -0600 from GMT at all times". AvisLoop should use UTC internally.

### Past Date Validation

**Problem:** User opens "Schedule send" modal, goes to lunch, comes back, selects preset "In 1 hour" (now in the past).

**Solution:** Validate on submit. If `scheduledTime < now`, show error: "Selected time is in the past. Please choose a future time."

**Implementation:** Client-side validation + server-side validation (user's clock may be wrong).

### Resend API Limits

**Problem:** Resend [schedules up to 30 days](https://resend.com/docs/dashboard/emails/schedule-email). User tries to schedule 60 days out.

**Solution:** Enforce 30-day max in UI. Disable dates > 30 days in date picker. Show error if exceeded.

**Problem:** [Resend: "Once canceled, cannot reschedule"](https://resend.com/docs/dashboard/emails/schedule-email). User wants to edit scheduled time.

**Solution:** Cancel + re-create flow. UI: "To change send time, cancel and schedule again."

### Account Issues During Scheduling

**Problem:** [Resend: "API may fail if key becomes inactive or account under review"](https://resend.com/docs/dashboard/emails/schedule-email). Scheduled email silently fails.

**Solution:**
1. When scheduled time arrives, attempt send
2. If API returns error, mark as `failed` with error message
3. Show in History tab: "Failed: API key inactive"
4. User can retry or investigate

### Quota Enforcement at Schedule Time

**Problem:** User has 5 sends left this month. Schedules 10 emails for next week. Monthly limit resets before send time. Should quota check at schedule time or send time?

**Options:**

| Approach | Pros | Cons |
|----------|------|------|
| **Check at schedule time** | Users can't over-schedule | May block legitimate scheduling across month boundary |
| **Check at send time** | Flexible | Scheduled sends may fail silently if quota exceeded |
| **Reserve quota** | Guarantees delivery | Complex accounting (what if user cancels?) |

**Recommendation:** Check at send time. If quota exceeded when send time arrives, mark as `failed` with reason: "Monthly quota exceeded". User sees in History tab.

**Rationale:** [Email tools queue and retry](https://betterstack.com/community/guides/scaling-nodejs/best-nodejs-schedulers/), handling failures gracefully. AvisLoop should do same.

## Dependencies on Existing Features

Scheduled sending builds on existing AvisLoop features:

| Existing Feature | How Scheduling Uses It | Changes Needed |
|------------------|------------------------|----------------|
| **Contact selector** | Same multi-select | None. Reuse existing. |
| **Template system** | Same template selection | None. Reuse existing. |
| **Message preview** | Preview before scheduling | None. Works as-is. |
| **send_logs table** | Add `scheduled_for` column | Schema migration: `ALTER TABLE send_logs ADD scheduled_for timestamptz` |
| **batchSendReviewRequest action** | Split into schedule + send | New `scheduleReviewRequest` action. Keep existing for immediate sends. |
| **History page** | Add "Scheduled" tab | UI changes. Filter `status = 'scheduled'`. |
| **Monthly quota** | Check at send time | Logic change: check when job runs, not when scheduled. |
| **Resend integration** | Use `scheduledAt` param | Pass `scheduledAt` to Resend API. |

## Technical Implementation Notes

Based on research of [Node.js queue systems](https://betterstack.com/community/guides/scaling-nodejs/best-nodejs-schedulers/) and [Resend scheduling API](https://resend.com/docs/dashboard/emails/schedule-email).

### Option 1: Resend Native Scheduling (Recommended)

**How it works:**
- Resend API accepts `scheduledAt` parameter: `{ scheduledAt: "in 1 hour" }` or ISO 8601
- Resend handles queuing, retry, delivery
- No background job infrastructure needed

**Pros:**
- Zero infrastructure (no cron, no queue)
- Resend handles retry logic
- Simpler architecture

**Cons:**
- [30-day limit](https://resend.com/docs/dashboard/emails/schedule-email) (enforced by Resend)
- [Cannot reschedule once scheduled](https://resend.com/docs/dashboard/emails/schedule-email) (must cancel + recreate)
- Less control over send time (Resend decides exact moment within window)

**Database schema:**
```sql
ALTER TABLE send_logs ADD COLUMN scheduled_for timestamptz;
ALTER TABLE send_logs ADD COLUMN resend_scheduled_id text; -- for cancellation
```

**Cancel flow:**
1. User clicks "Cancel"
2. Call Resend cancel API with `resend_scheduled_id`
3. Update `send_logs.status = 'canceled'`

### Option 2: Self-Hosted Queue (BullMQ + Redis)

**How it works:**
- Use [BullMQ](https://bullmq.io/) for job scheduling
- Store scheduled jobs in Redis
- Background worker processes jobs at scheduled time
- Call Resend immediately when job runs

**Pros:**
- Full control over scheduling logic
- Can reschedule without cancel + recreate
- Can implement custom features (batch reschedule, timezone magic)

**Cons:**
- Requires Redis infrastructure (cost, complexity)
- Need background worker process (Vercel cron or separate server)
- Must handle job retries, failures, monitoring
- More code to maintain

**Recommendation:** Start with Option 1 (Resend native). Migrate to Option 2 only if advanced features needed (unlikely for review SaaS).

**Evidence:** [Resend scheduling API announcement](https://resend.com/blog/introducing-the-schedule-email-api) shows native scheduling is production-ready. Many SaaS tools rely on email provider scheduling.

## UX Recommendations

Based on research of [Gmail](https://www.getmailtracker.com/blog/how-to-schedule-email-in-gmail), [Mailchimp](https://www.emailtooltester.com/en/blog/hubspot-vs-mailchimp/), and [email scheduling best practices](https://woodpecker.co/blog/how-to-schedule-an-email/).

### Preset Times for AvisLoop

**Recommended presets (match user mental model):**

1. **"Send now"** — Immediate (existing behavior, keep as default)
2. **"In 1 hour"** — Common for "send soon but not now"
3. **"Next morning (9 AM)"** — If before 9am today → today 9am. Else → tomorrow 9am.
4. **"In 24 hours"** — Exactly 24 hours from now
5. **"Custom date & time"** — Full picker for specific needs

**Why these presets:**
- **"Next morning 9am"** matches [optimal send time](https://blog.superhuman.com/best-time-to-send-sales-emails/): "Tuesday/Wednesday 9-11am highest engagement for B2B"
- **"In 24 hours"** aligns with [review request timing](https://orderry.com/blog/how-to-automate-google-reviews/): "Send within 24-48 hours of service"
- **Simple choices** match AvisLoop's simplicity value prop

### Visual Design

**Modal layout:**
```
┌─────────────────────────────────────┐
│ Schedule Send                    [×]│
├─────────────────────────────────────┤
│                                     │
│ When would you like to send this?   │
│                                     │
│ [Send now]  [In 1 hour]            │
│ [Tomorrow 9 AM]  [In 24 hours]     │
│ [Custom date & time...]             │
│                                     │
│ Timezone: Pacific Time (PST)        │
│                                     │
│         [Cancel]  [Schedule Send]   │
└─────────────────────────────────────┘
```

**Scheduled tab (History page):**
```
┌──────────────────────────────────────────────────────┐
│ [All] [Sent] [Scheduled] [Failed]                    │
├──────────────────────────────────────────────────────┤
│ Contact        │ Template  │ Scheduled For   │Actions│
├──────────────────────────────────────────────────────┤
│ john@ex.com    │ Default   │ Jan 28, 9:00 AM │[Cancel]│
│ jane@ex.com    │ Default   │ Jan 28, 9:00 AM │[Cancel]│
└──────────────────────────────────────────────────────┘
```

## Complexity Assessment

| Feature Component | Complexity | Rationale |
|-------------------|------------|-----------|
| Schedule UI (presets) | Low | Simple modal + button handlers |
| Schedule UI (custom picker) | Low | Standard date/time input components |
| Database schema | Low | Single column addition: `scheduled_for` |
| Resend integration | Low | Pass `scheduledAt` parameter |
| Cancel flow | Medium | Resend cancel API + status updates |
| Scheduled tab (History) | Medium | New tab + filtered query |
| Timezone validation | Medium | Convert user TZ → UTC, validate future-only |
| Status lifecycle | Medium | Add "scheduled" and "canceled" states |
| Error handling | Medium | Handle Resend API failures gracefully |
| **Total MVP effort** | **Medium** | ~3-5 days for complete feature |

## Sources

**Email Scheduling Best Practices:**
- [Email Marketing for SaaS 2026](https://mailtrap.io/blog/email-marketing-for-saas/)
- [Best Time to Send Emails 2026](https://blog.superhuman.com/best-time-to-send-sales-emails/)
- [How to Schedule an Email in Gmail](https://www.getmailtracker.com/blog/how-to-schedule-email-in-gmail)
- [Schedule Emails to Send - Gmail Help](https://support.google.com/mail/answer/9214606)
- [How to Schedule an Email? Common Mistakes](https://woodpecker.co/blog/how-to-schedule-an-email/)

**UX Patterns:**
- [Zoho Email Scheduling](https://www.zoho.com/mail/help/schedule-send.html)
- [HubSpot Email Scheduling](https://www.hubspot.com/products/sales/email-scheduling)
- [Resend Schedule Email API](https://resend.com/blog/introducing-the-schedule-email-api)
- [Gmail Schedule Send Enhancer](https://chromewebstore.google.com/detail/gmail-schedule-send-enhan/nggpchkngejemkdngpapoeiedenleopg)

**Technical Implementation:**
- [Resend Schedule Email Docs](https://resend.com/docs/dashboard/emails/schedule-email)
- [Resend Extended Scheduling](https://resend.com/changelog/extended-email-scheduling)
- [BullMQ - Background Jobs for NodeJS](https://bullmq.io/)
- [Node.js Job Queue with BullMQ and Redis](https://oneuptime.com/blog/post/2026-01-06-nodejs-job-queue-bullmq-redis/view)
- [Sending Emails with Queues in Node.js](https://dev.to/muhammadabir/sending-emails-with-queues-in-nodejs-improve-your-apps-email-deliverys-2gog)

**Edge Cases & Timezone Handling:**
- [International SaaS Timezone Edge Cases](https://dev.to/tomjstone/international-saas-nightmare-timezone-edge-cases-and-how-to-solve-them-once-and-for-all-57hn)
- [Salesforce DST and Timezones](https://www.salesforceben.com/your-guide-to-daylight-saving-and-time-zones-in-marketing-cloud-engagement/)
- [Handling Timezone and DST with Python](https://www.hacksoft.io/blog/handling-timezone-and-dst-changes-with-python)

**Platform Comparisons:**
- [HubSpot vs Mailchimp 2026](https://www.emailtooltester.com/en/blog/hubspot-vs-mailchimp/)
- [Mailchimp vs HubSpot Comparison](https://moosend.com/blog/hubspot-vs-mailchimp/)

**Anti-Patterns:**
- [Email Scheduling Mistakes to Avoid](https://woodpecker.co/blog/how-to-schedule-an-email/)
- [Email Warm-up Mistakes 2026](https://www.trulyinbox.com/blog/email-warm-up-mistakes/)
- [2026 Will Punish Lazy Email Marketing](https://www.inc.com/liviu-tanase/2026-will-punish-lazy-email-marketing/91281472)

**Status Tracking:**
- [Zoho Track Email Delivery Status](https://www.zoho.com/mail/help/email-status.html)
- [What is Pending-Sending Status](https://docs.easysendy.com/email-campaigns/kb/what-is-pending-sending-status-of-email-campaign/)
