# Planner Spine — Master Tracker

> Source: KV brain dump 2026-07-02. This is the working tracker for the full planner-spine build.
> Rule: address items one by one, mark status as we go, nothing gets dropped.
> Statuses: `TODO` · `IN PROGRESS` · `BLOCKED (question)` · `DONE` · `DEFERRED (decision)`
> Companion doc: `docs/PLANNER-ONBOARDING-FLOW.md` (the intro flow — this tracker specs out its step 5, the ACT chain).

---

## A. The "Working on" bar (cross-cutting, build first)

| # | Item | Status | Notes |
|---|------|--------|-------|
| A1 | Persistent status bar at top of chat interface: full width, single line. Left: "Working on: {step}". Right: skip / move-on button. | DONE ✅ (2026-07-02) | Pinned white strip at the top of the chat panel (inherits panel radius via overflow), `Working on: {label} · step N of 9`, `SecondaryActionButton` "Skip / move on", "All caught up ✓ (+N skipped parked)" when complete. Visual pass in browser still worth a look. |
| A2 | Persist current spine step per wedding so returning users resume where they left off. | DONE ✅ (2026-07-02) | `agent_knowledge` row (title `Current focus`, metadata `{step, done[], skipped[]}`) — NO migration needed. Canonical steps + defer-and-resurface logic in `lib/agent/spine.ts` (unit-tested, `tests/agent-evals/spine-focus.test.ts`). Agent tools `set_current_focus` / `complete_focus_step` (`lib/agent/tools/focus.ts`). Exposed to UI via `/api/agent/summary` `focus`. |
| A3 | On return, agent proactively asks "Are you done with everything on {step}?" — confirm → advance, else continue. | DONE ✅ (2026-07-02) | Snapshot injects "Working on (spine focus): … open by asking whether they're done" + system-prompt WORKING-ON BAR rules. Live eval `12-working-on-resume.mjs` covers set → return → resume → advance. |
| A4 | The current step drives which right-side panel shows — always exactly one focus. | PARTIAL | Right pane is event-driven (QuestionFlow / FAQ / venues / broadcast panels) and the agent now works one focused step at a time, so the pane follows the focus in practice. A hard step→pane mapping deferred until a real mismatch shows up. |
| A5 | When user clicks away to a section (guest list, website), planner records that step as pending; on return it's still "Working on". | DONE (via A2) ✅ | Focus persists until explicitly completed/skipped — clicking away changes nothing; the bar + resume prompt pick it right back up. Deep-link "went to section X" detection can layer on later if needed. |

## B. The spine (step order + per-step spec)

Order from the dump: **schedule/events → travel/logistics/stay → website → guest list → RSVPs → rooms → vendors/venue → registry → photos**.
⚠️ Differs from current system-prompt order (`system-prompt.ts:52`): schedule → website+FAQs → guest list → RSVPs → travel → rooms → shuttles → comms → vendors → registry → photos. See E1.

### B1. Schedule / Events — `TODO`
- Ask: do you have dress codes? What are they? Free-text input **per event**.
- Mention: we can generate mood boards for each event — "give us as much detail as you wish."

### B2. Travel, logistics & stay — `TODO`
- **Accommodations**: multi-select — are guests' stays covered? (all / some / none).
  - If all covered → done. If some/none → "want us to recommend nearby hotels, or do you have specific ones to tell guests?"
  - Free-form field for additional details.
- **Shuttles**: "Are you helping with transportation to the venue?" (all transportation to/from venue / no / something else — explain / I'm not sure).
- **Anything else guests should know?** Free-form (plans before? parties after?).
- Existing building block: `ask_user` + QuestionFlow multi-select/text right-pane forms already support this shape.

### B3. Website — `TODO`
- Ask if they want to set up their wedding website. Pitch: holds all event details, schedule, dress codes, anything else guests should know. Keep concise.
- If yes → forward them to the website section; tell them they can come back anytime to continue the spine.
- **FAQ generation**: only generate once we actually have the details it needs. Never fabricate — only facts we know 100%. Confirm/continue when happy.
  - Exists: `propose_faqs` tool + FaqReviewPanel (`lib/agent/tools/content.ts:59-102`). Needs: gating on "enough details known" + accuracy hardening.
- Chat is (near) read-only for website content — redirect to the section with links, don't deep-edit via chat.

### B4. Guest list (+ households / liaisons) — `TODO`
- Offer: upload (as today) or forward to the section to add one at a time.
- Then: send them to the section to **tag** guests. Explain what tags unlock (room covered, plus one, roomed-next-to, side). Show 4 example tags using the **actual bride/groom names** ("{Bride}'s side", "Room Covered", "Plus One Allowed", …).
- Track the click-away; keep as pending "Working on" until confirmed done.
- **Smart tag suggestions** (chat AND guest list section): based on context already collected (e.g. "some rooms covered" → suggest/require "Room Covered"). The tag "+" button (TagPicker, opened from `guest-list/page.tsx:480-504`) shows suggested tags — defaults bride-side/groom-side + dynamically useful ones.
  - Today TagPicker only suggests tags already used in the wedding; examples are hard-coded (`guest-list/page.tsx:1260`). No context-driven suggestions.
- If they keep trying to manage the guest list via chat → keep redirecting to the section (with links). Chat read-mostly for guest list. (Same policy as website.)
- Guest list section: accept **any image uploads** too — parse scratch notes (today: CSV/TSV/TXT/XLSX/XLS/VCF only, no images — `GuestImportWizard.tsx:212-229`). Rooms parser already does Gemini vision on PDF/PNG/JPG (`app/api/rooms/parse/route.ts`) — same pattern.

### B5. RSVPs — `TODO` (most machinery exists)
- Ask: ready to broadcast the website link to all guests and invite them to RSVP?
- Compose broadcast **template inside the chat** — draft a neat one for them.
  - Exists: `broadcast_message` tool → WhatsAppBroadcastDraft → BroadcastPanel preview/confirm (`lib/agent/tools/messaging.ts:91-157`), send via Whapi (couple's paired number), full delivery + reply tracking (`concierge_broadcast_recipients`).
- Tell them: we'll monitor everything and track non-responders (replied_at IS NULL is already queryable — needs the monitoring/nudge story).
- Step success = broadcast sent.
- Note: broadcast is Pro-gated ("Guest WhatsApp messaging") — this step is the natural SEND-trigger conversion moment.

### B6. Rooms — `TODO` (section is already strong)
- Ask: do you want help with room assignments?
- If yes: request floor plan details, allow upload right in chat; best-guess assignments from tags; or take specific instructions.
  - Exists in section: Gemini 2.5 Flash floor-plan/room-list parsing (PDF/PNG/JPG/CSV/XLSX), auto-assign by side+tag, drag-drop. Agent tools: `list_rooms`, `update_room`, `assign_guests_to_room` (gated).
- Decision: forward to the room-assignments section vs. do it in chat (dump leans forward-to-section).
- **Docked chat on Guest List AND Room Assignments sections** (right side, not overlapped by header): text + voice for placement/tagging — "just ramble to us." (See E3 for pattern.)

### B7. Vendors / venue — `TODO`
- "Which vendors have you finalized?" — select a category → text input for the name.
- "Any missing / need help?" → one question: overall budget → best-guess per-vendor budget split → suggest matches.
  - Exists: `vendor_directory` (~1,259 vendors, 10 categories + venue/hotel), `search_vendor_directory` agent tool (category/city/budget/rating/NRI filters), `saved_vendors` shortlist, Google Places ingest script.
- If nothing in DB for a category → live Google Places search, always show options. **Never show nothing.** (Live-Places fallback doesn't exist yet — ingest script is offline.)

### B8. Registry — `TODO` (machinery exists)
- External registry link for the website? Get the link. (Exists: `wedding_registry.external_url`.)
- Guests pay you directly from the site? (Exists: Stripe product→price→payment-link generator, `app/api/registry/create-link/route.ts`; plus shagun ledger agent tools.)
- Work = wire these as a spine step in chat, not new infra. Confirm E5.

### B9. Photos — `RESEARCH FIRST`
- Feature idea: shared album, send to all guests, they upload photos.
- **Before building**: research the mechanism — Google Photos shared album? Lapse (a scaffolded `LapseIntegration.tsx` component already exists, unused)? Third party? Self-hosted (Supabase `wedding-images` bucket exists, no guest upload pipeline)?
- Unused `photo_sharing` WhatsApp template already defined (`lib/whatsapp/templates.ts:18`).
- Only after the plan is decided: add as sidebar feature + spine step.

## C. Guest list — standalone fixes/features

| # | Item | Status | Notes |
|---|------|--------|-------|
| C1 | **Plus-one parsing bug**: import missed plus-ones (got only the 72 named guests). Root cause: pure-heuristic column mapping + no plus-one visibility in preview + chat path imports with no preview at all. | DONE ✅ (2026-07-02, verified w/ real Zola file — 157 headcount vs 72 before) | Shipped: Gemini column analyzer (`/api/guests/import/analyze`, rate-limited + size-capped) + `smartMapColumns` merge w/ heuristic fallback; multi additional-guest columns → `additional_guests`; per-cell interpretation of mixed Plus One columns (names / yes-no / counts) → party_size + `plus-one-allowed` tag; serial "No." guard; phone-affinity pairing; XLSX numeric-cell coercion; confirm preview shows Plus One + expected headcount; Import blocked while analyzer in flight; chat upload path uses it all too. 14 adversarial-review findings found + fixed; 83 tests green. Remaining: verify against KV's real file (E6). |
| C2 | **Voice tagging**: mic in the guest list section — admin rambles about tagging (who's with who, whose rooms covered, who shouldn't see an event); LLM applies tags accurately; asks clarifying questions when unsure. | TODO | Reusable: `useVoiceInput` hook + `/api/concierge/transcribe` (Groq Whisper) already power chat voice. No voice in guest list today. |
| C3 | Highlight the voice feature prominently in the guest list section ("just speak to us and tell us how to tag"). | TODO | |
| C4 | Image upload for guest list (scratch notes → parsed guests). | TODO | Overlaps B4; reuse the rooms Gemini-vision parse pattern. |

## D. Quick UI fixes

| # | Item | Status | Notes |
|---|------|--------|-------|
| D1 | Guest list upload: make the "I have a lawful…" consent note smaller. | DONE (2026-07-02) | 0.8125rem → 0.75rem (legal-footnote exception to the 14px floor). |
| D2 | Landing hero heading: a bit smaller at every breakpoint **except mobile**. | DONE (2026-07-02) | `clamp(56px, 10.5vw, 156px)` → `clamp(56px, 9vw, 128px)`. Mobile (≤622px) unchanged at 56px; 1024px: 107→92px; 1440px: 151→128px. Tune further on visual check. |

## E. Open questions (answers get logged here)

| # | Question | Answer |
|---|----------|--------|
| E1 | Spine order — dump order (travel BEFORE website, so FAQs are accurate) vs current prompt order (travel after RSVPs)? | ✅ **Dump order**: schedule → travel/stay → website → guest list → RSVPs → rooms → vendors → registry → photos. Update `system-prompt.ts:52` to match. |
| E2 | Skip button semantics — defer-and-resurface vs mark done? What does the bar show when the spine is complete? | ✅ **Defer + resurface**: skip marks step 'skipped' and advances; skipped steps resurface after the rest; bar shows "All caught up" when done/skipped. |
| E3 | Docked chat on Guest List / Rooms — collapsible right panel vs floating widget vs fixed panel? Same conversation as main planner? | ✅ **Collapsible right panel**, open by default on those two pages, collapses to slim edge tab, sits below admin header, shares the main planner conversation, text + voice. |
| E4 | RSVP broadcast — keep existing Whapi/paired-number channel + Pro gate as-is? Is this spine step THE SEND-trigger conversion moment for free users? | ✅ **Yes, SEND-trigger**: everyone gets the drafted broadcast; free users hit the upgrade card at send. |
| E5 | Registry "pay directly" — the existing Stripe payment-link generator is what you mean? Or something new (direct-to-bank, shagun-ledger tie-in)? | ✅ Couples create their own Stripe products dynamically through Phera (Stripe API/MCP); money collected on Phera's Stripe; **forward to couple after the wedding — NOT built yet, don't worry about payout now. Low priority overall.** |
| E6 | The plus-one guest file — need it re-shared (attachment didn't come through). | ✅ Received (`~/Downloads/Zola_Guest_List_v2.csv`) and verified 2026-07-02: 72 guests + 37 named plus-ones + 11 Y-flags + 37 additional guests = **157 expected attendees** (old importer captured 72). Heuristics alone handle it; LLM analyzer reinforces. |
| E7 | What to build first? | ✅ **Quick fixes first** (D1, D2, C1) → then Working-on bar (A1–A5) → then spine steps in order. |

## G. Evals (added 2026-07-02 per KV request)

| # | Item | Status | Notes |
|---|------|--------|-------|
| G1 | Audit existing eval infra. | DONE ✅ | 3 tiers: deterministic CI suites (`tests/agent-evals/*.test.ts`), live invariants (`live/personas.live.test.ts`), scenario scorecard (`scenarios/*.mjs` via `npm run evals`, costs tokens). Personas P1–P10/E1–E10 defined in `docs/AGENT-EVALS.md`. |
| G2 | Persona tags on every fixture + multiple-persona coverage. | DONE ✅ | All 11 fixtures tagged (P1, P2, P3, P5, P6, P8, P9, E6 = 8 distinct). `npm run evals -- P5` filters by persona. |
| G3 | Full-spine walkthrough eval in the DECIDED order. | DONE ✅ | `07-full-spine-walkthrough.mjs` — 10 turns, one spine step each, order asserted. System prompt + flow doc updated to decided order (travel before website). |
| G4 | **Enforcement**: coverage can't rot. | DONE ✅ | `tests/agent-evals/scenario-coverage.test.ts` (CI): every fixture must declare a persona; ≥5 distinct personas; a `spine:'full'` fixture must exist with `spineSteps` == canonical order; system-prompt order probed too. |
| G5 | New fixtures for what we changed: plus-one headcounts + upload flow. | DONE ✅ | `08-plus-one-headcount.mjs` (reply reconciled against Σ party_size via new `verify(state, h, {reply})` 3rd arg), `09-guest-import-upload.mjs` (request_upload, nothing fabricated). |
| G6 | Working-on bar evals (persisted step, resume prompt, skip=defer). | DONE ✅ (2026-07-02) | `12-working-on-resume.mjs` — **5/5 live on first run**: set_current_focus fires on topic declaration, a NEW conversation resumes at the focused step (no onboarding restart), complete_focus_step advances to RSVPs. Runner gained `newConversation:` turns + `expect.events/notEvents`. |
| G7 | Live scorecard baseline (2026-07-02): **60/61 checks green** across 7 scenarios run live. | BASELINE | One documented red kept as a regression target: full-spine t5 — mid-flow *statement* "our guest list is in a spreadsheet" doesn't render the upload card (direct asks DO — `09-guest-import-upload` passes). Deliberate: not over-tuning the prompt against one turn. |
| G8 | CI wiring for evals. | DONE ✅ (2026-07-02) | Deterministic suites already run on every push (ci.yml runs full vitest — includes scenario-coverage enforcement). NEW: `.github/workflows/agent-evals-nightly.yml` — nightly + manual live scorecard vs phera-test with `--min-pass=0.9` + report artifact; self-skips until `EVALS_SUPABASE_*`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `AGENT_LAB_TOKEN` repo secrets are added (KV action). Lab email guard means CI runs never page the team. |

## F. Follow-ups noticed along the way

| # | Item | Status | Notes |
|---|------|--------|-------|
| F1 | `/api/guests/import`, `/api/rooms/parse`, and the new `/api/guests/import/analyze` are **unauthenticated** (middleware only guards /admin pages + /api/ops). Analyze is now rate-limited + size-capped; the other two are pre-existing. Worth an auth pass across guest/rooms API routes. | DONE ✅ (2026-07-13) | Full API auth sweep: added `getAuthenticatedClient` + `verifyWeddingAccess(BySlug)` to guests/import, rooms/auto-assign, rooms/parse (+rate limit), concierge/broadcasts/send + suggest-fields, control-tower send/dashboard/conversation, invites/send-via-concierge, whatsapp/send-test + flows, outreach/escalations, build-ai classify/inquiry (+rate limits); track-click rate-limited; cron routes + vendors/webhook now fail-closed on missing secret. New helper `verifyWeddingAccessBySlug` in `lib/utils/verify-wedding-access.ts`. |
| F2 | Pre-existing failing test `tests/agent-onboard-tts-api.test.ts` ("creates a draft wedding…" expects slug `new-wedding-*`, route now returns a UUID) — belongs to earlier uncommitted WIP on `app/api/agent/onboard/start/route.ts`. | DONE ✅ (2026-07-02) | Test updated to assert the route's intended unguessable-UUID draft slug. Unit suite fully green again. |
| F3 | **TTS (voice onboarding) — BACKLOG, not an active feature.** KV decision 2026-07-02: keep it *working* (green tests, no rot) but don't invest in it as a feature right now. | BACKLOG | Includes fixing the F2 test so the suite stays green. |

---

## Current-state code map (scout results, 2026-07-02)

- **Chat UI** — `components/agent/AgentChatPanel.tsx` (2,179 lines). Split layout exists: chat left (flex 1.6), right form pane (flex 1) appears when needed (`:1615-1688`). Chat box: `COLORS.bg.subtle` #F8F8F8, `RADII.lg` 16px, 1px `COLORS.border.default` (`:1691`). NO top bar today. Voice: mic in composer (`:2087`) → `useVoiceInput.ts` (MediaRecorder → `/api/concierge/transcribe`, Groq Whisper). Inline message cards: confirm / upgrade / upload only; rich interactivity lives in the right pane (QuestionFlow, FaqReviewPanel, VenueCardsPanel, WhatsAppPairingPanel, BroadcastPanel).
- **Agent state** — no persisted current-step. `buildWeddingSnapshot` (`lib/agent/context.ts:39-195`) rebuilds a 10-item completeness checklist per turn from live table counts. Goals → `agent_knowledge` (scope=wedding, title='Planning goals', metadata JSON) via `set_planning_goals` (`lib/agent/tools/goals.ts:9-44`). Onboarding intro (names→stage→branch→goals) in `system-prompt.ts:27-31`; ACT chain order at `:52`.
- **Guest import** — `GuestImportWizard.tsx` (upload + manual), `lib/admin/guest-import-parsers.ts` (parseCsv/parseXlsx/parseVCard + heuristic `autoMapColumns` `:90-183`), `app/api/guests/import/route.ts` (rows → guests, `logistics_data` gets tags/plus_one_name/plus_one_phone/additional_guests/party_size `:166-186`). No LLM, no images.
- **Tags** — `logistics_data.tags: string[]` (legacy `.tag` string fallback), normalized by `lib/utils/guest-tags.ts`. TagPicker popover from "+" button (`guest-list/page.tsx:480-504`). Suggestions = existing wedding tags only. Downstream: broadcast targeting, room auto-assign grouping, agent messaging tools.
- **Rooms** — `room-assignments/page.tsx`: upload zone (PDF/PNG/JPG/WEBP/CSV/TSV/TXT/XLSX) → Gemini 2.5 Flash parse (`app/api/rooms/parse/route.ts`), manual add, auto-assign (`app/api/rooms/auto-assign/route.ts` — side split + tag grouping + capacity), drag-drop. Table `wedding_rooms` (assigned_guest_ids uuid[]). Agent tools: list_rooms / update_room / assign_guests_to_room (gated, Pro).
- **Broadcast** — `broadcast_message` tool (`lib/agent/tools/messaging.ts:91-157`) → draft preview → BroadcastPanel confirm → `/api/concierge/broadcasts/send` → `sendWhapiText` (Whapi.Cloud, couple's paired number). Targeting all/tags/specific. Tracking: `concierge_broadcast_recipients` (pending/sent/delivered/read/failed, replied_at, Gemini reply-extraction). ALL Pro-gated ("Guest WhatsApp messaging", HTTP 402 for Basic).
- **Vendors** — `vendor_directory` table + `scripts/ingest-vendors.ts` (Google Places, offline) + `search_vendor_directory` tool (`lib/agent/tools/directory.ts:19-112`) + `/vendors` public browse + `saved_vendors`. Gap: no live Places fallback, no save-from-chat tool.
- **Registry** — `wedding_registry` (external_url, stripe_product_id), Stripe link generator (`app/api/registry/create-link/route.ts`), admin builder (Pro-gated), guest page, shagun agent tools (`lib/agent/tools/shagun.ts`).
- **Website/FAQ** — `propose_faqs`/add_faq/update_faq (`lib/agent/tools/content.ts:59-102`) + FaqReviewPanel; admin FAQ builder w/ drag-drop + 10 templates; guest accordion page.
- **Photos** — nothing live. `LapseIntegration.tsx` scaffolded (unused), `photo_sharing` WA template (unused), `wedding-images` bucket exists (no guest upload path). SERVICES-CATALOG.md lists shared album as PLANNED/managed.
- **Landing fixes** — hero: `HeroSection.tsx:97` `clamp(56px, 10.5vw, 156px)`. Lawful note: `GuestImportWizard.tsx:1146-1149`, 0.8125rem.
