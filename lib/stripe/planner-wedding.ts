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
