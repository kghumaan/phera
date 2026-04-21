'use client';

import { Box, Typography, Stack, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import StreamlineIcon from '@/components/ui/StreamlineIcon';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ExamplesSectionProps {
  onDismiss: () => void;
}

export default function ExamplesSection({ onDismiss }: ExamplesSectionProps) {
  return (
    <Box sx={{ bgcolor: '#EEF4F4', borderRadius: RADII.lg, p: 3, position: 'relative' }}>
      <IconButton
        onClick={onDismiss}
        size="small"
        sx={{ position: 'absolute', top: 12, right: 12, color: COLORS.text.strong }}
      >
        <Close fontSize="small" />
      </IconButton>

      <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1rem', mb: 2.5 }}>
        Examples
      </Typography>

      <Stack spacing={2}>
        {/* Minor Event Example */}
        <Box sx={{
          bgcolor: COLORS.bg.white,
          borderRadius: RADII.lg,
          border: '1px solid #EEE',
          px: 2, py: 2.5,
        }}>
          <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1.1rem', mb: 1 }}>
            Minor Events{' '}
            <Typography component="span" sx={{ fontWeight: 400, color: COLORS.text.subtle, fontSize: '1.1rem' }}>
              (check-in, breakfast, high-tea)
            </Typography>
          </Typography>
          <Stack direction="row" spacing={2}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StreamlineIcon name="clock" size={14} color="#6a6a6a" />
              <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                12 PM - 3 PM
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StreamlineIcon name="map-pin" size={14} color="#6a6a6a" />
              <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                Location
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Major Event Example */}
        <Box sx={{
          bgcolor: COLORS.bg.white,
          borderRadius: RADII.lg,
          border: '1px solid #EEE',
          display: 'flex',
          overflow: 'hidden',
        }}>
          <Box sx={{ width: 8, bgcolor: '#FA9A00', flexShrink: 0, borderRadius: '4px' }} />
          <Box sx={{ px: 2, py: 2.5, flex: 1 }}>
            <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1.1rem', mb: 0.5 }}>
              Major Events{' '}
              <Typography component="span" sx={{ fontWeight: 400, color: COLORS.text.subtle, fontSize: '1.1rem' }}>
                (haldi, wedding ceremony, sangeet)
              </Typography>
            </Typography>
            <Typography sx={{ color: COLORS.text.subtle, fontSize: '1rem', lineHeight: 1.5, mb: 1.5 }}>
              Description of the event goes here lore ipsum dolor sit amet consecitur.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <StreamlineIcon name="clock" size={14} color="#6a6a6a" />
                <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                  12 PM - 3 PM
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <StreamlineIcon name="map-pin" size={14} color="#6a6a6a" />
                <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                  Location
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <StreamlineIcon name="hanger" size={14} color="#6a6a6a" />
                <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                  Dress Code
                </Typography>
              </Stack>
            </Stack>
            <Typography sx={{ color: COLORS.brand.primary, fontSize: '0.875rem' }}>
              <Box component="span" sx={{ fontWeight: 700, textDecoration: 'underline' }}>More details</Box>
              {' >'}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
