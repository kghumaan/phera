-- Allergy Restrictions SQL Queries
-- Run these queries in your Supabase SQL Editor
-- The dietary_restrictions field is stored in the rsvps table as TEXT

-- ============================================
-- 1. Get All Allergy Restrictions (with guest info)
-- ============================================
SELECT 
  r.id,
  r.dietary_restrictions,
  g.name AS guest_name,
  g.email AS guest_email,
  r.wedding_id,
  r.event_id,
  r.attending,
  r.created_at
FROM rsvps r
LEFT JOIN guests g ON r.guest_id = g.id
WHERE r.dietary_restrictions IS NOT NULL 
  AND r.dietary_restrictions != ''
ORDER BY r.created_at DESC;

-- ============================================
-- 2. Get Allergy Restrictions for a Specific Wedding
-- ============================================
SELECT 
  r.dietary_restrictions,
  g.name AS guest_name,
  g.email AS guest_email,
  r.attending,
  r.guest_count,
  r.created_at
FROM rsvps r
LEFT JOIN guests g ON r.guest_id = g.id
WHERE r.wedding_id = 'sim-kv'  -- Replace with your wedding_id
  AND r.dietary_restrictions IS NOT NULL 
  AND r.dietary_restrictions != ''
ORDER BY g.name;

-- ============================================
-- 3. Count Guests with Allergies by Wedding
-- ============================================
SELECT 
  wedding_id,
  COUNT(*) AS guests_with_allergies
FROM rsvps
WHERE dietary_restrictions IS NOT NULL 
  AND dietary_restrictions != ''
GROUP BY wedding_id
ORDER BY guests_with_allergies DESC;

-- ============================================
-- 4. Get Unique Allergy Types (if stored as comma-separated)
-- ============================================
SELECT DISTINCT
  TRIM(UNNEST(STRING_TO_ARRAY(dietary_restrictions, ','))) AS allergy_type
FROM rsvps
WHERE dietary_restrictions IS NOT NULL 
  AND dietary_restrictions != ''
ORDER BY allergy_type;

-- ============================================
-- 5. Get Allergies with Food Preferences
-- ============================================
SELECT 
  g.name AS guest_name,
  g.email AS guest_email,
  r.food_preference,
  r.dietary_restrictions,
  r.attending,
  r.guest_count
FROM rsvps r
LEFT JOIN guests g ON r.guest_id = g.id
WHERE r.dietary_restrictions IS NOT NULL 
  AND r.dietary_restrictions != ''
ORDER BY r.food_preference, g.name;

-- ============================================
-- 6. Summary Report of Allergies
-- ============================================
SELECT 
  r.wedding_id,
  COUNT(*) AS total_guests_with_allergies,
  COUNT(DISTINCT r.guest_id) AS unique_guests_with_allergies,
  STRING_AGG(DISTINCT r.dietary_restrictions, ' | ') AS all_allergies
FROM rsvps r
WHERE r.dietary_restrictions IS NOT NULL 
  AND r.dietary_restrictions != ''
GROUP BY r.wedding_id;

-- ============================================
-- 7. Get Allergies for Attending Guests Only
-- ============================================
SELECT 
  g.name AS guest_name,
  g.email AS guest_email,
  r.dietary_restrictions,
  r.food_preference,
  r.guest_count,
  r.plus_one,
  r.plus_one_name
FROM rsvps r
LEFT JOIN guests g ON r.guest_id = g.id
WHERE r.attending = 'yes'
  AND r.dietary_restrictions IS NOT NULL 
  AND r.dietary_restrictions != ''
ORDER BY g.name;

-- ============================================
-- 8. Export Allergies to CSV Format (for catering)
-- ============================================
SELECT 
  g.name AS "Guest Name",
  g.email AS "Email",
  r.dietary_restrictions AS "Dietary Restrictions",
  r.food_preference AS "Food Preferences",
  r.guest_count AS "Guest Count",
  r.plus_one AS "Plus One",
  r.plus_one_name AS "Plus One Name"
FROM rsvps r
LEFT JOIN guests g ON r.guest_id = g.id
WHERE r.attending = 'yes'
  AND r.dietary_restrictions IS NOT NULL 
  AND r.dietary_restrictions != ''
ORDER BY g.name;

-- ============================================
-- NOTES:
-- ============================================
-- 1. The dietary_restrictions field is populated from the RSVP form
--    (components/guest/CustomRSVPForm.tsx)
-- 2. It's stored as TEXT in the rsvps table
-- 3. The field can be NULL or empty string
-- 4. Data is saved via lib/supabase/rsvp-service.ts (line 237)
-- 5. To use with Supabase MCP, configure it first (see SUPABASE_MCP_SETUP.md)



