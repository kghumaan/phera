import { supabase } from './client';
import {
  TransportationSettings,
  TransportationVehicle,
  TransportationPickupLocation,
  TransportationTimeRange,
  TransportationVehicleType,
  TransportationReservation,
  TransportationGroup,
  TransportationMode,
  TransportationDirection,
  Coordinates,
  Json,
} from './types';

// ============================================
// SETTINGS
// ============================================

export async function getTransportationSettings(weddingId: string): Promise<TransportationSettings | null> {
  const { data, error } = await supabase
    .from('transportation_settings')
    .select('*')
    .eq('wedding_id', weddingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching transportation settings:', error);
    return null;
  }
  return data as any;
}

export async function createTransportationSettings(
  weddingId: string,
  mode?: TransportationMode
): Promise<TransportationSettings | null> {
  const { data, error } = await supabase
    .from('transportation_settings')
    .insert({
      wedding_id: weddingId,
      mode: mode || null,
      setup_complete: false,
      arrival_configured: false,
      departure_configured: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating transportation settings:', error);
    return null;
  }
  return data as any;
}

export async function updateTransportationSettings(
  weddingId: string,
  updates: Partial<Omit<TransportationSettings, 'id' | 'wedding_id' | 'created_at'>>
): Promise<TransportationSettings | null> {
  const { data, error } = await supabase
    .from('transportation_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('wedding_id', weddingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating transportation settings:', error);
    return null;
  }
  return data as any;
}

// ============================================
// VEHICLES (Prescheduled Mode)
// ============================================

export async function getVehicles(
  weddingId: string,
  direction?: TransportationDirection
): Promise<TransportationVehicle[]> {
  let query = supabase
    .from('transportation_vehicles')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('order_index', { ascending: true });

  if (direction) {
    query = query.eq('direction', direction);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
  return (data || []) as any;
}

export async function createVehicle(
  weddingId: string,
  vehicle: {
    direction: TransportationDirection;
    vehicle_name?: string;
    capacity: number;
    departure_datetime: string;
    pickup_location?: string;
    pickup_location_coordinates?: Json;
    dropoff_location?: string;
    dropoff_location_coordinates?: Json;
    order_index?: number;
  }
): Promise<TransportationVehicle | null> {
  const { data, error } = await supabase
    .from('transportation_vehicles')
    .insert({
      wedding_id: weddingId,
      ...vehicle,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating vehicle:', error);
    return null;
  }
  return data as any;
}

export async function updateVehicle(
  vehicleId: string,
  updates: Partial<Omit<TransportationVehicle, 'id' | 'wedding_id' | 'created_at'>>
): Promise<TransportationVehicle | null> {
  const { data, error } = await supabase
    .from('transportation_vehicles')
    .update(updates)
    .eq('id', vehicleId)
    .select()
    .single();

  if (error) {
    console.error('Error updating vehicle:', error);
    return null;
  }
  return data as any;
}

export async function deleteVehicle(vehicleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('transportation_vehicles')
    .delete()
    .eq('id', vehicleId);

  if (error) {
    console.error('Error deleting vehicle:', error);
    return false;
  }
  return true;
}

export async function reorderVehicles(
  vehicleIds: string[]
): Promise<boolean> {

  const updates = vehicleIds.map((id, index) => ({
    id,
    order_index: index,
  }));

  try {
    const results = await Promise.all(
      updates.map(update =>
        supabase
          .from('transportation_vehicles')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      )
    );

    const hasError = results.some(r => r.error);
    if (hasError) {
      console.error('Error reordering vehicles');
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error reordering vehicles:', err);
    return false;
  }
}

// ============================================
// PICKUP LOCATIONS (Flexible Mode)
// ============================================

export async function getPickupLocations(
  weddingId: string,
  direction?: TransportationDirection
): Promise<TransportationPickupLocation[]> {
  let query = supabase
    .from('transportation_pickup_locations')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('order_index', { ascending: true });

  if (direction) {
    query = query.eq('direction', direction);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching pickup locations:', error);
    return [];
  }
  return (data || []) as any;
}

export async function createPickupLocation(
  weddingId: string,
  location: {
    direction: TransportationDirection;
    name: string;
    address?: string;
    coordinates?: Json;
    order_index?: number;
  }
): Promise<TransportationPickupLocation | null> {
  const { data, error } = await supabase
    .from('transportation_pickup_locations')
    .insert({
      wedding_id: weddingId,
      ...location,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating pickup location:', error);
    return null;
  }
  return data as any;
}

export async function deletePickupLocation(locationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('transportation_pickup_locations')
    .delete()
    .eq('id', locationId);

  if (error) {
    console.error('Error deleting pickup location:', error);
    return false;
  }
  return true;
}

export async function updatePickupLocation(
  locationId: string,
  updates: Partial<Omit<TransportationPickupLocation, 'id' | 'wedding_id' | 'created_at'>>
): Promise<TransportationPickupLocation | null> {
  const { data, error } = await supabase
    .from('transportation_pickup_locations')
    .update(updates)
    .eq('id', locationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating pickup location:', error);
    return null;
  }
  return data as any;
}

// ============================================
// TIME RANGES (Flexible Mode)
// ============================================

export async function getTimeRanges(
  weddingId: string,
  direction?: TransportationDirection
): Promise<TransportationTimeRange[]> {
  let query = supabase
    .from('transportation_time_ranges')
    .select('*')
    .eq('wedding_id', weddingId);

  if (direction) {
    query = query.eq('direction', direction);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching time ranges:', error);
    return [];
  }
  return (data || []) as any;
}

export async function upsertTimeRange(
  weddingId: string,
  timeRange: {
    direction: TransportationDirection;
    start_datetime: string;
    end_datetime: string;
    interval_minutes?: number;
  }
): Promise<TransportationTimeRange | null> {

  // Check if one exists for this direction
  const { data: existing } = await supabase
    .from('transportation_time_ranges')
    .select('id')
    .eq('wedding_id', weddingId)
    .eq('direction', timeRange.direction)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('transportation_time_ranges')
      .update({
        start_datetime: timeRange.start_datetime,
        end_datetime: timeRange.end_datetime,
        interval_minutes: timeRange.interval_minutes || 60,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating time range:', error);
      return null;
    }
    return data as any;
  }

  const { data, error } = await supabase
    .from('transportation_time_ranges')
    .insert({
      wedding_id: weddingId,
      ...timeRange,
      interval_minutes: timeRange.interval_minutes || 60,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating time range:', error);
    return null;
  }
  return data as any;
}

// ============================================
// VEHICLE TYPES (Flexible Mode)
// ============================================

export async function getVehicleTypes(weddingId: string): Promise<TransportationVehicleType[]> {
  const { data, error } = await supabase
    .from('transportation_vehicle_types')
    .select('*')
    .eq('wedding_id', weddingId);

  if (error) {
    console.error('Error fetching vehicle types:', error);
    return [];
  }
  return (data || []) as any;
}

export async function createVehicleType(
  weddingId: string,
  vehicleType: {
    name: string;
    capacity: number;
    quantity?: number;
  }
): Promise<TransportationVehicleType | null> {
  const { data, error } = await supabase
    .from('transportation_vehicle_types')
    .insert({
      wedding_id: weddingId,
      ...vehicleType,
      quantity: vehicleType.quantity || 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating vehicle type:', error);
    return null;
  }
  return data as any;
}

export async function deleteVehicleType(vehicleTypeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('transportation_vehicle_types')
    .delete()
    .eq('id', vehicleTypeId);

  if (error) {
    console.error('Error deleting vehicle type:', error);
    return false;
  }
  return true;
}

// ============================================
// RESERVATIONS
// ============================================

export async function getReservations(
  weddingId: string,
  direction?: TransportationDirection
): Promise<TransportationReservation[]> {
  let query = supabase
    .from('transportation_reservations')
    .select(`
      *,
      guest:guests(id, name, email),
      vehicle:transportation_vehicles(*),
      pickup_location:transportation_pickup_locations(*)
    `)
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true });

  if (direction) {
    query = query.eq('direction', direction);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
  return (data || []) as any;
}

export async function getReservationsByVehicle(
  vehicleId: string
): Promise<TransportationReservation[]> {
  const { data, error } = await supabase
    .from('transportation_reservations')
    .select(`
      *,
      guest:guests(id, name, email)
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching reservations by vehicle:', error);
    return [];
  }
  return (data || []) as any;
}

export async function createReservation(
  weddingId: string,
  guestId: string,
  reservation: {
    direction: TransportationDirection;
    vehicle_id?: string;
    pickup_location_id?: string;
    preferred_datetime?: string;
    party_size: number;
    notes?: string;
  }
): Promise<TransportationReservation | null> {

  // Check if reservation already exists for this guest and direction
  const { data: existing } = await supabase
    .from('transportation_reservations')
    .select('id')
    .eq('wedding_id', weddingId)
    .eq('guest_id', guestId)
    .eq('direction', reservation.direction)
    .single();

  if (existing) {
    // Update existing reservation
    const { data, error } = await supabase
      .from('transportation_reservations')
      .update({
        ...reservation,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reservation:', error);
      return null;
    }
    return data as any;
  }

  const { data, error } = await supabase
    .from('transportation_reservations')
    .insert({
      wedding_id: weddingId,
      guest_id: guestId,
      ...reservation,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating reservation:', error);
    return null;
  }
  return data as any;
}

export async function createManualReservation(
  weddingId: string,
  reservation: {
    direction: TransportationDirection;
    vehicle_id?: string;
    pickup_location_id?: string;
    preferred_datetime?: string;
    party_size: number;
    guest_name: string;
  }
): Promise<TransportationReservation | null> {
  const { data, error } = await supabase
    .from('transportation_reservations')
    .insert({
      wedding_id: weddingId,
      guest_id: null,
      direction: reservation.direction,
      vehicle_id: reservation.vehicle_id || null,
      pickup_location_id: reservation.pickup_location_id || null,
      preferred_datetime: reservation.preferred_datetime || null,
      party_size: reservation.party_size,
      notes: reservation.guest_name, // Store name in notes for manual entries
      status: 'confirmed', // Manual entries are pre-confirmed
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating manual reservation:', error);
    return null;
  }
  return data as any;
}

export async function updateReservation(
  reservationId: string,
  updates: Partial<Omit<TransportationReservation, 'id' | 'wedding_id' | 'guest_id' | 'created_at'>>
): Promise<TransportationReservation | null> {
  const { data, error } = await supabase
    .from('transportation_reservations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', reservationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating reservation:', error);
    return null;
  }
  return data as any;
}

export async function moveReservationToVehicle(
  reservationId: string,
  newVehicleId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('transportation_reservations')
    .update({
      vehicle_id: newVehicleId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId);

  if (error) {
    console.error('Error moving reservation:', error);
    return false;
  }
  return true;
}

export async function confirmReservations(
  reservationIds: string[]
): Promise<boolean> {
  const { error } = await supabase
    .from('transportation_reservations')
    .update({
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .in('id', reservationIds);

  if (error) {
    console.error('Error confirming reservations:', error);
    return false;
  }
  return true;
}

// ============================================
// CAPACITY HELPERS
// ============================================

export async function getVehicleCapacityStatus(
  vehicleId: string
): Promise<{ capacity: number; booked: number; available: number; isFull: boolean }> {

  // Get vehicle capacity
  const { data: vehicle } = await supabase
    .from('transportation_vehicles')
    .select('capacity')
    .eq('id', vehicleId)
    .single();

  if (!vehicle) {
    return { capacity: 0, booked: 0, available: 0, isFull: true };
  }

  // Get total booked party size
  const { data: reservations } = await supabase
    .from('transportation_reservations')
    .select('party_size')
    .eq('vehicle_id', vehicleId)
    .neq('status', 'cancelled');

  const booked = reservations?.reduce((sum, r) => sum + (r.party_size || 1), 0) || 0;
  const available = Math.max(0, vehicle.capacity - booked);

  return {
    capacity: vehicle.capacity,
    booked,
    available,
    isFull: available === 0,
  };
}

export async function getAllVehiclesWithCapacity(
  weddingId: string,
  direction: TransportationDirection
): Promise<(TransportationVehicle & { booked: number; available: number })[]> {
  // Single query: fetch vehicles with their non-cancelled reservations
  const { data, error } = await supabase
    .from('transportation_vehicles')
    .select(`
      *,
      transportation_reservations(party_size, status)
    `)
    .eq('wedding_id', weddingId)
    .eq('direction', direction)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching vehicles with capacity:', error);
    return [];
  }

  return (data || []).map((vehicle: any) => {
    const reservations = vehicle.transportation_reservations || [];
    const booked = reservations
      .filter((r: any) => r.status !== 'cancelled')
      .reduce((sum: number, r: any) => sum + (r.party_size || 1), 0);
    const available = Math.max(0, vehicle.capacity - booked);

    // Remove the nested reservations from the vehicle object
    const { transportation_reservations, ...vehicleData } = vehicle;
    return {
      ...vehicleData,
      booked,
      available,
    };
  });
}

// ============================================
// GROUPS (Flexible Mode)
// ============================================

export async function getGroups(
  weddingId: string,
  direction?: TransportationDirection
): Promise<TransportationGroup[]> {
  let query = supabase
    .from('transportation_groups')
    .select(`
      *,
      vehicle_type:transportation_vehicle_types(*),
      pickup_location:transportation_pickup_locations(*)
    `)
    .eq('wedding_id', weddingId);

  if (direction) {
    query = query.eq('direction', direction);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
  return (data || []) as any;
}

export async function createGroup(
  weddingId: string,
  group: {
    direction: TransportationDirection;
    vehicle_type_id?: string;
    pickup_location_id?: string;
    departure_datetime?: string;
    total_passengers?: number;
  }
): Promise<TransportationGroup | null> {
  const { data, error } = await supabase
    .from('transportation_groups')
    .insert({
      wedding_id: weddingId,
      ...group,
      is_finalized: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating group:', error);
    return null;
  }
  return data as any;
}

export async function finalizeGroups(
  groupIds: string[]
): Promise<boolean> {
  const { error } = await supabase
    .from('transportation_groups')
    .update({ is_finalized: true })
    .in('id', groupIds);

  if (error) {
    console.error('Error finalizing groups:', error);
    return false;
  }
  return true;
}

// ============================================
// TIME SLOT HELPERS
// ============================================

export function generateTimeSlots(
  startDatetime: string,
  endDatetime: string,
  intervalMinutes: number = 60
): Date[] {
  const slots: Date[] = [];
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);

  let current = new Date(start);
  while (current <= end) {
    slots.push(new Date(current));
    current = new Date(current.getTime() + intervalMinutes * 60 * 1000);
  }

  return slots;
}

export async function getAvailableTimeSlots(
  weddingId: string,
  direction: TransportationDirection
): Promise<{ datetime: Date; available: boolean }[]> {
  const timeRanges = await getTimeRanges(weddingId, direction);

  if (timeRanges.length === 0) {
    return [];
  }

  const range = timeRanges[0];
  const slots = generateTimeSlots(
    range.start_datetime,
    range.end_datetime,
    range.interval_minutes || 60
  );

  // For now, all slots are available in flexible mode
  // Capacity checking happens at the grouping stage
  return slots.map(datetime => ({
    datetime,
    available: true,
  }));
}

// ============================================
// GUEST RESERVATION HELPERS
// ============================================

export async function getGuestReservations(
  weddingId: string,
  guestId: string
): Promise<{ arrival: TransportationReservation | null; departure: TransportationReservation | null }> {
  const { data, error } = await supabase
    .from('transportation_reservations')
    .select(`
      *,
      vehicle:transportation_vehicles(*),
      pickup_location:transportation_pickup_locations(*)
    `)
    .eq('wedding_id', weddingId)
    .eq('guest_id', guestId);

  if (error) {
    console.error('Error fetching guest reservations:', error);
    return { arrival: null, departure: null };
  }

  return {
    arrival: (data?.find(r => r.direction === 'arrival') || null) as any,
    departure: (data?.find(r => r.direction === 'departure') || null) as any,
  };
}

// ============================================
// RSVP INTEGRATION
// ============================================

export async function getGuestPartySize(
  weddingId: string,
  guestId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('rsvps')
    .select('guest_count, plus_one')
    .eq('wedding_id', weddingId)
    .eq('guest_id', guestId)
    .single();

  if (error || !data) {
    return 1;
  }

  // guest_count includes the guest themselves
  return data.guest_count || (data.plus_one ? 2 : 1);
}
