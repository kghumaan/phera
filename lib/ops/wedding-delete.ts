import { OPS_DELETE_TABLES } from './constants';
import { getOpsSupabaseAdmin } from './supabase-admin';

export type DeletePreviewRow = { table: string; count: number };

export async function previewWeddingDelete(slug: string): Promise<{
  slug: string;
  weddingId: string | null;
  exists: boolean;
  rows: DeletePreviewRow[];
  total: number;
}> {
  const supabase = getOpsSupabaseAdmin();

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  const weddingId = (wedding?.id as string | undefined) ?? null;
  const exists = !!weddingId;

  const rows: DeletePreviewRow[] = [];

  for (const t of OPS_DELETE_TABLES) {
    let count = 0;

    if (t.keyType === 'slug') {
      const { count: c } = await supabase
        .from(t.table)
        .select('*', { count: 'exact', head: true })
        .eq(t.key, slug);
      count = c ?? 0;
    } else if (t.keyType === 'uuid') {
      if (!weddingId) {
        count = 0;
      } else {
        const { count: c } = await supabase
          .from(t.table)
          .select('*', { count: 'exact', head: true })
          .eq(t.key, weddingId);
        count = c ?? 0;
      }
    } else if (t.keyType === 'schedule_child') {
      if (!weddingId) {
        count = 0;
      } else {
        const { data: schedules } = await supabase
          .from('wedding_schedule')
          .select('id')
          .eq('wedding_id', weddingId);
        const ids = (schedules || []).map((s: { id: string }) => s.id);
        if (ids.length === 0) {
          count = 0;
        } else {
          const { count: c } = await supabase
            .from(t.table)
            .select('*', { count: 'exact', head: true })
            .in(t.key, ids);
          count = c ?? 0;
        }
      }
    }

    rows.push({ table: t.table, count });
  }

  // weddings itself
  rows.push({ table: 'weddings', count: exists ? 1 : 0 });

  const total = rows.reduce((a, r) => a + r.count, 0);
  return { slug, weddingId, exists, rows, total };
}

export async function deleteWedding(slug: string): Promise<{
  slug: string;
  weddingId: string | null;
  deleted: Array<{ table: string; deleted: number; error?: string }>;
}> {
  const supabase = getOpsSupabaseAdmin();

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  const weddingId = (wedding?.id as string | undefined) ?? null;
  const results: Array<{ table: string; deleted: number; error?: string }> = [];

  // pre-fetch schedule ids for schedule_child deletes
  let scheduleIds: string[] = [];
  if (weddingId) {
    const { data: schedules } = await supabase
      .from('wedding_schedule')
      .select('id')
      .eq('wedding_id', weddingId);
    scheduleIds = (schedules || []).map((s: { id: string }) => s.id);
  }

  for (const t of OPS_DELETE_TABLES) {
    try {
      if (t.keyType === 'slug') {
        const { count, error } = await supabase
          .from(t.table)
          .delete({ count: 'exact' })
          .eq(t.key, slug);
        if (error) throw error;
        results.push({ table: t.table, deleted: count ?? 0 });
      } else if (t.keyType === 'uuid') {
        if (!weddingId) {
          results.push({ table: t.table, deleted: 0 });
          continue;
        }
        const { count, error } = await supabase
          .from(t.table)
          .delete({ count: 'exact' })
          .eq(t.key, weddingId);
        if (error) throw error;
        results.push({ table: t.table, deleted: count ?? 0 });
      } else if (t.keyType === 'schedule_child') {
        if (scheduleIds.length === 0) {
          results.push({ table: t.table, deleted: 0 });
          continue;
        }
        const { count, error } = await supabase
          .from(t.table)
          .delete({ count: 'exact' })
          .in(t.key, scheduleIds);
        if (error) throw error;
        results.push({ table: t.table, deleted: count ?? 0 });
      }
    } catch (e) {
      results.push({
        table: t.table,
        deleted: 0,
        error: (e as Error).message,
      });
    }
  }

  // Finally delete the weddings row
  if (weddingId) {
    const { count, error } = await supabase
      .from('weddings')
      .delete({ count: 'exact' })
      .eq('id', weddingId);
    results.push({
      table: 'weddings',
      deleted: count ?? 0,
      error: error?.message,
    });
  } else {
    results.push({ table: 'weddings', deleted: 0 });
  }

  return { slug, weddingId, deleted: results };
}
