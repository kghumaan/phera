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
import { Save, Palette, Check, VpnKey, LocationOnOutlined } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MobilePreviewFrame from '@/components/admin/MobilePreviewFrame';
import ReadOnlyComments from '@/components/preview/ReadOnlyComments';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_PAPER_SX, ENHANCED_SECTION_SPACING, ENHANCED_CONTAINER_MAX_WIDTH } from '@/lib/constants/form-styles';
import { useRouter } from 'next/navigation';
import { parseISO } from 'date-fns';

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
  { name: 'Orange', value: '#F97316' },
  { name: 'Blue', value: '#479AB4' },
  { name: 'Midnight Green', value: '#003139' },
];

const FONT_COLOR_OPTIONS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
];

export default function DesignPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [coupleName, setCoupleName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueLocation, setVenueLocation] = useState('');
  const [venueFlag, setVenueFlag] = useState<string | null>(null);
  const [coupleImageUrl, setCoupleImageUrl] = useState<string | null>(null);
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

  // Countdown timer state
  const [weddingDateStart, setWeddingDateStart] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Countdown timer logic
  useEffect(() => {
    if (!weddingDateStart) return;

    const calculateTimeLeft = () => {
      const difference = weddingDateStart.getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44));
      const days = Math.floor((difference % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ months, days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [weddingDateStart]);

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
        setWeddingDate(wedding.wedding_date_display || '');
        setVenueName(wedding.venue_name || '');
        setVenueLocation(wedding.venue_location || '');
        setVenueFlag(wedding.venue_flag || null);
        setCoupleImageUrl(wedding.couple_image_url || null);

        // Parse wedding date for countdown
        if (wedding.wedding_date) {
          try {
            const parsedDate = parseISO(wedding.wedding_date);
            setWeddingDateStart(parsedDate);
          } catch (err) {
            console.error('Error parsing wedding date:', err);
          }
        }

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

  // Countdown Timer Component
  const PreviewCountdown = () => {
    const timeUnits = [
      { label: 'months', value: timeLeft.months },
      { label: 'days', value: timeLeft.days },
      { label: 'hours', value: timeLeft.hours },
      { label: 'mins', value: timeLeft.minutes },
      { label: 'secs', value: timeLeft.seconds }
    ];

    return (
      <Box sx={{
        bgcolor: '#FFFFFF',
        borderRadius: 8,
        p: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
      }}>
        <Stack direction="row" spacing={2.5} justifyContent="center" alignItems="center">
          {timeUnits.map((unit) => (
            <Stack key={unit.label} alignItems="center" spacing={0.5} sx={{ minWidth: 60 }}>
              <Typography sx={{
                fontWeight: 700,
                color: '#000000',
                fontSize: 64,
                fontFamily: 'Outfit',
                lineHeight: 1
              }}>
                {unit.value}
              </Typography>
              <Typography sx={{
                color: '#000000',
                fontSize: 11,
                fontFamily: 'Outfit',
                textAlign: 'center',
                opacity: 0.7,
                textTransform: 'lowercase'
              }}>
                {unit.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    );
  };

  // Mobile Preview Component
  const MobilePreview = () => (
    <MobilePreviewFrame
      title="Preview"
      backgroundImage={customBackground || background}
      overlay={
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            px: 3,
            py: 2.5,
            borderRadius: '0px 0px 20px 20px',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: primaryColor,
              color: buttonFontColor,
              borderRadius: '16px',
              py: 1.5,
              fontSize: 14,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'Outfit',
              '&:hover': {
                bgcolor: primaryColor,
                opacity: 0.9,
              },
            }}
          >
            View Details
          </Button>
        </Box>
      }
    >
      <Box sx={{ pt: 2, pb: 14, px: 2 }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          {/* Couple Photo Section */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 320,
              aspectRatio: '1',
              mx: 'auto',
            }}
          >
            {/* Frame Background */}
            <Box
              component="img"
              src="/images/frames/frame-27.png"
              alt="Decorative frame"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                zIndex: 1,
              }}
            />

            {/* Couple Image */}
            <Box
              sx={{
                position: 'absolute',
                top: '7%',
                left: '7%',
                width: '87%',
                height: '87%',
                overflow: 'hidden',
                zIndex: 2,
              }}
            >
              {coupleImageUrl ? (
                <Box
                  component="img"
                  src={coupleImageUrl}
                  alt="Couple Photo"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    No Photo
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Date */}
          <Typography
            sx={{
              color: fontColor,
              fontSize: '0.85rem',
              letterSpacing: '0.5px',
              fontFamily: 'Outfit',
              textTransform: 'uppercase',
            }}
          >
            {weddingDate || '1 JANUARY, 2026'}
          </Typography>

          {/* Names */}
          <Typography
            variant="h4"
            sx={{
              fontSize: '1.75rem',
              color: fontColor,
              lineHeight: 1.2,
              fontFamily: 'var(--font-instrument-serif)',
              fontStyle: 'italic',
            }}
          >
            {coupleName || 'Couple Names'}
          </Typography>

          {/* Venue */}
          <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
            <LocationOnOutlined sx={{ fontSize: 14, color: '#666' }} />
            <Typography
              sx={{
                color: fontColor,
                fontSize: '0.85rem',
                textDecoration: 'underline',
                fontFamily: 'Outfit',
              }}
            >
              {venueName || 'Venue Name'}
            </Typography>
            {venueLocation && (
              <Typography sx={{ fontSize: '0.85rem', color: fontColor }}>
                {venueLocation}
              </Typography>
            )}
            {venueFlag && (
              <Typography sx={{ fontSize: '1rem' }}>
                {venueFlag}
              </Typography>
            )}
          </Stack>

          {/* Countdown Timer */}
          {weddingDateStart && (
            <Box sx={{ width: '100%' }}>
              <PreviewCountdown />
            </Box>
          )}

          {/* Comments Section */}
          <Box sx={{ width: '100%' }}>
            <ReadOnlyComments />
          </Box>
        </Stack>
      </Box>
    </MobilePreviewFrame>
  );

  return (
    <Container maxWidth={false} sx={{ maxWidth: '100%', px: { xs: 2, md: 4, lg: 6 } }}>
      <Grid container spacing={6}>
        {/* Left Column - Form Controls */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={ENHANCED_SECTION_SPACING} sx={{ pt: { xs: 6, lg: 0 } }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Look & Feel
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Customize your website theme and styling
              </Typography>
            </Box>

        <Paper sx={ENHANCED_PAPER_SX}>
          <Stack spacing={ENHANCED_SECTION_SPACING}>
            {/* Background Selection */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Background Image
              </Typography>

              {/* Horizontal Scrollable Background Options */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  pb: 2,
                  mb: 3,
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: alpha('#000', 0.05),
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha('#DE3F5E', 0.5),
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#DE3F5E',
                    },
                  },
                }}
              >
                {BACKGROUND_OPTIONS.map((bg) => (
                  <Box key={bg.url} sx={{ flexShrink: 0 }}>
                    <Box
                      onClick={() => {
                        setBackground(bg.url);
                        setCustomBackground(null);
                      }}
                      sx={{
                        width: 160,
                        height: 120,
                        backgroundImage: `url(${bg.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: 3,
                        borderColor: background === bg.url && !customBackground ? '#DE3F5E' : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#DE3F5E',
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', fontSize: '0.75rem' }}>
                      {bg.name}
                    </Typography>
                  </Box>
                ))}
              </Box>

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

                {/* Horizontal Scrollable Background Options */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    pb: 2,
                    mb: 2,
                    '&::-webkit-scrollbar': {
                      height: 8,
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: alpha('#000', 0.05),
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: alpha('#DE3F5E', 0.5),
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: '#DE3F5E',
                      },
                    },
                  }}
                >
                  {BACKGROUND_OPTIONS.map((bg) => (
                    <Box key={bg.url} sx={{ flexShrink: 0 }}>
                      <Box
                        onClick={() => {
                          setPinEntryBackground(bg.url);
                          setCustomPinEntryBackground(null);
                        }}
                        sx={{
                          width: 160,
                          height: 100,
                          backgroundImage: `url(${bg.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: '12px',
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
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', fontSize: '0.75rem' }}>
                        {bg.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
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
        </Grid>

        {/* Right Column - Fixed Mobile Preview (Desktop only) */}
        <Grid size={{ xs: 12, lg: 5 }} sx={{ display: { xs: 'none', lg: 'block' }, position: 'relative' }}>
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '79.17%',
              transform: 'translate(-50%, -50%)',
              width: { lg: '520px' },
              height: '100vh',
              maxWidth: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MobilePreview />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

