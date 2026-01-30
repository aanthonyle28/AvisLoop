# Phase 16: Onboarding Redesign + Google Auth - Research

**Researched:** 2026-01-30
**Domain:** Authentication (OAuth), UI/UX Design, Onboarding State Management
**Confidence:** HIGH

## Summary

This research covers three primary domains: (1) Supabase Google OAuth integration with Next.js App Router, (2) Split-screen authentication page design patterns, and (3) Onboarding progress tracking and completion state management.

**Key findings:**
- Supabase Google OAuth uses PKCE flow requiring a callback route handler with `exchangeCodeForSession`
- Google Cloud Console configuration is prerequisite (OAuth client ID setup, authorized redirect URIs)
- Split-screen layouts are standard practice for modern auth pages (form left, image right)
- Onboarding completion tracking can extend existing `businesses.onboarding_completed_at` pattern
- Test send mechanics should use database flagging (`is_test` column) over API simulation for reliability

**Primary recommendation:** Use Supabase's built-in OAuth with PKCE flow, implement callback handler at `/auth/callback/route.ts`, track onboarding card completion via new `onboarding_steps_completed` JSONB column extending existing pattern, and flag test sends in database to exclude from quota.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | latest | Supabase client with auth methods | Official Supabase client, handles OAuth PKCE flow |
| @supabase/ssr | latest | Server-side Supabase client | Required for Next.js App Router auth |
| Next.js | 15 (App Router) | Framework | Already in use, native route handlers for callbacks |
| Tailwind CSS | 3.4+ | Styling | Already in use, grid system for split layouts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-confetti | 6.4.0 | Confetti animation | Optional: celebration effect on onboarding completion |
| react-confetti-explosion | latest | Lightweight confetti | Alternative: CSS-only animation, smaller bundle |
| Phosphor Icons | 2.1.10 | Icon system | Already in use for card icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase OAuth | NextAuth.js | More providers but unnecessary complexity, Supabase already integrated |
| Database tracking | localStorage | Loses cross-device state, no server visibility |
| react-confetti | CSS animation | Lighter weight but less impressive effect |

**Installation:**
```bash
# Already installed - no new packages required for core functionality
# Optional celebration effect:
npm install react-confetti
# or
npm install react-confetti-explosion
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── auth/
│   ├── callback/
│   │   └── route.ts           # OAuth callback handler (NEW)
│   ├── login/
│   │   └── page.tsx            # Redesign with split layout
│   └── sign-up/
│       └── page.tsx            # Redesign with split layout
├── (dashboard)/
│   ├── onboarding/
│   │   └── page.tsx            # Redesign 2-step wizard
│   └── dashboard/
│       └── page.tsx            # Add 3 test step cards
components/
├── auth/
│   ├── google-oauth-button.tsx   # Google sign-in button (NEW)
│   └── auth-split-layout.tsx     # Reusable split layout (NEW)
├── dashboard/
│   └── onboarding-cards.tsx       # Replace checklist (NEW)
└── onboarding/
    └── onboarding-wizard.tsx      # Redesign existing
lib/
├── actions/
│   └── auth.ts                    # Add signInWithGoogle action
└── data/
    └── onboarding.ts              # Extend with card completion tracking
supabase/
└── migrations/
    └── XXXXX_onboarding_redesign.sql  # Add onboarding_steps_completed JSONB
```

### Pattern 1: Google OAuth with PKCE Flow

**What:** Supabase handles PKCE (Proof Key for Code Exchange) OAuth flow automatically with callback route
**When to use:** Any OAuth provider integration (Google, GitHub, etc.)
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/social-login/auth-google

// Client-side: components/auth/google-oauth-button.tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export function GoogleOAuthButton() {
  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <button onClick={handleGoogleSignIn}>
      Continue with Google
    </button>
  )
}

// Server-side: app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
```

### Pattern 2: Split-Screen Auth Layout

**What:** Two-column grid layout with form on left, image on right
**When to use:** Login and signup pages
**Example:**
```typescript
// Source: Tailwind CSS grid documentation + 2026 auth design patterns
// https://tailwindcss.com/docs/grid-template-columns

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Right: Image */}
      <div className="hidden lg:block bg-muted">
        <img
          src="/images/auth-hero.png"
          alt="Product preview"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  )
}
```

### Pattern 3: Onboarding Card Completion Tracking

**What:** JSONB column storing card completion state with progressive tracking
**When to use:** Multi-step onboarding with non-sequential optional steps
**Example:**
```typescript
// Source: Supabase JSONB patterns + existing onboarding.ts structure

// Migration: Add onboarding_steps_completed JSONB column
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS onboarding_steps_completed JSONB DEFAULT '{}'::jsonb;

// lib/data/onboarding.ts extension
export type OnboardingCardStatus = {
  contact_created: boolean
  template_created: boolean
  test_sent: boolean
}

export async function markOnboardingCardComplete(
  step: keyof OnboardingCardStatus
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('onboarding_steps_completed')
    .eq('user_id', user.id)
    .single()

  const steps = (business?.onboarding_steps_completed || {}) as OnboardingCardStatus
  steps[step] = true

  await supabase
    .from('businesses')
    .update({ onboarding_steps_completed: steps })
    .eq('user_id', user.id)
}
```

### Pattern 4: Test Send Flagging

**What:** Database flag to exclude sends from quota counting
**When to use:** Test/demo functionality that shouldn't consume user quota
**Example:**
```typescript
// Migration: Add is_test column to send_logs
ALTER TABLE send_logs
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

// When creating test send
await supabase
  .from('send_logs')
  .insert({
    business_id,
    contact_id,
    status: 'pending',
    is_test: true,  // Exclude from quota
  })

// Quota counting query (exclude test sends)
const { count } = await supabase
  .from('send_logs')
  .select('*', { count: 'exact', head: true })
  .eq('business_id', business_id)
  .eq('is_test', false)  // Only count real sends
  .gte('created_at', monthStart)
```

### Anti-Patterns to Avoid

- **Implicit OAuth flow:** Deprecated, less secure than PKCE. Always use PKCE for OAuth providers.
- **Client-side callback handling:** OAuth callbacks must be handled server-side with route handlers to securely exchange codes.
- **localStorage for completion tracking:** Loses state across devices, no server visibility. Use database.
- **API simulation for test sends:** Hard to debug, doesn't test real integration. Flag in database instead.
- **Separate onboarding tables:** Extends cognitive load. Extend existing `businesses` table with JSONB columns.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth PKCE flow | Custom OAuth implementation | Supabase `signInWithOAuth` | Handles security, code exchange, session management automatically |
| Confetti animation | Custom canvas confetti | `react-confetti` or `react-confetti-explosion` | Handles performance, particle physics, cleanup |
| Progress bar animation | Custom CSS keyframes | Tailwind `transition-all` + dynamic width | Smoother, accessible, less code |
| Onboarding state sync | Manual state reconciliation | Supabase real-time or server actions | Prevents race conditions, handles conflicts |

**Key insight:** OAuth security is complex with many edge cases (CSRF, token refresh, session management). Supabase Auth handles all of this. Don't reimplement.

## Common Pitfalls

### Pitfall 1: Missing Callback Route Handler

**What goes wrong:** After Google OAuth redirect, user sees error page or gets stuck on callback URL with code in query string.

**Why it happens:** `signInWithOAuth` redirects to Google, which redirects back with `?code=...` parameter. Without a route handler to call `exchangeCodeForSession(code)`, the session is never established.

**How to avoid:**
1. Create `/auth/callback/route.ts` route handler
2. Extract code parameter from URL
3. Call `supabase.auth.exchangeCodeForSession(code)`
4. Redirect to dashboard on success

**Warning signs:**
- User stuck on URL with `?code=...` parameter
- "Invalid auth code" errors
- Session not persisting after OAuth redirect

### Pitfall 2: Redirect URI Mismatch

**What goes wrong:** Google OAuth fails with "redirect_uri_mismatch" error.

**Why it happens:** Redirect URI in Google Cloud Console doesn't exactly match the one Supabase sends. Case-sensitive, protocol (http vs https), port, path all must match exactly.

**How to avoid:**
1. Get exact redirect URI from Supabase Dashboard → Auth → Providers → Google
2. Add to Google Cloud Console → Credentials → OAuth 2.0 Client → Authorized redirect URIs
3. For local dev, add both `http://localhost:3000/auth/callback` AND Supabase's callback URL
4. Ensure no trailing slashes mismatch

**Warning signs:**
- "redirect_uri_mismatch" error on Google consent screen
- Works in production but fails locally (missing localhost URL)
- Works locally but fails in production (missing production URL)

### Pitfall 3: PKCE Code Expiry and Single Use

**What goes wrong:** User completes OAuth flow but session fails to establish with "invalid code" error.

**Why it happens:** PKCE auth codes expire in 5 minutes and can only be exchanged once. If user navigates away and returns, or if callback handler runs twice, the code is invalid.

**How to avoid:**
1. Handle callback immediately on redirect
2. Don't retry `exchangeCodeForSession` on failure
3. Check if session already exists before exchanging
4. Redirect to error page if exchange fails

**Warning signs:**
- Works sometimes but fails other times
- "Auth code already used" errors
- "Auth code expired" errors after delay

### Pitfall 4: Cross-Device OAuth Attempts

**What goes wrong:** User starts OAuth on one device/browser, tries to complete on another. Session never establishes.

**Why it happens:** PKCE stores code verifier in browser storage. Different device = no verifier = can't complete exchange.

**How to avoid:**
1. Document that OAuth must complete in same browser
2. Don't offer "continue on mobile" during OAuth flow
3. If needed, use magic link for cross-device auth instead

**Warning signs:**
- Users report OAuth works on desktop but not mobile (if starting on mobile)
- QR code OAuth flows failing

### Pitfall 5: Onboarding Cards Without Prerequisites Check

**What goes wrong:** User clicks "Send test review request" card but has no contacts or templates. Error occurs or form is empty.

**Why it happens:** Cards navigate to existing pages which assume prerequisites exist.

**How to avoid:**
1. Check prerequisites in card component state
2. Show warning badge if prerequisites missing ("Create a contact first")
3. Still allow navigation (user might have contacts, just none loaded)
4. Handle empty states gracefully on destination pages

**Warning signs:**
- Users confused why send page is empty
- Errors when navigating from card
- Cards marked complete but prerequisites don't exist

### Pitfall 6: Google OAuth Configuration for Self-Hosted

**What goes wrong:** Google OAuth works on Supabase hosted but fails on local dev or self-hosted instances.

**Why it happens:** Local Supabase requires manual `config.toml` configuration. Hosted version auto-configures from dashboard.

**How to avoid:**
1. For local dev, add to `supabase/config.toml`:
   ```toml
   [auth.external.google]
   enabled = true
   client_id = "your-client-id"
   secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
   ```
2. Add secret to `.env.local`
3. Restart Supabase after config changes

**Warning signs:**
- OAuth works in production but not locally
- "Provider not configured" errors
- Google sign-in button does nothing locally

### Pitfall 7: Test Send Quota Leakage

**What goes wrong:** Test sends count against user's monthly quota, burning free tier allowance during onboarding.

**Why it happens:** Send quota query doesn't filter out `is_test` sends.

**How to avoid:**
1. Always add `WHERE is_test = false` or `.eq('is_test', false)` to quota queries
2. Test the test send flow before deployment
3. Add database constraint or index on non-test sends for performance

**Warning signs:**
- New users hitting quota limits immediately
- Test sends appearing in billing usage
- Free tier users can't send real messages after onboarding

## Code Examples

Verified patterns from official sources:

### Google Cloud Console Setup

```plaintext
Source: https://supabase.com/docs/guides/auth/social-login/auth-google

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application" type
4. Add Authorized JavaScript origins:
   - https://your-domain.com
   - http://localhost:3000 (for local dev)
5. Add Authorized redirect URIs:
   - https://yourproject.supabase.co/auth/v1/callback
   - http://localhost:54321/auth/v1/callback (for local dev)
6. Save Client ID and Client Secret
7. Go to Supabase Dashboard → Auth → Providers → Google
8. Paste Client ID and Client Secret
9. Enable Google provider
```

### Environment Variables

```bash
# .env.local (add to existing vars)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# For self-hosted Supabase only:
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Server Action for Google OAuth

```typescript
// lib/actions/auth.ts
// Source: https://supabase.com/docs/reference/javascript/auth-signinwithoauth

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      // Optional: request offline access for refresh token
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    throw error
  }

  if (data.url) {
    redirect(data.url)
  }
}
```

### OAuth Callback Route Handler

```typescript
// app/auth/callback/route.ts
// Source: https://supabase.com/docs/guides/auth/social-login/auth-google

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Optional: support custom redirect after auth
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successfully authenticated, redirect to app
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed, redirect to error page
  return NextResponse.redirect(`${origin}/auth/error`)
}
```

### Split Layout Component

```typescript
// components/auth/auth-split-layout.tsx
// Source: Tailwind CSS grid patterns + 2026 auth design research
// https://tailwindcss.com/docs/grid-template-columns

import Image from 'next/image'

export function AuthSplitLayout({
  children,
  imageSrc = '/images/auth-hero.png',
  imageAlt = 'Product preview'
}: {
  children: React.ReactNode
  imageSrc?: string
  imageAlt?: string
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: Form content */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {children}
        </div>
      </div>

      {/* Right: Image */}
      <div className="relative hidden lg:block">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
```

### Onboarding Card Component

```typescript
// components/dashboard/onboarding-cards.tsx
// Source: Design patterns from context + Phosphor icons

'use client'

import { AddressBook, NotePencil, PaperPlaneTilt } from '@phosphor-icons/react'
import { ArrowRight, CheckCircle, Circle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { OnboardingCardStatus } from '@/lib/data/onboarding'

type CardConfig = {
  id: keyof OnboardingCardStatus
  number: string
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  prerequisite?: keyof OnboardingCardStatus
}

const CARDS: CardConfig[] = [
  {
    id: 'contact_created',
    number: '01',
    title: 'Create a test contact',
    description: 'Add a contact to send review requests to',
    icon: AddressBook,
    href: '/contacts',
  },
  {
    id: 'template_created',
    number: '02',
    title: 'Create a message template',
    description: 'Customize your review request message',
    icon: NotePencil,
    href: '/dashboard/settings',
  },
  {
    id: 'test_sent',
    number: '03',
    title: 'Send a test review request',
    description: 'Try sending your first review request',
    icon: PaperPlaneTilt,
    href: '/send',
    prerequisite: 'contact_created',
  },
]

export function OnboardingCards({ status }: { status: OnboardingCardStatus }) {
  const allComplete = Object.values(status).every(Boolean)

  // Hide if all complete
  if (allComplete) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Get Started</h2>
        <span className="text-sm text-muted-foreground">
          {Object.values(status).filter(Boolean).length} of {CARDS.length} complete
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {CARDS.map((card) => {
          const Icon = card.icon
          const isComplete = status[card.id]
          const prerequisiteComplete = card.prerequisite
            ? status[card.prerequisite]
            : true

          return (
            <Link
              key={card.id}
              href={card.href}
              className={cn(
                "group relative rounded-lg border p-4 transition-all hover:border-primary",
                isComplete && "border-green-600/20 bg-green-50/50"
              )}
            >
              {/* Number label */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {card.number}
                </span>
                {isComplete ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Icon and content */}
              <div className="mb-3">
                <Icon className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">{card.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {card.description}
                </p>
              </div>

              {/* Warning if prerequisite not met */}
              {!prerequisiteComplete && (
                <p className="text-xs text-amber-600 mb-2">
                  Complete step {card.prerequisite === 'contact_created' ? '01' : '02'} first
                </p>
              )}

              {/* Arrow indicator */}
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

### Database Migration

```sql
-- supabase/migrations/XXXXX_onboarding_redesign.sql
-- Add onboarding card tracking and test send flag

-- Add JSONB column for tracking onboarding card completion
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS onboarding_steps_completed JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN businesses.onboarding_steps_completed IS
  'Tracks completion of post-wizard onboarding cards: contact_created, template_created, test_sent';

-- Add test flag to send_logs to exclude from quota
ALTER TABLE send_logs
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

COMMENT ON COLUMN send_logs.is_test IS
  'Marks send as test/demo, excluded from monthly quota counting';

-- Add index for quota queries (exclude test sends)
CREATE INDEX IF NOT EXISTS idx_send_logs_quota
  ON send_logs(business_id, created_at)
  WHERE is_test = false;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Implicit OAuth flow | PKCE flow | 2020-2021 | Better security, required for mobile apps |
| localStorage onboarding state | Database JSONB tracking | 2023-2024 | Cross-device state, server visibility |
| Separate onboarding tables | JSONB columns on main tables | 2024-2025 | Less schema complexity, easier queries |
| Email + password only | Social OAuth (Google) as primary | 2024-2026 | Faster signup, better UX, 73% of users prefer Google |
| Multi-page auth flow | Single page with OR divider | 2025-2026 | Reduced friction, cleaner UI |

**Deprecated/outdated:**
- **Implicit OAuth flow**: Deprecated by OAuth 2.1 spec, use PKCE instead
- **NextAuth.js (formerly)**: Now Auth.js v5, but Supabase Auth already integrated in this project
- **Separate onboarding completion table**: JSONB columns more flexible and performant for key-value state

## Open Questions

Things that couldn't be fully resolved:

1. **Celebration Animation Library Choice**
   - What we know: `react-confetti` (6.4.0) is most popular, `react-confetti-explosion` is lighter weight
   - What's unclear: Which fits better with existing design system and performance budget
   - Recommendation: Start without celebration animation, add `react-confetti-explosion` if user feedback requests it (lighter bundle)

2. **Welcome Screen Design**
   - What we know: Optional welcome/splash screen before wizard step 1, reference pattern exists
   - What's unclear: Whether welcome screen adds value or just delays onboarding
   - Recommendation: Skip welcome screen initially (marked as Claude's discretion), can add if user testing shows benefit

3. **Test Template Approach**
   - What we know: Either create real template user keeps, or show pre-filled template to customize
   - What's unclear: Which approach provides better learning/confidence
   - Recommendation: Create real template user keeps (simpler, no cleanup logic, user can actually use it)

4. **Onboarding Card Auto-Completion Detection**
   - What we know: Need to detect when contact created, template created, send completed
   - What's unclear: Best UX for marking complete (automatic vs manual confirmation)
   - Recommendation: Automatic detection via database queries (contact exists, template exists, send log exists with is_test=true), mark cards complete on next page load

## Sources

### Primary (HIGH confidence)

- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google) - Official setup steps
- [Supabase signInWithOAuth API Reference](https://supabase.com/docs/reference/javascript/auth-signinwithoauth) - Method signature and options
- [Supabase PKCE Flow Documentation](https://supabase.com/docs/guides/auth/sessions/pkce-flow) - PKCE implementation details
- [Tailwind CSS Grid Documentation](https://tailwindcss.com/docs/grid-template-columns) - Grid layout patterns
- [Next.js App Router Authentication](https://nextjs.org/learn/dashboard-app/adding-authentication) - Official Next.js auth patterns

### Secondary (MEDIUM confidence)

- [Next.js with Supabase Google Login Guide](https://engineering.teknasyon.com/next-js-with-supabase-google-login-step-by-step-guide-088ef06e0501) - Step-by-step implementation (verified with official docs)
- [Supabase Google OAuth Local Setup](https://medium.com/@olliedoesdev/nextjs-supabase-google-oauth-on-localhost-0fe8b6341785) - Local development configuration
- [Supabase Auth Next.js PKCE Guide](https://www.misha.wtf/blog/supabase-auth-next-13-pkce) - PKCE flow implementation verified
- [Tailwind Two-Column Layout Tutorial](https://tw-elements.com/docs/standard/extended/2-columns-layout/) - Split-screen patterns
- [Authentication Page Design Best Practices](https://arounda.agency/blog/10-examples-of-login-page-design-best-practices) - 2026 design patterns
- [User Onboarding Progress Tracking](https://userguiding.com/blog/progress-trackers-and-indicators) - Progress tracking patterns

### Tertiary (LOW confidence)

- [react-confetti npm package](https://www.npmjs.com/package/react-confetti) - Popular confetti library
- [react-confetti-explosion npm package](https://www.npmjs.com/package/react-confetti-explosion) - Lightweight alternative
- [OnboardJS React Onboarding Library](https://onboardjs.com/) - Modern onboarding library (not used, but shows patterns)
- [Supabase Google OAuth Discussion #20353](https://github.com/orgs/supabase/discussions/20353) - Community troubleshooting
- [Supabase Redirect URI Issues #41700](https://github.com/supabase/supabase/issues/41700) - Known redirect problems

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase docs, established Next.js patterns
- Architecture: HIGH - Verified with official documentation and existing codebase patterns
- Pitfalls: MEDIUM - Combination of official docs, GitHub issues, and community reports

**Research date:** 2026-01-30
**Valid until:** 2026-02-28 (30 days - Supabase stable, OAuth standards mature)
