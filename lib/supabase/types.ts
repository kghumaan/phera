export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface GifData {
  id: string;
  url: string;
  title: string;
  preview_url: string;
}

export interface RSVPFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  countryCode: string;
  phone: string;
  attending: 'yes' | 'no' | 'maybe' | '';
  plusOne: 'yes' | 'no' | '';
  plusOneName: string;
  plusOneEmail: string;
  plusOneCountryCode: string;
  plusOnePhone: string;
  guestCount: number;
  foodPreference: string[];
  dietaryRestrictions: string;
  weddingSide: 'bride' | 'groom' | 'both' | '' | undefined;
  songRequest: string;
  specialMessage: string;
  maybeComment: string;
  selectedGif?: GifData;
  whatsappOptIn?: boolean;
  custom_answers?: Record<string, any>;
}

// Custom RSVP Question Types
export interface CustomQuestion {
  id: string;
  label: string;
  type: 'short_text' | 'long_text' | 'numeric' | 'dropdown' | 'date';
  required: boolean;
  options?: string[];
}

export interface RSVPCustomQuestionStep {
  id: string;
  wedding_id: string;
  step_title: string;
  description?: string | null;
  insert_after: string;
  order_index: number;
  questions: CustomQuestion[];
  created_at: string | null;
  updated_at: string | null;
}

// Transportation Types
export type TransportationMode = 'prescheduled' | 'flexible';
export type TransportationDirection = 'arrival' | 'departure';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TransportationSettings {
  id: string;
  wedding_id: string | null;
  setup_complete: boolean | null;
  mode: TransportationMode | null;
  arrival_configured: boolean | null;
  departure_configured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TransportationVehicle {
  id: string;
  wedding_id: string | null;
  direction: TransportationDirection;
  vehicle_name: string | null;
  capacity: number;
  departure_datetime: string;
  pickup_location: string | null;
  pickup_location_coordinates: Coordinates | null;
  dropoff_location: string | null;
  dropoff_location_coordinates: Coordinates | null;
  order_index: number | null;
  is_full: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TransportationPickupLocation {
  id: string;
  wedding_id: string | null;
  direction: TransportationDirection;
  name: string;
  address: string | null;
  coordinates: Coordinates | null;
  order_index: number | null;
  created_at: string | null;
}

export interface TransportationTimeRange {
  id: string;
  wedding_id: string | null;
  direction: TransportationDirection;
  start_datetime: string;
  end_datetime: string;
  interval_minutes: number | null;
  created_at: string | null;
}

export interface TransportationVehicleType {
  id: string;
  wedding_id: string | null;
  name: string;
  capacity: number;
  quantity: number | null;
  created_at: string | null;
}

export interface TransportationReservation {
  id: string;
  wedding_id: string | null;
  guest_id: string | null;
  direction: TransportationDirection;
  vehicle_id: string | null;
  pickup_location_id: string | null;
  preferred_datetime: string | null;
  party_size: number | null;
  status: ReservationStatus | null;
  assigned_group_id: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  guest?: {
    id: string;
    name: string;
    email: string;
  };
  vehicle?: TransportationVehicle;
  pickup_location?: TransportationPickupLocation;
}

export interface TransportationGroup {
  id: string;
  wedding_id: string | null;
  direction: TransportationDirection;
  vehicle_type_id: string | null;
  pickup_location_id: string | null;
  departure_datetime: string | null;
  total_passengers: number | null;
  is_finalized: boolean | null;
  created_at: string | null;
  // Joined data
  vehicle_type?: TransportationVehicleType;
  pickup_location?: TransportationPickupLocation;
  reservations?: TransportationReservation[];
}

export type PheraDatabase = {
  public: {
    Tables: {
      comments: {
        Row: {
          created_at: string | null
          gif_id: string | null
          gif_preview_url: string | null
          gif_title: string | null
          gif_url: string | null
          guest_id: string | null
          id: string
          message: string | null
          wedding_id: string
        }
        Insert: {
          created_at?: string | null
          gif_id?: string | null
          gif_preview_url?: string | null
          gif_title?: string | null
          gif_url?: string | null
          guest_id?: string | null
          id?: string
          message?: string | null
          wedding_id: string
        }
        Update: {
          created_at?: string | null
          gif_id?: string | null
          gif_preview_url?: string | null
          gif_title?: string | null
          gif_url?: string | null
          guest_id?: string | null
          id?: string
          message?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          wedding_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          wedding_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_checklist_items: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          guest_id: string | null
          id: string
          item_key: string
          wedding_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          item_key: string
          wedding_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          item_key?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_checklist_items_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_flights: {
        Row: {
          airline: string | null
          arrival_airport: string | null
          arrival_datetime: string | null
          created_at: string | null
          departure_airport: string | null
          departure_datetime: string | null
          flight_number: string | null
          guest_id: string | null
          id: string
          shuttle_preference_note: string | null
          shuttle_preference_time: string | null
          updated_at: string | null
          wedding_id: string
        }
        Insert: {
          airline?: string | null
          arrival_airport?: string | null
          arrival_datetime?: string | null
          created_at?: string | null
          departure_airport?: string | null
          departure_datetime?: string | null
          flight_number?: string | null
          guest_id?: string | null
          id?: string
          shuttle_preference_note?: string | null
          shuttle_preference_time?: string | null
          updated_at?: string | null
          wedding_id: string
        }
        Update: {
          airline?: string | null
          arrival_airport?: string | null
          arrival_datetime?: string | null
          created_at?: string | null
          departure_airport?: string | null
          departure_datetime?: string | null
          flight_number?: string | null
          guest_id?: string | null
          id?: string
          shuttle_preference_note?: string | null
          shuttle_preference_time?: string | null
          updated_at?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_flights_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          auth_method: string | null
          avatar_color: string
          avatar_seed: string | null
          avatar_style: string | null
          avatar_svg: string | null
          created_at: string | null
          email: string
          id: string
          initials: string | null
          name: string
          phone: string | null
          wedding_id: string
          wedding_side: string | null
        }
        Insert: {
          auth_method?: string | null
          avatar_color: string
          avatar_seed?: string | null
          avatar_style?: string | null
          avatar_svg?: string | null
          created_at?: string | null
          email: string
          id?: string
          initials?: string | null
          name: string
          phone?: string | null
          wedding_id: string
          wedding_side?: string | null
        }
        Update: {
          auth_method?: string | null
          avatar_color?: string
          avatar_seed?: string | null
          avatar_style?: string | null
          avatar_svg?: string | null
          created_at?: string | null
          email?: string
          id?: string
          initials?: string | null
          name?: string
          phone?: string | null
          wedding_id?: string
          wedding_side?: string | null
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          attending: string
          country_code: string | null
          created_at: string | null
          dietary_restrictions: string | null
          event_id: string
          food_preference: string[] | null
          guest_count: number | null
          guest_id: string | null
          id: string
          maybe_comment: string | null
          plus_one: boolean | null
          plus_one_country_code: string | null
          plus_one_email: string | null
          plus_one_name: string | null
          plus_one_phone: string | null
          song_request: string | null
          special_message: string | null
          wedding_id: string
        }
        Insert: {
          attending: string
          country_code?: string | null
          created_at?: string | null
          dietary_restrictions?: string | null
          event_id: string
          food_preference?: string[] | null
          guest_count?: number | null
          guest_id?: string | null
          id?: string
          maybe_comment?: string | null
          plus_one?: boolean | null
          plus_one_country_code?: string | null
          plus_one_email?: string | null
          plus_one_name?: string | null
          plus_one_phone?: string | null
          song_request?: string | null
          special_message?: string | null
          wedding_id: string
        }
        Update: {
          attending?: string
          country_code?: string | null
          created_at?: string | null
          dietary_restrictions?: string | null
          event_id?: string
          food_preference?: string[] | null
          guest_count?: number | null
          guest_id?: string | null
          id?: string
          maybe_comment?: string | null
          plus_one?: boolean | null
          plus_one_country_code?: string | null
          plus_one_email?: string | null
          plus_one_name?: string | null
          plus_one_phone?: string | null
          song_request?: string | null
          special_message?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          created_at: string | null
          description: string | null
          gradient_background: string | null
          id: string
          icon: string | null
          is_major_event: boolean | null
          linked_event_id: string | null
          location: string | null
          name: string
          order_index: number
          schedule_id: string | null
          time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          gradient_background?: string | null
          id?: string
          icon?: string | null
          is_major_event?: boolean | null
          linked_event_id?: string | null
          location?: string | null
          name: string
          order_index?: number
          schedule_id?: string | null
          time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          gradient_background?: string | null
          id?: string
          icon?: string | null
          is_major_event?: boolean | null
          linked_event_id?: string | null
          location?: string | null
          name?: string
          order_index?: number
          schedule_id?: string | null
          time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "wedding_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_bus_signups: {
        Row: {
          bangkok_to_huahin: boolean | null
          created_at: string | null
          email: string
          huahin_to_airport: boolean | null
          huahin_to_sukhumvit: boolean | null
          id: string
          name: string
          party_size: number
          passport_image_path: string | null
          updated_at: string | null
          wedding_id: string
        }
        Insert: {
          bangkok_to_huahin?: boolean | null
          created_at?: string | null
          email: string
          huahin_to_airport?: boolean | null
          huahin_to_sukhumvit?: boolean | null
          id?: string
          name: string
          party_size?: number
          passport_image_path?: string | null
          updated_at?: string | null
          wedding_id: string
        }
        Update: {
          bangkok_to_huahin?: boolean | null
          created_at?: string | null
          email?: string
          huahin_to_airport?: boolean | null
          huahin_to_sukhumvit?: boolean | null
          id?: string
          name?: string
          party_size?: number
          passport_image_path?: string | null
          updated_at?: string | null
          wedding_id?: string
        }
        Relationships: []
      }
      transportation_settings: {
        Row: {
          id: string
          wedding_id: string | null
          setup_complete: boolean | null
          mode: 'prescheduled' | 'flexible' | null
          arrival_configured: boolean | null
          departure_configured: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          wedding_id?: string | null
          setup_complete?: boolean | null
          mode?: 'prescheduled' | 'flexible' | null
          arrival_configured?: boolean | null
          departure_configured?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          wedding_id?: string | null
          setup_complete?: boolean | null
          mode?: 'prescheduled' | 'flexible' | null
          arrival_configured?: boolean | null
          departure_configured?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_settings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_vehicles: {
        Row: {
          id: string
          wedding_id: string | null
          direction: 'arrival' | 'departure'
          vehicle_name: string | null
          capacity: number
          departure_datetime: string
          pickup_location: string | null
          pickup_location_coordinates: Json | null
          dropoff_location: string | null
          dropoff_location_coordinates: Json | null
          order_index: number | null
          is_full: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          wedding_id?: string | null
          direction: 'arrival' | 'departure'
          vehicle_name?: string | null
          capacity: number
          departure_datetime: string
          pickup_location?: string | null
          pickup_location_coordinates?: Json | null
          dropoff_location?: string | null
          dropoff_location_coordinates?: Json | null
          order_index?: number | null
          is_full?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          wedding_id?: string | null
          direction?: 'arrival' | 'departure'
          vehicle_name?: string | null
          capacity?: number
          departure_datetime?: string
          pickup_location?: string | null
          pickup_location_coordinates?: Json | null
          dropoff_location?: string | null
          dropoff_location_coordinates?: Json | null
          order_index?: number | null
          is_full?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_vehicles_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_pickup_locations: {
        Row: {
          id: string
          wedding_id: string | null
          direction: 'arrival' | 'departure'
          name: string
          address: string | null
          coordinates: Json | null
          order_index: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          wedding_id?: string | null
          direction: 'arrival' | 'departure'
          name: string
          address?: string | null
          coordinates?: Json | null
          order_index?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          wedding_id?: string | null
          direction?: 'arrival' | 'departure'
          name?: string
          address?: string | null
          coordinates?: Json | null
          order_index?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_pickup_locations_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_time_ranges: {
        Row: {
          id: string
          wedding_id: string | null
          direction: 'arrival' | 'departure'
          start_datetime: string
          end_datetime: string
          interval_minutes: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          wedding_id?: string | null
          direction: 'arrival' | 'departure'
          start_datetime: string
          end_datetime: string
          interval_minutes?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          wedding_id?: string | null
          direction?: 'arrival' | 'departure'
          start_datetime?: string
          end_datetime?: string
          interval_minutes?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_time_ranges_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_vehicle_types: {
        Row: {
          id: string
          wedding_id: string | null
          name: string
          capacity: number
          quantity: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          wedding_id?: string | null
          name: string
          capacity: number
          quantity?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          wedding_id?: string | null
          name?: string
          capacity?: number
          quantity?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_vehicle_types_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_reservations: {
        Row: {
          id: string
          wedding_id: string | null
          guest_id: string | null
          direction: 'arrival' | 'departure'
          vehicle_id: string | null
          pickup_location_id: string | null
          preferred_datetime: string | null
          party_size: number | null
          status: 'pending' | 'confirmed' | 'cancelled' | null
          assigned_group_id: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          wedding_id?: string | null
          guest_id?: string | null
          direction: 'arrival' | 'departure'
          vehicle_id?: string | null
          pickup_location_id?: string | null
          preferred_datetime?: string | null
          party_size?: number | null
          status?: 'pending' | 'confirmed' | 'cancelled' | null
          assigned_group_id?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          wedding_id?: string | null
          guest_id?: string | null
          direction?: 'arrival' | 'departure'
          vehicle_id?: string | null
          pickup_location_id?: string | null
          preferred_datetime?: string | null
          party_size?: number | null
          status?: 'pending' | 'confirmed' | 'cancelled' | null
          assigned_group_id?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_reservations_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_reservations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transportation_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_reservations_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "transportation_pickup_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_groups: {
        Row: {
          id: string
          wedding_id: string | null
          direction: 'arrival' | 'departure'
          vehicle_type_id: string | null
          pickup_location_id: string | null
          departure_datetime: string | null
          total_passengers: number | null
          is_finalized: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          wedding_id?: string | null
          direction: 'arrival' | 'departure'
          vehicle_type_id?: string | null
          pickup_location_id?: string | null
          departure_datetime?: string | null
          total_passengers?: number | null
          is_finalized?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          wedding_id?: string | null
          direction?: 'arrival' | 'departure'
          vehicle_type_id?: string | null
          pickup_location_id?: string | null
          departure_datetime?: string | null
          total_passengers?: number | null
          is_finalized?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportation_groups_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_groups_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "transportation_vehicle_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_groups_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "transportation_pickup_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_access: {
        Row: {
          id: string
          user_id: string
          wedding_id: string
          verified_at: string | null
          pin_type: string | null
          allows_plus_one: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          wedding_id: string
          verified_at?: string | null
          pin_type?: string | null
          allows_plus_one?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          wedding_id?: string
          verified_at?: string | null
          pin_type?: string | null
          allows_plus_one?: boolean | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          account_type: string | null
          avatar_color: string | null
          avatar_seed: string | null
          avatar_style: string | null
          avatar_svg: string | null
          created_at: string | null
          enabled_features: string[] | null
          id: string
          onboarding_completed: boolean | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_color?: string | null
          avatar_seed?: string | null
          avatar_style?: string | null
          avatar_svg?: string | null
          created_at?: string | null
          enabled_features?: string[] | null
          id?: string
          onboarding_completed?: boolean | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_color?: string | null
          avatar_seed?: string | null
          avatar_style?: string | null
          avatar_svg?: string | null
          created_at?: string | null
          enabled_features?: string[] | null
          id?: string
          onboarding_completed?: boolean | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      wedding_admins: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_admins_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_events: {
        Row: {
          carousel_images: Json | null
          carousel_slides: Json | null
          created_at: string | null
          date: string
          dress_code: string
          dress_code_description: string | null
          dress_code_icon: string | null
          gradient_background: string | null
          id: string
          is_template: boolean | null
          name: string
          order_index: number
          outfit_example_url: string | null
          outfit_ideas_men: Json | null
          outfit_ideas_women: Json | null
          ritual_description: string | null
          ritual_name: string | null
          slug: string
          text_color: string | null
          time: string
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          carousel_images?: Json | null
          carousel_slides?: Json | null
          created_at?: string | null
          date: string
          dress_code: string
          dress_code_description?: string | null
          dress_code_icon?: string | null
          gradient_background?: string | null
          id?: string
          is_template?: boolean | null
          name: string
          order_index?: number
          outfit_example_url?: string | null
          outfit_ideas_men?: Json | null
          outfit_ideas_women?: Json | null
          ritual_description?: string | null
          ritual_name?: string | null
          slug: string
          text_color?: string | null
          time: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          carousel_images?: Json | null
          carousel_slides?: Json | null
          created_at?: string | null
          date?: string
          dress_code?: string
          dress_code_description?: string | null
          dress_code_icon?: string | null
          gradient_background?: string | null
          id?: string
          is_template?: boolean | null
          name?: string
          order_index?: number
          outfit_example_url?: string | null
          outfit_ideas_men?: Json | null
          outfit_ideas_women?: Json | null
          ritual_description?: string | null
          ritual_name?: string | null
          slug?: string
          text_color?: string | null
          time?: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_events_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_faqs: {
        Row: {
          answer: string
          button_link: string | null
          button_text: string | null
          created_at: string | null
          id: string
          order_index: number
          question: string
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          answer: string
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          id?: string
          order_index?: number
          question: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          answer?: string
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          id?: string
          order_index?: number
          question?: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_faqs_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_invites: {
        Row: {
          created_at: string | null
          email: string
          id: string
          invited_by: string | null
          role: string
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          invited_by?: string | null
          role?: string
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          role?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_invites_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_registry: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string
          external_url: string | null
          fund_name: string
          id: string
          order_index: number
          stripe_product_id: string | null
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji: string
          external_url?: string | null
          fund_name: string
          id?: string
          order_index?: number
          stripe_product_id?: string | null
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string
          external_url?: string | null
          fund_name?: string
          id?: string
          order_index?: number
          stripe_product_id?: string | null
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_registry_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_schedule: {
        Row: {
          created_at: string | null
          date: string
          day_name: string
          id: string
          order_index: number
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          day_name: string
          id?: string
          order_index?: number
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          day_name?: string
          id?: string
          order_index?: number
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_schedule_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_settings: {
        Row: {
          created_at: string | null
          custom_domain: string | null
          google_sheets_id: string | null
          id: string
          lapse_event_codes: Json | null
          pin_codes: Json | null
          updated_at: string | null
          wedding_id: string | null
          whatsapp_group_link: string | null
        }
        Insert: {
          created_at?: string | null
          custom_domain?: string | null
          google_sheets_id?: string | null
          id?: string
          lapse_event_codes?: Json | null
          pin_codes?: Json | null
          updated_at?: string | null
          wedding_id?: string | null
          whatsapp_group_link?: string | null
        }
        Update: {
          created_at?: string | null
          custom_domain?: string | null
          google_sheets_id?: string | null
          id?: string
          lapse_event_codes?: Json | null
          pin_codes?: Json | null
          updated_at?: string | null
          wedding_id?: string | null
          whatsapp_group_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_settings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_shops: {
        Row: {
          created_at: string | null
          details: string
          id: string
          name: string
          order_index: number
          updated_at: string | null
          url: string
          wedding_id: string | null
        }
        Insert: {
          created_at?: string | null
          details: string
          id?: string
          name: string
          order_index?: number
          updated_at?: string | null
          url: string
          wedding_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string
          id?: string
          name?: string
          order_index?: number
          updated_at?: string | null
          url?: string
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_shops_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_travel_cards: {
        Row: {
          button_action: string | null
          button_text: string | null
          content: Json
          created_at: string | null
          id: string
          image_url: string
          is_disabled: boolean | null
          is_whatsapp_button: boolean | null
          order_index: number
          title: string
          updated_at: string | null
          wedding_id: string | null
        }
        Insert: {
          button_action?: string | null
          button_text?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          image_url: string
          is_disabled?: boolean | null
          is_whatsapp_button?: boolean | null
          order_index?: number
          title: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Update: {
          button_action?: string | null
          button_text?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          image_url?: string
          is_disabled?: boolean | null
          is_whatsapp_button?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_travel_cards_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          background_image: string | null
          button_font_color: string | null
          couple_image_url: string | null
          couple_images: Json | null
          couple_name: string
          created_at: string | null
          created_by: string | null
          font_color: string | null
          frame_image_url: string | null
          id: string
          partner1_name: string | null
          partner2_name: string | null
          pin_entry_background: string | null
          pin_entry_button_font_color: string | null
          pin_entry_font_color: string | null
          pin_entry_primary_color: string | null
          pin_entry_subtitle_text: string | null
          pin_entry_text: string | null
          primary_color: string | null
          rsvp_deadline: string
          show_venue_location: boolean | null
          slug: string
          status: string
          updated_at: string | null
          venue_flag: string | null
          venue_location: string
          venue_name: string
          website_layout: string | null
          wedding_date: string
          wedding_date_display: string
          wedding_date_end: string | null
          welcome_text: string | null
          published_snapshot: Json | null
          has_unpublished_changes: boolean | null
          last_published_at: string | null
          hidden_rsvp_steps: string[] | null
        }
        Insert: {
          background_image?: string | null
          button_font_color?: string | null
          couple_image_url?: string | null
          couple_images?: Json | null
          couple_name: string
          created_at?: string | null
          created_by?: string | null
          font_color?: string | null
          frame_image_url?: string | null
          id?: string
          partner1_name?: string | null
          partner2_name?: string | null
          pin_entry_background?: string | null
          pin_entry_button_font_color?: string | null
          pin_entry_font_color?: string | null
          pin_entry_primary_color?: string | null
          pin_entry_subtitle_text?: string | null
          pin_entry_text?: string | null
          primary_color?: string | null
          rsvp_deadline: string
          show_venue_location?: boolean | null
          slug: string
          status?: string
          updated_at?: string | null
          venue_flag?: string | null
          venue_location: string
          venue_name: string
          website_layout?: string | null
          wedding_date: string
          wedding_date_display: string
          wedding_date_end?: string | null
          welcome_text?: string | null
          published_snapshot?: Json | null
          has_unpublished_changes?: boolean | null
          last_published_at?: string | null
          hidden_rsvp_steps?: string[] | null
        }
        Update: {
          background_image?: string | null
          button_font_color?: string | null
          couple_image_url?: string | null
          couple_images?: Json | null
          couple_name?: string
          created_at?: string | null
          created_by?: string | null
          font_color?: string | null
          frame_image_url?: string | null
          id?: string
          partner1_name?: string | null
          partner2_name?: string | null
          pin_entry_background?: string | null
          pin_entry_button_font_color?: string | null
          pin_entry_font_color?: string | null
          pin_entry_primary_color?: string | null
          pin_entry_subtitle_text?: string | null
          pin_entry_text?: string | null
          primary_color?: string | null
          rsvp_deadline?: string
          show_venue_location?: boolean | null
          slug?: string
          status?: string
          updated_at?: string | null
          venue_flag?: string | null
          venue_location?: string
          venue_name?: string
          website_layout?: string | null
          wedding_date?: string
          wedding_date_display?: string
          wedding_date_end?: string | null
          welcome_text?: string | null
          published_snapshot?: Json | null
          has_unpublished_changes?: boolean | null
          last_published_at?: string | null
          hidden_rsvp_steps?: string[] | null
        }
        Relationships: []
      }
      whatsapp_broadcasts: {
        Row: {
          created_at: string | null
          created_by: string | null
          failed_sends: number | null
          filters: Json | null
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          successful_sends: number | null
          template_name: string
          total_recipients: number | null
          wedding_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          failed_sends?: number | null
          filters?: Json | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          successful_sends?: number | null
          template_name: string
          total_recipients?: number | null
          wedding_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          failed_sends?: number | null
          filters?: Json | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          successful_sends?: number | null
          template_name?: string
          total_recipients?: number | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_broadcasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_channel_clicks: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          guest_id: string | null
          id: string
          source: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          source?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_channel_clicks_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          guest_id: string | null
          id: string
          message_type: string | null
          parameters: Json | null
          phone_number: string
          read_at: string | null
          sent_at: string | null
          status: string | null
          template_name: string | null
          wa_message_id: string | null
          wedding_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          guest_id?: string | null
          id?: string
          message_type?: string | null
          parameters?: Json | null
          phone_number: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
          wa_message_id?: string | null
          wedding_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          guest_id?: string | null
          id?: string
          message_type?: string | null
          parameters?: Json | null
          phone_number?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
          wa_message_id?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_opt_ins: {
        Row: {
          guest_id: string | null
          id: string
          opt_in_method: string | null
          opted_in: boolean | null
          opted_in_at: string | null
          opted_out_at: string | null
          phone_number: string
          wedding_id: string
        }
        Insert: {
          guest_id?: string | null
          id?: string
          opt_in_method?: string | null
          opted_in?: boolean | null
          opted_in_at?: string | null
          opted_out_at?: string | null
          phone_number: string
          wedding_id: string
        }
        Update: {
          guest_id?: string | null
          id?: string
          opt_in_method?: string | null
          opted_in?: boolean | null
          opted_in_at?: string | null
          opted_out_at?: string | null
          phone_number?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_opt_ins_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          approved_at: string | null
          category: string
          content: string
          created_at: string | null
          id: string
          language: string | null
          meta_template_id: string | null
          name: string
          parameters: Json | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          category: string
          content: string
          created_at?: string | null
          id?: string
          language?: string | null
          meta_template_id?: string | null
          name: string
          parameters?: Json | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          language?: string | null
          meta_template_id?: string | null
          name?: string
          parameters?: Json | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      rsvps_complete: {
        Row: {
          attending: string | null
          created_at: string | null
          email: string | null
          food_preference: string[] | null
          guest_count: number | null
          guest_name: string | null
          id: string | null
          phone: string | null
          plus_one_email: string | null
          plus_one_name: string | null
          song_request: string | null
        }
        Relationships: []
      }
      rsvps_with_names: {
        Row: {
          guest_id: string | null
          guest_name: string | null
          id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_slug_availability: {
        Args: { slug_to_check: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<PheraDatabase, "__InternalSupabase">
type PublicSchema = DatabaseWithoutInternals["public"]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? keyof (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? keyof DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
