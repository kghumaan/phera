# Sim-KV Wedding Data Seeding Instructions

This guide helps you populate the database with the existing sim-kv wedding data.

## Step 1: Get Your User ID

Run this query in Supabase SQL Editor to get your user ID:

```sql
SELECT id, email FROM auth.users;
```

Copy your user ID (it will look like: `550e8400-e29b-41d4-a716-446655440000`)

## Step 2: Insert Main Wedding Record

Replace `YOUR_USER_ID_HERE` with your actual user ID and run:

```sql
INSERT INTO weddings (
  slug, couple_name, bride_name, groom_name, wedding_date, wedding_date_display,
  venue_name, venue_location, venue_flag, rsvp_deadline, status,
  couple_image_url, frame_image_url, background_image, primary_color, created_by
) VALUES (
  'sim-kv', 'Simran & Karanvir', 'Simran', 'Karanvir',
  '2026-01-04T00:00:00+00:00', '4-6 JANUARY, 2026',
  'The Palayana', 'Hua Hin, Thailand', '🇹🇭', 'August 16, 2025', 'live',
  '/images/couple/couple-1.jpg', '/images/frames/frame-27.png',
  '/images/backgrounds/pearl.png', '#DE3F5E', 'YOUR_USER_ID_HERE'
);
```

## Step 3: Get Wedding ID

```sql
SELECT id FROM weddings WHERE slug = 'sim-kv';
```

Copy the wedding ID.

## Step 4: Use Automated Script

Instead of manually inserting all data, use the automated script below.

Replace `WEDDING_ID_HERE` with the actual wedding ID in the seed_sim_kv.sql file, then run the entire file.

Or, you can run this simplified version:

```sql
-- Set this variable first
\set wedding_id 'YOUR_WEDDING_ID_HERE'

-- Then run all the INSERT statements using :wedding_id
```

## Quick Verification

After seeding, verify the data:

```sql
-- Check wedding
SELECT * FROM weddings WHERE slug = 'sim-kv';

-- Check events
SELECT COUNT(*) FROM wedding_events 
WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');

-- Check schedule
SELECT COUNT(*) FROM wedding_schedule 
WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');

-- Check FAQs
SELECT COUNT(*) FROM wedding_faqs 
WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');

-- Check registry
SELECT COUNT(*) FROM wedding_registry 
WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');

-- Check shopping guide
SELECT COUNT(*) FROM wedding_shops 
WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');
```

Expected counts:
- Events: 5
- Schedule days: 3
- Schedule items: ~14
- FAQs: 6
- Registry items: 3
- Shops: 4

## Alternative: Use the Web Interface

Once your account is created, you can also use the admin dashboard to manually add all the data through the UI:

1. Sign up at `/auth/login`
2. Go to `/admin/onboarding/sim-kv/overview`
3. Fill in each section

This is slower but ensures everything is formatted correctly.

