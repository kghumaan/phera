import { DRAFT_COUPLE_NAME } from '@/lib/constants/wedding-placeholders';

export const PLANNER_PER_WEDDING_AMOUNT_CENTS = 24900;
export const PLANNER_PER_WEDDING_CURRENCY = 'usd';
const PLANNER_BRAND_PRIMARY = '#DE3F5E';
const PLANNER_DEFAULT_BG = '/images/backgrounds/blue-clouds.webp';

export function generateWeddingSlug(coupleName: string): string {
  return coupleName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface PlannerWeddingDefaults {
  slug: string;
  couple_name: string;
  wedding_date: string;
  wedding_date_display: string;
  venue_name: string;
  venue_location: string;
  rsvp_deadline: string;
  status: 'draft';
  created_by: string;
  background_image: string;
  primary_color: string;
}

export function buildPlannerWeddingDefaults(
  slug: string,
  coupleName: string,
  userId: string,
): PlannerWeddingDefaults {
  return {
    slug,
    couple_name: coupleName,
    wedding_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    wedding_date_display: 'TBD',
    venue_name: 'TBD',
    venue_location: 'TBD',
    rsvp_deadline: 'TBD',
    status: 'draft',
    created_by: userId,
    background_image: PLANNER_DEFAULT_BG,
    primary_color: PLANNER_BRAND_PRIMARY,
  };
}

/**
 * Draft defaults for a planner wedding created BEFORE the couple's name is
 * known — the agent asks for it as onboarding step 1 in the Planner chat.
 * Mirrors the placeholders in app/api/agent/onboard/start (epoch date =
 * "date not set", 'Venue TBD', DRAFT_COUPLE_NAME) so the agent snapshot and
 * sidebar treat both drafts identically. Slug should be an unguessable UUID.
 */
export function buildPlannerDraftDefaults(slug: string, userId: string) {
  return {
    slug,
    couple_name: DRAFT_COUPLE_NAME,
    partner1_name: '',
    partner2_name: '',
    wedding_date: new Date(0).toISOString(),
    wedding_date_display: 'Dates TBD',
    venue_name: 'Venue TBD',
    venue_location: '',
    rsvp_deadline: '',
    status: 'draft' as const,
    created_by: userId,
    background_image: PLANNER_DEFAULT_BG,
    primary_color: PLANNER_BRAND_PRIMARY,
    couple_images: ['/images/couple/placeholder1.png', '/images/couple/placeholder2.png'],
    couple_image_url: '/images/couple/placeholder1.png',
  };
}

export async function findUniqueSlug(
  baseSlug: string,
  isAvailable: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (!(await isAvailable(slug))) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}
