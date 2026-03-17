'use client';

import { Box, Typography, Stack, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';

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
        borderRadius: '12px',
        border: '1px dashed #BCBCBC',
        bgcolor: '#EBEBEB',
        overflow: 'hidden',
      }}>
        <ImageUpload
          label="Header Image"
          value={null}
          onChange={(url) => onChange(url || null)}
          path={getWeddingImagePath(weddingId, 'travel')}
          aspectRatio="16/9"
          maxWidth={800}
          helperText="This image appears at the top of the Travel & Stay section for your guests"
        />
      </Box>
    );
  }

  // Has image — show preview with hover actions
  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        '&:hover .header-actions': { opacity: 1 },
      }}
    >
      <Box
        component="img"
        src={imageUrl}
        alt="Travel header"
        sx={{
          maxWidth: '100%',
          maxHeight: 160,
          width: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* Gradient overlay with title */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
          p: 2,
          pt: 4,
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Header Image
        </Typography>
      </Box>

      {/* Action buttons — visible on hover */}
      {!isViewOnly && (
        <Stack
          className="header-actions"
          direction="row"
          spacing={0.5}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            opacity: 0,
            transition: 'opacity 0.15s',
          }}
        >
          <IconButton
            size="small"
            onClick={() => {
              // Trigger file picker by creating a hidden ImageUpload
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
            sx={{
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              width: 32,
              height: 32,
            }}
          >
            <Edit sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onChange(null)}
            sx={{
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(222,63,94,0.9)' },
              width: 32,
              height: 32,
            }}
          >
            <Delete sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      )}
    </Box>
  );
}
