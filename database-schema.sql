-- Supabase Database Schema for Phera Wedding Platform
-- Run this in your Supabase SQL Editor

-- Guests table with wedding_id for multi-wedding support
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  wedding_id TEXT NOT NULL,
  auth_method TEXT DEFAULT 'email', -- 'google', 'phone', 'email'
  wedding_side TEXT, -- 'bride', 'groom', 'both'
  initials TEXT GENERATED ALWAYS AS (
    UPPER(SUBSTRING(SPLIT_PART(name, ' ', 1) FROM 1 FOR 1) || 
    SUBSTRING(SPLIT_PART(name, ' ', -1) FROM 1 FOR 1))
  ) STORED,
  avatar_color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, wedding_id)
);

-- RSVP responses with wedding_id association
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  event_id TEXT NOT NULL, -- 'mehendi-ceremony', 'sangeet-night', 'wedding-ceremony', etc.
  attending BOOLEAN NOT NULL,
  guest_count INTEGER DEFAULT 1,
  plus_one_name TEXT, -- Added for plus one details
  plus_one_email TEXT, -- Added for plus one details
  dietary_restrictions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_id, event_id, wedding_id)
);

-- Comments/Messages with wedding_id association
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies for guests table
CREATE POLICY "Allow all operations on guests" ON guests
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for rsvps table  
CREATE POLICY "Allow all operations on rsvps" ON rsvps
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for comments table
CREATE POLICY "Allow all operations on comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for comments (for live updates)
ALTER TABLE comments REPLICA IDENTITY FULL;

-- Create indexes for better performance
CREATE INDEX idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX idx_guests_email_wedding ON guests(email, wedding_id);
CREATE INDEX idx_guests_auth_method ON guests(auth_method);
CREATE INDEX idx_rsvps_wedding_id ON rsvps(wedding_id);
CREATE INDEX idx_rsvps_guest_event ON rsvps(guest_id, event_id);
CREATE INDEX idx_comments_wedding_id ON comments(wedding_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC); 