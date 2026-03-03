-- Vendor Coordinator tables for Phera
-- Tracks vendor conversations, messages, and AI-extracted insights

-- ============================================================
-- vendors: Wedding vendor contact records
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'booked', 'declined', 'paid')),
  whatsapp_group_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_wedding_id ON vendors (wedding_id);
CREATE INDEX idx_vendors_phone ON vendors (phone);

-- ============================================================
-- vendor_conversations: A WhatsApp group chat or imported chat
-- ============================================================
CREATE TABLE IF NOT EXISTS vendor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,
  vendor_id UUID REFERENCES vendors (id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'whapi_webhook'
    CHECK (source IN ('whapi_webhook', 'chat_export')),
  whatsapp_group_id TEXT,
  title TEXT,
  raw_file_url TEXT,
  message_count INT NOT NULL DEFAULT 0,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'ready', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_conversations_wedding_id ON vendor_conversations (wedding_id);
CREATE INDEX idx_vendor_conversations_vendor_id ON vendor_conversations (vendor_id);
CREATE INDEX idx_vendor_conversations_whatsapp_group_id ON vendor_conversations (whatsapp_group_id);

-- ============================================================
-- vendor_messages: Individual messages within a conversation
-- ============================================================
CREATE TABLE IF NOT EXISTS vendor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES vendor_conversations (id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  sender_name TEXT,
  sender_phone TEXT,
  sender_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (sender_type IN ('couple', 'vendor', 'planner', 'coordinator', 'unknown')),
  content TEXT,
  message_timestamp TIMESTAMPTZ,
  has_media BOOLEAN NOT NULL DEFAULT FALSE,
  media_type TEXT,
  media_url TEXT,
  whapi_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_messages_conversation_id ON vendor_messages (conversation_id);
CREATE INDEX idx_vendor_messages_wedding_id ON vendor_messages (wedding_id);
CREATE INDEX idx_vendor_messages_whapi_message_id ON vendor_messages (whapi_message_id);

-- ============================================================
-- vendor_insights: AI-extracted insights from conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS vendor_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES vendor_conversations (id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  vendor_id UUID REFERENCES vendors (id) ON DELETE SET NULL,
  insight_type TEXT NOT NULL
    CHECK (insight_type IN ('summary', 'action_item', 'decision', 'price_quote', 'deadline')),
  content TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_insights_conversation_id ON vendor_insights (conversation_id);
CREATE INDEX idx_vendor_insights_wedding_id ON vendor_insights (wedding_id);
CREATE INDEX idx_vendor_insights_vendor_id ON vendor_insights (vendor_id);
CREATE INDEX idx_vendor_insights_type ON vendor_insights (insight_type);
