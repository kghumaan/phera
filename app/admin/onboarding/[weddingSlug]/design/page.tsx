'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Alert,
  Grid,
  TextField,
  alpha,
  Fade,
  Snackbar,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Save, Palette, Check } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_PAPER_SX, ENHANCED_SECTION_SPACING, ENHANCED_CONTAINER_MAX_WIDTH } from '@/lib/constants/form-styles';

// Use the enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

const BACKGROUND_OPTIONS = [
  { name: 'Pearl', url: '/images/backgrounds/pearl.png' },
  { name: 'Jade', url: '/images/backgrounds/jade.png' },
  { name: 'Rose Quartz', url: '/images/backgrounds/rose-quartz.png' },
  { name: 'Lavender', url: '/images/backgrounds/lavendar.png' },
  { name: 'Blue Clouds', url: '/images/backgrounds/blue-clouds.jpg' },
  { name: 'Green', url: '/images/backgrounds/green.jpg' },
  { name: 'Rose', url: '/images/backgrounds/rose.jpg' },
];

const COLOR_OPTIONS = [
  { name: 'Rose', value: '#DE3F5E' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
];

const FONT_COLOR_OPTIONS = [
  { name: 'Black', value: '#1a1a1a' },
  { name: 'Dark Gray', value: '#4a4a4a' },
  { name: 'Medium Gray', value: '#6a6a6a' },
  { name: 'White', value: '#FFFFFF' },
];

export default function DesignPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('error');
  const [background, setBackground] = useState('');
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#DE3F5E');
  const [fontColor, setFontColor] = useState('#1a1a1a');
  const [buttonFontColor, setButtonFontColor] = useState('#FFFFFF');

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const showToast = (message: string, severity: 'error' | 'success' | 'info' | 'warning' = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        setBackground(wedding.background_image || '');
        setPrimaryColor(wedding.primary_color || '#DE3F5E');
        setFontColor(wedding.font_color || '#1a1a1a');
        setButtonFontColor(wedding.button_font_color || '#FFFFFF');
      }
    } catch (err) {
      console.error('Error loading design settings:', err);
      const errorMessage = 'Failed to load design settings';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const backgroundToUse = customBackground || background;
      
      await weddingService.updateWedding(weddingId!, {
        background_image: backgroundToUse,
        primary_color: primaryColor,
        font_color: fontColor,
        button_font_color: buttonFontColor,
      });

      setSuccess(true);
      setShowSaveSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowSaveSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Error saving design:', err);
      const errorMessage = 'Failed to save design settings';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner message="Loading design settings..." />
      </Container>
    );
  }

  return (
    <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            Look & Feel
          </Typography>
          <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
            Customize the visual design of your wedding website
          </Typography>
        </Box>


        <Paper sx={ENHANCED_PAPER_SX}>
          <Stack spacing={ENHANCED_SECTION_SPACING}>
            {/* Background Selection */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Background Image
              </Typography>
              
              <Grid container spacing={2} mb={3}>
                {BACKGROUND_OPTIONS.map((bg) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={bg.url}>
                    <Box
                      onClick={() => {
                        setBackground(bg.url);
                        setCustomBackground(null);
                      }}
                      sx={{
                        width: '100%',
                        height: 120,
                        backgroundImage: `url(${bg.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: 3,
                        borderColor: background === bg.url ? '#DE3F5E' : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#DE3F5E',
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                      {bg.name}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {weddingId && (
                <ImageUpload
                  label="Upload Custom Background"
                  value={customBackground}
                  onChange={(url) => {
                    setCustomBackground(url);
                    if (url) setBackground('');
                  }}
                  path={getWeddingImagePath(weddingId, 'backgrounds')}
                  helperText="Upload your own background image (recommended: 1920x1080px)"
                  aspectRatio="16/9"
                  maxWidth={600}
                />
              )}
            </Box>

            {/* Color Selection */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Primary Color
              </Typography>
              
              <Grid container spacing={2} mb={3}>
                {COLOR_OPTIONS.map((color) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2 }} key={color.value}>
                    <Box
                      onClick={() => setPrimaryColor(color.value)}
                      sx={{
                        width: '100%',
                        height: 80,
                        backgroundColor: color.value,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: 3,
                        borderColor: primaryColor === color.value ? '#000' : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#666',
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: '#1a1a1a' }}>
                      {color.name}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <TextField
                label="Custom Color (Hex)"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#DE3F5E"
                sx={{ ...textFieldSx, maxWidth: 200 }}
              />
            </Box>

            {/* Font Color Selection */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Font Color
              </Typography>
              
              <Grid container spacing={2} mb={3}>
                {FONT_COLOR_OPTIONS.map((color) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={color.value}>
                    <Box
                      onClick={() => setFontColor(color.value)}
                      sx={{
                        width: '100%',
                        height: 80,
                        backgroundColor: color.value,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: 3,
                        borderColor: fontColor === color.value ? primaryColor : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: primaryColor,
                          transform: 'scale(1.05)',
                        },
                        // Add border for white option so it's visible
                        ...(color.value === '#FFFFFF' && {
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                        }),
                      }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: '#1a1a1a' }}>
                      {color.name}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <TextField
                label="Custom Font Color (Hex)"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                placeholder="#1a1a1a"
                sx={{ ...textFieldSx, maxWidth: 200 }}
              />
            </Box>

            {/* Button Font Color Selection */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Button Font Color
              </Typography>
              
              <Grid container spacing={2} mb={3}>
                {FONT_COLOR_OPTIONS.map((color) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={color.value}>
                    <Box
                      onClick={() => setButtonFontColor(color.value)}
                      sx={{
                        width: '100%',
                        height: 80,
                        backgroundColor: color.value,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: 3,
                        borderColor: buttonFontColor === color.value ? primaryColor : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: primaryColor,
                          transform: 'scale(1.05)',
                        },
                        // Add border for white option so it's visible
                        ...(color.value === '#FFFFFF' && {
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                        }),
                      }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: '#1a1a1a' }}>
                      {color.name}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <TextField
                label="Custom Button Font Color (Hex)"
                value={buttonFontColor}
                onChange={(e) => setButtonFontColor(e.target.value)}
                placeholder="#FFFFFF"
                sx={{ ...textFieldSx, maxWidth: 200 }}
              />
            </Box>

            {/* Preview */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Preview
              </Typography>
              
              <Box
                sx={{
                  width: '100%',
                  height: 300,
                  backgroundImage: `url(${customBackground || background})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  p: 4,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontWeight: 700,
                    color: fontColor,
                    textAlign: 'center',
                  }}
                >
                  Sample Text
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: primaryColor,
                    color: buttonFontColor,
                    '&:hover': {
                      backgroundColor: primaryColor,
                      opacity: 0.9,
                    },
                  }}
                >
                  Sample Button
                </Button>
              </Box>
            </Box>

            {/* Save Button with Inline Success */}
            <Box sx={{ position: 'relative', display: 'inline-block', width: 'fit-content' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={showSaveSuccess ? <Check /> : <Save />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: showSaveSuccess ? '#10B981' : '#DE3F5E',
                  color: 'white',
                  py: 1.5,
                  px: 4,
                  borderRadius: '32px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: showSaveSuccess 
                    ? '0 4px 12px rgba(16, 185, 129, 0.4)' 
                    : '0 4px 12px rgba(222, 63, 94, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: showSaveSuccess ? '#059669' : '#C8365A',
                    boxShadow: showSaveSuccess 
                      ? '0 6px 16px rgba(16, 185, 129, 0.5)' 
                      : '0 6px 16px rgba(222, 63, 94, 0.4)',
                  },
                  '&:disabled': {
                    bgcolor: 'rgba(222, 63, 94, 0.5)',
                  },
                }}
              >
                {saving ? 'Saving...' : showSaveSuccess ? 'Design Saved!' : 'Save Design'}
              </Button>
              
              {/* Success message below button */}
              <Fade in={showSaveSuccess}>
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    mt: 1,
                    color: '#10B981',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Design saved successfully!
                </Typography>
              </Fade>
            </Box>
          </Stack>
        </Paper>

        {/* Toast Notification */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Stack>
    </Container>
  );
}

