---
phase: 31-landing-page-v2-rewrite
plan: 04
subsystem: ui
tags: [landing-page, marketing, v2-philosophy, phosphor-icons]

# Dependency graph
requires:
  - phase: 31-RESEARCH
    provides: V2 copywriting research (FAQ, testimonials, CTA patterns)
provides:
  - V2-aligned FAQ explaining campaigns, job completion, review funnel
  - Home service testimonials (HVAC, Plumbing, Electric)
  - First-person CTA with automation value proposition
  - V2 pricing terminology (campaign touches, multi-touch campaigns)
affects: [31-05-verification, marketing-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [first-person-cta, phosphor-icon-migration]

key-files:
  created: []
  modified:
    - components/marketing/faq-section.tsx
    - components/marketing/testimonials.tsx
    - components/marketing/cta-section.tsx
    - components/marketing/pricing-table.tsx

key-decisions:
  - "FAQ rewritten with 6 V2 questions explaining automation workflow"
  - "Testimonials from HVAC, Plumbing, Electric businesses"
  - "First-person CTA 'Start My Free Trial' per research (+90% CTR)"
  - "Pricing uses 'campaign touches' and 'customers' not V1 terms"

patterns-established:
  - "First-person CTA: Use 'Start My...' not 'Get Started'"
  - "V2 terminology: 'campaign touches' not 'sends' or 'review requests'"

# Metrics
duration: 8min
completed: 2026-02-06
---

# Phase 31 Plan 04: FAQ, Testimonials, CTA, Pricing V2 Update Summary

**V2-aligned FAQ explaining campaigns and job workflow, home service testimonials, first-person CTA, and pricing with 'campaign touches' terminology**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-06T06:00:00Z
- **Completed:** 2026-02-06T06:08:00Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- Rewrote FAQ with 6 V2-aligned questions (campaigns, job completion, review funnel)
- Updated testimonials to feature home service businesses (HVAC, Plumbing, Electric)
- Changed CTA to first-person "Start My Free Trial" with V2 value proposition
- Updated pricing features to use V2 terminology (campaign touches, multi-touch campaigns)
- Migrated 2 files from lucide-react to Phosphor icons

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite faq-section.tsx for V2** - `bba75a4` (feat)
2. **Task 2: Update testimonials.tsx for home services** - `bc30f16` (feat)
3. **Task 3: Update cta-section.tsx with first-person CTA** - `cb2b696` (feat)
4. **Task 4: Update pricing-table.tsx features for V2** - `5e658dc` (feat)

## Files Created/Modified
- `components/marketing/faq-section.tsx` - V2 FAQ with campaigns, job completion, review funnel explanations; migrated to Phosphor CaretDown
- `components/marketing/testimonials.tsx` - Home service testimonials (HVAC, Plumbing, Electric)
- `components/marketing/cta-section.tsx` - First-person CTA "Start My Free Trial" with 3x reviews headline
- `components/marketing/pricing-table.tsx` - V2 features (campaign touches, multi-touch campaigns); migrated to Phosphor Check

## Decisions Made
- FAQ structure follows V2 philosophy document workflow
- Testimonials use fictional but realistic home service businesses
- First-person CTA per research showing +90% CTR improvement
- "Campaign touches" chosen over "sends" to emphasize automation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `job-filters.tsx` unrelated to this plan (JobStatus type issue)
- This error exists in the codebase but does not block landing page work

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- FAQ, testimonials, CTA, and pricing now V2-aligned
- Ready for 31-05 verification plan
- All V1 language removed from these marketing components

---
*Phase: 31-landing-page-v2-rewrite*
*Completed: 2026-02-06*
