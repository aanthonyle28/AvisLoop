# Requirements: AvisLoop

**Defined:** 2026-02-01
**Core Value:** Make requesting reviews so simple that business owners actually do it -- one contact, one click, done.

## v1.3 Requirements

Requirements for Dashboard UX Overhaul & Onboarding Polish. Each maps to roadmap phases.

### Onboarding & Setup

- [ ] **ONBD-01**: New users get 1 silent bonus send credit for test request during onboarding (backend adds +1 to quota, UI shows standard quota number)
- [ ] **ONBD-02**: Setup checklist removes "create template" step; only "Choose Template" on send page required
- [ ] **ONBD-03**: After completing all setup steps, banner replaces checklist with "Setup Complete" chip offering restart/finish options (restart resets checklist, finish removes it)
- [ ] **ONBD-04**: "Restart Setup Checklist" option added to Help & Support dropdown menu in account menu
- [ ] **ONBD-05**: Help & Support menu item becomes functional (currently disabled)

### Email Preview

- [x] **PREV-01**: Compact preview is ~80-140px, full-width, shows subject (1 line), body snippet (2-3 lines clamped), and "View full email" link -- not a separate section, more like a confidence snippet
- [x] **PREV-02**: Full preview opens in read-only modal showing subject, resolved body with contact variables, review CTA button rendered as button, footer text, and small From/To header

### Detail Drawers

- [ ] **DRWR-01**: Recent activity chips open request detail drawer inline on the send page (not route to /history)
- [ ] **DRWR-02**: Clicking a contact on contacts page opens detail drawer with contact info, notes field, and action items (send, edit, archive, view history)
- [ ] **DRWR-03**: Request detail drawer includes resend option with template selector
- [ ] **DRWR-04**: Contact detail drawer includes an editable "Notes" textbox that persists to database (new `notes` text column on contacts table)

### Layout & Navigation

- [x] **LAYO-01**: Settings page navbar is sticky/fixed on scroll
- [x] **LAYO-02**: Recent activity strip fills available horizontal space until View All button, with truncation at the end

### Status Badges

- [x] **BDGE-01**: Unified status badge component used consistently across all pages (send, history, contacts, drawers, recent activity) with exact Figma spec: Pending (#F3F4F6 bg, #101828 text, spinner icon), Delivered (#EAF3F6 bg, #2C879F text, check-circle icon), Clicked (#FEF9C2 bg, #894B00 text, cursor icon), Failed (#FFE2E2 bg, #C10007 text, warning-circle icon), Reviewed (#DCFCE7 bg, #008236 text, star icon), Scheduled (rgba(#9F2C86,0.1) bg, #9F2C86 text, check-circle icon)

### Template Selection

- [x] **TMPL-01**: Template dropdown on send page shows default templates AND a "Create Template" option that navigates to settings template creation page

## v1.4 Requirements

Requirements for Landing Page Redesign. Creative, unique, high-converting marketing pages.

### Hero Section

- [ ] **HERO-01**: User sees an outcome-focused headline that communicates value within 5 seconds (benefit-driven, not feature-listing, under 8 words)
- [ ] **HERO-02**: User sees an animated product demo in the hero showing the 2-minute send flow (contact → message → send) using CSS/scroll animations
- [ ] **HERO-03**: User sees a redesigned hero layout with floating UI mockups, gradient effects, and above-the-fold primary CTA
- [ ] **HERO-04**: User sees a social proof strip immediately below hero ("Trusted by X+ businesses" with visual logos or industry mentions)

### Content & Storytelling

- [ ] **CONT-01**: User sees a problem/solution empathy section addressing review pain points (forgetting, awkwardness, complex tools) with emotional copy
- [ ] **CONT-02**: User sees a "How It Works" 3-step visual walkthrough (Add contact → Write message → Send) with inline product screenshots/placeholders
- [ ] **CONT-03**: User sees benefit-focused outcome cards (not feature lists) — "Get more reviews", "Save time", "No awkward asks" — with icons and supporting copy

### Trust & Social Proof

- [ ] **TRUST-01**: User sees industry-specific testimonials with specific outcome numbers ("Got 30 reviews in 2 weeks") from different business types (dentist, salon, contractor)
- [ ] **TRUST-02**: User sees animated count-up statistics (reviews collected, businesses using, time saved) that trigger on scroll into viewport
- [ ] **TRUST-03**: User sees a visual social proof bar with business/industry logos replacing text-only brand names

### Technical & Polish

- [ ] **TECH-01**: All new sections use CSS scroll-triggered animations (fade-in, slide-in, stagger) that respect prefers-reduced-motion and work in dark mode
- [ ] **TECH-02**: Pricing page is redesigned with persuasive comparison layout, "Most Popular" highlight, transparent pricing, and risk-reversal copy
- [ ] **TECH-03**: Navbar and footer are updated to match the new creative direction with consistent brand design system
- [ ] **TECH-04**: All new components use semantic color tokens (bg-card, text-foreground, border-border) for dark mode support
- [ ] **TECH-05**: FAQ section is redesigned with conversion-optimized placement and updated questions addressing setup time, email compatibility, response rates, and privacy
- [ ] **TECH-06**: Final CTA section is redesigned with repeated primary CTA, social proof count, and risk-reversal messaging ("No credit card required")
- [ ] **TECH-07**: All new components are mobile-first responsive (single-column stacking, 44px touch targets, optimized images)

## v2 Requirements

Deferred to future release. Not in current roadmap.

### Analytics
- **ANLT-01**: Send/open/click rate dashboards
- **ANLT-02**: Review conversion tracking

### Channels
- **CHNL-01**: SMS review requests via Twilio
- **CHNL-02**: Multi-channel send (email + SMS)

### Landing Page v2
- **LP-01**: Interactive product walkthrough (embedded preview)
- **LP-02**: Industry-specific landing pages (dentists vs salons vs contractors)
- **LP-03**: Video testimonials
- **LP-04**: Advanced animations (particle effects, 3D elements, WebGL)
- **LP-05**: A/B testing infrastructure with feature flags
- **LP-06**: GA4 analytics event tracking (scroll depth, CTA clicks, FAQ expansion)

## Out of Scope

| Feature | Reason |
|---------|--------|
| SMS channel | Email-only for now, SMS adds complexity and cost |
| AI reply generation | Future feature, not core to review requesting |
| Team roles / permissions | 1 user = 1 account for simplicity |
| Multi-location for Pro | Deferred to v2 |
| Widgets, QR codes, NFC | Future feature set |
| Auto-play video with sound | Increases bounce rate |
| Multiple competing CTAs per section | Creates decision paralysis |
| Blog/content marketing pages | Not in scope for this milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ONBD-01 | Phase 23 | Pending |
| ONBD-02 | Phase 23 | Pending |
| ONBD-03 | Phase 23 | Pending |
| ONBD-04 | Phase 23 | Pending |
| ONBD-05 | Phase 23 | Pending |
| PREV-01 | Phase 21 | Complete |
| PREV-02 | Phase 21 | Complete |
| DRWR-01 | Phase 22 | Pending |
| DRWR-02 | Phase 22 | Pending |
| DRWR-03 | Phase 22 | Pending |
| DRWR-04 | Phase 22 | Pending |
| LAYO-01 | Phase 20 | Complete |
| LAYO-02 | Phase 20 | Complete |
| TMPL-01 | Phase 21 | Complete |
| BDGE-01 | Phase 20 | Complete |
| HERO-01 | Phase 24 | Pending |
| HERO-02 | Phase 24 | Pending |
| HERO-03 | Phase 24 | Pending |
| HERO-04 | Phase 24 | Pending |
| CONT-01 | Phase 25 | Pending |
| CONT-02 | Phase 25 | Pending |
| CONT-03 | Phase 25 | Pending |
| TRUST-01 | Phase 26 | Pending |
| TRUST-02 | Phase 25 | Pending |
| TRUST-03 | Phase 26 | Pending |
| TECH-01 | Phase 24 | Pending |
| TECH-02 | Phase 27 | Pending |
| TECH-03 | Phase 27 | Pending |
| TECH-04 | Phase 24 | Pending |
| TECH-05 | Phase 26 | Pending |
| TECH-06 | Phase 26 | Pending |
| TECH-07 | Phase 27 | Pending |

**Coverage:**
- v1.3 requirements: 15 total (mapped to phases 20-23)
- v1.4 requirements: 17 total (mapped to phases 24-27)
- Unmapped: 0

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after Phase 21 completion*
