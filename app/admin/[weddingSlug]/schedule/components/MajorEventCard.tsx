'use client';

import { Box, Typography, Stack, IconButton } from '@mui/material';
import { Delete, DragIndicator } from '@mui/icons-material';
import { ScheduleItem } from '@/lib/supabase/wedding-service';

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
  return '#DE3F5E';
}

export default function MajorEventCard({ item, onEdit, onDelete, onMoreDetails, dragHandleProps, isViewOnly }: MajorEventCardProps) {
  const barColor = getBarColor(item.gradient_background);

  return (
    <Box
      sx={{
        bgcolor: 'white',
        border: '1px solid #EEE',
        borderRadius: '16px',
        display: 'flex',
        gap: 3,
        alignItems: 'center',
        px: 2, py: 2.5,
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': { borderColor: '#ddd' },
      }}
      onClick={onEdit}
    >
      {/* Content with color bar */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', gap: 2, alignItems: 'stretch' }}>
        {/* Color bar */}
        <Box sx={{ width: 8, bgcolor: barColor, borderRadius: '4px', flexShrink: 0, alignSelf: 'stretch' }} />

        {/* Text content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.1rem', mb: 0.5 }}>
            {item.name}
          </Typography>
          {item.description && (
            <Typography sx={{ color: '#858585', fontSize: '1rem', lineHeight: 1.5, mb: 2 }}>
              {item.description}
            </Typography>
          )}
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1.5 }}>
            {item.time && (
              <Typography sx={{ color: '#6a6a6a', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {'⏰  '}{item.time}
              </Typography>
            )}
            {item.location && (
              <Typography sx={{ color: '#6a6a6a', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {'📍 '}{item.location}
              </Typography>
            )}
            {item.dress_code && (
              <Typography sx={{ color: '#6a6a6a', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {'👗 '}{item.dress_code}
              </Typography>
            )}
          </Stack>
          <Box
            onClick={(e) => { e.stopPropagation(); onMoreDetails?.(); }}
            sx={{ display: 'inline-block', cursor: 'pointer' }}
          >
            <Typography sx={{ color: '#DE3F5E', fontSize: '0.875rem' }}>
              <Box component="span" sx={{ fontWeight: 700, textDecoration: 'underline' }}>More details</Box>
              {' >'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Actions */}
      {!isViewOnly && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            sx={{ color: '#1a1a1a' }}
          >
            <Delete fontSize="small" />
          </IconButton>
          <Box
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            sx={{ cursor: 'grab', color: '#999', display: 'flex', alignItems: 'center' }}
          >
            <DragIndicator fontSize="small" />
          </Box>
        </Stack>
      )}
    </Box>
  );
}
