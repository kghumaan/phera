-- ─────────────────────────────────────────────────────────────────────
-- Seed the simran-karanvir TEMPLATE wedding with realistic Control Tower
-- data so that every demo cloned from it shows a populated dashboard.
--
-- Run ONCE on production. Re-running is idempotent (it overwrites
-- outreach_status / conversation_topic, and only inserts events /
-- escalations if the table is empty for this wedding).
--
-- Paste into Supabase SQL editor for the production project.
-- ─────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  template_slug TEXT := 'simran-karanvir';
  template_uuid UUID;
  guest_count INT;
BEGIN
  -- 1. Resolve template wedding UUID
  SELECT id INTO template_uuid FROM weddings WHERE slug = template_slug;
  IF template_uuid IS NULL THEN
    RAISE EXCEPTION 'Template wedding "%" not found', template_slug;
  END IF;

  SELECT COUNT(*) INTO guest_count FROM guests WHERE wedding_id = template_slug;
  IF guest_count = 0 THEN
    RAISE EXCEPTION 'Template wedding "%" has no guests — seed guests first', template_slug;
  END IF;

  RAISE NOTICE 'Seeding Control Tower for template "%" (% guests)', template_slug, guest_count;

  -- 2. Spread outreach_status across the funnel using deterministic hash buckets
  --    (so re-running gives the same distribution).
  --    Targets ~6 stages weighted toward the middle of the funnel.
  UPDATE guests
  SET outreach_status = CASE bucket
        WHEN 0 THEN 'rsvp_confirmed'
        WHEN 1 THEN 'rsvp_confirmed'
        WHEN 2 THEN 'rsvp_confirmed'
        WHEN 3 THEN 'rsvp_confirmed'
        WHEN 4 THEN 'rsvp_requested'
        WHEN 5 THEN 'rsvp_requested'
        WHEN 6 THEN 'save_the_date_sent'
        WHEN 7 THEN 'travel_collected'
        WHEN 8 THEN 'unresponsive'
        WHEN 9 THEN 'not_contacted'
      END,
      outreach_last_contacted_at = CASE bucket
        WHEN 9 THEN NULL
        ELSE NOW() - (INTERVAL '1 day' * (bucket + 2))
      END,
      outreach_attempt_count = CASE bucket
        WHEN 9 THEN 0
        WHEN 8 THEN 3
        ELSE 1 + (bucket % 3)
      END
  FROM (
    SELECT id, (abs(hashtext(id::text)) % 10) AS bucket
    FROM guests
    WHERE wedding_id = template_slug
  ) AS hashed
  WHERE guests.id = hashed.id;

  -- 3. Spread conversation_topic across a subset for the Concierge topic chart.
  UPDATE guests
  SET conversation_topic = CASE topic_bucket
        WHEN 0 THEN 'venue'
        WHEN 1 THEN 'dress_code'
        WHEN 2 THEN 'schedule'
        WHEN 3 THEN 'shuttle'
        WHEN 4 THEN 'dietary'
        WHEN 5 THEN 'lodging'
      END
  FROM (
    SELECT id, (abs(hashtext(id::text || 'topic')) % 10) AS bucket,
           (abs(hashtext(id::text || 'topic')) % 6) AS topic_bucket
    FROM guests
    WHERE wedding_id = template_slug
  ) AS topics
  WHERE guests.id = topics.id
    AND topics.bucket < 6;  -- ~60% of guests have a topic

  -- 4. Insert outreach_events (template_sent) over the past 7 days,
  --    only if no events exist yet for this wedding.
  IF NOT EXISTS (SELECT 1 FROM outreach_events WHERE wedding_id = template_slug LIMIT 1) THEN
    INSERT INTO outreach_events (wedding_id, guest_id, event_type, template_name, channel, details, created_at)
    SELECT
      template_slug,
      g.id,
      'template_sent',
      CASE (abs(hashtext(g.id::text || 'tpl')) % 4)
        WHEN 0 THEN 'save_the_date'
        WHEN 1 THEN 'rsvp_request'
        WHEN 2 THEN 'travel_request'
        ELSE 'reminder'
      END,
      'whatsapp',
      jsonb_build_object('seed', true),
      NOW() - (INTERVAL '1 hour' * (abs(hashtext(g.id::text || 'when')) % (24 * 7)))
    FROM guests g
    WHERE g.wedding_id = template_slug
      AND g.outreach_status IN ('save_the_date_sent', 'rsvp_requested', 'rsvp_confirmed', 'travel_collected', 'unresponsive')
      AND (abs(hashtext(g.id::text || 'evt')) % 10) < 7;  -- ~70% of contacted guests get an event

    RAISE NOTICE 'Inserted outreach_events';
  ELSE
    RAISE NOTICE 'Skipped outreach_events (already populated)';
  END IF;

  -- 5. Insert a few coordination_issues (escalations) only if none exist.
  IF NOT EXISTS (SELECT 1 FROM coordination_issues WHERE wedding_id = template_slug LIMIT 1) THEN
    -- Pick 4 deterministic guests to attach realistic escalations to
    INSERT INTO coordination_issues (wedding_id, guest_id, category, title, description, priority, status, source, created_at)
    SELECT template_slug, id, category, title, description, priority, status, source, created_at
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY hashtext(id::text)) AS rn
      FROM guests
      WHERE wedding_id = template_slug
        AND outreach_status IN ('rsvp_confirmed', 'travel_collected')
      LIMIT 4
    ) AS picks
    JOIN (
      VALUES
        (1, 'dietary', 'Severe nut allergy flagged', 'Guest mentioned a severe peanut allergy and asked about menu safety for the sangeet dinner.', 'high', 'open', 'concierge', NOW() - INTERVAL '4 hours'),
        (2, 'travel', 'Flight change requested', 'Guest is rebooking arrival from Friday evening to Saturday morning. Needs new shuttle slot and updated room availability.', 'medium', 'open', 'concierge', NOW() - INTERVAL '11 hours'),
        (3, 'logistics', 'Plus-one not on list', 'Guest is bringing a +1 (partner) who is not on the original list. Needs RSVP confirmation and seating.', 'medium', 'in_progress', 'concierge', NOW() - INTERVAL '1 day'),
        (4, 'venue', 'Wheelchair access for parent', 'Guest asking about wheelchair-accessible entrance for the haldi venue. Needs venue contact follow-up.', 'high', 'open', 'concierge', NOW() - INTERVAL '2 days')
    ) AS issues(rn, category, title, description, priority, status, source, created_at)
    ON picks.rn = issues.rn;

    RAISE NOTICE 'Inserted coordination_issues';
  ELSE
    RAISE NOTICE 'Skipped coordination_issues (already populated)';
  END IF;

  RAISE NOTICE 'Done seeding Control Tower for "%"', template_slug;
END $$;

-- ─── Verification queries (read-only) ────────────────────────────────
-- Run these after the block above to confirm the data looks right.

-- Funnel distribution
SELECT outreach_status, COUNT(*) AS n
FROM guests
WHERE wedding_id = 'simran-karanvir'
GROUP BY outreach_status
ORDER BY n DESC;

-- Topic breakdown
SELECT conversation_topic, COUNT(*) AS n
FROM guests
WHERE wedding_id = 'simran-karanvir'
  AND conversation_topic IS NOT NULL
GROUP BY conversation_topic
ORDER BY n DESC;

-- Recent template-sent activity
SELECT COUNT(*) AS sent_last_7_days
FROM outreach_events
WHERE wedding_id = 'simran-karanvir'
  AND event_type = 'template_sent'
  AND created_at >= NOW() - INTERVAL '7 days';

-- Open escalations
SELECT title, priority, status, created_at
FROM coordination_issues
WHERE wedding_id = 'simran-karanvir'
ORDER BY created_at DESC;
