# Phase 15: Design System & Dashboard Redesign - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the design system tokens and dashboard page to match the provided Figma reference design exactly. The dashboard is the primary target; propagation to other app pages is a follow-up phase. This phase delivers: updated design tokens (colors, typography, spacing, shadows), updated component styles, and a fully redesigned dashboard page with real data.

Reference: `C:\Users\aanth\Downloads\AvisLoop Dashboard.png`
Figma: `https://www.figma.com/design/IkwnYfZavbZVo1DRdwiyZG/Untitled`

</domain>

<decisions>
## Implementation Decisions

### Visual Language — Colors
- Primary color: #1B44BF (replaces current primary app-wide)
- Background: light gray #F9F9F9 for main content area
- Cards: white (#FFFFFF) background, #E3E3E3 border, 8px border-radius — uniform across all cards/containers
- Sidebar: white background, 1px #E2E2E2 right border, #F2F2F2 background for active nav item, blue icon for active
- Shadows: **none** — border-only design, no box-shadows anywhere
- Theme: light mode default, preserve dark mode toggle for users who prefer it
- Semantic status palette (updated to match Figma badges):
  - Pending: gray (neutral bg, gray text)
  - Delivered/Sent: blue (light blue bg, blue text)
  - Clicked: yellow (light yellow bg, yellow text)
  - Failed: red (light red bg, red text)
  - Reviewed: green (light green bg, green text)

### Visual Language — Typography
- Font family: **Kumbh Sans** (Regular 400, Medium 500, Semibold 600 only)
- Hosted via `next/font/google`
- No other font families

### Visual Language — Spacing & Icons
- Spacing scale: 4px base grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- Icons: **Switch from Lucide to Phosphor icons** (outline style)

### Dashboard Layout
- Exact section order from reference:
  1. Welcome header ("Welcome, [Name]!" + subtitle)
  2. 3 stat cards row (Monthly Usage, Needs Attention, Review Rate)
  3. Quick Send + When to Send (side by side)
  4. Recent Activity table
- No reordering — match the reference layout exactly

### Dashboard — Stat Cards (Real Data)
- **Monthly Usage:** send count / tier limit, blue progress bar, "X remaining this month"
- **Needs Attention:** count of pending + failed items, with colored badges
- **Review Rate:** percentage, trend indicator ("+X% from last month"), star rating average

### Dashboard — Quick Send (Fully Functional Inline)
- Contact search input with recently added contact chips
- Message Template: **dropdown of saved template names** (select, not edit inline)
- Template editing stays in Settings page for now
- "When to Send" panel:
  - Preset options: Immediately, In 1 hour, In the morning (9AM), In 24 hours, Different date
  - "Different date" triggers a date/time picker
  - Selected schedule shows confirmation badge
  - Only "Immediately" is functional; other presets are UI-only until Phases 12-14 complete
  - UX pattern (chips vs dropdown): Claude's discretion
- Blue "Send Request" button triggers actual send

### Dashboard — Recent Activity
- 5 most recent rows from send_logs, real data
- Columns: Contact (avatar initials + name + email), Subject, Status, Date
- Status badges: colored dot + text label matching semantic palette
- "View All" links to `/history`

### Component Style — Buttons
- Primary: solid #1B44BF, white text, rounded corners
- Secondary/ghost buttons get distinct treatment (Claude designs variants)

### Component Style — Status Badges
- Pill-shaped badges with icon + text label, color-coded background/text (no border)
- Colors extracted from Figma SVG (`Group 735.svg`):
  - Pending: bg `#F3F4F6`, text `#101828`, ClockCountdown icon
  - Delivered/Sent: bg `#EAF3F6`, text `#2C879F`, CheckCircle icon
  - Clicked: bg `#FEF9C2`, text `#894B00`, Sparkle icon
  - Failed: bg `#FFE2E2`, text `#C10007`, XCircle icon
  - Reviewed: bg `#DCFCE7`, text `#008236`, Star icon
- CSS variables: `--status-{status}-bg` and `--status-{status}-text` for each status
- Tailwind classes: `bg-status-{status}-bg text-status-{status}-text`

### Component Style — Tables
- Clean rows with **subtle bottom borders** between rows (not borderless, not zebra-striped)

### Component Style — Progress Bars
- Blue fill on light gray (#F3F4F6) track, fully rounded ends — consistent everywhere

### Component Style — Sidebar Nav
- Icon + text label per item
- Active: rounded gray (#F2F2F2) background, blue icon
- Inactive: dark text, outline icon
- Hover effects: Claude's discretion

### Component Style — Loading & Empty States
- Skeleton shapes updated to match new card sizes, progress bar widths, table row heights
- Empty states: friendly prompts with CTAs ("No sends yet — send your first review request!")

### Claude's Discretion
- Avatar initials color assignment method (hash-based, sequential, etc.)
- Welcome header name source (user profile first name vs business name)
- Mobile responsive layout (standard stacking patterns)
- Search input icon styling details
- Contact chip/tag design details
- Nav item hover/transition effects
- Scheduling preset UX pattern (chip toggles vs dropdown)
- Exact semantic color hex values

</decisions>

<specifics>
## Specific Ideas

- Reference design at `C:\Users\aanth\Downloads\AvisLoop Dashboard.png` is the pixel-perfect target
- Figma file: `https://www.figma.com/design/IkwnYfZavbZVo1DRdwiyZG/Untitled`
- The Figma MCP remote server can be added via: `claude mcp add --transport http figma https://mcp.figma.com/mcp` — use to pull exact values once connected
- Kumbh Sans font — only Regular, Medium, Semibold weights
- The "When to Send" scheduling panel should show the scheduled date/time after selection (e.g., green badge "In the morning (9AM)")
- Message template is a selector (dropdown of template names), not an inline editor

</specifics>

<deferred>
## Deferred Ideas

- Propagate design system to all other app pages (contacts, send, history, billing, settings) — follow-up phase
- Move template editing from Settings into the Send page — future enhancement
- Full scheduling functionality (Immediately, presets, custom date) — Phases 12-14
- Figma MCP integration for pulling exact design tokens — set up separately

</deferred>

---

*Phase: 15-design-system-dashboard-redesign*
*Context gathered: 2026-01-29*
