# SMS Compliance Documentation

## A2P 10DLC Registration

**Status:** PENDING
**Brand Registration ID:** [not yet registered]
**Campaign ID:** [not yet registered]
**Approval Date:** [pending]

> **IMPORTANT:** A2P 10DLC registration must be completed before Phase 21 (SMS Foundation & Compliance) can begin. Registration typically takes 3-7 business days.

### Registration Steps (TODO)

1. Create Twilio account at twilio.com
2. Register A2P 10DLC Brand (Twilio Console → Messaging → Trust Hub → Brand Registrations)
3. Register A2P 10DLC Campaign (after brand approval)
4. Add credentials to .env.local:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN

### Registration Details (to be completed)

**Business Information:**
- Legal Name: [to be filled]
- EIN/Tax ID: [redacted]
- Industry: Professional Services

**Campaign Details:**
- Use Case: Customer Care / Marketing
- Description: Review request follow-ups for completed home service jobs
- Opt-in: Checkbox consent during customer creation or job completion
- Opt-out: STOP keyword handling with automatic database update

### Supported Opt-Out Keywords
- STOP
- STOPALL
- UNSUBSCRIBE
- CANCEL
- END
- QUIT

Per TCPA Jan 2026 rules, informal opt-out messages ("Leave me alone", "Don't text me") must also be honored.

## TCPA Compliance

### Consent Requirements
- Individual consent only (no bulk consent capture)
- Consent captured via checkbox with clear disclosure
- Audit trail stored: status, timestamp, method, IP, captured_by
- 4-year retention for audit trail

### Consent Fields (customers table)
| Field | Purpose |
|-------|---------|
| sms_consent_status | opted_in / opted_out / unknown |
| sms_consent_at | Timestamp of consent |
| sms_consent_source | How consent was captured |
| sms_consent_method | verbal_in_person, phone_call, etc. |
| sms_consent_notes | Additional context |
| sms_consent_ip | Client IP at consent time |
| sms_consent_captured_by | User ID who recorded consent |

### Quiet Hours
- Default: 8am-9pm customer local time
- Uses customer.timezone field (IANA format)
- Messages outside window are queued for next available time

## Twilio Configuration

**Environment Variables:**
- TWILIO_ACCOUNT_SID: [not yet configured]
- TWILIO_AUTH_TOKEN: [not yet configured]
- TWILIO_PHONE_NUMBER: [to be configured in Phase 21]

**Webhook Endpoints (Phase 21):**
- /api/webhooks/twilio/inbound - Handles STOP keywords
- /api/webhooks/twilio/status - Delivery status updates

---
*Last updated: 2026-02-02*
*Status: Awaiting A2P 10DLC registration before Phase 21*
