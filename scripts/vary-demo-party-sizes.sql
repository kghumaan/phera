-- ============================================================
-- Vary party sizes on the demo template + every existing demo wedding
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor).
--
-- Why this exists:
--   The demo template was seeded with every guest at party_size = 1
--   and no plus-ones, so every cloned demo wedding showed an
--   artificially flat "1, 1, 1, 1" guest list. The UI reads party
--   size from `guests.logistics_data.party_size` (JSONB), NOT from
--   `rsvps.guest_count` -- a separate field we updated in the prior
--   pass that turned out to be the wrong target.
--
-- What it does:
--   For every guest on the demo-template AND every cloned demo
--   wedding (slug LIKE 'demo-%'), this sets:
--
--     logistics_data.party_size       (1..6, hash-bucketed)
--     logistics_data.plus_one_name    (named spouse | "Family of N" | NULL)
--     logistics_data.plus_one_phone   (cleared to NULL)
--     logistics_data.additional_guests (cleared to [])
--
--   Other logistics_data keys (dietary, hotel, etc.) are preserved
--   via the `||` JSONB merge.
--
-- Distribution after this pass:
--     ~15% solo               (party_size = 1, no plus_one_name)
--     ~40% couple             (party_size = 2)
--     ~25% party of 3
--     ~12% party of 4
--      ~6% party of 5
--      ~2% party of 6
--
-- Plus-one name shape (for non-solo parties):
--   - 50% get a named spouse: "<random first> <primary's last name>"
--     For parties >2, name is annotated "Spouse Name + N more".
--   - 30% get a generic "Family of N".
--   - 20% are left with plus_one_name = NULL ("we have a party of 4
--     but no names entered yet" -- intentional realism).
--
--   All hash buckets are deterministic per guest_id, so re-running
--   produces the same result and a given demo guest's party size
--   is stable across reruns.
--
-- Future demos: lib/demo/clone-demo-wedding.ts copies guest rows
-- from demo-template, so once this UPDATE is applied to the template
-- every NEW demo will inherit the variety. Existing demos are
-- updated directly via the LIKE 'demo-%' clause below.
-- ============================================================

WITH bucket AS (
  SELECT
    g.id,
    g.name,
    -- Last word of name = "last name" (best-effort split).
    split_part(g.name, ' ', array_length(string_to_array(g.name, ' '), 1)) AS last_name,
    -- Party size bucket
    CASE
      WHEN abs(hashtext(g.id::text)) % 100 < 15 THEN 1
      WHEN abs(hashtext(g.id::text)) % 100 < 55 THEN 2
      WHEN abs(hashtext(g.id::text)) % 100 < 80 THEN 3
      WHEN abs(hashtext(g.id::text)) % 100 < 92 THEN 4
      WHEN abs(hashtext(g.id::text)) % 100 < 98 THEN 5
      ELSE 6
    END AS size,
    -- Independent salt: 0-9, decides name shape (named / family-of / null)
    abs(hashtext(g.id::text || ':named')) % 10 AS name_roll,
    -- Pick a first name for the spouse from a 24-name rotation
    (ARRAY[
      'Aarav','Aanya','Vihaan','Diya','Reyansh','Anaya',
      'Ayaan','Saanvi','Ishaan','Kiara','Krishna','Myra',
      'Aditya','Tara','Rohan','Pari','Arjun','Ira',
      'Vivaan','Riya','Karan','Mira','Dev','Sara'
    ])[(abs(hashtext(g.id::text || ':first')) % 24) + 1] AS first_name
  FROM guests g
  WHERE g.wedding_id = 'demo-template'
     OR g.wedding_id LIKE 'demo-%'
),
shaped AS (
  SELECT
    b.id,
    b.size,
    CASE
      WHEN b.size = 1 THEN NULL
      -- 50% named spouse (with "+ N more" annotation for parties >2)
      WHEN b.name_roll < 5 THEN
        b.first_name || ' ' || b.last_name
        || CASE WHEN b.size > 2 THEN ' + ' || (b.size - 2) || ' more' ELSE '' END
      -- 30% generic family-of-N
      WHEN b.name_roll < 8 THEN
        'Family of ' || b.size
      -- 20% no name (party size > 1 but no details entered)
      ELSE
        NULL
    END AS plus_one_name
  FROM bucket b
)
UPDATE guests g
SET logistics_data = COALESCE(g.logistics_data, '{}'::jsonb)
  || jsonb_build_object(
    'party_size', s.size,
    'plus_one_name', s.plus_one_name,
    'plus_one_phone', NULL,
    'additional_guests', '[]'::jsonb
  )
FROM shaped s
WHERE g.id = s.id;


-- ============================================================
-- Sanity check (run separately to eyeball the new distribution)
-- ============================================================
-- SELECT
--   (logistics_data->>'party_size')::int AS party_size,
--   COUNT(*) AS guests,
--   COUNT(*) FILTER (WHERE logistics_data->>'plus_one_name' IS NOT NULL) AS with_name
-- FROM guests
-- WHERE wedding_id = 'demo-template' OR wedding_id LIKE 'demo-%'
-- GROUP BY party_size
-- ORDER BY party_size;
