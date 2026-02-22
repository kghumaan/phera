'use client';

import {
  Box,
  Container,
  Typography,
  TextField,
  Stack,
  Paper,
  Button,
  Grid,
  alpha,
  IconButton,
  Chip,
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
import { Check, ContentCopy, Launch, CheckCircle, Edit, People, Event, LocationOn, CalendarMonth, HowToReg, PersonOff, HelpOutline } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import { getAllRSVPs } from '@/lib/supabase/rsvp-service';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { toast } from 'sonner';

// Use enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

interface WeddingData {
  id: string;
  couple_name: string;
  wedding_date_display: string;
  venue_name: string;
  venue_location: string;
  venue_flag: string;
  status: 'draft' | 'live';
}

interface RSVPData {
  attending: 'yes' | 'no' | 'maybe';
  guest_count: number;
}

export default function OverviewPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [weddingStatus, setWeddingStatus] = useState<'draft' | 'live'>('draft');
  const [editSlugModalOpen, setEditSlugModalOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);
  const [weddingData, setWeddingData] = useState<WeddingData | null>(null);
  const [rsvpStats, setRsvpStats] = useState({ attending: 0, notAttending: 0, pending: 0, total: 0, totalGuestsComing: 0 });

  useEffect(() => {
    loadWeddingData();
  }, [weddingSlug]);

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

        // Load RSVP stats - use wedding.id instead of weddingSlug
        try {
          const rsvps = await getAllRSVPs(wedding.id) as unknown as RSVPData[];
          const attending = rsvps.filter(r => r.attending === 'yes').length;
          const notAttending = rsvps.filter(r => r.attending === 'no').length;
          const pending = rsvps.filter(r => r.attending === 'maybe' || !r.attending).length;

          // Calculate total guests coming (including plus ones)
          const totalGuestsComing = rsvps
            .filter(r => r.attending === 'yes')
            .reduce((sum, r) => sum + (r.guest_count || 1), 0);

          setRsvpStats({
            attending,
            notAttending,
            pending,
            total: rsvps.length,
            totalGuestsComing
          });
        } catch (err) {
          console.error('Error loading RSVP stats:', err);
          // Silent fail - RSVP stats are not critical
        }
      } else {
        setError(`No wedding found with ID: ${weddingSlug}`);
        toast.error(`No wedding found with ID: ${weddingSlug}`);
      }
    } catch (err) {
      console.error('Error loading wedding:', err);
      const errorMessage = `Failed to load wedding data: ${(err as Error).message || 'Unknown error'}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setUrlCopied(true);
    toast.success('URL copied to clipboard!');
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
        toast.info('This is already your current wedding ID.');
        setSavingSlug(false);
        return;
      }

      const isAvailable = await weddingService.checkSlugAvailability(cleanSlug);
      if (!isAvailable) {
        toast.error('This wedding ID is already taken. Please choose another.');
        setSavingSlug(false);
        return;
      }

      await weddingService.updateWedding(weddingId, { slug: cleanSlug });

      toast.success('Wedding URL updated successfully!');
      setTimeout(() => {
        router.push(`/admin/${cleanSlug}/overview`);
      }, 1000);
    } catch (error) {
      console.error('Failed to update slug:', error);
      toast.error('Failed to update wedding ID. Please try again.');
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
      toast.success(statusMessages[newStatus]);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading wedding details..." />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={4} sx={{ pt: { xs: 6, lg: 0 } }}>
        {/* Header */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Wedding Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Your wedding website status and quick info
          </Typography>
        </Box>

        {/* Wedding Details & RSVP Summary */}
        {weddingData && (
          <Paper sx={{
            p: 4,
            borderRadius: '16px',
            bgcolor: '#fafafa',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1a1a1a' }}>
              Wedding Summary
            </Typography>

            <Grid container spacing={3}>
              {/* Wedding Details */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2.5}>
                  {/* Couple */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#000', 0.05), color: '#1a1a1a', width: 40, height: 40 }}>
                      <People fontSize="small" />
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {weddingData.couple_name || 'Not set'}
                    </Typography>
                  </Box>

                  {/* Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#000', 0.05), color: '#1a1a1a', width: 40, height: 40 }}>
                      <CalendarMonth fontSize="small" />
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {weddingData.wedding_date_display || 'Not set'}
                    </Typography>
                  </Box>

                  {/* Venue */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#000', 0.05), color: '#1a1a1a', width: 40, height: 40 }}>
                      <LocationOn fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {weddingData.venue_name || 'Not set'}
                      </Typography>
                      {weddingData.venue_location && (
                        <Typography variant="body2" sx={{ color: '#6a6a6a', mt: 0.5 }}>
                          {weddingData.venue_location}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Stack>
              </Grid>

              {/* RSVP Stats */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  bgcolor: 'white',
                  borderRadius: '12px',
                  p: 3,
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  height: '100%'
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                    Guest Responses
                  </Typography>

                  <Stack spacing={2}>
                    {/* Attending */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#10B981'
                        }} />
                        <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                          Attending
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                        {rsvpStats.totalGuestsComing}
                      </Typography>
                    </Box>

                    {/* Not Attending */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#EF4444'
                        }} />
                        <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                          Not Attending
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                        {rsvpStats.notAttending}
                      </Typography>
                    </Box>

                    {/* Pending */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#F59E0B'
                        }} />
                        <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                          Pending
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                        {rsvpStats.pending}
                      </Typography>
                    </Box>

                    {/* View Details Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={() => router.push(`/admin/${weddingSlug}/guests`)}
                      sx={{
                        mt: 2,
                        bgcolor: '#DE3F5E',
                        color: 'white',
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        '&:hover': {
                          bgcolor: '#C8365A',
                        },
                      }}
                    >
                      View All Responses
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Paper>
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
                onClick={() => router.push(`/admin/${weddingSlug}/details`)}
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
                onClick={() => router.push(`/admin/${weddingSlug}/guests`)}
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
                onClick={() => router.push(`/admin/${weddingSlug}/events`)}
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
    </Box>
  );
}
