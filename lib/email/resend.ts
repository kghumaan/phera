import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender address (must be verified in Resend dashboard)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Phera <noreply@phera.app>';

export interface SendInviteEmailParams {
  to: string;
  inviterName: string;
  weddingCoupleName: string;
  weddingSlug: string;
  role: 'admin' | 'viewer';
}

export async function sendTeamInviteEmail({
  to,
  inviterName,
  weddingCoupleName,
  weddingSlug,
  role,
}: SendInviteEmailParams) {
  const roleDescription = role === 'admin' ? 'edit' : 'view';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phera.app';
  const loginUrl = `${baseUrl}/auth/login`;
  const previewUrl = `${baseUrl}/preview/${weddingSlug}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `You're invited to help with ${weddingCoupleName}'s wedding on Phera`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Wedding Team Invite</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FFF5F5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 520px; width: 100%; border-collapse: collapse;">
                  <!-- Logo -->
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <img src="${baseUrl}/logo.svg" alt="Phera" style="height: 48px; width: auto;" />
                    </td>
                  </tr>
                  
                  <!-- Main Card -->
                  <tr>
                    <td style="background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
                      <!-- Decorative Icon -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #DE3F5E 0%, #FF6B8A 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                              <span style="font-size: 28px;">💒</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Heading -->
                      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a1a1a; text-align: center; line-height: 1.3;">
                        You're Invited to Join<br />${weddingCoupleName}'s Wedding Team
                      </h1>
                      
                      <!-- Description -->
                      <p style="margin: 0 0 24px; font-size: 16px; color: #4a4a4a; text-align: center; line-height: 1.6;">
                        ${inviterName} has invited you to <strong>${roleDescription}</strong> their wedding website on Phera. 
                        Sign up or log in with this email address to get access.
                      </p>
                      
                      <!-- Role Badge -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <span style="display: inline-block; padding: 8px 16px; background: ${role === 'admin' ? 'rgba(222, 63, 94, 0.1)' : 'rgba(107, 107, 107, 0.1)'}; color: ${role === 'admin' ? '#DE3F5E' : '#6a6a6a'}; border-radius: 20px; font-size: 14px; font-weight: 600;">
                              ${role === 'admin' ? '✏️ Can Edit' : '👁️ View Only'}
                            </span>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center">
                            <a href="${loginUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #DE3F5E 0%, #C8365A 100%); color: white; text-decoration: none; border-radius: 16px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(222, 63, 94, 0.3);">
                              Accept Invite & Sign In
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Secondary Link -->
                      <p style="margin: 24px 0 0; font-size: 14px; color: #6a6a6a; text-align: center;">
                        <a href="${previewUrl}" style="color: #DE3F5E; text-decoration: none;">Preview the wedding website →</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding-top: 32px; text-align: center;">
                      <p style="margin: 0; font-size: 13px; color: #9a9a9a;">
                        This invite was sent to ${to}.<br />
                        If you didn't expect this email, you can safely ignore it.
                      </p>
                      <p style="margin: 16px 0 0; font-size: 12px; color: #bbb;">
                        © ${new Date().getFullYear()} Phera · Beautiful Indian Wedding Websites
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
You're invited to help with ${weddingCoupleName}'s wedding on Phera!

${inviterName} has invited you to ${roleDescription} their wedding website.

Your role: ${role === 'admin' ? 'Can Edit' : 'View Only'}

To accept this invite, sign up or log in with this email address at:
${loginUrl}

Preview the wedding website:
${previewUrl}

---
This invite was sent to ${to}.
If you didn't expect this email, you can safely ignore it.

© ${new Date().getFullYear()} Phera · Beautiful Indian Wedding Websites
      `.trim(),
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Failed to send invite email:', err);
    return { success: false, error: err?.message || 'Failed to send email' };
  }
}

export { resend };

