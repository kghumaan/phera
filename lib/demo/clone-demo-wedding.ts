import { createClient } from '@supabase/supabase-js';
import { PheraDatabase } from '@/lib/supabase/types';

const TEMPLATE_SLUG = 'demo-template';
const DEMO_SLUG_PREFIX = 'demo-';
const DEMO_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

function getServiceClient() {
  return createClient<PheraDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateDemoSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const b of bytes) {
    suffix += chars[b % chars.length];
  }
  return `${DEMO_SLUG_PREFIX}${suffix}`;
}

export async function cloneDemoWedding(userId: string): Promise<string> {
  const supabase = getServiceClient();

  // 1. Fetch template wedding
  const { data: template, error: templateError } = await supabase
    .from('weddings')
    .select('*')
    .eq('slug', TEMPLATE_SLUG)
    .single();

  if (templateError || !template) {
    throw new Error(`Template wedding "${TEMPLATE_SLUG}" not found`);
  }

  // 2. Generate unique slug
  const newSlug = generateDemoSlug();

  // 3. Insert cloned wedding row
  const { id: _id, created_at: _ca, updated_at: _ua, slug: _slug, created_by: _cb, ...weddingData } = template;

  const { data: newWedding, error: insertError } = await supabase
    .from('weddings')
    .insert({
      ...weddingData,
      slug: newSlug,
      created_by: userId,
      status: 'draft',
    } as any)
    .select('id')
    .single();

  if (insertError || !newWedding) {
    throw new Error(`Failed to create demo wedding: ${insertError?.message}`);
  }

  const newWeddingId = newWedding.id;

  // 4. Clone child tables in parallel where possible

  // Clone events (need ID mapping for schedule_items)
  const { data: templateEvents } = await supabase
    .from('wedding_events')
    .select('*')
    .eq('wedding_id', template.id)
    .order('order_index', { ascending: true });

  const eventIdMapping: Record<string, string> = {};
  if (templateEvents?.length) {
    const eventsToInsert = templateEvents.map(({ id, wedding_id, created_at, ...rest }) => ({
      ...rest,
      wedding_id: newWeddingId,
    }));

    const { data: newEvents } = await supabase
      .from('wedding_events')
      .insert(eventsToInsert as any)
      .select('id, order_index');

    if (newEvents) {
      // Map old IDs to new IDs by matching order_index
      for (let i = 0; i < templateEvents.length; i++) {
        const match = newEvents.find((e: any) => e.order_index === templateEvents[i].order_index);
        if (match) {
          eventIdMapping[templateEvents[i].id] = match.id;
        }
      }
    }
  }

  // Clone schedule days (need ID mapping for schedule_items)
  const { data: templateSchedule } = await supabase
    .from('wedding_schedule')
    .select('*')
    .eq('wedding_id', template.id)
    .order('order_index', { ascending: true });

  const scheduleIdMapping: Record<string, string> = {};
  if (templateSchedule?.length) {
    const schedulesToInsert = templateSchedule.map(({ id, wedding_id, created_at, ...rest }) => ({
      ...rest,
      wedding_id: newWeddingId,
    }));

    const { data: newSchedules } = await supabase
      .from('wedding_schedule')
      .insert(schedulesToInsert as any)
      .select('id, order_index');

    if (newSchedules) {
      for (let i = 0; i < templateSchedule.length; i++) {
        const match = newSchedules.find((s: any) => s.order_index === templateSchedule[i].order_index);
        if (match) {
          scheduleIdMapping[templateSchedule[i].id] = match.id;
        }
      }
    }
  }

  // Clone schedule_items (remap schedule_id and event_id)
  if (templateSchedule?.length) {
    const scheduleIds = templateSchedule.map(s => s.id);
    const { data: templateItems } = await supabase
      .from('schedule_items')
      .select('*')
      .in('schedule_id', scheduleIds)
      .order('order_index', { ascending: true });

    if (templateItems?.length) {
      const itemsToInsert = templateItems
        .filter(item => scheduleIdMapping[item.schedule_id!])
        .map((item) => {
          const { id, schedule_id, created_at, ...rest } = item as any;
          const eventId = (item as any).event_id;
          return {
            ...rest,
            schedule_id: scheduleIdMapping[schedule_id!],
            event_id: eventId ? (eventIdMapping[eventId] || null) : null,
          };
        });

      if (itemsToInsert.length) {
        await supabase.from('schedule_items').insert(itemsToInsert as any);
      }
    }
  }

  // Clone simple child tables in parallel (no ID remapping needed)
  const simpleClones = [
    cloneSimpleTable(supabase, 'wedding_faqs', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_travel_cards', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_registry', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_shops', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_settings', template.id, newWeddingId),
  ];

  // Create wedding_admins entry (demo user as owner)
  const adminInsert = supabase.from('wedding_admins').insert({
    wedding_id: newWeddingId,
    user_id: userId,
    role: 'owner',
  } as any).then(() => {});
  simpleClones.push(adminInsert as Promise<void>);

  await Promise.all(simpleClones);

  return newSlug;
}

async function cloneSimpleTable(
  supabase: ReturnType<typeof getServiceClient>,
  tableName: string,
  templateWeddingId: string,
  newWeddingId: string
) {
  const { data: rows } = await supabase
    .from(tableName as any)
    .select('*')
    .eq('wedding_id', templateWeddingId);

  if (!rows?.length) return;

  const cloned = rows.map((row: any) => {
    const { id, wedding_id, created_at, updated_at, ...rest } = row;
    return { ...rest, wedding_id: newWeddingId };
  });

  await supabase.from(tableName as any).insert(cloned);
}

export async function cleanupExpiredDemoWeddings(userId: string) {
  const supabase = getServiceClient();

  const cutoff = new Date(Date.now() - DEMO_MAX_AGE_MS).toISOString();

  // Find expired demo weddings by this user
  const { data: expired } = await supabase
    .from('weddings')
    .select('id, slug')
    .eq('created_by', userId)
    .like('slug', `${DEMO_SLUG_PREFIX}%`)
    .neq('slug', TEMPLATE_SLUG)
    .lt('created_at', cutoff);

  if (!expired?.length) return;

  const weddingIds = expired.map(w => w.id);

  // Delete child tables explicitly (no guaranteed CASCADE)
  const childTables = [
    'schedule_items',
    'wedding_schedule',
    'wedding_events',
    'wedding_faqs',
    'wedding_travel_cards',
    'wedding_registry',
    'wedding_shops',
    'wedding_settings',
    'wedding_admins',
  ];

  // schedule_items needs special handling — delete by schedule_id
  const { data: schedules } = await supabase
    .from('wedding_schedule')
    .select('id')
    .in('wedding_id', weddingIds);

  if (schedules?.length) {
    await supabase
      .from('schedule_items' as any)
      .delete()
      .in('schedule_id', schedules.map(s => s.id));
  }

  // Delete other child tables
  for (const table of childTables.filter(t => t !== 'schedule_items')) {
    await supabase
      .from(table as any)
      .delete()
      .in('wedding_id', weddingIds);
  }

  // Delete the wedding rows
  await supabase
    .from('weddings')
    .delete()
    .in('id', weddingIds);
}
