# TODO — Concierge Identity & Consent Hardening

Known hardening item on the roadmap: guest verification and consent tracking
for the WhatsApp Concierge flow needs a stronger gate before general
availability.

## Current state

Concierge matches inbound WhatsApp senders to guest records by phone number,
with no additional identity proof, consent record, or opt-out enforcement
wired in yet.

## Gaps

1. No identity proof beyond a phone-number match.
2. No consent record — the `whatsapp_opt_ins` table exists but isn't checked
   or written to by this flow yet. Indian DPDPA 2023 (full enforcement May
   2027) requires explicit opt-in before processing personal data.
3. No opt-out handling — `handleOptOut` in `lib/whatsapp/opt-ins.ts` exists
   but isn't invoked here.
4. Phones matching multiple weddings resolve to an arbitrary first match,
   needs disambiguation.
5. No per-phone rate limiting.

## Dead admin routes — candidates for deletion (added 2026-04-16)

Sidebar nav (OnboardingSidebar) only links these paths under
`/admin/<slug>/`:
overview, details, design, schedule, travel, rsvp-form, faq, registry,
pins, guest-list, guests, rooms, transportation, concierge,
task-manager, coordinator, team.

The pages below exist as routes but have **zero inbound refs** from
sidebar, buttons, or programmatic pushes. Worth deleting unless they're
intentional preview/test surfaces. Verified via grep across app/, components/, lib/.

Per-wedding (under `/admin/[weddingSlug]/`):
- `events/page.tsx` — replaced by `/schedule`. The events admin UI
  writes to `wedding_events` which the schedule page doesn't read,
  causing the duplication issue described in the Event ↔ Schedule
  Data Duplication section below. Delete.
- `communication/page.tsx` — 0 refs.
- `concierge-test/page.tsx` — looks like a dev test surface.
- `pin-entry/page.tsx` — likely a relic from PIN entry refactor (guest
  PIN entry lives under guest routes).
- `shopping/page.tsx` — 0 refs.
- `travel-coordination/page.tsx` — 0 refs (separate from `travel/`).
- `publish/page.tsx` — just a 12-line redirect to `/settings`. Either
  delete or wire something to it.

Top-level (under `/admin/`):
- `events/page.tsx` — 0 refs.
- `guests/page.tsx` — 0 refs.
- `dashboard/page.tsx` — 0 refs.
- `icon-preview/page.tsx` — 0 refs (looks like a dev preview).
- `settings/page.tsx` — 0 refs (per-wedding settings lives under slug).

**Keep:**
- `[weddingSlug]/build-ai/page.tsx` — Build with AI feature, not live yet but planned.
- `[weddingSlug]/control-tower/page.tsx` — explicit user request.
- `[weddingSlug]/upgrade-success/page.tsx` — Stripe redirect target.
- `[weddingSlug]/settings/page.tsx` — gear icon menu probably routes here even if not via Link.
- `admin/new/page.tsx` — used by signup / first-run flow.

Before deleting any, sanity-check by running the dev server and clicking
through the admin to make sure nothing 404s.

## wedding_schedule date drift on wedding_date edit (added 2026-04-16)

In `wedding-service.ts:1345-1366` (`prepopulateScheduleFromTemplate` /
`createSchedule` flow), the schedule's day rows are computed once from
`weddingDateStart` at prepopulation time and never re-synced if the
couple later edits their wedding date. simran-karanvir hit this — the
wedding moved from 2025 to 2026 in `weddings.wedding_date`, but the
`wedding_schedule.date` rows kept the 2025 year, so Concierge weekday
inference and schedule UI both ended up wrong until the rows were
corrected manually.

Fix: when `updateWedding` mutates `wedding_date` (or `wedding_date_end`),
shift every `wedding_schedule` row by the same delta. Or recompute from
the new date if order_index is preserved. Should also handle the case
where the wedding spans more days now (add new schedule day) or fewer
(soft-delete the trailing day).

## Event ↔ Schedule data duplication (added 2026-04-16)

`wedding_events` and `schedule_items` store overlapping event info but are
not linked. Editing an event in `/admin/<slug>/events` doesn't update the
matching row in `/admin/<slug>/schedule`, and vice versa. This caused
Concierge to answer correctly (it reads events) while the schedule admin
view was empty after cleanup.

Options:
- **Merge:** drop `schedule_items`, derive the timeline view from
  `wedding_events` directly (simplest, removes the sync problem entirely).
- **Sync:** keep both, add an upsert hook in `wedding-service.updateEvent`
  / `createEvent` that writes the matching `schedule_items` row.

Pick after we finalize the schedule UX. Until then, admins have to
maintain both sides manually.

## Media support — inbound and outbound (added 2026-04-16)

Concierge is currently text-only. Two related capabilities to add later:

**Inbound (guest → AI):**
- Guest sends a photo ("here's my outfit — does it match the dress code?"). Whapi's Auto Download for images/voice/audio is already enabled, so the payload arrives with a hosted URL. The webhook today drops anything without `msg.text.body`.
- Need: extend `tryConciergeFlow` to grab `msg.image.link` / `msg.voice.link`, push the media through a vision model (Gemini has vision already — GEMINI_API_KEY is wired) or Whisper for voice, then feed the transcribed/described content back into the AI context as part of `userMessage`.

**Outbound (AI → guest):**
- AI should be able to send the dress-code reference image we already store in `wedding_events` (fields `carousel_slides`, `carousel_images`, `outfit_example_url`, `outfit_ideas_women/men`) when a guest asks what to wear.
- `whapiSend` supports an `imageUrl` parameter (see `lib/whatsapp/whapi-client.ts`) — not currently used by the concierge path.
- Add a new tool (sibling to `escalate_to_human`) like `send_event_outfit_reference` that takes an `event_slug` and sends the stored image(s) with a short caption. Let the LLM decide when to use it.

Not urgent — text is enough to validate the product. Revisit once consent + identity hardening lands.

## Proposed work

- [ ] Consent gate before the first AI response to a new phone number.
- [ ] Opt-out keyword handling, tied into `handleOptOut`.
- [ ] Multi-wedding disambiguation when a phone matches more than one guest row.
- [ ] Per-phone rate limiting on the webhook (reuse `lib/utils/rate-limiter.ts`).
- [ ] Consent audit log (given/withdrawn timestamps).
- [ ] Document the flow in `docs/concierge-auth.md` once implemented.

## Related files

- `app/api/vendors/webhook/route.ts` — unified Whapi webhook (Concierge fallback lives here)
- `lib/whatsapp/ai-handler.ts` — AI response generation (not gated on consent today)
- `lib/whatsapp/opt-ins.ts` — existing consent primitives (unused by Whapi flow)
- `lib/whatsapp/webhooks.ts` — `logChatMessage` helper
- `lib/utils/rate-limiter.ts` — existing rate limiter (per-IP, adapt for per-phone)
