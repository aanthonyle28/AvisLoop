# SMS Compliance Documentation

## A2P 10DLC Registration

**Status:** CAMPAIGN PENDING
**Brand Registration:** APPROVED (2026-02-03)
**Campaign Registration:** PENDING (submitted 2026-02-03, typically 1-3 business days)
**Approval Date:** [awaiting campaign approval]

> **IMPORTANT:** Campaign registration must be approved before Phase 21 (SMS Foundation & Compliance) can begin execution. Typically 1-3 business days.

### Registration Progress

- [x] Create Twilio account
- [x] Register A2P 10DLC Brand — APPROVED
- [x] Submit A2P 10DLC Campaign — PENDING
- [x] Add credentials to .env.local (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
- [ ] Campaign approval (waiting)

### Registration Details

**Business Type:** Sole Proprietorship
**Campaign Use Case:** Sole Proprietorship (single number limit)

**Business Information:**
- Legal Name: [redacted]
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
- TWILIO_ACCOUNT_SID: Configured in .env.local
- TWILIO_AUTH_TOKEN: Configured in .env.local
- TWILIO_PHONE_NUMBER: [to be configured in Phase 21 after campaign approval]

**Webhook Endpoints (Phase 21):**
- /api/webhooks/twilio/inbound - Handles STOP keywords
- /api/webhooks/twilio/status - Delivery status updates

---
*Last updated: 2026-02-03*
*Status: Brand approved, campaign pending — awaiting approval before Phase 21 execution*
