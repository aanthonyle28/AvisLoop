# QA Audit Feature Landscape: Pre-Production Audit

**Domain:** Multi-tenant SaaS — Comprehensive pre-deployment audit
**Researched:** 2026-02-27
**Confidence:** HIGH — based on codebase analysis + standard SaaS QA patterns
**Milestone type:** QA audit before first production deployment

---

## Context

AvisLoop is shipping to production for the first time after completing v3.0 agency mode (Phases
52-58). The audit goal is to produce a **findings report** — a page-by-page, feature-by-feature
document of what works, what is broken, and what is risky. This is not a test suite build; it is
an audit that results in a findings file per category.

**Scope:** Dashboard app and all its backing systems. Marketing and public pages excluded.

**Output format:** Findings files, one per category, written under `.planning/phases/<N>-qa-audit/`.

---

## Table Stakes

These must pass before production. Anything broken here is embarrassing or dangerous.

### Category A: Authentication and Session Management

**Why required:** Broken auth means users cannot use the app. Session leaks mean unauthorized
access. Every other category depends on this working.

| Test Scenario | What We Are Verifying | Risk If Broken |
|---------------|----------------------|----------------|
| Email/password signup completes | New user lands on `/onboarding` after confirm email | Users cannot onboard |
| Login with valid credentials | Session set, redirect to `/dashboard` | Lock-out |
| Login with wrong password | Generic error shown, no info leak about account existence | Info disclosure |
| Password reset email sends | User receives email, link works, password changes | Users locked out |
| Google OAuth signup | New user created, lands on `/onboarding` | OAuth users blocked |
| Google OAuth login | Existing OAuth user lands on `/dashboard` | OAuth users blocked |
| Expired session redirect | Unauthenticated request to any `/dashboard/*` route redirects to `/login` | Unauthorized access |
| Protected route direct URL access | Typing `/dashboard` while logged out redirects, not 404 or data exposure | Unauthorized access |
| Sign out clears session | After signout, `/dashboard` redirects to `/login` | Session stays alive |
| Password input toggle | Show/hide password works on login and signup forms | UX bug (minor) |

**Confidence check:** Supabase handles session management. Auth routes are in middleware. This
should be HIGH confidence but needs smoke-test verification on deployed environment.

---

### Category B: Multi-Tenant Data Isolation

**Why required:** This is the most critical security category for a multi-tenant SaaS. If tenant
A can see tenant B's data, that is a production-blocking bug. RLS policies are the enforcement
layer; this category verifies they work as intended.

| Test Scenario | What We Are Verifying | Risk If Broken |
|---------------|----------------------|----------------|
| User A cannot read User B's jobs | RLS on jobs table by business ownership | Cross-tenant data leak |
| User A cannot read User B's customers | RLS on customers table | Cross-tenant data leak |
| User A cannot read User B's campaigns | RLS on campaigns table | Cross-tenant data leak |
| User A cannot read User B's send_logs | RLS on send_logs table | Cross-tenant data leak |
| User A cannot read User B's enrollments | RLS on campaign_enrollments table | Cross-tenant data leak |
| User A cannot read User B's feedback | RLS on customer_feedback table | Cross-tenant data leak |
| User A cannot update User B's jobs via direct API call | RLS WITH CHECK on writes | Write privilege escalation |
| User A cannot delete User B's customers via direct API call | RLS WITH CHECK on deletes | Destructive privilege escalation |
| Active business cookie from User A rejected if used by User B | `getActiveBusiness()` ownership check | Session fixation-style attack |
| Multi-business user — business A data never shown when business B is active | Cookie-based resolver isolates correctly | Wrong-business data shown to legitimate user |
| Newly created second business starts with empty state | No bleed from first business's jobs, customers, campaigns | Data contamination |

**Implementation note:** All data functions use explicit `businessId` from `getActiveBusiness()`
which verifies `user_id = auth.uid()`. Service-role bypasses use explicit scoping in all queries.
Still requires manual verification that every path is covered.

---

### Category C: Core V2 Workflow — Job Completion to Campaign Enrollment

**Why required:** This is the product's one core automation loop. If "complete job" does not
trigger campaign enrollment, the product does not work at all.

| Test Scenario | What We Are Verifying | Risk If Broken |
|---------------|----------------------|----------------|
| Create job with new customer inline (name + email) | Customer created as side effect, job created | V2 core flow broken |
| Create job with existing customer by email match | Existing customer linked, no duplicate created | Duplicate customer records |
| Create job status=completed → enrollment created | Campaign enrollment record inserted with touch_1_scheduled_at set | No reviews ever sent |
| Create job status=scheduled → no enrollment created | Enrollment NOT created at job creation time | Premature enrollment |
| Mark scheduled job as complete → enrollment created | `markJobComplete()` triggers enrollment | Technician tap has no effect |
| Mark job as do_not_send → no enrollment created | `do_not_send` status skips enrollment | Unwanted review requests |
| service_type_timing respected | Touch 1 scheduled at correct offset from completion time | Review requests sent at wrong time |
| campaign_override=one_off respected | Enrollment skipped for one-off jobs | One-off job accidentally enrolled |
| Correct campaign matched by service type | HVAC job enrolls in HVAC campaign, not Plumbing | Wrong campaign |
| Null service_type campaign = fallback | When no service-specific campaign, global campaign used | Job never enrolled |
| Update completed job service type → re-enrollment | Old enrollment stopped, new one created for correct campaign | Double enrollment |

---

### Category D: Campaign Enrollment Conflict Handling

**Why required:** A repeat customer with an active enrollment hitting a new job is the most
common edge case. Broken conflict detection means either double-enrollment or silent failure.

| Test Scenario | What We Are Verifying | Risk If Broken |
|---------------|----------------------|----------------|
| New job for customer with active enrollment shows conflict badge | `enrollment_resolution='conflict'` set on job | Silent enrollment failure |
| Replace action cancels old enrollment and creates new | `resolveEnrollmentConflict('replace')` works | Double emails sent |
| Skip action removes job from queue | `resolveEnrollmentConflict('skip')` sets 'skipped' | Job stuck in queue |
| Queue after action waits for completion | `resolveEnrollmentConflict('queue_after')` sets correct state | Immediate re-enrollment |
| Undo toast after skip reverts correctly | `revertConflictResolution()` restores conflict state | Cannot undo actions |
| Review cooldown prevents re-enrollment | Customer who reviewed recently is suppressed | Harassing customers post-review |
| Pre-flight conflict detection on scheduled job | Conflict detected when creating job, not just at completion | Conflict appears unexpectedly at completion |

---

### Category E: Review Funnel (Public Routes)

**Why required:** The review funnel is the product's money path. A broken funnel means customers
cannot leave reviews, which means zero reviews collected and zero product value delivered.

| Test Scenario | What We Are Verifying | Risk If Broken |
|---------------|----------------------|----------------|
| Valid HMAC review token renders review page | Token parsed, customer+business fetched, rating UI shown | No reviews collected |
| Expired review token (>30 days) shows 404 | `parseReviewToken()` rejects expired tokens | Old link works unexpectedly |
| Invalid token string shows 404 | Not 500, not data exposure | Error info leak |
| 4-star rating redirects to Google URL | Correct routing based on rating value | Users sent to feedback instead of Google |
| 5-star rating redirects to Google URL | Same as above | Users sent to feedback instead of Google |
| 3-star rating shows private feedback form | Low-rating routing to feedback | Negative reviews accidentally sent to Google |
| 1-star rating shows private feedback form | Same as above | Negative reviews accidentally sent to Google |
| Rating submission stops active campaign enrollment | `review_clicked` or `feedback_submitted` stops enrollment | Customer continues receiving messages after reviewing |
| `reviewed_at` set on send_logs after review click | KPI "Reviews This Month" counts correctly | Dashboard analytics wrong |
| Feedback form submission stores record | `customer_feedback` row created | Feedback lost |
| Rate limit on `/api/review/rate` | 429 returned after threshold | DoS vector on public endpoint |
| Token validated server-side (not client) | No enumeration by toggling token bytes | Customer enumeration attack |

---

### Category F: Public Job Completion Form (`/complete/[token]`)

**Why required:** This is the technician's tool for the on-site completion flow. Phase 58
deliverable. If it does not work, the dispatch-based workflow does not work.

| Test Scenario | What We Are Verifying | Risk If Broken |
|---------------|----------------------|----------------|
| Valid form token renders business name and service types | Business resolved from `form_token` column | Technician sees blank or wrong form |
| Invalid/unknown token shows 404 | Not 500, not another business's form | Token guessing attack |
| Submit with new customer (email path) | Customer created, job created with status=completed | No review automation triggered |
| Submit with new customer (phone-only path) | Phone-dedup attempted, customer created | Phone-only customers blocked |
| Submit with returning customer by email match | Existing customer linked, no duplicate | Duplicate customer records |
| Submit with returning customer by phone match | Phone dedup as fallback | Duplicate customer records |
| Active campaign enrollment triggered after submit | Review automation starts | Form submission has no effect |
| Conflict on public submit sets enrollment_resolution | Conflict surfaced on dashboard for owner to resolve | Silent failure |
| Review cooldown respected on public submit | Suppressed correctly, job still created | Harassing recent reviewers |
| Regenerating token invalidates old URL | Old `/complete/<old-token>` returns 404 after regen | Stale links still work |
| Form is mobile-optimized | Touch targets, layout works on 375px viewport | Technicians cannot use on phone |
| `noindex, nofollow` set on page | Search engines do not index form | Form URLs indexed publicly |

---

### Category G: History / Send Logs

**Why required:** Owners troubleshoot from the History page. If filtering or bulk actions are
broken, operators cannot manage their queue.

| Test Scenario | What We Are Verifying | Risk If Broken |
|---------------|----------------------|----------------|
| History page loads with send records | Page renders, pagination works | Blank history page |
| Status filter narrows results | Selecting 'failed' shows only failed sends | Filter does nothing |
| Date preset chips filter correctly | "Today", "This Week", "This Month", "3 Months" produce correct date range | Wrong date range sent |
| Search by customer name filters | Free-text search narrows results | Search broken |
| Search by customer email filters | Same path, different field | Search broken |
| Retry single failed send | Individual retry sends the message | Cannot retry failures |
| Bulk resend failed/bounced | Bulk action sends to all in selection | Bulk retry broken |
| History scoped to active business | Switching business shows different history | Cross-tenant history bleed |

---

### Category H: Billing and Send Limit Enforcement

**Why required:** Billing enforcement protects revenue. A broken billing check means users
exceed plan limits without paying. Pooled billing for agency users is new in v3.0.

| Test Scenario | What We Are Verifying | Risk If Broken |
|---------------|----------------------|----------------|
| Free tier (no subscription) — monthly send limit enforced | Sends blocked after limit hit | Unlimited free sends |
| Paid tier — higher monthly send limit enforced | Paid users get correct limit | Paying users blocked at wrong threshold |
| Pooled usage: sends across all businesses counted together | `getPooledMonthlyUsage()` sums all businesses | Agency loophole: N businesses = N limits |
| Single business on Starter: pooled usage = that business's sends | No artificial inflation | Wrong count shown |
| Billing page shows correct pooled send count | UI reflects server-side state | Confusing billing display |
| Stripe checkout creates customer and subscription | `createCheckoutSession()` works end-to-end | Users cannot pay |
| Stripe webhook updates subscription tier | Webhook handler processes events correctly | Payment not reflected in app |
| Over-limit error message shown to user | Clear error, not silent failure or 500 | User confused why sends stop |

---

### Category I: Settings — All Tabs

**Why required:** Settings is how operators configure the entire automation pipeline. Broken
settings means broken campaigns, which means no reviews.

| Test Scenario | What We Are Verifying | Risk If Broken |
|---------------|----------------------|----------------|
| General tab: business name + phone save | Form saves and reflects immediately | Business name stuck |
| General tab: Google review link saves | Link used by review funnel | Wrong Google link on review redirect |
| Services tab: enable/disable service types | Affects which campaigns appear and which templates shown | Templates for disabled services shown |
| Services tab: custom timing per service type saves | `service_type_timing` JSONB field updated | Wrong enrollment timing |
| Services tab: custom service names save | `custom_service_names` TEXT[] updated | Custom names not shown |
| Templates tab: create new email template | Template stored for business | No custom templates |
| Templates tab: edit existing template | Edits persist | Campaign uses stale template |
| Templates tab: delete user template | Template removed, campaign_touches with this template set to NULL | Orphan template reference |
| Customers tab: add customer manually | Customer created (settings escape hatch path) | Cannot add customer from Settings |
| Customers tab: CSV import | Bulk import creates customers + jobs, skips campaign enrollment | Import broken |
| Form Link tab: generate form token | Token generated, URL shown | Technician form setup impossible |
| Form Link tab: regenerate token | New token generated, old URL becomes invalid | Cannot rotate compromised token |
| Danger zone: delete account requires confirmation | Destructive action gated | Accidental deletion |

---

## Differentiators

These merit thorough testing because they are new or complex enough that bugs would be hard to
catch without explicit verification.

### Category J: Multi-Business and Agency Workflow

**Why differentiator:** The entire v3.0 milestone built this. Correctness of business switching
and data isolation under multi-business conditions is non-trivial.

| Test Scenario | What We Are Verifying | Priority |
|---------------|----------------------|----------|
| Create second business via "Add Business" wizard | Insert-only path, new business independent of first | HIGH |
| Business switcher dropdown shows all businesses | `getUserBusinesses()` fetches correctly | HIGH |
| Switching businesses changes all page data | Cookie set, revalidatePath clears caches, next load shows correct business data | HIGH |
| Campaigns page after switch shows new business's campaigns | Not cached from old business | HIGH |
| Jobs page after switch shows new business's jobs | Same as above | HIGH |
| Dashboard KPIs reflect switched business | Metrics scoped to new businessId | HIGH |
| Businesses (clients) page shows all user businesses | Card grid lists all, not just active | MEDIUM |
| Business detail drawer loads and saves metadata | Agency metadata columns persist | MEDIUM |
| Notes auto-save in drawer | Debounced save works | MEDIUM |
| GBP access toggle saves | Boolean column updated | MEDIUM |
| Reviews gained calculation correct | `current - start` computed correctly | MEDIUM |
| "Switch to Business" from drawer activates and redirects | Same as switcher dropdown but from different entry point | MEDIUM |
| Onboarding ?mode=new bypass for additional businesses | Does not redirect completed-onboarding users away | HIGH |
| Multi-business billing pooled correctly | Switching businesses does not reset the pool count | HIGH |

---

### Category K: Campaign Management

**Why differentiator:** Campaigns are the automation engine. Pause/resume with frozen enrollment
preservation is complex state management.

| Test Scenario | What We Are Verifying | Priority |
|---------------|----------------------|----------|
| Create campaign from preset | Campaign + default touches created | HIGH |
| Create campaign with custom service type targeting | Unique constraint enforced per service type per business | HIGH |
| Edit campaign touches (channel, delay, template) | Saved correctly, shows in editor | HIGH |
| Duplicate service type campaign rejected | 23505 error surfaced as user message | MEDIUM |
| Pause campaign → active enrollments frozen | All active enrollments get status='frozen' | HIGH |
| Resume campaign → frozen enrollments restored to active | Touch times recalculated, enrollment continues | HIGH |
| Delete campaign with active enrollments shows warning | User informed, chooses to reassign or delete | HIGH |
| Template preview modal shows correct content | Template body and subject rendered | MEDIUM |
| One-off campaign option on job | `campaign_override='one_off'` skips enrollment | MEDIUM |
| Campaign analytics show send counts | Touch-level stats rendered | LOW |

---

### Category L: Dashboard

**Why differentiator:** Dashboard is the first thing users see. Broken KPIs or wrong data erode
trust immediately.

| Test Scenario | What We Are Verifying | Priority |
|---------------|----------------------|----------|
| KPI cards render with correct values | Reviews, rating, conversion, requests sent, active sequences | HIGH |
| Sparklines show 14-day history | SVG renders, data points present | MEDIUM |
| Ready-to-Enroll queue shows correct jobs | Jobs completed but not enrolled, sorted by completion time | HIGH |
| Attention alerts appear for conflicts | Jobs with enrollment_resolution='conflict' surfaced | HIGH |
| Attention alert dismiss persists | Alert does not reappear on reload | MEDIUM |
| Recent activity feed shows correct events | Campaign events ordered by recency | MEDIUM |
| Mobile layout renders correctly | Two-column collapses to single, bottom sheet opens | MEDIUM |
| WelcomeCard shown to new users, hidden after setup | First-run experience triggers and dismisses | LOW |
| Dashboard scoped to active business | Switching business changes all KPIs | HIGH |
| Empty state (zero jobs/enrollments) renders cleanly | No null reference crashes | HIGH |

---

### Category M: Feedback Resolution Workflow

**Why differentiator:** Feedback resolution is the follow-up loop for unhappy customers. If the
resolution state does not persist, owners re-see resolved issues.

| Test Scenario | What We Are Verifying | Priority |
|---------------|----------------------|----------|
| Feedback page lists submitted feedback | Feedback records rendered | HIGH |
| Resolve feedback marks as resolved | `resolved_at` + `resolved_by` set | HIGH |
| Resolved feedback hidden by default | Filter shows unresolved by default | MEDIUM |
| Internal notes on feedback saved | `internal_notes` field persists | MEDIUM |
| Feedback scoped to active business | Switching business shows correct feedback | HIGH |
| Empty state shown when no feedback | Not a crash or blank page | LOW |

---

### Category N: Analytics

**Why differentiator:** Analytics surfaces the value story to owners. Wrong numbers break trust.

| Test Scenario | What We Are Verifying | Priority |
|---------------|----------------------|----------|
| Analytics page loads | Renders without crash | HIGH |
| Metrics reflect actual send data | Numbers derived from send_logs, not hardcoded | HIGH |
| Service type breakdown table shows all enabled types | Rows present for each service | MEDIUM |
| Date range filter affects metrics | Changing range updates numbers | MEDIUM |
| Empty analytics state (new business) | Zero values shown cleanly, no crash | HIGH |
| Analytics scoped to active business | Switching business changes metrics | HIGH |

---

### Category O: Customers Page (Settings Escape Hatch)

**Why differentiator:** Customers is now in Settings (V2 de-emphasis) but still must function
for edge cases. The page is intentionally deprioritized but cannot be broken.

| Test Scenario | What We Are Verifying | Priority |
|---------------|----------------------|----------|
| Customers page lists records | Table renders, pagination works | HIGH |
| Search by name and email works | Filter narrows results | MEDIUM |
| Add customer manually | Customer created, appears in table | MEDIUM |
| Edit customer (name, email, phone) | Edits persist | MEDIUM |
| Archive customer | Status set to 'archived', hidden from default view | MEDIUM |
| SMS consent status display and update | Correct color coding per status | LOW |
| Customer detail drawer loads | All fields shown, notes auto-save | MEDIUM |
| Customers scoped to active business | Switching shows correct customers | HIGH |

---

### Category P: Onboarding Flow

**Why differentiator:** Onboarding is the first experience for real users. A crash here means
no revenue. Two distinct flows (first business, additional business) both need verification.

| Test Scenario | What We Are Verifying | Priority |
|---------------|----------------------|----------|
| Complete first-business onboarding (all 4 steps) | Business + campaign + SMS consent saved | HIGH |
| Skip optional steps (CRM platform, review link) | Onboarding completes with defaults | HIGH |
| Onboarding draft persisted in localStorage | Refresh mid-onboarding restores state | MEDIUM |
| Completed onboarding redirects to dashboard | Not stuck in loop | HIGH |
| `/onboarding` redirects away if business already exists | No re-onboarding | HIGH |
| `/onboarding?mode=new` allows creating second business | Bypass redirect guard works | HIGH |
| Create additional business (3-step wizard) | Business created, becomes active, redirects | HIGH |
| Campaign preset selection creates campaign with touches | Gentle/Standard/Aggressive all create different touch sequences | MEDIUM |
| SMS consent checkbox required | Cannot complete without accepting | MEDIUM |

---

## Anti-Features

Things deliberately excluded from this audit milestone.

| Item | Why Excluded | What Happens Instead |
|------|-------------|---------------------|
| **Cron job end-to-end execution** | Requires production Vercel cron schedule or manual trigger; timing-dependent | Document cron endpoint auth test in Phase K of findings |
| **Email delivery confirmation** | Requires live Resend API with real addresses; not testable without external dependency | Verify send_log records and status transitions; note as untestable in findings |
| **SMS delivery** | Twilio A2P pending; blocked on external approval | Document as known blocker; test SMS action logic only |
| **Stripe payment processing** | Requires live Stripe keys; not auditable in isolation | Test webhook handler logic; note Stripe test-mode as prerequisite |
| **Google OAuth in isolation** | OAuth flow requires Supabase redirect URI configured for production domain | Test on staging with correct redirect URI; note as domain-dependent |
| **Marketing / public pages** | Explicitly out of scope per milestone context | Separate marketing QA pass if needed |
| **Performance/load testing** | No user load to measure; single-user SaaS currently | Flag as future milestone after first real users |
| **Twilio webhook verification** | Phase 21-08 blocked on A2P approval | Document blocker, test signature validation logic only |
| **AI personalization quality** | Subjective; depends on OpenAI/Anthropic API availability | Verify personalization toggle setting saves; note as integration dependency |
| **Dark mode exhaustive audit** | Cosmetic; low deployment risk | Spot-check only during other category walkthroughs |
| **Accessibility WCAG AA compliance** | Extensive; not a pre-production blocker | Carry UX Audit findings forward as backlog items |
| **Cross-browser compatibility beyond Chrome** | Narrowed scope for first deploy | Firefox/Safari spot-check only |
| **Building a persistent test suite** | This milestone produces a findings report, not Playwright test files | A future "test suite" milestone is a separate body of work |

---

## Feature Dependencies

Understanding which categories block others matters for audit ordering.

```
[Auth: Category A] — must pass first
  └── [Multi-Tenant Isolation: Category B] — requires two test accounts
  └── [All dashboard categories] — require logged-in session

[Job completion workflow: Category C] — prerequisite for:
  └── [Conflict handling: Category D] — requires active enrollment to conflict against
  └── [History: Category G] — requires send_logs records
  └── [Dashboard KPIs: Category L] — requires jobs and enrollments
  └── [Campaign enrollment: Category K] — exercise enrollment from multiple angles

[Settings form token: Category I] — prerequisite for:
  └── [Public job completion form: Category F] — token must exist to test form

[Review funnel: Category E] — standalone, but:
  └── Requires a send_log with a review token to have been generated
  └── OR a manually constructed token via lib/review/token.ts test helper

[Multi-business: Category J] — prerequisite for:
  └── Verifying all other categories scope correctly after business switch
```

---

## Suggested Audit Ordering

1. **Category A** — Auth (get a working session)
2. **Category B** — Tenant isolation (set up two test accounts, verify data walls)
3. **Category I** — Settings (generate form token, set up business correctly before other tests)
4. **Category P** — Onboarding (both first-business and additional-business flows)
5. **Category C** — Core job workflow (plant seed for all downstream tests)
6. **Category D** — Conflict handling (run repeat-customer scenarios)
7. **Category E** — Review funnel (verify the money path)
8. **Category F** — Public completion form (verify technician tool)
9. **Category K** — Campaigns (pause/resume, conflict, management)
10. **Category L** — Dashboard (verify KPIs reflect all the above)
11. **Category G** — History (verify send records and bulk actions)
12. **Category H** — Billing (pooled counts, limit enforcement)
13. **Category J** — Multi-business switching (run all critical paths again under switched business)
14. **Category M** — Feedback resolution
15. **Category N** — Analytics
16. **Category O** — Customers page

---

## Confidence Assessment

| Category | Confidence | Basis |
|----------|-----------|-------|
| Auth (A) | HIGH | Supabase standard auth; middleware verified in code |
| Tenant Isolation (B) | MEDIUM | RLS verified in DATA_MODEL.md; runtime behavior needs manual verification |
| Core V2 Workflow (C) | HIGH | `createJob`, `markJobComplete`, `enrollJobInCampaign` all reviewed in code |
| Conflict Handling (D) | MEDIUM | Logic is complex state machine; needs exercise to verify all branches |
| Review Funnel (E) | HIGH | HMAC token, routing logic, enrollment stop all reviewed in code |
| Public Form (F) | HIGH | `createPublicJob` and token resolution fully reviewed; Phase 58 deliverable |
| History (G) | HIGH | Standard CRUD + filter patterns; straightforward to verify |
| Billing (H) | MEDIUM | Pooled usage logic reviewed; Stripe webhook untestable without live keys |
| Settings (I) | HIGH | Standard form patterns; tabs reviewed; token generation reviewed |
| Multi-Business (J) | MEDIUM | Cookie resolver reviewed; runtime behavior after switching needs verification |
| Campaigns (K) | MEDIUM | Pause/resume frozen enrollment logic is complex; needs end-to-end exercise |
| Dashboard (L) | MEDIUM | KPI queries reviewed; sparkline data depends on real records |
| Feedback (M) | HIGH | Straightforward resolution flow |
| Analytics (N) | MEDIUM | Depends on underlying data being correct |
| Customers (O) | HIGH | Standard CRUD; well-tested pattern from prior audits |
| Onboarding (P) | HIGH | Both flows reviewed in code; wizard state machine is well-understood |

---

## Known Audit Risks

Items that require extra scrutiny during the audit because they are new, complex, or have known
edge cases.

**1. Service-role bypass in public endpoints**
`/complete/[token]` and `/r/[token]` use service-role client which bypasses RLS. Every query
in these files must include explicit `business_id` or `customer_id` scoping. This was
implemented correctly but is a high-risk pattern that warrants manual code inspection during
the audit alongside functional testing.

**2. Business switching cache invalidation**
`switchBusiness()` calls `revalidatePath('/')` which should invalidate all cached server
component data. Verify that after switching, stale data from the previous business does not
appear. Test by switching quickly and checking if server component data refreshes.

**3. Pooled billing count across businesses**
`getPooledMonthlyUsage()` aggregates across all businesses owned by the user, not just the
active one. The billing page UI must display this correctly and the enforcement must not use the
per-business count by mistake. Verify by creating a second business and sending from both.

**4. Enrollment conflict state machine completeness**
The `enrollment_resolution` column drives conflict UI in the dashboard. There are 6 possible
values (NULL, conflict, queue_after, skipped, suppressed, replace_on_complete). Verify all
transitions are reachable and correctly surfaced in the UI. The cron `resolve-enrollment-conflicts`
endpoint auto-resolves stale conflicts after 24h — document this behavior in findings.

**5. HMAC review token expiry**
Tokens expire after 30 days. Verify that the expiry check actually fires for an expired token
(requires constructing a token with a backdated timestamp, or finding the token validation code
and inspecting the expiry logic directly).

---

*QA audit feature research for: Pre-Production Audit milestone*
*Researched: 2026-02-27*
*Confidence: HIGH — based on full codebase review + standard SaaS QA patterns*

---

Sources consulted:
- [SaaS Multi-Tenancy Architecture and Testing](https://www.qabash.com/saas-multi-tenancy-architecture-testing-2026/)
- [SaaS Application Testing Best Practices](https://www.virtuosoqa.com/post/testing-saas-applications)
- [Top Multi-Tenancy Testing Challenges](https://www.netsolutions.com/insights/multi-tenancy-testing-top-challenges-and-solutions/)
- [Implementing Secure Multi-Tenancy: Developer Checklist](https://dzone.com/articles/secure-multi-tenancy-saas-developer-checklist)
