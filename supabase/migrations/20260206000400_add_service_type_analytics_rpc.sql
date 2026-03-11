-- Add get_service_type_analytics RPC function
-- Called by lib/data/analytics.ts for service type breakdown
--
-- Returns analytics aggregated by job service_type for a business.
-- Joins: jobs -> campaign_enrollments -> send_logs
-- Also counts feedback from customer_feedback table.

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
    COUNT(DISTINCT cf.id)::BIGINT AS feedback_count
  FROM jobs j
  LEFT JOIN campaign_enrollments ce ON ce.job_id = j.id
  LEFT JOIN send_logs sl ON sl.campaign_enrollment_id = ce.id
  LEFT JOIN customer_feedback cf ON cf.customer_id = j.customer_id
    AND cf.business_id = p_business_id
  WHERE j.business_id = p_business_id
  GROUP BY j.service_type
  ORDER BY COUNT(sl.id) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION get_service_type_analytics(UUID) IS 'Returns analytics breakdown by service type for a business';
