-- Add publish snapshot columns to weddings table
-- This enables preview/live separation: admin preview reads from DB tables,
-- guest site reads from the published_snapshot JSONB blob.

ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS published_snapshot JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_unpublished_changes BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_published_at TIMESTAMPTZ DEFAULT NULL;
