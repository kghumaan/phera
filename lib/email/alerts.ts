import { resend } from './resend';
import { isLabSlug } from '@/lib/agent/lab/scenarios';

const ALERT_RECIPIENT = 'contact@phera.io';

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
    } catch (err) {
        console.error('Failed to send contact alert email:', err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
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
    } catch (err) {
        console.error('Failed to send feature request alert email:', err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export interface PlannerRequestAlertData {
    weddingId?: string;
    /** 'managed' = a service our team runs; 'unsupported' = something we don't do yet; 'support' = the user needs a human. */
    kind: 'managed' | 'unsupported' | 'support';
    service: string;
    budget?: string | null;
    details: string;
}

/**
 * Sends an email alert when the AI Planner captures a request it can't
 * self-serve — a managed-service brief (venue/vendor sourcing, album,
 * save-the-dates) or an unsupported ask the couple made. Mirrors the
 * contact-form alert so the team is notified the same way.
 */
export async function sendPlannerRequestAlert(data: PlannerRequestAlertData) {
    const { weddingId, kind, service, budget, details } = data;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    // Disposable agent-lab weddings (evals, manual lab testing) must never
    // page the team — the request row is still written for assertions.
    if (weddingId && isLabSlug(weddingId)) {
        return { success: true, skipped: 'lab wedding' };
    }

    if (!fromEmail) {
        console.error('RESEND_FROM_EMAIL is not configured');
        return { success: false, error: 'RESEND_FROM_EMAIL is not configured' };
    }

    const kindLabel =
        kind === 'unsupported' ? 'Unsupported ask'
        : kind === 'support' ? 'Support / human handoff'
        : 'Managed request';

    try {
        const result = await resend().emails.send({
            from: fromEmail,
            to: [ALERT_RECIPIENT],
            subject: `[Phera Planner] ${kindLabel}: ${service}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #DE3F5E; border-bottom: 2px solid #DE3F5E; padding-bottom: 10px;">${kindLabel}</h2>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Wedding:</strong> ${weddingId || 'N/A'}</p>
          ${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ''}
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px;">
            <p><strong>Brief:</strong></p>
            <p style="white-space: pre-wrap;">${details}</p>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">Captured by the Phera AI Planner</p>
        </div>
      `,
        });

        if (result.error) throw result.error;
        return { success: true };
    } catch (err) {
        console.error('Failed to send planner request alert email:', err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
