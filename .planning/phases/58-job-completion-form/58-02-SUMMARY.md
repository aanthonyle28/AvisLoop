---
phase: 58
plan: "02"
name: "Public Form UI"
subsystem: "public-forms"
tags: ["mobile-first", "react-hook-form", "zod", "public-page", "service-role"]

dependency-graph:
  requires:
    - "58-01: POST /api/complete endpoint"
    - "58-01: form_token on businesses table"
    - "58-01: publicJobSchema validation"
    - "lib/supabase/service-role.ts: createServiceRoleClient"
    - "app/r/[token]/page.tsx: public Server Component pattern"
  provides:
    - "app/complete/[token]/page.tsx: Server Component token resolution"
    - "app/complete/[token]/job-completion-form.tsx: Mobile-optimized form"
    - "app/complete/[token]/not-found.tsx: Custom not-found page"
  affects: []

tech-stack:
  added: []
  patterns:
    - "Server Component resolves token via service-role, renders Client Component"
    - "react-hook-form + zodResolver for client-side validation"
    - "Mobile-first: h-12 inputs (48px), h-14 submit (56px), text-base (16px, prevents iOS zoom)"
    - "inputMode='email' and inputMode='tel' for mobile keyboard optimization"
    - "SSR Phosphor icons import (@phosphor-icons/react/dist/ssr) for Server Components"

key-files:
  created:
    - "app/complete/[token]/page.tsx"
    - "app/complete/[token]/job-completion-form.tsx"
    - "app/complete/[token]/not-found.tsx"
  modified: []

decisions:
  - id: "FORM-UI-001"
    decision: "Client-side form schema separate from publicJobSchema (omits token field)"
    rationale: "Token is injected from props during submission, not a form field. Client schema validates only user-entered fields."
  - id: "FORM-UI-002"
    decision: "Single service type auto-selected and select hidden"
    rationale: "If business has only 1 enabled service type, pre-select it and skip the dropdown — fewer fields = faster completion."
  - id: "FORM-UI-003"
    decision: "Success state replaces form (not a separate route)"
    rationale: "In-place state swap is faster than navigation. 'Submit Another Job' button resets form state without page reload."

metrics:
  duration: "Checkpoint verification via Playwright MCP"
  completed: "2026-02-27"
---

# Phase 58 Plan 02: Public Form UI Summary

**One-liner:** Mobile-optimized job completion form at `/complete/[token]` with Server Component token resolution, react-hook-form validation, and touch-friendly 48px inputs — usable by a technician on-site in under 30 seconds.

## What Was Built

### Files Delivered

**Server Component**
- `app/complete/[token]/page.tsx`: Resolves `form_token` via `createServiceRoleClient()`, passes business name + enabled service types + custom service names to client form. Calls `notFound()` for invalid tokens. Sets `robots: 'noindex, nofollow'` metadata.

**Client Component**
- `app/complete/[token]/job-completion-form.tsx`: `'use client'` form with react-hook-form + zodResolver. Fields: customer name (required), email (optional), phone (optional, with email-or-phone cross-field validation), service type (hidden if single type), notes (optional). Submits to `POST /api/complete` with token injected from props. Success state shows green CheckCircle + "Submit Another Job" reset button.

**Not Found Page**
- `app/complete/[token]/not-found.tsx`: Server Component with red XCircle icon and helpful message ("ask your manager for the updated link"). Uses `@phosphor-icons/react/dist/ssr` import.

### Mobile Optimizations
- `h-12` on all inputs (48px touch target, above 44px minimum)
- `h-14` on submit button (56px, prominent primary action)
- `text-base` on inputs and labels (16px — prevents iOS auto-zoom on focus)
- `inputMode="email"` on email, `inputMode="tel"` on phone (mobile keyboard optimization)
- Single-column layout, no horizontal scrolling
- Minimal fields for fast completion

## Verification Results

All checks verified via Playwright MCP automated testing:

| Check | Result |
|-------|--------|
| Settings > General > "Job Completion Form" section visible | PASS |
| Token generation creates URL with copy button | PASS |
| `/complete/[valid-token]` loads without authentication | PASS |
| Form shows business name and enabled service types | PASS |
| Empty submit shows 3 validation errors | PASS |
| Successful submission (name + email + service type) creates job | PASS |
| Success screen shows green checkmark + "Job Submitted" | PASS |
| "Submit Another Job" resets form | PASS |
| Jobs page shows new job as Completed with correct service type | PASS |
| Job auto-enrolled in matching campaign | PASS |
| `/complete/invalid-token-12345` shows "Form Not Found" page | PASS |
| Mobile viewport (375x812) renders correctly with large touch targets | PASS |

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Form schema | Separate client-side schema (omits token) | Token injected from props, not a form field |
| Single service type | Auto-select and hide dropdown | Fewer fields = faster completion |
| Success UX | In-place state swap | Faster than navigation; "Submit Another Job" resets without reload |

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

This completes Phase 58 and the entire v3.0 Agency Mode milestone. All features are live:
- Business resolver with cookie-based context switching
- Multi-business data functions and server actions
- BusinessSwitcher in desktop sidebar and mobile header
- Agency metadata Clients page with detail drawer
- Additional business creation wizard
- Pooled billing enforcement
- Public job completion form with token-secured URLs
