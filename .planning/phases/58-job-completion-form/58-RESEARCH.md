# Phase 58: Job Completion Form - Research

**Researched:** 2026-02-27
**Domain:** Public token-secured form, service-role Supabase operations, mobile-optimized UI, campaign auto-enrollment from unauthenticated context
**Confidence:** HIGH

## Summary

Phase 58 creates a public, mobile-optimized "Complete Job" form at `/complete/[token]` that technicians use on-site without an AvisLoop account. Each business gets a unique, non-guessable token that maps to its business ID. The form collects customer name, phone/email, and service type -- then creates a customer record (or links existing), creates a completed job, and auto-enrolls in the matching campaign.

The codebase already has a proven pattern for this exact architecture: the review funnel at `/r/[token]`. That system uses HMAC-signed tokens, a public Server Component page with `createServiceRoleClient()` (bypasses RLS), and a client component for the interactive form. Phase 58 follows the identical pattern but with a simpler token scheme (persistent per-business token vs. per-send HMAC token) since the form URL is shared once and reused indefinitely.

The critical architectural insight is that the existing `createJob()` server action in `lib/actions/job.ts` already handles inline customer creation (lines 69-108), customer deduplication by email (lines 71-76), job insertion, and campaign enrollment -- but it requires authentication via `getActiveBusiness()`. Phase 58 needs a parallel code path that accepts an explicit `businessId` (resolved from token) and uses the service-role client instead of the authenticated client.

**Primary recommendation:** Add a `form_token` column to the `businesses` table (generated on demand, not at creation), create a public route at `app/complete/[token]/page.tsx` using the review funnel's Server Component + service-role client pattern, and build a dedicated server-side API route or server action that performs the job creation + enrollment logic using the service-role client with explicit businessId.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `crypto.randomBytes` | Node.js built-in | Generate secure, non-guessable form tokens | Already used in `lib/review/token.ts`; crypto-strength randomness |
| `@supabase/supabase-js` (service role) | latest (installed) | Bypass RLS for public form writes | Already used in `lib/supabase/service-role.ts` and `app/r/[token]/page.tsx` |
| `zod` | ^4.3.6 (installed) | Form validation schema | Already used throughout for all validation |
| `react-hook-form` + `@hookform/resolvers` | installed | Client-side form state and validation | Already used in existing forms; provides better UX than raw HTML validation |
| `libphonenumber-js` | ^1.12.36 (installed) | Phone validation (E.164) | Already used via `lib/utils/phone.ts` |
| `@upstash/ratelimit` | ^2.0.8 (installed) | Rate limit public form submissions | Already used in `lib/rate-limit.ts` for public endpoints |
| `@phosphor-icons/react` | ^2.1.10 (installed) | Icons for form UI | Project standard icon library |
| `sonner` | ^2.0.7 (installed) | Toast notifications for success/error | Already used throughout the app |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next-themes` | ^0.4.6 (installed) | Theme support for public form | Public page should respect system theme preference |
| `tailwind-merge` + `clsx` | installed | Conditional class merging | Already used in all components |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Persistent DB token | HMAC-signed token (like review funnel) | HMAC tokens expire and encode data; form URL needs to be permanent and shareable. DB token is correct. |
| `form_token` column on businesses | Separate `form_tokens` table | Overkill -- one token per business, no history needed. Column is simpler. |
| Server Action for form submit | API Route Handler (POST) | Server Actions require a Next.js client; API route works from any client. However, since the form is a Next.js page, Server Action via `useActionState` is fine. But service-role operations in server actions need care -- use a dedicated function, not the auth-gated `createJob()`. |
| `crypto.randomBytes(32)` | `crypto.randomUUID()` | UUID is predictable format (8-4-4-4-12); randomBytes is more entropy per character. Use `randomBytes(24).toString('base64url')` for a 32-char URL-safe token. |

**Installation:**
No new packages needed. All dependencies already installed.

## Architecture Patterns

### Recommended File Structure

```
supabase/
  migrations/
    20260227_add_form_token.sql          # Add form_token column + unique index
lib/
  actions/
    form-token.ts                         # generateFormToken(), regenerateFormToken()
    public-job.ts                         # createPublicJob() -- service-role job creation
  validations/
    public-job.ts                         # Zod schema for public form (name, email/phone, service type)
app/
  complete/
    [token]/
      page.tsx                            # Server Component: resolve token -> business, render form
      job-completion-form.tsx             # Client Component: interactive form UI
  api/
    complete/
      route.ts                           # POST handler for form submission (service-role, rate-limited)
components/
  settings/
    form-link-section.tsx                # Settings UI for generating/copying/regenerating form URL
```

### Pattern 1: Persistent Business Token (DB Column)

**What:** Each business has an optional `form_token` TEXT column. Generated on first request (lazy), stored permanently. Can be regenerated (invalidates old URL).

**When to use:** For any feature that needs a permanent, shareable, per-business URL.

**Why not HMAC:** The review funnel uses HMAC tokens because each token encodes specific data (customer ID, enrollment ID) and expires after 30 days. The job completion form URL must be permanent -- printed on cards, bookmarked by technicians, shared in Slack. A DB-stored token is correct.

**Example:**
```typescript
// lib/actions/form-token.ts
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/data/active-business'

export async function generateFormToken(): Promise<{ token: string } | { error: string }> {
  const business = await getActiveBusiness()
  if (!business) return { error: 'Business not found' }

  // Generate 24 random bytes -> 32 char base64url string
  const token = randomBytes(24).toString('base64url')

  const supabase = await createClient()
  const { error } = await supabase
    .from('businesses')
    .update({ form_token: token })
    .eq('id', business.id)

  if (error) return { error: 'Failed to generate token' }
  return { token }
}
```

### Pattern 2: Public Page with Service-Role Client (Existing Pattern)

**What:** Server Component resolves token to business using service-role client, renders form.

**When to use:** Any public page that needs to read/write business data without user authentication.

**Precedent:** `app/r/[token]/page.tsx` already does this exact pattern.

**Example:**
```typescript
// app/complete/[token]/page.tsx
import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { JobCompletionForm } from './job-completion-form'

export default async function CompletePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const supabase = createServiceRoleClient()

  // Resolve business from form_token
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, service_types_enabled, custom_service_names')
    .eq('form_token', token)
    .single()

  if (!business) notFound()

  return (
    <JobCompletionForm
      businessId={business.id}
      businessName={business.name}
      enabledServiceTypes={business.service_types_enabled}
      customServiceNames={business.custom_service_names}
      token={token}
    />
  )
}
```

### Pattern 3: API Route for Public Form Submission (Not Server Action)

**What:** Use an API Route Handler (POST `/api/complete`) instead of a Server Action for the form submission.

**Why not a Server Action:** Server Actions in the `'use server'` context use `createClient()` which creates an auth-scoped Supabase client. The public form has no auth session, so `createClient()` would fail or return an anonymous client that can't write to RLS-protected tables. An API Route Handler with `createServiceRoleClient()` is the correct pattern -- identical to how `app/api/review/rate/route.ts` works.

**Example:**
```typescript
// app/api/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkPublicRateLimit } from '@/lib/rate-limit'
import { publicJobSchema } from '@/lib/validations/public-job'
import { parseAndValidatePhone } from '@/lib/utils/phone'

export async function POST(req: NextRequest) {
  // 1. Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateLimitResult = await checkPublicRateLimit(ip)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // 2. Validate body
  const body = await req.json()
  const parsed = publicJobSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  // 3. Resolve business from token
  const supabase = createServiceRoleClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id, service_types_enabled, service_type_timing, review_cooldown_days')
    .eq('form_token', parsed.data.token)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Invalid form' }, { status: 404 })
  }

  // 4. Create/link customer, create job, enroll in campaign
  // ... (service-role operations)
}
```

### Pattern 4: Reusing Job Creation + Enrollment Logic

**What:** Extract the core logic from `createJob()` and `enrollJobInCampaign()` into service-role-compatible functions.

**Key insight:** The existing `enrollJobInCampaign()` in `lib/actions/enrollment.ts` uses `createClient()` (auth-scoped). For the public form, we need a version that accepts a Supabase client as a parameter or uses the service-role client directly.

**Approach:** Create a `createPublicJob()` function in `lib/actions/public-job.ts` that:
1. Accepts explicit `businessId` (from token resolution)
2. Uses `createServiceRoleClient()` for all DB operations
3. Duplicates the customer-create-or-link logic from `createJob()` lines 69-108
4. Duplicates the enrollment logic from `enrollJobInCampaign()` but with service-role client
5. Does NOT call `revalidatePath()` (no auth context, and the dashboard user will see updates on next load)

**Why duplicate instead of refactor:** The existing functions are deeply coupled to the auth context (`getActiveBusiness()`, `createClient()`). Refactoring them to accept an optional client parameter would be a larger change that risks breaking the authenticated flow. A dedicated public function is safer and more maintainable.

### Anti-Patterns to Avoid

- **Using `createClient()` in public routes:** The auth-scoped client returns an anonymous client with no user session. RLS policies will block all writes. Use `createServiceRoleClient()`.
- **Exposing businessId in the URL:** The URL should contain only the opaque token, not the business UUID. The token-to-business mapping happens server-side.
- **Using Server Actions for public form submission:** Server Actions inherit the page's auth context. For unauthenticated pages, this means no session. Use an API Route Handler instead.
- **Sharing form tokens across businesses:** Each business gets its own unique token. Never reuse tokens.
- **Skipping rate limiting on public endpoints:** The form is unauthenticated and internet-facing. Rate limiting is mandatory.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token generation | Custom algorithm | `crypto.randomBytes(24).toString('base64url')` | Crypto-strength randomness, URL-safe encoding, already used in codebase |
| Phone validation | Regex | `parseAndValidatePhone()` from `lib/utils/phone.ts` | Already handles E.164, country codes, edge cases |
| Rate limiting | Custom middleware | `checkPublicRateLimit()` from `lib/rate-limit.ts` | Already configured with Upstash Redis, handles dev bypass |
| Form validation | Custom checks | Zod schema + `@hookform/resolvers` | Already the project standard, provides field-level errors |
| Customer deduplication | Custom logic | Follow `createJob()` lines 71-76 pattern | Already handles email-based dedup, case normalization |
| Campaign matching | Custom query | Follow `getActiveCampaignForJob()` pattern | Already handles service-type-specific + fallback-to-default logic |
| Service type select UI | Custom dropdown | Reuse `ServiceTypeSelect` component | Already handles enabled types, custom names, error states |

**Key insight:** The entire job-creation-with-enrollment pipeline already exists in `lib/actions/job.ts` and `lib/actions/enrollment.ts`. The public form just needs to execute the same logic with a service-role client instead of an auth-scoped client.

## Common Pitfalls

### Pitfall 1: Auth-Scoped Client in Public Route

**What goes wrong:** Using `createClient()` from `lib/supabase/server.ts` in a public (unauthenticated) page. The client gets created with no user session, and RLS policies block all writes to `customers`, `jobs`, and `campaign_enrollments`.

**Why it happens:** Developer copies the `createJob()` pattern which uses `createClient()`.

**How to avoid:** Always use `createServiceRoleClient()` for public page operations. The service-role client bypasses RLS entirely, so business scoping must be done explicitly in queries.

**Warning signs:** Supabase returns empty results or `42501` permission errors from the public form.

### Pitfall 2: Missing Business Scoping with Service-Role Client

**What goes wrong:** Service-role client bypasses RLS, so forgetting to scope queries to the resolved `businessId` could leak or corrupt cross-tenant data.

**Why it happens:** RLS normally handles scoping automatically. When bypassing RLS, the developer must scope manually.

**How to avoid:** Every query in the public job creation path must include `.eq('business_id', businessId)` explicitly. Add comments marking service-role operations.

**Warning signs:** Customer records appearing under the wrong business, or enrollment created for wrong campaign.

### Pitfall 3: Token Enumeration

**What goes wrong:** Short or predictable tokens allow attackers to guess valid form URLs and submit spam jobs.

**Why it happens:** Using UUIDs (predictable format) or short tokens.

**How to avoid:** Use `crypto.randomBytes(24).toString('base64url')` for 32 characters of crypto-random data. This gives 192 bits of entropy -- infeasible to enumerate.

**Warning signs:** Unexpected job submissions, spam customer records.

### Pitfall 4: Missing Rate Limiting on Public Endpoint

**What goes wrong:** An attacker submits thousands of form submissions, creating spam customers and jobs, potentially exhausting campaign send quotas.

**Why it happens:** Developer forgets to add rate limiting to the API route.

**How to avoid:** Use `checkPublicRateLimit()` at the top of the API route handler, identical to `app/api/review/rate/route.ts`.

**Warning signs:** Sudden spike in job/customer creation, abnormal send volumes.

### Pitfall 5: Middleware Blocking Public Route

**What goes wrong:** The middleware redirects `/complete/[token]` to `/login` because it's not in the allow-list of public routes.

**Why it happens:** The middleware protects APP_ROUTES (dashboard paths). If `/complete` is not excluded, unauthenticated users get redirected.

**How to avoid:** The middleware's matcher pattern in `middleware.ts` line 164 matches all routes. However, the protection logic only redirects unauthenticated users for paths in `APP_ROUTES` (line 118-126). Since `/complete` is NOT in `APP_ROUTES`, it will pass through the middleware without redirect. Verify this during implementation.

**Warning signs:** Form URL redirects to login page.

### Pitfall 6: Not Validating Service Type Against Business Settings

**What goes wrong:** The form allows submitting a service type the business hasn't enabled (e.g., submitting "roofing" when the business only does HVAC).

**Why it happens:** Developer validates against the global `SERVICE_TYPES` array instead of the business's `service_types_enabled`.

**How to avoid:** Fetch `service_types_enabled` from the business record during token resolution. Pass to the form component. Validate server-side against the business's enabled types, not the global list.

**Warning signs:** Jobs created with service types the business owner doesn't recognize.

### Pitfall 7: Enrollment Uses Auth-Scoped Campaign Query

**What goes wrong:** `getActiveCampaignForJob()` uses `createClient()` (auth-scoped). Calling it from the public form returns null (no auth = no results from RLS).

**Why it happens:** Developer reuses the existing campaign matching function.

**How to avoid:** Write a service-role version of the campaign query, or inline the query with `createServiceRoleClient()`.

**Warning signs:** Jobs created but never enrolled in campaigns from the public form.

## Code Examples

### Migration: Add form_token Column

```sql
-- Source: Based on existing business column patterns in migrations
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS form_token TEXT DEFAULT NULL;

-- Unique index for fast token lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_form_token
  ON public.businesses (form_token)
  WHERE form_token IS NOT NULL;

COMMENT ON COLUMN businesses.form_token IS 'Unique token for public job completion form URL. Generated on demand via Settings.';
```

### Validation Schema for Public Form

```typescript
// lib/validations/public-job.ts
import { z } from 'zod'
import { SERVICE_TYPES } from '@/lib/validations/job'

export const publicJobSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  customerName: z.string().min(1, 'Customer name is required').max(200),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  customerPhone: z.string().optional().or(z.literal('')),
  serviceType: z.enum(SERVICE_TYPES),
  notes: z.string().max(500).optional().or(z.literal('')),
}).refine(
  (data) => data.customerEmail || data.customerPhone,
  { message: 'Either email or phone is required', path: ['customerEmail'] }
)

export type PublicJobInput = z.infer<typeof publicJobSchema>
```

### Service-Role Job Creation

```typescript
// lib/actions/public-job.ts (key logic excerpt)
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { parseAndValidatePhone } from '@/lib/utils/phone'

export async function createPublicJob(input: {
  businessId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  serviceType: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient()

  // 1. Find or create customer (same logic as createJob lines 69-108)
  let customerId: string | null = null

  if (input.customerEmail) {
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', input.businessId)
      .eq('email', input.customerEmail.toLowerCase().trim())
      .single()

    if (existing) {
      customerId = existing.id
    }
  }

  if (!customerId) {
    const phoneResult = input.customerPhone
      ? parseAndValidatePhone(input.customerPhone)
      : null

    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        business_id: input.businessId,
        name: input.customerName.trim(),
        email: (input.customerEmail || '').toLowerCase().trim(),
        phone: phoneResult?.e164 || input.customerPhone || null,
        phone_status: phoneResult?.status || 'missing',
        status: 'active',
        opted_out: false,
        sms_consent_status: 'unknown',
        tags: [],
      })
      .select('id')
      .single()

    if (error || !newCustomer) return { success: false, error: 'Failed to create customer' }
    customerId = newCustomer.id
  }

  // 2. Create completed job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      business_id: input.businessId,
      customer_id: customerId,
      service_type: input.serviceType,
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: input.notes || null,
    })
    .select('id')
    .single()

  if (jobError || !job) return { success: false, error: 'Failed to create job' }

  // 3. Enroll in campaign (service-role version)
  // Find matching campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, campaign_touches(*)')
    .eq('business_id', input.businessId)
    .eq('status', 'active')
    .or(`service_type.eq.${input.serviceType},service_type.is.null`)
    .order('service_type', { ascending: false, nullsFirst: false })
    .limit(1)
    .single()

  if (campaign) {
    const touch1 = campaign.campaign_touches?.find((t: { touch_number: number }) => t.touch_number === 1)
    if (touch1) {
      // Get business timing settings
      const { data: biz } = await supabase
        .from('businesses')
        .select('service_type_timing')
        .eq('id', input.businessId)
        .single()

      const timing = (biz?.service_type_timing as Record<string, number> | null)
      const delayHours = timing?.[input.serviceType] || touch1.delay_hours
      const scheduledAt = new Date(Date.now() + delayHours * 60 * 60 * 1000)

      await supabase
        .from('campaign_enrollments')
        .insert({
          business_id: input.businessId,
          campaign_id: campaign.id,
          job_id: job.id,
          customer_id: customerId,
          status: 'active',
          current_touch: 1,
          touch_1_scheduled_at: scheduledAt.toISOString(),
          touch_1_status: 'pending',
          enrolled_at: new Date().toISOString(),
        })
    }
  }

  return { success: true }
}
```

### Mobile-Optimized Form Component (Skeleton)

```tsx
// app/complete/[token]/job-completion-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Touch-friendly: min-h-[44px] on all interactive elements
// Large text: text-lg for labels, text-base for inputs
// Minimal fields: name, email OR phone, service type
// Fast success: confetti/checkmark animation on submit
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Review token (HMAC, 30-day expiry) | Persistent DB token (no expiry) | Phase 58 | Form URL is permanent, shareable, printable |
| Auth-scoped job creation | Service-role job creation for public forms | Phase 58 | Enables unauthenticated technician access |
| Dashboard-only job creation | Public form + dashboard dual entry | Phase 58 | Technicians no longer need AvisLoop accounts |

**Important context:**
- The existing `enrollJobInCampaign()` includes conflict detection (active sequence, review cooldown). The public form should include this same logic to prevent duplicate enrollments.
- The `checkEnrollmentConflict()` function also uses `createClient()`. A service-role version is needed.

## Open Questions

1. **Should the form token be generated during onboarding or on demand?**
   - What we know: The business owner needs to share the URL with technicians. Generating during onboarding would make it immediately available but adds a step. Generating on demand (Settings page) keeps onboarding simple.
   - Recommendation: Generate on demand from Settings page. Add a "Job Completion Form" section in Settings where the owner can generate, copy, and regenerate the URL. This avoids cluttering onboarding and lets the owner decide when to start sharing.

2. **Should the public form support conflict resolution (Replace/Skip/Queue)?**
   - What we know: Dashboard users see conflict UI when enrolling a customer who already has an active sequence. Technicians won't understand this context.
   - Recommendation: For the public form, default to "skip" silently when a conflict exists. The job is still created, but enrollment is skipped. The business owner can resolve conflicts from the dashboard. Log the conflict on the job record (`enrollment_resolution: 'conflict'`) so the owner sees it.

3. **Should the public form URL include the business name for branding?**
   - What we know: `/complete/[token]` is functional but generic. Could do `/complete/[token]?b=ace-plumbing` for display purposes.
   - Recommendation: Keep the URL as `/complete/[token]`. Display the business name on the form itself (fetched server-side from the token). Adding the name to the URL leaks business identity and could be tampered with.

4. **How should "email OR phone required" validation work on the form?**
   - What we know: The existing AddJobSheet requires email always and phone optionally. The public form spec says "at least one of phone or email."
   - Recommendation: Both fields shown. At least one required. Use Zod `.refine()` for cross-field validation. On the form, show inline message "Please provide email or phone" when both are empty on submit.

## Sources

### Primary (HIGH confidence)
- `app/r/[token]/page.tsx` -- Existing public token-based page pattern (review funnel)
- `app/api/review/rate/route.ts` -- Existing public API route with rate limiting and service-role client
- `lib/review/token.ts` -- Token generation pattern using crypto.randomBytes
- `lib/supabase/service-role.ts` -- Service-role client for RLS bypass
- `lib/actions/job.ts` -- Existing job creation with inline customer creation (lines 69-108)
- `lib/actions/enrollment.ts` -- Campaign enrollment logic with conflict detection
- `lib/data/campaign.ts` -- Campaign matching logic (`getActiveCampaignForJob`)
- `lib/validations/job.ts` -- Service types, job statuses, Zod schemas
- `lib/utils/phone.ts` -- Phone validation (E.164)
- `lib/rate-limit.ts` -- Rate limiting infrastructure
- `middleware.ts` -- Route protection (verifies /complete is NOT in APP_ROUTES)
- `lib/types/database.ts` -- Business type (no form_token yet)
- `components/jobs/service-type-select.tsx` -- Reusable service type UI
- `components/jobs/add-job-sheet.tsx` -- Existing form patterns for job creation

### Secondary (MEDIUM confidence)
- Node.js `crypto.randomBytes` documentation -- 192 bits of entropy for 24-byte tokens
- Next.js App Router dynamic routes -- `params: Promise<{ token: string }>` pattern

### Tertiary (LOW confidence)
- None -- all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, patterns already proven
- Architecture: HIGH -- follows exact pattern of review funnel (app/r/[token])
- Token generation: HIGH -- crypto.randomBytes already used in review token system
- Public route handling: HIGH -- middleware verified to not block /complete routes
- Campaign enrollment: HIGH -- existing logic well-understood, needs service-role version
- Pitfalls: HIGH -- identified from direct codebase inspection of auth vs service-role patterns

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable -- all dependencies are internal codebase patterns)
