import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { buildOutreachEmail } from '@/lib/ops/outreach-email';

export const dynamic = 'force-dynamic';

type Body = {
  toEmail: string;
  subject?: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

// Send a one-off copy of the outreach email to an arbitrary address.
// NOT logged in ops_user_outreach (that table requires user_id NOT NULL).
// Intended for builder to preview what recipients actually see in their real inbox.
export async function POST(request: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const toEmail = (body.toEmail || '').trim();
  if (!toEmail || !toEmail.includes('@')) {
    return NextResponse.json({ error: 'Valid toEmail required' }, { status: 400 });
  }

  const envFrom =
    process.env.OPS_OUTREACH_FROM_EMAIL || 'KV at Phera <kv@phera.io>';
  const envReplyTo = process.env.OPS_OUTREACH_REPLY_TO || 'kv@phera.io';
  const fromEmail = (body.from?.trim() || envFrom).trim();
  const replyTo = (body.replyTo?.trim() || envReplyTo).trim();
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phera.io';

  const built = buildOutreachEmail({
    toEmail,
    firstName: null,
    signupRelative: '',
    appBaseUrl,
    replyTo,
  });

  const subject = body.subject ?? built.subject;
  const html = body.html ?? built.html;
  const text = body.text ?? built.text;

  const resend = new Resend(resendKey);
  try {
    const res = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
      text,
      replyTo: replyTo || undefined,
    });
    if (res.error) {
      return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, providerMessageId: res.data?.id ?? null });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
