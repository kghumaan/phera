import { NextRequest, NextResponse } from 'next/server';
import { getOpsPin, OPS_COOKIE_NAME, OPS_SESSION_MAX_AGE_SECONDS } from '@/lib/ops/constants';
import { signOpsSession } from '@/lib/ops/auth';

// In-memory rate limit per process (good enough for internal route).
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function check(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}

function slowEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const { ok, retryAfter } = check(ip);
  if (!ok) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${Math.ceil((retryAfter || 60) / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  let body: { pin?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const pin = String(body.pin || '');
  if (!pin) return NextResponse.json({ error: 'Missing pin' }, { status: 400 });

  if (!slowEquals(pin, getOpsPin())) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(OPS_COOKIE_NAME, await signOpsSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: OPS_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
