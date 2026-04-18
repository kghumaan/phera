'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  DialogContent,
  DialogActions,
  CircularProgress,
  alpha,
  TextField,
} from '@mui/material';
import { PrimaryActionButton } from './ActionButton';
import { Add, AutoAwesome } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AccessTime, LocationOn } from '@mui/icons-material';
import { weddingService, Wedding } from '@/lib/supabase/wedding-service';
import { usePlan } from '@/lib/contexts/PlanContext';
import AdminTopNav from './AdminTopNav';
import UpgradeModal from './UpgradeModal';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.md,
    backgroundColor: '#f8f9fa !important',
    fontSize: '0.9rem',
    '& fieldset': {
      borderColor: 'rgba(222, 63, 94, 0.2) !important',
      borderWidth: '1px !important',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(222, 63, 94, 0.4) !important',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DE3F5E !important',
      borderWidth: '2px !important',
    },
    '& input': {
      color: '#1a1a1a !important',
      WebkitTextFillColor: '#1a1a1a !important',
      padding: '10px 14px',
      fontSize: '0.9rem',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#666 !important',
    fontSize: '0.875rem',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#DE3F5E !important',
  },
});

interface PlannerDashboardProps {
  userId: string;
}

export default function PlannerDashboard({ userId }: PlannerDashboardProps) {
  const router = useRouter();
  const { isPlanner } = usePlan();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Create wedding form state
  const [partner1Name, setPartner1Name] = useState('');
  const [partner2Name, setPartner2Name] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueTbd, setVenueTbd] = useState(false);
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingEndDate, setWeddingEndDate] = useState('');
  const [dateTbd, setDateTbd] = useState(false);
  const [isOneDay, setIsOneDay] = useState(false);

  useEffect(() => {
    fetchWeddings();
  }, [userId]);

  const fetchWeddings = async () => {
    setLoading(true);
    const data = await weddingService.getUserWeddings(userId);
    setWeddings(data);
    setLoading(false);
  };

  const resetForm = () => {
    setPartner1Name('');
    setPartner2Name('');
    setVenueName('');
    setVenueTbd(false);
    setWeddingDate('');
    setWeddingEndDate('');
    setDateTbd(false);
    setIsOneDay(false);
  };

  const handleCreateWedding = async () => {
    if (!partner1Name || !partner2Name) return;

    setCreating(true);
    try {
      const coupleName = `${partner1Name}-${partner2Name}`;
      let baseSlug = coupleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let slug = baseSlug;
      let counter = 1;

      let isAvailable = await weddingService.checkSlugAvailability(slug);
      while (!isAvailable) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        isAvailable = await weddingService.checkSlugAvailability(slug);
      }

      const wedding = await weddingService.createWedding({
        slug,
        couple_name: `${partner1Name} & ${partner2Name}`,
        partner1_name: partner1Name,
        partner2_name: partner2Name,
        wedding_date: (dateTbd || !weddingDate)
          ? new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString()
          : new Date(weddingDate).toISOString(),
        wedding_date_end: dateTbd ? null : (weddingEndDate ? new Date(weddingEndDate).toISOString() : null),
        wedding_date_display: (() => {
          if (dateTbd || !weddingDate) return 'TBD';
          const start = new Date(weddingDate);
          const end = weddingEndDate ? new Date(weddingEndDate) : null;
          const fmtFull = (d: Date) => `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()}, ${d.getFullYear()}`;
          if (!end || start.getTime() === end.getTime()) return fmtFull(start);
          const sy = start.getFullYear(), ey = end.getFullYear();
          const sm = start.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
          const em = end.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
          if (sy !== ey) return `${fmtFull(start)} - ${fmtFull(end)}`;
          if (sm !== em) return `${start.getDate()} ${sm} - ${end.getDate()} ${em}, ${sy}`;
          return `${start.getDate()}-${end.getDate()} ${sm}, ${sy}`;
        })(),
        venue_name: venueTbd || !venueName ? 'Venue Name' : venueName,
        venue_location: venueTbd || !venueName ? 'City, Country' : venueName,
        rsvp_deadline: '',
        status: 'draft',
        created_by: userId,
        background_image: '/images/backgrounds/blue-clouds.webp',
        primary_color: COLORS.brand.primary,
        couple_images: ['/images/couple/placeholder1.png', '/images/couple/placeholder2.png'],
        couple_image_url: '/images/couple/placeholder1.png',
      });

      if (wedding) {
        setDialogOpen(false);
        resetForm();
        router.push(`/admin/${slug}/details`);
      }
    } catch (err) {
      console.error('Error creating wedding:', err);
    } finally {
      setCreating(false);
    }
  };

  const Checkbox = ({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) => (
    <Stack direction="row" spacing={1} alignItems="center" onClick={onClick} sx={{ cursor: 'pointer' }}>
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: '4px',
          border: '2px solid',
          borderColor: checked ? COLORS.text.strong : 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'transparent',
          transition: 'all 0.2s',
        }}
      >
        {checked && (
          <Box component="svg" viewBox="0 0 24 24" sx={{ width: 14, height: 14 }}>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#1a1a1a" />
          </Box>
        )}
      </Box>
      <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 500, fontSize: '0.875rem' }}>
        {label}
      </Typography>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg.subtle }}>
      <AdminTopNav weddingSlug="" />

      <Container maxWidth="md" sx={{ pt: { xs: '72px', md: '88px' }, pb: 4 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: FONTS.display,
              fontStyle: 'italic',
              color: COLORS.text.strong,
              fontWeight: 700,
              fontSize: { xs: '1.6rem', md: '2rem' },
            }}
          >
            My Weddings
          </Typography>
          {weddings.length > 0 && (
            <PrimaryActionButton
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderRadius: RADII.dialog,
                fontSize: '0.9rem',
                px: 3,
              }}
            >
              Create New Wedding
            </PrimaryActionButton>
          )}
        </Stack>

        {/* Planner Subscription Prompt */}
        {!isPlanner && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: RADII.lg,
              bgcolor: COLORS.bg.white,
              border: '1px solid',
              borderColor: alpha(COLORS.brand.primary, 0.2),
              background: `linear-gradient(135deg, white 0%, ${alpha(COLORS.brand.primary, 0.03)} 100%)`,
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: alpha(COLORS.brand.primary, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AutoAwesome sx={{ fontSize: 24, color: COLORS.brand.primary }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.text.strong, mb: 0.5 }}>
                  Activate your Planner subscription
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                  Get unlimited client weddings with all Pro features included — $249/year.
                </Typography>
              </Box>
              <PrimaryActionButton
                onClick={() => setUpgradeModalOpen(true)}
                sx={{
                  borderRadius: RADII.dialog,
                  fontSize: '0.9rem',
                  px: 3,
                  whiteSpace: 'nowrap',
                }}
              >
                Subscribe Now
              </PrimaryActionButton>
            </Stack>
          </Paper>
        )}

        {/* Wedding List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: COLORS.brand.primary }} />
          </Box>
        ) : weddings.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: RADII.lg,
              textAlign: 'center',
              bgcolor: COLORS.bg.white,
              border: '1px solid',
              borderColor: alpha(COLORS.text.strong, 0.08),
            }}
          >
            <Typography variant="h6" sx={{ color: COLORS.text.subtle, mb: 2 }}>
              No weddings yet
            </Typography>
            <PrimaryActionButton
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderRadius: 1,
                px: 4,
              }}
            >
              Create your first wedding
            </PrimaryActionButton>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: RADII.lg,
              bgcolor: COLORS.bg.white,
              border: '1px solid',
              borderColor: alpha(COLORS.text.strong, 0.08),
              overflow: 'hidden',
            }}
          >
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: alpha(COLORS.text.strong, 0.08) }} />}>
              {weddings.map((wedding) => (
                <Box
                  key={wedding.id}
                  onClick={() => router.push(`/admin/${wedding.slug}/overview`)}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    bgcolor: COLORS.bg.white,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(COLORS.brand.primary, 0.04),
                    },
                  }}
                >
                  <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} width="100%">
                    <Box sx={{ flex: 2, minWidth: 0, pr: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: FONTS.display,
                          fontStyle: 'italic',
                          color: COLORS.text.strong,
                          fontWeight: 700,
                          fontSize: '1.4rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {wedding.couple_name}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 2, minWidth: 0, display: 'flex', justifyContent: 'flex-start' }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: alpha(COLORS.text.strong, 0.04),
                        px: 1.5,
                        py: 0.5,
                        borderRadius: RADII.sm,
                      }}>
                        <AccessTime sx={{ fontSize: '1.1rem', color: COLORS.text.subtle }} />
                        <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                          {wedding.wedding_date_display || 'Date TBD'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ flex: 3, minWidth: 0, display: 'flex', justifyContent: 'flex-start' }}>
                      {(wedding.venue_name && wedding.venue_name !== 'Venue Name' || wedding.venue_location && wedding.venue_location !== 'City, Country') && (
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          bgcolor: alpha(COLORS.text.strong, 0.04),
                          px: 1.5,
                          py: 0.5,
                          borderRadius: RADII.sm,
                          maxWidth: '100%',
                        }}>
                          <LocationOn sx={{ fontSize: '1.1rem', color: COLORS.text.subtle, flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {[wedding.venue_name !== 'Venue Name' ? wedding.venue_name : null, wedding.venue_location !== 'City, Country' ? wedding.venue_location : null].filter(Boolean).join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', pr: 1 }}>
                      <Chip
                        label={wedding.status === 'live' ? 'Live' : 'Draft'}
                        size="small"
                        sx={{
                          bgcolor: wedding.status === 'live' ? alpha('#4caf50', 0.1) : alpha(COLORS.text.strong, 0.05),
                          color: wedding.status === 'live' ? '#2e7d32' : COLORS.text.faint,
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      />
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Paper>
        )}
      </Container>

      {/* Create Wedding Dialog*/}
      <PheraDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); resetForm(); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { p: 1 } }}
      >
        <PheraDialogTitle
          onClose={() => { setDialogOpen(false); resetForm(); }}
          sx={{ justifyContent: 'center', fontStyle: 'italic' }}
        >
          Create New Wedding
        </PheraDialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '0.875rem' }}>Partner 1 Name</Typography>
              <StyledTextField
                fullWidth
                label=""
                placeholder="Aarav"
                value={partner1Name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPartner1Name(e.target.value.replace(/\s/g, ''))}
                autoFocus
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '0.875rem' }}>Partner 2 Name</Typography>
              <StyledTextField
                fullWidth
                label=""
                placeholder="Ananya"
                value={partner2Name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPartner2Name(e.target.value.replace(/\s/g, ''))}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '0.875rem' }}>Event Venue</Typography>
              <StyledTextField
                fullWidth
                label=""
                placeholder="Sheraton Grand"
                value={venueName}
                disabled={venueTbd}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setVenueName(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Checkbox checked={venueTbd} onClick={() => setVenueTbd(!venueTbd)} label="Venue TBD" />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '0.875rem' }}>Wedding Dates</Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack direction="row" spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <MobileDatePicker
                      label=""
                      disabled={dateTbd}
                      value={weddingDate ? new Date(weddingDate) : null}
                      onChange={(newValue) => setWeddingDate(newValue ? (newValue as Date).toISOString() : '')}
                      enableAccessibleFieldDOMStructure={false}
                      slots={{ textField: StyledTextField }}
                      slotProps={{
                        textField: { fullWidth: true, placeholder: 'Start Date' },
                        actionBar: { actions: ['cancel', 'accept'], sx: { '& .MuiButton-root': { color: COLORS.brand.primary, fontWeight: 700 } } },
                        day: { sx: { '&.Mui-selected': { backgroundColor: '#DE3F5E !important', color: '#ffffff !important' } } },
                      }}
                    />
                  </Box>
                  {!isOneDay && (
                    <Box sx={{ flex: 1 }}>
                      <MobileDatePicker
                        label=""
                        disabled={dateTbd}
                        value={weddingEndDate ? new Date(weddingEndDate) : null}
                        onChange={(newValue) => setWeddingEndDate(newValue ? (newValue as Date).toISOString() : '')}
                        enableAccessibleFieldDOMStructure={false}
                        slots={{ textField: StyledTextField }}
                        slotProps={{
                          textField: { fullWidth: true, placeholder: 'End Date' },
                          actionBar: { actions: ['cancel', 'accept'], sx: { '& .MuiButton-root': { color: COLORS.brand.primary, fontWeight: 700 } } },
                          day: { sx: { '&.Mui-selected': { backgroundColor: '#DE3F5E !important', color: '#ffffff !important' } } },
                        }}
                      />
                    </Box>
                  )}
                </Stack>
              </LocalizationProvider>
              <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
                <Checkbox checked={isOneDay} onClick={() => setIsOneDay(!isOneDay)} label="One day wedding" />
                <Checkbox checked={dateTbd} onClick={() => setDateTbd(!dateTbd)} label="Dates TBD" />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <Button
            onClick={() => { setDialogOpen(false); resetForm(); }}
            sx={{ color: COLORS.text.subtle, fontWeight: 700, textTransform: 'none', borderRadius: 1 }}
          >
            Cancel
          </Button>
          <PrimaryActionButton
            onClick={handleCreateWedding}
            loading={creating}
            disabled={!partner1Name || !partner2Name}
            sx={{
              borderRadius: 1,
              px: 4,
              opacity: (!partner1Name || !partner2Name) ? 0.6 : 1,
            }}
          >
            Create Wedding
          </PrimaryActionButton>
        </DialogActions>
      </PheraDialog>

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        tier="planner_perwedding"
      />
    </Box>
  );
}
