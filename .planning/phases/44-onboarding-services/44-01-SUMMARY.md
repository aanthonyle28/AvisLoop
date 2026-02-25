---
phase: 44
plan: 01
title: CRM Platform Step — Onboarding Wizard
subsystem: onboarding
tags: [onboarding, wizard, crm, ui]
status: complete

dependency-graph:
  requires: []
  provides:
    - 4-step onboarding wizard (Business Setup → Campaign Preset → CRM Platform → SMS Consent)
    - CRMPlatformStep component with square logo cards
    - CRM_PLATFORMS and CRM_SPECIAL_OPTIONS constants in lib/validations/onboarding.ts
  affects:
    - Phase 44-02 (any onboarding follow-up work)

tech-stack:
  added: []
  patterns:
    - Square logo card selection UI (colored abbreviation circles, radio-style single-select)
    - Skippable wizard step with "Skip for now" link
    - Conditional reveal (Other → custom text input)

file-tracking:
  created:
    - components/onboarding/steps/crm-platform-step.tsx
  modified:
    - components/onboarding/onboarding-wizard.tsx
    - components/onboarding/onboarding-steps.tsx
    - app/onboarding/page.tsx
    - lib/validations/onboarding.ts
  deleted:
    - components/onboarding/steps/software-used-step.tsx

decisions:
  - id: CRM_STEP_POSITION
    decision: CRM Platform is step 3 (second-to-last), SMS Consent remains final step (step 4)
    rationale: CRM data is optional/skippable; SMS Consent must be the wizard completion trigger
  - id: CRM_STEP_SKIP_BEHAVIOR
    decision: Skip calls onComplete() directly without saving — no empty string written to DB
    rationale: Null is cleaner than empty string for "not answered"
  - id: CRM_CONTINUE_BEHAVIOR
    decision: Continue always saves (even if no selection), then advances — no required selection
    rationale: Step is for data collection, not gating; nil selection silently skips save
  - id: DEAD_CODE_REMOVED
    decision: software-used-step.tsx deleted (was dead code never wired into current wizard)
    rationale: New crm-platform-step.tsx replaces it entirely; consolidate, don't duplicate

metrics:
  duration: ~3 minutes
  tasks: 2/2
  commits: 2
  completed: 2026-02-25
---

# Phase 44 Plan 01: CRM Platform Step — Onboarding Wizard Summary

**One-liner:** 4-step onboarding wizard with square-card CRM platform selector (Jobber, Housecall Pro, ServiceTitan, GorillaDesk, FieldPulse, None, Other) saved to `software_used` via existing `saveSoftwareUsed` action.

## What Was Built

Added a CRM platform selection step to the onboarding wizard as step 3 of 4. The step presents 7 options as square logo-style cards with colored abbreviation circles (initials on colored bg). Selecting "Other" reveals a free-text input. The step is skippable. The old `software-used-step.tsx` (dead code from the 7-step wizard, never wired into the current 3-step wizard) was deleted.

### Wizard Step Order (After)

| Step | Title | Required |
|------|-------|----------|
| 1 | Business Setup | Yes |
| 2 | Campaign Preset | Yes |
| 3 | CRM Platform | No (skippable) |
| 4 | SMS Consent | Yes — triggers wizard completion |

### CRM Platform Cards

| Platform | Abbr | Color |
|----------|------|-------|
| Jobber | JB | Emerald |
| Housecall Pro | HC | Blue |
| ServiceTitan | ST | Red |
| GorillaDesk | GD | Orange |
| FieldPulse | FP | Violet |
| None | — (Minus icon) | Gray |
| Other | ? | Gray (reveals text input) |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 1a815b9 | feat(44-01): add CRM platform step to onboarding wizard |
| 2 | 52536b6 | chore(44-01): delete dead software-used-step.tsx |

## Verification Passed

- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- STEPS array: 4 entries confirmed
- Switch cases 1-4 confirmed, case 3 passes `onGoToNext`, case 4 passes `onComplete`
- Page step clamp updated to max 4
- `software-used-step.tsx` deleted, zero remaining references to `SoftwareUsedStep`

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

- Phase 44-02 can proceed (no blockers from this plan)
- `saveSoftwareUsed` action already supports arbitrary string values — no schema change needed for new platform values (gorilladesk, fieldpulse)
