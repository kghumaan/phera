-- Migration: Create travel_bus_signups table
-- Purpose: Store shuttle/bus signup information for wedding travel coordination

CREATE TABLE IF NOT EXISTS travel_bus_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,

  -- Contact Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1,

  -- Bus Selections (checkboxes)
  bangkok_to_huahin BOOLEAN DEFAULT FALSE,        -- Jan 3 @ 1:00 PM
  huahin_to_airport BOOLEAN DEFAULT FALSE,        -- Jan 6 @ 9:00 AM
  huahin_to_sukhumvit BOOLEAN DEFAULT FALSE,      -- Jan 6 @ 1:00-2:00 PM

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one submission per email per wedding
  UNIQUE(wedding_id, email)
);

-- Index for quick lookups
CREATE INDEX idx_travel_bus_signups_wedding ON travel_bus_signups(wedding_id);
CREATE INDEX idx_travel_bus_signups_email ON travel_bus_signups(email);

-- RLS Policies
ALTER TABLE travel_bus_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Allow public insert on travel_bus_signups"
  ON travel_bus_signups
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own submissions
CREATE POLICY "Allow users to read own travel_bus_signups"
  ON travel_bus_signups
  FOR SELECT
  USING (true);

-- Allow users to update their own submissions
CREATE POLICY "Allow users to update own travel_bus_signups"
  ON travel_bus_signups
  FOR UPDATE
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_travel_bus_signups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER travel_bus_signups_updated_at
  BEFORE UPDATE ON travel_bus_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_travel_bus_signups_updated_at();
