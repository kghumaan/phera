import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * DEV-ONLY test bypass for the anonymous landing-chat flow.
 *
 * When "Allow anonymous sign-ins" is off in the Supabase project (or email
 * confirmation blocks throwaway signUps), local testing of the hero-chat →
 * planner flow would dead-end at the auth wall. This route mints a confirmed
 * throwaway user with the service role and hands the credentials back so the
 * client can signInWithPassword and continue.
 *
 * Hard-gated to development builds: it 404s in production regardless of who
 * calls it, and the created user is a normal (non-anonymous) account — so the
 * agent's ANONYMOUS behaviors (signup card, turn cap) still require the real
 * anonymous-sign-ins toggle to test.
 */
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase service configuration' }, { status: 500 });
  }
  const admin = createClient(url, serviceKey);
  const suffix = globalThis.crypto?.randomUUID?.().slice(0, 12) ?? String(Date.now());
  const email = `dev-anon-${suffix}@phera.dev`;
  const password = `dev-${suffix}-${Math.random().toString(36).slice(2, 10)}`;
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ email, password });
}
