---
phase: 70-reputation-audit-lead-gen
plan: "02"
subsystem: api, ui
tags: [google-places, rate-limit, supabase, nextjs, phosphor-icons, zod, sonner]

# Dependency graph
requires:
  - phase: 70-01
    provides: "lib/audit/types.ts, lib/audit/scoring.ts, lib/audit/places-client.ts, lib/rate-limit.ts (checkAuditRateLimit), DB migration for audit_reports + audit_leads"

provides:
  - "POST /api/audit/search — rate-limited Places API search returning grade+score preview"
  - "POST /api/audit/submit — email gate that creates audit_report + lead, returns reportId"
  - "components/audit/score-badge.tsx — circular A-F badge with color coding (sm/lg sizes)"
  - "components/audit/audit-form.tsx — 3-phase client state machine (search->preview->email gate)"
  - "app/(marketing)/audit/page.tsx — public Server Component landing page with Google attribution"

affects:
  - "70-03 (report page) — consumes reportId from submit route, needs ScoreBadge and AuditReport type"
  - "Future: audit analytics, lead management"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Public Route Handler with service role client (no user session required)"
    - "Zod v4 safeParse pattern for Route Handlers"
    - "Fire-and-forget lead capture (.then() on supabase insert, non-blocking)"
    - "Phase state machine in React: 'search' | 'preview' | 'submitting'"
    - "Inline red text for validation errors, sonner toast for server/rate-limit errors"

key-files:
  created:
    - "app/api/audit/search/route.ts"
    - "app/api/audit/submit/route.ts"
    - "components/audit/score-badge.tsx"
    - "components/audit/audit-form.tsx"
    - "app/(marketing)/audit/page.tsx"
  modified:
    - "components/settings/brand-voice-section.tsx (bug fix: type cast for BrandVoicePresetKey)"

key-decisions:
  - "Re-fetch Places API in submit route — cannot use cached data from search per Google TOS"
  - "Lead insert is fire-and-forget (non-blocking) — audit report is the critical insert, lead is supplementary"
  - "Server errors (429, 500) use sonner toast; client validation errors use inline red text"
  - "Submitting phase shows spinner before router.push redirect (avoids flash of empty form)"
  - "Google attribution text included on landing page (required by Places API TOS)"
  - "/audit not in middleware APP_ROUTES — stays public, inherits marketing layout"

patterns-established:
  - "Public Route Handler pattern: no auth check, service role for DB, Zod safeParse, IP from x-forwarded-for"
  - "Audit form state machine: 3-phase enum drives conditional rendering, not boolean flags"

# Metrics
duration: 4min
completed: "2026-03-04"
---

# Phase 70 Plan 02: Reputation Audit API Routes + Lead-Gen UI Summary

**POST /api/audit/search (rate-limited Places lookup) + POST /api/audit/submit (email gate, report creation) + 3-phase AuditForm state machine + ScoreBadge + public /audit landing page**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-04T06:01:31Z
- **Completed:** 2026-03-04T06:05:27Z
- **Tasks:** 2
- **Files created:** 5
- **Files modified:** 1 (bug fix)

## Accomplishments

- Built two public Route Handlers: search (rate-limited, returns preview) and submit (email gate, inserts report + lead, returns reportId for redirect)
- Created 3-component audit UI: ScoreBadge (color-coded A-F circular badge), AuditForm (3-phase state machine), and public landing page Server Component
- Fixed pre-existing TypeScript error in brand-voice-section.tsx (BrandVoicePresetKey type cast)

## Task Commits

1. **Task 1: Create search and submit API routes** - `cb70e96` (feat)
2. **Task 2: Create audit landing page, form component, and score badge** - `b1b9013` (feat)

## Files Created/Modified

- `app/api/audit/search/route.ts` — POST endpoint: IP rate limit, Zod validation, Places API search, score computation, preview response
- `app/api/audit/submit/route.ts` — POST endpoint: Zod validation, Places API re-fetch (per TOS), service role DB inserts, fire-and-forget lead capture, returns reportId
- `components/audit/score-badge.tsx` — Circular letter grade badge, A=green/B=blue/C=amber/D=orange/F=red, sm/lg sizes
- `components/audit/audit-form.tsx` — 'use client' state machine (search->preview->submitting), Phosphor icons, sonner toasts for server errors, inline red text for validation, router.push redirect
- `app/(marketing)/audit/page.tsx` — Server Component, metadata export, hero section, AuditForm, Google Places API attribution
- `components/settings/brand-voice-section.tsx` — Bug fix: added `as BrandVoicePresetKey` cast on preset passed to saveBrandVoice

## Decisions Made

- **Re-fetch in submit route:** Google Places API TOS prohibits caching raw API responses. Submit route calls `searchBusiness()` again to get fresh data, not the preview result.
- **Fire-and-forget lead:** `audit_leads` insert is non-blocking via `.then()`. Report insert is critical; lead is supplementary analytics.
- **Toast vs inline error:** Server/rate-limit errors use sonner toast (not form-local). Client validation errors use inline red text (immediately actionable by user).
- **Submitting phase:** Third phase state shows spinner until `router.push()` fires — prevents user from submitting twice or seeing empty form during redirect.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error in brand-voice-section.tsx**
- **Found during:** Task 1 verification (pnpm typecheck)
- **Issue:** `saveBrandVoice({ preset: selected, ... })` where `selected` is `string | null` but `preset` expects `BrandVoicePresetKey` (union of string literals). Pre-existing error blocking typecheck.
- **Fix:** Added `as BrandVoicePresetKey` cast. The guard `if (!selected) return` above ensures null is never reached, making the cast safe.
- **Files modified:** `components/settings/brand-voice-section.tsx`
- **Verification:** `pnpm typecheck` passes cleanly after fix.
- **Committed in:** `cb70e96` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Bug fix was required for typecheck to pass — not scope creep.

## Issues Encountered

None - both Route Handlers and UI components compiled and linted cleanly on first run after the pre-existing bug was resolved.

## Next Phase Readiness

- Plan 02 complete — API routes live, UI components ready
- Plan 03 (shareable report page) can import `ScoreBadge` from `@/components/audit/score-badge`
- Plan 03 will read `audit_reports` by ID and render the full gap analysis
- Blocker: DB migration `20260306_audit_tables.sql` must be applied via Supabase Dashboard before submit route can write to DB in production

---
*Phase: 70-reputation-audit-lead-gen*
*Completed: 2026-03-04*
