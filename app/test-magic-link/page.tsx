'use client';

import { Button, Container, Typography, Box, TextField, Alert, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { sendMagicLink } from '@/lib/supabase/auth-service';

export default function TestMagicLinkPage() {
  const [email, setEmail] = useState('kv.s.ghumaan@gmail.com');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sendTestMagicLink = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      console.log('Sending real magic link to:', email);
      
      const result = await sendMagicLink(email);
      
      if (result.success) {
        setMessage(`✅ Magic link sent to ${email}! Check your email and click the link to test authentication.`);
        console.log('Magic link sent successfully');
      } else {
        setError(`❌ Failed to send magic link: ${result.error}`);
        console.error('Magic link failed:', result.error);
      }
    } catch (err) {
      setError(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Magic link error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🧪 Test Magic Link Authentication
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This sends a REAL magic link to test the authentication flow locally.
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Enter email to test with..."
          disabled={loading}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={sendTestMagicLink}
          disabled={loading || !email}
          size="large"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Sending Magic Link...' : 'Send Test Magic Link'}
        </Button>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          📋 Testing Instructions:
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li><strong>Enter your email</strong> (must be in your guests table)</li>
            <li><strong>Click "Send Test Magic Link"</strong></li>
            <li><strong>Check your email</strong> for the magic link</li>
            <li><strong>Click the magic link</strong> - it will redirect to this localhost app</li>
            <li><strong>Verify</strong> you're logged in (no Login button in header)</li>
          </ol>
        </Typography>
      </Box>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>⚠️ Note:</strong> For this to work locally, you need to add <code>http://localhost:3002/auth/callback</code> to your Supabase Redirect URLs in the dashboard.
        </Typography>
      </Box>
    </Container>
  );
} 