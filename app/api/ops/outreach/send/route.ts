import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getOpsSupabaseAdmin } from '@/lib/ops/supabase-admin';
import {
  buildOutreachEmail,
  deriveFirstName,
  relativeTime,
} from '@/lib/ops/outreach-email';

export const dynamic = 'force-dynamic';

type Body = {
  userId: string;
  // Optional overrides — user may edit subject/body in the modal.
  subject?: string;
  html?: string;
  text?: string;
  from?: string; // e.g. "KV at Phera <kv@phera.io>" — must use a Resend-verified domain
  notes?: string;
  overrideFirstName?: string;
};

const DEFAULT_KIND = 'onboarding_hello';

export async function POST(request: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  // Ops outreach is personal (KV → user). Do NOT fall back to the generic
  // RESEND_FROM_EMAIL (that's for system mail like wedding-team invites).
  // Canonical default is kv@phera.io so replies always hit the builder inbox.
  const envFrom =
    process.env.OPS_OUTREACH_FROM_EMAIL || 'KV at Phera <kv@phera.io>';
  const replyTo = process.env.OPS_OUTREACH_REPLY_TO || 'kv@phera.io';
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phera.io';

  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const fromEmail = (body.from?.trim() || envFrom || '').trim();
  if (!fromEmail) {
    return NextResponse.json(
      { error: 'No sender. Provide `from` in body or set OPS_OUTREACH_FROM_EMAIL.' },
      { status: 400 },
    );
  }

  const supabase = getOpsSupabaseAdmin();

  // Load the user (need email + metadata).
  const userRes = await supabase.auth.admin.getUserById(body.userId);
  if (userRes.error || !userRes.data.user) {
    return NextResponse.json(
      { error: userRes.error?.message || 'User not found' },
      { status: 404 },
    );
  }
  const user = userRes.data.user;
  if (!user.email) {
    return NextResponse.json(
      { error: 'User has no email on record' },
      { status: 400 },
    );
  }

  const firstName =
    body.overrideFirstName ||
    deriveFirstName({
      email: user.email,
      user_metadata: (user.user_metadata as Record<string, unknown> | null) ?? null,
    });

  const built = buildOutreachEmail({
    toEmail: user.email,
    firstName,
    signupRelative: relativeTime(user.created_at),
    appBaseUrl,
    replyTo: replyTo || '',
    logoSrc: '',
  });

  const subject = body.subject ?? built.subject;
  const html = body.html ?? built.html;
  const text = body.text ?? built.text;

  const resend = new Resend(resendKey);
  let providerMessageId: string | null = null;
  let sendError: string | null = null;

  try {
    const res = await resend.emails.send({
      from: fromEmail,
      to: [user.email],
      subject,
      html,
      text,
      replyTo: replyTo || undefined,
    });
    if (res.error) {
      sendError = res.error.message;
    } else {
      providerMessageId = res.data?.id ?? null;
    }
  } catch (err) {
    sendError = (err as Error).message;
  }

  // Log either way.
  const { error: logErr } = await supabase.from('ops_user_outreach').insert({
    user_id: user.id,
    user_email: user.email,
    kind: DEFAULT_KIND,
    channel: 'email',
    from_email: fromEmail,
    subject,
    body_text: text,
    body_html: html,
    provider_message_id: providerMessageId,
    status: sendError ? 'failed' : 'sent',
    error: sendError,
    notes: body.notes || null,
    sent_by: 'manual:ops',
  });

  if (sendError) {
    return NextResponse.json(
      { ok: false, error: sendError, logged: !logErr },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    providerMessageId,
    logged: !logErr,
    logError: logErr?.message ?? null,
  });
}
