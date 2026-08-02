import {
  HANDOFF_TITLE,
  SECTIONS,
  SECTION_KEYS,
  isSectionKey,
  type HandoffState,
  type SectionKey,
} from '../sections';
import { readSectionMetrics } from '../section-metrics';
import type { AgentToolContext, AgentToolDefinition } from '../types';

/**
 * Handoffs to the rich sections.
 *
 * The agent can do quick single-field edits in chat, but designing a website,
 * tagging a 300-person guest list or placing families in rooms belongs in the
 * real UI. So: send them there with a button, remember what the data looked
 * like at that moment, and use that baseline to SEE what they did when they
 * come back — rather than nagging "are you done yet?".
 */

async function clearHandoff(ctx: AgentToolContext) {
  await ctx.supabase
    .from('agent_knowledge')
    .delete()
    .eq('wedding_id', ctx.weddingSlug)
    .eq('title', HANDOFF_TITLE);
}

export async function readHandoff(
  supabase: AgentToolContext['supabase'],
  weddingSlug: string
): Promise<HandoffState | null> {
  const { data } = await supabase
    .from('agent_knowledge')
    .select('metadata')
    .eq('wedding_id', weddingSlug)
    .eq('title', HANDOFF_TITLE)
    .maybeSingle();
  const meta = (data as { metadata?: unknown } | null)?.metadata as Partial<HandoffState> | undefined;
  if (!meta || !isSectionKey(meta.section) || !meta.baseline) return null;
  return meta as HandoffState;
}

/**
 * Which rich section a message is ASKING for — used by the loop's safety net.
 * Deliberately narrow: it wants the "do this area for me" shape of request, not
 * a passing mention ("what's on the website?") and not a one-field fix ("change
 * the venue to X"), which the agent should answer in chat without a handoff.
 */
const DO_IT = /\b(build|make|create|set ?up|start|sort|design|do|handle|help me with|work on|get .* (in|going|started)|organi[sz]e|tag|assign|place|put)\b/i;
const NOT_A_HANDOFF = /\b(change|update|fix|correct|rename|move|delete|remove|what|when|where|who|how many|show|list)\b.*\b(venue|date|time|name)\b/i;
const SECTION_PATTERNS: Array<{ section: SectionKey; re: RegExp }> = [
  { section: 'website', re: /\b(website|web site|our site|the site|wedding page|landing page)\b/i },
  { section: 'guest-list', re: /\b(guest list|guestlist|guest-list|invite list|our guests)\b/i },
  { section: 'rooms', re: /\b(rooms?|room assignments?|hotel rooms?|who sleeps where)\b/i },
];

export function sectionAskedFor(message: string): SectionKey | null {
  // Only ever act on what the COUPLE typed. The loop also runs turns whose
  // "user message" is a synthetic note we wrote ourselves — a confirmation
  // receipt, their answers to a card, a kickoff. Those are full of words like
  // "do not re-run the tool" and would otherwise be read as a request.
  if (message.trimStart().startsWith('⟦')) return null;
  if (!DO_IT.test(message) || NOT_A_HANDOFF.test(message)) return null;
  return SECTION_PATTERNS.find(({ re }) => re.test(message))?.section ?? null;
}

/**
 * Open a section on the agent's behalf when it answered the request but never
 * rendered the button. Skips sections that already look done (they don't need
 * sending anywhere) and any section already handed off — so this can only ever
 * ADD the door they were missing, never nag.
 */
export async function openSectionIfNeeded(
  section: SectionKey,
  ctx: AgentToolContext
): Promise<{ section: SectionKey; label: string; url: string; blurb: string } | null> {
  // NEVER touch an existing handoff. Replacing one would delete the baseline the
  // couple's in-progress section is being measured against — one stray message
  // ("put Arjun on the guest list") while they're off filling in the website
  // would destroy the agent's only record of what the website looked like before.
  const open = await readHandoff(ctx.supabase, ctx.weddingSlug);
  if (open) return null;

  const def = SECTIONS[section];
  const baseline = await readSectionMetrics(ctx.supabase, ctx.weddingSlug, ctx.weddingUuid);
  // A live site, a list that already has guests, rooms already assigned — they
  // don't need sending anywhere, and the model may well have just done the thing
  // they asked for in chat. Only open the door when there's real work waiting.
  if (section === 'website' ? baseline.published : def.looksDone(baseline)) return null;

  const state: HandoffState = { section, at: new Date().toISOString(), baseline };
  await clearHandoff(ctx);
  await ctx.supabase.from('agent_knowledge').insert({
    wedding_id: ctx.weddingSlug,
    title: HANDOFF_TITLE,
    content: `Sent them to ${def.label}`,
    metadata: state as unknown as Record<string, unknown>,
  });
  return { section, label: def.label, url: def.path(ctx.weddingSlug), blurb: def.blurb };
}

export const handoffTools: AgentToolDefinition[] = [
  {
    name: 'hand_off_to_section',
    label: 'Opening the right section',
    risk: 'write',
    description:
      'Send the couple to a rich section of Phera to do detailed work there — designing/filling the WEBSITE, organising and tagging the GUEST LIST, or placing guests in ROOMS. Renders a button they tap. Call this INSTEAD of trying to do that detailed work through chat, and instead of pasting a link. It also records what the data looks like right now, so when they come back you can see exactly what they changed. Tell them in one warm line what to do there and that you\'ll be right here when they\'re back.',
    inputSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: SECTION_KEYS,
          description: 'website = site details/design · guest-list = adding and tagging guests · rooms = room assignments',
        },
      },
      required: ['section'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const section = input.section as SectionKey;
      const def = SECTIONS[section];
      if (!def) throw new Error(`Unknown section: ${section}`);

      const baseline = await readSectionMetrics(ctx.supabase, ctx.weddingSlug, ctx.weddingUuid);
      const state: HandoffState = { section, at: new Date().toISOString(), baseline };

      // One open handoff at a time — a new one replaces the old.
      await clearHandoff(ctx);
      await ctx.supabase.from('agent_knowledge').insert({
        wedding_id: ctx.weddingSlug,
        title: HANDOFF_TITLE,
        content: `Sent them to ${def.label}`,
        metadata: state as unknown as Record<string, unknown>,
      });

      return {
        sectionHandoff: {
          section,
          label: def.label,
          url: def.path(ctx.weddingSlug),
          blurb: def.blurb,
        },
        summary: `Opened ${def.label}`,
        note: 'They are heading to the section now. When they return, the snapshot will tell you what changed — acknowledge what they actually did before asking anything.',
      };
    },
  },
  {
    name: 'finish_section',
    label: 'Closing out the section',
    risk: 'write',
    description:
      'Call this once the couple has confirmed they are done with the section you sent them to (they said yes to your "happy with this for now?" question). It clears the open handoff so you stop tracking it, and you can move on to the next step.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const open = await readHandoff(ctx.supabase, ctx.weddingSlug);
      await clearHandoff(ctx);
      return {
        closed: open?.section ?? null,
        summary: open ? `${SECTIONS[open.section].label} wrapped up` : 'Nothing was open',
      };
    },
  },
];
