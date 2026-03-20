# Phera — Claude Code Project Context

## What Is Phera

Phera (phera.io) is an Indian wedding guest logistics platform pivoting from a DIY wedding website builder to a **wedding operations service**. The thesis: sell the work (guest coordination outcomes), not the tool. Based on Sequoia Capital's "Services: The New Software" framework — intelligence work (data collection, outreach, scheduling) is automated by AI, judgment work (aesthetics, family dynamics) stays human.

**One-sentence pitch:** "Indian weddings are beautiful chaos — 300+ guests, 3-5 days of events, people flying in from everywhere. Phera handles the guest logistics so you can focus on the celebration."

## Current State

**Pivot status:** Phase 1 — building the outreach engine and service infrastructure on the `develop` branch. The `main` branch has the existing production app (wedding website builder, RSVP, WhatsApp concierge, transportation system). Production on `main` is live and must not break.

**Task 1 (DB migration) is COMPLETE.** The full SQL migration has been run against both test and production Supabase. All new columns on `guests` table (outreach_status, outreach_last_contacted_at, outreach_attempt_count, outreach_next_action, outreach_next_action_at, whatsapp_opted_out, contact_type, is_family_liaison, liaison_for, logistics_data, consent_given_at, consent_language, consent_withdrawn_at, data_retention_until) and all three new tables (outreach_events, outreach_sequences, outreach_escalations) plus their indexes already exist. **Do NOT re-run any migration SQL. Do NOT create or modify Task 1 migration files.**

**Active work starts at Task 2** in DEV-ROADMAP.md.

## Target Market

**NRI-first (Non-Resident Indian couples).** Not domestic India exclusively.
- 40K-55K NRI weddings in India/year. $4-6B segment.
- US Indian Americans highest value: $225K-$285K average budget.
- At $349-$599, Phera = 0.1-0.6% of budget. Non-decision.
- 40-60% of NRI weddings use planners → planner referral = #1 GTM channel.
- "Reverse destination" guests (non-Indian friends attending Indian weddings) = most defensible feature.
- Domestic India is secondary market at ₹9,999-₹17,999 INR.

**Multi-currency pricing (day one):**
- NRI: $349 (Base, ≤200 guests) / $599 (Premium, ≤400) / $799-999 (Grand, 400+)
- Domestic: ₹9,999 / ₹17,999 / ₹29,999

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Database:** Supabase (Postgres + RLS + Realtime + Auth)
- **UI:** MUI v7 + Tailwind CSS v4 + Framer Motion
- **Messaging:** Meta WhatsApp Business Cloud API (official only)
- **AI:** Anthropic API, Groq API (Whisper + Llama 3.3 70B), OpenAI API
- **Payments:** Stripe (multi-currency: USD + INR)
- **Deploy:** Vercel
- **Email:** Resend
- **Monitoring:** Sentry
- **Testing:** Vitest + happy-dom + @testing-library/jest-dom
- **Path alias:** `@/*` maps to project root

## Key Files — DO NOT MODIFY

These files are stable production code. New pivot code goes in new files alongside them.

| File | What It Does | Notes |
|------|-------------|-------|
| `lib/whatsapp/client.ts` | WhatsAppClient class: sendMessage, sendTemplate, getMessageStatus | Singleton `whatsappClient` export. Uses WHATSAPP_API_VERSION, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN env vars. Graph API v23.0. |
| `lib/whatsapp/templates.ts` | TEMPLATE_PARAMS for existing templates (rsvp_confirmation, event_reminder, shuttle_reminder, venue_update, photo_sharing). replaceParameters, formatParametersForAPI, validateTemplateParams, escapeWhatsAppText. | New outreach templates go in `lib/whatsapp/outreach-templates.ts` — a SEPARATE file. |
| `lib/whatsapp/opt-ins.ts` | WhatsAppOptIn interface, createOptIn, checkOptInStatus, getOptInPhone, handleOptOut. Uses `whatsapp_opt_ins` Supabase table. | Reuse these functions for opt-in checks in outreach sender. |
| `lib/supabase/client.ts` | Browser Supabase client with PKCE auth flow, plus `publicSupabase` for guest routes. | Import from here for all DB operations. |

## Key Files — Existing Code to Understand

| File / Directory | What It Does |
|-----------------|-------------|
| `lib/whatsapp/ai-handler.ts` | AI-powered WhatsApp message handler (concierge) |
| `lib/whatsapp/webhooks.ts` | Existing webhook handling |
| `lib/whatsapp/analytics.ts` | Message analytics |
| `lib/supabase/rsvp-service.ts` | RSVP CRUD operations |
| `lib/supabase/transportation-service.ts` | Shuttle/vehicle management |
| `lib/supabase/travel-service.ts` | Guest travel tracking |
| `lib/supabase/wedding-service.ts` | Wedding CRUD |
| `lib/supabase/auth-service.ts` | Auth helpers |
| `lib/supabase/types.ts` | Shared TypeScript types |
| `app/admin/[weddingSlug]/` | All admin dashboard pages (design, schedule, transportation, travel, etc.) |
| `app/(guest)/` | Guest-facing portal |
| `app/api/` | API routes |
| `app/onboarding/` | Onboarding wizard |

## Database Schema

**`guests` table** (existing + new pivot columns):
- Core: id (UUID PK), name, email, phone, wedding_id (TEXT slug — NOT a FK, no weddings table exists), auth_method, wedding_side, initials (generated), avatar_color, created_at
- Outreach (new): outreach_status (enum: not_contacted/save_the_date_sent/rsvp_requested/rsvp_confirmed/travel_collected/logistics_complete/unresponsive), outreach_last_contacted_at, outreach_attempt_count, outreach_next_action, outreach_next_action_at, whatsapp_opted_out (bool), contact_type (guest/admin/family)
- Family liaison (new): is_family_liaison (bool), liaison_for (UUID[])
- Logistics (new): logistics_data (JSONB — passport_name, visa_status, hotel info, arrival/departure, emergency contact, language_preference, etc.)
- DPDPA compliance (new): consent_given_at, consent_language, consent_withdrawn_at, data_retention_until

**`outreach_events` table** (new): id, wedding_id (TEXT), guest_id (FK→guests), event_type, template_name, channel, details (JSONB), created_at

**`outreach_sequences` table** (new): id, wedding_id (TEXT), sequence_type, template_name, days_before_wedding, status, scheduled_at, sent_at, target_statuses (TEXT[]), created_at

**`outreach_escalations` table** (new): id, wedding_id (TEXT), guest_id (FK→guests), reason, context (JSONB), status (open/in_progress/resolved/dismissed), resolved_by, resolved_at, created_at

**CRITICAL:** `wedding_id` is always TEXT (a slug like "priya-rahul-2026"), NOT UUID. There is no `weddings` table. The existing `guests`, `rsvps`, `comments` tables all use this pattern with no FK constraint. New tables follow the same pattern.

**Other existing tables:** rsvps (guest_id FK, wedding_id TEXT, event_id, attending, guest_count, dietary), comments, whatsapp_opt_ins, user_settings (commented schema in database-schema.sql)

## Testing

- **Framework:** Vitest with happy-dom environment
- **Config:** `vitest.config.ts` — globals:true, setup: `./tests/setup.ts`, pattern: `tests/**/*.test.{ts,tsx}`, CSS disabled, `@/` alias
- **Setup file** (`tests/setup.ts`): Mocks next/navigation (useRouter, usePathname, useSearchParams), next/link, next/image, localStorage, window.location (origin: https://phera.io)
- **Run:** `npx vitest run` (all tests) or `npx vitest run tests/specific.test.ts`
- **Existing tests:** ~40 test files covering auth, RSVP, transportation, concierge, onboarding, design, coordinator, pin codes, Stripe, etc.
- **Rule:** Every task in DEV-ROADMAP.md has explicit test requirements. Write tests alongside implementation. All tests must pass before moving to next task.

## WhatsApp API Rules (CRITICAL — Read Before Writing Any WhatsApp Code)

1. **Hinglish templates WILL BE REJECTED by Meta.** Mixed-language templates violate Meta policy. Create SEPARATE pure English (en) and pure Hindi (hi) versions of every template. Hinglish is fine ONLY within free 24hr service windows (after guest replies).
2. **No unofficial API / QR linking.** Build exclusively on official WhatsApp Business Cloud API. No sending from personal numbers programmatically.
3. **Error 131049** = frequency cap hit. Do NOT retry immediately — wait 24+ hours.
4. **Error 131050** = user opted out. NEVER retry. Mark guest as opted out immediately via handleOptOut().
5. **200 OK from Meta = acceptance, NOT delivery.** Track actual delivery via webhooks.
6. **Reply-first template design:** Prompt replies to open free 24hr service windows. All follow-up within that window is free.
7. **Template approval rejects ~47% first-time.** Plan for 1-2 revision cycles.
8. **Marketing templates:** ₹0.86/msg, ~50% delivery cold, 70-90% for opted-in audiences, 12-25% CTR realistic.
9. **Utility templates:** ₹0.14/msg, 95-99% delivery, exempt from frequency caps.
10. **Carousel templates:** 2-10 swipeable cards, ~2.5x CTR vs standard. Marketing category only.
11. **Quick Reply buttons:** 2-3x CTR vs plain text. Max 3 buttons.
12. **Send windows:** 9-11 AM India for awareness, 5-7 PM for action. Tue-Thu best. Avoid Monday, post-9 PM.
13. **Phone tiers:** 250 (unverified) → 1K → 10K → 100K → Unlimited. Tier upgrade every 6 hours, requires 50%+ capacity + high quality.
14. **WhatsApp Flows:** Multi-screen native forms inside WhatsApp. No competitor uses this for RSVP. Major differentiator. Triggered via CTA buttons in templates.

## Hybrid Outreach Model

1. **Couple sends initial save-the-date** from their personal WhatsApp using wa.me deep links that Phera generates. This is manual by the couple — high trust, personal touch.
2. **All subsequent automation** comes from the Phera WhatsApp Business number, branded as "Priya & Rahul Wedding" with the couple's photo as profile.
3. Templates prompt replies → opens free 24hr window → follow-up is free.
4. Full 8-message sequence for 300 guests costs ~₹2,070 ($25) in WhatsApp fees. Negligible.

## DPDPA 2023 Compliance

Build consent into every flow from day one. Full enforcement May 2027.
- Every first WhatsApp message needs explicit opt-in after clear notice.
- Consent offered in English + Hindi minimum.
- Data retention: erase guest data when wedding purpose fulfilled or consent withdrawn.
- Breach notification: 72 hours to DPB + affected individuals.
- Children's data (<18): verifiable parental consent required.

## Development Rules

1. **Branch:** All pivot work on `develop`. Create from `main` if it doesn't exist.
2. **Task order:** Follow DEV-ROADMAP.md sequentially. Don't skip tasks.
3. **Commit after each task** with a descriptive message.
4. **Tests must pass** before moving to next task.
5. **Read DEV-ROADMAP.md** for the full 24-task roadmap with specs per task.
6. **Read PIVOT-PLAN.md** for strategic context (target market, pricing, positioning, competitive landscape, implementation phases).
7. **New files alongside existing ones** — don't modify the stable production files listed above.
8. **Import path:** Use `@/` alias (maps to project root). Example: `import { whatsappClient } from '@/lib/whatsapp/client'`

## Project Structure (Key Directories)

```
app/
  (guest)/           # Guest-facing portal
  admin/             # Admin dashboard
    [weddingSlug]/   # Per-wedding admin pages
  api/               # API routes
  auth/              # Auth pages + callback
  onboarding/        # Onboarding wizard
lib/
  ai/                # AI handlers (new pivot code goes here)
  supabase/          # Supabase client + service layers
  whatsapp/          # WhatsApp API client + templates + webhooks
tests/               # Vitest test files
  mocks/             # Test mocks
  setup.ts           # Global test setup
migrations/          # SQL migration files
```

## Error Reporting

If you encounter any of the following during development, **stop and report to the user before continuing:**
- Database schema mismatches (columns don't exist, type errors, FK violations)
- WhatsApp API errors you can't resolve (auth failures, unknown template errors)
- Existing test failures that weren't caused by your changes
- Type errors in existing code that block compilation
- Missing environment variables that prevent testing
- Merge conflicts on the develop branch
- Any situation where proceeding would require modifying a DO-NOT-MODIFY file

Format error reports as:
```
⚠️ BLOCKER: [short description]
- What happened: [details]
- What I tried: [attempted fixes]
- What I need: [what the user should do]
```

## Reference Documents

| Document | Purpose |
|----------|---------|
| `DEV-ROADMAP.md` | 24-task step-by-step engineering roadmap. The implementation spec. |
| `PIVOT-PLAN.md` | Full strategic context — why we're pivoting, target market, pricing, competitive landscape, positioning, phased rollout. |
| `CLAUDE-CODE-GENESIS-PROMPT.md` | Genesis prompt and ralph-loop phase commands. |
| `database-schema.sql` | Original pre-pivot schema (guests, rsvps, comments, RLS policies, indexes). New pivot tables/columns are applied directly, not in this file yet. |
