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
