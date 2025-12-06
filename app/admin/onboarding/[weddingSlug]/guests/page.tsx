'use client';

import {
  Box,
  Container,
  Typography,
  Stack,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import {
  CheckCircle,
  Cancel,
  HelpOutline,
  People,
  Restaurant,
  Email,
  Phone,
  ExpandMore,
  ExpandLess,
  MusicNote,
} from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import { getAllRSVPs } from '@/lib/supabase/rsvp-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface RSVPData {
  id: string;
  attending: 'yes' | 'no' | 'maybe';
  guest_count: number;
  plus_one: boolean;
  plus_one_name: string | null;
  plus_one_email: string | null;
  food_preference: string[] | null;
  dietary_restrictions: string | null;
  song_request: string | null;
  special_message: string | null;
  maybe_comment: string | null;
  created_at: string;
  guest: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    wedding_side: 'bride' | 'groom' | 'both' | null;
    avatar_color: string | null;
    avatar_svg: string | null;
  } | null;
}

export default function GuestsPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<RSVPData[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      
      if (wedding) {
        setWeddingId(wedding.id);
        // Use weddingSlug instead of wedding.id since RSVPs are stored with slug as wedding_id
        const rsvpData = await getAllRSVPs(weddingSlug);
        setRsvps(rsvpData || []);
      } else {
        setError(`No wedding found with ID: ${weddingSlug}`);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${(err as Error).message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Calculate stats
  const stats = {
    total: rsvps.length,
    attending: rsvps.filter(r => r.attending === 'yes').length,
    notAttending: rsvps.filter(r => r.attending === 'no').length,
    maybe: rsvps.filter(r => r.attending === 'maybe').length,
    totalGuests: rsvps.reduce((acc, r) => acc + (r.attending === 'yes' ? r.guest_count : 0), 0),
    withDietaryRestrictions: rsvps.filter(r => r.dietary_restrictions && r.dietary_restrictions.trim() !== '').length,
    withSongRequests: rsvps.filter(r => r.song_request && r.song_request.trim() !== '').length,
  };

  // Get dietary restrictions summary
  const dietaryRestrictions = rsvps
    .filter(r => r.dietary_restrictions && r.dietary_restrictions.trim() !== '')
    .map(r => ({
      name: r.guest?.name || 'Unknown',
      restrictions: r.dietary_restrictions!,
    }));

  // Get food preferences summary
  const foodPreferencesCounts: Record<string, number> = {};
  rsvps.forEach(r => {
    if (r.food_preference && Array.isArray(r.food_preference)) {
      r.food_preference.forEach(pref => {
        foodPreferencesCounts[pref] = (foodPreferencesCounts[pref] || 0) + 1;
      });
    }
  });

  // Get song requests
  const songRequests = rsvps
    .filter(r => r.song_request && r.song_request.trim() !== '')
    .map(r => ({
      name: r.guest?.name || 'Unknown',
      song: r.song_request!,
    }));

  const getAttendingColor = (attending: string) => {
    switch (attending) {
      case 'yes': return '#10B981';
      case 'no': return '#EF4444';
      case 'maybe': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getAttendingIcon = (attending: string) => {
    switch (attending) {
      case 'yes': return <CheckCircle sx={{ color: '#10B981' }} />;
      case 'no': return <Cancel sx={{ color: '#EF4444' }} />;
      case 'maybe': return <HelpOutline sx={{ color: '#F59E0B' }} />;
      default: return <HelpOutline sx={{ color: '#6B7280' }} />;
    }
  };

  // Filter RSVPs based on active tab
  const getFilteredRSVPs = () => {
    switch (activeTab) {
      case 1: return rsvps.filter(r => r.attending === 'yes');
      case 2: return rsvps.filter(r => r.attending === 'no');
      case 3: return rsvps.filter(r => r.attending === 'maybe');
      default: return rsvps;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner message="Loading guest responses..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: alpha('#EF4444', 0.1), textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            Guest Responses
          </Typography>
          <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
            Track RSVPs, dietary restrictions, and guest preferences
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 200px', minWidth: 180, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', bgcolor: 'white' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#DE3F5E', 0.1), color: '#DE3F5E' }}>
                <People />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{stats.total}</Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Total Responses</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: 180, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', bgcolor: 'white' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#10B981', 0.1), color: '#10B981' }}>
                <CheckCircle />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{stats.attending}</Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Attending</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: 180, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', bgcolor: 'white' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B' }}>
                <HelpOutline />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{stats.maybe}</Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Maybe</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: 180, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', bgcolor: 'white' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#EF4444', 0.1), color: '#EF4444' }}>
                <Cancel />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{stats.notAttending}</Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Not Attending</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: 180, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: '2px solid #DE3F5E', bgcolor: 'white' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#DE3F5E', color: 'white' }}>
                <People />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#DE3F5E' }}>{stats.totalGuests}</Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Total Guests Coming</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Response Rate Progress */}
        {stats.total > 0 && (
          <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: alpha('#fff', 0.95) }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
              Response Breakdown
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, height: 12, borderRadius: 6, overflow: 'hidden', bgcolor: '#f5f5f5' }}>
              {stats.attending > 0 && (
                <Box 
                  sx={{ 
                    width: `${(stats.attending / stats.total) * 100}%`, 
                    bgcolor: '#10B981',
                    transition: 'width 0.3s ease'
                  }} 
                />
              )}
              {stats.maybe > 0 && (
                <Box 
                  sx={{ 
                    width: `${(stats.maybe / stats.total) * 100}%`, 
                    bgcolor: '#F59E0B',
                    transition: 'width 0.3s ease'
                  }} 
                />
              )}
              {stats.notAttending > 0 && (
                <Box 
                  sx={{ 
                    width: `${(stats.notAttending / stats.total) * 100}%`, 
                    bgcolor: '#EF4444',
                    transition: 'width 0.3s ease'
                  }} 
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10B981' }} />
                <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                  Attending ({Math.round((stats.attending / stats.total) * 100)}%)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                  Maybe ({Math.round((stats.maybe / stats.total) * 100)}%)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EF4444' }} />
                <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                  Not Attending ({Math.round((stats.notAttending / stats.total) * 100)}%)
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Dietary Restrictions Summary */}
        {dietaryRestrictions.length > 0 && (
          <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: alpha('#fff', 0.95) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#DE3F5E', 0.1), color: '#DE3F5E' }}>
                <Restaurant />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                Dietary Restrictions ({dietaryRestrictions.length})
              </Typography>
            </Box>
            <Stack spacing={1.5}>
              {dietaryRestrictions.map((item, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    p: 2, 
                    borderRadius: '12px', 
                    bgcolor: alpha('#DE3F5E', 0.05),
                    alignItems: 'flex-start'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, minWidth: 120, color: '#1a1a1a' }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                    {item.restrictions}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Food Preferences Summary */}
        {Object.keys(foodPreferencesCounts).length > 0 && (
          <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: alpha('#fff', 0.95) }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
              Food Preferences
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {Object.entries(foodPreferencesCounts).map(([pref, count]) => (
                <Chip
                  key={pref}
                  label={`${pref}: ${count}`}
                  sx={{
                    bgcolor: alpha('#DE3F5E', 0.1),
                    color: '#DE3F5E',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                />
              ))}
            </Box>
          </Paper>
        )}

        {/* Song Requests */}
        {songRequests.length > 0 && (
          <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: alpha('#fff', 0.95) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6' }}>
                <MusicNote />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                Song Requests ({songRequests.length})
              </Typography>
            </Box>
            <Stack spacing={1}>
              {songRequests.map((item, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    p: 2, 
                    borderRadius: '12px', 
                    bgcolor: alpha('#8B5CF6', 0.05)
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, minWidth: 120, color: '#1a1a1a' }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
                    🎵 {item.song}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Guest List Table */}
        <Paper sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: alpha('#fff', 0.95) }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 56,
              },
              '& .Mui-selected': {
                color: '#DE3F5E',
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#DE3F5E',
              },
            }}
          >
            <Tab label={`All (${stats.total})`} />
            <Tab label={`Attending (${stats.attending})`} />
            <Tab label={`Not Attending (${stats.notAttending})`} />
            <Tab label={`Maybe (${stats.maybe})`} />
          </Tabs>

          {getFilteredRSVPs().length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#DE3F5E', 0.05) }}>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Guest</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Party Size</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Side</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', width: 50 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredRSVPs().map((rsvp) => (
                    <>
                      <TableRow 
                        key={rsvp.id}
                        sx={{ 
                          '&:hover': { bgcolor: alpha('#DE3F5E', 0.02) },
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleRowExpand(rsvp.id)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {rsvp.guest?.avatar_svg ? (
                              <Box
                                dangerouslySetInnerHTML={{ __html: rsvp.guest.avatar_svg }}
                                sx={{ 
                                  width: 40, 
                                  height: 40, 
                                  borderRadius: '50%', 
                                  overflow: 'hidden',
                                  bgcolor: rsvp.guest?.avatar_color || '#DE3F5E'
                                }}
                              />
                            ) : (
                              <Avatar sx={{ bgcolor: rsvp.guest?.avatar_color || '#DE3F5E' }}>
                                {rsvp.guest?.name?.[0] || '?'}
                              </Avatar>
                            )}
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                {rsvp.guest?.name || 'Unknown'}
                              </Typography>
                              {rsvp.plus_one && rsvp.plus_one_name && (
                                <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                                  + {rsvp.plus_one_name}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            {rsvp.guest?.email && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Email sx={{ fontSize: 14, color: '#6a6a6a' }} />
                                <Typography variant="caption" sx={{ color: '#4a4a4a' }}>
                                  {rsvp.guest.email}
                                </Typography>
                              </Box>
                            )}
                            {rsvp.guest?.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Phone sx={{ fontSize: 14, color: '#6a6a6a' }} />
                                <Typography variant="caption" sx={{ color: '#4a4a4a' }}>
                                  {rsvp.guest.phone}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getAttendingIcon(rsvp.attending)}
                            label={rsvp.attending === 'yes' ? 'Attending' : rsvp.attending === 'no' ? 'Not Attending' : 'Maybe'}
                            size="small"
                            sx={{
                              bgcolor: alpha(getAttendingColor(rsvp.attending), 0.1),
                              color: getAttendingColor(rsvp.attending),
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                color: 'inherit',
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                            {rsvp.guest_count}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {rsvp.guest?.wedding_side && (
                            <Chip
                              label={rsvp.guest.wedding_side === 'bride' ? "Bride's Side" : rsvp.guest.wedding_side === 'groom' ? "Groom's Side" : 'Both'}
                              size="small"
                              sx={{
                                bgcolor: alpha('#6B7280', 0.1),
                                color: '#6B7280',
                                fontWeight: 500,
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            {expandedRows.has(rsvp.id) ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(rsvp.id) && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ bgcolor: alpha('#DE3F5E', 0.02), py: 2 }}>
                            <Box sx={{ px: 2 }}>
                              <Stack spacing={2}>
                                {rsvp.food_preference && rsvp.food_preference.length > 0 && (
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Food Preferences
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                      {rsvp.food_preference.map((pref, i) => (
                                        <Chip key={i} label={pref} size="small" />
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                                {rsvp.dietary_restrictions && (
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Dietary Restrictions
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                      {rsvp.dietary_restrictions}
                                    </Typography>
                                  </Box>
                                )}
                                {rsvp.song_request && (
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Song Request
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                      🎵 {rsvp.song_request}
                                    </Typography>
                                  </Box>
                                )}
                                {rsvp.special_message && (
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Special Message
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5, fontStyle: 'italic' }}>
                                      "{rsvp.special_message}"
                                    </Typography>
                                  </Box>
                                )}
                                {rsvp.maybe_comment && rsvp.attending === 'maybe' && (
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Comment
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                      {rsvp.maybe_comment}
                                    </Typography>
                                  </Box>
                                )}
                                <Typography variant="caption" sx={{ color: '#9a9a9a' }}>
                                  Responded on {new Date(rsvp.created_at).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              </Stack>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <People sx={{ fontSize: 64, color: alpha('#DE3F5E', 0.3), mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#1a1a1a', mb: 1 }}>
                No Responses Yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Guest responses will appear here once they start RSVPing
              </Typography>
            </Box>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
