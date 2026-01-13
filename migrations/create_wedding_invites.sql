-- Migration: Create Wedding Invites Table
-- Description: Add table to support pending email invites for team members

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create wedding_invites table for pending email invitations
CREATE TABLE IF NOT EXISTS wedding_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wedding_id, email)
);

-- Enable Row Level Security
ALTER TABLE wedding_invites ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wedding_invites_wedding_id ON wedding_invites(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_invites_email ON wedding_invites(email);

-- RLS Policies for wedding_invites

-- Policy: Wedding owners and admins can view invites for their weddings
CREATE POLICY "Wedding owners can view invites" ON wedding_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id 
      AND (w.created_by = auth.uid() OR (wa.user_id = auth.uid() AND wa.role IN ('owner', 'admin')))
    )
  );

-- Policy: Wedding owners and admins can create invites
CREATE POLICY "Wedding owners can create invites" ON wedding_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id 
      AND (w.created_by = auth.uid() OR (wa.user_id = auth.uid() AND wa.role IN ('owner', 'admin')))
    )
  );

-- Policy: Wedding owners and admins can delete invites
CREATE POLICY "Wedding owners can delete invites" ON wedding_invites
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id 
      AND (w.created_by = auth.uid() OR (wa.user_id = auth.uid() AND wa.role IN ('owner', 'admin')))
    )
  );

-- Policy: Users can view invites sent to their email (for processing on login)
CREATE POLICY "Users can view their own invites" ON wedding_invites
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: System can delete invites when processing (after user accepts)
-- This allows the invite to be deleted when converting to wedding_admin
CREATE POLICY "Users can delete their own invites" ON wedding_invites
  FOR DELETE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

