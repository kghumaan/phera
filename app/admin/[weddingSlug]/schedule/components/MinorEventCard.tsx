'use client';

import { Box, Typography, Stack, IconButton } from '@mui/material';
import { Delete, DragIndicator } from '@mui/icons-material';
import StreamlineIcon from '@/components/ui/StreamlineIcon';
import { ScheduleItem } from '@/lib/supabase/wedding-service';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface MinorEventCardProps {
  item: ScheduleItem;
  onEdit: () => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, any>;
  isViewOnly?: boolean;
}

export default function MinorEventCard({ item, onEdit, onDelete, dragHandleProps, isViewOnly }: MinorEventCardProps) {
  return (
    <Box
      sx={{
        bgcolor: COLORS.bg.white,
        border: '1px solid #EEE',
        borderRadius: RADII.lg,
        px: 2, py: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        '&:hover': { borderColor: COLORS.border.default },
      }}
      onClick={onEdit}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1.1rem', mb: 1 }}>
          {item.name}
        </Typography>
        <Stack direction="row" spacing={2}>
          {item.time && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StreamlineIcon name="clock" size={14} color="#6a6a6a" />
              <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                {item.time}
              </Typography>
            </Stack>
          )}
          {item.location && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StreamlineIcon name="map-pin" size={14} color="#6a6a6a" />
              <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                {item.location}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>

      {!isViewOnly && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            sx={{ color: COLORS.text.strong }}
          >
            <Delete fontSize="small" />
          </IconButton>
          <Box
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            sx={{ cursor: 'grab', color: COLORS.text.faint, display: 'flex', alignItems: 'center' }}
          >
            <DragIndicator fontSize="small" />
          </Box>
        </Stack>
      )}
    </Box>
  );
}
