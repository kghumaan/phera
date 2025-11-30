-- Create agent_waitlist table for tracking waitlist signups
CREATE TABLE IF NOT EXISTS agent_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  cta_type TEXT CHECK (cta_type IN ('waitlist', 'pre-order', 'learn-more')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_preorders table for tracking pre-orders
CREATE TABLE IF NOT EXISTS agent_preorders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  bundle_type TEXT,
  deposit_amount INTEGER DEFAULT 0,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_waitlist_email ON agent_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_agent_waitlist_agent ON agent_waitlist(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_waitlist_created ON agent_waitlist(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_preorders_email ON agent_preorders(email);
CREATE INDEX IF NOT EXISTS idx_agent_preorders_agent ON agent_preorders(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_preorders_created ON agent_preorders(created_at DESC);

-- Enable Row Level Security
ALTER TABLE agent_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_preorders ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - customize for production)
CREATE POLICY "Allow all operations on agent_waitlist" ON agent_waitlist
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on agent_preorders" ON agent_preorders
  FOR ALL USING (true) WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE agent_waitlist IS 'Stores email addresses of users interested in wedding planning agents';
COMMENT ON TABLE agent_preorders IS 'Stores pre-order information for wedding planning agents';
COMMENT ON COLUMN agent_waitlist.cta_type IS 'The type of CTA clicked: waitlist, pre-order, or learn-more';
COMMENT ON COLUMN agent_preorders.bundle_type IS 'Optional bundle type if pre-ordering a bundle';

