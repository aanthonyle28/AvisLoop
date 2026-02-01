# Architecture Patterns for Creative Landing Page

**Domain:** Marketing landing page redesign for SaaS review request platform
**Researched:** 2026-02-01
**Confidence:** HIGH

## Executive Summary

The new creative landing page should integrate into the existing Next.js App Router architecture using a **progressive enhancement strategy** with clear Server/Client Component boundaries. The recommended approach is a **hybrid architecture** that preserves existing infrastructure (layout, navbar, footer) while replacing page.tsx and its section components with new, animation-rich versions.

**Key architectural decision:** Replace, don't refactor. The existing components are simple enough that creating new versions alongside the old ones minimizes risk and allows for easy rollback.

## Existing Architecture Analysis

### Current State (Working Well)

```
app/(marketing)/
├── layout.tsx              # Sticky nav + footer (KEEP)
├── page.tsx                # Section composition (REPLACE)
└── pricing/
    └── page.tsx            # Pricing table (KEEP for now)

components/
├── marketing/              # Section components (REPLACE most)
│   ├── hero.tsx
│   ├── social-proof.tsx
│   ├── features.tsx
│   ├── stats-section.tsx
│   ├── testimonials.tsx
│   ├── faq-section.tsx
│   ├── cta-section.tsx
│   ├── user-menu.tsx       # (KEEP - shared with app)
│   ├── mobile-nav.tsx      # (KEEP - shared with app)
│   └── pricing-table.tsx   # (KEEP - used on /pricing)
└── ui/                     # Design system (KEEP + EXTEND)
    ├── button.tsx
    ├── card.tsx
    ├── badge.tsx
    ├── geometric-marker.tsx
    └── ...

Design tokens:
├── app/globals.css         # CSS variables (EXTEND)
└── tailwind.config.ts      # Theme config (EXTEND)
```

### What Works Well

1. **Clean route group structure** - `(marketing)` isolates marketing from app
2. **Server Component default** - Fast initial load, good SEO
3. **Shared layout** - Navbar/footer consistent across pages
4. **Design system in place** - UI components, theme tokens, dark mode ready
5. **Metadata API usage** - Proper SEO setup with OpenGraph
6. **Progressive enhancement** - `prefers-reduced-motion` respected

### Integration Points to Preserve

| Component | Why Keep | Used By |
|-----------|----------|---------|
| `layout.tsx` | Auth state, nav, footer | All marketing pages |
| `user-menu.tsx` | Server Component with auth | Navbar |
| `mobile-nav.tsx` | Client Component, works | Navbar |
| `pricing-table.tsx` | Used on `/pricing` page | Pricing page |
| `ui/*` components | Design system foundation | Entire app |
| Theme system | CSS variables, dark mode | Entire app |

## Recommended Architecture for Creative Landing Page

### Strategy: Side-by-Side Replacement

Create new landing page in parallel, then swap atomically.

```
app/(marketing)/
├── layout.tsx                    # UNCHANGED
├── page.tsx                      # REPLACE with new composition
├── _page-v1.tsx.backup          # Backup of old version
└── pricing/page.tsx              # UNCHANGED (for now)

components/marketing/
├── v2/                           # NEW directory for redesign
│   ├── hero-v2.tsx              # Creative hero with animations
│   ├── problem-section.tsx      # New storytelling section
│   ├── solution-section.tsx     # Animated solution showcase
│   ├── features-grid.tsx        # Interactive feature grid
│   ├── social-proof-v2.tsx      # Enhanced social proof
│   ├── testimonials-v2.tsx      # Animated testimonials
│   ├── faq-v2.tsx               # Improved FAQ
│   └── cta-v2.tsx               # Final conversion section
├── [old components]              # KEEP until migration complete
└── user-menu.tsx                 # UNCHANGED

components/ui/
├── [existing]                    # UNCHANGED
└── animated/                     # NEW - animation primitives
    ├── fade-in.tsx              # Scroll-triggered fade
    ├── slide-in.tsx             # Directional slide
    ├── stagger-children.tsx     # Stagger container
    └── parallax-section.tsx     # Parallax wrapper
```

### Component Architecture Pattern

#### Pattern 1: Server Component Wrapper + Client Animation Child

**For sections with simple interactivity:**

```tsx
// components/marketing/v2/hero-v2.tsx (Server Component)
import { HeroContent } from './hero-content'
import { getLatestStats } from '@/lib/data' // Server-side data fetch

export async function HeroV2() {
  const stats = await getLatestStats() // Server fetch

  return (
    <section className="relative overflow-hidden py-20">
      <HeroContent stats={stats} /> {/* Client Component */}
    </section>
  )
}

// components/marketing/v2/hero-content.tsx (Client Component)
'use client'
import { motion } from 'framer-motion'

export function HeroContent({ stats }: { stats: Stats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated content */}
    </motion.div>
  )
}
```

**Why this pattern:**
- Server Component handles data fetching (if needed)
- Client Component isolated to smallest interactive scope
- SEO-friendly - content rendered on server
- Fast initial load - minimal client JS for non-interactive sections

**Source:** [How to Use Framer Motion with Next.js Server Components](https://www.hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components)

#### Pattern 2: Scroll-Triggered Animations

**For sections that animate on scroll:**

```tsx
// components/ui/animated/fade-in.tsx
'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function FadeIn({ children, direction = 'up' }: Props) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const variants = {
    hidden: { opacity: 0, y: direction === 'up' ? 40 : -40 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// Usage in Server Component
import { FadeIn } from '@/components/ui/animated/fade-in'

export function FeatureSection() {
  return (
    <section>
      <FadeIn>
        <h2>Feature Title</h2>
      </FadeIn>
      <FadeIn direction="up">
        <p>Feature description</p>
      </FadeIn>
    </section>
  )
}
```

**Why this pattern:**
- Server Components can use Client animation wrappers
- Animations only run when in viewport (performance)
- Progressive enhancement - content visible without JS
- Reusable across all sections

**Source:** [Next.js 15 Scroll Behavior Guide](https://dev.to/hijazi313/nextjs-15-scroll-behavior-a-comprehensive-guide-387j)

#### Pattern 3: Heavy Animation Dynamic Import

**For complex animations that aren't critical:**

```tsx
// components/marketing/v2/interactive-demo.tsx (Server Component)
import dynamic from 'next/dynamic'

const AnimatedDemo = dynamic(
  () => import('./animated-demo-content'),
  {
    ssr: false, // Skip server rendering
    loading: () => <DemoSkeleton /> // Show placeholder
  }
)

export function InteractiveDemo() {
  return (
    <section>
      <h2>Try It Yourself</h2>
      <AnimatedDemo /> {/* Loaded after hydration */}
    </section>
  )
}
```

**Why this pattern:**
- Heavy animation libraries (GSAP, Lottie) only loaded when needed
- Doesn't block initial page render
- Improves Lighthouse scores (First Contentful Paint)
- User sees content immediately, animation enhances after

**Source:** [How to Keep Rich Animations Snappy in Next.js 15](https://medium.com/@thomasaugot/how-to-keep-rich-animations-snappy-in-next-js-15-46d90f503b15)

### Data Flow

```
User Request
     ↓
app/(marketing)/page.tsx (Server Component)
     ↓
Fetch any server data (stats, testimonials from DB)
     ↓
Render HTML with sections
     ↓
     ├─→ Static sections (Server Components)
     ├─→ Animation wrappers (Client Components - small JS)
     └─→ Interactive sections (Dynamic imports - loaded after)
     ↓
Browser receives HTML
     ↓
Hydration (only for Client Components)
     ↓
Scroll animations activate on viewport enter
```

**Key flow characteristics:**
- Initial HTML includes all content (SEO-friendly)
- Client JS minimal for first paint
- Animations progressively enhance experience
- Heavy features lazy-loaded

## Animation Strategy

### CSS vs JavaScript Decision Matrix

| Use Case | Solution | Reason |
|----------|----------|--------|
| Fade in on scroll | Framer Motion | useInView hook, clean API |
| Slide transitions | Framer Motion | Layout animations built-in |
| Stagger effects | Framer Motion | Variants system ideal |
| Complex timelines | CSS + Tailwind | Simple, no extra JS |
| Parallax effects | Framer Motion | useScroll hook + transforms |
| Micro-interactions | CSS + Tailwind | Hover states, GPU-accelerated |
| Custom curves | CSS Modules | Complex keyframes, full control |

### Recommended Approach: Hybrid

**Framer Motion for:**
- Scroll-triggered entrance animations
- Stagger effects (feature grids, testimonials)
- Page/section transitions
- Interactive animations (hover states with complex choreography)

**Tailwind + CSS for:**
- Simple hover effects (`group-hover:`, `transition-*`)
- Loading states (`animate-pulse`, `animate-spin`)
- Micro-interactions (button states, card lifts)
- Geometric markers, decorative elements

**Why hybrid:**
- Framer Motion: 58KB gzipped (acceptable for landing page impact)
- CSS: 0KB runtime cost, GPU-accelerated
- Use right tool for each job - performance + DX

**Source:** [CSS Modules vs Tailwind CSS: A Comprehensive Comparison](https://medium.com/@ignatovich.dm/css-modules-vs-css-in-js-vs-tailwind-css-a-comprehensive-comparison-24e7cb6f48e9)

### Animation Performance Architecture

```tsx
// app/globals.css - ADD
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Override Framer Motion */
  .motion-reduce {
    animation: none !important;
    transition: none !important;
  }
}

// tailwind.config.ts - ADD
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
}
```

**Progressive enhancement:**
1. Content visible without JS (Server Components)
2. Basic CSS animations for minimal motion
3. Framer Motion enhances with scroll triggers
4. `prefers-reduced-motion` disables all (accessibility)

**Source:** [The Impact of Page Load Animations on Landing Page Performance](https://www.site123.com/learn/the-impact-of-page-load-animations-on-landing-page-performance)

## Image & Asset Optimization

### Strategy: Next.js Image Component + Priority Flags

```tsx
// Hero section - CRITICAL
import Image from 'next/image'

export function HeroV2() {
  return (
    <section>
      <Image
        src="/hero-screenshot.webp"
        alt="AvisLoop dashboard"
        width={1200}
        height={900}
        priority // Preload above fold
        quality={90} // High quality for hero
        placeholder="blur"
        blurDataURL="data:image/..." // Low-res placeholder
      />
    </section>
  )
}

// Below-fold sections - LAZY
export function FeatureGrid() {
  return (
    <section>
      <Image
        src="/feature-contacts.webp"
        alt="Contact management"
        width={800}
        height={600}
        loading="lazy" // Lazy load (default)
        quality={85} // Slightly lower
      />
    </section>
  )
}
```

**Source:** [Next.js Image Component: How to use next/image for performance](https://prismic.io/blog/nextjs-image-component-optimization)

### Asset Architecture

```
public/
├── hero/
│   ├── dashboard-light.webp    # Hero image - light mode
│   ├── dashboard-dark.webp     # Hero image - dark mode
│   └── hero-blur-data.txt      # Blur data URLs
├── features/
│   ├── send-interface.webp     # Feature screenshots
│   ├── contacts-view.webp
│   └── analytics-view.webp
├── social-proof/
│   ├── company-logo-1.svg      # Client logos (SVG preferred)
│   └── company-logo-2.svg
└── decorative/
    ├── gradient-orb.svg        # CSS-animated shapes
    └── geometric-pattern.svg
```

**Optimization checklist:**
- [ ] Use WebP format (smaller than PNG/JPG)
- [ ] Provide AVIF fallback (even smaller, Next.js handles automatically)
- [ ] Generate blur placeholders (prevents layout shift)
- [ ] Mark hero images with `priority`
- [ ] Lazy load below-fold images
- [ ] Use SVG for logos/icons (scalable, small)
- [ ] Set explicit width/height (prevents CLS)

**Source:** [Next.js Image Optimization Guide](https://nextjs.org/docs/app/api-reference/components/image)

### Performance Budget

| Resource | Budget | Actual | Status |
|----------|--------|--------|--------|
| Hero image | 150KB | TBD | Pending |
| Feature screenshots (3×) | 100KB each | TBD | Pending |
| Framer Motion bundle | 60KB gzip | 58KB | ✅ |
| Total images | 500KB | TBD | Pending |
| Total JS | 150KB | TBD | Pending |
| First Contentful Paint | <1.5s | TBD | Pending |
| Largest Contentful Paint | <2.5s | TBD | Pending |

## SEO Architecture

### Metadata Strategy (App Router)

```tsx
// app/(marketing)/page.tsx
import type { Metadata } from 'next'

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'AvisLoop - Get 3× More Reviews Without Chasing Customers',
  description:
    'Send review requests in under 30 seconds. No complex campaigns, no forgotten follow-ups. Just simple requests that actually get sent. Start free today.',
  openGraph: {
    title: 'AvisLoop - Get 3× More Reviews Without Chasing Customers',
    description:
      'Send review requests in under 30 seconds. No complex campaigns, no forgotten follow-ups.',
    url: baseUrl,
    siteName: 'AvisLoop',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.png`, // 1200×630 social share image
        width: 1200,
        height: 630,
        alt: 'AvisLoop - Review request platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AvisLoop - Get 3× More Reviews Without Chasing Customers',
    description:
      'Send review requests in under 30 seconds. No complex campaigns, no forgotten follow-ups.',
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: baseUrl,
  },
}

export default function LandingPage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'AvisLoop',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '127',
            },
          }),
        }}
      />

      {/* Page sections */}
      <HeroV2 />
      <SocialProofV2 />
      {/* ... */}
    </>
  )
}
```

**Structured data benefits:**
- Rich snippets in Google search results
- Better AI search visibility (ChatGPT Search, Perplexity, Gemini)
- Schema.org vocabulary for SaaS apps
- Aggregate ratings display (social proof in SERPs)

**Source:** [Maximizing SEO with Meta Data in Next.js 15](https://dev.to/joodi/maximizing-seo-with-meta-data-in-nextjs-15-a-comprehensive-guide-4pa7)

## Component Breakdown for Creative Landing Page

### Suggested Component Structure

Based on common SaaS landing page patterns and your existing features, here's the recommended section breakdown:

```tsx
// app/(marketing)/page.tsx - NEW VERSION

import { HeroV2 } from '@/components/marketing/v2/hero-v2'
import { SocialProofV2 } from '@/components/marketing/v2/social-proof-v2'
import { ProblemSection } from '@/components/marketing/v2/problem-section'
import { SolutionSection } from '@/components/marketing/v2/solution-section'
import { FeaturesGrid } from '@/components/marketing/v2/features-grid'
import { HowItWorks } from '@/components/marketing/v2/how-it-works'
import { TestimonialsV2 } from '@/components/marketing/v2/testimonials-v2'
import { StatsShowcase } from '@/components/marketing/v2/stats-showcase'
import { FAQV2 } from '@/components/marketing/v2/faq-v2'
import { CTAV2 } from '@/components/marketing/v2/cta-v2'

export default function LandingPage() {
  return (
    <>
      <HeroV2 />              {/* Above fold, priority load */}
      <SocialProofV2 />       {/* Logo bar or testimonial highlights */}
      <ProblemSection />      {/* "Review requests are a pain" */}
      <SolutionSection />     {/* "We make it simple" with demo */}
      <FeaturesGrid />        {/* 3-6 features, interactive cards */}
      <HowItWorks />          {/* 3-step process, animated */}
      <StatsShowcase />       {/* Results-driven metrics */}
      <TestimonialsV2 />      {/* Animated testimonial carousel */}
      <FAQV2 />               {/* Accordion, keep existing FAQs */}
      <CTAV2 />               {/* Final conversion push */}
    </>
  )
}
```

**Source:** [Landing Page Structure: Anatomy & Best Practices](https://www.involve.me/blog/landing-page-structure)

### New Components Needed

| Component | Purpose | Complexity | Animation Level |
|-----------|---------|------------|-----------------|
| `hero-v2.tsx` | Headline + CTA + visual | Medium | High (entrance, parallax) |
| `social-proof-v2.tsx` | Trust indicators | Low | Low (fade in) |
| `problem-section.tsx` | Empathy hook | Low | Medium (scroll reveal) |
| `solution-section.tsx` | Product demo | High | High (interactive demo) |
| `features-grid.tsx` | Feature cards | Medium | Medium (stagger, hover) |
| `how-it-works.tsx` | 3-step process | Medium | High (step progression) |
| `stats-showcase.tsx` | Animated counters | Low | Medium (count-up animation) |
| `testimonials-v2.tsx` | Customer quotes | Medium | Medium (carousel/slider) |
| `faq-v2.tsx` | Questions accordion | Low | Low (reuse existing) |
| `cta-v2.tsx` | Final CTA | Low | Low (simple entrance) |

### Reusable Animation Primitives Needed

```
components/ui/animated/
├── fade-in.tsx              # Opacity 0→1 on scroll
├── slide-in.tsx             # Directional slide on scroll
├── stagger-children.tsx     # Delay between child animations
├── count-up.tsx             # Animated number counter
├── parallax-wrapper.tsx     # Y-transform based on scroll
├── scale-on-hover.tsx       # Grow on hover (cards)
└── reveal-on-scroll.tsx     # Clip-path reveal effect
```

**Build order suggestion:**
1. Create animation primitives first (reusable across sections)
2. Build Hero (highest impact, sets tone)
3. Build simple sections (Social Proof, Problem, CTA) to test primitives
4. Build complex sections (Solution, Features, How It Works)
5. Polish micro-interactions last

## Migration Path

### Phase 1: Parallel Development
```bash
# Create new component directory
mkdir -p components/marketing/v2
mkdir -p components/ui/animated

# Build new components alongside old
# Old site continues running on old components
```

### Phase 2: Testing
```bash
# Create feature flag route for testing
app/(marketing)/v2/page.tsx → uses new components
app/(marketing)/page.tsx → uses old components (production)

# Test v2 route with real users (beta link)
```

### Phase 3: Atomic Swap
```bash
# When ready, swap in one commit
mv app/(marketing)/page.tsx app/(marketing)/_page-v1.backup.tsx
mv app/(marketing)/v2/page.tsx app/(marketing)/page.tsx

# Easy rollback if needed
git revert [commit-hash]
```

### Phase 4: Cleanup
```bash
# After v2 stable for 1 week, remove old components
rm -rf components/marketing/hero.tsx
rm -rf components/marketing/features.tsx
# ... (keep shared components like user-menu, mobile-nav, pricing-table)
```

**Why this approach:**
- Zero downtime migration
- Easy rollback (just swap files back)
- Test new version without affecting production
- Clean separation (v2 directory clear signal)

**Source:** [Refactoring landing page with React, NextJS & TailwindCSS](https://dev.to/dkapanidis/refactoring-landing-page-with-react-nextjs-tailwindcss-2hk8)

## Performance Monitoring

### Core Web Vitals Targets

| Metric | Target | Measurement Point |
|--------|--------|-------------------|
| FCP (First Contentful Paint) | <1.5s | Hero appears |
| LCP (Largest Contentful Paint) | <2.5s | Hero image loaded |
| CLS (Cumulative Layout Shift) | <0.1 | No layout jumps |
| FID (First Input Delay) | <100ms | Button clicks responsive |
| TTI (Time to Interactive) | <3.5s | Animations start |

**Why these targets:**
- Google's "Good" thresholds for Core Web Vitals
- Above targets = better SEO ranking
- Below targets = poor user experience, higher bounce rate

## Anti-Patterns to Avoid

### Anti-Pattern 1: Animation Everything
**What:** Adding entrance animations to every element on the page
**Why bad:** Overwhelming, slow perceived performance, seizure risk
**Instead:** Animate only key sections (hero, features). Keep body copy static.

### Anti-Pattern 2: Client Component Creep
**What:** Making entire sections 'use client' for one small animation
**Why bad:** Loses Server Component benefits (streaming, smaller JS bundle)
**Instead:** Wrap only the interactive part in a Client Component

```tsx
// BAD
'use client'
export function FeatureSection() {
  return (
    <section>
      <h2>Static heading</h2>
      <p>Static paragraph</p>
      <motion.div>Animated card</motion.div> {/* Only this needs client */}
    </section>
  )
}

// GOOD
export function FeatureSection() {
  return (
    <section>
      <h2>Static heading</h2>
      <p>Static paragraph</p>
      <AnimatedCard /> {/* Client Component wrapper */}
    </section>
  )
}
```

**Source:** [Solving Framer Motion Page Transitions in Next.js App Router](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router)

### Anti-Pattern 3: Inline Animation Definitions
**What:** Defining animation variants inside render functions
**Why bad:** Re-creates objects on every render, causes jank
**Instead:** Define variants outside component or use useMemo

```tsx
// BAD
export function Hero() {
  const variants = { hidden: {}, visible: {} } // Re-created every render
  return <motion.div variants={variants}>...</motion.div>
}

// GOOD
const variants = { hidden: {}, visible: {} } // Created once

export function Hero() {
  return <motion.div variants={variants}>...</motion.div>
}
```

### Anti-Pattern 4: No Accessibility Fallbacks
**What:** Animations with no `prefers-reduced-motion` support
**Why bad:** Inaccessible to users with vestibular disorders
**Instead:** Always respect `prefers-reduced-motion` media query

```tsx
// BAD
<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
>
  Content
</motion.div>

// GOOD
<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="motion-reduce:transform-none motion-reduce:opacity-100"
>
  Content
</motion.div>
```

### Anti-Pattern 5: Blocking Animations
**What:** Heavy animations that prevent content from rendering
**Why bad:** Users see blank screen, high bounce rate
**Instead:** Use Server Components for content, enhance with animations after

## Integration with Existing System

### Preserving Design Tokens

```tsx
// components/marketing/v2/hero-v2.tsx
import { GeometricMarker } from '@/components/ui/geometric-marker' // REUSE

export function HeroV2() {
  return (
    <section className="py-20 bg-background"> {/* CSS variables */}
      <motion.h1 className="text-foreground"> {/* Theme-aware */}
        Get More Reviews
      </motion.h1>
      <GeometricMarker variant="triangle" color="lime" /> {/* Existing component */}
    </section>
  )
}
```

**Key integrations:**
- Use existing CSS variables (`--background`, `--foreground`, etc.)
- Reuse `geometric-marker.tsx` for brand consistency
- Reuse `button.tsx`, `card.tsx` from UI library
- Maintain dark mode support (all new components must support)

### Dark Mode Considerations

```tsx
// All animations must work in both themes
<motion.div className="bg-card border-border"> {/* Not bg-white */}
  <h2 className="text-foreground"> {/* Not text-gray-900 */}
    Feature Title
  </h2>
  <p className="text-muted-foreground"> {/* Not text-gray-600 */}
    Feature description
  </p>
</motion.div>
```

**Testing checklist:**
- [ ] All sections visible in light mode
- [ ] All sections visible in dark mode
- [ ] Animations smooth in both modes
- [ ] No hardcoded colors (use CSS variables)

## Build Order Recommendation

Based on dependencies and impact:

### Week 1: Foundation
1. Set up animation primitive components (`components/ui/animated/`)
2. Create v2 directory structure
3. Build `hero-v2.tsx` (highest impact)
4. Test hero in isolation

### Week 2: Core Sections
5. Build `social-proof-v2.tsx`
6. Build `problem-section.tsx`
7. Build `solution-section.tsx`
8. Compose into test route (`app/(marketing)/v2/page.tsx`)

### Week 3: Feature Showcase
9. Build `features-grid.tsx`
10. Build `how-it-works.tsx`
11. Build `stats-showcase.tsx`
12. Test interactive animations

### Week 4: Social Proof & Conversion
13. Build `testimonials-v2.tsx`
14. Refactor `faq-v2.tsx` (or reuse existing with new styling)
15. Build `cta-v2.tsx`
16. Full page testing

### Week 5: Polish & Performance
17. Optimize images (WebP conversion, blur placeholders)
18. Add structured data (JSON-LD)
19. Lighthouse CI setup
20. Accessibility audit (`prefers-reduced-motion`, keyboard nav)

### Week 6: Launch
21. Beta testing with real users
22. Performance monitoring
23. Atomic swap (replace old page.tsx)
24. Monitor analytics for bounce rate, conversion rate

**Total estimated effort:** 6 weeks (1 developer)

## Sources

### Architecture Patterns
- [Next.js 15 Scroll Behavior Guide](https://dev.to/hijazi313/nextjs-15-scroll-behavior-a-comprehensive-guide-387j)
- [Smooth Scroll with Next.js, GSAP, Locomotive](https://blog.olivierlarose.com/tutorials/smooth-scroll)
- [How to Use Framer Motion with Next.js Server Components](https://www.hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components)
- [Solving Framer Motion Page Transitions in Next.js App Router](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router)

### Performance & Optimization
- [How to Keep Rich Animations Snappy in Next.js 15](https://medium.com/@thomasaugot/how-to-keep-rich-animations-snappy-in-next-js-15-46d90f503b15)
- [Optimizing Performance in Next.js Using Dynamic Imports](https://dev.to/bolajibolajoko51/optimizing-performance-in-nextjs-using-dynamic-imports-5b3)
- [Next.js Image Optimization Guide](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js Image Component: How to use next/image for performance](https://prismic.io/blog/nextjs-image-component-optimization)

### SEO & Metadata
- [Maximizing SEO with Meta Data in Next.js 15](https://dev.to/joodi/maximizing-seo-with-meta-data-in-nextjs-15-a-comprehensive-guide-4pa7)
- [Next.js Metadata API Documentation](https://nextjs.org/learn/seo/metadata)

### Landing Page Best Practices
- [Landing Page Structure: Anatomy & Best Practices](https://www.involve.me/blog/landing-page-structure)
- [10 SaaS Landing Page Trends for 2026](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples)
- [The Impact of Page Load Animations on Landing Page Performance](https://www.site123.com/learn/the-impact-of-page-load-animations-on-landing-page-performance)

### CSS & Styling Strategy
- [CSS Modules vs Tailwind CSS: A Comprehensive Comparison](https://medium.com/@ignatovich.dm/css-modules-vs-css-in-js-vs-tailwind-css-a-comprehensive-comparison-24e7cb6f48e9)
- [Page UI - Landing page components for React & Next.js](https://github.com/danmindru/page-ui)
- [Refactoring landing page with React, NextJS & TailwindCSS](https://dev.to/dkapanidis/refactoring-landing-page-with-react-nextjs-tailwindcss-2hk8)
