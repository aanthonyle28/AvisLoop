# Requirements: v2.5.1 Bug Fixes & Polish

**Milestone:** v2.5.1 — Bug Fixes & Polish
**Created:** 2026-02-24
**Status:** Scoped

---

## Activity Page

- [x] **ACT-01**: Bulk select only selects rows with resendable status (failed/bounced) — header checkbox and "select all" must skip delivered/sent/opened rows
- [x] **ACT-02**: Resend button only visible on rows with failed/bounced status — not on successfully delivered/sent/opened rows
- [x] **ACT-03**: Resend button always displayed inline (no hover-to-reveal) for applicable rows — remove opacity-0/group-hover pattern
- [x] **ACT-04**: Page title uses standard page header pattern matching other pages
- [x] **ACT-05**: Status filter uses chip-style filters (like Jobs page) instead of dropdown select — same status options as current
- [x] **ACT-06**: Date filter includes preset chips (Past Week, Past Month) alongside custom date range picker

## Dashboard

- [ ] **DASH-01**: Needs Attention rows match Ready to Send row styling — no left colored border, consistent icon sizing
- [ ] **DASH-02**: Needs Attention items have dismiss (X) button to remove from the list
- [ ] **DASH-03**: Ready to Send empty state has dashed border, icon in circle with correct jobs icon

## Onboarding

- [ ] **ONB-01**: New CRM platform step with square logo cards (Jobber, Housecall Pro, ServiceTitan, etc.), "None" and "Other" with text input, skippable, second-to-last step

## Services

- [ ] **SVC-01**: Onboarding services step allows adding multiple custom service names when "Other" is selected
- [ ] **SVC-02**: Settings services section allows adding multiple custom service names

## Navigation

- [ ] **NAV-01**: Sidebar active state: filled icon + brand orange text, no left border, background stays the same

## Cross-Page UX

- [ ] **UX-01**: All pages use consistent lazy loading (navigation progress bar + skeleton, matching campaigns page pattern)
- [ ] **UX-02**: All pages (except dashboard) use consistent empty state (icon in circle, title, subtitle, contextual action button)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Status badge WCAG contrast fixes | Separate from this patch, tracked in v2.5 audit |
| Onboarding step count server clamp fix | Low priority, no UI generates invalid step URLs |
| Security findings from v2.5 audit | Already resolved in post-security hardening session |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| ACT-01 | Phase 41 | Complete |
| ACT-02 | Phase 41 | Complete |
| ACT-03 | Phase 41 | Complete |
| ACT-04 | Phase 41 | Complete |
| ACT-05 | Phase 41 | Complete |
| ACT-06 | Phase 41 | Complete |
| DASH-01 | Phase 42 | Pending |
| DASH-02 | Phase 42 | Pending |
| DASH-03 | Phase 42 | Pending |
| NAV-01 | Phase 42 | Pending |
| UX-01 | Phase 43 | Pending |
| UX-02 | Phase 43 | Pending |
| ONB-01 | Phase 44 | Pending |
| SVC-01 | Phase 44 | Pending |
| SVC-02 | Phase 44 | Pending |

**Coverage:**
- v2.5.1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-02-24*
*Last updated: 2026-02-25 — Phase 41 requirements marked Complete*
