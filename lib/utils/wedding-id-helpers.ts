// Helper functions to work with dynamic wedding IDs

// Get the current wedding ID from the URL path
export function getCurrentWeddingId(): string {
  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/');
    // Look for wedding IDs in the path
    // Pattern: /[weddingId]/something or /[weddingId] (as the first meaningful part)
    if (pathParts.length >= 2) {
      const potentialWeddingId = pathParts[1];
      // Avoid matching common routes that aren't wedding IDs
      if (potentialWeddingId && !['api', 'auth', 'admin', 'test-magic-link', 'test-sms'].includes(potentialWeddingId)) {
        // Also avoid matching Next.js special routes
        if (!potentialWeddingId.startsWith('(') && !potentialWeddingId.startsWith('[')) {
          return potentialWeddingId;
        }
      }
    }
  }
  // Default to simran-karanvir if no wedding ID is found in path
  return 'simran-karanvir';
}


// Check if we're on the landing page
export function isOnLandingPage(): boolean {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    // Landing page is exactly "/"
    return pathname === '/';
  }
  return false;
}

// Check if we're on a wedding-specific route
export function isOnWeddingRoute(): boolean {
  // First check if we're on the landing page - if so, we're not on a wedding route
  if (isOnLandingPage()) {
    return false;
  }

  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    // If we have a path segment that's not a common route, we're likely on a wedding route
    if (pathParts.length > 0) {
      const firstSegment = pathParts[0];
      // Avoid matching common routes that aren't wedding IDs
      if (firstSegment && !['api', 'auth', 'admin', 'test-magic-link', 'test-sms'].includes(firstSegment)) {
        // Also avoid matching Next.js special routes
        if (!firstSegment.startsWith('(') && !firstSegment.startsWith('[')) {
          return true;
        }
      }
    }
  }
  return false;
}

// Get the fallback wedding ID (for backward compatibility)
export function getFallbackWeddingId(): string {
  return 'simran-karanvir';
}