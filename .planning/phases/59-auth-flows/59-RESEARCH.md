# Phase 59: Auth Flows Audit - Research

**Researched:** 2026-02-27
**Domain:** QA E2E testing of authentication flows (login, signup, password reset, session durability, error handling)
**Confidence:** HIGH

---

## Summary

Phase 59 is a **QA E2E audit** — no new features to build. The goal is to use Playwright MCP tools to exercise all authentication paths and verify they work correctly. This research catalogs every auth route, form, validation rule, server action, error message, and redirect so the planner can write precise step-by-step test scripts.

The AvisLoop auth system is built on Supabase Auth (email/password + Google OAuth) with Next.js middleware for route protection. There are 4 core auth forms (login, signup, forgot-password, update-password), 2 API route handlers (OAuth callback, email confirm), and a comprehensive middleware that redirects unauthenticated users away from protected routes and authenticated users away from auth pages.

**Primary recommendation:** Structure the plan as one PLAN file with 5 tasks mapping 1:1 to the 5 requirements (AUTH-01 through AUTH-05). Each task is a Playwright MCP walkthrough with explicit selectors, expected text, and pass/fail criteria. Password reset (AUTH-03) cannot be fully end-to-end tested because it requires email delivery — document what CAN be tested (form submission success) and what CANNOT (clicking the email link).

---

## Standard Stack

### This Is a QA Phase — No Libraries to Install

The testing approach uses **Playwright MCP tools** (browser_navigate, browser_snapshot, browser_click, browser_type, browser_take_screenshot, etc.) and **Supabase MCP** (execute_sql) for database verification. No `@playwright/test` files are written — all testing is interactive via MCP.

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `browser_navigate` | Navigate to auth pages | Every test start |
| `browser_snapshot` | Get accessible page structure for selectors | Before every interaction |
| `browser_click` | Click buttons, links | Form submission, navigation |
| `browser_type` | Type into inputs | Email, password fields |
| `browser_take_screenshot` | Capture evidence | Every finding, every viewport |
| `browser_fill_form` | Fill multiple fields at once | Login/signup forms |
| `browser_press_key` | Press Enter, Tab, etc. | Form submission via keyboard |
| `browser_wait_for` | Wait for text/navigation | After form submission |
| `browser_console_messages` | Check for JS errors | After every page load |
| `mcp__supabase__execute_sql` | Verify DB state | Session verification, account creation |

---

## Architecture: Auth System Map

### Route Map (All Auth Pages)

| Route | Component | Layout | Purpose |
|-------|-----------|--------|---------|
| `/login` | Redirects to `/auth/login` | N/A | Legacy redirect |
| `/signup` | Redirects to `/auth/sign-up` | N/A | Legacy redirect |
| `/auth/login` | `LoginForm` | `AuthSplitLayout` | Email/password login |
| `/auth/sign-up` | `SignUpForm` | `AuthSplitLayout` | Account creation |
| `/auth/forgot-password` | `ForgotPasswordForm` | Centered card | Request password reset |
| `/auth/update-password` | `UpdatePasswordForm` | Centered card | Set new password (from email link) |
| `/auth/sign-up-success` | Static card | Centered card | "Thank you for signing up!" (UNUSED — signUp redirects to /verify-email) |
| `/auth/error` | Static card | Centered card | "Sorry, something went wrong" with error code |
| `/auth/callback` | Route handler (GET) | N/A | OAuth code exchange |
| `/auth/confirm` | Route handler (GET) | N/A | Email verification / password recovery token |
| `/verify-email` | Static card | Centered card | "Check your email" after signup |

### AuthSplitLayout Structure

Used by login and sign-up pages:
- **Left half:** Logo header ("AvisLoop" link to /) + centered form area (max-w-sm)
- **Right half:** Gradient panel with large "A" placeholder (hidden on mobile, `lg:block`)
- Full min-h-screen grid, 1 column mobile, 2 columns desktop (lg breakpoint)

### Middleware Auth Logic (middleware.ts)

**Protected routes** (require auth — redirect to `/login` if no user):
- `/dashboard`, `/protected`, `/contacts`, `/customers`, `/send`, `/history`, `/billing`, `/onboarding`, `/scheduled`, `/settings`, `/jobs`, `/campaigns`, `/analytics`, `/activity`, `/feedback`, `/businesses`

**Auth page redirect** (authenticated users redirected to `/dashboard`):
- `/login`, `/signup`, `/auth/login`, `/auth/sign-up`

**Domain routing** (production only, skipped on localhost):
- Marketing domain (avisloop.com): APP_ROUTES redirect to app.avisloop.com
- App domain (app.avisloop.com): Root `/` redirects to `/dashboard`, marketing routes redirect to avisloop.com
- Exception: `/login` and `/signup` stay on app domain

**Cookie handling:**
- Cross-subdomain: Cookie domain set to `.avisloop.com` in production
- JWT validation: Uses `getUser()` (validates signature), NOT `getSession()` (doesn't validate)

---

## Architecture: Form Details

### Login Form (`components/login-form.tsx`)

**Fields:**
| Field | ID | Name | Type | Label | Placeholder | Validation |
|-------|----|------|------|-------|-------------|------------|
| Email | `login-email` | `email` | email | "Email" | "m@example.com" | Required, valid email |
| Password | `login-password` | `password` | password (PasswordInput) | "Password" | none | Required (min 1 char) |

**Buttons/Links:**
| Element | Text | Behavior |
|---------|------|----------|
| Submit button | "Login" (idle) / "Logging in..." (pending) | `formAction` → `signIn` server action |
| Forgot password link | "Forgot your password?" | Navigates to `/auth/forgot-password` |
| Sign up link | "Sign up" | Navigates to `/auth/sign-up` |
| Google OAuth button | "Continue with Google" | `signInWithGoogle()` → redirect to Google |

**Error display:**
- Field-level: `state.fieldErrors.email` / `state.fieldErrors.password` — red text below field, `role="alert"`
- Form-level: `state.error` — dismissible red text button (click to dismiss), resets on new submission
- Error text CSS class: `text-error-text`

**Server Action (`signIn`):**
1. Rate limit check (5/min per IP via Upstash, bypassed in dev)
2. Zod validation (`signInSchema`): email required + valid, password required (min 1 char)
3. `supabase.auth.signInWithPassword({ email, password })`
4. On success: `revalidatePath('/', 'layout')` then `redirect('/dashboard')`
5. On error: returns `{ error: error.message }` (Supabase error message)

**Known Supabase error messages for invalid credentials:**
- "Invalid login credentials" — wrong email or password
- "Email not confirmed" — user signed up but hasn't verified email

### Sign-Up Form (`components/sign-up-form.tsx`)

**Fields:**
| Field | ID | Name | Type | Label | Placeholder | Validation |
|-------|----|------|------|-------|-------------|------------|
| Full Name | `signup-fullName` | `fullName` | text | "Full Name (optional)" | "John Doe" | Optional, max 100 chars |
| Email | `signup-email` | `email` | email | "Email" | "m@example.com" | Required, valid email |
| Password | `signup-password` | `password` | password (PasswordInput) | "Password" | none | 8+ chars, 1 uppercase, 1 number, 1 special |

**Additional UI elements:**
- `PasswordStrengthChecklist` — live checklist below password field (appears when password has any value)
- Google OAuth button
- Link to `/auth/login`

**Password strength requirements (checklist + Zod schema):**
1. At least 8 characters
2. One uppercase letter
3. One number
4. One special character

**Checklist visual indicators:**
- Met: Green `CheckCircle` (filled) + `text-success-foreground`
- Unmet: Gray `XCircle` (regular) + `text-muted-foreground`
- Aria: `aria-live="polite"`, `aria-label="Password requirements"`

**Server Action (`signUp`):**
1. Rate limit (5/min per IP)
2. Zod validation (`signUpSchema`)
3. `supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: { full_name } } })`
4. On success: `redirect('/verify-email')`
5. On error: returns `{ error: error.message }`
6. Email redirect target: `${NEXT_PUBLIC_SITE_URL}/auth/confirm`

**Post-signup flow:**
- User lands on `/verify-email` — static page saying "Check your email"
- User clicks link in email → `/auth/confirm?token_hash=X&type=signup`
- `/auth/confirm` route calls `verifyOtp({ type, token_hash })`
- On success (signup type): redirects to `/dashboard`
- Dashboard page calls `getActiveBusiness()` — returns null for new user (no business yet)
- Dashboard redirects to `/onboarding`

### Forgot Password Form (`components/forgot-password-form.tsx`)

**Fields:**
| Field | ID | Name | Type | Label | Placeholder | Validation |
|-------|----|------|------|-------|-------------|------------|
| Email | `forgot-email` | `email` | email | "Email" | "m@example.com" | Required, valid email |

**States:**
1. **Default state:** Card with "Reset Your Password" title + email form + "Send reset email" button
2. **Success state:** Card with "Check Your Email" title + "Password reset instructions sent" description

**Server Action (`resetPassword`):**
1. Rate limit (5/min per IP)
2. Zod validation (`resetPasswordSchema`)
3. `supabase.auth.resetPasswordForEmail(email, { redirectTo: '${SITE_URL}/auth/update-password' })`
4. On success: returns `{ success: true }` (shows success card)
5. On error: returns `{ error: error.message }`

### Update Password Form (`components/update-password-form.tsx`)

**Fields:**
| Field | ID | Name | Type | Label | Placeholder | Validation |
|-------|----|------|------|-------|-------------|------------|
| New password | `password` | `password` | password (PasswordInput) | "New password" | "New password" | 8+ chars, 1 uppercase, 1 number, 1 special |
| Confirm password | `confirmPassword` | `confirmPassword` | password (PasswordInput) | "Confirm password" | "Confirm password" | Must match password |

**Additional elements:**
- `PasswordStrengthChecklist` below new password field
- No Google OAuth button (this is a password update, not login)

**Server Action (`updatePassword`):**
1. No rate limit (user is already authenticated via recovery token)
2. Zod validation (`updatePasswordSchema`): password rules + confirm match
3. `supabase.auth.updateUser({ password })`
4. On success: `revalidatePath('/', 'layout')` then `redirect('/dashboard')`
5. On error: returns `{ error: error.message }`

**How user arrives here:**
1. User requests reset via forgot-password form
2. Supabase sends email with link to `${SITE_URL}/auth/update-password`
3. Email link contains a recovery token (magic link format)
4. Supabase SSR middleware exchanges the token for a session automatically
5. User arrives at `/auth/update-password` already authenticated (recovery session)

### PasswordInput Component (`components/ui/password-input.tsx`)

- Wraps standard `Input` with relative div
- Show/hide toggle button (Eye/EyeSlash icons from Phosphor)
- `maxLength={72}` (bcrypt limit)
- `aria-label="Show password"` / `"Hide password"` on toggle
- Toggle is `type="button"` (does not submit form)

### Google OAuth Flow

**Client-side (`components/auth/google-oauth-button.tsx`):**
1. Calls `signInWithGoogle()` server action
2. Server action calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '${SITE_URL}/auth/callback' } })`
3. Returns `{ url: data.url }` — Google consent URL
4. Client does `window.location.href = result.url` (full page redirect to Google)

**Callback route (`app/auth/callback/route.ts`):**
1. Receives `?code=X` from Google OAuth redirect
2. Calls `supabase.auth.exchangeCodeForSession(code)`
3. On success: redirects to `app.avisloop.com/dashboard` (or localhost equivalent)
4. On error: redirects to `/auth/error`
5. Has redirect validation (prevents open redirects)

**Testing note:** Google OAuth cannot be fully automated via Playwright. The plan should verify the button is present and functional (initiates the flow), but document that the Google consent screen interaction is not automatable.

---

## Architecture: Session Persistence

### How Supabase SSR Sessions Work

1. **Login/signup** creates JWT tokens stored in cookies (access_token + refresh_token)
2. **Middleware** runs on every request, calls `getUser()` which validates JWT
3. **Cookie refresh**: `setAll` in middleware updates cookies on every request (silent token refresh)
4. **Server components** create fresh Supabase client per request (`createClient()` in `lib/supabase/server.ts`)
5. **Browser client** (`lib/supabase/client.ts`) uses `createBrowserClient` — reads cookies automatically

### Session Durability Expectations

- **Page refresh**: Session persists (cookies survive refresh)
- **Tab switch**: Session persists (cookies are per-browser, not per-tab)
- **Browser back/forward**: Session persists (cookies remain)
- **Token expiry**: Supabase auto-refreshes tokens via middleware `setAll`
- **Cross-subdomain**: `.avisloop.com` cookie domain in production enables auth across marketing + app subdomains

### How to Verify Session (for AUTH-04)

1. Login successfully
2. Navigate to dashboard, confirm data loads
3. Refresh page — dashboard should still show data (not redirect to login)
4. Navigate back — should remain on dashboard
5. Navigate forward — should remain on dashboard
6. Open a new tab to `/dashboard` — should show dashboard (not login)

### Post-Login Flow for Existing Users

```
Login → signIn() → redirect('/dashboard')
  → Middleware: user exists, not auth page → pass through
  → Dashboard layout: getActiveBusiness() → returns business (cookie or fallback)
  → Dashboard page: business exists → render dashboard with KPIs, queue, alerts
```

### Post-Login Flow for New Users (No Business)

```
Login → signIn() → redirect('/dashboard')
  → Middleware: user exists → pass through
  → Dashboard layout: getActiveBusiness() → returns null (no businesses)
  → Dashboard page: business is null → redirect('/onboarding')
  → Onboarding page: user exists, no business → render OnboardingWizard
```

---

## Common Pitfalls

### Pitfall 1: Rate Limiting Blocks Tests in Production

**What goes wrong:** Auth rate limit is 5 attempts per minute per IP. Running multiple test iterations (login, wrong password, login again, etc.) can trigger the rate limiter.
**Why it happens:** Upstash Redis rate limiting configured for production/staging.
**How to avoid:** In local dev, Upstash is not configured — rate limiting is bypassed (`returns { success: true }`). Tests on localhost are safe. If testing against production/staging, space out attempts or clear rate limits between test runs.
**Warning signs:** Error message "Too many attempts. Please wait a moment and try again."

### Pitfall 2: Signup Requires Email Verification (Cannot Complete E2E)

**What goes wrong:** `signUp` redirects to `/verify-email`, but completing verification requires clicking a link in a real email. Playwright cannot access email.
**Why it happens:** Supabase auth is configured to require email verification.
**How to avoid:** For AUTH-02 testing, verify the signup form submission succeeds (redirect to /verify-email), but do NOT attempt to complete the full flow through email verification. Document as "email delivery is out of scope." Use the pre-existing test account (audit-test@avisloop.com) for all subsequent authenticated tests.
**Alternative:** If Supabase has "Confirm email" disabled for dev, signup may auto-confirm. Check behavior.

### Pitfall 3: Password Reset Also Requires Email

**What goes wrong:** AUTH-03 requires testing password reset end-to-end, but the reset link comes via email.
**Why it happens:** Same as Pitfall 2 — email delivery is external.
**How to avoid:** Test the forgot-password form submission (verify success state shows "Check Your Email" card). Test the update-password form separately IF the tester can navigate directly to `/auth/update-password` (may require a valid recovery session). Document the email gap.

### Pitfall 4: /auth/update-password Requires Recovery Session

**What goes wrong:** Navigating directly to `/auth/update-password` without a recovery token means the user has no active session, so `supabase.auth.updateUser({ password })` will fail.
**Why it happens:** The update-password page expects the user to arrive via a recovery email link, which establishes a temporary recovery session.
**How to avoid:** Test the form rendering and validation. For the actual password update, either: (a) use the Supabase admin API to generate a recovery link, or (b) test with an already-authenticated user session (login first, then navigate to update-password). Document limitations.

### Pitfall 5: Authenticated User Redirect Away From Auth Pages

**What goes wrong:** After logging in for AUTH-01, navigating back to `/auth/login` redirects to `/dashboard` (middleware behavior). This is correct behavior but can confuse test scripts.
**Why it happens:** Middleware line 138-151 redirects authenticated users away from login/signup.
**How to avoid:** When testing AUTH-05 (invalid credentials), either: (a) sign out first, or (b) open a fresh browser context. Plan must account for sign-out between tests.

### Pitfall 6: Second Test Account for True First-Run

**What goes wrong:** The primary test account (audit-test@avisloop.com) already has a completed business. Testing AUTH-02 (signup → onboarding redirect) requires a truly new account that has never completed onboarding.
**Why it happens:** Once a business exists and onboarding is complete, the dashboard page no longer redirects to onboarding.
**How to avoid:** Either create a fresh account during testing (email verification may block this — see Pitfall 2) or use Supabase admin API to create a user without a business. Document the limitation if fresh signup cannot be fully verified.

---

## Code Examples

### Playwright MCP: Login Flow Test

```
1. browser_navigate → http://localhost:3000/auth/login
2. browser_snapshot → Get page structure, find email/password fields
3. browser_type → ref for email input, text: "audit-test@avisloop.com"
4. browser_type → ref for password input, text: "AuditTest123!"
5. browser_click → ref for "Login" button
6. browser_wait_for → text: "Dashboard" or "Good morning/afternoon/evening"
7. browser_snapshot → Verify dashboard content loaded
8. browser_take_screenshot → Evidence
```

### Playwright MCP: Invalid Credentials Test

```
1. browser_navigate → http://localhost:3000/auth/login
2. browser_snapshot → Get page structure
3. browser_type → ref for email input, text: "wrong@email.com"
4. browser_type → ref for password input, text: "WrongPassword1!"
5. browser_click → ref for "Login" button
6. browser_wait_for → text: "Invalid login credentials"
7. browser_snapshot → Verify error message visible, not a crash
8. browser_take_screenshot → Evidence
```

### Playwright MCP: Empty Field Validation Test

```
1. browser_navigate → http://localhost:3000/auth/login
2. browser_snapshot → Get page structure
3. browser_click → ref for "Login" button (submit empty form)
4. browser_snapshot → Look for "Email is required" and "Password is required" text
5. browser_take_screenshot → Evidence
```

### Playwright MCP: Session Durability Test

```
1. Login successfully (steps from Login Flow Test above)
2. browser_snapshot → Verify on dashboard
3. browser_navigate → http://localhost:3000/dashboard (simulate refresh)
4. browser_wait_for → text: "Dashboard" (not "Login" or "Welcome back")
5. browser_snapshot → Verify still on dashboard, data visible
6. browser_navigate_back → Go back
7. browser_snapshot → Verify still authenticated (not on login page)
8. browser_navigate → http://localhost:3000/jobs (another protected route)
9. browser_snapshot → Verify jobs page loads (not redirected to login)
```

### Playwright MCP: Forgot Password Form Test

```
1. browser_navigate → http://localhost:3000/auth/forgot-password
2. browser_snapshot → Verify "Reset Your Password" heading
3. browser_type → ref for email input, text: "audit-test@avisloop.com"
4. browser_click → ref for "Send reset email" button
5. browser_wait_for → text: "Check Your Email"
6. browser_snapshot → Verify success card with "Password reset instructions sent"
7. browser_take_screenshot → Evidence
```

### Database Verification: Check User Exists After Signup Attempt

```sql
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'test-new-signup@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Selectors Reference (from code analysis)

### Login Page Selectors

| Element | Strategy | Selector |
|---------|----------|----------|
| Email input | by label | "Email" (or id: `login-email`) |
| Password input | by label | "Password" (or id: `login-password`) |
| Submit button | by role | button "Login" |
| Forgot password link | by text | "Forgot your password?" |
| Sign up link | by text | "Sign up" |
| Google OAuth button | by text | "Continue with Google" |
| Page heading | by role | heading "Welcome back" |
| Error message | by role | `role="alert"` or text matching error |
| Dismiss error | by label | "Dismiss error" |

### Sign-Up Page Selectors

| Element | Strategy | Selector |
|---------|----------|----------|
| Full Name input | by label | "Full Name (optional)" (or id: `signup-fullName`) |
| Email input | by label | "Email" (or id: `signup-email`) |
| Password input | by label | "Password" (or id: `signup-password`) |
| Submit button | by role | button "Sign up" |
| Login link | by text | "Login" |
| Google OAuth button | by text | "Continue with Google" |
| Page heading | by role | heading "Create an account" |
| Password checklist | by label | "Password requirements" |

### Forgot Password Page Selectors

| Element | Strategy | Selector |
|---------|----------|----------|
| Email input | by label | "Email" (or id: `forgot-email`) |
| Submit button | by role | button "Send reset email" |
| Login link | by text | "Login" |
| Page heading | by role | heading "Reset Your Password" |
| Success heading | by role | heading "Check Your Email" |

### Update Password Page Selectors

| Element | Strategy | Selector |
|---------|----------|----------|
| New password | by label | "New password" (or id: `password`) |
| Confirm password | by label | "Confirm password" (or id: `confirmPassword`) |
| Submit button | by role | button "Save new password" |
| Page heading | by role | heading "Reset Your Password" |
| Password checklist | by label | "Password requirements" |

---

## Validation Rules Summary

### signInSchema

| Field | Rules | Error Messages |
|-------|-------|----------------|
| email | Required, valid email | "Email is required", "Please enter a valid email address" |
| password | Required (min 1 char) | "Password is required" |

### signUpSchema

| Field | Rules | Error Messages |
|-------|-------|----------------|
| email | Required, valid email | "Email is required", "Please enter a valid email address" |
| password | 8+ chars, uppercase, number, special | "Password must be at least 8 characters", "...at least one uppercase letter", "...at least one number", "...at least one special character" |
| fullName | Optional, max 100 chars | "Full name must be less than 100 characters" |

### resetPasswordSchema

| Field | Rules | Error Messages |
|-------|-------|----------------|
| email | Required, valid email | "Email is required", "Please enter a valid email address" |

### updatePasswordSchema

| Field | Rules | Error Messages |
|-------|-------|----------------|
| password | 8+ chars, uppercase, number, special | Same as signUpSchema |
| confirmPassword | Required, must match password | "Please confirm your password", "Passwords do not match" |

---

## Error Messages Reference

### Client-Side Validation Errors (Zod)

| Scenario | Message | Source |
|----------|---------|--------|
| Empty email | "Email is required" | Zod .min(1) |
| Invalid email format | "Please enter a valid email address" | Zod .email() |
| Empty password (login) | "Password is required" | Zod .min(1) |
| Short password (signup) | "Password must be at least 8 characters" | Zod .min(8) |
| No uppercase (signup) | "Password must contain at least one uppercase letter" | Zod .regex() |
| No number (signup) | "Password must contain at least one number" | Zod .regex() |
| No special char (signup) | "Password must contain at least one special character" | Zod .regex() |
| Passwords don't match | "Passwords do not match" | Zod .refine() |

### Server-Side Errors (Supabase Auth)

| Scenario | Message | Source |
|----------|---------|--------|
| Wrong credentials | "Invalid login credentials" | Supabase signInWithPassword |
| Unconfirmed email | "Email not confirmed" | Supabase signInWithPassword |
| Rate limited | "Too many attempts. Please wait a moment and try again." | Custom (checkAuthRateLimit) |
| Duplicate signup email | "User already registered" | Supabase signUp |

---

## Viewport & Theme Matrix

Per `.planning/STATE.md` specifications:

| Viewport | Dimensions | Auth Pages to Test |
|----------|------------|--------------------|
| Desktop | 1440x900 | All 4 auth pages |
| Tablet | 768x1024 | Login, Sign-up (AuthSplitLayout responsive) |
| Mobile | 390x844 | Login, Sign-up (single column, no right panel) |

| Theme | Auth Pages |
|-------|------------|
| Light | All 4 auth pages (always) |
| Dark | Login page only (per spec: "dark for dashboard, jobs, settings General tab" — auth pages not listed, but worth a quick check) |

**AuthSplitLayout responsive behavior:**
- `lg:` breakpoint (1024px): Right panel visible (gradient + "A" placeholder)
- Below `lg:`: Right panel hidden, form takes full width
- Tablet (768px): Will show single-column layout (right panel hidden)
- Mobile (390px): Single-column, full-width form

---

## Requirements → Test Mapping

### AUTH-01: Login with email/password → dashboard with correct business data

**What to test:**
1. Navigate to `/auth/login`
2. Verify page structure (heading, email field, password field, submit button)
3. Fill in test credentials: audit-test@avisloop.com / AuditTest123!
4. Submit form
5. Verify redirect to `/dashboard`
6. Verify dashboard shows business name (from active business)
7. Verify KPI widgets render (not blank/error)
8. Screenshot evidence

**Pass criteria:** User lands on dashboard, business data is visible, no error messages.

### AUTH-02: Signup creates account, redirects to onboarding

**What to test:**
1. Sign out from current session (if logged in)
2. Navigate to `/auth/sign-up`
3. Verify page structure (heading, name field, email field, password field with checklist)
4. Fill in new account: AUDIT_NewUser / audit-new-user-{timestamp}@test.com / AuditTest123!
5. Verify password checklist shows all green checks
6. Submit form
7. Verify redirect to `/verify-email` page
8. Verify "Check your email" content is shown
9. Screenshot evidence

**Limitation:** Cannot verify email confirmation or onboarding redirect. Document as "email delivery out of scope."

**Alternative approach:** If Supabase auto-confirms in dev mode, the redirect may go directly to `/dashboard` → `/onboarding`. Test this possibility.

### AUTH-03: Password reset flow

**What to test:**
1. Navigate to `/auth/forgot-password`
2. Verify page structure (heading "Reset Your Password", email field, submit button)
3. Enter email: audit-test@avisloop.com
4. Submit form
5. Verify success state: heading changes to "Check Your Email", description shows "Password reset instructions sent"
6. Screenshot evidence

**Test update-password form rendering (separate):**
1. Navigate to `/auth/update-password`
2. Verify page structure (heading, new password field with checklist, confirm password field, submit button)
3. Test validation: submit empty → verify error messages
4. Test password mismatch: fill different passwords → verify "Passwords do not match"
5. Screenshot evidence

**Limitation:** Cannot test actual password change without a recovery session from email link.

### AUTH-04: Session persists across refresh/navigation

**What to test (after AUTH-01 login):**
1. Verify on dashboard
2. Browser refresh (navigate to same URL) → still on dashboard
3. Navigate to `/jobs` → jobs page loads (not redirect to login)
4. Browser back → previous page (not login)
5. Browser forward → forward page (not login)
6. Navigate to `/settings` → settings page loads (not redirect to login)
7. Navigate to `/campaigns` → campaigns page loads (not redirect to login)
8. Screenshot evidence at each step

**Pass criteria:** No unexpected redirects to `/login`, all protected pages accessible.

### AUTH-05: Invalid credentials show clear error messages

**What to test:**
1. Navigate to `/auth/login` (sign out first if needed)
2. Submit empty form → verify "Email is required" and "Password is required"
3. Enter invalid email format (e.g., "notanemail") → submit → verify "Please enter a valid email address"
4. Enter valid email + wrong password → submit → verify "Invalid login credentials"
5. Verify error messages are in red text, role="alert"
6. Verify no raw error objects, no JSON, no stack traces
7. Verify error is dismissible (click to dismiss on login form)
8. Screenshot evidence for each error state

**Also test sign-up validation:**
1. Navigate to `/auth/sign-up`
2. Enter short password ("abc") → verify strength checklist shows X marks
3. Enter password without uppercase → verify specific checklist item shows X
4. Submit with invalid password → verify Zod error messages appear

---

## Open Questions

### 1. Email Verification Behavior in Dev Mode

- **What we know:** signUp action calls `supabase.auth.signUp()` with `emailRedirectTo`. In production, this sends a real email.
- **What's unclear:** Does the local dev Supabase instance require email confirmation? If auto-confirm is enabled, signup might redirect differently.
- **Recommendation:** Test the actual behavior — if redirect goes to `/verify-email`, document it. If redirect goes to `/dashboard` (auto-confirm), that changes AUTH-02 testing.

### 2. Update-Password Page Without Recovery Session

- **What we know:** The page renders the form, but `supabase.auth.updateUser()` requires an authenticated session (either normal login or recovery token).
- **What's unclear:** If a normally-logged-in user navigates to `/auth/update-password`, can they actually change their password? The middleware does NOT redirect authenticated users away from this route (only from login/signup).
- **Recommendation:** Test this — login normally, navigate to update-password, try to change password. This would verify the form works even without the email flow.

### 3. Google OAuth Button Testability

- **What we know:** Cannot automate the Google consent screen.
- **What's unclear:** Does clicking the button in dev cause errors (no Google OAuth configured) or does it just fail silently?
- **Recommendation:** Click the button, observe behavior (error toast? redirect to broken URL? auth error page?). Document the result but don't count it as a failure — it's infrastructure config, not app code.

---

## Sources

### Primary (HIGH confidence)

- **Codebase analysis** — Direct reading of all auth-related files:
  - `middleware.ts` — Route protection and redirect logic
  - `lib/actions/auth.ts` — All 5 server actions (signIn, signUp, signOut, resetPassword, updatePassword) + Google OAuth
  - `lib/validations/auth.ts` — Zod schemas for all forms
  - `components/login-form.tsx` — Login form UI + error handling
  - `components/sign-up-form.tsx` — Signup form UI + password checklist
  - `components/forgot-password-form.tsx` — Forgot password form + success state
  - `components/update-password-form.tsx` — Update password form + confirm match
  - `components/ui/password-input.tsx` — Show/hide toggle component
  - `components/ui/password-strength.tsx` — Checklist component with 4 rules
  - `components/auth/auth-split-layout.tsx` — Split layout for login/signup
  - `components/auth/google-oauth-button.tsx` — OAuth button component
  - `app/auth/callback/route.ts` — OAuth code exchange handler
  - `app/auth/confirm/route.ts` — Email verification handler
  - `lib/supabase/server.ts` — Server-side Supabase client with cookie handling
  - `lib/rate-limit.ts` — Rate limiting configuration (5 auth attempts/min)
  - `app/verify-email/page.tsx` — Post-signup check-email page

- **Previous QA audit context** — `.planning/QA-AUDIT-CONTEXT.md`, `.planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-01-PLAN.md`
- **Project state** — `.planning/STATE.md` (test account, viewports, themes, selector priority)
- **Requirements** — `.planning/REQUIREMENTS.md` (AUTH-01 through AUTH-05)

---

## Metadata

**Confidence breakdown:**
- Auth route map: HIGH — all routes read from source code
- Form fields & selectors: HIGH — all components read in full
- Error messages: HIGH — Zod schemas and Supabase error strings verified
- Session behavior: HIGH — middleware and cookie logic read from source
- Email flow limitations: HIGH — understood from code flow, documented honestly
- Viewport behavior: HIGH — AuthSplitLayout breakpoints verified from source

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable — auth code unlikely to change during QA audit)
