-- Fix RLS policies for travel_bus_signups table
-- This fixes the hanging upsert issue by simplifying the policies

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert on travel_bus_signups" ON travel_bus_signups;
DROP POLICY IF EXISTS "Allow users to read own travel_bus_signups" ON travel_bus_signups;
DROP POLICY IF EXISTS "Allow users to update own travel_bus_signups" ON travel_bus_signups;

-- Create new simplified policies that work with upsert
-- Allow anyone to insert (public form)
CREATE POLICY "Enable insert for all users"
  ON travel_bus_signups
  FOR INSERT
  TO anon, authenticated, public
  WITH CHECK (true);

-- Allow anyone to read (needed for .select() after upsert)
CREATE POLICY "Enable read for all users"
  ON travel_bus_signups
  FOR SELECT
  TO anon, authenticated, public
  USING (true);

-- Allow anyone to update (needed for upsert ON CONFLICT)
CREATE POLICY "Enable update for all users"
  ON travel_bus_signups
  FOR UPDATE
  TO anon, authenticated, public
  USING (true)
  WITH CHECK (true);
