'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  Box,
  Typography,
  Stack,
  IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import { COLORS } from '@/lib/theme/tokens';
import { ArrowBack } from '@mui/icons-material';
import { ErrorAlert } from '@/components/shared/Alert';

interface PaymentFormProps {
  amount: string;
  donorName: string;
  message: string;
  fundType: string;
  onBack: () => void;
}

export default function PaymentForm({ 
  amount, 
  donorName, 
  message, 
  fundType, 
  onBack 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/registry/success`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>

      {/* Payment Summary */}
      <Box
        sx={{
          borderRadius: 1,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          p: 3,
          mb: 3,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 300,
            color: COLORS.text.subtle,
            mb: 1,
          }}
        >
          Contributing to
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: COLORS.text.strong,
            mb: 2,
          }}
        >
          {fundType === 'honeymoon-fund' ? '🏝️ Honeymoon Fund' : '🏡 New Home Fund'}
        </Typography>
        
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" color="#666">Amount:</Typography>
          <Typography variant="body2" color="#141414" fontWeight={600}>${amount}</Typography>
        </Stack>
        
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" color="#666">From:</Typography>
          <Typography variant="body2" color="#141414">{donorName}</Typography>
        </Stack>
        
        {message && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            <Typography variant="caption" color="#666" sx={{ mb: 0.5, display: 'block' }}>
              Your message:
            </Typography>
            <Typography variant="body2" color="#333">
              "{message}"
            </Typography>
          </Box>
        )}
      </Box>

      {/* Payment Form */}
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {error && (
            <ErrorAlert>{error}</ErrorAlert>
          )}

          <Box
            sx={{
              borderRadius: 1,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              p: 3,
            }}
          >
            <PaymentElement
              options={{
                layout: {
                  type: 'tabs',
                  defaultCollapsed: false,
                },
              }}
            />
          </Box>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Box
              component="button"
              type="submit"
              disabled={loading || !stripe || !elements}
              sx={{
                width: '100%',
                backgroundColor: loading ? COLORS.text.subtle : COLORS.text.strong,
                color: '#fff',
                borderRadius: '16px',
                border: 'none',
                py: 3,
                px: 3,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontSize: 16,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: loading ? COLORS.text.subtle : '#2a2a2a',
                },
                '&:disabled': {
                  backgroundColor: COLORS.text.subtle,
                  cursor: 'not-allowed',
                },
              }}
            >
              {loading ? 'Processing...' : `Complete Payment - $${amount}`}
            </Box>
          </motion.div>

          <Typography
            variant="caption"
            sx={{
              fontSize: 14,
              textAlign: 'center',
              color: COLORS.text.subtle,
              mt: 2,
            }}
          >
            Your payment information is secure and encrypted
          </Typography>
        </Stack>
      </form>
    </Box>
  );
}