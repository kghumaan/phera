// Outreach types for the pivot service layer

export type OutreachStatus =
  | 'not_contacted'
  | 'save_the_date_sent'
  | 'rsvp_requested'
  | 'rsvp_confirmed'
  | 'travel_collected'
  | 'logistics_complete'
  | 'unresponsive';

export type OutreachEventType =
  | 'template_sent'
  | 'message_received'
  | 'conversation_started'
  | 'info_collected'
  | 'escalated'
  | 'opted_out'
  | 'status_changed';

export type OutreachChannel = 'whatsapp' | 'email' | 'phone' | 'manual';

export type SequenceType =
  | 'save_the_date'
  | 'rsvp_request'
  | 'rsvp_nudge'
  | 'rsvp_nudge_2'
  | 'travel_collection'
  | 'shuttle_assignment'
  | 'schedule_reminder'
  | 'day_before'
  | 'day_of'
  | 'thank_you';

export type SequenceStatus = 'pending' | 'scheduled' | 'sent' | 'completed' | 'skipped';

export type EscalationStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';

export type ContactType = 'guest' | 'admin' | 'family';

export interface OutreachEvent {
  id: string;
  wedding_id: string;
  guest_id: string;
  event_type: OutreachEventType;
  template_name?: string;
  channel: OutreachChannel;
  details: Record<string, any>;
  created_at: Date;
}

export interface OutreachSequence {
  id: string;
  wedding_id: string;
  sequence_type: SequenceType;
  template_name: string;
  days_before_wedding: number;
  status: SequenceStatus;
  scheduled_at?: Date;
  sent_at?: Date;
  target_statuses: string[];
  created_at: Date;
}

export interface Escalation {
  id: string;
  wedding_id: string;
  guest_id: string;
  reason: string;
  context: Record<string, any>;
  status: EscalationStatus;
  resolved_by?: string;
  resolved_at?: Date;
  created_at: Date;
}

export interface OutreachSummary {
  total_guests: number;
  not_contacted: number;
  save_the_date_sent: number;
  rsvp_requested: number;
  rsvp_confirmed: number;
  travel_collected: number;
  logistics_complete: number;
  unresponsive: number;
  escalations_open: number;
  next_scheduled_action: {
    type: string;
    date: Date;
    target_count: number;
  } | null;
}

export interface GuestOutreachStatus {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  outreach_status: OutreachStatus;
  outreach_last_contacted_at: Date | null;
  outreach_attempt_count: number;
  whatsapp_opted_out: boolean;
  contact_type: ContactType;
  is_family_liaison: boolean;
}

// Input types (omit auto-generated fields)
export type OutreachEventInput = Omit<OutreachEvent, 'id' | 'created_at'>;
export type EscalationInput = Omit<Escalation, 'id' | 'created_at' | 'resolved_by' | 'resolved_at'>;

// Sequence template mapping
export const SEQUENCE_TEMPLATE_MAP: Record<SequenceType, string> = {
  save_the_date: 'save_the_date_v1',
  rsvp_request: 'rsvp_request_v1',
  rsvp_nudge: 'gentle_nudge_v1',
  rsvp_nudge_2: 'gentle_nudge_v1',
  travel_collection: 'travel_details_request_v1',
  shuttle_assignment: 'shuttle_assignment_v1',
  schedule_reminder: 'schedule_reminder_v1',
  day_before: 'day_before_summary_v1',
  day_of: 'schedule_reminder_v1',
  thank_you: 'thank_you_v1',
};
