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
// Black Phera wordmark (same logo as the landing header), hotlinked from
// phera.io so it renders inline in inboxes. Black version because the email
// canvas is light. 297x80 → shown at 30px tall.
const PHERA_LOGO = 'https://phera.io/logo-black.png';

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

          <!-- Logo (centered in the pink area, above the card) -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <img src="${PHERA_LOGO}" alt="Phera" width="111" height="30" style="display:block;margin:0 auto;height:30px;width:111px;border:0;" />
            </td>
          </tr>

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

// ---------------------------------------------------------------------------
// Template registry. Add a builder + an entry here and it shows up in the
// /ops outreach template picker automatically.
// ---------------------------------------------------------------------------

export type OutreachTemplateKey = 'onboarding_hello' | 'beta_launch';

export const OUTREACH_TEMPLATES: {
  key: OutreachTemplateKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'onboarding_hello',
    label: 'Onboarding hello',
    description: 'Personal hello to a new signup — CTA opens their dashboard.',
  },
  {
    key: 'beta_launch',
    label: 'Beta launch invite',
    description: 'Free-for-first-10 beta invite — CTA books a call on Cal.com.',
  },
];

/** Cal.com booking link used as the beta-launch CTA. */
const CAL_LINK = 'https://cal.com/simmetry-studios/phera?overlayCalendar=true';
/**
 * Cal.com's official logo, hotlinked from their live CDN so it renders in real
 * inboxes immediately (no deploy needed). Kept external on purpose — a
 * self-hosted /public copy would 404 until the app is deployed.
 */
const CAL_LOGO = 'https://cal.com/android-chrome-512x512.png';

/**
 * Beta-launch outreach — warm founder note inviting a couple/planner to our
 * free pilot, with a Cal.com booking button as the primary action. The Cal.com
 * logo is hotlinked from their CDN (see CAL_LOGO) so it renders immediately.
 */
export function buildBetaLaunchEmail(): { subject: string; html: string; text: string } {
  const subject = "Phera beta launch - You're invited!";
  const calLogo = CAL_LOGO;

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

          <!-- Logo (centered in the pink area, above the card) -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <img src="${PHERA_LOGO}" alt="Phera" width="111" height="30" style="display:block;margin:0 auto;height:30px;width:111px;border:0;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 4px 24px rgba(26,26,26,0.06);border:1px solid rgba(0,0,0,0.04);">

              <p style="margin:0 0 14px;font-size:16px;color:${TEXT_STRONG};line-height:1.55;">
                Hello!
              </p>

              <p style="margin:0 0 14px;font-size:16px;color:${TEXT_MUTED};line-height:1.6;">
                This is KV &amp; Sim, founders of Phera — and we just opened our private beta. We'd love for you to be one of the first in.
              </p>

              <p style="margin:0 0 14px;font-size:16px;color:${TEXT_MUTED};line-height:1.6;">
                Phera is the AI wedding assistant we wish we had — it takes the guest-logistics load off an Indian wedding, from RSVPs, guest travel, room assignments and WhatsApp coordination. And because every wedding is different, <strong style="color:${TEXT_STRONG};">we'll build custom features and tools</strong> that fit yours specifically, so it all comes together seamlessly.
              </p>

              <p style="margin:0 0 28px;font-size:16px;color:${TEXT_MUTED};line-height:1.6;">
                We're giving the <strong style="color:${TEXT_STRONG};">first 10 couples and planners</strong> full access, completely free, in exchange for honest feedback. No cost, no catch. We'd genuinely love to hear what you're planning and see where we can help — grab a time that works for you:
              </p>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:14px;background:${BRAND_PINK};">
                    <a href="${CAL_LINK}"
                       style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:14px;background:${BRAND_PINK};">
                      Book a 15-min intro &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:12px;font-size:12px;color:${TEXT_FAINT};line-height:1;">
                    <span style="vertical-align:middle;">Free scheduling via </span><img src="${calLogo}" width="16" height="16" alt="Cal.com" style="vertical-align:middle;border-radius:4px;margin-left:1px;" />
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:14px;color:${TEXT_MUTED};line-height:1.6;">
                — KV &amp; Sim<br/>
                <span style="color:${TEXT_FAINT};font-size:13px;">Founders, Phera · phera.io</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 8px 0;">
              <p style="margin:0;font-size:12px;color:${TEXT_FAINT};line-height:1.6;">
                Sent because you signed up at phera.io.<br/>
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
    "This is KV & Sim, founders of Phera — and we just opened our private beta. We'd love for you to be one of the first in.",
    '',
    "Phera is the AI wedding assistant we wish we had — it takes the guest-logistics load off an Indian wedding, from RSVPs, guest travel, room assignments and WhatsApp coordination. And because every wedding is different, we'll build custom features and tools that fit yours specifically, so it all comes together seamlessly.",
    '',
    "We're giving the first 10 couples and planners full access, completely free, in exchange for honest feedback. No cost, no catch. We'd genuinely love to hear what you're planning and see where we can help — grab a time that works for you:",
    '',
    `Book a 15-min intro (via Cal.com): ${CAL_LINK}`,
    '',
    '— KV & Sim',
    'Founders, Phera · phera.io',
  ].join('\n');

  return { subject, html, text };
}

/** Dispatch to the right template builder by key (defaults to onboarding hello). */
export function buildOutreachTemplate(
  template: string | null | undefined,
  params: OutreachEmailParams,
): { subject: string; html: string; text: string } {
  return template === 'beta_launch'
    ? buildBetaLaunchEmail()
    : buildOutreachEmail(params);
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
