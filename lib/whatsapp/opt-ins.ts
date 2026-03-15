/**
 * WhatsApp Opt-in Management
 * Handles guest opt-in/opt-out for WhatsApp messaging
 */

import { supabase } from '../supabase/client';

export interface WhatsAppOptIn {
  id: string;
  guest_id: string | null;
  wedding_id: string;
  phone_number: string;
  opt_in_method: string | null;
  opted_in: boolean | null;
  opted_in_at: string | null;
  opted_out_at: string | null;
}

/**
 * Create an opt-in record for a guest
 */
export async function createOptIn(
  guestId: string,
  weddingId: string,
  phoneNumber: string,
  method: 'rsvp_form' | 'manual' | 'api' = 'rsvp_form'
): Promise<WhatsAppOptIn | null> {
  try {
    // Check if opt-in already exists
    const { data: existing, error: checkError } = await supabase
      .from('whatsapp_opt_ins')
      .select('*')
      .eq('guest_id', guestId)
      .eq('wedding_id', weddingId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('Error checking existing opt-in:', checkError);
      throw checkError;
    }

    // If already opted in and not opted out, return existing
    if (existing && existing.opted_in) {
      console.log('✅ Guest already opted in:', existing.id);
      return existing as WhatsAppOptIn;
    }

    // If previously opted out, update to opt back in
    if (existing && !existing.opted_in) {
      const { data: updated, error: updateError } = await supabase
        .from('whatsapp_opt_ins')
        .update({
          opted_in: true,
          opted_in_at: new Date().toISOString(),
          phone_number: phoneNumber,
          opt_in_method: method,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating opt-in:', updateError);
        throw updateError;
      }

      console.log('✅ Guest re-opted in:', updated.id);
      return updated as WhatsAppOptIn;
    }

    // Create new opt-in
    const { data, error } = await supabase
      .from('whatsapp_opt_ins')
      .insert({
        guest_id: guestId,
        wedding_id: weddingId,
        phone_number: phoneNumber,
        opt_in_method: method,
        opted_in_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating opt-in:', error);
      throw error;
    }

    console.log('✅ Opt-in created:', data.id);
    return data as WhatsAppOptIn;
  } catch (error) {
    console.error('Failed to create opt-in:', error);
    return null;
  }
}

/**
 * Check if a guest is opted in (and not opted out)
 */
export async function checkOptInStatus(
  guestId: string,
  weddingId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_opt_ins')
      .select('opted_in')
      .eq('guest_id', guestId)
      .eq('wedding_id', weddingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No opt-in record found
        return false;
      }
      console.error('Error checking opt-in status:', error);
      return false;
    }

    // Opted in if record exists and opted_in is true
    return data && data.opted_in === true;
  } catch (error) {
    console.error('Failed to check opt-in status:', error);
    return false;
  }
}

/**
 * Get opt-in phone number for a guest
 */
export async function getOptInPhone(
  guestId: string,
  weddingId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_opt_ins')
      .select('phone_number, opted_in')
      .eq('guest_id', guestId)
      .eq('wedding_id', weddingId)
      .single();

    if (error || !data || !data.opted_in) {
      return null;
    }

    return data.phone_number;
  } catch (error) {
    console.error('Failed to get opt-in phone:', error);
    return null;
  }
}

/**
 * Handle opt-out for a guest
 */
export async function handleOptOut(
  guestId: string,
  weddingId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('whatsapp_opt_ins')
      .update({
        opted_in: false,
        opted_out_at: new Date().toISOString(),
      })
      .eq('guest_id', guestId)
      .eq('wedding_id', weddingId);

    if (error) {
      console.error('Error handling opt-out:', error);
      throw error;
    }

    console.log('✅ Guest opted out successfully');
    return true;
  } catch (error) {
    console.error('Failed to handle opt-out:', error);
    return false;
  }
}
