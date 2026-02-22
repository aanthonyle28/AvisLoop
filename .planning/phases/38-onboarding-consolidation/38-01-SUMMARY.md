---
phase: 38
plan: "01"
name: "Onboarding Wizard 7→5 Steps"
subsystem: onboarding
tags: [onboarding, wizard, localStorage, ux, steps]
status: complete

dependency-graph:
  requires: []
  provides:
    - "5-step onboarding wizard (Business Basics, Services Offered, Campaign Preset, Import Jobs, SMS Consent)"
    - "localStorage key 'onboarding-draft-v2' abandons stale 7-step drafts cleanly"
    - "URL step param clamped to 1-5 — no blank screen for old bookmarks"
  affects:
    - "38-02 (if any): Onboarding step content changes build on this 5-step shell"

tech-stack:
  added: []
  patterns:
    - "Storage key versioning: bump STORAGE_KEY constant string to break stale drafts without migration code"
    - "Switch-based step router: single switch statement in OnboardingSteps maps step number to component"

key-files:
  created: []
  modified:
    - components/onboarding/onboarding-wizard.tsx
    - components/onboarding/onboarding-steps.tsx
    - app/onboarding/page.tsx

decisions:
  - "Remove Review Destination step (step 2): google_review_link already collected in Business Basics step 1 — pure duplicate"
  - "Remove Software Used step (step 4): low-value data collection, no downstream automation dependency"
  - "Bump STORAGE_KEY to 'onboarding-draft-v2': stale 7-step drafts under old key are abandoned; returning users start fresh (safe because step 1 saves to DB on Continue)"
  - "Step files stay on disk: ReviewDestinationStep and SoftwareUsedStep components not deleted — no active breakage from unused files, avoids accidental data loss"

metrics:
  tasks-completed: 2
  tasks-planned: 2
  duration: "~2 minutes"
  completed: "2026-02-20"
---

# Phase 38 Plan 01: Onboarding Wizard 7→5 Steps Summary

**One-liner:** Removed Review Destination and Software Used steps from 7-step onboarding wizard, reducing to 5 steps with new localStorage key `onboarding-draft-v2` and URL clamp at step 5.

## What Was Built

Reduced the onboarding wizard from 7 steps to 5 by removing two steps:

- **Removed: Review Destination (old step 2)** — google_review_link is already captured in Business Basics (step 1). Duplicate data collection added friction.
- **Removed: Software Used (old step 4)** — Collects CRM/software info with no downstream automation. Low-value step removed entirely.

**New 5-step flow:**
1. Business Basics (required) — name, phone, google_review_link
2. Services Offered (required) — which service types the business offers
3. Campaign Preset (required) — Gentle/Standard/Aggressive Follow-Up automation preset
4. Import Jobs (optional/skippable) — CSV import for existing jobs
5. SMS Consent (required) — TCPA acknowledgement

## Files Changed

**`components/onboarding/onboarding-wizard.tsx`**
- STEPS array: 7 entries → 5 entries (Business Basics, Services Offered, Campaign Preset, Import Jobs, SMS Consent)
- STORAGE_KEY: `'onboarding-draft'` → `'onboarding-draft-v2'`
- JSDoc: campaignPresets prop comment updated to "For step 3"
- `OnboardingProgress` and `goToStep` bounds use `STEPS.length` — auto-adjusted to 5 with no other changes

**`components/onboarding/onboarding-steps.tsx`**
- Removed imports: `ReviewDestinationStep`, `SoftwareUsedStep`
- Switch statement: 7 cases → 5 cases, renumbered sequentially 1-5
- Only step 5 (SMS Consent) uses `onComplete`; steps 1-4 use `onGoToNext`
- JSDoc comment updated to reflect new step layout

**`app/onboarding/page.tsx`**
- URL step clamp: `Math.min(Math.max(1, stepParam), 7)` → `Math.min(Math.max(1, stepParam), 5)`
- JSDoc step list updated to 5 steps
- Wizard description updated: "7-step flow" → "5-step flow"
- Campaign presets comment: "step 5" → "step 3"

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `onboarding-draft-v2` in wizard file | Found (line 30) |
| `ReviewDestinationStep` in steps file | Zero matches |
| `SoftwareUsedStep` in steps file | Zero matches |
| URL clamp `, 5)` in page.tsx | Found (line 50) |
| Switch cases count in steps file | Exactly 5 |

## Deviations from Plan

None — plan executed exactly as written.

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `5855411` | STEPS array reduced to 5, STORAGE_KEY bumped to v2 |
| Task 2 | `7ba63cb` | Step switch rewired to 5 cases, URL clamp updated to 5 |
