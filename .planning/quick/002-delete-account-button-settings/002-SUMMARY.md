---
phase: quick
plan: 002
subsystem: auth
tags: [delete-account, settings, server-action, radix-dialog]
dependency-graph:
  requires: []
  provides: [delete-account-flow]
  affects: []
tech-stack:
  added: []
  patterns: [service-role-cascading-delete, controlled-dialog-confirmation]
key-files:
  created:
    - components/settings/delete-account-dialog.tsx
  modified:
    - lib/actions/auth.ts
    - app/dashboard/settings/page.tsx
decisions: []
metrics:
  duration: ~2 minutes
  completed: 2026-01-30
---

# Quick Task 002: Delete Account Button in Settings Summary

**One-liner:** Delete account flow with service-role cascading delete and Radix Dialog confirmation requiring exact "DELETE" text input.

## What Was Done

### Task 1: Create deleteAccount server action
- Added `deleteAccount` function to `lib/actions/auth.ts`
- Uses `createServiceRoleClient` to bypass RLS for cascading deletes
- Deletes business data (cascades to email_templates, contacts, send_logs, subscriptions, scheduled_sends)
- Deletes profile row and auth user via admin API
- Signs out session and redirects to home page
- Returns `AuthActionState` for error handling

### Task 2: Create DeleteAccountDialog and add to settings page
- Created `components/settings/delete-account-dialog.tsx` as a client component
- Uses Radix Dialog with controlled open state
- Requires exact case-sensitive "DELETE" text before confirm button enables
- Loading state during deletion, error display, full reset on dialog close
- Added Danger Zone section with red border at bottom of settings page

## Verification Results

- `pnpm typecheck` passes cleanly
- `pnpm lint` passes cleanly
- Settings page renders Danger Zone section at bottom
- Dialog opens with DELETE confirmation input
- Confirm button disabled until exact match

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | d5a9055 | feat(quick-002): add deleteAccount server action |
| 2 | 472708c | feat(quick-002): add DeleteAccountDialog and Danger Zone to settings |
