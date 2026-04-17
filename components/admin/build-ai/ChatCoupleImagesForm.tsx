'use client';

import { useState } from 'react';
import { Box, Typography, IconButton, alpha } from '@mui/material';
import { Add, Delete, Check } from '@mui/icons-material';
import { uploadImage } from '@/lib/utils/image-upload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import { ActionButton, PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ChatCoupleImagesFormProps {
  onSave: (images: string[]) => void;
  onCancel: () => void;
  weddingId: string | null;
  currentImages?: string[];
}

export default function ChatCoupleImagesForm({ onSave, onCancel, weddingId, currentImages = [] }: ChatCoupleImagesFormProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [uploading, setUploading] = useState(false);

  const handleAddPhoto = () => {
    if (!weddingId || images.length >= 6) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (!files.length) return;

      setUploading(true);
      const remaining = 6 - images.length;
      const toUpload = files.slice(0, remaining);

      const newImages = [...images];
      for (const file of toUpload) {
        const result = await uploadImage(file, getWeddingImagePath(weddingId, 'couple'));
        if (result.success && result.url) {
          newImages.push(result.url);
        }
      }
      setImages(newImages.slice(0, 6));
      setUploading(false);
    };
    input.click();
  };

  const handleDelete = async (index: number) => {
    const url = images[index];
    if (url && !url.includes('placeholder')) {
      const { deleteImage } = await import('@/lib/utils/image-upload');
      await deleteImage(url);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{
      bgcolor: COLORS.bg.white,
      p: 3,
      borderRadius: RADII.lg,
      border: '2px solid',
      borderColor: alpha(COLORS.text.strong, 0.12),
      width: '100%',
      maxWidth: 640,
      mt: 1,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: COLORS.text.strong, fontSize: '1rem' }}>
        Couple Photos
      </Typography>
      <Typography variant="caption" sx={{ color: COLORS.text.subtle, mb: 2, display: 'block' }}>
        Upload up to 6 photos of the couple. These appear on your wedding website homepage.
      </Typography>

      {/* Thumbnails */}
      {images.length > 0 && (
        <Box sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          mb: 2,
        }}>
          {images.map((img, index) => (
            <Box
              key={index}
              sx={{
                position: 'relative',
                width: 90,
                height: 90,
                borderRadius: RADII.sm,
                overflow: 'hidden',
                border: index === 0 ? '3px solid #DE3F5E' : '2px solid #e0e0e0',
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src={img}
                alt={`Couple photo ${index + 1}`}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {index === 0 && (
                <Typography sx={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  bgcolor: COLORS.brand.primary,
                  color: COLORS.text.inverse,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: '4px',
                }}>
                  Main
                </Typography>
              )}
              <IconButton
                size="small"
                onClick={() => handleDelete(index)}
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: COLORS.text.inverse,
                  width: 22,
                  height: 22,
                  '&:hover': { bgcolor: 'rgba(222,63,94,0.9)' },
                }}
              >
                <Delete sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* Add button */}
      {images.length < 6 && (
        <ActionButton
          variant="outlined"
          startIcon={<Add />}
          loading={uploading}
          onClick={handleAddPhoto}
          disabled={!weddingId}
          sx={{
            borderColor: COLORS.brand.primary,
            color: COLORS.brand.primary,
            borderRadius: RADII.md,
            textTransform: 'none',
            fontWeight: 600,
            mb: 2,
            '&:hover': { borderColor: '#c73552', bgcolor: 'rgba(222,63,94,0.04)' },
          }}
        >
          {`Add Photo${images.length > 0 ? ` (${images.length}/6)` : ''}`}
        </ActionButton>
      )}

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%' }}>
        <SecondaryActionButton
          onClick={onCancel}
          size="small"
          fullWidth
          sx={{
            color: COLORS.text.subtle,
            fontSize: '0.85rem',
            py: 1,
            borderRadius: RADII.lg,
            flex: 1,
            border: '2px solid',
            borderColor: 'rgba(0,0,0,0.1)',
            '&:hover': { border: '2px solid', borderColor: 'rgba(0,0,0,0.2)', bgcolor: 'rgba(0,0,0,0.02)' },
          }}
        >
          Skip
        </SecondaryActionButton>
        <PrimaryActionButton
          onClick={() => onSave(images)}
          size="small"
          fullWidth
          disabled={images.length === 0}
          sx={{
            borderRadius: RADII.lg,
            fontSize: '0.85rem',
            py: 1,
            flex: 1,
          }}
        >
          Save Photos
        </PrimaryActionButton>
      </Box>
    </Box>
  );
}
