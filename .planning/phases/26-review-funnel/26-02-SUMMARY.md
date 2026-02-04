---
phase: 26-review-funnel
plan: 02
subsystem: api
tags: [token, base64url, crypto, routing, FTC-compliance]

# Dependency graph
requires:
  - phase: 26-01
    provides: customer_feedback table for storing feedback submissions
provides:
  - Secure review token generation with base64url encoding
  - Token parsing with 30-day expiration enforcement
  - Review routing logic (4-5 stars -> google, 1-3 stars -> feedback)
  - FTC-compliant copy constants for review pages
affects: [26-03, 26-04, 26-05, 26-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Token encoding with base64url for URL safety"
    - "Null return pattern for invalid tokens (no exceptions)"
    - "FTC-compliant framing for review requests"

key-files:
  created:
    - lib/review/token.ts
    - lib/review/routing.ts
  modified: []

key-decisions:
  - "base64url encoding instead of base64 for URL safety"
  - "30-day token expiration for security"
  - "Null return pattern for parseReviewToken instead of throwing"
  - "4-star threshold for Google routing (4-5 satisfied, 1-3 feedback)"
  - "REVIEW_PAGE_COPY constants for FTC-compliant messaging"

patterns-established:
  - "Token format: customerId:businessId:enrollmentId:timestamp:random"
  - "Review routing threshold at 4 stars"
  - "Neutral language for review solicitation"

# Metrics
duration: 3min
completed: 2026-02-04
---

# Phase 26 Plan 02: Token Utilities Summary

**Secure review token generation with base64url encoding, 30-day expiration, and FTC-compliant routing logic**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-04T19:12:41Z
- **Completed:** 2026-02-04T19:15:30Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Created generateReviewToken with cryptographically secure random bytes
- Created parseReviewToken with 30-day expiration enforcement
- Implemented review routing logic (4-5 stars -> Google, 1-3 stars -> feedback)
- Added FTC-compliant copy constants for review page UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Create review token utilities** - `6e266d6` (feat)
2. **Task 2: Create review routing utility** - `f8d48c6` (feat)

## Files Created

- `lib/review/token.ts` - Token generation and parsing utilities with base64url encoding
- `lib/review/routing.ts` - Review destination routing and FTC-compliant copy constants

## Key Exports

### lib/review/token.ts (120 lines)
- `generateReviewToken(params)` - Creates secure URL-safe token
- `parseReviewToken(token)` - Validates and extracts token payload
- `isTokenExpired(token)` - Quick expiration check
- `getReviewUrl(token)` - Builds full review URL
- `ReviewTokenPayload` - TypeScript interface

### lib/review/routing.ts (94 lines)
- `getReviewDestination(rating)` - Routes based on star rating
- `getRatingLabel(rating)` - Accessibility labels for ratings
- `GOOGLE_THRESHOLD` - Threshold constant (4)
- `REVIEW_PAGE_COPY` - FTC-compliant UI copy

## Decisions Made

1. **base64url encoding** - Chosen over base64 for URL safety (no +, /, or = characters)
2. **30-day expiration** - Matches research recommendation for review link validity
3. **Null return pattern** - parseReviewToken returns null on any error instead of throwing
4. **4-star threshold** - Industry standard for satisfied vs. feedback routing
5. **Neutral language** - FTC-compliant "share your experience" framing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Token utilities ready for review page implementation (Plan 03)
- Routing logic ready for star rating UI
- Copy constants ready for page content
- No blockers

---
*Phase: 26-review-funnel*
*Completed: 2026-02-04*
