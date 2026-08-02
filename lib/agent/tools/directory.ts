import type { AgentToolDefinition, VenueCard } from '../types';
import { queryVendors } from '@/lib/vendors/directory/service';
import { estimateGuestCapacity, estimateWeddingCostUsd } from '@/lib/vendors/estimates';
import {
  VENDOR_CATEGORY_LABELS,
  VENDOR_CITY_CONFIG,
  type VendorCategory,
} from '@/lib/vendors/directory/types';

const CATEGORY_ENUM = Object.keys(VENDOR_CATEGORY_LABELS) as VendorCategory[];
const COVERED_CITIES = VENDOR_CITY_CONFIG.map((c) => c.city).join(', ');

/**
 * Read-only access to Phera's *public* vendor directory (the same data behind
 * the /vendors page) so the Planner can recommend venues, hotels, and vendors
 * the couple hasn't chosen yet. Distinct from `get_vendors`, which lists the
 * couple's own booked vendors.
 */
export const directoryTools: AgentToolDefinition[] = [
  {
    name: 'search_vendor_directory',
    label: 'Searching the vendor directory',
    risk: 'read',
    description:
      `Search Phera's curated directory of wedding VENUES, HOTELS, and vendors across our covered destination cities (${COVERED_CITIES}). ALWAYS call this FIRST when the couple wants a venue, hotel, or vendor in a covered city — before any thought of escalating to the team — and show them the real matches. Use it for "where could we host the wedding?" (category: venue), "suggest hotels for our guests in Udaipur" (category: hotel), or "find photographers in Goa". Pass their city plus any budget/rating/NRI filters. This is the public directory, NOT the couple's own booked vendors (use get_vendors for those). Returns up to 8 top matches sorted by NRI/destination experience then rating. Only if this returns nothing usable, or their city isn't in the list above, fall back to submit_request.`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: CATEGORY_ENUM,
          description:
            'What to find. Use "venue" for places to host the wedding, "hotel" for guest accommodation, or a vendor type. Omit to search across all categories.',
        },
        city: {
          type: 'string',
          description:
            'Destination city, e.g. "Udaipur", "Goa", "Bali". Omit to search all cities.',
        },
        max_price: {
          type: 'number',
          description: 'Maximum budget in USD (matches listings at or below this, plus those with no listed price).',
        },
        min_rating: {
          type: 'number',
          description: 'Minimum Google rating, 0–5.',
        },
        nri_experience: {
          type: 'boolean',
          description: 'Only return vendors flagged as experienced with NRI / destination weddings.',
        },
      },
      additionalProperties: false,
    },
    execute: async (input) => {
      const results = await queryVendors({
        category: input.category as VendorCategory | undefined,
        city: input.city as string | undefined,
        max_price: input.max_price as number | undefined,
        min_rating: input.min_rating as number | undefined,
        has_nri_experience: input.nri_experience as boolean | undefined,
        limit: 8,
      });

      // Same matches, shaped for the right-pane listing cards. The model still
      // gets the JSON above; the loop peels `venueCards` off to stream the panel.
      const venueCards: VenueCard[] = results.map((v) => ({
        name: v.name,
        category: VENDOR_CATEGORY_LABELS[v.category as VendorCategory] ?? v.category,
        city: v.city,
        country_code: v.country_code,
        rating: v.rating,
        review_count: v.review_count,
        price_min: v.price_range_min,
        price_max: v.price_range_max,
        nri_experienced: v.has_nri_experience,
        specialties: v.specialties,
        website: v.website,
        image: v.portfolio_urls?.[0] ?? null,
        place_id: v.source === 'google_places' ? v.source_id : null,
        // Placeholder estimates (venues/hotels only) — UI shows them behind an
        // info icon, never as confirmed figures.
        capacity: estimateGuestCapacity(v),
        costEstimate: estimateWeddingCostUsd(v),
      }));

      return {
        count: results.length,
        vendors: results.map((v) => ({
          name: v.name,
          category: VENDOR_CATEGORY_LABELS[v.category as VendorCategory] ?? v.category,
          city: v.city,
          country_code: v.country_code,
          rating: v.rating,
          review_count: v.review_count,
          price_usd:
            v.price_range_min != null || v.price_range_max != null
              ? { min: v.price_range_min, max: v.price_range_max }
              : null,
          nri_experienced: v.has_nri_experience,
          specialties: v.specialties,
          website: v.website,
        })),
        note:
          'Public directory listings, also shown to the couple as cards on the right. Contact details are revealed once the couple saves a vendor on the /vendors page.',
        // Only attach when there's something to show — keeps the panel from
        // flashing empty on a no-results search.
        ...(venueCards.length > 0 ? { venueCards } : {}),
      };
    },
  },
];
