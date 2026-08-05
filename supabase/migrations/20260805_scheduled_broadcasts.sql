-- Scheduled guest messages: extend concierge_broadcasts with scheduling +
-- approval audit, and add an audit log table.
-- Apply to phera-test first, verify, then production. DO NOT run from CLI —
-- run manually via the Supabase dashboard.

-- ─── 1. Scheduling + approval columns on concierge_broadcasts ───────────
ALTER TABLE concierge_broadcasts
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS send_timezone TEXT,
  ADD COLUMN IF NOT EXISTS template_key TEXT,
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Widen the status CHECK to cover scheduled + cancelled.
ALTER TABLE concierge_broadcasts DROP CONSTRAINT IF EXISTS concierge_broadcasts_status_check;
ALTER TABLE concierge_broadcasts ADD CONSTRAINT concierge_broadcasts_status_check
  CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'));

-- Fast lookup of due sends for the cron.
CREATE INDEX IF NOT EXISTS idx_concierge_broadcasts_due
  ON concierge_broadcasts(scheduled_at)
  WHERE status = 'scheduled' AND enabled = true;

-- One active scheduled instance per preset per wedding (re-scheduling after
-- a send or cancellation is allowed).
CREATE UNIQUE INDEX IF NOT EXISTS uq_concierge_broadcasts_template_key
  ON concierge_broadcasts(wedding_id, template_key)
  WHERE template_key IS NOT NULL AND status IN ('scheduled', 'sending');

-- ─── 2. Approval / lifecycle audit log ──────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,
  broadcast_id UUID REFERENCES concierge_broadcasts(id) ON DELETE SET NULL,
  actor_user_id UUID,
  actor TEXT NOT NULL DEFAULT 'admin' CHECK (actor IN ('admin', 'system')),
  action TEXT NOT NULL CHECK (action IN (
    'scheduled', 'enabled', 'disabled', 'updated', 'cancelled', 'sent', 'send_failed'
  )),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_audit_wedding ON broadcast_audit_log(wedding_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_audit_broadcast ON broadcast_audit_log(broadcast_id);

ALTER TABLE broadcast_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read their wedding's audit trail. Writes happen server-side via
-- the service role (API routes + cron), so no INSERT policy for users.
CREATE POLICY "broadcast_audit_log_admin_read" ON broadcast_audit_log
  FOR SELECT USING (is_wedding_owner_or_admin_by_slug(wedding_id));

-- ─── 3. Optional cleanup (dead outreach engine) ─────────────────────────
-- The outreach_sequences table was only ever written by demo seeding; the
-- cron that consumed it was broken and has been deleted from the codebase.
-- Uncomment when comfortable:
-- DROP TABLE IF EXISTS outreach_sequences;
