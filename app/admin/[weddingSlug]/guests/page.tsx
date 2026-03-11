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
  Download,
} from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import { getAllRSVPs, deleteRSVP, getCustomQuestions } from '@/lib/supabase/rsvp-service';
import { CustomQuestion, RSVPCustomQuestionStep } from '@/lib/supabase/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import * as XLSX from 'xlsx';
import { SECONDARY_BUTTON_SX } from '@/lib/constants/form-styles';
import { toast } from 'sonner';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

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
  custom_answers?: Record<string, any> | null;
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
  const { isViewOnly } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<RSVPData[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const [allCustomQuestions, setAllCustomQuestions] = useState<CustomQuestion[]>([]);

  const [weddingStatus, setWeddingStatus] = useState<'draft' | 'live'>('draft');

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);

      if (wedding) {
        setWeddingId(wedding.id);
        setWeddingStatus(wedding.status as 'draft' | 'live');
        // Use weddingSlug instead of wedding.id since RSVPs are stored with slug as wedding_id
        const rsvpData = await getAllRSVPs(weddingSlug);
        setRsvps((rsvpData || []) as RSVPData[]);

        // Fetch custom questions for Extra Details tab
        try {
          const customSteps = await getCustomQuestions(weddingSlug);
          const flatQuestions = customSteps.flatMap(s => s.questions);
          setAllCustomQuestions(flatQuestions);
        } catch (e) {
          console.error('Error fetching custom questions:', e);
        }
      } else {
        toast.error(`No wedding found with ID: ${weddingSlug}`);
        setError(`No wedding found with ID: ${weddingSlug}`);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error(`Failed to load data: ${(err as Error).message || 'Unknown error'}`);
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

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const handleDeleteClick = async (id: string) => {
    if (isViewOnly) return;
    setConfirmDialog({
      open: true,
      message: 'Are you sure you want to delete this RSVP?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await deleteRSVP(id);
          setRsvps(prev => prev.filter(r => r.id !== id));
          toast.success('RSVP deleted successfully');
        } catch (err) {
          console.error('Error deleting RSVP:', err);
          toast.error('Failed to delete RSVP');
        }
      },
    });
  };

  const handleDownloadMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  const prepareRSVPDataForExport = (data: RSVPData[]) => {
    return data.map(r => {
      const base: Record<string, any> = {
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
      };
      // Add custom question columns dynamically
      allCustomQuestions.forEach(q => {
        base[q.label] = r.custom_answers?.[q.id] || '';
      });
      return base;
    });
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
      case 7: return rsvps.filter(r => r.custom_answers && Object.keys(r.custom_answers).length > 0);
      default: return rsvps;
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading guest responses..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: alpha('#EF4444', 0.1), textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={4} sx={{ pt: { xs: 6, lg: 0 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
              Guest Responses
            </Typography>
            <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
              Track RSVPs, dietary restrictions, and guest preferences
            </Typography>
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadMenuOpen}
              sx={SECONDARY_BUTTON_SX}
            >
              Export Data
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
            sx={{
              flex: '1 1 200px',
              minWidth: 180,
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              bgcolor: 'white',
              cursor: 'pointer',
              border: activeTab === 0 ? '2px solid #DE3F5E' : '2px solid transparent',
              transition: 'border 0.2s ease'
            }}
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
            sx={{
              flex: '1 1 200px',
              minWidth: 180,
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              bgcolor: 'white',
              cursor: 'pointer',
              border: activeTab === 1 ? '2px solid #DE3F5E' : '2px solid transparent',
              transition: 'border 0.2s ease'
            }}
            onClick={() => setActiveTab(1)}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#10B981', 0.1), color: '#10B981' }}>
                <CheckCircle />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{stats.totalGuests}</Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Attending</Typography>
                <Typography variant="caption" sx={{ color: '#9a9a9a', fontSize: '0.7rem', display: 'block', mt: 0.25 }}>
                  including plus-ones
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: '1 1 200px',
              minWidth: 180,
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              bgcolor: 'white',
              cursor: 'pointer',
              border: activeTab === 3 ? '2px solid #DE3F5E' : '2px solid transparent',
              transition: 'border 0.2s ease'
            }}
            onClick={() => setActiveTab(3)}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B' }}>
                <HelpOutline />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{stats.maybe}</Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Maybe</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: '1 1 200px',
              minWidth: 180,
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              bgcolor: 'white',
              cursor: 'pointer',
              border: activeTab === 2 ? '2px solid #DE3F5E' : '2px solid transparent',
              transition: 'border 0.2s ease'
            }}
            onClick={() => setActiveTab(2)}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#EF4444', 0.1), color: '#EF4444' }}>
                <Cancel />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{stats.notAttending}</Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Not Attending</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Response Rate Progress - Show for all RSVP related tabs (0-3) */}
        {stats.total > 0 && activeTab <= 3 && (
          <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: alpha('#fff', 0.95) }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#1a1a1a' }}>
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
            <Tab label={`Attending (${stats.totalGuests})`} />
            <Tab label={`Not Attending (${stats.notAttending})`} />
            <Tab label={`Maybe (${stats.maybe})`} />
            <Tab label="Food Preferences" />
            <Tab label="Dietary Restrictions" />
            <Tab label="Song Requests" />
            {allCustomQuestions.length > 0 && <Tab label="Extra Details" />}
          </Tabs>

          {getFilteredRSVPs().length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Guest</TableCell>
                    {activeTab <= 3 && (
                      <>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Party Size</TableCell>
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
                    {activeTab === 7 && allCustomQuestions.map(q => (
                      <TableCell key={q.id} sx={{ fontWeight: 600, color: '#1a1a1a' }}>{q.label}</TableCell>
                    ))}
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
                              <Typography variant="subtitle2" sx={{ color: '#1a1a1a' }}>
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
                                sx={{
                                  height: 32,
                                  px: 1,
                                  bgcolor: alpha(getAttendingColor(rsvp.attending), 0.1),
                                  color: getAttendingColor(rsvp.attending),
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  borderRadius: '16px',
                                  '& .MuiChip-icon': {
                                    color: 'inherit',
                                    fontSize: 20,
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                                {rsvp.guest_count}
                              </Typography>
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
                                  sx={{
                                    height: 28,
                                    bgcolor: alpha('#DE3F5E', 0.1),
                                    color: '#DE3F5E',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
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
                              {rsvp.song_request}
                            </Typography>
                          </TableCell>
                        )}

                        {activeTab === 7 && allCustomQuestions.map(q => (
                          <TableCell key={q.id}>
                            <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                              {rsvp.custom_answers?.[q.id] || '-'}
                            </Typography>
                          </TableCell>
                        ))}

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
                          <TableCell colSpan={activeTab === 7 ? allCustomQuestions.length + 3 : activeTab <= 3 ? 6 : 4} sx={{ bgcolor: alpha('#DE3F5E', 0.02), py: 2 }}>
                            <Box sx={{ px: 2 }}>
                              <Box sx={{ display: 'flex', gap: 4, rowGap: 3, flexWrap: 'wrap' }}>
                                {rsvp.food_preference && rsvp.food_preference.length > 0 && (
                                  <Box sx={{ minWidth: 200 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Food Preferences
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                      {rsvp.food_preference.map((pref, i) => (
                                        <Chip
                                          key={i}
                                          label={pref}
                                          sx={{
                                            height: 28,
                                            bgcolor: '#e0e0e0',
                                            color: '#1a1a1a',
                                            fontWeight: 600,
                                            fontSize: '0.8rem',
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                )}

                                <Box sx={{ minWidth: 200 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                    Guest Contact
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                    {rsvp.guest?.email || '-'}
                                  </Typography>
                                  {rsvp.guest?.phone && (
                                    <Typography variant="body2" sx={{ color: '#4a4a4a', fontSize: '0.85rem' }}>
                                      {rsvp.guest.phone}
                                    </Typography>
                                  )}
                                </Box>

                                <Box sx={{ minWidth: 120 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                    Party Size
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                    {rsvp.guest_count} person{rsvp.guest_count !== 1 ? 's' : ''}
                                  </Typography>
                                </Box>

                                {rsvp.guest?.wedding_side && (
                                  <Box sx={{ minWidth: 150 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Wedding Side
                                    </Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                      <Chip
                                        label={rsvp.guest.wedding_side === 'bride' ? "Bride's Side" : rsvp.guest.wedding_side === 'groom' ? "Groom's Side" : 'Both'}
                                        sx={{
                                          height: 28,
                                          bgcolor: alpha('#6B7280', 0.1),
                                          color: '#6B7280',
                                          fontWeight: 600,
                                          fontSize: '0.8rem',
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                )}

                                <Box sx={{ minWidth: 200 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                    Responded Date
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                    {new Date(rsvp.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Typography>
                                </Box>

                                {rsvp.dietary_restrictions && (
                                  <Box sx={{ minWidth: 200 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Dietary Restrictions
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                      {rsvp.dietary_restrictions}
                                    </Typography>
                                  </Box>
                                )}

                                {rsvp.song_request && (
                                  <Box sx={{ minWidth: 200 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Song Request
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                      🎵 {rsvp.song_request}
                                    </Typography>
                                  </Box>
                                )}

                                {rsvp.special_message && (
                                  <Box sx={{ minWidth: 300, maxWidth: 500 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Special Message
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5, fontStyle: 'italic' }}>
                                      "{rsvp.special_message}"
                                    </Typography>
                                  </Box>
                                )}

                                {rsvp.maybe_comment && rsvp.attending === 'maybe' && (
                                  <Box sx={{ minWidth: 200 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Comment
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                      {rsvp.maybe_comment}
                                    </Typography>
                                  </Box>
                                )}

                                {rsvp.plus_one && rsvp.plus_one_name && (
                                  <Box sx={{ minWidth: 200 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                      Plus One
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                      {rsvp.plus_one_name}
                                    </Typography>
                                    {rsvp.plus_one_email && (
                                      <Typography variant="body2" sx={{ color: '#4a4a4a', fontSize: '0.85rem' }}>
                                        {rsvp.plus_one_email}
                                      </Typography>
                                    )}
                                  </Box>
                                )}

                                {rsvp.custom_answers && Object.keys(rsvp.custom_answers).length > 0 && (
                                  <Box sx={{ minWidth: 200, width: '100%', mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#DE3F5E', mb: 1, display: 'block' }}>
                                      Custom Answers
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                      {allCustomQuestions.map(q => {
                                        const answer = rsvp.custom_answers?.[q.id];
                                        if (!answer) return null;
                                        return (
                                          <Box key={q.id} sx={{ minWidth: 150 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a' }}>
                                              {q.label}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#1a1a1a', mt: 0.5 }}>
                                              {answer}
                                            </Typography>
                                          </Box>
                                        );
                                      })}
                                    </Box>
                                  </Box>
                                )}
                              </Box>
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
            <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
              <People sx={{ fontSize: 80, color: alpha('#DE3F5E', 0.1), mb: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1.5 }}>
                {weddingStatus === 'live' ? 'No Responses Yet' : 'Website Not Published'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a', maxWidth: 500, mx: 'auto', mb: 4 }}>
                {weddingStatus === 'live'
                  ? 'Your guests haven\'t started RSVPing yet. Once they do, their responses will appear here automatically.'
                  : 'Your wedding website is currently in draft mode. Publish your website to start collecting RSVPs from your guests.'}
              </Typography>
              {weddingStatus === 'draft' && (
                <Typography variant="body2" sx={{ color: '#DE3F5E', fontWeight: 600 }}>
                  Tip: You can publish your website using the button in the bottom left sidebar.
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </Stack>

      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
}
