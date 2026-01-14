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
  Link as MuiLink,
  Divider,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Save, Palette, Check, VpnKey } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_PAPER_SX, ENHANCED_SECTION_SPACING, ENHANCED_CONTAINER_MAX_WIDTH } from '@/lib/constants/form-styles';
import { useRouter } from 'next/navigation';

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
  { name: 'Black', value: '#141414' },
  { name: 'Rose', value: '#DE3F5E' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Indigo', value: '#6366F1' },
];

const FONT_COLOR_OPTIONS = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#4a4a4a' },
  { name: 'Medium Gray', value: '#6a6a6a' },
  { name: 'White', value: '#FFFFFF' },
];

export default function DesignPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const router = useRouter();
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

  // Main website styling
  const [background, setBackground] = useState('');
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#DE3F5E');
  const [fontColor, setFontColor] = useState('#1a1a1a');
  const [buttonFontColor, setButtonFontColor] = useState('#FFFFFF');

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

        // Main website styling
        setBackground(wedding.background_image || '');
        setPrimaryColor(wedding.primary_color || '#DE3F5E');
        setFontColor(wedding.font_color || '#1a1a1a');
        setButtonFontColor(wedding.button_font_color || '#FFFFFF');

        // Pin entry customizations
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
      const pinBackgroundToUse = customPinEntryBackground || pinEntryBackground;

      await weddingService.updateWedding(weddingId!, {
        // Main website styling
        background_image: backgroundToUse,
        primary_color: primaryColor,
        font_color: fontColor,
        button_font_color: buttonFontColor,
        // Pin entry styling
        pin_entry_text: pinEntryText,
        pin_entry_subtitle_text: pinEntrySubtitleText,
        pin_entry_background: pinBackgroundToUse,
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

  // Generate preview text with couple name if placeholder is used
  const previewText = pinEntryText.replace(/\{couple_name\}/g, coupleName);
  const previewSubtitle = pinEntrySubtitleText.replace(/\{couple_name\}/g, coupleName);

  return (
    <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            Look & Feel
          </Typography>
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 400, color: '#6a6a6a' }}>
            Customize the visual design of your wedding website and pin entry screen
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

            {/* Color Selection - Compact */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Colors
              </Typography>

              <Grid container spacing={3}>
                {/* Primary Color */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a4a4a' }}>
                    Primary Color
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                    {COLOR_OPTIONS.map((color) => (
                      <Box
                        key={color.value}
                        onClick={() => setPrimaryColor(color.value)}
                        sx={{
                          width: 44,
                          height: 44,
                          backgroundColor: color.value,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: 2.5,
                          borderColor: primaryColor === color.value ? '#000' : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#666',
                            transform: 'scale(1.1)',
                          },
                        }}
                        title={color.name}
                      />
                    ))}
                  </Stack>
                  <TextField
                    label="Custom (Hex)"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    size="small"
                    placeholder="#DE3F5E"
                    sx={{ ...textFieldSx, maxWidth: '100%' }}
                  />
                </Grid>

                {/* Font Color */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a4a4a' }}>
                    Font Color
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                    {FONT_COLOR_OPTIONS.map((color) => (
                      <Box
                        key={color.value}
                        onClick={() => setFontColor(color.value)}
                        sx={{
                          width: 44,
                          height: 44,
                          backgroundColor: color.value,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: 2.5,
                          borderColor: fontColor === color.value ? primaryColor : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: primaryColor,
                            transform: 'scale(1.1)',
                          },
                          ...(color.value === '#FFFFFF' && {
                            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                          }),
                        }}
                        title={color.name}
                      />
                    ))}
                  </Stack>
                  <TextField
                    label="Custom (Hex)"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    size="small"
                    placeholder="#1a1a1a"
                    sx={{ ...textFieldSx, maxWidth: '100%' }}
                  />
                </Grid>

                {/* Button Font Color */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a4a4a' }}>
                    Button Font Color
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                    {FONT_COLOR_OPTIONS.map((color) => (
                      <Box
                        key={color.value}
                        onClick={() => setButtonFontColor(color.value)}
                        sx={{
                          width: 44,
                          height: 44,
                          backgroundColor: color.value,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: 2.5,
                          borderColor: buttonFontColor === color.value ? primaryColor : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: primaryColor,
                            transform: 'scale(1.1)',
                          },
                          ...(color.value === '#FFFFFF' && {
                            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                          }),
                        }}
                        title={color.name}
                      />
                    ))}
                  </Stack>
                  <TextField
                    label="Custom (Hex)"
                    value={buttonFontColor}
                    onChange={(e) => setButtonFontColor(e.target.value)}
                    size="small"
                    placeholder="#FFFFFF"
                    sx={{ ...textFieldSx, maxWidth: '100%' }}
                  />
                </Grid>
              </Grid>
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

            <Divider sx={{ my: 2 }} />

            {/* Pin Entry Screen Section */}
            <Box id="pin-entry-section">
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                  Pin Entry Screen
                </Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 1 }}>
                  Customize the styling and text for the pin entry screen that guests see when they first visit your site.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <VpnKey sx={{ fontSize: 16, color: '#DE3F5E' }} />
                  <MuiLink
                    component="button"
                    variant="body2"
                    onClick={() => router.push(`/admin/${weddingSlug}/pins`)}
                    sx={{
                      color: '#DE3F5E',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Manage invitation codes here
                  </MuiLink>
                </Box>
              </Box>

              {/* Pin Entry Text */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                  Welcome Text
                </Typography>
                <Stack spacing={2}>
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
              </Box>

              {/* Pin Entry Background */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                  Background Image
                </Typography>
                <Grid container spacing={2} mb={2}>
                  {BACKGROUND_OPTIONS.map((bg) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={bg.url}>
                      <Box
                        onClick={() => {
                          setPinEntryBackground(bg.url);
                          setCustomPinEntryBackground(null);
                        }}
                        sx={{
                          width: '100%',
                          height: 100,
                          backgroundImage: `url(${bg.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: 2.5,
                          borderColor: pinEntryBackground === bg.url && !customPinEntryBackground ? '#DE3F5E' : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#DE3F5E',
                            transform: 'scale(1.03)',
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'center', fontSize: '0.7rem' }}>
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
              </Box>

              {/* Pin Entry Colors - Compact */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                  Colors
                </Typography>
                <Grid container spacing={3}>
                  {/* Button Color */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a4a4a' }}>
                      Button Color
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                      {COLOR_OPTIONS.map((color) => (
                        <Box
                          key={color.value}
                          onClick={() => setPinEntryPrimaryColor(color.value)}
                          sx={{
                            width: 44,
                            height: 44,
                            backgroundColor: color.value,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: 2.5,
                            borderColor: pinEntryPrimaryColor === color.value ? '#000' : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: '#666',
                              transform: 'scale(1.1)',
                            },
                          }}
                          title={color.name}
                        />
                      ))}
                    </Stack>
                    <TextField
                      label="Custom (Hex)"
                      value={pinEntryPrimaryColor}
                      onChange={(e) => setPinEntryPrimaryColor(e.target.value)}
                      size="small"
                      placeholder="#141414"
                      sx={{ ...textFieldSx, maxWidth: '100%' }}
                    />
                  </Grid>

                  {/* Text Color */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a4a4a' }}>
                      Text Color
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                      {FONT_COLOR_OPTIONS.map((color) => (
                        <Box
                          key={color.value}
                          onClick={() => setPinEntryFontColor(color.value)}
                          sx={{
                            width: 44,
                            height: 44,
                            backgroundColor: color.value,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: 2.5,
                            borderColor: pinEntryFontColor === color.value ? pinEntryPrimaryColor : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: pinEntryPrimaryColor,
                              transform: 'scale(1.1)',
                            },
                            ...(color.value === '#FFFFFF' && {
                              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                            }),
                          }}
                          title={color.name}
                        />
                      ))}
                    </Stack>
                    <TextField
                      label="Custom (Hex)"
                      value={pinEntryFontColor}
                      onChange={(e) => setPinEntryFontColor(e.target.value)}
                      size="small"
                      placeholder="#000000"
                      sx={{ ...textFieldSx, maxWidth: '100%' }}
                    />
                  </Grid>

                  {/* Button Text Color */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a4a4a' }}>
                      Button Text Color
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.5 }}>
                      {FONT_COLOR_OPTIONS.map((color) => (
                        <Box
                          key={color.value}
                          onClick={() => setPinEntryButtonFontColor(color.value)}
                          sx={{
                            width: 44,
                            height: 44,
                            backgroundColor: color.value,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: 2.5,
                            borderColor: pinEntryButtonFontColor === color.value ? pinEntryPrimaryColor : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: pinEntryPrimaryColor,
                              transform: 'scale(1.1)',
                            },
                            ...(color.value === '#FFFFFF' && {
                              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                            }),
                          }}
                          title={color.name}
                        />
                      ))}
                    </Stack>
                    <TextField
                      label="Custom (Hex)"
                      value={pinEntryButtonFontColor}
                      onChange={(e) => setPinEntryButtonFontColor(e.target.value)}
                      size="small"
                      placeholder="#FFFFFF"
                      sx={{ ...textFieldSx, maxWidth: '100%' }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Pin Entry Preview */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
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

