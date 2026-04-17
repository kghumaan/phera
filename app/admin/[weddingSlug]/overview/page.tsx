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
import { usePlan } from '@/lib/contexts/PlanContext';
import { getAllRSVPs } from '@/lib/supabase/rsvp-service';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII, FONTS } from '@/lib/theme/tokens';
import { PageHeading } from '@/components/shared/PageHeading';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';

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
  { label: 'RSVPs', path: 'guests', icon: People },
  { label: 'Schedule & Events', path: 'schedule', icon: Event },
];

function QuickLinks({
  weddingSlug,
  weddingId,
  weddingData,
}: {
  weddingSlug: string;
  weddingId: string | null;
  weddingData: WeddingData | null;
}) {
  const router = useRouter();
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [completion, setCompletion] = useState<Record<string, boolean>>({});

  const go = (path: string) => {
    setLoadingLink(path);
    router.push(`/admin/${weddingSlug}/${path}`);
  };

  // Load completion state for each roadmap step in parallel.
  useEffect(() => {
    if (!weddingId) return;

    let cancelled = false;
    (async () => {
      const [guestsRes, roomsRes, vehiclesRes, vendorsRes, settingsRes] = await Promise.all([
        (supabase as any).from('guests').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingSlug),
        (supabase as any).from('wedding_rooms').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingId),
        (supabase as any).from('transportation_vehicles').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingId),
        (supabase as any).from('vendors').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingId),
        (supabase as any).from('wedding_settings').select('concierge_enabled').eq('wedding_id', weddingId).maybeSingle(),
      ]);

      if (cancelled) return;

      const websiteDone = !!(
        weddingData?.couple_name &&
        weddingData?.venue_name &&
        weddingData?.wedding_date_display
      );

      setCompletion({
        'guest-list': (guestsRes.count ?? 0) > 0,
        'details': websiteDone,
        'concierge': !!settingsRes?.data?.concierge_enabled,
        'rooms': (roomsRes.count ?? 0) > 0,
        'transportation': (vehiclesRes.count ?? 0) > 0,
        'coordinator': (vendorsRes.count ?? 0) > 0,
      });
    })();

    return () => { cancelled = true; };
  }, [weddingId, weddingSlug, weddingData?.couple_name, weddingData?.venue_name, weddingData?.wedding_date_display]);

  const roadmap = [
    {
      label: 'Import Guest List',
      subtext: "Pull in every guest so we can nudge anyone who hasn't responded, track who's coming, and group people for outreach.",
      icon: UploadFile,
      path: 'guest-list',
    },
    {
      label: 'Create Wedding Website',
      subtext: "Fill in your wedding details so your site is ready for guests — and so our Concierge knows how to answer their questions.",
      icon: Web,
      path: 'details',
    },
    {
      label: 'Enable Guest Concierge',
      subtext: 'Turn on the 24/7 WhatsApp assistant for your guests — answers logistics, RSVP nudges, and last-minute questions.',
      icon: WhatsApp,
      path: 'concierge',
      isPro: true,
    },
    {
      label: 'Set Up Room Assignments',
      subtext: 'Upload a floorplan and place guests into hotel rooms.',
      icon: Hotel,
      path: 'rooms',
      isPro: true,
    },
    {
      label: 'Coordinate Guest Transportation',
      subtext: 'Shuttles, airport pickups, and venue transfers — optimized so no one gets stranded.',
      icon: DirectionsBus,
      path: 'transportation',
      isPro: true,
    },
    {
      label: 'Track Vendor Conversations',
      subtext: 'Add our Agent to your vendor WhatsApp groups for summaries, action items, and flagged risks.',
      icon: SupportAgent,
      path: 'coordinator',
      isPro: true,
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: RADII.xl,
        background: `linear-gradient(135deg, ${alpha(COLORS.brand.primary, 0.08)} 0%, ${alpha(COLORS.brand.primary, 0.02)} 60%, ${COLORS.bg.white} 100%)`,
        border: `1px solid ${alpha(COLORS.brand.primary, 0.15)}`,
      }}
    >
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="subtitleCaps" sx={{ color: COLORS.text.strong }}>
          What would you like to do?
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
          A simple roadmap for setting up your wedding in Phera.
        </Typography>
      </Stack>

      <Stack spacing={1.25}>
        {roadmap.map(({ label, subtext, icon: Icon, path, isPro }) => {
          const isLoading = loadingLink === path;
          const isDone = !!completion[path];
          return (
            <Paper
              key={path}
              elevation={0}
              onClick={() => !isLoading && go(path)}
              sx={{
                px: { xs: 2, md: 2.5 },
                py: { xs: 1.75, md: 2 },
                borderRadius: RADII.md,
                bgcolor: isDone ? alpha(COLORS.brand.primary, 0.03) : COLORS.bg.white,
                border: '1px solid',
                borderColor: isDone ? alpha(COLORS.brand.primary, 0.15) : COLORS.border.light,
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.18s ease',
                '&:hover': {
                  borderColor: alpha(COLORS.brand.primary, 0.4),
                  bgcolor: alpha(COLORS.brand.primary, isDone ? 0.05 : 0.02),
                  transform: isLoading ? 'none' : 'translateX(2px)',
                  '& .roadmap-circle': isDone ? {} : {
                    borderColor: COLORS.brand.primary,
                    bgcolor: COLORS.brand.primarySubtle,
                  },
                  '& .roadmap-chevron': { color: COLORS.brand.primary },
                },
              }}
            >
              {/* Circle — check when done, icon when not */}
              <Box
                className="roadmap-circle"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: isDone ? 'none' : `1.5px solid ${alpha(COLORS.brand.primary, 0.3)}`,
                  bgcolor: isDone ? COLORS.brand.primary : COLORS.brand.primaryWash,
                  color: isDone ? COLORS.text.inverse : COLORS.brand.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.18s ease',
                }}
              >
                {isDone ? <Check sx={{ fontSize: 20 }} /> : <Icon sx={{ fontSize: 18 }} />}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0, opacity: isDone ? 0.55 : 1, transition: 'opacity 0.18s ease' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: 14, md: 15 },
                      fontWeight: 700,
                      color: COLORS.text.strong,
                      textDecoration: isDone ? 'line-through' : 'none',
                      textDecorationColor: alpha(COLORS.text.strong, 0.3),
                    }}
                  >
                    {label}
                  </Typography>
                  {isPro && (
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 0.75,
                        py: 0.15,
                        borderRadius: '6px',
                        border: `1px solid ${COLORS.brand.primary}`,
                        color: COLORS.brand.primary,
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}
                    >
                      PRO
                    </Box>
                  )}
                </Stack>
                <Typography variant="body2" sx={{ color: COLORS.text.subtle, lineHeight: 1.5 }}>
                  {subtext}
                </Typography>
              </Box>

              <Box
                className="roadmap-chevron"
                sx={{
                  flexShrink: 0,
                  color: alpha(COLORS.text.strong, 0.3),
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.18s ease',
                }}
              >
                {isLoading
                  ? <CircularProgress size={18} sx={{ color: COLORS.brand.primary }} />
                  : <ArrowForward sx={{ fontSize: 18 }} />}
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
}

export default function OverviewPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const router = useRouter();
  const { isViewOnly } = useAdminRole();
  const { isPro } = usePlan();
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
  const [conciergePhone, setConciergePhone] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  useEffect(() => {
    loadWeddingData();
  }, [weddingSlug]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/vendors/coordinator-info');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.phoneNumber) setConciergePhone(data.phoneNumber);
      } catch {}
    })();
  }, []);

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
        <PageHeading
          title="Wedding Overview"
          subtitle="Your wedding website status and quick info"
        />

        {/* Wedding Details & RSVP Summary */}
        {weddingData && (
          <Paper sx={{
            p: 4,
            borderRadius: RADII.lg,
            bgcolor: COLORS.bg.muted,
            boxShadow: 'none',
          }}>
            <Typography variant="subtitleCaps" sx={{ mb: 3, color: COLORS.text.strong, display: 'block' }}>
              Wedding Summary
            </Typography>
            <Grid container spacing={3}>
              {/* Wedding Details */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2.5}>
                  {/* Couple */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha(COLORS.text.strong, 0.05), color: COLORS.text.strong, width: 40, height: 40 }}>
                      <People fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
                      {weddingData.couple_name || 'Not set'}
                    </Typography>
                  </Box>

                  {/* Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha(COLORS.text.strong, 0.05), color: COLORS.text.strong, width: 40, height: 40 }}>
                      <CalendarMonth fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
                      {weddingData.wedding_date_display || 'Not set'}
                    </Typography>
                  </Box>

                  {/* Venue */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha(COLORS.text.strong, 0.05), color: COLORS.text.strong, width: 40, height: 40 }}>
                      <LocationOn fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
                        {weddingData.venue_name || 'Not set'}
                      </Typography>
                      {weddingData.venue_location && (
                        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: 0.5 }}>
                          {weddingData.venue_location}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Concierge */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha(COLORS.text.strong, 0.05), color: COLORS.text.strong, width: 40, height: 40 }}>
                      <WhatsApp fontSize="small" />
                    </Avatar>
                    {isPro ? (
                      <Box>
                        <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
                          {conciergePhone || 'Not configured'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: 0.5 }}>
                          Guest Concierge
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        onClick={() => setUpgradeModalOpen(true)}
                        sx={{ position: 'relative', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                      >
                        <Box sx={{ filter: 'blur(4px)', userSelect: 'none' }}>
                          <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
                            +XX XXX XXX XXXX
                          </Typography>
                          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: 0.5 }}>
                            Guest Concierge
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: COLORS.brand.primary,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Upgrade to unlock
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </Grid>

              {/* RSVP Stats */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  bgcolor: COLORS.bg.white,
                  borderRadius: RADII.md,
                  p: 3,
                  border: `1px solid ${COLORS.border.faint}`,
                }}>
                  <Typography variant="subtitleCaps" sx={{ mb: 1.5, color: COLORS.text.strong }}>
                    RSVPs
                  </Typography>

                  <Stack spacing={1.5}>
                    {/* Attending */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: COLORS.accent.success,
                        }} />
                        <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
                          Attending
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: COLORS.text.strong }}>
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
                          bgcolor: COLORS.accent.danger,
                        }} />
                        <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
                          Not Attending
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: COLORS.text.strong }}>
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
                          bgcolor: COLORS.accent.warning,
                        }} />
                        <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
                          Pending
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: COLORS.text.strong }}>
                        {rsvpStats.pending}
                      </Typography>
                    </Box>

                    {/* View Details Button */}
                    <PrimaryActionButton
                      fullWidth
                      size="large"
                      href={`/admin/${weddingSlug}/guests`}
                      sx={{ mt: 2, py: 1.5 }}
                    >
                      View All Responses
                    </PrimaryActionButton>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Quick Links */}
        <QuickLinks weddingSlug={weddingSlug} weddingId={weddingId} weddingData={weddingData} />

        {/* Edit Wedding ID Modal */}
        <PheraDialog
          open={editSlugModalOpen}
          onClose={() => {
            setEditSlugModalOpen(false);
            setCustomSlug('');
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { p: { xs: 3, sm: 5 } } }}
        >
          <PheraDialogTitle
            onClose={() => {
              setEditSlugModalOpen(false);
              setCustomSlug('');
            }}
            sx={{ pb: 2, px: 0 }}
          >
            Customize Wedding ID
          </PheraDialogTitle>
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
              <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                Your wedding URL will be: <strong style={{ color: COLORS.brand.primary }}>phera.io/{customSlug || weddingSlug}</strong>
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
                color: COLORS.text.subtle,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                borderRadius: RADII.md,
                '&:hover': {
                  bgcolor: alpha(COLORS.text.strong, 0.04),
                },
              }}
            >
              Cancel
            </Button>
            <PrimaryActionButton
              onClick={async () => {
                await handleUpdateSlug();
                setEditSlugModalOpen(false);
              }}
              disabled={!customSlug || customSlug === weddingSlug}
              loading={savingSlug}
              sx={{
                px: 3,
                '&.Mui-disabled': {
                  bgcolor: alpha(COLORS.brand.primary, 0.5),
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            >
              Update
            </PrimaryActionButton>
          </DialogActions>
        </PheraDialog>
      </Stack>

      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        confirmColor={COLORS.brand.primary}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
      <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </Box>
  );
}
