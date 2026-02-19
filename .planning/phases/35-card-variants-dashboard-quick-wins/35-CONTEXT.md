# Phase 35: Card Variants & Dashboard Quick Wins - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Visually cohesive dashboard with amber-accented card CVA variants, personalized welcome greeting, improved InteractiveCard clickability affordance, semantic color token definition + full batch replacement (210 occurrences from Tier 2 audit), consistent spacing across all dashboard pages, analytics empty state improvement, and notification badge removal.

</domain>

<decisions>
## Implementation Decisions

### Card variant styling
- CVA variants use **tinted backgrounds** — soft colored fill with matching border
- Intensity level: **very subtle (50-level)** — barely-there tint, cards still feel mostly white (e.g., amber-50 bg, amber-100 border)
- Text color within variants: Claude's discretion based on readability and WCAG contrast
- `ghost` variant = fully transparent (no bg, no border — just content)
- `subtle` variant = bg-muted with faint border — one step above invisible
- Default card behavior (no variant specified): Claude's discretion on whether existing white cards stay as-is or shift

### KPI card differentiation (REVISED 2026-02-19)
- All cards use **white background** (default variant) — clean, minimal rest state
- Top row (outcome KPIs) differentiated by **per-card colored icons** (filled weight) and **matching hover accents** (border + arrow color):
  - Reviews: amber Star icon, amber hover
  - Average Rating: green (#008236) ChartBar icon, green hover
  - Conversion Rate: blue (#2C879F) Target icon, blue hover
- Bottom row (pipeline KPIs) uses **default card style AND compact size** — white, no icons
- Pipeline card clickability: Claude's discretion based on whether useful navigation destinations exist
- Pipeline card trends: Claude's discretion based on available space in compact layout

### Dashboard greeting
- Greeting line + subtitle: "Good morning, Alex" with a contextual subtitle (e.g., "Here's your overview for today")
- Time-of-day aware (morning/afternoon/evening)
- First name from user session

### InteractiveCard arrow affordance
- Arrow **always visible** (not hover-only) — subtle muted arrow at rest, more prominent on hover
- Position: **bottom-right corner** of the card
- Replaces the current translate-y lift effect

### Semantic token scope
- Phase 35 handles the **full 210-occurrence replacement** across all 51 files — one big sweep
- 9 new CSS tokens: warning (bg, default, border, foreground), success (bg, default, border, foreground), info (bg, default, border, foreground), error-text
- Form validation error text (--error-text vs --destructive): Claude's discretion based on WCAG contrast testing after Phase 34 warm palette
- AI personalization sparkle icon uses **--warning (amber)** — no dedicated --ai-accent token
- Data-viz chart dots, star ratings (yellow), and marketing/decorative colors **stay inline** — intentional visual choices, not theme tokens

### Claude's Discretion
- Card variant text color tinting (readability-based decision)
- Default card behavior for unspecified variants (stay white or shift to subtle)
- Pipeline KPI card clickability (depends on useful destinations)
- Pipeline KPI trend indicators in compact layout (space-dependent)
- --error-text vs --destructive for form validation (WCAG contrast-dependent)

</decisions>

<specifics>
## Specific Ideas

- KPI differentiation should feel like "maximum visual hierarchy" — the outcome row is clearly the hero, pipeline row is supporting context
- Card tinting should be whisper-quiet — you notice it but cards still feel mostly neutral
- Arrow affordance should work on mobile where there's no hover — always visible solves this
- The Tier 2 audit document (`.planning/phases/33-hardcoded-color-audit/TIER2-COLOR-AUDIT.md`) contains the full file inventory, atomic replacement units, and execution order recommendation for the 210-occurrence batch replacement

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 35-card-variants-dashboard-quick-wins*
*Context gathered: 2026-02-18*
