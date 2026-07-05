# Phera Mobile — Grand Plan

React Native app for iOS (priority) + Android, built with **Expo + expo-router + Tamagui**, living in `mobile/` inside this repo. Same Supabase backend, same design language as the web app. This document is the roadmap **and** the living tracker — update checkboxes as screens ship.

---

## 1. Product decisions (locked 2026-07-04)

| Decision | Choice |
|---|---|
| Scope | **Full parity** — admin (couple) + guest experience + AI Planner, sequenced in phases below |
| Repo layout | `mobile/` folder in this repo, own `package.json`. Root Next.js build excludes it (`tsconfig.json` excludes `mobile`) |
| Tooling | **Expo SDK (managed) + EAS Build**, expo-router for file-based routing, OTA updates via EAS Update |
| UI kit | **Tamagui** — universal (native + web), themed with Phera tokens |
| Stores | Apple App Store first, Google Play second — one codebase, both from day one |
| Verification | Every screen runs on **Expo Web at iPhone viewport (390×844)**, screenshot-compared against the web app before moving on. Periodic real-device checks via Expo Go by Kanwar |

### What stays web-only (deliberately out of scope)
- Marketing/SEO pages (`/`, `/about`, `/planners`, `/blog`, `/legal`, `/privacy`, `/terms`, `/contact`, `/demo`, `/vendors` public directory)
- Internal ops console (`/ops`), Agent Lab (`/agent-lab`), design-system sandbox (`/_design-system`), test pages
- **Look & Feel** website-builder (visual website editing is a desktop activity; mobile links out)
- Stripe **checkout** happens in an in-app browser sheet against the existing web checkout (keeps PCI + App Store rules simple). Note: digital-service purchases via Stripe on iOS need care re: App Store guideline 3.1.1 — Phera sells a *real-world event service*, which is allowed to use external payment (like Airbnb/StubHub), documented in §8.

---

## 2. Architecture

```
mobile/
  app/                     # expo-router routes (mirrors Next.js App Router mental model)
    (auth)/                #   login, signup, callback
    (admin)/[weddingSlug]/ #   couple-facing tabs + stack screens
    (guest)/[weddingSlug]/ #   guest portal screens
    _layout.tsx            #   root: TamaguiProvider, QueryClientProvider, AuthProvider, fonts
  components/              # Tamagui primitives (ports of components/shared/*) + feature components
    ui/                    #   PheraButton, PheraCard, PheraChip, PheraInput, PheraSwitch, EmptyState, StatCard, PageHeading, PheraDialog(Sheet)…
  lib/
    theme/                 #   tokens.ts (mirror of web tokens, px numbers), tamagui.config.ts
    supabase/              #   RN client (AsyncStorage session persistence, PKCE)
    api/                   #   typed fetchers for phera.io API routes (agent SSE, stripe, whatsapp…)
    data/                  #   TanStack Query hooks per domain (guests, rsvps, travel, …)
    mock/                  #   preview-mode fixtures (used when no env / for store screenshots + tests)
  assets/fonts/            # Outfit + Instrument Serif (bundled, not runtime-fetched)
  tests/                   # vitest unit tests for logic; component tests where valuable
```

### Data access — two lanes
1. **Supabase direct** (reads/writes with RLS, Realtime): guests, rsvps, travel, transportation, schedule/events, comments, room assignments. Same anon key + auth session as web; RLS already enforces per-wedding access. Client uses `@supabase/supabase-js` with `AsyncStorage` storage, `detectSessionInUrl: false`.
2. **HTTPS to the deployed web app's API routes** (`https://phera.io/api/*`, configurable base URL): everything server-side — Agent chat (SSE), AI parsing, WhatsApp sends, Stripe, invites. Authenticated by forwarding the Supabase access token (`Authorization: Bearer`) — **Phase 2 includes a small web-side change**: API routes used by mobile must accept bearer tokens, not just cookies (add a helper `lib/supabase/server-auth.ts` that checks both; new code alongside existing, per repo rules).

### Key libraries
- `tamagui` + `@tamagui/config` — UI; custom theme from Phera tokens
- `@tanstack/react-query` — server state, caching, pull-to-refresh, optimistic updates
- `@supabase/supabase-js` + `@react-native-async-storage/async-storage` — auth + data
- `expo-router`, `expo-font`, `expo-image`, `expo-haptics`, `expo-web-browser`, `expo-notifications` (Phase 7), `react-native-svg`
- `zod` for API payload validation at the boundary

### Guest background convention (audited from web source — do not guess)
| Guest page | Background | Web source |
|---|---|---|
| Home, FAQ, Cultural Guide, Travel, access gate | couple's `wedding.background_image` → fallback app default `blue-clouds.webp` | `OptimizedBackground src={wedding?.background_image} useAppDefault` |
| RSVP | app default `blue-clouds.webp` | `rsvp/page.tsx` `useAppDefault={true}` |
| Details hub | `pearl.webp` (hardcoded) | `details/page.tsx:247` |
| Schedule | `jade.webp` (hardcoded) | `schedule/page.tsx:517` |
| Events | `aquarium.webp` (hardcoded) | `events/page.tsx:64` |

Mobile implements this in `GuestChrome.tsx`: `background="pearl|jade|aquarium|clouds"` for the hardcoded pages, `background="theme"` + `themeBackgroundPath={wedding.background_image}` elsewhere (`resolveWeddingBackground` maps bundled paths to assets and loads anything else as a remote URI). When adding a guest screen, check the web page's `OptimizedBackground` src first — never pick a texture by eye.

### Design-token strategy
`mobile/lib/theme/tokens.ts` mirrors `lib/theme/tokens.ts` **with RN-native values** (numbers instead of `'12px'`, font family names instead of CSS vars). A unit test asserts the color hexes stay in sync with the web file (reads both, compares) so drift is caught in CI. Tamagui theme maps: `$brandPrimary`, `$textStrong`, `$bgPaper`, etc. Fonts: **Outfit** (body) + **Instrument Serif** (display ≥ 32px) bundled via `expo-font`. All the CLAUDE.md design rules apply on mobile: 14px minimum text, `RADII.md`=12 for buttons/inputs, `RADII.cta`=24 for guest CTAs, destructive = brand pink never red.

### Environment
```
EXPO_PUBLIC_SUPABASE_URL=       # same project as web
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=https://phera.io   # or http://localhost:3000 in dev
```
`mobile/.env.example` documents these. **Preview mode:** when env vars are absent (e.g. cloud dev sessions, App Store screenshot generation), the app boots against `lib/mock/` fixtures with a visible "Preview data" badge. This is also what powers screenshot verification in CI-like environments.

---

## 3. Verification protocol (every screen, no exceptions)

1. Build the screen with Tamagui against mock fixtures.
2. `npx expo start --web` → Playwright (pre-installed Chromium) at **390×844** (iPhone 14/15 class) → screenshot.
3. Compare side-by-side with the web app at the same viewport. **The comparison baseline now runs locally**: `NEXT_PUBLIC_PHERA_MOCK=1 next dev` renders guest pages from `lib/mock/mock-wedding-data.ts` (no DB needed) — Playwright pre-seeds the access-gate localStorage keys and screenshots each page at 390×844. The bar: **same or better** — structure, copy, spacing, type scale, colors.
4. Interactions exercised in the web build (tap targets ≥ 44pt, keyboard avoidance, scroll).
5. `npx tsc --noEmit` + `npx vitest run` green in `mobile/`.
6. Commit per screen-group with screenshots noted in the message.
7. Kanwar spot-checks milestones on real iPhone via Expo Go (`npx expo start` on his machine) — anything native-only (safe areas on notch, haptics, keyboard) gets flagged for that pass.

Expo Web ≠ iOS pixel-for-pixel, but Tamagui renders the same layout tree; it catches 95% of issues. Native-only risks (safe-area insets, font metrics, momentum scroll) are listed per-phase for device passes.

---

## 4. Phases & screen inventory

Statuses: `[ ]` todo · `[~]` in progress · `[x]` built + verified

### Phase 0 — Foundation (no product screens until this is green)
- [x] Expo scaffold in `mobile/` (SDK 57, RN 0.86), TypeScript strict, expo-router
- [x] Tamagui config themed with Phera tokens; Outfit + Instrument Serif bundled and loading
- [x] Core UI primitives: `PheraText`, `PheraButton` (primary/secondary/ghost + loading treatment), `PheraCard` (default/muted/feature/hero), `PheraInput`, `PheraChip` (all 9 tones), `PheraSwitch`, `PageHeading`/`SectionHeading`, `EmptyState`, `StatCard`, alerts (Info/Success/Warning/Error)
- [x] `PheraSheet` (mobile stand-in for PheraDialog) — animated bottom sheet with handle, title row, pinned footer
- [x] Design-gallery dev screen (`/gallery`) rendering every primitive (visual regression anchor)
- [x] Supabase client + AuthProvider (session persist/refresh) + preview-mode fallback
- [~] TanStack Query provider wired; typed bearer-auth API fetcher still to come (with Phase 2)
- [x] Navigation skeleton: login → admin tabs (Overview/Guests/Planner/Schedule/More); deep-link scheme `phera://`
- [x] Token-sync unit test (8 passing); `npm run typecheck` + `npm test` scripts

### Phase 1 — Auth + Admin core (the daily-driver screens)
- [x] Login — full web parity: sign-in with sign-up fallback (identities-empty wrong-password detection), OTP verification step (auto-verifies at 6 digits, resend/go-back), native Google OAuth via expo-web-browser + PKCE code exchange
- [x] Signup (merged into login, web pattern) + deep-link session handling — `phera://` links resolve via `createSessionFromUrl` (PKCE code or token-hash forms); magic links land automatically
- [x] Wedding switcher (single-wedding accounts route straight in; multi shows picker; `useWeddings` = owned + `wedding_admins` collaborations)
- [x] **Overview** dashboard — real hooks (`useRsvps` aggregate matches web math: head-count, pending, declined), tappable stat cards, pull-to-refresh
- [~] **Guest list** — search ✓, RSVP filters ✓, side chips ✓, guest detail sheet ✓, add guest ✓ (edit/delete + CSV import pending)
- [x] **Guest responses / RSVPs** — summary pills, dietary-needs section, response cards with party size + messages (`/responses`, reached from Overview)
- [x] **Wedding details** — hero card + facts list (couple, venue with TBD warning, dates, RSVP deadline, guest-site link); editing stays on web/Planner for now
- [x] Admin tab bar: Overview · Guests · Planner · Schedule · More

### Phase 2 — AI Planner (the differentiator)
- [x] Planner chat — real SSE from `/api/agent/chat` when live (expo/fetch streaming, bearer auth, conversationId continuity, error surface), scripted mock in preview. tool_done/confirmation/question panels still to come
- [x] In-chat confirmation flow — confirmation_required events render an action card (shield, summary, Decline/Confirm), resolution POSTs /api/agent/confirm and streams the agent's follow-up; success/warning haptics; preview mock exercises the whole loop
- [ ] Conversation list / resume (`/api/agent/conversations`)
- [ ] Voice input (expo-av → existing transcribe route) — stretch, flag if API needs work
- [x] **Web-side change:** `getAuthenticatedClient` (lib/utils/auth-helpers.ts) now accepts `Authorization: Bearer` alongside cookies — every route using it is mobile-callable

### Phase 3 — Logistics (Phera's operational core)
- [~] **Schedule / events** admin — day-by-day timeline view ✓ (major-event markers, Venue-TBD warnings, real `wedding_schedule`/`schedule_items` queries); create/edit pending
- [~] **Travel** dashboard — guest flights grouped by arrival day with shuttle-preference chips (`guest_flights` join; NOTE: the web admin "travel" page is a CMS section editor — mobile shows the operational arrivals view instead). Hotels/checklist pending
- [~] **Transportation** — arrival/departure toggle, vehicles with live capacity bars (booked/available math mirrors web `getAllVehiclesWithCapacity`), reservation list with pending/confirmed states. Assign/confirm actions pending
- [~] **Room assignments** — rooms grouped by hotel with placed/capacity chips and assigned-guest chips (`wedding_rooms`, slug-keyed, `assigned_guest_ids` uuid[]); tap-assign pending
- [~] **Task manager** — To Do / Doing / Done segmented board with counts, task sheet with move actions (`wedding_tasks`, UUID-keyed); create/delete pending

### Phase 4 — Comms & concierge
- [~] **Messaging** — broadcast list with status chips + delivered/replied progress bars (`concierge_broadcasts` + recipients rollup, slug-keyed); compose pending. NOTE: web `/messaging` + `/concierge` are redirects to whatsapp-bot — mobile gives them first-class screens
- [~] **Concierge** — guests reached / messages handled / avg response time stat cards + recent conversations (`whatsapp_chat_history` grouped by guest, UUID-keyed; web uses service-role for this — verify RLS allows couple reads when live); conversation detail pending
- [ ] **Control tower** (live guest-comm dashboard) — `admin/[slug]/control-tower`
- [ ] **Knowledge bank** — `admin/[slug]/knowledge-bank`
- [ ] **WhatsApp bot** settings — `admin/[slug]/whatsapp-bot`

### Phase 5 — Guest experience (mobile routes live under `/guest/[weddingSlug]` to avoid admin path collision)
- [x] Guest access/auth — two-step gate (wedding password → name match) calling the same `/api/access/*` routes; session mirrors web localStorage keys in AsyncStorage with 24h TTL, "switch guest" supported
- [~] Wedding home ✓ (serif hero, radius-24 RSVP/View Details CTAs) + **details hub** ✓ + FAQ ✓ (accordions); registry + where-to-shop pending
- [x] **Schedule & events** — guest views with dress codes + ritual names; per-guest `guest_event_access` filtering wired via `/api/access/events/[slug]` (fails open like web; all events in preview)
- [x] **RSVP flow** — attending picker, party-size stepper, food-preference chips, dietary + message, submit works (upsert contract matches web `submitRSVP`: `guest_id,event_id,wedding_id`, event 'general')
- [ ] **Travel form + travel details** (flight collection, `guest_flights` conventions)
- [ ] **Transportation** (shuttle times, pickup info)
- [ ] **Cultural guide** (derived from wedding_events — the "reverse destination guest" feature)

### Phase 6 — Remaining admin + account
- [~] Collaborators ✓ (owner/admins/pending invites with role chips — same email-resolution limits as web); Event access, RSVP-form builder, FAQ/Registry/Where-to-shop editors stay web-first
- [ ] Vendor management + marketplace (browse/save/contact)
- [~] Settings ✓ (guest-site link with native share, wedding password reveal, publish + concierge status, signed-in account, sign out); Account billing/upgrade + Support pending
- [ ] Onboarding for new couples (port `app/onboarding` wizard, or v1: "create your wedding on web" hand-off — decide when we get here)

### Phase 7 — Native polish & store readiness
- [ ] Push notifications (expo-notifications; new `device_tokens` table + web API route; RSVP/escalation/agent-reply notifications)
- [ ] Deep links + universal links (`phera.io/*` → app), magic-link auth via deep link
- [x] Offline behavior — TanStack Query cache persists to AsyncStorage (24h), cold starts render last-known data instantly then refetch
- [ ] Haptics, pull-to-refresh everywhere, skeleton loaders, error boundaries
- [~] App icons ✓ (lotus-flame on brand pink, generated from public/logo-lotus-flame assets: iOS icon, Android adaptive set, splash on paper, favicon); store listings + privacy manifests pending
- [x] EAS Build profiles (dev/preview/production in `mobile/eas.json`); TestFlight submission steps documented in `mobile/README.md` — needs Kanwar's Expo login + Apple Developer account, runs from his machine
- [ ] Sentry React Native

---

## 5. Sequencing logic

Phases ship in order; within a phase, screens ship one at a time, each fully verified before the next (per the protocol in §3). Phases 1–2 produce a TestFlight-able app for couples (the paying user) — that's the first store milestone. Guest experience (Phase 5) is the second store milestone (guests download when they get their invite link). Everything else layers in behind feature flags.

## 6. Testing

- Vitest in `mobile/` for logic (data hooks, formatters, token sync, mock fixtures)
- Screen-level render tests where cheap; visual verification per §3 is the primary UI gate
- Root repo tests untouched; `npx vitest run` at root must stay green (mobile excluded from root config)

## 7. Risks / flags

- **API route auth**: cookie-based today; bearer support is a prerequisite for Phase 2+ (small, additive web change)
- **Instrument Serif on native**: needs real font files bundled; licensing is OFL — fine
- **MUI parity**: complex web widgets (tables, drag-drop room assignment) need mobile-idiomatic redesigns (lists + sheets), not literal ports — flag anything ambiguous to Kanwar per CLAUDE.md rule 7
- **App Store 3.1.1**: Phera sells real-world event services → external purchase permitted; revisit if any digital-only SKU appears

## 8. Session log

- **2026-07-04 (session 8)** — Live-mode completion: web `getAuthenticatedClient` accepts bearer tokens (mobile can call agent routes); login reached full web parity (sign-up fallback, OTP step, native Google OAuth, phera:// magic-link handling); Planner streams real SSE via expo/fetch with conversation continuity; Collaborators screen; offline query persistence (AsyncStorage, 24h). Phone preview shipped at `<vercel-branch-preview>/app` (public/app embed, preview-only). Remaining items need Kanwar: allowlist phera.io+supabase for live verification, Expo/Apple accounts for TestFlight, then the in-chat confirmation UI + push notifications ride on a dev build.

- **2026-07-04 (session 7)** — Store readiness + Settings. Phera-branded app icons generated from the lotus-flame logo (iOS 1024, Android adaptive fg/bg/mono, splash on paper, favicon), `eas.json` build profiles, rewritten `mobile/README.md` with Expo Go and TestFlight instructions. Guest backgrounds corrected to the audited web sources (pearl/jade/aquarium/theme-resolver) earlier this session. New admin Settings screen (guest link share, password reveal, publish/concierge status chips, account + sign out) wired from More. Verified, zero page errors, tests green.
- **2026-07-04 (session 6)** — **Web-comparison workflow + guest visual parity.** Added env-gated web mock mode (`lib/mock/mock-wedding-data.ts` + a guarded early-return in `WeddingContext.fetchWeddingData`, active only when `NEXT_PUBLIC_PHERA_MOCK=1`; production untouched) so `next dev` renders guest pages without a DB — these are now the screenshot baseline. Rebuilt the guest screens that diverged: **RSVP is now the web's multi-step wizard** (X + tracked title, white card with dark border, segmented progress, exact step headings/copy/emojis, list-row radios, uppercase BACK/NEXT; login step intentionally skipped — mobile guests are already gate-identified), **details hub** is the centered caps menu with champagne diamond ornaments on ivory texture, **schedule** matches the web day-cards (caps day headings, pink accent bars, time right, location pins, More Details links) on sage texture, **home** has the live countdown pill + serif hero + pinned RSVP pill, and events/FAQ/cultural/travel adopted the shared `GuestScreen` chrome (circular back button + tracked caps title). Global top-padding bump (admin screens `insets.top+24`; guest header is its own 56px row). All flows re-verified, zero page errors; mobile 8/8, root 1444 green.
- **2026-07-04 (session 5)** — Guest portal (Phase 5 core): access gate (password → name match, preview accepts any 4+ char password), home hero, details hub, guest schedule/events/FAQ, and a working RSVP flow (verified end-to-end: gate → pick Anita → RSVP yes, party 2, vegetarian → submitted). Guest routes live at `/guest/[weddingSlug]`; session helpers in `src/lib/guest/`. Login screen gained an "I'm a wedding guest →" entry link. All zero page errors; mobile 8/8, root 1444 green.
- **2026-07-04 (session 4)** — Room Assignments, Tasks (with working move-column mutation), Messaging (broadcast delivery/reply progress), Concierge (stats + conversations). Preview sessions now persist across reloads (AsyncStorage). Screen scroll content got safe-area bottom padding (+48) so nothing crowds the home indicator. All four screens + full tab/detail regression sweeps verified at 390×844, zero page errors; mobile 8/8, root 1444 green. wedding_id key cheat-sheet: rooms/broadcasts = slug; tasks/chat_history = UUID.
- **2026-07-04 (session 3)** — Wedding Details, Travel (guest flights by arrival day + shuttle prefs), Transportation (vehicles with live capacity, reservations, direction toggle). **Navigation restructure:** admin is now a Stack containing a `(tabs)` group, with detail screens (responses/details/travel/transportation) pushed above the tab bar — hidden-tab (`href: null`) screens broke back-navigation on web (scene overlay kept intercepting taps). **Bug fixed by verification:** `useLocalSearchParams` returns `{}` on tab screens mounted by tab press — all screens now use `useWeddingSlug()` (`src/lib/nav.ts`) which falls back to `useGlobalSearchParams`. Travel/transport tables key on wedding UUID (like schedule); `guest_flights`/`guest_hotels` are dedicated tables, NOT `logistics_data`. All flows re-verified (details/travel/transport sweep + full tab regression), zero page errors; mobile 8/8, root 1444 green.
- **2026-07-04 (session 2)** — Data layer + core screens. `src/lib/data/` hooks run the same Supabase queries as web (guests/rsvps by slug, events/schedule by UUID — a `weddings` table DOES exist despite older CLAUDE.md wording; `useWeddings` unions owned + `wedding_admins`). Preview mode routes the same hooks to fixtures. Shipped: wedding switcher, real Overview stats, Guest List (search/filters/detail sheet/add guest with in-preview persistence), Guest Responses, Schedule timeline, Planner chat UI with streaming (mock script in preview), PheraSheet, pull-to-refresh + haptics. All flows exercised end-to-end via Playwright at 390×844, zero page errors. **Environment gotchas learned:** Metro's file watcher doesn't work in this container — restart `expo start` after editing before re-verifying; RNW drops `testID` on Pressable/View (works on TextInput) — use `accessibilityLabel` for e2e selectors.
- **2026-07-04** — Branch `claude/react-native-mobile-app-1s5eu5` off `main`. Plan authored. Phase 0 built and visually verified via Expo Web at 390×844 (login, overview, guests, planner/schedule placeholders, more, full design gallery — zero console errors). Login screen is a line-by-line port of `app/auth/login/page.tsx` (cloud background, frosted card, Google pill, pink CTA). Overview + Guest List render against mock fixtures with the "Preview data" badge. **Environment note:** this cloud session's network policy blocks `phera.io`, so production screenshot comparison wasn't possible — colors/radii are instead enforced by `mobile/tests/token-sync.test.ts` against the web token file, and Kanwar should spot-check on a real device via Expo Go (`cd mobile && npx expo start`). OTP step, Google OAuth, magic links, and real Supabase queries are the next Phase 1 items.
