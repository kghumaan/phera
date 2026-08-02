-- Concierge enable flag + broadcast feature tables
-- Apply to phera-test first, verify, then production.

-- ─── 1. Enable flag on wedding_settings ─────────────────────────────────
ALTER TABLE wedding_settings
  ADD COLUMN IF NOT EXISTS concierge_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS concierge_enabled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_wedding_settings_concierge_enabled
  ON wedding_settings(wedding_id)
  WHERE concierge_enabled = true;

-- ─── 2. Broadcasts table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS concierge_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,
  message TEXT NOT NULL,
  -- Targeting: all guests, filtered by tag/group, or explicit guest ids
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'tags', 'specific')),
  target_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  target_guest_ids UUID[] DEFAULT ARRAY[]::UUID[],
  -- Optional data-collection schema:
  -- [{ "key": "dietary", "label": "Dietary preference", "type": "text" }, ...]
  collects_data BOOLEAN NOT NULL DEFAULT false,
  data_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Delivery state
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concierge_broadcasts_wedding ON concierge_broadcasts(wedding_id);
CREATE INDEX IF NOT EXISTS idx_concierge_broadcasts_status ON concierge_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_concierge_broadcasts_created_at ON concierge_broadcasts(created_at DESC);

-- ─── 3. Per-guest broadcast recipients (delivery + reply tracking) ──────
CREATE TABLE IF NOT EXISTS concierge_broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES concierge_broadcasts(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  -- Delivery state (mirrors WhatsApp webhook statuses)
  delivery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  whatsapp_message_id TEXT,
  error_message TEXT,
  -- Reply tracking
  replied_at TIMESTAMPTZ,
  reply_text TEXT,
  -- Keyed by data_schema keys: { "dietary": "Vegetarian", "arrival": "Mar 5 8pm" }
  collected_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (broadcast_id, guest_id)
);

CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast ON concierge_broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_guest ON concierge_broadcast_recipients(guest_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_wedding ON concierge_broadcast_recipients(wedding_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_whatsapp_msg ON concierge_broadcast_recipients(whatsapp_message_id)
  WHERE whatsapp_message_id IS NOT NULL;

-- ─── 4. RLS ─────────────────────────────────────────────────────────────
ALTER TABLE concierge_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- Reuse existing slug-based helper (wedding_id is text slug, not UUID).
CREATE POLICY "concierge_broadcasts_admin_access" ON concierge_broadcasts
  FOR ALL USING (is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_slug(wedding_id));

CREATE POLICY "concierge_broadcast_recipients_admin_access" ON concierge_broadcast_recipients
  FOR ALL USING (is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_slug(wedding_id));
