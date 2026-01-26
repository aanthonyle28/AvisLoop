# Phase 1: Foundation & Auth - Research

**Researched:** 2026-01-26
**Domain:** Next.js 15 App Router + Supabase Authentication
**Confidence:** HIGH

## Summary

Phase 1 implements email/password authentication with Supabase Auth for a Next.js 15 App Router application. The standard approach uses cookie-based server-side authentication with the `@supabase/ssr` package, implementing the PKCE flow for secure token exchange. Critical architectural requirements include middleware for token refresh (since Server Components can't write cookies), RLS policies enabled from day 1 for multi-tenant data isolation, and Server Actions for authentication mutations.

The research reveals that Supabase provides official, up-to-date support for Next.js 15 App Router with comprehensive documentation updated within the past few weeks. The ecosystem has converged on specific patterns: HTTP-only cookies for session storage, `getUser()` (not `getSession()`) for server-side auth checks, and email template modifications for PKCE flow compatibility.

**Primary recommendation:** Use Supabase's official Next.js App Router starter template as the foundation, which includes pre-configured cookie-based auth, middleware for token refresh, and proper client creation patterns. Customize from this proven base rather than building from scratch.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | Latest | Supabase JavaScript client | Official SDK for all Supabase services |
| @supabase/ssr | Latest | SSR auth helpers | Official package for Next.js App Router auth, replaces deprecated @supabase/auth-helpers |
| Next.js | 15+ | React framework | App Router with Server Components required for modern auth patterns |
| TypeScript | 5+ | Type safety | Essential for Supabase client type inference and auth state management |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7+ | Form state management | Sign up, sign in, password reset forms |
| zod | 3+ | Runtime validation | Validate auth inputs in Server Actions before Supabase calls |
| shadcn/ui | Latest | UI components | Pre-built Form, Input, Button components styled with Tailwind |
| next-safe-action | Latest | Type-safe Server Actions | Wrap auth mutations with validation pipeline and error handling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | NextAuth.js | NextAuth adds complexity if already using Supabase; stick with Supabase Auth if Supabase is backend |
| Supabase Auth | Clerk, Auth0 | Third-party auth adds cost and complexity; use when need B2B features like SSO/directory sync |
| react-hook-form | Formik | react-hook-form has better TypeScript support and smaller bundle size |

**Installation:**
```bash
# Core authentication
npm install @supabase/supabase-js @supabase/ssr

# Form handling and validation
npm install react-hook-form zod @hookform/resolvers

# UI components (if using shadcn/ui)
npx shadcn@latest init
npx shadcn@latest add form input button card label
```

**Alternative: Use Official Template**
```bash
npx create-next-app -e with-supabase
```
This includes @supabase/ssr, cookie-based auth, middleware, and TypeScript pre-configured.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/                     # Route group for auth pages (no layout)
│   │   ├── login/
│   │   │   └── page.tsx           # Sign in form
│   │   ├── signup/
│   │   │   └── page.tsx           # Sign up form
│   │   ├── verify-email/
│   │   │   └── page.tsx           # Email verification message
│   │   ├── reset-password/
│   │   │   └── page.tsx           # Request password reset
│   │   └── update-password/
│   │       └── page.tsx           # Change password (authenticated)
│   ├── auth/
│   │   └── confirm/
│   │       └── route.ts           # Email confirmation callback
│   ├── (dashboard)/               # Protected routes
│   │   ├── layout.tsx             # Check auth, redirect if not logged in
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing/home page
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client (Client Components)
│   │   ├── server.ts              # Server client (Server Components, Server Actions)
│   │   └── middleware.ts          # Middleware client (token refresh)
│   └── actions/
│       └── auth.ts                # Server Actions for signup, login, logout, password reset
├── middleware.ts                  # Token refresh, protected route checks
└── .env.local                     # Environment variables
```

### Pattern 1: Client Creation (Browser vs Server)

**What:** Separate Supabase client creation for browser and server environments with different cookie handling strategies.

**When to use:** Always - required for App Router authentication.

**Browser Client (`lib/supabase/client.ts`):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

// Usage in Client Components:
'use client'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const supabase = createClient()
  // ... use supabase for client-side auth
}
```

**Server Client (`lib/supabase/server.ts`):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Usage in Server Components:
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ... use user data
}
```

**Note:** In Next.js 15, `cookies()` must be awaited. Make the `createClient` function async.

### Pattern 2: Middleware for Token Refresh

**What:** Middleware refreshes expired auth tokens and updates cookies before requests reach Server Components.

**Why it happens:** Server Components can't write cookies, so middleware acts as a proxy to refresh tokens and persist them.

**Middleware (`middleware.ts`):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on request (for Server Components)
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          // Set cookies on response (for browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Refresh session by calling getUser()
  // This validates the JWT and refreshes if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Optional: Redirect to login if accessing protected route without auth
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Critical security note:** Always use `getUser()`, never `getSession()` in middleware. `getSession()` doesn't revalidate the JWT and can be spoofed.

### Pattern 3: Server Actions for Auth Mutations

**What:** Use Server Actions for signup, login, logout, and password reset operations.

**When to use:** All authentication mutations that modify state.

**Server Actions (`lib/actions/auth.ts`):**
```typescript
// Source: https://nextjs.org/docs/app/guides/data-security
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  // Validate input
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data

  // Supabase signup
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect to verification page
  redirect('/verify-email')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  // User must be authenticated to reach this action
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}
```

**Best practices:**
- Always validate inputs with Zod before calling Supabase
- Use absolute URLs for `emailRedirectTo` (include domain)
- Call `revalidatePath()` after auth state changes
- Return structured errors, never throw in Server Actions

### Pattern 4: RLS Policies for Multi-Tenant Isolation

**What:** Row Level Security policies that use `auth.uid()` to restrict data access to the authenticated user.

**When to use:** Every table that stores user-owned data, enabled from day 1.

**RLS Policy Example:**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- Enable RLS on a table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own profile
CREATE POLICY "Users view own profile"
ON profiles FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Policy: Users can only insert their own profile
CREATE POLICY "Users insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users update own profile"
ON profiles FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can only delete their own profile
CREATE POLICY "Users delete own profile"
ON profiles FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

**Performance optimizations:**
1. Wrap `auth.uid()` in `(SELECT auth.uid())` to cache the function result per statement
2. Add btree indexes on `user_id` columns referenced in policies
3. Specify `TO authenticated` to skip policy evaluation for anonymous users
4. Always include explicit client-side filters even with RLS: `.eq('user_id', userId)`

**Critical security:**
- Always use `auth.uid() IS NOT NULL AND auth.uid() = user_id` to handle unauthenticated requests (auth.uid() returns null for anon users)
- Never bypass RLS with service role key in client-side code
- Test policies by querying as different users

### Pattern 5: Email Confirmation Flow (PKCE)

**What:** Configure email templates to use `token_hash` instead of `ConfirmationURL` for PKCE flow compatibility.

**When to use:** Always for Next.js App Router (PKCE flow).

**Email Template Configuration:**

In Supabase Dashboard > Authentication > Email Templates > Confirm signup:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a></p>
```

**Confirmation Route Handler (`app/auth/confirm/route.ts`):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as 'email',
      token_hash,
    })

    if (!error) {
      // Redirect to dashboard or success page
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect to error page
  return NextResponse.redirect(new URL('/error', request.url))
}
```

**Password Reset Template:**
```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .SiteURL }}/update-password?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a></p>
```

### Anti-Patterns to Avoid

- **Using `getSession()` in server code:** Never trust `getSession()` in middleware, Server Components, or Route Handlers. It doesn't revalidate the JWT. Always use `getUser()`.
- **Storing sessions in localStorage:** Vulnerable to XSS attacks. Use HTTP-only cookies via `@supabase/ssr`.
- **Not awaiting `cookies()` in Next.js 15:** Will cause runtime errors. Always `await cookies()`.
- **Using deprecated `@supabase/auth-helpers`:** Package is deprecated. Use `@supabase/ssr` instead.
- **Hand-rolling JWT validation:** Let Supabase handle it via `getUser()`.
- **Setting short cookie expiry:** Let Supabase Auth control token validity. Set cookie `Max-Age` far into the future.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session refresh logic | Custom token refresh with timers | Middleware with `getUser()` | Supabase handles refresh token rotation, reuse detection, and race conditions automatically |
| Email verification flow | Custom email token generation and validation | Supabase Auth email templates + `verifyOtp()` | Built-in PKCE flow, token expiry (24h), and security best practices |
| Password hashing | bcrypt, argon2 custom implementation | Supabase Auth `signUp()` | Supabase uses secure hashing with salts, handles migration if algorithm changes |
| CSRF protection | Custom token generation for forms | Next.js Server Actions + Supabase cookies | Next.js uses POST requests and encrypted action IDs; Supabase uses SameSite cookies |
| Multi-tenancy data isolation | Application-level filtering (`WHERE user_id = ?`) | Postgres RLS policies | RLS provides defense-in-depth; works even if application code has bugs or is bypassed |
| Session persistence across devices | Custom session sync logic | Supabase refresh tokens in cookies | Supabase automatically syncs sessions across tabs/devices via cookie-based refresh tokens |

**Key insight:** Authentication has countless edge cases (token expiry, race conditions during refresh, email verification expiry, password reset replay attacks, session fixation). Supabase Auth has battle-tested solutions for all of these. Don't reinvent the wheel.

## Common Pitfalls

### Pitfall 1: Using Deprecated `@supabase/auth-helpers` Package

**What goes wrong:** Installation guides and tutorials reference `@supabase/auth-helpers`, but this package is deprecated. Bug fixes and new features are only in `@supabase/ssr`.

**Why it happens:** Older documentation and blog posts (2023-2024) used the auth-helpers package before it was deprecated.

**How to avoid:** Always install `@supabase/ssr`, not `@supabase/auth-helpers`. Check official Supabase documentation (updated January 2026) for current patterns.

**Warning signs:**
- Import from `@supabase/auth-helpers/nextjs`
- Documentation references "auth helpers" instead of "SSR package"
- No mention of `createBrowserClient` or `createServerClient`

### Pitfall 2: Next.js Caching Breaks Authenticated Data Fetches

**What goes wrong:** User A logs in, sees their data. User B logs in on the same page, sees User A's data. Data leakage across users.

**Why it happens:** Next.js aggressively caches `fetch` requests by default, including authenticated requests. Without opting out, cached responses are served to different users.

**How to avoid:** The `createServerClient` cookie configuration with `setAll()` automatically opts fetch calls out of Next.js caching when you call `cookies()`. Always use the official server client pattern.

**Additional safeguards:**
```typescript
// Explicitly opt out of caching for specific fetches
const { data } = await supabase
  .from('profiles')
  .select()
  .eq('user_id', user.id)

// The cookies() call in createClient() already opts this out
```

**Warning signs:**
- Same data appearing for different logged-in users
- Data not updating after mutations
- Server Components showing stale data

### Pitfall 3: Email Template Misconfiguration for PKCE Flow

**What goes wrong:** Email verification links return "Invalid token" or "Auth session missing!" errors. Password reset links don't work.

**Why it happens:** Default Supabase email templates use `{{ .ConfirmationURL }}`, which is designed for the implicit flow. Next.js App Router uses PKCE flow, which requires `{{ .TokenHash }}` instead.

**How to avoid:** Update email templates in Supabase Dashboard before implementing signup:

1. Go to Authentication > Email Templates
2. Update "Confirm signup" template to use:
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
   ```
3. Update "Reset password" template to use:
   ```html
   <a href="{{ .SiteURL }}/update-password?token_hash={{ .TokenHash }}&type=recovery">
   ```

**Warning signs:**
- Email links redirect to broken pages
- "Auth session missing!" errors on email confirmation
- Token validation fails in Route Handler

### Pitfall 4: Forgetting to Enable RLS on New Tables

**What goes wrong:** Create a new table via SQL, insert user data, realize anyone can read anyone else's data. Potential data breach.

**Why it happens:** RLS is **disabled by default** on tables created via SQL. Only tables created via Supabase Dashboard have RLS auto-enabled.

**How to avoid:**
1. Create a checklist: every new table must have `ALTER TABLE [name] ENABLE ROW LEVEL SECURITY;`
2. Add RLS policies immediately after creating the table
3. Test by querying as different users before deploying

**Verification query:**
```sql
-- Check if RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
```

**Warning signs:**
- Queries return data from other users
- No `USING` or `CHECK` clauses in query plans
- Supabase logs show data access across user boundaries

### Pitfall 5: Trusting `getSession()` in Server Code

**What goes wrong:** User with expired token can still access protected pages. Session data can be spoofed because JWT signature isn't validated.

**Why it happens:** `getSession()` reads cookies without validating the JWT signature with Supabase's public keys. It's safe in browser code but dangerous on the server.

**How to avoid:**
- **Always use `getUser()` in Server Components, middleware, and Route Handlers**
- `getUser()` validates the JWT signature on every call
- Never use `getSession()` for authorization decisions

```typescript
// WRONG - vulnerable to session spoofing
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  // User could have forged this session!
}

// CORRECT - validates JWT with Supabase
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  // JWT signature verified, user is authenticated
}
```

**Warning signs:**
- Documentation says "getSession() should only be used in browser code"
- Using session data from cookies without validation
- Authorization checks before calling `getUser()`

### Pitfall 6: Environment Variable Typos and Missing NEXT_PUBLIC Prefix

**What goes wrong:** "Failed to initialize Supabase client" errors. Auth doesn't work at all.

**Why it happens:** Typos in `.env.local` or forgetting `NEXT_PUBLIC_` prefix for client-side env vars. Next.js only exposes `NEXT_PUBLIC_*` to browser code.

**How to avoid:**
1. Copy-paste env vars from Supabase Dashboard > Connect
2. Verify exact naming:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY` for older projects)
3. Restart dev server after changing `.env.local`

**Warning signs:**
- "undefined" errors when creating Supabase client
- Client-side code can't access `process.env.NEXT_PUBLIC_SUPABASE_URL`
- Auth works in Server Components but not Client Components

### Pitfall 7: Redirect URL Not in Allowed List

**What goes wrong:** Email verification and password reset links redirect to error page or show "Invalid redirect URL" error.

**Why it happens:** Supabase validates redirect URLs against an allowed list to prevent open redirect attacks. Localhost works by default, but production URLs must be manually added.

**How to avoid:**
1. Add redirect URLs in Supabase Dashboard > Authentication > URL Configuration
2. Include all redirect URLs:
   - `https://yourdomain.com/auth/confirm`
   - `https://yourdomain.com/update-password`
3. Use absolute URLs in `emailRedirectTo` options

**Warning signs:**
- Email links work in dev but not production
- "Invalid redirect URL" in Supabase logs
- Redirects go to error page after email confirmation

### Pitfall 8: Not Handling Email Verification Edge Cases

**What goes wrong:** Users click verification link multiple times, link expires after 24 hours, or user signs up with existing email.

**Why it happens:** Email verification has many edge cases that need graceful error handling.

**How to avoid:**
- Display clear error messages for expired tokens (24-hour expiry)
- Handle "Email already confirmed" case (user clicks link twice)
- Check for existing email before signup with `supabase.auth.admin.getUserByEmail()` (or accept "User already registered" error)
- Show "Check your email" page immediately after signup

**Warning signs:**
- Users report "broken" verification links
- No feedback when token expires
- Confusing errors for duplicate signups

## Code Examples

Verified patterns from official sources:

### Sign Up Form with shadcn/ui

```typescript
// Source: https://ui.shadcn.com/docs/components/form
'use client'

import { signUp } from '@/lib/actions/auth'
import { useFormState } from 'react-dom'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function SignUpForm() {
  const [state, formAction] = useFormState(signUp, null)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        {state?.error?.email && (
          <p className="text-sm text-red-600">{state.error.email}</p>
        )}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        {state?.error?.password && (
          <p className="text-sm text-red-600">{state.error.password}</p>
        )}
      </div>
      {typeof state?.error === 'string' && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <Button type="submit" className="w-full">
        Sign Up
      </Button>
    </form>
  )
}
```

### Protected Route Layout

```typescript
// Source: https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <nav>{/* Navigation with logout button */}</nav>
      <main>{children}</main>
    </div>
  )
}
```

### Logout Button (Client Component)

```typescript
// Source: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
'use client'

import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost">
        Log Out
      </Button>
    </form>
  )
}
```

### RLS Policy with Indexes

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- Create table with user_id foreign key
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL: Enable RLS immediately
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Add index for RLS policy performance (non-primary key columns)
CREATE INDEX idx_todos_user_id ON todos USING btree (user_id);

-- Policies for user-owned todos
CREATE POLICY "Users view own todos"
ON todos FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users create own todos"
ON todos FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own todos"
ON todos FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users delete own todos"
ON todos FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers | @supabase/ssr | Mid-2024 | All new projects must use @supabase/ssr; auth-helpers is deprecated |
| `supabase.auth.session()` | `supabase.auth.getUser()` | 2023 | Server-side code must validate JWT signatures, not trust cookies |
| Implicit flow (ConfirmationURL) | PKCE flow (TokenHash) | 2023 for SSR | Email templates must use token_hash for Next.js App Router |
| Manual cookie handling | createServerClient with cookies config | 2024 with @supabase/ssr | Framework handles cookie reading/writing via adapter pattern |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Late 2025 | New key format; old anon keys still work during transition |
| cookies() synchronous | await cookies() | Next.js 15 (2024) | All cookie access must be awaited; breaking change in Next.js 15 |

**Deprecated/outdated:**
- `@supabase/auth-helpers` package: Replaced by `@supabase/ssr`, no longer maintained
- `getSession()` for server-side auth: Use `getUser()` to validate JWT signatures
- `{{ .ConfirmationURL }}` in email templates: Use `{{ .TokenHash }}` for PKCE flow
- Synchronous `cookies()` in Next.js 15: Must await `cookies()` in all server code

## Open Questions

Things that couldn't be fully resolved:

1. **What are Supabase's current rate limits for email sending?**
   - What we know: Default email service is limited to "2 emails per hour" for development. Production should use custom SMTP.
   - What's unclear: Are there hard limits for custom SMTP? What happens if limit is exceeded?
   - Recommendation: Configure custom SMTP (e.g., SendGrid, Postmark) in Supabase Dashboard > Authentication > Email for production. Test with high signup volume in staging.

2. **How to test RLS policies comprehensively before production?**
   - What we know: pgTAP is recommended for database testing, including RLS policies. Can test by creating test users and verifying data isolation.
   - What's unclear: Best practices for automated RLS testing in CI/CD pipelines.
   - Recommendation: Implement manual RLS verification during QA phase (create 2 users, verify data isolation). Consider pgTAP integration in future iteration if RLS policies become complex.

3. **Session expiry configuration availability on free tier**
   - What we know: Session expiry configuration (time-boxed, inactivity timeout, single session) is available on "Pro Plan and higher."
   - What's unclear: Default session expiry behavior on free tier. Can't be configured, but what are the defaults?
   - Recommendation: Accept default behavior (indefinite sessions until logout/password change) for Phase 1. Document requirement for Pro plan if custom session expiry is needed.

## Sources

### Primary (HIGH confidence)
- Supabase Official Docs - Server-Side Auth for Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase Official Docs - Creating SSR Clients: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase Official Docs - Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Official Docs - Next.js Quickstart: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase Official Docs - User Sessions: https://supabase.com/docs/guides/auth/sessions
- Supabase Official Docs - Password-Based Auth: https://supabase.com/docs/guides/auth/passwords
- Next.js Official Docs - Server Actions and Mutations: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Next.js Official Docs - Data Security: https://nextjs.org/docs/app/guides/data-security
- shadcn/ui - Form Component: https://ui.shadcn.com/docs/components/form
- shadcn/ui - Authentication Example: https://ui.shadcn.com/examples/authentication

### Secondary (MEDIUM confidence)
- Supabase Official Blog - Troubleshooting Next.js Auth: https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV (verified with official docs)
- WorkOS Blog - Top 5 authentication solutions for Next.js 2026: https://workos.com/blog/top-authentication-solutions-nextjs-2026 (verified Supabase recommendations)
- Medium - Next.js + Supabase Cookie-Based Auth Workflow (2025): https://the-shubham.medium.com/next-js-supabase-cookie-based-auth-workflow-the-best-auth-solution-2025-guide-f6738b4673c1 (cross-referenced with official docs)
- DEV Community - Enforcing RLS in Multi-Tenant Architecture: https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2 (verified RLS patterns)
- AntStack Blog - Multi-Tenant Applications with RLS: https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/ (verified patterns)

### Tertiary (LOW confidence)
- WebSearch results for Next.js 15 project structure (multiple sources, general patterns only)
- Community discussions on GitHub about password reset flows (not authoritative, requires verification)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase documentation explicitly recommends @supabase/ssr for Next.js App Router, updated January 2026
- Architecture: HIGH - All patterns verified from official Supabase and Next.js documentation with working code examples
- Pitfalls: MEDIUM-HIGH - Pitfalls 1-5 verified from official docs and troubleshooting guides; pitfalls 6-8 verified from multiple community sources but not explicitly documented

**Research date:** 2026-01-26
**Valid until:** 2026-02-25 (30 days - Supabase Auth is stable, Next.js 15 is current stable version)

**Notes:**
- Supabase documentation was updated within the past 2 weeks (as of 2026-01-26), indicating active maintenance
- Next.js 15 patterns are stable; no breaking changes expected in Near future
- RLS performance optimizations are well-documented and battle-tested
- PKCE flow is the current standard for SSR; no migration expected
