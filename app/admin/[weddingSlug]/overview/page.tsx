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
  CircularProgress,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Check, ContentCopy, Launch, CheckCircle, Edit, People, Event, LocationOn, CalendarMonth, HowToReg, PersonOff, HelpOutline, UploadFile, Web, Hotel, DirectionsBus, WhatsApp, SupportAgent, ArrowForward } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import { getAllRSVPs } from '@/lib/supabase/rsvp-service';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

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

const QUICK_LINKS = [
  { label: 'Customize Design', path: 'design', icon: Edit },
  { label: 'Guest Responses', path: 'guests', icon: People },
  { label: 'Schedule & Events', path: 'schedule', icon: Event },
];

function QuickLinks({ weddingSlug }: { weddingSlug: string }) {
  const router = useRouter();
  const [loadingLink, setLoadingLink] = useState<string | null>(null);

  const go = (path: string) => {
    setLoadingLink(path);
    router.push(`/admin/${weddingSlug}/${path}`);
  };

  const primarySteps = [
    {
      step: 1,
      label: 'Import Guest List',
      subtext: 'Pull in every guest so we can nudge anyone who hasn\'t responded, track who\'s coming, and group people for outreach.',
      icon: UploadFile,
      path: 'guest-list',
    },
    {
      step: 2,
      label: 'Create Wedding Website',
      subtext: 'Fill in your wedding details so your site is ready for guests — and so our Concierge knows how to answer their questions.',
      icon: Web,
      path: 'details',
    },
  ];

  const betaFeatures = [
    { label: 'Room Assignments',  subtext: 'Upload a floorplan and place guests into hotel rooms.', icon: Hotel },
    { label: 'Guest Transportation', subtext: 'Shuttles, airport pickups, and venue transfers.', icon: DirectionsBus },
    { label: 'Guest Concierge',   subtext: '24/7 WhatsApp concierge that answers every guest question.', icon: WhatsApp },
    { label: 'Vendor Management', subtext: 'Track vendor conversations and stay organized.', icon: SupportAgent },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: '20px',
        background: `linear-gradient(135deg, ${alpha('#DE3F5E', 0.08)} 0%, ${alpha('#DE3F5E', 0.02)} 60%, #fff 100%)`,
        border: `1px solid ${alpha('#DE3F5E', 0.15)}`,
      }}
    >
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          What would you like to do?
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#6a6a6a' }}>
          A simple roadmap for setting up your wedding in Phera.
        </Typography>
      </Stack>

      {/* Primary steps */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {primarySteps.map(({ step, label, subtext, icon: Icon, path }) => {
          const isLoading = loadingLink === path;
          return (
            <Paper
              key={path}
              elevation={0}
              onClick={() => !isLoading && go(path)}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: '16px',
                bgcolor: 'white',
                border: `1.5px solid ${alpha('#DE3F5E', 0.2)}`,
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#DE3F5E',
                  boxShadow: '0 6px 20px rgba(222, 63, 94, 0.12)',
                  transform: isLoading ? 'none' : 'translateY(-1px)',
                },
              }}
            >
              {/* Step number badge */}
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ fontSize: 22 }} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#DE3F5E', letterSpacing: '0.08em' }}>
                    STEP {step}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#4a4a4a', lineHeight: 1.5 }}>
                  {subtext}
                </Typography>
              </Box>

              <Box sx={{ flexShrink: 0, color: '#DE3F5E' }}>
                {isLoading ? <CircularProgress size={20} sx={{ color: '#DE3F5E' }} /> : <ArrowForward sx={{ fontSize: 22 }} />}
              </Box>
            </Paper>
          );
        })}
      </Stack>

      {/* Beta / Coming soon features */}
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6a6a6a', letterSpacing: '0.08em', mb: 1.5 }}>
        COMING SOON
      </Typography>
      <Grid container spacing={1.5}>
        {betaFeatures.map(({ label, subtext, icon: Icon }) => (
          <Grid key={label} size={{ xs: 12, sm: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: alpha('#fff', 0.6),
                border: '1px dashed rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                cursor: 'not-allowed',
                opacity: 0.75,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  bgcolor: alpha('#DE3F5E', 0.08),
                  color: '#DE3F5E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
                    {label}
                  </Typography>
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.1,
                      borderRadius: '6px',
                      bgcolor: alpha('#DE3F5E', 0.1),
                      color: '#DE3F5E',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    COMING SOON
                  </Box>
                </Stack>
                <Typography sx={{ fontSize: 11.5, color: '#6a6a6a', lineHeight: 1.4 }}>
                  {subtext}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

export default function OverviewPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const router = useRouter();
  const { isViewOnly } = useAdminRole();
  const { showStatus } = useAutoSaveStatus();
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

        // Load RSVP stats - use weddingSlug instead of wedding.id
        try {
          const rsvps = await getAllRSVPs(weddingSlug) as unknown as RSVPData[];
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
        showStatus('error', `No wedding found with ID: ${weddingSlug}`);
      }
    } catch (err) {
      console.error('Error loading wedding:', err);
      const errorMessage = `Failed to load wedding data: ${(err as Error).message || 'Unknown error'}`;
      setError(errorMessage);
      showStatus('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setUrlCopied(true);
    showStatus('saved', 'URL copied to clipboard!');
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
    if (isViewOnly || !customSlug || !weddingId) return;

    setSavingSlug(true);
    try {
      const cleanSlug = generateSlug(customSlug);

      if (cleanSlug === weddingSlug) {
        showStatus('saved', 'This is already your current wedding ID.');
        setSavingSlug(false);
        return;
      }

      const isAvailable = await weddingService.checkSlugAvailability(cleanSlug);
      if (!isAvailable) {
        showStatus('error', 'This wedding ID is already taken. Please choose another.');
        setSavingSlug(false);
        return;
      }

      await weddingService.updateWedding(weddingId, { slug: cleanSlug });

      showStatus('saved', 'Wedding URL updated successfully!');
      setTimeout(() => {
        router.push(`/admin/${cleanSlug}/overview`);
      }, 1000);
    } catch (error) {
      console.error('Failed to update slug:', error);
      showStatus('error', 'Failed to update wedding ID. Please try again.');
    } finally {
      setSavingSlug(false);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; confirmLabel: string; onConfirm: () => void }>({ open: false, message: '', confirmLabel: 'Confirm', onConfirm: () => {} });

  const handleStatusUpdate = async (newStatus: 'draft' | 'live') => {
    if (isViewOnly || !weddingId) return;

    const doUpdate = async () => {
      try {
        await weddingService.updateWedding(weddingId, { status: newStatus });
        setWeddingStatus(newStatus);

        const statusMessages = {
          draft: 'Wedding set to draft mode',
          live: '🎉 Wedding website is now live!'
        };
        showStatus('saved', statusMessages[newStatus]);
      } catch (error) {
        console.error('Failed to update status:', error);
        showStatus('error', 'Failed to update status. Please try again.');
      }
    };

    if (newStatus === 'live') {
      setConfirmDialog({
        open: true,
        message: 'Are you sure you want to publish your wedding website? It will be visible to all guests with PINs.',
        confirmLabel: 'Publish',
        onConfirm: async () => {
          setConfirmDialog(prev => ({ ...prev, open: false }));
          await doUpdate();
        },
      });
    } else {
      await doUpdate();
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
            boxShadow: 'none',
          }}>
            <Typography variant="subtitleCaps" sx={{ mb: 3, color: '#1a1a1a' }}>
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
                    <Typography variant="body2" sx={{color: '#1a1a1a' }}>
                      {weddingData.couple_name || 'Not set'}
                    </Typography>
                  </Box>

                  {/* Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#000', 0.05), color: '#1a1a1a', width: 40, height: 40 }}>
                      <CalendarMonth fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" sx={{color: '#1a1a1a' }}>
                      {weddingData.wedding_date_display || 'Not set'}
                    </Typography>
                  </Box>

                  {/* Venue */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#000', 0.05), color: '#1a1a1a', width: 40, height: 40 }}>
                      <LocationOn fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{color: '#1a1a1a' }}>
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
                  <Typography variant="subtitleCaps" sx={{ mb: 1.5, color: '#1a1a1a' }}>
                    Guest Responses
                  </Typography>

                  <Stack spacing={1.5}>
                    {/* Attending */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#10B981'
                        }} />
                        <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                          Attending
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
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
                        <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                          Not Attending
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
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
                        <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                          Pending
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
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
        <QuickLinks weddingSlug={weddingSlug} />

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
              {savingSlug ? <CircularProgress size={20} color="inherit" /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>

      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        confirmColor="#DE3F5E"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
}
