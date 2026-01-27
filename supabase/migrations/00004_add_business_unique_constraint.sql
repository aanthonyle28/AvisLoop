-- Migration: 00004_add_business_unique_constraint
-- Purpose: Enforce one business per user at the database level
--
-- Background: The application logic already enforces one business per user,
-- but there was no database constraint preventing race conditions or bypasses.
-- This constraint ensures data integrity at the DB level.

-- ============================================================================
-- Add unique constraint on user_id
-- ============================================================================
-- This ensures each auth.users can only have one business record.
-- If a user somehow has multiple businesses, this migration will fail.
-- In that case, clean up duplicate businesses first.

ALTER TABLE public.businesses
ADD CONSTRAINT businesses_user_id_unique UNIQUE (user_id);

-- Note: The existing index idx_businesses_user_id (btree) will be replaced
-- by the unique constraint's implicit index. PostgreSQL handles this efficiently.
