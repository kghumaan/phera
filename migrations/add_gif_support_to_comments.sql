-- Migration: Add GIF support to comments table
-- Run this migration to enable GIF attachments in comments

-- Add GIF-related columns to comments table
ALTER TABLE comments ADD COLUMN gif_id TEXT;
ALTER TABLE comments ADD COLUMN gif_url TEXT;
ALTER TABLE comments ADD COLUMN gif_title TEXT;
ALTER TABLE comments ADD COLUMN gif_preview_url TEXT;

-- Add a check constraint to ensure that if any gif field is set, gif_id and gif_url are required
ALTER TABLE comments ADD CONSTRAINT comments_gif_consistency_check 
CHECK (
  (gif_id IS NULL AND gif_url IS NULL AND gif_title IS NULL AND gif_preview_url IS NULL) OR
  (gif_id IS NOT NULL AND gif_url IS NOT NULL)
);

-- Allow message to be optional when GIF is present
ALTER TABLE comments ALTER COLUMN message DROP NOT NULL;

-- Add a check to ensure either message or gif is present
ALTER TABLE comments ADD CONSTRAINT comments_content_check 
CHECK (
  (message IS NOT NULL AND message != '') OR 
  (gif_id IS NOT NULL AND gif_url IS NOT NULL)
);

-- Add index for better query performance on gif fields
CREATE INDEX idx_comments_gif_id ON comments(gif_id) WHERE gif_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN comments.gif_id IS 'GIPHY GIF ID if comment includes a GIF';
COMMENT ON COLUMN comments.gif_url IS 'Full resolution GIF URL';
COMMENT ON COLUMN comments.gif_title IS 'GIF title from GIPHY';
COMMENT ON COLUMN comments.gif_preview_url IS 'Preview/thumbnail GIF URL for performance'; 