# PROJECT_STATE

## Now
- v1.0-v1.4 milestones complete (shipped through 2026-02-02)
- v2.0 Review Follow-Up System in progress
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
- Phase 30.1 (Audit Gap Remediation) ready to execute — 8 plans in 3 waves (table skeletons, V2 terminology, enrollment preview)
- Twilio A2P: Brand approved, campaign pending

## Last session summary (Phase 30.1 validation)
- **Phase 30.1 planning validated**: 8 plans in 3 waves
- **Wave 1** (parallel): Table skeletons (01), Send→Manual Request (02), Campaign enrollment preview (03)
- **Wave 2** (parallel): Enrollment pagination (04), Preset guidance (05), Add Job auto-open + terminology (06), Preset timing (07)
- **Wave 3**: History/Activity alignment (08)
- **Model profile**: balanced (executor=sonnet, verifier=sonnet)

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
1. Execute Phase 30.1 (Audit Gap Remediation) — 8 plans
   - 30.1-01: Table skeleton loaders (Critical)
   - 30.1-02: Rename Send → "Manual Request" + friction (High)
   - 30.1-03: Campaign enrollment preview on jobs (High)
   - 30.1-04 to 30.1-08: Medium/Low priority fixes
2. Wait for Twilio A2P approval for Phase 21-08
3. Phase 29 (Agency-Mode Readiness) after 30.1 complete
4. Landing page improvements (deferred to marketing phase)

## Open questions / decisions needed
- Twilio A2P campaign approval (blocker for Phase 21-08 verification)
- Google OAuth provider config in Supabase dashboard
- Production domain and deployment
- OpenRouter vs Vercel AI SDK for LLM routing (Phase 25)
