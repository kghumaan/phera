export interface Guest {
  id: string
  name: string
  email: string
  phone?: string
  initials: string
  avatar_color: string
  avatar_style?: string
  avatar_seed?: string
  avatar_svg?: string
  wedding_id: string
  auth_method?: string
  wedding_side?: string
  created_at: string
}

export interface RSVP {
  id: string
  guest_id: string
  wedding_id: string
  event_id: string
  attending: 'yes' | 'no' | 'maybe'
  guest_count: number
  dietary_restrictions?: string
  plus_one_name?: string
  plus_one_email?: string
  country_code?: string
  plus_one: boolean
  food_preference?: string[]
  song_request?: string
  special_message?: string
  maybe_comment?: string
  created_at: string
  guest?: Guest
}

export interface GifData {
  id: string
  url: string
  title: string
  preview_url: string
}

export interface RSVPFormData {
  // Basic Information
  firstName: string
  lastName: string
  email: string
  phone?: string
  countryCode?: string
  
  // Attendance
  attending: 'yes' | 'no' | 'maybe' | '' | boolean // Support both new and old format
  plusOne: 'yes' | 'no' | '' | boolean // Support both string and boolean format
  plusOneName?: string
  plusOneEmail?: string
  guestCount: number
  maybeComment?: string
  
  // Event-specific
  foodPreference: string[] // Array of food preferences
  dietaryRestrictions?: string
  
  // Cultural & Personal
  weddingSide?: 'bride' | 'groom' | 'both' | ''
  
  // Fun & Engagement
  songRequest?: string
  specialMessage?: string
  selectedGif?: GifData
  
  // Backward compatibility (optional fields)
  ceremonyAttending?: string[]
  relationshipToBride?: string
  relationshipToGroom?: string
  traditionalWear?: boolean
  needsAccommodation?: boolean
  accommodationNights?: number
  transportationNeeded?: boolean
  participation?: string[]
}

export interface Comment {
  id: string
  guest_id: string
  wedding_id: string
  message: string
  created_at: string
  guest?: Guest
  gif_id?: string
  gif_url?: string
  gif_title?: string
  gif_preview_url?: string
}

export interface Database {
  public: {
    Tables: {
      guests: {
        Row: Guest
        Insert: Omit<Guest, 'id' | 'created_at' | 'initials' | 'avatar_color'>
        Update: Partial<Guest>
      }
      rsvps: {
        Row: RSVP
        Insert: Omit<RSVP, 'id' | 'created_at'>
        Update: Partial<RSVP>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at'>
        Update: Partial<Comment>
      }
    }
  }
} 