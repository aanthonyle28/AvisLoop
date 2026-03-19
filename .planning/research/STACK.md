# Technology Stack: v4.0 Web Design Agency Pivot

**Project:** AvisLoop — v4.0 Web Design Agency Pivot
**Researched:** 2026-03-18
**Milestone Type:** Subsequent — adding web design CRM, client portal, ticket system to existing Next.js 15 + Supabase app
**Confidence:** HIGH (all new capabilities verified against official Supabase docs and current package versions)

---

## Executive Summary

**Three new capabilities needed; zero new npm packages required.**

The v4.0 pivot adds: (1) a client portal via unique URL, (2) a ticket/revision tracking system with monthly limits, (3) file/screenshot uploads for revision requests. Every one of these can be built using existing stack primitives. The token-secured public URL pattern already exists twice in the codebase (`/complete/[token]` and `/intake/[token]`). Supabase Storage is already provisioned but unused — activate it with a bucket and RLS policies. `react-dropzone` is already in `package.json` (v14.3.8) and used in three existing components. Stripe already handles billing.

The only structural additions are: a Supabase Storage bucket (`revision-attachments`, private), two new database tables (`tickets`, `ticket_attachments`), and billing logic for the $50 overage charge using Stripe's existing `stripe.invoiceItems.create()` + `stripe.invoices.create()` API.

---

## What Is Already in Place (Do NOT Re-Research or Re-Implement)

| Capability | Existing Implementation | Location |
|------------|------------------------|----------|
| Token-secured public URL (no auth) | DB token stored in `businesses.form_token`, resolved via service-role client | `/app/complete/[token]/page.tsx` |
| Second public token pattern | DB token stored in `businesses.intake_token` | `/app/intake/[token]/page.tsx` |
| HMAC token generation | `createHmac('sha256', secret)` with timing-safe comparison | `/lib/review/token.ts` |
| Drag-and-drop file input | `useDropzone` from `react-dropzone` v14.3.8 | 3 existing components |
| Service-role Supabase client (bypasses RLS) | `createServiceRoleClient()` | `/lib/supabase/service-role.ts` |
| Stripe billing + overage concepts | `stripe` v20.2.0, API version `2026-01-28.clover` | `/lib/stripe/client.ts` |
| Server actions with Zod validation | Pattern used throughout 22 `lib/actions/` files | `/lib/actions/` |

---

## New Capabilities Required

### 1. File Uploads (Revision Attachments)

**Decision: Supabase Storage with signed upload URLs**

Supabase Storage is already part of the project (same Supabase project, same `@supabase/supabase-js` client). No new service, no new credentials, no new SDK.

**Upload flow:**
1. Client selects file via `useDropzone` (already installed)
2. Client calls a Server Action: `createSignedUploadUrl(ticketId, filename)`
3. Server Action validates ownership, generates signed URL via `supabase.storage.from('revision-attachments').createSignedUploadUrl(path)` (expires in 2 hours — sufficient for form session)
4. Client uploads directly to Supabase from browser using `supabase.storage.from('revision-attachments').uploadToSignedUrl(path, token, file)`
5. Server Action stores the resulting `storage_path` in `ticket_attachments` table

**Why signed URLs over Server Action streaming:** Next.js Server Actions have a default 1MB body limit. Signed URLs let the browser upload directly to Supabase Storage, bypassing Next.js entirely. This is the officially recommended pattern for Supabase + Next.js file uploads. (Source: [Supabase signed upload URL docs](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl), [official Next.js + Supabase storage guide](https://supalaunch.com/blog/file-upload-nextjs-supabase))

**Bucket configuration:**
- Name: `revision-attachments`
- Visibility: Private (requires signed URL to read — clients cannot guess other clients' file URLs)
- Per-file size limit: 10MB (configured at bucket level; global Supabase limit is 50MB on free tier, 500GB on Pro)
- Allowed content types: `image/*`, `application/pdf` (screenshots + PDFs are the revision use case)

**Storage path structure:**
```
revision-attachments/
  {business_id}/
    {ticket_id}/
      {uuid}-{filename}
```

This structure allows a simple RLS policy: agency owner can access any file under their business_id.

**RLS policy pattern for `storage.objects`:**
```sql
-- Agency owner can upload to their business folder
CREATE POLICY "agency_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'revision-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE user_id = auth.uid()
  )
);

-- Agency owner can read their business files
CREATE POLICY "agency_owner_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'revision-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE user_id = auth.uid()
  )
);

-- Clients (unauthenticated) cannot read directly — must use signed read URLs
-- Agency owner generates signed read URLs when serving previews
```

**Client access to files:** Client portal pages (unauthenticated) should display attachment previews via signed read URLs generated server-side using the service-role client. Signed read URLs can have short expiry (1 hour is sufficient for a portal session).

**Do NOT use:**
- External file storage (S3, Cloudinary, UploadThing) — adds credentials, cost, and integration complexity when Supabase Storage is already provisioned
- Multipart form uploads through Next.js API routes — 1MB body limit makes this fragile
- Public bucket — clients should not be able to enumerate other clients' files by guessing paths

---

### 2. Client Portal (Token-Secured, No Login)

**Decision: DB-stored token in `businesses` table, identical pattern to `/complete/[token]`**

The codebase already has two working examples of this pattern. The client portal at `/portal/[token]` will be a third instance. Do not introduce JWTs, sessions, or any auth library for this.

**Token storage:** Add a `portal_token` column to the `businesses` table (TEXT, nullable, unique partial index on non-null values). This is identical to the existing `form_token` and `intake_token` columns.

**Token generation:** Use `randomBytes(32).toString('hex')` — same approach as `form_token`. The token does not need to be HMAC-signed because it never leaves the server except as an opaque URL; it is validated by DB lookup, not by cryptographic verification of its own contents.

**Route:** `/portal/[token]/page.tsx` — Server Component that:
1. Creates service-role Supabase client (bypasses RLS — this is a public page)
2. Looks up `businesses` by `portal_token`
3. Returns 404 via `notFound()` if not found (same as existing patterns)
4. Renders `<ClientPortalShell>` with business data

**What clients see at `/portal/[token]`:**
- Their own open and closed tickets
- Ticket submission form
- Attachment uploads for new tickets
- Monthly revision quota meter ("2 of 2 revisions used this month")

**Security model:** The token is a secret URL — anyone with the link can view/submit tickets for that business. This is intentional (same model as Google Doc share links). If a token is compromised, the agency regenerates it in the dashboard; the old token becomes invalid immediately.

**Do NOT use:**
- JWT cookies or sessions for client portal — adds complexity, clients cannot "log in" as a concept
- Magic link emails — out of scope for v4.0 MVP
- Separate `client_portal_sessions` table — the token IS the session; stateless is simpler

---

### 3. Ticket/Revision Monthly Limits and $50 Overage

**Decision: Application-level limit enforcement + Stripe one-time invoice for overage**

**Limit enforcement pattern (no new packages):**

Track usage per business per billing month in the `tickets` table. At ticket creation time, count existing tickets for that `business_id` in the current billing month:

```typescript
const { count } = await supabase
  .from('tickets')
  .select('*', { count: 'exact', head: true })
  .eq('business_id', businessId)
  .gte('created_at', startOfBillingMonth.toISOString())

const planLimit = business.plan === 'basic' ? 2 : 4 // Basic: 2/mo, Advanced: 4/mo
const isOverage = count >= planLimit
```

**Overage billing — Stripe one-time invoice (no metered billing complexity):**

For the $50 overage, do NOT use Stripe Billing Meters or metered subscription items. Those are designed for high-frequency usage billing and require webhook infrastructure and reconciliation logic. For a simple $50 fixed overage charge:

```typescript
// When a ticket is submitted beyond the plan limit:
await stripe.invoiceItems.create({
  customer: stripeCustomerId,
  amount: 5000, // $50.00 in cents
  currency: 'usd',
  description: `Revision overage — ${businessName} (${month})`,
})

const invoice = await stripe.invoices.create({
  customer: stripeCustomerId,
  auto_advance: true, // Automatically finalize and charge
})
```

This creates an immediate one-off invoice that charges the card on file. No subscription changes, no proration, no meter events. The Stripe API version already in use (`2026-01-28.clover`) supports this.

**Why not metered billing:** Stripe's metered/usage-based billing requires Billing Meters (a newer feature), adds significant webhook complexity for reconciliation, and is overkill for a product where overages are rare and fixed-price. One-time invoice items are simpler, more transparent to clients, and already supported by the existing Stripe integration. (Source: [Stripe flat fee with overages](https://docs.stripe.com/billing/subscriptions/usage-based-v1/use-cases/flat-fee-and-overages))

---

### 4. Web Design Agency Landing Page

**Decision: No new frameworks — build with existing Tailwind + Radix + Phosphor stack**

The existing landing page (`/app/(marketing)/page.tsx`) already uses:
- Custom React component sections (`hero-v2.tsx`, `features-bento.tsx`, `how-it-works.tsx`, etc.)
- Tailwind CSS for layout
- `react-countup` for animated statistics
- Phosphor Icons

The v4.0 pivot replaces the copy and restructures sections — it does not require a different framework or component library. The 2026 landing page conversion research confirms the winning pattern is: clear 8-word headline → one CTA → social proof above the fold → product demonstration → pricing. All of this is buildable with the existing stack.

**Key conversion patterns to implement (no new packages):**
- Hero: Agency value prop ("We handle your entire online presence") + single CTA ("Book a free audit")
- Social proof strip: Logos or review star ratings immediately below hero
- Service tiers: Clear 3-card pricing (Basic $199/mo / Advanced $299/mo / Review Add-on $99/mo) with "Most popular" tag
- How it works: 3-step visual (We build → You approve → We maintain)
- FAQ: Radix Accordion (already in use via `@radix-ui/react-tabs`) or simple Tailwind toggle

**Calendly embed (already in production):** The existing codebase already uses a Calendly "Book a call" link (per the recent commit `fix(marketing): replace reputation audit CTAs with Calendly book-a-call links`). The v4.0 landing page should use the same Calendly link pattern — no embed SDK needed, a simple link-out is sufficient for conversion.

**Do NOT add:**
- Animation libraries (Framer Motion, GSAP) — existing `motion-safe:` Tailwind transitions are sufficient
- Landing page builders (Webflow, Unbounce) — maintaining two codebases creates drift
- Video hosting (Loom embed) — listed as out of scope in PROJECT.md

---

## Complete Package Delta

| Package | Action | Version | Reason |
|---------|--------|---------|--------|
| `@supabase/supabase-js` | Already installed (use storage API) | `latest` | Supabase Storage uses the same client |
| `react-dropzone` | Already installed | `^14.3.8` | Used in CSV import; reuse for file upload |
| `stripe` | Already installed (use invoiceItems API) | `^20.2.0` | One-time invoice for $50 overage |
| `zod` | Already installed | `^4.3.6` | Ticket form validation |

**Net new packages: 0**

---

## New Environment Variables

No new environment variables needed. All required secrets already exist:
- `SUPABASE_SERVICE_ROLE_KEY` — already used for public route service-role client
- `STRIPE_SECRET_KEY` — already used for billing
- `NEXT_PUBLIC_SUPABASE_URL` — needed by client-side `uploadToSignedUrl`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — needed by client-side Supabase client for storage uploads

**One migration task:** Create the `revision-attachments` storage bucket. This can be done via Supabase Dashboard UI or a migration using the Supabase Management API. The bucket does not need a migration file since storage buckets are managed separately from schema migrations in Supabase.

---

## What NOT to Add

| Considered | Decision | Reason |
|------------|----------|--------|
| UploadThing / Cloudinary / S3 | No | Supabase Storage is already provisioned; zero benefit from adding a third-party file service |
| Stripe Billing Meters (metered billing) | No | $50 fixed overage is simpler and more appropriate for a one-time invoice item; metered billing adds webhook complexity for no gain |
| JWT sessions for client portal | No | DB token lookup is stateless and already proven in two existing routes |
| Framer Motion | No | Tailwind `motion-safe:` transitions cover all landing page animation needs |
| Separate auth system for clients | No | Clients do not have accounts; token URL IS the access credential |
| CKEditor / Quill / rich text | No | Ticket descriptions are plain text; a `<textarea>` is sufficient for v4.0 |
| Real-time (Supabase Realtime / WebSockets) | No | Client portal is read-on-load; no live update requirement in v4.0 |
| `@tus/client` (resumable uploads) | No | Revision attachments are ≤10MB; standard signed URL upload is reliable at this size |

---

## Supabase Storage — New Bucket Setup

```sql
-- Run in Supabase Dashboard or as a one-time script
-- (NOT a schema migration — storage buckets live outside schema migrations)

-- Bucket is private by default; all access via RLS or signed URLs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'revision-attachments',
  'revision-attachments',
  false,               -- private bucket
  10485760,            -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
);
```

RLS policies for `storage.objects` should be added in a migration file alongside the `tickets` and `ticket_attachments` table migrations so they are tracked in version control.

---

## Integration Points with Existing Stack

| New Feature | Integrates With | Integration Point |
|-------------|-----------------|-------------------|
| Client portal `/portal/[token]` | Existing `businesses` table | New `portal_token` column (same pattern as `form_token`, `intake_token`) |
| Ticket creation | Existing `businesses` table | `business_id` FK; `portal_token` resolves business on public portal |
| File uploads | Supabase Storage (new bucket) | `createSignedUploadUrl()` in Server Action → client uploads directly |
| Overage billing | Existing Stripe customer ID on business | `stripe.invoiceItems.create()` + `stripe.invoices.create()` |
| Revision quota | New `tickets` table | Count query with billing month window |
| Agency dashboard (ticket list) | Existing dashboard layout | New route `/app/(dashboard)/tickets/` using existing `getActiveBusiness()` pattern |

---

## Sources

- Supabase Storage signed upload URL: [supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) — HIGH confidence (official docs, updated recently)
- Supabase Storage access control (RLS): [supabase.com/docs/guides/storage/security/access-control](https://supabase.com/docs/guides/storage/security/access-control) — HIGH confidence (official docs)
- Supabase Storage file size limits: [supabase.com/docs/guides/storage/uploads/file-limits](https://supabase.com/docs/guides/storage/uploads/file-limits) — HIGH confidence (official docs; free tier: 50MB/file, Pro: up to 500GB/file)
- Supabase Storage bucket fundamentals: [supabase.com/docs/guides/storage/buckets/fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals) — HIGH confidence (official docs)
- Stripe flat fee with overages: [docs.stripe.com/billing/subscriptions/usage-based-v1/use-cases/flat-fee-and-overages](https://docs.stripe.com/billing/subscriptions/usage-based-v1/use-cases/flat-fee-and-overages) — HIGH confidence (official Stripe docs)
- Next.js 1MB server action body limit (motivation for signed URLs): [signed URL upload pattern for Next.js](https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0) — MEDIUM confidence (third-party, consistent with official Next.js body size documentation)
- react-dropzone current version: [npmjs.com/package/react-dropzone](https://www.npmjs.com/package/react-dropzone) — HIGH confidence (confirmed v14.3.8 already in package.json)
- SaaS landing page conversion patterns 2026: [saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples) — MEDIUM confidence (WebSearch, not official)

---

*Stack research for: v4.0 Web Design Agency Pivot*
*Researched: 2026-03-18*
*Confidence: HIGH — all new capabilities use existing installed packages; patterns verified against official Supabase and Stripe documentation*
