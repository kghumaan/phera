/**
 * Concierge Tool Handlers
 *
 * Server-side handler functions for the 8 tools the concierge LLM can call.
 * Each takes tool parameters + guest_id + wedding_id, performs the Supabase
 * operation, and returns { success, data?, error? }.
 *
 * Uses service role client to bypass RLS (same pattern as ai-handler.ts).
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ---------------------------------------------------------------------------
// Tool 1: update_guest_rsvp
// ---------------------------------------------------------------------------

export async function updateGuestRsvp(
  params: {
    attending: 'yes' | 'no' | 'maybe';
    guest_count?: number;
    plus_one?: boolean;
    plus_one_name?: string;
    food_preference?: string[];
    dietary_restrictions?: string;
    maybe_comment?: string;
    song_request?: string;
  },
  guestId: string,
  weddingId: string,
): Promise<ToolResult> {
  try {
    const record: Record<string, any> = {
      guest_id: guestId,
      wedding_id: weddingId,
      event_id: 'general',
      attending: params.attending,
    };

    if (params.guest_count !== undefined) record.guest_count = params.guest_count;
    if (params.plus_one !== undefined) record.plus_one = params.plus_one;
    if (params.plus_one_name !== undefined) record.plus_one_name = params.plus_one_name;
    if (params.food_preference !== undefined) record.food_preference = params.food_preference;
    if (params.dietary_restrictions !== undefined) record.dietary_restrictions = params.dietary_restrictions;
    if (params.maybe_comment !== undefined) record.maybe_comment = params.maybe_comment;
    if (params.song_request !== undefined) record.song_request = params.song_request;

    const { data, error } = await supabase
      .from('rsvps')
      .upsert(record, { onConflict: 'guest_id,event_id,wedding_id' })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[concierge-tool] update_guest_rsvp failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Tool 2: update_guest_flight
// ---------------------------------------------------------------------------

export async function updateGuestFlight(
  params: {
    arrival_date: string;
    arrival_time?: string;
    departure_date?: string;
    departure_time?: string;
    airline?: string;
    flight_number?: string;
    arriving_from?: string;
    passengers?: number;
    needs_pickup?: boolean;
  },
  guestId: string,
  weddingId: string,
): Promise<ToolResult> {
  try {
    // Build arrival/departure datetime strings from date + time
    const arrivalDatetime = params.arrival_time
      ? `${params.arrival_date}T${params.arrival_time}:00`
      : `${params.arrival_date}T00:00:00`;

    const departureDatetime =
      params.departure_date
        ? params.departure_time
          ? `${params.departure_date}T${params.departure_time}:00`
          : `${params.departure_date}T00:00:00`
        : null;

    const record: Record<string, any> = {
      guest_id: guestId,
      wedding_id: weddingId,
      arrival_datetime: arrivalDatetime,
      updated_at: new Date().toISOString(),
    };

    if (departureDatetime) record.departure_datetime = departureDatetime;
    if (params.airline) record.airline = params.airline;
    if (params.flight_number) record.flight_number = params.flight_number;
    if (params.arriving_from) record.departure_airport = params.arriving_from;
    if (params.needs_pickup !== undefined) {
      record.shuttle_preference_note = params.needs_pickup
        ? 'Needs airport pickup'
        : 'No pickup needed';
    }

    // Check if a record already exists for this guest+wedding
    const { data: existing } = await supabase
      .from('guest_flights')
      .select('id')
      .eq('guest_id', guestId)
      .eq('wedding_id', weddingId)
      .limit(1)
      .single();

    let data;
    let error;

    if (existing) {
      ({ data, error } = await supabase
        .from('guest_flights')
        .update(record)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('guest_flights')
        .insert(record)
        .select()
        .single());
    }

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[concierge-tool] update_guest_flight failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Tool 3: update_guest_hotel
// ---------------------------------------------------------------------------

export async function updateGuestHotel(
  params: {
    status: 'looking' | 'booked' | 'confirmed' | 'cancelled';
    hotel_name?: string;
    confirmation_number?: string;
    check_in?: string;
    check_out?: string;
    room_type?: string;
    notes?: string;
  },
  guestId: string,
  weddingId: string,
): Promise<ToolResult> {
  try {
    const record: Record<string, any> = {
      guest_id: guestId,
      wedding_id: weddingId,
      status: params.status,
      updated_at: new Date().toISOString(),
    };

    if (params.hotel_name !== undefined) record.hotel_name = params.hotel_name;
    if (params.confirmation_number !== undefined) record.confirmation_number = params.confirmation_number;
    if (params.check_in !== undefined) record.check_in = params.check_in;
    if (params.check_out !== undefined) record.check_out = params.check_out;
    if (params.room_type !== undefined) record.room_type = params.room_type;
    if (params.notes !== undefined) record.notes = params.notes;

    // Check for existing record
    const { data: existing } = await supabase
      .from('guest_hotels')
      .select('id')
      .eq('guest_id', guestId)
      .eq('wedding_id', weddingId)
      .limit(1)
      .single();

    let data;
    let error;

    if (existing) {
      ({ data, error } = await supabase
        .from('guest_hotels')
        .update(record)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('guest_hotels')
        .insert(record)
        .select()
        .single());
    }

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[concierge-tool] update_guest_hotel failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Tool 4: update_guest_visa
// ---------------------------------------------------------------------------

export async function updateGuestVisa(
  params: {
    status: 'not_needed' | 'not_started' | 'applied' | 'approved' | 'denied' | 'expired';
    visa_type?: string;
    applied_at?: string;
    notes?: string;
  },
  guestId: string,
  weddingId: string,
): Promise<ToolResult> {
  try {
    const record: Record<string, any> = {
      guest_id: guestId,
      wedding_id: weddingId,
      status: params.status,
      updated_at: new Date().toISOString(),
    };

    if (params.visa_type !== undefined) record.visa_type = params.visa_type;
    if (params.applied_at !== undefined) record.applied_at = params.applied_at;
    if (params.notes !== undefined) record.notes = params.notes;

    // If status is 'approved' and no applied_at was given, don't overwrite existing
    if (params.status === 'approved') {
      record.approved_at = new Date().toISOString().split('T')[0];
    }

    // Check for existing record
    const { data: existing } = await supabase
      .from('guest_visas')
      .select('id')
      .eq('guest_id', guestId)
      .eq('wedding_id', weddingId)
      .limit(1)
      .single();

    let data;
    let error;

    if (existing) {
      ({ data, error } = await supabase
        .from('guest_visas')
        .update(record)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('guest_visas')
        .insert(record)
        .select()
        .single());
    }

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[concierge-tool] update_guest_visa failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Tool 5: create_coordination_issue
// ---------------------------------------------------------------------------

export async function createCoordinationIssue(
  params: {
    category: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  },
  guestId: string,
  weddingId: string,
): Promise<ToolResult> {
  try {
    const record = {
      wedding_id: weddingId,
      guest_id: guestId,
      category: params.category,
      title: params.title,
      description: params.description || null,
      priority: params.priority,
      status: 'open',
      source: 'ai_concierge',
      metadata: {},
    };

    const { data, error } = await supabase
      .from('coordination_issues')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('[concierge-tool] create_coordination_issue failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Tool 6: update_guest_notes
// ---------------------------------------------------------------------------

export async function updateGuestNotes(
  params: { note: string },
  guestId: string,
  _weddingId: string,
): Promise<ToolResult> {
  try {
    // Read current notes
    const { data: guest, error: readErr } = await supabase
      .from('guests')
      .select('ai_notes')
      .eq('id', guestId)
      .single();

    if (readErr) throw readErr;

    // Append timestamped note
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').slice(0, 16); // YYYY-MM-DD HH:MM
    const newLine = `[${timestamp}] ${params.note}`;

    const existingNotes = (guest as any)?.ai_notes || '';
    const updatedNotes = existingNotes
      ? `${existingNotes}\n${newLine}`
      : newLine;

    const { error: writeErr } = await supabase
      .from('guests')
      .update({ ai_notes: updatedNotes } as any)
      .eq('id', guestId);

    if (writeErr) throw writeErr;
    return { success: true, data: { ai_notes: updatedNotes } };
  } catch (err: any) {
    console.error('[concierge-tool] update_guest_notes failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Tool 7: escalate_to_human
// ---------------------------------------------------------------------------

export async function escalateToHuman(
  params: {
    reason: string;
    urgency?: 'normal' | 'urgent';
  },
  guestId: string,
  weddingId: string,
): Promise<ToolResult> {
  try {
    const isUrgent = params.urgency === 'urgent';

    // (a) Update guest conversation state
    const { error: stateErr } = await supabase
      .from('guests')
      .update({
        conversation_state: 'needs_escalation',
      } as any)
      .eq('id', guestId);

    if (stateErr) throw stateErr;

    // (b) Create coordination issue
    const issueRecord = {
      wedding_id: weddingId,
      guest_id: guestId,
      category: 'escalation',
      title: isUrgent
        ? `[URGENT] Escalation: ${params.reason.slice(0, 80)}`
        : `Escalation: ${params.reason.slice(0, 80)}`,
      description: params.reason,
      priority: isUrgent ? 'urgent' : 'high',
      status: 'open',
      source: 'escalation',
      metadata: { urgency: params.urgency || 'normal' },
    };

    const { data, error: issueErr } = await supabase
      .from('coordination_issues')
      .insert(issueRecord)
      .select()
      .single();

    if (issueErr) throw issueErr;
    return { success: true, data };
  } catch (err: any) {
    console.error('[concierge-tool] escalate_to_human failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Tool 8: update_conversation_state
// ---------------------------------------------------------------------------

export async function updateConversationState(
  params: {
    topic: string;
    state: 'idle' | 'awaiting_response' | 'collecting_info' | 'needs_escalation' | 'resolved';
  },
  guestId: string,
  _weddingId: string,
): Promise<ToolResult> {
  try {
    const { error } = await supabase
      .from('guests')
      .update({
        conversation_state: params.state,
        conversation_topic: params.topic,
      } as any)
      .eq('id', guestId);

    if (error) throw error;
    return { success: true, data: { state: params.state, topic: params.topic } };
  } catch (err: any) {
    console.error('[concierge-tool] update_conversation_state failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const TOOL_HANDLERS: Record<
  string,
  (params: any, guestId: string, weddingId: string) => Promise<ToolResult>
> = {
  update_guest_rsvp: updateGuestRsvp,
  update_guest_flight: updateGuestFlight,
  update_guest_hotel: updateGuestHotel,
  update_guest_visa: updateGuestVisa,
  create_coordination_issue: createCoordinationIssue,
  update_guest_notes: updateGuestNotes,
  escalate_to_human: escalateToHuman,
  update_conversation_state: updateConversationState,
};

export async function dispatchTool(
  toolName: string,
  params: Record<string, any>,
  guestId: string,
  weddingId: string,
): Promise<ToolResult> {
  const handler = TOOL_HANDLERS[toolName];

  if (!handler) {
    console.error(`[concierge-tool] Unknown tool: ${toolName}`);
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  console.log(`[concierge-tool] Executing ${toolName} for guest=${guestId} wedding=${weddingId}`);

  try {
    const result = await handler(params, guestId, weddingId);
    console.log(
      `[concierge-tool] ${toolName} ${result.success ? 'succeeded' : 'failed'}`,
      result.success ? '' : result.error,
    );
    return result;
  } catch (err: any) {
    console.error(`[concierge-tool] ${toolName} threw unexpected error:`, err);
    return { success: false, error: err.message || 'Unexpected error' };
  }
}
