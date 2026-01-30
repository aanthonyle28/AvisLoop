# Quick Task 004: Fix Test Send Onboarding Summary

**One-liner:** Card #3 now marks test_sent via server action instead of navigating to /send, eliminating failed Resend API calls and RLS errors.

## What Was Done

### Task 1: Convert card #3 from navigation link to action button
- Replaced `Link` with `button` element for the test_sent card
- Added `useTransition` for pending state with spinner indicator
- Card calls `markOnboardingCardStep('test_sent')` directly on click
- Toast feedback on success/error via sonner
- Disabled state when pending, complete, or prerequisite unmet
- Removed `href: '/send?test=true'` from card config, added `action: 'test_sent'` field

### Task 2: Fix test_sent auto-detection to use JSONB only
- Removed `send_logs` query from `getOnboardingCardStatus()` Promise.all
- `test_sent` now reads exclusively from `onboarding_steps_completed` JSONB column
- `contact_created` and `template_created` still auto-detect from DB state
- Updated JSDoc to document manual-only test_sent behavior

## Files Modified

| File | Change |
|------|--------|
| `components/dashboard/onboarding-cards.tsx` | Card #3 renders as button with server action instead of Link to /send |
| `lib/data/onboarding.ts` | Removed send_logs query, test_sent reads from JSONB only |

## Commits

| Hash | Message |
|------|---------|
| `b360569` | feat(quick-004): convert test send card to action button |
| `7909436` | fix(quick-004): remove send_logs query from test_sent detection |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] No import of send actions in onboarding-cards.tsx
- [x] No send_logs query in getOnboardingCardStatus for test_sent
- [x] markOnboardingCardStep('test_sent') called on card #3 click
- [x] Card #3 renders as button, not Link
