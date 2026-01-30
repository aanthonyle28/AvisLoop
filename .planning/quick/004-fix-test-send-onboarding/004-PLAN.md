---
phase: quick-004
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/dashboard/onboarding-cards.tsx
  - lib/data/onboarding.ts
autonomous: true

must_haves:
  truths:
    - "Clicking 'Send a test review request' card completes the step without sending a real email"
    - "No Resend API call or send_logs insert happens for test send"
    - "Onboarding card #3 shows as complete after clicking"
    - "Dashboard revalidates and reflects the completed state"
  artifacts:
    - path: "components/dashboard/onboarding-cards.tsx"
      provides: "Card #3 calls markOnboardingCardStep('test_sent') instead of navigating to /send?test=true"
    - path: "lib/data/onboarding.ts"
      provides: "test_sent detection uses JSONB column only, not send_logs count"
  key_links:
    - from: "components/dashboard/onboarding-cards.tsx"
      to: "lib/actions/onboarding.ts"
      via: "markOnboardingCardStep('test_sent') server action call"
      pattern: "markOnboardingCardStep.*test_sent"
---

<objective>
Fix the test send onboarding flow so it does NOT send real emails or touch send_logs.

Purpose: The current onboarding card #3 ("Send a test review request") links to `/send?test=true` which runs the full send pipeline (Resend API call, send_logs insert). The send_logs insert fails due to RLS, so the card never completes. Even if RLS were fixed, test sends should not waste real Resend credits. Instead, clicking the card should directly mark the step complete via the existing `markOnboardingCardStep('test_sent')` server action.

Output: Card #3 completes instantly on click, no emails sent, dashboard refreshes to show completion.
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/dashboard/onboarding-cards.tsx
@lib/actions/onboarding.ts
@lib/data/onboarding.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Convert card #3 from navigation link to action button</name>
  <files>components/dashboard/onboarding-cards.tsx</files>
  <action>
Modify the OnboardingCards component to handle card #3 ("Send a test review request") differently from the other cards:

1. Import `markOnboardingCardStep` from `@/lib/actions/onboarding`.
2. Import `useTransition` from React (component is already 'use client').
3. Import `toast` from `sonner` for success feedback.
4. Add a `useTransition` hook: `const [isPending, startTransition] = useTransition()`.
5. Change the CARDS config for `test_sent`: remove `href: '/send?test=true'`. Add a new field `action: 'test_sent'` to distinguish it from navigation cards (or handle by id check).
6. In the render, for the `test_sent` card specifically:
   - Instead of rendering a `Link`, render a `button` (or a div with onClick).
   - On click, if card is already complete or has unmet prerequisite, do nothing.
   - Otherwise call `startTransition(async () => { const result = await markOnboardingCardStep('test_sent'); if (result.success) toast.success('Test send complete! You are all set.'); })`.
   - While `isPending`, show a subtle loading state (e.g., opacity-50 or a spinner replacing the circle icon).
7. Keep all other cards as `Link` elements unchanged. The cleanest approach: check `card.id === 'test_sent'` in the map. If true, render a button element with the same styling classes. If false, render the existing Link.
8. For the `test_sent` card config, change `href` to empty string or remove it entirely; it won't be used. Keep `prerequisite: 'contact_created'` so the prerequisite warning still shows.

Important: Do NOT import or call anything from `lib/actions/send.ts`. The whole point is to skip the send pipeline.
  </action>
  <verify>Run `pnpm typecheck` -- no errors. Visually inspect the component renders both Link cards and the button card correctly (code review).</verify>
  <done>Card #3 calls markOnboardingCardStep('test_sent') on click. No navigation to /send. No Resend API call. No send_logs insert. Dashboard revalidates via the existing revalidatePath('/dashboard') in markOnboardingCardStep.</done>
</task>

<task type="auto">
  <name>Task 2: Fix test_sent auto-detection to use JSONB only</name>
  <files>lib/data/onboarding.ts</files>
  <action>
In `getOnboardingCardStatus()`, the `test_sent` auto-detection currently queries `send_logs` count (line 130). This is wrong because:
- send_logs inserts fail due to RLS
- Test sends no longer go through send pipeline at all

Fix the auto-detection:

1. Remove the `send_logs` query from the `Promise.all` on line 127-131. Change it to only query contacts and email_templates:
   ```
   const [contactResult, templateResult] = await Promise.all([
     supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('business_id', business.id).eq('status', 'active'),
     supabase.from('email_templates').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
   ])
   ```

2. For `test_sent` in the `detected` object, use the stored JSONB value instead of send_logs count:
   ```
   const detected: OnboardingCardStatus = {
     contact_created: (contactResult.count ?? 0) > 0,
     template_created: (templateResult.count ?? 0) > 0,
     test_sent: stored.test_sent || false,  // Only from JSONB, set by markOnboardingCardStep
   }
   ```

3. This means `test_sent` is ONLY ever set via `markOnboardingCardStep('test_sent')` which writes to the JSONB column. No send_logs dependency.

4. Update the JSDoc comment for the function to reflect that test_sent is manual-only (set via markOnboardingCardStep), not auto-detected.
  </action>
  <verify>Run `pnpm typecheck` -- no errors. Run `pnpm lint` -- no errors.</verify>
  <done>test_sent detection no longer queries send_logs. It reads from onboarding_steps_completed JSONB only. The other two steps (contact_created, template_created) still auto-detect from DB state.</done>
</task>

</tasks>

<verification>
1. `pnpm typecheck` passes
2. `pnpm lint` passes
3. Code review confirms:
   - No import of send actions in onboarding-cards.tsx
   - No send_logs query in getOnboardingCardStatus for test_sent
   - markOnboardingCardStep('test_sent') is called on card #3 click
   - Card #3 renders as button, not Link
</verification>

<success_criteria>
- Clicking onboarding card #3 marks step complete without sending email
- No Resend API call or send_logs insert occurs
- Dashboard refreshes and card shows green checkmark
- Prerequisite check still works (card blocked if no contact created)
- typecheck and lint pass clean
</success_criteria>

<output>
After completion, create `.planning/quick/004-fix-test-send-onboarding/004-SUMMARY.md`
</output>
