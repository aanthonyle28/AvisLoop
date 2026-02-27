# Domain Pitfalls: v3.0 Agency Mode

**Domain:** Adding multi-business agency management to an existing single-business Next.js + Supabase SaaS
**Researched:** 2026-02-26
**Confidence:** HIGH — based on direct codebase inspection of all affected patterns

---

## Critical Pitfalls

### Pitfall 1: 86 `.eq('user_id').single()` Calls Throw PGRST116 With Multiple Businesses

**What goes wrong:**
The moment a user creates a second business, every call to `.from('businesses').select('*').eq('user_id', user.id).single()` returns a Postgres error (PGRST116: multiple rows returned). This crashes every page in the dashboard, every server action, and every data function.

**Scale of the problem:**
~86 instances across 20+ files. This is not a "fix a few files" situation — it touches nearly every feature in the app.

**Consequences:**
- Dashboard crashes immediately after creating second business
- Server actions fail silently or throw 500 errors
- User is effectively locked out of the app with no recovery path

**Prevention strategy:**
1. Create `getActiveBusiness()` that reads cookie and returns one specific business
2. Create a migration script/checklist of every `.single()` instance
3. Refactor ALL instances before enabling multi-business creation
4. Test with 2+ businesses before any UI work begins

**Warning signs:**
- After creating second business, any page throws "PGRST116" or returns 500
- Functions that worked with one business suddenly return null/error

**Phase to address:** Must be the first phase — before business switcher or clients page

---

### Pitfall 2: Onboarding `saveBusinessBasics()` Upsert Destroys First Business

**What goes wrong:**
`saveBusinessBasics()` uses `.upsert()` with `user_id` as the conflict key. When creating a SECOND business through the onboarding wizard, this silently OVERWRITES the first business's name, Google review link, and all settings.

**The current code path:**
```typescript
// Dangerous for multi-business
await supabase
  .from('businesses')
  .upsert({ user_id: user.id, name: businessName, ... })
  // Upsert on user_id → overwrites existing business
```

**Consequences:**
- First client's business data silently replaced with second client's data
- All jobs, enrollments, send logs still point to the first business ID but now the business has wrong name/settings
- No error thrown — the operation "succeeds"
- Data loss is discovered only when checking the first client's settings

**Prevention strategy:**
- NEVER use the existing onboarding upsert for additional businesses
- Create a dedicated `createAdditionalBusiness()` server action that uses `.insert()` only
- Add a guard: if user already has a business, redirect away from onboarding or use the different code path
- Test: create business A, then create business B, verify A is unchanged

**Warning signs:**
- After creating second business, first business's name/settings changed
- Google review link for first business now points to second business's link

**Phase to address:** Must be resolved before enabling "Add Business" from Clients page

---

### Pitfall 3: Cookie-Based Context vs URL — The Most Consequential Architecture Decision

**What goes wrong (with cookies):**
- Browser tabs share cookies — opening two tabs with different businesses causes data corruption
- Bookmarks don't capture which business was active
- Back/forward navigation doesn't restore business context
- If cookie is cleared/expired, user sees random first business

**What goes wrong (with URL segments):**
- Requires restructuring ALL routes from `/dashboard` to `/[businessId]/dashboard`
- All internal links need businessId parameter
- Much higher implementation effort
- Route middleware needs updating

**For 2-5 clients, cookie approach is acceptable** because:
- Agency owner typically works one client at a time
- Multi-tab is rare at this scale
- URL approach is 3-5x more engineering effort

**Prevention strategy:**
- Commit to cookie approach early (don't change mid-implementation)
- Document the multi-tab limitation
- Set cookie with `path: '/'` and `sameSite: 'lax'`
- Always validate cookie value against owned businesses (prevent tampering)
- Fallback gracefully when cookie is missing (use first business)

**Warning signs:**
- User opens two tabs, switches business in one, other tab shows mixed data
- Deployed app loses business context after session timeout

**Phase to address:** Foundation phase — decide and implement once

---

## Moderate Pitfalls

### Pitfall 4: RLS Is Already Safe — But Don't Add New Tables Without Policies

**What goes wrong:**
Existing RLS policies use `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())`. This already supports multiple businesses. However, if new tables are added for agency features (e.g., `agency_metadata`) without RLS, they leak data.

**Prevention strategy:**
- Don't create new tables — use columns on `businesses` table
- If new tables are absolutely needed, copy the existing RLS pattern
- Test with two different users to verify isolation

**Phase to address:** Schema migration phase

---

### Pitfall 5: BusinessSettingsProvider Only Has Service Types — No Business Identity

**What goes wrong:**
`BusinessSettingsProvider` currently provides `enabledServiceTypes` and `customServiceNames` to client components. It does NOT provide `businessId` or `businessName`. Client components that need the current business name (e.g., sidebar switcher) can't access it without prop drilling or a new provider.

**Prevention strategy:**
- Extend `BusinessSettingsProvider` to include `businessId`, `businessName`, and `businesses` list
- Or create a separate `BusinessContextProvider` at the layout level
- Ensure Server Components pass the data down; don't fetch in client components

**Phase to address:** Foundation phase — extend provider before building switcher

---

### Pitfall 6: Billing Usage Count Must Sum Across All Businesses

**What goes wrong:**
Current usage counting queries sends for one business. If billing checks `send_count WHERE business_id = X`, it only counts one business's sends against the limit. The agency owner gets effectively unlimited sends by distributing across businesses.

**Prevention strategy:**
- Change billing usage query to: `SUM(sends) WHERE business_id IN (SELECT id FROM businesses WHERE user_id = ?)`
- Or count by `user_id` directly through a join
- Test: create 2 businesses, send from both, verify combined count hits limit

**Warning signs:**
- Agency owner exceeds plan limits without hitting paywall
- Usage meter shows low count despite heavy sending

**Phase to address:** Billing phase — after data refactor

---

### Pitfall 7: Dashboard → Onboarding Redirect Logic Breaks With Multiple Businesses

**What goes wrong:**
`app/(dashboard)/dashboard/page.tsx` calls `getBusiness()` and redirects to `/onboarding` if it returns null. With multiple businesses:
- If `getActiveBusiness()` returns null (no cookie set), user gets redirected to onboarding even though they have businesses
- The redirect check needs to be "user has NO businesses" not "current business is null"

**Prevention strategy:**
- Separate the checks: "has any business?" vs "has active business selected?"
- No businesses → redirect to onboarding
- Has businesses but no active selection → set first business as active, don't redirect
- Cookie cleared → auto-select first business

**Warning signs:**
- User with businesses keeps getting redirected to onboarding
- Creating second business redirects back to onboarding

**Phase to address:** Data refactor phase — when updating dashboard page

---

### Pitfall 8: Scheduled Sends and Cron Processors Use Service Role — Not Affected by Cookie

**What goes wrong (or rather, what doesn't):**
Cron endpoints (`/api/cron/process-campaign-touches`, `/api/cron/resolve-enrollment-conflicts`) use the Supabase service role, not user sessions. They query by `business_id` directly. These are NOT affected by the cookie-based context switch — they already work correctly with multiple businesses.

**Prevention strategy:**
- Don't touch cron endpoints during the data refactor
- Verify they query by `business_id` (they do)
- Leave them as-is

**Phase to address:** None — but document this as a non-issue to prevent unnecessary changes

---

## Minor Pitfalls

### Pitfall 9: Sidebar Width May Need Adjustment for Business Names

**What goes wrong:**
The sidebar has a fixed collapsed/expanded width. Long business names (e.g., "Johnson's HVAC & Plumbing Services LLC") may overflow or truncate awkwardly in the switcher dropdown.

**Prevention strategy:**
- Use `truncate` class on business name display
- Show full name in tooltip on hover
- Dropdown items can be wider than sidebar

---

### Pitfall 10: Mobile Bottom Nav Has No Business Switcher Access

**What goes wrong:**
Desktop has sidebar with switcher. Mobile has bottom nav with 4-5 items, no room for a switcher. Users on mobile can't switch businesses.

**Prevention strategy:**
- Add business switcher to mobile header area (not bottom nav)
- Or add a dedicated business switcher sheet accessible from account/settings

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schema migration | Pitfall 4 — new columns without RLS review | All columns on existing RLS-protected table |
| Business resolver | Pitfall 3 — cookie decision | Commit to cookie, document limitations |
| Data refactor | Pitfall 1 — missing .single() instances | Grep exhaustively, test with 2 businesses |
| Dashboard pages | Pitfall 7 — redirect logic | Separate "no businesses" vs "no selection" |
| Sidebar switcher | Pitfall 5 — provider missing data | Extend provider first |
| Additional onboarding | Pitfall 2 — upsert overwrites | Use .insert() only path |
| Billing | Pitfall 6 — per-business counting | Sum across all owned businesses |
| Cron endpoints | Pitfall 8 — not affected | Leave alone, document |

---

## "Looks Done But Isn't" Checklist

- [ ] Create business A, create business B, verify A's name/settings unchanged
- [ ] Switch to business A in sidebar, verify dashboard shows A's data
- [ ] Switch to business B, verify all pages now show B's data
- [ ] Open two browser tabs, switch business in one — verify other tab behavior is acceptable
- [ ] Delete cookies, reload — verify first business auto-selected (not crash)
- [ ] Check billing usage — verify it counts sends across ALL businesses
- [ ] Create job in business B — verify it doesn't appear in business A's job list
- [ ] Cron runs — verify it processes touches for all businesses (not just cookie-selected one)
- [ ] Mobile — verify business switching is accessible

---

*Pitfalls research for: v3.0 Agency Mode*
*Researched: 2026-02-26*
*Confidence: HIGH — all critical pitfalls verified against actual codebase patterns*
