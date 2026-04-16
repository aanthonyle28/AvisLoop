---
phase: 70-reputation-audit-lead-gen
verified: 2026-03-11T03:22:41Z
status: gaps_found
score: 7/8 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 7/8
  gaps_closed: []
  gaps_remaining:
    - "Optional competitor comparison shows side-by-side metrics when a competitor name is provided"
  regressions: []
gaps:
  - truth: "Optional competitor comparison shows side-by-side metrics when a competitor name is provided"
    status: failed
    reason: "Competitor comparison was explicitly deferred across all three executed plans (70-01, 70-02, 70-03). Re-verification confirms: no competitor input field, no second Places API call, no side-by-side UI. The gap is unchanged from initial verification."
    artifacts:
      - path: "components/audit/audit-form.tsx"
        issue: "Form has only businessName + city inputs. No competitor name field at any phase."
      - path: "app/api/audit/search/route.ts"
        issue: "Calls searchBusiness() once. No second search for competitor."
      - path: "app/api/audit/submit/route.ts"
        issue: "Calls searchBusiness() once. No competitor data collected or stored."
      - path: "components/audit/audit-results.tsx"
        issue: "Results display has no competitor comparison section."
      - path: "supabase/migrations/20260306_audit_tables.sql"
        issue: "audit_reports table has no competitor_name, competitor_rating, or competitor_review_count columns."
    missing:
      - "Optional competitor name input field in AuditForm"
      - "Second searchBusiness() call with competitor name in search and submit routes"
      - "Side-by-side comparison UI in AuditResults"
      - "Competitor data columns in audit_reports table"
      - "Competitor data fields in AuditReport type"
---

# Phase 70: Reputation Audit Lead-Gen Verification Report

**Phase Goal:** A public /audit page (no auth required) lets agency users and prospects enter a business name + city to receive a Google reputation score card. The tool uses Google Places API to pull ratings, review counts, and optionally compares against a competitor. It generates a letter-grade Reputation Score (A-F) with gap analysis and actionable recommendations. Email is required before showing results (lead capture). Rate-limited via Upstash (3-5 audits/day per IP). Shareable report URLs drive prospects to AvisLoop signup.
**Verified:** 2026-03-11T03:22:41Z
**Status:** gaps_found
**Re-verification:** Yes -- after gap closure attempt (gap unchanged, no regressions)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Prospect can visit /audit, enter business name + city, and receive a score card without logging in | VERIFIED | /audit absent from APP_ROUTES in middleware.ts; AuditPage is a public Server Component with no auth guard; AuditForm state machine handles full search-preview-email-report flow |
| 2 | Google Places API returns real rating and review count data for the searched business | VERIFIED | lib/audit/places-client.ts (server-only) calls Places API (New) searchText endpoint with field mask for rating and userRatingCount; both search and submit routes call searchBusiness() with real HTTP fetch |
| 3 | Email is required before the full report is displayed -- email is captured and stored | VERIFIED | AuditForm phase machine: search phase shows only grade teaser (no gap details); full report only accessible after email submitted to /api/audit/submit; lead_email stored in audit_reports; fire-and-forget insert to audit_leads table |
| 4 | Report shows letter grade (A-F), review count, rating, industry benchmarks, and actionable gap recommendations | VERIFIED | AuditResults: ScoreBadge (A-F), score/100 hero, Key Metrics grid (Google Rating + Review Count), Gap Analysis cards with area/current/benchmark/recommendation fields from scoring.ts; benchmarks are hardcoded home-services thresholds |
| 5 | Optional competitor comparison shows side-by-side metrics when a competitor name is provided | FAILED | No competitor input field anywhere in AuditForm; no second searchBusiness() call in any route; no comparison UI in AuditResults; no competitor columns in migration; no competitor fields in AuditReport type |
| 6 | Rate limiting prevents more than 5 audits per IP per day via Upstash | VERIFIED | auditRatelimit = fixedWindow(5, 1d) in lib/rate-limit.ts; checkAuditRateLimit(ip) called as first operation in /api/audit/search/route.ts; dev-mode bypass when Upstash not configured |
| 7 | Each report has a shareable URL that can be sent to prospects | VERIFIED | Submit route returns reportId (UUID); AuditForm calls router.push to /audit/[reportId] on success; generateMetadata produces OG title/description; AuditResults has copy-to-clipboard share button |
| 8 | The report includes a clear CTA driving to AvisLoop signup | VERIFIED | AuditResults CTA card: Book a Call to /#pricing (Button primary, lg); Learn More to / (Button outline, lg); copy explicitly references AvisLoop |

**Score:** 7/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| lib/audit/types.ts | Type definitions for audit module | VERIFIED | 75 lines; exports PlacesResult, Grade, GapAnalysis, ReputationScore, AuditReport, AuditSearchPreview |
| lib/audit/scoring.ts | Pure reputation scoring algorithm | VERIFIED | 141 lines; scoreRating (0-60), scoreVolume (0-40), scoreToGrade (A-F), computeReputationScore with gap analysis |
| lib/audit/places-client.ts | Server-only Google Places API client | VERIFIED | 104 lines; imports server-only; real HTTP POST to Places API (New); field masking for cost control |
| lib/rate-limit.ts | Upstash rate limiters including audit limiter | VERIFIED | 186 lines; auditRatelimit = fixedWindow(5, 1d) plus checkAuditRateLimit() function |
| supabase/migrations/20260306_audit_tables.sql | DB migration for audit_reports + audit_leads | VERIFIED | 100 lines; idempotent DO guards; RLS enabled + 4 policies; 3 anon GRANTs; 3 indexes |
| app/api/audit/search/route.ts | Rate-limited search endpoint | VERIFIED | 85 lines; rate limit first; Zod safeParse; Places API call; score computation; preview response |
| app/api/audit/submit/route.ts | Email gate + report creation endpoint | VERIFIED | 111 lines; Zod email validation; re-fetches Places API per TOS; inserts audit_report; fire-and-forget lead insert; returns reportId |
| components/audit/score-badge.tsx | Color-coded A-F letter grade badge | VERIFIED | 38 lines; gradeStyles map for A/B/C/D/F; sm/lg sizes; aria-label |
| components/audit/audit-form.tsx | 3-phase client state machine | VERIFIED | 375 lines; search-preview-submitting phases; businessName + city inputs; email capture; sonner toasts; router.push on success |
| components/audit/audit-results.tsx | Full report display component | VERIFIED | 213 lines; 6 sections: hero, metrics, gaps, CTA, disclosure, share button; navigator.clipboard copy link |
| app/(marketing)/audit/page.tsx | Public /audit landing page | VERIFIED | 52 lines; Server Component; metadata export; AuditForm embedded; Google Places attribution |
| app/(marketing)/audit/[reportId]/page.tsx | Shareable report page | VERIFIED | 97 lines; generateMetadata with OG tags; notFound() for invalid IDs; JSONB normalization; fire-and-forget view_count increment |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| AuditForm | /api/audit/search | fetch POST | WIRED | Called in handleSearch; response sets searchResult and transitions to preview phase |
| AuditForm | /api/audit/submit | fetch POST | WIRED | Called in handleEmailSubmit; response reportId triggers router.push |
| /api/audit/search | Google Places API | searchBusiness() | WIRED | places-client.ts called with businessName + city |
| /api/audit/search | Upstash | checkAuditRateLimit(ip) | WIRED | First operation in handler; 429 returned on limit |
| /api/audit/submit | audit_reports DB table | supabase.from.insert() | WIRED | Service role client; all score fields inserted; id returned |
| /api/audit/submit | audit_leads DB table | .then() non-blocking insert | WIRED | Fire-and-forget; failure logged but does not block response |
| /audit/[reportId] | audit_reports DB table | supabase.from.maybeSingle() | WIRED | Service role client; notFound() on null result |
| AuditResults | /audit re-audit | Link href to /audit | WIRED | "new audit" link in data disclosure footer |
| AuditResults | /#pricing | Link href to /#pricing | WIRED | "Book a Call" primary CTA |

### Requirements Coverage

| Truth | Status | Blocking Issue |
|-------|--------|----------------|
| 1. Public /audit page, no auth | SATISFIED | None |
| 2. Real Google Places data | SATISFIED | None |
| 3. Email gate + lead capture | SATISFIED | None |
| 4. Letter grade + benchmarks + recommendations | SATISFIED | None |
| 5. Optional competitor comparison | BLOCKED | No competitor input, no second Places call, no comparison UI, no DB columns |
| 6. Upstash rate limiting (5/day per IP) | SATISFIED | None |
| 7. Shareable URL | SATISFIED | None |
| 8. CTA to AvisLoop signup | SATISFIED | None |

### Anti-Patterns Found

No TODO/FIXME comments, no placeholder content, no empty handlers, and no stub returns were found across all 12 audit files.

### Human Verification Required

#### 1. End-to-end audit flow with live Google Places API key

**Test:** Configure GOOGLE_PLACES_API_KEY and UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN in .env.local. Apply supabase/migrations/20260306_audit_tables.sql via Supabase Dashboard SQL Editor. Visit /audit, enter a real business name + city, complete the email gate, and view the report.
**Expected:** Real Google rating and review count appear. Letter grade and gap recommendations are shown. Report page loads at /audit/[UUID]. Share link copies the current URL to clipboard.
**Why human:** Cannot verify live API calls or DB writes programmatically in this context.

#### 2. Rate limit enforcement

**Test:** Submit more than 5 audit searches from the same IP in a single day (with Upstash configured).
**Expected:** The 6th search returns a 429 response and the form shows a toast: Daily audit limit reached. Try again tomorrow.
**Why human:** Requires a live Upstash instance and real IP tracking.

#### 3. OG social sharing metadata

**Test:** Paste a /audit/[reportId] URL into a social media link previewer (e.g., opengraph.xyz or Slack).
**Expected:** Preview shows business name + grade in the title, city + score in the description.
**Why human:** Requires a live deployed report with real data.

### Gaps Summary

1 gap remains unchanged from initial verification (2026-03-11T03:13:52Z).

The competitor comparison feature (Truth 5) was not implemented in any of the three plans. The research document identified competitor comparison as an open question and it was explicitly deferred. Re-verification confirms no code exists anywhere in the audit module to support it: no competitor name input in the search form, no second Google Places API call, no side-by-side metrics display in results, no competitor fields in the database schema or TypeScript types.

The remaining 7/8 truths are fully verified with substantive, wired implementations. All 12 audit files are clean with no stubs, no TODOs, and no anti-patterns. The gap is isolated to one unimplemented optional feature.

---

_Verified: 2026-03-11T03:22:41Z_
_Verifier: Claude (gsd-verifier)_
_Mode: Re-verification (gap unchanged from 2026-03-11T03:13:52Z initial verification)_