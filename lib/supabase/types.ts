import type { Database as GeneratedDatabase } from './database.types';

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
  custom_answers?: Record<string, unknown>;
  // DPDPA consent — captured on the first RSVP step. true = guest
  // acknowledges their info is used for wedding coordination and can
  // be withdrawn anytime. Written to guests.consent_given_at on submit.
  consentGiven?: boolean;
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
  pickup_location_coordinates: Json | null;
  dropoff_location: string | null;
  dropoff_location_coordinates: Json | null;
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
  coordinates: Json | null;
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
  } | null;
  vehicle?: TransportationVehicle | null;
  pickup_location?: TransportationPickupLocation | null;
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
  vehicle_type?: TransportationVehicleType | null;
  pickup_location?: TransportationPickupLocation | null;
  reservations?: TransportationReservation[];
}


/**
 * Database schema — re-exported from the Supabase-generated
 * database.types.ts so this file only carries our custom domain
 * interfaces. Run `supabase gen types typescript --project-id <ref>`
 * to refresh after schema changes.
 */
export type PheraDatabase = GeneratedDatabase;

export type Database = PheraDatabase;

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

export type GuestFlight = Tables<'guest_flights'> & {
  guest?: { id: string; name: string; email: string; phone: string | null } | null;
};
export type GuestChecklistItem = Tables<'guest_checklist_items'>;

export interface FlightFormData {
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  shuttlePreferenceTime: string;
  shuttlePreferenceNote: string;
}
