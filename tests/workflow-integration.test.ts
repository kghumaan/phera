// @vitest-environment node
/**
 * Workflow Integration Tests
 *
 * Multi-step workflow tests that exercise the same DB operations as the app.
 * Runs against a SEPARATE Supabase test project (schema-identical to production).
 *
 * Requirements:
 * - .env.test file with TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_SERVICE_ROLE_KEY
 * - Test project has both RLS migrations applied
 *
 * Skips automatically when test credentials are unavailable.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const TEST_URL = process.env.TEST_SUPABASE_URL;
const TEST_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY;
const TEST_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

const canRun = !!(TEST_URL && TEST_ANON_KEY && TEST_SERVICE_KEY);

const WEDDING_REQUIRED_FIELDS = {
  wedding_date: '2026-12-01T00:00:00Z',
  wedding_date_display: 'December 1, 2026',
  venue_name: 'Test Venue',
  venue_location: 'Test City',
  rsvp_deadline: '2026-11-01',
};

describe.skipIf(!canRun)('Workflow Integration Tests', { timeout: 120_000 }, () => {
  let serviceClient: SupabaseClient;
  let anonClient: SupabaseClient;

  // Users
  let ownerId: string;
  let adminId: string;
  let intruderId: string;
  let plannerId: string;

  // Clients
  let ownerClient: SupabaseClient;
  let adminClient: SupabaseClient;
  let intruderClient: SupabaseClient;
  let plannerClient: SupabaseClient;

  // Shared test data
  let weddingId: string;
  let weddingSlug: string;

  const userIds: string[] = [];
  const weddingIds: string[] = [];

  const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

  async function ensureUser(email: string, password: string): Promise<string> {
    const { data, error } = await serviceClient.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (!error && data?.user?.id) {
      userIds.push(data.user.id);
      return data.user.id;
    }
    if (error && error.message.includes('already been registered')) {
      const { data: users } = await serviceClient.auth.admin.listUsers();
      const existing = users?.users?.find((u: any) => u.email === email);
      if (existing?.id) return existing.id;
    }
    throw new Error(`Failed to create/find user ${email}: ${error?.message}`);
  }

  async function signIn(email: string, password: string): Promise<SupabaseClient> {
    const client = createClient(TEST_URL!, TEST_ANON_KEY!, noSession);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
    return client;
  }

  beforeAll(async () => {
    serviceClient = createClient(TEST_URL!, TEST_SERVICE_KEY!, noSession);
    anonClient = createClient(TEST_URL!, TEST_ANON_KEY!, noSession);

    const ts = Date.now();
    ownerId = await ensureUser(`wf-owner-${ts}@phera-test.local`, 'WfOwner123!');
    adminId = await ensureUser(`wf-admin-${ts}@phera-test.local`, 'WfAdmin123!');
    intruderId = await ensureUser(`wf-intruder-${ts}@phera-test.local`, 'WfIntruder123!');
    plannerId = await ensureUser(`wf-planner-${ts}@phera-test.local`, 'WfPlanner123!');

    ownerClient = await signIn(`wf-owner-${ts}@phera-test.local`, 'WfOwner123!');
    adminClient = await signIn(`wf-admin-${ts}@phera-test.local`, 'WfAdmin123!');
    intruderClient = await signIn(`wf-intruder-${ts}@phera-test.local`, 'WfIntruder123!');
    plannerClient = await signIn(`wf-planner-${ts}@phera-test.local`, 'WfPlanner123!');

    // Create main test wedding
    weddingSlug = `wf-test-${ts}`;
    const { data: wedding, error: wErr } = await serviceClient
      .from('weddings')
      .insert({
        slug: weddingSlug,
        couple_name: 'Workflow Couple',
        created_by: ownerId,
        status: 'live',
        ...WEDDING_REQUIRED_FIELDS,
      })
      .select()
      .single();

    if (wErr) throw new Error(`Failed to create wedding: ${wErr.message}`);
    weddingId = wedding.id;
    weddingIds.push(weddingId);

    // Create settings with PIN codes
    await serviceClient.from('wedding_settings').insert({
      wedding_id: weddingId,
      pin_codes: [
        { pin: '1234', type: 'general', allows_plus_one: true },
        { pin: '5678', type: 'vip', allows_plus_one: false, hidden_events: ['secret-event'] },
        { pin: '9999', type: 'skip', skip_rsvp: true },
      ],
    });

    // Add admin user
    await serviceClient.from('wedding_admins').insert({
      wedding_id: weddingId,
      user_id: adminId,
      role: 'admin',
    });
  }, 60000);

  afterAll(async () => {
    if (!canRun) return;

    for (const wId of weddingIds) {
      const { data: wData } = await serviceClient.from('weddings').select('slug').eq('id', wId).single();
      const slug = wData?.slug || '';

      // Clean up all related data
      await serviceClient.from('whatsapp_opt_ins').delete().eq('wedding_id', wId);
      await serviceClient.from('schedule_items').delete().match({});
      await serviceClient.from('wedding_schedule').delete().eq('wedding_id', wId);
      await serviceClient.from('wedding_events').delete().eq('wedding_id', wId);
      await serviceClient.from('wedding_faqs').delete().eq('wedding_id', wId);
      await serviceClient.from('wedding_registry').delete().eq('wedding_id', wId);
      await serviceClient.from('wedding_shops').delete().eq('wedding_id', wId);
      await serviceClient.from('wedding_travel_cards').delete().eq('wedding_id', wId);
      await serviceClient.from('wedding_tasks').delete().eq('wedding_id', wId);
      await serviceClient.from('wedding_invites').delete().eq('wedding_id', wId);
      await serviceClient.from('comments').delete().eq('wedding_id', slug);
      await serviceClient.from('rsvps').delete().eq('wedding_id', slug);
      await serviceClient.from('guests').delete().eq('wedding_id', slug);
      await serviceClient.from('vendor_insights').delete().eq('wedding_id', wId);
      await serviceClient.from('vendor_messages').delete().eq('wedding_id', wId);
      await serviceClient.from('conversation_members').delete().eq('wedding_id', wId);
      await serviceClient.from('vendor_conversations').delete().eq('wedding_id', wId);
      await serviceClient.from('vendors').delete().eq('wedding_id', wId);
      await serviceClient.from('wedding_admins').delete().eq('wedding_id', wId);
      await serviceClient.from('wedding_settings').delete().eq('wedding_id', wId);
      await serviceClient.from('weddings').delete().eq('id', wId);
    }

    for (const uid of userIds) {
      await serviceClient.from('user_settings').delete().eq('user_id', uid);
      await serviceClient.from('planner_profiles').delete().eq('user_id', uid);
      await serviceClient.auth.admin.deleteUser(uid);
    }
  }, 60000);

  // =========================================================================
  // Workflow 1: PIN Entry → Wedding Access
  // =========================================================================
  describe('Workflow 1: PIN Entry → Wedding Access', () => {
    it('correct PIN data is retrievable from wedding_settings', async () => {
      const { data, error } = await anonClient
        .from('wedding_settings')
        .select('pin_codes')
        .eq('wedding_id', weddingId)
        .single();

      expect(error).toBeNull();
      expect(data!.pin_codes).toBeInstanceOf(Array);

      const generalPin = data!.pin_codes.find((p: any) => p.pin === '1234');
      expect(generalPin).toBeTruthy();
      expect(generalPin.type).toBe('general');
      expect(generalPin.allows_plus_one).toBe(true);
    });

    it('VIP PIN includes hidden_events metadata', async () => {
      const { data } = await anonClient
        .from('wedding_settings')
        .select('pin_codes')
        .eq('wedding_id', weddingId)
        .single();

      const vipPin = data!.pin_codes.find((p: any) => p.pin === '5678');
      expect(vipPin).toBeTruthy();
      expect(vipPin.hidden_events).toEqual(['secret-event']);
    });

    it('skip_rsvp PIN returns that flag', async () => {
      const { data } = await anonClient
        .from('wedding_settings')
        .select('pin_codes')
        .eq('wedding_id', weddingId)
        .single();

      const skipPin = data!.pin_codes.find((p: any) => p.pin === '9999');
      expect(skipPin).toBeTruthy();
      expect(skipPin.skip_rsvp).toBe(true);
    });

    it('PIN settings for draft wedding are still accessible', async () => {
      // Temporarily set to draft
      await serviceClient.from('weddings').update({ status: 'draft' }).eq('id', weddingId);

      // wedding_settings has SELECT USING(true) — always accessible
      const { data, error } = await anonClient
        .from('wedding_settings')
        .select('pin_codes')
        .eq('wedding_id', weddingId)
        .single();

      expect(error).toBeNull();
      expect(data!.pin_codes.length).toBe(3);

      // Restore
      await serviceClient.from('weddings').update({ status: 'live' }).eq('id', weddingId);
    });

    it('non-existent wedding returns no settings', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const { data, error } = await anonClient
        .from('wedding_settings')
        .select('pin_codes')
        .eq('wedding_id', fakeId)
        .single();

      // PGRST116 = no rows found
      expect(error).toBeTruthy();
      expect(error!.code).toBe('PGRST116');
    });
  });

  // =========================================================================
  // Workflow 2: RSVP Submission Flow
  // =========================================================================
  describe('Workflow 2: RSVP Submission Flow', () => {
    let guestId: string;

    it('anon CAN insert guest record', async () => {
      const { data, error } = await anonClient
        .from('guests')
        .insert({
          wedding_id: weddingSlug,
          name: 'RSVP Guest',
          email: 'rsvp-guest@test.com',
          avatar_color: '#f0a',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.name).toBe('RSVP Guest');
      guestId = data!.id;
    });

    it('anon CAN upsert RSVP (attending=yes)', async () => {
      const { error } = await anonClient
        .from('rsvps')
        .upsert({
          wedding_id: weddingSlug,
          guest_id: guestId,
          event_id: 'ceremony',
          attending: 'yes',
        }, { onConflict: 'guest_id,event_id,wedding_id' });

      expect(error).toBeNull();
    });

    it('anon CAN update existing RSVP (change to no)', async () => {
      const { error } = await anonClient
        .from('rsvps')
        .update({ attending: 'no' })
        .eq('guest_id', guestId)
        .eq('event_id', 'ceremony')
        .eq('wedding_id', weddingSlug);

      expect(error).toBeNull();

      const { data } = await serviceClient
        .from('rsvps')
        .select('attending')
        .eq('guest_id', guestId)
        .eq('event_id', 'ceremony')
        .single();

      expect(data!.attending).toBe('no');
    });

    it('anon CAN insert comment with message', async () => {
      const { data, error } = await anonClient
        .from('comments')
        .insert({
          wedding_id: weddingSlug,
          guest_id: guestId,
          message: 'So happy for you two!',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.message).toBe('So happy for you two!');
    });

    it('anon CAN insert comment with GIF', async () => {
      const { data, error } = await anonClient
        .from('comments')
        .insert({
          wedding_id: weddingSlug,
          guest_id: guestId,
          gif_id: 'abc123',
          gif_url: 'https://media.giphy.com/test.gif',
          gif_title: 'Celebration',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.gif_id).toBe('abc123');
    });

    it('plus-one fields persist on RSVP', async () => {
      const { error } = await anonClient
        .from('rsvps')
        .upsert({
          wedding_id: weddingSlug,
          guest_id: guestId,
          event_id: 'reception',
          attending: 'yes',
          plus_one: true,
          plus_one_name: 'Plus One',
          plus_one_email: 'plusone@test.com',
          plus_one_phone: '5551234',
          plus_one_country_code: '+1',
        }, { onConflict: 'guest_id,event_id,wedding_id' });

      expect(error).toBeNull();

      const { data } = await serviceClient
        .from('rsvps')
        .select('*')
        .eq('guest_id', guestId)
        .eq('event_id', 'reception')
        .single();

      expect(data!.plus_one).toBe(true);
      expect(data!.plus_one_name).toBe('Plus One');
    });

    it('RSVP with food_preference persists', async () => {
      const { error } = await anonClient
        .from('rsvps')
        .upsert({
          wedding_id: weddingSlug,
          guest_id: guestId,
          event_id: 'dinner',
          attending: 'yes',
          food_preference: ['vegetarian', 'no-nuts'],
          song_request: 'Dancing Queen',
          special_message: 'Thank you!',
        }, { onConflict: 'guest_id,event_id,wedding_id' });

      expect(error).toBeNull();

      const { data } = await serviceClient
        .from('rsvps')
        .select('food_preference, song_request, special_message')
        .eq('guest_id', guestId)
        .eq('event_id', 'dinner')
        .single();

      expect(data!.food_preference).toEqual(['vegetarian', 'no-nuts']);
      expect(data!.song_request).toBe('Dancing Queen');
    });

    it('multiple RSVPs for different events (same guest) work', async () => {
      const { data } = await serviceClient
        .from('rsvps')
        .select('event_id')
        .eq('guest_id', guestId)
        .eq('wedding_id', weddingSlug);

      // Should have ceremony, reception, dinner from previous tests
      expect(data!.length).toBeGreaterThanOrEqual(3);
      const eventIds = data!.map((r: any) => r.event_id);
      expect(eventIds).toContain('ceremony');
      expect(eventIds).toContain('reception');
      expect(eventIds).toContain('dinner');
    });
  });

  // =========================================================================
  // Workflow 3: Admin Wedding Management
  // =========================================================================
  describe('Workflow 3: Admin Wedding Management', () => {
    it('owner CAN create wedding_events', async () => {
      const { data, error } = await ownerClient
        .from('wedding_events')
        .insert({
          wedding_id: weddingId,
          name: 'Ceremony',
          slug: 'ceremony',
          date: '2026-12-01',
          time: '16:00',
          dress_code: 'Black Tie',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.name).toBe('Ceremony');
    });

    it('owner CAN create wedding_schedule + schedule_items', async () => {
      const { data: sched, error: schedErr } = await ownerClient
        .from('wedding_schedule')
        .insert({ wedding_id: weddingId, day_name: 'Wedding Day', date: '2026-12-01' })
        .select()
        .single();

      expect(schedErr).toBeNull();

      const { error: itemErr } = await ownerClient
        .from('schedule_items')
        .insert({
          schedule_id: sched!.id,
          time: '16:00',
          name: 'Ceremony Begins',
        });

      expect(itemErr).toBeNull();
    });

    it('owner CAN update wedding_settings (add PIN codes)', async () => {
      const { error } = await ownerClient
        .from('wedding_settings')
        .update({
          pin_codes: [
            { pin: '1234', type: 'general', allows_plus_one: true },
            { pin: '5678', type: 'vip' },
            { pin: '9999', type: 'skip', skip_rsvp: true },
            { pin: '0000', type: 'new-pin' },
          ],
        })
        .eq('wedding_id', weddingId);

      expect(error).toBeNull();

      const { data } = await serviceClient
        .from('wedding_settings')
        .select('pin_codes')
        .eq('wedding_id', weddingId)
        .single();
      expect(data!.pin_codes.length).toBe(4);

      // Restore original
      await serviceClient.from('wedding_settings').update({
        pin_codes: [
          { pin: '1234', type: 'general', allows_plus_one: true },
          { pin: '5678', type: 'vip', allows_plus_one: false, hidden_events: ['secret-event'] },
          { pin: '9999', type: 'skip', skip_rsvp: true },
        ],
      }).eq('wedding_id', weddingId);
    });

    it('owner CAN manage wedding_faqs, registry, shops', async () => {
      const { error: faqErr } = await ownerClient
        .from('wedding_faqs')
        .insert({ wedding_id: weddingId, question: 'What to wear?', answer: 'Black tie' });
      expect(faqErr).toBeNull();

      const { error: regErr } = await ownerClient
        .from('wedding_registry')
        .insert({ wedding_id: weddingId, fund_name: 'Honeymoon Fund', emoji: '✈️' });
      expect(regErr).toBeNull();

      const { error: shopErr } = await ownerClient
        .from('wedding_shops')
        .insert({ wedding_id: weddingId, name: 'Gift Shop', details: 'Details', url: 'https://shop.com' });
      expect(shopErr).toBeNull();
    });

    it('admin (not creator) CAN do the same operations', async () => {
      const { data: evt, error: evtErr } = await adminClient
        .from('wedding_events')
        .insert({
          wedding_id: weddingId,
          name: 'Admin Event',
          slug: 'admin-event',
          date: '2026-12-02',
          time: '10:00',
          dress_code: 'Casual',
        })
        .select()
        .single();

      expect(evtErr).toBeNull();

      const { error: faqErr } = await adminClient
        .from('wedding_faqs')
        .insert({ wedding_id: weddingId, question: 'Admin Q?', answer: 'Admin A' });
      expect(faqErr).toBeNull();

      // Admin can also delete
      const { error: delErr } = await adminClient
        .from('wedding_events')
        .delete()
        .eq('id', evt!.id);
      expect(delErr).toBeNull();
    });

    it('owner CAN add another user as admin', async () => {
      const { data: newUser } = await serviceClient.auth.admin.createUser({
        email: `wf-newadmin-${Date.now()}@phera-test.local`,
        password: 'NewAdmin123!',
        email_confirm: true,
      });
      const newId = newUser!.user!.id;
      userIds.push(newId);

      const { error } = await ownerClient
        .from('wedding_admins')
        .insert({ wedding_id: weddingId, user_id: newId, role: 'admin' });

      expect(error).toBeNull();
    });

    it('admin CAN view guest list', async () => {
      const { data, error } = await adminClient
        .from('guests')
        .select('*')
        .eq('wedding_id', weddingSlug);

      expect(error).toBeNull();
      // Should see guests from Workflow 2
      expect(data!.length).toBeGreaterThan(0);
    });

    it('intruder CANNOT do any of the above', async () => {
      const { error: evtErr } = await intruderClient
        .from('wedding_events')
        .insert({
          wedding_id: weddingId,
          name: 'Intruder Event',
          slug: 'intruder-evt',
          date: '2026-12-03',
          time: '12:00',
          dress_code: 'None',
        });
      expect(evtErr).toBeTruthy();

      const { error: taskErr } = await intruderClient
        .from('wedding_tasks')
        .insert({ wedding_id: weddingId, title: 'Intruder Task' });
      expect(taskErr).toBeTruthy();

      const { data: guestData } = await intruderClient
        .from('wedding_admins')
        .select('*')
        .eq('wedding_id', weddingId);
      expect(guestData).toEqual([]);
    });
  });

  // =========================================================================
  // Workflow 4: Planner Multi-Wedding
  // =========================================================================
  describe('Workflow 4: Planner Multi-Wedding', () => {
    let plannerWedding1Id: string;
    let plannerWedding2Id: string;

    it('planner CAN create multiple weddings', async () => {
      const ts = Date.now();

      const { data: w1, error: e1 } = await plannerClient
        .from('weddings')
        .insert({
          slug: `planner-w1-${ts}`,
          couple_name: 'Planner Couple 1',
          created_by: plannerId,
          ...WEDDING_REQUIRED_FIELDS,
        })
        .select()
        .single();

      expect(e1).toBeNull();
      plannerWedding1Id = w1!.id;
      weddingIds.push(plannerWedding1Id);

      const { data: w2, error: e2 } = await plannerClient
        .from('weddings')
        .insert({
          slug: `planner-w2-${ts}`,
          couple_name: 'Planner Couple 2',
          created_by: plannerId,
          ...WEDDING_REQUIRED_FIELDS,
        })
        .select()
        .single();

      expect(e2).toBeNull();
      plannerWedding2Id = w2!.id;
      weddingIds.push(plannerWedding2Id);
    });

    it('planner CAN access weddings they created', async () => {
      const { data, error } = await plannerClient
        .from('weddings')
        .select('id')
        .in('id', [plannerWedding1Id, plannerWedding2Id]);

      expect(error).toBeNull();
      expect(data!.length).toBe(2);
    });

    it('planner CAN be added as admin to another user\'s wedding', async () => {
      await serviceClient.from('wedding_admins').insert({
        wedding_id: weddingId,
        user_id: plannerId,
        role: 'admin',
      });

      const { data, error } = await plannerClient
        .from('weddings')
        .select('id')
        .eq('id', weddingId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('planner CANNOT access weddings they\'re not owner/admin of', async () => {
      // Create a wedding owned by intruder
      const { data: otherW } = await serviceClient
        .from('weddings')
        .insert({
          slug: `planner-noaccess-${Date.now()}`,
          couple_name: 'Not Planner',
          created_by: intruderId,
          ...WEDDING_REQUIRED_FIELDS,
        })
        .select()
        .single();
      weddingIds.push(otherW!.id);

      // Planner should not be able to update it
      await plannerClient
        .from('weddings')
        .update({ couple_name: 'Hacked by Planner' })
        .eq('id', otherW!.id);

      const { data } = await serviceClient
        .from('weddings')
        .select('couple_name')
        .eq('id', otherW!.id)
        .single();
      expect(data!.couple_name).toBe('Not Planner');
    });
  });

  // =========================================================================
  // Workflow 5: Wedding Lifecycle — Draft → Live → Public Access
  // =========================================================================
  describe('Workflow 5: Wedding Lifecycle', () => {
    let lifecycleWeddingId: string;

    beforeAll(async () => {
      const ts = Date.now();
      const { data } = await serviceClient
        .from('weddings')
        .insert({
          slug: `lifecycle-${ts}`,
          couple_name: 'Lifecycle Couple',
          created_by: ownerId,
          status: 'draft',
          ...WEDDING_REQUIRED_FIELDS,
        })
        .select()
        .single();
      lifecycleWeddingId = data!.id;
      weddingIds.push(lifecycleWeddingId);

      // Add content
      await serviceClient.from('wedding_events').insert({
        wedding_id: lifecycleWeddingId,
        name: 'Lifecycle Event',
        slug: 'lifecycle-evt',
        date: '2026-12-01',
        time: '18:00',
        dress_code: 'Formal',
      });

      await serviceClient.from('wedding_faqs').insert({
        wedding_id: lifecycleWeddingId,
        question: 'Lifecycle Q?',
        answer: 'Lifecycle A',
      });
    });

    it('draft wedding: anon CANNOT SELECT wedding_events', async () => {
      const { data } = await anonClient
        .from('wedding_events')
        .select('*')
        .eq('wedding_id', lifecycleWeddingId);

      expect(data).toEqual([]);
    });

    it('owner updates wedding status to live', async () => {
      const { error } = await ownerClient
        .from('weddings')
        .update({ status: 'live' })
        .eq('id', lifecycleWeddingId);

      expect(error).toBeNull();
    });

    it('live wedding: anon CAN SELECT wedding_events and faqs', async () => {
      const { data: events } = await anonClient
        .from('wedding_events')
        .select('*')
        .eq('wedding_id', lifecycleWeddingId);
      expect(events!.length).toBeGreaterThan(0);

      const { data: faqs } = await anonClient
        .from('wedding_faqs')
        .select('*')
        .eq('wedding_id', lifecycleWeddingId);
      expect(faqs!.length).toBeGreaterThan(0);
    });

    it('owner updates status back to draft', async () => {
      const { error } = await ownerClient
        .from('weddings')
        .update({ status: 'draft' })
        .eq('id', lifecycleWeddingId);

      expect(error).toBeNull();
    });

    it('draft again: anon CANNOT SELECT content tables', async () => {
      const { data: events } = await anonClient
        .from('wedding_events')
        .select('*')
        .eq('wedding_id', lifecycleWeddingId);
      expect(events).toEqual([]);

      const { data: faqs } = await anonClient
        .from('wedding_faqs')
        .select('*')
        .eq('wedding_id', lifecycleWeddingId);
      expect(faqs).toEqual([]);
    });
  });
});
