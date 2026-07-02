# Phera Planner — Onboarding Flowchart

**The gate:** If `Planning goals = NOT SET` → run onboarding. Otherwise → skip to ongoing help.

## Order of operations (one beat at a time)

```
1. GREET + ask NAMES
        ↓
2. ask STAGE ("where are you in planning?" — multi-select)
        ↓
3. BRANCH on stage → targeted follow-ups only for what that stage needs
     • Venue booked   → venue name + dates
     • Just starting  → city/region (offer suggestions)
     • Invites sent   → RSVP readiness
     (conflicting picks → follow the most-advanced one)
        ↓
4. ask GOALS ("what do you want help with?") → call set_planning_goals
   [goals now SET — onboarding done]
        ↓
5. ACT across the wedding in dependency order:
   schedule/events → website+FAQs → guest list (+households/liaisons)
   → RSVPs → travel/logistics (only if guests fly in) → rooms
   → shuttles → guest comms → vendors/venue → registry → photos
```

## Ask vs. Do

- **Ask** only for: names, stage, goals, and genuine judgment calls (aesthetics / budget / family).
- **Do** (act-first, "here's a draft — change anything?"): draft schedule, seed FAQs, propose household groupings; safe writes auto-execute. Gated confirmation only for destructive / bulk / outbound actions.

## How it keeps them on track (4 mechanisms)

1. **Forced sequence** — can't advance until goals are set.
2. **Wedding snapshot every turn** — a live done / not-done checklist; skips finished items, never re-asks.
3. **Planning goals = north star** — focuses on what they asked for; offers extras one at a time, easy to decline.
4. **Read-before-answer + ruthless brevity** — 1–2 sentences, one question at a time. On a tangent: answer it, then nudge back to the next relevant step. Never dismisses, never pressures.

**One-liner:** fixed 4-step intro → then walk the dependency chain, always knowing what's done (snapshot) and what they want (goals), one short beat at a time.

---

## Reference

- System prompt: `lib/agent/system-prompt.ts`
- Wedding snapshot / context: `lib/agent/context.ts`
- Goals tool (`set_planning_goals`): `lib/agent/tools/goals.ts`
- Onboarding entry: `app/api/agent/onboard/start/route.ts`, `app/onboarding/page.tsx`
