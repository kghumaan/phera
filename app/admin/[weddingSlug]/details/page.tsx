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
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useState, useEffect, use, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Edit, Cancel, LocationOnOutlined } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { TablesUpdate } from '@/lib/supabase/types';
import { weddingService } from '@/lib/supabase/wedding-service';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';

import ReadOnlyComments from '@/components/preview/ReadOnlyComments';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import ContinueButton from '@/components/admin/ContinueButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

// Use enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;
const sectionPaperSx = {
  p: 3,
  borderRadius: RADII.lg,
  bgcolor: COLORS.bg.muted,
  boxShadow: 'none',
};

// Custom input for react-datepicker matching admin ENHANCED_TEXT_FIELD_SX style
const AdminDateInput = forwardRef<HTMLInputElement, { value?: string; onClick?: () => void; placeholder?: string; label?: string; error?: boolean }>(
  ({ value, onClick, placeholder, label, error }, ref) => (
    <TextField
      ref={ref as any}
      value={value}
      onClick={onClick}
      placeholder={placeholder}
      label={label}
      fullWidth
      error={error}
      InputProps={{ readOnly: true }}
      sx={{
        ...textFieldSx,
        '& .MuiOutlinedInput-root': {
          ...(textFieldSx as any)['& .MuiOutlinedInput-root'],
          cursor: 'pointer',
          '& input': {
            cursor: 'pointer',
            ...((textFieldSx as any)['& .MuiOutlinedInput-root'] as any)?.['& input'],
          },
        },
      }}
    />
  )
);
AdminDateInput.displayName = 'AdminDateInput';

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
  const { showStatus } = useAutoSaveStatus();
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weddingId, setWeddingId] = useState<string | null>(null);
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
        bgcolor: COLORS.bg.white,
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
                color: COLORS.text.strong,
                fontSize: 64,
                lineHeight: 1
              }}>
                {unit.value}
              </Typography>
              <Typography sx={{
                color: COLORS.text.strong,
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
            const parsed = parseISO(wedding.wedding_date);
            // Treat Unix epoch (1970-01-01) as TBD sentinel — show empty date picker
            if (!isNaN(parsed.getTime()) && parsed.getTime() !== 0) {
              startDate = parsed;
            }
          }
          if (wedding.wedding_date_end) {
            endDate = parseISO(wedding.wedding_date_end);
            if (isNaN(endDate.getTime()) || endDate.getTime() === 0) endDate = null;
          }
        } catch (err) {
          console.error('Error parsing dates:', err);
        }
        setWeddingDateStart(startDate);
        setWeddingDateEnd(endDate);

        // Regenerate date display if end date exists but display doesn't reflect it
        let dateDisplay = wedding.wedding_date_display || '';
        if (startDate && endDate) {
          const regenerated = formatWeddingDateDisplay(startDate, endDate);
          if (regenerated && regenerated !== dateDisplay) {
            dateDisplay = regenerated;
            // Persist corrected display to DB so preview picks it up immediately
            weddingService.updateWedding(wedding.id, { wedding_date_display: regenerated });
          }
        }

        // Generate couple name from bride/groom names
        const autoCoupleName = generateCoupleName(
          wedding.partner1_name || '',
          wedding.partner2_name || ''
        ) || wedding.couple_name || '';

        const currentData: DetailsFormData = {
          couple_name: autoCoupleName,
          partner1_name: wedding.partner1_name || '',
          partner2_name: wedding.partner2_name || '',
          wedding_date_display: dateDisplay,
          venue_name: wedding.venue_name || '',
          venue_location: wedding.venue_location || '',
          venue_flag: wedding.venue_flag || null,
          rsvp_deadline: wedding.rsvp_deadline || '',
          couple_image_url: wedding.couple_image_url || null,
          frame_image_url: wedding.frame_image_url || null,
          background_image: wedding.background_image || '',
          primary_color: wedding.primary_color || COLORS.brand.primary,
          font_color: wedding.font_color || COLORS.text.strong,
          button_font_color: wedding.button_font_color || COLORS.bg.white,
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
        showStatus('error', `No wedding found with ID: ${weddingSlug}`);
      }
    } catch (err) {
      console.error('❌ Error loading wedding:', err);
      showStatus('error', `Failed to load wedding data: ${(err as Error).message || 'Unknown error'}`);
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

    if (!dateDisplayManuallyEdited) {
      const display = formatWeddingDateDisplay(date, weddingDateEnd);
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
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
              Wedding Details
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
              Basic information about your wedding
            </Typography>
          </Box>
        </Box>

        {/* Form Content */}
        <Stack spacing={3}>
          {/* Couple Names */}
          <Paper sx={sectionPaperSx}>
            <Typography variant="subtitleCaps" sx={{ color: COLORS.text.strong, fontSize: '1rem', mb: 2 }}>
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
                  sx={textFieldSx}
                />
              </Grid>
            </Grid>
          </Paper>


          {/* Wedding Date */}
          <Paper sx={sectionPaperSx}>
            <Typography variant="subtitleCaps" sx={{ color: COLORS.text.strong, fontSize: '1rem', mb: 2 }}>
              Wedding Dates *
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  selectsRange
                  startDate={weddingDateStart}
                  endDate={weddingDateEnd}
                  onChange={(dates) => {
                    const [start, end] = dates as [Date | null, Date | null];
                    if (start && !end && !weddingDateStart) {
                      handleDateStartChange(start);
                    } else if (start && end) {
                      handleDateStartChange(start);
                      handleDateEndChange(end);
                    } else if (start && !end) {
                      handleDateStartChange(start);
                      setWeddingDateEnd(null);
                    }
                  }}
                  customInput={<AdminDateInput label="Wedding Dates" error={!!fieldErrors.wedding_date_start} />}
                  dateFormat="MMM d, yyyy"
                  wrapperClassName="onboarding-datepicker-wrapper"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Date Display Preview and Edit */}
          {/* {weddingDateStart && (
            <Box sx={{ p: 2, bgcolor: alpha(COLORS.brand.primary, 0.05), borderRadius: RADII.md, border: `1px solid ${alpha(COLORS.brand.primary, 0.2)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
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
                      color: COLORS.brand.primary,
                      '&:hover': {
                        bgcolor: alpha(COLORS.brand.primary, 0.1),
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
                        color: COLORS.accent.success,
                        '&:hover': {
                          bgcolor: alpha(COLORS.accent.success, 0.1),
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
                        color: COLORS.accent.danger,
                        '&:hover': {
                          bgcolor: alpha(COLORS.accent.danger, 0.1),
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
                <Typography variant="h6" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                  {formData.wedding_date_display || formatWeddingDateDisplay(weddingDateStart, weddingDateEnd)}
                </Typography>
              )}
            </Box>
          )} */}

          {/* Venue */}
          <Paper sx={sectionPaperSx}>
            <Typography variant="subtitleCaps" sx={{ color: COLORS.text.strong, fontSize: '1rem', mb: 2 }}>
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
                  sx={textFieldSx}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Welcome Message Section */}
          <Paper sx={sectionPaperSx}>
            <Typography variant="subtitleCaps" sx={{ color: COLORS.text.strong, fontSize: '1rem', mb: 2 }}>
              Welcome Message
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
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
          </Paper>

          {/* RSVP Deadline */}
          <Paper sx={sectionPaperSx}>
            <Typography variant="subtitleCaps" sx={{ color: COLORS.text.strong, fontSize: '1rem', mb: 2 }}>
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
                      // Default to wedding date if set, otherwise 3 months from now
                      const deadline = weddingDateStart ? new Date(weddingDateStart) : new Date();
                      if (!weddingDateStart) deadline.setMonth(deadline.getMonth() + 3);
                      handleChange('rsvp_deadline', deadline.toISOString());
                    }
                  }}
                  sx={{
                    color: COLORS.brand.primary,
                    '&.Mui-checked': {
                      color: COLORS.brand.primary,
                    },
                  }}
                />
              }
              label="Set RSVP Deadline"
              sx={{ color: COLORS.text.muted }}
            />

            {!!formData.rsvp_deadline && formData.rsvp_deadline !== 'TBD' && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    selected={(() => {
                      if (!formData.rsvp_deadline || formData.rsvp_deadline === 'TBD') return null;
                      try {
                        const d = parseISO(formData.rsvp_deadline);
                        return isNaN(d.getTime()) ? null : d;
                      } catch { return null; }
                    })()}
                    onChange={(date: Date | null) => {
                      if (date) {
                        handleChange('rsvp_deadline', date.toISOString());
                      }
                    }}
                    customInput={<AdminDateInput label="RSVP Deadline" />}
                    dateFormat="MMM d, yyyy"
                    wrapperClassName="onboarding-datepicker-wrapper"
                  />
                </Grid>
              </Grid>
            )}
          </Stack>
          </Paper>

        </Stack>
      </Stack>
      <ContinueButton weddingSlug={weddingSlug} currentSection="details" weddingId={weddingId} />
    </Box>

  );
}
