-- Migration: Seed WhatsApp Message Templates
-- Created: 2026-01-13
-- Description: Insert 5 pre-approved message templates for WhatsApp Business API

-- Insert RSVP confirmation template
INSERT INTO whatsapp_templates (
  name,
  category,
  content,
  parameters,
  language,
  status
) VALUES (
  'rsvp_confirmation',
  'UTILITY',
  'Hi {{1}}! ✨ Thanks for RSVPing to {{2}}''s wedding on {{3}}! We''ll keep you updated. Reply STOP to unsubscribe.',
  '[{"name": "guest_name", "type": "text"}, {"name": "couple_names", "type": "text"}, {"name": "wedding_date", "type": "text"}]'::jsonb,
  'en_US',
  'draft'
) ON CONFLICT (name) DO NOTHING;

-- Insert event reminder template
INSERT INTO whatsapp_templates (
  name,
  category,
  content,
  parameters,
  language,
  status
) VALUES (
  'event_reminder',
  'UTILITY',
  'Hi {{1}}! 📅 Reminder: {{2}} is tomorrow at {{3}} at {{4}}. See you there! Reply STOP to unsubscribe.',
  '[{"name": "guest_name", "type": "text"}, {"name": "event_name", "type": "text"}, {"name": "event_time", "type": "text"}, {"name": "venue_name", "type": "text"}]'::jsonb,
  'en_US',
  'draft'
) ON CONFLICT (name) DO NOTHING;

-- Insert shuttle reminder template
INSERT INTO whatsapp_templates (
  name,
  category,
  content,
  parameters,
  language,
  status
) VALUES (
  'shuttle_reminder',
  'UTILITY',
  'Hi {{1}}! 🚐 Your shuttle departs at {{2}} from {{3}}. Please be ready 10 mins early. Reply STOP to unsubscribe.',
  '[{"name": "guest_name", "type": "text"}, {"name": "departure_time", "type": "text"}, {"name": "pickup_location", "type": "text"}]'::jsonb,
  'en_US',
  'draft'
) ON CONFLICT (name) DO NOTHING;

-- Insert venue update template
INSERT INTO whatsapp_templates (
  name,
  category,
  content,
  parameters,
  language,
  status
) VALUES (
  'venue_update',
  'UTILITY',
  'Hi {{1}}! 📍 Update: {{2}} location changed to {{3}}. New address: {{4}}. Reply STOP to unsubscribe.',
  '[{"name": "guest_name", "type": "text"}, {"name": "event_name", "type": "text"}, {"name": "new_venue", "type": "text"}, {"name": "new_address", "type": "text"}]'::jsonb,
  'en_US',
  'draft'
) ON CONFLICT (name) DO NOTHING;

-- Insert photo sharing template
INSERT INTO whatsapp_templates (
  name,
  category,
  content,
  parameters,
  language,
  status
) VALUES (
  'photo_sharing',
  'MARKETING',
  'Hi {{1}}! 📸 Share your photos from {{2}} here: {{3}}. We can''t wait to see your memories! Reply STOP to unsubscribe.',
  '[{"name": "guest_name", "type": "text"}, {"name": "event_name", "type": "text"}, {"name": "photo_link", "type": "text"}]'::jsonb,
  'en_US',
  'draft'
) ON CONFLICT (name) DO NOTHING;

-- Verify templates were inserted
SELECT name, category, status, jsonb_array_length(parameters) as param_count 
FROM whatsapp_templates 
ORDER BY name;
