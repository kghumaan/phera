-- Fix FK constraints that block guest deletion.
--
-- Applied to PRODUCTION on 2026-04-26 via Supabase MCP.
-- This file exists so the same change can be applied to phera-test
-- (project ref: bqogpnirfchgoshtsthp) and to keep schemas in sync.
--
-- Background: deleting a guest used to fail with 23503 because:
--   1. coordination_issues.guest_id had no ON DELETE rule (RESTRICT default)
--   2. whatsapp_broadcasts.created_by referenced auth.users with no ON DELETE rule
--
-- Fix: cascade delete coordination_issues rows when their guest is removed,
-- and set created_by to NULL when the auth user is removed (we want to keep
-- the broadcast history even if the admin who sent it is later deleted).

BEGIN;

-- 1. coordination_issues.guest_id → CASCADE
ALTER TABLE coordination_issues
  DROP CONSTRAINT IF EXISTS coordination_issues_guest_id_fkey;

ALTER TABLE coordination_issues
  ADD CONSTRAINT coordination_issues_guest_id_fkey
  FOREIGN KEY (guest_id)
  REFERENCES guests(id)
  ON DELETE CASCADE;

-- 2. whatsapp_broadcasts.created_by → SET NULL
ALTER TABLE whatsapp_broadcasts
  DROP CONSTRAINT IF EXISTS whatsapp_broadcasts_created_by_fkey;

ALTER TABLE whatsapp_broadcasts
  ADD CONSTRAINT whatsapp_broadcasts_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

COMMIT;
