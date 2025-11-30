-- Fix RLS Policies for Wedding Events and Related Tables
-- Issue: INSERT operations were failing because policies lacked WITH CHECK clause
-- Date: 2024-11-24

-- Drop and recreate the wedding_events policies with proper WITH CHECK clause
DROP POLICY IF EXISTS "Admins can manage wedding events" ON wedding_events;

CREATE POLICY "Admins can manage wedding events" ON wedding_events
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

-- Fix wedding_schedule policies
DROP POLICY IF EXISTS "Admins can manage wedding schedule" ON wedding_schedule;

CREATE POLICY "Admins can manage wedding schedule" ON wedding_schedule
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

-- Fix schedule_items policies
DROP POLICY IF EXISTS "Admins can manage schedule items" ON schedule_items;

CREATE POLICY "Admins can manage schedule items" ON schedule_items
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM wedding_schedule ws
      JOIN weddings w ON ws.wedding_id = w.id
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE ws.id = schedule_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_schedule ws
      JOIN weddings w ON ws.wedding_id = w.id
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE ws.id = schedule_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

-- Fix wedding_travel_cards policies
DROP POLICY IF EXISTS "Admins can manage travel cards" ON wedding_travel_cards;

CREATE POLICY "Admins can manage travel cards" ON wedding_travel_cards
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

-- Fix wedding_faqs policies
DROP POLICY IF EXISTS "Admins can manage FAQs" ON wedding_faqs;

CREATE POLICY "Admins can manage FAQs" ON wedding_faqs
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

-- Fix wedding_registry policies
DROP POLICY IF EXISTS "Admins can manage registry" ON wedding_registry;

CREATE POLICY "Admins can manage registry" ON wedding_registry
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

-- Fix wedding_shops policies
DROP POLICY IF EXISTS "Admins can manage shops" ON wedding_shops;

CREATE POLICY "Admins can manage shops" ON wedding_shops
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

-- Fix wedding_settings policies
DROP POLICY IF EXISTS "Admins can manage settings" ON wedding_settings;

CREATE POLICY "Admins can manage settings" ON wedding_settings
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

-- Verify all policies are correctly set
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'Has USING' ELSE 'No USING' END as using_clause,
  CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK' ELSE 'No WITH CHECK' END as with_check_clause
FROM pg_policies 
WHERE tablename IN (
  'wedding_events', 
  'wedding_schedule', 
  'schedule_items',
  'wedding_travel_cards',
  'wedding_faqs',
  'wedding_registry',
  'wedding_shops',
  'wedding_settings'
)
ORDER BY tablename, policyname;

