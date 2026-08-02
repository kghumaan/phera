# Phera — Architecture Explainer

> **Purpose of this document:** teach you how your own codebase actually works so you can talk about it fluently and *honestly* in a technical interview. It is written to help you avoid overclaiming. Where something is thin, half-wired, or boilerplate, it says so. Read the "What I should NOT claim" section before any interview.
>
> Last reviewed against the code on the `feature/phera-agent` branch. Re-verified 2026-06-25, including this session's additions (public vendor directory + ingest pipeline, `/planners` page, the 90-day data-retention cron, and the flight-collection → shuttle-assignment pipeline).

---

## 1. High-level purpose (the 3-sentence version)

Phera is a web app for coordinating the *guest logistics* of large Indian weddings — RSVPs, room blocks, shuttles, travel, schedule, vendors — for couples and their planners. The original product is a Next.js + Supabase wedding-website-and-RSVP builder with a WhatsApp concierge; the **current active build adds an AI "planner agent" that can read and write the couple's real wedding data through a chat (and voice) interface.** The thesis is "sell the work, not the tool": the agent does the data entry and coordination so the couple doesn't click through 26 admin screens.

---

## 2. Architecture overview

There are really **three layers** and **two separate AI systems** in this codebase. Keeping them straight is the single most important thing for an honest interview.

- **Web app (Next.js 15 App Router):** server-rendered admin dashboard + public guest portal, deployed on Vercel.
- **Data layer (Supabase / Postgres):** all state lives here, with Row-Level Security (RLS) as the real tenant boundary.
- **Two AI systems — do not conflate them:**
  1. **The Phera planner agent** (`lib/agent/`) — *new, the thing you're building.* Hand-rolled tool-calling loop on **Anthropic Claude (Opus)**. This is what you should mean when you say "the agent."
  2. **The WhatsApp concierge + vendor extractor** (`lib/whatsapp/`, `lib/vendors/`) — *older.* Guest-facing Q&A and vendor-chat parsing, powered by **Groq (Llama 3.3 70B)** and Gemini. Separate prompts, separate tools, separate code path.

### Request flow — the planner agent (the interesting path)

```
┌──────────────┐   POST /api/agent/chat (SSE)    ┌─────────────────────────────┐
│  Admin chat  │ ───────────────────────────────▶│ app/api/agent/chat/route.ts │
│  UI (React)  │   { weddingSlug, message }       │  • rate-limit (per IP)      │
└──────▲───────┘                                  │  • auth (Supabase cookie)   │
       │  Server-Sent Events                      │  • verifyWeddingAccess()    │
       │  (text deltas, tool_start,               │  • find/create conversation │
       │   confirmation_required, …)              └──────────────┬──────────────┘
       │                                                         │ runAgentTurn()
       │                                          ┌──────────────▼──────────────┐
       │                                          │   lib/agent/loop.ts          │
       │                                          │  • acquire turn lock         │
       │                                          │  • load history (last 40 +   │
       │                                          │    rolling summary)          │
       │                                          │  • build wedding snapshot    │
       │                                          │  • loop up to 8 rounds:      │
       │                                          └──────┬───────────────▲───────┘
       │                                                 │ streamTurn()   │ tool_result
       │                                          ┌──────▼───────┐  ┌─────┴──────────┐
       │                                          │  providers/  │  │ tools/registry │
       │                                          │ anthropic.ts │  │  dispatchTool()│
       │                                          │ (Claude API) │  │ read / write / │
       │                                          └──────┬───────┘  │ gated + Pro gate│
       │                                                 │          └─────┬──────────┘
       │                                                 │ tool_use       │ Supabase
       │                                                 ▼                ▼ (RLS-scoped)
       │                                          model decides      guests / rsvps /
       │                                          which tool         rooms / schedule …
       │                                          to call            (same tables the
       │                                                             UI writes)
       │
       └──── gated tool? → row parked in agent_actions → UI shows Confirm/Decline
              → POST /api/agent/confirm → resolveAgentAction() → follow-up turn
```

Plain-English walkthrough of one turn:

1. The chat UI POSTs a message; the route authenticates, checks wedding access, and opens an **SSE stream**.
2. `runAgentTurn` (in `lib/agent/loop.ts`) takes a **per-conversation turn lock** (a `turn_started_at` column; stale locks >3 min are stolen), loads the recent message history plus a rolling summary, and builds a **"wedding snapshot"** (current counts/state) that's injected after the cached system prompt.
3. It calls the **Anthropic provider** once per "round." The model streams text (relayed to the UI) and may emit `tool_use` blocks.
4. Each tool call goes through `dispatchTool`, which enforces the **Pro gate** and **risk tier**, runs the tool against Supabase, audit-logs it to `agent_actions`, and feeds the result back to the model.
5. The loop repeats (max 8 rounds) until the model stops calling tools, then ends the turn and (occasionally) compacts old history into a summary.

The guest portal and the WhatsApp concierge are separate request flows that don't touch `lib/agent/` at all.

---

## 3. Tech stack (what's actually used, and what isn't)

**Framework / runtime**
- **Next.js 15 (App Router) + React 19** — the whole app. API routes are Next.js route handlers running on the Node runtime.
- **TypeScript** throughout. **Deployed on Vercel** (serverless functions; this matters — see rate-limiting caveat).

**Data / backend**
- **Supabase** — Postgres + Auth + RLS. This is the only datastore. `@supabase/supabase-js` (browser/public) and `@supabase/ssr` (cookie-based server client).

**AI / LLM**
- **`@anthropic-ai/sdk` (Claude Opus)** — powers the **planner agent** (`lib/agent/`). Raw SDK, no framework. *(Anthropic is also used **offline** by `scripts/enrich-vendors.ts` — Claude **Haiku** reading vendor websites to extract pricing/specialties — so "we use Anthropic" isn't only the agent. That script is build-time ingest tooling, not a runtime request path.)*
- **`groq-sdk` (Llama 3.3 70B + Whisper)** — powers the **WhatsApp concierge**, the **vendor insight extractor**, travel-content generation, **speech-to-text** (`whisper-large-v3-turbo`), and the agent's **text-to-speech fallback** (Orpheus). Groq is doing a lot of the *non-agent* AI work.
- **`@google/genai` (Gemini)** — used as a secondary/fallback model in a few WhatsApp helpers. Minor.
- **Cartesia (Sonic)** — primary TTS for agent voice mode, called via `fetch` (no SDK). Groq Orpheus is the fallback.

**UI**
- **MUI v7 + Emotion**, **Tailwind v4**, **Framer Motion**. Design tokens centralized in `lib/theme/`.

**Payments / comms / misc**
- **Stripe** (multi-currency billing), **Resend** (email), **Meta WhatsApp Cloud API** (guest messaging), **Whapi.Cloud** (vendor group chats — separate from Meta), **Mapbox** (geocoding/maps), **Sentry** (errors), **Vercel Analytics/Speed Insights**.
- Utility libs: `zod`, `date-fns`, `papaparse`/`xlsx` (guest-list imports), `react-hook-form`, `@dnd-kit`, `recharts`, `@tiptap` (rich text), `@dicebear` (avatars).

**Growth & background surfaces (recent work — mostly outside the agent):**
- **Public vendor directory** — a no-login, SSR page at `/vendors` (`app/vendors/page.tsx` + `VendorsDirectoryClient.tsx`) that reads the Supabase `vendor_directory` table via the public `/api/vendors/directory` endpoint (`lib/vendors/directory/service.ts`), filterable by city, category, and NRI experience. Sign-up is required only to *contact* a vendor.
- **Vendor data pipeline** (not a runtime feature — ingest tooling) — `vendor_directory` (~1,259 live rows across 9 cities) is populated by `scripts/seed-vendors.ts` (26 curated), `scripts/ingest-vendors.ts` (Google Places API), and `scripts/enrich-vendors.ts` (Claude Haiku scrapes pricing/portfolio/specialties). Run manually, not on a schedule.
- **`/planners` marketing page** (`app/planners/page.tsx`) — a static conversion surface for the $249/wedding planner tier that routes to `/auth/login?role=planner`. A landing page, **not** a built-out planner dashboard.
- **Data-retention cron** (`lib/retention/run-data-retention.ts`) — 90 days after a wedding it deletes `comments` + `rsvps` and clears guest `logistics_data` PII while **keeping the base guest record**. Protects `demo-template` / `TEMPLATE_WEDDING_SLUG` / `demo-*` / `agent-lab-*` / epoch-dated weddings. Runs daily folded into `/api/cron/demo-cleanup` (Vercel Hobby caps the plan at 2 crons, both used); callable on-demand with a `?dry=1` preview at `/api/cron/data-retention`.
- **Flight-collection → shuttle-assignment pipeline** — the most testable non-agent path; detailed in §7, talking point 4.

**Imported but barely/not used — flag these honestly:**
- **`openai`** is in `package.json` but **has zero imports anywhere in `lib/` or `app/`.** It's a dead dependency. Do not claim "we use OpenAI."
- **`@vercel/mcp-adapter`** is installed but the agent does **not** use MCP (see §5). Treat it as unused/experimental unless you verify otherwise.
- **`@react-grab/mcp` / `react-grab`** are dev tooling, not part of the product.
- The cultural-color palette, several Giphy/confetti niceties, etc. are real but cosmetic.

---

## 4. The agent layer — how it actually works at the code level

This is the part you built recently and should understand best. It's genuinely the most engineered part of the repo. Key files:

| File | Role |
|---|---|
| `lib/agent/loop.ts` | The turn engine: locking, history, snapshot, the round loop, persistence, compaction. |
| `lib/agent/types.ts` | The provider-agnostic interfaces: `AgentProvider`, `AgentToolDefinition`, content blocks, stream events. |
| `lib/agent/providers/anthropic.ts` | The **only** concrete provider. Maps internal blocks ↔ Anthropic SDK, sets prompt caching. |
| `lib/agent/tools/registry.ts` | `dispatchTool` — risk tiers, Pro gate, confirmation parking, audit logging. |
| `lib/agent/tools/*.ts` | 12 domain files defining **31 tools** (guests, rooms, schedule, vendors, travel, transportation, content, knowledge, wedding, ask, goals, upload). |
| `lib/agent/system-prompt.ts` | The frozen system prompt (kept byte-stable for prompt caching). |
| `lib/agent/context.ts` | Builds the per-turn "wedding snapshot." |
| `lib/agent/confirm.ts` | Resolves a parked gated action (approve/decline) and runs a follow-up turn. |
| `lib/agent/compact.ts` | Rolls old turns into a summary when history exceeds the window. |
| `app/api/agent/*` | The HTTP surface: `chat`, `confirm`, `answer`, `conversations`, `tts`, plus a parallel `lab/*` test harness. |

**Tenant isolation, at the agent level.** The agent never gets a privileged DB client. The tool context (`AgentToolContext`) carries **the caller's own authenticated Supabase client**, so every tool query runs under that user's RLS. On top of that, every tool also filters explicitly by `wedding_id` (the TEXT slug). So isolation is enforced **twice**: once by Postgres RLS (the real boundary) and once by the application code in each tool. The HTTP route additionally calls `verifyWeddingAccess()` before the turn starts.

**Risk tiers (`lib/agent/types.ts`).** Every tool declares one of:
- `read` (14 tools) — auto-execute.
- `write` (16 tools) — auto-execute, **but always audit-logged** to `agent_actions`.
- `gated` (**1 tool today** — room auto-assignment) — does **not** execute; it parks a `pending` row in `agent_actions`, the UI renders Confirm/Decline, and `/api/agent/confirm` resolves it via `resolveAgentAction`.

**Pro gating.** Six tools across rooms/transportation/vendors carry a `proFeature` flag. For a Basic user, `dispatchTool` blocks execution and emits an `upgrade_required` event → in-chat upgrade card.

**Prompt caching & cost.** The Anthropic provider puts the static system prompt + tool defs **before** an `ephemeral` cache breakpoint, and the per-request wedding snapshot **after** it, so the expensive prefix is cached across turns. The loop logs `cacheRead`/`cacheWrite` token counts so you can see when caching breaks. This is a real, deliberate optimization.

**Resilience details worth knowing:**
- **Turn lock** prevents two concurrent requests from corrupting one conversation's history.
- **History sanitization** (`sanitizeHistoryWindow`) trims a truncated window so it never starts with an orphan `tool_result` or ends with an unanswered `tool_use` — both of which the Anthropic API rejects. This is the kind of edge case that only surfaces from running the system against real, truncated conversations.
- **Opaque blocks**: Claude "thinking" blocks are carried verbatim and replayed unchanged, because the API 400s on modified thinking blocks mid-tool-loop.
- **Off-critical-path writes**: message persistence runs concurrently with model rounds and is flushed at the end, so the user isn't blocked on Supabase between rounds.
- **Voice mode** (`fast: true`) disables extended thinking for latency and heavily rewrites behavior via an injected snapshot addendum (no cards, one spoken question at a time).

---

## 5. Agentic workflow / tool routing — name the pattern honestly

**It is a hand-rolled tool-use loop on the raw Anthropic SDK. It is NOT MCP, NOT LangChain, NOT any agent framework.** Say exactly that. If asked "why not a framework," the honest answer is: the loop is small, the tool surface is domain-specific, and routing straight through the SDK keeps prompt-caching and streaming under direct control.

How a request becomes a tool call and back, concretely:

1. **Tool registry → model.** All 31 tools are registered once per process (`ensureToolsRegistered`) and passed to the model as Anthropic `tools` (name + description + JSON-Schema input). **The model does the routing** — there is no custom intent classifier or router. The model decides which tool to call based on the descriptions you wrote.
2. **Model emits `tool_use`.** The loop pulls every `tool_use` block out of the streamed response.
3. **`dispatchTool` executes.** It checks the Pro gate, then the risk tier: `read`/`write` run immediately against Supabase; `gated` parks for confirmation; the special tools `ask_user`, `request_upload`, and the Pro/upgrade path short-circuit with their own stream events.
4. **Result returns to the model** as a `tool_result` block (truncated to ~12k chars), and the loop runs another round. Up to 8 rounds per turn.
5. **Structured UI interactions** (asking the user typed questions, requesting a file upload, confirming a destructive action) are modeled as **tools that emit SSE events** rather than executing logic — the React client renders the right widget and the answer comes back as the next user message.

So: **classic ReAct-style observe/act loop, model-driven routing, custom (not framework) orchestration.** The tool *definitions* are hand-written and high quality; the *loop* is ~325 lines you can read end to end.

Honest note on the "provider-agnostic" framing: the **interface** (`AgentProvider`) is genuinely abstracted, but **only the Anthropic provider exists.** It's "swappable in principle," not "multi-model in production." Don't imply you're running multiple models behind the agent — you're not.

---

## 6. What I should NOT claim (read this before any interview)

Be especially careful here — these are the spots most likely to collapse under follow-up questions.

- **Don't call it "multi-model" or "provider-agnostic in production."** One provider (Anthropic) is implemented. The abstraction is real; the second implementation isn't.
- **Don't say it uses MCP, LangChain, or any agent framework.** It's raw SDK + a hand-written loop. `@vercel/mcp-adapter` is installed but unused by the agent.
- **Don't claim "human-in-the-loop confirmation on all destructive actions."** Exactly **one** tool is `gated` today; the other 16 writes auto-execute (they're audit-logged, but they don't ask first). The confirmation *infrastructure* is general and well-built — but it's barely exercised. Say "the framework supports gated confirmation; we currently gate room auto-assignment."
- **Don't claim "we use OpenAI."** Dead dependency, zero imports.
- **Don't oversell the rate limiter as a security control.** It's an **in-memory `Map`** (`lib/utils/rate-limiter.ts`) that resets on every serverless cold start and is per-instance. It deters casual bursts; it does not stop a distributed or patient attacker. Wedding-PIN brute-forcing is only weakly mitigated.
- **Don't claim the agent is "in production handling real couples."** It lives on `feature/phera-agent`. There's a disposable **agent-lab** harness (`app/agent-lab`, `lib/agent/lab/`) for E2E testing against mock weddings — useful and real, but it's a test surface, not production traffic.
- **Be careful conflating the two AI systems.** If an interviewer asks "what does the agent use," the answer is **Claude/Anthropic**. The Groq/Llama work is the *separate WhatsApp concierge and vendor extractor*. Mixing these up is the most common factual error when describing this system.
- **Don't vouch for the deep quality of the 26-page admin dashboard or every WhatsApp helper file unless you've read them.** This is a wide surface area (`lib/whatsapp/` alone is ~20 files), and breadth like that is exactly where AI-generated boilerplate and uneven quality tend to hide. I read the agent layer closely; I did **not** line-audit every service. Speak confidently about `lib/agent/`, the RLS model, and the request flow; speak generally ("there's a mature service layer") about the rest.
- **RLS is the boundary, not the app code — but only if every table has a policy.** Two RLS migrations cover the core and secondary tables, and several tables intentionally allow public INSERT (guest self-service RSVP). If pressed on "could a guest forge a row," the honest answer is: the permissive guest-facing INSERT policies are a deliberate UX tradeoff, and you'd want to re-audit them before calling the model airtight.
- **CLAUDE.md is partly stale.** It says "there is no `weddings` table" — there now **is** one (UUID `id` + TEXT `slug`), and the dual-key pattern is real. Don't quote the old note.
- **Don't call shuttle auto-assignment a finished feature.** The assignment *algorithm* and the broadcast→`guest_flights` data pipeline are built and unit-tested, but the admin "review the preview and apply the drafts" UI is still pending. Say "the logic is done and tested; the admin UI is the remaining slice."
- **Don't conflate the offline vendor enrichment with the agent.** `scripts/enrich-vendors.ts` uses Anthropic (Claude Haiku) to scrape vendor sites at ingest time — it's a manually-run script, not part of the runtime agent or any request path.
- **The data-retention cron is live but rides on `demo-cleanup`.** It's not its own scheduled cron (Vercel Hobby's 2-cron limit) — it's invoked from the daily `demo-cleanup` route. Accurate framing: "a daily 90-day purge, folded into the existing cleanup cron."

---

## 7. Four honest talking points (things that are genuinely solid)

Phrased the way you could actually say them out loud:

1. **"I built the agent loop by hand on the raw Anthropic SDK instead of reaching for a framework, and that decision paid off in control."**
   *"It's a streaming observe/act loop — the model is given ~31 declarative tools and does its own routing, and my code owns the orchestration: a per-conversation turn lock so concurrent requests can't corrupt history, history-window sanitization so a truncated conversation never sends the API an orphaned tool result, and prompt caching with the static system prompt before the cache breakpoint and the live wedding snapshot after it. I can watch cache hit/miss in the token logs. Those are the details you only get right after actually running the thing in anger."*

2. **"Tenant isolation is enforced at the database, not just in app code."**
   *"Every wedding is a tenant. The agent's tools run under the calling user's own Supabase client, so Postgres Row-Level Security is the real boundary — there's no privileged service client in the request path. On top of that, each tool also filters by wedding, and the API route verifies access before the turn starts. So it's defense in depth, but the load-bearing layer is RLS, with `SECURITY DEFINER` helper functions checking wedding ownership or admin membership."*

3. **"The tools are deliberately thin wrappers over the same service layer the UI uses, with risk tiers and an audit log baked in."**
   *"I didn't give the agent a second, parallel way to mutate data — every tool drives the same paths the dashboard does, so the agent and the UI can't drift. Each tool declares a risk tier — read, write, or gated — every write is logged to an `agent_actions` audit table, and gated actions park a pending row that the user has to confirm in-chat before anything executes. The confirmation and audit infrastructure is general; today I gate the highest-stakes action, room auto-assignment, and I can promote any other tool to gated by changing one field."*

4. **"The non-agent logic I'd hold up as properly engineered is the shuttle-assignment algorithm — because it's pure and actually unit-tested."**
   *"There's a flow where one tap fires a WhatsApp broadcast asking every guest for their flight details; the replies get extracted and auto-land in `guest_flights`. The assignment itself — placing each guest on the earliest shuttle that departs after they land, with capacity and party-size respected and parties kept together — I wrote as a pure, deterministic, I/O-free function: it takes epoch-millisecond times and integer capacities, no DB and no `Date.now()`. That let me cover it with 14 unit tests for the real edge cases — the post-landing buffer, capacity filling up, a party bigger than any single shuttle, no shuttle after arrival, missing flight info, and tie determinism. Honest caveat: the algorithm + the collection→`guest_flights` pipeline are done and tested, but the admin review-and-apply UI is the remaining slice."*

---

### Appendix — fast facts to memorize

- **Agent model:** Claude Opus via `@anthropic-ai/sdk` (env-overridable; voice can use a faster model).
- **Concierge / vendor model:** Groq Llama 3.3 70B; STT is Groq Whisper; TTS is Cartesia Sonic (Groq Orpheus fallback).
- **Tools:** 31, across 12 domain files. Risk split: 14 read / 16 write / 1 gated. 6 are Pro-gated.
- **Loop bounds:** ≤8 tool rounds/turn, 40-message history window + rolling summary, ~12k-char tool-result cap.
- **Tenant key:** dual — `weddings.id` (UUID) and `weddings.slug` (TEXT). Guest tables key on slug; wedding/event/settings key on UUID.
- **Boundary:** Postgres RLS (two migrations) + per-tool wedding filter + `verifyWeddingAccess`. Rate limiter is in-memory/ephemeral — not a real security control.
- **Tests:** a large suite (~21k lines across `tests/`), including ~12 agent-specific files and RLS/workflow integration suites, plus **14 pure-unit cases for the shuttle-assignment algorithm** (`tests/assign-shuttles.test.ts`). (I confirmed these exist and are non-trivial; I did not re-audit each for depth.)
- **Vendor directory:** the `vendor_directory` Supabase table holds **~1,259 rows across 9 cities**, populated *offline* by `seed-vendors` + `ingest-vendors` (Google Places) + `enrich-vendors` (Claude Haiku); surfaced publicly at `/vendors`.
- **Shuttle assignment:** a pure, deterministic algorithm (`lib/transportation/assign-shuttles.ts`, 14 tests) fed by a one-tap flight-details WhatsApp broadcast that auto-lands replies into `guest_flights`. Logic + pipeline done; admin apply-UI pending.
- **Data retention:** a 90-day purge of `comments`/`rsvps`/guest PII (keeps the base guest record), folded into the daily `demo-cleanup` cron; dry-run via `/api/cron/data-retention?dry=1`.
- **Status:** agent is on `feature/phera-agent`; `agent-lab` is the disposable E2E harness. The rest of the app (guest portal, RSVP, WhatsApp concierge, transportation) is the older, live product.
