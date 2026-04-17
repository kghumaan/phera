'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  alpha,
} from '@mui/material';
import { DirectionsBus, CheckCircle, WhatsApp, Add, Remove } from '@mui/icons-material';
import { submitTravelSignup } from '@/lib/supabase/travel-service';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import Link from 'next/link';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface TravelFormData {
  name: string;
  email: string;
  party_size: number;
  bangkok_to_huahin: boolean;
  huahin_to_airport: boolean;
  huahin_to_sukhumvit: boolean;
}

const initialFormData: TravelFormData = {
  name: '',
  email: '',
  party_size: 1,
  bangkok_to_huahin: false,
  huahin_to_airport: false,
  huahin_to_sukhumvit: false,
};

export default function TravelFormPage() {
  const [formData, setFormData] = useState<TravelFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.party_size < 1) {
      newErrors.party_size = 'Party size must be at least 1';
    }

    // Validate that user can only select one return option
    if (formData.huahin_to_airport && formData.huahin_to_sukhumvit) {
      newErrors.return_trip = 'Please select only one return destination (Airport OR Sukhumvit)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    console.log('Starting form submission with data:', formData);
    setLoading(true);

    try {
      const submissionData = {
        wedding_id: 'sim-kv',
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        party_size: formData.party_size,
        bangkok_to_huahin: formData.bangkok_to_huahin,
        huahin_to_airport: formData.huahin_to_airport,
        huahin_to_sukhumvit: formData.huahin_to_sukhumvit,
      };

      console.log('Calling TravelService with:', submissionData);

      const { data, error: submitError } = await submitTravelSignup(submissionData);

      console.log('TravelService response:', { data, error: submitError });

      if (submitError) {
        throw submitError;
      }

      console.log('Submission successful!', data);
      setSuccess(true);
      setFormData(initialFormData);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      // Nice user-friendly error message
      let message = err.message || 'Failed to submit. Please try again.';
      if (message.includes('Database table not set up')) {
        message = 'System configuration error: Database not ready.';
      }
      setError(message);
    } finally {
      console.log('Form submission finished');
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TravelFormData, value: any) => {
    // Handle mutual exclusivity for return trips
    if (field === 'huahin_to_airport' && value === true) {
      setFormData(prev => ({
        ...prev,
        huahin_to_sukhumvit: false, // Uncheck the other option
        [field]: value,
      }));
    } else if (field === 'huahin_to_sukhumvit' && value === true) {
      setFormData(prev => ({
        ...prev,
        huahin_to_airport: false, // Uncheck the other option
        [field]: value,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear return trip error when checkboxes change
    if ((field === 'huahin_to_airport' || field === 'huahin_to_sukhumvit') && errors.return_trip) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.return_trip;
        return newErrors;
      });
    }
  };

  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen">
      <Container
        maxWidth="sm"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 4, md: 6 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: '32px',
            bgcolor: alpha(COLORS.bg.white, 0.95),
            backdropFilter: 'blur(10px)',
            width: '100%',
          }}
        >
          {success ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle
                sx={{
                  fontSize: { xs: 60, md: 80 },
                  color: COLORS.accent.success,
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'Outfit',
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.125rem' },
                  color: COLORS.text.strong,
                  fontWeight: 400,
                }}
              >
                All Set!
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 4,
                  color: COLORS.text.strong,
                  fontSize: { xs: '1rem', md: '1.125rem' },
                }}
              >
                Your shuttle preference has been received. We'll forward these details to our agent and you'll hear from us in next few days as things are finalized. Please note that if one of these buses doesn't make sense then please schedule a taxi/grab for yourself. You are now free to close this window.
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <DirectionsBus
                    sx={{
                      fontSize: { xs: 40, md: 50 },
                      color: COLORS.brand.primary,
                      mb: 1,
                    }}
                  />
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: 'Outfit',
                      mb: 1,
                      fontSize: { xs: '1.75rem', md: '2.125rem' },
                      color: COLORS.text.strong,
                      fontWeight: 400,
                    }}
                  >
                    Shuttle Sign-Up
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: COLORS.text.strong,
                      fontSize: { xs: '0.95rem', md: '1.05rem' },
                    }}
                  >
                    We are attempting to help book 35 person buses if we get enough people interested ($15-20/person per trip)
                  </Typography>
                </Box>

                {/* Name */}
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  disabled={loading}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: RADII.lg,
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: COLORS.text.strong,
                      '& fieldset': {
                        borderColor: '#999999',
                      },
                      '&:hover fieldset': {
                        borderColor: COLORS.text.subtle,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.brand.primary,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: COLORS.text.subtle,
                      '&.Mui-focused': {
                        color: COLORS.brand.primary,
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: COLORS.text.strong,
                      '&:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 1000px white inset !important',
                        WebkitTextFillColor: '#000000 !important',
                        caretColor: COLORS.text.strong,
                        borderRadius: 'inherit',
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
                      '&:-webkit-autofill:hover': {
                        WebkitBoxShadow: '0 0 0 1000px white inset !important',
                        WebkitTextFillColor: '#000000 !important',
                      },
                      '&:-webkit-autofill:focus': {
                        WebkitBoxShadow: '0 0 0 1000px white inset !important',
                        WebkitTextFillColor: '#000000 !important',
                      },
                      '&:-webkit-autofill:active': {
                        WebkitBoxShadow: '0 0 0 1000px white inset !important',
                        WebkitTextFillColor: '#000000 !important',
                      },
                    },
                  }}
                />

                {/* Email */}
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={loading}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: RADII.lg,
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: COLORS.text.strong,
                      '& fieldset': {
                         borderColor: '#999999',
                      },
                      '&:hover fieldset': {
                        borderColor: COLORS.text.subtle,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.brand.primary,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: COLORS.text.subtle,
                      '&.Mui-focused': {
                        color: COLORS.brand.primary,
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: COLORS.text.strong,
                      '&:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 1000px white inset !important',
                        WebkitTextFillColor: '#000000 !important',
                        caretColor: COLORS.text.strong,
                        borderRadius: 'inherit',
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
                      '&:-webkit-autofill:hover': {
                        WebkitBoxShadow: '0 0 0 1000px white inset !important',
                        WebkitTextFillColor: '#000000 !important',
                      },
                      '&:-webkit-autofill:focus': {
                        WebkitBoxShadow: '0 0 0 1000px white inset !important',
                        WebkitTextFillColor: '#000000 !important',
                      },
                      '&:-webkit-autofill:active': {
                        WebkitBoxShadow: '0 0 0 1000px white inset !important',
                        WebkitTextFillColor: '#000000 !important',
                      },
                    },
                  }}
                />

                {/* Party Size */}
                <Box>
                    <Typography gutterBottom sx={{ color: COLORS.text.subtle }}>
                        Party Size
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button
                            variant="outlined"
                            sx={{ 
                                minWidth: '48px', 
                                width: '48px', 
                                height: '48px',
                                borderRadius: RADII.md,
                                borderColor: COLORS.text.faint,
                                color: COLORS.text.strong,
                                '&:hover': { borderColor: COLORS.brand.primary, color: COLORS.brand.primary }
                            }}
                            onClick={() => handleInputChange('party_size', Math.max(1, formData.party_size - 1))}
                        >
                            <Remove />
                        </Button>
                        <TextField
                            sx={{
                                width: '80px',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: RADII.md,
                                    textAlign: 'center',
                                    color: COLORS.text.strong,
                                    '& fieldset': { borderColor: COLORS.text.faint },
                                    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
                                },
                                '& input': { textAlign: 'center', color: COLORS.text.strong }
                            }}
                            value={formData.party_size}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                    handleInputChange('party_size', 0); // Handle empty as 0 temporarily
                                } else {
                                    const num = parseInt(val);
                                    if (!isNaN(num)) handleInputChange('party_size', num);
                                }
                            }}
                            onBlur={() => {
                                if (formData.party_size < 1) handleInputChange('party_size', 1);
                            }}
                            inputProps={{ min: 1, type: 'number', style: { textAlign: 'center' } }}
                        />
                         <Button
                            variant="outlined"
                            sx={{ 
                                minWidth: '48px', 
                                width: '48px', 
                                height: '48px',
                                borderRadius: RADII.md,
                                borderColor: COLORS.text.faint,
                                color: COLORS.text.strong,
                                '&:hover': { borderColor: COLORS.brand.primary, color: COLORS.brand.primary }
                            }}
                            onClick={() => handleInputChange('party_size', formData.party_size + 1)}
                        >
                            <Add />
                        </Button>
                    </Stack>
                </Box>


                <Divider sx={{ my: 1, borderColor: COLORS.border.default }} />

                {/* Bus Options */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: COLORS.text.strong,
                      fontSize: { xs: '1.05rem', md: '1.15rem' },
                    }}
                  >
                    Select shuttles you would like to join
                  </Typography>

                  <Stack spacing={2}>
                    {/* Bangkok to Hua Hin */}
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: RADII.lg,
                        border: formData.bangkok_to_huahin
                          ? '2px solid #DE3F5E'
                          : '1px solid #999999',
                        bgcolor: formData.bangkok_to_huahin
                          ? alpha(COLORS.brand.primary, 0.05)
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() =>
                        handleInputChange('bangkok_to_huahin', !formData.bangkok_to_huahin)
                      }
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.bangkok_to_huahin}
                            onChange={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            disabled={loading}
                            sx={{
                              color: COLORS.text.subtle,
                              '&.Mui-checked': {
                                color: COLORS.brand.primary,
                              },
                              pointerEvents: 'none',
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: '1rem', md: '1.1rem' },
                                color: COLORS.text.strong,
                              }}
                            >
                              Bangkok → Hua Hin
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: COLORS.text.strong,
                                fontSize: { xs: '0.9rem', md: '1rem' },
                              }}
                            >
                              Friday, Jan 3 at 1:00 PM
                            </Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0, pointerEvents: 'none' }}
                      />
                    </Paper>
                    
                    {/* Notice for Return Trips */}
                    <Typography
                        variant="caption"
                        sx={{
                            color: COLORS.text.subtle,
                            fontStyle: 'italic',
                             mt: 1,
                             display: 'block'
                        }}
                    >
                        Note: You can only select one return trip option. The Airport shuttle goes directly to BKK, while the Sukhumvit shuttle goes to Bangkok central.
                    </Typography>

                    {/* Hua Hin to Airport */}
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: RADII.lg,
                        border: formData.huahin_to_airport
                          ? '2px solid #DE3F5E'
                          : '1px solid #999999',
                        bgcolor: formData.huahin_to_airport
                          ? alpha(COLORS.brand.primary, 0.05)
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() =>
                        handleInputChange('huahin_to_airport', !formData.huahin_to_airport)
                      }
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.huahin_to_airport}
                            onChange={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            disabled={loading}
                            sx={{
                              color: COLORS.text.subtle,
                              '&.Mui-checked': {
                                color: COLORS.brand.primary,
                              },
                              pointerEvents: 'none',
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: '1rem', md: '1.1rem' },
                                color: COLORS.text.strong,
                              }}
                            >
                              Hua Hin → Bangkok Airport (Suvarnabhumi)
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: COLORS.text.strong,
                                fontSize: { xs: '0.9rem', md: '1rem' },
                              }}
                            >
                              Monday, Jan 6 at 9:00 AM
                            </Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0, pointerEvents: 'none' }}
                      />
                    </Paper>

                    {/* Hua Hin to Sukhumvit */}
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: RADII.lg,
                        border: formData.huahin_to_sukhumvit
                          ? '2px solid #DE3F5E'
                          : '1px solid #999999',
                        bgcolor: formData.huahin_to_sukhumvit
                          ? alpha(COLORS.brand.primary, 0.05)
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() =>
                        handleInputChange('huahin_to_sukhumvit', !formData.huahin_to_sukhumvit)
                      }
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.huahin_to_sukhumvit}
                            onChange={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            disabled={loading}
                            sx={{
                              color: COLORS.text.subtle,
                              '&.Mui-checked': {
                                color: COLORS.brand.primary,
                              },
                              pointerEvents: 'none',
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: '1rem', md: '1.1rem' },
                                color: COLORS.text.strong,
                              }}
                            >
                              Hua Hin → Bangkok Sukhumvit
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: COLORS.text.strong,
                                fontSize: { xs: '0.9rem', md: '1rem' },
                              }}
                            >
                              Monday, Jan 6 at 1:00-2:00 PM
                            </Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0, pointerEvents: 'none' }}
                      />
                    </Paper>
                  </Stack>

                  {errors.return_trip && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: RADII.md }}>
                      {errors.return_trip}
                    </Alert>
                  )}
                </Box>

                <Divider sx={{ my: 1, borderColor: COLORS.border.default }} />

                {/* Additional Options Note */}
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: RADII.lg,
                    bgcolor: alpha('#20C997', 0.05),
                    border: '1px solid',
                    borderColor: '#20C997',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: COLORS.text.strong,
                        fontSize: { xs: '0.95rem', md: '1.05rem' },
                      }}
                    >
                      Other Transport Options
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: COLORS.text.strong,
                        fontSize: { xs: '0.9rem', md: '1rem' },
                      }}
                    >
                      <strong>Small Group Shuttles (max 6 people):</strong> <br />Contact Lynda via WhatsApp
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          component="a"
                          href="https://wa.me/66882959254"
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<WhatsApp />}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: COLORS.accent.success,
                            color: COLORS.accent.success,
                            borderRadius: RADII.md,
                            textTransform: 'none',
                            fontSize: { xs: '0.9rem', md: '1rem' },
                            '&:hover': {
                              borderColor: '#1ead54',
                              bgcolor: alpha(COLORS.accent.success, 0.05),
                            },
                          }}
                        >
                          +66 88 295 9254
                        </Button>
                    </Box>
                     <Divider sx={{ my: 1, borderColor: alpha('#20C997', 0.2) }} />
                     
                     <Typography
                        variant="body2"
                        sx={{
                            color: COLORS.text.strong,
                             fontSize: { xs: '0.9rem', md: '1rem' },
                        }}
                     >
                        <strong>City Transport:</strong> <br />Download Grab in advance to get around in Bangkok via motor bikes / taxis
                     </Typography>
                     
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                         <Button
                          component="a"
                          href="https://apps.apple.com/us/app/grab-taxi-ride-food-delivery/id647268330"
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#00B14F',
                            color: '#00B14F',
                            borderRadius: RADII.md,
                             textTransform: 'none',
                             fontSize: { xs: '0.9rem', md: '1rem' },
                             '&:hover': {
                                 borderColor: '#008a3d',
                                 bgcolor: alpha('#00B14F', 0.05)
                             }
                          }}
                        >
                            Download Grab App
                        </Button>
                      </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        color: COLORS.text.subtle,
                        fontSize: { xs: '0.85rem', md: '0.9rem' },
                      }}
                    >
                      You can also arrange your own taxi or car rental
                    </Typography>
                  </Stack>
                </Paper>

                {/* Error Alert */}
                {error && (
                  <Alert severity="error" sx={{ borderRadius: RADII.md }}>
                    {error}
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    bgcolor: COLORS.brand.primary,
                    color: COLORS.text.inverse,
                    borderRadius: RADII.lg,
                    py: 1.5,
                    fontSize: { xs: '1.05rem', md: '1.15rem' },
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: COLORS.brand.primaryHover,
                    },
                    '&:disabled': {
                      bgcolor: COLORS.border.default,
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: COLORS.text.inverse }} /> : 'Submit Registration'}
                </Button>

                <Typography
                  variant="caption"
                  sx={{
                    textAlign: 'center',
                    color: COLORS.text.subtle,
                    fontSize: { xs: '0.85rem', md: '0.9rem' },
                  }}
                >
                  You can update your selection anytime by resubmitting
                </Typography>
              </Stack>
            </Box>
          )}
        </Paper>
      </Container>
    </OptimizedBackground>
  );
}
