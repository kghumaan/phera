/**
 * The planning spine — the canonical ordered steps the Planner walks a couple
 * through (decided 2026-07-02, docs/PLANNER-SPINE-TRACKER.md E1; travel comes
 * BEFORE the website so FAQs state real accommodation facts).
 *
 * Single source of truth shared by: the agent's focus tools
 * (lib/agent/tools/focus.ts), the wedding snapshot (lib/agent/context.ts),
 * the summary API (app/api/agent/summary), and the Working-on bar UI
 * (components/agent/AgentChatPanel.tsx). The eval suite probes this order
 * too (tests/agent-evals/scenario-coverage.test.ts).
 */

export interface SpineStep {
  key: string;
  label: string;
}

export const SPINE_STEPS: SpineStep[] = [
  { key: 'schedule', label: 'Schedule & Events' },
  { key: 'travel', label: 'Travel & Stay' },
  { key: 'website', label: 'Website & FAQs' },
  { key: 'guest-list', label: 'Guest List' },
  { key: 'rsvps', label: 'RSVPs' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'vendors', label: 'Vendors & Venue' },
  { key: 'registry', label: 'Registry' },
  { key: 'photos', label: 'Photos' },
];

export const SPINE_STEP_KEYS = SPINE_STEPS.map((s) => s.key);

/** agent_knowledge row title that persists the current focus per wedding. */
export const FOCUS_TITLE = 'Current focus';

export function spineStepLabel(key: string | null | undefined): string | null {
  if (!key) return null;
  return SPINE_STEPS.find((s) => s.key === key)?.label ?? null;
}

/** Persisted focus state (agent_knowledge metadata shape). */
export interface SpineFocus {
  /** The step being worked on right now; null when nothing is active. */
  step: string | null;
  done: string[];
  skipped: string[];
}

export const EMPTY_FOCUS: SpineFocus = { step: null, done: [], skipped: [] };

/**
 * Skip = defer-and-resurface (PLANNER-SPINE-TRACKER E2): after a step is
 * completed or skipped, the next focus is the first LATER step that isn't
 * done/skipped; once the chain is exhausted, previously-skipped steps
 * resurface (oldest first) — except the one just deferred, which never
 * bounces straight back. Returns null when everything is done/deferred-now.
 */
export function nextSpineStep(justFinished: string, done: string[], skipped: string[]): string | null {
  const settled = new Set([...done, ...skipped, justFinished]);
  const startIdx = SPINE_STEP_KEYS.indexOf(justFinished);

  // Walk forward from the step just finished, wrapping to the start so an
  // out-of-order jump (they did rooms early) still finds earlier gaps.
  for (let offset = 1; offset <= SPINE_STEP_KEYS.length; offset++) {
    const key = SPINE_STEP_KEYS[(startIdx + offset) % SPINE_STEP_KEYS.length];
    if (!settled.has(key)) return key;
  }
  // Nothing fresh left — resurface earlier-skipped steps, oldest first.
  const resurface = skipped.find((k) => k !== justFinished);
  return resurface ?? null;
}

/** True when every spine step is done (skipped steps don't count as done). */
export function spineComplete(focus: SpineFocus): boolean {
  return !focus.step && SPINE_STEP_KEYS.every((k) => focus.done.includes(k) || focus.skipped.includes(k));
}
