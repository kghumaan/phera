import { resend } from './resend';

const ALERT_RECIPIENT = 'kv@phera.io';

export interface ContactAlertData {
    name: string;
    email: string;
    phone?: string;
    message: string;
}

export interface FeatureRequestAlertData {
    userEmail?: string;
    content: string;
    weddingId?: string;
}

/**
 * Sends an email alert when a new contact form is submitted.
 */
export async function sendContactAlert(data: ContactAlertData) {
    const { name, email, phone, message } = data;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!fromEmail) {
        console.error('RESEND_FROM_EMAIL is not configured');
        return { success: false, error: 'RESEND_FROM_EMAIL is not configured' };
    }

    try {
        const result = await resend().emails.send({
            from: fromEmail,
            to: [ALERT_RECIPIENT],
            subject: `[Phera Alert] New Contact: ${name}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #DE3F5E; border-bottom: 2px solid #DE3F5E; padding-bottom: 10px;">New Contact Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">Sent via Phera Internal Alerts</p>
        </div>
      `,
        });

        if (result.error) throw result.error;
        return { success: true };
    } catch (err: any) {
        console.error('Failed to send contact alert email:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Sends an email alert when a new feature request is submitted.
 */
export async function sendFeatureRequestAlert(data: FeatureRequestAlertData) {
    const { userEmail, content, weddingId } = data;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!fromEmail) {
        console.error('RESEND_FROM_EMAIL is not configured');
        return { success: false, error: 'RESEND_FROM_EMAIL is not configured' };
    }

    try {
        const result = await resend().emails.send({
            from: fromEmail,
            to: [ALERT_RECIPIENT],
            subject: `[Phera Alert] New Feature Request`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #DE3F5E; border-bottom: 2px solid #DE3F5E; padding-bottom: 10px;">New Feature Request</h2>
          <p><strong>From User:</strong> ${userEmail || 'Anonymous'}</p>
          <p><strong>Wedding ID:</strong> ${weddingId || 'N/A'}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px;">
            <p><strong>Request Content:</strong></p>
            <p style="white-space: pre-wrap;">${content}</p>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">Sent via Phera Internal Alerts</p>
        </div>
      `,
        });

        if (result.error) throw result.error;
        return { success: true };
    } catch (err: any) {
        console.error('Failed to send feature request alert email:', err);
        return { success: false, error: err.message };
    }
}
