# Requirements: AvisLoop v1.3

**Defined:** 2026-02-01
**Core Value:** Make requesting reviews so simple that business owners actually do it — one contact, one click, done.

## v1.3 Requirements

Requirements for Dashboard UX Overhaul & Onboarding Polish. Each maps to roadmap phases.

### Onboarding & Setup

- [ ] **ONBD-01**: New users get 1 silent bonus send credit for test request during onboarding (backend adds +1 to quota, UI shows standard quota number)
- [ ] **ONBD-02**: Setup checklist removes "create template" step; only "Choose Template" on send page required
- [ ] **ONBD-03**: After completing all setup steps, banner replaces checklist with "Setup Complete" chip offering restart/finish options (restart resets checklist, finish removes it)
- [ ] **ONBD-04**: "Restart Setup Checklist" option added to Help & Support dropdown menu in account menu
- [ ] **ONBD-05**: Help & Support menu item becomes functional (currently disabled)

### Email Preview

- [ ] **PREV-01**: Compact preview is ~80-140px, full-width, shows subject (1 line), body snippet (2-3 lines clamped), and "View full email" link — not a separate section, more like a confidence snippet
- [ ] **PREV-02**: Full preview opens in read-only modal showing subject, resolved body with contact variables, review CTA button rendered as button, footer text, and small From/To header

### Detail Drawers

- [ ] **DRWR-01**: Recent activity chips open request detail drawer inline on the send page (not route to /history)
- [ ] **DRWR-02**: Clicking a contact on contacts page opens detail drawer with contact info, notes field, and action items (send, edit, archive, view history)
- [ ] **DRWR-03**: Request detail drawer includes resend option with template selector
- [ ] **DRWR-04**: Contact detail drawer includes an editable "Notes" textbox that persists to database (new `notes` text column on contacts table)

### Layout & Navigation

- [ ] **LAYO-01**: Settings page navbar is sticky/fixed on scroll
- [ ] **LAYO-02**: Recent activity strip fills available horizontal space until View All button, with truncation at the end

### Template Selection

- [ ] **TMPL-01**: Template dropdown on send page shows default templates AND a "Create Template" option that navigates to settings template creation page

## v2 Requirements

Deferred to future release. Not in current roadmap.

### Analytics
- **ANLT-01**: Send/open/click rate dashboards
- **ANLT-02**: Review conversion tracking

### Channels
- **CHNL-01**: SMS review requests via Twilio
- **CHNL-02**: Multi-channel send (email + SMS)

## Out of Scope

| Feature | Reason |
|---------|--------|
| SMS channel | Email-only for now, SMS adds complexity and cost |
| AI reply generation | Future feature, not core to review requesting |
| Team roles / permissions | 1 user = 1 account for simplicity |
| Multi-location for Pro | Deferred to v2 |
| Widgets, QR codes, NFC | Future feature set |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ONBD-01 | TBD | Pending |
| ONBD-02 | TBD | Pending |
| ONBD-03 | TBD | Pending |
| ONBD-04 | TBD | Pending |
| ONBD-05 | TBD | Pending |
| PREV-01 | TBD | Pending |
| PREV-02 | TBD | Pending |
| DRWR-01 | TBD | Pending |
| DRWR-02 | TBD | Pending |
| DRWR-03 | TBD | Pending |
| DRWR-04 | TBD | Pending |
| LAYO-01 | TBD | Pending |
| LAYO-02 | TBD | Pending |
| TMPL-01 | TBD | Pending |

**Coverage:**
- v1.3 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14 (pending roadmap creation)

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after initial definition*
