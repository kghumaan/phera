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

const slugArg = process.argv[2];

async function getSlides() {
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', 'sim-kv')
    .single();

  let query = supabase
    .from('wedding_events')
    .select('name, slug, carousel_slides')
    .eq('wedding_id', wedding.id);

  if (slugArg) {
    query = query.eq('slug', slugArg);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  events.forEach(event => {
    console.log('=====', event.name, '(', event.slug, ') =====');
    if (event.carousel_slides && event.carousel_slides.length > 0) {
      event.carousel_slides.forEach((slide, i) => {
        console.log('\nSlide', i + 1, '-', slide.type);
        console.log(JSON.stringify(slide, null, 2));
      });
    } else {
      console.log('(no slides)');
    }
    console.log('');
  });
}

getSlides();
