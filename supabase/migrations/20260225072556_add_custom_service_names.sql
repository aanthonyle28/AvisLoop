-- Add custom_service_names column to businesses table
-- Stores display-only custom service names when "Other" service type is enabled.
-- Not used for campaign matching (campaign matching uses fixed service_types_enabled).

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS custom_service_names TEXT[] DEFAULT '{}';

COMMENT ON COLUMN businesses.custom_service_names IS 'Array of custom service names when Other service type is enabled. Display-only, not used for campaign matching.';
