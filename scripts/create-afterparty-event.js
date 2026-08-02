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

  // Fetch all 6 slides from the reception event
  const { data: receptionEvent } = await supabase
    .from('wedding_events')
    .select('carousel_slides, gradient_background, text_color')
    .eq('wedding_id', wedding.id)
    .eq('slug', 'reception')
    .single();

  if (!receptionEvent) {
    console.error('Reception event not found');
    return;
  }

  const slides = receptionEvent.carousel_slides;
  console.log(`Copying ${slides.length} slides from reception...`);
  slides.forEach((s, i) => console.log(`  Slide ${i+1}: ${s.type}${s.heading ? ' - ' + s.heading : ''}${s.src ? ' - ' + s.src : ''}`));

  // Create Afterparty event
  const { data, error } = await supabase
    .from('wedding_events')
    .insert({
      wedding_id: wedding.id,
      name: 'Afterparty',
      slug: 'afterparty',
      dress_code: 'Cocktail Glam',
      dress_code_icon: 'sparkles',
      dress_code_description: 'Dress to impress—think sharp suits, elegant gowns, or chic lehengas and sherwanis in jewel tones and standout embellishments.',
      date: 'January 5',
      time: '12:00 AM',
      gradient_background: receptionEvent.gradient_background,
      text_color: receptionEvent.text_color,
      carousel_slides: slides,
    })
    .select()
    .single();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('\nAfterparty event created! ID:', data.id);
    console.log('Slides:', data.carousel_slides?.length || 0);
  }
}

main();
