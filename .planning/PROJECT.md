# AvisLoop

## What This Is

AvisLoop is a review follow-up system for home service businesses (HVAC, plumbing, electrical, cleaning, roofing, etc.). After a job is completed, AvisLoop triggers a multi-touch SMS + email sequence that personalizes the ask, sends at the right time, and helps manage reputation outcomes. Optimized for home services first, but works for any local service business. The core promise: "Complete the job, AvisLoop handles the follow-up — the right message, at the right time, on the right channel."

## Core Value

Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.

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

**v2.0 Review Follow-Up System Redesign**
- Rename Contacts to Customers; add phone number, service history, tags
- Jobs: basic CRUD with service type, status, tied to customer
- Campaigns: preset sequences (conservative/standard/aggressive) + duplicate & customize; multi-touch with channel + timing per touch; stop conditions
- SMS sending via Twilio with quiet hours, STOP compliance, fallback logic (no phone -> email)
- LLM personalization via Vercel AI SDK (GPT-4o-mini primary, Haiku fallback on constraint violations); personalization slider, QA checks
- Dashboard redesign: pipeline KPIs, ready-to-send queue, needs attention, quick actions
- Onboarding redesign: services offered (timing defaults), software used, review destination, default campaign
- Navigation: Send/Queue, Customers, Jobs, Campaigns, Activity/History
- Landing page redesign for home services positioning

### Out of Scope

- Review inbox / ingestion — future feature (show "Coming soon")
- Integrations (Jobber, HCP, ServiceTitan) — capture software used now, build later
- AI reply generation — future feature
- Widgets, QR codes, NFC cards — future feature
- Team roles / permissions — 1 user = 1 account for now
- Multi-location for Pro — deferred
- Video testimonials on landing page — use written testimonials
- Industry-specific landing pages — start generic, A/B test later

## Context

**Target users:** Home service business owners (HVAC techs, plumbers, electricians, cleaners, roofers, painters, handymen) who:
- Complete jobs daily but forget to ask for reviews
- Find asking awkward or don't have a system
- Want reviews but won't learn complex software
- Need something that works from the truck/field (mobile)

**Current state:** 18,011+ LOC (TypeScript/SQL/CSS). 25 phases across 5 milestones shipped. Tech stack: Next.js 15 (App Router), TypeScript, Supabase (Postgres + Auth), Tailwind CSS, Resend, Stripe, Upstash Redis, Phosphor Icons, Kumbh Sans, react-countup.

**User flows (v2.0 target):**
1. **Onboarding:** Landing → Sign up → Wizard (business basics, review destination, services offered, software used, default campaign, import customers)
2. **Daily usage:** Complete job → Add job record → Campaign triggers sequence → SMS/email sent automatically → Track in dashboard
3. **Dashboard:** View pipeline (jobs ready, queued requests, follow-ups due, delivery issues) → Act on needs-attention items
4. **Campaign management:** Choose preset or customize sequence → Set touches (SMS/email), timing, stop conditions
5. **Billing:** Hit paywall → Stripe checkout → Unlock sending

**Pages (v2.0 target):**
- Public: `/` (landing), `/pricing`, `/login`, `/signup`
- App: `/dashboard`, `/onboarding`, `/customers`, `/send`, `/jobs`, `/campaigns`, `/history`, `/billing`, `/settings`

**Data model (existing):**
- Business: id, user_id, name, google_review_link, sender_name, created_at
- Contact: id, business_id, name, email, phone, notes, opted_out, archived, created_at
- EmailTemplate: id, business_id, name, subject, body, is_default, created_at
- SendLog: id, business_id, contact_id, template_id, status, is_test, sent_at, provider_id
- ScheduledSend: id, business_id, contact_ids, template_id, scheduled_for, status, executed_at, send_log_ids

**Data model (new for v2.0):**
- Job: id, business_id, customer_id, service_type, status, completed_at, technician_name, notes, created_at
- Campaign: id, business_id, name, is_preset, touches (JSONB array of channel/timing/template), stop_conditions, service_rules, active, created_at
- CampaignEnrollment: id, campaign_id, job_id, customer_id, current_touch, status, enrolled_at, completed_at
- MessageTemplate: extends EmailTemplate with channel (email/sms), character_limit, personalization_level

## Constraints

- **Tech stack**: Next.js + Supabase + Resend + Twilio + Stripe + Vercel AI SDK — chosen for speed to ship
- **Channels**: Email (Resend) + SMS (Twilio) — dual channel with fallback logic
- **Simplicity**: 1 user = 1 account, no team permissions
- **Mobile-friendly**: App must work well on phones (techs use mobile in the field)
- **UX**: Minimal UI, zero clutter, 1 primary action per screen, no jargon
- **SMS compliance**: A2P 10DLC registration, STOP handling, quiet hours (9am-8pm default)
- **LLM safety**: Vercel AI SDK abstraction, GPT-4o-mini primary, Haiku fallback, never invent details

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

## Current Milestone: v2.0 Review Follow-Up System

**Goal:** Transform AvisLoop from a single-send review request tool into a multi-touch follow-up system for home service businesses — with SMS, campaigns/sequences, jobs, LLM personalization, and a redesigned dashboard/onboarding/landing page.

**Target features:**
- Customers (renamed from Contacts) with phone, service history, tags
- Jobs with basic CRUD, service type, status, customer link
- Campaigns: preset sequences + duplicate & customize, multi-touch with timing/channel per touch
- SMS via Twilio with quiet hours, STOP compliance, fallback to email
- LLM personalization (Vercel AI SDK, GPT-4o-mini + Haiku fallback)
- Dashboard: pipeline KPIs, ready-to-send queue, needs attention, quick actions
- Onboarding: services offered, software used, review destination, default campaign
- Navigation overhaul: Send/Queue, Customers, Jobs, Campaigns, History
- Landing page redesigned for home services positioning
- Remove old/unused code as new features replace them; reuse working components (badges, drawers, preview)

---
*Last updated: 2026-02-02 after v2.0 milestone started*
