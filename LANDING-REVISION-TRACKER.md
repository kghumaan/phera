# Landing & Onboarding Revision Tracker

Started 2026-06-25 from a low-level UX/clarity/consistency review of the landing page + onboarding. This tracks the agreed changes: what's **done in-code**, what's a **build to schedule**, and what **needs KV to run/decide**.

## Founder answers captured (ground truth for copy)
- **$349 Base** is a **one-time, per-wedding** fee and **includes all WhatsApp message costs**. No subscription.
- **Domestic US weddings are supported.** Only *vendor management/directory* is not yet live for US cities (everything else works).
- **White Glove ($599)** = a managed service **for the couple's guests**, plus a **live human coordinator on standby** who can do anything the AI planner can't yet (incl. website/experience changes). It is **not** a planner/white-label tier.
- **Phera-for-Planners ($249/wedding)** = pay-per-wedding reseller account. **No white-labeling** (couples still see "Phera"). White Glove is sold to couples, not planners — note potential channel overlap but not a blocker.
- **Talk-to-a-human before buying**: we want this. Admin already has a "speak to a human / custom request" modal (`FeatureRequestModal`); mirror that intent on the landing page (WhatsApp / email / book-a-call).

## Done in-code (this pass)
- [x] Hero: added free-vs-paid qualifier line under the CTA.
- [x] Unified the primary free CTA label to **"Start free"** (Hero / Meet-planner / Final CTA) and routed them to `/auth/signup` → `/welcome` (the AI-vs-manual fork) so signups stop bypassing it.
- [x] `app/auth/login` `getOnboardingUrl()` now sends new users to `/welcome` (not the manual `/onboarding` form) as a belt-and-suspenders fix.
- [x] FeatureStepper: cut the redundant "AI planner" step 01 (MeetYourPlanner owns it); renumbered; added **Free/Base** tier tags to each step.
- [x] FeatureStepper transportation step rewritten to shipped reality (collect flight/arrival info via the WhatsApp bot → assign each guest to the best planned shuttle → send pickup details). Dropped "driver dispatch / route optimization / live arrival board / real-time map."
- [x] FeatureStepper vendor step: "Find them. **Add** them. We coordinate the rest." (dropped "Book them"); kept the real "add Phera to your vendor WhatsApp groups" coordination.
- [x] Added a **Broadcast & collect** beat (broadcast any message/question to every guest, collect replies) — this is real (`/api/concierge/broadcasts/send`).
- [x] Vendor count: **confirmed 1,259 live** in `vendor_directory` (2026-06-25 via `count-vendors.ts`) — "1,200+" was true after all. Restored a conservative "1,200+" via single source (`lib/landing/vendor-directory-copy.ts`), which both the FeatureStepper vendor step and VendorSpotlight now read.
- [x] VendorSpotlight: "India's top…" → **"Asia's top…"** (cities span India, Thailand, Indonesia, UAE).
- [x] Pricing: "MOST CHOSEN" → **"RECOMMENDED"**; prose summaries aligned to the actual feature bullets; paid CTAs now disclose price ("Get Base — $349", "Get White Glove — $599"); "Activate concierge" no longer fires a silent checkout.
- [x] FAQ: "basic RSVPs" → "RSVPs with custom questions"; retention claim reconciled (see retention item).
- [x] Onboarding: **RSVP Collection `isPro: false`** (RSVPs are free, matching the pricing tier).
- [x] Nav: "Service" → **"Features"**; added a **"Vendors"** link (gave VendorSpotlight a section id).
- [x] Demo CTAs standardized to **"Try the live demo"** + a "no signup, sample wedding" note.
- [x] Talk-to-a-human path added to the landing page.
- [x] Retention COPY reconciled across FAQ ↔ Privacy ↔ Terms (single policy).

## Builds to schedule (not shipped yet — need a focused, reviewed pass)
- [x] **Bulk vendor ingest (Google Places) — ALREADY RAN.** Prod `vendor_directory` = ~1,259 vendors across all 9 cities (Jaipur 171, Goa 159, Udaipur 143, Kerala 126, Jodhpur 105, Dubai 86, Rishikesh 81, Bangkok 72, Bali 57). 974 google_places + 26 curated + more. `ingest-vendors.ts` stays available for top-ups.
- [x] **Data-retention deletion job — LIVE + verified.** Core in `lib/retention/run-data-retention.ts`; 90 days after the wedding date it deletes `comments` + `rsvps` and clears `guests.logistics_data` PII (keeps the base guest record). **Runs daily via the existing `/api/cron/demo-cleanup` cron** (04:00 UTC) — folded in there because Vercel Hobby caps the plan at 2 cron slots (both used). Live by default; on-demand at `/api/cron/data-retention` (CRON_SECRET) with `?dry=1` preview.
  - **NEVER purges:** `demo-template` (demo seed/clone source), `simran-karanvir` (`TEMPLATE_WEDDING_SLUG`), any `demo-*`/`agent-lab-*` wedding, or epoch/TBD-dated weddings. (The dry-run caught the template would've wiped 156 PII rows — exclusion added + re-verified.)
  - **Verified:** 34 weddings scanned → 2 expired (junk test weddings) → 0 real rows removed; live run via the daily cron returned `removed: {0,0,0}`, `ok: true`. Copy reconciled (FAQ + Privacy = 90 days for responses/comments).
  - **Demo cleanup confirmed healthy** (`scripts/check-demo-weddings.ts`): 0 lingering demo clones, `demo-template` present. No extra cron needed.
  - Future extension: also age out `wedding_travel_cards` + WhatsApp logs per the Privacy schedule (12 mo).
- [x] **Public `/vendors` directory page — SHIPPED + verified (HTTP 200, live data).** `app/vendors/page.tsx` (SSR first page, SEO metadata) + `VendorsDirectoryClient.tsx` (city/category/NRI filters, load-more). No login; contact (phone/email) gated behind signup, website shown. Landing "Browse all vendors" → `/vendors`; footer link added. Design-system clean (token colors, no inline hex). Note: many vendors lack price/specialties/NRI until `enrich-vendors.ts` runs — optional follow-up.
- [x] **Dedicated planner page — SHIPPED + verified (HTTP 200).** `app/planners/page.tsx`: $249/wedding pay-per-wedding pitch, 3-step "how it works", feature list (from `PLANNER_TIER`), honest no-white-label note, "Start as a planner" → `/auth/login?role=planner` (→ `/onboarding?role=planner`), "Book a call" → WhatsApp. The pricing planner-strip CTA now routes here instead of straight to a $249 Stripe checkout; footer "For Planners" link added.
- [ ] **#4 — Shuttle flight-collection + assignment (IN PROGRESS).** Most infra already exists; this connects it. Slices:
  1. [x] **Admin "Request flight details" action — SHIPPED.** `RequestFlightDetailsButton` + a banner in the Transportation dashboard fire a pre-filled broadcast (all guests, collects: airport / arrival date+time / airline+flight / needs-shuttle?). Made `BroadcastComposer` pre-fillable (backward-compatible). Lint+tsc clean. (Needs a visual in-app check.)
  2. [x] **Land collected replies → `guest_flights` — SHIPPED.** `lib/transportation/sync-flight-from-broadcast.ts` maps a flight reply's `collected_data` → `guest_flights` (arrival airport / datetime / airline+flight / `shuttle_preference_time` + a human-readable note). **Merge semantics** — only fills empty columns so admin edits win. Called best-effort from `recordBroadcastReplyForGuest`. Parsers (time/date/airline-flight) unit-verified against real + garbage inputs; garbage → null, dates timezone-safe. (Slash dates like 12/04 are ambiguous → raw kept in the note for admin override.)
  3. **Finalize assignment logic** — assign each guest to the best already-planned shuttle by arrival time, respecting `getVehicleCapacityStatus`.
  4. **Edge cases → admin tracking** — shuttle full / no sensible shuttle for a party / no flight info → surface to admins (coordination issues / escalations).
  - Existing pieces: broadcast+collect (`broadcasts-service`, `extract-broadcast-data`), flights (`travel-service`), shuttle capacity/reservations (`transportation-service`).
- [ ] **Book shuttle services for the couple** (future) — via the vendor marketplace (pick provider → book capacity). Phase 2 of transportation.
- [ ] **#5 — Shared album → Google Photos (DEFERRED, simplified per KV).** No custom upload build. Per wedding: store one Google Photos album link + broadcast it to all guests (reuses the broadcast system from #4). Just needs an album-link field + a "share album" broadcast action.

## Needs KV to run / decide
- [x] **Confirm live vendor count.** Done — 1,259 live (count-vendors.ts).
- [ ] **Decide pricing placement** — currently kept below the feature scroll ("see what they're buying first"). Say the word to move it above.
- [ ] **Review the retention dry-run** before the deletion cron goes live (once built).

## Runbook — bulk vendor fetch
```bash
# 1. Set GOOGLE_PLACES_API_KEY in .env.local (Google Cloud → enable "Places API (New)")
# 2. Dry-run a single city/category to sanity-check:
npx tsx scripts/ingest-vendors.ts --city Goa --category photographer --dry-run
# 3. Full run (all 9 cities × 10 categories, ~up to ~1,800 candidates):
npx tsx scripts/ingest-vendors.ts
# 4. Enrich (specialties, languages, portfolio):
npx tsx scripts/enrich-vendors.ts
# 5. Confirm the new count:
npx tsx scripts/count-vendors.ts
```
