---
phase: quick-003
plan: 01
subsystem: onboarding
tags: [oauth, validation, routing, dashboard, email]
completed: 2026-01-30
duration: ~4min

requires:
  - Phase 16 (Onboarding Redesign)
provides:
  - Working end-to-end new user flow (sign-up through first send)
affects:
  - Phase 17 (deployment readiness)

tech-stack:
  added: []
  patterns:
    - Return URL from server action for client-side redirect (OAuth)
    - Conditional dashboard sections based on user progress

key-files:
  modified:
    - lib/actions/auth.ts
    - lib/validations/auth.ts
    - components/auth/google-oauth-button.tsx
    - app/dashboard/page.tsx
    - lib/actions/send.ts
    - lib/email/templates/review-request.tsx
  created:
    - app/onboarding/page.tsx
  deleted:
    - app/(dashboard)/onboarding/page.tsx

decisions:
  - id: Q003-01
    decision: Return OAuth URL to client instead of server-side redirect
    rationale: Server actions calling redirect() throw NEXT_REDIRECT which client try/catch interprets as error
  - id: Q003-02
    decision: Remove google_review_link hard requirement for sending
    rationale: New users who skip review link step in onboarding should still be able to send; email shows generic message instead of button

metrics:
  tasks: 6/6
  duration: ~4min
---

# Quick Task 003: Fix Onboarding Issues Summary

**One-liner:** Fixed 6 critical new-user-flow blockers: Google OAuth redirect, optional fullName validation, standalone onboarding page, always-visible QuickSend, conditional stat cards, and graceful sends without review link.

## What Was Done

### Task 1: Fix Google OAuth redirect (345b6e7)
- Changed `signInWithGoogle` from calling `redirect(data.url)` to returning `{ url: data.url }`
- Updated `GoogleOAuthButton` to receive URL and do `window.location.href = url` on the client
- Prevents NEXT_REDIRECT error being caught as failure in client component

### Task 2: Fix Full Name validation (a90b47f)
- Removed `.min(1, 'Full name is required')` from `signUpSchema.fullName`
- HTML inputs send `""` (not undefined) for empty fields, which triggered min(1) before optional() could apply
- Field remains properly optional with max(100) constraint

### Task 3: Standalone onboarding page (7fded79)
- Moved `app/(dashboard)/onboarding/page.tsx` to `app/onboarding/page.tsx`
- Onboarding now renders full-screen without AppShell sidebar/header
- URL path `/onboarding` unchanged; only file location changed

### Task 4: Always-visible QuickSend (1ccc0da)
- Removed `contactsData.contacts.length > 0 && templates.length > 0` guard
- QuickSend renders unconditionally; component handles empty arrays gracefully

### Task 5: Conditional stat cards (1ccc0da)
- Wrapped stat cards grid in `{cardStatus.test_sent && (...)}`
- New users see no stat cards until they've sent at least one request

### Task 6: Graceful sends without review link (56a891f)
- Removed hard error for missing `google_review_link` in both `sendReviewRequest` and `batchSendReviewRequest`
- Pass `business.google_review_link || ''` to email template
- Email template conditionally renders: button with link, or generic message without
- Added `revalidatePath('/dashboard')` so onboarding cards update after send

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `pnpm typecheck` passes with zero errors
- `pnpm lint` passes clean
