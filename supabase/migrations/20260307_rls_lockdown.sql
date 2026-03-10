-- =============================================================================
-- RLS Lockdown Migration
-- Replaces permissive USING(true) policies with proper ownership-based policies.
-- Enables RLS on vendor tables that were missing it.
--
-- IMPORTANT: Guest-facing tables (guests, rsvps, comments) store wedding_id
-- as the wedding SLUG (text). Vendor tables store wedding_id as text (UUID string).
-- weddings.created_by and wedding_admins.user_id are UUID columns.
-- auth.uid() returns UUID natively — do NOT cast to text.
--
-- CRITICAL FIX: weddings and wedding_settings use separate INSERT/UPDATE/DELETE
-- policies instead of FOR ALL. FOR ALL blocks INSERT because the row doesn't
-- exist yet to check ownership.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enable RLS on vendor tables (were missing)
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vendor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vendor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vendor_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversation_members ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. Drop existing permissive policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on guests" ON guests;
DROP POLICY IF EXISTS "Allow all operations on rsvps" ON rsvps;
DROP POLICY IF EXISTS "Allow all operations on comments" ON comments;

-- -----------------------------------------------------------------------------
-- 3. Helper functions
-- -----------------------------------------------------------------------------

-- For vendor tables: wedding_id is a UUID (stored as text) matching weddings.id
CREATE OR REPLACE FUNCTION is_wedding_owner_or_admin_by_id(w_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM weddings WHERE id = w_id::uuid AND created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM wedding_admins WHERE wedding_id = w_id::uuid AND user_id = auth.uid()
  );
$$;

-- For guest-facing tables: wedding_id is the slug (text) matching weddings.slug
CREATE OR REPLACE FUNCTION is_wedding_owner_or_admin_by_slug(w_slug text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM weddings WHERE slug = w_slug AND created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM wedding_admins wa
      JOIN weddings w ON wa.wedding_id = w.id
      WHERE w.slug = w_slug AND wa.user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. Weddings — SPLIT INSERT/UPDATE/DELETE (fixes INSERT blocking bug)
-- -----------------------------------------------------------------------------

-- Anyone can read weddings (guests need slug lookup, etc.)
DROP POLICY IF EXISTS "weddings_select_all" ON weddings;
CREATE POLICY "weddings_select_all" ON weddings
  FOR SELECT USING (true);

-- Drop the old FOR ALL policy if it exists
DROP POLICY IF EXISTS "weddings_mutate_owner" ON weddings;

-- INSERT: authenticated user can create wedding with their own created_by
DROP POLICY IF EXISTS "weddings_insert_authenticated" ON weddings;
CREATE POLICY "weddings_insert_authenticated" ON weddings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- UPDATE: owner/admin only
DROP POLICY IF EXISTS "weddings_update_owner" ON weddings;
CREATE POLICY "weddings_update_owner" ON weddings
  FOR UPDATE USING (is_wedding_owner_or_admin_by_id(id::text))
  WITH CHECK (is_wedding_owner_or_admin_by_id(id::text));

-- DELETE: owner/admin only
DROP POLICY IF EXISTS "weddings_delete_owner" ON weddings;
CREATE POLICY "weddings_delete_owner" ON weddings
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(id::text));

-- -----------------------------------------------------------------------------
-- 4b. Wedding Settings — SPLIT INSERT/UPDATE/DELETE
-- -----------------------------------------------------------------------------

-- Anyone can read (guests need PIN entry customizations)
DROP POLICY IF EXISTS "wedding_settings_select_all" ON wedding_settings;
CREATE POLICY "wedding_settings_select_all" ON wedding_settings
  FOR SELECT USING (true);

-- Drop old FOR ALL policy
DROP POLICY IF EXISTS "wedding_settings_mutate_owner" ON wedding_settings;

-- INSERT: owner/admin can create settings for their wedding
-- (wedding row exists at this point, so ownership check works)
DROP POLICY IF EXISTS "wedding_settings_insert_owner" ON wedding_settings;
CREATE POLICY "wedding_settings_insert_owner" ON wedding_settings
  FOR INSERT WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- UPDATE: owner/admin only
DROP POLICY IF EXISTS "wedding_settings_update_owner" ON wedding_settings;
CREATE POLICY "wedding_settings_update_owner" ON wedding_settings
  FOR UPDATE USING (is_wedding_owner_or_admin_by_id(wedding_id::text))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- DELETE: owner/admin only
DROP POLICY IF EXISTS "wedding_settings_delete_owner" ON wedding_settings;
CREATE POLICY "wedding_settings_delete_owner" ON wedding_settings
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- TODO: PIN codes in wedding_settings are readable by anyone via SELECT policy.
-- This is an accepted risk for now (requires knowing Supabase URL + anon key +
-- wedding UUID). Server-side PIN verify is rate-limited at 6 attempts/15min.
-- Future improvement: column-level security or move PIN codes to a separate table.

-- -----------------------------------------------------------------------------
-- 5. Guests (wedding_id = slug)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "guests_select_all" ON guests;
CREATE POLICY "guests_select_all" ON guests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "guests_mutate_owner" ON guests;
CREATE POLICY "guests_mutate_owner" ON guests
  FOR ALL USING (is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_slug(wedding_id));

-- Anyone can insert guest records (RSVP flow creates guest records)
DROP POLICY IF EXISTS "guests_insert_self" ON guests;
CREATE POLICY "guests_insert_self" ON guests
  FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 6. RSVPs (wedding_id = slug)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "rsvps_select_all" ON rsvps;
CREATE POLICY "rsvps_select_all" ON rsvps
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rsvps_mutate_owner" ON rsvps;
CREATE POLICY "rsvps_mutate_owner" ON rsvps
  FOR ALL USING (is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_slug(wedding_id));

-- Anyone can insert/update RSVPs (guest flow, may not be authenticated)
DROP POLICY IF EXISTS "rsvps_insert_public" ON rsvps;
CREATE POLICY "rsvps_insert_public" ON rsvps
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "rsvps_update_public" ON rsvps;
CREATE POLICY "rsvps_update_public" ON rsvps
  FOR UPDATE USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 7. Comments (wedding_id = slug)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "comments_insert_public" ON comments;
CREATE POLICY "comments_insert_public" ON comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "comments_mutate_owner" ON comments;
CREATE POLICY "comments_mutate_owner" ON comments
  FOR ALL USING (is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_slug(wedding_id));

-- -----------------------------------------------------------------------------
-- 8. Vendor tables (wedding_id = UUID stored as text) — owner/admin only
-- Service role (used by webhook) bypasses RLS automatically.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "vendors_owner_access" ON vendors;
CREATE POLICY "vendors_owner_access" ON vendors
  FOR ALL USING (is_wedding_owner_or_admin_by_id(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id));

DROP POLICY IF EXISTS "vendor_conversations_owner_access" ON vendor_conversations;
CREATE POLICY "vendor_conversations_owner_access" ON vendor_conversations
  FOR ALL USING (is_wedding_owner_or_admin_by_id(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id));

DROP POLICY IF EXISTS "vendor_messages_owner_access" ON vendor_messages;
CREATE POLICY "vendor_messages_owner_access" ON vendor_messages
  FOR ALL USING (is_wedding_owner_or_admin_by_id(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id));

DROP POLICY IF EXISTS "vendor_insights_owner_access" ON vendor_insights;
CREATE POLICY "vendor_insights_owner_access" ON vendor_insights
  FOR ALL USING (is_wedding_owner_or_admin_by_id(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id));

DROP POLICY IF EXISTS "conversation_members_owner_access" ON conversation_members;
CREATE POLICY "conversation_members_owner_access" ON conversation_members
  FOR ALL USING (is_wedding_owner_or_admin_by_id(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id));
