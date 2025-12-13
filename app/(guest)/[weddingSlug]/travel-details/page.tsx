'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  IconButton,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { ArrowBack, CheckCircle, RadioButtonUnchecked, FlightTakeoff } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import { 
  getGuestFlight, 
  upsertGuestFlight, 
  getGuestChecklist, 
  updateChecklistItem,
  THAILAND_CHECKLIST 
} from '@/lib/supabase/travel-service';
import type { GuestFlight, GuestChecklistItem } from '@/lib/supabase/types';

interface FlightFormData {
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

const initialFlightData: FlightFormData = {
  airline: '',
  flightNumber: '',
  departureAirport: '',
  arrivalAirport: '',
  departureDate: '',
  departureTime: '',
  arrivalDate: '',
  arrivalTime: '',
  shuttlePreferenceTime: '',
  shuttlePreferenceNote: '',
};

export default function TravelDetailsPage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, hasRSVPed, rsvpResponse, isLoading: authLoading } = useAuth();
  
  const [flightData, setFlightData] = useState<FlightFormData>(initialFlightData);
  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Only show checklist for guests who RSVP'd "yes"
  const showChecklist = rsvpResponse === 'yes';

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || authLoading) return;
      
      setIsLoading(true);
      try {
        // Load flight data
        const flight = await getGuestFlight(user.id, weddingSlug);
        if (flight) {
          // Parse datetime strings back to date and time
          const parseDT = (dt?: string) => {
            if (!dt) return { date: '', time: '' };
            try {
              const d = new Date(dt);
              return {
                date: d.toISOString().split('T')[0],
                time: d.toTimeString().slice(0, 5),
              };
            } catch {
              return { date: '', time: '' };
            }
          };
          
          const departure = parseDT(flight.departure_datetime);
          const arrival = parseDT(flight.arrival_datetime);
          
          setFlightData({
            airline: flight.airline || '',
            flightNumber: flight.flight_number || '',
            departureAirport: flight.departure_airport || '',
            arrivalAirport: flight.arrival_airport || '',
            departureDate: departure.date,
            departureTime: departure.time,
            arrivalDate: arrival.date,
            arrivalTime: arrival.time,
            shuttlePreferenceTime: flight.shuttle_preference_time || '',
            shuttlePreferenceNote: flight.shuttle_preference_note || '',
          });
        }
        
        // Load checklist data
        const checklist = await getGuestChecklist(user.id, weddingSlug);
        const checklistMap: Record<string, boolean> = {};
        checklist.forEach(item => {
          checklistMap[item.item_key] = item.completed;
        });
        setChecklistItems(checklistMap);
      } catch (error) {
        console.error('Error loading travel data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, weddingSlug, authLoading]);

  const handleInputChange = (field: keyof FlightFormData, value: string) => {
    setFlightData(prev => ({ ...prev, [field]: value }));
    setSaveMessage(null);
  };

  const handleChecklistChange = async (itemKey: string, checked: boolean) => {
    if (!user?.id) return;
    
    setChecklistItems(prev => ({ ...prev, [itemKey]: checked }));
    
    try {
      await updateChecklistItem(user.id, weddingSlug, itemKey, checked);
    } catch (error) {
      console.error('Error updating checklist:', error);
      // Revert on error
      setChecklistItems(prev => ({ ...prev, [itemKey]: !checked }));
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const result = await upsertGuestFlight(user.id, weddingSlug, flightData);
      
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Travel details saved!' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving flight data:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/${weddingSlug}/details`);
  };

  // Redirect if not authenticated or not RSVP'd
  if (!authLoading && (!user || !hasRSVPed)) {
    return (
      <OptimizedBackground useAppDefault className="min-h-screen">
        {/* Desktop Header */}
        {!isMobile && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: 'transparent',
            }}
          >
            <AppHeader
              variant="transparent"
              showBackButton={true}
              backHref={`/${weddingSlug}/details`}
            />
          </Box>
        )}
        
        {/* Centered Content */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            px: 2,
          }}
        >
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, maxWidth: 500 }}>
            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Outfit' }}>
              Please provide your arrival details through the RSVP form
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => router.push(`/${weddingSlug}/rsvp`)}
              sx={{ 
                bgcolor: '#DE3F5E',
                '&:hover': { bgcolor: '#C8365A' },
                borderRadius: 2,
                fontFamily: 'Outfit',
              }}
            >
              Go to RSVP
            </Button>
          </Paper>
        </Box>
      </OptimizedBackground>
    );
  }

  if (isLoading || authLoading) {
    return (
      <OptimizedBackground useAppDefault className="min-h-screen">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress sx={{ color: '#DE3F5E' }} />
        </Box>
      </OptimizedBackground>
    );
  }

  return (
    <OptimizedBackground useAppDefault className="min-h-screen">
      <Box sx={{ minHeight: '100vh', pb: 4 }}>
        {/* Desktop Header - AppHeader with consistent styling */}
        {!isMobile && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: 'transparent',
            }}
          >
            <AppHeader
              variant="transparent"
              showBackButton={true}
              backHref={`/${weddingSlug}/details`}
            />
          </Box>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <Box sx={{ pt: 2, pb: 2 }}>
            <Container maxWidth="sm">
              <Stack direction="row" alignItems="center" spacing={2}>
                <IconButton
                  onClick={handleBack}
                  sx={{
                    color: '#000',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Outfit',
                    fontWeight: 400,
                    fontSize: 18,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#141414',
                  }}
                >
                  Travel Details
                </Typography>
              </Stack>
            </Container>
          </Box>
        )}

        <Container 
          maxWidth={false}
          sx={{
            maxWidth: { xs: '100%', md: 800, lg: 900 },
            px: { xs: 2, md: 4 },
            pt: { xs: 0, md: 14 },
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Stack spacing={3}>
              {/* Flight Details Card */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  bgcolor: 'rgba(255,255,255,0.95)',
                }}
              >
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FlightTakeoff sx={{ color: '#DE3F5E' }} />
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 500, color: '#141414' }}>
                      Your Flight Details
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', fontFamily: 'Outfit' }}>
                    Share your flight info so we can coordinate airport pickups. All fields are optional.
                  </Typography>

                  {/* Airline and Flight Number */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Airline"
                      value={flightData.airline}
                      onChange={(e) => handleInputChange('airline', e.target.value)}
                      fullWidth
                      placeholder="e.g. Thai Airways"
                      sx={{ 
                        '& .MuiInputBase-root': { fontFamily: 'Outfit', color: '#141414' },
                        '& .MuiInputLabel-root': { color: '#666' },
                        '& .MuiOutlinedInput-root': { 
                          '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                        },
                      }}
                    />
                    <TextField
                      label="Flight Number"
                      value={flightData.flightNumber}
                      onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                      fullWidth
                      placeholder="e.g. TG123"
                      sx={{ 
                        '& .MuiInputBase-root': { fontFamily: 'Outfit', color: '#141414' },
                        '& .MuiInputLabel-root': { color: '#666' },
                        '& .MuiOutlinedInput-root': { 
                          '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                        },
                      }}
                    />
                  </Stack>

                  {/* Airports */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Departing From"
                      value={flightData.departureAirport}
                      onChange={(e) => handleInputChange('departureAirport', e.target.value)}
                      fullWidth
                      placeholder="e.g. LAX"
                      sx={{ 
                        '& .MuiInputBase-root': { fontFamily: 'Outfit', color: '#141414' },
                        '& .MuiInputLabel-root': { color: '#666' },
                        '& .MuiOutlinedInput-root': { 
                          '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                        },
                      }}
                    />
                    <TextField
                      label="Arriving At"
                      value={flightData.arrivalAirport}
                      onChange={(e) => handleInputChange('arrivalAirport', e.target.value)}
                      fullWidth
                      placeholder="e.g. BKK"
                      sx={{ 
                        '& .MuiInputBase-root': { fontFamily: 'Outfit', color: '#141414' },
                        '& .MuiInputLabel-root': { color: '#666' },
                        '& .MuiOutlinedInput-root': { 
                          '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                        },
                      }}
                    />
                  </Stack>

                  {/* Arrival Date/Time */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Arrival Date"
                      type="date"
                      value={flightData.arrivalDate}
                      onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: '2025-12-01', max: '2026-01-10' }}
                      sx={{ 
                        '& .MuiInputBase-root': { fontFamily: 'Outfit', color: '#141414' },
                        '& .MuiInputLabel-root': { color: '#666' },
                        '& .MuiOutlinedInput-root': { 
                          '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                        },
                      }}
                    />
                    <TextField
                      label="Arrival Time"
                      type="time"
                      value={flightData.arrivalTime}
                      onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      sx={{ 
                        '& .MuiInputBase-root': { fontFamily: 'Outfit', color: '#141414' },
                        '& .MuiInputLabel-root': { color: '#666' },
                        '& .MuiOutlinedInput-root': { 
                          '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                        },
                      }}
                    />
                  </Stack>
                </Stack>
              </Paper>

              {/* Shuttle Preference Card */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  bgcolor: 'rgba(255,255,255,0.95)',
                }}
              >
                <Stack spacing={3}>
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 500, color: '#141414' }}>
                    Shuttle Preference
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', fontFamily: 'Outfit' }}>
                    When would you like to be picked up from Bangkok to travel to Hua Hin?
                  </Typography>

                  <TextField
                    label="Preferred Pickup Time"
                    type="time"
                    value={flightData.shuttlePreferenceTime}
                    onChange={(e) => handleInputChange('shuttlePreferenceTime', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    helperText="This is your preferred time. We'll confirm the closest available shuttle slot."
                    sx={{ 
                      '& .MuiInputBase-root': { fontFamily: 'Outfit', color: '#141414' },
                      '& .MuiInputLabel-root': { color: '#666' },
                      '& .MuiOutlinedInput-root': { 
                        '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                      },
                      '& .MuiFormHelperText-root': { color: '#666' },
                    }}
                  />

                  <TextField
                    label="Any notes about your travel?"
                    value={flightData.shuttlePreferenceNote}
                    onChange={(e) => handleInputChange('shuttlePreferenceNote', e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="e.g. Traveling with luggage, need wheelchair access, etc."
                    sx={{ 
                      '& .MuiInputBase-root': { fontFamily: 'Outfit', color: '#141414' },
                      '& .MuiInputLabel-root': { color: '#666' },
                      '& .MuiOutlinedInput-root': { 
                        '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                      },
                    }}
                  />
                </Stack>
              </Paper>

              {/* Save Button */}
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving}
                fullWidth
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  py: 1.5,
                  borderRadius: 2,
                  fontFamily: 'Outfit',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  '&:hover': { bgcolor: '#C8365A' },
                  '&:disabled': { bgcolor: '#ccc' },
                }}
              >
                {isSaving ? 'Saving...' : 'Save Travel Details'}
              </Button>

              {saveMessage && (
                <Alert 
                  severity={saveMessage.type} 
                  sx={{ borderRadius: 2 }}
                  onClose={() => setSaveMessage(null)}
                >
                  {saveMessage.text}
                </Alert>
              )}

              {/* Checklist Card - Only for "yes" RSVPs */}
              {showChecklist && (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.08)',
                    bgcolor: 'rgba(255,255,255,0.95)',
                  }}
                >
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 500, color: '#141414' }}>
                      Thailand Travel Checklist
                    </Typography>

                    <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', fontFamily: 'Outfit' }}>
                      Keep track of your travel prep:
                    </Typography>

                    <Stack spacing={1}>
                      {THAILAND_CHECKLIST.map((item) => (
                        <Box
                          key={item.key}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: checklistItems[item.key] ? 'rgba(222, 63, 94, 0.08)' : 'rgba(0,0,0,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                          }}
                          onClick={() => handleChecklistChange(item.key, !checklistItems[item.key])}
                        >
                          {checklistItems[item.key] ? (
                            <CheckCircle sx={{ color: '#DE3F5E', mr: 1.5, mt: 0.25 }} />
                          ) : (
                            <RadioButtonUnchecked sx={{ color: 'rgba(0,0,0,0.3)', mr: 1.5, mt: 0.25 }} />
                          )}
                          <Box>
                            <Typography 
                              sx={{ 
                                fontFamily: 'Outfit',
                                fontWeight: checklistItems[item.key] ? 500 : 400,
                                color: checklistItems[item.key] ? '#DE3F5E' : '#141414',
                                textDecoration: checklistItems[item.key] ? 'line-through' : 'none',
                              }}
                            >
                              {item.label}
                            </Typography>
                            {item.description && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'rgba(0,0,0,0.5)', 
                                  fontFamily: 'Outfit',
                                  display: 'block',
                                }}
                              >
                                {item.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Stack>

                    <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.5)', fontFamily: 'Outfit', textAlign: 'center' }}>
                      {Object.values(checklistItems).filter(Boolean).length} of {THAILAND_CHECKLIST.length} completed
                    </Typography>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </motion.div>
        </Container>
      </Box>
    </OptimizedBackground>
  );
}









