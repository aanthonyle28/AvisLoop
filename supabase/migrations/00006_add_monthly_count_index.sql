-- Migration: 00006_add_monthly_count_index
-- Purpose: Optimize monthly send count query for billing enforcement

-- Composite index for monthly usage queries
-- Covers: WHERE business_id = ? AND created_at >= ? AND status IN (...)
-- Using partial index to only index successful sends (reduces index size)
CREATE INDEX IF NOT EXISTS idx_send_logs_monthly_usage
ON public.send_logs (business_id, created_at DESC)
WHERE status IN ('sent', 'delivered', 'opened');
