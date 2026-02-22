# PROJECT_STATE

## Now
- v1.0-v1.4 milestones complete (shipped through 2026-02-02)
- **v2.0 Review Follow-Up System COMPLETE** (all phases verified 2026-02-18)
- Phase 20 (Database Migration & Customer Enhancement) complete
- Phase 21 (SMS Foundation) 7/8 plans complete, blocked on Twilio A2P for final verification
- Phase 22 (Jobs CRUD & Service Types) complete
- Phase 23 (Message Templates & Migration) complete
- Phase 24 (Multi-Touch Campaign Engine) complete
- Phase 25 (LLM Personalization) complete
- Phase 26 (Review Funnel) complete
- Phase 27 (Dashboard Redesign) complete
- Phase 28 (Onboarding Redesign) complete
- Phase 30 (V2 Alignment) 10/10 plans complete
- Phase 30.1 (Audit Gap Remediation) complete — 8/8 verified
- Phase 31 (Landing Page V2 Rewrite) complete — 5/5 verified
- Phase 32 (Post-Onboarding Guidance) complete — 4/4 verified
- Twilio A2P: Brand approved, campaign pending

## Last session summary (UX Improvements)
- **Dashboard reorder**: Moved RecentCampaignActivity below ReadyToSendQueue and AttentionAlerts (actionable content first)
- **Sidebar Add Job button**: Changed to brand orange (bg-accent) to match mobile FAB
- **Onboarding collapsed**: 5 steps → 3 steps (Business Setup merges basics+services, removed Import Jobs step)
- **Customers moved to Settings**: Removed from sidebar nav (7→6 items), added as Customers tab in Settings with full CRUD/CSV import. Direct `/customers` route still works
- **Activity bulk resend**: Added checkbox column for failed/bounced/complained rows, bulk retry action bar with up to 25 messages at once
- **Dashboard WelcomeCard**: First-run experience card with 4 checklist action items, auto-hides when first item completed. Suppresses pill/drawer on dashboard to avoid duplication
- **Animated demo controls**: Landing page demo progress bars are now clickable buttons with proper ARIA roles, auto-play resumes after click
- Typecheck + lint pass with zero errors

## What's been built
- **Auth**: Sign up, sign in, sign out, password reset, session persistence
- **Business**: Business profile form, message template management (email + SMS)
- **Customers**: Full CRUD, bulk operations, CSV import, tags, phone validation, SMS consent tracking
- **Jobs**: Jobs table with service types, completion status, timing defaults, scheduled→completed workflow
- **Campaigns**: Multi-touch campaigns, presets, enrollment, touch processing, analytics
- **Review Funnel**: Pre-qualification page, rating capture, Google redirect, private feedback form
- **Security**: SQL injection protection, pagination, bulk limits, rate limiting, middleware route protection
- **Sending**: Customer selector, message preview, Resend integration, cooldown, quotas
- **History**: Send history with date filtering, search, status badges, bulk resend for failed messages
- **Billing**: Stripe integration, tier enforcement, usage tracking
- **Onboarding**: 3-step setup wizard (business setup, campaign preset, SMS consent), WelcomeCard first-run experience, post-onboarding checklist (pill+drawer), first-visit tooltip hints
- **Marketing**: V2 landing page (automation-first copy), pricing page, responsive design, mobile nav
- **Polish**: Design system, loading states, micro-interactions, accessibility, dark mode, V2 alignment

## Next steps
1. Wait for Twilio A2P approval for Phase 21-08 (SMS webhook verification)
2. Phase 29 (Agency-Mode Readiness) — multi-location schema, weekly reports, campaign playbooks
3. Production deployment — configure Twilio, Resend, Google OAuth, Stripe
4. v2.1 Integrations — ServiceTitan/Jobber/Housecall Pro API for auto job import
5. v2.2 Review Inbox — ingest Google Business Profile reviews, AI reply suggestions

## Open questions / decisions needed
- Twilio A2P campaign approval (blocker for Phase 21-08 verification)
- Google OAuth provider config in Supabase dashboard
- Production domain and deployment timeline
- Agency mode scope and pricing (Phase 29)
