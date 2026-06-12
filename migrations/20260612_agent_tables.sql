-- ============================================================
-- Phera Agent — Phase 1 tables
-- ============================================================
-- Run in Supabase SQL Editor (Dashboard -> SQL Editor).
-- Apply to phera-test FIRST, verify integration tests, then production.
--
-- Tables:
--   agent_conversations — one chat thread per wedding/channel
--   agent_messages      — every turn (user/assistant/tool blocks as JSONB)
--   agent_actions       — audit log of every tool execution (+ future
--                         pending-confirmation store for gated actions)
--   agent_feedback      — thumbs up/down + corrections on messages (Phase 5)
--   agent_knowledge     — global/city/wedding knowledge for retrieval (Phase 5)
--
-- wedding_id is the TEXT slug (same convention as guests/wedding_rooms);
-- RLS goes through public.is_wedding_owner_or_admin_by_slug(wedding_id).
-- ============================================================

-- 1. Conversations -------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp')),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_wedding
  ON agent_conversations (wedding_id, last_message_at DESC);

ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_conversations_admin_all ON agent_conversations;
CREATE POLICY agent_conversations_admin_all ON agent_conversations
  FOR ALL
  USING (public.is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (public.is_wedding_owner_or_admin_by_slug(wedding_id));

-- 2. Messages ------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation
  ON agent_messages (conversation_id, created_at);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_messages_admin_all ON agent_messages;
CREATE POLICY agent_messages_admin_all ON agent_messages
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM agent_conversations c
    WHERE c.id = conversation_id
      AND public.is_wedding_owner_or_admin_by_slug(c.wedding_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM agent_conversations c
    WHERE c.id = conversation_id
      AND public.is_wedding_owner_or_admin_by_slug(c.wedding_id)
  ));

-- 3. Actions (audit log + future pending confirmations) ------------
CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  input JSONB,
  result JSONB,
  status TEXT NOT NULL DEFAULT 'executed'
    CHECK (status IN ('executed', 'failed', 'pending', 'confirmed', 'declined')),
  risk TEXT NOT NULL DEFAULT 'read' CHECK (risk IN ('read', 'write', 'gated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_wedding
  ON agent_actions (wedding_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_pending
  ON agent_actions (conversation_id) WHERE status = 'pending';

ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_actions_admin_all ON agent_actions;
CREATE POLICY agent_actions_admin_all ON agent_actions
  FOR ALL
  USING (public.is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (public.is_wedding_owner_or_admin_by_slug(wedding_id));

-- 4. Feedback (Phase 5 — created now so logging can start anytime) --
CREATE TABLE IF NOT EXISTS agent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES agent_messages(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('up', 'down')),
  correction TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE agent_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_feedback_admin_all ON agent_feedback;
CREATE POLICY agent_feedback_admin_all ON agent_feedback
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM agent_messages m
    JOIN agent_conversations c ON c.id = m.conversation_id
    WHERE m.id = message_id
      AND public.is_wedding_owner_or_admin_by_slug(c.wedding_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM agent_messages m
    JOIN agent_conversations c ON c.id = m.conversation_id
    WHERE m.id = message_id
      AND public.is_wedding_owner_or_admin_by_slug(c.wedding_id)
  ));

-- 5. Knowledge base (Phase 5) ---------------------------------------
-- scope='global' rows (city guides, seasonal advice, vendor directories)
-- are readable by any authenticated user but writable only via service
-- role / dashboard. Wedding-scoped rows follow the usual admin policy.
CREATE TABLE IF NOT EXISTS agent_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL DEFAULT 'wedding' CHECK (scope IN ('global', 'city', 'wedding')),
  city TEXT,
  wedding_id TEXT,
  category TEXT NOT NULL DEFAULT 'logistics'
    CHECK (category IN ('vendor', 'venue', 'seasonal', 'cultural', 'logistics')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_knowledge_scope_shape CHECK (
    (scope = 'wedding' AND wedding_id IS NOT NULL)
    OR (scope = 'city' AND city IS NOT NULL)
    OR scope = 'global'
  )
);

CREATE INDEX IF NOT EXISTS idx_agent_knowledge_scope
  ON agent_knowledge (scope, city, category);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_wedding
  ON agent_knowledge (wedding_id) WHERE wedding_id IS NOT NULL;

ALTER TABLE agent_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_knowledge_global_read ON agent_knowledge;
CREATE POLICY agent_knowledge_global_read ON agent_knowledge
  FOR SELECT
  USING (
    scope IN ('global', 'city')
    OR (wedding_id IS NOT NULL AND public.is_wedding_owner_or_admin_by_slug(wedding_id))
  );

DROP POLICY IF EXISTS agent_knowledge_wedding_write ON agent_knowledge;
CREATE POLICY agent_knowledge_wedding_write ON agent_knowledge
  FOR ALL
  USING (wedding_id IS NOT NULL AND public.is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (
    scope = 'wedding'
    AND wedding_id IS NOT NULL
    AND public.is_wedding_owner_or_admin_by_slug(wedding_id)
  );
