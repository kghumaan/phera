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

// Slides 7 & 8 from the original welcome-lunch-haldi event
const MEHENDI_SLIDES = [
  {
    type: 'ritual',
    title: 'Why it Matters',
    heading: 'Mehendi',
    subtitle: 'The Ritual',
    description: 'Live henna artists weave intricate patterns on your hands and feet—an ancient symbol of luck, love, and festive camaraderie.',
  },
  {
    src: '/images/carousel/haldi/4.png',
    type: 'image',
  },
];

async function main() {
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', 'sim-kv')
    .single();

  if (!wedding) {
    console.error('Wedding not found');
    return;
  }

  // Check it doesn't already exist
  const { data: existing } = await supabase
    .from('wedding_events')
    .select('id, name')
    .eq('wedding_id', wedding.id)
    .eq('slug', 'mehendi-station')
    .single();

  if (existing) {
    console.log('Mehendi Station already exists:', existing.id);
    console.log('Updating slides...');
    const { error } = await supabase
      .from('wedding_events')
      .update({ carousel_slides: MEHENDI_SLIDES })
      .eq('id', existing.id);
    if (error) console.error('Error:', error.message);
    else console.log('Updated!');
    return;
  }

  // Create the event
  const { data, error } = await supabase
    .from('wedding_events')
    .insert({
      wedding_id: wedding.id,
      name: 'Mehendi Station',
      slug: 'mehendi-station',
      dress_code: 'Shades of Yellow',
      dress_code_icon: 'sunflower',
      dress_code_description: 'Bright, festive yellows! Think sunshine and turmeric.',
      date: 'January 4',
      time: '3:00 PM',
      gradient_background: 'GradientYellow.webp',
      text_color: '#000000',
      ritual_name: 'Mehendi',
      ritual_description: 'Live henna artists weave intricate patterns on your hands and feet—an ancient symbol of luck, love, and festive camaraderie.',
      carousel_slides: MEHENDI_SLIDES,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error.message);
  } else {
    console.log('Mehendi Station created! ID:', data.id);
    console.log('Slides:');
    MEHENDI_SLIDES.forEach((s, i) => {
      console.log(`  Slide ${i+1}: ${s.type}${s.heading ? ' - ' + s.heading : ''}${s.src ? ' - ' + s.src : ''}`);
    });
  }
}

main();
