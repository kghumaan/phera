'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  TextField,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { WhatsApp, ArrowBack, Send } from '@mui/icons-material';
import { useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/shared/AppHeader';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';
import { InfoAlert, SuccessAlert, ErrorAlert } from '@/components/shared/Alert';

export default function WhatsAppTestPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Hello from Phera! This is a test message from your wedding platform. 🎉');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    messageId?: string;
  }>({ type: null, message: '' });

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setStatus({ type: 'error', message: 'Please enter a phone number' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/whatsapp/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          message,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({
          type: 'success',
          message: 'Message sent successfully!',
          messageId: data.messageId,
        });
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Failed to send message',
        });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please check your connection and try again.',
      });
      console.error('Test Send Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg.white, color: COLORS.text.strong }}>
      <AppHeader variant="solid" />

      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            component={Link}
            href="/"
            startIcon={<ArrowBack />}
            sx={{ color: COLORS.text.strong, mb: 2, textTransform: 'none', '&:hover': { bgcolor: COLORS.bg.wash } }}
          >
            Back to Home
          </Button>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <WhatsApp sx={{ color: COLORS.text.strong, fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 400, fontStyle: 'italic', fontFamily: FONTS.display, color: COLORS.text.strong }}>
              WhatsApp Integration Test
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
            Test your WhatsApp Business Cloud API integration and ensure credentials are correct.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: RADII.dialog,
            border: `1px solid ${COLORS.border.strong}`,
            bgcolor: COLORS.bg.white,
            boxShadow: 'none'
          }}
        >
          <form onSubmit={handleSendTest}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: COLORS.text.strong }}>
                  Recipient Phone Number
                </Typography>
                <TextField
                  fullWidth
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  helperText="Include country code (e.g., +44, +91, +1)"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: RADII.md,
                      '& fieldset': { borderColor: COLORS.border.strong },
                      '&:hover fieldset': { borderColor: COLORS.text.strong },
                      '&.Mui-focused fieldset': { borderColor: COLORS.text.strong },
                    },
                    '& .MuiInputBase-input': { color: COLORS.text.strong },
                    '& .MuiFormHelperText-root': { color: COLORS.text.subtle }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: COLORS.text.strong }}>
                  Message Text
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: RADII.md,
                      '& fieldset': { borderColor: COLORS.border.strong },
                      '&:hover fieldset': { borderColor: COLORS.text.strong },
                      '&.Mui-focused fieldset': { borderColor: COLORS.text.strong },
                    },
                    '& .MuiInputBase-input': { color: COLORS.text.strong }
                  }}
                />
              </Box>

              <InfoAlert title="Important">
                During development, you must add the recipient&apos;s phone number as a
                verified test recipient in your <strong>Meta App Dashboard</strong> under WhatsApp &gt; API Setup.
              </InfoAlert>

              {status.type && (
                status.type === 'success' ? (
                  <SuccessAlert>
                    {status.message}
                    {status.messageId && (
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                        Message ID: {status.messageId}
                      </Typography>
                    )}
                  </SuccessAlert>
                ) : (
                  <ErrorAlert>
                    {status.message}
                  </ErrorAlert>
                )
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                size="large"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} sx={{ color: COLORS.text.inverse }} /> : <Send />}
                sx={{
                  bgcolor: COLORS.text.strong,
                  color: COLORS.text.inverse,
                  py: 1.5,
                  borderRadius: RADII.md,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: COLORS.text.muted,
                  },
                  '&.Mui-disabled': {
                    bgcolor: alpha(COLORS.text.strong, 0.5),
                    color: COLORS.text.inverse,
                  }
                }}
              >
                {loading ? 'Sending...' : 'Send Test Message'}
              </Button>
            </Stack>
          </form>
        </Paper>

        <Card sx={{ mt: 4, borderRadius: RADII.dialog, bgcolor: COLORS.bg.white, border: `1px solid ${COLORS.border.strong}`, boxShadow: 'none' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ color: COLORS.text.strong, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WhatsApp fontSize="small" /> Integration Status
            </Typography>
            <Divider sx={{ mb: 2, bgcolor: COLORS.border.strong }} />
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', color: COLORS.text.strong }}>
                <span>API Version:</span>
                <strong>{process.env.NEXT_PUBLIC_WHATSAPP_API_VERSION || 'v23.0'}</strong>
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', color: COLORS.text.strong }}>
                <span>Phone ID:</span>
                <strong>{process.env.WHATSAPP_PHONE_NUMBER_ID ? '••••' + process.env.WHATSAPP_PHONE_NUMBER_ID.slice(-4) : 'Not Set'}</strong>
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', color: COLORS.text.strong }}>
                <span>Access Token:</span>
                <strong>{process.env.WHATSAPP_ACCESS_TOKEN ? 'Configured' : 'Missing'}</strong>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
