-- 20260424: Replace per-PIN event gating with wedding-level password + per-guest event access.
--
-- Apply to phera-test FIRST, verify, then to production.
-- Run via Supabase Dashboard → SQL Editor. Do NOT run from CLI.

-- 1. Word password on wedding_settings (plaintext, admin-only via RLS).
ALTER TABLE wedding_settings
  ADD COLUMN IF NOT EXISTS wedding_password TEXT;

-- 2. Per-guest, per-event invitation table.
--    Default contract: a MISSING (guest_id, event_id) row means the guest IS invited.
--    The admin UI only inserts a row when flipping to invited=false, and deletes it
--    when flipping back to true. Keeps the table sparse.
CREATE TABLE IF NOT EXISTS guest_event_access (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id   UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_id   UUID NOT NULL REFERENCES wedding_events(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  invited    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_guest_event_access_guest
  ON guest_event_access(guest_id);

CREATE INDEX IF NOT EXISTS idx_guest_event_access_wedding
  ON guest_event_access(wedding_id);

-- 3. RLS. Only wedding owners/admins can read or mutate.
--    Guest-side reads go through a service-role API route, not direct RLS.
ALTER TABLE guest_event_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage guest_event_access" ON guest_event_access;

CREATE POLICY "admins manage guest_event_access"
  ON guest_event_access
  FOR ALL
  TO authenticated
  USING (is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_slug(wedding_id));
