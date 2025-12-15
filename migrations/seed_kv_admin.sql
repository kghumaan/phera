-- Script to make kv.s.ghumaan@gmail.com an admin of the sim-kv wedding
-- Run these queries in order in your Supabase SQL Editor

-- Step 1: Get the user ID for kv.s.ghumaan@gmail.com
-- Copy the ID from the result
SELECT id, email, raw_user_meta_data->>'name' as name
FROM auth.users
WHERE email = 'kv.s.ghumaan@gmail.com';

-- Step 2: Get the wedding ID for 'sim-kv'
-- Copy the ID from the result
SELECT id, slug, couple_name, created_by
FROM weddings
WHERE slug = 'sim-kv';

-- Step 3: Insert into wedding_admins
-- Replace <USER_ID> with the ID from Step 1
-- Replace <WEDDING_ID> with the ID from Step 2
-- Note: If created_by already matches the user_id, this entry is optional but recommended
INSERT INTO wedding_admins (wedding_id, user_id, role, created_at)
VALUES (
  '<WEDDING_ID>',  -- Replace with actual wedding ID
  '<USER_ID>',     -- Replace with actual user ID
  'owner',         -- Use 'owner' for creator, 'admin' for additional admins
  NOW()
)
ON CONFLICT DO NOTHING;  -- Prevent duplicate entries if already exists

-- Step 4: Verify the entry was created
SELECT
  wa.id,
  wa.role,
  wa.created_at,
  w.slug as wedding_slug,
  w.couple_name,
  u.email as user_email,
  u.raw_user_meta_data->>'name' as user_name
FROM wedding_admins wa
JOIN weddings w ON wa.wedding_id = w.id
JOIN auth.users u ON wa.user_id = u.id
WHERE u.email = 'kv.s.ghumaan@gmail.com'
  AND w.slug = 'sim-kv';

-- Alternative: If you want to quickly run this in one go (after getting the IDs manually):
-- This is a helper query that does it all at once if you know the values
/*
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = 'kv.s.ghumaan@gmail.com'
),
wedding_info AS (
  SELECT id FROM weddings WHERE slug = 'sim-kv'
)
INSERT INTO wedding_admins (wedding_id, user_id, role, created_at)
SELECT
  wedding_info.id,
  user_info.id,
  'owner',
  NOW()
FROM user_info, wedding_info
ON CONFLICT DO NOTHING;
*/
