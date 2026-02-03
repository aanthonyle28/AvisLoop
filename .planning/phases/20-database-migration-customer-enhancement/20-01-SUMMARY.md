---
phase: 20-database-migration-customer-enhancement
plan: 01
subsystem: database
tags: [postgresql, migration, rls, multi-tenancy, schema]
dependency_graph:
  requires: [v1.0-contacts-crud, 00003_create_contacts, 00005_create_send_logs]
  provides: [customers-table, customer-terminology, compatibility-view]
  affects: [20-02-customer-fields, application-code-migration]
tech_stack:
  added: []
  patterns: [table-rename-migration, compatibility-view, atomic-migration]
file_tracking:
  created:
    - supabase/migrations/20260202_rename_contacts_to_customers.sql
  modified: []
decisions:
  - id: compatibility-view
    decision: Create view 'contacts' as SELECT * FROM customers
    rationale: Allows safe rollback during migration window
  - id: atomic-migration
    decision: All renames in single migration transaction
    rationale: Prevents partial migration state
metrics:
  duration: 3min
  completed: 2026-02-03
---

# Phase 20 Plan 01: Database Table Rename (contacts → customers) Summary

**One-liner:** Atomic PostgreSQL migration renaming contacts table to customers with RLS policy updates and compatibility view for v2.0 terminology alignment

## What Was Built

### Migration File: 20260202_rename_contacts_to_customers.sql

Complete atomic migration performing:

1. **Table rename:** `contacts` → `customers`
2. **Sequence rename:** `contacts_id_seq` → `customers_id_seq`
3. **Constraint renames:** All 4 constraints updated to use "customers" prefix
4. **Index renames:** All 3 indexes updated (business_id, business_status, sendable)
5. **RLS policy recreation:** Dropped old "contacts" policies, created new "customers" policies with identical logic
6. **Foreign key column rename:** `send_logs.contact_id` → `customer_id`
7. **FK index rename:** `idx_send_logs_contact_id` → `idx_send_logs_customer_id`
8. **Trigger rename:** `contacts_updated_at` → `customers_updated_at`
9. **Compatibility view:** Created `contacts` view (SELECT * FROM customers) with GRANT ALL to authenticated

### Documentation Update

docs/DATA_MODEL.md already contained comprehensive documentation of the customers table (created in plan 20-02), including:
- Full schema specification
- RLS policies and business ownership verification pattern
- Index documentation
- Foreign key relationships
- Compatibility view notes
- Future Phase 20 fields (tags, phone_status, timezone, SMS consent tracking)

## Technical Decisions

### Decision: Compatibility View Pattern

**Context:** Need to rename table but minimize risk during migration

**Decision:** Create view `contacts AS SELECT * FROM customers` with GRANT ALL

**Alternatives considered:**
1. Direct rename with no compatibility layer (higher risk)
2. Dual-write to both tables (complex, data sync issues)

**Rationale:**
- Allows old code referencing "contacts" to continue working
- Zero downtime migration path
- Easy rollback if issues discovered
- Remove view in future migration after code updated

### Decision: Single Atomic Migration

**Context:** Table rename affects multiple database objects (constraints, indexes, policies, FKs)

**Decision:** All renames in single migration file

**Rationale:**
- Prevents partial migration state
- All-or-nothing transaction semantics
- Easier to reason about database state
- Rollback is clean (entire migration reverts)

### Decision: RLS Policy Naming

**Context:** Policies have human-readable names with table references

**Decision:** Drop old policies, create new with "customers" naming but identical logic

**Rationale:**
- Policy names appear in error messages and logs
- Consistent naming reduces confusion
- Logic unchanged - only cosmetic rename for clarity

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Message |
|------|------|---------|
| 861cc7e | feat | Create migration to rename contacts to customers (Task 1) |

## Testing Performed

**Migration file verification:**
- ✅ Contains ALTER TABLE contacts RENAME TO customers
- ✅ Contains all constraint renames (4)
- ✅ Contains all index renames (3)
- ✅ Contains DROP POLICY and CREATE POLICY statements (4 each)
- ✅ Contains FK column rename (send_logs.contact_id → customer_id)
- ✅ Contains FK index rename
- ✅ Contains trigger rename
- ✅ Contains CREATE VIEW contacts AS SELECT * FROM customers
- ✅ Contains GRANT ALL ON contacts TO authenticated

**Documentation verification:**
- ✅ docs/DATA_MODEL.md exists
- ✅ Documents customers table schema
- ✅ Documents RLS policies and ownership pattern
- ✅ Documents indexes
- ✅ Documents foreign key relationships
- ✅ Documents compatibility view

## Files Changed

**Created:**
- `supabase/migrations/20260202_rename_contacts_to_customers.sql` (93 lines)

**Modified:**
- None (DATA_MODEL.md created in plan 20-02)

## Metrics

- **Tasks completed:** 2/2
- **Commits:** 1
- **Files created:** 1
- **Duration:** ~3 minutes

## Next Phase Readiness

### Blockers

None. Migration file ready for application.

### Prerequisites for Next Plan (20-02: Add Customer Enhancement Fields)

**Ready:**
- ✅ Migration file created and committed
- ✅ Documentation structure established

**Required before applying migration:**
1. Application code must be updated to reference "customers" table
2. TypeScript types must use "Customer" terminology
3. All API routes must use customer/customers naming
4. All UI components must use customer terminology

**Migration application strategy:**
1. Update all application code to use "customers" terminology (can happen while compatibility view exists)
2. Test thoroughly in local environment
3. Apply migration via `supabase db reset` (local) or `supabase db push` (remote)
4. Verify all CRUD operations work
5. Monitor for any code still using old "contacts" references
6. After 30 days of stability, remove compatibility view in future migration

### Concerns

**Timing considerations:**
- Migration is non-destructive (compatibility view provides safety)
- No data loss risk
- Rollback is simple (DROP VIEW contacts; ALTER TABLE customers RENAME TO contacts;)

**Application code migration:**
- All references to "contacts" table need updating across:
  - TypeScript types (`lib/db.types.ts`)
  - Server Actions (`app/actions/`)
  - API routes (`app/api/`)
  - UI components (`app/(dashboard)/`, `components/`)
  - Utility functions
- Search codebase for: "contacts", "contact_id", "Contact" type references

## Lessons Learned

### What Went Well

1. **Atomic migration pattern:** Single transaction for all renames provides clean semantics
2. **Compatibility view:** Safety net for gradual code migration
3. **Documentation-first:** DATA_MODEL.md structure established for future reference
4. **Explicit RLS policy naming:** Clear "customers" terminology in policy names

### What Could Be Improved

N/A - straightforward migration with no issues

### Future Recommendations

1. **Before applying this migration in production:**
   - Audit entire codebase for "contacts" references
   - Create checklist of all files requiring updates
   - Test locally with `supabase db reset` first

2. **After migration:**
   - Monitor error logs for any "relation contacts does not exist" errors
   - These would indicate code still using direct table references
   - Compatibility view will prevent runtime errors, but direct references should be updated

3. **Removing compatibility view:**
   - Schedule view removal for 30 days after code migration confirmed
   - Create migration: `DROP VIEW IF EXISTS public.contacts;`
   - This forces any remaining references to fail explicitly

## Knowledge for Future Agents

### Table Rename Migration Pattern

When renaming a table in Supabase with RLS:

**Required steps:**
1. Rename table
2. Rename sequence (if using serial/auto-increment)
3. Rename all constraints referencing table name
4. Rename all indexes referencing table name
5. Drop and recreate RLS policies with new names (logic unchanged)
6. Rename FK columns in other tables
7. Rename FK indexes
8. Rename triggers
9. Create compatibility view for safety

**SQL pattern:**
```sql
-- 1. Table
ALTER TABLE old_name RENAME TO new_name;

-- 2. Sequence
ALTER SEQUENCE old_name_id_seq RENAME TO new_name_id_seq;

-- 3. Constraints
ALTER TABLE new_name RENAME CONSTRAINT old_name_check TO new_name_check;

-- 4. Indexes
ALTER INDEX idx_old_name RENAME TO idx_new_name;

-- 5. Policies
DROP POLICY "Old policy name" ON new_name;
CREATE POLICY "New policy name" ON new_name FOR SELECT TO authenticated
USING (...same logic...);

-- 6. FK columns
ALTER TABLE other_table RENAME COLUMN old_name_id TO new_name_id;

-- 7. FK indexes
ALTER INDEX idx_other_old_id RENAME TO idx_other_new_id;

-- 8. Triggers
ALTER TRIGGER old_name_updated_at ON new_name RENAME TO new_name_updated_at;

-- 9. Compatibility
CREATE VIEW old_name AS SELECT * FROM new_name;
GRANT ALL ON old_name TO authenticated;
```

### Multi-Tenancy RLS Pattern

**Business ownership verification:**
```sql
business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
```

**Why subquery instead of JOIN:**
- RLS policies evaluate per row
- Subquery is clearer intent ("is this business owned by current user?")
- Performance similar with proper indexes

**Always match USING and WITH CHECK on UPDATE policies:**
```sql
CREATE POLICY "Users update own table"
ON table FOR UPDATE TO authenticated
USING (business_id IN (...))      -- Can they see the row?
WITH CHECK (business_id IN (...)); -- Can they modify business_id?
```

This prevents privilege escalation via changing `business_id` on a row.

---

**Plan Status:** ✅ COMPLETE

**Next Plan:** 20-02 (Add Customer Enhancement Fields: phone validation, tags, SMS consent, timezone)
