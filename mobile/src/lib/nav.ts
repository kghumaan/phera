import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';

/**
 * The wedding slug for the current admin screen.
 *
 * Tab screens mounted by a tab press (not a URL navigation) can see an
 * empty `useLocalSearchParams` even though the [weddingSlug] segment is
 * in the URL — fall back to the global params, which always reflect the
 * deepest active route.
 */
export function useWeddingSlug(): string {
  const local = useLocalSearchParams<{ weddingSlug?: string }>();
  const global = useGlobalSearchParams<{ weddingSlug?: string }>();
  return local.weddingSlug ?? global.weddingSlug ?? '';
}
