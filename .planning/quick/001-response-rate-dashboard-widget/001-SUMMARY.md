---
phase: quick
plan: 001
subsystem: dashboard
tags: [analytics, dashboard-widget, response-rate, migration, server-component]

# Dependency graph
requires:
  - phase: 04-core-sending
    provides: send_logs table, send status tracking
  - phase: 05-message-history
    provides: send history queries and data layer
provides:
  - reviewed_at column on send_logs for response tracking
  - getResponseRate() data function returning total/responded/rate
  - ResponseRateCard dashboard widget with tier-based tips
affects: [future-analytics, webhook-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tier-based contextual tips (7 levels with color indicators)"
    - "Partial index for filtered aggregate queries"
    - "Head-only count queries for lightweight aggregation"

key-files:
  created:
    - supabase/migrations/00009_add_reviewed_at.sql
    - components/dashboard/response-rate-card.tsx
  modified:
    - lib/data/send-logs.ts
    - app/dashboard/page.tsx

# Decisions
decisions:
  - id: Q001-D1
    decision: "Use two head-only count queries for response rate calculation"
    rationale: "Matches existing getMonthlyUsage pattern; lightweight and efficient"
  - id: Q001-D2
    decision: "Keep sm:grid-cols-2 for stats grid, let third card wrap naturally"
    rationale: "Better responsive behavior on smaller screens"

# Metrics
metrics:
  tasks: 2
  completed: "2026-01-28"
---

# Quick Task 001: Response Rate Dashboard Widget Summary

**One-liner:** Response rate widget with reviewed_at column, tiered color indicators, and contextual improvement tips on the dashboard.

## What Was Done

### Task 1: Add reviewed_at column and getResponseRate data function
- Created migration `00009_add_reviewed_at.sql` adding `reviewed_at TIMESTAMPTZ` column to `send_logs`
- Added partial index on `business_id WHERE reviewed_at IS NOT NULL` for efficient queries
- Added `getResponseRate()` to `lib/data/send-logs.ts` returning `{ total, responded, rate }`
- Uses two head-only count queries matching existing `getMonthlyUsage` pattern
- Auth scoped: gets user, gets business, returns zeros if either missing
- **Commit:** 88230fd

### Task 2: Build ResponseRateCard component and integrate into dashboard
- Created `ResponseRateCard` server component with 7 tier levels:
  - 0% (no data): gray, "Send your first review request to start tracking"
  - 0% (has data): gray, "No responses yet -- consider following up"
  - 1-10%: red, personalization tip
  - 10-25%: orange, follow-up suggestion
  - 25-40%: yellow, momentum encouragement
  - 40-60%: green, positive reinforcement
  - 60%+: emerald, excellence acknowledgment
- Color dot indicator next to percentage using tier color
- Integrated into dashboard: added to Promise.all, rendered as third card in stats grid
- **Commit:** 499ffb5

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- [x] `pnpm typecheck` passes with zero errors
- [x] `pnpm lint` passes with zero errors
- [x] Migration file contains ALTER TABLE and CREATE INDEX statements
- [x] `getResponseRate` exported from `lib/data/send-logs.ts`
- [x] `ResponseRateCard` handles all 7 tier cases
- [x] Dashboard page calls `getResponseRate()` in Promise.all and renders `ResponseRateCard`
