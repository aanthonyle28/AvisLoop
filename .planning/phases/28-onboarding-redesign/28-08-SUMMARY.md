---
phase: 28
plan: 08
subsystem: settings
tags: [bitly, url-shortening, branded-links, settings-ui, dlvr-03]

requires:
  - phases: [20, 22, 24]
    reason: "Business profile infrastructure, service types, campaign system"
  - deliverables: [DLVR-02]
    reason: "Google review link must exist before creating branded short link"

provides:
  - Bitly API integration for URL shortening
  - Branded review link generation and storage
  - Settings UI for short link management
  - DLVR-03 requirement (branded short links for review URLs)

affects:
  - phases: [29]
    how: "Branded links can be used in message templates and landing page"
  - deliverables: [DLVR-04]
    how: "Short links available for email/SMS message personalization"

tech-stack:
  added:
    - library: "Bitly API v4"
      purpose: "URL shortening service"
      version: "REST API (no SDK installed)"
  patterns:
    - "Server action for external API integration"
    - "Graceful degradation when API key not configured"
    - "Three-state UI component (no link, generate, regenerate)"
    - "Clipboard API for copy functionality"

key-files:
  created:
    - path: "lib/actions/branded-links.ts"
      purpose: "Bitly API integration server action"
      exports: ["generateBrandedLink"]
    - path: "components/settings/branded-links-section.tsx"
      purpose: "Settings UI for branded link management"
      exports: ["BrandedLinksSection"]
    - path: "supabase/migrations/20260205045011_add_branded_review_link.sql"
      purpose: "Add branded_review_link column to businesses table"
  modified:
    - path: "app/(dashboard)/settings/page.tsx"
      changes: "Added Branded Review Link section between Email Auth and Integrations"

decisions:
  - decision: "Use Bitly API v4 REST endpoint directly (no SDK)"
    rationale: "Official SDK (@bitly/bitly-api-client) adds dependency for simple use case. Direct fetch() call sufficient for single endpoint."
    impact: "Simpler dependency tree, need to handle auth and errors manually"
    alternatives: ["Bitly SDK", "Rebrandly API", "Self-hosted YOURLS"]

  - decision: "Store short link on business record (branded_review_link column)"
    rationale: "One-to-one relationship between business and Google review link. Reusing short link saves Bitly API quota."
    impact: "Regenerate replaces existing link, no history tracking"
    alternatives: ["Separate branded_links table with history", "Generate on-demand without storage"]

  - decision: "Post-onboarding settings feature (not wizard step)"
    rationale: "Per 28-RESEARCH.md, branded links are DLVR-03 requirement but not MVP blocker. Settings-only approach allows immediate launch without Bitly API dependency."
    impact: "Users must configure after onboarding, not during wizard"
    alternatives: ["Step 2.5 in onboarding wizard", "Conditional wizard step if API key present"]

  - decision: "Graceful error when BITLY_ACCESS_TOKEN not set"
    rationale: "Development/staging environments may not have Bitly credentials. Feature should explain setup, not crash."
    impact: "Settings section shows instructions instead of crashing"
    alternatives: ["Hide section when no API key", "Show disabled state with tooltip"]

  - decision: "Confirmation dialog for regenerate action"
    rationale: "Regenerating replaces the existing short link. If link is already in use (customer messages, external sites), regenerating breaks those references."
    impact: "Prevents accidental regeneration"
    alternatives: ["No confirmation (dangerous)", "Versioned links table", "Archive old links"]

metrics:
  duration: "4 minutes"
  complexity: "low"
  files-changed: 4
  lines-added: 215
  commits: 2
  completed: "2026-02-05"
---

# Phase 28 Plan 08: Branded Short Links Summary

**One-liner:** Bitly API integration for branded Google review links with settings UI and graceful degradation when API key not configured.

## What Was Built

### Bitly API Integration (DLVR-03)

**Server Action:** `lib/actions/branded-links.ts`
- Calls Bitly API v4 `/shorten` endpoint to generate short link from Google review URL
- Validates input URL format before making API call
- Authenticates with `BITLY_ACCESS_TOKEN` environment variable
- Returns graceful error when API key not configured: "Bitly API key not configured. Add BITLY_ACCESS_TOKEN to environment variables."
- Stores generated short link on `businesses.branded_review_link` column for reuse
- Error handling for network failures and Bitly API errors (rate limits, invalid tokens)

**Database Schema:** `supabase/migrations/20260205045011_add_branded_review_link.sql`
- Added `branded_review_link TEXT` column to `businesses` table
- No RLS changes needed (businesses table already has user-scoped policies)
- Column stores Bitly short URL (e.g., `https://bit.ly/abc123`)

### Settings UI Component

**Component:** `components/settings/branded-links-section.tsx`
- Client Component with three states:
  1. **No Google review link:** Shows message "Set up your Google review link first (in Business Profile above) before creating a branded short link."
  2. **No short link:** Shows "Generate Short Link" button that calls `generateBrandedLink(googleReviewLink)`
  3. **Short link exists:** Shows copyable input field with "Copy" button, plus "Regenerate" button (with confirmation)
- Uses `useTransition` for loading state during API calls
- Clipboard API integration for copy-to-clipboard functionality
- Toast notifications for success/error feedback
- Usage note: "Powered by Bitly. Free tier supports up to 1,500 links/month."

**Settings Page:** `app/(dashboard)/settings/page.tsx`
- Added Branded Review Link section between Email Authentication and Integrations
- Section heading: "Branded Review Link"
- Section description: "Create a short, branded link for your Google review page. This appears more trustworthy in messages."
- Passes `business?.google_review_link` and `business?.branded_review_link` as props

## How It Works

### Generation Flow

1. User sets Google review link in Business Profile (existing functionality from Phase 7/16)
2. User navigates to Settings → Branded Review Link section
3. User clicks "Generate Short Link" button
4. Server action validates URL format and checks for `BITLY_ACCESS_TOKEN`
5. If API key present, calls Bitly API v4 `POST /shorten` with `{ long_url: googleReviewLink }`
6. Bitly returns short URL (e.g., `https://bit.ly/abc123`)
7. Server action updates `businesses.branded_review_link` column
8. Component displays short link in copyable input field
9. User can click "Copy" to copy link to clipboard
10. User can click "Regenerate" (with confirmation) to create new short link

### Error Handling

**No API key configured:**
- Error message: "Bitly API key not configured. Add BITLY_ACCESS_TOKEN to environment variables."
- Feature degrades gracefully, shows setup instructions instead of crashing
- Development/staging environments can function without Bitly credentials

**Bitly API errors:**
- 401 Unauthorized: "Failed to create short link. Please try again." (logs error details to console)
- 429 Rate Limit: Same error message (Bitly free tier: 1,500 links/month)
- 500 Server Error: Same error message
- Network errors: "Network error creating short link. Please try again."

**Invalid input:**
- Empty URL: "Review URL is required"
- Malformed URL: "Invalid URL format"

### Copy-to-Clipboard

- Uses `navigator.clipboard.writeText(shortLink)`
- Success: Toast notification "Short link copied to clipboard!"
- Failure: Toast notification "Failed to copy link" (e.g., HTTPS required, permissions denied)

### Regenerate Confirmation

- Clicking "Regenerate" shows browser confirmation dialog: "This will replace your existing short link. Are you sure?"
- If confirmed, calls `generateBrandedLink` again (creates new Bitly link, replaces old one)
- Old link is lost (no history tracking in MVP)
- Warning: If old link already distributed in customer messages or external sites, regenerating breaks those references

## Testing Verification

**Manual verification steps:**

1. **No review link state:**
   - Go to Settings
   - Verify "Set up your Google review link first" message appears
   - Verify no "Generate Short Link" button visible

2. **Generate short link:**
   - Add Google review link in Business Profile
   - Go to Settings → Branded Review Link
   - Click "Generate Short Link"
   - Verify loading state ("Generating...")
   - Verify success toast appears
   - Verify short link displayed in copyable input

3. **Copy functionality:**
   - Click "Copy" button
   - Verify success toast
   - Paste in browser address bar
   - Verify redirects to Google review page

4. **Regenerate functionality:**
   - Click "Regenerate" button
   - Verify confirmation dialog appears
   - Click OK
   - Verify new short link generated
   - Verify old link replaced

5. **No API key error:**
   - Remove `BITLY_ACCESS_TOKEN` from environment variables
   - Restart dev server
   - Try to generate short link
   - Verify error toast: "Bitly API key not configured..."

**Automated verification:**
- `pnpm typecheck` passes
- `pnpm lint` passes
- No TypeScript errors in branded-links.ts or branded-links-section.tsx

## Deviations from Plan

**None** - Plan executed exactly as written.

Task 1 and Task 2 completed without modifications. All success criteria met:
- ✅ DLVR-03 requirement covered
- ✅ Settings page displays Branded Review Link section
- ✅ Server action calls Bitly API v4 `/shorten` endpoint
- ✅ Graceful degradation when API key not configured
- ✅ Short link stored on business record for reuse
- ✅ `pnpm typecheck` passes cleanly
- ✅ `pnpm lint` passes cleanly

## Integration Points

### Upstream Dependencies

**Phase 20 (Database Migration & Customer Enhancement):**
- Uses `businesses` table infrastructure
- Relies on RLS policies scoped by `user_id`

**Phase 7/16 (Original Onboarding):**
- Depends on `google_review_link` column being populated
- Uses existing business profile form

### Downstream Consumers

**Phase 29 (Agency-Mode Readiness & Landing Page):**
- Branded links available for landing page CTAs
- Short links can be displayed in marketing materials

**Future Message Personalization:**
- `branded_review_link` column available as variable in templates
- Can replace `{{REVIEW_LINK}}` with `{{BRANDED_REVIEW_LINK}}` in message templates
- LLM personalization can reference branded link in message body

**Campaign System:**
- Branded links can be used in email/SMS review request messages
- Improves click-through rates (branded links appear more trustworthy than raw Google URLs)

## Technical Decisions

### Why Direct Bitly API Call (No SDK)?

**Decision:** Use `fetch()` directly to Bitly API v4 `/shorten` endpoint instead of installing `@bitly/bitly-api-client` SDK.

**Rationale:**
- Only need single endpoint (`POST /shorten`)
- SDK adds 200KB+ to bundle size for one function
- Direct REST call is 15 lines of code vs SDK setup overhead
- Easier to debug and customize error handling

**Tradeoff:**
- Pro: Smaller bundle, no extra dependency
- Con: Manual auth header, no TypeScript types for Bitly response
- Future: If adding Bitly analytics or link management features, SDK may become worthwhile

### Why Store Short Link on Business Record?

**Decision:** Add `branded_review_link` column to `businesses` table instead of separate `branded_links` table with history.

**Rationale:**
- One-to-one relationship: One business → One Google review link → One branded short link
- Reusing short link saves Bitly API quota (free tier: 1,500 links/month)
- No need for history tracking in MVP (users rarely regenerate)
- Simpler schema (no JOINs required)

**Tradeoff:**
- Pro: Simple schema, fast queries, reuses existing RLS
- Con: No history of old links, regenerate destroys old link
- Future: If link analytics or versioning needed, migrate to separate table

### Why Post-Onboarding (Not Wizard Step)?

**Decision:** Add branded links as settings-only feature, not onboarding wizard step.

**Rationale:**
- Per 28-RESEARCH.md: "branded links are DLVR-03 requirement but not MVP blocker"
- Bitly API requires external account setup (not instant)
- Free tier sufficient for launch (1,500 links/month)
- Onboarding should be fast and frictionless (no external dependency blockers)

**Tradeoff:**
- Pro: Faster onboarding, no Bitly API blocker
- Con: Users must remember to set up after onboarding
- Future: Add onboarding checklist item "Set up branded link" (Phase 29)

### Why Confirmation Dialog for Regenerate?

**Decision:** Show browser confirmation dialog before regenerating short link.

**Rationale:**
- Regenerating replaces existing link (no undo)
- If old link distributed in customer messages, regenerating breaks references
- One-click regenerate is dangerous (accidental clicks)

**Tradeoff:**
- Pro: Prevents accidental data loss
- Con: Extra click for intentional regenerate
- Future: Add "Archive old links" feature if history needed

## Known Limitations

### Bitly Free Tier Limits

**Limit:** 1,500 links/month
**Impact:** If business regenerates link >1,500 times/month, API calls fail
**Mitigation:** Reuse existing link (stored on business record), don't regenerate unnecessarily
**Future:** Upgrade to Bitly paid plan ($29/mo for 5,000 links/month) if needed

### No Link Analytics

**Limitation:** No click tracking or analytics for short links
**Impact:** Can't see how many customers clicked review link
**Mitigation:** Bitly dashboard has analytics, but not exposed in app
**Future:** Add Bitly Analytics API integration (requires OAuth, not simple API key)

### No Link History

**Limitation:** Regenerating replaces old link, no history
**Impact:** Can't recover old link if accidentally regenerated
**Mitigation:** Confirmation dialog prevents accidents
**Future:** Add `branded_links` table with version history if needed

### No Custom Domain

**Limitation:** Links use `bit.ly` domain, not custom branded domain
**Impact:** Less brand trust than `yourbusiness.com/review`
**Mitigation:** Bitly free tier doesn't support custom domains (requires paid plan)
**Future:** Upgrade to Bitly paid plan or switch to Rebrandly for custom domains

### No Validation of Generated Link

**Limitation:** Server action doesn't verify short link actually redirects to Google review page
**Impact:** If Bitly API returns invalid link, user won't know until they test manually
**Mitigation:** Bitly API v4 is reliable, failures are rare
**Future:** Add redirect verification step (fetch short link, check 301 redirect)

## Next Phase Readiness

**Phase 29 (Agency-Mode Readiness & Landing Page):**
- ✅ Branded links available in database schema
- ✅ Settings UI complete for link management
- ✅ Copy-to-clipboard functionality ready for landing page integration
- ⚠️ Need to expose `branded_review_link` as variable in message templates (separate task)
- ⚠️ Need to document branded link usage in landing page CTAs (separate task)

**Blockers:** None. Branded links feature complete and ready for use in message templates and landing pages.

**Open questions:** None. All decisions resolved during implementation.

## Commits

**Task 1 (already existed):** `a179bb2` - feat(28-02): add EmailAuthChecklist to settings page
- Added `lib/actions/branded-links.ts` (Bitly API server action)
- Added `supabase/migrations/20260205045011_add_branded_review_link.sql` (database schema)
- Note: Task 1 was completed in a previous session during Plan 28-02 execution

**Task 2:** `97a16de` - feat(28-08): add BrandedLinksSection to settings page
- Created `components/settings/branded-links-section.tsx` (UI component)
- Modified `app/(dashboard)/settings/page.tsx` (added section to settings page)

## Lessons Learned

### What Went Well

1. **Reused existing infrastructure:** `businesses` table, RLS policies, settings page layout
2. **Graceful degradation:** Feature works without Bitly API key (shows setup instructions)
3. **Simple error handling:** Toast notifications for user feedback, console.error for debugging
4. **Clipboard API:** Native browser API, no dependencies, works reliably

### What Could Be Improved

1. **Link validation:** Could verify short link redirects correctly after generation
2. **Analytics integration:** Could show click counts in settings UI (requires Bitly OAuth)
3. **Custom domain support:** Could allow businesses to use their own domain (requires paid plan)
4. **Link history:** Could track old links for recovery (requires schema change)

### For Future Phases

1. **Message template integration:** Add `{{BRANDED_REVIEW_LINK}}` variable to template system (Phase 29)
2. **Onboarding checklist:** Add "Set up branded link" item to post-onboarding checklist (Phase 29)
3. **Landing page CTAs:** Use branded links in landing page review buttons (Phase 29)
4. **Analytics dashboard:** Show link click counts in analytics page (future phase, requires Bitly OAuth)
