import { NextRequest, NextResponse } from 'next/server';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';
import {
  buildOutreachTemplate,
  deriveFirstName,
  relativeTime,
} from '@/lib/ops/outreach-email';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const testEmail = url.searchParams.get('testEmail');
  const template = url.searchParams.get('template') || 'onboarding_hello';
  if (!userId && !testEmail) {
    return NextResponse.json({ error: 'userId or testEmail required' }, { status: 400 });
  }

  let user: {
    id: string;
    email: string | null;
    created_at: string;
    user_metadata: Record<string, unknown> | null;
  };

  if (testEmail) {
    user = {
      id: 'test',
      email: testEmail,
      created_at: new Date().toISOString(),
      user_metadata: null,
    };
  } else {
    const supabase = getOpsSupabaseAdmin();
    const userRes = await supabase.auth.admin.getUserById(userId!);
    if (userRes.error || !userRes.data.user) {
      return NextResponse.json(
        { error: userRes.error?.message || 'User not found' },
        { status: 404 },
      );
    }
    const u = userRes.data.user;
    user = {
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      user_metadata: (u.user_metadata as Record<string, unknown> | null) ?? null,
    };
  }
  // Preview: prefer request origin so localhost assets (logo-black.svg) load in the iframe.
  const requestOrigin =
    request.headers.get('origin') ||
    (request.headers.get('host')
      ? `http://${request.headers.get('host')}`
      : null);
  const appBaseUrl =
    requestOrigin || process.env.NEXT_PUBLIC_APP_URL || 'https://phera.io';
  const replyTo = process.env.OPS_OUTREACH_REPLY_TO || '';

  const firstName = deriveFirstName({
    email: user.email ?? null,
    user_metadata: (user.user_metadata as Record<string, unknown> | null) ?? null,
  });

  const built = buildOutreachTemplate(template, {
    toEmail: user.email ?? '',
    firstName,
    signupRelative: relativeTime(user.created_at),
    appBaseUrl,
    replyTo,
    logoSrc: '',
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? null,
      firstName,
    },
    template,
    from:
      process.env.OPS_OUTREACH_FROM_EMAIL ||
      'KV at Phera <kv@phera.io>',
    replyTo: replyTo || 'kv@phera.io',
    subject: built.subject,
    html: built.html,
    text: built.text,
  });
}
