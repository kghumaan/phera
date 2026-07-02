'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  alpha,
} from '@mui/material';
import { PrimaryActionButton } from './ActionButton';
import { Add, AccessTime, LocationOn } from '@mui/icons-material';
import { weddingService, Wedding } from '@/lib/supabase/wedding-service';
import AdminTopNav from './AdminTopNav';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';

interface PlannerDashboardProps {
  userId: string;
}

export default function PlannerDashboard({ userId }: PlannerDashboardProps) {
  const router = useRouter();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeddings();
  }, [userId]);

  const fetchWeddings = async () => {
    setLoading(true);
    const data = await weddingService.getUserWeddings(userId);
    setWeddings(data);
    setLoading(false);
  };

  // New weddings are created through /admin/new, which enforces the $249
  // per-wedding planner charge before the wedding is provisioned. Creating
  // here directly would bypass billing.
  const goToNewWedding = () => router.push('/admin/new');

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
            Weddings
          </Typography>
          {weddings.length > 0 && (
            <PrimaryActionButton
              startIcon={<Add />}
              onClick={goToNewWedding}
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
              onClick={goToNewWedding}
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
                          bgcolor: wedding.status === 'live' ? alpha(COLORS.accent.success, 0.1) : alpha(COLORS.text.strong, 0.05),
                          color: wedding.status === 'live' ? COLORS.accent.successText : COLORS.text.faint,
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
    </Box>
  );
}
