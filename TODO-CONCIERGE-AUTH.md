# TODO — Concierge Identity & Consent Hardening

Tracking gaps in how we verify a WhatsApp sender is actually a legitimate guest of a specific wedding.

## Current state (as of 2026-04-16)

The unified Whapi webhook at `app/api/vendors/webhook/route.ts` (Concierge fallback branch in `tryConciergeFlow`) trusts any inbound phone number that matches a row in `guests.phone` for some wedding. First match wins. No consent gate, no OTP, no opt-in record.

## Gaps

1. **No identity proof.** Anyone with access to a guest's phone number can chat with Concierge as that guest.
2. **No DPDPA consent record.** Indian DPDPA 2023 (full enforcement May 2027) requires explicit opt-in before processing personal data. `whatsapp_opt_ins` table exists but the Whapi flow doesn't check or write to it.
3. **No opt-out path.** Guest who replies STOP is not flagged. `handleOptOut` in `lib/whatsapp/opt-ins.ts` exists but is not invoked.
4. **Ambiguous multi-wedding phones.** A phone that appears in multiple `guests` rows (attending multiple weddings) always resolves to the first match.
5. **No rate limiting.** A single sender can flood the webhook with no per-phone throttle.

## Phone → wedding disambiguation (added 2026-04-16)

Current lookup `tryConciergeFlow` grabs the first `guests` row matching the sender's phone regardless of wedding. For testing we've hardcoded the reality to simran-karanvir by only having one guest row for this phone, but in production a single phone will belong to multiple weddings (friends attending several). Today:

- First-match wins, arbitrary order.
- No way for the sender to indicate which wedding they're asking about.
- AI is fed data for whichever wedding happened to match first.

When revisiting this:
- Either persist a "last active wedding" per phone so follow-up messages stay in context.
- Or when >1 match, reply with a numbered disambiguation prompt and cache the selection.
- Either way, the reply should include a footer "(asking about Priya & Rahul's wedding)" so the guest notices if we matched the wrong event.

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
  causing the duplication issue we just hit. Delete.
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
inference and schedule UI both ended up wrong until I patched the
rows manually.

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

- [ ] First-contact consent template: when an unknown phone matches a guest, send a one-time Meta-approved template asking "Are you Priya Sharma attending Simran & Karanvir's wedding? Reply YES to continue." Don't process the real question until YES received. Store the YES timestamp in `whatsapp_opt_ins.consent_given_at`.
- [ ] Gate `tryConciergeFlow` on `checkOptInStatus` — if no opt-in yet, skip AI response and trigger the consent template instead.
- [ ] STOP keyword handler: if inbound text matches `^(stop|unsubscribe|opt.?out)$`, call `handleOptOut`, set `whatsapp_opt_ins.consent_withdrawn_at`, send confirmation, stop all future AI responses from that phone.
- [ ] Multi-wedding disambiguation: when phone matches >1 guest row, send a "Which wedding are you asking about?" reply with numbered options. Persist the selected wedding for the session.
- [ ] Per-phone rate limit in the webhook (reuse `lib/utils/rate-limiter.ts`): e.g. 20 msgs / 15 min before 429'ing.
- [ ] Audit log: every inbound+outbound msg writes to `chat_messages` (already does via `logChatMessage`) plus a per-consent-event log so we can prove when consent was given/withdrawn.
- [ ] Document flow in `docs/concierge-auth.md` once implemented.

## Related files

- `app/api/vendors/webhook/route.ts` — unified Whapi webhook (Concierge fallback lives here)
- `lib/whatsapp/ai-handler.ts` — AI response generation (not gated on consent today)
- `lib/whatsapp/opt-ins.ts` — existing consent primitives (unused by Whapi flow)
- `lib/whatsapp/webhooks.ts` — `logChatMessage` helper
- `lib/utils/rate-limiter.ts` — existing rate limiter (per-IP, adapt for per-phone)
