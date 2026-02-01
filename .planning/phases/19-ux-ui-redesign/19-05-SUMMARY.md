---
phase: 19
plan: 05
subsystem: send-ui
tags: [ui, stats, activity-feed, dashboard-widgets]
requires: [19-03]
provides:
  - StatStrip component for compact metrics display
  - RecentActivityStrip for tab-aware activity feed
  - Integrated stats and activity on Send page
affects: [19-07]
tech-stack:
  added: []
  patterns:
    - Tab-aware component rendering
    - Smart CTA based on usage thresholds
    - Batch activity grouping
key-files:
  created:
    - components/send/stat-strip.tsx
    - components/send/recent-activity-strip.tsx
  modified:
    - app/(dashboard)/send/page.tsx
    - components/send/send-page-client.tsx
decisions:
  - id: compact-stat-cards
    decision: Compact stat strip with 3 cards in horizontal row
    rationale: Reduces vertical space, keeps stats visible above tabs
    date: 2026-02-01
  - id: smart-usage-cta
    decision: Dynamic CTA based on usage (80-90% "Manage plan", >=90% "Upgrade")
    rationale: Proactive nudge before users hit limits
    date: 2026-02-01
  - id: tab-aware-activity
    decision: RecentActivityStrip mode changes with active tab
    rationale: Shows relevant activity (individual items on quick, batches on bulk)
    date: 2026-02-01
metrics:
  duration: 5min
  completed: 2026-02-01
---

# Phase 19 Plan 05: Stat Strip and Recent Activity Summary

**One-liner:** Compact stat strip (usage, review rate, needs attention) and tab-aware recent activity feed integrated above Send tabs.

## What Was Built

### StatStrip Component
Compact horizontal stat cards showing:
- **Monthly Usage**: Progress bar, smart CTA at 80-90% ("Manage plan"), warning at >=90% ("Upgrade")
- **Review Rate**: Percentage + 5-star visual indicator
- **Needs Attention**: Count with link to filtered history, shows pending/failed breakdown

### RecentActivityStrip Component
Tab-aware activity feed:
- **Quick mode**: Individual contact items (name, status, relative time)
- **Bulk mode**: Batch summaries with counts
- Clickable items (currently navigate to /history, Plan 07 adds drawer)
- Empty state: "No sends yet — send your first review request!"
- Uses StatusBadge and formatDistanceToNow

### Send Page Integration
- StatStrip renders above tabs (hidden until onboarding complete)
- RecentActivityStrip renders below stats, above tabs
- Tab changes update activity mode dynamically
- Fetches all required data (usage, response rate, needs attention, recent activity)

## Technical Implementation

**StatStrip Design:**
- Server-compatible (no 'use client')
- Grid layout: `grid-cols-1 sm:grid-cols-3`
- Compact cards: `px-4 py-3` (vs full cards `p-5`)
- Links: "Manage plan" → /billing, "Needs Attention" → /history?status=failed
- Usage bar color changes to red at limit

**RecentActivityStrip Design:**
- Client component (tab state)
- Batch grouping: groups by batch_id, shows count
- Activity items clickable (onItemClick handler)
- Responsive layout with truncation
- Uses existing StatusBadge component

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create StatStrip and RecentActivityStrip | 12e3492 |
| 2 | Integrate strips into Send page | f0f42b3 |

## Files Modified

**Created:**
- `components/send/stat-strip.tsx` (126 lines) - Compact stat cards
- `components/send/recent-activity-strip.tsx` (136 lines) - Tab-aware activity feed

**Modified:**
- `app/(dashboard)/send/page.tsx` - Fetch stats/activity, render StatStrip
- `components/send/send-page-client.tsx` - Tab state, RecentActivityStrip rendering

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Dashboard components still in use**
- **Found during:** Task 1
- **Issue:** Plan said to delete dashboard stat/activity components, but dashboard page still uses them
- **Fix:** Keep components in place - they're used by /dashboard page
- **Rationale:** Deleting would break dashboard. Future plan will migrate dashboard to new components.

**2. [Rule 1 - Bug] Pre-existing typecheck error in bulk-send-tab**
- **Found during:** Task 2 verification
- **Issue:** `bulk-send-tab.tsx` imports non-existent `bulk-send-action-bar.tsx`
- **Fix:** None - pre-existing error, not caused by this plan
- **Impact:** Typecheck shows 1 error, but not from this plan's code

**3. [Rule 1 - Bug] Linter auto-added resendReadyContactIds prop**
- **Found during:** Task 2 lint
- **Issue:** Linter added future Plan 06 prop to Send page and SendPageClient
- **Fix:** Added prop to interface and passed through to BulkSendTab
- **Rationale:** Keeps codebase consistent, prep for Plan 06

## Decisions Made

**1. Compact stat cards (vs full cards)**
- **Context:** Dashboard uses full-size stat cards with more padding
- **Decision:** Use compact cards (`px-4 py-3`) for Send page
- **Rationale:** Stats are secondary on Send page (vs primary on dashboard)
- **Impact:** Reduces vertical space, keeps focus on send actions

**2. Smart usage CTA thresholds**
- **Context:** Need to warn users before they hit limits
- **Decision:** Show "Manage plan" at 80-90%, "Upgrade" at >=90%
- **Alternatives:** Could show at 100% only, or different thresholds
- **Rationale:** 80% gives users time to upgrade before limit, 90% is urgent
- **Impact:** Proactive upgrade path, reduces limit-hit frustration

**3. Tab-aware activity mode**
- **Context:** Quick Send shows individual sends, Bulk Send shows batches
- **Decision:** RecentActivityStrip changes mode based on active tab
- **Alternatives:** Could show same view regardless of tab
- **Rationale:** Contextual relevance - users want to see related activity
- **Impact:** Better UX, activity feed matches current workflow

## Next Phase Readiness

**Ready for Plan 06 (Bulk Send Table):**
- ✅ RecentActivityStrip supports batch mode (ready to show bulk activity)
- ✅ StatStrip shows aggregate metrics across all sends
- ✅ resendReadyContactIds prop already passed to BulkSendTab

**Ready for Plan 07 (Request Detail Drawer):**
- ✅ Activity items have onItemClick handler (currently navigates to /history)
- ✅ Activity items pass request ID to handler
- ⚠️  Plan 07 will replace router.push with drawer open

**Blockers:** None

**Concerns:**
- Pre-existing typecheck error in bulk-send-tab.tsx should be fixed
- Dashboard still uses old stat/activity components - needs migration plan

## Stats & Metrics

**Performance:**
- Duration: 5 minutes
- Tasks: 2/2 completed
- Commits: 2 atomic commits

**Code Quality:**
- Lint: ✅ Pass
- Typecheck: ⚠️  1 pre-existing error (not from this plan)
- Test coverage: N/A (UI components, visual verification)

**Impact:**
- Components created: 2
- Components modified: 2
- Lines added: 262
- Lines removed: 24

## Verification

**Manual Testing Needed:**
1. Visit /send (after onboarding complete)
2. Verify stat strip shows above tabs
3. Verify recent activity shows below stats
4. Change tabs - activity mode should update
5. Click activity item - should navigate to /history
6. Check usage card CTAs at different thresholds
7. Verify "Needs Attention" link filters history correctly

**Visual Checks:**
- Stat cards compact and aligned
- Progress bar animates smoothly
- Stars render correctly (filled vs outline)
- Activity items truncate long names
- Empty state shows when no sends
- Mobile responsive (grid collapses to single column)

## Notes

- StatStrip hidden until onboarding complete (matches dashboard pattern)
- Activity feed uses existing StatusBadge component (design system consistency)
- Batch grouping ready for Plan 06 bulk sends
- Activity click handler ready for Plan 07 drawer integration
- Smart usage CTA encourages proactive upgrades

**Plan 06 will build the Bulk Send table** and use RecentActivityStrip batch mode.
**Plan 07 will add Request detail drawer** and replace activity navigation with drawer open.
