import { WeddingService } from '@/lib/supabase/wedding-service';
import type { TypedSupabaseClient } from '@/lib/supabase/client';
import { generateWeddingSlug, findUniqueSlug } from '@/lib/stripe/planner-wedding';
import { publicSiteUrl } from '../sections';
import { readSectionMetrics } from '../section-metrics';
import type { AgentToolDefinition } from '../types';

// Matches the placeholder slugs assigned before a couple's names are known:
// a raw crypto.randomUUID() (app/api/agent/onboard/start) or the `w-<ms>`
// fallback (app/api/stripe/charge-planner-wedding). A couple who already has
// a real, intentional slug never matches this and is left alone.
const PLACEHOLDER_SLUG_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|w-\d+)$/i;

// Not yet in the generated Supabase types — added by
// migrations/20260801_rename_wedding_slug.sql, types regenerate once applied.
interface SupabaseClientWithSlugRename {
  rpc(
    fn: 'rename_wedding_slug',
    args: { p_wedding_id: string; p_new_slug: string }
  ): Promise<{ error: { message: string } | null }>;
}

/**
 * If the wedding is still on its draft placeholder slug and we now know the
 * couple's real name (guaranteed by the detailsComplete check above this
 * call site), rename it to a names-based slug before the site goes public —
 * nobody should have to share a UUID as their wedding link. Best-effort: a
 * failure here (slug collision, RPC error) must never block the publish
 * itself, so it only logs and falls through on the old slug.
 */
async function renameToNamesSlugIfPlaceholder(
  supabase: TypedSupabaseClient,
  weddingUuid: string,
  currentSlug: string
): Promise<string> {
  if (!PLACEHOLDER_SLUG_RE.test(currentSlug)) return currentSlug;

  const { data: wedding } = await supabase
    .from('weddings')
    .select('couple_name')
    .eq('id', weddingUuid)
    .maybeSingle();
  const coupleName = (wedding as { couple_name?: string | null } | null)?.couple_name;
  const base = coupleName ? generateWeddingSlug(coupleName) : '';
  if (!base) return currentSlug;

  try {
    const service = new WeddingService(supabase);
    const candidate = await findUniqueSlug(base, (s) => service.checkSlugAvailability(s, weddingUuid));
    const { error } = await (supabase as unknown as SupabaseClientWithSlugRename).rpc('rename_wedding_slug', {
      p_wedding_id: weddingUuid,
      p_new_slug: candidate,
    });
    if (error) throw new Error(error.message);
    return candidate;
  } catch (err) {
    console.error('[publish_website] slug auto-rename failed, keeping placeholder slug:', err);
    return currentSlug;
  }
}

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
        .select('status, has_unpublished_changes')
        .eq('id', ctx.weddingUuid)
        .maybeSingle();
      if (!wedding) return null;
      const prior = wedding as { status: string | null; has_unpublished_changes: boolean | null };
      return {
        restore: 'update',
        table: 'weddings',
        match: { id: ctx.weddingUuid },
        // Undo puts the site back in draft AND re-flags it as unpublished, so
        // the admin header tells the truth again.
        values: {
          status: prior.status ?? 'draft',
          has_unpublished_changes: prior.has_unpublished_changes ?? true,
        },
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

      // Before going live, trade a placeholder draft slug (raw UUID) for a
      // names-based one — a couple's real slug is guaranteed available now
      // since detailsComplete just confirmed nameSet.
      const slug = await renameToNamesSlugIfPlaceholder(
        ctx.supabase as TypedSupabaseClient,
        ctx.weddingUuid,
        ctx.weddingSlug
      );
      ctx.weddingSlug = slug;

      // Publish exactly the way the admin Publish button does. Flipping status
      // alone is NOT publishing: the guest site renders from published_snapshot
      // when one exists, so a status-only update would leave guests looking at
      // the previous version while the agent claims the new one is live — and
      // would leave "unpublished changes" showing in the admin header.
      const published = await new WeddingService(ctx.supabase as TypedSupabaseClient).publishWedding(
        ctx.weddingUuid
      );
      if (!published) throw new Error('The site could not be published — please try the Settings & Publish page.');

      const url = publicSiteUrl(slug);
      return {
        websitePublished: { url, slug },
        url,
        summary: 'Website is live',
        note: 'Give them the link, tell them it is theirs to share, and offer to get it out to their guests over WhatsApp — or leave them to send it themselves.',
      };
    },
  },
];
