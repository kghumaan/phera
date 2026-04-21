'use client';

import { Box, Typography, Stack, IconButton } from '@mui/material';
import { Delete, DragIndicator } from '@mui/icons-material';
import StreamlineIcon from '@/components/ui/StreamlineIcon';
import { ScheduleItem } from '@/lib/supabase/wedding-service';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface MajorEventCardProps {
  item: ScheduleItem;
  onEdit: () => void;
  onDelete: () => void;
  onMoreDetails?: () => void;
  dragHandleProps?: Record<string, any>;
  isViewOnly?: boolean;
}

function getBarColor(gradientBackground: string | null): string {
  if (gradientBackground && gradientBackground.startsWith('#')) return gradientBackground;
  return COLORS.brand.primary;
}

export default function MajorEventCard({ item, onEdit, onDelete, onMoreDetails, dragHandleProps, isViewOnly }: MajorEventCardProps) {
  const barColor = getBarColor(item.gradient_background);

  return (
    <Box
      sx={{
        bgcolor: COLORS.bg.white,
        border: '1px solid #EEE',
        borderRadius: RADII.lg,
        display: 'flex',
        gap: 3,
        alignItems: 'center',
        px: 2, py: 2.5,
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': { borderColor: COLORS.border.default },
      }}
      onClick={onEdit}
    >
      {/* Content with color bar */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', gap: 2, alignItems: 'stretch' }}>
        {/* Color bar */}
        <Box sx={{ width: 8, bgcolor: barColor, borderRadius: '4px', flexShrink: 0, alignSelf: 'stretch' }} />

        {/* Text content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1.1rem', mb: 0.5 }}>
            {item.name}
          </Typography>
          {item.description && (
            <Typography sx={{ color: COLORS.text.subtle, fontSize: '1rem', lineHeight: 1.5, mb: 2 }}>
              {item.description}
            </Typography>
          )}
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1.5 }}>
            {item.time && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <StreamlineIcon name="clock" size={14} color="#6a6a6a" />
                <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {item.time}
                </Typography>
              </Stack>
            )}
            {item.location && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <StreamlineIcon name="map-pin" size={14} color="#6a6a6a" />
                <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {item.location}
                </Typography>
              </Stack>
            )}
            {item.dress_code && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <StreamlineIcon name="hanger" size={14} color="#6a6a6a" />
                <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {item.dress_code}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Actions */}
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
