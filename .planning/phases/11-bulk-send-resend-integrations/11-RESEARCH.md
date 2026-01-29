# Phase 11: Bulk Send, Re-send & Integrations - Research

**Researched:** 2026-01-28
**Domain:** Batch operations, webhook APIs, API key authentication, rate limiting
**Confidence:** HIGH

## Summary

This phase implements three distinct features: bulk sending review requests (up to 25 contacts at once), a "ready to re-send" filter for contacts past their cooldown period, and a webhook API with API key authentication for external integrations. The research focused on identifying proven patterns for batch operations in Next.js server actions, secure API key generation and hashing, webhook authentication, rate limiting strategies, and React multi-select UI patterns.

The standard approach uses Next.js 15 server actions for batch processing, Node.js crypto module (scrypt or pbkdf2) for secure API key hashing, Upstash Redis for rate limiting webhooks at 60 requests per minute, TanStack Table's built-in row selection APIs for multi-select checkboxes, and PostgreSQL unique constraints for email deduplication. The codebase already uses these technologies effectively in phases 1-10, providing proven patterns to extend.

**Primary recommendation:** Use a single server action for batch send that processes all validations (cooldown, opt-out, quota) in one database query using SQL filters, hash API keys with Node.js crypto.scrypt (already in Node runtime), implement webhook rate limiting with the existing Upstash Redis setup using `Ratelimit.slidingWindow(60, "1 m")`, and use TanStack Table's row selection hooks with a 25-contact cap enforced in UI state.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js 15 App Router | latest | Server actions for batch operations | Already used in phases 1-10, proven pattern for mutations |
| Node.js crypto | built-in | API key generation and hashing | No dependencies, NIST-approved algorithms (pbkdf2, scrypt) |
| Upstash Redis | @upstash/ratelimit@^2.0.8 | Webhook rate limiting | Already configured, serverless-optimized |
| TanStack Table | @tanstack/react-table@^8.21.3 | Row selection with checkboxes | Already used for contacts table |
| Zod | zod@^4.3.6 | Webhook payload validation | Already used throughout codebase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Hook Form | react-hook-form@^7.71.1 | Manage batch send form state | Already used for forms |
| crypto.randomBytes | Node.js built-in | Generate cryptographically secure tokens | For creating API keys (32+ bytes) |
| crypto.scrypt | Node.js built-in | Hash API keys for storage | Alternative to bcrypt, built into Node.js |
| crypto.timingSafeEqual | Node.js built-in | Compare hashes safely | Prevents timing attacks during verification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| crypto.scrypt | bcrypt package | bcrypt requires native dependencies, crypto is built-in |
| Server action batch | Multiple individual API calls | Server action provides transaction semantics, better error handling |
| Functional index on lower(email) | citext extension | Functional index works with existing text columns, no migration needed |

**Installation:**
No new packages needed - all dependencies already installed or built into Node.js runtime.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── api/
│   └── webhooks/
│       └── contacts/
│           └── route.ts           # Webhook endpoint (POST)
components/
├── send/
│   ├── contact-selector.tsx       # Add row selection
│   └── send-form.tsx              # Support batch mode
└── settings/
    └── integrations-section.tsx   # API key management
lib/
├── actions/
│   ├── send.ts                    # Add batchSendReviewRequest
│   └── business.ts                # Add generateApiKey, regenerateApiKey
├── data/
│   └── send-logs.ts               # Add getResendReadyContacts query
└── rate-limit.ts                  # Add webhookRatelimit
```

### Pattern 1: Batch Server Action with Individual Validation
**What:** Process multiple contacts in a single server action, validate each individually, return aggregated results
**When to use:** When each item needs independent validation rules (cooldown, opt-out) but quota is shared
**Example:**
```typescript
// Source: Next.js 15 server actions best practices + existing send.ts pattern
export async function batchSendReviewRequest(
  _prevState: BatchSendActionState | null,
  formData: FormData
): Promise<BatchSendActionState> {
  // 1. Auth + rate limit (same as single send)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Parse contact IDs (max 25)
  const parsed = batchSendSchema.safeParse({
    contactIds: JSON.parse(formData.get('contactIds') as string),
    templateId: formData.get('templateId') || undefined,
  })

  // 3. Get business + validate monthly quota
  const { data: business } = await supabase
    .from('businesses')
    .select('id, tier, ...')
    .eq('user_id', user.id)
    .single()

  const monthlyLimit = MONTHLY_SEND_LIMITS[business.tier]
  const { count: monthlyCount } = await getMonthlyCount(supabase, business.id)
  const remainingQuota = monthlyLimit - monthlyCount

  if (parsed.data.contactIds.length > remainingQuota) {
    return {
      error: `Not enough quota. ${remainingQuota} sends remaining this month.`
    }
  }

  // 4. Fetch all contacts with validation filters in SQL
  const cooldownDate = new Date()
  cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS)

  const { data: eligibleContacts } = await supabase
    .from('contacts')
    .select('id, name, email, last_sent_at, send_count, status, opted_out')
    .eq('business_id', business.id)
    .in('id', parsed.data.contactIds)
    .eq('status', 'active')
    .eq('opted_out', false)
    .or(`last_sent_at.is.null,last_sent_at.lt.${cooldownDate.toISOString()}`)

  // 5. Send to each eligible contact (same logic as single send)
  const results = { sent: 0, skipped: 0, failed: 0 }

  for (const contact of eligibleContacts) {
    try {
      // Create send_log, send email, update contact
      // (reuse logic from sendReviewRequest)
      results.sent++
    } catch (err) {
      results.failed++
    }
  }

  // 6. Track skipped contacts
  results.skipped = parsed.data.contactIds.length - eligibleContacts.length

  return { success: true, data: results }
}
```

### Pattern 2: API Key Generation and Storage
**What:** Generate cryptographically secure API keys, hash before storage, verify on requests
**When to use:** For webhook authentication, integrations, service-to-service auth
**Example:**
```typescript
// Source: Node.js crypto documentation + webhook security best practices
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

// Generate a new API key
export async function generateApiKey() {
  // 1. Generate random token (32 bytes = 64 hex chars)
  const key = randomBytes(32).toString('hex')

  // 2. Hash for storage (scrypt with random salt)
  const salt = randomBytes(16).toString('hex')
  const hash = await scryptAsync(key, salt, 64) as Buffer

  // 3. Return key to show user (ONLY TIME IT'S VISIBLE)
  // Store: api_key_hash = salt + hash
  return {
    key: `sk_${key}`, // Prefix for identification
    hash: `${salt}:${hash.toString('hex')}`
  }
}

// Verify API key from request
export async function verifyApiKey(
  providedKey: string,
  storedHash: string
): Promise<boolean> {
  // 1. Parse stored hash
  const [salt, hash] = storedHash.split(':')

  // 2. Hash provided key with same salt
  const providedKeyClean = providedKey.replace(/^sk_/, '')
  const computedHash = await scryptAsync(providedKeyClean, salt, 64) as Buffer

  // 3. Timing-safe comparison
  try {
    return timingSafeEqual(
      Buffer.from(hash, 'hex'),
      computedHash
    )
  } catch {
    return false
  }
}
```

### Pattern 3: Webhook with API Key Auth + Rate Limiting
**What:** Secure webhook endpoint with header-based API key auth and per-key rate limiting
**When to use:** For third-party integrations (Zapier, Make, n8n)
**Example:**
```typescript
// Source: Next.js Route Handler docs + Upstash rate limiting patterns
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const webhookRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'ratelimit:webhook',
})

export async function POST(request: Request) {
  // 1. Extract API key from header
  const headersList = await headers()
  const apiKey = headersList.get('x-api-key')

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  // 2. Rate limit by API key (60/min)
  const { success } = await webhookRatelimit.limit(apiKey)

  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // 3. Verify API key and get business_id
  const business = await verifyApiKeyAndGetBusiness(apiKey)

  if (!business) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // 4. Parse and validate payload
  const payload = await request.json()
  const parsed = webhookContactSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({
      error: 'Invalid payload',
      details: parsed.error.flatten()
    }, { status: 400 })
  }

  // 5. Create or update contact (deduplicate by email)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('contacts')
    .upsert(
      {
        business_id: business.id,
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone,
      },
      {
        onConflict: 'business_id,email',
        ignoreDuplicates: false
      }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, contact: data }, { status: 200 })
}
```

### Pattern 4: TanStack Table Row Selection
**What:** Use built-in row selection hooks for multi-select checkboxes with select-all functionality
**When to use:** For batch operations in data tables
**Example:**
```typescript
// Source: TanStack Table v8 Row Selection Guide
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { useState } from 'react'

function ContactSelector() {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const table = useReactTable({
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  })

  // Get selected contacts (limit to 25)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const isOverLimit = selectedCount > 25

  return (
    <div>
      {/* Select all checkbox in header */}
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onCheckedChange={table.getToggleAllRowsSelectedHandler()}
      />

      {/* Row checkboxes */}
      {table.getRowModel().rows.map(row => (
        <Checkbox
          key={row.id}
          checked={row.getIsSelected()}
          disabled={!row.getIsSelected() && isOverLimit}
          onCheckedChange={row.getToggleSelectedHandler()}
        />
      ))}

      {/* Selection summary */}
      <div>
        {selectedCount} selected {isOverLimit && '(max 25)'}
      </div>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Multiple individual server action calls in a loop:** Creates race conditions, no transaction semantics, poor performance. Use a single batch action instead.
- **Storing plaintext API keys:** Security vulnerability. Always hash with scrypt/pbkdf2 before storage.
- **Hardcoded salts for hashing:** Eliminates protection against rainbow tables. Generate random salt per key.
- **String comparison for hash verification:** Vulnerable to timing attacks. Use crypto.timingSafeEqual.
- **Rate limiting after authentication:** Allows attackers to exhaust database connections. Rate limit before expensive operations.
- **Case-sensitive email deduplication:** Causes duplicate contacts (user@ex.com vs USER@ex.com). Normalize to lowercase or use functional index.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secure random token generation | Math.random(), Date.now() | crypto.randomBytes(32) | Math.random is not cryptographically secure, predictable patterns |
| API key hashing | SHA256, MD5 | crypto.scrypt or crypto.pbkdf2 | Fast hashes are brute-forceable, scrypt/pbkdf2 are intentionally slow |
| Hash comparison | `a === b` | crypto.timingSafeEqual | String comparison leaks timing info, enables timing attacks |
| Rate limiting in serverless | Custom Redis scripts | @upstash/ratelimit | Handles sliding window, caching, multi-region correctly |
| Email normalization | Manual .trim().toLowerCase() | Functional index or citext | Database enforces uniqueness consistently, handles edge cases |
| Multi-select UI state | Custom checkbox logic | TanStack Table row selection | Handles select-all, indeterminate state, filtered selections correctly |

**Key insight:** Security primitives (random generation, hashing, comparison) have subtle edge cases that Node.js crypto module solves correctly. Don't reimplement these—you'll get it wrong.

## Common Pitfalls

### Pitfall 1: Insufficient API Key Entropy
**What goes wrong:** Generated API keys are too short or use weak randomness, making them guessable
**Why it happens:** Developers use Date.now() or Math.random() or generate short keys (16 chars)
**How to avoid:** Always use crypto.randomBytes with at least 32 bytes (64 hex chars). Prefix with identifier like "sk_" to make key type obvious
**Warning signs:** Keys shorter than 32 characters, patterns in generated keys, using Math.random

### Pitfall 2: Showing Validation Errors Without Batch Context
**What goes wrong:** User tries to send to 20 contacts, 3 fail validation, error message says "Contact on cooldown" without context
**Why it happens:** Reusing single-send error messages for batch operations
**How to avoid:** Return structured results: `{ sent: 17, skipped: 3, failed: 0, details: [...] }`. Show summary first, details on expand
**Warning signs:** Confused user reports like "it said error but some emails sent"

### Pitfall 3: Race Condition in Quota Checking
**What goes wrong:** Check quota (5 remaining), send batch of 10, some sends succeed before quota exhausted
**Why it happens:** Checking quota before loop instead of enforcing in database transaction
**How to avoid:** Validate full batch fits quota BEFORE starting any sends. If quota = 5 and batch = 10, reject entire batch immediately
**Warning signs:** Monthly quota exceeded by small amounts, users report "sent more than my limit"

### Pitfall 4: Case-Sensitive Email Deduplication
**What goes wrong:** Webhook creates duplicate contacts: user@example.com and USER@example.com treated as different
**Why it happens:** PostgreSQL text comparison is case-sensitive by default
**How to avoid:** Normalize email to lowercase in application code before insert/upsert: `email.toLowerCase()`. Unique constraint on (business_id, email) will catch duplicates
**Warning signs:** Duplicate contact reports, same email with different casing in database

### Pitfall 5: Missing Rate Limit Headers
**What goes wrong:** Webhook returns 429 but doesn't tell integration how long to wait or how many requests remain
**Why it happens:** Forgetting to include X-RateLimit-* headers in response
**How to avoid:** Always return X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers. Upstash ratelimit returns these values
**Warning signs:** Integration retries immediately after 429, doesn't implement backoff

### Pitfall 6: No Idempotency for Webhook Contact Creation
**What goes wrong:** Network timeout causes integration to retry, creates duplicate contacts
**Why it happens:** Using INSERT instead of UPSERT for contact creation
**How to avoid:** Use Supabase upsert with onConflict: 'business_id,email'. This makes the operation idempotent—same payload multiple times produces same result
**Warning signs:** Duplicate contacts after integration timeouts/retries

## Code Examples

Verified patterns from official sources:

### Email Normalization Pattern
```typescript
// Source: Existing contacts table unique constraint + PostgreSQL best practices
// Normalize email to lowercase before database operations
const normalizedEmail = email.trim().toLowerCase()

await supabase
  .from('contacts')
  .upsert({
    business_id: businessId,
    email: normalizedEmail, // Always lowercase
    name,
    phone,
  }, {
    onConflict: 'business_id,email', // Existing unique constraint
    ignoreDuplicates: false, // Update existing record
  })
```

### Query Contacts Ready to Re-send
```typescript
// Source: Existing send.ts cooldown logic + SQL date arithmetic
import { COOLDOWN_DAYS } from '@/lib/constants/billing'

export async function getResendReadyContacts(
  supabase: SupabaseClient,
  businessId: string
) {
  // Calculate cooldown cutoff date
  const cooldownDate = new Date()
  cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS)

  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, email, last_sent_at, send_count')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .eq('opted_out', false)
    .not('last_sent_at', 'is', null) // Has been sent before
    .lt('last_sent_at', cooldownDate.toISOString()) // Cooldown expired
    .order('last_sent_at', { ascending: true }) // Oldest first

  return { data: data || [], error }
}
```

### Batch Send Results Summary Component
```typescript
// Source: React discriminated union pattern for state management
type BatchSendState =
  | { status: 'idle' }
  | { status: 'sending'; progress: number }
  | { status: 'complete'; results: { sent: number; skipped: number; failed: number } }
  | { status: 'error'; error: string }

function BatchSendResults({ state }: { state: BatchSendState }) {
  switch (state.status) {
    case 'idle':
      return null

    case 'sending':
      return <div>Sending... {state.progress}%</div>

    case 'complete':
      return (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Batch Send Complete</h3>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Sent:</span>
              <span className="font-medium text-green-600">
                {state.results.sent}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Skipped:</span>
              <span className="text-muted-foreground">
                {state.results.skipped}
              </span>
            </div>
            {state.results.failed > 0 && (
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="font-medium text-red-600">
                  {state.results.failed}
                </span>
              </div>
            )}
          </div>
        </div>
      )

    case 'error':
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )
  }
}
```

### Upstash Rate Limiter Configuration
```typescript
// Source: Upstash Redis rate limiting documentation + existing rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Webhook rate limit: 60 requests per minute per API key
export const webhookRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'ratelimit:webhook',
  analytics: true, // Track usage in Upstash dashboard
})

// Usage in webhook route
export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key')!

  const { success, limit, remaining, reset } = await webhookRatelimit.limit(apiKey)

  if (!success) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    )
  }

  // Process webhook...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| bcrypt for hashing | crypto.scrypt (built-in) | Node.js v10+ | No native dependencies, same security, simpler deployment |
| Fixed window rate limiting | Sliding window algorithm | Upstash v2+ | More accurate limits, prevents burst at window boundaries |
| Individual API calls in loop | Batch server actions | Next.js 15 App Router | Transaction semantics, better error handling, single round trip |
| Manual row selection state | TanStack Table hooks | TanStack Table v8 | Handles select-all, indeterminate, filtered selections automatically |
| MD5/SHA1 for hashing | scrypt/pbkdf2/Argon2 | NIST 2010s | Resistant to GPU brute-force, intentionally slow |

**Deprecated/outdated:**
- **Pages Router API routes with bodyParser config:** App Router handles this automatically, no config needed
- **bcrypt package:** crypto.scrypt provides same security without native dependencies
- **Manual email normalization in RLS policies:** Do it in application layer for consistency

## Open Questions

Things that couldn't be fully resolved:

1. **Should batch send bypass the 10/min rate limit?**
   - What we know: Current rate limit is 10 individual sends per minute per user. Batch is a different use case.
   - What's unclear: If batch counts as 1 operation or N operations against rate limit.
   - Recommendation: Make batch exempt from the 10/min limit since it has its own controls (25 contact cap, quota validation). Document this in batchSendReviewRequest action.

2. **How to handle partial batch failures?**
   - What we know: If 5 of 20 sends fail due to Resend API errors, we need clear feedback.
   - What's unclear: Should we roll back successful sends or commit partial success?
   - Recommendation: Commit partial success (return results: {sent: 15, failed: 5}). Each send creates a send_log record independently. Don't try to undo successful sends—email already sent.

3. **Should webhook create archived contacts or only active?**
   - What we know: Contacts table has status: 'active' | 'archived'. Default is 'active'.
   - What's unclear: If webhook should allow specifying status or always create as active.
   - Recommendation: Always create as 'active'. Archiving is a UI action, not appropriate for webhook automation. Keep it simple.

## Sources

### Primary (HIGH confidence)
- Node.js v25 Crypto Documentation - crypto.randomBytes, crypto.scrypt, crypto.timingSafeEqual
- Next.js 15 Route Handlers Documentation - webhook patterns, POST handling, headers
- [Upstash Redis Rate Limiting Overview](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) - algorithms, serverless support
- [Upstash ratelimit-js GitHub](https://github.com/upstash/ratelimit-js) - API documentation, identifier patterns
- [Rate Limiting Next.js API Routes using Upstash Redis](https://upstash.com/blog/nextjs-ratelimiting) - complete implementation example
- [TanStack Table Row Selection Guide](https://tanstack.com/table/v8/docs/guide/row-selection) - APIs, documentation
- Existing codebase: lib/rate-limit.ts, lib/actions/send.ts, app/api/webhooks/stripe/route.ts

### Secondary (MEDIUM confidence)
- [Next.js 15 Server Actions: Complete Guide (2026)](https://medium.com/@saad.minhas.codes/next-js-15-server-actions-complete-guide-with-real-examples-2026-6320fbfa01c3) - batch operation patterns
- [API Authentication Best Practices in 2026](https://dev.to/apiverve/api-authentication-best-practices-in-2026-3k4a) - API key best practices
- [Case insensitive UNIQUE constraints in Postgres](http://shuber.io/case-insensitive-unique-constraints-in-postgres/) - email deduplication
- [PostgreSQL Case-Insensitive Unique Constraint Gist](https://gist.github.com/odlp/08a42dbfacef5dbfeacb6e699c867c34) - functional index pattern
- [Supabase RPC Transactions Discussion](https://github.com/orgs/supabase/discussions/526) - transaction patterns
- [React TypeScript State Patterns](https://blog.logrocket.com/react-typescript-10-patterns-writing-better-code/) - discriminated unions for batch results

### Tertiary (LOW confidence)
- [WebSearch: bcrypt vs crypto comparison](https://dev.to/stephepush/password-security-a-bit-deeper-dive-into-hashes-salts-bcrypt-and-nodes-crypto-module-7l7) - hashing algorithm tradeoffs
- [WebSearch: Next.js Server Actions Best Practice](https://medium.com/@lior_amsalem/nextjs-15-actions-best-practice-bf5cc023301e) - concurrent execution patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use (phases 1-10), proven patterns
- Architecture: HIGH - Extending existing patterns (send.ts, rate-limit.ts, stripe webhook)
- Pitfalls: HIGH - Based on official security docs (Node.js crypto, Upstash) + existing codebase constraints

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stable stack, mature libraries)
