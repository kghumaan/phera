'use client';

import { Box, Typography, Stack, IconButton } from '@mui/material';
import { Edit, Delete, Image as ImageIcon } from '@mui/icons-material';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface TravelHeaderImageProps {
  imageUrl: string | null;
  weddingId: string;
  onChange: (url: string | null) => void;
  isViewOnly?: boolean;
}

export default function TravelHeaderImage({
  imageUrl,
  weddingId,
  onChange,
  isViewOnly,
}: TravelHeaderImageProps) {
  if (isViewOnly && !imageUrl) return null;

  // No image yet — show upload prompt
  if (!imageUrl) {
    return (
      <Box sx={{
        borderRadius: RADII.lg,
        bgcolor: COLORS.bg.white,
        border: '1px solid rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}>
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
            <Box sx={{ color: COLORS.text.subtle, display: 'flex' }}>
              <ImageIcon fontSize="small" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: COLORS.text.strong, lineHeight: 1.3, mb: 0.5 }}>
                Header Image
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 1.5 }}>
                This image appears at the top of the Travel &amp; Stay section for your guests
              </Typography>
              <ImageUpload
                label=""
                value={null}
                onChange={(url) => onChange(url || null)}
                path={getWeddingImagePath(weddingId, 'travel')}
                aspectRatio="16/9"
                maxWidth={800}
              />
            </Box>
          </Stack>
        </Box>
      </Box>
    );
  }

  // Has image — show info + actions on left, thumbnail on right
  return (
    <Box
      sx={{
        borderRadius: RADII.lg,
        bgcolor: COLORS.bg.white,
        border: '1px solid rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ color: COLORS.text.subtle, display: 'flex' }}>
            <ImageIcon fontSize="small" />
          </Box>
          <Stack direction="row" alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }} spacing={2}>
            {/* Left side — title, description */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: COLORS.text.strong, lineHeight: 1.3, mb: 0.5 }}>
                Header Image
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                This image appears at the top of the Travel &amp; Stay section for your guests
              </Typography>
            </Box>
            {/* Right side — image thumbnail */}
            <Box
              sx={{
                borderRadius: RADII.sm,
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.07)',
                flexShrink: 0,
                maxWidth: 260,
              }}
            >
              <Box
                component="img"
                src={imageUrl}
                alt="Travel header"
                sx={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                }}
              />
            </Box>
            {/* Actions */}
            {!isViewOnly && (
              <Stack spacing={0.5} sx={{ flexShrink: 0 }}>
                <IconButton
                  size="small"
                  onClick={() => onChange(null)}
                  sx={{ color: COLORS.text.subtle, p: 0, '&:hover': { color: COLORS.brand.primary } }}
                >
                  <Delete fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const { uploadImage } = await import('@/lib/utils/image-upload');
                      const result = await uploadImage(file, getWeddingImagePath(weddingId, 'travel'));
                      if (result.success && result.url) {
                        onChange(result.url);
                      }
                    };
                    input.click();
                  }}
                  sx={{ color: COLORS.text.subtle, p: 0, '&:hover': { color: COLORS.brand.primary } }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
