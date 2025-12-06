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
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Save, Check, Add, ArrowForward, Delete } from '@mui/icons-material';
import ImageUpload from '@/components/admin/ImageUpload';
import { weddingService } from '@/lib/supabase/wedding-service';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Consistent TextField styling with enhanced sizes
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    bgcolor: 'white',
    fontSize: '1.1rem',
    '& input': {
      py: 2.5,
      fontSize: '1.1rem',
    },
    '& textarea': {
      fontSize: '1.1rem',
    },
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: '#DE3F5E',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DE3F5E',
      borderWidth: '2px',
    },
    '&.Mui-disabled': {
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.15)',
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: '#4a4a4a',
    fontSize: '1rem',
    '&.Mui-disabled': {
      color: '#6a6a6a',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#DE3F5E',
  },
  '& .MuiInputBase-input': {
    color: '#1a1a1a',
    '&.Mui-disabled': {
      WebkitTextFillColor: '#4a4a4a',
      color: '#4a4a4a',
    },
    '&:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 100px white inset',
      WebkitTextFillColor: '#1a1a1a',
      caretColor: '#1a1a1a',
      borderRadius: 'inherit',
    },
  },
  '& .MuiFormHelperText-root': {
    color: '#6a6a6a',
    fontSize: '0.875rem',
  },
};

interface DetailsFormData {
  couple_name: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  wedding_date_display: string;
  venue_name: string;
  venue_location: string;
  venue_flag: string;
  rsvp_deadline: string;
  couple_image_url: string | null;
  frame_image_url: string | null;
}

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
  const [formData, setFormData] = useState<DetailsFormData>({
    couple_name: '',
    bride_name: '',
    groom_name: '',
    wedding_date: '',
    wedding_date_display: '',
    venue_name: '',
    venue_location: '',
    venue_flag: '🇹🇭',
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
        setFormData({
          couple_name: wedding.couple_name || '',
          bride_name: wedding.bride_name || '',
          groom_name: wedding.groom_name || '',
          wedding_date: wedding.wedding_date?.split('T')[0] || '',
          wedding_date_display: wedding.wedding_date_display || '',
          venue_name: wedding.venue_name || '',
          venue_location: wedding.venue_location || '',
          venue_flag: wedding.venue_flag || '🇹🇭',
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
    setFormData(prev => ({ ...prev, [field]: value }));
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
      if (!formData.couple_name) newFieldErrors.couple_name = true;
      if (!formData.wedding_date) newFieldErrors.wedding_date = true;
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

      // Generate slug from couple names
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
        wedding_date_display: string;
        venue_name: string;
        venue_location: string;
        venue_flag: string;
        rsvp_deadline: string;
        couple_image_url: string | null;
        couple_images: string[] | null;
        frame_image_url: string | null;
        slug: string;
      }> = {
        ...formData,
        wedding_date: new Date(formData.wedding_date).toISOString(),
        slug: finalSlug,
        couple_images: validCoupleImages.length > 0 ? validCoupleImages : null,
        // Keep first image as couple_image_url for backward compatibility
        couple_image_url: validCoupleImages[0] || formData.couple_image_url,
      };

      if (weddingId) {
        await weddingService.updateWedding(weddingId, updateData);
        
        // If slug changed, redirect to new URL
        if (finalSlug !== weddingSlug) {
          setSuccess(true);
          setTimeout(() => {
            router.push(`/admin/onboarding/${finalSlug}/details`);
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
          <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
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
            
            <TextField
              label="Combined Couple Name"
              fullWidth
              value={formData.couple_name}
              onChange={(e) => handleChange('couple_name', e.target.value)}
              placeholder="e.g., Simran & Karanvir"
              required
              error={fieldErrors.couple_name}
              helperText="This will be displayed on the main page"
              sx={textFieldSx}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Bride's Name"
                  fullWidth
                  value={formData.bride_name}
                  onChange={(e) => handleChange('bride_name', e.target.value)}
                  sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Groom's Name"
                  fullWidth
                  value={formData.groom_name}
                  onChange={(e) => handleChange('groom_name', e.target.value)}
                  sx={textFieldSx}
                />
              </Grid>
            </Grid>

            {/* Wedding Date */}
            <Typography variant="h5" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a' }}>
              Wedding Date *
            </Typography>

            <TextField
              label="Wedding Date"
              type="date"
              fullWidth
              value={formData.wedding_date}
              onChange={(e) => handleChange('wedding_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              error={fieldErrors.wedding_date}
              sx={textFieldSx}
            />

            <TextField
              label="Wedding Date Display Text"
              fullWidth
              value={formData.wedding_date_display}
              onChange={(e) => handleChange('wedding_date_display', e.target.value)}
              placeholder="e.g., 4-6 JANUARY, 2026"
              helperText="How the date should appear to guests"
              sx={textFieldSx}
            />

            {/* Venue */}
            <Typography variant="h5" sx={{ fontWeight: 600, mt: 2, color: '#1a1a1a' }}>
              Venue Information *
            </Typography>

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

            <TextField
              label="Venue Location"
              fullWidth
              value={formData.venue_location}
              onChange={(e) => handleChange('venue_location', e.target.value)}
              placeholder="e.g., Hua Hin, Thailand"
              required
              sx={textFieldSx}
            />

            <TextField
              label="Country Flag Emoji"
              fullWidth
              value={formData.venue_flag}
              onChange={(e) => handleChange('venue_flag', e.target.value)}
              placeholder="e.g., 🇹🇭"
              helperText="Use a flag emoji to represent the country"
              sx={textFieldSx}
            />

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
