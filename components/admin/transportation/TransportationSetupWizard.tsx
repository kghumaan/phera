'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  TextField,
  IconButton,
  Chip,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Delete,
  ArrowBack,
  ArrowForward,
  DirectionsBus,
  FlightLand,
  FlightTakeoff,
  AccessTime,
  LocationOn,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import LocationPicker from './LocationPicker';
import {
  TransportationMode,
  TransportationDirection,
  TransportationVehicle,
  TransportationPickupLocation,
  Coordinates,
} from '@/lib/supabase/types';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getPickupLocations,
  createPickupLocation,
  updatePickupLocation,
  deletePickupLocation,
  getTimeRanges,
  upsertTimeRange,
} from '@/lib/supabase/transportation-service';

interface TransportationSetupWizardProps {
  weddingId: string;
  mode: TransportationMode;
  direction: TransportationDirection;
  onComplete: () => void;
  onBack: () => void;
  onRestart?: () => void;
  showRestart?: boolean;
}

// Vehicle form data for prescheduled mode
interface VehicleFormData {
  id?: string;
  vehicle_name: string;
  capacity: number;
  departure_datetime: Date | null;
  pickup_location: string;
  pickup_location_coordinates: Coordinates | null;
}

// Location form data for flexible mode
interface LocationFormData {
  id?: string;
  name: string;
  address: string;
  coordinates: Coordinates | null;
}

export default function TransportationSetupWizard({
  weddingId,
  mode,
  direction,
  onComplete,
  onBack,
  onRestart,
  showRestart = false,
}: TransportationSetupWizardProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Prescheduled mode state
  const [vehicles, setVehicles] = useState<VehicleFormData[]>([]);

  // Flexible mode state
  const [locations, setLocations] = useState<LocationFormData[]>([]);
  const [timeRangeStart, setTimeRangeStart] = useState<Date | null>(null);
  const [timeRangeEnd, setTimeRangeEnd] = useState<Date | null>(null);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);

  const isArrival = direction === 'arrival';
  const directionLabel = isArrival ? 'Arrival' : 'Departure';
  const directionIcon = isArrival ? <FlightLand /> : <FlightTakeoff />;

  useEffect(() => {
    loadExistingData();
  }, [weddingId, direction, mode]);

  const loadExistingData = async () => {
    setLoading(true);
    try {
      if (mode === 'prescheduled') {
        const existingVehicles = await getVehicles(weddingId, direction);
        if (existingVehicles.length > 0) {
          setVehicles(
            existingVehicles.map((v) => ({
              id: v.id,
              vehicle_name: v.vehicle_name || '',
              capacity: v.capacity,
              departure_datetime: new Date(v.departure_datetime),
              pickup_location: v.pickup_location || '',
              pickup_location_coordinates: v.pickup_location_coordinates as Coordinates | null,
            }))
          );
        } else {
          // Start with one empty vehicle
          setVehicles([createEmptyVehicle()]);
        }
      } else {
        // Flexible mode
        const existingLocations = await getPickupLocations(weddingId, direction);
        if (existingLocations.length > 0) {
          setLocations(
            existingLocations.map((l) => ({
              id: l.id,
              name: l.name,
              address: l.address || '',
              coordinates: l.coordinates as Coordinates | null,
            }))
          );
        }

        const existingTimeRanges = await getTimeRanges(weddingId, direction);
        if (existingTimeRanges.length > 0) {
          setTimeRangeStart(new Date(existingTimeRanges[0].start_datetime));
          setTimeRangeEnd(new Date(existingTimeRanges[0].end_datetime));
        }
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyVehicle = (): VehicleFormData => ({
    vehicle_name: '',
    capacity: 10,
    departure_datetime: null,
    pickup_location: '',
    pickup_location_coordinates: null,
  });

  const handleAddVehicle = () => {
    setVehicles([...vehicles, createEmptyVehicle()]);
  };

  const handleRemoveVehicle = async (index: number) => {
    const vehicle = vehicles[index];
    if (vehicle.id) {
      await deleteVehicle(vehicle.id);
    }
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const handleVehicleChange = (
    index: number,
    field: keyof VehicleFormData,
    value: VehicleFormData[keyof VehicleFormData]
  ) => {
    setVehicles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddLocation = (location: {
    name: string;
    address: string;
    coordinates: Coordinates;
  }) => {
    if (locations.length >= 5) return;

    // Duplicate check - check by address or name
    const isDuplicate = locations.some(l =>
      l.address === location.address ||
      (l.name.toLowerCase() === location.name.toLowerCase() && l.name !== '')
    );

    if (isDuplicate) return;

    setLocations([...locations, location]);
  };

  const handleRemoveLocation = async (index: number) => {
    const location = locations[index];
    if (location.id) {
      await deletePickupLocation(location.id);
    }
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      if (mode === 'prescheduled') {
        // Save all vehicles
        for (const vehicle of vehicles) {
          if (!vehicle.departure_datetime) continue;

          if (vehicle.id) {
            // Update existing vehicle
            await updateVehicle(vehicle.id, {
              vehicle_name: vehicle.vehicle_name || `${directionLabel} Vehicle`,
              capacity: vehicle.capacity,
              departure_datetime: vehicle.departure_datetime.toISOString(),
              pickup_location: vehicle.pickup_location,
              pickup_location_coordinates: vehicle.pickup_location_coordinates || undefined,
            });
          } else {
            // Create new vehicle
            await createVehicle(weddingId, {
              direction,
              vehicle_name: vehicle.vehicle_name || `${directionLabel} Vehicle`,
              capacity: vehicle.capacity,
              departure_datetime: vehicle.departure_datetime.toISOString(),
              pickup_location: vehicle.pickup_location,
              pickup_location_coordinates: vehicle.pickup_location_coordinates || undefined,
            });
          }
        }
      } else {
        // Flexible mode - save locations and time range
        for (const location of locations) {
          if (location.id) {
            // Update existing pickup location
            await updatePickupLocation(location.id, {
              name: location.name,
              address: location.address,
              coordinates: location.coordinates || undefined,
            });
          } else if (location.coordinates) {
            // Create new pickup location
            await createPickupLocation(weddingId, {
              direction,
              name: location.name,
              address: location.address,
              coordinates: location.coordinates,
            });
          }
        }

        if (timeRangeStart && timeRangeEnd) {
          await upsertTimeRange(weddingId, {
            direction,
            start_datetime: timeRangeStart.toISOString(),
            end_datetime: timeRangeEnd.toISOString(),
            interval_minutes: 60,
          });
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error saving transportation setup:', error);
    } finally {
      setSaving(false);
    }
  };

  const canContinue = () => {
    if (mode === 'prescheduled') {
      return vehicles.some((v) => v.departure_datetime && v.capacity > 0);
    } else {
      return locations.length > 0 && timeRangeStart && timeRangeEnd;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#DE3F5E' }} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {/* <Chip
                icon={directionIcon}
                label={directionLabel}
                sx={{
                  bgcolor: isArrival ? alpha('#4CAF50', 0.1) : alpha('#2196F3', 0.1),
                  color: isArrival ? '#4CAF50' : '#2196F3',
                  fontWeight: 600,
                }}
              /> */}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {isArrival ? 'Arrival Transportation' : 'Departure Transportation'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              {isArrival
                ? 'Set up how guests will get TO your wedding'
                : 'Set up how guests will leave FROM your wedding'}
            </Typography>
          </Box>

          {showRestart && onRestart && (
            <Button
              variant="text"
              size="small"
              onClick={() => setRestartDialogOpen(true)}
              sx={{
                color: '#6a6a6a',
                textTransform: 'none',
                fontSize: '0.8125rem',
                '&:hover': { color: '#DE3F5E', bgcolor: 'transparent', textDecoration: 'underline' }
              }}
            >
              Restart from beginning?
            </Button>
          )}
        </Box>

        {/* Mode-specific content */}
        {mode === 'prescheduled' ? (
          <PrescheduledSetup
            vehicles={vehicles}
            direction={direction}
            onAddVehicle={handleAddVehicle}
            onRemoveVehicle={handleRemoveVehicle}
            onVehicleChange={handleVehicleChange}
          />
        ) : (
          <FlexibleSetup
            locations={locations}
            timeRangeStart={timeRangeStart}
            timeRangeEnd={timeRangeEnd}
            direction={direction}
            onAddLocation={handleAddLocation}
            onRemoveLocation={handleRemoveLocation}
            onTimeRangeStartChange={setTimeRangeStart}
            onTimeRangeEndChange={setTimeRangeEnd}
          />
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, maxWidth: 1000 }}>
          <Button
            onClick={onBack}
            startIcon={<ArrowBack />}
            sx={{
              color: '#6a6a6a',
              textTransform: 'none',
              borderRadius: 1,
              '&:hover': { bgcolor: alpha('#000', 0.05) },
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAndContinue}
            disabled={!canContinue() || saving}
            endIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
            sx={{
              bgcolor: '#DE3F5E',
              color: 'white',
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 1,
              '&:hover': { bgcolor: '#c73552' },
              '&.Mui-disabled': {
                bgcolor: alpha('#DE3F5E', 0.3),
                color: 'white',
              },
            }}
          >
            {isArrival ? 'Continue to Departure' : 'Complete Setup'}
          </Button>
        </Box>
      </Stack>
      <Dialog
        open={restartDialogOpen}
        onClose={() => setRestartDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 1, p: 1, maxWidth: 400 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Restart Setup?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            This will reset your transportation settings. You'll need to choose between prescheduled or flexible mode again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setRestartDialogOpen(false)}
            sx={{ color: '#6a6a6a', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setRestartDialogOpen(false);
              onRestart?.();
            }}
            sx={{
              color: '#DE3F5E',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Yes, Restart
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

// Prescheduled Setup Component
function PrescheduledSetup({
  vehicles,
  direction,
  onAddVehicle,
  onRemoveVehicle,
  onVehicleChange,
}: {
  vehicles: VehicleFormData[];
  direction: TransportationDirection;
  onAddVehicle: () => void;
  onRemoveVehicle: (index: number) => void;
  onVehicleChange: (index: number, field: keyof VehicleFormData, value: VehicleFormData[keyof VehicleFormData]) => void;
}) {
  const capacityOptions = Array.from({ length: 37 }, (_, i) => i + 4); // 4 to 40

  return (
    <Stack spacing={2}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid #797979ff',
          borderRadius: 2,
          bgcolor: 'white',
          maxWidth: 1000,
        }}
      >
        <Typography variant="subtitleCaps" sx={{ color: '#1a1a1a', mb: 2 }}>
          Add your {direction === 'arrival' ? 'pickup' : 'departure'} vehicles
        </Typography>
        <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 3 }}>
          Enter the shuttles or buses you've arranged. Guests will be able to reserve spots on these vehicles.
        </Typography>

        <Stack spacing={3}>
          {vehicles.map((vehicle, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: alpha('#000', 0.03),
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DirectionsBus sx={{ color: '#DE3F5E' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    Vehicle {index + 1}
                  </Typography>
                </Box>
                {vehicles.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => onRemoveVehicle(index)}
                    sx={{ color: '#9a9a9a', '&:hover': { color: '#DE3F5E' } }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="caption" sx={{ color: '#1a1a1a', mb: 0.5, display: 'block', fontWeight: 600 }}>
                      Vehicle Name (optional)
                    </Typography>
                    <TextField
                      value={vehicle.vehicle_name}
                      onChange={(e) => onVehicleChange(index, 'vehicle_name', e.target.value)}
                      placeholder="e.g., Family Bus, Party Shuttle"
                      size="small"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#797979' },
                          '&:hover fieldset': { borderColor: '#DE3F5E' },
                          '&.Mui-focused fieldset': { borderColor: '#DE3F5E' },
                          '& .MuiInputBase-input': { color: '#1a1a1a', fontWeight: 500 },
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="caption" sx={{ color: '#1a1a1a', mb: 0.5, display: 'block', fontWeight: 600 }}>
                      Capacity
                    </Typography>
                    <Select
                      value={vehicle.capacity}
                      onChange={(e) => onVehicleChange(index, 'capacity', e.target.value as number)}
                      size="small"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#797979',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#DE3F5E',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#DE3F5E',
                        },
                        '& .MuiSelect-select': {
                          color: '#1a1a1a',
                          fontWeight: 500,
                        },
                      }}
                    >
                      {capacityOptions.map((cap) => (
                        <MenuItem key={cap} value={cap}>
                          {cap} seats
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="caption" sx={{ color: '#1a1a1a', mb: 0.5, display: 'block', fontWeight: 600 }}>
                      {direction === 'arrival' ? 'Pickup Time' : 'Departure Time'}
                    </Typography>
                    <DateTimePicker
                      value={vehicle.departure_datetime}
                      onChange={(date) => onVehicleChange(index, 'departure_datetime', date)}
                      enableAccessibleFieldDOMStructure={false}
                      slots={{
                        textField: TextField,
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#797979' },
                              '&:hover fieldset': { borderColor: '#DE3F5E' },
                              '&.Mui-focused fieldset': { borderColor: '#DE3F5E' },
                              '& .MuiInputBase-input': {
                                color: '#1a1a1a !important',
                                WebkitTextFillColor: '#1a1a1a !important',
                                fontWeight: 500,
                                '&::placeholder': {
                                  color: '#6a6a6a !important',
                                  WebkitTextFillColor: '#6a6a6a !important',
                                  opacity: 1,
                                }
                              },
                              '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                color: '#1a1a1a !important',
                              },
                              '& .MuiIconButton-root': {
                                color: '#1a1a1a !important',
                              },
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 2, minWidth: 300 }}>
                    <Typography variant="caption" sx={{ color: '#1a1a1a', mb: 0.5, display: 'block', fontWeight: 600 }}>
                      {direction === 'arrival' ? 'Pickup Location' : 'Departure Location'}
                    </Typography>
                    <LocationPicker
                      value={
                        vehicle.pickup_location_coordinates
                          ? {
                            name: vehicle.pickup_location || 'Selected Location',
                            address: vehicle.pickup_location || 'Address unknown',
                            coordinates: vehicle.pickup_location_coordinates,
                          }
                          : null
                      }
                      onChange={(location) => {
                        onVehicleChange(index, 'pickup_location', location?.name || '');
                        onVehicleChange(index, 'pickup_location_coordinates', location?.coordinates || null);
                      }}
                      placeholder={
                        direction === 'arrival'
                          ? 'Search for pickup location'
                          : 'Search for departure location'
                      }
                    />
                  </Box>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Button
          startIcon={<Add />}
          onClick={onAddVehicle}
          sx={{
            mt: 2,
            color: '#DE3F5E',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: alpha('#DE3F5E', 0.05) },
          }}
        >
          Add another vehicle
        </Button>
      </Paper>
    </Stack>
  );
}

// Flexible Setup Component
function FlexibleSetup({
  locations,
  timeRangeStart,
  timeRangeEnd,
  direction,
  onAddLocation,
  onRemoveLocation,
  onTimeRangeStartChange,
  onTimeRangeEndChange,
}: {
  locations: LocationFormData[];
  timeRangeStart: Date | null;
  timeRangeEnd: Date | null;
  direction: TransportationDirection;
  onAddLocation: (location: { name: string; address: string; coordinates: Coordinates }) => void;
  onRemoveLocation: (index: number) => void;
  onTimeRangeStartChange: (date: Date | null) => void;
  onTimeRangeEndChange: (date: Date | null) => void;
}) {
  const [pendingLocation, setPendingLocation] = useState<{
    name: string;
    address: string;
    coordinates: Coordinates;
  } | null>(null);

  const handleLocationSelect = (location: {
    name: string;
    address: string;
    coordinates: Coordinates;
  } | null) => {
    if (location) {
      onAddLocation(location);
    }
  };

  // Generate preview time slots
  const previewSlots = () => {
    if (!timeRangeStart || !timeRangeEnd) return [];
    const slots: string[] = [];
    let current = new Date(timeRangeStart);
    while (current <= timeRangeEnd && slots.length < 8) {
      slots.push(
        current.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      current = new Date(current.getTime() + 60 * 60 * 1000); // Add 1 hour
    }
    if (slots.length === 8) {
      slots.push('...');
    }
    return slots;
  };

  return (
    <Stack spacing={3}
      sx={{
        border: '1px solid #797979ff',
        borderRadius: 2,
        p: 1,
        maxWidth: 1000,
      }}
    >
      {/* Pickup Locations - Only for Arrival */}
      {direction === 'arrival' && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'white',
          }}
        >
          <Typography variant="subtitleCaps" sx={{ color: '#1a1a1a', mb: 1 }}>
            Pickup Locations
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 2 }}>
            Add up to 5 locations where guests can be picked up (e.g., airports, hotels, central spots)
          </Typography>

          {/* Selected Locations */}
          {locations.length > 0 && (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {locations.map((location, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: alpha('#4CAF50', 0.05),
                    border: '1px solid',
                    borderColor: alpha('#4CAF50', 0.2),
                    borderRadius: 1,
                  }}
                >
                  <LocationOn sx={{ color: '#4CAF50', mr: 1 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: '0.9rem' }}>
                      {location.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                      {location.address}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => onRemoveLocation(index)}
                    sx={{ color: '#9a9a9a', '&:hover': { color: '#DE3F5E' } }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Stack>
          )}

          {/* Add Location */}
          {locations.length < 5 && (
            <Box sx={{ maxWidth: 700 }}>
              <LocationPicker
                value={null}
                onChange={handleLocationSelect}
                placeholder="Search for a location..."
              />
            </Box>
          )}

          {locations.length >= 5 && (
            <Typography variant="body2" sx={{ color: '#FF9800', mt: 1 }}>
              Maximum 5 locations reached
            </Typography>
          )}
        </Paper>
      )}

      {/* Time Range */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'white',
        }}
      >
        <Typography variant="subtitleCaps" sx={{ color: '#1a1a1a', mb: 1 }}>
          Available {direction === 'arrival' ? 'Pickup' : 'Departure'} Times
        </Typography>
        <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 2 }}>
          We'll offer guests hourly pickup slots within this time range
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <DateTimePicker
            label="From"
            value={timeRangeStart}
            onChange={onTimeRangeStartChange}
            enableAccessibleFieldDOMStructure={false}
            slots={{
              textField: TextField,
            }}
            slotProps={{
              textField: {
                size: 'small',
                sx: {
                  minWidth: 200,
                  '& .MuiInputLabel-root': { color: '#1a1a1a', fontWeight: 500 },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#797979' },
                    '&:hover fieldset': { borderColor: '#DE3F5E' },
                    '&.Mui-focused fieldset': { borderColor: '#DE3F5E' },
                    '& .MuiInputBase-input': {
                      color: '#1a1a1a !important',
                      WebkitTextFillColor: '#1a1a1a !important',
                      fontWeight: 500,
                      '&::placeholder': {
                        color: '#6a6a6a !important',
                        WebkitTextFillColor: '#6a6a6a !important',
                        opacity: 1,
                      }
                    },
                    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                      color: '#1a1a1a !important',
                    },
                    '& .MuiIconButton-root': {
                      color: '#1a1a1a !important',
                    },
                  },
                },
              },
            }}
          />
          <DateTimePicker
            label="To"
            value={timeRangeEnd}
            onChange={onTimeRangeEndChange}
            enableAccessibleFieldDOMStructure={false}
            minDateTime={timeRangeStart || undefined}
            slots={{
              textField: TextField,
            }}
            slotProps={{
              textField: {
                size: 'small',
                sx: {
                  minWidth: 200,
                  '& .MuiInputLabel-root': { color: '#1a1a1a', fontWeight: 500 },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#797979' },
                    '&:hover fieldset': { borderColor: '#DE3F5E' },
                    '&.Mui-focused fieldset': { borderColor: '#DE3F5E' },
                    '& .MuiInputBase-input': {
                      color: '#1a1a1a !important',
                      WebkitTextFillColor: '#1a1a1a !important',
                      fontWeight: 500,
                      '&::placeholder': {
                        color: '#6a6a6a !important',
                        WebkitTextFillColor: '#6a6a6a !important',
                        opacity: 1,
                      }
                    },
                    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                      color: '#1a1a1a !important',
                    },
                    '& .MuiIconButton-root': {
                      color: '#1a1a1a !important',
                    },
                  },
                },
              },
            }}
          />
        </Box>

        {/* Preview slots */}
        {timeRangeStart && timeRangeEnd && (
          <Box>
            <Typography variant="caption" sx={{ color: '#6a6a6a', mb: 1, display: 'block' }}>
              Preview of available slots:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {previewSlots().map((slot, i) => (
                <Chip
                  key={i}
                  icon={<AccessTime sx={{ fontSize: 26, color: '#DE3F5E !important' }} />}
                  label={slot}
                  size="medium"
                  sx={{
                    bgcolor: alpha('#DE3F5E', 0.1),
                    color: '#DE3F5E',
                    fontSize: '18px',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
