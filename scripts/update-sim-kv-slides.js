#!/usr/bin/env node
/**
 * Script to update carousel slides for sim-kv wedding events.
 *
 * Usage:
 *   node scripts/update-sim-kv-slides.js check    - Check current events and slides
 *   node scripts/update-sim-kv-slides.js update   - Update missing carousel slides
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.local manually
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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define slides for each event type
const EVENT_SLIDES = {
  'haldi': [
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
  'baraat': [
    {
      type: 'three_lines',
      top_label: 'THE CELEBRATION',
      main_heading: 'The Baraat',
      body_text: 'The groom arrives on horseback (or in style!) with his family and friends dancing to dhol beats. A spectacular, energetic entrance!',
    },
    {
      type: 'two_sections',
      section1_header: 'WOMEN',
      section1_items: ['Colorful Lehenga Choli', 'Embellished Anarkali', 'Designer Saree', 'Sharara or Gharara set'],
      section2_header: 'MEN',
      section2_items: ['Sherwani with churidar', 'Bandhgala suit', 'Embroidered Kurta', 'Nehru jacket with trousers'],
    },
  ],
  'varmala': [
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
  'jaggo': [
    {
      type: 'three_lines',
      top_label: 'THE CELEBRATION',
      main_heading: 'Dinner & Jaggo',
      body_text: 'An energetic night celebration! Family and friends sing, dance, and parade through the streets with decorated pots and lights after a delicious dinner.',
    },
    {
      type: 'two_sections',
      section1_header: 'WOMEN',
      section1_items: ['Colorful Lehenga Choli', 'Embellished Anarkali', 'Sharara or Gharara set', 'Designer Saree'],
      section2_header: 'MEN',
      section2_items: ['Sherwani with churidar', 'Bandhgala suit', 'Embroidered Kurta with dhoti', 'Nehru jacket with trousers'],
    },
  ],
  'anand-karaj': [
    {
      type: 'three_lines',
      top_label: 'THE CEREMONY',
      main_heading: 'Anand Karaj',
      body_text: 'The Sikh wedding ceremony where the couple circles the Guru Granth Sahib four times, symbolizing their union.',
    },
    {
      type: 'two_sections',
      section1_header: 'WOMEN',
      section1_items: ['Pastel Lehenga or Saree', 'Traditional Salwar Kameez', 'Light-colored Anarkali', 'Soft pink or peach outfits'],
      section2_header: 'MEN',
      section2_items: ['Traditional Kurta Pajama', 'Light-colored Sherwani', 'Nehru jacket in pastels', 'Bandhgala in cream/beige'],
    },
  ],
  'pool-party': [
    {
      type: 'three_lines',
      top_label: 'THE CELEBRATION',
      main_heading: 'Pool Party',
      body_text: 'Relax, swim, and celebrate by the pool with music, drinks, and good vibes!',
    },
    {
      type: 'two_sections',
      section1_header: 'WOMEN',
      section1_items: ['Swimsuit with cover-up', 'Maxi dress or beach dress', 'Kaftan or resort wear', 'Flowy palazzo with tank'],
      section2_header: 'MEN',
      section2_items: ['Swim shorts', 'Linen shirt (unbuttoned or casual)', 'Beach shorts with tee', 'Hawaiian shirt'],
    },
  ],
  'sangeet': [
    {
      type: 'three_lines',
      top_label: 'THE CELEBRATION',
      main_heading: 'Sangeet & Reception',
      body_text: 'Evening kicks off with a high-energy Sangeet of choreographed dances, then flows into a formal Reception of dinner, toasts, and first dances.',
    },
    {
      type: 'two_sections',
      section1_header: 'WOMEN',
      section1_items: ['Evening Gowns', 'Embellished Sarees', 'Fusion Co-Ord Sets', 'Cocktail Lehengas'],
      section2_header: 'MEN',
      section2_items: ['Tuxedos & Dinner Suits', 'Tailored Sherwanis', 'Patterned Nehru Jackets'],
    },
  ],
  'reception': [
    {
      type: 'three_lines',
      top_label: 'THE CELEBRATION',
      main_heading: 'Sangeet & Reception',
      body_text: 'Evening kicks off with a high-energy Sangeet of choreographed dances, then flows into a formal Reception of dinner, toasts, and first dances.',
    },
    {
      type: 'two_sections',
      section1_header: 'WOMEN',
      section1_items: ['Evening Gowns', 'Embellished Sarees', 'Fusion Co-Ord Sets', 'Cocktail Lehengas'],
      section2_header: 'MEN',
      section2_items: ['Tuxedos & Dinner Suits', 'Tailored Sherwanis', 'Patterned Nehru Jackets'],
    },
  ],
};

// Gradient backgrounds for events
const EVENT_GRADIENTS = {
  'haldi': 'GradientYellow.png',
  'baraat': 'GradientJaggo.png',
  'varmala': 'pearl.png',
  'jaggo': 'GradientJaggo.png',
  'anand-karaj': 'pearl.png',
  'pool-party': 'GradientPoolParty.png',
  'sangeet': 'GradientReception.png',
  'reception': 'GradientReception.png',
};

// Match event names to slide keys with fuzzy matching
function getSlideKeyForEvent(eventName) {
  const name = eventName.toLowerCase().trim();

  // Direct matches
  if (name.includes('haldi')) return 'haldi';
  if (name.includes('baraat')) return 'baraat';
  if (name.includes('varmala') || name.includes('vows')) return 'varmala';
  if (name.includes('jaggo') || name.includes('dinner')) return 'jaggo';
  if (name.includes('anand karaj') || name.includes('anand-karaj')) return 'anand-karaj';
  if (name.includes('pool') && name.includes('party')) return 'pool-party';
  if (name.includes('sangeet')) return 'sangeet';
  if (name.includes('reception')) return 'reception';

  // Try slug-based matching
  const slug = name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (EVENT_SLIDES[slug]) return slug;

  return null;
}

async function checkEvents() {
  console.log('\n Checking sim-kv wedding events...\n');

  // Get wedding
  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', 'sim-kv')
    .single();

  if (weddingError || !wedding) {
    console.error('Wedding not found');
    return;
  }

  // Get events
  const { data: events, error: eventsError } = await supabase
    .from('wedding_events')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('date', { ascending: true });

  if (eventsError) {
    console.error('Error fetching events:', eventsError.message);
    return;
  }

  console.log(`Found ${events.length} events:\n`);

  events.forEach((event, i) => {
    const slideKey = getSlideKeyForEvent(event.name);
    const hasSlides = event.carousel_slides && event.carousel_slides.length > 0;
    const slideCount = hasSlides ? event.carousel_slides.length : 0;
    const matchedTemplate = slideKey ? `(matches: ${slideKey})` : '(no template match)';

    console.log(`${i + 1}. ${event.name}`);
    console.log(`   Slug: ${event.slug}`);
    console.log(`   Gradient: ${event.gradient_background || '(none)'}`);
    console.log(`   Slides: ${slideCount} ${matchedTemplate}`);
    console.log(`   Status: ${hasSlides ? 'Has slides' : 'NEEDS SLIDES'}`);
    console.log('');
  });

  // Summary
  const needsSlides = events.filter(e => !e.carousel_slides || e.carousel_slides.length === 0);
  if (needsSlides.length > 0) {
    console.log(`\n Events needing slides: ${needsSlides.length}`);
    needsSlides.forEach(e => console.log(`   - ${e.name}`));
    console.log('\nRun "node scripts/update-sim-kv-slides.js update" to add slides.');
  } else {
    console.log('\n All events have carousel slides!');
  }
}

async function updateEvents() {
  console.log('\n Updating sim-kv wedding event slides...\n');

  // Get wedding
  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', 'sim-kv')
    .single();

  if (weddingError || !wedding) {
    console.error('Wedding not found');
    return;
  }

  // Get events
  const { data: events, error: eventsError } = await supabase
    .from('wedding_events')
    .select('*')
    .eq('wedding_id', wedding.id);

  if (eventsError) {
    console.error('Error fetching events:', eventsError.message);
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const event of events) {
    const slideKey = getSlideKeyForEvent(event.name);

    if (!slideKey) {
      console.log(`Skipping ${event.name} - no template match found`);
      skipped++;
      continue;
    }

    const slides = EVENT_SLIDES[slideKey];
    const gradient = EVENT_GRADIENTS[slideKey];

    if (!slides) {
      console.log(`Skipping ${event.name} - no slides template for key: ${slideKey}`);
      skipped++;
      continue;
    }

    // Check if event already has slides
    const hasSlides = event.carousel_slides && event.carousel_slides.length > 0;

    console.log(`Updating ${event.name}...`);
    console.log(`   Using template: ${slideKey}`);
    console.log(`   Slides: ${slides.length}`);
    console.log(`   Gradient: ${gradient}`);
    console.log(`   Status: ${hasSlides ? 'Replacing existing slides' : 'Adding new slides'}`);

    const { error: updateError } = await supabase
      .from('wedding_events')
      .update({
        carousel_slides: slides,
        gradient_background: gradient,
        text_color: '#000000',
      })
      .eq('id', event.id);

    if (updateError) {
      console.error(`   Error updating: ${updateError.message}`);
    } else {
      console.log(`   Updated successfully!`);
      updated++;
    }
    console.log('');
  }

  console.log(`\n Done! Updated ${updated} events, skipped ${skipped}.`);
}

// Main execution
const command = process.argv[2];

if (!command || command === 'check') {
  checkEvents();
} else if (command === 'update') {
  updateEvents();
} else {
  console.log('Usage:');
  console.log('  node scripts/update-sim-kv-slides.js check   - Check current events and slides');
  console.log('  node scripts/update-sim-kv-slides.js update  - Update missing carousel slides');
}
