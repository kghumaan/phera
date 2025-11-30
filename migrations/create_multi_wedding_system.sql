-- Migration: Create Multi-Wedding System Tables
-- Description: Add new tables to support multiple wedding websites with custom configurations
-- Note: Does not modify existing tables (guests, rsvps, comments)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create weddings table
CREATE TABLE IF NOT EXISTS weddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  couple_name TEXT NOT NULL,
  bride_name TEXT,
  groom_name TEXT,
  wedding_date TIMESTAMPTZ NOT NULL,
  wedding_date_display TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_location TEXT NOT NULL,
  venue_flag TEXT,
  rsvp_deadline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'preview', 'live')),
  couple_image_url TEXT,
  frame_image_url TEXT,
  background_image TEXT DEFAULT '/images/backgrounds/pearl.png',
  primary_color TEXT DEFAULT '#DE3F5E',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wedding_admins table for multi-admin support
CREATE TABLE IF NOT EXISTS wedding_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wedding_id, user_id)
);

-- Create wedding_events table
CREATE TABLE IF NOT EXISTS wedding_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  dress_code TEXT NOT NULL,
  dress_code_emoji TEXT,
  dress_code_description TEXT,
  outfit_ideas_women JSONB DEFAULT '[]'::jsonb,
  outfit_ideas_men JSONB DEFAULT '[]'::jsonb,
  ritual_name TEXT,
  ritual_description TEXT,
  carousel_images JSONB DEFAULT '[]'::jsonb,
  gradient_background TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wedding_id, slug)
);

-- Create wedding_schedule table
CREATE TABLE IF NOT EXISTS wedding_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,
  date TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schedule_items table
CREATE TABLE IF NOT EXISTS schedule_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES wedding_schedule(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wedding_travel_cards table
CREATE TABLE IF NOT EXISTS wedding_travel_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT NOT NULL,
  button_text TEXT,
  button_action TEXT,
  is_whatsapp_button BOOLEAN DEFAULT false,
  is_disabled BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wedding_faqs table
CREATE TABLE IF NOT EXISTS wedding_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  button_text TEXT,
  button_link TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wedding_registry table
CREATE TABLE IF NOT EXISTS wedding_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  fund_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT,
  stripe_product_id TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wedding_shops table
CREATE TABLE IF NOT EXISTS wedding_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  details TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wedding_settings table
CREATE TABLE IF NOT EXISTS wedding_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE UNIQUE,
  pin_codes JSONB DEFAULT '[]'::jsonb,
  whatsapp_group_link TEXT,
  lapse_event_codes JSONB DEFAULT '{}'::jsonb,
  google_sheets_id TEXT,
  custom_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_weddings_slug ON weddings(slug);
CREATE INDEX idx_weddings_status ON weddings(status);
CREATE INDEX idx_weddings_created_by ON weddings(created_by);
CREATE INDEX idx_wedding_admins_wedding_id ON wedding_admins(wedding_id);
CREATE INDEX idx_wedding_admins_user_id ON wedding_admins(user_id);
CREATE INDEX idx_wedding_events_wedding_id ON wedding_events(wedding_id);
CREATE INDEX idx_wedding_events_slug ON wedding_events(slug);
CREATE INDEX idx_wedding_schedule_wedding_id ON wedding_schedule(wedding_id);
CREATE INDEX idx_schedule_items_schedule_id ON schedule_items(schedule_id);
CREATE INDEX idx_wedding_travel_cards_wedding_id ON wedding_travel_cards(wedding_id);
CREATE INDEX idx_wedding_faqs_wedding_id ON wedding_faqs(wedding_id);
CREATE INDEX idx_wedding_registry_wedding_id ON wedding_registry(wedding_id);
CREATE INDEX idx_wedding_shops_wedding_id ON wedding_shops(wedding_id);
CREATE INDEX idx_wedding_settings_wedding_id ON wedding_settings(wedding_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_weddings_updated_at BEFORE UPDATE ON weddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_events_updated_at BEFORE UPDATE ON wedding_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_schedule_updated_at BEFORE UPDATE ON wedding_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_items_updated_at BEFORE UPDATE ON schedule_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_travel_cards_updated_at BEFORE UPDATE ON wedding_travel_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_faqs_updated_at BEFORE UPDATE ON wedding_faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_registry_updated_at BEFORE UPDATE ON wedding_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_shops_updated_at BEFORE UPDATE ON wedding_shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_settings_updated_at BEFORE UPDATE ON wedding_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_travel_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weddings table
CREATE POLICY "Public can view live weddings" ON weddings
  FOR SELECT USING (status = 'live');

CREATE POLICY "Users can view their own weddings" ON weddings
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM wedding_admins WHERE wedding_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own weddings" ON weddings
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own weddings" ON weddings
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM wedding_admins WHERE wedding_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Users can delete their own weddings" ON weddings
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for wedding_admins
CREATE POLICY "Wedding admins can view their assignments" ON wedding_admins
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND created_by = auth.uid())
  );

CREATE POLICY "Wedding owners can manage admins" ON wedding_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND created_by = auth.uid())
  );

-- RLS Policies for wedding-related tables (events, schedule, etc.)
-- These allow public viewing for live weddings and admin access for owners

CREATE POLICY "Public can view events for live weddings" ON wedding_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND status = 'live')
  );

CREATE POLICY "Admins can manage wedding events" ON wedding_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

CREATE POLICY "Public can view schedule for live weddings" ON wedding_schedule
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND status = 'live')
  );

CREATE POLICY "Admins can manage wedding schedule" ON wedding_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

CREATE POLICY "Public can view schedule items for live weddings" ON schedule_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wedding_schedule ws
      JOIN weddings w ON ws.wedding_id = w.id
      WHERE ws.id = schedule_id AND w.status = 'live'
    )
  );

CREATE POLICY "Admins can manage schedule items" ON schedule_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM wedding_schedule ws
      JOIN weddings w ON ws.wedding_id = w.id
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE ws.id = schedule_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

CREATE POLICY "Public can view travel cards for live weddings" ON wedding_travel_cards
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND status = 'live')
  );

CREATE POLICY "Admins can manage travel cards" ON wedding_travel_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

CREATE POLICY "Public can view FAQs for live weddings" ON wedding_faqs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND status = 'live')
  );

CREATE POLICY "Admins can manage FAQs" ON wedding_faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

CREATE POLICY "Public can view registry for live weddings" ON wedding_registry
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND status = 'live')
  );

CREATE POLICY "Admins can manage registry" ON wedding_registry
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

CREATE POLICY "Public can view shops for live weddings" ON wedding_shops
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND status = 'live')
  );

CREATE POLICY "Admins can manage shops" ON wedding_shops
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

CREATE POLICY "Public can view settings for live weddings" ON wedding_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM weddings WHERE id = wedding_id AND status = 'live')
  );

CREATE POLICY "Admins can manage settings" ON wedding_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings w
      LEFT JOIN wedding_admins wa ON w.id = wa.wedding_id
      WHERE w.id = wedding_id AND (w.created_by = auth.uid() OR wa.user_id = auth.uid())
    )
  );

-- Add wedding_id to existing tables for multi-wedding support (if needed in future)
-- Note: Not modifying existing tables as per instructions, but documenting for reference
-- Future: guests, rsvps, and comments tables already have wedding_id support

