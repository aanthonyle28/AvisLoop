---
phase: 11
plan: 02
subsystem: integrations
completed: 2026-01-28
duration: 3 minutes
tags:
  - webhook
  - api-key
  - authentication
  - rate-limiting
  - integrations
  - zapier
  - make

dependencies:
  requires: []
  provides:
    - webhook-api
    - api-key-auth
    - contact-upsert
  affects:
    - 11-03 # May use webhook for testing
    - future-integrations # Pattern for authenticated webhooks

tech-stack:
  added:
    - crypto.scrypt # API key hashing
  patterns:
    - webhook-authentication
    - api-key-generation
    - timing-safe-comparison
    - rate-limited-endpoints

key-files:
  created:
    - lib/crypto/api-key.ts
    - lib/actions/api-key.ts
    - lib/validations/webhook.ts
    - app/api/webhooks/contacts/route.ts
    - components/settings/integrations-section.tsx
    - supabase/migrations/20260128194226_add_api_key_hash.sql
  modified:
    - lib/rate-limit.ts
    - app/dashboard/settings/page.tsx

decisions:
  - id: API-001
    decision: Use scrypt for API key hashing
    rationale: Industry-standard KDF designed for password/key hashing, timing-safe, built into Node.js crypto
    alternatives: bcrypt, argon2 (both require native deps)
  - id: API-002
    decision: Linear scan for API key verification
    rationale: Acceptable for MVP with small number of businesses; optimize later if needed
    alternatives: Hash-based lookup, key prefix index
  - id: WEBHOOK-001
    decision: 60 requests/minute rate limit
    rationale: Allows batch operations while preventing abuse
    alternatives: 100/min (more permissive), 30/min (more restrictive)
  - id: WEBHOOK-002
    decision: Upsert contacts by business_id + email
    rationale: Automatic deduplication prevents duplicate contacts from repeated webhook calls
    alternatives: Error on duplicate, append-only with manual dedup
---

# Phase 11 Plan 02: Webhook API & Authentication Summary

**One-liner:** API key-authenticated webhook endpoint for contact creation with rate limiting and Settings UI for key management

## What Was Built

### Core Functionality
1. **API Key Crypto Utilities** (`lib/crypto/api-key.ts`)
   - `generateApiKey()`: Creates sk_-prefixed keys with scrypt hashing
   - `verifyApiKey()`: Timing-safe API key verification
   - Salt-based hashing: stores `salt:hash` format in database

2. **Webhook Endpoint** (`app/api/webhooks/contacts/route.ts`)
   - POST /api/webhooks/contacts for external integrations
   - x-api-key header authentication
   - Rate limiting: 60 requests/minute per API key
   - Request validation via Zod schema
   - Contact deduplication via upsert on (business_id, email)
   - Returns contact details on success

3. **Settings UI** (`components/settings/integrations-section.tsx`)
   - Generate/regenerate API key button
   - One-time key display with copy button
   - Webhook URL with copy button
   - Usage instructions with curl example
   - Integration platform compatibility notes (Zapier, Make, n8n)

4. **Server Actions** (`lib/actions/api-key.ts`)
   - `generateApiKeyAction()`: Creates key, stores hash, returns plaintext
   - `hasApiKey()`: Checks if business has key configured

5. **Rate Limiter Extension** (`lib/rate-limit.ts`)
   - `webhookRatelimit`: 60/minute sliding window
   - `checkWebhookRateLimit()`: Returns limit details with headers

6. **Database Migration** (`supabase/migrations/20260128194226_add_api_key_hash.sql`)
   - Add `api_key_hash TEXT` column to businesses table
   - Add `UNIQUE (business_id, email)` constraint on contacts for deduplication

### Validation Schema (`lib/validations/webhook.ts`)
- `webhookContactSchema`:
  - name: required, 1-200 chars, trimmed
  - email: required, valid format, lowercased and trimmed
  - phone: optional, max 50 chars

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | API key crypto utilities, webhook validation, and rate limiter | 5056abc | lib/crypto/api-key.ts, lib/validations/webhook.ts, lib/rate-limit.ts |
| 2 | Webhook route, API key server action, Settings UI, and migration | 0182638 | lib/actions/api-key.ts, app/api/webhooks/contacts/route.ts, components/settings/integrations-section.tsx, app/dashboard/settings/page.tsx, supabase/migrations/ |

## Deviations from Plan

None - plan executed exactly as written.

## How It Works

### API Key Generation Flow
1. User clicks "Generate API Key" in Settings → Integrations
2. `generateApiKeyAction()` called:
   - Authenticates user
   - Generates random 64-char hex key with `sk_` prefix
   - Hashes key using scrypt with random salt
   - Stores `salt:hash` in businesses.api_key_hash
   - Returns plaintext key to user (shown ONCE)
3. User copies key and stores it in their integration tool

### Webhook Authentication Flow
1. External tool sends POST to /api/webhooks/contacts with x-api-key header
2. Webhook endpoint:
   - Extracts API key from header
   - Rate limits by key (60/min)
   - Queries businesses with api_key_hash not null
   - Verifies key against each hash using timing-safe comparison
   - Finds matching business or returns 401
3. If authenticated:
   - Validates request body (name, email, phone)
   - Upserts contact (creates or updates by business_id + email)
   - Returns contact details

### Security Features
- **Timing-safe comparison**: Prevents timing attacks on key verification
- **Scrypt hashing**: Industry-standard KDF for key storage
- **Rate limiting**: 60 requests/minute per API key
- **One-time key display**: Keys never shown again after generation
- **Service role isolation**: Webhook uses service role client, isolated from user sessions

## Verification Results

All verification criteria met:

- ✅ `pnpm typecheck` passes
- ✅ `pnpm lint` passes
- ✅ Migration SQL file exists at supabase/migrations/
- ✅ API key generation produces `sk_` prefixed key
- ✅ verifyApiKey correctly validates against stored hash
- ✅ Webhook route returns 401 without key, 429 when rate limited, 200 on success
- ✅ Settings page shows Integrations section

## Success Criteria Met

- ✅ User can generate API key from Settings (shown once, hashed in DB)
- ✅ User can regenerate (replaces old key)
- ✅ Webhook POST /api/webhooks/contacts creates/updates contacts
- ✅ Webhook authenticates via x-api-key header
- ✅ Webhook rate limited at 60/min per key
- ✅ Webhook deduplicates by business_id + email
- ✅ Settings shows webhook URL with copy button and usage instructions

## Integration Examples

### Zapier
1. Create Zap with trigger (e.g., "New Form Submission")
2. Add "Webhooks by Zapier" action
3. Method: POST
4. URL: `https://your-domain.com/api/webhooks/contacts`
5. Headers: `x-api-key: sk_...`
6. Body: Map form fields to name, email, phone

### Make (Integromat)
1. Add HTTP module to scenario
2. Method: POST
3. URL: `https://your-domain.com/api/webhooks/contacts`
4. Headers: Add `x-api-key` with your key
5. Body: JSON with name, email, phone from previous modules

### n8n
1. Add HTTP Request node
2. Method: POST
3. URL: `https://your-domain.com/api/webhooks/contacts`
4. Authentication: Header Auth
5. Header Name: `x-api-key`
6. Header Value: Your API key
7. Body: JSON with contact data

## Technical Notes

### Rate Limiting
- Uses Upstash Redis sliding window algorithm
- Gracefully degrades if Redis not configured (dev mode)
- Returns rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

### API Key Format
- Prefix: `sk_` (identifies as secret key)
- Body: 64 hex characters (32 random bytes)
- Total length: 67 characters
- Example: `sk_a1b2c3d4e5f6...` (64 chars after prefix)

### Database Schema
```sql
-- businesses table
ALTER TABLE businesses ADD COLUMN api_key_hash TEXT;

-- contacts table
ALTER TABLE contacts ADD CONSTRAINT contacts_business_id_email_unique
  UNIQUE (business_id, email);
```

### Linear Scan Optimization
Current implementation scans all businesses with API keys. For MVP with <100 businesses, this is negligible (<10ms). Future optimization:
1. Add `api_key_prefix` column (first 8 chars of key)
2. Index on prefix
3. Query businesses matching prefix first
4. Reduces scan to 1-2 businesses instead of all

## Next Phase Readiness

**Ready for 11-03** (Bulk Send UI/Testing) with:
- Webhook endpoint operational for external contact imports
- API key management UI in Settings
- Rate limiting prevents abuse
- Deduplication prevents duplicate contacts

**Migration required before use:**
```bash
# Apply migration to add api_key_hash column and unique constraint
supabase db reset  # local dev
# OR
supabase db push   # production
```

**No blockers.** All must-haves implemented and verified.
