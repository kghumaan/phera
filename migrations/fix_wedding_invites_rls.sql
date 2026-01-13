-- Fix RLS Policies for wedding_invites
-- Remove policies that try to access auth.users directly (which clients can't do)

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own invites" ON wedding_invites;
DROP POLICY IF EXISTS "Users can delete their own invites" ON wedding_invites;

-- Note: The invite processing in auth callback will use server-side code
-- which has proper permissions, so we don't need client-accessible policies
-- for users to view/delete their own invites.

-- The existing policies for owners/admins are sufficient for the UI functionality.
















