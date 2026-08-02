'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Box, CircularProgress, Typography } from '@mui/material';
import { COLORS } from '@/lib/theme/tokens';

const DEMO_EMAIL = 'demo@phera.io';
const DEMO_SLUG_KEY = 'demo-wedding-slug';
const DEMO_MODE_KEY = 'phera_demo_mode';

async function cloneAndRedirect(router: ReturnType<typeof useRouter>, setError: (e: string) => void) {
  const t0 = performance.now();
  // Check sessionStorage for an existing clone
  const existingSlug = sessionStorage.getItem(DEMO_SLUG_KEY);
  if (existingSlug) {
    // Verify it still exists
    const { data } = await supabase
      .from('weddings')
      .select('id')
      .eq('slug', existingSlug)
      .single();

    if (data) {
      console.log(`[demo-clone] reused existing slug (${Math.round(performance.now() - t0)}ms)`);
      router.replace(`/admin/${existingSlug}/details?tour=true`);
      return;
    }
    // Stale — remove and clone fresh
    sessionStorage.removeItem(DEMO_SLUG_KEY);
  }

  // Clone template
  const fetchStart = performance.now();
  const res = await fetch('/api/demo/clone', { method: 'POST' });
  console.log(`[demo-clone] /api/demo/clone fetch: ${Math.round(performance.now() - fetchStart)}ms`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('Clone error:', body);
    setError('Unable to load demo. Please try again.');
    return;
  }

  const { slug } = await res.json();
  sessionStorage.setItem(DEMO_SLUG_KEY, slug);
  console.log(`[demo-clone] total client wall: ${Math.round(performance.now() - t0)}ms`);
  router.replace(`/admin/${slug}/details?tour=true`);
}

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Guard against React strict-mode double-invocation in dev, which would
    // otherwise fire two concurrent clones per page load.
    if (startedRef.current) return;
    startedRef.current = true;

    const startDemo = async () => {
      // Always reset tour to step 1
      sessionStorage.removeItem('demo-tour-step');

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // User is already logged in — keep their session, no auth switch needed.
          // This avoids NavigatorLockAcquireTimeoutError from competing signOut/signIn calls.
          sessionStorage.setItem(DEMO_MODE_KEY, 'true');
          await cloneAndRedirect(router, setError);
          return;
        }

        // Not logged in — sign in as demo@phera.io (no lock contention since no existing session)
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

        sessionStorage.setItem(DEMO_MODE_KEY, 'true');
        await cloneAndRedirect(router, setError);
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
        // Mobile browsers' URL bar eats into 100vh; svh tracks the *visible* viewport.
        minHeight: { xs: '100svh', md: '100vh' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'white',
        gap: 3,
      }}
    >
      {error ? (
        <Typography sx={{ color: COLORS.brand.primary, fontSize: '1.1rem', fontWeight: 500 }}>
          {error}
        </Typography>
      ) : (
        <>
          <CircularProgress sx={{ color: COLORS.brand.primary }} />
          <Typography sx={{ color: COLORS.text.muted, fontSize: '1.1rem' }}>
            Loading demo...
          </Typography>
        </>
      )}
    </Box>
  );
}
