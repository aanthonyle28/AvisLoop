# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** Phase 37 — Jobs & Campaigns UX Fixes

## Current Position

Phase: 37 of 39 in v2.5 milestone (Phase 5 of 7 in this milestone)
Plan: 1 of 3 complete
Status: In progress
Last activity: 2026-02-19 — Completed 37-01 (job creation bug fix + campaign touch persistence fix)

Progress: [███████░░░] ~57% (v2.5 milestone)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 180
- v2.5 plans completed: 10

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v2.5

- Amber as accent only, blue stays primary — amber at warm lightness fails WCAG AA on white (2.2:1); blue stays primary for buttons/focus rings
- Phase 33 (color audit) MUST run before Phase 34 (palette swap) — hardcoded hex bypasses token system
- Manual Request elimination (Phase 39) is last — most regression risk; /send becomes redirect not deletion
- Onboarding storage key must version to `'onboarding-draft-v2'` when steps change (Phase 38)
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

### New Decisions from 37-01

- react-hook-form setValue for complex arrays requires `{ shouldDirty: true, shouldValidate: true }` to ensure dirty tracking and correct form submission
- Server action early-return guard before Zod enum: check `!serviceType` first, return user-friendly error before reaching Zod validation
- console.error logging in server actions is acceptable in production (server-side, never reaches client, aids diagnosis)

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)
- Phase 37: Campaign form save bug (JC-08) RESOLVED in 37-01 — shouldDirty fix applied to touches setValue
- Phase 39: Five server queries on /send page must be traced to new homes before redirect is added
- Google OAuth: Code complete, Supabase dashboard Google provider config pending (enable provider, add Client ID/Secret, allowlist redirect URLs)

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 37-01 — job creation defensive fix (JC-03) + campaign touch persistence (JC-08) + service filter scoping (JC-01)
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
