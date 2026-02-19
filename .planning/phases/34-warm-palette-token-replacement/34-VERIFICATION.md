---
phase: 34-warm-palette-token-replacement
verified: 2026-02-19T00:00:00Z
status: gaps_found
score: 4/6 must-haves verified
gaps:
  - truth: "All five status badges remain visually distinguishable side-by-side on the new warm background"
    status: partial
    reason: "Badges migrated to token classes with borders. Text-on-badge-bg contrast fails WCAG AA for 3 of 5 in light mode (Delivered 2.91:1, Failed 4.33:1, Reviewed 4.15:1) and 2 of 5 in dark mode (Clicked 3.92:1, Failed 3.32:1). Plan research stated text contrast would carry distinguishability load but chosen values do not achieve 4.5:1 for all five."
    artifacts:
      - path: "app/globals.css"
        issue: "Status text tokens produce sub-AA: --status-delivered-text 2.91:1, --status-failed-text 4.33:1, --status-reviewed-text 4.15:1 in light mode; --status-clicked-text 3.92:1 and --status-failed-text 3.32:1 in dark mode."
      - path: "components/history/status-badge.tsx"
        issue: "Component structure correct (token classes, borders, no inline styles). Root cause is CSS variable values in globals.css."
    missing:
      - "Darken --status-delivered-text from 189 57% 40% to ~189 57% 25% to achieve 4.5:1 on delivered-bg"
      - "Darken --status-failed-text (light) from 358 100% 38% to ~358 100% 33%"
      - "Darken --status-reviewed-text from 149 100% 25% to ~149 100% 20%"
      - "Lighten --status-clicked-text (dark) from 30 80% 50% to ~30 80% 62%"
      - "Lighten --status-failed-text (dark) from 358 80% 55% to ~358 80% 70%"
human_verification:
  - test: "Visit /history in light mode and confirm all 5 status badges are visually distinct"
    expected: "Pending blue-gray, Delivered teal, Clicked amber, Failed red, Reviewed green each distinct from warm card background"
    why_human: "Badge-bg vs page-bg is 1.1-1.3:1 by design; hue distinguishability cannot be verified programmatically"
  - test: "Toggle dark mode on /dashboard and confirm background feels warm not cold"
    expected: "Background has subtle warm-brown tint not cold blue-gray or neutral charcoal"
    why_human: "H=24 at 8% saturation is subtle warmth; perceptual quality cannot be determined from token values alone"
  - test: "On /history light mode confirm Delivered, Failed, Reviewed badge text is legible"
    expected: "Labels readable without strain; if Delivered text appears very faint the gap is confirmed user-facing"
    why_human: "Perceptual legibility at 2.91-4.33:1 depends on display conditions and font rendering"
  - test: "Open any dropdown menu hover over items and confirm hover is muted gray not amber"
    expected: "Hovered dropdown item shows neutral muted gray not amber"
    why_human: "Interactive hover states cannot be triggered programmatically"
---


# Phase 34: Warm Palette Token Replacement Verification Report

**Phase Goal:** The entire app renders with a warm amber/gold accent palette -- cream backgrounds, warm borders, soft blue interactive primary -- with WCAG AA contrast verified in both light and dark modes.
**Verified:** 2026-02-19T00:00:00Z
**Status:** gaps_found
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Light mode uses warm cream background (36 20% 96%), warm near-black foreground (24 10% 10%), soft blue primary (213 60% 42%), amber accent (38 92% 50%) | VERIFIED | All four exact HSL values confirmed in globals.css :root block |
| 2 | Dark mode uses independently calibrated warm values with H=24 backgrounds at 8% saturation, not lightness-inverted light mode | VERIFIED | Dark bg=24 8% 10% vs light bg=36 20% 96% -- different hue (H24 vs H36) AND saturation (8% vs 20%); independently calibrated |
| 3 | New semantic tokens --highlight, --highlight-foreground, --surface, --surface-foreground exist in both globals.css and tailwind.config.ts | VERIFIED | Four tokens in both :root and .dark in globals.css; highlight and surface entries with DEFAULT+foreground in tailwind.config.ts |
| 4 | All five status badges remain visually distinguishable side-by-side on the new warm background | PARTIAL | Component correctly migrated; WCAG AA text contrast fails for 3/5 light-mode and 2/5 dark-mode statuses |
| 5 | Primary button text passes WCAG AA contrast (4.5:1) on the new primary color value | VERIFIED | Light: 5.68:1 PASS; Dark: 5.13:1 PASS |
| 6 | All 8 dashboard pages reviewed in both modes with no muddy or cold-blue areas | HUMAN NEEDED | 34-02-SUMMARY claims build passed (41 routes) and user approved at checkpoint; cannot verify programmatically |

**Score:** 4/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/globals.css` | Complete warm palette :root and .dark with 4 new tokens | VERIFIED | 127 lines, all tokens at specified values, no stubs |
| `tailwind.config.ts` | highlight and surface token mappings | VERIFIED | Lines 41-48, DEFAULT+foreground pattern for both |
| `components/history/status-badge.tsx` | Token-based statusConfig, no inline styles, borders | VERIFIED | 93 lines, no style= prop, no hex values, all 5 tokenized statuses have border classes |
| `components/ui/button.tsx` | outline=hover:bg-secondary, ghost=hover:bg-muted | VERIFIED | Line 16 outline uses hover:bg-secondary; line 20 ghost uses hover:bg-muted |
| `components/ui/select.tsx` | SelectItem focus:bg-muted focus:text-foreground | VERIFIED | Line 121 confirmed |
| `components/ui/dropdown-menu.tsx` | All four interactive states use focus:bg-muted | VERIFIED | SubTrigger line 30, MenuItem line 87, CheckboxItem line 103, RadioItem line 127 all confirmed |
| `components/ui/dialog.tsx` | Close button uses data-[state=open]:bg-muted | VERIFIED | Line 45 confirmed |
| `components/jobs/customer-autocomplete.tsx` | All hover/active states use bg-muted | VERIFIED | Lines 153, 154, 167 use bg-muted; zero bg-accent hits |
| `components/ai/preview-diff.tsx` | diff-added spans use bg-highlight text-highlight-foreground | VERIFIED | Line 128 confirmed; bg-primary/15 removed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/globals.css` | `tailwind.config.ts` | CSS variable names match config keys | WIRED | --highlight matches highlight: entry; --surface matches surface: entry |
| `components/history/status-badge.tsx` | tailwind.config.ts status entries | bg-status-*-bg resolves to hsl(var(--status-*-bg)) | WIRED | All five tokenized statuses; token chain intact |
| `components/ui/button.tsx` | `app/globals.css --muted` | hover:bg-muted resolves to warm muted 36 10% 94% | WIRED | Amber accent fully removed from interactive button states |
| `components/ai/preview-diff.tsx` | `app/globals.css --highlight` | bg-highlight resolves to 38 85% 90% light / 38 85% 30% dark | WIRED | Warm amber highlight; bg-primary/15 removed |

### WCAG Contrast Analysis

**Primary Button -- VERIFIED**

| Mode | Background | Text | Ratio | Result |
|------|-----------|------|-------|--------|
| Light | 213 60% 42% (soft blue) | 0 0% 98% (near-white) | 5.68:1 | PASS AA |
| Dark | 213 60% 58% (lighter blue) | 24 8% 10% (warm dark) | 5.13:1 | PASS AA |

**Muted Foreground -- VERIFIED**

| Mode | Text | Background | Ratio | Result |
|------|------|-----------|-------|--------|
| Light | 30 6% 40% | 36 20% 96% | 5.21:1 | PASS AA |
| Dark | 30 8% 62% | 24 8% 10% | 6.63:1 | PASS AA |

**Highlight Token -- VERIFIED**

| Mode | BG | Text | Ratio | Result |
|------|----|------|-------|--------|
| Light | 38 85% 90% | 24 10% 10% | 14.93:1 | PASS AAA |
| Dark | 38 85% 30% | 36 15% 96% | 5.16:1 | PASS AA |

**Status Badge Text Contrast -- PARTIAL FAILURE**

Light mode (text-on-badge-bg):

| Status | Ratio | Result |
|--------|-------|--------|
| Pending (220 43% 11% on 220 14% 90%) | 13.97:1 | PASS |
| Delivered (189 57% 40% on 194 38% 87%) | 2.91:1 | FAIL |
| Clicked (30 100% 27% on 43 92% 82%) | 5.71:1 | PASS |
| Failed (358 100% 38% on 0 100% 89%) | 4.33:1 | FAIL near-miss |
| Reviewed (149 100% 25% on 138 68% 86%) | 4.15:1 | FAIL near-miss |

Dark mode (text-on-badge-bg):

| Status | Ratio | Result |
|--------|-------|--------|
| Pending (220 14% 80% on 220 14% 20%) | 7.95:1 | PASS |
| Delivered (189 57% 55% on 189 30% 20%) | 5.02:1 | PASS |
| Clicked (30 80% 50% on 40 40% 20%) | 3.92:1 | FAIL |
| Failed (358 80% 55% on 0 40% 20%) | 3.32:1 | FAIL |
| Reviewed (149 80% 45% on 149 30% 20%) | 5.32:1 | PASS |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `app/globals.css` | --status-delivered-text 189 57% 40% produces 2.91:1 on badge bg | Blocker | Delivered badge text well below WCAG AA for small xs text |
| `app/globals.css` | --status-failed-text 358 100% 38% produces 4.33:1 on badge bg | Warning | Near-miss below 4.5:1 threshold |
| `app/globals.css` | --status-reviewed-text 149 100% 25% produces 4.15:1 on badge bg | Warning | Near-miss below 4.5:1 threshold |
| `app/globals.css` | --status-clicked-text dark 30 80% 50% produces 3.92:1 | Warning | Dark clicked badge text below AA |
| `app/globals.css` | --status-failed-text dark 358 80% 55% produces 3.32:1 | Warning | Dark failed badge text well below AA |

Note: Amber accent (38 92% 50%) at 1.97:1 on cream is intentional -- declared decorative-only. Not a blocker.

### Human Verification Required

**1. Status Badge Visual Distinguishability**

**Test:** Visit `/history` in light mode. Check if all five status badge types look distinct side-by-side.
**Expected:** Pending (blue-gray chip), Delivered (teal chip), Clicked (amber chip), Failed (red chip), Reviewed (green chip) each distinct from warm card background and from each other.
**Why human:** Badge-bg vs page-bg is 1.1-1.3:1 by design; hue distinguishability cannot be measured programmatically.

**2. Delivered/Failed/Reviewed Badge Text Legibility (Light Mode)**

**Test:** Look at the Delivered, Failed, and Reviewed badges on `/history` in light mode.
**Expected:** Badge label text readable without strain. If Delivered text appears very faint against its teal background, the gap is confirmed user-facing.
**Why human:** Contrast at 2.91:1, 4.33:1, 4.15:1 falls below WCAG AA. Perceptual acceptability requires human judgment.

**3. Dark Mode Warmth Impression**

**Test:** Toggle dark mode on `/dashboard`.
**Expected:** Background reads as warm dark charcoal (brownish-black), not cold neutral gray.
**Why human:** H=24 at 8% saturation is subtle warmth; perceptual quality cannot be verified from values alone.

**4. Dropdown Hover State**

**Test:** Open any action dropdown (three-dot menu on a table row) and hover over items.
**Expected:** Hovered item shows muted gray highlight, not amber wash.
**Why human:** Interactive hover states cannot be triggered programmatically.

### Gaps Summary

The warm palette migration is structurally complete. All nine files were modified as planned. Artifact existence, substantive, and wiring checks all pass. Primary button WCAG AA is confirmed (5.68:1 light, 5.13:1 dark). Highlight token is WCAG AAA in light (14.93:1) and AA in dark (5.16:1). Dark mode uses independently calibrated H=24 warm charcoal, not lightness-inverted from the light mode H=36 cream.

The single gap is in the status badge text token calibration in `app/globals.css`. The plan research stated text contrast would carry the primary distinguishability load for badges, but the chosen values do not achieve 4.5:1 for all five statuses in both modes. This is purely a token value calibration issue -- no component code changes are required. `components/history/status-badge.tsx` is correctly implemented.

The Delivered badge at 2.91:1 is the most significant failure -- well below the threshold and likely perceptibly faint at xs badge text size. Failed and Reviewed at 4.33:1 and 4.15:1 are near-misses. In dark mode, Clicked (3.92:1) and Failed (3.32:1) both fail. All five gaps can be resolved by adjusting only the five --status-*-text CSS variable values in globals.css. No component changes needed.

---

_Verified: 2026-02-19T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
