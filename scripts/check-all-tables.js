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

  console.log('Wedding ID:', wedding.id);

  console.log('\n=== schedule_items table ===');
  const { data: scheduleItems, error: siError } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('wedding_id', wedding.id);
  console.log('Count:', scheduleItems?.length || 0);
  if (siError) console.log('Error:', siError.message);
  if (scheduleItems && scheduleItems.length > 0) {
    scheduleItems.forEach(item => console.log('  -', item.name, '(linked:', item.linked_event_id || 'none', ')'));
  }

  console.log('\n=== wedding_schedule table ===');
  const { data: weddingSchedule, error: wsError } = await supabase
    .from('wedding_schedule')
    .select('*')
    .eq('wedding_id', wedding.id);
  console.log('Count:', weddingSchedule?.length || 0);
  if (wsError) console.log('Error:', wsError.message);
  if (weddingSchedule && weddingSchedule.length > 0) {
    weddingSchedule.forEach(day => {
      console.log('  Day:', day.day_name, '-', day.date);
      if (day.events && Array.isArray(day.events)) {
        day.events.forEach(e => console.log('    -', e.name || e.time));
      }
    });
  }

  console.log('\n=== wedding_events table ===');
  const { data: events } = await supabase
    .from('wedding_events')
    .select('id, name, slug, carousel_slides')
    .eq('wedding_id', wedding.id);
  console.log('Count:', events?.length || 0);
  if (events) {
    events.forEach(e => {
      const slideCount = e.carousel_slides?.length || 0;
      console.log('  -', e.name, '| slug:', e.slug, '| slides:', slideCount);
    });
  }
}

check();
