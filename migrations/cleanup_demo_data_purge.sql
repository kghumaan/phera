-- ONE-TIME PURGE: clear all stale demo wedding data.
-- Run this in the Supabase SQL Editor (TEST first, then PROD).
-- Safe to re-run (idempotent). Skips tables that don't exist.
--
-- What this does:
--   1. Deletes all `demo-xxxxxxxx` wedding rows + their child data (preserves `demo-template`)
--   2. Deletes legacy rows tagged with the literal slug `demo` (from old demo system)
--   3. Sweeps any remaining orphan rows in slug-based tables
--
-- FK ordering: `coordination_issues` and `whatsapp_broadcasts` have NO ACTION FK to
-- `guests`, so they must be deleted before guests. CASCADE handles the rest.

BEGIN;

DO $$
DECLARE
  t text;

  -- Slug-based child tables (TEXT wedding_id = wedding slug). NO FK CASCADE on slug.
  -- Order matters: NO-ACTION-to-guests tables FIRST, then everything else,
  -- then `guests` LAST so all guest FKs are already cleared.
  slug_tables text[] := ARRAY[
    -- Tables with NO ACTION FK to guests — must precede guests deletion
    'coordination_issues',
    'whatsapp_broadcasts',
    -- Other slug-based child tables (most CASCADE from guests anyway, kept explicit for orphans)
    'rsvps',
    'comments',
    'outreach_events',
    'outreach_sequences',
    'outreach_escalations',
    'guest_flights',
    'guest_hotels',
    'guest_visas',
    'guest_checklist_items',
    'milestones',
    'whatsapp_messages',
    'whatsapp_opt_ins',
    'travel_bus_signups',
    'pin_access',
    'rsvp_custom_questions',
    'wedding_rooms',
    -- Parent of many of the above — must be LAST
    'guests'
  ];

  -- Vendor group: TEXT column but stores wedding UUID as string.
  -- Internal FK chain: members/messages/insights -> conversations -> vendors.
  vendor_tables text[] := ARRAY[
    'conversation_members',
    'vendor_messages',
    'vendor_insights',
    'vendor_conversations',
    'vendors'
  ];

  -- UUID children with NO ACTION FK to weddings — would block parent delete
  uuid_no_cascade text[] := ARRAY[
    'concierge_knowledge_base',
    'feature_requests'
  ];
BEGIN
  -- Step 1: slug-based children for active demo-xxxx weddings
  FOREACH t IN ARRAY slug_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format(
        'DELETE FROM %I WHERE wedding_id IN (SELECT slug FROM weddings WHERE slug LIKE ''demo-%%'' AND slug <> ''demo-template'')',
        t
      );
    END IF;
  END LOOP;

  -- Step 2: vendor group (UUID stored as text)
  FOREACH t IN ARRAY vendor_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format(
        'DELETE FROM %I WHERE wedding_id IN (SELECT id::text FROM weddings WHERE slug LIKE ''demo-%%'' AND slug <> ''demo-template'')',
        t
      );
    END IF;
  END LOOP;

  -- Step 3: UUID children with NO CASCADE (would block weddings delete)
  FOREACH t IN ARRAY uuid_no_cascade LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format(
        'DELETE FROM %I WHERE wedding_id IN (SELECT id FROM weddings WHERE slug LIKE ''demo-%%'' AND slug <> ''demo-template'')',
        t
      );
    END IF;
  END LOOP;

  -- Step 4: delete demo wedding rows (CASCADE handles remaining UUID children)
  DELETE FROM weddings WHERE slug LIKE 'demo-%' AND slug <> 'demo-template';

  -- Step 5: legacy rows tagged with literal slug 'demo' (pre random-slug system).
  -- Use the same ordered list to respect FK constraints.
  FOREACH t IN ARRAY slug_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DELETE FROM %I WHERE wedding_id = ''demo''', t);
    END IF;
  END LOOP;

  -- Step 6: sweep any remaining slug-based orphans (rows pointing to weddings that no longer exist)
  FOREACH t IN ARRAY slug_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format(
        'DELETE FROM %I WHERE wedding_id NOT IN (SELECT slug FROM weddings)',
        t
      );
    END IF;
  END LOOP;
END $$;

-- Verification: uncomment to inspect counts BEFORE committing.
-- All values should be 0.
-- SELECT 'demo_weddings_remaining' AS check, COUNT(*) FROM weddings WHERE slug LIKE 'demo-%' AND slug <> 'demo-template'
--   UNION ALL SELECT 'legacy_demo_guests', COUNT(*) FROM guests WHERE wedding_id = 'demo'
--   UNION ALL SELECT 'guest_orphans', COUNT(*) FROM guests WHERE wedding_id NOT IN (SELECT slug FROM weddings)
--   UNION ALL SELECT 'rsvp_orphans', COUNT(*) FROM rsvps WHERE wedding_id NOT IN (SELECT slug FROM weddings);

COMMIT;
