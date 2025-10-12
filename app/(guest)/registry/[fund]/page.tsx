'use client';

import { 
  Box, 
  Container, 
  Typography, 
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '@/components/registry/PaymentForm';
import { useAuth } from '@/lib/contexts/AuthContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const fundDetails = {
  'honeymoon-fund': {
    title: '🏝️ Honeymoon Fund',
    description: 'Help create unforgettable memories on our dream honeymoon',
    longDescription: 'Your contribution will help us explore new places, try amazing foods, and create memories that will last a lifetime.',
    productId: process.env.NEXT_PUBLIC_HONEYMOON_PRODUCT_ID, // You'll need to add this
  },
  'new-home-fund': {
    title: '🏡 New Home Fund',
    description: 'Help us build our nest together',
    longDescription: 'Every contribution brings us closer to creating a warm and welcoming home where we can start our married life together.',
    productId: process.env.NEXT_PUBLIC_NEW_HOME_PRODUCT_ID, // You'll need to add this
  }
};

export default function FundPage() {
  const router = useRouter();
  const params = useParams();
  const fundType = params.fund as string;
  const { user } = useAuth();
  
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const fund = fundDetails[fundType as keyof typeof fundDetails];

  // Pre-fill name if user is logged in
  useEffect(() => {
    if (user && user.name && !name) {
      setName(user.name);
    }
  }, [user, name]);

  const handleBack = () => {
    if (showPaymentForm) {
      setShowPaymentForm(false);
    } else {
      router.push('/registry');
    }
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const handleProceedToPayment = async () => {
    if (!amount || parseFloat(amount) < 1) {
      setError('Please enter a valid amount');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          currency: 'usd',
          fundType,
          donorName: name,
          message,
          productId: fund?.productId,
        }),
      });

      const { clientSecret: secret, error: serverError } = await response.json();

      if (serverError) {
        setError(serverError);
        setLoading(false);
        return;
      }

      setClientSecret(secret);
      setShowPaymentForm(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!fund) {
    return (
      <OptimizedBackground
        src="/images/backgrounds/pearl.png"
        alt="Pearl Background"
        priority={true}
      >
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Typography variant="h4">Fund not found</Typography>
        </Container>
      </OptimizedBackground>
    );
  }

  return (
    <OptimizedBackground
      src="/images/backgrounds/lavendar.png"
      alt="Lavendar Background"
      priority={true}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100svh',
          overflowY: 'auto',
        }}
      >
        {/* Header with back button */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            pt: 2,
            pb: 2,
            flexShrink: 0,
          }}
        >
          <Container 
            maxWidth={false}
            sx={{
              maxWidth: { xs: 361, md: 600, lg: 700 },
              px: { xs: 2, md: 3 },
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <IconButton
                onClick={handleBack}
                sx={{
                  color: '#000',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <ArrowBack />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Outfit',
                  fontWeight: 400,
                  fontSize: 18,
                  lineHeight: 1.5,
                  letterSpacing: '5.56%',
                  textTransform: 'uppercase',
                  color: '#141414',
                  textAlign: 'center',
                }}
              >
                {fundType === 'honeymoon-fund' ? 'Honeymoon Fund' : 'New Home Fund'}
              </Typography>
              <Box sx={{ width: 48 }} />
            </Stack>
          </Container>
        </Box>

        {/* Main Content */}
        <Container 
          maxWidth={false}
          sx={{
            maxWidth: { xs: '100%', md: 600, lg: 700 },
            px: { xs: 2, md: 3 },
            flex: 1,
            py: 4,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%' }}
          >
            {!showPaymentForm ? (
              <Box
                sx={{
                  borderRadius: 1,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  color: '#000000',
                  p: 3,
                }}
              >
                <Stack spacing={3}>
                {error && (
                  <Alert severity="error" sx={{ borderRadius: '16px' }}>
                    {error}
                  </Alert>
                )}

                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 1,
                }}>
                  <Typography sx={{
                    fontFamily: 'Outfit',
                    fontSize: 14,
                    fontWeight: 400,
                    color: '#000',
                  }}>
                    Your Name *
                  </Typography>
                  <Box
                    component="input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.24)',
                      borderRadius: '8px',
                      padding: '12px 12px',
                      backgroundColor: 'white',
                      cursor: 'text',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      fontFamily: 'Outfit',
                      fontSize: 14,
                      color: '#000',
                      outline: 'none',
                      '&:hover': {
                        borderColor: 'rgba(0, 0, 0, 0.4)',
                      },
                      '&:focus': {
                        borderColor: '#000',
                        borderWidth: '2px',
                      },
                      '&::placeholder': {
                        color: 'rgba(0, 0, 0, 0.6)',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 1,
                }}>
                  <Typography sx={{
                    fontFamily: 'Outfit',
                    fontSize: 14,
                    fontWeight: 400,
                    color: '#000',
                  }}>
                    Contribution Amount *
                  </Typography>
                  <Box sx={{
                    border: '1px solid rgba(0, 0, 0, 0.24)',
                    borderRadius: '8px',
                    padding: '12px 12px',
                    backgroundColor: 'white',
                    cursor: 'text',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.4)',
                    },
                    '&:focus-within': {
                      borderColor: '#000',
                      borderWidth: '2px',
                    },
                  }}>
                    <Typography sx={{ color: '#000', fontFamily: 'Outfit', fontSize: 14, mr: 1 }}>$</Typography>
                    <Box
                      component="input"
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      required
                      sx={{
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        fontFamily: 'Outfit',
                        fontSize: 14,
                        color: '#000',
                        flex: 1,
                        '&::placeholder': {
                          color: 'rgba(0, 0, 0, 0.6)',
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 1,
                }}>
                  <Typography sx={{
                    fontFamily: 'Outfit',
                    fontSize: 14,
                    fontWeight: 400,
                    color: '#000',
                  }}>
                    Message (Optional)
                  </Typography>
                  <Box
                    component="textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share a message with us..."
                    rows={3}
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.24)',
                      borderRadius: '8px',
                      padding: '16px 12px',
                      backgroundColor: 'white',
                      cursor: 'text',
                      minHeight: '100px',
                      fontFamily: 'Outfit',
                      fontSize: 14,
                      color: '#000',
                      outline: 'none',
                      resize: 'vertical',
                      '&:hover': {
                        borderColor: 'rgba(0, 0, 0, 0.4)',
                      },
                      '&:focus': {
                        borderColor: '#000',
                        borderWidth: '2px',
                      },
                      '&::placeholder': {
                        color: 'rgba(0, 0, 0, 0.6)',
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
                    onClick={handleProceedToPayment}
                    disabled={loading}
                    sx={{
                      width: '100%',
                      backgroundColor: loading ? '#666' : '#141414',
                      color: '#fff',
                      borderRadius: '16px',
                      border: 'none',
                      py: 3,
                      px: 3,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'Outfit',
                      fontSize: 16,
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: loading ? '#666' : '#2a2a2a',
                      },
                    }}
                  >
                    {loading ? 'Processing...' : `Continue to Payment - $${amount || '0'}`}
                  </Box>
                </motion.div>

                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'Outfit',
                    fontSize: 12,
                    textAlign: 'center',
                    color: '#666',
                    mt: 2,
                  }}
                >
                  Secure payment powered by Stripe
                </Typography>
                </Stack>
              </Box>
            ) : (
              <Elements 
                stripe={stripePromise} 
                options={{
                  clientSecret,
                  appearance: {
                    // theme: 'minimal',
                    variables: {
                      fontFamily: 'Outfit, system-ui, sans-serif',
                      borderRadius: '8px',
                      spacingUnit: '4px',
                      gridRowSpacing: '8px',
                      gridColumnSpacing: '8px',
                    },
                    rules: {
                      '.Input': {
                        border: '1px solid rgba(0, 0, 0, 0.24)',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                      },
                      '.Input:hover': {
                        borderColor: 'rgba(0, 0, 0, 0.4)',
                      },
                      '.Input:focus': {
                        borderColor: '#000',
                        borderWidth: '2px',
                      },
                      '.Tab': {
                        border: '1px solid rgba(0, 0, 0, 0.24)',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                      },
                      '.Tab:hover': {
                        borderColor: 'rgba(0, 0, 0, 0.4)',
                      },
                      '.Tab--selected': {
                        borderColor: '#000',
                        backgroundColor: 'white',
                      },
                    },
                  },
                }}
              >
                <PaymentForm 
                  amount={amount}
                  donorName={name}
                  message={message}
                  fundType={fundType}
                  onBack={() => setShowPaymentForm(false)}
                />
              </Elements>
            )}
          </motion.div>
        </Container>
      </Box>
    </OptimizedBackground>
  );
}