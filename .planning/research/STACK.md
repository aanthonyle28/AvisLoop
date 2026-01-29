# Stack Research: Scheduled Email Sending

**Project:** AvisLoop Review SaaS
**Milestone:** Scheduled Sending Feature
**Researched:** 2026-01-28
**Overall Confidence:** HIGH

## Executive Summary

No new npm packages required. The existing stack (Next.js 15 + Supabase + Resend + date-fns 4.1.0) already contains all necessary dependencies for scheduled email sending with Vercel Cron. Implementation requires only configuration (vercel.json) and patterns (service role client, datetime-local inputs).

## New Dependencies

**NONE REQUIRED**

All capabilities exist in the current stack:

| Capability | Provided By | Already Installed |
|------------|-------------|-------------------|
| Cron jobs | Vercel platform | N/A (platform feature) |
| Service role DB access | @supabase/supabase-js | Yes (latest) |
| Date comparison | date-fns | Yes (^4.1.0) |
| Date formatting | date-fns | Yes (^4.1.0) |
| Email sending | resend | Yes (^6.9.1) |

**Rationale:** Scheduled sending reuses existing email logic (Resend) and existing DB client (@supabase/supabase-js). Vercel Cron is a platform feature, not a package. date-fns v4 includes all needed date comparison functions (isBefore, isAfter, isPast).

## Vercel Cron

### How It Works

Vercel Cron makes HTTP GET requests to your production deployment at scheduled intervals. The cron job triggers a Next.js Route Handler, which runs server-side code.

**Key characteristics:**
- Always runs in production (not local dev)
- Always uses UTC timezone for schedules
- Includes `vercel-cron/1.0` user agent in requests
- Serverless function with same limits as Route Handlers

**Source:** [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)

### Configuration

Create `vercel.json` in project root:

```json
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

**Schedule format:** Standard cron expressions (5 fields: minute, hour, day-of-month, month, day-of-week)

Example: `* * * * *` = every minute (recommended for scheduled sending to minimize delay)

**Alternative schedules:**
- `*/5 * * * *` = every 5 minutes (reduces function invocations)
- `0 * * * *` = every hour (not recommended - max 60min delay)

**Validation:** Use [crontab.guru](https://crontab.guru/) or Vercel's validator

**Sources:**
- [Vercel Cron Jobs Quickstart](https://vercel.com/docs/cron-jobs/quickstart)
- [How to Secure Vercel Cron Job Routes](https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router)

### Security (CRITICAL)

**MUST implement CRON_SECRET authentication:**

```typescript
// app/api/cron/process-scheduled-sends/route.ts
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Process scheduled sends...
}
```

**Why:** Without authentication, anyone can trigger your cron endpoint by visiting the URL, causing:
- Quota exhaustion
- Duplicate sends
- Potential abuse

**Setup:**
1. Generate random secret: `openssl rand -base64 32`
2. Add to Vercel environment variables: `CRON_SECRET=<value>`
3. Vercel automatically includes as `Authorization: Bearer <secret>` header

**Source:** [Vercel Cron Security Best Practices](https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router)

### Limitations

| Limit | Hobby Plan | Pro Plan |
|-------|------------|----------|
| Max cron jobs | 2 | 40 |
| Function timeout | 10s | 300s (5min) |
| Timezone | UTC only | UTC only |
| Concurrency | 1 (sequential) | Configurable |

**Implications for scheduled sending:**
- Cron runs every minute → max 1 job/min on Hobby (sufficient for MVP)
- Must process batch of pending sends within timeout (batch size matters)
- All scheduled_for times stored as UTC in DB
- Cannot configure "send at 9am user's timezone" - must calculate UTC time

**Sources:**
- [Vercel Cron Usage and Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

### Local Testing

**Problem:** Vercel Cron only runs in production.

**Solution:** Direct HTTP calls to route during development.

```bash
# Test cron route locally
curl http://localhost:3000/api/cron/process-scheduled-sends \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Advanced option:** [nextjs-crons](https://medium.com/@quentinmousset/testing-next-js-cron-jobs-locally-my-journey-from-frustration-to-solution-6ffb2e774d7a) tool (January 2026) simulates Vercel Cron locally, but adds dev dependency. Not recommended - direct curl testing is simpler.

**Confidence:** HIGH (official Vercel docs)

## Service Role Client

### Purpose

Cron jobs run without user authentication. Standard Supabase SSR client expects cookies/sessions. Service role client bypasses RLS for admin operations.

**When to use:**
- Cron jobs (no user context)
- System-level operations (cleanup, aggregation)
- Admin actions not tied to specific user

**When NOT to use:**
- User-facing requests (use SSR client with cookies)
- Client Components (NEVER - security risk)

### Implementation

**Create separate client for service role operations:**

```typescript
// lib/supabase/service-role-client.ts (server-only)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServiceRole = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,      // No session needed
    autoRefreshToken: false,     // No token refresh
    detectSessionInUrl: false,   // Not in browser
  },
});
```

**Use in cron route:**

```typescript
// app/api/cron/process-scheduled-sends/route.ts
import { supabaseServiceRole } from '@/lib/supabase/service-role-client';

export async function GET(request: NextRequest) {
  // Auth check...

  const { data: pendingSends } = await supabaseServiceRole
    .from('scheduled_sends')
    .select('*')
    .lte('scheduled_for', new Date().toISOString())
    .eq('status', 'pending')
    .limit(50); // Batch size

  // Process sends...
}
```

**Sources:**
- [Using Service Role with Supabase in Next.js Backend](https://github.com/orgs/supabase/discussions/30739)
- [How to Use the Supabase Service Role Secret Key](https://adrianmurage.com/posts/supabase-service-role-secret-key/)

### Security Considerations (CRITICAL)

**NEVER expose service role key:**
- DO NOT prefix with `NEXT_PUBLIC_` (exposes to browser)
- DO NOT import service role client in Client Components
- DO NOT log service role key or queries (may contain PII)

**Service role bypasses RLS:**
- Can read/write ANY row in ANY table
- Equivalent to database superuser
- Use only when RLS bypass is intentional

**Best practices:**
1. Create `lib/supabase/service-role-client.ts` as server-only module
2. Import only in Route Handlers, Server Actions, Server Components
3. Validate all inputs before queries (no user input directly in queries)
4. Log operations for audit trail (without sensitive data)

**Confidence:** HIGH (official Supabase guidance + community best practices)

## Date/Time Handling

### Libraries Already Installed

**date-fns:** v4.1.0 (already in package.json)

date-fns v4 includes first-class timezone support but scheduled sending for AvisLoop only needs basic date comparison - no additional timezone package required.

**Source:** [date-fns v4.0 Release Announcement](https://blog.date-fns.org/v40-with-time-zone-support/)

### Core Functions Needed

All available in base `date-fns` package:

| Function | Purpose | Example |
|----------|---------|---------|
| `isBefore(date1, date2)` | Check if scheduled_for is before now | `isBefore(scheduledFor, new Date())` |
| `isAfter(date1, date2)` | Validate scheduled_for is in future | `isAfter(scheduledFor, new Date())` |
| `isPast(date)` | Check if scheduled time has passed | `isPast(scheduledFor)` |
| `isFuture(date)` | Validate user input is future date | `isFuture(scheduledFor)` |
| `parseISO(string)` | Parse datetime-local input value | `parseISO("2026-01-28T14:30")` |
| `formatISO(date)` | Format date for DB storage | `formatISO(new Date())` |

**Sources:**
- [date-fns isBefore](https://date-fns.org/docs/isBefore)
- [You Might Not Need date-fns](https://youmightnotneed.com/date-fns) (confirms functions exist)

### Timezone Strategy

**Storage:** Always store as UTC in Postgres `timestamptz` columns.

```typescript
// When creating scheduled send
const scheduledForUTC = new Date(formData.scheduled_for); // Browser sends local time
await supabase.from('scheduled_sends').insert({
  scheduled_for: scheduledForUTC.toISOString(), // Converts to UTC
});
```

**Comparison:** Always compare against `new Date()` (server time = UTC on Vercel).

```typescript
// In cron job (runs on server in UTC)
const now = new Date(); // Already UTC
const { data } = await supabaseServiceRole
  .from('scheduled_sends')
  .lte('scheduled_for', now.toISOString());
```

**Display:** Browser automatically converts UTC to user's local timezone when rendering.

```typescript
// Client-side display
<time dateTime={send.scheduled_for}>
  {format(parseISO(send.scheduled_for), 'PPpp')} {/* Shows in user's timezone */}
</time>
```

**Why NOT add @date-fns/tz:**
- AvisLoop doesn't need explicit timezone conversion (user picks local time, we store UTC)
- Browser handles local→UTC conversion automatically via `new Date()`
- Adds 761+ bytes for unused functionality
- Postgres `timestamptz` handles UTC storage automatically

**Confidence:** HIGH (standard UTC storage pattern + date-fns v4 docs)

### HTML datetime-local Input

**Value format:** ISO 8601 local datetime string (no timezone)

**Format:** `YYYY-MM-DDTHH:mm` (e.g., `2026-01-28T14:30`)

**Characteristics:**
- No timezone info in string (browser assumes local time)
- Normalizes to format with `T` separator
- Browser converts to UTC when submitting via JavaScript

**Example:**

```tsx
// Form input
<input
  type="datetime-local"
  name="scheduled_for"
  min={new Date().toISOString().slice(0, 16)} // Prevent past dates
/>

// Server Action
const formData = new FormData();
const scheduledForLocal = formData.get('scheduled_for'); // "2026-01-28T14:30"
const scheduledForUTC = new Date(scheduledForLocal); // Browser converted to UTC
```

**Source:** [MDN: datetime-local Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local)

**Confidence:** HIGH (MDN + W3C HTML5 spec)

## What NOT to Add

### Do NOT Install These Packages

| Package | Why NOT | Use Instead |
|---------|---------|-------------|
| `@date-fns/tz` | Only needed for explicit timezone conversion; UTC storage + browser rendering handles timezones | Base `date-fns` functions |
| `date-fns-tz` | Third-party package for date-fns v3; AvisLoop uses v4 | Base `date-fns` (has built-in TZ support if needed) |
| `node-cron` | Server-always-on cron scheduler; Vercel is serverless | Vercel Cron (platform feature) |
| `cron` | Same as node-cron; assumes persistent process | Vercel Cron |
| `bull` / `bullmq` | Job queue systems requiring Redis; overkill for simple scheduling | Vercel Cron + Postgres |
| `agenda` | Requires MongoDB; AvisLoop uses Postgres | Vercel Cron + Postgres |
| `luxon` | Alternative to date-fns; redundant dependency | Existing `date-fns` |
| `moment` | Legacy library (maintenance mode since 2020) | Existing `date-fns` |
| `dayjs` | Smaller than date-fns but less comprehensive; would replace existing dep | Existing `date-fns` |

### Do NOT Use Native Cron

**Avoid:** Server-based cron (crontab, systemd timers, etc.)

**Why:** Vercel is serverless. No persistent server to run cron daemon. Functions spin up on request, then shut down.

**Source:** [Vercel Serverless Functions](https://vercel.com/docs/functions)

### Do NOT Over-Engineer Timezone Handling

**Temptation:** "Users in different timezones need different send times!"

**Reality for MVP:** Store UTC, display local. Users pick a datetime in their browser, which is their local time. Browser converts to UTC automatically. Postgres stores UTC. Display converts back to local.

**Advanced feature (post-MVP):** Explicit timezone selection ("Send at 9am Pacific") requires @date-fns/tz + timezone dropdown, but NOT needed for initial scheduled sending.

**Confidence:** HIGH (standard web app pattern)

## Integration Points

### How New Elements Connect to Existing Stack

```
┌─────────────────────────────────────────────────────────────┐
│ User Browser (Client Component)                             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ <input type="datetime-local" />                    │    │
│  │ User picks: 2026-01-28 14:30 (local time)          │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │ Form submission                         │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Browser converts to UTC: 2026-01-28T22:30:00Z      │    │
│  └────────────────┬───────────────────────────────────┘    │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Server Action / Route Handler                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ import { supabaseSSR } from '@/lib/supabase/ssr'   │    │
│  │                                                     │    │
│  │ await supabaseSSR.from('scheduled_sends').insert({ │    │
│  │   org_id: user.org_id,                             │    │
│  │   contact_id: formData.contact_id,                 │    │
│  │   scheduled_for: scheduledForUTC.toISOString(),    │    │
│  │   status: 'pending',                               │    │
│  │   ...                                              │    │
│  │ })                                                 │    │
│  └────────────────┬───────────────────────────────────┘    │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase Postgres (existing)                                │
│                                                              │
│  scheduled_sends table:                                     │
│  ┌──────────────────────────────────────────────────┐      │
│  │ id | org_id | scheduled_for (timestamptz) | ...  │      │
│  │ 1  | abc    | 2026-01-28 22:30:00+00       | ...  │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ Every minute (Vercel Cron)
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Vercel Cron (NEW)                                           │
│                                                              │
│  vercel.json:                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │ "crons": [{                                        │    │
│  │   "path": "/api/cron/process-scheduled-sends",     │    │
│  │   "schedule": "* * * * *"  // every minute         │    │
│  │ }]                                                 │    │
│  └────────────────┬───────────────────────────────────┘    │
└───────────────────┼──────────────────────────────────────────┘
                    │ HTTP GET with CRON_SECRET
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ app/api/cron/process-scheduled-sends/route.ts (NEW)         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. Check CRON_SECRET authorization                 │    │
│  │ 2. Import service role client (NEW pattern)        │    │
│  │    import { supabaseServiceRole }                  │    │
│  │ 3. Query pending sends (NEW query)                 │    │
│  │    .lte('scheduled_for', new Date().toISOString()) │    │
│  │    .eq('status', 'pending')                        │    │
│  │ 4. Use date-fns for comparison (EXISTING lib)      │    │
│  │    if (isPast(send.scheduled_for)) { ... }         │    │
│  │ 5. Call EXISTING email sending logic               │    │
│  │    await sendReviewRequest(send)                   │    │
│  │ 6. Update status to 'sent' or 'failed'             │    │
│  └────────────────┬───────────────────────────────────┘    │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Resend API (existing)                                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Email sent to contact                              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Key Integration Considerations

**1. Existing email sending logic reuse:**
   - DO NOT duplicate send logic in cron job
   - Extract to shared function: `lib/email/send-review-request.ts`
   - Call from both immediate send and scheduled send

**2. Supabase service role client isolation:**
   - Create separate file: `lib/supabase/service-role-client.ts`
   - Server-only module (never import in Client Components)
   - Use ONLY in cron routes and admin Server Actions

**3. Schema additions minimal:**
   - Add `scheduled_sends` table (mirrors existing send structure)
   - Add RLS policies (org_id scoping like existing tables)
   - Service role client bypasses RLS (intentional for cron job)

**4. No UI library changes:**
   - Native `<input type="datetime-local">` sufficient
   - Existing shadcn/ui components for form layout
   - No calendar picker library needed (datetime-local has built-in picker)

**5. Monitoring/logging hooks:**
   - Log cron execution to existing logging setup (if present)
   - Track send attempts in `send_history` table (existing pattern)
   - Error handling follows existing Resend error patterns

**Confidence:** HIGH (architectural analysis of existing codebase patterns)

## Implementation Checklist

Downstream roadmap should ensure:

- [ ] `vercel.json` created with cron configuration
- [ ] `CRON_SECRET` added to Vercel environment variables
- [ ] `lib/supabase/service-role-client.ts` created (server-only)
- [ ] Cron route implements CRON_SECRET check
- [ ] Service role client limited to cron route (not exposed elsewhere)
- [ ] Existing send logic extracted to shared function
- [ ] datetime-local inputs include `min` attribute (prevent past dates)
- [ ] All scheduled_for values stored as ISO 8601 UTC strings
- [ ] date-fns functions imported as needed (no new package install)
- [ ] Schema migration includes RLS policies for scheduled_sends table

**Confidence:** HIGH (comprehensive coverage of all integration points)

---

## Sources

**Vercel Cron:**
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Vercel Cron Jobs Quickstart](https://vercel.com/docs/cron-jobs/quickstart)
- [Managing Vercel Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [How to Secure Vercel Cron Job Routes (App Router)](https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router)
- [Testing Next.js Cron Jobs Locally (2026)](https://medium.com/@quentinmousset/testing-next-js-cron-jobs-locally-my-journey-from-frustration-to-solution-6ffb2e774d7a)

**Supabase Service Role:**
- [Supabase SSR Client Creation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Using Service Role with Supabase in Next.js Backend](https://github.com/orgs/supabase/discussions/30739)
- [How to Use the Supabase Service Role Secret Key](https://adrianmurage.com/posts/supabase-service-role-secret-key/)

**date-fns:**
- [date-fns v4.0 Release with Time Zone Support](https://blog.date-fns.org/v40-with-time-zone-support/)
- [date-fns isBefore Function](https://date-fns.org/docs/isBefore)
- [date-fns Time Zones Documentation](https://date-fns.org/v4.0.0/docs/Time-Zones)
- [@date-fns/tz Package](https://github.com/date-fns/tz)

**HTML datetime-local:**
- [MDN: datetime-local Input Type](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local)
- [Using Date and Time Formats in HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Date_and_time_formats)
