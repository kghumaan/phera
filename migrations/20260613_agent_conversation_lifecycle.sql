-- ============================================================
-- Phera Agent — conversation lifecycle columns
-- ============================================================
-- Run in Supabase SQL Editor. Apply to phera-test FIRST, then production.
-- The agent code is fail-open: it works (without compaction/locking)
-- until these columns exist, so deploy order doesn't matter.
--
--   summary          — rolling summary of compacted (older) conversation turns
--   summary_through  — watermark: messages at/before this timestamp are
--                      represented by `summary` and excluded from the
--                      model's history window
--   turn_started_at  — per-conversation turn lock; cleared when a turn
--                      finishes, treated as stale after 3 minutes
-- ============================================================

ALTER TABLE agent_conversations
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS summary_through TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS turn_started_at TIMESTAMPTZ;
