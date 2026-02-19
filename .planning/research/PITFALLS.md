# Domain Pitfalls: v2.5 UI/UX Redesign — Warm Design System Migration

**Domain:** Adding a warm design system overhaul to an existing production Next.js + Tailwind SaaS with full dark mode
**Researched:** 2026-02-18
**Confidence:** HIGH — based on direct codebase inspection, WCAG 2.2 contrast math, and CSS variable cascade analysis

---

## Critical Pitfalls

These mistakes cause regressions visible to production users or break fundamental functionality.

---

### Pitfall 1: Treating globals.css as the Only Color Source

**What goes wrong:**
The globals.css CSS custom properties (`--primary`, `--background`, `--border`, etc.) are changed to warm hues, but the components that bypass the design token system continue using light mode values. The redesign looks great on the pages you check but breaks silently on others.

**Why it happens:**
Developers change CSS variables, verify a few pages look correct, and ship. They don't know which components use hardcoded values. The codebase already has exactly this pattern:

| Location | Hardcoded value | Token that should be used |
|----------|-----------------|--------------------------|
| `sidebar.tsx:120` | `bg-white` (light only) | `bg-card` |
| `sidebar.tsx:89` | `bg-[#F2F2F2]` | `bg-muted` |
| `sidebar.tsx:90` | `hover:bg-[#F2F2F2]/70` | `hover:bg-muted/70` |
| `page-header.tsx:28` | `bg-white` (light only) | `bg-card` |
| `page-header.tsx:28` | `border-[#E2E2E2]` | `border-border` |
| `app-shell.tsx:32` | `bg-[#F9F9F9]` | `bg-background` |

These components have correct `dark:` variants but the light-mode hardcoded hex values will not inherit the new warm palette when CSS variables are updated.

**How to avoid:**
Before touching CSS variables, run a full audit:
```bash
# Find all hardcoded hex colors
grep -rn "bg-\[#\|text-\[#\|border-\[#\|fill-\[#" components/ app/

# Find bare bg-white/bg-black that bypass tokens
grep -rn "bg-white\|bg-black\|text-white\|text-black" components/ app/ | grep -v "dark:"

# Find Tailwind semantic colors used instead of tokens (amber, blue, green, red, etc.)
grep -rn "bg-amber-\|bg-blue-\|bg-green-\|bg-red-\|text-amber-\|text-blue-\|text-green-" components/ app/
```
Replace all hardcoded values with token-based utilities BEFORE changing the tokens themselves. This ensures when the token value changes, every component updates.

**Warning signs:**
- Sidebar background doesn't warm after CSS variable change
- Mobile header stays cool-gray while other surfaces turn warm
- Visual inconsistency between dashboard and settings pages

**Phase to address:** Phase 1 (Token Audit and Replacement) — must complete before any color value changes

---

### Pitfall 2: Dark Mode Warm Palette Requires Separate Calibration, Not Just Inversion

**What goes wrong:**
A warm amber/gold primary (e.g., hue ~35) is set in `:root`. The `.dark` block is updated by inverting lightness as the existing pattern does: light → dark, dark → light. The result in dark mode is a desaturated, muddy brown rather than the intended warm dark palette. Warm hues in dark mode need higher saturation to avoid looking dirty.

**Why it happens:**
The existing token pattern:
```css
:root { --primary: 224 75% 43%; }     /* Blue */
.dark { --primary: 224 75% 55%; }     /* Blue, just lighter */
```
Blue behaves symmetrically under lightness inversion. Amber/warm tones do not — the perceptual "warmth" requires saturation adjustment, not just lightness shifting. A naive port:
```css
:root { --primary: 35 90% 45%; }      /* Warm amber */
.dark { --primary: 35 90% 55%; }      /* Looks brownish/muddy in dark mode */
```
Correct approach requires separate curation:
```css
.dark { --primary: 35 95% 65%; }      /* Higher saturation AND lightness for dark mode warmth */
```

**How to avoid:**
- Calibrate dark mode tokens independently using a visual tool (oklch color spaces handle perceptual uniformity better than HSL for warm tones)
- For each warm token, verify dark mode renders with a visible warm quality, not a desaturated muddy tone
- Test with `prefers-color-scheme: dark` AND with the `next-themes` forced `.dark` class (they should match)
- Create a color palette preview page during development: a single `/palette-preview` route that renders all tokens in a grid across both modes

**Warning signs:**
- Dark mode looks "brownish" or "muddy" where it should look warm gold
- Text contrast appears to worsen in dark mode even when light mode passes WCAG
- Users on dark mode see a completely different visual personality than light mode users

**Phase to address:** Phase 2 (Token Value Definition) — validate dark mode before wiring up components

---

### Pitfall 3: Warm Amber/Gold Text on White Fails WCAG AA at Common Lightness Values

**What goes wrong:**
Amber/gold at the lightness values that look "warm and inviting" (L 55–70% in HSL) fail WCAG AA contrast (4.5:1) on white backgrounds. The redesign ships with amber-colored labels, status badges, or primary buttons that are technically inaccessible. This is a regulatory risk and will fail any accessibility audit.

**Why it happens:**
Yellow and amber tones have high perceptual luminance at the same HSL lightness where blue reads as dark. This means:
- `hsl(35, 90%, 55%)` (warm amber) on white: contrast ratio ≈ 2.8:1 — FAILS AA
- `hsl(224, 75%, 43%)` (current primary blue) on white: contrast ratio ≈ 5.2:1 — PASSES AA

The existing status color system is already amber-influenced:
```css
--status-clicked-text: 30 100% 27%;  /* Very dark amber for accessibility */
--status-clicked-bg: 54 96% 88%;     /* Light yellow background */
```
This pattern works BECAUSE the text token is `27%` lightness (very dark). Any new warm primary used for text must follow the same constraint.

**How to avoid:**
Run contrast math before finalizing any text token:
```
WCAG AA minimum: 4.5:1 (normal text), 3:1 (large text/UI elements)
WCAG AAA:        7:1

For warm primary as text on --background (97.6% L in HSL ≈ #F8F8F8):
- Need darkened amber: approximately hsl(35, 90%, 30%) or darker
- Test at: https://webaim.org/resources/contrastchecker/
```

The most common failure modes in a warm palette migration:
1. Amber badge text on light amber background (both mid-range L — fails even at 3:1)
2. Gold primary button label — if `--primary` is light amber, the `--primary-foreground` must be very dark, not just white
3. Warm-tinted `--muted-foreground` for placeholder text — already near the 4.5:1 limit in the current palette (`0 0% 45%`)

**Warning signs:**
- Browser accessibility dev tools (Chrome Accessibility panel) flagging contrast violations after the migration
- Status badges look "faded" in the new palette — usually means contrast dropped below 3:1
- The `--muted-foreground` placeholder text becomes harder to read on warm backgrounds

**Phase to address:** Phase 2 (Token Value Definition) — validate every foreground/background token pair before shipping

---

### Pitfall 4: Semantic Color Leakage — Inline Colors That Don't Participate in the Token System

**What goes wrong:**
The redesign updates all CSS tokens but ~50 component files use Tailwind semantic colors inline (`text-amber-600`, `bg-blue-50`, `text-green-600`, `bg-red-500`). These colors don't change when the design system changes. After migration, the system has two color realities: the new warm palette via tokens, and the unchanged semantic palette baked into components.

**Why it happens:**
Tailwind's semantic scale (amber-600, blue-50, etc.) is convenient for one-off usage. The current codebase has substantial inline semantic color usage that was added incrementally:

Examples found in codebase:
- `components/billing/usage-warning-banner.tsx`: `bg-amber-50`, `border-amber-200`, `text-amber-600`, `text-amber-800`
- `components/campaigns/campaign-stats.tsx`: `bg-green-500`, `bg-yellow-500`, `bg-red-500`
- `notification-bell.tsx:86`: `bg-blue-100 dark:bg-blue-900/30`, `text-blue-600 dark:text-blue-400`
- `notification-bell.tsx:111`: `bg-amber-100 dark:bg-amber-900/30`, `text-amber-600 dark:text-amber-400`
- `app/(dashboard)/campaigns/new/page.tsx`: `bg-blue-50`, `border-blue-200`, `text-blue-600`, `text-blue-900` — six individual classes for one info banner

**How to avoid:**
Extend the token system to cover semantic use cases, then migrate inline colors to tokens. A warm palette migration is the right time to add:
```css
/* globals.css additions */
--info-bg: [token];
--info-text: [token];
--success-bg: [token];
--success-text: [token];
--warning-bg: [token];   /* replaces inline amber-50/amber-600 */
--warning-text: [token];
```
The existing `--status-*` tokens are already correctly tokenized. The inline billing, campaign, and notification colors are not. Migrate these systematically before or during the color change phase.

**Warning signs:**
- Info banners in campaign create page look "off brand" after the redesign
- Usage warning banners on billing page use a different shade of amber than the new primary
- Chart colors (bg-green-500, bg-yellow-500 in campaign-stats) clash with the new warm palette

**Phase to address:** Phase 1 (Token Audit) and Phase 3 (Component Update) — audit first, migrate alongside component redesign

---

### Pitfall 5: Removing the Manual Request Page Without Preserving Its Data Queries

**What goes wrong:**
`/send` (Manual Request) provides several data functions not duplicated elsewhere: monthly usage stats, response rate, attention needs count, recent activity, and resend-ready customers. If the page is removed and its content merged into the dashboard or jobs page, the consuming Server Component queries (`getMonthlyUsage`, `getResponseRate`, `getNeedsAttentionCount`, `getRecentActivity`, `getResendReadyCustomers`) either get duplicated incorrectly or dropped entirely.

**Why it happens:**
The send page (`app/(dashboard)/send/page.tsx`) loads five separate data queries server-side:
```typescript
getMonthlyUsage, getResponseRate, getNeedsAttentionCount,
getRecentActivity, getRecentActivityFull, getResendReadyCustomers
```
These are business metrics. If the UI shell is removed but these queries aren't moved to the right home, the dashboard loses visibility into resend-ready customers and the attention count that powers the notification badge on the sidebar.

**How to avoid:**
- Before removing the page, map every prop passed to `SendPageClient` to its query source
- Identify which data belongs on Dashboard, which belongs on Jobs, which belongs on Activity
- Move queries first, verify data still flows, then remove the page
- The `notificationCounts.readyToSend` badge on the sidebar will need to continue being computed — its current source is likely the send page or a shared server layout

**Warning signs:**
- Dashboard "Ready to Send" queue goes empty after page removal
- Sidebar notification badge stops updating
- Activity page loses the "resend ready" customer list

**Phase to address:** Phase dealing with navigation consolidation — plan data migration before page deletion, not after

---

### Pitfall 6: Onboarding Step Removal Breaks Draft Persistence Key Expectations

**What goes wrong:**
The onboarding wizard stores draft data in `localStorage` under key `'onboarding-draft'` as a record of step data indexed by step ID or field name. The schema is validated with Zod on load (`draftDataSchema.safeParse(parsed)`). If steps are removed or renumbered, existing users who have a partial onboarding draft in localStorage will either:
1. Have their draft silently cleared (Zod validation fails → `localStorage.removeItem(STORAGE_KEY)`)
2. Advance to the wrong step if `initialStep` numbering changes

**Why it happens:**
The current `STEPS` array in `onboarding-wizard.tsx`:
```typescript
const STEPS: StepConfig[] = [
  { id: 1, title: 'Business Basics', skippable: false },
  { id: 2, title: 'Review Destination', skippable: true },
  { id: 3, title: 'Services Offered', skippable: false },
  { id: 4, title: 'Software Used', skippable: true },
  { id: 5, title: 'Campaign Preset', skippable: false },
  { id: 6, title: 'Import Jobs', skippable: true },
  { id: 7, title: 'SMS Consent', skippable: false },
]
```
If step 4 (Software Used) or step 6 (Import Jobs) are removed during the redesign, the remaining steps renumber. A user who had `currentStep: 6` stored in a draft now advances into SMS Consent (new step 5) or beyond.

**How to avoid:**
- Use stable string IDs for draft keys, not step numbers: `'business-basics'`, `'review-destination'`, etc.
- When removing a step, verify the Zod schema shape still accepts existing drafts (add forward-compatible parsing)
- Consider incrementing the `STORAGE_KEY` version on structural step changes: `'onboarding-draft-v2'` — old drafts are cleanly abandoned, new users start fresh
- Test: start onboarding, save draft at step 3, deploy step removal, reload — verify graceful handling

**Warning signs:**
- New users starting onboarding after the redesign land on wrong step
- Existing draft users see Zod validation errors in console log at load
- Step numbers in URL params (`?step=6`) land on wrong step content after renumbering

**Phase to address:** Onboarding consolidation phase — schema versioning must be decided before implementing step removal

---

### Pitfall 7: Campaign Edit Page — Fixing Underlying Bugs Must Precede Visual Redesign

**What goes wrong:**
The campaign form (`components/campaigns/campaign-form.tsx`) has reported save bugs. If the redesign phase reflows the form's layout and component hierarchy without first fixing the underlying data bug, the redesign obscures the bug further. Post-redesign debugging becomes harder because visual changes and functional changes are entangled in the same diff.

**Why it happens:**
Design changes are visually apparent and feel like forward progress. Functional bugs are less visible. The instinct is to "clean up the visual first, fix the bug in the next pass." But changing form structure (adding tabs, reordering fields, changing Submit button hierarchy) can shift form submission behavior and mask or alter existing bugs.

The campaign form uses `react-hook-form` with `zodResolver`. Touch sequence editor (`TouchSequenceEditor`) is a nested controller. Bugs in touch data not being submitted correctly are invisible to visual inspection.

**How to avoid:**
- File a discrete bug ticket for each known campaign/jobs functional issue before beginning that section's visual redesign
- Fix and merge the functional bug first (small, targeted diff)
- Then apply the visual redesign (larger, clearly visual diff)
- Verify the bug fix still passes after the visual change by running the same reproduction steps

**Warning signs:**
- Campaign save appears to succeed (no error toast) but touch sequences aren't persisted
- Jobs creation form submits but customer record isn't created
- After the redesign, a bug that "was there before" is now "worse" — the redesign changed behavior accidentally

**Phase to address:** First task in any campaign or jobs redesign phase — fix bugs in isolation before visual changes

---

## Moderate Pitfalls

These cause delays or regressions that are fixable but expensive to discover late.

---

### Pitfall 8: Status Color Distinguishability in a Warm Palette

**What goes wrong:**
The existing status system has five distinct states:
- `status-pending` (cool gray-blue)
- `status-delivered` (teal)
- `status-clicked` (amber/orange)
- `status-failed` (red)
- `status-reviewed` (green)

A warm palette migration shifts the neutral base toward amber/gold. The `status-clicked` amber-orange badge now reads as "normal/neutral" because the surrounding UI is also amber-toned. The signal-to-noise ratio collapses — "clicked" looks like default, not a meaningful state.

**How to avoid:**
- Test the full status badge set against the new warm background before finalizing tokens
- `status-clicked` may need to shift toward orange-red in a warm palette to maintain distinctiveness
- `status-pending` needs to remain clearly distinguishable from the background; a warm neutral muted tone needs more contrast than the current cool gray provides
- Run the visual test: display all five status badges side by side on the new warm `--background`. If any badge reads as "background-level noise", adjust that badge's hue/saturation

**Warning signs:**
- Activity page status badges look similar to the card backgrounds after migration
- "Clicked" status looks identical to "Pending" in the new palette
- Users ask "is this badge an error or normal?" — loss of semantic clarity

**Phase to address:** Phase 2 (Token Definition) — status token calibration alongside main palette decisions

---

### Pitfall 9: Hardcoded `bg-[#F2F2F2]` Active State Breaks Sidebar Logic

**What goes wrong:**
The sidebar active nav item state uses `bg-[#F2F2F2]` (hardcoded hex) for light mode. When the background warms (to an off-white with warm tint), the active state `#F2F2F2` is a noticeably cooler gray. The visual accent of "I'm on this page" weakens or looks wrong.

**Why it happens:**
This is the specific pattern:
```typescript
// sidebar.tsx line 89-90
? "bg-[#F2F2F2] dark:bg-muted text-foreground"
: "text-foreground/70 dark:text-muted-foreground hover:bg-[#F2F2F2]/70 dark:hover:bg-muted/70"
```
Dark mode already uses `bg-muted` (a token). Light mode uses `#F2F2F2` (hardcoded). The migration must convert the light mode value to a token. The correct token is `bg-muted`, which then gets its value updated in globals.css as part of the warm migration.

**How to avoid:**
Replace `bg-[#F2F2F2]` with `bg-muted` and `hover:bg-[#F2F2F2]/70` with `hover:bg-muted/70` across sidebar and notification bell BEFORE changing token values. Then the CSS variable change propagates correctly to the sidebar active state.

**Warning signs:**
- After migration, the active sidebar item has a different shade than the hover state on other items
- Light and dark mode sidebar active states look inconsistent with each other
- The "selected" effect disappears or becomes invisible on warm backgrounds

**Phase to address:** Phase 1 (Token Audit) — this is a specific replacement that must be in the first pass

---

### Pitfall 10: `next-themes` Dark Mode Applies Class, Not Media Query — Test Both Paths

**What goes wrong:**
`next-themes` applies dark mode via the `.dark` CSS class on `<html>`, not via `prefers-color-scheme` media query. The system checks for class-based tokens only. If any styles use `@media (prefers-color-scheme: dark)` instead of `.dark {}` selectors, they won't respond to the theme toggle — they'll only respond to OS-level setting changes.

**Why it happens:**
Developers mix the two systems. New styles added during redesign might use the media query (standard CSS instinct) while the existing system uses class-based theming. The bug is invisible when testing with the app's own toggle but breaks when a user has their OS set to dark and the app theme set to light (or vice versa).

**How to avoid:**
- All dark mode CSS in globals.css must be inside `.dark {}` selectors, never inside `@media (prefers-color-scheme: dark)`
- The only media query usage is for `prefers-reduced-motion` (already correct in the codebase)
- When adding any new CSS rules during redesign, verify dark mode is `.dark {}` not `@media`
- Test by: (1) Set OS to light mode, use toggle to switch app to dark → verify dark styles apply. (2) Set OS to dark mode, toggle app to light → verify light styles apply.

**Warning signs:**
- Dark mode looks different when using the in-app toggle vs. setting OS dark mode
- Some elements flip to dark on OS preference change without the user toggling the app theme
- Newly added CSS "doesn't seem to respect the theme toggle"

**Phase to address:** Phase 2 (Token Definition) — establish the rule at the start of CSS work, verify in testing

---

### Pitfall 11: Button Variant System Must Be Reviewed When Primary Color Changes

**What goes wrong:**
`variant="default"` buttons use `bg-primary` with `hover:bg-primary/90`. When primary shifts from a dark blue (43% lightness) to a warm amber, the foreground text color (`--primary-foreground: 0 0% 98%`) — which is white — may no longer meet contrast requirements against the new lighter amber primary.

Additionally, `variant="outline"` uses `border-border` and `hover:bg-accent`. Since `--accent` currently mirrors `--primary`, a warm primary makes outline hover states warm. This may read as "active" when the user is merely hovering.

**How to avoid:**
- After defining new `--primary` value, compute contrast ratio of `--primary-foreground` (white, `0 0% 98%`) against new primary
- If new primary lightness > ~50% HSL, white foreground will fail AA — switch to a dark foreground token
- Review all button variants in `components/ui/button.tsx` — trace which tokens each variant uses
- Review `--accent` — if it should no longer mirror `--primary`, decouple them in globals.css

**Warning signs:**
- White text on warm amber button fails contrast check
- Outline hover state looks "selected" rather than just "hovered"
- Ghost buttons are invisible because `hover:bg-accent` is now too warm for the context

**Phase to address:** Phase 2 (Token Definition) and Phase 3 (Component Review) — token-to-variant mapping review

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Change only `:root` tokens, don't audit hardcoded classes | Fast initial visual | Components with hardcoded colors stay broken; discovered by QA or users | Never — audit first |
| Define dark mode tokens as simple lightness inversion | Quick parity | Warm tones read muddy/brown in dark mode | Never for warm palettes |
| Skip contrast checks on "decorative" elements | Saves time | Fails accessibility audit, legally risky if required | Never — even decorative elements should not actively fail |
| Keep inline semantic colors (amber-600, blue-50) during migration | Less work now | Two parallel color systems that diverge over time | Only if a dedicated cleanup phase is explicitly planned |
| Redesign campaign form without fixing save bugs first | Visual progress visible immediately | Bug becomes harder to isolate, mixed in with visual diff | Never — functional bugs first |
| Remove onboarding step without versioning the draft storage key | Simpler code | Existing partial drafts may corrupt to wrong step | Never — always version the key |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `next-themes` | Using `@media (prefers-color-scheme: dark)` instead of `.dark {}` | All dark mode CSS uses `.dark {}` class selector exclusively |
| Tailwind JIT | Assuming dynamic class construction works with warm colors | Any dynamic class like `bg-${color}-500` must be in safelist or use static strings |
| Radix UI primitives | Overriding Radix color props directly instead of via CSS variables | Override via CSS variables only — Radix respects the cascade |
| shadcn components | Adding new shadcn components that import their own color assumptions | Check each new shadcn component for color token usage before adding |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Adding CSS backdrop-filter for warm frosted effects | Sidebar/modal sluggish on low-end devices | Test on 3-5 year old hardware; prefer solid backgrounds | 60fps drops below 30fps on integrated graphics |
| Importing CSS variables in JS for color calculations | Forced reflow on every read | Use Tailwind tokens exclusively; avoid `getComputedStyle` for colors | As component count scales |
| Animating background-color on warm gradients | Gradient transitions are GPU-expensive | Prefer opacity animations over color animations | Mobile — especially iOS Safari |

---

## "Looks Done But Isn't" Checklist

- [ ] **Token audit complete:** Run grep for all hardcoded hex values (`bg-\[#`) and semantic colors (`bg-amber-\|bg-blue-`) — count must be zero or explicitly accounted for
- [ ] **Dark mode warm:** View every page in dark mode after migration — warm quality should be visible, not muddy brown
- [ ] **Contrast verified:** Use browser accessibility panel on at least: primary button text, muted-foreground text on background, each status badge text on its background
- [ ] **Status badges distinguishable:** View all five status badges side by side on new warm background — each must read as semantically distinct
- [ ] **Sidebar active state:** Confirm active and hover states are visually distinguishable in both modes after `bg-[#F2F2F2]` replacement
- [ ] **Campaign form bug fixed:** Reproduce the known campaign save bug before starting visual redesign of that section; verify fix is isolated and merged first
- [ ] **Manual request data preserved:** Confirm all queries from `/send/page.tsx` have known destinations before removing the page
- [ ] **Onboarding draft versioned:** If any steps removed or renumbered, confirm `STORAGE_KEY` is incremented and existing drafts are handled gracefully
- [ ] **Button foreground contrast:** White text on new primary button passes 4.5:1 — measure with actual new HSL value, not eyeballed
- [ ] **next-themes dark mode:** All new CSS uses `.dark {}` not `@media (prefers-color-scheme: dark)`

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Shipped warm palette with hardcoded colors still present | MEDIUM | Audit and replace hardcoded values; targeted CSS deploy |
| Dark mode tokens look muddy | LOW | Adjust `.dark` HSL values; no component changes needed |
| Contrast failures on primary button | LOW-MEDIUM | Change `--primary-foreground` token; verify all button variants |
| Status badges lose distinctiveness | LOW | Adjust `--status-clicked-*` hue to orange-red range |
| Onboarding drafts corrupted by step removal | MEDIUM | Bump storage key version; display "your progress was reset" message |
| Manual request data lost after page removal | HIGH | Re-add queries to destination page; requires careful tracing of data dependencies |
| Campaign form bug obscured by redesign diff | HIGH | Revert visual changes, fix bug in isolation, reapply visual changes |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Hardcoded colors bypass token system | Phase 1: Token Audit | Zero grep results for `bg-\[#`, `text-\[#`, `border-\[#` |
| Dark mode warm calibration | Phase 2: Token Values | Manual dark mode review of all 8 dashboard pages |
| Warm text fails WCAG contrast | Phase 2: Token Values | Browser a11y panel shows zero contrast violations |
| Semantic color leakage | Phase 1: Token Audit + Phase 3: Components | All inline amber/blue/green/red semantic classes replaced with tokens |
| Manual request page data loss | Navigation consolidation phase | Dashboard and activity page still show all five data points previously on send page |
| Onboarding step removal breaks draft | Onboarding redesign phase | Existing draft → new wizard → lands on correct step or gracefully resets |
| Campaign bugs entangled with visual changes | Campaign redesign phase | Bug reproduction case documented and resolved before visual PR opens |
| Status badge distinguishability | Phase 2: Token Values | Five-badge side-by-side visual test on new background |
| Sidebar active state `#F2F2F2` | Phase 1: Token Audit | Sidebar active and hover states use `bg-muted` not hardcoded hex |
| Button variant contrast with warm primary | Phase 2: Token Values | Primary button foreground contrast computed ≥ 4.5:1 |
| `next-themes` class vs media query | Phase 2: Token Values | Search for `@media (prefers-color-scheme)` in CSS returns no results in dark-themed blocks |

---

## Sources

- Direct codebase inspection: `app/globals.css`, `components/layout/sidebar.tsx`, `app/(dashboard)/send/page.tsx`, `components/onboarding/onboarding-wizard.tsx`, `components/campaigns/campaign-form.tsx`
- WCAG 2.2 contrast requirements (4.5:1 AA for normal text, 3:1 for large text and UI components)
- HSL color math for warm tone contrast at mid-range lightness values
- `next-themes` class-based dark mode behavior (confirmed by existing `.dark {}` CSS structure in codebase)
- Tailwind CSS JIT token system cascade behavior
- Existing status token pattern in `app/globals.css` as evidence of correct tokenization approach

---

*Pitfalls research for: v2.5 Warm Design System Migration on AvisLoop*
*Researched: 2026-02-18*
