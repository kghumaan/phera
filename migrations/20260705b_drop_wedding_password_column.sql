-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 2 of the wedding_secrets migration.
--
-- ⚠️  RUN ONLY AFTER the branch that reads/writes wedding_secrets
--     (claude/react-native-mobile-app-1s5eu5) is merged and DEPLOYED.
--     The `main` deployment before that still reads
--     wedding_settings.wedding_password directly — dropping the column
--     earlier would break its verify-password/settings pages.
--
-- Prereq: 20260705_wedding_secrets.sql has been applied.
-- ═══════════════════════════════════════════════════════════════════════

-- Catch any passwords set between phase 1 and this deploy.
INSERT INTO wedding_secrets (wedding_id, wedding_password)
SELECT wedding_id, wedding_password
FROM wedding_settings
WHERE wedding_password IS NOT NULL
ON CONFLICT (wedding_id)
  DO UPDATE SET wedding_password = EXCLUDED.wedding_password,
                updated_at = now();

-- Remove the anon-readable copy. This is the step that closes the leak.
ALTER TABLE wedding_settings DROP COLUMN IF EXISTS wedding_password;
