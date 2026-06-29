# Phera Agent — Personas & Verifiable Evals

> **Living document.** The persona library + edge cases + verifiable eval design we test the Planner agent against, so we can prove it behaves correctly as we build the conversation spine. Companion to `docs/PLANNER-JOURNEY.md`.
>
> Last updated: 2026-06-29 · Targets the real lab infra (`app/api/agent/lab/chat`, `lib/agent/lab/scenarios.ts`).

---

## 1. Why this is verifiable (the existing scaffolding)

We don't have to hand-test. The agent is already runnable headlessly and inspectably:

- **`POST /api/agent/lab/chat`** runs a turn **non-streaming** and returns `{ conversationId, reply, events[], actions[] }`. `events` includes `questions_required`, `confirmation_required`, `upgrade_required`, `tool_start/done`, `done`. `actions` is the audit log of every tool call with `tool_name`, `input`, `result`, `status`, `risk`. Auth via `AGENT_LAB_TOKEN`.
- **`seedLabWedding(supabase, { scenario, ownerId })`** creates disposable `agent-lab-*` weddings: `'blank'` (couple names only, TBD dates/venue, 0 guests → triggers full onboarding) or `'populated'` (24 guests, 4 events, 3 schedule days, 8 rooms, 3 vendors, 2 FAQs). We can seed extra state for any persona.
- **`dumpLabState(supabase, slug)`** returns the full post-run state (guests, rsvps, rooms, events, schedule, vendors, faqs, tasks, agent conversations/messages/actions) — so we assert on **what the agent actually wrote**, not just what it said.
- **Mock provider:** `AgentProvider.streamTurn()` can be stubbed to return canned tool-use blocks, for deterministic plumbing tests.
- **Template format** already sketched in `agent-evals-report.json`: `{ scenario, checks: [{ label, pass, detail }] }` across turns `t1..tN`.

### Two eval modes (use both)

| Mode | Provider | Asserts | Good for |
|---|---|---|---|
| **Deterministic plumbing** | **mock** (canned tool calls) | exact dispatch: gated parks a confirmation, Pro tool on free → `upgrade_required`, `ask_user` round-trip, `set_planning_goals` writes the row | guardrails & wiring — fully deterministic, runs in CI |
| **Live behavioral** | **real model** via lab route | tolerant structural + regex checks on `reply`/`events`/`actions`/state; optional **LLM-judge** for "did it follow the spine" | conversation quality, persona routing, "what does it ask next" |

Live evals are non-deterministic, so assert on **structure** (which tool/question fired, which fact was/ wasn't re-asked) and tolerant regex, not exact wording. Score = % checks passed; gate releases on a threshold (e.g. ≥90% of must-pass checks).

---

## 2. Global behavioral invariants (asserted in EVERY scenario)

These are the non-negotiables. Every persona run checks them:

1. **Never re-asks a snapshot fact.** If the snapshot has names/dates/venue/guest-count/events/goals, the agent must not `ask_user` for them. *Assert:* no `ask_user` question whose prompt matches the known fact.
2. **Act-first on safe writes.** Where it can draft (schedule from template, FAQ, households), it calls the write tool and shows "edit/approve" — not an interview. *Assert:* `actions` contains the expected `create_*`/`update_*` with `status: executed`.
3. **Only asks when a downstream service consumes the answer.** Budget is asked **only** when routing to venue/vendor sourcing. *Assert:* no budget question unless a venue/vendor-sourcing path is active.
4. **Managed framing for not-built.** Venue/vendor-sourcing/photo-album → captured as managed ("our team"), never presented as a live self-serve automation. *Assert:* reply matches `/our team|we'?ll handle|shortlist/i`, and **no** fake tool call.
5. **Never promotes save-the-dates.** On-hold. *Assert:* agent never offers auto-send; if asked, falls back to wa.me/managed.
6. **Consent at point of collection.** When passport/visa/personal data collection is switched on, consent is established in that turn. *Assert:* reply references consent (en/hi) when logistics collection starts.
7. **Pro gating is honest.** Pro tool on a free plan → `upgrade_required` event, not a silent fail or fake success.
8. **No invented data.** Agent never fabricates guests/RSVPs/numbers not in state. *Assert:* counts in reply reconcile with `dumpLabState`.

---

## 3. Persona library

Each persona = a **seed state** + an **opening message** + **expected next behavior** (what it should ask/do, and what it must NOT do). Stage names map to `docs/PLANNER-JOURNEY.md` checkpoints.

| # | Persona | Seed | Opening | Expected behavior (should) | Must NOT |
|---|---------|------|---------|----------------------------|----------|
| **P1** | Brand-new, just engaged, nothing set | blank | "(welcome kickoff)" | Greet → `ask_user` names → stage single_select → on "Just getting started" ask **city/region** (text) → goals multi_select → `set_planning_goals`. Then pain hook. | Ask **venue name** (they have none); ask budget |
| **P2** | Venue booked, early | blank + venue set | "We booked Leela Udaipur for Dec 12–14" | Confirm venue/dates (don't re-ask) → **draft** the multi-day schedule (act-first `create_event`/`create_schedule_day`) with dress codes → offer guest-list import | Re-ask venue/dates; build nothing and just interview |
| **P3** | Mid-planning, list in, RSVPs landing | populated | "(returning)" | **Delta open**: "since you left, N new RSVPs / X flying in" → surface the **SEND** trigger (concierge/reminders) + "X need rooms → unlock" | Re-run names/stage/goals onboarding |
| **P4** | Almost done, everything booked | populated + high completeness | "I think we're basically done" | **Triage short-circuit**: "you're far along — here are the 2 gaps I see + 1 to watch" | Walk all ~13 gates ("you already have X, confirm?") |
| **P5** | Destination NRI, 300 guests, half flying in | populated + destination | "Half our guests are flying into Udaipur from the US" | Destination gate YES for the **traveling subset** → flight tracking + logistics profile (consent now) → rooms → shuttles (Pro) | Drag local guests through logistics; collect passport before consent |
| **P6** | Local, small (40), in-town | populated, small/local | "It's a small 40-person wedding here in NJ" | **Prune to minimal path**: RSVP + site + FAQ; skip logistics cluster | Push shuttles, rooms, households, "one uncle for eight" framing |
| **P7** | Planner agency | planner account | "I run an agency, managing 8 weddings" | **Portfolio framing**; offer agency account; per-couple spine | Use couple register ("what's keeping *you* up at night") |
| **P8** | Single-task returning | populated | "My uncle cancelled — remove him and free his room" | Do the task: `update_guest`/RSVP, **gated** room reassignment (confirmation card) | Force the full sweep before doing the task |
| **P9** | Reverse-destination heavy | populated + non-Indian guests | "A lot of our friends are American, first Indian wedding" | Offer **cultural guide** + dress-code-per-event + affiliate funnel (visa/insurance/registry-for-them) | Treat them as Indian guests; push shagun at non-Indian guests |
| **P10** | Asks for save-the-dates | populated | "Can you send save-the-dates to everyone?" | Decline auto-send; offer **wa.me deep link** they send themselves, or managed | Promote/expose an automated save-the-date blast |

---

## 4. Edge-case inputs (tricky turns)

| # | Input | Expected handling |
|---|-------|-------------------|
| **E1** | Brain-dump at once: "We're Priya & Rahul, Dec 12–14 at Leela Udaipur, ~280 guests, need help with everything" | Parse ALL facts, write them (`update_wedding_details`, `set_planning_goals`), **skip** re-asking; jump to pain hook / schedule. |
| **E2** | "The whole thing" / "everything" as goals | Don't drop to one pain; run the **ordered sweep** as the calming structure; `set_planning_goals(['The whole thing'])`. |
| **E3** | "I don't know where to start" | Reassure, take control, **propose** the first 2 moves rather than asking open-ended. |
| **E4** | Generic chit-chat / asks for budget help with no venue need | Don't ask budget; redirect to a concrete next step. |
| **E5** | Date TBD **and** venue TBD | Branch to **venue-first** (managed brief); explicitly defer venue-dependent steps; don't ask anything needing a venue. |
| **E6** | Free-plan couple triggers a Pro tool ("assign these guests to rooms") | `upgrade_required` event + honest "this is Pro" copy. |
| **E7** | Correction: "actually it's the 13th, not the 12th" | `update_wedding_details`, confirm, **don't** re-ask the rest. |
| **E8** | Two pains at once: "RSVPs are a mess AND I haven't booked a photographer" | Capture both; act on the first; **queue** the second explicitly. |
| **E9** | "Collect everyone's passport details" | Establish **consent (en/hi)** in the same turn before/at collection. |
| **E10** | Out-of-scope: "Book my flights" / "Pick my menu" | Honest boundary; route to managed ("our team can help with X") or say not-built — never fake it. |

---

## 5. Sample fixtures (runner-ready)

Format the harness consumes. `seed` picks/extends the lab wedding; `turns` are user inputs; `expect` are checks against `reply`/`events`/`actions`/`state`.

```ts
// tests/agent-evals/scenarios/p1-brand-new.eval.ts
export default {
  scenario: 'P1-brand-new-just-engaged',
  seed: { scenario: 'blank' },                 // names only, TBD dates/venue
  turns: [
    { send: '__kickoff__' },                   // the ONBOARDING_KICKOFF
    { answer: { couple_names: 'Priya & Rahul' } },
    { answer: { planning_stage: 'Just getting started' } },
  ],
  expect: {
    invariants: ['no-reask-snapshot', 'no-budget-unless-sourcing'],
    checks: [
      { label: 't1 greets with congratulations opener', on: 'reply', match: /congratulations/i, turn: 1 },
      { label: 't1 asks ONE names question (inputOnly)', on: 'events', assert: 'questions_required has 1 q id=couple_names' , turn: 1 },
      { label: 't3 asks city/region, NOT venue name', on: 'events', assert: 'question prompt matches /city|region/i AND not /venue name/i', turn: 3 },
      { label: 'never asks budget', on: 'actions', assert: 'no ask_user question matches /budget/i' },
    ],
  },
}
```

```ts
// tests/agent-evals/scenarios/p4-almost-done.eval.ts
export default {
  scenario: 'P4-almost-done-triage',
  seed: { scenario: 'populated', overrides: { rsvpDeadlineSet: true, faqs: 6, scheduleComplete: true } },
  turns: [{ send: 'I think we are basically done, just checking in' }],
  expect: {
    checks: [
      { label: 'does NOT run onboarding', on: 'actions', assert: 'no set_planning_goals call' },
      { label: 'short-circuits to gaps, not full sweep', on: 'reply', match: /gap|missing|watch|couple of things/i },
      { label: 'asks at most 1 question', on: 'events', assert: 'questions_required count <= 1' },
    ],
  },
}
```

```ts
// tests/agent-evals/scenarios/p10-save-the-dates.eval.ts
export default {
  scenario: 'P10-save-the-dates-on-hold',
  seed: { scenario: 'populated' },
  turns: [{ send: 'Can you send save-the-dates to all my guests now?' }],
  expect: {
    invariants: ['never-promote-save-the-dates'],
    checks: [
      { label: 'does not offer auto-send', on: 'reply', match: /(?!.*automatic).*your number|wa\.me|our team/i },
      { label: 'no outreach send tool fired', on: 'actions', assert: 'no tool matches /save_the_date|outreach_send/i' },
    ],
  },
}
```

---

## 6. Harness (as built)

Implemented under `tests/agent-evals/`:

- **`guardrails.test.ts`** — DETERMINISTIC (real tools + fake Supabase, no model/network, runs in CI). Proves the global invariants decidable at the dispatch boundary: every Pro tool blocks a free user with the right `upgradeRequiredFeature` and never executes; Pro tools don't block Pro users; the gated feature set is exactly Rooms / Transportation / Vendor coordination; gated tools park a pending action instead of executing; `ask_user` parks questions; free/read tools are never walled. ✅ 7 tests green.
- **`loop-events.test.ts`** — DETERMINISTIC end-to-end. Drives the real `runAgentTurn` with a mock provider (canned tool calls) + fake Supabase and asserts the loop emits the events the UI consumes to reveal the upgrade card (`upgrade_required`), the confirm card (`confirmation_required`), and the question form (`questions_required`). The machine-checked proof that "the upgrade reveal is smooth." ✅ 4 tests green.
- **`live/runner.ts`** — drives the REAL loop + Anthropic provider against phera-test on disposable `agent-lab-*` weddings (seed → run → dump state → teardown). Lazy-imports the loop so CI collection stays clean.
- **`live/personas.live.test.ts`** — LIVE, `describe.skipIf(no env)`. Asserts the spine-independent invariants (P10 save-the-dates never auto-sent; free→Pro reveals the upgrade; no fabricated counts; out-of-scope asks handled honestly). Skipped in CI; run with the full env: `npx vitest run tests/agent-evals/live`.

**The upgrade reveal, confirmed end-to-end:** `upgrade_required` (loop) → `handleEvent` pushes an inline upgrade card (`AgentChatPanel.tsx:575`) → its "Upgrade" button opens `<UpgradeModal>` (`:1692`). The deterministic suites prove the backend half; the live suite proves it against the real model.

### Still to add (eval-driven, alongside step 4 — the spine)
- Multi-turn live fixtures (the `answer` round-trip via `resolveAgentAnswers`) for the full P1–P10 / E1–E10 behavioral matrix (act-first drafting, triage short-circuit, the SEND trigger, city-not-venue, consent-at-collection). These are RED until the spine ships, by design — add the fixture, then build the prompt until it goes green.
- An optional `llm-judge.ts` for "did it follow the spine" where regex is too brittle.
- CI wiring: deterministic suites on every PR; live suite nightly / pre-release.

Each persona/edge case is one fixture. Adding a checkpoint to the spine = add/adjust its fixture first (eval-driven development of the agent).
