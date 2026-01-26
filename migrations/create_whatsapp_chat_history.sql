-- Migration: Create WhatsApp Chat History for AI Chatbot
-- Created: 2026-01-19
-- Description: Store both incoming and outgoing messages for conversation memory

CREATE TABLE IF NOT EXISTS whatsapp_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  wa_message_id TEXT, -- WhatsApp's message ID (useful for referencing back)
  metadata JSONB DEFAULT '{}'::jsonb, -- Store thing like 'was_button_click', 'button_id', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wa_chat_history_wedding_guest ON whatsapp_chat_history(wedding_id, guest_id);
CREATE INDEX IF NOT EXISTS idx_wa_chat_history_created_at ON whatsapp_chat_history(created_at ASC);

-- Enable Row Level Security
ALTER TABLE whatsapp_chat_history ENABLE ROW LEVEL SECURITY;

-- Admins can view history for their wedding
CREATE POLICY "Admins can view chat history" ON whatsapp_chat_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

-- System/Backend can manage all history
-- Since we usually use service role for webhooks, we don't need explicit broad policies
-- unless we want restricted access for guests (usually guests don't read this table directly)

COMMENT ON TABLE whatsapp_chat_history IS 'Stores the chronological log of messages between guests and the AI wedding assistant';
