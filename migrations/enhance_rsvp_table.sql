-- Migration: Enhance RSVP table with all form fields
-- Run this migration to capture all data points from the RSVP form

-- Step 1: Change attending from boolean to text to support 'maybe'
-- First, add a new column
ALTER TABLE rsvps ADD COLUMN attending_new text;

-- Copy existing data with conversion
UPDATE rsvps SET attending_new = CASE 
  WHEN attending = true THEN 'yes'
  WHEN attending = false THEN 'no'
  ELSE 'no'
END;

-- Drop the old column and rename the new one
ALTER TABLE rsvps DROP COLUMN attending;
ALTER TABLE rsvps RENAME COLUMN attending_new TO attending;

-- Add constraint to ensure only valid values
ALTER TABLE rsvps ADD CONSTRAINT rsvps_attending_check 
CHECK (attending IN ('yes', 'no', 'maybe'));

-- Make attending NOT NULL
ALTER TABLE rsvps ALTER COLUMN attending SET NOT NULL;

-- Step 2: Add new columns for missing form fields
ALTER TABLE rsvps ADD COLUMN country_code text DEFAULT '+1';
ALTER TABLE rsvps ADD COLUMN plus_one boolean DEFAULT false;
ALTER TABLE rsvps ADD COLUMN food_preference text[]; -- Array of food preferences
ALTER TABLE rsvps ADD COLUMN song_request text;
ALTER TABLE rsvps ADD COLUMN special_message text;
ALTER TABLE rsvps ADD COLUMN maybe_comment text; -- Comment when selecting maybe

-- Step 3: Add indexes for better query performance
CREATE INDEX idx_rsvps_attending ON rsvps(attending);
CREATE INDEX idx_rsvps_plus_one ON rsvps(plus_one);

-- Step 4: Update existing plus_one values based on plus_one_name
UPDATE rsvps SET plus_one = true WHERE plus_one_name IS NOT NULL AND plus_one_name != '';

COMMENT ON COLUMN rsvps.attending IS 'Attendance status: yes, no, or maybe';
COMMENT ON COLUMN rsvps.country_code IS 'Phone country code (e.g., +1, +91)';
COMMENT ON COLUMN rsvps.plus_one IS 'Whether guest is bringing a plus one';
COMMENT ON COLUMN rsvps.food_preference IS 'Array of food preferences selected by guest';
COMMENT ON COLUMN rsvps.song_request IS 'Music request from guest';
COMMENT ON COLUMN rsvps.special_message IS 'Special message from guest';
COMMENT ON COLUMN rsvps.maybe_comment IS 'Comment when guest selects maybe attendance'; 