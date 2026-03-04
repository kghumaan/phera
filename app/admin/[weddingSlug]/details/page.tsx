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
import { Edit, Cancel, LocationOnOutlined } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { TablesUpdate } from '@/lib/supabase/types';
import { weddingService } from '@/lib/supabase/wedding-service';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import AutoSaveIndicator from '@/components/admin/AutoSaveIndicator';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';

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
  const { user: authUser } = useAuth();
  const { isViewOnly } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // Date state for date pickers
  const [weddingDateStart, setWeddingDateStart] = useState<Date | null>(null);
  const [weddingDateEnd, setWeddingDateEnd] = useState<Date | null>(null);
  const [dateDisplayManuallyEdited, setDateDisplayManuallyEdited] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);

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

  // Auto-save hook - only enabled when auth is ready
  const { saveStatus, debouncedSave } = useAutoSave({
    onSave: async () => {
      if (!weddingId) return;

      const updateData: TablesUpdate<'weddings'> = {
        couple_name: formData.couple_name,
        partner1_name: formData.partner1_name,
        partner2_name: formData.partner2_name,
        wedding_date: weddingDateStart?.toISOString() || undefined,
        wedding_date_end: weddingDateEnd ? weddingDateEnd.toISOString() : null,
        wedding_date_display: formData.wedding_date_display,
        venue_name: formData.venue_name,
        venue_location: formData.venue_location,
        rsvp_deadline: formData.rsvp_deadline,
        show_venue_location: formData.show_venue_location,
        welcome_text: formData.welcome_text || '',
      };

      const result = await weddingService.updateWedding(weddingId, updateData);
      if (!result) throw new Error('Save failed');
      await weddingService.markUnpublishedChanges(weddingId);
      setInitialFormData(formData);
      setIsDirty(false);
    },
    debounceMs: 1500,
    enabled: !!authUser,
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
                lineHeight: 1
              }}>
                {unit.value}
              </Typography>
              <Typography sx={{
                color: '#000000',
                fontSize: 11,
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

        setIsInitialLoad(false);
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
    if (isViewOnly) return;
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

    // Check if dirty and trigger auto-save
    if (initialFormData) {
      const dirty = JSON.stringify(updatedFormData) !== JSON.stringify(initialFormData);
      setIsDirty(dirty);
      if (dirty && weddingId) {
        debouncedSave();
      }
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

    // Auto-open end date picker after selecting start date (unless one-day)
    if (date && !formData.is_one_day) {
      setTimeout(() => setEndDatePickerOpen(true), 300);
    }

    // Trigger auto-save on date change
    if (weddingId) debouncedSave();
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
    // Trigger auto-save on end date change
    if (weddingId) debouncedSave();
  };


  // handleOneDayEventChange removed as we are no longer using it

  const handleDateDisplayChange = (value: string) => {
    setFormData(prev => ({ ...prev, wedding_date_display: value }));
    setDateDisplayManuallyEdited(true);
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
          <AutoSaveIndicator status={saveStatus} />
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
                    open={endDatePickerOpen}
                    onOpen={() => setEndDatePickerOpen(true)}
                    onClose={() => setEndDatePickerOpen(false)}
                    minDate={weddingDateStart || undefined}
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


        </Stack>
      </Stack>
    </Box>

  );
}
