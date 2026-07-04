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
3. Compare side-by-side with the web app at the same viewport (production `phera.io` when reachable, or local `next dev` when env allows). The bar: **same or better** — spacing, type scale, colors token-accurate.
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
- [ ] `PheraSheet` (mobile stand-in for PheraDialog) — build with first screen that needs a modal
- [x] Design-gallery dev screen (`/gallery`) rendering every primitive (visual regression anchor)
- [x] Supabase client + AuthProvider (session persist/refresh) + preview-mode fallback
- [~] TanStack Query provider wired; typed bearer-auth API fetcher still to come (with Phase 2)
- [x] Navigation skeleton: login → admin tabs (Overview/Guests/Planner/Schedule/More); deep-link scheme `phera://`
- [x] Token-sync unit test (8 passing); `npm run typecheck` + `npm test` scripts

### Phase 1 — Auth + Admin core (the daily-driver screens)
- [ ] Login (email/password + magic link) — mirrors `app/auth/login`
- [ ] Signup + auth callback / deep-link session handling
- [ ] Wedding switcher (multi-wedding accounts land here; single-wedding goes straight in)
- [ ] **Overview** dashboard (stat cards, next actions) — `admin/[slug]/overview`
- [ ] **Guest list** (search, filters, side chips, guest detail sheet, add/edit guest, CSV import → links out or "do it on web" empty-action) — `admin/[slug]/guest-list`
- [ ] **Guest responses / RSVPs** (per-event attending yes/no/maybe, counts, dietary) — `admin/[slug]/guest-responses`
- [ ] **Wedding details** (venues, dates, couple info; TBD placeholders honored) — `admin/[slug]/details`
- [ ] Admin tab bar: Overview · Guests · Planner (Phase 2) · Schedule · More

### Phase 2 — AI Planner (the differentiator)
- [ ] Planner chat screen with SSE streaming from `/api/agent/chat` (port of `admin/[slug]/assistant`) — native keyboard handling, streaming bubbles, starter chips
- [ ] In-chat confirmation flow for gated/write tools (mirror web contract from `lib/agent/`)
- [ ] Conversation list / resume (`/api/agent/conversations`)
- [ ] Voice input (expo-av → existing transcribe route) — stretch, flag if API needs work
- [ ] **Web-side change:** bearer-token auth acceptance on agent routes (new helper, no modification to DO-NOT-MODIFY files)

### Phase 3 — Logistics (Phera's operational core)
- [ ] **Schedule / events** admin (event list, create/edit, per-event access) — `admin/[slug]/schedule`
- [ ] **Travel** dashboard (arrivals/departures, flight statuses, guest travel detail) — `admin/[slug]/travel`
- [ ] **Transportation** (shuttles, vehicles, assignments) — `admin/[slug]/transportation`
- [ ] **Room assignments** (hotels, rooms, drag-assign → tap-assign pattern on mobile) — `admin/[slug]/room-assignments`
- [ ] **Task manager** — `admin/[slug]/task-manager`

### Phase 4 — Comms & concierge
- [ ] **Messaging** (WhatsApp templates, broadcasts, opt-in states) — `admin/[slug]/messaging`
- [ ] **Concierge** inbox (conversations, AI-suggested replies, stats) — `admin/[slug]/concierge`
- [ ] **Control tower** (live guest-comm dashboard) — `admin/[slug]/control-tower`
- [ ] **Knowledge bank** — `admin/[slug]/knowledge-bank`
- [ ] **WhatsApp bot** settings — `admin/[slug]/whatsapp-bot`

### Phase 5 — Guest experience (`(guest)/[weddingSlug]` portal)
- [ ] Guest access/auth (name-match / password / pin flows via `/api/access/*`)
- [ ] Wedding home + **details** + FAQ + registry + where-to-shop
- [ ] **Schedule & events** (guest view, per-event access rules)
- [ ] **RSVP flow** (multi-event, guest_count, dietary; CTA radius 24) 
- [ ] **Travel form + travel details** (flight collection, `logistics_data` conventions)
- [ ] **Transportation** (shuttle times, pickup info)
- [ ] **Cultural guide** (the "reverse destination guest" feature)

### Phase 6 — Remaining admin + account
- [ ] Collaborators, Event access, RSVP-form builder (read/simple-edit; complex building links to web), FAQ editor, Registry editor, Where-to-shop editor
- [ ] Vendor management + marketplace (browse/save/contact)
- [ ] Settings, Account (billing status; upgrade → web checkout in in-app browser sheet), Support
- [ ] Onboarding for new couples (port `app/onboarding` wizard, or v1: "create your wedding on web" hand-off — decide when we get here)

### Phase 7 — Native polish & store readiness
- [ ] Push notifications (expo-notifications; new `device_tokens` table + web API route; RSVP/escalation/agent-reply notifications)
- [ ] Deep links + universal links (`phera.io/*` → app), magic-link auth via deep link
- [ ] Offline behavior (Query persistence, optimistic writes, retry queues)
- [ ] Haptics, pull-to-refresh everywhere, skeleton loaders, error boundaries
- [ ] App icons, splash, store listings, privacy manifests (Apple privacy nutrition labels; DPDPA-aligned data disclosure)
- [ ] EAS Build profiles (dev/preview/production), TestFlight + Play internal track
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

- **2026-07-04** — Branch `claude/react-native-mobile-app-1s5eu5` off `main`. Plan authored. Phase 0 built and visually verified via Expo Web at 390×844 (login, overview, guests, planner/schedule placeholders, more, full design gallery — zero console errors). Login screen is a line-by-line port of `app/auth/login/page.tsx` (cloud background, frosted card, Google pill, pink CTA). Overview + Guest List render against mock fixtures with the "Preview data" badge. **Environment note:** this cloud session's network policy blocks `phera.io`, so production screenshot comparison wasn't possible — colors/radii are instead enforced by `mobile/tests/token-sync.test.ts` against the web token file, and Kanwar should spot-check on a real device via Expo Go (`cd mobile && npx expo start`). OTP step, Google OAuth, magic links, and real Supabase queries are the next Phase 1 items.
