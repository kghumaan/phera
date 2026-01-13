-- Complete Seed Data for sim-kv Wedding
-- This populates all wedding-related tables with the hardcoded data
-- Run this in Supabase SQL Editor after the wedding record exists

-- Get the wedding ID
DO $$
DECLARE
  v_wedding_id UUID;
  v_sunday_schedule_id UUID;
  v_monday_schedule_id UUID;
  v_tuesday_schedule_id UUID;
BEGIN
  -- Get the wedding ID for sim-kv
  SELECT id INTO v_wedding_id FROM weddings WHERE slug = 'sim-kv';
  
  IF v_wedding_id IS NULL THEN
    RAISE EXCEPTION 'Wedding sim-kv not found. Please create the wedding first.';
  END IF;

  RAISE NOTICE 'Seeding data for wedding ID: %', v_wedding_id;

  -- ============================================================
  -- 1. WEDDING EVENTS (5 events with dress codes)
  -- ============================================================
  DELETE FROM wedding_events WHERE wedding_id = v_wedding_id;
  
  INSERT INTO wedding_events (wedding_id, name, slug, date, time, dress_code, dress_code_emoji, dress_code_description, outfit_ideas_women, outfit_ideas_men, ritual_name, ritual_description, gradient_background, order_index) VALUES
  (v_wedding_id, 'Welcome Lunch & Haldi', 'welcome-lunch-haldi', 'January 4', '12 PM', 'Shades of Yellow', '🌻', 'Sunlit hues of yellow → light linens, cotton kurtas, floaty dresses (you might get messy). And don''t forget your sunglasses!', 
   '["Kaftans", "Salwar Kameez", "Sundresses", "Co-ord Sets"]'::jsonb,
   '["Linen Shirts", "Cotton Kurtas"]'::jsonb,
   'Haldi', 'A joyful ceremony where family and friends smear the couple with turmeric-paste - symbolizing purity, protection, and a radiant glow for the big day.',
   '/images/backgrounds/GradientYellow.png', 0),
   
  (v_wedding_id, 'Baraat, Varmala, & Jaggo', 'baraat-varmala-jaggo', 'January 4', '4 PM', 'Vibrant Indian Festive', '🎊', 'Keep it bright, colorful, and breezy—opt for lightweight silks, cotton-silk blends, chiffon or georgette in jewel tones and bold prints.',
   '["Anarkali", "Lehenga", "Salwar Kameez", "Co-ord Sets"]'::jsonb,
   '["Kurta Sets", "Patterned Vests", "Bandhgalas"]'::jsonb,
   'Baraat & Varmala', 'Groom''s crew bursts in on drums and trumpets, dancing him straight into the venue. On the mandap, the couple swaps floral garlands—an equal, heartfelt promise.',
   '/images/backgrounds/GradientJaggo.png', 1),
   
  (v_wedding_id, 'Anand Karaj', 'anand-karaj', 'January 5', '9:30 AM', 'Pastel Indian Traditional', '🌸', 'Show up in soft blush, mint, and lavender—think light chiffons or cotton‐silk kurtas and flowy dupattas. A head covering is required for this sacred Anand Karaj ceremony. Please no reds!',
   '["Lehengas", "Anarkalis", "Sarees", "Salwar Kameez"]'::jsonb,
   '["Kurta Sets", "Summer Suits", "Sherwanis", "Bandhgalas"]'::jsonb,
   'Anand Karaj', 'A sacred Sikh ceremony where the couple circles the Guru Granth Sahib four times—each lap sealing vows through timeless hymns and equal partnership.',
   '/images/backgrounds/GradientCottonCandy.png', 2),
   
  (v_wedding_id, 'Pool Party', 'pool-party', 'January 5', '2 PM', 'Boho Beach Festival', '☀️', 'Day-Party Festival Vibes—bright swimwear under flowy kimonos or mesh cover-ups, oversized shades, and comfy slides or sandals.',
   '["Swimsuits", "Mesh Cover-ups", "Flowy Kimonos", "Crochet Tops"]'::jsonb,
   '["Swim Trunks", "Linen Shirts", "Tank Tops", "Bucket Hats"]'::jsonb,
   'Pool Party', 'A daytime festival by water—splashy games, chilled cocktails, and laid-back beats under palm fronds, recharging you for the night ahead.',
   '/images/backgrounds/GradientPoolParty.png', 3),
   
  (v_wedding_id, 'Sangeet & Reception', 'reception', 'January 5', '7:30 PM', 'Cocktail Glam', '🪩', 'Dress to impress—think sharp suits, elegant gowns, or chic lehengas and sherwanis in jewel tones and standout embellishments.',
   '["Evening Gowns", "Embellished Sarees", "Fusion Co-ord Sets", "Cocktail Lehengas"]'::jsonb,
   '["Tuxedos & Dinner Suits", "Tailored Sherwanis", "Patterned Nehru Jackets"]'::jsonb,
   'Sangeet & Reception', 'Evening kicks off with a high-energy Sangeet of choreographed dances, then flows into a formal Reception of dinner, toasts, and first dances—a perfect blend of party and polish.',
   '/images/backgrounds/GradientReception.png', 4);

  RAISE NOTICE 'Inserted 5 wedding events';

  -- ============================================================
  -- 2. WEDDING SCHEDULE (3 days with events)
  -- ============================================================
  DELETE FROM schedule_items WHERE schedule_id IN (SELECT id FROM wedding_schedule WHERE wedding_id = v_wedding_id);
  DELETE FROM wedding_schedule WHERE wedding_id = v_wedding_id;
  
  -- Insert schedule days
  INSERT INTO wedding_schedule (wedding_id, day_name, date, order_index) VALUES
  (v_wedding_id, 'Sunday', 'Sunday - January 4, 2025', 0)
  RETURNING id INTO v_sunday_schedule_id;
  
  INSERT INTO wedding_schedule (wedding_id, day_name, date, order_index) VALUES
  (v_wedding_id, 'Monday', 'Monday - January 5, 2025', 1)
  RETURNING id INTO v_monday_schedule_id;
  
  INSERT INTO wedding_schedule (wedding_id, day_name, date, order_index) VALUES
  (v_wedding_id, 'Tuesday', 'Tuesday - January 6, 2025', 2)
  RETURNING id INTO v_tuesday_schedule_id;

  -- Sunday Schedule Items
  INSERT INTO schedule_items (schedule_id, time, name, description, location, order_index) VALUES
  (v_sunday_schedule_id, '11 AM', '🏨 Guest Arrival', 'Check in and dive straight into the festive fun (come dressed in your shades of yellow!)', 'The Palayana', 0),
  (v_sunday_schedule_id, '12 PM', '🥘 Welcome Lunch', 'Bright beachfront buffet in your sunny yellows—get ready to mingle and reunite.', 'Lawn', 1),
  (v_sunday_schedule_id, '1:30 PM', '🌻 Haldi Ceremony', 'Splash into the turmeric celebration—feel the buzz as we kick off the good vibes.', 'Lawn', 2),
  (v_sunday_schedule_id, '12 - 5 PM', '🪬 Mehendi Station', 'Stop by for live henna artistry—watch your hands transform into incredible works of art.', 'Thaipas', 3),
  (v_sunday_schedule_id, '4 PM', '🐎 KV''s Baarat (Grooms Side)', 'Drums, music, and procession—join the vibrant celebration as we parade through the streets.', 'Resort Entrance', 4),
  (v_sunday_schedule_id, '5:30 PM', '🌺 Varmala & Vows', 'Exchange garlands and vows under a sunset sky—an intimate, colorful moment you won''t want to miss.', 'Lawn', 5),
  (v_sunday_schedule_id, '7 - 10 PM', '🥁 Dinner & Jaggo', 'Eat, dance, repeat—savor the feast then let loose to pounding dhol beats.', 'Lawn', 6);

  -- Monday Schedule Items
  INSERT INTO schedule_items (schedule_id, time, name, description, location, order_index) VALUES
  (v_monday_schedule_id, '6:30 - 9:30 AM', '🍳 Breakfast', NULL, 'Basil Restaurant', 0),
  (v_monday_schedule_id, '9:30 AM', '🤲 Anand Karaj (Wedding Ceremony)', NULL, 'Satnam House (transportation provided)', 1),
  (v_monday_schedule_id, '12:30 PM', '🍽️ Lunch', NULL, 'Lawn', 2),
  (v_monday_schedule_id, '2 PM', '🏊 Pool Party', NULL, 'Poolside & Beach', 3),
  (v_monday_schedule_id, '7:30 PM', '🎉 Sangeet & Reception', NULL, 'Ballroom', 4),
  (v_monday_schedule_id, '12 - 3 AM', '🪩 Afterparty', NULL, 'Ballroom', 5);

  -- Tuesday Schedule Items
  INSERT INTO schedule_items (schedule_id, time, name, description, location, order_index) VALUES
  (v_tuesday_schedule_id, '6:30 - 11 AM', '🍳 Breakfast', NULL, 'Basil Restaurant', 0),
  (v_tuesday_schedule_id, '12 PM', '🧳 Checkout', NULL, 'Hotel Lobby', 1);

  RAISE NOTICE 'Inserted 3 schedule days with 15 schedule items';

  -- ============================================================
  -- 3. TRAVEL CARDS (9 cards)
  -- ============================================================
  DELETE FROM wedding_travel_cards WHERE wedding_id = v_wedding_id;
  
  INSERT INTO wedding_travel_cards (wedding_id, title, content, image_url, button_text, button_action, is_whatsapp_button, is_disabled, order_index) VALUES
  (v_wedding_id, 'We''ve got your stay covered ✨', 
   '["Your rooms at The Palayana are taken care of for January 4th & 5th. Get ready to celebrate right on the beach - the resort is absolutely gorgeous!", "We''ll share room assignments closer to the date."]'::jsonb,
   '/images/travel_stay/1.png', NULL, NULL, false, false, 0),
   
  (v_wedding_id, 'Book additional nights at The Palayana 🏝️',
   '["Want to stay longer? Book additional nights as soon as possible since the hotel fills up fast! Use the link below or email vidhi@thepalayana.com and CC booking@thepalayana.com if you''d prefer to stay in the same room we assign to you for the 4th and 5th."]'::jsonb,
   '/images/travel_stay/2.png', 'booking link', 'https://bit.ly/45TiuuI', false, false, 1),
   
  (v_wedding_id, 'Coming to Bangkok first? 🏙️',
   '["If you''re planning to arrive early, we''ll be in Bangkok for New Year''s Eve. No formal plans yet, but you''re welcome to join whatever we end up doing.", "Plus, Bangkok is ''the best city in world'' according to Sim so it''s worth the trip 👀"]'::jsonb,
   '/images/travel_stay/3.png', 'Sim''s bangkok guide', 'https://docs.google.com/document/d/1JedCbzdZkMiRaI37d-5wP59qipdAJW97RPLkTMx6reI/edit?tab=t.0', false, false, 2),
   
  (v_wedding_id, 'Where to stay in Bangkok 🗺️',
   '["Sukhumvit (Asok, Phrom Phong, Thong Lo) is our top pick for max convenience - food, nightlife, shopping, it''s the heart of the city. And it''s where Sim grew up!", "Silom/Sathorn for a quieter residential vibe, Riverside for fancy hotels and upscale vibes, Chinatown if you''re looking for a local experience and boutique hotels (or ratchet hostels 😜)."]'::jsonb,
   '/images/travel_stay/4.png', NULL, NULL, false, false, 3),
   
  (v_wedding_id, 'Getting to Hua Hin 🚌',
   '["Hua Hin is a ~3-hour drive from Bangkok. We can help organize transportation for your group (more info on this coming soon). Transportation will cost $25-$35 per person for a round trip.", "You can also rent a car if you prefer to drive yourself - just remember they drive on the left side of the road!", "FYI, celebrations start in Hua Hin at 12pm on Jan 4th so we highly recommend arriving in Bangkok by at least Jan 3rd."]'::jsonb,
   '/images/travel_stay/5.png', NULL, NULL, false, false, 4),
   
  (v_wedding_id, 'Weather & what to expect 🌤️',
   '["January weather is lovely - around 75-85°F (24-29°C). Pack light and bring sunscreen!", "There are specific dress codes for each wedding event, so check the link below for details."]'::jsonb,
   '/images/travel_stay/6.png', 'Dress Code', '/events', false, false, 5),
   
  (v_wedding_id, 'Money stuff 💰',
   '["Thailand uses Thai Baht (roughly 1 USD = 35 THB, 1 INR = 0.4 THB). We recommend getting cash from a currency exchange since ATMs here have high fees.", "Most places accept cards, but local stores and 7-Elevens will require cash."]'::jsonb,
   '/images/travel_stay/7.png', NULL, NULL, false, false, 6),
   
  (v_wedding_id, 'Staying in touch 📱',
   '["We''ll be using WhatsApp for updates and coordination so make sure you have the app downloaded on your phone.", "Download the app and use the button below to join our wedding channel!"]'::jsonb,
   '/images/travel_stay/8.png', 'Join Whatsapp Channel', NULL, true, false, 7),
   
  (v_wedding_id, 'We''re so excited to celebrate with you! 🎉',
   '["That''s everything you should need for now! If you have any questions about travel, the wedding, or anything else, just reach out - we''re always happy to help."]'::jsonb,
   '/images/travel_stay/9.png', 'Back to menu', '/details', false, false, 8);

  RAISE NOTICE 'Inserted 9 travel cards';

  -- ============================================================
  -- 4. FAQs (7 questions)
  -- ============================================================
  DELETE FROM wedding_faqs WHERE wedding_id = v_wedding_id;
  
  INSERT INTO wedding_faqs (wedding_id, question, answer, button_text, button_link, order_index) VALUES
  (v_wedding_id, 'Can I bring a plus-one?', 
   'Plus-ones are only available if you were given that option during RSVP. The hotel has limited capacity, so we''ve had to be very selective with plus-ones. If you have questions about bringing someone, reach out to us directly!',
   NULL, NULL, 0),
   
  (v_wedding_id, 'Do I need a visa for Thailand?',
   'It depends on your passport! Many countries get visa-free entry for 30 days (including US and Indian citizens). Check with the Thai embassy or consulate for your specific requirements.',
   NULL, NULL, 1),
   
  (v_wedding_id, 'What if I need to change my RSVP?',
   'Just log back into the website with your email and tap on your RSVP status to change it, or message us directly.',
   NULL, NULL, 2),
   
  (v_wedding_id, 'What would you like as wedding gifts?',
   'Your presence is the greatest present! If you''d like to give something, we have a honeymoon fund and new home fund you can contribute to (link below). We''re not doing physical gifts since we''re all traveling.',
   'Registry', '/registry', 3),
   
  (v_wedding_id, 'Where can I shop for Indian outfits?',
   'Check our dress code page for our favorite stores and online retailers! Many brands ship internationally. Can''t find something? Just reach out - we''re happy to help!',
   'Events & Dress Code', '/events', 4),
   
  (v_wedding_id, 'Can I arrive earlier or leave later?',
   'Absolutely! We''re covering Jan 4-5 nights, but you can extend your stay. Book additional nights ASAP as the hotel fills up quickly during this time. Use the link below or email vidhi@thepalayana.com and CC booking@thepalayana.com if you''d prefer to stay in the same room we assign to you for the 4th and 5th.',
   'Booking Link', 'https://bit.ly/45TiuuI', 5),
   
  (v_wedding_id, 'How much spending money should I bring?',
   'For tips, local shopping, and any extra resort services (spa, room service), $200-300 equivalent should be plenty for the weekend.',
   NULL, NULL, 6);

  RAISE NOTICE 'Inserted 7 FAQs';

  -- ============================================================
  -- 5. SHOPS (9 stores)
  -- ============================================================
  DELETE FROM wedding_shops WHERE wedding_id = v_wedding_id;
  
  INSERT INTO wedding_shops (wedding_id, name, details, url, order_index) VALUES
  (v_wedding_id, 'House of Indya', 'Ships to US in 5–7 business days
Avg. outfit $30–$250', 'https://www.houseofindya.com', 0),

  (v_wedding_id, 'Lashkaraa', 'Ships to US in 10–14 business days
Avg. outfit $60–$180', 'https://www.lashkaraa.com', 1),

  (v_wedding_id, 'Utsav Fashion', 'Ships to US in 5–7 business days
Avg. outfit $50–$200', 'https://www.utsavfashion.com', 2),

  (v_wedding_id, 'KALKI Fashion', 'Ships to US in 7–14 business days
Avg. outfit $120–$350', 'https://www.kalkifashion.com', 3),

  (v_wedding_id, 'Mulmul', 'Ships to US in 4–5 business days
Avg. outfit $150–$300', 'https://shopmulmul.com/', 4),

  (v_wedding_id, 'KYNAH', 'Ready-to-ship from Los Angeles in 4–7 business days
Avg. outfit $140–$1,000', 'https://shopkynah.com/', 5),

  (v_wedding_id, 'Mirraw', 'Ships to US in 7–12 business days
Avg. outfit $50–$150', 'https://www.mirraw.com', 6),

  (v_wedding_id, 'Cbazaar', 'Ships to US in 7–10 business days
Avg. outfit $30–$80', 'https://www.cbazaar.com', 7),

  (v_wedding_id, 'Fabricoz USA', 'US-domestic shipping in 3–5 business days
Avg. outfit $60–$200', 'https://www.fabricoz.com', 8);

  RAISE NOTICE 'Inserted 9 shops';

  -- ============================================================
  -- 6. REGISTRY (2 funds)
  -- ============================================================
  DELETE FROM wedding_registry WHERE wedding_id = v_wedding_id;
  
  INSERT INTO wedding_registry (wedding_id, fund_name, emoji, description, stripe_product_id, order_index) VALUES
  (v_wedding_id, 'New Home Fund', '🏠', 'Help us build our dream home together', NULL, 0),
  (v_wedding_id, 'Honeymoon Fund', '✈️', 'Contribute to our romantic getaway', NULL, 1);

  RAISE NOTICE 'Inserted 2 registry funds';

  -- ============================================================
  -- Summary
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '✅ Complete! Seeded all data for sim-kv wedding:';
  RAISE NOTICE '   - 5 wedding events';
  RAISE NOTICE '   - 3 schedule days with 15 items';
  RAISE NOTICE '   - 9 travel cards';
  RAISE NOTICE '   - 7 FAQs';
  RAISE NOTICE '   - 9 shops';
  RAISE NOTICE '   - 2 registry funds';

END $$;

-- Verification queries
SELECT 'Events' as section, COUNT(*) as count FROM wedding_events WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')
UNION ALL
SELECT 'Schedule Days', COUNT(*) FROM wedding_schedule WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')
UNION ALL
SELECT 'Schedule Items', COUNT(*) FROM schedule_items WHERE schedule_id IN (SELECT id FROM wedding_schedule WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv'))
UNION ALL
SELECT 'Travel Cards', COUNT(*) FROM wedding_travel_cards WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')
UNION ALL
SELECT 'FAQs', COUNT(*) FROM wedding_faqs WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')
UNION ALL
SELECT 'Shops', COUNT(*) FROM wedding_shops WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')
UNION ALL
SELECT 'Registry', COUNT(*) FROM wedding_registry WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');

