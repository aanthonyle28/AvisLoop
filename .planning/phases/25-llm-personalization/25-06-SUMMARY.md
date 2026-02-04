---
phase: 25-llm-personalization
plan: "06"
title: "Observability & Settings UI"
status: complete
completed: 2026-02-04
duration: "~4 minutes"
subsystem: personalization-ui
tags: [personalization, stats, settings, campaign-form, sparkle]

dependency_graph:
  requires: ["25-04"]
  provides: ["personalization-stats-data", "campaign-personalization-toggle", "settings-personalization-section"]
  affects: ["25-07"]

tech_stack:
  added: []
  patterns:
    - "Estimated stats with isEstimated flag (MVP pattern)"
    - "Server Component data fetch -> Client Component display"
    - "details/summary for collapsible form sections"

key_files:
  created:
    - lib/data/personalization.ts
    - components/settings/personalization-section.tsx
  modified:
    - components/campaigns/campaign-form.tsx
    - app/dashboard/settings/page.tsx

decisions:
  - id: estimated-personalization-rate
    decision: "MVP uses 95% estimated personalization rate"
    reason: "No per-send-log tracking column yet; actual data deferred to 25-07"
    constraint: "isEstimated flag in UI makes this transparent to users"
  - id: local-state-toggle
    decision: "Personalization toggle stored in local React state"
    reason: "DB column for per-campaign personalization setting deferred to 25-07"
    constraint: "Toggle visible but does not persist across page loads"
  - id: parallel-settings-fetch
    decision: "Promise.all for templates, service types, and personalization stats"
    reason: "Avoid sequential waterfall on settings page load"
    constraint: "All three queries run concurrently"

metrics:
  tasks_completed: 3
  tasks_total: 3
  commits: 3
---

# Phase 25 Plan 06: Observability & Settings UI Summary

Personalization stats data layer, campaign form toggle, and settings page observability for LLM personalization.

## One-liner

Personalization stats with 95% estimated rate, Sparkle-branded AI toggle in campaign form, and color-coded usage dashboard in settings.

## What Was Built

### Task 1: Personalization Stats Data Functions (lib/data/personalization.ts)

Created data layer for personalization observability:

- **getPersonalizationStats**: Queries send_logs for campaign sends in the last 7 days, estimates personalization rate at 95% (MVP), returns `PersonalizationStats` with `isEstimated: true` flag
- **getLLMUsageStats**: Wraps `getLLMUsage` from `rate-limit.ts`, adds percentage calculation and `isConfigured` flag for environments without Redis
- **getPersonalizationSummary**: Combined stats + usage with health assessment (`great`/`good`/`degraded`) and human-readable messages
- Exported types: `PersonalizationStats`, `LLMUsageStats`, `PersonalizationSummary`
- TODO comments documenting future path to actual tracking via send_logs column

### Task 2: Campaign Form Personalization Toggle (campaign-form.tsx)

Added "Advanced Settings" collapsible section to the campaign form:

- `<details>/<summary>` HTML pattern for collapsible section (no JS needed for open/close)
- `Sparkle` icon from Phosphor with fill weight and amber color
- `Switch` component (Radix UI) defaulting to ON
- Warning message when disabled: "All recipients will receive the exact template text without customization"
- Local `useState` for toggle -- DB persistence deferred to 25-07

### Task 3: Settings Page Personalization Section (settings page)

Added AI Personalization section to the settings page:

- `PersonalizationSection` client component receives server-fetched summary data
- 3-column stats grid: personalization rate, campaign sends (7d), fallback rate
- Color-coded rate indicators: green >= 95%, amber >= 80%, red < 80%
- "(estimated)" label displayed when `isEstimated` is true
- LLM usage capacity bar with remaining calls and reset time (only shown when rate limiting configured)
- Health status dot + message based on stats and usage levels
- Parallel data fetching with `Promise.all` for settings page performance

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **95% estimated rate**: MVP approximation based on production LLM reliability with fallback chain. Will be replaced with actual tracking data once send_logs has a `personalized` column.

2. **Local state toggle**: The personalization toggle in the campaign form uses React state only. It renders correctly and provides the UX, but does not persist to the database. The DB column and server action integration is scoped for 25-07.

3. **Parallel data fetching**: Settings page refactored to use `Promise.all` for templates, service type settings, and personalization summary. Eliminates sequential waterfall for faster page loads.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 5b80224 | feat | Create personalization stats data functions |
| 9dd3fb5 | feat | Add AI personalization toggle to campaign form |
| 937189a | feat | Add personalization stats to settings page |

## Next Phase Readiness

Plan 25-07 can now:
- Use `getPersonalizationStats` and `getPersonalizationSummary` from the data layer
- Add actual `personalized` boolean column to send_logs and replace estimation
- Persist the campaign-level personalization toggle to a DB column
- Wire the toggle to the `personalizeWithFallback` call in the cron processor

No blockers for 25-07.
