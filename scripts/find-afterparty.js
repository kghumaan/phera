#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
}
loadEnvFile();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: wedding } = await supabase.from('weddings').select('id').eq('slug', 'sim-kv').single();

  // Check wedding_schedule days for afterparty in events array
  const { data: schedule } = await supabase
    .from('wedding_schedule')
    .select('*')
    .eq('wedding_id', wedding.id);

  console.log('=== wedding_schedule events ===');
  schedule?.forEach(day => {
    console.log('\nDay:', day.day_name);
    if (day.events && Array.isArray(day.events) && day.events.length > 0) {
      day.events.forEach((e, i) => console.log(`  ${i+1}. ${e.name} | linked_event_id: ${e.linked_event_id || 'none'}`));
    } else {
      console.log('  (empty)');
    }
  });

  // Also check schedule_items if that table exists with a different structure
  const { data: items, error } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('wedding_id', wedding.id);

  if (!error) {
    console.log('\n=== schedule_items ===');
    items?.forEach(i => console.log(`  ${i.name} | linked_event_id: ${i.linked_event_id || 'none'}`));
  }
}
main();
