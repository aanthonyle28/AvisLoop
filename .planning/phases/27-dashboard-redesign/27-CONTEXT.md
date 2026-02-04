# Phase 27: Dashboard Redesign - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the dashboard into a command center displaying pipeline KPIs, ready-to-send queue, attention alerts, and action summary banner. Navigation restructured with badge counts. Analytics page shows response rate and review rate by service type.

</domain>

<decisions>
## Implementation Decisions

### KPI Widgets
- Two-tier hierarchy: outcome metrics (big) on top, pipeline metrics (smaller) below
- **Top row (outcome):** Reviews this month, Average rating, Conversion rate
- **Secondary row (pipeline):** Requests sent this week, Active sequences, Pending/queued
- Numbers with trend arrows (up/down + percentage change)
- Trend periods are context-dependent: weekly comparison for activity metrics (sends, opens, clicks), monthly comparison for outcome metrics (reviews, rating)
- Trend labels must be clear: "vs last week" or "vs last month"
- KPIs are clickable — navigate to relevant detail page filtered appropriately

### Ready-to-Send Queue
- Jobs only — completed jobs not yet enrolled in a campaign
- Shows: customer name, service type, completion time
- Primary action: Quick enroll button (auto-matches campaign by service type)
- Secondary actions in overflow menu (triple-dot): Send one-off, View job
- Smart enroll: if no matching campaign exists, prompt "No sequence for [type] — enroll in default or create one?"
- Show 5 items, expandable with "Show all (X)" link
- Bulk "Enroll All" in overflow menu (secondary, not primary)
- Context-aware empty state: "All caught up" for users with job history, "No jobs yet — add a completed job" with CTA for new users
- Service-type-aware urgency: subtle warning flag when job exceeds optimal request window for its service type (e.g., cleaning > 24h stale, HVAC install at 48h is fine)

### Attention Alerts
- Alert types: delivery issues (failed sends, bounces) AND unresolved negative feedback
- Budget/billing warnings NOT included
- Single severity-sorted list (most critical first)
- Show 3 most critical, expandable "View all (X)"
- Persist until resolved, with intentional close-out for dead ends:
  - Retriable failure: persists, clears on retry success → shows [Retry] inline
  - Bad contact info: persists → shows [Update contact] link
  - Permanent/STOP: acknowledge once → shows [Acknowledge] button
  - Negative feedback: persists until responded or marked "Won't respond"
- No snooze — alerts need decisions, not delays
- Dismissing requires deliberate choice (overflow menu), not casual X button
- Badge count on Dashboard nav item in sidebar (red badge with number)

### Action Summary Banner (replaces Daily To-Do)
- No separate to-do list — queue and alerts ARE the actionable items
- Hero banner at top of dashboard provides instant answer:
  - All clear: "All caught up — nothing needs your attention"
  - Items pending: "3 items need attention: 2 ready to send, 1 alert"
- Clicking summary banner scrolls/jumps to relevant section
- Banner is the dashboard hero element — calming when clear, actionable when not

### Dashboard Layout (top to bottom)
1. Action summary banner
2. KPI widgets (outcome row + pipeline row)
3. Ready-to-send queue
4. Attention alerts

### Quick Actions
- No quick action buttons on dashboard — actions live inline with data (queue has Enroll, alerts have Fix/Respond)
- "Add Job" becomes a persistent global action in sidebar or header — accessible from any page, not dashboard-specific

### Navigation Changes
- Dashboard badge shows attention item count
- Sidebar gets persistent "Add Job" button/action
- Navigation items per roadmap: Send/Queue, Customers, Jobs, Campaigns, Activity/History

### Build Approach
- Build on new route first, swap to /dashboard when ready
- Follow existing design system: CSS variables, dark mode, Phosphor icons, Kumbh Sans, existing component patterns
- Use senior-frontend, web-design-guidelines, and ui-ux-pro-max skills during planning/execution for design quality

### Claude's Discretion
- Exact component breakdown and file structure
- Animation/transition details
- Responsive breakpoints and mobile layout adaptation
- Exact KPI query implementation
- Skeleton/loading states for each section
- Sparkline vs simple trend arrow implementation detail
- Analytics page layout and chart types for service type breakdowns

</decisions>

<specifics>
## Specific Ideas

- Queue should feel like a focused work list: "Sarah Chen - AC Repair - Completed yesterday [Enroll] [...]"
- Alerts should show contextual actions per failure type, not generic retry
- Empty queue for active users should feel like positive reinforcement ("All caught up")
- Banner should be the first thing users register — "Do I need to do anything?" answered instantly
- Warning flags on stale jobs use service type timing from business settings (cleaning 24h, HVAC 48h, roofing 72h)
- "Set it and forget it" philosophy — dashboard shows automation is working, manual intervention is the exception

</specifics>

<deferred>
## Deferred Ideas

- "Reviews to respond to" section for new Google reviews awaiting owner response — potential future feature (requires Google Business Profile API integration, Phase 29+)
- Manual to-do/task management — out of scope, AvisLoop is not a task manager
- Budget/billing alerts on dashboard — could be added in billing phase
- FSM integration auto-importing jobs — v2.1 Integrations milestone

</deferred>

---

*Phase: 27-dashboard-redesign*
*Context gathered: 2026-02-04*
