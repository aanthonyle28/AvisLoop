---
phase: 25-llm-personalization
plan: 05
subsystem: ai-preview
tags: [personalization, preview, diff, components, react]
dependency-graph:
  requires: [25-04]
  provides: [PersonalizationPreview, PreviewSampleCard, PreviewDiff]
  affects: [25-06, 25-07]
tech-stack:
  added: []
  patterns: [word-diff-lcs, friendly-diff-highlight, useTransition-loading, details-summary-collapsible]
key-files:
  created:
    - components/ai/preview-diff.tsx
    - components/ai/preview-sample-card.tsx
    - components/ai/personalization-preview.tsx
  modified: []
decisions:
  - id: "preview-diff-lcs"
    decision: "Word-level LCS diff algorithm for readability"
    rationale: "Simple, correct, and produces clean readable output for non-developer users"
  - id: "primary-color-highlights"
    decision: "Primary color bg for additions, muted strikethrough for removals"
    rationale: "Friendly highlights per plan spec - not developer-style red/green"
  - id: "collapsible-original"
    decision: "Original template shown via HTML details/summary"
    rationale: "Keeps focus on personalized output, original accessible but not distracting"
  - id: "3-to-5-samples"
    decision: "Default 3 samples, expandable to 5"
    rationale: "3 curated samples matches Phase 25 context decision; 5 available for deeper inspection"
metrics:
  duration: "~3 minutes"
  completed: "2026-02-04"
---

# Phase 25 Plan 05: Personalization Preview Components Summary

**One-liner:** Preview UI components with word-diff highlighting, sample cards, and batch generation for personalization inspection before campaign launch.

## What Was Done

### Task 1: Diff View Component (preview-diff.tsx)
Created `PreviewDiff` component with:
- Word-level diff using LCS (longest common subsequence) algorithm
- Friendly highlighting: primary color background for additions, muted strikethrough for removals
- `showDiff` prop toggles between diff view and clean view
- Collapsible original template using native HTML `<details>/<summary>`
- Memoized diff computation for performance

### Task 2: Sample Card Component (preview-sample-card.tsx)
Created `PreviewSampleCard` component with:
- Customer context display: name, repeat/new customer badge
- Status badges: green "Personalized" (CheckCircle) or amber "Template used" (Warning)
- Per-sample regenerate button with `useTransition` loading state (spinning icon)
- Fallback reason displayed in amber banner when personalization falls back
- Subject line display for email channel (with diff support)
- Message body rendered through `PreviewDiff`
- Model tag shown subtly at bottom
- Exported `PreviewSample` type for reuse

### Task 3: Main Preview Container (personalization-preview.tsx)
Created `PersonalizationPreview` component with:
- Props: `templateBody`, `templateSubject`, `channel`, `serviceType`
- "Generate Preview" button calling `personalizePreviewBatchAction` server action
- "Regenerate All" button for refreshing all samples
- Individual sample regeneration via `personalizePreview` server action
- Diff toggle using Switch component ("Show changes" / "Clean view")
- Empty state: dashed border with sparkle icon and descriptive text
- Loading state: skeleton placeholders matching card layout
- Error state: destructive-styled alert banner
- Stats bar showing "X of Y samples personalized"
- "Show more samples" button expanding from 3 to 5 samples
- Phosphor icons throughout (Sparkle, ArrowsClockwise, CaretDown)

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `pnpm typecheck` -- passes clean
- `pnpm lint` -- passes clean
- Key link verified: `personalizePreviewBatchAction` imported from `@/lib/actions/personalize`
- All three components export correctly named symbols

## Commits

| Hash | Message |
|------|---------|
| c94dd3f | feat(25-05): create diff view component for personalization preview |
| 6d49ed8 | feat(25-05): create sample card component for personalization preview |
| a979ca5 | feat(25-05): create main personalization preview container |

## Next Phase Readiness

- Components ready for integration into campaign creation flow (25-06/25-07)
- `PersonalizationPreview` accepts template props and handles all server action calls internally
- No blockers for downstream plans
