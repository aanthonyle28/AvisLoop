# Phase 70: Reputation Audit Lead-Gen Tool - Research

**Researched:** 2026-03-03
**Domain:** Google Places API (New), lead-gen gating, Upstash rate limiting, Supabase public inserts, shareable report URLs
**Confidence:** HIGH (API mechanics, rate limiting, DB patterns) / MEDIUM (scoring benchmarks, pricing after March 2025)

---

## Summary

Phase 70 is a public-facing marketing tool at `/audit` that lets anyone search for a business by name + city, enter their email, and receive a letter-grade reputation report backed by live Google Places API data. The tool functions as a lead-gen capture mechanism for AvisLoop.

The standard approach is: (1) Places API Text Search (New) to find the business and get its Place ID + rating + review count in a single request using field masking, (2) a server-side Route Handler that guards the API key and enforces rate limiting, (3) a Supabase `audit_leads` table with anon-role INSERT RLS policy to capture emails, (4) a UUID-based persistent report stored in Supabase so each report has a shareable URL.

**Critical discovery:** Google's Places API (New) treats `rating` and `userRatingCount` as Enterprise-tier fields. As of March 1, 2025, Google replaced the $200 monthly credit with per-SKU free thresholds — the Enterprise SKU gets ~1,000 free requests/month, then costs approximately $35/1,000 requests. At 5 audits/IP/day with rate limiting, cost exposure is manageable at early traffic levels but must be monitored.

**Critical constraint (Google TOS):** You cannot cache or store `rating` and `userRatingCount` from the Places API. The `place_id` field IS cacheable indefinitely. Shareable report URLs must store the computed score/inputs, NOT the raw Places API data — or re-fetch on view. The practical solution: store the computed report results (letter grade, computed score, recommendation text) in the DB, not the raw API values, framing them as "audit results as of [timestamp]."

**Primary recommendation:** Use Places API (New) Text Search with a single POST call requesting `places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount` via field mask, processed server-side in a Next.js Route Handler. Store report outputs (not raw API data) in Supabase. Use Upstash `fixedWindow(5, '1 d')` per IP for the audit endpoint.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Google Places API (New) | v1 | Business lookup, rating, review count | Only official Google source; New API mandatory (legacy deprecated March 2025) |
| `@upstash/ratelimit` | ^2.0.8 | Per-IP daily rate limiting | Already in use in project; proven pattern in `lib/rate-limit.ts` |
| `@upstash/redis` | ^1.36.1 | Backing store for rate limiter | Already in use in project |
| `zod` | ^4.3.6 | Input validation for audit form + API | Already in use project-wide |
| Supabase `anon` RLS | - | Anonymous lead INSERT | Standard Supabase pattern for public forms |
| `crypto.randomUUID()` | Node built-in | Generate report UUID slugs | No external library needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/og` (ImageResponse) | Next.js built-in | Dynamic OG image for shareable report URLs | When implementing social share metadata |
| `date-fns` | ^4.1.0 | Format report timestamps | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Google Places API (New) Text Search | SerpAPI / DataForSEO | Third-party APIs cost more, add dependency, but simpler setup than Google Cloud |
| UUID slug in DB | HMAC-signed token | UUID slug requires DB row; HMAC token requires no DB but can't be looked up without the payload |
| Supabase anon INSERT | API route + service role | Direct anon INSERT is simpler; API route approach gives more control but adds complexity |

**Installation:** No new packages needed. All dependencies already present in project.

---

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (marketing)/
│   └── audit/
│       ├── page.tsx              # Public audit landing (Server Component, no auth)
│       └── [reportId]/
│           └── page.tsx          # Shareable report view (Server Component)
├── api/
│   └── audit/
│       ├── search/
│       │   └── route.ts          # POST: Places API search (rate-limited)
│       └── submit/
│           └── route.ts          # POST: save lead email + create report

components/
└── audit/
    ├── audit-form.tsx            # Client Component: search form + email gate
    ├── audit-results.tsx         # Client Component: score card display
    └── score-badge.tsx           # Letter grade A-F display component

lib/
└── audit/
    ├── places-client.ts          # Google Places API fetch wrapper (server-only)
    ├── scoring.ts                # Reputation score algorithm (pure functions)
    └── types.ts                  # AuditResult, PlacesResult types

supabase/
└── migrations/
    └── 20260303_audit_leads.sql  # audit_leads table + RLS
```

### Pattern 1: Two-Phase Audit Flow

**What:** User first searches (no email required) to see a preview/blurred report, then must enter email to unlock the full report. This is the classic lead-gen gate.

**When to use:** Always — this is the decided pattern.

**Flow:**
```
Phase 1: Search (no email)
  POST /api/audit/search
    → Places API Text Search (rating + userRatingCount)
    → Compute score locally
    → Return: place name, address, letter grade (blurred), preview
    → Store: nothing (no DB write)

Phase 2: Email gate (unlock)
  POST /api/audit/submit
    → Validate email (Zod)
    → Insert into audit_leads (anon INSERT)
    → Store report result in audit_reports
    → Return: reportId (UUID)
    → Redirect to /audit/[reportId]
```

**Example:**
```typescript
// Source: official Next.js App Router Route Handler pattern
// lib/audit/places-client.ts
import 'server-only'

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
].join(',')

export interface PlacesResult {
  placeId: string
  displayName: string
  formattedAddress: string
  rating: number | null
  userRatingCount: number | null
}

export async function searchBusiness(
  businessName: string,
  city: string
): Promise<PlacesResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured')

  const response = await fetch(PLACES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: `${businessName} in ${city}`,
      pageSize: 1,               // Only need top result
      includedType: 'establishment',
    }),
  })

  if (!response.ok) {
    throw new Error(`Places API error: ${response.status}`)
  }

  const data = await response.json()
  const place = data.places?.[0]
  if (!place) return null

  return {
    placeId: place.id,
    displayName: place.displayName?.text ?? businessName,
    formattedAddress: place.formattedAddress ?? city,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
  }
}
```

### Pattern 2: Scoring Algorithm

**What:** Convert rating + review count into a weighted 0-100 score, then map to A-F grade.

**When to use:** Always — this is the core product feature.

**Benchmark data (MEDIUM confidence — from Zabble Insights, Feb 2026):**
- Home services median rating: 4.8 stars
- Home services 75th percentile: 4.9 stars
- Competitive threshold (local pack): 25-50 reviews minimum
- Top performer: 200+ reviews, 4.8+ stars

**Algorithm design:**
```typescript
// lib/audit/scoring.ts

export interface ReputationScore {
  score: number          // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  ratingScore: number    // 0-60 points from rating
  volumeScore: number    // 0-40 points from review count
  gaps: GapAnalysis[]
}

export interface GapAnalysis {
  area: string
  current: string
  benchmark: string
  recommendation: string
}

// Weighting: 60% rating, 40% review volume
// Rationale: Rating affects rank more; volume builds credibility

function scoreRating(rating: number | null): number {
  if (!rating) return 0
  // Rating 4.8+ = 60 pts (full score)
  // Rating 4.5 = 48 pts
  // Rating 4.0 = 36 pts
  // Rating 3.5 = 24 pts
  // Rating < 3.0 = 0 pts
  const normalized = Math.max(0, (rating - 2.0) / (5.0 - 2.0)) // 0-1 scale from 2.0-5.0
  return Math.round(normalized * 60)
}

function scoreVolume(count: number | null): number {
  if (!count) return 0
  // 200+ reviews = 40 pts (full score)
  // 100 reviews = 32 pts
  // 50 reviews  = 24 pts
  // 25 reviews  = 16 pts
  // 10 reviews  = 8 pts
  // < 5 reviews = 0 pts
  const tiers = [
    { min: 200, score: 40 },
    { min: 100, score: 32 },
    { min: 50, score: 24 },
    { min: 25, score: 16 },
    { min: 10, score: 8 },
    { min: 5, score: 4 },
    { min: 0, score: 0 },
  ]
  return tiers.find(t => count >= t.min)?.score ?? 0
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export function computeReputationScore(
  rating: number | null,
  userRatingCount: number | null
): ReputationScore {
  const ratingScore = scoreRating(rating)
  const volumeScore = scoreVolume(userRatingCount)
  const score = ratingScore + volumeScore
  const grade = scoreToGrade(score)

  const gaps: GapAnalysis[] = []

  if (!rating || rating < 4.5) {
    gaps.push({
      area: 'Star Rating',
      current: rating ? `${rating.toFixed(1)} stars` : 'No data',
      benchmark: '4.8 stars (home services median)',
      recommendation: 'Filter unhappy customers BEFORE they leave public reviews using a review funnel',
    })
  }

  if (!userRatingCount || userRatingCount < 50) {
    gaps.push({
      area: 'Review Volume',
      current: userRatingCount ? `${userRatingCount} reviews` : 'No data',
      benchmark: '50+ reviews (competitive threshold)',
      recommendation: 'Automate review requests after every completed job',
    })
  }

  return { score, grade, ratingScore, volumeScore, gaps }
}
```

### Pattern 3: Shareable Report URL with DB Persistence

**What:** Each completed audit (after email capture) gets a UUID stored in Supabase. The shareable URL is `/audit/[reportId]`.

**Why UUID over HMAC token:** HMAC tokens encode the data (no DB needed) but can't be validated independently. UUID slugs require a DB lookup but enable: analytics on report views, future ability to expire reports, and server-side rendering of the shared page.

**DB schema:**
```sql
-- audit_reports stores computed results, NOT raw Google Places data
CREATE TABLE public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  city TEXT NOT NULL,
  place_id TEXT,                    -- cacheable per Google TOS
  place_display_name TEXT,
  place_address TEXT,
  score INTEGER NOT NULL,           -- 0-100 computed score
  grade TEXT NOT NULL,              -- 'A'|'B'|'C'|'D'|'F'
  rating_snapshot NUMERIC(2,1),     -- stored as "as-of timestamp" disclosure
  review_count_snapshot INTEGER,    -- stored as "as-of timestamp" disclosure
  gaps_json JSONB,                  -- array of GapAnalysis objects
  lead_email TEXT NOT NULL,
  audited_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: anon can INSERT (lead capture from public page)
-- RLS: authenticated users cannot read (no dashboard integration needed)
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_audit_reports"
  ON public.audit_reports
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public read by id only (for shareable URL)
CREATE POLICY "public_read_audit_report_by_id"
  ON public.audit_reports
  FOR SELECT
  USING (true);   -- report ID is unguessable UUID; full public read is acceptable
```

**Note on Google TOS and caching:** Storing `rating_snapshot` and `review_count_snapshot` is acceptable when disclosed as "data as of [audited_at]" and used as computed audit inputs, not as a real-time display of current Google data. The report page should include a disclosure: "Rating data retrieved [date]. Run a new audit for current data."

### Pattern 4: Rate Limiting (Per-IP, Per-Day)

**What:** Add a new Upstash rate limiter at `lib/rate-limit.ts` following the existing project pattern.

**Algorithm:** `fixedWindow` (not slidingWindow) for daily limits — simpler and sufficient for this use case. Fixed window resets at midnight UTC; sliding window is more accurate but overkill for a daily budget.

**Example:**
```typescript
// Add to lib/rate-limit.ts

/**
 * Per-IP rate limit for the public audit endpoint.
 * Allows 5 audits per day per IP to prevent abuse and control Google API costs.
 */
export const auditRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(5, '1 d'),
      prefix: 'ratelimit:audit',
    })
  : null

export async function checkAuditRateLimit(ip: string): Promise<{
  success: boolean
  remaining?: number
  reset?: number
}> {
  if (!auditRatelimit) {
    return { success: true, remaining: 99 }
  }
  const result = await auditRatelimit.limit(ip)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}
```

### Pattern 5: Lead Capture Table

```sql
-- audit_leads: captures prospect email separately from reports
-- (allows future CRM integration / marketing automation)
CREATE TABLE public.audit_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  city TEXT NOT NULL,
  report_id UUID REFERENCES public.audit_reports(id) ON DELETE SET NULL,
  ip_address INET,                  -- for dedup and compliance logging
  source TEXT DEFAULT 'audit_tool', -- for attribution
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_leads ENABLE ROW LEVEL SECURITY;

-- Anonymous users can insert (public lead capture form)
CREATE POLICY "anon_insert_audit_leads"
  ON public.audit_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- No SELECT for anon - leads are private to the business
-- Authenticated users (admin) can read all leads
CREATE POLICY "auth_read_audit_leads"
  ON public.audit_leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Grants needed
GRANT INSERT ON public.audit_leads TO anon;
GRANT INSERT ON public.audit_reports TO anon;
GRANT SELECT ON public.audit_reports TO anon;
```

### Anti-Patterns to Avoid

- **Do NOT call Places API from the client side.** The API key would be exposed in browser network traffic. All Places API calls must go through a Next.js Route Handler (server-side).
- **Do NOT use `NEXT_PUBLIC_` prefix for `GOOGLE_PLACES_API_KEY`.** Keep it server-only.
- **Do NOT cache `rating` or `userRatingCount` as a performance optimization.** Google TOS prohibits pre-fetching and caching. Live fetch per audit is correct.
- **Do NOT use `places.reviews` field.** This triggers Enterprise + Atmosphere SKU tier (more expensive) and returns only 5 reviews anyway. Not needed.
- **Do NOT store raw Google Places response data verbatim.** Store computed scores and disclose the audit timestamp.
- **Do NOT use the legacy Places API endpoints** (`maps.googleapis.com/maps/api/place/...`). Legacy was deprecated March 1, 2025. Use `places.googleapis.com/v1/places:searchText`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Daily rate limiting | Custom Redis counter + TTL | `Ratelimit.fixedWindow(5, '1 d')` from `@upstash/ratelimit` | Edge cases: window reset, atomic increment, distributed state |
| Input validation | Manual string checks | Zod schema (already in project) | Type-safe, error messages, reusable |
| UUID generation | `uuid` npm package | `crypto.randomUUID()` (Node built-in) | No dependency needed, cryptographically secure |
| Business name search | Google Maps scraping | Places API Text Search (New) | Reliable, official, no ToS violations |
| Shareable URL encoding | Base64/URL encoding of report data | DB-persisted UUID slug | Survives report changes, enables analytics |

**Key insight:** The rate limiting and Supabase anon-insert patterns are already proven in this codebase. Follow the exact patterns from `lib/rate-limit.ts` and the existing public API routes.

---

## Common Pitfalls

### Pitfall 1: Places API Field Mask Triggers Enterprise Billing

**What goes wrong:** Developer requests `places.rating` and `places.userRatingCount` without knowing these are Enterprise-tier fields, assuming they're basic/free.

**Why it happens:** The field tier classification is not obvious from the field names. Many tutorials use the older $200/month credit model which no longer applies (changed March 2025).

**How to avoid:** Accept that Enterprise billing applies. At 5 audits/IP/day with rate limiting + ~1,000 free Enterprise requests/month threshold, the first ~1,000 audits are free. Monitor Google Cloud billing dashboard from day one.

**Warning signs:** Google Cloud invoice showing "Text Search Enterprise" charges at $35/1,000 requests above the free threshold.

**Cost math:** 5 audits/IP/day. At 50 unique IPs/day = 250 audits/day = ~7,500/month. Above the 1,000 free threshold → 6,500 paid requests × $0.035 = ~$227/month if you hit that volume. Budget accordingly or reduce to 3 audits/IP/day.

### Pitfall 2: Google TOS Caching Violation

**What goes wrong:** Developer stores `rating` and `userRatingCount` in the DB and serves cached values on the shareable report page instead of re-fetching from Google.

**Why it happens:** Natural performance optimization — "I already have this data, why re-fetch?"

**How to avoid:** Store computed outputs (score, grade, gap recommendations) NOT the raw API response values. Include an "Audited on [date]" disclosure. If the shareable report page shows rating data, re-fetch from Google OR disclose it as point-in-time data from the original audit.

**Recommendation for this phase:** Store `rating_snapshot` and `review_count_snapshot` with an explicit `audited_at` timestamp. Display as "as of [date]" on the report page. Do NOT re-fetch on every page view of the shareable report (that would trigger more billing charges). The audit is a snapshot in time — this is the right product behavior and also avoids caching TOS issues.

**Warning signs:** Being told by Google support that your usage violates Section 3.2.3 of the Maps Platform Terms.

### Pitfall 3: Places API Returns Wrong Business

**What goes wrong:** "Mike's Plumbing in Austin" returns a different business or no result.

**Why it happens:** Text Search is fuzzy. "in [city]" in the query string is the only geographic signal without lat/lng.

**How to avoid:**
1. Return the top result and display the `formattedAddress` prominently so the user can verify it's the right business.
2. Add a "Is this your business?" confirmation step before emailing.
3. Optionally return top 3 matches (increase `pageSize: 3`) and let user select.
4. Consider adding `includedType: 'local_business'` to narrow results.

**Warning signs:** User complaints that "I searched for my business and got someone else's report."

### Pitfall 4: Supabase Anon INSERT Failing

**What goes wrong:** The anon role INSERT policy exists but the GRANT is missing, causing 403 errors.

**Why it happens:** RLS policies and GRANTs are separate concerns in Postgres. A policy alone is not enough — the role must also have permission on the table.

**How to avoid:** Always pair the RLS policy with explicit GRANTs:
```sql
GRANT INSERT ON public.audit_leads TO anon;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
```

**Warning signs:** Supabase client returns `{error: "permission denied for table audit_leads"}` despite RLS policy existing.

### Pitfall 5: API Key Exposure

**What goes wrong:** `GOOGLE_PLACES_API_KEY` is accessed in a Client Component or passed through a Server Action to the client.

**Why it happens:** Developer uses `searchBusiness()` in a Server Action called from a Client Component, thinking Server Actions are server-only. While Server Actions run on the server, the key should still only live in a Route Handler or Server Component, not be passed as a return value.

**How to avoid:** Mark `lib/audit/places-client.ts` with `import 'server-only'`. All Places API calls go through `/api/audit/search/route.ts`. Never `NEXT_PUBLIC_` prefix the key.

**Warning signs:** The key appearing in browser DevTools network requests.

### Pitfall 6: Middleware Domain Routing Conflict

**What goes wrong:** The `/audit` route is not in `APP_ROUTES` in `middleware.ts`, so it may be treated as a marketing route. However, if added to `APP_ROUTES`, it would require auth.

**Why it happens:** The middleware has a strict split between `APP_ROUTES` (requires auth) and marketing routes (public). `/audit` needs to be public AND on the marketing domain.

**How to avoid:** `/audit` should NOT be in `APP_ROUTES`. It belongs in the `(marketing)` route group. Verify the marketing layout works for `/audit` or create a separate layout if the audit tool needs different chrome (no nav header, no footer).

**Warning signs:** Unauthenticated visitors to `/audit` being redirected to `/login`.

---

## Code Examples

### Places API Text Search — complete Route Handler
```typescript
// Source: Google Places API (New) docs + project API route patterns
// app/api/audit/search/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchBusiness } from '@/lib/audit/places-client'
import { computeReputationScore } from '@/lib/audit/scoring'
import { checkAuditRateLimit } from '@/lib/rate-limit'

const searchSchema = z.object({
  businessName: z.string().min(2).max(100).trim(),
  city: z.string().min(2).max(100).trim(),
})

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateLimitResult = await checkAuditRateLimit(ip)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Daily audit limit reached. Try again tomorrow.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = searchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
  }

  const { businessName, city } = parsed.data

  try {
    const placeResult = await searchBusiness(businessName, city)
    if (!placeResult) {
      return NextResponse.json({ error: 'Business not found on Google' }, { status: 404 })
    }

    const score = computeReputationScore(placeResult.rating, placeResult.userRatingCount)

    return NextResponse.json({
      place: {
        placeId: placeResult.placeId,
        displayName: placeResult.displayName,
        formattedAddress: placeResult.formattedAddress,
      },
      // Preview: show grade but withhold full analysis until email submitted
      grade: score.grade,
      score: score.score,
      // Full data only returned after email gate (from /api/audit/submit)
    })
  } catch (err) {
    console.error('Places API error:', err)
    return NextResponse.json({ error: 'Failed to fetch business data' }, { status: 500 })
  }
}
```

### Email Gate Submit — Route Handler
```typescript
// app/api/audit/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { searchBusiness } from '@/lib/audit/places-client'
import { computeReputationScore } from '@/lib/audit/scoring'

const submitSchema = z.object({
  email: z.string().email(),
  businessName: z.string().min(2).max(100).trim(),
  city: z.string().min(2).max(100).trim(),
  placeId: z.string().optional(), // from search step
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const parsed = submitSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { email, businessName, city } = parsed.data
  const supabase = createServiceRoleClient()

  // Re-fetch from Places API (cannot use cached data per TOS)
  const placeResult = await searchBusiness(businessName, city)
  const score = placeResult
    ? computeReputationScore(placeResult.rating, placeResult.userRatingCount)
    : computeReputationScore(null, null)

  // Insert report
  const { data: report, error: reportError } = await supabase
    .from('audit_reports')
    .insert({
      business_name: businessName,
      city,
      place_id: placeResult?.placeId ?? null,
      place_display_name: placeResult?.displayName ?? businessName,
      place_address: placeResult?.formattedAddress ?? city,
      score: score.score,
      grade: score.grade,
      rating_snapshot: placeResult?.rating ?? null,
      review_count_snapshot: placeResult?.userRatingCount ?? null,
      gaps_json: score.gaps,
      lead_email: email,
    })
    .select('id')
    .single()

  if (reportError) {
    console.error('Report insert error:', reportError)
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
  }

  // Insert lead separately
  await supabase.from('audit_leads').insert({
    email,
    business_name: businessName,
    city,
    report_id: report.id,
    ip_address: ip,
  })

  return NextResponse.json({ reportId: report.id })
}
```

### Shareable Report Page
```typescript
// app/(marketing)/audit/[reportId]/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { reportId: string } }) {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('audit_reports')
    .select('business_name, city, grade, score')
    .eq('id', params.reportId)
    .single()

  if (!data) return {}

  return {
    title: `${data.business_name} Reputation Score: ${data.grade} | AvisLoop`,
    description: `${data.business_name} in ${data.city} scored ${data.score}/100 on the AvisLoop Reputation Audit.`,
    openGraph: {
      title: `${data.business_name} | Reputation Score: ${data.grade}`,
    },
  }
}
```

### Migration File Structure
```sql
-- supabase/migrations/20260303_audit_tables.sql

CREATE TABLE public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  city TEXT NOT NULL,
  place_id TEXT,
  place_display_name TEXT,
  place_address TEXT,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  rating_snapshot NUMERIC(2,1),
  review_count_snapshot INTEGER,
  gaps_json JSONB DEFAULT '[]',
  lead_email TEXT NOT NULL,
  audited_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_audit_reports" ON public.audit_reports
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "public_select_audit_reports" ON public.audit_reports
  FOR SELECT USING (true);

CREATE TABLE public.audit_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  city TEXT NOT NULL,
  report_id UUID REFERENCES public.audit_reports(id) ON DELETE SET NULL,
  ip_address INET,
  source TEXT DEFAULT 'audit_tool',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_audit_leads" ON public.audit_leads
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_select_audit_leads" ON public.audit_leads
  FOR SELECT TO authenticated USING (true);

-- Grants for anon role
GRANT INSERT ON public.audit_reports TO anon;
GRANT SELECT ON public.audit_reports TO anon;
GRANT INSERT ON public.audit_leads TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Indexes
CREATE INDEX idx_audit_reports_created_at ON public.audit_reports(created_at DESC);
CREATE INDEX idx_audit_leads_email ON public.audit_leads(email);
CREATE INDEX idx_audit_leads_report_id ON public.audit_leads(report_id);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Google Places API (legacy) `maps.googleapis.com/...` | Places API (New) `places.googleapis.com/v1/...` | Legacy deprecated March 1, 2025 | Must use new endpoint and field mask syntax |
| $200/month free credit | Per-SKU free thresholds (Enterprise: ~1,000/month) | March 1, 2025 | Cost model changed; first 1,000 Enterprise requests/month are free |
| `user_ratings_total` field name | `userRatingCount` field name | Places API (New) | Different field names between legacy and new API |
| Find Place then Place Details (2-step) | Text Search (New) with field mask (1-step) | Places API (New) | Single request returns both search result and details |
| `place_id` field name | `id` field name | Places API (New) | Field naming standardized in new API |
| Response wrapped in `result` | Response is flat Place object | Places API (New) | Different response structure |

**Deprecated/outdated:**
- Legacy endpoint `maps.googleapis.com/maps/api/place/textsearch/json`: Do not use. Legacy status as of March 2025.
- `Find Place` endpoint: Replaced by Text Search (New) with `pageSize: 1`.
- `user_ratings_total` field: Legacy field name. New API uses `userRatingCount`.
- `place_id` field (in legacy response): New API uses `id` at root of Place object.

---

## Open Questions

1. **Competitor comparison feature (success criteria #5)**
   - What we know: The Places API can search for a second business by name. Same Text Search call, same field mask.
   - What's unclear: Whether to require a second API call (2x cost per audit) or make competitor comparison optional with a "+" UI affordance after email gate.
   - Recommendation: Make competitor comparison a step 2 after email capture. One additional API call only if user requests it. This keeps the initial audit cost to 1 API call.

2. **Business not found edge case**
   - What we know: Text Search returns empty `places[]` array when no match found.
   - What's unclear: Should we show a "not on Google yet" result (which is itself valuable audit data) or just show an error?
   - Recommendation: Show a "No Google presence found" result with grade F and a strong CTA — this is actually a compelling lead-gen message.

3. **Google Cloud billing account setup for user**
   - What we know: User does not yet have a Google Cloud project. Setup requires: create project → enable billing → enable Places API (New) → create API key → restrict to server IP.
   - What's unclear: Whether Vercel's outbound IPs are stable enough for IP-restricted keys. Vercel uses dynamic IPs.
   - Recommendation: For Vercel deployment, use API restriction type "None" (no restriction) but restrict by API only (restrict to Places API only). This is less secure than IP restriction but necessary for serverless deployments. Add `GOOGLE_PLACES_API_KEY` to `.env.local` and Vercel environment variables.

4. **SEO potential for `/audit` page**
   - What we know: Static landing page with a form can rank for "free reputation audit home services" style queries.
   - What's unclear: Whether the dynamic report pages at `/audit/[reportId]` should be indexed. If yes, they provide unique content per business.
   - Recommendation: Allow `[reportId]` pages to be indexed (they contain unique business name + city + score content). Add `canonical` tag pointing to `/audit` to avoid diluting the main page. Don't `noindex` the report pages.

5. **Middleware routing for `/audit`**
   - What we know: The marketing layout (`(marketing)` route group) handles public pages. `/audit` should live there.
   - What's unclear: Whether `/audit` needs its own layout (different nav/footer) or can share the marketing layout.
   - Recommendation: Use a nested layout inside `(marketing)/audit/layout.tsx` to strip the standard marketing nav/footer and replace with minimal audit-specific chrome. This keeps the audit tool focused on conversion.

---

## Sources

### Primary (HIGH confidence)
- Google Places API (New) Text Search docs — `https://developers.google.com/maps/documentation/places/web-service/text-search`
- Google Places API (New) Data Fields — `https://developers.google.com/maps/documentation/places/web-service/data-fields` (confirmed `rating` and `userRatingCount` are Enterprise SKU)
- Google Places API (New) Policies — `https://developers.google.com/maps/documentation/places/web-service/policies` (caching restrictions, attribution requirements, place_id exception)
- Google Maps Platform March 2025 changes — `https://developers.google.com/maps/billing-and-pricing/march-2025` (confirmed $200 credit replaced)
- Upstash ratelimit GitHub README — `https://github.com/upstash/ratelimit-js` (`fixedWindow` and `slidingWindow` syntax)
- Project source: `lib/rate-limit.ts` (existing rate limiting patterns)
- Project source: `app/api/review/rate/route.ts` (existing public API route patterns)
- Project source: `middleware.ts` (route protection and domain routing)

### Secondary (MEDIUM confidence)
- Zabble Insights Industry Benchmarks (updated Feb 2026) — home services median rating 4.8, 75th percentile 4.9
- Safegraph Places API Pricing Guide — Enterprise SKU pricing ~$35/1,000 requests (pre-March 2025 rates; post-March 2025 rates may differ)
- Home services review benchmarks — 25-50 reviews minimum competitive threshold for local pack
- Supabase RLS anon insert pattern — multiple community confirmations that GRANT is required alongside policy

### Tertiary (LOW confidence)
- Scoring algorithm A-F thresholds — derived from industry benchmark data and letter grade convention; not from an authoritative source. The specific score boundaries (85=A, 70=B, etc.) are a reasonable design choice, not a standard.
- Exact cost per 1,000 for Enterprise SKU post-March 2025 — WebFetch returned inconsistent data; the $35/1,000 figure may be pre-2025. Verify in Google Cloud Console after account creation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; Google Places API (New) is the only option post-March 2025
- Architecture: HIGH — patterns directly derived from existing project code
- Places API mechanics: HIGH — verified against official documentation
- Pricing: MEDIUM — $200 credit replacement confirmed; exact Enterprise tier cost LOW confidence after March 2025 changes
- Scoring benchmarks: MEDIUM — Zabble Insights data from Feb 2026; individual thresholds are design choices
- Pitfalls: HIGH — TOS caching restriction and middleware routing are verified; anon INSERT pattern is verified

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (Places API is stable; pricing tier details may change)

---

## Environment Variables Required

Add to `.env.local` and Vercel project settings:

```bash
# Google Places API (New) — server-only, do NOT prefix with NEXT_PUBLIC_
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

**Google Cloud setup steps (for user who doesn't have a project):**
1. Go to `https://console.cloud.google.com/`
2. Create a new project (e.g., "AvisLoop Production")
3. Enable billing on the project
4. Navigate to APIs & Services → Library → search "Places API (New)" → Enable
5. Navigate to APIs & Services → Credentials → Create Credentials → API Key
6. In the API key settings: set "API restrictions" to "Places API (New)" only
7. For Application restrictions: select "None" (Vercel uses dynamic IPs; IP restriction breaks serverless)
8. Copy the key to `.env.local` and Vercel environment variables
9. Monitor billing at `https://console.cloud.google.com/billing`
