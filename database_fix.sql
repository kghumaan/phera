
-- SQL to run in your Supabase SQL Editor to fix existing email casing:

-- Update emails to lowercase in guests table
UPDATE guests 
SET email = LOWER(email)
WHERE email != LOWER(email);

-- Update plus_one_email to lowercase in rsvps table (safety check)
UPDATE rsvps 
SET plus_one_email = LOWER(plus_one_email)
WHERE plus_one_email IS NOT NULL 
AND plus_one_email != LOWER(plus_one_email);

-- Verify the changes
SELECT 'guests' as table_name, count(*) as total_records, 
       count(CASE WHEN email = LOWER(email) THEN 1 END) as lowercase_emails
FROM guests
UNION ALL
SELECT 'rsvps_plus_one' as table_name, count(*) as total_records,
       count(CASE WHEN plus_one_email IS NULL OR plus_one_email = LOWER(plus_one_email) THEN 1 END) as lowercase_emails
FROM rsvps;

