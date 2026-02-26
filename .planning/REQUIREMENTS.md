# Requirements: v2.5.3 UX Bugs & UI Fixes Part 2

**Milestone:** v2.5.3 — UX Bugs & UI Fixes Part 2
**Created:** 2026-02-25
**Status:** Roadmap Complete

---

## Getting Started / Onboarding

- [ ] **GS-01**: Getting Started step 2 ("Review your campaign") marks complete only when user visits a campaign detail page — not when a campaign exists
- [ ] **GS-02**: Getting Started step 2 handles edge case where onboarding campaign is deleted — any campaign detail visit counts

- [ ] **ONB-01**: Campaign preset picker uses vertical stack layout with Standard preset in the middle position
- [ ] **ONB-02**: Campaign preset picker uses plain-English descriptions without jargon (no "multi-touch sequence", "touch #1/2/3")
- [ ] **ONB-03**: Campaign preset picker subtitle says "You can change this later in Campaigns" (not "in Settings")

## Custom Services

- [ ] **SVC-01**: Custom service name pills in onboarding and settings render at readable size (not clipped/tiny)
- [ ] **SVC-02**: Custom service names propagate to Add Job service type dropdown
- [ ] **SVC-03**: Custom service names propagate to all other service selectors (job filters, campaign service targeting, etc.)

## Dashboard

- [ ] **DASH-01**: Needs Attention X dismiss button actually removes the item from the dashboard list
- [ ] **DASH-02**: KPI stat cards all navigate to /analytics (unified destination, not split between history/analytics)

## Add Job

- [ ] **JOB-01**: Campaign dropdown in Add Job drawer includes "Create new campaign" option that navigates to campaigns page (create campaign modal)

## Page Subtitles

- [ ] **SUB-01**: All app pages use consistent subtitle pattern: static description + dynamic count (e.g., "Track your service jobs · 12 this month")

## Visual Polish

- [ ] **VIS-01**: Jobs table rows have white background
- [ ] **VIS-02**: Activity/history page rows have white background
- [ ] **VIS-03**: QuickSendModal UI redesigned to match current design style (layout, spacing, visual refresh)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| v2.5.2 scope (drawers, campaign freeze, sparklines, soft button variant) | Separate milestone, Phases 45-47 |
| v2.6 Dashboard Command Center | Paused, resume after patch series |
| Getting Started step logic for steps other than step 2 | Only step 2 is broken |
| Full campaign preset redesign | Only the picker UI during onboarding |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| GS-01 | Phase 48 | Pending |
| GS-02 | Phase 48 | Pending |
| ONB-01 | Phase 48 | Pending |
| ONB-02 | Phase 48 | Pending |
| ONB-03 | Phase 48 | Pending |
| SVC-01 | Phase 49 | Pending |
| SVC-02 | Phase 49 | Pending |
| SVC-03 | Phase 49 | Pending |
| DASH-01 | Phase 48 | Pending |
| DASH-02 | Phase 48 | Pending |
| JOB-01 | Phase 48 | Pending |
| SUB-01 | Phase 49 | Pending |
| VIS-01 | Phase 49 | Pending |
| VIS-02 | Phase 49 | Pending |
| VIS-03 | Phase 49 | Pending |

**Coverage:**
- v2.5.3 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 after roadmap creation (all 15 requirements mapped to Phases 48-49)*
