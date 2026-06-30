import Anthropic from '@anthropic-ai/sdk';
import type {
  AgentChatMessage,
  AgentContentBlock,
  AgentProvider,
  AgentToolDefinition,
  ProviderTurnResult,
} from '../types';

const DEFAULT_MODEL = 'claude-opus-4-8';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // maxRetries covers the initial request that opens the stream: the SDK retries
  // 408/409/429 and 5xx (incl. 529 "overloaded") with exponential backoff, so a
  // transient Anthropic blip doesn't kill the turn. We lift it from the default
  // 2 to ride out brief overload spikes. (Mid-stream failures still surface as a
  // friendly error in the chat; provider fallback is a later phase.)
  if (!client) client = new Anthropic({ maxRetries: 4 });
  return client;
}

function toAnthropicTools(tools: AgentToolDefinition[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
  }));
}

function toAnthropicContent(blocks: AgentContentBlock[]): unknown[] {
  const out: unknown[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'text':
        if (block.text.length > 0) out.push({ type: 'text', text: block.text });
        break;
      case 'tool_use':
        out.push({ type: 'tool_use', id: block.id, name: block.name, input: block.input });
        break;
      case 'tool_result':
        out.push({
          type: 'tool_result',
          tool_use_id: block.tool_use_id,
          content: block.content,
          ...(block.is_error ? { is_error: true } : {}),
        });
        break;
      case 'opaque':
        // Replay provider-internal blocks (thinking) verbatim — the API
        // rejects modified blocks, and stripping them can 400 mid-tool-loop.
        if (block.provider === 'anthropic') out.push(block.raw);
        break;
    }
  }
  return out;
}

function fromAnthropicContent(content: Anthropic.ContentBlock[]): AgentContentBlock[] {
  return content.map((block): AgentContentBlock => {
    if (block.type === 'text') return { type: 'text', text: block.text };
    if (block.type === 'tool_use') {
      return {
        type: 'tool_use',
        id: block.id,
        name: block.name,
        input: (block.input ?? {}) as Record<string, unknown>,
      };
    }
    return { type: 'opaque', provider: 'anthropic', raw: block as unknown as Record<string, unknown> };
  });
}

export const anthropicProvider: AgentProvider = {
  async streamTurn({ system, snapshot, messages, tools, onText, fast }): Promise<ProviderTurnResult> {
    // Voice turns optimize for latency: extended thinking adds seconds of
    // time-to-first-token, so it's disabled, and a faster model can be used via
    // AGENT_VOICE_MODEL. Typed turns keep adaptive thinking for deliberation.
    const model = fast
      ? process.env.AGENT_VOICE_MODEL || process.env.AGENT_MODEL || DEFAULT_MODEL
      : process.env.AGENT_MODEL || DEFAULT_MODEL;
    const stream = getClient().messages.stream({
      model,
      max_tokens: 8192,
      ...(fast ? {} : { thinking: { type: 'adaptive' } }),
      system: [
        // Static prompt + tool defs form the cached prefix; the snapshot
        // changes per request and must stay after the breakpoint.
        { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: `Current wedding state:\n\n${snapshot}` },
      ],
      tools: toAnthropicTools(tools),
      messages: messages.map((m: AgentChatMessage) => ({
        role: m.role,
        content: toAnthropicContent(m.content) as Anthropic.MessageParam['content'],
      })),
    });

    if (onText) stream.on('text', (delta) => onText(delta));

    const finalMessage = await stream.finalMessage();
    return {
      content: fromAnthropicContent(finalMessage.content),
      stopReason: finalMessage.stop_reason ?? 'end_turn',
      usage: {
        input_tokens: finalMessage.usage.input_tokens,
        output_tokens: finalMessage.usage.output_tokens,
        cache_read_input_tokens: finalMessage.usage.cache_read_input_tokens ?? 0,
        cache_creation_input_tokens: finalMessage.usage.cache_creation_input_tokens ?? 0,
      },
    };
  },
};
