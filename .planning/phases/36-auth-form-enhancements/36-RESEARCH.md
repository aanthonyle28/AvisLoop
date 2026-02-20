# Phase 36: Auth Form Enhancements - Research

**Researched:** 2026-02-19
**Domain:** Auth UX — password visibility toggle, password strength checklist, inline validation, Google OAuth
**Confidence:** HIGH

---

## Summary

Phase 36 adds three auth UX improvements: a show/hide password toggle, a live password-strength checklist, and Google OAuth verification. All four auth forms are already implemented using React 19's `useActionState` with Supabase Server Actions. The forms are "use client" components. All code changes are purely additive UI enhancements — no changes to the Supabase auth actions or validation schemas are required for the toggle and checklist, though the signup and update-password validation schemas should gain strength-rule checks to match the checklist visually.

The codebase uses `@phosphor-icons/react` as the primary icon library. `Eye` and `EyeSlash` exist in the package. The project's `Input` component is a plain `<input>` with no wrapper, so the password toggle will require a `<div className="relative">` wrapper with an absolute-positioned `<button>` inside — exactly the same pattern already used in `quick-send-tab.tsx`.

Google OAuth is already wired end-to-end (Server Action → `signInWithOAuth` → redirect → `/auth/callback` route → `exchangeCodeForSession` → `/dashboard`). The plan task for OAuth is verification, not a build task. The most likely failure mode is Supabase dashboard configuration (Google provider not enabled, redirect URL not allowlisted).

**Primary recommendation:** Build a `PasswordInput` component (relative wrapper + Input + toggle button), a `PasswordStrengthChecklist` component (pure client-side, `onChange`-driven), and then wire both into the three target forms. OAuth plan is a verification checklist, not a code build.

---

## Standard Stack

### Core (already in project — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@phosphor-icons/react` | 2.1.10 | Eye / EyeSlash icons | Project standard icon library |
| React 19 `useState` | built-in | Toggle visibility state, track password value | Sufficient for this use case |
| Tailwind CSS | 3.x | Styling the wrapper, toggle button, checklist | Project standard |

### No New Dependencies Required

All needed primitives exist:
- `Eye`, `EyeSlash` from `@phosphor-icons/react` — confirmed exported in `dist/index.d.ts` (lines 549, 551)
- `XCircle`, `CheckCircle` from `@phosphor-icons/react` — confirmed exported (lines 357, 1510)
- `Button` component — existing, supports `ghost` + `icon-sm` variants
- `Input` component — existing, wrapping it is straightforward

**Installation:**

```bash
# Nothing to install — all dependencies exist
```

---

## Architecture Patterns

### Recommended Project Structure

```
components/
├── ui/
│   ├── password-input.tsx        # NEW: Input + toggle button wrapper
│   └── password-strength.tsx     # NEW: Live requirement checklist
├── login-form.tsx                 # MODIFY: add PasswordInput for password field
├── sign-up-form.tsx               # MODIFY: add PasswordInput + PasswordStrengthChecklist
└── update-password-form.tsx       # MODIFY: add PasswordInput + PasswordStrengthChecklist
```

The `forgot-password-form.tsx` has no password field — it only collects email — so it is NOT modified.

### Pattern 1: PasswordInput Component (Relative Wrapper)

**What:** A thin wrapper around the project's existing `<Input>` component that overlays an absolute-positioned toggle button on the right side.

**When to use:** Any password field that needs show/hide toggle.

**The critical rule:** The toggle button must use `tabIndex={-1}` so keyboard Tab flow skips it. Users can still click it, but Tab goes directly from the password field to the next form field. This is the spec requirement (AUTH-01 criterion 1).

**Example:**

```typescript
// components/ui/password-input.tsx
// Source: project pattern from quick-send-tab.tsx (relative/absolute overlay)
'use client'

import * as React from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  // no extra props needed
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = React.useState(false)

    return (
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          className={cn('pr-10', className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
        >
          {show
            ? <EyeSlash size={16} weight="regular" aria-hidden />
            : <Eye size={16} weight="regular" aria-hidden />
          }
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
```

**Key details:**
- `pr-10` on the Input ensures text doesn't run under the toggle button
- `type="button"` prevents accidental form submission if user presses Enter
- `tabIndex={-1}` meets the spec requirement
- `aria-label` changes between "Show password" and "Hide password" for screen readers
- `aria-hidden` on the icon since the button label describes it
- Drop-in replacement — same `name`, `id`, `required` props pass through

### Pattern 2: PasswordStrengthChecklist Component

**What:** A live checklist that checks password requirements client-side as the user types. Pure display component, takes `password: string` prop.

**When to use:** Rendered below the password field in sign-up and update-password forms. Only shown/relevant when the user starts typing (can show all-unchecked on empty, or hide until first keypress).

**Requirements to check (from phase spec):**
1. Minimum length (8 characters — matches existing `signUpSchema` min)
2. Uppercase letter (`/[A-Z]/`)
3. Number (`/[0-9]/`)
4. Special character (`/[^A-Za-z0-9]/`)

**Example:**

```typescript
// components/ui/password-strength.tsx
// Source: pure client component, no external library
'use client'

import { CheckCircle, XCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Requirement {
  label: string
  met: boolean
}

function getRequirements(password: string): Requirement[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function PasswordStrengthChecklist({ password }: { password: string }) {
  const requirements = getRequirements(password)
  // Don't render anything until the user has started typing
  if (!password) return null

  return (
    <ul className="mt-2 space-y-1" aria-live="polite" aria-label="Password requirements">
      {requirements.map((req) => (
        <li key={req.label} className="flex items-center gap-2 text-xs">
          {req.met
            ? <CheckCircle size={14} weight="fill" className="text-success shrink-0" aria-hidden />
            : <XCircle size={14} weight="regular" className="text-muted-foreground shrink-0" aria-hidden />
          }
          <span className={cn(req.met ? 'text-success-foreground' : 'text-muted-foreground')}>
            {req.label}
          </span>
        </li>
      ))}
    </ul>
  )
}
```

**Key details:**
- `aria-live="polite"` so screen readers announce changes without interrupting
- Only renders if `password` is non-empty (avoids showing failure state before user touches field)
- Uses `success` and `muted-foreground` tokens that exist in `globals.css` (verified)
- `CheckCircle` with `weight="fill"` matches the project pattern (used in `add-customer-sheet.tsx`)

### Pattern 3: Wiring into Forms — Controlled Password State

The auth forms currently use Server Actions via `<form action={formAction}>`. The inputs are uncontrolled (no `value` prop). Adding the strength checklist requires tracking the password value client-side.

**The approach:** Add `useState` for `passwordValue`. Bind `onChange` to update it. The input still has `name="password"` so it participates in form submission normally. Server Action still receives the value via `FormData`.

**Example (sign-up-form.tsx):**

```typescript
// In SignUpForm component body:
const [passwordValue, setPasswordValue] = React.useState('')

// In JSX, replace the <Input> with <PasswordInput>:
<PasswordInput
  id="signup-password"
  name="password"
  required
  value={passwordValue}
  onChange={(e) => setPasswordValue(e.target.value)}
/>
{/* Checklist directly below */}
<PasswordStrengthChecklist password={passwordValue} />
```

**For login-form.tsx:** Only needs `PasswordInput` toggle, no checklist. No controlled state needed — uncontrolled is fine for login (no strength requirements shown).

**For update-password-form.tsx:** Has two fields (`password` and `confirmPassword`). Needs `PasswordInput` on both + checklist on the `password` field only. Needs `useState` for `passwordValue` to drive the checklist.

### Pattern 4: Required-Field Validation with Inline Errors

**Current state:** Forms already have inline error display via `state?.fieldErrors?.password` from Server Actions. The `required` HTML attribute is on inputs. No `noValidate` on the form means browser-native validation fires first, which is inconsistent styling.

**What to add:**
1. Add `noValidate` to `<form>` elements in `sign-up-form.tsx` and `update-password-form.tsx` to suppress browser popup validation
2. The Server Action already returns `fieldErrors` from Zod — this drives the inline error text
3. Add `aria-invalid` and `aria-describedby` on inputs that have errors for accessibility

**Visual indicator pattern** — add red border on error, matching the Button's `aria-invalid` styling already in `button.tsx`:

```typescript
// Input gets aria-invalid when error exists
<PasswordInput
  id="signup-password"
  name="password"
  required
  aria-invalid={!!state?.fieldErrors?.password}
  aria-describedby={state?.fieldErrors?.password ? 'signup-password-error' : undefined}
  ...
/>
{state?.fieldErrors?.password && (
  <p id="signup-password-error" className="text-sm text-error-text" role="alert">
    {state.fieldErrors.password[0]}
  </p>
)}
```

**The Input component already has:**
```
aria-invalid styling: [nothing explicit in input.tsx]
```

The existing `input.tsx` does NOT have `aria-invalid` styling. We should add it:

```typescript
// input.tsx — add to className:
"aria-invalid:border-destructive aria-invalid:ring-destructive/20"
```

This is consistent with `button.tsx` which already has `aria-invalid:ring-destructive/20 aria-invalid:border-destructive`.

### Pattern 5: Google OAuth Verification

**Current implementation is complete.** The flow is:

```
1. User clicks GoogleOAuthButton → handleClick() called
2. signInWithGoogle() server action called
3. supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: NEXT_PUBLIC_SITE_URL/auth/callback })
4. Returns { url: string } — the Google consent screen URL
5. window.location.href = result.url — navigates to Google
6. After consent, Google redirects to /auth/callback?code=...
7. Route handler calls exchangeCodeForSession(code)
8. Redirects to /dashboard
```

The code is correct. Failures are infrastructure, not code:

| Failure Mode | Check |
|--------------|-------|
| Google provider not enabled | Supabase Dashboard → Authentication → Providers → Google |
| Redirect URL not allowlisted | Supabase Dashboard → Authentication → URL Configuration → Redirect URLs |
| Missing Google credentials | Supabase Dashboard → Authentication → Providers → Google (Client ID + Secret) |
| NEXT_PUBLIC_SITE_URL mismatch | `.env` vs Supabase allowed redirect list |
| PKCE code verifier cookie lost | Cross-subdomain cookie (uses `@supabase/ssr` createBrowserClient — PKCE handles automatically) |

**The plan-36-03 task is a verification checklist, not a code build.**

### Anti-Patterns to Avoid

- **Do not add a strength library (zxcvbn, etc.):** Over-engineered for 4 simple regex rules. Hand-rolling the 4 regex checks is correct here.
- **Do not add `tabIndex={0}` to the toggle button:** Browser default is 0, but the spec says `tabIndex={-1}`.
- **Do not show the checklist on page load (empty password):** Showing all-red requirements before the user types is discouraging. Hide until `password.length > 0`.
- **Do not use `type="submit"` on the toggle button:** It would submit the form. Always `type="button"`.
- **Do not move the toggle outside the `relative` wrapper:** The absolute positioning depends on a positioned ancestor.
- **Do not change the Server Actions:** All password strengthening is client-side display only. The Zod schema validation server-side is the source of truth for actual rejection.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Eye icon | SVG from scratch | `Eye` / `EyeSlash` from `@phosphor-icons/react` | Project standard, consistent weight |
| Checklist check icon | Custom SVG | `CheckCircle` / `XCircle` from `@phosphor-icons/react` | Already used in `add-customer-sheet.tsx` |
| Password strength bar | Gradient progress bar | Simple checklist (4 items) | Spec says checklist, not bar |
| OAuth flow | Custom PKCE | Supabase `signInWithOAuth` | Already implemented |

**Key insight:** The four password requirement regexes are genuinely simple — this is the one case where hand-rolling is appropriate. A library like `zxcvbn` would be over-engineering.

---

## Common Pitfalls

### Pitfall 1: Toggle Button Inside `<form>` Without `type="button"`

**What goes wrong:** Browser treats `<button>` without explicit `type` as `type="submit"`. Clicking the eye icon submits the form.

**Why it happens:** HTML spec default for `<button>` type is `"submit"` when inside a form.

**How to avoid:** Always `type="button"` on the toggle.

**Warning signs:** Form submits when clicking the eye icon.

### Pitfall 2: `tabIndex={-1}` vs `tabIndex={0}`

**What goes wrong:** Toggle button receives Tab focus, disrupting the expected Tab order (email → password → submit).

**Why it happens:** Default `tabIndex` for interactive elements is 0, making them focusable.

**How to avoid:** Explicitly set `tabIndex={-1}` on the toggle button.

**Warning signs:** Pressing Tab from the password field focuses the eye icon instead of the submit button.

### Pitfall 3: Checklist Shows All-Failed Before User Types

**What goes wrong:** User sees four red X marks before they've typed anything. Feels accusatory.

**Why it happens:** Empty string fails all requirements.

**How to avoid:** Return `null` from `PasswordStrengthChecklist` when `password` is empty.

**Warning signs:** Red checklist visible on form load.

### Pitfall 4: Uncontrolled Input Cannot Drive the Checklist

**What goes wrong:** `PasswordStrengthChecklist` never updates because it has no reference to the typed value.

**Why it happens:** The original forms use uncontrolled inputs (no `value`/`onChange`). Without controlling the state, there's no React signal to re-render the checklist.

**How to avoid:** Add `useState` for `passwordValue` in the form component and bind `value` + `onChange` to the password input. `name="password"` still works for FormData submission.

**Warning signs:** Checklist renders but never changes as the user types.

### Pitfall 5: `aria-invalid` Not Styled on Input

**What goes wrong:** The spec requires "red border, helper text" on invalid fields. The existing `input.tsx` has no `aria-invalid` styling. Adding `aria-invalid` to the input without the CSS rule does nothing visual.

**Why it happens:** `aria-invalid` is a semantic attribute; it doesn't trigger visual changes without CSS selectors.

**How to avoid:** Add `aria-invalid:border-destructive aria-invalid:ring-destructive/20` to `input.tsx` className.

**Warning signs:** Input border stays gray even when error text appears below it.

### Pitfall 6: Google OAuth Redirect URL Mismatch

**What goes wrong:** Google consent screen completes, redirects to `/auth/callback`, but Supabase returns an error like "redirect_uri_mismatch".

**Why it happens:** `NEXT_PUBLIC_SITE_URL` value does not match a URL in the Supabase redirect URL allowlist.

**How to avoid:** The Supabase dashboard Redirect URLs list must include both `http://localhost:3000/auth/callback` (for local dev) and `https://avisloop.com/auth/callback` (for production).

**Warning signs:** OAuth error page with "redirect_uri_mismatch" or similar message.

### Pitfall 7: Password Exposed in URL After Toggle

**What goes wrong:** Some browsers save `type="text"` input values in autofill or session storage, potentially leaking the password.

**Why it happens:** When you change `type` from `password` to `text`, some browser autofill implementations treat it differently.

**How to avoid:** Use `autoComplete="current-password"` (or `new-password` for signup) and `autoComplete="off"` for the confirm field. This is a best-practice addition, not critical.

---

## Code Examples

Verified patterns from project codebase:

### Relative/Absolute Overlay (from quick-send-tab.tsx)

```typescript
// Source: /c/AvisLoop/components/send/quick-send-tab.tsx lines 344-380
<div className="relative">
  <input
    type="text"
    className="w-full pl-9 pr-10 py-2 ..."
  />
  <button
    type="button"
    onClick={...}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  >
    <X size={16} weight="bold" />
  </button>
</div>
```

### CheckCircle / XCircle Usage (from csv-preview-table.tsx)

```typescript
// Source: /c/AvisLoop/components/customers/csv-preview-table.tsx lines 57-63
import { CheckCircle, XCircle } from '@phosphor-icons/react'

statusIcon = <XCircle size={16} className="text-destructive" />
statusIcon = <CheckCircle size={16} className="text-success" />
```

### useActionState with Controlled Input (from add-customer-sheet.tsx)

```typescript
// Source: /c/AvisLoop/components/customers/add-customer-sheet.tsx
const [state, formAction, isPending] = useActionState<CustomerActionState | null, FormData>(
  async (prevState, formData) => {
    const result = await createCustomer(prevState, formData)
    return result
  },
  null
)

// ...controlled local state alongside Server Action form:
const [timezone, setTimezone] = useState('America/New_York')
```

### Phosphor Eye Icons

```typescript
// Confirmed exported from @phosphor-icons/react:
// dist/index.d.ts line 549: export * from './csr/Eye'
// dist/index.d.ts line 551: export * from './csr/EyeSlash'

import { Eye, EyeSlash } from '@phosphor-icons/react'

<Eye size={16} weight="regular" aria-hidden />
<EyeSlash size={16} weight="regular" aria-hidden />
```

### Supabase OAuth Flow (existing, verified working)

```typescript
// Source: /c/AvisLoop/lib/actions/auth.ts lines 182-197
export async function signInWithGoogle(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (error) return { error: error.message }
  if (data.url) return { url: data.url }
  return { error: 'Failed to get OAuth URL from provider' }
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact for This Phase |
|--------------|------------------|----------------------|
| Browser default `type="password"` with no toggle | Show/hide toggle with Eye icon | Build the toggle |
| `required` HTML attribute for validation | `noValidate` + server-side Zod errors + `aria-invalid` | Add `noValidate`, `aria-invalid`, update `input.tsx` |
| No password strength feedback | Live checklist with 4 requirements | Build the checklist component |
| OAuth with manual PKCE setup | `@supabase/ssr` handles PKCE automatically | Already implemented |

**Deprecated/outdated:**
- Using `zxcvbn` for simple password requirements: overkill when requirements are 4 fixed rules
- Browser native validation popups: inconsistent across browsers, suppress with `noValidate`

---

## Open Questions

1. **Should the strength checklist also appear on login-form?**
   - What we know: Spec says signup and password reset forms only
   - What's unclear: The login form has a password field but no strength requirements
   - Recommendation: Do not add checklist to login. Login doesn't create passwords, it only verifies them.

2. **Should the update-password-form add strength rules to the Zod schema?**
   - What we know: The checklist shows 4 rules; the server currently only checks `min(8)` and `max(72)`
   - What's unclear: The spec says "show clear required-field validation" but doesn't say server must also enforce strength rules
   - Recommendation: For consistency, add the regex rules to `updatePasswordSchema` so server errors match what the checklist shows. This is LOW risk and prevents valid-looking passwords being rejected server-side anyway.

3. **Is Google OAuth actually broken or just unverified?**
   - What we know: The code is correct and complete; Supabase `@supabase/ssr` 0.8.0 handles PKCE
   - What's unclear: Whether the Supabase dashboard has Google provider enabled with correct credentials
   - Recommendation: Plan 36-03 should be a structured verification checklist (dashboard config check, local test, production test)

---

## Sources

### Primary (HIGH confidence)

- `/c/AvisLoop/components/auth/google-oauth-button.tsx` — current OAuth implementation
- `/c/AvisLoop/lib/actions/auth.ts` — Server Action implementations
- `/c/AvisLoop/lib/validations/auth.ts` — current Zod schemas
- `/c/AvisLoop/components/login-form.tsx` — current login form
- `/c/AvisLoop/components/sign-up-form.tsx` — current sign-up form
- `/c/AvisLoop/components/update-password-form.tsx` — current update-password form
- `/c/AvisLoop/components/ui/input.tsx` — Input component (no aria-invalid styling)
- `/c/AvisLoop/components/ui/button.tsx` — Button component (has aria-invalid styling as reference)
- `/c/AvisLoop/app/globals.css` — confirmed `--success`, `--error-text`, `--muted-foreground` tokens
- `/c/AvisLoop/app/auth/callback/route.ts` — OAuth callback route
- `/c/AvisLoop/node_modules/@phosphor-icons/react/dist/index.d.ts` — confirmed Eye, EyeSlash, CheckCircle, XCircle exports

### Secondary (MEDIUM confidence)

- `/c/AvisLoop/components/send/quick-send-tab.tsx` — confirmed relative/absolute overlay pattern
- `/c/AvisLoop/components/customers/csv-preview-table.tsx` — confirmed CheckCircle/XCircle usage pattern

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all libraries already in project, versions verified
- Architecture: HIGH — patterns derived directly from existing codebase
- Pitfalls: HIGH — based on code analysis, not speculation
- Google OAuth: HIGH — code is complete; failures are infrastructure configuration

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable dependencies, no fast-moving APIs)
