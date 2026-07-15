# Agent UAT Playbook — the full end-to-end loop

This is how to test the Phera agent **the way a real couple experiences it**: not
by poking the API, but by driving the actual browser UI — clicking the forward
button, landing on the real section screen, *actually* creating the site /
uploading a floor plan / uploading a guest list, tagging, coming back, and only
being satisfied when the agent notices what changed and hands the wheel back.

The automated evals (`scripts/agent-evals.mjs`) and the production persona
harness are a fast approximation, but they **simulate** the "couple did work in
the UI" step with a direct DB write (`/api/agent/lab/patch`). They never click
the button or load the section screen. This playbook is the real thing — run it
when you need to be *sure* the whole loop holds, screen to screen.

> Rule of thumb: an eval proves the **agent half** of the loop (button emitted →
> delta detected → published). Only a click-through proves the **UI half** (the
> button navigates, the screen loads, the upload ingests, the edit saves).

---

## What "done" means — the satisfied-customer bar

For **every** section loop, all of these must be true before you call it passing:

1. **Forwarded, not lectured.** Asking for the section produces a **button**
   ("Open website →", "Open guest list →", "Open room assignments →"), never a
   pasted link and never the agent trying to do the work in chat.
2. **The button actually navigates** to the real screen
   (`/admin/{slug}/details`, `/admin/{slug}/guest-list`,
   `/admin/{slug}/room-assignments`) — not a 404, not a dead link.
3. **Context carried through.** Whatever was gathered in chat (names, dates,
   venue) is already filled in on the screen.
4. **Real work sticks.** What you create/upload/tag on the screen saves and is
   visible on reload (and in the DB).
5. **Coming back, the agent SEES it.** It names what changed ("your core details
   are all in", "214 guests added, 96 tagged", "12 rooms placed") — it does
   **not** ask "did you finish?".
6. **The loop closes with the wheel handed back.** After the section is
   finished (or the site is published), the agent asks **"Anything else I can
   help with?"** and offers the **full menu** of what it can do next — Wedding
   website · Save the dates · Collect RSVPs · Guest list · Room assignments ·
   Transportation & travel · Vendor coordination · Registry · Day-of schedule ·
   plus "No, I'm all set". Trimmed to what's genuinely left, natural next step
   first. This is the moment the customer feels taken care of instead of
   railroaded.

If any of the six fails, the loop is not passing — note which one.

---

## Setup

1. **Dev server:** `npm run dev` (wait for "Ready"). The lab routes work in dev
   with **no token** (session mode); in prod they 404 by design.
2. **Browser:** Claude-in-Chrome. Load the core tools in ONE `ToolSearch`
   (`tabs_context_mcp, navigate, computer, read_page, tabs_create_mcp, find,
   browser_batch`). If the extension drops mid-run, wait ~20s and re-call
   `tabs_context_mcp` — it usually reconnects the same tab.
3. **Open** `http://localhost:3000/agent-lab`, pick **Blank (onboarding)**, click
   **Create lab wedding**. The slug (e.g. `agent-lab-xxxx`) is shown and persisted
   in localStorage. Tear down at the end with **Tear down**, or
   `DELETE /api/agent/lab/seed?weddingSlug={slug}` with the `AGENT_LAB_TOKEN`.

### Onboarding (blank wedding, once per run)

The blank scenario opens the client-scripted intake — answer the cards on the
right: **Names** (type "Anjali & Rohan" → Done) → **Stage** (tap "Venue booked"
→ Done) → **Venue** ("Rambagh Palace, Jaipur" → Next) → **Dates** (pick a range
→ Done) → **Goals** ("What would you like help with?" — tap "Wedding website" →
Done). The goal you pick kicks off the first loop.

---

## Loop 1 — Website (create + publish)

1. Finish onboarding with **Wedding website** as the goal (or later just say
   "build our website").
2. **Expect:** an "Opening the right section — Opened Website" receipt and a
   **Website** card with an **"Open website →"** button and "Come back when
   you're done — this conversation stays right here."
3. **Click "Open website →".** You land on `/admin/{slug}/details`. Confirm the
   couple names, dates, and venue from onboarding are **already filled in**.
4. **Do the work:** type a **Welcome Message** (the one field onboarding leaves
   blank). Watch the live phone preview update. Blur the field so it autosaves.
5. **Go back** to `/agent-lab` (slug persists) and say *"I've filled the website
   in. How does it look?"*
6. **Expect detection:** "Nice work — your core details are all in and the site's
   looking ready to go live," then a **publish** single_select (NOT "did you
   finish?").
7. Say **yes / take it live** → a **Confirm** card parks (`publish_website` is
   gated) → approve it → the site goes **live** and a **link** card appears
   (`phera.io/{slug}`), copyable.
8. Optionally test **undo**: "put it back to draft" → `undo_last_action` restores
   draft + the unpublished flag.
9. **Expect LOOP CLOSE:** once the invite question is settled, the agent asks
   **"Anything else I can help with?"** with the full menu (website dropped —
   it's live).

**Verify in DB (read-only):**
`GET /api/agent/lab/state?weddingSlug={slug}` → `wedding.welcome_text` holds what
you typed; after publish `wedding.status === 'live'`.

---

## Loop 2 — Guest list (upload + tag)

1. Say *"Sort our guest list — I want to add and tag everyone."*
2. **Expect BOTH doors:** an **"Open guest list →"** button **and** an **"Upload
   your guest list"** card (sample column layout + "Upload guest list" button).
3. **Path A — click through:** click "Open guest list →" → land on
   `/admin/{slug}/guest-list` → **Add Manually** or **Import Guests**, then tag
   guests by side/family/plus-one on the real screen.
4. **Path B — upload:** use the upload card with a fixture (below). The importer
   maps messy columns automatically — `guest-list-150.csv` is deliberately messy
   (headers like "Full Name", "Mobile", "Plus One") to exercise that.
   - ⚠️ **Browser-tool caveat:** the `file_upload` MCP tool changed and may
     reject host paths ("no longer accepts host filesystem paths"). If so, upload
     via Path A's manual add, or drive the import in code
     (`importGuestsFromFile`), and note it — it is a **tooling** limit, not an
     app bug. The upload **card rendering** is still verified visually.
5. **Go back** and say *"Done — everyone's in."*
6. **Expect detection:** it names the count and tags ("214 guests added, 96
   tagged"), asks "happy with it?" → on yes calls `finish_section`.
7. **Expect LOOP CLOSE menu.**

**Fixtures:**
- `sample-guest-list.csv` — 5 clean columns (Name, Email, Phone, Side, Tag).
- `mock-data/guest-list-150.csv` — 150 guests, messy headers, plus-ones, party
  sizes, notes. Use this to test column mapping + scale.

**Verify:** `state.guests.length` climbs; tagged guests carry
`logistics_data.tags`.

---

## Loop 3 — Rooms (upload a floor plan + place guests)

1. Seed **Populated** (or add guests first — rooms need people to place). Say
   *"Put everyone into their hotel rooms."*
2. **Expect BOTH doors:** an **"Open room assignments →"** button **and** an
   **"Upload your hotel floor plan"** card.
3. **Upload the floor plan fixture:** `mock-data/hotel-floor-plan.png` — a clean
   12-room, 2-floor plan (room numbers, bed types, capacities labeled). It goes
   to `/api/rooms/parse`, which reads PDF/image/spreadsheet with vision and
   returns structured rooms. Expect **12 rooms added**.
   - Accepted room-upload types: `.pdf .png .jpg .jpeg .webp .csv .xlsx .xls`.
     A rooms **CSV/XLSX** also works and is the most deterministic if the image
     path is flaky.
4. **Or click through:** "Open room assignments →" → `/admin/{slug}/room-assignments`
   → block out rooms and drag guests in.
5. **Go back** and say *"I've placed the rest."*
6. **Expect detection:** it names rooms + who's placed, asks "happy?" →
   `finish_section`.
7. **Expect LOOP CLOSE menu** (rooms dropped — they're done).

**Verify:** `state.rooms.length` and the union of `assigned_guest_ids`.

---

## Fixtures at a glance

| Fixture | Path | Exercises |
|---|---|---|
| Simple guest list | `sample-guest-list.csv` | clean import |
| Messy guest list (150) | `mock-data/guest-list-150.csv` | column mapping, scale, plus-ones |
| Hotel floor plan | `mock-data/hotel-floor-plan.png` | vision floor-plan parse → 12 rooms |

If you need a *new* floor plan, regenerate with
`python3 mock-data/make-floor-plan.py` (PIL) — keep it high-contrast, room
numbers big, bed type + capacity per box.

---

## Gotchas learned the hard way

- **Onboarding intercepts free text.** On a blank wedding, the first messages go
  through the scripted cards (names/stage/venue/dates/goals). Answer the cards;
  don't fight them with typed messages.
- **Extension disconnects.** Wait ~20s, re-call `tabs_context_mcp`; the tab and
  its state survive.
- **Batch browser actions** with `browser_batch` (navigate → wait → click → type
  → screenshot in one call) — far faster and fewer disconnects.
- **Pacing / rate limits (prod only).** Anon chat is 10/min/IP; space turns ~7s.
  Dev has no such limit.
- **The publish link rides in a card, not the prose.** Don't assert the URL is
  spoken; assert the `website_published` event / the link card.
- **`website_published` fires ON the confirm turn**, not the turn after.

---

## The fast approximation (when you don't need a full click-through)

- **Local evals:** `node scripts/agent-evals.mjs website-full-journey
  guest-list-handoff rooms-handoff stated-intent` (needs dev server +
  `AGENT_LAB_TOKEN`). The `patch` step **simulates** the couple's UI work with a
  DB write — it does not click the button. Good for regression, not for proving
  the UI half.
- **Production personas:** the `prod-uat` harness drives the real prod routes
  (anon session → `/api/agent/chat` → cards → confirm) but likewise never visits
  the handoff URL. It proves forwarding is *offered* and publish works
  end-to-end; it does not open the section screen.

Reach for this playbook (real browser) whenever the change touches the section
screens, the uploaders, or the handoff/detection/close loop itself.
