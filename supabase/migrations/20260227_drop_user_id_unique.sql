-- Drop the v1-era unique constraint on user_id that prevents multi-business
-- Added in 00004_add_business_unique_constraint.sql when each user had one business
-- v3.0 Agency Mode requires multiple businesses per user

ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_user_id_unique;
