-- Coordinator Overhaul: support direct chats + conversation members
-- Phase 1A: Alter vendor_conversations for direct chat support
ALTER TABLE vendor_conversations
  ADD COLUMN IF NOT EXISTS chat_type TEXT NOT NULL DEFAULT 'group'
    CHECK (chat_type IN ('group', 'direct')),
  ADD COLUMN IF NOT EXISTS whatsapp_chat_id TEXT;

-- Update source constraint to allow 'whapi_direct'
ALTER TABLE vendor_conversations DROP CONSTRAINT IF EXISTS vendor_conversations_source_check;
ALTER TABLE vendor_conversations ADD CONSTRAINT vendor_conversations_source_check
  CHECK (source IN ('whapi_webhook', 'chat_export', 'whapi_direct'));

-- Phase 1B: Create conversation_members table
CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES vendor_conversations(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('vendor', 'admin', 'member')),
  avatar_url TEXT,
  is_whatsapp_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (conversation_id, phone)
);
