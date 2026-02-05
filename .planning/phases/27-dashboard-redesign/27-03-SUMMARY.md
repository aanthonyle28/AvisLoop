---
phase: 27-dashboard-redesign
plan: 03
subsystem: dashboard
tags: [dashboard, queue, enrollment, server-actions, inline-actions]

requires:
  - 27-01  # Dashboard data layer
  - 24-02  # Campaign enrollment logic

provides:
  - ready-to-send-queue-component
  - quick-enroll-action
  - inline-dashboard-actions

affects:
  - 27-05  # Will use this queue in main dashboard page
  - 27-06  # Attention alerts will complement this queue

tech-stack:
  added: []
  patterns:
    - inline-actions-with-optimistic-ui
    - service-type-auto-matching
    - context-aware-empty-states

key-files:
  created:
    - components/dashboard/ready-to-send-queue.tsx
    - lib/actions/dashboard.ts  # Extended with quickEnrollJob
  modified:
    - lib/types/dashboard.ts  # Added QuickEnrollResult type

decisions:
  - id: D27-03-01
    what: Quick enroll uses getActiveCampaignForJob for auto-matching
    why: Reuses existing service-specific vs all-services fallback logic
    alternatives: ["Could implement separate matching logic", "Could require user to select campaign"]
    impact: Consistent campaign matching behavior across all enrollment flows

  - id: D27-03-02
    what: Missing campaign shows toast with action to create
    why: Guides user to fix the issue inline without blocking
    alternatives: ["Could show modal", "Could navigate immediately", "Could just show error"]
    impact: Smooth UX with clear path forward

  - id: D27-03-03
    what: Show only first 5 jobs with "Show all" link
    why: Keeps dashboard focused on most urgent items
    alternatives: ["Could show 10", "Could paginate", "Could show all"]
    impact: Dashboard remains scannable, link provides escape hatch

  - id: D27-03-04
    what: Stale jobs show warning flag with tooltip
    why: Visual urgency indicator without text clutter
    alternatives: ["Could highlight row", "Could show text label", "Could sort to top only"]
    impact: Clear visual hierarchy for urgent items

metrics:
  duration: 3 minutes
  completed: 2026-02-04
---

# Phase 27 Plan 03: Ready-to-Send Queue Summary

Built the primary actionable component for the dashboard: a queue showing completed jobs awaiting campaign enrollment, with inline quick-enroll and urgency indicators.

## What Was Built

### QuickEnrollResult Type
- Exported from `lib/types/dashboard.ts`
- Supports three result states: success/enrolled, success/noMatchingCampaign, error
- Includes campaignName and serviceType for contextual feedback

### Quick Enroll Server Action
- `quickEnrollJob(jobId)` in `lib/actions/dashboard.ts`
- Auto-matches campaign via `getActiveCampaignForJob` (service-specific or all-services fallback)
- Checks for existing active enrollment
- Calculates all touch scheduled times
- Creates enrollment record with all touch fields populated
- Returns structured result for UI feedback
- Revalidates `/dashboard` path

### Ready-to-Send Queue Component
- Client component in `components/dashboard/ready-to-send-queue.tsx`
- Shows first 5 jobs with stale warning flags
- Urgency indicator: Yellow WarningCircle icon with threshold tooltip
- Quick enroll button with loading state via `useTransition`
- Toast feedback:
  - Success: "Enrolled in {campaignName}"
  - Missing campaign: Error toast with "Create Campaign" action button
  - Error: Shows error message
- Overflow menu (DotsThree icon):
  - "Send one-off" → `/send?jobId={id}`
  - "View job" → `/jobs`
- Context-aware empty states:
  - `hasJobHistory=true`: "All caught up" with CheckCircle icon
  - `hasJobHistory=false`: "No jobs yet" with Add Job CTA
- "Show all ({total})" link when more than 5 jobs

### Ready-to-Send Queue Skeleton
- Exported `ReadyToSendQueueSkeleton` component
- 3 skeleton rows matching real job row structure
- Matches border-b pattern and spacing

## Deviations from Plan

None - plan executed exactly as written.

## Key Technical Decisions

### D27-03-01: Quick Enroll Uses getActiveCampaignForJob
Reused existing campaign matching logic from `lib/data/campaign.ts` instead of implementing separate matching. This ensures consistency: service-specific campaigns match first, then falls back to "all services" campaign. Same behavior as job completion enrollment.

### D27-03-02: Missing Campaign Handled with Toast Action
When no matching campaign exists, shows error toast with inline "Create Campaign" action button that navigates to `/campaigns/new?serviceType={type}`. Guides user to fix the issue without blocking the UI. More graceful than showing empty error or navigating immediately.

### D27-03-03: Limit to 5 Jobs with Show All Link
Dashboard shows first 5 jobs only, sorted by staleness then age. "Show all ({total})" link navigates to `/jobs?status=completed&enrolled=false` for full list. Keeps dashboard focused on most urgent items while providing escape hatch.

### D27-03-04: Stale Jobs Use Warning Flag with Tooltip
Stale jobs (exceeding service type timing threshold) show yellow WarningCircle icon with tooltip explaining threshold. Visual urgency without text clutter. Icon placement before customer name draws attention.

## Integration Points

### Server Action Integration
- Imports `getActiveCampaignForJob` from `lib/data/campaign`
- Follows existing enrollment patterns from `lib/actions/enrollment.ts`
- Revalidates `/dashboard` after enrollment

### Component Integration
- Uses Phosphor icons: WarningCircle, DotsThree, CheckCircle, Plus
- Uses sonner toast for feedback
- Uses Radix DropdownMenu for overflow actions
- Uses date-fns `formatDistanceToNow` for relative time
- Card/Badge/Button UI components from design system

### Type Integration
- Imports `ReadyToSendJob` from `lib/types/dashboard`
- Exports `QuickEnrollResult` for other modules to use
- Imports `ServiceType` from `lib/types/database`

## Testing Notes

### Happy Path
1. Job with matching service-specific campaign → enrolls immediately
2. Job with no service-specific campaign but "all services" campaign → enrolls in fallback
3. Job with no matching campaign → shows toast with "Create Campaign" action
4. Multiple jobs → shows first 5 with "Show all" link

### Edge Cases
1. Job already enrolled → shows error toast
2. Campaign has no touch 1 → shows error toast (should never happen)
3. Empty queue with history → shows "All caught up" with CheckCircle
4. Empty queue without history → shows "No jobs yet" with Add Job CTA
5. Stale jobs → show warning icon with threshold tooltip

### Error Handling
- Authentication errors → returns error result
- Business not found → returns error result
- Job not found → returns error result
- Job not completed → returns error result
- Database errors → caught and returned as error result

## Next Phase Readiness

### Phase 27-05: Dashboard Page Integration
Ready. This component exports `ReadyToSendQueue` and `ReadyToSendQueueSkeleton` for use in the main dashboard page. Props interface is simple: `jobs` and `hasJobHistory`.

### Phase 27-06: Attention Alerts Component
Ready. This queue complements attention alerts (next plan). Both will be sections on the dashboard. Banner will link to both sections via scroll anchors.

## Files Modified

### Created
- `components/dashboard/ready-to-send-queue.tsx` (267 lines)
  - ReadyToSendQueue component
  - ReadyToSendQueueSkeleton component
- `lib/actions/dashboard.ts` (extended, +160 lines)
  - quickEnrollJob server action

### Modified
- `lib/types/dashboard.ts` (+8 lines)
  - QuickEnrollResult type export

## Commits

1. **26ced19** - `feat(27-03): add quick-enroll server action`
   - Export QuickEnrollResult type from lib/types/dashboard
   - Implement quickEnrollJob server action
   - Auto-matches campaign by service type (reuses getActiveCampaignForJob)
   - Calculates all touch scheduled times
   - Returns success/error/noMatchingCampaign states
   - Revalidates /dashboard path after enrollment

2. **7fa5a40** - `feat(27-03): create ready-to-send queue component`
   - Client component with ReadyToSendQueue and ReadyToSendQueueSkeleton exports
   - Shows first 5 jobs with stale warning flags
   - Quick enroll button with loading state via useTransition
   - Toast feedback for success/error/missing campaign
   - Overflow menu for send one-off and view job
   - Context-aware empty states (hasJobHistory flag)
   - Show all link when more than 5 jobs
   - Phosphor icons for visual indicators

## Performance Notes

### Client-Side Performance
- useTransition for non-blocking enrollment action
- No re-renders of list during enrollment (isolated button state)
- Skeleton loading state for initial render

### Server-Side Performance
- Single enrollment insert with all touch fields denormalized
- Reuses efficient `getActiveCampaignForJob` query (single query with OR filter)
- No unnecessary queries after successful enrollment

## Accessibility

- Enroll button shows "Enrolling..." text during loading
- Overflow menu has sr-only "More options" label
- Empty states use semantic heading structure
- Warning icons have descriptive tooltips
- Keyboard navigation supported via Radix DropdownMenu

## Known Limitations

1. **No individual job pages yet**: "View job" links to `/jobs` list page (job detail pages in later phase)
2. **No retry logic**: If enrollment fails mid-action, user must retry manually
3. **No undo**: Once enrolled, user must go to campaigns page to stop enrollment
4. **Threshold hardcoded in tooltip**: Could be more dynamic based on business timing settings

## Future Enhancements

1. Add "Enroll all" bulk action for multiple stale jobs
2. Add inline preview of which campaign will be used before enrolling
3. Add "Snooze" action to defer job for X hours
4. Add filtering/sorting options (by service type, staleness, customer)
5. Add individual job detail page and update "View job" link
6. Add undo toast action after successful enrollment
