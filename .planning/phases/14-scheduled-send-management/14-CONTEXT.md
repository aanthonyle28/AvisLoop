# Phase 14: Scheduled Send Management - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view, cancel, and reschedule their pending scheduled sends. Extends the existing /scheduled page from Phase 13 with richer detail, expandable rows, bulk actions, and completed send results. No new scheduling capabilities — management of existing scheduled sends only.

</domain>

<decisions>
## Implementation Decisions

### List view & detail level
- Completed sends show inline summary counts (e.g., "3 sent / 1 skipped / 1 failed") directly in the list row
- Clicking a row expands to show per-contact breakdown with individual results and reasons
- Expanded detail view also includes email subject and body preview for the message that was/will be sent
- Two tabs: "Pending" and "Past" — consistent with the Phase 13 pattern
- Column selection: Claude's discretion based on available data

### Bulk reschedule flow
- Row checkboxes for individual selection + shift-click for range selection + "Select all" at top
- All selected sends receive the same new date/time (no relative shifting)
- Reuse the existing ScheduleSelector component (presets: 1 hour, next morning, 24 hours + custom date/time)
- Confirmation dialog before applying: "Reschedule N sends to [date/time]?" with Confirm/Cancel

### Bulk cancel
- Same multi-select UI supports both bulk reschedule and bulk cancel
- Confirmation dialog before bulk cancel (styled dialog, not native confirm())

### Bulk action UI
- Floating action bar at bottom of screen when sends are selected (Gmail-style)
- Shows selection count and available actions: "N selected — Reschedule | Cancel"

### Status lifecycle display
- Follow Phase 15 semantic status palette for all status badges/chips
- Use Phase 15 design system color tokens and chip component patterns

### Relationship to existing /scheduled page
- Extend the existing /scheduled page in place — enhance with tabs, expandable rows, bulk actions
- Upgrade cancel confirmation from native confirm() to styled dialog matching Phase 15 design system

### Claude's Discretion
- Exact columns shown in list view
- Expandable row layout and spacing
- Floating bar positioning and animation
- Mobile responsive adaptations
- Empty state messaging for each tab

</decisions>

<specifics>
## Specific Ideas

- Floating action bar at bottom like Gmail's bulk action pattern
- Shift-click range selection like email clients
- Reuse ScheduleSelector component from send form for reschedule time picking

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-scheduled-send-management*
*Context gathered: 2026-01-29*
