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
import { Save, Check, Add, ArrowForward, Delete, Edit, Cancel } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import ImageUpload from '@/components/admin/ImageUpload';
import { weddingService } from '@/lib/supabase/wedding-service';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';

// Use enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

interface DetailsFormData {
  couple_name: string;
  bride_name: string;
  groom_name: string;
  wedding_date_display: string;
  venue_name: string;
  venue_location: string;
  rsvp_deadline: string;
  couple_image_url: string | null;
  frame_image_url: string | null;
}

// Helper function to generate couple name from first names
const generateCoupleName = (brideName: string, groomName: string): string => {
  const brideFirst = brideName.trim().split(' ')[0];
  const groomFirst = groomName.trim().split(' ')[0];
  if (!brideFirst && !groomFirst) return '';
  if (!brideFirst) return groomFirst;
  if (!groomFirst) return brideFirst;
  return `${brideFirst} & ${groomFirst}`;
};

// Helper function to format wedding date display
const formatWeddingDateDisplay = (startDate: Date | null, endDate: Date | null): string => {
  if (!startDate) return '';
  
  if (!endDate || startDate.getTime() === endDate.getTime()) {
    // Single day event
    return format(startDate, 'd MMMM, yyyy').toUpperCase();
  }
  
  const startDay = format(startDate, 'd');
  const endDay = format(endDate, 'd');
  const month = format(startDate, 'MMMM').toUpperCase();
  const year = format(startDate, 'yyyy');
  
  return `${startDay}-${endDay} ${month}, ${year}`;
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
    bride_name: '',
    groom_name: '',
    wedding_date_display: '',
    venue_name: '',
    venue_location: '',
    rsvp_deadline: '',
    couple_image_url: null,
    frame_image_url: null,
  });

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
          wedding.bride_name || '',
          wedding.groom_name || ''
        ) || wedding.couple_name || '';
        
        setFormData({
          couple_name: autoCoupleName,
          bride_name: wedding.bride_name || '',
          groom_name: wedding.groom_name || '',
          wedding_date_display: wedding.wedding_date_display || '',
          venue_name: wedding.venue_name || '',
          venue_location: wedding.venue_location || '',
          rsvp_deadline: wedding.rsvp_deadline || '',
          couple_image_url: wedding.couple_image_url || null,
          frame_image_url: wedding.frame_image_url || null,
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
    
    // Auto-generate couple name when bride or groom name changes
    if (field === 'bride_name' || field === 'groom_name') {
      const coupleName = generateCoupleName(updatedFormData.bride_name, updatedFormData.groom_name);
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
      if (!formData.couple_name || !formData.bride_name || !formData.groom_name) {
        if (!formData.bride_name) newFieldErrors.bride_name = true;
        if (!formData.groom_name) newFieldErrors.groom_name = true;
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
        bride_name: string;
        groom_name: string;
        wedding_date: string;
        wedding_date_end: string | null;
        wedding_date_display: string;
        venue_name: string;
        venue_location: string;
        rsvp_deadline: string;
        couple_image_url: string | null;
        couple_images: string[] | null;
        frame_image_url: string | null;
        slug: string;
      }> = {
        couple_name: formData.couple_name,
        bride_name: formData.bride_name,
        groom_name: formData.groom_name,
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

  return (
    <Container maxWidth="xl">
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            Wedding Details
          </Typography>
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 400, color: '#6a6a6a' }}>
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
                    label="Bride's Name (Full Name)"
                    fullWidth
                    value={formData.bride_name}
                    onChange={(e) => handleChange('bride_name', e.target.value)}
                    placeholder="e.g., Simran Kaur"
                    required
                    error={fieldErrors.bride_name}
                    helperText="Auto-generates couple name from first names"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Groom's Name (Full Name)"
                    fullWidth
                    value={formData.groom_name}
                    onChange={(e) => handleChange('groom_name', e.target.value)}
                    placeholder="e.g., Karanvir Singh"
                    required
                    error={fieldErrors.groom_name}
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
                sx={{ color: '#4a4a4a'}}
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
                          setTempDateDisplay(formData.wedding_date_display || formatWeddingDateDisplay(weddingDateStart, isOneDayEvent ? null : weddingDateEnd));
                          setEditingDateDisplay(true);
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
                                src={formData.frame_image_url}
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
                                  src={coupleImages[0]}
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
    </Container>
  );
}
