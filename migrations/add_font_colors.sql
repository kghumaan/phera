-- Add font_color and button_font_color columns to weddings table
-- Migration created: 2024-11-22

ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS font_color TEXT DEFAULT '#1a1a1a';

ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS button_font_color TEXT DEFAULT '#FFFFFF';

-- Add couple_images column to support multiple couple photos
ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS couple_images JSONB;

-- Add comment for documentation
COMMENT ON COLUMN weddings.font_color IS 'Primary font color for wedding website text';
COMMENT ON COLUMN weddings.button_font_color IS 'Font color for button text';
COMMENT ON COLUMN weddings.couple_images IS 'Array of couple photo URLs (supports up to 6 photos)';

