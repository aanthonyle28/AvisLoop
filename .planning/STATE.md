# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** Phase 38 — Onboarding Consolidation

## Current Position

Phase: 38 of 39 in v2.5 milestone (Phase 6 of 7 in this milestone)
Plan: 3 of N in phase — Phase 38 in progress
Status: In progress
Last activity: 2026-02-19 — Completed 38-03 (warm amber Getting Started pill, campaign_reviewed requires /campaigns visit)

Progress: [█████████░] ~82% (v2.5 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 184
- v2.5 plans completed: 14

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v2.5

- Amber as accent only, blue stays primary — amber at warm lightness fails WCAG AA on white (2.2:1); blue stays primary for buttons/focus rings
- Phase 33 (color audit) MUST run before Phase 34 (palette swap) — hardcoded hex bypasses token system
- Manual Request elimination (Phase 39) is last — most regression risk; /send becomes redirect not deletion
- Onboarding storage key versioned to `'onboarding-draft-v2'` (Phase 38 complete) — stale 7-step drafts abandoned via key change, no migration code needed
- Campaign form save bug must be fixed in Phase 37 before any campaign form layout changes
- Dark mode calibration must be independent of light mode (higher saturation needed for warm hues in dark)
- bg-secondary for active nav state (replaces bg-[#F2F2F2]) — --secondary is 0 0% 92%, semantically correct for muted interactive surface
- Redundant dark: overrides removed — bg-card, bg-background, border-border are already mode-aware; dark:bg-X overrides add noise
- Button component for all interactive elements — raw button elements replaced with Button primitive for consistency and future theming
- Tier 2 audit: 210 occurrences / 51 files / 16 categories — data-viz dots, stars, marketing stay inline; everything else Phase 35
- --error-text is distinct from --destructive — form validation text needs darker shade than button-calibrated destructive token
- Phase 35 token spec implemented: 13 CSS vars (--warning-bg/DEFAULT/border/foreground, --success-bg/DEFAULT/border/foreground, --info-bg/DEFAULT/border/foreground, --error-text) + 4 Tailwind color groups in tailwind.config.ts
- Warm palette anchored at H=36 (cream light bg), H=24 (charcoal dark bg), H=38 (amber accent), H=213 (blue primary) — all live in globals.css
- Status badge pattern: className field in config (not bg/text), no style prop, border-status-*-text/20 for warm-bg contrast
- Accent = decorative only: bg-secondary for outline button hover, bg-muted for ghost/dropdown/select/dialog states
- Status badge text contrast adjusted post-verification: delivered 25%, failed 33%, reviewed 20% (light); clicked 62%, failed 70% (dark) — all pass WCAG AA
- Primary color shifted: 224 75% 43% → 213 60% 42% (softer, less saturated blue)
- Card variants use Tailwind color scale (not semantic tokens) — card tints are decorative, not semantic status; low-opacity (/60 bg, /50 border) keeps them whisper-quiet
- InteractiveCard: translate-y lift replaced by hover:shadow-sm + always-visible ArrowRight (muted-foreground/30 → /70 on hover); hoverAccent prop adds colored border+arrow on hover (amber/green/blue)
- KPI top row: each card gets distinct hoverAccent + filled colored icon (amber star, green chart, blue target); bottom row uses variant="default" for cleaner visual separation
- Server-timezone greeting (UTC on Vercel) is acceptable — client-side hydration adds complexity for minimal UX gain
- Dashboard badge removed from sidebar nav item — dashboardBadge still in SidebarProps interface/AppShell prop chain but destructured param removed
- text-error-text for form validation (not text-destructive) — --error-text is darker shade for small inline text readability
- SMS counter uses two-level threshold: text-warning (soft, >160 chars) → text-destructive (hard, >320 chars)
- Danger zone section pattern: border-destructive/30 + text-destructive (not hardcoded red-200/red-600)
- Warning banner pattern: bg-warning-bg + border-warning-border + text-warning (icon/body) + text-warning-foreground (heading)
- Data-viz stars (text-yellow-400) and positive trend percentages (text-green-600) remain inline — exempt per Phase 33 audit
- Page container standard: container py-6 space-y-6 (full-width), container max-w-{N} py-6 space-y-6 (constrained) — mx-auto and px-4 are redundant with Tailwind container class
- SMS consent 3-state display: text-success (opted_in) / text-destructive (opted_out) / text-warning (unknown) — consistent across detail drawer and edit sheet
- Template channel badge: bg-info/10 text-info (email), bg-success/10 text-success (SMS) — distinct channels via semantic color not arbitrary blue/green
- PasswordInput toggle button uses tabIndex={-1} + type="button" — Tab skips eye icon to next form field; type=button prevents accidental form submission
- Error message pattern: id={field}-error role=alert on <p>, linked via aria-describedby on the input — screen readers announce error on focus
- noValidate on all auth forms — suppress browser validation popups; server-side errors render inline with aria-invalid red border styling
- aria-invalid:border-destructive on Input component — Tailwind arbitrary variant triggers red border/ring when aria-invalid=true is set

### Pending Todos

None.

### New Decisions from 36-03

- Google OAuth PKCE flow works end-to-end in local dev — no code changes needed; code was correct as-built
- "OAuth state parameter missing" on first test was transient (Supabase server restart mid-flow), not a code bug
- NEXT_PUBLIC_SITE_URL: `http://localhost:3000` in .env.local, `https://app.avisloop.com` in Vercel production (no trailing slash on either)

### New Decisions from 37-01

- react-hook-form setValue for complex arrays requires `{ shouldDirty: true, shouldValidate: true }` to ensure dirty tracking and correct form submission
- Server action early-return guard before Zod enum: check `!serviceType` first, return user-friendly error before reaching Zod validation
- console.error logging in server actions is acceptable in production (server-side, never reaches client, aids diagnosis)

### New Decisions from 37-02

- Keep type=text in customer autocomplete even in email mode — changing input type dynamically causes focus loss in some browsers
- Email badge only shows at query.length >= 3 — bare @ character alone causes flash with no useful context
- Shape-based distinction (rounded-full vs rounded-md) + group labels is sufficient filter differentiation — no color change needed
- Filter fallback pattern: enabledServiceTypes && enabledServiceTypes.length > 0 ? filtered : all — empty array means no config, show all

### New Decisions from 38-03

- campaign_reviewed stored as explicit JSONB flag — not derivable from campaign existence; only set when user visits /campaigns
- await markCampaignReviewed() (not void) ensures flag is written before page renders; short-circuit on repeat visits keeps latency minimal
- Page-visit checklist completion pattern: call server action at top of async server component, action reads flag first and returns early if already set

### New Decisions from 38-02

- customServiceLabel state is UX-only — not saved to DB; saveServicesOffered still receives the string[] enum array (future phase can add custom_service_label DB column if needed)
- Cumulative hours for timing display: sum touches slice(0, idx+1) then format as 'Day N' — shows when customer receives message, not delay from previous touch
- Sub-24h touches display raw Xh (e.g., '4h') since 'Day 0' would be confusing
- preset.meta?.name || preset.name fallback is safe: unrecognized DB presets fall back to DB name instead of empty
- Plain-English campaign preset names: Conservative → Gentle Follow-Up, Standard → Steady Follow-Up, Aggressive → Speedy Follow-Up (IDs unchanged for matching logic)

### New Decisions from 38-01

- Onboarding step removal strategy: delete from STEPS array + remove switch case + remove import — step files stay on disk (no active breakage from unused files)
- Storage key versioning for wizard drafts: bump key string (v1 → v2) is sufficient to abandon stale drafts; no migration needed since step 1 saves to DB on Continue
- 5-step onboarding: Business Basics, Services Offered, Campaign Preset, Import Jobs, SMS Consent — Review Destination removed (duplicate of Business Basics), Software Used removed (low-value)

### New Decisions from 37-03

- Sheet-based edit pattern: parent component (CampaignList) owns open/close state; CampaignForm uses onSuccess callback instead of router navigation when inside a sheet
- CampaignList is the Sheet host (not CampaignsPage) — direct access to campaigns array for editingCampaign lookup avoids prop drilling
- Templates fetched once at server-component page level, passed to CampaignList, shared with the Sheet-embedded form — no duplicate fetches
- stopPropagation on entire controls div covers Switch + DropdownMenu with one handler — simpler than per-element handlers
- inline-flex + w-fit for back links constrains click target to text content width — prevents full-row accidental activation
- max-w-3xl mx-auto on PresetPicker grid centers 3-column layout without stretching on large viewports
- PRESET_ORDER constant for deterministic sort ensures Standard always appears center column

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)
- Phase 37: Campaign form save bug (JC-08) RESOLVED in 37-01 — shouldDirty fix applied to touches setValue
- Phase 39: Five server queries on /send page must be traced to new homes before redirect is added
- Google OAuth: VERIFIED WORKING (36-03) — authenticated end-to-end in local dev; NEXT_PUBLIC_SITE_URL must be https://app.avisloop.com in Vercel production env vars

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 38-02 — services step horizontal chips, Other text input reveal, plain-English preset names in constants and UI, cumulative Day N timing labels.
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
