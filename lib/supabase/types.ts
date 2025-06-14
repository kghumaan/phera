export interface Guest {
  id: string
  name: string
  email: string
  phone?: string
  initials: string
  avatar_color: string
  wedding_id: string
  created_at: string
}

export interface RSVP {
  id: string
  guest_id: string
  wedding_id: string
  event_id: string
  attending: boolean
  guest_count: number
  dietary_restrictions?: string
  created_at: string
  guest?: Guest
}

export interface RSVPFormData {
  // Basic Information
  firstName: string
  lastName: string
  email: string
  phone?: string
  
  // Attendance
  attending: boolean
  plusOne: boolean
  plusOneName?: string
  guestCount: number
  
  // Event-specific
  ceremonyAttending: string[]
  foodPreference: string
  dietaryRestrictions?: string
  
  // Cultural & Personal
  relationshipToBride?: string
  relationshipToGroom?: string
  traditionalWear?: boolean
  
  // Logistics
  needsAccommodation?: boolean
  accommodationNights?: number
  transportationNeeded?: boolean
  
  // Fun & Engagement
  songRequest?: string
  specialMessage?: string
  participation?: string[]
}

export interface Comment {
  id: string
  guest_id: string
  wedding_id: string
  message: string
  created_at: string
  guest?: Guest
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