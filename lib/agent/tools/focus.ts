import type { AgentToolDefinition, AgentToolContext } from '../types';
import {
  FOCUS_TITLE,
  SPINE_STEP_KEYS,
  nextSpineStep,
  spineStepLabel,
  type SpineFocus,
} from '../spine';

/**
 * The Working-on bar's backend (PLANNER-SPINE-TRACKER A1–A5): the current
 * spine step persists as a wedding-scoped agent_knowledge row (same pattern
 * as Planning goals — no migration needed), so a returning couple resumes
 * exactly where they left off. The bar above the chat renders this state;
 * the snapshot injects it every turn.
 */

async function readFocus(ctx: AgentToolContext): Promise<SpineFocus> {
  const { data } = await ctx.supabase
    .from('agent_knowledge')
    .select('metadata')
    .eq('wedding_id', ctx.weddingSlug)
    .eq('scope', 'wedding')
    .eq('title', FOCUS_TITLE)
    .maybeSingle();
  const meta = (data?.metadata ?? {}) as Partial<SpineFocus>;
  return {
    step: typeof meta.step === 'string' ? meta.step : null,
    done: Array.isArray(meta.done) ? meta.done.filter((s): s is string => typeof s === 'string') : [],
    skipped: Array.isArray(meta.skipped) ? meta.skipped.filter((s): s is string => typeof s === 'string') : [],
  };
}

async function writeFocus(ctx: AgentToolContext, focus: SpineFocus): Promise<void> {
  await ctx.supabase
    .from('agent_knowledge')
    .delete()
    .eq('wedding_id', ctx.weddingSlug)
    .eq('scope', 'wedding')
    .eq('title', FOCUS_TITLE);
  const summary = focus.step
    ? `Working on: ${spineStepLabel(focus.step)}`
    : 'All spine steps handled';
  const { error } = await ctx.supabase.from('agent_knowledge').insert({
    scope: 'wedding',
    wedding_id: ctx.weddingSlug,
    category: 'logistics',
    title: FOCUS_TITLE,
    content: `${summary}${focus.skipped.length ? ` (skipped: ${focus.skipped.join(', ')})` : ''}`,
    metadata: focus,
  });
  if (error) throw new Error(error.message);
}

const STEP_SCHEMA = {
  type: 'string',
  enum: SPINE_STEP_KEYS,
  description: 'Spine step key',
};

export const focusTools: AgentToolDefinition[] = [
  {
    name: 'set_current_focus',
    label: 'Updating what we’re working on',
    risk: 'write',
    description:
      'Set which planning-spine step the couple is working on right now (shown in the "Working on" bar above the chat, and remembered for their next visit). Call this whenever the active topic changes to a different spine step — including when YOU steer them to the next step. Steps in order: schedule, travel, website, guest-list, rsvps, rooms, vendors, registry, photos.',
    inputSchema: {
      type: 'object',
      properties: { step: STEP_SCHEMA },
      required: ['step'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const step = input.step as string;
      if (!SPINE_STEP_KEYS.includes(step)) throw new Error(`Unknown spine step: ${step}`);
      const focus = await readFocus(ctx);
      const next: SpineFocus = {
        step,
        done: focus.done.filter((k) => k !== step),
        skipped: focus.skipped.filter((k) => k !== step),
      };
      await writeFocus(ctx, next);
      return { workingOn: step, label: spineStepLabel(step), done: next.done, skipped: next.skipped };
    },
  },
  {
    name: 'complete_focus_step',
    label: 'Wrapping up this step',
    risk: 'write',
    description:
      'Mark a planning-spine step as finished ("done") or deferred ("skipped" — it resurfaces after the rest). Call when the couple confirms a step is wrapped up, or asks to skip/move on. The next unfinished step automatically becomes the new focus; tell them what it is in one line.',
    inputSchema: {
      type: 'object',
      properties: {
        step: STEP_SCHEMA,
        outcome: { type: 'string', enum: ['done', 'skipped'], description: '"done" = finished, "skipped" = defer for later' },
      },
      required: ['step', 'outcome'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const step = input.step as string;
      const outcome = input.outcome as 'done' | 'skipped';
      if (!SPINE_STEP_KEYS.includes(step)) throw new Error(`Unknown spine step: ${step}`);
      const focus = await readFocus(ctx);
      const done = outcome === 'done'
        ? [...new Set([...focus.done, step])]
        : focus.done.filter((k) => k !== step);
      const skipped = outcome === 'skipped'
        ? [...new Set([...focus.skipped, step])]
        : focus.skipped.filter((k) => k !== step);
      const nextStep = nextSpineStep(step, done, skipped);
      const next: SpineFocus = {
        step: nextStep,
        done,
        // A resurfaced step comes off the skipped list — it's active again.
        skipped: nextStep ? skipped.filter((k) => k !== nextStep) : skipped,
      };
      await writeFocus(ctx, next);
      return {
        completed: step,
        outcome,
        nextStep,
        nextLabel: spineStepLabel(nextStep),
        stillSkipped: next.skipped,
        allDone: !nextStep,
      };
    },
  },
];
