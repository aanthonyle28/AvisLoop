# Phase 12: Cron Processing - Research

**Researched:** 2026-01-29
**Domain:** Vercel Cron + Next.js Route Handlers + PostgreSQL Background Job Processing
**Confidence:** HIGH

## Summary

Phase 12 implements the background processing layer for scheduled sends using Vercel Cron and PostgreSQL row-level locking. The research confirms that all required infrastructure already exists in the codebase from manual v1.1 work: the `scheduled_sends` table, service role client, schedule action functions, and core email sending logic. This phase focuses solely on the cron endpoint and processing logic, which creates a background worker that runs every minute to find due scheduled sends and execute them using existing send infrastructure.

The standard approach for Vercel Cron jobs involves three components: (1) a Route Handler in `app/api/cron/*/route.ts` that validates the `CRON_SECRET` header, (2) a `vercel.json` configuration that defines the schedule and path, and (3) a service role Supabase client that bypasses RLS for background operations. Race conditions are prevented using PostgreSQL's `FOR UPDATE SKIP LOCKED` clause, which allows multiple concurrent cron invocations to safely claim different scheduled sends without blocking each other.

The most critical aspects for this phase are authentication (validating `CRON_SECRET` to prevent unauthorized invocations), idempotency (handling duplicate cron events), business rule re-validation (checking opt-out/cooldown/quota at send time, not just schedule time), and structured logging (JSON output with counts for monitoring). The cron processor should reuse 100% of the existing `batchSendReviewRequest` validation and sending logic, avoiding code duplication.

**Primary recommendation:** Create a GET route handler at `app/api/cron/process-scheduled-sends/route.ts` that validates `CRON_SECRET`, uses the existing service role client from `lib/supabase/service-role.ts`, fetches due scheduled sends with `FOR UPDATE SKIP LOCKED`, and calls existing send functions from `lib/actions/send.ts` for each contact.

## Standard Stack

The existing stack provides all required capabilities for cron processing.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vercel Cron | Platform feature | HTTP-triggered job scheduling | Vercel's native solution for serverless cron; no separate worker process needed; configured via vercel.json |
| Next.js Route Handlers | 15.x (App Router) | HTTP request handling for cron endpoint | App Router standard for API routes; supports Web Request/Response APIs; integrates with Vercel Cron |
| @supabase/supabase-js | latest | Service role client for RLS bypass | Existing dependency; service role key bypasses RLS for background operations |
| PostgreSQL FOR UPDATE SKIP LOCKED | Built-in | Row-level locking for concurrent workers | Standard PostgreSQL feature for job queues; prevents race conditions; atomic claim operation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 (installed) | Date comparison for due sends | Already in package.json; use `isPast()` for simple due date checks |
| zod | 4.3.6 (installed) | Response validation | Already in package.json; validate cron processing results if needed |
| resend | 6.9.1 (installed) | Email delivery | Existing send infrastructure; cron reuses same email sending logic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel Cron | node-cron / node-schedule | Would require persistent process (not serverless); adds complexity; Vercel Cron is included |
| Route Handlers | Pages API routes | Pages Router is legacy; App Router Route Handlers are current standard |
| FOR UPDATE SKIP LOCKED | Application-level locks (Redis) | Adds external dependency; PostgreSQL row locks are simpler and already available |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── api/
│   └── cron/
│       └── process-scheduled-sends/
│           └── route.ts           # Cron endpoint (validates CRON_SECRET, calls processor)
lib/
├── actions/
│   ├── send.ts                    # Existing send logic (reused by cron)
│   └── schedule.ts                # Existing schedule management
├── supabase/
│   └── service-role.ts            # Existing service role client
vercel.json                        # Cron configuration
```

### Pattern 1: Vercel Cron Route Handler with CRON_SECRET Validation
**What:** Route Handler that validates authorization header before processing cron job
**When to use:** All Vercel Cron endpoints (cron jobs are public URLs, need authentication)
**Example:**
```typescript
// Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Max execution time in seconds

export async function GET(request: NextRequest) {
  // CRITICAL: Validate CRON_SECRET before any processing
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Process scheduled sends here
    const result = await processScheduledSends()
    return Response.json(result)
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### Pattern 2: Vercel Cron Configuration
**What:** Configuration in vercel.json that defines cron schedule and target path
**When to use:** All Vercel Cron jobs
**Example:**
```json
// Source: https://vercel.com/docs/cron-jobs/quickstart
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/process-scheduled-sends",
      "schedule": "* * * * *"
    }
  ]
}
```
**Note:** `"* * * * *"` means every minute. Cron expression format: `minute hour day-of-month month day-of-week`. Timezone is always UTC.

### Pattern 3: Service Role Client for RLS Bypass
**What:** Separate Supabase client using service role key instead of anon key
**When to use:** Background operations without user session (cron, admin tasks)
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z
import { createClient } from '@supabase/supabase-js'

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
```
**CRITICAL:** Never import service role client in client components. Service role bypasses ALL RLS policies.

### Pattern 4: FOR UPDATE SKIP LOCKED for Race Condition Prevention
**What:** SQL query pattern that atomically claims rows for processing without blocking other workers
**When to use:** Job queue processing with concurrent workers (multiple cron invocations)
**Example:**
```typescript
// Source: https://www.inferable.ai/blog/posts/postgres-skip-locked
// Fetch and claim due scheduled sends in single atomic operation
const { data: dueSends } = await supabase
  .from('scheduled_sends')
  .update({ status: 'processing' }) // Claim sends IMMEDIATELY
  .eq('status', 'pending')
  .lte('scheduled_for', new Date().toISOString())
  .select('*')
  // FOR UPDATE SKIP LOCKED happens in single statement
  // Prevents race conditions without blocking
```
**Why it works:** Each concurrent worker gets different rows. Worker 1 locks Send A, Worker 2 immediately gets Send B instead of waiting.

### Pattern 5: Idempotent Processing with Structured Logging
**What:** Design operations to produce same result when executed multiple times; return structured JSON logs
**When to use:** All cron jobs (Vercel can deliver same event multiple times)
**Example:**
```typescript
// Source: https://traveling-coderman.net/code/node-architecture/idempotent-cron-job/
// Idempotent: Setting status to 'completed' is safe to run twice
await supabase
  .from('scheduled_sends')
  .update({
    status: 'completed',
    executed_at: now,
    send_log_ids: sendLogIds,
  })
  .eq('id', scheduledSendId)
  .eq('status', 'processing') // Only update if still processing

// Structured logging for monitoring
return Response.json({
  success: true,
  timestamp: new Date().toISOString(),
  processed: 5,
  sent: 4,
  skipped: 1,
  failed: 0,
  details: [
    { scheduledSendId: 'abc', contactCount: 3, result: 'sent' },
    { scheduledSendId: 'def', contactCount: 2, result: 'skipped', reason: 'opted_out' }
  ]
})
```

### Pattern 6: Business Rule Re-Validation at Send Time
**What:** Check opt-out, cooldown, quota, archive status when processing scheduled send, not just when scheduling
**When to use:** All scheduled send processing (conditions change between schedule and execution)
**Example:**
```typescript
// Contact may have opted out AFTER scheduling but BEFORE send time
// Re-validate using same logic as immediate sends
const { data: contact } = await supabase
  .from('contacts')
  .select('id, opted_out, status, last_sent_at')
  .eq('id', contactId)
  .single()

if (!contact || contact.opted_out || contact.status === 'archived') {
  // Skip this contact, mark as skipped in results
  skipped.push({ contactId, reason: 'opted_out' })
  continue
}

// Check cooldown at send time
if (contact.last_sent_at) {
  const cooldownEnd = new Date(contact.last_sent_at)
  cooldownEnd.setDate(cooldownEnd.getDate() + COOLDOWN_DAYS)
  if (new Date() < cooldownEnd) {
    skipped.push({ contactId, reason: 'cooldown' })
    continue
  }
}
```

### Anti-Patterns to Avoid
- **Using SSR Supabase client for cron:** SSR clients share user sessions from cookies, which override service role key. Always create separate service role client.
- **Scheduling cron jobs with pages API routes:** Pages Router is legacy. Use App Router Route Handlers.
- **Skipping CRON_SECRET validation:** Cron endpoints are public URLs. Always validate authorization header.
- **Storing dates in local timezone:** Always store UTC in database (`timestamptz`). Convert to local timezone only for display.
- **Validating business rules only at schedule time:** Contacts can opt out between scheduling and execution. Re-validate at send time.
- **SELECT then UPDATE pattern:** Creates race condition window. Use `UPDATE...RETURNING` with `FOR UPDATE SKIP LOCKED` in single statement.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron job scheduling | Custom cron parser, long-running process | Vercel Cron (platform feature) | Vercel Cron is included, serverless, handles invocation; no need to manage process lifecycle |
| Race condition prevention | Application-level locks, Redis distributed locks | PostgreSQL `FOR UPDATE SKIP LOCKED` | Built into PostgreSQL, atomic, no external dependency; simpler than distributed locks |
| Service role client | Custom auth bypass logic | `createServiceRoleClient()` with service role key | Service role key automatically bypasses ALL RLS policies; documented pattern |
| Date comparison | Manual timestamp math | `date-fns` functions (`isPast`, `isBefore`) | Already installed, tested, handles edge cases |
| Email sending logic | Duplicate send function for scheduled sends | Extract and reuse existing `batchSendReviewRequest` logic | Single source of truth prevents validation drift |

**Key insight:** The existing codebase (from manual v1.1 work) already has 90% of required infrastructure. Don't rebuild what exists - reuse existing send actions, service role client, and validation logic.

## Common Pitfalls

### Pitfall 1: Race Conditions from Concurrent Cron Invocations
**What goes wrong:** Two cron invocations process the same scheduled send, resulting in duplicate emails to contacts
**Why it happens:** Vercel Cron can trigger multiple instances if previous run hasn't finished. Simple SELECT-then-UPDATE creates race condition window where both workers see same pending sends.
**How to avoid:** Use atomic `UPDATE...RETURNING` query with `FOR UPDATE SKIP LOCKED`. Update status to 'processing' immediately in same query that selects due sends. Each worker claims different sends.
**Warning signs:** Duplicate emails sent, send_log showing same scheduled_send_id processed twice, contacts receiving multiple identical review requests

### Pitfall 2: Service Role Key Exposure
**What goes wrong:** Unauthorized access to cron endpoint allows anyone to trigger background processing or access privileged data
**Why it happens:** Cron endpoints are public URLs. Without authentication, anyone can call `/api/cron/process-scheduled-sends`.
**How to avoid:** Always validate `Authorization` header matches `Bearer ${process.env.CRON_SECRET}` before any processing. Use random 32+ character secret. Return 401 immediately if validation fails.
**Warning signs:** Unexpected cron invocations in logs, processing triggered outside expected cron schedule, 401 errors in Vercel Cron logs

### Pitfall 3: Timezone Confusion (UTC vs Local)
**What goes wrong:** Scheduled sends execute at wrong time (e.g., user schedules "9am" but send happens at 9am UTC instead of 9am PST)
**Why it happens:** Vercel Cron always runs in UTC. Database stores timestamptz in UTC. HTML datetime-local input returns local timezone. Mixing timezones causes offset errors.
**How to avoid:**
- Always store `scheduled_for` as UTC in database (PostgreSQL `timestamptz` auto-converts)
- Always convert user input to UTC before storing
- Always display in user's local timezone with abbreviation (e.g., "9:00 AM PST")
- Test explicitly across DST boundaries
**Warning signs:** Sends executing hours off from scheduled time, user reports "scheduled 9am, sent at 5pm", incorrect timezone abbreviations in UI

### Pitfall 4: Stale Business Rule Validation
**What goes wrong:** Scheduled send executes even though contact opted out, or quota exceeded between scheduling and execution
**Why it happens:** Conditions change over time. Contact may opt out after scheduling but before send time. Business may hit quota limit.
**How to avoid:** Re-validate ALL business rules in cron processor: opt-out status, cooldown period, monthly quota, archive status. Use same validation functions as immediate sends.
**Warning signs:** Opted-out contacts receiving emails, archived contacts being sent to, quota limit exceeded, compliance violations

### Pitfall 5: Service Role Client Not Bypassing RLS
**What goes wrong:** Cron job hits RLS policy errors, fails to fetch scheduled sends, or only processes sends for one business
**Why it happens:** Three causes: (1) SSR client contaminated with user session from cookies, (2) Authorization header manually set to user JWT, (3) Using anon key instead of service role key
**How to avoid:**
- Create dedicated service role client using `@supabase/supabase-js` directly (not SSR client)
- Never set Authorization header manually
- Verify `SUPABASE_SERVICE_ROLE_KEY` environment variable exists
- Set `auth: { autoRefreshToken: false, persistSession: false }`
**Warning signs:** RLS errors in cron logs, "permission denied" errors, scheduled sends only processing for some businesses

### Pitfall 6: Silent Cron Failures
**What goes wrong:** Cron job stops running, scheduled sends pile up unprocessed, users report emails never sent
**Why it happens:** Vercel doesn't retry failed cron invocations. Errors thrown in route handler fail silently. No monitoring alerts set up.
**How to avoid:**
- Implement structured JSON logging with counts (processed, sent, failed, skipped)
- Set up external monitoring (BetterStack, Sentry) to alert if cron doesn't run for >5 minutes
- Log all errors with stack traces
- Return 200 OK even for partial failures (log errors in response body)
**Warning signs:** Sends overdue by >10 minutes, empty cron logs, scheduled_sends table growing with pending status, user complaints

### Pitfall 7: Production-Only Cron Execution
**What goes wrong:** Local testing fails, developers can't verify cron behavior until production deployment
**Why it happens:** Vercel Cron only runs in production deployments, not preview or local dev. `vercel dev` and `next dev` don't support cron triggers.
**How to avoid:**
- Test locally via direct HTTP request: `curl http://localhost:3000/api/cron/process-scheduled-sends -H "Authorization: Bearer ${CRON_SECRET}"`
- Set `CRON_SECRET` in `.env.local` for local testing
- Create integration tests that call cron endpoint directly
- Use preview deployments promoted to production for final testing
**Warning signs:** "Works locally but not in prod", cron not appearing in Vercel dashboard, 404 errors on cron path

### Pitfall 8: Non-Idempotent Operations
**What goes wrong:** Duplicate cron event causes double-processing, contacts charged twice, counters incremented incorrectly
**Why it happens:** Vercel's event-driven system can deliver same cron event multiple times. Operations like "increment credit" or "send email" are not idempotent.
**How to avoid:**
- Design operations to produce same result when run twice: "set status to completed" (not "increment counter")
- Use unique IDs to track processed events
- Check current state before changing (e.g., `WHERE status = 'processing'`)
- Store results with timestamps
**Warning signs:** Duplicate sends to same contact, counters higher than expected, race condition errors

## Code Examples

Verified patterns from official sources:

### Complete Cron Route Handler
```typescript
// Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs + https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// app/api/cron/process-scheduled-sends/route.ts
import type { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic' // Never cache
export const maxDuration = 60 // Max 60 seconds for Hobby tier

export async function GET(request: NextRequest) {
  // 1. Validate CRON_SECRET (CRITICAL)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Create service role client (bypasses RLS)
  const supabase = createServiceRoleClient()

  try {
    // 3. Fetch and claim due scheduled sends atomically
    const now = new Date().toISOString()
    const { data: dueSends, error } = await supabase
      .from('scheduled_sends')
      .update({ status: 'processing' }) // Atomic claim
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .select('*')

    if (error) throw error

    // 4. Process each scheduled send
    const results = {
      timestamp: now,
      processed: dueSends?.length || 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{
        scheduledSendId: string
        contactCount: number
        result: 'sent' | 'failed' | 'skipped'
        reason?: string
      }>
    }

    for (const scheduledSend of dueSends || []) {
      // Process send (re-validate rules, send emails, update status)
      // Implementation reuses existing send logic from lib/actions/send.ts
    }

    // 5. Return structured JSON log
    return Response.json({ success: true, ...results })
  } catch (error) {
    console.error('Cron processing error:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
```

### Atomic Claim Query with FOR UPDATE SKIP LOCKED
```typescript
// Source: https://www.inferable.ai/blog/posts/postgres-skip-locked
// Single query that claims sends atomically (prevents race conditions)
const now = new Date().toISOString()

// UPDATE sets status='processing' FIRST, then returns claimed rows
// Other concurrent workers skip these locked rows automatically
const { data: claimedSends, error } = await supabase
  .from('scheduled_sends')
  .update({ status: 'processing' }) // Immediate claim
  .eq('status', 'pending')
  .lte('scheduled_for', now)
  .select('id, business_id, contact_ids, template_id, custom_subject')

// At this point, these sends are locked for THIS worker only
// Other workers executing same query will get DIFFERENT sends
```

### Re-Validation at Send Time
```typescript
// Source: Existing codebase pattern from lib/actions/send.ts
// Re-check business rules that may have changed since scheduling
async function validateContactForSend(supabase, contactId, businessId) {
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, name, email, status, opted_out, last_sent_at')
    .eq('id', contactId)
    .eq('business_id', businessId) // Security: ensure contact belongs to business
    .single()

  // Check opt-out (may have changed since scheduling)
  if (!contact || contact.opted_out) {
    return { eligible: false, reason: 'opted_out' }
  }

  // Check archive status (may have changed)
  if (contact.status === 'archived') {
    return { eligible: false, reason: 'archived' }
  }

  // Check cooldown (based on CURRENT last_sent_at, not scheduled_for)
  if (contact.last_sent_at) {
    const cooldownEnd = new Date(contact.last_sent_at)
    cooldownEnd.setDate(cooldownEnd.getDate() + COOLDOWN_DAYS)
    if (new Date() < cooldownEnd) {
      return { eligible: false, reason: 'cooldown' }
    }
  }

  return { eligible: true, contact }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom cron daemons | Vercel Cron (platform feature) | ~2021 | Serverless cron; no process management; integrated with deployments |
| Pages API routes | App Router Route Handlers | Next.js 13+ (2022) | Web Request/Response APIs; better TypeScript; middleware support |
| Manual row locking | `FOR UPDATE SKIP LOCKED` | PostgreSQL 9.5 (2016) | Atomic job claiming; no blocking; perfect for queues |
| Application locks (Redis) | PostgreSQL row locks | Ongoing | Simpler stack; fewer dependencies; built-in to database |

**Deprecated/outdated:**
- Pages Router API routes for new cron endpoints (use App Router Route Handlers)
- `node-cron` / `node-schedule` for Vercel deployments (use Vercel Cron platform feature)
- SELECT-then-UPDATE pattern for job queues (use `UPDATE...RETURNING` with `FOR UPDATE SKIP LOCKED`)

## Open Questions

Things that couldn't be fully resolved:

1. **Scheduled_sends migration existence**
   - What we know: Context mentions "Database migration for scheduled_sends table applied" but no migration file found in repo
   - What's unclear: Whether migration was applied manually, or exists in different location, or needs to be created
   - Recommendation: Verify `scheduled_sends` table exists in database. If not, create migration as part of implementation. If yes, document schema in PLAN.md.

2. **Resend rate limit handling strategy**
   - What we know: Resend default is 2 requests/second. Batch sends may hit limit. Existing code doesn't have rate limiting between sends.
   - What's unclear: Whether to add 500ms delay, use rate-limited queue (p-limit), or rely on Resend's built-in queuing
   - Recommendation: Start without artificial delay. Monitor for 429 errors in production. Add p-limit if needed (deferred optimization).

3. **Cron execution frequency tradeoff**
   - What we know: Every minute provides near-instant execution. Less frequent (every 5 minutes) reduces invocation costs.
   - What's unclear: User expectation for scheduled send accuracy (1 minute vs 5 minute window)
   - Recommendation: Start with every minute (`* * * * *`). User expectation is "sent around scheduled time" not "exactly at scheduled time". Review Vercel Cron usage costs after first month.

4. **Structured logging destination**
   - What we know: Vercel logs are viewable via dashboard. External monitoring (BetterStack, Sentry) provides better alerting.
   - What's unclear: Whether to set up external monitoring in this phase or defer to operations phase
   - Recommendation: Return structured JSON from cron endpoint (enables future monitoring). Defer external monitoring setup to separate operations/observability phase.

## Sources

### Primary (HIGH confidence)
- Vercel Cron Jobs Documentation - https://vercel.com/docs/cron-jobs
- Vercel Cron Jobs Management - https://vercel.com/docs/cron-jobs/manage-cron-jobs (CRON_SECRET validation pattern)
- Vercel Cron Jobs Quickstart - https://vercel.com/docs/cron-jobs/quickstart (vercel.json configuration)
- Next.js Route Handlers Documentation - https://nextjs.org/docs/app/building-your-application/routing/route-handlers (App Router patterns)
- Supabase Service Role Key Troubleshooting - https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z (RLS bypass)
- Inferable: FOR UPDATE SKIP LOCKED - https://www.inferable.ai/blog/posts/postgres-skip-locked (race condition prevention)

### Secondary (MEDIUM confidence)
- Netdata: FOR UPDATE SKIP LOCKED for Queues - https://www.netdata.cloud/academy/update-skip-locked/ (queue patterns)
- Building Idempotent Cron Jobs - https://traveling-coderman.net/code/node-architecture/idempotent-cron-job/ (idempotency patterns)
- Scalable Architect: PostgreSQL Row Locks Guide - https://scalablearchitect.com/postgresql-row-level-locks-a-complete-guide-to-for-update-for-share-skip-locked-and-nowait/ (row locking)
- Robust Perception: Idempotent Cron Jobs - https://www.robustperception.io/idempotent-cron-jobs-are-operable-cron-jobs/ (operational best practices)

### Tertiary (LOW confidence - WebSearch only)
- Medium: Next.js Cron Jobs with App Router - https://medium.com/@devadeelahmad/how-to-create-a-cron-job-in-next-js-using-the-app-router-9ded12f1e838 (community tutorial)
- Medium: Vercel Cron Jobs Automation - https://medium.com/@mertenercan/automate-your-nextjs-api-routes-with-vercel-cron-jobs-64e8e86cbee9 (community tutorial)

### Internal Sources (Codebase)
- `.planning/research/SUMMARY.md` - Comprehensive v1.1 research on scheduled sending architecture
- `lib/supabase/service-role.ts` - Existing service role client implementation (HIGH confidence - verified in codebase)
- `lib/actions/send.ts` - Existing send logic for reuse (HIGH confidence - verified in codebase)
- `lib/actions/schedule.ts` - Existing schedule management actions (HIGH confidence - verified in codebase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vercel Cron documented in official docs, Route Handlers are Next.js standard, FOR UPDATE SKIP LOCKED is PostgreSQL built-in, existing libs already installed
- Architecture: HIGH - Patterns verified in official Vercel/Next.js docs, existing codebase has 90% of infrastructure, service role client pattern documented
- Pitfalls: HIGH - Race conditions, timezone handling, RLS bypass, idempotency documented in official sources and community production experience

**Research date:** 2026-01-29
**Valid until:** 2026-03-01 (30 days - stable domain, Vercel Cron patterns unlikely to change)
