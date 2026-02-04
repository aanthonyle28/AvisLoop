---
phase: 26-review-funnel
plan: 05
subsystem: ui
tags: [next.js, review-funnel, public-page, token-validation, server-components]

# Dependency graph
requires:
  - phase: 26-02
    provides: Token generation and parsing functions
  - phase: 26-03
    provides: Feedback data layer and API route
  - phase: 26-04
    provides: Review UI components (SatisfactionRating, FeedbackForm, ThankYouCard)
provides:
  - Public review page at /r/[token]
  - Server component with token validation and data fetching
  - Client component orchestrating rating flow (rating -> destination)
affects: [26-06, 26-07, future email templates with review links]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dynamic route with token parameter (/r/[token])
    - Service role client for public unauthenticated pages
    - Step-based flow state machine in client component

key-files:
  created:
    - app/r/[token]/page.tsx
    - app/r/[token]/review-flow.tsx
  modified: []

key-decisions:
  - "Service role client for public pages (no user session context)"
  - "Step-based state machine for flow (rating -> feedback/redirecting -> complete)"
  - "Non-blocking API calls (rating recorded async, doesn't block flow)"
  - "FTC-compliant language from REVIEW_PAGE_COPY constants"

patterns-established:
  - "Public review pages use service role client"
  - "Rating -> destination routing via getReviewDestination()"
  - "Token validation server-side prevents enumeration attacks"

# Metrics
duration: 15min
completed: 2026-02-04
---

# Phase 26 Plan 05: Public Review Page Summary

**Public review page at /r/[token] with server-side token validation and step-based flow routing customers to Google reviews (4-5 stars) or feedback form (1-3 stars)**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-04T19:22:47Z
- **Completed:** 2026-02-04T19:38:00Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Created public review page server component with token validation
- Built step-based review flow client component
- Implemented FTC-compliant rating-to-destination routing
- Server-side 404 for invalid/expired tokens or missing data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create public review page server component** - `6a635f5` (feat)
2. **Task 2: Create review flow client component** - `a19527e` (feat)

## Files Created

- `app/r/[token]/page.tsx` - Server component: validates token, fetches customer/business data, renders ReviewFlow
- `app/r/[token]/review-flow.tsx` - Client component: step-based flow (rating -> Google redirect OR feedback form -> thank you)

## Decisions Made

1. **Service role client for public pages** - No user session on public review pages, service role bypasses RLS safely after token validation
2. **Step-based flow state machine** - Clean separation of UI states: 'rating' | 'feedback' | 'redirecting' | 'complete'
3. **Non-blocking API calls** - recordRatingAndStop doesn't block UI flow; API errors logged but don't prevent customer from completing review
4. **1.5s redirect delay** - Brief pause with spinner before Google redirect for better UX

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Public review page ready for testing with valid tokens
- Depends on 26-06 (API routes) for full flow testing
- Depends on 26-07 (Resend webhook) for email link tracking

---
*Phase: 26-review-funnel*
*Completed: 2026-02-04*
