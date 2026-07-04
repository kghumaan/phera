# Phera Mobile

React Native app (Expo SDK 57 + expo-router) for iOS and Android.
Grand plan + living screen tracker: [`../MOBILE-PLAN.md`](../MOBILE-PLAN.md).

## Run it on your iPhone today (Expo Go)

1. Install **Expo Go** from the App Store.
2. On your Mac (same Wi-Fi as the phone):
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
3. Scan the QR code with the iPhone camera → opens in Expo Go.

**No `.env` needed** — without one the app runs in **preview mode** (mock
Priya & Rahul wedding, "Preview data" badge, every screen browsable, writes
persist in-session). For live data, copy `.env.example` → `.env` and fill in
the Supabase URL + anon key (same values as the web app's
`NEXT_PUBLIC_SUPABASE_*`), then restart `expo start`.

Web preview (no phone): `npx expo start --web`.

## TestFlight (when you want real installs)

One-time setup: an [Expo account](https://expo.dev) (free) and an Apple
Developer membership ($99/yr). Then:

```bash
npm install -g eas-cli
eas login
cd mobile
eas build --platform ios --profile production   # cloud build, ~15 min
eas submit --platform ios                        # uploads to TestFlight
```

`eas.json` profiles are already configured (development / preview /
production). First run walks you through Apple credentials automatically.
Android internal testing works the same with `--platform android`.

## Development

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest (includes web↔mobile token-sync test)
```

- Design tokens: `src/lib/theme/tokens.ts` — must stay in sync with the web
  `lib/theme/tokens.ts` (enforced by `tests/token-sync.test.ts`).
- Guest background convention: see `src/components/guest/GuestChrome.tsx`
  and MOBILE-PLAN.md §2 — check the web page's `OptimizedBackground` before
  adding a screen.
- Visual verification loop (cloud sessions): web app runs with
  `NEXT_PUBLIC_PHERA_MOCK=1` as the screenshot baseline; every mobile screen
  is compared at 390×844 before it ships.
