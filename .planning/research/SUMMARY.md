# Project Research Summary

**Project:** AvisLoop v2.5 — Warm Design System Overhaul
**Domain:** UI/UX redesign of existing Next.js + Tailwind + shadcn/ui SaaS dashboard (no new backend)
**Researched:** 2026-02-18
**Confidence:** HIGH

## Executive Summary

AvisLoop v2.5 is a design system overhaul and UX polish milestone — all backend functionality exists, and every change is confined to CSS variables, component variants, and UI flow. The recommended approach requires zero new npm dependencies. The existing stack (Tailwind CSS 3.4 + CSS custom properties + CVA + shadcn/ui) is already the correct architecture for this kind of change: updating `globals.css` propagates a new warm palette automatically to every component, CVA variant additions to `card.tsx` are non-breaking, and new UI components (`PasswordInput`, `SmartField`) compose cleanly from existing primitives.

The redesign has two parallel threads that must be sequenced carefully. Thread 1 is the warm palette migration — update CSS token values, then fix hardcoded hex overrides in six specific component files before any visual validation. This order matters: auditing and replacing hardcoded values must happen before changing token values, not after, or components using `bg-[#F2F2F2]` and `bg-white` will stay cold while the rest of the app warms. Thread 2 is structural UX work — onboarding consolidation (7 to 5 steps), Manual Request page elimination with modal fallback, and campaign card interaction improvements. The structural changes carry more implementation risk than the palette migration and must be sequenced last.

The top risk is not the palette migration itself — it is the side effects of amber as a primary action color. Amber at typical "warm and inviting" lightness (HSL L 55-70%) fails WCAG AA contrast on white backgrounds. Two researchers independently converged on the same solution: keep blue as the interactive primary (action buttons, focus rings), use amber exclusively as an accent and surface tint. This is a firm constraint, not a preference. Any deviation requires new contrast calculations before implementation. The secondary risk is the Manual Request page removal — five server-side queries must be traced to new homes before the page is deleted, or the dashboard loses real-time data it currently depends on.

## Key Findings

### Recommended Stack

Zero new dependencies. All changes are design token and component-variant work within the existing stack.

**Core technologies (unchanged):**
- **Tailwind CSS 3.4.1** — Utility classes; HSL CSS variable system already in place; `tailwind.config.ts` token indirection means palette change requires only `globals.css` edit
- **CSS custom properties (native)** — The single source of truth for all colors; `hsl(var(--token))` indirection throughout means one-file change propagates everywhere automatically
- **class-variance-authority (CVA) 0.7.1** — Already used in `button.tsx`; adding CVA to `card.tsx` is additive and backward-compatible
- **next-themes 0.4.6** — Dark mode via `.dark` CSS class on `<html>`; no changes needed; all new CSS must use `.dark {}` class selectors, never `@media (prefers-color-scheme: dark)`
- **@phosphor-icons/react 2.1.10** — Already installed; `Eye` and `EyeSlash` icons available for `PasswordInput` with no additional import

**Two new semantic tokens (only additions to `tailwind.config.ts`):**
- `--highlight` / `--highlight-foreground` — Amber-tinted surface for callout cards, attention banners, KPI card accents
- `--surface` / `--surface-foreground` — Warm cream panels for form containers, onboarding sections

**What NOT to add:**
- `@radix-ui/colors` — Fixed scales conflict with the semantic token approach
- `framer-motion` — `tailwindcss-animate` handles all needed hover/transition animations
- Any color computation library (`chroma.js`, `open-props`) — HSL values are specified directly; no runtime color math needed

**Note on STACK.md discrepancy:** The two research files (STACK.md and ARCHITECTURE.md) propose slightly different approaches to the primary color. STACK.md recommends keeping blue as primary (`213 60% 42%`) and using amber only as `--accent`. ARCHITECTURE.md proposes making amber the primary (`38 92% 40%`). The STACK.md approach is correct. Amber on white fails WCAG AA at the lightness values that look "warm" — this is verified with contrast math. Blue as primary for action elements (buttons, links, focus rings) + amber as accent (surfaces, callouts) is the only WCAG-compliant combination that delivers the warm visual feel.

### Expected Features

Features are organized by research confidence level. All items below are directly sourced from codebase inspection and explicit user requirements — not inferred.

**Must have (table stakes — users expect these in any polished SaaS dashboard):**
- Password visibility toggle on login — standard on every modern auth form; currently missing
- Required field indicators (`*`) — users cannot tell required from optional; causes form abandonment
- Login page right-panel illustration — split-layout login is the SaaS standard; currently shows faded "A" letter
- Dashboard welcome greeting ("Good morning, [First Name]") — Jobber, Stripe, every competitor does this
- Clickable stat card affordance — arrow chevron on hover, not translate-up lift (translate signals decoration, not navigation)
- Filter group visual differentiation on Jobs page — Status filters and Service Type filters currently look identical

**Should have (differentiators at the v2.5 price point):**
- Warm color palette with amber/gold accent — makes the product feel approachable to home service owners vs. corporate B2B coldness
- Colored stat card backgrounds — green/amber/blue tints make metrics emotionally resonant, not spreadsheet-like
- Inline Getting Started section on dashboard — current floating pill is easy to ignore; inline section above KPIs increases completion rate
- Campaign card fully clickable — entire card opens edit, not just the name link
- Service type filter scoped to business's enabled types — HVAC business shouldn't see Roofing filter
- Smart name/email detection in customer autocomplete — detects `@` and switches search mode with visual indicator
- Onboarding consolidation (7 to 5 steps) — fewer steps = higher completion; see Architecture section for exact mapping
- Manual Request removal from nav + modal fallback on Campaigns page — advances V2 philosophy without eliminating edge-case capability

**Defer to v2.6+:**
- Horizontal service type tiles in onboarding (icon tiles vs. checkbox list) — medium implementation effort, low criticality for v2.5
- Full Phosphor icon migration (27 files still use Lucide) — correct direction but not v2.5 scope
- Campaign edit as full slide-in panel replacing separate edit page — correct direction but the underlying campaign save bug must be fixed first in isolation
- Consider hiding Customers page from nav entirely — track usage data first before removing

**Anti-features (do not build):**
- Notification count badge on nav items — creates anxiety, trains V1 "check the app" behavior; dashboard attention cards are the right surface
- Manual Request as primary nav item — contradicts V2 philosophy; keeping it in nav trains V1 mental model
- Translate-up hover on clickable cards — `-translate-y-1` signals "lift/decoration", not "navigates"; arrow chevron is the correct affordance
- Google Review Link field duplicated across Step 1 and Step 2 of onboarding — already in Step 1; Step 2 is redundant and confusing

### Architecture Approach

The architecture for this milestone is intentionally constrained: no data model changes, no new routes (except removing `/send`), no Server Action changes. All changes live in `components/`, `app/globals.css`, and `tailwind.config.ts`. The existing component boundaries are clean — design logic is not mixed into business logic — which makes this overhaul surgical rather than systemic.

**Major components and their changes:**

1. **`app/globals.css`** — Full replacement of `:root` and `.dark` token blocks; warm cream background (`36 20% 96%`), warm near-black foreground (`24 10% 10%`), soft blue primary (`213 60% 42%`), amber accent (`38 92% 50%`); two new tokens (`--highlight`, `--surface`) added additively

2. **`components/ui/card.tsx`** — Add CVA `cardVariants` with six variants (`default`, `amber`, `blue`, `green`, `red`, `ghost`, `subtle`); update `InteractiveCard` to remove `-translate-y-1` lift in favor of `hover:shadow-sm`; both changes backward-compatible (existing usages unaffected)

3. **`components/ui/password-input.tsx`** (new) — Wraps existing `Input` + `Button` with `Eye`/`EyeSlash` toggle state; applied to `login-form.tsx`, `sign-up-form.tsx`, `update-password-form.tsx`

4. **`components/ui/smart-field.tsx`** (new) — Type-detecting input that identifies name/email/phone from input pattern; used in the manual request modal's customer lookup field

5. **`components/send/quick-send-modal.tsx`** (new) + **`components/send/quick-send-form.tsx`** (extracted) — Replaces the full `/send` page; `QuickSendForm` is extracted from `QuickSendTab` and reused in a `Dialog` wrapper; modal appears on Campaigns page and Customer detail drawer

6. **Onboarding wizard** — Step array in `onboarding-wizard.tsx` and switch in `onboarding-steps.tsx` reduced from 7 to 5 steps; Step 2 (Review Destination) removed (Step 1 already collects the Google link field); Step 4 (Software Used) removed (no active integration exists); `STORAGE_KEY` must be versioned to `'onboarding-draft-v2'` to prevent draft corruption

7. **`components/layout/sidebar.tsx` and `bottom-nav.tsx`** — Remove "Manual Request" / "Send" nav items; replace `bg-[#F2F2F2]`, `bg-white`, `border-[#E2E2E2]` with token-based utilities

**Dependency map (simplified):**
```
globals.css palette change
    └── auto-propagates to all components using CSS variable tokens
    └── hardcoded hex in sidebar.tsx, app-shell.tsx, page-header.tsx must be manually replaced

card.tsx CVA variants
    └── kpi-widgets.tsx (arrow indicators on InteractiveCard)
    └── send-page-client.tsx (amber banner → Card variant="amber")

password-input.tsx (new)
    └── login-form.tsx, sign-up-form.tsx, update-password-form.tsx

quick-send-form.tsx (extracted)
    └── quick-send-modal.tsx (new)
        └── campaigns-page-client.tsx, customer-detail-drawer.tsx

onboarding-wizard.tsx STEPS array
    └── onboarding-steps.tsx switch statement
```

### Critical Pitfalls

From PITFALLS.md, the pitfalls that would cause production regressions or block the milestone:

1. **Hardcoded hex values bypass the token system** — Six specific locations (`sidebar.tsx`, `app-shell.tsx`, `page-header.tsx`) use `bg-[#F2F2F2]`, `bg-white`, `border-[#E2E2E2]` instead of `bg-muted`, `bg-card`, `border-border`. These must be replaced BEFORE changing CSS variable values, not after. Avoidance: Run `grep -rn "bg-\[#\|text-\[#\|border-\[#" components/` and resolve all hits to zero before touching `globals.css`.

2. **Amber text on white fails WCAG AA** — `hsl(38 92% 50%)` (#F59E0B) on white is 2.2:1 contrast — hard fail. Amber must be used as a surface background (with dark amber text via `--highlight-foreground`) or as a decorative accent, never as text color on light backgrounds. Primary buttons stay blue. Avoidance: Run contrast checks on every new foreground/background token pair before finalizing.

3. **Dark mode requires independent calibration, not lightness inversion** — Warm hues (hue ~35) behave differently from blues under lightness inversion. A naive port of the light mode amber to dark mode produces muddy brown, not warm gold. Use higher saturation in dark mode (`35 95% 65%` instead of `35 90% 55%`). Avoidance: Validate dark mode on all 8 dashboard pages before merging palette change.

4. **Manual Request page removal must trace all five server queries first** — `app/(dashboard)/send/page.tsx` fetches `getMonthlyUsage`, `getResponseRate`, `getNeedsAttentionCount`, `getRecentActivity`, `getResendReadyCustomers`. Deleting the page without migrating these queries breaks the dashboard attention count and the sidebar notification badge. Avoidance: Redirect `/send` to `/campaigns` as a first step; deploy the modal; verify the data still flows; only then remove the redirect.

5. **Onboarding step removal requires draft storage key versioning** — `localStorage` stores draft data indexed by step number. Removing steps 2 and 4 shifts all subsequent step IDs. Existing users with partial drafts will land on the wrong step or trigger Zod validation failures. Avoidance: Increment `STORAGE_KEY` from `'onboarding-draft'` to `'onboarding-draft-v2'`; existing drafts are cleanly abandoned on first load.

6. **Campaign form functional bugs must be fixed before any visual redesign of that section** — The campaign form has known save bugs (touch sequences not persisting). Redesigning the form layout before isolating the bug entangles the functional fix with the visual diff. Avoidance: File and merge a targeted bug-fix PR for campaign saves before opening any visual redesign PR for that section.

7. **Status badge distinguishability collapses in a warm palette** — The `status-clicked` badge is currently amber-orange. In a warm amber palette, it reads as "normal/background-level" rather than a meaningful state. Avoidance: Display all five status badges side-by-side on the new warm background during QA; adjust `--status-clicked-*` hue toward orange-red if the badge loses semantic distinctiveness.

## Implications for Roadmap

The four research files converge on the same build order. Changes must be sequenced so each phase produces a shippable, visually coherent increment — not a half-warm, half-cold UI.

### Phase 1: Token Audit and Hardcoded Color Replacement

**Rationale:** This is the prerequisite for everything. The palette cannot change until every hardcoded color is converted to a token. Doing this first means the CSS variable update in Phase 2 propagates cleanly to every component.

**Delivers:**
- Full grep audit of `bg-[#`, `text-[#`, `border-[#`, `bg-white`, `bg-black` — zero hits after completion
- `sidebar.tsx` active/hover state converted from `bg-[#F2F2F2]` to `bg-muted`
- `app-shell.tsx`, `page-header.tsx` background colors converted to tokens
- Inline semantic colors (`bg-amber-50`, `bg-blue-50`, etc. in billing, campaigns, notification-bell) converted to token-based equivalents or documented for Phase 3 cleanup

**Avoids:** Pitfall 1 (hardcoded hex bypass), Pitfall 9 (sidebar active state regression)

**Research flag:** No deeper research needed — this is a find-replace audit with verified file targets from ARCHITECTURE.md.

---

### Phase 2: Warm Palette Token Replacement (CSS Variables)

**Rationale:** After Phase 1, every component uses tokens. Now updating `globals.css` propagates the warm palette everywhere at once. Dark mode tokens are calibrated independently in this same phase.

**Delivers:**
- Full replacement of `:root` and `.dark` blocks in `globals.css`
- Two new semantic tokens (`--highlight`, `--highlight-foreground`, `--surface`, `--surface-foreground`) in `globals.css` and `tailwind.config.ts`
- `--radius` bumped from `0.5rem` to `0.625rem` for slightly softer corners
- All WCAG contrast pairs verified (primary button text, muted-foreground on background, each status badge)
- Dark mode visual review across all 8 dashboard pages
- Status badge five-way side-by-side visual test on new warm background

**Avoids:** Pitfall 2 (amber text contrast failure), Pitfall 3 (muddy dark mode), Pitfall 8 (status badge distinguishability), Pitfall 10 (next-themes class vs. media query), Pitfall 11 (button foreground contrast)

**Research flag:** No deeper research needed — HSL values are specified in STACK.md with contrast ratios pre-computed.

---

### Phase 3: Card Variants and Dashboard Quick Wins

**Rationale:** With the palette stable, add CVA variants to `Card` and then apply them to the components that need colored backgrounds. The dashboard quick wins (greeting, arrow affordance on KPI cards, colored card backgrounds, differentiated bottom row, remove nav badge) are all low-risk visual changes that can ship together.

**Delivers:**
- `card.tsx` updated with CVA variants (`amber`, `blue`, `green`, `red`, `ghost`, `subtle`) — backward-compatible
- `InteractiveCard` hover changed from `-translate-y-1` to `hover:shadow-sm` + `group` class for arrow pattern
- Dashboard welcome greeting ("Good morning, [First Name]") from Supabase session
- KPI cards: colored tinted backgrounds (green for reviews, amber for rating, blue for conversion) + arrow indicators on hover
- Bottom 3 pipeline cards: visual treatment to differentiate from outcome cards
- Nav notification badge removed from Dashboard sidebar item
- Analytics empty state: replace single-line text with full icon + heading + CTA pattern
- Feedback page card styling aligned with jobs/customers visual language
- Consistent padding on Customers and Jobs pages

**Avoids:** Pitfall 5 (anti-pattern of separate AmberCard/BlueCard components)

**Research flag:** Standard patterns — no deeper research needed.

---

### Phase 4: Form Component Enhancements

**Rationale:** Independent of all card/palette changes. Can run in parallel with Phase 3 if bandwidth exists. These are discrete new components with no cross-dependencies.

**Delivers:**
- `components/ui/password-input.tsx` (new) — Eye/EyeSlash toggle, `tabIndex={-1}` on toggle, Phosphor icons
- `login-form.tsx`, `sign-up-form.tsx`, `update-password-form.tsx` updated to use `PasswordInput`
- Required field indicators (`*`) on all form fields across auth and onboarding
- Input height bumped from `h-9` (36px) to `h-10` (40px) for improved touch targets
- Login page right panel: replace faded "A" gradient with product screenshot or illustration

**Avoids:** No specific pitfall — this is additive work with clear, bounded scope.

**Research flag:** No deeper research needed — component architecture fully specified in ARCHITECTURE.md.

---

### Phase 5: Jobs Page and Campaign Page UX Fixes

**Rationale:** These fixes require data plumbing (passing `service_types_enabled` to `JobFilters`) or interaction changes (campaign card clickability). More implementation surface than Phase 3 quick wins. Keep separate so Phase 3 ships first and validates the palette change.

**Delivers:**
- `job-filters.tsx`: Filter service type chips to only show `business.service_types_enabled` (data plumbed from `jobs/page.tsx`)
- `job-filters.tsx`: Visual separator + label between Status and Service Type filter groups
- `customer-autocomplete.tsx`: Smart `@` detection switching from name-search to email-search mode with type indicator
- `campaign-card.tsx`: Entire card clickable with `e.stopPropagation()` on Switch and DropdownMenuTrigger
- Campaign "Review your campaign" checklist item: deep-links to user's specific campaign ID, not `/campaigns` list
- Plain-English rewrite of campaign preset step copy (remove "multi-touch sequence", "touch #1/2/3" language)

**Avoids:** Pitfall 7 (campaign form bugs entangled with visual changes — do not redesign campaign form layout here, only fix clickability)

**Research flag:** No deeper research needed. The campaign save bug must be filed separately and resolved before any campaign form layout work. This phase avoids campaign form layout entirely.

---

### Phase 6: Onboarding Consolidation (7 to 5 Steps)

**Rationale:** Highest-risk structural change in the milestone. Deferred until palette, card variants, and form components are stable so the onboarding wizard is visually correct when the step restructure ships.

**Delivers:**
- `STORAGE_KEY` bumped to `'onboarding-draft-v2'` (draft versioning, prevents corruption)
- `STEPS` array in `onboarding-wizard.tsx` reduced to 5: Business Setup (1), Services (2), Campaign Preset (3), Import Past Jobs (4), SMS Consent (5)
- `onboarding-steps.tsx` switch updated to new numbering
- Step 2 (Review Destination) removed — `BusinessBasicsStep` already collects `google_review_link`
- Step 4 (Software Used) removed — no active integration, low value, blocks users
- Horizontal icon tile treatment for Services step (wrench, flame, drop, etc.)
- Software field converted to free-text optional input (if Software step is retained as optional at product decision point)
- Progress bar auto-scales via `STEPS.length` — no component change needed

**Avoids:** Pitfall 6 (onboarding draft corruption from step removal without key versioning)

**Research flag:** No deeper research needed. Step component contents are confirmed in ARCHITECTURE.md (`BusinessBasicsStep` already collects all Step 1+2 fields). Full wizard flow regression test required after merging.

---

### Phase 7: Manual Request Elimination + Modal Extraction

**Rationale:** Largest structural change, most files touched, most regression risk. Sequenced last. By this point the Campaigns page will have its UX fixes from Phase 5 and be a stable host for the new modal.

**Delivers:**
- `components/send/quick-send-form.tsx` (new) — Extracted form logic from `quick-send-tab.tsx`
- `components/send/quick-send-modal.tsx` (new) — Dialog wrapper with friction warning preserved
- `components/ui/smart-field.tsx` (new) — Type-detecting field for customer lookup in modal
- "Manual Request" removed from `sidebar.tsx` mainNav and `bottom-nav.tsx`
- `/send` route replaced with redirect to `/campaigns` (not deleted — keeps bookmarks working, handles crawlers)
- Campaigns page: "Manual Request" button in header opens `QuickSendModal`
- Customer detail drawer: "Send" button opens `QuickSendModal` with pre-filled customer
- All five server queries from `send/page.tsx` traced to new homes before redirect added

**Avoids:** Pitfall 4 (manual request data loss), Pitfall 5 (anti-pattern of global data fetch for modal — fetch at page level only)

**Research flag:** No deeper research needed — modal architecture is fully specified in ARCHITECTURE.md with data flow and consumer list.

---

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** Cannot change token values before auditing and replacing all hardcoded hex values. Doing it in the wrong order produces a visually inconsistent UI that is hard to debug.
- **Phase 2 before Phase 3:** Card variants using `bg-amber-50` inline classes work, but the variant system in Phase 3 depends on the warm palette being correct. Build on the finished foundation.
- **Phase 3 and Phase 4 can run in parallel:** Dashboard quick wins and form components have no shared dependencies.
- **Phase 5 after Phase 3:** Jobs and campaigns page UX fixes use the new card variants. Palette must be stable.
- **Phase 6 after Phase 4:** Onboarding wizard uses `PasswordInput` and warm form styling from Phase 4. Do onboarding last of the "form" work.
- **Phase 7 last:** Most files touched, most regression surface. All other phases give confidence in the codebase before this.

### Research Flags

**Phases needing additional research during planning:**

None. All four research files are based on direct codebase inspection (not inference or documentation guessing). File paths, component names, exact HSL values, CVA patterns, and data flow are all specified. The roadmapper can use this research to produce an implementation-ready plan without a research-phase step.

**Phases that need a bug-fix PR before visual work begins:**

- **Phase 5 (Campaign page):** Campaign form save bug (touch sequences not persisting) must be isolated and fixed in a separate PR before any campaign form layout changes. The visual PR should not contain the functional fix.

**Standard patterns (no research needed):**

- All phases — this is a subsequent milestone on an established codebase with well-understood component patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings from direct codebase file inspection (`globals.css`, `tailwind.config.ts`, `card.tsx`, `button.tsx`, `input.tsx`). No guesswork. |
| Features | HIGH | Sourced from explicit user requirements (provided in research brief) + direct codebase analysis. Competitor patterns (Jobber, Housecall Pro) are MEDIUM — knowledge cutoff Aug 2025 but architecture principles are stable. |
| Architecture | HIGH | All file paths, component names, and code patterns verified by direct inspection. Two researchers produced consistent findings (minor discrepancy on primary color approach, resolved in this summary). |
| Pitfalls | HIGH | Critical pitfalls (contrast math, hardcoded hex audit, dark mode calibration, draft versioning) are verified with code inspection and WCAG 2.2 math. Campaign bug is a known issue, not speculative. |

**Overall confidence: HIGH**

The one meaningful discrepancy between research files (STACK.md recommends blue as primary, ARCHITECTURE.md proposes amber as primary) has been resolved in favor of STACK.md's approach. The WCAG contrast math is definitive: amber at warm-feeling lightness values fails 4.5:1 on white backgrounds. Blue stays primary for interactive elements.

### Gaps to Address

- **Exact dark mode HSL calibration:** Both research files provide specific HSL values for dark mode, but they differ slightly. The roadmapper should specify that the palette preview page (a `/palette-preview` dev route showing all tokens in both modes) is built as the first step of Phase 2, before finalizing values. Visual calibration with the actual app is superior to computed values.

- **Campaign form save bug scope:** PITFALLS.md flags a known campaign form bug but does not specify the root cause. A brief investigation (30-60 minutes) before Phase 5 planning would confirm whether it's a react-hook-form nested controller issue, a Server Action state problem, or something else. This informs whether it's a quick fix or a separate milestone item.

- **Onboarding step 4 decision (Software Used):** ARCHITECTURE.md recommends removing it; FEATURES.md recommends making it a free-text optional field. This is a product decision. The research is clear that the current dropdown-forces-selection behavior blocks users and should be eliminated. Whether the step disappears entirely or becomes an optional free-text field is a UX call the roadmapper should flag for explicit product decision.

- **`/send` page redirect vs. delete:** ARCHITECTURE.md recommends a redirect to `/campaigns`. FEATURES.md recommends keeping the route alive with a friction banner. The redirect approach is cleaner for V2 alignment. Confirm with product owner before implementing.

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `app/globals.css` — Current HSL token values, `:root` and `.dark` structure confirmed
- `tailwind.config.ts` — Token-to-CSS-variable indirection confirmed
- `components/ui/card.tsx` — Current Card/InteractiveCard structure, absence of CVA confirmed
- `components/ui/button.tsx` — CVA pattern confirmed, existing variant set
- `components/ui/input.tsx` — `h-9` height issue confirmed
- `components/layout/sidebar.tsx` — Hardcoded `bg-[#F2F2F2]`, `bg-white`, `border-[#E2E2E2]` locations confirmed
- `components/layout/app-shell.tsx` — `bg-[#F9F9F9]` confirmed
- `components/layout/page-header.tsx` — `bg-white`, `border-[#E2E2E2]` confirmed
- `components/onboarding/onboarding-wizard.tsx` — 7-step STEPS array confirmed; `BusinessBasicsStep` confirmed to already collect `google_review_link`
- `components/send/send-page-client.tsx`, `components/send/quick-send-tab.tsx` — Form logic structure confirmed
- `.planning/UX-AUDIT.md` — Comprehensive component-level UX analysis from 2026-02-05

### Secondary (MEDIUM confidence — established patterns and user requirements)

- User-provided UX notes in research brief — Direct requirements (HIGH confidence on intent, MEDIUM on exact implementation detail)
- WCAG 2.2 contrast requirements (4.5:1 AA for normal text, 3:1 for UI components) — Applied to computed amber/blue HSL values
- Jobber and Housecall Pro dashboard UI patterns — Competitor feature analysis for "table stakes" determination (knowledge cutoff Aug 2025)
- Stratify design reference — User-supplied warm dashboard design pattern for tonal direction

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
*Files synthesized: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Next step: Roadmap creation (use suggested 7-phase structure as starting point)*
