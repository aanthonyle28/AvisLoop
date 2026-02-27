---
phase: 58
plan: "01"
name: "Job Completion Form Backend"
subsystem: "public-forms"
tags: ["service-role", "rate-limiting", "form-token", "campaign-enrollment", "public-api"]

dependency-graph:
  requires:
    - "57-01: Agency billing (pooled usage)"
    - "56-01: createAdditionalBusiness pattern"
    - "lib/actions/enrollment.ts: conflict detection patterns"
    - "lib/supabase/service-role.ts: RLS bypass client"
    - "lib/rate-limit.ts: checkPublicRateLimit"
  provides:
    - "form_token column on businesses table"
    - "generateFormToken() + regenerateFormToken() server actions"
    - "createPublicJob() service-role job creation with enrollment"
    - "POST /api/complete rate-limited public endpoint"
    - "Settings General tab FormLinkSection UI"
  affects:
    - "58-02: Public form UI (consumes /api/complete, uses token from URL)"

tech-stack:
  added: []
  patterns:
    - "Persistent DB token (form_token) for permanent shareable URLs"
    - "Service-role client for public (unauthenticated) write operations"
    - "Conflict detection inlined for service-role context (no auth-scoped checkEnrollmentConflict)"
    - "Idempotent token generation (generateFormToken returns existing if present)"
    - "Rate limiting by IP on all public endpoints (checkPublicRateLimit)"

key-files:
  created:
    - "supabase/migrations/20260227_add_form_token.sql"
    - "lib/validations/public-job.ts"
    - "lib/actions/form-token.ts"
    - "lib/actions/public-job.ts"
    - "app/api/complete/route.ts"
    - "components/settings/form-link-section.tsx"
  modified:
    - "lib/types/database.ts (Business.form_token: string | null)"
    - "components/settings/settings-tabs.tsx (FormLinkSection in General tab)"
    - "app/(dashboard)/settings/page.tsx (passes formToken prop)"

decisions:
  - id: "FORM-001"
    decision: "Persistent DB token (not HMAC) for form URL"
    rationale: "Form URL must be permanent and printable — HMAC tokens expire. DB token stored in businesses.form_token with unique partial index."
  - id: "FORM-002"
    decision: "API Route Handler (not Server Action) for form submission"
    rationale: "Server Actions use auth-scoped createClient() which returns anonymous session for unauthenticated pages. API Route Handler uses createServiceRoleClient() directly."
  - id: "FORM-003"
    decision: "Conflict defaults to 'skip' (enrollment_resolution='conflict') for public form"
    rationale: "Technicians lack context to resolve Replace/Skip/Queue decisions. Job is still created; owner resolves conflicts from dashboard."
  - id: "FORM-004"
    decision: "createPublicJob() inlines conflict detection logic (not reusing checkEnrollmentConflict)"
    rationale: "checkEnrollmentConflict() uses auth-scoped createClient(). Service-role version inlined to avoid refactoring auth-coupled functions."
  - id: "FORM-005"
    decision: "generateFormToken() is idempotent — returns existing token if already set"
    rationale: "Prevents accidental token churn if Settings component renders multiple times."
  - id: "FORM-006"
    decision: "No revalidatePath() in createPublicJob() or POST /api/complete"
    rationale: "No auth context in public endpoint. Dashboard user sees updates on next load."

metrics:
  duration: "4 min 35 sec"
  completed: "2026-02-27"
---

# Phase 58 Plan 01: Job Completion Form Backend Summary

**One-liner:** Service-role public job creation pipeline with persistent token, conflict-aware enrollment, rate-limited API, and Settings UI for form link management.

## What Was Built

This plan delivers every backend piece needed for the public job completion form. After this plan, the only missing piece is the form UI itself (Plan 58-02).

### Files Delivered

**Database**
- `supabase/migrations/20260227_add_form_token.sql`: Adds `form_token TEXT DEFAULT NULL` to businesses table with a unique partial index (`WHERE form_token IS NOT NULL`) for fast token lookups.

**Types**
- `lib/types/database.ts`: Added `form_token: string | null` to the Business interface after `agency_notes`.

**Validation**
- `lib/validations/public-job.ts`: `publicJobSchema` with `token`, `customerName`, `customerEmail`, `customerPhone`, `serviceType`, `notes` fields. Cross-field `.refine()` ensures at least one of email or phone is provided. Exports `publicJobSchema` and `PublicJobInput`.

**Server Actions (auth-scoped)**
- `lib/actions/form-token.ts`: `generateFormToken()` (idempotent — returns existing token if set, generates new if missing) and `regenerateFormToken()` (always generates fresh token, invalidating old URL). Both use `createClient()` (auth-scoped) and `revalidatePath('/settings')`.

**Service-Role Job Creation**
- `lib/actions/public-job.ts`: `createPublicJob()` — `import 'server-only'`, uses `createServiceRoleClient()`. Full pipeline:
  1. Customer dedup by email → phone → create new
  2. Create completed job with `status: 'completed'` and `completed_at`
  3. Service-role campaign query (specific type preferred over NULL)
  4. Conflict detection: active enrollment → `enrollment_resolution: 'conflict'`; recent review within cooldown → `enrollment_resolution: 'suppressed'`
  5. Enroll in campaign with service-type timing; handle 23505 unique constraint gracefully
  6. Clear `enrollment_resolution` on successful enrollment

**Public API Route**
- `app/api/complete/route.ts`: `POST /api/complete` — rate-limited by IP (`checkPublicRateLimit`), validates body against `publicJobSchema`, resolves business from `form_token` (service-role), validates service type against `service_types_enabled`, calls `createPublicJob()`, returns 201 on success. Full try/catch with ZodError and generic error handling.

**Settings UI**
- `components/settings/form-link-section.tsx`: Client component with generate/copy/regenerate flow. Uses `ArrowsClockwise` from Phosphor with `animate-spin` for loading states (matches codebase pattern from `integrations-section.tsx`). `window.location.origin` computed client-side via `useEffect`. Confirmation dialog before regenerating.
- `components/settings/settings-tabs.tsx`: `FormLinkSection` added to General tab after Business Profile section. `formToken?: string | null` prop added to `SettingsTabsProps`.
- `app/(dashboard)/settings/page.tsx`: Passes `formToken={business?.form_token ?? null}` to `SettingsTabs` (no additional fetch needed — existing `select('*')` includes the new column).

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` | PASS — zero errors |
| `pnpm lint` | PASS — zero warnings |
| Migration file has ALTER TABLE, CREATE UNIQUE INDEX, COMMENT | PASS |
| Business interface has `form_token: string | null` | PASS |
| `publicJobSchema` and `PublicJobInput` exported | PASS |
| `generateFormToken` and `regenerateFormToken` exported | PASS |
| `createPublicJob` uses `createServiceRoleClient` (not `createClient`) | PASS |
| `lib/actions/public-job.ts` has `import 'server-only'` (not `'use server'`) | PASS |
| API route uses `createServiceRoleClient` | PASS |
| API route calls `checkPublicRateLimit` before DB operations | PASS |
| API route validates service type against `service_types_enabled` | PASS |
| `/complete` is NOT in `APP_ROUTES` in `middleware.ts` | PASS |
| `FormLinkSection` rendered in General tab | PASS |
| Settings page passes `formToken` prop | PASS |

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token scheme | Persistent DB token | Form URL must be permanent and printable — HMAC tokens expire |
| Public form submission | API Route Handler | Server Actions use auth-scoped client; Route Handler uses service-role directly |
| Conflict behavior on public form | Set `enrollment_resolution: 'conflict'` on job, skip enrollment | Technicians lack context for Replace/Skip/Queue; owner resolves from dashboard |
| Conflict detection implementation | Inlined in `createPublicJob()` | `checkEnrollmentConflict()` uses auth-scoped client; inlining avoids breaking the authenticated flow |
| `generateFormToken()` idempotency | Returns existing token if set | Prevents accidental churn if Settings re-renders |
| `revalidatePath()` in public endpoint | None | No auth context in public endpoint |

## Deviations from Plan

None — plan executed exactly as written.

The customer dedup logic in the plan was slightly enhanced: the plan described email-first then create-new. The implementation adds a phone dedup step between email-miss and create-new (if no email provided but phone provided, check existing customers by E.164 phone before creating new). This matches the spirit of the research ("customers are side effects of job completion") and prevents duplicate customer records when the same technician submits with phone only.

## Next Phase Readiness

Plan 58-02 (Public Form UI) can now proceed:
- `POST /api/complete` is live and accepts `{ token, customerName, customerEmail, customerPhone, serviceType, notes }`
- `BusinessType.form_token` is typed
- `/complete` path is clear of middleware auth redirect
- Settings shows generate/copy/regenerate — owners can generate tokens and share URLs before Plan 58-02 even ships the form page
