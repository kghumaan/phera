-- =============================================================================
-- RLS Phase 2 Migration
-- Tightens remaining wide-open tables and enables RLS on WhatsApp tables.
--
-- Depends on: 20260307_rls_lockdown.sql (helper functions, vendor/guest/wedding policies)
--
-- Tables addressed:
--   - WhatsApp (4): whatsapp_broadcasts, whatsapp_messages, whatsapp_opt_ins, whatsapp_templates
--   - Guest features (3): guest_checklist_items, guest_flights, whatsapp_channel_clicks
--   - Transportation (7): groups, pickup_locations, reservations, settings,
--                          time_ranges, vehicle_types, vehicles
--   - Other (3): travel_bus_signups, wedding_tasks, wedding_admins (new policies)
-- =============================================================================

-- =============================================================================
-- 1. Enable RLS on WhatsApp tables (currently have NO RLS)
-- =============================================================================
ALTER TABLE IF EXISTS whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS whatsapp_opt_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. WhatsApp table policies
-- =============================================================================

-- whatsapp_broadcasts: wedding_id is UUID stored as text
-- Owner/admin can manage broadcasts for their wedding
DROP POLICY IF EXISTS "whatsapp_broadcasts_owner_access" ON whatsapp_broadcasts;
CREATE POLICY "whatsapp_broadcasts_owner_access" ON whatsapp_broadcasts
  FOR ALL USING (is_wedding_owner_or_admin_by_id(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id));

-- whatsapp_messages: wedding_id is UUID stored as text
-- Owner/admin can manage messages for their wedding
DROP POLICY IF EXISTS "whatsapp_messages_owner_access" ON whatsapp_messages;
CREATE POLICY "whatsapp_messages_owner_access" ON whatsapp_messages
  FOR ALL USING (is_wedding_owner_or_admin_by_id(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id));

-- whatsapp_opt_ins: wedding_id is UUID stored as text
-- Guests opt in unauthenticated during RSVP, so SELECT/INSERT/UPDATE must be public.
-- DELETE restricted to owner/admin (admin can remove opt-ins).
DROP POLICY IF EXISTS "whatsapp_opt_ins_select_public" ON whatsapp_opt_ins;
CREATE POLICY "whatsapp_opt_ins_select_public" ON whatsapp_opt_ins
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "whatsapp_opt_ins_insert_public" ON whatsapp_opt_ins;
CREATE POLICY "whatsapp_opt_ins_insert_public" ON whatsapp_opt_ins
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "whatsapp_opt_ins_update_public" ON whatsapp_opt_ins;
CREATE POLICY "whatsapp_opt_ins_update_public" ON whatsapp_opt_ins
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "whatsapp_opt_ins_delete_owner" ON whatsapp_opt_ins;
CREATE POLICY "whatsapp_opt_ins_delete_owner" ON whatsapp_opt_ins
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(wedding_id));

-- whatsapp_templates: global table (no wedding_id)
-- Authenticated users can read templates; only service role can mutate.
DROP POLICY IF EXISTS "whatsapp_templates_select_authenticated" ON whatsapp_templates;
CREATE POLICY "whatsapp_templates_select_authenticated" ON whatsapp_templates
  FOR SELECT USING (auth.role() = 'authenticated');
-- No INSERT/UPDATE/DELETE policies = denied for non-service-role

-- =============================================================================
-- 3. Guest feature tables — replace USING(true) FOR ALL with scoped policies
-- =============================================================================

-- guest_checklist_items: wedding_id is SLUG (text)
-- Guests can self-service (SELECT/INSERT/UPDATE); only owner/admin can DELETE
DROP POLICY IF EXISTS "Allow all operations on guest_checklist_items" ON guest_checklist_items;

DROP POLICY IF EXISTS "guest_checklist_items_select_public" ON guest_checklist_items;
CREATE POLICY "guest_checklist_items_select_public" ON guest_checklist_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "guest_checklist_items_insert_public" ON guest_checklist_items;
CREATE POLICY "guest_checklist_items_insert_public" ON guest_checklist_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "guest_checklist_items_update_public" ON guest_checklist_items;
CREATE POLICY "guest_checklist_items_update_public" ON guest_checklist_items
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "guest_checklist_items_delete_owner" ON guest_checklist_items;
CREATE POLICY "guest_checklist_items_delete_owner" ON guest_checklist_items
  FOR DELETE USING (is_wedding_owner_or_admin_by_slug(wedding_id));

-- guest_flights: wedding_id is SLUG (text)
-- Same pattern as guest_checklist_items
DROP POLICY IF EXISTS "Allow all operations on guest_flights" ON guest_flights;

DROP POLICY IF EXISTS "guest_flights_select_public" ON guest_flights;
CREATE POLICY "guest_flights_select_public" ON guest_flights
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "guest_flights_insert_public" ON guest_flights;
CREATE POLICY "guest_flights_insert_public" ON guest_flights
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "guest_flights_update_public" ON guest_flights;
CREATE POLICY "guest_flights_update_public" ON guest_flights
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "guest_flights_delete_owner" ON guest_flights;
CREATE POLICY "guest_flights_delete_owner" ON guest_flights
  FOR DELETE USING (is_wedding_owner_or_admin_by_slug(wedding_id));

-- whatsapp_channel_clicks: no wedding_id — append-only analytics
-- Public can SELECT/INSERT; no UPDATE/DELETE (denied by default)
DROP POLICY IF EXISTS "Allow all operations on whatsapp_channel_clicks" ON whatsapp_channel_clicks;

DROP POLICY IF EXISTS "whatsapp_channel_clicks_select_public" ON whatsapp_channel_clicks;
CREATE POLICY "whatsapp_channel_clicks_select_public" ON whatsapp_channel_clicks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "whatsapp_channel_clicks_insert_public" ON whatsapp_channel_clicks;
CREATE POLICY "whatsapp_channel_clicks_insert_public" ON whatsapp_channel_clicks
  FOR INSERT WITH CHECK (true);
-- No UPDATE/DELETE policies = append-only

-- =============================================================================
-- 4. Transportation tables (7) — wedding_id is UUID
-- Replace fully-open policies with wedding-scoped.
-- SELECT remains public (guests see options).
-- INSERT/UPDATE/DELETE restricted to owner/admin.
-- Exception: transportation_reservations INSERT/UPDATE also public (guest bookings).
-- =============================================================================

-- --- transportation_groups ---
DROP POLICY IF EXISTS "Allow public insert for transportation_groups" ON transportation_groups;
DROP POLICY IF EXISTS "Allow public update for transportation_groups" ON transportation_groups;
DROP POLICY IF EXISTS "Allow public delete for transportation_groups" ON transportation_groups;

DROP POLICY IF EXISTS "transportation_groups_insert_owner" ON transportation_groups;
CREATE POLICY "transportation_groups_insert_owner" ON transportation_groups
  FOR INSERT WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_groups_update_owner" ON transportation_groups;
CREATE POLICY "transportation_groups_update_owner" ON transportation_groups
  FOR UPDATE USING (is_wedding_owner_or_admin_by_id(wedding_id::text))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_groups_delete_owner" ON transportation_groups;
CREATE POLICY "transportation_groups_delete_owner" ON transportation_groups
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- --- transportation_pickup_locations ---
DROP POLICY IF EXISTS "Allow public insert for transportation_pickup_locations" ON transportation_pickup_locations;
DROP POLICY IF EXISTS "Allow public update for transportation_pickup_locations" ON transportation_pickup_locations;
DROP POLICY IF EXISTS "Allow public delete for transportation_pickup_locations" ON transportation_pickup_locations;

DROP POLICY IF EXISTS "transportation_pickup_locations_insert_owner" ON transportation_pickup_locations;
CREATE POLICY "transportation_pickup_locations_insert_owner" ON transportation_pickup_locations
  FOR INSERT WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_pickup_locations_update_owner" ON transportation_pickup_locations;
CREATE POLICY "transportation_pickup_locations_update_owner" ON transportation_pickup_locations
  FOR UPDATE USING (is_wedding_owner_or_admin_by_id(wedding_id::text))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_pickup_locations_delete_owner" ON transportation_pickup_locations;
CREATE POLICY "transportation_pickup_locations_delete_owner" ON transportation_pickup_locations
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- --- transportation_reservations (EXCEPTION: INSERT/UPDATE remain public for guest bookings) ---
DROP POLICY IF EXISTS "Allow public delete for transportation_reservations" ON transportation_reservations;

DROP POLICY IF EXISTS "transportation_reservations_delete_owner" ON transportation_reservations;
CREATE POLICY "transportation_reservations_delete_owner" ON transportation_reservations
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(wedding_id::text));
-- SELECT/INSERT/UPDATE remain public (existing policies kept)

-- --- transportation_settings ---
DROP POLICY IF EXISTS "Allow public insert for transportation_settings" ON transportation_settings;
DROP POLICY IF EXISTS "Allow public update for transportation_settings" ON transportation_settings;
DROP POLICY IF EXISTS "Allow public delete for transportation_settings" ON transportation_settings;

DROP POLICY IF EXISTS "transportation_settings_insert_owner" ON transportation_settings;
CREATE POLICY "transportation_settings_insert_owner" ON transportation_settings
  FOR INSERT WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_settings_update_owner" ON transportation_settings;
CREATE POLICY "transportation_settings_update_owner" ON transportation_settings
  FOR UPDATE USING (is_wedding_owner_or_admin_by_id(wedding_id::text))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_settings_delete_owner" ON transportation_settings;
CREATE POLICY "transportation_settings_delete_owner" ON transportation_settings
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- --- transportation_time_ranges ---
DROP POLICY IF EXISTS "Allow public insert for transportation_time_ranges" ON transportation_time_ranges;
DROP POLICY IF EXISTS "Allow public update for transportation_time_ranges" ON transportation_time_ranges;
DROP POLICY IF EXISTS "Allow public delete for transportation_time_ranges" ON transportation_time_ranges;

DROP POLICY IF EXISTS "transportation_time_ranges_insert_owner" ON transportation_time_ranges;
CREATE POLICY "transportation_time_ranges_insert_owner" ON transportation_time_ranges
  FOR INSERT WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_time_ranges_update_owner" ON transportation_time_ranges;
CREATE POLICY "transportation_time_ranges_update_owner" ON transportation_time_ranges
  FOR UPDATE USING (is_wedding_owner_or_admin_by_id(wedding_id::text))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_time_ranges_delete_owner" ON transportation_time_ranges;
CREATE POLICY "transportation_time_ranges_delete_owner" ON transportation_time_ranges
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- --- transportation_vehicle_types ---
DROP POLICY IF EXISTS "Allow public insert for transportation_vehicle_types" ON transportation_vehicle_types;
DROP POLICY IF EXISTS "Allow public update for transportation_vehicle_types" ON transportation_vehicle_types;
DROP POLICY IF EXISTS "Allow public delete for transportation_vehicle_types" ON transportation_vehicle_types;

DROP POLICY IF EXISTS "transportation_vehicle_types_insert_owner" ON transportation_vehicle_types;
CREATE POLICY "transportation_vehicle_types_insert_owner" ON transportation_vehicle_types
  FOR INSERT WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_vehicle_types_update_owner" ON transportation_vehicle_types;
CREATE POLICY "transportation_vehicle_types_update_owner" ON transportation_vehicle_types
  FOR UPDATE USING (is_wedding_owner_or_admin_by_id(wedding_id::text))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_vehicle_types_delete_owner" ON transportation_vehicle_types;
CREATE POLICY "transportation_vehicle_types_delete_owner" ON transportation_vehicle_types
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- --- transportation_vehicles ---
DROP POLICY IF EXISTS "Allow public insert for transportation_vehicles" ON transportation_vehicles;
DROP POLICY IF EXISTS "Allow public update for transportation_vehicles" ON transportation_vehicles;
DROP POLICY IF EXISTS "Allow public delete for transportation_vehicles" ON transportation_vehicles;

DROP POLICY IF EXISTS "transportation_vehicles_insert_owner" ON transportation_vehicles;
CREATE POLICY "transportation_vehicles_insert_owner" ON transportation_vehicles
  FOR INSERT WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_vehicles_update_owner" ON transportation_vehicles;
CREATE POLICY "transportation_vehicles_update_owner" ON transportation_vehicles
  FOR UPDATE USING (is_wedding_owner_or_admin_by_id(wedding_id::text))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

DROP POLICY IF EXISTS "transportation_vehicles_delete_owner" ON transportation_vehicles;
CREATE POLICY "transportation_vehicles_delete_owner" ON transportation_vehicles
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- =============================================================================
-- 5. travel_bus_signups — wedding_id is SLUG (text)
-- Currently: public SELECT/INSERT/UPDATE, no DELETE policy.
-- Add DELETE restricted to owner/admin.
-- =============================================================================
DROP POLICY IF EXISTS "travel_bus_signups_delete_owner" ON travel_bus_signups;
CREATE POLICY "travel_bus_signups_delete_owner" ON travel_bus_signups
  FOR DELETE USING (is_wedding_owner_or_admin_by_slug(wedding_id));

-- =============================================================================
-- 6. wedding_tasks — replace "any authenticated" with owner/admin scoped
-- wedding_id is UUID
-- =============================================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON wedding_tasks;

DROP POLICY IF EXISTS "wedding_tasks_owner_access" ON wedding_tasks;
CREATE POLICY "wedding_tasks_owner_access" ON wedding_tasks
  FOR ALL USING (is_wedding_owner_or_admin_by_id(wedding_id::text))
  WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- =============================================================================
-- 7. wedding_admins — add owner-scoped policies
-- Currently: users can only manage their OWN admin records.
-- Add: wedding owner/admin can INSERT/SELECT/DELETE admin records for their wedding.
-- =============================================================================

-- Owner can see all admins for their wedding (not just self)
DROP POLICY IF EXISTS "wedding_admins_select_by_owner" ON wedding_admins;
CREATE POLICY "wedding_admins_select_by_owner" ON wedding_admins
  FOR SELECT USING (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- Owner can add admins to their wedding
DROP POLICY IF EXISTS "wedding_admins_insert_by_owner" ON wedding_admins;
CREATE POLICY "wedding_admins_insert_by_owner" ON wedding_admins
  FOR INSERT WITH CHECK (is_wedding_owner_or_admin_by_id(wedding_id::text));

-- Owner can remove admins from their wedding
DROP POLICY IF EXISTS "wedding_admins_delete_by_owner" ON wedding_admins;
CREATE POLICY "wedding_admins_delete_by_owner" ON wedding_admins
  FOR DELETE USING (is_wedding_owner_or_admin_by_id(wedding_id::text));
