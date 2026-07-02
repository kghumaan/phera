# Planner Spine — Master Tracker

> Source: KV brain dump 2026-07-02. This is the working tracker for the full planner-spine build.
> Rule: address items one by one, mark status as we go, nothing gets dropped.
> Statuses: `TODO` · `IN PROGRESS` · `BLOCKED (question)` · `DONE` · `DEFERRED (decision)`
> Companion doc: `docs/PLANNER-ONBOARDING-FLOW.md` (the intro flow — this tracker specs out its step 5, the ACT chain).

---

## A. The "Working on" bar (cross-cutting, build first)

| # | Item | Status | Notes |
|---|------|--------|-------|
| A1 | Persistent status bar at top of chat interface: full width, same border radius as chat container (`RADII.lg` 16px, chat uses `COLORS.bg.subtle`), single line. Left: "Working on: {step}". Right: skip / move-on button. | TODO | No top bar exists today inside AgentChatPanel — clean slot above the chat box (`AgentChatPanel.tsx:1691`). |
| A2 | Persist current spine step per wedding so returning users resume where they left off. | TODO | Nothing persisted today — snapshot is rebuilt per turn from table data (`lib/agent/context.ts:39-195`). Likely home: `agent_knowledge` row (like Planning goals) or new column. |
| A3 | On return, agent proactively asks "Are you done with everything on {step}?" — confirm → advance, else continue. | TODO | |
| A4 | The current step drives which right-side panel shows — always exactly one focus. | TODO | Right pane already exists + swaps content: QuestionFlow / FaqReviewPanel / VenueCardsPanel / WhatsAppPairingPanel / BroadcastPanel (`AgentChatPanel.tsx:1620-1688`). Needs to be driven by the persisted step. |
| A5 | When user clicks away to a section (guest list, website), planner records that step as pending; on return it's still "Working on". | TODO | |

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
| C1 | **Plus-one parsing bug**: import missed plus-ones (got only the 72 named guests). Parser DOES support plus-one columns (`guest-import-parsers.ts:90-155` matches "plus one", "+1", "companion") but mapping is pure heuristic — the file's column naming evidently didn't match. Fix: LLM-assisted column mapping / row interpretation fallback. | TODO | Need the actual file from KV to reproduce (E6). |
| C2 | **Voice tagging**: mic in the guest list section — admin rambles about tagging (who's with who, whose rooms covered, who shouldn't see an event); LLM applies tags accurately; asks clarifying questions when unsure. | TODO | Reusable: `useVoiceInput` hook + `/api/concierge/transcribe` (Groq Whisper) already power chat voice. No voice in guest list today. |
| C3 | Highlight the voice feature prominently in the guest list section ("just speak to us and tell us how to tag"). | TODO | |
| C4 | Image upload for guest list (scratch notes → parsed guests). | TODO | Overlaps B4; reuse the rooms Gemini-vision parse pattern. |

## D. Quick UI fixes

| # | Item | Status | Notes |
|---|------|--------|-------|
| D1 | Guest list upload: make the "I have a lawful…" consent note smaller. | TODO | `GuestImportWizard.tsx:1146-1149`, currently 0.8125rem (13px) — already under the 14px floor; legal footnote exception → 0.75rem. |
| D2 | Landing hero heading: a bit smaller at every breakpoint **except mobile**. | TODO | `HeroSection.tsx:97` — `clamp(56px, 10.5vw, 156px)`. Keep 56px min, reduce slope+max, e.g. `clamp(56px, 9vw, 128px)` (tune visually). |

## E. Open questions (answers get logged here)

| # | Question | Answer |
|---|----------|--------|
| E1 | Spine order — dump order (travel BEFORE website, so FAQs are accurate) vs current prompt order (travel after RSVPs)? | ✅ **Dump order**: schedule → travel/stay → website → guest list → RSVPs → rooms → vendors → registry → photos. Update `system-prompt.ts:52` to match. |
| E2 | Skip button semantics — defer-and-resurface vs mark done? What does the bar show when the spine is complete? | ✅ **Defer + resurface**: skip marks step 'skipped' and advances; skipped steps resurface after the rest; bar shows "All caught up" when done/skipped. |
| E3 | Docked chat on Guest List / Rooms — collapsible right panel vs floating widget vs fixed panel? Same conversation as main planner? | ✅ **Collapsible right panel**, open by default on those two pages, collapses to slim edge tab, sits below admin header, shares the main planner conversation, text + voice. |
| E4 | RSVP broadcast — keep existing Whapi/paired-number channel + Pro gate as-is? Is this spine step THE SEND-trigger conversion moment for free users? | ✅ **Yes, SEND-trigger**: everyone gets the drafted broadcast; free users hit the upgrade card at send. |
| E5 | Registry "pay directly" — the existing Stripe payment-link generator is what you mean? Or something new (direct-to-bank, shagun-ledger tie-in)? | ✅ Couples create their own Stripe products dynamically through Phera (Stripe API/MCP); money collected on Phera's Stripe; **forward to couple after the wedding — NOT built yet, don't worry about payout now. Low priority overall.** |
| E6 | The plus-one guest file — need it re-shared (attachment didn't come through). | ⏳ Waiting on KV to re-share. |
| E7 | What to build first? | ✅ **Quick fixes first** (D1, D2, C1) → then Working-on bar (A1–A5) → then spine steps in order. |

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
