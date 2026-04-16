'use client';

import { useState } from 'react';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { supabase } from '@/lib/supabase/client';

export default function SMSTestComponent() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting to send OTP to:', phone);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          shouldCreateUser: true,
        }
      });

      console.log('Supabase OTP Response:', { data, error });

      if (error) {
        console.error('SMS OTP Error:', error);
        setError(`SMS Error: ${error.message}`);
      } else {
        setSuccess('OTP sent successfully! Check your phone.');
        setStep('otp');
      }
    } catch (err: any) {
      console.error('Exception sending OTP:', err);
      setError(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting to verify OTP:', otp, 'for phone:', phone);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      });

      console.log('Supabase Verify Response:', { data, error });

      if (error) {
        console.error('OTP Verification Error:', error);
        setError(`Verification Error: ${error.message}`);
      } else {
        setSuccess('OTP verified successfully!');
      }
    } catch (err: any) {
      console.error('Exception verifying OTP:', err);
      setError(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        SMS OTP Test Component
      </Typography>

      {step === 'phone' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Phone Number"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            helperText="Include country code (e.g., +1 for US)"
          />
          <Button
            variant="contained"
            onClick={handleSendOTP}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">
            OTP sent to: {phone}
          </Typography>
          <TextField
            label="Enter OTP Code"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            fullWidth
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setStep('phone');
              setOtp('');
              setError('');
              setSuccess('');
            }}
          >
            Back to Phone Entry
          </Button>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="caption" display="block">
          <strong>Debug Info:</strong>
        </Typography>
        <Typography variant="caption" display="block">
          Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
        </Typography>
        <Typography variant="caption" display="block">
          Check browser console for detailed logs
        </Typography>
      </Box>
    </Box>
  );
} 