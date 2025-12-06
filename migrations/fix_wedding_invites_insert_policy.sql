-- Fix INSERT policy for wedding_invites
-- The policy needs to correctly reference the NEW row's wedding_id
-- In RLS policies, we need to explicitly reference the table name for the new row

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Wedding owners can create invites" ON wedding_invites;

-- Create a new INSERT policy that correctly references the new row
-- Note: In WITH CHECK clauses, we can reference columns directly from the new row
CREATE POLICY "Wedding owners can create invites" ON wedding_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = wedding_invites.wedding_id 
      AND w.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM wedding_admins wa
      WHERE wa.wedding_id = wedding_invites.wedding_id 
      AND wa.user_id = auth.uid() 
      AND wa.role IN ('owner', 'admin')
    )
  );

