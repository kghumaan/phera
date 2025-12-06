'use client';

import {
  Box,
  Container,
  Typography,
  TextField,
  Stack,
  Paper,
  Button,
  Alert,
  Grid,
  alpha,
  IconButton,
  Chip,
  Snackbar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Check, ContentCopy, Launch, CheckCircle, Edit, People, Event, LocationOn, CalendarMonth } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Consistent TextField styling with enhanced sizes
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    bgcolor: 'white',
    fontSize: '1.1rem',
    '& input': {
      py: 2.5,
      fontSize: '1.1rem',
    },
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: '#DE3F5E',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DE3F5E',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#4a4a4a',
    fontSize: '1rem',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#DE3F5E',
  },
  '& .MuiInputBase-input': {
    color: '#1a1a1a',
  },
  '& .MuiFormHelperText-root': {
    color: '#6a6a6a',
    fontSize: '0.875rem',
  },
};

interface WeddingData {
  id: string;
  couple_name: string;
  wedding_date_display: string;
  venue_name: string;
  venue_location: string;
  venue_flag: string;
  status: 'draft' | 'live';
}

export default function OverviewPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('error');
  const [weddingStatus, setWeddingStatus] = useState<'draft' | 'live'>('draft');
  const [editSlugModalOpen, setEditSlugModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);
  const [weddingData, setWeddingData] = useState<WeddingData | null>(null);

  useEffect(() => {
    loadWeddingData();
  }, [weddingSlug]);

  const showToast = (message: string, severity: 'error' | 'success' | 'info' | 'warning' = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const loadWeddingData = async () => {
    console.log('🔍 Loading wedding data for slug:', weddingSlug);
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      
      if (wedding) {
        setWeddingId(wedding.id);
        // Normalize status: convert 'preview' to 'draft', default to 'draft' if invalid or missing
        const normalizedStatus = (wedding.status === 'live') ? 'live' : 'draft';
        setWeddingStatus(normalizedStatus);
        setWeddingData({
          id: wedding.id,
          couple_name: wedding.couple_name || '',
          wedding_date_display: wedding.wedding_date_display || '',
          venue_name: wedding.venue_name || '',
          venue_location: wedding.venue_location || '',
          venue_flag: wedding.venue_flag || '',
          status: normalizedStatus,
        });
        
        // If status was 'preview' or invalid, update it in the database
        if (wedding.status !== 'live' && wedding.status !== 'draft') {
          await weddingService.updateWedding(wedding.id, { status: 'draft' });
        }
      } else {
        setError(`No wedding found with ID: ${weddingSlug}`);
        showToast(`No wedding found with ID: ${weddingSlug}`, 'error');
      }
    } catch (err) {
      console.error('Error loading wedding:', err);
      const errorMessage = `Failed to load wedding data: ${(err as Error).message || 'Unknown error'}`;
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setUrlCopied(true);
    showToast('URL copied to clipboard!', 'success');
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[&]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleUpdateSlug = async () => {
    if (!customSlug || !weddingId) return;
    
    setSavingSlug(true);
    try {
      const cleanSlug = generateSlug(customSlug);
      
      if (cleanSlug === weddingSlug) {
        showToast('This is already your current wedding ID.', 'info');
        setSavingSlug(false);
        return;
      }
      
      const isAvailable = await weddingService.checkSlugAvailability(cleanSlug);
      if (!isAvailable) {
        showToast('This wedding ID is already taken. Please choose another.', 'error');
        setSavingSlug(false);
        return;
      }
      
      await weddingService.updateWedding(weddingId, { slug: cleanSlug });
      
      showToast('Wedding URL updated successfully!', 'success');
      setTimeout(() => {
        router.push(`/admin/onboarding/${cleanSlug}/overview`);
      }, 1000);
    } catch (error) {
      console.error('Failed to update slug:', error);
      showToast('Failed to update wedding ID. Please try again.', 'error');
    } finally {
      setSavingSlug(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'draft' | 'live') => {
    if (!weddingId) return;

    if (newStatus === 'live') {
      const confirmed = window.confirm('Are you sure you want to publish your wedding website? It will be visible to all guests with PINs.');
      if (!confirmed) return;
    }

    try {
      await weddingService.updateWedding(weddingId, { status: newStatus });
      setWeddingStatus(newStatus);
      
      const statusMessages = {
        draft: 'Wedding set to draft mode',
        live: '🎉 Wedding website is now live!'
      };
      showToast(statusMessages[newStatus], 'success');
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('Failed to update status. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner message="Loading wedding details..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            Wedding Overview
          </Typography>
          <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
            Your wedding website status and quick info
          </Typography>
        </Box>

        {/* Website Status & URL Management Card */}
        <Paper sx={{ 
          p: 4, 
          borderRadius: '24px', 
          bgcolor: weddingStatus === 'live' ? alpha('#10B981', 0.05) : alpha('#fff', 0.95),
          backdropFilter: 'blur(10px)', 
          boxShadow: weddingStatus === 'live' ? '0 8px 32px rgba(16, 185, 129, 0.2)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: weddingStatus === 'live' ? '2px solid #10B981' : 'none',
        }}>
          <Stack spacing={3}>
            {/* Status Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                  Website Status
                </Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                  {weddingStatus === 'draft' && 'Your wedding is private. Only visible to you.'}
                  {weddingStatus === 'live' && '🎉 Your wedding website is live and accessible to guests!'}
                </Typography>
              </Box>
              
              {/* Status Chips */}
              <Stack direction="row" spacing={1}>
                <Chip
                  label="Draft"
                  onClick={() => handleStatusUpdate('draft')}
                  icon={weddingStatus === 'draft' ? <CheckCircle /> : undefined}
                  sx={{
                    bgcolor: weddingStatus === 'draft' ? '#DE3F5E' : 'transparent',
                    color: weddingStatus === 'draft' ? 'white' : '#6a6a6a',
                    borderColor: weddingStatus === 'draft' ? '#DE3F5E' : '#e0e0e0',
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    fontWeight: weddingStatus === 'draft' ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: weddingStatus === 'draft' ? '#C8365A' : alpha('#DE3F5E', 0.08),
                      borderColor: '#DE3F5E',
                    },
                  }}
                />
                <Chip
                  label="Live"
                  onClick={() => handleStatusUpdate('live')}
                  icon={weddingStatus === 'live' ? <CheckCircle /> : undefined}
                  sx={{
                    bgcolor: weddingStatus === 'live' ? '#10B981' : 'transparent',
                    color: weddingStatus === 'live' ? 'white' : '#6a6a6a',
                    borderColor: weddingStatus === 'live' ? '#10B981' : '#e0e0e0',
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    fontWeight: weddingStatus === 'live' ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: weddingStatus === 'live' ? '#059669' : alpha('#10B981', 0.08),
                      borderColor: '#10B981',
                    },
                  }}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Wedding URL Display */}
            <Box>
              <Typography variant="body2" sx={{ color: '#6a6a6a', fontWeight: 600, mb: 1 }}>
                Your Wedding URL
              </Typography>
              <Typography variant="caption" sx={{ color: '#6a6a6a', mb: 2, display: 'block' }}>
                Share this URL with your guests to access your wedding website where they can RSVP and view all the details.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap">
                <Box 
                  sx={{ 
                    display: 'inline-flex',
                    bgcolor: 'white',
                    p: 2, 
                    borderRadius: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    width: 'fit-content',
                    minWidth: 'fit-content'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#DE3F5E',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      whiteSpace: 'nowrap'
                    }}
                  >
                    phera.io/{weddingSlug}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={() => copyToClipboard(`${window.location.origin}/${weddingSlug}`)}
                  sx={{
                    bgcolor: urlCopied ? '#10B981' : alpha('#DE3F5E', 0.1),
                    color: urlCopied ? 'white' : '#DE3F5E',
                    '&:hover': {
                      bgcolor: urlCopied ? '#059669' : alpha('#DE3F5E', 0.2),
                    },
                  }}
                >
                  {urlCopied ? <Check /> : <ContentCopy />}
                </IconButton>
                <IconButton 
                  onClick={() => {
                    setCustomSlug(weddingSlug);
                    setEditSlugModalOpen(true);
                  }}
                  sx={{
                    bgcolor: alpha('#DE3F5E', 0.1),
                    color: '#DE3F5E',
                    '&:hover': {
                      bgcolor: alpha('#DE3F5E', 0.2),
                    },
                  }}
                >
                  <Edit />
                </IconButton>
                <Button
                  variant="outlined"
                  startIcon={<Launch />}
                  href={`/${weddingSlug}`}
                  target="_blank"
                  sx={{
                    borderColor: '#DE3F5E',
                    color: '#DE3F5E',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    '&:hover': {
                      borderColor: '#C8365A',
                      bgcolor: alpha('#DE3F5E', 0.05),
                    },
                  }}
                >
                  Open
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Quick Info Cards */}
        {weddingData && (
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Couple Name Card */}
            <Card sx={{ flex: '1 1 280px', minWidth: 280, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: alpha('#DE3F5E', 0.1), color: '#DE3F5E', width: 48, height: 48 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: '#6a6a6a', fontWeight: 600 }}>Couple</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                    {weddingData.couple_name || 'Not set'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Date Card */}
            <Card sx={{ flex: '1 1 280px', minWidth: 280, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: alpha('#8B5CF6', 0.1), color: '#8B5CF6', width: 48, height: 48 }}>
                  <CalendarMonth />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: '#6a6a6a', fontWeight: 600 }}>Wedding Date</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                    {weddingData.wedding_date_display || 'Not set'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Venue Card */}
            <Card sx={{ flex: '1 1 280px', minWidth: 280, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: alpha('#10B981', 0.1), color: '#10B981', width: 48, height: 48 }}>
                  <LocationOn />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: '#6a6a6a', fontWeight: 600 }}>Venue</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                    {weddingData.venue_name || 'Not set'}
                  </Typography>
                  {weddingData.venue_location && (
                    <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                      {weddingData.venue_flag} {weddingData.venue_location}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Quick Links */}
        <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: alpha('#fff', 0.95) }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1a1a1a' }}>
            Quick Links
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => router.push(`/admin/onboarding/${weddingSlug}/details`)}
                sx={{
                  py: 2,
                  borderRadius: '12px',
                  borderColor: '#e0e0e0',
                  color: '#1a1a1a',
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  gap: 2,
                  '&:hover': {
                    borderColor: '#DE3F5E',
                    bgcolor: alpha('#DE3F5E', 0.02),
                  },
                }}
              >
                <Edit sx={{ color: '#DE3F5E' }} />
                Edit Wedding Details
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => router.push(`/admin/onboarding/${weddingSlug}/guests`)}
                sx={{
                  py: 2,
                  borderRadius: '12px',
                  borderColor: '#e0e0e0',
                  color: '#1a1a1a',
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  gap: 2,
                  '&:hover': {
                    borderColor: '#DE3F5E',
                    bgcolor: alpha('#DE3F5E', 0.02),
                  },
                }}
              >
                <People sx={{ color: '#DE3F5E' }} />
                View Guest Responses
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => router.push(`/admin/onboarding/${weddingSlug}/events`)}
                sx={{
                  py: 2,
                  borderRadius: '12px',
                  borderColor: '#e0e0e0',
                  color: '#1a1a1a',
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  gap: 2,
                  '&:hover': {
                    borderColor: '#DE3F5E',
                    bgcolor: alpha('#DE3F5E', 0.02),
                  },
                }}
              >
                <Event sx={{ color: '#DE3F5E' }} />
                Manage Events
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Toast Notification */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Edit Wedding ID Modal */}
        <Dialog
          open={editSlugModalOpen}
          onClose={() => {
            setEditSlugModalOpen(false);
            setCustomSlug('');
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              bgcolor: 'white',
              p: { xs: 3, sm: 5 },
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            },
          }}
        >
          <DialogTitle 
            sx={{ 
              fontFamily: 'var(--font-instrument-serif)', 
              fontWeight: 700, 
              color: '#1a1a1a', 
              pb: 2,
              px: 0,
            }}
          >
            Customize Wedding ID
          </DialogTitle>
          <DialogContent sx={{ px: 0, pt: 4, overflow: 'visible' }}>
            <Stack spacing={3} sx={{ mt: 0.5 }}>
              <TextField
                label="Wedding ID"
                placeholder={weddingSlug}
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                helperText="Lowercase letters, numbers, and hyphens only"
                disabled={savingSlug}
                fullWidth
                sx={textFieldSx}
              />
              <Typography variant="body2" sx={{ color: '#6a6a6a', fontSize: '0.875rem' }}>
                Your wedding URL will be: <strong style={{ color: '#DE3F5E' }}>phera.io/{customSlug || weddingSlug}</strong>
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 0, pt: 2, pb: 0 }}>
            <Button
              onClick={() => {
                setEditSlugModalOpen(false);
                setCustomSlug('');
              }}
              sx={{
                color: '#6a6a6a',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                borderRadius: '12px',
                '&:hover': {
                  bgcolor: alpha('#6a6a6a', 0.08),
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await handleUpdateSlug();
                setEditSlugModalOpen(false);
              }}
              disabled={!customSlug || customSlug === weddingSlug || savingSlug}
              variant="contained"
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                borderRadius: '12px',
                px: 3,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { 
                  bgcolor: '#C8365A' 
                },
                '&.Mui-disabled': {
                  bgcolor: alpha('#DE3F5E', 0.5),
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            >
              {savingSlug ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}
