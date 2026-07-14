import { publicSiteUrl } from '../sections';
import { readSectionMetrics } from '../section-metrics';
import type { AgentToolDefinition } from '../types';

/**
 * Publishing the wedding website.
 *
 * GATED on purpose: this is the moment the site becomes visible to anyone with
 * the link. It parks a Confirm card so the couple presses the button, not the
 * model. It is undoable (back to draft) via undo_last_action.
 */
export const publishTools: AgentToolDefinition[] = [
  {
    name: 'publish_website',
    label: 'Publishing the website',
    risk: 'gated',
    description:
      'Take the wedding website LIVE so guests can open it. Call this only once the couple has SAID they want to publish — the snapshot tells you whether the details are filled in. Publishing makes the site public at phera.io/<their-slug>. Afterwards, give them the link and offer to get it out to their guests. To take a live site back down, use undo_last_action.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    describe: async (_input, ctx) =>
      `Publish the wedding website — it becomes public at ${publicSiteUrl(ctx.weddingSlug)}`,
    captureBefore: async (_input, ctx) => {
      const { data: wedding } = await ctx.supabase
        .from('weddings')
        .select('status')
        .eq('id', ctx.weddingUuid)
        .maybeSingle();
      if (!wedding) return null;
      return {
        restore: 'update',
        table: 'weddings',
        match: { id: ctx.weddingUuid },
        values: { status: (wedding as { status: string | null }).status ?? 'draft' },
      };
    },
    execute: async (_input, ctx) => {
      // Don't publish a shell. A guest opening "Your Wedding · Venue TBD" is
      // worse than not having a site at all.
      const metrics = await readSectionMetrics(ctx.supabase, ctx.weddingSlug, ctx.weddingUuid);
      if (!metrics.detailsComplete) {
        throw new Error(
          'The website still has placeholders — names, date, venue and a welcome note need to be filled in before it goes live. Send them to the Website section first with hand_off_to_section.'
        );
      }

      const { error } = await ctx.supabase
        .from('weddings')
        .update({ status: 'live' })
        .eq('id', ctx.weddingUuid);
      if (error) throw new Error(error.message);

      const url = publicSiteUrl(ctx.weddingSlug);
      return {
        websitePublished: { url },
        url,
        summary: 'Website is live',
        note: 'Give them the link, tell them it is theirs to share, and offer to get it out to their guests over WhatsApp — or leave them to send it themselves.',
      };
    },
  },
];
