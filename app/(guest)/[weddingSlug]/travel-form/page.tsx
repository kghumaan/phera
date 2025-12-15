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
import { DirectionsBus, CheckCircle, WhatsApp } from '@mui/icons-material';
import { supabase } from '@/lib/supabase/client';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import Link from 'next/link';

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
      return;
    }

    console.log('Starting form submission...');
    setLoading(true);

    try {
      const { data, error: submitError } = await supabase
        .from('travel_bus_signups')
        .upsert(
          {
            wedding_id: 'sim-kv',
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            party_size: formData.party_size,
            bangkok_to_huahin: formData.bangkok_to_huahin,
            huahin_to_airport: formData.huahin_to_airport,
            huahin_to_sukhumvit: formData.huahin_to_sukhumvit,
          },
          {
            onConflict: 'wedding_id,email',
          }
        )
        .select()
        .single();

      if (submitError) {
        console.error('Submission error:', submitError);
        throw new Error(submitError.message);
      }

      setSuccess(true);
      setFormData(initialFormData);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Failed to submit. Please try again.');
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
            bgcolor: alpha('#fff', 0.95),
            backdropFilter: 'blur(10px)',
            width: '100%',
          }}
        >
          {success ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle
                sx={{
                  fontSize: { xs: 60, md: 80 },
                  color: '#4CAF50',
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'var(--font-instrument-serif)',
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.125rem' },
                  color: '#000000',
                }}
              >
                All Set!
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 4,
                  color: '#333333',
                  fontSize: { xs: '1rem', md: '1.125rem' },
                }}
              >
                Your shuttle registration has been received. We'll send you confirmation details via email.
              </Typography>
              <Button
                component={Link}
                href="/sim-kv"
                variant="contained"
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  borderRadius: '16px',
                  px: 4,
                  py: 1.5,
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#C8365A',
                  },
                }}
              >
                Back to Wedding Site
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <DirectionsBus
                    sx={{
                      fontSize: { xs: 40, md: 50 },
                      color: '#DE3F5E',
                      mb: 1,
                    }}
                  />
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: 'var(--font-instrument-serif)',
                      mb: 1,
                      fontSize: { xs: '1.75rem', md: '2.125rem' },
                      color: '#000000',
                    }}
                  >
                    Shuttle Sign-Up
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#333333',
                      fontSize: { xs: '0.95rem', md: '1.05rem' },
                    }}
                  >
                    We are attempting to help book 40 person buses if we get enough people interested (~$20/person)
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
                      borderRadius: '16px',
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: '#000000',
                      '& fieldset': {
                        borderColor: '#999999',
                      },
                      '&:hover fieldset': {
                        borderColor: '#666666',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#DE3F5E',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: '#666666',
                      '&.Mui-focused': {
                        color: '#DE3F5E',
                      },
                    },
                    '& .MuiInputBase-input': {
                        color: '#000000',
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
                      borderRadius: '16px',
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: '#000000',
                      '& fieldset': {
                         borderColor: '#999999',
                      },
                      '&:hover fieldset': {
                        borderColor: '#666666',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#DE3F5E',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: '#666666',
                      '&.Mui-focused': {
                        color: '#DE3F5E',
                      },
                    },
                     '& .MuiInputBase-input': {
                        color: '#000000',
                    },
                  }}
                />

                {/* Party Size */}
                <TextField
                  fullWidth
                  type="number"
                  label="Party Size"
                  value={formData.party_size}
                  onChange={(e) => handleInputChange('party_size', parseInt(e.target.value) || 1)}
                  error={!!errors.party_size}
                  helperText={errors.party_size || 'How many people (including yourself)?'}
                  disabled={loading}
                  required
                  inputProps={{ min: 1, max: 20 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: '#000000',
                       '& fieldset': {
                         borderColor: '#999999',
                      },
                      '&:hover fieldset': {
                        borderColor: '#666666',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#DE3F5E',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '1rem', md: '1.125rem' },
                       color: '#666666',
                      '&.Mui-focused': {
                        color: '#DE3F5E',
                      },
                    },
                     '& .MuiInputBase-input': {
                        color: '#000000',
                    },
                     '& .MuiFormHelperText-root': {
                         color: '#666666'
                     }
                  }}
                />

                <Divider sx={{ my: 1, borderColor: '#E0E0E0' }} />

                {/* Bus Options */}
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: '#000000',
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
                        borderRadius: '16px',
                        border: formData.bangkok_to_huahin
                          ? '2px solid #DE3F5E'
                          : '1px solid #999999',
                        bgcolor: formData.bangkok_to_huahin
                          ? alpha('#DE3F5E', 0.05)
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
                            onChange={(e) =>
                              handleInputChange('bangkok_to_huahin', e.target.checked)
                            }
                            disabled={loading}
                            sx={{
                              color: '#666666',
                              '&.Mui-checked': {
                                color: '#DE3F5E',
                              },
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
                                color: '#000000',
                              }}
                            >
                              Bangkok → Hua Hin
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#333333',
                                fontSize: { xs: '0.9rem', md: '1rem' },
                              }}
                            >
                              Friday, Jan 3 at 1:00 PM
                            </Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </Paper>
                    
                    {/* Notice for Return Trips */}
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#666666',
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
                        borderRadius: '16px', // Reduced border radius slightly
                        border: formData.huahin_to_airport
                          ? '2px solid #DE3F5E'
                          : '1px solid #999999',
                        bgcolor: formData.huahin_to_airport
                          ? alpha('#DE3F5E', 0.05)
                          : 'transparent',
                         opacity: formData.huahin_to_sukhumvit ? 0.6 : 1, // Visual cue for disabled state
                        cursor: formData.huahin_to_sukhumvit ? 'not-allowed' : 'pointer', // Cursor change
                        transition: 'all 0.2s',
                         pointerEvents: formData.huahin_to_sukhumvit ? 'none' : 'auto',
                      }}
                       // Only allow click if the other option is not selected OR if we are unselecting this one.
                       // Actually, better UX: clicking selects this and unselects other automatically. The handleInputChange logic handles that.
                       // So we can keep it clickable always and just let logic swap.
                       // BUT user asked "only one of those should be clickable".
                       // That implies radio button behavior visually or physically.
                       // The logic I wrote swaps them. So both ARE clickable, just mutually exclusive.
                       // "Make a small notice that only the first Hua Hin -> Bangkok option goes straight to the airport, the other will go to Bangkok central."
                       // "Only one of those should be clickable" -> Use radio buttons? Or just swap logic?
                       // Given it's checkboxes, swap logic is standard "radio-like" behavior for checkboxes.
                       // I will make them behave like radio buttons where clicking one deselects the other.
                       // I will NOT disable them visually so user CAN switch.
                        onClick={() =>
                            handleInputChange('huahin_to_airport', !formData.huahin_to_airport)
                          }
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.huahin_to_airport}
                            onChange={(e) =>
                              handleInputChange('huahin_to_airport', e.target.checked)
                            }
                            disabled={loading}
                            sx={{
                              color: '#666666',
                              '&.Mui-checked': {
                                color: '#DE3F5E',
                              },
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
                                color: '#000000',
                              }}
                            >
                              Hua Hin → Bangkok Airport (Suvarnabhumi)
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#333333',
                                fontSize: { xs: '0.9rem', md: '1rem' },
                              }}
                            >
                              Monday, Jan 6 at 9:00 AM
                            </Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </Paper>

                    {/* Hua Hin to Sukhumvit */}
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        border: formData.huahin_to_sukhumvit
                          ? '2px solid #DE3F5E'
                          : '1px solid #999999',
                        bgcolor: formData.huahin_to_sukhumvit
                          ? alpha('#DE3F5E', 0.05)
                          : 'transparent',
                        // opacity: formData.huahin_to_airport ? 0.6 : 1,
                        // cursor: formData.huahin_to_airport ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        // pointerEvents: formData.huahin_to_airport ? 'none' : 'auto',
                      }}
                       onClick={() =>
                        handleInputChange('huahin_to_sukhumvit', !formData.huahin_to_sukhumvit)
                      }
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.huahin_to_sukhumvit}
                            onChange={(e) =>
                              handleInputChange('huahin_to_sukhumvit', e.target.checked)
                            }
                            disabled={loading}
                            sx={{
                              color: '#666666',
                              '&.Mui-checked': {
                                color: '#DE3F5E',
                              },
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
                                color: '#000000',
                              }}
                            >
                              Hua Hin → Bangkok Sukhumvit
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#333333',
                                fontSize: { xs: '0.9rem', md: '1rem' },
                              }}
                            >
                              Monday, Jan 6 at 1:00-2:00 PM
                            </Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </Paper>
                  </Stack>

                  {errors.return_trip && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>
                      {errors.return_trip}
                    </Alert>
                  )}
                </Box>

                <Divider sx={{ my: 1, borderColor: '#E0E0E0' }} />

                {/* Additional Options Note */}
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
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
                        color: '#000000',
                        fontSize: { xs: '0.95rem', md: '1.05rem' },
                      }}
                    >
                      Other Transport Options
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#333333',
                        fontSize: { xs: '0.9rem', md: '1rem' },
                      }}
                    >
                      <strong>Small Group Shuttles (max 6 people):</strong> Contact Linda via WhatsApp
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
                            borderColor: '#25D366',
                            color: '#25D366',
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontSize: { xs: '0.9rem', md: '1rem' },
                            '&:hover': {
                              borderColor: '#1ead54',
                              bgcolor: alpha('#25D366', 0.05),
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
                            color: '#333333',
                             fontSize: { xs: '0.9rem', md: '1rem' },
                        }}
                     >
                        <strong>City Transport:</strong> Download Grab in advance to get around in Bangkok via electric bikes
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
                            borderRadius: '12px',
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
                        color: '#666666',
                        fontSize: { xs: '0.85rem', md: '0.9rem' },
                      }}
                    >
                      You can also arrange your own taxi or car rental
                    </Typography>
                  </Stack>
                </Paper>

                {/* Error Alert */}
                {error && (
                  <Alert severity="error" sx={{ borderRadius: '12px' }}>
                    {error}
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    borderRadius: '16px',
                    py: 1.5,
                    fontSize: { xs: '1.05rem', md: '1.15rem' },
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#C8365A',
                    },
                    '&:disabled': {
                      bgcolor: '#ccc',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit Registration'}
                </Button>

                <Typography
                  variant="caption"
                  sx={{
                    textAlign: 'center',
                    color: '#666666',
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
