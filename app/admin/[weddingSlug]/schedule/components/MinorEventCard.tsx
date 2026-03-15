'use client';

import { Box, Typography, Stack, IconButton } from '@mui/material';
import { Delete, DragIndicator } from '@mui/icons-material';
import { ScheduleItem } from '@/lib/supabase/wedding-service';

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
        bgcolor: 'white',
        border: '1px solid #EEE',
        borderRadius: '16px',
        px: 2, py: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        '&:hover': { borderColor: '#ddd' },
      }}
      onClick={onEdit}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.1rem', mb: 1 }}>
          {item.name}
        </Typography>
        <Stack direction="row" spacing={2}>
          {item.time && (
            <Typography sx={{ color: '#6a6a6a', fontSize: '0.875rem' }}>
              {'⏰  '}{item.time}
            </Typography>
          )}
          {item.location && (
            <Typography sx={{ color: '#6a6a6a', fontSize: '0.875rem' }}>
              {'📍 '}{item.location}
            </Typography>
          )}
        </Stack>
      </Box>

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
