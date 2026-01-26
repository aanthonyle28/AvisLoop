-- Verification query: Run this to confirm RLS is enabled and policies exist
-- Expected output: profiles table should show rowsecurity = true

-- Check 1: RLS is enabled on profiles
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Check 2: Policies exist for profiles table
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Check 3: Index exists for performance
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'profiles';
