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
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', 'sim-kv')
    .single();

  console.log('\nSchedule Items (schedule_items table):');
  const { data: scheduleItems } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('date', { ascending: true });

  if (scheduleItems) {
    scheduleItems.forEach((item, i) => {
      console.log((i+1) + '. ' + item.name);
      console.log('   linked_event_id: ' + (item.linked_event_id || 'none'));
      console.log('   is_major_event: ' + item.is_major_event);
      console.log('');
    });
  }

  console.log('\nWedding Events (wedding_events table):');
  const { data: events } = await supabase
    .from('wedding_events')
    .select('id, name, slug')
    .eq('wedding_id', wedding.id);

  if (events) {
    events.forEach((e, i) => {
      console.log((i+1) + '. ' + e.name + ' (id: ' + e.id + ')');
    });
  }
}

check();
