---
phase: 31
plan: 03
subsystem: landing-page
tags: [marketing, v2-messaging, copy, home-services]
dependency_graph:
  requires: []
  provides: [v2-outcome-cards, v2-stats-section, home-services-social-proof]
  affects: [31-05-PLAN]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - components/marketing/v2/outcome-cards.tsx
    - components/marketing/v2/animated-stats.tsx
    - components/marketing/v2/social-proof-strip.tsx
decisions:
  - key: v2-outcome-messaging
    choice: Automation-focused benefits (multi-touch campaigns, review funnel, job-centric)
    rationale: Aligns with V2 philosophy that system handles follow-ups automatically
  - key: home-services-positioning
    choice: Target HVAC, Plumbing, Electrical, Roofing, Cleaning, Painting
    rationale: Matches service types in codebase and V2 home service business focus
  - key: job-entry-stat
    choice: 10s per job entry replaces hours saved
    rationale: V2 messaging emphasizes job completion speed, not time savings
metrics:
  duration: 5m
  completed: 2026-02-06
---

# Phase 31 Plan 03: V2 Benefits and Social Proof Summary

**One-liner:** Updated outcome cards, stats, and social proof for V2 automation messaging and home services positioning.

## What Changed

### Outcome Cards (outcome-cards.tsx)

| Before (V1) | After (V2) |
|-------------|------------|
| Get More Reviews | Get 3x More Reviews |
| Save Time | Never Miss a Follow-Up |
| No Awkward Asks | Protect Your Reputation |
| "Send requests in under 30 seconds" | "10 seconds per job entry" |
| "No campaigns, no automation setup" | "Multi-touch campaigns automatically follow up" |
| Generic professional email messaging | Review funnel routing (4-5 stars to Google, 1-3 to private) |

### Animated Stats (animated-stats.tsx)

| Metric | Before | After |
|--------|--------|-------|
| Businesses label | "Businesses Using AvisLoop" | "Home Service Businesses" |
| Efficiency stat | 127 Hours Saved Per Business | 10s Per Job Entry |
| Section header | "Trusted by Businesses Like Yours" | "Built for Home Service Businesses" |

### Social Proof Strip (social-proof-strip.tsx)

| Aspect | Before | After |
|--------|--------|-------|
| Industries | Dentists, Salons, Contractors, Gyms, Restaurants, Clinics | HVAC, Plumbing, Electrical, Roofing, Cleaning, Painting |
| Trust text | "Trusted by 500+ businesses" | "Trusted by home service pros" |

## V2 Alignment Verification

**V1 language removed:**
- "Send requests in under 30 seconds" (manual sending speed)
- "No campaigns, no automation setup" (anti-automation messaging)
- Generic industries (Dentists, Salons, Gyms, Restaurants)

**V2 language added:**
- "Multi-touch campaigns automatically follow up" (automation benefit)
- "Review funnel routes 4-5 stars to Google, 1-3 stars to private feedback" (funnel feature)
- "Complete a job in 10 seconds" (job-centric action)
- "Works while you're on the next call" (hands-off operation)
- Home service industries (HVAC, Plumbing, Electrical, Roofing, Cleaning, Painting)

## Commits

| Commit | Task | Description |
|--------|------|-------------|
| cc0b25f | Task 1 | Update outcome cards for V2 automation messaging |
| b7b8e72 | Task 2 | Update stats section for V2 home services positioning |
| b12cc19 | Task 3 | Update social proof for home services industries |

## Files Modified

```
components/marketing/v2/outcome-cards.tsx    - V2 benefit messaging
components/marketing/v2/animated-stats.tsx   - Home services stats
components/marketing/v2/social-proof-strip.tsx - Home services industries
```

## Verification

- [x] `pnpm lint` passes
- [x] V1 "30 seconds" language removed
- [x] V2 "Never Miss a Follow-Up" present
- [x] V2 "Protect Your Reputation" present
- [x] Home services industries (HVAC, Plumbing, Electrical) present
- [x] "10s Per Job Entry" stat present
- [x] "Built for Home Service Businesses" header present

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Ready for:** Plan 31-05 (Integration and optimization) can proceed.
