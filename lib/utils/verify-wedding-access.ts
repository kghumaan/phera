import { SupabaseClient } from '@supabase/supabase-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verify access to a wedding referenced by EITHER its id or its slug, and
 * hand back the canonical pair so callers never mix a verified id with an
 * unverified slug from the same request body.
 *
 * Shape alone can't tell the two apart: a draft wedding minted by
 * /api/agent/onboard/start has a raw UUID as its SLUG, so a UUID-shaped ref
 * must still fall back to a slug lookup when nothing matches on id.
 */
export async function resolveWeddingAccess(
  supabase: SupabaseClient,
  userId: string,
  ref: string
): Promise<{ id: string; slug: string } | null> {
  const lookup = async (column: 'id' | 'slug') => {
    const { data } = await supabase
      .from('weddings')
      .select('id, slug, created_by')
      .eq(column, ref)
      .maybeSingle();
    return data;
  };

  const wedding = (UUID_RE.test(ref) ? await lookup('id') : null) ?? (await lookup('slug'));
  if (!wedding) return null;
  if (wedding.created_by === userId) return { id: wedding.id, slug: wedding.slug };

  const { data: admin } = await supabase
    .from('wedding_admins')
    .select('id')
    .eq('wedding_id', wedding.id)
    .eq('user_id', userId)
    .maybeSingle();

  return admin ? { id: wedding.id, slug: wedding.slug } : null;
}

/**
 * Verify that a user owns or administers a wedding.
 * Checks weddings.created_by and wedding_admins table.
 * Returns true if the user is the owner or an admin of the wedding.
 */
export async function verifyWeddingAccess(
  supabase: SupabaseClient,
  userId: string,
  weddingId: string
): Promise<boolean> {
  // Check if user is the wedding owner
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, created_by')
    .eq('id', weddingId)
    .single();

  if (!wedding) return false;
  if (wedding.created_by === userId) return true;

  // Check if user is a wedding admin
  const { data: admin } = await supabase
    .from('wedding_admins')
    .select('id')
    .eq('wedding_id', wedding.id)
    .eq('user_id', userId)
    .single();

  return !!admin;
}

/**
 * Same check, but keyed by the wedding's slug (guests/rsvps/etc. store
 * wedding_id as the TEXT slug, not the weddings.id UUID).
 */
export async function verifyWeddingAccessBySlug(
  supabase: SupabaseClient,
  userId: string,
  weddingSlug: string
): Promise<boolean> {
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, created_by')
    .eq('slug', weddingSlug)
    .single();

  if (!wedding) return false;
  if (wedding.created_by === userId) return true;

  const { data: admin } = await supabase
    .from('wedding_admins')
    .select('id')
    .eq('wedding_id', wedding.id)
    .eq('user_id', userId)
    .single();

  return !!admin;
}
