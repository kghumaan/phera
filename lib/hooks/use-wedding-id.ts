import { useEffect, useState } from 'react';

// Custom hook to get the current wedding ID from the URL
export function useWeddingId(fallbackId: string = 'sim-kv'): string {
  const [weddingId, setWeddingId] = useState<string>(fallbackId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      // Look for wedding IDs in the path
      if (pathParts.length >= 2) {
        const potentialWeddingId = pathParts[1];
        // Avoid matching common routes that aren't wedding IDs
        if (potentialWeddingId && !['api', 'auth', 'admin', 'test-magic-link', 'test-sms', '_next', 'favicon.ico'].includes(potentialWeddingId)) {
          // Also avoid matching Next.js special routes
          if (!['(', '[', 'page'].includes(potentialWeddingId.charAt(0))) {
            setWeddingId(potentialWeddingId);
            return;
          }
        }
      }
    }
    // Default to fallback if no wedding ID is found in path
    setWeddingId(fallbackId);
  }, [fallbackId]);

  return weddingId;
}