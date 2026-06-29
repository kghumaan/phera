# Phera AI Planner — User Journey & Question Track

> **Living document.** The deterministic conversation spine the Planner runs after login: how it greets a couple, decides what to ask, and routes them to the right services for maximum coverage without wasting their time. This is the blueprint every system prompt / checkpoint prompt should implement.
>
> Last updated: 2026-06-29 · Companion to `docs/SERVICES-CATALOG.md`

---

## 0. Principles (read first)

1. **The Planner is home base.** After login the couple lands here. They can run the *whole* wedding from chat, or jump into any service from the sidebar. The Planner orchestrates; the sidebar exposes each service standalone (see **§5**).
2. **Never re-ask what we know.** The pre-chat snapshot already has couple names, dates, venue, guest + RSVP counts, #events, #schedule days, goals, and a completeness checklist. Confirm; don't interrogate. *(Note, corrected 2026-06-29: there is **no goal double-ask** for couples. The `/onboarding` multi-step wizard is **planner-only** (`?role=planner`); couples on every auth method go `/auth/callback → /welcome → wedding created → /admin/[slug]/assistant?welcome=1`, so the in-chat onboarding is their **only** onboarding. The Planner already owns goal-gathering. The real work is routing (returning users → Planner) + the new-vs-returning screen — see the onboarding-changes plan.)*
3. **Act first, confirm second.** The Planner has low-risk auto-execute write tools. For things it can safely draft (schedule from the standard event template, a site draft, seeded FAQs, proposed households), it should **do it and show "here's what I set up — edit or approve,"** not ask permission for each. Reserve explicit asks for gated/outbound actions and genuine judgment (budget, aesthetics, consent).
4. **Guaranteed coverage, adaptive phrasing.** A fixed set of checkpoints guarantees every relevant service area is considered. The agent phrases each naturally and **skips** anything irrelevant or already satisfied. Coverage is a guarantee; an interrogation is not.
5. **Only ask when a downstream service consumes the answer.** Don't ask budget unless routing to venue/vendor sourcing. Don't ask visa status for a local wedding. Each question must earn its place.
6. **Never fake automation.** Not-built services (venue, vendor sourcing, photo album, on-hold save-the-dates) are captured as a real brief and framed *"our team will handle it"* (managed) — never presented as a live self-serve button.
7. **Re-read live state at every checkpoint.** Because couples can jump into sidebar tools mid-conversation, each checkpoint reads current state on entry and treats manual actions as satisfying the gate. Confirm, never re-collect.

---

## 1. Entry router — decide *who* and *which mode* before CP0

The single biggest refinement from review: **branch before the sweep, not at the end.** Two reads happen on session start:

### 1a. Persona (sets register + agenda)
| Persona | Signal | What changes |
|---------|--------|--------------|
| **Couple** | Default; account type = couple | Emotional, first-person register ("what's keeping *you* up?"). The full spine below. |
| **Planner / agency** | Account type = planner, or "my clients / managing several weddings" language | **Portfolio framing**, not "forget the checklist." Asks across weddings ("12 of 30 need RSVP nudges"). Sets up agency account. Snapshot is single-wedding today → this is also an architecture gap to close. |
| **Family liaison / parent** | Logged-in non-couple helper | Task-focused, less emotional; scoped to the guests/logistics they own. |

### 1b. Mode (sets *how much* to run)
Read the completeness checklist + `days_until_wedding` + scale/locality, then pick:

| Mode | When | Behavior |
|------|------|----------|
| **Full sweep** | New / sparse wedding | Run the spine CP0→CP-Close. |
| **Triage short-circuit** | Snapshot mostly green | **Don't walk 13 "you already have X, confirm?" gates.** Collapse to: *"You're far along — here are the 2 gaps I see and 1 thing I'd watch. Fix those, or leave it?"* Coverage becomes a silent background audit, not 13 spoken gates. |
| **Returning delta** | Returning session, established wedding | Open with **what changed** (new RSVPs, flight changes, vendor-group decisions, deadlines approaching) + an open prompt — **not** "resume the questionnaire." The sweep only re-engages if they ask. |
| **Single-task** | Couple arrives with one intent ("an uncle cancelled") | Do that task, then offer — don't force — the rest. |
| **Small/simple** | Low count + local | Prune households/liaisons, broadcast, and the whole logistics cluster down to a minimal RSVP + site + FAQ path. |

> **Venue-TBD is the first branch after persona/mode.** If venue is "TBD", route to the managed venue brief *immediately* (don't wait for CP-Vendors at the end), explicitly defer all venue-dependent checkpoints, and tell the couple *"we'll wire up site / RSVP / travel the moment your venue locks."* Otherwise half the spine has an unmet prerequisite sitting second-to-last.

---

## 2. The deterministic spine

Each checkpoint self-decides among **four routing outcomes**:

- **ACTIVATE NOW** — live service; call the matching agent tool, seed rows, show the result.
- **CAPTURE-AND-DEFER** — live but time-boxed (run-sheet, day-before/shuttle/thank-you reminders, flight-day tracking). Log it with a concrete resurface trigger (date offset or state condition). `days_until_wedding` decides activate-now vs defer.
- **MANAGED CAPTURE** — not-built (venue, vendor sourcing, photo album, on-hold save-the-dates). Capture a real human-concierge brief; never fake automation.
- **SKIP** — snapshot already satisfies it, or a precondition is false.

Ordering is **dependency-and-leverage**: confirm → pain hook + first win → schedule (keystone) → website + guest list (the two containers) → RSVP → destination-gated logistics cluster (travel → rooms → shuttles; rooms before shuttles because shuttle routes need the hotels) → communications → vendors/venue (the one budget station, late, as parallel managed work) → registry → memories → plan/consent/account → activation plan.

> Notation: **[fix]** marks where the spine improves on the naive design per review.

### CP0 · Reflect back & set the agenda — *always*
Mirror the snapshot so they feel seen; silently flag completeness gaps; establish home base; license them to decline anything. **Never re-ask names/dates/venue/counts/events/goals.**
> *"Okay — Priya & Rahul, Dec 12–14 at The Leela Udaipur, 280 on the list, 41 RSVPs in, 4 events. I've got your basics so I won't make you repeat them. I'm home base — run everything here, or jump into any tool on the left. I'll walk the handful of things I can take off your plate; say no to anything, this'll be quick."*
Returning sessions compress to "welcome back, here's what changed" (delta mode).

### CP1 · Surface the biggest pain — *always, after CP0*
Find the ONE thing stressing them most; pull that service to the front. **[fix]** Capture an *ordered list*, not a single stressor — act on the top, queue the rest.
> *"A 3-day Udaipur wedding for 280 with people flying in is a lot. Forget the checklist a sec — what's the ONE thing keeping you up? Guests landing from everywhere, chasing RSVPs, the venue, vendors, getting everyone to the right place?"*
If "everything," skip the deep first win and let the ordered sweep be the calming structure. **[fix]** If the snapshot is near-complete, auto-compress CP1/CP2 (don't open slow for a prepared couple).

### CP2 · Deliver the fast first win — *driven by CP1*
Act on the named pain immediately — activate (or scope as a managed brief) deeply enough to show value in the first minutes. **[fix]** Then offer an explicit fork: *"Want me to keep going through everything, or just do this and get out of your way?"* Honor "just this" by stopping with a one-line "I'm here when you want the rest."
> *"Let's knock that out first. [RSVP] I'll turn on per-event RSVP across all 4 events — live now? [Venue, not-built] Venue's the big rock — I'll hand it to our team with your dates and headcount; roughly what budget and feel?"*
**[fix]** Budget captured here is a *single owned fact* — CP-Vendors must read it and never re-ask.

### CP3 · Lock the multi-day schedule — *always (keystone)*
Make sure every function exists with date/time/venue — RSVP, travel, shuttles, rooms, reminders, run-sheet all hang off it. **[fix] Act-first:** draft the standard Mehndi/Haldi/Sangeet/Ceremony/Reception layout with assumptions, then *"here's what I laid out — edit anything."* Offer the run-sheet but **capture-and-defer** when far out.
> *"Everything hangs off the functions, so I pinned them: Sangeet, Ceremony, Reception you had — I added Mehndi and Haldi with dates and sub-venues. Fix any of these? (The minute-by-minute run-sheet I'll build closer in.)"*

### CP4 · Public website + look + FAQ — *once a venue/date exists*
Stand up the site that hosts RSVP/FAQ/registry; **seed the FAQ** (also grounds the concierge); defer aesthetics to the design studio or managed team. **[fix] Act-first:** publish a draft + seed FAQs, then show it.
> *"I stood up a draft site at phera.io/priya-rahul with your schedule and seeded the FAQs guests always ask (dress code, kids, parking). Pick the look in the design studio, or hand the whole aesthetic to our team."*

### CP5 · Guest list, households & liaisons — *always (skip the import ask if list is healthy)*
Land the people-of-record; structure into households with a liaison per family. Flag guests missing a phone (required contact). **[fix] Act-first:** propose household groupings from the existing list rather than asking cold.
> *"You've got 280 in — full list or still growing? I grouped what look like family clusters; want me to tag one liaison per family so we chase one uncle who RSVPs for eight, not forty texts?"*
Small/simple weddings: skip households/liaisons entirely.

### CP6 · RSVP + the questions you ask — *guests exist or a site is wanted*
Turn on per-event RSVP + custom questions; the form doubles as a logistics-collection surface (feeds CP-Travel). Skip the activation ask if RSVP is already live; offer only custom questions.
> *"Want per-event RSVP so you know who's at the Mehndi vs just the Reception? I'll add custom questions too — dietary, plus-ones, kids, a Sangeet song request."*
**[Tier A hook]** Capture dietary in a way that rolls up to per-event caterer headcounts (see catalog §3 #1).

### CP7 · Travel & guest logistics — *destination gate*
**[fix] Per-guest/household, not binary.** Real NRI weddings split half-local/half-fly-in. Apply flight tracking / rooms / shuttles to the *traveling subset*; don't drag locals through logistics they don't need. If YES, switch on flight tracking + the logistics profile (passport, visa, arrival/departure, emergency contact, language). This gate governs CP8/CP9.
> *"It's Udaipur and a lot of your crowd is flying in — want me to collect arrival/departure flights and track them live, plus passport-name and visa for anyone who needs it? Saves chasing details over text."*
**[fix] Consent at point of collection:** the moment any passport/visa/personal data is switched on, establish the DPDPA consent posture *here* (English + Hindi) — don't defer it to CP-Plan. CP-Plan only confirms/extends.

### CP8 · Lodging / room assignments — *CP7=YES, room block exists, ≥5 guests (Pro)*
Activate floorplan-parse + drag-drop assignments so families/elders stay together. Rooms before shuttles (routes depend on hotels). **[fix]** Surface "this is Pro, ~$X" inline here — not as a surprise at CP-Plan.
> *"Holding a room block? Upload the floorplan and I'll parse it so you can drag guests into rooms. This one's on Pro (~$X)."*
**[Tier C hook]** If they haven't *negotiated* the block yet, that's managed (room blocks + booking links, catalog §3 #12).

### CP9 · Ground transport / shuttles — *CP7=YES and (airport OR multiple venues OR room block) (Pro)*
Activate shuttle planning between airport/hotels/venues; runs scheduled off CP3 + confirmed hotels. Inline Pro price.
> *"With people landing in Udaipur and venues spread out, want shuttles between airport, hotel and each venue? Fixed scheduled runs or flexible on-request — also Pro (~$X)."*

### CP10 · Guest communications & consent — *reachable guest list exists (Pro)*
Switch on the comms stack — concierge, broadcast (+ optional data schema), reminders. Reminders are **capture-and-defer** (queue with a send date; never fire 8 months early). **[fix]** Consent was already established at CP7 if logistics were collected — here, *confirm/extend* it, don't reintroduce.
> *"Want a WhatsApp concierge answering guests 24/7 from your wedding number, so you're not the help desk? I can also broadcast updates and queue reminders (event, day-before, shuttle, thank-you). Pro."*

### CP11 · Vendors & venue — *always, branch by what's still open*
One station, correctly split: **sourcing/booking = managed**; **coordination of booked vendors = live Pro** (Whapi group tracking); **browsing = free directory**. **The only checkpoint allowed to ask budget** — and only if routing to sourcing, and only if CP2 didn't already capture it. Fires with urgency if venue is TBD and the date is close (but venue-TBD was already branched up front per §1).
> *"Where are you on venue and vendors? Anything still to FIND — venue, photographer, caterer, decor — my team sources and shortlists (I'll grab budget + must-haves). For vendors you've booked, I can sit in the WhatsApp groups and pull out every decision and deadline. Or just browse our vetted Udaipur directory."*

### CP12 · Registry & where-to-shop — *site wanted, or gifts mentioned*
Low-effort free win.
> *"Want a registry or a 'where to shop' note so guests aren't guessing on gifts?"*
**[Tier A hook]** Offer the shagun/cash-gift option too — registry-only feels culturally off (catalog §3 #4).

### CP13 · Shared photo album (memories) — *always (light gate)*
Managed capture; queue a post-wedding thank-you.
> *"After the events, want one shared album where guests and you two drop photos in one place? We don't auto-build that yet — our team sets it up. I'll also queue a warm thank-you to everyone who came."*

### CP14 · Plan, consent & account (consequences) — *conditional*
Fires only if a Pro service was activated, personal data is being collected, or planner language appeared. Surface the right tier in their currency; confirm DPDPA consent/retention (already established at CP7 if applicable); flip to agency account if a planner. **[fix]** With inline pricing done at CP8–CP10, this is a clean confirm/checkout, not the first mention of money.
> *"A few things you switched on — concierge, shuttles, rooms — sit on Pro; want the tier and pricing in your currency? Consent's already set in English + Hindi for the travel details. (Running several weddings? I'll set up an agency account.)"*

### CP-Close · Activation plan + next actions — *always*
Convert the sweep into ONE prioritized plan: **LIVE NOW / WITH MY TEAM (managed) / CLOSER IN (deferred)** + 2–3 concrete next actions — then offer to execute one immediately.
> *"Here's where we landed. LIVE NOW: your 5 functions, site draft, per-event RSVP with dietary, flight tracking, the concierge. WITH MY TEAM: venue shortlist + shared album — first options this week. CLOSER IN: room assignments + shuttle times once fly-ins firm up. YOUR NEXT 3: (1) approve the site look, (2) send the rest of the guest spreadsheet, (3) confirm the room block. Want me to start on any now?"*

---

## 3. Per-service trigger questions

The single best question the Planner uses to decide whether to activate each service, and the condition under which it even asks. Use these verbatim-ish as the prompt library.

| Service | Trigger question | Ask only when |
|---------|------------------|---------------|
| Schedule / events | "Are we also doing a Mehndi/Haldi? I'll pin date, time and sub-venue to each." | Always (CP3); confirm if all functions have dates; build from template if none. |
| Day-of run-sheet | "Want a minute-by-minute run-sheet with an owner per block?" | Schedule exists. Activate only if `days_until_wedding < ~21`; else capture-and-defer. |
| Website + design | "Want a wedding site as home base for guests — draft now, look self-serve or handed to our team?" | Always (CP4); collapse to "want changes?" if a site exists. |
| FAQs / knowledge | "Shall I seed the FAQ — dress code, kids, parking, weather — which also powers the concierge?" | Site wanted/exists OR concierge being activated. Suppress if neither. |
| RSVP collection | "Want guests to RSVP per function — yes/no/maybe each?" | Guests exist or site wanted. Skip if already on; offer only custom Qs. |
| RSVP custom Qs | "Add custom questions — dietary, plus-ones, kids, a Sangeet song request?" | RSVP being/already collected. Skip for attendance-only. |
| Guest list import | "Full list or still growing? I'll import + dedupe a spreadsheet or contacts." | Always (CP5); skip if count healthy + confirmed; offer top-up. |
| Households / liaisons | "Group guests into households and tag one liaison per family?" | List exists; especially NRI/large. Skip if tiny/already structured. |
| Guest data collection | "Collect each guest's logistics — passport, visa, who needs a pickup — at RSVP or via broadcast?" | Destination confirmed OR a data-collection broadcast set up. Never for local-with-nothing-to-collect. |
| Travel / flights | "Collect arrival/departure flights and track them live for airport runs?" | Destination gate YES / guests flying in. Skip for local single-city. |
| Logistics profile | "Set up a logistics profile per guest — passport, visa, hotel, emergency contact, language?" | Destination/fly-in. Light/skip for local. |
| Room assignments | "Holding a room block? Upload the floorplan and drag guests into rooms." | CP7=YES, block exists, ≥5 guests (Pro). Note it unlocks at 5. |
| Shuttles | "Run shuttles between airport, hotel and venues — scheduled or flexible?" | CP7=YES and (airport OR multiple venues OR block) (Pro). Skip single-venue local. |
| WhatsApp concierge | "Want a concierge answering guests 24/7 from your wedding number?" | Reachable list exists (Pro). Down-scope/skip if zero messaging wanted. |
| Broadcast | "Broadcast updates to everyone or a segment — attach a quick data form?" | Reachable list + announcements/missing data (Pro). Skip DIY-no-messaging. |
| Reminders | "Which reminders should I queue — event, day-before, shuttle, thank-you?" | Reachable list (Pro). Always capture-and-defer with a send date. |
| Save-the-dates | *(do not promote)* "Heads up — that send is something my team runs for you for now; I'll note it." | ONLY if the couple raises it. Never proactive. Managed capture only. |
| Vendor sourcing | "Which vendors are still open? My team sources + shortlists; I'll grab budget + style." | Vendors unbooked (CP11). Only place (with venue) budget is asked. Managed. |
| Venue finding | "Is the venue locked or still being decided? My team shortlists end-to-end." | Venue TBD/unset (branched up front). Ask budget only here. Managed. |
| Vendor coordination | "For booked vendors, want me in the WhatsApp groups pulling out decisions + deadlines?" | Booked vendors with groups (Pro). Defer if none booked. |
| Directory browse | "Want to browse our vetted directory for any gaps?" | Still needs vendors/venue or wants to look. Free fallback. |
| Registry / shop | "Want a registry or 'where to shop' note so guests aren't guessing?" | Site wanted/exists or gifts mentioned. Skip if opting out. |
| Shared album | "Want one shared album for everyone's photos? Our team sets it up." | Always light gate (CP13). Managed. Skip if declined. |
| Plan tiers | "A few things you switched on sit on Pro — want the tier + pricing in your currency?" | A Pro service activated OR managed brief captured. Skip if all free. |
| DPDPA consent | "Shall I set the consent notice in English + Hindi and your retention window?" | Personal data actually being collected. Establish *at* CP7; skip if none. |
| Planner agency | "Running several weddings? I'll set you up an agency account." | Planner language appeared. Skip for a self-driving couple. |

---

## 4. Managed handoff & the "our team will handle it" framing

For `PLANNED`/`ON-HOLD` services the Planner captures a brief and routes to the human queue. To make the CP-Close promise ("first options this week") honorable, the founder must decide:

- **Where the brief lands** — a concierge/ops queue table? An `outreach_escalations`-style row? An internal ticket?
- **What SLA the copy promises** — CP-Close says "this week"; ops must be able to honor it.
- **Budget routing** — budget is a captured fact that must route to the *internal* concierge queue, **never** to guest-facing surfaces.

Managed-capture services today: venue finding, vendor sourcing, shared photo album, save-the-dates (on-hold), plus most Tier C backlog items (livestream, welcome hampers, e-invites, e-visa guidance, contract vault).

---

## 5. Sidebar — as built (2026-06-29)

The sidebar mirrors the catalog categories using only **real pages**, with the Planner pinned near the top. Per founder call, **Schedule & Events** and **Travel & Stay** live under **Wedding Website** (they're website sections). Items that are agent-driven managed services or not-yet-built have **no page**, so they're not in the nav — the Planner handles them in chat.

```
Overview
🪄 Planner

Wedding Website
  • Wedding Details
  • Look & Feel
  • Schedule & Events
  • Travel & Stay
  • RSVP Form
  • FAQ
  • Registry
  • Where to Shop
  • Event Access
  • Settings & Publish

Guests
  • Guest List
  • Guest Responses

Logistics & Travel
  • Room Assignments        (Pro)
  • Transportation          (Pro)

Communications             → /whatsapp-bot (Concierge · Messaging · Admin tabs)

Vendors & Venue
  • Vendor Management       (Pro)
  • Vendor Marketplace      (Pro)

Planning
  • Task Manager            (Pro)
  • Knowledge Bank          (Pro)

Account                    → plan + upgrade
Collaborators
Contact us
```

**Deliberately NOT in the sidebar — no page to link to (reached via the Planner chat):** Households & Liaisons, Guest Details/Logistics, Run-Sheet, Reminders (agent/outreach-driven); Save-the-Dates (on-hold); **Find a Venue / Find Vendors** (managed — captured via `submit_request`); **Shared Photo Album** (not built); Consent & Data, Agency (no pages yet — the `/account` page is built to extend into these). Pro items show a small badge so the upgrade is honest at first sight.

---

## 6. Decisions

### Resolved (2026-06-29)

- ✅ **Activation depth → activate in-place (act-first).** On a YES the agent fully activates the live service within the turn — calls the tool, seeds rows, shows the result ("here's what I set up — edit it"), not a hand-off to the sidebar. **Risk-tier implication:** low-risk writes (`create_event`, `create_schedule_item`, `add_faq`, `update_travel_section`, `update_guest`) must auto-execute so the act-first posture works; keep `gated` confirmation only for destructive / bulk / outbound / paid actions (room auto-assign, broadcasts, publish, pin changes). The sidebar remains the place to *refine* what the agent drafted, never a required step to *start*.
- ✅ **Session length → chunked across sessions**, CP-Close recaps progress each visit, returning sessions open in delta mode (§1b). Default chunk order below; **pain-first (CP1) overrides it** — whatever the couple names jumps to Session 1.

  | Session | Checkpoints | Outcome by end |
  |---------|-------------|----------------|
  | **1 · Foundation** | CP0–CP6 | Site draft live, multi-day schedule built, guest list in + households, per-event RSVP collecting. The "first win" sitting. |
  | **2 · Logistics** | CP7–CP9 | Travel/flight tracking + logistics profile on; rooms + shuttles for the traveling subset. Triggered once destination is known / RSVPs start landing. |
  | **3 · Comms & vendors** | CP10–CP11 | Concierge + broadcast + queued reminders; vendor coordination live, sourcing/venue briefs with the team. |
  | **Folded in / ongoing** | CP12–CP-Close | Registry, shared-album + thank-you, plan/consent/account — surfaced as relevant; CP-Close recaps live / managed / deferred each visit. |

### Still open (need your call before prompt-writing)

3. **Snapshot signals.** Does the snapshot reliably expose `days_until_wedding` **and** a destination signal (venue city vs guest origins)? CP7 + capture-and-defer timing depend on both; if absent, the agent must ask (costs a question).
4. **Managed-work mechanics.** Where do briefs land, and what SLA does CP-Close promise? (See §4.)
5. **Budget storage.** Confirm the captured-facts schema has a budget field that routes to the internal concierge queue, not guest surfaces.
6. **Save-the-date isolation.** Reminders share the outreach engine with the on-hold save-the-date send. Confirm the agent *cannot* accidentally expose the on-hold auto-send while activating event/day-before/thank-you reminders.
7. **Plan-tier gating.** Per project memory: gate on `isPro`, all paid tiers get all features. CP14 = single Pro unlock + Managed upsell, no per-feature sub-tier the agent might wrongly imply.
8. **Returning-session state.** CP0 promises to "resume at the first unsatisfied checkpoint" / lead with deltas. Does the agent persist per-checkpoint satisfied/deferred state, and how do deferred items with resurface dates re-trigger — cron (Phase 6 scheduled check-ins) or next login?
9. **Persona detection.** Couple vs planner vs family-liaison must be known at session start. The snapshot is single-wedding-scoped today — closing the planner-portfolio gap is an architecture task, not just a prompt.

---

## 7. From this doc to prompts

When writing the system / checkpoint prompts, encode:

- **The entry router (§1)** as the first decision — persona branch + mode branch + venue-TBD branch — *before* CP0.
- **Each checkpoint** as: trigger condition → live-state re-read → one of the four routing outcomes → example phrasing → what it captures. The §3 table is the question library.
- **The four hard guardrails** as standing rules in the system prompt: (a) never re-ask snapshot facts; (b) act-first on safe writes, ask only for judgment/gated/outbound; (c) only ask when a downstream service consumes the answer; (d) never fake automation — managed capture only.
- **Consent-at-collection** as a hard rule wherever personal data is switched on (CP5 contacts, CP7 logistics, CP10 messaging).
- **Coverage as a silent audit in triage/delta modes** — don't speak a gate the snapshot already satisfies.
