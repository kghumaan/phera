'use client';

import { Box, Typography, Stack } from '@mui/material';
import StreamlineIcon, { StreamlineIconName } from '@/components/ui/StreamlineIcon';

const ALL_ICONS: StreamlineIconName[] = [
  'hand-wave', 'globe', 'megaphone', 'chef-hat', 'music-note', 'bell',
  'clipboard-check', 'camera', 'clock', 'dress', 'banknote', 'lotus',
  'gift', 'check-circle', 'flower', 'sunflower', 'trumpet', 'bouquet',
  'party-popper', 'microphone', 'sparkles', 'beach', 'horse', 'map-pin',
  'palm-tree', 'buildings', 'map-route', 'sun-cloud', 'whatsapp', 'users',
  'calendar-remove', 'plane-takeoff', 'calendar-check', 'calendar', 'plane',
  'store', 'hanger',
];

export default function IconPreviewPage() {
  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        StreamlineIcon Preview
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {ALL_ICONS.map((name) => (
          <Stack key={name} alignItems="center" spacing={1} sx={{ width: 100 }}>
            <Box sx={{
              width: 56, height: 56,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #eee', borderRadius: '12px', bgcolor: '#fafafa',
            }}>
              <StreamlineIcon name={name} size={28} color="#1a1a1a" />
            </Box>
            <Typography variant="caption" sx={{ color: '#6a6a6a', textAlign: 'center', fontSize: '0.7rem' }}>
              {name}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}
