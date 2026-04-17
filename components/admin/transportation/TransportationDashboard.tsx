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
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { PrimaryActionButton, SecondaryActionButton, ActionButton } from '@/components/admin/ActionButton';
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
        <CircularProgress sx={{ color: COLORS.brand.primary }} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
            Transportation
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            Manage guest reservations and finalize bookings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <SecondaryActionButton
            startIcon={<Settings />}
            onClick={onEditSetup}
            sx={{
              borderColor: COLORS.text.subtle,
              fontWeight: 500,
              borderRadius: 1,
              '&:hover': { borderColor: COLORS.brand.primary, color: COLORS.brand.primary },
            }}
          >
            Edit Setup
          </SecondaryActionButton>
          {totalPendingCount > 0 && (
            <PrimaryActionButton
              startIcon={<Send />}
              onClick={() => setConfirmDialogOpen(true)}
              sx={{
                borderRadius: 1,
              }}
            >
              Finalize & Notify ({totalPendingCount})
            </PrimaryActionButton>
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
          <Avatar sx={{ bgcolor: alpha(COLORS.brand.primary, 0.1), color: COLORS.brand.primary }}>
            <AccessTime />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
              {totalPendingCount}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
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
          <Avatar sx={{ bgcolor: alpha(COLORS.brand.primary, 0.1), color: COLORS.brand.primary }}>
            <CheckCircle />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
              {totalConfirmedCount}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
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
          <Avatar sx={{ bgcolor: alpha(COLORS.brand.primary, 0.1), color: COLORS.brand.primary }}>
            <DirectionsBus />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
              {vehicles.length}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
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
          bgcolor: COLORS.bg.white,
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
              color: COLORS.text.subtle,
            },
            '& .Mui-selected': {
              color: '#DE3F5E !important',
            },
            '& .MuiTabs-indicator': {
              bgcolor: COLORS.brand.primary,
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
                    borderColor: COLORS.brand.primary,
                    bgcolor: alpha(COLORS.brand.primary, 0.02),
                    '& .add-icon-bg': { bgcolor: alpha(COLORS.brand.primary, 0.2) }
                  },
                }}
              >
                <Box
                  className="add-icon-bg"
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: alpha(COLORS.brand.primary, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <Settings sx={{ color: COLORS.brand.primary, fontSize: 28 }} />
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.text.strong, textAlign: 'center' }}>
                  Add transportation option?
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.subtle, textAlign: 'center', maxWidth: 250 }}>
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
      <PheraDialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <PheraDialogTitle onClose={() => setConfirmDialogOpen(false)}>
          Finalize Bookings?
        </PheraDialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will confirm {totalPendingCount} reservation(s). Guests will be notified that their
            transportation spot has been reserved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ color: COLORS.text.subtle, borderRadius: 1 }}>
            Cancel
          </Button>
          <PrimaryActionButton
            onClick={handleFinalizeBookings}
            loading={confirming}
            sx={{ borderRadius: 1 }}
          >
            Confirm & Notify
          </PrimaryActionButton>
        </DialogActions>
      </PheraDialog>
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
        // borderColor: isOver ? '#e8e8e8ff' : COLORS.brand.primary,
        borderColor: '#e8e8e8ff',
        borderRadius: 1,
        bgcolor: isOver ? alpha(COLORS.brand.primary, 0.02) : vehicle ? COLORS.bg.white : alpha(COLORS.brand.primary, 0.04),
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
            bgcolor: alpha(COLORS.brand.primary, 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: COLORS.brand.primary,
              borderRadius: 3,
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DirectionsBus sx={{ color: COLORS.brand.primary }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.text.strong, flex: 1 }}>
            {vehicle ? vehicle.vehicle_name || 'Vehicle' : 'Unassigned'}
          </Typography>
          {vehicle && (
            <Chip
              label={`${vehicle.booked}/${vehicle.capacity}`}
              sx={{
                height: 28,
                bgcolor: alpha(COLORS.brand.primary, 0.1),
                color: COLORS.text.strong,
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
              <AccessTime sx={{ fontSize: 14, color: COLORS.text.subtle }} />
              <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                {formatDateTime(vehicle.departure_datetime)}
              </Typography>
            </Box>
            {(vehicle.pickup_location || vehicle.pickup_location_coordinates) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                <LocationOn sx={{ fontSize: 16, color: COLORS.brand.primary }} />
                <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 500 }}>
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
              sx={{ color: COLORS.text.faint, textAlign: 'center', py: 2 }}
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
                    bgcolor: COLORS.bg.white,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Guest Name"
                    size="small"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    autoFocus
                    sx={{ ...ENHANCED_TEXT_FIELD_SX, mb: 1, mt: 0 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      type="number"
                      size="small"
                      label="Count"
                      value={manualPartySize}
                      onChange={(e) => setManualPartySize(Math.max(1, parseInt(e.target.value) || 1))}
                      sx={{ ...ENHANCED_TEXT_FIELD_SX, width: 80, mt: 0 }}
                    />
                    <Box sx={{ flex: 1 }} />
                    <Button
                      size="small"
                      onClick={() => setIsAdding(false)}
                      sx={{ color: COLORS.text.subtle, fontSize: '0.75rem' }}
                    >
                      Cancel
                    </Button>
                    <PrimaryActionButton
                      size="small"
                      onClick={handleAddManual}
                      disabled={!manualName.trim()}
                      loading={isSubmitting}
                      sx={{
                        fontSize: '0.75rem',
                        borderRadius: 1,
                        minWidth: 50,
                        height: 32,
                      }}
                    >
                      Add
                    </PrimaryActionButton>
                  </Box>
                </Paper>
              ) : (
                <ActionButton
                  fullWidth
                  startIcon={<Add />}
                  onClick={() => setIsAdding(true)}
                  sx={{
                    py: 1,
                    border: '1px dashed #e8e8e8',
                    borderRadius: 1,
                    color: COLORS.text.subtle,
                    fontSize: '0.8rem',
                    '&:hover': {
                      border: '1px dashed #DE3F5E',
                      color: COLORS.brand.primary,
                      bgcolor: alpha(COLORS.brand.primary, 0.02),
                    },
                  }}
                >
                  Add Guest Manually
                </ActionButton>
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
        <DragIndicator sx={{ color: COLORS.text.strong, fontSize: 18 }} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: COLORS.text.strong }}>
              {reservation.guest?.name || reservation.notes || 'Guest'}
            </Typography>
            <Chip
              icon={<People sx={{ fontSize: 20 }} />}
              label={reservation.party_size || 1}
              sx={{
                height: 28,
                '& .MuiChip-label': { px: 0.8, fontSize: '0.875rem' },
                '& .MuiChip-icon': { color: COLORS.text.strong, mr: 0.5 },
                fontWeight: 700,
                color: COLORS.text.strong,
              }}
            />
          </Box>
          {reservation.guest?.email && (
            <Typography variant="caption" sx={{ color: COLORS.text.faint, display: 'block' }}>
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
                  bgcolor: alpha(COLORS.accent.success, 0.1),
                  color: '#2E7D32',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: alpha(COLORS.accent.success, 0.2),
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
                  bgcolor: alpha(COLORS.brand.primary, 0.08),
                  color: COLORS.text.strong,
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
                color: COLORS.text.subtle,
                fontStyle: 'italic',
                bgcolor: alpha(COLORS.text.strong, 0.03),
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
            bgcolor: alpha(COLORS.brand.primary, 0.1),
            color: COLORS.text.strong,
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
        borderColor: COLORS.brand.primary,
        borderRadius: 1,
        bgcolor: COLORS.bg.white,
        cursor: 'grabbing',
        width: 380,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DragIndicator sx={{ color: COLORS.brand.primary, fontSize: 18 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: COLORS.text.strong }}>
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
                  bgcolor: alpha(COLORS.brand.primary, 0.08),
                  color: COLORS.text.strong,
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
                  bgcolor: alpha(COLORS.brand.primary, 0.08),
                  color: COLORS.text.strong,
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
            bgcolor: alpha(COLORS.brand.primary, 0.1),
            color: COLORS.text.strong,
            fontWeight: 700,
            fontSize: '0.875rem',
            '& .MuiChip-icon': { color: COLORS.text.strong },
          }}
        />
      </Box>
    </Paper>
  );
}
