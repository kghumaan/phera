-- Enables safely renaming a wedding's slug post-creation (e.g. auto-renaming
-- from a random draft slug like a raw UUID to a names-based one at publish
-- time) without orphaning the ~30 TEXT wedding_id-keyed child tables.
--
-- Context: AdminPublishButton's existing manual "Your Wedding ID" rename does
-- a plain `UPDATE weddings SET slug = ...` that only touches the weddings
-- row. Every other table stores wedding_id as a denormalized TEXT copy of
-- the slug with no FK cascade, so a bare rename leaves guests/rsvps/rooms/etc.
-- silently invisible under the new slug (the known orphan bug). This
-- function does the rename atomically across every table that actually
-- carries a slug-shaped wedding_id.
--
-- Run in Supabase SQL Editor: TEST project first, then PRODUCTION.

BEGIN;

-- rsvp_custom_questions is the one slug-keyed child with a real FK
-- (REFERENCES weddings(slug)) and no ON UPDATE CASCADE, so a plain rename
-- would either orphan it (if we ignored the FK) or hard-fail outright (FK
-- default is NO ACTION, which rejects renaming a slug that's still
-- referenced). Add ON UPDATE CASCADE so Postgres propagates the rename here
-- automatically instead of needing manual handling below.
ALTER TABLE public.rsvp_custom_questions
  DROP CONSTRAINT IF EXISTS rsvp_custom_questions_wedding_id_fkey;
ALTER TABLE public.rsvp_custom_questions
  ADD CONSTRAINT rsvp_custom_questions_wedding_id_fkey
  FOREIGN KEY (wedding_id) REFERENCES public.weddings(slug)
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION public.rename_wedding_slug(p_wedding_id uuid, p_new_slug text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_slug text;
  t text;
  -- Every TEXT wedding_id-keyed table EXCEPT rsvp_custom_questions (handled
  -- by the FK's ON UPDATE CASCADE above) and the vendor_* group (vendors,
  -- vendor_conversations, vendor_messages, vendor_insights, conversation_members
  -- — those store the wedding UUID as text, not the slug, so a slug rename
  -- doesn't touch them). Keep this list in sync with `slug_tables` in
  -- migrations/cleanup_demo_data_purge.sql.
  slug_tables text[] := ARRAY[
    'coordination_issues', 'whatsapp_broadcasts', 'rsvps', 'comments',
    'outreach_events', 'outreach_sequences', 'outreach_escalations',
    'guest_flights', 'guest_hotels', 'guest_visas', 'guest_checklist_items',
    'milestones', 'whatsapp_messages', 'whatsapp_opt_ins', 'travel_bus_signups',
    'pin_access', 'wedding_rooms', 'agent_conversations', 'agent_actions',
    'agent_knowledge', 'guest_households', 'wedding_whatsapp_channels',
    'wedding_bot_admins', 'bot_admin_log', 'concierge_broadcasts',
    'concierge_broadcast_recipients', 'guest_event_access', 'saved_vendors',
    'planner_requests',
    'guests' -- parent of many of the above; kept last for consistency with
             -- the demo-purge script's ordering (no FK dependency requires it)
  ];
BEGIN
  IF NOT public.is_wedding_owner_or_admin_by_id(p_wedding_id::text) THEN
    RAISE EXCEPTION 'not authorized to rename this wedding';
  END IF;

  SELECT slug INTO v_old_slug FROM public.weddings WHERE id = p_wedding_id FOR UPDATE;
  IF v_old_slug IS NULL THEN
    RAISE EXCEPTION 'wedding not found';
  END IF;
  IF v_old_slug = p_new_slug THEN
    RETURN v_old_slug; -- no-op, already this slug
  END IF;
  IF EXISTS (SELECT 1 FROM public.weddings WHERE slug = p_new_slug) THEN
    RAISE EXCEPTION 'slug already taken';
  END IF;

  -- Cascades rsvp_custom_questions.wedding_id automatically via the FK above.
  UPDATE public.weddings SET slug = p_new_slug WHERE id = p_wedding_id;

  FOREACH t IN ARRAY slug_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('UPDATE %I SET wedding_id = $1 WHERE wedding_id = $2', t)
        USING p_new_slug, v_old_slug;
    END IF;
  END LOOP;

  RETURN v_old_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rename_wedding_slug(uuid, text) TO authenticated;

COMMIT;
