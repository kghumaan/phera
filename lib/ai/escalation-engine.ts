/**
 * Escalation Engine — detects escalation conditions and routes to appropriate handlers.
 */

import { supabase } from '@/lib/supabase/client';
import { outreachService } from '@/lib/supabase/outreach-service';
import { Escalation, EscalationStatus } from '@/lib/types/outreach';

export type EscalationReason =
  | 'unresponsive_after_3_attempts'
  | 'unanswerable_question'
  | 'special_request'
  | 'human_requested';

export interface EscalationRoute {
  action: 'suggest_phone_call' | 'route_to_couple' | 'route_to_couple_urgent';
  message: string;
  phone?: string;
  context?: Record<string, any>;
}

export interface EscalationSummary {
  total: number;
  by_status: Record<EscalationStatus, number>;
  by_reason: Record<string, number>;
  oldest_unresolved: Escalation | null;
}

export class EscalationEngine {
  /**
   * Check if a guest should be escalated based on their current state.
   */
  async checkForEscalation(
    guestId: string,
    weddingId: string
  ): Promise<EscalationReason | null> {
    // Get guest data
    const { data: guest, error } = await supabase
      .from('guests')
      .select('outreach_attempt_count, outreach_status, name')
      .eq('id', guestId)
      .single();

    if (error || !guest) return null;
    const g = guest as any;

    // Check for existing open escalation to avoid duplicates
    const { data: existing } = await supabase
      .from('outreach_escalations')
      .select('id')
      .eq('guest_id', guestId)
      .eq('wedding_id', weddingId)
      .in('status', ['open', 'in_progress'])
      .limit(1);

    if (existing && existing.length > 0) return null;

    // Unresponsive after 3+ attempts
    if (g.outreach_attempt_count >= 3 && g.outreach_status !== 'rsvp_confirmed' &&
        g.outreach_status !== 'travel_collected' && g.outreach_status !== 'logistics_complete') {
      await outreachService.createEscalation({
        wedding_id: weddingId,
        guest_id: guestId,
        reason: 'unresponsive_after_3_attempts',
        context: {
          attempt_count: g.outreach_attempt_count,
          current_status: g.outreach_status,
          guest_name: g.name,
        },
        status: 'open',
      });
      return 'unresponsive_after_3_attempts';
    }

    return null;
  }

  /**
   * Create an escalation for a specific reason.
   */
  async createEscalation(
    guestId: string,
    weddingId: string,
    reason: EscalationReason,
    context: Record<string, any> = {}
  ): Promise<Escalation> {
    return outreachService.createEscalation({
      wedding_id: weddingId,
      guest_id: guestId,
      reason,
      context,
      status: 'open',
    });
  }

  /**
   * Route an escalation to the appropriate handler.
   */
  routeEscalation(escalation: Escalation): EscalationRoute {
    switch (escalation.reason) {
      case 'unresponsive_after_3_attempts':
        return {
          action: 'suggest_phone_call',
          message: `${escalation.context.guest_name || 'Guest'} hasn't responded after ${escalation.context.attempt_count || 3} attempts. Consider calling them directly.`,
          phone: escalation.context.phone,
          context: escalation.context,
        };

      case 'unanswerable_question':
        return {
          action: 'route_to_couple',
          message: `A guest asked a question we couldn't answer: "${escalation.context.question || 'Unknown question'}"`,
          context: escalation.context,
        };

      case 'special_request':
        return {
          action: 'route_to_couple',
          message: `Special request from ${escalation.context.guest_name || 'a guest'}: ${escalation.context.request || 'See details'}`,
          context: escalation.context,
        };

      case 'human_requested':
        return {
          action: 'route_to_couple_urgent',
          message: `${escalation.context.guest_name || 'A guest'} asked to speak with a human. Please respond promptly.`,
          context: escalation.context,
        };

      default:
        return {
          action: 'route_to_couple',
          message: `Escalation for ${escalation.context.guest_name || 'a guest'}: ${escalation.reason}`,
          context: escalation.context,
        };
    }
  }

  /**
   * Get escalation summary for a wedding.
   */
  async getEscalationSummary(weddingId: string): Promise<EscalationSummary> {
    const { data: escalations, error } = await supabase
      .from('outreach_escalations')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get escalation summary: ${error.message}`);

    const byStatus: Record<EscalationStatus, number> = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      dismissed: 0,
    };

    const byReason: Record<string, number> = {};
    let oldestUnresolved: Escalation | null = null;

    for (const esc of (escalations || []) as any[]) {
      byStatus[esc.status as EscalationStatus]++;
      byReason[esc.reason] = (byReason[esc.reason] || 0) + 1;

      if ((esc.status === 'open' || esc.status === 'in_progress') && !oldestUnresolved) {
        oldestUnresolved = esc as unknown as Escalation;
      }
    }

    return {
      total: escalations?.length || 0,
      by_status: byStatus,
      by_reason: byReason,
      oldest_unresolved: oldestUnresolved,
    };
  }
}

export const escalationEngine = new EscalationEngine();
