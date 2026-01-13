'use client';

import { useState, useRef, ChangeEvent } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CloudUpload, Delete, Image as ImageIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage, validateImageFile, deleteImage } from '@/lib/utils/image-upload';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  path: string;
  label?: string;
  helperText?: string;
  aspectRatio?: string;
  maxWidth?: number;
  maxHeight?: number;
  borderRadius?: number;
}

export default function ImageUpload({
  value,
  onChange,
  path,
  label = 'Upload Image',
  helperText,
  aspectRatio = '16/9',
  maxWidth = 800,
  maxHeight = 600,
  borderRadius = 2,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase
      const result = await uploadImage(file, path);

      if (result.success && result.url) {
        onChange(result.url);
        setPreview(result.url);
      } else {
        setError(result.error || 'Upload failed');
        setPreview(null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!value) return;

    setUploading(true);
    try {
      const success = await deleteImage(value);
      if (success) {
        onChange(null);
        setPreview(null);
        setError(null);
      } else {
        setError('Failed to delete image');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
        {label}
      </Typography>

      {helperText && (
        <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
          {helperText}
        </Typography>
      )}

      {/* Only show image box if there's a preview */}
      {preview && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: aspectRatio,
            maxWidth: maxWidth,
            borderRadius: borderRadius,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%' }}
            >
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              
              {!uploading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'background.paper',
                        opacity: 0.9,
                      },
                    }}
                  >
                    <CloudUpload />
                  </IconButton>
                  <IconButton
                    onClick={handleDelete}
                    sx={{
                      backgroundColor: 'background.paper',
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'background.paper',
                        opacity: 0.9,
                      },
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              )}
            </motion.div>
          </AnimatePresence>

          {uploading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Show upload button when no preview */}
      {!preview && (
        <Button
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          fullWidth
          sx={{
            borderColor: '#DE3F5E',
            color: '#DE3F5E',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            py: 1.5,
            '&:hover': {
              borderColor: '#C8365A',
              bgcolor: 'rgba(222, 63, 94, 0.05)',
            },
          }}
        >
          {uploading ? 'Uploading...' : 'Choose Image'}
        </Button>
      )}
    </Stack>
  );
}

