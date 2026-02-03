# Data Model Documentation

## Table: customers (renamed from contacts)

Stores customer information for each business. Renamed from `contacts` in migration 20260202.

### Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| business_id | UUID | NO | - | FK to businesses |
| name | TEXT | NO | - | Customer name |
| email | TEXT | NO | - | Email address |
| phone | TEXT | YES | - | Phone number (E.164 format) |
| status | TEXT | NO | 'active' | 'active' or 'archived' |
| opted_out | BOOLEAN | NO | false | Email opt-out |
| notes | TEXT | YES | - | Internal notes |
| last_sent_at | TIMESTAMPTZ | YES | - | Last message sent |
| send_count | INTEGER | YES | 0 | Total sends |
| created_at | TIMESTAMPTZ | YES | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | YES | NOW() | Updated timestamp |
| tags | JSONB | NO | '[]' | Array of tag strings, max 5 |
| phone_status | TEXT | NO | 'missing' | 'valid', 'invalid', or 'missing' |
| timezone | TEXT | YES | 'America/New_York' | IANA timezone for quiet hours |
| sms_consent_status | TEXT | NO | 'unknown' | 'opted_in', 'opted_out', 'unknown' |
| sms_consent_at | TIMESTAMPTZ | YES | - | When consent was recorded |
| sms_consent_source | TEXT | YES | - | How consent was obtained |
| sms_consent_method | TEXT | YES | - | Consent method enum |
| sms_consent_notes | TEXT | YES | - | Additional context |
| sms_consent_ip | INET | YES | - | IP address of consent capture |
| sms_consent_captured_by | UUID | YES | - | User who captured consent |

### RLS Policies

- Users can only view/insert/update/delete customers for businesses they own
- Business ownership verified via subquery: `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())`

### Indexes

- idx_customers_business_id (btree)
- idx_customers_business_status (btree on business_id, status)
- idx_customers_sendable (partial: status='active' AND opted_out=false)
- idx_customers_tags (GIN on tags)
- idx_customers_sms_consent_status (btree on sms_consent_status)

### Foreign Keys

- send_logs.customer_id references customers.id
- customers.sms_consent_captured_by references auth.users.id

### Compatibility

- View `contacts` exists for backward compatibility during migration window

### SMS Consent Tracking (TCPA Compliance)

TCPA Jan 2026 rules require full audit trail for SMS consent:
- `sms_consent_status`: Current consent state
- `sms_consent_at`: Timestamp of consent capture
- `sms_consent_source`: Where consent came from ('manual', 'migration', 'website_form', etc.)
- `sms_consent_method`: How consent was given (verbal, phone call, agreement, form, other)
- `sms_consent_notes`: Free-text notes from user
- `sms_consent_ip`: Client IP at time of consent capture
- `sms_consent_captured_by`: User ID who recorded the consent

Existing customers migrated with status='unknown' and source='migration'.
SMS features skip customers with status='unknown' until consent is captured.

### Tag System

Tags stored as JSONB array, max 5 per customer.
- Presets: VIP, repeat, commercial, residential
- Custom tags allowed
- GIN index enables fast filtering with `tags @> '["VIP"]'` or `tags ?| array['VIP', 'repeat']`

### Phone Status Tracking

The `phone_status` field tracks phone number validation state:
- `valid`: Phone number passed E.164 validation
- `invalid`: Phone number failed E.164 validation
- `missing`: No phone number provided (email-only customer)

Set to 'missing' by default on migration. App code updates to 'valid' when E.164 validation passes during customer creation/update.
