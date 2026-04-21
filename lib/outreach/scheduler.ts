/**
 * Outreach Scheduling Engine — generates timelines and processes due sequences.
 */

import { outreachService } from '@/lib/supabase/outreach-service';
import { SequenceType, SEQUENCE_TEMPLATE_MAP, OutreachSequence } from '@/lib/types/outreach';
import { BatchSendResult } from '@/lib/whatsapp/outreach-sender';

export type WeddingType = 'destination_international' | 'destination_domestic' | 'local';

interface TimelineEntry {
  sequence_type: SequenceType;
  days_before_wedding: number;
  target_statuses: string[];
}

const TIMELINES: Record<WeddingType, TimelineEntry[]> = {
  destination_international: [
    { sequence_type: 'save_the_date', days_before_wedding: 300, target_statuses: ['not_contacted'] },
    { sequence_type: 'rsvp_request', days_before_wedding: 180, target_statuses: ['save_the_date_sent'] },
    { sequence_type: 'rsvp_nudge', days_before_wedding: 159, target_statuses: ['rsvp_requested'] },
    { sequence_type: 'rsvp_nudge_2', days_before_wedding: 152, target_statuses: ['rsvp_requested'] },
    { sequence_type: 'travel_collection', days_before_wedding: 120, target_statuses: ['rsvp_confirmed'] },
    { sequence_type: 'shuttle_assignment', days_before_wedding: 42, target_statuses: ['travel_collected'] },
    { sequence_type: 'schedule_reminder', days_before_wedding: 14, target_statuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
    { sequence_type: 'day_before', days_before_wedding: 1, target_statuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
    { sequence_type: 'thank_you', days_before_wedding: -7, target_statuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
  ],
  destination_domestic: [
    { sequence_type: 'save_the_date', days_before_wedding: 180, target_statuses: ['not_contacted'] },
    { sequence_type: 'rsvp_request', days_before_wedding: 90, target_statuses: ['save_the_date_sent'] },
    { sequence_type: 'rsvp_nudge', days_before_wedding: 69, target_statuses: ['rsvp_requested'] },
    { sequence_type: 'rsvp_nudge_2', days_before_wedding: 62, target_statuses: ['rsvp_requested'] },
    { sequence_type: 'travel_collection', days_before_wedding: 49, target_statuses: ['rsvp_confirmed'] },
    { sequence_type: 'shuttle_assignment', days_before_wedding: 28, target_statuses: ['travel_collected'] },
    { sequence_type: 'schedule_reminder', days_before_wedding: 14, target_statuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
    { sequence_type: 'day_before', days_before_wedding: 1, target_statuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
    { sequence_type: 'thank_you', days_before_wedding: -7, target_statuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
  ],
  local: [
    { sequence_type: 'save_the_date', days_before_wedding: 90, target_statuses: ['not_contacted'] },
    { sequence_type: 'rsvp_request', days_before_wedding: 42, target_statuses: ['save_the_date_sent'] },
    { sequence_type: 'rsvp_nudge', days_before_wedding: 21, target_statuses: ['rsvp_requested'] },
    { sequence_type: 'rsvp_nudge_2', days_before_wedding: 14, target_statuses: ['rsvp_requested'] },
    { sequence_type: 'schedule_reminder', days_before_wedding: 7, target_statuses: ['rsvp_confirmed'] },
    { sequence_type: 'day_before', days_before_wedding: 1, target_statuses: ['rsvp_confirmed'] },
    { sequence_type: 'thank_you', days_before_wedding: -7, target_statuses: ['rsvp_confirmed'] },
  ],
};

/**
 * Generate outreach timeline based on wedding type.
 */
export function generateOutreachTimeline(
  weddingDate: Date,
  weddingType: WeddingType
): TimelineEntry[] {
  const timeline = TIMELINES[weddingType];
  if (!timeline) {
    throw new Error(`Unknown wedding type: ${weddingType}`);
  }

  const now = new Date();
  const daysUntilWedding = Math.ceil((weddingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Skip sequences that are already in the past (wedding is less than N days away)
  return timeline.filter((entry) => {
    if (entry.days_before_wedding < 0) return true; // Post-wedding sequences always included
    return entry.days_before_wedding <= daysUntilWedding;
  });
}

/**
 * Get the raw timeline for a wedding type (without date filtering).
 */
export function getRawTimeline(weddingType: WeddingType): TimelineEntry[] {
  return TIMELINES[weddingType] || [];
}

/**
 * Handle partial delivery results.
 */
export function handlePartialDelivery(results: BatchSendResult): {
  delivered: typeof results.delivered;
  retryTomorrow: typeof results.retryTomorrow;
  optedOut: typeof results.optedOut;
  failed: typeof results.failed;
} {
  return {
    delivered: [...results.delivered, ...results.accepted],
    retryTomorrow: results.retryTomorrow,
    optedOut: results.optedOut,
    failed: results.failed,
  };
}

/**
 * Get sequences that are due to be sent.
 */
export function getDueSequences(
  sequences: OutreachSequence[],
  now: Date = new Date()
): OutreachSequence[] {
  return sequences.filter((seq) => {
    if (seq.status !== 'pending') return false;
    if (!seq.scheduled_at) return true; // No scheduled time = immediately due
    return new Date(seq.scheduled_at) <= now;
  });
}

/**
 * Initialize outreach for a wedding — generates sequence records in DB.
 */
export async function initializeOutreachForWedding(
  weddingId: string,
  weddingDate: Date,
  weddingType: WeddingType
): Promise<OutreachSequence[]> {
  const timeline = generateOutreachTimeline(weddingDate, weddingType);

  const sequenceEntries = timeline.map((entry) => ({
    sequence_type: entry.sequence_type,
    days_before_wedding: entry.days_before_wedding,
    target_statuses: entry.target_statuses,
  }));

  return outreachService.generateSequence(weddingId, weddingDate, sequenceEntries.map((e) => ({
    sequence_type: e.sequence_type,
    days_before_wedding: e.days_before_wedding,
    target_statuses: e.target_statuses,
  })));
}
