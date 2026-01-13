-- Seed Data for sim-kv Wedding
-- This migrates the existing hardcoded wedding data into the database
-- Run this after creating the tables with create_multi_wedding_system.sql

-- Note: Replace 'YOUR_USER_ID_HERE' with your actual Supabase user ID
-- You can get this from: SELECT id FROM auth.users WHERE email = 'your@email.com';

-- Insert the main wedding record
INSERT INTO weddings (
  slug,
  couple_name,
  bride_name,
  groom_name,
  wedding_date,
  wedding_date_display,
  venue_name,
  venue_location,
  venue_flag,
  rsvp_deadline,
  status,
  couple_image_url,
  frame_image_url,
  background_image,
  primary_color,
  created_by
) VALUES (
  'sim-kv',
  'Simran & Karanvir',
  'Simran',
  'Karanvir',
  '2026-01-04T00:00:00+00:00',
  '4-6 JANUARY, 2026',
  'The Palayana',
  'Hua Hin, Thailand',
  '🇹🇭',
  'August 16, 2025',
  'live',
  '/images/couple/couple-1.jpg',
  '/images/frames/frame-27.png',
  '/images/backgrounds/pearl.png',
  '#DE3F5E',
  'YOUR_USER_ID_HERE' -- REPLACE THIS
)
RETURNING id as wedding_id;

-- Note: After running the above, capture the wedding_id and use it below
-- Or use this query to get it: SELECT id FROM weddings WHERE slug = 'sim-kv';

-- For the following INSERTs, replace WEDDING_ID_HERE with the actual UUID

-- Insert Events
INSERT INTO wedding_events (wedding_id, name, slug, date, time, dress_code, dress_code_emoji, dress_code_description, outfit_ideas_women, outfit_ideas_men, ritual_name, ritual_description, carousel_images, gradient_background, order_index) VALUES
('WEDDING_ID_HERE', 'Welcome Lunch & Haldi', 'haldi', 'Sunday - January 4, 2025', '12:00 PM', 'Shades of Yellow', '🌻', 'Bright, festive yellows! Think sunshine and turmeric.', 
 '["Yellow Anarkali or Salwar Kameez", "Lehenga in yellow/gold tones", "Yellow Saree with contrasting blouse", "Kurti with palazzo pants", "Floral yellow print dress"]'::jsonb,
 '["Yellow Kurta with white pajama", "Yellow Nehru jacket", "Casual yellow shirt with chinos", "Yellow sherwani (if going formal)"]'::jsonb,
 'The Haldi Ceremony', 'A turmeric paste is applied to the bride and groom for blessings and radiant skin. Prepare to get messy and have fun!',
 '[]'::jsonb, '/images/backgrounds/GradientYellow.png', 0),

('WEDDING_ID_HERE', 'Baraat, Varmala & Jaggo', 'jaggo', 'Sunday - January 4, 2025', '4:00 PM', 'Vibrant & Festive', '🎉', 'Bold colors, sequins, and celebration mode! Think wedding party vibes.',
 '["Colorful Lehenga Choli", "Embellished Anarkali", "Sharara or Gharara set", "Designer Saree with heavy blouse", "Indo-western fusion gown"]'::jsonb,
 '["Sherwani with churidar", "Bandhgala suit", "Embroidered Kurta with dhoti", "Nehru jacket with trousers", "Traditional Jodhpuri suit"]'::jsonb,
 'The Baraat & Varmala', 'The groom arrives on horseback with his family dancing. The couple exchanges flower garlands in the Varmala ceremony.',
 '[]'::jsonb, '/images/backgrounds/GradientJaggo.png', 1),

('WEDDING_ID_HERE', 'Anand Karaj', 'anand-karaj', 'Monday - January 5, 2025', '10:00 AM', 'Traditional Elegance', '💐', 'Elegant pastels and traditional wear for the sacred ceremony.',
 '["Pastel Lehenga or Saree", "Traditional Salwar Kameez", "Light-colored Anarkali", "Elegant Sharara", "Soft pink or peach outfits"]'::jsonb,
 '["Traditional Kurta Pajama", "Light-colored Sherwani", "Nehru jacket in pastels", "Bandhgala in cream/beige", "Traditional Achkan"]'::jsonb,
 'The Anand Karaj', 'The Sikh wedding ceremony where the couple circles the Guru Granth Sahib four times, symbolizing their union.',
 '[]'::jsonb, '/images/backgrounds/pearl.png', 2),

('WEDDING_ID_HERE', 'Pool Party', 'pool-party', 'Monday - January 5, 2025', '2:00 PM', 'Beach Chic', '🏖️', 'Beachwear, swimsuits, and resort casual. Bring your summer vibes!',
 '["Swimsuit with cover-up", "Maxi dress or beach dress", "Kaftan or resort wear", "Shorts with crop top", "Flowy palazzo with tank"]'::jsonb,
 '["Swim shorts", "Linen shirt (unbuttoned or casual)", "Beach shorts with tee", "Resort casual attire", "Hawaiian shirt"]'::jsonb,
 'Pool Party Celebration', 'Relax, swim, and celebrate by the pool with music, drinks, and good vibes!',
 '[]'::jsonb, '/images/backgrounds/GradientPoolParty.png', 3),

('WEDDING_ID_HERE', 'Sangeet & Reception', 'reception', 'Monday - January 5, 2025', '6:00 PM', 'Cocktail Glam', '✨', 'Dress to impress! Formal cocktail attire with glamorous touches.',
 '["Evening gown or cocktail dress", "Glamorous Saree with embellished blouse", "Designer Lehenga", "Sequined or velvet outfit", "Indo-western fusion gown"]'::jsonb,
 '["Black tie or Tuxedo", "Formal Sherwani", "Three-piece suit", "Designer Kurta with jacket", "Velvet or silk Bandhgala"]'::jsonb,
 'Sangeet & Reception', 'An evening of music, dance performances, dinner, and celebration of the newlyweds!',
 '[]'::jsonb, '/images/backgrounds/GradientReception.png', 4);

-- Insert Schedule
INSERT INTO wedding_schedule (wedding_id, day_name, date, order_index) VALUES
('WEDDING_ID_HERE', 'Sunday', 'Sunday - January 4, 2025', 0),
('WEDDING_ID_HERE', 'Monday', 'Monday - January 5, 2025', 1),
('WEDDING_ID_HERE', 'Tuesday', 'Tuesday - January 6, 2025', 2);

-- Insert Schedule Items (you'll need to replace SCHEDULE_IDs with actual IDs after inserting schedules)
-- Get schedule IDs: SELECT id, day_name FROM wedding_schedule WHERE wedding_id = 'WEDDING_ID_HERE';

-- Sunday Schedule Items
INSERT INTO schedule_items (schedule_id, time, name, description, location, order_index) VALUES
('SUNDAY_SCHEDULE_ID', '11 AM', '🏨 Guest Arrival', 'Check in and dive straight into the festive fun (come dressed in your shades of yellow!)', 'The Palayana', 0),
('SUNDAY_SCHEDULE_ID', '12 PM', '🥘 Welcome Lunch', 'Bright beachfront buffet in your sunny yellows—get ready to mingle and reunite.', 'Lawn', 1),
('SUNDAY_SCHEDULE_ID', '1:30 PM', '🌻 Haldi Ceremony', 'Splash into the turmeric celebration—feel the buzz as we kick off the good vibes.', 'Lawn', 2),
('SUNDAY_SCHEDULE_ID', '12 - 5 PM', '🪬 Mehendi Station', 'Stop by for live henna artistry—watch your hands transform into incredible works of art.', 'Thaipas', 3),
('SUNDAY_SCHEDULE_ID', '4 PM', '🐎 KV''s Baarat (Grooms Side)', 'Drums, music, and procession—join the vibrant celebration as we parade through the streets.', 'Resort Entrance', 4),
('SUNDAY_SCHEDULE_ID', '5:30 PM', '🌺 Varmala & Vows', 'Watch the couple exchange garlands in a joyful, emotional ceremony marking the start of their journey.', 'Lawn', 5),
('SUNDAY_SCHEDULE_ID', '6:30 PM', '🍽️ Dinner & Jaggo', 'Feast under the stars and dance into the night with live dhol beats and endless energy.', 'Lawn', 6);

-- Monday Schedule Items
INSERT INTO schedule_items (schedule_id, time, name, description, location, order_index) VALUES
('MONDAY_SCHEDULE_ID', '8 AM', '☕ Breakfast', 'Fuel up for the big day ahead—grab a plate and relax before the ceremony.', 'Thaipas', 0),
('MONDAY_SCHEDULE_ID', '10 AM', '🙏 Anand Karaj (Wedding Ceremony)', 'The sacred Sikh wedding ceremony. Come dressed in your elegant pastels to witness the beautiful union.', 'Lawn', 1),
('MONDAY_SCHEDULE_ID', '12 PM', '🍽️ Lunch', 'Celebrate over a delicious spread—more food, more fun, more memories.', 'Thaipas', 2),
('MONDAY_SCHEDULE_ID', '2 PM', '🏊 Pool Party', 'Dive in! Beach vibes, cold drinks, and chill beats by the pool.', 'Pool', 3),
('MONDAY_SCHEDULE_ID', '6 PM', '🎤 Sangeet & Reception', 'The grand finale! Dance performances, music, drinks, and a night to remember. Dress to impress!', 'Ballroom', 4);

-- Tuesday Schedule Items
INSERT INTO schedule_items (schedule_id, time, name, description, location, order_index) VALUES
('TUESDAY_SCHEDULE_ID', '8 AM - 12 PM', '✈️ Guest Departure', 'Safe travels! Thank you for celebrating with us. We''ll miss you already. 💕', 'The Palayana', 0);

-- Insert FAQs
INSERT INTO wedding_faqs (wedding_id, question, answer, button_text, button_link, order_index) VALUES
('WEDDING_ID_HERE', 'When should I RSVP by?', 'Please RSVP by August 16, 2025. We need time to finalize catering, seating, and other arrangements.', NULL, NULL, 0),
('WEDDING_ID_HERE', 'Can I bring a plus-one?', 'Your invitation will specify if you have a plus-one. If you''re unsure, please contact us directly.', NULL, NULL, 1),
('WEDDING_ID_HERE', 'What should I wear?', 'Each event has its own dress code! Check the Events & Dress Code section for detailed guidelines.', 'View Events', '/events', 2),
('WEDDING_ID_HERE', 'Is there a gift registry?', 'Your presence is the greatest gift! But if you''d like to contribute, we''ve set up a few funds for our future together.', 'View Registry', '/registry', 3),
('WEDDING_ID_HERE', 'How do I get to the venue?', 'The Palayana is located in Hua Hin, Thailand. Check our Travel & Stay section for detailed information on flights, transfers, and accommodation.', 'Travel Info', '/travel', 4),
('WEDDING_ID_HERE', 'Will there be vegetarian/vegan options?', 'Yes! We''ll have a variety of vegetarian and vegan options at all meal events. Please indicate any dietary restrictions in your RSVP.', NULL, NULL, 5);

-- Insert Registry Items
INSERT INTO wedding_registry (wedding_id, fund_name, emoji, description, stripe_product_id, order_index) VALUES
('WEDDING_ID_HERE', 'New Home Fund', '🏡', 'Help us build our dream home together', NULL, 0),
('WEDDING_ID_HERE', 'Honeymoon Fund', '🏖️', 'Contribute to our romantic getaway', NULL, 1),
('WEDDING_ID_HERE', 'Future Adventures', '✈️', 'Support our travel and adventures', NULL, 2);

-- Insert Shopping Guide
INSERT INTO wedding_shops (wedding_id, name, details, url, order_index) VALUES
('WEDDING_ID_HERE', 'Pernia''s Pop-Up Shop', 'Ships internationally
Price range: $$-$$$
Stunning designer pieces', 'https://www.perniaspopupshop.com/', 0),
('WEDDING_ID_HERE', 'Kalki Fashion', 'Ships to US, UK, Canada
Price range: $$
Beautiful bridal and festive wear', 'https://www.kalkifashion.com/', 1),
('WEDDING_ID_HERE', 'Manyavar', 'Ships internationally
Price range: $-$$
Great men''s ethnic wear', 'https://www.manyavar.com/', 2),
('WEDDING_ID_HERE', 'Fabindia', 'Ships internationally
Price range: $-$$
Elegant Indian fusion wear', 'https://www.fabindia.com/', 3);

-- Insert Settings
-- Note: PINs must be exactly 4 digits (the PinEntry component expects 4-digit numeric PINs)
INSERT INTO wedding_settings (wedding_id, pin_codes, whatsapp_group_link, lapse_event_codes, google_sheets_id) VALUES
('WEDDING_ID_HERE', 
 '[
   {"pin": "7834", "type": "family", "allows_plus_one": true},
   {"pin": "2591", "type": "friend", "allows_plus_one": false},
   {"pin": "9876", "type": "vip", "allows_plus_one": true}
 ]'::jsonb,
 NULL,
 '{}'::jsonb,
 NULL
);

-- Verification queries to run after insertion:
-- SELECT * FROM weddings WHERE slug = 'sim-kv';
-- SELECT * FROM wedding_events WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');
-- SELECT * FROM wedding_schedule WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');
-- SELECT * FROM wedding_faqs WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv');

