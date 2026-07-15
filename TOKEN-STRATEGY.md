# Token Strategy — Model Spend Audit & Open-Model Migration Plan

_Written 2026-07-15. Branch `feature/token-strategy`. Prices are mid-2026; re-run `/token-spend` to refresh._

> **Shipped in this PR (Phase 1 — safe, US-only, UAT-testable):**
> - Agent core default **Opus 4.8 → Sonnet 5** (`lib/agent/providers/anthropic.ts`). Still Anthropic/US. `AGENT_MODEL` overrides. Onboarding fast-path stays Haiku.
> - Cheap tier **Groq Llama 3.3 70B → Groq GPT-OSS-120B** (`openai/gpt-oss-120b`, `reasoning_format: 'hidden'`) across vendor extraction, travel content/polish, build-AI inquiry/classify, task-voice. Stays on Groq (US), ~75% cheaper + faster.
> - **Deliberately left on Llama:** the guest-facing concierge (`ai-handler`, `generate-knowledge`) — quality-sensitive, revisit after UAT.
> - **Not done yet:** Phase 0 telemetry (persist `usageTotals`). Do next so savings are measurable.
> - **No Chinese models, no OpenRouter** — Anthropic (US) + Groq (US) only. No aggregator SLA/ZDR risk.

## TL;DR

- **Where the money goes:** the Phera Agent loop runs on **Claude Opus 4.8** ($5 in / $25 out per 1M tokens). Everything else (extraction, classification, concierge, transcription) is already on cheap models (Groq Llama 3.3 70B, Gemini 2.5 Flash, Whisper). **The agent loop is ~the entire reducible bill.**
- **The catch:** the agent loop is exactly the workload open models are worst at — multi-turn **tool calls that read/write guest PII to the DB**. Benchmarks show a 15–25 pt agentic-reliability gap, and Chinese first-party APIs (DeepSeek/GLM/Kimi/Qwen) host in China → **DPDPA blocker** for passport/visa/phone data. So the move is **tiered/hybrid, not a wholesale swap.**
- **Realistic savings:**

| Path | Blended savings | Risk | Effort |
|---|---|---|---|
| **Safe** — Opus→Sonnet 5, Groq-Llama→GPT-OSS-120B | **~40–50%** | Near-zero | Env vars only |
| **Recommended** — tiered: open model on non-tool turns, frontier on DB-write turns | **~55–70%** | Low–medium | Write 1 provider + router |
| **Aggressive** — GLM-5.2 replaces Opus, GPT-OSS everywhere | **~85–90%** | Real (tool-call + PII) | Provider + eval gate + US-host/ZDR |

- **Do first (step 0):** there is **no token telemetry in the DB** — usage is only `console.log`'d (`lib/agent/loop.ts:528`). You can't measure real spend or verify savings until this is instrumented. Fix that before swapping anything.

---

## 1. Current strategy (the map)

Every place the app calls an LLM, and on what:

| Job | Model | Provider | Price /1M (in/out) | Open? |
|---|---|---|---|---|
| **Phera Agent — main loop** (chat, tool-calls, DB writes) | **claude-opus-4-8** | Anthropic | **$5 / $25** | No |
| Agent — onboarding stenography fast-path (names→city→goals) | claude-haiku-4-5 | Anthropic | $1 / $5 | No |
| Agent — voice turns | same, thinking off | Anthropic | $5 / $25 | No |
| Vendor insight extraction | llama-3.3-70b-versatile | Groq | $0.59 / $0.79 | ✅ |
| Concierge (WhatsApp) primary | gemini-2.5-flash | Google | ~$0.30 / $2.50 | No (cheap) |
| Concierge fallback | llama-3.3-70b-versatile | Groq | $0.59 / $0.79 | ✅ |
| Travel content, build-AI, task voice, knowledge-gen | llama-3.3-70b-versatile | Groq | $0.59 / $0.79 | ✅ |
| Broadcast/admin/rooms/guest-import extraction | gemini-2.5-flash | Google | ~$0.30 / $2.50 | No (cheap) |
| Transcription | whisper-large-v3-turbo | Groq | ~$0.04/hr | ✅ |
| TTS | Groq / Cartesia | — | cheap | mixed |
| `scripts/enrich-vendors.ts` (offline) | claude-haiku-4-5 | Anthropic | $1 / $5 | No |

**Config points (all env-driven — good):**
- `lib/agent/providers/anthropic.ts:10` — `DEFAULT_MODEL = 'claude-opus-4-8'`
- Env overrides: `AGENT_MODEL`, `AGENT_VOICE_MODEL`, `AGENT_ONBOARDING_MODEL`
- The cheap tasks hardcode `'llama-3.3-70b-versatile'` / `'gemini-2.5-flash'` inline (would need edits to swap).

**Key architectural fact:** the agent loop is **already provider-agnostic** — `AgentProvider` interface at `lib/agent/types.ts:246`, consumed via `provider.streamTurn` in `loop.ts`. Every API route just imports the concrete `anthropicProvider`. **Swapping to OpenRouter = write one `openrouterProvider` that implements the same interface, then choose it per-route.** No loop rewrite.

**Your instinct is half-built already.** "Use basic open models for simple details" — the Groq-Llama tier already does exactly that. The unrealized lever is the **Opus agent loop**.

---

## 2. Best open models right now (mid-2026)

### Tier 1 — frontier (for the hard/agentic path)

| Model | OpenRouter slug | Price /1M (in/out) | Ctx | Intelligence¹ | Tool-calls |
|---|---|---|---|---|---|
| **GLM-5.2** (Zhipu) — best open, closest to Opus | `z-ai/glm-5.2` | **$0.88 / $2.78** | 1M | 51.1 (Opus=55.7) | Strong (Exacto) |
| DeepSeek V4 Pro | `deepseek/deepseek-v4-pro` | $0.44 / $0.87 | 1M | 44.3 | Yes (probe) |
| MiniMax M3 | `minimax/minimax-m3` | $0.30 / $1.20² | 1M | 44.4 | Yes |
| Kimi K2.6 (Moonshot) | `moonshotai/kimi-k2.6` | $0.66 / $3.41 | 262K | 44.2 | Yes |

### Tier 2 — workhorse (for simple/extraction/classification)

| Model | OpenRouter slug | Price /1M (in/out) | Ctx | Notes |
|---|---|---|---|---|
| **GPT-OSS-120B** (value winner) | `openai/gpt-oss-120b` | **$0.03 / $0.15** | 131K | Native tool-calls + structured JSON, open weights |
| Llama 3.3 70B (most battle-tested) | `meta-llama/llama-3.3-70b-instruct` | $0.10 / $0.32 | 131K | Max provider redundancy |
| Gemma 4 26B-A4B | `google/gemma-4-26b-a4b-it` | $0.06 / $0.33 | — | Native function-calling |
| Ministral 3 3B | — | $0.10 / $0.10 | — | Cheapest trivial routing |

¹ Artificial Analysis Intelligence Index (aggregate 0–100, the one verifiable cross-model metric). Per-benchmark SWE-bench/GPQA numbers on blogs are unverified — directional only.
² Flagged as possibly a 50%-off promo from 2026-06-01; budget for a 2× revert.

### Anchors (what you pay today)

Claude Opus 4.8 **$5/$25** · Sonnet 5 **$3/$15** ($2/$10 intro → 2026-08-31) · Haiku 4.5 **$1/$5**.

---

## 3. Savings math (per swap)

| Swap | Input cut | Output cut |
|---|---|---|
| Opus 4.8 → **GLM-5.2** | **82%** | **89%** |
| Opus 4.8 → DeepSeek V4 Pro | 91% | 97% |
| Opus 4.8 → **Sonnet 5** | 40% (60% intro) | 40% (60% intro) |
| Haiku 4.5 → GPT-OSS-120B | 97% | 97% |
| Groq Llama 3.3 70B → **GPT-OSS-120B** | 95% | 81% |

**Blended, assuming the Opus agent loop ≈ 75% of spend** (an assumption — no telemetry yet):

- **Safe path** (agent −40%, cheap slice −60%): `0.75×0.40 + 0.25×0.60` ≈ **45%**.
- **Recommended tiered** (open on ~half the agent turns + open workhorse): **~55–70%**.
- **Aggressive** (GLM-5.2 replaces Opus + GPT-OSS everywhere): **~85–90%**.

Real number depends entirely on turn mix. **Instrument first, then this becomes measurable instead of modeled.**

---

## 4. The honest catch (why not just swap Opus → GLM-5.2 today)

This is an **agentic app writing guest PII to a DB** — the highest-risk workload for open models. Research is blunt:

1. **Tool-call reliability gap.** tau2-bench (multi-turn tool use vs DB state): Claude ~91–99% vs GLM-4.6 76%, Kimi 75%, Qwen3-32B 42%. Open models invent/drop tool-JSON fields → your DB write throws or corrupts silently. Tool fidelity is also **schema/harness-dependent**, not just a model-tier dial.
2. **Structured-output adherence.** Many open endpoints guarantee JSON *syntax* but not *schema* — required fields go missing. Mitigate with providers that do grammar/guided decoding (Fireworks, vLLM), and tight schemas (+10–20% accuracy).
3. **PII / DPDPA (compliance gate, not a preference).** DeepSeek/GLM/Kimi/Qwen **first-party APIs route to China**. Guest passport/visa/phone in `logistics_data` cannot go there. **Fix:** run the *open weights* on **US/EU hosts** (DeepInfra, Together, Fireworks, Novita) and enforce **OpenRouter ZDR** — but still need a DPA. Model *hosting jurisdiction* is the gate.
4. **OpenRouter itself** — no SLA, ~3 outages/8mo (35–50 min each). No per-token markup (passthrough) but ~5.5% card-purchase fee; BYOK free to $25k/mo list price. It reduces provider lock-in but adds an un-SLA'd single point of failure — keep a provider-direct key as backstop.
5. **Anthropic features don't port** — `cache_control` prompt caching (already used in `anthropic.ts:92`), adaptive thinking, tool-call robustness. Moving off trades a guaranteed dependency for a cheaper, less-guaranteed one.

**Bottom line:** don't move the DB-writing agent core wholesale. Keep a frontier model on tool-executing/multi-step-reasoning turns; route low-stakes non-tool work (drafting messages, summarizing threads, classifying intent, extracting fields *before* validated write) to open models. Near-term savings live on the non-agentic slice + a model downgrade, not on the agent core.

---

## 5. Recommended path (phased)

**Phase 0 — Instrument (do before anything).** Persist `usageTotals` (already computed in `loop.ts:346`) to an `agent_usage` table or the existing `agent_actions`, with model name + token counts + estimated cost. Without this you're flying blind. _~half a day._

**Phase 1 — Free/near-free wins (env + small edits, ~0 risk).**
- `AGENT_MODEL=claude-sonnet-5` — test Sonnet 5 on the agent evals (`docs/AGENT-EVALS.md`). If it holds, that's ~40% (60% intro) off the biggest line with no code change.
- Swap the Groq `llama-3.3-70b-versatile` tier → Groq `openai/gpt-oss-120b` (stays on Groq = US, fast, ~75% cheaper) for the non-PII generation tasks.
- Verify Anthropic prompt caching hit-rate is high (ProjectDiscovery cut 59–70% on caching alone). Cache breakpoint is at `anthropic.ts:92`.

**Phase 2 — Build the OpenRouter provider (unlock the tiered play).**
- Add `lib/agent/providers/openrouter.ts` implementing `AgentProvider` (OpenAI-compatible; ~1 file). Gate behind `AGENT_PROVIDER=openrouter`.
- Route **non-tool / low-stakes turns** to `z-ai/glm-5.2` (or `openai/gpt-oss-120b` for cheap ones); keep tool-executing turns on Claude.
- **Enforce ZDR + pin US/EU providers** for any turn touching guest PII. This is the DPDPA gate.
- Add an **eval gate on tool-call validity** — widen the open-model share one notch at a time, measured on real traffic (`agent-lab/` is the harness).

**Phase 3 — Escalation router (optional, if volume justifies).**
- Classifier picks cheap vs frontier per turn (semantic-router = no extra LLM call; or RouteLLM — published 85% cost cut at 95% quality). Only worth it at scale.

---

## 6. Sources

OpenRouter [pricing](https://openrouter.ai/pricing) · [routing](https://openrouter.ai/blog/insights/model-routing/) · [ZDR](https://openrouter.ai/docs/guides/features/zdr) · [outages](https://openrouter.ai/announcements/openrouter-outages-on-february-17-and-19-2026). Models: [GLM-5.2](https://openrouter.ai/z-ai/glm-5.2) · [GPT-OSS-120B](https://openrouter.ai/openai/gpt-oss-120b) · [DeepSeek V4 Pro](https://openrouter.ai/deepseek/deepseek-v4-pro). [RouteLLM](https://github.com/lm-sys/RouteLLM) (85%/95%) · [semantic-router](https://github.com/aurelio-labs/semantic-router) · [tau2-bench agentic gap](https://awesomeagents.ai/leaderboards/agentic-ai-benchmarks-leaderboard/) · [tool-schema regression](https://lucumr.pocoo.org/2026/7/4/better-models-worse-tools/) · [DeepSeek PII/China risk](https://theori.io/blog/deepseek-security-privacy-and-governance-hidden-risks-in-open-source-ai) · [DeepSeek caching 90% off](https://api-docs.deepseek.com/guides/kv_cache/).

_Prices/benchmarks drift monthly. Re-run `/token-spend` to regenerate this against the current model landscape._
