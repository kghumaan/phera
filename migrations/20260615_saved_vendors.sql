-- saved_vendors: couples shortlist vendors they're interested in
-- wedding_id is TEXT (slug) per project convention, no FK to a weddings table

CREATE TABLE IF NOT EXISTS saved_vendors (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  TEXT        NOT NULL,
  vendor_id   UUID        NOT NULL REFERENCES vendor_directory(id) ON DELETE CASCADE,
  notes       TEXT,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wedding_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS saved_vendors_wedding_id_idx ON saved_vendors (wedding_id);
CREATE INDEX IF NOT EXISTS saved_vendors_vendor_id_idx  ON saved_vendors (vendor_id);

ALTER TABLE saved_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wedding_owner_or_admin_can_manage_saved_vendors"
  ON saved_vendors
  FOR ALL
  TO authenticated
  USING      (is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_slug(wedding_id));
