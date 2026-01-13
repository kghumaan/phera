-- Seed Wedding Events with Carousel Data for sim-kv Wedding
-- This migration populates the wedding_events table with complete carousel content
-- including slides, images, dress codes, and cultural explanations

-- Get the wedding_id for sim-kv
DO $$
DECLARE
  v_wedding_id UUID;
BEGIN
  -- Get the wedding ID for sim-kv
  SELECT id INTO v_wedding_id FROM weddings WHERE slug = 'sim-kv';

  IF v_wedding_id IS NULL THEN
    RAISE EXCEPTION 'Wedding with slug sim-kv not found. Please ensure the wedding exists first.';
  END IF;

  -- Delete existing events for this wedding (if any) to allow re-running this script
  DELETE FROM wedding_events WHERE wedding_id = v_wedding_id;

  -- ============================================================================
  -- EVENT 1: Welcome Lunch & Haldi
  -- ============================================================================
  INSERT INTO wedding_events (
    wedding_id,
    name,
    slug,
    date,
    time,
    dress_code,
    dress_code_emoji,
    dress_code_description,
    outfit_ideas_women,
    outfit_ideas_men,
    ritual_name,
    ritual_description,
    carousel_images,
    gradient_background,
    text_color,
    carousel_slides,
    order_index,
    is_template
  ) VALUES (
    v_wedding_id,
    'Welcome Lunch & Haldi',
    'welcome-lunch-haldi',
    'January 4',
    '12 PM',
    'Shades of Yellow',
    '🌻',
    'Sunlit hues of yellow → light linens, cotton kurtas, floaty dresses (you might get messy). And don''t forget your sunglasses!',
    '["Kaftans", "Salwar Kameez", "Sundresses", "Co-ord Sets"]'::jsonb,
    '["Linen Shirts", "Cotton Kurtas"]'::jsonb,
    'Haldi & Mehendi',
    'A joyful ceremony where family and friends smear the couple with turmeric-paste - symbolizing purity, protection, and a radiant glow for the big day. Live henna artists weave intricate patterns on your hands and feet—an ancient symbol of luck, love, and festive camaraderie.',
    '["/images/carousel/haldi/1.png", "/images/carousel/haldi/2.png", "/images/carousel/haldi/3.png", "/images/carousel/haldi/4.png"]'::jsonb,
    'GradientYellow.png',
    '#141414',
    '[
      {
        "type": "dress_code",
        "title": "Dress code",
        "subtitle": "Dress code",
        "heading": "Shades of yellow",
        "description": "Sunlit hues of yellow → light linens, cotton kurtas, floaty dresses (you might get messy). And don''t forget your sunglasses!"
      },
      {
        "type": "image",
        "src": "/images/carousel/haldi/1.png"
      },
      {
        "type": "outfit_ideas",
        "title": "Outfit Ideas",
        "women": ["Kaftans", "Salwar Kameez", "Sundresses", "Co-ord Sets"],
        "men": ["Linen Shirts", "Cotton Kurtas"]
      },
      {
        "type": "image",
        "src": "/images/carousel/haldi/2.png"
      },
      {
        "type": "ritual",
        "title": "What It Is",
        "subtitle": "The Ritual",
        "heading": "Haldi",
        "description": "A joyful ceremony where family and friends smear the couple with turmeric-paste - symbolizing purity, protection, and a radiant glow for the big day."
      },
      {
        "type": "image",
        "src": "/images/carousel/haldi/3.png"
      },
      {
        "type": "ritual",
        "title": "Why it Matters",
        "subtitle": "The Ritual",
        "heading": "Mehendi",
        "description": "Live henna artists weave intricate patterns on your hands and feet—an ancient symbol of luck, love, and festive camaraderie."
      },
      {
        "type": "image",
        "src": "/images/carousel/haldi/4.png"
      }
    ]'::jsonb,
    1,
    false
  );

  -- ============================================================================
  -- EVENT 2: Baraat, Varmala, & Jaggo
  -- ============================================================================
  INSERT INTO wedding_events (
    wedding_id,
    name,
    slug,
    date,
    time,
    dress_code,
    dress_code_emoji,
    dress_code_description,
    outfit_ideas_women,
    outfit_ideas_men,
    ritual_name,
    ritual_description,
    carousel_images,
    gradient_background,
    text_color,
    carousel_slides,
    order_index,
    is_template
  ) VALUES (
    v_wedding_id,
    'Baraat, Varmala, & Jaggo',
    'baraat-varmala-jaggo',
    'January 4',
    '4 PM',
    'Vibrant Indian Festive',
    '🎊',
    'Keep it bright, colorful, and breezy—opt for lightweight silks, cotton-silk blends, chiffon or georgette in jewel tones and bold prints.',
    '["Anarkali", "Lehenga", "Salwar Kameez", "Co-ord Sets"]'::jsonb,
    '["Kurta Sets", "Patterned Vests", "Bandhgalas"]'::jsonb,
    'Baraat, Varmala & Jaggo',
    'Groom''s crew bursts in on drums and trumpets, dancing him straight into the venue. The couple swaps floral garlands and shares personal vows on the mandap. After dinner, the night ignites into a Punjabi wake-up party with pounding dhol and swirling dupattas.',
    '["/images/carousel/jaggo/1.png", "/images/carousel/jaggo/2.png", "/images/carousel/jaggo/3.png", "/images/carousel/jaggo/4.png", "/images/carousel/jaggo/5.png"]'::jsonb,
    'GradientJaggo.png',
    '#FFFFFF',
    '[
      {
        "type": "dress_code",
        "title": "Dress code",
        "subtitle": "Dress code",
        "heading": "Vibrant Indian Festive",
        "description": "Keep it bright, colorful, and breezy—opt for lightweight silks, cotton-silk blends, chiffon or georgette in jewel tones and bold prints."
      },
      {
        "type": "image",
        "src": "/images/carousel/jaggo/1.png"
      },
      {
        "type": "outfit_ideas",
        "title": "Outfit Ideas",
        "women": ["Anarkali", "Lehenga", "Salwar Kameez", "Co-ord Sets"],
        "men": ["Kurta Sets", "Patterned Vests", "Bandhgalas"]
      },
      {
        "type": "image",
        "src": "/images/carousel/jaggo/2.png"
      },
      {
        "type": "ritual",
        "title": "What It Is",
        "subtitle": "The Vibe",
        "heading": "Baraat",
        "description": "Groom''s crew bursts in on drums and trumpets, dancing him straight into the venue—an electrifying welcome that kicks off the celebration."
      },
      {
        "type": "image",
        "src": "/images/carousel/jaggo/3.png"
      },
      {
        "type": "ritual",
        "title": "What It Is",
        "subtitle": "The Moment",
        "heading": "Varmala & Vows",
        "description": "On the mandap, the couple swaps floral garlands and shares personal vows—an equal, heartfelt promise in one picture-perfect instant."
      },
      {
        "type": "image",
        "src": "/images/carousel/jaggo/4.png"
      },
      {
        "type": "ritual",
        "title": "Music & Dance",
        "subtitle": "The Ritual",
        "heading": "Jaggo",
        "description": "After dinner, the night ignites into a Punjabi \"wake-up\" party—guests circle the dance floor to pounding dhol and swirling dupattas, celebrating under lantern-lit trees."
      },
      {
        "type": "image",
        "src": "/images/carousel/jaggo/5.png"
      }
    ]'::jsonb,
    2,
    false
  );

  -- ============================================================================
  -- EVENT 3: Anand Karaj
  -- ============================================================================
  INSERT INTO wedding_events (
    wedding_id,
    name,
    slug,
    date,
    time,
    dress_code,
    dress_code_emoji,
    dress_code_description,
    outfit_ideas_women,
    outfit_ideas_men,
    ritual_name,
    ritual_description,
    carousel_images,
    gradient_background,
    text_color,
    carousel_slides,
    order_index,
    is_template
  ) VALUES (
    v_wedding_id,
    'Anand Karaj',
    'anand-karaj',
    'January 5',
    '9:30 AM',
    'Pastel Indian Traditional',
    '🌸',
    'Show up in soft blush, mint, and lavender—think light chiffons or cotton-silk kurtas and flowy dupattas. A head covering is required for this sacred Anand Karaj ceremony. Please no reds!',
    '["Lehengas", "Anarkalis", "Sarees", "Salwar Kameez"]'::jsonb,
    '["Kurta Sets", "Summer Suits", "Sherwanis", "Bandhgalas"]'::jsonb,
    'Anand Karaj',
    'A sacred Sikh ceremony where the couple circles the Guru Granth Sahib four times—each lap sealing vows through timeless hymns and equal partnership.',
    '["/images/carousel/anand_karaj/1.png", "/images/carousel/anand_karaj/2.png", "/images/carousel/anand_karaj/3.png"]'::jsonb,
    'GradientCottonCandy.png',
    '#141414',
    '[
      {
        "type": "dress_code",
        "title": "Dress code",
        "subtitle": "Dress code",
        "heading": "Traditional Indian - Pastels",
        "description": "Show up in soft blush, mint, and lavender—think light chiffons or cotton-silk kurtas and flowy dupattas. A head covering is required for this sacred Anand Karaj ceremony. Please no reds!"
      },
      {
        "type": "image",
        "src": "/images/carousel/anand_karaj/1.png"
      },
      {
        "type": "outfit_ideas",
        "title": "Traditional Outfit Ideas",
        "women": ["Lehengas", "Anarkalis", "Sarees", "Salwar Kameez"],
        "men": ["Kurta Sets", "Summer Suits", "Sherwanis", "Bandhgalas"]
      },
      {
        "type": "image",
        "src": "/images/carousel/anand_karaj/2.png"
      },
      {
        "type": "ritual",
        "title": "The Ceremony",
        "subtitle": "The ceremony",
        "heading": "Anand Karaj",
        "description": "A sacred Sikh ceremony where the couple circles the Guru Granth Sahib four times—each lap sealing vows through timeless hymns and equal partnership."
      },
      {
        "type": "image",
        "src": "/images/carousel/anand_karaj/3.png"
      }
    ]'::jsonb,
    3,
    false
  );

  -- ============================================================================
  -- EVENT 4: Pool Party
  -- ============================================================================
  INSERT INTO wedding_events (
    wedding_id,
    name,
    slug,
    date,
    time,
    dress_code,
    dress_code_emoji,
    dress_code_description,
    outfit_ideas_women,
    outfit_ideas_men,
    ritual_name,
    ritual_description,
    carousel_images,
    gradient_background,
    text_color,
    carousel_slides,
    order_index,
    is_template
  ) VALUES (
    v_wedding_id,
    'Pool Party',
    'pool-party',
    'January 5',
    '2 PM',
    'Boho Beach Festival',
    '☀️',
    'Day-Party Festival Vibes—bright swimwear under flowy kimonos or mesh cover-ups, oversized shades, and comfy slides or sandals.',
    '["Swimsuits", "Mesh Cover-ups", "Flowy Kimonos", "Crochet Tops"]'::jsonb,
    '["Swim Trunks", "Linen Shirts", "Tank Tops", "Bucket Hats"]'::jsonb,
    'Pool Party',
    'A daytime festival by water—splashy games, chilled cocktails, and laid-back beats under palm fronds, recharging you for the night ahead.',
    '["/images/carousel/pool_party/1.png", "/images/carousel/pool_party/2.png", "/images/carousel/pool_party/3.png"]'::jsonb,
    'GradientPoolParty.png',
    '#141414',
    '[
      {
        "type": "dress_code",
        "title": "Dress code",
        "subtitle": "Dress code",
        "heading": "Boho Beach Festival",
        "description": "Day-Party Festival Vibes—bright swimwear under flowy kimonos or mesh cover-ups, oversized shades, and comfy slides or sandals."
      },
      {
        "type": "image",
        "src": "/images/carousel/pool_party/1.png"
      },
      {
        "type": "outfit_ideas",
        "title": "Outfit Ideas",
        "women": ["Swimsuits", "Mesh Cover-ups", "Flowy Kimonos", "Crochet Tops"],
        "men": ["Swim Trunks", "Linen Shirts", "Tank Tops", "Bucket Hats"]
      },
      {
        "type": "image",
        "src": "/images/carousel/pool_party/2.png"
      },
      {
        "type": "ritual",
        "title": "The Vibe",
        "subtitle": "The vibe",
        "heading": "Pool Party",
        "description": "A daytime festival by water—splashy games, chilled cocktails, and laid-back beats under palm fronds, recharging you for the night ahead."
      },
      {
        "type": "image",
        "src": "/images/carousel/pool_party/3.png"
      }
    ]'::jsonb,
    4,
    false
  );

  -- ============================================================================
  -- EVENT 5: Sangeet & Reception
  -- ============================================================================
  INSERT INTO wedding_events (
    wedding_id,
    name,
    slug,
    date,
    time,
    dress_code,
    dress_code_emoji,
    dress_code_description,
    outfit_ideas_women,
    outfit_ideas_men,
    ritual_name,
    ritual_description,
    carousel_images,
    gradient_background,
    text_color,
    carousel_slides,
    order_index,
    is_template
  ) VALUES (
    v_wedding_id,
    'Sangeet & Reception',
    'reception',
    'January 5',
    '7:30 PM',
    'Cocktail Glam',
    '🪩',
    'Dress to impress—think sharp suits, elegant gowns, or chic lehengas and sherwanis in jewel tones and standout embellishments.',
    '["Evening Gowns", "Embellished Sarees", "Fusion Co-ord Sets", "Cocktail Lehengas"]'::jsonb,
    '["Tuxedos & Dinner Suits", "Tailored Sherwanis", "Patterned Nehru Jackets"]'::jsonb,
    'Sangeet & Reception',
    'Evening kicks off with a high-energy Sangeet of choreographed dances, then flows into a formal Reception of dinner, toasts, and first dances. The night continues with pulsing beats, craft cocktails, and a dance floor that stays hot until the wee hours.',
    '["/images/carousel/reception/1.png", "/images/carousel/reception/2.png", "/images/carousel/reception/3.png"]'::jsonb,
    'GradientReception.png',
    '#FFFFFF',
    '[
      {
        "type": "dress_code",
        "title": "Dress code",
        "subtitle": "Dress code",
        "heading": "Cocktail Glam",
        "description": "Dress to impress—think sharp suits, elegant gowns, or chic lehengas and sherwanis in jewel tones and standout embellishments."
      },
      {
        "type": "image",
        "src": "/images/carousel/reception/1.png"
      },
      {
        "type": "outfit_ideas",
        "title": "Detailed Dress Code",
        "women": ["Evening Gowns", "Embellished Sarees", "Fusion Co-ord Sets", "Cocktail Lehengas"],
        "men": ["Tuxedos & Dinner Suits", "Tailored Sherwanis", "Patterned Nehru Jackets"]
      },
      {
        "type": "image",
        "src": "/images/carousel/reception/2.png"
      },
      {
        "type": "ritual",
        "title": "The Celebration",
        "subtitle": "The celebration",
        "heading": "Sangeet & Reception",
        "description": "Evening kicks off with a high-energy Sangeet of choreographed dances, then flows into a formal Reception of dinner, toasts, and first dances—a perfect blend of party and polish."
      },
      {
        "type": "image",
        "src": "/images/carousel/reception/3.png"
      },
      {
        "type": "ritual",
        "title": "The Vibe",
        "subtitle": "The Vibe",
        "heading": "Afterparty",
        "description": "The night continues with pulsing beats, craft cocktails, and a dance floor that stays hot until the wee hours."
      }
    ]'::jsonb,
    5,
    false
  );

  RAISE NOTICE 'Successfully seeded 5 wedding events with carousel data for sim-kv wedding (ID: %)', v_wedding_id;
END $$;

-- Verify the data was inserted
SELECT
  name,
  slug,
  dress_code,
  jsonb_array_length(carousel_slides) as slide_count,
  text_color,
  gradient_background
FROM wedding_events
WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')
ORDER BY order_index;
