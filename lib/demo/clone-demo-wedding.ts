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
  const t0 = Date.now();
  const lap = (label: string, start: number) => {
    const ms = Date.now() - start;
    console.log(`[demo-clone] ${label}: ${ms}ms`);
    return Date.now();
  };
  let t = t0;

  // 1. Fetch template wedding
  const { data: template, error: templateError } = await supabase
    .from('weddings')
    .select('*')
    .eq('slug', TEMPLATE_SLUG)
    .single();
  t = lap('fetch template wedding', t);

  if (templateError || !template) {
    throw new Error(`Template wedding "${TEMPLATE_SLUG}" not found`);
  }

  // 2. Generate unique slug
  const newSlug = generateDemoSlug();

  // 3. Insert cloned wedding row
  const { id: _id, created_at: _ca, updated_at: _ua, slug: _slug, created_by: _cb, ...weddingData } = template;

  // Guarantee couple_name + partner names are populated. The template
  // occasionally has them blank; derive defaults so the preview hero
  // renders real content instead of an empty frame with no names.
  const wd = weddingData as any;
  const partner1Name = (wd.partner1_name || '').trim() || 'Priya Sharma';
  const partner2Name = (wd.partner2_name || '').trim() || 'Arjun Mehta';
  const p1 = partner1Name.split(' ')[0];
  const p2 = partner2Name.split(' ')[0];
  const derivedCoupleName = p1 && p2 ? `${p1} & ${p2}` : p1 || p2;
  const finalCoupleName = wd.couple_name?.trim() || derivedCoupleName;

  const { data: newWedding, error: insertError } = await supabase
    .from('weddings')
    .insert({
      ...weddingData,
      partner1_name: partner1Name,
      partner2_name: partner2Name,
      couple_name: finalCoupleName,
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
  t = lap('insert new wedding row', t);

  // 4. Read everything from the template in parallel.
  // All of these SELECTs are independent — no reason to do them serially.
  const [
    { data: templateEvents },
    { data: templateSchedule },
    { data: templateGuests },
    { data: templateChat },
    { data: templateRsvps },
    { data: templateOutreachEvents },
    { data: templateIssues },
  ] = await Promise.all([
    supabase.from('wedding_events').select('*').eq('wedding_id', template.id).order('order_index', { ascending: true }),
    supabase.from('wedding_schedule').select('*').eq('wedding_id', template.id).order('order_index', { ascending: true }),
    (supabase as any).from('guests').select('*').eq('wedding_id', TEMPLATE_SLUG),
    (supabase as any).from('whatsapp_chat_history').select('*').eq('wedding_id', template.id).order('created_at', { ascending: true }),
    (supabase as any).from('rsvps').select('*').eq('wedding_id', TEMPLATE_SLUG),
    (supabase as any).from('outreach_events').select('*').eq('wedding_id', TEMPLATE_SLUG),
    (supabase as any).from('coordination_issues').select('*').eq('wedding_id', TEMPLATE_SLUG),
  ]);
  t = lap(`parallel reads (events=${templateEvents?.length ?? 0}, schedule=${templateSchedule?.length ?? 0}, guests=${templateGuests?.length ?? 0}, chat=${templateChat?.length ?? 0}, rsvps=${templateRsvps?.length ?? 0}, outreach=${templateOutreachEvents?.length ?? 0}, issues=${templateIssues?.length ?? 0})`, t);

  // Kick off simple clones immediately — they don't depend on anything else.
  const simpleClones: Promise<void>[] = [
    cloneSimpleTable(supabase, 'wedding_faqs', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_travel_cards', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'travel_sections' as any, template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_registry', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_shops', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_settings', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'concierge_knowledge_base', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'transportation_settings', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'wedding_tasks', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'guest_flights', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'travel_bus_signups', template.id, newWeddingId),
    cloneSimpleTable(supabase, 'vendors', template.id, newWeddingId),
  ];

  // 5. Primary inserts in parallel: events, schedule days, guests, plus
  // a dependent fetch for schedule_items (needs schedule IDs we already have).
  const eventsInsertPromise = templateEvents?.length
    ? supabase
        .from('wedding_events')
        .insert(
          templateEvents.map(({ id, wedding_id, created_at, ...rest }) => ({
            ...rest,
            wedding_id: newWeddingId,
          })) as any
        )
        .select('id, order_index')
    : Promise.resolve({ data: null as any });

  const scheduleInsertPromise = templateSchedule?.length
    ? supabase
        .from('wedding_schedule')
        .insert(
          templateSchedule.map(({ id, wedding_id, created_at, ...rest }) => ({
            ...rest,
            wedding_id: newWeddingId,
          })) as any
        )
        .select('id, order_index')
    : Promise.resolve({ data: null as any });

  const guestsInsertPromise = templateGuests?.length
    ? (supabase as any)
        .from('guests')
        .insert(
          templateGuests.map(({ id, wedding_id, created_at, initials, ...rest }: any) => {
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
          })
        )
        .select('id, name')
    : Promise.resolve({ data: null as any });

  // Fetch schedule_items in parallel with the inserts — we only need the
  // template's schedule IDs, which we already have from the read round.
  const scheduleItemsFetchPromise = templateSchedule?.length
    ? supabase
        .from('schedule_items')
        .select('*')
        .in('schedule_id', templateSchedule.map(s => s.id))
        .order('order_index', { ascending: true })
    : Promise.resolve({ data: null as any });

  const [
    { data: newEvents },
    { data: newSchedules },
    { data: newGuests },
    { data: templateItems },
  ] = await Promise.all([
    eventsInsertPromise,
    scheduleInsertPromise,
    guestsInsertPromise,
    scheduleItemsFetchPromise,
  ]);
  t = lap('primary inserts (events + schedule + guests) + schedule_items fetch', t);

  // 6. Build ID maps from the results.
  const eventIdMapping: Record<string, string> = {};
  if (templateEvents && newEvents) {
    for (let i = 0; i < templateEvents.length; i++) {
      const match = newEvents.find((e: any) => e.order_index === templateEvents[i].order_index);
      if (match) eventIdMapping[templateEvents[i].id] = match.id;
    }
  }

  const scheduleIdMapping: Record<string, string> = {};
  if (templateSchedule && newSchedules) {
    for (let i = 0; i < templateSchedule.length; i++) {
      const match = newSchedules.find((s: any) => s.order_index === templateSchedule[i].order_index);
      if (match) scheduleIdMapping[templateSchedule[i].id] = match.id;
    }
  }

  const guestIdMapping: Record<string, string> = {};
  if (templateGuests && newGuests) {
    const templateByName = new Map(templateGuests.map((g: any) => [g.name, g.id]));
    for (const ng of newGuests) {
      const oldId = templateByName.get(ng.name);
      if (oldId) guestIdMapping[oldId as string] = ng.id;
    }
  }

  // 7. Dependent inserts in parallel: schedule_items, chat_history, rsvps.
  const dependentInserts: Promise<any>[] = [];

  if (templateItems?.length) {
    const itemsToInsert = templateItems
      .filter((item: any) => scheduleIdMapping[item.schedule_id!])
      .map((item: any) => {
        const { id, schedule_id, created_at, ...rest } = item;
        const eventId = item.linked_event_id;
        return {
          ...rest,
          schedule_id: scheduleIdMapping[schedule_id!],
          linked_event_id: eventId ? (eventIdMapping[eventId] || null) : null,
        };
      });
    if (itemsToInsert.length) {
      dependentInserts.push(supabase.from('schedule_items').insert(itemsToInsert as any));
    }
  }

  if (Object.keys(guestIdMapping).length > 0) {
    if (templateChat?.length) {
      const chatToInsert = templateChat
        .filter((msg: any) => !msg.guest_id || guestIdMapping[msg.guest_id])
        .map(({ id, wedding_id, created_at, ...rest }: any) => ({
          ...rest,
          wedding_id: newWeddingId,
          guest_id: rest.guest_id ? guestIdMapping[rest.guest_id] : null,
        }));
      if (chatToInsert.length) {
        dependentInserts.push((supabase as any).from('whatsapp_chat_history').insert(chatToInsert));
      }
    }

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
        dependentInserts.push((supabase as any).from('rsvps').insert(rsvpsToInsert));
      }
    }

    // Clone outreach_events (Control Tower activity feed) with guest_id
    // remapping. These used to be generated fresh in seedDemoMockData on
    // every clone — pre-seeded in the template now, so a simple clone is
    // much faster.
    if (templateOutreachEvents?.length) {
      const eventsToInsert = templateOutreachEvents
        .filter((ev: any) => !ev.guest_id || guestIdMapping[ev.guest_id])
        .map(({ id, wedding_id, ...rest }: any) => ({
          ...rest,
          wedding_id: newSlug,
          guest_id: rest.guest_id ? guestIdMapping[rest.guest_id] : null,
        }));
      if (eventsToInsert.length) {
        dependentInserts.push((supabase as any).from('outreach_events').insert(eventsToInsert));
      }
    }

    // Clone coordination_issues (escalations queue) with guest_id remapping.
    if (templateIssues?.length) {
      const issuesToInsert = templateIssues
        .filter((iss: any) => !iss.guest_id || guestIdMapping[iss.guest_id])
        .map(({ id, wedding_id, created_at, resolved_at, resolved_by, ...rest }: any) => ({
          ...rest,
          wedding_id: newSlug,
          guest_id: rest.guest_id ? guestIdMapping[rest.guest_id] : null,
        }));
      if (issuesToInsert.length) {
        dependentInserts.push((supabase as any).from('coordination_issues').insert(issuesToInsert));
      }
    }
  }

  // Kick off wedding_admins insert alongside the other background work.
  const adminInsert = supabase.from('wedding_admins').insert({
    wedding_id: newWeddingId,
    user_id: userId,
    role: 'owner',
  } as any).then(() => {});
  simpleClones.push(adminInsert as Promise<void>);

  // Kick off transportation now that guestIdMapping is ready. Runs in
  // parallel with the other background work.
  const transportationPromise = cloneTransportationData(supabase, template.id, newWeddingId, guestIdMapping);

  // Single wait for all remaining background work: the dependent inserts,
  // the simple clones (already running since step 4), transportation, and
  // the admin insert. Wall time is max of these, not their sum.
  await Promise.all([
    Promise.all(dependentInserts),
    Promise.all(simpleClones),
    transportationPromise,
  ]);
  t = lap(`finalize (dep=${dependentInserts.length}, simple=${simpleClones.length}, transport)`, t);

  // Fallback: if the template hasn't been pre-seeded yet (nothing came back
  // from the outreach_events read), run seedDemoMockData inline so the
  // Control Tower isn't empty. Once you run the one-shot
  // /api/admin/seed-demo-template endpoint, the template carries these rows
  // and this branch is skipped on future clones.
  const templateAlreadySeeded = (templateOutreachEvents?.length ?? 0) > 0;
  if (!templateAlreadySeeded) {
    console.log('[demo-clone] template not pre-seeded — running seedDemoMockData inline (slower path)');
    try {
      await seedDemoMockData(supabase, {
        slug: newSlug,
        weddingUuid: newWeddingId,
        guestIds: Object.values(guestIdMapping),
      });
    } catch (err) {
      console.error('[cloneDemoWedding] seedDemoMockData failed:', err);
    }
    t = lap('seedDemoMockData (fallback)', t);
  }

  console.log(`[demo-clone] TOTAL: ${Date.now() - t0}ms`);

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
  const slugTables = ['guests', 'rsvps', 'outreach_events', 'coordination_issues'];

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
  // Parallel reads: the 4 independent tables (vehicles, vehicle_types,
  // pickup_locations, time_ranges) plus groups and reservations. Fetching
  // all together saves several serial round-trips.
  const [
    { data: vhs },
    { data: vts },
    { data: pls },
    { data: trs },
    { data: grps },
    { data: resvs },
  ] = await Promise.all([
    supabase.from('transportation_vehicles').select('*').eq('wedding_id', templateId),
    supabase.from('transportation_vehicle_types').select('*').eq('wedding_id', templateId),
    supabase.from('transportation_pickup_locations').select('*').eq('wedding_id', templateId),
    supabase.from('transportation_time_ranges').select('*').eq('wedding_id', templateId),
    supabase.from('transportation_groups').select('*').eq('wedding_id', templateId),
    supabase.from('transportation_reservations').select('*').eq('wedding_id', templateId),
  ]);

  // Parallel primary inserts: vehicles, vehicle types, pickup locations,
  // time ranges. None of these depend on each other, so run concurrently.
  const vMap: Record<string, string> = {};
  const vtMap: Record<string, string> = {};
  const pMap: Record<string, string> = {};

  const vehiclesInsert = vhs?.length
    ? supabase.from('transportation_vehicles')
        .insert(vhs.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
        .select('id, vehicle_name')
    : Promise.resolve({ data: null as any });

  const vehicleTypesInsert = vts?.length
    ? supabase.from('transportation_vehicle_types')
        .insert(vts.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
        .select('id, name')
    : Promise.resolve({ data: null as any });

  const pickupLocationsInsert = pls?.length
    ? supabase.from('transportation_pickup_locations')
        .insert(pls.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
        .select('id, name')
    : Promise.resolve({ data: null as any });

  const timeRangesInsert = trs?.length
    ? supabase.from('transportation_time_ranges')
        .insert(trs.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({ ...rest, wedding_id: newId })))
        .select('id, start_datetime')
    : Promise.resolve({ data: null as any });

  const [
    { data: newVhs },
    { data: newVts },
    { data: newPls },
    // time ranges map is never used downstream, so we don't need the result
    ,
  ] = await Promise.all([vehiclesInsert, vehicleTypesInsert, pickupLocationsInsert, timeRangesInsert]);

  if (vhs && newVhs) {
    for (const oldV of vhs) {
      const matching = newVhs.find((v: any) => v.vehicle_name === oldV.vehicle_name);
      if (matching) vMap[oldV.id] = matching.id;
    }
  }
  if (vts && newVts) {
    for (const old of vts) {
      const matching = newVts.find((v: any) => v.name === old.name);
      if (matching) vtMap[old.id] = matching.id;
    }
  }
  if (pls && newPls) {
    for (const oldP of pls) {
      const matching = newPls.find((p: any) => p.name === oldP.name);
      if (matching) pMap[oldP.id] = matching.id;
    }
  }

  // Dependent inserts in parallel: groups + reservations.
  const dependent: Promise<any>[] = [];

  if (grps?.length) {
    dependent.push(
      supabase.from('transportation_groups').insert(
        grps.map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({
          ...rest,
          wedding_id: newId,
          pickup_location_id: pMap[rest.pickup_location_id] || rest.pickup_location_id,
          vehicle_type_id: rest.vehicle_type_id ? vtMap[rest.vehicle_type_id] || rest.vehicle_type_id : null,
        }))
      )
    );
  }

  if (resvs?.length) {
    const toInsert = resvs
      .filter((r: any) => !r.guest_id || guestIdMapping[r.guest_id])
      .map(({ id, created_at, updated_at, wedding_id, ...rest }: any) => ({
        ...rest,
        wedding_id: newId,
        vehicle_id: rest.vehicle_id ? vMap[rest.vehicle_id] : null,
        pickup_location_id: rest.pickup_location_id ? pMap[rest.pickup_location_id] : null,
        guest_id: rest.guest_id ? guestIdMapping[rest.guest_id] : null,
      }));
    if (toInsert.length) {
      dependent.push(supabase.from('transportation_reservations').insert(toInsert));
    }
  }

  await Promise.all(dependent);
}

