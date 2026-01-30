# Phase 16: Onboarding Redesign + Google Auth - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the authentication pages (login/signup), onboarding wizard, and post-onboarding dashboard experience. Add Google OAuth as an auth provider. Replace the current dashboard onboarding checklist with 3 guided test step cards. The onboarding wizard collects business info only (2 steps); contact creation, template creation, and test sending move to dashboard cards.

Scope includes: login/signup page redesign, Google OAuth integration, onboarding wizard redesign (welcome screen + 2 steps), dashboard onboarding cards (3 test steps), test mode mechanics for sends.

Does NOT include: new features, additional OAuth providers, changes to the core sending flow, or modifications to billing/quota systems beyond test send exclusion.

</domain>

<decisions>
## Implementation Decisions

### Login/Signup Layout
- Both login and signup use the same split layout: form on left, image on right
- Right side shows a product screenshot (dashboard or feature preview)
- Google OAuth button appears below the email/password form with an "OR CONTINUE WITH" divider
- Google only (no GitHub or other providers)
- Signup page has same split layout, just different form content (add name field, confirm password)

### Onboarding Wizard Flow
- **2-step wizard** (reduced from current 3 steps):
  - Step 1: Business name (required)
  - Step 2: Google review link (optional, can skip)
- Contact creation and test send are removed from the wizard — they move to dashboard cards
- Progress indicator: horizontal bar at bottom of page with step counter ("1/2", "2/2")
- Form layout: large centered heading, subtitle text, inline row with Back button + labeled input (with placeholder) + Continue/Finish button
- Labels allowed above the input field in addition to placeholder text
- After wizard completes, redirect to dashboard where test step cards appear

### Welcome Screen
- Claude's discretion on whether to include a welcome/splash screen before step 1
- If included, follows the reference pattern (image + greeting + "Get Started" button)

### Dashboard Onboarding Cards
- 3 numbered cards replace the current onboarding checklist:
  1. "Create a test contact" — navigates to /contacts
  2. "Create a message template" — navigates to /dashboard/settings (template section)
  3. "Send a test review request" — navigates to /send
- Cards navigate to existing pages (no modals or dedicated test pages)
- Sequential but accessible: cards show recommended order (01, 02, 03), all clickable, but warnings if prerequisites are missing (e.g., "Create a contact first" if trying step 3 without a contact)
- Cards styled with existing design system (adapted from reference, not pixel-perfect copy)
- Each card has: number label, icon (Phosphor), descriptive text, arrow indicator, completion checkbox/circle
- On completion of all 3: brief celebration/success state, then cards disappear on next page load

### Test Contact
- Test contact is kept as a real contact — no cleanup, no flagging
- User can manually delete it from the contacts page if they want
- Simplest approach: just a normal contact created through the existing flow

### Test Template
- Claude's discretion: either create a real template the user keeps, or show a pre-filled template the user can customize and save

### Test Send Mechanics
- Claude's discretion on implementation approach:
  - Option A: Flag send as `is_test` in send_logs, exclude from monthly quota count
  - Option B: Don't call Resend API (simulate), zero quota impact
  - Option C: Grant 1 free test send allowance per new account
- Claude should pick the simplest reliable approach that gives the user confidence the system works

### Claude's Discretion
- Welcome screen inclusion and design
- Test send mechanics (flag vs simulate vs free allowance)
- Test template approach (real vs pre-filled)
- Exact card completion tracking mechanism (DB field, localStorage, or onboarding status extension)
- Celebration animation/message style on completing all 3 steps
- Product screenshot selection/placeholder for login page right panel

</decisions>

<specifics>
## Specific Ideas

- Reference login page: "humyn" brand style — clean white background, minimal form, scenic image right side, "OR CONTINUE WITH" divider pattern
- Reference onboarding: centered large serif-style heading, muted subtitle, inline form row (Back | Input | Continue), thick progress bar at bottom
- Reference dashboard cards: numbered "01. 02. 03." with icons (AddressBook, NotePencil, PaperPlaneTilt), circle checkbox top-right, arrow bottom-right
- Current onboarding checklist component at `components/dashboard/onboarding-checklist.tsx` should be replaced by the new 3-card design
- Current wizard at `components/onboarding/` needs redesign but core server actions (updateBusiness, markOnboardingComplete) can be reused
- Existing Supabase auth actions in `lib/actions/auth.ts` need Google OAuth addition
- Middleware at `middleware.ts` already handles auth redirects — needs no changes for OAuth

</specifics>

<deferred>
## Deferred Ideas

- GitHub OAuth or other providers — can be added later if needed
- Email verification redesign — not in scope for this phase
- Onboarding analytics/tracking — separate concern

</deferred>

---

*Phase: 16-onboarding-redesign*
*Context gathered: 2026-01-30*
