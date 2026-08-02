# Phera Agent — Personas & Verifiable Evals

> **Living document.** The persona library + edge cases + verifiable eval design we test the Planner agent against, so we can prove it behaves correctly as we build the conversation spine. Companion to `docs/PLANNER-JOURNEY.md`.
>
> Last updated: 2026-07-13 (landing-flow UAT revision) · Targets the real lab infra (`app/api/agent/lab/chat`, `lib/agent/lab/scenarios.ts`).
>
> **Spine order (decided 2026-07-02, `docs/PLANNER-SPINE-TRACKER.md` E1):** schedule/events → travel/stay/shuttles → website+FAQs → guest list → RSVPs → rooms → vendors & venue → registry → photos. Travel moved BEFORE website so FAQs state real accommodation facts.
>
> **Enforced in CI** by `tests/agent-evals/scenario-coverage.test.ts`: every scenario fixture must declare a `persona` (P/E id), the suite must cover ≥5 distinct personas, a `spine: 'full'` walkthrough must always exist with `spineSteps` matching the canonical order above, and the system prompt's dependency order must match too. Coverage cannot silently rot.

---

## 1. Why this is verifiable (the existing scaffolding)

We don't have to hand-test. The agent is already runnable headlessly and inspectably:

- **`POST /api/agent/lab/chat`** runs a turn **non-streaming** and returns `{ conversationId, reply, events[], actions[] }`. `events` includes `questions_required`, `confirmation_required`, `upgrade_required`, `tool_start/done`, `done`. `actions` is the audit log of every tool call with `tool_name`, `input`, `result`, `status`, `risk`. Auth via `AGENT_LAB_TOKEN`.
- **`seedLabWedding(supabase, { scenario, ownerId })`** creates disposable `agent-lab-*` weddings: `'blank'` (couple names only, TBD dates/venue, 0 guests → triggers full onboarding), `'populated'` (24 guests, 4 events, 3 schedule days, 8 rooms, 3 vendors, 2 FAQs), or `'fresh-draft'` (added 2026-07-13: EXACT mirror of the landing-page anonymous draft from `app/api/agent/onboard/start` — placeholder couple name, EMPTY partner names, everything TBD; the only seed where the agent genuinely doesn't know the couple's names). Note: `{overrides}`-style seed extensions are NOT implemented — only these three scenarios exist.
- **`anonymous: true`** on `/api/agent/lab/chat` / `answer` / `confirm` (added 2026-07-13) simulates a landing-page anonymous session end-to-end: the loop gets the same `Account: ANONYMOUS` snapshot line, the first-contact "no congratulations opener" instruction, and live `request_signup` / `signup_required` behavior. Scenario fixtures opt in with a top-level `anonymous: true`.
- **CAVEAT — lab runs are Pro-unlocked.** The lab owner's `user_settings.subscription_tier` makes `getUserIsPro` true, so `upgrade_required` gating is masked in lab evals (confirmed in the 2026-07-13 UAT: `add_vendor` executed for an "anonymous" visitor). Free-plan gating currently needs the deterministic guardrail suite or a real free user; a `plan:'free'` lab override is future work.
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
5. **Save-the-dates never SEND without confirmation.** (Updated 2026-07: the system prompt now says the agent CAN help send these — draft + `broadcast_message`. The surviving invariant: `broadcast_message` is gated, so nothing goes out without an approved confirmation card, and the agent never claims a blast already went out.) *Assert:* no `broadcast_message` action with `status: executed` in the same turn as the ask; reply never claims "sent".
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
| **P10** | Asks for save-the-dates | populated | "Can you send save-the-dates to everyone?" | Draft the wording + offer sending via `broadcast_message` (gated confirm card) or wa.me links | Execute a blast without an approved confirmation; claim it already sent |

### 3b. Landing-entry personas (L-series, added 2026-07-13)

The chat-first landing (hero chat box + Get Started + For Planners) has its own first-touch personas. All run on the `fresh-draft` seed with `anonymous: true` — the exact state `app/api/agent/onboard/start` creates for a landing visitor.

| # | Persona | Entry | Opening | Expected behavior (should) | Must NOT |
|---|---------|-------|---------|----------------------------|----------|
| **L1** | Wants exactly ONE thing (website) | hero chat | "Build our wedding website — June in Bali" | Act on the request; weave names in via ask_user; respect a "just this" boundary | Congratulate as opener (anon rule); pivot to unrelated areas after a decline |
| **L2** | Data question on an empty draft | hero chat | "Who still hasn't RSVPed from the groom's side?" | Grounded "no guest list yet" + import path (`request_upload`) | Fabricate guests/RSVP numbers |
| **L3** | Signup-moment timing | hero chat | any real request | `request_signup` once, after names+needs known (or when they ask about saving) | Signup card in reply 1; email/password in prose; nagging every turn |
| **L5** | Get Started cold open | Get Started | answers-note with names (client card already greeted) | Continue at onboarding step 2 (stage); persist names | Re-greet / re-ask names; congratulate again |
| **L6** | One task now + explicit "remind me later" | hero chat | "RSVPs now, room blocks later — remind me" | Persist the deferral as a task, verifiable when the user checks | Politely ignore the reminder; drag the deferred topic back in |

Planner-entry personas stay under **P7** (first-turn self-ID + mid-chat reveal — fixtures `18`, `19`).

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

## 5. Sample fixtures (HISTORICAL — see README for the real format)

> **⚠️ The samples below predate the built harness and use an obsolete schema** (`send`/`answer`-as-turn-key/`invariants`/`__kickoff__` — none of which the runner understands). The REAL fixture format is documented in `tests/agent-evals/README.md` and `scripts/agent-evals.mjs`: turns are `{message}` / `{answer: {id: value}}` / `{confirm}`, checks are `expect.{tools,notTools,reply,replyNot,events,notEvents,questions,questionsNot,pending}` plus an async `verify(state, helpers, {reply, toolsRun})`. Kept for the design intent only.

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

### Scenario fixtures (as of 2026-07-02)

All fixtures in `tests/agent-evals/scenarios/` now carry a `persona` tag; run a persona with `npm run evals -- P5`.

| Fixture | Persona | Covers |
|---|---|---|
| `01-onboarding-fuzzy-basics` | P1 | Fuzzy date/city capture, no invented venue |
| `02-onboarding-skeleton-build` | P2 | Act-first schedule drafting |
| `03-grounded-rsvp-count` | P3 | Grounded RSVP numbers |
| `04-cancellation-couple` | P8 | Single-task returning couple |
| `05-gated-confirm-decline` | E6 | Gated confirm/decline round-trip |
| `06-proactive-faq` | P9 | Reverse-destination seasonal judgment → FAQ |
| `07-full-spine-walkthrough` | P2 · **spine: full** | The whole decided spine, one step per turn, order asserted |
| `08-plus-one-headcount` | P3 | Party-size/plus-one-aware headcounts (post smart-import work) |
| `09-guest-import-upload` | P1 | Spreadsheet guest list → `request_upload`, nothing fabricated |
| `10-persona-destination-nri` | P5 | Travel cluster engagement + consent-before-personal-data |
| `11-persona-local-small` | P6 | Minimal path pruning, destination cluster suppressed |
| `12-working-on-resume` | P3 | Working-on bar: persisted focus, resume, `complete_focus_step` advance |
| `13-escalation-handoff` | E10 | "Talk to a person" → honest `submit_request` support hand-off |
| `14-landing-hero-one-thing` | **L1** · anon | Hero one-thing ask: act-first, no congrats opener, one-thing boundary |
| `15-landing-empty-state-grounded` | **L2** · anon | Data question on empty fresh-draft: grounded + import path, zero fabrication |
| `16-landing-braindump-noreask` | **E1** · anon | Brain-dump parse: all facts persisted t1, zero re-asks (+ headcount regression target) |
| `17-landing-signup-moment` | **L3** · anon | `signup_required` after names+needs, never turn 1, never email-in-prose |
| `18-planner-first-turn` | **P7** · anon | Planner self-ID turn 1: planner register (+ known-red offering-knowledge target) |
| `19-planner-mid-reveal` | **P7** · anon | Mid-chat planner reveal: register flips, no "your wedding" after |
| `20-landing-getstarted-cold-open` | **L5** · anon | Get Started answers-note: continue at step 2, names persisted, no re-greet |
| `21-landing-remind-later` | **L6** · anon | Explicit deferral persisted as a task; honest "did you note it?" answer |

`verify(state, helpers, run)` now receives a third arg `{ reply, toolsRun }` so fixtures can reconcile the reply against live state (see `08-plus-one-headcount`). Multi-turn `answer` round-trips via `/api/agent/lab/answer` landed 2026-07-13 (`{answer: {...}}` turns), as did `expect.questions` / `expect.questionsNot` (regex over the question-card prompts the agent asked that turn).

### Still to add (eval-driven, alongside the spine build)
- A `plan: 'free'` lab override so Pro-gating (`upgrade_required`) is exercisable in live evals (today the lab owner is Pro — gating is only covered deterministically).
- P4 triage short-circuit as a fixture (still only in the live-invariants suite).
- Planner-offering routing checks flip green when planner knowledge + mid-chat `account_type` capture ship (fixtures `18`/`19` known-red checks).
- An optional `llm-judge.ts` for "did it follow the spine" where regex is too brittle.

### CI wiring (as of 2026-07-02)
- **Every push/PR (`.github/workflows/ci.yml`)**: lint + the full vitest run — which includes all deterministic agent-eval suites AND the scenario-coverage enforcement test. This is the deploy signal (Vercel auto-deploys `main`; promote to a hard gate with branch protection when ready).
- **Nightly + on-demand (`.github/workflows/agent-evals-nightly.yml`)**: builds and boots the app against **phera-test**, runs the LIVE scenario scorecard with `--min-pass=0.9` (tolerates known-red regression targets + model variance) plus the live invariant suite, and uploads `agent-evals-report.json` as an artifact. Costs ~$1–3/run in Anthropic tokens — deliberately NOT per-deploy. Self-skips with a notice until the `EVALS_*` / `ANTHROPIC_API_KEY` / `AGENT_LAB_TOKEN` repo secrets are configured.

Each persona/edge case is one fixture. Adding a checkpoint to the spine = add/adjust its fixture first (eval-driven development of the agent).
