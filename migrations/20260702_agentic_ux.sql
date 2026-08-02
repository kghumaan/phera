-- Agentic UX — undo snapshots + support handoffs
-- ───────────────────────────────────────────────────────────────────────────
-- Three small widenings for the agent's agentic-UX upgrade:
--   1. agent_actions.before      — JSONB pre-write snapshot so undo_last_action
--                                  can restore the exact prior row state
--   2. agent_actions.status      — add 'reverted' (an executed action that was
--                                  undone via undo_last_action)
--   3. planner_requests.kind     — add 'support' (user asked for a human /
--                                  repeated failure / needs human judgment)
--
-- Apply to the TEST project first, verify, then production. Do NOT run via CLI.

-- 1. Pre-write snapshot for undo_last_action
ALTER TABLE public.agent_actions ADD COLUMN IF NOT EXISTS before JSONB;

-- 2. Widen agent_actions status CHECK to include 'reverted'. The original
-- constraint was inline/unnamed, so Postgres auto-named it.
ALTER TABLE public.agent_actions DROP CONSTRAINT IF EXISTS agent_actions_status_check;
ALTER TABLE public.agent_actions ADD CONSTRAINT agent_actions_status_check
  CHECK (status IN ('executed', 'failed', 'pending', 'confirmed', 'declined', 'reverted'));

-- 3. Widen planner_requests kind CHECK to include 'support'
ALTER TABLE public.planner_requests DROP CONSTRAINT IF EXISTS planner_requests_kind_check;
ALTER TABLE public.planner_requests ADD CONSTRAINT planner_requests_kind_check
  CHECK (kind IN ('managed', 'unsupported', 'support'));
