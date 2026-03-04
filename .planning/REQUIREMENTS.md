# Requirements: v3.1.1 QA Bug Fixes

**Milestone:** v3.1.1 — QA Bug Fixes
**Created:** 2026-03-03
**Status:** Roadmap complete

---

## v3.1.1 Requirements

All requirements are bug fixes discovered during the v3.1 QA E2E Audit. Each has a known fix documented in the QA findings.

### Campaigns

- [x] **CAMP-FIX-01**: Apply frozen enrollment migration to database and add error handling to `toggleCampaignStatus()` so constraint violations surface to the user instead of being silently swallowed *(Critical)*
- [x] **CAMP-FIX-02**: Add 'frozen' key to `ENROLLMENT_STATUS_LABELS` in `lib/constants/campaigns.ts` *(Medium)*
- [x] **CAMP-FIX-03**: Add "Frozen" stat card to campaign detail page showing count of frozen enrollments *(Low)*
- [x] **CAMP-FIX-04**: Fix `resolveTemplate()` in touch-sequence-display.tsx to filter system templates by campaign service type before falling back to channel-only match *(Low)*

### Dashboard

- [ ] **DASH-FIX-01**: Restore KPI card navigation to /analytics — either re-add KPIWidgets or update right panel compact cards to link to /analytics *(Medium)*
- [ ] **DASH-FIX-02**: Fix mobile header overflow at 375px by hiding "View Campaigns" secondary button on mobile (`hidden sm:flex`) *(Medium)*

### History

- [ ] **HIST-FIX-01**: Fix timezone bug in `getSendLogs` — replace `setHours(23,59,59,999)` with UTC-explicit `new Date(dateTo + 'T23:59:59.999Z')` *(Medium)*

### Onboarding

- [ ] **ONB-FIX-01**: Add missing `software_used TEXT` column to businesses table via migration *(Medium)*

### Jobs

- [ ] **JOBS-FIX-01**: Wire column header sort click handlers using TanStack `header.column.getToggleSortingHandler()` *(Low)*

### Public Form

- [ ] **FORM-FIX-01**: Increase ServiceTypeSelect trigger height from h-10 (40px) to h-12 (48px) to meet 44px touch target minimum *(Low)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | Fix-only milestone — no new capabilities |
| Marketing page updates | Dashboard-only scope |
| Performance optimization | Separate concern |
| Accessibility improvements beyond touch targets | Separate milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAMP-FIX-01 | Phase 68 | Complete |
| CAMP-FIX-02 | Phase 68 | Complete |
| CAMP-FIX-03 | Phase 68 | Complete |
| CAMP-FIX-04 | Phase 68 | Complete |
| DASH-FIX-01 | Phase 69 | Pending |
| DASH-FIX-02 | Phase 69 | Pending |
| HIST-FIX-01 | Phase 69 | Pending |
| ONB-FIX-01 | Phase 69 | Pending |
| JOBS-FIX-01 | Phase 69 | Pending |
| FORM-FIX-01 | Phase 69 | Pending |

**Coverage:**
- v3.1.1 requirements: 10 total
- Mapped to phases: 10/10
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-04 after Phase 68 execution*
