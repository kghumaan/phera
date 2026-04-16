-- Add role_source column to conversation_members
-- Tracks how the role was assigned: default, ai_predicted, or manual
ALTER TABLE conversation_members
ADD COLUMN IF NOT EXISTS role_source TEXT NOT NULL DEFAULT 'default';
