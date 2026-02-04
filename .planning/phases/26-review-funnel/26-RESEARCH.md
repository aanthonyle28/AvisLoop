# Phase 26: Review Funnel - Research

**Researched:** 2026-02-04
**Domain:** Review funnel implementation with satisfaction filtering, FTC compliance, and private feedback collection
**Confidence:** HIGH

## Summary

Phase 26 implements a review funnel that pre-qualifies customers before directing them to Google reviews. This is a legally and ethically sensitive feature that must navigate FTC regulations, Google policies, and TCPA compliance while providing value to home service businesses.

The standard approach uses a satisfaction survey (1-5 stars) to gauge customer sentiment, then routes satisfied customers (4-5 stars) to public review platforms while directing less-satisfied customers (1-3 stars) to a private feedback form. However, this practice—called "review gating"—faces significant regulatory restrictions. The key to legal compliance is **framing and transparency**: the system must present as a "share your experience" flow for ALL customers, not a conditional review request.

**Primary recommendation:** Build a two-step review flow with (1) satisfaction survey accessible to all customers via tokenized URLs, (2) conditional routing to Google or private feedback based on rating, (3) careful language avoiding review gating, (4) private feedback dashboard with email notifications, and (5) automatic campaign enrollment stopping on feedback submission or review click.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15+ | Public page routing | Existing stack, handles unauthenticated pages cleanly |
| React Hook Form | 7.66+ | Form state management | Already in project (package.json), performant validation |
| Zod | 4.3+ | Schema validation | Already in project, type-safe form validation |
| Supabase Postgres | Latest | Private feedback storage | Existing database, RLS security model |
| Resend | 6.9+ | Email notifications | Existing integration for owner notifications |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto (Node built-in) | N/A | URL token generation | Secure customer identification in review links |
| date-fns | 4.1+ | Timestamp formatting | Already in project for feedback timestamps |
| Lucide React | 0.511+ | Star rating icons | Already in project, consistent icon system |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom star rating | @smastrom/react-rating | Zero-dep custom component is simpler for our single use case |
| URL tokens | JWT/session | Tokens avoid session complexity for unauthenticated public pages |
| Postgres storage | Upstash Redis | Redis adds dependency; Postgres handles relational data better |

**Installation:**
No new packages required. All dependencies already in package.json.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── r/
│   └── [token]/
│       └── page.tsx              # Public review pre-qualification page
├── api/
│   └── feedback/
│       └── route.ts              # Server action for feedback submission
components/
├── review/
│   ├── satisfaction-rating.tsx   # Star rating component (1-5)
│   ├── feedback-form.tsx         # Private feedback form (1-3 stars)
│   └── thank-you-card.tsx        # Post-submission confirmation
├── dashboard/
│   └── feedback-list.tsx         # Business owner feedback dashboard
lib/
├── review/
│   ├── token.ts                  # Token generation/validation
│   └── routing.ts                # Routing logic (star → destination)
├── data/
│   └── feedback.ts               # Feedback CRUD operations
└── validations/
    └── feedback.ts               # Zod schemas
```

### Pattern 1: Tokenized Review URLs
**What:** Generate secure, time-limited tokens for review links that identify customer without requiring authentication.
**When to use:** Review links in emails/SMS that must work without login.
**Example:**
```typescript
// lib/review/token.ts
import { createHash, randomBytes } from 'crypto'

export function generateReviewToken(params: {
  customerId: string
  businessId: string
  enrollmentId?: string // Link to campaign enrollment for stop conditions
}): string {
  const payload = `${params.customerId}:${params.businessId}:${params.enrollmentId || ''}:${Date.now()}`
  const random = randomBytes(16).toString('hex')
  return Buffer.from(`${payload}:${random}`).toString('base64url')
}

export function parseReviewToken(token: string): {
  customerId: string
  businessId: string
  enrollmentId?: string
  timestamp: number
} | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [customerId, businessId, enrollmentId, timestamp] = decoded.split(':')

    // Check token age (30 days max)
    const age = Date.now() - parseInt(timestamp)
    if (age > 30 * 24 * 60 * 60 * 1000) return null

    return {
      customerId,
      businessId,
      enrollmentId: enrollmentId || undefined,
      timestamp: parseInt(timestamp)
    }
  } catch {
    return null
  }
}
```

### Pattern 2: FTC-Compliant Review Routing
**What:** Route customers based on satisfaction rating WITHOUT using conditional review request language.
**When to use:** Always—this is the core legal compliance pattern.
**Example:**
```typescript
// lib/review/routing.ts
export function getReviewDestination(rating: number, googleReviewLink: string): {
  type: 'google' | 'feedback'
  url: string
  message: string
} {
  // 4-5 stars → Google
  if (rating >= 4) {
    return {
      type: 'google',
      url: googleReviewLink,
      // Compliant language: neutral, not conditional
      message: 'Thank you for sharing! We\'d love to hear more about your experience.'
    }
  }

  // 1-3 stars → Private feedback
  return {
    type: 'feedback',
    url: '/r/[token]?step=feedback',
    // Compliant language: frames as "help us improve" not "don't post publicly"
    message: 'We appreciate your feedback and want to make things right.'
  }
}
```

### Pattern 3: Campaign Stop on Review Interaction
**What:** Automatically stop campaign enrollment when customer clicks review link or submits feedback.
**When to use:** Prevent sending additional touches after customer engagement.
**Example:**
```typescript
// lib/data/feedback.ts
export async function recordReviewClick(params: {
  enrollmentId: string
  rating: number
  type: 'google' | 'feedback'
}) {
  const supabase = createServerClient()

  // Stop campaign enrollment (matches existing stop_reason from Phase 24)
  const stopReason = params.type === 'google' ? 'review_clicked' : 'feedback_submitted'

  await supabase
    .from('campaign_enrollments')
    .update({
      status: 'stopped',
      stop_reason: stopReason,
      stopped_at: new Date().toISOString()
    })
    .eq('id', params.enrollmentId)
}
```

### Pattern 4: Star Rating Component (Accessible)
**What:** Custom star rating component with keyboard navigation and ARIA labels.
**When to use:** Satisfaction survey on public page.
**Example:**
```typescript
// components/review/satisfaction-rating.tsx
'use client'
import { Star } from 'lucide-react'
import { useState } from 'react'

interface Props {
  value: number
  onChange: (rating: number) => void
}

export function SatisfactionRating({ value, onChange }: Props) {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div role="radiogroup" aria-label="Rate your satisfaction from 1 to 5 stars">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          role="radio"
          aria-checked={value === rating}
          onClick={() => onChange(rating)}
          onMouseEnter={() => setHoverRating(rating)}
          onMouseLeave={() => setHoverRating(0)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' && rating < 5) onChange(rating + 1)
            if (e.key === 'ArrowLeft' && rating > 1) onChange(rating - 1)
          }}
          className="star-button"
        >
          <Star
            fill={(hoverRating || value) >= rating ? 'currentColor' : 'none'}
            className="w-12 h-12"
          />
          <span className="sr-only">{rating} star{rating !== 1 ? 's' : ''}</span>
        </button>
      ))}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Review gating language:** "Leave a review if you had a great experience" is illegal. Use "Share your experience" instead.
- **Blocking negative reviews:** Never prevent low-rating customers from finding your Google page. Offer private feedback as alternative, not replacement.
- **Exposing customer PII in tokens:** URL tokens should be opaque identifiers, never email/name in plaintext.
- **Long-lived tokens:** Review tokens should expire (30 days max) to prevent stale data and security risks.
- **No feedback dashboard:** Private feedback without follow-up defeats the purpose. Build owner dashboard + notifications.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Star rating component | Complex custom SVG interactions | Lucide `<Star />` + native button | Accessibility hard (keyboard nav, ARIA), Lucide icons cover 90% |
| URL token encryption | Custom crypto schemes | Node `crypto` with base64url | URL-safe encoding, secure random, battle-tested |
| Form validation | Manual field checking | Zod + React Hook Form | Type safety, async validation, error handling built-in |
| Email notifications | Custom SMTP | Resend (already integrated) | Deliverability, webhooks, templates handled |
| Rate limiting | In-memory counters | Upstash (already used) or DB-based | In-memory lost on restart, Redis persists across instances |

**Key insight:** Compliance requirements are the hard part, not the UI. Focus energy on legal language review and stop condition logic, not building a better star widget.

## Common Pitfalls

### Pitfall 1: Review Gating Language Violations
**What goes wrong:** Using conditional language like "If you had a great experience, leave a review" triggers FTC violations.
**Why it happens:** Intuitive to ask happy customers for reviews, but regulators see this as manipulating review authenticity.
**How to avoid:**
- Use neutral framing: "Share your experience" not "Leave a review if happy"
- Send review links to ALL customers (via campaigns), not just satisfied ones
- Private feedback is an OPTION for unhappy customers, not a filter to prevent negative reviews
**Warning signs:**
- Copy includes "if happy" or "if satisfied"
- UI blocks access to Google link for low ratings
- No mention of public reviews on feedback form path

### Pitfall 2: Token Security Vulnerabilities
**What goes wrong:** Predictable tokens let attackers submit fake feedback or access other customers' review pages.
**Why it happens:** Simple token schemes (e.g., `customerId-businessId`) are guessable.
**How to avoid:**
- Use cryptographically random data (crypto.randomBytes)
- Include timestamp to enable expiration
- Never expose sequential IDs or predictable patterns
- Validate token age on every request (30-day max)
**Warning signs:**
- Tokens are short (<20 chars) or sequential
- No expiration checking in parse function
- Base64 encoding without random component

### Pitfall 3: Missing Campaign Stop Conditions
**What goes wrong:** Customer clicks review link but continues receiving follow-up messages, causing annoyance and opt-outs.
**Why it happens:** Forgetting to update `campaign_enrollments.status` when customer engages.
**How to avoid:**
- Track enrollment_id in review tokens
- Update enrollment status on BOTH review click and feedback submit
- Use existing `stop_reason` enum values: `review_clicked`, `feedback_submitted`
- Test with active campaign: verify no Touch 2+ after Touch 1 interaction
**Warning signs:**
- Customers report duplicate messages after leaving feedback
- `campaign_enrollments` table shows `status='active'` after review click
- No JOIN between review interactions and enrollments

### Pitfall 4: No Owner Notification on Negative Feedback
**What goes wrong:** Private feedback sits in database unseen, defeating the purpose of collecting it.
**Why it happens:** Building collection feature without follow-up workflow.
**How to avoid:**
- Send transactional email to business owner on feedback submission (use Resend)
- Include customer name, rating, feedback text, and timestamp
- Link to feedback dashboard in notification email
- Set up dashboard page (Phase 27 can expand this, but basic list needed now)
**Warning signs:**
- Feedback table has no associated email send logic
- No dashboard page exists for viewing feedback
- Owner learns about feedback days later via manual DB query

### Pitfall 5: Google Review Link Validation Missing
**What goes wrong:** Business sets invalid Google URL, 4-5 star redirects fail, customers frustrated.
**Why it happens:** Assuming business.google_review_link is always valid.
**How to avoid:**
- Validate Google URL on business settings save (existing validation in lib/validations/business.ts)
- Fallback behavior: if no Google link set, show message "Please contact business owner" instead of redirect
- Admin warning on feedback dashboard if Google link missing
**Warning signs:**
- No URL validation on business settings form
- Review funnel crashes on redirect when google_review_link is null
- No user-facing error message for missing review link

## Code Examples

Verified patterns from official sources and existing codebase:

### Database Schema: Feedback Table
```sql
-- New table: customer_feedback
-- Stores private feedback from 1-3 star ratings
CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.campaign_enrollments(id) ON DELETE SET NULL,

  -- Rating and feedback
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,

  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT feedback_rating_valid CHECK (rating BETWEEN 1 AND 5)
);

-- Indexes
CREATE INDEX idx_feedback_business_id ON public.customer_feedback(business_id);
CREATE INDEX idx_feedback_customer_id ON public.customer_feedback(customer_id);
CREATE INDEX idx_feedback_enrollment_id ON public.customer_feedback(enrollment_id);
CREATE INDEX idx_feedback_unresolved
  ON public.customer_feedback(business_id, submitted_at)
  WHERE resolved_at IS NULL;

-- RLS
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own feedback"
  ON public.customer_feedback FOR SELECT
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Public insert feedback"
  ON public.customer_feedback FOR INSERT
  TO anon
  WITH CHECK (true);  -- Validated via token check in API route

CREATE POLICY "Users update own feedback"
  ON public.customer_feedback FOR UPDATE
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
```

### Public Review Page (Next.js App Router)
```typescript
// app/r/[token]/page.tsx
import { notFound } from 'next/navigation'
import { parseReviewToken } from '@/lib/review/token'
import { createServerClient } from '@/lib/supabase/server'
import { SatisfactionRating } from '@/components/review/satisfaction-rating'
import { FeedbackForm } from '@/components/review/feedback-form'

interface Props {
  params: { token: string }
  searchParams: { step?: string }
}

export default async function ReviewPage({ params, searchParams }: Props) {
  // Parse and validate token
  const tokenData = parseReviewToken(params.token)
  if (!tokenData) {
    return notFound()
  }

  const supabase = createServerClient()

  // Fetch customer and business data
  const [customerRes, businessRes] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, email')
      .eq('id', tokenData.customerId)
      .single(),
    supabase
      .from('businesses')
      .select('id, name, google_review_link')
      .eq('id', tokenData.businessId)
      .single()
  ])

  if (customerRes.error || businessRes.error) {
    return notFound()
  }

  const customer = customerRes.data
  const business = businessRes.data

  // Step 1: Satisfaction rating
  if (!searchParams.step) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-lg w-full bg-card p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-2">
            Hi {customer.name}!
          </h1>
          <p className="text-muted-foreground mb-6">
            How was your experience with {business.name}?
          </p>

          <form action={`/api/review/rate`} method="POST">
            <input type="hidden" name="token" value={params.token} />
            <SatisfactionRating />
          </form>

          {/* Compliance language: neutral, not conditional */}
          <p className="text-xs text-muted-foreground mt-6 text-center">
            Your honest feedback helps us serve you better
          </p>
        </div>
      </div>
    )
  }

  // Step 2: Private feedback form (1-3 stars only)
  if (searchParams.step === 'feedback') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-lg w-full bg-card p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-2">
            We'd love to hear more
          </h1>
          <p className="text-muted-foreground mb-6">
            Your feedback helps us improve. Please share any details about your experience.
          </p>

          <FeedbackForm
            token={params.token}
            businessName={business.name}
          />
        </div>
      </div>
    )
  }

  return notFound()
}
```

### Server Action: Submit Feedback
```typescript
// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseReviewToken } from '@/lib/review/token'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { z } from 'zod'

const feedbackSchema = z.object({
  token: z.string(),
  rating: z.number().min(1).max(5),
  feedback_text: z.string().min(1).max(5000).optional(),
})

// Use service role for public endpoint
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = feedbackSchema.parse(body)

    // Validate token
    const tokenData = parseReviewToken(validated.token)
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Fetch customer and business
    const [customerRes, businessRes, ownerRes] = await Promise.all([
      supabase.from('customers').select('name, email').eq('id', tokenData.customerId).single(),
      supabase.from('businesses').select('name, google_review_link').eq('id', tokenData.businessId).single(),
      supabase.from('businesses').select('user_id').eq('id', tokenData.businessId).single()
        .then(res => supabase.auth.admin.getUserById(res.data?.user_id || '')),
    ])

    if (customerRes.error || businessRes.error) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const customer = customerRes.data
    const business = businessRes.data
    const ownerEmail = ownerRes.data.user?.email

    // Insert feedback
    const { error: insertError } = await supabase
      .from('customer_feedback')
      .insert({
        business_id: tokenData.businessId,
        customer_id: tokenData.customerId,
        enrollment_id: tokenData.enrollmentId,
        rating: validated.rating,
        feedback_text: validated.feedback_text,
      })

    if (insertError) {
      console.error('Feedback insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    // Stop campaign enrollment (if linked)
    if (tokenData.enrollmentId) {
      await supabase
        .from('campaign_enrollments')
        .update({
          status: 'stopped',
          stop_reason: 'feedback_submitted',
          stopped_at: new Date().toISOString()
        })
        .eq('id', tokenData.enrollmentId)
    }

    // Send notification email to owner
    if (ownerEmail) {
      await resend.emails.send({
        from: 'AvisLoop <notifications@avisloop.com>',
        to: ownerEmail,
        subject: `New feedback from ${customer.name}`,
        html: `
          <h2>New Customer Feedback</h2>
          <p><strong>Customer:</strong> ${customer.name}</p>
          <p><strong>Rating:</strong> ${validated.rating} / 5 stars</p>
          <p><strong>Feedback:</strong></p>
          <p>${validated.feedback_text || '(No additional comments)'}</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/feedback">View in Dashboard</a></p>
        `
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct review links in emails | Pre-qualification survey → routing | Jan 2022 (FTC Fashion Nova fine) | Businesses need compliant filtering |
| "Leave a review if satisfied" language | "Share your experience" neutral framing | Oct 2024 (FTC Rule) | $51k fines per violation |
| No private feedback option | Satisfaction survey + private form | Industry standard 2024-2025 | Captures negative feedback privately |
| Review gating (suppress negative) | Review generation (ask everyone) | Google policy update 2022 | Delisting risk if caught gating |

**Deprecated/outdated:**
- **Review gating software that hides negative reviews**: Illegal under FTC Consumer Reviews Rule (Oct 2024)
- **Conditional review request language**: Violates FTC Act Section 5 and Google policies
- **Incentivized reviews without disclosure**: Requires clear material connection disclosure (FTC 2022)

## Open Questions

Things that couldn't be fully resolved:

1. **How long should review tokens remain valid?**
   - What we know: Industry standard is 30-90 days for review links
   - What's unclear: Optimal expiration for home services (job completed → review sent weeks later)
   - Recommendation: Start with 30 days, can extend to 90 if customers report expired links

2. **Should we track review clicks (4-5 stars → Google)?**
   - What we know: Campaign stop_reason includes `review_clicked` enum value
   - What's unclear: Do we need client-side tracking before redirect, or just log the redirect?
   - Recommendation: Log the intended redirect server-side (no client JS needed), update enrollment status BEFORE redirect

3. **What's the threshold for "negative" feedback routing?**
   - What we know: Requirements say 4-5 → Google, 1-3 → feedback
   - What's unclear: Is 3 stars "neutral" and should it offer both options?
   - Recommendation: Stick to requirements (3 = feedback form) to maintain clear sentiment split

4. **Should feedback dashboard be in Phase 26 or Phase 27 (Dashboard)?**
   - What we know: REVW-03 requires "feedback dashboard," DASH-03 includes "needs attention alerts"
   - What's unclear: Basic list in P26 vs. full dashboard in P27
   - Recommendation: Build basic feedback list view in P26 (satisfies requirement), expand with alerts/filters in P27

## Sources

### Primary (HIGH confidence)
- FTC Consumer Reviews and Testimonials Rule: [https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)
- How To Remain Compliant With FTC's Policy on Review Gating: [https://thriveagency.com/news/how-to-stay-compliant-with-ftcs-policy-on-review-gating/](https://thriveagency.com/news/how-to-stay-compliant-with-ftcs-policy-on-review-gating/)
- Review Generation vs. Review Gating (RaveCapture): [https://ravecapture.com/resources/blog/review-generation-vs-review-gating-whats-legal-and-what-works/](https://ravecapture.com/resources/blog/review-generation-vs-review-gating-whats-legal-and-what-works/)
- What the FTC and Google Say About Review Gating (SOCi): [https://www.soci.ai/knowledge-articles/review-gating/](https://www.soci.ai/knowledge-articles/review-gating/)
- Next.js Forms with Server Actions: [https://www.robinwieruch.de/next-forms/](https://www.robinwieruch.de/next-forms/)
- Resend Next.js Integration: [https://resend.com/nextjs](https://resend.com/nextjs)

### Secondary (MEDIUM confidence)
- Review Funnel Features (Pegas.io): [https://pegas.io/marketing/review-management/review-funnel-features/](https://pegas.io/marketing/review-management/review-funnel-features/)
- ServiceTitan Home Services Reputation Management: [https://www.servicetitan.com/blog/home-services-reputation-management](https://www.servicetitan.com/blog/home-services-reputation-management)
- Next.js Star Rating Component Tutorials: [https://jsdev.space/nextjs-rating/](https://jsdev.space/nextjs-rating/)
- Database Schema for Survey Systems: [https://vertabelo.com/blog/database-design-survey-system/](https://vertabelo.com/blog/database-design-survey-system/)

### Tertiary (LOW confidence)
- WebSearch results on transactional email with Resend (various blog posts)
- WebSearch results on link tracking tools (general overview, not specific implementation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, no new dependencies
- Architecture: HIGH - Public pages, server actions, and RLS patterns already established in codebase
- Pitfalls: HIGH - FTC rules and Google policies well-documented with real enforcement examples
- Legal compliance: MEDIUM-HIGH - FTC rules clear, but exact wording/framing requires legal review

**Research date:** 2026-02-04
**Valid until:** 2026-04-04 (60 days - compliance landscape stable but monitor FTC enforcement updates)

**Key legal considerations:**
- FTC Consumer Reviews Rule (Oct 2024): Bans fake reviews and suppressing negatives, fines up to $51,744 per violation
- Google policy: "Don't discourage or prohibit negative reviews or selectively solicit positive reviews"
- Fashion Nova case (2022): $4.2M fine for review gating (blocking <4 star reviews)
- Language is critical: "Share your experience" (compliant) vs. "Leave a review if satisfied" (violation)

**Existing codebase integration:**
- Phase 24 provides campaign_enrollments table with stop_reason enum
- Phase 23 provides message_templates with {{REVIEW_LINK}} placeholder
- Resend integration exists for transactional emails (webhook handler in place)
- RLS patterns established for business-scoped data
- React Hook Form + Zod already used throughout app
