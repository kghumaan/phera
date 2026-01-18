'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { WhatsApp, ArrowBack, Send, InfoOutlined, CheckCircle } from '@mui/icons-material';
import { useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/shared/AppHeader';

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
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', color: '#000' }}>
      <AppHeader variant="solid" />
      
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            component={Link}
            href="/"
            startIcon={<ArrowBack />}
            sx={{ color: '#000', mb: 2, textTransform: 'none', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
          >
            Back to Home
          </Button>
          
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <WhatsApp sx={{ color: '#000', fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'var(--font-instrument-serif)', color: '#000' }}>
              WhatsApp Integration Test
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ color: '#000', opacity: 0.7 }}>
            Test your WhatsApp Business Cloud API integration and ensure credentials are correct.
          </Typography>
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: '24px', 
            border: '1px solid #000', 
            bgcolor: '#fff',
            boxShadow: 'none'
          }}
        >
          <form onSubmit={handleSendTest}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
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
                      borderRadius: '12px',
                      '& fieldset': { borderColor: '#000' },
                      '&:hover fieldset': { borderColor: '#000' },
                      '&.Mui-focused fieldset': { borderColor: '#000' },
                    },
                    '& .MuiInputBase-input': { color: '#000' },
                    '& .MuiFormHelperText-root': { color: '#000', opacity: 0.5 }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
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
                      borderRadius: '12px',
                      '& fieldset': { borderColor: '#000' },
                      '&:hover fieldset': { borderColor: '#000' },
                      '&.Mui-focused fieldset': { borderColor: '#000' },
                    },
                    '& .MuiInputBase-input': { color: '#000' }
                  }}
                />
              </Box>

              <Alert 
                severity="info" 
                icon={<InfoOutlined sx={{ color: '#000' }} />}
                sx={{ 
                  borderRadius: '12px', 
                  bgcolor: '#fff', 
                  border: '1px solid #000',
                  color: '#000',
                  '& .MuiAlert-icon': { color: '#000' }
                }}
              >
                <Typography variant="body2">
                  <strong>Important:</strong> During development, you must add the recipient's phone number as a 
                  verified test recipient in your <strong>Meta App Dashboard</strong> under WhatsApp &gt; API Setup.
                </Typography>
              </Alert>

              {status.type && (
                <Alert 
                  severity={status.type} 
                  icon={status.type === 'success' ? <CheckCircle sx={{ color: '#000' }} /> : undefined}
                  sx={{ 
                    borderRadius: '12px',
                    bgcolor: '#fff',
                    border: '1px solid #000',
                    color: '#000',
                    '& .MuiAlert-icon': { color: '#000' }
                  }}
                >
                  <Typography variant="body2">{status.message}</Typography>
                  {status.messageId && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                      Message ID: {status.messageId}
                    </Typography>
                  )}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                size="large"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <Send />}
                sx={{
                  bgcolor: '#000',
                  color: '#fff',
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: '#333',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: '#fff'
                  }
                }}
              >
                {loading ? 'Sending...' : 'Send Test Message'}
              </Button>
            </Stack>
          </form>
        </Paper>

        <Card sx={{ mt: 4, borderRadius: '24px', bgcolor: '#fff', border: '1px solid #000', boxShadow: 'none' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ color: '#000', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WhatsApp fontSize="small" /> Integration Status
            </Typography>
            <Divider sx={{ mb: 2, bgcolor: '#000' }} />
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', color: '#000' }}>
                <span>API Version:</span>
                <strong>{process.env.NEXT_PUBLIC_WHATSAPP_API_VERSION || 'v23.0'}</strong>
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', color: '#000' }}>
                <span>Phone ID:</span>
                <strong>{process.env.WHATSAPP_PHONE_NUMBER_ID ? '••••' + process.env.WHATSAPP_PHONE_NUMBER_ID.slice(-4) : 'Not Set'}</strong>
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', color: '#000' }}>
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
