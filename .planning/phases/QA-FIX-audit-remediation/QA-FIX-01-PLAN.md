---
phase: QA-FIX-audit-remediation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260206_add_business_phone_column.sql
  - supabase/migrations/20260206_add_service_type_analytics_rpc.sql
autonomous: true

must_haves:
  truths:
    - "Onboarding Step 1 saves business with phone number without error"
    - "Analytics page displays service type breakdown with real data"
    - "No 'phone column not in schema cache' errors occur"
  artifacts:
    - path: "supabase/migrations/20260206_add_business_phone_column.sql"
      provides: "Phone column on businesses table"
      contains: "ALTER TABLE businesses ADD COLUMN phone"
    - path: "supabase/migrations/20260206_add_service_type_analytics_rpc.sql"
      provides: "RPC function for service type analytics"
      contains: "CREATE OR REPLACE FUNCTION get_service_type_analytics"
  key_links:
    - from: "app/(dashboard)/onboarding/actions.ts"
      to: "businesses.phone column"
      via: "Supabase insert"
      pattern: "phone"
    - from: "lib/data/analytics.ts"
      to: "get_service_type_analytics RPC"
      via: "supabase.rpc call"
      pattern: "supabase\\.rpc\\('get_service_type_analytics'"
---

<objective>
Fix two critical blockers from QA-AUDIT: missing phone column on businesses table (C01) and missing get_service_type_analytics RPC function (C02).

Purpose: Unblock new user onboarding and restore analytics functionality.
Output: Two SQL migration files applied to database, both critical blockers resolved.
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@docs/QA-AUDIT.md
@lib/data/analytics.ts (lines 39-52 show RPC call)
@app/(dashboard)/onboarding/actions.ts (expects phone column)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create migration for businesses.phone column (C01)</name>
  <files>supabase/migrations/20260206_add_business_phone_column.sql</files>
  <action>
Create a new migration file that adds the phone column to the businesses table.

The column should be:
- Column name: phone
- Type: TEXT
- Nullable: TRUE (phone is optional during onboarding)
- No CHECK constraint (E.164 validation happens in app code, not DB)

Migration filename: 20260206_add_business_phone_column.sql

SQL content:
```sql
-- Add phone column to businesses table
-- Referenced by Phase 28 onboarding step 1
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN businesses.phone IS 'Business phone number, E.164 format validated in app layer';
```
  </action>
  <verify>
Run: `grep -l "phone" supabase/migrations/20260206_add_business_phone_column.sql`
Verify file exists and contains ALTER TABLE statement.
  </verify>
  <done>Migration file exists with correct ALTER TABLE statement for phone column.</done>
</task>

<task type="auto">
  <name>Task 2: Create migration for get_service_type_analytics RPC (C02)</name>
  <files>supabase/migrations/20260206_add_service_type_analytics_rpc.sql</files>
  <action>
Create a new migration file that adds the get_service_type_analytics Postgres RPC function.

The function must:
- Take p_business_id UUID as parameter
- Return TABLE with columns: service_type TEXT, total_sent BIGINT, delivered BIGINT, reviewed BIGINT, feedback_count BIGINT
- Join jobs with send_logs to get sends by service type
- Join with customer_feedback to get feedback counts
- Use SECURITY DEFINER to allow RLS bypass (caller is authenticated)
- Filter by business_id for multi-tenant safety

Migration filename: 20260206_add_service_type_analytics_rpc.sql

SQL content:
```sql
-- Add get_service_type_analytics RPC function
-- Called by lib/data/analytics.ts for service type breakdown

CREATE OR REPLACE FUNCTION get_service_type_analytics(p_business_id UUID)
RETURNS TABLE (
  service_type TEXT,
  total_sent BIGINT,
  delivered BIGINT,
  reviewed BIGINT,
  feedback_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.service_type::TEXT,
    COUNT(sl.id)::BIGINT AS total_sent,
    COUNT(sl.id) FILTER (WHERE sl.status IN ('sent', 'delivered', 'opened'))::BIGINT AS delivered,
    COUNT(sl.id) FILTER (WHERE sl.reviewed_at IS NOT NULL)::BIGINT AS reviewed,
    COALESCE((
      SELECT COUNT(*)::BIGINT
      FROM customer_feedback cf
      WHERE cf.business_id = p_business_id
        AND cf.customer_id = j.customer_id
    ), 0) AS feedback_count
  FROM jobs j
  LEFT JOIN send_logs sl ON sl.job_id = j.id
  WHERE j.business_id = p_business_id
  GROUP BY j.service_type, j.customer_id
  ORDER BY COUNT(sl.id) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION get_service_type_analytics(UUID) IS 'Returns analytics breakdown by service type for a business';
```

Note: The SECURITY DEFINER allows the function to bypass RLS. The caller must be authenticated (verified by Supabase middleware before the function is called).
  </action>
  <verify>
Run: `grep -l "get_service_type_analytics" supabase/migrations/20260206_add_service_type_analytics_rpc.sql`
Verify file exists and contains CREATE OR REPLACE FUNCTION statement.
  </verify>
  <done>Migration file exists with correct RPC function definition.</done>
</task>

<task type="auto">
  <name>Task 3: Apply migrations to local database</name>
  <files>None (database operation)</files>
  <action>
Apply the two new migrations to the local Supabase database.

Steps:
1. Run `npx supabase db reset` to apply all migrations including the new ones
   OR run `npx supabase migration up` if only applying new migrations

If using remote database:
1. Run `npx supabase db push` to push migrations to remote

After applying, verify:
1. Check businesses table has phone column: `SELECT column_name FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'phone';`
2. Check RPC function exists: `SELECT proname FROM pg_proc WHERE proname = 'get_service_type_analytics';`

Note: If running in local dev environment without Supabase CLI access, create a CHECKPOINT note for manual application.
  </action>
  <verify>
If local: `npx supabase db reset` completes without error
If remote: `npx supabase db push` completes without error
TypeScript: `pnpm typecheck` passes (no schema cache errors expected in types)
  </verify>
  <done>Migrations applied successfully, phone column and RPC function exist in database.</done>
</task>

</tasks>

<verification>
1. Migration files exist in supabase/migrations/ with correct timestamps
2. `pnpm typecheck` passes with no errors
3. Onboarding Step 1 can save business with phone number (manual test or E2E)
4. Analytics page loads service type breakdown (manual test or E2E)
</verification>

<success_criteria>
- [ ] supabase/migrations/20260206_add_business_phone_column.sql exists with ALTER TABLE statement
- [ ] supabase/migrations/20260206_add_service_type_analytics_rpc.sql exists with CREATE FUNCTION statement
- [ ] Migrations applied to database (local or remote)
- [ ] No TypeScript errors after migration
- [ ] C01 (onboarding phone error) resolved
- [ ] C02 (analytics RPC missing) resolved
</success_criteria>

<output>
After completion, create `.planning/phases/QA-FIX-audit-remediation/QA-FIX-01-SUMMARY.md`
</output>
