'use client';

import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Stack,
  Paper,
  alpha,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { SuccessAlert, ErrorAlert } from '@/components/shared/Alert';
import { useState } from 'react';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { supabase } from '@/lib/supabase/client';
import { Send } from '@mui/icons-material';
import { motion } from 'framer-motion';
import AppFooter from '@/components/shared/AppFooter';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to submit message');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <AppHeader variant="transparent" />

      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 12, md: 20 }, pb: 10 }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Stack spacing={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: 'var(--font-instrument-serif)',
                    fontStyle: 'italic',
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    color: COLORS.text.strong,
                    mb: 1,
                  }}
                >
                  Contact Us
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', fontSize: '1.1rem' }}>
                  Have questions? We'd love to hear from you.
                </Typography>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 6 },
                  px: { md: 8 },
                  borderRadius: '32px',
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: alpha('#000', 0.08),
                  boxShadow: '0 20px 40px rgba(0,0,0,0.03)',
                }}
              >
                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Your Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      sx={textFieldSx}
                    />
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      sx={textFieldSx}
                    />
                    <TextField
                      fullWidth
                      label="Phone Number (Optional)"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      variant="outlined"
                      sx={textFieldSx}
                    />
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      multiline
                      rows={4}
                      variant="outlined"
                      sx={textFieldSx}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      fullWidth
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                      sx={{
                        bgcolor: COLORS.brand.primary,
                        color: 'white',
                        py: 2,
                        borderRadius: RADII.lg,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        '&:hover': { bgcolor: COLORS.brand.primaryHover },
                        boxShadow: '0 8px 16px rgba(222, 63, 94, 0.2)',
                      }}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Stack>
                </form>
              </Paper>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <SuccessAlert onClose={() => setSuccess(false)} sx={{ width: '100%' }}>
          Message sent successfully! We'll get back to you soon.
        </SuccessAlert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <ErrorAlert onClose={() => setError(null)} sx={{ width: '100%' }}>
          {error}
        </ErrorAlert>
      </Snackbar>
      <AppFooter />
    </OptimizedBackground>
  );
}

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.lg,
    '& fieldset': {
      borderColor: alpha('#000', 0.15),
    },
    '&:hover fieldset': {
      borderColor: COLORS.brand.primary,
    },
    '&.Mui-focused fieldset': {
      borderWidth: '2px',
      borderColor: COLORS.brand.primary,
    },
    '& input::placeholder': {
      color: '#444',
      opacity: 0.8,
    },
    '& textarea::placeholder': {
      color: '#444',
      opacity: 0.8,
    },
  },
  '& .MuiInputLabel-root': {
    color: '#555',
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: COLORS.brand.primary,
  },
};


