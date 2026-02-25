# Phase 41: Activity Page Overhaul - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the Activity (history) page to match design standards: upgrade status filter to styled Radix Select, add date preset chips, correct resend behavior to only target failed/bounced rows, use consistent page header pattern, and ensure bulk select only applies to resendable statuses.

</domain>

<decisions>
## Implementation Decisions

### Status filter styling
- Keep as a dropdown (NOT chip pills) — 7 statuses is too many for chips
- Upgrade from native HTML `<select>` to styled Radix Select component for consistency with rest of app
- Plain text labels only — no colored dots or mini badges in the dropdown options
- Same status options as current: pending, sent, delivered, bounced, complained, failed, opened

### Date preset behavior
- Four preset options: Today, Past Week, Past Month, Past 3 Months
- Presets styled as rounded-full chip pills (matching Jobs page chip pattern: `bg-primary text-primary-foreground` when active, `bg-muted text-muted-foreground` when inactive)
- Selecting a preset auto-fills the From/To date range inputs
- Manually editing a date input auto-deselects the active preset chip (mutually exclusive)
- Clicking an already-active preset chip toggles it off and clears the date range (consistent with Jobs chip toggle behavior)
- Toggle off = clears date filter entirely

### Resend button placement
- Resend button (icon + "Retry" text label) always visible inline on failed/bounced rows — no hover-to-reveal opacity transition
- Clicking Retry immediately resends — no confirmation dialog (low-stakes action)
- Rows with delivered/sent/opened/pending status do NOT get a Retry button
- Bulk select header checkbox only selects rows with resendable statuses
- Bulk resend bar position: Claude's discretion

### Page header layout
- Page title: "Send History" (changed from "Activity" — more descriptive of page content)
- Subtitle: both static description AND dynamic count — e.g., "Track delivery status of your sent messages · 152 total"
- No right-side action button (page is read-only audit trail)
- Filter area below header in two rows:
  - Row 1: Search input + Status dropdown (Radix Select)
  - Row 2: Date preset chips + custom date inputs (From/To)

### Claude's Discretion
- Bulk resend bar position (inline above table vs sticky)
- Whether `complained` status should be resendable (email deliverability best practices)
- Date preset chip layout relative to custom date inputs (inline vs above)
- Whether to include a right-side header action (e.g., Export CSV) — leaning toward none

</decisions>

<specifics>
## Specific Ideas

- Match Jobs page chip styling exactly for date presets: `rounded-full`, `px-3 py-1`, `text-sm font-medium`, `transition-colors`
- Subtitle pattern: "Track delivery status of your sent messages · {count} total" with the count portion dynamic
- Retry button should be clearly visible without hover — remove the `opacity-0 group-hover:opacity-100` pattern from the actions column for resendable rows

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 41-activity-page-overhaul*
*Context gathered: 2026-02-24*
