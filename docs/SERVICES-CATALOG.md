# Phera Services Catalog

> **Living document.** The running list of everything Phera offers or plans to offer, and where each lives. The AI Planner routes couples to these; the sidebar exposes each one standalone. Keep this in sync as services ship.
>
> Last updated: 2026-06-29 · Source: code audit + service-design fan-out (`feature/phera-agent`)
>
> **Profit lens lives in `docs/MONETIZATION.md`** — how each service makes (or doesn't make) money, the honest reconciled numbers, and the phased revenue roadmap. Journey/routing lives in `docs/PLANNER-JOURNEY.md`.

---

## Legend

**Status**
- `LIVE` — fully built and usable today.
- `PARTIAL` — works but incomplete (missing self-serve UI, scope, or automation).
- `PLANNED` — not built; delivered as **managed** concierge work until it ships.
- `ON-HOLD` — built but deliberately **not promoted** yet (founder decision).

**Access**
- `Free` — included for everyone (RSVPs included free).
- `Pro` — requires the paid one-time plan. Gate on `isPro`, **never sub-tier** — all paid tiers get all features; the Premium upcharge is managed-service, not extra features.
- `Managed` — Phera's human team does the work (sourcing, booking, curation). The Planner captures a brief; ops fulfills.
- `Mixed` — free core with Pro polish, or self-serve + managed paths.

**Framing rule for not-yet-built:** never fake automation. `PLANNED`/`ON-HOLD` services are captured as a real brief and framed as *"our team will handle it"* (managed) or *"coming soon"* — never presented as a live self-serve button.

---

## 1. Master matrix

| # | Service | Status | Access | Category | Sidebar home |
|---|---------|--------|--------|----------|--------------|
| 1 | Schedule / multi-day events | LIVE | Free | Logistics & travel | Logistics › Schedule & Events |
| 2 | Wedding website builder + design | LIVE | Mixed | Website & content | Your Website › Design & Look |
| 3 | FAQs + knowledge bank | LIVE | Free | Website & content | Your Website › FAQs & Knowledge |
| 4 | Registry & where-to-shop | LIVE | Free | Website & content | Your Website › Registry |
| 5 | Guest list management + import | LIVE | Free | Guests | Guests › Guest List |
| 6 | RSVP collection (per event) | LIVE | Free | Guests | Guests › RSVPs |
| 7 | RSVP form customization | LIVE | Free | Guests | Guests › RSVP Form |
| 8 | Guest households + family liaisons | PARTIAL | Free | Guests | Guests › Households & Liaisons |
| 9 | Guest data collection (logistics enrichment) | PARTIAL | Mixed | Guests | Guests › Guest Details |
| 10 | Guest logistics profile | LIVE | Free | Logistics & travel | Guests › Guest Logistics |
| 11 | Travel & flight tracking | LIVE | Free | Logistics & travel | Logistics › Travel & Flights |
| 12 | Room / hotel assignments | LIVE | Pro | Logistics & travel | Logistics › Room Assignments |
| 13 | Shuttle / transportation | LIVE | Pro | Logistics & travel | Logistics › Transportation |
| 14 | Day-of run-sheet / timeline | PARTIAL | Pro | Logistics & travel | Logistics › Run-Sheet |
| 15 | WhatsApp concierge for guests | LIVE | Pro | Communications | Comms › Guest Concierge |
| 16 | Broadcast messaging (+ data collection) | LIVE | Pro | Communications | Comms › Broadcasts |
| 17 | Automated notifications & reminders | PARTIAL | Pro | Communications | Comms › Reminders |
| 18 | Save-the-dates send | ON-HOLD | Pro | Communications | *(hidden — not exposed)* |
| 19 | Vendor coordination & tracking | LIVE | Pro | Vendors & venue | Vendors › Coordination |
| 20 | Vendor directory browse | PARTIAL | Free | Vendors & venue | Vendors › Browse Directory |
| 21 | Vendor sourcing & booking | PLANNED | Managed | Vendors & venue | Vendors › Find Vendors |
| 22 | Venue finding & booking | PLANNED | Managed | Vendors & venue | Vendors › Find a Venue |
| 23 | Shared photo album | PLANNED | Managed | Memories | Memories › Shared Album |
| 24 | Multi-currency plan tiers | LIVE | Mixed | Account | Account › Plan & Billing |
| 25 | DPDPA consent & data retention | PARTIAL | Free | Account | Account › Consent & Data |
| 26 | Planner agency accounts | PARTIAL | Managed | Account | Account › Agency |

Backlog (industry gaps not yet in the catalog) is in **§3**.

---

## 2. Service specs (built / partial / planned)

### Vendors & venue

**Venue finding & booking** — `PLANNED` · `Managed`
One-liner: Find and book the venue(s) for each event — handled by the concierge team, not self-serve.
What it does: No software flow yet. The Planner captures a structured brief (city/region, dates/flexibility, guest count + per-event headcounts, event types needing a venue, budget, style, catering/alcohol needs) and routes it to the human team, who source, shortlist, negotiate and book. The agreed venue writes back to the wedding record so it flows into website/schedule/travel.
Planner activation: When venue is "TBD", *"Do you already have your venue(s), or should our team find and book them for you?"* → collects the brief, logs a managed request.
Code: `weddings` row, `wedding_events` (per-event venue) — no dedicated page yet.

**Vendor sourcing & booking** — `PLANNED` · `Managed`
One-liner: Source and book actual vendors (caterer, decor, photographer, mehndi, DJ, priest…) — managed; the browsable directory is the only built piece.
What it does: Procurement (shortlist → quote → negotiate → contract) is not automated. The Planner captures which categories are still open + requirements + budget per category and routes a managed brief. Once a vendor is engaged it's added to `vendors` so it becomes trackable in Coordination.
Planner activation: *"Which vendors do you still need? Want our team to source and book this, or do you already have someone?"*
Code: `lib/vendors/directory/service.ts`, `scripts/ingest-vendors.ts`, `vendor_directory`, `vendors`.

**Vendor coordination & tracking** — `LIVE` · `Pro`
One-liner: Track all your vendor WhatsApp group chats in one place with AI-extracted action items, decisions and deadlines.
What it does: Phera's number (via Whapi.Cloud) joins the couple's vendor WhatsApp groups; messages are stored and run through AI extraction for summaries/action items/insights; @Phera mentions can auto-reply. This is the operational hub once vendors are engaged.
Planner activation: *"Add Phera's number to your vendor groups and I'll track every chat — pulling out action items and deadlines so nothing slips."* (Pro)
Code: `app/admin/[weddingSlug]/vendor-management/`, `lib/vendors/whapi-client.ts`, `lib/vendors/ai-extractor.ts`, `app/api/vendors/webhook/route.ts`.

**Vendor directory browse** — `PARTIAL` · `Free`
One-liner: Browse a curated vendor list — discovery only; no in-app booking yet.
What it does: Browsable `vendor_directory` (~26 seed rows, expandable via Google Places ingest). Read-only discovery; booking is the managed Sourcing path. Gives couples a starting shortlist to hand to the team.
Planner activation: *"Want to browse vendors near [city]? Pick one and our team takes it from there."*
Code: `app/vendors/`, `lib/vendors/directory/service.ts`, `scripts/ingest-vendors.ts`, `scripts/enrich-vendors.ts`.

### Website & content

**Wedding website builder + design (Look & Feel)** — `LIVE` · `Mixed`
One-liner: A branded multi-day wedding microsite the couple designs and publishes at their slug.
What it does: Guest-facing site at the TEXT-slug URL. Theme/colors/fonts/hero, story content, event sections; renders schedule, FAQ, registry, travel, RSVP. Core builder is free; Pro unlocks premium polish (custom domain, advanced design, de-branding).
Planner activation: *"I'll publish a draft at phera.io/your-names with your dates and venue already in — you tweak the look whenever."* (seeds from onboarding basics)
Code: `app/admin/[weddingSlug]/look-and-feel/page.tsx`, `app/(guest)/[weddingSlug]/`, `lib/supabase/wedding-service.ts`.

**FAQs + knowledge bank** — `LIVE` · `Free`
One-liner: A couple-curated Q&A that publishes as the site FAQ **and** grounds the concierge AI.
What it does: Couple maintains FAQs (dress code, directions, gifting, kids, parking, hotels). Publishes to the site and serves as the concierge knowledge base. Includes AI auto-generation of common entries from venue/event context.
Planner activation: *"I'll pre-write the FAQs guests always ask from what I know about your venue — you just approve or tweak."*
Code: `app/admin/[weddingSlug]/faq/`, `app/admin/[weddingSlug]/knowledge-bank/`, `lib/knowledge/destination-knowledge.ts`, `lib/concierge/generate-knowledge.ts`.

**Registry & where-to-shop** — `LIVE` · `Free`
One-liner: Gift/cash registry block + a "where to shop" guide for NRI guests buying outfits/gifts.
What it does: Registry items/links (external URLs, honeymoon-fund framing) + a curated shop guide. Both self-serve, free, rendered on the guest site; an agent tool can add registry entries from chat.
Planner activation: *"Want a registry or a 'where to shop' note so guests aren't guessing on gifts?"*
Code: `app/admin/[weddingSlug]/registry/`, `app/admin/[weddingSlug]/where-to-shop/`, `app/api/registry`, `components/admin/ShopTemplates`.
> ⚠️ Western-framed — see **§3** for the missing **shagun / cash-gift ledger** that Indian families actually keep.

### Guests

**Guest list management + import** — `LIVE` · `Free`
One-liner: The master guest list with bulk import, tags, and per-guest detail — the population every other service runs on.
What it does: Add guests singly or via the import wizard (paste/upload, map columns). Each row carries name, phone (required contact), email, `wedding_side`, `avatar_color`, plus `logistics_data` JSONB and outreach/liaison columns. `GuestDetailDrawer` surfaces RSVP + contact + logistics per guest.
Planner activation: *"Paste or upload your list — even a rough one — and everything else runs off it."*
Code: `app/admin/[weddingSlug]/guest-list/`, `components/admin/guests/GuestImportWizard.tsx`, `lib/agent/tools/guests.ts`.

**RSVP collection (per event)** — `LIVE` · `Free`
One-liner: Guests RSVP yes/no/maybe **per event** on the website; captured to `rsvps`.
What it does: Per-event responses (Mehndi, Sangeet, Ceremony, Reception…) with `guest_count` and dietary, feeding per-event attendance counts and the Planner snapshot. Free including on the free tier.
Planner activation: *"I'll switch on per-event RSVP so you get live headcounts — no spreadsheets."*
Code: `lib/supabase/rsvp-service.ts`, `app/admin/[weddingSlug]/guest-responses/`, `app/admin/[weddingSlug]/rsvp-form/`.

**RSVP form customization** — `LIVE` · `Free`
One-liner: Couples add their own RSVP questions (meal choice, song requests, plus-ones, allergies, kids).
What it does: Custom questions on top of yes/no/maybe + guest_count + dietary; answers captured per RSVP (feeding meal counts, song lists, allergy data).
Planner activation: *"Anything specific to ask when they RSVP — meal choice, song requests, kids coming?"*
Code: `app/admin/[weddingSlug]/rsvp-form/page.tsx`, `lib/supabase/rsvp-service.ts`.

**Guest households + family liaisons** — `PARTIAL` · `Free`
One-liner: Designate one guest to RSVP / share details on behalf of their family group.
What it does: Modeled on `guests`: `is_family_liaison` + `liaison_for[]`. Lets the Planner/concierge route one ask to a liaison for the whole family. Real in data, partial in surface — no households table, no household admin view yet; grouping is via columns + tags.
Planner activation: *"Looks like the Sharma family came in together — make [name] the family contact so we ping one person for all four?"*
Code: `lib/agent/tools/guests.ts`, `guests.is_family_liaison`, `guests.liaison_for`.

**Guest data collection (logistics enrichment)** — `PARTIAL` · `Mixed`
One-liner: Progressively fill each guest's `logistics_data` (passport, visa, hotel, arrival/departure, emergency contact, language).
What it does: No single intake form yet; collection is assembled from RSVP custom questions (free), and from concierge replies + broadcast-with-data-schema (Pro), where `extractBroadcastData` maps a free-form reply to the requested fields. Admin can hand-edit in the drawer.
Planner activation: *"Want me to ask guests for flight + arrival details? I'll file the answers against each guest automatically."*
Code: `lib/whatsapp/extract-broadcast-data.ts`, `lib/whatsapp/ai-handler.ts`, `components/admin/guests/GuestDetailDrawer.tsx`.

### Logistics & travel

**Guest logistics profile** — `LIVE` · `Free`
One-liner: Per-guest logistics record that powers every downstream travel/transport/room decision.
What it does: Structured `guests.logistics_data`: passport_name, visa_status, hotel, arrival/departure datetimes, emergency contact, language_preference. The backbone for NRI/destination weddings; read by rooms, shuttles, travel, concierge.
Planner activation: *"I'll start a logistics profile per guest — passports for visa letters, who lands when, where they're staying."*
Code: `lib/supabase/travel-service.ts`, `lib/supabase/rooms-service.ts`, `guests.logistics_data`.

**Travel & flight tracking** — `LIVE` · `Free`
One-liner: Collects each guest's flights and travel to-dos → a master arrivals/departures timeline for airport pickups.
What it does: Flight details (airline, number, airports, datetimes) + travel-prep tasks; builds an arrivals timeline that feeds shuttle scheduling and room check-in timing.
Planner activation: *"Let's track everyone's flights so we know who lands when and can line up pickups."*
Code: `lib/supabase/travel-service.ts`, `guest_flights`.

**Room / hotel assignments** — `LIVE` · `Pro`
One-liner: Upload a floorplan/room list → AI parses it into rooms → drag-and-drop guests in.
What it does: Upload rooming list/floorplan (image/PDF); AI parses to `wedding_rooms` (room_number canonicalized, floor, hotel, bed_type, capacity, notes); drag guests into `assigned_guest_ids`. Min 5 guests; Pro.
Planner activation: *"Drop in your hotel's rooming list and I'll turn it into rooms you can drag guests into — keep families and elders together."*
Code: `lib/supabase/rooms-service.ts`, `wedding_rooms`.
> ⚠️ Assigns rooms but doesn't manage the **block** (group rate, per-guest booking links, cut-off dates) — see **§3**.

**Shuttle / transportation** — `LIVE` · `Pro`
One-liner: Schedules guest shuttles across events; sizes capacity from RSVP party size + arrival flights.
What it does: Routes/slots between hotels, venues, airport. Two modes: prescheduled (fixed slots) and flexible (on-request). Reservations carry party_size vs vehicle capacity; flight times drive airport-transfer demand.
Planner activation: *"I'll size each run from your RSVP counts and arrival flights — fixed slots or flexible pickups?"*
Code: `lib/supabase/transportation-service.ts`, `transportation_reservations`.

**Schedule / multi-day events** — `LIVE` · `Free`
One-liner: The multi-day itinerary — Mehndi/Haldi/Sangeet/Ceremony/Reception — with dress codes and ritual notes.
What it does: `wedding_events` (name, timing, venue, dress_code + description + icon, ritual_name + description), organized into schedule days with ordered `schedule_items`. A reconciliation engine keeps days in sync with the date range. RSVPs track per event. The **keystone** — RSVP, travel, shuttles, rooms, reminders, run-sheet all hang off it.
Planner activation: *"Tell me the functions you're hosting and roughly when — I'll build the multi-day schedule with dress codes and ritual notes."*
Code: `app/admin/[weddingSlug]/schedule/`, `lib/schedule/`, `wedding_events`, `schedule_items`.

**Day-of run-sheet / timeline** — `PARTIAL` · `Pro`
One-liner: Minute-by-minute day-of timeline so family and vendors run on one schedule.
What it does: Partially built on top of the schedule. The operational version a coordinator needs — vendor call times (decor in at 6am, soundcheck, first-look, caterer service start), an owner per block — is the gap (see **§3**: vendor-synced run-sheet).
Planner activation (deferred): *"The minute-by-minute run-sheet I'll build closer in — I'll note it."* (activate when `days_until_wedding < ~21`)
Code: `app/admin/[weddingSlug]/schedule/`, `wedding_events`.

### Communications

**WhatsApp concierge for guests** — `LIVE` · `Pro`
One-liner: An AI concierge on the Phera number that answers each guest 24/7 **and** quietly captures their logistics.
What it does: Guests message the branded number; AI answers (schedule, venue, travel, dress code, FAQs) grounded in real wedding data, and runs 8 write-back tools (`update_guest_rsvp/flight/hotel/visa/notes`, `create_coordination_issue`, `escalate_to_human`). One thread both informs the guest and collects RSVP + flight + hotel + visa into the DB without a form. Runs in WhatsApp's free 24h window; respects opt-out.
Planner activation: *"Turn on a concierge so guests text your wedding number for instant answers, while we quietly collect their RSVP and flight details."*
Code: `lib/whatsapp/ai-handler.ts`, `lib/whatsapp/concierge-system-prompt.ts`, `lib/whatsapp/concierge-tools.ts`, `app/admin/[weddingSlug]/concierge`.

**Broadcast messaging (+ optional data collection)** — `LIVE` · `Pro`
One-liner: Send a WhatsApp broadcast to a segment and optionally collect structured replies.
What it does: Compose → send to a segment with per-recipient delivery tracking. Optional `data_schema` makes it a data-collection ask; replies are mapped back to `logistics_data` (e.g. flight sync to transport). Respects opt-in/out.
Planner activation: *"I can broadcast this to [segment] — want me to also ask for arrival details and auto-file the answers?"*
Code: `lib/supabase/broadcasts-service.ts`, `lib/whatsapp/extract-broadcast-data.ts`, `components/admin/concierge/BroadcastComposer.tsx`.

**Automated notifications & reminders** — `PARTIAL` · `Pro`
One-liner: Scheduled WhatsApp nudges — event reminders, day-before summary, travel/shuttle alerts, thank-you.
What it does: Approved templates (`SCHEDULE_REMINDER`, `DAY_BEFORE_SUMMARY`, `TRAVEL_REQUEST`, `SHUTTLE_ASSIGNMENT`, `RSVP_CONFIRMATION`, `THANK_YOU`) + sender + scheduler (`outreach_sequences`). Partial: per-couple scheduling UI / auto-triggering isn't a self-serve toggle yet — ops sets it up. Honors pure-en/pure-hi, opt-out, utility-vs-marketing rules.
Planner activation: *"Once your schedule and shuttles are set, I'll queue reminders — event, day-before, shuttle pickup, thank-you."* (capture-and-defer; never fire early)
Code: `lib/whatsapp/outreach-templates.ts`, `lib/whatsapp/outreach-sender.ts`, `lib/supabase/outreach-service.ts`.

**Save-the-dates send** — `ON-HOLD` · `Pro`
One-liner: Automated save-the-date / early-invite blast — built, but parked and **not promoted**.
What it does: `SAVE_THE_DATE`, `RSVP_REQUEST`, `MULTI_EVENT_INVITE`, `LOGISTICS_INTRO`, `NUDGE`, `CULTURAL_GUIDE` templates + sender + sequencer exist. Per the hybrid model the couple ideally sends the first save-the-date themselves via `wa.me` deep links. **Founder decision: do not surface or promote.**
Planner activation: **Do not promote.** If asked, note it's not available self-serve yet; offer a personal `wa.me` deep link or hand to the team.
Code: `lib/whatsapp/outreach-templates.ts`, `lib/whatsapp/outreach-sender.ts`, `lib/whatsapp/deep-links.ts`.

### Memories

**Shared photo album (guests + couple)** — `PLANNED` · `Managed`
One-liner: One shared album pooling every photo from every event for guests and the couple.
What it does: Intended single gallery (guests upload / QR per event; couple gets a consolidated album). A Lapse-style component (`components/shared/LapseIntegration.tsx`) was scaffolded but is **imported nowhere** — no backend, storage, upload pipeline, table, or guest route. Until built, delivered as managed work (team stands up + curates).
Planner activation: *"Want one shared album where everyone's photos land in one place? Our team sets that up for you — shall I note it?"* (managed brief; never imply self-serve)
Code: `components/shared/LapseIntegration.tsx` (scaffold only).

### Account & compliance

**Multi-currency plan tiers (Free / Pro / Managed)** — `LIVE` · `Mixed`
One-liner: Pricing surface in the couple's currency; Free core, Pro unlock, Managed upsell.
What it does: USD/INR pricing. **Gate on `isPro`, not sub-tier** — all paid tiers get all features; Premium = managed-service upcharge, not more features.
Planner activation: *"A few things you switched on sit on Pro — want the tier and pricing in your currency?"* (only when a Pro service was actually activated, or a managed brief captured)

**DPDPA consent & data retention** — `PARTIAL` · `Free`
One-liner: Consent capture (English + Hindi) + retention/erasure built into data flows.
What it does: `consent_given_at`/`consent_language`/`consent_withdrawn_at`/`data_retention_until` on `guests`; first WhatsApp message asks consent. Partial: not a unified, always-on posture yet.
Planner activation: *"Since we're collecting passport/travel details I'll set the consent notice in English and Hindi so it's DPDPA-clean."* (**establish at the moment any personal data is collected** — see journey CP-Travel)

**Planner agency accounts** — `PARTIAL` · `Managed`
One-liner: Agency accounts for planners running multiple weddings (the #1 GTM channel).
What it does: `planner_profiles` exists. Partial: no portfolio view; the agent snapshot is single-wedding-scoped, so a planner is mis-served unless detected up front (see journey **Entry router**).
Planner activation: *"Running several weddings? I'll set you up an agency account and we'll run this per couple."*

---

## 3. Backlog — industry gaps to add

Surfaced by the completeness critics. These are services a full-service Indian/NRI wedding operation provides that Phera doesn't model yet. **Priority order reflects leverage** (monetizes data we already collect, or is a stated moat). Suggested tier in brackets.

### Tier A — finish/build next (monetizes data we already half-collect, or is the moat)

1. **Catering headcount & dietary aggregation** `[Pro]` — We capture dietary per RSVP but never roll it up. Caterers need hard per-event, per-restriction sub-counts: pure-veg vs non-veg, Jain (no onion/garlic/root), halal, vegan, nut/gluten allergies, kids' meals — and they differ per function. *"We handle guest logistics" is hollow if the food count is still in a spreadsheet; one over/under-cater at a 300-person reception breaks trust.*
2. **Reverse-destination cultural / ritual guide** `[Free, some managed content]` — **The stated #1 moat** (non-Indian guests), yet in zero checkpoints. Per-event "what is a Sangeet/Haldi/baraat/pheras", what-to-wear, ritual meaning, dietary-unfamiliarity handling, a "first Indian wedding?" concierge mode. No Western tool can copy this.
3. **Budget tracker + vendor payment schedule (multi-currency)** `[Managed/Pro]` — Planners (the #1 GTM channel) run on a budget sheet + deposit/balance calendar with FX across USD/INR. Without it, Phera is a guest-comms add-on around the planner's real system, not the system of record.
4. **Shagun / cash-gift ledger** `[Free]` — **v1 shipped (agent-driven, 2026-06-29):** `record_shagun` / `get_shagun_ledger` tools store each guest's gift in `guests.logistics_data.shagun` (no migration), with per-currency totals; the Planner offers it and feeds thank-yous. Couple-only, never a take-rate. *Still to build:* a dedicated admin ledger UI (tap-an-amount per guest) and the optional digital-collection layer (flat-fee). Culturally non-negotiable — its absence signals the product wasn't built by people who run Indian weddings.
5. **Vendor-synced day-of run-sheet** `[Pro]` — Upgrade the partial run-sheet (#14) into a real cue sheet with vendor call times tied to vendor records. This is what makes "wedding operations" true.

### Tier B — high-delight, build when capacity allows

6. **Reception seating & table assignments** `[Pro]` — Distinct from room blocks: head table, stage/sofa, family-front rows, side-bride/side-groom balance across 30–40 tables. We already model `wedding_side` + households.
7. **Per-event outfit / dress-code coordinator** `[Free]` — Concrete "what do I wear to Haldi vs Reception" per function; distinct from a generic FAQ line. High-value, low-effort.
8. **Pre-event sign-ups (sangeet performances, mehndi slots, dance practice)** `[Free]` — Slot/performance management on top of schedule + guest list; a recurring WhatsApp headache, unique to Indian weddings.
9. **Per-event guest segmentation / visibility control** `[Free]` — Control which guests see/RSVP which events (intimate ceremony vs open reception). Today family-only functions can leak to the full list.
10. **Multilingual guest experience** `[Free]` — Not just consent: RSVP, FAQ, schedule, concierge in Hindi/Gujarati/Punjabi/Tamil + English. Mono-lingual UX excludes both ends of the NRI list.

### Tier C — managed-tier services (don't build self-serve UI; gate to Managed)

11. **Livestream for remote / can't-attend guests** `[Managed]` — NRI-specific: a whole side often can't travel. Branded ceremony livestream with a watch link pushed to "no/maybe" RSVPs converts absence into inclusion.
12. **Hotel room blocks & group-booking links** `[Managed/partial]` — Upstream of assignments: negotiate group rate, per-guest booking links, booked-vs-assigned tracking, cut-off dates. The hospitality spine for destination weddings.
13. **Welcome hamper / hospitality-desk logistics** `[Managed]` — Per-room/per-household welcome bags + arrival desk, tied to arrival/travel data. Premium, on-brand.
14. **Formal e-invitation / digital invite card** `[Managed]` — The designed (often animated/PDF, per-function) card Indian families still send — distinct from save-the-date and website. Without it couples leave for Canva/WhatsApp.
15. **Travel-document / e-visa & OCI guidance** `[Managed]` — Reverse-destination guests need e-Visa/OCI help; NRI families juggle passport-name matching (we already store `passport_name`). A natural logistics-profile extension.
16. **Thank-you / return-favour tracking (post-wedding)** `[Managed]` — Post-event thank-yous + return favours (mithai/trousseau), fed by the gift/shagun log. Closes the loop and gives a clean, compliant last touch before DPDPA erasure.
17. **Photography shot list & family-photo group builder** `[Managed]` — Auto-draft named photo groups ("bride's maternal side", "all cousins") from `wedding_side` + households. Niche but a genuine pain.
18. **Vendor contract & document vault** `[Managed]` — Signed contracts/COIs/docs alongside live coordination. Without it planners keep truth in email/Drive and coordination stays a satellite.

> **Discipline (critic risk):** this is a long list — don't chase all of it. Finish the half-built operational items in Tier A (dietary aggregation, run-sheet, room blocks) that monetize data we already collect, ship the moat (#2), and **gate genuinely services-heavy items to the Managed tier** rather than building self-serve UI for each. Several (shagun, passport/e-visa, livestream recordings) ingest sensitive financial/personal data — design them into the consent/retention model from the start.

---

## 4. Cross-service data dependencies

Everything keys off the wedding **slug** (`wedding_id` TEXT). Activation order matters because services consume each other's data:

```
Schedule (events)  ──┬─► RSVP (per event) ──► Dietary/headcount aggregation [Tier A]
                     ├─► Reminders / run-sheet (anchored to event dates)
                     └─► Shuttles (need event venues + times)

Guest list ──┬─► Households / liaisons
             ├─► RSVP ──► party size ─► Shuttles capacity
             ├─► Logistics profile ──┬─► Travel/flights ──► Shuttles (airport transfers)
             │                       └─► Rooms (who's sharing, check-in timing)
             └─► Concierge / Broadcast ──► writes back to logistics_data + RSVP

Website ──► hosts RSVP + FAQ + Registry
FAQ / knowledge bank ──► grounds the Concierge AI

Vendors (engaged) ──► Coordination ──► (future) run-sheet vendor call times + contract vault
Venue ──► writes back to wedding record ──► unblocks Website/Schedule/Travel/Shuttles

Any personal-data collection ──► DPDPA consent posture (establish at point of collection)
Any Pro activation ──► plan-tier surface
```

**Implication for the Planner:** activate in dependency order — schedule → guest list → RSVP → logistics cluster (travel → rooms → shuttles) → comms → vendors/venue → registry → memories → plan/consent. See `docs/PLANNER-JOURNEY.md`.
