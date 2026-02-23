# Security Remaining Fixes Plan

## L-3: Drop legacy `contact_id` from `send_logs`

### Context
The `send_logs` table has both `contact_id` and `customer_id` columns (both NOT NULL, both FK to `customers.id`). This is a legacy artifact from the contacts→customers rename. All 7 existing rows have matching values.

### Steps (order matters)

**Step 1: Fix cron processor write** (`app/api/cron/process-scheduled-sends/route.ts`)
- Line 214: change `contact_id: contact.id` to `customer_id: contact.id`
- This is the ONLY code path still writing to `contact_id`

**Step 2: Fix TypeScript type** (`lib/types/database.ts`)
- Line 255: change `contact_id: string` to `customer_id: string` in `SendLogDetail` interface
- This interface is used by the scheduled sends detail view

**Step 3: Database migration** (via Supabase MCP)
- Copy any rows where `contact_id` differs from `customer_id` (safety — currently 0 mismatches)
- Drop FK constraint `send_logs_contact_id_fkey`
- Drop column `contact_id` from `send_logs`

**NOT touched:**
- `scheduled_sends.contact_ids` (ARRAY column) — different table, functional column, NOT a duplicate FK. Renaming is high-risk for low reward.
- `lib/actions/schedule.ts` line 69 (`contact_ids: validatedIds`) — writes to scheduled_sends, not send_logs
- `BatchSendActionState.contactId` / `contactName` — these are internal variable names, not DB column references

### Risk assessment
- LOW: Only 1 code path writes `contact_id`, all queries already use `customer_id`
- All joins already use `customers!send_logs_customer_id_fkey`
- RLS policies use `business_id`, not `contact_id`

---

## L-5: Add re-authentication guard to `deleteAccount`

### Context
`deleteAccount()` in `lib/actions/auth.ts` permanently deletes ALL business data without password confirmation. The dialog currently only requires typing "DELETE".

### Steps

**Step 1: Update server action** (`lib/actions/auth.ts`)
- Change `deleteAccount()` signature to accept `password: string`
- Before any deletion, verify password with `supabase.auth.signInWithPassword({ email: user.email, password })`
- If verification fails, return `{ error: 'Incorrect password' }`
- Keep all existing deletion logic unchanged after verification

**Step 2: Update dialog component** (`components/settings/delete-account-dialog.tsx`)
- Add a password input field (type="password") below the "Type DELETE" field
- Require BOTH confirmations: text === 'DELETE' AND password is non-empty
- Pass password to `deleteAccount(password)`
- Show error from server action if password is wrong
- Clear password field on dialog close

### Risk assessment
- LOW: Only affects the delete account flow
- Google OAuth users won't have a password — need to handle this:
  - Check user's auth providers via `supabase.auth.getUser()`
  - If user has no password (OAuth-only), skip password check but still require "DELETE" text
  - This maintains security for password users while not blocking OAuth users

---

## Verification
- `pnpm lint` must pass
- `pnpm typecheck` must pass
- No functionality changes to any other features
