# Requirements: AvisLoop v8.1 — Code Review Fixes

**Defined:** 2026-01-27
**Core Value:** Make requesting reviews so simple that business owners actually do it — one contact, one click, done.

## v8.1 Requirements

Code review fixes for phases 6, 7, and 8.

### Security

- [ ] **SEC-01**: Stripe webhook has rate limiting for failed signature verification attempts
- [ ] **SEC-02**: Service role Supabase client is scoped inside webhook handler function
- [ ] **SEC-03**: Billing page validates STRIPE_BASIC_PRICE_ID and STRIPE_PRO_PRICE_ID env vars
- [ ] **SEC-04**: Onboarding wizard validates localStorage draft data with Zod schema

### Maintainability

- [ ] **MAINT-01**: Contact limits are centralized in lib/constants/billing.ts
- [ ] **MAINT-02**: Business/Contact/Template types extracted to shared types file
- [ ] **MAINT-03**: Onboarding page comment matches actual step count (3 steps)

### UX

- [ ] **UX-01**: Footer links point to existing pages or are removed
- [ ] **UX-02**: Auth pages have consistent branding with marketing layout

### SEO

- [ ] **SEO-01**: Copyright year is dynamically generated

### Performance

- [ ] **PERF-01**: getBusinessBillingInfo() runs independent queries in parallel

### Accessibility

- [ ] **A11Y-01**: Onboarding progress indicator has proper ARIA attributes

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 8.1 | Pending |
| SEC-02 | Phase 8.1 | Pending |
| SEC-03 | Phase 8.1 | Pending |
| SEC-04 | Phase 8.1 | Pending |
| MAINT-01 | Phase 8.1 | Pending |
| MAINT-02 | Phase 8.1 | Pending |
| MAINT-03 | Phase 8.1 | Pending |
| UX-01 | Phase 8.1 | Pending |
| UX-02 | Phase 8.1 | Pending |
| SEO-01 | Phase 8.1 | Pending |
| PERF-01 | Phase 8.1 | Pending |
| A11Y-01 | Phase 8.1 | Pending |

**Coverage:**
- v8.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-27 after code review*
