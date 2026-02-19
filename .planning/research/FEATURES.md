# Feature Research: UI/UX Redesign (v2.5)

**Domain:** Home Service SaaS Dashboard — Warm, Friendly B2B Interface Redesign
**Researched:** 2026-02-18
**Confidence:** HIGH (based on direct codebase analysis, established design system patterns, and user-supplied UX notes)

---

## Context

This is a redesign research document, not a greenfield feature survey. All backend functionality exists.
The question is: **Which UI/UX changes to make, in what form, at what complexity level.**

User's reference: Stratify-style dashboards — warm amber/gold accents, large welcome text, colored card backgrounds, rounded elements, spacious layout. Home service tools (Jobber, Housecall Pro, ServiceTitan lite) — utility-forward but approachable.

Source of user requirements: Direct UX notes provided in the research brief, cross-referenced against
the current codebase (`/components`, `/app`) and existing UX audit (`.planning/UX-AUDIT.md`).

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in a polished SaaS dashboard. Missing these makes the product feel unfinished.

| Feature | Why Expected | Complexity | Affected Files |
|---------|--------------|------------|----------------|
| **Password visibility toggle on login** | Standard on every modern auth form; missing = feel unpolished | LOW | `components/login-form.tsx` |
| **Required field indicators (`*`)** | Users cannot tell what's required at a glance; causes form abandonment | LOW | `components/login-form.tsx`, all form components |
| **Login page illustration/image** | Split-layout login (left form, right visual) is the SaaS standard; right panel currently shows only a faded "A" letter | LOW | `components/auth/auth-split-layout.tsx` |
| **Welcome greeting on dashboard** | Every SaaS dashboard greets the user by name (Jobber: "Good morning, Mike", Stripe: "Hey, Dan"); plain "Dashboard" h1 feels cold | LOW | `app/(dashboard)/dashboard/page.tsx` |
| **Clickable stat cards with visible affordance** | Cards that link somewhere must look clickable; arrow icon on hover is standard (not translate-up effect which signals "animation" not "link") | LOW | `components/dashboard/kpi-widgets.tsx` |
| **Differentiated card hierarchy** | Top 3 KPI cards vs bottom 3 pipeline cards currently look nearly identical; visual hierarchy is expected | LOW | `components/dashboard/kpi-widgets.tsx` |
| **Empty states with actionable prompts** | Every empty data view needs context + a next step; current analytics empty state is a single line of plain text | LOW | `components/dashboard/analytics-service-breakdown.tsx`, `components/feedback/feedback-list.tsx` |
| **Campaign cards that open on click** | Cards with edit affordance should be fully clickable, not require hitting a small menu item | LOW | `components/campaigns/campaign-card.tsx` |
| **Filter visual differentiation (status vs type)** | Status filters and service type filters in Jobs page look identical; users cannot tell the groups apart | LOW | `components/jobs/job-filters.tsx` |
| **Consistent page padding** | Customers page and Jobs page have inconsistent internal padding vs other pages | LOW | `components/customers/customers-client.tsx`, `components/jobs/jobs-client.tsx` |
| **Feedback page UI consistency** | Feedback cards have different visual treatment than other list pages; looks like a different product | LOW | `components/feedback/feedback-card.tsx`, `components/feedback/feedback-list.tsx` |
| **Smart customer name field** | The customer field in Add Job accepts names OR emails but gives no affordance that it does; users try typing email and see "no results" | LOW | `components/jobs/customer-autocomplete.tsx` |
| **Service type filter shows only user's types** | Jobs filter bar shows all 8 service types regardless of what the business offers; HVAC business sees Roofing filter | LOW | `components/jobs/job-filters.tsx` |
| **Campaign edit opens in-context (panel/modal)** | Navigating away to `/campaigns/[id]/edit` breaks flow; inline editing panel is the modern SaaS pattern | MEDIUM | `app/(dashboard)/campaigns/[id]/edit/page.tsx`, `components/campaigns/campaign-card.tsx` |

---

### Differentiators (Competitive Advantage)

Features that make AvisLoop feel premium relative to its price point and competitor complexity.

| Feature | Value Proposition | Complexity | Affected Files |
|---------|-------------------|------------|----------------|
| **Warm color palette with accent color** | Current palette is pure corporate blue + grey. Adding amber/warm accent (a la Stratify) makes the product feel approachable and memorable for home service owners who respond better to warmth than corporate B2B coldness | LOW | `app/globals.css`, Tailwind config |
| **Getting started checklist as inline dashboard section** | Current setup progress is a floating pill + drawer — discoverable but disconnected. An inline dashboard section (visible, contextual) increases completion rate and teaches the V2 mental model in-context | MEDIUM | `components/dashboard/` (new section), `components/onboarding/setup-progress*.tsx` |
| **"Review your campaign" links to the actual campaign** | Checklist item "Review your campaign" currently links to `/campaigns` (list). It should detect the user's only campaign and deep-link directly to it. Specificity signals intelligence | LOW | `lib/constants/checklist.ts`, `app/(dashboard)/layout.tsx` |
| **Add Job from anywhere panel** | Dashboard should have a quick-add panel for completing a job without navigating to Jobs page — the core V2 action should be available without page-switching | MEDIUM | `app/(dashboard)/dashboard/page.tsx`, reuses `components/jobs/add-job-sheet.tsx` |
| **Color on stat cards** | Monochrome cards with a number and label feel like spreadsheet data. Light colored backgrounds (green-tinted for reviews, amber for ratings) make the numbers emotionally resonant | LOW | `components/dashboard/kpi-widgets.tsx` |
| **Onboarding consolidation (fewer steps)** | 7 steps is cognitively heavy. Merging "Review Destination" into "Business Basics" (Step 1, since it's one field), removing customer import, and merging SMS consent into the campaign step reduces wizard from 7 to 4 steps. Shorter = higher completion | MEDIUM | `components/onboarding/onboarding-wizard.tsx`, `components/onboarding/onboarding-steps.tsx`, step files |
| **Plain-English campaign description** | Campaign preset step uses technical language ("multi-touch sequence", "touch #1/2/3"). Rewrite in plain English: "We'll send 3 friendly messages — first email the next day, reminder 3 days later, SMS a week after that" | LOW | `components/onboarding/steps/campaign-preset-step.tsx` |
| **Software field as text input** | Step 4 (Software Used) forces choice from preset options; users can't continue without selecting. Making it a free-text optional field removes the blocker and captures more data | LOW | `components/onboarding/steps/software-used-step.tsx` |
| **Horizontal service tile selection** | Step 3 (Services Offered) should be horizontal icon tiles, not a vertical list or checkboxes. Visual service tiles (wrench icon for plumbing, flame for HVAC, etc.) are faster to scan and more engaging | LOW-MEDIUM | `components/onboarding/steps/services-offered-step.tsx` |
| **"Do not enroll" toggle in Add Job** | Instead of the Manual Request page, the V2 escape hatch for "don't send a review request for this job" lives directly in Add Job as a "do not enroll in campaign" checkbox. Already partially implemented; needs to be the primary surface | LOW | `components/jobs/add-job-sheet.tsx` (enrollInCampaign checkbox exists, improve visibility) |
| **Fallback modal for manual request** | After removing Manual Request nav item, edge case (send to a one-off contact) is handled via a modal accessible from the Campaigns page or a help tooltip. Not hidden, just de-emphasized | MEDIUM | New `components/campaigns/manual-request-modal.tsx`, `app/(dashboard)/campaigns/page.tsx` |
| **Name vs email smart detection in job field** | Customer autocomplete field should detect `@` in input and switch search mode from "name search" to "email search" with a visual indicator of which mode is active | LOW | `components/jobs/customer-autocomplete.tsx` |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like good UX but create complexity or contradict the V2 philosophy.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Notification count badge on nav items** | "Users should see how many things need attention" | Creates anxiety, trains users to check app constantly (V1 behavior), clutters nav | Remove nav badge. Dashboard's "Needs Attention" card is the right surface — users see it when they visit |
| **Translate-up hover on clickable cards** | "Makes cards feel interactive" | `-translate-y-1` signals "card lifts" (decorative), not "card navigates." Arrow chevron on hover is the correct affordance for navigable cards | Replace with `→` arrow icon appearing on hover |
| **Manual Request as primary nav item** | "Users need to be able to send manually" | V2 philosophy: manual sends should be de-emphasized. Keeping it in nav trains V1 behavior | Move to overflow/settings or remove; provide escape hatch via Add Job's "do not enroll" + fallback modal |
| **Google Review Link field on BOTH Business Basics and Review Destination steps** | "Make sure user enters it" | Currently duplicated — Step 1 (business basics) includes it AND Step 2 is dedicated to it. Causes confusion and "did I already enter this?" | Keep in Step 1 only; remove Step 2 entirely (merge content) |
| **All 8 service types always shown in Jobs filter** | "Let users filter by any type" | An HVAC business will never filter by Roofing; irrelevant options add cognitive noise | Filter the available chips to only the business's `service_types_enabled` list |
| **Floating pill as only setup progress surface** | "It's discoverable when they need it" | The pill is easy to ignore; new users miss it and never complete setup | Inline dashboard section that disappears when complete (both surfaces: inline + pill) |
| **Page-level navigation for campaign editing** | "Full page gives more space" | Breaking context (leaving campaign list, going to `/edit` page) fragments the editing flow | Sheet or side panel that slides over the campaign list |
| **Customers page as prominent nav item** | "Users need to see their customer list" | Keeps V1 CRM mental model alive; customers are a side effect in V2 | De-emphasize (move lower in nav, consider icon-only or removal post-v2.5) |
| **Complex password requirements list on login** | "Users forget password requirements" | Password requirements belong on the Sign Up page, not Login. Showing them on login creates confusion (user is logging in, not choosing a new password) | Show requirements on Sign Up only; on Login, just show "Incorrect password" error |

---

## Feature Dependencies

```
[Dashboard Welcome Greeting]
    └──requires──> [User name from auth session] (already available via Supabase auth)

[Clickable Stat Cards with Arrow Affordance]
    └──replaces──> [translate-up hover animation] (simple CSS swap)

[Colored Stat Card Backgrounds]
    └──enhances──> [Clickable Stat Cards] (combined implementation)

[Differentiated Bottom 3 Cards]
    └──enhances──> [Card Hierarchy] (visual only, no data changes)

[Inline Getting Started Section on Dashboard]
    └──requires──> [Existing checklist data + SetupProgress component]
    └──replaces──> [Floating pill as sole surface] (pill remains, inline added)

["Review Campaign" deep-link]
    └──requires──> [Campaign ID lookup at layout load time]
    └──depends-on──> [Existing checklist item href in lib/constants/checklist.ts]

[Add Job from Dashboard Panel]
    └──reuses──> [AddJobSheet component] (trigger from dashboard)
    └──requires──> [customers list fetched on dashboard page]

[Onboarding Consolidation to 4 Steps]
    └──removes──> Step 2 (Review Destination) — merge Google link into Step 1
    └──removes──> Step 6 (Import Jobs) — remove entirely (V2 anti-pattern)
    └──modifies──> Step 4 (Software) — text input, optional, skippable
    └──depends-on──> [OnboardingWizard step config array]

[Service Type Tiles in Onboarding Step 3]
    └──replaces──> [Checkbox list in services-offered-step.tsx]

[Plain English Campaign Language]
    └──modifies──> [campaign-preset-step.tsx text only]

[Smart Name/Email Detection in Customer Field]
    └──modifies──> [CustomerAutocomplete component] (detect @ symbol, switch search mode)

[Service Types in Job Filter (business-scoped)]
    └──requires──> [business.service_types_enabled passed as prop to JobFilters]
    └──modifies──> [job-filters.tsx, jobs-client.tsx, jobs/page.tsx data fetch]

[Campaign Card Fully Clickable]
    └──replaces──> [Link wrapping name only in campaign-card.tsx]
    └──adds──> [onClick or Link wrapper on entire card div]

[Campaign Edit as Side Panel]
    └──refactors──> [/campaigns/[id]/edit/page.tsx] (move to sheet component)
    └──requires──> [New CampaignEditSheet component]

[Manual Request Removal + Fallback Modal]
    └──removes──> ["/send" from sidebar mainNav array]
    └──adds──> [ManualRequestModal accessible from Campaigns page]
    └──enhances──> [Add Job's enrollInCampaign checkbox visibility]

[Remove Notification Count from Nav]
    └──removes──> [dashboardBadge prop threading through AppShell → Sidebar]
    └──simplifies──> [app/(dashboard)/layout.tsx data fetching]

[Login Page Illustration]
    └──replaces──> [Right panel gradient + faded "A" in auth-split-layout.tsx]

[Password Visibility Toggle]
    └──adds──> [Eye/EyeSlash button to password input in login-form.tsx]

[Analytics Empty State with Action Prompt]
    └──replaces──> [single plain text line in analytics-service-breakdown.tsx]

[Feedback UI Consistency]
    └──modifies──> [feedback-card.tsx styling to match Jobs/Customers card patterns]
```

### Dependency Notes

- **Dashboard welcome greeting requires no new data:** Auth user's email/name is available from Supabase session in the server component. First name extraction from email or profile is sufficient.
- **Onboarding consolidation is the highest-risk item:** Removing steps changes the step index throughout the wizard shell, step navigation logic, and URL params. Must be done carefully. Estimated 4-6 hours.
- **Campaign card clickability conflicts with Switch toggle:** The entire card cannot be a `<Link>` if it contains an interactive Switch. Pattern: onClick on the card div opens the edit panel; Switch and dropdown menu have `e.stopPropagation()`.
- **Service type scoping in Jobs filter requires data plumbing:** `service_types_enabled` must travel from `jobs/page.tsx` (server, already fetches business data) down to `JobFilters`. Low complexity, but touches 3 files.
- **Manual Request removal:** The `/send` route should not be deleted — it handles edge cases and may be linked from existing emails. Just remove from nav and add friction via a warning banner on the page.

---

## MVP Definition (for v2.5 Redesign Milestone)

### Launch With (Redesign Phase 1 — Visual & Quick Wins)

Changes that are purely presentational or low-risk, no data model changes.

- [ ] **Login page illustration** — Replace faded "A" with a real image or styled visual panel
- [ ] **Password visibility toggle** — Eye icon in password field
- [ ] **Required field indicators** — `*` labels on required form fields
- [ ] **Dashboard welcome greeting** — "Good morning, [First Name]" with time-based salutation
- [ ] **Clickable stat card affordance** — Replace translate-up with arrow chevron on hover
- [ ] **Colored stat card backgrounds** — Light tinted backgrounds per card (green/amber/blue)
- [ ] **Differentiated bottom 3 cards** — Visual treatment to separate pipeline cards from outcome cards
- [ ] **Remove nav notification badge** — Remove dashboardBadge prop threading
- [ ] **Analytics empty state with action** — Replace plain text with icon + heading + CTA
- [ ] **Feedback UI consistency** — Match feedback-card.tsx to jobs/customers visual patterns
- [ ] **Consistent padding on Customers + Jobs pages** — Normalize to `container mx-auto py-6 px-4`
- [ ] **Campaign card fully clickable** — Entire card div triggers edit (with stopPropagation on controls)
- [ ] **Filter group visual differentiation** — Separator + label between Status and Service Type filters

### Add After Quick Wins (Redesign Phase 2 — Interaction & Flow)

Higher effort, require component refactors or data plumbing.

- [ ] **Campaign edit as slide-in panel** — New CampaignEditSheet, remove separate edit page navigation
- [ ] **Service type filter scoped to business** — Pass `service_types_enabled` to JobFilters
- [ ] **Smart name/email detection** — CustomerAutocomplete detects `@` and switches search mode
- [ ] **"Review your campaign" deep-link** — Look up first campaign ID, deep-link to it in checklist
- [ ] **Inline getting started section on dashboard** — Dashboard section above KPIs for new users
- [ ] **Add Job from dashboard panel** — Quick-add trigger on dashboard page
- [ ] **Manual Request removal + fallback** — Remove from nav, add modal escape hatch on Campaigns page
- [ ] **Plain English campaign language** — Rewrite campaign-preset-step.tsx copy

### Future Consideration (Redesign Phase 3 — Onboarding)

Higher risk due to step restructuring, deferred to validate Phase 1-2 first.

- [ ] **Onboarding consolidation (7 → 4 steps)** — Merge/remove steps, restructure wizard
- [ ] **Horizontal service type tiles** — Replace checkbox list in services-offered-step.tsx
- [ ] **Software field as free text** — Replace dropdown with text input, make fully optional
- [ ] **Warm accent color addition** — Add amber/gold CSS variable to design system

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Dashboard welcome greeting | HIGH | LOW | P1 |
| Password visibility toggle | HIGH | LOW | P1 |
| Login illustration | HIGH | LOW | P1 |
| Required field indicators | HIGH | LOW | P1 |
| Clickable stat card affordance (arrow) | HIGH | LOW | P1 |
| Colored stat card backgrounds | HIGH | LOW | P1 |
| Remove nav notification badge | MEDIUM | LOW | P1 |
| Analytics empty state with action | MEDIUM | LOW | P1 |
| Feedback UI consistency | MEDIUM | LOW | P1 |
| Consistent page padding | LOW | LOW | P1 |
| Campaign card fully clickable | HIGH | LOW | P1 |
| Filter group visual differentiation | MEDIUM | LOW | P1 |
| Differentiated bottom 3 cards | MEDIUM | LOW | P1 |
| Campaign edit as side panel | HIGH | MEDIUM | P2 |
| Service type filter scoped to business | HIGH | LOW | P2 |
| Smart name/email detection | MEDIUM | LOW | P2 |
| "Review campaign" deep-link | MEDIUM | LOW | P2 |
| Inline getting started section | HIGH | MEDIUM | P2 |
| Add Job from dashboard panel | HIGH | MEDIUM | P2 |
| Manual request removal + fallback modal | MEDIUM | MEDIUM | P2 |
| Plain English campaign language | MEDIUM | LOW | P2 |
| Onboarding consolidation (7→4 steps) | HIGH | HIGH | P3 |
| Horizontal service type tiles | MEDIUM | MEDIUM | P3 |
| Software field as free text | MEDIUM | LOW | P3 |
| Warm accent color (amber/gold) | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch — quick wins that immediately improve the product feel
- P2: Should have — meaningful interaction improvements, moderate effort
- P3: Larger refactors — defer until P1/P2 is stable

---

## Competitor Feature Analysis

| Feature | Jobber | Housecall Pro | Our Approach |
|---------|--------|--------------|--------------|
| Dashboard greeting | "Hi [Name]" with quick stats | "Welcome back, [Name]" banner | Contextual time-based greeting + first name |
| Stat cards | Colored backgrounds per metric | Flat with border-left accent color | Light tinted backgrounds + arrow affordance |
| Empty states | Illustration + clear CTA | Icon + heading + single action button | Icon + heading + action CTA matching V2 language |
| Onboarding | 3-4 steps, skippable | 5 steps with progress dots | Consolidate to 4 steps, remove V1 patterns |
| Campaign management | Full page editor | Modal/drawer editor | Slide-in panel (keeps context) |
| Getting started | Persistent sidebar checklist | Dashboard card that fades out | Inline dashboard section + floating pill |
| Mobile FAB | Prominent "New Job" button | Persistent bottom CTA | Already built; ensure primary styling |

---

## Page-by-Page Feature Requirements

### Login / Auth Pages

**Problems:** No visual personality on right panel, no password eye, no clear field requirements.

**Required changes:**
1. Right panel: Replace gradient + faded "A" with product screenshot, illustration, or testimonial card
2. Password field: Add eye/eye-slash toggle button (right side of input)
3. Required fields: Asterisk `*` on email and password labels
4. Error messaging: Use destructive banner, not inline text (for consistency with rest of app)

**What NOT to add here:** Password requirements checklist. That belongs on Sign Up only.

---

### Dashboard Page

**Problems:** Cold "Dashboard" heading, no greeting, identical-looking cards, translate-up hover is confusing, no color, bottom 3 cards not differentiated, no setup progress inline, no quick Add Job.

**Required changes:**
1. Replace `<h1>Dashboard</h1>` with `<h1>Good morning, {firstName}</h1>` (time-aware)
2. Top 3 KPI cards: Add light tinted background per card type (green for reviews, amber for rating, blue for conversion)
3. Top 3 KPI cards: Replace `-translate-y-1` hover with `→` arrow appearing in top-right on hover
4. Bottom 3 pipeline cards: Visual treatment to distinguish from top 3 (e.g., smaller, no background color, or grouped under a subtle "Pipeline" heading)
5. Inline "Getting Started" section: Show when `!setupProgress.allComplete && !setupProgress.dismissed`, above KPIs
6. "Add Job" quick panel: Accessible from dashboard (button that opens AddJobSheet with customers pre-loaded)
7. Remove attention badge from Dashboard nav item (alerts visible within the page itself)

---

### Getting Started Checklist

**Problems:** "Review your campaign" links to `/campaigns` list, not the actual campaign. Should feel smart.

**Required changes:**
1. `campaign_reviewed` checklist item: Look up user's first active campaign ID server-side; set `href` to `/campaigns/{id}` dynamically
2. Progress drawer: When "Review your campaign" is clicked, open campaign detail directly
3. Consider renaming "Review your campaign" → "Customize your first campaign" (more action-oriented)

**Implementation note:** `lib/constants/checklist.ts` currently has a static `href: '/campaigns'`. The dashboard layout (or a server component) needs to fetch the first campaign ID and inject it.

---

### Jobs Page

**Problems:** Service type filter shows all 8 types (not just enabled), filter groups not visually distinct, padding inconsistency, create job bug (likely related to form submission), can't visually differentiate the field type (name vs email).

**Required changes:**
1. `job-filters.tsx`: Accept `enabledServiceTypes: ServiceType[]` prop; filter service type chips to only show enabled ones
2. `job-filters.tsx`: Add visual separator + label between Status group ("Status:") and Service Type group ("Service:")
3. `jobs-client.tsx` / `jobs/page.tsx`: Pass `business.service_types_enabled` down to JobFilters
4. `customer-autocomplete.tsx`: Detect `@` in query, switch to email-search mode with `(email)` indicator text
5. Padding: Standardize to `py-6 px-4` matching dashboard and campaigns pages
6. Investigate create job bug (form submission state/navigation issue) — separate bug fix

---

### Campaigns Page

**Problems:** Campaign cards are not clickable (only name has a link), edit requires full-page navigation, back button hit area too large (from edit page), can't save changes bug.

**Required changes:**
1. `campaign-card.tsx`: Make entire card div clickable (opens edit panel); controls (Switch, dropdown) use `e.stopPropagation()`
2. Create `CampaignEditSheet` component: Slide-in right panel with the campaign form content
3. `campaigns/[id]/edit/page.tsx`: Redirect to `/campaigns` with panel open, or keep as fallback
4. Investigate can't save changes bug — likely a Server Action state issue

**Pattern for whole-card-clickable with internal controls:**
```
<div onClick={handleOpenEdit} className="cursor-pointer ...">
  {/* card content */}
  <Switch onClick={(e) => e.stopPropagation()} ... />
  <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} ... />
</div>
```

---

### Analytics Page

**Problems:** Empty state is a single line of muted text with no icon, heading, or action.

**Required changes:**
1. `analytics-service-breakdown.tsx`: Replace text-only empty state with full empty state pattern:
   - Icon (ChartBar from Phosphor, 48px)
   - Heading: "No data yet"
   - Description: "Once your campaign sends its first message, your analytics will appear here."
   - CTA button: "View your campaign" → `/campaigns`
2. Consider adding a mini-empty-state when specific service types have no data (row-level context)

---

### Customers Page

**Problems:** Padding inconsistency vs other pages. Empty state copy still V1-flavored.

**Required changes:**
1. Normalize padding to match dashboard/jobs pages
2. Verify empty state copy is V2-aligned (should be: "Customers appear here as you complete jobs. Add your first job to get started." with CTA to Jobs page)

---

### Manual Request Page (`/send`)

**Decision: Eliminate from navigation, keep the route.**

**Required changes:**
1. Remove `{ icon: PaperPlaneTilt, label: 'Manual Request', href: '/send' }` from `sidebar.tsx` mainNav
2. Remove from `bottom-nav.tsx`
3. Add a "Do Not Enroll in Campaign" prominence in Add Job sheet (already exists as `enrollInCampaign` checkbox — make it more visible, not buried)
4. Add a minimal "Manual Request" modal accessible from Campaigns page for the edge case (one-off send to a customer who will never return)
5. Keep `/send` route alive but add a banner: "Campaigns handle this automatically. Use manual requests only for one-off exceptions."

---

### Feedback Page

**Problems:** UI feels like a different product; feedback cards don't match visual language of jobs/customers.

**Required changes:**
1. `feedback-card.tsx`: Use the same `rounded-lg border bg-card` pattern as campaign-card and job rows
2. Ensure consistent padding, action button placement (bottom-right), and typography scale
3. Empty state: Already uses the standard pattern (`ChatCircle` icon + text) — verify it looks correct

---

### Onboarding Wizard

**Problems:** 7 steps too many; Google link duplicated; software field blocks progress; "Import Jobs" is V2-anti-pattern; services should be visual tiles; campaign language is technical.

**Proposed restructure (7 → 4 steps):**

| Old Step | New Step | Change |
|----------|----------|--------|
| 1: Business Basics | 1: Business Basics (expanded) | Add Google review link field here |
| 2: Review Destination | REMOVED | Merged into Step 1 |
| 3: Services Offered | 2: Services Offered | Redesign as horizontal icon tiles |
| 4: Software Used | 3: Software (optional) | Change to free-text input, fully skippable, no "must skip" |
| 5: Campaign Preset | 4: Campaign Setup | Rewrite in plain English |
| 6: Import Jobs | REMOVED | V2 anti-pattern |
| 7: SMS Consent | Append to Step 4 | Combine with campaign step (it's about automation, same context) |

**Risk:** Step IDs referenced throughout wizard shell and URL params. Must update all references.

---

## Sources

- Codebase direct analysis (all components and pages surveyed 2026-02-18)
- UX notes from user (provided in research brief — HIGH confidence, direct requirements)
- Existing UX Audit at `.planning/UX-AUDIT.md` (2026-02-05, comprehensive component-level analysis)
- V2 Philosophy at `.planning/V1-TO-V2-PHILOSOPHY.md` (canonical product direction)
- Jobber and Housecall Pro UI patterns (established home service SaaS dashboard conventions — MEDIUM confidence from training knowledge, architecture knowledge cutoff Aug 2025)
- Stratify reference (user-supplied — warm dashboard design pattern for emotional tone)

---

*Feature research for: AvisLoop v2.5 UI/UX Redesign*
*Researched: 2026-02-18*
*Context: Subsequent milestone. All backend functionality exists. Research focus is on UI/UX changes.*
