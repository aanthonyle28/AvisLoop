# Architecture Research: Scheduled Sending

**Project:** AvisLoop Review SaaS
**Domain:** Scheduled email sending via Vercel Cron
**Researched:** 2026-01-28
**Overall confidence:** HIGH

## Executive Summary

Scheduled sending integrates cleanly with the existing Next.js + Supabase + Resend architecture through:
1. A `scheduled_sends` table (already exists in codebase) for storing future send jobs
2. A Vercel Cron route handler (`/api/cron/process-scheduled-sends`) that runs every minute
3. A service role Supabase client that bypasses RLS for cron processing
4. Reuse of existing `batchSendReviewRequest` logic with extracted core send function
5. Row-level locking (`SELECT FOR UPDATE SKIP LOCKED`) for safe concurrent execution

The architecture is straightforward because most infrastructure already exists: email sending, rate limiting, quota checks, and send logging are all implemented. Scheduled sending adds a queue layer (scheduled_sends table) and a background processor (cron job).

## System Design

### High-Level Flow

```
User schedules send → scheduled_sends row (status: pending)
                          ↓
Cron runs every minute → SELECT pending sends due now (with row lock)
                          ↓
For each scheduled send → Extract contacts, check eligibility
                          ↓
Call core send logic → Create send_logs, send via Resend
                          ↓
Update scheduled_sends → status: completed/failed/partial
```

### Integration Points with Existing Architecture

| Existing Component | How Scheduled Sending Uses It |
|-------------------|-------------------------------|
| **lib/actions/send.ts** | Extract core email sending logic (render template, call Resend, update send_log, update contact) into reusable function |
| **lib/data/send-logs.ts** | Reuse `getMonthlyCount`, `getResendReadyContacts` for quota checks |
| **lib/email/resend.ts** | Same Resend client and templates |
| **lib/supabase/server.ts** | Create separate service role client for cron (bypasses RLS) |
| **send_logs table** | Same logging mechanism, same status tracking |
| **contacts table** | Same cooldown logic, same eligibility checks |
| **businesses table** | Same tier/quota enforcement |

### Database Schema

The `scheduled_sends` table structure (from existing lib/actions/schedule.ts):

```sql
CREATE TABLE scheduled_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_ids UUID[] NOT NULL,  -- Array of contact UUIDs
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  custom_subject TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  skipped_count INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT scheduled_sends_status_valid CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'partial')
  )
);

-- Index for cron query (critical for performance)
CREATE INDEX idx_scheduled_sends_due
  ON scheduled_sends (scheduled_for, status)
  WHERE status = 'pending';
```

**Why this schema works:**
- `contact_ids` as array avoids join complexity during cron processing
- `status` field prevents duplicate processing
- `scheduled_for` + `status` index makes "find due sends" query fast
- Counts (`sent_count`, `failed_count`, `skipped_count`) provide detailed results
- `processed_at` tracks actual execution time vs scheduled time

## New Components

### 1. Service Role Supabase Client

**File:** `lib/supabase/service-role.ts` (new)

**Purpose:** Bypass RLS for cron job processing

**Implementation:**
```typescript
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

/**
 * Service role client - bypasses RLS.
 * Use ONLY in server-side code (cron jobs, admin operations).
 * NEVER expose this client to the browser.
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
```

**Source confidence:** HIGH - [Supabase official docs](https://github.com/orgs/supabase/discussions/30739), [Adrian Murage guide](https://adrianmurage.com/posts/supabase-service-role-secret-key/)

**Critical notes:**
- Service role key **completely bypasses all RLS policies**
- Must use `@supabase/supabase-js` directly, NOT `@supabase/ssr` (SSR package requires cookies)
- Disable session persistence (not needed for service operations)
- Authorization header determines role, not the API key parameter

### 2. Vercel Cron Route Handler

**File:** `app/api/cron/process-scheduled-sends/route.ts` (new)

**Purpose:** Background job that processes due scheduled sends

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { processDueScheduledSends } from '@/lib/scheduled-sends/processor'

/**
 * Vercel Cron handler - processes scheduled sends that are due.
 * Runs every minute (configured in vercel.json).
 *
 * Security: Protected by CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
  // 1. Verify cron secret (security)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Process due sends
  const supabase = createServiceRoleClient()
  const results = await processDueScheduledSends(supabase)

  // 3. Return results
  return NextResponse.json(results)
}
```

**Configuration:** `vercel.json` (root)
```json
{
  "crons": [
    {
      "path": "/api/cron/process-scheduled-sends",
      "schedule": "* * * * *"
    }
  ]
}
```

**Source confidence:** HIGH - [Vercel official docs](https://vercel.com/docs/cron-jobs), [CodingCat.dev security guide](https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router)

**Critical notes:**
- Cron schedule syntax: `* * * * *` = every minute (minute, hour, day of month, month, day of week)
- `CRON_SECRET` must be set in Vercel environment variables
- Vercel automatically sends `Authorization: Bearer ${CRON_SECRET}` header
- Cron jobs **only run on production** (not preview or local)
- Standard serverless timeout applies (10s hobby, 60s pro)

### 3. Scheduled Send Processor

**File:** `lib/scheduled-sends/processor.ts` (new)

**Purpose:** Core logic for fetching due sends, processing them, updating status

**Implementation pattern:**
```typescript
export async function processDueScheduledSends(
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  // 1. Find due sends with row locking
  const dueSends = await fetchDueSendsWithLock(supabase)

  // 2. Process each send
  const results = []
  for (const scheduledSend of dueSends) {
    const result = await processScheduledSend(supabase, scheduledSend)
    results.push(result)
  }

  return { processed: results.length, results }
}

async function fetchDueSendsWithLock(supabase) {
  // CRITICAL: Use SELECT FOR UPDATE SKIP LOCKED for concurrency safety
  const { data, error } = await supabase
    .rpc('fetch_due_scheduled_sends_with_lock', { batch_size: 10 })

  return data || []
}
```

**Database function for row locking:**
```sql
CREATE OR REPLACE FUNCTION fetch_due_scheduled_sends_with_lock(batch_size INT)
RETURNS SETOF scheduled_sends
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE scheduled_sends
  SET status = 'processing'
  WHERE id IN (
    SELECT id
    FROM scheduled_sends
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;
```

**Source confidence:** HIGH - [The Unreasonable Effectiveness of SKIP LOCKED](https://www.inferable.ai/blog/posts/postgres-skip-locked), [Netdata SKIP LOCKED guide](https://www.netdata.cloud/academy/update-skip-locked/)

**Why this pattern:**
- `SELECT FOR UPDATE SKIP LOCKED` prevents multiple cron invocations from processing the same send
- Atomic `UPDATE` + `RETURNING` pattern ensures we lock and claim sends in one query
- `SKIP LOCKED` means if another cron instance is processing a row, we skip it (no waiting, no deadlocks)
- Setting status to 'processing' immediately prevents duplicate work

### 4. Core Send Function (extracted)

**File:** `lib/scheduled-sends/core-send.ts` (new, extracted from existing send.ts)

**Purpose:** Reusable send logic for both immediate and scheduled sends

**What to extract from `batchSendReviewRequest`:**
- Contact eligibility checks (cooldown, opt-out, archived)
- Template fetching and subject resolution
- Email rendering (ReviewRequestEmail component)
- Resend API call with idempotency key
- send_log creation and status updates
- Contact tracking field updates (last_sent_at, send_count)

**Signature:**
```typescript
export async function sendToContact(params: {
  supabase: SupabaseClient
  business: { id: string; name: string; google_review_link: string; default_sender_name: string }
  contact: { id: string; name: string; email: string }
  template?: { subject: string; body: string }
  customSubject?: string
}): Promise<{
  status: 'sent' | 'failed' | 'skipped'
  reason?: string
  sendLogId?: string
}>
```

**Why extract:**
- Avoid duplicating 200+ lines of send logic
- Single source of truth for email sending rules
- Easier to test and maintain
- Same behavior for immediate and scheduled sends

## Modified Components

### 1. lib/actions/send.ts

**Changes:**
- Extract core send logic into `lib/scheduled-sends/core-send.ts`
- Refactor `sendReviewRequest` and `batchSendReviewRequest` to use extracted function
- Keep all existing validation, rate limiting, and auth logic
- No breaking changes to existing API

**Affected functions:**
- `sendReviewRequest`: Call `sendToContact` for single send
- `batchSendReviewRequest`: Call `sendToContact` in loop

### 2. lib/actions/schedule.ts

**Changes:**
- Already exists with basic CRUD operations
- Add helper function to check if scheduled send can be cancelled
- Add function to get scheduled send details for UI

**Current implementation review:**
- `scheduleReviewRequest`: Creates scheduled_sends row ✓
- `cancelScheduledSend`: Updates status to cancelled ✓
- `getScheduledSends`: Fetches user's scheduled sends ✓
- Missing: Get single scheduled send with contact details (needed for edit UI)

### 3. Database Migrations

**New migration file:** `supabase/migrations/0000X_add_scheduled_sends.sql`

**What to add:**
- `scheduled_sends` table (schema above)
- RLS policies for scheduled_sends (user can only see/modify their business's scheduled sends)
- `fetch_due_scheduled_sends_with_lock` function
- Index on `(scheduled_for, status)` for cron query performance
- Trigger for `updated_at` timestamp

**RLS policies needed:**
```sql
-- Users can view their business's scheduled sends
CREATE POLICY "Users view own scheduled_sends"
  ON scheduled_sends FOR SELECT
  TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  ));

-- Users can insert for their business
CREATE POLICY "Users insert own scheduled_sends"
  ON scheduled_sends FOR INSERT
  TO authenticated
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  ));

-- Users can update their business's sends (for cancellation)
CREATE POLICY "Users update own scheduled_sends"
  ON scheduled_sends FOR UPDATE
  TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  ));
```

**Note:** Service role client bypasses all these policies, which is needed for cron processing.

## Data Flow

### User Schedules Send (UI Flow)

```
1. User: Select contacts + template + date/time
   ↓
2. Client: POST to scheduleReviewRequest server action
   ↓
3. Server: Validate inputs
   - Check auth (user session)
   - Validate contact IDs (belong to user's business)
   - Validate scheduled_for (must be future)
   - Validate template (belongs to user's business)
   ↓
4. Server: Insert scheduled_sends row
   - business_id (from user's business)
   - contact_ids (array of UUIDs)
   - template_id / custom_subject
   - scheduled_for (timestamptz)
   - status: 'pending'
   ↓
5. Server: Return success + scheduled_send_id
   ↓
6. Client: Redirect to /scheduled, show confirmation
```

### Cron Processes Send (Background Flow)

```
1. Vercel: Trigger cron every minute
   ↓
2. Cron Route: Verify CRON_SECRET
   ↓
3. Cron Route: Call processDueScheduledSends(serviceRoleClient)
   ↓
4. Processor: Find due sends with row lock
   - SELECT ... WHERE status='pending' AND scheduled_for <= NOW()
   - FOR UPDATE SKIP LOCKED (prevents duplicate processing)
   - UPDATE status='processing' immediately
   - LIMIT 10 (batch size to stay under serverless timeout)
   ↓
5. For each scheduled send:
   a. Fetch business details (name, google_review_link, tier)
   b. Check monthly quota (same logic as immediate send)
   c. Fetch all contacts in contact_ids array
   d. Categorize: eligible vs skipped (cooldown, opt-out, archived)
   e. For each eligible contact:
      - Call sendToContact(supabase, business, contact, template)
      - Creates send_log (status: pending -> sent/failed)
      - Sends email via Resend with idempotency key
      - Updates contact tracking (last_sent_at, send_count)
   f. Update scheduled_sends row:
      - status: 'completed' (all succeeded) / 'failed' (all failed) / 'partial' (mixed)
      - sent_count, failed_count, skipped_count
      - processed_at: NOW()
      - error_message (if any)
   ↓
6. Processor: Return results summary
   ↓
7. Cron Route: Return 200 OK with results JSON
```

### User Views Send History

```
1. User: Navigate to /dashboard/send/history or /scheduled
   ↓
2. Server Component: Fetch data
   - send_logs (for immediate sends)
   - scheduled_sends (for scheduled sends)
   - Join with contacts for display names
   ↓
3. Client: Render unified timeline
   - "Sent to John Doe on 2026-01-28" (immediate)
   - "Scheduled: Send to 5 contacts on 2026-02-01 at 10:00 AM" (scheduled, pending)
   - "Completed: Sent to 4 of 5 contacts on 2026-02-01" (scheduled, completed)
```

## Concurrency & Safety

### Problem: Multiple Cron Invocations

**Scenario:** Cron runs every minute. If processing takes >60s, two cron jobs could run simultaneously.

**Risk:** Without locking, both could:
- Select the same scheduled send
- Process the same contacts
- Send duplicate emails

### Solution 1: Row-Level Locking (Recommended)

**Pattern:** `SELECT FOR UPDATE SKIP LOCKED`

**How it works:**
1. Cron A starts, runs query with `FOR UPDATE SKIP LOCKED`
2. Postgres locks selected rows for Cron A
3. Cron B starts 60s later, runs same query
4. Postgres sees rows are locked by Cron A
5. `SKIP LOCKED` makes Cron B skip those rows, select different ones
6. Both crons process different sends, no duplicates

**Implementation:**
```sql
-- Inside processor function
SELECT * FROM scheduled_sends
WHERE status = 'pending'
  AND scheduled_for <= NOW()
ORDER BY scheduled_for ASC
LIMIT 10
FOR UPDATE SKIP LOCKED;

-- Immediately update status to claim them
UPDATE scheduled_sends
SET status = 'processing'
WHERE id IN (selected_ids);
```

**Performance notes:**
- Index on `(status, scheduled_for)` is critical for query speed
- `SKIP LOCKED` adds negligible overhead
- Composite index allows Postgres to use index-only scan

**Source confidence:** HIGH - [The Unreasonable Effectiveness of SKIP LOCKED](https://www.inferable.ai/blog/posts/postgres-skip-locked), [Solid Queue analysis](https://www.bigbinary.com/blog/solid-queue)

### Solution 2: Batch Size Limiting

**Pattern:** Process max 10 sends per cron invocation

**Why:**
- Vercel serverless timeout: 10s (hobby) / 60s (pro)
- Each send takes ~200ms (render + Resend API)
- 10 sends * 10 contacts each * 200ms = ~20s (safe margin)

**Implementation:**
```typescript
const BATCH_SIZE = 10

const dueSends = await supabase
  .from('scheduled_sends')
  .select('*')
  .eq('status', 'pending')
  .lte('scheduled_for', new Date().toISOString())
  .order('scheduled_for', { ascending: true })
  .limit(BATCH_SIZE)
```

**Why this helps concurrency:**
- If 100 sends are due, each cron processes 10
- Multiple crons can run concurrently on different batches
- No single cron monopolizes all work

### Solution 3: Idempotency Keys (Defense in Depth)

**Pattern:** Resend idempotency keys already implemented

**Existing code (from send.ts line 183):**
```typescript
const { data: emailData, error: emailError } = await resend.emails.send(
  { /* ... */ },
  { idempotencyKey: `send-${sendLog.id}` }
)
```

**Why this matters:**
- If cron runs twice on same send (bug in locking logic)
- Resend deduplicates based on idempotency key
- No duplicate emails sent (Resend's API guarantee)

**Current idempotency key format:** `send-${sendLog.id}`

**Works because:**
- Each send_log has unique ID
- If we try to resend, Resend recognizes the key
- Returns cached response, doesn't send duplicate

**Source confidence:** HIGH - Resend's API documentation guarantees idempotency

### Solution 4: Status Transitions

**Pattern:** State machine for scheduled_sends.status

**Valid transitions:**
```
pending -> processing -> completed
pending -> processing -> failed
pending -> processing -> partial
pending -> cancelled (user action only)
```

**Why this matters:**
- Once status changes from 'pending', cron query won't select it
- Even if row locking fails, status check prevents reprocessing
- Status acts as second line of defense

**Implementation:**
```sql
-- Cron query only selects 'pending'
WHERE status = 'pending'

-- Processing immediately updates status
UPDATE scheduled_sends
SET status = 'processing'
WHERE id = ?
```

### Combined Safety Architecture

**Defense in depth:**
1. Row locking prevents concurrent selection (primary defense)
2. Status field prevents reprocessing (secondary defense)
3. Batch size limits timeout risk (operational safety)
4. Idempotency keys prevent duplicate emails (tertiary defense)

**Failure modes:**
- Row locking fails → Status check catches it
- Status update fails → Idempotency keys catch duplicate sends
- Timeout occurs → Batch size keeps it manageable, next cron picks up remaining

## Build Order

Suggested implementation sequence based on dependencies:

### Phase 1: Core Infrastructure (3-4 tasks)

1. **Database migration** (`supabase/migrations/`)
   - Create `scheduled_sends` table
   - Add RLS policies
   - Create `fetch_due_scheduled_sends_with_lock` function
   - Add indexes
   - Run migration locally and test schema

2. **Service role client** (`lib/supabase/service-role.ts`)
   - Create service role Supabase client
   - Add environment variable validation
   - Test bypass of RLS (create test script)

3. **Extract core send logic** (`lib/scheduled-sends/core-send.ts`)
   - Extract contact eligibility checks from `batchSendReviewRequest`
   - Extract email rendering logic
   - Extract Resend API call logic
   - Extract send_log CRUD
   - Add comprehensive JSDoc
   - Create unit tests (optional but recommended)

4. **Refactor existing send actions** (`lib/actions/send.ts`)
   - Update `sendReviewRequest` to use `sendToContact`
   - Update `batchSendReviewRequest` to use `sendToContact`
   - Verify no breaking changes (existing tests should pass)

### Phase 2: Scheduled Send Processing (2-3 tasks)

5. **Processor implementation** (`lib/scheduled-sends/processor.ts`)
   - Implement `fetchDueSendsWithLock`
   - Implement `processScheduledSend`
   - Implement `processDueScheduledSends` (orchestrator)
   - Add error handling and logging
   - Test locally with mock Supabase data

6. **Cron route handler** (`app/api/cron/process-scheduled-sends/route.ts`)
   - Create GET handler with CRON_SECRET validation
   - Call processor with service role client
   - Return results JSON
   - Add error handling and structured logging

7. **Vercel cron configuration** (`vercel.json`)
   - Add cron job configuration
   - Set schedule to `* * * * *` (every minute)
   - Deploy to Vercel (staging first)
   - Verify cron runs in Vercel logs

### Phase 3: User Interface (2-3 tasks)

8. **Schedule action enhancement** (`lib/actions/schedule.ts`)
   - Already exists, minimal changes needed
   - Add function to get single scheduled send with details
   - Add validation helpers

9. **Scheduled sends UI** (`app/dashboard/scheduled/`)
   - Create page component (Server Component)
   - Display scheduled sends with status badges
   - Add cancel button with confirmation
   - Show contact count and scheduled time
   - Add empty state

10. **Integration with send flow** (`app/dashboard/send/`)
    - Add "Schedule for later" option to contact selector
    - Add date/time picker component
    - Update preview to show schedule info
    - Submit to `scheduleReviewRequest` instead of `batchSendReviewRequest`

### Phase 4: Polish & Testing (1-2 tasks)

11. **Send history unified view** (optional)
    - Combine immediate and scheduled sends in timeline
    - Add filter tabs: All / Immediate / Scheduled
    - Show detailed results for completed scheduled sends

12. **Testing & monitoring**
    - Test full flow: schedule → cron processes → verify send_logs
    - Test concurrency: schedule multiple sends for same time
    - Test edge cases: cancelled send, expired send, quota exceeded
    - Monitor Vercel cron logs for errors
    - Set up alerts for failed cron runs (optional)

### Critical Path

**Minimum viable implementation:**
- Phase 1 tasks 1-4 (core infrastructure)
- Phase 2 tasks 5-7 (cron processing)
- Phase 3 task 8 only (schedule action)

**This enables:**
- Scheduling sends programmatically (via server action)
- Background processing via cron
- No UI needed initially (can schedule via API/testing)

**Full feature:**
- All phases (1-4)
- User-facing scheduling interface
- Cancellation and history views

### Estimated Effort

Based on existing codebase maturity and component reuse:

| Phase | Tasks | Complexity | Estimated Hours |
|-------|-------|------------|-----------------|
| Phase 1 | 4 | Medium | 4-6 hours |
| Phase 2 | 3 | Medium-High | 4-6 hours |
| Phase 3 | 3 | Low-Medium | 3-4 hours |
| Phase 4 | 2 | Low | 2-3 hours |
| **Total** | **12** | - | **13-19 hours** |

**Why relatively fast:**
- Email sending logic already exists (80% reusable)
- Database patterns established (RLS, migrations)
- UI components exist (can reuse contact selector, templates)
- Resend integration working (just call same functions)

**Key risks:**
- Vercel cron testing requires production deploy (can't test locally)
- Row locking function needs careful SQL testing
- Service role client setup could have env var issues

### Testing Strategy

**Per phase:**

1. **Phase 1:**
   - Run migration locally: `supabase db reset`
   - Test RLS policies: Create scheduled send via anon client, verify via service role
   - Test core send function: Mock Supabase, verify send_log created

2. **Phase 2:**
   - Test processor locally: Seed scheduled_sends table, run processor, verify status updates
   - Test cron route: Use curl with Bearer token, verify 401 without, 200 with
   - Test in Vercel staging: Deploy, schedule send for 2 minutes ahead, watch logs

3. **Phase 3:**
   - Test schedule action: Use form, verify scheduled_sends row created
   - Test UI rendering: Verify scheduled sends display correctly
   - Test cancellation: Cancel pending send, verify status update

4. **Phase 4:**
   - Test end-to-end: Schedule → Wait for cron → Verify send_logs created
   - Test concurrency: Schedule 20 sends for same time, verify no duplicates
   - Test edge cases: Cancel mid-processing, quota exceeded, invalid contacts

## Performance Considerations

### Database Query Optimization

**Critical index for cron query:**
```sql
CREATE INDEX idx_scheduled_sends_due
  ON scheduled_sends (scheduled_for, status)
  WHERE status = 'pending';
```

**Why:**
- Cron query: `WHERE status='pending' AND scheduled_for <= NOW()`
- This exact index allows index-only scan
- Partial index (`WHERE status='pending'`) reduces index size
- Without this, query becomes slow with 10K+ scheduled sends

**Expected performance:**
- With index: <10ms to find 100 due sends
- Without index: 500ms+ sequential scan

### Serverless Timeout Management

**Vercel limits:**
- Hobby: 10s max
- Pro: 60s max

**Mitigation:**
- Batch size: 10 sends per cron (configurable constant)
- Each send: ~200ms (render + Resend API)
- 10 sends * 10 contacts * 200ms = 20s total
- Safe margin on Pro tier, would need lower batch on Hobby

**If timeout occurs:**
- Scheduled send status remains 'processing'
- Need cleanup cron (optional): Reset 'processing' > 5 min back to 'pending'
- Or: Accept that it retries next minute (idempotency prevents duplicates)

### RLS Policy Performance

**Problem:** RLS policies with subqueries can be slow

**Current policy:**
```sql
USING (business_id IN (
  SELECT id FROM businesses WHERE user_id = auth.uid()
))
```

**Performance:**
- Postgres caches auth.uid() per transaction
- Subquery executes once per query (not per row)
- With index on `businesses.user_id`, subquery is <1ms

**Note:** Service role client bypasses RLS entirely, so cron doesn't pay this cost.

## Open Questions & Recommendations

### Recommended Approach

**Primary:** Vercel Cron + Row Locking + Service Role Client

**Why:**
- Simplest integration (no new services)
- Leverages existing Vercel infrastructure
- Row locking is battle-tested pattern (used by Solid Queue, many SaaS)
- Service role client is Supabase's official approach

**Alternative considered:** Supabase Functions (pg_cron)
- More complex: Requires Supabase Edge Functions
- Less visibility: Harder to debug than Vercel logs
- Same pattern: Would still need row locking
- Skip for now: Can migrate later if needed

### Configuration Recommendations

**Environment variables to add:**
```bash
# Required
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
CRON_SECRET=<generate random 32-char string>

# Optional (for monitoring)
SENTRY_DSN=<for error tracking>
```

**Vercel cron schedule:**
- Start with: `* * * * *` (every minute)
- Can adjust later: `*/5 * * * *` (every 5 minutes) if load is low

**Batch size tuning:**
```typescript
// lib/scheduled-sends/config.ts
export const SCHEDULED_SEND_CONFIG = {
  BATCH_SIZE: 10,           // Sends per cron invocation
  MAX_CONTACTS_PER_SEND: 25 // Already enforced in batchSendSchema
}
```

### Edge Cases to Handle

1. **Scheduled time in the past** (user's clock was wrong)
   - Solution: Process immediately on next cron run
   - Status: Treat same as "due now"

2. **User cancels during processing**
   - Solution: Status check before each contact send
   - If cancelled, skip remaining contacts, update counts

3. **Contact deleted before scheduled send**
   - Solution: Skip missing contacts, log in skipped_count
   - Don't fail entire send

4. **Monthly quota exhausted before scheduled time**
   - Solution: Mark as 'failed', error_message explains quota issue
   - Don't retry (user must upgrade plan)

5. **Business deleted before scheduled send**
   - Solution: CASCADE delete on scheduled_sends table handles this
   - Scheduled send removed automatically

6. **Template deleted before scheduled send**
   - Solution: SET NULL on template_id (already in schema)
   - Fall back to default template (same as immediate send)

### Monitoring & Observability

**What to log:**
```typescript
// In cron route handler
console.log({
  timestamp: new Date().toISOString(),
  action: 'cron-start',
  runId: crypto.randomUUID()
})

// In processor
console.log({
  action: 'processing-scheduled-send',
  scheduledSendId,
  businessId,
  contactCount,
  sentCount,
  failedCount,
  skippedCount,
  durationMs
})
```

**Vercel cron logs location:**
- Dashboard: Project → Deployments → Production → Functions
- Real-time: `vercel logs --follow`

**Alerts to set up (optional but recommended):**
- Cron fails 3 times in a row → Slack/email notification
- Average processing time > 30s → Warning (approaching timeout)
- Skipped sends > 50% → Review contact data quality

## Sources

### High Confidence (Official Documentation)

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Getting started with cron jobs](https://vercel.com/docs/cron-jobs/quickstart)
- [Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Service Role Key](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z)
- [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL SELECT](https://www.postgresql.org/docs/current/sql-select.html)

### High Confidence (Technical Guides)

- [How to Secure Vercel Cron Job routes in Next.js 14](https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router)
- [Using Service Role with Supabase in Next.js Backend](https://github.com/orgs/supabase/discussions/30739)
- [Adrian Murage: Supabase Service Role Secret Key](https://adrianmurage.com/posts/supabase-service-role-secret-key/)
- [The Unreasonable Effectiveness of SKIP LOCKED](https://www.inferable.ai/blog/posts/postgres-skip-locked)
- [Using FOR UPDATE SKIP LOCKED for Queue-Based Workflows](https://www.netdata.cloud/academy/update-skip-locked/)
- [Solid Queue & understanding UPDATE SKIP LOCKED](https://www.bigbinary.com/blog/solid-queue)

### Medium Confidence (Community Resources)

- [Automate Your NextJS API Routes With Vercel Cron Jobs](https://medium.com/@mertenercan/automate-your-nextjs-api-routes-with-vercel-cron-jobs-64e8e86cbee9)
- [Testing Next.js Cron Jobs Locally](https://medium.com/@quentinmousset/testing-next-js-cron-jobs-locally-my-journey-from-frustration-to-solution-6ffb2e774d7a)
- [Queue System using SKIP LOCKED in Neon Postgres](https://neon.com/guides/queue-system)
