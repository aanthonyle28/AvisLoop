# Phase 31: Landing Page V2 Rewrite - Research

**Researched:** 2026-02-06
**Domain:** SaaS Landing Page Copywriting, Home Services Marketing, Reputation Management
**Confidence:** HIGH

## Summary

AvisLoop V2 requires a complete landing page copy rewrite to shift from V1's "send review requests" messaging to V2's "automation-first, jobs-based workflow" philosophy. Current copy emphasizes manual actions ("Add Contact", "Write Message", "Send") when V2's core value is automation: complete a job in ~10 seconds, system handles everything else forever.

Research reveals successful patterns from automation SaaS, home services marketing, and reputation management competitors. Key findings:

1. **Automation SaaS messaging** emphasizes "ease of use + problem-solving benefits" over "set and forget" language
2. **Home service businesses** value time-saving automation, trust signals, and immediate ROI metrics (5-star reviews, more leads)
3. **Competitors** (Birdeye, Podium, NiceJob) position as comprehensive platforms but still use manual-trigger language
4. **Review funnel pre-qualification** is a proven SaaS best practice for protecting reputation
5. **Specific conversion tactics** include first-person CTAs (+90% CTR), action-oriented language (+121% conversion), and video testimonials (+34% conversion)

**Primary recommendation:** Use Problem-Agitate-Solution (PAS) framework with jobs-first workflow emphasis. Lead with "Complete a job. Get reviews automatically." not "Send review requests faster."

---

## Standard Stack

### Copywriting Frameworks for Automation SaaS

| Framework | Application | When to Use | Source |
|-----------|-------------|-------------|--------|
| **Problem-Agitate-Solution (PAS)** | Problem: forgotten follow-ups → Agitate: lost review opportunities → Solution: automated multi-touch | Pain-aware audiences (home service owners) | [PAS Copywriting Framework](https://www.jessewisnewski.co/article/pas-copywriting) |
| **Before-After-Bridge** | Before: manually asking for reviews → After: reviews happen automatically → Bridge: complete jobs, AvisLoop handles rest | Feature-benefit translation | Standard copywriting |
| **Jobs-to-be-Done (JTBD)** | Customer "hires" product to automate review collection, not to "send messages" | Product positioning, feature prioritization | [JTBD Framework](https://medium.com/@marishaaparikh/jobs-to-be-done-framework-practical-implementation-2fe715f513e2) |

### Landing Page Components (from UX Audit)

**Current V2 Component Files:**
- `hero-v2.tsx` - Hero section
- `social-proof-strip.tsx` - Industries served
- `problem-solution.tsx` - Pain points (needs V2 alignment)
- `how-it-works.tsx` - 3-step process (currently V1: Add Contact, Write, Send)
- `outcome-cards.tsx` - Benefits
- `animated-stats.tsx` - Social proof numbers
- `testimonials.tsx` - Customer quotes
- `faq-section.tsx` - Q&A (currently V1 focused)
- `cta-section.tsx` - Final CTA

### Competitor Analysis

| Competitor | Positioning | Hero Message Pattern | Key Differentiator |
|------------|-------------|----------------------|-------------------|
| **Birdeye** | "AI-driven platform for multi-location businesses" | Enterprise scale, 200,000+ businesses | AI agents, 3,000+ integrations |
| **Podium** | "AI that responds to leads in under 1 minute" | Speed + SMS-first | Text-to-pay, webchat-to-text |
| **NiceJob** | "Automatically send SMS/email review requests post-service" | Visual content ("Stories" from reviews) | Automated social media posts |

**AvisLoop Differentiation Opportunity:**
- **Birdeye/Podium**: Still positioned around "sending" (manual trigger thinking)
- **NiceJob**: Post-service automation but contact-centric, not job-centric
- **AvisLoop V2**: **Jobs-first workflow** - customers don't exist until jobs completed, automation is default, not add-on

---

## Architecture Patterns

### Landing Page Information Architecture

**Recommended Section Order (Conversion-Optimized):**
```
1. Hero (with sticky nav CTA)
   - Headline: Value proposition (outcome + time saving)
   - Subheadline: How it works (automation + minimal effort)
   - Trust badge: Social proof number
   - CTAs: Primary (Start Free Trial) + Secondary (See Pricing)

2. Social Proof Strip
   - Industries served (HVAC, Plumbing, Electrical, etc.)
   - Trust logos or specific business names

3. Problem Section (PAS Framework - Problem + Agitate)
   - Pain point 1: Forgetting to ask for reviews
   - Pain point 2: Too busy for follow-ups
   - Pain point 3: Complex automation tools require setup

4. Solution Bridge
   - Transition statement: "AvisLoop fixes all three"

5. How It Works (V2 ALIGNED)
   - Step 1: Complete a Job (~10 seconds)
   - Step 2: System Auto-Enrolls (immediate)
   - Step 3: Multi-Touch Automation (24-72 hours)

6. Outcome Cards / Benefits
   - 3x more reviews
   - Never forget follow-ups
   - Protects reputation (review funnel)

7. Demo Video or Animated Demo
   - Show job completion → campaign enrollment

8. Social Proof / Stats
   - Reviews collected
   - Average rating improvement
   - Time saved per week

9. Testimonials (with photos)
   - Home service business owners
   - Real names, businesses, photos

10. FAQ
    - V2-aligned questions about automation

11. Final CTA
    - Reinforce value, repeat primary CTA
```

**Source:** Based on [SaaS Landing Page Best Practices](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/) and [SaaS UX Design Guide](https://www.door3.com/blog/saas-ux-design-guide-with-best-practices-and-examples)

### Messaging Hierarchy (V2 Philosophy)

**Primary Message (H1):**
- Focus: **Outcome + Minimal Effort**
- Pattern: `[Desired Outcome] in [Minimal Time]`
- Examples:
  - "3x More Reviews in 10 Seconds a Day"
  - "Automate Your Review Requests. 10 Seconds Per Job."
  - "Turn Completed Jobs Into Google Reviews Automatically"

**Secondary Message (Subheadline):**
- Focus: **How + Automation**
- Pattern: `[Action User Takes]. [What System Does]. [End Result].`
- Examples:
  - "Complete jobs. System follows up. Reviews happen automatically."
  - "Tap 'job complete' and AvisLoop handles the rest. Multi-touch follow-ups, review funnels, Google reviews—all automatic."

**NOT V2-Aligned (Current V1 Copy):**
- "Send review requests instantly" ← Manual action emphasis
- "No complex campaigns" ← Contradicts V2 (campaigns ARE the product)
- "Add your first customer" ← Customer-first, not job-first

### Home Services Pain Points (PAS Framework)

**Source:** [HVAC Marketing Pain Points 2026](https://www.servicetitan.com/blog/hvac-marketing) and [Home Services Marketing 2026](https://www.audiencescience.com/home-services-marketing/)

**Pain Point 1: Time Scarcity**
- Problem: HVAC/plumbing owners work 50-70 hour weeks on jobs, no time for marketing
- Agitation: "You finish a great service, customer leaves happy, and then... nothing. You meant to follow up but got busy. Another review lost."
- Solution: "Complete the job in 10 seconds. AvisLoop handles follow-ups automatically—multi-touch sequences, timing optimization, review funnels."

**Pain Point 2: Forgotten Follow-Ups**
- Problem: Owners know they should ask for reviews but forget consistently
- Agitation: "Your competition has 100+ Google reviews. You have 12. Not because you're worse—because you forget to ask."
- Solution: "Never forget again. Complete a job, system enrolls customer in campaign automatically. 3-touch sequence runs for 5-7 days until they leave a review."

**Pain Point 3: Bad Review Fear**
- Problem: Asking for reviews risks public negative feedback
- Agitation: "What if they leave 1 star? One bad review can cost you thousands in lost leads."
- Solution: "Review funnel protects you. 1-3 stars → private feedback form (you fix the issue). 4-5 stars → Google review. Only happy customers go public."

**Pain Point 4: Awkward In-Person Asks**
- Problem: Asking for reviews face-to-face feels pushy
- Agitation: "You don't want to pressure customers, so you say nothing and hope they remember on their own. They never do."
- Solution: "Professional automated emails. Customer gets personalized message 24 hours after service—perfect timing, zero awkwardness."

**Pain Point 5: Inconsistent Timing**
- Problem: No system means some customers contacted too early, others too late
- Agitation: "You asked for a review while customer's AC was still broken. Or waited 3 weeks and they forgot you existed."
- Solution: "Service-specific timing. HVAC reviews sent 24 hours post-service. Roofing waits 72 hours. System knows best timing per job type."

---

## Don't Hand-Roll

### Problems That Look Simple But Aren't

| Problem | Don't Build | Use Instead | Why It's Complex |
|---------|-------------|-------------|------------------|
| Copy variations for different industries | 8 separate landing pages | Dynamic copy variables in single page | SEO duplication issues, maintenance nightmare |
| Animated demo from scratch | Custom React animations | Existing `animated-demo.tsx` + tweaks | Frame-by-frame animation requires design + dev time |
| Review funnel pre-qualification | Custom survey logic | Existing review funnel (Phase 26) | TCPA compliance, stop-condition tracking, database triggers |
| Multi-touch campaign visualization | Custom timeline component | Leverage existing campaign UI from dashboard | Already built, tested, aligned with backend |
| Testimonial video hosting | Self-hosted video files | YouTube embed or Cloudinary | CDN, adaptive bitrate, player controls |

**Key Insight:** Landing pages look "just copy changes" but require:
- A/B testing infrastructure (future)
- Performance optimization (image lazy-loading, font preloading)
- Mobile responsiveness testing
- Accessibility compliance (WCAG AA)
- Analytics event tracking (conversion funnels)

**Recommendation:** Focus on **copy quality** first (this phase), infrastructure later (separate phase).

---

## Common Pitfalls

### Pitfall 1: "Set It and Forget It" Language

**What goes wrong:** Marketing uses "set it and forget it" but that's a warning flag in SaaS, not a feature. It implies no ongoing engagement, which reduces retention.

**Why it happens:** Automation products want to emphasize ease but accidentally signal "you'll never need to check this"

**How to avoid:**
- Use "runs automatically" not "set and forget"
- Emphasize "check dashboard weekly for insights" not "never log in again"
- Frame as "system works while you work" not "replaces your involvement"

**Warning signs:** Copy that says "never think about reviews again" - this reduces perceived product value

**Source:** [SaaS Landing Page Best Practices](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/) warns against this exact phrasing

---

### Pitfall 2: Vague Social Proof

**What goes wrong:** "Trusted by 500+ businesses" is meaningless without specificity. Users assume it's fabricated.

**Why it happens:** Real metrics aren't impressive yet (early stage) so marketing uses generic numbers

**How to avoid:**
- Use specific industry examples: "127 HVAC companies, 83 plumbers, 64 electricians"
- Show named businesses: "Comfort Air HVAC (Dallas, TX)" with logo
- Use real testimonials with full names, photos, businesses
- If numbers are small, use growth rate: "3x month-over-month growth"

**Warning signs:**
- "500+ businesses" with no proof
- Testimonials with first names only ("Mike from Texas")
- Generic review quotes that could apply to any product

**Source:** [Social Proof Statistics 2026](https://wisernotify.com/blog/social-proof-statistics/) - Generic social proof can reduce conversions if perceived as fake

---

### Pitfall 3: V1 Language in V2 Product

**What goes wrong:** Copy says "send review requests" when product does automated campaigns. Users expect manual-send tool, get confused by campaign UI.

**Why it happens:** Landing page written before product pivoted to V2 philosophy (AvisLoop's current state)

**How to avoid:**
- Audit all copy for V1 verbs: "send", "add contact", "write message", "click send"
- Replace with V2 verbs: "complete job", "auto-enroll", "system follows up", "campaign runs"
- Ensure How It Works section matches actual V2 workflow
- Test copy with V2 philosophy checklist (from `.planning/V1-TO-V2-PHILOSOPHY.md`)

**Warning signs:**
- Hero says "automation" but How It Works shows manual steps
- FAQ answers reference features that don't exist (bulk send, contact lists)
- Testimonials talk about "sending messages" not "completing jobs"

**Current AvisLoop violations:**
- `how-it-works.tsx` line 9: "Add Contact" (V1)
- `how-it-works.tsx` line 16: "Write Message" (V1)
- `how-it-works.tsx` line 22: "Send" (V1)
- `faq-section.tsx` line 11: "manually sending review requests" (V1)
- `hero-v2.tsx` line 38: "Send review requests instantly" (V1)

---

### Pitfall 4: Feature-First Instead of Outcome-First

**What goes wrong:** Landing page lists features (campaigns, templates, analytics) instead of outcomes (more reviews, higher ratings, time saved)

**Why it happens:** Product teams excited about features they built, forget customers care about results

**How to avoid:**
- Lead with outcome: "3x More Reviews" not "Multi-Touch Campaigns"
- Follow with "how": "Multi-touch campaigns automatically follow up 3 times over 5 days until customer responds"
- Use Before/After framing: "Before: 2-3 reviews/month. After: 12-15 reviews/month."
- Every feature needs "so you can [outcome]" attached

**Warning signs:**
- Headline is feature name: "Introducing Multi-Touch Campaigns"
- Benefits section lists capabilities not results
- No numbers, metrics, or measurable outcomes

**Example Fix:**
- Bad: "Multi-Touch Campaigns - Send up to 4 follow-up messages"
- Good: "Never Lose a Review to Forgotten Follow-Ups - 3 automated reminders over 5 days (you just complete the job)"

**Source:** [B2B SaaS Conversion Optimization](https://www.webstacks.com/blog/website-conversions-for-saas-businesses) - Feature lists reduce conversion vs outcome-focused copy

---

### Pitfall 5: FAQ Contradicts Product Reality

**What goes wrong:** FAQ answers reference V1 features (contact import, template customization, manual sends) when V2 de-emphasizes or hides these

**Why it happens:** FAQ written before product roadmap finalized, never updated

**How to avoid:**
- Remove V1-focused questions: "Can I customize the review request email?" (implies manual sends)
- Add V2-focused questions: "What happens after I complete a job?" (automation flow)
- Ensure answers match actual UX: If campaigns are primary, FAQ should explain campaigns
- Cross-reference FAQ with actual feature availability in Phase 30+

**Warning signs:**
- FAQ mentions features not in main navigation
- Answers assume manual workflow when product is automation-first
- No questions about campaigns, job completion, automation timing

**Current AvisLoop `faq-section.tsx` violations:**
- Line 11: "manually sending review requests" - contradicts V2
- Line 19: "customize the email subject, body text" - contact-centric, not job-centric
- Missing: "How does automation work?", "What's a campaign?", "When do messages send?"

---

## Code Examples

### V2-Aligned Hero Copy Pattern

**Current (V1):**
```tsx
<h1>3× More Reviews in 2 Minutes</h1>
<p>Send review requests instantly. No complex campaigns, no forgotten follow-ups.</p>
```

**V2-Aligned:**
```tsx
<h1>3× More Reviews Without Lifting a Finger</h1>
<p>Complete jobs in 10 seconds. AvisLoop handles multi-touch follow-ups, timing, and review funnels automatically.</p>
```

**Source:** Pattern from [Podium's 2026 messaging](https://www.podium.com/) emphasizing automation

---

### V2-Aligned How It Works Section

**Current (V1) - `how-it-works.tsx` lines 6-25:**
```tsx
const steps = [
  {
    number: 1,
    title: 'Add Contact',
    description: 'Import your customer list or add one contact. Takes 10 seconds.',
    color: 'lime' as const,
  },
  {
    number: 2,
    title: 'Write Message',
    description: 'Use our template or write your own. We pre-fill the contact\'s name.',
    color: 'coral' as const,
  },
  {
    number: 3,
    title: 'Send',
    description: 'Click send. That\'s it. We track delivery, opens, and clicks for you.',
    color: 'lime' as const,
  },
];
```

**V2-Aligned:**
```tsx
const steps = [
  {
    number: 1,
    title: 'Complete a Job',
    description: 'Tap "job complete" with customer name, phone, and service type. Takes 10 seconds.',
    color: 'lime' as const,
  },
  {
    number: 2,
    title: 'System Auto-Enrolls',
    description: 'AvisLoop creates customer record, finds matching campaign, schedules 3 touches based on service type.',
    color: 'coral' as const,
  },
  {
    number: 3,
    title: 'Automation Runs',
    description: 'Multi-touch sequence sends over 3-5 days. Customer rates experience. High ratings → Google. Low ratings → private feedback. Campaign stops automatically.',
    color: 'lime' as const,
  },
];
```

**Key Changes:**
1. "Add Contact" → "Complete a Job" (jobs-first)
2. "Write Message" → "System Auto-Enrolls" (automation, not manual)
3. "Send" → "Automation Runs" (ongoing process, not one-time action)
4. Descriptions explain V2 workflow accurately

---

### V2-Aligned Problem Copy Pattern

**Current (V1) - `problem-solution.tsx` line 22:**
```tsx
{
  icon: Wrench,
  problem: 'Complex Tools',
  agitation: 'Marketing platforms promise automation but require campaigns, workflows, and hours of setup. You just want to send one message.',
  color: 'lime' as const,
}
```

**Problem:** This agitation contradicts V2—campaigns ARE the product, not a complexity to avoid.

**V2-Aligned:**
```tsx
{
  icon: Wrench,
  problem: 'No Follow-Up System',
  agitation: 'You ask for reviews once, then move on to the next job. No reminders, no second chances. Most customers forget or ignore the first request.',
  color: 'lime' as const,
}
```

**Key Change:** Pain point is now "lack of automation" not "automation complexity"

---

### V2-Aligned FAQ Questions

**Current (V1) - `faq-section.tsx` lines 8-37:**
```tsx
{
  question: "How is AvisLoop different from other review platforms?",
  answer: "Most review platforms are built for marketing teams with time to spare. AvisLoop is built for busy business owners who need to request reviews quickly and move on. One contact, one click, done.",
}
```

**V2-Aligned:**
```tsx
{
  question: "How is AvisLoop different from other review platforms?",
  answer: "Other platforms require you to manually send each review request. AvisLoop is automation-first: complete a job, and the system handles everything—multi-touch follow-ups, timing optimization, review funnels. You spend 10 seconds per job, not 10 minutes per customer.",
}
```

**New V2 FAQ Questions to Add:**

```tsx
{
  question: "What happens after I complete a job?",
  answer: "AvisLoop automatically creates a customer record (if new) or links to existing customer, finds the campaign matching your service type (HVAC, plumbing, etc.), and schedules 3 touches over 3-5 days. The first message sends 24-72 hours after job completion (varies by service). You don't do anything else—the system runs until the customer takes action or all touches complete.",
},
{
  question: "What's a campaign and do I need to set one up?",
  answer: "Campaigns are pre-built multi-touch sequences (3 messages over 3-5 days). During onboarding, you choose a preset (Fast, Standard, or Slow) and AvisLoop creates campaigns for each service type you offer. These run automatically—you never manually trigger a campaign. Just complete jobs, campaigns handle the rest.",
},
{
  question: "What's the review funnel and why does it matter?",
  answer: "The review funnel protects your Google rating. When a customer clicks your review link, they rate their experience 1-5 stars privately first. 4-5 stars → redirect to Google to leave public review. 1-3 stars → private feedback form so you can fix the issue before it goes public. This prevents bad reviews from hurting your business while still collecting all feedback.",
},
{
  question: "Do I need to import my customer list?",
  answer: "No. AvisLoop creates customers automatically when you complete jobs. Most businesses start with zero customers and build their list organically. If you want to import past customers to re-engage them, you can, but it's optional—not the primary workflow.",
},
```

---

## State of the Art

### Landing Page Conversion Tactics (2025-2026)

| Tactic | Old Approach | Current Best Practice | Impact | Source |
|--------|--------------|----------------------|--------|--------|
| **CTA Button Text** | "Submit", "Get Started" | First-person: "Start My Free Trial" | +90% CTR | [CTA Button Best Practices](https://www.bestversionmedia.com/button-text-that-gets-clicks-the-secrets-to-high-converting-ctas/) |
| **Social Proof Placement** | Footer only | Hero section + near CTAs | +34% conversion | [Social Proof Examples](https://wisernotify.com/blog/social-proof-statistics/) |
| **Video Testimonials** | Studio-quality productions | Raw phone videos (authentic) | Higher trust, lower production cost | [SaaS Social Proof 2026](https://senja.io/testimonial-examples/saas-testimonial-examples) |
| **Demo Format** | Static screenshots | Animated product demo or screen recording | +98% conversion lift | [Social Proof Examples](https://shapo.io/blog/social-proof-examples/) |
| **Trust Signals** | Generic "trusted by businesses" | Specific: "127 HVAC companies" | Higher credibility | [Social Proof Statistics](https://wisernotify.com/blog/social-proof-statistics/) |
| **FAQ Placement** | Bottom of page only | Near pricing + bottom | Reduces friction earlier | Standard UX |
| **Headline Length** | Long feature descriptions | Under 70 characters, outcome-focused | Better mobile readability | [SaaS Landing Pages](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/) |

### Automation SaaS Messaging Trends (2026)

**Key Shift:** From "set it and forget it" to "works while you work"

**Reasoning:** "Set and forget" implies no ongoing value, reduces retention. "Works while you work" implies parallel productivity, ongoing benefit.

**Source:** [SaaS Landing Page Guide](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/) warns explicitly against "set and forget" mentality

**Better Phrases:**
- "Runs automatically in the background"
- "Handles follow-ups while you focus on jobs"
- "Works 24/7 so you don't have to"
- "System never forgets, so you can"

### Home Services Marketing Priorities (2026)

**Top 3 Value Propositions:**

1. **Time Savings** - Owners work 50-70 hour weeks, no time for marketing. Emphasize "10 seconds" not "2 minutes."

2. **Reputation Protection** - One bad review costs thousands in lost leads. Review funnel pre-qualification is major differentiator.

3. **Immediate ROI** - "3x more reviews in first month" beats "improve your marketing" (vague).

**Source:** [Home Services Marketing 2026](https://www.audiencescience.com/home-services-marketing/) - "Reputation is still your strongest marketing asset"

**Trust Signals That Matter:**
- Google reviews (most important)
- Response time to inquiries (24 hours or less)
- Before/after photos (visual proof)
- Specific business names + locations (not generic testimonials)

---

## Open Questions

### 1. Testimonial Availability

**What we know:** Current `testimonials.tsx` uses placeholder testimonials. Real home service business testimonials needed.

**What's unclear:**
- Does AvisLoop have real customers willing to provide testimonials?
- Can we get photos, business names, locations for credibility?
- Do we have video testimonial budget/capability?

**Recommendation:**
- Phase 31 copy can include placeholder testimonial structure
- Separate task to collect real testimonials from beta users
- If no real testimonials yet, use "Early Access" framing: "Join 50+ businesses in beta"

---

### 2. Social Proof Numbers

**What we know:** Hero currently says "Trusted by 500+ local businesses"

**What's unclear:**
- What's the actual number of active AvisLoop users?
- Is 500+ accurate or aspirational?
- If number is smaller, should we use growth rate instead? ("Growing 3x month-over-month")

**Recommendation:**
- Use real number if impressive (100+)
- If <100, use industry-specific breakdown: "47 HVAC contractors, 23 plumbers, 18 electricians"
- If <20, use early access framing: "Invite-only beta" or remove number entirely

---

### 3. Demo Video Production

**What we know:** Landing page should include demo video showing job completion → campaign enrollment

**What's unclear:**
- Is screen recording sufficient or do we need professional production?
- Should demo show mobile (where job completion likely happens) or desktop dashboard?
- Who creates this—internal or contractor?

**Recommendation:**
- Phase 31 (copy rewrite) can include placeholder for video
- Separate task/phase for video production
- Start with Loom screen recording (fast, cheap), upgrade to professional later if needed

**Current State:** `animated-demo.tsx` exists but is placeholder animation. May need replacement with real product demo.

---

### 4. A/B Testing Infrastructure

**What we know:** Landing page copy should be A/B tested for conversion optimization

**What's unclear:**
- Does Vercel/Next.js setup support A/B testing?
- What metrics are tracked (signup conversions, pricing page visits)?
- Is this in scope for Phase 31 or future phase?

**Recommendation:**
- Phase 31 focuses on **single best copy** based on research
- Document A/B test candidates for future: headline variations, CTA button text, testimonial placement
- Future phase can add A/B testing infrastructure (Vercel Edge Config, Statsig, or custom)

---

## Sources

### Primary (HIGH confidence)

**SaaS Landing Page Best Practices:**
- [SaaS Landing Page Examples & Best Practices](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/)
- [SaaS Landing Page Guide](https://www.glorywebs.com/blog/saas-landing-page-best-practices)
- [SaaS Website Conversions 2026](https://www.webstacks.com/blog/website-conversions-for-saas-businesses)

**Copywriting Frameworks:**
- [PAS Copywriting Framework](https://www.jessewisnewski.co/article/pas-copywriting)
- [PAS Framework Structure](https://www.saasfunnellab.com/essay/pas-copywriting-framework/)
- [Jobs-to-be-Done Framework](https://medium.com/@marishaaparikh/jobs-to-be-done-framework-practical-implementation-2fe715f513e2)

**Home Services Marketing:**
- [Home Services Marketing 2026](https://www.audiencescience.com/home-services-marketing/)
- [HVAC Marketing Strategies 2026](https://www.servicetitan.com/blog/hvac-marketing)
- [Home Service Industry Trends 2026](https://www.bdrco.com/blog/home-service-industry-trends/)

**Reputation Management Competitors:**
- [Birdeye Alternatives 2026](https://salescaptain.com/article/top-5-birdeye-alternatives-to-boost-your-reputation-and-sales-in-2026)
- [Online Reputation Management Software 2026](https://wiserreview.com/blog/online-reputation-management-software/)
- [Podium Review Features](https://www.podium.com/product/reviews/home_services)
- [NiceJob Review 2026](https://research.com/software/reviews/nicejob)

**Conversion Optimization:**
- [B2B SaaS Conversion Benchmarks 2026](https://www.saashero.net/content/2026-b2b-saas-conversion-benchmarks/)
- [CTA Button Best Practices](https://www.bestversionmedia.com/button-text-that-gets-clicks-the-secrets-to-high-converting-ctas/)
- [Call to Action Statistics 2025](https://www.sender.net/blog/call-to-action-statistics/)

**Social Proof:**
- [Social Proof Statistics 2026](https://wisernotify.com/blog/social-proof-statistics/)
- [SaaS Testimonial Examples](https://senja.io/testimonial-examples/saas-testimonial-examples)
- [Social Proof Examples 2026](https://shapo.io/blog/social-proof-examples/)

**Review Funnel:**
- [Review Funnel Guide for SaaS](https://userpilot.com/blog/review-funnel/)

### Secondary (MEDIUM confidence)

**SaaS UX Design Patterns:**
- [SaaS UX Design Guide](https://www.door3.com/blog/saas-ux-design-guide-with-best-practices-and-examples)
- [Workflow Management Software Design](https://www.eleken.co/blog-posts/how-to-design-workflow-management-software-that-helps-streamline-work)

**Reputation Management Software Reviews:**
- [Best Reputation Management Software 2026](https://www.capterra.com/reputation-management-software/)
- [Customer Review Management Software](https://thecxlead.com/tools/best-customer-review-management-software/)

### Tertiary (LOW confidence)

None - all findings verified with authoritative sources from 2025-2026

---

## Metadata

**Confidence breakdown:**
- Landing page messaging patterns: HIGH - Multiple authoritative SaaS marketing sources from 2026
- Home services pain points: HIGH - Industry-specific research from ServiceTitan, home services marketing agencies
- Competitor positioning: HIGH - Direct review of competitor websites and third-party software review sites
- Copywriting frameworks: HIGH - Established frameworks (PAS, JTBD) with current applications
- Conversion tactics: HIGH - Recent statistics with percentage lifts from A/B tests
- V2 philosophy application: HIGH - Cross-referenced with `.planning/V1-TO-V2-PHILOSOPHY.md`

**Research date:** 2026-02-06
**Valid until:** 90 days (stable domain—landing page best practices change slowly, but competitor positioning may shift)

**Known gaps:**
- Real AvisLoop customer testimonials (need outreach)
- Actual user count for social proof (need internal data)
- Demo video production plan (need product decision)
- A/B testing infrastructure availability (need engineering review)

**Planner can proceed with:** Copy rewrite tasks for all 9 landing page components based on V2 philosophy and proven conversion patterns.
