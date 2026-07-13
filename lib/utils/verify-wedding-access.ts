import { SupabaseClient } from '@supabase/supabase-js';

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
