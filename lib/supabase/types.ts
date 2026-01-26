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
  plus_one_country_code?: string
  plus_one_phone?: string
  country_code?: string
  plus_one: boolean
  food_preference?: string[]
  song_request?: string
  special_message?: string
  maybe_comment?: string
  arrival_option?: string
  arrival_date?: string
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
  plusOneCountryCode?: string
  plusOnePhone?: string
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
  arrivalOption: 'known' | 'not_sure' | ''
  arrivalDate: string
  
  // Flight Details (optional)
  flightAirline?: string
  flightNumber?: string
  flightDepartureAirport?: string
  flightArrivalAirport?: string
  flightDepartureDate?: string
  flightDepartureTime?: string
  flightArrivalDate?: string
  flightArrivalTime?: string
  shuttlePreferenceTime?: string
  shuttlePreferenceNote?: string
  
  // WhatsApp opt-in
  whatsappOptIn?: boolean
  
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

export interface GuestFlight {
  id: string
  guest_id: string
  wedding_id: string
  airline?: string
  flight_number?: string
  departure_airport?: string
  arrival_airport?: string
  departure_datetime?: string
  arrival_datetime?: string
  shuttle_preference_time?: string
  shuttle_preference_note?: string
  created_at: string
  updated_at: string
  guest?: Guest
}

export interface GuestChecklistItem {
  id: string
  guest_id: string
  wedding_id: string
  item_key: string
  completed: boolean
  completed_at?: string
  created_at: string
}

export interface FlightFormData {
  airline: string
  flightNumber: string
  departureAirport: string
  arrivalAirport: string
  departureDate: string
  departureTime: string
  arrivalDate: string
  arrivalTime: string
  shuttlePreferenceTime: string
  shuttlePreferenceNote: string
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
      guest_flights: {
        Row: GuestFlight
        Insert: Omit<GuestFlight, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<GuestFlight>
      }
      guest_checklist_items: {
        Row: GuestChecklistItem
        Insert: Omit<GuestChecklistItem, 'id' | 'created_at'>
        Update: Partial<GuestChecklistItem>
      }
      travel_bus_signups: {
        Row: {
          id: string
          wedding_id: string
          name: string
          email: string
          party_size: number
          bangkok_to_huahin: boolean
          huahin_to_airport: boolean
          huahin_to_sukhumvit: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          name: string
          email: string
          party_size?: number
          bangkok_to_huahin?: boolean
          huahin_to_airport?: boolean
          huahin_to_sukhumvit?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          name?: string
          email?: string
          party_size?: number
          bangkok_to_huahin?: boolean
          huahin_to_airport?: boolean
          huahin_to_sukhumvit?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      whatsapp_opt_ins: {
        Row: {
          id: string
          guest_id: string
          wedding_id: string
          phone_number: string
          opted_in: boolean
          opt_in_method: string | null
          opted_in_at: string
          opted_out_at: string | null
        }
        Insert: {
          id?: string
          guest_id: string
          wedding_id: string
          phone_number: string
          opted_in?: boolean
          opt_in_method?: string | null
          opted_in_at?: string
          opted_out_at?: string | null
        }
        Update: {
          id?: string
          guest_id?: string
          wedding_id?: string
          phone_number?: string
          opted_in?: boolean
          opt_in_method?: string | null
          opted_in_at?: string
          opted_out_at?: string | null
        }
      }
      whatsapp_templates: {
        Row: {
          id: string
          name: string
          category: string
          language: string
          content: string
          parameters: any
          meta_template_id: string | null
          status: string
          created_at: string
          approved_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          language?: string
          content: string
          parameters?: any
          meta_template_id?: string | null
          status?: string
          created_at?: string
          approved_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          language?: string
          content?: string
          parameters?: any
          meta_template_id?: string | null
          status?: string
          created_at?: string
          approved_at?: string | null
        }
      }
      whatsapp_chat_history: {
        Row: {
          id: string
          wedding_id: string
          guest_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          wa_message_id: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          guest_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          wa_message_id?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          guest_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          wa_message_id?: string | null
          metadata?: any
          created_at?: string
        }
      }
      whatsapp_messages: {
        Row: {
          id: string
          guest_id: string
          wedding_id: string
          phone_number: string
          template_name: string | null
          message_type: string | null
          content: string | null
          parameters: any
          wa_message_id: string | null
          status: string | null
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          guest_id: string
          wedding_id: string
          phone_number: string
          template_name?: string | null
          message_type?: string | null
          content?: string | null
          parameters?: any
          wa_message_id?: string | null
          status?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          guest_id?: string
          wedding_id?: string
          phone_number?: string
          template_name?: string | null
          message_type?: string | null
          content?: string | null
          parameters?: any
          wa_message_id?: string | null
          status?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      whatsapp_broadcasts: {
        Row: {
          id: string
          wedding_id: string
          name: string
          template_name: string
          filters: any
          scheduled_at: string | null
          sent_at: string | null
          total_recipients: number | null
          successful_sends: number
          failed_sends: number
          status: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          name: string
          template_name: string
          filters?: any
          scheduled_at?: string | null
          sent_at?: string | null
          total_recipients?: number | null
          successful_sends?: number
          failed_sends?: number
          status?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wedding_id?: string
          name?: string
          template_name?: string
          filters?: any
          scheduled_at?: string | null
          sent_at?: string | null
          total_recipients?: number | null
          successful_sends?: number
          failed_sends?: number
          status?: string
          created_by?: string | null
          created_at?: string
        }
      }
    }
  }
}
