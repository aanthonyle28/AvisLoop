# AvisLoop

## What This Is

AvisLoop is a SaaS web app that helps local service businesses (dentists, salons, contractors, gyms, restaurants, etc.) request more Google reviews by sending customers a simple email with their review link, scheduling sends for optimal timing, and tracking what was sent. The core promise: "In 2 minutes, add a contact, hit send, and start collecting more reviews — no marketing setup, no CRM, no learning curve."

## Core Value

Make requesting reviews so simple that business owners actually do it — one contact, one click, done.

## Requirements

### Validated

**v1.0 MVP**
- User can sign up (email/password + Google OAuth), log in, reset password, and log out
- User can create a business with name and Google review link
- User can select/customize email templates and set sender name
- User can add/edit/archive contacts, import via CSV, search and filter
- User can send review request emails with preview, cooldown, rate limiting, opt-out, and quota enforcement
- User can view message history with status tracking, date filtering, search, and pagination
- 25 free trial sends, then Basic ($49/mo: 200 sends, 200 contacts) or Pro ($99/mo: 500 sends, unlimited contacts)
- Guided onboarding wizard with dashboard test step cards
- Landing page, pricing page, login/signup with split layout and Google OAuth
- Bulk send (up to 25 contacts), re-send to cooled-down contacts, webhook API for contact ingestion

**v1.1 Scheduled Sending**
- User can schedule review requests with presets (1 hour, next morning, 24 hours) or custom date/time
- User can view, cancel, and reschedule pending scheduled sends
- Cron processes due sends every minute with re-validation of business rules
- Navigation badges show pending scheduled count

### Active

(No active requirements — planning next milestone)

### Out of Scope

- SMS channel — email first, SMS later
- Automations / follow-up sequences — adds complexity
- Analytics dashboards beyond message history — keep simple
- AI reply generation — future feature
- Integrations (Zapier, CRM, Google Business API) — future feature
- Widgets, QR codes, NFC cards — future feature
- Team roles / permissions — 1 user = 1 account for now
- Multi-location for Pro — deferred to v2

## Context

**Target users:** Small local service businesses who know reviews matter but:
- Forget to ask customers
- Find asking awkward
- Find existing tools too complex or expensive
- Don't have a repeatable process

**Current state:** 18,011 LOC (TypeScript/SQL/CSS). 18 phases across 4 milestones (v1.0, v1.1, v1.2, v1.2.1) all shipped. Tech stack: Next.js 15 (App Router), TypeScript, Supabase (Postgres + Auth), Tailwind CSS, Resend, Stripe, Upstash Redis, Phosphor Icons, Kumbh Sans.

**User flows:**
1. **Onboarding:** Landing → Sign up (email or Google) → Wizard (business name, review link) → Dashboard test cards (create contact, create template, send test)
2. **Daily usage:** Login → Add contact → Send/schedule request → See confirmation → Check history
3. **Scheduling:** Schedule send → View in /scheduled → Cron processes at scheduled time → Results in history
4. **Billing:** Hit paywall after 25 sends → Stripe checkout → Unlock sending

**Pages:**
- Public: `/` (landing), `/pricing`, `/login`, `/signup`
- App: `/dashboard`, `/onboarding`, `/contacts`, `/send`, `/scheduled`, `/history`, `/billing`, `/dashboard/settings`

**Data model:**
- Business: id, user_id, name, google_review_link, sender_name, created_at
- Contact: id, business_id, name, email, opted_out, archived, created_at
- EmailTemplate: id, business_id, name, subject, body, is_default, created_at
- SendLog: id, business_id, contact_id, template_id, status, is_test, sent_at, provider_id
- ScheduledSend: id, business_id, contact_ids, template_id, scheduled_for, status, executed_at, send_log_ids

## Constraints

- **Tech stack**: Next.js + Supabase + Resend + Stripe — chosen for speed to ship
- **Channel**: Email only — SMS adds complexity and cost
- **Simplicity**: 1 user = 1 account, no team permissions
- **Mobile-friendly**: App must work well on phones (business owners use mobile)
- **UX**: Minimal UI, zero clutter, 1 primary action per screen, no jargon

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Email first, not SMS | Lower cost, simpler integration | Good — email sufficient for core value |
| Next.js + Supabase | Fast to ship, built-in auth, good DX | Good — shipped MVP in 3 days |
| Usage-based trial (25 sends) | Let users see value before paying | Pending — needs real user validation |
| Two tiers ($49/$99) | Basic for small shops, Pro for multi-location | Pending — needs pricing validation |
| Separate scheduled_sends table | Different lifecycle than send_logs, supports cancellation | Good — clean separation |
| Vercel Cron for processing | Serverless, no infrastructure to manage | Good — runs every minute reliably |
| Service role for cron | No user session in cron context | Good — necessary for RLS bypass |
| FOR UPDATE SKIP LOCKED | Race-safe atomic claiming of scheduled sends | Good — prevents double-processing |
| Phosphor Icons + Kumbh Sans | Design system aligned to Figma reference | Good — consistent visual language |
| Google OAuth via PKCE | Supabase built-in, reduces signup friction | Good — standard secure flow |
| 2-step onboarding wizard | Faster onboarding, less intimidating | Good — business name + review link only |
| Dashboard test step cards | Guided walkthrough instead of checklist | Good — auto-detection of completion |
| Test sends excluded from quota | Fair for users learning the product | Good — is_test flag in database |

---
*Last updated: 2026-02-01 after v1.2.1 milestone complete*
