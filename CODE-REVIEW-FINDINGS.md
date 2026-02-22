# Code Review Findings: AvisLoop v2.5 (Phases 33-39)

**Reviewed:** 2026-02-22
**Scope:** Full codebase audit (304 files), Supabase schema (12 tables, 43 RLS policies), v2.5-specific changes (~80 files)
**Tools Used:** Supabase MCP, code-reviewer, integration checker, build verification
**Build Status:** `pnpm lint` PASS | `pnpm typecheck` PASS | `pnpm build` PASS

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 3 | Security vulnerabilities requiring immediate fix |
| High | 7 | Issues to fix before production deployment |
| Medium | 9 | Issues for next iteration |
| Low | 7 | Backlog / cleanup items |
| **Total** | **26** | |

---

## Critical Findings

### C-1: SMS Retry Cron Skips Authorization When CRON_SECRET Is Unset

**File:** `app/api/cron/process-sms-retries/route.ts:22-26`

The SMS retry cron endpoint conditionally checks `CRON_SECRET`. If `CRON_SECRET` is undefined, the condition `CRON_SECRET && authHeader !== ...` evaluates to `false`, allowing any unauthenticated request to trigger SMS retry processing. The other two cron endpoints (`process-campaign-touches`, `process-scheduled-sends`) correctly fail-closed with a 500 if `CRON_SECRET` is missing.

```typescript
// VULNERABLE: If CRON_SECRET is falsy, this check is SKIPPED
if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
```

**Impact:** Attacker can trigger SMS sends at will, consuming quotas and sending unauthorized messages.

**Fix:** Replicate the fail-closed pattern from the other cron endpoints:
```typescript
if (!cronSecret) {
  return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
}
if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

### C-2: Twilio Webhook Handlers Use Session-Based Supabase Client (No User Session)

**Files:**
- `app/api/webhooks/twilio/inbound/route.ts:16`
- `app/api/webhooks/twilio/status/route.ts:16`
- `app/api/cron/process-sms-retries/route.ts:2`

These handlers import `createClient` from `@/lib/supabase/server` (session-based, anon key). Twilio webhook requests have no user session/cookies. This means the Supabase client operates with anonymous RLS permissions. If RLS blocks anonymous writes, handlers silently fail (including STOP keyword processing for TCPA compliance). The Resend/Stripe webhooks correctly use service-role client.

**Impact:** Webhook handlers may silently fail to process opt-outs and delivery status updates.

**Fix:** Change all three files to use `createServiceRoleClient` from `@/lib/supabase/service-role`.

---

### C-3: Review Token Is Forgeable (No HMAC Signature)

**File:** `lib/review/token.ts:26-46, 60-102`

The review token is base64url encoding of `customerId:businessId:enrollmentId:timestamp:randomHex`. While it includes 128 bits of randomness, there is no HMAC signature. If an attacker knows valid UUIDs, they can forge tokens because `parseReviewToken` only checks structure and expiration.

**Impact:** An attacker with customer/business UUIDs can generate tokens to stop enrollments, submit fake feedback, or enumerate customers.

**Fix:** Add HMAC signature using a server-side secret:
```typescript
const hmac = crypto.createHmac('sha256', process.env.REVIEW_TOKEN_SECRET!)
  .update(payload).digest('hex')
```

---

## High Findings

### H-1: `customer_feedback` INSERT Policy Uses `WITH CHECK (true)`

**Source:** Supabase security advisor

The RLS INSERT policy on `customer_feedback` allows any anonymous or authenticated user to insert feedback rows for ANY business. Token validation happens in the API route, but RLS is the last line of defense.

**Fix:** Add business-scoped WITH CHECK clause or restrict to service-role-only inserts.

---

### H-2: No Rate Limiting on Public-Facing API Endpoints

**Files:** `app/api/review/rate/route.ts`, `app/api/feedback/route.ts`

Both are public-facing (no auth required, use review tokens). Neither has rate limiting. Attackers can flood these endpoints.

**Fix:** Add Upstash Redis-based rate limiting (infrastructure already exists in `lib/rate-limit.ts`).

---

### H-3: `findOrCreateCustomer` Accepts Arbitrary `businessId` Without Ownership Validation

**Files:** `lib/actions/customer.ts:38-90`, `lib/actions/contact.ts:30-82`

Both accept a `businessId` parameter without verifying the authenticated user owns that business. Relies entirely on RLS for protection.

**Fix:** Add explicit business ownership check before insert, as done in `createJob`.

---

### H-4: No `server-only` Import Guard on Service-Role Module

**File:** `lib/supabase/service-role.ts`

No `import 'server-only'` to prevent accidental bundling into client code. If a developer imports this in a client component, `SUPABASE_SERVICE_ROLE_KEY` would leak to the browser.

**Fix:** Add `import 'server-only'` to: `lib/supabase/service-role.ts`, `lib/stripe/client.ts`, `lib/sms/twilio.ts`, `lib/email/resend.ts`.

---

### H-5: Module-Level Service Role Client in API Routes

**Files:** `app/api/webhooks/resend/route.ts:28-31`, `app/api/review/rate/route.ts:7-10`, `app/api/feedback/route.ts:9-12`

These create Supabase service-role clients at module scope using non-null assertions. Crashes if env vars are unset. Also shares a single client across concurrent requests in serverless.

**Fix:** Move client creation inside the request handler function.

---

### H-6: Leaked Password Protection Disabled

**Source:** Supabase security advisor

Supabase Auth is not checking HaveIBeenPwned for compromised passwords.

**Fix:** Enable leaked password protection in Supabase Dashboard > Auth > Settings.

---

### H-7: Resend Webhook Client Uses Placeholder Key

**Files:** `app/api/webhooks/resend/route.ts:33`, `app/api/feedback/route.ts:14`

```typescript
const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')
```

Silent failures when env vars are misconfigured.

**Fix:** Check for API key at start of handler, return 500 if missing.

---

## Medium Findings

### M-1: Onboarding Step Count Mismatch

**Files:** `app/onboarding/page.tsx:50`, `components/onboarding/onboarding-wizard.tsx:22-26`

Server page clamps step to range 1-5, but wizard only defines 3 steps. Navigating to `?step=4` or `?step=5` renders a blank wizard body. Stale comments on lines 14-21 still describe a 5-step flow.

**Fix:** Change clamp to `Math.min(Math.max(1, stepParam), 3)` and update comments.

---

### M-2: Status Badge WCAG AA Contrast Failures (Phase 34 Gap)

**File:** `app/globals.css` (CSS variable values)

Light mode failures:
- Delivered: 2.91:1 (needs 4.5:1)
- Failed: 4.33:1
- Reviewed: 4.15:1

Dark mode failures:
- Clicked: 3.92:1
- Failed: 3.32:1

**Fix:** Adjust 5 CSS variable values in `app/globals.css` for the `--status-*` tokens.

---

### M-3: `send_count` Race Condition in Scheduled Sends

**File:** `app/api/cron/process-scheduled-sends/route.ts:270-276`

Uses read-then-write pattern for `send_count`. The campaign touches handler correctly uses atomic `increment_customer_send_count` RPC.

**Fix:** Use the same `increment_customer_send_count` RPC.

---

### M-4: Auth Callback Open Redirect (Partially Mitigated)

**File:** `app/auth/callback/route.ts:10-11`

Blocks `//evil.com` but not all URL manipulation variants.

**Fix:** Use `new URL(next, origin)` and verify host matches expected domain.

---

### M-5: No Rate Limiting on Auth Server Actions

**File:** `lib/actions/auth.ts`

Sign-up, sign-in, password reset have no application-layer rate limiting. Supabase Auth has its own limits, but defense-in-depth is missing.

**Fix:** Add per-IP/per-email rate limiter using existing Upstash infrastructure.

---

### M-6: `updateCustomer` Relies Solely on RLS Without Application-Level Business Check

**File:** `lib/actions/customer.ts:264-274`

Update query filters only by `customerId` without `.eq('business_id', business.id)`. Other functions like `deleteJob` correctly include business_id filtering.

**Fix:** Add `.eq('business_id', business.id)` for defense-in-depth.

---

### M-7: In-Memory Rate Limiting on Webhooks Ineffective in Serverless

**Files:** `app/api/webhooks/stripe/route.ts:9-33`, `app/api/webhooks/resend/route.ts:6-25`

In-memory Maps reset on each cold start. Multiple instances don't share state.

**Fix:** Use Upstash Redis-based rate limiting.

---

### M-8: Missing WITH CHECK on UPDATE Policies

**Source:** RLS policy audit

Tables `customers`, `scheduled_sends`, `customer_feedback` have UPDATE policies without WITH CHECK clauses. This means a user could potentially update the `business_id` column on a row they own to transfer it to another business.

**Fix:** Add `WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))` to UPDATE policies.

---

### M-9: `send_logs` Missing DELETE Policy

**Source:** RLS policy audit

No DELETE policy on `send_logs` table. This may be intentional (audit trail should never be deleted), but should be documented.

**Fix:** Document as intentional OR add a delete policy restricted to business owners.

---

## Low Findings

### L-1: 6 Unindexed Foreign Keys

**Source:** Supabase performance advisor

Missing indexes on: `businesses.fk_default_template`, `campaign_enrollments.campaign_id`, `customer_feedback.resolved_by`, `customers.sms_consent_captured_by`, `scheduled_sends.template_id`, `send_logs.template_id`.

**Fix:** Create indexes. Low urgency pre-production but should be added before significant data volume.

---

### L-2: `--surface` CSS Token Defined But Never Used

**Files:** `app/globals.css`, `tailwind.config.ts`

The `--surface` / `bg-surface` token is defined but has zero component usage.

**Fix:** Either use it or remove the dead definition.

---

### L-3: `send_logs` Dual FK to Customers (`contact_id` + `customer_id`)

**Source:** Schema review

Legacy artifact from contacts-to-customers rename. Both columns reference `customers.id`.

**Fix:** Create migration to drop `contact_id` column and update any remaining references.

---

### L-4: Error Messages May Leak Internal Details

**Files:** Multiple server actions (e.g., `lib/actions/customer.ts:186`)

Some actions return raw Supabase error messages to the client.

**Fix:** Map to generic user-facing messages; log details server-side only.

---

### L-5: `deleteAccount` Has No Re-authentication Guard

**File:** `lib/actions/auth.ts:147-180`

Permanently deletes all data without requiring password confirmation.

**Fix:** Require current password as confirmation parameter.

---

### L-6: No Security Headers in `next.config.ts`

**File:** `next.config.ts`

Missing Content-Security-Policy, X-Frame-Options, etc. Vercel may add some defaults.

**Fix:** Add security headers configuration before production deployment.

---

### L-7: Review Token Logging Includes Customer/Business IDs

**File:** `app/api/review/rate/route.ts:76-82`

Logs customer and business UUIDs which could be quasi-identifiers.

**Fix:** Log shortened/hashed IDs or remove in production.

---

## Integration Check Results (Cross-Phase Wiring)

| Verification | Status | Notes |
|-------------|--------|-------|
| Token Chain (CSS -> Tailwind -> Components) | PASS | All 13 semantic tokens properly chained |
| Navigation Consistency (Sidebar + Bottom Nav) | PASS | 6 sidebar + 4 bottom-nav, /send redirects correctly |
| QuickSendModal Integration | PASS | 5 consumers, prefilledCustomer flows correctly |
| Onboarding Flow | FAIL | Step count mismatch (see M-1) |
| Dashboard Data Flow | PASS | getRecentCampaignEvents -> PipelineSummary -> Component |
| Auth Form Consistency | PASS | All 4 forms have noValidate, aria-invalid, role="alert" |
| Campaign Edit Flow | PASS | Sheet-based edit, shouldDirty for touches |
| Service Filter Scoping | PASS | Full prop chain server -> components |
| Dead Code Check | PASS | 0 orphaned imports from deleted send files |
| Cross-Phase Token Usage | PASS | Phase 35 tokens used by Phases 37, 38, 39 |

---

## Previously Known Gaps — Updated Status

| Gap | Original Status | Current Status |
|-----|----------------|----------------|
| Phase 34 — Status badge WCAG contrast | Open | **Still open** (M-2) |
| Phase 36 — forgot-password-form accessibility | Open | **Resolved** (all attributes present) |
| Phase 39 — Stale revalidatePath("/dashboard/send") | Open | **Resolved** (line 225 now shows `/campaigns`) |

---

## Positive Observations

The codebase demonstrates strong security practices:

1. All server actions use `getUser()` not `getSession()` (validates JWT server-side)
2. Middleware uses `getUser()` for route protection
3. Zod validation on all form inputs
4. No raw SQL — all queries parameterized via Supabase client
5. Webhook signature verification (Stripe, Resend, Twilio)
6. Service role key only in server-side files
7. Bulk operation limits enforced (100 customers, 25 resend, 50 scheduled)
8. Cross-tenant validation on job creation
9. `escapeLikePattern` used in search queries
10. HTML escaping in feedback notification emails
11. Idempotency keys on Resend email sends
12. Design system migration (Phases 33-35) is thorough with zero broken token chains
13. V2 philosophy compliance is strong — no V1 anti-patterns in main workflow
14. Campaign engine logic is correct end-to-end

---

## Recommended Fix Priority

### Before Production (Critical + High)
1. Fix C-1: SMS cron auth bypass
2. Fix C-2: Twilio webhook Supabase client
3. Fix C-3: HMAC on review tokens
4. Fix H-1: customer_feedback RLS
5. Fix H-2: Rate limit public endpoints
6. Fix H-4: Add `server-only` guards
7. Fix H-6: Enable leaked password protection

### Next Sprint (Medium)
8. Fix M-1: Onboarding step clamp
9. Fix M-2: Status badge contrast
10. Fix M-3: send_count race condition
11. Fix M-5: Auth rate limiting
12. Fix M-8: UPDATE policy WITH CHECK

### Backlog (Low)
13. Add missing FK indexes (L-1)
14. Clean up dual FK on send_logs (L-3)
15. Add security headers (L-6)
