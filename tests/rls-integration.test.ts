// @vitest-environment node
/**
 * RLS Integration Tests
 *
 * These tests run against a SEPARATE Supabase test project (schema-identical to production).
 * They validate that RLS policies correctly enforce access control.
 *
 * Requirements:
 * - .env.test file with TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_SERVICE_ROLE_KEY
 * - Test project has the same schema + both RLS migrations applied
 *   (20260307_rls_lockdown.sql + 20260310_rls_phase2.sql)
 *
 * Skips automatically when test credentials are unavailable.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.test
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const TEST_URL = process.env.TEST_SUPABASE_URL;
const TEST_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY;
const TEST_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

const canRun = !!(TEST_URL && TEST_ANON_KEY && TEST_SERVICE_KEY);

// Test user credentials
const OWNER_EMAIL = 'rls-test-owner@phera-test.local';
const OWNER_PASSWORD = 'TestOwner123!';
const INTRUDER_EMAIL = 'rls-test-intruder@phera-test.local';
const INTRUDER_PASSWORD = 'TestIntruder123!';
const ADMIN_EMAIL = 'rls-test-admin@phera-test.local';
const ADMIN_PASSWORD = 'TestAdmin123!';

// Required NOT NULL fields for weddings table (no defaults in schema)
const WEDDING_REQUIRED_FIELDS = {
  wedding_date: '2026-12-01T00:00:00Z',
  wedding_date_display: 'December 1, 2026',
  venue_name: 'Test Venue',
  venue_location: 'Test City',
  rsvp_deadline: '2026-11-01',
};

// retry — these hit the live phera-test Supabase in parallel with the other
// integration suites, so occasional transient connection/contention failures
// auto-recover on retry. Unit tests stay strict (no global retry in config).
describe.skipIf(!canRun)('RLS Integration Tests', { timeout: 120_000, retry: 2 }, () => {
  let serviceClient: SupabaseClient;
  let anonClient: SupabaseClient;
  let ownerClient: SupabaseClient;
  let intruderClient: SupabaseClient;
  let adminClient: SupabaseClient;

  let ownerId: string;
  let intruderId: string;
  let adminId: string;
  let testWeddingId: string;
  let testWeddingSlug: string;
  const tempWeddingIds: string[] = []; // Track temporary weddings for cleanup
  const cleanupIds: { table: string; column: string; value: string }[] = [];

  beforeAll(async () => {
    const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

    // Service role client (bypasses RLS) — must not share session storage
    serviceClient = createClient(TEST_URL!, TEST_SERVICE_KEY!, noSession);

    // Anon client (unauthenticated)
    anonClient = createClient(TEST_URL!, TEST_ANON_KEY!, noSession);

    // Helper to create or look up a test user
    async function ensureUser(email: string, password: string): Promise<string> {
      const { data, error } = await serviceClient.auth.admin.createUser({
        email, password, email_confirm: true,
      });
      if (!error && data?.user?.id) return data.user.id;
      if (error && error.message.includes('already been registered')) {
        const { data: users } = await serviceClient.auth.admin.listUsers();
        const existing = users?.users?.find((u: any) => u.email === email);
        if (existing?.id) return existing.id;
      }
      throw new Error(`Failed to create/find user ${email}: ${error?.message}`);
    }

    // Create test users
    ownerId = await ensureUser(OWNER_EMAIL, OWNER_PASSWORD);
    intruderId = await ensureUser(INTRUDER_EMAIL, INTRUDER_PASSWORD);
    adminId = await ensureUser(ADMIN_EMAIL, ADMIN_PASSWORD);

    // Create authenticated clients — each with isolated session
    ownerClient = createClient(TEST_URL!, TEST_ANON_KEY!, noSession);
    const { error: ownerSignInErr } = await ownerClient.auth.signInWithPassword({
      email: OWNER_EMAIL, password: OWNER_PASSWORD,
    });
    if (ownerSignInErr) throw new Error(`Owner sign-in failed: ${ownerSignInErr.message}`);

    intruderClient = createClient(TEST_URL!, TEST_ANON_KEY!, noSession);
    const { error: intruderSignInErr } = await intruderClient.auth.signInWithPassword({
      email: INTRUDER_EMAIL, password: INTRUDER_PASSWORD,
    });
    if (intruderSignInErr) throw new Error(`Intruder sign-in failed: ${intruderSignInErr.message}`);

    adminClient = createClient(TEST_URL!, TEST_ANON_KEY!, noSession);
    const { error: adminSignInErr } = await adminClient.auth.signInWithPassword({
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    });
    if (adminSignInErr) throw new Error(`Admin sign-in failed: ${adminSignInErr.message}`);

    // Create test wedding via service role
    testWeddingSlug = `rls-test-${Date.now()}`;
    const { data: wedding, error: weddingErr } = await serviceClient
      .from('weddings')
      .insert({
        slug: testWeddingSlug,
        couple_name: 'RLS Test Couple',
        created_by: ownerId,
        status: 'live',
        ...WEDDING_REQUIRED_FIELDS,
      })
      .select()
      .single();

    if (weddingErr) throw new Error(`Failed to create test wedding: ${weddingErr.message}`);
    testWeddingId = wedding.id;

    // Create wedding_settings
    await serviceClient.from('wedding_settings').insert({
      wedding_id: testWeddingId,
      pin_codes: [{ pin: '1234', type: 'general', allows_plus_one: true }],
    });

    // Add admin user to wedding_admins
    await serviceClient.from('wedding_admins').insert({
      wedding_id: testWeddingId,
      user_id: adminId,
      role: 'admin',
    });
  }, 60000);

  afterAll(async () => {
    if (!canRun) return;

    // Cleanup tracked records
    for (const { table, column, value } of cleanupIds) {
      await serviceClient.from(table).delete().eq(column, value);
    }

    // Cleanup test data (service role bypasses RLS)
    if (testWeddingId) {
      // WhatsApp tables
      await serviceClient.from('whatsapp_opt_ins').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('whatsapp_messages').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('whatsapp_broadcasts').delete().eq('wedding_id', testWeddingId);
      // Transportation tables
      await serviceClient.from('transportation_reservations').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('transportation_groups').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('transportation_pickup_locations').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('transportation_vehicles').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('transportation_vehicle_types').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('transportation_time_ranges').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('transportation_settings').delete().eq('wedding_id', testWeddingId);
      // Guest features (slug-based)
      await serviceClient.from('guest_checklist_items').delete().eq('wedding_id', testWeddingSlug);
      await serviceClient.from('guest_flights').delete().eq('wedding_id', testWeddingSlug);
      await serviceClient.from('travel_bus_signups').delete().eq('wedding_id', testWeddingSlug);
      // Content tables
      await serviceClient.from('schedule_items').delete().match({});
      await serviceClient.from('wedding_schedule').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('wedding_events').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('wedding_faqs').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('wedding_registry').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('wedding_shops').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('wedding_travel_cards').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('wedding_tasks').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('wedding_invites').delete().eq('wedding_id', testWeddingId);
      // Vendor tables
      await serviceClient.from('vendor_insights').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('vendor_messages').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('conversation_members').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('vendor_conversations').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('vendors').delete().eq('wedding_id', testWeddingId);
      // Core tables
      await serviceClient.from('comments').delete().eq('wedding_id', testWeddingSlug);
      await serviceClient.from('rsvps').delete().eq('wedding_id', testWeddingSlug);
      await serviceClient.from('guests').delete().eq('wedding_id', testWeddingSlug);
      await serviceClient.from('wedding_admins').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('wedding_settings').delete().eq('wedding_id', testWeddingId);
      await serviceClient.from('weddings').delete().eq('id', testWeddingId);
    }

    // Delete temporary weddings from Group 1 tests
    for (const id of tempWeddingIds) {
      await serviceClient.from('wedding_admins').delete().eq('wedding_id', id);
      await serviceClient.from('wedding_settings').delete().eq('wedding_id', id);
      await serviceClient.from('weddings').delete().eq('id', id);
    }

    // Delete test users
    if (ownerId) await serviceClient.auth.admin.deleteUser(ownerId);
    if (intruderId) await serviceClient.auth.admin.deleteUser(intruderId);
    if (adminId) await serviceClient.auth.admin.deleteUser(adminId);
  }, 60000);

  // =========================================================================
  // Group 1: Wedding creation (validates INSERT fix)
  // =========================================================================
  describe('Group 1: Wedding creation', () => {
    it('authenticated user CAN create wedding with own created_by', async () => {
      const slug = `rls-insert-test-${Date.now()}`;
      const { data, error } = await ownerClient
        .from('weddings')
        .insert({ slug, couple_name: 'Insert Test', created_by: ownerId, ...WEDDING_REQUIRED_FIELDS })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.slug).toBe(slug);

      // Track for cleanup in afterAll (inline delete may hang on free tier)
      if (data?.id) tempWeddingIds.push(data.id);
    });

    it('authenticated user CANNOT create wedding with someone else\'s created_by', async () => {
      const slug = `rls-insert-bad-${Date.now()}`;
      const { error } = await ownerClient
        .from('weddings')
        .insert({ slug, couple_name: 'Bad Insert', created_by: intruderId, ...WEDDING_REQUIRED_FIELDS })
        .select()
        .single();

      expect(error).toBeTruthy();
    });
  });

  // =========================================================================
  // Group 2: Wedding table CRUD
  // =========================================================================
  describe('Group 2: Wedding table CRUD', () => {
    it('anon CAN SELECT weddings', async () => {
      const { data, error } = await anonClient
        .from('weddings')
        .select('id, slug')
        .eq('id', testWeddingId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.slug).toBe(testWeddingSlug);
    });

    it('anon CANNOT INSERT weddings', async () => {
      const { error } = await anonClient
        .from('weddings')
        .insert({ slug: 'anon-wedding', couple_name: 'Anon', created_by: 'fake' });

      expect(error).toBeTruthy();
    });

    it('anon CANNOT UPDATE weddings', async () => {
      const { error } = await anonClient
        .from('weddings')
        .update({ couple_name: 'Hacked' })
        .eq('id', testWeddingId);

      // Should either error or affect 0 rows
      const { data } = await serviceClient
        .from('weddings')
        .select('couple_name')
        .eq('id', testWeddingId)
        .single();
      expect(data!.couple_name).toBe('RLS Test Couple');
    });

    it('anon CANNOT DELETE weddings', async () => {
      await anonClient.from('weddings').delete().eq('id', testWeddingId);

      // Verify wedding still exists
      const { data } = await serviceClient
        .from('weddings')
        .select('id')
        .eq('id', testWeddingId)
        .single();
      expect(data).toBeTruthy();
    });

    it('owner CAN UPDATE their wedding', async () => {
      const { error } = await ownerClient
        .from('weddings')
        .update({ couple_name: 'Updated Name' })
        .eq('id', testWeddingId);

      expect(error).toBeNull();

      // Verify
      const { data } = await serviceClient
        .from('weddings')
        .select('couple_name')
        .eq('id', testWeddingId)
        .single();
      expect(data!.couple_name).toBe('Updated Name');

      // Restore
      await serviceClient.from('weddings').update({ couple_name: 'RLS Test Couple' }).eq('id', testWeddingId);
    });

    it('intruder CANNOT UPDATE someone else\'s wedding', async () => {
      // Get current name before intruder attempt
      const { data: before } = await serviceClient
        .from('weddings')
        .select('couple_name')
        .eq('id', testWeddingId)
        .single();

      await intruderClient
        .from('weddings')
        .update({ couple_name: 'Intruder' })
        .eq('id', testWeddingId);

      const { data: after } = await serviceClient
        .from('weddings')
        .select('couple_name')
        .eq('id', testWeddingId)
        .single();
      expect(after!.couple_name).toBe(before!.couple_name);
      expect(after!.couple_name).not.toBe('Intruder');
    });

    it('intruder CANNOT DELETE someone else\'s wedding', async () => {
      await intruderClient.from('weddings').delete().eq('id', testWeddingId);

      const { data } = await serviceClient
        .from('weddings')
        .select('id')
        .eq('id', testWeddingId)
        .single();
      expect(data).toBeTruthy();
    });
  });

  // =========================================================================
  // Group 3: Guest-facing tables (guests, rsvps, comments)
  // =========================================================================
  describe('Group 3: Guest-facing tables', () => {
    let testGuestId: string;

    it('anon CAN INSERT guests (RSVP flow)', async () => {
      const { data, error } = await anonClient
        .from('guests')
        .insert({ wedding_id: testWeddingSlug, name: 'Test Guest', email: 'guest@test.com', avatar_color: '#ccc' })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      testGuestId = data!.id;
    });

    it('anon CAN SELECT guests', async () => {
      const { data, error } = await anonClient
        .from('guests')
        .select('*')
        .eq('wedding_id', testWeddingSlug);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('anon CAN INSERT rsvps', async () => {
      const { error } = await anonClient
        .from('rsvps')
        .insert({
          wedding_id: testWeddingSlug,
          guest_id: testGuestId,
          event_id: 'test-event',
          attending: 'yes',
        });

      expect(error).toBeNull();
    });

    it('anon CAN UPDATE rsvps', async () => {
      const { error } = await anonClient
        .from('rsvps')
        .update({ attending: 'no' })
        .eq('guest_id', testGuestId)
        .eq('wedding_id', testWeddingSlug);

      expect(error).toBeNull();
    });

    it('anon CAN INSERT comments', async () => {
      const { error } = await anonClient
        .from('comments')
        .insert({
          wedding_id: testWeddingSlug,
          message: 'Congratulations!',
        });

      expect(error).toBeNull();
    });

    it('anon CANNOT UPDATE guests', async () => {
      await anonClient
        .from('guests')
        .update({ name: 'Hacked Guest' })
        .eq('id', testGuestId);

      const { data } = await serviceClient
        .from('guests')
        .select('name')
        .eq('id', testGuestId)
        .single();
      expect(data!.name).toBe('Test Guest');
    });

    it('anon CANNOT DELETE guests', async () => {
      await anonClient.from('guests').delete().eq('id', testGuestId);

      const { data } = await serviceClient
        .from('guests')
        .select('id')
        .eq('id', testGuestId)
        .single();
      expect(data).toBeTruthy();
    });

    it('owner CAN DELETE guests from their wedding', async () => {
      // Create a guest to delete
      const { data: guest } = await serviceClient
        .from('guests')
        .insert({ wedding_id: testWeddingSlug, name: 'To Delete', email: 'delete@test.com', avatar_color: '#ccc' })
        .select()
        .single();

      const { error } = await ownerClient
        .from('guests')
        .delete()
        .eq('id', guest!.id);

      expect(error).toBeNull();
    });

    it('intruder CANNOT delete another wedding\'s guest data', async () => {
      await intruderClient
        .from('guests')
        .delete()
        .eq('id', testGuestId);

      const { data } = await serviceClient
        .from('guests')
        .select('id')
        .eq('id', testGuestId)
        .single();
      expect(data).toBeTruthy();
    });
  });

  // =========================================================================
  // Group 4: Vendor tables (all restricted)
  // =========================================================================
  describe('Group 4: Vendor tables', () => {
    let testVendorId: string;

    beforeAll(async () => {
      // Create vendor via service role for testing
      const { data } = await serviceClient
        .from('vendors')
        .insert({
          wedding_id: testWeddingId,
          name: 'Test Vendor',
          category: 'Catering',
        })
        .select()
        .single();
      testVendorId = data!.id;
    });

    it('anon CANNOT SELECT vendors', async () => {
      const { data } = await anonClient
        .from('vendors')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(data).toEqual([]);
    });

    it('anon CANNOT INSERT vendors', async () => {
      const { error } = await anonClient
        .from('vendors')
        .insert({ wedding_id: testWeddingId, name: 'Anon Vendor' });

      expect(error).toBeTruthy();
    });

    it('owner CAN SELECT their vendors', async () => {
      const { data, error } = await ownerClient
        .from('vendors')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('owner CAN INSERT vendors for their wedding', async () => {
      const { data, error } = await ownerClient
        .from('vendors')
        .insert({ wedding_id: testWeddingId, name: 'Owner Vendor' })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();

      // Cleanup
      await serviceClient.from('vendors').delete().eq('id', data!.id);
    });

    it('owner CAN UPDATE their vendor', async () => {
      const { error } = await ownerClient
        .from('vendors')
        .update({ name: 'Updated Vendor' })
        .eq('id', testVendorId);

      expect(error).toBeNull();

      const { data } = await serviceClient
        .from('vendors')
        .select('name')
        .eq('id', testVendorId)
        .single();
      expect(data!.name).toBe('Updated Vendor');
    });

    it('owner CAN DELETE their vendor', async () => {
      // Create one to delete
      const { data: v } = await serviceClient
        .from('vendors')
        .insert({ wedding_id: testWeddingId, name: 'To Delete' })
        .select()
        .single();

      const { error } = await ownerClient
        .from('vendors')
        .delete()
        .eq('id', v!.id);

      expect(error).toBeNull();
    });

    it('intruder CANNOT SELECT another wedding\'s vendors', async () => {
      const { data } = await intruderClient
        .from('vendors')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(data).toEqual([]);
    });

    it('intruder CANNOT INSERT vendors for another wedding', async () => {
      const { error } = await intruderClient
        .from('vendors')
        .insert({ wedding_id: testWeddingId, name: 'Intruder Vendor' });

      expect(error).toBeTruthy();
    });

    it('intruder CANNOT UPDATE another wedding\'s vendors', async () => {
      // Get current name before intruder attempt
      const { data: before } = await serviceClient
        .from('vendors')
        .select('name')
        .eq('id', testVendorId)
        .single();

      // Use AbortController to prevent hang on free tier
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        await intruderClient
          .from('vendors')
          .update({ name: 'Hacked' })
          .eq('id', testVendorId)
          .abortSignal(controller.signal);
      } catch {
        // Abort is expected if it hangs
      } finally {
        clearTimeout(timer);
      }

      const { data: after } = await serviceClient
        .from('vendors')
        .select('name')
        .eq('id', testVendorId)
        .single();
      expect(after!.name).toBe(before!.name);
      expect(after!.name).not.toBe('Hacked');
    });
  });

  // =========================================================================
  // Group 5: Service role bypass
  // =========================================================================
  describe('Group 5: Service role bypass', () => {
    it('service role CAN insert vendor_messages (webhook flow)', async () => {
      // Create a conversation first
      const { data: convo, error: convoErr } = await serviceClient
        .from('vendor_conversations')
        .insert({
          wedding_id: testWeddingId,
          title: 'Test Convo',
          source: 'whapi_webhook',
          status: 'ready',
        })
        .select()
        .single();

      expect(convoErr).toBeNull();
      expect(convo).toBeTruthy();

      const { error } = await serviceClient
        .from('vendor_messages')
        .insert({
          conversation_id: convo!.id,
          wedding_id: testWeddingId,
          sender_name: 'Webhook Bot',
          sender_type: 'coordinator',
          content: 'Hello from webhook',
          message_timestamp: new Date().toISOString(),
        });

      expect(error).toBeNull();

      // Cleanup
      await serviceClient.from('vendor_messages').delete().eq('conversation_id', convo!.id);
      await serviceClient.from('vendor_conversations').delete().eq('id', convo!.id);
    });

    it('service role CAN read all data', async () => {
      const { data: weddings, error: wErr } = await serviceClient
        .from('weddings')
        .select('id')
        .eq('id', testWeddingId);

      expect(wErr).toBeNull();
      expect(weddings!.length).toBe(1);

      const { data: vendors, error: vErr } = await serviceClient
        .from('vendors')
        .select('id')
        .eq('wedding_id', testWeddingId);

      expect(vErr).toBeNull();
      expect(vendors!.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Group 6: Admin role access
  // =========================================================================
  describe('Group 6: Admin role access', () => {
    it('admin CAN SELECT owner\'s wedding', async () => {
      const { data, error } = await adminClient
        .from('weddings')
        .select('id, slug')
        .eq('id', testWeddingId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.slug).toBe(testWeddingSlug);
    });

    it('admin CAN UPDATE owner\'s wedding', async () => {
      const { error } = await adminClient
        .from('weddings')
        .update({ couple_name: 'Admin Updated' })
        .eq('id', testWeddingId);

      expect(error).toBeNull();

      const { data } = await serviceClient
        .from('weddings')
        .select('couple_name')
        .eq('id', testWeddingId)
        .single();
      expect(data!.couple_name).toBe('Admin Updated');

      // Restore
      await serviceClient.from('weddings').update({ couple_name: 'RLS Test Couple' }).eq('id', testWeddingId);
    });

    it('admin CANNOT UPDATE a wedding they\'re not admin of', async () => {
      // Create another wedding owned by intruder
      const slug = `rls-admin-nowrite-${Date.now()}`;
      const { data: otherWedding } = await serviceClient
        .from('weddings')
        .insert({ slug, couple_name: 'Other Wedding', created_by: intruderId, ...WEDDING_REQUIRED_FIELDS })
        .select()
        .single();
      tempWeddingIds.push(otherWedding!.id);

      await adminClient
        .from('weddings')
        .update({ couple_name: 'Admin Hacked' })
        .eq('id', otherWedding!.id);

      const { data } = await serviceClient
        .from('weddings')
        .select('couple_name')
        .eq('id', otherWedding!.id)
        .single();
      expect(data!.couple_name).toBe('Other Wedding');
    });

    it('admin CAN INSERT vendors for their wedding', async () => {
      const { data, error } = await adminClient
        .from('vendors')
        .insert({ wedding_id: testWeddingId, name: 'Admin Vendor' })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      await serviceClient.from('vendors').delete().eq('id', data!.id);
    });

    it('admin CAN DELETE guests from their wedding', async () => {
      const { data: guest } = await serviceClient
        .from('guests')
        .insert({ wedding_id: testWeddingSlug, name: 'Admin Delete Target', email: 'admindel@test.com', avatar_color: '#aaa' })
        .select()
        .single();

      const { error } = await adminClient
        .from('guests')
        .delete()
        .eq('id', guest!.id);

      expect(error).toBeNull();
    });

    it('admin CAN manage wedding_settings', async () => {
      const { error } = await adminClient
        .from('wedding_settings')
        .update({ whatsapp_group_link: 'https://chat.whatsapp.com/test' })
        .eq('wedding_id', testWeddingId);

      expect(error).toBeNull();

      // Restore
      await serviceClient.from('wedding_settings').update({ whatsapp_group_link: null }).eq('wedding_id', testWeddingId);
    });

    it('admin permissions come from wedding_admins table, not created_by', async () => {
      // Admin (adminId) is NOT the wedding creator (ownerId), but IS in wedding_admins
      const { data } = await adminClient
        .from('vendors')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(data).toBeTruthy();
      expect(data!.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Group 7: Wedding content tables — admin-scoped
  // =========================================================================
  describe('Group 7: Wedding content tables', () => {
    let testEventId: string;
    let testScheduleId: string;

    beforeAll(async () => {
      // Create content via service role for testing
      const { data: evt } = await serviceClient
        .from('wedding_events')
        .insert({
          wedding_id: testWeddingId,
          name: 'Test Event',
          slug: 'test-event',
          date: '2026-12-01',
          time: '18:00',
          dress_code: 'Formal',
        })
        .select()
        .single();
      testEventId = evt!.id;

      const { data: sched } = await serviceClient
        .from('wedding_schedule')
        .insert({
          wedding_id: testWeddingId,
          day_name: 'Day 1',
          date: '2026-12-01',
        })
        .select()
        .single();
      testScheduleId = sched!.id;

      await serviceClient.from('wedding_faqs').insert({
        wedding_id: testWeddingId,
        question: 'Test Q?',
        answer: 'Test A',
      });

      await serviceClient.from('wedding_registry').insert({
        wedding_id: testWeddingId,
        fund_name: 'Test Fund',
        emoji: '🎁',
      });

      await serviceClient.from('wedding_shops').insert({
        wedding_id: testWeddingId,
        name: 'Test Shop',
        details: 'Details',
        url: 'https://example.com',
      });

      await serviceClient.from('wedding_travel_cards').insert({
        wedding_id: testWeddingId,
        title: 'Test Card',
        image_url: 'https://example.com/img.jpg',
      });
    });

    it('anon CAN SELECT wedding_events for live wedding', async () => {
      const { data, error } = await anonClient
        .from('wedding_events')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('anon CAN SELECT wedding_faqs for live wedding', async () => {
      const { data, error } = await anonClient
        .from('wedding_faqs')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('anon CAN SELECT wedding_registry for live wedding', async () => {
      const { data } = await anonClient
        .from('wedding_registry')
        .select('*')
        .eq('wedding_id', testWeddingId);
      expect(data!.length).toBeGreaterThan(0);
    });

    it('anon CAN SELECT wedding_schedule for live wedding', async () => {
      const { data } = await anonClient
        .from('wedding_schedule')
        .select('*')
        .eq('wedding_id', testWeddingId);
      expect(data!.length).toBeGreaterThan(0);
    });

    it('anon CAN SELECT wedding_shops for live wedding', async () => {
      const { data } = await anonClient
        .from('wedding_shops')
        .select('*')
        .eq('wedding_id', testWeddingId);
      expect(data!.length).toBeGreaterThan(0);
    });

    it('anon CAN SELECT wedding_travel_cards for live wedding', async () => {
      const { data } = await anonClient
        .from('wedding_travel_cards')
        .select('*')
        .eq('wedding_id', testWeddingId);
      expect(data!.length).toBeGreaterThan(0);
    });

    it('anon CANNOT SELECT wedding_events for draft wedding', async () => {
      // Temporarily set wedding to draft
      await serviceClient.from('weddings').update({ status: 'draft' }).eq('id', testWeddingId);

      const { data } = await anonClient
        .from('wedding_events')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(data).toEqual([]);

      // Restore to live
      await serviceClient.from('weddings').update({ status: 'live' }).eq('id', testWeddingId);
    });

    it('owner CAN full CRUD on wedding_events', async () => {
      const { data: created, error: createErr } = await ownerClient
        .from('wedding_events')
        .insert({
          wedding_id: testWeddingId,
          name: 'Owner Event',
          slug: 'owner-event',
          date: '2026-12-02',
          time: '14:00',
          dress_code: 'Casual',
        })
        .select()
        .single();

      expect(createErr).toBeNull();

      const { error: updateErr } = await ownerClient
        .from('wedding_events')
        .update({ name: 'Updated Event' })
        .eq('id', created!.id);

      expect(updateErr).toBeNull();

      const { error: deleteErr } = await ownerClient
        .from('wedding_events')
        .delete()
        .eq('id', created!.id);

      expect(deleteErr).toBeNull();
    });

    it('admin CAN full CRUD on wedding_faqs', async () => {
      const { data: created, error: createErr } = await adminClient
        .from('wedding_faqs')
        .insert({
          wedding_id: testWeddingId,
          question: 'Admin Q?',
          answer: 'Admin A',
        })
        .select()
        .single();

      expect(createErr).toBeNull();

      const { error: updateErr } = await adminClient
        .from('wedding_faqs')
        .update({ answer: 'Updated A' })
        .eq('id', created!.id);

      expect(updateErr).toBeNull();

      const { error: deleteErr } = await adminClient
        .from('wedding_faqs')
        .delete()
        .eq('id', created!.id);

      expect(deleteErr).toBeNull();
    });

    it('intruder CANNOT mutate wedding_events', async () => {
      const { error } = await intruderClient
        .from('wedding_events')
        .insert({
          wedding_id: testWeddingId,
          name: 'Intruder Event',
          slug: 'intruder-event',
          date: '2026-12-02',
          time: '14:00',
          dress_code: 'Casual',
        });

      expect(error).toBeTruthy();
    });

    it('intruder CANNOT mutate wedding_faqs', async () => {
      const { error } = await intruderClient
        .from('wedding_faqs')
        .insert({
          wedding_id: testWeddingId,
          question: 'Intruder Q?',
          answer: 'Intruder A',
        });

      expect(error).toBeTruthy();
    });
  });

  // =========================================================================
  // Group 8: Wedding management tables
  // =========================================================================
  describe('Group 8: Wedding management tables', () => {
    it('owner CAN insert admin for their wedding', async () => {
      // We already have adminId in wedding_admins from setup.
      // Test that owner can add another admin.
      const { data: newUser } = await serviceClient.auth.admin.createUser({
        email: `rls-tmp-admin-${Date.now()}@phera-test.local`,
        password: 'TmpAdmin123!',
        email_confirm: true,
      });
      const tmpUserId = newUser!.user!.id;

      const { error } = await ownerClient
        .from('wedding_admins')
        .insert({ wedding_id: testWeddingId, user_id: tmpUserId, role: 'admin' });

      expect(error).toBeNull();

      // Cleanup
      await serviceClient.from('wedding_admins').delete().eq('user_id', tmpUserId);
      await serviceClient.auth.admin.deleteUser(tmpUserId);
    });

    it('admin CAN see own admin record', async () => {
      const { data, error } = await adminClient
        .from('wedding_admins')
        .select('*')
        .eq('wedding_id', testWeddingId)
        .eq('user_id', adminId);

      expect(error).toBeNull();
      expect(data!.length).toBe(1);
    });

    it('intruder CANNOT see other wedding\'s admins', async () => {
      const { data } = await intruderClient
        .from('wedding_admins')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(data).toEqual([]);
    });

    it('owner CAN create/read/delete wedding_invites', async () => {
      const { data: invite, error: createErr } = await ownerClient
        .from('wedding_invites')
        .insert({ wedding_id: testWeddingId, email: 'invite@test.com', invited_by: ownerId })
        .select()
        .single();

      expect(createErr).toBeNull();

      const { data: found } = await ownerClient
        .from('wedding_invites')
        .select('*')
        .eq('id', invite!.id);

      expect(found!.length).toBe(1);

      const { error: deleteErr } = await ownerClient
        .from('wedding_invites')
        .delete()
        .eq('id', invite!.id);

      expect(deleteErr).toBeNull();
    });

    it('intruder CANNOT access wedding_invites', async () => {
      const { data: invite } = await serviceClient
        .from('wedding_invites')
        .insert({ wedding_id: testWeddingId, email: 'intruder-invite@test.com', invited_by: ownerId })
        .select()
        .single();

      const { data } = await intruderClient
        .from('wedding_invites')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(data).toEqual([]);

      await serviceClient.from('wedding_invites').delete().eq('id', invite!.id);
    });

    it('owner CAN CRUD wedding_tasks (after policy tightening)', async () => {
      const { data: task, error: createErr } = await ownerClient
        .from('wedding_tasks')
        .insert({ wedding_id: testWeddingId, title: 'Test Task' })
        .select()
        .single();

      expect(createErr).toBeNull();

      const { error: updateErr } = await ownerClient
        .from('wedding_tasks')
        .update({ title: 'Updated Task' })
        .eq('id', task!.id);

      expect(updateErr).toBeNull();

      const { error: deleteErr } = await ownerClient
        .from('wedding_tasks')
        .delete()
        .eq('id', task!.id);

      expect(deleteErr).toBeNull();
    });

    it('intruder CANNOT access wedding_tasks', async () => {
      const { data: task } = await serviceClient
        .from('wedding_tasks')
        .insert({ wedding_id: testWeddingId, title: 'Secret Task' })
        .select()
        .single();

      const { data } = await intruderClient
        .from('wedding_tasks')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(data).toEqual([]);

      await serviceClient.from('wedding_tasks').delete().eq('id', task!.id);
    });
  });

  // =========================================================================
  // Group 9: User-scoped tables
  // =========================================================================
  describe('Group 9: User-scoped tables', () => {
    it('user CAN read/write own user_settings', async () => {
      // Insert settings for owner (canonical tiers only since the 2026-07-13 constraint tightening)
      const { error: insertErr } = await ownerClient
        .from('user_settings')
        .upsert({ user_id: ownerId, account_type: 'couple', subscription_tier: 'phera' });

      expect(insertErr).toBeNull();

      const { data, error: selectErr } = await ownerClient
        .from('user_settings')
        .select('*')
        .eq('user_id', ownerId);

      expect(selectErr).toBeNull();
      expect(data!.length).toBe(1);
    });

    it('user CANNOT access other user\'s user_settings', async () => {
      const { data } = await intruderClient
        .from('user_settings')
        .select('*')
        .eq('user_id', ownerId);

      expect(data).toEqual([]);
    });

    it('user CAN manage own planner_profiles', async () => {
      const { error: insertErr } = await ownerClient
        .from('planner_profiles')
        .upsert({ user_id: ownerId, company_name: 'Test Co', location: 'Test City' });

      expect(insertErr).toBeNull();

      const { data } = await ownerClient
        .from('planner_profiles')
        .select('*')
        .eq('user_id', ownerId);

      expect(data!.length).toBe(1);

      // Cleanup
      await serviceClient.from('planner_profiles').delete().eq('user_id', ownerId);
    });

    it('user CANNOT see others\' planner_profiles', async () => {
      await serviceClient.from('planner_profiles').upsert({
        user_id: intruderId, company_name: 'Secret Co', location: 'Secret City',
      });

      const { data } = await ownerClient
        .from('planner_profiles')
        .select('*')
        .eq('user_id', intruderId);

      expect(data).toEqual([]);

      await serviceClient.from('planner_profiles').delete().eq('user_id', intruderId);
    });

    it('user CAN insert/read own pin_access', async () => {
      const { error: insertErr } = await ownerClient
        .from('pin_access')
        .insert({ user_id: ownerId, wedding_id: testWeddingSlug, pin_type: 'general' });

      expect(insertErr).toBeNull();

      const { data } = await ownerClient
        .from('pin_access')
        .select('*')
        .eq('user_id', ownerId);

      expect(data!.length).toBeGreaterThan(0);

      // Cleanup
      await serviceClient.from('pin_access').delete().eq('user_id', ownerId);
    });

    it('user CANNOT see others\' pin_access', async () => {
      await serviceClient.from('pin_access').insert({
        user_id: intruderId, wedding_id: testWeddingSlug, pin_type: 'general',
      });

      const { data } = await ownerClient
        .from('pin_access')
        .select('*')
        .eq('user_id', intruderId);

      expect(data).toEqual([]);

      await serviceClient.from('pin_access').delete().eq('user_id', intruderId);
    });

    it('user CAN insert/read own feature_requests', async () => {
      const { error: insertErr } = await ownerClient
        .from('feature_requests')
        .insert({ user_id: ownerId, content: 'Test request' });

      expect(insertErr).toBeNull();

      const { data } = await ownerClient
        .from('feature_requests')
        .select('*')
        .eq('user_id', ownerId);

      expect(data!.length).toBeGreaterThan(0);

      // Cleanup
      await serviceClient.from('feature_requests').delete().eq('user_id', ownerId);
    });

    it('user CANNOT see others\' feature_requests', async () => {
      await serviceClient.from('feature_requests').insert({
        user_id: intruderId, content: 'Secret request',
      });

      const { data } = await ownerClient
        .from('feature_requests')
        .select('*')
        .eq('user_id', intruderId);

      expect(data).toEqual([]);

      await serviceClient.from('feature_requests').delete().eq('user_id', intruderId);
    });
  });

  // =========================================================================
  // Group 10: Guest feature tables
  // =========================================================================
  describe('Group 10: Guest feature tables', () => {
    let testGuestForFeatures: string;

    beforeAll(async () => {
      const { data } = await serviceClient
        .from('guests')
        .insert({ wedding_id: testWeddingSlug, name: 'Feature Guest', email: 'feature-guest@test.com', avatar_color: '#ddd' })
        .select()
        .single();
      testGuestForFeatures = data!.id;
    });

    it('anon CAN INSERT guest_checklist_items', async () => {
      const { error } = await anonClient
        .from('guest_checklist_items')
        .insert({
          guest_id: testGuestForFeatures,
          wedding_id: testWeddingSlug,
          item_key: 'pack_bags',
        });

      expect(error).toBeNull();
    });

    it('anon CAN UPDATE guest_checklist_items', async () => {
      const { error } = await anonClient
        .from('guest_checklist_items')
        .update({ completed: true })
        .eq('guest_id', testGuestForFeatures)
        .eq('item_key', 'pack_bags');

      expect(error).toBeNull();
    });

    it('anon CANNOT DELETE guest_checklist_items', async () => {
      await anonClient
        .from('guest_checklist_items')
        .delete()
        .eq('guest_id', testGuestForFeatures);

      const { data } = await serviceClient
        .from('guest_checklist_items')
        .select('*')
        .eq('guest_id', testGuestForFeatures);

      expect(data!.length).toBeGreaterThan(0);
    });

    it('owner CAN DELETE guest_checklist_items', async () => {
      // Create one to delete
      const { data: item } = await serviceClient
        .from('guest_checklist_items')
        .insert({ guest_id: testGuestForFeatures, wedding_id: testWeddingSlug, item_key: 'to_delete' })
        .select()
        .single();

      const { error } = await ownerClient
        .from('guest_checklist_items')
        .delete()
        .eq('id', item!.id);

      expect(error).toBeNull();
    });

    it('anon CAN INSERT/UPDATE guest_flights', async () => {
      const { error: insertErr } = await anonClient
        .from('guest_flights')
        .insert({
          guest_id: testGuestForFeatures,
          wedding_id: testWeddingSlug,
          airline: 'Test Air',
        });

      expect(insertErr).toBeNull();

      const { error: updateErr } = await anonClient
        .from('guest_flights')
        .update({ flight_number: 'TA123' })
        .eq('guest_id', testGuestForFeatures);

      expect(updateErr).toBeNull();
    });

    it('anon CAN INSERT/UPDATE travel_bus_signups', async () => {
      const email = `bus-${Date.now()}@test.com`;
      const { error: insertErr } = await anonClient
        .from('travel_bus_signups')
        .insert({
          wedding_id: testWeddingSlug,
          name: 'Bus Guest',
          email,
          party_size: 2,
        });

      expect(insertErr).toBeNull();

      const { error: updateErr } = await anonClient
        .from('travel_bus_signups')
        .update({ party_size: 3 })
        .eq('email', email)
        .eq('wedding_id', testWeddingSlug);

      expect(updateErr).toBeNull();
    });

    it('owner CAN DELETE travel_bus_signups', async () => {
      const { data: signup } = await serviceClient
        .from('travel_bus_signups')
        .insert({ wedding_id: testWeddingSlug, name: 'Del Bus', email: 'delbus@test.com' })
        .select()
        .single();

      const { error } = await ownerClient
        .from('travel_bus_signups')
        .delete()
        .eq('id', signup!.id);

      expect(error).toBeNull();
    });
  });

  // =========================================================================
  // Group 11: Transportation tables
  // =========================================================================
  describe('Group 11: Transportation tables', () => {
    it('anon CAN SELECT transportation data', async () => {
      // Create test data via service role
      await serviceClient.from('transportation_settings').upsert({
        wedding_id: testWeddingId,
        setup_complete: true,
        mode: 'flexible',
      });

      const { data, error } = await anonClient
        .from('transportation_settings')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(error).toBeNull();
      expect(data!.length).toBe(1);
    });

    it('anon CAN INSERT/UPDATE transportation_reservations (guest booking)', async () => {
      const { data: guest } = await serviceClient
        .from('guests')
        .insert({ wedding_id: testWeddingSlug, name: 'Transport Guest', email: 'transport@test.com', avatar_color: '#eee' })
        .select()
        .single();

      const { data: res, error: insertErr } = await anonClient
        .from('transportation_reservations')
        .insert({
          wedding_id: testWeddingId,
          guest_id: guest!.id,
          direction: 'arrival',
          party_size: 2,
        })
        .select()
        .single();

      expect(insertErr).toBeNull();

      const { error: updateErr } = await anonClient
        .from('transportation_reservations')
        .update({ party_size: 3 })
        .eq('id', res!.id);

      expect(updateErr).toBeNull();
    });

    it('anon CANNOT INSERT transportation_vehicles (admin only)', async () => {
      const { error } = await anonClient
        .from('transportation_vehicles')
        .insert({
          wedding_id: testWeddingId,
          direction: 'arrival',
          capacity: 10,
          departure_datetime: '2026-12-01T10:00:00Z',
        });

      expect(error).toBeTruthy();
    });

    it('anon CANNOT INSERT transportation_settings (admin only)', async () => {
      // The test wedding already has settings; try inserting for a different context
      const { error } = await anonClient
        .from('transportation_vehicle_types')
        .insert({
          wedding_id: testWeddingId,
          name: 'Anon Bus',
          capacity: 50,
        });

      expect(error).toBeTruthy();
    });

    it('owner CAN full CRUD on transportation tables', async () => {
      const { data: vt, error: vtErr } = await ownerClient
        .from('transportation_vehicle_types')
        .insert({ wedding_id: testWeddingId, name: 'Owner Bus', capacity: 40 })
        .select()
        .single();

      expect(vtErr).toBeNull();

      const { error: vtUpdateErr } = await ownerClient
        .from('transportation_vehicle_types')
        .update({ name: 'Updated Bus' })
        .eq('id', vt!.id);

      expect(vtUpdateErr).toBeNull();

      const { error: vtDeleteErr } = await ownerClient
        .from('transportation_vehicle_types')
        .delete()
        .eq('id', vt!.id);

      expect(vtDeleteErr).toBeNull();
    });

    it('intruder CANNOT mutate transportation tables', async () => {
      const { error } = await intruderClient
        .from('transportation_vehicles')
        .insert({
          wedding_id: testWeddingId,
          direction: 'arrival',
          capacity: 10,
          departure_datetime: '2026-12-01T10:00:00Z',
        });

      expect(error).toBeTruthy();
    });
  });

  // =========================================================================
  // Group 12: WhatsApp tables
  // =========================================================================
  describe('Group 12: WhatsApp tables', () => {
    it('owner CAN CRUD whatsapp_broadcasts', async () => {
      const { data: broadcast, error: createErr } = await ownerClient
        .from('whatsapp_broadcasts')
        .insert({
          wedding_id: testWeddingId,
          name: 'Test Broadcast',
          template_name: 'welcome',
          created_by: null,
        })
        .select()
        .single();

      expect(createErr).toBeNull();

      const { error: readErr, data: readData } = await ownerClient
        .from('whatsapp_broadcasts')
        .select('*')
        .eq('id', broadcast!.id);

      expect(readErr).toBeNull();
      expect(readData!.length).toBe(1);

      const { error: deleteErr } = await ownerClient
        .from('whatsapp_broadcasts')
        .delete()
        .eq('id', broadcast!.id);

      expect(deleteErr).toBeNull();
    });

    it('intruder CANNOT access whatsapp_broadcasts', async () => {
      const { data: broadcast } = await serviceClient
        .from('whatsapp_broadcasts')
        .insert({ wedding_id: testWeddingId, name: 'Secret BC', template_name: 'secret' })
        .select()
        .single();

      const { data } = await intruderClient
        .from('whatsapp_broadcasts')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(data).toEqual([]);

      await serviceClient.from('whatsapp_broadcasts').delete().eq('id', broadcast!.id);
    });

    it('owner CAN CRUD whatsapp_messages', async () => {
      const { data: msg, error: createErr } = await ownerClient
        .from('whatsapp_messages')
        .insert({
          wedding_id: testWeddingId,
          phone_number: '+1234567890',
          template_name: 'welcome',
          message_type: 'template',
        })
        .select()
        .single();

      expect(createErr).toBeNull();

      await ownerClient.from('whatsapp_messages').delete().eq('id', msg!.id);
    });

    it('intruder CANNOT access whatsapp_messages', async () => {
      const { data: msg } = await serviceClient
        .from('whatsapp_messages')
        .insert({ wedding_id: testWeddingId, phone_number: '+1111', message_type: 'test' })
        .select()
        .single();

      const { data } = await intruderClient
        .from('whatsapp_messages')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(data).toEqual([]);

      await serviceClient.from('whatsapp_messages').delete().eq('id', msg!.id);
    });

    it('anon CAN INSERT whatsapp_opt_ins (guest opt-in)', async () => {
      const { data: guest } = await serviceClient
        .from('guests')
        .insert({ wedding_id: testWeddingSlug, name: 'OptIn Guest', email: 'optin@test.com', avatar_color: '#bbb' })
        .select()
        .single();

      const { error } = await anonClient
        .from('whatsapp_opt_ins')
        .insert({
          guest_id: guest!.id,
          wedding_id: testWeddingId,
          phone_number: '+1234567890',
          opt_in_method: 'rsvp_form',
        });

      expect(error).toBeNull();
    });

    it('owner CAN SELECT whatsapp_opt_ins', async () => {
      const { data, error } = await ownerClient
        .from('whatsapp_opt_ins')
        .select('*')
        .eq('wedding_id', testWeddingId);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('authenticated CAN SELECT whatsapp_templates', async () => {
      // Create a template via service role
      const { data: tpl } = await serviceClient
        .from('whatsapp_templates')
        .insert({ name: `rls_test_tpl_${Date.now()}`, category: 'marketing', content: 'Hello' })
        .select()
        .single();

      const { data, error } = await ownerClient
        .from('whatsapp_templates')
        .select('*')
        .eq('id', tpl!.id);

      expect(error).toBeNull();
      expect(data!.length).toBe(1);

      // Authenticated CANNOT INSERT
      const { error: insertErr } = await ownerClient
        .from('whatsapp_templates')
        .insert({ name: 'hacked_tpl', category: 'marketing', content: 'Hacked' });

      expect(insertErr).toBeTruthy();

      await serviceClient.from('whatsapp_templates').delete().eq('id', tpl!.id);
    });

    it('anon CAN INSERT whatsapp_channel_clicks (append-only)', async () => {
      const { error: insertErr } = await anonClient
        .from('whatsapp_channel_clicks')
        .insert({ source: 'test' });

      expect(insertErr).toBeNull();
    });

    it('anon CANNOT DELETE whatsapp_channel_clicks', async () => {
      const { data: click } = await serviceClient
        .from('whatsapp_channel_clicks')
        .insert({ source: 'nodelete' })
        .select()
        .single();

      await anonClient
        .from('whatsapp_channel_clicks')
        .delete()
        .eq('id', click!.id);

      // Verify still exists
      const { data } = await serviceClient
        .from('whatsapp_channel_clicks')
        .select('id')
        .eq('id', click!.id)
        .single();

      expect(data).toBeTruthy();

      await serviceClient.from('whatsapp_channel_clicks').delete().eq('id', click!.id);
    });
  });

  // =========================================================================
  // Group 13: Utility tables
  // =========================================================================
  describe('Group 13: Utility tables', () => {
    it('anon CAN INSERT contact_submissions', async () => {
      const { error } = await anonClient
        .from('contact_submissions')
        .insert({
          name: 'Test Contact',
          email: 'contact@test.com',
          message: 'Hello!',
        });

      expect(error).toBeNull();
    });

    it('anon CANNOT SELECT contact_submissions', async () => {
      const { data } = await anonClient
        .from('contact_submissions')
        .select('*');

      expect(data).toEqual([]);
    });

    it('anon CANNOT DELETE contact_submissions', async () => {
      // Insert via service role and try to delete as anon
      const { data: sub } = await serviceClient
        .from('contact_submissions')
        .insert({ name: 'Del Test', email: 'del@test.com', message: 'Del' })
        .select()
        .single();

      await anonClient
        .from('contact_submissions')
        .delete()
        .eq('id', sub!.id);

      const { data } = await serviceClient
        .from('contact_submissions')
        .select('id')
        .eq('id', sub!.id)
        .single();

      expect(data).toBeTruthy();

      await serviceClient.from('contact_submissions').delete().eq('id', sub!.id);
    });
  });
});
