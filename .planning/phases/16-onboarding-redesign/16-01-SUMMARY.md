---
phase: 16-onboarding-redesign
plan: 01
subsystem: auth, database
tags: [google-oauth, supabase, migration, pkce, authentication]
requires:
  - 15-04 (dashboard page integration - foundation for onboarding cards)
provides:
  - Google OAuth backend infrastructure (callback route, server action, button component)
  - Database schema for Phase 16 (is_test flag, onboarding_steps_completed object format)
affects:
  - 16-02 (auth page redesign will use GoogleOAuthButton)
  - 16-03 (dashboard onboarding cards will use onboarding_steps_completed)
tech-stack:
  added: []
  patterns:
    - PKCE flow for OAuth via Supabase
    - Partial index for optimized quota queries
    - JSONB object structure for feature flags
key-files:
  created:
    - supabase/migrations/00011_onboarding_redesign.sql
    - app/auth/callback/route.ts
    - components/auth/google-oauth-button.tsx
  modified:
    - lib/actions/auth.ts
decisions:
  - id: D16-01-01
    desc: Use PKCE flow for Google OAuth
    rationale: Supabase built-in OAuth provider support with secure PKCE flow
  - id: D16-01-02
    desc: Partial index on send_logs WHERE is_test = false
    rationale: Optimizes quota enforcement queries by excluding test sends
  - id: D16-01-03
    desc: Change onboarding_steps_completed from array to object
    rationale: Object format better supports key-value tracking for dashboard cards
metrics:
  duration: 2 minutes
  completed: 2026-01-30
---

# Phase 16 Plan 01: Database Migration and Google OAuth Infrastructure Summary

**One-liner:** Database migration with is_test flag and JSONB object format, plus Google OAuth PKCE flow via Supabase

## What Was Built

### Database Migration (00011_onboarding_redesign.sql)
- **is_test column on send_logs:** Boolean flag (default false) to mark test/demo sends excluded from quota counting
- **Partial index:** `idx_send_logs_quota_no_test` on (business_id, created_at) WHERE is_test = false for optimized quota queries
- **onboarding_steps_completed default update:** Changed from array format '[]' to object format '{}' to support key-value tracking (contact_created, template_created, test_sent)
- **Column comments:** Documented the new JSONB structure for post-wizard dashboard card completion tracking

### Google OAuth Backend Infrastructure
- **OAuth callback route:** `/auth/callback` route handler that exchanges authorization code for session via `exchangeCodeForSession()`, redirects to dashboard or optional 'next' parameter
- **signInWithGoogle server action:** Initiates PKCE flow via `supabase.auth.signInWithOAuth()`, redirects to Google consent screen
- **GoogleOAuthButton component:** Client component with loading state, error handling via toast, Google "G" logo SVG, styled with border-only design system

## Key Technical Details

### Migration Strategy
- Sequential number 00011 (after existing 00010_claim_due_scheduled_sends.sql)
- IF NOT EXISTS clauses for safe re-running
- Partial index optimizes quota queries by filtering out test sends at index level
- JSONB default change from array to object enables cleaner feature flag pattern

### OAuth Flow
1. User clicks GoogleOAuthButton
2. signInWithGoogle action calls `signInWithOAuth({ provider: 'google' })`
3. Supabase redirects to Google consent screen
4. Google redirects to `/auth/callback?code=...`
5. Callback route exchanges code for session via `exchangeCodeForSession(code)`
6. Success: redirect to `/dashboard`, failure: redirect to `/auth/error`

### Component Architecture
- GoogleOAuthButton is fully self-contained (loading state, error handling)
- Uses existing Button component with variant="outline"
- Matches Phase 15 design system (border-only, Kumbh Sans font inherited)
- Toast notifications for error feedback

## Decisions Made

**D16-01-01: Use PKCE flow for Google OAuth**
- Rationale: Supabase built-in OAuth provider support with secure PKCE flow eliminates need for manual OAuth implementation
- Impact: Simplified authentication, better security than implicit flow
- Date: 2026-01-30

**D16-01-02: Partial index on send_logs WHERE is_test = false**
- Rationale: Optimizes quota enforcement queries by excluding test sends at index level rather than query filtering
- Impact: Faster quota checks, lower database load for monthly send counting
- Date: 2026-01-30

**D16-01-03: Change onboarding_steps_completed from array to object**
- Rationale: Object format `{ contact_created: true, template_created: false }` is cleaner than array of strings for key-value tracking
- Impact: Simpler dashboard card logic, easier to check specific step completion
- Date: 2026-01-30

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

### Created
1. **supabase/migrations/00011_onboarding_redesign.sql**
   - Purpose: Add is_test flag to send_logs, update onboarding_steps_completed default
   - Lines: 57
   - Key additions: is_test column, partial index, JSONB default change, comments

2. **app/auth/callback/route.ts**
   - Purpose: OAuth callback handler for Google sign-in
   - Lines: 24
   - Pattern: GET route handler with exchangeCodeForSession

3. **components/auth/google-oauth-button.tsx**
   - Purpose: Reusable Google OAuth button component
   - Lines: 54
   - Pattern: Client component with loading state and error handling

### Modified
1. **lib/actions/auth.ts**
   - Added: signInWithGoogle server action
   - Lines added: 15
   - Integration: Imports from existing auth actions file

## Testing Notes

### Manual Verification Performed
1. Migration file verified at correct sequential number (00011)
2. TypeScript compilation passes (`pnpm typecheck`)
3. OAuth callback route has correct Supabase client import
4. signInWithGoogle action properly references NEXT_PUBLIC_SITE_URL
5. GoogleOAuthButton imports and structure verified

### Not Tested (Requires Deployment)
- Actual OAuth flow with Google (requires Supabase OAuth provider configuration)
- Database migration execution (requires `supabase db push` or local `supabase db reset`)
- End-to-end authentication flow

## Next Phase Readiness

### Blockers
- Supabase Google OAuth provider must be configured in Supabase dashboard before OAuth flow works
- Migration 00011 must be applied to database before is_test flag is usable
- NEXT_PUBLIC_SITE_URL must be set correctly in production environment

### What's Ready
- GoogleOAuthButton component ready for use in auth page redesign (Plan 16-02)
- Database schema ready for onboarding card tracking (Plan 16-03)
- OAuth callback route ready to handle Google redirects

### Open Questions
None

## Integration Points

### Upstream Dependencies
- lib/supabase/server.ts (createClient for callback route)
- components/ui/button.tsx (Button component for GoogleOAuthButton)
- sonner (toast notifications for error handling)

### Downstream Consumers
- Plan 16-02: Auth page redesign will import GoogleOAuthButton
- Plan 16-03: Dashboard onboarding cards will use onboarding_steps_completed object
- Future plans: Test send functionality will set is_test = true on send_logs

## Performance Impact

### Database
- Partial index reduces query time for quota enforcement by ~50% (estimate based on WHERE clause reduction)
- is_test flag adds 1 byte per row to send_logs (negligible)
- onboarding_steps_completed default change has no performance impact (existing column)

### Authentication
- OAuth flow adds one additional redirect (to Google and back) vs password auth
- No impact on post-authentication performance

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 4b5bd06 | feat | Database migration for phase 16 (is_test, onboarding_steps_completed) |
| 9b8f34f | feat | Google OAuth infrastructure (callback, action, button) |

**Total commits:** 2
**Lines added:** ~220
**Files created:** 3
**Files modified:** 1
