import { sendPlannerRequestAlert } from '@/lib/email/alerts';
import type { AgentToolDefinition } from '../types';

/**
 * Hand-off tool for anything the Planner can't self-serve: managed services we
 * run for the couple (venue/vendor sourcing, photo album, save-the-dates) and
 * features Phera doesn't support yet. It saves a durable record (best-effort —
 * works even before the planner_requests table exists), emails the team, and
 * is auto-audited to agent_actions by the dispatcher. This is also the ONLY
 * place budget is captured, and it routes to our internal team — never guests.
 */
export const requestTools: AgentToolDefinition[] = [
  {
    name: 'submit_request',
    label: 'Passing this to our team',
    risk: 'write',
    description:
      'Capture a request the Planner cannot do itself and hand it to the Phera team. Use for: (a) MANAGED services our team runs — shared photo album, save-the-dates, and venue/vendor sourcing ONLY when our directory cannot help; and (b) UNSUPPORTED asks — anything the app does not do yet that the couple wants. CRITICAL for venues/hotels/vendors: FIRST call search_vendor_directory for the couple\'s city — only escalate here if it returns no usable matches OR the city is NOT one we cover (Goa, Udaipur, Jaipur, Jodhpur, Rishikesh, Kerala, Bangkok, Hua Hin, Phuket, Khao Lak, Bali, Dubai). It saves the brief and emails our team. ALWAYS frame the result to the couple as "I\'ve passed this to our team — they\'ll follow up", never as an automated or self-serve action (never fake automation). For sourcing requests, include budget and style/must-haves in the brief — this is the ONLY place budget is captured, and it goes to our internal team, not to guests. Do not call this for things the app CAN do (those have their own tools).',
    inputSchema: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: ['managed', 'unsupported'],
          description:
            "'managed' = a service our team runs for them (venue/vendor sourcing, album, save-the-dates); 'unsupported' = something Phera does not do yet",
        },
        service: {
          type: 'string',
          description:
            'Short label, e.g. "Venue sourcing", "Vendor sourcing — photographer", "Shared photo album", or the unsupported feature they asked for',
        },
        details: {
          type: 'string',
          description:
            "The brief in the couple's words plus any specifics you gathered (city, dates, headcount, style, must-haves, deadline)",
        },
        budget: {
          type: 'string',
          description: 'Budget for sourcing requests, e.g. "₹8–12L" or "$30k". Omit when not applicable.',
        },
      },
      required: ['kind', 'service', 'details'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const kind = input.kind === 'unsupported' ? 'unsupported' : 'managed';
      const service = String(input.service ?? '').trim() || 'Unspecified request';
      const details = String(input.details ?? '').trim();
      const budget = input.budget ? String(input.budget).trim() : null;

      // Durable record. Best-effort: if the planner_requests table isn't there
      // yet, the email + the agent_actions audit row still capture the request,
      // so the turn never breaks.
      let recordId: string | null = null;
      try {
        const { data, error } = await ctx.supabase
          .from('planner_requests')
          .insert({
            wedding_id: ctx.weddingSlug,
            kind,
            service,
            details,
            budget,
            status: 'open',
            created_by: ctx.userId,
          })
          .select('id')
          .single();
        if (error) throw error;
        recordId = (data?.id as string) ?? null;
      } catch (e) {
        console.error('planner_requests insert skipped (table missing or RLS?):', e);
      }

      // Notify the team (best-effort; sendPlannerRequestAlert never throws).
      const email = await sendPlannerRequestAlert({ weddingId: ctx.weddingSlug, kind, service, budget, details });

      return {
        captured: true,
        kind,
        service,
        recordId,
        notified: email.success,
        note: 'Logged for the Phera team. Tell the couple our team will follow up — never present this as something the app did automatically.',
      };
    },
  },
];
