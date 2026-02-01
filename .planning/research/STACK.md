# Technology Stack for Landing Page Redesign

**Project:** AvisLoop Landing Page Redesign
**Researched:** 2026-02-01
**Existing Stack:** Next.js 15/16 (App Router), React 19, Tailwind CSS 3.4, tailwindcss-animate

## Executive Summary

**Recommendation:** Use CSS-first approach with selective JavaScript animation for maximum creative impact with minimal performance cost. Avoid heavy animation libraries. Leverage native browser APIs and extend existing Tailwind setup.

**Core principle:** The best landing page animations are those that feel premium but load instantly. CSS provides 80% of creative needs at 5% of the JavaScript cost.

## Animation Stack Recommendations

### Tier 1: CSS-Only Animations (Use for 80% of effects)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **CSS Scroll-driven Animations** | Native | Scroll-triggered reveals, parallax | Zero JS, compositor-thread optimized, Safari 26+ support, Chrome 115+, polyfill available |
| **tailwindcss-animate** | 1.0.7 (installed) | Basic transitions, fades, slides | Already in stack, JIT-optimized, no additional dependencies |
| **@midudev/tailwind-animations** | ^1.1.0 | Extended animation library | Community-powered, includes scroll-based animations, fade/slide/zoom/rotate/flip/bounce/shake, lightweight |
| **CSS View Transitions API** | Native | Page/section transitions | Next.js 15.2+ experimental support, native browser API, no library needed |

**Rationale:** CSS animations run on compositor thread (60fps even on main thread blocking), have zero bundle cost, and browser support is excellent in 2026. Scroll-driven animations finally have Safari 26 support, making them production-ready.

### Tier 2: Selective JavaScript Animation (Use for 10-15% of effects)

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| **Framer Motion** | ^12.27.0 | Complex gesture interactions, orchestrated sequences | React 19 compatible (v12+), use ONLY for hero section complex interactions or features requiring spring physics |
| **Intersection Observer API** | Native | Lazy-load animations, scroll triggers | CSS scroll-driven animations' fallback, excellent performance, universal support |
| **CSS custom properties + JS** | Native | Dynamic color transitions, cursor effects | Minimal JS that manipulates CSS vars, maintains hardware acceleration |

**Rationale:** Framer Motion now officially supports React 19 (v12.27.0, published Feb 2026). However, it adds 82kb to bundle. Use sparingly and wrap in client components with 'use client' directive. Intersection Observer is the most performant JS approach for scroll animations when CSS scroll-driven animations need polyfill.

### Tier 3: Media & Visual Effects (Use for 5% of hero/feature sections)

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| **HTML5 `<video>` with autoplay** | Native | Hero background videos | Use 720p max, <10MB, <10sec loop, with poster image for LCP, preload="auto" for above-fold only |
| **@dotlottie/react-player** | ^0.3.0 | Icon/micro animations | Use .lottie format (80% smaller than JSON), lazy-load, avoid for hero section due to WASM LCP impact |
| **SVG + CSS animations** | Native | Logo animations, decorative shapes | Inline SVG with CSS animations, not SMIL (better mobile performance) |

**Rationale:** Video must be heavily optimized (720p, <10MB, muted, loop, playsinline attributes). Lottie's WASM decoder impacts LCP, so use only for below-fold decorative elements. SVG with CSS animations performs better on mobile than SMIL.

## Visual Effects & Styling

### Recommended Techniques

| Effect | Implementation | Performance Impact |
|--------|---------------|-------------------|
| **Glassmorphism** | `backdrop-blur-md` + `bg-opacity-*` | Low (hardware accelerated) |
| **Mesh gradients** | CSS `conic-gradient()` + `radial-gradient()` | Zero JS, pure CSS |
| **Aurora/glow effects** | Animated CSS gradients with `background-clip: text` | Low (GPU-accelerated) |
| **Parallax scrolling** | CSS `animation-timeline: scroll(root)` or Intersection Observer + transform | Low (compositor thread) |
| **Cursor effects** | CSS `:hover` with `transform` + `opacity` | Low (avoid `box-shadow` animation) |
| **Scroll reveals** | CSS scroll-driven animations or Intersection Observer | Low (batch calculations) |

### CSS Variable Strategy

Extend existing `globals.css` with animation-specific variables:

```css
:root {
  --animation-duration-fast: 200ms;
  --animation-duration-normal: 400ms;
  --animation-duration-slow: 600ms;
  --animation-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --animation-easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --blur-sm: 4px;
  --blur-md: 12px;
  --blur-lg: 24px;
}
```

**Rationale:** CSS variables maintain existing theming system, enable dark mode compatibility, and allow dynamic JS manipulation without re-parsing styles.

## What NOT to Add

| Library | Why Avoid |
|---------|-----------|
| **GSAP** | 40-50kb bundle size, overkill for marketing pages, requires `'use client'` everywhere, better suited for complex web apps |
| **React Spring** | Experimental SSR support, App Router compatibility unclear, Framer Motion is better supported |
| **Anime.js** | Redundant with Framer Motion, not React-optimized |
| **lottie-web** | 82kb + JSON files (1.3MB+), use @dotlottie/react-player with .lottie format instead |
| **Three.js** | 3D overkill for SaaS landing, massive bundle impact, not aligned with geometric brand |
| **next-view-transitions** | Experimental Next.js API (v15.2+), use native CSS View Transitions instead |

**Rationale:** Each avoided library saves 40-80kb bundle size. Landing pages must prioritize First Contentful Paint (FCP) and Largest Contentful Paint (LCP) over feature richness.

## Installation

### Recommended Additions

```bash
# Extended animation utilities (lightweight)
npm install @midudev/tailwind-animations
```

### Optional (only if hero section requires complex interactions)

```bash
# Framer Motion (use sparingly)
npm install framer-motion@^12.27.0

# Lottie (only for below-fold decorative elements)
npm install @dotlottie/react-player@^0.3.0
```

### Tailwind Config Extension

Add to `tailwind.config.ts`:

```typescript
import tailwindAnimations from '@midudev/tailwind-animations';

export default {
  // ...existing config
  plugins: [
    tailwindcssAnimate,
    tailwindAnimations, // Add this
  ],
} satisfies Config;
```

## Integration with Existing Stack

### Next.js App Router Considerations

**Server Components (default):**
- Use CSS animations exclusively
- Inline SVG with CSS keyframes
- No animation library imports

**Client Components ('use client'):**
- Limit to interactive sections (hero CTA, contact forms)
- Framer Motion for complex interactions only
- Intersection Observer for scroll triggers

**Performance Budget:**
- First Contentful Paint (FCP): <1.8s
- Largest Contentful Paint (LCP): <2.5s
- Total Blocking Time (TBT): <200ms
- Animation library budget: <15kb (prefer CSS)

### Dark Mode Integration

All animations must respect existing dark mode system:

```typescript
// Use CSS variables from globals.css
<div className="bg-card/80 backdrop-blur-md border-border">
  {/* Animation respects theme automatically */}
</div>
```

**Rationale:** Existing CSS variable system in `globals.css` already handles light/dark themes. New animations must use `bg-card`, `text-foreground`, `border-border` tokens, not hardcoded colors.

### React 19 Compatibility

**Verified compatible:**
- Framer Motion 12.27.0+ (official React 19 support)
- Native browser APIs (Intersection Observer, View Transitions, Scroll-driven animations)
- All Tailwind plugins (CSS-only)

**Requires testing:**
- @dotlottie/react-player (verify with React 19, may need peer dependency override)

## Performance Optimization Patterns

### 1. Lazy-Load Animations

```typescript
// Good: Lazy load heavy animation library
const AnimatedHero = lazy(() => import('./animated-hero'));

// Better: Use CSS scroll-driven animations (zero JS)
<div className="animate-fade-in animation-timeline-scroll">
```

### 2. Video Optimization

```html
<!-- Required attributes for performance -->
<video
  autoplay
  muted
  loop
  playsinline
  preload="auto"
  poster="/hero-poster.jpg"
  src="/hero-720p.mp4"
>
```

**Specs:**
- Resolution: 720p max (4K kills mobile)
- Duration: <10 seconds (loop seamlessly)
- Size: <10MB (gzip/brotli compression)
- Format: MP4 with H.264 (universal support)
- Poster: Optimized WebP/AVIF for LCP

### 3. Intersection Observer Pattern

```typescript
// Minimal, reusable hook
const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Cleanup after animation
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};
```

**Rationale:** Unobserve after animation prevents memory leaks. Keep callbacks lean (no DOM manipulation in loop).

### 4. Respect Motion Preferences

Existing `globals.css` already includes `prefers-reduced-motion` handling. New animations must respect this:

```typescript
// Framer Motion respects reduced motion automatically
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
```

CSS animations already respect via `globals.css` media query.

## Core Web Vitals Impact Analysis

| Approach | FCP Impact | LCP Impact | CLS Impact | TBT Impact |
|----------|------------|------------|------------|------------|
| **CSS-only animations** | +0ms | +0ms | None (if GPU-accelerated) | +0ms |
| **Framer Motion (hero only)** | +150-200ms | +100ms | None | +50ms |
| **Video hero (optimized)** | +200-300ms | +400-600ms | None (with poster) | +0ms |
| **Lottie (below-fold, lazy)** | +0ms | +0ms | None | +100ms (WASM) |
| **GSAP (NOT RECOMMENDED)** | +300-400ms | +200ms | Varies | +150ms |

**Performance target:** Keep animation additions under 200ms FCP impact, 100ms LCP impact.

## Tailwind Animation Utilities Reference

### Already Available (tailwindcss-animate)

```typescript
animate-in          // Fade in
animate-out         // Fade out
fade-in-0 to fade-in-100
zoom-in-0 to zoom-in-100
slide-in-from-top-0 to slide-in-from-top-100
duration-0 to duration-1000
```

### Adding @midudev/tailwind-animations

```typescript
animate-fade-in
animate-fade-out
animate-fade-in-down
animate-fade-in-up
animate-fade-in-left
animate-fade-in-right
animate-slide-in-down
animate-slide-in-up
animate-zoom-in
animate-zoom-out
animate-rotate
animate-flip-up
animate-flip-down
animate-bounce
animate-shake
animate-pulse
```

All include `motion-safe:` variants and responsive variants (`md:animate-fade-in`).

## Browser Support Matrix

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| CSS Scroll-driven Animations | 115+ ✅ | 26+ ✅ | Via polyfill | 115+ ✅ |
| View Transitions API | 111+ ✅ | 26 beta ✅ | In development | 111+ ✅ |
| Framer Motion 12 | ✅ | ✅ | ✅ | ✅ |
| Intersection Observer | ✅ | ✅ | ✅ | ✅ |
| backdrop-filter | ✅ | ✅ | ✅ | ✅ |

**Polyfill strategy:** Use `@supports` for CSS scroll-driven animations, fall back to Intersection Observer:

```css
@supports (animation-timeline: scroll()) {
  .scroll-animate {
    animation-timeline: scroll(root);
  }
}
```

## Final Recommendations

### Phase 1: Foundation (Zero additional dependencies)

1. Extend Tailwind config with animation utilities from @midudev/tailwind-animations
2. Add CSS scroll-driven animations for scroll reveals
3. Use existing tailwindcss-animate for transitions
4. Add CSS variables for animation timing/easing
5. Implement glassmorphism with backdrop-blur

**Bundle impact:** +2kb (Tailwind plugin is JIT, only includes used classes)

### Phase 2: Hero Section (Selective JavaScript)

1. Add Framer Motion ONLY if hero requires complex orchestration
2. Use HTML5 video for hero background (optimized 720p <10MB)
3. Implement cursor effects with CSS :hover + transform
4. Add Intersection Observer for above-fold scroll triggers

**Bundle impact:** +82kb if Framer Motion added (use conditionally)

### Phase 3: Polish (Below-fold only)

1. Add @dotlottie/react-player for icon animations (lazy-loaded)
2. Implement parallax with CSS animation-timeline or Intersection Observer
3. Add SVG animations with CSS keyframes for decorative elements

**Bundle impact:** +15-20kb (lazy-loaded, doesn't impact FCP/LCP)

### Total Bundle Impact Estimate

- **Minimal path** (CSS-only): +2kb
- **Recommended path** (CSS + selective JS): +15-25kb
- **Maximum path** (includes Framer Motion): +100kb

**Target:** Stay under 25kb for animation additions to maintain FCP <1.8s.

## Sources

### Animation Libraries
- [Framer Motion React 19 Compatibility](https://github.com/motiondivision/motion/issues/2668) - Verified v12.27.0 support
- [Motion Changelog](https://motion.dev/changelog) - Latest React 19 fixes
- [GSAP Next.js Best Practices](https://gsap.com/community/forums/topic/43831-what-are-the-best-practices-for-using-gsap-with-next-15-clientserver-components/)
- [Tailwind Animations Plugin](https://github.com/midudev/tailwind-animations)
- [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)

### Browser APIs
- [CSS Scroll-driven Animations - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [WebKit Scroll-driven Animations Guide](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/)
- [Intersection Observer API 2026 Guide](https://future.forem.com/sherry_walker_bba406fb339/mastering-the-intersection-observer-api-2026-a-complete-guide-561k)
- [View Transitions API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Next.js View Transitions Config](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition)

### Performance
- [Lottie Performance Issues in Next.js](https://forum.lottiefiles.com/t/lottiefile-in-next-js-webcore-vitals-performance-issue/1747)
- [DotLottie React Performance](https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-react/)
- [Video Hero Performance Best Practices](https://www.thegeckoagency.com/best-practices-for-filming-choosing-and-placing-a-hero-video-on-your-website/)
- [Performant Parallaxing - Chrome Developers](https://developer.chrome.com/blog/performant-parallaxing)
- [Best Parallax Scrolling 2026](https://www.builder.io/blog/parallax-scrolling-effect)

### Visual Effects
- [Tailwind Glassmorphism Generator](https://gradienty.codes/tailwind-glassmorphism-generator)
- [CSS Hover Effects Performance](https://prismic.io/blog/css-hover-effects)
- [SVG Animation Methods Compared](https://xyris.app/blog/svg-animation-methods-compared-css-smil-and-javascript/)

### Next.js Integration
- [Next.js Performance Optimization 2026](https://medium.com/@shirkeharshal210/next-js-performance-optimization-app-router-a-practical-guide-a24d6b3f5db2)
- [Framer Motion with Server Components](https://www.hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components)
- [Next.js SEO: Core Web Vitals](https://nextjs.org/learn/seo/web-performance)
