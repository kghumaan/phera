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
  const { data: event } = await supabase
    .from('wedding_events')
    .select('name, carousel_slides')
    .eq('wedding_id', wedding.id)
    .eq('slug', 'reception')
    .single();

  console.log('Total slides in DB:', event.carousel_slides.length);
  event.carousel_slides.forEach((s, i) => {
    console.log('\nSlide', i + 1, '-', s.type);
    console.log(JSON.stringify(s, null, 2));
  });
}
main();
