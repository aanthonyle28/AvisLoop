# Requirements: v2.6 Dashboard Command Center

**Milestone:** v2.6 — Dashboard Command Center Redesign
**Created:** 2026-02-23
**Status:** Scoped

---

## Dashboard Layout

- [ ] **DL-01**: Two-column layout — left column (flexible width) for task lists, right panel (fixed ~360px) for contextual content
- [ ] **DL-02**: Right panel default state shows Performance KPIs (Reviews This Month, Average Rating, Conversion Rate) with trend indicators and pipeline counters (Sent, Active Sequences, Queued)
- [ ] **DL-03**: Right panel default state shows Recent Activity feed below KPIs
- [ ] **DL-04**: Mobile responsive — right panel renders as bottom sheet triggered by item tap on screens below md breakpoint

## Dashboard Header

- [ ] **DH-01**: Greeting headline with dynamic subtitle ("X jobs ready to send · Y items need attention")
- [ ] **DH-02**: Right-aligned action buttons: "+ Add Job" (primary) and "View Campaigns" (outline)

## Navigation

- [ ] **DN-01**: Dashboard nav badge restored — shows combined count of ready-to-send + needs-attention items
- [ ] **DN-02**: NotificationBell component removed entirely from app header

## Ready to Send

- [ ] **RS-01**: "Enroll All" button with confirmation dialog listing all jobs before bulk enrollment
- [ ] **RS-02**: Clicking a Ready to Send job opens Job Details in the right panel (replaces default KPI/activity content)

## Job Detail Panel

- [ ] **JD-01**: Job Details shows customer info (name, phone, email), job metadata (technician, service type, completion date), and job notes — reuse elements from existing JobDetailDrawer rendered inline (Jobs page keeps its own drawer instance)
- [ ] **JD-02**: Job Details includes campaign data (matching campaign name/type) — requires data layer enhancement to fetch campaign info for jobs
- [ ] **JD-03**: "Enroll in [Campaign Name] Campaign" CTA button in job detail panel
- [ ] **JD-04**: Close button (X) returns right panel to default KPI/activity state

## Needs Attention Panel

- [ ] **NA-01**: Clicking Needs Attention item opens contextual detail in right panel
- [ ] **NA-02**: Failed delivery detail: customer info, error description, "Retry" action button
- [ ] **NA-03**: Low rating detail: customer info, rating, feedback text, "Resolve" action button

## Getting Started

- [ ] **GS-01**: Getting Started full card displayed in right panel until user completes first job
- [ ] **GS-02**: After first job completion, Getting Started shrinks to compact card in right panel until first review received
- [ ] **GS-03**: Getting Started pill and drawer removed from dashboard (content consolidated into right panel)

## Right Panel Architecture

- [ ] **RP-01**: Right panel is dashboard-page-only — other pages retain current drawer behavior
- [ ] **RP-02**: Panel state machine: default (KPIs + activity) / job-detail / attention-detail / getting-started — mutually exclusive views

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Customer address field | Not in current data model, skip for now |
| Navigation changes (remove Activity/Feedback) | Keep current nav — prototype was simplified |
| Full-screen mobile overlay | Bottom sheet is simpler and less disruptive |
| Right panel on non-dashboard pages | Other pages keep current drawer behavior |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DL-01 | Phase 40 | Pending |
| DL-02 | Phase 40 | Pending |
| DL-03 | Phase 40 | Pending |
| DL-04 | Phase 40 | Pending |
| DH-01 | Phase 40 | Pending |
| DH-02 | Phase 40 | Pending |
| DN-01 | Phase 40 | Pending |
| DN-02 | Phase 40 | Pending |
| RS-01 | Phase 40 | Pending |
| RS-02 | Phase 40 | Pending |
| JD-01 | Phase 40 | Pending |
| JD-02 | Phase 40 | Pending |
| JD-03 | Phase 40 | Pending |
| JD-04 | Phase 40 | Pending |
| NA-01 | Phase 40 | Pending |
| NA-02 | Phase 40 | Pending |
| NA-03 | Phase 40 | Pending |
| GS-01 | Phase 40 | Pending |
| GS-02 | Phase 40 | Pending |
| GS-03 | Phase 40 | Pending |
| RP-01 | Phase 40 | Pending |
| RP-02 | Phase 40 | Pending |

**Coverage:**
- v2.6 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 after initial definition*
