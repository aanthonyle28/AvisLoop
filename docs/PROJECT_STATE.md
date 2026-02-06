# PROJECT_STATE

## Now
- v1.0-v1.4 milestones complete (shipped through 2026-02-02)
- v2.0 Review Follow-Up System in progress
- Phase 20 (Database Migration & Customer Enhancement) complete
- Phase 21 (SMS Foundation) 7/8 plans complete, blocked on Twilio A2P for final verification
- Phase 22 (Jobs CRUD & Service Types) complete
- Phase 23 (Message Templates & Migration) complete
- Phase 24 (Multi-Touch Campaign Engine) complete
- Phase 25 (LLM Personalization) context captured, ready for research/planning
- Phase 26 (Review Funnel) 6/7 plans complete
- Phase 27 (Dashboard Redesign) complete
- Phase 28 (Onboarding Redesign) complete
- Twilio A2P: Brand approved, campaign pending

## Last session summary (Phase 28-07 verification)
- **Phase 28 complete**: All 8 plans executed, 7-step onboarding wizard verified end-to-end
- **Bugs fixed**: Checkbox infinite loop in services-offered-step, missing sms_consent_acknowledged DB column
- **Settings verified**: Email Authentication checklist and Branded Review Link sections visible
- **Migration applied**: Added sms_consent_acknowledged columns to businesses table

## What's been built
- **Auth**: Sign up, sign in, sign out, password reset, session persistence
- **Business**: Business profile form, message template management (email + SMS)
- **Customers**: Full CRUD, bulk operations, CSV import, tags, phone validation, SMS consent tracking
- **Jobs**: Jobs table with service types, completion status, timing defaults
- **Campaigns**: Multi-touch campaigns, presets, enrollment, touch processing, analytics
- **Review Funnel**: Pre-qualification page, rating capture, Google redirect, private feedback form
- **Security**: SQL injection protection, pagination, bulk limits, rate limiting, middleware route protection
- **Sending**: Contact selector, message preview, Resend integration, cooldown, quotas
- **History**: Send history with date filtering, search, status badges
- **Billing**: Stripe integration, tier enforcement, usage tracking
- **Onboarding**: 7-step setup wizard (business basics, review destination, services, software, campaign preset, customer import, SMS consent), dashboard checklist, completion redirect, Email Auth checklist, Branded Review Link settings
- **Marketing**: Landing page, pricing page, responsive design, mobile nav menu
- **Polish**: Design system, loading states, micro-interactions, accessibility, branded titles, dark/light/system theme toggle, full dark mode support

## Next steps
1. Complete Phase 26-07 (Feedback dashboard)
2. Research/plan Phase 25 (LLM Personalization)
3. Wait for Twilio A2P approval for Phase 21-08
4. Phase 29 after 25/26 complete

## Open questions / decisions needed
- Twilio A2P campaign approval (blocker for Phase 21-08 verification)
- Google OAuth provider config in Supabase dashboard
- Production domain and deployment
- OpenRouter vs Vercel AI SDK for LLM routing (Phase 25)
