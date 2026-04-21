'use client';

import { Box, Typography, Stack, IconButton } from '@mui/material';
import { Delete, DragIndicator, VisibilityOff } from '@mui/icons-material';
import { TravelSection } from '@/lib/supabase/wedding-service';
import { TRAVEL_ICON_MAP } from './travel-utils';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface TravelSectionCardProps {
  section: TravelSection;
  onEdit: () => void;
  onDelete: () => void;
  onEditDetails?: () => void;
  dragHandleProps?: Record<string, any>;
  isViewOnly?: boolean;
}

export default function TravelSectionCard({
  section,
  onEdit,
  onDelete,
  onEditDetails,
  dragHandleProps,
  isViewOnly,
}: TravelSectionCardProps) {
  const IconComponent = TRAVEL_ICON_MAP[section.type];
  const hasMoreDetails = !!section.more_details;

  return (
    <Box
      onClick={onEdit}
      sx={{
        borderRadius: RADII.lg,
        bgcolor: COLORS.bg.white,
        border: '1px solid rgba(0,0,0,0.07)',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
        transition: 'box-shadow 0.2s',
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          {/* Drag handle */}
          {!isViewOnly && (
            <Box
              {...dragHandleProps}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              sx={{
                cursor: 'grab',
                color: COLORS.border.default,
                display: 'flex',
                '&:hover': { color: COLORS.text.faint },
              }}
            >
              <DragIndicator fontSize="small" />
            </Box>
          )}

          {/* Icon */}
          <Box sx={{ color: COLORS.text.subtle, display: 'flex' }}>
            {IconComponent && <IconComponent fontSize="small" />}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: COLORS.text.strong, lineHeight: 1.3 }}>
                {section.title || 'Untitled'}
              </Typography>
              {section.visible === false && (
                <VisibilityOff sx={{ fontSize: 16, color: COLORS.text.faint }} />
              )}
            </Stack>

            {section.content && (
              <Typography
                variant="body2"
                sx={{
                  color: COLORS.text.subtle,
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {section.content}
              </Typography>
            )}

            {section.type === 'hotel' && section.address && (
              <Typography variant="caption" sx={{ color: COLORS.text.subtle, display: 'block', mt: 0.5 }}>
                {section.address}
              </Typography>
            )}

            {hasMoreDetails && (
              <Typography
                variant="caption"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditDetails?.();
                }}
                sx={{
                  color: COLORS.brand.primary,
                  mt: 0.5,
                  display: 'inline-block',
                  cursor: 'pointer',
                  fontWeight: 500,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                More details &gt;
              </Typography>
            )}
          </Box>

          {/* Actions */}
          {!isViewOnly && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              sx={{ color: COLORS.text.subtle, p: 0, flexShrink: 0 }}
            >
              <Delete fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
