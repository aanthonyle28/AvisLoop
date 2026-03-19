# Requirements: v4.0 Web Design Agency Pivot

**Defined:** 2026-03-18
**Core Value:** Provide home service businesses with professional websites and optional automated review management — all managed through a single agency dashboard.

## v4.0 Requirements

### Data Model & Business Extension

- [ ] **DATA-01**: Businesses table has a `client_type` discriminator column (`reputation` | `web_design` | `both`) that branches behavior across the app
- [ ] **DATA-02**: Business record includes web design fields: owner_name, owner_email, owner_phone, web_design_tier (basic/advanced), has_review_addon, monthly_fee, start_date, invoice_date, status (active/paused/churned), vercel_project_url, domain, live_website_url
- [ ] **DATA-03**: `web_projects` table exists with business_id, project_name, page_count, status (setup/live/maintenance), launched_at, and relevant project metadata
- [ ] **DATA-04**: Business card on /businesses page removes competitive analysis fields and shows web design fields when client_type is web_design or both

### Web Design CRM

- [ ] **CRM-01**: A dedicated `/clients` page shows a table of all web design clients with columns: business name, owner name, tier, status, domain, MRR, revisions used this month
- [ ] **CRM-02**: Table is filterable by status (active/paused/churned) and tier (basic/advanced)
- [ ] **CRM-03**: Clicking a client row opens a detail view showing full business info, project details, ticket history, and revision usage (X of Y remaining)
- [ ] **CRM-04**: Agency operator can edit client details (contact info, tier, domain, Vercel project, status) from the detail view
- [ ] **CRM-05**: CRM page shows total MRR summary across all active web design clients

### Ticket & Revision Tracking

- [ ] **TICK-01**: `project_tickets` table exists with business_id, title, description, status (submitted/in_progress/completed), priority, created_at, updated_at, completed_at
- [ ] **TICK-02**: `ticket_messages` table exists for threaded updates — both client and agency can add messages with optional file attachments
- [ ] **TICK-03**: Monthly revision limits enforced atomically: Basic plan gets 2/month, Advanced gets 4/month, no rollover
- [ ] **TICK-04**: When a client reaches their monthly limit, form blocks submission and displays a message offering additional requests at $50 each
- [ ] **TICK-05**: Client confirms $50 overage before submitting — overage requests are tracked separately for billing
- [ ] **TICK-06**: Agency operator can view all tickets across all clients in a single view, filterable by status and client
- [ ] **TICK-07**: Agency operator can update ticket status (submitted → in_progress → completed) and add completion notes
- [ ] **TICK-08**: File/screenshot attachments supported on tickets via Supabase Storage (10MB limit, images + PDF)

### Client Portal

- [ ] **PORT-01**: Each web design client has a unique portal token generating a permanent URL at `/portal/[token]`
- [ ] **PORT-02**: Portal loads without authentication — client accesses via bookmarkable link
- [ ] **PORT-03**: Portal displays "X of Y revisions remaining this month" prominently
- [ ] **PORT-04**: Client can submit a revision request with title, description, and optional file attachment from the portal
- [ ] **PORT-05**: Portal shows client's ticket history with current status and any agency responses/messages
- [ ] **PORT-06**: Portal is rate-limited to prevent abuse (Upstash Redis, same pattern as existing public routes)
- [ ] **PORT-07**: Invalid or missing portal tokens show a clear error page (not a crash)

### Marketing & Landing Page

- [ ] **MKT-01**: New homepage at `/` positions AvisLoop as a web design agency for home service businesses with hero, services overview, pricing cards, and CTA
- [ ] **MKT-02**: Existing review/reputation landing page content moves to a secondary page (e.g., `/reputation` or `/reviews`) accessible from the homepage
- [ ] **MKT-03**: Pricing section displays three offerings: Basic $199/mo (1-4 pages, 2 revisions/mo), Advanced $299/mo (4-10 pages, 4 revisions/mo), Review add-on $99/mo
- [ ] **MKT-04**: Landing page follows existing brand design system (Kumbh Sans, warm palette, Phosphor icons)
- [ ] **MKT-05**: Landing page is responsive and works well on mobile (375px+)

### Bug Fix

- [ ] **BUG-01**: Apply `brand_voice` column migration to businesses table to resolve "Could not find the 'brand_voice' column" error during onboarding

## Future Requirements

### Stripe Billing Integration (v4.1)

- **BILL-01**: Stripe products/prices for Basic ($199), Advanced ($299), and Review add-on ($99)
- **BILL-02**: Webhook handler updated to iterate all subscription items and map new price IDs
- **BILL-03**: $50 overage invoicing via Stripe one-time invoice API
- **BILL-04**: Billing page shows web design subscription status alongside review add-on status

### Enhanced Portal (v4.2)

- **PORT-08**: Portal token regeneration ("Regenerate link" button for security rotation)
- **PORT-09**: Agency branding on portal (custom agency name instead of "AvisLoop")
- **PORT-10**: Email notifications to client when ticket status changes

## Out of Scope

| Feature | Reason |
|---------|--------|
| Stripe billing automation for web design tiers | Deferred to v4.1 — manual invoicing sufficient for solo agency MVP |
| Client login with email/password | Token-based portal is simpler and better for non-technical clients |
| Annotation/visual markup tools | Anti-feature — home service clients describe changes in plain English |
| Kanban/Gantt/milestone project management | Overbuilding — 3-state ticket system is sufficient for revision tracking |
| Multi-agency support (multiple operators) | Solo agency model — 1 user = 1 account |
| Portfolio/gallery in landing page | Can use static screenshots initially; dynamic portfolio is v4.2+ |
| Automated ticket escalation | Manual management sufficient at solo-operator scale |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 71 | Pending |
| DATA-01 | Phase 71 | Pending |
| DATA-02 | Phase 71 | Pending |
| DATA-03 | Phase 71 | Pending |
| DATA-04 | Phase 71 | Pending |
| CRM-01 | Phase 72 | Pending |
| CRM-02 | Phase 72 | Pending |
| CRM-03 | Phase 72 | Pending |
| CRM-04 | Phase 72 | Pending |
| CRM-05 | Phase 72 | Pending |
| TICK-01 | Phase 73 | Pending |
| TICK-02 | Phase 73 | Pending |
| TICK-03 | Phase 73 | Pending |
| TICK-04 | Phase 73 | Pending |
| TICK-05 | Phase 73 | Pending |
| TICK-06 | Phase 73 | Pending |
| TICK-07 | Phase 73 | Pending |
| TICK-08 | Phase 73 | Pending |
| PORT-01 | Phase 74 | Pending |
| PORT-02 | Phase 74 | Pending |
| PORT-03 | Phase 74 | Pending |
| PORT-04 | Phase 74 | Pending |
| PORT-05 | Phase 74 | Pending |
| PORT-06 | Phase 74 | Pending |
| PORT-07 | Phase 74 | Pending |
| MKT-01 | Phase 75 | Pending |
| MKT-02 | Phase 75 | Pending |
| MKT-03 | Phase 75 | Pending |
| MKT-04 | Phase 75 | Pending |
| MKT-05 | Phase 75 | Pending |

**Coverage:**
- v4.0 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after roadmap creation*
