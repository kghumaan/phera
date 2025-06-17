import { supabase } from './client'
import type { RSVPFormData } from './types'

// Generate a random color for avatar
function generateAvatarColor(name: string): string {
  const colors = [
    '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
    '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
    '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548'
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

export async function submitRSVP(formData: RSVPFormData, weddingId: string) {
  try {
    const fullName = `${formData.firstName} ${formData.lastName}`;
    const avatarColor = generateAvatarColor(fullName);
    
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
      // Update existing guest info
      await supabase
        .from('guests')
        .update({
          name: fullName,
          phone: formData.phone,
          wedding_id: weddingId,
          avatar_color: avatarColor,
          wedding_side: formData.weddingSide,
          // Don't update auth_method if guest already exists (they may have signed in before)
        })
        .eq('id', guestId)
    } else {
      // Insert new guest
      const { data: newGuest, error: guestError } = await supabase
        .from('guests')
        .insert({
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          wedding_id: weddingId,
          avatar_color: avatarColor,
          auth_method: 'email', // Default to email for now, will be updated when actual auth is implemented
          wedding_side: formData.weddingSide,
        })
        .select('id')
        .single()

      if (guestError) throw guestError
      guestId = newGuest.id
    }

    // Insert general RSVP record (since we removed ceremony selection)
    console.log('About to insert RSVP with data:', {
      guest_id: guestId,
      wedding_id: weddingId,
      event_id: 'general',
      attending: formData.attending,
      guest_count: formData.guestCount
    });

    if (formData.attending) {
      const rsvpRecord = {
        guest_id: guestId,
        wedding_id: weddingId,
        event_id: 'general', // General attendance
        attending: true,
        guest_count: formData.guestCount,
        plus_one_name: formData.plusOneName || null,
        plus_one_email: formData.plusOneEmail || null,
        dietary_restrictions: formData.dietaryRestrictions || null
      };
      
      console.log('Inserting RSVP record:', rsvpRecord);
      
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
    } else {
      // Insert a "not attending" record
      const rsvpRecord = {
        guest_id: guestId,
        wedding_id: weddingId,
        event_id: 'general',
        attending: false,
        guest_count: 0,
        plus_one_name: null,
        plus_one_email: null,
        dietary_restrictions: null
      };
      
      console.log('Inserting not attending RSVP record:', rsvpRecord);
      
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvps')
        .upsert(rsvpRecord, {
          onConflict: 'guest_id,event_id,wedding_id'
        });
      
      console.log('RSVP upsert result (not attending):', { rsvpData, rsvpError });
      
      if (rsvpError) {
        console.error('Error inserting RSVP:', rsvpError);
        throw rsvpError;
      }
    }

    // Add special message as a comment if provided
    if (formData.specialMessage) {
      await supabase.from('comments').insert({
        guest_id: guestId,
        wedding_id: weddingId,
        message: formData.specialMessage
      })
    }

    // Store user info in local storage for auto-login
    // This creates a pseudo-authentication state that the AuthContext can pick up
    if (typeof window !== 'undefined') {
      const guestInfo = {
        id: guestId,
        email: formData.email,
        name: fullName,
        phone: formData.phone,
        weddingId: weddingId,
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
    .eq('attending', true)

  if (error) throw error
  return data
}

export async function getComments(weddingId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      guest:guests(name, initials, avatar_color)
    `)
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
} 