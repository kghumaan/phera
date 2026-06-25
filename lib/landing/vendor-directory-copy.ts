/**
 * Single source of truth for how the landing page describes the vendor
 * directory — consumed by both FeatureStepper (the "Vendors" step) and
 * VendorSpotlightSection so the two can never diverge.
 *
 * The browsable directory is the Supabase `vendor_directory` table. As of
 * 2026-06-25 it holds ~1,259 live vendors (Google Places ingest + curated)
 * across 9 cities. We state a CONSERVATIVE floor ("1,200+") so the copy stays
 * true as the count fluctuates. Re-check with `npx tsx scripts/count-vendors.ts`
 * and only raise the floor when the real count clears the next round number.
 */

/** Conservative floor for the live vendor count — keep at/under the real total. */
export const VENDOR_DIRECTORY_COUNT = 1200;

/** Cities the directory covers — span India + SE Asia + the Gulf (all Asia). */
export const VENDOR_DIRECTORY_CITY_COUNT = 9;

/** One true, non-decaying line about reach. */
export const VENDOR_DIRECTORY_REACH =
  "Asia's top destination-wedding cities — from Udaipur and Goa to Bali, Bangkok, and Dubai";

/** Short headline blurb (with the conservative count). */
export const VENDOR_DIRECTORY_BLURB =
  VENDOR_DIRECTORY_COUNT.toLocaleString() +
  "+ photographers, planners, makeup artists, DJs, mehendi artists, and decorators across " +
  VENDOR_DIRECTORY_REACH +
  " — rated and filterable by budget and NRI experience.";

/** Compact label for the FeatureStepper bullet. */
export const VENDOR_DIRECTORY_SHORT =
  VENDOR_DIRECTORY_COUNT.toLocaleString() +
  "+ vendors across " + VENDOR_DIRECTORY_CITY_COUNT + " destination-wedding cities";
