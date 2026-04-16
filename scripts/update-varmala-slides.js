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

// Slides in order: 7, 8, 1, 2, 3, 4 from baraat-varmala-jaggo
const VARMALA_SLIDES = [
  // Slide 7
  {
    type: 'ritual',
    title: 'What It Is',
    heading: 'Varmala & Vows',
    subtitle: 'The Moment',
    description: 'On the mandap, the couple swaps floral garlands and shares personal vows\u2014an equal, heartfelt promise in one picture-perfect instant.',
  },
  // Slide 8
  {
    src: '/images/carousel/jaggo/4.png',
    type: 'image',
  },
  // Slide 1
  {
    type: 'dress_code',
    title: 'Dress code',
    heading: 'Vibrant Indian Festive',
    subtitle: 'Dress code',
    description: 'Keep it bright, colorful, and breezy\u2014opt for lightweight silks, cotton-silk blends, chiffon or georgette in jewel tones and bold prints.',
  },
  // Slide 2
  {
    src: '/images/carousel/jaggo/1.png',
    type: 'image',
  },
  // Slide 3
  {
    men: ['Kurta Sets', 'Patterned Vests', 'Bandhgalas'],
    type: 'outfit_ideas',
    title: 'Outfit Ideas',
    women: ['Anarkali', 'Lehenga', 'Salwar Kameez', 'Co-ord Sets'],
  },
  // Slide 4
  {
    src: '/images/carousel/jaggo/2.png',
    type: 'image',
  },
];

async function main() {
  const { data: wedding } = await supabase.from('weddings').select('id').eq('slug', 'sim-kv').single();

  const { data: event } = await supabase
    .from('wedding_events')
    .select('id, name')
    .eq('wedding_id', wedding.id)
    .eq('slug', 'varmala-vows')
    .single();

  if (!event) {
    console.error('Varmala & Vows event not found');
    return;
  }

  console.log(`Updating ${event.name} with ${VARMALA_SLIDES.length} slides (order: 7, 8, 1, 2, 3, 4)...`);

  const { error } = await supabase
    .from('wedding_events')
    .update({ carousel_slides: VARMALA_SLIDES })
    .eq('id', event.id);

  if (error) {
    console.error('Error:', error.message);
  } else {
    VARMALA_SLIDES.forEach((s, i) => {
      console.log(`  Slide ${i+1}: ${s.type}${s.heading ? ' - ' + s.heading : ''}${s.src ? ' - ' + s.src : ''}`);
    });
    console.log('Done!');
  }
}

main();
