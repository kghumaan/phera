import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiter. Resets on deploy/restart (acceptable for Vercel serverless).
const windowMap = new Map<string, { count: number; resetAt: number }>();

// Clean up stale entries periodically
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of windowMap) {
    if (now > entry.resetAt) windowMap.delete(key);
  }
}

/**
 * Check rate limit for a request. Returns null if allowed, or a 429 NextResponse if rate limited.
 */
export function checkRateLimit(
  request: NextRequest,
  { maxRequests = 5, windowMs = 60_000, keyPrefix = '' } = {}
): NextResponse | null {
  cleanup();

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const entry = windowMap.get(key);

  if (!entry || now > entry.resetAt) {
    windowMap.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    const minutes = Math.ceil(retryAfter / 60);
    return NextResponse.json(
      { error: `You've made too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} and try again.`, retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  entry.count++;
  return null;
}
