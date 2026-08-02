-- Wedding WhatsApp Channels (couple's own paired number)
--
-- Backs the "Connect your WhatsApp" flow: we provision ONE Whapi Partner
-- channel per couple, the couple pairs their own device via QR, and we then
-- operate as THEIR number to create the wedding guest group + send personal
-- messages — without routing that volume through Phera's shared production
-- number. One row per wedding (re-pairing reuses the row).
--
-- SECURITY: channel_token grants full WhatsApp access to the couple's account.
-- This table is SERVICE-ROLE ONLY. RLS is enabled with NO policies, so anon /
-- authenticated clients (the browser) are denied outright; only server routes
-- using the service-role key may read or write it, and they return ONLY safe
-- fields (status, group_link) to the client — never the token.
--
-- Apply to phera-test FIRST, run integration tests, then production.

-- ============================================================
-- 1. Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wedding_whatsapp_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL UNIQUE,          -- slug, matches existing pattern
  channel_id TEXT,                          -- Whapi Manager channel id
  channel_token TEXT,                       -- SENSITIVE: gate.whapi.cloud token
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | qr | auth | banned | deleted
  paired_phone TEXT,                        -- couple's WhatsApp number once AUTH
  group_id TEXT,                            -- created guest group chat id (...@g.us)
  group_link TEXT,                          -- shareable invite link
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ                     -- set when the channel is torn down
);

-- ============================================================
-- 2. Index
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_wedding_whatsapp_channels_wedding
  ON public.wedding_whatsapp_channels(wedding_id);

-- ============================================================
-- 3. updated_at auto-bump (reuses shared trigger fn)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wedding_whatsapp_channels_set_updated_at ON public.wedding_whatsapp_channels;
CREATE TRIGGER wedding_whatsapp_channels_set_updated_at
  BEFORE UPDATE ON public.wedding_whatsapp_channels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. Row-level security — LOCKED to service role.
--    RLS enabled + zero policies => no anon/authenticated access at all.
--    The token never leaves the server. Do NOT add client SELECT policies.
-- ============================================================
ALTER TABLE public.wedding_whatsapp_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_whatsapp_channels FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.wedding_whatsapp_channels IS
  'Per-wedding Whapi channel for the couple''s own paired WhatsApp number. SERVICE-ROLE ONLY: channel_token grants full WhatsApp access — never expose to the client; RLS intentionally has no policies.';
