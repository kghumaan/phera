-- Add "venue" and "hotel" to the vendor_directory category enum so we can
-- source and list places to HOST weddings (venues) and guest accommodation
-- (hotels) alongside the existing service vendors.
--
-- Apply to phera-test FIRST, verify, then production (per project policy).
-- `ADD VALUE IF NOT EXISTS` is idempotent and safe to re-run.
--
-- NOTE: these new enum values must be committed before any row can be inserted
-- with them. In the Supabase SQL editor each statement auto-commits, so running
-- this file top-to-bottom is sufficient; the ingest script can run afterwards.

ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'venue';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'hotel';
