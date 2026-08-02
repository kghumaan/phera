-- Migration: Add visible column to travel_sections
-- Apply to BOTH phera-test and production via Supabase SQL Editor

ALTER TABLE travel_sections
ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT true;
