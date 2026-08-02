import { API_BASE } from '@/lib/config';
import { FIXTURE_GUESTS } from '@/lib/mock/fixtures';
import { inMockMode } from '@/lib/supabase/client';

/**
 * Guest access client — same two-step gate as web PinEntry:
 * 1. verify the wedding password  (POST /api/access/verify-password)
 * 2. loose name match             (POST /api/access/match-name)
 * Preview mode: any password ≥4 chars works; matches come from fixtures.
 */

export interface NameMatch {
  id: string;
  name: string;
  plusOneName?: string | null;
  partySize: number;
  avatarColor: string | null;
  initials: string | null;
}

export interface PasswordResult {
  valid: boolean;
  /** Server-provided reason (rate limit, no password configured, …). */
  error?: string;
}

export async function verifyPassword(
  weddingSlug: string,
  password: string,
): Promise<PasswordResult> {
  if (inMockMode()) {
    return password.trim().length >= 4
      ? { valid: true }
      : { valid: false, error: 'Incorrect password. Please try again.' };
  }
  try {
    const res = await fetch(`${API_BASE}/api/access/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weddingSlug, password }),
    });
    const json = (await res.json()) as { valid?: boolean; error?: string };
    if (json.valid) return { valid: true };
    return { valid: false, error: json.error || 'Incorrect password. Please try again.' };
  } catch {
    return { valid: false, error: 'Something went wrong. Please try again.' };
  }
}

/**
 * Per-guest event visibility — mirrors web events/page.tsx:33: default-true
 * opt-out via guest_event_access. Returns null when everything is visible
 * (no guest picked, preview mode, or the API is unreachable — the web
 * fails open the same way).
 */
export async function fetchInvitedEventIds(
  weddingSlug: string,
  guestId: string | null,
): Promise<string[] | null> {
  if (inMockMode() || !guestId) return null;
  try {
    const res = await fetch(
      `${API_BASE}/api/access/events/${weddingSlug}?guestId=${encodeURIComponent(guestId)}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { invitedEventIds?: string[] };
    return Array.isArray(json.invitedEventIds) ? json.invitedEventIds : null;
  } catch {
    return null;
  }
}

export async function matchName(
  weddingSlug: string,
  query: string,
  password: string,
): Promise<NameMatch[]> {
  if (inMockMode()) {
    const q = query.trim().toLowerCase();
    return FIXTURE_GUESTS.filter((g) => g.name.toLowerCase().includes(q))
      .slice(0, 20)
      .map((g) => ({
        id: g.id,
        name: g.name,
        partySize: g.logistics_data?.party_size ?? 1,
        avatarColor: g.avatar_color,
        initials: g.initials,
      }));
  }
  const res = await fetch(`${API_BASE}/api/access/match-name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weddingSlug, query, password }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { matches: NameMatch[] };
  return json.matches ?? [];
}
