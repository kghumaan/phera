-- Migration: Add Pin Entry Customization Fields
-- Description: Add fields to weddings table for customizing the pin entry screen

-- Add pin entry customization columns to weddings table
ALTER TABLE weddings
ADD COLUMN IF NOT EXISTS pin_entry_text TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pin_entry_background TEXT DEFAULT '/images/backgrounds/pearl.png',
ADD COLUMN IF NOT EXISTS pin_entry_primary_color TEXT DEFAULT '#141414',
ADD COLUMN IF NOT EXISTS pin_entry_font_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS pin_entry_button_font_color TEXT DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS pin_entry_subtitle_text TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN weddings.pin_entry_text IS 'Custom text displayed on pin entry screen (e.g., "Please join [couple name] on their special night")';
COMMENT ON COLUMN weddings.pin_entry_background IS 'Background image URL for pin entry screen';
COMMENT ON COLUMN weddings.pin_entry_primary_color IS 'Primary color for buttons and accents on pin entry screen';
COMMENT ON COLUMN weddings.pin_entry_font_color IS 'Font color for text on pin entry screen';
COMMENT ON COLUMN weddings.pin_entry_button_font_color IS 'Font color for buttons on pin entry screen';
COMMENT ON COLUMN weddings.pin_entry_subtitle_text IS 'Subtitle text displayed below the main heading on pin entry screen';
