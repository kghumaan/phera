-- Migration: Add wedding_date_end column to weddings table
-- Description: Support date range for multi-day wedding events

ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS wedding_date_end TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN weddings.wedding_date_end IS 'End date for multi-day wedding events. NULL for single-day events.';

