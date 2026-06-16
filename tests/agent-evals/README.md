# Agent Evals

Replayable conversation scenarios that score the planner agent against real
model behavior: which tools it calls, what it says, whether gated actions
park for confirmation, and whether the database actually mutated.

**These are a quality scorecard, not CI.** Every run seeds disposable
`agent-lab-*` weddings, talks to the live agent (real Anthropic tokens,
roughly $0.50–1.50 per full run), and tears them down.

## Running

```bash
npm run dev                 # in one terminal (lab API must be up)
npm run evals               # all scenarios
npm run evals -- gated      # name filter
npm run evals -- --keep     # keep lab weddings for inspection in /agent-lab
npm run evals -- --strict   # exit non-zero on failures (pre-release gate)
```

Requires `AGENT_LAB_TOKEN` in `.env.local`. Results print as a scorecard and
are written to `agent-evals-report.json` (gitignored).

## Writing a scenario

One file per scenario in `scenarios/`, default-exporting:

```js
export default {
  name: 'my-scenario',
  description: 'one line',
  seed: 'blank' | 'populated',
  turns: [
    {
      message: 'what the couple says',
      expect: {
        tools: ['record_rsvp'],        // tools that MUST have run this turn
        notTools: ['delete_guest'],    // tools that must NOT have run
        reply: ['regex', '204'],       // reply must match each (case-insensitive)
        replyNot: ['admin UI'],        // reply must match none
        pending: true,                 // a confirmation must (not) be parked
      },
      // Optional DB assertions against the post-turn state dump:
      verify: async (state, h) => [
        { label: 'raj is out', pass: h.rsvpFor(state, 'Raj Mehra')?.attending === 'no' },
      ],
    },
    { confirm: 'approve' },            // resolves the oldest parked confirmation
  ],
};
```

Helpers: `h.guest(state, name)`, `h.rsvpFor(state, name)`, `h.room(state, number)`.

## Philosophy

- **Failures are information.** Known gaps stay in scenarios as desired
  behavior (e.g. a cancelling couple where the +1 has her own guest row) so
  the scorecard shows honestly where the agent stands.
- **Every real conversation that goes wrong becomes a scenario.** That is
  the learning flywheel: lab transcript → eval → prompt/tool fix → green.
- Run before/after any change to `lib/agent/system-prompt.ts`, tool
  descriptions, or the model setting.
- **Expect some variance.** The model may reasonably ask a clarifying
  question where a scenario expected an immediate action (seen on
  `gated-confirm-decline`: 4/7 then 10/10 on rerun). A single red check is
  a data point; a check that fails across reruns is a regression. When a
  scenario flakes on defensible behavior, loosen the scenario, not the agent.
