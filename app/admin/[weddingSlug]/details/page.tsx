'use client';

import {
  Box,
  Container,
  Typography,
  TextField,
  Stack,
  Paper,
  Button,
  Alert,
  Grid,
  alpha,
  IconButton,
  Fade,
  Chip,
  Snackbar,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Save, Check, Add, ArrowForward, Delete, Edit, Cancel, LocationOnOutlined } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import ImageUpload from '@/components/admin/ImageUpload';
import { weddingService } from '@/lib/supabase/wedding-service';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MobilePreviewFrame from '@/components/admin/MobilePreviewFrame';
import ReadOnlyComments from '@/components/preview/ReadOnlyComments';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';

// Use enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

interface DetailsFormData {
  couple_name: string;
  partner1_name: string;
  partner2_name: string;
  wedding_date_display: string;
  venue_name: string;
  venue_location: string;
  venue_flag: string | null;
  rsvp_deadline: string;
  couple_image_url: string | null;
  frame_image_url: string | null;
  background_image?: string;
  primary_color?: string;
  font_color?: string;
  button_font_color?: string;
  show_venue_location: boolean;
}

// Helper function to generate couple name from first names
const generateCoupleName = (partner1Name: string, partner2Name: string): string => {
  const partner1First = partner1Name.trim().split(' ')[0];
  const partner2First = partner2Name.trim().split(' ')[0];
  if (!partner1First && !partner2First) return '';
  if (!partner1First) return partner2First;
  if (!partner2First) return partner1First;
  return `${partner1First} & ${partner2First}`;
};

// Helper function to format wedding date display
const formatWeddingDateDisplay = (startDate: Date | null, endDate: Date | null): string => {
  if (!startDate) return '';

  if (!endDate) {
    // Single day event
    return format(startDate, 'd MMMM, yyyy').toUpperCase();
  }

  const startDay = format(startDate, 'd');
  const endDay = format(endDate, 'd');
  const startMonth = format(startDate, 'MMMM').toUpperCase();
  const endMonth = format(endDate, 'MMMM').toUpperCase();
  const startYear = format(startDate, 'yyyy');
  const endYear = format(endDate, 'yyyy');

  if (startYear !== endYear) {
    return `${format(startDate, 'd MMMM, yyyy').toUpperCase()} - ${format(endDate, 'd MMMM, yyyy').toUpperCase()}`;
  }

  if (startMonth !== endMonth) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}, ${startYear}`;
  }

  if (startDay === endDay) {
    return format(startDate, 'd MMMM, yyyy').toUpperCase();
  }

  return `${startDay}-${endDay} ${startMonth}, ${startYear}`;
};

export default function DetailsPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [coupleImages, setCoupleImages] = useState<(string | null)[]>(Array(6).fill(null));
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('error');

  // Date state for date pickers
  const [weddingDateStart, setWeddingDateStart] = useState<Date | null>(null);
  const [weddingDateEnd, setWeddingDateEnd] = useState<Date | null>(null);
  const [isOneDayEvent, setIsOneDayEvent] = useState(true);
  const [dateDisplayManuallyEdited, setDateDisplayManuallyEdited] = useState(false);

  // Inline editing state
  const [editingCoupleName, setEditingCoupleName] = useState(false);
  const [editingDateDisplay, setEditingDateDisplay] = useState(false);
  const [tempCoupleName, setTempCoupleName] = useState('');
  const [tempDateDisplay, setTempDateDisplay] = useState('');

  const [formData, setFormData] = useState<DetailsFormData>({
    couple_name: '',
    partner1_name: '',
    partner2_name: '',
    wedding_date_display: '',
    venue_name: '',
    venue_location: '',
    venue_flag: null,
    rsvp_deadline: '',
    couple_image_url: null,
    frame_image_url: null,
    show_venue_location: true,
  });

  // Countdown timer logic for preview
  const calculateTimeLeft = (targetDate: Date | null) => {
    if (!targetDate) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const difference = targetDate.getTime() - new Date().getTime();
    if (difference <= 0) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      months: Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44)),
      days: Math.floor((difference % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(weddingDateStart));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(weddingDateStart));
    }, 1000);
    return () => clearInterval(timer);
  }, [weddingDateStart]);

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
        width: '100%', // Full width
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

  useEffect(() => {
    loadWeddingData();
  }, [weddingSlug]);

  const showToast = (message: string, severity: 'error' | 'success' | 'info' | 'warning' = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const loadWeddingData = async () => {
    console.log('🔍 Loading wedding data for slug:', weddingSlug);
    try {
      console.log('📡 Calling weddingService.getWeddingBySlug...');
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      console.log('✅ Wedding data received:', wedding);

      if (wedding) {
        setWeddingId(wedding.id);

        // Parse dates safely
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        try {
          if (wedding.wedding_date) {
            startDate = parseISO(wedding.wedding_date);
            if (isNaN(startDate.getTime())) startDate = null;
          }
          if (wedding.wedding_date_end) {
            endDate = parseISO(wedding.wedding_date_end);
            if (isNaN(endDate.getTime())) endDate = null;
          }
        } catch (err) {
          console.error('Error parsing dates:', err);
        }
        const isSingleDay: boolean = !endDate || (startDate !== null && endDate !== null && startDate.getTime() === endDate.getTime());

        setWeddingDateStart(startDate);
        setWeddingDateEnd(endDate);
        setIsOneDayEvent(isSingleDay);

        // Generate couple name from bride/groom names
        const autoCoupleName = generateCoupleName(
          wedding.partner1_name || '',
          wedding.partner2_name || ''
        ) || wedding.couple_name || '';

        setFormData({
          couple_name: autoCoupleName,
          partner1_name: wedding.partner1_name || '',
          partner2_name: wedding.partner2_name || '',
          wedding_date_display: wedding.wedding_date_display || '',
          venue_name: wedding.venue_name || '',
          venue_location: wedding.venue_location || '',
          venue_flag: wedding.venue_flag || null,
          rsvp_deadline: wedding.rsvp_deadline || '',
          couple_image_url: wedding.couple_image_url || null,
          frame_image_url: wedding.frame_image_url || null,
          show_venue_location: wedding.show_venue_location ?? true,
          background_image: wedding.background_image || '',
          primary_color: wedding.primary_color || '#DE3F5E',
          font_color: wedding.font_color || '#1a1a1a',
          button_font_color: wedding.button_font_color || '#FFFFFF',
        });

        // Load couple images (support both old single image and new array)
        if (wedding.couple_images && Array.isArray(wedding.couple_images)) {
          const images: (string | null)[] = [...wedding.couple_images];
          while (images.length < 6) images.push(null);
          setCoupleImages(images.slice(0, 6));
        } else if (wedding.couple_image_url) {
          // Migrate old single image to first slot
          setCoupleImages([wedding.couple_image_url, null, null, null, null, null]);
        }

        console.log('✅ Form data set successfully');
      } else {
        console.warn('⚠️ No wedding found for slug:', weddingSlug);
        const errorMessage = `No wedding found with ID: ${weddingSlug}`;
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      console.error('❌ Error loading wedding:', err);
      const errorMessage = `Failed to load wedding data: ${(err as Error).message || 'Unknown error'}`;
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof DetailsFormData, value: string) => {
    const updatedFormData = { ...formData, [field]: value };

    // Auto-generate couple name when partner1 or partner2 name changes
    if (field === 'partner1_name' || field === 'partner2_name') {
      const coupleName = generateCoupleName(updatedFormData.partner1_name, updatedFormData.partner2_name);
      updatedFormData.couple_name = coupleName;
    }

    setFormData(updatedFormData);
    setSuccess(false);
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle date changes and auto-update display (string value from input)
  const handleDateStartChange = (value: string) => {
    const date = value ? parseISO(value) : null;
    setWeddingDateStart(date);
    if (!dateDisplayManuallyEdited) {
      const display = formatWeddingDateDisplay(date, isOneDayEvent ? null : weddingDateEnd);
      setFormData(prev => ({ ...prev, wedding_date_display: display }));
    }
  };

  const handleDateEndChange = (value: string) => {
    const date = value ? parseISO(value) : null;
    setWeddingDateEnd(date);
    if (!dateDisplayManuallyEdited) {
      const display = formatWeddingDateDisplay(weddingDateStart, date);
      setFormData(prev => ({ ...prev, wedding_date_display: display }));
    }
  };

  const handleOneDayEventChange = (checked: boolean) => {
    setIsOneDayEvent(checked);
    if (checked) {
      setWeddingDateEnd(null);
      if (!dateDisplayManuallyEdited) {
        const display = formatWeddingDateDisplay(weddingDateStart, null);
        setFormData(prev => ({ ...prev, wedding_date_display: display }));
      }
    } else {
      // If unchecking, set end date to same as start if not already set
      if (!weddingDateEnd && weddingDateStart) {
        setWeddingDateEnd(weddingDateStart);
        if (!dateDisplayManuallyEdited) {
          const display = formatWeddingDateDisplay(weddingDateStart, weddingDateStart);
          setFormData(prev => ({ ...prev, wedding_date_display: display }));
        }
      }
    }
  };

  const handleDateDisplayChange = (value: string) => {
    setFormData(prev => ({ ...prev, wedding_date_display: value }));
    setDateDisplayManuallyEdited(true);
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[&]/g, '') // Remove ampersands
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validation with field-level error tracking
      const newFieldErrors: Record<string, boolean> = {};
      if (!formData.couple_name || !formData.partner1_name || !formData.partner2_name) {
        if (!formData.partner1_name) newFieldErrors.partner1_name = true;
        if (!formData.partner2_name) newFieldErrors.partner2_name = true;
      }
      if (!weddingDateStart) newFieldErrors.wedding_date_start = true;
      if (!isOneDayEvent && !weddingDateEnd) newFieldErrors.wedding_date_end = true;
      if (!formData.venue_name) newFieldErrors.venue_name = true;

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        const errorMessage = 'Please fill in all required fields';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        setSaving(false);
        return;
      }

      setFieldErrors({});

      // Generate slug from couple name
      const newSlug = generateSlug(formData.couple_name);

      // Check if slug needs to be updated
      let finalSlug = weddingSlug;
      if (newSlug !== weddingSlug) {
        // Check if new slug is available
        const isAvailable = await weddingService.checkSlugAvailability(newSlug);
        if (isAvailable) {
          finalSlug = newSlug;
        } else {
          // If not available, keep the old slug but warn user
          const errorMessage = `Wedding ID "${newSlug}" is taken. Keeping current ID "${weddingSlug}". You can customize it from the Overview page.`;
          setError(errorMessage);
          showToast(errorMessage, 'error');
        }
      }

      // Filter out null values from couple images
      const validCoupleImages = coupleImages.filter((img): img is string => img !== null && img !== '');

      const updateData: Partial<{
        couple_name: string;
        partner1_name: string;
        partner2_name: string;
        wedding_date: string;
        wedding_date_end: string | null;
        wedding_date_display: string;
        venue_name: string;
        venue_location: string;
        rsvp_deadline: string;
        couple_image_url: string | null;
        couple_images: string[] | null;
        frame_image_url: string | null;
        show_venue_location: boolean;
        slug: string;
      }> = {
        couple_name: formData.couple_name,
        partner1_name: formData.partner1_name,
        partner2_name: formData.partner2_name,
        wedding_date: weddingDateStart!.toISOString(),
        wedding_date_end: isOneDayEvent ? null : (weddingDateEnd ? weddingDateEnd.toISOString() : null),
        wedding_date_display: formData.wedding_date_display,
        venue_name: formData.venue_name,
        venue_location: formData.venue_location,
        rsvp_deadline: formData.rsvp_deadline,
        slug: finalSlug,
        couple_images: validCoupleImages.length > 0 ? validCoupleImages : null,
        // Keep first image as couple_image_url for backward compatibility
        couple_image_url: validCoupleImages[0] || formData.couple_image_url,
        frame_image_url: formData.frame_image_url,
        show_venue_location: formData.show_venue_location,
      };

      if (weddingId) {
        await weddingService.updateWedding(weddingId, updateData);

        // If slug changed, redirect to new URL
        if (finalSlug !== weddingSlug) {
          setSuccess(true);
          setTimeout(() => {
            router.push(`/admin/${finalSlug}/details`);
          }, 1000);
          return;
        }
      } else {
        const newWedding = await weddingService.createWedding(updateData);
        if (newWedding) {
          setWeddingId(newWedding.id);
        }
      }

      setSuccess(true);
      setShowSaveSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowSaveSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Error saving wedding:', err);
      const errorMessage = 'Failed to save changes';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner message="Loading wedding details..." />
      </Container>
    );
  }

  // Mobile Preview Component
  const MobilePreview = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const activeImages = coupleImages.filter(img => img !== null) as string[];

    useEffect(() => {
      if (activeImages.length <= 1) return;
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % activeImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }, [activeImages.length]);

    return (
      <MobilePreviewFrame
        title="Preview"
        backgroundImage={formData.background_image || '/images/backgrounds/lavendar.png'}
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
                bgcolor: formData.primary_color || '#DE3F5E',
                color: formData.button_font_color || '#FFFFFF',
                borderRadius: '16px',
                py: 1.5,
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'Outfit',
                '&:hover': {
                  bgcolor: formData.primary_color || '#DE3F5E',
                  opacity: 0.9,
                },
              }}
            >
              View Details
            </Button>
          </Box>
        }
      >
        <Box sx={{ pt: 2, pb: 14 }}>
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
                {activeImages.length > 0 ? (
                  <Box
                    component="img"
                    key={activeImages[currentImageIndex]}
                    src={activeImages[currentImageIndex]}
                    alt="Couple Photo"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'opacity 0.8s ease-in-out',
                      animation: activeImages.length > 1 ? 'fadeIn 0.8s ease-in-out' : 'none',
                      '@keyframes fadeIn': {
                        from: { opacity: 0.5, filter: 'blur(5px)' },
                        to: { opacity: 1, filter: 'blur(0px)' }
                      }
                    }}
                  />
                ) : (
                  <Box sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="caption" color="text.secondary">No Photo</Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Date */}
            <Typography
              sx={{
                color: formData.font_color || '#000',
                fontSize: '0.85rem',
                letterSpacing: '0.5px',
                fontFamily: 'Outfit',
                textTransform: 'uppercase'
              }}
            >
              {formData.wedding_date_display || formatWeddingDateDisplay(weddingDateStart, isOneDayEvent ? null : weddingDateEnd)}
            </Typography>

            {/* Names */}
            <Typography
              variant="h4"
              sx={{
                fontSize: '1.75rem',
                color: formData.font_color || '#000',
                lineHeight: 1.2,
                fontFamily: 'var(--font-instrument-serif)',
                fontStyle: 'italic',
              }}
            >
              {formData.couple_name || 'Couple Names'}
            </Typography>

            {/* Venue */}
            <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
              <LocationOnOutlined sx={{ fontSize: 14, color: '#666' }} />
              <Typography
                sx={{
                  color: formData.font_color || '#000',
                  fontSize: '0.85rem',
                  textDecoration: 'underline',
                  fontFamily: 'Outfit',
                }}
              >
                {formData.venue_name || 'Venue Name'}
              </Typography>
              {formData.venue_location && formData.show_venue_location && (
                <Typography sx={{ fontSize: '0.85rem', color: formData.font_color || '#000', fontFamily: 'Outfit' }}>
                  {formData.venue_location}
                </Typography>
              )}
              {formData.venue_flag && (
                <Typography sx={{ fontSize: '1rem' }}>
                  {formData.venue_flag}
                </Typography>
              )}
            </Stack>

            {/* Countdown Timer */}
            <PreviewCountdown />

            {/* Comments Section */}
            <Box sx={{ width: '100%' }}>
              <ReadOnlyComments />
            </Box>
          </Stack>
        </Box>

      </MobilePreviewFrame>
    );
  };

  return (
    <Container maxWidth={false} sx={{ maxWidth: '100%', px: { xs: 2, md: 4, lg: 6 } }}>
      <Grid container spacing={6}>
        {/* Left Column - Form Controls */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={ENHANCED_SECTION_SPACING} sx={{ pt: { xs: 6, lg: 0 } }}>
            {/* Header */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Wedding Details
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Basic information about your wedding - couple names, date, venue, and photos
              </Typography>
            </Box>

            {/* Form */}
            <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '24px', bgcolor: alpha('#fff', 0.95), backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)' }}>
              <Stack spacing={5}>
                {/* Couple Names */}
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Couple Information *
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Partner 1's Name (Full Name)"
                      fullWidth
                      value={formData.partner1_name}
                      onChange={(e) => handleChange('partner1_name', e.target.value)}
                      placeholder="e.g., Simran Kaur"
                      required
                      error={fieldErrors.partner1_name}
                      helperText="Auto-generates couple name from first names"
                      sx={textFieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Partner 2's Name (Full Name)"
                      fullWidth
                      value={formData.partner2_name}
                      onChange={(e) => handleChange('partner2_name', e.target.value)}
                      placeholder="e.g., Karanvir Singh"
                      required
                      error={fieldErrors.partner2_name}
                      helperText="Auto-generates couple name from first names"
                      sx={textFieldSx}
                    />
                  </Grid>
                </Grid>

                {/* Auto-generated couple name display */}
                {formData.couple_name && (
                  <Box sx={{ p: 2, bgcolor: alpha('#DE3F5E', 0.05), borderRadius: '12px', border: `1px solid ${alpha('#DE3F5E', 0.2)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                        Combined Couple Name (Auto-generated):
                      </Typography>
                      {!editingCoupleName ? (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setTempCoupleName(formData.couple_name);
                            setEditingCoupleName(true);
                          }}
                          sx={{
                            color: '#DE3F5E',
                            '&:hover': {
                              bgcolor: alpha('#DE3F5E', 0.1),
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, couple_name: tempCoupleName }));
                              setEditingCoupleName(false);
                            }}
                            sx={{
                              color: '#10B981',
                              '&:hover': {
                                bgcolor: alpha('#10B981', 0.1),
                              },
                            }}
                          >
                            <Check fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingCoupleName(false);
                              setTempCoupleName('');
                            }}
                            sx={{
                              color: '#EF4444',
                              '&:hover': {
                                bgcolor: alpha('#EF4444', 0.1),
                              },
                            }}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                    {editingCoupleName ? (
                      <TextField
                        value={tempCoupleName}
                        onChange={(e) => setTempCoupleName(e.target.value)}
                        fullWidth
                        sx={textFieldSx}
                        autoFocus
                      />
                    ) : (
                      <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                        {formData.couple_name}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: '#6a6a6a', mt: 1, display: 'block' }}>
                      This will be displayed on the main page
                    </Typography>
                  </Box>
                )}

                {/* Wedding Date */}
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a' }}>
                  Wedding Date *
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isOneDayEvent}
                      onChange={(e) => handleOneDayEventChange(e.target.checked)}
                      sx={{
                        color: '#DE3F5E',
                        '&.Mui-checked': {
                          color: '#DE3F5E',
                        },
                      }}
                    />
                  }
                  label="Single day event (no end date)"
                  sx={{ color: '#4a4a4a' }}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Wedding Start Date"
                      type="date"
                      fullWidth
                      value={weddingDateStart ? format(weddingDateStart, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleDateStartChange(e.target.value)}
                      required
                      error={!!fieldErrors.wedding_date_start}
                      InputLabelProps={{ shrink: true }}
                      sx={textFieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Wedding End Date"
                      type="date"
                      fullWidth
                      value={weddingDateEnd ? format(weddingDateEnd, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleDateEndChange(e.target.value)}
                      required={!isOneDayEvent}
                      disabled={isOneDayEvent}
                      error={!isOneDayEvent && !!fieldErrors.wedding_date_end}
                      InputLabelProps={{ shrink: true }}
                      sx={textFieldSx}
                    />
                  </Grid>
                </Grid>

                {/* Date Display Preview and Edit */}
                {weddingDateStart && (
                  <Box sx={{ p: 2, bgcolor: alpha('#DE3F5E', 0.05), borderRadius: '12px', border: `1px solid ${alpha('#DE3F5E', 0.2)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                        Date Display Preview (Auto-generated):
                      </Typography>
                      {!editingDateDisplay ? (
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (weddingDateStart) {
                              setTempDateDisplay(formData.wedding_date_display || formatWeddingDateDisplay(weddingDateStart, isOneDayEvent ? null : weddingDateEnd));
                              setEditingDateDisplay(true);
                            }
                          }}
                          sx={{
                            color: '#DE3F5E',
                            '&:hover': {
                              bgcolor: alpha('#DE3F5E', 0.1),
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              handleDateDisplayChange(tempDateDisplay);
                              setEditingDateDisplay(false);
                            }}
                            sx={{
                              color: '#10B981',
                              '&:hover': {
                                bgcolor: alpha('#10B981', 0.1),
                              },
                            }}
                          >
                            <Check fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingDateDisplay(false);
                              setTempDateDisplay('');
                            }}
                            sx={{
                              color: '#EF4444',
                              '&:hover': {
                                bgcolor: alpha('#EF4444', 0.1),
                              },
                            }}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                    {editingDateDisplay ? (
                      <TextField
                        value={tempDateDisplay}
                        onChange={(e) => setTempDateDisplay(e.target.value)}
                        fullWidth
                        placeholder="e.g., 4-6 JANUARY, 2026"
                        helperText="How the date should appear to guests"
                        sx={textFieldSx}
                        autoFocus
                      />
                    ) : (
                      <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                        {formData.wedding_date_display || formatWeddingDateDisplay(weddingDateStart, isOneDayEvent ? null : weddingDateEnd)}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Venue */}
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a' }}>
                  Venue Information *
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Venue Name"
                      fullWidth
                      value={formData.venue_name}
                      onChange={(e) => handleChange('venue_name', e.target.value)}
                      placeholder="e.g., The Palayana"
                      required
                      error={fieldErrors.venue_name}
                      sx={textFieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Venue Location"
                      fullWidth
                      value={formData.venue_location}
                      onChange={(e) => handleChange('venue_location', e.target.value)}
                      placeholder="e.g., Hua Hin, Thailand 🇹🇭"
                      helperText="Include country flag emoji in location if desired"
                      required
                      sx={textFieldSx}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.show_venue_location}
                          onChange={(e) => handleChange('show_venue_location', e.target.checked ? 'true' : 'false')}
                          sx={{
                            color: '#DE3F5E',
                            '&.Mui-checked': {
                              color: '#DE3F5E',
                            },
                          }}
                        />
                      }
                      label="Display on website"
                      sx={{ color: '#4a4a4a', mt: 1 }}
                    />
                  </Grid>
                </Grid>

                {/* RSVP Deadline */}
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a' }}>
                  RSVP Information
                </Typography>

                <TextField
                  label="RSVP Deadline"
                  fullWidth
                  value={formData.rsvp_deadline}
                  onChange={(e) => handleChange('rsvp_deadline', e.target.value)}
                  placeholder="e.g., August 16, 2025"
                  sx={textFieldSx}
                />

                {/* Images */}
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a' }}>
                  Images
                </Typography>

                {weddingId && (
                  <>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                        Couple Photos (up to 6)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6a6a6a', mb: 2, display: 'block' }}>
                        Add multiple photos of the couple. Recommended size: 800x1000px each
                      </Typography>

                      {/* Add Photo Button */}
                      {coupleImages.filter(img => img).length < 6 && (
                        <Box sx={{ mb: 2 }}>
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  // Upload the file using ImageUpload's upload logic
                                  const { uploadImage } = await import('@/lib/utils/image-upload');
                                  const result = await uploadImage(file, getWeddingImagePath(weddingId, 'couple'));
                                  if (result.success && result.url) {
                                    const newImages = [...coupleImages];
                                    const nextEmptyIndex = newImages.findIndex(img => !img);
                                    if (nextEmptyIndex !== -1) {
                                      newImages[nextEmptyIndex] = result.url;
                                    } else {
                                      newImages.push(result.url);
                                    }
                                    setCoupleImages(newImages.slice(0, 6));
                                  }
                                }
                              };
                              input.click();
                            }}
                            sx={{
                              borderColor: '#DE3F5E',
                              color: '#DE3F5E',
                              borderRadius: '12px',
                              textTransform: 'none',
                              fontWeight: 600,
                              '&:hover': {
                                borderColor: '#C8365A',
                                bgcolor: 'rgba(222, 63, 94, 0.05)',
                              },
                            }}
                          >
                            Add Photo
                          </Button>
                        </Box>
                      )}

                      {/* Horizontal scrollable thumbnails */}
                      {coupleImages.filter(img => img).length > 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 2,
                            overflowX: 'auto',
                            pb: 2,
                            '&::-webkit-scrollbar': {
                              height: 8,
                            },
                            '&::-webkit-scrollbar-track': {
                              backgroundColor: '#f5f5f5',
                              borderRadius: 4,
                            },
                            '&::-webkit-scrollbar-thumb': {
                              backgroundColor: '#DE3F5E',
                              borderRadius: 4,
                            },
                          }}
                        >
                          {coupleImages.filter((img): img is string => img !== null && img !== '').map((img, actualIndex) => {
                            const originalIndex = coupleImages.indexOf(img);
                            return (
                              <Box
                                key={originalIndex}
                                sx={{
                                  position: 'relative',
                                  minWidth: 120,
                                  width: 120,
                                  height: 150,
                                  flexShrink: 0,
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  border: originalIndex === 0 ? '3px solid #DE3F5E' : '2px solid #e0e0e0',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                }}
                              >
                                <Box
                                  component="img"
                                  src={img}
                                  alt={`Couple photo ${originalIndex + 1}`}
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                                {originalIndex === 0 && (
                                  <Chip
                                    label="Main"
                                    size="small"
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      left: 4,
                                      bgcolor: '#DE3F5E',
                                      color: 'white',
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                    }}
                                  />
                                )}
                                <IconButton
                                  size="small"
                                  onClick={async () => {
                                    const { deleteImage } = await import('@/lib/utils/image-upload');
                                    await deleteImage(img);
                                    const newImages = [...coupleImages];
                                    newImages[originalIndex] = null;
                                    setCoupleImages(newImages);
                                  }}
                                  sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                                    color: 'white',
                                    '&:hover': {
                                      bgcolor: 'rgba(222, 63, 94, 0.9)',
                                    },
                                    width: 28,
                                    height: 28,
                                  }}
                                >
                                  <Delete sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>

                    {/* Frame with Preview */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                        Frame/Overlay Image (Optional)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6a6a6a', mb: 2, display: 'block' }}>
                        Decorative frame or overlay (optional)
                      </Typography>

                      <Grid container spacing={3} alignItems="center">
                        <Grid size={{ xs: 12, md: formData.frame_image_url && coupleImages[0] ? 5 : 12 }}>
                          <ImageUpload
                            label="Frame/Overlay Image"
                            value={formData.frame_image_url}
                            onChange={(url) => handleChange('frame_image_url', url || '')}
                            path={getWeddingImagePath(weddingId, 'couple')}
                            helperText="Decorative frame or overlay"
                            aspectRatio="1/1"
                            maxWidth={400}
                            borderRadius={0}
                          />
                        </Grid>

                        {/* Show preview if both frame and main photo exist */}
                        {formData.frame_image_url && coupleImages[0] && (
                          <>
                            <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                              <ArrowForward sx={{ color: '#DE3F5E', fontSize: 32 }} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 5 }}>
                              <Stack spacing={1}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                  Preview with Frame
                                </Typography>
                                <Box
                                  sx={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: 400,
                                    aspectRatio: '1/1',
                                    overflow: 'visible',
                                  }}
                                >
                                  {/* Frame background - at zIndex 1 (behind) */}
                                  <Box
                                    component="img"
                                    src={formData.frame_image_url || ''}
                                    alt="Decorative frame"
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                      zIndex: 1,
                                      pointerEvents: 'none',
                                    }}
                                  />

                                  {/* Couple Image on top - at zIndex 3 (in front) */}
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: '7%',
                                      left: '7%',
                                      width: '87%',
                                      height: '87%',
                                      overflow: 'hidden',
                                      zIndex: 3,
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src={coupleImages[0] || ''}
                                      alt="Couple photo"
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                    />
                                  </Box>
                                </Box>
                              </Stack>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Box>
                  </>
                )}

                {/* Save Button with Inline Success */}
                <Box sx={{ position: 'relative', display: 'inline-block', width: 'fit-content' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={showSaveSuccess ? <Check /> : <Save />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      mt: 2,
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
                        bgcolor: alpha('#DE3F5E', 0.5),
                      },
                    }}
                  >
                    {saving ? 'Saving...' : showSaveSuccess ? 'Changes Saved!' : 'Save Changes'}
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
                      Changes saved successfully!
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
              maxWidth: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MobilePreview />
          </Box>
        </Grid>

        {/* Mobile Preview at Bottom (Mobile only) */}
        <Grid size={{ xs: 12 }} sx={{ display: { xs: 'block', lg: 'none' }, mt: 4 }}>
          <MobilePreview />
        </Grid>
      </Grid>
    </Container>
  );
}
