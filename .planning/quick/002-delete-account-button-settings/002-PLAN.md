---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/actions/auth.ts
  - components/settings/delete-account-dialog.tsx
  - app/dashboard/settings/page.tsx
autonomous: true

must_haves:
  truths:
    - "User sees a 'Delete Account' button in the settings page"
    - "Clicking the button opens a confirmation modal requiring user to type DELETE"
    - "Typing DELETE and confirming deletes all org data and auth account"
    - "After deletion, user is signed out and redirected to home page"
    - "The delete button cannot be accidentally triggered (requires exact text match)"
  artifacts:
    - path: "lib/actions/auth.ts"
      provides: "deleteAccount server action using service role"
      contains: "deleteAccount"
    - path: "components/settings/delete-account-dialog.tsx"
      provides: "Client component with Radix Dialog, DELETE confirmation input"
    - path: "app/dashboard/settings/page.tsx"
      provides: "Settings page with danger zone section"
  key_links:
    - from: "components/settings/delete-account-dialog.tsx"
      to: "lib/actions/auth.ts"
      via: "deleteAccount server action call"
      pattern: "deleteAccount"
    - from: "lib/actions/auth.ts"
      to: "lib/supabase/service-role.ts"
      via: "createServiceRoleClient for cascading deletes"
      pattern: "createServiceRoleClient"
---

<objective>
Add a "Delete Account" button to the settings page with a confirmation modal that requires typing "DELETE" to confirm. The server action uses the Supabase service role client to delete all org data (business cascades to email_templates, contacts, send_logs, subscriptions, scheduled_sends) and then deletes the auth user. After deletion, the user is signed out and redirected to the home page.

Purpose: Allow users to permanently delete their account and all associated data.
Output: Working delete account flow accessible from settings page.
</objective>

<execution_context>
@C:\AvisLoop\.claude/get-shit-done/workflows/execute-plan.md
@C:\AvisLoop\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/actions/auth.ts - Existing auth actions (signOut pattern to follow)
@lib/supabase/service-role.ts - Service role client for bypassing RLS
@lib/supabase/server.ts - Server Supabase client for getting current user
@app/dashboard/settings/page.tsx - Settings page to add danger zone section
@components/ui/dialog.tsx - Radix Dialog UI component already available
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create deleteAccount server action</name>
  <files>lib/actions/auth.ts</files>
  <action>
Add a `deleteAccount` server action to `lib/actions/auth.ts`. The action must:

1. Get the current authenticated user via `createClient()` from `@/lib/supabase/server` and `supabase.auth.getUser()`. Return `{ error: 'Not authenticated' }` if no user.

2. Import `createServiceRoleClient` from `@/lib/supabase/service-role`. Use service role to bypass RLS for the cascading delete.

3. Delete the user's business using service role client:
   ```
   const admin = createServiceRoleClient()
   const { error: deleteBusinessError } = await admin
     .from('businesses')
     .delete()
     .eq('user_id', user.id)
   ```
   This cascades to email_templates, contacts, send_logs, subscriptions, and scheduled_sends via ON DELETE CASCADE foreign keys.

4. Delete the user's profile row if profiles table exists:
   ```
   await admin.from('profiles').delete().eq('id', user.id)
   ```

5. Delete the auth user via admin API:
   ```
   const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id)
   ```
   If this errors, return `{ error: 'Failed to delete account. Please try again.' }`.

6. Sign out the current session using the regular (non-admin) supabase client:
   ```
   await supabase.auth.signOut()
   ```

7. Call `redirect('/')` to send user to home page.

Return type should be `AuthActionState` (already defined in the file).

Function signature: `export async function deleteAccount(): Promise<AuthActionState>`

Do NOT accept formData -- the confirmation logic is client-side only.
  </action>
  <verify>Run `pnpm typecheck` to confirm no type errors in the updated auth.ts file.</verify>
  <done>deleteAccount server action exists in lib/actions/auth.ts, typechecks, uses service role for cascading deletes, deletes auth user, signs out, and redirects to home.</done>
</task>

<task type="auto">
  <name>Task 2: Create DeleteAccountDialog component and add to settings page</name>
  <files>components/settings/delete-account-dialog.tsx, app/dashboard/settings/page.tsx</files>
  <action>
**Create `components/settings/delete-account-dialog.tsx`** as a `'use client'` component:

1. Import Dialog components from `@/components/ui/dialog` (Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter).

2. Component state:
   - `confirmText` (string) - tracks what user typed
   - `isDeleting` (boolean) - loading state during deletion
   - `error` (string | null) - error message from server action
   - `open` (boolean) - dialog open state (controlled, so we can reset on close)

3. The trigger button: a red-styled button with text "Delete Account". Use Tailwind: `bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50`.

4. Dialog content:
   - Title: "Delete Account"
   - Description: "This action is permanent and cannot be undone. All your business data, contacts, templates, send history, and billing information will be permanently deleted."
   - An input field with label "Type DELETE to confirm" - plain HTML input with Tailwind styling matching the project (border, rounded-md, px-3 py-2, w-full, text-sm). Placeholder: "Type DELETE here".
   - If `error` is set, show it in a red text paragraph.
   - Footer with two buttons:
     - Cancel button (uses DialogClose or sets open to false): "Cancel", neutral styling
     - Confirm delete button: "Delete My Account" (or "Deleting..." when isDeleting). Red bg styling. **Disabled** unless `confirmText === 'DELETE'` (exact match, case-sensitive) OR `isDeleting` is true.

5. On confirm click:
   - Set `isDeleting = true`, clear error
   - Import and call `deleteAccount` from `@/lib/actions/auth`
   - If it returns an error (the redirect will throw a NEXT_REDIRECT error which is expected), set error state and `isDeleting = false`
   - The redirect in the server action handles navigation

6. When dialog closes (onOpenChange), reset `confirmText`, `error`, and `isDeleting`.

**Update `app/dashboard/settings/page.tsx`**:

1. Import `DeleteAccountDialog` from `@/components/settings/delete-account-dialog`.

2. Add a new "Danger Zone" section at the bottom of the settings page (after the Integrations section), inside the `SettingsContent` component's return JSX:

```tsx
{/* Section 4: Danger Zone */}
<section className="border border-red-200 rounded-lg p-6 bg-white shadow-sm">
  <h2 className="text-xl font-semibold mb-2 text-red-600">Danger Zone</h2>
  <p className="text-gray-600 mb-4">
    Permanently delete your account and all associated data. This action cannot be undone.
  </p>
  <DeleteAccountDialog />
</section>
```
  </action>
  <verify>
Run `pnpm typecheck` and `pnpm lint` to confirm no errors. Then run `pnpm dev` and navigate to `/dashboard/settings` to visually confirm the Danger Zone section appears at the bottom with a red "Delete Account" button. Click the button to confirm the modal opens with the DELETE confirmation input.
  </verify>
  <done>Settings page shows a Danger Zone section with Delete Account button. Clicking opens a Radix Dialog modal requiring user to type "DELETE" before the confirm button enables. The full flow (type DELETE -> confirm -> data deleted -> signed out -> redirected to /) works end-to-end.</done>
</task>

</tasks>

<verification>
1. `pnpm typecheck` passes with no errors
2. `pnpm lint` passes with no errors
3. Navigate to `/dashboard/settings` - Danger Zone section visible at bottom
4. Click "Delete Account" - modal opens with confirmation input
5. Confirm button is disabled until exactly "DELETE" is typed
6. (Manual test on a throwaway account) Type DELETE, click confirm - account and all data deleted, redirected to home page
</verification>

<success_criteria>
- deleteAccount server action in lib/actions/auth.ts uses service role to cascade-delete business data and delete auth user
- DeleteAccountDialog component uses Radix Dialog with controlled "DELETE" text confirmation
- Settings page has a visually distinct Danger Zone section at the bottom
- Typecheck and lint pass cleanly
- Full flow works: open modal -> type DELETE -> confirm -> data deleted -> signed out -> redirected to /
</success_criteria>

<output>
After completion, create `.planning/quick/002-delete-account-button-settings/002-SUMMARY.md`
</output>
