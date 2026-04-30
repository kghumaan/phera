-- Guest Households
--
-- Lets admins group guests (couples, families, plus-ones) and pick one
-- as the primary contact. Outreach + RSVP flows talk to the primary;
-- their reply covers the whole household.
--
-- Apply to phera-test FIRST, run integration tests, then production.

-- ============================================================
-- 1. Households table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.guest_households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,                 -- slug, matches existing pattern
  name TEXT,                                -- optional "Sharma Family"
  primary_guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Membership: each guest can belong to at most one household
-- ============================================================
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS household_id UUID
    REFERENCES public.guest_households(id) ON DELETE SET NULL;

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_guest_households_wedding
  ON public.guest_households(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guest_households_primary
  ON public.guest_households(primary_guest_id);
CREATE INDEX IF NOT EXISTS idx_guests_household
  ON public.guests(household_id);

-- ============================================================
-- 4. updated_at auto-bump
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guest_households_set_updated_at ON public.guest_households;
CREATE TRIGGER guest_households_set_updated_at
  BEFORE UPDATE ON public.guest_households
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. Row-level security (slug-based, matches guests table)
-- ============================================================
ALTER TABLE public.guest_households ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_households_select" ON public.guest_households;
CREATE POLICY "guest_households_select" ON public.guest_households
  FOR SELECT USING (public.is_wedding_owner_or_admin_by_slug(wedding_id));

DROP POLICY IF EXISTS "guest_households_insert" ON public.guest_households;
CREATE POLICY "guest_households_insert" ON public.guest_households
  FOR INSERT WITH CHECK (public.is_wedding_owner_or_admin_by_slug(wedding_id));

DROP POLICY IF EXISTS "guest_households_update" ON public.guest_households;
CREATE POLICY "guest_households_update" ON public.guest_households
  FOR UPDATE USING (public.is_wedding_owner_or_admin_by_slug(wedding_id))
              WITH CHECK (public.is_wedding_owner_or_admin_by_slug(wedding_id));

DROP POLICY IF EXISTS "guest_households_delete" ON public.guest_households;
CREATE POLICY "guest_households_delete" ON public.guest_households
  FOR DELETE USING (public.is_wedding_owner_or_admin_by_slug(wedding_id));

-- ============================================================
-- 6. Sanity: primary must belong to the household it heads
--    (enforced via deferred check after both rows exist)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_primary_in_household()
RETURNS TRIGGER AS $$
DECLARE
  primary_household UUID;
BEGIN
  SELECT household_id INTO primary_household
    FROM public.guests
    WHERE id = NEW.primary_guest_id;

  -- Allow during creation: caller will set guests.household_id immediately after.
  -- Reject if primary belongs to a DIFFERENT household.
  IF primary_household IS NOT NULL AND primary_household <> NEW.id THEN
    RAISE EXCEPTION 'primary_guest_id % belongs to a different household (%)',
      NEW.primary_guest_id, primary_household;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guest_households_check_primary ON public.guest_households;
CREATE TRIGGER guest_households_check_primary
  AFTER INSERT OR UPDATE OF primary_guest_id ON public.guest_households
  FOR EACH ROW EXECUTE FUNCTION public.check_primary_in_household();

-- ============================================================
-- 7. Legacy sync — keep is_family_liaison + liaison_for accurate so
--    existing AI / webhook code keeps working without immediate refactor.
--    Recompute on any guest membership change OR primary change.
-- ============================================================
CREATE OR REPLACE FUNCTION public.recompute_household_liaison(hh_id UUID)
RETURNS VOID AS $$
DECLARE
  primary_id UUID;
  member_ids UUID[];
BEGIN
  IF hh_id IS NULL THEN
    RETURN;
  END IF;

  SELECT primary_guest_id INTO primary_id
    FROM public.guest_households WHERE id = hh_id;

  SELECT array_agg(id) INTO member_ids
    FROM public.guests
    WHERE household_id = hh_id AND id <> primary_id;

  UPDATE public.guests
    SET is_family_liaison = false, liaison_for = NULL
    WHERE household_id = hh_id;

  IF primary_id IS NOT NULL AND member_ids IS NOT NULL AND array_length(member_ids, 1) > 0 THEN
    UPDATE public.guests
      SET is_family_liaison = true, liaison_for = member_ids
      WHERE id = primary_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.guests_sync_liaison_trg()
RETURNS TRIGGER AS $$
BEGIN
  -- Recompute both old + new household when membership changes
  IF TG_OP = 'UPDATE' AND OLD.household_id IS DISTINCT FROM NEW.household_id THEN
    PERFORM public.recompute_household_liaison(OLD.household_id);
    PERFORM public.recompute_household_liaison(NEW.household_id);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.recompute_household_liaison(NEW.household_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_household_liaison(OLD.household_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guests_sync_liaison ON public.guests;
CREATE TRIGGER guests_sync_liaison
  AFTER INSERT OR UPDATE OF household_id OR DELETE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.guests_sync_liaison_trg();

CREATE OR REPLACE FUNCTION public.households_sync_liaison_trg()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recompute_household_liaison(COALESCE(NEW.id, OLD.id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guest_households_sync_liaison ON public.guest_households;
CREATE TRIGGER guest_households_sync_liaison
  AFTER INSERT OR UPDATE OF primary_guest_id OR DELETE ON public.guest_households
  FOR EACH ROW EXECUTE FUNCTION public.households_sync_liaison_trg();
