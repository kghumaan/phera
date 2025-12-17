-- Add external_url field to wedding_registry table
-- This allows couples to link to external registry sites instead of using built-in Stripe integration

ALTER TABLE wedding_registry
ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Update existing records to have empty external_url if null
UPDATE wedding_registry
SET external_url = ''
WHERE external_url IS NULL;

-- Add comment to column
COMMENT ON COLUMN wedding_registry.external_url IS 'External URL to registry site (e.g., Zola, Amazon, The Knot)';
