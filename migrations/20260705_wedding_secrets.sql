-- ═══════════════════════════════════════════════════════════════════════
-- Wedding secrets table — closes the wedding_password RLS leak.
--
-- Problem: wedding_settings has a `FOR SELECT USING (true)` policy because
-- guest pages legitimately read benign fields (whatsapp_group_link, theme,
-- concierge_enabled) with the anon key, and existing code selects '*'.
-- That makes wedding_password readable by ANYONE with the public anon key
-- (flagged as a TODO in 20260307_rls_lockdown.sql; got worse when
-- 20260424 added wedding_password).
--
-- Fix: move the password to a dedicated table that has NO anon policy at
-- all — only wedding owners/admins (via is_wedding_owner_or_admin_by_id)
-- and the service role can touch it.
--
-- PHASE 1 (this file): SAFE TO RUN IMMEDIATELY on test + production.
--   Creates the table and copies any existing passwords. Nothing on the
--   `main` deployment reads it yet, and nothing breaks.
--
-- PHASE 2 (20260705b_drop_wedding_password_column.sql): run ONLY AFTER
--   the mobile-app branch (which reads/writes wedding_secrets) is merged
--   and deployed. It re-copies stragglers and drops the exposed column.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wedding_secrets (
  wedding_id UUID PRIMARY KEY REFERENCES weddings(id) ON DELETE CASCADE,
  wedding_password TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wedding_secrets ENABLE ROW LEVEL SECURITY;

-- Owners/admins manage their own wedding's secrets. No anon policy exists,
-- so the anon key sees zero rows. Server routes use the service role,
-- which bypasses RLS.
DROP POLICY IF EXISTS "admins manage wedding_secrets" ON wedding_secrets;
CREATE POLICY "admins manage wedding_secrets"
  ON wedding_secrets
  FOR ALL
  TO authenticated
  USING (is_wedding_owner_or_admin_by_id(wedding_id::text))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- Copy any passwords already set (idempotent; currently 0 rows in prod).
INSERT INTO wedding_secrets (wedding_id, wedding_password)
SELECT wedding_id, wedding_password
FROM wedding_settings
WHERE wedding_password IS NOT NULL
ON CONFLICT (wedding_id)
  DO UPDATE SET wedding_password = EXCLUDED.wedding_password,
                updated_at = now();
