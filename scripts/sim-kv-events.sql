-- SQL to insert the new separate events for sim-kv wedding
-- Run this in the Supabase SQL Editor

-- First, get the wedding ID (should be 66b67fbf-53d6-40d2-8805-297a7b22b418)
-- You can verify with: SELECT id FROM weddings WHERE slug = 'sim-kv';

-- Insert Haldi event
INSERT INTO wedding_events (
  wedding_id, name, slug, dress_code, dress_code_icon, dress_code_description,
  date, time, gradient_background, text_color, ritual_name, ritual_description,
  outfit_ideas_women, outfit_ideas_men, carousel_slides
) VALUES (
  '66b67fbf-53d6-40d2-8805-297a7b22b418',
  'Haldi',
  'haldi',
  'Shades of Yellow',
  'sunflower',
  'Bright, festive yellows! Think sunshine and turmeric.',
  'January 4',
  '2:00 PM',
  'GradientYellow.png',
  '#000000',
  'The Haldi Ceremony',
  'A turmeric paste is applied to the bride and groom for blessings and radiant skin. Prepare to get messy and have fun!',
  '["Yellow Anarkali", "Lehenga in gold tones", "Yellow Saree", "Kurti with palazzo"]',
  '["Yellow Kurta with white pajama", "Yellow Nehru jacket", "Casual yellow shirt"]',
  '[
    {
      "type": "three_lines",
      "top_label": "THE CEREMONY",
      "main_heading": "Haldi",
      "body_text": "A turmeric paste is applied to the bride and groom for blessings and radiant skin. Prepare to get messy and have fun!"
    },
    {
      "type": "two_sections",
      "section1_header": "WOMEN",
      "section1_items": ["Yellow Anarkali", "Lehenga in gold tones", "Yellow Saree", "Kurti with palazzo"],
      "section2_header": "MEN",
      "section2_items": ["Yellow Kurta with white pajama", "Yellow Nehru jacket", "Casual yellow shirt"]
    }
  ]'
);

-- Insert Baraat event
INSERT INTO wedding_events (
  wedding_id, name, slug, dress_code, dress_code_icon, dress_code_description,
  date, time, gradient_background, text_color, ritual_name, ritual_description,
  outfit_ideas_women, outfit_ideas_men, carousel_slides
) VALUES (
  '66b67fbf-53d6-40d2-8805-297a7b22b418',
  'Baraat',
  'baraat',
  'Festive & Bold',
  'trumpet',
  'Vibrant colors and festive wear for the groom''s procession! Think celebration mode.',
  'January 4',
  '4:00 PM',
  'GradientJaggo.png',
  '#FFFFFF',
  'The Baraat',
  'The groom arrives in style with his family and friends dancing to dhol beats. A spectacular, energetic entrance!',
  '["Colorful Lehenga Choli", "Embellished Anarkali", "Designer Saree", "Sharara or Gharara set"]',
  '["Sherwani with churidar", "Bandhgala suit", "Embroidered Kurta", "Nehru jacket with trousers"]',
  '[
    {
      "type": "three_lines",
      "top_label": "THE CELEBRATION",
      "main_heading": "The Baraat",
      "body_text": "The groom arrives in style with his family and friends dancing to dhol beats. A spectacular, energetic entrance to kick off the wedding day!"
    },
    {
      "type": "two_sections",
      "section1_header": "WOMEN",
      "section1_items": ["Colorful Lehenga Choli", "Embellished Anarkali", "Designer Saree", "Sharara or Gharara set"],
      "section2_header": "MEN",
      "section2_items": ["Sherwani with churidar", "Bandhgala suit", "Embroidered Kurta", "Nehru jacket with trousers"]
    }
  ]'
);

-- Insert Varmala & Vows event
INSERT INTO wedding_events (
  wedding_id, name, slug, dress_code, dress_code_icon, dress_code_description,
  date, time, gradient_background, text_color, ritual_name, ritual_description,
  outfit_ideas_women, outfit_ideas_men, carousel_slides
) VALUES (
  '66b67fbf-53d6-40d2-8805-297a7b22b418',
  'Varmala & Vows',
  'varmala-vows',
  'Traditional Elegance',
  'bouquet',
  'Elegant traditional wear for the sacred garland exchange ceremony.',
  'January 4',
  '5:00 PM',
  'pearl.png',
  '#000000',
  'The Varmala',
  'The bride and groom exchange flower garlands, symbolizing their acceptance of each other as life partners.',
  '["Traditional Lehenga or Saree", "Elegant Salwar Kameez", "Pastel Anarkali", "Designer Sharara"]',
  '["Traditional Sherwani", "Kurta Pajama with jacket", "Bandhgala in elegant colors", "Achkan with churidar"]',
  '[
    {
      "type": "three_lines",
      "top_label": "THE CEREMONY",
      "main_heading": "Varmala & Vows",
      "body_text": "The bride and groom exchange flower garlands, symbolizing their acceptance of each other as life partners. A beautiful and meaningful moment!"
    },
    {
      "type": "two_sections",
      "section1_header": "WOMEN",
      "section1_items": ["Traditional Lehenga or Saree", "Elegant Salwar Kameez", "Pastel Anarkali", "Designer Sharara"],
      "section2_header": "MEN",
      "section2_items": ["Traditional Sherwani", "Kurta Pajama with jacket", "Bandhgala in elegant colors", "Achkan with churidar"]
    }
  ]'
);

-- Insert Dinner and Jaggo event
INSERT INTO wedding_events (
  wedding_id, name, slug, dress_code, dress_code_icon, dress_code_description,
  date, time, gradient_background, text_color, ritual_name, ritual_description,
  outfit_ideas_women, outfit_ideas_men, carousel_slides
) VALUES (
  '66b67fbf-53d6-40d2-8805-297a7b22b418',
  'Dinner and Jaggo',
  'dinner-jaggo',
  'Vibrant & Festive',
  'party-popper',
  'Bold colors, sequins, and celebration mode! The night before the wedding calls for your most festive attire.',
  'January 4',
  '8:00 PM',
  'GradientJaggo.png',
  '#FFFFFF',
  'The Jaggo',
  'An energetic night celebration! Family and friends sing, dance, and parade with decorated pots and lights.',
  '["Colorful Lehenga Choli", "Embellished Anarkali", "Sharara or Gharara set", "Designer Saree"]',
  '["Sherwani with churidar", "Bandhgala suit", "Embroidered Kurta with dhoti", "Nehru jacket with trousers"]',
  '[
    {
      "type": "three_lines",
      "top_label": "THE CELEBRATION",
      "main_heading": "Dinner & Jaggo",
      "body_text": "Enjoy a delicious dinner followed by the energetic Jaggo celebration! Family and friends sing, dance, and parade with decorated pots and lights."
    },
    {
      "type": "two_sections",
      "section1_header": "WOMEN",
      "section1_items": ["Colorful Lehenga Choli", "Embellished Anarkali", "Sharara or Gharara set", "Designer Saree"],
      "section2_header": "MEN",
      "section2_items": ["Sherwani with churidar", "Bandhgala suit", "Embroidered Kurta with dhoti", "Nehru jacket with trousers"]
    }
  ]'
);

-- Verify the new events were created
SELECT name, slug, date, time, gradient_background,
       jsonb_array_length(carousel_slides::jsonb) as slide_count
FROM wedding_events
WHERE wedding_id = '66b67fbf-53d6-40d2-8805-297a7b22b418'
ORDER BY date, time;
