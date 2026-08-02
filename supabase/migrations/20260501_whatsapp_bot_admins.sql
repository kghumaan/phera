-- WhatsApp Bot for the couple/admin: opt-in phone numbers that can drive
-- the wedding from WhatsApp + an action log so the couple can see what the
-- bot did on their behalf.
--
-- Apply to phera-test first, verify, then production.

-- ─── 1. wedding_bot_admins ──────────────────────────────────────────────
-- Phones that are allowed to text the Phera Bot and have those messages
-- routed to admin actions (update knowledge bank, file a task, edit the
-- website, etc.). wedding_id matches the slug pattern used by every other
-- non-UUID-FK table in this project.
CREATE TABLE IF NOT EXISTS wedding_bot_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Same phone can't be added twice for the same wedding.
  UNIQUE (wedding_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_wedding_bot_admins_wedding
  ON wedding_bot_admins(wedding_id);

-- Quick lookup when a webhook comes in: "is this phone allowed for any wedding?"
CREATE INDEX IF NOT EXISTS idx_wedding_bot_admins_phone
  ON wedding_bot_admins(phone);

-- ─── 2. bot_admin_log ───────────────────────────────────────────────────
-- One row per bot-invoked action attempted on behalf of an admin. status
-- starts as 'pending', flips to 'success' / 'failed' when the worker
-- finishes. Free-form summary so we can render a useful one-liner without
-- a join — e.g. "Added 'Order chai for breakfast' to Task Manager".
CREATE TABLE IF NOT EXISTS bot_admin_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,
  -- Who asked. Not a FK to wedding_bot_admins (admin row may have been
  -- deleted by the time we query history) — phone is the durable handle.
  admin_phone TEXT,
  admin_name TEXT,
  -- Buckets that map to the surfaces the bot can drive. Free-form so we
  -- don't need a migration every time we add a verb.
  action_type TEXT NOT NULL,
  -- Human-readable one-line description of the request / outcome.
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  -- Optional structured payload (e.g. the inbound WhatsApp message id,
  -- which entity got created, before/after values).
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bot_admin_log_wedding
  ON bot_admin_log(wedding_id);
CREATE INDEX IF NOT EXISTS idx_bot_admin_log_created_at
  ON bot_admin_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_admin_log_status
  ON bot_admin_log(status);

-- ─── 3. updated_at trigger for wedding_bot_admins ───────────────────────
CREATE OR REPLACE FUNCTION set_wedding_bot_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wedding_bot_admins_updated_at ON wedding_bot_admins;
CREATE TRIGGER trg_wedding_bot_admins_updated_at
BEFORE UPDATE ON wedding_bot_admins
FOR EACH ROW EXECUTE FUNCTION set_wedding_bot_admins_updated_at();

-- ─── 4. RLS ─────────────────────────────────────────────────────────────
-- Reuse the existing slug-keyed helper. Both tables use the wedding slug
-- as their key, matching guests/concierge_broadcasts/etc.
ALTER TABLE wedding_bot_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_admin_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wedding_bot_admins_admin_access" ON wedding_bot_admins
  FOR ALL USING (is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_slug(wedding_id));

CREATE POLICY "bot_admin_log_admin_access" ON bot_admin_log
  FOR ALL USING (is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_slug(wedding_id));
