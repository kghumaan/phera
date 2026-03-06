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
  TextField,
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
  Add,
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
  createManualReservation,
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

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
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
      {/* <Box sx={{ display: 'flex', gap: 2 }}>
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
      </Box> */}

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
            // px: 2,
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

        <Box sx={{ py: 3 }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                overflowX: 'auto',
                pb: 2,
                px: 0.5,
                // minHeight: 'calc(100vh - 350px)',
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'rgba(0,0,0,0.1)',
                  borderRadius: 4,
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.2)',
                  },
                },
              }}
            >
              {/* Unassigned reservations */}
              {(getUnassignedReservations().length > 0 || vehicles.length === 0) && (
                <VehicleColumn
                  weddingId={weddingId}
                  vehicle={null}
                  reservations={getUnassignedReservations()}
                  formatDateTime={formatDateTime}
                  mode={mode}
                  onRefresh={loadData}
                />
              )}

              {/* Vehicle columns */}
              {vehicles.map((vehicle) => (
                <VehicleColumn
                  key={vehicle.id}
                  weddingId={weddingId}
                  vehicle={vehicle}
                  reservations={getReservationsForVehicle(vehicle.id)}
                  formatDateTime={formatDateTime}
                  mode={mode}
                  onRefresh={loadData}
                />
              ))}

              {/* Add column */}
              <Paper
                elevation={0}
                onClick={onEditSetup}
                sx={{
                  p: 4,
                  border: '2px dashed',
                  borderColor: '#e8e8e8ff',
                  borderRadius: 1,
                  bgcolor: 'transparent',
                  width: 400,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#DE3F5E',
                    bgcolor: alpha('#DE3F5E', 0.02),
                    '& .add-icon-bg': { bgcolor: alpha('#DE3F5E', 0.2) }
                  },
                }}
              >
                <Box
                  className="add-icon-bg"
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: alpha('#DE3F5E', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <Settings sx={{ color: '#DE3F5E', fontSize: 28 }} />
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a', textAlign: 'center' }}>
                  Add transportation option?
                </Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a', textAlign: 'center', maxWidth: 250 }}>
                  Click to add more vehicles, edit capacities, or manage locations.
                </Typography>
              </Paper>
            </Box>

            <DragOverlay>
              {activeReservation && (
                <ReservationCardStatic reservation={activeReservation} />
              )}
            </DragOverlay>
          </DndContext>
        </Box>
      </Paper>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Finalize Bookings?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will confirm {totalPendingCount} reservation(s). Guests will be notified that their
            transportation spot has been reserved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ color: '#6a6a6a', borderRadius: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleFinalizeBookings}
            disabled={confirming}
            sx={{ bgcolor: '#DE3F5E', '&:hover': { bgcolor: '#c73552' }, borderRadius: 1 }}
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
  weddingId,
  vehicle,
  reservations,
  formatDateTime,
  mode,
  onRefresh,
}: {
  weddingId: string;
  vehicle: VehicleWithCapacity | null;
  reservations: TransportationReservation[];
  formatDateTime: (datetime: string) => string;
  mode: TransportationMode;
  onRefresh: (silent?: boolean) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPartySize, setManualPartySize] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: vehicle?.id || 'unassigned',
  });

  const handleAddManual = async () => {
    if (!manualName.trim() || !vehicle) return;
    setIsSubmitting(true);
    try {
      await createManualReservation(weddingId, {
        direction: vehicle.direction,
        vehicle_id: vehicle.id,
        party_size: manualPartySize,
        guest_name: manualName.trim(),
      });
      setIsAdding(false);
      setManualName('');
      setManualPartySize(1);
      onRefresh(true);
    } catch (error) {
      console.error('Failed to add manual reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPartySize = reservations.reduce((sum, r) => sum + (r.party_size || 1), 0);
  const capacityPercent = vehicle ? (vehicle.booked / vehicle.capacity) * 100 : 0;

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        p: 2,
        border: '2px solid',
        // borderColor: isOver ? '#e8e8e8ff' : '#DE3F5E',
        borderColor: '#e8e8e8ff',
        borderRadius: 1,
        bgcolor: isOver ? alpha('#DE3F5E', 0.02) : vehicle ? 'white' : alpha('#DE3F5E', 0.04),
        transition: 'all 0.2s',
        minHeight: 200,
        width: 400,
        flexShrink: 0,
      }}
    >
      {/* Vehicle Header */}
      <Box sx={{ mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={capacityPercent}
          sx={{
            mb: 2,
            height: 6,
            borderRadius: 3,
            bgcolor: alpha('#DE3F5E', 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: '#DE3F5E',
              borderRadius: 3,
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DirectionsBus sx={{ color: '#DE3F5E' }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a', flex: 1 }}>
            {vehicle ? vehicle.vehicle_name || 'Vehicle' : 'Unassigned'}
          </Typography>
          {vehicle && (
            <Chip
              label={`${vehicle.booked}/${vehicle.capacity}`}
              sx={{
                height: 28,
                bgcolor: alpha('#DE3F5E', 0.1),
                color: '#1a1a1a',
                fontWeight: 700,
                fontSize: '0.85rem',
                px: 0.5
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
            {(vehicle.pickup_location || vehicle.pickup_location_coordinates) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                <LocationOn sx={{ fontSize: 16, color: '#DE3F5E' }} />
                <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                  {vehicle.pickup_location || 'Location set (name missing)'}
                </Typography>
              </Box>
            )}

          </>
        )}
      </Box>

      {/* Reservations */}
      <SortableContext
        items={reservations.map((r) => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack spacing={1.5}>
          {reservations.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: '#9a9a9a', textAlign: 'center', py: 2 }}
            >
              {vehicle
                ? mode === 'flexible' ? 'Drag guests here' : 'No reservations yet'
                : 'No unassigned guests'}
            </Typography>
          ) : (
            reservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))
          )}

          {/* Add Manual Guest Inline Form */}
          {vehicle && (
            <Box sx={{ mt: 1 }}>
              {isAdding ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    border: '1px solid #DE3F5E',
                    borderRadius: 1,
                    bgcolor: 'white',
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder="Guest Name"
                    size="small"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    autoFocus
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      '& .MuiInputBase-root': { fontSize: '0.875rem' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a1a1a' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#DE3F5E' }
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      type="number"
                      size="small"
                      label="Count"
                      value={manualPartySize}
                      onChange={(e) => setManualPartySize(Math.max(1, parseInt(e.target.value) || 1))}
                      sx={{
                        width: 80,
                        '& .MuiInputBase-root': { fontSize: '0.875rem' },
                        '& .MuiInputLabel-root': { color: '#000' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#DE3F5E' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a1a1a' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#DE3F5E' }
                      }}
                    />
                    <Box sx={{ flex: 1 }} />
                    <Button
                      size="small"
                      onClick={() => setIsAdding(false)}
                      sx={{ color: '#6a6a6a', fontSize: '0.75rem' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleAddManual}
                      disabled={isSubmitting || !manualName.trim()}
                      sx={{
                        bgcolor: '#DE3F5E',
                        fontSize: '0.75rem',
                        '&:hover': { bgcolor: '#c73552' },
                        borderRadius: 1,
                        minWidth: 50,
                        height: 32
                      }}
                    >
                      {isSubmitting ? <CircularProgress size={16} sx={{ color: 'white' }} /> : 'Add'}
                    </Button>
                  </Box>
                </Paper>
              ) : (
                <Button
                  fullWidth
                  startIcon={<Add />}
                  onClick={() => setIsAdding(true)}
                  sx={{
                    py: 1,
                    border: '1px dashed #e8e8e8',
                    borderRadius: 1,
                    color: '#6a6a6a',
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    '&:hover': {
                      border: '1px dashed #DE3F5E',
                      color: '#DE3F5E',
                      bgcolor: alpha('#DE3F5E', 0.02),
                    },
                  }}
                >
                  Add Guest Manually
                </Button>
              )}
            </Box>
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
        borderRadius: 1,
        bgcolor: '#f0f0f0ff',
        cursor: 'grab',
        '&:hover': {
          border: '1px solid #6a6a6aff',
        },
      }}
      {...attributes}
      {...listeners}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DragIndicator sx={{ color: '#000', fontSize: 18 }} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#1a1a1a' }}>
              {reservation.guest?.name || reservation.notes || 'Guest'}
            </Typography>
            <Chip
              icon={<People sx={{ fontSize: 20 }} />}
              label={reservation.party_size || 1}
              sx={{
                height: 28,
                '& .MuiChip-label': { px: 0.8, fontSize: '0.875rem' },
                '& .MuiChip-icon': { color: '#1a1a1a', mr: 0.5 },
                fontWeight: 700,
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
                icon={<LocationOn sx={{ fontSize: 16 }} />}
                label={reservation.pickup_location.name}
                sx={{
                  height: 30,
                  '& .MuiChip-label': { px: 1, fontSize: '0.85rem' },
                  '& .MuiChip-icon': { ml: 0.5 },
                  bgcolor: alpha('#4CAF50', 0.1),
                  color: '#2E7D32',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: alpha('#4CAF50', 0.2),
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
          {reservation.notes && !(!reservation.guest_id) && (
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                display: 'block',
                color: '#6a6a6a',
                fontStyle: 'italic',
                bgcolor: alpha('#000', 0.03),
                p: 0.75,
                borderRadius: 0.5,
                borderLeft: '2px solid #DE3F5E'
              }}
            >
              "{reservation.notes}"
            </Typography>
          )}
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
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#1a1a1a' }}>
            {reservation.guest?.name || 'Guest'}
          </Typography>
          {/* Guest preferences */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
            {reservation.pickup_location && (
              <Chip
                icon={<LocationOn sx={{ fontSize: 16 }} />}
                label={reservation.pickup_location.name}
                sx={{
                  height: 30,
                  '& .MuiChip-label': { px: 1, fontSize: '0.85rem' },
                  '& .MuiChip-icon': { ml: 0.5 },
                  bgcolor: alpha('#DE3F5E', 0.08),
                  color: '#1a1a1a',
                  fontWeight: 600,
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
          icon={<People sx={{ fontSize: 20 }} />}
          label={reservation.party_size || 1}
          sx={{
            height: 28,
            bgcolor: alpha('#DE3F5E', 0.1),
            color: '#1a1a1a',
            fontWeight: 700,
            fontSize: '0.875rem',
            '& .MuiChip-icon': { color: '#1a1a1a' },
          }}
        />
      </Box>
    </Paper>
  );
}
