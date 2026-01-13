-- Migration: Backfill wedding_admins table
-- Purpose: Add wedding_admins entries for all existing weddings that don't have them
-- This ensures all wedding creators are properly recognized as admins

-- Step 1: Check existing state
-- Show all weddings that DON'T have a corresponding wedding_admins entry
SELECT
  w.id as wedding_id,
  w.slug,
  w.couple_name,
  w.created_by,
  u.email as creator_email,
  u.raw_user_meta_data->>'name' as creator_name
FROM weddings w
JOIN auth.users u ON w.created_by = u.id
LEFT JOIN wedding_admins wa ON wa.wedding_id = w.id AND wa.user_id = w.created_by
WHERE wa.id IS NULL
ORDER BY w.created_at DESC;

-- Step 2: Backfill wedding_admins entries
-- Insert wedding_admins entries for all weddings where the creator doesn't have an entry
INSERT INTO wedding_admins (wedding_id, user_id, role, created_at)
SELECT
  w.id,
  w.created_by,
  'owner',
  w.created_at  -- Use the wedding creation date for the admin entry
FROM weddings w
LEFT JOIN wedding_admins wa ON wa.wedding_id = w.id AND wa.user_id = w.created_by
WHERE wa.id IS NULL
  AND w.created_by IS NOT NULL
ON CONFLICT (wedding_id, user_id) DO NOTHING;  -- Prevent duplicates if run multiple times

-- Step 3: Verify the backfill
-- Show all weddings with their admin entries
SELECT
  w.slug,
  w.couple_name,
  wa.role,
  u.email as admin_email,
  u.raw_user_meta_data->>'name' as admin_name,
  wa.created_at as admin_since
FROM weddings w
JOIN wedding_admins wa ON wa.wedding_id = w.id
JOIN auth.users u ON wa.user_id = u.id
ORDER BY w.created_at DESC;

-- Step 4: Check for any weddings still without admins (should be empty)
SELECT
  w.id,
  w.slug,
  w.couple_name,
  w.created_by
FROM weddings w
LEFT JOIN wedding_admins wa ON wa.wedding_id = w.id
WHERE wa.id IS NULL
ORDER BY w.created_at DESC;
