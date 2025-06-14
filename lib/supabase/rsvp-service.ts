import { supabase } from './client'
import { RSVPFormData } from './types'

// Helper function to generate avatar color based on name
function generateAvatarColor(name: string): string {
  // Create a simple hash of the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex color
  const color = Math.abs(hash).toString(16).substring(0, 6).padStart(6, '0');
  return `#${color}`;
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
          avatar_color: avatarColor
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
          avatar_color: avatarColor
        })
        .select('id')
        .single()

      if (guestError) throw guestError
      guestId = newGuest.id
    }

    // Insert RSVPs for each ceremony they're attending
    if (formData.attending && formData.ceremonyAttending.length > 0) {
      const rsvpPromises = formData.ceremonyAttending.map(ceremony =>
        supabase.from('rsvps').upsert({
          guest_id: guestId,
          wedding_id: weddingId,
          event_id: ceremony.toLowerCase().replace(/\s+/g, '-'),
          attending: true,
          guest_count: formData.guestCount,
          dietary_restrictions: formData.dietaryRestrictions
        })
      )

      await Promise.all(rsvpPromises)
    } else if (!formData.attending) {
      // Insert a "not attending" record
      await supabase.from('rsvps').upsert({
        guest_id: guestId,
        wedding_id: weddingId,
        event_id: 'general',
        attending: false,
        guest_count: 0
      })
    }

    // Add special message as a comment if provided
    if (formData.specialMessage) {
      await supabase.from('comments').insert({
        guest_id: guestId,
        wedding_id: weddingId,
        message: formData.specialMessage
      })
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