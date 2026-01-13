-- Fix RLS Policies for Admin Dashboard
-- Run this to allow users to read their own weddings

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can update own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can create weddings" ON weddings;
DROP POLICY IF EXISTS "Users can delete own weddings" ON weddings;

-- Allow users to view their own weddings
CREATE POLICY "Users can view own weddings"
ON weddings
FOR SELECT
USING (auth.uid() = created_by);

-- Allow users to update their own weddings
CREATE POLICY "Users can update own weddings"
ON weddings
FOR UPDATE
USING (auth.uid() = created_by);

-- Allow users to insert weddings (for signup flow)
CREATE POLICY "Users can create weddings"
ON weddings
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own weddings (optional)
CREATE POLICY "Users can delete own weddings"
ON weddings
FOR DELETE
USING (auth.uid() = created_by);

-- Verify RLS is enabled on weddings table
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;

-- Show current policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'weddings';

