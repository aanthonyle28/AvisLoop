# Phase 47: Dashboard Right Panel + Campaign Polish + Radix Select - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Dashboard right panel KPI cards get sparkline trend graphs with colored activity feed icons, campaign touch sequence editor gets template preview modals, campaign detail page gets a visual refresh, and Add/Edit Job forms migrate to Radix Select components. No new features or capabilities — this is visual/UX polish on existing pages.

</domain>

<decisions>
## Implementation Decisions

### Sparkline visuals
- Chart type: Claude's discretion (area, line, or bar — pick best fit for the data types and card layout)
- Color treatment: Theme-colored — each sparkline matches its KPI card's accent color (green for reviews, blue for conversion, etc.)
- Data window: 14 days of daily data points
- Empty state (<2 data points): Flat dashed line at zero with subtle "Not enough data" text below
- KPI cards get a light gray background to differentiate from surrounding content

### Activity feed styling
- Circle icon style: Claude's discretion (solid fills vs tinted backgrounds — pick what fits the warm design system)
- Colors per event type: Green for reviews, blue for sends, orange for feedback (per requirements)
- Item count: Show 5 recent activity items before "View All" link
- Item content: Customer name + event description + timestamp (e.g., "Patricia Johnson — Email sent")
- Clickability: Each item is clickable — navigates to relevant detail (send event → history entry, feedback → feedback page, etc.)
- "View All" links to /history
- Increased vertical spacing between items (per requirements)

### Touch template previews
- Interaction: "Preview" button on each touch opens a modal (not inline accordion, not tooltip)
- Content: Raw template text with {placeholders} visible (not rendered with sample data)
- Channel differentiation: Yes — email preview shows subject line + body in email-like frame; SMS preview shows body in chat bubble style with character count
- System templates: Preview button works for system default templates too — fetches and displays the actual system template content

### Campaign detail retouch
- Layout: Keep single-column (stacked sections) — just visual refresh, no structural change
- Goal: Bring page up to current warm design system standards (it looks dated compared to recently polished pages)
- Enrollment rows: Richer information per row — customer name, current touch number, status badge, and last activity timestamp
- Stats section: Restyle numbers with consistent card styling, better typography, and proper spacing (no mini charts)

### Radix Select migration
- Add Job and Edit Job forms migrate from native HTML selects to Radix Select components
- Use `onValueChange` (not `onChange`) per Radix API
- Full form submit must be verified end-to-end in Supabase after migration

### Claude's Discretion
- Sparkline chart type (area vs line vs bar)
- Activity feed icon circle style (solid vs tinted)
- Pipeline counter row styling (retains compact horizontal layout per requirements)
- Exact sparkline library/implementation approach
- Campaign detail page section spacing, card usage, and typography adjustments

</decisions>

<specifics>
## Specific Ideas

- Touch template preview opens as a modal, not an inline accordion — user explicitly chose modal over collapsible
- Sparkline empty state should look intentional (dashed line), not broken (blank space)
- Activity items should feel informative — showing customer name gives the feed real value vs anonymous event logs

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 47-dashboard-right-panel-campaign-polish*
*Context gathered: 2026-02-26*
