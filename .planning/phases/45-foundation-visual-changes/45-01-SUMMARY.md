---
phase: 45-foundation-visual-changes
plan: "01"
subsystem: ui
tags: [button, cva, tailwind, dashboard, design-system]

# Dependency graph
requires: []
provides:
  - soft button variant in CVA (bg-muted / text-muted-foreground style)
  - dashboard-client.tsx View Campaigns uses variant=soft
  - attention-alerts.tsx Retry + contextual action buttons (3) use variant=soft
  - ready-to-send-queue.tsx conflict resolution secondaries (6) use variant=soft
affects:
  - 45-02 (soft variant must exist before other pages can use it)
  - 45-03 (soft variant needed for nav/global button audit)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "soft button variant: bg-muted/text-muted-foreground for secondary actions that must not compete with primary CTAs"
    - "outline reserved for primary actions among equals (Send One-Off), soft for supporting conflict-resolution buttons"

key-files:
  created: []
  modified:
    - components/ui/button.tsx
    - components/dashboard/dashboard-client.tsx
    - components/dashboard/attention-alerts.tsx
    - components/dashboard/ready-to-send-queue.tsx

key-decisions:
  - "soft variant positioned between secondary and ghost in CVA so TypeScript derives it automatically from VariantProps"
  - "Send One-Off button kept as outline — it is the primary action for completed one-off rows, not a secondary supporting action"

patterns-established:
  - "Soft variant: use for secondary/supporting buttons alongside a default-variant primary CTA"
  - "Outline variant: use for primary actions in a row of peers (no default-variant CTA present)"

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 45 Plan 01: Add soft button variant + dashboard button audit Summary

**Soft button variant added to CVA (bg-muted/text-muted-foreground) and applied to 10 secondary dashboard action buttons across 3 files**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T00:16:24Z
- **Completed:** 2026-02-26T00:18:01Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `soft` CVA variant to `button.tsx` — fills with `bg-muted`, uses `text-muted-foreground`, subtle hover at `bg-muted/80` with dark-mode adjustments
- Switched "View Campaigns" header button in `dashboard-client.tsx` from `outline` to `soft`
- Switched 3 alert action buttons in `attention-alerts.tsx` (Retry, bounced_email contextual, unresolved_feedback contextual) from `outline` to `soft`
- Switched 6 conflict-resolution buttons in `ready-to-send-queue.tsx` (Skip x2, Queue x2, Queued dropdown trigger, Will Replace dropdown trigger) from `outline` to `soft`
- Kept "Send One-Off" as `outline` — it is the only primary action for completed one-off rows

## Task Commits

Each task was committed atomically:

1. **Task 1: Add soft variant to button.tsx CVA** - `1a54d81` (feat)
2. **Task 2: Switch dashboard buttons from outline to soft** - `63fc3c7` (feat)

## Files Created/Modified
- `components/ui/button.tsx` - Added soft variant between secondary and ghost in CVA variants object
- `components/dashboard/dashboard-client.tsx` - View Campaigns: outline -> soft
- `components/dashboard/attention-alerts.tsx` - Retry + 2 contextual actions: outline -> soft (3 buttons)
- `components/dashboard/ready-to-send-queue.tsx` - Skip x2, Queue x2, Queued, Will Replace: outline -> soft (6 buttons)

## Decisions Made
- `soft` variant uses `bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted/60 dark:hover:bg-muted/80` — blends into background, reduces visual weight compared to outline which adds a visible border
- `Send One-Off` retains `outline` because it is the only desktop action button for completed one-off rows — no primary CTA competes with it, so the border is appropriate
- No TypeScript union changes needed — CVA `VariantProps<typeof buttonVariants>` derives the variant union automatically from the CVA definition

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `soft` variant is live and type-safe — 45-02 and 45-03 can use it immediately
- `pnpm typecheck` and `pnpm lint` both pass
- Dashboard button hierarchy is now: `default` (primary CTA) > `soft` (secondary action) > `ghost` (dismiss/overflow icons)

---
*Phase: 45-foundation-visual-changes*
*Completed: 2026-02-26*
