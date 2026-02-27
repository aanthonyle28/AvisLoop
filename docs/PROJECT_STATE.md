# PROJECT_STATE

## Now
- v1.0-v1.4 milestones complete (shipped through 2026-02-02)
- **v2.0 Review Follow-Up System COMPLETE** (all phases verified 2026-02-18)
- **v2.5 UI/UX Redesign COMPLETE** (Phases 33-39 all verified 2026-02-20)
- **Security Review COMPLETE** (2026-02-22) — 26 findings, all Critical/High/Medium resolved
- **Post-security hardening COMPLETE** (2026-02-22) — conflict resolution, review cooldown, cron processor
- **v2.5.1 Bug Fixes & Polish COMPLETE** (Phases 41-44, 2026-02-24)
- **v2.5.2 UX Bugs & UI Fixes COMPLETE** (2026-02-24)
- **v2.5.3 UX Bugs & UI Fixes Part 2 COMPLETE** (Phases 45, 2026-02-25)
- **v2.5.4 Code Review COMPLETE** (Phases 46-51, 2026-02-25/26)
- **v2.6 Dashboard Command Center COMPLETE** (Phase 40, 2026-02-23/27)
- **v3.0 Agency Mode Foundation IN PROGRESS** (Phases 52-57 complete, Phase 58 researched)
- Phase 21 (SMS Foundation) 7/8 plans complete, blocked on Twilio A2P for final verification
- Twilio A2P: Brand approved, campaign pending
- All commits pushed to remote

## Last session summary (v3.0 Agency Mode — Phases 52-57)

### Phase 52: Multi-Business Foundation
- Cookie-based active business resolver (`getActiveBusiness()` reads `active_business_id` cookie)
- `switchBusiness()` server action sets httpOnly cookie + revalidatePath
- `getUserBusinesses()` queries all user-owned businesses
- Uses `.limit(1)` fallback (not `.single()`) to avoid PGRST116 crashes
- Extended `BusinessSettingsProvider` with `businessId`, `businessName`, `businesses[]`
- Dashboard layout fetches active business + all businesses in parallel

### Phase 53: Data Function Refactor
- All 22 `lib/data/` functions now accept explicit `businessId` parameter
- Eliminated all `.eq('user_id', ...).single()` patterns (PGRST116 crash risk)
- Callers (server components, actions) pass verified businessId from `getActiveBusiness()`
- Deleted dead `lib/data/customer.ts` (zero importers)
- Pattern: "caller-provides-businessId" — data layer never resolves business context internally

### Phase 54: Business Switcher UI
- `BusinessSwitcher` component in desktop sidebar (Radix DropdownMenu)
- Single-business users see plain text (no dropdown)
- Multi-business users see dropdown with check on active business
- Mobile page header business switcher integration
- `useTransition` for non-blocking server action execution

### Phase 55: Clients Page (Agency Management)
- 10 new nullable agency metadata columns on businesses table (ratings, fees, dates, competitor tracking, notes)
- `/businesses` page with BusinessCard grid showing all user-owned businesses
- `BusinessDetailDrawer` for viewing/editing agency metadata per client
- Auto-save notes with debounce, GBP access toggle, competitor tracking
- `getUserBusinessesWithMetadata()` data function + Zod validation

### Phase 56: Additional Business Creation
- 4 new insert-only server actions (never upsert) in `create-additional-business.ts`
- `CreateBusinessWizard` 3-step modal (business details → services → SMS consent)
- `/onboarding?mode=new` bypasses completed-onboarding redirect for new businesses
- `/businesses` added to middleware APP_ROUTES with auth protection
- "Add Business" button in sidebar

### Phase 57: Agency Billing (Pooled Usage)
- `getPooledMonthlyUsage(userId)` — aggregates sends across ALL user-owned businesses
- Derives effective tier as best tier across all businesses
- Updated all 3 send enforcement points (email, batch, SMS)
- Billing page shows "Sends this month (all businesses)" with pooled count
- Closes loophole: N businesses no longer means N × plan limit

### Verification
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- All phases 41-57 verified (6/6 must-haves or equivalent)
- All commits pushed to remote

## Milestone history (completed since last full update)

### v2.5.1 Bug Fixes & Polish (Phases 41-44, 2026-02-24)
- **Phase 41:** Activity page overhaul — Radix Select for status filter, date preset chips (Today/Week/Month/3M), corrected resend to only target failed/bounced
- **Phase 42:** Dashboard navigation polish — sidebar active state redesign (filled icon + brand orange text), attention alerts dismiss, ready-to-send dashed border empty state
- **Phase 43:** Cross-page consistency — standardized loading.tsx skeletons, normalized empty states across jobs/history/feedback/customers/analytics
- **Phase 44:** Onboarding services — CRM platform step (ServiceTitan/Jobber/Housecall Pro), custom service names (TEXT[] on businesses), multi-tag input

### v2.5.2-v2.5.4 UX & Code Review (Phases 45-51, 2026-02-25/26)
- **Phase 45:** Foundation visual changes — soft button variant, renamed Activity→History in nav, card-style queue rows, dashboard empty state borders
- **Phase 46:** Drawer consistency + campaign freeze — frozen enrollment status, campaign pause/resume preserves touch position, unified drawer/sheet styling (SheetBody component)
- **Phase 47:** Dashboard right panel + campaign polish — SVG sparklines on KPI cards (14-day history), colored activity feed icons, template preview modal in campaign editor, Radix Select migration for job forms
- **Phase 48:** Onboarding & dashboard behavior fixes — Getting Started trigger moved to campaign detail, KPI links unified to /analytics, campaign preset picker redesign (plain English descriptions)
- **Phase 49:** Custom services visual polish — custom service name pills in onboarding/settings, page subtitle normalization, bg-card on table rows
- **Phase 50:** Code review & audit — comprehensive cross-cutting audit with findings report
- **Phase 51:** Audit remediation — dashboard fixes, page spacing, settings dedup, security/validation hardening, accessibility fixes, history type migration

### v2.6 Dashboard Command Center (Phase 40, 2026-02-23/27)
- **Phase 40-01:** DashboardShell two-column layout, RightPanel component
- **Phase 40-02:** Compact job queue + attention alerts wired to layout
- **Phase 40-03:** Right panel Getting Started card, suppressed setup-progress on dashboard
- **Phase 40-04:** Detail views for jobs and alerts (expandable right panel)
- **Phase 40-05:** Mobile responsive bottom sheet + compact KPI summary bar

### Other changes (pre-milestone)
- StatusDot component replacing status Badge across app
- Pre-flight conflict detection for scheduled jobs
- Job notes threaded through AI personalization pipeline
- Dashboard list styling refinements, feedback alert dismissal
- Job status replaced Select with toggle buttons
- FirstVisitHint wrappers removed, Getting Started disabled
- Landing page redesigned for managed agency service positioning
- LogoMark extracted into shared component (sidebar + KPI widgets)
- AvisLoop logomark SVG replacing Star icon
- Privacy policy and terms of service pages added

## What's been built
- **Auth**: Sign up, sign in, sign out, password reset, session persistence, PasswordInput with strength checklist, Google OAuth
- **Multi-Business**: Cookie-based active business resolver, business switcher (desktop sidebar + mobile header), explicit businessId threading through all data functions
- **Businesses Page**: Agency management grid, BusinessDetailDrawer with metadata editing, auto-save notes
- **Business Creation**: CreateBusinessWizard 3-step modal, insert-only server actions, onboarding ?mode=new bypass
- **Customers**: Full CRUD, bulk operations, CSV import, tags, phone validation, SMS consent tracking (in Settings tab)
- **Jobs**: Jobs table with service types, completion status, timing defaults, scheduled->completed workflow, inline actions, detail drawer, campaign selector with one-off option, toggle button status
- **Campaigns**: Multi-touch campaigns, presets, enrollment, touch processing, analytics, creation dialog, edit sheet panel, delete with enrollment reassignment, QuickSendModal for one-off sends, frozen enrollment support (pause/resume preserves touch position), template preview modal
- **Enrollment Conflicts**: Conflict detection (active sequence / review cooldown), Replace/Skip/Queue resolution, cron auto-resolution (24h stale conflicts), queue_after processing, revert with undo toast, pre-flight detection for scheduled jobs
- **Review Funnel**: Pre-qualification page, HMAC-signed tokens, rating capture, Google redirect, private feedback form, reviewed_at tracking on send_logs
- **Security**: HMAC review tokens, server-only guards, rate limiting (send/webhook/public/auth), SQL injection protection, pagination, bulk limits, middleware route protection, security headers, RLS on all tables with WITH CHECK, generic error messages (no internal leaks)
- **History**: Send history with Radix Select filter, date preset chips, status badges, inline retry for failed, bulk resend for failed/bounced messages
- **Billing**: Stripe integration, tier enforcement, pooled usage tracking across all user businesses (agency-safe)
- **Onboarding**: 4-step setup wizard (business setup, CRM platform, campaign preset, SMS consent), WelcomeCard first-run experience, post-onboarding checklist, CreateBusinessWizard for additional businesses
- **Marketing**: Managed-service landing page (agency positioning), pricing page, responsive design, mobile nav, privacy policy, terms of service
- **Design System**: Warm palette (cream/amber/soft blue), semantic tokens, card CVA variants, InteractiveCard, soft button variant, StatusDot component, LogoMark shared SVG, SheetBody component, page padding normalization
- **Dashboard**: Two-column DashboardShell with RightPanel, two-tier KPIs with sparklines (14-day history), colored activity feed, ReadyToSendQueue with card-style rows, AttentionAlerts with dismiss, Getting Started card, mobile bottom sheet + compact KPI bar
- **Polish**: Standardized loading skeletons across all pages, normalized empty states, drawer/sheet consistency, Radix Select migrations, accessibility (aria-labels, touch targets), dark mode, V2 alignment
- **Cron Infrastructure**: 3 atomic RPCs (claim_due_scheduled_sends, recover_stuck_scheduled_sends, increment_customer_send_count), enrollment conflict cron (auto-resolve stale + queue_after), fail-closed auth on all cron endpoints
- **Architecture**: BusinessSettingsProvider context (business identity + settings + custom service names), cookie-based multi-business resolution, caller-provides-businessId data layer pattern, pooled billing at user level, insert-only server actions for business creation

## Next steps
1. **Phase 58: Job Completion Form** — Public `/complete/[token]` route for technician on-site job creation (researched, ready to execute)
2. Wait for Twilio A2P approval for Phase 21-08 (SMS webhook verification)
3. Production deployment — configure env vars:
   - `REVIEW_TOKEN_SECRET` (openssl rand -hex 32)
   - `CRON_SECRET` (for Vercel cron auth)
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate limiting)
   - Twilio, Resend, Google OAuth, Stripe, OpenAI/Anthropic
4. Enable leaked password protection in Supabase Dashboard > Auth > Settings
5. Agency dashboard analytics — per-client reviews, ratings, ROI tracking
6. v3.1+ — bulk campaign operations across businesses, white-label/branding
7. v4.0 Integrations — ServiceTitan/Jobber/Housecall Pro API for auto job import
8. v4.1 Review Inbox — ingest Google Business Profile reviews, AI reply suggestions

## Open questions / decisions needed
- Twilio A2P campaign approval (blocker for Phase 21-08 verification)
- Production domain and deployment timeline
- Phase 58 token strategy: persistent DB token vs HMAC-signed per-business
- Agency pricing model (per-client fee? tiered by client count?)
- Upstash Redis setup for production rate limiting
