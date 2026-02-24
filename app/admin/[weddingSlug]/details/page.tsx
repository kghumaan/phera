'use client';

import {
  Box,
  Typography,
  TextField,
  Stack,
  Button,
  alpha,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { useState, useEffect, use } from 'react';
import { Save, Check, Add, ArrowForward, Delete, Edit, Cancel, LocationOnOutlined } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import ImageUpload from '@/components/admin/ImageUpload';
import { TablesUpdate } from '@/lib/supabase/types';
import { weddingService } from '@/lib/supabase/wedding-service';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

import ReadOnlyComments from '@/components/preview/ReadOnlyComments';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import { getFrameConfig } from '@/lib/constants/images';

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
  is_one_day?: boolean;
  welcome_text?: string;
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
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [coupleImages, setCoupleImages] = useState<(string | null)[]>(Array(6).fill(null));
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // Date state for date pickers
  const [weddingDateStart, setWeddingDateStart] = useState<Date | null>(null);
  const [weddingDateEnd, setWeddingDateEnd] = useState<Date | null>(null);
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
    welcome_text: '',
  });
  const [initialFormData, setInitialFormData] = useState<DetailsFormData | null>(null);
  const [isDirty, setIsDirty] = useState(false);


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
        setWeddingDateStart(startDate);
        setWeddingDateEnd(endDate);

        // Generate couple name from bride/groom names
        const autoCoupleName = generateCoupleName(
          wedding.partner1_name || '',
          wedding.partner2_name || ''
        ) || wedding.couple_name || '';

        const currentData: DetailsFormData = {
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
          is_one_day: wedding.wedding_date === wedding.wedding_date_end || !wedding.wedding_date_end,
          welcome_text: wedding.welcome_text || '',
        };

        setFormData(currentData);
        setInitialFormData(currentData);
        setIsDirty(false);


        // Load couple images (support both old single image and new array)
        if (wedding.couple_images && Array.isArray(wedding.couple_images)) {
          const images: (string | null)[] = [...wedding.couple_images as unknown as string[]];
          while (images.length < 6) images.push(null);
          setCoupleImages(images.slice(0, 6));
        } else if (wedding.couple_image_url) {
          // Migrate old single image to first slot
          setCoupleImages([wedding.couple_image_url, null, null, null, null, null]);
        }

        console.log('✅ Form data set successfully');
      } else {
        console.warn('⚠️ No wedding found for slug:', weddingSlug);
        toast.error(`No wedding found with ID: ${weddingSlug}`);
      }
    } catch (err) {
      console.error('❌ Error loading wedding:', err);
      toast.error(`Failed to load wedding data: ${(err as Error).message || 'Unknown error'}`);
      setError(`Failed to load wedding data: ${(err as Error).message || 'Unknown error'}`);
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof DetailsFormData, value: any) => {
    let finalValue = value;

    // Specifically handle partner names to ensure only first names (no spaces)
    if (field === 'partner1_name' || field === 'partner2_name') {
      finalValue = value.replace(/\s/g, '');
    }

    const updatedFormData = { ...formData, [field]: finalValue };

    // Auto-generate couple name when partner1 or partner2 name changes
    if (field === 'partner1_name' || field === 'partner2_name') {
      const coupleName = generateCoupleName(updatedFormData.partner1_name, updatedFormData.partner2_name);
      updatedFormData.couple_name = coupleName;
    }

    setFormData(updatedFormData);

    // Check if dirty
    if (initialFormData) {
      setIsDirty(JSON.stringify(updatedFormData) !== JSON.stringify(initialFormData));
    }

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
  const handleDateStartChange = (date: Date | null) => {
    setWeddingDateStart(date);

    // If it's a one-day event, also update the end date
    if (formData.is_one_day) {
      setWeddingDateEnd(date);
    }

    if (!dateDisplayManuallyEdited) {
      const display = formatWeddingDateDisplay(date, formData.is_one_day ? date : weddingDateEnd);
      setFormData(prev => {
        const next = { ...prev, wedding_date_display: display };
        if (initialFormData) setIsDirty(JSON.stringify(next) !== JSON.stringify(initialFormData));
        return next;
      });
    }
    // Also clear error
    if (fieldErrors.wedding_date_start) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.wedding_date_start;
        return next;
      });
    }
  };

  const handleDateEndChange = (date: Date | null) => {
    setWeddingDateEnd(date);
    if (!dateDisplayManuallyEdited) {
      const display = formatWeddingDateDisplay(weddingDateStart, date);
      setFormData(prev => {
        const next = { ...prev, wedding_date_display: display };
        if (initialFormData) setIsDirty(JSON.stringify(next) !== JSON.stringify(initialFormData));
        return next;
      });
    }
  };


  // handleOneDayEventChange removed as we are no longer using it

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

    try {
      // Validation with field-level error tracking
      const newFieldErrors: Record<string, boolean> = {};

      if (!weddingDateStart) newFieldErrors.wedding_date_start = true;
      if (!formData.partner1_name) newFieldErrors.partner1_name = true;
      if (!formData.partner2_name) newFieldErrors.partner2_name = true;
      // weddingDateEnd is optional
      if (!formData.venue_name) newFieldErrors.venue_name = true;

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        const errorMessage = 'Please fill in all required fields';
        setError(errorMessage);
        toast.error(errorMessage);
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
          toast.error(errorMessage);
        }
      }

      // Filter out null values from couple images
      const validCoupleImages = coupleImages.filter((img): img is string => img !== null && img !== '');

      const updateData: TablesUpdate<'weddings'> = {
        couple_name: formData.couple_name,
        partner1_name: formData.partner1_name,
        partner2_name: formData.partner2_name,
        wedding_date: weddingDateStart!.toISOString(),
        wedding_date_end: weddingDateEnd ? weddingDateEnd.toISOString() : null,
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
        welcome_text: formData.welcome_text || '',
      };

      if (weddingId) {
        await weddingService.updateWedding(weddingId, updateData);

        // If slug changed, redirect to new URL
        if (finalSlug !== weddingSlug) {
          toast.success('Changes saved! Redirecting...');
          setTimeout(() => {
            router.push(`/admin/${finalSlug}/details`);
          }, 1000);
          return;
        }
      } else {
        const newWedding = await weddingService.createWedding(updateData as any);
        if (newWedding) {
          setWeddingId(newWedding.id);
        }
      }

      toast.success('Changes saved successfully!');
      setShowSaveSuccess(true);
      setInitialFormData(formData);
      setIsDirty(false);
      setTimeout(() => setShowSaveSuccess(false), 2000);

    } catch (err) {
      console.error('Error saving wedding:', err);
      const errorMessage = 'Failed to save changes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LoadingSpinner message="Loading wedding details..." />
      </Box>
    );
  }



  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
              Wedding Details
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              Basic information about your wedding - couple names, date, venue, and photos
            </Typography>
          </Box>
          {isDirty && (
            <Button
              variant="contained"
              startIcon={showSaveSuccess ? <Check /> : <Save />}
              onClick={handleSave}
              disabled={saving || showSaveSuccess}
              sx={{
                bgcolor: showSaveSuccess ? '#10B981' : '#DE3F5E',
                color: 'white',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,

                boxShadow: showSaveSuccess
                  ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                  : '0 4px 12px rgba(222, 63, 94, 0.3)',
                '&:hover': {
                  bgcolor: showSaveSuccess ? '#059669' : '#C8365A',
                  boxShadow: showSaveSuccess
                    ? '0 6px 16px rgba(16, 185, 129, 0.5)'
                    : '0 6px 16px rgba(222, 63, 94, 0.4)',
                },
              }}
            >
              {saving ? 'Saving...' : showSaveSuccess ? 'Saved!' : 'Save Details'}
            </Button>
          )}
        </Box>


        {/* Form Content */}
        <Stack spacing={3}>
          {/* Couple Names */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1rem' }}>
            Couple Information *
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Your First Name"
                fullWidth
                value={formData.partner1_name}
                onChange={(e) => handleChange('partner1_name', e.target.value)}
                placeholder="e.g., Simran"
                required
                error={fieldErrors.partner1_name}
                // helperText="No spaces allowed. This is used for your wedding title."
                sx={textFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Your Partner's First Name"
                fullWidth
                value={formData.partner2_name}
                onChange={(e) => handleChange('partner2_name', e.target.value)}
                placeholder="e.g., Karanvir"
                required
                error={fieldErrors.partner2_name}
                // helperText="No spaces allowed. This is used for your wedding title."
                sx={textFieldSx}
              />
            </Grid>
          </Grid>


          {/* Wedding Date */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a', fontSize: '1rem' }}>
            Wedding Date *
          </Typography>


          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_one_day}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setFormData(prev => ({ ...prev, is_one_day: isChecked }));
                        if (isChecked) {
                          setWeddingDateEnd(weddingDateStart);
                          if (!dateDisplayManuallyEdited) {
                            const display = formatWeddingDateDisplay(weddingDateStart, weddingDateStart);
                            setFormData(prev => ({ ...prev, wedding_date_display: display, is_one_day: isChecked }));
                          }
                        }
                      }}
                      sx={{
                        color: '#DE3F5E',
                        '&.Mui-checked': {
                          color: '#DE3F5E',
                        },
                      }}
                    />
                  }
                  label="This is a one day wedding"
                  sx={{ color: '#4a4a4a', mb: 2 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <MobileDatePicker
                  label="Wedding Start Date"
                  value={weddingDateStart}
                  onChange={(newValue) => handleDateStartChange(newValue as Date | null)}
                  enableAccessibleFieldDOMStructure={false}
                  slots={{
                    textField: TextField,
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!fieldErrors.wedding_date_start,
                      sx: textFieldSx,
                    },
                    actionBar: {
                      actions: ['cancel', 'accept'],
                      sx: {
                        '& .MuiButton-root': {
                          color: '#DE3F5E',
                          fontWeight: 700,
                        }
                      }
                    },
                    calendarHeader: {
                      sx: {
                        '& .MuiPickersCalendarHeader-label': { color: '#000000', fontWeight: 700 },
                        '& .MuiSvgIcon-root': { color: '#000000' }
                      }
                    },
                    day: {
                      sx: {
                        color: '#000000 !important',
                        fontWeight: 500,
                        '&.Mui-selected': {
                          backgroundColor: '#DE3F5E !important',
                          color: '#ffffff !important',
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: '#DE3F5E !important',
                          opacity: 0.9,
                        },
                        '&.MuiPickersDay-today': {
                          borderColor: '#DE3F5E !important',
                          color: '#DE3F5E',
                        }
                      }
                    }
                  }}
                />
              </Grid>
              {!formData.is_one_day && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <MobileDatePicker
                    label="Wedding End Date"
                    value={weddingDateEnd}
                    onChange={(newValue) => handleDateEndChange(newValue as Date | null)}
                    enableAccessibleFieldDOMStructure={false}
                    slots={{
                      textField: TextField,
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        // required: true, // Removed as end date is optional
                        error: !!fieldErrors.wedding_date_end,
                        placeholder: "e.g., 2026-01-06",
                        sx: textFieldSx,
                      },
                      actionBar: {
                        actions: ['cancel', 'accept'],
                        sx: {
                          '& .MuiButton-root': {
                            color: '#DE3F5E',
                            fontWeight: 700,
                          }
                        }
                      },
                      calendarHeader: {
                        sx: {
                          '& .MuiPickersCalendarHeader-label': { color: '#000000', fontWeight: 700 },
                          '& .MuiSvgIcon-root': { color: '#000000' }
                        }
                      },
                      day: {
                        sx: {
                          color: '#000000 !important',
                          fontWeight: 500,
                          '&.Mui-selected': {
                            backgroundColor: '#DE3F5E !important',
                            color: '#ffffff !important',
                          },
                          '&.Mui-selected:hover': {
                            backgroundColor: '#DE3F5E !important',
                            opacity: 0.9,
                          },
                          '&.MuiPickersDay-today': {
                            borderColor: '#DE3F5E !important',
                            color: '#DE3F5E',
                          }
                        }
                      }
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </LocalizationProvider>

          {/* Date Display Preview and Edit */}
          {/* {weddingDateStart && (
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
                        setTempDateDisplay(formData.wedding_date_display || formatWeddingDateDisplay(weddingDateStart, weddingDateEnd));
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
                  {formData.wedding_date_display || formatWeddingDateDisplay(weddingDateStart, weddingDateEnd)}
                </Typography>
              )}
            </Box>
          )} */}

          {/* Venue */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a', fontSize: '1rem' }}>
            Venue Information *
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Venue Name"
                fullWidth
                value={formData.venue_name}
                onChange={(e) => handleChange('venue_name', e.target.value)}
                placeholder="e.g., Sheraton"
                required
                error={fieldErrors.venue_name}
                sx={textFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="City/Country"
                fullWidth
                value={formData.venue_location}
                onChange={(e) => handleChange('venue_location', e.target.value)}
                placeholder="e.g., Bangkok, Thailand 🇹🇭"
                required
                sx={textFieldSx}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.show_venue_location}
                    onChange={(e) => handleChange('show_venue_location', e.target.checked)}
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

          {/* Welcome Message Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a', fontSize: '1rem' }}>
            Welcome Message
          </Typography>
          <Box>
            <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 2 }}>
              A short note for your guests that appears on your home page.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={formData.welcome_text}
              onChange={(e) => handleChange('welcome_text', e.target.value)}
              placeholder="e.g. Can't wait to celebrate with you all! ❤️"
              sx={textFieldSx}
            />
          </Box>

          {/* RSVP Deadline */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a', fontSize: '1rem' }}>
            RSVP Information
          </Typography>

          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!formData.rsvp_deadline && formData.rsvp_deadline !== 'TBD'}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      handleChange('rsvp_deadline', '');
                    } else {
                      // Default to 1 month before wedding if possible
                      const deadline = weddingDateStart ? new Date(weddingDateStart) : new Date();
                      if (weddingDateStart) deadline.setMonth(deadline.getMonth() - 1);
                      handleChange('rsvp_deadline', deadline.toISOString());
                    }
                  }}
                  sx={{
                    color: '#DE3F5E',
                    '&.Mui-checked': {
                      color: '#DE3F5E',
                    },
                  }}
                />
              }
              label="Set RSVP Deadline"
              sx={{ color: '#4a4a4a' }}
            />

            {!!formData.rsvp_deadline && formData.rsvp_deadline !== 'TBD' && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <MobileDatePicker
                  label="RSVP Deadline"
                  value={formData.rsvp_deadline && formData.rsvp_deadline !== 'TBD' ? parseISO(formData.rsvp_deadline) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      handleChange('rsvp_deadline', (newValue as Date).toISOString());
                    }
                  }}
                  enableAccessibleFieldDOMStructure={false}
                  slots={{
                    textField: TextField,
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: textFieldSx,
                    },
                    actionBar: {
                      actions: ['cancel', 'accept'],
                      sx: {
                        '& .MuiButton-root': {
                          color: '#DE3F5E',
                          fontWeight: 700,
                        }
                      }
                    },
                    calendarHeader: {
                      sx: {
                        '& .MuiPickersCalendarHeader-label': { color: '#000000', fontWeight: 700 },
                        '& .MuiSvgIcon-root': { color: '#000000' }
                      }
                    },
                    day: {
                      sx: {
                        color: '#000000 !important',
                        fontWeight: 500,
                        '&.Mui-selected': {
                          backgroundColor: '#DE3F5E !important',
                          color: '#ffffff !important',
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: '#DE3F5E !important',
                          opacity: 0.9,
                        },
                        '&.MuiPickersDay-today': {
                          borderColor: '#DE3F5E !important',
                          color: '#DE3F5E',
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            )}
          </Stack>

          {/* Images */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a', fontSize: '1rem' }}>
            Images
          </Typography>

          {weddingId && (
            <>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                  Couple Photos (up to 6)
                </Typography>
                <Typography variant="caption" sx={{ color: '#6a6a6a', mb: 2, display: 'block' }}>
                  Add multiple photos of the couple. Recommended size: 800x800px each
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
                            height: 120,
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

              {/* Frame Selection */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                  Frame Options
                </Typography>
                <Typography variant="caption" sx={{ color: '#6a6a6a', mb: 2, display: 'block' }}>
                  Choose a decorative frame for your photos
                </Typography>

                <Grid container spacing={3} alignItems="center">
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {[
                        { id: 'frame-1', url: '/images/frames/frame-1.png', name: 'Frame 1' },
                        { id: 'frame-2', url: '/images/frames/frame-2.png', name: 'Frame 2' },
                        { id: 'frame-3', url: '/images/frames/frame-3.png', name: 'Frame 3' },
                        { id: 'frame-4', url: '/images/frames/frame-4.png', name: 'Frame 4' },
                        { id: 'frame-5', url: '/images/frames/frame-5.png', name: 'Frame 5' },
                        { id: 'frame-6', url: '/images/frames/frame-6.png', name: 'Frame 6' },
                        { id: 'frame-7', url: '/images/frames/frame-7.png', name: 'Frame 7' },
                        { id: 'frame-8', url: '/images/frames/frame-8.png', name: 'Frame 8' },
                        { id: 'frame-9', url: '/images/frames/frame-9.png', name: 'Frame 9' },
                        { id: 'frame-10', url: '/images/frames/frame-10.png', name: 'Frame 10' },
                        { id: 'frame-11', url: '/images/frames/frame-11.png', name: 'Frame 11' },
                        { id: 'frame-12', url: '/images/frames/frame-12.png', name: 'Frame 12' }
                      ].map((frame) => (
                        <Box
                          key={frame.id}
                          onClick={() => handleChange('frame_image_url', frame.url)}
                          sx={{
                            width: 100,
                            height: 100,
                            borderRadius: '12px',
                            border: formData.frame_image_url === frame.url ? '3px solid #DE3F5E' : '1px solid #eee',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            position: 'relative',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              borderColor: '#DE3F5E',
                            }
                          }}
                        >
                          <Box
                            component="img"
                            src={frame.url}
                            alt={frame.name}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              p: 1
                            }}
                          />
                          {formData.frame_image_url === frame.url && (
                            <Box sx={{ position: 'absolute', top: 4, right: 4, bgcolor: '#DE3F5E', borderRadius: '50%', p: 0.25, display: 'flex' }}>
                              <Check sx={{ color: 'white', fontSize: 14 }} />
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Grid>

                  {/* Show preview if both frame and main photo exist */}
                  {formData.frame_image_url && (
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
                            {/* Couple Image on top - at zIndex 1 (behind) */}
                            <Box
                              sx={{
                                position: 'absolute',
                                ...getFrameConfig(formData.frame_image_url),
                                overflow: 'hidden',
                                zIndex: 1,
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

                            {/* Frame background - at zIndex 3 (in front) */}
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
                                zIndex: 3,
                                pointerEvents: 'none',
                              }}
                            />
                          </Box>
                        </Stack>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            </>
          )}

        </Stack>
      </Stack>
    </Box>

  );
}
