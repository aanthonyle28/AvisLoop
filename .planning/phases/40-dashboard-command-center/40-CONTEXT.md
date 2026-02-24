# Phase 40: Dashboard Command Center - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Dashboard redesigned as a two-column command center. Left column has actionable task lists (Ready to Send, Needs Attention). Right panel shows contextual details that dynamically swap between KPI performance view, job details, attention item details, and getting-started guidance. Mobile uses bottom sheets instead of the right panel. Getting Started pill and drawer consolidated into the right panel. NotificationBell removed — dashboard nav badge replaces it.

</domain>

<decisions>
## Implementation Decisions

### Right panel behavior
- Content transitions use **slide from right** animation when opening a detail view
- Closing a detail view (X button) uses **reverse slide** (slides back left) to return to default KPI state
- Panel separated from left column by a **thin left border line** (border-border), not a shadow
- **Immediate swap** when clicking a different list item while a detail is open — no need to close first, current detail slides out and new one slides in
- Panel is ~360px fixed width on desktop (lg+ breakpoint)

### List item design & density
- Both Ready to Send and Needs Attention use **compact rows** (not cards)
- Ready to Send rows show: **customer name, service type badge, relative time since completion, matching campaign name** — all four visible at a glance
- Needs Attention rows use the **same compact row style** but with a colored left border to indicate severity (red for failed delivery, amber for low rating)
- Clicking a row opens the corresponding detail in the right panel

### Header & greeting bar
- Greeting is **time-of-day only**: "Good morning/afternoon/evening, [First Name]" — no situational adaptation
- Dynamic subtitle in **muted text under greeting**: "X jobs ready to send · Y items need attention"
- When all caught up (0 pending items), subtitle swaps to **summary stats**: "Sent X messages today · Y reviews received" — keeps the subtitle useful
- Action buttons right-aligned: **"+ Add Job" as primary filled, "View Campaigns" as outline** — clear hierarchy with Add Job as main action

### Mobile experience
- Right panel content renders as a **bottom sheet** triggered by tapping list items
- Bottom sheet initial height: Claude's discretion (based on content volume)
- Dismissal via **swipe down + X button** — both gestures supported
- **No drag handle** — cleaner look, relies on X button and swipe discoverability
- KPIs displayed as a **compact summary bar** at top ("4 reviews · 4.8 avg · 32% conv"), tappable to open full KPI view in bottom sheet — task lists immediately visible without scrolling past KPI cards

### Design system compliance
- All new components must use the existing warm design system: cream/amber/soft blue palette, semantic tokens (warning, success, info, error), card CVA variants
- No hardcoded hex values, color scales, or one-off styles — extend the design system if gaps are found
- Reuse existing patterns: InteractiveCard, StatusDot, Badge, Skeleton loaders
- Dark mode must work correctly with all new components

### Claude's Discretion
- Left column scroll behavior (independent scrolling per list vs single column scroll)
- Exact animation timing and easing curves for panel transitions
- Bottom sheet initial snap point height
- Right panel internal layout and spacing details
- How the Getting Started card transitions from full to compact state
- Loading skeleton designs for panel content

</decisions>

<specifics>
## Specific Ideas

- The right panel should feel like a contextual inspector (think Figma's right panel or Linear's detail panel) — always present, always relevant to what you're looking at
- Mobile KPI summary bar keeps task lists front and center — aligns with V2 philosophy that the dashboard is about taking action (completing jobs), not passive metric viewing
- Compact rows for lists keep the left column dense and scannable — the detail is in the right panel, not inline

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 40-dashboard-command-center*
*Context gathered: 2026-02-23*
