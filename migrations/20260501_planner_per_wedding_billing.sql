-- Per-wedding billing for planners ($249/wedding).
--
-- Adds Stripe customer + saved payment method to user_settings so we can
-- charge planners off-session for each new wedding after the first checkout.
-- Adds wedding_payments table to record successful per-wedding charges.
--
-- Run manually in Supabase SQL editor against BOTH phera-test and production.

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_default_payment_method_id text;

CREATE TABLE IF NOT EXISTS public.wedding_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wedding_slug text,
  stripe_payment_intent_id text NOT NULL UNIQUE,
  stripe_checkout_session_id text,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL,
  tier text NOT NULL DEFAULT 'planner_perwedding',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wedding_payments_user_id
  ON public.wedding_payments (user_id);

CREATE INDEX IF NOT EXISTS idx_wedding_payments_wedding_slug
  ON public.wedding_payments (wedding_slug);

ALTER TABLE public.wedding_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wedding_payments_owner_select ON public.wedding_payments;
CREATE POLICY wedding_payments_owner_select
  ON public.wedding_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts/updates only happen via the service role (webhooks + server routes).
-- No INSERT/UPDATE/DELETE policy granted to authenticated users.
