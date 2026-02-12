#!/usr/bin/env node
/**
 * Script to split combined sim-kv wedding events into separate events with carousel slides.
 *
 * This will:
 * 1. Create separate "Haldi" event from "Welcome Lunch & Haldi"
 * 2. Create "Baraat" event from "Baraat, Varmala, & Jaggo"
 * 3. Create "Varmala & Vows" event from "Baraat, Varmala, & Jaggo"
 * 4. Create "Dinner and Jaggo" event from "Baraat, Varmala, & Jaggo"
 *
 * Usage:
 *   node scripts/split-sim-kv-events.js check   - Check current state
 *   node scripts/split-sim-kv-events.js create  - Create the new separate events
 */

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

// Define the new events to create with their carousel slides
const NEW_EVENTS = [
  {
    name: 'Haldi',
    slug: 'haldi',
    dress_code: 'Shades of Yellow',
    dress_code_icon: 'sunflower',
    dress_code_description: 'Bright, festive yellows! Think sunshine and turmeric.',
    date: 'January 4',
    time: '2:00 PM',
    gradient_background: 'GradientYellow.png',
    text_color: '#000000',
    ritual_name: 'The Haldi Ceremony',
    ritual_description: 'A turmeric paste is applied to the bride and groom for blessings and radiant skin. Prepare to get messy and have fun!',
    outfit_ideas_women: ['Yellow Anarkali', 'Lehenga in gold tones', 'Yellow Saree', 'Kurti with palazzo'],
    outfit_ideas_men: ['Yellow Kurta with white pajama', 'Yellow Nehru jacket', 'Casual yellow shirt'],
    carousel_slides: [
      {
        type: 'three_lines',
        top_label: 'THE CEREMONY',
        main_heading: 'Haldi',
        body_text: 'A turmeric paste is applied to the bride and groom for blessings and radiant skin. Prepare to get messy and have fun!',
      },
      {
        type: 'two_sections',
        section1_header: 'WOMEN',
        section1_items: ['Yellow Anarkali', 'Lehenga in gold tones', 'Yellow Saree', 'Kurti with palazzo'],
        section2_header: 'MEN',
        section2_items: ['Yellow Kurta with white pajama', 'Yellow Nehru jacket', 'Casual yellow shirt'],
      },
    ],
  },
  {
    name: 'Baraat',
    slug: 'baraat',
    dress_code: 'Festive & Bold',
    dress_code_icon: 'trumpet',
    dress_code_description: 'Vibrant colors and festive wear for the groom\'s procession! Think celebration mode.',
    date: 'January 4',
    time: '4:00 PM',
    gradient_background: 'GradientJaggo.png',
    text_color: '#FFFFFF',
    ritual_name: 'The Baraat',
    ritual_description: 'The groom arrives in style with his family and friends dancing to dhol beats. A spectacular, energetic entrance!',
    outfit_ideas_women: ['Colorful Lehenga Choli', 'Embellished Anarkali', 'Designer Saree', 'Sharara or Gharara set'],
    outfit_ideas_men: ['Sherwani with churidar', 'Bandhgala suit', 'Embroidered Kurta', 'Nehru jacket with trousers'],
    carousel_slides: [
      {
        type: 'three_lines',
        top_label: 'THE CELEBRATION',
        main_heading: 'The Baraat',
        body_text: 'The groom arrives in style with his family and friends dancing to dhol beats. A spectacular, energetic entrance to kick off the wedding day!',
      },
      {
        type: 'two_sections',
        section1_header: 'WOMEN',
        section1_items: ['Colorful Lehenga Choli', 'Embellished Anarkali', 'Designer Saree', 'Sharara or Gharara set'],
        section2_header: 'MEN',
        section2_items: ['Sherwani with churidar', 'Bandhgala suit', 'Embroidered Kurta', 'Nehru jacket with trousers'],
      },
    ],
  },
  {
    name: 'Varmala & Vows',
    slug: 'varmala-vows',
    dress_code: 'Traditional Elegance',
    dress_code_icon: 'bouquet',
    dress_code_description: 'Elegant traditional wear for the sacred garland exchange ceremony.',
    date: 'January 4',
    time: '5:00 PM',
    gradient_background: 'pearl.png',
    text_color: '#000000',
    ritual_name: 'The Varmala',
    ritual_description: 'The bride and groom exchange flower garlands, symbolizing their acceptance of each other as life partners.',
    outfit_ideas_women: ['Traditional Lehenga or Saree', 'Elegant Salwar Kameez', 'Pastel Anarkali', 'Designer Sharara'],
    outfit_ideas_men: ['Traditional Sherwani', 'Kurta Pajama with jacket', 'Bandhgala in elegant colors', 'Achkan with churidar'],
    carousel_slides: [
      {
        type: 'three_lines',
        top_label: 'THE CEREMONY',
        main_heading: 'Varmala & Vows',
        body_text: 'The bride and groom exchange flower garlands, symbolizing their acceptance of each other as life partners. A beautiful and meaningful moment!',
      },
      {
        type: 'two_sections',
        section1_header: 'WOMEN',
        section1_items: ['Traditional Lehenga or Saree', 'Elegant Salwar Kameez', 'Pastel Anarkali', 'Designer Sharara'],
        section2_header: 'MEN',
        section2_items: ['Traditional Sherwani', 'Kurta Pajama with jacket', 'Bandhgala in elegant colors', 'Achkan with churidar'],
      },
    ],
  },
  {
    name: 'Dinner and Jaggo',
    slug: 'dinner-jaggo',
    dress_code: 'Vibrant & Festive',
    dress_code_icon: 'party-popper',
    dress_code_description: 'Bold colors, sequins, and celebration mode! The night before the wedding calls for your most festive attire.',
    date: 'January 4',
    time: '8:00 PM',
    gradient_background: 'GradientJaggo.png',
    text_color: '#FFFFFF',
    ritual_name: 'The Jaggo',
    ritual_description: 'An energetic night celebration! Family and friends sing, dance, and parade with decorated pots and lights.',
    outfit_ideas_women: ['Colorful Lehenga Choli', 'Embellished Anarkali', 'Sharara or Gharara set', 'Designer Saree'],
    outfit_ideas_men: ['Sherwani with churidar', 'Bandhgala suit', 'Embroidered Kurta with dhoti', 'Nehru jacket with trousers'],
    carousel_slides: [
      {
        type: 'three_lines',
        top_label: 'THE CELEBRATION',
        main_heading: 'Dinner & Jaggo',
        body_text: 'Enjoy a delicious dinner followed by the energetic Jaggo celebration! Family and friends sing, dance, and parade with decorated pots and lights.',
      },
      {
        type: 'two_sections',
        section1_header: 'WOMEN',
        section1_items: ['Colorful Lehenga Choli', 'Embellished Anarkali', 'Sharara or Gharara set', 'Designer Saree'],
        section2_header: 'MEN',
        section2_items: ['Sherwani with churidar', 'Bandhgala suit', 'Embroidered Kurta with dhoti', 'Nehru jacket with trousers'],
      },
    ],
  },
];

async function checkEvents() {
  console.log('\n=== Current wedding_events for sim-kv ===\n');

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', 'sim-kv')
    .single();

  if (!wedding) {
    console.error('Wedding not found');
    return;
  }

  const { data: events } = await supabase
    .from('wedding_events')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('date', { ascending: true });

  if (events) {
    events.forEach((e, i) => {
      const slideCount = e.carousel_slides?.length || 0;
      console.log(`${i+1}. ${e.name}`);
      console.log(`   Slug: ${e.slug}`);
      console.log(`   Date: ${e.date}`);
      console.log(`   Time: ${e.time}`);
      console.log(`   Gradient: ${e.gradient_background || 'none'}`);
      console.log(`   Slides: ${slideCount}`);
      console.log('');
    });
  }

  console.log('\n=== Events to be created ===\n');
  NEW_EVENTS.forEach((e, i) => {
    const exists = events?.find(
      existing =>
        existing.slug === e.slug ||
        existing.name.toLowerCase() === e.name.toLowerCase()
    );
    const status = exists ? '(already exists - will skip)' : '(will create)';
    console.log(`${i+1}. ${e.name} ${status}`);
    console.log(`   Slug: ${e.slug}`);
    console.log(`   Slides: ${e.carousel_slides.length}`);
    console.log('');
  });
}

async function createEvents() {
  console.log('\n=== Creating separate events for sim-kv ===\n');

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', 'sim-kv')
    .single();

  if (!wedding) {
    console.error('Wedding not found');
    return;
  }

  // Get existing events to check for duplicates
  const { data: existingEvents } = await supabase
    .from('wedding_events')
    .select('name, slug')
    .eq('wedding_id', wedding.id);

  let created = 0;
  let skipped = 0;

  for (const eventData of NEW_EVENTS) {
    // Check if already exists
    const exists = existingEvents?.find(
      e =>
        e.slug === eventData.slug ||
        e.name.toLowerCase() === eventData.name.toLowerCase()
    );

    if (exists) {
      console.log(`Skipping ${eventData.name} - already exists`);
      skipped++;
      continue;
    }

    console.log(`Creating ${eventData.name}...`);

    const { data, error } = await supabase
      .from('wedding_events')
      .insert({
        wedding_id: wedding.id,
        name: eventData.name,
        slug: eventData.slug,
        dress_code: eventData.dress_code,
        dress_code_icon: eventData.dress_code_icon,
        dress_code_description: eventData.dress_code_description,
        date: eventData.date,
        time: eventData.time,
        gradient_background: eventData.gradient_background,
        text_color: eventData.text_color,
        ritual_name: eventData.ritual_name,
        ritual_description: eventData.ritual_description,
        outfit_ideas_women: eventData.outfit_ideas_women,
        outfit_ideas_men: eventData.outfit_ideas_men,
        carousel_slides: eventData.carousel_slides,
      })
      .select()
      .single();

    if (error) {
      console.error(`  Error: ${error.message}`);
    } else {
      console.log(`  Created successfully! ID: ${data.id}`);
      created++;
    }
  }

  console.log(`\n=== Done! Created ${created}, Skipped ${skipped} ===`);

  // Now list all events
  console.log('\n=== All events after creation ===\n');
  const { data: allEvents } = await supabase
    .from('wedding_events')
    .select('name, slug, carousel_slides')
    .eq('wedding_id', wedding.id)
    .order('date', { ascending: true });

  if (allEvents) {
    allEvents.forEach((e, i) => {
      console.log(`${i+1}. ${e.name} (${e.slug}) - ${e.carousel_slides?.length || 0} slides`);
    });
  }
}

// Main execution
const command = process.argv[2];

if (!command || command === 'check') {
  checkEvents();
} else if (command === 'create') {
  createEvents();
} else {
  console.log('Usage:');
  console.log('  node scripts/split-sim-kv-events.js check   - Check current state');
  console.log('  node scripts/split-sim-kv-events.js create  - Create the new separate events');
}
