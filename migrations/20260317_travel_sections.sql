-- Migration: Create travel_sections table
-- Apply to BOTH phera-test and production via Supabase SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS travel_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('travel', 'flight', 'travel_note', 'accommodation', 'hotel')),
  title TEXT,
  subtitle TEXT,
  content TEXT,
  image_url TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  more_details TEXT,
  address TEXT,
  phone TEXT,
  price_level INTEGER CHECK (price_level IS NULL OR (price_level >= 1 AND price_level <= 5)),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for fast lookups
CREATE INDEX idx_travel_sections_wedding_id ON travel_sections(wedding_id);

-- 3. Enable RLS
ALTER TABLE travel_sections ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Anon read for published weddings (guests can see travel sections)
CREATE POLICY "travel_sections_anon_select"
  ON travel_sections
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = travel_sections.wedding_id
      AND w.status = 'published'
    )
  );

-- Authenticated users can read their own wedding's travel sections
CREATE POLICY "travel_sections_auth_select"
  ON travel_sections
  FOR SELECT
  TO authenticated
  USING (
    is_wedding_owner_or_admin_by_id(wedding_id::text)
  );

-- Owner/admin can insert
CREATE POLICY "travel_sections_auth_insert"
  ON travel_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_wedding_owner_or_admin_by_id(wedding_id::text)
  );

-- Owner/admin can update
CREATE POLICY "travel_sections_auth_update"
  ON travel_sections
  FOR UPDATE
  TO authenticated
  USING (
    is_wedding_owner_or_admin_by_id(wedding_id::text)
  );

-- Owner/admin can delete
CREATE POLICY "travel_sections_auth_delete"
  ON travel_sections
  FOR DELETE
  TO authenticated
  USING (
    is_wedding_owner_or_admin_by_id(wedding_id::text)
  );

-- Service role bypass (for demo cloning, AI generation, etc.)
CREATE POLICY "travel_sections_service_all"
  ON travel_sections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER travel_sections_updated_at
  BEFORE UPDATE ON travel_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
