---
phase: 37-jobs-campaigns-ux-fixes
plan: 03
subsystem: ui
tags: [react, nextjs, sheet, campaign, ux, radix-ui]

# Dependency graph
requires:
  - phase: 37-01
    provides: Campaign form touch-sequence save bug fix (JC-08) — prerequisite for Sheet-based editing to work correctly

provides:
  - Fully clickable campaign cards (JC-05) with stopPropagation on controls
  - Sheet-based campaign edit panel from the list (JC-04)
  - CampaignForm onSuccess callback for context-aware navigation
  - Fixed back button hit areas on campaign detail/edit pages (JC-06)
  - Centered preset grid with deterministic Conservative→Standard→Aggressive order (JC-07)

affects:
  - Phase 38 (onboarding) — campaign onboarding uses PresetPicker which now has deterministic order
  - Phase 39 (manual send) — CampaignList is primary campaigns interaction surface

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sheet-over-list editing: CampaignList owns Sheet state, passes onEdit to cards, renders CampaignForm with onSuccess
    - Context-aware form callback: onSuccess prop determines whether form navigates (full-page) or calls back (sheet/modal)
    - Deterministic preset sort: PRESET_ORDER constant sorts by id match, unknown presets fall to end

key-files:
  created: []
  modified:
    - components/campaigns/campaign-card.tsx
    - components/campaigns/campaign-list.tsx
    - components/campaigns/campaign-form.tsx
    - components/campaigns/preset-picker.tsx
    - app/(dashboard)/campaigns/page.tsx
    - app/(dashboard)/campaigns/[id]/page.tsx
    - app/(dashboard)/campaigns/[id]/edit/page.tsx

key-decisions:
  - "CampaignList is the Sheet host — not CampaignsPage — because it has access to the campaign array needed for editingCampaign lookup"
  - "templates fetched once at CampaignsPage level and passed into CampaignList to avoid duplicate fetches in Sheet"
  - "onSuccess prop on CampaignForm replaces router.push('/campaigns') — full-page edit route still works without onSuccess"
  - "stopPropagation on controls div (not individual elements) — one handler covers Switch, label text, and DropdownMenu"
  - "inline-flex + w-fit for back links — constrains clickable area to text content, prevents full-width accidental clicks"
  - "max-w-3xl mx-auto on preset grid centers 3-column grid without stretching to full container width"

patterns-established:
  - "Sheet-based edit pattern: parent component owns open/close state, form uses onSuccess callback instead of router"
  - "Card full-click navigation: outer div onClick + controls div stopPropagation (not wrapping the whole card in Link)"

# Metrics
duration: 3min
completed: 2026-02-20
---

# Phase 37 Plan 03: Campaign UX Polish Summary

**Campaign cards are now fully clickable nav targets with Sheet-based inline editing, fixed back button hit areas, and a centered deterministic preset grid**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-20T01:05:31Z
- **Completed:** 2026-02-20T01:08:07Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Campaign cards navigate to detail on click; Switch and DropdownMenu are isolated via stopPropagation (JC-05)
- "Edit" from the dropdown opens a right-side Sheet panel with CampaignForm pre-filled — no full-page navigation (JC-04)
- CampaignForm gains `onSuccess` callback; when provided, uses it instead of `router.push('/campaigns')` — enabling sheet close and preserving full-page edit route for deep links
- Back links on `/campaigns/[id]` and `/campaigns/[id]/edit` changed from `flex` to `inline-flex w-fit` — hit area now content-width only (JC-06)
- PresetPicker grid centered with `max-w-3xl mx-auto`; presets sorted Conservative→Standard→Aggressive every time (JC-07)

## Task Commits

1. **Task 1: Campaign card full-click, back button fix, preset centering** - `683dc42` (feat)
2. **Task 2: Campaign edit as side panel with Sheet** - `4097b51` (feat)

## Files Created/Modified

- `components/campaigns/campaign-card.tsx` — outer div has onClick/cursor-pointer; controls div has stopPropagation; Edit item calls onEdit prop or falls back to router; removed Link import
- `components/campaigns/campaign-list.tsx` — client component with editingCampaignId state; Sheet + CampaignForm; passes onEdit to every CampaignCard; accepts templates prop
- `components/campaigns/campaign-form.tsx` — added onSuccess?: () => void; success path calls onSuccess or router.push; Cancel uses onSuccess or router.back
- `components/campaigns/preset-picker.tsx` — grid has max-w-3xl mx-auto; deterministic sort via PRESET_ORDER constant
- `app/(dashboard)/campaigns/page.tsx` — fetches templates in Promise.all; passes to CampaignList
- `app/(dashboard)/campaigns/[id]/page.tsx` — back link: flex → inline-flex w-fit
- `app/(dashboard)/campaigns/[id]/edit/page.tsx` — back link: flex → inline-flex w-fit

## Decisions Made

- CampaignList is the Sheet host (not CampaignsPage) because it has direct access to the campaigns array for `campaigns.find(c => c.id === editingCampaignId)` lookup — no prop drilling needed
- Templates fetched once at CampaignsPage level (server component) and passed down, avoiding duplicate `getAvailableTemplates()` calls inside the Sheet
- Full-page `/campaigns/[id]/edit` route preserved unchanged — it fetches its own templates and works as a standalone deep-link target
- stopPropagation placed on the entire controls `<div>` rather than on each individual element — one handler covers the Switch, its label text, and the DropdownMenuTrigger
- `max-w-3xl` (768px) chosen for preset grid — wide enough for 3 cards with `gap-4` at typical viewport widths while preventing stretch on large screens

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 37 is now complete (3/3 plans done: 37-01, 37-02, 37-03)
- All 9 JC issues resolved: JC-01 through JC-09
- Ready to proceed to Phase 38 (Onboarding) or Phase 33 (Color Audit)

---
*Phase: 37-jobs-campaigns-ux-fixes*
*Completed: 2026-02-20*
