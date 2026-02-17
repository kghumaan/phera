'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  alpha,
} from '@mui/material';
import {
  DirectionsBus,
  AccessTime,
  LocationOn,
  CheckCircleOutline,
  FlightLand,
  FlightTakeoff,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTransportationSettings,
  getVehicles,
  getPickupLocations,
  getTimeRanges,
  getAllVehiclesWithCapacity,
  createReservation,
  getGuestReservations,
  getGuestPartySize,
  generateTimeSlots,
} from '@/lib/supabase/transportation-service';
import {
  TransportationSettings,
  TransportationVehicle,
  TransportationPickupLocation,
  TransportationTimeRange,
  TransportationDirection,
} from '@/lib/supabase/types';

interface ReserveTransportationProps {
  weddingId: string;
  guestId: string;
  onClose?: () => void;
  embedded?: boolean;
}

interface VehicleWithCapacity extends TransportationVehicle {
  booked: number;
  available: number;
}

export default function ReserveTransportation({
  weddingId,
  guestId,
  onClose,
  embedded = false,
}: ReserveTransportationProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings and data
  const [settings, setSettings] = useState<TransportationSettings | null>(null);
  const [partySize, setPartySize] = useState(1);

  // Arrival data
  const [arrivalVehicles, setArrivalVehicles] = useState<VehicleWithCapacity[]>([]);
  const [arrivalLocations, setArrivalLocations] = useState<TransportationPickupLocation[]>([]);
  const [arrivalTimeRange, setArrivalTimeRange] = useState<TransportationTimeRange | null>(null);

  // Departure data
  const [departureVehicles, setDepartureVehicles] = useState<VehicleWithCapacity[]>([]);
  const [departureLocations, setDepartureLocations] = useState<TransportationPickupLocation[]>([]);
  const [departureTimeRange, setDepartureTimeRange] = useState<TransportationTimeRange | null>(null);

  // Form state
  const [arrivalSelection, setArrivalSelection] = useState<string>('');
  const [arrivalLocationId, setArrivalLocationId] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [arrivalNotes, setArrivalNotes] = useState('');

  const [departureSelection, setDepartureSelection] = useState<string>('');
  const [departureLocationId, setDepartureLocationId] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [departureNotes, setDepartureNotes] = useState('');

  // Existing reservations
  const [hasExistingArrival, setHasExistingArrival] = useState(false);
  const [hasExistingDeparture, setHasExistingDeparture] = useState(false);

  const primaryColor = '#DE3F5E';

  useEffect(() => {
    loadData();
  }, [weddingId, guestId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load settings
      const settingsData = await getTransportationSettings(weddingId);
      if (!settingsData || !settingsData.setup_complete) {
        setError('Transportation has not been set up for this wedding yet.');
        setLoading(false);
        return;
      }
      setSettings(settingsData);

      // Load party size
      const size = await getGuestPartySize(weddingId, guestId);
      setPartySize(size);

      // Load existing reservations
      const existingReservations = await getGuestReservations(weddingId, guestId);
      setHasExistingArrival(!!existingReservations.arrival);
      setHasExistingDeparture(!!existingReservations.departure);

      // Pre-fill existing selections
      if (existingReservations.arrival) {
        if (existingReservations.arrival.vehicle_id) {
          setArrivalSelection(existingReservations.arrival.vehicle_id);
        }
        if (existingReservations.arrival.pickup_location_id) {
          setArrivalLocationId(existingReservations.arrival.pickup_location_id);
        }
        if (existingReservations.arrival.preferred_datetime) {
          setArrivalTime(existingReservations.arrival.preferred_datetime);
        }
        if (existingReservations.arrival.notes) {
          setArrivalNotes(existingReservations.arrival.notes);
        }
      }
      if (existingReservations.departure) {
        if (existingReservations.departure.vehicle_id) {
          setDepartureSelection(existingReservations.departure.vehicle_id);
        }
        if (existingReservations.departure.pickup_location_id) {
          setDepartureLocationId(existingReservations.departure.pickup_location_id);
        }
        if (existingReservations.departure.preferred_datetime) {
          setDepartureTime(existingReservations.departure.preferred_datetime);
        }
        if (existingReservations.departure.notes) {
          setDepartureNotes(existingReservations.departure.notes);
        }
      }

      // Load arrival data
      if (settingsData.arrival_configured) {
        if (settingsData.mode === 'prescheduled') {
          const vehicles = await getAllVehiclesWithCapacity(weddingId, 'arrival');
          setArrivalVehicles(vehicles);
        } else {
          const locations = await getPickupLocations(weddingId, 'arrival');
          setArrivalLocations(locations);
          const timeRanges = await getTimeRanges(weddingId, 'arrival');
          if (timeRanges.length > 0) {
            setArrivalTimeRange(timeRanges[0]);
          }
        }
      }

      // Load departure data
      if (settingsData.departure_configured) {
        if (settingsData.mode === 'prescheduled') {
          const vehicles = await getAllVehiclesWithCapacity(weddingId, 'departure');
          setDepartureVehicles(vehicles);
        } else {
          const locations = await getPickupLocations(weddingId, 'departure');
          setDepartureLocations(locations);
          const timeRanges = await getTimeRanges(weddingId, 'departure');
          if (timeRanges.length > 0) {
            setDepartureTimeRange(timeRanges[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error loading transportation data:', err);
      setError('Failed to load transportation options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Submit arrival reservation if configured and selected
      if (settings?.arrival_configured) {
        if (settings.mode === 'prescheduled' && arrivalSelection) {
          await createReservation(weddingId, guestId, {
            direction: 'arrival',
            vehicle_id: arrivalSelection,
            party_size: partySize,
            notes: arrivalNotes || undefined,
          });
        } else if (settings.mode === 'flexible' && arrivalLocationId && arrivalTime) {
          await createReservation(weddingId, guestId, {
            direction: 'arrival',
            pickup_location_id: arrivalLocationId,
            preferred_datetime: arrivalTime,
            party_size: partySize,
            notes: arrivalNotes || undefined,
          });
        }
      }

      // Submit departure reservation if configured and selected
      if (settings?.departure_configured) {
        if (settings.mode === 'prescheduled' && departureSelection) {
          await createReservation(weddingId, guestId, {
            direction: 'departure',
            vehicle_id: departureSelection,
            party_size: partySize,
            notes: departureNotes || undefined,
          });
        } else if (settings.mode === 'flexible' && departureLocationId && departureTime) {
          await createReservation(weddingId, guestId, {
            direction: 'departure',
            pickup_location_id: departureLocationId,
            preferred_datetime: departureTime,
            party_size: partySize,
            notes: departureNotes || undefined,
          });
        }
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error submitting reservation:', err);
      setError('Failed to submit reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimeSlots = (timeRange: TransportationTimeRange) => {
    return generateTimeSlots(
      timeRange.start_datetime,
      timeRange.end_datetime,
      timeRange.interval_minutes || 60
    );
  };

  // Success view
  if (success) {
    return (
      <Box
        sx={{
          p: embedded ? 3 : 4,
          textAlign: 'center',
          minHeight: embedded ? 'auto' : '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <CheckCircleOutline sx={{ fontSize: 80, color: primaryColor, mb: 2 }} />
        </motion.div>
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'var(--font-instrument-serif)',
            fontStyle: 'italic',
            color: '#1a1a1a',
            mb: 2,
          }}
        >
          Reservation Submitted!
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#666',
            maxWidth: 400,
            mb: 3,
            lineHeight: 1.7,
          }}
        >
          Your transportation request has been submitted. The couple will review all reservations and confirm your spot soon.
        </Typography>
        <Alert
          severity="info"
          icon={<Info />}
          sx={{
            maxWidth: 400,
            borderRadius: 2,
            bgcolor: alpha(primaryColor, 0.05),
            border: `1px solid ${alpha(primaryColor, 0.2)}`,
            '& .MuiAlert-icon': { color: primaryColor },
          }}
        >
          This reservation is not final until confirmed by the couple.
        </Alert>
        {onClose && (
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              mt: 4,
              bgcolor: primaryColor,
              borderRadius: '32px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#C8365A' },
            }}
          >
            Done
          </Button>
        )}
      </Box>
    );
  }

  // Loading view
  if (loading) {
    return (
      <Box
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: embedded ? 200 : '40vh',
        }}
      >
        <CircularProgress sx={{ color: primaryColor }} />
        <Typography sx={{ mt: 2, color: '#666' }}>Loading transportation options...</Typography>
      </Box>
    );
  }

  // Error view (no transportation configured)
  if (error && !settings) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <DirectionsBus sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
          Transportation Not Available
        </Typography>
        <Typography variant="body2" sx={{ color: '#999' }}>
          {error}
        </Typography>
        {onClose && (
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              mt: 3,
              borderColor: primaryColor,
              color: primaryColor,
              borderRadius: '32px',
              textTransform: 'none',
            }}
          >
            Go Back
          </Button>
        )}
      </Box>
    );
  }

  const isPrescheduled = settings?.mode === 'prescheduled';

  return (
    <Box sx={{ p: embedded ? 2 : 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'var(--font-instrument-serif)',
            fontStyle: 'italic',
            color: '#1a1a1a',
            mb: 1,
          }}
        >
          Reserve Transportation
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Select your preferred transportation for the wedding
        </Typography>
        {partySize > 1 && (
          <Chip
            label={`Party of ${partySize}`}
            size="small"
            sx={{
              mt: 1,
              bgcolor: alpha(primaryColor, 0.1),
              color: primaryColor,
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={4}>
        {/* Arrival Section */}
        {settings?.arrival_configured && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'rgba(0,0,0,0.1)',
              bgcolor: 'white',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <FlightLand sx={{ color: primaryColor }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#1a1a1a' }}
              >
                Arrival Transportation
              </Typography>
              {hasExistingArrival && (
                <Chip
                  label="Previously submitted"
                  size="small"
                  sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50' }}
                />
              )}
            </Stack>

            {isPrescheduled ? (
              <PrescheduledSection
                vehicles={arrivalVehicles}
                selection={arrivalSelection}
                onSelectionChange={setArrivalSelection}
                notes={arrivalNotes}
                onNotesChange={setArrivalNotes}
                partySize={partySize}
                direction="arrival"
              />
            ) : (
              <FlexibleSection
                locations={arrivalLocations}
                timeRange={arrivalTimeRange}
                locationId={arrivalLocationId}
                onLocationChange={setArrivalLocationId}
                selectedTime={arrivalTime}
                onTimeChange={setArrivalTime}
                notes={arrivalNotes}
                onNotesChange={setArrivalNotes}
                direction="arrival"
              />
            )}
          </Paper>
        )}

        {/* Departure Section */}
        {settings?.departure_configured && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'rgba(0,0,0,0.1)',
              bgcolor: 'white',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <FlightTakeoff sx={{ color: primaryColor }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#1a1a1a' }}
              >
                Departure Transportation
              </Typography>
              {hasExistingDeparture && (
                <Chip
                  label="Previously submitted"
                  size="small"
                  sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50' }}
                />
              )}
            </Stack>

            {isPrescheduled ? (
              <PrescheduledSection
                vehicles={departureVehicles}
                selection={departureSelection}
                onSelectionChange={setDepartureSelection}
                notes={departureNotes}
                onNotesChange={setDepartureNotes}
                partySize={partySize}
                direction="departure"
              />
            ) : (
              <FlexibleSection
                locations={departureLocations}
                timeRange={departureTimeRange}
                locationId={departureLocationId}
                onLocationChange={setDepartureLocationId}
                selectedTime={departureTime}
                onTimeChange={setDepartureTime}
                notes={departureNotes}
                onNotesChange={setDepartureNotes}
                direction="departure"
              />
            )}
          </Paper>
        )}

        {/* Submit Button */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            bgcolor: primaryColor,
            color: 'white',
            py: 1.75,
            borderRadius: '32px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            boxShadow: '0 4px 16px rgba(222, 63, 94, 0.3)',
            '&:hover': {
              bgcolor: '#C8365A',
              boxShadow: '0 6px 20px rgba(222, 63, 94, 0.4)',
            },
            '&:disabled': {
              bgcolor: '#ccc',
            },
          }}
        >
          {submitting ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            'Submit Reservation'
          )}
        </Button>

        {onClose && (
          <Button
            variant="text"
            onClick={onClose}
            sx={{
              color: '#666',
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
        )}
      </Stack>
    </Box>
  );
}

// Prescheduled Mode Section
function PrescheduledSection({
  vehicles,
  selection,
  onSelectionChange,
  notes,
  onNotesChange,
  partySize,
  direction,
}: {
  vehicles: VehicleWithCapacity[];
  selection: string;
  onSelectionChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  partySize: number;
  direction: TransportationDirection;
}) {
  const primaryColor = '#DE3F5E';

  if (vehicles.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 2 }}>
        No {direction} vehicles have been scheduled yet.
      </Typography>
    );
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
        Select your preferred shuttle time:
      </Typography>

      <FormControl component="fieldset">
        <RadioGroup
          value={selection}
          onChange={(e) => onSelectionChange(e.target.value)}
        >
          {vehicles.map((vehicle) => {
            const isFull = vehicle.available < partySize;
            const spotsText = vehicle.available === 0
              ? 'Full'
              : `${vehicle.available} spot${vehicle.available !== 1 ? 's' : ''} left`;

            return (
              <Paper
                key={vehicle.id}
                elevation={0}
                sx={{
                  mb: 1.5,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: selection === vehicle.id
                    ? primaryColor
                    : isFull
                      ? 'rgba(0,0,0,0.08)'
                      : 'rgba(0,0,0,0.12)',
                  bgcolor: isFull ? 'rgba(0,0,0,0.02)' : 'white',
                  opacity: isFull ? 0.7 : 1,
                  transition: 'all 0.2s',
                  cursor: isFull ? 'not-allowed' : 'pointer',
                  '&:hover': !isFull ? {
                    borderColor: primaryColor,
                    bgcolor: alpha(primaryColor, 0.02),
                  } : {},
                }}
                onClick={() => !isFull && onSelectionChange(vehicle.id)}
              >
                <FormControlLabel
                  value={vehicle.id}
                  disabled={isFull}
                  control={
                    <Radio
                      sx={{
                        color: '#ddd',
                        '&.Mui-checked': { color: primaryColor },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {vehicle.vehicle_name || 'Shuttle'}
                        </Typography>
                        <Chip
                          label={spotsText}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.75rem',
                            bgcolor: isFull
                              ? 'rgba(0,0,0,0.1)'
                              : alpha(primaryColor, 0.1),
                            color: isFull ? '#999' : primaryColor,
                            fontWeight: 600,
                          }}
                        />
                      </Stack>
                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AccessTime sx={{ fontSize: 16, color: '#1a1a1a' }} />
                          <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                            {formatDateTime(vehicle.departure_datetime)}
                          </Typography>
                        </Stack>
                        {vehicle.pickup_location && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <LocationOn sx={{ fontSize: 16, color: '#1a1a1a' }} />
                            <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                              {vehicle.pickup_location}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Box>
                  }
                  sx={{
                    m: 0,
                    width: '100%',
                    alignItems: 'flex-start',
                  }}
                />
              </Paper>
            );
          })}
        </RadioGroup>
      </FormControl>

      <TextField
        label="Notes (optional)"
        placeholder="Any special requirements or notes..."
        multiline
        rows={2}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        fullWidth
        sx={{
          mt: 1,
          '& .MuiInputLabel-root': {
            color: '#1a1a1a',
            fontWeight: 500,
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '& fieldset': {
              borderColor: '#797979',
            },
            '& .MuiInputBase-input': {
              color: '#1a1a1a',
              WebkitTextFillColor: '#1a1a1a',
              '&::placeholder': {
                color: '#6a6a6a',
                WebkitTextFillColor: '#6a6a6a',
                opacity: 1,
              },
            },
            '&:hover fieldset': {
              borderColor: primaryColor,
            },
            '&.Mui-focused fieldset': {
              borderColor: primaryColor,
            },
          },
        }}
      />
    </Stack>
  );
}

// Flexible Mode Section
function FlexibleSection({
  locations,
  timeRange,
  locationId,
  onLocationChange,
  selectedTime,
  onTimeChange,
  notes,
  onNotesChange,
  direction,
}: {
  locations: TransportationPickupLocation[];
  timeRange: TransportationTimeRange | null;
  locationId: string;
  onLocationChange: (value: string) => void;
  selectedTime: string;
  onTimeChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  direction: TransportationDirection;
}) {
  const primaryColor = '#DE3F5E';

  const timeSlots = timeRange
    ? generateTimeSlots(
      timeRange.start_datetime,
      timeRange.end_datetime,
      timeRange.interval_minutes || 60
    )
    : [];

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (locations.length === 0 && !timeRange) {
    return (
      <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 2 }}>
        No {direction} options have been configured yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Location Selection */}
      {locations.length > 0 && (
        <Box>
          <Typography variant="body2" sx={{ color: '#1a1a1a', mb: 1.5, fontWeight: 500 }}>
            Select pickup location:
          </Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={locationId}
              onChange={(e) => onLocationChange(e.target.value)}
            >
              {locations.map((location) => (
                <Paper
                  key={location.id}
                  elevation={0}
                  sx={{
                    mb: 1,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: locationId === location.id
                      ? primaryColor
                      : 'rgba(0,0,0,0.12)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: primaryColor,
                      bgcolor: alpha(primaryColor, 0.02),
                    },
                  }}
                  onClick={() => onLocationChange(location.id)}
                >
                  <FormControlLabel
                    value={location.id}
                    control={
                      <Radio
                        sx={{
                          color: '#ddd',
                          '&.Mui-checked': { color: primaryColor },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {location.name}
                        </Typography>
                        {location.address && (
                          <Typography variant="body2" sx={{ color: '#4a4a4a', mt: 0.25 }}>
                            {location.address}
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
      )}

      {/* Time Selection */}
      {timeSlots.length > 0 && (
        <Box>
          <Typography variant="body2" sx={{ color: '#1a1a1a', mb: 1.5, fontWeight: 500 }}>
            Select preferred time:
          </Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedTime}
              onChange={(e) => onTimeChange(e.target.value)}
            >
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {timeSlots.map((slot) => {
                  const slotStr = slot.toISOString();
                  const isSelected = selectedTime === slotStr;

                  return (
                    <Chip
                      key={slotStr}
                      label={formatTime(slot)}
                      onClick={() => onTimeChange(slotStr)}
                      sx={{
                        px: 1,
                        height: 36,
                        borderRadius: '18px',
                        border: '1px solid',
                        borderColor: isSelected ? primaryColor : 'rgba(0,0,0,0.15)',
                        bgcolor: isSelected ? alpha(primaryColor, 0.1) : 'transparent',
                        color: isSelected ? primaryColor : '#333',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: primaryColor,
                          bgcolor: alpha(primaryColor, 0.05),
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </RadioGroup>
          </FormControl>
        </Box>
      )}

      <TextField
        label="Notes (optional)"
        placeholder="Any special requirements or notes..."
        multiline
        rows={2}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        fullWidth
        sx={{
          '& .MuiInputLabel-root': {
            color: '#1a1a1a',
            fontWeight: 500,
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '& fieldset': {
              borderColor: '#797979',
            },
            '& .MuiInputBase-input': {
              color: '#1a1a1a',
              WebkitTextFillColor: '#1a1a1a',
              '&::placeholder': {
                color: '#6a6a6a',
                WebkitTextFillColor: '#6a6a6a',
                opacity: 1,
              },
            },
            '&:hover fieldset': {
              borderColor: primaryColor,
            },
            '&.Mui-focused fieldset': {
              borderColor: primaryColor,
            },
          },
        }}
      />
    </Stack>
  );
}
