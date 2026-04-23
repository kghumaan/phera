/**
 * Email template for builder-facing onboarding outreach from /ops.
 * Personal tone (KV → user). Phera logo, brand pink CTA, short.
 */

export type OutreachEmailParams = {
  toEmail: string;
  firstName: string | null;
  signupRelative: string; // kept for compatibility — no longer shown in copy
  appBaseUrl: string;
  replyTo: string;
  /**
   * Deprecated — kept for backwards compat with callers still passing a value.
   * Logo was dropped because Gmail rendered Resend CID attachments as paperclip
   * attachments instead of inline. Header is now a text wordmark.
   */
  logoSrc?: string;
};

const BRAND_PINK = '#DE3F5E';
const BG = '#FFF7F8';
const TEXT_STRONG = '#1a1a1a';
const TEXT_MUTED = '#4a4a4a';
const TEXT_FAINT = '#9a9a9a';

export function buildOutreachEmail({
  appBaseUrl,
}: OutreachEmailParams): { subject: string; html: string; text: string } {
  // Greeting is generic "Hello!" — no name risk, more casual.
  const subject = 'Quick hello from Phera';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 4px 24px rgba(26,26,26,0.06);border:1px solid rgba(0,0,0,0.04);">

              <p style="margin:0 0 14px;font-size:16px;color:${TEXT_STRONG};line-height:1.55;">
                Hello!
              </p>

              <p style="margin:0 0 14px;font-size:16px;color:${TEXT_MUTED};line-height:1.6;">
                I'm KV, founder of Phera — wanted to reach out and say hello.
              </p>

              <p style="margin:0 0 14px;font-size:16px;color:${TEXT_MUTED};line-height:1.6;">
                Is there something specific we can help with, or something you were looking for when you signed up? Happy to point you in the right direction either way.
              </p>

              <p style="margin:0 0 28px;font-size:16px;color:${TEXT_MUTED};line-height:1.6;">
                We're also running a small beta right now — a handful of couples get our full guest-logistics service for free in exchange for feedback. Let me know if you're interested. Happy to jump on a quick call if you'd prefer that over email.
              </p>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:14px;background:${BRAND_PINK};">
                    <a href="${appBaseUrl}/admin"
                       style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:14px;background:${BRAND_PINK};">
                      Open your dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:14px;color:${TEXT_MUTED};line-height:1.6;">
                — KV<br/>
                <span style="color:${TEXT_FAINT};font-size:13px;">Founder, Phera · phera.io</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 8px 0;">
              <p style="margin:0;font-size:12px;color:${TEXT_FAINT};line-height:1.6;">
                Sent to you because you signed up at phera.io.<br/>
                Reply directly — I'll see it.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#c9c9c9;">
                © ${new Date().getFullYear()} Phera · Indian wedding logistics, handled
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    'Hello!',
    '',
    "I'm KV, founder of Phera — wanted to reach out and say hello.",
    '',
    'Is there something specific we can help with, or something you were looking for when you signed up? Happy to point you in the right direction either way.',
    '',
    "We're also running a small beta right now — a handful of couples get our full guest-logistics service for free in exchange for feedback. Let me know if you're interested. Happy to jump on a quick call if you'd prefer that over email.",
    '',
    `Dashboard: ${appBaseUrl}/admin`,
    '',
    '— KV',
    'Founder, Phera · phera.io',
  ].join('\n');

  return { subject, html, text };
}

// Utility so send endpoint + cron share relative-time phrasing
export function relativeTime(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

// Derive a first-name from auth user metadata or email local-part.
export function deriveFirstName(u: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string | null {
  const meta = u.user_metadata ?? null;
  const full =
    (meta?.full_name as string | undefined) ??
    (meta?.name as string | undefined) ??
    (meta?.first_name as string | undefined) ??
    null;
  if (full) {
    const first = full.trim().split(/\s+/)[0];
    if (first) return capitalize(first);
  }
  if (u.email) {
    const local = u.email.split('@')[0] || '';
    const cleaned = local.replace(/[._-].*$/, '').replace(/[0-9]+$/, '');
    if (cleaned) return capitalize(cleaned);
  }
  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
