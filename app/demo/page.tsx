'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Box, CircularProgress, Typography } from '@mui/material';

const DEMO_EMAIL = 'demo@phera.io';
const PRE_DEMO_SESSION_KEY = 'phera_pre_demo_session';

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startDemo = async () => {
      // Always reset tour to step 1
      sessionStorage.removeItem('demo-tour-step');

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Already the demo user — just redirect
          if (session.user.email === DEMO_EMAIL) {
            router.replace('/admin/demo/overview?tour=true');
            return;
          }

          // Signed in as a different user — save their session so we can restore it later
          sessionStorage.setItem(PRE_DEMO_SESSION_KEY, JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }));

          // Sign out the current user before signing in as demo
          await supabase.auth.signOut();
        }

        // Sign in as demo user
        const demoPassword = process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD;
        if (!demoPassword) {
          setError('Demo is not configured. Please contact support.');
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: demoPassword,
        });

        if (signInError) {
          console.error('Demo sign-in error:', signInError);
          setError('Unable to load demo. Please try again.');
          return;
        }

        // Redirect to demo dashboard with tour
        router.replace('/admin/demo/overview?tour=true');
      } catch (err) {
        console.error('Demo error:', err);
        setError('Something went wrong. Please try again.');
      }
    };

    startDemo();
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'white',
        gap: 3,
      }}
    >
      {error ? (
        <Typography sx={{ color: '#DE3F5E', fontSize: '1.1rem', fontWeight: 500 }}>
          {error}
        </Typography>
      ) : (
        <>
          <CircularProgress sx={{ color: '#DE3F5E' }} />
          <Typography sx={{ color: '#4a4a4a', fontSize: '1.1rem' }}>
            Loading demo...
          </Typography>
        </>
      )}
    </Box>
  );
}
