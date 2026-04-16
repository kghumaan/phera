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

// Slides in order: 9, 10, 1, 2, 3, 4 from baraat-varmala-jaggo
const JAGGO_SLIDES = [
  // Slide 9
  {
    type: 'ritual',
    title: 'Music & Dance',
    heading: 'Jaggo',
    subtitle: 'The Ritual',
    description: 'After dinner, the night ignites into a Punjabi \u201cwake-up\u201d party\u2014guests circle the dance floor to pounding dhol and swirling dupattas, celebrating under lantern-lit trees.',
  },
  // Slide 10
  {
    src: '/images/carousel/jaggo/5.png',
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
    .eq('slug', 'dinner-jaggo')
    .single();

  if (!event) {
    console.error('Dinner and Jaggo event not found');
    return;
  }

  console.log(`Updating ${event.name} with ${JAGGO_SLIDES.length} slides (order: 9, 10, 1, 2, 3, 4)...`);

  const { error } = await supabase
    .from('wedding_events')
    .update({ carousel_slides: JAGGO_SLIDES })
    .eq('id', event.id);

  if (error) {
    console.error('Error:', error.message);
  } else {
    JAGGO_SLIDES.forEach((s, i) => {
      console.log(`  Slide ${i+1}: ${s.type}${s.heading ? ' - ' + s.heading : ''}${s.src ? ' - ' + s.src : ''}`);
    });
    console.log('Done!');
  }
}

main();
