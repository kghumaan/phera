'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  TextField,
  Fade,
  Snackbar,
  Alert,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Save, Check } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING, ENHANCED_CONTAINER_MAX_WIDTH } from '@/lib/constants/form-styles';

// Use the enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

// Consistent section Paper styling (matches other onboarding pages)
const sectionPaperSx = {
  p: 3,
  borderRadius: '16px',
  bgcolor: '#fafafa',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
};

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
  { name: 'Black', value: '#141414' },
  { name: 'Rose', value: '#DE3F5E' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
];

const FONT_COLOR_OPTIONS = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#4a4a4a' },
  { name: 'Medium Gray', value: '#6a6a6a' },
  { name: 'White', value: '#FFFFFF' },
];

export default function PinEntryCustomizationPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [coupleName, setCoupleName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('error');
  
  // Pin entry customization state
  const [pinEntryText, setPinEntryText] = useState('');
  const [pinEntrySubtitleText, setPinEntrySubtitleText] = useState('');
  const [pinEntryBackground, setPinEntryBackground] = useState('/images/backgrounds/pearl.png');
  const [customPinEntryBackground, setCustomPinEntryBackground] = useState<string | null>(null);
  const [pinEntryPrimaryColor, setPinEntryPrimaryColor] = useState('#141414');
  const [pinEntryFontColor, setPinEntryFontColor] = useState('#000000');
  const [pinEntryButtonFontColor, setPinEntryButtonFontColor] = useState('#FFFFFF');

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
        setCoupleName(wedding.couple_name);
        
        // Load pin entry customizations or use defaults
        const defaultText = `Please join ${wedding.couple_name} on their special night`;
        const defaultSubtitle = 'Enter your invitation code to see all the details and RSVP for our celebration';
        
        setPinEntryText(wedding.pin_entry_text || defaultText);
        setPinEntrySubtitleText(wedding.pin_entry_subtitle_text || defaultSubtitle);
        setPinEntryBackground(wedding.pin_entry_background || '/images/backgrounds/pearl.png');
        setPinEntryPrimaryColor(wedding.pin_entry_primary_color || '#141414');
        setPinEntryFontColor(wedding.pin_entry_font_color || '#000000');
        setPinEntryButtonFontColor(wedding.pin_entry_button_font_color || '#FFFFFF');
      }
    } catch (err) {
      console.error('Error loading pin entry settings:', err);
      const errorMessage = 'Failed to load pin entry settings';
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
      const backgroundToUse = customPinEntryBackground || pinEntryBackground;
      
      await weddingService.updateWedding(weddingId!, {
        pin_entry_text: pinEntryText,
        pin_entry_subtitle_text: pinEntrySubtitleText,
        pin_entry_background: backgroundToUse,
        pin_entry_primary_color: pinEntryPrimaryColor,
        pin_entry_font_color: pinEntryFontColor,
        pin_entry_button_font_color: pinEntryButtonFontColor,
      });

      setSuccess(true);
      setShowSaveSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowSaveSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Error saving pin entry settings:', err);
      const errorMessage = 'Failed to save pin entry settings';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner message="Loading pin entry settings..." />
      </Container>
    );
  }

  // Generate preview text with couple name if placeholder is used
  const previewText = pinEntryText.replace(/\{couple_name\}/g, coupleName);
  const previewSubtitle = pinEntrySubtitleText.replace(/\{couple_name\}/g, coupleName);

  return (
    <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        {/* Header */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Pin Entry Screen
          </Typography>
          <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
            Customize the styling, colors, and text displayed on your pin entry screen
          </Typography>
        </Box>

        {/* Text Customization Section */}
        <Paper sx={sectionPaperSx}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
            Welcome Text
          </Typography>
          
          <Stack spacing={3}>
            <TextField
              label="Main Heading"
              value={pinEntryText}
              onChange={(e) => setPinEntryText(e.target.value)}
              placeholder={`Please join ${coupleName} on their special night`}
              fullWidth
              multiline
              rows={2}
              helperText="Use {couple_name} as a placeholder for the couple's name"
              sx={textFieldSx}
            />

            <TextField
              label="Subtitle Text"
              value={pinEntrySubtitleText}
              onChange={(e) => setPinEntrySubtitleText(e.target.value)}
              placeholder="Enter your invitation code to see all the details and RSVP for our celebration"
              fullWidth
              multiline
              rows={2}
              helperText="This appears below the main heading"
              sx={textFieldSx}
            />
          </Stack>
        </Paper>

        {/* Background Selection Section */}
        <Paper sx={sectionPaperSx}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
            Background Image
          </Typography>
          
          <Grid container spacing={2} mb={3}>
            {BACKGROUND_OPTIONS.map((bg) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={bg.url}>
                <Box
                  onClick={() => {
                    setPinEntryBackground(bg.url);
                    setCustomPinEntryBackground(null);
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
                    borderColor: pinEntryBackground === bg.url && !customPinEntryBackground ? '#DE3F5E' : 'transparent',
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
              value={customPinEntryBackground}
              onChange={(url) => {
                setCustomPinEntryBackground(url);
                if (url) setPinEntryBackground('');
              }}
              path={getWeddingImagePath(weddingId, 'backgrounds')}
              helperText="Upload your own background image (recommended: 1920x1080px)"
              aspectRatio="16/9"
              maxWidth={600}
            />
          )}
        </Paper>

        {/* Colors Section */}
        <Paper sx={sectionPaperSx}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1a1a1a' }}>
            Colors
          </Typography>
          
          <Stack spacing={4}>
            {/* Button Color */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Button Color
              </Typography>
              
              <Grid container spacing={2} mb={2}>
                {COLOR_OPTIONS.map((color) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2 }} key={color.value}>
                    <Box
                      onClick={() => setPinEntryPrimaryColor(color.value)}
                      sx={{
                        width: '100%',
                        height: 80,
                        backgroundColor: color.value,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: 3,
                        borderColor: pinEntryPrimaryColor === color.value ? '#000' : 'transparent',
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
                label="Custom Button Color (Hex)"
                value={pinEntryPrimaryColor}
                onChange={(e) => setPinEntryPrimaryColor(e.target.value)}
                placeholder="#141414"
                sx={{ ...textFieldSx, maxWidth: 200 }}
              />
            </Box>

            {/* Text Color */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Text Color
              </Typography>
              
              <Grid container spacing={2} mb={2}>
                {FONT_COLOR_OPTIONS.map((color) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={color.value}>
                    <Box
                      onClick={() => setPinEntryFontColor(color.value)}
                      sx={{
                        width: '100%',
                        height: 80,
                        backgroundColor: color.value,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: 3,
                        borderColor: pinEntryFontColor === color.value ? pinEntryPrimaryColor : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: pinEntryPrimaryColor,
                          transform: 'scale(1.05)',
                        },
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
                label="Custom Text Color (Hex)"
                value={pinEntryFontColor}
                onChange={(e) => setPinEntryFontColor(e.target.value)}
                placeholder="#000000"
                sx={{ ...textFieldSx, maxWidth: 200 }}
              />
            </Box>

            {/* Button Text Color */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Button Text Color
              </Typography>
              
              <Grid container spacing={2} mb={2}>
                {FONT_COLOR_OPTIONS.map((color) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={color.value}>
                    <Box
                      onClick={() => setPinEntryButtonFontColor(color.value)}
                      sx={{
                        width: '100%',
                        height: 80,
                        backgroundColor: color.value,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: 3,
                        borderColor: pinEntryButtonFontColor === color.value ? pinEntryPrimaryColor : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: pinEntryPrimaryColor,
                          transform: 'scale(1.05)',
                        },
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
                label="Custom Button Text Color (Hex)"
                value={pinEntryButtonFontColor}
                onChange={(e) => setPinEntryButtonFontColor(e.target.value)}
                placeholder="#FFFFFF"
                sx={{ ...textFieldSx, maxWidth: 200 }}
              />
            </Box>
          </Stack>
        </Paper>

        {/* Preview Section */}
        <Paper sx={sectionPaperSx}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
            Preview
          </Typography>
          
          <Box
            sx={{
              width: '100%',
              height: 400,
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              backgroundImage: `url(${customPinEntryBackground || pinEntryBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Top Left Decorative Image */}
            <Box
              component="img"
              src="/images/overlays/entry-topleft.png"
              alt="Decorative Top Left"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1,
                width: '80px',
                height: 'auto',
                pointerEvents: 'none',
              }}
            />

            {/* Top Right Decorative Image */}
            <Box
              component="img"
              src="/images/overlays/entry-topright.png"
              alt="Decorative Top Right"
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 1,
                width: '80px',
                height: 'auto',
                pointerEvents: 'none',
              }}
            />

            {/* Preview Content */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 3,
                gap: 2,
              }}
            >
              {/* Logo */}
              <Box
                component="img"
                src="/logo-stacked.svg"
                alt="Phera Logo"
                sx={{
                  height: 50,
                  width: 'auto',
                  filter: 'brightness(0)',
                }}
              />

              {/* Heading */}
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'var(--font-instrument-serif), serif',
                  fontWeight: 400,
                  color: pinEntryFontColor,
                  fontSize: '1.5rem',
                  lineHeight: 1.3,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                {previewText || `Please join ${coupleName} on their special night`}
              </Typography>

              {/* Subtitle */}
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'var(--font-outfit), sans-serif',
                  color: pinEntryFontColor,
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                  maxWidth: 300,
                  mx: 'auto',
                  fontWeight: 400,
                  textAlign: 'center',
                }}
              >
                {previewSubtitle || 'Enter your invitation code to see all the details and RSVP for our celebration'}
              </Typography>

              {/* PIN Input Preview */}
              <Stack direction="row" spacing={1} justifyContent="center">
                {[0, 1, 2, 3].map((index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D6D6D6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-outfit), sans-serif',
                      fontWeight: 700,
                      color: 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {index === 0 ? '0' : ''}
                  </Box>
                ))}
              </Stack>

              {/* Button Preview */}
              <Button
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: pinEntryPrimaryColor,
                  color: pinEntryButtonFontColor,
                  borderRadius: '12px',
                  px: '16px',
                  py: '8px',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-outfit), sans-serif',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '6.25%',
                  minWidth: 150,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: pinEntryPrimaryColor,
                    opacity: 0.9,
                    boxShadow: 'none',
                  },
                }}
              >
                Continue
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Save Button */}
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
              borderRadius: '12px',
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
            {saving ? 'Saving...' : showSaveSuccess ? 'Saved!' : 'Save Settings'}
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
              Settings saved successfully!
            </Typography>
          </Fade>
        </Box>

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
