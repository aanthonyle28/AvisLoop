---
phase: quick-003
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/actions/auth.ts
  - lib/validations/auth.ts
  - components/sign-up-form.tsx
  - app/(dashboard)/onboarding/page.tsx
  - components/onboarding/onboarding-wizard.tsx
  - app/dashboard/page.tsx
  - components/dashboard/quick-send.tsx
  - lib/actions/send.ts
autonomous: true

must_haves:
  truths:
    - "Google OAuth button redirects to Google consent screen and returns user to /auth/callback successfully"
    - "Sign-up form submits successfully with empty Full Name field (no validation error)"
    - "Business onboarding screen renders full-width without dashboard nav/shell, centered content with larger text"
    - "Quick Send form appears on dashboard after completing onboarding (even with 0 contacts/templates)"
    - "Metric cards (Monthly Usage, Needs Attention, Review Rate) are hidden until user has at least 1 sent send_log"
    - "Send request succeeds (1 sent / 0 failed) when google_review_link is set and Resend is configured"
  artifacts:
    - path: "lib/actions/auth.ts"
      provides: "signInWithGoogle server action that returns redirect URL to client"
    - path: "lib/validations/auth.ts"
      provides: "signUpSchema with truly optional fullName (no min(1))"
    - path: "app/(dashboard)/onboarding/page.tsx"
      provides: "Onboarding page outside dashboard shell"
    - path: "app/dashboard/page.tsx"
      provides: "Dashboard with conditional stat cards and always-visible QuickSend"
  key_links:
    - from: "components/auth/google-oauth-button.tsx"
      to: "lib/actions/auth.ts"
      via: "signInWithGoogle returns URL, client does window.location redirect"
    - from: "app/dashboard/page.tsx"
      to: "lib/data/onboarding.ts"
      via: "getOnboardingCardStatus checks send_logs count for stat card visibility"
---

<objective>
Fix 6 onboarding and post-onboarding issues that block the new user flow from working end-to-end.

Purpose: A new user cannot currently sign up with Google, complete onboarding smoothly, see the Quick Send form, or successfully send a test request. These are all critical path blockers.
Output: All 6 issues resolved, new user flow works from sign-up through first send.
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@docs/PROJECT_STATE.md
@lib/actions/auth.ts
@lib/validations/auth.ts
@components/sign-up-form.tsx
@components/auth/google-oauth-button.tsx
@app/auth/callback/route.ts
@app/(dashboard)/onboarding/page.tsx
@components/onboarding/onboarding-wizard.tsx
@components/onboarding/steps/business-step.tsx
@app/dashboard/page.tsx
@app/dashboard/layout.tsx
@app/(dashboard)/layout.tsx
@components/dashboard/stat-cards.tsx
@components/dashboard/quick-send.tsx
@components/dashboard/onboarding-cards.tsx
@lib/data/onboarding.ts
@lib/data/send-logs.ts
@lib/actions/send.ts
@lib/email/resend.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Google OAuth — server action redirect issue</name>
  <files>lib/actions/auth.ts, components/auth/google-oauth-button.tsx</files>
  <action>
The `signInWithGoogle` server action calls `redirect(data.url)` which throws a Next.js NEXT_REDIRECT error. However, since this is called from a client component via `await signInWithGoogle()`, the redirect happens server-side but the client catches it as an error in the try/catch block of GoogleOAuthButton.

Fix approach: Change `signInWithGoogle` to return the OAuth URL instead of calling redirect(). Then update GoogleOAuthButton to receive the URL and do `window.location.href = url` on the client side.

In `lib/actions/auth.ts`:
- Change `signInWithGoogle` to return `{ url: string }` instead of calling `redirect(data.url)`
- Return `{ url: data.url }` on success
- Return `{ error: string }` on failure (throw removed)

In `components/auth/google-oauth-button.tsx`:
- Update handleClick to: `const result = await signInWithGoogle()`
- If result has url: `window.location.href = result.url`
- If result has error: show toast

Note: The callback route at `app/auth/callback/route.ts` is already correct — it exchanges the code for a session and redirects to /dashboard. No changes needed there.
  </action>
  <verify>
- `pnpm typecheck` passes
- Click "Continue with Google" on sign-up page — should redirect to Google consent screen
- After Google auth, should land on /dashboard (or /onboarding if first time)
  </verify>
  <done>Google OAuth button successfully redirects to Google consent screen and completes authentication flow back to the app.</done>
</task>

<task type="auto">
  <name>Task 2: Fix Full Name validation — remove min(1) from optional field</name>
  <files>lib/validations/auth.ts, components/sign-up-form.tsx</files>
  <action>
The `signUpSchema` in `lib/validations/auth.ts` has:
```
fullName: z.string().min(1, 'Full name is required').max(100, ...).optional()
```

The `.min(1)` check fires BEFORE `.optional()` takes effect when the form sends an empty string (which is what HTML inputs send for empty fields — they send "" not undefined). So the field says "optional" in the UI but validation rejects empty string.

Fix in `lib/validations/auth.ts`:
- Change fullName to: `z.string().max(100, 'Full name must be less than 100 characters').optional().transform(v => v || undefined)` — this transforms empty string to undefined so optional() works correctly. Or use `.or(z.literal(''))` approach.
- Simplest fix: `z.string().max(100, '...').optional()` — remove the `.min(1, ...)` entirely. The `signUp` action already handles falsy fullName with `fullName || ''` on line 44.

In `components/sign-up-form.tsx`:
- Remove the text "(optional)" from the Label OR keep it — either way it should not block. The label currently says "Full Name (optional)" which is correct UX. Keep it.
- No other changes needed in the form.
  </action>
  <verify>
- `pnpm typecheck` passes
- Submit sign-up form with empty Full Name field — should succeed without validation error
- Submit sign-up form with a Full Name — should also succeed
  </verify>
  <done>Sign-up works whether Full Name is empty or filled in. No validation error on empty Full Name.</done>
</task>

<task type="auto">
  <name>Task 3: Make business onboarding screen full-width and centered (no dashboard shell)</name>
  <files>app/(dashboard)/onboarding/page.tsx</files>
  <action>
Currently the onboarding page lives at `app/(dashboard)/onboarding/page.tsx` which means it inherits the `(dashboard)` layout group that wraps everything in `AppShell` (sidebar nav + header). The onboarding should be a standalone full-screen experience.

Fix: Move the onboarding page OUT of the `(dashboard)` route group to its own top-level route.

1. Create `app/onboarding/page.tsx` with the exact same content as `app/(dashboard)/onboarding/page.tsx`
2. Delete `app/(dashboard)/onboarding/page.tsx` (and the `onboarding` folder under `(dashboard)`)
3. The OnboardingWizard component already renders `min-h-screen flex flex-col items-center justify-center` which is the correct centered layout. It will now render without the AppShell wrapper.

Additionally, in the OnboardingWizard component (`components/onboarding/onboarding-wizard.tsx`), optionally increase the heading text size in the wizard for the "larger text" requirement. The business-step.tsx uses `text-xl` for the heading — consider bumping to `text-2xl` or `text-3xl`. But the main fix is just removing the dashboard shell.

IMPORTANT: Check for any imports or links that reference `/onboarding` — they should still work since the URL path doesn't change, only the file location changes.
  </action>
  <verify>
- `pnpm typecheck` passes
- Navigate to /onboarding — page renders full-width without sidebar/nav
- Content is centered vertically and horizontally
- Page is responsive on mobile
  </verify>
  <done>Onboarding screen renders as a standalone full-screen page without dashboard navigation. Content is centered with larger text.</done>
</task>

<task type="auto">
  <name>Task 4: Show Quick Send form on dashboard even without contacts/templates</name>
  <files>app/dashboard/page.tsx</files>
  <action>
The dashboard page (line 81) conditionally renders QuickSend:
```tsx
{contactsData.contacts.length > 0 && templates.length > 0 && (
  <QuickSend ... />
)}
```

After completing onboarding, a new user has a business but may have 0 contacts and 0 templates (the onboarding wizard only asks for business name + review link). The onboarding cards tell them to create a contact and template, but the Quick Send form is hidden.

Fix: Always show the QuickSend component. Remove the conditional `contactsData.contacts.length > 0 && templates.length > 0` guard. The QuickSend component already handles empty states gracefully (no contacts = empty search, no templates = empty select).

In `app/dashboard/page.tsx`:
- Change line 81 from `{contactsData.contacts.length > 0 && templates.length > 0 && (` to just render QuickSend unconditionally (or with a less restrictive condition).
- Actually, QuickSend needs contacts and templates arrays as props — passing empty arrays is fine, the component handles it. Just remove the conditional wrapper.
  </action>
  <verify>
- `pnpm typecheck` passes
- Dashboard shows Quick Send form even when user has 0 contacts and 0 templates
- Quick Send form still works correctly when contacts and templates exist
  </verify>
  <done>Quick Send form is always visible on the dashboard regardless of contact/template count.</done>
</task>

<task type="auto">
  <name>Task 5: Hide metric cards until after first send</name>
  <files>app/dashboard/page.tsx, lib/data/onboarding.ts</files>
  <action>
The stat cards (Monthly Usage, Needs Attention, Review Rate) currently always show on the dashboard. They should be hidden until the user has sent at least one review request.

Fix in `app/dashboard/page.tsx`:
- Use the existing `getOnboardingCardStatus()` data (already fetched as `cardStatus`) to determine if `test_sent` is true. OR query send_logs count directly.
- Simplest approach: Check if `usage.count > 0` (monthly usage count) or check the `cardStatus.test_sent` flag. However, `usage.count` only counts non-test sends in the current month. Better to add a simple check: fetch total send_log count for the business.
- Best approach: Add a `hasAnySends` field. Use the existing `recentActivity` array — if `recentActivity.length > 0`, user has sent something. This avoids an extra query.
- Actually, the cleanest approach: wrap the stat cards grid in a conditional: `{(cardStatus.test_sent || recentActivity.length > 0) && ( <div className="grid ..."> stat cards </div> )}`
- This uses `cardStatus.test_sent` (which checks if ANY send_log exists for the business) as the primary signal. The `recentActivity` check is a backup.

In `app/dashboard/page.tsx`:
- Wrap the stat cards section (lines 74-78) in: `{cardStatus.test_sent && ( ... )}`
  </action>
  <verify>
- `pnpm typecheck` passes
- New user dashboard (no sends yet) does NOT show Monthly Usage, Needs Attention, or Review Rate cards
- After sending at least one request, refreshing dashboard shows the stat cards
  </verify>
  <done>Metric cards are hidden for new users and appear only after the first send.</done>
</task>

<task type="auto">
  <name>Task 6: Debug and fix send request failure (0 sent / 1 failed)</name>
  <files>lib/actions/send.ts</files>
  <action>
The send is showing "0 sent / 1 failed". The most likely causes based on code review:

1. **Missing google_review_link**: `sendReviewRequest` and `batchSendReviewRequest` both check `if (!business.google_review_link)` and return an error. If the user skipped the Google Review Link step in onboarding, sends will ALWAYS fail. This is the most probable cause.

2. **Resend API issues**: If RESEND_FROM_EMAIL is using the sandbox domain `onboarding@resend.dev`, Resend only allows sending to the account owner's email. Sending to any other email will fail silently (API returns error).

Fix approach — make google_review_link optional for sending:
- In both `sendReviewRequest` and `batchSendReviewRequest`, change the hard error for missing google_review_link to a fallback. Instead of returning an error, use a placeholder or skip the review link in the email.
- In `sendReviewRequest` (around line 81): Remove the early return. Instead, set `business.google_review_link` to a fallback value or pass it as optional to ReviewRequestEmail.
- In `batchSendReviewRequest` (around line 310): Same change — remove early return for missing google_review_link.
- Pass `reviewLink: business.google_review_link || ''` to ReviewRequestEmail. The email template should handle an empty review link gracefully (hide the review button or show a generic message).

Also check `lib/email/templates/review-request.tsx` — if the ReviewRequestEmail component requires a non-empty reviewLink, update it to handle empty/null gracefully (show a "leave us a review" message without a specific link, or hide the CTA button).

Additionally, add better error logging in the catch block of batchSendReviewRequest so the actual Resend API error is surfaced in the toast (it currently is — `emailError.message` — but check if the error format from Resend is being captured correctly).

IMPORTANT: Also revalidate the `/dashboard` path (not just `/dashboard/contacts` and `/dashboard/send`) so the dashboard onboarding cards update after a send. Add `revalidatePath('/dashboard')` to both send functions.
  </action>
  <verify>
- `pnpm typecheck` passes
- Send a review request to a contact — should succeed (1 sent / 0 failed) when Resend is configured
- If google_review_link is not set, send should still succeed (email sent without review link CTA or with generic message)
- After successful send, dashboard "test_sent" onboarding card should show as complete on refresh
  </verify>
  <done>Send requests succeed. Missing google_review_link no longer blocks sending. Dashboard revalidates after send so onboarding progress updates.</done>
</task>

</tasks>

<verification>
After all tasks complete:
1. `pnpm typecheck` passes with zero errors
2. `pnpm lint` passes
3. Full new user flow works:
   - Sign up with Google OAuth (redirects to Google, returns to app)
   - Sign up with email + empty Full Name (no validation error)
   - Onboarding screen is full-width, centered, no dashboard nav
   - After onboarding, dashboard shows Quick Send (even with 0 contacts)
   - Stat cards are hidden (no sends yet)
   - After creating contact + sending test request, stat cards appear
   - Send request succeeds (1 sent / 0 failed)
</verification>

<success_criteria>
- Google OAuth completes full round-trip (app -> Google -> app)
- Empty Full Name field does not block sign-up
- Onboarding renders standalone (no AppShell/sidebar)
- QuickSend visible on fresh dashboard
- Stat cards hidden until first send exists
- Test send succeeds and onboarding card marks complete
- `pnpm typecheck` and `pnpm lint` pass
</success_criteria>

<output>
After completion, create `.planning/quick/003-fix-onboarding-issues/003-SUMMARY.md`
</output>
