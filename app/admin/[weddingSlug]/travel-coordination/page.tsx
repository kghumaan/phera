'use client';

import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import {
  FlightTakeoff,
  DirectionsBus,
  CheckCircle,
  People,
  AccessTime,
  Warning,
  LockOutlined,
} from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import {
  getAllGuestFlights,
  getShuttlePreferencesSummary,
  getAllGuestChecklists,
  THAILAND_CHECKLIST
} from '@/lib/supabase/travel-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { GuestFlight } from '@/lib/supabase/types';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TravelCoordinationPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [flights, setFlights] = useState<GuestFlight[]>([]);
  const [shuttlePreferences, setShuttlePreferences] = useState<{ time: string; guests: { id: string; name: string; note?: string }[] }[]>([]);
  const [checklistStats, setChecklistStats] = useState<{
    guestId: string;
    guestName: string;
    guestEmail: string;
    completedItems: string[];
    totalItems: number;
  }[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (isPro) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [weddingSlug, isPro]);

  const loadData = async () => {
    try {
      // Load all data in parallel using weddingSlug directly
      // (Flight data is stored with wedding slug, not UUID)
      const [flightsData, shuttleData, checklistData] = await Promise.all([
        getAllGuestFlights(weddingSlug),
        getShuttlePreferencesSummary(weddingSlug),
        getAllGuestChecklists(weddingSlug),
      ]);
      
      setFlights(flightsData);
      setShuttlePreferences(shuttleData);
      setChecklistStats(checklistData);
    } catch (err) {
      console.error('Error loading travel coordination data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (datetime?: string) => {
    if (!datetime) return '-';
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

  const formatTime = (time?: string) => {
    if (!time) return '-';
    try {
      // Handle HH:MM:SS format
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  // Calculate stats
  const totalFlights = flights.length;
  const totalShuttleRequests = shuttlePreferences.reduce((sum, pref) => sum + pref.guests.length, 0);
  const totalChecklistGuests = checklistStats.length;
  const avgChecklistCompletion = checklistStats.length > 0
    ? Math.round(checklistStats.reduce((sum, g) => sum + (g.completedItems.length / g.totalItems) * 100, 0) / checklistStats.length)
    : 0;

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading transportation data..." />
      </Box>
    );
  }

  if (!isPro) {
    // Mock data for preview
    const mockFlights = [
      { id: '1', guest: { name: 'Priya Sharma', email: 'priya@example.com' }, airline: 'Air India', flight_number: 'AI 202', departure_airport: 'JFK', arrival_airport: 'BKK', arrival_datetime: '2026-01-03T14:30:00', shuttle_preference_time: '15:00:00', shuttle_preference_note: 'Travelling with 2 bags' },
      { id: '2', guest: { name: 'Arjun Mehta', email: 'arjun@example.com' }, airline: 'Emirates', flight_number: 'EK 373', departure_airport: 'LHR', arrival_airport: 'BKK', arrival_datetime: '2026-01-03T18:45:00', shuttle_preference_time: '19:30:00', shuttle_preference_note: null },
      { id: '3', guest: { name: 'Neha & Raj Patel', email: 'neha@example.com' }, airline: 'Thai Airways', flight_number: 'TG 917', departure_airport: 'SIN', arrival_airport: 'BKK', arrival_datetime: '2026-01-04T09:15:00', shuttle_preference_time: '10:00:00', shuttle_preference_note: 'Wheelchair assistance needed' },
      { id: '4', guest: { name: 'Simran Kaur', email: 'simran@example.com' }, airline: 'Singapore Air', flight_number: 'SQ 971', departure_airport: 'SIN', arrival_airport: 'BKK', arrival_datetime: '2026-01-04T11:20:00', shuttle_preference_time: null, shuttle_preference_note: null },
    ];
    const mockShuttles = [
      { time: '15:00:00', guests: [{ id: '1', name: 'Priya Sharma', note: '2 bags' }, { id: '5', name: 'Kabir & Anjali Nair', note: null }] },
      { time: '19:30:00', guests: [{ id: '2', name: 'Arjun Mehta', note: null }, { id: '6', name: 'Dev Kapoor', note: 'Late check-in' }, { id: '7', name: 'Pooja Iyer', note: null }] },
      { time: '10:00:00', guests: [{ id: '3', name: 'Neha & Raj Patel', note: 'Wheelchair' }] },
    ];
    const mockChecklist = [
      { guestId: '1', guestName: 'Priya Sharma', guestEmail: 'priya@example.com', completedItems: ['passport', 'visa', 'travel_insurance', 'accommodation', 'currency'], totalItems: 7 },
      { guestId: '2', guestName: 'Arjun Mehta', guestEmail: 'arjun@example.com', completedItems: ['passport', 'visa', 'accommodation'], totalItems: 7 },
      { guestId: '3', guestName: 'Neha & Raj Patel', guestEmail: 'neha@example.com', completedItems: ['passport', 'visa', 'travel_insurance', 'accommodation', 'currency', 'airport_transfer', 'packing'], totalItems: 7 },
    ];

    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>
          {/* Header row with Upgrade button */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Transportation
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Manage guest flights, shuttle preferences, and travel checklist progress
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => setUpgradeModalOpen(true)}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&:hover': { bgcolor: '#c73552' },
              }}
            >
              Upgrade to Pro
            </Button>
          </Box>

          {/* Description */}
          <Typography variant="body2" sx={{ color: '#6a6a6a', lineHeight: 1.8, maxWidth: 680 }}>
            With Transportation, you can track guest flight details, organize shuttle pickup times, and monitor travel checklist completion — all in one place. Help your guests arrive stress-free and keep yourself in the loop.
          </Typography>

          {/* Blurred mock view */}
          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
            {/* Blur + lock overlay */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                backdropFilter: 'blur(6px)',
                bgcolor: 'rgba(255,255,255,0.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <LockOutlined sx={{ fontSize: 32, color: '#DE3F5E' }} />
              <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1rem' }}>
                Upgrade to unlock Transportation
              </Typography>
              <Button
                variant="contained"
                onClick={() => setUpgradeModalOpen(true)}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#c73552' },
                }}
              >
                Upgrade to Pro
              </Button>
            </Box>

            {/* Mock stats */}
            <Box sx={{ pointerEvents: 'none', userSelect: 'none' }}>
              <Grid spacing={3} sx={{ mb: 3 }}>
                {[
                  { icon: <FlightTakeoff />, color: '#DE3F5E', value: 8, label: 'Flights Entered' },
                  { icon: <DirectionsBus />, color: '#4CAF50', value: 12, label: 'Shuttle Requests' },
                  { icon: <People />, color: '#2196F3', value: 6, label: 'Guests with Checklists' },
                  { icon: <CheckCircle />, color: '#FF9800', value: '72%', label: 'Avg Checklist Done' },
                ].map((stat, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'white' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, mr: 2 }}>{stat.icon}</Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>{stat.value}</Typography>
                            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>{stat.label}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Mock tabs + table */}
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'white' }}>
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2, display: 'flex', gap: 3, py: 1.5 }}>
                  {['Flight Overview', 'Shuttle Preferences', 'Checklist Progress'].map((t, i) => (
                    <Typography key={i} sx={{ fontSize: '0.875rem', fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#DE3F5E' : '#4a4a4a', borderBottom: i === 0 ? '2px solid #DE3F5E' : 'none', pb: 0.5 }}>{t}</Typography>
                  ))}
                </Box>
                <Box sx={{ p: 2 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {['Guest', 'Flight', 'Route', 'Arrival', 'Shuttle Pref'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 600, color: '#1a1a1a' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mockFlights.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#1a1a1a' }}>{f.guest.name}</Typography>
                              <Typography variant="caption" sx={{ color: '#6a6a6a' }}>{f.guest.email}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={`${f.airline} ${f.flight_number}`} size="small" sx={{ bgcolor: '#DE3F5E10', color: '#DE3F5E' }} />
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: '0.875rem', color: '#1a1a1a' }}>{f.departure_airport} → {f.arrival_airport}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: '0.875rem', color: '#1a1a1a' }}>{formatDateTime(f.arrival_datetime)}</Typography>
                            </TableCell>
                            <TableCell>
                              {f.shuttle_preference_time ? (
                                <Chip icon={<AccessTime sx={{ fontSize: 14 }} />} label={formatTime(f.shuttle_preference_time)} size="small" sx={{ bgcolor: '#4CAF5010', color: '#4CAF50' }} />
                              ) : (
                                <Typography variant="caption" sx={{ color: '#9a9a9a' }}>—</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Stack>

        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Transportation
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Manage guest flights, shuttle preferences, and travel checklist progress
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#DE3F5E20', color: '#DE3F5E', mr: 2 }}>
                    <FlightTakeoff />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>{totalFlights}</Typography>
                    <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Flights Entered</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#4CAF5020', color: '#4CAF50', mr: 2 }}>
                    <DirectionsBus />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>{totalShuttleRequests}</Typography>
                    <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Shuttle Requests</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#2196F320', color: '#2196F3', mr: 2 }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>{totalChecklistGuests}</Typography>
                    <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Guests with Checklists</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#FF980020', color: '#FF9800', mr: 2 }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>{avgChecklistCompletion}%</Typography>
                    <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Avg Checklist Done</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'white' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ 
              borderBottom: '1px solid', 
              borderColor: 'divider', 
              px: 2,
              '& .MuiTab-root': {
                color: '#4a4a4a',
                textTransform: 'none',
                fontWeight: 500,
              },
              '& .Mui-selected': {
                color: '#DE3F5E !important',
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#DE3F5E',
              },
            }}
          >
            <Tab label="Flight Overview" icon={<FlightTakeoff />} iconPosition="start" />
            <Tab label="Shuttle Preferences" icon={<DirectionsBus />} iconPosition="start" />
            <Tab label="Checklist Progress" icon={<CheckCircle />} iconPosition="start" />
          </Tabs>

          {/* Flight Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ px: 2 }}>
              {flights.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <FlightTakeoff sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No flight details entered yet</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Guests can enter their flight details during RSVP or from the Travel Details page
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Guest</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Flight</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Route</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Arrival</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Shuttle Pref</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {flights.map((flight) => (
                        <TableRow key={flight.id} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                              {flight.guest?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                              {flight.guest?.email || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {flight.airline && flight.flight_number ? (
                              <Chip 
                                label={`${flight.airline} ${flight.flight_number}`} 
                                size="small"
                                sx={{ bgcolor: '#DE3F5E10', color: '#DE3F5E' }}
                              />
                            ) : (
                              <Typography color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {flight.departure_airport || flight.arrival_airport ? (
                              <Typography sx={{ color: '#1a1a1a' }}>
                                {flight.departure_airport || '?'} → {flight.arrival_airport || '?'}
                              </Typography>
                            ) : (
                              <Typography sx={{ color: '#6a6a6a' }}>-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: '#1a1a1a' }}>{formatDateTime(flight.arrival_datetime ?? undefined)}</Typography>
                          </TableCell>
                          <TableCell>
                            {flight.shuttle_preference_time ? (
                              <Box>
                                <Chip 
                                  icon={<AccessTime sx={{ fontSize: 16 }} />}
                                  label={formatTime(flight.shuttle_preference_time)} 
                                  size="small"
                                  sx={{ bgcolor: '#4CAF5010', color: '#4CAF50' }}
                                />
                                {flight.shuttle_preference_note && (
                                  <Typography variant="caption" display="block" sx={{ color: '#6a6a6a', mt: 0.5 }}>
                                    {flight.shuttle_preference_note}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          {/* Shuttle Preferences Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ px: 2 }}>
              {shuttlePreferences.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <DirectionsBus sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No shuttle preferences yet</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Guests will select their preferred shuttle times when entering flight details
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {shuttlePreferences.map((pref) => (
                    <Paper 
                      key={pref.time} 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: '#f9f9f9',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Chip 
                          icon={<AccessTime />}
                          label={formatTime(pref.time)} 
                          sx={{ bgcolor: '#4CAF50', color: 'white', fontWeight: 600 }}
                        />
                        <Chip 
                          label={`${pref.guests.length} guest${pref.guests.length !== 1 ? 's' : ''}`}
                          size="small"
                          sx={{ ml: 1, bgcolor: '#4CAF5010', color: '#4CAF50' }}
                        />
                      </Box>
                      <Stack spacing={1}>
                        {pref.guests.map((guest) => (
                          <Box 
                            key={guest.id} 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              p: 1,
                              bgcolor: 'rgba(0,0,0,0.02)',
                              borderRadius: 1,
                            }}
                          >
                            <Typography sx={{ fontWeight: 500, flex: 1, color: '#1a1a1a' }}>{guest.name}</Typography>
                            {guest.note && (
                              <Typography variant="caption" sx={{ color: '#6a6a6a', ml: 2 }}>
                                {guest.note}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </TabPanel>

          {/* Checklist Progress Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ px: 2 }}>
              {checklistStats.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No checklist data yet</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Guests who RSVP'd "yes" can complete their travel checklist from the Travel Details page
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {checklistStats.map((guest) => {
                    const progress = (guest.completedItems.length / guest.totalItems) * 100;
                    return (
                      <Paper 
                        key={guest.guestId} 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: '#f9f9f9',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 500, color: '#1a1a1a' }}>{guest.guestName}</Typography>
                            <Typography variant="caption" sx={{ color: '#6a6a6a' }}>{guest.guestEmail}</Typography>
                          </Box>
                          <Chip 
                            label={`${guest.completedItems.length}/${guest.totalItems}`}
                            size="small"
                            color={progress === 100 ? 'success' : progress > 50 ? 'warning' : 'default'}
                          />
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'rgba(0,0,0,0.08)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: progress === 100 ? '#4CAF50' : progress > 50 ? '#FF9800' : '#DE3F5E',
                              borderRadius: 4,
                            }
                          }}
                        />
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {THAILAND_CHECKLIST.map((item) => (
                            <Chip
                              key={item.key}
                              label={item.label}
                              size="small"
                              sx={{
                                fontSize: '0.8rem',
                                height: 28,
                                bgcolor: guest.completedItems.includes(item.key) ? '#4CAF5030' : 'rgba(0,0,0,0.08)',
                                color: guest.completedItems.includes(item.key) ? '#2E7D32' : '#4a4a4a',
                                textDecoration: guest.completedItems.includes(item.key) ? 'line-through' : 'none',
                                fontWeight: 500,
                              }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </TabPanel>
        </Paper>
      </Stack>
    </Box>
  );
}









