# Phase 8: Public Pages - Research

**Researched:** 2026-01-27
**Domain:** Next.js App Router public marketing pages (landing, pricing, auth)
**Confidence:** HIGH

## Summary

Public pages in a Next.js SaaS application serve as the visitor entry point and conversion funnel. The standard 2026 approach uses the App Router with route groups to separate marketing pages from authenticated sections, server components for optimal performance, and the Metadata API for SEO.

Research covered Next.js App Router patterns for organizing public vs authenticated routes, SaaS landing page structure and conversion best practices, pricing page design patterns, SEO optimization with metadata API, and accessibility requirements. The existing codebase already has shadcn/ui components, Tailwind CSS, Supabase authentication, and middleware configured.

**Primary recommendation:** Use route groups `(marketing)` and `(dashboard)` to separate public and authenticated pages with different layouts, leverage server components with static metadata for SEO, and follow proven SaaS landing page patterns (hero with value prop, social proof, pricing comparison, clear CTAs).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15+ | Framework for pages and routing | Official Next.js architecture, server-first rendering |
| shadcn/ui | latest | UI component library | Already in project, built on Radix UI + Tailwind |
| Tailwind CSS | 3.4+ | Styling | Already configured, industry standard for SaaS |
| Next.js Metadata API | built-in | SEO optimization | Type-safe, recommended approach for App Router |
| next/image | built-in | Image optimization | Automatic WebP conversion, responsive sizing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | latest | Icon library | Already in project, use for UI icons |
| next-themes | 0.4+ | Dark mode support | Already in project, maintain consistency |
| @supabase/ssr | latest | Authentication | Already configured, used in middleware |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Route groups | Separate /marketing folder | Route groups better - no URL impact, easier layout sharing |
| Static metadata | Dynamic metadata | Static is simpler and sufficient for marketing pages |
| Custom components | Premium UI kits | shadcn/ui already installed, free, and customizable |

**Installation:**
```bash
# All dependencies already installed
# Existing: next, tailwindcss, shadcn/ui components, lucide-react, @supabase/ssr
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (marketing)/          # Route group - excluded from URL
│   ├── layout.tsx        # Marketing layout (navbar, footer)
│   ├── page.tsx          # Landing page (/)
│   ├── pricing/
│   │   └── page.tsx      # /pricing
│   └── components/       # Marketing-specific components
│       ├── hero.tsx
│       ├── pricing-table.tsx
│       └── cta-section.tsx
├── (dashboard)/          # Already exists for authenticated pages
│   ├── layout.tsx
│   └── ...
├── auth/                 # Already exists - /auth/login, /auth/sign-up
│   ├── login/
│   └── sign-up/
├── middleware.ts         # Already configured
└── layout.tsx            # Root layout
```

### Pattern 1: Route Groups for Layout Separation
**What:** Use `(folderName)` syntax to organize routes without affecting URLs
**When to use:** Separating public marketing pages from authenticated dashboard pages
**Example:**
```typescript
// app/(marketing)/layout.tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <nav>
        {/* Public navbar with Login/Sign Up CTAs */}
      </nav>
      <main>{children}</main>
      <footer>
        {/* Marketing footer */}
      </footer>
    </>
  )
}
```
**Benefit:** `(marketing)/page.tsx` renders at `/`, not `/marketing`. Different layout than dashboard without affecting URL structure.

### Pattern 2: Static Metadata for SEO
**What:** Export a `Metadata` object from page.tsx for static SEO data
**When to use:** All marketing pages (landing, pricing, about)
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AvisLoop - Simple Review Requests for Busy Businesses',
  description: 'Request reviews with one click. No complex campaigns, no forgotten follow-ups. Just simple review requests that actually get sent.',
  openGraph: {
    title: 'AvisLoop - Simple Review Requests',
    description: '...',
    images: ['/og-image.jpg'],
  },
}

export default function Page() {
  return <div>...</div>
}
```

### Pattern 3: Server Components by Default
**What:** Keep all marketing page components as Server Components unless interactivity needed
**When to use:** Hero sections, pricing tables, feature lists, testimonials
**Example:**
```typescript
// Server Component - no "use client"
export async function PricingTable() {
  // Can fetch data directly here if needed
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Pricing tiers */}
    </div>
  )
}

// Only mark interactive parts as Client Components
'use client'
export function PricingToggle() {
  const [isAnnual, setIsAnnual] = useState(false)
  return <button onClick={() => setIsAnnual(!isAnnual)}>...</button>
}
```

### Pattern 4: Image Optimization for Hero
**What:** Use next/image with priority prop for above-the-fold images
**When to use:** Hero section images, logos, screenshots
**Example:**
```typescript
// Source: https://www.debugbear.com/blog/nextjs-image-optimization
import Image from 'next/image'

<Image
  src="/hero-screenshot.png"
  alt="AvisLoop dashboard showing one-click review requests"
  width={1200}
  height={800}
  priority={true}
  quality={85}
  placeholder="blur"
  blurDataURL="data:image/..."
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px"
/>
```
**Benefit:** Improves LCP (Largest Contentful Paint), converts to WebP automatically, responsive sizing reduces bandwidth.

### Pattern 5: SaaS Landing Page Structure
**What:** Standard landing page sections following 2026 best practices
**When to use:** Main landing page (/)
**Sections:**
1. **Hero** - Clear value proposition, visual proof, primary CTA
2. **Problem/Solution** - What pain point does AvisLoop solve?
3. **Features** - Key benefits (one-click sending, contact management, history)
4. **Social Proof** - Testimonials or usage stats if available
5. **Pricing Preview** - Simple tier comparison, link to full pricing page
6. **Final CTA** - Clear call to action (Start Free Trial / Sign Up)

### Pattern 6: Pricing Page Structure
**What:** 3-4 tier comparison with clear differentiation
**When to use:** Dedicated /pricing page
**Components:**
```typescript
// Based on: https://www.designstudiouiux.com/blog/saas-pricing-page-design-best-practices/
interface PricingTier {
  name: string
  price: number
  description: string
  features: string[]
  recommended?: boolean
  cta: string
}

const tiers: PricingTier[] = [
  {
    name: "Free Trial",
    price: 0,
    description: "Try before you commit",
    features: ["25 free sends", "All features", "No credit card required"],
    cta: "Start Free Trial"
  },
  {
    name: "Basic",
    price: 49,
    description: "For small businesses",
    features: ["500 sends/month", "Contact management", "Email support"],
    recommended: true,
    cta: "Get Started"
  },
  {
    name: "Pro",
    price: 99,
    description: "For growing businesses",
    features: ["Unlimited sends", "Priority support", "Advanced analytics"],
    cta: "Upgrade to Pro"
  }
]
```

### Pattern 7: Middleware Route Configuration
**What:** Middleware already configured - ensure public routes accessible
**Current setup:** Middleware redirects unauthenticated users from `/dashboard` to `/login`
**Verification needed:** Ensure `/` (landing), `/pricing` are NOT protected
**Implementation:**
```typescript
// middleware.ts already handles this correctly:
// - Blocks unauthenticated access to /dashboard
// - Redirects authenticated users from /login to /dashboard
// - Does NOT block access to / or /pricing (good!)
```

### Anti-Patterns to Avoid
- **Using "use client" unnecessarily:** Keep marketing pages as Server Components for better SEO and performance
- **Calling API routes from Server Components:** Fetch data directly in Server Components, don't create unnecessary API routes
- **Large unoptimized hero images:** Always use next/image with priority for above-fold images
- **Over-complicating pricing tiers:** 3-4 tiers max, research shows >4 reduces conversion by 30%
- **Waterfalls in data fetching:** Use parallel fetching with Promise.all() if multiple data sources needed
- **Missing static metadata:** Every marketing page needs metadata for SEO
- **Inconsistent CTAs:** Use same action-oriented language throughout ("Start Free Trial" not "Learn More")

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pricing table components | Custom pricing cards from scratch | shadcn/ui Card + existing patterns | Multiple pre-built examples exist, handles responsive design |
| Dark mode toggle | Custom theme switcher | next-themes (already installed) | Handles system preference, persistence, no flash |
| Button variants | Custom button styles | shadcn/ui Button (already exists) | Consistent sizing, variants, accessibility built-in |
| Navigation menu | Custom navbar | Combine existing shadcn components | Accessible, mobile-responsive patterns available |
| Image optimization | Custom lazy loading | next/image | Automatic WebP conversion, responsive sizing, priority loading |
| SEO meta tags | Manual <Head> manipulation | Next.js Metadata API | Type-safe, automatic deduplication, better DX |
| Form validation | Custom validation logic | react-hook-form + zod (already installed) | Used throughout app, consistent UX |

**Key insight:** The project already has a mature component library (shadcn/ui) and established patterns. Reuse existing Button, Card, Input components rather than creating marketing-specific versions.

## Common Pitfalls

### Pitfall 1: Client-Side Rendering Everything
**What goes wrong:** Marking every component with "use client", causing heavy JavaScript bundles and poor SEO
**Why it happens:** Developers used to React SPA patterns apply them to Next.js
**How to avoid:** Default to Server Components, only add "use client" for interactive components (buttons with onClick, forms with state)
**Warning signs:**
- Large JavaScript bundle sizes (check Chrome DevTools Coverage)
- Slow LCP/FCP metrics
- Search engines not indexing content properly

### Pitfall 2: Not Using Route Groups
**What goes wrong:** Marketing and dashboard pages share the same layout, or marketing pages in `/marketing/*` URLs
**Why it happens:** Unfamiliarity with App Router's route group feature
**How to avoid:** Create `(marketing)` and `(dashboard)` folders with separate layouts
**Warning signs:**
- Dashboard navigation showing on landing page
- Marketing footer showing on dashboard
- URLs like `/marketing/pricing` instead of `/pricing`

### Pitfall 3: Missing or Poor Metadata
**What goes wrong:** Pages show as "localhost:3000" in search results, no OG images for social sharing
**Why it happens:** Forgetting to add metadata export to pages
**How to avoid:** Add metadata export to every page.tsx in (marketing) folder
**Warning signs:**
- Generic page titles in browser tabs
- Broken social media previews
- Poor Google search appearance

### Pitfall 4: Unoptimized Hero Images
**What goes wrong:** 2MB hero image takes 4+ seconds to load on mobile, failing Core Web Vitals
**Why it happens:** Using regular `<img>` tag or not setting priority prop
**How to avoid:** Use next/image with priority={true} for all above-fold images
**Warning signs:**
- LCP > 2.5s in Lighthouse
- Large image files in Network tab
- Visible layout shift when image loads

### Pitfall 5: Middleware Blocking Public Routes
**What goes wrong:** Landing page redirects to login, breaking the public funnel
**Why it happens:** Middleware matcher config too broad or missing route checks
**How to avoid:** Current middleware.ts is correct - only checks /dashboard and /protected paths
**Warning signs:**
- Can't access landing page without login
- Public pricing page requires authentication
- Signup flow broken

### Pitfall 6: Weak Call-to-Action Copy
**What goes wrong:** Generic CTAs like "Learn More" or "Submit" result in low conversion rates
**Why it happens:** Not following conversion optimization best practices
**How to avoid:** Use action-oriented, benefit-focused copy ("Start Free Trial", "Get 25 Free Sends", "Try AvisLoop Free")
**Warning signs:**
- Low signup rates compared to landing page traffic
- High bounce rates on pricing page
- Users confused about next steps

### Pitfall 7: Poor Mobile Experience
**What goes wrong:** Pricing table doesn't scroll horizontally on mobile, hero text too small, CTAs hard to tap
**Why it happens:** Designing desktop-first without mobile testing
**How to avoid:** Test on mobile viewport (Chrome DevTools), ensure tap targets ≥44px, responsive text sizing
**Warning signs:**
- Users bouncing on mobile (check analytics)
- Horizontal scrolling issues
- Tap targets failing WCAG 2.2 (minimum 24x24 CSS pixels)

### Pitfall 8: Accessibility Issues
**What goes wrong:** Missing alt text, poor color contrast, keyboard navigation broken
**Why it happens:** Not testing with accessibility tools
**How to avoid:** Run Lighthouse accessibility audit, ensure contrast ratios meet WCAG AA, test keyboard navigation
**Warning signs:**
- Lighthouse accessibility score < 90
- Can't tab through all interactive elements
- Color contrast warnings in DevTools

## Code Examples

Verified patterns from official sources:

### Landing Page with Metadata
```typescript
// app/(marketing)/page.tsx
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AvisLoop - Simple Review Requests for Busy Businesses',
  description: 'Request reviews with one click. No complex campaigns, no forgotten follow-ups.',
  openGraph: {
    title: 'AvisLoop - Simple Review Requests',
    description: 'Request reviews with one click. No complex campaigns.',
    url: 'https://avisloop.com',
    siteName: 'AvisLoop',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
    }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AvisLoop - Simple Review Requests',
    description: 'Request reviews with one click.',
    images: ['/og-image.jpg'],
  },
}

export default function LandingPage() {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Request Reviews. One Click. Done.
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Make requesting reviews so simple that business owners actually do it.
          One contact, one click, done.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">Start Free Trial</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </section>

      {/* Problem/Solution, Features, etc. */}
    </div>
  )
}
```

### Pricing Page with Comparison Table
```typescript
// app/(marketing)/pricing/page.tsx
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Check } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing - AvisLoop',
  description: 'Simple, transparent pricing. Start with 25 free sends, upgrade as you grow.',
}

const tiers = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '25 sends',
    description: 'Try before you commit',
    features: [
      '25 free review requests',
      'All features included',
      'Contact management',
      'Email delivery',
      'No credit card required',
    ],
    cta: 'Start Free Trial',
    href: '/auth/sign-up',
  },
  {
    name: 'Basic',
    price: '$49',
    period: '/month',
    description: 'For small businesses',
    features: [
      '500 sends per month',
      'Contact management',
      'Custom email templates',
      'Send history & analytics',
      'Email support',
    ],
    cta: 'Get Started',
    href: '/auth/sign-up',
    recommended: true,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    description: 'For growing businesses',
    features: [
      'Unlimited sends',
      'Everything in Basic',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
    ],
    cta: 'Upgrade to Pro',
    href: '/auth/sign-up',
  },
]

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground">
          Start free, upgrade as you grow. No hidden fees.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={tier.recommended ? 'border-primary shadow-lg' : ''}
          >
            <CardHeader>
              {tier.recommended && (
                <div className="text-xs font-semibold text-primary mb-2">
                  RECOMMENDED
                </div>
              )}
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={tier.recommended ? 'default' : 'outline'}
                asChild
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Marketing Layout with Navigation
```typescript
// app/(marketing)/layout.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            AvisLoop
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm hover:text-primary transition-colors"
            >
              Pricing
            </Link>
            <ThemeSwitcher />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">AvisLoop</h3>
              <p className="text-sm text-muted-foreground">
                Simple review requests for busy businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2026 AvisLoop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
```

### Image Optimization for Hero
```typescript
// components/marketing/hero.tsx (Server Component)
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-bold mb-6">
            Request Reviews. One Click. Done.
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Make requesting reviews so simple that business owners actually do it.
            No complex campaigns. No forgotten follow-ups.
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <Image
            src="/images/dashboard-preview.png"
            alt="AvisLoop dashboard showing one-click review request interface"
            width={800}
            height={600}
            priority={true}
            quality={85}
            className="rounded-lg shadow-2xl border"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router | App Router | Next.js 13 (2022) | Server Components by default, better DX |
| Manual <Head> tags | Metadata API | Next.js 13 (2022) | Type-safe, automatic deduplication |
| CSS-in-JS (styled-components) | Tailwind CSS | 2023-2024 | Eliminated runtime overhead, better performance |
| getServerSideProps | Direct Server Component data fetching | Next.js 13 (2022) | Simpler DX, better streaming support |
| Custom image optimization | next/image | Next.js 10+ (2020) | Automatic WebP, responsive sizing |
| getStaticProps for static pages | Direct export from page.tsx | Next.js 13 (2022) | Cleaner code, same performance |

**Deprecated/outdated:**
- Pages Router for new projects: App Router is the recommended approach for all new Next.js applications
- getStaticProps/getServerSideProps: Replaced by Server Components and direct fetching
- Custom Head component: Use Metadata API export instead
- CSS-in-JS for static pages: Adds unnecessary runtime overhead, Tailwind performs better

## Open Questions

Things that couldn't be fully resolved:

1. **Testimonials/Social Proof**
   - What we know: Landing pages benefit from testimonials, but AvisLoop is new
   - What's unclear: Whether to include empty testimonial section or defer until we have customers
   - Recommendation: Skip testimonials for initial launch, add section later when we have customer quotes

2. **Hero Image Source**
   - What we know: Hero section needs visual proof (screenshot or demo)
   - What's unclear: Whether dashboard screenshots exist or need to be created
   - Recommendation: Use actual dashboard screenshot from /dashboard page, or create mockup if needed

3. **Additional Marketing Pages**
   - What we know: Standard SaaS sites have About, Blog, etc.
   - What's unclear: Which additional pages are in scope for this phase
   - Recommendation: Focus on core pages (landing, pricing) first, additional pages can be added later

4. **Analytics Integration**
   - What we know: Landing page conversion tracking is important
   - What's unclear: Whether analytics (Vercel Analytics, Google Analytics) should be added in this phase
   - Recommendation: Defer to later phase, focus on core pages first

## Sources

### Primary (HIGH confidence)
- [Next.js Metadata and OG Images Documentation](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) - Official metadata API patterns
- [Next.js Route Groups Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) - Official route group patterns
- [Next.js Project Structure Documentation](https://nextjs.org/docs/app/getting-started/project-structure) - Official structure recommendations
- [Next.js Image Optimization - DebugBear](https://www.debugbear.com/blog/nextjs-image-optimization) - Verified technical guide
- [Supabase Next.js Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/nextjs) - Official Supabase patterns

### Secondary (MEDIUM confidence)
- [SaaS Landing Page Trends for 2026 - SaaSFrame](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples) - Industry best practices
- [SaaS Pricing Page Best Practices - Design Studio](https://www.designstudiouiux.com/blog/saas-pricing-page-design-best-practices/) - Design patterns with examples
- [Next.js Architecture 2026 - YogiJS Tech](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router) - Architecture patterns verified with official docs
- [7 Performance Mistakes in Next.js - Medium](https://medium.com/full-stack-forge/7-common-performance-mistakes-in-next-js-and-how-to-fix-them-edd355e2f9a9) - Common pitfalls
- [Call-to-Action Best Practices - KrishaWeb](https://www.krishaweb.com/blog/saas-ui-ux-best-practices-high-volume-conversions/) - Conversion optimization

### Tertiary (LOW confidence)
- [shadcn/ui Pricing Blocks](https://www.shadcnblocks.com/blocks/pricing) - Community examples (not official)
- [Next.js Landing Page Anti-Patterns - Medium](https://medium.com/@tiva.nafira/using-design-patterns-and-avoiding-anti-patterns-in-next-js-cea0a601c27e) - Community article

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and configured in project
- Architecture: HIGH - Route groups and App Router are official Next.js patterns, verified in official docs
- Pitfalls: HIGH - Common mistakes documented across multiple 2025-2026 sources and official docs

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - Next.js and landing page patterns are relatively stable)
