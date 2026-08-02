-- Update the Haldi event (id: 481c982b-1ca5-4f45-a77a-d712df7a9dea) with the correct 6 slides
-- taken from the original Welcome Lunch & Haldi event (slides 1-6, slides 7-8 belong to Mehendi)
-- Run this in the Supabase SQL Editor

UPDATE wedding_events
SET carousel_slides = '[
  {
    "type": "dress_code",
    "title": "Dress code",
    "heading": "Shades of yellow",
    "subtitle": "Dress code",
    "description": "Sunlit hues of yellow → light linens, cotton kurtas, floaty dresses (you might get messy). And don''t forget your sunglasses!"
  },
  {
    "src": "/images/carousel/haldi/1.png",
    "type": "image"
  },
  {
    "men": [
      "Linen Shirts",
      "Cotton Kurtas"
    ],
    "type": "outfit_ideas",
    "title": "Outfit Ideas",
    "women": [
      "Kaftans",
      "Salwar Kameez",
      "Sundresses",
      "Co-ord Sets"
    ]
  },
  {
    "src": "/images/carousel/haldi/2.png",
    "type": "image"
  },
  {
    "type": "ritual",
    "title": "What It Is",
    "heading": "Haldi",
    "subtitle": "The Ritual",
    "description": "A joyful ceremony where family and friends smear the couple with turmeric-paste - symbolizing purity, protection, and a radiant glow for the big day."
  },
  {
    "src": "/images/carousel/haldi/3.png",
    "type": "image"
  }
]'::jsonb
WHERE id = '481c982b-1ca5-4f45-a77a-d712df7a9dea';

-- Verify
SELECT name, slug, jsonb_array_length(carousel_slides::jsonb) as slide_count
FROM wedding_events
WHERE id = '481c982b-1ca5-4f45-a77a-d712df7a9dea';
