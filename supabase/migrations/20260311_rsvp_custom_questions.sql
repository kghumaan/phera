-- Create rsvp_custom_questions table for custom RSVP form steps
CREATE TABLE IF NOT EXISTS public.rsvp_custom_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL REFERENCES public.weddings(slug) ON DELETE CASCADE,
  step_title TEXT NOT NULL,
  insert_after TEXT NOT NULL DEFAULT 'Attendance Details',
  order_index INTEGER NOT NULL DEFAULT 0,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by wedding
CREATE INDEX IF NOT EXISTS idx_rsvp_custom_questions_wedding_id ON public.rsvp_custom_questions(wedding_id);

-- Enable RLS
ALTER TABLE public.rsvp_custom_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies: wedding owner/admin can manage, guests can read
CREATE POLICY "Wedding owners/admins can manage custom questions"
  ON public.rsvp_custom_questions
  FOR ALL
  USING (is_wedding_owner_or_admin_by_slug(wedding_id))
  WITH CHECK (is_wedding_owner_or_admin_by_slug(wedding_id));

CREATE POLICY "Guests can read custom questions for their wedding"
  ON public.rsvp_custom_questions
  FOR SELECT
  USING (true);
