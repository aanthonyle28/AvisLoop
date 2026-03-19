-- DATA-03 / TICK-01 / TICK-02: Create project_tickets and ticket_messages tables
--
-- business_id is denormalized onto both tables to enable single-hop RLS policies
-- without multi-join subqueries. The alternative (ticket_id IN (SELECT id FROM
-- project_tickets WHERE business_id IN (...))) would require per-row nested
-- subquery evaluation. Denormalization is the established pattern in this codebase
-- (see campaign_enrollments.business_id).
--
-- Client portal inserts go through a service-role Route Handler after portal_token
-- validation -- no anon INSERT policy is needed on these tables.

-- ─────────────────────────────────────────────────────────────────────────────
-- project_tickets
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.web_projects(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  -- business_id denormalized: avoids two-hop join in RLS policy

  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'waiting_client', 'resolved', 'closed')),
  priority        TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source          TEXT NOT NULL DEFAULT 'agency'
    CHECK (source IN ('agency', 'client_portal')),

  -- Revision tracking: is this request counted toward monthly limit?
  is_revision     BOOLEAN NOT NULL DEFAULT true,
  -- is_overage: true when submitted after monthly limit was reached ($50 charge)
  is_overage      BOOLEAN NOT NULL DEFAULT false,

  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes  TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_tickets_owner_all" ON public.project_tickets
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_project_tickets_project_id
  ON public.project_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tickets_business_id
  ON public.project_tickets(business_id);
-- Partial index for open ticket queries (used for monthly revision count + CRM view)
CREATE INDEX IF NOT EXISTS idx_project_tickets_open
  ON public.project_tickets(project_id, created_at DESC)
  WHERE status IN ('open', 'in_progress', 'waiting_client');
-- Index for monthly revision count query (COUNT WHERE is_revision AND created_at >= period)
CREATE INDEX IF NOT EXISTS idx_project_tickets_revision_month
  ON public.project_tickets(project_id, created_at)
  WHERE is_revision = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- ticket_messages
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       UUID NOT NULL REFERENCES public.project_tickets(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  -- business_id denormalized: same reason as project_tickets (single-hop RLS)

  author_type     TEXT NOT NULL
    CHECK (author_type IN ('agency', 'client')),
  author_name     TEXT,   -- Display name: "Sarah @ AvisLoop" or client's name
  body            TEXT NOT NULL,
  attachment_urls TEXT[], -- Supabase Storage paths; signed read URLs generated server-side

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at: messages are append-only, never edited
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_messages_owner_all" ON public.ticket_messages
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id
  ON public.ticket_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_business_id
  ON public.ticket_messages(business_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.project_tickets IS
  'Revision requests and support tickets for web design projects. Submitted by agency or by clients via /portal/[token].';
COMMENT ON COLUMN public.project_tickets.is_revision IS
  'True if this ticket counts toward the monthly revision limit (Basic: 2/mo, Advanced: 4/mo).';
COMMENT ON COLUMN public.project_tickets.is_overage IS
  'True if this ticket was submitted after the monthly revision limit was reached. Flagged for $50 overage billing.';
COMMENT ON COLUMN public.project_tickets.business_id IS
  'Denormalized FK to businesses for single-hop RLS policy evaluation. Must be set equal to web_projects.business_id at insert time.';

COMMENT ON TABLE public.ticket_messages IS
  'Threaded reply log per ticket. Append-only -- messages are never edited or deleted.';
COMMENT ON COLUMN public.ticket_messages.attachment_urls IS
  'Array of Supabase Storage paths. Serve to clients via signed read URLs generated server-side (not raw paths).';
COMMENT ON COLUMN public.ticket_messages.business_id IS
  'Denormalized FK to businesses for single-hop RLS policy evaluation. Must be set equal to the parent ticket business_id at insert time.';
