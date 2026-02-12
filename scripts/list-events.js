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
  const { data: events } = await supabase
    .from('wedding_events')
    .select('id, name, slug, carousel_slides')
    .eq('wedding_id', wedding.id)
    .order('date', { ascending: true });

  events.forEach(e => {
    console.log(`${e.name} | slug: ${e.slug} | slides: ${e.carousel_slides?.length || 0}`);
  });
}
main();
