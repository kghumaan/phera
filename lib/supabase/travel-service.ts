import { supabase } from './client';
import { Database } from './types';

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
  passport_image_path?: string | null;
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
      passport_image_path: data.passport_image_path || null,
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
