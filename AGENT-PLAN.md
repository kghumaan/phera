# Phera Agent — The AI Wedding Planner That Controls Everything

Branch: `feature/phera-agent` (off `main`). Status: planning approved, implementation not started.

## Vision

One agent, one conversation, controls the whole app. The couple talks to it like a wedding planner — it asks onboarding questions, fills in wedding details, manages guests, reassigns rooms when an uncle cancels, reminds them it's hot in Thailand in June. Web chat first (admin portal), WhatsApp + voice as the eventual primary surface. The existing admin pages remain the structured "manual" layer underneath; the agent is a new way to drive the same data.

**Decided:**
- **Brain:** Claude (`claude-opus-4-8`) behind a provider-agnostic loop; Groq/Gemini as cheap fallbacks (same pattern the concierge already uses). Model set via `AGENT_MODEL` env var.
- **Autonomy:** reads + low-risk writes execute immediately; destructive/bulk/outbound actions require an in-chat Confirm tap.
- **Placement:** new sidebar page (working name "Planner" / `assistant`). Build-AI page untouched until the agent proves it covers those flows.
- **Learning:** conversation + tool-call logging, thumbs feedback, replayable eval harness, and a knowledge-base/RAG layer (vendors per city, seasonal advice). No fine-tuning yet.

## What we already have (reuse, don't rebuild)

| Existing asset | Role in the agent |
|---|---|
| `lib/whatsapp/ai-handler.ts` + `concierge-tools.ts` | Reference architecture: context assembly → system prompt → tool-use loop → dispatcher. The admin agent is this pattern with a bigger tool set and admin permissions. Guest concierge stays separate (different audience, narrower powers). |
| Service layer (`lib/supabase/*-service.ts`) | Becomes the tool implementations almost 1:1 — `wedding-service` (40+ fns), `rsvp-service`, `rooms-service` (incl. `setAssignments`), `transportation-service`, `travel-service`, `outreach-service`, `broadcasts-service`, vendors. |
| `components/admin/VoiceRecorder.tsx` + `/api/concierge/transcribe` (Groq Whisper) | Voice input for the chat, nearly free to add. |
| Knowledge bank (`/api/concierge/knowledge`, `generate-knowledge.ts`) | Seed of the RAG layer — extend with global/city scopes. |
| Onboarding wizard data model (`weddings`, `wedding_events`, `schedule_items`, `wedding_settings`) | The fields the onboarding conversation fills in. |
| Design system (`PheraCard`, `PheraTextField`, tokens) | Chat UI built from existing primitives. |

## Architecture

```
app/admin/[weddingSlug]/assistant/page.tsx     ← chat UI (text + voice input)
        │ SSE
app/api/agent/chat/route.ts                    ← streaming route, auth + wedding access check
        │
lib/agent/
  loop.ts            ← provider-agnostic agentic loop (manual loop, supports approval gates)
  context.ts         ← wedding snapshot assembly + completeness checklist
  system-prompt.ts   ← stable persona/rules (frozen for prompt caching)
  providers/
    anthropic.ts     ← default: claude-opus-4-8, adaptive thinking, streaming
    groq.ts          ← fallback (llama-3.3-70b, OpenAI-compatible tool calls)
    gemini.ts        ← fallback (2.5 flash)
  tools/
    registry.ts      ← tool defs + dispatcher + risk classification
    wedding.ts guests.ts rsvps.ts rooms.ts schedule.ts
    travel.ts transportation.ts vendors.ts content.ts outreach.ts
  knowledge.ts       ← retrieval over agent_knowledge (+ existing knowledge bank)
```

Key loop properties:
- **Manual agentic loop** (not the SDK tool runner) because risky tool calls must pause for user confirmation: loop runs reads freely; on a gated tool it persists a `pending` action, streams a confirmation card to the client, and the next request (Confirm/Decline) resumes the loop with the tool result.
- **Provider interface:** `{ streamTurn(messages, tools, system) → events }` — Anthropic SDK (`@anthropic-ai/sdk`, new dependency) is the reference implementation; Groq/Gemini adapters reuse the conversion code patterns already in `ai-handler.ts`.
- **Prompt caching (Anthropic):** order = tools → frozen system prompt → `cache_control` breakpoint → wedding snapshot → conversation. No timestamps/IDs in the system prompt; "today's date" and the snapshot go after the breakpoint.
- **Transport-agnostic:** the loop takes (weddingId, conversationId, userMessage) and knows nothing about HTTP — so the future WhatsApp webhook calls the exact same function the web route calls.

## Tool surface (~25 tools)

Reads (auto-execute): `get_wedding_overview`, `get_guests` (filterable), `get_guest_detail`, `get_rsvp_stats`, `get_rooms`, `get_schedule`, `get_events`, `get_travel`, `get_transportation`, `get_vendors`, `get_faqs_registry_shops`, `search_knowledge`.

Low-risk writes (auto-execute, logged): `update_wedding_details`, `add_guest`, `update_guest`, `create_schedule_item`, `update_schedule_item`, `create_event`, `update_event`, `add_faq`, `update_travel_section`, `create_task`, `add_vendor`, `update_room`.

Gated writes (Confirm required): `delete_*` (guest, event, schedule item, room), `assign_guests_to_room` / `clear_room_assignments` (reshuffles), `bulk_update_guests`, `send_broadcast` / anything that messages guests, `publish_wedding`, `update_pins_or_password`.

Conventions: every tool description states *when* to call it (Opus reaches for tools conservatively — prescriptive triggers matter); inputs are zod schemas; every execution writes an `agent_actions` audit row; destructive UI affordances follow the design system (brand pink, never red).

## Data model (new tables — SQL provided to user, run in Supabase dashboard, test project first)

- `agent_conversations` — id, wedding_id TEXT, created_by, channel (`web`/`whatsapp`), title, created_at, last_message_at
- `agent_messages` — id, conversation_id FK, role (`user`/`assistant`/`tool`), content JSONB (text + tool_use/tool_result blocks, provider-portable shape), created_at
- `agent_actions` — id, conversation_id FK, wedding_id TEXT, tool_name, input JSONB, result JSONB, status (`executed`/`pending`/`confirmed`/`declined`/`failed`), risk (`read`/`write`/`gated`), created_at, resolved_at — the audit trail + pending-confirmation store
- `agent_feedback` — id, message_id FK, rating (`up`/`down`), correction TEXT, created_at
- `agent_knowledge` — id, scope (`global`/`city`/`wedding`), city TEXT, wedding_id TEXT, category (vendor/venue/seasonal/cultural/logistics), title, content, metadata JSONB, created_at — embeddings column (pgvector) deferred until tag/city retrieval stops being enough

All wedding-scoped tables follow the existing `wedding_id` TEXT-slug pattern with RLS via `is_wedding_owner_or_admin_by_slug`.

## Onboarding & proactive judgment

Not a hard-coded wizard — a **completeness checklist computed in `context.ts`** and injected into the snapshot: dates set? venue set? guest list imported (count)? schedule built? travel info? rooms? vendors? consent/opt-ins? The system prompt instructs: *for a new wedding, greet and work through missing items conversationally, a few at a time; for an established wedding, lead with what changed and what needs attention (RSVP deadline approaching, X guests unresponsive, rooms with open capacity).*

Same snapshot powers judgment calls: location + season + guest origins are in context, so "Thailand in July → tell guests to pack linen" is a prompt-engineering + knowledge-base problem, not new infrastructure. Phase 6 adds scheduled check-ins (cron → agent scans wedding → drafts suggestions the couple sees as chat notifications).

## Learning system (v1, no fine-tuning)

1. **Capture:** every message, tool call, confirmation/decline, and thumbs rating is already persisted by the tables above. Declines and corrections are the highest-signal data.
2. **Eval harness:** `tests/agent-evals/` — scenario fixtures (seeded wedding state + user message + assertions on which tools were called with what args / what the reply must contain). Runs under vitest with mocked services; a smoke subset runs in CI. Any system-prompt or model change must pass evals before shipping. Real conversations that went wrong get distilled into new eval cases — that's the flywheel.
3. **Knowledge base:** `agent_knowledge` + `search_knowledge` tool. You bulk-load vendor lists per city, venue quirks, seasonal/cultural guidance; the agent retrieves by city/category. Admin UI for entries can wait — seed via SQL/scripts initially.
4. **Later (only with volume):** distilled cross-wedding playbooks; fine-tuning a Groq-served model for the cheap fallback path.

## Phases

**Phase 1 — Read-only assistant (the "wow" demo).** SQL tables (conversations/messages/actions), `lib/agent` loop + Anthropic provider + read tools, SSE chat route, chat page with streaming UI. Tests: loop unit tests (tool-call parsing, multi-round), context/completeness tests, route auth tests. *Ship when: you can ask anything about a wedding and get grounded answers.*

**Phase 2 — Writes + confirmation gating.** Write/gated tools, pending-action persistence + Confirm/Decline cards, audit log, undo-info in responses. Tests: gating matrix (every tool × risk class), resume-after-confirm, decline path.

**Phase 3 — Onboarding + proactive prompts.** Completeness checklist injection, new-wedding greeting flow, suggestion behaviors; entry point on overview page for fresh weddings. Tests: snapshot completeness fixtures, eval scenarios for the onboarding conversation.

**Phase 4 — Voice input.** Push-to-talk in chat via `VoiceRecorder` → Groq Whisper → text into the same loop. (Output stays text for now; spoken replies are a WhatsApp-era decision.)

**Phase 5 — Learning loop.** Thumbs + correction UI, `agent_feedback`, eval harness buildout (≥20 scenarios incl. room-reshuffle, uncle-cancels, Thailand-linen), `agent_knowledge` + retrieval tool + seed data, Groq/Gemini fallback providers.

**Phase 6 — Expansion (separate planning pass).** Scheduled proactive check-ins; Build-AI route takeover (needs agent-native structured inputs: color picker, image upload cards in chat); WhatsApp transport for the couple (same loop, new channel + opt-in/DPDPA review); guest-facing merge evaluated last.

## Costs & env

- New env: `ANTHROPIC_API_KEY`, `AGENT_MODEL` (default `claude-opus-4-8`).
- Rough per-turn cost with caching: ~10–20K cached input (≈$0.005–0.01) + ~1–2K fresh input + ~500–1000 output (≈$0.01–0.03). A chatty wedding (300 turns/mo) ≈ **$3–8/mo** — fine inside $349+ pricing. Evals run on the same key; keep scenario count in CI modest.
- Vercel: chat route uses Node runtime (service-role Supabase) with streaming; keep each model round-trip well under function timeout — the loop already returns to the client between confirmation rounds.

## Non-goals (v1)

No fine-tuning. No guest-facing merge with the concierge. No WhatsApp transport yet. No autonomous sends — anything outbound is always gated. Build-AI keeps working as-is.
