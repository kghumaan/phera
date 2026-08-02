import { supabase } from '@/lib/supabase/client';
import {
  OutreachStatus,
  OutreachEvent,
  OutreachEventInput,
  OutreachSequence,
  Escalation,
  EscalationInput,
  OutreachSummary,
  GuestOutreachStatus,
  SequenceType,
  SEQUENCE_TEMPLATE_MAP,
} from '@/lib/types/outreach';

// Default outreach timeline for destination_international weddings
const DEFAULT_SEQUENCE_TIMELINE: Array<{
  sequence_type: SequenceType;
  days_before_wedding: number;
  target_statuses: string[];
}> = [
  { sequence_type: 'save_the_date', days_before_wedding: 300, target_statuses: ['not_contacted'] },
  { sequence_type: 'rsvp_request', days_before_wedding: 180, target_statuses: ['save_the_date_sent'] },
  { sequence_type: 'rsvp_nudge', days_before_wedding: 159, target_statuses: ['rsvp_requested'] },
  { sequence_type: 'rsvp_nudge_2', days_before_wedding: 152, target_statuses: ['rsvp_requested'] },
  { sequence_type: 'travel_collection', days_before_wedding: 120, target_statuses: ['rsvp_confirmed'] },
  { sequence_type: 'shuttle_assignment', days_before_wedding: 42, target_statuses: ['travel_collected'] },
  { sequence_type: 'schedule_reminder', days_before_wedding: 14, target_statuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
  { sequence_type: 'day_before', days_before_wedding: 1, target_statuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
  { sequence_type: 'thank_you', days_before_wedding: -7, target_statuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
];

export const outreachService = {
  /**
   * Generate outreach sequence records for a wedding
   */
  async generateSequence(
    weddingId: string,
    weddingDate: Date,
    timeline: typeof DEFAULT_SEQUENCE_TIMELINE = DEFAULT_SEQUENCE_TIMELINE
  ): Promise<OutreachSequence[]> {
    const sequences = timeline.map((item) => {
      const scheduledAt = new Date(weddingDate);
      scheduledAt.setDate(scheduledAt.getDate() - item.days_before_wedding);

      return {
        wedding_id: weddingId,
        sequence_type: item.sequence_type,
        template_name: SEQUENCE_TEMPLATE_MAP[item.sequence_type],
        days_before_wedding: item.days_before_wedding,
        status: 'pending' as const,
        scheduled_at: scheduledAt.toISOString(),
        target_statuses: item.target_statuses,
      };
    });

    const { data, error } = await supabase
      .from('outreach_sequences')
      .insert(sequences)
      .select();

    if (error) throw new Error(`Failed to generate sequences: ${error.message}`);
    return data as unknown as OutreachSequence[];
  },

  /**
   * Get all guests with outreach columns for a wedding
   */
  async getGuestOutreachStatuses(weddingId: string): Promise<GuestOutreachStatus[]> {
    const { data, error } = await supabase
      .from('guests')
      .select('id, name, phone, email, outreach_status, outreach_last_contacted_at, outreach_attempt_count, whatsapp_opted_out, contact_type, is_family_liaison')
      .eq('wedding_id', weddingId);

    if (error) throw new Error(`Failed to get guest statuses: ${error.message}`);
    return (data || []) as unknown as GuestOutreachStatus[];
  },

  /**
   * Update a guest's outreach status and log the event
   */
  async updateGuestStatus(
    guestId: string,
    status: OutreachStatus,
    details?: Record<string, any>
  ): Promise<void> {
    const { error: updateError } = await supabase
      .from('guests')
      .update({
        outreach_status: status,
        outreach_last_contacted_at: new Date().toISOString(),
      })
      .eq('id', guestId);

    if (updateError) throw new Error(`Failed to update guest status: ${updateError.message}`);

    // Increment attempt count via raw update. The RPC may not exist in every
    // environment so we swallow errors here — it's a best-effort counter.
    try {
      await (supabase as any).rpc('increment_outreach_attempt', { guest_id_input: guestId });
    } catch {
      // ignore
    }

    // Fetch wedding_id for the event log
    const { data: guest } = await supabase
      .from('guests')
      .select('wedding_id')
      .eq('id', guestId)
      .single();

    if (guest) {
      await outreachService.logEvent({
        wedding_id: guest.wedding_id as string,
        guest_id: guestId,
        event_type: 'status_changed',
        channel: 'manual',
        details: { new_status: status, ...details },
      });
    }
  },

  /**
   * Log an outreach event
   */
  async logEvent(event: OutreachEventInput): Promise<OutreachEvent> {
    const { data, error } = await supabase
      .from('outreach_events')
      .insert({
        wedding_id: event.wedding_id,
        guest_id: event.guest_id,
        event_type: event.event_type,
        template_name: event.template_name || null,
        channel: event.channel,
        details: event.details,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to log event: ${error.message}`);
    return data as unknown as OutreachEvent;
  },

  /**
   * Get outreach events for a guest
   */
  async getGuestEvents(guestId: string): Promise<OutreachEvent[]> {
    const { data, error } = await supabase
      .from('outreach_events')
      .select('*')
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get guest events: ${error.message}`);
    return (data || []) as unknown as OutreachEvent[];
  },

  /**
   * Get outreach events for a wedding
   */
  async getWeddingEvents(weddingId: string, limit?: number): Promise<OutreachEvent[]> {
    let query = supabase
      .from('outreach_events')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get wedding events: ${error.message}`);
    return (data || []) as unknown as OutreachEvent[];
  },

  /**
   * Get pending sequences that are due
   */
  async getPendingSequences(weddingId?: string): Promise<OutreachSequence[]> {
    let query = supabase
      .from('outreach_sequences')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (weddingId) {
      query = query.eq('wedding_id', weddingId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get pending sequences: ${error.message}`);
    return (data || []) as unknown as OutreachSequence[];
  },

  /**
   * Mark a sequence as sent
   */
  async markSequenceSent(sequenceId: string): Promise<void> {
    const { error } = await supabase
      .from('outreach_sequences')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', sequenceId);

    if (error) throw new Error(`Failed to mark sequence sent: ${error.message}`);
  },

  /**
   * Create an escalation
   */
  async createEscalation(input: EscalationInput): Promise<Escalation> {
    const { data, error } = await supabase
      .from('outreach_escalations')
      .insert({
        wedding_id: input.wedding_id,
        guest_id: input.guest_id,
        reason: input.reason,
        context: input.context,
        status: input.status,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create escalation: ${error.message}`);
    return data as unknown as Escalation;
  },

  /**
   * Get escalations for a wedding
   */
  async getEscalations(weddingId: string, status?: string): Promise<Escalation[]> {
    let query = supabase
      .from('outreach_escalations')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get escalations: ${error.message}`);
    return (data || []) as unknown as Escalation[];
  },

  /**
   * Resolve an escalation
   */
  async resolveEscalation(escalationId: string, resolvedBy: string): Promise<void> {
    const { error } = await supabase
      .from('outreach_escalations')
      .update({
        status: 'resolved',
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', escalationId);

    if (error) throw new Error(`Failed to resolve escalation: ${error.message}`);
  },

  /**
   * Get outreach summary for a wedding
   */
  async getOutreachSummary(weddingId: string): Promise<OutreachSummary> {
    // Get guest counts by status
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('outreach_status')
      .eq('wedding_id', weddingId);

    if (guestsError) throw new Error(`Failed to get summary: ${guestsError.message}`);

    const statusCounts: Record<string, number> = {
      not_contacted: 0,
      save_the_date_sent: 0,
      rsvp_requested: 0,
      rsvp_confirmed: 0,
      travel_collected: 0,
      logistics_complete: 0,
      unresponsive: 0,
    };

    for (const guest of guests || []) {
      const status = (guest as any).outreach_status || 'not_contacted';
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    }

    // Get open escalations count
    const { count: escalationsOpen, error: escError } = await supabase
      .from('outreach_escalations')
      .select('*', { count: 'exact', head: true })
      .eq('wedding_id', weddingId)
      .eq('status', 'open');

    if (escError) throw new Error(`Failed to get escalation count: ${escError.message}`);

    // Get next scheduled sequence
    const { data: nextSequence, error: seqError } = await supabase
      .from('outreach_sequences')
      .select('*')
      .eq('wedding_id', weddingId)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .single();

    let next_scheduled_action: OutreachSummary['next_scheduled_action'] = null;
    if (!seqError && nextSequence) {
      const seq = nextSequence as any;
      // Count target guests
      const { count: targetCount } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('wedding_id', weddingId)
        .in('outreach_status', seq.target_statuses || []);

      next_scheduled_action = {
        type: seq.sequence_type,
        date: new Date(seq.scheduled_at),
        target_count: targetCount || 0,
      };
    }

    const total = guests?.length || 0;

    return {
      total_guests: total,
      ...statusCounts,
      escalations_open: escalationsOpen || 0,
      next_scheduled_action,
    } as OutreachSummary;
  },
};
