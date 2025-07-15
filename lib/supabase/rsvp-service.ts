import { supabase } from './client'
import type { RSVPFormData } from './types'
import { generateGuestAvatar, generateFallbackColor } from '../utils/avatar-generator'

// Generate a random color for avatar (fallback)
function generateAvatarColor(name: string): string {
  return generateFallbackColor(name)
}

export async function getExistingRSVP(email: string, weddingId: string) {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select(`
        id,
        name,
        email,
        phone,
        wedding_side,
        rsvps (
          id,
          attending,
          guest_count,
          plus_one,
          plus_one_name,
          plus_one_email,
          country_code,
          food_preference,
          dietary_restrictions,
          song_request,
          special_message,
          maybe_comment,
          arrival_option,
          arrival_date
        )
      `)
      .eq('email', email)
      .eq('wedding_id', weddingId)
      .single()

    if (error) {
      console.error('Error fetching existing RSVP:', error)
      return { success: false, error }
    }

    if (!data || !data.rsvps || data.rsvps.length === 0) {
      return { success: false, error: 'No existing RSVP found' }
    }

    const guest = data
    const rsvp = data.rsvps[0] // Assuming one RSVP per guest for general event

    // Extract country code from RSVP record and phone number from guest
    const countryCode = rsvp.country_code || '+1'
    let phone = ''

    if (guest.phone) {
      // Remove the country code from the full phone number to get just the digits
      const fullPhone = guest.phone
      if (fullPhone.startsWith(countryCode)) {
        phone = fullPhone.replace(countryCode, '').trim()
      } else {
        // Fallback: try to extract just the digits after any country code
        const phoneMatch = fullPhone.match(/^\+\d{1,4}(.+)$/)
        if (phoneMatch) {
          phone = phoneMatch[1].trim()
        } else {
          phone = fullPhone
        }
      }
    }

    // Parse name
    const nameParts = guest.name.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Convert RSVP data to form format
    const formData = {
      firstName,
      lastName,
      email: guest.email,
      phone,
      countryCode,
      attending: rsvp.attending as 'yes' | 'no' | 'maybe' | '',
      plusOne: (rsvp.plus_one ? 'yes' : 'no') as 'yes' | 'no' | '',
      plusOneName: rsvp.plus_one_name || '',
      plusOneEmail: rsvp.plus_one_email || '',
      guestCount: rsvp.guest_count || 1,
      foodPreference: Array.isArray(rsvp.food_preference) ? rsvp.food_preference : [],
      dietaryRestrictions: rsvp.dietary_restrictions || '',
      weddingSide: (guest.wedding_side as 'bride' | 'groom' | 'both') || '',
      songRequest: rsvp.song_request || '',
      specialMessage: rsvp.special_message || '',
      maybeComment: rsvp.maybe_comment || '',
      arrivalOption: rsvp.arrival_option || '',
      arrivalDate: rsvp.arrival_date || '',
    }

    return { success: true, data: formData }
  } catch (error) {
    console.error('Error fetching existing RSVP:', error)
    return { success: false, error }
  }
}

export async function submitRSVP(formData: RSVPFormData, weddingId: string) {
  try {
    const fullName = `${formData.firstName} ${formData.lastName}`;
    const avatarColor = generateAvatarColor(fullName);
    
    // Generate unique avatar
    const avatarData = generateGuestAvatar(formData.email, fullName);
    
    // Normalize attending value - handle both old boolean and new string format
    const normalizeAttending = (attending: any): 'yes' | 'no' | 'maybe' => {
      if (typeof attending === 'boolean') {
        return attending ? 'yes' : 'no';
      }
      if (typeof attending === 'string' && attending) {
        return attending as 'yes' | 'no' | 'maybe';
      }
      return 'no'; // fallback
    };

    // Normalize plus one - handle both boolean and string format
    const normalizePlusOne = (plusOne: any): boolean => {
      if (typeof plusOne === 'boolean') {
        return plusOne;
      }
      if (typeof plusOne === 'string') {
        return plusOne === 'yes' || plusOne === 'true';
      }
      return false;
    };

    // Normalize food preferences - handle both string and array format
    const normalizeFoodPreference = (foodPref: any): string[] => {
      if (Array.isArray(foodPref)) {
        return foodPref;
      }
      if (typeof foodPref === 'string' && foodPref.trim()) {
        return foodPref.split(',').map(item => item.trim());
      }
      return [];
    };

    const attendingStatus = normalizeAttending(formData.attending);
    const plusOneStatus = normalizePlusOne(formData.plusOne);
    const foodPreferences = normalizeFoodPreference(formData.foodPreference);
    
    // Create full phone number with country code
    const fullPhone = formData.phone ? 
      `${formData.countryCode || '+1'}${formData.phone}` : 
      null;
    
    console.log('Processing form data:', {
      attending: formData.attending,
      normalizedAttending: attendingStatus,
      plusOne: formData.plusOne,
      normalizedPlusOne: plusOneStatus,
      foodPreference: formData.foodPreference,
      normalizedFoodPrefs: foodPreferences
    });

    // Create or get guest
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('id')
      .eq('email', formData.email)
      .eq('wedding_id', weddingId)
      .single()

    let guestId: string

    if (existingGuest) {
      guestId = existingGuest.id
      // Update existing guest info (with new avatar data)
      await supabase
        .from('guests')
        .update({
          name: fullName,
          phone: fullPhone,
          wedding_id: weddingId,
          avatar_color: avatarColor,
          avatar_style: avatarData.style,
          avatar_seed: avatarData.seed,
          avatar_svg: avatarData.svg,
          wedding_side: formData.weddingSide || null,
        })
        .eq('id', guestId)
    } else {
      // Insert new guest
      const { data: newGuest, error: guestError } = await supabase
        .from('guests')
        .insert({
          name: fullName,
          email: formData.email,
          phone: fullPhone,
          wedding_id: weddingId,
          avatar_color: avatarColor,
          avatar_style: avatarData.style,
          avatar_seed: avatarData.seed,
          avatar_svg: avatarData.svg,
          auth_method: 'email',
          wedding_side: formData.weddingSide || null,
        })
        .select('id')
        .single()

      if (guestError) throw guestError
      guestId = newGuest.id
    }

    // Prepare comprehensive RSVP record with all form data
    const rsvpRecord = {
      guest_id: guestId,
      wedding_id: weddingId,
      event_id: 'general',
      attending: attendingStatus,
      guest_count: attendingStatus === 'yes' ? (formData.guestCount || 1) : 0,
      plus_one: plusOneStatus,
      plus_one_name: plusOneStatus && formData.plusOneName ? formData.plusOneName : null,
      plus_one_email: plusOneStatus && formData.plusOneEmail ? formData.plusOneEmail : null,
      country_code: formData.countryCode || '+1',
      food_preference: foodPreferences.length > 0 ? foodPreferences : null,
      dietary_restrictions: formData.dietaryRestrictions || null,
      song_request: formData.songRequest || null,
      special_message: formData.specialMessage || null,
      maybe_comment: formData.maybeComment || null,
      arrival_option: formData.arrivalOption || null,
      arrival_date: formData.arrivalDate || null,
    };

    console.log('Inserting comprehensive RSVP record:', rsvpRecord);
    
    const { data: rsvpData, error: rsvpError } = await supabase
      .from('rsvps')
      .upsert(rsvpRecord, {
        onConflict: 'guest_id,event_id,wedding_id'
      });
    
    console.log('RSVP upsert result:', { rsvpData, rsvpError });
    
    if (rsvpError) {
      console.error('Error inserting RSVP:', rsvpError);
      throw rsvpError;
    }

    // Add special message as a comment if provided (keep for backwards compatibility)
    if (formData.specialMessage || formData.selectedGif) {
      const commentData: any = {
        guest_id: guestId,
        wedding_id: weddingId,
        message: formData.specialMessage || null
      };

      // Add GIF data if selected
      if (formData.selectedGif) {
        commentData.gif_id = formData.selectedGif.id;
        commentData.gif_url = formData.selectedGif.url;
        commentData.gif_title = formData.selectedGif.title;
        commentData.gif_preview_url = formData.selectedGif.preview_url;
      }

      await supabase.from('comments').insert(commentData);
    }

    // Store user info in local storage for auto-login (with avatar data)
    if (typeof window !== 'undefined') {
      const guestInfo = {
        id: guestId,
        email: formData.email,
        name: fullName,
        phone: fullPhone,
        weddingId: weddingId,
        avatar_style: avatarData.style,
        avatar_seed: avatarData.seed,
        avatar_svg: avatarData.svg,
        timestamp: Date.now()
      };
      localStorage.setItem('phera_guest_auth', JSON.stringify(guestInfo));
    }

    return { success: true, guestId }
  } catch (error) {
    console.error('Error submitting RSVP:', error)
    return { success: false, error }
  }
}

export async function getAttendees(weddingId: string) {
  const { data, error } = await supabase
    .from('rsvps')
    .select(`
      *,
      guest:guests(*)
    `)
    .eq('wedding_id', weddingId)
    .eq('attending', 'yes')

  if (error) throw error
  return data
}

export async function getAllRSVPs(weddingId: string) {
  const { data, error } = await supabase
    .from('rsvps')
    .select(`
      *,
      guest:guests(*)
    `)
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getMaybeAttendees(weddingId: string) {
  const { data, error } = await supabase
    .from('rsvps')
    .select(`
      *,
      guest:guests(*)
    `)
    .eq('wedding_id', weddingId)
    .eq('attending', 'maybe')

  if (error) throw error
  return data
}

export async function getComments(weddingId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      guest:guests(name, initials, avatar_color, avatar_style, avatar_seed, avatar_svg)
    `)
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addComment(
  weddingId: string, 
  guestId: string, 
  message: string, 
  gifData?: {
    gif_id: string;
    gif_url: string;
    gif_title: string;
    gif_preview_url: string;
  }
) {
  const insertData: any = {
    guest_id: guestId,
    wedding_id: weddingId,
    message: message
  };

  // Add GIF data if provided
  if (gifData) {
    insertData.gif_id = gifData.gif_id;
    insertData.gif_url = gifData.gif_url;
    insertData.gif_title = gifData.gif_title;
    insertData.gif_preview_url = gifData.gif_preview_url;
  }

  const { data, error } = await supabase
    .from('comments')
    .insert(insertData)
    .select(`
      *,
      guest:guests(name, initials, avatar_color, avatar_style, avatar_seed, avatar_svg)
    `)
    .single()

  if (error) throw error
  return data
}

export async function deleteComment(commentId: string, guestId: string) {
  // Only allow users to delete their own comments
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('guest_id', guestId)

  if (error) throw error
  return { success: true }
} 