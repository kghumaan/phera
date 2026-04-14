import { createClient } from '@supabase/supabase-js';
import { PheraDatabase } from '@/lib/supabase/types';
import { seedDemoMockData } from './seed-demo-mock-data';
import { generateGuestAvatar, generateFallbackColor } from '@/lib/utils/avatar-generator';

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
          const eventId = (item as any).linked_event_id;
          return {
            ...rest,
            schedule_id: scheduleIdMapping[schedule_id!],
            linked_event_id: eventId ? (eventIdMapping[eventId] || null) : null,
          };
        });

      if (itemsToInsert.length) {
        await supabase.from('schedule_items').insert(itemsToInsert as any);
      }
    }
  }

  // Clone guests (need ID mapping for whatsapp_chat_history)
  const guestIdMapping: Record<string, string> = {};
  const { data: templateGuests } = await (supabase as any)
    .from('guests')
    .select('*')
    .eq('wedding_id', TEMPLATE_SLUG);

  if (templateGuests?.length) {
    const guestsToInsert = templateGuests.map(({ id, wedding_id, created_at, initials, ...rest }: any) => {
      // Ensure every cloned guest has a deterministic avatar so the demo
      // renders fully populated circles everywhere (activity feed, comments,
      // guest list, etc.). Falls back gracefully when the template row
      // doesn't already carry these fields.
      const name = rest.name || 'Guest';
      const seed = (rest.email || rest.phone || name).toString();
      const color = rest.avatar_color || generateFallbackColor(name);
      let avatarSvg = rest.avatar_svg;
      if (!avatarSvg) {
        try {
          avatarSvg = generateGuestAvatar(seed, name).svg;
        } catch {
          avatarSvg = null;
        }
      }

      return {
        ...rest,
        wedding_id: newSlug,
        avatar_color: color,
        avatar_svg: avatarSvg,
      };
    });

    const { data: newGuests } = await (supabase as any)
      .from('guests')
      .insert(guestsToInsert)
      .select('id, name');

    if (newGuests) {
      // Map by name (unique per wedding) since order may differ
      const templateByName = new Map(templateGuests.map((g: any) => [g.name, g.id]));
      for (const ng of newGuests) {
        const oldId = templateByName.get(ng.name);
        if (oldId) guestIdMapping[oldId as string] = ng.id;
      }
    }
  }

  // Clone whatsapp_chat_history (remap guest_id)
  if (Object.keys(guestIdMapping).length > 0) {
    const { data: templateChat } = await (supabase as any)
      .from('whatsapp_chat_history')
      .select('*')
      .eq('wedding_id', template.id)
      .order('created_at', { ascending: true });

    if (templateChat?.length) {
      const chatToInsert = templateChat
        .filter((msg: any) => !msg.guest_id || guestIdMapping[msg.guest_id])
        .map(({ id, wedding_id, created_at, ...rest }: any) => ({
          ...rest,
          wedding_id: newWeddingId,
          guest_id: rest.guest_id ? guestIdMapping[rest.guest_id] : null,
        }));

      if (chatToInsert.length) {
        await (supabase as any).from('whatsapp_chat_history').insert(chatToInsert);
      }
    }

    // Clone RSVPs (remap guest_id, use 'general' event_id)
    const { data: templateRsvps } = await (supabase as any)
      .from('rsvps')
      .select('*')
      .eq('wedding_id', TEMPLATE_SLUG);

    if (templateRsvps?.length) {
      const rsvpsToInsert = templateRsvps
        .filter((rsvp: any) => guestIdMapping[rsvp.guest_id])
        .map(({ id, wedding_id, created_at, ...rest }: any) => ({
          ...rest,
          wedding_id: newSlug,
          guest_id: guestIdMapping[rest.guest_id],
          event_id: 'general',
        }));

      if (rsvpsToInsert.length) {
        await (supabase as any).from('rsvps').insert(rsvpsToInsert);
      }
    }
  }

  // Clone simple child tables in parallel (no ID remapping needed)
  const simpleClones = [
    cloneSimpleTable(supabase, 'wedding_faqs', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_travel_cards', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'travel_sections' as any, template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_registry', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_shops', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_settings', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'concierge_knowledge_base', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'transportation_settings', template.id, newWeddingId),
    // transportation_vehicle_types is cloned in cloneTransportationData() with ID remapping
    cloneSimpleTable(supabase, 'wedding_tasks', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'guest_flights', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'travel_bus_signups', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'vendors', template.id, newWeddingId),
  ];

  // Clone transportation data with ID remapping
  await cloneTransportationData(supabase, template.id, newWeddingId, guestIdMapping);

  // Create wedding_admins entry (demo user as owner)
  const adminInsert = supabase.from('wedding_admins').insert({
    wedding_id: newWeddingId,
    user_id: userId,
    role: 'owner',
  } as any).then(() => {});
  simpleClones.push(adminInsert as Promise<void>);

  await Promise.all(simpleClones);

  // Seed Control Tower mock data (outreach funnel, topics, events, escalations)
  // so every demo shows a populated dashboard from the first load.
  try {
    await seedDemoMockData(supabase, {
      slug: newSlug,
      weddingUuid: newWeddingId,
      guestIds: Object.values(guestIdMapping),
    });
  } catch (err) {
    // Non-fatal: if the mock seed fails, the demo still works — log and move on.
    console.error('[cloneDemoWedding] seedDemoMockData failed:', err);
  }

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
  const weddingSlugs = expired.map(w => w.slug);

  // Tables that use slug as wedding_id (TEXT columns)
  const slugTables = ['guests', 'rsvps'];

  // Tables that use UUID as wedding_id
  const uuidChildTables = [
    'schedule_items',
    'wedding_schedule',
    'wedding_events',
    'wedding_faqs',
    'wedding_travel_cards',
    'travel_sections',
    'wedding_registry',
    'wedding_shops',
    'wedding_settings',
    'wedding_admins',
    'whatsapp_chat_history',
    'concierge_knowledge_base',
    'transportation_settings',
    'transportation_vehicles',
    'transportation_pickup_locations',
    'transportation_time_ranges',
    'transportation_vehicle_types',
    'transportation_reservations',
    'transportation_groups',
    'guest_flights',
    'travel_bus_signups',
    'vendors',
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

  // Delete slug-based tables (guests, rsvps)
  for (const table of slugTables) {
    await supabase
      .from(table as any)
      .delete()
      .in('wedding_id', weddingSlugs);
  }

  // Delete UUID-based child tables
  for (const table of uuidChildTables.filter(t => t !== 'schedule_items')) {
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

async function cloneTransportationData(
  supabase: ReturnType<typeof getServiceClient>,
  templateId: string,
  newId: string,
  guestIdMapping: Record<string, string>
) {
  // 1. Clone vehicles
  const vMap: Record<string, string> = {};
  const { data: vhs } = await supabase.from('transportation_vehicles').select('*').eq('wedding_id', templateId);
  if (vhs?.length) {
    const { data: newVhs } = await supabase.from('transportation_vehicles')
      .insert(vhs.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
      .select('id, vehicle_name');
    if (newVhs) {
      for (const oldV of vhs) {
        const matching = newVhs.find((v: any) => v.vehicle_name === oldV.vehicle_name);
        if (matching) vMap[oldV.id] = matching.id;
      }
    }
  }

  // 1.5. Clone vehicle types
  const vtMap: Record<string, string> = {};
  const { data: vts } = await supabase.from('transportation_vehicle_types').select('*').eq('wedding_id', templateId);
  if (vts?.length) {
    const { data: newVts } = await supabase.from('transportation_vehicle_types')
      .insert(vts.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
      .select('id, name');
    if (newVts) {
      for (const old of vts) {
        const matching = newVts.find((v: any) => v.name === old.name);
        if (matching) vtMap[old.id] = matching.id;
      }
    }
  }

  // 2. Clone pickup locations
  const pMap: Record<string, string> = {};
  const { data: pls } = await supabase.from('transportation_pickup_locations').select('*').eq('wedding_id', templateId);
  if (pls?.length) {
    const { data: newPls } = await supabase.from('transportation_pickup_locations')
      .insert(pls.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
      .select('id, name');
    if (newPls) {
      for (const oldP of pls) {
        const matching = newPls.find((p: any) => p.name === oldP.name);
        if (matching) pMap[oldP.id] = matching.id;
      }
    }
  }

  // 3. Clone time ranges
  const trMap: Record<string, string> = {};
  const { data: trs } = await supabase.from('transportation_time_ranges').select('*').eq('wedding_id', templateId);
  if (trs?.length) {
    const { data: newTrs } = await supabase.from('transportation_time_ranges')
      .insert(trs.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
      .select('id, start_datetime');
    if (newTrs) {
      for (const old of trs) {
        const matching = newTrs.find((p: any) => p.start_datetime === old.start_datetime);
        if (matching) trMap[old.id] = matching.id;
      }
    }
  }

  // 4. Clone groups
  const { data: grps } = await supabase.from('transportation_groups').select('*').eq('wedding_id', templateId);
  if (grps?.length) {
    await supabase.from('transportation_groups').insert(grps.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => {
      return { 
        ...rest, 
        wedding_id: newId,
        pickup_location_id: pMap[rest.pickup_location_id] || rest.pickup_location_id,
        vehicle_type_id: rest.vehicle_type_id ? vtMap[rest.vehicle_type_id] || rest.vehicle_type_id : null
      };
    }));
  }

  // 5. Clone reservations
  const { data: resvs } = await supabase.from('transportation_reservations').select('*').eq('wedding_id', templateId);
  if (resvs?.length) {
    const toInsert = resvs.filter((r: any) => !r.guest_id || guestIdMapping[r.guest_id]).map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => {
      return {
        ...rest,
        wedding_id: newId,
        vehicle_id: rest.vehicle_id ? vMap[rest.vehicle_id] : null,
        pickup_location_id: rest.pickup_location_id ? pMap[rest.pickup_location_id] : null,
        guest_id: rest.guest_id ? guestIdMapping[rest.guest_id] : null,
      };
    });
    if (toInsert.length) {
      await supabase.from('transportation_reservations').insert(toInsert);
    }
  }
}

