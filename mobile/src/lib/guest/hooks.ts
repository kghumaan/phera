import { useQuery } from '@tanstack/react-query';

import { fetchInvitedEventIds } from './access';
import { getGuestSession } from './session';

/**
 * Event ids the current guest is invited to, or null when all events are
 * visible (no session / preview / API unreachable — fail open like web).
 */
export function useInvitedEventIds(weddingSlug: string) {
  return useQuery({
    queryKey: ['invited-events', weddingSlug],
    queryFn: async (): Promise<string[] | null> => {
      const session = await getGuestSession(weddingSlug);
      return fetchInvitedEventIds(weddingSlug, session?.guestId ?? null);
    },
  });
}
