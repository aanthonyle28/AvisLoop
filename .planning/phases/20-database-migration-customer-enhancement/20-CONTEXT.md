# Phase 20: Database Migration & Customer Enhancement - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Contacts table renamed to Customers, SMS opt-in fields added, phone number support with E.164 storage, tag system implemented, A2P 10DLC registration complete, timezone support enabled. UI shows /customers page with phone, tags, and SMS consent status.

</domain>

<decisions>
## Implementation Decisions

### Phone number handling
- Phone field is **optional** when adding a customer
- If phone is blank, show "Email-only" badge on customer
- Store phone in **E.164 format** (+15551234567)
- Display US numbers in friendly format: (512) 555-1234
- Accept common input formats: 5125551234, (512) 555-1234, +1 512 555 1234
- Default country = US unless + country code present
- Validate to real E.164 (not just 10 digits)
- **SMS touches skip** if phone missing (don't block entire campaign)
- Add customer to "Needs Attention → Missing phone" queue when SMS skipped
- Copy icon next to phone in customer detail view (click to copy, toast confirmation)

### Phone number import (CSV)
- **Parse + review queue** approach
- Best-effort parsing during import (accept common formats)
- Never fail entire import due to phone issues
- Store phone_status: valid | missing | invalid
- After import show results: Imported / Phone needs review / Skipped counts
- "Review phone issues" button leads to fix-it table
- Fix-it UI: customer name, raw CSV value, suggested parse, edit field, "Mark email-only" option

### Tag system
- **Preset + custom** tags
- Presets: VIP, repeat, commercial, residential
- Users can create custom tags
- Display as **text badges** (no colors)
- **Max 5 tags** per customer
- **Multi-tag filter (OR)** — show customers with ANY selected tag

### SMS opt-in fields
- Migrated customers get **sms_consent_status = unknown** (not opted in, not opted out)
- sms_consent_source = migration for existing records
- Unknown status = SMS touches skipped, email continues
- Add to "Needs Attention → Missing SMS consent" queue
- **Quick checkbox** on customer form: "Customer consented to receive texts (SMS)"
- Helper text: "Required for SMS follow-ups"
- **"Add details" expandable** for audit trail:
  - Consent method dropdown: Verbal (in-person), Phone call, Service agreement, Website form, Other
  - Notes field (optional)
  - Read-only compliance text
- Store: consent_status, consent_at, consent_source, consent_captured_by
- **No bulk consent capture** — individual only for compliance
- Badge in customer drawer: "SMS: Consent needed" with "Mark as consented" button

### Migration strategy
- **Rename in place**: ALTER TABLE contacts RENAME TO customers
- Create temporary **compatibility view**: CREATE VIEW contacts AS SELECT * FROM customers
- Coordinated deploy: DB migration + app code update together
- Rename sequences/constraints for clarity (contacts_id_seq → customers_id_seq)
- **/contacts URL redirects to /customers** (301 redirect)
- **All terminology at once**: Replace all "Contact" with "Customer" in same deploy
- **No downtime needed** — deploy during low traffic, migration is fast
- Drop compatibility view after cleanup window

### Claude's Discretion
- Exact toast messages and copy
- Loading state designs
- Error message wording
- Phone validation library choice
- Tag chip styling details
- Review queue table pagination

</decisions>

<specifics>
## Specific Ideas

- "Email-only" badge when phone is missing
- "SMS: Consent needed" badge with action button in drawer
- Copy icon next to phone (agents love this)
- "Needs Attention" queues for missing phone and missing SMS consent
- CSV import results screen with clear counts and "Review phone issues" CTA
- Fix-it table for phone review: raw value, suggested parse, edit field, "Mark email-only"

</specifics>

<deferred>
## Deferred Ideas

- International phone display formatting beyond +1 — future enhancement
- Bulk consent capture — explicitly ruled out for compliance
- Tech Mode consent capture at job completion — future phase
- SMS keyword opt-in — future phase

</deferred>

---

*Phase: 20-database-migration-customer-enhancement*
*Context gathered: 2026-02-02*
