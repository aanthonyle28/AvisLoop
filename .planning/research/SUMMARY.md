# Project Research Summary

**Project:** AvisLoop Landing Page Redesign (v1.4)
**Domain:** B2B SaaS Marketing Landing Page (Review Management Platform)
**Researched:** 2026-02-01
**Confidence:** HIGH

## Executive Summary

The AvisLoop landing page redesign should prioritize **conversion over creativity**. Research shows that landing pages targeting local service businesses (dentists, salons, contractors) require clarity, trust signals, and outcome-focused messaging—not abstract concepts or developer-tool aesthetics. The recommended approach is a **CSS-first animation strategy with selective JavaScript**, maintaining sub-2.5s LCP while adding meaningful motion that enhances rather than obscures the value proposition.

The critical insight from studying 100+ SaaS landing pages and competitor analysis (Podium, Birdeye, NiceJob) is that AvisLoop's positioning sweet spot is **simplicity over enterprise complexity**. Where competitors charge $300-600/month for feature-bloated platforms, AvisLoop wins by being "stupid simple"—get reviews in 2 clicks, no training needed. This positioning must be reflected in both design aesthetic (professional but approachable, not cutting-edge trendy) and copy (benefit-driven, jargon-free). The research identified 11 critical pitfalls, with the top three being: (1) animation-driven performance degradation (53% of users abandon if load >3s), (2) clarity sacrificed for cleverness (confused visitors bounce in 3 seconds), and (3) mobile experience as afterthought (63% of traffic is mobile).

The recommended architecture preserves existing Next.js App Router patterns while introducing new v2 components in parallel for safe migration. Use Server Components by default, wrap animations in minimal Client Components, and leverage the existing design system (CSS variables, dark mode, geometric markers) to maintain brand consistency between landing page and sign-up flow. Deploy with feature flags for gradual rollout (10% → 50% → 100%) with instant rollback capability.

## Key Findings

### Recommended Stack

**Approach:** Extend existing stack with minimal additions. The landing page already has Next.js 15, React 19, Tailwind CSS 3.4, and dark mode support—build on this foundation rather than introducing heavy libraries. Priority is **perceived performance** (animations that feel premium but load instantly) over "feature richness."

**Core technologies:**
- **@midudev/tailwind-animations** (1.0.7) — Lightweight animation utilities — Adds scroll-triggered animations (fade-in, slide-in, zoom) via Tailwind classes with zero runtime cost, compatible with existing tailwindcss-animate
- **CSS Scroll-driven Animations** (Native browser API) — Parallax and scroll reveals — Zero JavaScript, compositor-thread optimized, Safari 26+ support, polyfill available for older browsers
- **Framer Motion** (12.27.0+, optional) — Complex hero interactions only — React 19 compatible, but adds 82KB to bundle, use sparingly and only for hero section orchestration if truly needed
- **Next.js Image Component** (built-in) — Hero/feature images — Priority loading for above-fold, lazy loading below-fold, WebP/AVIF automatic format optimization, blur placeholders to prevent CLS

**What NOT to add:**
- GSAP (40-50KB, overkill for marketing pages)
- Three.js (3D is off-brand and massive bundle impact)
- lottie-web (use @dotlottie/react-player with .lottie format if needed, below-fold only)

**Performance budget:** FCP <1.5s, LCP <2.5s, CLS <0.1, animation library budget <15KB (prefer CSS-only approach to hit this target).

### Expected Features

Research into 2025-2026 SaaS landing page trends and local business positioning reveals a clear hierarchy.

**Must have (table stakes):**
- Clear, benefit-driven headline (5-second test: "Can a dentist understand what this does?")
- Above-the-fold CTA (304% better conversion than below-fold)
- Social proof immediately after hero (client logos or "Trusted by 1,000+ dentists")
- Trust signals ("No credit card required", "Cancel anytime", money-back guarantee)
- Customer testimonials with specific outcomes ("Got 30 reviews in 2 weeks" > "Great tool!")
- Mobile-first responsive design (62%+ of traffic, Google mobile-first indexing)
- FAQ section near conversion points (addresses objections, increases conversion ~80%)
- Pricing transparency (hiding pricing adds friction, reduces lead quality)
- Free trial CTA (industry standard for low-touch SaaS, avoid credit card at signup)

**Should have (differentiators):**
- Animated product demo in hero (shows transformation in 3-5 seconds, not just description)
- Scrollytelling / scroll-triggered reveals (increases engagement and time-on-page)
- Outcome-focused copy ("Save 10 hours weekly" vs "Automated email sending")
- Pain-point storytelling (address forgetting to ask, awkwardness, manual follow-up headaches)
- Minimal motion that adds meaning (Linear/Notion style, not overwhelming)
- One-click Google review link preview (visual proof of simplicity claim)
- Clear positioning vs alternatives (simpler than Podium, more affordable than Birdeye, more consistent than manual)
- Industry-specific social proof (segment testimonials by dentists/salons/contractors)

**Defer (v2+):**
- Interactive product walkthrough (embedded preview requires engineering complexity, use video walkthrough initially)
- Industry-specific landing pages (dentists vs salons, start with generic, A/B test later)
- Video testimonials (written testimonials are simpler to implement, equal or better conversion)
- Advanced animations (particle effects, 3D elements, complex WebGL)

**Anti-features (explicitly avoid):**
- Slow loading animations (>3s load time kills 53% of mobile users)
- Multiple competing CTAs (creates decision paralysis, reduces conversion)
- Feature-heavy copy / jargon ("omnichannel reputation management platform" → "Get more reviews")
- Hidden pricing or gated demos (adds friction, builds distrust)
- Generic stock photos (use real product screenshots or real customer photos)
- Auto-play video with sound (increases bounce rate)
- Vague, template headlines ("The Future of Review Management" → "Get 3× More Google Reviews in 2 Minutes")

### Architecture Approach

**Strategy:** Side-by-side replacement using v2 component directory. Create new landing page components in parallel with old versions, then atomic swap when validated. This preserves existing infrastructure (layout, navbar, footer, auth, design system) while minimizing risk.

**Major components:**
1. **Server Component wrapper pattern** — Section components are Server Components by default, with minimal Client Component wrappers for animations. This preserves SEO benefits (content indexed by Google) while enabling progressive enhancement with scroll-triggered animations.
2. **Reusable animation primitives** (`components/ui/animated/`) — Build library of composable animation wrappers (FadeIn, SlideIn, StaggerChildren, CountUp) that work in both light/dark mode, respect prefers-reduced-motion, and use Intersection Observer for viewport-triggered animations.
3. **Performance-first image strategy** — Use Next.js Image component with priority flag for hero images (preload LCP), lazy loading for below-fold images, WebP format, blur placeholders to prevent CLS, explicit width/height to reserve layout space.
4. **Progressive enhancement flow** — Content visible without JavaScript (Server Components), basic CSS animations for minimal motion, Framer Motion enhances with scroll triggers, prefers-reduced-motion disables all animations for accessibility.
5. **Shared design tokens** — Reuse existing CSS variables (--background, --foreground, --primary, etc.) from globals.css to maintain dark mode support and brand consistency. New animations must use semantic color tokens (bg-card, text-foreground, border-border) not hardcoded colors.
6. **Migration-safe architecture** — Old components remain untouched in `components/marketing/`, new components in `components/marketing/v2/`, feature flag enables gradual rollout, easy rollback by swapping file imports.

**Data flow:** User Request → Server Component (fetch stats/testimonials from DB if needed) → Render HTML with sections → Browser receives full HTML → Hydration only for Client Components → Scroll animations activate on viewport enter.

### Critical Pitfalls

Research identified 11 pitfalls from analyzing failed redesigns, performance case studies, and accessibility audits. Top 5:

1. **Animation-driven performance degradation (LCP/CLS)** — Heavy animations delay Largest Contentful Paint (>2.5s) and cause layout shift. Prevention: Use CSS animations with transform/opacity (GPU-accelerated), reserve space with min-height to prevent CLS, lazy-load animations below fold, test on real devices (Moto G Power, not just MacBook). Google emphasizes INP <200ms in 2026; pages that load in 1s have 3× higher conversion than 5s loads.

2. **Being clever at the expense of clarity** — Creative headlines with wordplay don't communicate value to busy local business owners. Prevention: 5-second test with target audience ("Can a dentist understand what this does?"), use customer language from interviews, show product screenshots not abstract concepts, trust signals local businesses care about (not SOC 2 compliance or 99.99% uptime).

3. **Mobile experience as afterthought** — Desktop-first designs stacked vertically create 10-screen-high mobile pages with janky animations. Prevention: Design mobile-first (320px-428px width), touch targets ≥44px, test on real devices with 3G throttling, sticky CTA on mobile, separate optimized images for mobile (not just responsive scaling), no hover-only interactions.

4. **Dark mode breaking visual effects** — Shadows invisible on dark backgrounds, gradients create harsh contrasts, low-contrast text becomes unreadable (79.1% of homepages have WCAG contrast failures). Prevention: Use semantic color tokens (bg-card, text-foreground, not hardcoded colors), replace shadows with borders in dark mode, test contrast ratios (WCAG AA requires 4.5:1), design in both modes simultaneously.

5. **SEO regression during redesign** — Changed URLs without 301 redirects, hero content moved to client-rendered components (Google sees empty shell), removed structured data. Prevention: Preserve URL structure or add redirects, ensure hero is Server Component (content indexed immediately), maintain Schema.org markup (SoftwareApplication type with pricing/ratings), monitor Search Console for crawl errors week 1 after launch.

**Additional critical pitfalls:** Multiple CTAs creating decision paralysis (reduces conversion by up to 266%), hydration mismatch with scroll animations (causes console errors and layout shifts), inconsistent design between landing page and sign-up flow (trust erosion), analytics tracking breaks during redesign (2-4 weeks of missing conversion data), wrong aesthetic for target audience (local business owners want professional/approachable, not trendy/edgy), no rollback plan or A/B test strategy (locked into failing redesign).

## Implications for Roadmap

Based on research, suggested phase structure prioritizes high-impact sections first, front-loads risk mitigation, and enables incremental validation.

### Phase 1: Foundation & Hero Section
**Rationale:** Hero section has highest impact on conversion (first 3-5 seconds determine bounce). Building animation primitives first creates reusable patterns for all subsequent phases. Establishing performance budget and dark mode support early prevents rework later.

**Delivers:**
- Animation primitive components (FadeIn, SlideIn, StaggerChildren, ParallaxWrapper)
- Hero v2 with outcome-focused headline, animated product preview, above-fold CTA
- Social proof strip (client logos or testimonial highlights)
- Design tokens extended for animations (CSS variables for duration/easing)
- Performance baseline established (Lighthouse CI configured, LCP <2.5s target)

**Addresses features:**
- Clear, benefit-driven headline (table stakes)
- Above-the-fold CTA (table stakes)
- Animated product demo in hero (differentiator)
- Social proof immediately after hero (table stakes)
- Dark mode support for all new components (technical requirement)

**Avoids pitfalls:**
- Multiple CTAs (single primary CTA repeated consistently)
- Animation performance degradation (CSS-first approach, performance budget enforced)
- Being clever at expense of clarity (user-test headline with 5 local business owners before building)
- Dark mode breaking visual effects (design in both modes simultaneously, use semantic color tokens)
- Mobile experience as afterthought (design mobile layout first, then scale up)
- Wrong aesthetic for target audience (validate with local business owner interviews)

**Research flags:** Standard patterns (well-documented hero section examples from Linear, Notion, Stripe). No deeper research needed.

---

### Phase 2: Problem/Solution Storytelling
**Rationale:** After grabbing attention in hero, need emotional connection through pain-point storytelling. This section differentiates AvisLoop (simplicity positioning) and builds trust before feature details.

**Delivers:**
- Problem section (empathy hook: "Review requests are a pain—forgetting, awkwardness, complexity")
- Solution section (product demo showing 2-minute send flow)
- How It Works (3-step visual: Add contact → Write message → Send)
- Stats showcase (animated counters for social proof: "50,000+ reviews collected")

**Addresses features:**
- Pain-point storytelling (differentiator)
- Outcome-focused copy (differentiator)
- One-click Google review link preview (differentiator)
- Trust signals (table stakes)

**Avoids pitfalls:**
- Being clever at expense of clarity (show actual product, not metaphors)
- Hydration mismatch (use 'use client' for animation components, avoid dynamic CSS values)

**Research flags:** Standard patterns (3-step "how it works" is ubiquitous in SaaS landing pages). No deeper research needed.

---

### Phase 3: Features, Testimonials, FAQ
**Rationale:** Middle-funnel conversion elements. Features justify the value, testimonials provide social proof with specific outcomes, FAQ handles final objections.

**Delivers:**
- Features grid (3-6 interactive cards with benefits: "Get more reviews", "Save time", "No awkward asks")
- Testimonials v2 (carousel or stagger animation, outcome-focused quotes with real customer photos)
- FAQ v2 (accordion, preemptively address: setup time, email compatibility, response rates, HIPAA/privacy)
- Final CTA (repeat free trial CTA with risk-reversal: "No credit card required")

**Addresses features:**
- Customer testimonials with specific outcomes (table stakes)
- FAQ section (table stakes)
- Industry-specific social proof (differentiator)
- Minimal motion that adds meaning (differentiator)

**Avoids pitfalls:**
- Mobile experience (test all interactive elements on real devices, ensure touch targets ≥44px)
- Dark mode edge cases (run axe DevTools audit for both light/dark modes)

**Research flags:** Standard patterns (feature grids and FAQ sections are well-established). No deeper research needed.

---

### Phase 4: Performance Optimization & SEO
**Rationale:** Before launch, validate Core Web Vitals, ensure SEO elements preserved, set up analytics tracking verification. This phase de-risks launch.

**Delivers:**
- Image optimization (convert to WebP, generate blur placeholders, set priority flags)
- Lighthouse CI configured (block merge if LCP >2.5s or CLS >0.1)
- Structured data added (Schema.org SoftwareApplication type with pricing/ratings)
- Metadata verified (page titles, meta descriptions, OpenGraph images)
- Analytics tracking tested (all GA4 events fire correctly, conversion funnels work end-to-end)
- Accessibility audit (WCAG AA contrast ratios, keyboard navigation, screen reader compatibility)
- A/B testing infrastructure (feature flags via Vercel Edge Config or environment variable toggle)

**Addresses features:**
- Pricing transparency (table stakes, verify SEO metadata includes pricing info)
- Mobile-first responsive design (validate with real device testing)

**Avoids pitfalls:**
- Animation performance degradation (enforce performance budget with Lighthouse CI)
- SEO regression (preserve URL structure, ensure Server Components for hero content, maintain structured data)
- Analytics tracking breaks (test all events in staging, document current tracking before migration)
- Mobile experience (test on iPhone SE, Moto G Power with 3G throttling)

**Research flags:** Standard patterns (performance optimization is well-documented). No deeper research needed, but requires careful execution and testing.

---

### Phase 5: Sign-up Flow Alignment & Launch
**Rationale:** Ensure design consistency at conversion point (landing page → sign-up → onboarding). Deploy with gradual rollout for safe validation.

**Delivers:**
- Sign-up page updated to match landing page aesthetic (shared Button, Card, typography components)
- Onboarding flow updated with new design tokens
- Feature flag deployment (10% of traffic week 1, 50% week 2, 100% week 3)
- Real-time monitoring dashboard (conversion rate, Core Web Vitals, error rate)
- Rollback procedure documented and tested
- Success criteria defined (conversion rate ≥3.2%, LCP <2.5s, CLS <0.1, no increase in error rate)

**Addresses features:**
- Free trial CTA (table stakes, ensure sign-up flow matches landing page promise)

**Avoids pitfalls:**
- Inconsistent design language between marketing and app (update sign-up flow to match landing page, use shared components)
- No rollback plan or A/B test strategy (feature flag enables instant rollback, gradual rollout de-risks launch)

**Research flags:** Standard patterns (gradual rollout is industry best practice). No deeper research needed.

---

### Phase Ordering Rationale

- **Dependencies:** Animation primitives (Phase 1) are reused in all subsequent phases. Performance budget (Phase 1) prevents rework. SEO/analytics verification (Phase 4) must happen before launch (Phase 5).
- **Risk mitigation:** Front-load highest-risk areas (hero section performance, mobile experience, dark mode support) in Phase 1. Validate with user testing before building remaining sections.
- **Incremental validation:** Each phase delivers standalone value. Phase 1 hero can be tested in isolation. Phase 2-3 build on validated foundation. Phase 4 de-risks launch. Phase 5 ensures safe deployment.
- **Avoiding pitfalls:** Research shows most landing page redesigns fail due to performance degradation (Phase 1/4 mitigation), unclear messaging (Phase 1 user testing), mobile UX issues (Phase 1 mobile-first design), or SEO regression (Phase 4 verification). This phase structure addresses these systematically.

### Research Flags

**Phases with standard patterns (skip deeper research):**
- **All phases** — Landing page redesign has extensive documentation (100+ examples analyzed, SaaSFrame/Unbounce/Landingfolio case studies). Architecture patterns (Server/Client Component split, animation primitives, performance optimization) are well-established in Next.js community.

**Phases needing extra validation (not deeper research, but careful execution):**
- **Phase 1** — User-test headline and hero design with 5-10 local business owners before building. Validate aesthetic fits target audience (professional but approachable, not trendy/edgy).
- **Phase 4** — Real device testing on budget Android (Moto G Power) and older iOS (iPhone SE) with 3G throttling. Performance budget enforcement is critical.
- **Phase 5** — Monitor conversion rate hourly on launch day. Have instant rollback procedure ready.

**No phases require /gsd:research-phase during planning.** All patterns are well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | CSS-first approach with selective JavaScript is proven pattern. Framer Motion React 19 compatibility verified (v12.27.0+). Browser API support (Scroll-driven Animations, Intersection Observer) confirmed for Safari 26+/Chrome 115+. Performance impact of animation libraries benchmarked. |
| Features | HIGH | Synthesized from 100+ SaaS landing page examples (SaaSFrame, Landingfolio, KlientBoost), competitor analysis (Podium/Birdeye/NiceJob), conversion optimization research (Unbounce case studies), local business positioning research. Table stakes vs differentiators distinction validated across multiple sources. |
| Architecture | HIGH | Next.js App Router Server/Client Component patterns are established best practices (official Next.js docs, Hemant Sundaray blog, ImCorfitz blog). Side-by-side replacement strategy validated in refactoring case studies (Dev.to examples). Performance optimization patterns verified (Vercel docs, Core Web Vitals guides). |
| Pitfalls | MEDIUM-HIGH | Based on 2026 WebSearch results, performance benchmarks (Core Web Vitals data, Lighthouse studies), UX research (accessibility audits, mobile optimization studies), and landing page failure case studies. Specific pitfall impact percentages (53% abandon >3s load, 304% CTA lift above-fold, 266% multi-CTA conversion drop) from cited research. Some findings are correlational not causal, but patterns consistent across sources. |

**Overall confidence:** HIGH

Research is comprehensive with convergent findings from multiple high-quality sources. Stack recommendations are conservative (extend existing tools, minimal new dependencies). Architecture patterns are proven in Next.js community. Feature hierarchy validated across 50+ competitive landing pages. Pitfall identification based on real failure case studies and performance data.

### Gaps to Address

**Animation complexity threshold:** Research consensus is "minimal motion that adds meaning" (Linear/Notion style), but exact threshold for "too much animation" for local business owner audience is uncertain. **Mitigation:** User-test with 5-10 target customers, measure scroll depth and time-on-page, compare to pre-redesign baseline. If time-on-page decreases or scroll depth drops, animations are overwhelming.

**Industry-specific messaging:** Unclear whether single generic landing page or separate pages for dentists/salons/contractors converts better. Research shows industry-specific social proof increases relatability, but creates maintenance complexity. **Mitigation:** Start with single page using togglable testimonials by industry. A/B test generic vs industry-specific headline after launch (Phase 5+).

**Video vs animated walkthrough:** Some research advocates for 30-second explainer video, other sources show animated UI walkthrough performs better for SaaS. Unclear which is optimal for AvisLoop's local business audience. **Mitigation:** Start with animated walkthrough (lower production cost, easier to update). If conversion doesn't hit target (3.2%+), test video version in A/B test.

**Framer Motion necessity:** Research shows Framer Motion adds 82KB but enables complex hero animations. Unclear if hero section truly needs this complexity or if CSS-only approach is sufficient. **Mitigation:** Build Phase 1 hero with CSS animations first (fade-in, slide-in). If stakeholder feedback demands more complex orchestration, add Framer Motion conditionally with dynamic import (ssr: false).

**Gradual rollout duration:** Research consensus is 10% → 50% → 100% rollout, but duration unclear (1 week per step vs 2 weeks?). **Mitigation:** Week 1 at 10%, monitor hourly. If conversion rate ≥3.2% and no errors, move to 50% week 2. If still stable, 100% week 3. Extend timeline if any metric degrades >10%.

## Sources

### Primary Sources (HIGH confidence)

**Stack research:**
- [Framer Motion React 19 Compatibility](https://github.com/motiondivision/motion/issues/2668) — Verified v12.27.0+ official support
- [Motion Changelog](https://motion.dev/changelog) — Latest React 19 fixes documented
- [WebKit Scroll-driven Animations Guide](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/) — Safari 26+ support confirmed
- [CSS Scroll-driven Animations - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) — Native API reference
- [Next.js Image Component Docs](https://nextjs.org/docs/app/api-reference/components/image) — Official optimization guide

**Features research:**
- [SaaSFrame: 10 SaaS Landing Page Trends for 2026](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples) — 100+ examples analyzed
- [Unbounce: 26 SaaS Landing Pages](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/) — Conversion best practices, 304% above-fold CTA lift, 27% H1 "you" usage
- [Evil Martians: 100 Dev Tool Landing Pages Study](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025) — What converts for tech audiences
- [Landingfolio: 341 Best SaaS Landing Page Examples](https://www.landingfolio.com/inspiration/landing-page/saas) — Pattern library
- [Webstacks: SaaS Website Conversions 2026](https://www.webstacks.com/blog/website-conversions-for-saas-businesses) — Decision paralysis data, multi-CTA conversion drops

**Architecture research:**
- [Next.js 15 Scroll Behavior Guide](https://dev.to/hijazi313/nextjs-15-scroll-behavior-a-comprehensive-guide-387j) — App Router scroll patterns
- [Hemantasundaray: Framer Motion with Server Components](https://www.hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components) — Server/Client Component wrapper pattern
- [ImCorfitz: Framer Motion Page Transitions in App Router](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router) — Hydration avoidance patterns
- [Next.js Metadata API Docs](https://nextjs.org/learn/seo/metadata) — Official SEO guide
- [Prismic: next/image Performance](https://prismic.io/blog/nextjs-image-component-optimization) — Optimization patterns

**Pitfalls research:**
- [Core Web Vitals 2026: INP ≤200ms](https://www.neoseo.co.uk/core-web-vitals-2026/) — 2026 Google performance requirements
- [CSS for Web Vitals](https://web.dev/articles/css-web-vitals) — Animation performance best practices
- [OptinMonster: Mobile Landing Page Best Practices](https://optinmonster.com/mobile-landing-page-best-practices/) — 63% mobile traffic stat, touch target minimums
- [Dark Mode Design Best Practices 2026](https://www.tech-rz.com/blog/dark-mode-design-best-practices-in-2026/) — Contrast ratio requirements, pure black avoidance
- [Website Redesign SEO Guide 2026](https://moswebdesign.com/articles/website-redesign-for-seo/) — 301 redirect strategies, structured data preservation

### Secondary Sources (MEDIUM confidence)

**Competitor positioning:**
- [Crazy Egg: Podium Review](https://www.crazyegg.com/blog/podium-review/) — $300-600/mo pricing, complexity issues
- [Review Dingo: Birdeye vs Podium](https://reviewdingo.com/birdeye-vs-podium-vs-reputation-best/) — Feature comparison, enterprise focus
- [GatherUp vs NiceJob Comparison](https://reviewgrower.com/gatherup-vs-nicejob/) — Mid-tier competitor positioning

**Local business audience:**
- [Social Pilot: How to Get More Google Reviews](https://www.socialpilot.co/reviews/blogs/how-to-get-google-reviews) — Local business pain points (forgetting, awkwardness)
- [Emitrr: Dental Reputation Management Software](https://emitrr.com/blog/review-and-reputation-management-software-for-dental-office/) — Industry-specific needs
- [Pipedrive: Emotional Marketing for SMBs](https://www.pipedrive.com/en/blog/emotional-marketing) — Emotional triggers (relief, control, gratitude)

**Conversion optimization:**
- [First Page Sage: Average SaaS Conversion Rates 2026](https://firstpagesage.com/reports/cta-conversion-rates-report/) — 2-5% trial conversion benchmark
- [Custify: Free Trial Conversion Rate](https://www.custify.com/blog/free-trial-conversion-rate/) — No credit card best practice
- [Abmatic: SaaS Landing Page Mistakes](https://abmatic.ai/blog/top-saas-landing-page-mistakes-to-avoid) — Anti-patterns documented

### Tertiary Sources (LOW confidence, needs validation)

**Animation impact:**
- [Lottie Performance Issues](https://forum.lottiefiles.com/t/lottiefile-in-next-js-webcore-vitals-performance-issue/1747) — Community forum reports (anecdotal)
- [SVGator: Animated Landing Page Examples](https://www.svgator.com/blog/animated-landing-pages-examples/) — Creative examples (not conversion data)

**A/B testing strategy:**
- [Workshop Digital: Landing Page Optimization](https://www.workshopdigital.com/blog/how-landing-page-optimization-affects-conversion-rates/) — Case studies (limited sample size)
- [Unbounce: CRO Case Studies](https://unbounce.com/conversion-rate-optimization/cro-case-studies/) — 12 examples (vary by industry)

---

*Research completed: 2026-02-01*
*Ready for roadmap: Yes*
