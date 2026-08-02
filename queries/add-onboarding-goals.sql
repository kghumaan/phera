-- ─────────────────────────────────────────────────────────────────────
-- Adds a TEXT[] column on user_settings for storing the goals the user
-- picked on onboarding step 3. Idempotent — safe to re-run.
--
-- Run ONCE on phera-test, verify, then on production.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS onboarding_goals TEXT[] DEFAULT '{}'::TEXT[];

-- Optional: index for filtering rows that picked a specific goal.
-- GIN index lets `onboarding_goals @> ARRAY['room_assignments']` etc. be fast.
CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding_goals
  ON user_settings USING GIN (onboarding_goals);

-- Read examples
-- ─────────────────────────────────────────────────────────────────────
-- Users who picked any goal:
--   SELECT user_id, onboarding_goals FROM user_settings
--   WHERE array_length(onboarding_goals, 1) > 0;
--
-- Count by goal:
--   SELECT unnest(onboarding_goals) AS goal, COUNT(*) AS n
--   FROM user_settings
--   WHERE array_length(onboarding_goals, 1) > 0
--   GROUP BY goal ORDER BY n DESC;
--
-- Users who chose Room Assignments specifically:
--   SELECT user_id FROM user_settings
--   WHERE onboarding_goals @> ARRAY['room_assignments'];
