# Phase 3: Contact Management - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can add, organize, and manage customer contacts for sending review requests. Includes adding/editing contacts, CSV import, search/filter, and bulk operations. Sending review requests is Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Contact list display
- Table rows layout (not cards)
- Columns: Name, Email, Status, Added date, Last sent
- Default sort: Last activity (most recently sent to at top)
- Infinite scroll for large lists

### Bulk selection & actions
- Available actions: Archive, Delete, Add tag
- Selection mechanism: Claude's discretion

### Add contact experience
- Modal dialog for adding new contacts
- Required fields: Name, Email
- Optional field: Phone (for future SMS)

### Edit contact experience
- Slide-out panel from right side
- Panel shows editable fields + activity summary (last sent, send count, status history)

### CSV import flow
- Drag-and-drop upload zone
- Auto-map common column names (email, Email, EMAIL all map automatically), skip unknown columns
- Preview all rows before import — user can fix errors inline
- Smart duplicate detection: show potential duplicates, let user decide to merge

### Search & filtering
- Search bar: full width, top of contact list
- Filter UI: chips below search bar
- Available filters: Status (Active/Archived), Tags, Date range
- Clear/reset: standard chip dismiss

### Empty states
- Helpful prompts when no contacts exist (Claude's discretion on copy/design)

### Claude's Discretion
- Bulk selection mechanism (checkbox vs click-to-select)
- Empty state illustrations and copy
- Exact infinite scroll implementation
- Merge contacts UI details
- Filter chip interactions

</decisions>

<specifics>
## Specific Ideas

- "Recently added" should be easily accessible as a sort option
- Multi-filter chips — can have multiple active filters at once
- Merge contacts UI only if ROI is great (don't over-engineer)

</specifics>

<deferred>
## Deferred Ideas

- Sending review requests from contact list — Phase 4
- Full message history in contact panel — keep activity summary for now, full history can be added later
- SMS capability — phone field captured now, SMS sending is future scope

</deferred>

---

*Phase: 03-contact-management*
*Context gathered: 2026-01-26*
