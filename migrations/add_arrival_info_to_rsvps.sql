-- Migration: Add arrival information to rsvps table
-- Created: [Current Date]

ALTER TABLE rsvps 
ADD COLUMN IF NOT EXISTS arrival_option TEXT CHECK (arrival_option IN ('known', 'not_sure')),
ADD COLUMN IF NOT EXISTS arrival_date DATE;

-- Add index for queries
CREATE INDEX IF NOT EXISTS idx_rsvps_arrival_date ON rsvps(arrival_date); 