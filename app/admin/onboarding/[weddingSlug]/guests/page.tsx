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
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useState, useEffect, use, Fragment } from 'react';
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
  Delete,
  Edit,
  Download,
} from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import { getAllRSVPs, deleteRSVP } from '@/lib/supabase/rsvp-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import * as XLSX from 'xlsx';

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
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);

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

  const handleDeleteClick = async (id: string) => {
    if (confirm('Are you sure you want to delete this RSVP?')) {
      try {
        await deleteRSVP(id);
        setRsvps(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        console.error('Error deleting RSVP:', err);
        alert('Failed to delete RSVP');
      }
    }
  };

  const handleDownloadMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  const prepareRSVPDataForExport = (data: RSVPData[]) => {
    return data.map(r => ({
      'Guest Name': r.guest?.name || 'Unknown',
      'Email': r.guest?.email || '',
      'Phone': r.guest?.phone || '',
      'Attending': r.attending,
      'Party Size': r.guest_count,
      'Plus One': r.plus_one ? 'Yes' : 'No',
      'Plus One Name': r.plus_one_name || '',
      'Plus One Email': r.plus_one_email || '',
      'Side': r.guest?.wedding_side || '',
      'Food Preferences': r.food_preference?.join(', ') || '',
      'Dietary Restrictions': r.dietary_restrictions || '',
      'Song Request': r.song_request || '',
      'Special Message': r.special_message || '',
      'Comment': r.maybe_comment || '',
      'Responded At': new Date(r.created_at).toLocaleString(),
    }));
  };

  const handleExportCSV = (filterType: 'all' | 'attending' | 'not_attending' | 'maybe') => {
    let dataToExport = rsvps;
    if (filterType === 'attending') dataToExport = rsvps.filter(r => r.attending === 'yes');
    if (filterType === 'not_attending') dataToExport = rsvps.filter(r => r.attending === 'no');
    if (filterType === 'maybe') dataToExport = rsvps.filter(r => r.attending === 'maybe');

    const formattedData = prepareRSVPDataForExport(dataToExport);
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
    
    const fileName = `wedding-rsvps-${filterType}-${new Date().toISOString().split('T')[0]}.csv`;
    XLSX.writeFile(wb, fileName);
    handleDownloadMenuClose();
  };

  const handleExportExcelAll = () => {
    const allData = prepareRSVPDataForExport(rsvps);
    const attendingData = prepareRSVPDataForExport(rsvps.filter(r => r.attending === 'yes'));
    const notAttendingData = prepareRSVPDataForExport(rsvps.filter(r => r.attending === 'no'));
    const maybeData = prepareRSVPDataForExport(rsvps.filter(r => r.attending === 'maybe'));

    const wb = XLSX.utils.book_new();
    
    if (allData.length > 0) {
      const wsAll = XLSX.utils.json_to_sheet(allData);
      XLSX.utils.book_append_sheet(wb, wsAll, "All RSVPs");
    }
    
    if (attendingData.length > 0) {
      const wsAttending = XLSX.utils.json_to_sheet(attendingData);
      XLSX.utils.book_append_sheet(wb, wsAttending, "Attending");
    }

    if (notAttendingData.length > 0) {
      const wsNotAttending = XLSX.utils.json_to_sheet(notAttendingData);
      XLSX.utils.book_append_sheet(wb, wsNotAttending, "Not Attending");
    }

    if (maybeData.length > 0) {
      const wsMaybe = XLSX.utils.json_to_sheet(maybeData);
      XLSX.utils.book_append_sheet(wb, wsMaybe, "Maybe");
    }

    const fileName = `wedding-rsvps-complete-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    handleDownloadMenuClose();
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
      case 4: return rsvps.filter(r => r.food_preference && r.food_preference.length > 0);
      case 5: return rsvps.filter(r => r.dietary_restrictions && r.dietary_restrictions.trim() !== '');
      case 6: return rsvps.filter(r => r.song_request && r.song_request.trim() !== '');
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
              Guest Responses
            </Typography>
            <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
              Track RSVPs, dietary restrictions, and guest preferences
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              onClick={handleDownloadMenuOpen}
              sx={{
                position: 'fixed',
                top: { xs: 16, md: 24 },
                right: { xs: 96, md: 220 }, // Increased offset for desktop to avoid overlap
                zIndex: 1000,
                borderColor: '#DE3F5E',
                color: '#DE3F5E',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: { xs: '50%', md: '28px' },
                minWidth: { xs: 64, md: 'auto' },
                width: { xs: 64, md: 'auto' },
                height: { xs: 64, md: 56 },
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                px: { xs: 0, md: 4 },
                fontSize: { xs: '1.1rem', md: '1.15rem' },
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#C8365A',
                  bgcolor: 'rgba(222, 63, 94, 0.05)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeIn 0.5s ease-out',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(-10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <Download sx={{ 
                fontSize: { xs: 28, md: 32 }, 
                mr: { xs: 0, md: 1.5 } 
              }} />
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                Export Data
              </Box>
            </Button>
            <Menu
              anchorEl={downloadMenuAnchor}
              open={Boolean(downloadMenuAnchor)}
              onClose={handleDownloadMenuClose}
              PaperProps={{
                sx: { borderRadius: '12px', mt: 1, minWidth: 200 }
              }}
            >
              <MenuItem onClick={handleExportExcelAll}>
                <ListItemIcon><Download fontSize="small" sx={{ color: '#DE3F5E' }} /></ListItemIcon>
                <ListItemText>Export All (Excel)</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportCSV('all')}>
                <ListItemIcon><Download fontSize="small" /></ListItemIcon>
                <ListItemText>All RSVPs (CSV)</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportCSV('attending')}>
                <ListItemIcon><CheckCircle fontSize="small" sx={{ color: '#10B981' }} /></ListItemIcon>
                <ListItemText>Attending (CSV)</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportCSV('not_attending')}>
                <ListItemIcon><Cancel fontSize="small" sx={{ color: '#EF4444' }} /></ListItemIcon>
                <ListItemText>Not Attending (CSV)</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportCSV('maybe')}>
                <ListItemIcon><HelpOutline fontSize="small" sx={{ color: '#F59E0B' }} /></ListItemIcon>
                <ListItemText>Maybe (CSV)</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Card 
            sx={{ flex: '1 1 200px', minWidth: 180, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', bgcolor: 'white', cursor: 'pointer' }}
            onClick={() => setActiveTab(0)}
          >
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

          <Card 
            sx={{ flex: '1 1 200px', minWidth: 180, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', bgcolor: 'white', cursor: 'pointer' }}
            onClick={() => setActiveTab(1)}
          >
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

          <Card 
            sx={{ flex: '1 1 200px', minWidth: 180, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', bgcolor: 'white', cursor: 'pointer' }}
            onClick={() => setActiveTab(3)}
          >
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

          <Card 
            sx={{ flex: '1 1 200px', minWidth: 180, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', bgcolor: 'white', cursor: 'pointer' }}
            onClick={() => setActiveTab(2)}
          >
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

        {/* Response Rate Progress - Show for all RSVP related tabs (0-3) */}
        {stats.total > 0 && activeTab <= 3 && (
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

        {/* Tab Content */}
        {/* Summary content for tabs 4, 5, 6 is removed as per user request to show data in rows */}

        {/* Guest List Table */}
        <Paper sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: alpha('#fff', 0.95) }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 56,
                color: '#4a4a4a', // Default color for non-selected tabs
                '&:hover': {
                  color: '#1a1a1a',
                },
              },
              '& .Mui-selected': {
                color: '#DE3F5E !important', // Selected color
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#DE3F5E',
              },
            }}
          >
            <Tab label={`RSVPs (${stats.total})`} />
            <Tab label={`Attending (${stats.attending})`} />
            <Tab label={`Not Attending (${stats.notAttending})`} />
            <Tab label={`Maybe (${stats.maybe})`} />
            <Tab label="Food Preferences" />
            <Tab label="Dietary Restrictions" />
            <Tab label="Song Requests" />
          </Tabs>

          {getFilteredRSVPs().length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#DE3F5E', 0.05) }}>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Guest</TableCell>
                    {activeTab <= 3 && (
                      <>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Party Size</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Side</TableCell>
                      </>
                    )}
                    {activeTab === 4 && (
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Food Preferences</TableCell>
                    )}
                    {activeTab === 5 && (
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Dietary Restrictions</TableCell>
                    )}
                    {activeTab === 6 && (
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Song Request</TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', width: 50 }}></TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', width: 50 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredRSVPs().map((rsvp) => (
                    <Fragment key={rsvp.id}>
                      <TableRow 
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
                        
                        {activeTab <= 3 && (
                          <>
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
                          </>
                        )}

                        {activeTab === 4 && (
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {rsvp.food_preference && rsvp.food_preference.map((pref, i) => (
                                <Chip 
                                  key={i} 
                                  label={pref} 
                                  size="small" 
                                  sx={{
                                    bgcolor: alpha('#DE3F5E', 0.1),
                                    color: '#DE3F5E',
                                    fontWeight: 600,
                                  }}
                                />
                              ))}
                            </Box>
                          </TableCell>
                        )}

                        {activeTab === 5 && (
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                              {rsvp.dietary_restrictions}
                            </Typography>
                          </TableCell>
                        )}

                        {activeTab === 6 && (
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                              🎵 {rsvp.song_request}
                            </Typography>
                          </TableCell>
                        )}

                        <TableCell>
                          <Tooltip title="Delete RSVP">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(rsvp.id);
                              }}
                              sx={{ 
                                color: '#EF4444',
                                '&:hover': { bgcolor: alpha('#EF4444', 0.1) }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            {expandedRows.has(rsvp.id) ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(rsvp.id) && (
                        <TableRow>
                          <TableCell colSpan={activeTab <= 3 ? 7 : 4} sx={{ bgcolor: alpha('#DE3F5E', 0.02), py: 2 }}>
                            <Box sx={{ px: 2 }}>
                              <Stack spacing={2}>
                                {rsvp.food_preference && rsvp.food_preference.length > 0 && (
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Food Preferences
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                      {rsvp.food_preference.map((pref, i) => (
                                        <Chip 
                                          key={i} 
                                          label={pref} 
                                          size="small" 
                                          sx={{
                                            bgcolor: '#e0e0e0', // Grey background
                                            color: '#1a1a1a',   // Blackish text
                                            fontWeight: 500,
                                          }}
                                        />
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
                                
                                {/* Show all additional data */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mt: 1, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
                                  {rsvp.plus_one && rsvp.plus_one_name && (
                                    <Box>
                                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                        Plus One
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                        {rsvp.plus_one_name}
                                      </Typography>
                                      {rsvp.plus_one_email && (
                                        <Typography variant="body2" sx={{ color: '#4a4a4a', fontSize: '0.85rem' }}>
                                          {rsvp.plus_one_email}
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                  
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Guest Contact
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                      {rsvp.guest?.email || '-'}
                                    </Typography>
                                    {rsvp.guest?.phone && (
                                      <Typography variant="body2" sx={{ color: '#4a4a4a', fontSize: '0.85rem' }}>
                                        {rsvp.guest.phone}
                                      </Typography>
                                    )}
                                  </Box>

                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Party Size
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                      {rsvp.guest_count} person{rsvp.guest_count !== 1 ? 's' : ''}
                                    </Typography>
                                  </Box>

                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Responded Date
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                      {new Date(rsvp.created_at).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </Typography>
                                  </Box>
                                </Box>

                              </Stack>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
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
                {activeTab > 3 ? 'No entries found for this category' : 'Guest responses will appear here once they start RSVPing'}
              </Typography>
            </Box>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
