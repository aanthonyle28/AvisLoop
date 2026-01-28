# AvisLoop

## What This Is

AvisLoop is a SaaS web app that helps local service businesses (dentists, salons, contractors, gyms, restaurants, etc.) request more Google reviews by sending customers a simple email with their review link, and tracking what was sent. The core promise: "In 2 minutes, add a contact, hit send, and start collecting more reviews — no marketing setup, no CRM, no learning curve."

## Core Value

Make requesting reviews so simple that business owners actually do it — one contact, one click, done.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Authentication & Account**
- [ ] User can sign up and log in
- [ ] User has a dashboard after login
- [ ] User can log out

**Business Profile**
- [ ] User can create a business with name and Google review link
- [ ] Pro users can manage multiple business locations

**Contacts**
- [ ] User can add contacts manually (name + email)
- [ ] Contacts are stored under the user's business
- [ ] Basic tier limited to 200 contacts
- [ ] Pro tier has unlimited contacts

**Send Review Request**
- [ ] User can select a contact and send a review request email
- [ ] Email uses a simple, editable message template
- [ ] Email sent via Resend
- [ ] Each send creates a Message record with status (sent/failed)
- [ ] Basic tier limited to 200 sends/month
- [ ] Pro tier limited to 500 sends/month

**Message History**
- [ ] User can view list of sent messages
- [ ] Shows: recipient, channel, date/time, status

**Billing**
- [ ] 25 free sends before requiring subscription
- [ ] Basic plan: $49/month (200 sends, 200 contacts, 1 location)
- [ ] Pro plan: $99/month (500 sends, unlimited contacts, multiple locations)
- [ ] Stripe integration for subscription management
- [ ] Sending gated behind active subscription or remaining trial sends

**Onboarding**
- [ ] Guided wizard: business name → review link → first contact → first send
- [ ] Dashboard shows "next best action" after onboarding

### Out of Scope

- SMS channel — email first, SMS later
- Automations / follow-up sequences — adds complexity
- Campaign scheduling — not needed for MVP
- Analytics dashboards beyond message history — keep simple
- AI reply generation — future feature
- Integrations (Zapier, CRM, Google Business API) — future feature
- Widgets, QR codes, NFC cards — future feature
- Team roles / permissions — 1 user = 1 account for now

## Context

**Target users:** Small local service businesses who know reviews matter but:
- Forget to ask customers
- Find asking awkward
- Find existing tools too complex or expensive
- Don't have a repeatable process

**User flows:**
1. **Onboarding:** Landing → Sign up → Wizard (business, review link, first contact, first send) → Dashboard
2. **Daily usage:** Login → Add contact → Send request → See confirmation → Check history later
3. **Billing:** Hit paywall after 25 sends → Stripe checkout → Unlock sending

**Pages (MVP):**
- Public: `/` (landing), `/pricing`, `/login`, `/signup`
- App: `/app` (dashboard), `/app/onboarding`, `/app/business`, `/app/contacts`, `/app/send`, `/app/history`, `/app/billing`

**Data model:**
- Business: id, user_id, name, review_link, created_at
- Contact: id, business_id, name, email, created_at
- Message: id, business_id, contact_id, channel, template_used, status, sent_at, provider_id

## Constraints

- **Tech stack**: Next.js + Supabase + Resend + Stripe — chosen for speed to ship
- **Channel**: Email only for MVP — SMS adds complexity and cost
- **Simplicity**: 1 user = 1 account, no team permissions
- **Mobile-friendly**: App must work well on phones (business owners use mobile)
- **UX**: Minimal UI, zero clutter, 1 primary action per screen, no jargon

## Current Milestone: v8.1 Code Review Fixes

**Goal:** Fix 12 issues identified in code review of phases 6, 7, and 8

**Target fixes:**
- Security: Webhook rate limiting, service client scope, env validation, localStorage sanitization
- Maintainability: Centralize constants, extract shared types, fix comments
- UX: Fix broken footer links, auth page layout consistency
- SEO: Dynamic copyright year
- Performance: Parallelize DB queries
- Accessibility: ARIA attributes on progress indicator

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Email first, not SMS | Lower cost, simpler integration, SMS can come later | — Pending |
| Next.js + Supabase | Fast to ship, built-in auth, good DX | — Pending |
| Usage-based trial (25 sends) | Let users see value before paying | — Pending |
| Two tiers ($49/$99) | Basic for small shops, Pro for multi-location businesses | — Pending |
| Multi-location for Pro | Pro users get multiple business locations | — Pending |

---
*Last updated: 2026-01-27 after milestone v8.1 started*
