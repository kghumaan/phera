# Agent prompt — DPDPA consent flow end-to-end

Drop this whole document into a fresh agent run. Self-contained — no prior conversation needed.

---

## Mission

Design and implement an end-to-end DPDPA-compliant consent flow for Phera (Indian wedding logistics platform), covering every channel where we collect, store, message, or share guest personal data. India's Digital Personal Data Protection Act 2023 reaches full enforcement May 2027 — Phera must be compliant before then, and ideally before public beta launch in 2026.

You are NOT being asked to build a privacy lawyer's checklist. You are building real product surfaces that ship: opt-in screens, consent records, opt-out endpoints, retention crons, audit logs, and admin tooling.

## Repository orientation

- **Codebase root:** `/Users/kvghumaan/Desktop/Code/phera`
- **Stack:** Next.js 15 (App Router) + React 19 + TypeScript + MUI v7 + Supabase (Postgres + RLS)
- **Read first (in order):**
  1. `CLAUDE.md` — design system, WhatsApp API rules, DPDPA section, project conventions
  2. `PIVOT-PLAN.md` — strategic context, target market (NRI-first), pricing
  3. `database-schema.sql` — original schema, where guests + rsvps live
  4. `migrations/` — migrations applied to prod, esp. anything touching `guests`, `wedding_settings`, `whatsapp_opt_ins`, `outreach_events`
  5. `lib/whatsapp/opt-ins.ts` — existing opt-in helpers (createOptIn, checkOptInStatus, getOptInPhone, handleOptOut). Already wired for the WhatsApp Concierge channel.
  6. `lib/supabase/rsvp-service.ts` — search "DPDPA" — already captures `consent_given_at` + `consent_language` when the RSVP form's consent checkbox is ticked
  7. `lib/supabase/types.ts` lines 684-720 — `guests` columns relevant to consent (`consent_given_at`, `consent_language`, `consent_withdrawn_at`, `data_retention_until`, `whatsapp_opted_out`)
  8. `app/api/invites/send-via-concierge/route.ts` — sends WhatsApp templates through Whapi.Cloud. Currently does NOT gate on consent or opt-out flags. This is one of the gaps you'll be closing.
  9. `app/api/access/verify-password/route.ts` + `app/api/access/events/[weddingSlug]/route.ts` — guest-facing entry points
  10. `lib/email/resend.ts` + `app/api/ops/outreach/send/route.ts` — email send paths

## What's already in place (don't re-build)

- `guests` columns: `consent_given_at`, `consent_language`, `consent_withdrawn_at`, `data_retention_until`, `whatsapp_opted_out`
- `whatsapp_opt_ins` table + helper module (`lib/whatsapp/opt-ins.ts`) for the Concierge channel
- RSVP form captures `consent_given_at` + `consent_language='en'` when checkbox ticked
- `outreach_events` table — every WhatsApp Concierge send currently logs a row (success or failure)
- `lib/utils/guest-email.ts` — `isPheraPlaceholderEmail` / `filterRealGuestEmails` — already filters auto-generated `imported-*@phera.io` placeholders so we don't bounce-flood

## Known gaps (your scope)

These are the live concerns the user (Phera founder) flagged before kicking this off. Treat them as a starting list — discover more as you read the code. Do not assume the list is exhaustive.

1. **Concierge send path does NOT consent-gate.**
   - `app/api/invites/send-via-concierge/route.ts` filters guests purely on `phone IS NOT NULL` + audience targeting. It never checks `whatsapp_opted_out`, `consent_given_at`, or `consent_withdrawn_at`. If a guest has been opted out (Meta error 131050 → handleOptOut), this route can still try to send to them.
   - **Fix:** filter the candidate guest set by `whatsapp_opted_out !== true` AND require evidence of consent (either an `whatsapp_opt_ins` row OR `consent_given_at IS NOT NULL`). Surface filtered counts in the API response so admins know how many were skipped and why.

2. **No bilingual consent UI.** RSVP form consent label appears to be English-only. DPDPA Section 5 requires consent notice be available in English + each language listed in the 8th Schedule (Hindi minimum). Build a language toggle that swaps the consent body + records the chosen language to `consent_language`.

3. **No opt-out / withdraw-consent path.** A guest cannot withdraw consent today. Required:
   - Public route (e.g. `/[weddingSlug]/privacy`) where guests can withdraw with a one-click button
   - Sets `consent_withdrawn_at = now()`, `whatsapp_opted_out = true`
   - Triggers data minimization (see #4)
   - Confirmation email + Whapi message acknowledging the withdrawal

4. **Data retention not enforced.** `data_retention_until` exists but nothing reads it. Build:
   - A daily cron (Vercel cron or Supabase scheduled function) that purges `guests` rows + cascading `rsvps`/`outreach_events` after `data_retention_until` passes OR `consent_withdrawn_at + 30 days`
   - A retention default — set `data_retention_until = wedding_date + 90 days` when a guest is created (the wedding-purpose-fulfilled clock)
   - An admin override on the wedding settings page (e.g. "Keep guest data for 6 months / 1 year / forever")

5. **No audit log of consent events.** DPDPA Section 6(7) effectively requires Phera to be able to prove when consent was given, withdrawn, or modified. Build a `consent_events` table:
   ```sql
   id UUID PK
   guest_id UUID FK guests
   wedding_id TEXT
   event_type TEXT  -- 'granted' | 'withdrawn' | 'modified' | 'expired'
   notice_version TEXT  -- which legal notice text the guest saw
   notice_language TEXT
   channel TEXT  -- 'rsvp_form' | 'whatsapp_optin' | 'admin_override' | 'cron_expiry'
   ip_hash TEXT  -- SHA-256 of IP, never raw
   user_agent TEXT
   created_at TIMESTAMPTZ
   ```
   Append a row at every consent state transition. Never UPDATE or DELETE — append-only.

6. **No data subject access (DSAR) path.** DPDPA Section 11 gives data principals the right to access + correct + erase their data. Build:
   - `/[weddingSlug]/my-data` — guest authenticates via the wedding password they already have, sees a JSON export of every row about them across `guests`, `rsvps`, `outreach_events`, `whatsapp_opt_ins`, `consent_events`
   - Email export option (delivered via Resend)
   - Erasure request button → triggers the same withdraw-consent + retention-shorten flow as #3

7. **Breach notification readiness.** DPDPA Section 8(6) requires notifying the Data Protection Board + affected individuals within 72 hours of a breach. We need:
   - A documented breach response runbook in `docs/breach-runbook.md` (you write it)
   - A pre-built notification template for affected guests (English + Hindi)
   - Sentry alert wiring so a breach is detected, not just a vague performance dip

8. **Children's data.** Section 9 — guests under 18 require verifiable parental consent. The current RSVP form has no DOB capture and no parental consent path. Either:
   - Add a "Are you 18+?" checkbox, route minors through a parental-consent flow (parental email entered, parent clicks confirmation link), OR
   - Add explicit terms saying "Phera is not intended for guests under 18; the wedding host is responsible for collecting RSVPs from minors via their parents." (Acceptable for B2B-of-B2C but talk to the user before picking this path.)

9. **Email path doesn't consent-gate.** `app/api/ops/outreach/send/route.ts` and any future Resend path that sends to guest emails must check `consent_given_at IS NOT NULL` AND `consent_withdrawn_at IS NULL` AND `isPheraPlaceholderEmail(guest.email) === false`. Use `filterRealGuestEmails` from `lib/utils/guest-email.ts` for the third check.

## Constraints / non-negotiables (read CLAUDE.md before writing UI)

- **All UI** must use Phera primitives (`PheraDialog`, `PheraTextField`, `PheraCard`, `PrimaryActionButton`, `SecondaryActionButton`, `PageHeading`, `SectionHeading`, etc. — full list in CLAUDE.md). No raw MUI Alert/Switch/Menu. No inline hex.
- **Tokens only** for color/radius/font (`COLORS`, `RADII`, `FONTS` from `lib/theme/tokens.ts`).
- **No red.** Destructive actions (Withdraw Consent, Erase My Data) use brand pink (`COLORS.brand.primary`), never red.
- **`wedding_id` is TEXT (slug)**, not UUID. Don't add FK constraints to a fictional `weddings` table.
- **Migrations:** write the SQL file in `migrations/`, but DO NOT run it yourself. Hand the SQL to the user — they run it in Supabase Dashboard for both production and `phera-test` (project ref `bqogpnirfchgoshtsthp`). Keep schemas in sync.
- **Tests:** every new code path must have Vitest tests. Pattern: see `tests/access-password-and-events.test.ts` (mocks Supabase service-role client cleanly), `tests/rls-integration.test.ts` (RLS verification with the real test project).
- **Whapi.Cloud trial expired** — the Concierge channel returns 404. The user is provisioning a paid channel separately. Don't assume the channel is alive when running send tests; mock it.
- **DPDPA-specific:** consent must be free, specific, informed, unconditional, and unambiguous (Section 6(1)). Pre-checked boxes are illegal. Don't bundle consent with terms-of-service acceptance.

## Deliverable

A single PR (or, if scope demands, a series of commits on a feature branch `feat/dpdpa-consent`) that includes:

1. **Migrations** — `migrations/<date>_dpdpa_consent_log.sql` for `consent_events` table + any retention defaults trigger
2. **API routes:**
   - `POST /api/consent/withdraw` — guest-facing
   - `GET /api/data-export/[guestId]` — DSAR export
   - `POST /api/data-export/[guestId]/email` — delivers export by email
   - `POST /api/cron/data-retention-purge` — Vercel-cron-protected
3. **UI:**
   - Bilingual consent component (English + Hindi minimum) used by RSVP form + any future opt-in surfaces
   - `/[weddingSlug]/privacy` — withdraw-consent + my-data screens
4. **Wiring:**
   - Concierge send path filters by consent flags + opt-out
   - Email send path filters by consent flags + opt-out + `filterRealGuestEmails`
   - All consent state transitions append a `consent_events` row
5. **Docs:**
   - `docs/breach-runbook.md`
   - Update `CLAUDE.md` "DPDPA 2023 Compliance" section with concrete file pointers (replace the abstract bullet list with actionable links)
6. **Tests:** unit tests for every new API route + an integration test that simulates the full lifecycle: consent granted → message sent → consent withdrawn → message blocked → data purged after retention.

## Open product decisions (ask the user — do NOT assume)

These are explicit user-input asks. Don't guess.

1. Default retention period after wedding date (60 days? 90? 6 months? 1 year?). Default after consent withdrawal (immediate? 30-day soft-delete window?).
2. Children's-data path: collect DOB + parental flow, OR shift responsibility to host with explicit terms?
3. Where should the bilingual consent toggle live in RSVP form UX? (Top of form, inline near submit button, modal before submit?)
4. Should withdrawing consent automatically RSVP "no" to all events, or just block messaging?
5. White Glove tier — does the human coordinator get to override consent flags (e.g. "phoned guest, got verbal consent")? If yes, that override must itself produce a `consent_events` row with `channel='admin_override'` and an admin user_id.
6. Languages beyond English + Hindi for v1? (DPDPA 8th Schedule lists 22.) Most NRI couples = English + Hindi covers it for beta.

## Definition of done

- A guest cannot receive any message (WhatsApp or email) from Phera without an affirmative `consent_given_at` AND `consent_withdrawn_at IS NULL` AND `whatsapp_opted_out !== true`.
- A guest can withdraw consent in one click and is verifiably purged within the retention window.
- An admin can show a regulator a `consent_events` row proving when consent was granted, the language they saw, and the IP hash + user agent at the time.
- All flows have Vitest coverage; the integration test exercises the lifecycle end-to-end.
- CLAUDE.md DPDPA section is updated with file pointers, not just principles.

Report blockers as `⚠️ BLOCKER: <description>` per the CLAUDE.md error-reporting convention. If a product question is open, ask the user — do not pick.
