'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  alpha,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  DirectionsBus,
  FlightLand,
  FlightTakeoff,
  People,
  DragIndicator,
  CheckCircle,
  Settings,
  Send,
  AccessTime,
  LocationOn,
} from '@mui/icons-material';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import {
  TransportationMode,
  TransportationDirection,
  TransportationVehicle,
  TransportationReservation,
} from '@/lib/supabase/types';
import {
  getVehicles,
  getReservations,
  getAllVehiclesWithCapacity,
  moveReservationToVehicle,
  confirmReservations,
} from '@/lib/supabase/transportation-service';

interface TransportationDashboardProps {
  weddingId: string;
  weddingSlug: string;
  mode: TransportationMode;
  onEditSetup: () => void;
}

type VehicleWithCapacity = TransportationVehicle & { booked: number; available: number };

export default function TransportationDashboard({
  weddingId,
  weddingSlug,
  mode,
  onEditSetup,
}: TransportationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'arrival' | 'departure'>('arrival');
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleWithCapacity[]>([]);
  const [reservations, setReservations] = useState<TransportationReservation[]>([]);
  const [activeReservation, setActiveReservation] = useState<TransportationReservation | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, [weddingId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehiclesData, reservationsData] = await Promise.all([
        getAllVehiclesWithCapacity(weddingId, activeTab),
        getReservations(weddingId, activeTab),
      ]);
      setVehicles(vehiclesData);
      setReservations(reservationsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const reservation = reservations.find((r) => r.id === event.active.id);
    setActiveReservation(reservation || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveReservation(null);

    if (!over || active.id === over.id) return;

    const reservationId = active.id as string;
    const targetVehicleId = over.id as string;

    // Check if dropping on a vehicle
    const targetVehicle = vehicles.find((v) => v.id === targetVehicleId);
    if (!targetVehicle) return;

    const reservation = reservations.find((r) => r.id === reservationId);
    if (!reservation) return;

    // Check capacity
    if (targetVehicle.available < (reservation.party_size || 1)) {
      // Not enough space
      return;
    }

    // Move reservation
    const success = await moveReservationToVehicle(reservationId, targetVehicleId);
    if (success) {
      // Reload data to reflect changes
      loadData();
    }
  };

  const handleFinalizeBookings = async () => {
    setConfirming(true);
    try {
      const pendingReservations = reservations.filter(
        (r) => r.status === 'pending' && r.vehicle_id
      );
      const ids = pendingReservations.map((r) => r.id);

      if (ids.length > 0) {
        await confirmReservations(ids);
        // TODO: Send notifications to guests
        loadData();
      }
    } catch (error) {
      console.error('Error confirming reservations:', error);
    } finally {
      setConfirming(false);
      setConfirmDialogOpen(false);
    }
  };

  const formatDateTime = (datetime: string) => {
    try {
      const d = new Date(datetime);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '-';
    }
  };

  const getReservationsForVehicle = (vehicleId: string) => {
    return reservations.filter((r) => r.vehicle_id === vehicleId);
  };

  const getUnassignedReservations = () => {
    return reservations.filter((r) => !r.vehicle_id);
  };

  const totalPendingCount = reservations.filter((r) => r.status === 'pending').length;
  const totalConfirmedCount = reservations.filter((r) => r.status === 'confirmed').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#DE3F5E' }} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Transportation
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Manage guest reservations and finalize bookings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={onEditSetup}
            sx={{
              borderColor: '#6a6a6a',
              color: '#1a1a1a',
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 1,
              '&:hover': { borderColor: '#DE3F5E', color: '#DE3F5E' },
            }}
          >
            Edit Setup
          </Button>
          {totalPendingCount > 0 && (
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={() => setConfirmDialogOpen(true)}
              sx={{
                bgcolor: '#DE3F5E',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1,
                '&:hover': { bgcolor: '#c73552' },
              }}
            >
              Finalize & Notify ({totalPendingCount})
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper
          elevation={0}
          sx={{
            px: 3,
            py: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: '#f3f3f3ff',
          }}
        >
          <Avatar sx={{ bgcolor: alpha('#DE3F5E', 0.1), color: '#DE3F5E' }}>
            <AccessTime />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {totalPendingCount}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              Pending
            </Typography>
          </Box>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            px: 3,
            py: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: '#f3f3f3ff',
          }}
        >
          <Avatar sx={{ bgcolor: alpha('#DE3F5E', 0.1), color: '#DE3F5E' }}>
            <CheckCircle />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {totalConfirmedCount}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              Confirmed
            </Typography>
          </Box>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            px: 3,
            py: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: '#f3f3f3ff',
          }}
        >
          <Avatar sx={{ bgcolor: alpha('#DE3F5E', 0.1), color: '#DE3F5E' }}>
            <DirectionsBus />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {vehicles.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              Vehicles
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'white',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              color: '#6a6a6a',
            },
            '& .Mui-selected': {
              color: '#DE3F5E !important',
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#DE3F5E',
            },
          }}
        >
          <Tab
            value="arrival"
            label="Arrival"
            icon={<FlightLand />}
            iconPosition="start"
          />
          <Tab
            value="departure"
            label="Departure"
            icon={<FlightTakeoff />}
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {vehicles.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <DirectionsBus sx={{ fontSize: 48, color: '#ddd', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#6a6a6a' }}>
                No vehicles set up for {activeTab}
              </Typography>
              <Typography variant="body2" sx={{ color: '#9a9a9a' }}>
                Edit your setup to add vehicles
              </Typography>
            </Box>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                  gap: 3,
                }}
              >
                {/* Unassigned reservations */}
                {getUnassignedReservations().length > 0 && (
                  <VehicleColumn
                    vehicle={null}
                    reservations={getUnassignedReservations()}
                    formatDateTime={formatDateTime}
                  />
                )}

                {/* Vehicle columns */}
                {vehicles.map((vehicle) => (
                  <VehicleColumn
                    key={vehicle.id}
                    vehicle={vehicle}
                    reservations={getReservationsForVehicle(vehicle.id)}
                    formatDateTime={formatDateTime}
                  />
                ))}
              </Box>

              <DragOverlay>
                {activeReservation && (
                  <ReservationCardStatic reservation={activeReservation} />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </Box>
      </Paper>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Finalize Bookings?</DialogTitle>
        <DialogContent>
          <Typography>
            This will confirm {totalPendingCount} reservation(s). Guests will be notified that their
            transportation spot has been reserved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ color: '#6a6a6a' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleFinalizeBookings}
            disabled={confirming}
            sx={{ bgcolor: '#DE3F5E', '&:hover': { bgcolor: '#c73552' } }}
          >
            {confirming ? 'Confirming...' : 'Confirm & Notify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

// Vehicle Column Component
function VehicleColumn({
  vehicle,
  reservations,
  formatDateTime,
}: {
  vehicle: VehicleWithCapacity | null;
  reservations: TransportationReservation[];
  formatDateTime: (datetime: string) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: vehicle?.id || 'unassigned',
  });

  const totalPartySize = reservations.reduce((sum, r) => sum + (r.party_size || 1), 0);
  const capacityPercent = vehicle ? (vehicle.booked / vehicle.capacity) * 100 : 0;

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        p: 2,
        border: '2px solid',
        borderColor: isOver ? '#DE3F5E' : '#DE3F5E',
        borderRadius: 1,
        bgcolor: isOver ? alpha('#DE3F5E', 0.02) : vehicle ? 'white' : alpha('#DE3F5E', 0.04),
        transition: 'all 0.2s',
        minHeight: 200,
        minWidth: 500,
      }}
    >
      {/* Vehicle Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DirectionsBus sx={{ color: '#DE3F5E' }} />
          <Typography sx={{ fontWeight: 600, color: '#1a1a1a', flex: 1 }}>
            {vehicle ? vehicle.vehicle_name || 'Vehicle' : 'Unassigned'}
          </Typography>
          {vehicle && (
            <Chip
              label={`${vehicle.booked}/${vehicle.capacity}`}
              size="small"
              sx={{
                bgcolor: alpha('#DE3F5E', 0.1),
                color: '#1a1a1a',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            />
          )}
        </Box>

        {vehicle && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <AccessTime sx={{ fontSize: 14, color: '#6a6a6a' }} />
              <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                {formatDateTime(vehicle.departure_datetime)}
              </Typography>
            </Box>
            {vehicle.pickup_location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 14, color: '#6a6a6a' }} />
                <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                  {vehicle.pickup_location}
                </Typography>
              </Box>
            )}
            <LinearProgress
              variant="determinate"
              value={capacityPercent}
              sx={{
                mt: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: alpha('#DE3F5E', 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#DE3F5E',
                  borderRadius: 3,
                },
              }}
            />
          </>
        )}
      </Box>

      {/* Reservations */}
      <SortableContext
        items={reservations.map((r) => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack spacing={1}>
          {reservations.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: '#9a9a9a', textAlign: 'center', py: 2 }}
            >
              {vehicle ? 'Drag guests here' : 'No unassigned guests'}
            </Typography>
          ) : (
            reservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))
          )}
        </Stack>
      </SortableContext>
    </Paper>
  );
}

// Format datetime helper for reservation cards
function formatReservationDateTime(datetime: string) {
  try {
    const d = new Date(datetime);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '-';
  }
}

// Draggable Reservation Card
function ReservationCard({ reservation }: { reservation: TransportationReservation }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: reservation.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={0}
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'white',
        cursor: 'grab',
        '&:hover': {
          borderColor: '#DE3F5E',
          // bgcolor: alpha('#DE3F5E', 0.01),
        },
      }}
      {...attributes}
      {...listeners}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DragIndicator sx={{ color: '#ccc', fontSize: 18 }} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#1a1a1a' }}>
              {reservation.guest?.name || 'Guest'}
            </Typography>
            <Chip
              icon={<People sx={{ fontSize: 14 }} />}
              label={reservation.party_size || 1}
              size="small"
              sx={{
                height: 24,
                '& .MuiChip-label': { px: 0.5, fontSize: '0.8rem' },
                bgcolor: alpha('#DE3F5E', 0.1),
                color: '#1a1a1a',
              }}
            />
          </Box>
          {reservation.guest?.email && (
            <Typography variant="caption" sx={{ color: '#9a9a9a', display: 'block' }}>
              {reservation.guest.email}
            </Typography>
          )}
          {/* Guest preferences: pickup location & preferred time */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
            {reservation.pickup_location && (
              <Chip
                icon={<LocationOn sx={{ fontSize: 14 }} />}
                label={reservation.pickup_location.name}
                size="small"
                sx={{
                  height: 26,
                  '& .MuiChip-label': { px: 0.75, fontSize: '0.8rem' },
                  '& .MuiChip-icon': { ml: 0.5 },
                  bgcolor: alpha('#DE3F5E', 0.08),
                  color: '#1a1a1a',
                }}
              />
            )}
            {reservation.preferred_datetime && (
              <Chip
                icon={<AccessTime sx={{ fontSize: 14 }} />}
                label={formatReservationDateTime(reservation.preferred_datetime)}
                size="small"
                sx={{
                  height: 26,
                  '& .MuiChip-label': { px: 0.75, fontSize: '0.8rem' },
                  '& .MuiChip-icon': { ml: 0.5 },
                  bgcolor: alpha('#DE3F5E', 0.08),
                  color: '#1a1a1a',
                }}
              />
            )}
          </Box>
        </Box>
        {/* <Chip
          label={reservation.status}
          size="small"
          sx={{
            height: 24,
            '& .MuiChip-label': { px: 1, fontSize: '0.8rem' },
            bgcolor: alpha('#DE3F5E', 0.1),
            color: '#1a1a1a',
            fontWeight: 500,
          }}
        /> */}
      </Box>
    </Paper>
  );
}

// Static card for drag overlay
function ReservationCardStatic({ reservation }: { reservation: TransportationReservation }) {
  return (
    <Paper
      elevation={8}
      sx={{
        p: 1.5,
        border: '2px solid',
        borderColor: '#DE3F5E',
        borderRadius: 1,
        bgcolor: 'white',
        cursor: 'grabbing',
        width: 380,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DragIndicator sx={{ color: '#DE3F5E', fontSize: 18 }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#1a1a1a' }}>
            {reservation.guest?.name || 'Guest'}
          </Typography>
          {/* Guest preferences */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
            {reservation.pickup_location && (
              <Chip
                icon={<LocationOn sx={{ fontSize: 14 }} />}
                label={reservation.pickup_location.name}
                size="small"
                sx={{
                  height: 26,
                  '& .MuiChip-label': { px: 0.75, fontSize: '0.8rem' },
                  '& .MuiChip-icon': { ml: 0.5 },
                  bgcolor: alpha('#DE3F5E', 0.08),
                  color: '#1a1a1a',
                }}
              />
            )}
            {reservation.preferred_datetime && (
              <Chip
                icon={<AccessTime sx={{ fontSize: 14 }} />}
                label={formatReservationDateTime(reservation.preferred_datetime)}
                size="small"
                sx={{
                  height: 26,
                  '& .MuiChip-label': { px: 0.75, fontSize: '0.8rem' },
                  '& .MuiChip-icon': { ml: 0.5 },
                  bgcolor: alpha('#DE3F5E', 0.08),
                  color: '#1a1a1a',
                }}
              />
            )}
          </Box>
        </Box>
        <Chip
          icon={<People sx={{ fontSize: 14 }} />}
          label={reservation.party_size || 1}
          size="small"
          sx={{
            height: 24,
            bgcolor: alpha('#DE3F5E', 0.1),
            color: '#1a1a1a',
          }}
        />
      </Box>
    </Paper>
  );
}
