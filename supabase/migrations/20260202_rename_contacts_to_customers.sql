-- Migration: 20260202_rename_contacts_to_customers
-- Purpose: Rename contacts table to customers for v2.0 terminology alignment
-- Part of: Phase 20 - Database Migration & Customer Enhancement (CUST-01)

-- ============================================================================
-- 1. Rename table
-- ============================================================================
ALTER TABLE public.contacts RENAME TO customers;

-- ============================================================================
-- 2. Rename sequence
-- ============================================================================
ALTER SEQUENCE contacts_id_seq RENAME TO customers_id_seq;

-- ============================================================================
-- 3. Rename constraints
-- ============================================================================
ALTER TABLE public.customers RENAME CONSTRAINT contacts_name_not_empty TO customers_name_not_empty;
ALTER TABLE public.customers RENAME CONSTRAINT contacts_email_not_empty TO customers_email_not_empty;
ALTER TABLE public.customers RENAME CONSTRAINT contacts_status_valid TO customers_status_valid;
ALTER TABLE public.customers RENAME CONSTRAINT contacts_unique_email_per_business TO customers_unique_email_per_business;

-- ============================================================================
-- 4. Rename indexes
-- ============================================================================
ALTER INDEX idx_contacts_business_id RENAME TO idx_customers_business_id;
ALTER INDEX idx_contacts_business_status RENAME TO idx_customers_business_status;
ALTER INDEX idx_contacts_sendable RENAME TO idx_customers_sendable;

-- ============================================================================
-- 5. Drop old RLS policies and create new ones with "customers" naming
-- ============================================================================
DROP POLICY IF EXISTS "Users view own contacts" ON public.customers;
DROP POLICY IF EXISTS "Users insert own contacts" ON public.customers;
DROP POLICY IF EXISTS "Users update own contacts" ON public.customers;
DROP POLICY IF EXISTS "Users delete own contacts" ON public.customers;

-- Policy: Users can view customers for their businesses
CREATE POLICY "Users view own customers"
ON public.customers FOR SELECT
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can insert customers for their businesses
CREATE POLICY "Users insert own customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can update customers for their businesses
CREATE POLICY "Users update own customers"
ON public.customers FOR UPDATE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())))
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Policy: Users can delete customers for their businesses
CREATE POLICY "Users delete own customers"
ON public.customers FOR DELETE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- ============================================================================
-- 6. Rename FK column in send_logs
-- ============================================================================
ALTER TABLE public.send_logs RENAME COLUMN contact_id TO customer_id;

-- ============================================================================
-- 7. Rename FK index
-- ============================================================================
ALTER INDEX idx_send_logs_contact_id RENAME TO idx_send_logs_customer_id;

-- ============================================================================
-- 8. Rename trigger
-- ============================================================================
ALTER TRIGGER contacts_updated_at ON public.customers RENAME TO customers_updated_at;

-- ============================================================================
-- 9. Create compatibility view for rollback safety
-- ============================================================================
-- This view allows old code referencing "contacts" to continue working
-- during migration window. Remove after full code migration confirmed.
CREATE VIEW public.contacts AS SELECT * FROM public.customers;
GRANT ALL ON public.contacts TO authenticated;

-- ============================================================================
-- Migration complete
-- ============================================================================
-- Next steps:
-- 1. Update application code to reference "customers" table
-- 2. Update TypeScript types to use "customer" terminology
-- 3. Test all CRUD operations
-- 4. Once verified, DROP VIEW contacts; (in future migration)
