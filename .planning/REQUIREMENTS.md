# Requirements: v2.5.2 UX Bugs & UI Fixes

**Milestone:** v2.5.2 — UX Bugs & UI Fixes
**Created:** 2026-02-25
**Status:** Scoped

---

## Drawers

- [ ] **DRW-01**: All drawers use white background content sections to group related content (no borders/dividers) — matching request details drawer pattern
- [ ] **DRW-02**: All drawer action buttons are sticky/fixed at the bottom, always visible during scroll
- [ ] **DRW-03**: Job detail drawer buttons are consistent with other drawer button patterns
- [ ] **DRW-04**: Add Job drawer width matches other drawers (not skinny)
- [ ] **DRW-05**: Add Job form uses Radix Select components instead of native HTML selects

## Dashboard Right Panel

- [ ] **DRKP-01**: KPI cards have light gray background with mini sparkline graphs showing trend data
- [ ] **DRKP-02**: KPI sparklines have appropriate empty state when no historical data exists
- [ ] **DRKP-03**: Recent Activity items have distinct colored circle icons per event type with increased spacing
- [ ] **DRKP-04**: Pipeline counter row retains compact layout below KPI cards

## Dashboard Queue

- [ ] **DQ-01**: Ready to Send and Needs Attention rows have white background with border-radius (not floating)
- [ ] **DQ-02**: Ready to Send empty state uses solid border (not dashed) with white background
- [ ] **DQ-03**: Needs Attention empty state matches Ready to Send empty state treatment (solid border, white background)
- [ ] **DQ-04**: Ready to Send empty state "Add Jobs" button opens Add Job drawer instead of navigating to /jobs

## Campaign Fixes

- [ ] **CAMP-01**: Campaign pause/re-enable bug fixed — completed jobs no longer stuck as "stopped" after campaign is re-enabled
- [ ] **CAMP-02**: Pausing a campaign freezes all in-progress enrollments in place (new `frozen` status); resuming picks up from the same touch position
- [ ] **CAMP-03**: Cron processor correctly skips frozen enrollments and resumes them when campaign is re-activated
- [ ] **CAMP-04**: Touch sequence section on campaign detail page shows preview of email/SMS template content for each touch (including default templates)

## Campaign UI Polish

- [ ] **CUI-01**: Campaign page receives visual retouch consistent with overall app design

## Button Hierarchy

- [ ] **BTN-01**: New `soft` button variant added to CVA (muted background, doesn't compete with primary)
- [ ] **BTN-02**: Dashboard buttons audited and secondary actions switched to soft variant to reduce visual noise

## Navigation

- [ ] **NAV-01**: "Activity" renamed to "History" in sidebar and bottom nav

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full dashboard command center (v2.6) | Paused milestone, resume after v2.5.2 |
| Virtual scrolling for large lists | Low priority, no performance complaints |
| Full Phosphor icon migration (remaining lucide) | Tracked separately |
| Onboarding step changes | Already addressed in v2.5.1 |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DRW-01 | TBD | Pending |
| DRW-02 | TBD | Pending |
| DRW-03 | TBD | Pending |
| DRW-04 | TBD | Pending |
| DRW-05 | TBD | Pending |
| DRKP-01 | TBD | Pending |
| DRKP-02 | TBD | Pending |
| DRKP-03 | TBD | Pending |
| DRKP-04 | TBD | Pending |
| DQ-01 | TBD | Pending |
| DQ-02 | TBD | Pending |
| DQ-03 | TBD | Pending |
| DQ-04 | TBD | Pending |
| CAMP-01 | TBD | Pending |
| CAMP-02 | TBD | Pending |
| CAMP-03 | TBD | Pending |
| CAMP-04 | TBD | Pending |
| CUI-01 | TBD | Pending |
| BTN-01 | TBD | Pending |
| BTN-02 | TBD | Pending |
| NAV-01 | TBD | Pending |

**Coverage:**
- v2.5.2 requirements: 21 total
- Mapped to phases: 0
- Unmapped: 21

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 after initial definition*
