#!/usr/bin/env node
/**
 * Script to link the sim-kv wedding to your Supabase user account.
 * 
 * Usage: 
 *   node scripts/link-sim-kv-admin.js check              - Check current state
 *   node scripts/link-sim-kv-admin.js update <user_id>   - Update the wedding owner
 * 
 * To get your user ID, check the Supabase Dashboard > Authentication > Users
 * Or run the SQL query shown in the output.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.local manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}
loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('\nMake sure you have these in your .env.local:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_key (optional, for user queries)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllWeddings() {
  console.log('\n📋 All weddings in database:\n');

  const { data: weddings, error } = await supabase
    .from('weddings')
    .select('id, slug, couple_name, status, created_by, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!weddings || weddings.length === 0) {
    console.log('No weddings found.');
    return;
  }

  weddings.forEach((w, i) => {
    console.log(`${i + 1}. ${w.slug}`);
    console.log(`   Couple: ${w.couple_name}`);
    console.log(`   Status: ${w.status}`);
    console.log(`   Created By: ${w.created_by}`);
    console.log(`   Created At: ${w.created_at}`);
    console.log('');
  });

  return weddings;
}

async function checkWeddingState() {
  console.log('\n🔍 Checking sim-kv wedding state...\n');

  // First check for legacy RSVP/guest data (wedding_id as text 'sim-kv')
  const { count: legacyRsvpCount } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', 'sim-kv');

  const { count: legacyGuestCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', 'sim-kv');

  if (legacyRsvpCount > 0 || legacyGuestCount > 0) {
    console.log('📋 Legacy Data Found (using wedding_id = "sim-kv" as text):');
    console.log('   RSVPs:', legacyRsvpCount || 0);
    console.log('   Guests:', legacyGuestCount || 0);
    console.log('');
  }

  // Check if wedding exists in weddings table
  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .select('id, slug, couple_name, status, created_by, created_at')
    .eq('slug', 'sim-kv')
    .single();

  if (weddingError) {
    if (weddingError.code === 'PGRST116') {
      console.log('❌ Wedding "sim-kv" does NOT exist in the weddings table!');

      if (legacyRsvpCount > 0 || legacyGuestCount > 0) {
        console.log('\n✅ But you have legacy RSVP/guest data that references "sim-kv".');
        console.log('   We need to create the wedding record in the weddings table.');
      }

      console.log('\n📝 Next Steps:');
      console.log('  1. Get your Supabase user ID from Dashboard > Authentication > Users');
      console.log('     OR run this SQL: SELECT id, email FROM auth.users ORDER BY created_at DESC;');
      console.log('  2. Run: node scripts/link-sim-kv-admin.js seed <your_user_id>');
      return null;
    }
    console.error('❌ Error querying wedding:', weddingError.message);
    return null;
  }

  console.log('✅ Wedding found:');
  console.log('   ID:', wedding.id);
  console.log('   Slug:', wedding.slug);
  console.log('   Couple:', wedding.couple_name);
  console.log('   Status:', wedding.status);
  console.log('   Created By:', wedding.created_by || '(NOT SET)');
  console.log('   Created At:', wedding.created_at);

  // Check for related data
  const { count: rsvpCount } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', 'sim-kv');

  const { count: guestCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', 'sim-kv');

  const { count: eventCount } = await supabase
    .from('wedding_events')
    .select('*', { count: 'exact', head: true })
    .eq('wedding_id', wedding.id);

  console.log('\n📊 Related Data:');
  console.log('   RSVPs:', rsvpCount || 0);
  console.log('   Guests:', guestCount || 0);
  console.log('   Events (in wedding_events table):', eventCount || 0);

  // Check created_by status
  if (!wedding.created_by || wedding.created_by === 'YOUR_USER_ID_HERE') {
    console.log('\n⚠️  The wedding is NOT linked to any user account!');
    console.log('\nTo get your Supabase user ID, run this SQL in the Supabase SQL Editor:');
    console.log('─'.repeat(60));
    console.log('SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;');
    console.log('─'.repeat(60));
    console.log('\nThen run: node scripts/link-sim-kv-admin.js update <your_user_id>');
  } else {
    console.log('\n✅ Wedding is linked to user:', wedding.created_by);
  }

  return wedding;
}

async function updateWeddingOwner(userId) {
  if (!userId) {
    console.error('❌ Please provide a user ID');
    console.log('Usage: node scripts/link-sim-kv-admin.js update <user_id>');
    return;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error('❌ Invalid UUID format');
    console.log('Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    return;
  }

  console.log('\n🔄 Updating sim-kv wedding owner to:', userId);

  const { data, error } = await supabase
    .from('weddings')
    .update({ created_by: userId })
    .eq('slug', 'sim-kv')
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating wedding:', error.message);

    // Check if it's an RLS policy issue
    if (error.message.includes('policy') || error.code === '42501') {
      console.log('\n⚠️  This might be an RLS policy issue.');
      console.log('Run this SQL directly in the Supabase SQL Editor instead:');
      console.log('─'.repeat(60));
      console.log(`UPDATE weddings SET created_by = '${userId}' WHERE slug = 'sim-kv';`);
      console.log('─'.repeat(60));
    }
    return;
  }

  console.log('✅ Wedding updated successfully!');
  console.log('\nYou can now:');
  console.log('  1. Navigate to http://localhost:3000/admin');
  console.log('  2. Sign in with your Gmail account');
  console.log('  3. You should be redirected to /admin/onboarding/sim-kv/overview');
}

async function seedWedding(userId) {
  if (!userId) {
    console.error('❌ Please provide your Supabase user ID');
    console.log('Usage: node scripts/link-sim-kv-admin.js seed <user_id>');
    console.log('\nTo get your user ID, check Supabase Dashboard > Authentication > Users');
    return;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error('❌ Invalid UUID format');
    console.log('Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    return;
  }

  // Check if wedding already exists
  const { data: existing } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', 'sim-kv')
    .single();

  if (existing) {
    console.log('⚠️  Wedding "sim-kv" already exists!');
    console.log('Use "update" command instead to change the owner.');
    return;
  }

  console.log('\n🌱 Creating sim-kv wedding with owner:', userId);

  // Insert the wedding record
  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .insert({
      slug: 'sim-kv',
      couple_name: 'Simran & Karanvir',
      partner1_name: 'Simran',
      partner2_name: 'Karanvir',
      wedding_date: '2026-01-04T00:00:00+00:00',
      wedding_date_display: '4-6 JANUARY, 2026',
      venue_name: 'The Palayana',
      venue_location: 'Hua Hin, Thailand',
      venue_flag: '🇹🇭',
      rsvp_deadline: 'August 16, 2025',
      status: 'live',
      couple_image_url: '/images/couple/couple-1.jpg',
      frame_image_url: '/images/frames/frame-27.png',
      background_image: '/images/backgrounds/pearl.webp',
      primary_color: '#DE3F5E',
      created_by: userId
    })
    .select()
    .single();

  if (weddingError) {
    console.error('❌ Error creating wedding:', weddingError.message);

    if (weddingError.message.includes('policy') || weddingError.code === '42501') {
      console.log('\n⚠️  RLS policy issue. Run this SQL in Supabase SQL Editor:');
      console.log('─'.repeat(70));
      console.log(`INSERT INTO weddings (
  slug, couple_name, partner1_name, partner2_name, wedding_date, wedding_date_display,
  venue_name, venue_location, venue_flag, rsvp_deadline, status,
  couple_image_url, frame_image_url, background_image, primary_color, created_by
) VALUES (
  'sim-kv', 'Simran & Karanvir', 'Simran', 'Karanvir', '2026-01-04T00:00:00+00:00',
  '4-6 JANUARY, 2026', 'The Palayana', 'Hua Hin, Thailand', '🇹🇭',
  'August 16, 2025', 'live', '/images/couple/couple-1.jpg',
  '/images/frames/frame-27.png', '/images/backgrounds/pearl.webp', '#DE3F5E',
  '${userId}'
);`);
      console.log('─'.repeat(70));
    }
    return;
  }

  console.log('✅ Wedding created successfully!');
  console.log('   Wedding ID:', wedding.id);

  // Now seed the wedding settings with PINs
  console.log('\n🔐 Creating wedding settings with PINs...');

  const { error: settingsError } = await supabase
    .from('wedding_settings')
    .insert({
      wedding_id: wedding.id,
      pin_codes: [
        { pin: '7834', type: 'family', allows_plus_one: true },
        { pin: '2591', type: 'friend', allows_plus_one: false },
        { pin: '9876', type: 'vip', allows_plus_one: true }
      ],
      whatsapp_group_link: null,
      lapse_event_codes: {},
      google_sheets_id: null
    });

  if (settingsError) {
    console.log('⚠️  Could not create settings:', settingsError.message);
    console.log('   You can add PINs later from the admin dashboard.');
  } else {
    console.log('✅ Settings created with PINs: 7834 (family), 2591 (friend), 9876 (vip)');
  }

  console.log('\n🎉 Setup complete! You can now:');
  console.log('  1. Navigate to http://localhost:3000/admin');
  console.log('  2. Sign in with your Gmail account');
  console.log('  3. You should be redirected to /admin/onboarding/sim-kv/overview');
  console.log('\n📝 Note: Events, schedule, FAQs etc. can be added from the onboarding dashboard.');
}

// Main execution
const command = process.argv[2];
const arg = process.argv[3];

if (!command || command === 'check') {
  checkWeddingState();
} else if (command === 'update') {
  updateWeddingOwner(arg);
} else if (command === 'seed') {
  seedWedding(arg);
} else if (command === 'list') {
  listAllWeddings();
} else {
  console.log('Usage:');
  console.log('  node scripts/link-sim-kv-admin.js check              - Check sim-kv state');
  console.log('  node scripts/link-sim-kv-admin.js list               - List all weddings');
  console.log('  node scripts/link-sim-kv-admin.js update <user_id>   - Update existing wedding owner');
  console.log('  node scripts/link-sim-kv-admin.js seed <user_id>     - Create wedding and link to user');
}

