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

## Table: jobs

Stores completed service jobs for each business. Each job links to exactly one customer and has a service type for campaign targeting.

### Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| business_id | UUID | NO | - | FK to businesses |
| customer_id | UUID | NO | - | FK to customers |
| service_type | TEXT | NO | - | One of: hvac, plumbing, electrical, cleaning, roofing, painting, handyman, other |
| status | TEXT | NO | 'completed' | 'completed' or 'do_not_send' |
| notes | TEXT | YES | - | Internal notes about the job |
| completed_at | TIMESTAMPTZ | YES | - | When job was marked completed (null if do_not_send) |
| created_at | TIMESTAMPTZ | YES | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | YES | NOW() | Updated timestamp |

### RLS Policies

- Users can only view/insert/update/delete jobs for businesses they own
- Business ownership verified via subquery: `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())`

### Indexes

- idx_jobs_business_id (btree)
- idx_jobs_customer_id (btree)
- idx_jobs_business_status (btree on business_id, status)
- idx_jobs_business_service_type (btree on business_id, service_type)
- idx_jobs_completed_at (partial: completed_at IS NOT NULL)

### Foreign Keys

- jobs.business_id references businesses.id (CASCADE)
- jobs.customer_id references customers.id (CASCADE)

### Service Types

Fixed set of 8 service types (stored lowercase):
- hvac - Heating, ventilation, air conditioning
- plumbing - Plumbing and water systems
- electrical - Electrical work
- cleaning - Cleaning services
- roofing - Roof repair and installation
- painting - Interior/exterior painting
- handyman - General handyman services
- other - Other services not listed

### Status Workflow

Simple two-state workflow for v2.0:
- `completed` - Job is done, triggers campaign enrollment (Phase 24)
- `do_not_send` - Job complete but should not trigger review request

When status changes to 'completed', completed_at is set. Campaign enrollment logic (Phase 24) uses completed_at to determine timing.

## Business Service Type Settings

Added in Phase 22 for service-specific campaign timing:

| Column | Type | Description |
|--------|------|-------------|
| service_types_enabled | TEXT[] | Array of service types this business offers |
| service_type_timing | JSONB | Map of service type to hours until first campaign touch |

Default timing values:
- hvac: 24 hours
- plumbing: 48 hours
- electrical: 24 hours
- cleaning: 4 hours
- roofing: 72 hours
- painting: 48 hours
- handyman: 24 hours
- other: 24 hours

## Table: message_templates

Unified template storage for email and SMS review request messages. Replaces email_templates (view exists for backward compatibility).

### Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| business_id | UUID | YES | - | FK to businesses (NULL for system templates) |
| name | TEXT | NO | - | Template name |
| subject | TEXT | NO | - | Email subject (empty for SMS) |
| body | TEXT | NO | - | Message body |
| channel | TEXT | NO | - | 'email' or 'sms' |
| service_type | TEXT | YES | - | Service category (hvac, plumbing, etc.) |
| is_default | BOOLEAN | NO | false | System template flag |
| created_at | TIMESTAMPTZ | YES | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | YES | NOW() | Updated timestamp |

### Channel Discriminator

- `email`: Full email template with subject + body
- `sms`: SMS message with body only (subject should be empty string)

### System Templates

- 16 default system templates (8 service types x 2 channels)
- System templates have `business_id = NULL` and `is_default = true`
- All users can read system templates (RLS policy)
- Users cannot modify or delete system templates
- "Use this template" creates an editable copy for the business

### Constraints

- `channel IN ('email', 'sms')` - CHECK constraint
- `service_type IN ('hvac', 'plumbing', 'electrical', 'cleaning', 'roofing', 'painting', 'handyman', 'other')` - CHECK constraint (nullable)
- `name` minimum 1 character
- `subject` minimum 1 character (for email)
- `body` minimum 1 character

### RLS Policies

- Users can view their own templates (business_id matches)
- Users can view system templates (is_default = true)
- Users can only insert/update/delete their own templates (not system templates)

### Indexes

- idx_message_templates_business_id (btree)
- idx_message_templates_channel (btree)
- idx_message_templates_is_default (partial: WHERE is_default = true)

### Compatibility

- View `email_templates` exists for backward compatibility during migration window
- View filters to `WHERE channel = 'email'`
- Remove view in Phase 25 after all code updated

## Table: campaigns

Multi-touch campaign definitions for automated review follow-up sequences. Added in Phase 24.

### Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| business_id | UUID | NO | - | FK to businesses |
| name | TEXT | NO | - | Campaign name (1-100 chars) |
| service_type | TEXT | YES | - | Target service type (NULL = all services) |
| status | TEXT | NO | 'active' | 'active' or 'paused' |
| is_preset | BOOLEAN | NO | false | System preset flag (read-only) |
| created_at | TIMESTAMPTZ | YES | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | YES | NOW() | Updated timestamp |

### Service Type Targeting

- `service_type = NULL`: Campaign enrolls all jobs regardless of service type (default campaign)
- `service_type = 'hvac'` (or other type): Campaign only enrolls jobs of that service type
- Constraint: `service_type` must match jobs service types or be NULL
- Unique constraint: One campaign per service type per business

### System Presets

- System presets have `is_preset = true` and provide starting templates
- Users can view presets but cannot modify or delete them
- Users duplicate presets to create customizable campaigns

### Constraints

- `name` length: 1-100 characters
- `service_type IN ('hvac', 'plumbing', 'electrical', 'cleaning', 'roofing', 'painting', 'handyman', 'other')` or NULL
- `status IN ('active', 'paused')`
- UNIQUE (business_id, service_type) where service_type is NOT NULL

### RLS Policies

- SELECT: Users can view system presets OR their own campaigns
- INSERT/UPDATE/DELETE: Users can only modify their own campaigns (not presets)

### Indexes

- idx_campaigns_business_id (btree)
- idx_campaigns_business_service (btree on business_id, service_type)
- idx_campaigns_preset (partial: WHERE is_preset = true)

### Foreign Keys

- campaign_touches.campaign_id references campaigns.id (CASCADE)
- campaign_enrollments.campaign_id references campaigns.id (CASCADE)
- send_logs.campaign_id references campaigns.id (SET NULL)

## Table: campaign_touches

Ordered sequence of message touches within a campaign (up to 4 touches per campaign). Added in Phase 24.

### Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| campaign_id | UUID | NO | - | FK to campaigns |
| touch_number | INT | NO | - | Touch position (1-4) |
| channel | TEXT | NO | - | 'email' or 'sms' |
| delay_hours | INT | NO | - | Hours after previous touch (or job completion for touch 1) |
| template_id | UUID | YES | - | FK to message_templates (NULL if deleted) |
| created_at | TIMESTAMPTZ | YES | NOW() | Created timestamp |

### Touch Sequencing

- Touch 1 delay: Hours after job completion
- Touch 2-4 delay: Hours after previous touch's **scheduled** time (not actual send time)
- Timing anchor prevents cascading delays from quiet hours or failures

### Constraints

- `touch_number BETWEEN 1 AND 4`
- `channel IN ('email', 'sms')`
- `delay_hours > 0` (minimum 1 hour)
- UNIQUE (campaign_id, touch_number) - only one touch per position

### RLS Policies

- SELECT: Users can view touches for campaigns they can see (presets + own)
- INSERT/UPDATE/DELETE: Users can only modify touches for their own campaigns (not presets)

### Indexes

- idx_touches_campaign_id (btree on campaign_id, touch_number)
- idx_touches_template_id (btree on template_id)

### Foreign Keys

- campaign_touches.campaign_id references campaigns.id (CASCADE)
- campaign_touches.template_id references message_templates.id (SET NULL)

## Table: campaign_enrollments

Tracks job progression through campaign touch sequences. Denormalized touch timestamps enable fast due-touch queries. Added in Phase 24.

### Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| business_id | UUID | NO | - | FK to businesses |
| campaign_id | UUID | NO | - | FK to campaigns |
| job_id | UUID | NO | - | FK to jobs |
| customer_id | UUID | NO | - | FK to customers |
| status | TEXT | NO | 'active' | State: 'active', 'completed', 'stopped' |
| stop_reason | TEXT | YES | - | Why stopped (if stopped) |
| current_touch | INT | NO | 1 | Next touch to send (1-4) |
| touch_1_scheduled_at | TIMESTAMPTZ | YES | - | When touch 1 should send |
| touch_1_sent_at | TIMESTAMPTZ | YES | - | When touch 1 actually sent |
| touch_1_status | TEXT | YES | - | 'pending', 'sent', 'skipped', 'failed' |
| touch_2_scheduled_at | TIMESTAMPTZ | YES | - | When touch 2 should send |
| touch_2_sent_at | TIMESTAMPTZ | YES | - | When touch 2 actually sent |
| touch_2_status | TEXT | YES | - | Touch 2 status |
| touch_3_scheduled_at | TIMESTAMPTZ | YES | - | When touch 3 should send |
| touch_3_sent_at | TIMESTAMPTZ | YES | - | When touch 3 actually sent |
| touch_3_status | TEXT | YES | - | Touch 3 status |
| touch_4_scheduled_at | TIMESTAMPTZ | YES | - | When touch 4 should send |
| touch_4_sent_at | TIMESTAMPTZ | YES | - | When touch 4 actually sent |
| touch_4_status | TEXT | YES | - | Touch 4 status |
| enrolled_at | TIMESTAMPTZ | YES | NOW() | When enrollment created |
| completed_at | TIMESTAMPTZ | YES | - | When all touches sent or stopped |
| stopped_at | TIMESTAMPTZ | YES | - | When enrollment stopped early |
| created_at | TIMESTAMPTZ | YES | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | YES | NOW() | Updated timestamp |

### State Machine

- `active`: Campaign is running, touches will be sent
- `completed`: All touches sent successfully
- `stopped`: Campaign stopped early (see stop_reason)

### Stop Reasons

- `review_clicked`: Customer clicked review link
- `feedback_submitted`: Customer submitted private feedback
- `opted_out_sms`: Customer opted out of SMS
- `opted_out_email`: Customer opted out of email
- `owner_stopped`: Business owner manually stopped
- `campaign_paused`: Campaign was paused
- `campaign_deleted`: Campaign was deleted
- `repeat_job`: New job for same customer (old enrollment canceled)

### Denormalization Strategy

Touch timestamps are denormalized (duplicated from campaign_touches + calculated timing) to enable fast due-touch queries without joins. Cron processor can query `WHERE status='active' AND touch_1_scheduled_at <= NOW() AND touch_1_sent_at IS NULL` using partial indexes.

### Constraints

- `status IN ('active', 'completed', 'stopped')`
- `stop_reason` must be valid enum or NULL
- `current_touch BETWEEN 1 AND 4`
- `touch_N_status IN ('pending', 'sent', 'skipped', 'failed')` or NULL
- Partial unique: (customer_id, campaign_id) WHERE status = 'active' - one active enrollment per customer per campaign

### RLS Policies

- Users can only view/insert/update/delete enrollments for their business

### Indexes (Critical for Cron Performance)

- idx_enrollments_touch_1_due (partial: WHERE status='active' AND current_touch=1 AND touch_1_sent_at IS NULL)
- idx_enrollments_touch_2_due (partial: WHERE status='active' AND current_touch=2 AND touch_2_sent_at IS NULL)
- idx_enrollments_touch_3_due (partial: WHERE status='active' AND current_touch=3 AND touch_3_sent_at IS NULL)
- idx_enrollments_touch_4_due (partial: WHERE status='active' AND current_touch=4 AND touch_4_sent_at IS NULL)
- idx_enrollments_business_campaign (btree on business_id, campaign_id, status)
- idx_enrollments_customer (btree on customer_id, status)
- idx_enrollments_job (btree on job_id)
- idx_enrollments_unique_active (partial unique on customer_id, campaign_id WHERE status='active')

### Foreign Keys

- campaign_enrollments.business_id references businesses.id (CASCADE)
- campaign_enrollments.campaign_id references campaigns.id (CASCADE)
- campaign_enrollments.job_id references jobs.id (CASCADE)
- campaign_enrollments.customer_id references customers.id (CASCADE)
- send_logs.campaign_enrollment_id references campaign_enrollments.id (SET NULL)

## Table: send_logs (Campaign Extensions)

Send logs table extended in Phase 24 with campaign tracking fields.

### New Columns (Phase 24)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| campaign_id | UUID | YES | - | FK to campaigns (NULL for manual sends) |
| campaign_enrollment_id | UUID | YES | - | FK to campaign_enrollments (NULL for manual) |
| touch_number | INT | YES | - | Touch position within campaign (1-4, NULL for manual) |
| channel | TEXT | NO | 'email' | 'email' or 'sms' (defaults to email for backward compat) |

### Campaign Attribution

- Manual sends: `campaign_id = NULL`, `campaign_enrollment_id = NULL`, `touch_number = NULL`
- Campaign sends: All three fields populated for analytics and stop condition tracking

### Constraints

- `touch_number BETWEEN 1 AND 4` or NULL
- `channel IN ('email', 'sms')`

### Indexes

- idx_send_logs_campaign (partial: WHERE campaign_id IS NOT NULL) on (campaign_id, touch_number)
- idx_send_logs_enrollment (partial: WHERE campaign_enrollment_id IS NOT NULL) on (campaign_enrollment_id)

### Foreign Keys

- send_logs.campaign_id references campaigns.id (SET NULL)
- send_logs.campaign_enrollment_id references campaign_enrollments.id (SET NULL)

## Table: customer_feedback

Stores private feedback from customers who rate their experience 1-3 stars in the review funnel. Added in Phase 26.

### Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| business_id | UUID | NO | - | FK to businesses |
| customer_id | UUID | NO | - | FK to customers |
| enrollment_id | UUID | YES | - | FK to campaign_enrollments (NULL for non-campaign) |
| rating | INT | NO | - | Satisfaction rating (1-5) |
| feedback_text | TEXT | YES | - | Customer's written feedback |
| submitted_at | TIMESTAMPTZ | YES | NOW() | When feedback was submitted |
| resolved_at | TIMESTAMPTZ | YES | - | When business resolved the feedback |
| resolved_by | UUID | YES | - | User who resolved the feedback |
| internal_notes | TEXT | YES | - | Business owner's internal notes |
| created_at | TIMESTAMPTZ | YES | NOW() | Created timestamp |
| updated_at | TIMESTAMPTZ | YES | NOW() | Updated timestamp |

### Purpose

The review funnel routes 1-3 star ratings to a private feedback form instead of Google reviews. This table:
- Stores negative feedback privately (no public review)
- Links feedback to campaign enrollment for stop conditions
- Tracks resolution status for follow-up workflow
- Enables email notifications to business owner

### Constraints

- `rating BETWEEN 1 AND 5` - Valid star ratings only

### RLS Policies

- SELECT: Users can view feedback for businesses they own
- INSERT: Anonymous and authenticated users can insert (token validated in API route)
- UPDATE: Users can update feedback for businesses they own (for resolution)

### Indexes

- idx_feedback_business_id (btree)
- idx_feedback_customer_id (btree)
- idx_feedback_enrollment_id (btree)
- idx_feedback_unresolved (partial: WHERE resolved_at IS NULL on business_id, submitted_at DESC)

### Foreign Keys

- customer_feedback.business_id references businesses.id (CASCADE)
- customer_feedback.customer_id references customers.id (CASCADE)
- customer_feedback.enrollment_id references campaign_enrollments.id (SET NULL)
- customer_feedback.resolved_by references auth.users.id (SET NULL)
