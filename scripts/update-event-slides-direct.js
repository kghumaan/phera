#!/usr/bin/env node
/**
 * Update carousel slides for specific sim-kv events using service role key (bypasses RLS).
 * Usage: node scripts/update-event-slides-direct.js
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
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
}
loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey || supabaseKey === '...') {
  console.error('Service role key not set. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Shared dress code + outfit slides that apply to the Baraat/Varmala/Jaggo day
const BARAAT_DAY_SHARED_SLIDES = [
  {
    type: 'dress_code',
    title: 'Dress code',
    heading: 'Vibrant Indian Festive',
    subtitle: 'Dress code',
    description: 'Keep it bright, colorful, and breezy—opt for lightweight silks, cotton-silk blends, chiffon or georgette in jewel tones and bold prints.',
  },
  {
    src: '/images/carousel/jaggo/1.png',
    type: 'image',
  },
  {
    men: ['Kurta Sets', 'Patterned Vests', 'Bandhgalas'],
    type: 'outfit_ideas',
    title: 'Outfit Ideas',
    women: ['Anarkali', 'Lehenga', 'Salwar Kameez', 'Co-ord Sets'],
  },
  {
    src: '/images/carousel/jaggo/2.png',
    type: 'image',
  },
];

// Slides taken from the original welcome-lunch-haldi event (slides 1-6)
const HALDI_SLIDES = [
  {
    type: 'dress_code',
    title: 'Dress code',
    heading: 'Shades of yellow',
    subtitle: 'Dress code',
    description: "Sunlit hues of yellow \u2192 light linens, cotton kurtas, floaty dresses (you might get messy). And don't forget your sunglasses!",
  },
  {
    src: '/images/carousel/haldi/1.png',
    type: 'image',
  },
  {
    men: ['Linen Shirts', 'Cotton Kurtas'],
    type: 'outfit_ideas',
    title: 'Outfit Ideas',
    women: ['Kaftans', 'Salwar Kameez', 'Sundresses', 'Co-ord Sets'],
  },
  {
    src: '/images/carousel/haldi/2.png',
    type: 'image',
  },
  {
    type: 'ritual',
    title: 'What It Is',
    heading: 'Haldi',
    subtitle: 'The Ritual',
    description: 'A joyful ceremony where family and friends smear the couple with turmeric-paste - symbolizing purity, protection, and a radiant glow for the big day.',
  },
  {
    src: '/images/carousel/haldi/3.png',
    type: 'image',
  },
];

// Baraat: shared dress code/outfit slides + baraat-specific ritual (slides 1-6 from original)
const BARAAT_SLIDES = [
  ...BARAAT_DAY_SHARED_SLIDES,
  {
    type: 'ritual',
    title: 'What It Is',
    heading: 'Baraat',
    subtitle: 'The Vibe',
    description: "Groom's crew bursts in on drums and trumpets, dancing him straight into the venue\u2014an electrifying welcome that kicks off the celebration.",
  },
  {
    src: '/images/carousel/jaggo/3.png',
    type: 'image',
  },
];

// Varmala & Vows: shared dress code/outfit slides + varmala-specific ritual (slides 7-8 from original)
const VARMALA_SLIDES = [
  ...BARAAT_DAY_SHARED_SLIDES,
  {
    type: 'ritual',
    title: 'What It Is',
    heading: 'Varmala & Vows',
    subtitle: 'The Moment',
    description: 'On the mandap, the couple swaps floral garlands and shares personal vows\u2014an equal, heartfelt promise in one picture-perfect instant.',
  },
  {
    src: '/images/carousel/jaggo/4.png',
    type: 'image',
  },
];

// Dinner and Jaggo: shared dress code/outfit slides + jaggo-specific ritual (slides 9-10 from original)
const JAGGO_SLIDES = [
  ...BARAAT_DAY_SHARED_SLIDES,
  {
    type: 'ritual',
    title: 'Music & Dance',
    heading: 'Jaggo',
    subtitle: 'The Ritual',
    description: 'After dinner, the night ignites into a Punjabi "wake-up" party\u2014guests circle the dance floor to pounding dhol and swirling dupattas, celebrating under lantern-lit trees.',
  },
  {
    src: '/images/carousel/jaggo/5.png',
    type: 'image',
  },
];

const UPDATES = [
  { slug: 'haldi',        slides: HALDI_SLIDES   },
  { slug: 'baraat',       slides: BARAAT_SLIDES  },
  { slug: 'varmala-vows', slides: VARMALA_SLIDES },
  { slug: 'dinner-jaggo', slides: JAGGO_SLIDES   },
];

async function updateSlides() {
  console.log('Updating event carousel slides...\n');

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', 'sim-kv')
    .single();

  if (!wedding) {
    console.error('Wedding not found');
    return;
  }

  const slugArg = process.argv[2]; // optional: only update specific slug

  for (const update of UPDATES) {
    if (slugArg && update.slug !== slugArg) continue;

    const { data: event } = await supabase
      .from('wedding_events')
      .select('id, name')
      .eq('wedding_id', wedding.id)
      .eq('slug', update.slug)
      .single();

    if (!event) {
      console.log(`Event not found: ${update.slug}`);
      continue;
    }

    console.log(`Updating ${event.name} with ${update.slides.length} slides...`);

    const { error } = await supabase
      .from('wedding_events')
      .update({ carousel_slides: update.slides })
      .eq('id', event.id);

    if (error) {
      console.error(`  Error: ${error.message}`);
    } else {
      update.slides.forEach((s, i) => {
        console.log(`  Slide ${i+1}: ${s.type}${s.heading ? ' - ' + s.heading : ''}${s.src ? ' - ' + s.src : ''}`);
      });
      console.log('  Done!\n');
    }
  }
}

updateSlides();
