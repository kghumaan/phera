/**
 * Loose name matching for the guest-facing name-select step.
 *
 * Rules:
 * - Normalise (lowercase, diacritic-fold, strip non-alphanumerics).
 * - Split both the query and the guest's searchable tokens on whitespace.
 * - A guest matches if AT LEAST ONE query token is a prefix of ANY guest
 *   token (name + plus-one name combined).
 * - If ANY candidate hits EVERY query token (strict match), narrow to
 *   strict matches only; otherwise fall back to the loose set.
 */

export interface GuestForMatch {
  id: string;
  name: string;
  logistics_data?: {
    plus_one_name?: string | null;
    party_size?: number;
  } & Record<string, unknown> | null;
  avatar_color?: string | null;
  initials?: string | null;
}

export interface NameMatchResult {
  id: string;
  name: string;
  plusOneName: string | null;
  partySize: number;
  avatarColor: string | null;
  initials: string | null;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean);
}

export function matchGuestsByName(query: string, guests: GuestForMatch[]): NameMatchResult[] {
  const queryTokens = tokens(query);
  if (queryTokens.length === 0) return [];

  type Tagged = NameMatchResult & { allTokensHit: boolean };
  const matches: Tagged[] = [];

  for (const g of guests) {
    const nameTokens = tokens(g.name || '');
    const plusOneName = (g.logistics_data?.plus_one_name as string | undefined) || null;
    const plusOneTokens = plusOneName ? tokens(plusOneName) : [];
    const searchSet = [...nameTokens, ...plusOneTokens];
    if (searchSet.length === 0) continue;

    const hits = queryTokens.map(qt => searchSet.some(nt => nt.startsWith(qt)));
    if (!hits.some(Boolean)) continue;

    matches.push({
      id: g.id,
      name: g.name,
      plusOneName,
      partySize: Number(g.logistics_data?.party_size ?? 1),
      avatarColor: g.avatar_color ?? null,
      initials: g.initials ?? null,
      allTokensHit: hits.every(Boolean),
    });
  }

  const strict = matches.filter(m => m.allTokensHit);
  const chosen = strict.length > 0 ? strict : matches;
  return chosen.map(({ allTokensHit: _a, ...rest }) => rest);
}
