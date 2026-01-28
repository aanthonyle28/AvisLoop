# Phase 9: Polish & UX - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

App has consistent, polished visual design across all screens. This phase delivers visual consistency, state handling, responsive design, and smooth interactions. No new features — only polish of existing functionality.

**Reference Design:** Clean modern SaaS dashboard (Dribbble reference provided) — light gray background, white cards, blue accent, generous whitespace, rounded corners, clear hierarchy.

</domain>

<decisions>
## Implementation Decisions

### Visual Identity
- **Color palette:** Light gray background (#F5F5F7), white card surfaces, blue primary accent for actions/links
- **Typography:** Medium weights throughout (semi-bold headings, medium body) — softer hierarchy than bold contrast
- **Corner radius:** Medium (8-12px) for cards, buttons, inputs — modern SaaS feel
- **Shadows:** Subtle card shadows, clean separation between surfaces
- **Sidebar:** Collapsible sidebar (can minimize to icons only)

### State Presentation
- **Loading states:** Combination approach — skeleton screens for initial page loads, spinners for action feedback
- **Empty states:** Icon + text + CTA format (simple icon, brief helpful message, action button)
- **Error handling:** Combination by severity — inline red text for form errors, toast notifications for action failures, alert banners for critical system issues
- **Success feedback:** Combination — toast notifications for quick actions (save contact), page transitions for major actions (after onboarding complete)

### Motion & Interaction
- **Animation level:** Subtle — gentle fades, smooth hover states, micro-feedback without being distracting
- **Hover effects:** Claude's discretion to match reference (likely color change + subtle lift)
- **Dialog/sheet transitions:** Slide + fade — dialogs scale up and fade in, sheets slide from edge
- **Button press:** Both scale down + color change for clear tactile feedback

### Responsive Behavior
- **Mobile navigation:** Bottom navigation bar (app-like fixed bar at bottom)
- **Bottom nav items:** Core 4 — Dashboard, Contacts, Send, History (Settings accessible via avatar/profile)
- **Mobile tables:** Card layout — each table row becomes a stacked card on mobile
- **Breakpoints:** Claude's discretion for standard responsive breakpoints (likely ~768px for sidebar collapse)

### User Flow
- **Post-send behavior:** Stay on send page with toast confirmation (ready to send another)
- **Dashboard layout:** Balanced — quick actions at top, status/usage cards below
- **Settings access:** Both — avatar dropdown for quick access, dedicated full settings page available
- **Sidebar state:** Smart default (expanded on large screens, collapsed on medium, hidden on mobile) AND persist user preference in localStorage

### Claude's Discretion
- Exact color hex values (following reference aesthetic)
- Specific shadow values and spacing scale
- Animation timing and easing curves
- Icon selection for empty states
- Skeleton screen exact shapes
- Toast positioning and duration

</decisions>

<specifics>
## Specific Ideas

- Reference design: Clean SaaS dashboard with light gray background, white cards, blue accent, generous whitespace
- Cards should have clear section headers like the reference (e.g., "Priority Project", "Resources", "Participants")
- Sidebar should have grouped sections (Main, Teams, etc.) with visual hierarchy
- User avatar with verification badge in sidebar footer
- Donut charts for percentage displays (like usage/limits)
- "See all" links for card sections that have more content

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

**Implementation Notes:**
- Use `/web-design-guidelines` skill for design system decisions during planning
- Use `/senior-frontend` skill for component implementation during execution
- Match shadcn/ui patterns while customizing to reference aesthetic

---

*Phase: 09-polish-ux*
*Context gathered: 2026-01-27*
