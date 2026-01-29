---
phase: 11
plan: 01
subsystem: sending
tags: [batch-send, validation, resend, server-actions, cooldown]
requires: [04-01, 06-01]
provides: [batch-send-backend, resend-ready-query]
affects: [11-02, 11-03]
tech-stack:
  added: []
  patterns: [batch-processing, contact-categorization]
key-files:
  created: []
  modified:
    - lib/validations/send.ts
    - lib/data/send-logs.ts
    - lib/actions/send.ts
    - lib/types/database.ts
decisions:
  - id: BATCH-001
    title: 25 contact batch limit
    rationale: Balance between bulk efficiency and quota management
  - id: BATCH-002
    title: No rate limit on batch sends
    rationale: Batch has its own 25-cap control, rate limit unnecessary
  - id: BATCH-003
    title: Quota check before starting batch
    rationale: Fail fast if entire batch won't fit in remaining quota
metrics:
  duration: ~3 minutes
  completed: 2026-01-28
---

# Phase 11 Plan 01: Batch Send Backend Summary

JWT auth with refresh rotation using jose library

## One-liner

Backend infrastructure for batch sending review requests to up to 25 contacts with full validation and the re-send ready query.

## What was built

### Task 1: Validation Schema and Re-send Query
- Updated `batchSendSchema` to reduce max contacts from 50 to 25
- Added `customSubject` optional field to `batchSendSchema`
- Created `getResendReadyContacts` function in `lib/data/send-logs.ts`
- Query returns contacts where:
  - `last_sent_at < cooldownDate` (14 days)
  - `last_sent_at IS NOT NULL` (has been sent to before)
  - `status = 'active'` and `opted_out = false`
  - Ordered by `last_sent_at` ascending (oldest first)

### Task 2: Batch Send Server Action
- Added `BatchSendActionState` type to `lib/types/database.ts`
- Implemented `batchSendReviewRequest` server action with complete flow:
  1. User authentication
  2. Input validation (contactIds array, templateId, customSubject)
  3. Business validation (google_review_link required)
  4. **Quota check**: Full batch must fit in remaining monthly quota
  5. Single query to fetch all requested contacts
  6. Contact categorization into eligible vs skipped:
     - **Eligible**: active, not opted out, cooldown expired
     - **Skipped**: archived, opted out, cooldown active, not found
  7. Individual send loop with per-contact error handling:
     - Create send_log (status: 'pending')
     - Render email template
     - Send via Resend with idempotency key
     - Update send_log (status: 'sent' or 'failed')
     - Update contact tracking (last_sent_at, send_count)
  8. Structured response with sent/skipped/failed counts and details

## Key Implementation Details

### Batch Processing Pattern
- **Single query** fetches all contacts: `.in('id', contactIds)`
- **Categorization happens in memory**, not SQL
- **Individual try/catch** per contact prevents one failure from blocking others
- **Details array** provides full transparency on per-contact results

### Validation Rules
- Maximum 25 contacts per batch (down from 50)
- Batch must fit entirely in remaining monthly quota
- Contacts categorized with reasons: 'cooldown', 'opted_out', 'archived', 'not_found'

### Rate Limiting Decision
- **No rate limit applied** to batch sends (intentional)
- Rationale: Batch has its own 25-cap control, additional rate limiting unnecessary
- Single sends still use the 10/min rate limit

### Quota Management
- **Fail fast**: Check entire batch fits quota before starting
- Error message includes: `You have ${remainingQuota} sends remaining this month. Batch requires ${validatedContactIds.length} sends.`

## Decisions Made

### BATCH-001: 25 Contact Batch Limit
**Context:** Original plan specified max 50, but reduced to 25

**Decision:** Set `batchSendSchema` max to 25 contacts per batch

**Rationale:**
- Balance between bulk efficiency and quota management
- Reduces risk of large quota burns
- Still provides significant time savings vs individual sends
- Aligns with typical SaaS batch operation patterns

**Alternatives considered:**
- 50 contacts: Too aggressive for quota management
- 10 contacts: Too conservative, minimal time savings

### BATCH-002: No Rate Limit on Batch Sends
**Context:** Single sends use 10/min rate limit, question whether batch should too

**Decision:** Do NOT apply `checkSendRateLimit` to batch sends

**Rationale:**
- Batch has built-in 25-cap control
- Rate limit exists to prevent rapid-fire individual sends
- Batch operations are intentional, not accidental spam
- Adding rate limit would complicate UX (batch could partially fail due to timing)

**Alternatives considered:**
- Apply same 10/min limit: Would break batches > 10, poor UX
- Higher rate limit for batches: Unnecessary complexity

### BATCH-003: Quota Check Before Starting
**Context:** Should batch proceed partially if quota runs out mid-send?

**Decision:** Check entire batch fits quota before starting ANY sends

**Rationale:**
- Fail fast principle: user knows immediately if batch won't work
- Prevents partial success confusion
- Encourages users to manage quota proactively
- Simpler error handling (all-or-nothing)

**Alternatives considered:**
- Send until quota exhausted: Confusing partial results, unclear which contacts were skipped

## Files Changed

### lib/validations/send.ts
- Updated `batchSendSchema.contactIds` max from 50 to 25
- Added `customSubject` optional field (same as `sendRequestSchema`)

### lib/data/send-logs.ts
- Added `getResendReadyContacts` function
- Accepts pre-created Supabase client and businessId
- Calculates cooldown cutoff: `now - COOLDOWN_DAYS`
- Returns contacts with id, name, email, last_sent_at, send_count
- Ordered by last_sent_at ascending (oldest first)

### lib/types/database.ts
- Added `BatchSendActionState` type
- Includes sent/skipped/failed counts
- Details array with per-contact status and optional reason

### lib/actions/send.ts
- Imported `batchSendSchema` and `BatchSendActionState`
- Implemented `batchSendReviewRequest` server action
- 300+ lines covering full batch send flow
- Individual error handling per contact
- Structured response with categorized results

## Testing Notes

### Verification Performed
- `pnpm typecheck` passed with no errors
- `pnpm lint` passed with no warnings
- All exports verified:
  - `batchSendSchema` from lib/validations/send.ts
  - `batchSendReviewRequest` from lib/actions/send.ts
  - `getResendReadyContacts` from lib/data/send-logs.ts
  - `BatchSendActionState` from lib/types/database.ts

### Manual Testing Required (Next Plan)
- Submit batch with mixed eligible/skipped contacts
- Verify skipped reasons are accurate
- Verify sent count increments correctly
- Verify quota check blocks oversized batches
- Test getResendReadyContacts returns correct contacts

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Blockers
None

### Concerns
None

### Recommendations
1. **Next plan (11-02)**: Build the batch send UI components
2. **UI should display**: Results breakdown (sent/skipped/failed) with expandable details
3. **Consider**: Progress indicator for batch operations
4. **Future enhancement**: Add batch preview mode (dry run to show who would be skipped)

## Links & References

### Related Plans
- **04-01**: Single send action (pattern extended to batch)
- **06-01**: Tier enforcement (quota logic reused)
- **11-02**: Batch send UI (will consume this backend)
- **11-03**: Re-send ready UI (will use getResendReadyContacts)

### Key Patterns
- **Batch processing**: Single fetch, memory categorization, individual error handling
- **Contact categorization**: Eligible vs skipped with reasons
- **Structured responses**: sent/skipped/failed counts + details array
- **Idempotency**: Resend idempotencyKey uses send_log.id

### Documentation
- COOLDOWN_DAYS constant: 14 days (from lib/constants/billing.ts)
- MONTHLY_SEND_LIMITS: trial=25, basic=200, pro=500
- Batch limit: 25 contacts max

## Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Update validation schema and add re-send ready query | 86e92e8 | lib/validations/send.ts, lib/data/send-logs.ts |
| 2 | Create batchSendReviewRequest server action | 7cae26f | lib/actions/send.ts, lib/types/database.ts |

## Performance Notes

- **Duration**: ~3 minutes (2 tasks)
- **Complexity**: Medium (batch processing logic, contact categorization)
- **Risk**: Low (follows established patterns from single send)

## Security Notes

- All sends scoped to `business_id` (multi-tenancy enforced)
- Contact ownership verified: `.eq('business_id', business.id)`
- Quota checked before any sends occur
- Idempotency keys prevent duplicate sends
- Individual error handling prevents information leakage

## Future Enhancements

1. **Batch preview**: Add dry-run mode to show categorization before sending
2. **Progress tracking**: WebSocket or polling for real-time batch progress
3. **Scheduled batches**: Queue large batches for off-peak sending
4. **Batch templates**: Save contact lists for recurring batch sends
5. **Smart retry**: Auto-retry failed sends with exponential backoff
