'use client';

import { Container, Typography, Box } from '@mui/material';
import SMSTestComponent from '@/components/auth/SMSTestComponent';

export default function TestSMSPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          SMS OTP Debugging
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use this page to test SMS OTP functionality and see detailed error messages.
        </Typography>
      </Box>

      <SMSTestComponent />

      <Box sx={{ mt: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Troubleshooting Steps:
        </Typography>
        <Typography variant="body2" component="div">
          1. <strong>Open browser console</strong> (F12 → Console tab)<br/>
          2. <strong>Enter your phone number</strong> with country code<br/>
          3. <strong>Click "Send OTP"</strong> and check console for errors<br/>
          4. <strong>Look for specific error messages</strong> about SMS provider<br/>
          5. <strong>Check Supabase Dashboard</strong> → Authentication → Settings → Phone Auth
        </Typography>
      </Box>
    </Container>
  );
} 