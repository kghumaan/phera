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

  const { data: schedule } = await supabase
    .from('wedding_schedule')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('order_index', { ascending: true });

  console.log('\n=== Wedding Schedule with Events ===\n');

  if (schedule) {
    schedule.forEach(day => {
      console.log(`DAY: ${day.day_name} - ${day.date}`);
      console.log('-'.repeat(50));

      if (day.events && Array.isArray(day.events)) {
        day.events.forEach((e, i) => {
          console.log(`  ${i+1}. ${e.name}`);
          console.log(`     Time: ${e.time || 'N/A'}`);
          console.log(`     Location: ${e.location || 'N/A'}`);
          console.log(`     is_major_event: ${e.is_major_event || false}`);
          console.log(`     linked_event_id: ${e.linked_event_id || 'none'}`);
          console.log(`     gradient_background: ${e.gradient_background || 'none'}`);
          console.log('');
        });
      } else {
        console.log('  (no events)');
      }
      console.log('');
    });
  }
}

check();
