import { supabase } from './client'
import { Database } from './types'
import type { GuestFlight, GuestChecklistItem, FlightFormData } from './types'

// Thailand-specific travel checklist items
export const THAILAND_CHECKLIST = [
  { 
    key: 'evisa', 
    label: 'Apply for e-visa (if needed)', 
    description: 'Check if your country requires a visa for Thailand' 
  },
  { 
    key: 'book_flights', 
    label: 'Book flights to Thailand', 
    description: '' 
  },
  { 
    key: 'enter_flight_details', 
    label: 'Enter flight details', 
    description: 'So we can coordinate your arrival' 
  },
  { 
    key: 'arrival_card', 
    label: 'Prepare arrival card info', 
    description: "You'll fill this out on the plane" 
  },
]

// ============================================================================
// Travel Bus Signups (from main branch - Thailand-specific bus routes)
// ============================================================================

type TravelBusSignup = Database['public']['Tables']['travel_bus_signups']['Row'];
type TravelBusSignupInsert = Database['public']['Tables']['travel_bus_signups']['Insert'];

export interface TravelFormSubmission {
  wedding_id: string;
  name: string;
  email: string;
  party_size: number;
  bangkok_to_huahin: boolean;
  huahin_to_airport: boolean;
  huahin_to_sukhumvit: boolean;
}

/**
 * Submit or update a travel bus signup
 * Uses upsert to handle both new submissions and updates
 */
export async function submitTravelSignup(
  data: TravelFormSubmission
): Promise<{ data: TravelBusSignup | null; error: Error | null }> {
  try {
    console.log('[TravelService] Submitting signup:', data);
    console.log('[TravelService] Supabase client status:', {
      hasSupabase: !!supabase,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
    });

    const submissionData = {
      wedding_id: data.wedding_id,
      name: data.name,
      email: data.email,
      party_size: data.party_size,
      bangkok_to_huahin: data.bangkok_to_huahin,
      huahin_to_airport: data.huahin_to_airport,
      huahin_to_sukhumvit: data.huahin_to_sukhumvit,
    } as TravelBusSignupInsert;

    console.log('[TravelService] About to call supabase.from()...');

    // Upsert without .select() - matching the working RSVP service pattern
    const { data: result, error: upsertError } = await supabase
      .from('travel_bus_signups')
      .upsert(submissionData, {
        onConflict: 'wedding_id,email',
      });

    console.log('[TravelService] Response received from Supabase:', {
      hasData: !!result,
      hasError: !!upsertError,
      errorDetails: upsertError,
    });

    if (upsertError) {
      console.error('[TravelService] Upsert error:', upsertError);

      // Check for common error types
      if (upsertError.message.includes('relation') && upsertError.message.includes('does not exist')) {
        return {
          data: null,
          error: new Error('Database table not set up. Please contact support.'),
        };
      }

      if (upsertError.message.includes('permission') || upsertError.message.includes('policy')) {
        return {
          data: null,
          error: new Error('Permission denied. Please check database policies.'),
        };
      }

      return {
        data: null,
        error: new Error(upsertError.message || 'Failed to submit signup'),
      };
    }

    console.log('[TravelService] Signup successful:', result);

    return {
      data: result,
      error: null,
    };
  } catch (err: any) {
    console.error('[TravelService] Unexpected error:', err);
    return {
      data: null,
      error: new Error(err.message || 'An unexpected error occurred'),
    };
  }
}

/**
 * Get all travel signups for a wedding
 */
export async function getTravelSignups(weddingId: string) {
  try {
    const { data, error } = await supabase
      .from('travel_bus_signups')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[TravelService] Error fetching signups:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('[TravelService] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Get signup for a specific email
 */
export async function getTravelSignupByEmail(weddingId: string, email: string) {
  try {
    const { data, error } = await supabase
      .from('travel_bus_signups')
      .select('*')
      .eq('wedding_id', weddingId)
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      console.error('[TravelService] Error fetching signup:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('[TravelService] Unexpected error:', err);
    return { data: null, error: err };
  }
}

// ============================================================================
// Guest Flight Operations (from develop branch - general flight management)
// ============================================================================

export async function getGuestFlight(guestId: string, weddingId: string): Promise<GuestFlight | null> {
  try {
    const { data, error } = await supabase
      .from('guest_flights')
      .select('*')
      .eq('guest_id', guestId)
      .eq('wedding_id', weddingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - not an error
        return null
      }
      console.error('Error fetching guest flight:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching guest flight:', error)
    return null
  }
}

export async function upsertGuestFlight(
  guestId: string, 
  weddingId: string, 
  flightData: Partial<FlightFormData>
): Promise<{ success: boolean; data?: GuestFlight; error?: any }> {
  try {
    // Convert form data to database format
    const departureDatetime = flightData.departureDate && flightData.departureTime
      ? `${flightData.departureDate}T${flightData.departureTime}:00`
      : null
    
    const arrivalDatetime = flightData.arrivalDate && flightData.arrivalTime
      ? `${flightData.arrivalDate}T${flightData.arrivalTime}:00`
      : null

    const dbData = {
      guest_id: guestId,
      wedding_id: weddingId,
      airline: flightData.airline || null,
      flight_number: flightData.flightNumber || null,
      departure_airport: flightData.departureAirport || null,
      arrival_airport: flightData.arrivalAirport || null,
      departure_datetime: departureDatetime,
      arrival_datetime: arrivalDatetime,
      shuttle_preference_time: flightData.shuttlePreferenceTime || null,
      shuttle_preference_note: flightData.shuttlePreferenceNote || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('guest_flights')
      .upsert(dbData, {
        onConflict: 'guest_id,wedding_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting guest flight:', error)
      return { success: false, error }
    }

    // Auto-check the "enter_flight_details" checklist item if flight data was saved
    if (flightData.airline || flightData.flightNumber) {
      await updateChecklistItem(guestId, weddingId, 'enter_flight_details', true)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error upserting guest flight:', error)
    return { success: false, error }
  }
}

export async function getAllGuestFlights(weddingId: string): Promise<GuestFlight[]> {
  try {
    const { data, error } = await supabase
      .from('guest_flights')
      .select(`
        *,
        guest:guests(id, name, email, phone)
      `)
      .eq('wedding_id', weddingId)
      .order('arrival_datetime', { ascending: true });

    if (error) {
      console.error('Error fetching all guest flights:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching all guest flights:', error)
    return []
  }
}

// ============================================================================
// Guest Checklist Operations (from develop branch)
// ============================================================================

export async function getGuestChecklist(guestId: string, weddingId: string): Promise<GuestChecklistItem[]> {
  try {
    const { data, error } = await supabase
      .from('guest_checklist_items')
      .select('*')
      .eq('guest_id', guestId)
      .eq('wedding_id', weddingId);

    if (error) {
      console.error('Error fetching guest checklist:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching guest checklist:', error)
    return []
  }
}

export async function updateChecklistItem(
  guestId: string, 
  weddingId: string, 
  itemKey: string, 
  completed: boolean
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('guest_checklist_items')
      .upsert({
        guest_id: guestId,
        wedding_id: weddingId,
        item_key: itemKey,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'guest_id,wedding_id,item_key'
      })

    if (error) {
      console.error('Error updating checklist item:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating checklist item:', error)
    return { success: false, error }
  }
}

export async function getAllGuestChecklists(weddingId: string): Promise<{
  guestId: string;
  guestName: string;
  guestEmail: string;
  completedItems: string[];
  totalItems: number;
}[]> {
  try {
    // First get all guests who RSVP'd yes
    const { data: rsvpData, error: rsvpError } = await supabase
      .from('rsvps')
      .select(`
        guest_id,
        guests(id, name, email)
      `)
      .eq('wedding_id', weddingId)
      .eq('attending', 'yes')

    if (rsvpError) {
      console.error('Error fetching RSVPs for checklist:', rsvpError)
      return []
    }

    if (!rsvpData || rsvpData.length === 0) {
      return []
    }

    // Get all checklist items for these guests
    const guestIds = rsvpData.map(r => r.guest_id)
    const { data: checklistData, error: checklistError } = await supabase
      .from('guest_checklist_items')
      .select('*')
      .eq('wedding_id', weddingId)
      .in('guest_id', guestIds)

    if (checklistError) {
      console.error('Error fetching checklist items:', checklistError)
    }

    // Combine data
    return rsvpData.map(rsvp => {
      const guest = rsvp.guests as any
      const guestChecklist = checklistData?.filter(c => c.guest_id === rsvp.guest_id) || []
      const completedItems = guestChecklist.filter(c => c.completed).map(c => c.item_key)

      return {
        guestId: rsvp.guest_id || '',
        guestName: guest?.name || 'Unknown',
        guestEmail: guest?.email || '',
        completedItems,
        totalItems: THAILAND_CHECKLIST.length,
      }
    })
  } catch (error) {
    console.error('Error fetching all guest checklists:', error)
    return []
  }
}

// Get shuttle preferences aggregated by time
export async function getShuttlePreferencesSummary(weddingId: string): Promise<{
  time: string;
  guests: { id: string; name: string; note?: string }[];
}[]> {
  try {
    const { data, error } = await supabase
      .from('guest_flights')
      .select(`
        shuttle_preference_time,
        shuttle_preference_note,
        guest:guests(id, name)
      `)
      .eq('wedding_id', weddingId)
      .not('shuttle_preference_time', 'is', null)
      .order('shuttle_preference_time', { ascending: true });

    if (error) {
      console.error('Error fetching shuttle preferences:', error)
      return []
    }

    // Group by time
    const grouped: Record<string, { id: string; name: string; note?: string }[]> = {}
    
    data?.forEach(item => {
      const time = item.shuttle_preference_time || 'Unspecified'
      const guest = item.guest as any
      
      if (!grouped[time]) {
        grouped[time] = []
      }
      
      grouped[time].push({
        id: guest?.id || '',
        name: guest?.name || 'Unknown',
        note: item.shuttle_preference_note || undefined,
      })
    })

    return Object.entries(grouped).map(([time, guests]) => ({
      time,
      guests,
    }))
  } catch (error) {
    console.error('Error fetching shuttle preferences summary:', error)
    return []
  }
}
