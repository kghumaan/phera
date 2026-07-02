/**
 * DETERMINISTIC (CI) — enforces the SHAPE of the eval suite itself, so
 * coverage can't silently rot:
 *
 * 1. Every scenario fixture declares a persona (P1–P10 / E1–E10 from
 *    docs/AGENT-EVALS.md) — no anonymous scenarios.
 * 2. The suite always covers MULTIPLE personas (≥ 5 distinct).
 * 3. There is always a full-spine walkthrough, and its declared step order
 *    matches the canonical spine decided in docs/PLANNER-SPINE-TRACKER.md E1
 *    (schedule → travel → website → guest list → RSVPs → rooms → vendors →
 *    registry → photos). If the spine order ever changes, this test forces
 *    the eval + system prompt to be updated together.
 *
 * This does NOT run the scenarios (that's `npm run evals`, costs tokens) —
 * it validates the fixtures as data.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Must match the dependency order in lib/agent/system-prompt.ts
 *  ("Guiding them through what's left") and docs/PLANNER-ONBOARDING-FLOW.md. */
const CANONICAL_SPINE = [
  'schedule',
  'travel',
  'website',
  'guest-list',
  'rsvps',
  'rooms',
  'vendors',
  'registry',
  'photos',
];

const MIN_DISTINCT_PERSONAS = 5;

const SCENARIO_DIR = join(__dirname, 'scenarios');

interface ScenarioTurn {
  message?: string;
  confirm?: 'approve' | 'decline';
  expect?: Record<string, unknown>;
  verify?: unknown;
}

interface Scenario {
  name: string;
  description: string;
  persona?: string;
  spine?: string;
  spineSteps?: string[];
  seed: string;
  turns: ScenarioTurn[];
}

async function loadScenarios(): Promise<Array<{ file: string; scenario: Scenario }>> {
  const files = readdirSync(SCENARIO_DIR).filter((f) => f.endsWith('.mjs')).sort();
  const loaded: Array<{ file: string; scenario: Scenario }> = [];
  for (const file of files) {
    const mod = await import(join(SCENARIO_DIR, file));
    loaded.push({ file, scenario: mod.default as Scenario });
  }
  return loaded;
}

describe('agent-eval scenario coverage', () => {
  it('every scenario is well-formed and declares a persona', async () => {
    const all = await loadScenarios();
    expect(all.length).toBeGreaterThan(0);

    for (const { file, scenario } of all) {
      expect(scenario?.name, `${file}: name`).toBeTruthy();
      expect(scenario?.description, `${file}: description`).toBeTruthy();
      expect(['blank', 'populated'], `${file}: seed`).toContain(scenario?.seed);
      expect(Array.isArray(scenario?.turns) && scenario.turns.length > 0, `${file}: turns`).toBe(true);
      for (const [i, turn] of scenario.turns.entries()) {
        const hasMessage = typeof turn.message === 'string' && turn.message.length > 0;
        const hasConfirm = turn.confirm === 'approve' || turn.confirm === 'decline';
        expect(hasMessage || hasConfirm, `${file}: turn ${i + 1} needs message or confirm`).toBe(true);
      }
      // Persona ids come from docs/AGENT-EVALS.md §3 (P1–P10) / §4 (E1–E10).
      expect(scenario?.persona, `${file}: missing persona tag`).toMatch(/^[PE](10|[1-9])$/);
    }
  });

  it(`covers at least ${MIN_DISTINCT_PERSONAS} distinct personas`, async () => {
    const all = await loadScenarios();
    const personas = new Set(all.map(({ scenario }) => scenario.persona));
    expect(
      personas.size,
      `personas covered: ${[...personas].sort().join(', ')} — add fixtures, don't retag existing ones`,
    ).toBeGreaterThanOrEqual(MIN_DISTINCT_PERSONAS);
  });

  it('always contains a full-spine walkthrough in the canonical order', async () => {
    const all = await loadScenarios();
    const fullSpine = all.filter(({ scenario }) => scenario.spine === 'full');
    expect(fullSpine.length, 'need ≥1 scenario with spine: "full"').toBeGreaterThanOrEqual(1);

    for (const { file, scenario } of fullSpine) {
      expect(scenario.spineSteps, `${file}: full-spine scenario must declare spineSteps`).toEqual(CANONICAL_SPINE);
      expect(
        scenario.turns.length,
        `${file}: a full-spine walkthrough needs at least one turn per major step`,
      ).toBeGreaterThanOrEqual(CANONICAL_SPINE.length);
    }
  });

  it('spine order in the system prompt matches the canonical order', async () => {
    const { AGENT_SYSTEM_PROMPT } = await import('@/lib/agent/system-prompt');
    // The dependency-order line: assert each step appears, in order.
    const probes: Array<[step: string, pattern: RegExp]> = [
      ['schedule', /schedule\/events/i],
      ['travel', /travel, stay/i],
      ['website', /website \+ FAQs/i],
      ['guest-list', /guest list/i],
      ['rsvps', /RSVPs/],
      ['rooms', /rooms/i],
      ['vendors', /vendors & venue/i],
      ['registry', /registry/i],
      ['photos', /photos/i],
    ];
    let cursor = 0;
    for (const [step, pattern] of probes) {
      const idx = AGENT_SYSTEM_PROMPT.slice(cursor).search(pattern);
      expect(idx, `system prompt: "${step}" missing or out of order (after position ${cursor})`).toBeGreaterThanOrEqual(0);
      cursor += idx + 1;
    }
  });
});
