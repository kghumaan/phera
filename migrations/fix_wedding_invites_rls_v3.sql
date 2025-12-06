-- Fix RLS Policies for wedding_invites table
-- This migration fixes the INSERT, SELECT, and DELETE policies
-- 
-- ISSUE: The original policies had incorrect JOIN conditions that prevented 
-- proper policy evaluation. The WHERE clauses were comparing w.id to wa.wedding_id
-- instead of comparing to wedding_invites.wedding_id.
--
-- Run this migration in your Supabase SQL Editor to fix the team invite functionality.

-- First, drop all existing policies on wedding_invites
DROP POLICY IF EXISTS "Wedding owners can view invites" ON wedding_invites;
DROP POLICY IF EXISTS "Wedding owners can create invites" ON wedding_invites;
DROP POLICY IF EXISTS "Wedding owners can delete invites" ON wedding_invites;
DROP POLICY IF EXISTS "Users can view their own invites" ON wedding_invites;
DROP POLICY IF EXISTS "Users can delete their own invites" ON wedding_invites;

-- SELECT policy: Wedding owners and admins can view invites for their weddings
CREATE POLICY "Wedding owners can view invites" ON wedding_invites
  FOR SELECT USING (
    -- User is the wedding owner
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = wedding_invites.wedding_id 
      AND w.created_by = auth.uid()
    )
    OR
    -- User is a wedding admin with owner or admin role
    EXISTS (
      SELECT 1 FROM wedding_admins wa
      WHERE wa.wedding_id = wedding_invites.wedding_id 
      AND wa.user_id = auth.uid() 
      AND wa.role IN ('owner', 'admin')
    )
  );

-- INSERT policy: Wedding owners and admins can create invites
CREATE POLICY "Wedding owners can create invites" ON wedding_invites
  FOR INSERT WITH CHECK (
    -- User is the wedding owner
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = wedding_invites.wedding_id 
      AND w.created_by = auth.uid()
    )
    OR
    -- User is a wedding admin with owner or admin role
    EXISTS (
      SELECT 1 FROM wedding_admins wa
      WHERE wa.wedding_id = wedding_invites.wedding_id 
      AND wa.user_id = auth.uid() 
      AND wa.role IN ('owner', 'admin')
    )
  );

-- DELETE policy: Wedding owners and admins can delete invites
CREATE POLICY "Wedding owners can delete invites" ON wedding_invites
  FOR DELETE USING (
    -- User is the wedding owner
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = wedding_invites.wedding_id 
      AND w.created_by = auth.uid()
    )
    OR
    -- User is a wedding admin with owner or admin role
    EXISTS (
      SELECT 1 FROM wedding_admins wa
      WHERE wa.wedding_id = wedding_invites.wedding_id 
      AND wa.user_id = auth.uid() 
      AND wa.role IN ('owner', 'admin')
    )
  );

