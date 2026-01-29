---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00009_add_reviewed_at.sql
  - lib/data/send-logs.ts
  - components/dashboard/response-rate-card.tsx
  - app/dashboard/page.tsx
autonomous: true

must_haves:
  truths:
    - "Dashboard shows response rate percentage prominently"
    - "Dashboard shows raw responded/total numbers"
    - "Dashboard shows contextual tip based on percentage tier"
    - "Widget handles zero-data state gracefully"
    - "reviewed_at column exists on send_logs with RLS intact"
  artifacts:
    - path: "supabase/migrations/00009_add_reviewed_at.sql"
      provides: "reviewed_at column on send_logs"
      contains: "reviewed_at"
    - path: "lib/data/send-logs.ts"
      provides: "getResponseRate function"
      exports: ["getResponseRate"]
    - path: "components/dashboard/response-rate-card.tsx"
      provides: "ResponseRateCard component"
      exports: ["ResponseRateCard"]
    - path: "app/dashboard/page.tsx"
      provides: "Dashboard with response rate widget integrated"
  key_links:
    - from: "app/dashboard/page.tsx"
      to: "lib/data/send-logs.ts"
      via: "getResponseRate() call in Promise.all"
      pattern: "getResponseRate"
    - from: "app/dashboard/page.tsx"
      to: "components/dashboard/response-rate-card.tsx"
      via: "ResponseRateCard component render"
      pattern: "ResponseRateCard"
---

<objective>
Add a Response Rate dashboard widget that shows what percentage of review request recipients actually submitted a review.

Purpose: Give business owners visibility into how effective their review requests are, with actionable tips to improve.
Output: Migration file, data function, React component, and dashboard integration.
</objective>

<execution_context>
@C:\AvisLoop\.claude/get-shit-done/workflows/execute-plan.md
@C:\AvisLoop\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:\AvisLoop\CLAUDE.md
@C:\AvisLoop\docs\PROJECT_STATE.md
@C:\AvisLoop\supabase\migrations\00005_create_send_logs.sql
@C:\AvisLoop\lib\data\send-logs.ts
@C:\AvisLoop\app\dashboard\page.tsx
@C:\AvisLoop\components\dashboard\next-action-card.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add reviewed_at column and getResponseRate data function</name>
  <files>
    supabase/migrations/00009_add_reviewed_at.sql
    lib/data/send-logs.ts
  </files>
  <action>
    1. Create migration `supabase/migrations/00009_add_reviewed_at.sql`:
       - `ALTER TABLE public.send_logs ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL;`
       - Add an index for response rate queries: `CREATE INDEX IF NOT EXISTS idx_send_logs_reviewed_at ON public.send_logs USING btree (business_id) WHERE reviewed_at IS NOT NULL;`
       - No new RLS policies needed — existing SELECT/UPDATE policies on send_logs already cover this column. Add a comment noting this.

    2. Add `getResponseRate()` function to `lib/data/send-logs.ts`:
       - Export an async function `getResponseRate` that returns `{ total: number; responded: number; rate: number }`.
       - Auth pattern: match existing functions — get user via `supabase.auth.getUser()`, get business via businesses table, return `{ total: 0, responded: 0, rate: 0 }` if no user or no business.
       - Query total: count send_logs for business_id where status IN ('sent', 'delivered', 'opened') — exclude pending/failed/bounced/complained since those never reached the contact.
       - Query responded: count send_logs for business_id where reviewed_at IS NOT NULL.
       - Use two `select('*', { count: 'exact', head: true })` queries (same pattern as `getMonthlyUsage`).
       - Calculate rate: `total > 0 ? Math.round((responded / total) * 100) : 0`.
       - Return `{ total, responded, rate }`.
  </action>
  <verify>
    - `pnpm typecheck` passes with no errors.
    - Migration file exists and contains valid SQL (ALTER TABLE, CREATE INDEX).
    - `getResponseRate` is exported from `lib/data/send-logs.ts`.
  </verify>
  <done>
    - `reviewed_at` column migration is ready to apply.
    - `getResponseRate()` returns `{ total, responded, rate }` scoped to authenticated user's business.
  </done>
</task>

<task type="auto">
  <name>Task 2: Build ResponseRateCard component and integrate into dashboard</name>
  <files>
    components/dashboard/response-rate-card.tsx
    app/dashboard/page.tsx
  </files>
  <action>
    1. Create `components/dashboard/response-rate-card.tsx` as a Server Component:
       - Props: `{ total: number; responded: number; rate: number }`.
       - Import `TrendingUp` (or `BarChart3`) from lucide-react for the icon, matching the icon style of existing stats cards.
       - Layout: Match the existing stats card pattern from the dashboard (rounded-lg border bg-card p-6, icon in colored circle, etc.).
       - Show rate as the large number: `<span className="text-3xl font-bold">{rate}%</span>`.
       - Show raw numbers: `<span className="text-muted-foreground">{responded} of {total} responded</span>`.
       - Color indicator based on tier — use a small colored dot or bar:
         - 0% (no data): gray (`text-muted-foreground`)
         - 1-10%: red (`text-red-500`)
         - 10-25%: orange (`text-orange-500`)
         - 25-40%: yellow (`text-yellow-500`)
         - 40-60%: green (`text-green-500`)
         - 60%+: emerald (`text-emerald-500`)
       - Contextual tip message below the numbers in `text-sm text-muted-foreground`:
         - 0% and total === 0: "Send your first review request to start tracking"
         - 0% and total > 0: "No responses yet -- consider following up"
         - 1-10%: "Try personalizing your subject line or sending at different times"
         - 10-25%: "Below average -- consider following up with non-responders"
         - 25-40%: "On track -- consistent sending keeps momentum"
         - 40-60%: "Strong response rate -- your messaging is resonating"
         - 60%+: "Excellent -- your customers are highly engaged"

    2. Update `app/dashboard/page.tsx`:
       - Import `getResponseRate` from `@/lib/data/send-logs`.
       - Import `ResponseRateCard` from `@/components/dashboard/response-rate-card`.
       - Add `getResponseRate()` to the existing `Promise.all` on line 32 (add as 5th element).
       - Destructure as `responseRate` from the Promise.all result.
       - Add `<ResponseRateCard {...responseRate} />` as a third card in the quick stats grid (the `grid gap-4 sm:grid-cols-2` div around line 82). Change grid to `sm:grid-cols-3` to accommodate 3 cards, or keep `sm:grid-cols-2` and let it wrap naturally (prefer keeping sm:grid-cols-2 so it looks good on smaller screens — the third card will take full width below on sm, which is fine).
       - Place the ResponseRateCard AFTER the Contacts card (as the third card in the grid).
  </action>
  <verify>
    - `pnpm typecheck` passes.
    - `pnpm lint` passes.
    - `ResponseRateCard` renders with all tier messages (verify by reading the component code).
    - Dashboard page imports and renders `ResponseRateCard` with data from `getResponseRate`.
  </verify>
  <done>
    - ResponseRateCard component displays rate percentage, raw numbers, color indicator, and contextual tip.
    - Dashboard page fetches response rate data and renders the widget in the stats grid.
    - All lint and typecheck passing.
  </done>
</task>

</tasks>

<verification>
- `pnpm typecheck` passes with zero errors.
- `pnpm lint` passes with zero errors.
- Migration file `00009_add_reviewed_at.sql` contains ALTER TABLE and CREATE INDEX statements.
- `getResponseRate` exported from `lib/data/send-logs.ts` with correct return type.
- `ResponseRateCard` component handles all 7 tier cases (0/no-data, 0/has-data, 1-10, 10-25, 25-40, 40-60, 60+).
- Dashboard page calls `getResponseRate()` in Promise.all and renders `ResponseRateCard`.
</verification>

<success_criteria>
- Dashboard displays a response rate widget showing percentage, raw counts, colored indicator, and contextual tip.
- The widget handles zero-data gracefully with an appropriate message.
- Schema migration is ready to apply (reviewed_at column on send_logs).
- No regressions — existing dashboard functionality unchanged.
</success_criteria>

<output>
After completion, create `.planning/quick/001-response-rate-dashboard-widget/001-SUMMARY.md`
</output>
