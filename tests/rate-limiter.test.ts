/**
 * Rate Limiter Unit Tests
 *
 * Tests the in-memory rate limiter used by API routes (e.g., PIN verify).
 * Pure unit tests — no external dependencies.
 */

import { describe, it, expect } from 'vitest';

// Minimal mock of NextRequest for the rate limiter
function mockNextRequest(ip: string = '127.0.0.1') {
  return {
    headers: new Map([
      ['x-forwarded-for', ip],
    ]),
  } as any;
}

describe('Rate Limiter', () => {
  it('allows requests under the limit', async () => {
    const { checkRateLimit } = await import('../lib/utils/rate-limiter');

    const uniqueIp = `test-${Date.now()}-allow`;
    const req = mockNextRequest(uniqueIp);

    const result = checkRateLimit(req, { maxRequests: 5, windowMs: 60_000, keyPrefix: 'test-allow' });
    expect(result).toBeNull(); // null = allowed
  });

  it('blocks requests over the limit', async () => {
    const { checkRateLimit } = await import('../lib/utils/rate-limiter');

    const uniqueIp = `test-${Date.now()}-block`;
    const prefix = `test-block-${Date.now()}`;

    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      const req = mockNextRequest(uniqueIp);
      checkRateLimit(req, { maxRequests: 3, windowMs: 60_000, keyPrefix: prefix });
    }

    // Next request should be blocked
    const req = mockNextRequest(uniqueIp);
    const result = checkRateLimit(req, { maxRequests: 3, windowMs: 60_000, keyPrefix: prefix });
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });

  it('different IPs have separate limits', async () => {
    const { checkRateLimit } = await import('../lib/utils/rate-limiter');

    const prefix = `test-separate-${Date.now()}`;
    const ip1 = `test-${Date.now()}-ip1`;
    const ip2 = `test-${Date.now()}-ip2`;

    // Exhaust limit for ip1
    for (let i = 0; i < 2; i++) {
      checkRateLimit(mockNextRequest(ip1), { maxRequests: 2, windowMs: 60_000, keyPrefix: prefix });
    }

    // ip1 should be blocked
    const r1 = checkRateLimit(mockNextRequest(ip1), { maxRequests: 2, windowMs: 60_000, keyPrefix: prefix });
    expect(r1).not.toBeNull();

    // ip2 should still be allowed
    const r2 = checkRateLimit(mockNextRequest(ip2), { maxRequests: 2, windowMs: 60_000, keyPrefix: prefix });
    expect(r2).toBeNull();
  });

  it('returns 429 status with retry info', async () => {
    const { checkRateLimit } = await import('../lib/utils/rate-limiter');

    const uniqueIp = `test-${Date.now()}-429`;
    const prefix = `test-429-${Date.now()}`;

    // Exhaust
    checkRateLimit(mockNextRequest(uniqueIp), { maxRequests: 1, windowMs: 60_000, keyPrefix: prefix });

    // Should get 429 response
    const result = checkRateLimit(mockNextRequest(uniqueIp), { maxRequests: 1, windowMs: 60_000, keyPrefix: prefix });
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });
});
